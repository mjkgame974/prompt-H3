import { ProjectData } from "../types/minimax";

/**
 * LocalStorage persistence layer for MiniMax H3 projects.
 *
 * Strategy:
 *  - One project at a time, keyed by storage key with a version suffix.
 *  - Load is defensive: returns null on parse error, schema mismatch, or missing key.
 *  - Save is wrapped in try/catch so a quota/private-mode failure never crashes the app.
 *  - Last-saved timestamp is tracked in a separate key for cheap "saved X min ago" UI.
 */

const STORAGE_KEY = "minimax-h3-project-v2";
const TIMESTAMP_KEY = "minimax-h3-last-saved-v2";
/**
 * Bump this whenever the schema of the persisted project changes in a
 * backward-incompatible way (e.g. new required fields, removed fields,
 * semantic changes). The persisted envelope stores this version; on load
 * a mismatch causes the localStorage to be ignored, letting the user
 * start fresh with the new INITIAL_PROJECT_DATA.
 *
 * History:
 *  - 1: initial release
 *  - 2: empty default project (no more pre-filled perfume ad) + French prompt view
 */
const CURRENT_PERSISTENCE_VERSION = 2;

interface PersistedEnvelope {
  persistenceVersion: number;
  savedAt: string;
  project: ProjectData;
}

/**
 * Returns true if localStorage is available AND writable.
 * Returns false in private mode, disabled storage, or non-browser environments.
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__minimax_h3_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the persisted project from localStorage, or return null if
 * - no key exists
 * - the JSON is corrupted
 * - the envelope version doesn't match the current persistence version
 */
export function loadProjectFromLocalStorage(): ProjectData | null {
  if (!isLocalStorageAvailable()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let envelope: PersistedEnvelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    // Corrupted JSON — wipe it to avoid blocking the user on next save.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(TIMESTAMP_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }

  if (
    !envelope ||
    typeof envelope !== "object" ||
    envelope.persistenceVersion !== CURRENT_PERSISTENCE_VERSION ||
    !envelope.project ||
    typeof envelope.project !== "object"
  ) {
    return null;
  }

  return envelope.project;
}

/**
 * Persist the project to localStorage. Returns true on success, false on failure
 * (quota exceeded, private mode, etc.) — never throws.
 */
export function saveProjectToLocalStorage(project: ProjectData): boolean {
  if (!isLocalStorageAvailable()) return false;

  const envelope: PersistedEnvelope = {
    persistenceVersion: CURRENT_PERSISTENCE_VERSION,
    savedAt: new Date().toISOString(),
    project,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    window.localStorage.setItem(TIMESTAMP_KEY, envelope.savedAt);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove the persisted project from localStorage. Idempotent.
 */
export function clearProjectFromLocalStorage(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(TIMESTAMP_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Return the ISO timestamp of the last successful save, or null if none.
 */
export function getLastSavedAt(): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(TIMESTAMP_KEY);
  } catch {
    return null;
  }
}

/**
 * Human-readable "saved X ago" string. Returns null if no save timestamp.
 * Examples: "à l'instant", "il y a 2 min", "il y a 1 h", "il y a 3 j".
 */
export function formatLastSavedAgo(savedAtIso: string | null, now: Date = new Date()): string | null {
  if (!savedAtIso) return null;
  const savedAt = new Date(savedAtIso);
  if (isNaN(savedAt.getTime())) return null;

  const diffMs = now.getTime() - savedAt.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec} s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `il y a ${diffHour} h`;

  const diffDay = Math.floor(diffHour / 24);
  return `il y a ${diffDay} j`;
}

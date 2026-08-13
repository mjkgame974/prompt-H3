import { ProjectData } from "../types/minimax";

/**
 * LocalStorage persistence layer for MiniMax H3 — multi-project support.
 *
 * Strategy:
 *  - All projects are stored in a single envelope (ProjectsStore) under one key.
 *  - The envelope records the active project id, so reopening the app
 *    resumes the project the user was last editing.
 *  - Load is defensive: returns null on parse error, schema mismatch, or missing key.
 *  - Save is wrapped in try/catch so a quota/private-mode failure never crashes the app.
 *  - Last-saved timestamp is tracked in a separate key for cheap "saved X min ago" UI.
 */

const STORAGE_KEY = "minimax-h3-projects-v3";
const TIMESTAMP_KEY = "minimax-h3-last-saved-v3";

/**
 * Bump this whenever the schema of the persisted store changes in a
 * backward-incompatible way. The persisted envelope stores this version;
 * on load a mismatch causes the localStorage to be ignored, letting the
 * user start fresh.
 *
 * History:
 *  - 1: initial release (single project)
 *  - 2: empty default project + French prompt view (single project)
 *  - 3: multi-project history (this version)
 */
export const CURRENT_PERSISTENCE_VERSION = 3;

export interface StoredProject {
  id: string;
  title: string;
  lastModifiedAt: string;
  data: ProjectData;
}

export interface ProjectsStore {
  persistenceVersion: number;
  activeProjectId: string | null;
  projects: StoredProject[];
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
 * Load the persisted store from localStorage, or return null if
 * - no key exists
 * - the JSON is corrupted
 * - the envelope version doesn't match the current persistence version
 * - the envelope shape is invalid
 */
export function loadProjectsFromLocalStorage(): ProjectsStore | null {
  if (!isLocalStorageAvailable()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let store: ProjectsStore;
  try {
    store = JSON.parse(raw);
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
    !store ||
    typeof store !== "object" ||
    store.persistenceVersion !== CURRENT_PERSISTENCE_VERSION ||
    !Array.isArray(store.projects)
  ) {
    return null;
  }

  return store;
}

/**
 * Persist the entire store to localStorage. Returns true on success,
 * false on failure (quota exceeded, private mode, etc.) — never throws.
 */
export function saveProjectsToLocalStorage(store: ProjectsStore): boolean {
  if (!isLocalStorageAvailable()) return false;

  const now = new Date().toISOString();

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.localStorage.setItem(TIMESTAMP_KEY, now);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove ALL persisted projects from localStorage. Idempotent.
 */
export function clearProjectsFromLocalStorage(): void {
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
 * Pure helper: upsert a project into the store and mark it active.
 * Returns a new store (does not mutate).
 */
export function upsertProjectInStore(
  store: ProjectsStore,
  project: ProjectData,
  now: string = new Date().toISOString()
): ProjectsStore {
  const entry: StoredProject = {
    id: project.id,
    title: project.title || "Sans titre",
    lastModifiedAt: now,
    data: project,
  };
  const idx = store.projects.findIndex((p) => p.id === project.id);
  const projects =
    idx >= 0
      ? store.projects.map((p, i) => (i === idx ? entry : p))
      : [...store.projects, entry];

  return {
    ...store,
    activeProjectId: project.id,
    projects,
  };
}

/**
 * Pure helper: create an empty store for first-time users.
 */
export function createEmptyStore(): ProjectsStore {
  return {
    persistenceVersion: CURRENT_PERSISTENCE_VERSION,
    activeProjectId: null,
    projects: [],
  };
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

/**
 * Sort projects by lastModifiedAt, most recent first.
 * Returns a new array.
 */
export function sortProjectsByRecency(projects: StoredProject[]): StoredProject[] {
  return [...projects].sort(
    (a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime()
  );
}

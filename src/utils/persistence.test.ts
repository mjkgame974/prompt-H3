import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isLocalStorageAvailable,
  loadProjectsFromLocalStorage,
  saveProjectsToLocalStorage,
  clearProjectsFromLocalStorage,
  getLastSavedAt,
  formatLastSavedAgo,
  upsertProjectInStore,
  createEmptyStore,
  sortProjectsByRecency,
  CURRENT_PERSISTENCE_VERSION,
  ProjectsStore,
} from "./persistence";
import { validPerfumeProject, emptyProject } from "./__fixtures__/projectFixture";

const STORAGE_KEY = "minimax-h3-projects-v3";
const TIMESTAMP_KEY = "minimax-h3-last-saved-v3";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isLocalStorageAvailable", () => {
  it("returns true when localStorage works", () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("returns false when localStorage.setItem throws (e.g. quota / private mode)", () => {
    const setItemSpy = vi
      .spyOn(globalThis.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
    expect(isLocalStorageAvailable()).toBe(false);
    expect(setItemSpy).toHaveBeenCalled();
  });
});

describe("loadProjectsFromLocalStorage", () => {
  it("returns null when no key is present", () => {
    expect(loadProjectsFromLocalStorage()).toBeNull();
  });

  it("returns the persisted store after a save", () => {
    const store: ProjectsStore = createEmptyStore();
    const withProject = upsertProjectInStore(store, validPerfumeProject);
    saveProjectsToLocalStorage(withProject);
    const loaded = loadProjectsFromLocalStorage();
    expect(loaded).toEqual(withProject);
  });

  it("returns null and wipes storage on corrupted JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{ not valid json");
    expect(loadProjectsFromLocalStorage()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null when the envelope version doesn't match", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        persistenceVersion: 999,
        activeProjectId: null,
        projects: [],
      })
    );
    expect(loadProjectsFromLocalStorage()).toBeNull();
  });

  it("returns null when the projects array is missing", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ persistenceVersion: CURRENT_PERSISTENCE_VERSION, activeProjectId: null })
    );
    expect(loadProjectsFromLocalStorage()).toBeNull();
  });
});

describe("saveProjectsToLocalStorage", () => {
  it("returns true and persists the store + timestamp", () => {
    const ok = saveProjectsToLocalStorage(createEmptyStore());
    expect(ok).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(TIMESTAMP_KEY)).not.toBeNull();
  });

  it("returns false (no throw) when localStorage.setItem fails", () => {
    vi.spyOn(globalThis.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => saveProjectsToLocalStorage(createEmptyStore())).not.toThrow();
    expect(saveProjectsToLocalStorage(createEmptyStore())).toBe(false);
  });
});

describe("clearProjectsFromLocalStorage", () => {
  it("removes both the store and the timestamp keys", () => {
    saveProjectsToLocalStorage(createEmptyStore());
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearProjectsFromLocalStorage();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(TIMESTAMP_KEY)).toBeNull();
  });

  it("is a safe no-op when called on empty storage", () => {
    expect(() => clearProjectsFromLocalStorage()).not.toThrow();
  });
});

describe("getLastSavedAt", () => {
  it("returns null when nothing has been saved", () => {
    expect(getLastSavedAt()).toBeNull();
  });

  it("returns the ISO timestamp of the last save", () => {
    saveProjectsToLocalStorage(createEmptyStore());
    const ts = getLastSavedAt();
    expect(ts).not.toBeNull();
    expect(new Date(ts!).toString()).not.toBe("Invalid Date");
  });
});

describe("upsertProjectInStore", () => {
  it("adds a new project and marks it active", () => {
    const store = createEmptyStore();
    const next = upsertProjectInStore(store, validPerfumeProject);
    expect(next.projects).toHaveLength(1);
    expect(next.projects[0].id).toBe(validPerfumeProject.id);
    expect(next.projects[0].title).toBe(validPerfumeProject.title);
    expect(next.activeProjectId).toBe(validPerfumeProject.id);
  });

  it("updates an existing project without changing its position in the list", () => {
    const store = createEmptyStore();
    const with1 = upsertProjectInStore(store, validPerfumeProject, "2026-08-13T10:00:00.000Z");
    const with2 = upsertProjectInStore(with1, { ...validPerfumeProject, title: "Updated Title" }, "2026-08-13T11:00:00.000Z");
    expect(with2.projects).toHaveLength(1);
    expect(with2.projects[0].title).toBe("Updated Title");
    expect(with2.projects[0].lastModifiedAt).toBe("2026-08-13T11:00:00.000Z");
  });

  it("preserves the activeProjectId when upserting a different project", () => {
    const store = createEmptyStore();
    const project2Id = "proj_other";
    const project2 = { ...emptyProject, id: project2Id, title: "Second" };
    const with1 = upsertProjectInStore(store, validPerfumeProject);
    const with2 = upsertProjectInStore(with1, project2);
    expect(with2.projects).toHaveLength(2);
    expect(with2.activeProjectId).toBe(project2Id);
  });

  it("does not mutate the input store", () => {
    const store = createEmptyStore();
    const snapshot = JSON.stringify(store);
    upsertProjectInStore(store, validPerfumeProject);
    expect(JSON.stringify(store)).toBe(snapshot);
  });
});

describe("createEmptyStore", () => {
  it("returns a store with the current persistence version and no projects", () => {
    const store = createEmptyStore();
    expect(store.persistenceVersion).toBe(CURRENT_PERSISTENCE_VERSION);
    expect(store.activeProjectId).toBeNull();
    expect(store.projects).toEqual([]);
  });
});

describe("sortProjectsByRecency", () => {
  it("returns projects sorted by lastModifiedAt desc", () => {
    const a = { id: "a", title: "A", lastModifiedAt: "2026-08-13T10:00:00.000Z", data: emptyProject };
    const b = { id: "b", title: "B", lastModifiedAt: "2026-08-13T12:00:00.000Z", data: emptyProject };
    const c = { id: "c", title: "C", lastModifiedAt: "2026-08-13T11:00:00.000Z", data: emptyProject };
    const sorted = sortProjectsByRecency([a, b, c]);
    expect(sorted.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const a = { id: "a", title: "A", lastModifiedAt: "2026-08-13T10:00:00.000Z", data: emptyProject };
    const b = { id: "b", title: "B", lastModifiedAt: "2026-08-13T12:00:00.000Z", data: emptyProject };
    const input = [a, b];
    const snapshot = [...input];
    sortProjectsByRecency(input);
    expect(input).toEqual(snapshot);
  });
});

describe("formatLastSavedAgo", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("returns null when no timestamp is provided", () => {
    expect(formatLastSavedAgo(null, now)).toBeNull();
  });

  it("returns null when the timestamp is invalid", () => {
    expect(formatLastSavedAgo("not-a-date", now)).toBeNull();
  });

  it("returns 'à l'instant' for a timestamp less than 10s old", () => {
    const ts = new Date(now.getTime() - 5_000).toISOString();
    expect(formatLastSavedAgo(ts, now)).toBe("à l'instant");
  });

  it("returns 'il y a X s' for a timestamp < 60s old", () => {
    const ts = new Date(now.getTime() - 30_000).toISOString();
    expect(formatLastSavedAgo(ts, now)).toBe("il y a 30 s");
  });

  it("returns 'il y a X min' for a timestamp < 60min old", () => {
    const ts = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(formatLastSavedAgo(ts, now)).toBe("il y a 5 min");
  });

  it("returns 'il y a X h' for a timestamp < 24h old", () => {
    const ts = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(formatLastSavedAgo(ts, now)).toBe("il y a 3 h");
  });

  it("returns 'il y a X j' for a timestamp >= 24h old", () => {
    const ts = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    expect(formatLastSavedAgo(ts, now)).toBe("il y a 2 j");
  });
});

describe("roundtrip", () => {
  it("save → load returns the exact same store object", () => {
    const store = createEmptyStore();
    const withProject = upsertProjectInStore(store, validPerfumeProject);
    saveProjectsToLocalStorage(withProject);
    const loaded = loadProjectsFromLocalStorage();
    expect(loaded).toEqual(withProject);
  });

  it("clearing then loading returns null", () => {
    const store = upsertProjectInStore(createEmptyStore(), validPerfumeProject);
    saveProjectsToLocalStorage(store);
    clearProjectsFromLocalStorage();
    expect(loadProjectsFromLocalStorage()).toBeNull();
  });
});

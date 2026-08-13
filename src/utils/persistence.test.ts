import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isLocalStorageAvailable,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  clearProjectFromLocalStorage,
  getLastSavedAt,
  formatLastSavedAgo,
} from "./persistence";
import { validPerfumeProject } from "./__fixtures__/projectFixture";

const STORAGE_KEY = "minimax-h3-project-v2";
const TIMESTAMP_KEY = "minimax-h3-last-saved-v2";

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
    // Spy on the polyfilled localStorage directly — Storage.prototype may not
    // exist in all jsdom configurations.
    const setItemSpy = vi
      .spyOn(globalThis.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
    expect(isLocalStorageAvailable()).toBe(false);
    expect(setItemSpy).toHaveBeenCalled();
  });
});

describe("loadProjectFromLocalStorage", () => {
  it("returns null when no key is present", () => {
    expect(loadProjectFromLocalStorage()).toBeNull();
  });

  it("returns the persisted project after a save", () => {
    saveProjectToLocalStorage(validPerfumeProject);
    const loaded = loadProjectFromLocalStorage();
    expect(loaded).toEqual(validPerfumeProject);
  });

  it("returns null and wipes storage on a corrupted JSON value", () => {
    window.localStorage.setItem(STORAGE_KEY, "{ not valid json");
    expect(loadProjectFromLocalStorage()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null when the envelope version doesn't match", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        persistenceVersion: 999,
        savedAt: new Date().toISOString(),
        project: validPerfumeProject,
      })
    );
    expect(loadProjectFromLocalStorage()).toBeNull();
  });

  it("returns null when the envelope is missing the project field", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        persistenceVersion: 1,
        savedAt: new Date().toISOString(),
      })
    );
    expect(loadProjectFromLocalStorage()).toBeNull();
  });
});

describe("saveProjectToLocalStorage", () => {
  it("returns true and persists the project + timestamp", () => {
    const ok = saveProjectToLocalStorage(validPerfumeProject);
    expect(ok).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(TIMESTAMP_KEY)).not.toBeNull();
  });

  it("returns false (no throw) when localStorage.setItem fails", () => {
    vi.spyOn(globalThis.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => saveProjectToLocalStorage(validPerfumeProject)).not.toThrow();
    expect(saveProjectToLocalStorage(validPerfumeProject)).toBe(false);
  });
});

describe("clearProjectFromLocalStorage", () => {
  it("removes both the project and the timestamp keys", () => {
    saveProjectToLocalStorage(validPerfumeProject);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearProjectFromLocalStorage();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(TIMESTAMP_KEY)).toBeNull();
  });

  it("is a safe no-op when called on empty storage", () => {
    expect(() => clearProjectFromLocalStorage()).not.toThrow();
  });
});

describe("getLastSavedAt", () => {
  it("returns null when nothing has been saved", () => {
    expect(getLastSavedAt()).toBeNull();
  });

  it("returns the ISO timestamp of the last save", () => {
    saveProjectToLocalStorage(validPerfumeProject);
    const ts = getLastSavedAt();
    expect(ts).not.toBeNull();
    expect(new Date(ts!).toString()).not.toBe("Invalid Date");
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
  it("save → load returns the exact same project object", () => {
    saveProjectToLocalStorage(validPerfumeProject);
    const loaded = loadProjectFromLocalStorage();
    expect(loaded).toEqual(validPerfumeProject);
    expect(loaded?.id).toBe(validPerfumeProject.id);
    expect(loaded?.shots.length).toBe(validPerfumeProject.shots.length);
  });

  it("clearing then loading returns null", () => {
    saveProjectToLocalStorage(validPerfumeProject);
    clearProjectFromLocalStorage();
    expect(loadProjectFromLocalStorage()).toBeNull();
  });
});

/**
 * Vitest setup file: polyfill window.localStorage with an in-memory Map
 * when the environment (jsdom in some configurations) doesn't expose one.
 * This keeps our persistence tests deterministic and isolated.
 */

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      const keys = Array.from(store.keys());
      return index >= 0 && index < keys.length ? (keys[index] as string) : null;
    },
    get length(): number {
      return store.size;
    },
  };
  // Attach to both the global and `window` so persistence code that does
  // `window.localStorage.foo` finds it.
  (globalThis as any).localStorage = localStorageMock;
  if (typeof window !== "undefined") {
    (window as any).localStorage = localStorageMock;
  }
}

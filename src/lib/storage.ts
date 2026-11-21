/**
 * Persistence adapter. Komponen tidak boleh menyentuh localStorage langsung.
 * Bila storage diblokir (private mode), demo tetap berjalan in-memory.
 */

export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
  available: boolean;
}

function probe(): boolean {
  try {
    const key = "__campusespace_probe__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createLocalStorageAdapter(): StorageAdapter {
  const available = typeof window !== "undefined" && probe();
  return {
    available,
    read(key) {
      if (!available) return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      if (!available) return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Quota penuh — abaikan, state React tetap sumber kebenaran.
      }
    },
    remove(key) {
      if (!available) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // noop
      }
    },
  };
}

/** Adapter in-memory untuk test. */
export function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter {
  const map = new Map(Object.entries(initial));
  return {
    available: true,
    read: (key) => map.get(key) ?? null,
    write: (key, value) => void map.set(key, value),
    remove: (key) => void map.delete(key),
  };
}

export const STORAGE_KEY = "campusespace.demo.v1";
import { del, get, set } from 'idb-keyval';

export type StorageBackend = 'indexeddb' | 'localstorage' | 'memory';

/**
 * The store persists one JSON string. The adapter chooses IndexedDB or
 * localStorage once per session and never writes the same record to both.
 */
export interface AsyncStringStorage {
  getItem(name: string): Promise<string | null>;
  setItem(name: string, value: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

const PROBE_KEY = 'foundation.storage-probe';
const PROBE_VALUE = 'indexeddb-available';
const memory = new Map<string, string>();

let backendPromise: Promise<StorageBackend> | null = null;
let writesBlocked = false;
let lastReadRaw: string | null = null;

/**
 * A corrupt record must not be overwritten by a blank session. Recovery mode
 * pauses writes until the reader downloads the raw record or deliberately
 * starts again.
 */
export function setStorageWritesBlocked(blocked: boolean): void {
  writesBlocked = blocked;
}

export function getStorageWritesBlocked(): boolean {
  return writesBlocked;
}

/**
 * createJSONStorage parses before Zustand sees the value. If parsing fails,
 * this raw string is the only recoverable copy of the old record.
 */
export function getLastRawStorageValue(): string | null {
  return lastReadRaw;
}

export function getStorageBackend(): Promise<StorageBackend> {
  backendPromise ??= detectBackend();
  return backendPromise;
}

async function detectBackend(): Promise<StorageBackend> {
  if (typeof window === 'undefined') {
    return 'memory';
  }

  if (typeof indexedDB !== 'undefined') {
    try {
      await set(PROBE_KEY, PROBE_VALUE);
      const value = await get<string>(PROBE_KEY);
      await del(PROBE_KEY);
      if (value === PROBE_VALUE) {
        return 'indexeddb';
      }
    } catch {
      // A blocked or unavailable IndexedDB is allowed to fall through.
    }
  }

  try {
    const probe = '__foundation_storage_probe__';
    window.localStorage.setItem(probe, PROBE_VALUE);
    const value = window.localStorage.getItem(probe);
    window.localStorage.removeItem(probe);
    if (value === PROBE_VALUE) {
      return 'localstorage';
    }
  } catch {
    // Private mode can block localStorage as well.
  }

  return 'memory';
}

export const stateStorage: AsyncStringStorage = {
  async getItem(name) {
    const backend = await getStorageBackend();
    let value: string | null = null;

    if (backend === 'indexeddb') {
      value = (await get<string>(name)) ?? null;
    } else if (backend === 'localstorage') {
      value = window.localStorage.getItem(name);
    } else {
      value = memory.get(name) ?? null;
    }

    lastReadRaw = value;
    return value;
  },

  async setItem(name, value) {
    if (writesBlocked) {
      return;
    }

    const backend = await getStorageBackend();
    if (backend === 'indexeddb') {
      await set(name, value);
      return;
    }
    if (backend === 'localstorage') {
      window.localStorage.setItem(name, value);
      return;
    }
    memory.set(name, value);
  },

  async removeItem(name) {
    const backend = await getStorageBackend();
    if (backend === 'indexeddb') {
      await del(name);
      return;
    }
    if (backend === 'localstorage') {
      window.localStorage.removeItem(name);
      return;
    }
    memory.delete(name);
  },
};

import { levels } from './levels';

const KEY = 'mirror.campaign-progress.v1';
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Snapshot = { completed: string[]; recovered: boolean };

export function createCampaignProgress(storage: StorageLike) {
  let fallback: Snapshot | undefined;

  function load(): Snapshot {
    if (fallback) return { ...fallback, completed: [...fallback.completed] };
    try {
      const raw = storage.getItem(KEY);
      if (raw === null) return { completed: [], recovered: false };
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { completed: [], recovered: true };
      const value = parsed as { version?: unknown; completed?: unknown };
      if (value.version !== 1 || !Array.isArray(value.completed)
        || !value.completed.every(id => typeof id === 'string' && levels.some(level => level.id === id))) {
        return { completed: [], recovered: true };
      }
      return { completed: [...new Set(value.completed as string[])], recovered: false };
    } catch {
      return { completed: [], recovered: true };
    }
  }

  function isCompleted(id: string): boolean { return load().completed.includes(id); }

  function isUnlocked(id: string): boolean {
    const index = levels.findIndex(level => level.id === id);
    if (index < 0) return false;
    return index === 0 || isCompleted(id) || isCompleted(levels[index - 1].id);
  }

  function complete(id: string): void {
    if (!isUnlocked(id) || isCompleted(id)) return;
    const completed = [...load().completed, id];
    const snapshot = { completed, recovered: false };
    try {
      storage.setItem(KEY, JSON.stringify({ version: 1, completed }));
    } catch {
      fallback = snapshot;
    }
  }

  return { load, complete, isUnlocked, isCompleted };
}

const memory = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
  removeItem: key => { memory.delete(key); },
};

export const CampaignProgress = createCampaignProgress(
  typeof globalThis.localStorage === 'undefined' ? memoryStorage : globalThis.localStorage,
);

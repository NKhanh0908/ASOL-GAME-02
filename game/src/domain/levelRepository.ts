import { levels } from './levels';
import type { CustomLevelRecord, Level, PieceDefinition, Placement } from './types';

const STORAGE_KEY = 'mirror.custom-levels.v1';

let memoryStorage: Record<string, string> = {};

function getStorage(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
} {
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      memoryStorage = {};
    },
  };
}

function isValidPiece(p: unknown): p is PieceDefinition {
  if (!p || typeof p !== 'object') return false;
  const piece = p as PieceDefinition;
  return (
    typeof piece.id === 'string' &&
    piece.id.length > 0 &&
    typeof piece.color === 'number' &&
    Array.isArray(piece.cells) &&
    piece.cells.length > 0 &&
    Array.isArray(piece.anchors)
  );
}

function isValidPlacement(pl: unknown): pl is Placement {
  if (!pl || typeof pl !== 'object') return false;
  const placement = pl as Placement;
  return (
    typeof placement.pieceId === 'string' &&
    placement.pieceId.length > 0 &&
    typeof placement.x === 'number' &&
    typeof placement.y === 'number'
  );
}

function isValidCustomRecord(record: unknown): record is CustomLevelRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as CustomLevelRecord;
  return (
    typeof r.id === 'string' &&
    r.id.length > 0 &&
    typeof r.title === 'string' &&
    r.title.trim().length > 0 &&
    typeof r.sourceLevelId === 'string' &&
    r.sourceLevelId.length > 0 &&
    r.custom === true &&
    typeof r.createdAt === 'number' &&
    typeof r.updatedAt === 'number' &&
    Array.isArray(r.pieces) &&
    r.pieces.length > 0 &&
    r.pieces.every(isValidPiece) &&
    Array.isArray(r.solution) &&
    r.solution.length > 0 &&
    r.solution.every(isValidPlacement)
  );
}

function loadCustomRecords(): CustomLevelRecord[] {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCustomRecord);
  } catch {
    return [];
  }
}

function saveCustomRecords(records: CustomLevelRecord[]): void {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save custom levels to storage', err);
  }
}

export const LevelRepository = {
  list(): Level[] {
    const custom = loadCustomRecords();
    return [...levels, ...custom];
  },

  get(id: string): Level | undefined {
    const builtIn = levels.find((l) => l.id === id);
    if (builtIn) return builtIn;
    const custom = loadCustomRecords();
    return custom.find((l) => l.id === id);
  },

  save(record: CustomLevelRecord): void {
    if (!isValidCustomRecord(record)) {
      throw new Error('Invalid custom level record');
    }
    const current = loadCustomRecords();
    const index = current.findIndex((l) => l.id === record.id);
    if (index >= 0) {
      current[index] = record;
    } else {
      current.push(record);
    }
    saveCustomRecords(current);
  },

  remove(id: string): void {
    const current = loadCustomRecords();
    const filtered = current.filter((l) => l.id !== id);
    if (filtered.length !== current.length) {
      saveCustomRecords(filtered);
    }
  },

  clearForTests(): void {
    getStorage().removeItem(STORAGE_KEY);
    memoryStorage = {};
  },
};

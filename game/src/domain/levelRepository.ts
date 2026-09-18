import { levels } from './levels';
import type { CustomLevelRecord, Level, PieceDefinition, Placement } from './types';

const STORAGE_KEY = 'mirror.custom-levels.v1';
const STORAGE_VERSION = 1;

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
    (r.kind === 'new' || r.kind === 'override') &&
    r.target instanceof Uint8Array &&
    (r.kind !== 'override' || (typeof r.sourceLevelId === 'string' && r.sourceLevelId.length > 0)) &&
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

function decodeRecord(record: unknown): CustomLevelRecord | undefined {
  if (!record || typeof record !== 'object') return undefined;
  const value = record as Record<string, unknown>;
  const target = Array.isArray(value.target) && value.target.every((cell) => Number.isInteger(cell) && Number(cell) >= 0 && Number(cell) <= 255)
    ? new Uint8Array(value.target as number[])
    : value.target instanceof Uint8Array ? value.target : undefined;
  if (!target) return undefined;
  const decoded = { ...value, target };
  return isValidCustomRecord(decoded) ? decoded : undefined;
}

function loadCustomRecords(): CustomLevelRecord[] {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    const envelope = parsed as { version?: unknown; records?: unknown };
    if (envelope.version !== STORAGE_VERSION || !Array.isArray(envelope.records)) return [];
    return envelope.records.map(decodeRecord).filter((record): record is CustomLevelRecord => Boolean(record));
  } catch {
    return [];
  }
}

function saveCustomRecords(records: CustomLevelRecord[]): void {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      records: records.map((record) => ({ ...record, target: Array.from(record.target ?? []) })),
    }));
  } catch (err) {
    console.error('Failed to save custom levels to storage', err);
  }
}

export const LevelRepository = {
  list(): Level[] {
    const custom = loadCustomRecords();
    const overrides = new Map(custom.filter((record) => record.kind === 'override').map((record) => [record.id, record]));
    const builtIns = levels.map((level) => overrides.get(level.id) ?? level);
    return [...builtIns, ...custom.filter((record) => record.kind === 'new')];
  },

  get(id: string): Level | undefined {
    const custom = loadCustomRecords();
    return custom.find((record) => record.id === id && record.kind === 'override')
      ?? levels.find((level) => level.id === id)
      ?? custom.find((record) => record.id === id && record.kind === 'new');
  },

  saveOverride(id: string, record: CustomLevelRecord): void {
    if (record.id !== id || record.kind !== 'override' || !isValidCustomRecord(record)) {
      throw new Error('Invalid custom level record');
    }
    const current = loadCustomRecords();
    const index = current.findIndex((level) => level.id === id);
    if (index >= 0) {
      current[index] = record;
    } else {
      current.push(record);
    }
    saveCustomRecords(current);
  },

  create(record: CustomLevelRecord): void {
    if (record.kind !== 'new' || !isValidCustomRecord(record) || levels.some((level) => level.id === record.id)) {
      throw new Error('Invalid custom level record');
    }
    const current = loadCustomRecords().filter((level) => level.id !== record.id);
    saveCustomRecords([...current, record]);
  },

  restoreBuiltIn(id: string): void {
    saveCustomRecords(loadCustomRecords().filter((record) => !(record.id === id && record.kind === 'override')));
  },

  removeNew(id: string): void {
    const current = loadCustomRecords();
    const filtered = current.filter((record) => !(record.id === id && record.kind === 'new'));
    if (filtered.length !== current.length) {
      saveCustomRecords(filtered);
    }
  },

  /** @deprecated use saveOverride/create according to record.kind. */
  save(record: CustomLevelRecord): void {
    if (record.kind === 'override') this.saveOverride(record.id, record);
    else this.create(record);
  },

  /** @deprecated use restoreBuiltIn/removeNew according to record.kind. */
  remove(id: string): void {
    this.restoreBuiltIn(id);
    this.removeNew(id);
  },

  clearForTests(): void {
    getStorage().removeItem(STORAGE_KEY);
    memoryStorage = {};
  },
};

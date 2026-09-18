import { describe, expect, it } from 'vitest';
import { GRID_WIDTH, type PieceDefinition } from '../domain/types';
import {
  createPiece,
  draftToRecord,
  validateDraft,
  type CustomLevelDraft,
  type ShapeKind,
} from './customLevelEditor';

describe('customLevelEditor helpers', () => {
  const piece = createPiece('square', 'p1');
  const draft = (changes: Partial<CustomLevelDraft> = {}): CustomLevelDraft => ({
    title: '  My Level  ',
    pieces: [piece],
    solution: [{ pieceId: 'p1', x: 10, y: 10 }],
    ...changes,
  });

  it('creates pieces of all 4 supported shape kinds with fixed sizes', () => {
    const kinds: ShapeKind[] = ['square', 'triangle', 'smallTriangle', 'diamond'];
    for (const kind of kinds) {
      const created = createPiece(kind, `test-${kind}`);
      expect(created.id).toBe(`test-${kind}`);
      expect(created.cells.length).toBeGreaterThan(0);
      expect(created.anchors).toEqual([]);
      const maxX = Math.max(...created.cells.map(([x]) => x)) + 1;
      expect(maxX).toBe(kind === 'smallTriangle' ? 24 : 48);
    }
  });

  it('generates the target from the current XOR arrangement', () => {
    const result = validateDraft(draft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.target[10 * GRID_WIDTH + 10]).toBeTruthy();
    expect(result.target[9 * GRID_WIDTH + 10]).toBe(0);
    expect(result.target[57 * GRID_WIDTH + 57]).toBeTruthy();
    expect(result.target[58 * GRID_WIDTH + 58]).toBe(0);
  });

  it('rejects empty title, missing pieces, and duplicate piece ids', () => {
    expect(validateDraft(draft({ title: '  ' })).ok).toBe(false);
    expect(validateDraft(draft({ pieces: [], solution: [] })).ok).toBe(false);
    expect(validateDraft(draft({ pieces: [piece, piece], solution: [
      { pieceId: 'p1', x: 10, y: 10 }, { pieceId: 'p1', x: 20, y: 20 },
    ] })).ok).toBe(false);
  });

  it('rejects missing, repeated, and out of bounds placements', () => {
    const p2: PieceDefinition = createPiece('square', 'p2');
    expect(validateDraft(draft({ pieces: [piece, p2] })).ok).toBe(false);
    expect(validateDraft(draft({ pieces: [piece, p2], solution: [
      { pieceId: 'p1', x: 10, y: 10 }, { pieceId: 'p1', x: 20, y: 20 },
    ] })).ok).toBe(false);
    expect(validateDraft(draft({ solution: [{ pieceId: 'p1', x: 120, y: 180 }] })).ok).toBe(false);
    expect(validateDraft(draft({ solution: [{ pieceId: 'p1', x: 10.5, y: 10 }] })).ok).toBe(false);
  });

  it('rejects an empty XOR target', () => {
    const p2 = createPiece('square', 'p2');
    expect(validateDraft(draft({ pieces: [piece, p2], solution: [
      { pieceId: 'p1', x: 10, y: 10 }, { pieceId: 'p2', x: 10, y: 10 },
    ] })).ok).toBe(false);
  });

  it('creates a new record with generated target and solution anchors', () => {
    const record = draftToRecord(draft());
    expect(record.kind).toBe('new');
    expect(record.id).toMatch(/^custom-/);
    expect(record.sourceLevelId).toBeUndefined();
    expect(record.title).toBe('My Level');
    expect(record.target?.[10 * GRID_WIDTH + 10]).toBeTruthy();
    expect(record.pieces[0].anchors).toEqual([[10, 10]]);
  });

  it('keeps the id and creation time when editing a built-in override', () => {
    const record = draftToRecord(draft({ id: '1-1', kind: 'override', sourceLevelId: '1-1', createdAt: 12345 }));
    expect(record.kind).toBe('override');
    expect(record.id).toBe('1-1');
    expect(record.sourceLevelId).toBe('1-1');
    expect(record.createdAt).toBe(12345);
  });

  it('keeps a new custom level id and kind when editing it', () => {
    const record = draftToRecord(draft({ id: 'custom-existing', kind: 'new', createdAt: 23456 }));
    expect(record.id).toBe('custom-existing');
    expect(record.kind).toBe('new');
    expect(record.createdAt).toBe(23456);
  });
});

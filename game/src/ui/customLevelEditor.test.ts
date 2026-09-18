import { describe, it, expect } from 'vitest';
import { evaluate } from '../domain/mask';
import { levels } from '../domain/levels';
import {
  createPiece,
  validateDraft,
  draftToRecord,
  type CustomLevelDraft,
  type ShapeKind,
} from './customLevelEditor';

describe('customLevelEditor helpers', () => {
  const baseLevel = levels[0];
  const targetMask = evaluate(baseLevel, baseLevel.solution);

  it('creates pieces of all 4 supported shape kinds with fixed sizes', () => {
    const kinds: ShapeKind[] = ['square', 'triangle', 'smallTriangle', 'diamond'];
    for (const kind of kinds) {
      const piece = createPiece(kind, `test-${kind}`);
      expect(piece.id).toBe(`test-${kind}`);
      expect(piece.cells.length).toBeGreaterThan(0);
      expect(piece.anchors).toEqual([]);
      if (kind === 'smallTriangle') {
        const maxX = Math.max(...piece.cells.map(([x]) => x)) + 1;
        expect(maxX).toBe(24);
      } else {
        const maxX = Math.max(...piece.cells.map(([x]) => x)) + 1;
        expect(maxX).toBe(48);
      }
    }
  });

  it('rejects drafts with empty title', () => {
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: '   ',
      pieces: baseLevel.pieces,
      solution: baseLevel.solution,
    };
    const result = validateDraft(draft, targetMask);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason.toLowerCase()).toContain('tiêu đề');
    }
  });


  it('rejects drafts with no pieces', () => {
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: 'Valid Title',
      pieces: [],
      solution: [],
    };
    const result = validateDraft(draft, targetMask);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('ít nhất một mảnh');
    }
  });

  it('rejects drafts with out of bounds placement', () => {
    const p1 = createPiece('square', 'p1');
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: 'Out of bounds',
      pieces: [p1],
      solution: [{ pieceId: 'p1', x: 120, y: 180 }], // square 48x48 placed at (120, 180) goes to (168, 228) which exceeds 128x192
    };
    const result = validateDraft(draft, targetMask);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('ngoài bàn');
    }
  });

  it('rejects drafts when XOR composite does not match target mask', () => {
    const p1 = createPiece('square', 'p1');
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: 'Mismatch',
      pieces: [p1],
      solution: [{ pieceId: 'p1', x: 10, y: 10 }],
    };
    const result = validateDraft(draft, targetMask);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('chưa khớp');
    }
  });

  it('validates a draft that perfectly matches the target mask', () => {
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: 'Level 1 Perfect Clone',
      pieces: baseLevel.pieces,
      solution: baseLevel.solution,
    };
    const result = validateDraft(draft, targetMask);
    expect(result.ok).toBe(true);
  });

  it('converts draft to custom level record with anchors assigned', () => {
    const draft: CustomLevelDraft = {
      sourceLevelId: baseLevel.id,
      title: 'My Saved Level',
      pieces: baseLevel.pieces,
      solution: baseLevel.solution,
    };
    const record = draftToRecord(draft, 'custom-fixed-id', 12345);
    expect(record.id).toBe('custom-fixed-id');
    expect(record.custom).toBe(true);
    expect(record.createdAt).toBe(12345);
    expect(record.title).toBe('My Saved Level');
    expect(record.pieces[0].anchors.length).toBeGreaterThan(0);
    expect(record.pieces[0].anchors[0]).toEqual([record.solution[0].x, record.solution[0].y]);
  });
});

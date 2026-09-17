import { describe, expect, it } from 'vitest';
import { clearMaskCells, overlapPreviewCells, overlappingCells } from './draw';

describe('drag overlap preview', () => {
  it('identifies cells hidden by the piece underneath at live positions', () => {
    expect(overlappingCells([[0, 0], [1, 0], [0, 1]], 4, 6, [[0, 0], [1, 0]], 4, 6))
      .toEqual(new Set(['0,0', '1,0']));
  });

  it('does not mark cells when pieces are adjacent', () => {
    expect(overlappingCells([[0, 0]], 4, 6, [[0, 0]], 5, 6)).toEqual(new Set());
  });

  it('marks partial cell intersections before grid alignment', () => {
    expect(overlappingCells([[0, 0]], 4.25, 6, [[0, 0]], 4, 6)).toEqual(new Set(['0,0']));
  });

  it('returns transparent cells for both pieces in the intersection', () => {
    expect(overlapPreviewCells([[0, 0]], 4, 6, [[0, 0]], 4.25, 6)).toEqual({
      dragged: new Set(['0,0']),
      underneath: new Set(['0,0']),
    });
  });

  it('clears the placed composite cells under a dragged overlap', () => {
    const mask = new Uint8Array([1, 1, 1]);
    expect(clearMaskCells(mask, new Set(['0,0']), 1, 0, 3)).toEqual(new Uint8Array([1, 0, 1]));
  });
});

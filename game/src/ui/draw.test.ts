import { describe, expect, it } from 'vitest';
import { overlappingCells } from './draw';

describe('drag overlap preview', () => {
  it('identifies cells hidden by the piece underneath at live positions', () => {
    expect(overlappingCells([[0, 0], [1, 0], [0, 1]], 4, 6, [[0, 0], [1, 0]], 4, 6))
      .toEqual(new Set(['0,0', '1,0']));
  });

  it('does not mark cells when pieces are adjacent', () => {
    expect(overlappingCells([[0, 0]], 4, 6, [[0, 0]], 5, 6)).toEqual(new Set());
  });
});

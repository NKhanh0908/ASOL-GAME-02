import { describe, expect, it } from 'vitest';
import { levels } from './levels';
import { evaluate } from './mask';

describe('authored level progression', () => {
  it('contains six levels in chapter order', () => {
    expect(levels.map((level) => level.id)).toEqual(['1-1', '1-2', '1-3', '2-1', '2-2', '2-3']);
  });

  it('teaches no overlap in chapter one', () => {
    for (const level of levels.slice(0, 3)) {
      const sum = level.solution.reduce((count, placement) => count + level.pieces.find((piece) => piece.id === placement.pieceId)!.cells.length, 0);
      const visible = evaluate(level, level.solution).filter(Boolean).length;
      expect(visible).toBe(sum);
    }
  });

  it('uses square, triangle, and diamond pieces', () => {
    for (const level of levels) {
      expect(level.pieces.map((piece) => piece.id)).toEqual(
        expect.arrayContaining(level.pieces.length === 1 ? ['square'] : level.pieces.length === 2 ? ['square', 'triangle'] : ['square', 'triangle', 'diamond']),
      );
      expect(new Set(level.pieces.map((piece) => piece.color)).size).toBe(1);
    }
  });

  it('makes chapter two visibly harder through overlapping coverage', () => {
    for (const level of levels.slice(3)) {
      const totalCells = level.solution.reduce((count, placement) => count + level.pieces.find((piece) => piece.id === placement.pieceId)!.cells.length, 0);
      const visibleCells = evaluate(level, level.solution).filter(Boolean).length;
      expect(visibleCells).toBeLessThan(totalCells);
    }
  });
});

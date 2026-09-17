import { describe, expect, it } from 'vitest';
import { levels } from './levels';
import { evaluate } from './mask';
import { GRID_WIDTH } from './types';

const at = (mask: Uint8Array, x: number, y: number) => mask[y * GRID_WIDTH + x];

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

  it('uses a two-layer hole in 2-1', () => {
    const level = levels[3];
    expect(at(evaluate(level, [level.solution[0]]), 55, 80)).not.toBe(0);
    expect(at(evaluate(level, [level.solution[1]]), 55, 80)).not.toBe(0);
    expect(at(evaluate(level, level.solution), 55, 80)).toBe(0);
  });

  it('uses two and three layer areas in 2-2 and 2-3', () => {
    for (const level of levels.slice(4)) {
      const target = evaluate(level, level.solution);
      expect(at(target, 50, 75)).toBe(0);
      expect(at(target, 60, 85)).not.toBe(0);
    }
  });
});

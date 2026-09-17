import { describe, expect, it } from 'vitest';
import { evaluate, matchesTarget } from './mask';
import type { Level } from './types';

const singleCellLevel: Level = {
  id: 'test',
  title: 'Test',
  pieces: [
    { id: 'a', color: 1, cells: [[0, 0]], anchors: [[0, 0]] },
    { id: 'b', color: 2, cells: [[0, 0]], anchors: [[0, 0]] },
    { id: 'c', color: 3, cells: [[0, 0]], anchors: [[0, 0]] },
  ],
  solution: [],
};

describe('parity mask', () => {
  it('shows odd coverage and hides even coverage, with topmost visible color', () => {
    expect(evaluate(singleCellLevel, [])[0]).toBe(0);
    expect(evaluate(singleCellLevel, [{ pieceId: 'a', x: 0, y: 0 }])[0]).toBe(1);
    expect(evaluate(singleCellLevel, [
      { pieceId: 'a', x: 0, y: 0 },
      { pieceId: 'b', x: 0, y: 0 },
    ])[0]).toBe(0);
    expect(evaluate(singleCellLevel, [
      { pieceId: 'a', x: 0, y: 0 },
      { pieceId: 'b', x: 0, y: 0 },
      { pieceId: 'c', x: 0, y: 0 },
    ])[0]).toBe(3);
  });

  it('compares silhouette rather than color', () => {
    expect(matchesTarget(Uint8Array.from([1, 0, 3]), Uint8Array.from([2, 0, 1]))).toBe(true);
    expect(matchesTarget(Uint8Array.from([1, 1, 0]), Uint8Array.from([1, 0, 0]))).toBe(false);
  });
});

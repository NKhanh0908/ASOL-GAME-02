import { expect, it } from 'vitest';
import { levels } from './levels';
import { evaluate, matchesTarget } from './mask';
import { GRID_WIDTH, GRID_HEIGHT } from './types';

const prototypeLevels = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3'].map(id => levels.find(level => level.id === id)!);

it('preserves the six prototype piece combinations', () => {
  expect(prototypeLevels.map(l => l.id)).toEqual(['1-1', '1-2', '1-3', '2-1', '2-2', '2-3']);
  expect(prototypeLevels.map(l => l.pieces.map(p => p.id))).toEqual([
    ['square', 'triangle'], ['square', 'diamond'],
    ...Array.from({ length: 4 }, () => ['square', 'triangle', 'diamond']),
  ]);
});

it('authors essential overlapping pieces within the board', () => {
  prototypeLevels.forEach((level, index) => {
    const target = evaluate(level, level.solution);
    const coverage = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    expect(new Set(level.pieces.map(p => p.color))).toEqual(new Set([1]));
    for (const p of level.pieces) {
      const width = Math.max(...p.cells.map(([x]) => x)) + 1;
      expect(width).toBeGreaterThanOrEqual(36);
      expect(width).toBeLessThanOrEqual(48);
      expect(p.anchors).toHaveLength([2, 2, 3, 3, 3, 4][index]);
      for (const [ax, ay] of p.anchors) for (const [x, y] of p.cells) {
        expect(ax + x >= 0 && ax + x < GRID_WIDTH).toBe(true);
        expect(ay + y >= 0 && ay + y < GRID_HEIGHT).toBe(true);
      }
      for (let a = 0; a < p.anchors.length; a++) for (let b = a + 1; b < p.anchors.length; b++) {
        expect(Math.hypot(p.anchors[a][0] - p.anchors[b][0], p.anchors[a][1] - p.anchors[b][1])).toBeGreaterThan(12);
      }
      const goal = level.solution.find(s => s.pieceId === p.id)!;
      expect(p.anchors).toContainEqual([goal.x, goal.y]);
      for (const [x, y] of p.cells) coverage[(goal.y + y) * GRID_WIDTH + goal.x + x]++;
      expect(matchesTarget(evaluate(level, level.solution.filter(s => s.pieceId !== p.id)), target)).toBe(false);
      for (const [x, y] of p.anchors.filter(([x, y]) => x !== goal.x || y !== goal.y)) {
        expect(matchesTarget(evaluate(level, level.solution.map(s => s.pieceId === p.id ? { ...s, x, y } : s)), target)).toBe(false);
      }
    }
    expect(target.some(Boolean)).toBe(true);
    expect(coverage.includes(2)).toBe(true);
    if (index >= 3) expect(coverage.includes(3)).toBe(true);
    expect(matchesTarget(evaluate(level, [...level.solution].reverse()), target)).toBe(true);
  });
});

it('keeps large centered targets and meaningful detached regions', () => {
  for (const level of prototypeLevels) {
    const mask = evaluate(level, level.solution);
    const occupied = Array.from(mask.keys()).filter(i => mask[i]);
    const xs = occupied.map(i => i % GRID_WIDTH), ys = occupied.map(i => Math.floor(i / GRID_WIDTH));
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    // Approved exception: the introductory V needs room for both diagonal edges.
    expect(maxX - minX + 1).toBeGreaterThanOrEqual(level.id === '1-1' ? 60 : 70);
    expect(maxX - minX + 1).toBeLessThanOrEqual(level.id === '1-1' ? 64 : 96);
    expect(Math.abs((minX + maxX + 1) / 2 - 64)).toBeLessThanOrEqual(12);
    expect(Math.abs((minY + maxY + 1) / 2 - 96)).toBeLessThanOrEqual(12);
    if (['1-3', '2-2'].includes(level.id)) {
      const unseen = new Set(occupied);
      const sizes: number[] = [];
      while (unseen.size) {
        const queue = [unseen.values().next().value!];
        unseen.delete(queue[0]);
        for (let i = 0; i < queue.length; i++) {
          const cell = queue[i], x = cell % GRID_WIDTH, y = Math.floor(cell / GRID_WIDTH);
          for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
            if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT && unseen.delete(ny * GRID_WIDTH + nx)) queue.push(ny * GRID_WIDTH + nx);
          }
        }
        sizes.push(queue.length);
      }
      expect(sizes.filter(size => size >= 64).length).toBeGreaterThanOrEqual(2);
    }
  }
});

it('provides eighteen solvable campaign puzzles with rotation-dependent Chapter 3 targets', () => {
  expect(levels.map(level => level.id)).toEqual([
    ...Array.from({ length: 6 }, (_, index) => `1-${index + 1}`),
    ...Array.from({ length: 6 }, (_, index) => `2-${index + 1}`),
    ...Array.from({ length: 6 }, (_, index) => `3-${index + 1}`),
  ]);
  const signatures = new Set<string>();
  for (const level of levels) {
    const target = evaluate(level, level.solution);
    expect(target.some(Boolean)).toBe(true);
    const signature = Array.from(target).join('');
    expect(signatures.has(signature)).toBe(false);
    signatures.add(signature);
    for (const piece of level.pieces) {
      const goal = level.solution.find(placement => placement.pieceId === piece.id)!;
      expect(piece.anchors).toContainEqual([goal.x, goal.y]);
      expect(matchesTarget(evaluate(level, level.solution.filter(placement => placement.pieceId !== piece.id)), target)).toBe(false);
    }
    if (level.id.startsWith('3-')) {
      const rotated = level.solution.find(placement => (placement.rotation ?? 0) !== 0)!;
      expect(rotated).toBeDefined();
      expect(matchesTarget(evaluate(level, level.solution.map(placement => placement.pieceId === rotated.pieceId ? { ...placement, rotation: 0 } : placement)), target)).toBe(false);
    }
  }
});

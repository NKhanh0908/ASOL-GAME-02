import { expect, it } from 'vitest';
import { square, triangle, diamond, containsCell } from './shapes';

it('builds large shapes with fixed upward triangle and diamond axes', () => {
  expect(square(40)).toHaveLength(1600);
  const tri = triangle(40);
  expect(containsCell(tri, 20, 0)).toBe(true);
  expect(containsCell(tri, 0, 0)).toBe(false);
  expect(containsCell(tri, 0, 39)).toBe(true);
  const rhombus = diamond(40);
  expect(containsCell(rhombus, 20, 20)).toBe(true);
  expect(containsCell(rhombus, 0, 0)).toBe(false);
  for (const cells of [square(40), tri, rhombus]) {
    expect(Math.max(...cells.map(([x]) => x)) + 1).toBe(40);
    expect(new Set(cells.map(([x, y]) => `${x},${y}`)).size).toBe(cells.length);
  }
});

it('does not contain negative coordinates or empty corners', () => {
  const shapes = [square(8), triangle(8), diamond(8)];
  for (const cells of shapes) {
    expect(containsCell(cells, -1, 0)).toBe(false);
    expect(containsCell(cells, 0, -1)).toBe(false);
  }
  expect(containsCell(triangle(8), 0, 0)).toBe(false);
  expect(containsCell(diamond(8), 0, 0)).toBe(false);
});

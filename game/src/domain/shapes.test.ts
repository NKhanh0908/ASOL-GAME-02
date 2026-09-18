import { expect, it } from 'vitest';
import { square, triangle, smallTriangle, diamond, containsCell } from './shapes';

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

it('builds a small upward triangle of half the width of the large triangle', () => {
  const small = smallTriangle(24);
  const large = triangle(48);
  expect(containsCell(small, 12, 0)).toBe(true);
  expect(containsCell(small, 0, 0)).toBe(false);
  expect(containsCell(small, 0, 23)).toBe(true);
  expect(Math.max(...small.map(([x]) => x)) + 1).toBe(24);
  expect(Math.max(...small.map(([, y]) => y)) + 1).toBe(24);
  expect(small.length).toBeLessThan(large.length);
  expect(small.every(([x, y]) => x >= 0 && x < 24 && y >= 0 && y < 24)).toBe(true);
});

it('does not contain negative coordinates or empty corners', () => {
  const shapes = [square(8), triangle(8), diamond(8), smallTriangle(8)];
  for (const cells of shapes) {
    expect(containsCell(cells, -1, 0)).toBe(false);
    expect(containsCell(cells, 0, -1)).toBe(false);
  }
  expect(containsCell(triangle(8), 0, 0)).toBe(false);
  expect(containsCell(diamond(8), 0, 0)).toBe(false);
  expect(containsCell(smallTriangle(8), 0, 0)).toBe(false);
});


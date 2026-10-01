import type { Cell } from './types';

function raster(size: number, inside: (x: number, y: number) => boolean): Cell[] {
  if (!Number.isInteger(size) || size < 2) throw new Error('Invalid shape size');
  const result: Cell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inside(x, y)) result.push([x, y]);
    }
  }
  return result;
}

export const square = (size: number): Cell[] => raster(size, () => true);

export const triangle = (size: number): Cell[] =>
  raster(size, (x, y) => Math.abs(x + 0.5 - size / 2) <= (y + 1) / 2);

export const smallTriangle = (size = 24): Cell[] =>
  raster(size, (x, y) => Math.abs(x + 0.5 - size / 2) <= (y + 1) / 2);

export const diamond = (size: number): Cell[] =>

  raster(size, (x, y) =>
    Math.abs(x + 0.5 - size / 2) + Math.abs(y + 0.5 - size / 2) <= size / 2,
  );

export const containsCell = (cells: readonly Cell[], x: number, y: number): boolean =>
  cells.some(([cx, cy]) => cx === Math.floor(x) && cy === Math.floor(y));

export function rotateCells(cells: readonly Cell[], turns: number): Cell[] {
  const normalized = ((turns % 4) + 4) % 4;
  if (normalized === 0) return [...cells];
  const size = Math.max(...cells.flatMap(([x, y]) => [x, y])) + 1;
  return cells.map(([x, y]) => {
    if (normalized === 1) return [size - 1 - y, x];
    if (normalized === 2) return [size - 1 - x, size - 1 - y];
    return [y, size - 1 - x];
  });
}

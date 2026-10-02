import { describe, expect, test } from 'vitest';
import {
  effectiveOrientation,
  isValidOrientation,
  shapeCells,
  shapePolygon,
} from '../src/domain/shapes.ts';
import type { Vertex } from '../src/domain/shapes.ts';
import { rotateCells } from '../src/domain/geometry.ts';
import type { Cell, Orientation } from '../src/domain/model.ts';

const S = 48;
const key = ([x, y]: Cell): string => `${x},${y}`;

/** Tâm điểm nằm đúng trên một cạnh của đa giác (kể cả đầu mút). */
function onOutline(polygon: readonly Vertex[], px: number, py: number): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    const within =
      px >= Math.min(a.x, b.x) &&
      px <= Math.max(a.x, b.x) &&
      py >= Math.min(a.y, b.y) &&
      py <= Math.max(a.y, b.y);
    if (cross === 0 && within) return true;
  }
  return false;
}

function placed(cells: Cell[], ox: number, oy: number): Set<string> {
  return new Set(cells.map(([x, y]) => `${ox + x},${oy + y}`));
}

describe('shapePolygon theo bảng đỉnh của spec', () => {
  test('vuông và thoi', () => {
    expect(shapePolygon('square', 0, S)).toEqual([
      { x: 0, y: 0 },
      { x: 48, y: 0 },
      { x: 48, y: 48 },
      { x: 0, y: 48 },
    ]);
    expect(shapePolygon('diamond', 0, S)).toEqual([
      { x: 24, y: 0 },
      { x: 48, y: 24 },
      { x: 24, y: 48 },
      { x: 0, y: 24 },
    ]);
  });

  test('tam giác góc BL và mái hướng 4', () => {
    expect(shapePolygon('triangle', 3, S)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 48 },
      { x: 48, y: 48 },
    ]);
    expect(shapePolygon('triangle', 4, S)).toEqual([
      { x: 0, y: 48 },
      { x: 48, y: 48 },
      { x: 24, y: 24 },
    ]);
  });
});

describe('rasterize theo quy tắc ô biên trên-trái', () => {
  test('số ô từng hình ở khung 48', () => {
    expect(shapeCells('square', 0, S)).toHaveLength(2304);
    expect(shapeCells('diamond', 0, S)).toHaveLength(1152);
    const triangleCounts = ([0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]).map(
      (o) => shapeCells('triangle', o, S).length
    );
    expect(triangleCounts).toEqual([1128, 1176, 1176, 1128, 576, 552, 576, 600]);
  });

  test('mọi ô nằm trong khung', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      for (const [x, y] of shapeCells('triangle', o, S)) {
        expect(x >= 0 && x < S && y >= 0 && y < S).toBe(true);
      }
    }
  });

  test('hai tam giác bù nhau lát kín khung, không trùng ô', () => {
    for (const [a, b] of [
      [0, 2],
      [1, 3],
    ] as Array<[Orientation, Orientation]>) {
      const first = new Set(shapeCells('triangle', a, S).map(key));
      const second = shapeCells('triangle', b, S).map(key);
      expect(second.filter((k) => first.has(k))).toHaveLength(0);
      expect(first.size + second.length).toBe(S * S);
    }
  });

  test('thoi và hai cánh của 1-6 chung cạnh nhưng không chung ô', () => {
    const w1 = placed(shapeCells('triangle', 3, S), 16, 56);
    const w2 = placed(shapeCells('triangle', 2, S), 64, 56);
    const d1 = placed(shapeCells('diamond', 0, S), 40, 56);
    for (const k of d1) {
      expect(w1.has(k)).toBe(false);
      expect(w2.has(k)).toBe(false);
    }
  });
});

describe('xoay', () => {
  test('effectiveOrientation quay vòng trong cùng họ', () => {
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 0, t))).toEqual([0, 1, 2, 3]);
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 3, t))).toEqual([3, 0, 1, 2]);
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 6, t))).toEqual([6, 7, 4, 5]);
    expect(effectiveOrientation('diamond', 0, 3)).toBe(0);
    expect(effectiveOrientation('square', 0, 1)).toBe(0);
  });

  test('rotateCells và raster hướng hiệu dụng chỉ khác ở ô có tâm nằm trên viền', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      for (const t of [1, 2, 3]) {
        const rotated = new Set(rotateCells(shapeCells('triangle', o, S), S, t).map(key));
        const eff = effectiveOrientation('triangle', o, t);
        const direct = new Set(shapeCells('triangle', eff, S).map(key));
        const polygon = shapePolygon('triangle', eff, S);
        const diff = [
          ...[...rotated].filter((k) => !direct.has(k)),
          ...[...direct].filter((k) => !rotated.has(k)),
        ];
        expect(diff.length).toBeLessThanOrEqual(S);
        for (const k of diff) {
          const [x, y] = k.split(',').map(Number);
          expect(onOutline(polygon, x + 0.5, y + 0.5)).toBe(true);
        }
      }
    }
  });
});

describe('isValidOrientation', () => {
  test('tam giác nhận 0–7, vuông và thoi chỉ nhận 0', () => {
    expect(isValidOrientation('triangle', 7)).toBe(true);
    expect(isValidOrientation('triangle', 8)).toBe(false);
    expect(isValidOrientation('triangle', 1.5)).toBe(false);
    expect(isValidOrientation('square', 0)).toBe(true);
    expect(isValidOrientation('square', 1)).toBe(false);
    expect(isValidOrientation('diamond', 2)).toBe(false);
  });
});

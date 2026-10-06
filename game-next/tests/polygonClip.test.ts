import { describe, expect, test } from 'vitest';
import { clipConvex, parityLayers, polygonArea, unionOutline } from '../src/presentation/polygonClip.ts';
import type { Pt } from '../src/presentation/polygonClip.ts';
import { shapePolygon } from '../src/domain/shapes.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { computeLayout, piecePolygonCanvas } from '../src/presentation/layout.ts';

function square(x: number, y: number, s: number): Pt[] {
  return [
    { x, y },
    { x: x + s, y },
    { x: x + s, y: y + s },
    { x, y: y + s },
  ];
}

/** Điểm nằm hẳn bên trong đa giác lồi (không tính biên). */
function strictlyInside(polygon: readonly Pt[], p: Pt): boolean {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (cross === 0) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

describe('clipConvex', () => {
  test('hai hình vuông lệch nửa cạnh giao nhau một phần tư', () => {
    expect(polygonArea(clipConvex(square(0, 0, 10), square(5, 5, 10)))).toBeCloseTo(25, 9);
  });

  test('chỉ chạm cạnh hoặc rời nhau thì giao rỗng', () => {
    expect(clipConvex(square(0, 0, 10), square(10, 0, 10))).toEqual([]);
    expect(clipConvex(square(0, 0, 10), square(10, 10, 10))).toEqual([]);
    expect(clipConvex(square(0, 0, 10), square(30, 0, 10))).toEqual([]);
  });

  test('tam giác nằm trong hình vuông giữ nguyên diện tích', () => {
    const tri: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(clipConvex(tri, square(0, 0, 10)))).toBeCloseTo(50, 9);
  });

  test('không phụ thuộc chiều đi vòng của đa giác cắt', () => {
    const reversed = [...square(5, 5, 10)].reverse();
    expect(polygonArea(clipConvex(square(0, 0, 10), reversed))).toBeCloseTo(25, 9);
  });
});

describe('parityLayers', () => {
  test('hai hình giao nhau cho ba lớp: hai đơn và một cặp rỗng', () => {
    const layers = parityLayers([square(0, 0, 10), square(5, 0, 10)]);
    expect(layers.map((l) => [l.depth, l.filled])).toEqual([
      [1, true],
      [1, true],
      [2, false],
    ]);
  });

  test('lớp trên cùng tại mỗi điểm khớp tính chẵn lẻ của số mảnh phủ', () => {
    const polygons = [square(0, 0, 20), square(10, 0, 20), square(5, 8, 20)];
    const layers = parityLayers(polygons);
    for (let x = 0.37; x < 30; x += 1.3) {
      for (let y = 0.41; y < 30; y += 1.3) {
        const p = { x, y };
        const coverage = polygons.filter((poly) => strictlyInside(poly, p)).length;
        const top = [...layers].reverse().find((l) => strictlyInside(l.points, p));
        if (coverage === 0) {
          expect(top).toBeUndefined();
        } else {
          expect(top?.depth).toBe(coverage);
          expect(top?.filled).toBe(coverage % 2 === 1);
        }
      }
    }
  });

  test('bỏ qua đa giác suy biến', () => {
    const flat: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ];
    expect(parityLayers([flat])).toEqual([]);
  });
});

describe('vùng giao hai hình tròn', () => {
  test('thấu kính của hai tròn khung 64 lệch tâm 32 gần đúng công thức hình tròn', () => {
    const a = shapePolygon('circle', 0, 64).map((p) => ({ x: p.x, y: p.y }));
    const b = a.map((p) => ({ x: p.x + 32, y: p.y }));
    const lens = polygonArea(clipConvex(a, b));
    const r = 32;
    const d = 32;
    const exact = 2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d);
    // Đa giác 32 cạnh nội tiếp nhỏ hơn hình tròn thật: prototype đo được 1244,31 so với 1257,85 (1,08%)
    expect(lens).toBeCloseTo(1244.31, 1);
    expect(Math.abs(lens - exact) / exact).toBeLessThan(0.015);
  });
});

describe('unionOutline', () => {
  const squareRect = (x: number, y: number, w: number, h: number) => [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];

  test('a single square comes back as itself', () => {
    const loops = unionOutline([squareRect(0, 0, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
  });

  test('two squares sharing a full edge become one 4-corner loop', () => {
    const loops = unionOutline([squareRect(0, 0, 10, 10), squareRect(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
    const ys = loops[0].map((p) => p.y).sort((a, b) => a - b);
    expect(ys[0]).toBe(0);
    expect(ys[3]).toBe(20);
  });

  test('two squares sharing half an edge keep the exposed half', () => {
    const loops = unionOutline([squareRect(0, 0, 20, 10), squareRect(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(6);
  });

  test('a triangle on a square keeps only the house outline', () => {
    const body = squareRect(0, 10, 20, 20);
    const roof = [
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 20, y: 10 },
    ];
    const loops = unionOutline([body, roof]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(5);

    // The seam the reviewer saw: the full span from (0,10) to (20,10) must not
    // survive as an edge of the result.
    const hasSeam = loops[0].some((p, i) => {
      const q = loops[0][(i + 1) % loops[0].length];
      return p.y === 10 && q.y === 10 && Math.abs(p.x - q.x) === 20;
    });
    expect(hasSeam).toBe(false);
  });

  test('two disjoint squares stay two loops', () => {
    const loops = unionOutline([squareRect(0, 0, 10, 10), squareRect(50, 50, 10, 10)]);
    expect(loops).toHaveLength(2);
  });

  test('ignores the winding direction of the inputs', () => {
    const cw = [...squareRect(0, 0, 10, 10)].reverse();
    const loops = unionOutline([cw, squareRect(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
  });

  test('all approved campaign levels produce valid union outline loops', () => {
    const layout = computeLayout(720, 1280);
    const approved = campaignManifest.filter((e) => e.status === 'approved');
    expect(approved.length).toBeGreaterThanOrEqual(18);
    for (const entry of approved) {
      const lvl = loadLevel(entry.id, 'campaign');
      const polygons = (lvl.targetPlacements ?? []).map((pl) => {
        const piece = lvl.pieces.find((p) => p.id === pl.pieceId)!;
        return piecePolygonCanvas(piece, pl.x, pl.y, pl.turns, layout);
      });
      const loops = unionOutline(polygons);
      expect(loops.length).toBeGreaterThanOrEqual(1);
      for (const loop of loops) {
        expect(loop.length).toBeGreaterThanOrEqual(3);
        for (const pt of loop) {
          expect(Number.isFinite(pt.x)).toBe(true);
          expect(Number.isFinite(pt.y)).toBe(true);
        }
      }
    }
  });
});

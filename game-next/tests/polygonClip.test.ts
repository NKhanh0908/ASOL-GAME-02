import { describe, expect, test } from 'vitest';
import { clipConvex, parityLayers, polygonArea } from '../src/presentation/polygonClip.ts';
import type { Pt } from '../src/presentation/polygonClip.ts';

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

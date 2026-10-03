import { describe, expect, test } from 'vitest';
import type { Piece } from '../src/domain/model.ts';
import { GRID_STEP, SNAP_RADIUS_SQ, nearestGridOrigin } from '../src/domain/freePlacement.ts';
import { shapeCells } from '../src/domain/shapes.ts';

function makePiece(
  id: string,
  kind: 'square' | 'triangle',
  orientation: 0 | 5,
  x: number,
  y: number
): Piece {
  return {
    id,
    frameSize: 48,
    cells: shapeCells(kind, orientation, 48),
    anchors: [{ id: 'A', x, y }],
    color: 'amber',
    shapeKind: kind,
    orientation,
  };
}

const square = makePiece('S1', 'square', 0, 16, 16);
/** Mái hướng 5 (cạnh huyền bên trái): ô chỉ rộng 24 cột nên gốc x đi tới 104; xoay 1 nấc thành rộng 48 cột. */
const roof = makePiece('T5', 'triangle', 5, 8, 8);

describe('nearestGridOrigin (FP-03)', () => {
  test('hằng số lưới và bán kính hít', () => {
    expect(GRID_STEP).toBe(8);
    expect(SNAP_RADIUS_SQ).toBe(36);
  });

  test('giữa bàn: chọn giao điểm gần nhất', () => {
    expect(nearestGridOrigin(square, 0, 34, 59)).toEqual({ x: 32, y: 56 });
  });

  test('điểm xa nhất trong ô lưới (cách 4 góc như nhau, d² = 32) vẫn hít, hoà thì lấy y rồi x nhỏ', () => {
    expect(nearestGridOrigin(square, 0, 36, 60)).toEqual({ x: 32, y: 56 });
  });

  test('hoà theo y: ưu tiên y nhỏ hơn', () => {
    // (40,56) và (40,64) cùng d² = 25
    expect(nearestGridOrigin(square, 0, 37, 60)).toEqual({ x: 40, y: 56 });
  });

  test('hoà theo x: ưu tiên x nhỏ hơn', () => {
    // (56,40) và (64,40) cùng d² = 25
    expect(nearestGridOrigin(square, 0, 60, 37)).toEqual({ x: 56, y: 40 });
  });

  test('sát mép phải: giao điểm ngoài bàn bị bỏ, quá bán kính thì không hít', () => {
    // Vuông 48 chỉ vừa tới gốc x = 80
    expect(nearestGridOrigin(square, 0, 84, 40)).toEqual({ x: 80, y: 40 });
    // (88,40) cách 1 ô nhưng không vừa bàn; (80,40) cách 7 ô (d² = 49)
    expect(nearestGridOrigin(square, 0, 87, 40)).toBeNull();
  });

  test('toạ độ âm sát góc trên-trái vẫn hít vào (0,0)', () => {
    expect(nearestGridOrigin(square, 0, -3, -2)).toEqual({ x: 0, y: 0 });
  });

  test('hướng mới không vừa bàn thì không hít', () => {
    expect(nearestGridOrigin(roof, 0, 104, 40)).toEqual({ x: 104, y: 40 });
    expect(nearestGridOrigin(roof, 1, 104, 40)).toBeNull();
  });
});

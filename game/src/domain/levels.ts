import type { Cell, Level, PieceDefinition, Placement } from './types';

function shape(...rectangles: readonly [x: number, y: number, width: number, height: number][]): Cell[] {
  const cells = new Map<string, Cell>();
  for (const [x, y, width, height] of rectangles) {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        cells.set(`${column},${row}`, [column, row]);
      }
    }
  }
  return [...cells.values()];
}

function piece(id: string, color: number, cells: Cell[], ...anchors: Cell[]): PieceDefinition {
  return { id, color, cells, anchors };
}

function level(id: string, title: string, pieces: PieceDefinition[], solution: Placement[]): Level {
  return { id, title, pieces, solution };
}

export const levels: Level[] = [
  level('1-1', 'Kéo mảnh kính', [
    piece('a', 1, shape([0, 0, 30, 30], [0, 30, 14, 12]), [48, 58]),
  ], [{ pieceId: 'a', x: 48, y: 58 }]),
  level('1-2', 'Ghép đủ hình', [
    piece('a', 1, shape([0, 0, 24, 32]), [20, 54], [68, 110]),
    piece('b', 2, shape([0, 0, 30, 16], [0, 16, 12, 16]), [72, 88], [28, 48]),
  ], [
    { pieceId: 'a', x: 20, y: 54 },
    { pieceId: 'b', x: 72, y: 88 },
  ]),
  level('1-3', 'Tự ghép hình', [
    piece('a', 1, shape([0, 0, 24, 24]), [18, 46], [55, 92]),
    piece('b', 2, shape([0, 0, 16, 36]), [70, 45], [18, 96]),
    piece('c', 3, shape([0, 0, 32, 14], [0, 14, 12, 18]), [48, 112], [84, 102]),
  ], [
    { pieceId: 'a', x: 18, y: 46 },
    { pieceId: 'b', x: 70, y: 45 },
    { pieceId: 'c', x: 48, y: 112 },
  ]),
  level('2-1', 'Hai lớp biến mất', [
    piece('a', 1, shape([0, 0, 46, 40]), [28, 58], [62, 60]),
    piece('b', 2, shape([0, 0, 46, 40]), [46, 70], [22, 84]),
  ], [
    { pieceId: 'a', x: 28, y: 58 },
    { pieceId: 'b', x: 46, y: 70 },
  ]),
  level('2-2', 'Ba lớp hiện lại', [
    piece('a', 1, shape([0, 0, 48, 40]), [28, 60], [14, 90]),
    piece('b', 2, shape([0, 0, 48, 40]), [44, 70], [72, 55]),
    piece('c', 3, shape([0, 0, 48, 40]), [54, 78], [30, 110]),
  ], [
    { pieceId: 'a', x: 28, y: 60 },
    { pieceId: 'b', x: 44, y: 70 },
    { pieceId: 'c', x: 54, y: 78 },
  ]),
  level('2-3', 'Dùng quy luật', [
    piece('a', 1, shape([0, 0, 56, 40], [0, 40, 18, 14]), [24, 58], [48, 102]),
    piece('b', 2, shape([0, 0, 52, 44]), [42, 68], [16, 92]),
    piece('c', 3, shape([0, 0, 46, 38]), [55, 80], [30, 55]),
  ], [
    { pieceId: 'a', x: 24, y: 58 },
    { pieceId: 'b', x: 42, y: 68 },
    { pieceId: 'c', x: 55, y: 80 },
  ]),
];

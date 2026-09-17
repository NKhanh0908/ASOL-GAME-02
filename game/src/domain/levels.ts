import type { Cell, Level, PieceDefinition, Placement } from './types';

const COLOR = 1;

function cellsFrom(test: (x: number, y: number) => boolean, width: number, height: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (test(x, y)) cells.push([x, y]);
    }
  }
  return cells;
}

function square(size: number): Cell[] { return cellsFrom(() => true, size, size); }
function triangle(size: number): Cell[] { return cellsFrom((x, y) => x >= y, size, size); }
function diamond(radius: number): Cell[] {
  const size = radius * 2 + 1;
  return cellsFrom((x, y) => Math.abs(x - radius) + Math.abs(y - radius) <= radius, size, size);
}

function piece(id: string, cells: Cell[], ...anchors: Cell[]): PieceDefinition {
  return { id, color: COLOR, cells, anchors };
}

function level(id: string, title: string, pieces: PieceDefinition[], solution: Placement[]): Level {
  return { id, title, pieces, solution };
}

export const levels: Level[] = [
  level('1-1', 'Học cách kéo mảnh', [
    piece('square', square(8), [30, 30], [78, 100]),
  ], [{ pieceId: 'square', x: 30, y: 30 }]),
  level('1-2', 'Ghép hai hình', [
    piece('square', square(8), [24, 36], [72, 92]),
    piece('triangle', triangle(8), [52, 36], [18, 92]),
  ], [
    { pieceId: 'square', x: 24, y: 36 },
    { pieceId: 'triangle', x: 52, y: 36 },
  ]),
  level('1-3', 'Ghép đủ ba hình', [
    piece('square', square(8), [24, 30], [72, 96]),
    piece('triangle', triangle(8), [52, 30], [18, 96]),
    piece('diamond', diamond(4), [40, 48], [82, 112]),
  ], [
    { pieceId: 'square', x: 24, y: 30 },
    { pieceId: 'triangle', x: 52, y: 30 },
    { pieceId: 'diamond', x: 40, y: 48 },
  ]),
  level('2-1', 'Bắt đầu chồng hình', [
    piece('square', square(12), [34, 52], [72, 90]),
    piece('triangle', triangle(12), [40, 52], [20, 96]),
  ], [
    { pieceId: 'square', x: 34, y: 52 },
    { pieceId: 'triangle', x: 40, y: 52 },
  ]),
  level('2-2', 'Ba lớp hiện lại', [
    piece('square', square(14), [30, 48], [72, 96]),
    piece('triangle', triangle(14), [36, 48], [16, 100]),
    piece('diamond', diamond(6), [42, 54], [80, 112]),
  ], [
    { pieceId: 'square', x: 30, y: 48 },
    { pieceId: 'triangle', x: 36, y: 48 },
    { pieceId: 'diamond', x: 42, y: 54 },
  ]),
  level('2-3', 'Tìm đúng thứ tự', [
    piece('square', square(16), [26, 52], [74, 104]),
    piece('triangle', triangle(16), [34, 46], [16, 104]),
    piece('diamond', diamond(7), [42, 54], [80, 116]),
  ], [
    { pieceId: 'square', x: 26, y: 52 },
    { pieceId: 'triangle', x: 34, y: 46 },
    { pieceId: 'diamond', x: 42, y: 54 },
  ]),
];

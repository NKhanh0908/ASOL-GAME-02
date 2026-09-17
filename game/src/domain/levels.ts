import type { Cell, Level } from './types';
import { square, triangle, diamond } from './shapes';

function authored(id: string, title: string, rows: {
  id: string; cells: Cell[]; at: Cell; alternatives: Cell[];
}[]): Level {
  return {
    id, title,
    pieces: rows.map(r => ({ id: r.id, color: 1, cells: r.cells, anchors: [r.at, ...r.alternatives] })),
    solution: rows.map(r => ({ pieceId: r.id, x: r.at[0], y: r.at[1] })),
  };
}

export const levels: Level[] = [
  authored('1-1', 'Vết khuyết', [
    { id: 'square', cells: square(48), at: [32, 66], alternatives: [[48, 66]] },
    { id: 'triangle', cells: triangle(48), at: [44, 78], alternatives: [[28, 78]] },
  ]),
  authored('1-2', 'Cạnh vỡ', [
    { id: 'square', cells: square(48), at: [28, 66], alternatives: [[44, 66]] },
    { id: 'diamond', cells: diamond(48), at: [52, 78], alternatives: [[36, 78]] },
  ]),
  authored('1-3', 'Hai nhánh', [
    { id: 'square', cells: square(44), at: [26, 68], alternatives: [[42, 68], [26, 84]] },
    { id: 'triangle', cells: triangle(48), at: [50, 58], alternatives: [[34, 58], [50, 74]] },
    { id: 'diamond', cells: diamond(40), at: [40, 100], alternatives: [[56, 100], [40, 84]] },
  ]),
  authored('2-1', 'Lõi sáng', [
    { id: 'square', cells: square(48), at: [24, 68], alternatives: [[40, 68], [24, 84]] },
    { id: 'triangle', cells: triangle(48), at: [48, 52], alternatives: [[32, 52], [48, 68]] },
    { id: 'diamond', cells: diamond(40), at: [56, 80], alternatives: [[40, 80], [56, 96]] },
  ]),
  authored('2-2', 'Mảnh dấu', [
    { id: 'square', cells: square(44), at: [28, 72], alternatives: [[44, 72], [28, 88]] },
    { id: 'triangle', cells: triangle(48), at: [32, 56], alternatives: [[48, 56], [32, 72]] },
    { id: 'diamond', cells: diamond(44), at: [56, 82], alternatives: [[40, 82], [56, 66]] },
  ]),
  authored('2-3', 'Ấn lệch', [
    { id: 'square', cells: square(48), at: [24, 64], alternatives: [[40, 64], [24, 80], [24, 48]] },
    { id: 'triangle', cells: triangle(48), at: [48, 76], alternatives: [[32, 76], [48, 92], [48, 60]] },
    { id: 'diamond', cells: diamond(44), at: [42, 62], alternatives: [[58, 62], [42, 78], [42, 46]] },
  ]),
];

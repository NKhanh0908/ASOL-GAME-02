import type { Cell, Level } from './types';
import { square, triangle, diamond } from './shapes';

function authored(id: string, title: string, rows: {
  id: string; cells: Cell[]; at: Cell; alternatives: Cell[]; rotation?: 0 | 1 | 2 | 3;
}[]): Level {
  return {
    id, title,
    pieces: rows.map(r => ({ id: r.id, color: 1, cells: r.cells, anchors: [r.at, ...r.alternatives] })),
    solution: rows.map(r => ({ pieceId: r.id, x: r.at[0], y: r.at[1], rotation: r.rotation ?? 0 })),
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
  authored('1-4', 'Góc mở', [
    { id: 'square', cells: square(44), at: [28, 62], alternatives: [[44, 62]] },
    { id: 'triangle', cells: triangle(40), at: [50, 78], alternatives: [[34, 78]] },
  ]),
  authored('1-5', 'Cửa sổ', [
    { id: 'square', cells: square(48), at: [30, 68], alternatives: [[46, 68]] },
    { id: 'diamond', cells: diamond(40), at: [48, 56], alternatives: [[32, 56]] },
    { id: 'triangle', cells: triangle(36), at: [48, 94], alternatives: [[32, 94]] },
  ]),
  authored('1-6', 'Ba hướng', [
    { id: 'square', cells: square(40), at: [28, 70], alternatives: [[44, 70]] },
    { id: 'triangle', cells: triangle(44), at: [48, 54], alternatives: [[32, 54]] },
    { id: 'diamond', cells: diamond(36), at: [52, 96], alternatives: [[36, 96]] },
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
  authored('2-4', 'Hai khoảng trống', [
    { id: 'square', cells: square(48), at: [26, 62], alternatives: [[42, 62]] },
    { id: 'triangle', cells: triangle(44), at: [46, 78], alternatives: [[30, 78]] },
    { id: 'diamond', cells: diamond(40), at: [60, 62], alternatives: [[44, 62]] },
  ]),
  authored('2-5', 'Tâm trở lại', [
    { id: 'square', cells: square(44), at: [32, 72], alternatives: [[48, 72]] },
    { id: 'triangle', cells: triangle(44), at: [30, 54], alternatives: [[46, 54]] },
    { id: 'diamond', cells: diamond(44), at: [48, 80], alternatives: [[32, 80]] },
  ]),
  authored('2-6', 'Đường cắt', [
    { id: 'square', cells: square(48), at: [24, 68], alternatives: [[40, 68]] },
    { id: 'triangle', cells: triangle(48), at: [50, 54], alternatives: [[34, 54]] },
    { id: 'diamond', cells: diamond(40), at: [46, 90], alternatives: [[62, 90]] },
  ]),
  authored('3-1', 'Một góc xoay', [
    { id: 'square', cells: square(44), at: [28, 66], alternatives: [[44, 66]] },
    { id: 'triangle', cells: triangle(44), at: [50, 74], alternatives: [[34, 74]], rotation: 1 },
  ]),
  authored('3-2', 'Đổi hướng', [
    { id: 'square', cells: square(44), at: [30, 72], alternatives: [[46, 72]] },
    { id: 'triangle', cells: triangle(44), at: [50, 58], alternatives: [[34, 58]], rotation: 2 },
  ]),
  authored('3-3', 'Cánh nghiêng', [
    { id: 'diamond', cells: diamond(44), at: [30, 66], alternatives: [[46, 66]] },
    { id: 'triangle', cells: triangle(44), at: [52, 82], alternatives: [[36, 82]], rotation: 3 },
  ]),
  authored('3-4', 'Xoay và chồng', [
    { id: 'square', cells: square(44), at: [24, 70], alternatives: [[40, 70]] },
    { id: 'triangle', cells: triangle(44), at: [48, 56], alternatives: [[32, 56]], rotation: 1 },
    { id: 'diamond', cells: diamond(40), at: [52, 88], alternatives: [[36, 88]] },
  ]),
  authored('3-5', 'Vùng hiện lại', [
    { id: 'square', cells: square(48), at: [28, 64], alternatives: [[44, 64]] },
    { id: 'triangle', cells: triangle(44), at: [44, 78], alternatives: [[28, 78]], rotation: 2 },
    { id: 'diamond', cells: diamond(40), at: [56, 76], alternatives: [[40, 76]] },
  ]),
  authored('3-6', 'Gương hoàn chỉnh', [
    { id: 'square', cells: square(48), at: [24, 64], alternatives: [[40, 64]] },
    { id: 'triangle', cells: triangle(48), at: [48, 52], alternatives: [[32, 52]], rotation: 3 },
    { id: 'diamond', cells: diamond(44), at: [52, 82], alternatives: [[36, 82]] },
  ]),
];

import { PIECE_TOKENS } from './designTokens.ts';

export type Point = { x: number; y: number };

export type JewelFace = {
  name: 'north' | 'east' | 'south' | 'west';
  points: Point[];
  color: string;
};

/**
 * Bốn đỉnh hình thoi, bắt đầu từ đỉnh Bắc theo chiều kim đồng hồ.
 *
 * Thoi là hình vuông xoay 45 độ: hai đường chéo nằm trên đường kẻ ngang và
 * dọc của lưới, nên mỗi cạnh có hệ số góc 45 độ và trùng đường chéo của lưới.
 */
export function jewelOutline(cx: number, cy: number, radius: number): Point[] {
  return [
    { x: cx, y: cy - radius },
    { x: cx + radius, y: cy },
    { x: cx, y: cy + radius },
    { x: cx - radius, y: cy },
  ];
}

/**
 * Bốn mặt vát, mỗi mặt là tam giác nối tâm với hai đỉnh kề.
 * Sáng ở trên-trái, tối dần xuống dưới-phải — đó là thứ tạo cảm giác viên ngọc
 * thay vì một mảng màu phẳng.
 */
export function jewelFaces(cx: number, cy: number, radius: number): JewelFace[] {
  const [n, e, s, w] = jewelOutline(cx, cy, radius);
  const center = { x: cx, y: cy };
  return [
    { name: 'north', points: [n, center, w], color: PIECE_TOKENS.faceNorth },
    { name: 'east', points: [n, e, center], color: PIECE_TOKENS.faceEast },
    { name: 'south', points: [e, s, center], color: PIECE_TOKENS.faceSouth },
    { name: 'west', points: [s, w, center], color: PIECE_TOKENS.faceWest },
  ];
}

/** Mặt bàn: thoi nhỏ đồng tâm, nơi ánh sáng tụ lại. */
export function jewelTable(cx: number, cy: number, radius: number): Point[] {
  return jewelOutline(cx, cy, radius * PIECE_TOKENS.tableRatio);
}

/** Bốn đoạn nối từ mỗi đỉnh vào mặt bàn. */
export function jewelSpineLines(
  cx: number,
  cy: number,
  radius: number
): Array<{ from: Point; to: Point }> {
  const outer = jewelOutline(cx, cy, radius);
  const inner = jewelTable(cx, cy, radius);
  return outer.map((from, index) => ({ from, to: inner[index] }));
}

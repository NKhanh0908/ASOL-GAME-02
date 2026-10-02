import { describe, expect, test } from 'vitest';
import {
  jewelOutline,
  jewelFaces,
  jewelTable,
  jewelSpineLines,
} from '../src/presentation/jewelGeometry.ts';
import { PIECE_TOKENS } from '../src/presentation/designTokens.ts';

const CX = 360;
const CY = 600;
const R = 120; // một module

describe('jewelGeometry', () => {
  test('viền ngoài là bốn đỉnh, bắt đầu từ Bắc theo chiều kim đồng hồ', () => {
    expect(jewelOutline(CX, CY, R)).toEqual([
      { x: CX, y: CY - R },
      { x: CX + R, y: CY },
      { x: CX, y: CY + R },
      { x: CX - R, y: CY },
    ]);
  });

  test('thoi là hình vuông xoay 45 độ: hai đường chéo bằng nhau và vuông góc', () => {
    const [n, e, s, w] = jewelOutline(CX, CY, R);
    expect(Math.hypot(s.x - n.x, s.y - n.y)).toBeCloseTo(2 * R, 6);
    expect(Math.hypot(e.x - w.x, e.y - w.y)).toBeCloseTo(2 * R, 6);
    // Đường chéo dọc và ngang vuông góc
    expect((s.x - n.x) * (e.x - w.x) + (s.y - n.y) * (e.y - w.y)).toBeCloseTo(0, 6);
  });

  test('mỗi cạnh có hệ số góc 45 độ, nên nằm trên đường chéo của lưới', () => {
    const pts = jewelOutline(CX, CY, R);
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      expect(Math.abs((b.y - a.y) / (b.x - a.x))).toBeCloseTo(1, 6);
    }
  });

  test('bốn mặt vát, mỗi mặt một tam giác từ tâm, màu sáng ở trên-trái', () => {
    const faces = jewelFaces(CX, CY, R);
    expect(faces.map((f) => f.name)).toEqual(['north', 'east', 'south', 'west']);
    for (const face of faces) {
      expect(face.points).toHaveLength(3);
      expect(face.points).toContainEqual({ x: CX, y: CY });
    }
    expect(faces[0].color).toBe(PIECE_TOKENS.faceNorth);
    expect(faces[1].color).toBe(PIECE_TOKENS.faceEast);
    expect(faces[2].color).toBe(PIECE_TOKENS.faceSouth);
    expect(faces[3].color).toBe(PIECE_TOKENS.faceWest);
  });

  test('bốn mặt phủ kín mảnh, không chừa khe và không chồng nhau', () => {
    const faces = jewelFaces(CX, CY, R);
    const area = (pts: Array<{ x: number; y: number }>) =>
      Math.abs(
        pts.reduce((sum, p, i) => {
          const q = pts[(i + 1) % pts.length];
          return sum + (p.x * q.y - q.x * p.y);
        }, 0) / 2
      );
    const total = faces.reduce((sum, f) => sum + area(f.points), 0);
    // Diện tích hình thoi hai đường chéo 2R là 2R^2
    expect(total).toBeCloseTo(2 * R * R, 6);
  });

  test('mặt bàn là thoi nhỏ đồng tâm, bán kính theo tỉ lệ token', () => {
    const table = jewelTable(CX, CY, R);
    expect(table).toHaveLength(4);
    const expectedR = R * PIECE_TOKENS.tableRatio;
    expect(table[0]).toEqual({ x: CX, y: CY - expectedR });
    expect(table[2]).toEqual({ x: CX, y: CY + expectedR });
  });

  test('bốn đoạn nối từ đỉnh vào mặt bàn, không cắt qua tâm', () => {
    const lines = jewelSpineLines(CX, CY, R);
    expect(lines).toHaveLength(4);
    const tableR = R * PIECE_TOKENS.tableRatio;
    for (const line of lines) {
      const distFrom = Math.hypot(line.from.x - CX, line.from.y - CY);
      const distTo = Math.hypot(line.to.x - CX, line.to.y - CY);
      expect(distFrom).toBeCloseTo(R, 6);
      expect(distTo).toBeCloseTo(tableR, 6);
    }
  });

  test('đỉnh mảnh rơi đúng giao điểm lưới khi tâm và bán kính là bội số ô lưới', () => {
    // Tâm (40*5, 80*5) = (200, 400) trên canvas, bán kính một module
    const pts = jewelOutline(200, 400, 120);
    for (const p of pts) {
      expect((p.x - 200) % 40 === 0 || (p.y - 400) % 40 === 0).toBe(true);
    }
  });
});

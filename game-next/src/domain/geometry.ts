import type { Cell, Turns } from './model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from './model.ts';

/**
 * Xoay các ô theo chiều kim đồng hồ quanh tâm khung vuông frameSize.
 * Mỗi nấc 90°: (x, y) -> (frameSize - 1 - y, x).
 */
export function rotateCells(
  cells: readonly Cell[],
  frameSize: number,
  turns: Turns | number
): Cell[] {
  const normalizedTurns = ((turns % 4) + 4) % 4;
  if (normalizedTurns === 0) {
    return cells.map(([x, y]) => [x, y] as const);
  }

  let current = cells.map(([x, y]) => [x, y] as const);
  for (let step = 0; step < normalizedTurns; step++) {
    current = current.map(([x, y]) => [frameSize - 1 - y, x] as const);
  }
  return current;
}

/**
 * Kiểm tra tập ô đặt tại tọa độ (x, y) có nằm hoàn toàn trong bàn cờ 128 x 192 hay không.
 * Tọa độ x, y phải là số nguyên hữu hạn không âm và không vượt mép.
 */
export function fitsBoard(cells: readonly Cell[], x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
    return false;
  }

  for (const [cx, cy] of cells) {
    if (!Number.isInteger(cx) || !Number.isInteger(cy)) {
      return false;
    }
    const targetX = x + cx;
    const targetY = y + cy;
    if (targetX < 0 || targetX >= GRID_WIDTH || targetY < 0 || targetY >= GRID_HEIGHT) {
      return false;
    }
  }

  return true;
}

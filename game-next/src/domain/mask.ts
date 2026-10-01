import type { Level, Placement } from './model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from './model.ts';
import { fitsBoard, rotateCells } from './geometry.ts';

/**
 * Tính toán mask kết quả từ danh sách các mảnh đã snap trên bàn cờ.
 * Áp dụng quy luật chẵn-lẻ (XOR) cho các mảnh cùng màu.
 */
export function evaluate(level: Level, placements: readonly Placement[]): Uint8Array {
  const mask = new Uint8Array(TOTAL_CELLS);
  const seenPieceIds = new Set<string>();

  for (const placement of placements) {
    if (!Number.isInteger(placement.x) || !Number.isInteger(placement.y)) {
      throw new Error('invalid-coordinate');
    }

    if (seenPieceIds.has(placement.pieceId)) {
      throw new Error(`duplicate-piece:${placement.pieceId}`);
    }
    seenPieceIds.add(placement.pieceId);

    const piece = level.pieces.find((p) => p.id === placement.pieceId);
    if (!piece) {
      throw new Error('unknown-piece');
    }

    const cells = rotateCells(piece.cells, piece.frameSize, placement.turns);
    if (!fitsBoard(cells, placement.x, placement.y)) {
      throw new Error('out-of-bounds');
    }

    for (const [cx, cy] of cells) {
      const idx = (placement.y + cy) * GRID_WIDTH + (placement.x + cx);
      mask[idx] ^= 1;
    }
  }

  return mask;
}

/**
 * So khớp chính xác hai mask (kết quả và mục tiêu).
 */
export function matchesTarget(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

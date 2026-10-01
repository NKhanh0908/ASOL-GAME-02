/**
 * Sinh lại hình học màn 1-1 theo quy tắc GridSpec.
 *
 * Nửa đường chéo hình thoi phải là số nguyên ô lưới hiển thị. Với lưới hiển
 * thị 8 ô logic mỗi ô và module 3 ô lưới, nửa đường chéo = 24 ô logic, tức
 * frameSize = 48. Bản cũ dùng frameSize 40 nên nửa đường chéo là 2.5 ô lưới —
 * đỉnh mảnh rơi vào giữa ô thay vì giao điểm.
 *
 * Quy ước neo: neo là GỐC khung mảnh (góc trên-trái), không phải tâm.
 * `drag.ts` tính tâm bằng `anchor + frameSize / 2`, và `fitsBoard` nhận neo
 * làm gốc. Đặt tâm ở đâu thì trừ đi HALF để ra neo.
 *
 * Chạy một lần rồi commit kết quả:
 *   node --experimental-strip-types scripts/regen-level-geometry.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEVEL_PATH = resolve(HERE, '../src/content/levels/1-1.json');

const GRID_WIDTH = 128;
const GRID_HEIGHT = 160;
const FRAME_SIZE = 48;
const HALF = FRAME_SIZE / 2; // 24 ô logic = 1 module
const DISPLAY_CELL = 8; // 1 ô lưới hiển thị = 8 ô logic

/**
 * Hai mảnh chạm đỉnh nhau tại giữa bàn (x = 64): tâm ở 40 và 88, cách nhau
 * đúng 2 x HALF. Hàng chính ở tâm y = 80; neo B là chỗ đặt thay thế thấp hơn.
 * Neo ghi bằng toạ độ GỐC, nên bằng tâm trừ HALF.
 */
const ANCHOR_CENTERS = {
  D1: [
    { id: 'A', cx: 40, cy: 80 },
    { id: 'B', cx: 40, cy: 96 },
  ],
  D2: [
    { id: 'A', cx: 88, cy: 80 },
    { id: 'B', cx: 88, cy: 96 },
  ],
} as const;

const VICTORY_VERSE = 'Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.';

/**
 * Rasterize hình thoi nội tiếp khung FRAME_SIZE x FRAME_SIZE.
 * Ô (cx, cy) thuộc mảnh khi khoảng cách Manhattan từ tâm ô tới tâm khung
 * không vượt quá HALF. Dùng tâm ô (+0.5) để hai nửa đối xứng.
 */
function rasterizeDiamond(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let cy = 0; cy < FRAME_SIZE; cy++) {
    for (let cx = 0; cx < FRAME_SIZE; cx++) {
      const dx = Math.abs(cx + 0.5 - HALF);
      const dy = Math.abs(cy + 0.5 - HALF);
      if (dx + dy <= HALF) {
        cells.push([cx, cy]);
      }
    }
  }
  return cells;
}

function main(): void {
  const doc = JSON.parse(readFileSync(LEVEL_PATH, 'utf8'));

  doc.board = { width: GRID_WIDTH, height: GRID_HEIGHT };
  doc.victoryVerse = VICTORY_VERSE;

  const cells = rasterizeDiamond();

  for (const piece of doc.pieces) {
    const centers = ANCHOR_CENTERS[piece.id as keyof typeof ANCHOR_CENTERS];
    if (!centers) {
      throw new Error(`Không có cấu hình neo cho mảnh ${piece.id}`);
    }
    piece.frameSize = FRAME_SIZE;
    piece.cells = cells.map(([x, y]) => [x, y]);
    piece.anchors = centers.map((c) => {
      const x = c.cx - HALF;
      const y = c.cy - HALF;
      if (x % DISPLAY_CELL !== 0 || y % DISPLAY_CELL !== 0) {
        throw new Error(
          `Neo ${piece.id}.${c.id} tại (${x}, ${y}) không rơi vào giao điểm lưới hiển thị`
        );
      }
      if (x < 0 || y < 0 || x + FRAME_SIZE > GRID_WIDTH || y + FRAME_SIZE > GRID_HEIGHT) {
        throw new Error(`Neo ${piece.id}.${c.id} tại (${x}, ${y}) làm mảnh vượt biên bàn`);
      }
      return { id: c.id, x, y };
    });
  }

  // targetCells = hợp của hai mảnh đặt tại neo 'A' của chúng
  const target = new Set<string>();
  for (const piece of doc.pieces) {
    const anchorA = piece.anchors.find((a: { id: string }) => a.id === 'A');
    for (const [cx, cy] of cells) {
      target.add(`${anchorA.x + cx},${anchorA.y + cy}`);
    }
  }
  doc.targetCells = [...target]
    .map((key) => key.split(',').map(Number) as [number, number])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

  doc.sampleSolutions = [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
    ],
  ];

  writeFileSync(LEVEL_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');

  console.log(
    `Đã sinh lại 1-1: frameSize ${FRAME_SIZE}, ${cells.length} ô mỗi mảnh, ` +
      `${doc.targetCells.length} ô mục tiêu.`
  );
}

main();

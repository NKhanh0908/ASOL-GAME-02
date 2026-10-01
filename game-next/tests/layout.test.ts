import { describe, expect, test } from 'vitest';
import {
  computeLayout,
  gridToCanvas,
  canvasToGrid,
  pieceCenterCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
} from '../src/presentation/layout.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../src/domain/model.ts';
import { GRID_TOKENS } from '../src/presentation/designTokens.ts';

describe('Layout Metrics Specification', () => {
  const layout = computeLayout(720, 1280);

  test('lưới logic 128 x 160 theo đặc tả GridSpec', () => {
    expect(GRID_WIDTH).toBe(128);
    expect(GRID_HEIGHT).toBe(160);
  });

  test('bàn chơi 640x800 tại (40, 200) ở tỉ lệ 5px mỗi ô logic', () => {
    expect(layout.boardBounds).toEqual({ x: 40, y: 200, width: 640, height: 800 });
    expect(layout.cellPixel).toBe(5);
    expect(GRID_WIDTH * layout.cellPixel).toBe(layout.boardBounds.width);
    expect(GRID_HEIGHT * layout.cellPixel).toBe(layout.boardBounds.height);
  });

  test('khay, header và thanh dưới theo bố cục dọc mới', () => {
    expect(layout.trayBounds).toEqual({ x: 40, y: 1016, width: 640, height: 136 });
    expect(layout.headerBounds).toEqual({ y: 0, height: 96 });
    expect(layout.bottomBarBounds).toEqual({ y: 1164, height: 116 });
  });

  test('chuyển đổi grid sang canvas tính đúng gốc (40, 200)', () => {
    expect(gridToCanvas(0, 0, layout)).toEqual({ x: 40, y: 200 });
    expect(gridToCanvas(64, 80, layout)).toEqual({ x: 40 + 320, y: 200 + 400 });
  });

  test('chuyển đổi canvas sang grid nhận diện đúng trong và ngoài bàn', () => {
    expect(canvasToGrid(40 + 64 * 5, 200 + 80 * 5, layout)).toEqual({
      x: 64,
      y: 80,
      insideBoard: true,
    });
    // Ngay dưới mép dưới bàn: y logic = 160, vượt lưới
    expect(canvasToGrid(40, 200 + 160 * 5, layout).insideBoard).toBe(false);
  });

  test('một ô lưới hiển thị bằng 40px và một module bằng 120px', () => {
    const displayPx = layout.cellPixel * GRID_TOKENS.displayCellInLogicCells;
    expect(displayPx).toBe(40);
    expect(displayPx * GRID_TOKENS.moduleInDisplayCells).toBe(120);
    // Bàn chứa đúng số nguyên ô lưới hiển thị theo cả hai chiều
    expect(layout.boardBounds.width % displayPx).toBe(0);
    expect(layout.boardBounds.height % displayPx).toBe(0);
  });
});

describe('Tâm và bán kính mảnh suy ra từ frameSize', () => {
  const layout = computeLayout(720, 1280);

  test('tâm mảnh bằng gốc cộng nửa khung, không phải hằng số', () => {
    // frameSize 48: nửa khung 24 ô logic
    expect(pieceCenterCanvas(48, 16, 56, layout)).toEqual({
      x: 40 + (16 + 24) * 5,
      y: 200 + (56 + 24) * 5,
    });
    // frameSize 40: nửa khung 20 ô logic — cùng công thức, khác kết quả
    expect(pieceCenterCanvas(40, 16, 56, layout)).toEqual({
      x: 40 + (16 + 20) * 5,
      y: 200 + (56 + 20) * 5,
    });
  });

  test('bán kính vẽ bằng nửa đường chéo thật của mảnh', () => {
    expect(pieceRadiusPx(48, layout)).toBe(120);
    expect(pieceRadiusPx(40, layout)).toBe(100);
  });

  test('với màn 1-1, hai mảnh chạm đỉnh nhau đúng giữa bàn', () => {
    const left = pieceCenterCanvas(48, 16, 56, layout);
    const right = pieceCenterCanvas(48, 64, 56, layout);
    const radius = pieceRadiusPx(48, layout);

    // Đỉnh phải mảnh trái trùng đỉnh trái mảnh phải
    expect(left.x + radius).toBe(right.x - radius);
    // Và điểm chạm nằm đúng tâm bàn theo chiều ngang
    expect(left.x + radius).toBe(layout.boardBounds.x + layout.boardBounds.width / 2);
    expect(left.y).toBe(right.y);
  });
});

describe('Bán kính mảnh trong khay', () => {
  const layout = computeLayout(720, 1280);

  test('mảnh trong khay phải lọt hẳn chiều cao khay', () => {
    const r = trayPieceRadiusPx(layout);
    expect(r * 2).toBeLessThanOrEqual(layout.trayBounds.height);
    expect(r).toBeGreaterThan(0);
  });

  test('nhỏ hơn mảnh trên bàn, vì khay thấp hơn bàn nhiều', () => {
    expect(trayPieceRadiusPx(layout)).toBeLessThan(pieceRadiusPx(48, layout));
  });

  test('hai mảnh nằm cạnh nhau trong khay không chạm nhau', () => {
    const slotWidth = layout.trayBounds.width / 2;
    expect(trayPieceRadiusPx(layout) * 2).toBeLessThan(slotWidth);
  });
});

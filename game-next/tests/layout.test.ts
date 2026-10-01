import { describe, expect, test } from 'vitest';
import { computeLayout, gridToCanvas, canvasToGrid } from '../src/presentation/layout.ts';
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
    expect(layout.trayBounds).toEqual({ x: 40, y: 1032, width: 640, height: 160 });
    expect(layout.headerBounds).toEqual({ y: 0, height: 96 });
    expect(layout.bottomBarBounds).toEqual({ y: 1200, height: 80 });
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

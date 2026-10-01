import { describe, expect, test } from 'vitest';
import { computeLayout, gridToCanvas, canvasToGrid } from '../src/presentation/layout.ts';

describe('Layout Metrics Specification', () => {
  const layout = computeLayout(720, 1280);

  test('tọa độ bàn cờ và khay mảnh tuân thủ đúng phân vùng Safe Area', () => {
    expect(layout.boardBounds).toEqual({
      x: 104,
      y: 184,
      width: 512,
      height: 768,
    });

    expect(layout.trayBounds).toEqual({
      x: 104,
      y: 968,
      width: 512,
      height: 140,
    });

    expect(layout.cellPixel).toBe(4);
    expect(layout.headerBounds).toEqual({
      y: 0,
      height: 96,
    });
    expect(layout.bottomBarBounds).toEqual({
      y: 1124,
      height: 92,
    });
  });

  test('chuyển đổi tọa độ grid sang canvas tính đúng gốc y=184', () => {
    const canvasTopLeft = gridToCanvas(0, 0, layout);
    expect(canvasTopLeft).toEqual({ x: 104, y: 184 });

    const gridCenter = canvasToGrid(104 + 64 * 4, 184 + 96 * 4, layout);
    expect(gridCenter).toEqual({ x: 64, y: 96, insideBoard: true });
  });
});

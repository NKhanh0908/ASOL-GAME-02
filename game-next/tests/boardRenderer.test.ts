import { describe, expect, test } from 'vitest';
import { computeLayout } from '../src/presentation/layout.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';

describe('BoardRenderer Astrological Stele Rules', () => {
  const layout = computeLayout(720, 1280);

  test('bàn chơi 640x800 bắt đầu tại y=200, căn giữa ngang', () => {
    expect(layout.boardBounds.x).toBe(40);
    expect(layout.boardBounds.y).toBe(200);
    expect(layout.boardBounds.width).toBe(640);
    expect(layout.boardBounds.height).toBe(800);
  });

  test('màu khung kính và mặt bàn tuân thủ bảng màu improve-v1', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');
    expect(COLOR_TOKENS.board.surfaceTop).toBe('#1D3482');
    expect(COLOR_NUMBERS.boardSurfaceTop).toBe(0x1d3482);
    expect(COLOR_NUMBERS.icePrimary).toBe(0xa9e3ff);
  });

  test('khay mảnh nằm ngay dưới bàn, không chồng lấn', () => {
    expect(layout.trayBounds.y).toBe(LAYOUT_TOKENS.tray.y);
    expect(layout.trayBounds.height).toBe(LAYOUT_TOKENS.tray.height);
    expect(layout.trayBounds.y).toBeGreaterThanOrEqual(
      layout.boardBounds.y + layout.boardBounds.height
    );
  });
});

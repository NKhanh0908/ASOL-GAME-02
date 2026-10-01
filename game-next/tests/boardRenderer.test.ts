import { describe, expect, test } from 'vitest';
import { computeLayout } from '../src/presentation/layout.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';

describe('BoardRenderer Astrological Stele Rules', () => {
  const layout = computeLayout(720, 1280);

  test('tấm bia kích thước 512x768 bắt đầu tại y=184 với tỉ lệ 4px/ô chuẩn mực', () => {
    expect(layout.boardBounds.y).toBe(184);
    expect(layout.boardBounds.width).toBe(512);
    expect(layout.boardBounds.height).toBe(768);
    expect(layout.boardBounds.x).toBe(104);
  });

  test('màu viền kính bevel và màu mặt bia tuân thủ họ màu nghiêm ngặt', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#68B8DC');
    expect(COLOR_TOKENS.navy.steleSurface).toBe('#101B32');
    expect(COLOR_NUMBERS.navyStele).toBe(0x101b32);
    expect(COLOR_NUMBERS.icePrimary).toBe(0x68b8dc);
  });

  test('khay mảnh nằm ở dải y=968..1108 phù hợp với bố cục dọc', () => {
    expect(layout.trayBounds.y).toBe(LAYOUT_TOKENS.tray.y);
    expect(layout.trayBounds.height).toBe(LAYOUT_TOKENS.tray.height);
  });
});

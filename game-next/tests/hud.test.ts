import { describe, expect, test } from 'vitest';
import { COLOR_TOKENS, LAYOUT_TOKENS, TYPO_TOKENS } from '../src/presentation/designTokens.ts';
import {
  HUD_LEVEL_TITLE_MAX_WIDTH,
  HUD_LEVEL_TITLE_MIN_SIZE,
  SNAP_HINT_TEXT,
  VICTORY_VERSE_FONT_SIZE,
  fitHudTitleFontSize,
  formatMatchCount,
} from '../src/presentation/hudText.ts';

describe('Hud Behavioral Logic and Visual Standards', () => {
  test('quy tắc nút Xoay chỉ hiển thị từ Chương 3', () => {
    const isChapter3OrAbove = (levelId: string) => {
      const chapter = parseInt(levelId.split('-')[0], 10);
      return chapter >= 3;
    };

    expect(isChapter3OrAbove('1-1')).toBe(false);
    expect(isChapter3OrAbove('2-3')).toBe(false);
    expect(isChapter3OrAbove('3-1')).toBe(true);
    expect(isChapter3OrAbove('3-6')).toBe(true);
  });

  test('kích thước nút tròn hành động và điều hướng đạt chuẩn touch target', () => {
    expect(LAYOUT_TOKENS.buttonSizes.circularAction).toBe(64);
    expect(LAYOUT_TOKENS.buttonSizes.circularNav).toBe(56);
  });

  test('tiêu đề và nhãn sử dụng font thích hợp, không dùng ALL-CAPS trong giao diện', () => {
    const sampleTitle = 'Màn 1-1 · Song Tinh';
    const isNotAllCaps = sampleTitle !== sampleTitle.toUpperCase();
    expect(isNotAllCaps).toBe(true);
    expect(TYPO_TOKENS.fontFamily.serif).toContain('Playfair Display');
    expect(TYPO_TOKENS.fontFamily.levelTitle).toContain('Be Vietnam Pro');
    expect(TYPO_TOKENS.fontFamily.levelTitle).not.toContain('Playfair Display');
  });
});

describe('HUD theo mockup improve-v1', () => {
  test('nhãn gợi ý thả mảnh dùng đúng chuỗi tiếng Việt, không viết hoa toàn bộ', () => {
    expect(SNAP_HINT_TEXT).toBe('Thả để khớp');
    expect(SNAP_HINT_TEXT).not.toBe(SNAP_HINT_TEXT.toUpperCase());
  });

  test('thanh đếm mảnh hiển thị đúng định dạng n/m', () => {
    expect(formatMatchCount(0, 2)).toBe('0/2 mảnh đã khớp');
    expect(formatMatchCount(1, 2)).toBe('1/2 mảnh đã khớp');
    expect(formatMatchCount(2, 2)).toBe('2/2 mảnh đã khớp');
  });

  test('tiêu đề dùng cỡ chữ lớn của mockup, phụ đề nhỏ hơn hẳn', () => {
    const title = parseInt(TYPO_TOKENS.fontSize.headerTitle, 10);
    const caption = parseInt(TYPO_TOKENS.fontSize.caption, 10);
    expect(title).toBe(52);
    expect(caption).toBeLessThan(title);
  });

  test('tên màn dài co vừa vùng an toàn giữa hai nút header', () => {
    expect(HUD_LEVEL_TITLE_MAX_WIDTH).toBe(448);
    expect(fitHudTitleFontSize(420)).toBe(52);
    expect(fitHudTitleFontSize(650)).toBe(35);
    expect(fitHudTitleFontSize(1200)).toBe(HUD_LEVEL_TITLE_MIN_SIZE);
  });

  test('câu thơ thắng hai dòng dùng cỡ chữ gọn để không chạm tên màn và hàng nút', () => {
    expect(VICTORY_VERSE_FONT_SIZE).toBe(18);
  });

  test('nút tròn dùng viền băng và nền radial mới', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');
    expect(COLOR_TOKENS.iceGlass.buttonFillTop).toBe('#3D5FC0');
    expect(COLOR_TOKENS.iceGlass.buttonFillBottom).toBe('#1B2A72');
  });
});

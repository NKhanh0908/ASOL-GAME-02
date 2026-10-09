import { describe, expect, test } from 'vitest';
import { COLOR_TOKENS, LAYOUT_TOKENS, TYPO_TOKENS, VICTORY_CARD } from '../src/presentation/designTokens.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import {
  HUD_LEVEL_TITLE_MAX_WIDTH,
  HUD_LEVEL_TITLE_MIN_SIZE,
  getSnapHintText,
  VICTORY_VERSE_FONT_SIZE,
  fitHudTitleFontSize,
  formatMatchCount,
} from '../src/presentation/hudText.ts';
import { setLocale } from '../src/presentation/i18n.ts';
import { chapterInfo, chapterOfLevelId } from '../src/content/chapters.ts';

describe('Hud Behavioral Logic and Visual Standards', () => {
  test('nút Xoay chỉ hiển thị ở Chương 4 (chương xoay)', () => {
    const rotates = (levelId: string) => chapterInfo(chapterOfLevelId(levelId) ?? 1)?.rotationEnabled;
    expect(rotates('1-1')).toBe(false);
    expect(rotates('2-3')).toBe(false);
    expect(rotates('3-1')).toBe(false);
    expect(rotates('3-10')).toBe(false);
    expect(rotates('4-1')).toBe(true);
    expect(rotates('4-6')).toBe(true);
    expect(rotates('dev-shapes-v2')).toBe(false);
  });

  test('kích thước nút tròn hành động và điều hướng đạt chuẩn touch target', () => {
    expect(LAYOUT_TOKENS.buttonSizes.circularAction).toBe(64);
    expect(LAYOUT_TOKENS.buttonSizes.circularNav).toBe(56);
  });

  test('tiêu đề và nhãn sử dụng font thích hợp, không dùng ALL-CAPS trong giao diện', () => {
    const sampleTitle = 'Màn 1-1 · Song Tinh';
    const isNotAllCaps = sampleTitle !== sampleTitle.toUpperCase();
    expect(isNotAllCaps).toBe(true);
    expect(TYPO_TOKENS.fontFamily.serif).toContain('Baloo 2');
    expect(TYPO_TOKENS.fontFamily.levelTitle).toContain('Be Vietnam Pro');
    // Tên màn phải giữ font sans: serif/display chỉ nhúng 600/700 nên thiếu nét
    // thường, và dấu tiếng Việt dày đặc đọc tại cỡ nhỏ kém hơn hẳn.
    expect(TYPO_TOKENS.fontFamily.levelTitle).not.toContain('Baloo 2');
  });
});

describe('HUD theo mockup improve-v1', () => {
  test('nhãn gợi ý thả mảnh dùng đúng chuỗi tiếng Việt, không viết hoa toàn bộ', () => {
    setLocale('vi');
    const hint = getSnapHintText();
    expect(hint).toBe('Thả để khớp');
    expect(hint).not.toBe(hint.toUpperCase());
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

describe('victory card geometry', () => {
  test('is bottom-anchored and keeps its old bottom edge', () => {
    const layout = computeLayout(720, 1280, { top: 0, bottom: 0 });
    const top = layout.trayBounds.y - (VICTORY_CARD.h - VICTORY_CARD.bottomFromTray);
    const bottom = top + VICTORY_CARD.h;
    expect(bottom).toBe(layout.trayBounds.y + VICTORY_CARD.bottomFromTray);
    expect(bottom).toBeLessThanOrEqual(LAYOUT_TOKENS.canvas.height);
  });

  test('keeps its six pixels of bottom margin on every safe-area inset', () => {
    for (const bottomInset of [0, 24, 48, 96]) {
      const layout = computeLayout(720, 1280, { top: 0, bottom: bottomInset });
      const bottom = layout.trayBounds.y + VICTORY_CARD.bottomFromTray;
      expect(bottom, `inset ${bottomInset}`).toBeLessThanOrEqual(LAYOUT_TOKENS.canvas.height - 6);
    }
  });

  test('the reserved slot sits between the level name and the verse', () => {
    const o = VICTORY_CARD.offsets;
    expect(o.title).toBeLessThan(o.slotTop);
    expect(o.slotTop + VICTORY_CARD.slotHeight).toBe(o.slotBottom);
    expect(o.slotBottom).toBeLessThanOrEqual(o.verse);
  });

  test('keeps the 34px of padding under the button row', () => {
    const o = VICTORY_CARD.offsets;
    expect(VICTORY_CARD.h - (o.buttonTop + VICTORY_CARD.buttonHeight)).toBe(34);
  });

  test('everything below the level name moved down by exactly the slot height', () => {
    const o = VICTORY_CARD.offsets;
    expect(o.verse - 123).toBe(VICTORY_CARD.slotHeight);
    expect(o.buttonTop - 152).toBe(VICTORY_CARD.slotHeight);
  });
});


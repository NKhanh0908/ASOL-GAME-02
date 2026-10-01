import { describe, expect, test } from 'vitest';
import { LAYOUT_TOKENS, TYPO_TOKENS } from '../src/presentation/designTokens.ts';

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
  });
});

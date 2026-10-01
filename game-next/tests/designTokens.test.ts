import { describe, expect, test } from 'vitest';
import {
  COLOR_TOKENS,
  TYPO_TOKENS,
  LAYOUT_TOKENS,
  ANIM_TOKENS,
  DEPTH_TOKENS,
} from '../src/presentation/designTokens.ts';

describe('Design Tokens Validation', () => {
  test('chứa đúng 3 họ màu nghiêm ngặt và không chứa mã màu teal cũ', () => {
    expect(COLOR_TOKENS.navy.spaceBackground).toBe('#080E24');
    expect(COLOR_TOKENS.navy.steleSurface).toBe('#101B32');
    expect(COLOR_TOKENS.navy.deepModalBackdrop).toBe('#050A1A');

    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#68B8DC');
    expect(COLOR_TOKENS.iceGlass.bevelHighlight).toBe('#CFEFFF');
    expect(COLOR_TOKENS.iceGlass.bevelShadow).toBe('#3A5E78');

    expect(COLOR_TOKENS.amberGold.solidPrimary).toBe('#FFC857');
    expect(COLOR_TOKENS.amberGold.gridCoordinate).toBe('#D4A359');
    expect(COLOR_TOKENS.amberGold.glowHighlight).toBe('#FFE8A6');

    expect(COLOR_TOKENS.text.primary).toBe('#EEF4FA');
    expect(COLOR_TOKENS.text.secondary).toBe('#9DAFC7');

    const allColors = JSON.stringify(COLOR_TOKENS).toUpperCase();
    expect(allColors.includes('#4ECDC4')).toBe(false);
  });

  test('định nghĩa đúng thông số font và thời gian animation chuẩn', () => {
    expect(TYPO_TOKENS.fontFamily.serif).toContain('Playfair Display');
    expect(TYPO_TOKENS.fontFamily.sans).toContain('Be Vietnam Pro');
    expect(ANIM_TOKENS.duration.snapMs).toBe(120);
    expect(ANIM_TOKENS.duration.overlapInversionMs).toBe(150);
    expect(ANIM_TOKENS.duration.buttonTapMs).toBe(90);
  });

  test('định nghĩa các layer depth có thứ bậc hợp lý', () => {
    expect(DEPTH_TOKENS.backgroundSky).toBeLessThan(DEPTH_TOKENS.steleBoard);
    expect(DEPTH_TOKENS.steleBoard).toBeLessThan(DEPTH_TOKENS.boardGrid);
    expect(DEPTH_TOKENS.boardGrid).toBeLessThan(DEPTH_TOKENS.placedPieces);
    expect(DEPTH_TOKENS.placedPieces).toBeLessThan(DEPTH_TOKENS.modalOverlay);
  });
});

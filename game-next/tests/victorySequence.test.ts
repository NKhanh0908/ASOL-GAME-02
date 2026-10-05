import { describe, expect, test } from 'vitest';
import { VICTORY_CARD_GROUPS, victoryEndMs, victoryPlan } from '../src/presentation/feedback/victorySequence.ts';
import { VICTORY_TOKENS } from '../src/presentation/designTokens.ts';

describe('lịch chuỗi thắng (kéo dài 2800 ms)', () => {
  test.each([1, 2, 3, 6])('%i mảnh: kết thúc đúng 2800 ms, mảnh sáng trong 400–1200', (n) => {
    const plan = victoryPlan(n, false);
    expect(victoryEndMs(plan)).toBe(2800);
    expect(plan.lightStartsMs).toHaveLength(n);
    expect(plan.lightStartsMs[0]).toBe(400);
    expect(Math.max(...plan.lightStartsMs) + plan.lightMs).toBeLessThanOrEqual(1200);
  });

  test('3 mảnh cách nhau 120 ms', () => {
    expect(victoryPlan(3, false).lightStartsMs).toEqual([400, 520, 640]);
  });

  test('≤ 30 hạt; vòng xong trước 2800', () => {
    const plan = victoryPlan(3, false);
    expect(plan.particles).toBeLessThanOrEqual(30);
    expect(plan.burstAtMs + VICTORY_TOKENS.ringGapMs + VICTORY_TOKENS.ringMs).toBeLessThanOrEqual(2800);
  });

  test('thẻ thắng: 4 nhóm, nhóm cuối kết thúc ở 2800', () => {
    const plan = victoryPlan(2, false);
    expect(plan.cardAtMs + (VICTORY_CARD_GROUPS - 1) * plan.cardItemGapMs + plan.cardItemMs).toBe(2800);
  });

  test('Giảm chuyển động: 150 ms, không hạt/vòng/vệt/flash/trượt', () => {
    const plan = victoryPlan(3, true);
    expect(victoryEndMs(plan)).toBe(150);
    expect(plan).toMatchObject({
      particles: 0, rings: false, cameraFlash: false, traceMs: 0, lightStartsMs: [], skyDim: null, cardSlidePx: 0,
    });
  });
});

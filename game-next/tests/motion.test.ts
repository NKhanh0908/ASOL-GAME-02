import { afterEach, describe, expect, test } from 'vitest';
import {
  EASES,
  getMotionScale,
  isReducedMotion,
  scaleTiming,
  setMotionScale,
  stagger,
} from '../src/presentation/transitions/motion.ts';
import { TRANSITION_TOKENS } from '../src/presentation/designTokens.ts';

afterEach(() => setMotionScale(1));

describe('easing', () => {
  test.each(Object.keys(EASES) as Array<keyof typeof EASES>)('%s đi từ 0 tới 1', (name) => {
    expect(EASES[name](0)).toBeCloseTo(0, 9);
    expect(EASES[name](1)).toBeCloseTo(1, 9);
  });

  test('backOut vượt quá 1 ở giữa rồi về đúng 1', () => {
    expect(Math.max(...[0.6, 0.7, 0.8].map(EASES.backOut))).toBeGreaterThan(1);
  });

  test('quartOut giảm tốc: nửa đầu đi được nhiều hơn nửa sau', () => {
    const f = EASES.quartOut;
    expect(f(0)).toBeCloseTo(0, 9);
    expect(f(1)).toBeCloseTo(1, 9);
    // A decelerating ease covers most of the distance early.
    expect(f(0.5)).toBeGreaterThan(0.9);
  });

  test('quartOut đơn điệu tăng', () => {
    const f = EASES.quartOut;
    for (let i = 0; i < 20; i++) {
      expect(f((i + 1) / 20)).toBeGreaterThan(f(i / 20));
    }
  });

  test('quartOut giảm tốc mạnh hơn cubicOut', () => {
    // This is why it belongs to the heavier `glass` family.
    expect(EASES.quartOut(0.5)).toBeGreaterThan(EASES.cubicOut(0.5));
  });
});

describe('stagger', () => {
  test('phân bố đều trong khoảng, phần tử cuối đúng bằng span', () => {
    expect([0, 1, 2, 3].map((i) => stagger(i, 4, 180))).toEqual([0, 60, 120, 180]);
  });

  test('một phần tử hoặc span 0 thì không trễ', () => {
    expect(stagger(0, 1, 300)).toBe(0);
    expect(stagger(2, 5, 0)).toBe(0);
  });

  test('chỉ số ngoài khoảng bị kẹp, không vượt span', () => {
    expect(stagger(9, 4, 180)).toBe(180);
    expect(stagger(-1, 4, 180)).toBe(0);
  });
});

describe('hệ số chuyển động', () => {
  test('mặc định 1, Giảm chuyển động là 0', () => {
    expect(getMotionScale()).toBe(1);
    setMotionScale(0);
    expect(getMotionScale()).toBe(0);
    expect(isReducedMotion()).toBe(true);
  });

  test('giá trị dương bất kỳ quy về 1', () => {
    setMotionScale(0.4);
    expect(getMotionScale()).toBe(1);
  });

  test('scaleTiming giữ nguyên ở 1, về 0 khi Giảm chuyển động', () => {
    expect(scaleTiming(120, 1)).toBe(120);
    expect(scaleTiming(120, 0)).toBe(0);
  });
});

describe('TRANSITION_TOKENS', () => {
  test('bảy tuyến với tổng và handoff theo spec', () => {
    expect(TRANSITION_TOKENS.routes).toEqual({
      'menu-to-play': { totalMs: 1500, handoffMs: 200 },
      'map-to-play': { totalMs: 1500, handoffMs: 300 },
      'next-level': { totalMs: 1500, handoffMs: 800 },
      'play-to-map': { totalMs: 1000, handoffMs: 400 },
      'play-to-menu': { totalMs: 1000, handoffMs: 400 },
      'menu-to-map': { totalMs: 1000, handoffMs: 300 },
      'map-to-menu': { totalMs: 1000, handoffMs: 300 },
    });
    expect(TRANSITION_TOKENS.crossfadeMs).toBe(150);
    expect(TRANSITION_TOKENS.moodMs).toBe(1000);
  });
});

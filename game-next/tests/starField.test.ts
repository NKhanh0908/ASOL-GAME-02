import { describe, expect, test } from 'vitest';
import {
  generateStarField,
  twinkleAlpha,
  advanceDrift,
} from '../src/presentation/starField.ts';

const BOUNDS = { width: 720, height: 1280 };

describe('starField', () => {
  test('cùng seed cho cùng trường sao, khác seed cho trường khác', () => {
    const a = generateStarField(42, BOUNDS);
    const b = generateStarField(42, BOUNDS);
    const c = generateStarField(43, BOUNDS);

    expect(a).toEqual(b);
    expect(a.static[0]).not.toEqual(c.static[0]);
  });

  test('khoảng 120 sao tĩnh và 30 sao nhấp nháy, đúng tỉ lệ mockup', () => {
    const field = generateStarField(1, BOUNDS);
    expect(field.static).toHaveLength(120);
    expect(field.twinkling).toHaveLength(30);
    expect(field.static.every((s) => s.twinkles === false)).toBe(true);
    expect(field.twinkling.every((s) => s.twinkles === true)).toBe(true);
  });

  test('mọi sao nằm trong khung và có bán kính hợp lệ', () => {
    const field = generateStarField(7, BOUNDS);
    for (const star of [...field.static, ...field.twinkling]) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(BOUNDS.width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(BOUNDS.height);
      expect(star.r).toBeGreaterThanOrEqual(0.6);
      expect(star.r).toBeLessThanOrEqual(1.7 * 1.846);
      expect(['#FFFFFF', '#CFE6FF', '#FFE8B8']).toContain(star.color);
    }
  });

  test('độ sáng nhấp nháy dao động quanh alpha gốc và không bao giờ âm', () => {
    const [star] = generateStarField(3, BOUNDS).twinkling;
    const samples = Array.from({ length: 64 }, (_, i) => twinkleAlpha(star, i * 50));

    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    // Thật sự có dao động, không phải hằng số
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
  });

  test('chu kỳ nhấp nháy lặp lại sau 3.2 giây', () => {
    const [star] = generateStarField(5, BOUNDS).twinkling;
    expect(twinkleAlpha(star, 1000)).toBeCloseTo(twinkleAlpha(star, 1000 + 3200), 5);
  });

  test('sao trôi xuống và quấn vòng khi vượt mép dưới', () => {
    const star = { ...generateStarField(9, BOUNDS).static[0], y: 1270, driftSpeed: 0.2 };
    const next = advanceDrift(star, 100, BOUNDS.height);
    expect(next).toBeLessThan(100); // đã quấn về phía trên
    expect(next).toBeGreaterThanOrEqual(0);
  });
});

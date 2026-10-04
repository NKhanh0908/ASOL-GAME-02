import { describe, expect, it } from 'vitest';
import {
  computeDesignView,
  computeViewport,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MAX_DPR,
} from '../src/presentation/viewport.ts';

describe('computeViewport', () => {
  it('đặt bộ đệm bằng số pixel vật lý', () => {
    // Máy trong ảnh chụp thực tế: 1080x2460 vật lý, dpr 3.
    const vp = computeViewport(360, 820, 3);
    expect(vp.bufferWidth).toBe(1080);
    expect(vp.bufferHeight).toBe(2460);
  });

  it('kẹp dpr để bộ đệm không phình trên màn siêu nét', () => {
    const vp = computeViewport(360, 820, 4.5);
    expect(vp.dpr).toBe(MAX_DPR);
    expect(vp.bufferWidth).toBe(360 * MAX_DPR);
  });

  it('coi dpr dưới 1 hoặc không hợp lệ là 1', () => {
    expect(computeViewport(360, 820, 0).dpr).toBe(1);
    expect(computeViewport(360, 820, Number.NaN).dpr).toBe(1);
  });

  it('làm tròn bộ đệm về pixel nguyên', () => {
    const vp = computeViewport(411.43, 867.43, 2.625);
    expect(Number.isInteger(vp.bufferWidth)).toBe(true);
    expect(Number.isInteger(vp.bufferHeight)).toBe(true);
  });

  it('quy đổi một đơn vị thiết kế ra đúng số pixel vật lý', () => {
    const vp = computeViewport(360, 820, 3);
    expect(vp.designScale).toBeCloseTo(1080 / DESIGN_WIDTH);
  });

  it('lùi về khung thiết kế khi kích thước cửa sổ vô nghĩa', () => {
    const vp = computeViewport(0, 0, 1);
    expect(vp.cssWidth).toBe(DESIGN_WIDTH);
    expect(vp.cssHeight).toBe(DESIGN_HEIGHT);
  });
});

describe('computeDesignView', () => {
  it('trả đúng khung thiết kế trên màn 9:16', () => {
    const view = computeDesignView(720, 1280);
    expect(view).toEqual({ x: 0, y: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT });
  });

  it('lộ thêm vùng trên và dưới trên màn dài, căn giữa khung', () => {
    const view = computeDesignView(1080, 2460);
    expect(view.width).toBe(DESIGN_WIDTH);
    expect(view.height).toBeCloseTo(1640);
    // Khung 1280 nằm giữa vùng cao 1640 -> dư 180 mỗi đầu.
    expect(view.y).toBeCloseTo(-180);
    expect(view.y + view.height).toBeCloseTo(DESIGN_HEIGHT + 180);
  });

  it('giữ khung cân đối: phần lộ trên bằng phần lộ dưới', () => {
    const view = computeDesignView(1080, 2340);
    expect(-view.y).toBeCloseTo(view.y + view.height - DESIGN_HEIGHT);
  });

  it('cắt bớt hai đầu khung trên màn ngắn hơn 9:16', () => {
    const view = computeDesignView(1080, 1440);
    expect(view.height).toBeLessThan(DESIGN_HEIGHT);
    expect(view.y).toBeGreaterThan(0);
  });
});

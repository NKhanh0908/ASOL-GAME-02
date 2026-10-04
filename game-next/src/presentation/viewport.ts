/**
 * Cầu nối giữa màn hình thật và hệ toạ độ thiết kế 720x1280.
 *
 * Thuần, không import Phaser, nên vitest nạp được trực tiếp.
 *
 * Bối cảnh: Phaser 3 không nhân `devicePixelRatio` cho canvas. Để mặc định thì
 * bộ đệm vẽ đúng 720x1280 rồi bị CSS kéo lên 1080 pixel vật lý — mọi nét đều
 * qua một lần nội suy. Ta tự đặt bộ đệm bằng đúng số pixel vật lý, rồi trả hệ
 * toạ độ thiết kế lại cho scene bằng camera zoom.
 */

/** Bề ngang hệ toạ độ thiết kế. Mọi scene vẫn vẽ trong khung này. */
export const DESIGN_WIDTH = 720;

/** Bề cao hệ toạ độ thiết kế. */
export const DESIGN_HEIGHT = 1280;

/**
 * Chặn trên của devicePixelRatio.
 *
 * Máy 4K báo dpr 4 trở lên; nhân nguyên si thì bộ đệm vượt 30 triệu pixel,
 * tốn VRAM và tụt khung hình mà mắt không phân biệt nổi. 3 đã vượt ngưỡng
 * nhận biết trên màn điện thoại.
 */
export const MAX_DPR = 3;

export type Viewport = {
  /** Bề ngang vùng hiển thị theo pixel CSS */
  cssWidth: number;
  /** Bề cao vùng hiển thị theo pixel CSS */
  cssHeight: number;
  /** devicePixelRatio đã kẹp về [1, MAX_DPR] */
  dpr: number;
  /** Bề ngang bộ đệm vẽ, tính bằng pixel vật lý */
  bufferWidth: number;
  /** Bề cao bộ đệm vẽ, tính bằng pixel vật lý */
  bufferHeight: number;
  /** Hệ số quy đổi một đơn vị thiết kế ra bao nhiêu pixel vật lý */
  designScale: number;
};

/**
 * Quy đổi kích thước hiển thị thành thông số bộ đệm.
 *
 * Tách khỏi `readViewport` để test được mà không cần `window`.
 */
export function computeViewport(cssWidth: number, cssHeight: number, rawDpr: number): Viewport {
  const safeCssWidth = cssWidth > 0 ? cssWidth : DESIGN_WIDTH;
  const safeCssHeight = cssHeight > 0 ? cssHeight : DESIGN_HEIGHT;
  const dpr = clamp(Number.isFinite(rawDpr) && rawDpr > 0 ? rawDpr : 1, 1, MAX_DPR);

  // Làm tròn: bộ đệm lẻ nửa pixel khiến canvas bị nội suy lại đúng thứ ta đang tránh.
  const bufferWidth = Math.round(safeCssWidth * dpr);
  const bufferHeight = Math.round(safeCssHeight * dpr);

  return {
    cssWidth: safeCssWidth,
    cssHeight: safeCssHeight,
    dpr,
    bufferWidth,
    bufferHeight,
    designScale: bufferWidth / DESIGN_WIDTH,
  };
}

/** Đọc kích thước thật của cửa sổ. Chỉ gọi được trong trình duyệt. */
export function readViewport(): Viewport {
  return computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio);
}

/** Vùng toạ độ thiết kế mà camera thật sự nhìn thấy. */
export type DesignView = { x: number; y: number; width: number; height: number };

/**
 * Khung thiết kế rộng đúng 720 và được căn giữa theo chiều dọc, nên màn hình
 * dài hơn 9:16 sẽ lộ thêm một dải phía trên và một dải phía dưới khung.
 *
 * Trả về vùng nhìn thấy để nền trời phủ kín được phần lộ ra — không phủ thì
 * chỗ đó là màu nền trơn, lộ rõ ranh giới khung.
 */
export function computeDesignView(bufferWidth: number, bufferHeight: number): DesignView {
  if (bufferWidth <= 0 || bufferHeight <= 0) {
    return { x: 0, y: 0, width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
  }
  const height = (bufferHeight * DESIGN_WIDTH) / bufferWidth;
  return {
    x: 0,
    y: (DESIGN_HEIGHT - height) / 2,
    width: DESIGN_WIDTH,
    height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

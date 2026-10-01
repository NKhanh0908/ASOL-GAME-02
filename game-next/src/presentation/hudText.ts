/**
 * Chuỗi và định dạng của HUD.
 *
 * Tách khỏi Hud.ts vì file đó import Phaser, mà Phaser cần `window` nên
 * không nạp được trong vitest. Phần thuần nằm riêng thì test được trực tiếp.
 */

/** Nhãn nổi cạnh mảnh khi kéo trúng vùng hít */
export const SNAP_HINT_TEXT = 'Thả để khớp';

/** Nội dung thanh đếm ở đáy màn chơi */
export function formatMatchCount(matched: number, total: number): string {
  return `${matched}/${total} mảnh đã khớp`;
}

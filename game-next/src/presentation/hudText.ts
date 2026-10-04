/**
 * Chuỗi và định dạng của HUD.
 *
 * Tách khỏi Hud.ts vì file đó import Phaser, mà Phaser cần `window` nên
 * không nạp được trong vitest. Phần thuần nằm riêng thì test được trực tiếp.
 */
import { t } from './i18n.ts';

/** Nhãn nổi cạnh mảnh khi kéo trúng vùng hít */
export const SNAP_HINT_TEXT = 'Thả để khớp';

export function getSnapHintText(): string {
  return t('snap_hint');
}

/** Bề ngang an toàn giữa vùng chạm của hai nút header, đã chừa lề 16px mỗi bên. */
export const HUD_LEVEL_TITLE_MAX_WIDTH = 448;

/** Không co tên màn nhỏ hơn phụ đề quá nhiều. */
export const HUD_LEVEL_TITLE_MIN_SIZE = 32;

/** Cỡ chữ gọn để câu thơ hai dòng không chạm tên màn hoặc hàng nút. */
export const VICTORY_VERSE_FONT_SIZE = 18;

/**
 * Co một dòng tiêu đề theo chiều rộng Phaser vừa đo ở cỡ 52px.
 * Phép co tỉ lệ giữ tên ngắn ở kích thước thiết kế và chặn tên dài trong header.
 */
export function fitHudTitleFontSize(
  renderedWidth: number,
  preferredSize = 52,
  maxWidth = HUD_LEVEL_TITLE_MAX_WIDTH,
  minSize = HUD_LEVEL_TITLE_MIN_SIZE
): number {
  if (!Number.isFinite(renderedWidth) || renderedWidth <= maxWidth) return preferredSize;
  return Math.max(minSize, Math.floor(preferredSize * maxWidth / renderedWidth));
}

/** Nội dung thanh đếm ở đáy màn chơi */
export function formatMatchCount(matched: number, total: number): string {
  return t('match_count', { matched, total });
}

/** Nhãn của màn hoàn thành */
export const VICTORY_LABELS = {
  title: 'Hoàn thành',
  next: 'Màn tiếp theo',
  levelSelect: 'Chọn màn',
} as const;

export function getVictoryLabels() {
  return {
    title: t('victory_title'),
    next: t('victory_next'),
    levelSelect: t('victory_level_select'),
  };
}

/** Chỉ số tiến độ ở header màn chọn màn, ví dụ "1/18" */
export function formatProgress(completed: number, total: number): string {
  return `${completed}/${total}`;
}

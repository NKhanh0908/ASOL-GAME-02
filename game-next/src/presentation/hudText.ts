/**
 * Chuỗi và định dạng của HUD.
 *
 * Tách khỏi Hud.ts vì file đó import Phaser, mà Phaser cần `window` nên
 * không nạp được trong vitest. Phần thuần nằm riêng thì test được trực tiếp.
 */
import { getChapterName, getLevelTitle, t } from './i18n.ts';
import type { Chapter } from '../domain/model.ts';

/**
 * Nhãn nổi cạnh mảnh khi kéo trúng vùng hít.
 *
 * Là hàm chứ không phải hằng số: hằng số bị cố định ở thời điểm nạp module nên
 * đổi ngôn ngữ xong vẫn ra chuỗi cũ. Bản tiếng Việt nằm trong `i18n.ts`.
 */
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

/** Nhãn của màn hoàn thành. Gọi lúc dựng, xem ghi chú ở `getSnapHintText`. */
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

/**
 * Current-node label, split into its two lines. UI copy stays plain and the
 * decoration lives in the visuals, so neither line carries an ornament.
 */
export function formatNodeLabel(
  id: string,
  title: string,
  chapter: Chapter
): { name: string; locator: string } {
  return {
    name: getLevelTitle(id, title),
    locator: `${id} · ${getChapterName(chapter)}`,
  };
}


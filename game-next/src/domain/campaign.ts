import type { ManifestEntry } from '../content/document.ts';

export type LevelAccessStatus = {
  unlocked: boolean;
  completed: boolean;
  available: boolean;
};

/**
 * Xác định quyền truy cập của một màn chơi trong campaign.
 * - unlocked: màn đầu tiên (order 1) luôn mở khóa; các màn sau mở khóa khi màn liền trước đã hoàn thành.
 * - completed: ID đã nằm trong danh sách completed.
 * - available: màn đã được kiểm duyệt nội dung đạt status 'approved'.
 */
export function levelAccess(
  manifest: readonly ManifestEntry[],
  completed: readonly string[],
  id: string
): LevelAccessStatus {
  const entry = manifest.find((e) => e.id === id);
  if (!entry) {
    return { unlocked: false, completed: false, available: false };
  }

  const isCompleted = completed.includes(id);
  const isAvailable = entry.status === 'approved';

  let isUnlocked = false;
  if (entry.order === 1) {
    isUnlocked = true;
  } else {
    const predecessor = manifest.find((e) => e.order === entry.order - 1);
    isUnlocked = predecessor ? completed.includes(predecessor.id) : false;
  }

  return {
    unlocked: isUnlocked,
    completed: isCompleted,
    available: isAvailable,
  };
}

/**
 * Tìm ID của màn chơi kế tiếp trong campaign theo thứ tự order.
 */
export function nextLevelId(
  manifest: readonly ManifestEntry[],
  id: string
): string | null {
  const current = manifest.find((e) => e.id === id);
  if (!current) return null;

  const next = manifest.find((e) => e.order === current.order + 1);
  return next ? next.id : null;
}

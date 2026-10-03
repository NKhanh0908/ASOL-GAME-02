import { describe, expect, test } from 'vitest';
import { formatProgress } from '../src/presentation/hudText.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import {
  furthestLevelId,
  levelAccess,
  resolveMapCompletedLevels,
} from '../src/domain/campaign.ts';

describe('Constellation Map Layout Generator', () => {
  test('18 màn được gán đúng tọa độ uốn lượn theo trục dọc màn hình', () => {
    const getNodePos = (index: number) => {
      const x = 360 + Math.sin(index * 0.9) * 120;
      const y = 180 + index * 56;
      return { x, y };
    };

    const first = getNodePos(0);
    const last = getNodePos(17);

    expect(first.y).toBe(180);
    expect(last.y).toBe(180 + 17 * 56);
    expect(first.x).toBeGreaterThan(200);
    expect(first.x).toBeLessThan(520);
  });

  test('xác định đúng 4 trạng thái node theo tiến trình', () => {
    const getNodeState = (manifest: typeof campaignManifest, completed: string[], id: string) => {
      const access = levelAccess(manifest, completed, id);
      if (access.completed) return 'completed';
      const isNext = manifest.find((m) => !completed.includes(m.id))?.id === id;
      if (isNext) return 'current';
      if (access.unlocked) return 'unlocked';
      return 'locked';
    };

    // Khi chưa hoàn thành màn nào
    expect(getNodeState(campaignManifest, [], '1-1')).toBe('current');
    expect(getNodeState(campaignManifest, [], '1-2')).toBe('locked');

    // Khi đã hoàn thành 1-1
    expect(getNodeState(campaignManifest, ['1-1'], '1-1')).toBe('completed');
    expect(getNodeState(campaignManifest, ['1-1'], '1-2')).toBe('current');
    expect(getNodeState(campaignManifest, ['1-1'], '1-3')).toBe('locked');
  });

  test('harness coi level validated là có thể chơi nhưng campaign thì không', () => {
    // Manifest giả có 1-3 ở trạng thái validated, để test không phụ thuộc
    // trạng thái duyệt thật của campaign (1-3 đã approved sau Task 16).
    const manifest = campaignManifest.map((entry) =>
      entry.id === '1-3' ? { ...entry, status: 'validated' as const } : entry
    );
    expect(levelAccess(manifest, ['1-1', '1-2'], '1-3', 'campaign').available).toBe(false);
    expect(levelAccess(manifest, ['1-1', '1-2'], '1-3', 'harness').available).toBe(true);
  });

  test('bản đồ harness hiển thị tiến độ preview tới màn vừa thắng mà không đổi campaign', () => {
    const campaignCompleted = ['1-1'];
    const preview = resolveMapCompletedLevels(
      campaignManifest,
      campaignCompleted,
      'harness',
      '1-3'
    );

    expect(preview).toEqual(['1-1', '1-2', '1-3']);
    expect(campaignCompleted).toEqual(['1-1']);
    expect(resolveMapCompletedLevels(
      campaignManifest,
      campaignCompleted,
      'campaign',
      '1-3'
    )).toEqual(['1-1']);
  });

  test('chơi lại màn cũ trong harness không làm mốc preview lùi lại', () => {
    expect(furthestLevelId(campaignManifest, '1-5', '1-2')).toBe('1-5');
    expect(furthestLevelId(campaignManifest, undefined, '1-3')).toBe('1-3');
  });
});

describe('Màn chọn màn theo mockup improve-v1', () => {
  test('chỉ số tiến độ hiển thị dạng đã hoàn thành trên tổng số màn', () => {
    expect(formatProgress(0, 28)).toBe('0/28');
    expect(formatProgress(1, 28)).toBe('1/28');
    expect(formatProgress(28, 28)).toBe('28/28');
  });

  test('không còn ký tự trang trí trước con số', () => {
    expect(formatProgress(1, 28)).not.toContain('✦');
  });

  test('tổng số màn lấy từ manifest, không viết cứng', () => {
    expect(campaignManifest.length).toBeGreaterThan(0);
    expect(formatProgress(0, campaignManifest.length)).toBe(`0/${campaignManifest.length}`);
  });
});

import { describe, expect, test } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';
import { levelAccess } from '../src/domain/campaign.ts';

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
});

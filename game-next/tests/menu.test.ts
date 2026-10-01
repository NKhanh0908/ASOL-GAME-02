import { describe, expect, test } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';
import { levelAccess } from '../src/domain/campaign.ts';

describe('Menu Campaign Navigation and Chapter Grouping', () => {
  test('18 màn được phân bố đều vào 3 chương (mỗi chương 6 màn)', () => {
    const ch1 = campaignManifest.filter((m) => m.chapter === 1);
    const ch2 = campaignManifest.filter((m) => m.chapter === 2);
    const ch3 = campaignManifest.filter((m) => m.chapter === 3);

    expect(ch1.length).toBe(6);
    expect(ch2.length).toBe(6);
    expect(ch3.length).toBe(6);
    expect(ch1[0].id).toBe('1-1');
    expect(ch3[5].id).toBe('3-6');
  });

  test('trạng thái hiển thị menu trước khi chơi: 1-1 mở, 1-2 chưa mở', () => {
    const access1 = levelAccess(campaignManifest, [], '1-1');
    expect(access1.unlocked).toBe(true);
    expect(access1.completed).toBe(false);

    const access2 = levelAccess(campaignManifest, [], '1-2');
    expect(access2.unlocked).toBe(false);
  });

  test('sau khi hoàn thành 1-1: 1-1 là completed, 1-2 là unlocked nhưng available false (đang hoàn thiện)', () => {
    const access1 = levelAccess(campaignManifest, ['1-1'], '1-1');
    expect(access1.completed).toBe(true);

    const access2 = levelAccess(campaignManifest, ['1-1'], '1-2');
    expect(access2.unlocked).toBe(true);
    expect(access2.available).toBe(false); // Vì 1-2 đang ở status 'planned'
  });

  test('xác định đúng màn chơi kế tiếp cần tiếp tục từ danh sách đã hoàn thành', () => {
    const resolveNextLevel = (completed: readonly string[]) => {
      const next = campaignManifest.find((m) => !completed.includes(m.id));
      return next ?? campaignManifest[0];
    };

    expect(resolveNextLevel([]).id).toBe('1-1');
    expect(resolveNextLevel(['1-1']).id).toBe('1-2');
  });
});

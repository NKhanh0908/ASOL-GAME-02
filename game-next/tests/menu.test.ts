import { describe, expect, test } from 'vitest';
import { COLOR_TOKENS, TYPO_TOKENS } from '../src/presentation/designTokens.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { levelAccess, resolveNextCampaignLevel } from '../src/domain/campaign.ts';

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

  test('xác định đúng màn chơi kế tiếp an toàn (chỉ chọn màn approved, không trỏ vào màn planned gây crash)', () => {
    const res0 = resolveNextCampaignLevel(campaignManifest, []);
    expect(res0.level.id).toBe('1-1');
    expect(res0.type).toBe('start');

    // Sau khi đã chơi xong 1-1, vì 1-2 đang ở status 'planned', hệ thống an toàn trỏ về chơi lại 1-1
    const res1 = resolveNextCampaignLevel(campaignManifest, ['1-1']);
    expect(res1.level.id).toBe('1-1');
    expect(res1.type).toBe('replay');
  });
});

describe('Màn chính theo mockup improve-v1', () => {
  test('màu nền canvas khớp chặng đầu của gradient trời', () => {
    expect(COLOR_TOKENS.sky.stops[0]).toBe('#1A2470');
  });

  test('tiêu đề game dùng cỡ chữ hero của bộ token', () => {
    expect(TYPO_TOKENS.fontSize.heroTitle).toBe('52px');
  });
});

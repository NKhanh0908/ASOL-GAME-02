import { describe, expect, it } from 'vitest';
import { createCampaignProgress } from './campaignProgress';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

describe('campaign progress', () => {
  it('opens levels sequentially and keeps completed levels replayable after reload', () => {
    const storage = memoryStorage();
    const progress = createCampaignProgress(storage);
    expect(progress.isUnlocked('1-1')).toBe(true);
    expect(progress.isUnlocked('1-2')).toBe(false);
    progress.complete('1-1');
    const reloaded = createCampaignProgress(storage);
    expect(reloaded.isCompleted('1-1')).toBe(true);
    expect(reloaded.isUnlocked('1-1')).toBe(true);
    expect(reloaded.isUnlocked('1-2')).toBe(true);
    expect(reloaded.isUnlocked('1-3')).toBe(false);
  });

  it('recovers from invalid storage without opening locked levels', () => {
    const storage = memoryStorage();
    storage.setItem('mirror.campaign-progress.v1', '{broken');
    const progress = createCampaignProgress(storage);
    expect(progress.load()).toEqual({ completed: [], recovered: true });
    expect(progress.isUnlocked('1-2')).toBe(false);
  });

  it('does not accept unknown level IDs as campaign progress', () => {
    const progress = createCampaignProgress(memoryStorage());
    progress.complete('custom-one');
    expect(progress.load().completed).toEqual([]);
  });
});

import { describe, expect, test } from 'vitest';
import { TEXTURE_KEYS } from '../src/presentation/TextureFactory.ts';

describe('TextureFactory Constants and Keys', () => {
  test('chứa đầy đủ các khóa texture cần thiết cho toàn bộ UI', () => {
    expect(TEXTURE_KEYS.steleBorder).toBe('stele_border_9slice');
    expect(TEXTURE_KEYS.btnCircle64).toBe('btn_circle_64');
    expect(TEXTURE_KEYS.btnCircle56).toBe('btn_circle_56');
    expect(TEXTURE_KEYS.iconReset).toBe('icon_reset');
    expect(TEXTURE_KEYS.iconRotate).toBe('icon_rotate');
    expect(TEXTURE_KEYS.iconGear).toBe('icon_gear');
    expect(TEXTURE_KEYS.nodeCurrent).toBe('node_current');
    expect(TEXTURE_KEYS.nodeCompleted).toBe('node_completed');
    expect(TEXTURE_KEYS.nodeUnlocked).toBe('node_unlocked');
    expect(TEXTURE_KEYS.nodeLocked).toBe('node_locked');
  });
});

import { describe, expect, test } from 'vitest';
import { resolveLaunch } from '../src/launchParams.ts';

describe('resolveLaunch', () => {
  test('mặc định mở menu', () => {
    expect(resolveLaunch('', true)).toEqual({ scene: 'MenuScene' });
  });

  test('chọn màn chơi, mặc định 1-1 ở campaign', () => {
    expect(resolveLaunch('?scene=play', false)).toEqual({ scene: 'PlayScene', levelId: '1-1', mode: 'campaign' });
    expect(resolveLaunch('?scene=play&level=1-3', false)).toEqual({ scene: 'PlayScene', levelId: '1-3', mode: 'campaign' });
  });

  test('harness chỉ bật ở dev', () => {
    expect(resolveLaunch('?scene=play&level=1-3&mode=harness', true)).toEqual({
      scene: 'PlayScene', levelId: '1-3', mode: 'harness',
    });
    expect(resolveLaunch('?scene=play&level=1-3&mode=harness', false)).toEqual({
      scene: 'PlayScene', levelId: '1-3', mode: 'campaign',
    });
  });

  test('mở thẳng màn chọn màn', () => {
    expect(resolveLaunch('?scene=levelSelect', false)).toEqual({ scene: 'LevelSelectScene' });
  });

  test('focus cuộn bản đồ tới một màn, chỉ ở dev', () => {
    expect(resolveLaunch('?scene=levelSelect&focus=3-4', true)).toEqual({ scene: 'LevelSelectScene', focusLevelId: '3-4' });
    expect(resolveLaunch('?scene=levelSelect&focus=3-4', false)).toEqual({ scene: 'LevelSelectScene' });
    expect(resolveLaunch('?scene=levelSelect', true)).toEqual({ scene: 'LevelSelectScene' });
  });
});

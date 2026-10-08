export type LaunchTarget =
  | { scene: 'MenuScene'; skipSplash?: boolean }
  | { scene: 'LevelSelectScene'; focusLevelId?: string }
  | { scene: 'PlayScene'; levelId: string; mode: 'campaign' | 'harness' };

/**
 * Đọc tham số URL lúc khởi động. Harness cho phép chơi thử màn validated,
 * nên chỉ có hiệu lực ở dev; bản build luôn dùng campaign với màn approved.
 */
export function resolveLaunch(search: string, isDev: boolean): LaunchTarget {
  const params = new URLSearchParams(search);
  const scene = params.get('scene');
  if (scene === 'play') {
    const levelId = params.get('level') ?? '1-1';
    const mode = isDev && params.get('mode') === 'harness' ? 'harness' : 'campaign';
    return { scene: 'PlayScene', levelId, mode };
  }
  if (scene === 'levelSelect') {
    // focus chỉ dùng ở dev để chụp ảnh một chòm sao bất kỳ
    const focus = params.get('focus');
    return isDev && focus ? { scene: 'LevelSelectScene', focusLevelId: focus } : { scene: 'LevelSelectScene' };
  }
  const skipSplash = params.get('skipSplash') === '1' || params.get('scene') === 'menu';
  return { scene: 'MenuScene', skipSplash };
}

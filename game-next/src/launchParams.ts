export type LaunchTarget =
  | { scene: 'MenuScene' }
  | { scene: 'LevelSelectScene' }
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
    return { scene: 'LevelSelectScene' };
  }
  return { scene: 'MenuScene' };
}

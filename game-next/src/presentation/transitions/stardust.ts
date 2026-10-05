import type { Point } from './routes.ts';

/** Giới hạn hạt bụi sao của GDD (mục 3.4) */
export const STARDUST_MAX = 30;

export type DustParticle = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
  color: number;
  /** Cố định khi sinh; không random lại mỗi khung hình */
  alpha: number;
};

const DUST_COLORS = [0xffd166, 0xf9c74f, 0x4ecdc4, 0xffffff] as const;

/** Hạt sinh quanh tâm các mảnh, bay vào `center`. */
export function planStardust(
  sources: readonly Point[],
  center: Point,
  count: number,
  random: () => number = Math.random,
  spreadPx = 60
): DustParticle[] {
  if (sources.length === 0) return [];
  const n = Math.min(STARDUST_MAX, Math.max(0, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => {
    const source = sources[i % sources.length];
    const angle = random() * Math.PI * 2;
    const dist = random() * spreadPx;
    return {
      x0: source.x + Math.cos(angle) * dist,
      y0: source.y + Math.sin(angle) * dist,
      x1: center.x,
      y1: center.y,
      radius: 1.5 + random() * 2,
      color: DUST_COLORS[i % DUST_COLORS.length],
      alpha: 0.7 + random() * 0.3,
    };
  });
}

/** Vị trí tại tiến độ t: sáng dần rồi tắt khi tới tâm. */
export function dustAt(p: DustParticle, t: number): { x: number; y: number; alpha: number; radius: number } {
  return {
    x: p.x0 + (p.x1 - p.x0) * t,
    y: p.y0 + (p.y1 - p.y0) * t,
    alpha: p.alpha * Math.sin(Math.PI * t),
    radius: p.radius * (1 - 0.5 * t),
  };
}

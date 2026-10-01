import { COLOR_TOKENS, ANIM_TOKENS } from './designTokens.ts';

export type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
  twinkles: boolean;
  /** Lệch pha trong chu kỳ nhấp nháy, tính bằng mili giây */
  phaseMs: number;
  /** Tốc độ trôi xuống, pixel mỗi mili giây */
  driftSpeed: number;
};

export type StarField = {
  static: Star[];
  twinkling: Star[];
};

const STATIC_COUNT = 120;
const TWINKLING_COUNT = 30;

/** Hệ số quy đổi từ canvas mockup 390 rộng sang canvas game 720 rộng */
const MOCKUP_SCALE = 1.846;

const STAR_COLORS = [
  COLOR_TOKENS.sky.starWhite,
  COLOR_TOKENS.sky.starBlue,
  COLOR_TOKENS.sky.starWarm,
];

/**
 * Mulberry32: bộ sinh số giả ngẫu nhiên 32-bit, nhỏ và tái lập được.
 * Cần tái lập để test và ảnh chụp so sánh cho kết quả ổn định.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStar(
  rand: () => number,
  bounds: { width: number; height: number },
  twinkles: boolean
): Star {
  return {
    x: rand() * bounds.width,
    y: rand() * bounds.height,
    r: (0.6 + rand() * 1.1) * MOCKUP_SCALE,
    alpha: 0.45 + rand() * 0.54,
    color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
    twinkles,
    phaseMs: rand() * ANIM_TOKENS.duration.twinkleCycleMs,
    driftSpeed: 0.006 + rand() * 0.009,
  };
}

export function generateStarField(
  seed: number,
  bounds: { width: number; height: number }
): StarField {
  const rand = mulberry32(seed);
  return {
    static: Array.from({ length: STATIC_COUNT }, () => makeStar(rand, bounds, false)),
    twinkling: Array.from({ length: TWINKLING_COUNT }, () => makeStar(rand, bounds, true)),
  };
}

/**
 * Độ sáng của một sao nhấp nháy tại thời điểm elapsedMs.
 * Mockup dùng keyframe 0%/100% ở .25 và 50% ở 1 — tức sin toàn phần.
 */
export function twinkleAlpha(star: Star, elapsedMs: number): number {
  const cycle = ANIM_TOKENS.duration.twinkleCycleMs;
  const t = ((elapsedMs + star.phaseMs) % cycle) / cycle;
  const wave = (1 - Math.cos(t * Math.PI * 2)) / 2; // 0 .. 1
  const value = 0.25 + wave * 0.75;
  return Math.max(0, Math.min(1, value * star.alpha + value * (1 - star.alpha) * 0.4));
}

/** Toạ độ y mới sau khi trôi xuống, quấn vòng lên đỉnh khi vượt mép dưới. */
export function advanceDrift(star: Star, deltaMs: number, height: number): number {
  const next = star.y + star.driftSpeed * deltaMs;
  return next > height ? next - height : next;
}

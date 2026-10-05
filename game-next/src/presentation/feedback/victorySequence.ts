import { VICTORY_TOKENS } from '../designTokens.ts';
import { stagger } from '../transitions/motion.ts';

/** Nhãn, tên màn, câu thơ, hàng nút */
export const VICTORY_CARD_GROUPS = 4;

export type VictoryPlan = {
  totalMs: number;
  skyDim: { atMs: number; ms: number; extra: number } | null;
  lightStartsMs: number[];
  lightMs: number;
  lightPeak: number;
  traceAtMs: number;
  traceMs: number;
  burstAtMs: number;
  particles: number;
  particleMs: number;
  rings: boolean;
  cameraFlash: boolean;
  frameAtMs: number;
  frameMs: number;
  trayFadeMs: number;
  cardAtMs: number;
  cardMs: number;
  cardSlidePx: number;
  cardItemGapMs: number;
  cardItemMs: number;
};

export function victoryPlan(pieceCount: number, reduced: boolean): VictoryPlan {
  const T = VICTORY_TOKENS;
  if (reduced) {
    const ms = T.reducedMs;
    return {
      totalMs: ms,
      skyDim: null,
      lightStartsMs: [],
      lightMs: 0,
      lightPeak: 0,
      traceAtMs: 0,
      traceMs: 0,
      burstAtMs: 0,
      particles: 0,
      particleMs: 0,
      rings: false,
      cameraFlash: false,
      frameAtMs: 0,
      frameMs: ms,
      trayFadeMs: ms,
      cardAtMs: 0,
      cardMs: ms,
      cardSlidePx: 0,
      cardItemGapMs: 0,
      cardItemMs: ms,
    };
  }
  // Nhiều mảnh thì thu khoảng cách để mảnh cuối vẫn tắt trước 900 ms
  const span = Math.min(T.lightGapMs * Math.max(0, pieceCount - 1), T.lightsEndMs - T.lightsAtMs - T.lightMs);
  return {
    totalMs: T.totalMs,
    skyDim: { atMs: T.skyDimAtMs, ms: T.skyDimMs, extra: T.skyDimExtra },
    lightStartsMs: Array.from({ length: pieceCount }, (_, i) => T.lightsAtMs + stagger(i, pieceCount, span)),
    lightMs: T.lightMs,
    lightPeak: T.lightPeak,
    traceAtMs: T.traceAtMs,
    traceMs: T.traceMs,
    burstAtMs: T.burstAtMs,
    particles: T.particles,
    particleMs: T.particleMs,
    rings: true,
    cameraFlash: true,
    frameAtMs: T.frameAtMs,
    frameMs: T.frameMs,
    trayFadeMs: T.trayFadeMs,
    cardAtMs: T.cardAtMs,
    cardMs: T.cardMs,
    cardSlidePx: T.cardSlidePx,
    cardItemGapMs: T.cardItemGapMs,
    cardItemMs: T.cardMs - T.cardItemGapMs * (VICTORY_CARD_GROUPS - 1),
  };
}

export function victoryEndMs(plan: VictoryPlan): number {
  const T = VICTORY_TOKENS;
  return Math.max(
    ...plan.lightStartsMs.map((s) => s + plan.lightMs),
    plan.traceAtMs + plan.traceMs,
    plan.rings ? plan.burstAtMs + T.ringGapMs + T.ringMs : 0,
    plan.burstAtMs + plan.particleMs,
    plan.frameAtMs + Math.max(plan.frameMs, plan.trayFadeMs),
    plan.cardAtMs + plan.cardMs,
    plan.cardAtMs + (VICTORY_CARD_GROUPS - 1) * plan.cardItemGapMs + plan.cardItemMs
  );
}

export const COLOR_TOKENS = {
  /** Gradient trời bốn chặng, từ trên xuống dưới */
  sky: {
    stops: ['#1A2470', '#1E2A80', '#24307F', '#1B2563'],
    stopOffsets: [0, 0.45, 0.78, 1],
    nebulaBlue: '#7FB8FF',
    nebulaPink: '#FF9FD2',
    moonCore: '#FFF4D6',
    moonHalo: '#FFE3A3',
    starWhite: '#FFFFFF',
    starBlue: '#CFE6FF',
    starWarm: '#FFE8B8',
  },
  board: {
    surfaceTop: '#1D3482',
    surfaceBottom: '#14215E',
    innerGlow: '#7DB7FF',
  },
  iceGlass: {
    primaryBorder: '#A9E3FF',
    bevelHighlight: '#CFEFFF',
    bevelShadow: '#3A5E78',
    buttonFillTop: '#3D5FC0',
    buttonFillBottom: '#1B2A72',
  },
  amberGold: {
    solidPrimary: '#FFC857',
    gridCoordinate: '#FFD27A',
    glowHighlight: '#FFE8A6',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#CFE3FF',
    onAmber: '#3A2300',
  },
  danger: {
    warningText: '#E65A5A',
    confirmBg: '#5A1A1A',
  },
  modal: {
    backdrop: '#050A1A',
  },
} as const;

export const COLOR_NUMBERS = {
  skyTop: 0x1a2470,
  skyBottom: 0x1b2563,
  boardSurfaceTop: 0x1d3482,
  boardSurfaceBottom: 0x14215e,
  navyBackdrop: 0x050a1a,
  icePrimary: 0xa9e3ff,
  iceHighlight: 0xcfefff,
  iceShadow: 0x3a5e78,
  buttonFillTop: 0x3d5fc0,
  buttonFillBottom: 0x1b2a72,
  amberSolid: 0xffc857,
  amberGlow: 0xffe8a6,
  gridFine: 0x9cc8ff,
  gridModule: 0xffd27a,
  gridDiagonal: 0x8fe0ff,
  gridTick: 0xffe3a0,
  jewelFaceNorth: 0xffeaa8,
  jewelFaceEast: 0xffd56e,
  jewelFaceSouth: 0xefa53a,
  jewelFaceWest: 0xf9bf4f,
  jewelOutline: 0xfff4cc,
  textPrimary: 0xffffff,
  textSecondary: 0xcfe3ff,
  dangerText: 0xe65a5a,
} as const;

export const TYPO_TOKENS = {
  fontFamily: {
    /**
     * Baloo 2 (bo tròn, casual) cho tiêu đề, modal title, hero title và nút chính.
     *
     * KHÔNG dùng Fredoka: Google Fonts chỉ phát hành Fredoka với subset hebrew,
     * latin và latin-ext — không có vietnamese. Dải U+1EA0–1EF1 (ạ ắ ầ ế ọ ụ ữ
     * ặ ừ …) rơi ra ngoài, nên "Bắt đầu" bị vẽ nửa Fredoka nửa font hệ thống.
     * Baloo 2 cùng chất bo tròn và có đủ bộ chữ tiếng Việt.
     * `tests/displayFontCoverage.test.ts` canh không cho lặp lại lỗi này.
     */
    display: "'Baloo 2', -apple-system, sans-serif",
    serif: "'Baloo 2', -apple-system, sans-serif",
    sans: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    /** Tên level cần bộ glyph tiếng Việt đầy đủ, kể cả khi webfont chưa tải. */
    levelTitle: "'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif",
  },
  fontSize: {
    heroTitle: '60px',
    headerTitle: '52px',
    sectionHeader: '32px',
    modalTitle: '50px',
    bodyPrimary: '28px',
    buttonLabel: '26px',
    caption: '24px',
  },
} as const;

export const LAYOUT_TOKENS = {
  canvas: { width: 720, height: 1280 },
  header: { y: 0, height: 96 },
  targetBadge: { x: 360, y: 158, size: 188, radius: 94 },
  board: { x: 40, y: 200, width: 640, height: 800, cornerRadius: 30, borderWidth: 6 },
  tray: { x: 40, y: 1016, width: 640, height: 136, cornerRadius: 24 },
  bottomBar: { y: 1164, height: 116 },
  buttonSizes: {
    primaryW: 360,
    primaryH: 72,
    circularAction: 64,
    circularNav: 56,
    circularPrimary: 112,
    circularSecondary: 80,
    minTouchArea: 96,
  },
} as const;

/** Quy tắc hình học từ artboard GridSpec */
export const GRID_TOKENS = {
  logicCellPx: 5,
  displayCellInLogicCells: 8,
  moduleInDisplayCells: 3,
  fine: { color: '#9CC8FF', alpha: 0.13, width: 1 },
  module: { color: '#FFD27A', alpha: 0.3, width: 1 },
  axis: { color: '#FFD27A', alpha: 0.6, width: 1.4 },
  diagonal: { color: '#8FE0FF', alpha: 0.16, width: 1, dash: [3, 4] },
  tick: { color: '#FFE3A0', alpha: 0.75, width: 1.2, shortLen: 5, longLen: 9 },
  corner: { color: '#FFD27A', width: 2, armLen: 18, inset: 8 },
} as const;

/** Khung kính dùng chung cho bàn chơi, khay mảnh và các dialog */
export const GLASS_TOKENS = {
  frameStops: ['#E6F7FF', '#8BD3F5', '#4E9BD0', '#2D5E9A'],
  frameStopOffsets: [0, 0.18, 0.6, 1],
  cornerRadius: 30,
  padding: 6,
  hairline: { color: '#FFFFFF', alpha: 0.25, width: 1 },
  glow: { color: '#78C8FF', alpha: 0.55, blur: 34 },
  dropShadow: { color: '#080A28', alpha: 0.55, offsetY: 18, blur: 40 },
} as const;

/** Mảnh ngọc thoi: bốn mặt vát, sáng ở trên-trái, tối ở dưới-phải */
export const PIECE_TOKENS = {
  faceNorth: '#FFEAA8',
  faceEast: '#FFD56E',
  faceSouth: '#EFA53A',
  faceWest: '#F9BF4F',
  outline: '#FFF4CC',
  outlineWidth: 2,
  /** Bán kính mặt bàn so với bán kính mảnh */
  tableRatio: 0.45,
  tableStops: ['#FFFBEA', '#FFE29A', '#F6B443'],
  glow: { color: '#FFC857', alpha: 0.7, blur: 9 },
  sparkle: { color: '#FFFFFF', alpha: 0.95, offsetRatio: -0.3 },
  ghostAlpha: 0.75,
  targetFill: { color: '#BFE3FF', alpha: 0.1 },
  targetStroke: { color: '#DDF2FF', alpha: 0.7, width: 1.6, dash: [6, 5] },
  placeholderStroke: { color: '#CFEFFF', alpha: 0.55, width: 1.5, dash: [5, 4] },
} as const;

export const ANIM_TOKENS = {
  duration: {
    buttonTapMs: 90,
    dragLiftMs: 80,
    snapMs: 120,
    overlapInversionMs: 150,
    sceneFadeMs: 240,
    twinkleCycleMs: 3200,
    linkSweepMs: 6000,
  },
  scale: {
    dragging: 1.06,
    buttonTapped: 0.96,
  },
} as const;

/** Chuyển cảnh giữa Menu, Bản đồ và Play (spec F1 mục 3) */
export const TRANSITION_TOKENS = {
  crossfadeMs: 150,
  moodMs: 1000,
  routes: {
    'menu-to-play': { totalMs: 1500, handoffMs: 200 },
    'map-to-play': { totalMs: 1500, handoffMs: 300 },
    'next-level': { totalMs: 1500, handoffMs: 800 },
    'play-to-map': { totalMs: 1000, handoffMs: 400 },
    'play-to-menu': { totalMs: 1000, handoffMs: 400 },
    'menu-to-map': { totalMs: 1000, handoffMs: 300 },
    'map-to-menu': { totalMs: 1000, handoffMs: 300 },
  },
} as const;

/** Phản hồi từng thao tác trong màn chơi (spec F2 mục 3) */
export const FEEDBACK_TOKENS = {
  liftScale: 1.08,
  liftMs: 80,
  /** Pick up: dip then lift. -0.375 x (liftScale - 1) lands the dip on 0.97. */
  pickupMs: 100,
  pickupDipLift: -0.375,
  pickupDipAt: 0.4,
  dropLiftMs: 120,
  tau: { follow: 35, scale: 45, tilt: 120, settle: 60, idle: 90, hint: 60, targetHover: 40 },
  tiltPerPxPerSec: 0.02,
  tiltMaxDeg: 4,
  magnetStrength: 0.3,
  magnetRingFarRatio: 1.45,
  magnetRingNearRatio: 1.05,
  magnetRingSpanRatio: 0.9,
  magnetRingAlphaFar: 0.18,
  magnetRingAlphaNear: 0.5,
  targetIdleAlpha: 0.7,
  hintMs: 120,
  snapMs: 120,
  bounceMs: 180,
  bounceFrom: 1.08,
  bounceDip: 0.98,
  bounceDipAt: 0.4,
  snapRingMs: 240,
  snapRingRadiusRatio: 1.2,
  snapRingAlpha: 0.6,
  counterPopScale: 1.3,
  counterPopMs: 200,
  returnMs: 220,
  rotateMs: 160,
  rotateFromDeg: -90,
  shakeMs: 180,
  shakePx: 6,
  shakeCycles: 3,
  blockedFlashAlpha: 0.8,
  overlapFadeMs: 150,
  overlapTraceMs: 320,
  overlapTraceFraction: 0.25,
  reviveFlashMs: 200,
  resetStaggerMs: 40,
  resetMs: 260,
  resetOverlapFadeMs: 120,
  rotateButtonFadeMs: 150,
  shadowRest: { x: 4, y: 6 },
  shadowLifted: { x: 8, y: 12 },
  shadowAlpha: 0.45,
  previewAlpha: 0.5,
  reducedFadeMaxMs: 150,
} as const;

/** Chuỗi thắng (kéo dài 2800 ms để người chơi kịp chiêm ngưỡng bàn thắng và hiệu ứng hạt tinh tú) */
export const VICTORY_TOKENS = {
  totalMs: 2800,
  skyDimAtMs: 200,
  skyDimMs: 400,
  skyDimExtra: 0.12,
  lightsAtMs: 400,
  lightsEndMs: 1200,
  lightGapMs: 120,
  lightMs: 350,
  lightPeak: 0.7,
  traceAtMs: 900,
  traceMs: 600,
  burstAtMs: 1300,
  flashMs: 350,
  ringMs: 800,
  ringGapMs: 200,
  particles: 30,
  particleMs: 1100,
  frameAtMs: 1400,
  frameMs: 600,
  trayFadeMs: 400,
  cardAtMs: 2000,
  cardMs: 800,
  cardSlidePx: 60,
  cardItemGapMs: 100,
  reducedMs: 150,
  unwindMs: 300,
} as const;

export const DEPTH_TOKENS = {
  backgroundSky: 0,
  celestialRings: 5,
  steleBoard: 10,
  boardGrid: 15,
  targetSilhouette: 20,
  targetBadge: 25,
  placedPieces: 30,
  trayArea: 40,
  temporaryPieces: 50,
  draggingPiece: 60,
  hudControls: 70,
  modalOverlay: 100,
  modalContent: 110,
} as const;

/** Audio levels and timings (spec G). Cue volumes are multiplied by the bus volume. */
export const AUDIO_TOKENS = {
  musicVolume: 0.45,
  sfxVolume: 0.8,
  maxVoices: 6,
  repeatGapMs: 40,
  toggleOutMs: 300,
  toggleInMs: 1000,
  bootFadeMs: 1000,
  duck: { level: 0.3, holdMs: 1500, downMs: 200, upMs: 800 },
  overlapDelayMs: 60,
  cues: {
    lift: 0.35,
    snap: 0.8,
    snapWin: 0.9,
    settle: 0.4,
    return: 0.3,
    rotate: 0.4,
    rotateRate: 1.12,
    rotateBlocked: 0.6,
    overlap: 0.6,
    reset: 0.4,
    stinger: 0.9,
    uiTap: 0.4,
    uiDialog: 0.35,
    uiNode: 0.5,
    uiLocked: 0.5,
  },
} as const;

export type GlowTier = Readonly<{ blur: number; alpha: number; color: string }>;

/**
 * Glow is a state, not default decoration. Tier 0 means no glow at all, not a
 * faint one — that distinction is what keeps the single tier-3 focus readable.
 */
export const GLOW_TIERS: Readonly<Record<0 | 1 | 2 | 3, GlowTier>> = {
  0: { blur: 0, alpha: 0, color: 'transparent' },
  1: { blur: 8, alpha: 0.25, color: '#A9E3FF' },
  2: { blur: 16, alpha: 0.4, color: '#A9E3FF' },
  3: { blur: 34, alpha: 0.85, color: '#FFC857' },
} as const;

/** The one tier-3 element each screen is allowed. */
export const SCREEN_FOCUS = {
  menu: 'continueButton',
  map: 'currentNode',
  play: 'draggingPiece',
} as const;

export function glowTier(tier: 0 | 1 | 2 | 3): GlowTier {
  return GLOW_TIERS[tier];
}


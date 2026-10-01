export const COLOR_TOKENS = {
  navy: {
    spaceBackground: '#080E24',
    steleSurface: '#101B32',
    deepModalBackdrop: '#050A1A',
  },
  iceGlass: {
    primaryBorder: '#68B8DC',
    bevelHighlight: '#CFEFFF',
    bevelShadow: '#3A5E78',
  },
  amberGold: {
    solidPrimary: '#FFC857',
    gridCoordinate: '#D4A359',
    glowHighlight: '#FFE8A6',
  },
  text: {
    primary: '#EEF4FA',
    secondary: '#9DAFC7',
  },
  danger: {
    warningText: '#E65A5A',
    confirmBg: '#5A1A1A',
  },
} as const;

export const COLOR_NUMBERS = {
  navySpace: 0x080e24,
  navyStele: 0x101b32,
  navyBackdrop: 0x050a1a,
  icePrimary: 0x68b8dc,
  iceHighlight: 0xcfefff,
  iceShadow: 0x3a5e78,
  amberSolid: 0xffc857,
  amberGrid: 0xd4a359,
  amberGlow: 0xffe8a6,
  textPrimary: 0xeef4fa,
  textSecondary: 0x9dafc7,
  dangerText: 0xe65a5a,
} as const;

export const TYPO_TOKENS = {
  fontFamily: {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontSize: {
    heroTitle: '40px',
    sectionHeader: '24px',
    modalTitle: '20px',
    bodyPrimary: '15px',
    caption: '12px',
  },
} as const;

export const LAYOUT_TOKENS = {
  canvas: { width: 720, height: 1280 },
  header: { y: 0, height: 96 },
  topBuffer: { y: 96, height: 88 },
  board: { x: 104, y: 184, width: 512, height: 768, cornerRadius: 36, borderWidth: 10 },
  tray: { x: 104, y: 968, width: 512, height: 140, cornerRadius: 20 },
  bottomBar: { y: 1124, height: 92 },
  safeAreaBottom: { y: 1216, height: 64 },
  buttonSizes: {
    primaryW: 360,
    primaryH: 72,
    circularAction: 64,
    circularNav: 56,
  },
} as const;

export const ANIM_TOKENS = {
  duration: {
    buttonTapMs: 90,
    dragLiftMs: 80,
    snapMs: 120,
    overlapInversionMs: 150,
    sceneFadeMs: 240,
  },
  scale: {
    dragging: 1.06,
    buttonTapped: 0.96,
  },
} as const;

export const DEPTH_TOKENS = {
  backgroundSky: 0,
  celestialRings: 5,
  steleBoard: 10,
  boardGrid: 15,
  targetSilhouette: 20,
  placedPieces: 30,
  trayArea: 40,
  temporaryPieces: 50,
  draggingPiece: 60,
  hudControls: 70,
  modalOverlay: 100,
  modalContent: 110,
} as const;

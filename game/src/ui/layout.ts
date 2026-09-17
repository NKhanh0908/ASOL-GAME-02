export const LAYOUT = {
  width: 720,
  height: 1280,
  boardX: 104,
  boardY: 168,
  cell: 4,
  boardWidth: 512,
  boardHeight: 768,
  trayTop: 960,
  trayBottom: 1160,
} as const;

export const toGrid = (x: number, y: number) => ({
  x: (x - LAYOUT.boardX) / LAYOUT.cell,
  y: (y - LAYOUT.boardY) / LAYOUT.cell,
});

export function trayHome(index: number, count: number, width: number, height: number): { x: number; y: number } {
  const slot = 672 / count;
  return { x: 24 + slot * (index + 0.5) - width * 2, y: 1060 - height * 2 };
}

import type { Piece, PieceState } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';

export type LayoutMetrics = {
  boardBounds: { x: number; y: number; width: number; height: number };
  cellPixel: 4;
  trayBounds: { x: number; y: number; width: number; height: number };
  scale: number;
};

const BASE_WIDTH = 720;
const BASE_HEIGHT = 1280;
const BOARD_X = 104;
const BOARD_Y = 168;
const BOARD_WIDTH = 512;
const BOARD_HEIGHT = 768;
const CELL_PIXEL: 4 = 4;
const TRAY_X = 104;
const TRAY_Y = 960;
const TRAY_WIDTH = 512;
const TRAY_HEIGHT = 200;

export function computeLayout(
  viewportWidth: number,
  viewportHeight: number,
  _safeArea?: { top: number; bottom: number }
): LayoutMetrics {
  const scaleX = viewportWidth / BASE_WIDTH;
  const scaleY = viewportHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  return {
    boardBounds: {
      x: BOARD_X,
      y: BOARD_Y,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
    },
    cellPixel: CELL_PIXEL,
    trayBounds: {
      x: TRAY_X,
      y: TRAY_Y,
      width: TRAY_WIDTH,
      height: TRAY_HEIGHT,
    },
    scale: scale > 0 ? scale : 1,
  };
}

export function canvasToGrid(
  canvasX: number,
  canvasY: number,
  layout: LayoutMetrics
): { x: number; y: number; insideBoard: boolean } {
  const relX = canvasX - layout.boardBounds.x;
  const relY = canvasY - layout.boardBounds.y;

  const x = Math.floor(relX / layout.cellPixel);
  const y = Math.floor(relY / layout.cellPixel);

  const insideBoard = x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  return { x, y, insideBoard };
}

export function gridToCanvas(
  gridX: number,
  gridY: number,
  layout: LayoutMetrics
): { x: number; y: number } {
  return {
    x: layout.boardBounds.x + gridX * layout.cellPixel,
    y: layout.boardBounds.y + gridY * layout.cellPixel,
  };
}

export function pieceHitbox(
  piece: Piece,
  state: PieceState,
  layout: LayoutMetrics,
  pieceIndexInTray: number = 0
): { x: number; y: number; width: number; height: number } {
  const rawSize = piece.frameSize * layout.cellPixel;
  const minTouchSize = 48; // Chuẩn tối thiểu 48 dp cho touch target
  const size = Math.max(rawSize, minTouchSize);

  if (state.kind === 'snapped') {
    const anchor = piece.anchors.find((a) => a.id === state.anchorId) ?? piece.anchors[0];
    const pos = gridToCanvas(anchor.x, anchor.y, layout);
    return {
      x: pos.x,
      y: pos.y,
      width: size,
      height: size,
    };
  }

  if (state.kind === 'temporary') {
    const pos = gridToCanvas(state.x, state.y, layout);
    return {
      x: pos.x,
      y: pos.y,
      width: size,
      height: size,
    };
  }

  // Tray: sắp xếp các mảnh ngang nhau trong khay
  const slotWidth = layout.trayBounds.width / 2;
  const centerX = layout.trayBounds.x + slotWidth * pieceIndexInTray + slotWidth / 2;
  const centerY = layout.trayBounds.y + layout.trayBounds.height / 2;

  return {
    x: centerX - size / 2,
    y: centerY - size / 2,
    width: size,
    height: size,
  };
}

import type { Piece, PieceState } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import { LAYOUT_TOKENS } from './designTokens.ts';

export type LayoutMetrics = {
  boardBounds: { x: number; y: number; width: number; height: number };
  cellPixel: 4;
  trayBounds: { x: number; y: number; width: number; height: number };
  headerBounds: { y: number; height: number };
  bottomBarBounds: { y: number; height: number };
  scale: number;
};

const BASE_WIDTH = LAYOUT_TOKENS.canvas.width;
const BASE_HEIGHT = LAYOUT_TOKENS.canvas.height;
const BOARD_X = LAYOUT_TOKENS.board.x;
const BOARD_Y = LAYOUT_TOKENS.board.y;
const BOARD_WIDTH = LAYOUT_TOKENS.board.width;
const BOARD_HEIGHT = LAYOUT_TOKENS.board.height;
const CELL_PIXEL: 4 = 4;
const TRAY_X = LAYOUT_TOKENS.tray.x;
const TRAY_Y = LAYOUT_TOKENS.tray.y;
const TRAY_WIDTH = LAYOUT_TOKENS.tray.width;
const TRAY_HEIGHT = LAYOUT_TOKENS.tray.height;

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
    headerBounds: {
      y: LAYOUT_TOKENS.header.y,
      height: LAYOUT_TOKENS.header.height,
    },
    bottomBarBounds: {
      y: LAYOUT_TOKENS.bottomBar.y,
      height: LAYOUT_TOKENS.bottomBar.height,
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

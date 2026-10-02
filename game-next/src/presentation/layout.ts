import type { Piece, PieceState } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import type { Vertex } from '../domain/shapes.ts';
import { LAYOUT_TOKENS } from './designTokens.ts';

export type LayoutMetrics = {
  boardBounds: { x: number; y: number; width: number; height: number };
  cellPixel: 5;
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
const CELL_PIXEL: 5 = 5;
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
  pieceIndexInTray: number = 0,
  trayCount: number = 2
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

  // Tray: chia đều bề ngang khay theo số mảnh của màn. Hitbox không rộng quá
  // một ô để mảnh cạnh nhau không giành nhau cú chạm.
  const slotWidth = traySlotWidth(layout, trayCount);
  const traySize = Math.max(Math.min(rawSize, slotWidth), minTouchSize);
  const centerX = layout.trayBounds.x + slotWidth * pieceIndexInTray + slotWidth / 2;
  const centerY = layout.trayBounds.y + layout.trayBounds.height / 2;

  return {
    x: centerX - traySize / 2,
    y: centerY - traySize / 2,
    width: traySize,
    height: traySize,
  };
}

/**
 * Tâm canvas của một mảnh, suy ra từ gốc khung và frameSize.
 *
 * Neo là GỐC khung mảnh (góc trên-trái), nên tâm bằng gốc cộng nửa khung.
 * Viết cứng nửa khung thành hằng số sẽ sai ngay khi frameSize đổi — đó
 * chính là lỗi đã xảy ra khi mảnh chuyển từ 40 sang 48 ô.
 */
export function pieceCenterCanvas(
  frameSize: number,
  originX: number,
  originY: number,
  layout: LayoutMetrics
): { x: number; y: number } {
  const half = frameSize / 2;
  return gridToCanvas(originX + half, originY + half, layout);
}

/** Bán kính vẽ hình thoi: nửa đường chéo thật, tính bằng pixel canvas. */
export function pieceRadiusPx(frameSize: number, layout: LayoutMetrics): number {
  return (frameSize / 2) * layout.cellPixel;
}

/**
 * Bán kính mảnh khi nằm trong khay.
 *
 * Khay thấp hơn bàn nhiều nên không dùng chung bán kính được: mảnh 48 ô ở
 * 5px/ô cao 240px, trong khi khay chỉ cao 160px và sẽ bị tràn. Chừa 16px
 * đệm trên dưới cho mảnh không chạm mép khung kính.
 * Khi khay chia nhiều ô, bán kính còn bị giới hạn bởi nửa bề rộng ô.
 */
export function trayPieceRadiusPx(layout: LayoutMetrics, trayCount: number = 2): number {
  return Math.min(
    layout.trayBounds.height / 2 - 16,
    traySlotWidth(layout, trayCount) / 2 - 16
  );
}

export type CanvasPoint = { x: number; y: number };

/** Đa giác của mảnh sau `turns` nấc xoay; mảnh không ghi hình (test domain) coi là thoi. */
function pieceVertices(piece: Piece, turns: number): Vertex[] {
  const kind = piece.shapeKind ?? 'diamond';
  const orientation = effectiveOrientation(kind, piece.orientation ?? 0, turns);
  return shapePolygon(kind, orientation, piece.frameSize);
}

/** Đa giác thật của mảnh trên bàn, gốc khung tại (originX, originY) ô logic. */
export function piecePolygonCanvas(
  piece: Piece,
  originX: number,
  originY: number,
  turns: number,
  layout: LayoutMetrics
): CanvasPoint[] {
  return pieceVertices(piece, turns).map((v) => gridToCanvas(originX + v.x, originY + v.y, layout));
}

/** Cùng hình nhưng đặt tâm khung tại (cx, cy), cạnh khung framePx pixel — cho khay và mảnh đang kéo. */
export function piecePolygonAround(
  piece: Piece,
  turns: number,
  cx: number,
  cy: number,
  framePx: number
): CanvasPoint[] {
  const s = piece.frameSize;
  return pieceVertices(piece, turns).map((v) => ({
    x: cx + (v.x / s - 0.5) * framePx,
    y: cy + (v.y / s - 0.5) * framePx,
  }));
}

export function traySlotWidth(layout: LayoutMetrics, trayCount: number): number {
  return layout.trayBounds.width / Math.max(1, trayCount);
}

/**
 * Ô lõm trong khay: lề 16px hai bên, khe 16px giữa các ô, đệm 14px trên dưới.
 * Với 2 ô cho đúng vị trí ô lõm của bản trước.
 */
export function trayWellRects(
  layout: LayoutMetrics,
  trayCount: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const n = Math.max(1, trayCount);
  const gap = 16;
  const width = (layout.trayBounds.width - gap * (n + 1)) / n;
  return Array.from({ length: n }, (_, i) => ({
    x: layout.trayBounds.x + gap + i * (width + gap),
    y: layout.trayBounds.y + 14,
    width,
    height: layout.trayBounds.height - 28,
  }));
}

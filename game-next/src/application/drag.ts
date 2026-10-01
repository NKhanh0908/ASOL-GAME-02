import type {
  Anchor,
  Level,
  Piece,
  PieceState,
  Placement,
  PuzzleState,
  Transition,
} from '../domain/model.ts';
import { fitsBoard, rotateCells } from '../domain/geometry.ts';
import { evaluate } from '../domain/mask.ts';
import { applyCommand, placementsOf } from '../domain/session.ts';
import type { LayoutMetrics } from '../presentation/layout.ts';
import { canvasToGrid, gridToCanvas } from '../presentation/layout.ts';

export type DragSession = {
  pieceId: string;
  startWorld: { x: number; y: number };
  pointerOffset: { x: number; y: number };
  originState: PieceState;
  committedState: PuzzleState;
};

export type DragUpdate = {
  previewPlacement: Placement | null;
  previewMask: Uint8Array;
  snapCandidateId: string | null;
};

export function beginDrag(
  state: PuzzleState,
  piece: Piece,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics
): DragSession {
  const originState = state.pieces[piece.id] ?? { kind: 'tray', turns: 0 };
  let pieceCanvasX = pointerX;
  let pieceCanvasY = pointerY;

  if (originState.kind === 'snapped') {
    const anchor = piece.anchors.find((a) => a.id === originState.anchorId) ?? piece.anchors[0];
    const pos = gridToCanvas(anchor.x, anchor.y, layout);
    pieceCanvasX = pos.x;
    pieceCanvasY = pos.y;
  } else if (originState.kind === 'temporary') {
    const pos = gridToCanvas(originState.x, originState.y, layout);
    pieceCanvasX = pos.x;
    pieceCanvasY = pos.y;
  }

  return {
    pieceId: piece.id,
    startWorld: { x: pointerX, y: pointerY },
    pointerOffset: {
      x: pointerX - pieceCanvasX,
      y: pointerY - pieceCanvasY,
    },
    originState,
    committedState: state,
  };
}

export function updateDrag(
  drag: DragSession,
  level: Level,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics
): DragUpdate {
  const piece = level.pieces.find((p) => p.id === drag.pieceId);
  if (!piece) {
    const committedPlacements = placementsOf(level, drag.committedState);
    return {
      previewPlacement: null,
      previewMask: evaluate(level, committedPlacements),
      snapCandidateId: null,
    };
  }

  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);

  const rotatedCells = rotateCells(piece.cells, piece.frameSize, drag.originState.turns);

  // Tìm neo gần nhất trong bán kính 8 ô (d <= 64):
  // Hỗ trợ cả trường hợp grid là tâm (anchor + 20) lẫn grid là góc top-left (anchor)
  let best: Anchor | undefined;
  let bestDistance = Infinity;
  for (const anchor of piece.anchors) {
    const dTopLeft = (anchor.x - grid.x) ** 2 + (anchor.y - grid.y) ** 2;
    const dCenter = (anchor.x + 20 - grid.x) ** 2 + (anchor.y + 20 - grid.y) ** 2;
    const d = Math.min(dTopLeft, dCenter);

    // Bán kính hít tinh tế: 4.5 ô (d^2 <= 20) giúp thao tác tự nhiên, không bị khựng từ xa
    if (d <= 20 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
      best = anchor;
      bestDistance = d;
    }
  }

  let previewPlacement: Placement | null = null;
  if (best) {
    previewPlacement = {
      pieceId: piece.id,
      x: best.x,
      y: best.y,
      turns: drag.originState.turns,
    };
  } else if (fitsBoard(rotatedCells, grid.x, grid.y)) {
    previewPlacement = {
      pieceId: piece.id,
      x: grid.x,
      y: grid.y,
      turns: drag.originState.turns,
    };
  }

  // Tập hợp placement ngoại trừ piece đang drag
  const otherPlacements = placementsOf(level, drag.committedState).filter(
    (p) => p.pieceId !== piece.id
  );

  const previewPlacements = previewPlacement
    ? [...otherPlacements, previewPlacement]
    : otherPlacements;

  let previewMask: Uint8Array;
  try {
    previewMask = evaluate(level, previewPlacements);
  } catch {
    previewMask = evaluate(level, otherPlacements);
  }

  return {
    previewPlacement,
    previewMask,
    snapCandidateId: best ? best.id : null,
  };
}

export function finishDrag(
  drag: DragSession,
  level: Level,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics
): Transition {
  // Thả vào vùng khay mảnh (trayBounds) -> trả về khay
  const inTray =
    pointerX >= layout.trayBounds.x &&
    pointerX <= layout.trayBounds.x + layout.trayBounds.width &&
    pointerY >= layout.trayBounds.y &&
    pointerY <= layout.trayBounds.y + layout.trayBounds.height;

  if (inTray) {
    return applyCommand(level, drag.committedState, {
      type: 'return',
      pieceId: drag.pieceId,
    });
  }

  const piece = level.pieces.find((p) => p.id === drag.pieceId);
  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);

  if (piece) {
    const rotatedCells = rotateCells(piece.cells, piece.frameSize, drag.originState.turns);

    // Kiểm tra neo gần nhất
    let best: Anchor | undefined;
    let bestDistance = Infinity;
    for (const anchor of piece.anchors) {
      const dTopLeft = (anchor.x - grid.x) ** 2 + (anchor.y - grid.y) ** 2;
      const dCenter = (anchor.x + 20 - grid.x) ** 2 + (anchor.y + 20 - grid.y) ** 2;
      const d = Math.min(dTopLeft, dCenter);

      // Bán kính hít tinh tế: 4.5 ô (d^2 <= 20)
      if (d <= 20 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
        best = anchor;
        bestDistance = d;
      }
    }

    if (best) {
      // Hút chuẩn xác vào neo đã tìm thấy
      return applyCommand(level, drag.committedState, {
        type: 'drop',
        pieceId: drag.pieceId,
        x: best.x,
        y: best.y,
      });
    }

    // Nếu không gần neo nhưng vẫn thả trong bàn cờ:
    // Căn chỉnh tọa độ top-left để tâm hình thoi trùng với vị trí chuột thả
    const dCenterToAnchor = Math.min(
      ...piece.anchors.map((a) => (a.x + 20 - grid.x) ** 2 + (a.y + 20 - grid.y) ** 2)
    );
    const dTopLeftToAnchor = Math.min(
      ...piece.anchors.map((a) => (a.x - grid.x) ** 2 + (a.y - grid.y) ** 2)
    );

    const dropX = dCenterToAnchor < dTopLeftToAnchor ? Math.round(grid.x - 20) : grid.x;
    const dropY = dCenterToAnchor < dTopLeftToAnchor ? Math.round(grid.y - 20) : grid.y;

    if (fitsBoard(rotatedCells, dropX, dropY)) {
      return applyCommand(level, drag.committedState, {
        type: 'drop',
        pieceId: drag.pieceId,
        x: dropX,
        y: dropY,
      });
    }
  }

  // Thả ngoài phạm vi bàn cờ: trả về khay
  return applyCommand(level, drag.committedState, {
    type: 'return',
    pieceId: drag.pieceId,
  });
}

export function cancelDrag(drag: DragSession, level: Level): Transition {
  const placements = placementsOf(level, drag.committedState);
  const mask = evaluate(level, placements);

  return {
    accepted: true,
    outcome: 'tray',
    state: drag.committedState,
    mask,
    changed: [],
    becameWon: false,
  };
}

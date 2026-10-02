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
import { canvasToGrid, gridToCanvas, pieceHitbox } from '../presentation/layout.ts';

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
  layout: LayoutMetrics,
  pieceIndexInTray: number = 0
): DragSession {
  const originState = state.pieces[piece.id] ?? { kind: 'tray', turns: 0 };
  let pieceCenterX = pointerX;
  let pieceCenterY = pointerY;

  const halfFrame = piece.frameSize / 2;

  if (originState.kind === 'snapped') {
    const anchor = piece.anchors.find((a) => a.id === originState.anchorId) ?? piece.anchors[0];
    const pos = gridToCanvas(anchor.x + halfFrame, anchor.y + halfFrame, layout);
    pieceCenterX = pos.x;
    pieceCenterY = pos.y;
  } else if (originState.kind === 'temporary') {
    const pos = gridToCanvas(originState.x + halfFrame, originState.y + halfFrame, layout);
    pieceCenterX = pos.x;
    pieceCenterY = pos.y;
  } else {
    const hitbox = pieceHitbox(piece, originState, layout, pieceIndexInTray);
    pieceCenterX = hitbox.x + hitbox.width / 2;
    pieceCenterY = hitbox.y + hitbox.height / 2;
  }

  return {
    pieceId: piece.id,
    startWorld: { x: pointerX, y: pointerY },
    pointerOffset: {
      x: pointerX - pieceCenterX,
      y: pointerY - pieceCenterY,
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

  const halfFrame = piece.frameSize / 2;
  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);

  const rotatedCells = rotateCells(piece.cells, piece.frameSize, drag.originState.turns);

  // Tìm neo gần nhất trong bán kính hít: d <= 36 (6 ô, tương ứng 24px canvas)
  // Hỗ trợ cả trường hợp grid là tâm mảnh (kéo tự do) lẫn grid là góc top-left (unit test)
  let best: Anchor | undefined;
  let bestDistance = Infinity;
  for (const anchor of piece.anchors) {
    // `grid` luôn là TÂM mảnh (pointerOffset tính từ tâm trong beginDrag).
    // So thêm với gốc neo sẽ cho hít nhầm khi tâm mảnh rơi gần gốc neo.
    const d = (anchor.x + halfFrame - grid.x) ** 2 + (anchor.y + halfFrame - grid.y) ** 2;

    if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
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
  } else {
    // `grid` là tâm mảnh, nên gốc luôn bằng tâm trừ nửa khung. Trước đây chỗ
    // này chọn giữa hai cách hiểu và đặt tâm vào vị trí gốc, làm mảnh nhảy
    // xuống-phải đúng nửa khung.
    const dropX = Math.round(grid.x - halfFrame);
    const dropY = Math.round(grid.y - halfFrame);

    if (fitsBoard(rotatedCells, dropX, dropY)) {
      previewPlacement = {
        pieceId: piece.id,
        x: dropX,
        y: dropY,
        turns: drag.originState.turns,
      };
    }
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
  const halfFrame = piece ? piece.frameSize / 2 : 20;
  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);

  if (piece) {
    const rotatedCells = rotateCells(piece.cells, piece.frameSize, drag.originState.turns);

    // Kiểm tra neo gần nhất trong bán kính hít: d <= 36
    let best: Anchor | undefined;
    let bestDistance = Infinity;
    for (const anchor of piece.anchors) {
      // `grid` luôn là TÂM mảnh (pointerOffset tính từ tâm trong beginDrag).
      // So thêm với gốc neo sẽ cho hít nhầm khi tâm mảnh rơi gần gốc neo.
      const d = (anchor.x + halfFrame - grid.x) ** 2 + (anchor.y + halfFrame - grid.y) ** 2;

      if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
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
    // `grid` là tâm mảnh, nên gốc luôn bằng tâm trừ nửa khung. Trước đây chỗ
    // này chọn giữa hai cách hiểu và đặt tâm vào vị trí gốc, làm mảnh nhảy
    // xuống-phải đúng nửa khung.
    const dropX = Math.round(grid.x - halfFrame);
    const dropY = Math.round(grid.y - halfFrame);

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

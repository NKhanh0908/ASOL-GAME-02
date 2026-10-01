import type {
  Anchor,
  Command,
  Level,
  Outcome,
  PieceState,
  Placement,
  PuzzleState,
  Transition,
  Turns,
} from './model.ts';
import { TOTAL_CELLS } from './model.ts';
import { fitsBoard, rotateCells } from './geometry.ts';
import { evaluate, matchesTarget } from './mask.ts';

/**
 * Khởi tạo trạng thái ban đầu của màn chơi với tất cả mảnh nằm trong khay (tray) ở góc 0°.
 */
export function createPuzzle(level: Level): PuzzleState {
  const pieces: Record<string, PieceState> = {};
  for (const piece of level.pieces) {
    pieces[piece.id] = { kind: 'tray', turns: 0 };
  }
  return {
    levelId: level.id,
    phase: 'playing',
    pieces,
  };
}

/**
 * Trích xuất danh sách các mảnh đã snap vào neo để tính toán mask.
 * Mảnh đang ở khay (tray) hoặc vị trí tạm (temporary) không tạo placement.
 */
export function placementsOf(level: Level, state: PuzzleState): Placement[] {
  const placements: Placement[] = [];
  for (const [pieceId, pState] of Object.entries(state.pieces)) {
    if (pState.kind === 'snapped') {
      const piece = level.pieces.find((p) => p.id === pieceId);
      if (!piece) continue;
      const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
      if (!anchor) continue;
      placements.push({
        pieceId,
        x: anchor.x,
        y: anchor.y,
        turns: pState.turns,
      });
    }
  }
  return placements;
}

/**
 * Áp dụng một lệnh tương tác lên bàn chơi theo cơ chế giao dịch bất biến (deterministic state machine).
 */
export function applyCommand(level: Level, state: PuzzleState, command: Command): Transition {
  const currentPlacements = placementsOf(level, state);
  const currentMask = evaluate(level, currentPlacements);

  // Khi đã thắng, chỉ chấp nhận lệnh reset
  if (state.phase === 'won' && command.type !== 'reset') {
    return {
      accepted: false,
      outcome: 'won',
      state,
      mask: currentMask,
      changed: [],
      becameWon: false,
    };
  }

  // 1. Lệnh Reset
  if (command.type === 'reset') {
    const nextPieces: Record<string, PieceState> = {};
    for (const piece of level.pieces) {
      nextPieces[piece.id] = { kind: 'tray', turns: 0 };
    }
    const nextState: PuzzleState = {
      levelId: level.id,
      phase: 'playing',
      pieces: nextPieces,
    };
    const nextMask = new Uint8Array(TOTAL_CELLS);
    const changed: number[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (currentMask[i] !== 0) changed.push(i);
    }
    return {
      accepted: true,
      outcome: 'reset',
      state: nextState,
      mask: nextMask,
      changed,
      becameWon: false,
    };
  }

  // 2. Lệnh Return (trả mảnh về khay, giữ góc xoay hiện tại)
  if (command.type === 'return') {
    const piece = level.pieces.find((p) => p.id === command.pieceId);
    if (!piece || !state.pieces[command.pieceId]) {
      return {
        accepted: false,
        outcome: 'unknown-piece',
        state,
        mask: currentMask,
        changed: [],
        becameWon: false,
      };
    }

    const currentPieceState = state.pieces[command.pieceId];
    const nextPieces = {
      ...state.pieces,
      [command.pieceId]: { kind: 'tray' as const, turns: currentPieceState.turns },
    };
    const nextState: PuzzleState = {
      ...state,
      pieces: nextPieces,
    };
    const nextPlacements = placementsOf(level, nextState);
    const nextMask = evaluate(level, nextPlacements);
    const changed: number[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (currentMask[i] !== nextMask[i]) changed.push(i);
    }
    return {
      accepted: true,
      outcome: 'tray',
      state: nextState,
      mask: nextMask,
      changed,
      becameWon: false,
    };
  }

  // 3. Lệnh Rotate (xoay 90° theo chiều kim đồng hồ quanh tâm khung)
  if (command.type === 'rotate') {
    if (!level.rotationEnabled) {
      return {
        accepted: false,
        outcome: 'rotation-disabled',
        state,
        mask: currentMask,
        changed: [],
        becameWon: false,
      };
    }

    const piece = level.pieces.find((p) => p.id === command.pieceId);
    if (!piece || !state.pieces[command.pieceId]) {
      return {
        accepted: false,
        outcome: 'unknown-piece',
        state,
        mask: currentMask,
        changed: [],
        becameWon: false,
      };
    }

    const currentPieceState = state.pieces[command.pieceId];
    const nextTurns = (((currentPieceState.turns + 1) % 4) as Turns);
    const nextRotatedCells = rotateCells(piece.cells, piece.frameSize, nextTurns);

    let nextPieceState: PieceState;

    if (currentPieceState.kind === 'snapped') {
      const anchor = piece.anchors.find((a) => a.id === currentPieceState.anchorId);
      if (!anchor || !fitsBoard(nextRotatedCells, anchor.x, anchor.y)) {
        return {
          accepted: false,
          outcome: 'out-of-bounds',
          state,
          mask: currentMask,
          changed: [],
          becameWon: false,
        };
      }
      nextPieceState = { kind: 'snapped', anchorId: currentPieceState.anchorId, turns: nextTurns };
    } else if (currentPieceState.kind === 'temporary') {
      if (!fitsBoard(nextRotatedCells, currentPieceState.x, currentPieceState.y)) {
        return {
          accepted: false,
          outcome: 'out-of-bounds',
          state,
          mask: currentMask,
          changed: [],
          becameWon: false,
        };
      }
      nextPieceState = { kind: 'temporary', x: currentPieceState.x, y: currentPieceState.y, turns: nextTurns };
    } else {
      // Tray: không cần kiểm tra fitsBoard
      nextPieceState = { kind: 'tray', turns: nextTurns };
    }

    const nextPieces = {
      ...state.pieces,
      [command.pieceId]: nextPieceState,
    };
    const nextState: PuzzleState = {
      ...state,
      pieces: nextPieces,
    };
    const nextPlacements = placementsOf(level, nextState);
    const nextMask = evaluate(level, nextPlacements);
    const changed: number[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (currentMask[i] !== nextMask[i]) changed.push(i);
    }

    const isWon = matchesTarget(nextMask, level.targetMask);
    if (isWon) {
      return {
        accepted: true,
        outcome: 'won',
        state: { ...nextState, phase: 'won' },
        mask: nextMask,
        changed,
        becameWon: true,
      };
    }

    return {
      accepted: true,
      outcome: 'rotated',
      state: nextState,
      mask: nextMask,
      changed,
      becameWon: false,
    };
  }

  // 4. Lệnh Drop (thả mảnh vào bàn cờ)
  if (command.type === 'drop') {
    if (!Number.isInteger(command.x) || !Number.isInteger(command.y)) {
      return {
        accepted: false,
        outcome: 'invalid-coordinate',
        state,
        mask: currentMask,
        changed: [],
        becameWon: false,
      };
    }

    const piece = level.pieces.find((p) => p.id === command.pieceId);
    if (!piece || !state.pieces[command.pieceId]) {
      return {
        accepted: false,
        outcome: 'unknown-piece',
        state,
        mask: currentMask,
        changed: [],
        becameWon: false,
      };
    }

    const currentPieceState = state.pieces[command.pieceId];
    const rotatedCells = rotateCells(piece.cells, piece.frameSize, currentPieceState.turns);

    // Tìm neo gần nhất trong bán kính 6 ô (d^2 <= 36)
    // Phép so d < bestDistance giữ neo đứng trước khi khoảng cách bằng nhau (tie)
    let best: Anchor | undefined;
    let bestDistance = Infinity;
    for (const anchor of piece.anchors) {
      const d = (anchor.x - command.x) ** 2 + (anchor.y - command.y) ** 2;
      if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
        best = anchor;
        bestDistance = d;
      }
    }

    let nextPieceState: PieceState;
    let outcome: Outcome;

    if (best) {
      nextPieceState = {
        kind: 'snapped',
        anchorId: best.id,
        turns: currentPieceState.turns,
      };
      outcome = 'snapped';
    } else {
      nextPieceState = {
        kind: 'temporary',
        x: command.x,
        y: command.y,
        turns: currentPieceState.turns,
      };
      outcome = 'temporary';
    }

    const nextPieces = {
      ...state.pieces,
      [command.pieceId]: nextPieceState,
    };
    const nextState: PuzzleState = {
      ...state,
      pieces: nextPieces,
    };
    const nextPlacements = placementsOf(level, nextState);
    const nextMask = evaluate(level, nextPlacements);
    const changed: number[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (currentMask[i] !== nextMask[i]) changed.push(i);
    }

    const isWon = matchesTarget(nextMask, level.targetMask);
    if (isWon) {
      return {
        accepted: true,
        outcome: 'won',
        state: { ...nextState, phase: 'won' },
        mask: nextMask,
        changed,
        becameWon: true,
      };
    }

    return {
      accepted: true,
      outcome,
      state: nextState,
      mask: nextMask,
      changed,
      becameWon: false,
    };
  }

  return {
    accepted: false,
    outcome: 'unknown-piece',
    state,
    mask: currentMask,
    changed: [],
    becameWon: false,
  };
}

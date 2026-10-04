import type { Level, Placement, PuzzleState, Transition } from '../domain/model.ts';
import { applyCommand, createPuzzle, placementsOf } from '../domain/session.ts';
import { evaluate } from '../domain/mask.ts';
import type { ProgressRepository } from './progressPort.ts';
import type { DragSession, DragUpdate } from './drag.ts';
import { beginDrag, cancelDrag, finishDrag, updateDrag } from './drag.ts';
import type { LayoutMetrics } from '../presentation/layout.ts';
import { pieceHitbox } from '../presentation/layout.ts';

export type DragInfo = {
  pieceId: string;
  x: number;
  y: number;
  snapCandidateId: string | null;
};

export type PlayViewSnapshot = {
  levelId: string;
  phase: 'playing' | 'won';
  showTarget: boolean;
  snappedCount: number;
  totalPieces: number;
  canRotate: boolean;
  selectedPieceId: string | null;
  dragPreviewMask: Uint8Array | null;
  snapCandidateId: string | null;
  dragInfo: DragInfo | null;
  committedMask: Uint8Array;
};

export class PlayController {
  private level: Level;
  private progressRepo: ProgressRepository;
  private isCampaign: boolean;
  private puzzleState: PuzzleState;
  private selectedPieceId: string | null = null;
  private dragSession: DragSession | null = null;
  private dragUpdate: DragUpdate | null = null;
  private dragInfo: DragInfo | null = null;
  private showTarget: boolean;

  constructor(
    level: Level,
    progressRepo: ProgressRepository,
    isCampaign: boolean = true,
    initialShowTarget: boolean = true
  ) {
    this.level = level;
    this.progressRepo = progressRepo;
    this.isCampaign = isCampaign;
    this.puzzleState = createPuzzle(level);
    this.showTarget = initialShowTarget;
  }

  getSnapshot(): PlayViewSnapshot {
    const snappedCount = Object.values(this.puzzleState.pieces).filter(
      (p) => p.kind === 'snapped' || p.kind === 'placed'
    ).length;

    const committedPlacements: Placement[] = placementsOf(this.level, this.puzzleState);
    const committedMask = evaluate(this.level, committedPlacements);

    return {
      levelId: this.level.id,
      phase: this.puzzleState.phase,
      showTarget: this.showTarget,
      snappedCount,
      totalPieces: this.level.pieces.length,
      canRotate: this.level.rotationEnabled && this.selectedPieceId !== null,
      selectedPieceId: this.selectedPieceId,
      dragPreviewMask: this.dragUpdate ? this.dragUpdate.previewMask : null,
      snapCandidateId: this.dragUpdate ? this.dragUpdate.snapCandidateId : null,
      dragInfo: this.dragInfo,
      committedMask,
    };
  }

  getPuzzleState(): PuzzleState {
    return this.puzzleState;
  }

  onPointerDown(pointerX: number, pointerY: number, layout: LayoutMetrics): boolean {
    if (this.puzzleState.phase === 'won') {
      return false;
    }

    // Kiểm tra tương tác với các mảnh theo thứ tự: snapped -> temporary -> tray
    const pieceOrder = [...this.level.pieces].reverse();

    for (let i = 0; i < pieceOrder.length; i++) {
      const piece = pieceOrder[i];
      const pState = this.puzzleState.pieces[piece.id] ?? { kind: 'tray', turns: 0 };
      const originalIndex = this.level.pieces.indexOf(piece);
      const hitbox = pieceHitbox(piece, pState, layout, originalIndex, this.level.pieces.length);

      if (
        pointerX >= hitbox.x &&
        pointerX <= hitbox.x + hitbox.width &&
        pointerY >= hitbox.y &&
        pointerY <= hitbox.y + hitbox.height
      ) {
        this.selectedPieceId = piece.id;
        this.dragSession = beginDrag(
          this.puzzleState,
          piece,
          pointerX,
          pointerY,
          layout,
          originalIndex,
          this.level.pieces.length
        );
        this.dragUpdate = updateDrag(this.dragSession, this.level, pointerX, pointerY, layout);
        this.dragInfo = {
          pieceId: piece.id,
          x: pointerX - this.dragSession.pointerOffset.x,
          y: pointerY - this.dragSession.pointerOffset.y,
          snapCandidateId: this.dragUpdate.snapCandidateId,
        };
        return true;
      }
    }

    return false;
  }

  onPointerMove(pointerX: number, pointerY: number, layout: LayoutMetrics): void {
    if (!this.dragSession) return;
    this.dragUpdate = updateDrag(this.dragSession, this.level, pointerX, pointerY, layout);
    this.dragInfo = {
      pieceId: this.dragSession.pieceId,
      x: pointerX - this.dragSession.pointerOffset.x,
      y: pointerY - this.dragSession.pointerOffset.y,
      snapCandidateId: this.dragUpdate.snapCandidateId,
    };
  }

  onPointerUp(pointerX: number, pointerY: number, layout: LayoutMetrics): Transition | null {
    if (!this.dragSession) return null;

    const transition = finishDrag(this.dragSession, this.level, pointerX, pointerY, layout);
    this.dragSession = null;
    this.dragUpdate = null;
    this.dragInfo = null;

    if (transition.accepted) {
      this.puzzleState = transition.state;
      if (transition.becameWon && this.isCampaign) {
        this.progressRepo.complete(this.level.id);
      }
    }

    return transition;
  }

  onPointerCancel(): Transition | null {
    if (!this.dragSession) return null;

    const transition = cancelDrag(this.dragSession, this.level);
    this.dragSession = null;
    this.dragUpdate = null;
    this.dragInfo = null;

    return transition;
  }

  onRotate(): Transition | null {
    if (!this.selectedPieceId || !this.level.rotationEnabled) {
      return null;
    }

    const transition = applyCommand(this.level, this.puzzleState, {
      type: 'rotate',
      pieceId: this.selectedPieceId,
    });

    if (transition.accepted) {
      this.puzzleState = transition.state;
      if (transition.becameWon && this.isCampaign) {
        this.progressRepo.complete(this.level.id);
      }
    }

    return transition;
  }

  onReset(): Transition {
    const transition = applyCommand(this.level, this.puzzleState, { type: 'reset' });
    this.puzzleState = transition.state;
    this.selectedPieceId = null;
    this.dragSession = null;
    this.dragUpdate = null;
    return transition;
  }

  onToggleTarget(): boolean {
    this.showTarget = !this.showTarget;
    this.progressRepo.setShowTarget(this.showTarget);
    return this.showTarget;
  }
}

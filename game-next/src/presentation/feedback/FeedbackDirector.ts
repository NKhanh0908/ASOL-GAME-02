import Phaser from 'phaser';
import type { Level, Piece, PuzzleState } from '../../domain/model.ts';
import type { BackgroundScene } from '../BackgroundScene.ts';
import type { BoardRenderer } from '../BoardRenderer.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS, FEEDBACK_TOKENS } from '../designTokens.ts';
import type { Hud } from '../Hud.ts';
import type { LayoutMetrics } from '../layout.ts';
import { gridToCanvas, pieceRadiusPx } from '../layout.ts';
import type { PieceTextureCache } from '../PieceTextureCache.ts';
import { lightAlpha } from '../pieceMotion.ts';
import type { Pt } from '../polygonClip.ts';
import { isReducedMotion, scaleTiming } from '../transitions/motion.ts';
import { TransitionTimeline } from '../transitions/TransitionTimeline.ts';
import type { HapticsPort } from '../../infrastructure/haptics.ts';
import type { FeedbackEvent } from './feedbackEvents.ts';
import { HAPTIC_CUES, playCue } from './hapticCues.ts';
import { perimeterSegment } from './parityDiff.ts';

export type FeedbackDeps = {
  scene: Phaser.Scene;
  level: Level;
  layout: LayoutMetrics;
  board: BoardRenderer;
  hud: Hud;
  textures: PieceTextureCache;
  haptics: HapticsPort;
  getState(): PuzzleState;
  background(): BackgroundScene | null;
};

const F = FEEDBACK_TOKENS;
const toGeom = (pts: readonly Pt[]) => pts.map((p) => new Phaser.Geom.Point(p.x, p.y));

/**
 * Chạy phản hồi hình và rung cho từng sự kiện. Mọi hiệu ứng ngắn là một
 * TransitionTimeline riêng, được tick từ PlayScene.update — cùng cơ chế với
 * chuyển cảnh F1, nên Giảm chuyển động và bỏ qua hoạt động giống nhau.
 */
export class FeedbackDirector {
  private readonly deps: FeedbackDeps;
  private effects: TransitionTimeline[] = [];

  constructor(deps: FeedbackDeps) {
    this.deps = deps;
  }

  handle(events: readonly FeedbackEvent[]): void {
    for (const event of events) {
      playCue(this.deps.haptics, HAPTIC_CUES[event.type]);
      this.visual(event);
    }
  }

  tick(dtMs: number): void {
    for (const tl of this.effects) tl.advance(dtMs);
    this.effects = this.effects.filter((tl) => !tl.isFinished());
  }

  protected fx(): TransitionTimeline {
    const tl = new TransitionTimeline();
    this.effects.push(tl);
    return tl;
  }

  protected piece(id: string): Piece | undefined {
    return this.deps.level.pieces.find((p) => p.id === id);
  }

  private visual(event: FeedbackEvent): void {
    const { board, textures, level } = this.deps;
    const reduced = isReducedMotion();
    switch (event.type) {
      case 'lift': {
        const view = board.getPieceView(event.pieceId);
        view?.cancelGlide();
        view?.setLifted(true, scaleTiming(F.liftMs), 'backOut');
        if (level.rotationEnabled) {
          const turns = this.deps.getState().pieces[event.pieceId]?.turns ?? 0;
          textures.enqueue(event.pieceId, turns + 1);
        }
        return;
      }
      case 'snap': {
        const piece = this.piece(event.pieceId);
        const view = board.getPieceView(event.pieceId);
        const state = this.deps.getState().pieces[event.pieceId];
        if (!piece || !view || !state) return;
        view.dropLiftNow();
        view.glideTo(board.targetPoseFor(piece, state, level.pieces.indexOf(piece)), scaleTiming(F.snapMs), 'cubicOut');
        if (reduced) return;
        view.play('bounce', F.bounceMs);
        const target = board.targetPoseFor(piece, state, 0);
        this.snapRing(target, pieceRadiusPx(piece.frameSize, this.deps.layout));
        const snapped = Object.values(this.deps.getState().pieces).filter((s) => s.kind === 'snapped').length;
        this.deps.hud.popCounterIcon(snapped - 1);
        return;
      }
      case 'settle-temporary':
        board.getPieceView(event.pieceId)?.setLifted(false, scaleTiming(F.dropLiftMs), 'cubicOut');
        return;
      case 'return': {
        const piece = this.piece(event.pieceId);
        const view = board.getPieceView(event.pieceId);
        if (!piece || !view) return;
        view.setLifted(false, scaleTiming(F.returnMs), 'cubicOut');
        view.glideTo(
          board.targetPoseFor(piece, { kind: 'tray', turns: this.deps.getState().pieces[piece.id]?.turns ?? 0 }, level.pieces.indexOf(piece)),
          scaleTiming(F.returnMs),
          'cubicOut'
        );
        return;
      }
      case 'rotate': {
        const view = board.getPieceView(event.pieceId);
        if (!view) return;
        view.setTextures(textures.ensure(event.pieceId, event.turns), event.turns);
        if (!reduced) view.play('spin', F.rotateMs, F.rotateFromDeg);
        textures.enqueue(event.pieceId, event.turns + 1);
        return;
      }
      case 'rotate-blocked': {
        const view = board.getPieceView(event.pieceId);
        if (!reduced) view?.play('shake', F.shakeMs);
        this.flashOutline(event.pieceId);
        return;
      }
      case 'overlap-hollow':
        if (!reduced) for (const layer of event.layers) this.traceEdge(layer);
        return;
      case 'overlap-revive':
        if (!reduced) for (const layer of event.layers) this.reviveFlash(layer);
        return;
      case 'reset':
        this.resetPieces();
        return;
      case 'won':
        // Task 9: this.playVictory();
        return;
    }
  }

  private snapRing(center: { x: number; y: number }, radius: number): void {
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);
    const s = { r: 0, a: F.snapRingAlpha };
    const draw = () => {
      g.clear();
      g.lineStyle(2, COLOR_NUMBERS.icePrimary, s.a);
      g.strokeCircle(center.x, center.y, s.r);
    };
    const tl = this.fx();
    tl.at(0, s, { r: radius * F.snapRingRadiusRatio, a: 0 }, F.snapRingMs, 'cubicOut', draw);
    tl.call(F.snapRingMs, () => g.destroy());
    tl.advance(0);
  }

  private traceEdge(gridLayer: Pt[]): void {
    const points = gridLayer.map((p) => gridToCanvas(p.x, p.y, this.deps.layout));
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    const s = { p: 0 };
    const draw = () => {
      g.clear();
      const seg = perimeterSegment(points, s.p, F.overlapTraceFraction);
      if (seg.length < 2) return;
      g.lineStyle(3 - 2 * s.p, COLOR_NUMBERS.iceHighlight, 1 - s.p);
      g.strokePoints(toGeom(seg), false, false);
    };
    const tl = this.fx();
    tl.at(0, s, { p: 1 }, F.overlapTraceMs, 'linear', draw);
    tl.call(F.overlapTraceMs, () => g.destroy());
    tl.advance(0);
  }

  private reviveFlash(gridLayer: Pt[]): void {
    const pts = gridLayer.map((p) => gridToCanvas(p.x, p.y, this.deps.layout));
    const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    const s = { k: 0 };
    const draw = () => {
      g.clear();
      const len = 18 * lightAlpha(s.k);
      g.lineStyle(2, COLOR_NUMBERS.amberGlow, lightAlpha(s.k));
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.lineBetween(c.x, c.y, c.x + Math.cos(a) * len, c.y + Math.sin(a) * len);
      }
    };
    const tl = this.fx();
    tl.at(0, s, { k: 1 }, F.reviveFlashMs, 'linear', draw);
    tl.call(F.reviveFlashMs, () => g.destroy());
    tl.advance(0);
  }

  /** Nháy viền ice-white khi xoay bị chặn; giữ cả khi Giảm chuyển động */
  private flashOutline(pieceId: string): void {
    const piece = this.piece(pieceId);
    const view = this.deps.board.getPieceView(pieceId);
    const pose = view?.currentPose();
    if (!piece || !pose) return;
    const turns = this.deps.getState().pieces[pieceId]?.turns ?? 0;
    const pts = this.deps.board.canvasPolygonAt(piece, turns, pose);
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);
    const s = { a: 0 };
    const draw = () => {
      g.clear();
      g.lineStyle(3, COLOR_NUMBERS.iceHighlight, s.a);
      g.strokePoints(toGeom(pts), true, true);
    };
    const half = Math.min(F.shakeMs / 2, F.reducedFadeMaxMs / 2);
    const tl = this.fx();
    tl.at(0, s, { a: F.blockedFlashAlpha }, half, 'linear', draw);
    tl.at(half, s, { a: 0 }, half, 'linear', draw);
    tl.call(half * 2, () => g.destroy());
    tl.advance(0);
  }

  /** Đặt lại: mảnh trên bia bay về khay so le 40 ms; vùng giao mờ trong 120 ms */
  private resetPieces(): void {
    const { board, level } = this.deps;
    board.fadeOutParity(F.resetOverlapFadeMs);
    let k = 0;
    level.pieces.forEach((piece, index) => {
      const view = board.getPieceView(piece.id);
      const pose = view?.currentPose();
      if (!view || !pose) return;
      const tray = board.targetPoseFor(piece, { kind: 'tray', turns: 0 }, index);
      if (Math.hypot(pose.x - tray.x, pose.y - tray.y) < 1) return;
      view.setLifted(false, 0, 'linear');
      view.glideTo(tray, scaleTiming(F.resetMs), 'cubicOut', scaleTiming(F.resetStaggerMs * k));
      k++;
    });
  }
}

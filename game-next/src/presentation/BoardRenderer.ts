import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import type { CanvasPoint, LayoutMetrics } from './layout.ts';
import {
  pieceBoardOrigin,
  pieceCenterCanvas,
  pieceHitbox,
  piecePolygonAround,
  piecePolygonCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
  trayWellRects,
} from './layout.ts';
import { GridPainter } from './GridPainter.ts';
import { drawJewelPolygon, strokeTargetOutline } from './JewelShape.ts';
import { unionOutline, type ParityLayer } from './polygonClip.ts';
import type { PlayViewSnapshot } from '../application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS, FEEDBACK_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { getMotionScale, isReducedMotion } from './transitions/motion.ts';
import type { Poseable } from './transitions/choreography.ts';
import { PieceView } from './PieceView.ts';
import type { PieceTextureSource } from './PieceTextureCache.ts';
import { POSE_TAU, anchorCenter, magnetRing, pieceTargetPose, stepScalar } from './pieceMotion.ts';
import type { Pose } from './pieceMotion.ts';
import { diffLayers, overlapLayers } from './feedback/parityDiff.ts';

export type BoardTransitionParts = {
  board: Poseable[];
  runes: Poseable[];
  rings: Poseable[];
  tray: Poseable[];
  trayPieces: Poseable[];
  pieces: Poseable[];
  targets: Poseable[];
  grid: Phaser.GameObjects.RenderTexture | null;
};

type Snapped = { piece: Piece; state: Extract<PieceState, { kind: 'snapped' | 'placed' }> };

const DEPTH_FOR: Record<'tray' | 'snapped' | 'temporary' | 'dragging', number> = {
  tray: DEPTH_TOKENS.placedPieces,
  snapped: DEPTH_TOKENS.placedPieces,
  temporary: DEPTH_TOKENS.temporaryPieces,
  dragging: DEPTH_TOKENS.draggingPiece,
};

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layout: LayoutMetrics;
  private readonly level: Level;
  private readonly textures: PieceTextureSource;
  private readonly trayCount: number;

  private readonly ringGraphics: Phaser.GameObjects.Graphics;
  private readonly targetGraphics: Phaser.GameObjects.Graphics;
  private readonly placeholderGraphics: Phaser.GameObjects.Graphics;
  private readonly parityGraphics: Phaser.GameObjects.Graphics;
  private readonly parityIncomingGraphics: Phaser.GameObjects.Graphics;
  private readonly parityFadeGraphics: Phaser.GameObjects.Graphics;
  private readonly previewGraphics: Phaser.GameObjects.Graphics;
  private readonly magnetRingGraphics: Phaser.GameObjects.Graphics;
  private readonly temporaryGraphics: Phaser.GameObjects.Graphics;
  private readonly fxGraphics: Phaser.GameObjects.Graphics;

  private gridTexture: Phaser.GameObjects.RenderTexture | null = null;
  private boardSurface: Phaser.GameObjects.Image | null = null;
  private boardFrame: Phaser.GameObjects.Image | null = null;
  private goldFrame: Phaser.GameObjects.Image | null = null;
  private boardBase: Phaser.GameObjects.Container | null = null;
  private boardTop: Phaser.GameObjects.Container | null = null;
  private runes: Phaser.GameObjects.Arc[] = [];
  private trayWells: Phaser.GameObjects.Image[] = [];
  private trayFrame: Phaser.GameObjects.Image | null = null;

  private readonly views = new Map<string, PieceView>();
  private ring1Angle = 0;
  private ring2Angle = 0;
  private victoryPulse = 0;

  private targetReveal: readonly number[] | null = null;
  private hoverAlpha: number[];
  private targetKey = '';
  private staticKey = '';
  private previewKey = '';
  private parityKey = '';
  private currentParity: ParityLayer[] = [];
  private incoming: { alpha: number } | null = null;
  private parityFade: { alpha: number; ms: number } | null = null;
  private lastSnapshot: PlayViewSnapshot | null = null;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics, level: Level, textures: PieceTextureSource) {
    this.scene = scene;
    this.layout = layout;
    this.level = level;
    this.textures = textures;
    this.trayCount = level.pieces.length;
    this.hoverAlpha = (level.targetPlacements ?? []).map(() => FEEDBACK_TOKENS.targetIdleAlpha);

    this.ringGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.celestialRings);
    this.targetGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.targetSilhouette);
    this.placeholderGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces);
    // Giao chẵn/lẻ chỉ phủ mảnh đã snap; mảnh đang di chuyển luôn nằm trên.
    this.parityGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.parityIncomingGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.parityFadeGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.previewGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    // Below the dragged piece: the ring is tier 2, the piece stays tier 3.
    this.magnetRingGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    this.temporaryGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.temporaryPieces);
    this.fxGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);

    this.drawStaticBoard();
    for (const piece of level.pieces) this.views.set(piece.id, new PieceView(scene));
  }

  public drawStaticBoard(): void {
    const { boardBounds, trayBounds } = this.layout;
    const cx = boardBounds.x + boardBounds.width / 2;
    const cy = boardBounds.y + boardBounds.height / 2;
    const left = -boardBounds.width / 2;
    const top = -boardBounds.height / 2;

    // Bia chia ba lớp quanh tâm (360, 600) để co giãn quanh tâm khi chuyển cảnh:
    // đế (mặt bàn) < lưới (RenderTexture) < nắp (rune + khung kính).
    if (!this.boardBase) {
      this.boardSurface = this.scene.add.image(left, top, TEXTURE_KEYS.boardSurface).setOrigin(0, 0);
      this.boardBase = this.scene.add
        .container(cx, cy, [this.boardSurface])
        .setDepth(DEPTH_TOKENS.steleBoard);
    }

    if (!this.gridTexture) {
      this.gridTexture = GridPainter.paint(this.scene, boardBounds)
        .setOrigin(0.5, 0.5)
        .setPosition(cx, cy);
    }

    if (!this.boardTop) {
      // 4 rune phương vị theo thứ tự Bắc, Đông, Nam, Tây (thứ tự sáng lên)
      const inset = 24;
      this.runes = [
        [0, top + inset],
        [-left - inset, 0],
        [0, -top - inset],
        [left + inset, 0],
      ].map(([x, y]) => this.scene.add.circle(x, y, 3, COLOR_NUMBERS.gridModule, 0.45));
      this.boardFrame = this.scene.add.image(left, top, TEXTURE_KEYS.glassFrameBoard).setOrigin(0, 0);
      this.goldFrame = this.scene.add.image(left, top, TEXTURE_KEYS.goldFrameBoard).setOrigin(0, 0).setAlpha(0);
      this.boardTop = this.scene.add
        .container(cx, cy, [...this.runes, this.boardFrame, this.goldFrame])
        .setDepth(DEPTH_TOKENS.boardGrid + 1);
      this.trayFrame = this.scene.add
        .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.trayArea);
    }

    if (this.trayWells.length === 0) {
      for (const rect of trayWellRects(this.layout, this.trayCount)) {
        this.trayWells.push(
          this.scene.add
            .image(rect.x, rect.y, TEXTURE_KEYS.trayWell)
            .setOrigin(0, 0)
            .setDisplaySize(rect.width, rect.height)
            .setDepth(DEPTH_TOKENS.steleBoard)
        );
      }
    }
  }

  /** Gọi mỗi khung hình từ PlayScene.update */
  public tick(dtMs: number, snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.lastSnapshot = snapshot;
    const reduced = isReducedMotion();
    const dragId = snapshot.dragInfo?.pieceId ?? null;
    this.updateCelestialRings(dtMs, snapshot.phase === 'won');
    this.syncTargets(dtMs, snapshot, reduced);
    this.syncPieceViews(dtMs, snapshot, pieces, reduced);
    this.syncStaticOverlays(dragId, pieces);
    this.syncParity(dtMs, dragId, pieces);
    this.syncPreview(snapshot, pieces);
    this.syncMagnetRing(snapshot, pieces);
    this.fxGraphics.clear();
    if (snapshot.phase === 'won') {
      this.victoryPulse += dtMs * 0.004 * getMotionScale();
      this.drawVictoryPulse();
    }
  }

  /** Giữ chữ ký cũ cho test: vẽ ngay một khung không trôi thời gian */
  public render(_level: Level, snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.tick(0, snapshot, pieces);
  }

  public getPieceView(id: string): PieceView | undefined {
    return this.views.get(id);
  }

  public targetPoseFor(piece: Piece, state: PieceState, trayIndex: number): Pose {
    return pieceTargetPose(piece, state, {
      layout: this.layout,
      trayIndex,
      trayCount: this.trayCount,
      selected: false,
      drag: null,
    });
  }

  public canvasPolygonAt(piece: Piece, turns: number, pose: Pose): CanvasPoint[] {
    return piecePolygonAround(piece, turns, pose.x, pose.y, piece.frameSize * this.layout.cellPixel * pose.scale);
  }

  public getGoldFrame(): Phaser.GameObjects.Image | null {
    return this.goldFrame;
  }

  public getTrayParts(): Poseable[] {
    return [this.trayFrame, ...this.trayWells].filter((x): x is Phaser.GameObjects.Image => x !== null);
  }

  public setTrayVisible(visible: boolean, alpha: number): void {
    for (const part of this.getTrayParts() as Phaser.GameObjects.Image[]) part.setVisible(visible).setAlpha(alpha);
  }

  public setFrameGold(on: boolean): void {
    this.goldFrame?.setAlpha(on ? 1 : 0);
  }

  public setVictoryMode(on: boolean): void {
    this.setFrameGold(on);
    this.setTrayVisible(!on, 1);
  }

  /** Đặt lại: bản sao vùng giao hiện tại mờ dần trong `ms` */
  public fadeOutParity(ms: number): void {
    this.parityFadeGraphics.clear();
    this.drawLayers(this.parityFadeGraphics, this.currentParity);
    this.parityFadeGraphics.setAlpha(1);
    this.parityFade = { alpha: 1, ms: Math.max(1, ms) };
  }

  public setTargetReveal(values: readonly number[] | null): void {
    this.targetReveal = values;
    if (this.lastSnapshot) this.drawTargetSilhouette(this.lastSnapshot);
  }

  public getTransitionParts(): BoardTransitionParts {
    const present = <T>(items: Array<T | null | undefined>): T[] =>
      items.filter((item): item is T => item !== null && item !== undefined);
    const offsets = this.level.pieces.map((p) => this.views.get(p.id)!.offset);
    return {
      board: present<Poseable>([this.boardBase, this.gridTexture, this.boardTop]),
      runes: [...this.runes],
      rings: [this.ringGraphics],
      tray: this.getTrayParts(),
      trayPieces: offsets,
      pieces: [
        ...offsets,
        this.parityGraphics,
        this.parityIncomingGraphics,
        this.previewGraphics,
        this.magnetRingGraphics,
        this.temporaryGraphics,
        this.fxGraphics,
      ],
      targets: [this.targetGraphics, this.placeholderGraphics],
      grid: this.gridTexture,
    };
  }

  public updateCelestialRings(delta: number, isWon: boolean): void {
    const speedMult = (isWon ? 3.0 : 1.0) * getMotionScale();
    this.ring1Angle += delta * 0.0003 * speedMult;
    this.ring2Angle -= delta * 0.0002 * speedMult;

    const { boardBounds } = this.layout;
    const cx = boardBounds.x + boardBounds.width / 2;
    const cy = boardBounds.y + boardBounds.height / 2;

    this.ringGraphics.clear();

    // Vòng 1: Viền xanh cyan dạ quang nét mảnh
    this.ringGraphics.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.28);
    this.ringGraphics.strokeCircle(cx, cy, 380);

    // Đốm sáng trên vòng 1
    const p1X = cx + Math.cos(this.ring1Angle) * 380;
    const p1Y = cy + Math.sin(this.ring1Angle) * 380;
    this.ringGraphics.fillStyle(COLOR_NUMBERS.iceHighlight, 0.6);
    this.ringGraphics.fillCircle(p1X, p1Y, 4);

    // Vòng 2: Viền vàng hổ phách đứt nét
    this.ringGraphics.lineStyle(1.2, COLOR_NUMBERS.gridModule, 0.22);
    this.ringGraphics.strokeCircle(cx, cy, 410);

    // Đốm sáng trên vòng 2
    const p2X = cx + Math.cos(this.ring2Angle) * 410;
    const p2Y = cy + Math.sin(this.ring2Angle) * 410;
    this.ringGraphics.fillStyle(COLOR_NUMBERS.amberSolid, 0.55);
    this.ringGraphics.fillCircle(p2X, p2Y, 3.5);
  }

  private syncPieceViews(
    dtMs: number,
    snapshot: PlayViewSnapshot,
    pieces: Readonly<Record<string, PieceState>>,
    reduced: boolean
  ): void {
    const drag = snapshot.dragInfo;
    this.level.pieces.forEach((piece, index) => {
      const view = this.views.get(piece.id)!;
      const state = pieces[piece.id] ?? { kind: 'tray', turns: 0 };
      if (view.turns() !== state.turns) {
        const keys = this.textures.keys(piece.id, state.turns);
        if (!keys) return; // chưa vẽ xong: ẩn tới khung sau
        view.setTextures(keys, state.turns);
      }
      const dragging = drag !== null && drag.pieceId === piece.id;
      const target = pieceTargetPose(piece, state, {
        layout: this.layout,
        trayIndex: index,
        trayCount: this.trayCount,
        selected: snapshot.selectedPieceId === piece.id,
        drag: dragging
          ? {
              x: drag.x,
              y: drag.y,
              candidate: drag.snapCandidateId ? anchorCenter(piece, drag.snapCandidateId, this.layout) : null,
            }
          : null,
      });
      view.setDepth(DEPTH_FOR[dragging ? 'dragging' : state.kind === 'temporary' ? 'temporary' : 'snapped']);
      const tau = POSE_TAU[dragging ? 'dragging' : state.kind === 'temporary' ? 'settling' : 'idle'];
      view.update(dtMs, target, tau, { dragging, reduced });
    });
  }

  /** Ô chờ trong khay khi kéo từ khay, và chấm chú thích trên mảnh tạm */
  private syncStaticOverlays(dragId: string | null, pieces: Readonly<Record<string, PieceState>>): void {
    const key = `${dragId}|${JSON.stringify(pieces)}`;
    if (key === this.staticKey) return;
    this.staticKey = key;
    this.placeholderGraphics.clear();
    this.temporaryGraphics.clear();
    this.level.pieces.forEach((piece, index) => {
      const state = pieces[piece.id] ?? { kind: 'tray', turns: 0 };
      if (piece.id === dragId && state.kind === 'tray') {
        const hit = pieceHitbox(piece, state, this.layout, index, this.trayCount);
        const radius = trayPieceRadiusPx(this.layout, this.trayCount);
        drawJewelPolygon(
          this.placeholderGraphics,
          piecePolygonAround(piece, state.turns, hit.x + hit.width / 2, hit.y + hit.height / 2, radius * 2),
          { variant: 'placeholder', sizePx: radius }
        );
      }
      if (state.kind === 'temporary' && piece.id !== dragId) {
        const radiusPx = pieceRadiusPx(piece.frameSize, this.layout);
        const center = pieceCenterCanvas(piece.frameSize, state.x, state.y, this.layout);
        this.temporaryGraphics.lineStyle(1, COLOR_NUMBERS.textSecondary, 0.4);
        this.temporaryGraphics.strokeCircle(center.x, center.y - radiusPx - 14, 4);
      }
    });
  }

  private snappedEntries(dragId: string | null, pieces: Readonly<Record<string, PieceState>>): Snapped[] {
    return this.level.pieces.flatMap((piece) => {
      const state = pieces[piece.id];
      return state && (state.kind === 'snapped' || state.kind === 'placed') && piece.id !== dragId
        ? [{ piece, state }]
        : [];
    });
  }

  private canvasPolygons(entries: readonly Snapped[]): CanvasPoint[][] {
    return entries.flatMap(({ piece, state }) => {
      const origin = pieceBoardOrigin(piece, state);
      return origin ? [piecePolygonCanvas(piece, origin.x, origin.y, state.turns, this.layout)] : [];
    });
  }

  /**
   * Vùng giao: lớp cũ vẽ ngay, lớp mới mờ dần trong overlapFadeMs (giữ cả khi
   * Giảm chuyển động vì ≤ 150 ms là đổi màu, không phải chuyển động).
   */
  private syncParity(dtMs: number, dragId: string | null, pieces: Readonly<Record<string, PieceState>>): void {
    const entries = this.snappedEntries(dragId, pieces);
    const key = entries.map(({ piece, state }) => {
      const anchorOrPos = state.kind === 'snapped' ? state.anchorId : `${state.x},${state.y}`;
      return `${piece.id}:${anchorOrPos}:${state.turns}`;
    }).join('|');
    if (key !== this.parityKey) {
      this.parityKey = key;
      const next = overlapLayers(this.canvasPolygons(entries));
      const { kept, added } = diffLayers(this.currentParity, next);
      this.currentParity = next;
      this.parityGraphics.clear();
      this.drawLayers(this.parityGraphics, kept);
      this.parityIncomingGraphics.clear();
      if (added.length > 0) {
        this.drawLayers(this.parityIncomingGraphics, added);
        this.incoming = { alpha: 0 };
        this.parityIncomingGraphics.setAlpha(0);
      } else {
        this.incoming = null;
      }
    }
    if (this.incoming) {
      this.incoming.alpha = Math.min(1, this.incoming.alpha + dtMs / FEEDBACK_TOKENS.overlapFadeMs);
      this.parityIncomingGraphics.setAlpha(this.incoming.alpha);
      if (this.incoming.alpha >= 1) {
        this.parityGraphics.clear();
        this.drawLayers(this.parityGraphics, this.currentParity);
        this.parityIncomingGraphics.clear();
        this.incoming = null;
      }
    }
    if (this.parityFade) {
      this.parityFade.alpha = Math.max(0, this.parityFade.alpha - dtMs / this.parityFade.ms);
      this.parityFadeGraphics.setAlpha(this.parityFade.alpha);
      if (this.parityFade.alpha <= 0) {
        this.parityFadeGraphics.clear();
        this.parityFade = null;
      }
    }
  }

  /** Nét xem trước vùng sẽ ẩn khi mảnh đang kéo có neo ứng viên */
  private syncPreview(snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    const drag = snapshot.dragInfo;
    const key = drag ? `${drag.pieceId}|${drag.snapCandidateId}` : '';
    if (key === this.previewKey) return;
    this.previewKey = key;
    this.previewGraphics.clear();
    if (!drag || !drag.snapCandidateId) return;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    if (!piece) return;
    const turns = (pieces[piece.id] ?? { turns: 0 }).turns;

    let candidatePoly: CanvasPoint[] | null = null;
    if (this.level.placement === 'free') {
      const match = drag.snapCandidateId.match(/^grid:(-?\d+),(-?\d+)$/);
      if (match) {
        const gx = Number.parseInt(match[1], 10);
        const gy = Number.parseInt(match[2], 10);
        candidatePoly = piecePolygonCanvas(piece, gx, gy, turns, this.layout);
      }
    } else {
      const anchor = piece.anchors.find((a) => a.id === drag.snapCandidateId);
      if (anchor) {
        candidatePoly = piecePolygonCanvas(piece, anchor.x, anchor.y, turns, this.layout);
      }
    }

    if (!candidatePoly) return;

    const polygons = [
      ...this.canvasPolygons(this.snappedEntries(drag.pieceId, pieces)),
      candidatePoly,
    ];
    this.previewGraphics.lineStyle(1.5, COLOR_NUMBERS.icePrimary, FEEDBACK_TOKENS.previewAlpha);
    for (const layer of overlapLayers(polygons)) {
      this.previewGraphics.strokePoints(layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y)), true, true);
    }
  }

  /**
   * Canvas centre of the current snap candidate, for both placement modes:
   * anchored levels carry an anchor id, free-placement levels carry
   * `grid:gx,gy`. `anchorCenter` alone only answers the first.
   */
  private candidateCenter(
    piece: Piece,
    candidateId: string,
    _turns?: number
  ): { x: number; y: number } | null {
    if (this.level.placement === 'free') {
      const match = candidateId.match(/^grid:(-?\d+),(-?\d+)$/);
      if (!match) return null;
      return pieceCenterCanvas(
        piece.frameSize,
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        this.layout
      );
    }
    return anchorCenter(piece, candidateId, this.layout);
  }

  /**
   * Ring at the candidate anchor, tightening as the piece closes. Redrawn
   * every frame because it tracks distance; this is the hot path, so it is one
   * clear and at most one strokeCircle.
   */
  private syncMagnetRing(snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.magnetRingGraphics.clear();
    const drag = snapshot.dragInfo;
    if (!drag || !drag.snapCandidateId) return;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    if (!piece) return;
    const turns = (pieces[piece.id] ?? { turns: 0 }).turns;
    const center = this.candidateCenter(piece, drag.snapCandidateId, turns);
    if (!center) return;

    const dist = Math.hypot(drag.x - center.x, drag.y - center.y);
    const ring = magnetRing(dist, pieceRadiusPx(piece.frameSize, this.layout));
    this.magnetRingGraphics.lineStyle(1.5, COLOR_NUMBERS.icePrimary, ring.alpha);
    this.magnetRingGraphics.strokeCircle(center.x, center.y, ring.radius);
  }

  private drawLayers(g: Phaser.GameObjects.Graphics, layers: readonly ParityLayer[]): void {
    for (const layer of layers) {
      const pts = layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y));
      if (layer.filled) {
        g.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
        g.fillPoints(pts, true);
      } else {
        // Triệt tiêu quang học về màu mặt bia, rìa trong sáng nhẹ màu vàng nhạt
        g.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
        g.fillPoints(pts, true);
        g.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.7);
        g.strokePoints(pts, true, true);
      }
    }
  }

  /** Bóng mục tiêu: sáng 0.7 → 1 trong ~120 ms khi neo của nó là ứng viên */
  private syncTargets(dtMs: number, snapshot: PlayViewSnapshot, reduced: boolean): void {
    const drag = snapshot.dragInfo;
    let moving = false;
    (this.level.targetPlacements ?? []).forEach((placement, i) => {
      const piece = this.level.pieces.find((p) => p.id === placement.pieceId);
      const candidateId =
        this.level.placement === 'free'
          ? `grid:${placement.x},${placement.y}`
          : piece?.anchors.find((a) => a.x === placement.x && a.y === placement.y)?.id;
      const hovered =
        drag !== null &&
        drag.pieceId === placement.pieceId &&
        candidateId !== undefined &&
        drag.snapCandidateId === candidateId;
      const goal = hovered ? 1 : FEEDBACK_TOKENS.targetIdleAlpha;
      const next = reduced ? goal : stepScalar(this.hoverAlpha[i], goal, dtMs, FEEDBACK_TOKENS.tau.targetHover);
      if (Math.abs(next - this.hoverAlpha[i]) > 1e-4) moving = true;
      this.hoverAlpha[i] = Math.abs(next - goal) < 1e-3 ? goal : next;
    });
    const key = `${snapshot.showTarget}|${this.hoverAlpha.join(',')}`;
    if (key !== this.targetKey || moving) {
      this.targetKey = key;
      this.drawTargetSilhouette(snapshot);
    }
  }

  private drawTargetSilhouette(snapshot: PlayViewSnapshot): void {
    this.targetGraphics.clear();
    if (!snapshot.showTarget) return;
    const visible: CanvasPoint[][] = [];
    let outlineAlpha = 0;
    (this.level.targetPlacements ?? []).forEach((placement, index) => {
      const reveal = this.targetReveal?.[index] ?? 1;
      if (reveal <= 0) return;
      const piece = this.level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return;
      const polygon = piecePolygonCanvas(piece, placement.x, placement.y, placement.turns, this.layout);
      const alpha = this.hoverAlpha[index] * reveal;
      drawJewelPolygon(this.targetGraphics, polygon, {
        variant: 'target',
        alpha,
        sizePx: pieceRadiusPx(piece.frameSize, this.layout),
      });
      visible.push(polygon);
      outlineAlpha = Math.max(outlineAlpha, alpha);
    });

    // One dashed boundary for the whole figure: an outline per placement would
    // stroke every shared edge twice and draw a seam through the silhouette.
    for (const loop of unionOutline(visible)) {
      strokeTargetOutline(this.targetGraphics, loop, outlineAlpha);
    }
  }

  private drawVictoryPulse(): void {
    const { boardBounds } = this.layout;
    this.fxGraphics.lineStyle(2.5, COLOR_NUMBERS.amberGlow, 0.6 + Math.sin(this.victoryPulse) * 0.3);
    this.fxGraphics.strokeRoundedRect(
      boardBounds.x - 2,
      boardBounds.y - 2,
      boardBounds.width + 4,
      boardBounds.height + 4,
      38
    );
  }

  public destroy(): void {
    for (const g of [
      this.ringGraphics,
      this.targetGraphics,
      this.placeholderGraphics,
      this.parityGraphics,
      this.parityIncomingGraphics,
      this.parityFadeGraphics,
      this.previewGraphics,
      this.temporaryGraphics,
      this.fxGraphics,
    ]) {
      g.destroy();
    }
    for (const view of this.views.values()) view.destroy();
    this.boardBase?.destroy();
    this.boardTop?.destroy();
    this.gridTexture?.destroy();
    this.trayFrame?.destroy();
    this.trayWells.forEach((w) => w.destroy());
  }
}

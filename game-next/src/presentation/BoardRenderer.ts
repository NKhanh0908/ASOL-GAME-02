import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import type { LayoutMetrics } from './layout.ts';
import {
  pieceBoardOrigin,
  pieceHitbox,
  pieceCenterCanvas,
  piecePolygonAround,
  piecePolygonCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
  trayWellRects,
} from './layout.ts';
import { GridPainter } from './GridPainter.ts';
import { drawJewelPolygon } from './JewelShape.ts';
import { parityLayers } from './polygonClip.ts';
import type { DragInfo, PlayViewSnapshot } from '../application/playController.ts';
import { ANIM_TOKENS, COLOR_NUMBERS, DEPTH_TOKENS, LAYOUT_TOKENS, PIECE_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { getMotionScale } from './transitions/motion.ts';
import type { Poseable } from './transitions/choreography.ts';

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

/** Mảnh đã khớp trên bàn (neo hoặc giao điểm lưới), quy về gốc khung chung. */
type BoardPiece = { piece: Piece; x: number; y: number; turns: number };

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private layout: LayoutMetrics;
  private ringGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private piecesGraphics: Phaser.GameObjects.Graphics;
  private parityGraphics: Phaser.GameObjects.Graphics;
  private temporaryGraphics: Phaser.GameObjects.Graphics;
  private draggingGraphics: Phaser.GameObjects.Graphics;
  private fxGraphics: Phaser.GameObjects.Graphics;
  private gridTexture: Phaser.GameObjects.RenderTexture | null = null;
  private boardFrame: Phaser.GameObjects.Image | null = null;
  private boardSurface: Phaser.GameObjects.Image | null = null;
  private boardBase: Phaser.GameObjects.Container | null = null;
  private boardTop: Phaser.GameObjects.Container | null = null;
  private runes: Phaser.GameObjects.Arc[] = [];
  private targetReveal: readonly number[] | null = null;
  private lastLevel: Level | null = null;
  private lastSnapshot: PlayViewSnapshot | null = null;
  private trayWells: Phaser.GameObjects.Image[] = [];
  private trayFrame: Phaser.GameObjects.Image | null = null;
  private readonly trayCount: number;

  private ring1Angle = 0;
  private ring2Angle = 0;
  private victoryPulse = 0;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics, trayCount: number = 2) {
    this.scene = scene;
    this.layout = layout;
    this.trayCount = trayCount;

    // Phân lớp depth theo chuẩn DEPTH_TOKENS
    this.ringGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.celestialRings);
    this.targetGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.targetSilhouette);
    this.piecesGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces);
    // Giao chẵn/lẻ chỉ phủ mảnh đã snap; mảnh đang di chuyển luôn nằm trên.
    this.parityGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.temporaryGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.temporaryPieces);
    this.draggingGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece);
    this.fxGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);

    this.drawStaticBoard();
  }

  /**
   * Vẽ Tấm Bia Tiên Tri với viền bevel kính 10px, bo góc 36px,
   * lưới vàng 8 ô (32px), chấm giao điểm và khay mảnh
   */
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
      this.boardTop = this.scene.add
        .container(cx, cy, [...this.runes, this.boardFrame])
        .setDepth(DEPTH_TOKENS.boardGrid + 1);
      this.trayFrame = this.scene.add
        .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.trayArea);
    }

    // 6. Khay: mỗi mảnh một ô lõm trong suốt. Trước đây là một hộp đen đặc
    // che luôn cả nút Đặt lại phía sau.
    if (this.trayWells.length === 0) {
      for (const rect of trayWellRects(this.layout, this.trayCount)) {
        this.trayWells.push(
          this.scene.add
            .image(rect.x, rect.y, TEXTURE_KEYS.trayWell)
            .setOrigin(0, 0)
            .setDisplaySize(rect.width, rect.height)
            // Dưới lớp mảnh (placedPieces), nếu không ô lõm phủ lên mảnh
            .setDepth(DEPTH_TOKENS.steleBoard)
        );
      }
    }
  }

  public setFrameGold(on: boolean): void {
    this.boardFrame?.setTexture(on ? TEXTURE_KEYS.goldFrameBoard : TEXTURE_KEYS.glassFrameBoard);
  }

  /**
   * Chế độ thắng màn: khung bàn đổi sang vàng, khay và các ô chứa ẩn đi để
   * thẻ hoàn thành chiếm chỗ của chúng.
   */
  public setVictoryMode(on: boolean): void {
    this.setFrameGold(on);
    this.trayFrame?.setVisible(!on);
    for (const well of this.trayWells) well.setVisible(!on);
  }

  /**
   * Cập nhật chuyển động xoay của hai vòng thiên cầu đồng tâm phía sau bia
   */
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

  /**
   * Render toàn bộ khung hình gameplay với 5 trạng thái
   */
  public render(
    level: Level,
    snapshot: PlayViewSnapshot,
    piecesState: Record<string, PieceState>,
    delta: number = 16
  ): void {
    this.lastLevel = level;
    this.lastSnapshot = snapshot;
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // Cập nhật vòng quay thiên văn
    this.updateCelestialRings(delta, snapshot.phase === 'won');

    // 1. Bóng mục tiêu mờ (Target Silhouette)
    this.drawTargetSilhouette(level, snapshot);

    // 2. Vẽ các mảnh ghép
    this.piecesGraphics.clear();
    this.parityGraphics.clear();
    this.temporaryGraphics.clear();
    this.draggingGraphics.clear();
    this.fxGraphics.clear();

    const boardPieces: BoardPiece[] = [];

    for (let i = 0; i < level.pieces.length; i++) {
      const piece = level.pieces[i];
      const pState = piecesState[piece.id] ?? { kind: 'tray', turns: 0 };
      const isSelected = snapshot.selectedPieceId === piece.id;
      const isDraggingThis = piece.id === draggingPieceId;

      if (isDraggingThis && snapshot.dragInfo) {
        // Trạng thái 1: Đang kéo (Dragging)
        if (pState.kind === 'tray') {
          this.drawTrayPlaceholder(piece, pState, i);
        }
        this.drawDraggingPiece(piece, pState.turns, snapshot.dragInfo);
      } else if (pState.kind === 'tray') {
        this.drawTrayPiece(piece, pState, i, isSelected);
      } else if (pState.kind === 'temporary') {
        // Trạng thái 4: Mảnh tạm chưa snap
        this.drawTemporaryPiece(piece, pState, isSelected);
      } else {
        // Trạng thái 2: Đã khớp — neo (màn neo) hoặc giao điểm lưới (màn đặt tự do)
        const origin = pieceBoardOrigin(piece, pState);
        if (!origin) continue;
        boardPieces.push({ piece, x: origin.x, y: origin.y, turns: pState.turns });
        this.drawSnappedPiece(piece, origin.x, origin.y, pState.turns);
      }
    }

    // Trạng thái 3: Vùng chồng lớp theo luật chẵn/lẻ
    if (boardPieces.length >= 2) {
      this.drawOverlapInversion(boardPieces);
    }

    // Trạng thái 5: Hoàn thành (Victory Celebration)
    if (snapshot.phase === 'won') {
      this.victoryPulse += delta * 0.004;
      this.drawVictoryCelebration();
    }
  }

  /**
   * Bóng mục tiêu: từng đa giác của nghiệm mẫu. Ở Chương 1 các mảnh của nghiệm
   * không bao giờ giao nhau (validator chặn), nên vẽ riêng rẽ là đúng. Bóng mờ
   * có lỗ rỗng (Chương 2) cần kỹ thuật khác và để cho spec sau.
   */
  private drawTargetSilhouette(level: Level, snapshot: PlayViewSnapshot): void {
    this.targetGraphics.clear();
    if (!snapshot.showTarget) return;

    const drag = snapshot.dragInfo;
    (level.targetPlacements ?? []).forEach((placement, index) => {
      const reveal = this.targetReveal?.[index] ?? 1;
      if (reveal <= 0) return;
      const piece = level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return;
      // Màn đặt tự do đánh dấu ứng viên bằng giao điểm; màn neo bằng id neo
      const candidateId =
        level.placement === 'free'
          ? `grid:${placement.x},${placement.y}`
          : piece.anchors.find((a) => a.x === placement.x && a.y === placement.y)?.id;
      const isHovered =
        drag !== null &&
        drag.pieceId === piece.id &&
        candidateId !== undefined &&
        drag.snapCandidateId === candidateId;

      drawJewelPolygon(
        this.targetGraphics,
        piecePolygonCanvas(piece, placement.x, placement.y, placement.turns, this.layout),
        {
          variant: 'target',
          alpha: (isHovered ? 1 : 0.7) * reveal,
          sizePx: pieceRadiusPx(piece.frameSize, this.layout),
        }
      );
    });
  }

  /**
   * Trạng thái 1: Đang kéo (Dragging) - Phóng to và đổ bóng mềm
   */
  private drawDraggingPiece(piece: Piece, turns: number, dragInfo: DragInfo): void {
    const isHoveringSnap = dragInfo.snapCandidateId !== null;
    const framePx = piece.frameSize * this.layout.cellPixel * ANIM_TOKENS.scale.dragging;
    const points = piecePolygonAround(piece, turns, dragInfo.x, dragInfo.y, framePx);

    // Đổ bóng mềm xuống mặt bàn
    this.draggingGraphics.fillStyle(0x000000, 0.45);
    this.draggingGraphics.fillPoints(
      points.map((p) => new Phaser.Geom.Point(p.x + 8, p.y + 12)),
      true
    );

    // Thân mảnh vàng hổ phách sáng
    drawJewelPolygon(this.draggingGraphics, points, {
      variant: 'ghost',
      alpha: isHoveringSnap ? 1 : PIECE_TOKENS.ghostAlpha,
      sizePx: framePx / 2,
    });
  }

  private trayPoints(piece: Piece, pState: PieceState, trayIndex: number): { points: Array<{ x: number; y: number }>; radius: number } {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex, this.trayCount);
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;
    const radius = trayPieceRadiusPx(this.layout, this.trayCount);
    return { points: piecePolygonAround(piece, pState.turns, cx, cy, radius * 2), radius };
  }

  private drawTrayPlaceholder(piece: Piece, pState: PieceState, trayIndex: number): void {
    const { points, radius } = this.trayPoints(piece, pState, trayIndex);
    drawJewelPolygon(this.piecesGraphics, points, { variant: 'placeholder', sizePx: radius });
  }

  private drawTrayPiece(piece: Piece, pState: PieceState, trayIndex: number, isSelected: boolean): void {
    const { points, radius } = this.trayPoints(piece, pState, trayIndex);
    drawJewelPolygon(this.piecesGraphics, points, {
      variant: 'solid',
      alpha: isSelected ? 1 : 0.9,
      sizePx: radius,
    });
  }

  /**
   * Trạng thái 4: Mảnh tạm (Temporary Placement)
   * Hiển thị độ mờ 60% và chấm chú thích phía trên
   */
  private drawTemporaryPiece(
    piece: Piece,
    pState: Extract<PieceState, { kind: 'temporary' }>,
    isSelected: boolean
  ): void {
    const radiusPx = pieceRadiusPx(piece.frameSize, this.layout);
    drawJewelPolygon(
      this.temporaryGraphics,
      piecePolygonCanvas(piece, pState.x, pState.y, pState.turns, this.layout),
      { variant: 'ghost', alpha: isSelected ? 0.85 : 0.6, sizePx: radiusPx }
    );

    const center = pieceCenterCanvas(piece.frameSize, pState.x, pState.y, this.layout);
    this.temporaryGraphics.lineStyle(1, COLOR_NUMBERS.textSecondary, 0.4);
    this.temporaryGraphics.strokeCircle(center.x, center.y - radiusPx - 14, 4);
  }

  /**
   * Trạng thái 2: Đã snap (Snapped)
   */
  private drawSnappedPiece(piece: Piece, x: number, y: number, turns: number): void {
    drawJewelPolygon(
      this.piecesGraphics,
      piecePolygonCanvas(piece, x, y, turns, this.layout),
      { variant: 'solid', sizePx: pieceRadiusPx(piece.frameSize, this.layout) }
    );
  }

  /**
   * Trạng thái 3: Vùng chồng lớp theo luật chẵn/lẻ.
   * Lớp đơn đã được vẽ ở drawSnappedPiece; ở đây chỉ phủ các giao từ hai lớp
   * trở lên: lớp chẵn về màu mặt bàn (vùng biến mất), lớp lẻ về màu mảnh.
   */
  private drawOverlapInversion(boardPieces: BoardPiece[]): void {
    const polygons = boardPieces.map(({ piece, x, y, turns }) =>
      piecePolygonCanvas(piece, x, y, turns, this.layout)
    );

    for (const layer of parityLayers(polygons)) {
      if (layer.depth < 2) continue;
      const pts = layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y));
      if (layer.filled) {
        this.parityGraphics.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
        this.parityGraphics.fillPoints(pts, true);
      } else {
        // Triệt tiêu quang học về màu mặt bia, rìa trong sáng nhẹ màu vàng nhạt
        this.parityGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
        this.parityGraphics.fillPoints(pts, true);
        this.parityGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.7);
        this.parityGraphics.strokePoints(pts, true, true);
      }
    }
  }

  /**
   * Trạng thái 5: Hoàn thành (Victory Celebration)
   */
  private drawVictoryCelebration(): void {
    // Vệt sáng chạy quanh viền tấm bia
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

  /** Hệ số hiện dần của từng bóng mục tiêu (null = hiện đủ); vẽ lại ngay. */
  public setTargetReveal(values: readonly number[] | null): void {
    this.targetReveal = values;
    if (this.lastLevel && this.lastSnapshot) {
      this.drawTargetSilhouette(this.lastLevel, this.lastSnapshot);
    }
  }

  public getTransitionParts(): BoardTransitionParts {
    const present = <T>(items: Array<T | null | undefined>): T[] =>
      items.filter((item): item is T => item !== null && item !== undefined);
    return {
      board: present<Poseable>([this.boardBase, this.gridTexture, this.boardTop]),
      runes: [...this.runes],
      rings: [this.ringGraphics],
      tray: present<Poseable>([this.trayFrame, ...this.trayWells]),
      trayPieces: [this.piecesGraphics],
      pieces: [this.piecesGraphics, this.parityGraphics, this.temporaryGraphics, this.draggingGraphics, this.fxGraphics],
      targets: [this.targetGraphics],
      grid: this.gridTexture,
    };
  }

  public destroy(): void {
    this.ringGraphics.destroy();
    this.boardBase?.destroy();
    this.boardTop?.destroy();
    this.gridTexture?.destroy();
    this.trayFrame?.destroy();
    this.trayWells.forEach((w) => w.destroy());
    this.targetGraphics.destroy();
    this.piecesGraphics.destroy();
    this.parityGraphics.destroy();
    this.temporaryGraphics.destroy();
    this.draggingGraphics.destroy();
    this.fxGraphics.destroy();
  }
}

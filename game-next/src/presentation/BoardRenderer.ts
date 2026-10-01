import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
import type { LayoutMetrics } from './layout.ts';
import {
  gridToCanvas,
  pieceHitbox,
  pieceCenterCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
} from './layout.ts';
import { GridPainter } from './GridPainter.ts';
import { drawJewel } from './JewelShape.ts';
import type { DragInfo, PlayViewSnapshot } from '../application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS, LAYOUT_TOKENS, PIECE_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private layout: LayoutMetrics;
  private ringGraphics: Phaser.GameObjects.Graphics;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private piecesGraphics: Phaser.GameObjects.Graphics;
  private fxGraphics: Phaser.GameObjects.Graphics;
  private gridTexture: Phaser.GameObjects.RenderTexture | null = null;
  private boardFrame: Phaser.GameObjects.Image | null = null;
  private boardSurface: Phaser.GameObjects.Image | null = null;
  private trayWells: Phaser.GameObjects.Image[] = [];
  private trayFrame: Phaser.GameObjects.Image | null = null;

  private ring1Angle = 0;
  private ring2Angle = 0;
  private victoryPulse = 0;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics) {
    this.scene = scene;
    this.layout = layout;

    // Phân lớp depth theo chuẩn DEPTH_TOKENS
    this.ringGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.celestialRings);
    this.bgGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.steleBoard);
    this.targetGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.targetSilhouette);
    this.piecesGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces);
    this.fxGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.temporaryPieces);

    this.drawStaticBoard();
  }

  /**
   * Vẽ Tấm Bia Tiên Tri với viền bevel kính 10px, bo góc 36px,
   * lưới vàng 8 ô (32px), chấm giao điểm và khay mảnh
   */
  public drawStaticBoard(): void {
    const { boardBounds, trayBounds, cellPixel } = this.layout;

    this.bgGraphics.clear();

    const radius = LAYOUT_TOKENS.board.cornerRadius;

    // 1. Mặt bàn: texture gradient thật. Trước đây chồng hai lớp màu phẳng
    // nên lộ một vạch cứng ngang giữa bàn.
    if (!this.boardSurface) {
      this.boardSurface = this.scene.add
        .image(boardBounds.x, boardBounds.y, TEXTURE_KEYS.boardSurface)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.steleBoard);
    }

    // 2. Khung kính: một texture dùng chung cho bàn và khay, thay cho khối
    // bevel thủ công dựng bằng arc trước đây.
    if (!this.boardFrame) {
      this.boardFrame = this.scene.add
        .image(boardBounds.x, boardBounds.y, TEXTURE_KEYS.glassFrameBoard)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.boardGrid + 1);
      this.trayFrame = this.scene.add
        .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.trayArea);
    }

    // 4. Lưới thước đo năm lớp — GridPainter dựng một lần vào RenderTexture
    if (!this.gridTexture) {
      this.gridTexture = GridPainter.paint(this.scene, boardBounds);
    }

    // 5. Khắc 4 ký tự rune chiêm tinh tại 4 phương vị (0°, 90°, 180°, 270°)
    this.drawCardinalRunes(boardBounds.x + boardBounds.width / 2, boardBounds.y + boardBounds.height / 2);

    // 6. Khay: hai ô lõm trong suốt, mỗi ô chứa một mảnh. Trước đây là một
    // hộp đen đặc che luôn cả nút Đặt lại phía sau.
    if (this.trayWells.length === 0) {
      const wellW = trayBounds.width / 2 - 24;
      for (let i = 0; i < 2; i++) {
        const x = trayBounds.x + 16 + i * (trayBounds.width / 2 - 8);
        this.trayWells.push(
          this.scene.add
            .image(x, trayBounds.y + 14, TEXTURE_KEYS.trayWell)
            .setOrigin(0, 0)
            .setDisplaySize(wellW, trayBounds.height - 28)
            // Dưới lớp mảnh (placedPieces), nếu không ô lõm phủ lên mảnh
            .setDepth(DEPTH_TOKENS.steleBoard)
        );
      }
    }
  }

  /**
   * Vẽ 4 ký tự phương vị chiêm tinh
   */
  private drawCardinalRunes(cx: number, cy: number): void {
    const { boardBounds } = this.layout;
    const g = this.bgGraphics;
    g.fillStyle(COLOR_NUMBERS.gridModule, 0.45);

    // Bắc (0°)
    g.fillCircle(cx, boardBounds.y + 24, 3);
    // Nam (180°)
    g.fillCircle(cx, boardBounds.y + boardBounds.height - 24, 3);
    // Đông (90°)
    g.fillCircle(boardBounds.x + boardBounds.width - 24, cy, 3);
    // Tây (270°)
    g.fillCircle(boardBounds.x + 24, cy, 3);
  }

  /**
   * Cập nhật chuyển động xoay của hai vòng thiên cầu đồng tâm phía sau bia
   */
  public updateCelestialRings(delta: number, isWon: boolean): void {
    const speedMult = isWon ? 3.0 : 1.0;
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
    const { cellPixel } = this.layout;
    // Bán kính suy ra từ frameSize thật của mảnh, không viết cứng: mọi mảnh
    // trong một màn dùng chung một khung nên lấy mảnh đầu làm chuẩn.
    const radiusPx = pieceRadiusPx(level.pieces[0].frameSize, this.layout);
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // Cập nhật vòng quay thiên văn
    this.updateCelestialRings(delta, snapshot.phase === 'won');

    // 1. Bóng mục tiêu mờ (Target Silhouette)
    this.targetGraphics.clear();
    if (snapshot.showTarget) {
      const targetCenters = [
        gridToCanvas(40, 80, this.layout),
        gridToCanvas(88, 80, this.layout),
      ];

      for (let idx = 0; idx < targetCenters.length; idx++) {
        const center = targetCenters[idx];
        const isHovered =
          (idx === 0 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D1') ||
          (idx === 1 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D2');

        drawJewel(this.targetGraphics, {
          cx: center.x,
          cy: center.y,
          radius: radiusPx,
          variant: 'target',
          alpha: isHovered ? 1 : 0.7,
        });
      }
    }

    // 2. Vẽ các mảnh ghép
    this.piecesGraphics.clear();
    this.fxGraphics.clear();

    const snappedPieces: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }> = [];

    for (let i = 0; i < level.pieces.length; i++) {
      const piece = level.pieces[i];
      const pState = piecesState[piece.id] ?? { kind: 'tray', turns: 0 };
      const isSelected = snapshot.selectedPieceId === piece.id;
      const isDraggingThis = piece.id === draggingPieceId;

      if (isDraggingThis && snapshot.dragInfo) {
        // Trạng thái 1: Đang kéo (Dragging)
        if (pState.kind === 'tray') {
          this.drawTrayPlaceholder(piece, pState, i, radiusPx);
        }
        this.drawDraggingPiece(snapshot.dragInfo, radiusPx);
      } else {
        if (pState.kind === 'tray') {
          this.drawTrayPiece(piece, pState, i, isSelected, radiusPx);
        } else if (pState.kind === 'temporary') {
          // Trạng thái 4: Mảnh tạm chưa snap
          this.drawTemporaryPiece(pState, isSelected, radiusPx, piece.frameSize);
        } else if (pState.kind === 'snapped') {
          // Trạng thái 2: Đã snap
          snappedPieces.push({ piece, pState });
          this.drawSnappedPiece(piece, pState, isSelected, radiusPx);
        }
      }
    }

    // Trạng thái 3: Vùng giao 2 lớp (Overlap Inversion)
    // Nếu có 2 mảnh trở lên cùng snap và có vùng giao thoa, triệt tiêu vùng giao về màu mặt bia
    if (snappedPieces.length >= 2) {
      this.drawOverlapInversion(snappedPieces, radiusPx);
    }

    // Trạng thái 5: Hoàn thành (Victory Celebration)
    if (snapshot.phase === 'won') {
      this.victoryPulse += delta * 0.004;
      this.drawVictoryCelebration(radiusPx);
    }
  }



  /**
   * Trạng thái 1: Đang kéo (Dragging) - Phóng to 1.06x và đổ bóng mềm
   */
  private drawDraggingPiece(dragInfo: DragInfo, radiusPx: number): void {
    const isHoveringSnap = dragInfo.snapCandidateId !== null;
    const r = radiusPx * 1.06;

    // Đổ bóng mềm xuống mặt bàn
    this.piecesGraphics.fillStyle(0x000000, 0.45);
    const shadowPoints = [
      new Phaser.Geom.Point(dragInfo.x + 8, dragInfo.y + 12 - r),
      new Phaser.Geom.Point(dragInfo.x + 8 + r, dragInfo.y + 12),
      new Phaser.Geom.Point(dragInfo.x + 8, dragInfo.y + 12 + r),
      new Phaser.Geom.Point(dragInfo.x + 8 - r, dragInfo.y + 12),
    ];
    this.piecesGraphics.fillPoints(shadowPoints, true);

    // Thân mảnh vàng hổ phách sáng
    drawJewel(this.piecesGraphics, {
      cx: dragInfo.x,
      cy: dragInfo.y,
      radius: r,
      variant: 'ghost',
      alpha: isHoveringSnap ? 1 : PIECE_TOKENS.ghostAlpha,
    });
  }

  private drawTrayPlaceholder(
    piece: Piece,
    pState: PieceState,
    trayIndex: number,
    radiusPx: number
  ): void {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex);
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;

    drawJewel(this.piecesGraphics, {
      cx,
      cy,
      radius: trayPieceRadiusPx(this.layout),
      variant: 'placeholder',
    });
  }

  private drawTrayPiece(
    piece: Piece,
    pState: PieceState,
    trayIndex: number,
    isSelected: boolean,
    radiusPx: number
  ): void {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex);
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;

    drawJewel(this.piecesGraphics, {
      cx,
      cy,
      radius: trayPieceRadiusPx(this.layout),
      variant: 'solid',
      alpha: isSelected ? 1 : 0.9,
    });
  }

  /**
   * Trạng thái 4: Mảnh tạm (Temporary Placement)
   * Hiển thị viền nét đứt và độ mờ 60%
   */
  private drawTemporaryPiece(
    pState: Extract<PieceState, { kind: 'temporary' }>,
    isSelected: boolean,
    radiusPx: number,
    frameSize: number
  ): void {
    const center = pieceCenterCanvas(frameSize, pState.x, pState.y, this.layout);

    drawJewel(this.piecesGraphics, {
      cx: center.x,
      cy: center.y,
      radius: radiusPx,
      variant: 'ghost',
      alpha: isSelected ? 0.85 : 0.6,
    });

    // Chữ chú thích nhỏ phía trên mảnh
    this.fxGraphics.lineStyle(1, COLOR_NUMBERS.textSecondary, 0.4);
    this.fxGraphics.strokeCircle(center.x, center.y - radiusPx - 14, 4);
  }

  /**
   * Trạng thái 2: Đã snap (Snapped)
   */
  private drawSnappedPiece(
    piece: Piece,
    pState: Extract<PieceState, { kind: 'snapped' }>,
    isSelected: boolean,
    radiusPx: number
  ): void {
    const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
    if (!anchor) return;

    const center = pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, this.layout);

    drawJewel(this.piecesGraphics, {
      cx: center.x,
      cy: center.y,
      radius: radiusPx,
      variant: 'solid',
    });
  }

  /**
   * Trạng thái 3: Vùng giao 2 lớp (Overlap Inversion)
   * Triệt tiêu vùng giao về màu mặt bàn
   */
  private drawOverlapInversion(
    snapped: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }>,
    radiusPx: number
  ): void {
    // Hai mảnh tiếp giáp chạm đỉnh tại tâm bàn
    // Nếu trong màn có overlap (như Chương 2), vẽ vùng giao triệt tiêu
    const centers = snapped.map((s) => {
      const anchor = s.piece.anchors.find((a) => a.id === s.pState.anchorId) ?? s.piece.anchors[0];
      return pieceCenterCanvas(s.piece.frameSize, anchor.x, anchor.y, this.layout);
    });

    if (centers.length >= 2) {
      const dist = Phaser.Math.Distance.Between(centers[0].x, centers[0].y, centers[1].x, centers[1].y);
      // Nếu 2 tâm cách nhau nhỏ hơn 2 * radiusPx -> có giao nhau
      if (dist < radiusPx * 2 - 4) {
        const midX = (centers[0].x + centers[1].x) / 2;
        const midY = (centers[0].y + centers[1].y) / 2;
        const overlapRadius = (radiusPx * 2 - dist) / 2;

        // Triệt tiêu quang học về màu mặt bia
        this.fxGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
        this.fxGraphics.fillCircle(midX, midY, overlapRadius);

        // Rìa trong vùng khuyết sáng nhẹ màu vàng nhạt
        this.fxGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.7);
        this.fxGraphics.strokeCircle(midX, midY, overlapRadius);
      }
    }
  }

  /**
   * Trạng thái 5: Hoàn thành (Victory Celebration)
   */
  private drawVictoryCelebration(radiusPx: number): void {
    const contact = gridToCanvas(GRID_WIDTH / 2, GRID_HEIGHT / 2, this.layout);

    // Ngôi sao 4 cánh lấp lánh tại tâm kết nối
    const sparkleSize = 16 + Math.sin(this.victoryPulse) * 4;
    this.drawSparkleStar(this.fxGraphics, contact.x, contact.y, sparkleSize, 0xffffff, COLOR_NUMBERS.amberSolid);

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

  private drawSparkleStar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    coreColor: number,
    rayColor: number
  ): void {
    g.lineStyle(2, rayColor, 0.9);
    g.lineBetween(x, y - size, x, y + size);
    g.lineBetween(x - size, y, x + size, y);

    const small = size * 0.5;
    g.lineStyle(1, rayColor, 0.6);
    g.lineBetween(x - small, y - small, x + small, y + small);
    g.lineBetween(x - small, y + small, x + small, y - small);

    g.fillStyle(coreColor, 1);
    g.fillCircle(x, y, 3.5);
  }

  public destroy(): void {
    this.ringGraphics.destroy();
    this.bgGraphics.destroy();
    this.targetGraphics.destroy();
    this.piecesGraphics.destroy();
    this.fxGraphics.destroy();
  }
}

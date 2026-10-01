import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import type { LayoutMetrics } from './layout.ts';
import { gridToCanvas, pieceHitbox } from './layout.ts';
import type { DragInfo, PlayViewSnapshot } from '../application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS } from './designTokens.ts';

export class BoardRenderer {
  private layout: LayoutMetrics;
  private ringGraphics: Phaser.GameObjects.Graphics;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private piecesGraphics: Phaser.GameObjects.Graphics;
  private fxGraphics: Phaser.GameObjects.Graphics;

  private ring1Angle = 0;
  private ring2Angle = 0;
  private victoryPulse = 0;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics) {
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

    // 1. Mặt đá Tấm Bia Tiên Tri (Stele Surface)
    this.bgGraphics.fillStyle(COLOR_NUMBERS.navyStele, 0.98);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      36
    );

    // 2. Viền kính dày 10px (Ice Glass Bevel 10px)
    this.bgGraphics.lineStyle(10, COLOR_NUMBERS.icePrimary, 0.95);
    this.bgGraphics.strokeRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      36
    );

    // Điểm phản quang sáng (Bevel highlight) ở cạnh trên
    this.bgGraphics.lineStyle(3, COLOR_NUMBERS.iceHighlight, 0.9);
    this.bgGraphics.beginPath();
    this.bgGraphics.arc(boardBounds.x + 36, boardBounds.y + 36, 36, Math.PI, Math.PI * 1.5);
    this.bgGraphics.lineTo(boardBounds.x + boardBounds.width - 36, boardBounds.y);
    this.bgGraphics.arc(boardBounds.x + boardBounds.width - 36, boardBounds.y + 36, 36, Math.PI * 1.5, Math.PI * 2);
    this.bgGraphics.strokePath();

    // Rãnh bóng tối ở cạnh dưới (Bevel shadow)
    this.bgGraphics.lineStyle(3, COLOR_NUMBERS.iceShadow, 0.85);
    this.bgGraphics.beginPath();
    this.bgGraphics.arc(boardBounds.x + 36, boardBounds.y + boardBounds.height - 36, 36, Math.PI * 0.5, Math.PI);
    this.bgGraphics.lineTo(boardBounds.x + boardBounds.width - 36, boardBounds.y + boardBounds.height);
    this.bgGraphics.strokePath();

    // 3. Đường chỉ phụ vàng hổ phách đứt nét bên trong (cách viền 8px)
    this.bgGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGrid, 0.45);
    this.bgGraphics.strokeRoundedRect(
      boardBounds.x + 8,
      boardBounds.y + 8,
      boardBounds.width - 16,
      boardBounds.height - 16,
      28
    );

    // 4. Lưới tọa độ vàng hổ phách 8 ô (32px mỗi ô)
    const step = 8 * cellPixel; // 32px
    this.bgGraphics.lineStyle(1, COLOR_NUMBERS.amberGrid, 0.12);

    for (let x = boardBounds.x + step; x < boardBounds.x + boardBounds.width; x += step) {
      this.bgGraphics.lineBetween(x, boardBounds.y + 12, x, boardBounds.y + boardBounds.height - 12);
    }
    for (let y = boardBounds.y + step; y < boardBounds.y + boardBounds.height; y += step) {
      this.bgGraphics.lineBetween(boardBounds.x + 12, y, boardBounds.x + boardBounds.width - 12, y);
    }

    // Trục trung tâm (Center Axis) sáng hơn
    const centerAxisX = boardBounds.x + 64 * cellPixel; // x=64
    const centerAxisY = boardBounds.y + 96 * cellPixel; // y=96
    this.bgGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGrid, 0.28);
    this.bgGraphics.lineBetween(centerAxisX, boardBounds.y + 8, centerAxisX, boardBounds.y + boardBounds.height - 8);
    this.bgGraphics.lineBetween(boardBounds.x + 8, centerAxisY, boardBounds.x + boardBounds.width - 8, centerAxisY);

    // Chấm tròn tinh thể tại các giao điểm lưới (Intersection dots)
    this.bgGraphics.fillStyle(COLOR_NUMBERS.amberGrid, 0.35);
    for (let x = boardBounds.x + step; x < boardBounds.x + boardBounds.width; x += step) {
      for (let y = boardBounds.y + step; y < boardBounds.y + boardBounds.height; y += step) {
        this.bgGraphics.fillCircle(x, y, 1.5);
      }
    }

    // 5. Khắc 4 ký tự rune chiêm tinh tại 4 phương vị (0°, 90°, 180°, 270°)
    this.drawCardinalRunes(boardBounds.x + boardBounds.width / 2, boardBounds.y + boardBounds.height / 2);

    // 6. Khay chứa mảnh bên dưới (y=968..1108)
    this.bgGraphics.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
    this.bgGraphics.fillRoundedRect(
      trayBounds.x,
      trayBounds.y,
      trayBounds.width,
      trayBounds.height,
      20
    );
    this.bgGraphics.lineStyle(2, COLOR_NUMBERS.icePrimary, 0.5);
    this.bgGraphics.strokeRoundedRect(
      trayBounds.x,
      trayBounds.y,
      trayBounds.width,
      trayBounds.height,
      20
    );
  }

  /**
   * Vẽ 4 ký tự phương vị chiêm tinh
   */
  private drawCardinalRunes(cx: number, cy: number): void {
    const { boardBounds } = this.layout;
    const g = this.bgGraphics;
    g.fillStyle(COLOR_NUMBERS.amberGrid, 0.45);

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
    this.ringGraphics.lineStyle(1.2, COLOR_NUMBERS.amberGrid, 0.22);
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
    const radiusPx = 20 * cellPixel; // Bán kính hình thoi = 80px
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // Cập nhật vòng quay thiên văn
    this.updateCelestialRings(delta, snapshot.phase === 'won');

    // 1. Bóng mục tiêu mờ (Target Silhouette)
    this.targetGraphics.clear();
    if (snapshot.showTarget) {
      const targetCenters = [
        gridToCanvas(44, 96, this.layout),
        gridToCanvas(84, 96, this.layout),
      ];

      for (let idx = 0; idx < targetCenters.length; idx++) {
        const center = targetCenters[idx];
        const isHovered =
          (idx === 0 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D1') ||
          (idx === 1 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D2');

        this.drawVectorDiamond(
          this.targetGraphics,
          center.x,
          center.y,
          radiusPx,
          COLOR_NUMBERS.icePrimary,
          isHovered ? 0.32 : 0.18,
          isHovered ? COLOR_NUMBERS.amberSolid : COLOR_NUMBERS.icePrimary,
          isHovered ? 0.85 : 0.45,
          isHovered ? 2.2 : 1.5
        );
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
          this.drawTemporaryPiece(pState, isSelected, radiusPx);
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
   * Vẽ hình thoi Vector sắc nét
   */
  private drawVectorDiamond(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    strokeWidth: number
  ): void {
    const points = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r, cy),
    ];

    g.fillStyle(fillColor, fillAlpha);
    g.fillPoints(points, true);

    g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
    g.strokePoints(points, true);

    // Gân tinh thể mảnh bên trong
    g.lineStyle(1, strokeColor, strokeAlpha * 0.3);
    g.lineBetween(cx, cy - r, cx, cy + r);
    g.lineBetween(cx - r, cy, cx + r, cy);

    // Điểm tinh thể tại 4 góc
    g.fillStyle(strokeColor, strokeAlpha * 0.9);
    g.fillCircle(cx, cy - r, 2);
    g.fillCircle(cx + r, cy, 2);
    g.fillCircle(cx, cy + r, 2);
    g.fillCircle(cx - r, cy, 2);
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
    this.drawVectorDiamond(
      this.piecesGraphics,
      dragInfo.x,
      dragInfo.y,
      r,
      isHoveringSnap ? COLOR_NUMBERS.amberGlow : COLOR_NUMBERS.amberSolid,
      isHoveringSnap ? 0.98 : 0.92,
      COLOR_NUMBERS.amberGlow,
      1.0,
      isHoveringSnap ? 2.8 : 2.0
    );
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

    this.drawVectorDiamond(
      this.piecesGraphics,
      cx,
      cy,
      radiusPx,
      COLOR_NUMBERS.navySpace,
      0.35,
      COLOR_NUMBERS.iceShadow,
      0.4,
      1.0
    );
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

    this.drawVectorDiamond(
      this.piecesGraphics,
      cx,
      cy,
      radiusPx,
      COLOR_NUMBERS.amberSolid,
      isSelected ? 0.95 : 0.85,
      COLOR_NUMBERS.amberGlow,
      isSelected ? 1.0 : 0.8,
      isSelected ? 2.5 : 1.5
    );
  }

  /**
   * Trạng thái 4: Mảnh tạm (Temporary Placement)
   * Hiển thị viền nét đứt và độ mờ 60%
   */
  private drawTemporaryPiece(
    pState: Extract<PieceState, { kind: 'temporary' }>,
    isSelected: boolean,
    radiusPx: number
  ): void {
    const center = gridToCanvas(pState.x + 20, pState.y + 20, this.layout);

    this.drawVectorDiamond(
      this.piecesGraphics,
      center.x,
      center.y,
      radiusPx,
      COLOR_NUMBERS.amberSolid,
      0.6,
      COLOR_NUMBERS.amberGlow,
      0.75,
      isSelected ? 2.5 : 1.5
    );

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

    const center = gridToCanvas(anchor.x + 20, anchor.y + 20, this.layout);

    this.drawVectorDiamond(
      this.piecesGraphics,
      center.x,
      center.y,
      radiusPx,
      COLOR_NUMBERS.amberSolid,
      0.95,
      COLOR_NUMBERS.amberGlow,
      1.0,
      isSelected ? 2.6 : 1.8
    );
  }

  /**
   * Trạng thái 3: Vùng giao 2 lớp (Overlap Inversion)
   * Triệt tiêu vùng giao về màu nền mặt bia `#101B32`
   */
  private drawOverlapInversion(
    snapped: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }>,
    radiusPx: number
  ): void {
    // Với 2 mảnh Song Tinh tại 1-1, 2 mảnh tiếp giáp chạm đỉnh tại (64, 96)
    // Nếu trong màn có overlap (như Chương 2), vẽ vùng giao triệt tiêu
    const centers = snapped.map((s) => {
      const anchor = s.piece.anchors.find((a) => a.id === s.pState.anchorId) ?? s.piece.anchors[0];
      return gridToCanvas(anchor.x + 20, anchor.y + 20, this.layout);
    });

    if (centers.length >= 2) {
      const dist = Phaser.Math.Distance.Between(centers[0].x, centers[0].y, centers[1].x, centers[1].y);
      // Nếu 2 tâm cách nhau nhỏ hơn 2 * radiusPx -> có giao nhau
      if (dist < radiusPx * 2 - 4) {
        const midX = (centers[0].x + centers[1].x) / 2;
        const midY = (centers[0].y + centers[1].y) / 2;
        const overlapRadius = (radiusPx * 2 - dist) / 2;

        // Triệt tiêu quang học về màu mặt bia
        this.fxGraphics.fillStyle(COLOR_NUMBERS.navyStele, 1.0);
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
    const contact = gridToCanvas(64, 96, this.layout);

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

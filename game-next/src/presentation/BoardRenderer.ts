import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import type { LayoutMetrics } from './layout.ts';
import { gridToCanvas, pieceHitbox } from './layout.ts';
import type { DragInfo, PlayViewSnapshot } from '../application/playController.ts';

export class BoardRenderer {
  private layout: LayoutMetrics;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private piecesGraphics: Phaser.GameObjects.Graphics;
  private fxGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics) {
    this.layout = layout;

    this.bgGraphics = scene.add.graphics();
    this.targetGraphics = scene.add.graphics();
    this.piecesGraphics = scene.add.graphics();
    this.fxGraphics = scene.add.graphics();

    this.drawStaticBoard();
  }

  private drawStaticBoard(): void {
    const { boardBounds, trayBounds } = this.layout;

    this.bgGraphics.clear();

    // 1. Tinh Bàn Galaxy (Cosmic Board Surface)
    this.bgGraphics.fillStyle(0x0a1128, 0.95);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      16
    );

    // Viền phát sáng dịu
    this.bgGraphics.lineStyle(1.5, 0x4ecdc4, 0.45);
    this.bgGraphics.strokeRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      16
    );

    // 2. Lưới toạ độ Chiêm tinh mảnh mai (Starlight Grid)
    this.bgGraphics.lineStyle(1, 0x68b8dc, 0.08);
    for (let x = 16; x < 128; x += 16) {
      const cx = boardBounds.x + x * this.layout.cellPixel;
      this.bgGraphics.lineBetween(cx, boardBounds.y + 8, cx, boardBounds.y + boardBounds.height - 8);
    }
    for (let y = 16; y < 128; y += 16) {
      const cy = boardBounds.y + y * this.layout.cellPixel;
      this.bgGraphics.lineBetween(boardBounds.x + 8, cy, boardBounds.x + boardBounds.width - 8, cy);
    }

    // 3. Tinh điểm giao thoa (Cosmic Coordinate Nodes)
    this.bgGraphics.fillStyle(0x4ecdc4, 0.25);
    for (let x = 32; x < 128; x += 32) {
      for (let y = 32; y < 128; y += 32) {
        const cx = boardBounds.x + x * this.layout.cellPixel;
        const cy = boardBounds.y + y * this.layout.cellPixel;
        this.bgGraphics.fillCircle(cx, cy, 2);
      }
    }

    // 4. Khay chứa cổ ngữ (Astral Tray)
    this.bgGraphics.fillStyle(0x0c1730, 0.95);
    this.bgGraphics.fillRoundedRect(
      trayBounds.x,
      trayBounds.y,
      trayBounds.width,
      trayBounds.height,
      16
    );
    this.bgGraphics.lineStyle(1.5, 0x3a506b, 0.5);
    this.bgGraphics.strokeRoundedRect(
      trayBounds.x,
      trayBounds.y,
      trayBounds.width,
      trayBounds.height,
      16
    );
  }

  render(
    level: Level,
    snapshot: PlayViewSnapshot,
    piecesState: Record<string, PieceState>
  ): void {
    const { cellPixel } = this.layout;
    const radiusPx = 20 * cellPixel; // Bán kính hình thoi (40x40 ô -> r = 20)
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // 1. Vẽ bóng mục tiêu Vector (Silhouette)
    this.targetGraphics.clear();
    if (snapshot.showTarget) {
      // Hai hình thoi mục tiêu tại Neo A (44, 96) và (84, 96)
      const targetCenters = [
        gridToCanvas(44, 96, this.layout),
        gridToCanvas(84, 96, this.layout),
      ];

      for (const center of targetCenters) {
        this.drawVectorDiamond(
          this.targetGraphics,
          center.x,
          center.y,
          radiusPx,
          0x4ecdc4, // Nebula Cyan
          0.15,     // Dịu mắt
          0x4ecdc4,
          0.45,
          1.5
        );
      }
    }

    // 2. Vẽ các mảnh ghép
    this.piecesGraphics.clear();
    this.fxGraphics.clear();

    for (let i = 0; i < level.pieces.length; i++) {
      const piece = level.pieces[i];
      const pState = piecesState[piece.id] ?? { kind: 'tray', turns: 0 };
      const isSelected = snapshot.selectedPieceId === piece.id;
      const isDraggingThis = piece.id === draggingPieceId;

      if (isDraggingThis && snapshot.dragInfo) {
        // Mảnh đang được kéo:
        // A. Trong khay vẽ bóng mờ slot (placeholder)
        if (pState.kind === 'tray') {
          this.drawTrayPlaceholder(piece, pState, i, radiusPx);
        }
        // B. Vẽ mảnh bay bám sát ngón tay hoặc hút vào neo candidate
        this.drawDraggingPiece(piece, snapshot.dragInfo, radiusPx);
      } else {
        // Mảnh không bị kéo: vẽ bình thường
        if (pState.kind === 'tray') {
          this.drawTrayPiece(piece, pState, i, isSelected, radiusPx);
        } else if (pState.kind === 'temporary') {
          this.drawTemporaryPiece(pState, isSelected, radiusPx);
        } else if (pState.kind === 'snapped') {
          this.drawSnappedPiece(piece, pState, isSelected, radiusPx);
        }
      }
    }

    // 3. Nếu đã hoàn thành (Won), vẽ điểm sáng kết nối chiêm tinh tại điểm chạm đỉnh (64, 96)
    if (snapshot.phase === 'won') {
      const contact = gridToCanvas(64, 96, this.layout);
      this.drawSparkleStar(this.fxGraphics, contact.x, contact.y, 14, 0xffffff, 0xffd166);
    }
  }

  /**
   * Vẽ hình thoi Vector Polygon phẳng, thẳng tắp và sắc nét (KHÔNG VẼ VÒNG TRÒN)
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
      new Phaser.Geom.Point(cx, cy - r), // Đỉnh trên
      new Phaser.Geom.Point(cx + r, cy), // Đỉnh phải
      new Phaser.Geom.Point(cx, cy + r), // Đỉnh dưới
      new Phaser.Geom.Point(cx - r, cy), // Đỉnh trái
    ];

    // Mặt phẳng đa giác thẳng tắp
    g.fillStyle(fillColor, fillAlpha);
    g.fillPoints(points, true);

    // Đường viền sắc nét
    g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
    g.strokePoints(points, true);

    // Đường gân tinh thể chiêm tinh nhẹ bên trong
    g.lineStyle(1, strokeColor, strokeAlpha * 0.35);
    g.lineBetween(cx, cy - r, cx, cy + r);
    g.lineBetween(cx - r, cy, cx + r, cy);

    // Hạt sao lấp lánh tại 4 đỉnh
    g.fillStyle(strokeColor, strokeAlpha * 0.85);
    g.fillCircle(cx, cy - r, 2);
    g.fillCircle(cx + r, cy, 2);
    g.fillCircle(cx, cy + r, 2);
    g.fillCircle(cx - r, cy, 2);
  }

  /**
   * Mảnh đang kéo theo con trỏ chuột (mượt mà 60 FPS)
   */
  private drawDraggingPiece(piece: Piece, dragInfo: DragInfo, radiusPx: number): void {
    let drawX = dragInfo.x;
    let drawY = dragInfo.y;
    let isSnappedPreview = false;

    // Nếu đang trong bán kính hút neo (snap candidate)
    if (dragInfo.snapCandidateId) {
      const anchor = piece.anchors.find((a) => a.id === dragInfo.snapCandidateId);
      if (anchor) {
        // Tự động hút nhẹ về tâm neo (44, 96 hoặc 84, 96)
        const snapCenter = gridToCanvas(anchor.x + 20, anchor.y + 20, this.layout);
        drawX = snapCenter.x;
        drawY = snapCenter.y;
        isSnappedPreview = true;
      }
    }

    // Vẽ hình thoi đang kéo (thẳng tắp, thuần khiết, không vòng tròn!)
    this.drawVectorDiamond(
      this.piecesGraphics,
      drawX,
      drawY,
      radiusPx,
      isSnappedPreview ? 0xfff3b0 : 0xf9c74f, // Vàng sáng khi hút neo, vàng hổ phách khi bay tự do
      isSnappedPreview ? 0.98 : 0.9,
      isSnappedPreview ? 0xffd166 : 0xffe082,
      1.0,
      isSnappedPreview ? 3.0 : 2.0
    );
  }

  /**
   * Ô khay rỗng khi mảnh đang được nhấc ra kéo
   */
  private drawTrayPlaceholder(
    piece: Piece,
    pState: PieceState,
    trayIndex: number,
    radiusPx: number
  ): void {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex);
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;

    // Vẽ hình thoi mờ biểu thị vị trí xuất phát
    this.drawVectorDiamond(
      this.piecesGraphics,
      cx,
      cy,
      radiusPx,
      0x0a1128,
      0.4,
      0x3a506b,
      0.35,
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
      0xf9c74f, // Star Gold
      isSelected ? 0.95 : 0.8,
      0xffe082, // Amber Starlight
      isSelected ? 1.0 : 0.8,
      isSelected ? 2.5 : 1.5
    );
  }

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
      0xf9c74f,
      0.85,
      0xffe082,
      1.0,
      isSelected ? 2.5 : 1.8
    );
  }

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
      0xf9c74f,
      0.92,
      0xfff3b0,
      1.0,
      isSelected ? 2.5 : 1.8
    );
  }

  /**
   * Ngôi sao 4 cánh lấp lánh biểu thị kết nối chiêm tinh khi hoàn thành
   */
  private drawSparkleStar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    coreColor: number,
    rayColor: number
  ): void {
    // 4 tia sáng
    g.lineStyle(2, rayColor, 0.9);
    g.lineBetween(x, y - size, x, y + size);
    g.lineBetween(x - size, y, x + size, y);

    // 4 tia chéo nhỏ
    const small = size * 0.5;
    g.lineStyle(1, rayColor, 0.6);
    g.lineBetween(x - small, y - small, x + small, y + small);
    g.lineBetween(x - small, y + small, x + small, y - small);

    // Tâm sao phát sáng
    g.fillStyle(coreColor, 1);
    g.fillCircle(x, y, 3);
  }

  destroy(): void {
    this.bgGraphics.destroy();
    this.targetGraphics.destroy();
    this.piecesGraphics.destroy();
    this.fxGraphics.destroy();
  }
}

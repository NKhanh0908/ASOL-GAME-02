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

  /**
   * Vẽ lưới ô vuông nền chuẩn mực (Mỗi ô = 20x20 cell),
   * làm chuẩn tỉ lệ cho hình mục tiêu và các mảnh kính
   */
  private drawStaticBoard(): void {
    const { boardBounds, trayBounds, cellPixel } = this.layout;

    this.bgGraphics.clear();

    // 1. Nền Tinh Bàn Galaxy
    this.bgGraphics.fillStyle(0x080f24, 0.98);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      16
    );

    // Viền phát sáng nhẹ quanh bàn cờ
    this.bgGraphics.lineStyle(1.5, 0x4ecdc4, 0.4);
    this.bgGraphics.strokeRoundedRect(
      boardBounds.x,
      boardBounds.y,
      boardBounds.width,
      boardBounds.height,
      16
    );

    // 2. Lưới ô vuông nền chuẩn (Astrological Unit Grid: 20x20 cell mỗi ô vuông)
    // Các đường dọc: x = 4, 24, 44, 64, 84, 104, 124 (6 cột ô vuông 20x20)
    // Các đường ngang: y = 16, 36, 56, 76, 96, 116 (5 hàng ô vuông 20x20)
    const xs = [4, 24, 44, 64, 84, 104, 124];
    const ys = [16, 36, 56, 76, 96, 116];

    // Vẽ các ô vuông nền cách điệu
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < ys.length - 1; j++) {
        const x1 = boardBounds.x + xs[i] * cellPixel;
        const y1 = boardBounds.y + ys[j] * cellPixel;
        const w = (xs[i + 1] - xs[i]) * cellPixel;
        const h = (ys[j + 1] - ys[j]) * cellPixel;

        // Viền ô vuông nền tinh tế
        this.bgGraphics.lineStyle(1, 0x4ecdc4, 0.12);
        this.bgGraphics.strokeRect(x1, y1, w, h);

        // Chấm tinh điểm ở tâm mỗi ô vuông nền
        this.bgGraphics.fillStyle(0x68b8dc, 0.15);
        this.bgGraphics.fillCircle(x1 + w / 2, y1 + h / 2, 1);
      }
    }

    // Các đường trục chính (Center Axis) phát sáng hơn một chút
    const centerAxisX = boardBounds.x + 64 * cellPixel;
    const centerAxisY = boardBounds.y + 96 * cellPixel;

    this.bgGraphics.lineStyle(1.2, 0x4ecdc4, 0.25);
    this.bgGraphics.lineBetween(centerAxisX, boardBounds.y + 16 * cellPixel, centerAxisX, boardBounds.y + 116 * cellPixel);
    this.bgGraphics.lineBetween(boardBounds.x + 4 * cellPixel, centerAxisY, boardBounds.x + 124 * cellPixel, centerAxisY);

    // Điểm giao tinh thể tại các đỉnh lưới
    this.bgGraphics.fillStyle(0x4ecdc4, 0.4);
    for (const x of xs) {
      for (const y of ys) {
        const cx = boardBounds.x + x * cellPixel;
        const cy = boardBounds.y + y * cellPixel;
        this.bgGraphics.fillCircle(cx, cy, 1.8);
      }
    }

    // 3. Khay chứa cổ ngữ bên dưới (Astral Tray)
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
    const radiusPx = 20 * cellPixel; // Bán kính hình thoi = 20 cell (khớp 1 ô vuông nền mỗi phía)
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // 1. Vẽ bóng mục tiêu Vector (Silhouette) — sinh ra chuẩn xác từ ô vuông nền
    this.targetGraphics.clear();
    if (snapshot.showTarget) {
      // Hai hình thoi mục tiêu tại Neo A: tâm (44, 96) và (84, 96)
      // 4 đỉnh cắm đúng vào các giao điểm của lưới ô vuông nền!
      const targetCenters = [
        gridToCanvas(44, 96, this.layout),
        gridToCanvas(84, 96, this.layout),
      ];

      for (let idx = 0; idx < targetCenters.length; idx++) {
        const center = targetCenters[idx];
        const isTargetHovered =
          (idx === 0 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D1') ||
          (idx === 1 && snapshot.dragInfo?.snapCandidateId === 'A' && snapshot.dragInfo.pieceId === 'D2');

        this.drawVectorDiamond(
          this.targetGraphics,
          center.x,
          center.y,
          radiusPx,
          0x4ecdc4, // Nebula Cyan
          isTargetHovered ? 0.28 : 0.14,
          isTargetHovered ? 0xffd166 : 0x4ecdc4,
          isTargetHovered ? 0.8 : 0.4,
          isTargetHovered ? 2.0 : 1.5
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
        // A. Trong khay vẽ ô placeholder mờ
        if (pState.kind === 'tray') {
          this.drawTrayPlaceholder(piece, pState, i, radiusPx);
        }
        // B. Vẽ mảnh bay bám sát ngón tay mượt mà (không tự động nhảy giật)
        this.drawDraggingPiece(snapshot.dragInfo, radiusPx);
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
   * Vẽ hình thoi Vector Polygon phẳng, thẳng tắp và sắc nét (KHÔNG CÓ VÒNG TRÒN)
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
      new Phaser.Geom.Point(cx, cy - r), // Đỉnh trên (chạm giao điểm lưới)
      new Phaser.Geom.Point(cx + r, cy), // Đỉnh phải (chạm giao điểm lưới)
      new Phaser.Geom.Point(cx, cy + r), // Đỉnh dưới (chạm giao điểm lưới)
      new Phaser.Geom.Point(cx - r, cy), // Đỉnh trái (chạm giao điểm lưới)
    ];

    // Mặt phẳng đa giác thẳng tắp
    g.fillStyle(fillColor, fillAlpha);
    g.fillPoints(points, true);

    // Đường viền sắc nét
    g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
    g.strokePoints(points, true);

    // Đường gân tinh thể nối 4 đỉnh
    g.lineStyle(1, strokeColor, strokeAlpha * 0.35);
    g.lineBetween(cx, cy - r, cx, cy + r);
    g.lineBetween(cx - r, cy, cx + r, cy);

    // Hạt sao tại 4 đỉnh
    g.fillStyle(strokeColor, strokeAlpha * 0.9);
    g.fillCircle(cx, cy - r, 2);
    g.fillCircle(cx + r, cy, 2);
    g.fillCircle(cx, cy + r, 2);
    g.fillCircle(cx - r, cy, 2);
  }

  /**
   * Mảnh đang kéo: Bay bám sát tuyệt đối theo ngón tay người chơi
   * KHÔNG tự động nhảy giật khi đang kéo (chỉ snap khi thả tay)
   */
  private drawDraggingPiece(dragInfo: DragInfo, radiusPx: number): void {
    const isHoveringSnap = dragInfo.snapCandidateId !== null;

    this.drawVectorDiamond(
      this.piecesGraphics,
      dragInfo.x,
      dragInfo.y,
      radiusPx,
      isHoveringSnap ? 0xffe899 : 0xf9c74f,
      isHoveringSnap ? 0.96 : 0.9,
      isHoveringSnap ? 0xfff3b0 : 0xffe082,
      1.0,
      isHoveringSnap ? 2.6 : 2.0
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

    this.drawVectorDiamond(
      this.piecesGraphics,
      cx,
      cy,
      radiusPx,
      0x080f24,
      0.3,
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

    // Đỉnh cắm chuẩn xác vào các giao điểm của lưới ô vuông nền!
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

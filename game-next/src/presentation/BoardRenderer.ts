import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import { rotateCells } from '../domain/geometry.ts';
import type { LayoutMetrics } from './layout.ts';
import { gridToCanvas, pieceHitbox } from './layout.ts';
import type { PlayViewSnapshot } from '../application/playController.ts';

export class BoardRenderer {
  private scene: Phaser.Scene;
  private layout: LayoutMetrics;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private maskGraphics: Phaser.GameObjects.Graphics;
  private piecesGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics) {
    this.scene = scene;
    this.layout = layout;

    this.bgGraphics = this.scene.add.graphics();
    this.targetGraphics = this.scene.add.graphics();
    this.maskGraphics = this.scene.add.graphics();
    this.piecesGraphics = this.scene.add.graphics();

    this.drawStaticBoard();
  }

  private drawStaticBoard(): void {
    const { boardBounds, trayBounds } = this.layout;

    this.bgGraphics.clear();

    // 1. Nền bàn cờ
    this.bgGraphics.fillStyle(0x101b32, 1);
    this.bgGraphics.fillRect(boardBounds.x, boardBounds.y, boardBounds.width, boardBounds.height);
    this.bgGraphics.lineStyle(2, 0x68b8dc, 0.4);
    this.bgGraphics.strokeRect(boardBounds.x, boardBounds.y, boardBounds.width, boardBounds.height);

    // 2. Lưới toạ độ Chiêm tinh (mỗi 8 ô = 32px)
    this.bgGraphics.lineStyle(1, 0xd4a359, 0.12);
    for (let x = 0; x <= GRID_WIDTH; x += 8) {
      const cx = boardBounds.x + x * this.layout.cellPixel;
      this.bgGraphics.lineBetween(cx, boardBounds.y, cx, boardBounds.y + boardBounds.height);
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 8) {
      const cy = boardBounds.y + y * this.layout.cellPixel;
      this.bgGraphics.lineBetween(boardBounds.x, cy, boardBounds.x + boardBounds.width, cy);
    }

    // 3. Chấm toạ độ giao điểm
    this.bgGraphics.fillStyle(0xd4a359, 0.25);
    for (let x = 0; x <= GRID_WIDTH; x += 16) {
      for (let y = 0; y <= GRID_HEIGHT; y += 16) {
        const cx = boardBounds.x + x * this.layout.cellPixel;
        const cy = boardBounds.y + y * this.layout.cellPixel;
        this.bgGraphics.fillCircle(cx, cy, 1.5);
      }
    }

    // 4. Khay chứa mảnh (Tray background)
    this.bgGraphics.fillStyle(0x0c1527, 0.9);
    this.bgGraphics.fillRoundedRect(trayBounds.x, trayBounds.y, trayBounds.width, trayBounds.height, 12);
    this.bgGraphics.lineStyle(1.5, 0x68b8dc, 0.3);
    this.bgGraphics.strokeRoundedRect(trayBounds.x, trayBounds.y, trayBounds.width, trayBounds.height, 12);
  }

  render(level: Level, snapshot: PlayViewSnapshot, piecesState: Record<string, PieceState>): void {
    const { boardBounds, cellPixel } = this.layout;

    // 1. Vẽ bóng mục tiêu mờ nếu showTarget là true
    this.targetGraphics.clear();
    if (snapshot.showTarget) {
      this.targetGraphics.fillStyle(0x68b8dc, 0.18);
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (level.targetMask[y * GRID_WIDTH + x] === 1) {
            this.targetGraphics.fillRect(
              boardBounds.x + x * cellPixel,
              boardBounds.y + y * cellPixel,
              cellPixel,
              cellPixel
            );
          }
        }
      }
    }

    // 2. Vẽ mask kết quả (ưu tiên preview nếu đang kéo)
    this.maskGraphics.clear();
    const activeMask = snapshot.dragPreviewMask ?? snapshot.committedMask;
    this.maskGraphics.fillStyle(0xffc857, 1);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (activeMask[y * GRID_WIDTH + x] === 1) {
          this.maskGraphics.fillRect(
            boardBounds.x + x * cellPixel,
            boardBounds.y + y * cellPixel,
            cellPixel,
            cellPixel
          );
        }
      }
    }

    // 3. Vẽ trạng thái các mảnh trong khay hoặc vị trí tạm
    this.piecesGraphics.clear();
    for (let i = 0; i < level.pieces.length; i++) {
      const piece = level.pieces[i];
      const pState = piecesState[piece.id] ?? { kind: 'tray', turns: 0 };
      const isSelected = snapshot.selectedPieceId === piece.id;

      if (pState.kind === 'tray') {
        this.drawTrayPiece(piece, pState, i, isSelected);
      } else if (pState.kind === 'temporary') {
        this.drawTemporaryPiece(piece, pState, isSelected);
      }
    }

    // 4. Highlight neo hút (snap candidate)
    if (snapshot.snapCandidateId) {
      for (const piece of level.pieces) {
        const anchor = piece.anchors.find((a) => a.id === snapshot.snapCandidateId);
        if (anchor) {
          const pos = gridToCanvas(anchor.x, anchor.y, this.layout);
          this.piecesGraphics.lineStyle(2, 0xffc857, 0.8);
          this.piecesGraphics.strokeCircle(pos.x, pos.y, 16);
          this.piecesGraphics.fillStyle(0xffc857, 0.2);
          this.piecesGraphics.fillCircle(pos.x, pos.y, 8);
        }
      }
    }
  }

  private drawTrayPiece(
    piece: Piece,
    pState: PieceState,
    trayIndex: number,
    isSelected: boolean
  ): void {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex);
    const rotated = rotateCells(piece.cells, piece.frameSize, pState.turns);

    this.piecesGraphics.fillStyle(0xffc857, isSelected ? 0.9 : 0.6);
    this.piecesGraphics.lineStyle(isSelected ? 2 : 1, 0xffffff, isSelected ? 0.9 : 0.4);

    const minX = Math.min(...rotated.map(([x]) => x));
    const maxX = Math.max(...rotated.map(([x]) => x));
    const minY = Math.min(...rotated.map(([, y]) => y));
    const maxY = Math.max(...rotated.map(([, y]) => y));
    const shapeW = (maxX - minX + 1) * this.layout.cellPixel;
    const shapeH = (maxY - minY + 1) * this.layout.cellPixel;

    const startX = hitbox.x + (hitbox.width - shapeW) / 2 - minX * this.layout.cellPixel;
    const startY = hitbox.y + (hitbox.height - shapeH) / 2 - minY * this.layout.cellPixel;

    for (const [cx, cy] of rotated) {
      this.piecesGraphics.fillRect(
        startX + cx * this.layout.cellPixel,
        startY + cy * this.layout.cellPixel,
        this.layout.cellPixel,
        this.layout.cellPixel
      );
    }
  }

  private drawTemporaryPiece(piece: Piece, pState: Extract<PieceState, { kind: 'temporary' }>, isSelected: boolean): void {
    const pos = gridToCanvas(pState.x, pState.y, this.layout);
    const rotated = rotateCells(piece.cells, piece.frameSize, pState.turns);

    this.piecesGraphics.fillStyle(0xffc857, 0.35);
    this.piecesGraphics.lineStyle(1.5, 0xffc857, isSelected ? 0.9 : 0.5);

    for (const [cx, cy] of rotated) {
      this.piecesGraphics.fillRect(
        pos.x + cx * this.layout.cellPixel,
        pos.y + cy * this.layout.cellPixel,
        this.layout.cellPixel,
        this.layout.cellPixel
      );
    }
  }

  destroy(): void {
    this.bgGraphics.destroy();
    this.targetGraphics.destroy();
    this.maskGraphics.destroy();
    this.piecesGraphics.destroy();
  }
}

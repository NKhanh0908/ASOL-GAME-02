import Phaser from 'phaser';
import { Session } from '../domain/session';
import { GRID_HEIGHT, GRID_WIDTH, type PieceDefinition } from '../domain/types';
import { drawMask, drawPiece, overlappingCells, pieceSize } from './draw';
import { drawBackdrop } from './backdrop';
import { LAYOUT, toGrid, trayHome } from './layout';
import { THEME } from './theme';
import { containsCell } from '../domain/shapes';

type Drag = {
  id: string;
  view: Phaser.GameObjects.Graphics;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  oldX: number;
  oldY: number;
};

export class GameScene extends Phaser.Scene {
  private session = new Session();
  private views = new Map<string, Phaser.GameObjects.Graphics>();
  private homes = new Map<string, { x: number; y: number }>();
  private freePositions = new Map<string, { x: number; y: number }>();
  private pieceDepth = new Map<string, number>();
  private nextPieceDepth = 5;
  private dragging: Drag | undefined;
  private ghost!: Phaser.GameObjects.Graphics;
  private composite!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private resetButton!: Phaser.GameObjects.Container;
  private nextButton!: Phaser.GameObjects.Container;

  constructor() { super('Mirror'); }

  create(): void {
    this.views.clear();
    this.homes.clear();
    this.freePositions.clear();
    this.pieceDepth.clear();
    this.nextPieceDepth = 5;
    this.dragging = undefined;
    drawBackdrop(this);
    this.add.text(28, 24, 'MIRROR', { fontFamily: 'Arial', fontSize: '34px', fontStyle: 'bold', color: THEME.text, letterSpacing: 3 });
    this.add.text(30, 78, `${this.session.level.id}  ·  ${this.session.level.title}`, { fontFamily: 'Arial', fontSize: '21px', color: THEME.muted });
    this.add.text(30, 112, 'Ghép các mảnh vàng vào bóng hình', { fontFamily: 'Arial', fontSize: '16px', color: THEME.muted });
    this.ghost = this.add.graphics().setDepth(1).setPosition(LAYOUT.boardX, LAYOUT.boardY);
    this.composite = this.add.graphics().setDepth(2).setPosition(LAYOUT.boardX, LAYOUT.boardY);
    drawMask(this.ghost, this.session.target, LAYOUT.cell, 0, 0, true);
    this.drawThumbnail();
    this.add.text(30, 942, 'MẢNH KÍNH', { fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: THEME.muted, letterSpacing: 2 });
    this.createPieces();
    this.add.text(360, 1180, 'Kéo xuống đây để gỡ mảnh', { fontFamily: 'Arial', fontSize: '18px', color: THEME.muted }).setOrigin(0.5);
    this.resetButton = this.button(118, 1230, 184, 'Đặt lại', () => { this.cancelDrag(); this.session.reset(); this.freePositions.clear(); this.refresh(); });
    this.status = this.add.text(360, 950, '', { fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: THEME.text }).setOrigin(0.5, 1).setDepth(8);
    this.nextButton = this.button(574, 1230, 248, this.session.isFinalLevel ? 'Chơi lại' : 'Màn tiếp', () => { if (this.session.next()) this.scene.restart(); });
    this.nextButton.setVisible(false);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('gameout', this.cancelDrag, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.cancelDrag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.onMove, this);
      this.input.off('pointerup', this.onUp, this);
      this.input.off('gameout', this.cancelDrag, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.cancelDrag, this);
    });
    this.refresh();
  }

  private drawThumbnail(): void {
    const sample = this.add.container(480, 24).setDepth(10);
    sample.add(this.add.rectangle(0, 0, 216, 124, THEME.board, 0.8).setOrigin(0).setStrokeStyle(1, THEME.blue, 0.36));
    sample.add(this.add.text(108, 8, 'MẪU', { fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: THEME.muted, letterSpacing: 2 }).setOrigin(0.5, 0));
    const mask = this.session.target;
    let minX = GRID_WIDTH, minY = GRID_HEIGHT, maxX = 0, maxY = 0;
    for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) if (mask[y * GRID_WIDTH + x]) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const scale = Math.min(184 / (maxX - minX + 1), 56 / (maxY - minY + 1));
    const preview = this.add.graphics();
    drawMask(preview, mask, scale, 108 - (minX + maxX + 1) * scale / 2, 70 - minY * scale);
    sample.add(preview);
  }

  private createPieces(): void {
    const count = this.session.level.pieces.length;
    this.session.level.pieces.forEach((piece, index) => {
      const { width, height } = pieceSize(piece);
      const { x, y } = trayHome(index, count, width, height);
      const depth = this.nextPieceDepth++;
      const view = this.add.graphics({ x, y }).setDepth(depth);
      this.pieceDepth.set(piece.id, depth);
      this.homes.set(piece.id, { x, y });
      drawPiece(view, piece, LAYOUT.cell, 'loose');
      view.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width * LAYOUT.cell, height * LAYOUT.cell),
        (_area: unknown, localX: number, localY: number) => containsCell(piece.cells, localX / LAYOUT.cell, localY / LAYOUT.cell),
      );
      view.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.startDrag(pointer, piece, view));
      this.views.set(piece.id, view);
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer, piece: PieceDefinition, view: Phaser.GameObjects.Graphics): void {
    if (this.session.won || this.dragging) return;
    this.dragging = { id: piece.id, view, pointerId: pointer.id, offsetX: pointer.x - view.x, offsetY: pointer.y - view.y, oldX: view.x, oldY: view.y };
    const depth = this.nextPieceDepth++;
    this.pieceDepth.set(piece.id, depth);
    view.setDepth(depth);
    this.resetButton.setDepth(depth + 1);
    this.nextButton.setDepth(depth + 1);
    this.status.setDepth(depth + 1);
    this.redrawDraggingPiece(piece.id);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const drag = this.dragging;
    if (drag && pointer.id === drag.pointerId) {
      drag.view.setPosition(pointer.x - drag.offsetX, pointer.y - drag.offsetY);
      this.redrawDraggingPiece(drag.id);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    const drag = this.dragging;
    if (!drag || pointer.id !== drag.pointerId) return;
    if (pointer.wasCanceled) {
      this.cancelDrag();
      return;
    }
    drag.view.setPosition(pointer.x - drag.offsetX, pointer.y - drag.offsetY);
    this.dragging = undefined;
    const before = this.session.result;
    if (pointer.x >= 16 && pointer.x <= 704 && pointer.y >= LAYOUT.trayTop && pointer.y <= LAYOUT.trayBottom) {
      this.session.remove(drag.id);
      this.freePositions.delete(drag.id);
      this.refresh();
      this.flashChanged(before, this.session.result);
      return;
    }
    const grid = toGrid(drag.view.x, drag.view.y);
    if (this.session.drop(drag.id, grid.x, grid.y)) {
      this.freePositions.delete(drag.id);
      this.refresh();
      this.flashChanged(before, this.session.result);
    } else {
      this.session.remove(drag.id);
      this.freePositions.set(drag.id, { x: drag.view.x, y: drag.view.y });
      this.redrawPiece(drag.id);
      this.refresh();
      this.flashChanged(before, this.session.result);
    }
  }

  private cancelDrag(): void {
    const drag = this.dragging;
    if (!drag) return;
    drag.view.setPosition(drag.oldX, drag.oldY).setDepth(this.pieceDepth.get(drag.id)!);
    this.dragging = undefined;
    this.redrawPiece(drag.id);
  }

  private redrawPiece(id: string): void {
    const piece = this.session.level.pieces.find((item) => item.id === id)!;
    drawPiece(this.views.get(id)!, piece, LAYOUT.cell, this.session.placements.some((item) => item.pieceId === id) ? 'placed' : 'loose');
  }

  private redrawDraggingPiece(id: string): void {
    const piece = this.session.level.pieces.find((item) => item.id === id)!;
    const view = this.views.get(id)!;
    const originX = Math.round((view.x - LAYOUT.boardX) / LAYOUT.cell);
    const originY = Math.round((view.y - LAYOUT.boardY) / LAYOUT.cell);
    const transparent = new Set<string>();
    for (const other of this.session.level.pieces) {
      if (other.id === id) continue;
      const otherView = this.views.get(other.id)!;
      const otherX = Math.round((otherView.x - LAYOUT.boardX) / LAYOUT.cell);
      const otherY = Math.round((otherView.y - LAYOUT.boardY) / LAYOUT.cell);
      for (const cell of overlappingCells(piece.cells, originX, originY, other.cells, otherX, otherY)) transparent.add(cell);
    }
    drawPiece(view, piece, LAYOUT.cell, 'dragging', transparent);
  }

  private refresh(): void {
    drawMask(this.composite, this.session.result, LAYOUT.cell);
    for (const piece of this.session.level.pieces) {
      const placed = this.session.placements.find((item) => item.pieceId === piece.id);
      const home = this.homes.get(piece.id)!;
      const free = this.freePositions.get(piece.id);
      const x = placed ? LAYOUT.boardX + placed.x * LAYOUT.cell : free?.x ?? home.x;
      const y = placed ? LAYOUT.boardY + placed.y * LAYOUT.cell : free?.y ?? home.y;
      this.views.get(piece.id)!.setPosition(x, y).setDepth(this.pieceDepth.get(piece.id)!);
      this.redrawPiece(piece.id);
    }
    this.status.setText(this.session.won ? (this.session.isFinalLevel ? 'Hoàn thành bản thử!' : 'Khớp hình!') : '');
    this.nextButton.setVisible(this.session.won);
  }

  private flashChanged(before: Uint8Array, after: Uint8Array): void {
    const effect = this.add.graphics({ x: LAYOUT.boardX, y: LAYOUT.boardY }).setDepth(4);
    effect.fillStyle(0xffffff, 0.45);
    for (let y = 0; y < GRID_HEIGHT; y += 1) { let x = 0; while (x < GRID_WIDTH) {
      if (before[y * GRID_WIDTH + x] === after[y * GRID_WIDTH + x]) { x += 1; continue; }
      const start = x; while (x < GRID_WIDTH && before[y * GRID_WIDTH + x] !== after[y * GRID_WIDTH + x]) x += 1;
      effect.fillRect(start * LAYOUT.cell, y * LAYOUT.cell, (x - start) * LAYOUT.cell, LAYOUT.cell);
    }}
    this.tweens.add({ targets: effect, alpha: 0, duration: 400, onComplete: () => effect.destroy() });
  }

  private button(x: number, y: number, width: number, text: string, action: () => void): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, width, 64, THEME.blue, 0.2).setStrokeStyle(2, THEME.blue, 0.76).setInteractive({ useHandCursor: true });
    background.on('pointerdown', action);
    return this.add.container(x, y, [background, this.add.text(0, 0, text, { fontFamily: 'Arial', fontSize: '19px', fontStyle: 'bold', color: THEME.text }).setOrigin(0.5)]).setDepth(10);
  }
}

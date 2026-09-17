import Phaser from 'phaser';
import { Session } from '../domain/session';
import { GRID_HEIGHT, GRID_WIDTH, type PieceDefinition } from '../domain/types';
import { drawMask, drawPiece, pieceSize } from './draw';

const BOARD_X = 104;
const BOARD_Y = 120;
const CELL = 4;
const TRAY_DROP_TOP = 960;

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
  private dragging: Drag | undefined;
  private ghostVisible = true;
  private ghost!: Phaser.GameObjects.Graphics;
  private composite!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Container;

  constructor() { super('Mirror'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1322');
    this.views.clear();
    this.homes.clear();
    this.freePositions.clear();
    this.dragging = undefined;
    this.ghostVisible = true;

    this.add.text(28, 24, 'MIRROR', { fontFamily: 'Arial', fontSize: '32px', fontStyle: 'bold', color: '#f4f8ff' });
    this.add.text(30, 70, `${this.session.level.id}  ·  ${this.session.level.title}`, { fontFamily: 'Arial', fontSize: '23px', color: '#aabdd3' });
    this.add.rectangle(99, 115, 522, 778, 0x213148).setOrigin(0);
    this.add.rectangle(BOARD_X, BOARD_Y, 512, 768, 0x101e32).setOrigin(0);
    this.drawGuides();
    this.ghost = this.add.graphics().setDepth(1).setPosition(BOARD_X, BOARD_Y);
    this.composite = this.add.graphics().setDepth(2).setPosition(BOARD_X, BOARD_Y);
    drawMask(this.ghost, this.session.target, CELL, 0, 0, true);
    this.ghost.setVisible(this.ghostVisible);
    this.drawThumbnail();

    this.add.text(30, 906, 'MẢNH KÍNH', { fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#aabdd3' });
    this.add.rectangle(360, 1045, 690, 220, 0x14243b).setStrokeStyle(2, 0x2b405e);
    this.createPieces();

    this.button(113, 1216, 170, 'Đặt lại', () => {
      this.cancelDrag();
      this.session.reset();
      this.freePositions.clear();
      this.refresh();
    });
    this.add.text(375, 1218, 'Kéo xuống đây để gỡ mảnh', { fontFamily: 'Arial', fontSize: '18px', color: '#aabdd3' }).setOrigin(0.5);
    this.status = this.add.text(360, 894, '', { fontFamily: 'Arial', fontSize: '25px', fontStyle: 'bold', color: '#e9f9e9' }).setOrigin(0.5, 0).setDepth(8);
    this.nextButton = this.button(574, 1216, 247, this.session.isFinalLevel ? 'Chơi lại' : 'Màn tiếp', () => {
      if (this.session.next()) this.scene.restart();
    });
    this.nextButton.setVisible(false);

    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('gameout', this.cancelDrag, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.cancelDrag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.cancelDrag, this);
    });
    this.refresh();
  }

  private drawGuides(): void {
    const guides = this.add.graphics();
    guides.lineStyle(1, 0x3e5673, 0.26);
    for (let x = 0; x <= 512; x += 64) guides.lineBetween(BOARD_X + x, BOARD_Y, BOARD_X + x, BOARD_Y + 768);
    for (let y = 0; y <= 768; y += 64) guides.lineBetween(BOARD_X, BOARD_Y + y, BOARD_X + 512, BOARD_Y + y);
  }

  private drawThumbnail(): void {
    const sample = this.add.container(500, 10).setDepth(10);
    sample.add(this.add.rectangle(0, 0, 200, 100, 0x1d3048).setOrigin(0).setStrokeStyle(2, 0x526b88));
    sample.add(this.add.text(100, 5, 'MẪU', { fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#d1e2f5' }).setOrigin(0.5, 0));
    const mask = this.session.target;
    let minX = GRID_WIDTH, minY = GRID_HEIGHT, maxX = 0, maxY = 0;
    for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (mask[y * GRID_WIDTH + x]) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    const scale = Math.min(180 / (maxX - minX + 1), 65 / (maxY - minY + 1));
    const preview = this.add.graphics();
    drawMask(preview, mask, scale, 100 - (minX + maxX + 1) * scale / 2, 26 - minY * scale);
    sample.add(preview);
  }

  private createPieces(): void {
    const count = this.session.level.pieces.length;
    const start = (720 - count * 230) / 2;
    this.session.level.pieces.forEach((piece, index) => {
      const { width, height } = pieceSize(piece);
      const x = start + index * 230 + (230 - width * CELL) / 2;
      const y = 1052 - height * CELL / 2;
      const view = this.add.graphics({ x, y }).setDepth(5);
      this.homes.set(piece.id, { x, y });
      drawPiece(view, piece, CELL, true);
      view.setInteractive(new Phaser.Geom.Rectangle(0, 0, width * CELL, height * CELL), Phaser.Geom.Rectangle.Contains);
      view.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.startDrag(pointer, piece, view));
      this.views.set(piece.id, view);
    });
  }

  private startDrag(pointer: Phaser.Input.Pointer, piece: PieceDefinition, view: Phaser.GameObjects.Graphics): void {
    if (this.session.won || this.dragging) return;
    this.dragging = { id: piece.id, view, pointerId: pointer.id, offsetX: pointer.x - view.x, offsetY: pointer.y - view.y, oldX: view.x, oldY: view.y };
    view.setDepth(20);
    drawPiece(view, piece, CELL, true);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const drag = this.dragging;
    if (drag && pointer.id === drag.pointerId) drag.view.setPosition(pointer.x - drag.offsetX, pointer.y - drag.offsetY);
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
    if (pointer.y >= TRAY_DROP_TOP) {
      this.session.remove(drag.id);
      this.freePositions.delete(drag.id);
      drag.view.setDepth(5);
      this.refresh();
      this.flashChanged(before, this.session.result);
      return;
    }
    if (this.session.drop(drag.id, (drag.view.x - BOARD_X) / CELL, (drag.view.y - BOARD_Y) / CELL)) {
      this.freePositions.delete(drag.id);
      this.refresh();
      this.flashChanged(before, this.session.result);
    } else {
      this.session.remove(drag.id);
      this.freePositions.set(drag.id, { x: drag.view.x, y: drag.view.y });
      drag.view.setDepth(5);
      this.redrawPiece(drag.id);
      this.refresh();
      this.flashChanged(before, this.session.result);
    }
  }

  private cancelDrag(): void {
    const drag = this.dragging;
    if (!drag) return;
    drag.view.setPosition(drag.oldX, drag.oldY).setDepth(5);
    this.dragging = undefined;
    this.redrawPiece(drag.id);
  }

  private redrawPiece(id: string): void {
    const piece = this.session.level.pieces.find((item) => item.id === id)!;
    drawPiece(this.views.get(id)!, piece, CELL, !this.session.placements.some((item) => item.pieceId === id));
  }

  private refresh(): void {
    drawMask(this.composite, this.session.result, CELL);
    for (const piece of this.session.level.pieces) {
      const placed = this.session.placements.find((item) => item.pieceId === piece.id);
      const home = this.homes.get(piece.id)!;
      const free = this.freePositions.get(piece.id);
      const x = placed ? BOARD_X + placed.x * CELL : free?.x ?? home.x;
      const y = placed ? BOARD_Y + placed.y * CELL : free?.y ?? home.y;
      this.views.get(piece.id)!.setPosition(x, y).setDepth(5);
      this.redrawPiece(piece.id);
    }
    this.status.setText(this.session.won ? (this.session.isFinalLevel ? 'Hoàn thành bản thử!' : 'Khớp hình!') : '');
    this.nextButton.setVisible(this.session.won);
  }

  private flashChanged(before: Uint8Array, after: Uint8Array): void {
    const effect = this.add.graphics({ x: BOARD_X, y: BOARD_Y }).setDepth(4);
    effect.fillStyle(0xffffff, 0.45);
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      let x = 0;
      while (x < GRID_WIDTH) {
        if (before[y * GRID_WIDTH + x] === after[y * GRID_WIDTH + x]) { x += 1; continue; }
        const start = x;
        while (x < GRID_WIDTH && before[y * GRID_WIDTH + x] !== after[y * GRID_WIDTH + x]) x += 1;
        effect.fillRect(start * CELL, y * CELL, (x - start) * CELL, CELL);
      }
    }
    this.tweens.add({ targets: effect, alpha: 0, duration: 400, onComplete: () => effect.destroy() });
  }

  private button(x: number, y: number, width: number, text: string, action: () => void, capture?: (label: Phaser.GameObjects.Text) => void): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, width, 64, 0x264563).setStrokeStyle(2, 0x5b80a4).setInteractive({ useHandCursor: true });
    background.on('pointerdown', action);
    const label = this.add.text(0, 0, text, { fontFamily: 'Arial', fontSize: '19px', fontStyle: 'bold', color: '#f7fbff' }).setOrigin(0.5);
    capture?.(label);
    return this.add.container(x, y, [background, label]).setDepth(10);
  }
}

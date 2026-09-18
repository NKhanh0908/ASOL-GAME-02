import Phaser from 'phaser';
import { LevelRepository } from '../domain/levelRepository';
import type { CustomLevelRecord, Level } from '../domain/types';
import { drawBackdrop } from './backdrop';
import { formatLevelLabel, groupLevels, isOverrideLevel } from './levelMenu';
import { THEME } from './theme';

export class LevelMenuScene extends Phaser.Scene {
  private confirmAction: (() => void) | undefined;
  private container!: Phaser.GameObjects.Container;

  constructor() { super('LevelMenu'); }

  create(): void {
    drawBackdrop(this);
    this.confirmAction = undefined;
    this.renderMenu();
  }

  private renderMenu(): void {
    this.container?.destroy();
    this.container = this.add.container(0, 0);
    this.container.add(this.add.text(360, 42, 'MIRROR', { fontFamily: 'Arial', fontSize: '40px', fontStyle: 'bold', color: THEME.text, letterSpacing: 4 }).setOrigin(0.5, 0));
    this.container.add(this.add.text(360, 100, 'Chọn, sửa hoặc tạo màn chơi', { fontFamily: 'Arial', fontSize: '18px', color: THEME.muted }).setOrigin(0.5, 0));
    this.container.add(this.createButton(360, 170, 480, 64, '+ TẠO LEVEL MỚI', THEME.gold, 0x1a1500, () => this.scene.start('CustomLevel', {})));

    const { builtIn, custom } = groupLevels(LevelRepository.list());
    this.container.add(this.add.text(48, 236, 'MÀN CHƠI CÓ SẴN', { fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: THEME.blueText, letterSpacing: 2 }));
    builtIn.forEach((level, index) => this.container.add(this.createBuiltInCard(level, 200 + (index % 2) * 320, 300 + Math.floor(index / 2) * 84)));

    const customY = 580;
    this.container.add(this.add.text(48, customY, 'LEVEL MỚI', { fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: THEME.goldText, letterSpacing: 2 }));
    if (!custom.length) {
      this.container.add(this.add.text(360, customY + 60, 'Chưa có level mới.', { fontFamily: 'Arial', fontSize: '18px', color: THEME.muted }).setOrigin(0.5, 0));
    } else {
      custom.slice(0, 5).forEach((level, index) => this.container.add(this.createNewLevelCard(level, 360, customY + 100 + index * 92)));
    }
    if (this.confirmAction) this.renderConfirmModal();
  }

  private createBuiltInCard(level: Level, x: number, y: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    card.add(this.add.rectangle(0, 0, 300, 64, THEME.board, 0.9).setStrokeStyle(1, THEME.blue, 0.4));
    card.add(this.add.text(-136, -20, formatLevelLabel(level), { fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: THEME.text }));
    card.add(this.createButton(-92, 18, 72, 30, 'Chơi', THEME.blue, THEME.board, () => this.scene.start('Mirror', { levelId: level.id }), 12));
    card.add(this.createButton(0, 18, 72, 30, 'Sửa', THEME.gold, THEME.board, () => this.scene.start('CustomLevel', { editId: level.id }), 12));
    if (isOverrideLevel(level)) card.add(this.createButton(92, 18, 72, 30, 'Gốc', THEME.danger, THEME.board, () => this.confirm(() => { LevelRepository.restoreBuiltIn(level.id); }), 12));
    return card;
  }

  private createNewLevelCard(level: CustomLevelRecord, x: number, y: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    card.add(this.add.rectangle(0, 0, 640, 80, THEME.board, 0.9).setStrokeStyle(1, THEME.blue, 0.4));
    card.add(this.add.text(-300, -18, level.title, { fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: THEME.text }));
    card.add(this.add.text(-300, 8, `${level.pieces.length} mảnh · level mới`, { fontFamily: 'Arial', fontSize: '14px', color: THEME.muted }));
    card.add(this.createButton(130, 0, 90, 52, 'Chơi', THEME.blue, THEME.board, () => this.scene.start('Mirror', { levelId: level.id }), 15));
    card.add(this.createButton(215, 0, 64, 52, 'Sửa', THEME.gold, THEME.board, () => this.scene.start('CustomLevel', { editId: level.id }), 15));
    card.add(this.createButton(285, 0, 64, 52, 'Xóa', THEME.danger, THEME.board, () => this.confirm(() => { LevelRepository.removeNew(level.id); }), 15));
    return card;
  }

  private confirm(action: () => void): void {
    this.confirmAction = action;
    this.renderMenu();
  }

  private renderConfirmModal(): void {
    const modal = this.add.container(360, 640).setDepth(30);
    modal.add(this.add.rectangle(0, 0, 720, 1280, 0x000000, 0.75).setInteractive());
    modal.add(this.add.rectangle(0, 0, 580, 270, THEME.board, 0.98).setStrokeStyle(2, THEME.danger, 0.9));
    modal.add(this.add.text(0, -72, 'XÁC NHẬN THAY ĐỔI', { fontFamily: 'Arial', fontSize: '23px', fontStyle: 'bold', color: THEME.dangerText }).setOrigin(0.5));
    modal.add(this.add.text(0, -20, 'Thao tác này sẽ thay đổi dữ liệu level.', { fontFamily: 'Arial', fontSize: '17px', color: THEME.text }).setOrigin(0.5));
    modal.add(this.createButton(-125, 65, 190, 54, 'Xác nhận', THEME.danger, 0x220505, () => {
      const action = this.confirmAction;
      this.confirmAction = undefined;
      modal.destroy();
      action?.();
      this.renderMenu();
    }, 15));
    modal.add(this.createButton(125, 65, 190, 54, 'Hủy', THEME.blue, THEME.board, () => { this.confirmAction = undefined; modal.destroy(); this.renderMenu(); }, 15));
  }

  private createButton(x: number, y: number, width: number, height: number, text: string, stroke: number, fill: number, action: () => void, fontSize = 18): Phaser.GameObjects.Container {
    const background = this.add.rectangle(0, 0, width, height, fill, 0.85).setStrokeStyle(2, stroke, 0.8).setInteractive({ useHandCursor: true });
    background.on('pointerdown', () => background.setAlpha(0.6));
    background.on('pointerout', () => background.setAlpha(0.85));
    background.on('pointerup', () => { background.setAlpha(0.85); this.time.delayedCall(0, action); });
    return this.add.container(x, y, [background, this.add.text(0, 0, text, { fontFamily: 'Arial', fontSize: `${fontSize}px`, fontStyle: 'bold', color: stroke === THEME.gold ? '#ffe28a' : THEME.text }).setOrigin(0.5)]);
  }
}

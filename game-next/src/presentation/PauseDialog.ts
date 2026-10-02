import Phaser from 'phaser';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';

export type PauseCallbacks = {
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
};

export class PauseDialog {
  private scene: Phaser.Scene;
  private callbacks: PauseCallbacks;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, callbacks: PauseCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public open(): void {
    if (this.container) return;

    this.container = this.scene.add.container(360, 640).setDepth(150);

    // 1. Lớp phủ đen mờ 65%
    const backdrop = this.scene.add
      .rectangle(0, 0, 720, 1280, COLOR_NUMBERS.navyBackdrop, 0.65)
      .setInteractive();
    backdrop.on('pointerdown', () => this.close());

    // 2. Tấm bia tạm dừng (420 x 360)
    const modalW = 420;
    const modalH = 360;
    const panel = this.scene.add.graphics();
    panel.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.98);
    panel.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 24);
    panel.lineStyle(4, COLOR_NUMBERS.icePrimary, 0.9);
    panel.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 24);

    // Viền vàng mờ bên trong
    panel.lineStyle(1.2, COLOR_NUMBERS.gridModule, 0.4);
    panel.strokeRoundedRect(-modalW / 2 + 6, -modalH / 2 + 6, modalW - 12, modalH - 12, 18);

    // 3. Tiêu đề
    const title = this.scene.add
      .text(0, -modalH / 2 + 45, 'Tạm Dừng', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '26px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    // 4. Ba nút điều hướng theo thứ tự ưu tiên thị giác
    // A. Nút 1: Tiếp tục chơi (Khối vàng đặc nổi bật nhất)
    const btn1Bg = this.scene.add.graphics();
    btn1Bg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    btn1Bg.fillRoundedRect(-150, -40, 300, 56, 18);

    const btn1Text = this.scene.add
      .text(0, -12, 'Tiếp tục chơi', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '17px',
        color: COLOR_TOKENS.sky.stops[0],
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn1Text.on('pointerdown', () => {
      this.close();
      this.callbacks.onResume();
    });

    // B. Nút 2: Chơi lại màn này (Nút viền kính xanh)
    const btn2Bg = this.scene.add.graphics();
    btn2Bg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.8);
    btn2Bg.fillRoundedRect(-150, 40, 300, 50, 16);
    btn2Bg.lineStyle(1.8, COLOR_NUMBERS.icePrimary, 0.85);
    btn2Bg.strokeRoundedRect(-150, 40, 300, 50, 16);

    const btn2Text = this.scene.add
      .text(0, 65, 'Chơi lại màn này', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '15px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn2Text.on('pointerdown', () => {
      this.close();
      this.callbacks.onRestart();
    });

    // C. Nút 3: Về chọn màn (Nút văn bản tinh giản)
    const btn3Text = this.scene.add
      .text(0, 128, 'Về danh sách màn chơi', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn3Text.on('pointerdown', () => {
      this.close();
      this.callbacks.onLevelSelect();
    });

    this.container.add([backdrop, panel, title, btn1Bg, btn1Text, btn2Bg, btn2Text, btn3Text]);
  }

  public close(): void {
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
  }

  public isOpen(): boolean {
    return this.container !== undefined;
  }
}

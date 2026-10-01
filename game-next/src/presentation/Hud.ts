import Phaser from 'phaser';
import type { PlayViewSnapshot } from '../application/playController.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';

export type HudCallbacks = {
  onMenu: () => void;
  onReset: () => void;
  onRotate: () => void;
  onToggleTarget: () => void;
  onNextLevel: () => void;
};

export class Hud {
  private scene: Phaser.Scene;
  private callbacks: HudCallbacks;
  private levelId: string;

  private titleText: Phaser.GameObjects.Text;
  private targetButton: Phaser.GameObjects.Container;
  private targetBtnText: Phaser.GameObjects.Text;

  private resetContainer: Phaser.GameObjects.Container;
  private rotateContainer: Phaser.GameObjects.Container;
  private rotateBtnBase: Phaser.GameObjects.Image;
  private rotateIcon: Phaser.GameObjects.Image;
  private rotateLabel: Phaser.GameObjects.Text;

  private winContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, title: string, callbacks: HudCallbacks, levelId: string = '1-1') {
    this.scene = scene;
    this.callbacks = callbacks;
    this.levelId = levelId;

    // 1. Nút Menu tròn 56px (Góc trên trái: x=56, y=48)
    const menuBtn = this.scene.add
      .image(56, 48, TEXTURE_KEYS.btnCircle56)
      .setInteractive({ useHandCursor: true });
    const menuIcon = this.scene.add.image(56, 48, TEXTURE_KEYS.iconMenuBack);
    menuBtn.on('pointerdown', () => {
      this.animateButtonTap(menuBtn, () => this.callbacks.onMenu());
    });

    // 2. Tiêu đề màn chơi (Giữa header: x=360, y=48)
    this.titleText = this.scene.add
      .text(360, 48, title, {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '22px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    // 3. Nút Toggle bóng mục tiêu (Góc trên phải: x=630, y=48)
    this.targetButton = this.scene.add.container(630, 48);
    const targetBg = this.scene.add.graphics();
    targetBg.fillStyle(COLOR_NUMBERS.navyStele, 0.95);
    targetBg.fillRoundedRect(-60, -20, 120, 40, 20);
    targetBg.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.7);
    targetBg.strokeRoundedRect(-60, -20, 120, 40, 20);

    this.targetBtnText = this.scene.add
      .text(0, 0, 'Bóng mẫu: Bật', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '12px',
        color: COLOR_TOKENS.iceGlass.bevelHighlight,
      })
      .setOrigin(0.5);

    this.targetButton.add([targetBg, this.targetBtnText]);
    this.targetButton.setSize(120, 40);
    this.targetButton.setInteractive({ useHandCursor: true });
    this.targetButton.on('pointerdown', () => this.callbacks.onToggleTarget());

    // 4. Hàng nút dưới cùng (Bottom bar)
    // A. Nút Đặt lại tròn 64px (x=180, y=1164)
    this.resetContainer = this.scene.add.container(180, 1164);
    const resetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle64)
      .setInteractive({ useHandCursor: true });
    const resetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconReset);
    const resetLabel = this.scene.add
      .text(0, 44, 'Đặt lại', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '13px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    resetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(resetBtnBase, () => this.callbacks.onReset());
    });
    this.resetContainer.add([resetBtnBase, resetIcon, resetLabel]);

    // B. Nút Xoay tròn 64px (x=540, y=1164)
    // Ẩn hoàn toàn nếu ở Chương 1 & 2
    const chapterNum = parseInt(this.levelId.split('-')[0], 10) || 1;
    this.rotateContainer = this.scene.add.container(540, 1164);
    this.rotateBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle64)
      .setInteractive({ useHandCursor: true });
    this.rotateIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconRotate);
    this.rotateLabel = this.scene.add
      .text(0, 44, 'Xoay', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '13px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    this.rotateBtnBase.on('pointerdown', () => {
      this.animateButtonTap(this.rotateBtnBase, () => this.callbacks.onRotate());
    });
    this.rotateContainer.add([this.rotateBtnBase, this.rotateIcon, this.rotateLabel]);

    if (chapterNum < 3) {
      this.rotateContainer.setVisible(false);
    }

    // 5. Modal Hoàn Thành Chiến Thắng (Celestial Victory Dialog)
    this.winContainer = this.scene.add.container(360, 640).setDepth(100).setVisible(false);

    const winOverlay = this.scene.add.rectangle(0, 0, 720, 1280, COLOR_NUMBERS.navyBackdrop, 0.85);
    winOverlay.setInteractive(); // Chặn click xuyên xuống bàn

    const winPanel = this.scene.add.graphics();
    winPanel.fillStyle(COLOR_NUMBERS.navyStele, 0.98);
    winPanel.fillRoundedRect(-240, -190, 480, 380, 28);
    winPanel.lineStyle(6, COLOR_NUMBERS.icePrimary, 0.9);
    winPanel.strokeRoundedRect(-240, -190, 480, 380, 28);

    // Đường viền vàng bên trong
    winPanel.lineStyle(1.5, COLOR_NUMBERS.amberGrid, 0.5);
    winPanel.strokeRoundedRect(-232, -182, 464, 364, 22);

    const winTitle = this.scene.add
      .text(0, -110, '✦ Cổ Ngữ Thức Tỉnh ✦', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '26px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    const winDesc = this.scene.add
      .text(0, -45, 'Ánh sáng tinh tú đã soi chiếu cổ ngữ trọn vẹn!', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '15px',
        color: COLOR_TOKENS.text.primary,
        wordWrap: { width: 400, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5);

    // Khối nút chính vàng đặc (Primary CTA)
    const nextBtnBg = this.scene.add.graphics();
    nextBtnBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    nextBtnBg.fillRoundedRect(-150, 25, 300, 56, 18);

    const nextBtn = this.scene.add
      .text(0, 53, 'Màn tiếp theo →', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '16px',
        color: COLOR_TOKENS.navy.spaceBackground,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.callbacks.onNextLevel());

    const menuReturnBtn = this.scene.add
      .text(0, 125, 'Về màn hình chính', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menuReturnBtn.on('pointerdown', () => this.callbacks.onMenu());

    this.winContainer.add([
      winOverlay,
      winPanel,
      winTitle,
      winDesc,
      nextBtnBg,
      nextBtn,
      menuReturnBtn,
    ]);
  }

  private animateButtonTap(target: Phaser.GameObjects.GameObject, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: target,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 80,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete,
    });
  }

  public update(snapshot: PlayViewSnapshot): void {
    this.targetBtnText.setText(snapshot.showTarget ? 'Bóng mẫu: Bật' : 'Bóng mẫu: Tắt');

    if (snapshot.canRotate) {
      this.rotateContainer.setAlpha(1.0);
      this.rotateBtnBase.setInteractive({ useHandCursor: true });
    } else {
      this.rotateContainer.setAlpha(0.3);
      this.rotateBtnBase.disableInteractive();
    }

    if (snapshot.phase !== 'won') {
      this.winContainer.setVisible(false);
    }
  }

  public showWinModal(): void {
    if (this.winContainer.visible) return;
    this.winContainer.setAlpha(0).setVisible(true);
    this.scene.tweens.add({
      targets: this.winContainer,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.easeOut',
    });
  }

  public hideWinModal(): void {
    this.winContainer.setVisible(false);
  }

  public destroy(): void {
    this.titleText.destroy();
    this.targetButton.destroy();
    this.resetContainer.destroy();
    this.rotateContainer.destroy();
    this.winContainer.destroy();
  }
}

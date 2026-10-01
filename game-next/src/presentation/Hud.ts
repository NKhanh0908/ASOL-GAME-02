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
  private subtitleText: Phaser.GameObjects.Text;
  private targetButton: Phaser.GameObjects.Container;
  private targetIcon: Phaser.GameObjects.Image;

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

    const chapterNum = parseInt(this.levelId.split('-')[0], 10) || 1;
    const chapterRoman = chapterNum === 1 ? 'Chương I' : chapterNum === 2 ? 'Chương II' : 'Chương III';
    const levelName = title.includes('·') ? title.split('·')[1].trim() : title;

    // 1. Nút Menu tròn 80px (Vùng chạm 96px, Góc trên trái: x=56, y=56)
    const menuBtn = this.scene.add
      .image(56, 56, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const menuIcon = this.scene.add.image(56, 56, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    menuBtn.on('pointerdown', () => {
      this.animateButtonTap(menuBtn, () => this.callbacks.onMenu());
    });

    // 2. Tiêu đề màn chơi 36px + Dòng phụ Chương 24px (Giữa header: x=360)
    this.titleText = this.scene.add
      .text(360, 36, levelName, {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '36px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    this.subtitleText = this.scene.add
      .text(360, 72, `${chapterRoman} · Màn ${this.levelId}`, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '24px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    // 3. Nút tròn Icon mắt bóng mục tiêu 80px (Vùng chạm 96px, Góc trên phải: x=664, y=56)
    this.targetButton = this.scene.add.container(664, 56);
    const targetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    this.targetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconEyeOpen);

    targetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(targetBtnBase, () => this.callbacks.onToggleTarget());
    });
    this.targetButton.add([targetBtnBase, this.targetIcon]);

    // 4. Hàng nút dưới cùng (Bottom bar)
    // Nút 112px canvas (56dp), nhãn 24px canvas
    // Ở Chương 1–2 chỉ có 1 nút Đặt lại -> căn giữa x=360
    // Từ Chương 3 có 2 nút -> Đặt lại x=210, Xoay x=510
    const isChapter3Plus = chapterNum >= 3;
    const resetX = isChapter3Plus ? 210 : 360;

    // A. Nút Đặt lại tròn 112px
    this.resetContainer = this.scene.add.container(resetX, 1176);
    const resetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle112)
      .setSize(112, 112)
      .setInteractive({ useHandCursor: true });
    const resetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconReset).setScale(1.4);
    const resetLabel = this.scene.add
      .text(0, 74, 'Đặt lại', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '24px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    resetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(resetBtnBase, () => this.callbacks.onReset());
    });
    this.resetContainer.add([resetBtnBase, resetIcon, resetLabel]);

    // B. Nút Xoay tròn 112px (Chỉ hiện từ Chương 3)
    this.rotateContainer = this.scene.add.container(510, 1176);
    this.rotateBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle112)
      .setSize(112, 112)
      .setInteractive({ useHandCursor: true });
    this.rotateIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconRotate).setScale(1.4);
    this.rotateLabel = this.scene.add
      .text(0, 74, 'Xoay', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '24px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    this.rotateBtnBase.on('pointerdown', () => {
      this.animateButtonTap(this.rotateBtnBase, () => this.callbacks.onRotate());
    });
    this.rotateContainer.add([this.rotateBtnBase, this.rotateIcon, this.rotateLabel]);

    if (!isChapter3Plus) {
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
    this.targetIcon.setTexture(snapshot.showTarget ? TEXTURE_KEYS.iconEyeOpen : TEXTURE_KEYS.iconEyeClosed);

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
    this.subtitleText.destroy();
    this.targetButton.destroy();
    this.resetContainer.destroy();
    this.rotateContainer.destroy();
    this.winContainer.destroy();
  }
}

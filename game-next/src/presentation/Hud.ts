import Phaser from 'phaser';
import type { PlayViewSnapshot } from '../application/playController.ts';

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
  private titleText: Phaser.GameObjects.Text;
  private targetButton: Phaser.GameObjects.Text;
  private rotateButton: Phaser.GameObjects.Text;
  private winContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, title: string, callbacks: HudCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    // 1. Nút Menu (góc trên trái)
    const menuBtn = this.scene.add
      .text(24, 40, '← MENU', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#EEF4FA',
        backgroundColor: '#0c1730',
        padding: { x: 14, y: 10 },
      })
      .setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.callbacks.onMenu());

    // 2. Tiêu đề màn chơi (giữa header)
    this.titleText = this.scene.add
      .text(360, 52, title, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '20px',
        color: '#FFD166',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 3. Nút Toggle bóng mục tiêu (góc trên phải)
    this.targetButton = this.scene.add
      .text(696, 40, 'BÓNG MẪU: BẬT', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#4ECDC4',
        backgroundColor: '#0c1730',
        padding: { x: 12, y: 10 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.targetButton.on('pointerdown', () => this.callbacks.onToggleTarget());

    // 4. Hàng nút dưới cùng (Bottom bar)
    // Nút Đặt lại (Reset)
    const resetBtn = this.scene.add
      .text(104, 1200, '↺ ĐẶT LẠI', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#EEF4FA',
        backgroundColor: '#0c1730',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => this.callbacks.onReset());

    // Nút Xoay ↻ (chỉ sáng khi canRotate = true)
    this.rotateButton = this.scene.add
      .text(616, 1200, 'XOAY ↻', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#4ECDC4',
        backgroundColor: '#0c1730',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.rotateButton.on('pointerdown', () => this.callbacks.onRotate());

    // 5. Modal chúc mừng chiến thắng (Win Container)
    this.winContainer = this.scene.add.container(360, 640).setDepth(100).setVisible(false);

    const winOverlay = this.scene.add.rectangle(0, 0, 720, 1280, 0x050814, 0.85);

    const winPanel = this.scene.add.graphics();
    winPanel.fillStyle(0x0c1730, 0.98);
    winPanel.fillRoundedRect(-240, -180, 480, 360, 20);
    winPanel.lineStyle(2, 0xffd166, 0.8);
    winPanel.strokeRoundedRect(-240, -180, 480, 360, 20);

    const winTitle = this.scene.add
      .text(0, -90, '✦ HOÀN THÀNH ✦', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '28px',
        color: '#FFD166',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const winDesc = this.scene.add
      .text(0, -30, 'Cổ ngữ Song Tinh đã được giải mã trọn vẹn!', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#EEF4FA',
      })
      .setOrigin(0.5);

    const nextBtnBg = this.scene.add.graphics();
    nextBtnBg.fillStyle(0xf9c74f, 1);
    nextBtnBg.fillRoundedRect(-140, 20, 280, 52, 16);

    const nextBtn = this.scene.add
      .text(0, 46, 'MÀN TIẾP THEO →', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        color: '#080E24',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.callbacks.onNextLevel());

    const menuReturnBtn = this.scene.add
      .text(0, 115, 'Về màn hình chính', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#9DAFC7',
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

  update(snapshot: PlayViewSnapshot): void {
    this.targetButton.setText(snapshot.showTarget ? 'BÓNG MẪU: BẬT' : 'BÓNG MẪU: TẮT');

    if (snapshot.canRotate) {
      this.rotateButton.setAlpha(1).setInteractive({ useHandCursor: true });
    } else {
      this.rotateButton.setAlpha(0.3).disableInteractive();
    }

    if (snapshot.phase !== 'won') {
      this.winContainer.setVisible(false);
    }
  }

  showWinModal(): void {
    if (this.winContainer.visible) return;
    this.winContainer.setAlpha(0).setVisible(true);
    this.scene.tweens.add({
      targets: this.winContainer,
      alpha: 1,
      duration: 600,
      ease: 'Cubic.easeOut',
    });
  }

  hideWinModal(): void {
    this.winContainer.setVisible(false);
  }

  destroy(): void {
    this.titleText.destroy();
    this.targetButton.destroy();
    this.rotateButton.destroy();
    this.winContainer.destroy();
  }
}

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

    // 1. Nút Menu (góc trên trái, kích thước >= 48x48 dp)
    const menuBtn = this.scene.add
      .text(24, 40, '≡ MENU', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#EEF4FA',
        backgroundColor: '#101B32',
        padding: { x: 16, y: 12 },
      })
      .setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.callbacks.onMenu());

    // 2. Tiêu đề màn chơi (giữa header)
    this.titleText = this.scene.add
      .text(360, 52, title, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#FFC857',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 3. Nút Toggle bóng mục tiêu (góc trên phải)
    this.targetButton = this.scene.add
      .text(696, 40, 'MẪU: BẬT', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#68B8DC',
        backgroundColor: '#101B32',
        padding: { x: 12, y: 12 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.targetButton.on('pointerdown', () => this.callbacks.onToggleTarget());

    // 4. Hàng nút dưới cùng (Bottom bar)
    // Nút Đặt lại (Reset)
    const resetBtn = this.scene.add
      .text(104, 1200, '↺ ĐẶT LẠI', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#EEF4FA',
        backgroundColor: '#101B32',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => this.callbacks.onReset());

    // Nút Xoay ↻ 90° (chỉ sáng khi canRotate = true)
    this.rotateButton = this.scene.add
      .text(616, 1200, 'XOAY ↻', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#68B8DC',
        backgroundColor: '#101B32',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.rotateButton.on('pointerdown', () => this.callbacks.onRotate());

    // 5. Modal chúc mừng chiến thắng (Win Container)
    this.winContainer = this.scene.add.container(360, 640).setDepth(100).setVisible(false);

    const winOverlay = this.scene.add.rectangle(0, 0, 720, 1280, 0x080e24, 0.85);
    const winPanel = this.scene.add.rectangle(0, 0, 520, 360, 0x101b32, 1);
    winPanel.setStrokeStyle(2, 0xffc857, 0.8);

    const winTitle = this.scene.add
      .text(0, -90, 'HOÀN THÀNH!', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#FFC857',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const winDesc = this.scene.add
      .text(0, -30, 'Cổ ngữ Song Tinh đã được giải mã chính xác', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#EEF4FA',
      })
      .setOrigin(0.5);

    const nextBtn = this.scene.add
      .text(0, 40, 'MÀN TIẾP THEO →', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#080E24',
        backgroundColor: '#FFC857',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.callbacks.onNextLevel());

    const menuReturnBtn = this.scene.add
      .text(0, 110, 'Về chọn màn', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#9DAFC7',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menuReturnBtn.on('pointerdown', () => this.callbacks.onMenu());

    this.winContainer.add([winOverlay, winPanel, winTitle, winDesc, nextBtn, menuReturnBtn]);
  }

  update(snapshot: PlayViewSnapshot): void {
    this.targetButton.setText(snapshot.showTarget ? 'MẪU: BẬT' : 'MẪU: TẮT');

    if (snapshot.canRotate) {
      this.rotateButton.setAlpha(1).setInteractive({ useHandCursor: true });
    } else {
      this.rotateButton.setAlpha(0.3).disableInteractive();
    }

    if (snapshot.phase === 'won') {
      this.winContainer.setVisible(true);
    } else {
      this.winContainer.setVisible(false);
    }
  }

  destroy(): void {
    this.titleText.destroy();
    this.targetButton.destroy();
    this.rotateButton.destroy();
    this.winContainer.destroy();
  }
}

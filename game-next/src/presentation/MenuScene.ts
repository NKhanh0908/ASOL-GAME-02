import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';

type StarParticle = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  speed: number;
  phase: number;
};

export class MenuScene extends Phaser.Scene {
  private progressRepo!: ProgressRepository;
  private starGraphics!: Phaser.GameObjects.Graphics;
  private emblemGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;
  private settingsModalContainer?: Phaser.GameObjects.Container;

  private stars: StarParticle[] = [];
  private emblemAngle = 0;
  private pulseTime = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();

    // 1. Tạo bầu trời sao li ti (Cosmic Starfield)
    this.starGraphics = this.add.graphics();
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Phaser.Math.Between(10, 710),
        y: Phaser.Math.Between(10, 1270),
        r: Phaser.Math.FloatBetween(0.8, 2.4),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.85),
        speed: Phaser.Math.FloatBetween(0.12, 0.4),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

    // 2. Tinh ấn xoay nhẹ (Rotating Astrolabe Emblem)
    this.emblemGraphics = this.add.graphics();

    // 3. UI Container chính
    this.uiContainer = this.add.container(0, 0);
    this.buildMainMenu(progress.completed);
  }

  private buildMainMenu(completedLevels: readonly string[]): void {
    this.uiContainer.removeAll(true);

    const is1_1Completed = completedLevels.includes('1-1');

    // Tiêu đề game lớn phong cách chiêm tinh
    const titleText = this.add
      .text(360, 260, 'M I R R O R', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '44px',
        color: '#FFD166',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#FFE082', 16, true, true);

    const subtitleText = this.add
      .text(360, 312, 'CỔ NGỮ CHIÊM TINH · BÍ ẨN GIAO THOA', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#4ECDC4',
      })
      .setOrigin(0.5);

    // Nút Bắt đầu / Chơi tiếp chính (Primary Hero CTA Button)
    const btnWidth = 360;
    const btnHeight = 76;
    const btnX = 360;
    const btnY = 820;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x0e1b38, 0.95);
    btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);
    btnBg.lineStyle(2, 0xf9c74f, 0.9);
    btnBg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);

    const mainBtnTitle = is1_1Completed ? '✦ CHƠI TIẾP: MÀN 1-1 ✦' : '✦ BẮT ĐẦU: MÀN 1-1 ✦';
    const mainBtnSub = is1_1Completed
      ? 'Đã hoàn thành · Chạm để chơi lại'
      : 'Khởi nguyên · Song Tinh';

    const btnText = this.add
      .text(btnX, btnY - 10, mainBtnTitle, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '18px',
        color: '#FFF3B0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const btnSubText = this.add
      .text(btnX, btnY + 16, mainBtnSub, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#9DAFC7',
      })
      .setOrigin(0.5);

    // Vùng tương tác chạm nút Bắt đầu
    const playZone = this.add
      .zone(btnX, btnY, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    playZone.on('pointerdown', () => {
      this.scene.start('PlayScene', { levelId: '1-1', mode: 'campaign' });
    });

    playZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x162c5b, 1);
      btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);
      btnBg.lineStyle(2.5, 0xffd166, 1);
      btnBg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);
    });

    playZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x0e1b38, 0.95);
      btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);
      btnBg.lineStyle(2, 0xf9c74f, 0.9);
      btnBg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 22);
    });

    // Nút Cài đặt (Settings Button)
    const settingsY = 930;
    const settingsWidth = 160;
    const settingsHeight = 44;

    const settingsBg = this.add.graphics();
    settingsBg.fillStyle(0x0c162d, 0.8);
    settingsBg.fillRoundedRect(
      btnX - settingsWidth / 2,
      settingsY - settingsHeight / 2,
      settingsWidth,
      settingsHeight,
      14
    );
    settingsBg.lineStyle(1.2, 0x4ecdc4, 0.4);
    settingsBg.strokeRoundedRect(
      btnX - settingsWidth / 2,
      settingsY - settingsHeight / 2,
      settingsWidth,
      settingsHeight,
      14
    );

    const settingsText = this.add
      .text(btnX, settingsY, '⚙ CÀI ĐẶT', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#68B8DC',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const settingsZone = this.add
      .zone(btnX, settingsY, settingsWidth, settingsHeight)
      .setInteractive({ useHandCursor: true });

    settingsZone.on('pointerdown', () => {
      this.openSettingsModal();
    });

    // Chú thích bản quyền & phiên bản dưới cùng
    const versionText = this.add
      .text(360, 1220, 'ASOL · MIRROR GALAXY V1.1', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#415A77',
      })
      .setOrigin(0.5);

    this.uiContainer.add([
      titleText,
      subtitleText,
      btnBg,
      btnText,
      btnSubText,
      playZone,
      settingsBg,
      settingsText,
      settingsZone,
      versionText,
    ]);
  }

  /**
   * Mở modal Cài đặt phong cách Tinh Vân
   */
  private openSettingsModal(): void {
    if (this.settingsModalContainer) return;

    this.settingsModalContainer = this.add.container(0, 0);

    // 1. Lớp phủ đen mờ (Dim Backdrop)
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(0, 0, 720, 1280);
    const blockClicks = this.add.zone(360, 640, 720, 1280).setInteractive();

    // 2. Khung modal cài đặt
    const modalW = 440;
    const modalH = 340;
    const modalX = 360;
    const modalY = 640;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x0d1833, 0.98);
    modalBg.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);
    modalBg.lineStyle(2, 0x4ecdc4, 0.6);
    modalBg.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 20);

    const modalTitle = this.add
      .text(modalX, modalY - 120, 'CÀI ĐẶT CHIÊM TINH', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '20px',
        color: '#FFD166',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Tùy chọn 1: Bóng mục tiêu
    const currentProgress = this.progressRepo.read().progress;
    let showTarget = currentProgress.settings.showTarget;

    const targetLabel = this.add
      .text(modalX - 160, modalY - 50, 'Bóng mục tiêu (Silhouette):', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#EEF4FA',
      })
      .setOrigin(0, 0.5);

    const targetBtnText = this.add
      .text(modalX + 110, modalY - 50, showTarget ? '✓ BẬT' : '✕ TẮT', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: showTarget ? '#4ECDC4' : '#9DAFC7',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const targetZone = this.add
      .zone(modalX + 110, modalY - 50, 80, 36)
      .setInteractive({ useHandCursor: true });
    targetZone.on('pointerdown', () => {
      showTarget = !showTarget;
      this.progressRepo.setShowTarget(showTarget);
      targetBtnText.setText(showTarget ? '✓ BẬT' : '✕ TẮT');
      targetBtnText.setColor(showTarget ? '#4ECDC4' : '#9DAFC7');
    });

    // Tùy chọn 2: Đặt lại tiến trình
    const resetLabel = this.add
      .text(modalX - 160, modalY + 10, 'Tiến trình chơi:', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#EEF4FA',
      })
      .setOrigin(0, 0.5);

    const resetBtnText = this.add
      .text(modalX + 100, modalY + 10, 'Đặt lại', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#E63946',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const resetZone = this.add
      .zone(modalX + 100, modalY + 10, 90, 36)
      .setInteractive({ useHandCursor: true });
    resetZone.on('pointerdown', () => {
      // Đặt lại dữ liệu rỗng
      localStorage.removeItem('mirror.rebuild.progress.v1');
      this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
      resetBtnText.setText('Đã đặt lại!');
      this.time.delayedCall(800, () => {
        resetBtnText.setText('Đặt lại');
        this.buildMainMenu([]);
      });
    });

    // Nút Đóng modal
    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0x13234d, 1);
    closeBtnBg.fillRoundedRect(modalX - 60, modalY + 90, 120, 40, 12);
    closeBtnBg.lineStyle(1.5, 0x4ecdc4, 0.5);
    closeBtnBg.strokeRoundedRect(modalX - 60, modalY + 90, 120, 40, 12);

    const closeBtnText = this.add
      .text(modalX, modalY + 110, 'ĐÓNG', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        color: '#FFF3B0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const closeZone = this.add
      .zone(modalX, modalY + 110, 120, 40)
      .setInteractive({ useHandCursor: true });
    closeZone.on('pointerdown', () => {
      this.settingsModalContainer?.destroy();
      this.settingsModalContainer = undefined;
    });

    this.settingsModalContainer.add([
      backdrop,
      blockClicks,
      modalBg,
      modalTitle,
      targetLabel,
      targetBtnText,
      targetZone,
      resetLabel,
      resetBtnText,
      resetZone,
      closeBtnBg,
      closeBtnText,
      closeZone,
    ]);
  }

  update(_time: number, delta: number): void {
    // 1. Chuyển động sao li ti (Star Drift & Twinkle)
    this.starGraphics.clear();
    for (const star of this.stars) {
      star.y += star.speed * (delta / 16);
      star.phase += 0.03;
      if (star.y > 1280) star.y = 0;

      const alpha = star.baseAlpha + Math.sin(star.phase) * 0.25;
      this.starGraphics.fillStyle(0xffffff, Phaser.Math.Clamp(alpha, 0.1, 1));
      this.starGraphics.fillCircle(star.x, star.y, star.r);
    }

    // 2. Tinh ấn cổ ngữ xoay nhẹ ở giữa màn hình (480px)
    this.emblemAngle += 0.003 * (delta / 16);
    this.pulseTime += 0.02 * (delta / 16);

    this.emblemGraphics.clear();
    const cx = 360;
    const cy = 540;
    const baseR = 100 + Math.sin(this.pulseTime) * 3;

    // Hình thoi ngoài xoay theo chiều kim đồng hồ
    this.drawRotatingDiamond(this.emblemGraphics, cx, cy, baseR, this.emblemAngle, 0x4ecdc4, 0.28, 1.5);
    // Hình thoi trong xoay ngược chiều
    this.drawRotatingDiamond(
      this.emblemGraphics,
      cx,
      cy,
      baseR * 0.62,
      -this.emblemAngle * 1.4,
      0xf9c74f,
      0.45,
      1.5
    );
    // Điểm sáng hạt nhân tinh thể
    this.emblemGraphics.fillStyle(0xffffff, 0.85);
    this.emblemGraphics.fillCircle(cx, cy, 3.5);
  }

  private drawRotatingDiamond(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    angle: number,
    color: number,
    alpha: number,
    lineWidth: number
  ): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const localPoints = [
      { x: 0, y: -r },
      { x: r, y: 0 },
      { x: 0, y: r },
      { x: -r, y: 0 },
    ];

    const worldPoints = localPoints.map((p) => {
      const rx = p.x * cos - p.y * sin;
      const ry = p.x * sin + p.y * cos;
      return new Phaser.Geom.Point(cx + rx, cy + ry);
    });

    g.lineStyle(lineWidth, color, alpha);
    g.strokePoints(worldPoints, true);

    g.fillStyle(color, alpha * 0.8);
    for (const pt of worldPoints) {
      g.fillCircle(pt.x, pt.y, 2.5);
    }
  }
}

import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { resolveNextCampaignLevel } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';
import { SkyBackdrop } from './SkyBackdrop.ts';
import { applyDesignViewport } from './designViewport.ts';
import { SettingsDialog } from './SettingsDialog.ts';

export class MenuScene extends Phaser.Scene {
  private progressRepo!: ProgressRepository;
  private sky!: SkyBackdrop;
  private emblemGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;

  private ringAngle1 = 0;
  private ringAngle2 = 0;
  private pulseTime = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    applyDesignViewport(this);
    TextureFactory.generateAll(this);

    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();

    // 1. Nền trời dùng chung (gradient, nebula, trăng, trường sao)
    this.sky = new SkyBackdrop(this, { seed: 1, drift: false });

    // 2. Ấn bia cổ ngữ xoay (280px Prophecy Seal)
    this.emblemGraphics = this.add.graphics();

    // 3. UI Container chính
    this.uiContainer = this.add.container(0, 0);
    this.buildMainMenu(progress.completed);
  }

  private buildMainMenu(completedLevels: readonly string[]): void {
    this.uiContainer.removeAll(true);

    // Xác định màn kế tiếp an toàn
    const nextResolution = resolveNextCampaignLevel(campaignManifest, completedLevels);
    const targetLevel = nextResolution.level;
    const btnLabelText =
      nextResolution.type === 'start'
        ? 'Bắt đầu'
        : nextResolution.type === 'continue'
        ? 'Tiếp tục'
        : 'Chơi lại';

    // Nút Cài đặt góc trên phải (x=664, y=52)
    const settingsBtn = this.add
      .image(664, 52, TEXTURE_KEYS.btnCircle56)
      .setInteractive({ useHandCursor: true });
    const settingsIcon = this.add.image(664, 52, TEXTURE_KEYS.iconGear);
    settingsBtn.on('pointerdown', () => {
      this.animateButtonTap(settingsBtn, () => this.openSettings());
    });
    this.uiContainer.add([settingsBtn, settingsIcon]);

    // Tiêu đề game lớn phong cách chiêm tinh
    const titleText = this.add
      .text(360, 210, 'M I R R O R', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: TYPO_TOKENS.fontSize.heroTitle,
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    // Hình phản chiếu lật ngược (Mirror Reflection)
    const reflectionText = this.add
      .text(360, 260, 'M I R R O R', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: TYPO_TOKENS.fontSize.heroTitle,
        color: COLOR_TOKENS.iceGlass.bevelShadow,
      })
      .setOrigin(0.5)
      .setScale(1, -0.85)
      .setAlpha(0.22);

    const subtitleText = this.add
      .text(360, 310, 'Cổ Ngữ Chiêm Tinh · Bí Ẩn Giao Thoa', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    this.uiContainer.add([titleText, reflectionText, subtitleText]);

    // Nút Bắt đầu / Tiếp tục chính (Primary Hero CTA Button - Khối vàng đặc)
    const btnWidth = 340;
    const btnHeight = 72;
    const btnX = 360;
    const btnY = 830;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 20);

    const mainBtnText = this.add
      .text(btnX, btnY - 12, btnLabelText, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '20px',
        color: COLOR_TOKENS.sky.stops[0],
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const subBtnText = this.add
      .text(btnX, btnY + 14, `${targetLevel.id} · ${targetLevel.title}`, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '13px',
        color: '#3E2A00',
      })
      .setOrigin(0.5);

    const btnZone = this.add
      .zone(btnX, btnY, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });
    btnZone.on('pointerdown', () => {
      btnZone.disableInteractive();
      this.animateButtonTap(mainBtnText, () => {
        this.scene.start('PlayScene', { levelId: targetLevel.id });
      });
    });

    this.uiContainer.add([btnBg, mainBtnText, subBtnText, btnZone]);

    // Nút phụ "Chọn màn" (Secondary Button - Viền kính xanh trong suốt)
    const secBtnY = 930;
    const secBtnBg = this.add.graphics();
    secBtnBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.7);
    secBtnBg.fillRoundedRect(btnX - btnWidth / 2, secBtnY - 28, btnWidth, 56, 18);
    secBtnBg.lineStyle(1.8, COLOR_NUMBERS.icePrimary, 0.85);
    secBtnBg.strokeRoundedRect(btnX - btnWidth / 2, secBtnY - 28, btnWidth, 56, 18);

    const secBtnText = this.add
      .text(btnX, secBtnY, 'Chọn màn chơi', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '16px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    const secBtnZone = this.add
      .zone(btnX, secBtnY, btnWidth, 56)
      .setInteractive({ useHandCursor: true });
    secBtnZone.on('pointerdown', () => {
      secBtnZone.disableInteractive();
      this.animateButtonTap(secBtnText, () => {
        if (this.scene.get('LevelSelectScene')) {
          this.scene.start('LevelSelectScene');
        }
      });
    });

    this.uiContainer.add([secBtnBg, secBtnText, secBtnZone]);

    // Chân trang phiên bản
    const footerText = this.add
      .text(360, 1240, 'Mirror v0.2.1 · Bản Thử Nghiệm Android', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '12px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);
    this.uiContainer.add(footerText);
  }

  private openSettings(): void {
    new SettingsDialog(this, this.progressRepo).open();
  }

  private animateButtonTap(target: Phaser.GameObjects.GameObject, onComplete: () => void): void {
    this.tweens.add({
      targets: target,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 80,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete,
    });
  }

  override update(_time: number, delta: number): void {
    // 1. Nền trời
    this.sky.update(delta);

    // 2. Ấn bia cổ ngữ 280px xoay chậm (x=360, y=500)
    this.ringAngle1 += delta * 0.0003;
    this.ringAngle2 -= delta * 0.0002;
    this.pulseTime += delta * 0.003;

    this.emblemGraphics.clear();
    const cx = 360;
    const cy = 500;

    // Vòng ngoài (R = 140px)
    this.emblemGraphics.lineStyle(1.8, COLOR_NUMBERS.icePrimary, 0.4);
    this.emblemGraphics.strokeCircle(cx, cy, 140);

    // Vòng trong vàng (R = 115px)
    this.emblemGraphics.lineStyle(1.2, COLOR_NUMBERS.gridModule, 0.35);
    this.emblemGraphics.strokeCircle(cx, cy, 115);

    // Các điểm vệ tinh xoay trên vòng ngoài
    for (let i = 0; i < 4; i++) {
      const angle = this.ringAngle1 + (i * Math.PI) / 2;
      const x = cx + Math.cos(angle) * 140;
      const y = cy + Math.sin(angle) * 140;
      this.emblemGraphics.fillStyle(COLOR_NUMBERS.iceHighlight, 0.7);
      this.emblemGraphics.fillCircle(x, y, 3.5);
    }

    // Các ký tự nan hoa trên vòng trong
    for (let i = 0; i < 6; i++) {
      const angle = this.ringAngle2 + (i * Math.PI) / 3;
      const x1 = cx + Math.cos(angle) * 95;
      const y1 = cy + Math.sin(angle) * 95;
      const x2 = cx + Math.cos(angle) * 115;
      const y2 = cy + Math.sin(angle) * 115;
      this.emblemGraphics.lineStyle(1, COLOR_NUMBERS.gridModule, 0.4);
      this.emblemGraphics.lineBetween(x1, y1, x2, y2);
    }

    // Hai viên ngọc thoi vàng chạm đỉnh ở tâm ấn bia (Song Tinh) phát quang nhịp thở
    const rhombAlpha = 0.75 + Math.sin(this.pulseTime) * 0.2;
    this.drawCenterRhomb(cx - 22, cy, 18, rhombAlpha);
    this.drawCenterRhomb(cx + 22, cy, 18, rhombAlpha);
  }

  private drawCenterRhomb(cx: number, cy: number, r: number, alpha: number): void {
    const points = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r, cy),
    ];

    this.emblemGraphics.fillStyle(COLOR_NUMBERS.amberSolid, alpha);
    this.emblemGraphics.fillPoints(points, true);

    this.emblemGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGlow, alpha);
    this.emblemGraphics.strokePoints(points, true);
  }
}

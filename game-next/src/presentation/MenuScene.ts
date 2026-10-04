import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { resolveNextCampaignLevel } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, LAYOUT_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';
import { SkyBackdrop } from './SkyBackdrop.ts';
import { applyDesignViewport, designSafeArea, designViewBounds } from './designViewport.ts';
import { SettingsDialog } from './SettingsDialog.ts';
import { t, getLocale, setLocale, getLevelTitle } from './i18n.ts';

export class MenuScene extends Phaser.Scene {
  private progressRepo!: ProgressRepository;
  private sky!: SkyBackdrop;
  private emblemGraphics!: Phaser.GameObjects.Graphics;
  private sparkleGraphics!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;

  private blockOffsetY = 0;
  private viewHeight: number = LAYOUT_TOKENS.canvas.height;
  private safe = { top: 0, right: 0, bottom: 0, left: 0 };
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

    const view = designViewBounds(this);
    this.safe = designSafeArea(this);
    this.blockOffsetY = (view.height - LAYOUT_TOKENS.canvas.height) / 2;
    this.viewHeight = view.height;

    // 2. Biểu tượng Ngọc Đôi (Dual Jewels XOR) lơ lửng ở trung tâm
    this.emblemGraphics = this.add.graphics().setY(this.blockOffsetY);
    this.sparkleGraphics = this.add.graphics().setY(this.blockOffsetY);

    // 3. UI Container chính
    this.uiContainer = this.add.container(0, this.blockOffsetY);
    this.buildMainMenu(progress.completed);
  }

  private buildMainMenu(completedLevels: readonly string[]): void {
    this.uiContainer.removeAll(true);

    // Xác định màn kế tiếp an toàn
    const nextResolution = resolveNextCampaignLevel(campaignManifest, completedLevels);
    const targetLevel = nextResolution.level;
    const btnLabelText =
      nextResolution.type === 'start'
        ? t('btn_start')
        : nextResolution.type === 'continue'
        ? t('btn_continue')
        : t('btn_replay');

    const topY = this.safe.top + 52 - this.blockOffsetY;

    // Nút chọn Ngôn ngữ (Pill Toggle: VI | EN ở góc trên trái: x=72)
    const currentLoc = getLocale();
    const pillW = 88;
    const pillH = 38;
    const pillX = 72;

    const langPillBg = this.add.graphics();
    langPillBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.85);
    langPillBg.fillRoundedRect(pillX - pillW / 2, topY - pillH / 2, pillW, pillH, 19);
    langPillBg.lineStyle(1.6, COLOR_NUMBERS.icePrimary, 0.8);
    langPillBg.strokeRoundedRect(pillX - pillW / 2, topY - pillH / 2, pillW, pillH, 19);

    const activeBg = this.add.graphics();
    activeBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    if (currentLoc === 'vi') {
      activeBg.fillRoundedRect(pillX - pillW / 2 + 2, topY - pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 17);
    } else {
      activeBg.fillRoundedRect(pillX, topY - pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 17);
    }

    const viText = this.add
      .text(pillX - 22, topY, 'VI', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: currentLoc === 'vi' ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const enText = this.add
      .text(pillX + 22, topY, 'EN', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: currentLoc === 'en' ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const langHitZone = this.add
      .zone(pillX, topY, pillW, pillH)
      .setInteractive({ useHandCursor: true });
    langHitZone.on('pointerdown', () => {
      const nextLoc = currentLoc === 'vi' ? 'en' : 'vi';
      setLocale(nextLoc);
      this.buildMainMenu(completedLevels);
    });

    this.uiContainer.add([langPillBg, activeBg, viText, enText, langHitZone]);

    // Nút Cài đặt góc trên phải (x=664, y=52)
    const settingsBtn = this.add
      .image(664, topY, TEXTURE_KEYS.btnCircle56)
      .setInteractive({ useHandCursor: true });
    const settingsIcon = this.add.image(664, topY, TEXTURE_KEYS.iconGear);
    settingsBtn.on('pointerdown', () => {
      this.animateButtonTap(settingsBtn, () => this.openSettings());
    });
    this.uiContainer.add([settingsBtn, settingsIcon]);

    // -------------------------------------------------------------
    // LOGO PHƯƠNG ÁN 2: GƯƠNG ĐÔI (CASUAL LOGO WITH MIRROR REFLECTION)
    // -------------------------------------------------------------
    this.buildCasualMirrorLogo();

    // Dòng phụ đề phong cách casual
    const subtitleText = this.add
      .text(360, 316, t('menu_subtitle'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);
    this.uiContainer.add(subtitleText);

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
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '22px',
        color: '#22145A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const localizedTitle = getLevelTitle(targetLevel.id, targetLevel.title);
    const subBtnText = this.add
      .text(btnX, btnY + 14, `${targetLevel.id} · ${localizedTitle}`, {
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
      .text(btnX, secBtnY, t('btn_select_level'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '17px',
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
      .text(360, this.viewHeight - this.safe.bottom - 40 - this.blockOffsetY, t('version_footer'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '12px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);
    this.uiContainer.add(footerText);
  }

  /**
   * Dựng cụm logo MIRROR phong cách Phương án 2 (Gương Đôi)
   * Chữ vàng tròn mập, đứng trên thanh gương cyan phản chiếu lật ngược
   */
  private buildCasualMirrorLogo(): void {
    const letters = [
      { char: 'M', dx: -180, rot: -4 },
      { char: 'I', dx: -110, rot: 3 },
      { char: 'R', dx: -45, rot: -3 },
      { char: 'R', dx: 38, rot: 4 },
      { char: 'O', dx: 114, rot: -3 },
      { char: 'R', dx: 182, rot: 4 },
    ];

    const logoY = 195;
    const barY = 248;

    // 1. Bóng phản chiếu màu kính cyan bên dưới thanh gương (Mirror Reflection)
    for (const item of letters) {
      const x = 360 + item.dx;
      const refY = barY + 36;
      const refText = this.add
        .text(x, refY, item.char, {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '76px',
          color: '#7FD8FF',
          stroke: '#3B2779',
          strokeThickness: 10,
        })
        .setOrigin(0.5)
        .setAngle(item.rot)
        .setScale(1, -0.75)
        .setAlpha(0.25);
      this.uiContainer.add(refText);
    }

    // 2. Thanh gương kính cyan (Mirror Bar) ở giữa
    const barWidth = 470;
    const barHeight = 18;
    const barBg = this.add.graphics();
    // Đổ bóng thanh gương
    barBg.fillStyle(0x22145a, 0.8);
    barBg.fillRoundedRect(360 - barWidth / 2, barY - barHeight / 2 + 5, barWidth, barHeight, 9);
    // Thân thanh gương cyan
    barBg.fillStyle(0x7fd8ff, 1.0);
    barBg.fillRoundedRect(360 - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 9);
    barBg.lineStyle(3, 0x3b2779, 1.0);
    barBg.strokeRoundedRect(360 - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 9);
    // Vệt highlight trên gương
    barBg.fillStyle(0xffffff, 0.7);
    barBg.fillRoundedRect(360 - barWidth / 2 + 18, barY - barHeight / 2 + 3, 160, 4, 2);

    // Viên ngọc thoi vàng đính ở tâm thanh gương
    const centerJewel = this.add.graphics();
    const jewelPts = [
      new Phaser.Geom.Point(360, barY - 14),
      new Phaser.Geom.Point(374, barY),
      new Phaser.Geom.Point(360, barY + 14),
      new Phaser.Geom.Point(346, barY),
    ];
    centerJewel.fillStyle(0xffc94a, 1.0);
    centerJewel.fillPoints(jewelPts, true);
    centerJewel.lineStyle(3.5, 0x3b2779, 1.0);
    centerJewel.strokePoints(jewelPts, true);

    // Ngôi sao nhỏ ở tâm viên ngọc
    centerJewel.fillStyle(0xffffff, 0.9);
    centerJewel.fillCircle(360, barY, 2.5);

    this.uiContainer.add([barBg, centerJewel]);

    // 3. Cụm chữ chính MIRROR màu vàng hổ phách nổi khối
    for (const item of letters) {
      const x = 360 + item.dx;

      // Lớp bóng đổ đậm (Deep shadow)
      const shadowText = this.add
        .text(x, logoY + 7, item.char, {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '76px',
          color: '#22145A',
          stroke: '#22145A',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setAngle(item.rot);

      // Chữ chính màu vàng có viền tím đậm (Gold face with purple outline)
      const mainText = this.add
        .text(x, logoY, item.char, {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '76px',
          color: '#FFD23F',
          stroke: '#3B2779',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setAngle(item.rot);

      this.uiContainer.add([shadowText, mainText]);
    }
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

    // 2. Chuyển động lơ lửng và nhịp thở của biểu tượng Ngọc Đôi (Icon 1 XOR)
    this.ringAngle1 += delta * 0.0004;
    this.ringAngle2 -= delta * 0.0003;
    this.pulseTime += delta * 0.003;

    this.renderDualJewelEmblem();
  }

  /**
   * Vẽ biểu tượng Ngọc Đôi (Icon 1) ở trung tâm màn hình chính:
   * Hai viên ngọc thoi vàng lồng nhau, tạo vùng rỗng Parity XOR ở giữa
   * kèm ngôi sao phát quang nhịp thở.
   */
  private renderDualJewelEmblem(): void {
    this.emblemGraphics.clear();
    this.sparkleGraphics.clear();

    const cx = 360;
    // Nhấp nhô nhẹ nhàng
    const bobY = Math.sin(this.pulseTime * 0.7) * 5;
    const cy = 520 + bobY;

    // Vòng bụi sao xoay mờ ảo xung quanh (R = 150px)
    this.emblemGraphics.lineStyle(1.2, COLOR_NUMBERS.icePrimary, 0.25);
    this.emblemGraphics.strokeCircle(cx, cy, 150);

    for (let i = 0; i < 4; i++) {
      const angle = this.ringAngle1 + (i * Math.PI) / 2;
      const x = cx + Math.cos(angle) * 150;
      const y = cy + Math.sin(angle) * 150;
      this.emblemGraphics.fillStyle(0xcfe6ff, 0.6);
      this.emblemGraphics.fillCircle(x, y, 3);
    }

    for (let i = 0; i < 4; i++) {
      const angle = this.ringAngle2 + (i * Math.PI) / 2 + Math.PI / 4;
      const x = cx + Math.cos(angle) * 125;
      const y = cy + Math.sin(angle) * 125;
      this.emblemGraphics.fillStyle(0xffd27a, 0.5);
      this.emblemGraphics.fillCircle(x, y, 2.5);
    }

    // Hai viên ngọc thoi:
    // Viên trái: tâm cx - 38
    // Viên phải: tâm cx + 38
    const jewelR = 68; // Bán kính đường chéo
    const overlapOffset = 38;

    // Đổ bóng chân cụm ngọc
    this.drawDiamond(cx - overlapOffset, cy + 8, jewelR, 0x1b0b4a, 0.45);
    this.drawDiamond(cx + overlapOffset, cy + 8, jewelR, 0x1b0b4a, 0.45);

    // Viên ngọc trái (Vát 4 mặt sáng tối)
    this.drawFacetedJewel(cx - overlapOffset, cy, jewelR);

    // Viên ngọc phải (Vát 4 mặt sáng tối)
    this.drawFacetedJewel(cx + overlapOffset, cy, jewelR);

    // VÙNG GIAO NHAU (Parity XOR): Rỗng thành nền đêm tím sâu
    // Giao giữa 2 viên thoi tạo thành một hình thoi đứng ở chính giữa (cx, cy)
    const xorHalfW = jewelR - overlapOffset; // 68 - 38 = 30
    const xorHalfH = jewelR - overlapOffset; // 30

    const xorPts = [
      new Phaser.Geom.Point(cx, cy - xorHalfH),
      new Phaser.Geom.Point(cx + xorHalfW, cy),
      new Phaser.Geom.Point(cx, cy + xorHalfH),
      new Phaser.Geom.Point(cx - xorHalfW, cy),
    ];

    // Nền XOR sâu thẳm
    this.emblemGraphics.fillStyle(0x1a2470, 0.95);
    this.emblemGraphics.fillPoints(xorPts, true);

    // Viền XOR sắc nét
    this.emblemGraphics.lineStyle(3.5, 0xb85c00, 1.0);
    this.emblemGraphics.strokePoints(xorPts, true);

    // Viền trong tối
    this.emblemGraphics.lineStyle(1.5, 0x3a1585, 0.8);
    this.emblemGraphics.strokePoints(xorPts, true);

    // Ngôi sao 4 cánh phát quang nhịp thở tại tâm vùng XOR
    const pulseScale = 0.8 + Math.sin(this.pulseTime * 2.2) * 0.3;
    const starR = 14 * pulseScale;
    this.drawSparkle(cx, cy, starR, 0xffffff, 0.95);

    // Hai ngôi sao lấp lánh trang trí góc ngoài
    const spark1Alpha = 0.6 + Math.sin(this.pulseTime * 1.5) * 0.35;
    this.drawSparkle(cx - 100, cy - 65, 8, 0xffe8b8, spark1Alpha);
    const spark2Alpha = 0.6 + Math.cos(this.pulseTime * 1.7) * 0.35;
    this.drawSparkle(cx + 105, cy + 60, 9, 0xffe8b8, spark2Alpha);
  }

  /**
   * Vẽ 1 viên ngọc thoi vát 4 mặt sáng tối (Faceted Jewel)
   */
  private drawFacetedJewel(cx: number, cy: number, r: number): void {
    const top = new Phaser.Geom.Point(cx, cy - r);
    const right = new Phaser.Geom.Point(cx + r, cy);
    const bottom = new Phaser.Geom.Point(cx, cy + r);
    const left = new Phaser.Geom.Point(cx - r, cy);
    const center = new Phaser.Geom.Point(cx, cy);

    // Mặt Bắc (North) - sáng nhất: #FFF0A6
    this.emblemGraphics.fillStyle(0xfff0a6, 1.0);
    this.emblemGraphics.fillPoints([top, right, center], true);

    // Mặt Tây (West) - sáng vừa: #FFD23F
    this.emblemGraphics.fillStyle(0xffd23f, 1.0);
    this.emblemGraphics.fillPoints([top, left, center], true);

    // Mặt Đông (East) - sẫm vàng: #FFB31F
    this.emblemGraphics.fillStyle(0xffb31f, 1.0);
    this.emblemGraphics.fillPoints([bottom, left, center], true);

    // Mặt Nam (South) - tối cam: #F59400
    this.emblemGraphics.fillStyle(0xf59400, 1.0);
    this.emblemGraphics.fillPoints([bottom, right, center], true);

    // Viền bao ngoài viên ngọc
    this.emblemGraphics.lineStyle(3, 0xb85c00, 1.0);
    this.emblemGraphics.strokePoints([top, right, bottom, left], true);

    // Highlight ánh kim góc trên-trái
    this.emblemGraphics.lineStyle(2, 0xffffff, 0.7);
    this.emblemGraphics.lineBetween(left.x + 10, left.y - 10, top.x - 10, top.y + 10);
  }

  /**
   * Vẽ hình thoi đơn giản dùng cho bóng đổ
   */
  private drawDiamond(cx: number, cy: number, r: number, color: number, alpha: number): void {
    const pts = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r, cy),
    ];
    this.emblemGraphics.fillStyle(color, alpha);
    this.emblemGraphics.fillPoints(pts, true);
  }

  /**
   * Vẽ ngôi sao 4 cánh phát quang (4-pointed Sparkle)
   */
  private drawSparkle(cx: number, cy: number, r: number, color: number, alpha: number): void {
    this.sparkleGraphics.fillStyle(color, alpha);
    const inner = r * 0.28;
    const pts = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + inner, cy - inner),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx + inner, cy + inner),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - inner, cy + inner),
      new Phaser.Geom.Point(cx - r, cy),
      new Phaser.Geom.Point(cx - inner, cy - inner),
    ];
    this.sparkleGraphics.fillPoints(pts, true);
  }
}

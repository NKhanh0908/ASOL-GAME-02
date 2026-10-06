import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { resolveNextCampaignLevel } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS, TYPO_TOKENS, glowTier } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';
import { applyDesignViewport, designSafeArea, designViewBounds } from './designViewport.ts';
import { SettingsDialog } from './SettingsDialog.ts';
import { t, getLocale, setLocale, getLevelTitle, getRandomMenuTagline } from './i18n.ts';
import { director } from './transitions/SceneDirector.ts';
import type { Choreographed, TransitionContext } from './transitions/SceneDirector.ts';
import type { TransitionTimeline } from './transitions/TransitionTimeline.ts';
import { getMotionScale } from './transitions/motion.ts';
import { applySteps } from './transitions/choreography.ts';
import type { Parts } from './transitions/choreography.ts';
import { MENU_OUT_TO_MAP, MENU_OUT_TO_PLAY, MENU_SPECIAL, menuIn } from './transitions/routes.ts';
import { playUiCue } from './audio/uiCues.ts';
import { DualJewelEmblem } from './menu/DualJewelEmblem.ts';

export class MenuScene extends Phaser.Scene implements Choreographed {
  readonly directorKey = 'MenuScene' as const;
  private progressRepo!: ProgressRepository;
  private emblem!: DualJewelEmblem;
  private uiContainer!: Phaser.GameObjects.Container;
  private titleBlock!: Phaser.GameObjects.Container;
  private primaryButton!: Phaser.GameObjects.Container;
  private secondaryButton!: Phaser.GameObjects.Container;
  private settingsButton!: Phaser.GameObjects.Container;
  private langPillContainer!: Phaser.GameObjects.Container;
  private footer!: Phaser.GameObjects.Text;
  private mirrorLogoContainer?: Phaser.GameObjects.Container;
  private logoSheenGraphics?: Phaser.GameObjects.Graphics;
  private letterObjects: { main: Phaser.GameObjects.Text; shadow: Phaser.GameObjects.Text; baseY: number }[] = [];
  private lastTrailTime = 0;

  private blockOffsetY = 0;
  private viewHeight: number = LAYOUT_TOKENS.canvas.height;
  private safe = { top: 0, right: 0, bottom: 0, left: 0 };

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    applyDesignViewport(this);
    TextureFactory.generateAll(this);

    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();

    const view = designViewBounds(this);
    this.safe = designSafeArea(this);
    this.blockOffsetY = (view.height - LAYOUT_TOKENS.canvas.height) / 2;
    this.viewHeight = view.height;

    // 2. Biểu tượng Ngọc Đôi (Dual Jewels XOR) lơ lửng ở trung tâm
    this.emblem = new DualJewelEmblem(this, 360, 620 + this.blockOffsetY);

    // 3. UI Container chính
    this.uiContainer = this.add.container(0, this.blockOffsetY);
    this.buildMainMenu(progress.completed);

    // 4. Thiết lập tương tác chạm bụi sao & sóng lượng tử trên bầu trời
    this.setupCosmicSkyInteractions();

    director.attach(this);
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
    langPillBg.fillRoundedRect(-pillW / 2, -pillH / 2, pillW, pillH, 19);
    langPillBg.lineStyle(1.6, COLOR_NUMBERS.icePrimary, 0.8);
    langPillBg.strokeRoundedRect(-pillW / 2, -pillH / 2, pillW, pillH, 19);

    const activeBg = this.add.graphics();
    activeBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    if (currentLoc === 'vi') {
      activeBg.fillRoundedRect(-pillW / 2 + 2, -pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 17);
    } else {
      activeBg.fillRoundedRect(0, -pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 17);
    }

    const viText = this.add
      .text(-22, 0, 'VI', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: currentLoc === 'vi' ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const enText = this.add
      .text(22, 0, 'EN', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: currentLoc === 'en' ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const langHitZone = this.add
      .zone(0, 0, pillW, pillH)
      .setInteractive({ useHandCursor: true });
    langHitZone.on('pointerdown', () => {
      const nextLoc = currentLoc === 'vi' ? 'en' : 'vi';
      setLocale(nextLoc);
      this.buildMainMenu(completedLevels);
    });

    this.langPillContainer = this.add.container(pillX, topY, [langPillBg, activeBg, viText, enText, langHitZone]);

    // Nút Cài đặt góc trên phải (x=664, y=52)
    const settingsBtn = this.add
      .image(0, 0, TEXTURE_KEYS.btnCircle56)
      .setInteractive({ useHandCursor: true });
    const settingsIcon = this.add.image(0, 0, TEXTURE_KEYS.iconGear);
    settingsBtn.on('pointerdown', () => {
      this.animateButtonTap(settingsBtn, () => this.openSettings());
    });
    this.settingsButton = this.add.container(664, topY, [settingsBtn, settingsIcon]);

    // -------------------------------------------------------------
    // LOGO PHƯƠNG ÁN 2: GƯƠNG ĐÔI (CASUAL LOGO WITH MIRROR REFLECTION)
    // -------------------------------------------------------------
    this.titleBlock = this.add.container(0, 0);
    this.buildCasualMirrorLogo();

    // Dòng thông tin thiên văn (Layout C: đặt ngay dưới hero ở y=830)
    const factCaption = this.add
      .text(360, 830, `◆ ${getRandomMenuTagline()}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: TYPO_TOKENS.fontSize.caption,
        color: '#B9C9F2',
        align: 'center',
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5);
    this.titleBlock.add(factCaption);

    // -------------------------------------------------------------
    // 1. NÚT CHÍNH: BẮT ĐẦU / TIẾP TỤC (Hero 3D Tactile Juicy Button, y=980)
    // -------------------------------------------------------------
    const btnWidth = 360;
    const btnHeight = 84;
    const btnX = 360;
    const btnY = 980;

    const primaryBtnContainer = this.add.container(btnX, btnY);

    // Lớp đế đổ bóng 3D dày 6px màu tím sẫm
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x22145a, 1.0);
    btnShadow.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 6, btnWidth, btnHeight, 26);

    // Mặt nút gradient vàng hổ phách tươi sáng
    const btnFace = this.add.graphics();
    btnFace.fillStyle(0xffa800, 1.0);
    btnFace.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight - 4, 26);
    btnFace.fillStyle(0xffd54f, 0.95);
    btnFace.fillRoundedRect(-btnWidth / 2 + 2, -btnHeight / 2 + 2, btnWidth - 4, (btnHeight - 8) * 0.65, 24);

    // Vệt bóng gương lấp lánh (Specular Gloss)
    btnFace.fillStyle(0xffffff, 0.35);
    btnFace.fillRoundedRect(-btnWidth / 2 + 18, -btnHeight / 2 + 6, btnWidth - 36, 16, 8);

    // Đường viền tím sẫm sắc nét
    btnFace.lineStyle(3, 0x3b2779, 1.0);
    btnFace.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 26);

    // Icon Tam giác Play nổi khối bên trái
    const playIcon = this.add.graphics();
    playIcon.fillStyle(0x22145a, 1.0);
    playIcon.beginPath();
    playIcon.moveTo(-btnWidth / 2 + 36, -11);
    playIcon.lineTo(-btnWidth / 2 + 52, 0);
    playIcon.lineTo(-btnWidth / 2 + 36, 11);
    playIcon.closePath();
    playIcon.fillPath();
    playIcon.fillStyle(0xffffff, 0.7);
    playIcon.beginPath();
    playIcon.moveTo(-btnWidth / 2 + 38, -7);
    playIcon.lineTo(-btnWidth / 2 + 45, 0);
    playIcon.lineTo(-btnWidth / 2 + 38, -1);
    playIcon.closePath();
    playIcon.fillPath();

    // Tiêu đề nút chính (Baloo 2 28px đậm nét)
    const mainBtnText = this.add
      .text(14, -12, btnLabelText, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '28px',
        color: '#22145A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Phụ đề tên màn chơi (15px rõ ràng)
    const localizedTitle = getLevelTitle(targetLevel.id, targetLevel.title);
    const subBtnText = this.add
      .text(14, 18, `${targetLevel.id} · ${localizedTitle}`, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '15px',
        color: '#3E2A00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const btnZone = this.add
      .zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerdown', () => {
      playUiCue(this, 'tap');
      primaryBtnContainer.y = btnY + 4;
      primaryBtnContainer.setScale(0.97);
    });

    btnZone.on('pointerup', () => {
      btnZone.disableInteractive();
      this.tweens.add({
        targets: primaryBtnContainer,
        y: btnY,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: 'Back.easeOut',
        onComplete: () => {
          director.go(this, 'PlayScene', { levelId: targetLevel.id }, {
            route: 'menu-to-play',
            origin: { x: btnX, y: btnY },
          });
        },
      });
    });

    btnZone.on('pointerout', () => {
      primaryBtnContainer.y = btnY;
      primaryBtnContainer.setScale(1);
    });

    primaryBtnContainer.add([btnShadow, btnFace, playIcon, mainBtnText, subBtnText, btnZone]);
    this.primaryButton = primaryBtnContainer;

    // -------------------------------------------------------------
    // 2. NÚT PHỤ: CHỌN MÀN CHƠI (Ice Crystal Glass 3D Button, y=1075)
    // -------------------------------------------------------------
    const secBtnY = 1075;
    const secHeight = 62;
    const secBtnContainer = this.add.container(btnX, secBtnY);

    // Đế đổ bóng 3D tối màu
    const secShadow = this.add.graphics();
    secShadow.fillStyle(0x0e1438, 1.0);
    secShadow.fillRoundedRect(-btnWidth / 2, -secHeight / 2 + 4, btnWidth, secHeight, 22);

    // Mặt kính băng saphire viền ngọc
    const secFace = this.add.graphics();
    secFace.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.92);
    secFace.fillRoundedRect(-btnWidth / 2, -secHeight / 2, btnWidth, secHeight - 3, 22);

    // Lớp tráng gương phía trên
    secFace.fillStyle(0xffffff, 0.16);
    secFace.fillRoundedRect(-btnWidth / 2 + 14, -secHeight / 2 + 4, btnWidth - 28, 14, 7);

    // Viền đôi ngọc băng phát quang
    secFace.lineStyle(2.5, COLOR_NUMBERS.icePrimary, 0.95);
    secFace.strokeRoundedRect(-btnWidth / 2, -secHeight / 2, btnWidth, secHeight - 3, 22);
    secFace.lineStyle(1.0, 0xffffff, 0.45);
    secFace.strokeRoundedRect(-btnWidth / 2 + 4, -secHeight / 2 + 3, btnWidth - 8, secHeight - 9, 18);

    // Icon lưới 4 ô chiêm tinh
    const secIcon = this.add.graphics();
    const iconX = -btnWidth / 2 + 40;
    secIcon.fillStyle(0x7fd8ff, 0.9);
    secIcon.fillRoundedRect(iconX - 10, -10, 8, 8, 2);
    secIcon.fillRoundedRect(iconX + 2, -10, 8, 8, 2);
    secIcon.fillRoundedRect(iconX - 10, 2, 8, 8, 2);
    secIcon.fillRoundedRect(iconX + 2, 2, 8, 8, 2);

    const secBtnText = this.add
      .text(14, 0, t('btn_select_level'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '22px',
        color: '#FFFFFF',
        stroke: '#141C48',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const secBtnZone = this.add
      .zone(0, 0, btnWidth, secHeight)
      .setInteractive({ useHandCursor: true });

    secBtnZone.on('pointerdown', () => {
      playUiCue(this, 'tap');
      secBtnContainer.y = secBtnY + 3;
      secBtnContainer.setScale(0.97);
    });

    secBtnZone.on('pointerup', () => {
      secBtnZone.disableInteractive();
      this.tweens.add({
        targets: secBtnContainer,
        y: secBtnY,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: 'Back.easeOut',
        onComplete: () => {
          director.go(this, 'LevelSelectScene', {}, { route: 'menu-to-map' });
        },
      });
    });

    secBtnZone.on('pointerout', () => {
      secBtnContainer.y = secBtnY;
      secBtnContainer.setScale(1);
    });

    secBtnContainer.add([secShadow, secFace, secIcon, secBtnText, secBtnZone]);
    this.secondaryButton = secBtnContainer;

    // Chân trang phiên bản (y=1240)
    const footerText = this.add
      .text(360, 1240, t('version_footer'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '12px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);
    this.footer = footerText;

    this.uiContainer.add([
      this.langPillContainer,
      this.settingsButton,
      this.titleBlock,
      this.primaryButton,
      this.secondaryButton,
      this.footer,
    ]);
  }

  /**
   * Dựng cụm logo MIRROR phong cách Phương án 2 (Gương Đôi)
   * Có hiệu ứng xuất hiện thả rơi đàn hồi và loop hoạt cảnh trôi / quét sáng
   */
  private buildCasualMirrorLogo(): void {
    if (this.mirrorLogoContainer) {
      this.mirrorLogoContainer.destroy();
    }
    this.letterObjects = [];
    this.mirrorLogoContainer = this.add.container(0, 0);
    this.titleBlock.add(this.mirrorLogoContainer);

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
    for (let i = 0; i < letters.length; i++) {
      const item = letters[i];
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
        .setAlpha(0);
      this.mirrorLogoContainer.add(refText);

      this.tweens.add({
        targets: refText,
        alpha: 0.25,
        duration: 500,
        delay: 250 + i * 50,
        ease: 'Cubic.easeOut',
      });
    }

    // 2. Thanh gương kính cyan (Mirror Bar) ở giữa mở rộng từ tâm
    const barContainer = this.add.container(0, 0);
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
    centerJewel.fillStyle(0xffffff, 0.9);
    centerJewel.fillCircle(360, barY, 2.5);

    barContainer.add([barBg, centerJewel]);
    barContainer.setScale(0, 1);
    this.mirrorLogoContainer.add(barContainer);

    this.tweens.add({
      targets: barContainer,
      scaleX: 1,
      duration: 550,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Flash lấp lánh tại tâm ngọc khi thanh gương bung mở
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1.0);
        const r = 14;
        const inner = r * 0.28;
        const pts = [
          new Phaser.Geom.Point(360, barY - r),
          new Phaser.Geom.Point(360 + inner, barY - inner),
          new Phaser.Geom.Point(360 + r, barY),
          new Phaser.Geom.Point(360 + inner, barY + inner),
          new Phaser.Geom.Point(360, barY + r),
          new Phaser.Geom.Point(360 - inner, barY + inner),
          new Phaser.Geom.Point(360 - r, barY),
          new Phaser.Geom.Point(360 - inner, barY - inner),
        ];
        flash.fillPoints(pts, true);
        this.time.delayedCall(300, () => flash.destroy());
      },
    });

    // 3. Cụm chữ chính MIRROR màu vàng hổ phách thả rơi đàn hồi
    for (let i = 0; i < letters.length; i++) {
      const item = letters[i];
      const x = 360 + item.dx;

      // Lớp bóng đổ đậm (Deep shadow)
      const shadowText = this.add
        .text(x, logoY - 50 + 7, item.char, {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '76px',
          color: '#22145A',
          stroke: '#22145A',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setAngle(0)
        .setAlpha(0);

      // Chữ chính màu vàng có viền tím đậm (Gold face with purple outline)
      const mainText = this.add
        .text(x, logoY - 50, item.char, {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '76px',
          color: '#FFD23F',
          stroke: '#3B2779',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setAngle(0)
        .setAlpha(0);

      this.mirrorLogoContainer.add([shadowText, mainText]);
      this.letterObjects.push({ main: mainText, shadow: shadowText, baseY: logoY });

      // Staggered drop & bounce
      this.tweens.add({
        targets: shadowText,
        y: logoY + 7,
        alpha: 1,
        angle: item.rot,
        duration: 520,
        delay: i * 70,
        ease: 'Back.easeOut',
      });

      this.tweens.add({
        targets: mainText,
        y: logoY,
        alpha: 1,
        angle: item.rot,
        duration: 520,
        delay: i * 70,
        ease: 'Back.easeOut',
      });
    }

    // 4. Hoạt cảnh lặp (Idle Loop Animation)
    // A. Nhấp nhô bồng bềnh
    this.tweens.add({
      targets: this.mirrorLogoContainer,
      y: -4,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // B. Lớp vẽ tia sáng tráng gương lướt qua (Light Sheen Sweep)
    this.logoSheenGraphics = this.add.graphics();
    this.mirrorLogoContainer.add(this.logoSheenGraphics);

    // C. Bộ đếm thời gian lặp tia sáng (mỗi 4.5s)
    this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => this.playLogoSheenSweep(),
    });

    // D. Bộ đếm thời gian nhún nhảy tinh nghịch (mỗi 6.5s)
    this.time.addEvent({
      delay: 6500,
      loop: true,
      callback: () => this.playLetterJiggle(),
    });
  }

  /**
   * Quét tia sáng óng ánh ngang qua chữ MIRROR vàng và thanh gương
   */
  private playLogoSheenSweep(): void {
    if (!this.logoSheenGraphics) return;
    const sweep = { progress: -0.2 };
    this.tweens.add({
      targets: sweep,
      progress: 1.2,
      duration: 650,
      ease: 'Quad.easeInOut',
      onUpdate: () => {
        if (!this.logoSheenGraphics) return;
        this.logoSheenGraphics.clear();
        const curX = Phaser.Math.Linear(120, 600, sweep.progress);
        const yTop = 135;
        const yBottom = 265;

        // Dải sáng nghiêng 30 độ
        this.logoSheenGraphics.fillStyle(0xffffff, 0.4);
        this.logoSheenGraphics.beginPath();
        this.logoSheenGraphics.moveTo(curX - 22, yTop);
        this.logoSheenGraphics.lineTo(curX + 22, yTop);
        this.logoSheenGraphics.lineTo(curX - 10, yBottom);
        this.logoSheenGraphics.lineTo(curX - 54, yBottom);
        this.logoSheenGraphics.closePath();
        this.logoSheenGraphics.fillPath();

        // Lõi sáng rực rỡ
        this.logoSheenGraphics.fillStyle(0xffffff, 0.75);
        this.logoSheenGraphics.beginPath();
        this.logoSheenGraphics.moveTo(curX - 7, yTop);
        this.logoSheenGraphics.lineTo(curX + 7, yTop);
        this.logoSheenGraphics.lineTo(curX - 25, yBottom);
        this.logoSheenGraphics.lineTo(curX - 39, yBottom);
        this.logoSheenGraphics.closePath();
        this.logoSheenGraphics.fillPath();
      },
      onComplete: () => {
        this.logoSheenGraphics?.clear();
      },
    });
  }

  /**
   * Một chữ cái nhún nhảy nhẹ nhàng tạo nét vui tươi casual
   */
  private playLetterJiggle(): void {
    if (this.letterObjects.length === 0) return;
    const targets = [3, 4, 5]; // R, O, R
    const pick = targets[Math.floor(Math.random() * targets.length)];
    const letter = this.letterObjects[pick];
    if (!letter) return;

    this.tweens.add({
      targets: letter.main,
      y: letter.baseY - 10,
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: letter.shadow,
      y: letter.baseY + 7 - 10,
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /**
   * Thiết lập tương tác chạm bụi sao & sóng lượng tử khi người chơi ấn vào bầu trời
   */
  private setupCosmicSkyInteractions(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.spawnCosmicInteraction(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const now = Date.now();
        if (now - this.lastTrailTime > 45) {
          this.lastTrailTime = now;
          this.spawnStardustTrail(pointer.worldX, pointer.worldY);
        }
      }
    });
  }

  /**
   * Tạo chùm bụi sao và sóng lượng tử tỏa ra từ điểm chạm
   */
  private spawnCosmicInteraction(x: number, y: number): void {
    // 1. Sóng lượng tử (Cosmic Ripple) lan tỏa
    const ripple = this.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 4);
    const rippleData = { radius: 8, alpha: 0.85 };
    this.tweens.add({
      targets: rippleData,
      radius: 65,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        ripple.clear();
        ripple.lineStyle(2.5, 0x7fd8ff, rippleData.alpha);
        ripple.strokeCircle(x, y, rippleData.radius);
        ripple.lineStyle(1.2, 0xffffff, rippleData.alpha * 0.7);
        ripple.strokeCircle(x, y, rippleData.radius * 0.7);
      },
      onComplete: () => ripple.destroy(),
    });

    // 2. Chùm 7 hạt bụi sao phát quang bay tỏa ra
    const colors = [0xffd23f, 0x7fd8ff, 0xffffff, 0xffe899];
    for (let i = 0; i < 7; i++) {
      const p = this.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 5);
      const col = colors[i % colors.length];
      const r = 6 + Math.random() * 5;

      p.fillStyle(col, 1.0);
      p.beginPath();
      p.moveTo(0, -r);
      p.lineTo(r * 0.25, -r * 0.25);
      p.lineTo(r, 0);
      p.lineTo(r * 0.25, r * 0.25);
      p.lineTo(0, r);
      p.lineTo(-r * 0.25, r * 0.25);
      p.lineTo(-r, 0);
      p.lineTo(-r * 0.25, -r * 0.25);
      p.closePath();
      p.fillPath();

      p.setPosition(x, y);

      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 65;
      const targetX = x + Math.cos(angle) * dist;
      const targetY = y + Math.sin(angle) * dist;

      this.tweens.add({
        targets: p,
        x: targetX,
        y: targetY,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        rotation: (Math.random() > 0.5 ? 1 : -1) * Math.PI,
        duration: 480 + Math.random() * 250,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  /**
   * Tạo vệt đuôi bụi sao khi người chơi vuốt lướt ngón tay
   */
  private spawnStardustTrail(x: number, y: number): void {
    const p = this.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 5);
    const col = Math.random() > 0.5 ? 0xffd23f : 0x7fd8ff;
    const r = 4 + Math.random() * 3;

    p.fillStyle(col, 0.9);
    p.fillCircle(0, 0, r);
    p.fillStyle(0xffffff, 1.0);
    p.fillCircle(0, 0, r * 0.4);
    p.setPosition(x, y);

    this.tweens.add({
      targets: p,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      y: y + 10,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => p.destroy(),
    });
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

  private transitionParts(): Parts {
    return {
      emblem: this.emblem.graphics(),
      titleBlock: [this.titleBlock],
      primaryButton: [this.primaryButton],
      buttons: [this.primaryButton, this.secondaryButton],
      chrome: [this.titleBlock, this.secondaryButton, this.settingsButton, this.langPillContainer, this.footer],
      corner: [this.settingsButton, this.langPillContainer, this.footer],
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    applySteps(tl, menuIn(ctx.from === 'LevelSelectScene' ? 'map' : 'play'), this.transitionParts(), 'enter');
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (ctx.route === 'menu-to-play') {
      applySteps(tl, MENU_OUT_TO_PLAY, this.transitionParts(), 'exit');
      tl.call(MENU_SPECIAL.spinAtMs, () => this.emblem.setRingSpeed(MENU_SPECIAL.spinPeak));
    } else {
      applySteps(tl, MENU_OUT_TO_MAP, this.transitionParts(), 'exit');
    }
  }

  override update(_time: number, delta: number): void {
    this.emblem.update(delta);
  }
}

import Phaser from 'phaser';
import { TYPO_TOKENS } from './designTokens.ts';
import { applyDesignViewport, designViewBounds } from './designViewport.ts';
import { TextureFactory } from './TextureFactory.ts';
import { director } from './transitions/SceneDirector.ts';

/**
 * Dữ liệu đỉnh đa giác từ studio.svg (Origami Alpaca Solutions)
 * Tọa độ gốc: viewBox 0 0 1254 1254
 * Tâm hình học: (638.5, 625.5)
 */
const STUDIO_POLYGONS = [
  // 1. dark-wing (#3B2779)
  {
    id: 'dark-wing',
    color: 0x3b2779,
    points: [
      [570, 25],
      [769, 140],
      [766, 362],
    ],
  },
  // 2. dark-left (#3B2779)
  {
    id: 'dark-left',
    color: 0x3b2779,
    points: [
      [681, 221],
      [577, 433],
      [484, 487],
      [341, 403],
    ],
  },
  // 3. yellow-top (#FEB801)
  {
    id: 'yellow-top',
    color: 0xfeb801,
    points: [
      [681, 221],
      [410, 287],
      [341, 403],
    ],
  },
  // 4. yellow-sliver (#FEB801)
  {
    id: 'yellow-sliver',
    color: 0xfeb801,
    points: [
      [681, 221],
      [766, 362],
      [670, 526],
    ],
  },
  // 5. mid-small (#523D94)
  {
    id: 'mid-small',
    color: 0x523d94,
    points: [
      [681, 221],
      [670, 526],
      [577, 433],
    ],
  },
  // 6. mid-right (#523D94)
  {
    id: 'mid-right',
    color: 0x523d94,
    points: [
      [766, 362],
      [936, 661],
      [670, 526],
    ],
  },
  // 7. yellow-big (#FEB801)
  {
    id: 'yellow-big',
    color: 0xfeb801,
    points: [
      [670, 526],
      [936, 661],
      [503, 817],
    ],
  },
  // 8. mid-bottom (#523D94)
  {
    id: 'mid-bottom',
    color: 0x523d94,
    points: [
      [936, 661],
      [503, 817],
      [612, 1226],
    ],
  },
] as const;

export class SplashScene extends Phaser.Scene {
  private logoContainer!: Phaser.GameObjects.Container;
  private textContainer!: Phaser.GameObjects.Container;
  private mirrorBar!: Phaser.GameObjects.Container;
  private reflectionText!: Phaser.GameObjects.Text;
  private primaryText!: Phaser.GameObjects.Text;
  private lightSweepGraphics!: Phaser.GameObjects.Graphics;
  private auraGraphics!: Phaser.GameObjects.Graphics;
  private transitionOverlay!: Phaser.GameObjects.Graphics;

  private polygonGraphicsList: Phaser.GameObjects.Graphics[] = [];
  private sparkleGroup: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'SplashScene', active: true });
  }

  create(): void {
    applyDesignViewport(this);
    TextureFactory.generateAll(this);

    const view = designViewBounds(this);
    const centerX = view.width / 2; // 360
    const centerY = view.height / 2; // ~640

    // 1. Nền trắng tinh khôi theo yêu cầu
    const bg = this.add.rectangle(centerX, centerY, view.width, view.height, 0xffffff);
    bg.setDepth(0);

    // Tính toán vị trí theo tỷ lệ màn hình
    const logoY = centerY - 140;
    const textY = centerY + 130;
    const barY = textY + 44;
    const refY = barY + 36;

    // 2. Vầng hào quang ấm áp phía sau logo Studio
    this.auraGraphics = this.add.graphics().setDepth(1);
    this.auraGraphics.fillStyle(0xffe899, 0.4);
    this.auraGraphics.fillCircle(centerX, logoY, 160);
    this.auraGraphics.fillStyle(0xedd9ff, 0.5);
    this.auraGraphics.fillCircle(centerX, logoY, 100);
    this.auraGraphics.setScale(0.5).setAlpha(0);

    // 3. Container chứa Logo Origami Studio
    this.logoContainer = this.add.container(centerX, logoY).setDepth(10);
    this.buildOrigamiLogo();

    // 4. Container chữ Alpaca Solutions & Gương Đôi
    this.textContainer = this.add.container(centerX, textY).setDepth(10);
    this.buildBrandingText(barY - textY, refY - textY);

    // 5. Tia sáng lướt qua (Light Sheen / Sweep)
    this.lightSweepGraphics = this.add.graphics().setDepth(20);

    // 6. Lớp phủ chuyển cảnh điện ảnh (Cinematic Color Morph to Navy)
    this.transitionOverlay = this.add.graphics().setDepth(50);

    // 7. Khởi chạy chuỗi hoạt cảnh sang trọng kéo dài
    this.playCinematicIntroSequence(view);
  }

  /**
   * Dựng từng mảng đa giác Origami của Alpaca Solutions để tạo hiệu ứng gấp nở
   */
  private buildOrigamiLogo(): void {
    const scale = 0.24; // Tỷ lệ co từ 1254x1254 sang ~300px cao
    const origCenterX = 638.5;
    const origCenterY = 625.5;

    // Bóng đổ mờ dưới chân
    const shadow = this.add.graphics();
    shadow.fillStyle(0x22145a, 0.08);
    shadow.fillEllipse(0, 155, 140, 24);
    shadow.setScale(0).setAlpha(0);
    this.logoContainer.add(shadow);
    this.polygonGraphicsList.push(shadow);

    STUDIO_POLYGONS.forEach((poly) => {
      const g = this.add.graphics();
      g.fillStyle(poly.color, 1.0);
      g.lineStyle(1.2, poly.color, 1.0);

      const path: Phaser.Geom.Point[] = poly.points.map(([px, py]) => {
        const x = (px - origCenterX) * scale;
        const y = (py - origCenterY) * scale;
        return new Phaser.Geom.Point(x, y);
      });

      g.fillPoints(path, true);
      g.strokePoints(path, true);

      // Ban đầu thu nhỏ và ẩn
      g.setScale(0.3).setAlpha(0);
      this.logoContainer.add(g);
      this.polygonGraphicsList.push(g);
    });

    // Các ngôi sao 4 cánh lấp lánh xung quanh logo
    const sparkleOffsets = [
      { x: -95, y: -70, scale: 0.8 },
      { x: 105, y: -20, scale: 1.0 },
      { x: -80, y: 80, scale: 0.7 },
      { x: 90, y: 110, scale: 0.85 },
    ];

    for (const sp of sparkleOffsets) {
      const g = this.add.graphics();
      this.drawSparkle(g, 0, 0, 12 * sp.scale, 0xfeb801);
      g.setPosition(sp.x, sp.y);
      g.setScale(0);
      this.logoContainer.add(g);
      this.sparkleGroup.push(g);
    }
  }

  /**
   * Dựng cụm chữ "Alpaca Solutions" kèm thanh gương và bóng phản chiếu lật ngược
   */
  private buildBrandingText(barRelY: number, refRelY: number): void {
    // 1. Bóng phản chiếu lật ngược bên dưới thanh gương (Mirror Reflection)
    this.reflectionText = this.add
      .text(0, refRelY, 'Alpaca Solutions', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '38px',
        color: '#7FD8FF',
        stroke: '#8B6BFF',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScale(1.0, -0.85) // Lật ngược gương chiếu
      .setAlpha(0);

    // 2. Thanh gương cyan ánh kim có đính ngọc ở giữa (Mirror Bar)
    this.mirrorBar = this.add.container(0, barRelY);
    const barGraphics = this.add.graphics();
    const barW = 340;

    // Dải gương màu cyan gradient
    barGraphics.fillStyle(0x7fd8ff, 0.95);
    barGraphics.fillRoundedRect(-barW / 2, -1.5, barW, 3, 1.5);
    barGraphics.fillStyle(0x3b2779, 0.3);
    barGraphics.fillRect(-barW / 2, 1.5, barW, 1);

    // Viên ngọc thoi ở tâm thanh gương
    barGraphics.fillStyle(0xfeb801, 1.0);
    barGraphics.beginPath();
    barGraphics.moveTo(0, -6);
    barGraphics.lineTo(6, 0);
    barGraphics.lineTo(0, 6);
    barGraphics.lineTo(-6, 0);
    barGraphics.closePath();
    barGraphics.fillPath();

    this.mirrorBar.add(barGraphics);
    this.mirrorBar.setScale(0, 1);

    // 3. Chữ "Alpaca Solutions" chính
    this.primaryText = this.add
      .text(0, 0, 'Alpaca Solutions', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '40px',
        color: '#3B2779',
        fontStyle: 'bold',
        stroke: '#FEB801',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.textContainer.add([this.reflectionText, this.mirrorBar, this.primaryText]);
  }

  /**
   * Chuỗi hiệu ứng điện ảnh chuyển động sang trọng kéo dài
   */
  private playCinematicIntroSequence(view: { width: number; height: number }): void {
    // 1. Hào quang nở rộng dịu dàng (0.0s -> 1.2s)
    this.tweens.add({
      targets: this.auraGraphics,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 1200,
      ease: 'Cubic.easeOut',
    });

    // 2. Từng mảnh origami nở ra tuần tự nhịp nhàng (0.1s -> 1.4s)
    this.polygonGraphicsList.forEach((g, idx) => {
      this.tweens.add({
        targets: g,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        duration: 750,
        delay: idx * 110,
        ease: 'Back.easeOut',
      });
    });

    // 3. Chữ "Alpaca Solutions", thanh gương và bóng phản chiếu bung mở (1.1s -> 1.9s)
    this.time.delayedCall(1100, () => {
      this.primaryText.setY(18);
      this.tweens.add({
        targets: this.primaryText,
        y: 0,
        alpha: 1.0,
        duration: 650,
        ease: 'Cubic.easeOut',
      });

      this.tweens.add({
        targets: this.mirrorBar,
        scaleX: 1.0,
        duration: 600,
        ease: 'Cubic.easeOut',
      });

      this.tweens.add({
        targets: this.reflectionText,
        alpha: 0.38,
        duration: 700,
        ease: 'Cubic.easeOut',
      });
    });

    // 4. Vệt sáng óng ánh quét qua & các ngôi sao lóe sáng (1.9s -> 2.7s)
    this.time.delayedCall(1900, () => {
      this.sparkleGroup.forEach((sp, idx) => {
        this.tweens.add({
          targets: sp,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 400,
          delay: idx * 120,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        });
      });

      this.runLightSweep();
    });

    // 5. Hiệu ứng bồng bềnh nhẹ nhàng
    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: this.logoContainer,
        y: this.logoContainer.y - 7,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // 6. Chiêm ngưỡng 1.5 giây sau khi toàn bộ xuất hiện xong (2.7s + 1.5s = 4.2s),
    // sau đó chuyển cảnh điện ảnh sang MenuScene mượt mà
    this.time.delayedCall(4200, () => {
      this.playCinematicTransitionToMenu(view);
    });
  }

  /**
   * Hiệu ứng vệt sáng lướt ngang qua logo & thương hiệu
   */
  private runLightSweep(): void {
    const view = designViewBounds(this);
    const sweep = { progress: -0.3 };

    this.tweens.add({
      targets: sweep,
      progress: 1.3,
      duration: 800,
      ease: 'Quad.easeInOut',
      onUpdate: () => {
        this.lightSweepGraphics.clear();
        const currentX = Phaser.Math.Linear(-100, view.width + 100, sweep.progress);

        // Vệt sáng chéo 30 độ
        this.lightSweepGraphics.fillStyle(0xffffff, 0.45);
        this.lightSweepGraphics.beginPath();
        this.lightSweepGraphics.moveTo(currentX - 25, 0);
        this.lightSweepGraphics.lineTo(currentX + 25, 0);
        this.lightSweepGraphics.lineTo(currentX - 55, view.height);
        this.lightSweepGraphics.lineTo(currentX - 105, view.height);
        this.lightSweepGraphics.closePath();
        this.lightSweepGraphics.fillPath();

        // Lõi sáng rực rỡ ở giữa vệt
        this.lightSweepGraphics.fillStyle(0xffffff, 0.65);
        this.lightSweepGraphics.beginPath();
        this.lightSweepGraphics.moveTo(currentX - 8, 0);
        this.lightSweepGraphics.lineTo(currentX + 8, 0);
        this.lightSweepGraphics.lineTo(currentX - 72, view.height);
        this.lightSweepGraphics.lineTo(currentX - 88, view.height);
        this.lightSweepGraphics.closePath();
        this.lightSweepGraphics.fillPath();
      },
      onComplete: () => {
        this.lightSweepGraphics.clear();
      },
    });
  }

  /**
   * Vẽ ngôi sao 4 cánh phát quang
   */
  private drawSparkle(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    color: number
  ): void {
    g.clear();
    g.fillStyle(color, 1.0);
    g.beginPath();
    g.moveTo(x, y - radius);
    g.lineTo(x + radius * 0.25, y - radius * 0.25);
    g.lineTo(x + radius, y);
    g.lineTo(x + radius * 0.25, y + radius * 0.25);
    g.lineTo(x, y + radius);
    g.lineTo(x - radius * 0.25, y + radius * 0.25);
    g.lineTo(x - radius, y);
    g.lineTo(x - radius * 0.25, y - radius * 0.25);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x, y, radius * 0.2);
  }

  /**
   * Chuyển cảnh điện ảnh mượt mà từ nền trắng sang sắc xanh vũ trụ #1A2470 của Menu
   */
  private playCinematicTransitionToMenu(view: { width: number; height: number }): void {
    // 1. Phủ màu navy vũ trụ (#1A2470) tăng dần độ đậm
    this.transitionOverlay.clear();
    this.transitionOverlay.fillStyle(0x1a2470, 1.0);
    this.transitionOverlay.fillRect(0, 0, view.width, view.height);
    this.transitionOverlay.setAlpha(0);

    // 2. Mờ dần các phần tử logo và chữ hòa vào nền vũ trụ
    this.tweens.add({
      targets: [this.logoContainer, this.textContainer, this.auraGraphics],
      alpha: 0,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 650,
      ease: 'Cubic.easeInOut',
    });

    // 3. Nền navy vũ trụ phủ mượt mà
    this.tweens.add({
      targets: this.transitionOverlay,
      alpha: 1.0,
      duration: 650,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.scene.stop('SplashScene');
        director.boot('MenuScene', {});
      },
    });
  }
}

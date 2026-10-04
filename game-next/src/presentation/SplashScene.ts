import Phaser from 'phaser';
import { COLOR_NUMBERS, TYPO_TOKENS } from './designTokens.ts';
import { applyDesignViewport, designViewBounds } from './designViewport.ts';
import { TextureFactory } from './TextureFactory.ts';

/**
 * Dữ liệu đỉnh đa giác từ studio.svg (Origami Alpaca Solutions)
 * Tọa độ gốc: viewBox 0 0 1254 1254
 * Tâm hình học: (638.5, 625.5)
 */
const STUDIO_POLYGONS = [
  // 1. dark-wing (#3B2779)
  {
    color: 0x3b2779,
    points: [
      [570, 25],
      [769, 140],
      [766, 362],
    ],
  },
  // 2. dark-left (#3B2779)
  {
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
    color: 0xfeb801,
    points: [
      [681, 221],
      [410, 287],
      [341, 403],
    ],
  },
  // 4. yellow-sliver (#FEB801)
  {
    color: 0xfeb801,
    points: [
      [681, 221],
      [766, 362],
      [670, 526],
    ],
  },
  // 5. mid-small (#523D94)
  {
    color: 0x523d94,
    points: [
      [681, 221],
      [670, 526],
      [577, 433],
    ],
  },
  // 6. mid-right (#523D94)
  {
    color: 0x523d94,
    points: [
      [766, 362],
      [936, 661],
      [670, 526],
    ],
  },
  // 7. yellow-big (#FEB801)
  {
    color: 0xfeb801,
    points: [
      [670, 526],
      [936, 661],
      [503, 817],
    ],
  },
  // 8. mid-bottom (#523D94)
  {
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
  private sparkleGroup: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'SplashScene' });
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

    // 2. Vầng hào quang mờ phía sau logo Studio
    const aura = this.add.graphics();
    aura.fillStyle(0xffe899, 0.35);
    aura.fillCircle(centerX, logoY, 150);
    aura.fillStyle(0xedd9ff, 0.45);
    aura.fillCircle(centerX, logoY, 90);
    aura.setDepth(1);

    // Tween nhịp thở cho vầng hào quang
    this.tweens.add({
      targets: aura,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.7,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Container chứa Logo Origami Studio
    this.logoContainer = this.add.container(centerX, logoY).setDepth(10);
    this.buildOrigamiLogo();

    // 4. Container chữ Alpaca Solutions & Gương Đôi
    this.textContainer = this.add.container(centerX, textY).setDepth(10);
    this.buildBrandingText(barY - textY, refY - textY);

    // 5. Tia sáng lướt qua (Light Sheen / Sweep)
    this.lightSweepGraphics = this.add.graphics().setDepth(20);

    // 6. Hiệu ứng chuyển động tuần tự (Animation Timeline)
    this.playIntroSequence();
  }

  /**
   * Dựng các mảng đa giác Origami của Alpaca Solutions từ studio.svg
   */
  private buildOrigamiLogo(): void {
    const scale = 0.24; // Tỷ lệ co từ 1254x1254 sang ~300px cao
    const origCenterX = 638.5;
    const origCenterY = 625.5;

    const logoGraphics = this.add.graphics();

    // Đổ bóng mềm dưới chân origami
    logoGraphics.fillStyle(0x22145a, 0.08);
    logoGraphics.fillEllipse(0, 155, 140, 24);

    for (const poly of STUDIO_POLYGONS) {
      logoGraphics.fillStyle(poly.color, 1.0);
      logoGraphics.lineStyle(1.2, poly.color, 1.0);

      const path: Phaser.Geom.Point[] = poly.points.map(([px, py]) => {
        const x = (px - origCenterX) * scale;
        const y = (py - origCenterY) * scale;
        return new Phaser.Geom.Point(x, y);
      });

      logoGraphics.fillPoints(path, true);
      logoGraphics.strokePoints(path, true);
    }

    // Viền sáng bóng nhẹ trên các cạnh giao nhau
    logoGraphics.lineStyle(1.5, 0xffffff, 0.45);
    logoGraphics.lineBetween(-35, -95, 30, -25);
    logoGraphics.lineBetween(30, -25, -2, 45);

    this.logoContainer.add(logoGraphics);

    // Thêm vài ngôi sao lấp lánh xung quanh logo
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
   * Chuỗi hiệu ứng chuyển động hoàn chỉnh
   */
  private playIntroSequence(): void {
    // Trạng thái ban đầu
    this.logoContainer.setScale(0.5).setAlpha(0);
    this.textContainer.setAlpha(1);

    // 1. Logo origami pop-in đàn hồi (0.0s -> 0.7s)
    this.tweens.add({
      targets: this.logoContainer,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1.0,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Logo lơ lửng nhẹ nhàng sau khi xuất hiện
        this.tweens.add({
          targets: this.logoContainer,
          y: this.logoContainer.y - 6,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // 2. Chữ và thanh gương bung mở (0.4s -> 0.9s)
    this.time.delayedCall(400, () => {
      // Chữ chính trượt nhẹ lên và hiện rõ
      this.primaryText.setY(15);
      this.tweens.add({
        targets: this.primaryText,
        y: 0,
        alpha: 1.0,
        duration: 550,
        ease: 'Cubic.easeOut',
      });

      // Thanh gương mở rộng từ tâm
      this.tweens.add({
        targets: this.mirrorBar,
        scaleX: 1.0,
        duration: 500,
        ease: 'Cubic.easeOut',
      });

      // Bóng phản chiếu hiện ra
      this.tweens.add({
        targets: this.reflectionText,
        alpha: 0.38,
        duration: 600,
        ease: 'Cubic.easeOut',
      });
    });

    // 3. Hiệu ứng tia sáng lướt qua và sao lấp lánh (0.8s -> 1.4s)
    this.time.delayedCall(800, () => {
      // Các ngôi sao lóe sáng
      this.sparkleGroup.forEach((sp, idx) => {
        this.tweens.add({
          targets: sp,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 350,
          delay: idx * 100,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
        });
      });

      // Tia sáng quét qua logo và chữ
      this.runLightSweep();
    });

    // 4. Đúng yêu cầu của user: Sau khi xuất hiện xong hết (khoảng 1.4s),
    // chờ 1.5s rồi tự động chuyển vào MenuScene, không để tap tránh chạm đúp.
    // 1400ms + 1500ms = 2900ms
    this.time.delayedCall(2900, () => {
      this.transitionToMenu();
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
      duration: 650,
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
        this.lightSweepGraphics.fillStyle(0xffffff, 0.6);
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
   * Chuyển cảnh êm ái sang MenuScene
   */
  private transitionToMenu(): void {
    this.cameras.main.fadeOut(450, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }
}

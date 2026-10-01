import Phaser from 'phaser';
import { COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';
import { generateStarField, twinkleAlpha, driftOffset } from './starField.ts';
import type { Star } from './starField.ts';

/**
 * Quầng sáng tròn mờ dần ra mép, dùng gradient thật của canvas 2D.
 * Chuyển từ màu đầy đủ ở tâm về trong suốt ở bán kính `radius`.
 */
export function radialGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hex: string,
  peakAlpha: number
): void {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${peakAlpha})`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

export type SkyBackdropOptions = {
  seed: number;
  /** true cho màn chọn màn: cả lớp sao trôi xuống rồi quấn vòng */
  drift: boolean;
};

/**
 * Nền trời dùng chung cho mọi màn: gradient bốn chặng, hai nebula, quầng
 * trăng, và trường sao.
 *
 * Chia làm ba lớp vì chúng có nhịp khác nhau:
 *  - Lớp trời (gradient, nebula, trăng) không bao giờ đổi -> RenderTexture.
 *  - Lớp sao tĩnh đổi vị trí cả khối khi trôi -> TileSprite, cuộn bằng
 *    tilePositionY nên không phải vẽ lại 120 sao mỗi khung hình.
 *  - Lớp sao nhấp nháy đổi độ sáng từng sao -> Graphics, chỉ 30 sao.
 *
 * Gộp lớp sao vào lớp trời là sai: lúc đó sao không thể trôi, và vì chúng
 * chiếm đa số nên mắt đọc ra nền hoàn toàn tĩnh.
 */
export class SkyBackdrop {
  private readonly scene: Phaser.Scene;
  private readonly options: SkyBackdropOptions;
  private readonly skyLayer: Phaser.GameObjects.RenderTexture;
  private readonly starLayer: Phaser.GameObjects.TileSprite;
  private readonly twinkleLayer: Phaser.GameObjects.Graphics;
  private readonly twinklingStars: Star[];
  private readonly staticStars: Star[];
  private readonly starTextureKey: string;
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, options: SkyBackdropOptions) {
    this.scene = scene;
    this.options = options;

    const { width, height } = LAYOUT_TOKENS.canvas;
    const field = generateStarField(options.seed, { width, height });
    this.staticStars = field.static;
    this.twinklingStars = field.twinkling;
    this.starTextureKey = `sky_stars_${options.seed}`;

    this.skyLayer = scene.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.backgroundSky);

    this.paintSky(width, height);
    this.buildStarTexture(width, height);

    this.starLayer = scene.add
      .tileSprite(0, 0, width, height, this.starTextureKey)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.backgroundSky + 1);

    this.twinkleLayer = scene.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 2);
  }

  /**
   * Gradient trời, hai nebula và quầng trăng — phần không bao giờ đổi.
   *
   * Dựng bằng canvas 2D vì nó có gradient thật. Trước đây xấp xỉ bằng các dải
   * ngang và vòng tròn đồng tâm, và mắt thấy rõ từng vòng (banding).
   */
  private paintSky(width: number, height: number): void {
    const key = `sky_base_${width}x${height}`;
    const tm = this.scene.textures;
    if (!tm.exists(key)) {
      const canvas = tm.createCanvas(key, width, height);
      if (canvas) {
        const ctx = canvas.context;

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        COLOR_TOKENS.sky.stops.forEach((stop, i) => {
          sky.addColorStop(COLOR_TOKENS.sky.stopOffsets[i], stop);
        });
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // Toạ độ theo mockup 390x844, quy đổi sang canvas 720x1280
        radialGlow(ctx, 108, 436, 396, COLOR_TOKENS.sky.nebulaBlue, 0.45);
        radialGlow(ctx, 648, 966, 360, COLOR_TOKENS.sky.nebulaPink, 0.32);
        radialGlow(ctx, 619, 140, 158, COLOR_TOKENS.sky.moonHalo, 0.35);
        radialGlow(ctx, 619, 140, 62, COLOR_TOKENS.sky.moonCore, 0.9);

        canvas.refresh();
      }
    }
    this.skyLayer.draw(key, 0, 0);
  }

  /**
   * Nướng 120 sao tĩnh thành một texture để TileSprite cuộn được cả khối.
   * Texture lặp theo chiều dọc nên sao phải phủ đều, không chừa dải trống.
   */
  private buildStarTexture(width: number, height: number): void {
    if (this.scene.textures.exists(this.starTextureKey)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    for (const star of this.staticStars) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(star.color).color, star.alpha);
      g.fillCircle(star.x, star.y, star.r);
    }
    g.generateTexture(this.starTextureKey, width, height);
    g.destroy();
  }


  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const { height } = LAYOUT_TOKENS.canvas;

    if (this.options.drift) {
      // tilePositionY âm dần thì texture đi xuống, tức sao rơi xuống.
      this.starLayer.tilePositionY = -driftOffset(this.elapsedMs, height);
    }

    this.twinkleLayer.clear();
    for (const star of this.twinklingStars) {
      const y = this.options.drift
        ? (star.y + driftOffset(this.elapsedMs, height)) % height
        : star.y;
      const alpha = twinkleAlpha(star, this.elapsedMs);
      this.twinkleLayer.fillStyle(
        Phaser.Display.Color.HexStringToColor(star.color).color,
        alpha
      );
      this.twinkleLayer.fillCircle(star.x, y, star.r);
    }
  }

  public destroy(): void {
    this.skyLayer.destroy();
    this.starLayer.destroy();
    this.twinkleLayer.destroy();
    if (this.scene.textures.exists(this.starTextureKey)) {
      this.scene.textures.remove(this.starTextureKey);
    }
  }
}

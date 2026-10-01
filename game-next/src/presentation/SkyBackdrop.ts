import Phaser from 'phaser';
import { COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';
import { generateStarField, twinkleAlpha, driftOffset } from './starField.ts';
import type { Star } from './starField.ts';

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

  /** Gradient trời, hai nebula và quầng trăng — phần không bao giờ đổi. */
  private paintSky(width: number, height: number): void {
    const g = this.scene.add.graphics();

    // Phaser Graphics không có gradient fill, nên xấp xỉ bằng các dải ngang
    // nội suy giữa bốn chặng màu.
    const stops = COLOR_TOKENS.sky.stops.map((hex) =>
      Phaser.Display.Color.HexStringToColor(hex)
    );
    const offsets = COLOR_TOKENS.sky.stopOffsets;
    const bandCount = 128;
    for (let i = 0; i < bandCount; i++) {
      const t = i / (bandCount - 1);
      let segment = 0;
      while (segment < offsets.length - 2 && t > offsets[segment + 1]) segment++;
      const localT =
        (t - offsets[segment]) / (offsets[segment + 1] - offsets[segment] || 1);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        stops[segment],
        stops[segment + 1],
        100,
        Math.round(Math.max(0, Math.min(1, localT)) * 100)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, (height / bandCount) * i, width, height / bandCount + 1);
    }

    // Xấp xỉ radial gradient bằng các vòng tròn đồng tâm giảm dần độ mờ.
    this.paintGlow(g, 108, 436, 396, COLOR_TOKENS.sky.nebulaBlue, 0.45);
    this.paintGlow(g, 648, 966, 360, COLOR_TOKENS.sky.nebulaPink, 0.32);
    this.paintGlow(g, 619, 140, 158, COLOR_TOKENS.sky.moonHalo, 0.35);
    this.paintGlow(g, 619, 140, 62, COLOR_TOKENS.sky.moonCore, 0.9);

    this.skyLayer.draw(g);
    g.destroy();
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

  private paintGlow(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    hex: string,
    peakAlpha: number
  ): void {
    const color = Phaser.Display.Color.HexStringToColor(hex).color;
    const rings = 24;
    for (let i = rings; i > 0; i--) {
      const t = i / rings;
      g.fillStyle(color, peakAlpha * (1 - t) ** 2);
      g.fillCircle(cx, cy, radius * t);
    }
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

import Phaser from 'phaser';
import { COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';
import { generateStarField, twinkleAlpha, advanceDrift } from './starField.ts';
import type { Star } from './starField.ts';

export type SkyBackdropOptions = {
  seed: number;
  /** true cho màn chọn màn: sao trôi xuống rồi quấn vòng */
  drift: boolean;
};

/**
 * Nền trời dùng chung cho mọi màn: gradient bốn chặng, hai nebula, quầng
 * trăng, và trường sao.
 *
 * Phần tĩnh vẽ một lần vào RenderTexture. Chỉ 30 sao nhấp nháy là vẽ lại mỗi
 * khung hình — vẽ lại cả 150 sao mỗi frame là chi phí không cần thiết.
 */
export class SkyBackdrop {
  private readonly scene: Phaser.Scene;
  private readonly options: SkyBackdropOptions;
  private readonly staticLayer: Phaser.GameObjects.RenderTexture;
  private readonly twinkleLayer: Phaser.GameObjects.Graphics;
  private readonly twinklingStars: Star[];
  private readonly staticStars: Star[];
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, options: SkyBackdropOptions) {
    this.scene = scene;
    this.options = options;

    const { width, height } = LAYOUT_TOKENS.canvas;
    const field = generateStarField(options.seed, { width, height });
    this.staticStars = field.static;
    this.twinklingStars = field.twinkling;

    this.staticLayer = scene.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.backgroundSky);

    this.twinkleLayer = scene.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 1);

    this.paintStatic();
  }

  private paintStatic(): void {
    const { width, height } = LAYOUT_TOKENS.canvas;
    const g = this.scene.add.graphics();

    // Gradient trời: Phaser Graphics không có gradient fill, nên xấp xỉ bằng
    // các dải ngang nội suy giữa bốn chặng màu.
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

    // Hai nebula và quầng trăng: xấp xỉ radial gradient bằng các vòng tròn
    // đồng tâm giảm dần độ mờ.
    this.paintGlow(g, 108, 436, 396, COLOR_TOKENS.sky.nebulaBlue, 0.45);
    this.paintGlow(g, 648, 966, 360, COLOR_TOKENS.sky.nebulaPink, 0.32);
    this.paintGlow(g, 619, 140, 158, COLOR_TOKENS.sky.moonHalo, 0.35);
    this.paintGlow(g, 619, 140, 62, COLOR_TOKENS.sky.moonCore, 0.9);

    for (const star of this.staticStars) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(star.color).color, star.alpha);
      g.fillCircle(star.x, star.y, star.r);
    }

    this.staticLayer.draw(g);
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

    this.twinkleLayer.clear();
    for (const star of this.twinklingStars) {
      if (this.options.drift) {
        star.y = advanceDrift(star, deltaMs, height);
      }
      const alpha = twinkleAlpha(star, this.elapsedMs);
      this.twinkleLayer.fillStyle(
        Phaser.Display.Color.HexStringToColor(star.color).color,
        alpha
      );
      this.twinkleLayer.fillCircle(star.x, star.y, star.r);
    }
  }

  public destroy(): void {
    this.staticLayer.destroy();
    this.twinkleLayer.destroy();
  }
}

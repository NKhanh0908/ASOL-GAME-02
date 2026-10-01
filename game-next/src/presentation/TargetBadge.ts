import Phaser from 'phaser';
import type { Level } from '../domain/model.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
import type { LayoutMetrics } from './layout.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS } from './designTokens.ts';

export class TargetBadge {
  private container: Phaser.GameObjects.Container;
  private badgeGraphics: Phaser.GameObjects.Graphics;
  private targetGraphics: Phaser.GameObjects.Graphics;
  private isEnlarged = false;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics, level: Level) {
    // Tâm huy hiệu: chồng một phần lên mép trên bàn (y=200) như mockup, nhưng
    // đỉnh huy hiệu phải nằm dưới phụ đề chương (y≈86) — trước đây đè lên nó.
    const cx = 360;
    const cy = 178;

    this.container = scene.add.container(cx, cy).setDepth(DEPTH_TOKENS.hudControls + 5);
    this.badgeGraphics = scene.add.graphics();
    this.targetGraphics = scene.add.graphics();
    this.container.add([this.badgeGraphics, this.targetGraphics]);

    this.drawBadgeBase();
    this.drawTargetSilhouette(level);

    // Vùng chạm hình tròn bán kính 76px
    this.container.setSize(152, 152);
    this.container.setInteractive(
      new Phaser.Geom.Circle(0, 0, 76),
      Phaser.Geom.Circle.Contains
    );

    // Chạm vào phóng to tạm thời (1.35x) để soi rõ mục tiêu
    this.container.on('pointerdown', () => {
      this.animateZoom(scene);
    });
  }

  private drawBadgeBase(): void {
    const g = this.badgeGraphics;
    g.clear();

    const r = 76;

    // 1. Quầng sáng mềm bên ngoài
    g.lineStyle(4, COLOR_NUMBERS.icePrimary, 0.2);
    g.strokeCircle(0, 0, r + 2);

    // 2. Lòng huy hiệu xanh như mặt bàn, sáng dần lên phía trên-trái — mockup
    // dùng kính xanh, không phải hố đen.
    g.fillStyle(COLOR_NUMBERS.buttonFillBottom, 1);
    g.fillCircle(0, 0, r);
    g.fillStyle(COLOR_NUMBERS.buttonFillTop, 0.55);
    g.fillCircle(-r * 0.15, -r * 0.2, r * 0.72);
    g.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.5);
    g.fillCircle(0, 0, r * 0.86);

    // 3. Viền kính xanh 6px có bevel
    g.lineStyle(6, COLOR_NUMBERS.icePrimary, 0.95);
    g.strokeCircle(0, 0, r - 3);

    // Highlight cạnh trên
    g.lineStyle(2.5, COLOR_NUMBERS.iceHighlight, 0.9);
    g.beginPath();
    g.arc(0, 0, r - 3, Math.PI * 1.1, Math.PI * 1.9);
    g.strokePath();

    // Rãnh bóng tối cạnh dưới
    g.lineStyle(2.5, COLOR_NUMBERS.iceShadow, 0.85);
    g.beginPath();
    g.arc(0, 0, r - 3, Math.PI * 0.1, Math.PI * 0.9);
    g.strokePath();

    // 4. Vòng vàng đứt nét bên trong (bán kính 75px)
    const ringR = 63;
    g.lineStyle(1.5, COLOR_NUMBERS.gridModule, 0.55);
    const numDashes = 28;
    for (let i = 0; i < numDashes; i++) {
      const startA = (i / numDashes) * Math.PI * 2;
      const endA = startA + (Math.PI * 2) / (numDashes * 2);
      g.beginPath();
      g.arc(0, 0, ringR, startA, endA);
      g.strokePath();
    }

    // 5. 4 vạch rune nhỏ ở 4 hướng chính (0°, 90°, 180°, 270°)
    g.fillStyle(COLOR_NUMBERS.amberSolid, 0.9);
    // Bắc
    this.drawMiniDiamond(g, 0, -ringR, 3, 5);
    // Nam
    this.drawMiniDiamond(g, 0, ringR, 3, 5);
    // Đông
    this.drawMiniDiamond(g, ringR, 0, 5, 3);
    // Tây
    this.drawMiniDiamond(g, -ringR, 0, 5, 3);
  }

  private drawMiniDiamond(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    rx: number,
    ry: number
  ): void {
    const pts = [
      new Phaser.Geom.Point(x, y - ry),
      new Phaser.Geom.Point(x + rx, y),
      new Phaser.Geom.Point(x, y + ry),
      new Phaser.Geom.Point(x - rx, y),
    ];
    g.fillPoints(pts, true);
  }

  private drawTargetSilhouette(level: Level): void {
    const g = this.targetGraphics;
    g.clear();

    // Tìm bounding box của targetMask
    let minX = GRID_WIDTH;
    let maxX = 0;
    let minY = GRID_HEIGHT;
    let maxY = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (level.targetMask[y * GRID_WIDTH + x] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY) return;

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Hình mục tiêu phải nằm gọn trong vòng vàng (bán kính 63px)
    const scale = Math.min(92 / w, 64 / h);

    // Màn toàn hình thoi: vẽ vector sắc nét thay vì tô từng ô của mask. Tâm
    // và bán kính suy ra từ neo A của từng mảnh — viết cứng thì sai ngay khi
    // frameSize đổi (đã xảy ra khi mảnh đổi từ 40 sang 48 ô).
    if (level.pieces.every((p) => p.cells.length > 0) && level.id === '1-1') {
      for (const piece of level.pieces) {
        const anchor = piece.anchors.find((a) => a.id === 'A') ?? piece.anchors[0];
        const half = piece.frameSize / 2;
        this.drawSolidDiamond(
          g,
          (anchor.x + half - centerX) * scale,
          (anchor.y + half - centerY) * scale,
          half * scale
        );
      }
      return;
    }

    // Với các level khác: render từ targetMask
    g.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    const pixelSize = Math.max(1, Math.round(scale));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (level.targetMask[y * GRID_WIDTH + x] > 0) {
          const drawX = (x - centerX) * scale;
          const drawY = (y - centerY) * scale;
          g.fillRect(drawX, drawY, pixelSize, pixelSize);
        }
      }
    }
  }

  private drawSolidDiamond(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number
  ): void {
    const pts = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r, cy),
    ];

    // Thân vàng đặc
    g.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
    g.fillPoints(pts, true);

    // Viền vàng sáng lấp lánh 1.5px
    g.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.9);
    g.strokePoints(pts, true);

    // Gân tinh thể trung tâm mờ
    g.lineStyle(1, COLOR_NUMBERS.amberGlow, 0.35);
    g.lineBetween(cx, cy - r, cx, cy + r);
    g.lineBetween(cx - r, cy, cx + r, cy);
  }

  private animateZoom(scene: Phaser.Scene): void {
    if (this.isEnlarged) return;
    this.isEnlarged = true;

    scene.tweens.add({
      targets: this.container,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(900, () => {
          scene.tweens.add({
            targets: this.container,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.isEnlarged = false;
            },
          });
        });
      },
    });
  }

  public destroy(): void {
    this.container.destroy();
  }
}

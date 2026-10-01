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
    // Tọa độ tâm huy hiệu: x=360, y=168 (chồng ~41% lên mép trên của tấm bia tại y=184)
    const cx = 360;
    const cy = 168;

    this.container = scene.add.container(cx, cy).setDepth(DEPTH_TOKENS.hudControls + 5);
    this.badgeGraphics = scene.add.graphics();
    this.targetGraphics = scene.add.graphics();
    this.container.add([this.badgeGraphics, this.targetGraphics]);

    this.drawBadgeBase();
    this.drawTargetSilhouette(level);

    // Vùng chạm hình tròn đường kính 180px (bán kính 90px)
    this.container.setSize(180, 180);
    this.container.setInteractive(
      new Phaser.Geom.Circle(0, 0, 90),
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

    const r = 90;

    // 1. Quầng sáng mềm bên ngoài
    g.lineStyle(4, COLOR_NUMBERS.icePrimary, 0.2);
    g.strokeCircle(0, 0, r + 2);

    // 2. Nền tròn vũ trụ tối sâu #050A1A
    g.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.98);
    g.fillCircle(0, 0, r);

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
    const ringR = 75;
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

    // Scale để hình mục tiêu chiếm khoảng 100x60px ở giữa huy hiệu
    const scale = Math.min(106 / w, 76 / h);

    // Với level 1-1: hai hình thoi tiếp giáp đỉnh
    // Vẽ trực tiếp vector diamond sắc nét
    if (level.id === '1-1') {
      const diamondRadius = 20 * scale; // ~26.5px
      const leftCenter = (44 - centerX) * scale;
      const rightCenter = (84 - centerX) * scale;

      this.drawSolidDiamond(g, leftCenter, 0, diamondRadius);
      this.drawSolidDiamond(g, rightCenter, 0, diamondRadius);
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

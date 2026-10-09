import Phaser from 'phaser';
import { isReducedMotion, getMotionScale } from '../transitions/motion.ts';
import {
  CLUSTER_CENTER_HALF, CLUSTER_SATELLITES, CLUSTER_SATELLITE_HALF, PINWHEEL, PRISM_COLORS, REFRESH_ARROW,
  RING_CENTER_HALF, RING_CENTER_ROTATION_DEG, pinwheelFaces, pinwheelOutline,
  type HeroKind, type Pt,
} from './chapterHeroGeometry.ts';

const toPoints = (pts: readonly Pt[], dx = 0, dy = 0) => pts.map(([x, y]) => new Phaser.Geom.Point(x + dx, y + dy));

/**
 * Hero emblem for the Menu3 (ring) and Menu4 (cluster) mockups, plus a placeholder prism glyph for chapter VI.
 * Drawn once in mockup units; the caller scales it by 720/390 like the chapter I hero.
 */
export class ChapterHeroEmblem {
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly sparkle: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private ringSpeed = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: HeroKind, accent: number) {
    this.body = scene.add.graphics().setPosition(x, y);
    this.sparkle = scene.add.graphics().setPosition(x, y);
    this.ring = scene.add.graphics().setPosition(x, y);
    this.drawDisc(accent);
    if (kind === 'ring') this.drawRing(accent);
    else if (kind === 'cluster') this.drawCluster(accent);
    else this.drawPrism();
    this.ring.lineStyle(1.2, accent, 0.45);
    const dashes = Math.round((2 * Math.PI * 132) / 10);
    for (let i = 0; i < dashes; i++) {
      const a = (i / dashes) * Math.PI * 2;
      this.ring.beginPath();
      this.ring.arc(0, 0, 132, a, a + 2 / 132);
      this.ring.strokePath();
    }
  }

  graphics(): Phaser.GameObjects.Graphics[] {
    return [this.body, this.sparkle, this.ring];
  }

  setRingSpeed(speed: number): void {
    this.ringSpeed = speed;
  }

  /** The dotted ring turns once per 4 minutes (kit `spin` 240 s); everything else is static. */
  update(deltaMs: number): void {
    if (isReducedMotion()) return;
    this.ring.rotation += ((2 * Math.PI) / 240000) * deltaMs * this.ringSpeed * getMotionScale();
  }

  private drawDisc(accent: number): void {
    const g = this.body;
    g.fillStyle(accent, 0.1);
    g.fillCircle(0, 0, 118);
    g.lineStyle(1.5, accent, 0.55);
    g.strokeCircle(0, 0, 118);
    for (let i = 0; i < 8; i++) { // stands in for the mockup's blurred r=70 glow
      g.fillStyle(accent, 0.055);
      g.fillCircle(0, 0, 40 + i * 8);
    }
  }

  private drawPinwheel(cx: number, cy: number, half: number, rotationDeg = 0): void {
    const g = this.body;
    for (const face of pinwheelFaces(half, rotationDeg)) {
      g.fillStyle(face.color, 1);
      g.fillPoints(toPoints(face.points, cx, cy), true);
    }
    g.lineStyle(2.5, PINWHEEL.outline, 1);
    g.strokePoints(toPoints(pinwheelOutline(half, rotationDeg), cx, cy), true);
  }

  private drawRing(accent: number): void {
    const g = this.body;
    g.lineStyle(5, accent, 1);
    g.beginPath();
    g.arc(0, 0, REFRESH_ARROW.radius, REFRESH_ARROW.startAngle, REFRESH_ARROW.endAngle, false);
    g.strokePath();
    g.fillStyle(accent, 1);
    g.fillPoints(toPoints(REFRESH_ARROW.head), true);
    this.drawPinwheel(0, 0, RING_CENTER_HALF, RING_CENTER_ROTATION_DEG);
  }

  private drawCluster(accent: number): void {
    const g = this.body;
    g.lineStyle(2, accent, 0.8);
    for (const [sx, sy] of CLUSTER_SATELLITES) { // dash 2 / gap 6 along each link
      const length = Math.hypot(sx, sy);
      for (let d = 0; d < length; d += 8) {
        const t0 = d / length;
        const t1 = Math.min(1, (d + 2) / length);
        g.lineBetween(sx * (1 - t0), sy * (1 - t0), sx * (1 - t1), sy * (1 - t1));
      }
    }
    for (const [sx, sy] of CLUSTER_SATELLITES) this.drawPinwheel(sx, sy, CLUSTER_SATELLITE_HALF);
    this.drawPinwheel(0, 0, CLUSTER_CENTER_HALF);
  }

  /** Placeholder for chapter VI (no Menu mockup yet): the kit's prism triangle with a seven-colour fan. */
  private drawPrism(): void {
    const g = this.body;
    PRISM_COLORS.forEach((color, i) => {
      const angle = ((i - 3) * 9 * Math.PI) / 180;
      g.lineStyle(5, color, 0.85);
      g.lineBetween(28, 8, 28 + Math.cos(angle) * 78, 8 + Math.sin(angle) * 78);
    });
    g.fillStyle(0xddf6ff, 0.35);
    g.fillTriangle(0, -52, 50, 34, -50, 34);
    g.lineStyle(2.5, 0xffffff, 1);
    g.strokeTriangle(0, -52, 50, 34, -50, 34);
  }
}

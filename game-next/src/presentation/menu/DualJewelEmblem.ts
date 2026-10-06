import Phaser from 'phaser';
import { COLOR_NUMBERS, glowTier } from '../designTokens.ts';
import { jewelOutline } from '../jewelGeometry.ts';
import { getMotionScale, isReducedMotion } from '../transitions/motion.ts';
import {
  emblemOffsetAt,
  emblemOverlap,
  emblemStarAlpha,
  nextElapsed,
} from './dualJewelGeometry.ts';

const JEWEL_RADIUS = 68;
const ORBIT_RADIUS = 150;

export class DualJewelEmblem {
  private readonly emblemGraphics: Phaser.GameObjects.Graphics;
  private readonly sparkleGraphics: Phaser.GameObjects.Graphics;
  private elapsedMs = 0;
  private ringAngle1 = 0;
  private ringAngle2 = 0;
  private ringSpeed = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.emblemGraphics = scene.add.graphics().setPosition(x, y);
    this.sparkleGraphics = scene.add.graphics().setPosition(x, y);
  }

  graphics(): Phaser.GameObjects.Graphics[] {
    return [this.emblemGraphics, this.sparkleGraphics];
  }

  setRingSpeed(speed: number): void {
    this.ringSpeed = speed;
  }

  update(deltaMs: number): void {
    // Reduced Motion holds the taught pose rather than switching the lesson
    // off: the overlap and its star stay on screen, nothing moves.
    const reduced = isReducedMotion();
    this.elapsedMs = nextElapsed(this.elapsedMs, deltaMs, reduced);
    if (!reduced) {
      const spin = this.ringSpeed * getMotionScale();
      this.ringAngle1 += deltaMs * 0.0003 * spin;
      this.ringAngle2 -= deltaMs * 0.0002 * spin;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.emblemGraphics;
    const s = this.sparkleGraphics;
    g.clear();
    s.clear();

    const offset = emblemOffsetAt(this.elapsedMs);

    // Tier 1: the orbit is structure, not an invitation.
    const ring = glowTier(1);
    g.lineStyle(1.2, COLOR_NUMBERS.icePrimary, ring.alpha);
    g.strokeCircle(0, 0, ORBIT_RADIUS);
    this.drawOrbitDust(g);

    // Both jewels, then the overlap punched out in sky navy.
    for (const cx of [-offset, offset]) {
      g.fillStyle(COLOR_NUMBERS.amberSolid, 1);
      g.fillPoints(jewelOutline(cx, 0, JEWEL_RADIUS).map((p) => new Phaser.Geom.Point(p.x, p.y)), true);
    }

    const overlap = emblemOverlap(offset, JEWEL_RADIUS);
    if (overlap.length >= 3) {
      g.fillStyle(COLOR_NUMBERS.skyBottom, 1);
      g.fillPoints(overlap.map((p) => new Phaser.Geom.Point(p.x, p.y)), true);

      const alpha = emblemStarAlpha(this.elapsedMs);
      if (alpha > 0) this.drawStar(s, 0, 0, 14, alpha);
    }
  }

  private drawOrbitDust(g: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < 4; i++) {
      const a = this.ringAngle1 + (i * Math.PI) / 2;
      g.fillStyle(COLOR_NUMBERS.textSecondary, 0.6);
      g.fillCircle(Math.cos(a) * ORBIT_RADIUS, Math.sin(a) * ORBIT_RADIUS, 3);
    }
    for (let i = 0; i < 4; i++) {
      const a = this.ringAngle2 + (i * Math.PI) / 2 + Math.PI / 4;
      g.fillStyle(COLOR_NUMBERS.gridModule, 0.5);
      g.fillCircle(Math.cos(a) * 125, Math.sin(a) * 125, 2.5);
    }
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    alpha: number
  ): void {
    g.fillStyle(0xffffff, alpha);
    const pts = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r * 0.28, cy - r * 0.28),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx + r * 0.28, cy + r * 0.28),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r * 0.28, cy + r * 0.28),
      new Phaser.Geom.Point(cx - r, cy),
      new Phaser.Geom.Point(cx - r * 0.28, cy - r * 0.28),
    ];
    g.fillPoints(pts, true);
  }
}

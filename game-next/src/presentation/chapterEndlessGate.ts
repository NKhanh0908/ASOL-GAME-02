import Phaser from 'phaser';
import type { GalaxyTheme } from './galaxyTheme.ts';
import { TYPO_TOKENS } from './designTokens.ts';
import { isReducedMotion } from './transitions/motion.ts';

export interface ChapterEndlessGateConfig {
  x: number;
  y: number;
  theme: GalaxyTheme;
}

/**
 * ChapterEndlessGate: Cổng vũ trụ Ải Vô Tận ở cuối mỗi chặng chương
 * Chuẩn mockup: GalaxyMap.dc.html
 * - 2 vòng tròn đứt nét quay ngược chiều nhau (portalA, portalB)
 * - Quầng sáng thở phồng xẹp (breath)
 * - Nhãn viên thuốc kính "Ải Vô Tận · Sắp mở"
 */
export class ChapterEndlessGate extends Phaser.GameObjects.Container {
  private portalOuterGlow: Phaser.GameObjects.Graphics;
  private ringA: Phaser.GameObjects.Graphics;
  private ringB: Phaser.GameObjects.Graphics;
  private coreIcon: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private badgeContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: ChapterEndlessGateConfig) {
    super(scene, config.x, config.y);

    const accentColor = config.theme.colors.accent;

    // 1. Quầng sáng thở (Breathing outer glow)
    this.portalOuterGlow = scene.add.graphics();
    this.portalOuterGlow.fillStyle(accentColor, 0.35);
    this.portalOuterGlow.fillCircle(0, 0, 40);
    this.add(this.portalOuterGlow);

    // Hiệu ứng thở (breath)
    if (!isReducedMotion()) scene.tweens.add({
      targets: this.portalOuterGlow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.5,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Lõi tối trung tâm
    const coreDark = scene.add.graphics();
    coreDark.fillStyle(0x120e36, 0.85);
    coreDark.fillCircle(0, 0, 33);
    this.add(coreDark);

    // 3. Vòng tròn đứt A (portalA: bán kính 33, xoay cùng chiều kim đồng hồ)
    this.ringA = scene.add.graphics();
    this.ringA.lineStyle(3, accentColor, 0.95);
    // Vẽ nét đứt theo cung tròn
    const segmentsA = 10;
    for (let i = 0; i < segmentsA; i++) {
      const startAngle = (i / segmentsA) * Math.PI * 2;
      const endAngle = startAngle + (Math.PI * 2) / (segmentsA * 1.8);
      this.ringA.beginPath();
      this.ringA.arc(0, 0, 33, startAngle, endAngle);
      this.ringA.strokePath();
    }
    this.add(this.ringA);

    if (!isReducedMotion()) scene.tweens.add({
      targets: this.ringA,
      angle: 360,
      duration: 12000,
      repeat: -1,
      ease: 'Linear',
    });

    // 4. Vòng tròn đứt B (portalB: bán kính 25, xoay ngược chiều)
    this.ringB = scene.add.graphics();
    this.ringB.lineStyle(1.8, 0xffffff, 0.7);
    const segmentsB = 8;
    for (let i = 0; i < segmentsB; i++) {
      const startAngle = (i / segmentsB) * Math.PI * 2;
      const endAngle = startAngle + (Math.PI * 2) / (segmentsB * 2.2);
      this.ringB.beginPath();
      this.ringB.arc(0, 0, 25, startAngle, endAngle);
      this.ringB.strokePath();
    }
    this.add(this.ringB);

    if (!isReducedMotion()) scene.tweens.add({
      targets: this.ringB,
      angle: -360,
      duration: 18000,
      repeat: -1,
      ease: 'Linear',
    });

    // 5. Biểu tượng vô cực / lốc xoáy trung tâm (Infinity sign)
    this.coreIcon = scene.add.graphics();
    this.coreIcon.lineStyle(3.2, 0xffffff, 1.0);
    // Lemniscate của mockup: M-12,0 C-12,-8 -2,-8 0,0 C2,8 12,8 12,0 C12,-8 2,-8 0,0 C-2,8 -12,8 -12,0
    const loop = (pts: ReadonlyArray<readonly [number, number]>): Phaser.Math.Vector2[] =>
      new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(pts[0][0], pts[0][1]),
        new Phaser.Math.Vector2(pts[1][0], pts[1][1]),
        new Phaser.Math.Vector2(pts[2][0], pts[2][1]),
        new Phaser.Math.Vector2(pts[3][0], pts[3][1])
      ).getPoints(14);
    const outline = [
      ...loop([[-12, 0], [-12, -8], [-2, -8], [0, 0]]),
      ...loop([[0, 0], [2, 8], [12, 8], [12, 0]]),
      ...loop([[12, 0], [12, -8], [2, -8], [0, 0]]),
      ...loop([[0, 0], [-2, 8], [-12, 8], [-12, 0]]),
    ];
    this.coreIcon.strokePoints(outline, true);
    this.add(this.coreIcon);

    // 6. Tiêu đề "Ải Vô Tận" (y = 52)
    this.labelText = scene.add
      .text(0, 52, 'Ải Vô Tận', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#120E36',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.add(this.labelText);

    // 7. Nhãn viên thuốc "Sắp mở" (y = 70)
    this.badgeContainer = scene.add.container(0, 70);
    const tagBg = scene.add.graphics();
    tagBg.fillStyle(accentColor, 0.25);
    tagBg.fillRoundedRect(-28, -9, 56, 18, 9);
    tagBg.lineStyle(1, accentColor, 0.9);
    tagBg.strokeRoundedRect(-28, -9, 56, 18, 9);

    const tagText = scene.add
      .text(0, 0, 'Sắp mở', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '10px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.badgeContainer.add([tagBg, tagText]);
    this.add(this.badgeContainer);

    scene.add.existing(this);
  }
}

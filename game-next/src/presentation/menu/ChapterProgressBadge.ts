import Phaser from 'phaser';
import type { GalaxyTheme } from '../galaxyTheme.ts';
import { TYPO_TOKENS } from '../designTokens.ts';

export interface ChapterProgressBadgeConfig {
  x: number;
  y: number;
  theme: GalaxyTheme;
  completedCount: number;
}

/**
 * ChapterProgressBadge: Hiển thị viên thuốc kính tên chương và thanh tiến độ 7 nấc
 * Chuẩn mockup: Menu1.dc.html & Menu2.dc.html
 */
export class ChapterProgressBadge extends Phaser.GameObjects.Container {
  private badgeBg: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private progressBars: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: ChapterProgressBadgeConfig) {
    super(scene, config.x, config.y);

    const width = 236;
    const height = 54;
    const radius = 18;

    // 1. Nền kính tối bán trong suốt viền màu accent của chương
    this.badgeBg = scene.add.graphics();
    this.badgeBg.fillStyle(config.theme.colors.accentDark, 0.65);
    this.badgeBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    this.badgeBg.lineStyle(1.6, config.theme.colors.accent, 0.9);
    this.badgeBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    this.add(this.badgeBg);

    // 2. Tên chương (ví dụ: "Chương I · Khởi Nguyên" hoặc "Chương II · Giao Thoa")
    const romanNumeral = config.theme.chapter === 1 ? 'I' : config.theme.chapter === 2 ? 'II' : 'III';
    this.titleText = scene.add
      .text(0, -9, `Chương ${romanNumeral} · ${config.theme.name}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add(this.titleText);

    // 3. Thanh tiến độ 7 nấc (150px rộng, 7 nấc cách nhau 4px)
    this.progressBars = scene.add.graphics();
    const trackW = 150;
    const barH = 6;
    const totalBars = config.theme.totalLevels;
    const gap = 4;
    const barW = (trackW - (totalBars - 1) * gap) / totalBars;
    const startX = -trackW / 2;
    const barY = 10;

    for (let i = 0; i < totalBars; i++) {
      const bx = startX + i * (barW + gap);
      const isCompleted = i < config.completedCount;
      if (isCompleted) {
        this.progressBars.fillStyle(config.theme.colors.accent, 1.0);
      } else {
        this.progressBars.fillStyle(0xffffff, 0.18);
      }
      this.progressBars.fillRoundedRect(bx, barY, barW, barH, 3);
    }
    this.add(this.progressBars);

    scene.add.existing(this);
  }
}

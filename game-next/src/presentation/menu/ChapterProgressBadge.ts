import Phaser from 'phaser';
import { chapterRoman } from '../../content/chapters.ts';
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

    // Drawn in mockup units (390 px wide); the caller scales the badge by 720/390.
    const romanNumeral = chapterRoman(config.theme.chapter);
    this.titleText = scene.add
      .text(0, 0, `Chương ${romanNumeral} · ${config.theme.name}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setResolution(2);

    const trackW = 150;
    const width = Math.max(this.titleText.width, trackW) + 32;
    const height = 8 + 18 + 6 + 6 + 10;
    const top = -height / 2;

    // 1. Nền kính tối bán trong suốt, viền 1.5 màu accent của chương
    this.badgeBg = scene.add.graphics();
    this.badgeBg.fillStyle(0x0a0a28, 0.55);
    this.badgeBg.fillRoundedRect(-width / 2, top, width, height, 18);
    this.badgeBg.lineStyle(1.5, config.theme.colors.accent, 1);
    this.badgeBg.strokeRoundedRect(-width / 2, top, width, height, 18);
    this.add(this.badgeBg);

    // 2. Tên chương
    this.titleText.setY(top + 8 + 9);
    this.add(this.titleText);

    // 3. Thanh tiến độ: 150 px rộng, mỗi nấc cao 6, cách nhau 4
    this.progressBars = scene.add.graphics();
    const barH = 6;
    // The mockups draw 7 segments; chapters without levels yet report 0 levels.
    const totalBars = config.theme.totalLevels || 7;
    const gap = 4;
    const barW = (trackW - (totalBars - 1) * gap) / totalBars;
    const startX = -trackW / 2;
    const barY = top + 8 + 18 + 6;

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

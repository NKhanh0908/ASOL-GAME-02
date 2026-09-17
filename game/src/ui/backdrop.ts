import Phaser from 'phaser';
import { LAYOUT } from './layout';
import { THEME } from './theme';

export function drawBackdrop(scene: Phaser.Scene): void {
  scene.cameras.main.setBackgroundColor(THEME.background);
  const g = scene.add.graphics().setDepth(-10);
  for (let i = 0; i < 48; i += 1) {
    g.fillStyle(THEME.blue, 0.12 + (i % 3) * 0.05);
    g.fillCircle((i * 137 + 31) % LAYOUT.width, (i * 211 + 17) % 950, 1 + (i % 2));
  }
  for (const radius of [272, 280, 294]) {
    g.lineStyle(2, THEME.blue, 0.12);
    g.strokeCircle(LAYOUT.width / 2, 552, radius);
  }
  g.fillStyle(THEME.board, 0.75);
  g.fillRoundedRect(LAYOUT.boardX - 8, LAYOUT.boardY - 8, LAYOUT.boardWidth + 16, LAYOUT.boardHeight + 16, 20);
  g.lineStyle(1, THEME.blue, 0.07);
  for (let x = 0; x <= 128; x += 8) g.lineBetween(LAYOUT.boardX + x * LAYOUT.cell, LAYOUT.boardY, LAYOUT.boardX + x * LAYOUT.cell, LAYOUT.boardY + LAYOUT.boardHeight);
  for (let y = 0; y <= 192; y += 8) g.lineBetween(LAYOUT.boardX, LAYOUT.boardY + y * LAYOUT.cell, LAYOUT.boardX + LAYOUT.boardWidth, LAYOUT.boardY + y * LAYOUT.cell);
  g.fillStyle(THEME.board, 0.9);
  g.fillRoundedRect(16, LAYOUT.trayTop - 8, 688, LAYOUT.trayBottom - LAYOUT.trayTop + 16, 20);
}

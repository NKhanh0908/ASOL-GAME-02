import Phaser from 'phaser';
import { LAYOUT } from './layout';
import { THEME } from './theme';

export function drawBackdrop(scene: Phaser.Scene): void {
  scene.cameras.main.setBackgroundColor(THEME.background);
  const g = scene.add.graphics().setDepth(-10);

  // 1. Starry cosmic background particles
  for (let i = 0; i < 54; i += 1) {
    g.fillStyle(THEME.blue, 0.12 + (i % 3) * 0.06);
    g.fillCircle((i * 137 + 31) % LAYOUT.width, (i * 211 + 17) % 950, 1 + (i % 2));
  }

  // 2. HSR Celestial Rune Dial (Vòng tròn ma trận thiên văn)
  const centerX = LAYOUT.boardX + LAYOUT.boardWidth / 2;
  const centerY = LAYOUT.boardY + LAYOUT.boardHeight / 2;

  // Outer concentric mystic circles
  g.lineStyle(2, THEME.blue, 0.22);
  g.strokeCircle(centerX, centerY, 330);

  g.lineStyle(1.5, THEME.gold, 0.28);
  g.strokeCircle(centerX, centerY, 315);

  g.lineStyle(1, THEME.blue, 0.15);
  g.strokeCircle(centerX, centerY, 298);

  // Runic cardinal dots
  const cardinalAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  for (const angle of cardinalAngles) {
    const rx = centerX + Math.cos(angle) * 315;
    const ry = centerY + Math.sin(angle) * 315;
    g.fillStyle(THEME.blue, 0.6);
    g.fillCircle(rx, ry, 3);
  }

  // 3. Board glass container
  g.fillStyle(THEME.board, 0.88);
  g.fillRoundedRect(LAYOUT.boardX - 8, LAYOUT.boardY - 8, LAYOUT.boardWidth + 16, LAYOUT.boardHeight + 16, 20);
  g.lineStyle(1.5, THEME.blue, 0.35);
  g.strokeRoundedRect(LAYOUT.boardX - 8, LAYOUT.boardY - 8, LAYOUT.boardWidth + 16, LAYOUT.boardHeight + 16, 20);

  // 4. HSR AMBER COORDINATE GRID LINES (Lưới toạ độ vàng hổ phách)
  // Step: every 8 cells (32px)
  g.lineStyle(1, THEME.gold, 0.16);
  for (let x = 0; x <= 128; x += 8) {
    const posX = LAYOUT.boardX + x * LAYOUT.cell;
    g.lineBetween(posX, LAYOUT.boardY, posX, LAYOUT.boardY + LAYOUT.boardHeight);
  }
  for (let y = 0; y <= 192; y += 8) {
    const posY = LAYOUT.boardY + y * LAYOUT.cell;
    g.lineBetween(LAYOUT.boardX, posY, LAYOUT.boardX + LAYOUT.boardWidth, posY);
  }

  // 5. Grid intersection coordinate dots (Chấm toạ độ giao điểm lưới chuẩn HSR)
  g.fillStyle(THEME.gold, 0.38);
  for (let x = 0; x <= 128; x += 8) {
    for (let y = 0; y <= 192; y += 8) {
      g.fillCircle(LAYOUT.boardX + x * LAYOUT.cell, LAYOUT.boardY + y * LAYOUT.cell, 1.4);
    }
  }

  // 6. Bottom piece tray glass
  g.fillStyle(THEME.board, 0.92);
  g.fillRoundedRect(16, LAYOUT.trayTop - 8, 688, LAYOUT.trayBottom - LAYOUT.trayTop + 16, 20);
  g.lineStyle(1.2, THEME.blue, 0.3);
  g.strokeRoundedRect(16, LAYOUT.trayTop - 8, 688, LAYOUT.trayBottom - LAYOUT.trayTop + 16, 20);
}

import Phaser from 'phaser';
import type { PieceDefinition } from '../domain/types';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/types';

export const COLORS = [0x000000, 0xffc857];

export function drawMask(graphics: Phaser.GameObjects.Graphics, mask: Uint8Array, cellSize: number, offsetX = 0, offsetY = 0, ghost = false): void {
  graphics.clear();
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    let x = 0;
    while (x < GRID_WIDTH) {
      const color = mask[y * GRID_WIDTH + x];
      if (!color) { x += 1; continue; }
      const start = x;
      while (x < GRID_WIDTH && mask[y * GRID_WIDTH + x] === color) x += 1;
      graphics.fillStyle(COLORS[color], ghost ? 0.15 : 0.9);
      graphics.fillRect(offsetX + start * cellSize, offsetY + y * cellSize, (x - start) * cellSize, cellSize);
    }
  }
}

export function pieceSize(piece: PieceDefinition): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const [x, y] of piece.cells) {
    width = Math.max(width, x + 1);
    height = Math.max(height, y + 1);
  }
  return { width, height };
}

export function drawPiece(graphics: Phaser.GameObjects.Graphics, piece: PieceDefinition, cellSize: number, filled: boolean): void {
  graphics.clear();
  const cells = new Set(piece.cells.map(([x, y]) => `${x},${y}`));
  if (filled) {
    graphics.fillStyle(COLORS[piece.color], 0.35);
    const { width, height } = pieceSize(piece);
    for (let y = 0; y < height; y += 1) {
      let x = 0;
      while (x < width) {
        if (!cells.has(`${x},${y}`)) { x += 1; continue; }
        const start = x;
        while (x < width && cells.has(`${x},${y}`)) x += 1;
        graphics.fillRect(start * cellSize, y * cellSize, (x - start) * cellSize, cellSize);
      }
    }
  }
  graphics.lineStyle(2, COLORS[piece.color], 0.95);
  for (const [x, y] of piece.cells) {
    const left = x * cellSize;
    const top = y * cellSize;
    const right = left + cellSize;
    const bottom = top + cellSize;
    if (!cells.has(`${x},${y - 1}`)) graphics.lineBetween(left, top, right, top);
    if (!cells.has(`${x + 1},${y}`)) graphics.lineBetween(right, top, right, bottom);
    if (!cells.has(`${x},${y + 1}`)) graphics.lineBetween(left, bottom, right, bottom);
    if (!cells.has(`${x - 1},${y}`)) graphics.lineBetween(left, top, left, bottom);
  }
}

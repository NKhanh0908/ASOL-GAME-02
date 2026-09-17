import Phaser from 'phaser';
import type { PieceDefinition } from '../domain/types';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/types';
import { THEME } from './theme';

export const COLORS = [0x000000, THEME.gold];

export function overlappingCells(
  cells: ReadonlyArray<readonly [number, number]>,
  originX: number,
  originY: number,
  otherCells: ReadonlyArray<readonly [number, number]>,
  otherOriginX: number,
  otherOriginY: number,
): Set<string> {
  const result = new Set<string>();
  for (const [x, y] of cells) {
    const left = x + originX;
    const top = y + originY;
    for (const [otherX, otherY] of otherCells) {
      const otherLeft = otherX + otherOriginX;
      const otherTop = otherY + otherOriginY;
      if (left < otherLeft + 1 && left + 1 > otherLeft && top < otherTop + 1 && top + 1 > otherTop) {
        result.add(`${x},${y}`);
        break;
      }
    }
  }
  return result;
}

export function overlapPreviewCells(
  draggedCells: ReadonlyArray<readonly [number, number]>,
  draggedOriginX: number,
  draggedOriginY: number,
  underneathCells: ReadonlyArray<readonly [number, number]>,
  underneathOriginX: number,
  underneathOriginY: number,
): { dragged: Set<string>; underneath: Set<string> } {
  return {
    dragged: overlappingCells(draggedCells, draggedOriginX, draggedOriginY, underneathCells, underneathOriginX, underneathOriginY),
    underneath: overlappingCells(underneathCells, underneathOriginX, underneathOriginY, draggedCells, draggedOriginX, draggedOriginY),
  };
}

export function drawMask(graphics: Phaser.GameObjects.Graphics, mask: Uint8Array, cellSize: number, offsetX = 0, offsetY = 0, ghost = false): void {
  graphics.clear();
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    let x = 0;
    while (x < GRID_WIDTH) {
      const color = mask[y * GRID_WIDTH + x];
      if (!color) { x += 1; continue; }
      const start = x;
      while (x < GRID_WIDTH && mask[y * GRID_WIDTH + x] === color) x += 1;
      graphics.fillStyle(COLORS[color], ghost ? THEME.ghostAlpha : 0.9);
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

export function drawPiece(
  graphics: Phaser.GameObjects.Graphics,
  piece: PieceDefinition,
  cellSize: number,
  state: 'loose' | 'dragging' | 'placed',
  transparentCells: ReadonlySet<string> = new Set(),
): void {
  graphics.clear();
  const cells = new Set(piece.cells.map(([x, y]) => `${x},${y}`));
  if (state !== 'placed') {
    graphics.fillStyle(COLORS[piece.color], state === 'dragging' ? 0.55 : 0.35);
    const { width, height } = pieceSize(piece);
    for (let y = 0; y < height; y += 1) {
      let x = 0;
      while (x < width) {
        if (!cells.has(`${x},${y}`)) { x += 1; continue; }
        const start = x;
        while (x < width && cells.has(`${x},${y}`)) x += 1;
        for (let fillX = start; fillX < x; fillX += 1) {
          if (!transparentCells.has(`${fillX},${y}`)) graphics.fillRect(fillX * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  graphics.lineStyle(state === 'dragging' ? 3 : 1.5, COLORS[piece.color], state === 'placed' ? 0.7 : 1);
  for (const [x, y] of piece.cells) {
    const left = x * cellSize;
    const top = y * cellSize;
    const right = left + cellSize;
    const bottom = top + cellSize;
    if (transparentCells.has(`${x},${y}`)) continue;
    if (!cells.has(`${x},${y - 1}`)) graphics.lineBetween(left, top, right, top);
    if (!cells.has(`${x + 1},${y}`)) graphics.lineBetween(right, top, right, bottom);
    if (!cells.has(`${x},${y + 1}`)) graphics.lineBetween(left, bottom, right, bottom);
    if (!cells.has(`${x - 1},${y}`)) graphics.lineBetween(left, top, left, bottom);
  }
}

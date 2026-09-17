import { GRID_HEIGHT, GRID_WIDTH, type Level, type Placement } from './types';

export function evaluate(level: Level, placements: Placement[]): Uint8Array {
  const counts = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  const colors = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

  for (const placement of placements) {
    const piece = level.pieces.find((candidate) => candidate.id === placement.pieceId);
    if (!piece) throw new Error(`Unknown piece: ${placement.pieceId}`);
    for (const [localX, localY] of piece.cells) {
      const x = placement.x + localX;
      const y = placement.y + localY;
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;
      const index = y * GRID_WIDTH + x;
      counts[index] += 1;
      colors[index] = piece.color;
    }
  }

  for (let index = 0; index < colors.length; index += 1) {
    if (counts[index] % 2 === 0) colors[index] = 0;
  }
  return colors;
}

export function matchesTarget(result: Uint8Array, target: Uint8Array): boolean {
  if (result.length !== target.length) return false;
  for (let index = 0; index < result.length; index += 1) {
    if ((result[index] !== 0) !== (target[index] !== 0)) return false;
  }
  return true;
}

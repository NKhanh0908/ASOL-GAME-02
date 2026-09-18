import { levels } from './levels';
import { evaluate, matchesTarget } from './mask';
import { GRID_HEIGHT, GRID_WIDTH, type Level, type Placement } from './types';

export const SNAP_RADIUS_CELLS = 6;

export class Session {
  private currentLevel: Level;
  private currentIndex: number;
  private placed: Placement[] = [];
  private victory = false;
  private targetMask: Uint8Array;

  constructor(levelOrIndex: number | Level = 0) {
    if (typeof levelOrIndex === 'number') {
      if (levelOrIndex < 0 || levelOrIndex >= levels.length) throw new Error('Invalid level index');
      this.currentIndex = levelOrIndex;
      this.currentLevel = levels[levelOrIndex];
    } else {
      this.currentLevel = levelOrIndex;
      this.currentIndex = levels.findIndex((l) => l.id === levelOrIndex.id);
    }
    this.targetMask = evaluate(this.currentLevel, this.currentLevel.solution);
  }

  get level(): Level { return this.currentLevel; }
  get levelId(): string { return this.currentLevel.id; }
  get levelIndex(): number { return this.currentIndex; }
  get placements(): readonly Placement[] { return this.placed; }
  get target(): Uint8Array { return this.targetMask; }
  get result(): Uint8Array { return evaluate(this.currentLevel, this.placed); }
  get won(): boolean { return this.victory; }
  get isFinalLevel(): boolean { return this.currentIndex >= 0 && this.currentIndex === levels.length - 1; }

  static canSaveSolution(level: Level, placements: Placement[]): boolean {
    if (!placements || placements.length === 0) return false;

    for (const placement of placements) {
      const piece = level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return false;

      for (const [cx, cy] of piece.cells) {
        const gx = placement.x + cx;
        const gy = placement.y + cy;
        if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) {
          return false;
        }
      }
    }

    const candidateMask = evaluate(level, placements);
    const targetMask = evaluate(level, level.solution);
    return matchesTarget(candidateMask, targetMask);
  }

  drop(pieceId: string, x: number, y: number): boolean {
    if (this.victory) return false;
    const piece = this.currentLevel.pieces.find((candidate) => candidate.id === pieceId);
    if (!piece) return false;
    let nearest: readonly [number, number] | undefined;
    let nearestDistance = SNAP_RADIUS_CELLS * SNAP_RADIUS_CELLS;
    for (const anchor of piece.anchors) {
      const distance = (anchor[0] - x) ** 2 + (anchor[1] - y) ** 2;
      if (distance <= nearestDistance) {
        nearest = anchor;
        nearestDistance = distance;
      }
    }
    if (!nearest) return false;
    this.placed = this.placed.filter((placement) => placement.pieceId !== pieceId);
    this.placed.push({ pieceId, x: nearest[0], y: nearest[1] });
    this.victory = matchesTarget(this.result, this.targetMask);
    return true;
  }

  remove(pieceId: string): boolean {
    const hadPlacement = this.placed.some((placement) => placement.pieceId === pieceId);
    if (!hadPlacement) return false;
    this.placed = this.placed.filter((placement) => placement.pieceId !== pieceId);
    this.victory = false;
    return true;
  }

  reset(): void {
    this.placed = [];
    this.victory = false;
  }

  next(): boolean {
    if (!this.victory || this.currentIndex < 0) return false;
    this.currentIndex = (this.currentIndex + 1) % levels.length;
    this.currentLevel = levels[this.currentIndex];
    this.placed = [];
    this.victory = false;
    this.targetMask = evaluate(this.currentLevel, this.currentLevel.solution);
    return true;
  }
}


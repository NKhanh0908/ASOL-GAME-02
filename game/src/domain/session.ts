import { levels } from './levels';
import { evaluate, matchesTarget } from './mask';
import type { Level, Placement } from './types';

export const SNAP_RADIUS_CELLS = 6;

export class Session {
  private currentIndex: number;
  private placed: Placement[] = [];
  private victory = false;
  private targetMask: Uint8Array;

  constructor(initialIndex = 0) {
    if (initialIndex < 0 || initialIndex >= levels.length) throw new Error('Invalid level index');
    this.currentIndex = initialIndex;
    this.targetMask = evaluate(this.level, this.level.solution);
  }

  get level(): Level { return levels[this.currentIndex]; }
  get levelIndex(): number { return this.currentIndex; }
  get placements(): readonly Placement[] { return this.placed; }
  get target(): Uint8Array { return this.targetMask; }
  get result(): Uint8Array { return evaluate(this.level, this.placed); }
  get won(): boolean { return this.victory; }
  get isFinalLevel(): boolean { return this.currentIndex === levels.length - 1; }

  drop(pieceId: string, x: number, y: number): boolean {
    if (this.victory) return false;
    const piece = this.level.pieces.find((candidate) => candidate.id === pieceId);
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
    if (!this.victory) return false;
    this.currentIndex = (this.currentIndex + 1) % levels.length;
    this.placed = [];
    this.victory = false;
    this.targetMask = evaluate(this.level, this.level.solution);
    return true;
  }
}

import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';

vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} } } }));

describe('BoardRenderer.setTargetReveal', () => {
  test('nhân alpha bóng mục tiêu theo từng placement và vẽ lại ngay', () => {
    const fills: Array<{ depth: number; alpha: number }> = [];
    const scene = { add: { graphics: () => {
      let depth = 0;
      const g: object = new Proxy({}, { get: (_, method: string) => (...args: unknown[]) => {
        if (method === 'setDepth') depth = args[0] as number;
        if (method === 'fillStyle') fills.push({ depth, alpha: args[1] as number });
        if (method === 'clear' && depth === 20) fills.length = 0;
        return g;
      } });
      return g;
    } } } as unknown as Phaser.Scene;
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const renderer = new BoardRenderer(scene, computeLayout(720, 1280), 2);
    staticBoard.mockRestore();
    const level = loadLevel('1-1', 'campaign');
    const snapshot: PlayViewSnapshot = {
      levelId: level.id, phase: 'playing', showTarget: true, snappedCount: 0, totalPieces: 2,
      canRotate: false, selectedPieceId: null, dragPreviewMask: null, snapCandidateId: null,
      dragInfo: null, committedMask: new Uint8Array(level.targetMask.length),
    };
    renderer.render(level, snapshot, {});
    const full = fills.filter((f) => f.depth === 20).map((f) => f.alpha);
    expect(full.length).toBeGreaterThan(0);

    renderer.setTargetReveal([0, 0]);
    expect(fills.filter((f) => f.depth === 20)).toEqual([]);

    renderer.setTargetReveal([0.5, 0.5]);
    const half = fills.filter((f) => f.depth === 20).map((f) => f.alpha);
    expect(half).toHaveLength(full.length);
    half.forEach((alpha, i) => expect(alpha).toBeCloseTo(full[i] * 0.5, 9));

    renderer.setTargetReveal(null);
    expect(fills.filter((f) => f.depth === 20).map((f) => f.alpha)).toEqual(full);
    renderer.destroy();
  });
});

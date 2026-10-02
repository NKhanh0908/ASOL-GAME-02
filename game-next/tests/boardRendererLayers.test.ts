import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PieceState } from '../src/domain/model.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';
import { COLOR_NUMBERS } from '../src/presentation/designTokens.ts';

// Chỉ thay hạ tầng canvas của Phaser; giữ nguyên renderer và phép vẽ đa giác.
vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} } } }));

type Draw = { depth: number; method: string; color: number | null; args: unknown[] };

describe('BoardRenderer thứ tự lớp khi kéo qua vùng giao', () => {
  test.each(['dragging', 'temporary'] as const)('%s nằm trên vùng triệt tiêu, dưới hiệu ứng thắng', (mode) => {
    const draws: Draw[] = [];
    let allocations = 0;
    const scene = { add: { graphics: () => {
      allocations++;
      let depth = 0;
      let color: number | null = null;
      const graphics: object = new Proxy({}, { get: (_, method: string) => (...args: unknown[]) => {
        if (method === 'setDepth') depth = args[0] as number;
        if (method === 'fillStyle') color = args[0] as number;
        draws.push({ depth, method, color, args });
        return graphics;
      } });
      return graphics;
    } } } as unknown as Phaser.Scene;
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const renderer = new BoardRenderer(scene, computeLayout(720, 1280), 3);
    staticBoard.mockRestore();
    const original = loadLevel('1-1', 'campaign');
    const piece = original.pieces[0];
    const level = { ...original, pieces: ['P1', 'P2', 'P3'].map((id) => ({ ...piece, id })) };
    const states: Record<string, PieceState> = {
      P1: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P2: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P3: mode === 'dragging' ? { kind: 'tray', turns: 0 } : { kind: 'temporary', x: 16, y: 56, turns: 0 },
    };
    const snapshot: PlayViewSnapshot = {
      levelId: level.id, phase: 'won', showTarget: false, snappedCount: 2, totalPieces: 3,
      canRotate: false, selectedPieceId: 'P3', dragPreviewMask: null, snapCandidateId: null,
      dragInfo: mode === 'dragging' ? { pieceId: 'P3', x: 240, y: 600, snapCandidateId: null } : null,
      committedMask: level.targetMask,
    };
    const initialAllocations = allocations;
    renderer.render(level, snapshot, states);
    const parity = draws.find((draw) => draw.method === 'fillPoints' && draw.color === COLOR_NUMBERS.boardSurfaceTop)!;
    const moving = mode === 'dragging'
      ? draws.find((draw) => draw.method === 'fillPoints' && draw.color === 0x000000)!
      : draws.find((draw) => draw.method === 'strokeCircle' && draw.args[2] === 4)!;
    const victory = draws.find((draw) => draw.method === 'strokeRoundedRect')!;
    expect(parity).toBeDefined();
    expect(moving).toBeDefined();
    expect(victory).toBeDefined();
    expect(draws.some((draw) => draw.method === 'fillCircle' && draw.color === 0xffffff)).toBe(false);
    expect(parity.depth).toBeLessThan(moving.depth);
    expect(draws.some((draw) => draw.method === 'fillPoints' &&
      draw.color === COLOR_NUMBERS.jewelFaceNorth && draw.depth === moving.depth)).toBe(true);
    expect(moving.depth).toBeLessThan(victory.depth);
    expect(allocations).toBe(initialAllocations);
    renderer.destroy();
  });
});

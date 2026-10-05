import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PieceState } from '../src/domain/model.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS } from '../src/presentation/designTokens.ts';
import { createFakeScene, readyTextures } from './helpers/fakeScene.ts';

vi.mock('phaser', () => ({
  default: {
    Display: {
      Color: {
        HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
      },
    },
    Geom: {
      Point: class {
        x: number;
        y: number;
        constructor(x: number, y: number) {
          this.x = x;
          this.y = y;
        }
      },
    },
    BlendModes: { ADD: 1 },
  },
}));

describe('BoardRenderer thứ tự lớp khi kéo qua vùng giao', () => {
  test.each(['dragging', 'temporary'] as const)('%s nằm trên vùng triệt tiêu, dưới hiệu ứng thắng', (mode) => {
    const { scene, calls, objects } = createFakeScene();
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const original = loadLevel('1-1', 'campaign');
    const piece = original.pieces[0];
    const level = { ...original, pieces: ['P1', 'P2', 'P3'].map((id) => ({ ...piece, id })) };
    const renderer = new BoardRenderer(scene as Phaser.Scene, computeLayout(720, 1280), level, readyTextures);
    staticBoard.mockRestore();
    const states: Record<string, PieceState> = {
      P1: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P2: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P3: mode === 'dragging' ? { kind: 'tray', turns: 0 } : { kind: 'temporary', x: 16, y: 56, turns: 0 },
    };
    const snapshot: PlayViewSnapshot = {
      levelId: level.id,
      phase: 'won',
      showTarget: false,
      snappedCount: 2,
      totalPieces: 3,
      canRotate: false,
      selectedPieceId: 'P3',
      dragPreviewMask: null,
      snapCandidateId: null,
      dragInfo: mode === 'dragging' ? { pieceId: 'P3', x: 240, y: 600, snapCandidateId: null } : null,
      committedMask: level.targetMask,
    };
    renderer.render(level, snapshot, states);
    const allocated = objects.length;
    renderer.tick(16, snapshot, states);
    renderer.tick(16, snapshot, states);

    const parity = calls.find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!;
    const moving = renderer.getPieceView('P3')!.root as unknown as { __depth: number };
    const victory = calls.find((c) => c.method === 'strokeRoundedRect')!;
    expect(parity).toBeDefined();
    expect(victory).toBeDefined();
    expect(moving.__depth).toBe(mode === 'dragging' ? DEPTH_TOKENS.draggingPiece : DEPTH_TOKENS.temporaryPieces);
    expect(parity.depth).toBeLessThan(moving.__depth);
    expect(moving.__depth).toBeLessThan(victory.depth);
    if (mode === 'temporary') {
      expect(
        calls.some((c) => c.method === 'strokeCircle' && c.args[2] === 4 && c.depth === DEPTH_TOKENS.temporaryPieces)
      ).toBe(true);
    }
    // Sparkle trắng ở tâm đã bị bỏ (CHANGELOG 2026-10-02)
    expect(calls.some((c) => c.method === 'fillCircle' && c.color === 0xffffff)).toBe(false);
    // tick không cấp phát GameObject mới
    expect(objects.length).toBe(allocated);
    renderer.destroy();
  });
});

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

function setup() {
  const fake = createFakeScene();
  const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
  const original = loadLevel('1-1', 'campaign');
  const level = { ...original, pieces: ['P1', 'P2'].map((id) => ({ ...original.pieces[0], id })) };
  const renderer = new BoardRenderer(fake.scene as Phaser.Scene, computeLayout(720, 1280), level, readyTextures);
  staticBoard.mockRestore();
  const snapshot = (over: Partial<PlayViewSnapshot> = {}): PlayViewSnapshot => ({
    levelId: level.id,
    phase: 'playing',
    showTarget: false,
    snappedCount: 0,
    totalPieces: 2,
    canRotate: false,
    selectedPieceId: null,
    dragPreviewMask: null,
    snapCandidateId: null,
    dragInfo: null,
    committedMask: level.targetMask,
    ...over,
  });
  return { ...fake, renderer, snapshot };
}

const snapped: PieceState = { kind: 'snapped', anchorId: 'A', turns: 0 };
const tray: PieceState = { kind: 'tray', turns: 0 };

describe('vùng giao mờ dần', () => {
  test('lớp mới bắt đầu alpha 0 và đạt 1 sau 150 ms, rồi gộp vào lớp ổn định', () => {
    const { renderer, snapshot, calls } = setup();
    renderer.tick(16, snapshot(), { P1: snapped, P2: tray });
    renderer.tick(0, snapshot(), { P1: snapped, P2: snapped });
    const incomingOwner = calls.find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!.owner;
    const alphaOf = () => [...calls].reverse().find((c) => c.owner === incomingOwner && c.method === 'setAlpha')?.args[0];
    expect(alphaOf()).toBe(0);
    renderer.tick(75, snapshot(), { P1: snapped, P2: snapped });
    expect(alphaOf()).toBeCloseTo(0.5, 5);
    renderer.tick(80, snapshot(), { P1: snapped, P2: snapped });
    const stable = calls.filter(
      (c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop && c.owner !== incomingOwner
    );
    expect(stable.length).toBeGreaterThan(0);
  });

  test('fadeOutParity vẽ bản sao rồi mờ về 0', () => {
    const { renderer, snapshot, calls } = setup();
    renderer.tick(0, snapshot(), { P1: snapped, P2: snapped });
    renderer.tick(200, snapshot(), { P1: snapped, P2: snapped });
    const before = calls.length;
    renderer.fadeOutParity(120);
    renderer.tick(0, snapshot(), { P1: tray, P2: tray });
    renderer.tick(130, snapshot(), { P1: tray, P2: tray });
    // Chỉ đọc lớp bản sao: đối tượng nhận fillPoints màu mặt bia sau fadeOutParity
    const fadeOwner = calls
      .slice(before)
      .find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!.owner;
    const alphas = calls.filter((c) => c.owner === fadeOwner && c.method === 'setAlpha').map((c) => c.args[0]);
    expect(alphas[0]).toBe(1);
    expect(alphas[alphas.length - 1]).toBe(0);
  });

  test('xem trước: có neo ứng viên chồng lên mảnh đã snap thì vẽ nét ở depth 32', () => {
    const { renderer, snapshot, calls } = setup();
    const drag = { pieceId: 'P2', x: 300, y: 600, snapCandidateId: 'A' };
    renderer.tick(16, snapshot({ dragInfo: drag }), { P1: snapped, P2: tray });
    expect(calls.some((c) => c.method === 'strokePoints' && c.depth === DEPTH_TOKENS.placedPieces + 2)).toBe(true);
  });
});

import { describe, expect, test } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { createProgressRepository } from '../src/infrastructure/progressRepository.ts';
import type { StoragePort } from '../src/application/progressPort.ts';
import { PlayController } from '../src/application/playController.ts';
import { computeLayout, gridToCanvas, pieceHitbox } from '../src/presentation/layout.ts';

function createMockStorage(): StoragePort & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, val) => {
      data[key] = val;
    },
  };
}

describe('PlayController Loop and State Coordination', () => {
  const layout = computeLayout(720, 1280);
  const level = loadLevel('1-1', 'harness');

  test('khởi tạo snapshot ban đầu chính xác', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const controller = new PlayController(level, repo, true);

    const snapshot = controller.getSnapshot();
    expect(snapshot.levelId).toBe('1-1');
    expect(snapshot.phase).toBe('playing');
    expect(snapshot.snappedCount).toBe(0);
    expect(snapshot.totalPieces).toBe(2);
    expect(snapshot.canRotate).toBe(false); // Chapter 1 rotation is disabled
    expect(snapshot.showTarget).toBe(true);
  });

  test('chuỗi kéo thả hoàn thành màn 1-1, kích hoạt won và lưu vào progressRepo', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const controller = new PlayController(level, repo, true);

    const pD1 = level.pieces.find((p) => p.id === 'D1')!;
    const pD2 = level.pieces.find((p) => p.id === 'D2')!;

    // 1. Chạm vào D1 trong khay (slot 0)
    const p1Hitbox = pieceHitbox(pD1, { kind: 'tray', turns: 0 }, layout, 0);
    const hit1 = controller.onPointerDown(
      p1Hitbox.x + p1Hitbox.width / 2,
      p1Hitbox.y + p1Hitbox.height / 2,
      layout
    );
    expect(hit1).toBe(true);

    // Kéo D1 tới tâm neo A (40, 80)
    const anchor1Canvas = gridToCanvas(40, 80, layout);
    controller.onPointerMove(anchor1Canvas.x, anchor1Canvas.y, layout);

    const snap1 = controller.getSnapshot();
    expect(snap1.snapCandidateId).toBe('A');

    // Thả D1
    const trans1 = controller.onPointerUp(anchor1Canvas.x, anchor1Canvas.y, layout);
    expect(trans1?.outcome).toBe('snapped');
    expect(controller.getSnapshot().snappedCount).toBe(1);
    expect(controller.getSnapshot().phase).toBe('playing');

    // 2. Chạm vào D2 trong khay (slot 1)
    const p2Hitbox = pieceHitbox(pD2, { kind: 'tray', turns: 0 }, layout, 1);
    const hit2 = controller.onPointerDown(
      p2Hitbox.x + p2Hitbox.width / 2,
      p2Hitbox.y + p2Hitbox.height / 2,
      layout
    );
    expect(hit2).toBe(true);

    // Kéo D2 tới tâm neo A (88, 80)
    const anchor2Canvas = gridToCanvas(88, 80, layout);
    controller.onPointerMove(anchor2Canvas.x, anchor2Canvas.y, layout);

    // Thả D2 -> Thắng!
    const trans2 = controller.onPointerUp(anchor2Canvas.x, anchor2Canvas.y, layout);
    expect(trans2?.outcome).toBe('won');
    expect(trans2?.becameWon).toBe(true);

    const finalSnap = controller.getSnapshot();
    expect(finalSnap.phase).toBe('won');
    expect(finalSnap.snappedCount).toBe(2);

    // Xác nhận đã tự động lưu hoàn thành vào repo
    expect(repo.read().progress.completed).toContain('1-1');
  });

  test('onToggleTarget thay đổi trạng thái hiển thị và lưu vào repository', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const controller = new PlayController(level, repo, true);

    const toggled = controller.onToggleTarget();
    expect(toggled).toBe(false);
    expect(controller.getSnapshot().showTarget).toBe(false);
    expect(repo.read().progress.settings.showTarget).toBe(false);
  });

  test('onReset đưa toàn bộ mảnh về khay và trả phase về playing', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const controller = new PlayController(level, repo, true);

    const pD1 = level.pieces.find((p) => p.id === 'D1')!;
    const p1Hitbox = pieceHitbox(pD1, { kind: 'tray', turns: 0 }, layout, 0);
    controller.onPointerDown(p1Hitbox.x + p1Hitbox.width / 2, p1Hitbox.y + p1Hitbox.height / 2, layout);

    const anchor1 = gridToCanvas(40, 80, layout);
    controller.onPointerUp(anchor1.x, anchor1.y, layout);
    expect(controller.getSnapshot().snappedCount).toBe(1);

    controller.onReset();
    const afterReset = controller.getSnapshot();
    expect(afterReset.snappedCount).toBe(0);
    expect(afterReset.phase).toBe('playing');
    expect(afterReset.selectedPieceId).toBeNull();
  });
});

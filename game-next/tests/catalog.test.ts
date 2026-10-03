import { describe, expect, test } from 'vitest';
import rawSongTinh from '../src/content/levels/1-1.json';
import { validateLevel } from '../src/content/validate.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { levelAccess } from '../src/domain/campaign.ts';
import type { LevelDocument, ManifestEntry } from '../src/content/document.ts';
import { GRID_WIDTH, TOTAL_CELLS } from '../src/domain/model.ts';
import { rotateCells } from '../src/domain/geometry.ts';
import { PlayController } from '../src/application/playController.ts';
import { createProgressRepository } from '../src/infrastructure/progressRepository.ts';
import type { StoragePort } from '../src/application/progressPort.ts';
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

describe('Level 1-1 Song Tinh Content and Catalog Loader', () => {
  test('file 1-1.json vượt qua toàn bộ schema và rule validation', () => {
    const result = validateLevel(rawSongTinh);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.level.id).toBe('1-1');
      expect(result.level.title).toBe('Song Tinh');
      expect(result.level.chapter).toBe(1);
      expect(result.level.rotationEnabled).toBe(false);
      expect(result.level.pieces.length).toBe(2);
    }
  });

  test('nghiệm mẫu của Song Tinh hoàn toàn không có vùng giao xếp chồng (coverage <= 1)', () => {
    const doc = rawSongTinh as unknown as LevelDocument;
    const coverage = new Uint8Array(TOTAL_CELLS);
    const solution = doc.sampleSolutions[0];

    for (const step of solution) {
      const piece = doc.pieces.find((p) => p.id === step.pieceId)!;
      const anchor = piece.anchors.find((a) => a.id === step.anchorId)!;
      const cells = rotateCells(piece.cells, piece.frameSize, step.turns);

      for (const [cx, cy] of cells) {
        const idx = (anchor.y + cy) * GRID_WIDTH + (anchor.x + cx);
        expect(coverage[idx]).toBe(0); // Chưa từng bị phủ bởi mảnh trước
        coverage[idx]++;
      }
    }
  });

  test('thay đổi nghiệm sang neo lệch (anchor B) phải mismatch với targetMask', () => {
    const doc = JSON.parse(JSON.stringify(rawSongTinh)) as LevelDocument;
    doc.sampleSolutions[0][0].anchorId = 'B';
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'solution-target-mismatch')).toBe(true);
    }
  });

  test('loadLevel cho phép tải 1-1 ở cả campaign lẫn harness khi status đã approved', () => {
    const campaignLevel = loadLevel('1-1', 'campaign');
    expect(campaignLevel.id).toBe('1-1');
    expect(campaignLevel.pieces.length).toBe(2);

    const harnessLevel = loadLevel('1-1', 'harness');
    expect(harnessLevel.id).toBe('1-1');
    expect(harnessLevel.pieces.length).toBe(2);
  });

  test('loadLevel cho phép toàn bộ Chương 2 và Họa Phẩm đã duyệt trong campaign', () => {
    const approvedIds = ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10'];

    for (const id of approvedIds) {
      expect(loadLevel(id, 'campaign').id).toBe(id);
    }
  });

  test('loadLevel ném lỗi khi id không tồn tại', () => {
    expect(() => loadLevel('9-9', 'harness')).toThrow('unavailable:9-9');
  });

  test('hoàn thành 1-1 ở campaign mode lưu progress và giữ completed sau reload', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const level = loadLevel('1-1', 'campaign');
    const layout = computeLayout(720, 1280);
    const controller = new PlayController(level, repo, true);

    const pD1 = level.pieces.find((p) => p.id === 'D1')!;
    const pD2 = level.pieces.find((p) => p.id === 'D2')!;

    // Đặt D1
    const p1Hitbox = pieceHitbox(pD1, { kind: 'tray', turns: 0 }, layout, 0);
    controller.onPointerDown(p1Hitbox.x + p1Hitbox.width / 2, p1Hitbox.y + p1Hitbox.height / 2, layout);
    const a1Canvas = gridToCanvas(40, 80, layout);
    controller.onPointerMove(a1Canvas.x, a1Canvas.y, layout);
    controller.onPointerUp(a1Canvas.x, a1Canvas.y, layout);

    // Đặt D2
    const p2Hitbox = pieceHitbox(pD2, { kind: 'tray', turns: 0 }, layout, 1);
    controller.onPointerDown(p2Hitbox.x + p2Hitbox.width / 2, p2Hitbox.y + p2Hitbox.height / 2, layout);
    const a2Canvas = gridToCanvas(88, 80, layout);
    controller.onPointerMove(a2Canvas.x, a2Canvas.y, layout);
    controller.onPointerUp(a2Canvas.x, a2Canvas.y, layout);

    expect(controller.getSnapshot().phase).toBe('won');
    expect(repo.read().progress.completed).toEqual(['1-1']);

    // Khởi tạo lại repo từ storage (giả lập restart app)
    const reloadedRepo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    expect(reloadedRepo.read().progress.completed).toEqual(['1-1']);
  });

  test('hoàn thành 1-1 ở harness mode không ghi nhận completed vào production repository', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    const level = loadLevel('1-1', 'harness');
    const layout = computeLayout(720, 1280);
    const controller = new PlayController(level, repo, false); // isCampaign = false

    const pD1 = level.pieces.find((p) => p.id === 'D1')!;
    const pD2 = level.pieces.find((p) => p.id === 'D2')!;

    // Đặt D1
    const p1Hitbox = pieceHitbox(pD1, { kind: 'tray', turns: 0 }, layout, 0);
    controller.onPointerDown(p1Hitbox.x + p1Hitbox.width / 2, p1Hitbox.y + p1Hitbox.height / 2, layout);
    const a1Canvas = gridToCanvas(40, 80, layout);
    controller.onPointerMove(a1Canvas.x, a1Canvas.y, layout);
    controller.onPointerUp(a1Canvas.x, a1Canvas.y, layout);

    // Đặt D2
    const p2Hitbox = pieceHitbox(pD2, { kind: 'tray', turns: 0 }, layout, 1);
    controller.onPointerDown(p2Hitbox.x + p2Hitbox.width / 2, p2Hitbox.y + p2Hitbox.height / 2, layout);
    const a2Canvas = gridToCanvas(88, 80, layout);
    controller.onPointerMove(a2Canvas.x, a2Canvas.y, layout);
    controller.onPointerUp(a2Canvas.x, a2Canvas.y, layout);

    expect(controller.getSnapshot().phase).toBe('won');
    // Harness mode không được phép ghi completion
    expect(repo.read().progress.completed).toEqual([]);
  });

  test('manifest production và manifest mẫu đều mở successor 1-2 khi approved', () => {
    // Production manifest
    const prodAccess = levelAccess(campaignManifest, ['1-1'], '1-2');
    expect(prodAccess.unlocked).toBe(true);
    expect(prodAccess.available).toBe(true); // 1-2 đã approved

    // Mock manifest với 1-2 approved
    const mockManifest: ManifestEntry[] = [
      { id: '1-1', title: 'Song Tinh', chapter: 1, order: 1, contentRevision: 'song-tinh-v1', status: 'approved' },
      { id: '1-2', title: 'Bảo Tháp Tiên Tri', chapter: 1, order: 2, contentRevision: 'v1.0', status: 'approved' },
    ];
    const mockAccess = levelAccess(mockManifest, ['1-1'], '1-2');
    expect(mockAccess.unlocked).toBe(true);
    expect(mockAccess.available).toBe(true);
  });
});

describe('Màn dev dùng để thử hình mới (spec A)', () => {
  test('dev-shapes-v2 nạp được ở harness và có đủ hình tròn, bình hành, tam giác nhỏ', () => {
    const level = loadLevel('dev-shapes-v2', 'harness');
    expect(level.pieces.map((p) => [p.shapeKind, p.frameSize])).toEqual([
      ['circle', 64],
      ['circle', 64],
      ['parallelogram', 48],
      ['triangle', 24],
    ]);
  });

  test('màn dev không bao giờ nạp ở campaign', () => {
    expect(() => loadLevel('dev-shapes-v2', 'campaign')).toThrow('unavailable:dev-shapes-v2');
  });
});

describe('Manifest 28 màn trong catalog (CH-02)', () => {
  test('màn planned ở mọi chương không nạp được ở cả hai chế độ', () => {
    for (const e of campaignManifest.filter((m) => m.status === 'planned')) {
      expect(() => loadLevel(e.id, 'harness')).toThrow(`unavailable:${e.id}`);
      expect(() => loadLevel(e.id, 'campaign')).toThrow(`unavailable:${e.id}`);
    }
  });

  test('mã 3-x giờ là Họa Phẩm; chương xoay đổi sang 4-1 → 4-6, giữ tên', () => {
    expect(campaignManifest.find((e) => e.id === '3-1')).toMatchObject({ title: 'Nhật Nguyệt Song Huyền', chapter: 3, order: 13 });
    expect(campaignManifest.find((e) => e.id === '3-10')).toMatchObject({ title: 'Mandala Thiên Cầu', chapter: 3, order: 22 });
    expect(campaignManifest.find((e) => e.id === '4-1')).toMatchObject({ title: 'La Bàn Gió', chapter: 4, order: 23 });
    expect(() => loadLevel('4-1', 'harness')).toThrow('unavailable:4-1');
  });
});

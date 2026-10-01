import { describe, expect, test } from 'vitest';
import rawSongTinh from '../src/content/levels/1-1.json';
import { validateLevel } from '../src/content/validate.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { GRID_WIDTH, TOTAL_CELLS } from '../src/domain/model.ts';
import { rotateCells } from '../src/domain/geometry.ts';

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

  test('loadLevel chặn chế độ campaign khi status chưa approved, nhưng cho phép ở harness', () => {
    // Chế độ campaign: status đang là 'validated' -> phải throw Error('unavailable:1-1')
    expect(() => loadLevel('1-1', 'campaign')).toThrow('unavailable:1-1');

    // Chế độ harness: status 'validated' được phép chạy
    const level = loadLevel('1-1', 'harness');
    expect(level.id).toBe('1-1');
    expect(level.pieces.length).toBe(2);
  });

  test('loadLevel ném lỗi khi id không tồn tại', () => {
    expect(() => loadLevel('9-9', 'harness')).toThrow('unavailable:9-9');
  });
});

import { describe, expect, test } from 'vitest';
import { makeAdjacentFixture } from '../src/content/fixtures.ts';
import { validateLevel } from '../src/content/validate.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';

/** Các màn đã có dữ liệu ngoài 1-1; trạng thái phải là validated hoặc approved */
const AUTHORED_LEVELS = new Set(['1-2', '1-3', '1-4', '1-5', '1-6']);

describe('Level Content and Validation', () => {
  test('không đổi target theo nghiệm nhập sai', () => {
    const doc = makeAdjacentFixture();
    const initial = validateLevel(doc);
    expect(initial.ok).toBe(true);

    // Thay đổi anchor của nghiệm mẫu thành sai vị trí -> phải phát hiện mismatch
    doc.sampleSolutions[0][0].anchorId = 'B';
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'solution-target-mismatch')).toBe(true);
    }
  });

  test('phát hiện duplicate piece ID', () => {
    const doc = makeAdjacentFixture();
    doc.pieces.push({ ...doc.pieces[0] });
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'duplicate-piece-id')).toBe(true);
    }
  });

  test('phát hiện targetCells rỗng', () => {
    const doc = makeAdjacentFixture();
    doc.targetCells = [];
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'empty-target')).toBe(true);
    }
  });

  test('phát hiện unknown anchor trong solution', () => {
    const doc = makeAdjacentFixture();
    doc.sampleSolutions[0][0].anchorId = 'NONEXISTENT';
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'unknown-anchor')).toBe(true);
    }
  });

  test('cấm xoay hoặc turns > 0 trong Chapter 1', () => {
    const doc = makeAdjacentFixture();
    doc.rotationEnabled = true;
    const res1 = validateLevel(doc);
    expect(res1.ok).toBe(false);
    if (!res1.ok) {
      expect(res1.issues.some((i) => i.code === 'chapter-rotation-disabled')).toBe(true);
    }

    const doc2 = makeAdjacentFixture();
    doc2.sampleSolutions[0][0].turns = 1;
    const res2 = validateLevel(doc2);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.issues.some((i) => i.code === 'solution-rotation-disallowed')).toBe(true);
    }
  });

  test('cấm vùng giao (xếp chồng) trong nghiệm Chapter 1', () => {
    const doc = makeAdjacentFixture();
    // Đặt D2 cùng neo với D1 (16, 56) khiến 2 mảnh đè lên nhau
    doc.pieces[1].anchors[0] = { id: 'A', x: 24, y: 76 };
    doc.sampleSolutions[0][1].anchorId = 'A';
    const result = validateLevel(doc);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'chapter-1-no-overlap')).toBe(true);
    }
  });

  test('campaignManifest chứa đủ 18 màn', () => {
    expect(campaignManifest.length).toBe(18);
    expect(campaignManifest[0].id).toBe('1-1');
    expect(campaignManifest[0].status).toBe('approved');
    for (const entry of campaignManifest.slice(1)) {
      if (AUTHORED_LEVELS.has(entry.id)) {
        expect(['validated', 'approved']).toContain(entry.status);
      } else {
        expect(entry.status).toBe('planned');
      }
    }
  });
});

describe('Hình mảnh, hướng và placement mục tiêu (CH1-04)', () => {
  const triangleSource: LevelSource = {
    id: 'test-tri', title: 'Tam giác thử', chapter: 1, order: 1,
    contentRevision: 't1', rotationEnabled: false,
    pieces: [{ id: 'T1', shapeKind: 'triangle', orientation: 2, frameSize: 48, anchors: [{ id: 'A', x: 40, y: 56 }] }],
    sampleSolutions: [[{ pieceId: 'T1', anchorId: 'A', turns: 0 }]],
    learningObjective: 'thử', difficultyEstimate: 1, distractors: [], ftueSteps: [],
  };

  function codes(doc: unknown): string[] {
    const result = validateLevel(doc);
    return result.ok ? [] : result.issues.map((i) => i.code);
  }

  test('tam giác hợp lệ mang shapeKind, orientation và targetPlacements', () => {
    const result = validateLevel(buildLevelDocument(triangleSource));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.level.pieces[0].shapeKind).toBe('triangle');
      expect(result.level.pieces[0].orientation).toBe(2);
      expect(result.level.targetPlacements).toEqual([{ pieceId: 'T1', x: 40, y: 56, turns: 0 }]);
    }
  });

  test('tam giác thiếu orientation bị từ chối', () => {
    const doc = buildLevelDocument(triangleSource);
    delete doc.pieces[0].orientation;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('orientation ngoài 0–7 bị từ chối', () => {
    const doc = buildLevelDocument(triangleSource);
    (doc.pieces[0] as { orientation?: number }).orientation = 9;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('orientation null với cells hướng 0 bị từ chối', () => {
    const doc = buildLevelDocument({
      ...triangleSource,
      pieces: [{ ...triangleSource.pieces[0], orientation: 0 }],
    });
    (doc.pieces[0] as unknown as { orientation: null }).orientation = null;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('thoi có orientation khác 0 bị từ chối', () => {
    const doc = makeAdjacentFixture();
    doc.pieces[0].orientation = 3;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('shapeKind lạ bị từ chối', () => {
    const doc = makeAdjacentFixture() as unknown as { pieces: Array<{ shapeKind: string }> };
    doc.pieces[0].shapeKind = 'hexagon';
    expect(codes(doc)).toContain('invalid-shape-kind');
  });

  test('cells sửa tay lệch khỏi hình bị từ chối', () => {
    const doc = makeAdjacentFixture();
    doc.pieces[0].cells = doc.pieces[0].cells.slice(1);
    expect(codes(doc)).toContain('shape-cells-mismatch');
  });

  test('fixture kỹ thuật theo quy tắc ô biên mới: 800 ô mỗi thoi, hợp lệ', () => {
    const doc = makeAdjacentFixture();
    expect(doc.pieces.map((p) => p.cells.length)).toEqual([800, 800]);
    expect(validateLevel(doc).ok).toBe(true);
  });
});

describe('Hình tròn, bình hành và khung theo loại hình (spec A)', () => {
  function oneShape(
    shapeKind: LevelSource['pieces'][number]['shapeKind'],
    orientation: LevelSource['pieces'][number]['orientation'],
    frameSize: number
  ): LevelSource {
    return {
      id: 'test-shape',
      title: 'Hình thử',
      chapter: 2,
      order: 7,
      contentRevision: 't1',
      rotationEnabled: false,
      pieces: [{ id: 'P1', shapeKind, orientation, frameSize, anchors: [{ id: 'A', x: 32, y: 48 }] }],
      sampleSolutions: [[{ pieceId: 'P1', anchorId: 'A', turns: 0 }]],
      learningObjective: 'thử',
      difficultyEstimate: 1,
      distractors: [],
      ftueSteps: [],
    };
  }

  function codes(doc: unknown): string[] {
    const result = validateLevel(doc);
    return result.ok ? [] : result.issues.map((i) => i.code);
  }

  test('hình tròn và bình hành hợp lệ mang đúng shapeKind/orientation', () => {
    const circle = validateLevel(buildLevelDocument(oneShape('circle', 0, 64)));
    expect(circle.ok).toBe(true);
    const para = validateLevel(buildLevelDocument(oneShape('parallelogram', 2, 48)));
    expect(para.ok).toBe(true);
    if (para.ok) {
      expect(para.level.pieces[0].shapeKind).toBe('parallelogram');
      expect(para.level.pieces[0].orientation).toBe(2);
    }
  });

  test('bình hành thiếu orientation bị từ chối; hình tròn hướng 1 bị từ chối', () => {
    const para = buildLevelDocument(oneShape('parallelogram', 1, 48));
    delete para.pieces[0].orientation;
    expect(codes(para)).toContain('invalid-orientation');
    const circle = buildLevelDocument(oneShape('circle', 0, 32));
    (circle.pieces[0] as { orientation?: number }).orientation = 1;
    expect(codes(circle)).toContain('invalid-orientation');
  });

  test('khung sai cấu trúc bị từ chối với invalid-frame-for-shape', () => {
    const para = buildLevelDocument(oneShape('parallelogram', 0, 48));
    para.pieces[0].frameSize = 32;
    expect(codes(para)).toContain('invalid-frame-for-shape');
    const circle = buildLevelDocument(oneShape('circle', 0, 16));
    circle.pieces[0].frameSize = 15;
    expect(codes(circle)).toContain('invalid-frame-for-shape');
  });

  test('fixture kỹ thuật thoi khung 40 vẫn hợp lệ (khung đúng cấu trúc)', () => {
    expect(validateLevel(makeAdjacentFixture()).ok).toBe(true);
  });
});

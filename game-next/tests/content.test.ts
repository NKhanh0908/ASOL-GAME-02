import { describe, expect, test } from 'vitest';
import { makeAdjacentFixture } from '../src/content/fixtures.ts';
import { validateLevel } from '../src/content/validate.ts';
import { campaignManifest } from '../src/content/manifest.ts';

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
    // Đặt D2 cùng neo với D1 (24, 76) khiến 2 mảnh đè lên nhau
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
    expect(campaignManifest[17].id).toBe('3-6');
    for (const entry of campaignManifest) {
      expect(entry.status).toBe('planned');
    }
  });
});

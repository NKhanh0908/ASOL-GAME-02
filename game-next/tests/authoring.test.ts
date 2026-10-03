import { describe, expect, test } from 'vitest';
import rawSongTinh from '../src/content/levels/1-1.json';
import { buildLevelDocument, checkSourceGeometry } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

const songTinh = LEVEL_SOURCES['1-1'];

function cloneSource(source: LevelSource): LevelSource {
  return structuredClone(source);
}

describe('buildLevelDocument', () => {
  test('tạo lại 1-1 cho đúng file đã commit', () => {
    expect(buildLevelDocument(songTinh)).toEqual(rawSongTinh);
  });

  test('1-1 v2: mỗi thoi 1.152 ô, mục tiêu 2.304 ô, qua validator', () => {
    const doc = buildLevelDocument(songTinh);
    expect(doc.contentRevision).toBe('song-tinh-v2');
    expect(doc.pieces.map((p) => p.cells.length)).toEqual([1152, 1152]);
    expect(doc.targetCells).toHaveLength(2304);
    expect(validateLevel(doc).ok).toBe(true);
  });

  test('targetCells sắp theo y rồi x, không trùng', () => {
    const cells = buildLevelDocument(songTinh).targetCells;
    for (let i = 1; i < cells.length; i++) {
      const [px, py] = cells[i - 1];
      const [x, y] = cells[i];
      expect(y > py || (y === py && x > px)).toBe(true);
    }
  });

  test('tam giác ghi orientation, vuông và thoi thì không', () => {
    const source: LevelSource = {
      ...cloneSource(songTinh),
      pieces: [
        { id: 'T1', shapeKind: 'triangle', orientation: 2, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }] },
        { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'T1', anchorId: 'A', turns: 0 },
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    const doc = buildLevelDocument(source);
    expect(doc.pieces[0].orientation).toBe(2);
    expect('orientation' in doc.pieces[1]).toBe(false);
  });

  test('từ chối neo không phải bội của 8', () => {
    const bad = cloneSource(songTinh);
    bad.pieces[0].anchors[0].x = 17;
    expect(checkSourceGeometry(bad)).toHaveLength(1);
    expect(() => buildLevelDocument(bad)).toThrow(/bội của 8/);
  });

  test('từ chối khung vượt biên bàn', () => {
    const bad = cloneSource(songTinh);
    bad.pieces[1].anchors[0].x = 88;
    expect(() => buildLevelDocument(bad)).toThrow(/vượt biên/);
  });

  test('từ chối nghiệm trỏ tới neo không tồn tại', () => {
    const bad = cloneSource(songTinh);
    bad.sampleSolutions[0][0].anchorId = 'Z';
    expect(() => buildLevelDocument(bad)).toThrow(/không tồn tại/);
  });

  test('từ chối khung không bám lưới theo loại hình', () => {
    const diamond24 = cloneSource(songTinh);
    diamond24.pieces[0].frameSize = 24;
    expect(() => buildLevelDocument(diamond24)).toThrow(/khung 24 không hợp lệ cho diamond/);
    const square12 = cloneSource(songTinh);
    square12.pieces[0] = { ...square12.pieces[0], shapeKind: 'square', frameSize: 12 };
    expect(() => buildLevelDocument(square12)).toThrow(/khung 12 không hợp lệ cho square/);
  });

  test('bình hành ghi orientation, hình tròn thì không', () => {
    const source: LevelSource = {
      ...cloneSource(songTinh),
      pieces: [
        { id: 'P1', shapeKind: 'parallelogram', orientation: 3, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }] },
        { id: 'C1', shapeKind: 'circle', orientation: 0, frameSize: 32, anchors: [{ id: 'A', x: 72, y: 64 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'P1', anchorId: 'A', turns: 0 },
          { pieceId: 'C1', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    const doc = buildLevelDocument(source);
    expect(doc.pieces[0].orientation).toBe(3);
    expect('orientation' in doc.pieces[1]).toBe(false);
  });
});

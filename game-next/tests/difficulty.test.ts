import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import { searchSolutions } from '../src/content/authoringReport.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import {
  DIFFICULTY_THRESHOLDS,
  DIFFICULTY_WEIGHTS,
  scoreDifficulty,
} from '../src/content/difficulty.ts';

function squareCells(size: number) {
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      cells.push([x, y]);
    }
  }
  return cells;
}

describe('scoreDifficulty - Fixture tay', () => {
  test('single: một mảnh vuông 16, không chồng lấn, điểm 1', () => {
    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-single',
      title: 'Single',
      chapter: 2,
      order: 1,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      learningObjective: 'test',
      difficultyEstimate: 1,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
      ],
      targetCells: squareCells(16),
      sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
      distractors: [],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [1],
      elapsedMs: 1,
      distractors: [],
    };

    const res = scoreDifficulty(doc, report);
    expect(res.parts.pieces).toBe(0);
    expect(res.parts.choices).toBe(0);
    expect(res.parts.hollow).toBe(0);
    expect(res.parts.revive).toBe(0);
    expect(res.parts.nearMiss).toBe(0);
    expect(res.parts.hiddenEdges).toBe(0);
    expect(res.raw).toBe(0);
    expect(res.score).toBe(1);
  });

  test('pair: hai mảnh vuông 16 chồng một nửa, có gây nhiễu, điểm 1', () => {
    const s1Cells = squareCells(16);
    const s2Cells = squareCells(16);

    // Target là XOR của S1(0,0) và S2(8,0)
    // S1: [0, 15] x [0, 15], S2: [8, 23] x [0, 15]
    // XOR: [0, 7] x [0, 15] và [16, 23] x [0, 15] -> 256 cells
    const targetCells: Array<[number, number]> = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 8; x++) targetCells.push([x, y]);
      for (let x = 16; x < 24; x++) targetCells.push([x, y]);
    }

    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-pair',
      title: 'Pair',
      chapter: 2,
      order: 2,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      learningObjective: 'test',
      difficultyEstimate: 1,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 16,
          cells: s1Cells,
          anchors: [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 0, y: 8 },
          ],
          color: 'amber',
        },
        {
          id: 'S2',
          shapeKind: 'square',
          frameSize: 16,
          cells: s2Cells,
          anchors: [{ id: 'A', x: 8, y: 0 }],
          color: 'amber',
        },
      ],
      targetCells,
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [{ pieceId: 'S1', anchorId: 'B', reason: 'gây nhiễu' }],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [2, 1],
      elapsedMs: 1,
      distractors: [{ pieceId: 'S1', anchorId: 'B', reason: 'gây nhiễu', changedCells: 256 }],
    };

    const res = scoreDifficulty(doc, report);
    expect(res.parts.pieces).toBeCloseTo(1 / 6, 6);
    expect(res.parts.choices).toBeCloseTo(1 / 20, 6);
    expect(res.parts.hollow).toBeCloseTo(1 / 3, 6);
    expect(res.parts.revive).toBe(0);
    expect(res.parts.nearMiss).toBe(0);
    expect(res.parts.hiddenEdges).toBeCloseTo(32 / 128, 6);
    expect(res.raw).toBeCloseTo(31 / 240, 6);
    expect(res.score).toBe(1);
  });

  test('triple: 3 mảnh, có ô 3 lớp (revive), điểm 2', () => {
    // S1: 16x16 (0,0)
    // S2: 16x16 (8,0)
    // S3: 32x32 (0,0)
    // Layer counts:
    // [0, 7] x [0, 15]: S1 + S3 = 2
    // [8, 15] x [0, 15]: S1 + S2 + S3 = 3 (revive, 128 cells)
    // [16, 23] x [0, 15]: S2 + S3 = 2
    // còn lại của S3: 1 lớp
    // Target cells: những ô lớp lẻ = 128 (3 lớp) + 640 (1 lớp) = 768 cells
    const targetCells: Array<[number, number]> = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const inS1 = x < 16 && y < 16;
        const inS2 = x >= 8 && x < 24 && y < 16;
        const inS3 = true;
        const count = (inS1 ? 1 : 0) + (inS2 ? 1 : 0) + (inS3 ? 1 : 0);
        if (count % 2 === 1) targetCells.push([x, y]);
      }
    }

    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-triple',
      title: 'Triple',
      chapter: 2,
      order: 3,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      learningObjective: 'test',
      difficultyEstimate: 2,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
        {
          id: 'S2',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 8, y: 0 }],
          color: 'amber',
        },
        {
          id: 'S3',
          shapeKind: 'square',
          frameSize: 32,
          cells: squareCells(32),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
      ],
      targetCells,
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
          { pieceId: 'S3', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [1, 1, 1],
      elapsedMs: 1,
      distractors: [],
    };

    const res = scoreDifficulty(doc, report);
    expect(res.parts.pieces).toBeCloseTo(2 / 6, 6);
    expect(res.parts.choices).toBe(0);
    expect(res.parts.hollow).toBeCloseTo(1 / 4, 6);
    expect(res.parts.revive).toBeCloseTo(1 / 6, 6);
    expect(res.parts.nearMiss).toBe(0);
    expect(res.parts.hiddenEdges).toBeCloseTo(0.3125, 6);
    expect(res.raw).toBeCloseTo(41 / 240, 6);
    expect(res.score).toBe(2);
  });

  test('free: đặt tự do, S1 khung 32 (0,0), S2 khung 16 (8,8), điểm 3', () => {
    // S1 khung 32 (0,0), S2 khung 16 (8,8)
    // S2 lọt trong S1 -> 256 ô 2 lớp, 768 ô 1 lớp (target)
    const targetCells: Array<[number, number]> = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const inS2 = x >= 8 && x < 24 && y >= 8 && y < 24;
        if (!inS2) targetCells.push([x, y]);
      }
    }

    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-free',
      title: 'Free',
      chapter: 2,
      order: 4,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      placement: 'free',
      learningObjective: 'test',
      difficultyEstimate: 3,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 32,
          cells: squareCells(32),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
        {
          id: 'S2',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 8, y: 8 }],
          color: 'amber',
        },
      ],
      targetCells,
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [221, 285],
      elapsedMs: 1,
      distractors: [],
    };

    const res = scoreDifficulty(doc, report);
    expect(res.parts.pieces).toBeCloseTo(1 / 6, 6);
    expect(res.parts.choices).toBeCloseTo(Math.log2(62985) / 20, 6);
    expect(res.parts.hollow).toBeCloseTo(1 / 4, 6);
    expect(res.parts.revive).toBe(0);
    expect(res.parts.nearMiss).toBeCloseTo(1 - 256 / 768, 6);
    expect(res.parts.hiddenEdges).toBe(0);
    expect(res.raw).toBeCloseTo(0.357617, 5);
    expect(res.score).toBe(3);
  });

  test('nearMiss màn free: bỏ qua các hướng làm mảnh vượt biên bàn', () => {
    // Đặt mảnh sát mép trên-trái (0,0): hướng dx=-8 và dy=-8 sẽ vượt biên bàn
    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-free-corner',
      title: 'Free Corner',
      chapter: 2,
      order: 5,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      placement: 'free',
      learningObjective: 'test',
      difficultyEstimate: 1,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
      ],
      targetCells: squareCells(16),
      sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
      distractors: [],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [100],
      elapsedMs: 1,
      distractors: [],
    };

    const res = scoreDifficulty(doc, report);
    // Ở góc (0,0), chỉ dịch được sang phải (8,0) và xuống dưới (0,8).
    // Mỗi hướng làm đổi 128 ô (256 - 128 = 128 overlap). Số ô đổi = 128 + 128 = 256.
    // minChanged = 256, target = 256 -> nearMiss = 1 - 256/256 = 0.
    expect(res.parts.nearMiss).toBe(0);
  });

  test('hiddenEdges: mép ngoài bàn cờ coi là không phải mục tiêu', () => {
    // Mảnh ở sát mép (0,0), toàn bộ biên ngoài bàn (nx < 0 hoặc ny < 0) coi là non-target
    const doc: LevelDocument = {
      schemaVersion: 1,
      id: 'fixture-border',
      title: 'Border',
      chapter: 2,
      order: 6,
      contentRevision: 'rev-1',
      board: { width: 128, height: 160 },
      rotationEnabled: false,
      learningObjective: 'test',
      difficultyEstimate: 1,
      pieces: [
        {
          id: 'S1',
          shapeKind: 'square',
          frameSize: 16,
          cells: squareCells(16),
          anchors: [{ id: 'A', x: 0, y: 0 }],
          color: 'amber',
        },
      ],
      // Target là rỗng (0 ô) để thử biên: C_in là non-target, C_out là non-target -> hidden!
      targetCells: [],
      sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
      distractors: [],
      ftueSteps: [],
    };

    const report = {
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [1],
      elapsedMs: 1,
      distractors: [],
    };

    const res = scoreDifficulty(doc, report);
    // Khi target rỗng: mọi ô trên bàn và ngoài bàn đều là non-target.
    // Vì vậy inTarget (false) === outTarget (false) với toàn bộ 64 đoạn biên -> hiddenEdges = 1.
    expect(res.parts.hiddenEdges).toBe(1);
  });
});

describe('scoreDifficulty - Hiệu chỉnh 6 màn Chương 1', () => {
  const EXPECTED_CH1: Record<
    string,
    {
      pieces: number;
      choices: number;
      hollow: number;
      revive: number;
      nearMiss: number;
      hiddenEdges: number;
      raw: number;
      score: 1 | 2 | 3 | 4 | 5;
    }
  > = {
    '1-1': {
      pieces: 1 / 6,
      choices: 2 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 1280 / 2304,
      hiddenEdges: 0 / 380,
      raw: 0.125,
      score: 1,
    },
    '1-2': {
      pieces: 1 / 6,
      choices: 2 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 352 / 2880,
      hiddenEdges: 94 / 334,
      raw: 0.2463,
      score: 2,
    },
    '1-3': {
      pieces: 1 / 6,
      choices: 2 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 2256 / 2304,
      hiddenEdges: 0 / 380,
      raw: 0.0615,
      score: 1,
    },
    '1-4': {
      pieces: 2 / 6,
      choices: 3 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 352 / 4032,
      hiddenEdges: 4 / 524,
      raw: 0.2426,
      score: 2,
    },
    '1-5': {
      pieces: 2 / 6,
      choices: 2 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 696 / 4560,
      hiddenEdges: 188 / 568,
      raw: 0.285,
      score: 3,
    },
    '1-6': {
      pieces: 2 / 6,
      choices: 3 / 20,
      hollow: 0,
      revive: 0,
      nearMiss: 1 - 704 / 3456,
      hiddenEdges: 188 / 570,
      raw: 0.2896,
      score: 3,
    },
  };

  for (const [id, expected] of Object.entries(EXPECTED_CH1)) {
    test(`Màn ${id} khớp chính xác các thành phần và điểm độ khó`, () => {
      const source = LEVEL_SOURCES[id];
      expect(source).toBeDefined();
      const doc = buildLevelDocument(source);
      const report = searchSolutions(doc);
      const res = scoreDifficulty(doc, report);

      expect(res.parts.pieces).toBeCloseTo(expected.pieces, 4);
      expect(res.parts.choices).toBeCloseTo(expected.choices, 4);
      expect(res.parts.hollow).toBeCloseTo(expected.hollow, 4);
      expect(res.parts.revive).toBeCloseTo(expected.revive, 4);
      expect(res.parts.nearMiss).toBeCloseTo(expected.nearMiss, 4);
      expect(res.parts.hiddenEdges).toBeCloseTo(expected.hiddenEdges, 4);
      expect(res.raw).toBeCloseTo(expected.raw, 4);
      expect(res.score).toBe(expected.score);
    });
  }
});

import { buildLevelDocument } from './authoring.ts';
import type { LevelSource } from './authoring.ts';

/**
 * Màn thử dựng lúc chạy, chỉ có trên dev server và chỉ ở chế độ harness.
 * Không vào manifest, không hiện trên bản đồ, không có file JSON.
 */
const shapesV2: LevelSource = {
  id: 'dev-shapes-v2',
  title: 'Thử hình v2',
  chapter: 2,
  order: 999,
  contentRevision: 'dev-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [{ id: 'A', x: 16, y: 48 }],
    },
    {
      id: 'C2',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [{ id: 'A', x: 48, y: 48 }],
    },
    {
      id: 'P1',
      shapeKind: 'parallelogram',
      orientation: 0,
      frameSize: 48,
      anchors: [{ id: 'A', x: 40, y: 104 }],
    },
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 0,
      frameSize: 24,
      anchors: [{ id: 'A', x: 8, y: 8 }],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
      { pieceId: 'P1', anchorId: 'A', turns: 0 },
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Kiểm tra hình tròn, bình hành và tam giác nhỏ trên bàn',
  difficultyEstimate: 1,
  distractors: [],
  ftueSteps: [],
  victoryVerse: 'Hình mới đã vào khuôn.',
};

export const DEV_LEVEL_DOCUMENTS: Readonly<Record<string, unknown>> = import.meta.env.DEV
  ? { [shapesV2.id]: buildLevelDocument(shapesV2) }
  : {};

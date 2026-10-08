import type { LevelSource } from '../authoring.ts';

export const manMau11: LevelSource = {
  id: 'mau-1-1',
  title: 'Màn mau-1-1',
  chapter: 1,
  order: 1,
  contentRevision: 'man-mau-1-1-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 16, y: 72 },
      ],
    },
    {
      id: 'D2',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 56 },
        { id: 'B', x: 64, y: 72 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Kéo hai mảnh tiếp giáp đỉnh, không xếp chồng',
  difficultyEstimate: 1,
  distractors: [
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch trục ngang' },
    { pieceId: 'D2', anchorId: 'B', reason: 'Lệch trục ngang' },
  ],
  ftueSteps: [
    { id: 'drag-first', trigger: 'idle', end: 'drag-start', text: 'Kéo mảnh vào bóng mục tiêu' },
  ],
  victoryVerse: 'Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.',
};

import type { LevelSource } from '../authoring.ts';

/**
 * 1-4 Ngọn Hải Đăng: ba tầng theo trục đứng x = 64 — mái, đèn thoi, đế vuông.
 * Đỉnh thoi chạm đáy mái tại (64, 48); đáy thoi chạm cạnh trên đế tại (64, 96).
 */
export const haiDang: LevelSource = {
  id: '1-4',
  title: 'Ngọn Hải Đăng',
  chapter: 1,
  order: 4,
  contentRevision: 'hai-dang-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 0 },
        { id: 'B', x: 48, y: 0 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 48 },
        { id: 'B', x: 48, y: 48 },
      ],
    },
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 96 },
        { id: 'B', x: 48, y: 96 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép ba khối tiếp giáp theo trục đứng',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Mái lệch ngang' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Đèn lệch ngang' },
    { pieceId: 'S1', anchorId: 'B', reason: 'Đế lệch ngang' },
  ],
  ftueSteps: [],
  victoryVerse: 'Ngọn hải đăng thắp sáng, thuyền lạc tìm thấy lối về.',
};

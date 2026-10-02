import type { LevelSource } from '../authoring.ts';

/**
 * 1-3 Cánh Chim Báo Điềm: đôi cánh giương, mũi cánh ở góc trên ngoài (16, 56)
 * và (112, 56), hai cạnh huyền dốc vào giữa và chạm nhau tại (64, 104).
 * Hai cánh chạm tại một đỉnh chứ không chung cạnh dọc (spec D6). Mỗi cánh có
 * neo phụ ở bên kia: đổi chỗ hai cánh cho ra hình kim tự tháp, sai bóng.
 */
export const canhChim: LevelSource = {
  id: '1-3',
  title: 'Cánh Chim Báo Điềm',
  chapter: 1,
  order: 3,
  contentRevision: 'canh-chim-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'W1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 64, y: 56 },
      ],
    },
    {
      id: 'W2',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 56 },
        { id: 'B', x: 16, y: 56 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'W1', anchorId: 'A', turns: 0 },
      { pieceId: 'W2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Tự so bóng mục tiêu và đặt hai cánh đối xứng đúng bên',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'W1', anchorId: 'B', reason: 'Cánh trái đặt sang bên phải' },
    { pieceId: 'W2', anchorId: 'B', reason: 'Cánh phải đặt sang bên trái' },
  ],
  ftueSteps: [],
  victoryVerse: 'Đôi cánh mở ra, điềm lành bay về phương bắc.',
};

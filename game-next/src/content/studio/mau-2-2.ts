import type { LevelSource } from '../authoring.ts';

export const canhBuom: LevelSource = {
  id: 'mau-2-2',
  title: 'Cánh Bướm',
  chapter: 2,
  order: 8,
  contentRevision: 'canh-buom-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 24, y: 40 },
        { id: 'B', x: 16, y: 40 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 24, y: 32 },
      ],
    },
    {
      id: 'T2',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 8, y: 40 },
        { id: 'B', x: 16, y: 40 },
        { id: 'C', x: 8, y: 48 },
        { id: 'D', x: 8, y: 32 },
      ],
    },
    {
      id: 'T3',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 40, y: 40 },
      ],
    },
    {
      id: 'T4',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 24, y: 40 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
      { pieceId: 'T3', anchorId: 'A', turns: 0 },
      { pieceId: 'T4', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Chủ động căn độ sâu giao để tạo khoảng rỗng cân bằng',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T2', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
  ],
  ftueSteps: [
    { id: 'overlap-depth', trigger: 'idle', end: 'drag-start', text: 'Để hai cánh chồng nhau vừa đủ sâu' },
  ],
  victoryVerse: 'Đôi cánh chạm nhau, để lại một khoảng lặng.',
};

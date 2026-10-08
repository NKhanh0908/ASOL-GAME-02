import type { LevelSource } from '../authoring.ts';

export const thapTienTriMoRong: LevelSource = {
  id: 'mau-1-2',
  title: 'Tháp Tiên Tri Mở Rộng',
  chapter: 1,
  order: 2,
  contentRevision: 'thap-tien-tri-mo-rong-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 48 },
      ],
    },
    {
      id: 'T2',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 48 },
      ],
    },
    {
      id: 'T3',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 24, y: 72 },
      ],
    },
    {
      id: 'T4',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 72, y: 72 },
      ],
    },
    {
      id: 'T5',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 72 },
      ],
    },
    {
      id: 'T6',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 72 },
      ],
    },
    {
      id: 'T7',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 72 },
      ],
    },
    {
      id: 'T8',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 8, y: 88 },
      ],
    },
    {
      id: 'T9',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 88, y: 88 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
      { pieceId: 'T3', anchorId: 'A', turns: 0 },
      { pieceId: 'T4', anchorId: 'A', turns: 0 },
      { pieceId: 'T5', anchorId: 'A', turns: 0 },
      { pieceId: 'T6', anchorId: 'A', turns: 0 },
      { pieceId: 'T7', anchorId: 'A', turns: 0 },
      { pieceId: 'T8', anchorId: 'A', turns: 0 },
      { pieceId: 'T9', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Phối hợp hai hình khối khác nhau thành một biểu tượng',
  difficultyEstimate: 1,
  distractors: [],
  ftueSteps: [
    { id: 'combine-shapes', trigger: 'idle', end: 'drag-start', text: 'Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu' },
  ],
  victoryVerse: 'Tháp vươn lên trời, lời tiên tri có chỗ đứng.',
};

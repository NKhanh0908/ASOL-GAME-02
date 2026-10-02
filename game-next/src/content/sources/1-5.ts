import type { LevelSource } from '../authoring.ts';

/**
 * 1-5 Chiếc Thuyền Sao: thân vuông, mũi thuyền áp cạnh phải thân (x = 64) với
 * cạnh huyền vát về phía sau, buồm có đáy nằm trên mép trên của thân và mũi
 * (y = 80), cột buồm tại x = 40. Thân chỉ có một neo: thân bắt đầu ở x = 16
 * nên không còn chỗ đặt mũi bên trái.
 */
export const thuyenSao: LevelSource = {
  id: '1-5',
  title: 'Chiếc Thuyền Sao',
  chapter: 1,
  order: 5,
  contentRevision: 'thuyen-sao-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [{ id: 'A', x: 16, y: 80 }],
    },
    {
      id: 'P1',
      shapeKind: 'triangle',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 80 },
        { id: 'B', x: 64, y: 88 },
      ],
    },
    {
      id: 'L1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 32 },
        { id: 'B', x: 48, y: 32 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'P1', anchorId: 'A', turns: 0 },
      { pieceId: 'L1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép thân, mũi và buồm tiếp giáp cạnh thành con thuyền',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'P1', anchorId: 'B', reason: 'Mũi thuyền lệch dọc' },
    { pieceId: 'L1', anchorId: 'B', reason: 'Buồm lệch ngang' },
  ],
  ftueSteps: [],
  victoryVerse: 'Thuyền sao giương buồm, dải ngân hà mở lối.',
};

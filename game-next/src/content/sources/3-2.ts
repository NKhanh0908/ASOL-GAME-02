import type { LevelSource } from '../authoring.ts';

/** 3-2 Đền Tiên Tri: mái, thân, cửa vuông và cửa sổ tròn theo spec C. */
export const denTienTri: LevelSource = {
  id: '3-2', title: 'Đền Tiên Tri', chapter: 3, order: 14,
  contentRevision: 'den-tien-tri-v1', rotationEnabled: false,
  pieces: [
    { id: 'R1', shapeKind: 'triangle', orientation: 4, frameSize: 96, anchors: [{ id: 'A', x: 16, y: 0 }, { id: 'B', x: 24, y: 0 }, { id: 'C', x: 8, y: 0 }, { id: 'D', x: 16, y: 8 }] },
    { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 64, anchors: [{ id: 'A', x: 32, y: 96 }, { id: 'B', x: 40, y: 96 }, { id: 'C', x: 24, y: 96 }, { id: 'D', x: 32, y: 88 }] },
    { id: 'S2', shapeKind: 'square', orientation: 0, frameSize: 32, anchors: [{ id: 'A', x: 48, y: 128 }, { id: 'B', x: 56, y: 128 }, { id: 'C', x: 40, y: 128 }, { id: 'D', x: 48, y: 120 }] },
    { id: 'C1', shapeKind: 'circle', orientation: 0, frameSize: 16, anchors: [{ id: 'A', x: 56, y: 72 }, { id: 'B', x: 64, y: 72 }, { id: 'C', x: 48, y: 72 }, { id: 'D', x: 56, y: 80 }] },
  ],
  sampleSolutions: [[{ pieceId: 'R1', anchorId: 'A', turns: 0 }, { pieceId: 'S1', anchorId: 'A', turns: 0 }, { pieceId: 'S2', anchorId: 'A', turns: 0 }, { pieceId: 'C1', anchorId: 'A', turns: 0 }]],
  learningObjective: 'Khoét chi tiết rỗng vào khối đặc', difficultyEstimate: 2,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'R1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'R1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'S1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'S2', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'S2', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'S2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [], victoryVerse: 'Cửa đền mở, ánh sáng lọt qua ô cửa tròn.',
};

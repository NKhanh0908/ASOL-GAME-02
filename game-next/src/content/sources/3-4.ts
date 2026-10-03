import type { LevelSource } from '../authoring.ts';

/** 3-4 Ngọn Nến: thân vuông, quầng tròn và ngọn lửa thoi âm bản theo spec C. */
export const ngonNen: LevelSource = {
  id: '3-4', title: 'Ngọn Nến', chapter: 3, order: 16,
  contentRevision: 'ngon-nen-v1', rotationEnabled: false,
  pieces: [
    { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 32, anchors: [{ id: 'A', x: 48, y: 96 }, { id: 'B', x: 56, y: 96 }, { id: 'C', x: 40, y: 96 }, { id: 'D', x: 48, y: 104 }] },
    { id: 'S2', shapeKind: 'square', orientation: 0, frameSize: 32, anchors: [{ id: 'A', x: 48, y: 128 }, { id: 'B', x: 56, y: 128 }, { id: 'C', x: 40, y: 128 }, { id: 'D', x: 48, y: 120 }] },
    { id: 'D1', shapeKind: 'diamond', orientation: 0, frameSize: 32, anchors: [{ id: 'A', x: 48, y: 56 }, { id: 'B', x: 56, y: 56 }, { id: 'C', x: 40, y: 56 }, { id: 'D', x: 48, y: 64 }] },
    { id: 'C1', shapeKind: 'circle', orientation: 0, frameSize: 64, anchors: [{ id: 'A', x: 32, y: 40 }, { id: 'B', x: 40, y: 40 }, { id: 'C', x: 24, y: 40 }, { id: 'D', x: 32, y: 48 }] },
  ],
  sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }, { pieceId: 'S2', anchorId: 'A', turns: 0 }, { pieceId: 'D1', anchorId: 'A', turns: 0 }, { pieceId: 'C1', anchorId: 'A', turns: 0 }]],
  learningObjective: 'Nhìn ra hình âm bản (hình hiện bằng khoảng rỗng)', difficultyEstimate: 3,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S2', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'S2', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'S2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [], victoryVerse: 'Ngọn lửa không cháy, chỉ để lại hình bóng.',
};

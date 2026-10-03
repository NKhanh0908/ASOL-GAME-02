import type { LevelSource } from '../authoring.ts';

/** 3-3 Cá Chép Sao: thân thoi, đuôi tam giác, mắt tròn và miệng rỗng theo spec C. */
export const caChep: LevelSource = {
  id: '3-3', title: 'Cá Chép Sao', chapter: 3, order: 15,
  contentRevision: 'ca-chep-v1', rotationEnabled: false,
  pieces: [
    { id: 'D1', shapeKind: 'diamond', orientation: 0, frameSize: 64, anchors: [{ id: 'A', x: 40, y: 48 }, { id: 'B', x: 48, y: 48 }, { id: 'C', x: 32, y: 48 }, { id: 'D', x: 40, y: 56 }] },
    { id: 'T1', shapeKind: 'triangle', orientation: 5, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }, { id: 'B', x: 24, y: 56 }, { id: 'C', x: 8, y: 56 }, { id: 'D', x: 16, y: 64 }] },
    { id: 'C1', shapeKind: 'circle', orientation: 0, frameSize: 16, anchors: [{ id: 'A', x: 72, y: 64 }, { id: 'B', x: 80, y: 64 }, { id: 'C', x: 64, y: 64 }, { id: 'D', x: 72, y: 72 }] },
    { id: 'M1', shapeKind: 'triangle', orientation: 0, frameSize: 16, anchors: [{ id: 'A', x: 88, y: 72 }, { id: 'B', x: 96, y: 72 }, { id: 'C', x: 80, y: 72 }, { id: 'D', x: 88, y: 80 }] },
  ],
  sampleSolutions: [[{ pieceId: 'D1', anchorId: 'A', turns: 0 }, { pieceId: 'T1', anchorId: 'A', turns: 0 }, { pieceId: 'C1', anchorId: 'A', turns: 0 }, { pieceId: 'M1', anchorId: 'A', turns: 0 }]],
  learningObjective: 'Đặt chi tiết nhỏ chính xác trên khối lớn', difficultyEstimate: 3,
  distractors: [
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'T1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'T1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'M1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, { pieceId: 'M1', anchorId: 'C', reason: 'Lệch trái 8 ô' }, { pieceId: 'M1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [], victoryVerse: 'Cá chép bơi ngược dòng ngân hà.',
};

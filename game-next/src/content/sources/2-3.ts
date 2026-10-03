import type { LevelSource } from '../authoring.ts';

/**
 * 2-3 Trái Tim Tinh Thể: Nơ của 2-2 cộng viên ngọc thoi 16 đặt vào tâm rỗng: hạt nhân hiện lại giữa vòng rỗng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const traiTim: LevelSource = {
  id: '2-3', title: 'Trái Tim Tinh Thể', chapter: 2, order: 9,
  contentRevision: 'trai-tim-v1', rotationEnabled: false,
  pieces: [
    { id: 'T1', shapeKind: 'triangle', orientation: 5, frameSize: 96, anchors: [
      { id: 'A', x: 32, y: 32 }, { id: 'B', x: 24, y: 32 },
      { id: 'C', x: 32, y: 40 }, { id: 'D', x: 32, y: 24 },
    ] },
    { id: 'T2', shapeKind: 'triangle', orientation: 7, frameSize: 96, anchors: [
      { id: 'A', x: 0, y: 32 }, { id: 'B', x: 8, y: 32 },
      { id: 'C', x: 0, y: 40 }, { id: 'D', x: 0, y: 24 },
    ] },
    { id: 'C1', shapeKind: 'diamond', orientation: 0, frameSize: 16, anchors: [
      { id: 'A', x: 56, y: 72 }, { id: 'B', x: 64, y: 72 },
      { id: 'C', x: 48, y: 72 }, { id: 'D', x: 56, y: 80 },
    ] },
  ],
  sampleSolutions: [[
    { pieceId: 'T1', anchorId: 'A', turns: 0 },
    { pieceId: 'T2', anchorId: 'A', turns: 0 },
    { pieceId: 'C1', anchorId: 'A', turns: 0 },
  ]],
  learningObjective: 'Dự đoán được ba lớp thì vùng đó hiện lại',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T2', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [
    { id: 'third-layer', trigger: 'three-layers', end: 'drag-start', text: 'Thêm mảnh thứ ba: vùng đó hiện lại' },
  ],
  victoryVerse: 'Trong khoảng rỗng, một trái tim tinh thể bừng sáng.',
};

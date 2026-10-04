import { describe, expect, test } from 'vitest';
import { levelTemplate } from '../src/content/sources/_template.ts';
import {
  cloneLevelSource,
  computeDecoyReason,
  createInitialState,
  isDirty,
  studioReducer,
} from '../src/studio/state.ts';

describe('cloneLevelSource (spec E, ST-02)', () => {
  test('clone màn mẫu tạo nguồn mới với id, title, chapter, contentRevision mới', () => {
    const cloned = cloneLevelSource(levelTemplate, '2-9');
    expect(cloned.id).toBe('2-9');
    expect(cloned.title).toBe('Màn 2-9');
    expect(cloned.chapter).toBe(2);
    expect(cloned.contentRevision).toBe('man-2-9-v1');
    expect(cloned.order).toBe(levelTemplate.order);
    expect(cloned.pieces).toHaveLength(levelTemplate.pieces.length);
  });

  test('clone màn có id tự do giữ nguyên chapter nếu không có tiền tố chương', () => {
    const cloned = cloneLevelSource(levelTemplate, 'my-test-level');
    expect(cloned.id).toBe('my-test-level');
    expect(cloned.title).toBe('Màn my-test-level');
    expect(cloned.chapter).toBe(levelTemplate.chapter);
    expect(cloned.contentRevision).toBe('man-my-test-level-v1');
  });
});

describe('computeDecoyReason (spec E, ST-03)', () => {
  const anchorA = { x: 40, y: 56 };

  test('tính đúng lý do lệch theo 4 hướng và kết hợp', () => {
    expect(computeDecoyReason(anchorA, { x: 48, y: 56 })).toBe('Lệch phải 8 ô');
    expect(computeDecoyReason(anchorA, { x: 24, y: 56 })).toBe('Lệch trái 16 ô');
    expect(computeDecoyReason(anchorA, { x: 40, y: 64 })).toBe('Lệch xuống 8 ô');
    expect(computeDecoyReason(anchorA, { x: 40, y: 48 })).toBe('Lệch lên 8 ô');
    expect(computeDecoyReason(anchorA, { x: 48, y: 64 })).toBe('Lệch phải 8 ô, Lệch xuống 8 ô');
    expect(computeDecoyReason(anchorA, { x: 40, y: 56 })).toBe('Trùng neo A');
  });
});

describe('studioReducer và StudioState', () => {
  test('trạng thái ban đầu không dirty', () => {
    const state = createInitialState(levelTemplate);
    expect(isDirty(state)).toBe(false);
    expect(state.selectedPieceId).toBeNull();
  });

  test('thêm mảnh mới đặt giữa bàn, thêm nghiệm mẫu và chuyển sang dirty', () => {
    let state = createInitialState(levelTemplate);
    state = studioReducer(state, {
      type: 'add-piece',
      shapeKind: 'triangle',
      frameSize: 48,
      orientation: 0,
    });

    expect(isDirty(state)).toBe(true);
    expect(state.source.pieces).toHaveLength(2);
    const newPiece = state.source.pieces[1];
    expect(newPiece.shapeKind).toBe('triangle');
    expect(newPiece.frameSize).toBe(48);
    expect(state.selectedPieceId).toBe(newPiece.id);

    // Nghiệm mẫu có bước cho mảnh mới
    const sol = state.source.sampleSolutions[0];
    expect(sol.some((s) => s.pieceId === newPiece.id && s.anchorId === 'A')).toBe(true);
  });

  test('kéo mảnh di chuyển neo A và các neo nhiễu đi cùng delta', () => {
    let state = createInitialState(levelTemplate);
    const pieceId = state.source.pieces[0].id;
    state = studioReducer(state, {
      type: 'move-piece',
      id: pieceId,
      x: 32,
      y: 40,
    });

    expect(isDirty(state)).toBe(true);
    const p = state.source.pieces.find((x) => x.id === pieceId)!;
    expect(p.anchors[0]).toEqual({ id: 'A', x: 32, y: 40 });
    // Neo B ban đầu lệch (+8, 0) đi theo (+8, 0) -> (40, 40)
    expect(p.anchors[1]).toEqual({ id: 'B', x: 40, y: 40 });
  });

  test('xoay mảnh đổi hướng trong cùng họ', () => {
    let state = createInitialState(levelTemplate);
    state = studioReducer(state, {
      type: 'add-piece',
      shapeKind: 'triangle',
      frameSize: 48,
      orientation: 0,
    });
    const pieceId = state.selectedPieceId!;

    state = studioReducer(state, { type: 'rotate-piece', id: pieceId });
    let p = state.source.pieces.find((x) => x.id === pieceId)!;
    expect(p.orientation).toBe(1);

    state = studioReducer(state, { type: 'rotate-piece', id: pieceId });
    p = state.source.pieces.find((x) => x.id === pieceId)!;
    expect(p.orientation).toBe(2);
  });

  test('lật gương mảnh đổi orientation và lật độ lệch neo nhiễu', () => {
    let state = createInitialState(levelTemplate);
    const pieceId = state.source.pieces[0].id;
    // Thêm tam giác hướng 0
    state = studioReducer(state, {
      type: 'add-piece',
      shapeKind: 'triangle',
      frameSize: 48,
      orientation: 0,
    });
    const tId = state.selectedPieceId!;
    state = studioReducer(state, { type: 'add-decoy', pieceId: tId });

    // Lật gương
    state = studioReducer(state, { type: 'mirror-piece', id: tId });
    const p = state.source.pieces.find((x) => x.id === tId)!;
    expect(p.orientation).toBe(1); // Tam giác 0 qua trục đứng lật thành 1
  });

  test('nhân bản mảnh chỉ nhân bản neo A với độ lệch (+8, +8)', () => {
    let state = createInitialState(levelTemplate);
    const p = state.source.pieces[0];
    const initialCount = state.source.pieces.length;

    state = studioReducer(state, { type: 'duplicate-piece', id: p.id });
    expect(state.source.pieces).toHaveLength(initialCount + 1);

    const dup = state.source.pieces[state.source.pieces.length - 1];
    expect(dup.id).not.toBe(p.id);
    expect(dup.anchors).toHaveLength(1);
    expect(dup.anchors[0].x).toBe(p.anchors[0].x + 8);
    expect(dup.anchors[0].y).toBe(p.anchors[0].y + 8);
  });

  test('xoá mảnh loại bỏ mảnh khỏi pieces, sampleSolutions và distractors', () => {
    let state = createInitialState(levelTemplate);
    const pId = state.source.pieces[0].id;

    state = studioReducer(state, { type: 'select-piece', id: pId });
    state = studioReducer(state, { type: 'delete-piece', id: pId });

    expect(state.source.pieces).toHaveLength(0);
    expect(state.source.sampleSolutions[0]).toHaveLength(0);
    expect(state.source.distractors).toHaveLength(0);
    expect(state.selectedPieceId).toBeNull();
  });

  test('thêm, di chuyển và xoá neo nhiễu cập nhật distractors', () => {
    let state = createInitialState(levelTemplate);
    const pId = state.source.pieces[0].id;

    state = studioReducer(state, { type: 'add-decoy', pieceId: pId });
    let p = state.source.pieces.find((x) => x.id === pId)!;
    expect(p.anchors.some((a) => a.id === 'C')).toBe(true);

    state = studioReducer(state, {
      type: 'move-decoy',
      pieceId: pId,
      anchorId: 'C',
      x: p.anchors[0].x + 16,
      y: p.anchors[0].y + 8,
    });
    const dis = state.source.distractors.find((d) => d.pieceId === pId && d.anchorId === 'C')!;
    expect(dis.reason).toBe('Lệch phải 16 ô, Lệch xuống 8 ô');

    state = studioReducer(state, { type: 'delete-decoy', pieceId: pId, anchorId: 'C' });
    p = state.source.pieces.find((x) => x.id === pId)!;
    expect(p.anchors.some((a) => a.id === 'C')).toBe(false);
    expect(state.source.distractors.some((d) => d.anchorId === 'C')).toBe(false);
  });

  test('chuyển sang placement free xoá toàn bộ neo nhiễu và distractors', () => {
    let state = createInitialState(levelTemplate);
    state = studioReducer(state, { type: 'set-placement', placement: 'free' });

    expect(state.source.placement).toBe('free');
    expect(state.source.distractors).toHaveLength(0);
    for (const p of state.source.pieces) {
      expect(p.anchors).toHaveLength(1);
      expect(p.anchors[0].id).toBe('A');
    }
  });

  test('tắt rotationEnabled đưa toàn bộ turns nghiệm về 0 và chuyển chapter về 1 nếu đang là 4', () => {
    let state = createInitialState(levelTemplate);
    state.source.chapter = 4;
    state.source.rotationEnabled = true;
    state.source.sampleSolutions[0][0].turns = 2;

    state = studioReducer(state, { type: 'set-rotation', enabled: false });
    expect(state.source.rotationEnabled).toBe(false);
    expect(state.source.chapter).toBe(1);
    expect(state.source.sampleSolutions[0][0].turns).toBe(0);
  });

  test('bật rotationEnabled tự động đồng bộ chapter sang 4', () => {
    let state = createInitialState(levelTemplate);
    expect(state.source.chapter).toBe(1);
    expect(state.source.rotationEnabled).toBe(false);

    state = studioReducer(state, { type: 'set-rotation', enabled: true });
    expect(state.source.rotationEnabled).toBe(true);
    expect(state.source.chapter).toBe(4);
  });

  test('đổi field chapter sang 4 tự động bật rotation, đổi về 1..3 tự động tắt rotation', () => {
    let state = createInitialState(levelTemplate);
    expect(state.source.rotationEnabled).toBe(false);

    state = studioReducer(state, { type: 'set-field', field: 'chapter', value: 4 });
    expect(state.source.chapter).toBe(4);
    expect(state.source.rotationEnabled).toBe(true);

    state.source.sampleSolutions[0][0].turns = 3;

    state = studioReducer(state, { type: 'set-field', field: 'chapter', value: 2 });
    expect(state.source.chapter).toBe(2);
    expect(state.source.rotationEnabled).toBe(false);
    expect(state.source.sampleSolutions[0][0].turns).toBe(0);
  });

  test('mark-saved đánh dấu đã lưu và xoá cờ dirty', () => {
    let state = createInitialState(levelTemplate);
    state = studioReducer(state, { type: 'set-field', field: 'title', value: 'Tiêu Đề Mới' });
    expect(isDirty(state)).toBe(true);

    state = studioReducer(state, { type: 'mark-saved' });
    expect(isDirty(state)).toBe(false);
  });
});

import { describe, expect, test } from 'vitest';
import { makeAdjacentFixture } from '../src/content/fixtures.ts';
import { validateLevel } from '../src/content/validate.ts';
import { createPuzzle } from '../src/domain/session.ts';
import { computeLayout, gridToCanvas } from '../src/presentation/layout.ts';
import { beginDrag, cancelDrag, finishDrag, updateDrag } from '../src/application/drag.ts';

describe('Hitbox, Layout and Drag Transactions', () => {
  const layout = computeLayout(720, 1280);
  const parsed = validateLevel(makeAdjacentFixture());
  if (!parsed.ok) throw new Error('fixture validation failed');
  const level = parsed.level;
  const pieceD1 = level.pieces.find((p) => p.id === 'D1')!;

  test('beginDrag lưu lại committedState và tính toán pointerOffset', () => {
    const state = createPuzzle(level);
    const drag = beginDrag(state, pieceD1, 300, 1000, layout);

    expect(drag.pieceId).toBe('D1');
    expect(drag.committedState).toEqual(state);
    expect(drag.originState).toEqual({ kind: 'tray', turns: 0 });
  });

  test('updateDrag nhận biết snapCandidateId khi ở gần neo và không mutate committedState', () => {
    const state = createPuzzle(level);
    // Neo A của D1 là (24, 76)
    const anchorCanvas = gridToCanvas(24, 76, layout);

    // Kéo từ khay lên bàn
    const drag = beginDrag(state, pieceD1, 200, 1000, layout);
    drag.pointerOffset = { x: 0, y: 0 };

    // Di chuyển tới đúng vị trí neo A
    const update = updateDrag(drag, level, anchorCanvas.x, anchorCanvas.y, layout);
    expect(update.snapCandidateId).toBe('A');
    expect(update.previewPlacement).toEqual({
      pieceId: 'D1',
      x: 24,
      y: 76,
      turns: 0,
    });
    // previewMask hiển thị preview
    expect(update.previewMask.some(Boolean)).toBe(true);

    // committedState gốc hoàn toàn không bị mutate
    expect(drag.committedState.pieces.D1).toEqual({ kind: 'tray', turns: 0 });
  });

  test('finishDrag thả vào khay (trayBounds) trả về outcome tray', () => {
    const state = createPuzzle(level);
    const drag = beginDrag(state, pieceD1, 300, 500, layout);
    drag.pointerOffset = { x: 0, y: 0 };

    // Thả tại giữa vùng khay: x=360, y=1050 (nằm trong trayBounds y=960..1160)
    const transition = finishDrag(drag, level, 360, 1050, layout);
    expect(transition.outcome).toBe('tray');
    expect(transition.state.pieces.D1).toEqual({ kind: 'tray', turns: 0 });
  });

  test('finishDrag gần neo thực hiện snap vào neo A', () => {
    const state = createPuzzle(level);
    const anchorCanvas = gridToCanvas(24, 76, layout);

    const drag = beginDrag(state, pieceD1, 200, 1000, layout);
    drag.pointerOffset = { x: 0, y: 0 };

    const transition = finishDrag(drag, level, anchorCanvas.x, anchorCanvas.y, layout);
    expect(transition.outcome).toBe('snapped');
    expect(transition.state.pieces.D1).toEqual({ kind: 'snapped', anchorId: 'A', turns: 0 });
  });

  test('finishDrag xa neo giữ ở vị trí tạm (temporary)', () => {
    const state = createPuzzle(level);
    const farCanvas = gridToCanvas(50, 150, layout);

    const drag = beginDrag(state, pieceD1, 200, 1000, layout);
    drag.pointerOffset = { x: 0, y: 0 };

    const transition = finishDrag(drag, level, farCanvas.x, farCanvas.y, layout);
    expect(transition.outcome).toBe('temporary');
    expect(transition.state.pieces.D1.kind).toBe('temporary');
  });

  test('cancelDrag phục hồi committedState nguyên vẹn', () => {
    const state = createPuzzle(level);
    const drag = beginDrag(state, pieceD1, 300, 500, layout);

    const transition = cancelDrag(drag, level);
    expect(transition.state).toEqual(state);
    expect(transition.state.pieces.D1).toEqual({ kind: 'tray', turns: 0 });
  });
});

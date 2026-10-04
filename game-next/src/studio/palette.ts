import type { Orientation, ShapeKind } from '../domain/model.ts';
import { isValidFrame } from '../domain/shapes.ts';
import type { StudioAction, StudioState } from './state.ts';

export type PaletteOptions = {
  getState: () => StudioState;
  dispatch: (action: StudioAction) => void;
};

export type Palette = {
  element: HTMLElement;
  render: () => void;
};

const ALL_SHAPES: Array<{ kind: ShapeKind; label: string }> = [
  { kind: 'square', label: 'Vuông' },
  { kind: 'triangle', label: 'Tam giác' },
  { kind: 'diamond', label: 'Thoi' },
  { kind: 'circle', label: 'Tròn' },
  { kind: 'parallelogram', label: 'Bình hành' },
];

const CANDIDATE_SIZES = [16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 112, 128];

export function createPalette(options: PaletteOptions): Palette {
  const container = document.createElement('div');
  container.className = 'studio-palette';
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.alignItems = 'center';
  container.style.gap = '10px';
  container.style.padding = '12px 16px';
  container.style.backgroundColor = '#13192f';
  container.style.borderBottom = '1px solid #1e294b';
  container.style.color = '#e2e8f0';

  let selectedKind: ShapeKind = 'square';
  let selectedOrientation: Orientation = 0;
  let selectedSize: number = 48;

  function updateValidSizes(): number[] {
    const valid = CANDIDATE_SIZES.filter((s) =>
      isValidFrame(selectedKind, selectedOrientation, s)
    );
    if (!valid.includes(selectedSize) && valid.length > 0) {
      selectedSize = valid[0];
    }
    return valid;
  }

  function render() {
    container.innerHTML = '';
    const state = options.getState();

    // 1. Shape selector buttons
    const shapeGroup = document.createElement('div');
    shapeGroup.style.display = 'flex';
    shapeGroup.style.gap = '4px';

    ALL_SHAPES.forEach(({ kind, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.padding = '6px 12px';
      btn.style.borderRadius = '4px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      btn.style.fontSize = '13px';
      if (selectedKind === kind) {
        btn.style.backgroundColor = '#38bdf8';
        btn.style.color = '#0b1022';
      } else {
        btn.style.backgroundColor = '#1e294b';
        btn.style.color = '#94a3b8';
      }
      btn.onclick = () => {
        selectedKind = kind;
        selectedOrientation = 0;
        updateValidSizes();
        render();
      };
      shapeGroup.appendChild(btn);
    });
    container.appendChild(shapeGroup);

    // 2. Size selector
    const validSizes = updateValidSizes();
    const sizeSelect = document.createElement('select');
    sizeSelect.style.padding = '6px 10px';
    sizeSelect.style.borderRadius = '4px';
    sizeSelect.style.backgroundColor = '#1e294b';
    sizeSelect.style.color = '#e2e8f0';
    sizeSelect.style.border = '1px solid #334155';
    sizeSelect.style.cursor = 'pointer';
    validSizes.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = String(s);
      opt.textContent = `Cỡ ${s}`;
      if (s === selectedSize) opt.selected = true;
      sizeSelect.appendChild(opt);
    });
    sizeSelect.onchange = () => {
      selectedSize = Number(sizeSelect.value);
    };
    container.appendChild(sizeSelect);

    // 3. Orientation selector (for triangle and parallelogram)
    const maxOri = selectedKind === 'triangle' ? 7 : selectedKind === 'parallelogram' ? 3 : 0;
    if (maxOri > 0) {
      const oriSelect = document.createElement('select');
      oriSelect.style.padding = '6px 10px';
      oriSelect.style.borderRadius = '4px';
      oriSelect.style.backgroundColor = '#1e294b';
      oriSelect.style.color = '#e2e8f0';
      oriSelect.style.border = '1px solid #334155';
      oriSelect.style.cursor = 'pointer';
      for (let o = 0; o <= maxOri; o++) {
        const opt = document.createElement('option');
        opt.value = String(o);
        opt.textContent = `Hướng ${o}`;
        if (o === selectedOrientation) opt.selected = true;
        oriSelect.appendChild(opt);
      }
      oriSelect.onchange = () => {
        selectedOrientation = Number(oriSelect.value) as Orientation;
        updateValidSizes();
        render();
      };
      container.appendChild(oriSelect);
    }

    // 4. Add piece button
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Thêm mảnh';
    addBtn.style.padding = '6px 14px';
    addBtn.style.borderRadius = '4px';
    addBtn.style.border = 'none';
    addBtn.style.backgroundColor = '#f59e0b';
    addBtn.style.color = '#000000';
    addBtn.style.fontWeight = 'bold';
    addBtn.style.cursor = 'pointer';
    addBtn.onclick = () => {
      options.dispatch({
        type: 'add-piece',
        shapeKind: selectedKind,
        frameSize: selectedSize,
        orientation: selectedOrientation,
      });
    };
    container.appendChild(addBtn);

    // Separator
    const sep = document.createElement('div');
    sep.style.width = '1px';
    sep.style.height = '24px';
    sep.style.backgroundColor = '#334155';
    container.appendChild(sep);

    // 5. Piece-specific controls
    const selId = state.selectedPieceId;
    if (selId) {
      const rotBtn = document.createElement('button');
      rotBtn.textContent = '↻ Xoay (R)';
      rotBtn.style.padding = '6px 10px';
      rotBtn.style.borderRadius = '4px';
      rotBtn.style.border = '1px solid #334155';
      rotBtn.style.backgroundColor = '#1e294b';
      rotBtn.style.color = '#e2e8f0';
      rotBtn.style.cursor = 'pointer';
      rotBtn.onclick = () => options.dispatch({ type: 'rotate-piece', id: selId });
      container.appendChild(rotBtn);

      const mirrorBtn = document.createElement('button');
      mirrorBtn.textContent = '⇆ Lật (Shift+R)';
      mirrorBtn.style.padding = '6px 10px';
      mirrorBtn.style.borderRadius = '4px';
      mirrorBtn.style.border = '1px solid #334155';
      mirrorBtn.style.backgroundColor = '#1e294b';
      mirrorBtn.style.color = '#e2e8f0';
      mirrorBtn.style.cursor = 'pointer';
      mirrorBtn.onclick = () => options.dispatch({ type: 'mirror-piece', id: selId });
      container.appendChild(mirrorBtn);

      if (state.source.placement !== 'free') {
        const decoyBtn = document.createElement('button');
        decoyBtn.textContent = '+ Neo nhiễu';
        decoyBtn.style.padding = '6px 10px';
        decoyBtn.style.borderRadius = '4px';
        decoyBtn.style.border = '1px solid #0284c7';
        decoyBtn.style.backgroundColor = '#0369a1';
        decoyBtn.style.color = '#ffffff';
        decoyBtn.style.cursor = 'pointer';
        decoyBtn.onclick = () => options.dispatch({ type: 'add-decoy', pieceId: selId });
        container.appendChild(decoyBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑 Xoá (Del)';
      delBtn.style.padding = '6px 10px';
      delBtn.style.borderRadius = '4px';
      delBtn.style.border = '1px solid #ef4444';
      delBtn.style.backgroundColor = '#991b1b';
      delBtn.style.color = '#ffffff';
      delBtn.style.cursor = 'pointer';
      delBtn.onclick = () => options.dispatch({ type: 'delete-piece', id: selId });
      container.appendChild(delBtn);
    }
  }

  render();

  return {
    element: container,
    render,
  };
}

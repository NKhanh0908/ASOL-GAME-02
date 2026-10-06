# E4 — Studio orientation picker and campaign round-trip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the studio's eight triangle orientations pickable by sight and correctable after placement, and let a campaign level edited in the studio be written back over its own source under a re-approval gate.

**Architecture:** Feature A extracts the orientation list and the frame-size filter out of `palette.ts` into a pure module that can be unit-tested without a DOM, then rebuilds the palette's orientation `<select>` as preview buttons and adds the same control to the inspector behind a new `set-orientation` action. Feature B adds an `overwrite` branch to `promoteStudioLevel` that skips the two registration calls, bumps the revision, downgrades the status, and re-injects the source file's hand-written comment block; the dev-server plugin and the studio library expose it as a button.

**Tech Stack:** TypeScript 5.7, Vitest 2 (node environment, **no jsdom in this repo**), Vite 6 dev-server plugin, inline SVG built with `document.createElementNS`.

**Spec:** `docs/superpowers/specs/2026-10-06-e4-studio-orientation-and-roundtrip-design.md`

## Global Constraints

- Node `>=24.13.1 <25`. All commands run from `game-next/`.
- **There is no jsdom or happy-dom dependency and this plan does not add one.** Anything that touches `document` is not unit-tested; all logic that needs a test must live in a pure module. This is why Task 1 exists.
- Code comments, error messages and UI copy in Vietnamese. Plan, spec and commit messages in English.
- `effectiveOrientation`, `mirrorOrientation`, `shapePolygon` and `studio/keys.ts` are **not** modified by any task in this plan.
- Triangle frame rule: orientations 0–3 need `frameSize % 8 === 0`, orientations 4–7 need `frameSize % 16 === 0`. Source of truth is `isValidFrame` in `src/domain/shapes.ts`; never re-implement it.
- `PieceSource` stores `orientation` and `frameSize`; **cells are not stored** and are derived by `authorLevel`. No reducer recomputes cells.
- Per `AGENTS.md`: run `impact({target, direction:"upstream"})` before editing a symbol, and `detect_changes()` before each commit.
- Every commit that changes code includes its `CHANGELOG.md` entry.

---

### Task 1: Pure orientation module

Extract the testable logic out of `palette.ts` so Tasks 2 and 4 can share it and so it can be tested without a DOM.

**Files:**
- Create: `game-next/src/studio/orientationOptions.ts`
- Test: `game-next/tests/studioOrientation.test.ts`

**Interfaces:**
- Consumes: `ShapeKind`, `Orientation` from `../domain/model.ts`; `isValidFrame`, `shapePolygon` from `../domain/shapes.ts`.
- Produces, relied on by Tasks 2 and 4:
  - `CANDIDATE_SIZES: readonly number[]`
  - `type OrientationFamily = { label: string; orientations: readonly Orientation[] }`
  - `orientationFamilies(kind: ShapeKind): readonly OrientationFamily[]` — `[]` when the kind has only orientation 0.
  - `validFrameSizes(kind: ShapeKind, orientation: Orientation): number[]`
  - `snapFrameSize(kind: ShapeKind, orientation: Orientation, current: number): number` — returns `current` when still valid, else the first valid size, else `current`.
  - `previewPoints(kind: ShapeKind, orientation: Orientation, boxSize: number): string` — an SVG `points` attribute value.

- [ ] **Step 1: Write the failing test**

Create `game-next/tests/studioOrientation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_SIZES,
  orientationFamilies,
  previewPoints,
  snapFrameSize,
  validFrameSizes,
} from '../src/studio/orientationOptions.ts';

describe('orientationFamilies', () => {
  it('chia tam giác thành hai họ Góc và Mái', () => {
    const families = orientationFamilies('triangle');
    expect(families).toHaveLength(2);
    expect(families[0].label).toBe('Góc');
    expect(families[0].orientations).toEqual([0, 1, 2, 3]);
    expect(families[1].label).toBe('Mái');
    expect(families[1].orientations).toEqual([4, 5, 6, 7]);
  });

  it('bình hành có một họ bốn hướng', () => {
    const families = orientationFamilies('parallelogram');
    expect(families).toHaveLength(1);
    expect(families[0].orientations).toEqual([0, 1, 2, 3]);
  });

  it('hình chỉ có hướng 0 thì không có họ nào', () => {
    expect(orientationFamilies('square')).toEqual([]);
    expect(orientationFamilies('diamond')).toEqual([]);
    expect(orientationFamilies('circle')).toEqual([]);
  });
});

describe('validFrameSizes', () => {
  it('họ Góc nhận bội của 8', () => {
    expect(validFrameSizes('triangle', 0)).toEqual(CANDIDATE_SIZES.filter((s) => s % 8 === 0));
    expect(validFrameSizes('triangle', 0)).toContain(40);
  });

  it('họ Mái chỉ nhận bội của 16', () => {
    const sizes = validFrameSizes('triangle', 4);
    expect(sizes).toEqual([16, 32, 48, 64, 80, 96, 112, 128]);
    expect(sizes).not.toContain(40);
  });
});

describe('snapFrameSize', () => {
  it('giữ nguyên cỡ còn hợp lệ', () => {
    expect(snapFrameSize('triangle', 4, 48)).toBe(48);
  });

  it('nhảy sang cỡ hợp lệ đầu tiên khi đổi sang họ Mái', () => {
    expect(snapFrameSize('triangle', 4, 40)).toBe(16);
  });
});

describe('previewPoints', () => {
  it('mái hướng lên có đỉnh ở giữa hộp', () => {
    expect(previewPoints('triangle', 4, 24)).toBe('0,24 24,24 12,12');
  });

  it('mái hướng xuống có đáy ở cạnh trên', () => {
    expect(previewPoints('triangle', 6, 24)).toBe('0,0 24,0 12,12');
  });

  it('vuông phủ kín hộp', () => {
    expect(previewPoints('square', 0, 24)).toBe('0,0 24,0 24,24 0,24');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/studioOrientation.test.ts`
Expected: FAIL — cannot resolve `../src/studio/orientationOptions.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `game-next/src/studio/orientationOptions.ts`:

```ts
import type { Orientation, ShapeKind } from '../domain/model.ts';
import { isValidFrame, shapePolygon } from '../domain/shapes.ts';

/** Các cỡ khung chào mời trong palette; lọc lại theo isValidFrame của từng hướng. */
export const CANDIDATE_SIZES: readonly number[] = [
  16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 112, 128,
];

export type OrientationFamily = {
  label: string;
  orientations: readonly Orientation[];
};

const TRIANGLE_FAMILIES: readonly OrientationFamily[] = [
  { label: 'Góc', orientations: [0, 1, 2, 3] },
  { label: 'Mái', orientations: [4, 5, 6, 7] },
];

const PARALLELOGRAM_FAMILIES: readonly OrientationFamily[] = [
  { label: 'Nghiêng', orientations: [0, 1, 2, 3] },
];

/**
 * Các họ hướng của một hình. Tam giác chia hai họ vì xoay 90° không đưa
 * được tam giác vuông thành tam giác cân (xem effectiveOrientation).
 * Hình chỉ có hướng 0 trả về mảng rỗng: palette ẩn hàng chọn hướng.
 */
export function orientationFamilies(kind: ShapeKind): readonly OrientationFamily[] {
  if (kind === 'triangle') return TRIANGLE_FAMILIES;
  if (kind === 'parallelogram') return PARALLELOGRAM_FAMILIES;
  return [];
}

export function validFrameSizes(kind: ShapeKind, orientation: Orientation): number[] {
  return CANDIDATE_SIZES.filter((s) => isValidFrame(kind, orientation, s));
}

/** Cỡ khung còn hợp lệ thì giữ; không thì lấy cỡ hợp lệ đầu tiên. */
export function snapFrameSize(
  kind: ShapeKind,
  orientation: Orientation,
  current: number
): number {
  if (isValidFrame(kind, orientation, current)) return current;
  const valid = validFrameSizes(kind, orientation);
  return valid.length > 0 ? valid[0] : current;
}

/** Thuộc tính `points` của <polygon> cho ảnh xem trước trong hộp boxSize × boxSize. */
export function previewPoints(
  kind: ShapeKind,
  orientation: Orientation,
  boxSize: number
): string {
  return shapePolygon(kind, orientation, boxSize)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/studioOrientation.test.ts`
Expected: PASS, 9 tests.

If `previewPoints('triangle', 4, 24)` does not equal `'0,24 24,24 12,12'`, read `shapePolygon` in `src/domain/shapes.ts` and correct the **test's expected string** to the real vertex order — the implementation must not reshape the polygon.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test` then `npm run typecheck`
Expected: both pass; nothing else imports the new module yet.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/studio/orientationOptions.ts game-next/tests/studioOrientation.test.ts CHANGELOG.md
git commit -m "feat(studio): pure orientation-family and frame-size module"
```

Add the `CHANGELOG.md` entry under `## Unreleased` before committing.

---

### Task 2: Palette orientation preview buttons

Replace the `<select>` of bare numbers at `src/studio/palette.ts:107-130` with grouped preview buttons.

**Files:**
- Modify: `game-next/src/studio/palette.ts:23` (drop the local `CANDIDATE_SIZES`), `:41-49` (`updateValidSizes`), `:107-130` (the orientation block)

**Interfaces:**
- Consumes: `orientationFamilies`, `validFrameSizes`, `snapFrameSize`, `previewPoints` from Task 1.
- Produces: nothing new; `add-piece` is dispatched with the same shape as before.

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "createPalette", direction: "upstream"})` and report the blast radius. Expected: `studio/main.ts` only. Stop and warn the user if it returns HIGH or CRITICAL.

- [ ] **Step 2: Replace the local size list with the shared one**

In `src/studio/palette.ts`, delete the local `const CANDIDATE_SIZES = [...]` on line 23 and import from Task 1's module:

```ts
import {
  orientationFamilies,
  previewPoints,
  snapFrameSize,
  validFrameSizes,
} from './orientationOptions.ts';
```

Then rewrite `updateValidSizes` to delegate:

```ts
  function updateValidSizes(): number[] {
    selectedSize = snapFrameSize(selectedKind, selectedOrientation, selectedSize);
    return validFrameSizes(selectedKind, selectedOrientation);
  }
```

The `isValidFrame` import on line 2 becomes unused — remove it.

- [ ] **Step 3: Replace the orientation `<select>` with preview buttons**

Replace the whole block at lines 107–130 (`// 3. Orientation selector ...` through its `container.appendChild(oriSelect);`) with:

```ts
    // 3. Orientation picker: ảnh xem trước thật, chia theo họ
    const families = orientationFamilies(selectedKind);
    if (families.length > 0) {
      const oriGroup = document.createElement('div');
      oriGroup.className = 'studio-orientation';
      oriGroup.style.display = 'flex';
      oriGroup.style.alignItems = 'center';
      oriGroup.style.gap = '8px';

      families.forEach((family) => {
        const famWrap = document.createElement('div');
        famWrap.style.display = 'flex';
        famWrap.style.alignItems = 'center';
        famWrap.style.gap = '3px';

        const famLabel = document.createElement('span');
        famLabel.textContent = family.label;
        famLabel.style.fontSize = '11px';
        famLabel.style.color = '#94a3b8';
        famWrap.appendChild(famLabel);

        family.orientations.forEach((o) => {
          const btn = document.createElement('button');
          btn.title = `${family.label} ${o}`;
          btn.setAttribute('data-orientation', String(o));
          btn.style.width = '32px';
          btn.style.height = '32px';
          btn.style.padding = '3px';
          btn.style.borderRadius = '4px';
          btn.style.cursor = 'pointer';
          btn.style.lineHeight = '0';
          if (o === selectedOrientation) {
            btn.style.border = '1px solid #38bdf8';
            btn.style.backgroundColor = '#0b2a3f';
          } else {
            btn.style.border = '1px solid #334155';
            btn.style.backgroundColor = '#1e294b';
          }

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '24');
          svg.setAttribute('height', '24');
          svg.setAttribute('viewBox', '0 0 24 24');
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          poly.setAttribute('points', previewPoints(selectedKind, o, 24));
          poly.setAttribute('fill', o === selectedOrientation ? '#38bdf8' : '#94a3b8');
          svg.appendChild(poly);
          btn.appendChild(svg);

          btn.onclick = () => {
            selectedOrientation = o;
            updateValidSizes();
            render();
          };
          famWrap.appendChild(btn);
        });

        oriGroup.appendChild(famWrap);
      });

      container.appendChild(oriGroup);
    }
```

- [ ] **Step 4: Typecheck and run the suite**

Run: `npm run typecheck` then `npm test`
Expected: both pass. No test covers the DOM here by design (see Global Constraints); Task 1's tests cover the logic.

- [ ] **Step 5: Verify by hand in the studio**

Run `npm run dev`, open the studio, pick **Tam giác**. Confirm: two labelled groups **Góc** and **Mái**; eight buttons each showing the real outline; clicking **Mái ▲** (orientation 4) while the size is 40 moves the size list to multiples of 16 and the selection to 16; `+ Thêm mảnh` places an apex-up triangle on the board. Pick **Vuông** and confirm the orientation row disappears.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/studio/palette.ts CHANGELOG.md
git commit -m "feat(studio): orientation picker shows the real shape, grouped by family"
```

---

### Task 3: `set-orientation` action

**Files:**
- Modify: `game-next/src/studio/state.ts:15-33` (the `StudioAction` union) and its reducer
- Test: `game-next/tests/studioState.test.ts`

**Interfaces:**
- Produces, relied on by Task 4: the action `{ type: 'set-orientation'; id: string; orientation: Orientation }`. Invalid frame for the new orientation ⇒ state returned unchanged.

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "studioReducer", direction: "upstream"})` (use the reducer's real exported name, read it from `src/studio/state.ts`). Report the blast radius.

- [ ] **Step 2: Write the failing test**

Append to `game-next/tests/studioState.test.ts`. Match the file's existing helper for building a state — read the top of the file first and reuse it rather than inventing one.

```ts
describe('set-orientation', () => {
  it('đổi hướng của mảnh đang chọn', () => {
    const start = createInitialState({
      ...baseSource,
      pieces: [
        { id: 'T1', shapeKind: 'triangle', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 0, y: 0 }] },
      ],
    });
    const next = studioReducer(start, { type: 'set-orientation', id: 'T1', orientation: 4 });
    expect(next.source.pieces[0].orientation).toBe(4);
  });

  it('từ chối khi khung không hợp lệ cho hướng mới', () => {
    const start = createInitialState({
      ...baseSource,
      pieces: [
        { id: 'T1', shapeKind: 'triangle', orientation: 0, frameSize: 40, anchors: [{ id: 'A', x: 0, y: 0 }] },
      ],
    });
    const next = studioReducer(start, { type: 'set-orientation', id: 'T1', orientation: 4 });
    expect(next).toBe(start);
    expect(next.source.pieces[0].orientation).toBe(0);
  });

  it('bỏ qua mảnh không tồn tại', () => {
    const start = createInitialState(baseSource);
    expect(studioReducer(start, { type: 'set-orientation', id: 'nope', orientation: 2 })).toBe(start);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/studioState.test.ts`
Expected: FAIL — `set-orientation` is not assignable to `StudioAction`.

- [ ] **Step 4: Write minimal implementation**

In `src/studio/state.ts`, add to the `StudioAction` union after the `rotate-piece` line:

```ts
  | { type: 'set-orientation'; id: string; orientation: Orientation }
```

Add `isValidFrame` to the existing `../domain/shapes.ts` import, then add this case next to `rotate-piece`:

```ts
    case 'set-orientation': {
      const current = state.source.pieces.find((p) => p.id === action.id);
      if (!current) return state;
      // Khung phải hợp lệ cho hướng mới: họ Mái cần bội 16, họ Góc chỉ cần bội 8.
      if (!isValidFrame(current.shapeKind, action.orientation, current.frameSize)) {
        return state;
      }
      const source = deepClone(state.source);
      const piece = source.pieces.find((p) => p.id === action.id);
      if (!piece) return state;
      piece.orientation = action.orientation;
      return { ...state, source };
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/studioState.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/studio/state.ts game-next/tests/studioState.test.ts CHANGELOG.md
git commit -m "feat(studio): set-orientation action with frame validation"
```

---

### Task 4: Inspector orientation control

**Files:**
- Modify: `game-next/src/studio/inspector.ts` — in the per-piece section, beside the existing frame-size / anchor fields

**Interfaces:**
- Consumes: `orientationFamilies`, `previewPoints` (Task 1); the `set-orientation` action (Task 3).

- [ ] **Step 1: Read the file and find the insertion point**

Read `src/studio/inspector.ts` and locate where it renders the selected piece's fields. Follow the element-building and dispatch style already used there; do not introduce a new pattern.

- [ ] **Step 2: Add the control**

Render the same grouped preview buttons as Task 2, but dispatching the piece action, and **disable** a button whose orientation the current frame cannot take:

```ts
  // Hướng của mảnh đang chọn. Nút bị mờ nghĩa là khung hiện tại không hợp
  // cho hướng đó (họ Mái cần khung bội 16); đổi cỡ khung trước rồi chọn lại.
  const families = orientationFamilies(piece.shapeKind);
  if (families.length > 0) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';

    families.forEach((family) => {
      const label = document.createElement('span');
      label.textContent = family.label;
      label.style.fontSize = '11px';
      label.style.color = '#94a3b8';
      row.appendChild(label);

      family.orientations.forEach((o) => {
        const allowed = isValidFrame(piece.shapeKind, o, piece.frameSize);
        const btn = document.createElement('button');
        btn.title = allowed ? `${family.label} ${o}` : `Khung ${piece.frameSize} không hợp cho hướng ${o}`;
        btn.disabled = !allowed;
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.padding = '2px';
        btn.style.borderRadius = '4px';
        btn.style.lineHeight = '0';
        btn.style.cursor = allowed ? 'pointer' : 'not-allowed';
        btn.style.opacity = allowed ? '1' : '0.35';
        btn.style.border = o === (piece.orientation ?? 0) ? '1px solid #38bdf8' : '1px solid #334155';
        btn.style.backgroundColor = o === (piece.orientation ?? 0) ? '#0b2a3f' : '#1e294b';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('viewBox', '0 0 20 20');
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', previewPoints(piece.shapeKind, o, 20));
        poly.setAttribute('fill', o === (piece.orientation ?? 0) ? '#38bdf8' : '#94a3b8');
        svg.appendChild(poly);
        btn.appendChild(svg);

        if (allowed) {
          btn.onclick = () => options.dispatch({ type: 'set-orientation', id: piece.id, orientation: o });
        }
        row.appendChild(btn);
      });
    });

    container.appendChild(row);
  }
```

Rename `container` / `options` to whatever the surrounding function already calls them.

- [ ] **Step 3: Typecheck and run the suite**

Run: `npm run typecheck` then `npm test`
Expected: both pass.

- [ ] **Step 4: Verify by hand**

In the studio, place a triangle at frame 48 orientation 0, select it, and switch it to **Mái ▲** from the inspector; the board redraws as an apex-up triangle. Place one at frame 40 and confirm the four Mái buttons are dimmed and unclickable.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/studio/inspector.ts CHANGELOG.md
git commit -m "feat(studio): orientation control for the selected piece in the inspector"
```

---

### Task 5: Overwrite mode in `promoteStudioLevel`

**Files:**
- Modify: `game-next/src/content/promote.ts` — `PromoteOptions`, `updateManifestLine`, and the body of `promoteStudioLevel`
- Test: `game-next/tests/promote.test.ts`

**Interfaces:**
- Produces, relied on by Tasks 6 and 7:
  - `PromoteOptions` gains `overwrite?: boolean`.
  - `updateManifestLine(manifestText, entry, expect?: { fromStatus?: 'planned' | 'any'; toStatus?: 'validated' })` — default behaviour unchanged.
  - `bumpRevision(revision: string): string` — exported; `'thuyen-sao-v1'` → `'thuyen-sao-v2'`, `'abc'` → `'abc-v2'`.

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "promoteStudioLevel", direction: "upstream"})`. Expected callers: `scripts/promote-level.ts`, `tests/promote.test.ts`. Report the risk level; warn the user if HIGH or CRITICAL.

- [ ] **Step 2: Write the failing tests**

Append to `game-next/tests/promote.test.ts`, reusing the file's existing temp-repo fixture helpers (read the top of the file; it builds a fake repo under `tests/.tmp-promote`). The fixture must register the target id in `sources/index.ts`, `catalog.ts` and `manifest.ts` with `status: 'approved'` and `contentRevision: 'thu-nghiem-v1'`.

```ts
describe('promoteStudioLevel overwrite', () => {
  it('bumpRevision tăng đuôi -v<N>', () => {
    expect(bumpRevision('thuyen-sao-v1')).toBe('thuyen-sao-v2');
    expect(bumpRevision('thuyen-sao-v9')).toBe('thuyen-sao-v10');
    expect(bumpRevision('khong-co-duoi')).toBe('khong-co-duoi-v2');
  });

  it('không có cờ overwrite thì id đã tồn tại vẫn lỗi', () => {
    const res = promoteStudioLevel({ studioId: 'nhap', targetId: '1-4', root: TMP_ROOT });
    expect(res.ok).toBe(false);
  });

  it('overwrite ghi đè nguồn, tăng revision, hạ approved về validated', () => {
    const res = promoteStudioLevel({ studioId: 'nhap', targetId: '1-4', root: TMP_ROOT, overwrite: true });
    expect(res.ok).toBe(true);

    const manifest = readFileSync(resolve(TMP_ROOT, 'game-next/src/content/manifest.ts'), 'utf8');
    expect(manifest).toContain("contentRevision: 'thu-nghiem-v2'");
    expect(manifest).toContain("status: 'validated'");
    expect(manifest).not.toContain("status: 'approved'");
  });

  it('overwrite không đăng ký trùng trong index.ts và catalog.ts', () => {
    promoteStudioLevel({ studioId: 'nhap', targetId: '1-4', root: TMP_ROOT, overwrite: true });
    const index = readFileSync(resolve(TMP_ROOT, 'game-next/src/content/sources/index.ts'), 'utf8');
    const catalog = readFileSync(resolve(TMP_ROOT, 'game-next/src/content/catalog.ts'), 'utf8');
    expect(index.match(/'1-4':/g)).toHaveLength(1);
    expect(catalog.match(/'1-4':/g)).toHaveLength(1);
  });

  it('nghiệm không duy nhất thì không file nào bị đụng tới', () => {
    const before = snapshotRepo(TMP_ROOT);
    const res = promoteStudioLevel({ studioId: 'da-nghiem', targetId: '1-4', root: TMP_ROOT, overwrite: true });
    expect(res.ok).toBe(false);
    expect(snapshotRepo(TMP_ROOT)).toEqual(before);
  });
});
```

`snapshotRepo` is a helper this task adds to the test file:

```ts
function snapshotRepo(root: string): Record<string, string> {
  const files = [
    'game-next/src/content/manifest.ts',
    'game-next/src/content/catalog.ts',
    'game-next/src/content/sources/index.ts',
    'game-next/src/content/sources/1-4.ts',
  ];
  const out: Record<string, string> = {};
  for (const f of files) {
    const p = resolve(root, f);
    if (existsSync(p)) out[f] = readFileSync(p, 'utf8');
  }
  return out;
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/promote.test.ts`
Expected: FAIL — `bumpRevision` is not exported, `overwrite` is not in `PromoteOptions`.

- [ ] **Step 4: Implement**

In `src/content/promote.ts`:

```ts
/** 'thuyen-sao-v1' → 'thuyen-sao-v2'; không có đuôi -v<N> thì thêm '-v2'. */
export function bumpRevision(revision: string): string {
  const m = /^(.*)-v(\d+)$/.exec(revision);
  if (!m) return `${revision}-v2`;
  return `${m[1]}-v${Number(m[2]) + 1}`;
}
```

Relax `updateManifestLine` so it can accept a non-`planned` row and choose the status it writes:

```ts
export function updateManifestLine(
  manifestText: string,
  entry: ManifestUpdateData,
  expect: { fromStatus?: 'planned' | 'any' } = {}
): string {
```

Inside it, replace the `planned` guard with:

```ts
  if ((expect.fromStatus ?? 'planned') === 'planned') {
    if (!currentLine.includes("'status': 'planned'") && !currentLine.includes("status: 'planned'")) {
      throw new Error(`Màn ${entry.id} không ở trạng thái planned trong manifest.ts`);
    }
  }
```

The written line keeps `status: 'validated'` in both modes — that is exactly the downgrade overwrite wants.

In `promoteStudioLevel`, add `overwrite?: boolean` to `PromoteOptions`, then change the status guard:

```ts
  const overwrite = opts.overwrite === true;
  if (!overwrite && status !== 'planned') {
    return { ok: false, error: `target-not-planned:${opts.targetId} (status is ${status})` };
  }
  if (overwrite && status === 'planned') {
    return { ok: false, error: `overwrite-on-planned:${opts.targetId} (dùng chế độ thường)` };
  }
```

Capture the current revision from the manifest match (`targetMatch[4]`) and, in overwrite mode, set the new source's revision from it:

```ts
  const currentRevision = targetMatch[4];
  if (overwrite) {
    newSource.contentRevision = bumpRevision(currentRevision);
  }
```

Place this immediately after `sourceFromDocument(...)` and **before** `authorLevel(newSource)`, so the regenerated JSON and report carry the new revision.

Guard the two registration steps:

```ts
  // 2. src/content/sources/index.ts — ghi đè thì id đã đăng ký rồi
  if (!overwrite) {
    const indexPath = resolve(gameNextDir, 'src/content/sources/index.ts');
    const indexText = readFileSync(indexPath, 'utf8');
    const updatedIndexText = registerInSourceIndex(indexText, opts.targetId, constName);
    writeFileSync(indexPath, updatedIndexText, 'utf8');
    writtenFiles.push(relative(opts.root, indexPath).replace(/\\/g, '/'));
  }
```

and the same `if (!overwrite) { ... }` around step 6, the `catalog.ts` block.

Finally pass the mode through to the manifest update:

```ts
  const updatedManifestText = updateManifestLine(
    manifestText,
    { id: opts.targetId, title: newSource.title, chapter: targetChapter, order: targetOrder, contentRevision: newSource.contentRevision },
    { fromStatus: overwrite ? 'any' : 'planned' }
  );
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/promote.test.ts`
Expected: PASS, including the pre-existing tests — the non-overwrite path must be untouched.

- [ ] **Step 6: Run `detect_changes` and commit**

Run `detect_changes()` and confirm only `promote.ts` symbols appear.

```bash
git add game-next/src/content/promote.ts game-next/tests/promote.test.ts CHANGELOG.md
git commit -m "feat(content): overwrite mode for promoteStudioLevel"
```

---

### Task 6: Preserve the source file's comment block

**Files:**
- Modify: `game-next/src/content/promote.ts` — the step-1 source write
- Test: `game-next/tests/promote.test.ts`

**Interfaces:**
- Produces: `preserveHeaderComment(oldText: string, newText: string): string` — exported from `promote.ts`.

- [ ] **Step 1: Write the failing test**

```ts
describe('preserveHeaderComment', () => {
  const generated = [
    "import type { LevelSource } from '../authoring.ts';",
    '',
    'export const moi: LevelSource = {',
    '};',
  ].join('\n');

  it('giữ khối chú thích giữa dòng import và export const', () => {
    const old = [
      "import type { LevelSource } from '../authoring.ts';",
      '',
      '/**',
      ' * 1-6 Vương Miện: giải thích quy tắc ô biên chung.',
      ' */',
      'export const cu: LevelSource = {',
      '};',
    ].join('\n');
    const out = preserveHeaderComment(old, generated);
    expect(out).toContain('quy tắc ô biên chung');
    expect(out.indexOf('quy tắc')).toBeLessThan(out.indexOf('export const moi'));
    expect(out).toContain('export const moi: LevelSource = {');
  });

  it('nguồn cũ không có chú thích thì trả nguyên bản sinh', () => {
    const old = [
      "import type { LevelSource } from '../authoring.ts';",
      '',
      'export const cu: LevelSource = {',
      '};',
    ].join('\n');
    expect(preserveHeaderComment(old, generated)).toBe(generated);
  });

  it('nguồn cũ hỏng dạng thì trả nguyên bản sinh', () => {
    expect(preserveHeaderComment('rác', generated)).toBe(generated);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/promote.test.ts -t preserveHeaderComment`
Expected: FAIL — `preserveHeaderComment` is not exported.

- [ ] **Step 3: Implement**

```ts
const SOURCE_IMPORT_LINE = "import type { LevelSource } from '../authoring.ts';";

/**
 * Giữ lại khối chú thích viết tay nằm giữa dòng import và `export const`
 * của file nguồn cũ. Bản sinh từ serializeLevelSource không có khối này,
 * mà nó thường chứa lý do thiết kế của màn (ví dụ 1-6 giải thích quy tắc ô
 * biên chung). Thuần văn bản: chú thích có thể lạc hậu so với nội dung mới,
 * báo cáo promote nhắc người duyệt đọc lại.
 */
export function preserveHeaderComment(oldText: string, newText: string): string {
  const oldImport = oldText.indexOf(SOURCE_IMPORT_LINE);
  const oldExport = oldText.indexOf('export const');
  if (oldImport === -1 || oldExport === -1 || oldExport < oldImport) return newText;

  const between = oldText.slice(oldImport + SOURCE_IMPORT_LINE.length, oldExport).trim();
  if (between === '') return newText;

  const newExport = newText.indexOf('export const');
  if (newExport === -1) return newText;

  const eol = newText.includes('\r\n') ? '\r\n' : '\n';
  const head = newText.slice(0, newExport).replace(/\s+$/, '');
  return `${head}${eol}${eol}${between}${eol}${newText.slice(newExport)}`;
}
```

Then use it in step 1 of `promoteStudioLevel`, only in overwrite mode (a new level has no old file):

```ts
  const constName = constNameFromTitle(newSource.title);
  let sourceText = serializeLevelSource(newSource, constName);
  const sourceFilePath = resolve(gameNextDir, 'src/content/sources', `${opts.targetId}.ts`);
  let preservedComment = false;
  if (overwrite && existsSync(sourceFilePath)) {
    const oldText = readFileSync(sourceFilePath, 'utf8');
    const merged = preserveHeaderComment(oldText, sourceText);
    preservedComment = merged !== sourceText;
    sourceText = merged;
  }
  writeFileSync(sourceFilePath, sourceText, 'utf8');
```

Add `preservedComment: boolean` to the success shape of `PromoteResult` and return it, so Tasks 7's CLI and UI can report it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/promote.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the round-trip test**

Add one more case asserting that overwriting a fixture source whose file carries a block comment leaves that comment in the written file, then run `npm test -- tests/promote.test.ts` again.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/content/promote.ts game-next/tests/promote.test.ts CHANGELOG.md
git commit -m "feat(content): keep the hand-written comment block when overwriting a source"
```

---

### Task 7: Endpoint, CLI flag and studio button

**Files:**
- Modify: `game-next/scripts/studio/studioPlugin.ts` (add `POST /__studio/promote`), `game-next/scripts/promote-level.ts` (add `--overwrite`), `game-next/src/studio/api.ts` (add the client call), `game-next/src/studio/library.ts` (add the button)
- Test: `game-next/tests/studioPlugin.test.ts`

**Interfaces:**
- Consumes: `promoteStudioLevel` with `overwrite` (Task 5) and `preservedComment` (Task 6).
- Produces: `promoteStudioLevelApi(studioId: string, targetId: string, overwrite: boolean): Promise<PromoteResult>` in `src/studio/api.ts`.

- [ ] **Step 1: Write the failing endpoint test**

Append to `game-next/tests/studioPlugin.test.ts`, following the request/response helpers already in that file:

```ts
describe('POST /__studio/promote', () => {
  it('từ chối body thiếu targetId', async () => {
    const res = await post('/__studio/promote', { studioId: 'nhap' });
    expect(res.status).toBe(400);
  });

  it('chuyển tiếp lỗi của promoteStudioLevel nguyên văn', async () => {
    const res = await post('/__studio/promote', { studioId: 'khong-co', targetId: '1-4', overwrite: true });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain('studio-not-found');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/studioPlugin.test.ts`
Expected: FAIL — the endpoint 404s.

- [ ] **Step 3: Add the endpoint**

In `scripts/studio/studioPlugin.ts`, beside the existing `/__studio/delete` branch:

```ts
    // 4. POST /__studio/promote
    if (url === '/__studio/promote') {
      const studioId = typeof body?.studioId === 'string' ? body.studioId : '';
      const targetId = typeof body?.targetId === 'string' ? body.targetId : '';
      if (!studioId || !targetId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'thiếu studioId hoặc targetId' }));
        return true;
      }
      const result = promoteStudioLevel({
        studioId,
        targetId,
        root: repoRoot,
        overwrite: body?.overwrite === true,
      });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return true;
    }
```

Import `promoteStudioLevel` at the top, and use whatever the file already calls the repo-root variable instead of `repoRoot`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/studioPlugin.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the CLI flag**

In `scripts/promote-level.ts`, accept `--overwrite` anywhere in `argv`, pass it through, and on success print the revision bump, the status downgrade and `preservedComment`. When `promoteStudioLevel` fails with `target-not-planned`, append a line naming the flag:

```ts
  if (!result.ok && result.error.startsWith('target-not-planned')) {
    console.error('[promote] Màn này đã có nội dung. Dùng --overwrite để ghi đè (revision sẽ tăng, trạng thái hạ về validated).');
  }
```

- [ ] **Step 6: Add the client call and the button**

In `src/studio/api.ts`:

```ts
export async function promoteStudioLevelApi(
  studioId: string,
  targetId: string,
  overwrite: boolean
): Promise<PromoteResult> {
  const res = await fetch('/__studio/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studioId, targetId, overwrite }),
  });
  return res.json();
}
```

Import `PromoteResult` as a type from `../content/promote.ts`.

In `src/studio/library.ts`, when the loaded source's id satisfies `isCampaignId` (already imported there), render a **Ghi về campaign** button whose click first confirms:

```ts
      const ok = window.confirm(
        [
          `Ghi đè màn ${id} trong campaign?`,
          '',
          `• File nguồn src/content/sources/${id}.ts sẽ bị ghi đè`,
          '• contentRevision tăng một bậc',
          '• Trạng thái hạ từ approved về validated',
          '• Màn phải được chơi và duyệt lại trước khi phát hành',
        ].join('\n')
      );
      if (!ok) return;
```

then calls `promoteStudioLevelApi(state.source.id, id, true)` and reports the result: on `ok`, the new revision and whether the comment block was kept; on failure, `result.error` and any `result.issues` verbatim.

- [ ] **Step 7: Typecheck, full suite, and verify by hand**

Run: `npm run typecheck`, `npm test`, `npm run build`.
Then `npm run dev`: open a campaign level in the studio, nudge one anchor, save, press **Ghi về campaign**, accept the confirmation. Confirm `git diff` shows the source rewritten with its comment block intact, the revision bumped, the manifest row at `validated`, and the JSON, SVG and report regenerated. Then `git checkout` those files — this was a rehearsal, not a content change.

- [ ] **Step 8: Run `detect_changes` and commit**

```bash
git add game-next/scripts/studio/studioPlugin.ts game-next/scripts/promote-level.ts game-next/src/studio/api.ts game-next/src/studio/library.ts game-next/tests/studioPlugin.test.ts CHANGELOG.md
git commit -m "feat(studio): write an edited campaign level back from the studio"
```

---

### Task 8: Documentation and close-out

**Files:**
- Modify: `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md`, `docs/ai/ARCHITECTURE.md`, `docs/content/level-kit.md`

- [ ] **Step 1: Update `docs/content/level-kit.md`**

In the "Mẹo tăng độ khó" section, add that triangles have two orientation families, that the roof family needs a frame that is a multiple of 16, and that the palette and inspector now show each orientation as a picture.

- [ ] **Step 2: Update `docs/ai/ARCHITECTURE.md`**

Add to the invariants: the two triangle orientation families and why `R` stays inside one; and that promote's overwrite mode is the only sanctioned way to change an approved level, always downgrading it to `validated`.

- [ ] **Step 3: Update `docs/ai/DOCS-INDEX.md`**

Set the E4 row's plan column to this file and its state to `done`.

- [ ] **Step 4: Overwrite `docs/ai/STATUS.md`**

Update "Now", the streams table and the gotchas; keep it ≤ 60 lines; bump the date line.

- [ ] **Step 5: Final verification**

Run `npm test`, `npm run build`, `npm run content:validate`, then `git diff --check` and `git status` from the repo root. Report the real output; do not claim success without it.

- [ ] **Step 6: Commit**

```bash
git add docs/ CHANGELOG.md
git commit -m "docs(e4): record the studio orientation picker and round-trip"
```

---

## Self-Review

**Spec coverage.** A1 → Task 2. A2 → Task 1 (`snapFrameSize`) + Task 2 Step 2. A3 → Tasks 3 and 4. A4 (leave `effectiveOrientation` and keys alone) → Global Constraints. A5 → Tasks 1 and 3. B1 → Task 5. B2 → Task 6. B3 → Task 5 Step 4 (the gate is pre-existing; the overwrite branch adds no bypass) and its "no file touched" test. B4 → Task 7 Steps 3–4. B5 → Task 7 Step 6. B6 → Task 7 Step 5. B7 → Tasks 5, 6, 7. Section 6 "Done when" → Task 8 Step 5.

**Known gaps, stated rather than hidden.** The spec's A5 asks for a palette test asserting the orientation row is absent for square/diamond/circle. With no jsdom, that is tested at the logic level (`orientationFamilies('square') === []`, Task 1) plus a hand check (Task 2 Step 5), not by rendering. Adding jsdom was rejected as scope the spec did not ask for; if the reviewer wants a real DOM test, that is a follow-up.

**Type consistency.** `orientationFamilies`, `validFrameSizes`, `snapFrameSize`, `previewPoints` are named identically in Tasks 1, 2 and 4. `set-orientation` carries `{ id, orientation }` in Tasks 3 and 4. `bumpRevision`, `preserveHeaderComment`, `overwrite` and `preservedComment` are named identically in Tasks 5, 6 and 7.

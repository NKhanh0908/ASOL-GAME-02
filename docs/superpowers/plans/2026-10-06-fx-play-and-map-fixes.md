# FX — Play and map fixes, icon restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four reported defects, remove the magnet ring, and redraw the UI icons as one family.

**Architecture:** Six independent items, ordered by how much they annoy the player. FX-1 replaces bounding-box hit testing with a test against the piece's real cells, which is the only item that touches the input path. FX-6 and FX-4 are self-contained presentation fixes. FX-3 is a deletion. FX-2 is a regression test and no production change. FX-5 is a redraw inside `TextureFactory`.

**Tech Stack:** TypeScript 5.7, Phaser 3.90, Vitest 2 (node environment, no DOM).

**Spec:** `docs/superpowers/specs/2026-10-06-fx-play-and-map-fixes-design.md`

## Global Constraints

- Node `>=24.13.1 <25`. All commands run from `game-next/`.
- Code comments and UI copy in Vietnamese; plan and commit messages in English.
- No new dependency. There is no jsdom; anything touching `document` or a Phaser scene is verified by hand, and logic that needs a test lives in a pure module.
- Colours come from `COLOR_TOKENS` / `COLOR_NUMBERS`, never literals — `tests/bannedColors.test.ts` scans `src/` and must keep passing.
- Per `AGENTS.md`: run `impact({target, direction:"upstream"})` before editing a symbol, `detect_changes()` before each commit, and include a `CHANGELOG.md` entry with every commit.
- **Stage files by name. Never `git add -A` or `git add .`** — this branch has carried concurrent work from another session, and a sweep has already pulled unrelated files into a commit once.

---

### Task 1: FX-2 — pin the identical-piece invariant

No production change. This locks in behaviour the spec verified, so a future change to the solver cannot silently break it.

**Files:**
- Test: `game-next/tests/solver.test.ts` (or the existing solver test file — check the name first)

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest';
import { authorLevel } from '../src/content/authorLevel.ts';
import type { LevelSource } from '../src/content/authoring.ts';

/**
 * Hai mảnh giống hệt, mỗi mảnh có đủ neo để đổi chỗ cho nhau. Bộ giải gộp
 * nhóm theo shapeKind:orientation:frameSize và sắp xếp tư thế trong nhóm
 * (canonicalKey), nên hoán vị không được tính thành nghiệm thứ hai.
 */
function twinSquares(rotationEnabled: boolean): LevelSource {
  return {
    id: 'dev-twin',
    title: 'Twin Probe',
    chapter: rotationEnabled ? 4 : 1,
    order: 1,
    contentRevision: 'twin-v1',
    rotationEnabled,
    pieces: [
      { id: 'Q1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }, { id: 'B', x: 64, y: 56 }] },
      { id: 'Q2', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }, { id: 'B', x: 16, y: 56 }] },
    ],
    sampleSolutions: [[{ pieceId: 'Q1', anchorId: 'A', turns: 0 }, { pieceId: 'Q2', anchorId: 'A', turns: 0 }]],
    learningObjective: 'probe',
    difficultyEstimate: 1,
    distractors: [],
    ftueSteps: [],
  };
}

describe('hoán vị hai mảnh giống hệt không sinh nghiệm thứ hai', () => {
  it('không bật xoay', () => {
    const r = authorLevel(twinSquares(false));
    expect(r.ok).toBe(true);
    expect(r.report?.solutionCount).toBe(1);
    expect(r.report?.fewerPieceSolutions).toBe(0);
  });

  it('bật xoay', () => {
    const r = authorLevel(twinSquares(true));
    expect(r.ok).toBe(true);
    expect(r.report?.solutionCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- tests/solver.test.ts`
Expected: PASS immediately — this pins existing behaviour rather than driving new code. If it fails, stop: the spec's finding was wrong and FX-2 needs reopening as a real defect.

- [ ] **Step 3: Commit**

```bash
git add game-next/tests/solver.test.ts CHANGELOG.md
git commit -m "test(solver): pin that swapping identical pieces is one solution"
```

---

### Task 2: FX-1 — hit-test the piece's real shape

The item the reporter called the most annoying.

**Files:**
- Modify: `game-next/src/presentation/layout.ts:164-195` (`pieceHitbox`), `game-next/src/application/playController.ts:87-130` (`onPointerDown`)
- Create: `game-next/src/presentation/pieceHitTest.ts`
- Test: `game-next/tests/pieceHitTest.test.ts`

**Interfaces:**
- Produces: `pieceContainsPoint(piece: Piece, state: PieceState, layout: LayoutMetrics, px: number, py: number, trayIndex: number, trayCount: number): boolean`.

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "pieceHitbox", direction: "upstream"})` and `impact({target: "onPointerDown", direction: "upstream"})`. Report both blast radii. `pieceHitbox` is also used for drag offsets, so **do not change its signature or its return value** — this task adds an exact test on top of it, keeping the box as the cheap rejection pass.

- [ ] **Step 2: Resolve the comment/code conflict first**

`playController.ts:93` iterates `[...this.level.pieces].reverse()` while the comment above claims the order is `snapped -> temporary -> tray`. Read `BoardRenderer` to find the order pieces are actually **drawn** in, then make the iteration the reverse of the draw order so the topmost piece is tested first, and correct the comment to describe what the code does. Record in the commit message which of the two was wrong.

- [ ] **Step 3: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { pieceContainsPoint } from '../src/presentation/pieceHitTest.ts';
// Build `layout` with the same helper the existing layout tests use - read
// tests/layout.test.ts first and reuse it rather than constructing one here.

describe('pieceContainsPoint', () => {
  const tri = { id: 'T1', shapeKind: 'triangle' as const, orientation: 0 as const, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }] };

  it('nhận điểm nằm trong phần vẽ của tam giác', () => {
    // Gần góc trên-trái của khung: tam giác hướng 0 phủ chỗ này.
    expect(pieceContainsPoint(tri, { kind: 'snapped', anchorId: 'A', turns: 0 }, layout, /* điểm trong */ ...)).toBe(true);
  });

  it('TỪ CHỐI điểm ở phần tư dưới-phải của khung, nơi tam giác không vẽ', () => {
    // Đây chính là lỗi được báo: ô trống của khung vẫn cướp cú chạm.
    expect(pieceContainsPoint(tri, { kind: 'snapped', anchorId: 'A', turns: 0 }, layout, /* điểm trống */ ...)).toBe(false);
  });

  it('thoi: từ chối cả bốn góc khung', () => { /* bốn assert false */ });
});
```

Fill the coordinates from the real `layout` fixture — compute them from `gridToCanvas` so they do not drift if the layout tokens change.

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- tests/pieceHitTest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement**

Create `src/presentation/pieceHitTest.ts`. Use the piece's rasterised cells, which are the same source the renderer draws from, so the hit area cannot drift from the picture:

```ts
/**
 * Điểm có rơi vào phần VẼ của mảnh không. Trước đây chỉ kiểm bao đóng chữ
 * nhật bằng trọn khung, nên nửa khung trống của tam giác hay bốn góc của
 * thoi vẫn cướp cú chạm của mảnh khác (FX-1).
 *
 * Bao đóng vẫn dùng làm phép loại nhanh; ô đã raster mới là phép quyết định.
 */
export function pieceContainsPoint(...): boolean {
  const box = pieceHitbox(piece, state, layout, trayIndex, trayCount);
  if (px < box.x || px > box.x + box.width || py < box.y || py > box.y + box.height) {
    return false;
  }
  // Quy điểm về toạ độ ô trong khung rồi tra tập ô của mảnh.
  ...
}
```

Keep a small dilation so a tap just outside a thin piece still lands: grow by at most one logical cell **around the shape**, not out to a 48 px square. Then in `playController.onPointerDown`, replace the four-comparison bounding-box test with a call to `pieceContainsPoint`.

- [ ] **Step 6: Run tests**

Run: `npm test -- tests/pieceHitTest.test.ts` then `npm test`
Expected: both pass. If a drag test breaks, check that `pieceHitbox` still returns what it used to — the drag offset depends on it.

- [ ] **Step 7: Verify by hand — this is the item's real acceptance**

`npm run dev`, open `?scene=play&level=1-3&mode=harness` (two mirrored triangles). Tap the empty quadrant of each triangle's frame and confirm nothing is selected, or the piece actually drawn there is. Repeat on 1-6 (triangles plus a diamond) and on a level where two pieces sit close together.

- [ ] **Step 8: Run `detect_changes` and commit**

```bash
git add game-next/src/presentation/pieceHitTest.ts game-next/src/presentation/layout.ts game-next/src/application/playController.ts game-next/tests/pieceHitTest.test.ts CHANGELOG.md
git commit -m "fix(play): select the piece under the pointer, not the one whose frame covers it"
```

---

### Task 3: FX-6 — a completed node shows one mark, not two

**Files:**
- Modify: `game-next/src/presentation/TextureFactory.ts:437-463`, `game-next/src/presentation/LevelSelectScene.ts:355-390`
- Test: `game-next/tests/textureFactory.test.ts`

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "nodeCompleted", direction: "upstream"})`; expect `LevelSelectScene` only.

- [ ] **Step 2: Split the texture**

In `TextureFactory`, generate `node_completed` **without** the checkmark, and add `node_completed_check` that draws the same diamond plus the checkmark. Add the key to `TEXTURE_KEYS`. Move the explanatory comment to say which one is the fallback.

- [ ] **Step 3: Choose at the point that knows**

In `LevelSelectScene`, the `try` / `catch` around `drawTargetSilhouette` already knows whether a silhouette exists. Build the sprite **after** that decision:

```ts
      // Node đã hoàn thành: hiện bóng hình mình đã ghép, hoặc dấu tích nếu
      // không dựng được bóng — không bao giờ hiện cả hai (FX-6).
      let completedKey = TEXTURE_KEYS.nodeCompleted;
      let silhouette: Phaser.GameObjects.Graphics | null = this.add.graphics();
      try {
        drawTargetSilhouette(silhouette, loadLevel(node.id, this.mode), NODE_SILHOUETTE_FIT, {
          filled: COLOR_NUMBERS.navyBackdrop,
          hollow: COLOR_NUMBERS.amberSolid,
        });
      } catch {
        silhouette.destroy();
        silhouette = null;
        completedKey = TEXTURE_KEYS.nodeCompletedCheck;
      }
```

then create the sprite with `completedKey` and add `silhouette` on top only when it is non-null. Make sure the sprite is added to the container **before** the silhouette so the draw order is unchanged.

- [ ] **Step 4: Test**

Add to `tests/textureFactory.test.ts` that both keys are registered and are distinct. Then `npm test`.

- [ ] **Step 5: Verify by hand**

`npm run dev`, open the level-select map with completed levels. Confirm each completed node shows its silhouette with **no checkmark arms** behind it. To see the fallback, temporarily point `loadLevel` at a missing id and confirm the checkmark appears alone; revert that edit.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/presentation/TextureFactory.ts game-next/src/presentation/LevelSelectScene.ts game-next/tests/textureFactory.test.ts CHANGELOG.md
git commit -m "fix(map): a completed node shows its silhouette or a checkmark, never both"
```

---

### Task 4: FX-4 — bound the match bar

**Files:**
- Modify: `game-next/src/presentation/Hud.ts:375-396`
- Create: `game-next/src/presentation/matchBarLayout.ts`
- Test: `game-next/tests/matchBarLayout.test.ts`

**Interfaces:**
- Produces: `matchBarMetrics(total: number, textWidth: number, maxWidth: number): { width: number; iconSize: number; iconGap: number; showIcons: boolean }`.

- [ ] **Step 1: Measure before changing anything**

The spec's arithmetic predicts a collision at about ten pieces, while the largest level has seven and the bug was seen in play. **Find the real numbers first.** Run `npm run dev` on 3-6 (seven pieces), and log or screenshot the bar's left edge against the reset container's bounds at 720 × 1280. Write what you measured into the commit message. If the overlap is with the reset **label** rather than the circle, or the two rows share a y band, the fix must account for that — do not implement against the estimate.

- [ ] **Step 2: Write the failing test**

```ts
describe('matchBarMetrics', () => {
  it('ít mảnh thì giữ nguyên kích thước icon', () => {
    const m = matchBarMetrics(3, 40, 440);
    expect(m.showIcons).toBe(true);
    expect(m.iconSize).toBe(14);
    expect(m.width).toBeLessThanOrEqual(440);
  });

  it('nhiều mảnh thì thu nhỏ nhưng không vượt trần', () => {
    const m = matchBarMetrics(12, 40, 440);
    expect(m.width).toBeLessThanOrEqual(440);
  });

  it('quá nhiều mảnh thì bỏ icon, chỉ còn số đếm', () => {
    const m = matchBarMetrics(30, 40, 440);
    expect(m.showIcons).toBe(false);
    expect(m.width).toBeLessThanOrEqual(440);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**, then implement the degradation ladder — shrink `iconGap` first, then `iconSize`, then drop the icons — always returning a `width` at or below `maxWidth`.

- [ ] **Step 4: Wire it into `Hud.drawMatchBar`**

Derive `maxWidth` from the measured gap between the reset container and the rotate container rather than hard-coding it, so chapter 4's extra button is handled by the same formula.

- [ ] **Step 5: Verify by hand at the piece counts that matter**

Check 1-1 (2 pieces), 3-6 (7 pieces), and a temporary dev level with 12 pieces. Confirm no overlap at any of them, in both chapter 1 and chapter 4 layouts.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/presentation/matchBarLayout.ts game-next/src/presentation/Hud.ts game-next/tests/matchBarLayout.test.ts CHANGELOG.md
git commit -m "fix(hud): bound the match bar so it never reaches the bottom-row buttons"
```

---

### Task 5: FX-3 — remove the magnet ring

A deletion. VR3a's other additions stay.

**Files:**
- Modify: `game-next/src/presentation/BoardRenderer.ts` (lines 62, 109, 264, 499-511), `game-next/src/presentation/pieceMotion.ts` (the `magnetRing` helper), `game-next/src/presentation/designTokens.ts:230-231`
- Test: remove whatever pins `magnetRing` — search before deleting

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "magnetRing", direction: "upstream"})` and report it. Then `grep -rn "magnetRing" game-next/src game-next/tests` so nothing is missed.

- [ ] **Step 2: Delete**

Remove the graphics object, its creation, its entry in the clear/draw list at line 264, the draw block at 499-511, the `magnetRing` helper and its import, and `magnetRingFarRatio` / `magnetRingNearRatio`. Remove the tests that pin them rather than leaving them asserting a deleted function.

**Do not touch** the pickup anticipation dip (`anticipateOut`) or the unified target outline (`unionOutline`) — those are VR3a's other work and stay.

- [ ] **Step 3: Verify nothing dangles**

Run `npm run typecheck`, then `grep -rn "magnetRing" game-next/src game-next/tests` and expect no hits. Then `npm test`.

- [ ] **Step 4: Verify by hand**

`npm run dev`, drag a piece near its anchor and confirm no ring appears, while the snap itself and the tap ripple on empty space still work.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/BoardRenderer.ts game-next/src/presentation/pieceMotion.ts game-next/src/presentation/designTokens.ts game-next/tests/ CHANGELOG.md
git commit -m "feat(play): remove the magnet ring, it gave the anchor away for free"
```

---

### Task 6: FX-5 — redraw the icons as one family

**Files:**
- Modify: `game-next/src/presentation/TextureFactory.ts` — `icon_reset` (`:289`), `icon_eye_open` (`:183`), `icon_eye_closed` (`:211`), plus the settings and back icons; find them with `grep -n "icon" TextureFactory.ts`
- Test: `game-next/tests/textureFactory.test.ts`, `game-next/tests/bannedColors.test.ts`

- [ ] **Step 1: Write down the family rules before drawing**

Read the surviving VR1–VR3b drawing code (`drawJewel`, `diamondPath`, the node textures) and write the shared rules into a comment at the top of the icon section: one stroke width, one cap and join style, the diamond motif where an icon can carry it, and colours from `COLOR_TOKENS` only. Every icon then follows that comment.

- [ ] **Step 2: Redraw, one icon per step**

Keep every texture key, canvas size and call site unchanged so no consumer moves. Redraw `icon_reset`, then the two eyes, then settings, then back — checking each in the running game before starting the next.

- [ ] **Step 3: Test**

`npm test` — `bannedColors.test.ts` must stay green, which it will only if no colour literal was introduced.

- [ ] **Step 4: Verify by hand, side by side**

Screenshot the HUD and the menu before and after into `docs/screenshots/web/fx/`. The icons should read as one set with the jewel motif, not five unrelated glyphs.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/TextureFactory.ts game-next/tests/ docs/screenshots/web/fx/ CHANGELOG.md
git commit -m "feat(ui): redraw the HUD and menu icons in the jewel language"
```

---

### Task 7: Close-out

- [ ] **Step 1:** Add to `docs/ai/ARCHITECTURE.md`: hit testing uses the piece's rasterised cells, not the frame box, and the frame box survives only as a rejection pass and as the drag-offset source. Also that a completed map node renders a silhouette **or** a checkmark, decided by whether the silhouette built.
- [ ] **Step 2:** Set the FX row in `docs/ai/DOCS-INDEX.md` to this plan and state `done`.
- [ ] **Step 3:** Overwrite `docs/ai/STATUS.md`; ≤ 60 lines; bump the date.
- [ ] **Step 4:** Run `npm test`, `npm run build`, then `git diff --check` and `git status` from the repo root. Report the real output.
- [ ] **Step 5:** Commit, naming the doc files explicitly.

---

## Self-Review

**Spec coverage.** FX-1 → Task 2. FX-2 → Task 1. FX-3 → Task 5. FX-4 → Task 4. FX-5 → Task 6. FX-6 → Task 3. Spec §7 "Done when" → the per-task hand checks plus Task 7 Step 4.

**Where this plan refuses to guess.** Task 4 Step 1 makes measurement the first action, because the spec's own arithmetic disagrees with the reported symptom and implementing against a wrong model would produce a fix that does not fix it. Task 2 Step 2 makes the implementer decide whether the code or its comment is wrong about iteration order, rather than picking one here without reading `BoardRenderer`. Task 2 Step 3's test coordinates are left to be computed from the layout fixture rather than hard-coded, since inventing pixel values in a plan would pin the test to today's tokens.

**Type consistency.** `pieceContainsPoint` is named identically in Task 2 Steps 3, 5 and 6. `matchBarMetrics` and its four return fields are consistent across Task 4 Steps 2–4. `TEXTURE_KEYS.nodeCompleted` / `nodeCompletedCheck` are consistent across Task 3 Steps 2 and 3. `pieceHitbox` keeps its existing signature throughout — Task 2 Step 1 states this explicitly because the drag path depends on it.

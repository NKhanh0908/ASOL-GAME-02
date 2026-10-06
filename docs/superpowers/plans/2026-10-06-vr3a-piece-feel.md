# VR3a Piece Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give picking a piece up a sense of weight, telegraph the magnet before the player releases, and clear the faint ruler lines out of the board's interior.

**Architecture:** Three small additions on the play screen, each driven by a pure function that is tested without a renderer: a new easing in the VR0 registry, a ring geometry function in `pieceMotion.ts`, and a shorter layer list in `gridLayers.ts`. No new module, no extraction.

**Tech Stack:** TypeScript 5.7, Phaser 3.90, Vitest 2. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-06-vr3a-piece-feel-design.md`

## Global Constraints

- Run every command from `game-next/`. Node `>=24.13.1 <25`.
- Code comments, commit messages and CHANGELOG entries in English.
- Commit messages: `type(scope): summary` (`feat`, `fix`, `docs`, `chore`, `test`, `refactor`).
- Colours come from `COLOR_TOKENS` / `COLOR_NUMBERS`. `tests/bannedColors.test.ts` scans all of `src/` and fails on a literal hex.
- `designTokens.ts` is a leaf module and imports nothing from `presentation/`.
- Run `npm test` before every commit; `npm run build` before the final commit.

## Concurrency

VR2 (`plans/2026-10-06-vr2-level-select.md`) is being executed by another agent in the same working tree. It touches `LevelSelectScene.ts`, `TextureFactory.ts`, `TargetBadge.ts`, `hudText.ts`, `constellationMotion.ts` and `targetSilhouette.ts`. **This plan touches none of them.** If a step here would modify one of those files, stop and report instead.

## Status of the spec

The spec is `draft` — the reviewer has not yet read it. Task 1 is the one that carries real risk (§7: the dip costs ~40 ms of touch response on the game's most repeated action), so **Task 1 ends at a reviewer stop point.** Do not start Task 2 until the reviewer has held the build and accepted the pick-up feel.

---

### Task 1: Anticipation on pick up

`PieceView` applies the lift as `liftScale = 1 + (FEEDBACK_TOKENS.liftScale − 1) × lift` (`PieceView.ts:160`), and `lift` is `lerp(0, 1, EASES[ease](t))`, which is just `EASES[ease](t)`. With `liftScale = 1.08`, a lift of `−0.375` gives exactly `0.97`. So the dip is a curve, not a second animation — a second animation would multiply against the lift instead of replacing it.

**Files:**
- Modify: `game-next/src/presentation/transitions/motion.ts:5-19` (`EaseName`, `EASES`)
- Modify: `game-next/src/presentation/designTokens.ts` (`FEEDBACK_TOKENS`)
- Modify: `game-next/src/presentation/feedback/FeedbackDirector.ts:102`
- Test: `game-next/tests/motion.test.ts`

**Interfaces:**
- Consumes: `EASES.cubicOut`, already in the registry.
- Produces: `EaseName` gains `'anticipateOut'`; `EASES.anticipateOut(t: number): number`; `FEEDBACK_TOKENS.pickupMs`, `pickupDipLift`, `pickupDipAt`.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/motion.test.ts`:

```typescript
describe('anticipateOut', () => {
  const f = EASES.anticipateOut;

  test('starts at 0 and ends at 1', () => {
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
  });

  test('dips to exactly -0.375 at 40% of the duration', () => {
    expect(f(0.4)).toBeCloseTo(-0.375, 6);
    for (let t = 0; t <= 1.0001; t += 0.01) {
      expect(f(t)).toBeGreaterThanOrEqual(-0.375 - 1e-9);
    }
  });

  test('is continuous across the join', () => {
    expect(f(0.4 - 1e-6)).toBeCloseTo(f(0.4 + 1e-6), 4);
  });

  test('produces exactly the 0.97 dip and the 1.08 peak as a lift', () => {
    const scale = (t: number) => 1 + (FEEDBACK_TOKENS.liftScale - 1) * f(t);
    expect(scale(0.4)).toBeCloseTo(0.97, 6);
    expect(scale(1)).toBeCloseTo(1.08, 6);
  });
});
```

Add to that file's imports, merging with what is already there:

```typescript
import { EASES } from '../src/presentation/transitions/motion.ts';
import { FEEDBACK_TOKENS } from '../src/presentation/designTokens.ts';
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- motion`
Expected: FAIL — `EASES.anticipateOut is not a function`.

- [ ] **Step 3: Add the tokens**

In `game-next/src/presentation/designTokens.ts`, inside `FEEDBACK_TOKENS`, directly after `liftMs: 80,`:

```typescript
  /** Pick up: dip then lift. -0.375 x (liftScale - 1) lands the dip on 0.97. */
  pickupMs: 100,
  pickupDipLift: -0.375,
  pickupDipAt: 0.4,
```

- [ ] **Step 4: Add the easing**

In `game-next/src/presentation/transitions/motion.ts`, extend the union on line 5:

```typescript
export type EaseName =
  | 'linear'
  | 'cubicOut'
  | 'cubicInOut'
  | 'quartOut'
  | 'backOut'
  | 'sineInOut'
  | 'anticipateOut';
```

and add the entry to `EASES`, after `backOut`:

```typescript
  // Anticipation then lift: dips below zero before rising to one, so a value
  // driven by it compresses before it grows. Two cubicOut legs, the same shape
  // bounceScale uses, so the two read as one family. The dip depth and the
  // join live in FEEDBACK_TOKENS because PieceView's lift maths depends on
  // the exact value.
  anticipateOut: (t) => {
    const { pickupDipLift: dip, pickupDipAt: at } = FEEDBACK_TOKENS;
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (t <= at) return dip * EASES.cubicOut(t / at);
    return dip + (1 - dip) * EASES.cubicOut((t - at) / (1 - at));
  },
```

`motion.ts` already imports from `designTokens.ts` on line 1; extend that import to include `FEEDBACK_TOKENS`. The self-reference `EASES.cubicOut` inside an object literal is fine because the arrow body runs after the object exists.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- motion`
Expected: PASS.

- [ ] **Step 6: Use it on pick up**

In `game-next/src/presentation/feedback/FeedbackDirector.ts`, line 102, replace:

```typescript
        view?.setLifted(true, scaleTiming(F.liftMs), 'backOut');
```

with:

```typescript
        view?.setLifted(true, scaleTiming(F.pickupMs), 'anticipateOut');
```

Leave `F.liftMs` in the tokens: `dropLiftMs` and the other lift callers are unchanged.

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: PASS. `tests/feedbackEvents.test.ts` asserts the event sequence, not the easing, so it is unaffected.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/transitions/motion.ts src/presentation/designTokens.ts src/presentation/feedback/FeedbackDirector.ts tests/motion.test.ts
git commit -m "feat(piece): anticipate before the lift on pick up"
```

- [ ] **Step 9: REVIEWER STOP POINT**

Build and hand the reviewer a device:

```bash
npm run android:sync
cd android && cmd /c gradlew.bat assembleDebug
```

Ask them to drag pieces quickly and repeatedly in a level and answer one question: **does pick-up feel sluggish?**

If yes, revert Step 6 to `setLifted(true, scaleTiming(F.liftMs), 'backOut')`, keep the easing and the tests (they cost nothing and document the attempt), record the outcome, and stop the plan here for a decision. Do not tune the dip depth to split the difference without the reviewer asking for it.

If no, continue to Task 2.

---

### Task 2: The magnet ring geometry

A pure function first, with no renderer, so the shape is settled before anything is drawn.

**Files:**
- Modify: `game-next/src/presentation/pieceMotion.ts` (append)
- Modify: `game-next/src/presentation/designTokens.ts` (`FEEDBACK_TOKENS`)
- Test: `game-next/tests/pieceMotion.test.ts`

**Interfaces:**
- Produces: `magnetRing(distPx: number, pieceRadiusPx: number): { radius: number; alpha: number }`; `FEEDBACK_TOKENS.magnetRingFarRatio`, `magnetRingNearRatio`, `magnetRingSpanRatio`, `magnetRingAlphaFar`, `magnetRingAlphaNear`.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/pieceMotion.test.ts`:

```typescript
describe('magnetRing', () => {
  const R = 40;

  test('sits tight and bright when the piece is on the anchor', () => {
    const ring = magnetRing(0, R);
    expect(ring.radius).toBeCloseTo(R * FEEDBACK_TOKENS.magnetRingNearRatio, 6);
    expect(ring.alpha).toBeCloseTo(FEEDBACK_TOKENS.magnetRingAlphaNear, 6);
  });

  test('tightens and brightens as the piece closes', () => {
    const far = magnetRing(R * FEEDBACK_TOKENS.magnetRingSpanRatio, R);
    const mid = magnetRing(R * FEEDBACK_TOKENS.magnetRingSpanRatio * 0.5, R);
    const near = magnetRing(0, R);
    expect(far.radius).toBeGreaterThan(mid.radius);
    expect(mid.radius).toBeGreaterThan(near.radius);
    expect(far.alpha).toBeLessThan(mid.alpha);
    expect(mid.alpha).toBeLessThan(near.alpha);
  });

  test('clamps beyond the span instead of overshooting', () => {
    const edge = magnetRing(R * FEEDBACK_TOKENS.magnetRingSpanRatio, R);
    const beyond = magnetRing(R * 100, R);
    expect(beyond.radius).toBeCloseTo(edge.radius, 6);
    expect(beyond.alpha).toBeCloseTo(edge.alpha, 6);
  });

  test('never draws inside the piece', () => {
    for (let d = 0; d <= R * 2; d += R / 20) {
      expect(magnetRing(d, R).radius).toBeGreaterThan(R);
    }
  });
});
```

Add `magnetRing` to the existing `pieceMotion.ts` import in that file, and `FEEDBACK_TOKENS` to the `designTokens.ts` import.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- pieceMotion`
Expected: FAIL — `magnetRing is not a function`.

- [ ] **Step 3: Add the tokens**

In `FEEDBACK_TOKENS`, after `magnetStrength: 0.3,`:

```typescript
  magnetRingFarRatio: 1.45,
  magnetRingNearRatio: 1.05,
  magnetRingSpanRatio: 0.9,
  magnetRingAlphaFar: 0.18,
  magnetRingAlphaNear: 0.5,
```

- [ ] **Step 4: Write the function**

Append to `game-next/src/presentation/pieceMotion.ts`:

```typescript
/**
 * Ring drawn at the candidate anchor while a piece approaches it. A candidate
 * only exists inside the snap radius, so the ring appearing is the "in range"
 * signal and its tightening is the "how close" signal. Both ratios stay above
 * 1, so the ring never draws inside the piece itself.
 */
export function magnetRing(
  distPx: number,
  pieceRadiusPx: number
): { radius: number; alpha: number } {
  const F = FEEDBACK_TOKENS;
  const span = pieceRadiusPx * F.magnetRingSpanRatio;
  const k = span <= 0 ? 0 : Math.min(1, Math.max(0, distPx / span));
  return {
    radius: pieceRadiusPx * (F.magnetRingNearRatio + (F.magnetRingFarRatio - F.magnetRingNearRatio) * k),
    alpha: F.magnetRingAlphaNear + (F.magnetRingAlphaFar - F.magnetRingAlphaNear) * k,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- pieceMotion`
Expected: PASS, 4 new tests.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/pieceMotion.ts src/presentation/designTokens.ts tests/pieceMotion.test.ts
git commit -m "feat(piece): add the magnet ring geometry"
```

---

### Task 3: Draw the ring at the anchor

**Files:**
- Modify: `game-next/src/presentation/BoardRenderer.ts` (new graphics layer; a `candidateCenter` helper; a draw call in `tick`)

**Interfaces:**
- Consumes: `magnetRing` from Task 2; `anchorCenter` from `pieceMotion.ts`; `pieceCenterCanvas`, `pieceRadiusPx` from `layout.ts`.
- Produces: nothing for later tasks.

**Why this does not go in `syncPreview`:** `syncPreview` is cached on `previewKey` (`BoardRenderer.ts:426-428`) and returns early unless the piece or the candidate id changes. The ring must change with distance on every frame, so it needs its own draw call in `tick`.

- [ ] **Step 1: Add the graphics layer**

In `game-next/src/presentation/BoardRenderer.ts`, beside the other layer fields (around line 62):

```typescript
  private readonly magnetRingGraphics: Phaser.GameObjects.Graphics;
```

and in the constructor, next to `previewGraphics` (around line 106):

```typescript
    // Below the dragged piece: the ring is tier 2, the piece stays tier 3.
    this.magnetRingGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
```

Add it to the array returned by `getTransitionParts()` alongside `this.previewGraphics`, so scene transitions pose it with everything else.

- [ ] **Step 2: Add the candidate-centre helper**

`syncPreview` resolves a candidate id to a polygon for both placement modes. The ring needs the same resolution as a point. Add a private method next to `syncPreview`:

```typescript
  /**
   * Canvas centre of the current snap candidate, for both placement modes:
   * anchored levels carry an anchor id, free-placement levels carry
   * `grid:gx,gy`. `anchorCenter` alone only answers the first.
   */
  private candidateCenter(
    piece: Piece,
    candidateId: string,
    turns: number
  ): { x: number; y: number } | null {
    if (this.level.placement === 'free') {
      const match = candidateId.match(/^grid:(-?\d+),(-?\d+)$/);
      if (!match) return null;
      return pieceCenterCanvas(
        piece.frameSize,
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        this.layout
      );
    }
    return anchorCenter(piece, candidateId, this.layout);
  }
```

`turns` is accepted but unused for the centre, which is rotation-invariant; keep the parameter out if the typecheck flags it as unused.

- [ ] **Step 3: Draw it each frame**

Add a private method:

```typescript
  /**
   * Ring at the candidate anchor, tightening as the piece closes. Redrawn
   * every frame because it tracks distance; this is the hot path, so it is one
   * clear and at most one strokeCircle.
   */
  private syncMagnetRing(snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.magnetRingGraphics.clear();
    const drag = snapshot.dragInfo;
    if (!drag || !drag.snapCandidateId) return;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    if (!piece) return;
    const turns = (pieces[piece.id] ?? { turns: 0 }).turns;
    const center = this.candidateCenter(piece, drag.snapCandidateId, turns);
    if (!center) return;

    const dist = Math.hypot(drag.x - center.x, drag.y - center.y);
    const ring = magnetRing(dist, pieceRadiusPx(piece.frameSize, this.layout));
    this.magnetRingGraphics.lineStyle(1.5, COLOR_NUMBERS.icePrimary, ring.alpha);
    this.magnetRingGraphics.strokeCircle(center.x, center.y, ring.radius);
  }
```

Call it from `tick`, immediately after `this.syncPreview(snapshot, pieces);`:

```typescript
    this.syncMagnetRing(snapshot, pieces);
```

Add `magnetRing` to the existing `./pieceMotion.ts` import and `pieceRadiusPx` to the existing `./layout.ts` import if they are not already there.

**Do not guard this with `isReducedMotion()`.** The spec §3.2 states why: it is an affordance driven by the player's own finger, not autonomous motion, and removing it would remove information rather than motion.

- [ ] **Step 4: Run the suite**

Run: `npm test`
Expected: PASS. `tests/boardRenderer*.test.ts` call `render()`, which calls `tick(0, …)`; with no drag in those snapshots the new method clears and returns, so nothing changes.

- [ ] **Step 5: Look at it**

Run: `npm run dev` and open `http://localhost:5173/?scene=play&level=1-3&mode=harness`.
Expected: dragging a piece near an anchor shows a faint ice ring that tightens and brightens as the piece closes, sits behind the piece, and disappears the moment the candidate is lost. Nothing appears while dragging in open space.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/BoardRenderer.ts
git commit -m "feat(piece): telegraph the magnet with a ring at the anchor"
```

---

### Task 4: Clear the board's interior ruler lines

Reviewer decision, 2026-10-06: the faint lines inside the stele are not needed — only the border and the edge marks. `buildGridLayers` returns five layers; four of them draw inside the board (`fine` at alpha 0.13, `diagonal` at 0.16, `module` at 0.3, `axis` at 0.6). `tick` draws short marks at the four edges and the corner marks sit at the corners; both stay.

**Files:**
- Modify: `game-next/src/presentation/gridLayers.ts:139-147` and the now-dead builders
- Modify: `game-next/src/presentation/GridPainter.ts:13-19` (`STYLE`)
- Modify: `game-next/src/presentation/designTokens.ts` (`GRID_TOKENS`, only if nothing else reads the four styles)
- Test: `game-next/tests/gridLayers.test.ts`

**Interfaces:**
- Produces: `GridLayerName` narrows to `'tick'`; `buildGridLayers` returns a single layer.

- [ ] **Step 1: Update the test to the new shape**

In `game-next/tests/gridLayers.test.ts`, replace the layer-list assertion:

```typescript
  test('chỉ còn lớp vạch rìa; lòng bia không còn đường kẻ nào', () => {
    expect(layers.map((l) => l.name)).toEqual(['tick']);
  });

  test('không đoạn nào nằm sâu trong lòng bia', () => {
    const inset = GRID_TOKENS.tick.longLen;
    for (const layer of layers) {
      for (const s of layer.segments) {
        const touchesEdge =
          Math.min(s.x1, s.x2) <= board.x + inset ||
          Math.max(s.x1, s.x2) >= board.x + board.width - inset ||
          Math.min(s.y1, s.y2) <= board.y + inset ||
          Math.max(s.y1, s.y2) >= board.y + board.height - inset;
        expect(touchesEdge).toBe(true);
      }
    }
  });
```

Delete the four tests that assert the removed layers: the `fine` spacing test, the `module` 120px test, the `axis` test and the `diagonal` test. Keep the `tick` test and any corner-mark test.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- gridLayers`
Expected: FAIL — the list still has five names.

- [ ] **Step 3: Shorten the layer list**

In `game-next/src/presentation/gridLayers.ts`:

```typescript
export type GridLayerName = 'tick';
```

```typescript
/**
 * Only the edge ruler marks are drawn. Reviewer decision 2026-10-06: the
 * stele's interior stays empty, so the player's own figure is the only thing
 * on it. The border and the corner marks carry the frame.
 */
export function buildGridLayers(board: BoardBox): GridLayer[] {
  return [{ name: 'tick', segments: ticks(board) }];
}
```

Then delete the builders that are now unreachable: `lineGrid`, `diagonals`, `axes`, and any constants used only by them. Run `npm run typecheck` after each deletion — if a symbol is still referenced somewhere, keep it and say so in the commit message rather than forcing the deletion.

- [ ] **Step 4: Shorten the style map**

In `game-next/src/presentation/GridPainter.ts`:

```typescript
const STYLE: Record<GridLayerName, LayerStyle> = {
  tick: GRID_TOKENS.tick,
};
```

- [ ] **Step 5: Remove the dead style tokens, if they are dead**

Run: `grep -rn "GRID_TOKENS.fine\|GRID_TOKENS.diagonal\|GRID_TOKENS.module\|GRID_TOKENS.axis" src tests`

If that returns nothing, delete the `fine`, `diagonal`, `module` and `axis` entries from `GRID_TOKENS` in `designTokens.ts`. Keep `logicCellPx`, `displayCellInLogicCells`, `moduleInDisplayCells`, `tick` and `corner` — `tests/designTokens.test.ts:40-50` asserts the first three and `ticks()` still uses the module ratio for its long marks.

If the grep finds a consumer, leave the tokens alone and note it in the commit message.

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: PASS. `tests/gridAlignment.test.ts` reads only `GRID_TOKENS.moduleInDisplayCells`, which stays.

Run: `npm run build`
Expected: typecheck clean, bundle written.

- [ ] **Step 7: Look at it**

Run: `npm run dev` and open a level.
Expected: the stele's interior is empty — no fine grid, no diagonals, no module lines, no centre cross. The four edges still carry their short ruler marks and the four corners their L marks. Confirm the pieces are still easy to place: snapping does the work, but say so if alignment now feels guessy.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/gridLayers.ts src/presentation/GridPainter.ts src/presentation/designTokens.ts tests/gridLayers.test.ts
git commit -m "feat(board): empty the stele interior, keep the edge marks"
```

---

### Task 5: One outline for the whole target, not one per piece

Reviewer finding, 2026-10-06, from `docs/screenshots/web/m1/image copy.png`: the house target shows a horizontal line where the roof meets the body. The cause is in `BoardRenderer.drawTargetSilhouette` (`:505-523`), which loops over `level.targetPlacements` and calls `drawJewelPolygon(..., variant: 'target')` once per placement. That variant both fills **and** dash-strokes its polygon (`JewelShape.ts:88-96`), so every shared edge is stroked twice and reads as a seam. The target should read as one silhouette.

**Fills stay per placement; only the stroke is merged.** Each placement carries its own `hoverAlpha[i]` (brightening the piece the player is dragging toward) and its own `targetReveal[i]` (the victory reveal). Merging the fills would throw both away. Fills of the same colour meeting along an edge produce no visible seam, so merging them buys nothing — the stroke is the whole problem and the whole fix.

**Files:**
- Modify: `game-next/src/presentation/polygonClip.ts` (append)
- Modify: `game-next/src/presentation/JewelShape.ts` (split the stroke off the target variant)
- Modify: `game-next/src/presentation/BoardRenderer.ts:505-523`
- Test: `game-next/tests/polygonClip.test.ts`

**Interfaces:**
- Consumes: `signedArea` from `polygonClip.ts`; `strokeDashedPolygon`, `PIECE_TOKENS` already in `JewelShape.ts`.
- Produces: `unionOutline(polygons: readonly (readonly Pt[])[]): Pt[][]` — closed boundary loops of the union, interior edges removed, collinear runs merged. Pure, no Phaser. And `strokeTargetOutline(g, loop, alpha): void` in `JewelShape.ts`.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/polygonClip.test.ts`, adding `unionOutline` to the existing import from `../src/presentation/polygonClip.ts`:

```typescript
const square = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];

describe('unionOutline', () => {
  test('a single square comes back as itself', () => {
    const loops = unionOutline([square(0, 0, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
  });

  test('two squares sharing a full edge become one 4-corner loop', () => {
    const loops = unionOutline([square(0, 0, 10, 10), square(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
    const ys = loops[0].map((p) => p.y).sort((a, b) => a - b);
    expect(ys[0]).toBe(0);
    expect(ys[3]).toBe(20);
  });

  test('two squares sharing half an edge keep the exposed half', () => {
    const loops = unionOutline([square(0, 0, 20, 10), square(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(6);
  });

  test('a triangle on a square keeps only the house outline', () => {
    const body = square(0, 10, 20, 20);
    const roof = [
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 20, y: 10 },
    ];
    const loops = unionOutline([body, roof]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(5);

    // The seam the reviewer saw: the full span from (0,10) to (20,10) must not
    // survive as an edge of the result.
    const hasSeam = loops[0].some((p, i) => {
      const q = loops[0][(i + 1) % loops[0].length];
      return p.y === 10 && q.y === 10 && Math.abs(p.x - q.x) === 20;
    });
    expect(hasSeam).toBe(false);
  });

  test('two disjoint squares stay two loops', () => {
    const loops = unionOutline([square(0, 0, 10, 10), square(50, 50, 10, 10)]);
    expect(loops).toHaveLength(2);
  });

  test('ignores the winding direction of the inputs', () => {
    const cw = [...square(0, 0, 10, 10)].reverse();
    const loops = unionOutline([cw, square(0, 10, 10, 10)]);
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- polygonClip`
Expected: FAIL — `unionOutline is not a function`.

- [ ] **Step 3: Write the function**

Append to `game-next/src/presentation/polygonClip.ts`:

```typescript
const UNION_EPS = 1e-6;

function samePoint(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) < UNION_EPS && Math.abs(a.y - b.y) < UNION_EPS;
}

/**
 * Splits every edge at any input vertex that lies strictly inside it, so two
 * polygons sharing only part of an edge still produce matching halves that can
 * cancel against each other.
 */
function splitAtVertices(edges: Array<[Pt, Pt]>, vertices: readonly Pt[]): Array<[Pt, Pt]> {
  const out: Array<[Pt, Pt]> = [];
  for (const [a, b] of edges) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < UNION_EPS) continue;
    const along = (p: Pt) => (p.x - a.x) * dx + (p.y - a.y) * dy;
    const cuts: Pt[] = [];
    for (const v of vertices) {
      if (samePoint(v, a) || samePoint(v, b)) continue;
      const cross = (v.x - a.x) * dy - (v.y - a.y) * dx;
      if (Math.abs(cross) > UNION_EPS * Math.sqrt(len2)) continue;
      const t = along(v) / len2;
      if (t > UNION_EPS && t < 1 - UNION_EPS) cuts.push(v);
    }
    cuts.sort((p, q) => along(p) - along(q));
    let from = a;
    for (const cut of cuts) {
      if (!samePoint(from, cut)) out.push([from, cut]);
      from = cut;
    }
    if (!samePoint(from, b)) out.push([from, b]);
  }
  return out;
}

/** Drops vertices sitting on the straight line between their two neighbours. */
function dropCollinear(loop: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < loop.length; i++) {
    const prev = loop[(i - 1 + loop.length) % loop.length];
    const cur = loop[i];
    const next = loop[(i + 1) % loop.length];
    const cross = (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x);
    if (Math.abs(cross) > UNION_EPS) out.push(cur);
  }
  return out.length >= 3 ? out : [...loop];
}

/**
 * Boundary loops of the union of `polygons`.
 *
 * Every polygon is wound counter-clockwise, then every edge is split at any
 * vertex lying on it. An edge that then appears in both directions is interior
 * to the union and cancels; what survives is the boundary, chained into closed
 * loops and simplified across collinear runs.
 *
 * Used by the target silhouette: one dashed outline per placement strokes each
 * shared edge twice, which reads as a seam through the figure.
 */
export function unionOutline(polygons: readonly (readonly Pt[])[]): Pt[][] {
  const vertices: Pt[] = [];
  let edges: Array<[Pt, Pt]> = [];
  for (const polygon of polygons) {
    if (polygon.length < 3) continue;
    const ring = signedArea(polygon) < 0 ? [...polygon].reverse() : [...polygon];
    for (let i = 0; i < ring.length; i++) {
      vertices.push(ring[i]);
      edges.push([ring[i], ring[(i + 1) % ring.length]]);
    }
  }
  edges = splitAtVertices(edges, vertices);

  // Cancel each edge against one opposite twin.
  const alive = edges.map(() => true);
  for (let i = 0; i < edges.length; i++) {
    if (!alive[i]) continue;
    for (let j = i + 1; j < edges.length; j++) {
      if (!alive[j]) continue;
      if (samePoint(edges[i][0], edges[j][1]) && samePoint(edges[i][1], edges[j][0])) {
        alive[i] = false;
        alive[j] = false;
        break;
      }
    }
  }

  const remaining = edges.filter((_, i) => alive[i]);
  const used = remaining.map(() => false);
  const loops: Pt[][] = [];
  for (let i = 0; i < remaining.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const loop: Pt[] = [remaining[i][0]];
    let end = remaining[i][1];
    let guard = remaining.length + 1;
    while (!samePoint(end, loop[0]) && guard-- > 0) {
      const next = remaining.findIndex((e, k) => !used[k] && samePoint(e[0], end));
      if (next < 0) break;
      used[next] = true;
      loop.push(remaining[next][0]);
      end = remaining[next][1];
    }
    if (loop.length >= 3) loops.push(dropCollinear(loop));
  }
  return loops;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- polygonClip`
Expected: PASS, 6 new tests.

- [ ] **Step 5: Split the stroke off the target variant**

In `game-next/src/presentation/JewelShape.ts`, the `target` branch currently fills then dash-strokes. Make it fill only:

```typescript
  if (variant === 'target') {
    g.fillStyle(hex(PIECE_TOKENS.targetFill.color), PIECE_TOKENS.targetFill.alpha * alpha);
    g.fillPoints(toGeomPoints(outline), true);
    return;
  }
```

and export the stroke separately, beside `drawJewelPolygon`:

```typescript
/**
 * Dashed outline for a target silhouette. Separate from the fill because the
 * figure is filled per placement — each keeps its own hover and reveal alpha —
 * but outlined once for the whole union, so shared edges are not drawn twice.
 */
export function strokeTargetOutline(
  g: Phaser.GameObjects.Graphics,
  loop: readonly { x: number; y: number }[],
  alpha: number
): void {
  g.lineStyle(
    PIECE_TOKENS.targetStroke.width,
    hex(PIECE_TOKENS.targetStroke.color),
    PIECE_TOKENS.targetStroke.alpha * alpha
  );
  strokeDashedPolygon(g, loop, PIECE_TOKENS.targetStroke.dash);
}
```

- [ ] **Step 6: Draw one outline in `BoardRenderer`**

Replace `drawTargetSilhouette` (`BoardRenderer.ts:505-523`) with:

```typescript
  private drawTargetSilhouette(snapshot: PlayViewSnapshot): void {
    this.targetGraphics.clear();
    if (!snapshot.showTarget) return;
    const visible: CanvasPoint[][] = [];
    let outlineAlpha = 0;
    (this.level.targetPlacements ?? []).forEach((placement, index) => {
      const reveal = this.targetReveal?.[index] ?? 1;
      if (reveal <= 0) return;
      const piece = this.level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return;
      const polygon = piecePolygonCanvas(piece, placement.x, placement.y, placement.turns, this.layout);
      const alpha = this.hoverAlpha[index] * reveal;
      drawJewelPolygon(this.targetGraphics, polygon, {
        variant: 'target',
        alpha,
        sizePx: pieceRadiusPx(piece.frameSize, this.layout),
      });
      visible.push(polygon);
      outlineAlpha = Math.max(outlineAlpha, alpha);
    });

    // One dashed boundary for the whole figure: an outline per placement would
    // stroke every shared edge twice and draw a seam through the silhouette.
    for (const loop of unionOutline(visible)) {
      strokeTargetOutline(this.targetGraphics, loop, outlineAlpha);
    }
  }
```

Add `unionOutline` to the existing `./polygonClip.ts` import and `strokeTargetOutline` to the existing `./JewelShape.ts` import.

- [ ] **Step 7: Run the suite and the build**

Run: `npm test`
Expected: PASS. The board tests assert reveal and parity behaviour rather than stroke counts; if one does assert a draw-call count, update it and say so in the commit message.

Run: `npm run build`
Expected: typecheck clean.

- [ ] **Step 8: Look at every approved level**

Run: `npm run dev` and step through the approved levels with `http://localhost:5173/?scene=play&level=<id>&mode=harness`, starting with `1-2`, the house from the screenshot.

Expected: each target reads as one closed dashed figure with no internal lines. Pay particular attention to any level whose pieces share only part of an edge — the outline must follow the real boundary there rather than cut across it. If a level comes out with a broken or doubled outline, **stop and report it with the level id** instead of special-casing that level.

- [ ] **Step 9: Commit**

```bash
git add src/presentation/polygonClip.ts src/presentation/JewelShape.ts src/presentation/BoardRenderer.ts tests/polygonClip.test.ts
git commit -m "feat(board): outline the target once, not once per piece"
```

---

### Task 6: Close out the plan

**Files:**
- Modify: `CHANGELOG.md`, `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md`, `docs/superpowers/specs/2026-10-06-vr3a-piece-feel-design.md`

- [ ] **Step 1: Record both reviewer additions in the spec**

Tasks 4 and 5 came from the reviewer after the spec was written. Add them as §3.4 (empty stele interior) and §3.5 (one outline for the whole target), each with its decision and its reason, so the spec and the code agree.

- [ ] **Step 2: Add the CHANGELOG entry**

Under `## Unreleased`, newest first: what changed with file paths, the reviewer's verdict on the pick-up dip from Task 1 Step 9, and a `Verification:` bullet with the real `npm test` and `npm run build` output.

- [ ] **Step 3: Update `docs/ai/DOCS-INDEX.md`**

Set the VR3a row's plan column to `plans/2026-10-06-vr3a-piece-feel.md` and its state to `done`, or to `partial` if the dip was reverted at the stop point.

- [ ] **Step 4: Overwrite `docs/ai/STATUS.md`**

Bump the date line, move VR3a in the streams table, keep the file under 60 lines.

- [ ] **Step 5: Final checks and commit**

```bash
npm test
npm run build
git diff --check
git status
git add CHANGELOG.md docs/
git commit -m "docs(vr3a): record the piece feel pass"
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| §3.1 anticipation on pick up | 1 |
| §3.2 ring at the anchor | 2, 3 |
| §3.3 explicitly unchanged | None by design — no task touches §2, §4, §5.1 or §5.2 |
| Reviewer addition: empty the stele interior | 4 (spec amended in Task 6 Step 1) |
| Reviewer addition: one outline for the whole target | 5 (spec amended in Task 6 Step 1) |
| §5 testing | Each task's own test steps |
| §6 out of scope | Unchanged |

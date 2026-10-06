# VR2 Level Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the constellation map show what the player has built and where the released content ends, with motion confined to the single node they are on.

**Architecture:** Everything lives in `LevelSelectScene.ts` and the textures it draws from, except one extraction: the target-silhouette renderer moves out of `TargetBadge` into a shared module so a map node can draw the same figure the play screen draws. The silhouette module is split into a pure geometry function and a thin Phaser draw call, so the geometry is testable without a renderer.

**Tech Stack:** TypeScript 5.7, Phaser 3.90, Vitest 2. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-06-visual-refactor-level-select-design.md`

## Global Constraints

- Run every command from `game-next/`. Node `>=24.13.1 <25`.
- Code comments, commit messages and CHANGELOG entries in English.
- Commit messages: `type(scope): summary` (`feat`, `fix`, `docs`, `chore`, `test`, `refactor`).
- Colours come from `COLOR_TOKENS` / `COLOR_NUMBERS` in `designTokens.ts`. `tests/bannedColors.test.ts` scans all of `src/` and fails on any hex outside the three approved families — never write a literal hex.
- `designTokens.ts` is a leaf module: it imports nothing from `presentation/`. Motion families live in `transitions/motion.ts` (VR0).
- Reduced motion: anything that tweens must be skipped when `isReducedMotion()` is true (`transitions/motion.ts`).
- Glow ladder (VR1 §3.2) applies to this screen: tier 3 current node, tier 2 completed nodes, tier 1 links, tier 0 locked nodes, chapter labels, frontier node.
- Run `npm test` before every commit. Run `npm run build` before the final commit of the plan.

## Scope note — what this plan deliberately leaves out

Spec §3.1 (the constellation strip in the victory card) is **not** in this plan. It needs the 48 px card slot defined by VR3b (`2026-10-06-vr3b-medallion-victory-ritual-design.md` §3.1), and the reviewer chose on 2026-10-06 to defer VR3b. Nothing else in the spec depends on the card, so Tasks 1–7 below cover §3.2 through §3.6 in full.

Consequence to carry forward: the spec's §6 already records that issue #1 ("no sense of journey") is only partly addressed; without §3.1 it is addressed less than the spec assumed, because the strip was the piece every player would have seen. `VICTORY_CARD_GROUPS` stays 4 and `Hud.ts` is not touched by this plan.

## Correction to the spec, found while planning

Spec §3.2 estimates the usable area inside a 96 px node at "~68 px", reading it as the inscribed square of the canvas. The node is a **diamond**, not a square: a point is inside it only when `|x| + |y| <= r`, where `r` is the diamond's half-diagonal. Scaling the current radius (32 in a 72 px canvas) gives `r = 43` at 96 px. With 4 px of padding the budget is `|x| + |y| <= 39`, so a fitted box of width `w` and height `h` is safe only when `(w + h) / 2 <= 39`.

This plan therefore fits node silhouettes into a **46 × 32** box — exactly half the badge's 92 × 64, so the aspect ratio is identical and `(46 + 32) / 2 = 39` lands on the budget. The figure is smaller than the spec assumed. Task 3 ends with a reviewer check on whether it still reads; the spec's §7 fallback (simplify the silhouette rather than grow the node) applies if it does not.

---

### Task 1: Extract the target silhouette into a shared module

The renderer currently lives inside `TargetBadge` as a private method that both computes geometry and draws it. Task 3 needs the same geometry at a different size and in different colours. Split it: a pure function that returns polygons, and a thin draw call.

**Files:**
- Create: `game-next/src/presentation/targetSilhouette.ts`
- Modify: `game-next/src/presentation/TargetBadge.ts:120-171` (remove the private method, call the module)
- Test: `game-next/tests/targetSilhouette.test.ts`

**Interfaces:**
- Consumes: `loadLevel` from `src/content/catalog.ts`; `parityLayers` from `./polygonClip.ts`; `effectiveOrientation`, `shapePolygon` from `../domain/shapes.ts`.
- Produces:
  - `type SilhouetteBox = { width: number; height: number }`
  - `type SilhouetteLayer = { filled: boolean; points: ReadonlyArray<{ x: number; y: number }> }`
  - `BADGE_SILHOUETTE_BOX: SilhouetteBox` = `{ width: 92, height: 64 }`
  - `NODE_SILHOUETTE_BOX: SilhouetteBox` = `{ width: 46, height: 32 }`
  - `silhouetteLayers(level: Level, box: SilhouetteBox): SilhouetteLayer[]` — pure, origin-centred, y down
  - `drawTargetSilhouette(g: Phaser.GameObjects.Graphics, level: Level, box: SilhouetteBox, colors: { filled: number; hollow: number }): void`

- [ ] **Step 1: Write the failing test**

Create `game-next/tests/targetSilhouette.test.ts`:

```typescript
import { describe, expect, test } from 'vitest';
import { loadLevel } from '../src/content/catalog.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import {
  BADGE_SILHOUETTE_BOX as BADGE_BOX,
  NODE_SILHOUETTE_BOX as NODE_BOX,
  silhouetteLayers,
} from '../src/presentation/targetSilhouette.ts';

describe('silhouetteLayers', () => {
  test('fits every approved level inside the badge box', () => {
    for (const entry of campaignManifest.filter((e) => e.status === 'approved')) {
      const layers = silhouetteLayers(loadLevel(entry.id, 'campaign'), BADGE_BOX);
      expect(layers.length, entry.id).toBeGreaterThan(0);
      for (const layer of layers) {
        for (const p of layer.points) {
          expect(Math.abs(p.x), `${entry.id} x`).toBeLessThanOrEqual(BADGE_BOX.width / 2 + 0.001);
          expect(Math.abs(p.y), `${entry.id} y`).toBeLessThanOrEqual(BADGE_BOX.height / 2 + 0.001);
        }
      }
    }
  });

  test('node box keeps every point inside the diamond |x| + |y| <= 39', () => {
    for (const entry of campaignManifest.filter((e) => e.status === 'approved')) {
      const layers = silhouetteLayers(loadLevel(entry.id, 'campaign'), NODE_BOX);
      for (const layer of layers) {
        for (const p of layer.points) {
          expect(Math.abs(p.x) + Math.abs(p.y), entry.id).toBeLessThanOrEqual(39.001);
        }
      }
    }
  });

  test('halving the box halves every coordinate', () => {
    const level = loadLevel('1-1', 'campaign');
    const big = silhouetteLayers(level, BADGE_BOX);
    const small = silhouetteLayers(level, NODE_BOX);
    expect(small.length).toBe(big.length);
    for (let i = 0; i < big.length; i++) {
      expect(small[i].filled).toBe(big[i].filled);
      for (let j = 0; j < big[i].points.length; j++) {
        expect(small[i].points[j].x).toBeCloseTo(big[i].points[j].x / 2, 6);
        expect(small[i].points[j].y).toBeCloseTo(big[i].points[j].y / 2, 6);
      }
    }
  });

  test('returns nothing for a level with an empty target mask', () => {
    const level = { ...loadLevel('1-1', 'campaign'), targetMask: [] as number[] };
    expect(silhouetteLayers(level, BADGE_BOX)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- targetSilhouette`
Expected: FAIL — `Failed to resolve import "../src/presentation/targetSilhouette.ts"`.

- [ ] **Step 3: Write the module**

Create `game-next/src/presentation/targetSilhouette.ts`:

```typescript
// Type-only Phaser import: erased at runtime, so this module can be imported
// by a Vitest test. Every module the tests reach (polygonClip, jewelGeometry,
// constellationMotion) follows the same rule. `fillPoints` accepts plain
// {x, y} objects, so no `Phaser.Geom.Point` is needed here — do not "fix"
// this to match BoardRenderer, which imports Phaser as a value.
import type Phaser from 'phaser';
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import type { Level } from '../domain/model.ts';
import { parityLayers } from './polygonClip.ts';

export type SilhouetteBox = { width: number; height: number };
export type SilhouetteLayer = {
  filled: boolean;
  points: ReadonlyArray<{ x: number; y: number }>;
};

/** Chord of the play badge's gold ring that the figure must stay inside. */
export const BADGE_SILHOUETTE_BOX: SilhouetteBox = { width: 92, height: 64 };

/**
 * A map node is a diamond of radius 43, so a point fits only when
 * |x| + |y| <= 43. With 4px of padding the budget is 39, and 46 x 32 is the
 * largest box with the badge's aspect ratio satisfying (w + h) / 2 <= 39.
 */
export const NODE_SILHOUETTE_BOX: SilhouetteBox = { width: 46, height: 32 };

/**
 * Target figure as parity polygons, centred on the origin and scaled to fit
 * `box`. Pure: no Phaser objects, so the fit can be tested without a renderer.
 * Callers pass the box their shape allows — a circle's chord for the badge, a
 * diamond's inscribed budget for a map node.
 */
export function silhouetteLayers(level: Level, box: SilhouetteBox): SilhouetteLayer[] {
  let minX = GRID_WIDTH;
  let maxX = -1;
  let minY = GRID_HEIGHT;
  let maxY = -1;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if ((level.targetMask[y * GRID_WIDTH + x] ?? 0) > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return [];

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const centerX = (minX + maxX + 1) / 2;
  const centerY = (minY + maxY + 1) / 2;
  const scale = Math.min(box.width / w, box.height / h);

  // One path for every level: draw the sample solution's placements as vectors
  // rather than filling mask cells, which used to produce jagged edges.
  const polygons = (level.targetPlacements ?? []).flatMap((placement) => {
    const piece = level.pieces.find((p) => p.id === placement.pieceId);
    if (!piece) return [];
    const kind = piece.shapeKind ?? 'diamond';
    const orientation = effectiveOrientation(kind, piece.orientation ?? 0, placement.turns);
    return [
      shapePolygon(kind, orientation, piece.frameSize).map((v) => ({
        x: (placement.x + v.x - centerX) * scale,
        y: (placement.y + v.y - centerY) * scale,
      })),
    ];
  });

  return parityLayers(polygons).map((layer) => ({
    filled: layer.filled,
    points: layer.points,
  }));
}

/** Draws what `silhouetteLayers` computes. Colours differ by surface. */
export function drawTargetSilhouette(
  g: Phaser.GameObjects.Graphics,
  level: Level,
  box: SilhouetteBox,
  colors: { filled: number; hollow: number }
): void {
  for (const layer of silhouetteLayers(level, box)) {
    g.fillStyle(layer.filled ? colors.filled : colors.hollow, 1);
    g.fillPoints(layer.points as Array<{ x: number; y: number }>, true);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- targetSilhouette`
Expected: PASS, 4 tests.

- [ ] **Step 5: Point `TargetBadge` at the module**

In `game-next/src/presentation/TargetBadge.ts`, delete the whole private `drawTargetSilhouette` method (the block from the `let minX = GRID_WIDTH;` bounding-box scan through the closing brace after the `parityLayers` loop) and replace the call in the constructor.

Remove these imports, now unused:

```typescript
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import { parityLayers } from './polygonClip.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
```

Add:

```typescript
import { BADGE_SILHOUETTE_BOX, drawTargetSilhouette } from './targetSilhouette.ts';
```

Replace the constructor line `this.drawTargetSilhouette(level);` with:

```typescript
    drawTargetSilhouette(this.targetGraphics, level, BADGE_SILHOUETTE_BOX, {
      filled: COLOR_NUMBERS.amberSolid,
      hollow: COLOR_NUMBERS.boardSurfaceTop,
    });
```

- [ ] **Step 6: Run the whole suite and the typecheck**

Run: `npm test`
Expected: PASS, 89 files. `tests/boardRenderer.test.ts` and the play-screen tests must be unchanged — the badge renders exactly as before, because `BADGE_BOX` reproduces the old `Math.min(92 / w, 64 / h)`.

Run: `npm run typecheck`
Expected: no errors. If `Phaser` is now unused in `TargetBadge.ts`, remove that import too.

- [ ] **Step 7: Commit**

```bash
git add src/presentation/targetSilhouette.ts src/presentation/TargetBadge.ts tests/targetSilhouette.test.ts
git commit -m "refactor(visual): extract the target silhouette renderer"
```

---

### Task 2: Grow the four map node textures to 96 px

The node canvases are 72 px with a diamond of radius 32. Everything inside scales by `96 / 72`, so radius 43 and every drawn coordinate multiplied by the same factor. The hit area is already 96 × 96 and does not change.

**Files:**
- Modify: `game-next/src/presentation/TextureFactory.ts:436-550` (four node canvases)
- Test: `game-next/tests/levelSelect.test.ts` (add a spacing guard)

**Interfaces:**
- Consumes: `TextureFactory.diamondPath(ctx, cx, cy, r)` — unchanged.
- Produces: `node_completed`, `node_current`, `node_unlocked`, `node_locked` at 96 × 96 with diamond radius 43 centred at (48, 48).

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/levelSelect.test.ts`, inside the existing `describe('Bố cục bản đồ chòm sao (CH-03)')` block:

```typescript
  test('96px nodes still clear each other in the densest chapter', () => {
    const NODE = 96;
    const hoaPham = layout.nodes.filter((n) => n.chapter === 3);
    for (let i = 0; i < hoaPham.length; i++) {
      for (let j = i + 1; j < hoaPham.length; j++) {
        const a = hoaPham[i];
        const b = hoaPham[j];
        const clear = Math.abs(a.y - b.y) >= NODE || Math.abs(a.x - b.x) >= NODE;
        expect(clear, `${a.id} và ${b.id}`).toBe(true);
      }
    }
  });
```

- [ ] **Step 2: Run the test to verify it passes already**

Run: `npm test -- levelSelect`
Expected: PASS. This guard documents the constraint rather than driving a change — the ten-node lantern chain puts rows 140 px apart and pairs 320 px apart, both clear of 96. Keep it so a later layout edit cannot silently break the larger node.

- [ ] **Step 3: Scale the four canvases**

In `game-next/src/presentation/TextureFactory.ts`, for each of the four node blocks change `createCanvas(key, 72, 72)` to `createCanvas(key, 96, 96)` and multiply every coordinate, radius and line width inside by `96 / 72`.

For `nodeCompleted` the body becomes:

```typescript
    // 1. Completed node 96px (solid amber + bright rim + crisp checkmark)
    if (!tm.exists(TEXTURE_KEYS.nodeCompleted)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCompleted, 96, 96);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        TextureFactory.diamondPath(ctx, 48, 48, 43);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.amberGold.glowHighlight;
        ctx.lineWidth = 4;
        ctx.stroke();

        // The checkmark is drawn here only as the fallback for a level whose
        // silhouette cannot be built; LevelSelectScene draws the silhouette
        // over it for every level that has one.
        ctx.strokeStyle = COLOR_TOKENS.sky.stops[0];
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(33, 48);
        ctx.lineTo(44, 59);
        ctx.lineTo(65, 37);
        ctx.stroke();
        canvas.refresh();
      }
    }
```

Apply the same `× 4 / 3` scaling to the `nodeCurrent`, `nodeUnlocked` and `nodeLocked` blocks: centre `36 → 48`, radius `32 → 43`, and every other coordinate and line width in those blocks multiplied by `4 / 3` and rounded to the nearest whole or half pixel.

- [ ] **Step 4: Run the suite**

Run: `npm test`
Expected: PASS. `tests/textureFactory.test.ts` only asserts key names, so it is unaffected.

- [ ] **Step 5: Look at it**

Run: `npm run dev` and open `http://localhost:5173/?scene=levelselect`.
Expected: nodes are visibly larger, nothing overlaps, and the ten-node chapter (Họa Phẩm) still reads as a lantern chain. Scroll the whole map before moving on.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/TextureFactory.ts tests/levelSelect.test.ts
git commit -m "feat(visual): grow the map node textures to 96px"
```

---

### Task 3: Completed nodes carry their own silhouette

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts:347-377` (the `completed` branch of the node loop)
- Test: `game-next/tests/targetSilhouette.test.ts` (extend)

**Interfaces:**
- Consumes: `drawTargetSilhouette`, `NODE_SILHOUETTE_BOX` from Task 1; `loadLevel` from `../content/catalog.ts`.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/targetSilhouette.test.ts`:

```typescript
describe('node silhouette box', () => {
  test('is the largest badge-aspect box the diamond allows', () => {
    expect(NODE_BOX).toEqual({ width: 46, height: 32 });
    expect((NODE_BOX.width + NODE_BOX.height) / 2).toBeLessThanOrEqual(39);
  });

  test('every approved level stays inside the diamond at node size', () => {
    for (const entry of campaignManifest.filter((e) => e.status === 'approved')) {
      const layers = silhouetteLayers(loadLevel(entry.id, 'campaign'), NODE_BOX);
      expect(layers.length, entry.id).toBeGreaterThan(0);
      for (const layer of layers) {
        for (const p of layer.points) {
          expect(Math.abs(p.x) + Math.abs(p.y), entry.id).toBeLessThanOrEqual(39.001);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm test -- targetSilhouette`
Expected: PASS. `NODE_SILHOUETTE_BOX` was created in Task 1, so this block is a fit guard rather than a driver — it is the arithmetic the reviewer check in Step 5 depends on.

- [ ] **Step 3: Draw the silhouette on the node**

In `game-next/src/presentation/LevelSelectScene.ts`, add to the imports:

```typescript
import { loadLevel } from '../content/catalog.ts';
import { NODE_SILHOUETTE_BOX, drawTargetSilhouette } from './targetSilhouette.ts';
```

Replace the `completed` branch of the node loop — the block that currently adds `numText` at `y: 46` — with:

```typescript
      if (node.state === 'completed') {
        // The node shows what the player built. Colours invert against the
        // amber diamond: solid parity reads navy, hollow parity reads amber.
        const silhouette = this.add.graphics();
        try {
          drawTargetSilhouette(
            silhouette,
            loadLevel(node.id, this.mode),
            NODE_SILHOUETTE_BOX,
            { filled: COLOR_NUMBERS.navyBackdrop, hollow: COLOR_NUMBERS.amberSolid }
          );
          nodeContainer.add(silhouette);
        } catch {
          // Level JSON missing or unavailable in this mode: the texture's own
          // checkmark stays visible and the node still reads as completed.
          silhouette.destroy();
        }

        const numText = this.add
          .text(0, 58, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);
      } else if (node.state === 'current') {
```

The level number moves from `y: 46` to `y: 58` because the node grew from 72 to 96.

- [ ] **Step 4: Run the tests**

Run: `npm test -- targetSilhouette`
Expected: PASS.

Run: `npm test`
Expected: PASS, 89 files.

- [ ] **Step 5: Look at it, and decide**

Run: `npm run dev` and open `http://localhost:5173/?scene=levelselect&mode=harness&completedThrough=3-10`.
Expected: completed nodes show distinguishable figures, not amber mush.

This is the reviewer check the spec's §7 risk calls for. If the busiest levels are unreadable at 46 × 32, **stop and report** rather than enlarging the node — the spec's fallback is to simplify the silhouette for node rendering, which is a change of approach and needs the reviewer.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/LevelSelectScene.ts tests/targetSilhouette.test.ts
git commit -m "feat(visual): show each completed level's silhouette on its node"
```

---

### Task 4: The content frontier node

`state === 'unlocked'` means the level is reachable but not yet approved — today chapter 4's six `planned` levels. It currently looks like an ordinary glass node and only reveals the dead end after a tap. Make it say so before the tap.

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts:434-445` (the `unlocked` branch)
- Modify: `game-next/src/presentation/TextureFactory.ts` (`nodeUnlocked` becomes a hollow diamond)
- Test: `game-next/tests/levelSelect.test.ts`

**Interfaces:**
- Consumes: `t('toast_level_polishing', { id })` from `./i18n.ts` — already exists in both locales (`i18n.ts:42`, `i18n.ts:86`).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/levelSelect.test.ts` a new `describe` block at the end of the file:

```typescript
describe('Content frontier node', () => {
  test('the frontier state is the level just past the released content', () => {
    const completedThroughCh3 = campaignManifest
      .filter((e) => e.chapter <= 3)
      .map((e) => e.id);
    const frontier = campaignManifest.find((e) => e.status !== 'approved');
    expect(frontier, 'manifest has no planned level left — delete this state').toBeDefined();
    const access = levelAccess(campaignManifest, completedThroughCh3, frontier!.id, 'campaign');
    expect(access.unlocked).toBe(true);
    expect(access.available).toBe(false);
  });

  test('the frontier label and the toast come from the same i18n key', () => {
    expect(t('toast_level_polishing', { id: '4-1' })).toContain('4-1');
    expect(tEn('toast_level_polishing', { id: '4-1' })).toContain('4-1');
  });
});
```

Add to that file's imports:

```typescript
import { t, setLocale } from '../src/presentation/i18n.ts';

const tEn = (key: Parameters<typeof t>[0], vars?: Parameters<typeof t>[1]) => {
  setLocale('en');
  const value = t(key, vars);
  setLocale('vi');
  return value;
};
```

If `i18n.ts` does not export `setLocale` under that name, open the file and use whatever it does export to switch locale; do not add a new export for the test.

- [ ] **Step 2: Run the test to verify it fails or passes**

Run: `npm test -- levelSelect`
Expected: the first test PASSES (it documents today's manifest), the second FAILS only if the locale helper name is wrong. Fix the helper, then both pass. This block is a guard, not a driver — it fails the day chapter 4 is approved, which is exactly when this node state should be deleted.

- [ ] **Step 3: Make the texture hollow**

In `game-next/src/presentation/TextureFactory.ts`, in the `nodeUnlocked` block (already 96 px after Task 2), draw the diamond outline without the interior fill, so it reads as unfinished rather than merely dim:

```typescript
    // 3. Content frontier node 96px: outline only, interior left empty — the
    // level exists in the manifest but has not been built yet.
    if (!tm.exists(TEXTURE_KEYS.nodeUnlocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeUnlocked, 96, 96);
      if (canvas) {
        const ctx = canvas.context;
        TextureFactory.diamondPath(ctx, 48, 48, 43);
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        canvas.refresh();
      }
    }
```

- [ ] **Step 4: Add the label under the node**

In `game-next/src/presentation/LevelSelectScene.ts`, replace the `unlocked` branch with:

```typescript
      } else if (node.state === 'unlocked') {
        const numText = this.add
          .text(0, 0, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '20px',
            color: COLOR_TOKENS.iceGlass.bevelHighlight,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);

        // Say it before the tap, in the same words the toast uses after it.
        const frontierText = this.add
          .text(0, 58, t('toast_level_polishing', { id: node.id }), {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '16px',
            color: COLOR_TOKENS.text.secondary,
          })
          .setOrigin(0.5)
          .setAlpha(0.75);
        nodeContainer.add(frontierText);
      } else {
```

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Look at it**

Run: `npm run dev`, open `http://localhost:5173/?scene=levelselect&mode=harness&completedThrough=3-10`.
Expected: `4-1` is an empty dashed diamond with "Màn 4-1 đang được tinh chỉnh" beneath it; tapping it still raises the same toast and does not enter the level.

- [ ] **Step 7: Commit**

```bash
git add src/presentation/LevelSelectScene.ts src/presentation/TextureFactory.ts tests/levelSelect.test.ts
git commit -m "feat(visual): mark the content frontier node before the tap"
```

---

### Task 5: Plain label on the current node

The badge reads `✦ 3-4 · Ngọn Nến ✦`. The sparkles repeat what the visuals already say. Put the name first and the locator under it, in the secondary colour.

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts:398-424` (the title badge inside the `current` branch)
- Test: `game-next/tests/levelSelect.test.ts`

**Interfaces:**
- Consumes: `getLevelTitle`, `getChapterLabel` from `./i18n.ts`.
- Produces: `formatNodeLabel(id: string, title: string, chapter: Chapter): { name: string; locator: string }`, exported from `hudText.ts` so it can be tested without a scene.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/levelSelect.test.ts`, inside `describe('Màn chọn màn theo mockup improve-v1')`:

```typescript
  test('nhãn node hiện tại: tên dẫn trước, định vị theo sau, không ký tự trang trí', () => {
    const label = formatNodeLabel('3-4', 'Ngọn Nến', 3);
    expect(label.name).toBe('Ngọn Nến');
    expect(label.locator).toBe('3-4 · Họa Phẩm');
    expect(label.name).not.toContain('✦');
    expect(label.locator).not.toContain('✦');
  });
```

Add `formatNodeLabel` to that file's import from `../src/presentation/hudText.ts`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- levelSelect`
Expected: FAIL — `formatNodeLabel is not a function`.

- [ ] **Step 3: Write the formatter**

Append to `game-next/src/presentation/hudText.ts`:

```typescript
import { getChapterLabel, getLevelTitle } from './i18n.ts';
import type { Chapter } from '../domain/model.ts';

/**
 * Current-node label, split into its two lines. UI copy stays plain and the
 * decoration lives in the visuals, so neither line carries an ornament.
 */
export function formatNodeLabel(
  id: string,
  title: string,
  chapter: Chapter
): { name: string; locator: string } {
  return {
    name: getLevelTitle(id, title),
    locator: `${id} · ${getChapterLabel(chapter)}`,
  };
}
```

If `hudText.ts` already imports from `./i18n.ts`, merge the import rather than adding a second one.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- levelSelect`
Expected: PASS.

- [ ] **Step 5: Use it in the scene**

In `game-next/src/presentation/LevelSelectScene.ts`, replace the badge body inside the `current` branch — from `const badgeBg = this.add.graphics();` through `titleBadge.add([badgeBg, badgeText]);` — with:

```typescript
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
        badgeBg.fillRoundedRect(-130, -26, 260, 52, 26);
        badgeBg.lineStyle(1.5, COLOR_NUMBERS.amberSolid, 0.9);
        badgeBg.strokeRoundedRect(-130, -26, 260, 52, 26);

        const label = formatNodeLabel(node.id, node.title, node.chapter);
        const badgeName = this.add
          .text(0, -8, label.name, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        const badgeLocator = this.add
          .text(0, 12, label.locator, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '14px',
            color: COLOR_TOKENS.text.secondary,
          })
          .setOrigin(0.5);

        titleBadge.add([badgeBg, badgeName, badgeLocator]);
```

Move the badge container down to clear the larger node: change `const titleBadge = this.add.container(0, 56);` to `const titleBadge = this.add.container(0, 68);`.

Add `formatNodeLabel` to the existing `./hudText.ts` import, and drop `getLevelTitle` from the `./i18n.ts` import if nothing else in the file uses it.

- [ ] **Step 6: Run the suite and look at it**

Run: `npm test`
Expected: PASS.

Run: `npm run dev`, open the map. Expected: the badge is two lines, no sparkles, and the taller badge does not collide with the node above or below it.

- [ ] **Step 7: Commit**

```bash
git add src/presentation/LevelSelectScene.ts src/presentation/hudText.ts tests/levelSelect.test.ts
git commit -m "feat(visual): plain two-line label on the current node"
```

---

### Task 6: Chapter labels get a backing plate

The gold path runs through "Giao Thoa" and "Họa Phẩm". Rerouting paths generated from layout tables is fragile; a soft plate behind the text is not.

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts:323-346` (the chapter banner loop)

**Interfaces:**
- Consumes: `COLOR_NUMBERS.skyTop` — the same colour the header fade uses, so the plate reads as sky rather than as a panel.
- Produces: nothing.

- [ ] **Step 1: Draw the plate**

In the chapter banner loop in `game-next/src/presentation/LevelSelectScene.ts`, insert the plate between `chText` and `chBg` so it sits under both the text and the rules, and add it first to the container so it paints beneath them:

```typescript
      // Links are generated from the layout tables and cross this row. A soft
      // plate in the sky colour hides the crossing without moving any path.
      const plate = this.add.graphics();
      const plateW = chText.width + 120;
      const plateH = 52;
      for (let i = 0; i < 6; i++) {
        const inset = i * 3;
        plate.fillStyle(COLOR_NUMBERS.skyTop, 0.16);
        plate.fillRoundedRect(
          -plateW / 2 + inset,
          -plateH / 2 + inset,
          plateW - inset * 2,
          plateH - inset * 2,
          (plateH - inset * 2) / 2
        );
      }

      chContainer.add([plate, chBg, chText]);
```

Delete the old `chContainer.add([chBg, chText]);` line.

- [ ] **Step 2: Run the suite**

Run: `npm test`
Expected: PASS. No test covers the banner's draw calls; the guard here is the banned-colour scan, which `COLOR_NUMBERS.skyTop` satisfies.

- [ ] **Step 3: Look at it**

Run: `npm run dev`, open the map and scroll to chapter 2 and chapter 3.
Expected: no gold line crosses the chapter text, and the plate has no visible hard edge — the six stacked rounded rectangles make a soft falloff rather than a panel.

- [ ] **Step 4: Commit**

```bash
git add src/presentation/LevelSelectScene.ts
git commit -m "fix(visual): stop constellation links crossing the chapter labels"
```

---

### Task 7: Only the current node moves

Spec §3.4 puts exactly one tier-3 element on this screen. Today the map also runs **one infinitely repeating spark tween per walked link** (`LevelSelectScene.ts:296-311`). With most of the campaign finished that is more than twenty repeating tweens on a scrolling screen — the battery cost the spec wanted to avoid, and more moving things than the eye can rank.

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts:296-311` (link sparks), `:380-390` (current node pulse), `:420-430` (badge breathing)
- Test: `game-next/tests/levelSelect.test.ts`

**Interfaces:**
- Consumes: `isReducedMotion` from `./transitions/motion.ts`.
- Produces: `walkedLinkAlpha(isIntoCurrent: boolean): number`, exported from `constellationMotion.ts`.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/constellationMotion.test.ts`:

```typescript
import { walkedLinkAlpha } from '../src/presentation/constellationMotion.ts';

describe('walked link emphasis', () => {
  test('the link into the current node stays brighter than the rest', () => {
    expect(walkedLinkAlpha(true)).toBeGreaterThan(walkedLinkAlpha(false));
  });

  test('both stay below the current node, which owns tier 3', () => {
    expect(walkedLinkAlpha(true)).toBeLessThan(1);
    expect(walkedLinkAlpha(false)).toBeLessThan(walkedLinkAlpha(true));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- constellationMotion`
Expected: FAIL — `walkedLinkAlpha is not a function`.

- [ ] **Step 3: Add the helper**

Append to `game-next/src/presentation/constellationMotion.ts`:

```typescript
/**
 * Walked links are tier 1 — structure, not focus. The one arriving at the
 * current node stays a little brighter so the eye can follow the path to
 * where the player is, without competing with the node itself.
 */
export function walkedLinkAlpha(isIntoCurrent: boolean): number {
  return isIntoCurrent ? 0.95 : 0.55;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- constellationMotion`
Expected: PASS.

- [ ] **Step 5: Remove the sparks and dim the walked links**

In `game-next/src/presentation/LevelSelectScene.ts`, inside the `if (isPathWalked)` branch, delete the whole spark block — the `const spark = this.add.circle(...)` statement, the `this.mapContainer.add(spark);`, the `this.linkParts.push(spark);` and the `this.tweens.addCounter({...})` call — and apply the alpha to the two stroke passes:

```typescript
      if (isPathWalked) {
        const alpha = walkedLinkAlpha(p2.state === 'current');

        linesGraphics.lineStyle(8, COLOR_NUMBERS.amberSolid, 0.22 * alpha);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }

        linesGraphics.lineStyle(4, COLOR_NUMBERS.amberSolid, 0.95 * alpha);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }
      } else {
```

Add `walkedLinkAlpha` to the existing `./constellationMotion.ts` import, or add the import if the file has none.

- [ ] **Step 6: Guard the two remaining tweens with reduced motion**

Both tweens in the `current` branch — the node pulse and the badge breathing — must not run under reduced motion. Wrap each:

```typescript
        if (!isReducedMotion()) {
          this.tweens.add({
            targets: nodeSprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 750,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
```

and, after the badge is assembled:

```typescript
        if (!isReducedMotion()) {
          this.tweens.add({
            targets: titleBadge,
            y: 72,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
```

The breathing target moves from 60 to 72 because Task 5 moved the badge to `y: 68`.

Add to the imports at the top of the file:

```typescript
import { isReducedMotion } from './transitions/motion.ts';
```

- [ ] **Step 7: Run everything**

Run: `npm test`
Expected: PASS, 89 files.

Run: `npm run build`
Expected: typecheck clean, bundle written to `dist/`.

- [ ] **Step 8: Look at it**

Run: `npm run dev`, open the map with most levels completed.
Expected: nothing on the map moves except the current node and its label. Walked links are visibly quieter than the one arriving at the current node. Turn on Reduced Motion in Settings and reopen the map: nothing moves at all.

- [ ] **Step 9: Commit**

```bash
git add src/presentation/LevelSelectScene.ts src/presentation/constellationMotion.ts tests/constellationMotion.test.ts
git commit -m "feat(visual): give the map a single focus and drop the link sparks"
```

---

### Task 8: Close out the plan

**Files:**
- Modify: `CHANGELOG.md`, `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md`

- [ ] **Step 1: Add the CHANGELOG entry**

Under `## Unreleased`, newest first, a `### 2026-10-06 - VR2 Level Select` entry naming the files changed and a `Verification:` bullet with the real `npm test` and `npm run build` output, plus the result of the Task 3 readability check.

- [ ] **Step 2: Update `docs/ai/DOCS-INDEX.md`**

Set the VR2 row's plan column to `plans/2026-10-06-vr2-level-select.md` and its state to `done`. Record in the notes that §3.1 was not implemented and why.

- [ ] **Step 3: Overwrite `docs/ai/STATUS.md`**

Bump the date line, move VR2 to done in the streams table, and keep the open decision that §3.1 and VR3b are still outstanding. Keep the file under 60 lines.

- [ ] **Step 4: Run the final checks**

```bash
npm test
npm run build
git diff --check
git status
```

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md docs/ai/STATUS.md docs/ai/DOCS-INDEX.md
git commit -m "docs(vr2): record the Level Select pass"
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| §3.1 constellation strip | **Not implemented** — needs VR3b's card slot; see the scope note |
| §3.2 completed nodes carry their silhouette | 1, 2, 3 |
| §3.3 the content frontier node | 4 |
| §3.4 motion and the glow ladder | 7 |
| §3.5 label ornament | 5 |
| §3.6 links crossing chapter labels | 6 |
| §5 testing | Each task's own test steps; §5's strip and first-completion cases fall away with §3.1 |
| §6 out of scope | Unchanged — chapter shapes, per-chapter progress and the return-to-current button stay deferred |

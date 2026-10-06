# VR3b Medallion and Victory Ritual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the victory card the room VR2's constellation strip will need, make the two routes into the won state leave the same screen, give one moment at a time the focus, and make the target easier to read both at the medallion and on the board.

**Architecture:** No new module and no extraction. The victory choreography already exists in `victorySequence.ts` and `VICTORY_TOKENS`; this plan re-anchors the card, re-weights one token, and adds two readability changes on the play screen. Each change that has geometry or arithmetic behind it gets a pure function or a token so it can be tested without a renderer.

**Tech Stack:** TypeScript 5.7, Phaser 3.90, Vitest 2. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-06-vr3b-medallion-victory-ritual-design.md`

## Global Constraints

- Run every command from `game-next/`. Node `>=24.13.1 <25`.
- Code comments, commit messages and CHANGELOG entries in English.
- Commit messages: `type(scope): summary` (`feat`, `fix`, `docs`, `chore`, `test`, `refactor`).
- Colours come from `COLOR_TOKENS` / `COLOR_NUMBERS`. `tests/bannedColors.test.ts` scans all of `src/` and fails on a literal hex.
- `designTokens.ts` is a leaf module and imports nothing from `presentation/`. Motion families live in `transitions/motion.ts` (VR0).
- Anything that tweens is skipped when `isReducedMotion()` is true.
- Run `npm test` before every commit; `npm run build` before the final commit.

## Concurrency

**Nothing blocks this plan any more.** VR2 and VR3a both landed on 2026-10-06 and
were accepted by the reviewer — VR2 at `d3ae185`..`a0f0625` plus the silhouette fit
in `c28aecd`, VR3a at `c6cdc0e`..`d21b336`. This is the last plan in the VR chain.

What they changed under this plan's feet, to read before editing rather than after:

| This plan's task | File | What landed there first |
|---|---|---|
| 1 | `TextureFactory.ts` | VR2 grew the map node canvases to 96px |
| 4 | `TargetBadge.ts` | VR2 moved `drawTargetSilhouette` out into `targetSilhouette.ts`; the badge now calls `BADGE_SILHOUETTE_FIT` |
| 5 | `BoardRenderer.drawTargetSilhouette` | **VR3a Task 4 rewrote this method.** It now collects each placement's polygon while filling, then strokes `unionOutline` of them once |
| 1, 4, 5 | `designTokens.ts` | VR2 and VR3a both added token groups; this plan adds its own, so conflicts are mechanical |
| 4 | `transitions/motion.ts` | VR3a added the `anticipateOut` easing to `EASES`; `glass` is untouched and still unused |

## Scope note — the audio cue is deferred with §3.1

Spec §3.4 adds a dedicated star-lighting patch because VR2 §3.1 specified the existing `shimmer`, which is already the `overlap-revive` cue in play (`audioCues.ts:64-65`). That collision is real, but **§3.1 itself is deferred** — the VR2 plan excludes the constellation strip. A new audio patch with no caller is dead weight, so it is not a task here. It lands with §3.1, whenever that is built. The correction already recorded in the VR2 spec stands, so the trap cannot be walked into later.

---

### Task 1: The victory card grows upward

The card is anchored by its **top** edge at `trayBounds.y - 4` and runs 262 px down (`Hud.ts:217`), putting its bottom at 1274 of a 1280 px canvas — six pixels of margin. It cannot grow downward. Re-anchor it to its bottom edge and grow it to 310 px, reserving a 48 px slot for the strip VR2 will add later.

Unblocked. It edits `TextureFactory.ts`, which VR2 changed — read it first.

**Files:**
- Modify: `game-next/src/presentation/Hud.ts:215-325`
- Modify: `game-next/src/presentation/TextureFactory.ts:63-71`
- Test: `game-next/tests/hud.test.ts`

**Interfaces:**
- Produces: `VICTORY_CARD = { x: 30, w: 660, h: 310, bottomFromTray: 258 }` exported from `designTokens.ts`, plus the inner offsets below. The card's geometry becomes data so the test can assert it without a scene.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/hud.test.ts`:

```typescript
import { VICTORY_CARD, LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';
import { computeLayout } from '../src/presentation/layout.ts';

describe('victory card geometry', () => {
  test('is bottom-anchored and keeps its old bottom edge', () => {
    const layout = computeLayout(720, 1280, { top: 0, bottom: 0 });
    const top = layout.trayBounds.y - (VICTORY_CARD.h - VICTORY_CARD.bottomFromTray);
    const bottom = top + VICTORY_CARD.h;
    expect(bottom).toBe(layout.trayBounds.y + VICTORY_CARD.bottomFromTray);
    expect(bottom).toBeLessThanOrEqual(LAYOUT_TOKENS.canvas.height);
  });

  test('keeps its six pixels of bottom margin on every safe-area inset', () => {
    for (const bottomInset of [0, 24, 48, 96]) {
      const layout = computeLayout(720, 1280, { top: 0, bottom: bottomInset });
      const bottom = layout.trayBounds.y + VICTORY_CARD.bottomFromTray;
      expect(bottom, `inset ${bottomInset}`).toBeLessThanOrEqual(LAYOUT_TOKENS.canvas.height - 6);
    }
  });

  test('the reserved slot sits between the level name and the verse', () => {
    const o = VICTORY_CARD.offsets;
    expect(o.title).toBeLessThan(o.slotTop);
    expect(o.slotTop + VICTORY_CARD.slotHeight).toBe(o.slotBottom);
    expect(o.slotBottom).toBeLessThanOrEqual(o.verse);
  });

  test('keeps the 34px of padding under the button row', () => {
    const o = VICTORY_CARD.offsets;
    expect(VICTORY_CARD.h - (o.buttonTop + VICTORY_CARD.buttonHeight)).toBe(34);
  });

  test('everything below the level name moved down by exactly the slot height', () => {
    const o = VICTORY_CARD.offsets;
    expect(o.verse - 123).toBe(VICTORY_CARD.slotHeight);
    expect(o.buttonTop - 152).toBe(VICTORY_CARD.slotHeight);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hud`
Expected: FAIL — `VICTORY_CARD` is not exported from `designTokens.ts`.

- [ ] **Step 3: Add the geometry as tokens**

In `game-next/src/presentation/designTokens.ts`, after `LAYOUT_TOKENS`:

```typescript
/**
 * Victory card geometry. Anchored by its BOTTOM edge: at `trayBounds.y + 258`
 * the card already ends six pixels from the bottom of a 1280px canvas, so it
 * can only grow upward. `trayBounds.y` already accounts for the bottom safe
 * area, so both edges move together on a device with a gesture bar.
 *
 * The 48px slot is left empty here; VR2 fills it with the constellation strip.
 */
export const VICTORY_CARD = {
  x: 30,
  w: 660,
  h: 310,
  bottomFromTray: 258,
  slotHeight: 48,
  buttonHeight: 76,
  offsets: {
    label: 38,
    title: 79,
    slotTop: 99,
    slotBottom: 147,
    verse: 171,
    buttonTop: 200,
  },
} as const;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- hud`
Expected: PASS, 5 new tests.

- [ ] **Step 5: Grow the two textures**

In `game-next/src/presentation/TextureFactory.ts:63-71`:

```typescript
    TextureFactory.makeGlassFrame(scene, TEXTURE_KEYS.victoryCardFrame, VICTORY_CARD.w, VICTORY_CARD.h, 40, [
      '#FFF6D6', '#FFC857', '#E9A240', '#C9842A',
    ]);
    TextureFactory.makeSurface(scene, TEXTURE_KEYS.victoryCardSurface, {
      width: VICTORY_CARD.w - 12,
      height: VICTORY_CARD.h - 12,
      radius: 34,
      stops: [[0, '#24358C'], [1, '#1A2468']],
    });
```

Import `VICTORY_CARD` from `./designTokens.ts` there. Deriving the surface from the frame removes the second place the size was written down.

- [ ] **Step 6: Re-anchor the card in `Hud`**

In `game-next/src/presentation/Hud.ts`, replace line 217:

```typescript
    const card = {
      x: VICTORY_CARD.x,
      y: this.layout.trayBounds.y + VICTORY_CARD.bottomFromTray - VICTORY_CARD.h,
      w: VICTORY_CARD.w,
      h: VICTORY_CARD.h,
    };
```

Then replace each hardcoded inner offset with its token:

| Element | Was | Now |
|---|---|---|
| `winLabel` y | `card.y + 38` | `card.y + VICTORY_CARD.offsets.label` |
| `winTitle` y | `card.y + 79` | `card.y + VICTORY_CARD.offsets.title` |
| `winVerse` y | `card.y + 123` | `card.y + VICTORY_CARD.offsets.verse` |
| `btnTop` | `card.y + 152` | `card.y + VICTORY_CARD.offsets.buttonTop` |
| `btnH` | `76` | `VICTORY_CARD.buttonHeight` |

Leave `VICTORY_CARD_GROUPS` at 4 and `this.winItems` as it is: the slot is empty, so it is not an animated group. VR2 raises the constant to 5 when it fills the slot, and `cardItemMs` re-derives itself from the existing formula in `victorySequence.ts:73`.

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Look at it on the narrowest case**

Run: `npm run dev`, finish a level with `?scene=play&level=1-1&mode=harness&autosolve=win`.
Expected: the card is taller, its bottom sits where it always did, the extra 48 px reads as spacing between the level name and the verse rather than as a hole, and the top edge overlapping the bottom of the board looks acceptable.

**This is the first thing the spec's §7 says to check.** If the overlap looks wrong, stop and report: the card cannot grow, and the slot has to be found by removing something else from the card.

- [ ] **Step 9: Commit**

```bash
git add src/presentation/designTokens.ts src/presentation/TextureFactory.ts src/presentation/Hud.ts tests/hud.test.ts
git commit -m "feat(victory): bottom-anchor the card and reserve the strip slot"
```

---

### Task 2: The restore path dims the sky too

The won state is reached two ways. `PlayScene.ts:241-242` already calls `boardRenderer.setVictoryMode(true)` before `hud.showWinModal(...)`, and `setVictoryMode` (`BoardRenderer.ts:226-229`) turns the gold frame on and hides the tray — the same two things the timeline does. One thing is missing: the timeline calls `background().deepen(skyDimExtra, skyDimMs)` (`FeedbackDirector.ts:265-267`) and the restore path does not. A player re-entering a finished level sees the card against an undimmed sky.

**Files:**
- Modify: `game-next/src/presentation/PlayScene.ts:240-243`

**Interfaces:**
- Consumes: `VICTORY_TOKENS.skyDimExtra`; the `BackgroundScene` accessor already present at `PlayScene.ts:201`.

- [ ] **Step 1: Deepen the sky on restore**

In `game-next/src/presentation/PlayScene.ts`, in the `phase === 'won'` branch:

```typescript
    if (this.controller.getSnapshot().phase === 'won') {
      this.boardRenderer.setVictoryMode(true);
      // The victory timeline deepens the sky at skyDimAtMs; this path has no
      // timeline, so it jumps straight to the same end state. Without it the
      // two routes into the won state leave different screens.
      (this.scene.get('BackgroundScene') as BackgroundScene | null)?.deepen(VICTORY_TOKENS.skyDimExtra, 0);
      this.hud.showWinModal(this.level.victoryVerse);
    } else {
```

Add `VICTORY_TOKENS` to the existing `./designTokens.ts` import. `BackgroundScene` is already imported for the accessor on line 201.

- [ ] **Step 2: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Check both routes by eye**

Run: `npm run dev`.
1. Finish `1-1` with `?scene=play&level=1-1&mode=harness&autosolve=win` and note the sky behind the card.
2. Leave to the map and re-enter the same finished level.

Expected: the sky is equally dark on both. Before this change the second was visibly lighter.

- [ ] **Step 4: Commit**

```bash
git add src/presentation/PlayScene.ts
git commit -m "fix(victory): dim the sky when restoring a finished level"
```

---

### Task 3: One focus at a time in the ritual

The trace runs 900–1500 ms while the burst fires at 1300, so for 200 ms the trace, 30 particles, two expanding rings and a camera flash all compete. Per the VR1 glow ladder a moment has one tier-3 element. Close the trace where the burst opens.

**Files:**
- Modify: `game-next/src/presentation/designTokens.ts` (`VICTORY_TOKENS.traceMs`)
- Test: `game-next/tests/victorySequence.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/victorySequence.test.ts`:

```typescript
describe('one focus at a time', () => {
  test('the trace closes no later than the burst opens', () => {
    const plan = victoryPlan(3, false);
    expect(plan.traceAtMs + plan.traceMs).toBeLessThanOrEqual(plan.burstAtMs);
  });

  test('the total length is unchanged at 2800ms', () => {
    expect(victoryEndMs(victoryPlan(3, false))).toBe(2800);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- victorySequence`
Expected: FAIL — `1500` is not less than or equal to `1300`.

- [ ] **Step 3: Shorten the trace**

In `VICTORY_TOKENS`, change `traceMs: 600` to:

```typescript
  // Closes exactly where burstAtMs opens: the ladder allows one tier-3
  // element at a time, and the burst is the louder of the two.
  traceMs: 400,
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- victorySequence`
Expected: PASS. The total stays 2800 because the card, not the trace, is the last thing in `victoryEndMs`.

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/designTokens.ts tests/victorySequence.test.ts
git commit -m "fix(victory): stop the trace competing with the burst"
```

---

### Task 4: The medallion gets a scrim and the glass family

`TargetBadge.animateZoom` (`:172-198`) already scales the badge 1.0 → 1.35, holds 900 ms and returns. Two things are missing: the background does not quiet down behind it, and its easings (`Back.easeOut` 180 ms out, `Cubic.easeOut` 200 ms back) belong to no VR0 family. The `glass` family exists and VR0 already names the target medallion as a member (`transitions/motion.ts:82-88`).

Unblocked. VR2 moved `drawTargetSilhouette` out of `TargetBadge.ts` into `targetSilhouette.ts` — read the file as it stands before editing.

**Files:**
- Modify: `game-next/src/presentation/TargetBadge.ts:172-198`
- Modify: `game-next/src/presentation/designTokens.ts` (`FEEDBACK_TOKENS`)

**Interfaces:**
- Consumes: `motionFamily('glass')` from `transitions/motion.ts`; `EASES` ease names map to Phaser strings via the existing convention in the file.
- Produces: `FEEDBACK_TOKENS.medallionScrimAlpha`.

- [ ] **Step 1: Add the token**

In `FEEDBACK_TOKENS`:

```typescript
  /** How far the field behind the enlarged target medallion quiets down. */
  medallionScrimAlpha: 0.35,
```

- [ ] **Step 2: Add the scrim**

In `game-next/src/presentation/TargetBadge.ts`, create a full-canvas rectangle in the constructor, below the badge container's depth and invisible at rest:

```typescript
    // Quiets the field behind the enlarged medallion so the silhouette is read
    // against calm, not against the board.
    this.scrim = scene.add
      .rectangle(0, 0, LAYOUT_TOKENS.canvas.width, layout.designHeight, COLOR_NUMBERS.navyBackdrop, 1)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.hudControls + 4)
      .setAlpha(0);
```

Declare `private scrim!: Phaser.GameObjects.Rectangle;` with the other fields, destroy it in `destroy()`, and import `LAYOUT_TOKENS` and `COLOR_NUMBERS` if they are not already imported.

- [ ] **Step 3: Move both tweens onto the glass family and fade the scrim with them**

Replace the body of `animateZoom`:

```typescript
  private animateZoom(scene: Phaser.Scene): void {
    if (this.isEnlarged) return;
    this.isEnlarged = true;
    const glass = motionFamily('glass');
    const ms = scaleTiming(glass.durationMs);

    scene.tweens.add({
      targets: this.scrim,
      alpha: FEEDBACK_TOKENS.medallionScrimAlpha,
      duration: ms,
      ease: 'Quart.easeOut',
    });
    scene.tweens.add({
      targets: this.container,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: ms,
      ease: 'Quart.easeOut',
      onComplete: () => {
        scene.time.delayedCall(900, () => {
          scene.tweens.add({
            targets: this.scrim,
            alpha: 0,
            duration: ms,
            ease: 'Quart.easeOut',
          });
          scene.tweens.add({
            targets: this.container,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: ms,
            ease: 'Quart.easeOut',
            onComplete: () => {
              this.isEnlarged = false;
            },
          });
        });
      },
    });
  }
```

Import `motionFamily` and `scaleTiming` from `./transitions/motion.ts`. Under Reduced Motion `scaleTiming` returns 0, so both the zoom and the scrim jump — which is correct; the enlarged read is information, only its animation is motion.

- [ ] **Step 4: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Look at it**

Run: `npm run dev`, open a level and tap the medallion.
Expected: the field behind it darkens as it grows, both legs feel heavier than before (quartOut at 300 ms rather than backOut at 180), and the scrim is gone by the time the badge is back at rest.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/TargetBadge.ts src/presentation/designTokens.ts
git commit -m "feat(target): scrim behind the medallion and the glass family"
```

---

### Task 5: The Eye crossfades instead of toggling

`showTarget` currently switches the board's target ghost on and off. Make it dim the player's current figure and show the target over it instead, so the missing and surplus areas are readable. `showTarget` stays a `boolean` in settings — nothing about the saved shape changes.

| | Target ghost | Placed result |
|---|---|---|
| `showTarget: false` | alpha 0 | alpha 1.0 |
| `showTarget: true` | alpha 0.35 | alpha 0.55 |

The placed result means snapped pieces and the parity layers above them — not the piece being dragged, which stays fully opaque so what is under the finger is never ambiguous.

**Files:**
- Modify: `game-next/src/presentation/designTokens.ts` (`FEEDBACK_TOKENS`)
- Modify: `game-next/src/presentation/pieceMotion.ts` (`PoseInput`, `pieceTargetPose`)
- Modify: `game-next/src/presentation/BoardRenderer.ts` (`syncPieceViews`, `drawLayers`)
- Test: `game-next/tests/pieceMotion.test.ts`

**Interfaces:**
- Produces: `FEEDBACK_TOKENS.eyeResultAlpha = 0.55`, `eyeTargetAlpha = 0.35`; `PoseInput` gains `showTarget: boolean`.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/pieceMotion.test.ts`:

```typescript
describe('Eye crossfade', () => {
  const input = (over: Partial<PoseInput>): PoseInput => ({
    layout,
    trayIndex: 0,
    trayCount: 2,
    selected: false,
    showTarget: false,
    drag: null,
    ...over,
  });

  test('a snapped piece dims when the Eye is on', () => {
    const snapped = { kind: 'snapped', anchorId: piece.anchors[0].id, turns: 0 } as const;
    expect(pieceTargetPose(piece, snapped, input({ showTarget: false })).alpha).toBe(1);
    expect(pieceTargetPose(piece, snapped, input({ showTarget: true })).alpha).toBe(
      FEEDBACK_TOKENS.eyeResultAlpha
    );
  });

  test('the dragged piece never dims', () => {
    const dragging = input({
      showTarget: true,
      drag: { x: 100, y: 100, candidate: { x: 100, y: 100 } },
    });
    const snapped = { kind: 'snapped', anchorId: piece.anchors[0].id, turns: 0 } as const;
    expect(pieceTargetPose(piece, snapped, dragging).alpha).toBe(1);
  });

  test('the two alphas stay far enough apart to be told apart', () => {
    expect(FEEDBACK_TOKENS.eyeResultAlpha - FEEDBACK_TOKENS.eyeTargetAlpha).toBeGreaterThanOrEqual(0.15);
  });
});
```

Reuse whatever `layout` and `piece` fixtures that file already builds; do not add new ones.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- pieceMotion`
Expected: FAIL — `showTarget` is not a property of `PoseInput`.

- [ ] **Step 3: Add the tokens**

In `FEEDBACK_TOKENS`, next to `targetIdleAlpha`:

```typescript
  /** Eye on: the player's own figure recedes and the target shows over it. */
  eyeResultAlpha: 0.55,
  eyeTargetAlpha: 0.35,
```

- [ ] **Step 4: Dim the snapped pieces**

In `game-next/src/presentation/pieceMotion.ts`, add `showTarget: boolean;` to `PoseInput`, and in `pieceTargetPose` change the `snapped` branch:

```typescript
  if (state.kind === 'snapped') {
    const c = anchorCenter(piece, state.anchorId, layout) ?? anchorCenter(piece, piece.anchors[0].id, layout)!;
    // With the Eye on, the figure the player built recedes so the target reads
    // over it. The dragged piece is handled above and never dims.
    return {
      x: c.x,
      y: c.y,
      scale: 1,
      angle: 0,
      alpha: input.showTarget ? FEEDBACK_TOKENS.eyeResultAlpha : 1,
    };
  }
```

- [ ] **Step 5: Pass it in, and dim the parity layers with it**

In `game-next/src/presentation/BoardRenderer.ts`, in `syncPieceViews`, add `showTarget: snapshot.showTarget,` to the `pieceTargetPose` input object.

Then give `drawLayers` the same factor, so the parity fill above the pieces recedes with them:

```typescript
  private drawLayers(
    g: Phaser.GameObjects.Graphics,
    layers: readonly ParityLayer[],
    alpha: number = 1
  ): void {
```

and multiply the two `fillStyle` alphas and the `lineStyle` alpha inside it by `alpha`. At the `syncParity` call sites pass
`this.lastSnapshot?.showTarget ? FEEDBACK_TOKENS.eyeResultAlpha : 1`.
Leave the `fadeOutParity` call site at the default of 1: that copy is already fading out on its own.

- [ ] **Step 6: Raise the target ghost**

In `drawTargetSilhouette`, the per-placement alpha is `this.hoverAlpha[index] * reveal`, and `hoverAlpha` rests at `FEEDBACK_TOKENS.targetIdleAlpha` (0.7). Multiply by the new token so the resting ghost lands on `eyeTargetAlpha`:

```typescript
      const alpha = (this.hoverAlpha[index] / FEEDBACK_TOKENS.targetIdleAlpha) * FEEDBACK_TOKENS.eyeTargetAlpha * reveal;
```

This keeps the hover brightening proportional rather than flattening it.

**VR3a Task 4 has landed and rewrote this method**, so edit its version: keep the per-placement fill loop and the single `unionOutline` stroke, apply the alpha change to the per-placement `alpha`, and feed the stroke the same scaled `outlineAlpha` it already computes as the maximum.

- [ ] **Step 7: Run everything**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: typecheck clean.

- [ ] **Step 8: REVIEWER STOP POINT — check the two alphas on a device**

```bash
npm run android:sync
cd android && cmd /c gradlew.bat assembleDebug
```

Spec §7 names this the one unverified pair of numbers in the whole spec: amber-solid pieces at 0.55 and an amber-stroked ghost at 0.35 may converge into one muddy field in daylight, which would make the Eye *less* readable, not more.

Ask the reviewer to toggle the Eye outdoors on a half-solved level and say whether the missing and surplus areas are obvious. If they are not, the fallback in §7 is to shift the target ghost toward the ice palette rather than to push the alphas further apart. **Do not tune the numbers past the point where they still differ by 0.15** without the reviewer asking.

- [ ] **Step 9: Commit**

```bash
git add src/presentation/designTokens.ts src/presentation/pieceMotion.ts src/presentation/BoardRenderer.ts tests/pieceMotion.test.ts
git commit -m "feat(board): crossfade the Eye instead of toggling the target"
```

---

### Task 6: Close out the plan

**Files:**
- Modify: `CHANGELOG.md`, `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md`

- [ ] **Step 1: Add the CHANGELOG entry**

Under `## Unreleased`, newest first: what changed with file paths, both reviewer verdicts (the card overlap from Task 1 Step 8, the Eye alphas from Task 5 Step 8), and a `Verification:` bullet with the real `npm test` and `npm run build` output.

- [ ] **Step 2: Update `docs/ai/DOCS-INDEX.md`**

Set the VR3b row's plan column to `plans/2026-10-06-vr3b-medallion-victory-ritual.md` and its state to `done`. Record that the star-lighting audio cue was deferred with §3.1.

- [ ] **Step 3: Note what VR2's strip now inherits**

The 48 px slot now exists. Update the VR2 spec §3.1 and the VR2 row in `DOCS-INDEX.md` to say the slot is built and the strip is unblocked, so whoever picks §3.1 up does not re-derive the geometry.

- [ ] **Step 4: Overwrite `docs/ai/STATUS.md`**

Bump the date line, move VR3b in the streams table, keep the file under 60 lines.

- [ ] **Step 5: Final checks and commit**

```bash
npm test
npm run build
git diff --check
git status
git add CHANGELOG.md docs/
git commit -m "docs(vr3b): record the medallion and victory ritual pass"
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| §3.1 the card grows upward | 1 |
| §3.2 both entry points agree | 2 |
| §3.3 re-weighting the ritual | 3 |
| §3.4 a distinct sound for lighting a star | **Deferred with VR2 §3.1** — see the scope note |
| §3.5 medallion scrim and the glass family | 4 |
| §3.6 Eye crossfade | 5 |
| §5 testing | Each task's own test steps |
| §6 out of scope | Unchanged |
| §7 risks | Task 1 Step 8 and Task 5 Step 8 are the two reviewer stop points it calls for |

# FX — Play and map fixes, icon restyle

Date: 2026-10-06 · Scope: `game-next/src/presentation`, `game-next/src/application`, `game-next/src/content` · Depends on: VR2, VR3a, VR3b (the current visual state).

Six items reported from play on 2026-10-06. Four are defects, one is a removal, one is a restyle. Each was investigated before being written up; the findings below are what the code actually does, not what it was expected to do.

## 1. FX-1 — A piece's touch area is its whole frame (defect)

**Reported:** tapping one piece selects a different one; the dead zone sits in a quadrant measured from the piece's centre.

**Root cause.** `presentation/layout.ts:164-195` — `pieceHitbox` returns an axis-aligned square of `piece.frameSize * layout.cellPixel` (floored at 48 px) placed at the frame origin. `application/playController.ts:100-105` then tests plain rectangle containment:

```ts
pointerX >= hitbox.x && pointerX <= hitbox.x + hitbox.width &&
pointerY >= hitbox.y && pointerY <= hitbox.y + hitbox.height
```

There is no polygon test anywhere in the input path. A triangle covers half its frame, a diamond half its area, an apex triangle half its frame — the remainder of the bounding box is empty but still claims the pointer. The reported quadrant matches: triangle orientation 0 is `(0,0) (s,0) (0,s)`, filling the top-left, so its bottom-right quadrant is dead space that still selects it. Other orientations move the dead quadrant accordingly.

Two aggravating factors found in the same path:

- `Math.max(rawSize, 48)` inflates the box further for pieces whose rendered size is under 48 px, so a small piece claims area well outside itself.
- `playController.ts:93` iterates `[...this.level.pieces].reverse()`, which only reverses declaration order, while the comment directly above it claims the order is `snapped -> temporary -> tray`. The comment describes an intent the code does not implement, so the piece drawn on top is not reliably tested first. **Both the code and the comment are suspect here; decide which is correct before changing either.**

**Required behaviour.** A tap selects the piece whose rendered shape contains the point. When no shape contains it, nothing is selected. Where two pieces genuinely overlap at that point, the one drawn on top wins, and the iteration order must express that.

**Approach.** Hit-test the real geometry — the piece's rasterised cells, or `shapePolygon` with a point-in-polygon test — rather than the frame box. Retain a minimum touch affordance for very small pieces, but as a dilation of the true shape, not as a square: a tap just outside a small piece should still reach it without the piece claiming a whole 48 px square. The existing bounding box stays useful as a cheap rejection test before the exact test.

## 2. FX-2 — Swapping two identical pieces (not a defect; pin it with a test)

**Reported as a concern:** two identical same-size pieces on the board can be exchanged, which would mean a level has more than one solution.

**Finding: the solver already handles this, verified empirically.** `content/solver.ts:112` groups pieces by `shapeKind:orientation:frameSize`, and `canonicalKey` (`solver.ts:241-256`) sorts the poses inside each group before building the key, so an arrangement and its swap produce the same key and count once. `authoring.ts` KIT-03 separately drops a decoy anchor that duplicates anchor A of an identical piece.

Probes run against `authorLevel` on 2026-10-06, each with two interchangeable pieces whose anchor lists let them swap:

| Probe | Pieces | Rotation | `solutionCount` |
|---|---|---|---|
| A | two squares, frame 48, same orientation | off | 1 |
| B | two triangles, frame 48, **different** declared orientation | **on** | 1 |
| C | two triangles, frame 48, same orientation | on | 1 |

Probe B tested a specific hypothesis raised during investigation — that the group key uses the *declared* orientation rather than the effective one, so two pieces that rotate into each other would fall into different groups and be counted twice. **It did not reproduce.** The hypothesis is recorded here as rejected so nobody re-raises it from reading the group key alone.

That two identical pieces are interchangeable *in play* is inherent to the win rule: victory is the parity mask matching the target, and swapping identical pieces yields an identical mask. It is not a defect.

**Approach.** Change nothing. Add a regression test asserting `solutionCount === 1` for probe A and probe C, so a future change to `canonicalKey` or to the group key cannot silently start double-counting. The test is the deliverable for this item.

## 3. FX-3 — Remove the magnet ring (removal)

**Reported:** the hint circle is unnecessary.

**Target.** `presentation/BoardRenderer.ts:499-511` — `magnetRingGraphics` strokes a circle around the candidate anchor whose radius and alpha come from `magnetRing` in `pieceMotion.ts`, driven by `ANIM_TOKENS.magnetRingFarRatio` / `magnetRingNearRatio` in `designTokens.ts:230-231`. It was added by VR3a and accepted by the reviewer on 2026-10-06, so this removes work that is six commits old.

**Not in scope:** the ripple from `PlayScene.spawnCosmicInteraction` (`PlayScene.ts:483-493`), which fires when the player taps empty space. It is a different effect and stays. If the reported circle is in fact the ripple, this item retargets and the magnet ring stays — settle that before the removal task runs.

**Approach.** Remove the ring's graphics object, its draw call, its `pieceMotion` helper and its two tokens, along with any test that pins them. Removal must be complete rather than disabled behind a flag; VR3a's other additions — the pickup anticipation dip and the unified target outline — are untouched.

## 4. FX-4 — The match-count bar overruns the bottom row (defect)

**Reported:** with many pieces, the "số mảnh đã khớp" bar spills over the reset button.

**Root cause.** `presentation/Hud.ts:375-396` — `drawMatchBar` sizes the pill from the piece count with no upper bound, and always centres it:

```ts
const iconsWidth = total * (iconSize * 2 + iconGap);   // 38 * total
const width = iconsWidth + this.matchBarText.width + padding * 2;
this.matchBar.setX(360);
```

The reset container sits at x = 84 with a 112 px circle (`Hud.ts:147`), so it occupies roughly x 28–140; in chapter 4 the rotate button mirrors it on the right. The bar's left edge is `360 - width/2` and moves left without limit as `total` grows.

**An honest gap in this analysis.** Working the arithmetic with the current token values puts the collision at roughly ten pieces, while the largest existing level is 3-6 with seven, and the behaviour was reported from real play. So the estimate is wrong somewhere — most likely in the measured text width or in the two rows' y coordinates, since the bar sits at `bottomBarBounds.y + 44` and the buttons at `bottomRowY`. **The first implementation step is to measure the real overlap in the running game at 7 pieces, not to trust this estimate.**

**Required behaviour.** The bar never overlaps the reset button or the rotate button at any piece count the game can produce, at any supported screen size.

**Approach.** Give the bar a maximum width derived from the gap between the two buttons rather than from the piece count, and degrade inside that budget: shrink `iconGap`, then `iconSize`, then fall back to the numeric count alone without per-piece jewels. The bar stays centred.

## 5. FX-5 — Restyle the icons (restyle)

**Reported:** the reset button, the hint eye, settings and back do not share the game's visual language, and should be generated in a consistent style.

**Correction to the premise.** These icons are already generated in code, not imported assets: `TextureFactory.ts:289` draws `icon_reset` on a 32 × 32 canvas, `:183` and `:211` draw `icon_eye_open` / `icon_eye_closed` at 36 × 36, all as canvas paths. Moving them to SVG would change the drawing API without changing how they look, so that is not the fix.

**The actual defect is stylistic**, and it is real: these icons were drawn as generic glyphs and do not follow the diamond/jewel motif, stroke weight, or amber-and-ice palette that VR1–VR3b established for the rest of the UI.

**Approach.** Redraw them against the existing design tokens, as a set: one stroke weight, one corner treatment, the diamond motif where an icon can carry it, colours drawn from `COLOR_TOKENS` rather than literals. The texture sizes, keys and call sites do not change, so no consumer moves. `bannedColors.test.ts` already scans `src/` for colour literals outside the three families and must keep passing.

## 6. FX-6 — The completed node's checkmark shows under the silhouette (defect)

**Reported:** on the level-select map, a completed level's icon overlaps a leftover checkmark.

**Root cause.** `TextureFactory.ts:449-460` bakes a checkmark into the `node_completed` texture, with this comment:

> *"The checkmark is drawn here only as the fallback for a level whose silhouette cannot be built; LevelSelectScene draws the silhouette over it for every level that has one."*

`LevelSelectScene.ts:372-388` then draws the silhouette *on top of* that sprite and never hides the checkmark. The silhouette does not cover the whole diamond, so the checkmark's arms remain visible around it. The fallback design is sound; the implementation cannot work, because a mark baked into a texture cannot be hidden by drawing a smaller shape over it.

**Required behaviour.** A completed node shows its silhouette, or — only when the silhouette cannot be built — a checkmark. Never both.

**Approach.** Separate the two states into two textures, `node_completed` without the mark and a `node_completed_check` with it, and choose between them by whether `drawTargetSilhouette` succeeded; or keep one plain texture and draw the checkmark at runtime inside the existing `catch` branch. Either way the decision moves to the point that already knows the answer — the `try` / `catch` in `LevelSelectScene`.

## 7. Done when

- Tapping any piece of any shape selects that piece, and a tap in the empty part of a piece's frame selects whatever is actually drawn there, or nothing.
- A regression test pins `solutionCount === 1` for two interchangeable identical pieces.
- No magnet ring is drawn, and no token, helper or test for it remains.
- At every piece count the campaign can produce, the match bar clears the reset and rotate buttons, verified by screenshot at 720 × 1280.
- The reset, eye, settings and back icons read as one family with the rest of the UI, and `bannedColors.test.ts` still passes.
- A completed node on the map shows either its silhouette or a checkmark, never both.
- `npm test`, `npm run typecheck` and `npm run build` pass.

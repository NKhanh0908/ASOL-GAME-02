# Visual Refactor VR3a — Piece Feel and the XOR Animation

Date: 2026-10-06
State: approved
Scope: `game-next/src/presentation/`
Source: `docs/gui/vr3/mirror-gameplay-animation-improvement.md` §1–5
Depends on: VR0 (`2026-10-06-vr0-motion-language-design.md`) for the `EASES` registry and the `piece` family
Runs beside: VR2 (`plans/2026-10-06-vr2-level-select.md`). The two touch disjoint files — VR2 is Level Select and its textures, VR3a is the play screen's piece and board layers — so they can be executed in parallel without conflict.

## 1. Why

The source document was written from screenshots and video of the play screen.
Read against the code, four of its five sections describe behaviour that
already ships. This spec exists mostly to record that, so the next agent does
not build it a second time, and to add the two things genuinely missing.

### 1.1 What already exists

| Source | In the code today |
|---|---|
| §1 Pick up: anticipation then lift | Half. `pickup` calls `setLifted(true, liftMs: 80, 'backOut')` (`FeedbackDirector.ts:102`), and `backOut` overshoots. There is **no anticipation dip** before the lift |
| §2 Dragging: spring / delayed follow | Yes, and already settled. `POSE_TAU.dragging` smooths exponentially (`pieceMotion.ts:17`). VR0 §2.1 explicitly chose this over the `position += (target − position) × 0.35` the source proposes, because that form is frame-rate dependent. **Not reopened** |
| §3 Approaching anchor: feel the pull | Half. `magnetPose` pulls the piece 30% toward the candidate (`pieceMotion.ts:53`, `magnetStrength: 0.3`) and a preview outline is drawn at `previewAlpha: 0.5`. There is **no signal at the anchor itself** |
| §4 Snap: overshoot, ripple, bell, haptic | Yes, in full. `bounceScale` runs 1.08 → 0.98 → 1.0 over `bounceMs: 180`, `snapRing` expands over `snapRingMs: 240`, the counter pops, and the GS audio stream supplies the pitched chime |
| §5.1 Two layers: the overlap vanishes | Yes. The old parity layer is drawn immediately while the new one fades in over `overlapFadeMs: 150`, and `traceEdge` runs a highlight along the overlap's boundary over `overlapTraceMs: 320` — the "highlight chạy dọc đường biên" the source asks for |
| §5.2 Three layers: the overlap revives | Yes. `reviveFlash` runs over `reviveFlashMs: 200`, inside the 180–250 ms band the source proposes, with the `shimmer` cue on `overlap-revive` |

Every one of these is already skipped under Reduced Motion through the
`if (reduced) return` guards in `FeedbackDirector.handle`.

**A correction to the project's own records.** `docs/ai/DOCS-INDEX.md` states
that VR3a's XOR animation "does not [exist] (`overlapInversionMs` token
reserved but unread)". The unread token is real, but it is a **duplicate**:
`ANIM_TOKENS.duration.overlapInversionMs` (`designTokens.ts:166`) is dead,
while the shipped animation runs on `FEEDBACK_TOKENS.overlapFadeMs`,
`overlapTraceMs`, `overlapTraceFraction` and `reviveFlashMs`. The row is wrong
and is corrected as part of this spec.

So VR3a reduces to two additions.

## 2. Decisions taken

| # | Question | Decision |
|---|---|---|
| 1 | Add the §1 anticipation dip, given it delays the response to touch? | **Yes, in full** — dip to 0.97, then lift. The reviewer accepted the ~40 ms cost |
| 2 | How should the approach be telegraphed? | **A ring at the anchor** that tightens as the piece closes, reusing the shape `snapRing` already draws |
| 3 | Revisit the drag model (§2)? | **No.** Settled in VR0 §2.1 |
| 4 | Does the board grid change? | **No.** The reviewer confirmed on 2026-10-06, against `docs/screenshots/web/m1/Man1-5-ytuong.png`, that the board keeps its grid exactly as it is. An earlier reading of "the faint lines inside the stele" as the board grid was wrong; the lines meant were the target's internal seams, §3.4 |
| 5 | Is the dead `overlapInversionMs` token removed? | **No** — removing it would break `tests/designTokens.test.ts:102`, which asserts its value. Deleting a token and its assertion is a separate cleanup, not part of a visual spec |

## 3. Changes

### 3.1 Anticipation on pick up

`PieceView` applies the lift as `liftScale = 1 + (liftScale − 1) × lift`
(`PieceView.ts:160`), and `lift` is driven by `lerp(0, 1, EASES[ease](t))`,
which is just `EASES[ease](t)`. A curve that dips **below zero** therefore
compresses the piece before lifting it, with no second animation layer to
compound against the first.

With `FEEDBACK_TOKENS.liftScale = 1.08`, a lift of `−0.375` gives exactly
`1 + 0.08 × (−0.375) = 0.97`, the dip the source asks for.

So the change is one new easing, not a new mechanism:

- Add `anticipateOut` to the `EASES` registry (`transitions/motion.ts:8`) and to
  the `EaseName` union. It dips to `−0.375` at 40% of its duration, then rises
  to `1`, each leg eased with the existing `cubicOut` — the same two-leg shape
  `bounceScale` already uses, so the two read as one family.
- `pickup` uses it: `setLifted(true, scaleTiming(F.pickupMs), 'anticipateOut')`,
  with a new `pickupMs: 100` replacing `liftMs: 80` **at that call site only**.
  `liftMs` stays for any other caller.

Two consequences, both wanted:

- **The shadow comes free, and behaves correctly at a negative lift.**
  `PieceView.ts:172-175` drives the shadow from the same `lift`: its offset is
  `lerp(shadowRest, shadowLifted, lift)`, which extrapolates *inward* past rest
  during the dip, and its alpha is `shadowAlpha × lift`, which goes negative and
  is clamped to 0 by Phaser's `setAlpha`. So the shadow vanishes as the piece
  presses down and fades back in as it rises — the source's "shadow expands at
  120 ms", with no separate tween and no clamp to add.
- **The lift ends at 1.08, not the source's 1.06.** 1.08 is the existing lifted
  rest scale, so ending there means the anticipation hands over to the steady
  state with no discontinuity. Ending at 1.06 would need a third leg settling to
  1.08, which is motion the player cannot read at this speed.

Under Reduced Motion `scaleTiming` already returns 0, so the piece snaps to the
lifted scale with no dip. No extra guard is needed.

### 3.2 A ring at the anchor during approach

While a snap candidate exists, draw a thin ring centred on the candidate anchor
that tightens and brightens as the piece closes. A candidate only exists inside
the snap radius (`freePlacement.ts:43` for free placement, the controller's
`snapCandidateId` for anchored levels), so the ring appearing *is* the "you are
in range" signal, and its tightening is the "how close" signal.

Geometry comes from a pure function so it can be tested without a renderer:

```
magnetRing(distPx, pieceRadiusPx) -> { radius, alpha }
  k      = clamp(distPx / (pieceRadiusPx * spanRatio), 0, 1)
  radius = pieceRadiusPx * (nearRatio + (farRatio - nearRatio) * k)
  alpha  = alphaNear + (alphaFar - alphaNear) * k
```

New tokens under `FEEDBACK_TOKENS`:

| Token | Value | Meaning |
|---|---|---|
| `magnetRingFarRatio` | 1.45 | radius multiple at the edge of the span |
| `magnetRingNearRatio` | 1.05 | radius multiple when the piece is on the anchor |
| `magnetRingSpanRatio` | 0.9 | span, as a multiple of the piece radius |
| `magnetRingAlphaFar` | 0.18 | faintest |
| `magnetRingAlphaNear` | 0.5 | brightest |

Drawn in `COLOR_NUMBERS.icePrimary`, the colour the preview outline already
uses, on its own graphics layer at the preview's depth, cleared and redrawn each
frame exactly as the preview is. One `strokeCircle` per frame, only while a
candidate exists.

**This ring is not disabled under Reduced Motion.** It is an affordance driven
by the player's own finger, not autonomous motion: it tells them where the piece
will land. Reduced Motion removes motion the player did not ask for; removing
this would remove information. Recorded here because it is the first element in
the project to be deliberately exempt, and the exemption needs a reason on file.

On the glow ladder the dragged piece stays tier 3. The ring is tier 2, below the
piece and above the board. `snapRing`, which fires after release, remains the
brief tier-3 moment it is today.

### 3.3 Explicitly unchanged

So that a future reader does not mistake silence for an oversight: §2, §4, §5.1
and §5.2 are implemented and this spec changes none of their timings, easings,
colours or audio cues. `overlapFadeMs`, `overlapTraceMs`, `overlapTraceFraction`,
`reviveFlashMs`, `bounceMs`, `snapRingMs` and `magnetStrength` keep their values.

### 3.4 One outline for the whole target

Reviewer finding, 2026-10-06, from three screenshots in
`docs/screenshots/web/m1/`: `Man1-2.png` (the house shows a horizontal line
where the roof meets the body), `man1-5.png` (the boat shows the seams between
all three of its pieces) and `Man1-5-ytuong.png`, the reviewer's own drawing of
the wanted result — a single outer boundary around the whole boat, with the
board grid left exactly as it is. It is
not a grid line. `BoardRenderer.drawTargetSilhouette` (`:505-523`) iterates
`targetPlacements` and calls `drawJewelPolygon(..., variant: 'target')` once per
placement, and that variant both fills and dash-strokes its own polygon
(`JewelShape.ts:88-96`). Every edge two pieces share is therefore stroked twice,
and reads as a seam cutting through the figure.

The target must read as one silhouette, on every level.

1-5 is the case that sets the algorithm. Its sail and its hull share only
**part** of an edge, not the whole of one, so cancelling exact duplicate edges
would fix 1-2 and leave 1-5 broken. Edges have to be split at every vertex
lying on them before duplicates cancel.

**The fills stay per placement; only the stroke is merged.** Each placement
carries its own `hoverAlpha[i]`, which brightens the piece the player is
dragging toward, and its own `targetReveal[i]` for the victory reveal. Merging
the fills would discard both, and buys nothing — two fills of the same colour
meeting along an edge show no seam. The stroke is the entire problem.

So `polygonClip.ts` gains `unionOutline(polygons): Pt[][]`: wind every polygon
counter-clockwise, split each edge at any vertex lying on it so partly-shared
edges still match, cancel every edge that appears in both directions, chain
what survives into closed loops, and drop collinear vertices. The splitting step
is what makes it correct for pieces that overlap an edge only partly, rather
than only for pieces that share one exactly.

`JewelShape.ts` splits its target branch: `drawJewelPolygon` fills, and a new
`strokeTargetOutline` dash-strokes a loop. `BoardRenderer` fills per placement
as it does today, collects the polygons, and strokes `unionOutline` of them once
at the brightest of the placements' alphas.

## 4. Code structure

| File | Change |
|---|---|
| `transitions/motion.ts` | `anticipateOut` added to `EASES` and to `EaseName` (§3.1) |
| `designTokens.ts` | `pickupMs`, the five `magnetRing*` tokens |
| `feedback/FeedbackDirector.ts` | `pickup` uses the new ease and duration; draws the ring while dragging (§3.2) |
| `pieceMotion.ts` | `magnetRing` pure function |
| `BoardRenderer.ts` | One graphics layer for the ring, cleared per frame beside the preview (§3.2); one merged target outline (§3.4) |
| `polygonClip.ts` | `unionOutline` (§3.4) |
| `JewelShape.ts` | Target variant fills; `strokeTargetOutline` strokes (§3.4) |

No extraction and no new module. `PieceView.ts` is not modified: the dip rides
the lift path it already has.

## 5. Testing

- `EASES.anticipateOut`: `f(0) === 0`, `f(1) === 1`, the minimum is `−0.375`
  within a tolerance, it occurs at `t = 0.4`, and the function is continuous
  across the join (left and right limits at 0.4 agree).
- Pick-up scale: feeding `anticipateOut` through `1 + (liftScale − 1) × lift`
  reaches exactly `0.97` at its minimum and `1.08` at `t = 1`.
- `magnetRing`: radius decreases monotonically as distance decreases; alpha
  increases monotonically; at `distPx = 0` the result is
  `{ radius: r × 1.05, alpha: 0.5 }`; beyond the span the values clamp and do not
  overshoot.
- Reduced Motion: `scaleTiming(pickupMs)` is 0, and the ring still renders.
- Nothing in `tests/feedbackEvents.test.ts` changes: the event sequence for
  pickup, snap, overlap-hollow and overlap-revive is untouched.
- `unionOutline`: a single square returns itself; two squares sharing a full
  edge return one four-corner loop; two sharing half an edge return a
  six-corner L; a triangle on a square returns the five-corner house with no
  edge spanning the join; two disjoint squares return two loops; and input
  winding direction does not change the result.

Manual check on a device: that the 40 ms dip does not make pick-up feel
unresponsive during fast repeated drags, and that the ring reads as an
affordance rather than as clutter when several anchors sit close together.

## 6. Out of scope

- Everything already shipped, listed in §1.1 and §3.3.
- The drag model (§2) — VR0 §2.1.
- Removing the dead `overlapInversionMs` token and its assertion.
- Source §6–7 (medallion and victory ritual) — VR3b.
- Source §8–15 — settled in VR0 or describing other screens.

## 7. Risks

- **The dip costs 40 ms of perceived responsiveness on every pick-up**, in a
  game whose core loop is picking pieces up. This is the one change here that
  could make the game feel worse rather than better, and it cannot be judged
  from a desktop browser. If it feels sluggish on a device, the fallback is
  decision 1's rejected option: keep `backOut` at 80 ms and drop §1. The
  reviewer should test this before the rest of the spec is accepted.
- `unionOutline` is the one piece of real geometry in this spec. It is correct
  for polygons that share edges exactly or partly, but it does **not** compute a
  true boolean union: two target pieces that genuinely cross, rather than abut,
  would leave the crossing edges uncancelled and draw a line through the figure.
  No shipped level does this, and the spec's testing step walks every approved
  level to confirm it. If a future level crosses its target pieces, the renderer
  needs a real clipping union, not a patch to this function.
- The ring adds a `strokeCircle` per frame during drags. Negligible on its own,
  but it is drawn on the hottest path in the game; it must go in the existing
  per-frame clear-and-redraw block, never in a tween.
- The shadow's alpha relies on Phaser clamping a negative `setAlpha` to 0. That
  is current Phaser 3.90 behaviour; if a future version throws or wraps instead,
  the dip would flash the shadow. A test asserting the shadow alpha is 0 at the
  dip would catch it, but needs a Phaser object and so is left to the manual
  device check.

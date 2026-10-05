# Visual Refactor VR0 — Motion Language

Date: 2026-10-06
State: draft
Scope: `game-next/src/presentation/`
Blocks: VR1, VR2, VR3a, VR3b — every later spec picks easing and duration from this table

## 1. Why

The gameplay animation assessment (`docs/gui/vr3/mirror-gameplay-animation-improvement.md` §8)
asks for one motion system instead of each animation choosing its own easing.
That request is foundational: VR1 and VR2 both animate things, and if they each
pick their own values first, this work becomes a cleanup of choices that were
avoidable.

So VR0 is split out of the VR3 assessment and sequenced **before VR1**. It is
deliberately small — it adds a semantic layer, not a new engine.

### 1.1 What already exists

The assessment assumes a motion system has to be built. Most of it is present.

| Piece | Status |
|---|---|
| Pure, testable easing registry | **Exists** — `EASES` in `transitions/motion.ts:8`, five functions, no Phaser |
| Durations | **Partly** — `ANIM_TOKENS.duration`, but no semantic grouping |
| Reduced Motion gate | **Exists** — `getMotionScale()` / `isReducedMotion()` |
| Stagger helper | **Exists** — `stagger(index, count, spanMs)` |
| Family layer (which ease for which kind of thing) | **Missing** — this spec |

The work is therefore a table on top of a registry, not a rewrite.

## 2. The four families

Named after what a thing *is*, so a reader can tell at the call site why a value
was chosen.

| Family | Ease | Duration | Applies to |
|---|---|---|---|
| `ui` | `cubicOut` | `tapMs: 90`, `standardMs: 200` | buttons, modals, toggles, navigation |
| `glass` | `quartOut` (new) | `300` | glass panels, medallion, stele frame |
| `magic` | `sineInOut` | `600`–`1400` | runes, constellation, shimmer, glow pulse |
| `piece` | `POSE_TAU` | — | drag, pickup, snap, settle |

`cubicOut` already accounts for 18 of the easing calls in the codebase and
`sineInOut` for 5, so two of the four families describe what the code already
does rather than changing it.

### 2.1 Three places the assessment conflicts with the code

**`backOut` belongs to no family but is used eight times.** It appears in
`routes.ts`, `PieceView.ts` and `FeedbackDirector.ts`. It is an overshoot ease,
and the assessment's four families have no slot for it. It is kept as the
variant `ui.overshoot` rather than removed: deleting it means rewriting eight
working call sites to gain nothing a player would notice.

**UI duration is split in two.** The assessment proposes 180–220 ms for all UI
motion, but `ANIM_TOKENS.duration.buttonTapMs` is 90 ms. These are different
jobs: acknowledging a press must be immediate, while a modal or a navigation
transition reads better slower. Forcing the tap to 180 ms would make every
button feel laggy. The family therefore carries `tapMs` and `standardMs`.

**The piece family keeps exponential smoothing, not a damped spring.**
Assessment §8.4 asks for spring damping 0.7–0.8. The repo instead uses
`POSE_TAU` in `pieceMotion.ts` — `pos += (target - pos) * (1 - e^(-dt/tau))` —
with three levels (dragging, settling, idle) and existing test coverage. A
damped spring is a different model: it needs velocity carried in the piece
state, and it would mean rewriting `PieceView` and the `pieceMotion` tests.

The assessment itself records that the drag feel is already right (§2 lists the
spring interpolation as present). Replacing a working model with an untested one
to satisfy a naming preference is not a trade worth making. Overshoot on snap is
already supplied separately by `bounceScale`, which is the one place the spring
model would have added value.

**This decision is recorded here so it is not re-litigated.** If drag feel is
ever judged wrong on a real device, revisit it then, with that evidence.

## 3. Changes

### 3.1 Add the missing ease

`quartOut` joins `EASES` and the `EaseName` union in
`src/presentation/transitions/motion.ts`:

```
quartOut: (t) => 1 - (1 - t) ** 4
```

It is the only ease the assessment names that the registry lacks.

### 3.2 Add the family table

`MOTION_FAMILIES` in `designTokens.ts`, keyed by family name, each entry giving
its ease name and its durations. `ANIM_TOKENS.duration` stays where it is and
keeps its current values; the family table references them rather than
duplicating numbers, so there is one source for each duration.

### 3.3 No call sites change in this spec

VR0 ships the table and its tests. Existing animations keep their current
values, which the families were chosen to match. Later specs adopt the families
as they touch each screen. This keeps VR0 reviewable on its own and means a
mistake here cannot break the running game.

## 4. Testing

- `quartOut` is monotonic on [0,1], starts at 0, ends at 1, and decelerates
  (its derivative falls).
- Every `MOTION_FAMILIES` entry names an ease that exists in `EASES` — this is
  the test that stops a family drifting from the registry.
- The four family names are exactly `ui`, `glass`, `magic`, `piece`.
- `ui` carries both `tapMs` and `standardMs`, and `tapMs < standardMs`.
- Family durations that mirror `ANIM_TOKENS` read from it rather than restating
  a literal.

## 5. Out of scope

- Migrating existing call sites to the families (§3.3).
- Any animation behaviour change. VR0 adds vocabulary; VR1 onwards uses it.
- Replacing `POSE_TAU` with a damped spring (§2.1).

## 6. Effect on the other specs

- **VR1** — its plan (`plans/2026-10-06-vr1-foundation-menu.md`) is amended so
  Tasks 4–7 read `MOTION_FAMILIES` instead of choosing easing values. VR0 must
  land first.
- **VR2** — gains assessment §9: the Level Select label `✦ 3-4 · Ngọn Nến ✦`
  carries both text ornament and visual decoration; the ornament is dropped so
  the visuals carry it alone.
- **VR3a** (piece feel and the XOR overlap animation) and **VR3b** (target
  medallion and the victory ritual) are written after VR0 and VR1 land. VR3b
  must be reconciled with the constellation strip VR2 adds to the victory card.

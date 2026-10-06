# Visual Refactor VR3b — Target Medallion and Victory Ritual

Date: 2026-10-06
State: approved (reviewer, 2026-10-06)
Scope: `game-next/src/presentation/`
Source: `docs/gui/vr3/mirror-gameplay-animation-improvement.md` §6–7
Depends on: VR0 (`2026-10-06-vr0-motion-language-design.md`) for the motion families; VR1 (`2026-10-05-visual-refactor-foundation-menu-design.md`) for the glow ladder
Unblocks: VR2 (`2026-10-06-visual-refactor-level-select-design.md`), whose constellation strip needs the card slot this spec defines

## 1. Why

The source document reads the game from screenshots. It proposes a five-phase,
2800 ms victory ritual and a two-state "Oracle Medallion" as if neither
existed. Both largely exist already, built during the F2 motion stream. Reading
the code before writing this spec changed the shape of the work: VR3b is a
**re-timing and a layout contract**, not a new feature.

### 1.1 What already exists

`victorySequence.ts` and `VICTORY_TOKENS` (`designTokens.ts:236-263`) already
implement the full choreography the document asks for, at the same total length
it proposes:

| Source §7 | Already in code |
|---|---|
| Phase 1 — Recognition, 0–300 | `skyDimAtMs: 200`, `skyDimMs: 400`; the grid texture is already handed to the victory choreography (`BoardRenderer.ts:262-263`) |
| Phase 2 — Awakening, 300–900 | `lightsAtMs: 400` → `lightsEndMs: 1200`, staggered per piece; celestial rings speed to `3.0x` on win (`BoardRenderer.ts:268`) |
| Phase 3 — Constellation, 900–1700 | `traceAtMs: 900` + `traceMs: 600`; `burstAtMs: 1300` with 30 particles, two rings and a camera flash |
| Phase 4 — Reward, 1700–2200 | The card already carries the label, the level name and a verse (`victoryVerse`), entering as four staggered groups (`Hud.ts:234-325`) |
| Phase 5 — CTA, 2200–2800 | `cardAtMs: 2000`, `cardMs: 800`, slide `cardSlidePx: 60` |

A reduced-motion path also exists: `victoryPlan(pieceCount, reduced)` collapses
the whole sequence to `reducedMs: 150`.

So Phase 4 needs no work at all, and Phases 1, 2 and 5 need only re-weighting.

**The medallion already has its two states.** `TargetBadge.animateZoom`
(`TargetBadge.ts:172-198`) scales the badge `1.0 → 1.35`, holds 900 ms and
returns. What the source asks for and the code lacks is the background dim.

**The Eye is binary, not a crossfade.** `showTarget` toggles the board's target
ghost on and off (`playController.ts:206-208`, `BoardRenderer.ts:506-507`) and
persists in settings (`progressRepository.ts:27`). The crossfade the source
describes — result at 55%, target at 35% — does not exist. This is the one item
in §6–7 that is genuinely new.

### 1.2 The card is out of room

The victory card is anchored by its **top** edge at `trayBounds.y - 4` and runs
262 px downward (`Hud.ts:217`). On the base layout that puts its bottom at
1274 of a 1280 px canvas — six pixels of margin. The card cannot grow downward.

This matters because VR2 wants to add a constellation strip to this same card.
Resolving it is the main reason VR3b must land before VR2.

## 2. Decisions taken

| # | Question | Decision |
|---|---|---|
| 1 | Who owns the card layout, VR2 or VR3b? | **VR3b.** It grows the card and reserves an empty slot; VR2 fills the slot without touching geometry |
| 2 | Eye: binary with a smoother transition, or a real crossfade? | **Full crossfade** — placed result to 0.55, target ghost to 0.35 |
| 3 | Medallion: press-and-hold or the current tap-and-auto-return? | **Keep tap-and-auto-return**, add the background dim. Hold would compete with dragging a piece on a portrait screen |

## 3. Changes

### 3.1 The victory card grows upward

The card keeps its bottom edge and moves its top edge up by 48 px:

| | Current | VR3b |
|---|---|---|
| Anchor | top edge at `trayBounds.y - 4` | **bottom edge** at `trayBounds.y + 258` |
| `card.y` | `trayBounds.y - 4` | `trayBounds.y - 52` |
| `card.h` | 262 | **310** |
| Bottom margin | 6 px | 6 px, unchanged |

Because the anchor moves from the top edge to the bottom edge, the card keeps
clearing the bottom safe-area inset exactly as it does today: `trayBounds.y` is
already derived from `safe.bottom` (`layout.ts:85-87`), so both edges shift
together on devices with a gesture bar.

Inner offsets, relative to `card.y`. Everything below the level name shifts
down by 48; the 34 px of padding under the button row is preserved:

| Element | Current | VR3b |
|---|---|---|
| Label (`winLabel`) | +38 | +38 |
| Level name (`winTitle`) | +79 | +79 |
| **Reserved slot** | — | **+99 … +147** (48 px tall) |
| Verse (`winVerse`) | +123 | +171 |
| Button row top (`btnTop`) | +152 | +200 |

Two textures are generated at fixed sizes and must grow with the card
(`TextureFactory.ts:63-71`): `victory_card_frame` 660×262 → **660×310**, and
`victory_card_surface` 648×250 → **648×298**.

`VICTORY_CARD_GROUPS` stays **4** in VR3b. The reserved slot holds nothing yet,
so it is not an animated group. VR2 raises the constant to 5 when it adds the
strip, which re-derives `cardItemMs` to 400 ms automatically through the
existing formula in `victorySequence.ts:73`.

**Accepted consequence:** until VR2 lands, the card ships with 48 px of empty
space between the level name and the verse. Forty-eight pixels of vertical
whitespace between two centred text blocks reads as generous spacing, not as a
hole. If the reviewer disagrees on a real device, the remedy is to land VR2
immediately after rather than to tune the gap.

### 3.2 `showWinModal` must dim the board itself

The won state is reached two ways, and they must leave the screen identical.

Checked against the code, the gap is narrower than it first looks.
`PlayScene.ts:241-242` already calls `boardRenderer.setVictoryMode(true)` before
`hud.showWinModal(...)` on the restore path, and `setVictoryMode`
(`BoardRenderer.ts:226-229`) turns the gold frame on and hides the tray — the
same two things the timeline does. So the tray is out of the way on both paths,
and the card's 36 px overlap with the bottom of the board is identical on both;
it is a question of whether that overlap looks right at all, not of dim parity.

**One thing is genuinely missing on the restore path: the sky dim.** The
timeline calls `background().deepen(skyDimExtra, skyDimMs)`
(`FeedbackDirector.ts:265-267`); `setVictoryMode` does not, and `Hud` has no
reference to the background scene to do it itself. So a player re-entering a
finished level sees the card against an undimmed sky, while a player who just
won sees it against a dimmed one.

The fix belongs in `PlayScene`, next to the existing `setVictoryMode(true)`
call, not in `Hud`: deepen the sky by `skyDimExtra` with a zero-length
duration so the restored state matches the timeline's end state.

### 3.3 Re-weighting the ritual

Three edits to `VICTORY_TOKENS`, and nothing else:

**One focus at a time.** The trace runs 900–1500 while the burst fires at 1300,
so for 200 ms the trace, 30 particles, two expanding rings and a camera flash
all compete. Per the VR1 glow ladder, a moment has one tier-3 element. The trace
ends where the burst begins:

- `traceMs: 600 → 400`, so the trace closes at 1300 exactly as the burst opens.

**No second constellation.** The source's Phase 3 suggests some particles knit
into a constellation on the board. VR2 already puts a constellation strip in the
card, two seconds later. Two constellation moments in one 2800 ms window must
then be kept consistent with each other forever, for no gain — the card strip is
seen by every player and carries the meaning on its own. The board knit is
**dropped**, not deferred.

**Phase 4 is untouched.** The label, level name and verse already exist and
already stagger. VR3b changes nothing there.

### 3.4 A distinct sound for lighting a star

The VR2 spec states that the strip animation "uses the existing `shimmer` SFX".
`shimmer` is already bound to `overlap-revive` (`audioCues.ts:64-65`) — the
sound of a cell coming back under the parity rule during play. Those two events
land seconds apart: the player sets the last piece, hears `shimmer` for the
revived cell, and would hear `shimmer` again as the card lights the next star.
One timbre carrying two meanings inside one breath blurs both.

VR3b adds a distinct patch under `src/content/audio/sources/` for the
star-lighting moment, registered in `src/content/audio/index.ts` alongside the
existing cues, and VR2 §3.1 is corrected to name it instead of `shimmer`.

### 3.5 Medallion: background dim and the glass family

Keep the tap-and-auto-return interaction. Two changes:

- **Background dim.** While the badge is enlarged, a full-canvas scrim fades
  `0 → 0.35` beneath it and back out on return, so the enlarged silhouette is
  read against a quiet field rather than against the board.
- **Glass easing.** The current `Back.easeOut 180 ms` out and
  `Cubic.easeOut 200 ms` back belong to no VR0 family. They move to the `glass`
  family — `quartOut`, 300 ms (`transitions/motion.ts:84-87`) — which VR0
  already names the target medallion as a member of. This is the first screen to
  use `glass`, so it sets the precedent: panels, medallions and frames read as
  having mass.

The 900 ms hold between the two tweens is unchanged.

### 3.6 Eye crossfade

`showTarget` stays a `boolean` in settings. No change to `progressPort`,
`progressRepository` or the saved shape; only what the flag renders changes.

| | Target ghost | Placed result |
|---|---|---|
| `showTarget: false` | alpha 0 | alpha 1.0 |
| `showTarget: true` | alpha **0.35** | alpha **0.55** |

The placed result means the snapped pieces and the parity layers above them —
the player's current figure — not the piece being dragged, which stays fully
opaque so the thing under the finger is never ambiguous.

Both values become tokens rather than literals. The rendering path already
exists: `PieceView` carries `pose.alpha` (`PieceView.ts:159-165`) and
`drawJewelPolygon` takes an `alpha` option that multiplies through every layer
it draws (`JewelShape.ts:84-142`). This is a multiplier, not a new draw layer.

Toggling crossfades over the `ui` family's 200 ms rather than cutting.

## 4. Code structure

| File | Change |
|---|---|
| `Hud.ts` | Card geometry and inner offsets (§3.1) |
| `PlayScene.ts` | Restore path deepens the sky to match the timeline (§3.2) |
| `TextureFactory.ts` | `victory_card_frame` and `victory_card_surface` grow (§3.1) |
| `designTokens.ts` | `traceMs`, medallion scrim alpha, the two Eye alphas |
| `TargetBadge.ts` | Scrim and the `glass` family (§3.5) |
| `BoardRenderer.ts` | Eye crossfade on the target and parity layers (§3.6) |
| `PieceView.ts` | Honours a dim factor on `pose.alpha` for snapped pieces (§3.6) |
| `src/content/audio/sources/` + `index.ts` | New star-lighting patch (§3.4) |
| `victorySequence.ts` | No change expected; `VICTORY_CARD_GROUPS` stays 4 |

No extraction is proposed. Nothing here gains a second caller.

## 5. Testing

- **Card geometry:** at the base layout and at two bottom safe-area insets, the
  card's bottom edge stays at `trayBounds.y + 258` and its top at
  `trayBounds.y - 52`; the bottom margin never goes below zero.
- **Both entry points agree:** the sky's extra dim after the victory timeline
  completes equals the sky's extra dim after the restore path runs.
- **Ritual timing:** `victoryEndMs(plan)` is unchanged at 2800 ms after the
  `traceMs` edit, and the trace closes no later than `burstAtMs`.
- **Reduced motion:** the plan still collapses to `reducedMs`, and the grown
  card renders its end state with no tween.
- **Eye crossfade:** with `showTarget: true`, snapped pieces render at 0.55 and
  the target ghost at 0.35; a piece being dragged stays at 1.0. Toggling back
  restores 1.0 and 0.
- **Audio:** the star-lighting cue and `overlap-revive` resolve to different
  patch keys.
- **Glow ladder:** at every sampled frame of the ritual there is at most one
  tier-3 element.

Manual check on a device: the 48 px reserved slot reads as spacing rather than
as a gap, and the Eye crossfade keeps 0.55 and 0.35 distinguishable in daylight.

## 6. Out of scope

- The board-level constellation knit (source §7 Phase 3) — **dropped**, §3.3.
- Press-and-hold on the medallion, and any third `showTarget` state.
- More particles, richer lore text, per-level verse variation.
- Source §1–5 (piece feel and the XOR animation) belong to VR3a; §8–15 were
  settled in VR0 or describe screens outside this spec.
- The constellation strip itself remains VR2's; VR3b only reserves its slot.

## 7. Risks

- **The 0.55 / 0.35 pair is the one unverified number here.** Amber-solid
  pieces at 0.55 and an amber-stroked ghost at 0.35 may converge into one
  muddy field in daylight, which would make the Eye less readable rather than
  more. Both are tokens so the reviewer can tune them on a device; if they
  cannot be separated, the fallback is to shift the target ghost toward the ice
  palette rather than to push the alphas further apart.
- **The empty slot ships visible.** Mitigated by landing VR2 next, §3.1.
- **The card now overlaps the bottom 36 px of the board** on both entry
  paths. The board is not dimmed on either path — only the sky is — so this
  overlap must simply look acceptable. It is the first thing to check on a
  device; if it does not, the card cannot grow and the reserved slot has to be
  found by removing something else from the card.
- VR2 §3.1 must be corrected for the audio cue (§3.4) before its plan is
  written, or the plan will specify the colliding sound.

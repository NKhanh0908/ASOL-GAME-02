# Visual Refactor VR2 — Level Select

Date: 2026-10-06
State: approved
Scope: `game-next/src/presentation/`
Depends on: VR0 (`2026-10-06-vr0-motion-language-design.md`) for easing and duration; VR1 (`2026-10-05-visual-refactor-foundation-menu-design.md`) for the sky gradient and the glow ladder; VR3b
(`2026-10-06-vr3b-medallion-victory-ritual-design.md`) for the victory card
slot and the star-lighting audio cue

## 1. Why

The reviewer's verdict on the constellation map: it works but does not feel like
a journey — it reads as a list of linked nodes rather than a path through a
constellation. Seven issues were raised.

Reading the code while answering the reviewer's four open questions corrected
four assumptions in the assessment. These corrections are the main reason this
spec is cheaper than the assessment's effort estimates.

### 1.1 Corrections to the assessment

**The "unlocked" state exists, but not with the meaning assumed.** The review
asks whether a cyan-glass "unlocked" node ever appears, reasoning that
sequential unlocking makes the only unlocked level the current one. In fact
`LevelSelectScene.ts:242` sets `state = 'unlocked'` when
`access.unlocked && !access.available`, and `available` means
`status === 'approved'` (`campaign.ts:27`). The manifest currently holds **22
approved and 6 planned of 28**. So the state renders for the level just past the
released content: the player finishes 3-10, sees 4-1 light up, taps it, and is
stopped by a "level is being polished" toast. This is the content frontier, and
it is a real dead end players reach today. The asset should not be deleted — it
should be redesigned to say so honestly.

**Auto-scroll to the current node is already implemented** at
`LevelSelectScene.ts:101-103`. Only the "return to current" button after
scrolling away is missing, and that is out of scope (§6).

**Per-chapter constellation shapes already have their machinery.**
`constellationLayout.ts:65` selects `TEN_NODE_PATTERN` — a lantern chain — for
any chapter with exactly ten nodes, and zigzags the rest. Chapter III (Họa Phẩm,
10 levels) therefore already has its own shape; chapters I, II and IV (6 each)
zigzag. Issue #4 is thus partly wrong, and fixing the rest means adding
coordinate tables and re-keying from node count to chapter, not building new
machinery.

**The completed-node thumbnail is cheap, not medium.**
`TargetBadge.drawTargetSilhouette(level)` already reads `targetCells` from the
level JSON, finds the bounding box and fits the silhouette into a badge — it is
the circular candle emblem above the board during play. Reusing it at node size
is reuse, not new work.

## 2. Decisions taken

| # | Question | Decision |
|---|---|---|
| 1 | Where does the "light a star" animation live? | **In the completion card.** A small constellation strip inside the victory card, so every player sees it. |
| 2 | Does the "unlocked" state occur? | **Yes** — see §1.1. Redesigned as the content frontier, not deleted. |
| 3 | Keep the purple lower half? | Settled in VR1: cut the purple. Shared `sky.stops`, no separate decision. |
| 4 | Completed node: thumbnail or generic trace? | **Thumbnail silhouette**, replacing the check mark, with the node enlarged to fit. |

Decision 1 follows directly from `Hud.ts:262`: the victory card has exactly two
buttons, with "Màn tiếp theo" as the wide primary. Most players press it and
never reach the map, so an animation that lives only on the map would go
unseen by most of the audience.

## 3. Changes

### 3.1 Constellation strip in the completion card

A small two-node strip inside the victory card: the level just finished lights,
a spark travels the link, the next node pops in.

It fills the 48 px slot VR3b reserves at card offset +99…+147 (§3.1 of the VR3b
spec). VR2 therefore changes no card geometry and no card texture; it adds the
strip into the reserved slot and raises `VICTORY_CARD_GROUPS` from 4 to 5.

- Duration 700–1000 ms, matching the assessment.
- Uses the dedicated star-lighting cue VR3b adds (§3.4 of
  `2026-10-06-vr3b-medallion-victory-ritual-design.md`), **not** `shimmer`:
  `shimmer` is already bound to `overlap-revive` in play (`audioCues.ts:64-65`),
  and the two events land seconds apart.
- New node: scale `0.8 → 1.08 → 1.0` with a glint.
- **Plays only on first completion** of a level, never on replay.
- Skipped entirely under Reduced Motion — the card shows the end state directly.
- Tap anywhere to skip to the end state.

The map itself gets no completion animation. This keeps one implementation
rather than two that must agree.

### 3.2 Completed nodes carry their silhouette

The check mark is replaced by the level's own target silhouette, so the map
becomes a collection of what the player has made. This serves the GDD's
"no score, no stars" philosophy: progress is shown by what was built, not by a
rating.

Node texture canvas grows **72 → 96 px**. The diamond is rotated 45°, so a 72px
canvas gives an inscribed square of only ~51px and about 40px of usable area
after padding — too small for shapes like the butterfly or the candle. At 96px
the inscribed area is ~68px.

**Corrected 2026-10-06, after the screenshot review.** Both numbers above are
the inscribed *square* of the canvas, and the implementation that followed them
used a fixed 46x32 box with the badge's 92:64 aspect ratio. Neither is what a
diamond allows. A node is `|x| + |y| <= 43`, so the real limit depends on the
figure's own proportions, and a fixed box cannot adapt to them: 3-4 rendered
17px wide and 1-4 13px wide inside a 96px node, which read as ink blots rather
than silhouettes. The renderer now scales each level until its furthest point
reaches a budget of 36, which is the largest it can legally be. Every level is
at least as large as before, the worst-hit grow by up to 1.9x, and all of them
now carry the same optical weight. Evidence:
`docs/screenshots/web/m1/node-silhouette-before-after.png`.

`drawTargetSilhouette` moves out of `TargetBadge` into a shared module so both
the badge and the node can call it. This is the one extraction in this spec, and
it is justified because the function is being given a second caller.

`NODE_STEP_Y` is 160px and paired nodes sit 320px apart, so the larger node
still fits without changing the layout tables. This must be confirmed visually
on the 10-node chapter, where nodes are densest.

### 3.3 The content frontier node

The `unlocked` state (6 planned levels) is redesigned to communicate "not built
yet" before the tap, not after:

- Glass diamond with its interior left empty rather than filled — visibly
  unfinished rather than merely dim.
- A short label beneath, in the same slot the current node uses for its name,
  reusing the existing `toast_level_polishing` wording rather than adding a new
  i18n token, so the node and the toast say the same thing in both locales.
- Tapping still shows the existing "being polished" toast, but it now confirms
  what the node already said instead of contradicting it.

This state disappears on its own once all 28 levels are approved.

### 3.4 Motion and the glow ladder

Per VR1 §3.2, applied here:

| Tier | Element |
|---|---|
| 3 — focus | Current node |
| 2 — active | Completed nodes |
| 1 — structure | Constellation links |
| 0 — ground | Locked nodes, chapter labels, frontier node |

Only the **current node moves** — a slowly rotating orbit and a pulsing centre.
Completed nodes are static. Walked links dim relative to the current one. This
keeps the battery cost near zero on a scrolling screen and gives the eye one
place to land.

### 3.5 Label ornament

Added from the gameplay assessment §9, which covers Level Select although the
rest of that document is about gameplay. The current node label reads:

```
✦ 3-4 · Ngọn Nến ✦
```

The sparkles duplicate work the visuals already do, so text and decoration
compete. Drop them and let the badge carry the decoration:

```
Ngọn Nến
3-4 · Họa Phẩm
```

The level name leads, the locator follows in the secondary text colour. The
principle, recorded for later screens: UI copy stays plain, decoration lives in
the visuals.

### 3.6 Links crossing chapter labels

Issue #3: the gold path currently runs through "Giao Thoa" and "Họa Phẩm". Fixed
by giving the chapter label a soft backing plate in the sky colour at tier 0,
which is cheaper and more robust than rerouting paths that are generated from
layout tables.

## 4. Code structure

| File | Change |
|---|---|
| `Hud.ts` | Constellation strip in the victory card (§3.1) |
| `LevelSelectScene.ts` | Node states, frontier node, label backing plate, glow tiers |
| `TextureFactory.ts` | Node canvases 72 → 96; frontier node texture |
| **shared silhouette module** (new) | `drawTargetSilhouette` extracted from `TargetBadge.ts` |
| `TargetBadge.ts` | Calls the extracted function |
| `constellationLayout.ts` | No change expected; verify spacing at 96px |

## 5. Testing

- Silhouette renderer: same output for the badge and for a node at both sizes;
  bounding-box fit holds for the widest and tallest levels in the manifest.
- Frontier node: with a `planned` level next in order, the node renders in the
  frontier state and the toast still fires on tap.
- First-completion only: the strip animation plays on first completion and not
  on replay of an already-completed level.
- Reduced Motion: the strip is skipped and the card renders its end state.
- Glow ladder: exactly one tier-3 element on this screen.

Manual check: the 10-node chapter at 96px nodes, confirming no overlap.

## 6. Out of scope

- **Per-chapter constellation shapes** for chapters I, II and IV (issue #4) —
  deferred by the reviewer. Chapter III already has its own shape.
- **Per-chapter progress** (issue #5) and the **return-to-current button**
  (issue #6, partly) — deferred. Auto-scroll already exists.
- **Completing a chapter into a named constellation** (assessment §4.5) —
  deferred with the chapter shapes.
- Issue #7 (purple) — handled in VR1.
- Everything else in the gameplay assessment. Only its §9 label note lands here,
  because it describes a Level Select element; §1–8 are VR0, VR3a and VR3b.

Issue #1 ("no sense of journey") is therefore only partly addressed: the strip
and the silhouette collection give progress meaning, but the map's shape stays
uniform until the deferred chapter work happens.

## 7. Risks

- Growing nodes to 96px is the one change that can break layout. The 10-node
  lantern chain is the dense case and must be checked before anything else.
- The strip animation lives in the victory card, which VR3 will also touch. VR3
  should be written with this in mind so the two do not collide.
- Silhouettes at ~68px may still be unreadable for the most detailed levels.
  If so, the fallback is to simplify the silhouette for node rendering rather
  than to grow nodes further.

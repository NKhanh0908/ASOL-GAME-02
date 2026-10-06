# Status — updated 2026-10-06 by Claude Code (VR2 verified; VR3a scope corrected)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`, clean at `472b425`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- **VR1 accepted by the reviewer** on 2026-10-06, after the two emblem defects were fixed (`1fe3818`, `015047d`).
- **VR2 executed** by Antigravity: Tasks 1–7 (`66ff115`..`a0f0625`). §3.1 excluded as planned, pending VR3b's victory card slot. The reviewer then rejected the completed-node silhouettes as unreadable; the fit was corrected from a fixed 46x32 box to a per-level diamond fit. `npm test` 89 files / 1078 tests pass, `npm run build` clean.
- **Both VR3 plans written**: `2026-10-06-vr3a-piece-feel.md` (**5** tasks) and `2026-10-06-vr3b-medallion-victory-ritual.md` (6 tasks). VR3b is unblocked now VR2 has landed, but its Tasks 1 and 4 edit files VR2 just rewrote (`TextureFactory.ts`, `TargetBadge.ts`) — read those as they stand first.
- Next step: reviewer plays the VR2 map and reads the VR3a spec, which is still `draft`. Then VR3a executes.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | complete; approved; acceptance passed | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | complete; approved | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0, VR1, VR2 done; VR3a spec `draft` + plan ready; VR3b spec approved + plan ready | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- The victory card is untouched until VR3b runs, so VR2's constellation strip (§3.1) stays unbuilt — the item ranked first in the original assessment.
- Three reviewer stop points are written into the plans, none of them judgeable from a desktop browser: the pick-up dip (VR3a Task 1), the grown victory card overlapping the board (VR3b Task 1), the Eye crossfade alphas 0.55 / 0.35 in daylight (VR3b Task 5).
- VR3a does **not** change the board grid. Reading "the faint lines inside the stele" as the board's ruler grid was wrong; `docs/screenshots/web/m1/Man1-5-ytuong.png` keeps the grid and merges only the target outline.
- VR2's node silhouette is fitted to the diamond per level (budget 36 of 43), not to a fixed box. Before/after for all 22 levels: `docs/screenshots/web/m1/node-silhouette-before-after.png`.
- VR3b's star-lighting audio cue is deferred with VR2 §3.1 — a patch with no caller is dead weight.
- Chapter 4's six levels are the remaining content work and need a plan of their own.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- A map node is a **diamond**, so what fits it is `|x| + |y| <= r`, not an inscribed square or a box. Fitting a figure to a box inside a diamond wastes most of it and cannot adapt to the figure's proportions — that is how completed nodes shipped at 13–17px wide. Fit by scaling until the furthest vertex reaches the budget.

- `variant: 'target'` in `JewelShape.ts` both fills **and** dash-strokes, and `BoardRenderer` calls it once per target placement, so every edge two target pieces share is stroked twice and reads as a seam through the figure. Target pieces can share only *part* of an edge (1-5's sail and hull), so merging the boundary needs edges split at vertices before duplicates cancel — cancelling exact duplicates alone fixes 1-2 and breaks 1-5.
- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, its bottom sits at 1274 of 1280. Growing it needs bottom-anchoring, and `victory_card_frame` / `victory_card_surface` have their sizes hardcoded in `TextureFactory.ts`.
- `PlayScene.ts:241` already calls `setVictoryMode(true)` on the restore path, which hides the tray and golds the frame. The only thing the victory timeline does that it does not is `background().deepen(skyDimExtra)`.
- `shimmer` is already the `overlap-revive` cue in play (`audioCues.ts:64-65`); new "magical" moments need their own patch.
- `PieceView` drives scale **and** shadow from one `lift` scalar (`1 + 0.08 × lift`), so changing the lift easing changes both — pick-up anticipation needs a new easing, not a second animation.
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by `tests/designTokens.test.ts:102`; the live XOR animation uses the `FEEDBACK_TOKENS.overlap*` values.
- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

## Two agents in one tree

This file is overwritten wholesale at end of task, so an edit applied by string replacement against an older copy fails **silently**. That is how the VR3 lines were lost once on 2026-10-06. Re-read this file immediately before writing it, and check afterwards that both sides' facts survived. `CHANGELOG.md` and `DOCS-INDEX.md` are append- and row-shaped, so they merged without loss.

# Status — updated 2026-10-06 by Claude Code (VR2 provisionally accepted; VR3a and VR3b handed to Antigravity)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`, clean at `c28aecd`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- **VR1 accepted** on 2026-10-06, after the two emblem defects were fixed (`1fe3818`, `015047d`).
- **VR2 executed** by Antigravity: Tasks 1–7 (`66ff115`..`a0f0625`). §3.1 excluded as planned, pending VR3b's victory card slot. The reviewer rejected the completed-node silhouettes as unreadable; the fit was corrected from a fixed 46×32 box to a per-level diamond fit (`c28aecd`) and VR2 is now **provisionally accepted** — "tạm nghiệm thu", not final.
- **VR3a and VR3b are handed to Antigravity.** Both plans are written and ready: `2026-10-06-vr3a-piece-feel.md` (5 tasks) and `2026-10-06-vr3b-medallion-victory-ritual.md` (6 tasks). See "Handing VR3 over" below before starting either.
- `npm test` 89 files / 1078 tests pass, `npm run build` clean, GitNexus index refreshed at this commit.

## Handing VR3 over

- **The VR3a spec is still `draft`.** The reviewer has not read it. Its decisions were taken in conversation and recorded, but nothing in it has been signed off, so treat its risk list as live rather than settled.
- **Three stop points need a real device and the reviewer's hands**, not a desktop browser: VR3a Task 1 (the pick-up dip costs ~40 ms of touch response on the game's most repeated action — the one change that could make the game feel worse), VR3b Task 1 (the grown victory card overlaps the bottom 36 px of the board), VR3b Task 5 (the Eye crossfade alphas 0.55 / 0.35 in daylight). Stop and ask; do not tune past them alone.
- **VR3b Tasks 1 and 4 edit `TextureFactory.ts` and `TargetBadge.ts`, which VR2 just rewrote.** Read both as they stand first: VR2 grew the node canvases to 96 px in the first and moved `drawTargetSilhouette` out of the second into `targetSilhouette.ts`.
- VR3a and VR3b touch disjoint files from each other and can run in either order.
- VR2 §3.1 (the constellation strip) and VR3b §3.4 (its audio cue) are still deferred together. VR3b Task 1 builds the 48 px slot the strip will need, so after VR3b the strip becomes a small follow-up rather than a geometry problem.

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
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0, VR1 accepted; VR2 done and provisionally accepted; VR3a and VR3b planned, handed to Antigravity | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
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


- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, its bottom sits at 1274 of 1280. Growing it needs bottom-anchoring, and `victory_card_frame` / `victory_card_surface` have their sizes hardcoded in `TextureFactory.ts`.
- `PlayScene.ts:241` already calls `setVictoryMode(true)` on the restore path, which hides the tray and golds the frame. The only thing the victory timeline does that it does not is `background().deepen(skyDimExtra)`.
- `shimmer` is already the `overlap-revive` cue in play (`audioCues.ts:64-65`); new "magical" moments need their own patch.
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by `tests/designTokens.test.ts:102`; the live XOR animation uses the `FEEDBACK_TOKENS.overlap*` values.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

## Two agents in one tree

This file is overwritten wholesale at end of task, so an edit applied by string replacement against an older copy fails **silently**. That is how the VR3 lines were lost once on 2026-10-06. Re-read this file immediately before writing it, and check afterwards that both sides' facts survived. `CHANGELOG.md` and `DOCS-INDEX.md` are append- and row-shaped, so they merged without loss.

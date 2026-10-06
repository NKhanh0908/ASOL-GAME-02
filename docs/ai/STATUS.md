# Status — updated 2026-10-06 by Claude Code (VR3a accepted by the reviewer; VR3b handed to Antigravity)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- **VR1 accepted** on 2026-10-06. **VR2 provisionally accepted** ("tạm nghiệm thu").
- **VR3a executed by Antigravity and accepted by the reviewer** on 2026-10-06 (`c6cdc0e`..`d21b336`): pick-up anticipation (`anticipateOut`), the magnet ring (`magnetRing`), and one merged target boundary (`unionOutline`) instead of an outline per placement.
- **VR3b is handed to Antigravity** and is the last plan in the VR chain: `2026-10-06-vr3b-medallion-victory-ritual.md`, 6 tasks.
- Independently verified at `d21b336`: `npm test` 89 files / 1094 tests pass, `npm run build` clean, and the merged outline was checked by rendering all 22 approved levels before and after — the seams in 1-2 and 1-5 are gone, and 3-2's partly-shared roof edge correctly keeps the part that is exposed.

## Handing VR3b over

- **Two stop points need a real device and the reviewer's hands**: VR3b Task 1 (the grown victory card overlaps the bottom 36 px of the board), VR3b Task 5 (the Eye crossfade alphas 0.55 / 0.35 in daylight).
- **Task 5 edits `BoardRenderer.drawTargetSilhouette`, which VR3a Task 4 rewrote**, and Tasks 1 and 4 edit `TextureFactory.ts` and `TargetBadge.ts`, which VR2 rewrote. The plan's Concurrency table names what landed in each file; read it before editing.
- The spec's §3.2 was corrected during planning: the restore path already hides the tray through `setVictoryMode`, so only the sky dim is missing. Do not re-derive it from the original text.
- VR2 §3.1 (the constellation strip) and VR3b §3.4 (its audio cue) are deferred together. VR3b Task 1 builds the 48 px slot the strip will need.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | complete; approved; acceptance passed | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | complete; approved | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0, VR1, VR2, VR3a done; VR3b planned | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- The victory card is untouched until VR3b runs, so VR2's constellation strip (§3.1) stays unbuilt.
- Two reviewer stop points in VR3b: victory card overlap (Task 1) and Eye crossfade daylight alphas (Task 5).
- VR2's node silhouette is fitted to diamond per level (budget 36 of 43).
- Chapter 4's six levels are the remaining content work and need a plan of their own.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, bottom sits at 1274 of 1280.
- `PlayScene.ts:241` already calls `setVictoryMode(true)` on restore path.
- `shimmer` is already `overlap-revive` cue in play; new moments need their own patch.
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by tests; live XOR uses `FEEDBACK_TOKENS.overlap*`.
- In `JewelShape.ts`, `strokeDashedPolygon` and `toGeomPoints` accept `readonly Point[]`.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

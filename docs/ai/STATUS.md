# Status — updated 2026-10-06 by Antigravity (VR2 Level Select executed)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- **VR1 accepted by the reviewer** on 2026-10-06, after the two emblem defects were fixed (`1fe3818`, `015047d`).
- **VR2 executed**: `docs/superpowers/plans/2026-10-06-vr2-level-select.md` Tasks 1–7 complete (`66ff115`..`a0f0625`). §3.1 excluded as planned (pending VR3b's victory card slot).
- **VR3a spec written**: `docs/superpowers/specs/2026-10-06-vr3a-piece-feel-design.md`, awaiting reviewer review and device check.
- **VR3b spec approved** by reviewer; plan deferred.
- Next step: reviewer review for VR2 changes & VR3a spec device judgement.

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
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0, VR1, VR2 done; VR3a spec written, awaiting review; VR3b spec approved, plan deferred | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- The victory card is untouched until VR3b runs, so VR2's constellation strip stays unbuilt (§3.1).
- VR3b §7 flags Eye crossfade alphas (0.55 / 0.35) for real-device check in daylight.
- VR2 silhouette box in 96px diamond is 46×32; verified with all 22 approved levels.
- VR3a §7: pick-up anticipation dip costs ~40 ms touch response; device check before acceptance.
- Chapter 4's six levels are the remaining content work and need a separate plan.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, its bottom sits at 1274 of 1280. Growing it needs bottom-anchoring and updating `victory_card_frame` / `victory_card_surface`.
- `showWinModal()` is a second, timeline-free entry point to won state; needs matching screen state.
- `shimmer` is already the `overlap-revive` cue in play (`audioCues.ts:64-65`).
- `PieceView` drives scale and shadow from one `lift` scalar (`1 + 0.08 × lift`).
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by test; live animation uses `FEEDBACK_TOKENS`.
- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

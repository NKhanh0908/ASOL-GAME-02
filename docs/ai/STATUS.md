# Status — updated 2026-10-06 (E4 studio orientation & roundtrip completed)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/studio-e4`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- E4 plan (`docs/superpowers/plans/2026-10-06-e4-studio-orientation-and-roundtrip.md`) executed and verified:
  - Feature A: Studio orientation picker showing real shape previews, grouped by family, with frame-size validation & snapping.
  - Feature B: Studio campaign round-trip writeback (`promoteStudioLevel` overwrite mode with revision bump, status downgrade, comment block preservation, dev plugin endpoint, CLI flag, and library UI button).
- **Next step**: Human reviewer merges `feat/studio-e4` into `main`, or proceeds to CH1H plan execution.

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
| VR visual refactor (VR0 → VR3b) | **all done**; visual-polish pass committed | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| **E4 studio orientation + round-trip** | **done**; implemented on `feat/studio-e4` | `docs/superpowers/plans/2026-10-06-e4-studio-orientation-and-roundtrip.md` |
| **CH1H chapter 1 hard tail (1-7…1-9)** | **plan approved; ready to execute** | `docs/superpowers/plans/2026-10-06-ch1h-chapter-1-hard-tail.md` |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- **Spec language**: `AGENTS.md` says specs are written in English, but every existing spec (B, C, D, E…) is Vietnamese. CH1H and E4 were written in English per the rule. Either translate them or correct the rule — reviewer to decide.
- Remaining content work is now nine levels, not six: chapter 4 (4-1…4-6) plus CH1H (1-7…1-9). Reviewer accepted the later release date on 2026-10-06.
- VR2 §3.1 (constellation strip) is unblocked by the 48 px slot created in VR3b Task 1.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- `LevelDocument` JSON carries `learningObjective`, `victoryVerse`, `difficultyEstimate`, `distractors[].reason` and `ftueSteps`, so a source → JSON → source round trip keeps the prose. What it loses is `kit.ts` helper calls (inlined into literals); header comment blocks are preserved by `preserveHeaderComment`.
- `layoutCampaignMap` uses `TEN_NODE_PATTERN` only for a constellation of exactly ten nodes; every other count falls through to `zigzagX`, so chapter node counts can change without touching the layout.
- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, bottom sits at 1274 of 1280.
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by tests; live XOR uses `FEEDBACK_TOKENS.overlap*`.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

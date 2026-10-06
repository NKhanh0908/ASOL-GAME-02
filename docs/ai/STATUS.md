# Status — updated 2026-10-06 by Claude Code (CH1H + E4 specs)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`. Working directory D:\Working\ASOL\ASOL-GAME-02. Working tree clean.
- The VR chain and the visual-polish pass are committed (`fbbf663`); `npm test` passes (89 files, 1104 tests).
- **Two new specs written, both `draft`, neither implemented. No code changed yet.**
  - **CH1H** — three harder levels appended to chapter 1 (1-7, 1-8, 1-9), difficulty 4, using geometric deduction only because rotation belongs to chapter 4 and XOR to chapter 2. Raises `RELEASE_LEVEL_COUNT` 28 → 31.
  - **E4** — studio: an orientation picker so the apex triangles (orientation 4–7) become selectable, and an `overwrite` mode so a campaign level edited in the studio can be written back over its own source.
- **Next step: write the implementation plans.** CH1H and E4 are independent; either can go first.

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
| **CH1H chapter 1 hard tail (1-7…1-9)** | **spec `draft`; plan not written** | `docs/superpowers/specs/2026-10-06-chapter-1-hard-tail-design.md` |
| **E4 studio orientation + round-trip** | **spec `draft`; plan not written** | `docs/superpowers/specs/2026-10-06-e4-studio-orientation-and-roundtrip-design.md` |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- **Spec language**: `AGENTS.md` says specs are written in English, but every existing spec (B, C, D, E…) is Vietnamese. CH1H and E4 were written in English per the rule. Either translate them or correct the rule — reviewer to decide.
- Remaining content work is now nine levels, not six: chapter 4 (4-1…4-6) plus CH1H (1-7…1-9). Reviewer accepted the later release date on 2026-10-06.
- VR2 §3.1 (constellation strip) is unblocked by the 48 px slot created in VR3b Task 1.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- Triangles have **eight** orientations in two families: 0–3 right-angle corners (`frameSize % 8`), 4–7 apex/"mái" (`frameSize % 16`). `R` in the studio cycles **within** a family by design — rotating a right triangle 90° cannot make it isoceles.
- `LevelDocument` JSON carries `learningObjective`, `victoryVerse`, `difficultyEstimate`, `distractors[].reason` and `ftueSteps`, so a source → JSON → source round trip keeps the prose. What it loses is the file's hand-written comments and the `kit.ts` helper calls.
- `layoutCampaignMap` uses `TEN_NODE_PATTERN` only for a constellation of exactly ten nodes; every other count falls through to `zigzagX`, so chapter node counts can change without touching the layout.
- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, bottom sits at 1274 of 1280.
- `ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by tests; live XOR uses `FEEDBACK_TOKENS.overlap*`.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.

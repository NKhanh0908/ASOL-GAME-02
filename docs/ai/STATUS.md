# Status — updated 2026-10-09 (authored plan for interchangeable piece anchors)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`.
- Completed: Authored implementation plan for Interchangeable Piece Anchors & Equivalence Grouping (IPA). 4 bite-sized TDD tasks covering piece equivalence domain module, anchor occupancy checks in drag & session, PlayScene & BoardRenderer integration, and Level 1-1 permutation e2e tests.
- Verification: Self-reviewed plan against spec coverage, type consistency, and no-placeholder requirements; registered in DOCS-INDEX.md.

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
| GX Galaxy Themes & Spatial Zoom (I–II) | implemented; awaiting visual acceptance | `docs/superpowers/plans/2026-10-08-galaxy-themes-and-spatial-zoom.md` |
| **GX2 Galaxy themes chapters 3–5** | **implemented**; awaiting visual acceptance | `docs/superpowers/plans/2026-10-09-galaxy-themes-chapters-4-6.md` |
| E4 studio orientation + round-trip | **done**; implemented on `feat/studio-e4` | `docs/superpowers/plans/2026-10-06-e4-studio-orientation-and-roundtrip.md` |
| CH1H chapter 1 hard tail (1-7…1-9) | **plan approved; ready to execute** | `docs/superpowers/plans/2026-10-06-ch1h-chapter-1-hard-tail.md` |
| Chapter 4 content (Hội Tụ, rotation levels) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |
| **LOC multi-language localization (5 locales)** | **complete; merged to `main`** | `docs/superpowers/plans/2026-10-09-multi-language-localization.md` |
| **END-1 Chapter 1 endless runtime gate** | **complete; wired to map & play** | `docs/superpowers/specs/2026-10-08-ch1-endless-tangram-generator-design.md` |
| **IPA interchangeable piece anchors** | **plan approved; ready to execute** | `docs/superpowers/plans/2026-10-09-interchangeable-piece-anchors.md` |

## Open decisions / blockers

- **GX2 follow-ups for the reviewer**: (1) rotation levels re-homing; (2) chapter V Menu hero placeholder; (3) chapter 3 ten nodes on ellipse; (4) texture memory check on device.
- **Endless Chapter 2**: Next stream on branch `feat/endless-ch2`.

## Gotchas learned recently

- Vitest on Windows: use `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`.
- Vite build requires filesystem bypass on Windows to resolve realpath for `index.html`.

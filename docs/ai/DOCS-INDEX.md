# Docs Index

Registry of every spec and plan in `docs/superpowers/`. Read the row you need instead of opening the documents.
States: `draft` · `approved` · `in-progress` · `done` · `superseded` · `abandoned`. Update a row whenever a spec or plan is added or changes state.
Paths below are relative to `docs/superpowers/`.

## Active and upcoming (`game-next/`)

| ID | Topic | Spec | Plan(s) | State | Notes |
|----|-------|------|---------|-------|-------|
| R | Rebuild base contract (spec set 01–06) | specs/2026-09-30-mirror-rebuild/README.md | M0, M1 | in-progress | Approved 981dcb3. B will change its 18-level / 3-chapter campaign to 28 / 4 |
| R-M0 | Kernel, validator, session, harness | R 01, 02, 04, 06 | plans/2026-09-30-mirror-rebuild-m0.md | done | Evidence: `docs/testing/mirror-rebuild/m0-evidence.md` |
| R-M1 | Vertical slice, level 1-1 | R 03–06 | plans/2026-09-30-mirror-rebuild-m1.md | done | Merged f629381 |
| GUI1 | GUI improve-v1 re-skin + grid geometry | specs/2026-10-01-gui-improve-v1-design.md | plans/2026-10-01-gui-improve-v1-index.md, gui-improve-v1-1-nen-mong, gui-improve-v1-2-module-dung-chung, gui-improve-v1-3-manh-va-khung, gui-improve-v1-4-cac-man-con-lai | done | Current UI. Mockups: `docs/gui/improve-v1/` |
| CH1 | Chapter 1 levels 1-1…1-6 + authoring tools | specs/2026-10-02-chapter-1-levels-design.md | plans/2026-10-02-chapter-1-levels-index.md, chapter-1-levels-1-nen-mong, chapter-1-levels-2-renderer, chapter-1-levels-3-noi-dung | done | Merged e543843; all six levels `approved` |
| A | Shapes v2 (circle, parallelogram, frames) | specs/2026-10-02-a-shapes-v2-design.md | plans/2026-10-02-a-shapes-v2.md | done | Completed on feat/shapes-v2; dev-shapes-v2 verified in harness |
| B | Level kit, `content:new`, 4 chapters / 28 levels | specs/2026-10-02-b-level-kit-chapters-design.md | plans/2026-10-02-b-level-kit-chapters.md | done | Reviewed and merged into `main` at `dee44e5` |
| C | Chapter 2 + Hoa Pham levels (16) | specs/2026-10-02-c-chapter-2-hoa-pham-levels-design.md | plans/2026-10-02-c-chapter-2-hoa-pham-levels.md | done | All 16 levels approved in campaign order and merged to `main` |
| BF | Board fit measured by piece cells | none — spec C §4 coordinates and plan D decision 3 | plans/2026-10-03-board-fit-by-cells.md | done | Merged to `main` with plan C |
| D | Free placement + XOR solver | specs/2026-10-02-d-free-placement-design.md | plans/2026-10-02-d-free-placement.md | done | Complete; merged to main |
| E | Level studio | specs/2026-10-02-e-level-studio-design.md | plans/2026-10-02-e-level-studio.md (index) | done | E1, E2, E3 approved and merged to `main` |
| E1–E2 | Studio backend & difficulty | spec E §8 | plans/2026-10-02-e1-difficulty.md, e2-studio-backend.md | done | Completed on feat/level-studio-e2; all 573 tests pass |
| E3 | Studio frontend UI & acceptance | spec E §8 | plans/2026-10-02-e3-1-logic.md, e3-2-board-page.md, e3-3-check-acceptance.md | done | Completed on feat/level-studio-e3; acceptance evidence in docs/testing/studio/ |
| F1 | Motion foundation + scene transitions | specs/2026-10-03-f1-scene-transitions-design.md | plans/2026-10-03-f-motion-index.md (read first), f1-1-nen-tang, f1-2-director, f1-3-dan-dung | done | Tasks 1–10 completed and accepted on `feat/motion-f1` |
| F2 | In-level game feel | specs/2026-10-03-f2-in-level-game-feel-design.md | plans/2026-10-03-f2-1-logic, f2-2-renderer, f2-3-phan-hoi | done | Tasks 1–10 completed; Reviewer Stop Point 4 passed on 2026-10-05. Victory sequence intentionally uses 2800 ms |
| F3 | Motion acceptance tools | specs/2026-10-03-f3-motion-acceptance-design.md | plans/2026-10-03-f3-motion-acceptance.md | approved | Deferred by reviewer for later implementation and Android/device acceptance |
| BR | Branding, splash and bilingual i18n | — (no spec; reviewer-authored) | — (no plan) | done | Merged to `main`. Dual jewels icon, Gương Đôi logo, Baloo 2 typography, studio splash, bilingual i18n, and 3D tactile UI polish |
| MD | Mobile display: Tier 0 quick wins + Tier 2 elastic layout | — (scope agreed in chat; too small for a spec) | plans/2026-10-04-mobile-display-quick-wins.md | done | Merged to `main`. Tier 0 and Tier 2 elastic vertical layout, safe-area insets, moving star galaxy, level start banner, and dialog redesign |
| G | Audio: scene music + pitched SFX | specs/2026-10-03-g-audio-design.md | plans/2026-10-03-g-audio-index.md (read first), g0-audio-assets, g1-audio-foundation, g2-audio-cues | approved | Sourcing half superseded by GS — read that row first; the music side is still current. Plans await review (G stop point 1); G1/G2 on `feat/audio` after F2 |
| GS | Audio synthesis engine: SFX generated in TypeScript, no sample files | specs/2026-10-05-audio-synth-engine-design.md | plans/2026-10-05-gs-audio-synth-index.md (read first), gs1-synth-engine (Tasks 1-8), gs2-wiring (Tasks 9-12) | in-progress | Tasks 1-7 done and reviewed on `feat/audio-synth`; **at reviewer stop point 1** — listen in the Audio Lab (`npm run dev`, `/audiolab.html`) before Task 8. Music remains reviewer-sourced and blocks Task 9 only. |
| AI | AI onboarding context | specs/2026-10-03-ai-onboarding-context-design.md | plans/2026-10-03-ai-onboarding-context.md | done | Cold-start test passed 2026-10-03 |

## History (do not build on these)

| ID | Topic | Spec | Plan(s) | State | Notes |
|----|-------|------|---------|-------|-------|
| P0 | Android prototype (`game/`) | specs/2026-09-17-mirror-android-prototype-design.md | plans/2026-09-17-mirror-android-prototype.md | superseded | Replaced by P1, then by R |
| P1 | Large pieces + cosmic UI (`game/`) | specs/2026-09-17-mirror-puzzle-visual-redesign.md | plans/2026-09-17-mirror-puzzle-visual-redesign.md | superseded | Run notes in `.superpowers/sdd/` |
| P2 | Custom level editor (`game/`) | specs/2026-09-18-custom-level-editor-design.md | plans/2026-09-18-custom-level-editor.md | superseded | Done in `game/` only; E is the rebuild successor |
| MVP | 18-level MVP GDD + campaign (`game/`) | specs/2026-09-21-mirror-mvp-gdd.md | plans/2026-09-30-mirror-mvp-campaign.md | superseded | Replaced by `docs/gdd/master-gdd.md` and R |
| GV | Galaxy vector UX redesign | specs/2026-10-01-galaxy-vector-ux-redesign.md | — | superseded | Built 62a75f4, re-skinned by DD then GUI1 |
| DD | Divination Disc UI redesign | specs/2026-10-01-ui-redesign-divination-disc.md | plans/2026-10-01-ui-redesign-divination-disc.md | superseded | Dialogs and `TextureFactory` survive in code |

Checkboxes in done plans were never ticked; use this table and git history, not checkboxes.

## Other doc folders

- `docs/gdd/`: master GDD (`master-gdd.md`) — the game-design baseline for R.
- `docs/concept/`: early idea sheet, idea gate, technical assessment.
- `docs/testing/levels/`: authoring output per level (`<id>.svg`, `<id>-report.md`), `chapter-1-review.md`, chapter 2 drafts.
- `docs/testing/mirror-rebuild/`: M0 evidence and `<id>-content-review.md` approval records.
- `docs/testing/` (top-level files), `docs/testing/mirror-redesign/`: legacy `game/` evidence.
- `docs/gui/improve-v1/`: HTML artboards behind GUI1. `docs/gui/ỉmprove-2/`: PNG mockups for a possible next UI pass, no spec yet.
- `docs/ref/`, `docs/screenshots/`, `mockups/`: reference images and an old Divination Disc preview.
- `.agent/workflow-v2/`: Vietnamese phase-based agent workflow (concept → release).
- `.superpowers/sdd/`: working files from subagent-driven runs (briefs, reports, review diffs).

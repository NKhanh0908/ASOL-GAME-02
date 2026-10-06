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
| G | Audio: scene music + pitched SFX | specs/2026-10-03-g-audio-design.md | plans/2026-10-03-g-audio-index.md (read first), g0-audio-assets, g1-audio-foundation, g2-audio-cues | done | G2 audio cues and dual streaming tracks approved. Acceptance passed in docs/testing/audio/g-acceptance.md on 2026-10-05. |
| GS | Audio synthesis engine: SFX generated in TypeScript, no sample files | specs/2026-10-05-audio-synth-engine-design.md | plans/2026-10-05-gs-audio-synth-index.md (read first), gs1-synth-engine (Tasks 1-8), gs2-wiring (Tasks 9-12) | done | GS1 & GS2 complete; Task 9b complete with real streaming tracks; ready for reviewer acceptance. |
| VR0 | Visual refactor: motion language (4 families over the existing EASES registry) | specs/2026-10-06-vr0-motion-language-design.md | plans/2026-10-06-vr0-motion-language.md | done | Executed 2026-10-06 (`3214856`, `efa83cc`). Families are `ui`/`glass`/`magic`/`piece` in `transitions/motion.ts` — not in `designTokens.ts`, which must stay a leaf module |
| VR1 | Visual refactor: shared foundation (sky, glow ladder, ◆ motif) + Main Menu | specs/2026-10-05-visual-refactor-foundation-menu-design.md | plans/2026-10-06-vr1-foundation-menu.md | done | Executed 2026-10-06, 8 tasks, `3a60983`..`c0c9c1d`. Verified: 88 files / 1063 tests pass, typecheck and build clean. `MenuScene.ts` 941 → 846 lines. Two defects found in review and fixed (`1fe3818`, `015047d`); **accepted by the reviewer on 2026-10-06** |
| VR2 | Visual refactor: Level Select | specs/2026-10-06-visual-refactor-level-select-design.md | plans/2026-10-06-vr2-level-select.md | done | Tasks 1–7 executed 2026-10-06 (`66ff115`..`a0f0625`), node silhouette fit corrected afterwards. 48px card slot built by VR3b unblocks §3.1 strip implementation. 96px nodes, silhouette on completed, dashed frontier node, 2-line label, chapter backing plates, single focus motion |
| VR3a | Visual refactor: piece feel + XOR overlap animation | specs/2026-10-06-vr3a-piece-feel-design.md | plans/2026-10-06-vr3a-piece-feel.md | done | Executed 2026-10-06 (Tasks 1–5), **accepted by the reviewer**; verified independently (1094 tests, build clean, all 22 levels rendered before/after). Anticipation dip on pickup (anticipateOut), magnet ring at anchor (magnetRing), and single unified target silhouette outline (unionOutline). Stop point evaluated and approved by reviewer |
| VR3b | Visual refactor: target medallion + victory ritual | specs/2026-10-06-vr3b-medallion-victory-ritual-design.md | plans/2026-10-06-vr3b-medallion-victory-ritual.md | done | Executed 2026-10-06 (Tasks 1–6). Card bottom-anchored and grown 262 → 310 px with 48 px strip slot; restore path dims sky; trace shortened 600 → 400 ms; medallion scrim (alpha 0.35) with glass motion family; Eye crossfade (piece/parity 0.55, target 0.35). Star-lighting audio cue deferred with VR2 §3.1 |
| AI | AI onboarding context | specs/2026-10-03-ai-onboarding-context-design.md | plans/2026-10-03-ai-onboarding-context.md | done | Cold-start test passed 2026-10-03 |
| CH1H | Chapter 1 hard tail: levels 1-7, 1-8, 1-9 | specs/2026-10-06-chapter-1-hard-tail-design.md | plans/2026-10-06-ch1h-chapter-1-hard-tail.md | approved | Three difficulty-4 levels appended to chapter 1 using geometric deduction only (no overlap, no rotation). Raises `RELEASE_LEVEL_COUNT` 28 → 31 |
| E4 | Studio: triangle orientation picker + campaign round-trip | specs/2026-10-06-e4-studio-orientation-and-roundtrip-design.md | plans/2026-10-06-e4-studio-orientation-and-roundtrip.md | done | Roof triangles (orientation 4–7) exist in `shapes.ts` but no studio control reaches them. Adds a palette/inspector orientation picker and an `overwrite` mode for `promoteStudioLevel` that preserves the source's block comment |
| FX | Play and map fixes + icon restyle (6 reported items) | specs/2026-10-06-fx-play-and-map-fixes-design.md | plans/2026-10-06-fx-play-and-map-fixes.md | approved | FX-1 piece hitbox is the whole frame; FX-2 verified non-issue, pin with a test; FX-3 remove the magnet ring; FX-4 match bar overruns the bottom row; FX-5 restyle the generated icons; FX-6 completed-node checkmark shows under the silhouette |

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

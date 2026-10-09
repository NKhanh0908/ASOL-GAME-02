# Status — updated 2026-10-09 (GX map nodes, gate, hero and chapter fog)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/journey-map-visuals`. Working directory D:\Working\ASOL\ASOL-GAME-02.
- Reworked GX Chapters I–II against the supplied HTML references: extracted galaxy art, two drifting cloud layers, slow spiral rotation, responsive menu, continuous map sky, spiral chapter-II path, and bidirectional spatial transitions.
- Fixed manifest-based chapter progress/theme selection, actual chapter-tail gates, drag-versus-tap handling, and responsive camera zoom. Preserved the campaign's Chapter III name (Hoa Pham).
- Chapter I retains the blue galaxy with moving white stars; corrected SVG mask/filter clipping. Browser motion/reduced-motion checks and cloud edge regression checks passed.
- Map nodes/gate/chapter I hero now match GalaxyKit/Menu1; the map is fogged beyond a one-chapter preview of the frontier; the menu chrome (pill, settings, badge, fact box, buttons) matches Menu1/Menu2, with an unlock animation (`mapReveal.ts`, `LevelSelectScene.ts`).
- **Next step**: Reviewer visual acceptance (play through a chapter end to see the unlock). Changes remain uncommitted on the current branch; no push or merge.

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
| **GX Galaxy Themes & Spatial Zoom** | implementation corrected; awaiting visual acceptance | `docs/superpowers/plans/2026-10-08-galaxy-themes-and-spatial-zoom.md` |
| **E4 studio orientation + round-trip** | **done**; implemented on `feat/studio-e4` | `docs/superpowers/plans/2026-10-06-e4-studio-orientation-and-roundtrip.md` |
| **CH1H chapter 1 hard tail (1-7…1-9)** | **plan approved; ready to execute** | `docs/superpowers/plans/2026-10-06-ch1h-chapter-1-hard-tail.md` |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- **Spec language**: `AGENTS.md` says specs are written in English, but every existing spec (B, C, D, E…) is Vietnamese. CH1H and E4 were written in English per the rule. Either translate them or correct the rule — reviewer to decide.
- Remaining content work is now nine levels, not six: chapter 4 (4-1…4-6) plus CH1H (1-7…1-9). Reviewer accepted the later release date on 2026-10-06.
- VR2 §3.1 (constellation strip) is unblocked by the 48 px slot created in VR3b Task 1.
- F3: approved, not started; Android/device checks during later execution.

## Gotchas learned recently

- Visual QA: `.shots/galaxy/`; reproduce with `game-next/scripts/check-galaxy-ui.mjs` using `PLAYWRIGHT_MODULE` and optional `CHROMIUM_EXECUTABLE`. The browser profile is isolated from user progress.
- User-provided `docs/ref/*.png` and `docs/screenshots/web/m3/` remain untouched.
- Full default-parallel Vitest exhausted memory; `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks` passed all 1,144 tests; production build passed.
- Windows sandbox Vitest: tinypool child processes may exit unexpectedly on parallel shutdown unless run per-file or `--pool=forks`.
- Windows sandbox Vite build: requires filesystem bypass on Windows to resolve realpath for `index.html` modules.

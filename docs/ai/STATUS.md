# Status — updated 2026-10-05 by Codex

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/audio-synth` (from `main`, merged up to `f964e13`). Worktree: `D:\Working\ASOL\ASOL-GAME-02-audio`, `npm ci` done, baseline 68 files / 829 tests green.
- Product state: F1 and F2 are complete and merged to `main`; Reviewer Stop Point 4 passed. The victory sequence intentionally lasts 2800 ms. F3 is approved but deferred.
- Current work: GS Task 1 DSP primitives implemented and reviewed (22 new tests; 69 files / 851 tests pass). Next: Task 2 patch model and validator. Stop after Task 7 for reviewer listening approval before Task 8.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete, accepted and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | in progress; Task 1 implemented and reviewed; Task 2 next | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | sourcing half superseded by GS; G2 cue plan still used unedited after GS Task 12 | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- F3: approved, not started; the reviewer performs its Android/device checks during later execution.
- GS: the reviewer tunes the eight effects in the Audio Lab at stop point 1 (after Task 7), and must supply the two music tracks plus their key before Task 9 can commit green — the manifest's `source` rows are deliberately blank until then. Tasks 9 and 11 do not depend on each other, so Task 11 can run first if the music is late.
- GitNexus MCP is unavailable in this session; record that limitation in task verification entries.

## Gotchas learned recently

- A constant used by modules that a barrel file imports must live in its own leaf module. `MUSIC_ROOT_HZ` is in `src/content/audio/root.ts`, not `index.ts`: patches read it while evaluating, so a cycle through the barrel would throw `ReferenceError` from the temporal dead zone.
- `vite.config.ts` lists only `index.html` under `build.rollupOptions.input`, so an extra root `*.html` page (`studio.html`, and the planned `audiolab.html`) is served by `npm run dev` and ships nothing.
- `BackgroundScene` uses `{ active: true }` and `applyDesignViewport(this)` so the persistent star backdrop stays at the bottom and scales to screen buffer correctly.
- All scene transitions must route through `SceneDirector` (`director.go`, `director.boot`); direct `scene.start(` is blocked by `tests/sceneStartGate.test.ts`.
- `BoardRenderer` stele is divided into base, grid, and top centered at `(360, 600)` with cardinal runes drawn on top of the grid and beneath the glass frame so they remain visible.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).
- Desktop web viewport is constrained to 9:16 portrait aspect ratio (max-width = 100vh * 720 / 1280) so design height remains ~1280 instead of squashing to 405 on wide screens.

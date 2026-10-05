# Status — updated 2026-10-05 by Claude (GS1 final-review fixes)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/audio-synth` (from `main`, merged up to `f964e13`). It no longer has its own worktree; check it out in the main checkout (or any fresh worktree) to continue.
- Product state: F1 and F2 complete and merged to `main`. GS1 (Tasks 1-8) is complete and reviewed: the synth engine, Mirror's eight sound-effect patches, `npm run audio:author`, the Audio Lab, and the engine README and presets.
- GS stop point 1 is cleared: the reviewer listened, the eight sounds were retuned by ear and approved, and the final whole-branch review passed. The branch is merge-ready.
- Next step: GS2, wiring the engine into the game (`docs/superpowers/plans/2026-10-05-gs2-wiring.md`, Tasks 9-12), then G2 unedited. Task 9 is split because the reviewer has not supplied the two music tracks yet; Task 11 can run first.
- Verified after the final-review fixes: typecheck clean, 77 files / 926 tests, `npm run build` clean with no Audio Lab in `dist/`, `content:validate` 22 levels pass.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete, accepted and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | GS1 (Tasks 1–8) complete and reviewed; GS2 (Tasks 9–12) next, Task 9 waits on music | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | sourcing half superseded by GS; G2 cue plan still used unedited after GS Task 12 | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- Retuning a sound later: tune in the Audio Lab (`npm run dev`, `/audiolab.html`), press Copy as TypeScript, paste the patch body into `src/content/audio/sources/<key>.ts`, then re-run `npm run audio:author -- --all`.
- GS Task 9 cannot commit green until the reviewer supplies the two music tracks and states their key — `MUSIC_ASSETS`'s `source` rows are deliberately blank and the manifest test asserts they are filled. Tasks 9 and 11 are independent, so Task 11 can run first if the music is late.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.
- The final whole-branch review has triaged the deferred GS1 findings; the survivors were fixed in the final-fix commit. Notes: `.superpowers/sdd/2026-10-05-gs1-synth-engine/`.

## Gotchas learned recently

- GitNexus `detect_changes` is useless from a git worktree: the index lives at the main checkout, so it reports 0 changed symbols for every commit regardless of content. Re-index from the main checkout after merging a worktree branch.
- A constant used by modules that a barrel file imports must live in its own leaf module. `MUSIC_ROOT_HZ` is in `src/content/audio/root.ts`, not `index.ts`: patches read it while evaluating, so a cycle through the barrel would throw `ReferenceError` from the temporal dead zone.
- `vite.config.ts` lists only `index.html` under `build.rollupOptions.input`, so an extra root `*.html` page (`studio.html`, `audiolab.html`) is served by `npm run dev` and ships nothing. Verified: `grep -rl audiolab dist/` finds nothing after a build.
- Synth renders are deterministic end to end — re-running `npm run audio:author -- --all` leaves `git status` empty, so committed listening copies are byte-identical to a fresh run.
- `BackgroundScene` uses `{ active: true }` and `applyDesignViewport(this)` so the persistent star backdrop stays at the bottom and scales to screen buffer correctly.
- All scene transitions must route through `SceneDirector` (`director.go`, `director.boot`); direct `scene.start(` is blocked by `tests/sceneStartGate.test.ts`.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).
- Desktop web viewport is constrained to 9:16 portrait (max-width = 100vh * 720 / 1280) so design height stays ~1280 instead of squashing on wide screens.

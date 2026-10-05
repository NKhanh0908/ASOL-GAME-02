# Status — updated 2026-10-05 by Claude

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/menu-astronomy-taglines` (from `main` at `f964e13`), a one-off copy change: the menu subtitle now rotates through 20 astronomy facts per locale and the version footer reads "Nơi các vì sao hội tụ".
- Product state: F1 and F2 are complete; Reviewer Stop Point 4 passed on 2026-10-05. The victory sequence intentionally lasts 2800 ms.
- Next step: the reviewer merges `feat/menu-astronomy-taglines`, then integrates `feat/motion-f2`. F3 remains approved but is deferred for later implementation and device acceptance by the reviewer.
- The GS audio stream runs in parallel on `feat/audio-synth` (worktree `D:\Working\ASOL\ASOL-GAME-02-audio`); that branch carries its own STATUS, which is ahead of this one.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete and accepted; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- F3: approved, not started; the reviewer will perform its Android/device checks during later execution.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). F2 no longer blocks G1/G2.

## Gotchas learned recently

- `BackgroundScene` uses `{ active: true }` and `applyDesignViewport(this)` so the persistent star backdrop stays at the bottom and scales to screen buffer correctly.
- All scene transitions must route through `SceneDirector` (`director.go`, `director.boot`); direct `scene.start(` is blocked by `tests/sceneStartGate.test.ts`.
- `BoardRenderer` stele is divided into base, grid, and top centered at `(360, 600)` with cardinal runes drawn on top of the grid and beneath the glass frame so they remain visible.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).
- Desktop web viewport is constrained to 9:16 portrait aspect ratio (max-width = 100vh * 720 / 1280) so design height remains ~1280 instead of squashing to 405 on wide screens.

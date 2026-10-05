# Status — updated 2026-10-05 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/motion-f1` (branched from `main`).
- Product state: F1 (Tasks 1–10: Foundation, SceneDirector, and Choreography for Menu, Map, Play) completely finished on `feat/motion-f1`.
- Next step: **Reviewer Stop Point 2** (NKhanh0908 review on dev server). Once approved, create `feat/motion-f2` from `feat/motion-f1` for F2 (In-level game feel).

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | in progress; F1 complete on `feat/motion-f1`, awaiting review point 2 | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- F1: Completed all 10 tasks. Ready for Reviewer Stop Point 2 visual inspection on dev server.
- F2: Plans list 7 spec departures to review; waiting for Stop Point 2 sign-off.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 can start now; G1/G2 wait for F2.

## Gotchas learned recently

- `BackgroundScene` uses `{ active: true }` and `applyDesignViewport(this)` so the persistent star backdrop stays at the bottom and scales to screen buffer correctly.
- All scene transitions must route through `SceneDirector` (`director.go`, `director.boot`); direct `scene.start(` is blocked by `tests/sceneStartGate.test.ts`.
- `BoardRenderer` stele is divided into base, grid, and top centered at `(360, 600)` with cardinal runes drawn on top of the grid and beneath the glass frame so they remain visible.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).

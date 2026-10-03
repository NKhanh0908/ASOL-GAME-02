# Status — updated 2026-10-03 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/shapes-v2` (Plan A complete, awaiting reviewer merge to `main`).
- Product state: `game-next/` with chapter 1 (1-1…1-6) approved; shapes v2 (circle, parallelogram, frame rules, `dev-shapes-v2`) implemented.
- Next step: Review and merge `feat/shapes-v2` into `main`, then start Plan B (`2026-10-02-b-level-kit-chapters.md`).

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → D → E | A done (`feat/shapes-v2`), B ready, C/D/E pending | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | blocked | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |

## Open decisions / blockers

- A: Review two out-of-spec decisions (two-tier frame check: `isStructuralFrame` vs `isValidFrame`; 1.5% tolerance for circle intersection area).
- C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.

## Gotchas learned recently

- `dev-shapes-v2` is only loadable in harness mode under dev; Vite tree-shakes it out of production build (0 occurrences in `dist/assets/`).
- Chrome headless screenshot on Windows requires absolute output path.
- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until 18 levels are approved.

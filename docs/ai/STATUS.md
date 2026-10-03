# Status — updated 2026-10-03 by Sunny

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main` (Plan A reviewed and merged, commit `55da659`; local only, not yet pushed).
- Product state: `game-next/` with chapter 1 (1-1…1-6) approved; shapes v2 (circle, parallelogram, frame rules, `dev-shapes-v2`) on `main`.
- Next step: Push `main`, then start Plan B (`2026-10-02-b-level-kit-chapters.md`) on a branch off `main`.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → D → E | A merged to `main`, B ready, C/D/E pending | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | blocked | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |

## Open decisions / blockers

- A: closed — both out-of-spec decisions approved at review (two-tier frame check `isStructuralFrame`/`isValidFrame`; 1.5% tolerance for circle intersection area).
- C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.

## Gotchas learned recently

- `dev-shapes-v2` is only loadable in harness mode under dev; Vite tree-shakes it out of production build (0 occurrences in `dist/assets/`).
- Chrome headless screenshot on Windows requires absolute output path.
- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until 18 levels are approved.
- `isValidFrame` allows only 48 and 96 for parallelograms (multiple of 48, ≤ 128) — a constraint for Plan B level design.
- Working from WSL: `node_modules/` is a Windows install (`@rollup/rollup-win32-*` only) and every tracked file reads as modified (CRLF). Run git with `-c core.autocrlf=input`; add the linux rollup/esbuild binaries with `--no-save` to run `npm test`.

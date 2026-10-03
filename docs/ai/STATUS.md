# Status — updated 2026-10-03 by Sunny

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/chapter-2-hoa-pham` (branched from reviewed Plan B on `main`).
- Product state: level kit and `content:new`; KIT-03 decoy filtering; 28-level / 4-chapter manifest; four-constellation map; 15-image authoring guide; six chapter-1 levels remain approved.
- Next step: execute plan C (`2026-10-02-c-chapter-2-hoa-pham-levels.md`) through the 16 validated levels, then stop at the per-level reviewer gate.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | A and B merged to `main`; C in progress; D/E pending | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | in progress | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |

## Open decisions / blockers

- A: closed — both out-of-spec decisions approved at review (two-tier frame check `isStructuralFrame`/`isValidFrame`; 1.5% tolerance for circle intersection area).
- B: closed — `chapter-rotation-required`, rotate button only in chapter 4, and protected sample-solution anchors in KIT-03 all approved at review. Plan C confirms the `2-5` rename to Đồng Hồ Cát.
- C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.

## Gotchas learned recently

- `dev-shapes-v2` is only loadable in harness mode under dev; Vite tree-shakes it out of production build (0 occurrences in `dist/assets/`).
- Chrome headless screenshot on Windows requires absolute output path.
- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until all 28 levels are approved (currently 6).
- `newLevel.test.ts` uses a fixed one-level index fixture; copying the live registry breaks tests while acceptance levels 3-11/3-12 are temporarily registered.
- `isValidFrame` allows only 48 and 96 for parallelograms (multiple of 48, ≤ 128) — a constraint for level design.
- `Hud` reads the rotate-button rule from the chapter (`chapters.ts`), not from the level's own `rotationEnabled`; plans D/E need the level flag instead if a rotating level ever lives outside chapter 4.
- Working from WSL: `node_modules/` is a Windows install (`@rollup/rollup-win32-*` only) and every tracked file reads as modified (CRLF). Run git with `-c core.autocrlf=input`; add the linux rollup/esbuild binaries with `--no-save` to run `npm test`.

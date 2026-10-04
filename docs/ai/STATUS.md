# Status — updated 2026-10-04 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/free-placement`.
- Product state: Plan D complete (free placement mode, XOR meet-in-the-middle unique solution solver, harness fixture); 489/489 tests pass; ready for review.
- Next step: Review Plan D, merge `feat/free-placement` into `main`, then proceed to Plan E or F.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | A, B, C and D complete (D on `feat/free-placement` ready for review); E pending | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- A: closed — both out-of-spec decisions approved at review (two-tier frame check `isStructuralFrame`/`isValidFrame`; 1.5% tolerance for circle intersection area).
- B: closed — `chapter-rotation-required`, rotate button only in chapter 4, and protected sample-solution anchors in KIT-03 all approved at review. Plan C confirms the `2-5` rename to Đồng Hồ Cát.
- C: closed — the `3-5` and `3-6` frame overhang is unblocked by the cell-based fit in `fix/board-fit-by-cells`.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 (shortlist, reviewer listens and picks) can start now; G1/G2 wait for F2. Spec G is Vietnamese while AGENTS.md asks for English specs — translate if the reviewer wants.

## Gotchas learned recently

- `dev-shapes-v2` is only loadable in harness mode under dev; Vite tree-shakes it out of production build (0 occurrences in `dist/assets/`).
- Chrome headless screenshot on Windows requires absolute output path.
- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).
- `newLevel.test.ts` uses a fixed one-level index fixture; copying the live registry breaks tests while acceptance levels 3-11/3-12 are temporarily registered.
- `isValidFrame` allows only 48 and 96 for parallelograms (multiple of 48, ≤ 128) — a constraint for level design.
- `Hud` reads the rotate-button rule from the chapter (`chapters.ts`), not from the level's own `rotationEnabled`; plans D/E need the level flag instead if a rotating level ever lives outside chapter 4.
- Working from WSL: `node_modules/` is a Windows install (`@rollup/rollup-win32-*` only) and every tracked file reads as modified (CRLF). Run git with `-c core.autocrlf=input`; add the linux rollup/esbuild binaries with `--no-save` to run `npm test`.

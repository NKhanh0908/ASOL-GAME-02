# Status — updated 2026-10-04 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/level-studio-e3`.
- Product state: Plan E (Level Studio) E1 and E2 officially approved by reviewer (Stop Point 2 passed). Phase E3 (Studio UI, Web Worker solver, Inspector, acceptance evidence) complete with 603/603 tests passing; Vite build clean. Reached Stop Point 4.
- Next step: Reviewer (NKhanh0908) verification of E3 acceptance cycle (Spec E §7) in `docs/testing/studio/acceptance.md`, transition to `passed`, then merge.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | A, B, C, D complete; E complete on `feat/level-studio-e3` | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- E: Reached Stop Point 4 (review checkpoint). Reviewer to test acceptance scenario in `docs/testing/studio/acceptance.md`.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 can start now; G1/G2 wait for F2.

## Gotchas learned recently

- Browser modules cannot import node-dependent modules (e.g. `promote.ts` importing `node:fs`); pure functions like `sourceFromDocument` must live in separate browser-safe files (`src/content/sourceFromDocument.ts`).
- `catalog.ts` loads studio levels only in harness mode when DEV; campaign mode strictly rejects studio levels.
- `content:promote` validates single-solution in memory before touching manifest, catalog, or writing campaign files.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).
- Working from WSL: run git with `-c core.autocrlf=input`.

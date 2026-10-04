# Status — updated 2026-10-04 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`.
- Product state: Plan E (Level Studio) complete, approved, and merged to `main` (E1 difficulty scoring, E2 backend infrastructure, E3 Studio UI & acceptance); 605/605 tests pass; Vite build clean.
- Next step: Plan F (Motion F1/F2/F3) or Plan G (Audio G0/G1/G2) per roadmap priority.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- E: All 4 stop points passed. Ready for merge to main.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 can start now; G1/G2 wait for F2.

## Gotchas learned recently

- `rotationEnabled` is strictly tied to `chapter === 4`; studioReducer synchronizes them automatically to avoid `chapter-rotation-disabled`.
- Campaign levels are read-only references in Studio; saving them automatically guides user to clone into a new studio ID.
- Browser modules cannot import node-dependent modules (`promote.ts` importing `node:fs`); pure functions like `sourceFromDocument` live in `src/content/sourceFromDocument.ts`.
- `catalog.ts` loads studio levels only in harness mode when DEV; campaign mode strictly rejects studio levels.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).

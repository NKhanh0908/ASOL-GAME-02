# Status — updated 2026-10-03 by Claude Code

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `docs/level-system-specs` (docs only, not merged into `main`; every `feat/*` branch is merged).
- Product state: `game-next/` with chapter 1 (levels 1-1…1-6) approved; 6 of 18 manifest levels approved.
- Next step: F motion — stop point 1 in `docs/superpowers/plans/2026-10-03-f-motion-index.md`, then create `feat/motion-f1` and run task 1 of `docs/superpowers/plans/2026-10-03-f1-1-nen-tang.md`.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| Level system A → B → D → E | specs approved, plans written (E1–E3 skeletons), not started | `docs/ai/DOCS-INDEX.md` rows A–E |
| C chapter 2 + Hoa Pham | blocked | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |

## Open decisions / blockers

- C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.

## Gotchas learned recently

- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until 18 levels are approved.
- GitNexus MCP can fail to connect; the CLI works: `node .gitnexus/run.cjs analyze` and `node .gitnexus/run.cjs impact` (used on 2026-10-03).

# AGENTS.md — Mirror (ASOL-GAME-02)

Shared instructions for every coding agent (Claude Code, Codex, Antigravity). Read this file first, then follow the start-of-task protocol.

## Project

Mirror is a drag-and-drop puzzle game for Android (portrait) and web. Players place shapes on a grid; overlapping cells follow a parity (XOR) rule — even overlaps vanish, odd ones show — and the result must match a target silhouette. Stack: Phaser 3.90, TypeScript 5.7, Vite 6, Vitest 2, Capacitor 8 Android. No server, no accounts; progress is saved in localStorage.

## Where to work

- `game-next/` — the product (rebuild started 2026-09-30). All feature work happens here.
- `game/` — legacy prototype. Do not edit; read only for history.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — design specs and implementation plans.
- `docs/ai/` — agent context: status, docs registry, architecture map.

## Start of task

1. Read `docs/ai/STATUS.md` (current branch, next step, open decisions). Check it against `git branch --show-current` and `git log --oneline -5`; if a human merged or switched branches since, correct STATUS first.
2. Find the relevant row in `docs/ai/DOCS-INDEX.md`; open only the spec/plan that row points to.
3. Before touching code, read the relevant sections of `docs/ai/ARCHITECTURE.md` (check its Hotspots table).
4. Read only the 3–5 newest entries of `CHANGELOG.md`; it is long.
5. Do not re-read every spec or plan. If these files disagree with the code, trust the code and fix the file.

## End of task

A task is one user request or one plan task. In subagent-driven runs only the controller (main session) updates STATUS.md and DOCS-INDEX.md; implementer subagents only add their CHANGELOG entry.

Before the final commit of a task:

1. Overwrite `docs/ai/STATUS.md`: update "Now", the streams table, open decisions, gotchas; keep it ≤ 60 lines and bump the date line.
2. Add a `CHANGELOG.md` entry under `## Unreleased` (newest first): `### YYYY-MM-DD - Title`, what changed with file paths, and a `Verification:` bullet.
3. If a spec or plan was added or changed state, update its row in `docs/ai/DOCS-INDEX.md`.
4. If you learned something stable about the code (an invariant, a trap), add it to `docs/ai/ARCHITECTURE.md` and drop it from STATUS gotchas.

## Commands

Run from `game-next/` (Node `>=24.13.1 <25`):

| Command | Purpose |
|---------|---------|
| `npm ci` | Install dependencies |
| `npm run dev` | Vite dev server (`?scene=play&level=1-3&mode=harness` to open a level) |
| `npm test` | Vitest, all tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Typecheck + web bundle in `dist/` |
| `npm run content:author -- <id...>` / `--all` | Generate level JSON, SVG preview and report from `src/content/sources/<id>.ts` |
| `npm run content:validate` | Validate all manifest levels (`-- --release` needs 18 approved) |
| `npm run android:sync` | Build and sync to the Capacitor Android project |
| `cmd /c gradlew.bat assembleDebug` (in `game-next/android/`) | Debug APK |

Before pushing: `npm test`, `npm run build`, then `git diff --check` and `git status` from the repo root.

## Rules

- Language: specs, plans, `docs/ai/*`, CHANGELOG entries, commit messages and code comments in English. `README.md` is Vietnamese for humans. Do not translate existing Vietnamese docs unless asked.
- New specs: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`; new plans: `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`. Large plans are split into phase files plus an index file.
- Every commit that changes code, docs, config or levels includes its `CHANGELOG.md` entry.
- Commit messages: `type(scope): summary` (`feat`, `fix`, `docs`, `chore`, `test`, `refactor`).
- Never commit `node_modules/`, `dist/`, Android build output, `android/local.properties` or `.shots/`.
- Levels: never hand-edit `src/content/levels/<id>.json`; change the source and re-run `content:author`. A level becomes `approved` only after the reviewer plays it (flow in `docs/ai/ARCHITECTURE.md` → Level content pipeline).
- Do not rewrite pushed history. Branch from the branch the plan names; the reviewer (NKhanh0908) merges.
- Plans with reviewer stop points: stop there and wait; do not continue on your own.

## Code intelligence

GitNexus indexes this repo as `ASOL-GAME-02`; the rules below the marker are generated and mandatory. If the MCP server is unavailable, say so in the CHANGELOG verification bullet instead of skipping silently. `gitnexus analyze` rewrites the stats line inside the markers in AGENTS.md and CLAUDE.md; commit that change together with your next task's commit, it needs no CHANGELOG entry of its own.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ASOL-GAME-02** (3939 symbols, 9564 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ASOL-GAME-02/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ASOL-GAME-02/clusters` | All functional areas |
| `gitnexus://repo/ASOL-GAME-02/processes` | All execution flows |
| `gitnexus://repo/ASOL-GAME-02/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# AI Onboarding Context — Design

Date: 2026-10-03
Status: design approved in discussion by NKhanh0908; written spec awaiting review

## 1. Problem

A new AI session (Claude Code, Codex, Antigravity) cannot quickly learn what this repository is, where active work happens, or what to do next without re-reading large amounts of material:

- `README.md` describes the legacy `game/` prototype (six levels, Node 22); active work lives in `game-next/` (rebuild, Node 24, layered architecture), which the README does not mention.
- `CLAUDE.md` and `AGENTS.md` contain only the auto-generated GitNexus block and are not committed.
- Context is scattered and large: `CHANGELOG.md` (~41 KB), 17 specs and 34 plans in `docs/superpowers/`, plus `.agent/workflow-v2/` and `.superpowers/sdd/`. Nothing states which stream is active, which specs are approved or which plans are done.
- Mandatory conventions (CHANGELOG entry per commit, test/build before push, level review flow, phase-split plan naming) are buried in the README or in changelog entries.

## 2. Goal and success criteria

A fresh agent that reads only `AGENTS.md` and the files it points to can answer, without opening any spec or plan:

1. What is the next task?
2. Where do I edit level 1-3?
3. What is the state of spec E (level studio)?
4. How do I run the tests?
5. Which files are high risk to change?

## 3. Decisions

| Decision | Choice |
|----------|--------|
| Tools to support | Claude Code, Codex, Antigravity |
| Canonical entry point | `AGENTS.md`; other tools point to it |
| Who keeps status fresh | The agent, by a rule in `AGENTS.md`, at the end of every task |
| Legacy `game/` | Frozen reference; documented as "do not edit" |
| Language | English for AI-facing docs; **all new specs and plans in English**; `README.md` stays Vietnamese for humans; existing docs are not translated |
| Structure | Layered: one small entry file plus satellite files (approach 1) |

Rejected: a single large `AGENTS.md` (grows, costs tokens every session, mixes volatile status with stable rules); a script that generates the docs index from front-matter (needs front-matter on 51 existing files; not needed yet).

## 4. File layout

```text
AGENTS.md              canonical entry (Codex and Antigravity read it directly)
CLAUDE.md              "@AGENTS.md" + GitNexus block
.agent/rules/agents.md short Antigravity rule: "read AGENTS.md first"
docs/ai/
  STATUS.md            current state, overwritten each task
  ARCHITECTURE.md      map of game-next, changes rarely
  DOCS-INDEX.md        registry of specs and plans with state
```

## 5. `AGENTS.md`

English, at most ~120 lines, stable content only:

1. **Project in one paragraph**: Mirror, an XOR-silhouette drag-and-drop puzzle; Phaser, TypeScript, Vite, Capacitor Android.
2. **Where to work**: `game-next/` is the product; `game/` is legacy, do not edit.
3. **Start-of-task protocol**: read `docs/ai/STATUS.md` → the relevant row of `docs/ai/DOCS-INDEX.md` → `docs/ai/ARCHITECTURE.md` when touching code; read only the 3–5 newest `CHANGELOG.md` entries.
4. **End-of-task protocol**: overwrite `STATUS.md`; add a `CHANGELOG.md` entry; update `DOCS-INDEX.md` when a spec or plan is added or changes state.
5. **Commands**: `npm test`, `npm run typecheck`, `npm run build`, `content:validate`, `content:author`, Android sync and APK build (all from `game-next/`).
6. **Rules**: specs, plans and AI docs in English; commit messages `type(scope): summary` in English; CHANGELOG entry in the same commit; never commit `node_modules`, `dist`, Android build output or `local.properties`; level review flow; do not rewrite pushed history.
7. **GitNexus block**: kept between its `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->` markers, because `gitnexus analyze` rewrites that region. Hand-written content stays outside the markers.

`CLAUDE.md` holds `@AGENTS.md` plus the GitNexus block. Claude therefore sees the GitNexus block twice (~700 tokens); this is accepted because `analyze` would re-insert a removed block.

## 6. `docs/ai/STATUS.md`

At most ~60 lines; overwritten, never appended (history belongs in `CHANGELOG.md`). Sections:

- **Header**: `# Status — updated YYYY-MM-DD by <agent>`
- **Now**: current branch, active stream, the single next step with a link to the plan task.
- **Streams**: table `Stream | State | Entry doc`; a finished stream shrinks to one row.
- **Open decisions / blockers**.
- **Gotchas learned recently**: a gotcha that proves stable moves to `ARCHITECTURE.md`.

## 7. `docs/ai/DOCS-INDEX.md`

One table, one row per spec/plan set:

`ID | Topic | Spec | Plan(s) | State | Notes`

- State vocabulary is fixed: `draft`, `approved`, `in-progress`, `done`, `superseded`, `abandoned`.
- First fill: skim all specs and plans plus `CHANGELOG.md` and `git log` to assign states. Uncertain rows get `?` and are confirmed with the user before the index is committed as final.
- A short "Other doc folders" list gives one line each for `docs/gdd`, `docs/concept`, `docs/testing`, `docs/gui`, `.agent/workflow-v2`, `.superpowers/sdd`.

## 8. `docs/ai/ARCHITECTURE.md`

About 150 lines, `game-next/` only, built from the actual code and GitNexus (`query`, `context`, `impact`), not from old READMEs:

1. **Layers and dependency rule**: `domain` (pure, no Phaser) ← `application` ← `presentation` (Phaser scenes, renderers); `infrastructure` (persistence, lifecycle); `content` (level sources → JSON → validation). One or two lines per folder plus key files.
2. **Main flow**: boot (`main.ts`, `launchParams.ts`) → scene flow (menu → map → play) → drag → snap → XOR mask → win check → progress save.
3. **Level content pipeline**: `src/content/sources/<id>.ts` → `content:author` → `src/content/levels/<id>.json` + SVG preview + report in `docs/testing/levels/` → `content:validate` → review.
4. **Hotspots**: symbols with HIGH/CRITICAL GitNexus risk (measured, e.g. `BoardRenderer`), `localStorage` keys, invariants (grid size, parity rule).
5. **Tests**: location, how to run, fixture runner.

## 9. Other changes

- `README.md` rewritten in Vietnamese for humans: points to `game-next/` with its run commands, marks `game/` as legacy, links to `AGENTS.md`.
- Commit `AGENTS.md`, `CLAUDE.md` and `.claude/skills/gitnexus/`.
- Add `.shots/` (local Chrome profile) to `.gitignore`.
- Add a `CHANGELOG.md` entry.

## 10. Verification

- **Cold-start test**: a fresh subagent given only "read `AGENTS.md` and follow it" answers the five questions in section 2. Pass = all five correct without opening a spec or plan.
- **Link check**: every path referenced in the new files exists.
- **Size check**: `AGENTS.md` ≤ ~120 lines, `STATUS.md` ≤ ~60 lines.
- `detect_changes` before commit; no runtime code changes expected.

## 11. Out of scope

- Translating existing Vietnamese docs.
- Removing or archiving `game/`.
- Generating the docs index by script.
- Restructuring `CHANGELOG.md`.

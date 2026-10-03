# AI Onboarding Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Claude Code, Codex and Antigravity one shared entry point (`AGENTS.md`) plus three satellite files under `docs/ai/` so a fresh session knows the project, the current work and the rules without re-reading specs and plans.

**Architecture:** Documentation only, no runtime code. `AGENTS.md` holds stable rules and protocols; `docs/ai/STATUS.md` holds volatile state and is overwritten each task; `docs/ai/DOCS-INDEX.md` registers every spec/plan with a fixed state vocabulary; `docs/ai/ARCHITECTURE.md` maps `game-next/`. `CLAUDE.md` imports `AGENTS.md`; an Antigravity rule points to it.

**Tech Stack:** Markdown, git, bash (link check), GitNexus CLI/MCP (hotspot measurement).

**Spec:** `docs/superpowers/specs/2026-10-03-ai-onboarding-context-design.md`

## Global Constraints

- All new AI-facing files, specs and plans are written in English. `README.md` stays in Vietnamese. Existing docs are not translated.
- `AGENTS.md` ≤ 120 lines (excluding the GitNexus block); `docs/ai/STATUS.md` ≤ 60 lines; `docs/ai/ARCHITECTURE.md` ≈ 150 lines.
- `DOCS-INDEX.md` state vocabulary, exactly: `draft`, `approved`, `in-progress`, `done`, `superseded`, `abandoned`.
- Hand-written content in `AGENTS.md` and `CLAUDE.md` stays outside `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->`; the block between the markers is never edited by hand.
- `game/` is legacy: do not edit it in this plan.
- Every commit adds a `CHANGELOG.md` entry under `## Unreleased` (newest first) in the existing format: `### YYYY-MM-DD - Title`, bullets, a `Verification:` bullet.
- Commit messages: `type(scope): summary` in English, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Stage only the files each task names. The working tree has unrelated changes (`docs/ref/image*.png` deletions, `docs/gui/ỉmprove-2/`) that must not be committed.
- Work on branch `docs/level-system-specs`.
- Before each commit run `detect_changes` (GitNexus MCP) if the server is connected; if it is not, record "GitNexus unavailable" in the CHANGELOG verification bullet.

## File map

| File | Task | Responsibility |
|------|------|----------------|
| `docs/ai/DOCS-INDEX.md` | 1 | Registry of specs/plans with state, plus other doc folders |
| `docs/ai/ARCHITECTURE.md` | 2 | Map of `game-next/`: layers, flows, pipeline, invariants, hotspots, tests |
| `docs/ai/STATUS.md` | 3 | Current branch, streams, next step, open decisions, recent gotchas |
| `AGENTS.md` | 4 | Canonical entry: project, where to work, protocols, commands, rules |
| `CLAUDE.md` | 4 | `@AGENTS.md` import + GitNexus block |
| `.agent/rules/agents.md` | 4 | Antigravity rule pointing to `AGENTS.md` |
| `.gitignore` | 4 | Ignore `.shots/` |
| `.claude/skills/gitnexus/` | 4 | Commit existing GitNexus skill files |
| `README.md` | 5 | Human-facing Vietnamese overview pointing at `game-next/` |
| `CHANGELOG.md` | 1–6 | One entry per commit |

## Shared verification command: link check

Used by tasks 1–6. It extracts repo paths written in backticks or markdown links from the given files and reports any that do not exist (paths containing `<`, `*` or `{` are templates and skipped).

```bash
# usage: linkcheck FILE...   (run from repo root)
linkcheck() {
  grep -ohE '(`|\()((docs|game-next|game|\.agent|\.claude|\.superpowers|mockups)/[^`) #]*|AGENTS\.md|CLAUDE\.md|CHANGELOG\.md|README\.md)' "$@" \
    | sed -E 's/^[`(]//' | grep -vE '[<*{]' | sort -u \
    | while read -r p; do [ -e "$p" ] || echo "MISSING: $p"; done
}
```

Expected output for a passing file: nothing.

---

### Task 1: Docs registry (`docs/ai/DOCS-INDEX.md`)

**Files:**
- Create: `docs/ai/DOCS-INDEX.md`
- Modify: `CHANGELOG.md` (new entry at top of `## Unreleased`)

**Interfaces:**
- Produces: row IDs `P0 P1 P2 MVP R R-M0 R-M1 GV DD GUI1 CH1 A B C D E E1-E3 F1 F2 F3 AI`, referenced by `STATUS.md` (Task 3) and `AGENTS.md` (Task 4).

- [ ] **Step 1: Confirm uncertain states with the reviewer**

Ask NKhanh0908 to confirm or change these defaults (from the 2026-10-03 research pass) before writing the file:

| Row | Default | Why uncertain |
|-----|---------|---------------|
| A, B, C, D | `approved` | Plans written, no explicit approval line; not implemented |
| E | `approved` | Approved once; §9 changes from c6d083e await re-review |
| GV, DD | `superseded` | Built and merged without recorded approval; GUI1 re-skinned them |

Use the confirmed values in Step 2. If the reviewer is unavailable, keep the defaults and append ` ?` to those State cells.

- [ ] **Step 2: Write the file**

Create `docs/ai/DOCS-INDEX.md` with exactly this content (adjusted only by Step 1 answers):

```markdown
# Docs Index

Registry of every spec and plan in `docs/superpowers/`. Read the row you need instead of opening the documents.
States: `draft` · `approved` · `in-progress` · `done` · `superseded` · `abandoned`. Update a row whenever a spec or plan is added or changes state.
Paths below are relative to `docs/superpowers/`.

## Active and upcoming (`game-next/`)

| ID | Topic | Spec | Plan(s) | State | Notes |
|----|-------|------|---------|-------|-------|
| R | Rebuild base contract (spec set 01–06) | specs/2026-09-30-mirror-rebuild/README.md | M0, M1 | in-progress | Approved 981dcb3. B will change its 18-level / 3-chapter campaign to 28 / 4 |
| R-M0 | Kernel, validator, session, harness | R 01, 02, 04, 06 | plans/2026-09-30-mirror-rebuild-m0.md | done | Evidence: `docs/testing/mirror-rebuild/m0-evidence.md` |
| R-M1 | Vertical slice, level 1-1 | R 03–06 | plans/2026-09-30-mirror-rebuild-m1.md | done | Merged f629381 |
| GUI1 | GUI improve-v1 re-skin + grid geometry | specs/2026-10-01-gui-improve-v1-design.md | plans/2026-10-01-gui-improve-v1-index.md, gui-improve-v1-1-nen-mong, gui-improve-v1-2-module-dung-chung, gui-improve-v1-3-manh-va-khung, gui-improve-v1-4-cac-man-con-lai | done | Current UI. Mockups: `docs/gui/improve-v1/` |
| CH1 | Chapter 1 levels 1-1…1-6 + authoring tools | specs/2026-10-02-chapter-1-levels-design.md | plans/2026-10-02-chapter-1-levels-index.md, chapter-1-levels-1-nen-mong, chapter-1-levels-2-renderer, chapter-1-levels-3-noi-dung | done | Merged e543843; all six levels `approved` |
| A | Shapes v2 (circle, parallelogram, frames) | specs/2026-10-02-a-shapes-v2-design.md | plans/2026-10-02-a-shapes-v2.md | approved | Not implemented |
| B | Level kit, `content:new`, 4 chapters / 28 levels | specs/2026-10-02-b-level-kit-chapters-design.md | plans/2026-10-02-b-level-kit-chapters.md | approved | Not implemented |
| C | Chapter 2 + Hoa Pham levels (16) | specs/2026-10-02-c-chapter-2-hoa-pham-levels-design.md | plans/2026-10-02-c-chapter-2-hoa-pham-levels.md | approved | Blocked: frames of sources 3-5 and 3-6 leave the board (decision needed) |
| D | Free placement + XOR solver | specs/2026-10-02-d-free-placement-design.md | plans/2026-10-02-d-free-placement.md | approved | Not implemented |
| E | Level studio | specs/2026-10-02-e-level-studio-design.md | plans/2026-10-02-e-level-studio.md (index) | approved | §9 changes need re-review; starts only after A, B, D are green |
| E1–E3 | Studio phase plans | spec E §8 | plans/2026-10-02-e1-difficulty.md, e2-studio-backend, e3-1-logic, e3-2-board-page, e3-3-check-acceptance | draft | Task skeletons only; run writing-plans on each before executing |
| F1 | Motion foundation + scene transitions | specs/2026-10-03-f1-scene-transitions-design.md | plans/2026-10-03-f-motion-index.md (read first), f1-1-nen-tang, f1-2-director, f1-3-dan-dung | approved | §3.3 edited after approval; not started |
| F2 | In-level game feel | specs/2026-10-03-f2-in-level-game-feel-design.md | plans/2026-10-03-f2-1-logic, f2-2-renderer, f2-3-phan-hoi | approved | Plans list 7 spec departures to review; not started |
| F3 | Motion acceptance tools | specs/2026-10-03-f3-motion-acceptance-design.md | plans/2026-10-03-f3-motion-acceptance.md | approved | Not started |
| AI | AI onboarding context | specs/2026-10-03-ai-onboarding-context-design.md | plans/2026-10-03-ai-onboarding-context.md | in-progress | This registry, `STATUS.md`, `ARCHITECTURE.md`, `AGENTS.md` |

## History (do not build on these)

| ID | Topic | Spec | Plan(s) | State | Notes |
|----|-------|------|---------|-------|-------|
| P0 | Android prototype (`game/`) | specs/2026-09-17-mirror-android-prototype-design.md | plans/2026-09-17-mirror-android-prototype.md | superseded | Replaced by P1, then by R |
| P1 | Large pieces + cosmic UI (`game/`) | specs/2026-09-17-mirror-puzzle-visual-redesign.md | plans/2026-09-17-mirror-puzzle-visual-redesign.md | superseded | Run notes in `.superpowers/sdd/` |
| P2 | Custom level editor (`game/`) | specs/2026-09-18-custom-level-editor-design.md | plans/2026-09-18-custom-level-editor.md | superseded | Done in `game/` only; E is the rebuild successor |
| MVP | 18-level MVP GDD + campaign (`game/`) | specs/2026-09-21-mirror-mvp-gdd.md | plans/2026-09-30-mirror-mvp-campaign.md | superseded | Replaced by `docs/gdd/master-gdd.md` and R |
| GV | Galaxy vector UX redesign | specs/2026-10-01-galaxy-vector-ux-redesign.md | — | superseded | Built 62a75f4, re-skinned by DD then GUI1 |
| DD | Divination Disc UI redesign | specs/2026-10-01-ui-redesign-divination-disc.md | plans/2026-10-01-ui-redesign-divination-disc.md | superseded | Dialogs and `TextureFactory` survive in code |

Checkboxes in done plans were never ticked; use this table and git history, not checkboxes.

## Other doc folders

- `docs/gdd/`: master GDD (`master-gdd.md`) — the game-design baseline for R.
- `docs/concept/`: early idea sheet, idea gate, technical assessment.
- `docs/testing/levels/`: authoring output per level (`<id>.svg`, `<id>-report.md`), `chapter-1-review.md`, chapter 2 drafts.
- `docs/testing/mirror-rebuild/`: M0 evidence and `<id>-content-review.md` approval records.
- `docs/testing/` (top-level files), `docs/testing/mirror-redesign/`: legacy `game/` evidence.
- `docs/gui/improve-v1/`: HTML artboards behind GUI1. `docs/gui/ỉmprove-2/`: PNG mockups for a possible next UI pass, no spec yet.
- `docs/ref/`, `docs/screenshots/`, `mockups/`: reference images and an old Divination Disc preview.
- `.agent/workflow-v2/`: Vietnamese phase-based agent workflow (concept → release).
- `.superpowers/sdd/`: working files from subagent-driven runs (briefs, reports, review diffs).
```

- [ ] **Step 3: Verify**

Run (repo root): define `linkcheck` from the shared section, then `linkcheck docs/ai/DOCS-INDEX.md`
Expected: no output.

Run: `for f in $(ls docs/superpowers/specs/*.md docs/superpowers/plans/*.md); do grep -q "$(basename "$f" .md | sed 's/^2026-[0-9-]*-//')" docs/ai/DOCS-INDEX.md || echo "UNLISTED: $f"; done`
Expected: no output (every spec and plan is referenced; phase plans are listed by short name such as `f1-2-director`, which this check matches).

Run: `grep -oE '(specs|plans)/[^ |,]*\.md' docs/ai/DOCS-INDEX.md | sort -u | while read -r p; do [ -e "docs/superpowers/$p" ] || echo "MISSING: $p"; done`
Expected: no output.

Run: `grep -oE '\| (draft|approved|in-progress|done|superseded|abandoned)( \?)? \|' docs/ai/DOCS-INDEX.md | wc -l`
Expected: `21` (one per row: 15 active, 6 history).

- [ ] **Step 4: Add CHANGELOG entry**

Insert directly under `## Unreleased`:

```markdown
### 2026-10-03 - Add docs registry for AI onboarding

- Added `docs/ai/DOCS-INDEX.md`: every spec and plan in `docs/superpowers/` grouped into 21 rows with a fixed state vocabulary, split into active and history tables, plus one line per other doc folder.
- Verification: link check passes; every spec and plan file is referenced; state cells counted; no runtime code changed.
```

- [ ] **Step 5: Commit**

```bash
git add docs/ai/DOCS-INDEX.md CHANGELOG.md
git commit -m "docs(ai): add docs registry with spec and plan states" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Architecture map (`docs/ai/ARCHITECTURE.md`)

**Files:**
- Create: `docs/ai/ARCHITECTURE.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: section headings `## Hotspots` and `## Level content pipeline`, linked from `AGENTS.md` (Task 4).

- [ ] **Step 1: Measure hotspots with GitNexus**

Refresh the index first: `node .gitnexus/run.cjs analyze`. On 2026-10-03 this failed with a LadybugDB WAL checkpoint error while the MCP server held the database; if it fails, stop the MCP server (close other Claude sessions on this repo) and retry with `--wal-checkpoint-threshold 67108864`.

Then run, for each target, `impact({target, direction: "upstream", summaryOnly: true})` and record risk level, direct dependants and affected flows:

`BoardRenderer`, `PlayScene`, `PlayController`, `applyCommand`, `evaluate`, `loadLevel`, `validateLevel`, `computeLayout`, `createProgressRepository`, `campaignManifest`.

Fill the `Hotspots` table in Step 2 with the measured values, keeping only HIGH and CRITICAL rows (keep `BoardRenderer` regardless — measured CRITICAL on 2026-10-03: 5 direct dependants, 6 `PlayScene` flows). If GitNexus cannot run at all, keep the `BoardRenderer` row, list the other targets under "Not yet measured" and add an open item to `STATUS.md` in Task 3.

- [ ] **Step 2: Write the file**

Create `docs/ai/ARCHITECTURE.md` with this content (Hotspots table from Step 1):

```markdown
# game-next Architecture

Map of `game-next/` for agents. Paths are relative to `game-next/`. Facts verified against the code on 2026-10-03; when you find a mismatch, fix this file in the same commit.

## Layers

| Folder | Purpose | Key files |
|--------|---------|-----------|
| `src/domain/` | Pure puzzle rules; no Phaser, no I/O | `model.ts` (grid constants, all types), `session.ts` (`createPuzzle`, `applyCommand` state machine), `mask.ts` (`evaluate` XOR, `matchesTarget`), `geometry.ts` (`rotateCells`, `fitsBoard`), `shapes.ts` (`shapeCells`, `rasterize`), `campaign.ts` (unlock and next-level rules) |
| `src/application/` | Use cases and ports | `playController.ts` (`PlayController`: input → view snapshot), `drag.ts` (`beginDrag`/`updateDrag`/`finishDrag`, snap preview), `progressPort.ts` (`StoragePort`, `ProgressRepository`, `Progress` v1), `telemetry.ts`, `ftue.ts` (tests only), `fixtureRunner.ts` |
| `src/infrastructure/` | Adapters | `progressRepository.ts` (localStorage, memory fallback, corrupt-data recovery), `playtestRecorder.ts` (not wired up), `lifecycle.ts` (Capacitor back button, pause/resume) |
| `src/content/` | Level data and tooling | `manifest.ts` (order, status, revision, `dataPath`), `catalog.ts` (`loadLevel` with status gate), `validate.ts` (`validateLevel`), `authoring.ts`, `authoringReport.ts`, `sources/<id>.ts`, `levels/<id>.json` |
| `src/presentation/` | Phaser scenes and views | Scenes: `MenuScene.ts`, `LevelSelectScene.ts`, `PlayScene.ts`, `FixtureScene.ts`. Views: `BoardRenderer.ts`, `Hud.ts`, `TargetBadge.ts`, `PauseDialog.ts`, `SettingsDialog.ts`, `SkyBackdrop.ts`, `GridPainter.ts`, `TextureFactory.ts`. Phaser-free helpers (testable): `layout.ts`, `designTokens.ts`, `hudText.ts`, `gridLayers.ts`, `jewelGeometry.ts`, `polygonClip.ts`, `starField.ts`, `constellationMotion.ts` |

Dependency rule: `domain` ← `application` ← `presentation`; `infrastructure` and `content` implement ports and data. Known exceptions — do not add more:
- `src/domain/campaign.ts:1` type-imports `ManifestEntry` from `content/document.ts`.
- `src/application/drag.ts:13-14` and `src/application/playController.ts:7-8` import from `presentation/layout.ts`.
- No composition root: each scene calls `createProgressRepository(localStorage, campaignManifest, 'oracle-v1')` (`MenuScene.ts:28`, `LevelSelectScene.ts:52`, `PlayScene.ts:76`).

## Boot and scene flow

- `src/main.ts`: error loggers → `resolveLaunch(location.search, import.meta.env.DEV)` → `Phaser.Game` 720×1280, `Scale.FIT`, scenes `[MenuScene, PlayScene, LevelSelectScene, FixtureScene]`. Android back: PlayScene → `onHardwareBack()`, LevelSelect → Menu, else exit.
- URL params (`src/launchParams.ts`): `scene=play|levelSelect`, `level=<id>` (default `1-1`), `mode=harness` (dev only). Dev-only `autosolve=win|drag` in `PlayScene.ts:203-207`.
- Transitions: Menu → Play (`MenuScene.ts:128`) or LevelSelect (`:157`); LevelSelect → Menu (`:113`) or Play (`:405`, unlocked nodes only); Play → next Play (`PlayScene.ts:139`), Menu (`:151`, `:154`, `:63`), LevelSelect (`:372`). `FixtureScene` is registered but unreachable.

## Gameplay flow

1. `PlayScene.init` → `loadLevel(id, mode)`; campaign accepts `approved`, harness accepts `validated|approved`; load error falls back to 1-1.
2. `PlayScene.create` builds `PlayController`, `BoardRenderer`, `TargetBadge`, `Hud`, `PauseDialog`.
3. Pointer down → hit-test via `pieceHitbox` → `beginDrag`. Move → `updateDrag` finds nearest anchor (d² ≤ 36 logic cells, must `fitsBoard`) and previews `evaluate(...)`. Up → `finishDrag`: tray → `return`; snapped → `drop`; else temporary or return.
4. `applyCommand` re-checks the snap; only `snapped` pieces count. `evaluate` XORs cells; `matchesTarget` → `phase:'won'`.
5. On win in campaign mode: `progressRepo.complete(id)` (throws if predecessor incomplete); harness never saves. UI: `playCelebration`, `setVictoryMode`, `showWinModal`.

## Level content pipeline

1. Write `src/content/sources/<id>.ts` (`LevelSource`; never hand-write cells or target) and register it in `src/content/sources/index.ts`.
2. `npm run content:author -- <id>` → `src/content/levels/<id>.json`, `../docs/testing/levels/<id>.svg`, `../docs/testing/levels/<id>-report.md`. Anchors must be multiples of `ANCHOR_STEP = 8`; target = XOR of sample solution 1; fails if a fewer-piece solution exists.
3. Register in both `src/content/manifest.ts` (status `validated`) and the `documents` map in `src/content/catalog.ts`.
4. Reviewer plays `?scene=play&level=<id>&mode=harness` on `npm run dev`.
5. Approval commit `feat(content): approve level <id> after review`: status `approved` in `manifest.ts`, add `../docs/testing/mirror-rebuild/<id>-content-review.md`, update `../docs/testing/levels/chapter-1-review.md`, CHANGELOG entry.
6. Verify: `npm run typecheck`, `npm test`, `npm run content:validate`. `--release` needs 18 approved levels, so `build:release` fails today (6/18).
Screenshots: `scripts/shoot-level.sh <id> <outdir>` (headless Chrome, needs the dev server).

## Invariants

- Grid `GRID_WIDTH = 128`, `GRID_HEIGHT = 160` (`src/domain/model.ts`). The "128 x 192" comment in `geometry.ts` and the "24 px" comment in `drag.ts` are stale.
- Mask: `Uint8Array`, index `y*GRID_WIDTH + x`, `mask[idx] ^= 1` per snapped piece cell.
- Snap radius d² ≤ 36 logic cells, checked in both `src/domain/session.ts` and `src/application/drag.ts` — change both together.
- Board 640×800 px (5 px per logic cell); `LAYOUT_TOKENS` in `src/presentation/designTokens.ts`.
- Validation: chapters 1–2 must not enable rotation; chapter 1 solutions have no turns and no overlap.
- Unlock: `order === 1` always open; otherwise predecessor completed.

## Persistence

- `mirror.rebuild.progress.v1` and `mirror.rebuild.progress.recovery` (`src/infrastructure/progressRepository.ts:10-11`); campaign revision `'oracle-v1'`. Changing the schema or revision resets players' progress (old data copied to the recovery key).
- `mirror.rebuild.playtest.v1` (`src/infrastructure/playtestRecorder.ts`), not instantiated anywhere.

## Hotspots

Measured with GitNexus `impact` (upstream). Report HIGH/CRITICAL to the reviewer before editing.

| Symbol | File | Risk | Direct dependants | Flows | Measured |
|--------|------|------|-------------------|-------|----------|
| `BoardRenderer` | `src/presentation/BoardRenderer.ts` | CRITICAL | 5 | 6 `PlayScene` flows | 2026-10-03 |

## Tests

- `tests/*.test.ts` (30 files, flat), Vitest defaults, node environment; no `vitest.config`. Run `npm test` from `game-next/`.
- Prefer testing Phaser-free modules; only `tests/boardRendererLayers.test.ts` mocks Phaser.
- In-memory `StoragePort` fakes with revision `'oracle-v1'` in `catalog`, `progress`, `playController` tests.
- No `VITE_*` env vars; the only dev gate is `import.meta.env.DEV`.
```

- [ ] **Step 3: Verify**

Run (repo root): `linkcheck docs/ai/ARCHITECTURE.md`
Expected: no output. (Paths inside this file are relative to `game-next/`; also run `cd game-next && for p in $(grep -ohE '`(src|tests|scripts)/[^`]*`' ../docs/ai/ARCHITECTURE.md | tr -d '`' | sed -E 's/:[0-9-]+$//' | grep -vE '[<*]' | sort -u); do [ -e "$p" ] || echo "MISSING: $p"; done; cd ..` — expected: no output.)

Run: `wc -l docs/ai/ARCHITECTURE.md`
Expected: ≤ 160.

Spot-check three facts against code: `grep -n "GRID_HEIGHT" game-next/src/domain/model.ts` shows `160`; `grep -n "mirror.rebuild.progress" game-next/src/infrastructure/progressRepository.ts` shows both keys; `ls game-next/tests/*.test.ts | wc -l` shows `30`.

- [ ] **Step 4: Add CHANGELOG entry**

```markdown
### 2026-10-03 - Add game-next architecture map for agents

- Added `docs/ai/ARCHITECTURE.md`: layers with known dependency exceptions, boot and scene flow with line references, gameplay flow, level content pipeline and review flow, invariants, localStorage keys, GitNexus hotspots, test conventions.
- Verification: link check and `game-next/`-relative path check pass; grid size, storage keys and test count checked against code; hotspots measured with GitNexus `impact` (or: GitNexus unavailable, only `BoardRenderer` recorded).
```

- [ ] **Step 5: Commit**

```bash
git add docs/ai/ARCHITECTURE.md CHANGELOG.md
git commit -m "docs(ai): add game-next architecture map" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Current status (`docs/ai/STATUS.md`)

**Files:**
- Create: `docs/ai/STATUS.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: row IDs from Task 1 (`F1`, `A`–`E`, `AI`).
- Produces: the five section headings `## Now`, `## Streams`, `## Open decisions / blockers`, `## Gotchas learned recently` that the end-of-task protocol in `AGENTS.md` (Task 4) tells agents to rewrite.

- [ ] **Step 1: Confirm the next step with the reviewer**

Ask NKhanh0908 which stream runs next. Default if no answer: F motion — `docs/superpowers/plans/2026-10-03-f-motion-index.md` stop point 1 (re-review F1 §3.3 and F2 plan departures), then create `feat/motion-f1` from `docs/level-system-specs`. The alternative queue is A → B → D → E (C is blocked).

- [ ] **Step 2: Write the file**

Create `docs/ai/STATUS.md` (replace the "Next step" line with the Step 1 answer):

```markdown
# Status — updated 2026-10-03 by Claude Code

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `docs/level-system-specs` (docs only, not merged into `main`; every `feat/*` branch is merged).
- Product state: `game-next/` with chapter 1 (levels 1-1…1-6) approved; 6 of 18 manifest levels approved.
- Next step: F motion — stop point 1 in `docs/superpowers/plans/2026-10-03-f-motion-index.md`, then create `feat/motion-f1` and run F1-1 task 1.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| Level system A → B → D → E | specs approved, plans written, not started | `docs/ai/DOCS-INDEX.md` rows A–E |
| C chapter 2 + Hoa Pham | blocked | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| AI onboarding | in progress | `docs/superpowers/plans/2026-10-03-ai-onboarding-context.md` |

## Open decisions / blockers

- C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision.
- E: spec §9 changes (c6d083e) need re-review; E1–E3 plans are skeletons and need writing-plans.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- GitNexus `analyze` failed on 2026-10-03 (LadybugDB WAL checkpoint); index last built at a09d683.

## Gotchas learned recently

- `BoardRenderer` is CRITICAL in GitNexus (6 `PlayScene` flows); F1 task 9 and F2 task 6 touch it.
- `build:release` fails by design until 18 levels are approved.
- Specs and plans from now on are written in English; older ones are Vietnamese and stay that way.
```

Drop the GitNexus bullet if Task 2 Step 1 refreshed the index successfully.

- [ ] **Step 3: Verify**

Run: `linkcheck docs/ai/STATUS.md && wc -l docs/ai/STATUS.md`
Expected: no `MISSING` lines; line count ≤ 60.

- [ ] **Step 4: Add CHANGELOG entry**

```markdown
### 2026-10-03 - Add current status file for agents

- Added `docs/ai/STATUS.md`: branch, product state, next step, streams with entry docs, open decisions and recent gotchas; overwritten at the end of every task.
- Verification: link check passes; 60-line limit respected; no runtime code changed.
```

- [ ] **Step 5: Commit**

```bash
git add docs/ai/STATUS.md CHANGELOG.md
git commit -m "docs(ai): add current status file" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Entry point and tool wiring

**Files:**
- Modify: `AGENTS.md` (untracked; keep the existing GitNexus block byte-for-byte)
- Modify: `CLAUDE.md` (untracked; keep the existing GitNexus block byte-for-byte)
- Create: `.agent/rules/agents.md`
- Modify: `.gitignore`
- Add to git: `.claude/skills/gitnexus/`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md`, `docs/ai/ARCHITECTURE.md` and their section names from Tasks 1–3.

- [ ] **Step 1: Back up the GitNexus block**

Run: `sed -n '/<!-- gitnexus:start -->/,/<!-- gitnexus:end -->/p' AGENTS.md > .git/gitnexus-block.md && wc -l .git/gitnexus-block.md`
Expected: ~40 lines starting with `<!-- gitnexus:start -->`.

- [ ] **Step 2: Write `AGENTS.md`**

Write this content, then append the saved block: `cat .git/gitnexus-block.md >> AGENTS.md`.

```markdown
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

1. Read `docs/ai/STATUS.md` (current branch, next step, open decisions).
2. Find the relevant row in `docs/ai/DOCS-INDEX.md`; open only the spec/plan that row points to.
3. Before touching code, read the relevant sections of `docs/ai/ARCHITECTURE.md` (check its Hotspots table).
4. Read only the 3–5 newest entries of `CHANGELOG.md`; it is long.
5. Do not re-read every spec or plan. If these files disagree with the code, trust the code and fix the file.

## End of task

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

GitNexus indexes this repo as `ASOL-GAME-02`; the rules below the marker are generated and mandatory. If the MCP server is unavailable, say so in the CHANGELOG verification bullet instead of skipping silently.

```

- [ ] **Step 3: Write `CLAUDE.md`**

Write this content, then append the same block: `cat .git/gitnexus-block.md >> CLAUDE.md`.

```markdown
# CLAUDE.md

All project instructions live in `AGENTS.md` (shared with Codex and Antigravity). Edit that file, not this one.

@AGENTS.md

```

- [ ] **Step 4: Write `.agent/rules/agents.md`**

```markdown
---
trigger: always_on
---

# Project instructions

Before any task in this workspace, read `AGENTS.md` at the repository root and follow its start-of-task and end-of-task protocols. `AGENTS.md` is the single source of truth shared with Claude Code and Codex; do not duplicate its rules here.
```

- [ ] **Step 5: Ignore `.shots/`**

Append to `.gitignore`:

```text
.shots/
```

Run: `git check-ignore -q .shots/task8-chrome && echo ignored`
Expected: `ignored`.

- [ ] **Step 6: Verify**

Run: `linkcheck AGENTS.md CLAUDE.md .agent/rules/agents.md`
Expected: no output.

Run: `sed '/<!-- gitnexus:start -->/,$d' AGENTS.md | wc -l`
Expected: ≤ 120.

Run: `diff <(sed -n '/<!-- gitnexus:start -->/,/<!-- gitnexus:end -->/p' AGENTS.md) .git/gitnexus-block.md && diff <(sed -n '/<!-- gitnexus:start -->/,/<!-- gitnexus:end -->/p' CLAUDE.md) .git/gitnexus-block.md && echo blocks-intact`
Expected: `blocks-intact`.

Run: `git status --short -uall .claude/skills/gitnexus`
Expected: only skill `SKILL.md` files under `.claude/skills/gitnexus/` (inspect the list; nothing else under `.claude/` gets staged).

- [ ] **Step 7: Add CHANGELOG entry**

```markdown
### 2026-10-03 - Add shared AGENTS.md entry point for Claude Code, Codex and Antigravity

- Rewrote `AGENTS.md` as the canonical agent entry: project summary, where to work (`game-next/` vs legacy `game/`), start- and end-of-task protocols, commands, rules (English specs and plans, CHANGELOG per commit, level approval flow), with the GitNexus block kept unchanged.
- `CLAUDE.md` now imports `@AGENTS.md`; added `.agent/rules/agents.md` for Antigravity; committed `.claude/skills/gitnexus/`; ignored `.shots/`.
- Verification: link check passes; `AGENTS.md` within 120 lines outside the GitNexus block; GitNexus blocks byte-identical to the previous version; `.shots/` ignored.
```

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md CLAUDE.md .agent/rules/agents.md .gitignore .claude/skills/gitnexus CHANGELOG.md
git commit -m "docs(ai): add shared AGENTS.md entry point for all agents" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Human README

**Files:**
- Modify: `README.md` (full rewrite)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Rewrite `README.md`**

~~~~markdown
# ASOL Game 02 — Mirror

Mirror là game giải đố kéo thả cho Android (màn hình dọc) và web. Người chơi đặt các mảnh hình lên lưới để tạo đúng hình bóng mục tiêu. Vùng chồng tính theo quy luật chẵn/lẻ: lớp phủ chẵn biến mất, lớp phủ lẻ hiện lại.

## Trạng thái

- Bản đang phát triển: `game-next/` (tái thiết từ 2026-09-30) — Phaser 3.90, TypeScript, Vite, Capacitor 8 Android.
- Nội dung: chương 1 (màn 1-1 đến 1-6) đã duyệt; manifest dự kiến 18 màn.
- `game/` là prototype cũ, chỉ giữ để tham khảo, không phát triển tiếp.
- Tình hình mới nhất và việc kế tiếp: [`docs/ai/STATUS.md`](docs/ai/STATUS.md).

## Chạy bản web

Yêu cầu Node.js `>=24.13.1 <25`.

```powershell
cd game-next
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Mở thẳng một màn để duyệt: `?scene=play&level=1-3&mode=harness`.

Kiểm tra trước khi push:

```powershell
cd game-next
npm test
npm run build
cd ..
git diff --check
git status
```

## Build Android debug

Cần Android SDK và tệp `game-next/android/local.properties` trỏ tới SDK.

```powershell
cd game-next
npm run android:sync
cd android
cmd /c gradlew.bat assembleDebug
```

## Cấu trúc repository

```text
game-next/     Bản đang phát triển (domain, application, infrastructure, content, presentation)
game/          Prototype cũ (legacy)
docs/ai/       Ngữ cảnh cho AI: trạng thái, danh mục spec/plan, sơ đồ kiến trúc
docs/superpowers/  Spec và plan
docs/gdd/      Game design document
docs/testing/  Bằng chứng kiểm thử và hồ sơ duyệt màn
AGENTS.md      Hướng dẫn chung cho mọi AI agent (Claude Code, Codex, Antigravity)
CHANGELOG.md   Nhật ký thay đổi bắt buộc
```

## Quy trình làm việc

- Mọi commit thay đổi code, tài liệu, cấu hình hoặc level phải kèm mục trong [CHANGELOG.md](CHANGELOG.md).
- Commit message, spec và plan viết bằng tiếng Anh; dạng `type(scope): summary`.
- Không commit `node_modules`, `dist`, thư mục build Android, `local.properties`.
- Quy tắc đầy đủ cho AI và người: [AGENTS.md](AGENTS.md). Danh mục tài liệu: [`docs/ai/DOCS-INDEX.md`](docs/ai/DOCS-INDEX.md).
~~~~

- [ ] **Step 2: Verify**

Run: `linkcheck README.md && grep -c "game-next" README.md`
Expected: no `MISSING` lines; count ≥ 5.

- [ ] **Step 3: Add CHANGELOG entry**

```markdown
### 2026-10-03 - Rewrite README for the game-next rebuild

- Rewrote `README.md` (Vietnamese): `game-next/` as the active product with Node 24 commands and Android build, `game/` marked legacy, links to `AGENTS.md`, `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`.
- Verification: link check passes; no runtime code changed.
```

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: rewrite README for the game-next rebuild" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cold-start acceptance and close-out

**Files:**
- Modify: `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md` (row `AI` → `done`), `CHANGELOG.md`
- Possibly modify: any `docs/ai/*` or `AGENTS.md` line that the cold-start test shows is missing or wrong

- [ ] **Step 1: Run the cold-start test**

Dispatch a fresh subagent (no conversation context) with exactly this prompt:

> You are starting work in `D:\Working\ASOL\ASOL-GAME-02`. Read `AGENTS.md` and follow its start-of-task protocol. Do not open anything under `docs/superpowers/`. Then answer, citing the file you got each answer from: (1) What is the next task? (2) Where do I edit level 1-3, and how do I regenerate it? (3) What is the state of spec E (level studio) and what blocks it? (4) How do I run the tests? (5) Which code is high risk to change? Also list every file you opened.

Expected answers:
1. The "Next step" line of `docs/ai/STATUS.md`.
2. `game-next/src/content/sources/1-3.ts`, then `npm run content:author -- 1-3`; never hand-edit the JSON.
3. `approved`, §9 re-review pending, waits for A, B, D; E1–E3 plans are drafts.
4. `cd game-next && npm test`.
5. `BoardRenderer` (CRITICAL) plus any other Hotspots rows.

Pass = all five correct and no file under `docs/superpowers/` opened.

- [ ] **Step 2: Fix gaps**

For each wrong or missing answer, add the missing fact to the file that should have held it (per the spec's file roles), then re-run Step 1 with a new subagent. Repeat until it passes.

- [ ] **Step 3: Close out**

- In `docs/ai/DOCS-INDEX.md`, set row `AI` State to `done` and Notes to `Cold-start test passed 2026-10-03`.
- Overwrite `docs/ai/STATUS.md` per the end-of-task protocol: remove the AI onboarding stream row, keep the date line current.
- Run `linkcheck AGENTS.md CLAUDE.md README.md docs/ai/*.md .agent/rules/agents.md` — expected: no output.

- [ ] **Step 4: Add CHANGELOG entry**

```markdown
### 2026-10-03 - Pass the AI onboarding cold-start test

- A fresh subagent reading only `AGENTS.md` and `docs/ai/*` answered the five spec questions correctly without opening `docs/superpowers/`; marked row `AI` done in `docs/ai/DOCS-INDEX.md` and refreshed `docs/ai/STATUS.md`.
- Verification: cold-start test passed (N attempts); link check over all onboarding files passes; no runtime code changed.
```

Replace `N` with the actual attempt count.

- [ ] **Step 5: Commit**

```bash
git add docs/ai CHANGELOG.md AGENTS.md
git commit -m "docs(ai): pass onboarding cold-start test and close out" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

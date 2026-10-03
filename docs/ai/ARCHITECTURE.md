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

1. Run `npm run content:new -- <id> [--from <id>] [--title "<name>"]`, then edit `src/content/sources/<id>.ts`; the command registers only `sources/index.ts`, never manifest/catalog. Use `src/content/kit.ts` for center-based placement, mirrors, rows and concentric pieces.
2. `npm run content:author -- <id>` → `src/content/levels/<id>.json`, `../docs/testing/levels/<id>.svg`, `../docs/testing/levels/<id>-report.md`. Before geometry checks, KIT-03 removes unsafe decoy anchors (out of bounds or clashing with an identical piece's A anchor) unless a sample solution protects them. Anchors must be multiples of `ANCHOR_STEP = 8`; target = XOR of sample solution 1; fails if a fewer-piece solution exists.
3. Register in both `src/content/manifest.ts` (status `validated`) and the `documents` map in `src/content/catalog.ts`.
4. Reviewer plays `?scene=play&level=<id>&mode=harness` on `npm run dev`.
5. Approval commit `feat(content): approve level <id> after review`: status `approved` in `manifest.ts`, add `../docs/testing/mirror-rebuild/<id>-content-review.md`, update `../docs/testing/levels/chapter-1-review.md`, CHANGELOG entry.
6. Verify: `npm run typecheck`, `npm test`, `npm run content:validate`. `--release` needs 28 approved levels, so `build:release` fails today (6/28).
Screenshots: `scripts/shoot-level.sh <id> <outdir>` (headless Chrome, needs the dev server).

## Invariants

- Grid `GRID_WIDTH = 128`, `GRID_HEIGHT = 160` (`src/domain/model.ts`). The "128 x 192" comment in `geometry.ts` and the "24 px" comment in `drag.ts` are stale.
- Mask: `Uint8Array`, index `y*GRID_WIDTH + x`, `mask[idx] ^= 1` per snapped piece cell.
- Snap radius d² ≤ 36 logic cells, checked in both `src/domain/session.ts` and `src/application/drag.ts` — change both together.
- Board 640×800 px (5 px per logic cell); `LAYOUT_TOKENS` in `src/presentation/designTokens.ts`.
- Validation: chapters 1–3 must not enable rotation and chapter 4 must enable it; chapter 1 solutions have no turns and no overlap.
- Unlock: `order === 1` always open; otherwise predecessor completed.

## Persistence

- `mirror.rebuild.progress.v1` and `mirror.rebuild.progress.recovery` (`src/infrastructure/progressRepository.ts:10-11`); campaign revision `'oracle-v1'`. Changing the schema or revision resets players' progress (old data copied to the recovery key).
- `mirror.rebuild.playtest.v1` (`src/infrastructure/playtestRecorder.ts`), not instantiated anywhere.

## Hotspots

Measured with GitNexus `impact` (upstream). Report HIGH/CRITICAL to the reviewer before editing.

| Symbol | File | Risk | Direct dependants | Flows | Measured |
|--------|------|------|-------------------|-------|----------|
| `BoardRenderer` | `src/presentation/BoardRenderer.ts` | CRITICAL | 5 | 6 | 2026-10-03 |
| `PlayController` | `src/application/playController.ts` | CRITICAL | 11 | 7 | 2026-10-03 |
| `applyCommand` | `src/domain/session.ts` | CRITICAL | 4 | 6 | 2026-10-03 |
| `evaluate` | `src/domain/mask.ts` | CRITICAL | 5 | 9 | 2026-10-03 |
| `validateLevel` | `src/content/validate.ts` | HIGH | 4 | 2 | 2026-10-03 |
| `createProgressRepository` | `src/infrastructure/progressRepository.ts` | HIGH | 3 | 3 | 2026-10-03 |

Measured LOW (not listed): `PlayScene`, `loadLevel`, `computeLayout`, `campaignManifest` (a const; the graph shows no dependants, so treat the result as unreliable).

## Tests

- `tests/*.test.ts` (30 files, flat), Vitest defaults, node environment; no `vitest.config`. Run `npm test` from `game-next/`.
- `src/application/fixtureRunner.ts` (`runFixtureSolution`) solves the M0 technical fixture (`src/content/fixtures.ts`); covered by `tests/harness.test.ts`. `FixtureScene` renders it but is unreachable at runtime.
- Prefer testing Phaser-free modules; only `tests/boardRendererLayers.test.ts` mocks Phaser.
- In-memory `StoragePort` fakes with revision `'oracle-v1'` in `catalog`, `progress`, `playController` tests.
- No `VITE_*` env vars; the only dev gate is `import.meta.env.DEV`.

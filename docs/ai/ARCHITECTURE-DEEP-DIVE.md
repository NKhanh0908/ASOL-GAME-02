# game-next — Architecture Deep Dive

A full walkthrough of the `game-next/` codebase: the technology, the techniques, the
components, and the naming conventions that hold it together. Written on 2026-10-07 and
verified against the code at that date.

This document is the *long* companion to `docs/ai/ARCHITECTURE.md`. That file is a terse
map an agent reads at the start of a task; this one explains **why** the pieces are shaped
the way they are. When the two disagree, the code wins and both files get fixed.

All paths are relative to `game-next/` unless stated otherwise.

---

## 1. What the product is

Mirror is a drag-and-drop puzzle game. The player drags shapes from a tray onto a grid.
Cells covered by an **even** number of pieces cancel out and vanish; cells covered an
**odd** number of times stay lit. The lit result must exactly match a target silhouette.
That single rule — parity, i.e. XOR — is the whole game, and everything in the domain layer
exists to express it precisely.

Targets: Android (portrait, via Capacitor) and the web. No server, no accounts, no network
calls at runtime. Player progress lives in `localStorage`.

---

## 2. Technology stack

| Concern | Choice | Why it is this and not something else |
|---|---|---|
| Rendering / game loop | **Phaser 3.90** | Canvas/WebGL 2D engine with a scene system, input, tweens and an audio manager out of the box. The game is 2D vector-ish shapes on a grid; a full engine is overkill in places but the scene lifecycle and tween system carry most of the transition work. |
| Language | **TypeScript 5.7**, `strict: true` | The domain is arithmetic over grids and masks; the type system is what keeps `Orientation`, `Turns`, `Chapter` and `PieceState` from drifting into untyped numbers and strings. |
| Bundler / dev server | **Vite 6** | Fast HMR, native ESM, and — importantly — a plugin hook (`configureServer`) that lets the level Studio write real files to disk during development. |
| Tests | **Vitest 2** | Same transform pipeline as Vite, no separate config file in this repo; runs in the Node environment. |
| Native shell | **Capacitor 8** (`@capacitor/android`, `app`, `haptics`) | Wraps the web build in an Android WebView. Only three native surfaces are used: hardware back button / lifecycle, haptics, and app exit. |
| Runtime | **Node >=24.13.1 <25** | The content scripts run `.ts` directly with `node --experimental-strip-types`; no build step for tooling. This is why the engine range is pinned narrowly. |
| Module style | ESM everywhere, `.ts` extensions in import specifiers | `allowImportingTsExtensions` + `moduleResolution: "Bundler"`. The same source files are consumed by Vite, Vitest and bare Node type-stripping — explicit extensions are what make all three agree. |

Notably **absent**: no React/Vue, no state library, no CSS framework, no HTTP client, no
runtime validation library (validation is hand-written), no test mocking framework beyond
Vitest's own. The dependency list is five runtime packages.

---

## 3. Directory map

```
game-next/
├── index.html                 production entry (the game)
├── studio.html                dev-only entry (level editor)
├── audiolab.html              dev-only entry (sound design tool)
├── vite.config.ts             studioPlugin is loaded only when command === 'serve'
├── capacitor.config.ts        appId com.nkhanh.mirror.rebuild, webDir dist
├── android/                   generated Capacitor Android project
├── scripts/                   Node CLIs (content, audio, studio server, capture)
├── tests/                     90 flat Vitest files + tests/helpers/fakeScene.ts
└── src/
    ├── main.ts                composition / bootstrap for the game
    ├── launchParams.ts        URL → launch target
    ├── domain/                pure puzzle rules
    ├── application/           use cases and ports
    ├── infrastructure/        adapters (storage, audio, haptics, lifecycle)
    ├── presentation/          Phaser scenes, views, tokens, transitions, feedback
    ├── content/               level data, authoring, validation, solver, studio store
    ├── audio-synth/           portable procedural audio engine
    ├── studio/                browser UI of the level editor
    └── devtools/audiolab/     browser UI of the audio lab
```

---

## 4. The layered architecture

The dependency rule is one-directional:

```
domain  ←  application  ←  presentation
   ↑            ↑
   └── content ─┴── infrastructure
```

- **`domain/`** knows nothing. No Phaser, no DOM, no I/O, no imports outside itself.
- **`application/`** orchestrates the domain and declares *ports* (interfaces) for anything
  it needs from the outside.
- **`infrastructure/`** implements those ports against real browser / Capacitor APIs.
- **`presentation/`** draws and handles input; it drives the application layer.
- **`content/`** is data plus the tooling that produces and checks that data.

### Sanctioned exceptions

These exist, are known, and must not be multiplied:

1. `domain/campaign.ts` type-imports `ManifestEntry` from `content/document.ts`. It is a
   type-only import, so nothing leaks at runtime.
2. `application/drag.ts` and `application/playController.ts` import `pieceHitbox` /
   `LayoutMetrics` from `presentation/layout.ts`. Hit-testing needs pixel geometry, and
   `layout.ts` is deliberately Phaser-free so this stays testable.
3. **There is no composition root.** `src/main.ts` builds audio and the progress repository,
   but each scene also calls `createProgressRepository(localStorage, campaignManifest,
   'oracle-v1')` for itself. Changing the campaign revision means changing it in several
   places.

### The "Phaser-free helper" technique

The most important structural habit in `presentation/`: anything that can be computed
without a Phaser object lives in its own module and is unit-tested directly. Scenes and
view classes (`PlayScene`, `BoardRenderer`, `Hud`) are thin shells over those helpers.

- Phaser-bound: `MenuScene`, `PlayScene`, `LevelSelectScene`, `SplashScene`,
  `BackgroundScene`, `FixtureScene`, `BoardRenderer`, `Hud`, `TargetBadge`, `PauseDialog`,
  `SettingsDialog`, `SkyBackdrop`, `GridPainter`, `TextureFactory`, `PieceView`,
  `JewelShape`, `PieceTextureCache`.
- Phaser-free and directly tested: `layout.ts`, `designTokens.ts`, `hudText.ts`,
  `gridLayers.ts`, `jewelGeometry.ts`, `polygonClip.ts`, `starField.ts`,
  `constellationLayout.ts`, `constellationMotion.ts`, `skyMood.ts`, `pieceMotion.ts`,
  `targetSilhouette.ts`, `viewport.ts`, `designViewport.ts`, `i18n.ts`,
  `transitions/motion.ts`, `transitions/choreography.ts`, `transitions/routes.ts`,
  `feedback/parityDiff.ts`, `feedback/feedbackEvents.ts`.

Only one test (`tests/boardRendererLayers.test.ts`) mocks Phaser, via
`tests/helpers/fakeScene.ts`. That is the ceiling, not the pattern.

---

## 5. Boot sequence

`src/main.ts`, in order:

1. Install `error` and `unhandledrejection` loggers on `window`.
2. `resolveLaunch(location.search, import.meta.env.DEV)` → a `LaunchTarget`.
3. `readViewport()` → physical buffer size.
4. Create the progress repository, read settings, `setMotionScale(reducedMotion ? 0 : 1)`.
5. Create the **music** service *outside* any scene, so a track survives scene transitions.
6. `await waitForFonts()` — explicitly `document.fonts.load(...)` each required face
   (Be Vietnam Pro 400/500/600/700, Cormorant Garamond 600/700, Baloo 2 600/700) with a
   3 s timeout. This is not ceremony: Phaser draws text on a 2D canvas, and setting
   `ctx.font` does **not** trigger a webfont download, so `document.fonts.ready` can resolve
   before anything is loaded. Phaser measures text width once at construction and never
   re-measures, so building a scene early bakes in the wrong font and wrong positions
   permanently.
7. `new Phaser.Game({...})` with scenes `[BackgroundScene, SplashScene, MenuScene,
   PlayScene, LevelSelectScene, FixtureScene]`. `BackgroundScene` is first, so it
   auto-starts and always draws underneath.
8. `director.setHost(new PhaserSceneHost(game))` and `director.setMusic(music)`.
9. On Phaser's `ready` event: render all SFX patches into `AudioBuffer`s through the Web
   Audio context, build the `sfx` service (falling back to a silent driver if rendering
   throws), publish `{ music, sfx }` into `game.registry` under `AUDIO_REGISTRY_KEY`, then
   honour the launch target (skipping the splash when a deep link was given).
10. `setupAndroidLifecycle({ onHardwareBack, onBackground, onResume })`.

### Viewport technique

The game is authored against a **720 × 1280 design space**, but Phaser's scale mode is
`Phaser.Scale.NONE` with `autoCenter: NO_CENTER`. The canvas backing buffer is sized to the
device's real pixels; each scene then calls `applyDesignViewport`, which sets
`camera.zoom = scene.scale.width / 720`. CSS handles display size.

The consequence to remember: **any camera animation must multiply by `camera.zoom`, never
reset it to `1.0`.** Resetting breaks the responsive scale on every device that is not
exactly 720 px wide.

### Launch parameters (`src/launchParams.ts`)

| Param | Values | Notes |
|---|---|---|
| `scene` | `play`, `levelSelect` | anything else → Menu |
| `level` | level id | default `1-1` |
| `mode` | `harness` | **dev only**; production always forces `campaign` |
| `focus` | level id | **dev only**; focuses a constellation node for screenshots |

Dev-only `autosolve=win|drag` is read inside `PlayScene`.

---

## 6. The domain core

### 6.1 The grid and the mask

```ts
GRID_WIDTH  = 128
GRID_HEIGHT = 160
TOTAL_CELLS = 20480
```

The board state is a flat `Uint8Array(TOTAL_CELLS)`, indexed `y * GRID_WIDTH + x`. XOR is
literally `mask[idx] ^= 1` per covered cell. Victory is `matchesTarget(mask,
level.targetMask)` — an exact element-wise comparison, no tolerance.

A typed array rather than a `Set<string>` or nested arrays is the deliberate choice: the
mask is recomputed on every committed command and compared against the target every time,
so allocation and iteration cost matter.

`maskCentroid` returns the centre of mass of the lit cells (cell centre = coordinate + 0.5),
used by the presentation layer to position effects.

### 6.2 Pieces

```ts
type Piece = {
  id: string;
  frameSize: number;            // side of the square frame the piece rotates inside
  cells: readonly Cell[];       // offsets within that frame
  anchors: readonly Anchor[];   // { id, x, y } candidate placements
  color: 'amber';
  shapeKind?: ShapeKind;        // 'square' | 'triangle' | 'diamond' | 'circle' | 'parallelogram'
  orientation?: Orientation;    // 0..7
};
```

`cells` are offsets *inside a square frame*, not absolute board cells. Rotation is therefore
a pure frame operation: `rotateCells` maps `(x, y) → (frameSize - 1 - y, x)` per 90° step.
Placement adds the anchor origin afterwards. This separation is why rotation never needs to
know where a piece sits.

**`Orientation` is not rotation.** It is a static authoring property with eight values. For
right isosceles triangles, 0–3 put the right angle in a frame corner (TL/TR/BR/BL) and 4–7
are "roof" forms with the hypotenuse on the bottom/left/top/right edge. Parallelograms use
0–3. Squares, diamonds and circles are always 0. The two families are disjoint under play:
in-game 90° rotation preserves orientation parity, so a Corner triangle can never become a
Roof triangle mid-level. Corner triangles need a frame size divisible by 8; Roof triangles
need divisible by 16.

`Turns` (`0 | 1 | 2 | 3`) is the *dynamic* in-play rotation. Keeping these two concepts in
separate types is what stops authoring data and runtime state from being confused.

### 6.3 Piece state and the "fits by cells" rule

```ts
type PieceState =
  | { kind: 'tray';      turns }
  | { kind: 'temporary'; x, y, turns }   // dropped on the board but not snapped
  | { kind: 'snapped';   anchorId, turns } // snapped to an authored anchor
  | { kind: 'placed';    x, y, turns }     // free-placement levels only
```

Only `snapped` and `placed` pieces contribute to the mask (`placementsOf`).

`fitsBoard(cells, x, y)` checks **the piece's real cells**, not its bounding frame. The
authoring counterpart `anchorFitsBoard` in `content/authoring.ts` must keep the same
semantics — if they diverge, the editor and the game disagree about legal placements. The
single exception is `rotationEnabled: true` levels, where the *frame* must fit, because the
four rotation steps sweep the whole frame.

### 6.4 The command state machine

`applyCommand(level, state, command) → Transition` is the only way state changes. It is
pure: it takes a state and returns a new one plus everything the caller needs to render the
difference.

```ts
type Transition = {
  accepted: boolean;
  outcome: Outcome;        // snapped | temporary | tray | rotated | reset | won | <error codes>
  state: PuzzleState;
  mask: Uint8Array;
  changed: readonly number[];   // indices whose value flipped
  becameWon: boolean;
};
```

Commands: `drop`, `return`, `rotate`, `reset`. Rules worth knowing:

- Once `phase === 'won'`, every command except `reset` is rejected with `outcome: 'won'`.
- `return` preserves the piece's current `turns`.
- `rotate` is rejected with `rotation-disabled` unless `level.rotationEnabled`, and with
  `out-of-bounds` if the rotated cells would leave the board at the current position.
- `drop` in `placement: 'anchors'` levels searches the piece's own anchors for the nearest
  one within **d² ≤ 36** logic cells that also `fitsBoard`; ties keep the earlier anchor.
  No anchor in range → `temporary`.
- `drop` in `placement: 'free'` levels calls `nearestGridOrigin` instead, producing a
  `placed` state, but **still reports `outcome: 'snapped'`** so FTUE, telemetry and the snap
  effect have one code path.
- Victory is checked after `rotate` and `drop`; `becameWon` fires exactly once.

`changed` is the diff channel that lets `BoardRenderer` repaint only the flipped cells
instead of the whole 20 480-cell mask.

**Duplicated constant warning:** the snap radius `d² ≤ 36` appears in both
`domain/session.ts` and `application/drag.ts` (for the live preview). They must change
together.

### 6.5 Campaign rules — `domain/campaign.ts`

- `levelAccess(manifest, completed, id, mode)` → `{ unlocked, completed, available }`.
  `order === 1` is always unlocked; otherwise the predecessor by `order` must be completed.
  `available` means `status === 'approved'`, or `validated` too when `mode === 'harness'`.
- `resolveNextCampaignLevel` picks the first unlocked + available + incomplete level, and
  falls back to the last approved completed level (type `'replay'`) rather than ever
  pointing at an unavailable level — a defensive measure against crashing the Continue
  button while a chapter is half-authored.
- `resolveMapCompletedLevels` lets the dev harness *pretend* levels up to a given id are
  complete so the constellation map can be reviewed, without writing anything to real
  progress.

---

## 7. The application layer

### 7.1 `PlayController`

The single façade between input and the domain. It owns the `PuzzleState`, a cached
`committedMask`, the current drag session and the selected piece, and exposes one read
model:

```ts
type PlayViewSnapshot = {
  levelId; phase; showTarget; snappedCount; totalPieces; canRotate;
  selectedPieceId; dragPreviewMask; snapCandidateId; dragInfo; committedMask;
};
```

Scenes never read the domain directly — they call `getSnapshot()` and render it. Every
mutation funnels through the private `commitState(next, mask)` so the cached mask can never
drift from the state (`tests/playControllerCache.test.ts` guards this).

Input handlers: `onPointerDown` (hit-tests pieces in reverse order so the topmost wins),
`onPointerMove`, `onPointerUp`, `onPointerCancel`, `onRotate`, `onReset`, `onToggleTarget`.

Progress is written in exactly two places — after a winning `onPointerUp` and a winning
`onRotate` — and only when `isCampaign` is true. Harness play never saves.

### 7.2 `drag.ts`

`beginDrag` / `updateDrag` / `finishDrag` / `cancelDrag`. `updateDrag` finds the snap
candidate and can compute a preview mask; `PlayController` currently passes
`computePreviewMask: false` and reuses the previous update, which keeps per-frame work low
during a drag.

### 7.3 Ports

`progressPort.ts` declares both the storage port and the repository interface:

```ts
type StoragePort = { getItem(key): string | null; setItem(key, value): void };

type Progress = {
  version: 1;
  campaignRevision: string;
  completed: string[];
  settings: { showTarget; reducedMotion; haptics; music; sfx };
};

interface ProgressRepository {
  read(); complete(id); setShowTarget(b); setReducedMotion(b);
  setHaptics(b); setMusic(b); setSfx(b); reset();
}
```

Every method returns a `LoadResult` carrying `{ progress, recovered, persistence }`, so the
UI can tell the player when storage is unavailable (`'memory-only'`) or when corrupt data
was recovered.

Also here: `telemetry.ts`, `ftue.ts` (first-time user experience step logic, currently
exercised by tests only) and `fixtureRunner.ts` (`runFixtureSolution`, which solves the M0
technical fixture in `content/fixtures.ts`).

---

## 8. Infrastructure adapters

| File | Role |
|---|---|
| `progressRepository.ts` | `localStorage` implementation. Keys `mirror.rebuild.progress.v1` and `mirror.rebuild.progress.recovery`. Corrupt or schema-mismatched data is copied to the recovery key and reset. Falls back to an in-memory store when storage throws. |
| `lifecycle.ts` | Capacitor `App` listeners: hardware back, background (pause music, sleep the Phaser loop), resume. |
| `capacitorHaptics.ts` / `haptics.ts` | Haptic port and its Capacitor adapter. |
| `music.ts` / `sfx.ts` | The two audio services, built from environment adapters so they are testable. |
| `browserAudioEnv.ts` | Wraps `Audio`/Web Audio for the services above. |
| `synthSfxDriver.ts` | Plays the procedurally rendered `AudioBuffer`s. |
| `audioManifest.ts` | Music file URLs. |
| `playtestRecorder.ts` | Records play sessions to `mirror.rebuild.playtest.v1`. **Not instantiated anywhere** — dead code kept on purpose. |

---

## 9. The presentation layer

### 9.1 Scenes and the director

Scenes: `BackgroundScene` (always-on backdrop), `SplashScene`, `MenuScene`,
`LevelSelectScene` (the constellation map), `PlayScene`, `FixtureScene` (registered but
unreachable at runtime).

Transitions do **not** go through `scene.start()` directly. `transitions/SceneDirector.ts`
owns them:

- `SceneHost` is an interface (`start`, `restart`, `stop`, `setInputEnabled`,
  `setCameraAlpha`, `setMood`, `armSkip`, `disarmSkip`, `onStep`) with `PhaserSceneHost` as
  its only implementation — so the director itself is testable without Phaser
  (`tests/sceneDirector.test.ts`).
- `Choreographed` is the interface a scene implements to describe its own `playIn` /
  `playOut` against a `TransitionTimeline`.
- `director.go(...)` runs out-choreography, swaps scenes, runs in-choreography, cross-fades
  the sky mood and tells the music service which track to move to. `director.skip()`
  collapses a running transition — wired to both the hardware back button and the
  backgrounding handler.
- `routes.ts` names each route; `TRANSITION_TOKENS.routes` holds its timing.

### 9.2 Design tokens

`designTokens.ts` is a **leaf module: it imports nothing**, and that is enforced by
convention and tests. It exports `COLOR_TOKENS`, `COLOR_NUMBERS`, `TYPO_TOKENS`,
`LAYOUT_TOKENS`, `VICTORY_CARD`, `GRID_TOKENS`, `GLASS_TOKENS`, `PIECE_TOKENS`,
`ANIM_TOKENS`, `TRANSITION_TOKENS`, `FEEDBACK_TOKENS`, `VICTORY_TOKENS`, `DEPTH_TOKENS`,
`AUDIO_TOKENS`, `GLOW_TIERS`, `SCREEN_FOCUS`.

Two rules that are enforced by tests rather than by review:

- **Colour discipline.** `tests/bannedColors.test.ts` scans all of `src/` for colours
  outside the three approved families. This test exists because `#4ECDC4` reached
  production twice before it did.
- **Glow is state, not decoration.** `GLOW_TIERS` is the only source of glow values and
  `SCREEN_FOCUS` names the single tier-3 element each screen is allowed.

`MOTION_FAMILIES` deliberately lives in `transitions/motion.ts`, **not** in
`designTokens.ts`: a family table referencing `EaseName` would force `designTokens.ts` to
import, breaking its leaf status and creating a cycle. The families are `ui`, `glass`,
`magic` and `piece`; `piece` carries no ease because piece motion is integrated by
`POSE_TAU` in `pieceMotion.ts`. `backOut` sits outside the families on purpose.

`motion.ts` also owns the global motion scale (`setMotionScale(0)` for reduced motion) and
`scaleTiming`, so accessibility is a single multiplier rather than a branch in every tween.

### 9.3 Layout

`layout.ts` is pure geometry: `computeLayout`, `canvasToGrid`, `gridToCanvas`,
`pieceBoardOrigin`, `pieceHitbox`, `pieceCenterCanvas`, `pieceRadiusPx`,
`trayPieceRadiusPx`, `piecePolygonCanvas`, `piecePolygonAround`, `traySlotWidth`,
`trayWellRects`. The board is 640 × 800 px — exactly **5 px per logic cell** against the
128 × 160 grid.

The victory card is bottom-constrained: top-anchored at `trayBounds.y - 4`, height 262, so
its bottom lands at 1274 of 1280.

### 9.4 Drawing

`BoardRenderer` consumes `changed` indices and the mask to repaint incrementally.
`GridPainter`, `JewelShape`, `PieceView`, `PieceTextureCache`, `TextureFactory` and
`polygonClip` handle the actual shapes. Two traps recorded from past bugs:

- `JewelShape` with `variant: 'target'` both fills **and** dash-strokes. Drawing target
  pieces one at a time double-strokes every shared edge, which reads as a seam through the
  figure. Merging the boundary requires splitting edges at vertices so duplicates cancel.
- `PieceView` derives both scale and shadow from one `lift` scalar
  (`1 + (liftScale - 1) * lift`). A second tween on scale multiplies against the lift
  instead of replacing it — changes to how a piece lifts belong in the easing, not in a new
  tween.
- Fitting a figure into a **diamond** uses `|x| + |y| <= r`, measured on the drawn vectors,
  not an inscribed box on the rasterised mask. `|x| + |y|` is convex, so its maximum over a
  polygon is always at a vertex.

### 9.5 Feedback

`feedback/FeedbackDirector.ts` turns domain outcomes into sound, haptics and animation.
`feedbackEvents.ts` defines the event vocabulary, `parityDiff.ts` computes what visually
changed, `audioCues.ts` and `hapticCues.ts` map events to channels, and
`victorySequence.ts` describes the skippable ~2800 ms win timeline.

`PlayScene` can reach the won state by two routes — the live victory timeline and
`showWinModal` on re-entry — and both must end on the same screen. `setVictoryMode` covers
the frame and the tray; dimming the sky belongs to the timeline alone.

### 9.6 Internationalisation

`i18n.ts` holds `TRANSLATIONS` for `vi` and `en`, `MENU_TAGLINES`, `LEVEL_TITLES_EN`,
`getLocale` / `setLocale` / `onLocaleChange`, and `t(key, params)`. `TranslationKey` is
derived as `keyof typeof TRANSLATIONS.vi`, so the Vietnamese table is the source of truth
and a missing English key is a type error.

---

## 10. Audio

Two distinct subsystems.

**`src/audio-synth/`** is a portable procedural audio engine: `patch.ts` (the patch model),
`dsp.ts`, `presets.ts`, `render.ts`, `normalize.ts`, `wav.ts`, `webaudio.ts`, `report.ts`.
It **imports nothing outside its own folder**, and `tests/audioSynthPortable.test.ts`
enforces that recursively for every import form, so the folder can be copied into another
project as-is. Concepts and porting steps are in `src/audio-synth/README.md`.

**`src/content/audio/`** holds the patches themselves (`bell`, `hollow`, `shimmer`,
`stingerWin`, `swish`, `tapSoft`, `thud`, `tick`). `MUSIC_ROOT_HZ` lives in its own leaf
module `root.ts` because the patches read it while their module evaluates, and the barrel
`index.ts` imports the patches — exporting the constant from the barrel creates a cycle that
throws `ReferenceError` at load time.

At boot, every patch is rendered once into an `AudioBuffer` through the live Web Audio
context (timed and logged in dev). If rendering throws, the game continues with a silent
driver. The resulting `{ music, sfx }` pair is published into `game.registry` under
`AUDIO_REGISTRY_KEY = 'audio'`; `audioServices(scene)` falls back to `SILENT_AUDIO` when
called before Phaser's `ready` event.

`scripts/audio-author.ts` (`npm run audio:author`) renders patches offline, and
`audiolab.html` + `src/devtools/audiolab/` is the browser tool for designing them.

---

## 11. The content pipeline

This is the part of the system most likely to change, so it is worth reading as a chain.

### 11.1 The three representations of a level

| Representation | File | Who writes it | Purpose |
|---|---|---|---|
| **Source** | `src/content/sources/<id>.ts` | a human (or the Studio) | Authoring input. TypeScript, so it can call `kit.ts` helpers, compute mirrors and loops. |
| **Document** | `src/content/levels/<id>.json` | **generated only** | `LevelDocument`, `schemaVersion: 1`. The shipped data. |
| **Level** | in memory | `validateLevel` | The runtime `Level` the domain consumes, with `targetMask` as a `Uint8Array`. |

**Never hand-edit `levels/<id>.json`.** Change the source and re-run `content:author`.

`LevelDocument` carries more than the game needs: `learningObjective`, `victoryVerse`,
`difficultyEstimate`, `distractors[].reason` and `ftueSteps`. That is deliberate — it makes
a source → JSON → source round trip lossless for the prose. What a round trip *does* lose is
`kit.ts` helper calls, which get inlined into literals; hand-written header comments are
preserved separately by `preserveHeaderComment`.

### 11.2 Authoring helpers — `kit.ts`

Centre-based placement rather than corner-based: `piece(...)`, `mirrorX`, `mirrorY`,
`concentric`, `row`, plus the decoy-offset presets `NUDGE` (`[8,0] [-8,0] [0,8]`) and
`CROSS` (adds `[0,-8]`), and `DECOY_IDS = ['B','C','D','E','F']`.

Anchor convention: **`A` is the true anchor** (`TRUE_ANCHOR_ID`), `B`–`F` are decoys. All
anchor coordinates must be multiples of `ANCHOR_STEP = 8`.

### 11.3 `authorLevel` — the generation step

`npm run content:author -- <id>` (or `--all`) runs `scripts/author-level.ts` →
`authorLevel(source)`:

1. `checkSourceGeometry` — anchors on the 8-grid, pieces inside the board.
2. `filterDecoys` (rule KIT-03) — drops decoy anchors that are out of bounds, or that clash
   with an identical piece's `A` anchor, unless a sample solution protects them. Dropped
   decoys are reported, not silently removed.
3. `buildLevelDocument` — the target mask is computed as the **XOR of sample solution 1**;
   the author does not draw the target by hand.
4. The solver proves the puzzle: authoring **fails if a solution using fewer pieces exists**.
5. Outputs: `src/content/levels/<id>.json`, `../docs/testing/levels/<id>.svg` (preview) and
   `../docs/testing/levels/<id>-report.md` (`authoringReport.ts`).

### 11.4 The solver — `content/solver.ts`

An exhaustive search with a hard budget: `SOLVER_LIMIT = 5_000_000`.

- `representativeTurns(piece, rotationEnabled)` collapses symmetric rotations so a square is
  not searched four times.
- `buildPoseSpace` enumerates every legal `(x, y, turns)` pose per piece as an `Int32Array`
  of cell indices.
- `solvePoseSpace` walks combinations with `canonicalKey` deduplication (so two identical
  pieces swapping places is one solution, not two) and `balancedSplit` / `mulberry32` for
  deterministic meet-in-the-middle partitioning.
- `solveLevel(doc)` is the entry point used by authoring, validation and the Studio.

Determinism matters here: the same document must always produce the same verdict, which is
why the PRNG is seeded rather than `Math.random`.

### 11.5 `validateLevel` — the gate

`content/validate.ts` is a hand-written validator returning
`{ ok: true, level } | { ok: false, issues }`, where each issue is
`{ levelId, field, code }`. Roughly forty distinct codes cover: root shape, ids, titles,
chapter/order, piece objects, frame sizes, cell bounds, shape/orientation agreement
(`shape-cells-mismatch`, `invalid-frame-for-shape`), anchor ids and coordinates, target
bounds, and the sample solutions.

Content rules enforced here, not in review:

- Chapters 1–3 must have `rotationEnabled: false`; chapter 4 must have it `true`
  (`chapter-rotation-disabled` / `chapter-rotation-required`).
- Chapter 1 solutions may not overlap (`chapter-1-no-overlap`) and may not use turns.
- Every sample solution must actually reproduce the target (`solution-target-mismatch`).
- Free-placement levels may not declare decoys or extra anchors, and their anchors must sit
  on the grid.
- `allowUnproven: { reason }` is the explicit reviewer escape hatch when the solver cannot
  prove uniqueness.

### 11.6 Registration and loading

Two registries, both hand-maintained (the Studio can edit them programmatically):

- `manifest.ts` — `campaignManifest: readonly ManifestEntry[]` with `id`, `title`,
  `chapter`, `order`, `contentRevision`, `status` and optional `dataPath`. **`order` is the
  global campaign sequence**, not per-chapter, and it drives unlocking.
- `catalog.ts` — a static `import ... from './levels/<id>.json'` per level plus a
  `documents` map. Static imports are what let Vite bundle and tree-shake level data.

`loadLevel(id, mode, studioLevelsOverride?)`:

- `campaign` → the entry must exist and be `approved`; otherwise `unavailable:<id>`.
- `harness` → manifest (`validated` or `approved`) → `devLevels.ts` → Studio levels, in that
  order. Studio levels are discovered with `import.meta.glob('./studio/levels/*.json')`,
  **gated behind `import.meta.env.DEV`**, so no Studio content can ever reach a production
  bundle.
- Every path runs `validateLevel` before returning; failures throw
  `validation-failed:<id> -> <issues>`.

### 11.7 Status lifecycle

```
planned → authored → validated → approved
```

`planned` has no `dataPath`. `validated` means the tooling is satisfied. **`approved` means
a human played it.** Only `approved` levels are reachable in campaign mode, and
`content:validate -- --release` requires 28 approved levels — which is why `build:release`
fails today at 22 of 28 (chapter 4 is still `planned`).

Approval is a commit, not a flag flip: status change in `manifest.ts`, a content review note
under `../docs/testing/mirror-rebuild/<id>-content-review.md`, an update to the chapter
review file, and a CHANGELOG entry.

### 11.8 The CLIs

| Command | Script | Does |
|---|---|---|
| `content:new -- <id> [--from <id>] [--title "<t>"]` | `scripts/new-level.ts` | Scaffolds `sources/<id>.ts` and registers it in `sources/index.ts` **only** — never manifest or catalog. |
| `content:author -- <id>` / `--all` | `scripts/author-level.ts` | JSON + SVG + report (§11.3). |
| `content:validate [-- --release]` | `scripts/validate-content.ts` | Validates every manifest level; `--release` additionally demands 28 approved. |
| `content:promote` | `scripts/promote-level.ts` | Studio level → campaign level (§12.3). |
| `content:gallery` | `scripts/render-kit-gallery.ts` | Renders the shape kit for visual review. |
| — | `scripts/shoot-level.sh` | Headless-Chrome screenshots; needs the dev server running. |

---

## 12. The Studio (dev-only level editor)

### 12.1 Shape

A plain-DOM single-page app at `studio.html` → `src/studio/main.ts`. No framework: a
`StudioState`, a `studioReducer(state, action)`, and four view factories that each receive
`{ getState, dispatch }` and re-render on demand.

| Module | Role |
|---|---|
| `state.ts` | `StudioState`, `StudioAction`, `studioReducer`, `isDirty`, `createInitialState`, `cloneLevelSource`, `computeDecoyReason` |
| `library.ts` | left panel: level list; selection navigates via `window.location.hash` |
| `palette.ts` | centre top: shape palette |
| `boardView.ts` | centre: the editable board |
| `inspector.ts` | right panel: per-piece and per-level fields |
| `geometry.ts` | editor-side geometry helpers |
| `orientationOptions.ts` | the orientation picker (triangle families, §6.2) |
| `keys.ts` | `keyToAction` — keyboard shortcuts as data |
| `checkQueue.ts` | debounces solver runs while the author types |
| `solverWorker.ts` | `handleCheck` — runs the solver off the interaction path |
| `api.ts` | the four `fetch` wrappers below |

Every edit `dispatch`es, re-renders, and enqueues a solver check — so the author sees
solvability feedback continuously rather than at save time.

### 12.2 The dev-server bridge

`scripts/studio/studioPlugin.ts` is a Vite plugin loaded **only when `command === 'serve'`**
(see `vite.config.ts`). It adds four routes under `/__studio/`:

| Route | Method | Backed by |
|---|---|---|
| `/__studio/list` | GET | `listStudioLevels` |
| `/__studio/save` | POST | `saveStudioLevel` |
| `/__studio/delete` | POST | `deleteStudioLevel` |
| `/__studio/promote` | POST | `promoteStudioLevel` |

Request bodies are capped at 1 MB. The handler is exported as a pure
`handleStudioRequest(req, res, options)` with injectable `root`, `manifestIds` and
`sourceIds`, which is how `tests/studioPlugin.test.ts` exercises it without a server.

`content/studioStore.ts` is the filesystem side: ids must match
`STUDIO_ID_PATTERN = /^[a-z0-9-]{1,32}$/`, and a save writes both a source and a generated
document into `src/content/studio/`.

Because the plugin only exists in `serve`, and `catalog.ts` only globs studio JSON under
`import.meta.env.DEV`, the Studio is structurally incapable of shipping.

### 12.3 Promotion — the round trip

`content/promote.ts` turns a Studio draft into a campaign level, which means touching four
files at once:

1. `sourceFromDocument` + `serializeLevelSource` → write `sources/<id>.ts`
   (`preserveHeaderComment` keeps a hand-written comment block).
2. `registerInCatalog` → insert the import and the `documents` entry in id order.
3. `updateManifestLine` / `bumpRevision` → manifest entry and `contentRevision`.
4. `updateAuthoredLevels` → keep the `AUTHORED_LEVELS` set in the content test in sync.
5. Re-run `authorLevel` → regenerate JSON, SVG and report.
6. Delete the Studio draft (`deleteStudioLevel`).

**`promoteStudioLevel({ overwrite: true })` is the only sanctioned way to update an existing
campaign level from the Studio.** It always downgrades the manifest entry from `approved`
back to `validated`, forcing a human to replay and re-approve before the level can ship
again.

---

## 13. Naming conventions

### Files

| Kind | Convention | Examples |
|---|---|---|
| Class / Phaser scene / view object | `PascalCase.ts` | `PlayScene.ts`, `BoardRenderer.ts`, `FeedbackDirector.ts`, `JewelShape.ts` |
| Function or data module | `camelCase.ts` | `layout.ts`, `designTokens.ts`, `playController.ts`, `authorLevel.ts` |
| Barrel | `index.ts` | `content/sources/index.ts`, `content/audio/index.ts` |
| Template / scaffold | leading underscore | `content/sources/_template.ts` |
| Level source & document | the level id | `sources/3-10.ts`, `levels/3-10.json` |
| Test | `<subject>.test.ts`, flat in `tests/` | `playController.test.ts`, `studioStore.test.ts` |
| Node CLI | `kebab-case.ts` in `scripts/` | `author-level.ts`, `validate-content.ts` |

Note the deliberate inconsistency: `playController.ts` is camelCase although it exports a
class, because the module is the use case and the class is an implementation detail;
`BoardRenderer.ts` is PascalCase because the class *is* the module.

### Symbols

- Types and classes: `PascalCase` (`LevelDocument`, `PlayViewSnapshot`, `SceneDirector`).
- Functions and variables: `camelCase` (`loadLevel`, `applyCommand`, `campaignManifest`).
- Module-level constants: `SCREAMING_SNAKE_CASE` (`GRID_WIDTH`, `ANCHOR_STEP`,
  `SOLVER_LIMIT`, `TRUE_ANCHOR_ID`, `AUDIO_REGISTRY_KEY`).
- Token bundles: `*_TOKENS` (`COLOR_TOKENS`, `LAYOUT_TOKENS`, `FEEDBACK_TOKENS`). If it is a
  design value, it belongs in a `*_TOKENS` object, not inline.
- Event / outcome / issue codes: lowercase kebab strings (`'out-of-bounds'`,
  `'rotation-disabled'`, `'chapter-1-no-overlap'`, `'unavailable:<id>'`). They are matched
  by value in tests, so renaming one is a breaking change.
- Ports: interface named for the capability (`StoragePort`, `ProgressRepository`,
  `SceneHost`, `MusicPort`); the adapter is named for the technology
  (`createProgressRepository`, `PhaserSceneHost`, `capacitorHaptics`, `browserAudioEnv`,
  `synthSfxDriver`).
- Factories: `create*` (`createPuzzle`, `createProgressRepository`, `createBoardView`,
  `createCheckQueue`). Classes are reserved for things with a lifecycle.

### Domain data

- **Level id**: `<chapter>-<n>` (`1-1` … `3-10`). Sorting is by the manifest's `order`
  field, never by string comparison — `compareLevelIds` exists for the places that must sort
  ids directly, because `'3-10' < '3-2'` lexically.
- **Piece id**: short lowercase author-chosen strings, unique within a level.
- **Anchor id**: `A` is the true anchor; `B`–`F` are decoys.
- **`contentRevision`**: a human slug plus a version — `'song-tinh-v2'`, `'hai-dang-v1'`, or
  `'v0.1'` for unwritten levels. `bumpRevision` increments the trailing number.
- **Level title**: Vietnamese, title case (`Vương Miện Bình Minh`). English titles live
  separately in `i18n.ts` → `LEVEL_TITLES_EN`.
- **Catalog import alias**: an unaccented camelCase transliteration of the title
  (`vuongMien`, `kimTuThap`, `saoBatPhuong`), generated by `constNameFromTitle`.

### Storage and identifiers

- localStorage keys: `mirror.rebuild.<thing>.v<n>` —
  `mirror.rebuild.progress.v1`, `mirror.rebuild.progress.recovery`,
  `mirror.rebuild.playtest.v1`.
- Campaign revision string: `'oracle-v1'`. Changing it resets every player's progress (the
  old payload is copied to the recovery key first).
- Android application id: `com.nkhanh.mirror.rebuild`.
- Studio HTTP routes: `/__studio/<verb>`; the double underscore marks them as dev-only.

### Language

Code comments in this repo are **Vietnamese**, inherited from the original authors.
`AGENTS.md` requires English for specs, plans, `docs/ai/*`, CHANGELOG entries and commit
messages — and for new code comments. `README.md` stays Vietnamese. Do not translate
existing Vietnamese docs or comments unless asked.

---

## 14. Build, release and Android

```
npm run dev              vite (studio plugin active; harness mode available)
npm run typecheck        tsc --noEmit
npm test                 vitest run
npm run build            typecheck + vite build  → dist/
npm run build:release    content:validate --release && build
npm run android:sync     build + cap sync android
```

`vite.config.ts` declares exactly one rollup input: `index.html`. `studio.html` and
`audiolab.html` are therefore **never built** — they exist only under the dev server. This
is the single most important release-safety property of the current architecture.

Android: Capacitor copies `dist/` into `android/app/src/main/assets/public`. Debug APK via
`cmd /c gradlew.bat assembleDebug` from `game-next/android/`. `android/local.properties`,
`android/build/` and `dist/` are never committed.

Before pushing: `npm test`, `npm run build`, then `git diff --check` and `git status` from
the repo root.

---

## 15. Testing strategy

90 flat `tests/*.test.ts` files, Vitest defaults, Node environment, no `vitest.config.*`.

The strategy is visible in the file names: the heavy coverage sits on pure modules —
`session`, `drag`, `playController`, `solver`, `authoring`, `authorLevel`, `validate` (via
`content`/`levelContent`), `layout`, `motion`, `choreography`, `promote`, `studioStore`,
`studioState`, `studioPlugin`. Rendering is tested through its Phaser-free helpers.

Three tests enforce architecture rather than behaviour, and are worth knowing before you
touch anything:

- `audioSynthPortable.test.ts` — `src/audio-synth/` may not import outside itself.
- `bannedColors.test.ts` — no colours outside the approved families anywhere in `src/`.
- `glowTiers.test.ts` / `designTokens.test.ts` — glow and token discipline.

In-memory `StoragePort` fakes use revision `'oracle-v1'` in the catalog, progress and
playController tests. The only env gate anywhere is `import.meta.env.DEV`; there are no
`VITE_*` variables.

`ANIM_TOKENS.duration.overlapInversionMs` is dead but pinned by a test; the live XOR
feedback uses `FEEDBACK_TOKENS.overlap*`.

---

## 16. Cross-cutting invariants

Short list of things that will bite silently:

1. Grid is 128 × 160. The "128 × 192" comment in `domain/geometry.ts` and the "24 px"
   comment in `application/drag.ts` are **stale**.
2. Snap radius `d² ≤ 36` is duplicated in `domain/session.ts` and `application/drag.ts`.
3. `fitsBoard` and `anchorFitsBoard` must keep identical semantics (cells, not frame) —
   except for rotation-enabled levels, where the frame must fit.
4. Camera zoom is `scene.scale.width / 720`; never reset it to `1.0`.
5. `designTokens.ts` must stay import-free.
6. `MUSIC_ROOT_HZ` must stay out of the `content/audio/index.ts` barrel.
7. `layoutCampaignMap` uses `TEN_NODE_PATTERN` only for exactly ten nodes; every other count
   falls through to `zigzagX`, so chapter node counts can change freely.
8. Studio content reaches the runtime only through `import.meta.env.DEV` globs and the
   `serve`-only Vite plugin. Removing either gate would ship drafts.
9. PowerShell `Copy-Item` / `Test-Path` treat square brackets as wildcards — use
   `-LiteralPath`.

---

## 17. Known gaps and tech debt

Stated plainly, because they shape how much work any change costs:

- **No composition root.** `createProgressRepository(...)` is called in `main.ts` and in
  three scenes independently.
- **Two hand-maintained registries.** A level must be registered in both `manifest.ts` and
  `catalog.ts`; `promote.ts` automates this with regex-based source rewriting
  (`CATALOG_IMPORT_LINE`, `CATALOG_ENTRY_LINE`), which is precise but brittle against
  reformatting.
- **`FixtureScene` is unreachable** at runtime though registered.
- **`playtestRecorder.ts` is never instantiated.**
- **`ftue.ts` is exercised by tests only.**
- **Release is blocked by content, not code**: 22 of 28 levels approved; chapter 4 is
  `planned`, so `build:release` fails by design.
- **The Studio is dev-server-bound.** Add/edit/delete and promote all require a running Vite
  dev server with filesystem access; there is no mode in which a non-developer can author a
  level.
- **Comment language is mixed**: existing comments are Vietnamese, the rule now says
  English, and the open decision about spec language is still unresolved in
  `docs/ai/STATUS.md`.

---

## 18. Where to go next

| Question | Read |
|---|---|
| What is the current task and branch? | `docs/ai/STATUS.md` |
| Which spec or plan covers X? | `docs/ai/DOCS-INDEX.md` |
| Quick agent map + hotspots table | `docs/ai/ARCHITECTURE.md` |
| Rules of engagement for agents | `AGENTS.md` (repo root) |
| Audio engine concepts and porting | `game-next/src/audio-synth/README.md` |
| Recent changes | `CHANGELOG.md` (newest first, under `## Unreleased`) |

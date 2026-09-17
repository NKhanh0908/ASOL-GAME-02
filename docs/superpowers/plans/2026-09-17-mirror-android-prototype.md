# Mirror Android Prototype Implementation Plan

> **For agentic workers:** Execute these tasks in order in this workspace. Check each task against the [approved design](../specs/2026-09-17-mirror-android-prototype-design.md). The user authorized implementation in this session.

**Goal:** Deliver a playable six level Mirror prototype in a portrait web build and an Android Capacitor project, with the parity rule and playtest controls from the spec.

**Architecture:** A Phaser scene owns input and display. Pure TypeScript modules own level data, snapping and grid evaluation. Capacitor packages the built web assets; it does not own gameplay.

**Tech Stack:** TypeScript, Vite, Phaser, Vitest, Capacitor Android.

**Spec:** `docs/superpowers/specs/2026-09-17-mirror-android-prototype-design.md`

## Global Constraints

- Board logic is a 128 × 192 grid; design width is 720 units and initial snap radius is 48 units.
- Android portrait and offline, with six hand authored levels across two chapters.
- No React, Ionic, native gameplay plugin, level select, save, hints, stars, rotation or lighting.
- Win compares the full displayed silhouette mask, allowing alternate placements with the same result.

## File Map

- `game/package.json`, `game/tsconfig.json`, `game/index.html`, `game/vite.config.ts`, `game/capacitor.config.ts`: build and platform setup.
- `game/src/domain/types.ts`: grid, piece and level types.
- `game/src/domain/mask.ts`: occupancy, parity, visible color and silhouette comparison.
- `game/src/domain/levels.ts`: six level definitions and generated target masks from authored solutions.
- `game/src/domain/session.ts`: placement, snap, reset and progression state.
- `game/src/ui/GameScene.ts`: portrait layout, drag input, drawing and feedback.
- `game/src/main.ts`, `game/src/style.css`: browser entry and sizing.
- `game/src/domain/*.test.ts`: meaningful tests for parity, alternate solutions, invalid drops and reset.
- `game/android/`: Capacitor generated Android shell.

---

### Task 1: Web foundation and grid rule

**Files:** Create `game/package.json`, `game/index.html`, `game/tsconfig.json`, `game/vite.config.ts`, `game/src/main.ts`, `game/src/style.css`, `game/src/domain/types.ts`, `game/src/domain/mask.ts`, `game/src/domain/mask.test.ts`.

**Interfaces:** `evaluate(level: Level, placements: Placement[]): Uint8Array` returns one color index per board cell, with zero for empty; `matchesTarget(result: Uint8Array, target: Uint8Array): boolean` compares the visible silhouette only.

- [ ] Add a failing Vitest case for one cell covered by 0, 1, 2 and 3 pieces: visible values are 0, top color, 0, top color. Add a case in which equal silhouettes with different top colors still match.
- [ ] Run `npm test -- --run` in `game/` and confirm the missing implementation fails.
- [ ] Add the smallest typed grid evaluator and web scaffold; keep the evaluator independent of Phaser.
- [ ] Run `npm test -- --run`, `npm run build`, then commit the working foundation.

### Task 2: Six authored levels and session behavior

**Files:** Create `game/src/domain/levels.ts`, `game/src/domain/session.ts`, `game/src/domain/levels.test.ts`, `game/src/domain/session.test.ts`.

**Interfaces:** `levels: Level[]` ordered 1-1 through 2-3; `Session.drop(pieceId, x, y)`, `Session.reset()`, `Session.next()`, `Session.cancelDrag()` own state transitions. Levels declare piece masks and valid anchors; target masks are produced once from authored solution positions and then compared with player output.

- [ ] Write failing tests that every level has a solvable target, 1-1 through 1-3 have no required overlap, 2-1 has a two layer hole, 2-2 has a three layer visible region and 2-3 requires both parity cases.
- [ ] Write failing session tests for nearest valid anchor inside radius 48, rejection outside radius, moving an existing piece, reset, win locking and next level.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Add level data and session transitions with no rendering dependency.
- [ ] Run focused tests and full build; commit the gameplay data and state.

### Task 3: Playable portrait UI

**Files:** Create `game/src/ui/GameScene.ts`; modify `game/src/main.ts`, `game/src/style.css`; add `game/src/ui/layout.ts` if layout calculations need a pure helper.

**Interfaces:** The scene reads `Session` state and `evaluate` output. It displays the board, tray, fixed sample thumbnail, toggleable ghost, reset button, win overlay and next/replay button. Drag cancellation restores the pre-drag position.

- [ ] Add a focused failing test for any pure coordinate mapping or snap layout helper introduced by this task. For Phaser scene input, use a manual interaction checklist because it depends on real pointer events.
- [ ] Implement drawing from the evaluated grid, piece outlines and brief feedback for changed cells; use a single 720 unit portrait coordinate system.
- [ ] Implement pointer drag/drop/cancel, ghost toggle, reset, win lock, next and final replay.
- [ ] Run tests and build. Open the browser build and exercise all six levels using the documented solutions. Commit the playable web build.

### Task 4: Android shell and device verification

**Files:** Create `game/capacitor.config.ts`, `game/android/` via Capacitor; modify `game/package.json`, `.gitignore`, `game/README.md`.

**Interfaces:** `webDir` is `dist`; web assets are bundled locally; portrait orientation is configured in Android.

- [ ] Install matching Capacitor core/CLI/Android packages, initialize only the Android platform, build web, and sync `dist` to Android.
- [ ] Run an Android Gradle build or `npx cap run android` if a device is connected; verify portrait layout, touch drag, reset, all six levels and offline startup. Record any device unavailability explicitly.
- [ ] Document exact web and Android commands, run `npm test -- --run` and `npm run build`, then commit the Android integration.

### Task 5: Final review and delivery

**Files:** Review all changed files; update `game/README.md` and plan status if needed.

- [ ] Re-read every spec section and confirm a corresponding implementation or clearly report a gap.
- [ ] Run fresh tests, TypeScript/build, Android build if tools allow, and inspect `git status`/`git diff`.
- [ ] Push the verified branch to `origin` if GitHub authentication allows; report commit, build evidence, and Android device test status.

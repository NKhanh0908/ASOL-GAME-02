# Custom Level Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent custom level workflow that starts from a built-in level, lets the player compose four fixed shapes, validates the XOR solution, and plays the saved result.

**Architecture:** Keep built-in levels as immutable data and introduce a `LevelRepository` that combines them with versioned `localStorage` records. Make `Session` accept an explicit `Level`, then add separate menu/editor scenes that pass a level id into the existing game scene. The editor reuses the existing grid, mask evaluation and drag rendering instead of creating a second puzzle rule set.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Capacitor WebView `localStorage`, existing 128 × 192 grid and XOR mask functions.

**Spec:** `docs/superpowers/specs/2026-09-18-custom-level-editor-design.md`

## Global Constraints

- Keep the target silhouette from the selected built-in level.
- Support fixed, non-rotating square, large triangle, small triangle and diamond pieces.
- Small triangle uses 24 cells of width; large triangle uses 48 cells of width.
- Save only when the composed solution matches the target mask 100%.
- Persist custom records locally under `mirror.custom-levels.v1`.
- Do not add a dependency, online sync, account system, rotation or per-cell artwork editor.
- Reuse `evaluate` and `matchesTarget`; do not create a second win rule.
- Every commit that changes code or docs updates `CHANGELOG.md`.

---

### Task 1: Shape catalog and level repository

**Files:**
- Modify: `game/src/domain/shapes.ts`
- Create: `game/src/domain/levelRepository.ts`
- Create: `game/src/domain/levelRepository.test.ts`
- Modify: `game/src/domain/types.ts`
- Test: `game/src/domain/shapes.test.ts`
- Modify: `CHANGELOG.md`

**Interfaces:**
- `smallTriangle(size = 24): Cell[]` returns the fixed upward triangle with half the large triangle width.
- `LevelRepository.list(): Level[]` returns built-in levels followed by valid saved custom levels.
- `LevelRepository.get(id: string): Level | undefined` resolves either source.
- `LevelRepository.save(record: CustomLevelRecord): void` validates and upserts one custom record.
- `LevelRepository.remove(id: string): void` deletes only a custom record.
- `LevelRepository.clearForTests(): void` clears the storage adapter in tests.

- [ ] **Step 1: Write failing shape tests.** Add assertions that `smallTriangle(24)` is upward, stays inside a 24-cell bounding box, and is smaller than `triangle(48)`.
- [ ] **Step 2: Run the focused shape test.** Run `npm test -- src/domain/shapes.test.ts`; expect the missing export/failed size assertion.
- [ ] **Step 3: Add the shape and storage types.** Add `smallTriangle` and a `CustomLevelRecord` type extending the level fields with `sourceLevelId`, `custom: true`, `createdAt` and `updatedAt`.
- [ ] **Step 4: Write repository RED tests.** Cover save/read, update by id, delete, malformed JSON ignored, built-in levels preserved, and records with invalid pieces rejected.
- [ ] **Step 5: Run the repository tests and verify the expected failures.** Run `npm test -- src/domain/levelRepository.test.ts`.
- [ ] **Step 6: Implement the repository.** Use `globalThis.localStorage` when available and an in-memory fallback for tests. Parse only versioned JSON arrays, validate ids, piece cells, placements and `custom: true`, and catch quota/parse errors without throwing during list.
- [ ] **Step 7: Run focused tests.** Run `npm test -- src/domain/shapes.test.ts src/domain/levelRepository.test.ts`; expect all pass.
- [ ] **Step 8: Commit.** Run `git add game/src/domain game/src/domain/types.ts CHANGELOG.md` and commit `feat: add custom shape catalog and level repository`.

### Task 2: Session and custom-level validation

**Files:**
- Modify: `game/src/domain/session.ts`
- Modify: `game/src/domain/session.test.ts`
- Modify: `game/src/domain/levelRepository.ts`
- Modify: `CHANGELOG.md`

**Interfaces:**
- `new Session(levelOrIndex?: number | Level)` accepts the existing numeric built-in index for compatibility and an explicit `Level` for custom play.
- `Session.levelId: string` returns the active level id.
- `Session.canSaveSolution(level: Level, placements: Placement[]): boolean` uses `matchesTarget(evaluate(level, placements), evaluate(level, level.solution))` and requires at least one placement.

- [ ] **Step 1: Write failing session tests.** Add a test that constructs `Session(customLevel)` without mutating built-ins, drops/removes pieces, and validates a custom level with `canSaveSolution`.
- [ ] **Step 2: Run the focused test.** Run `npm test -- src/domain/session.test.ts`; expect constructor/type failures.
- [ ] **Step 3: Refactor the session constructor.** Store a `Level` instance instead of indexing the global array; preserve numeric construction by resolving from built-ins through the repository.
- [ ] **Step 4: Add validation.** Implement the static or exported validation helper using existing mask functions; reject empty or out-of-bounds placements before repository save.
- [ ] **Step 5: Run regression tests.** Run `npm test -- src/domain/session.test.ts src/domain/levels.test.ts`; expect pass with existing built-in behavior unchanged.
- [ ] **Step 6: Commit.** Update `CHANGELOG.md` and commit `refactor: let sessions play explicit custom levels`.

### Task 3: Level menu and game routing

**Files:**
- Create: `game/src/ui/LevelMenuScene.ts`
- Create: `game/src/ui/levelMenu.test.ts`
- Modify: `game/src/ui/GameScene.ts`
- Modify: `game/src/main.ts`
- Modify: `game/src/ui/layout.ts`
- Modify: `game/src/ui/theme.ts`
- Modify: `CHANGELOG.md`

**Interfaces:**
- `LevelMenuScene` reads `LevelRepository.list()`, renders built-in/custom entries, and starts `Mirror` with `{ levelId }`.
- `GameScene.init(data?: { levelId?: string }): void` resolves the selected level before `create()`.
- `GameScene` returns to `LevelMenuScene` after reset/menu navigation without losing saved records.

- [ ] **Step 1: Write the routing test contract.** Add a small menu test for built-in/custom labels and a GameScene initialization test that resolves an explicit id; keep Phaser rendering out of domain tests.
- [ ] **Step 2: Run the focused tests and capture the RED state.** Run `npm test -- src/ui/levelMenu.test.ts src/domain/session.test.ts`; expect the menu module and explicit-level routing assertions to fail.
- [ ] **Step 3: Add the menu scene.** Use existing theme tokens and responsive canvas coordinates; include `Custom Level`, built-in level buttons, custom `Chơi`, `Chỉnh sửa`, and `Xóa` actions. Ask for deletion confirmation through an in-scene confirmation state.
- [ ] **Step 4: Route the main entry to the menu.** Register `[LevelMenuScene, GameScene]` and make the menu the initial scene; Task 4 adds `CustomLevelScene` to the same scene list.
- [ ] **Step 5: Make GameScene resolve selected levels.** Replace its private default-only session construction with `Session(repository.get(levelId) ?? levels[0])`; keep existing drag rendering and gameplay intact.
- [ ] **Step 6: Run tests/build.** Run `npm test` and `npm run build`; inspect the menu at 390 × 844 and 720 × 1280.
- [ ] **Step 7: Commit.** Update `CHANGELOG.md` and commit `feat: add level menu and custom level routing`.

### Task 4: Custom level editor

**Files:**
- Create: `game/src/ui/CustomLevelScene.ts`
- Create: `game/src/ui/customLevelEditor.ts`
- Create: `game/src/ui/customLevelEditor.test.ts`
- Modify: `game/src/main.ts`
- Modify: `game/src/ui/layout.ts`
- Modify: `game/src/ui/theme.ts`
- Modify: `CHANGELOG.md`

**Interfaces:**
- `CustomLevelDraft` contains `sourceLevelId`, `title`, `pieces: PieceDefinition[]`, and `solution: Placement[]`.
- `createPiece(kind: 'square' | 'triangle' | 'smallTriangle' | 'diamond', id: string): PieceDefinition` returns fixed-color, fixed-orientation cells and empty anchors.
- `validateDraft(draft: CustomLevelDraft, target: Uint8Array): { ok: true } | { ok: false; reason: string }` checks title, at least one piece, bounds, duplicate ids, and exact XOR match.
- `CustomLevelScene.init(data: { sourceLevelId: string; editId?: string }): void` loads a source target and optional existing draft.

- [ ] **Step 1: Write failing editor helper tests.** Cover all four shape kinds, small triangle width 24, grid bounds, duplicate ids, invalid mask, and valid exact-mask draft.
- [ ] **Step 2: Run the focused test.** Run `npm test -- src/ui/customLevelEditor.test.ts`; expect missing helper failures.
- [ ] **Step 3: Implement pure editor helpers.** Build pieces from the existing shape functions, assign stable ids, convert grid positions to placements, and delegate validation to `evaluate`/`matchesTarget`.
- [ ] **Step 4: Build the editor scene.** Show the source ghost target, a large grid, four shape buttons, selected-piece state, delete action, title input, validation message and save/cancel buttons. Use the same `drawPiece`, overlap preview and snap radius conventions as `GameScene`.
- [ ] **Step 5: Persist only valid drafts.** Convert a valid draft to `CustomLevelRecord`, generate an id with a `custom-` prefix, and call `LevelRepository.save`; edit mode keeps the existing id and `createdAt`.
- [ ] **Step 6: Add mobile-safe controls.** Keep buttons at least the existing 64px canvas height, prevent browser text selection during drag, and keep the editor usable at 360 × 640 and 390 × 844.
- [ ] **Step 7: Run tests/build.** Run `npm test`, `npm run build`, and capture editor screenshots at both phone viewports.
- [ ] **Step 8: Commit.** Update `CHANGELOG.md` and commit `feat: add persistent custom level editor`.

### Task 5: End-to-end verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `game/README.md`
- Modify: `docs/testing/2026-09-17-mirror-redesign.md`
- Create: `docs/testing/custom-level-editor.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes the repository, menu, editor and explicit-level session from Tasks 1–4.
- Produces documented browser evidence and the final web/Android build status.

- [ ] **Step 1: Run the browser flow.** Start the web app, choose built-in 1-1, add all four shape types, arrange a valid custom solution, save it, reload, open it, play it, edit it, and delete it.
- [ ] **Step 2: Capture evidence.** Save real render screenshots before/after save and at 360 × 640, 390 × 844 and desktop; record any interaction that remains manual.
- [ ] **Step 3: Run final checks.** Run `npm test`, `npm run build`, `npm run android:sync`, and `android/gradlew.bat assembleDebug`; do not claim physical Android playtest without a device.
- [ ] **Step 4: Update docs.** Document custom level storage, reload behavior, shape sizes, known local-only persistence and the existing Phaser bundle warning.
- [ ] **Step 5: Commit verification.** Run `git diff --check`, stage `README.md`, `game/README.md`, `docs/testing/2026-09-17-mirror-redesign.md`, `docs/testing/custom-level-editor.md`, and `CHANGELOG.md`, then commit `docs: verify custom level editor flow`.

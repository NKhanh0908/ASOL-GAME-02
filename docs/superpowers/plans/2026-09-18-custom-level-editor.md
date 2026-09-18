# Custom Level Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players create new levels or edit existing levels by arranging pieces whose current XOR becomes the saved target silhouette.

**Architecture:** Built-in levels remain immutable defaults. A versioned local repository stores two kinds of records: overrides with an existing built-in id and new levels with a new id. The editor saves the current board positions as both `target` and the solution, while gameplay resets those pieces to the tray and uses the existing XOR win rule.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Capacitor WebView `localStorage`, existing 128 × 192 grid and XOR mask functions.

**Spec:** `docs/superpowers/specs/2026-09-18-custom-level-editor-design.md`

## Execution status

Completed sequentially on 2026-09-18:

- Task 1: `9968f48` — repository override/new records and versioned target storage.
- Task 2: `49f188e` plus editor validation updates — explicit level sessions and target generation.
- Task 3: `7ff6e4c` — menu routing, edit/restore/create/delete actions.
- Task 4: `7ff6e4c` — editor saves the current XOR arrangement as target.
- Task 5: `cefa4cb` — documentation and browser/Android verification evidence.

## Global Constraints

- The current XOR silhouette on the editor board becomes the saved target.
- Existing levels are overridden by id; built-in defaults remain restorable.
- New levels receive new ids and appear alongside built-in levels.
- Pieces are fixed orientation: large square, large triangle, small triangle width 24, and diamond.
- Gameplay returns saved pieces to the tray and validates against the saved target with existing `evaluate`/`matchesTarget`.
- Store records under `mirror.custom-levels.v1` using localStorage, with no new dependency or online account.
- Every commit changing code or docs updates `CHANGELOG.md`.

---

### Task 1: Shape catalog and persistent level records

**Files:**
- Modify: `game/src/domain/shapes.ts`, `game/src/domain/types.ts`
- Create: `game/src/domain/levelRepository.ts`, `game/src/domain/levelRepository.test.ts`
- Modify: `game/src/domain/shapes.test.ts`, `CHANGELOG.md`

**Interfaces:** `smallTriangle(size = 24): Cell[]`; `LevelRepository.list/get/saveOverride/create/restoreBuiltIn/removeNew`; `CustomLevelRecord` with `kind: 'new' | 'override'`, `target`, `pieces`, `solution`, timestamps.

- [ ] Add failing tests for small triangle geometry and repository create/override/read-priority/restore/delete/malformed-storage behavior.
- [ ] Run `npm test -- src/domain/shapes.test.ts src/domain/levelRepository.test.ts` and verify the new tests fail for missing behavior.
- [ ] Implement small triangle and a versioned repository using localStorage with an in-memory fallback and safe JSON/schema rejection.
- [ ] Run the focused tests until all pass, then run `npm test -- src/domain/levels.test.ts` to prove built-ins remain unchanged.
- [ ] Update changelog and commit `feat: add editable level repository`.

### Task 2: Explicit-level gameplay and target generation

**Files:**
- Modify: `game/src/domain/session.ts`, `game/src/domain/session.test.ts`
- Create: `game/src/domain/customLevelValidation.ts`, `game/src/domain/customLevelValidation.test.ts`
- Modify: `CHANGELOG.md`

**Interfaces:** `new Session(levelOrIndex?: number | Level)`; `Session.levelId`; `buildTarget(level: Level, placements: Placement[]): Uint8Array`; `validateCustomSolution(level: Level, placements: Placement[]): { ok: true; target: Uint8Array } | { ok: false; reason: string }`.

- [ ] Add failing tests for constructing a session with an explicit level, generating a target from current placements, empty/out-of-bounds rejection, and exact XOR acceptance.
- [ ] Run focused session/validation tests and verify the expected constructor/helper failures.
- [ ] Refactor Session to retain explicit `Level` data while preserving numeric built-in construction and existing drop/remove/next behavior.
- [ ] Implement target generation and validation by calling existing `evaluate` and `matchesTarget`; do not add a second gameplay rule.
- [ ] Run `npm test -- src/domain/session.test.ts src/domain/customLevelValidation.test.ts`; update changelog and commit `refactor: support explicit editable levels`.

### Task 3: Level menu, override controls and routing

**Files:**
- Create: `game/src/ui/LevelMenuScene.ts`, `game/src/ui/levelMenu.test.ts`
- Modify: `game/src/ui/GameScene.ts`, `game/src/main.ts`, `game/src/ui/layout.ts`, `game/src/ui/theme.ts`, `CHANGELOG.md`

**Interfaces:** `LevelMenuScene` renders `Sửa level`, `Tạo level mới`, `Chơi`, `Sửa`, `Khôi phục level gốc`, and `Xóa`; `GameScene.init(data?: { levelId?: string })` resolves the effective repository level before create.

- [ ] Add a menu test for built-in ids, overridden labels, new-level entries and restore/delete eligibility.
- [ ] Run the focused menu test and capture the RED state.
- [ ] Implement the menu with existing theme/layout tokens and confirm deletion/restoration before mutation.
- [ ] Make main start at the menu and make GameScene load the selected effective level while preserving current drag/transparency behavior.
- [ ] Run `npm test`, `npm run build`, and inspect 390 × 844 and 720 × 1280 renders; commit `feat: add level menu and routing`.

### Task 4: Editor that turns the board into the target

**Files:**
- Create: `game/src/ui/CustomLevelScene.ts`, `game/src/ui/customLevelEditor.ts`, `game/src/ui/customLevelEditor.test.ts`
- Modify: `game/src/main.ts`, `game/src/ui/layout.ts`, `game/src/ui/theme.ts`, `CHANGELOG.md`

**Interfaces:** `CustomLevelDraft { id?: string; title: string; sourceLevelId?: string; pieces: PieceDefinition[]; placements: Placement[] }`; `createEditorPiece(kind: 'square' | 'triangle' | 'smallTriangle' | 'diamond', id: string): PieceDefinition`; `validateEditorDraft(draft: CustomLevelDraft): { ok: true; target: Uint8Array; solution: Placement[] } | { ok: false; reason: string }`.

- [ ] Add failing tests for all four piece kinds, target generation from current board, empty/title/bounds validation, override id preservation and new-id creation.
- [ ] Run `npm test -- src/ui/customLevelEditor.test.ts` and confirm RED.
- [ ] Implement pure editor helpers using existing shapes and mask evaluation.
- [ ] Implement the editor scene: source level selection for edit mode, empty board for new mode, piece palette, drag/move/delete, live XOR target preview, title field, save/cancel controls and validation message.
- [ ] On save, call `saveOverride` for an existing built-in/custom id or `create` for a new id; do not mutate built-in module data.
- [ ] Add responsive controls for 360 × 640 and 390 × 844, then run full tests/build and capture screenshots.
- [ ] Update changelog and commit `feat: add level creation and editing scene`.

### Task 5: End-to-end verification and documentation

**Files:**
- Modify: `README.md`, `game/README.md`, `CHANGELOG.md`
- Create: `docs/testing/custom-level-editor.md`

- [ ] Run browser flow: edit built-in 1-1, save target from the arranged board, play it from the tray, restore the original, create a new level, reload, play it and delete it.
- [ ] Capture real screenshots at 360 × 640, 390 × 844 and desktop for menu, editor, saved target and gameplay.
- [ ] Run `npm test`, `npm run build`, `npm run android:sync`, and `android/gradlew.bat assembleDebug`; state clearly whether a physical Android device was tested.
- [ ] Document override/new-level persistence, restore behavior, shape sizes and known bundle warning.
- [ ] Run `git diff --check`, stage the listed docs and report, and commit `docs: verify editable level flow`.

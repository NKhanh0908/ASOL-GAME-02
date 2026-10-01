# Mirror MVP Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the six-level prototype into the approved 18-level, three-chapter offline Android campaign.

**Architecture:** Keep the existing Phaser scenes and grid-mask domain. Add orientation to placements, a versioned campaign-progress repository, and authored levels. The menu reads campaign progress, while `Session` remains responsible for snap and silhouette victory. Custom-level data remains separately stored and does not unlock campaign levels.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest, Capacitor Android, localStorage.

**Spec:** `docs/superpowers/specs/2026-09-21-mirror-mvp-gdd.md`

## Global Constraints

- 18 levels: six per chapter, ordered from 1-1 through 3-6.
- Chapter 3 rotates selected pieces by 90-degree increments with a button.
- Victory compares the visible silhouette, including orientation, rather than a single placement list.
- Campaign progress is local, tolerates corrupt storage, and opens only the first level initially.
- Android play is portrait and offline; no server, account, ads, IAP, hints, time limit, or score.
- Keep built-in defaults restorable and preserve existing custom-level storage.
- Record code and documentation changes in `CHANGELOG.md`.

---

### Task 1: Orientation-aware grid rules

**Files:** `game/src/domain/types.ts`, `game/src/domain/shapes.ts`, `game/src/domain/mask.ts`, `game/src/domain/session.ts`, their focused tests.

**Interfaces:** `Placement.rotation?: 0 | 1 | 2 | 3`; `rotateCells(cells, turns): Cell[]`; `Session.rotate(pieceId): boolean`; `Session.rotationOf(pieceId): number`.

- [ ] Write tests that rotating a non-symmetric shape four times restores its mask, that the rotated solution wins, that an unrotated placement does not, and that Chapter 1–2 cannot rotate.
- [ ] Run focused Vitest and observe failure caused by missing orientation behavior.
- [ ] Rotate local cell coordinates within their square bounding box; use the oriented cells in `evaluate`, snap validation, and victory. Preserve optional zero rotation for persisted custom levels.
- [ ] Run focused tests, then the full test suite.

### Task 2: Campaign progress

**Files:** create `game/src/domain/campaignProgress.ts` and test; modify `game/src/ui/LevelMenuScene.ts`, `game/src/ui/GameScene.ts` and focused tests.

**Interfaces:** `CampaignProgress.load(): { completed: string[]; recovered: boolean }`; `CampaignProgress.complete(id): void`; `CampaignProgress.isUnlocked(id): boolean`; `CampaignProgress.isCompleted(id): boolean`.

- [ ] Test first-level access, sequential unlock, replay, reload, malformed JSON/version recovery, and storage write failure.
- [ ] Observe the new tests fail; implement storage under `mirror.campaign-progress.v1` with validated IDs and safe fallback.
- [ ] On built-in victory call `complete`, display locked/open/completed labels in the menu, and block locked campaign launches.
- [ ] Run focused and full tests.

### Task 3: Author twelve more campaign puzzles

**Files:** `game/src/domain/levels.ts`, `game/src/domain/levels.test.ts`.

- [ ] Write tests requiring IDs `1-1` through `3-6`, valid solution anchors, nonempty distinct target silhouettes, essential pieces, alternative anchors with a changed silhouette, and rotation dependence in Chapter 3.
- [ ] Observe the test fail on the six-level catalog.
- [ ] Author three additional Chapter 1 levels, three Chapter 2 levels, and six Chapter 3 levels using the existing 128 × 192 board and fixed shape catalog. Ensure each has a tested solution and a meaningful wrong choice.
- [ ] Run tests and render all 18 silhouettes for visual review on a portrait viewport; adjust unreadable puzzles.

### Task 4: Complete campaign scene flow

**Files:** `game/src/ui/GameScene.ts`, `game/src/ui/LevelMenuScene.ts`, `game/src/ui/draw.ts`, `game/src/ui/layout.ts`, UI helper tests.

- [ ] Test the pure selected-piece/rotation state helpers and the final-level navigation decision.
- [ ] Observe failures; add piece selection and a Chapter 3 Rotate button. Draw rotated cells consistently for hit testing, drag feedback, overlap preview and snap positions.
- [ ] Show three chapter groups, progress states, and the campaign completion message after 3-6. Keep custom editing outside the campaign path until Chapter 1 completion.
- [ ] Exercise drag, snap, rotate, tray return, cancel, reset, replay and next-level flow in the browser.

### Task 5: Release verification and documentation

**Files:** `README.md`, `game/README.md`, `CHANGELOG.md`, `docs/testing/2026-09-30-mirror-mvp.md`.

- [ ] Run `npm test` and `npm run build` in `game`; record exact results.
- [ ] Run `npm run android:sync` and Android debug build if SDK is available; distinguish build evidence from actual-device playtest.
- [ ] Review all seven GDD acceptance criteria against code and observed evidence, recording any unmet criterion without claiming the MVP is fully verified.
- [ ] Update run instructions and milestone status; check `git diff --check` and `git status --short`.

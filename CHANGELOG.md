# Changelog

Nhật ký này là nguồn đọc nhanh cho người phát triển và AI. Mỗi commit có thay đổi về code, tài liệu, cấu hình hoặc level phải thêm một mục vào phần `Unreleased` trước khi push. Khi tạo bản phát hành, chuyển các mục đã hoàn tất sang một phiên bản có ngày cụ thể.

## Unreleased

### 2026-10-03 - Pass the AI onboarding cold-start test

- A fresh subagent reading only `AGENTS.md` and `docs/ai/*` answered the five spec questions correctly without opening `docs/superpowers/`; marked row `AI` done in `docs/ai/DOCS-INDEX.md` and refreshed `docs/ai/STATUS.md`.
- Verification: cold-start test passed (1 attempt); link check over all onboarding files passes; GitNexus MCP unavailable, detect_changes not run; no runtime code changed.

### 2026-10-03 - Rewrite README for the game-next rebuild

- Rewrote `README.md` (Vietnamese): `game-next/` as the active product with Node 24 commands and Android build, `game/` marked legacy, links to `AGENTS.md`, `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`.
- Verification: link check passes; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add shared AGENTS.md entry point for Claude Code, Codex and Antigravity

- Rewrote `AGENTS.md` as the canonical agent entry: project summary, where to work (`game-next/` vs legacy `game/`), start- and end-of-task protocols, commands, rules (English specs and plans, CHANGELOG per commit, level approval flow), with the GitNexus block kept unchanged.
- `CLAUDE.md` now imports `@AGENTS.md`; added `.agent/rules/agents.md` for Antigravity; committed `.claude/skills/gitnexus/`; ignored `.shots/`.
- Verification: link check passes; `AGENTS.md` within 120 lines outside the GitNexus block; GitNexus blocks byte-identical to the previous version; `.shots/` ignored; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add current status file for agents

- Added `docs/ai/STATUS.md`: branch, product state, next step, streams with entry docs, open decisions and recent gotchas; overwritten at the end of every task.
- Verification: link check passes; 60-line limit respected; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add game-next architecture map for agents

- Added `docs/ai/ARCHITECTURE.md`: layers with known dependency exceptions, boot and scene flow with line references, gameplay flow, level content pipeline and review flow, invariants, localStorage keys, GitNexus hotspots, test conventions.
- Verification: link check and `game-next/`-relative path check pass; grid size, storage keys and test count checked against code; hotspots measured with GitNexus `impact`; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add docs registry for AI onboarding

- Added `docs/ai/DOCS-INDEX.md`: every spec and plan in `docs/superpowers/` grouped into 21 rows with a fixed state vocabulary, split into active and history tables, plus one line per other doc folder.
- Verification: link check passes; every spec and plan file is referenced; state cells counted; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add implementation plan for AI onboarding context

- Recorded reviewer approval of `docs/superpowers/specs/2026-10-03-ai-onboarding-context-design.md` by NKhanh0908: "duyệt spec".
- Added `docs/superpowers/plans/2026-10-03-ai-onboarding-context.md` (6 tasks): docs registry `docs/ai/DOCS-INDEX.md` with reviewer confirmation of uncertain states, architecture map `docs/ai/ARCHITECTURE.md` with GitNexus hotspot measurement, `docs/ai/STATUS.md`, shared `AGENTS.md` entry with `CLAUDE.md` import and Antigravity rule, Vietnamese `README.md` rewrite, and a cold-start acceptance test by a fresh subagent.
- Verification: registry draft dry-run against every spec and plan file (none unlisted, no broken paths, 21 state cells); architecture facts gathered from code by a research pass; GitNexus `analyze` failed (LadybugDB WAL checkpoint) and the MCP server disconnected, so hotspot measurement is deferred to plan task 2; no runtime code changed.

### 2026-10-03 - Add spec for AI onboarding context

- Added `docs/superpowers/specs/2026-10-03-ai-onboarding-context-design.md`: canonical `AGENTS.md` entry for Claude Code, Codex and Antigravity, plus `docs/ai/STATUS.md`, `docs/ai/ARCHITECTURE.md` and `docs/ai/DOCS-INDEX.md`; agents refresh status at the end of every task; `game/` marked legacy; new specs and plans are written in English.
- Verification: placeholder and consistency self-review; no runtime code changed.

### 2026-10-03 - Note single-repo GitNexus setup in the motion index

- Updated the GitNexus section of `docs/superpowers/plans/2026-10-03-f-motion-index.md`: only this repository is indexed locally now, so the `repo` parameter is optional; examples keep it for safety.
- Verification: `list_repos` returns only ASOL-GAME-02; no runtime code changed.

### 2026-10-03 - Add GitNexus workflow to the motion plans index

- Added a GitNexus section to `docs/superpowers/plans/2026-10-03-f-motion-index.md`: `impact` before editing an existing symbol, `detect_changes` before each commit, `analyze` after it, `rename` for renames, and the required `repo: "ASOL-GAME-02"` parameter because several repositories are indexed locally.
- Recorded the measured CRITICAL risk of `BoardRenderer` (5 direct dependants, 6 `PlayScene` flows), touched by F1 task 9 and rewritten by F2 task 6.
- Verification: refreshed the index with `node .gitnexus/run.cjs analyze` (3,097 nodes, 7,677 edges, 255 flows) and ran `impact` on `BoardRenderer` through MCP; no runtime code changed.

### 2026-10-03 - Split motion plans F1 and F2 into phase files and add the F index

- Replaced `docs/superpowers/plans/2026-10-03-f1-scene-transitions.md` with `2026-10-03-f1-1-nen-tang.md` (tasks 1-3), `f1-2-director.md` (4-6) and `f1-3-dan-dung.md` (7-10); replaced `2026-10-03-f2-in-level-game-feel.md` with `f2-1-logic.md` (1-4), `f2-2-renderer.md` (5-7) and `f2-3-phan-hoi.md` (8-10). Each phase file carries its own goal, deliverable, position, global constraints and file map; task numbers are unchanged.
- Added `docs/superpowers/plans/2026-10-03-f-motion-index.md`: execution order across F1-F3 with branches, roles (coordinator, per-task implementer subagent, reviewer), main flow, five reviewer stop points, in-phase manual checks, cross-plan interface contracts and precomputed route timings, texture memory and rotation fixture.
- Verification: every task section in the phase files is byte-identical to the original plans (scripted comparison); references in plan F3 and spec F2 updated to the new file names; no runtime code changed.

### 2026-10-03 - Add implementation plans F2 and F3 and record plan-time spec corrections

- Added `docs/superpowers/plans/2026-10-03-f2-in-level-game-feel.md` (10 tasks: mask caching, pose smoothing, parity diff and feedback events, haptics 8.0.2, frame-spread texture baking, `PieceView` renderer, overlap and preview effects, `FeedbackDirector`, 1800 ms victory sequence, F1 integration) and `2026-10-03-f3-motion-acceptance.md` (9 tasks: perf stats and recorder, dev tool flags, rotation fixture, director measurement hooks, autosolve scripts, overlay and time scale, demo runner, acceptance records, Claude's automated and desktop pass).
- Reconciled the plans: F3 alone owns the measurement hooks (`onWindow` on both directors, `pieceTextureBytes.ts`) and calls F2's `handle`, `playVictory` and four-argument `feedbackEvents`.
- Appended plan-time corrections to specs F2 (measured texture memory 0.74 MiB per piece and orientation, no separate ghost texture, black/white shadow textures instead of `setTintFill`, 25% padding, `feedbackEvents` subject, 600 ms resonance rings) and F3 (1-3 for the overlap demo, three-piece chapter-3 rotation fixture, rotation button driven by `rotationEnabled`, director time scale, harness under `VITE_MOTION_TOOLS`).
- Verification: texture sizes computed from every `frameSize` in `game-next/src/content/levels/*.json`; `@capacitor/haptics` versions read with `npm view`; cross-plan interface names checked by grep; placeholder scan; no runtime code changed.

### 2026-10-03 - Add implementation plan F1 and correct the next-level timing

- Added `docs/superpowers/plans/2026-10-03-f1-scene-transitions.md` (10 tasks): motion primitives, self-clocked timeline, step-table choreography and route tables, persisted reduced motion, sky moods with a persistent `BackgroundScene`, `SceneDirector` with a source gate on `scene.start`, then menu, map and play choreography.
- Corrected spec F1 section 3.3: `next-level` now runs its out-phase 0-800 ms and restarts at 800 ms, so the route totals 1500 ms as stated (the first draft shifted the in-phase and summed to 1200 ms).
- Verification: route milestones recomputed against every step table in the plan; placeholder and type-consistency self-review; no runtime code changed.

### 2026-10-03 - Add spec F3 (motion acceptance) after approving F1 and F2

- Recorded reviewer approval of specs F1 and F2 by NKhanh0908: "duyeejt spec".
- Added `docs/superpowers/specs/2026-10-03-f3-motion-acceptance-design.md`: dev-only tools (`fps`, `motion` slow-motion, `demo`/`loop` route replay, extended `autosolve` scripts, `perf` frame-time windows, a `fixture-rotate` level because every Chapter 1 level disables rotation), seven numeric performance thresholds, a 31-item acceptance matrix for F1, F2 and regressions, and per-spec acceptance records under `docs/testing/motion/` that follow the existing content-review format.
- Verification: checked `launchParams.ts`, `fixtures.ts`, the existing review records and that all six level files set `rotationEnabled: false`; spec self-review; no runtime code changed.

### 2026-10-03 - Add spec F2 (in-level game feel)

- Added `docs/superpowers/specs/2026-10-03-f2-in-level-game-feel-design.md`: a per-frame render loop, pieces baked once into textures and shown as images with smoothed display poses, pure `feedbackEvents` derived from transitions, effects for lift, drag, magnet, snap, return, rotate, blocked rotation and XOR overlap changes, an 1800 ms skippable victory sequence, haptics through `@capacitor/haptics` with a persisted setting, and removal of redundant mask evaluation while dragging.
- Depends on spec F1 for `motionScale`, `TransitionTimeline` and the reduced-motion setting.
- Verification: checked the current renderer, controller, drag and session code paths the spec replaces (unused `previewMask`, frame-independent rings, stub settings toggles); estimated texture memory for a six-piece rotating level; spec self-review; no runtime code changed.

### 2026-10-03 - Add spec F1 (motion foundation and cinematic scene transitions)

- Added `docs/superpowers/specs/2026-10-03-f1-scene-transitions-design.md`: a persistent `BackgroundScene` owning one sky, a `SceneDirector` that replaces every direct `scene.start`, choreographed in/out timelines for seven routes (1500 ms into play, about 1000 ms elsewhere, always full with tap-to-skip), and a persisted reduced-motion setting that collapses every route to a 150 ms crossfade.
- In-level game feel (lift, snap, rotate, XOR overlap, victory sequence, texture-based pieces) is deferred to spec F2.
- Verification: coordinates and timings checked against `LAYOUT_TOKENS`, `MenuScene` emblem position and the current scene entry points; spec self-review; no runtime code changed.

### 2026-10-02 - Add partial plan E (level studio), paused

- Added `docs/superpowers/plans/2026-10-02-e-level-studio.md` with header, global constraints, 15 decisions and precomputed difficulty numbers for 22 levels; tasks are not written yet. A placeholder section lists the 13 planned tasks and marks the pause point.
- Recorded an open issue found while planning: sources 3-5 and 3-6 in spec C have piece frames outside the board, which `checkSourceGeometry` rejects; must be resolved before running plan C.
- Verification: difficulty thresholds checked against 22 levels with a scratch prototype (all within 1 of the estimate); no runtime code changed.

### 2026-10-02 - Add implementation plans A-D for the level system

- Added `docs/superpowers/plans/2026-10-02-a-shapes-v2.md` (3 tasks), `-b-level-kit-chapters.md` (7 tasks), `-c-chapter-2-hoa-pham-levels.md` (18 tasks) and `-d-free-placement.md` (8 tasks). Execution order: A, B, then C and D in parallel; plan E follows.
- Verification: cross-checked shared interfaces between plans (kit `concentric` signature extended by D after B, manifest titles and orders identical in B and C, dev-level mechanism from A reused by D); placeholder scan; no runtime code changed.

### 2026-10-02 - Add level system specs A-E (shapes v2, level kit, chapter 2 + Hoa Pham content, free placement, level studio)

- Added five specs under `docs/superpowers/specs/2026-10-02-{a..e}-*.md`: circle and parallelogram shapes with per-shape frame rules; `content:new` clone command, composition kit and 4-chapter campaign (28 levels); 16 levels for chapter 2 (new 2-5 Dong Ho Cat) and chapter 3 Hoa Pham; free placement mode that snaps to grid intersections with a meet-in-the-middle XOR solver; a dev-only level studio that saves into `src/content/studio/` with an automatic difficulty score.
- Recorded the decision to keep the even-odd (XOR) visibility rule over an "overlap hides" rule.
- Added draft previews `docs/testing/levels/drafts/chapter-2-draft.png` and `hoa-pham-draft.png`.
- Verification: every level coordinate, solution count, hollow and revived cell count computed by an independent scratch prototype (16 levels, each with exactly one solution and up to three decoy anchors per piece); spec self-review for cross-spec consistency; no runtime code changed.

### 2026-10-02 - Approve level 1-6 Vuong Mien Binh Minh

- Set `1-6` to `approved` (`vuong-mien-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-6-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-5 Chiec Thuyen Sao

- Set `1-5` to `approved` (`thuyen-sao-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-5-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-4 Ngon Hai Dang

- Set `1-4` to `approved` (`hai-dang-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-4-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-3 Canh Chim Bao Diem

- Set `1-3` to `approved` (`canh-chim-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-3-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.
- Changed `game-next/tests/levelSelect.test.ts` to use a mock manifest with 1-3 as `validated`, so the harness-vs-campaign check no longer depends on real approval statuses.

### 2026-10-02 - Synchronize harness progress with the constellation map

- Added a transient harness preview trail so levels completed while reviewing validated content appear completed on the map and advance the current node.
- Made validated levels playable from the map only in harness mode, while campaign continues to require approved content and retain its persisted progress unchanged.
- Preserved the furthest harness preview when replaying an earlier level and forwarded harness mode through map and next-level navigation.
- Verification: two map synchronization regressions and the replay regression failed before implementation; all 31 focused tests and all 243 tests across 30 files then passed; content validation and production build passed. Chrome snapshots remained unused under the user waiver. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Fix Vietnamese level titles and long HUD text

- Switched level names in the play header and victory card from Playfair Display to a Vietnamese-complete Be Vietnam Pro stack with system fallbacks.
- Fit long header titles into the 448px safe area between navigation controls, with a 32px minimum size.
- Reduced victory verse text to 18px so two-line verses retain space from the level title and action buttons.
- Verification: two HUD regressions failed before implementation, then all 19 focused HUD/token tests and all 240 tests across 30 files passed; typecheck and production build passed. Chrome snapshots remained unused under the user waiver. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Approve level 1-2 Bao Thap Tien Tri

- Promoted `bao-thap-v1` from `validated` to `approved` after direct harness review by NKhanh0908: “ok ngon nha”.
- Updated campaign navigation and catalog expectations so completing 1-1 unlocks the playable 1-2 successor.
- Added the 1-2 content review record and updated the Chapter 1 review index.
- Verification: the four stale pre-approval expectations failed after promotion, then 50 focused tests and all 238 tests across 30 files passed; typecheck and content validation also passed.

### 2026-10-02 - Update GDD chapter 1 level sheets and add review index

- Updated the GDD geometry, anchors, shape orientations and piece lists for Chapter 1 levels 1-1 through 1-6.
- Added a review index linking every SVG preview, solution report and direct development harness URL.
- Recorded the user-requested Chrome snapshot waiver; visual acceptance is performed directly in the harness.

### 2026-10-02 - Add level 1-6 Vuong Mien Binh Minh (validated)

- Added the authored source, generated artifacts and content regressions for the two wings and center diamond in level 1-6.
- Registered `vuong-mien-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-6 had no source; authoring produced 3,456 target cells, one solution and no fewer-piece solution; all six authored levels regenerated successfully; typecheck, all 238 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-5 Chiec Thuyen Sao (validated)

- Added the authored source, generated artifacts and content regressions for the square hull, bow and sail in level 1-5.
- Registered `thuyen-sao-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-5 had no source; authoring produced 4,560 target cells, one solution and no fewer-piece solution; typecheck, all 231 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-4 Ngon Hai Dang (validated)

- Added the authored source, generated artifacts and content regressions for the three-tier lighthouse in level 1-4.
- Registered `hai-dang-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-4 had no source; authoring produced 4,032 target cells, one solution and no fewer-piece solution; typecheck, all 224 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-3 Canh Chim Bao Diem (validated)

- Added the authored source, generated artifacts and content regressions for the two mirrored wing triangles in level 1-3.
- Registered `canh-chim-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-3 had no source; authoring produced 2,304 target cells, one solution and no fewer-piece solution; typecheck, all 217 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-2 Bao Thap Tien Tri (validated)

- Added the authored source, generated JSON, SVG preview and solution report for level 1-2 with one square and one roof triangle.
- Registered `bao-thap-v1` for harness play in `validated` state and added shared Chapter 1 content regressions.
- Verification: the focused test first failed because 1-2 had no source; authoring produced 2,880 target cells, one solution and no fewer-piece solution; typecheck, all 210 tests across 30 files and content validation passed.

### 2026-10-02 - Add 1-1 renderer evidence screenshots

- Added `docs/testing/levels/screens/1-1-{play,drag,win}.png`, captured with `game-next/scripts/shoot-level.sh` after the polygon renderer, parity overlap and N-slot tray changes (plan phase 2, Task 8 evidence).
- Verification: reviewed all three captures (target silhouette, tray wells, drag shadow with snap label, victory card); `npm run typecheck`, `npm test` (203 passed), `npm run content:validate` and `npm run build` green.

### 2026-10-02 - Remove the faint victory-center sparkle

- Removed the small four-ray sparkle from `game-next/src/presentation/BoardRenderer.ts` after manual acceptance feedback; the board pulse, camera flash and resonance rings remain.
- Updated `game-next/tests/boardRendererLayers.test.ts` to reject the removed white sparkle while preserving victory-layer ordering.
- Verification: focused renderer-layer regression failed before the change and passed afterward; `npm run typecheck`, all 203 tests across 29 files, and `npm run build` passed. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Add dev-only harness mode via URL

- Added a tested launch resolver: URL harness mode is enabled only in development; production launches use campaign mode.
- Forwarded the launch mode into PlayScene and preserved it for the next level, returning to the menu when the next level is unavailable in that mode.
- Verification: four resolver tests failed for the missing module, then passed; typecheck, all 203 tests across 29 files, content validation, and production build passed. Chrome snapshots were waived by the user; manual harness acceptance remains pending. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Keep moving pieces above parity overlays and reject missing captures

- Split `game-next/src/presentation/BoardRenderer.ts` into constructor-allocated snapped/parity, temporary, dragging, and victory layers; overlapping snapped pieces no longer cover a third moving piece.
- Hardened `game-next/scripts/shoot-level.sh`: remove stale output, require a fresh nonempty PNG, preserve Chrome diagnostics, and stop subsequent captures on failure while accepting nonzero Chrome exits that produced an image.
- Added combined-state draw-order regressions in `game-next/tests/boardRendererLayers.test.ts` and shell-independent capture source checks in `game-next/tests/shootLevel.test.ts`. All three failed before the fixes, then passed; typecheck, all 199 tests across 28 files, content validation, and production build passed. Chrome remained unused under the user's waiver; visual acceptance remains pending.

### 2026-10-02 - Render real piece polygons, exact parity overlap and N-slot tray

- Added `maskCentroid` in `game-next/src/domain/mask.ts` and three tests in `game-next/tests/boardRenderer.test.ts`; victory effects now use the target centroid.
- Updated `game-next/src/presentation/BoardRenderer.ts`, `TargetBadge.ts`, and `PlayScene.ts` to draw real shape polygons, derive targets from solution placements, apply exact even-odd overlaps, and pass the level piece count through tray rendering and autosolve.
- Added `game-next/scripts/shoot-level.sh` with the planned play/drag/win capture interface. Chrome snapshots were waived by the user; before/after visual acceptance remains pending manual review, including Task 6 jewel styling.
- Verification: centroid tests failed for the missing helper before implementation, then all six focused tests and all 196 tests across 26 files passed; `npm run typecheck`, `npm run content:validate`, and `npm run build` passed. Vite reported its existing large-chunk advisory.

### 2026-10-02 - Piece polygons on canvas and N-slot tray

- Added board and centered piece polygons using shared shape orientation, with a diamond fallback for legacy pieces. Added tray slot widths and inset well rectangles, and limited tray hitboxes and piece radii by slot width.
- Passed the level piece count through pointer selection and drag initialization. Verification: six focused tests failed before implementation; all 19 layout tests, all 193 tests across 26 files, and `npm run typecheck` passed.

### 2026-10-02 - Keep convex jewel outlines inside piece boundaries

- Offset each convex polygon edge inward by half the stroke width and intersect adjacent offset lines, so triangle and square outlines follow their outer edges. Preserve the prior radius-scaled outline only for axis-aligned diamonds with equal diagonals.
- Added roof edge-distance, square, reversed-winding, and legacy diamond geometry regressions. The old uniform scaling failed three focused tests; the corrected focused suite passed all 17.

### 2026-10-02 - Draw jewel facets for any convex polygon

- Added polygon centroid, scaling, facets, table and spine geometry; added `drawJewelPolygon` and retained the `drawJewel` API through delegation.
- Verification: five new geometry cases failed for missing functions before implementation, then all 13 focused tests passed; `npm run typecheck` passed; `npm test` passed (182 tests across 26 files). Phaser visual verification is deferred to Task 8's required Chrome before/after screenshots.

### 2026-10-02 - Add convex polygon clipping and parity layers

- Added convex polygon intersection and ordered even-odd parity layers in `game-next/src/presentation/polygonClip.ts`, with seven focused geometry tests.
- Verification: focused test failed before implementation because the module was missing, then passed (7 tests); `npm run typecheck` passed; `npm test` passed (177 tests across 26 files).

### 2026-10-02 - Add solution search and SVG previews to level authoring

- Added exhaustive anchor/tray solution search, distractor cell differences, Markdown reports and SVG previews in `game-next/src/content/authoringReport.ts`, with five cases in `game-next/tests/authoringReport.test.ts`.
- Updated `game-next/scripts/author-level.ts` to generate reports and reject fewer-piece solutions; documented `content:author` in `game-next/README.md` and generated `docs/testing/levels/1-1.svg` and `docs/testing/levels/1-1-report.md` without changing level JSON.
- Verification: focused suite failed for the missing module before implementation, then passed (5 tests); `npm run content:author -- 1-1` passed (2304 target cells, 1 solution, 0 fewer-piece solutions); `npm run typecheck` passed; `npm test` passed (170 tests); `npm run content:validate` passed. SVG XML structure and polygon coordinates inspected; visual rendering unavailable in this session.

### 2026-10-02 - Reject explicit null piece orientation

- Updated `game-next/src/content/validate.ts` to validate supplied orientations directly and default only omitted square or diamond orientations to 0; explicit null now produces `invalid-orientation`.
- Added a regression in `game-next/tests/content.test.ts` using a triangle with valid orientation 0 cells and explicit null orientation.
- Verification: regression failed before the fix; `npx vitest run tests/content.test.ts` passed (15 tests); `npm run typecheck` passed; `npm test` passed (165 tests); `npm run content:validate` passed.

### 2026-10-02 - Validate piece shapes, orientations and target placements

- Added optional shape metadata to `Piece` and sample target placements to `Level` in `game-next/src/domain/model.ts`; `game-next/src/content/validate.ts` always fills these fields and rejects invalid shapes, orientations, duplicate cells and cells that differ from the shared shape polygons.
- Updated `game-next/src/content/fixtures.ts` to generate the adjacent diamond fixture with the top-left boundary rule using independent inequalities (800 cells per diamond); added seven validation cases in `game-next/tests/content.test.ts`.
- Verification: `npx vitest run tests/content.test.ts` passed (14 tests), following seven expected failures before implementation; `npm run typecheck` passed; `npm test` passed (164 tests); `npm run content:validate` passed.

### 2026-10-02 - Author levels from source files; regenerate 1-1 as song-tinh-v2

- Added optional orientation to `game-next/src/content/document.ts`, authoring geometry checks and document generation in `game-next/src/content/authoring.ts`, sources in `game-next/src/content/sources/`, and coverage in `game-next/tests/authoring.test.ts`.
- Added `game-next/scripts/author-level.ts` and `content:author` in `game-next/package.json`; removed `game-next/scripts/regen-level-geometry.ts`.
- Regenerated `game-next/src/content/levels/1-1.json` and updated `game-next/src/content/manifest.ts` to `song-tinh-v2`; recorded human approval in `docs/testing/mirror-rebuild/1-1-content-review.md`. Metadata, anchors and solutions remain unchanged; each diamond has 1,152 cells and the target has 2,304 cells.
- Verification: `npm run typecheck` passed; `npm test` passed (157 tests); `npm run content:validate` passed; `npm run build` passed with the existing large chunk warning.

### 2026-10-02 - Add shared shape module

- Added `ShapeKind` and `Orientation` in `game-next/src/domain/model.ts`, and shared square, diamond and triangle polygons with top-left-rule cell rasterization in `game-next/src/domain/shapes.ts`; geometry coverage is in `game-next/tests/shapes.test.ts`.
- Verification: `npm run typecheck` passed; `npm test` passed (150 tests).

### 2026-10-02 - Add chapter 1 implementation plans and spec corrections

- Added `docs/superpowers/plans/2026-10-02-chapter-1-levels-index.md` and three phase plans (`-1-nen-mong`, `-2-renderer`, `-3-noi-dung`) covering 16 tasks: shape module, authoring pipeline, validator, renderer, N-slot tray, harness mode, five levels, GDD update and per-level review.
- Corrected `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`: rotation commitment (CH1-03) stated as boundary-only differences, 1-1 re-approval moved right after regeneration, `TargetBadge` brought into scope, HUD counter icons stay diamonds, translucent target with holes deferred to chapter 2, `Level.targetPlacements` added, M0 fixture regenerated under the new edge rule.
- Verification: level geometry, solution counts and distractor cell counts computed with an independent scratch prototype; plan self-review against every spec requirement; no runtime code changed.

### 2026-10-02 - Add chapter 1 levels and shared authoring design

- Added `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`: shared shape module (square, diamond, right isosceles triangle in 8 orientations, one top-left edge rule for all shapes), authoring script with SVG previews and solution search, renderer changes (per-piece polygons, exact even/odd overlap layering, N-slot tray), five draft levels 1-2 to 1-6, and the per-level review flow.
- Recorded two deliberate GDD deviations (1-3 wings touch at a vertex; 1-6 crown uses a diamond) and the regeneration of 1-1 as `song-tinh-v2`, which must be re-approved before merging to `main`.
- Verification: spec self-review for placeholders, consistency and scope; checked every level's coordinates against the 128 x 160 board, the 8-cell anchor grid and the 6-cell snap radius; no runtime code changed.

### 2026-10-01 - Update UI architecture in Master GDD

- Updated `docs/gdd/master-gdd.md` (v0.2.2) to comprehensively document the Astrological Glass Stele (Tấm Bia Tiên Tri) UI/UX design:
  - Vertical layout metrics and safe area partitioning on 720x1280 canvas.
  - Detailed specifications for Main Menu (rotating prophecy seal, mirrored logo), Level Select (constellation map), Gameplay (5 visual interaction states), Pause and Settings modals.
  - Strict 3 color families (Navy, Ice Glass, Amber Gold), typography standards (Serif Playfair Display + Sans Be Vietnam Pro), vector polygon rendering to eliminate pixel aliasing, and mobile motion budgets.
- Verification: verified against UI specs and presentation layer implementation; all references aligned.

### 2026-10-01 - Simplify Divination Disc target guidance

- Updated `docs/superpowers/specs/2026-10-01-ui-redesign-divination-disc.md` to remove the target badge and place the optional target silhouette directly on the board.
- Kept the existing target visibility setting and moved the victory emphasis to the completed shape on the board.
- Verification: checked all target-badge references and the documentation diff; no runtime code changed.

### 2026-09-30 - Add separate Mirror Master GDD

- Created `docs/gdd/master-gdd.md` as a five-chapter player-experience design document following the Phase 2 workflow, separate from the MVP specification.
- Recorded the one-color overlap rule, 18-level learning path, UI flow, visual direction, offline progress, non-monetized release scope, design states and unresolved post-MVP color behavior.
- Verification: cross-checked against the current MVP spec, concept note, six-level prototype evidence and Phase 2 template; documentation-only change, no runtime test.

### 2026-09-30 - Clarify same-color overlap in MVP GDD

- Updated `docs/superpowers/specs/2026-09-21-mirror-mvp-gdd.md` so the one-color MVP explains same-color transparency and reappearance consistently across the rules, chapter goals, UI feedback and acceptance criteria.
- Confirmed in `docs/concept/same-color-overlap-note.md` that different-color interactions belong after MVP; their display and color-sensitive victory remain open decisions.
- Verification: reviewed document terminology and scope against the Product Owner's decisions; no gameplay code or runtime tests were changed for this documentation update.

### 2026-09-30 - Same-color overlap concept note

- Added `docs/concept/same-color-overlap-note.md` to record the proposed same-color transparency rule and the unresolved different-color behavior for a future GDD revision.
- Verification: reviewed the note against the current MVP GDD and concept sheet; no runtime test was needed for this documentation-only change.

### 2026-09-21 - Approved Mirror MVP GDD

- Recorded the approved 18-level Android MVP: three six-level chapters for drag/drop, parity overlap and 90-degree rotation.
- Set the release model to free, offline and without ads/IAP; campaign progress is local only.
- Deferred Custom Level to the final milestone and made it removable from release scope if campaign delivery is at risk.
- Verification: reconciled the approved product decisions with existing concept, prototype, testing and implementation documentation; no code or runtime verification was performed.

### 2026-09-18 - Generated target editor flow

- Corrected Custom Level so the XOR arrangement on the editor board becomes the saved target; new levels start empty, existing levels save by id, and built-in levels can be restored.
- Updated the level menu with edit, restore, create-new and delete-new actions. Verification: 41 tests pass and the web build passes.

### 2026-09-18 - Completed editable-level plan

- Recorded sequential task completion and commit evidence in the implementation plan.

### 2026-09-18 - Level repository override schema

- Migrated persisted custom levels to versioned `mirror.custom-levels.v1` records with `kind`, generated targets, override priority, restore, and new-level deletion operations.
- Corrupt or unversioned storage is ignored safely; legacy `save`/`remove` aliases remain for current UI callers during migration.
- Verification: focused repository and shape tests pass (9 tests).

### 2026-09-18 - Corrected editable-level design

- Clarified that the editor creates the target from the current XOR arrangement, overrides existing levels by id, adds new levels with new ids, and supports restoring built-in defaults.

### 2026-09-18 - Fix custom level editor piece ID sync

- Synchronized generated piece IDs with placed piece records in `CustomLevelScene.init`, ensuring `validateDraft` and live XOR evaluation match correctly when loading a template level.
- Verification: 40 tests pass and web build succeeds.

### 2026-09-18 - Fix scene transition crash on button clicks


- Changed button activation from synchronous `pointerdown` to `pointerup` with deferred scene start (`delayedCall(0)`), preventing Phaser InputManager crashes when tearing down active scenes during event propagation.
- Added visual pressed feedback states for buttons across Menu, Game, and Custom Level scenes.
- Verification: 40 tests pass and TypeScript / Vite build succeeds.

### 2026-09-18 - Custom level editor verification and documentation


- Documented custom level storage schema (`mirror.custom-levels.v1`), shape specifications, test matrix, and end-to-end flow.
- Updated root `README.md` and `game/README.md` with current feature capabilities and 40 unit tests count.
- Verification: 40 tests pass, web production build succeeds, and Capacitor Android sync completes cleanly.

### 2026-09-18 - Persistent custom level editor


- Added `CustomLevelScene` and `customLevelEditor` helpers with 4 shape tools (Square, Large Triangle, Small Triangle, Diamond), live overlap transparency, drag snap, rename prompt, and exact XOR validation before saving.
- Integrated editor into Phaser scene registry with source template selection and edit mode support.
- Verification: 40 tests pass and TypeScript / Vite build succeeds.

### 2026-09-18 - Level menu and custom level routing


- Added `LevelMenuScene` with responsive selection for built-in levels and custom level management (Play, Edit, Delete with in-scene confirmation).
- Connected main game entry point to the level select menu and allowed `GameScene` to play specific level IDs and navigate back to the menu.
- Verification: 33 tests pass and TypeScript / Vite production build succeeds.

### 2026-09-18 - Session custom level support


- Allowed `Session` to initialize with either numeric index or explicit `Level` instances.
- Added `Session.canSaveSolution` helper ensuring bounds and XOR mask match before persistence.
- Verification: 30 tests pass.

### 2026-09-18 - Shape catalog and level repository


- Added `smallTriangle` shape generator and `LevelRepository` with local storage persistence, corrupted data recovery, and custom level CRUD support.
- Verification: 28 tests pass across domain and UI modules.


### 2026-09-18 - Custom level editor design

- Added the reviewed design for selecting a built-in level as a custom template, composing four fixed shapes, validating the XOR solution and persisting custom levels locally.

### 2026-09-18 - Custom level editor implementation plan

- Added the task-by-task plan covering the shape catalog, persistent repository, explicit-level sessions, menu routing, editor validation and browser/Android verification.

### 2026-09-17 - UI interaction cleanup

- Consolidated piece lookup, placement state, grid origins, overlap collection and composite preview rendering into focused `GameScene` helpers without changing gameplay behavior.
- Verification: 21 tests pass, browser drag checks pass, and the web build passes.

### 2026-09-17 - Live overlap preview

- While dragging, cells that overlap another piece become transparent immediately so the player can align the silhouettes before releasing.
- Preview overlap uses continuous piece positions and clears the intersecting cells on both pieces, so partial intersections reveal the board before grid alignment. Verification: 20 tests pass, browser drag checks pass, and the web build passes; the existing Vite large-chunk warning remains.
- The same overlap transparency is now recomputed after drop, so a loose placement keeps the clear intersection until the pieces separate.
- While a loose piece overlaps a correctly placed piece, the temporary composite also clears that intersection, preventing the placed XOR layer from covering the preview.
- Refresh now applies the same composite clearing after a loose drop; only loose overlap cells are cleared, while fully placed pieces retain their normal XOR result.

### 2026-09-17 - Shape-aware dragging and placement feedback

- Matched pointer hit areas to filled shape cells, retained the latest selected piece above other pieces, and limited tray returns to the visible tray rectangle.
- Distinguished loose, dragging, and placed piece drawing while preserving the shared gold composite and the exact dropped loose position.
- Kept controls above selected pieces, removed scene input listeners on restart, and added a session regression for removing a piece from its anchor.
- Verification: 16 tests pass and the web build passes; the existing large Phaser bundle warning remains.

### 2026-09-17 - Cosmic board and large-piece layout

- Added a shared 720 × 1280 layout, cosmic backdrop, subtle board grid, target card and responsive tray for the large authored pieces.
- Updated the canvas and page backgrounds to match the new theme; piece and target drawing use the shared gold color with the target held at 15% opacity.
- Captured and visually inspected the level 1-1 canvas at 360 × 640, 390 × 844 and desktop; screenshots are in `docs/testing/mirror-redesign/task-3-*.png`.
- Verification: 15 tests pass and the web build passes (existing Vite large-chunk warning remains).

### 2026-09-17 - Six authored overlapping silhouettes

- Replaced tiny introductory shapes with six manually composed XOR puzzles, 36–48-cell pieces and two to four separated trial anchors.
- Added coverage, essential-piece, bounds, target size, detached-component and session victory checks; kept parity rules unchanged.
- Approved authoring exception: level 1-1 target is 60 cells wide so both V edges remain readable; the other five targets are 72 cells wide.
- Captured and visually reviewed all six targets in Chrome at 390 × 844 using the existing canvas renderer; coordinates and observations are in `docs/testing/2026-09-17-mirror-redesign.md`.
- Verification: 14 tests pass; TypeScript and web build pass (existing large bundle warning). Android playtest and difficulty evaluation remain pending.

### 2026-09-17 - Fixed large puzzle shape geometry

- Added deterministic square, upward triangle, and diamond raster shapes with a shared bounding-box size.
- Added cell containment checks and coverage tests for large puzzle pieces.
- Verification: focused shape tests and `npm run build` pass.

### 2026-09-17 — Kế hoạch triển khai puzzle redesign

- Ghi nhận người dùng duyệt spec thiết kế mảnh lớn và giao diện vũ trụ.
- Thêm `docs/superpowers/plans/2026-09-17-mirror-puzzle-visual-redesign.md` với 5 task: hình học, câu đố, bố cục, tương tác và kiểm chứng/đóng gói.
- Plan yêu cầu xem hình render thật và kiểm tra tương tác, không chỉ dựa vào test logic hoặc build.
- Kiểm tra: đối chiếu spec, chữ ký hàm, đường dẫn và diff; chưa triển khai gameplay.

### 2026-09-17 — Thiết kế lại câu đố và giao diện

- Thêm spec `docs/superpowers/specs/2026-09-17-mirror-puzzle-visual-redesign.md`: mảnh lớn, sáu hình đích trừu tượng cần chồng và giao diện vũ trụ nhẹ.
- Chốt hướng cố định, luật một màu; làm rõ thứ tự đặt không ảnh hưởng silhouette chẵn/lẻ.
- Ghi tiêu chí kiểm chứng dữ liệu, hình ảnh và tương tác trước khi triển khai; chưa thay đổi code gameplay.
- Kiểm tra: đọc đối chiếu luật hiện tại và rà soát liên kết tài liệu; không chạy lại test code cho thay đổi chỉ gồm spec.

### Repository setup

Commit: `docs repository setup`
Branch: `feat/mirror-prototype`

- Thêm README root làm điểm vào duy nhất cho người phát triển và AI.
- Thêm quy trình kiểm tra trước push và quy ước commit.
- Thêm changelog làm sổ theo dõi thay đổi code, tài liệu, cấu hình và level.

## 2026-09-17 — Prototype interaction refinement

Commit: `6b7f434`
Branch: `feat/mirror-prototype`

- Đổi toàn bộ mảnh và bóng mục tiêu sang một màu vàng cam.
- Thêm hình vuông, tam giác và hình thoi cho sáu level.
- Giữ mảnh ở vị trí tạm nếu thả ngoài vùng hít; vị trí tạm không tham gia kiểm tra thắng.
- Cho phép kéo mảnh xuống khay để gỡ khỏi bàn.
- Giảm bán kính hít từ 12 xuống 6 ô lưới.
- Cập nhật spec và lưu hai ảnh tham khảo trong `docs/ref/`.
- Kiểm tra: 12 test logic đạt, `npm run build` đạt, APK debug build đạt.

## 2026-09-17 — Android prototype implementation

Commit: `324716c`
Branch: `feat/mirror-prototype`

- Tạo game Phaser + TypeScript + Vite với sáu level prototype.
- Thêm bộ tính mặt nạ chồng chẵn/lẻ và kiểm tra silhouette.
- Thêm kéo thả, snap theo lưới, bóng mẫu, đặt lại và chuyển màn.
- Thêm dự án Capacitor Android, cấu hình khóa màn hình dọc và build APK debug.
- Thêm test cho mask, level và session.

## 2026-09-17 — Concept and design baseline

Commit: `8542725`
Branch: `main`

- Ghi nhận idea sheet, idea gate, đánh giá kỹ thuật và thiết kế prototype Android.
- Chốt phạm vi solo prototype sáu màn dùng Phaser + TypeScript + Capacitor.

## Quy ước ghi mục mới

Mỗi mục mới nên có cấu trúc:

```markdown
## YYYY-MM-DD — Tên thay đổi

Commit: `hash`
Branch: `branch-name`

- Thay đổi chính.
- Tác động đến gameplay, tài liệu hoặc build.
- Kiểm tra đã chạy và kết quả.
```

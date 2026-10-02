# Changelog

Nhật ký này là nguồn đọc nhanh cho người phát triển và AI. Mỗi commit có thay đổi về code, tài liệu, cấu hình hoặc level phải thêm một mục vào phần `Unreleased` trước khi push. Khi tạo bản phát hành, chuyển các mục đã hoàn tất sang một phiên bản có ngày cụ thể.

## Unreleased

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

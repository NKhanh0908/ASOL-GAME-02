# E2 — Hạ tầng lưu màn studio và đưa vào campaign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng toàn bộ phần không có UI của Xưởng: sinh file nguồn `.ts`, một đường authoring trong bộ nhớ, kho studio (lưu/liệt kê/xoá, chặn đường dẫn), plugin Vite với ba route có chống CSRF, nạp màn studio ở harness, và lệnh `content:promote`. Sau E2, trọn vòng lưu → chơi thử → promote làm được bằng `curl`.

**Architecture:** Phần thuần nằm trong `src/content/`: `serializeSource.ts`, `authorLevel.ts`, `studioStore.ts`, `promote.ts`. Plugin `scripts/studio/studioPlugin.ts` chỉ là lớp HTTP mỏng gọi `studioStore`. `vite.config.ts` (tạo mới) gắn plugin khi `command === 'serve'` và đặt `build.rollupOptions.input` chỉ gồm `index.html`. `catalog.ts` nạp màn studio qua `import.meta.glob` khi DEV.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vite 6.0.7 (`configureServer`, `import.meta.glob`), Vitest, Node 24 `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-10-02-e-level-studio-design.md`, mục 4 (ST-05..08), phần build của ST-01, mục 8.

**Giao được gì:** `GET /__studio/list`, `POST /__studio/save`, `POST /__studio/delete` trên dev server; màn studio chơi được bằng `?scene=play&level=<id>&mode=harness`; `npm run content:promote -- <studio-id> <mã-campaign>`; `vite build` chỉ có `index.html`.

## Vị trí trong loạt plan

- **Chỉ mục:** `docs/superpowers/plans/2026-10-02-e-level-studio.md`
- **Chạy sau:** E1 (`2026-10-02-e1-difficulty.md`), vì `authorLevel` gọi `scoreDifficulty`.
- **Nhánh:** `feat/level-studio-e2`, tách từ `feat/level-studio-e1`.
- **Chạy tiếp theo:** `2026-10-02-e3-1-logic.md`.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Không `enum`, không `namespace`, không parameter property.
- Mọi module mà `vite.config.ts` kéo vào (plugin, `studioStore`, `authorLevel` và chuỗi import của chúng) **không được import file JSON hay `catalog.ts`**, và không dùng `import.meta.env`/`import.meta.glob`. Chúng chạy trong Node lúc Vite nạp config.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Luật hiện/ẩn giữ **chẵn lẻ (XOR)** trong `domain/mask.ts`; không sửa file đó.
- Đã có từ plan trước (không viết lại):
  - A: `src/content/devLevels.ts` (`DEV_LEVEL_DOCUMENTS`) và nhánh màn dev trong `loadLevel(id, 'harness')`.
  - B: `src/content/newLevel.ts` (`constNameFromTitle`, `slugFromTitle`, `compareLevelIds`, `createLevelSourceText`, `registerInSourceIndex`); `src/content/sources/_template.ts`; `filterDecoys`, `DroppedDecoy`; `renderReportMarkdown(doc, report, dropped = [], warnings = [])` (đã thêm `warnings` ở E1); manifest 28 entry, mỗi entry **một dòng**.
  - D: `searchSolutions(doc)` với `proven`, `poseCounts`, `elapsedMs`; `LevelDocument.placement`, `allowUnproven`.
  - E1: `scoreDifficulty`, `collectWarnings`.
- Màn studio không bao giờ vào manifest, không hiện trên bản đồ, không nạp ở campaign.
- Không thêm dependency.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- CHANGELOG, commit message, GitNexus: như `2026-10-02-e1-difficulty.md` mục Global Constraints.

## Quyết định (đã chốt khi viết plan)

1. **Một đường authoring trong bộ nhớ, `authorLevel(source)`**: `buildLevelDocument` → `validateLevel` → `searchSolutions` → `filterDecoys` (lấy neo bị bỏ) → `scoreDifficulty`/`collectWarnings` → JSON/SVG/markdown. Lưu (ST-05), `content:promote` (ST-08) và Worker của Xưởng (E3) cùng gọi hàm này. `scripts/author-level.ts` giữ luồng cũ.
2. **Định dạng file nguồn sinh ra:** `import type …;\n\nexport const <tên>: LevelSource = {…};\n`, không có comment đầu file. Đối tượng chỉ gồm giá trị đơn (neo, bước nghiệm, gây nhiễu, bước FTUE) viết một dòng; còn lại mỗi khoá một dòng. Prototype: `serializeLevelSource` cho đúng từng byte nguồn 1-1, 1-3, 1-4, 1-6 sau khi bỏ comment đầu; 1-2 và 1-5 khác ở chỗ xuống dòng của đối tượng ngắn, nên test khoá byte trên 1-1 và khứ hồi trên mọi nguồn.
3. **Tên hằng file studio** là `constNameFromTitle(source.title)`; tên không có chữ cái/chữ số thì lưu trả `400 invalid-title`. Đường dẫn trong `SaveResult.files` tương đối từ `game-next/`, dấu `/`.
4. **Lưu không chặn khi có nghiệm thừa**: chỉ `400` khi dựng tài liệu hoặc validator lỗi.
5. **Mã studio** không được trùng bất kỳ mã nào trong manifest hoặc `sources/` (`409`).
6. **`content:promote` đọc JSON studio**, dựng lại `LevelSource` bằng `sourceFromDocument` (bỏ `cells`, `targetCells`, `board`, `schemaVersion`), nên chạy đồng bộ, không `import()` file `.ts`. Neo nhiễu đã bị KIT-03 bỏ không có trong JSON nên không sang campaign.
7. **Promote giữ `title` và `contentRevision`**, đổi `id`, `chapter`, `order` theo manifest; dòng manifest viết lại với `status: 'validated'`, `dataPath`. Promote **thêm id vào `AUTHORED_LEVELS`** của `tests/content.test.ts` nếu có hằng đó (test này bắt mọi màn ngoài tập phải là `planned`). Chương đích có luật xoay thì validator chặn như thường.
8. **Chống CSRF:** `POST` phải có `Content-Type: application/json` (`415`); `Origin` nếu có phải bằng `http://` + header `Host` (`403`); body > 1 MB thì `413`. Handler viết dạng hàm `(req, res, deps)` để test gọi trực tiếp, không cần server.
9. **`list`** đọc `src/content/studio/levels/*.json`, trả `{ id, title, chapter, difficultyEstimate }` sắp theo `compareLevelIds`. JSON hỏng thì bỏ qua và ghi `console.warn`, không làm hỏng cả danh sách.

## Bản đồ file

| File | Việc |
|---|---|
| `src/content/serializeSource.ts` | Tạo: `serializeLevelSource(source, constName)` |
| `src/content/authorLevel.ts` | Tạo: `authorLevel(source)` → `{ ok, issues, doc?, report?, dropped, score?, warnings, json?, svg?, markdown? }` |
| `src/content/studioStore.ts` | Tạo: `STUDIO_ID_PATTERN`, `SaveResult`, `saveStudioLevel`, `deleteStudioLevel`, `listStudioLevels`, `StudioError` |
| `scripts/studio/studioPlugin.ts` | Tạo: plugin Vite, ba route |
| `vite.config.ts` | Tạo: `defineConfig(({ command }) => …)` |
| `src/content/catalog.ts` | Sửa: nhánh màn studio khi DEV + harness |
| `src/content/promote.ts` | Tạo: `promoteStudioLevel`, `sourceFromDocument` |
| `scripts/promote-level.ts`, `package.json` | Tạo script, thêm `content:promote` |
| `.gitignore` | Không đổi: màn studio **được** commit (đó là "lưu vào repo") |

## Task

### Task 1: Serializer nguồn màn (`serializeLevelSource`)

**Files:**
- Create: `game-next/src/content/serializeSource.ts`
- Create: `game-next/tests/serializeSource.test.ts`

**Interfaces:**
- Consumes: `LevelSource` from `src/content/authoring.ts`.
- Produces: `serializeLevelSource(source: LevelSource, constName: string): string`.

- [ ] **Step 1: Viết test thất bại trong `tests/serializeSource.test.ts`**
  - Test khoá byte trên 1-1: bỏ comment đầu file `sources/1-1.ts`, `serializeLevelSource(LEVEL_SOURCES['1-1'], 'songTinh')` phải trùng đúng từng byte.
  - Test khứ hồi (round-trip) trên toàn bộ 22 nguồn trong `LEVEL_SOURCES`: ghi ra thư mục tạm, serialize và đối chiếu các trường dữ liệu.
- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  - `npm test tests/serializeSource.test.ts` báo lỗi do chưa có `src/content/serializeSource.ts`.
- [ ] **Step 3: Cài đặt `src/content/serializeSource.ts`**
  - Cài đặt `serializeLevelSource` với định dạng đúng chuẩn theo Quyết định 2 (đối tượng đơn giá trị trên một dòng, thụt lề 2 spaces).
- [ ] **Step 4: Chạy lại test để xác nhận test xanh**
  - `npm test tests/serializeSource.test.ts` xanh toàn bộ.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 1**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

---

### Task 2: `authorLevel` trong bộ nhớ

**Files:**
- Create: `game-next/src/content/authorLevel.ts`
- Create: `game-next/tests/authorLevel.test.ts`

**Interfaces:**
- Consumes: `buildLevelDocument`, `filterDecoys`, `serializeLevelDocument` từ `authoring.ts`; `searchSolutions`, `renderPreviewSvg`, `renderReportMarkdown` từ `authoringReport.ts`; `scoreDifficulty`, `collectWarnings` từ `difficulty.ts`.
- Produces: `AuthorResult`, `authorLevel(source: LevelSource): AuthorResult`.

- [ ] **Step 1: Viết test thất bại trong `tests/authorLevel.test.ts`**
  - Test trên `LEVEL_SOURCES['1-1']`: trả về `ok: true`, các chuỗi `json`, `svg`, `markdown` trùng khớp từng byte với file đã commit của 1-1.
  - Test nguồn lỗi: trả về `ok: false` kèm `issues`, không ném ngoại lệ.
- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  - `npm test tests/authorLevel.test.ts` báo lỗi.
- [ ] **Step 3: Cài đặt `src/content/authorLevel.ts`**
  - Cài đặt hàm `authorLevel(source: LevelSource)` gom trọn quy trình authoring trong bộ nhớ.
- [ ] **Step 4: Chạy test để xác nhận test xanh**
  - `npm test tests/authorLevel.test.ts` xanh toàn bộ.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 2**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

---

### Task 3: Kho studio (`studioStore`)

**Files:**
- Create: `game-next/src/content/studioStore.ts`
- Create: `game-next/tests/studioStore.test.ts`

**Interfaces:**
- Consumes: `serializeLevelSource`, `authorLevel`, `constNameFromTitle`, `compareLevelIds`.
- Produces: `STUDIO_ID_PATTERN`, `SaveStudioOptions`, `SaveResult`, `saveStudioLevel`, `deleteStudioLevel`, `listStudioLevels`.

- [ ] **Step 1: Viết test thất bại trong `tests/studioStore.test.ts`**
  - Test `saveStudioLevel`: ghi đủ 4 file (`.ts`, `.json`, `.svg`, `-report.md`) vào thư mục tạm; từ chối id không hợp lệ, id chứa path traversal, id trùng mã campaign.
  - Test `listStudioLevels`: trả về danh sách sắp theo `compareLevelIds`, bỏ qua file json hỏng kèm warning.
  - Test `deleteStudioLevel`: xoá đúng 4 file, từ chối id không hợp lệ.
- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  - `npm test tests/studioStore.test.ts` báo lỗi.
- [ ] **Step 3: Cài đặt `src/content/studioStore.ts`**
  - Định nghĩa `STUDIO_ID_PATTERN`, `saveStudioLevel`, `deleteStudioLevel`, `listStudioLevels`.
- [ ] **Step 4: Chạy test để xác nhận test xanh**
  - `npm test tests/studioStore.test.ts` xanh toàn bộ.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 3**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

---

### Task 4: Plugin Vite và `vite.config.ts`

**Files:**
- Create: `game-next/scripts/studio/studioPlugin.ts`
- Create: `game-next/vite.config.ts`
- Create: `game-next/tests/studioPlugin.test.ts`

**Interfaces:**
- Consumes: `saveStudioLevel`, `deleteStudioLevel`, `listStudioLevels` từ `studioStore.ts`.
- Produces: `studioPlugin()`, `handleStudioRequest(req, res, options)`.

- [ ] **Step 1: Viết test thất bại trong `tests/studioPlugin.test.ts`**
  - Test các mã phản hồi HTTP: 200 cho save/list/delete, 400 (bad request), 403 (Origin mismatch), 409 (id trùng campaign), 413 (body > 1MB), 415 (Content-Type không phải application/json).
- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  - `npm test tests/studioPlugin.test.ts` báo lỗi.
- [ ] **Step 3: Cài đặt `scripts/studio/studioPlugin.ts` và `vite.config.ts`**
  - Cài đặt plugin Vite với middleware xử lý 3 endpoint.
  - Tạo `vite.config.ts` cấu hình chỉ gắn plugin khi `command === 'serve'`, và `build.rollupOptions.input` chỉ chứa `index.html`.
- [ ] **Step 4: Chạy test và xác nhận build không chứa studio**
  - `npm test tests/studioPlugin.test.ts` xanh.
  - `npm run build` thành công và `dist/` không chứa `studio.html`.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 4**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

---

### Task 5: Nạp màn studio trong game (`catalog.ts`)

**Files:**
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/tests/catalog.test.ts`

**Interfaces:**
- Consumes: `loadLevel(id, mode)`.
- Produces: Hỗ trợ nạp màn studio khi `DEV` và `mode === 'harness'`.

- [ ] **Step 1: Phân tích impact trên `loadLevel`**
  - Chạy `impact({ target: "loadLevel", direction: "upstream" })`.
- [ ] **Step 2: Viết test thất bại trong `tests/catalog.test.ts`**
  - Chế độ campaign từ chối màn studio.
  - Chế độ harness nạp được màn studio khi DEV.
- [ ] **Step 3: Cập nhật `src/content/catalog.ts`**
  - Thêm `import.meta.glob('./studio/levels/*.json', { eager: true, import: 'default' })` khi DEV.
  - Cập nhật thứ tự nạp: manifest → devLevels → studioLevels.
- [ ] **Step 4: Chạy test để xác nhận test xanh**
  - `npm test tests/catalog.test.ts` xanh.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 5**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

---

### Task 6: `content:promote`

**Files:**
- Create: `game-next/src/content/promote.ts`
- Create: `game-next/scripts/promote-level.ts`
- Modify: `game-next/package.json`
- Create: `game-next/tests/promote.test.ts`

**Interfaces:**
- Consumes: `sourceFromDocument`, `promoteStudioLevel`.
- Produces: Lệnh `npm run content:promote -- <studio-id> <target-id>`.

- [ ] **Step 1: Viết test thất bại trong `tests/promote.test.ts`**
  - Test promote thành công trên thư mục tạm: chuyển đổi document sang source, sinh các file campaign, đăng ký sources/index.ts, cập nhật manifest.ts sang `validated`, thêm AUTHORED_LEVELS, xoá file studio.
  - Test từ chối khi targetId không ở trạng thái `planned` hoặc màn có nhiều nghiệm / ít nghiệm hơn.
- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  - `npm test tests/promote.test.ts` báo lỗi.
- [ ] **Step 3: Cài đặt `promote.ts`, `promote-level.ts` và `package.json`**
  - Cài đặt `sourceFromDocument` và `promoteStudioLevel`.
  - Tạo script CLI `scripts/promote-level.ts`.
  - Thêm lệnh `content:promote` vào `package.json`.
- [ ] **Step 4: Chạy test để xác nhận test xanh**
  - `npm test tests/promote.test.ts` xanh toàn bộ.
- [ ] **Step 5: Ghi CHANGELOG và commit Task 6**
  - Thêm mục vào `CHANGELOG.md`, chạy `detect_changes()`, typecheck, git commit.

## Kiểm tra cuối E2 (điểm dừng 2 trong chỉ mục)

- `npm run typecheck && npm test && npm run build` xanh; `dist/` không có `studio.html`.
- Trọn vòng bằng `curl`: lưu màn clone từ 1-4 → list thấy màn → chơi thử ở harness thắng được → `content:promote` vào một mã `planned` → `npm test` vẫn xanh. Sau đó hoàn tác commit promote thử (không giữ màn thử trong campaign).

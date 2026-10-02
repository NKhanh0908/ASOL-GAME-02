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

> **Trạng thái:** khung task, **chưa có bước TDD và code**. Người viết tiếp dùng skill `superpowers:writing-plans`, giữ nguyên quyết định ở trên.

### Task 1: Serializer nguồn màn — CHƯA VIẾT

- Test khoá byte trên 1-1 (bỏ comment đầu); khứ hồi trên mọi nguồn trong `LEVEL_SOURCES`: ghi ra thư mục tạm, `import()` lại, `toEqual` nguồn gốc.

### Task 2: `authorLevel` — CHƯA VIẾT

- Test: kết quả trên 1-1 trùng JSON/SVG/báo cáo đã commit (byte); nguồn lỗi trả `ok: false` kèm `issues`, không ném.
- Không sửa `scripts/author-level.ts`.

### Task 3: Kho studio — CHƯA VIẾT

- `saveStudioLevel({ source, root, manifestIds, sourceIds })`, `deleteStudioLevel({ id, root })`, `listStudioLevels({ root })`. `root` là thư mục chứa `game-next/` và `docs/` để test dùng thư mục tạm.
- Test: đủ bốn file; JSON đã ghi bằng `buildLevelDocument(import(<.ts>))`; từ chối id sai mẫu, `..`, `/`, trùng manifest; xoá đúng bốn file; list đúng thứ tự.

### Task 4: Plugin Vite và `vite.config.ts` — CHƯA VIẾT

- Test handler: `200` lưu/xoá/list, `400`, `403`, `409`, `413`, `415`.
- `vite.config.ts`: plugin chỉ khi `serve`; `build.rollupOptions.input: { main: 'index.html' }`.
- Kiểm: `npm run build` rồi kiểm `dist/` không có `studio.html`; dev server + `curl` lưu một màn mẫu.

### Task 5: Màn studio trong game — CHƯA VIẾT

- `catalog.ts`: `import.meta.glob('./studio/levels/*.json', { eager: true, import: 'default' })` trong nhánh `import.meta.env.DEV`; thứ tự tìm manifest → dev → studio (ST-07). Chạy `impact` trên `loadLevel` trước khi sửa.
- Test: campaign từ chối id studio; harness nạp được (giả lập bằng tham số tiêm, không phụ thuộc file thật).
- Kiểm tay: lưu bằng `curl`, mở `?scene=play&level=<id>&mode=harness`, thắng được.

### Task 6: `content:promote` — CHƯA VIẾT

- Test trên thư mục tạm: chuyển đúng file, đăng ký `sources/index.ts` và `catalog.ts`, viết lại dòng manifest, thêm `AUTHORED_LEVELS`, xoá bản studio; từ chối mã đích không `planned`, màn không có đúng một nghiệm, mà không ghi file nào.

## Kiểm tra cuối E2 (điểm dừng 2 trong chỉ mục)

- `npm run typecheck && npm test && npm run build` xanh; `dist/` không có `studio.html`.
- Trọn vòng bằng `curl`: lưu màn clone từ 1-4 → list thấy màn → chơi thử ở harness thắng được → `content:promote` vào một mã `planned` → `npm test` vẫn xanh. Sau đó hoàn tác commit promote thử (không giữ màn thử trong campaign).

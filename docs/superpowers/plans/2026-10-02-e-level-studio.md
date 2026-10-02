# E — Xưởng tạo màn (Level Studio) và điểm độ khó tự động

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng trang dev `studio.html` để tác giả kéo mảnh, thêm neo nhiễu, xem bóng chẵn/lẻ, số nghiệm và điểm độ khó ngay trên trang; lưu màn vào repo qua plugin Vite, chơi thử ở harness, rồi đưa màn vào campaign bằng `npm run content:promote`.

**Architecture:** Phần thuần nằm trong `src/content/`: `serializeSource.ts` (sinh file nguồn `.ts`), `difficulty.ts` (điểm độ khó DF-01..03), `authorLevel.ts` (một lần chạy authoring trong bộ nhớ: dựng tài liệu, validator, bộ giải, điểm, JSON, SVG, báo cáo), `studioStore.ts` (ghi/xoá bốn file của màn studio, chặn đường dẫn), `promote.ts` (chuyển màn studio vào campaign, sửa text `sources/index.ts`, `catalog.ts`, `manifest.ts`). Plugin Vite `scripts/studio/studioPlugin.ts` chỉ là lớp HTTP mỏng gọi `studioStore`. Trang Xưởng (`studio.html`, `src/studio/*`) viết bằng DOM + SVG, không Phaser: `state.ts` (reducer thuần), `keys.ts` (phím → lệnh), `geometry.ts` (lớp chồng, đường viền, hít lưới), `check.ts` (hàng đợi kiểm tra 300 ms) chạy test được; `boardView.ts`, `palette.ts`, `inspector.ts`, `library.ts`, `main.ts` là view DOM, kiểm bằng ảnh Chrome headless. Kiểm tra trực tiếp chạy trong Web Worker `solverWorker.ts` gọi đúng `authorLevel` mà server và `content:promote` dùng, nên Xưởng thấy đúng thứ game sẽ chạy.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vite 6 (plugin `configureServer`, `import.meta.glob`, Web Worker module), Vitest, Node 24 `--experimental-strip-types`, Chrome headless để chụp ảnh.

**Spec:** `docs/superpowers/specs/2026-10-02-e-level-studio-design.md`

**Giao được gì:** `http://localhost:5173/studio.html` (chỉ trên dev server) với ba cột kho màn / bàn / thông số; `POST /__studio/save` và `POST /__studio/delete`; màn studio chơi được bằng `?scene=play&level=<id>&mode=harness`; `npm run content:promote -- <studio-id> <mã-campaign>`; `scoreDifficulty` và cảnh báo `difficulty-mismatch` trong báo cáo; `vite build` không chứa `studio.html`.

## Vị trí trong loạt plan

- **Chạy sau:** plan A (`2026-10-02-a-shapes-v2.md`), plan B (`2026-10-02-b-level-kit-chapters.md`), plan D (`2026-10-02-d-free-placement.md`) — phải xong và xanh. Plan C (`2026-10-02-c-chapter-2-hoa-pham-levels.md`) **nên** xong trước để bảng hiệu chỉnh điểm độ khó có đủ 16 màn của spec C. Làm trên nhánh mới tách từ nhánh của plan D (hoặc của plan C nếu C xong sau D): `feat/level-studio`.
- **Nếu plan C chưa xong:** Task 2 hiệu chỉnh trên 6 màn 1-x đang có (ngưỡng đã chọn sẵn bằng prototype chạy trên cả 22 màn, xem "Con số đã tính trước"); Task 12 là bước bắt buộc mở rộng bảng hiệu chỉnh khi C vào nhánh. Nghiệm thu (Task 13) clone `1-4` thay cho `3-4`.
- **Chạy tiếp theo:** không có plan nào phụ thuộc E.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Code chạy bằng `node --experimental-strip-types` (script, và mọi module mà `vite.config.ts` kéo vào): không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Luật hiện/ẩn giữ **chẵn lẻ (XOR)** trong `domain/mask.ts`; không sửa file đó.
- Lưới 128 × 160 ô logic; neo là gốc khung, bội của 8; Xưởng vẽ 4px/ô (bàn SVG 512 × 640), lưới hiển thị 8 ô, module 24 ô (giống `renderPreviewSvg`).
- Đã có từ plan trước (không viết lại):
  - A: `shapePolygon`, `shapeCells`, `effectiveOrientation`, `isValidOrientation`, `isValidFrame(kind, orientation, frameSize)`, `mirrorOrientation(kind, orientation, axis)`; `ShapeKind` có `'circle' | 'parallelogram'`; `src/content/devLevels.ts` (`DEV_LEVEL_DOCUMENTS`) và nhánh màn dev trong `loadLevel(id, 'harness')` của `catalog.ts`.
  - B: `src/content/kit.ts` (`piece`, `mirrorX`, `mirrorY`, `concentric`, `row`, `NUDGE`, `CROSS`, `DECOY_IDS`); `src/content/newLevel.ts` (`constNameFromTitle`, `slugFromTitle`, `compareLevelIds`, `createLevelSourceText`, `registerInSourceIndex`); `createNewLevel` trong `scripts/new-level.ts` (đã nhận `studioDir`); `src/content/sources/_template.ts` (`levelTemplate`); `filterDecoys(source)` và `DroppedDecoy` trong `authoring.ts` (KIT-03); `renderReportMarkdown(doc, report, dropped = [])`; `chapter: 1 | 2 | 3 | 4`; manifest 28 entry, mỗi entry **một dòng**.
  - D: `src/domain/freePlacement.ts` (`nearestGridOrigin(piece, turns, gx, gy)`, `GRID_STEP = 8`); `src/content/solver.ts` (`solveLevel`); `LevelDocument.placement?: 'anchors' | 'free'`, `allowUnproven?: { reason }`; `searchSolutions(doc)` trả `SolutionReport` có `distractors`, `proven`, `poseCounts`, `elapsedMs`.
- `ValidationResult` **không đổi**. Cảnh báo độ khó đi qua hàm riêng `collectWarnings`.
- Màn studio không bao giờ vào manifest, không hiện trên bản đồ, không nạp ở campaign. Plugin chỉ gắn khi `command === 'serve'`; `vite build` chỉ có `index.html`.
- Không thêm dependency.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md` (gốc repo): `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, các gạch đầu dòng thay đổi kèm file, dòng cuối `- Verification: <lệnh và kết quả>`.
- Commit message tiếng Anh `type(scope): summary`, kết thúc bằng hai dòng:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Co-authored-by: Codex <noreply@codex.local>`
  Trên Windows ghi message vào một file tạm ngoài repo (scratchpad) rồi dùng `git commit -F <file>`; không commit file đó.
- Dev server cho ảnh chụp: `npm run dev -- --port 5173 --strictPort` chạy nền (chờ dòng `Local: http://localhost:5173`). Chrome: `"/c/Program Files/Google/Chrome/Application/chrome.exe"`. Ảnh Xưởng lưu ở `docs/testing/studio/`.

## Quyết định ngoài spec (đã chốt khi viết plan)

1. **Một đường authoring trong bộ nhớ, `authorLevel(source)`** (`src/content/authorLevel.ts`): `buildLevelDocument` → `validateLevel` → `searchSolutions` → `filterDecoys` (lấy neo bị bỏ) → `scoreDifficulty`/`collectWarnings` → JSON/SVG/markdown. Server lưu (ST-05), `content:promote` (ST-08, bước "chạy content:author") và Web Worker của Xưởng (ST-04) cùng gọi hàm này. `scripts/author-level.ts` giữ nguyên luồng cũ, chỉ thêm cảnh báo độ khó, để không đụng file B/D vừa sửa.
2. **Định nghĩa chính xác các thành phần DF-01** (spec để ngỏ):
   - `choices` dùng `report.poseCounts` cho cả màn neo lẫn màn `free` (bộ giải của D đếm số neo vừa bàn × số nấc xoay đại diện; màn `free` là số tư thế FP-06). `log2` từng mảnh lấy `max(1, n)`.
   - `hollow` = ô có số lớp chẵn ≥ 2; `revive` = ô có số lớp lẻ ≥ 3; số lớp tính trên nghiệm mẫu thứ nhất, ô đã xoay theo `turns`.
   - `nearMiss` màn neo: `min(changedCells)` trên các dòng `report.distractors` có `changedCells !== null`; không có dòng nào thì thành phần = 0. Màn `free`: dịch từng mảnh của nghiệm đi 8 ô theo 4 hướng, bỏ hướng làm mảnh ra ngoài bàn (`fitsBoard`), lấy số ô đổi nhỏ nhất.
   - `hiddenEdges` = (số đoạn biên ô của từng mảnh trong nghiệm mà hai ô hai bên **cùng** là mục tiêu hoặc **cùng** không là mục tiêu) / (tổng số đoạn biên ô của các mảnh). Mép bàn coi phía ngoài là "không mục tiêu".
   - Mọi thành phần chặn trong 0–1. `score = 1 + số ngưỡng mà raw ≥ ngưỡng`, ngưỡng `[0.14, 0.26, 0.43, 0.50]`.
3. **Ngưỡng chọn trên 22 màn** (6 màn 1-x + 16 màn spec C dựng từ nguồn trong plan C). Trọng số giữ đúng bộ khởi đầu của spec (0,20/0,25/0,10/0,10/0,15/0,20) vì đã đạt ±1 cho cả 22 màn; 13/22 màn trùng khớp tuyệt đối. Không ngưỡng nào cho được đồng thời 3-6 = 4 và 3-10 = 5 như ví dụ ở DF-02 (raw 3-6 = 0,5288 > raw 3-10 = 0,4718); bảng chọn 3-6 → 5, 3-10 → 4, cả hai trong ±1.
4. **Cảnh báo DF-03 chỉ in khi có**: `renderReportMarkdown` thêm tham số thứ tư `warnings = []`, mục `## Cảnh báo` chỉ xuất hiện khi mảng khác rỗng. Với ngưỡng trên, không màn hiện có nào bị cảnh báo, nên `content:author -- --all` không đổi byte nào của báo cáo đã commit.
5. **Định dạng file nguồn sinh ra:** đúng hợp đồng `import type …;\n\nexport const <tên>: LevelSource = {…};\n`, không có comment đầu file. Đối tượng chỉ gồm giá trị đơn (neo, bước nghiệm, gây nhiễu, bước FTUE) viết một dòng; còn lại mỗi khoá một dòng. Prototype: `serializeLevelSource` cho đúng từng byte nguồn 1-1, 1-3, 1-4, 1-6 sau khi bỏ comment đầu; 1-2 và 1-5 khác ở chỗ xuống dòng của đối tượng ngắn (nguồn tay viết `anchors: [{ … }]` một dòng), nên test khoá byte trên 1-1 và khứ hồi trên mọi nguồn.
6. **Tên hằng file studio** là `constNameFromTitle(source.title)` (plan B); tên không có chữ cái/chữ số thì lưu trả `400 invalid-title`. Đường dẫn trả về trong `SaveResult.files` là đường tương đối từ `game-next/`, dấu `/`.
7. **Lưu không chặn khi có nghiệm thừa**: server chỉ trả `400` khi dựng tài liệu hoặc validator lỗi (đúng ST-05). Nghiệm ít mảnh hơn hay nhiều nghiệm hiện ở cột phải; `content:promote` từ chối (như `content:author`).
8. **`content:promote` đọc JSON studio** (`src/content/studio/levels/<id>.json`), dựng lại `LevelSource` bằng `sourceFromDocument` (bỏ `cells`, `targetCells`, `board`, `schemaVersion`), nên chạy đồng bộ và không phải `import()` file `.ts`. JSON và `.ts` luôn sinh cùng lúc từ một nguồn khi Lưu; sửa tay file `.ts` thì phải mở và Lưu lại trong Xưởng trước khi promote. Neo nhiễu đã bị KIT-03 bỏ không có trong JSON nên cũng không sang campaign (đằng nào cũng bị bỏ).
9. **Promote giữ `title` và `contentRevision` của màn studio**, đổi `id`, `chapter`, `order` theo manifest; dòng manifest được viết lại với title/revision đó, `status: 'validated'`, `dataPath`. Promote **cũng thêm id vào `AUTHORED_LEVELS`** của `tests/content.test.ts` (nếu có hằng đó), vì test này bắt mọi màn không trong tập phải là `planned`; thiếu bước này thì tiêu chí 7.6 (`npm test` xanh) không đạt. Chương đích có luật xoay (chương 4 bắt buộc `rotationEnabled: true`) thì validator chặn như thường: tác giả phải đặt chương/xoay trong Xưởng trước.
10. **Clone trong Xưởng dùng cùng luật đặt tên với `content:new`**: tiêu đề mặc định `Màn <id>`, `contentRevision = slugFromTitle(title) + '-v1'`, `chapter` theo tiền tố `1-`…`4-` của id mới, giữ `order`. Hàm `cloneLevelSource` (thuần, trong `src/studio/state.ts`) gọi `slugFromTitle` của plan B. Tạo mới = clone `levelTemplate`.
11. **Xưởng tự quản `distractors`**: mỗi neo nhiễu có đúng một dòng gây nhiễu, lý do sinh từ độ lệch so với neo A ("Lệch phải 8 ô", "Lệch xuống 8 ô", ghép bằng dấu phẩy khi lệch hai trục, "Trùng neo A" khi lệch 0). Dòng tay viết từ màn clone được giữ nguyên cho tới khi neo đó bị kéo. Chuyển `placement` sang `'free'` xoá mọi neo nhiễu và dòng gây nhiễu (validator của D cấm chúng); tắt `rotationEnabled` đưa mọi `turns` về 0.
12. **Kéo mảnh/neo nhiễu**: `nearestGridOrigin` (D) trên ô ở hướng nghiệm; vì mọi điểm cách giao điểm gần nhất ≤ 4√2 < 6 nên chỉ ra `null` khi không giao điểm nào trong 4 góc vừa bàn; khi đó, và luôn luôn sau đó, gốc được kẹp để **khung** nằm trong bàn (luật `checkSourceGeometry`) — với neo A. Neo nhiễu không bị kẹp: neo ra ngoài bàn hiện đỏ "Vượt biên bàn" (KIT-03 sẽ bỏ). Kéo neo A thì neo nhiễu đi theo, giữ độ lệch. `Ctrl+D` nhân bản chỉ neo A, lệch (+8, +8), nếu không vừa thì (−8, −8), nếu vẫn không vừa thì trùng chỗ.
13. **"Mở SVG"** mở SVG của trạng thái đang sửa (Worker đã sinh bằng `renderPreviewSvg`, cùng hàm với file đã lưu) qua `blob:` URL, vì `docs/` nằm ngoài gốc Vite và không phục vụ được qua dev server.
14. **Hàng đợi kiểm tra**: chỉ một lần giải chạy trong Worker tại một thời điểm; yêu cầu mới trong lúc đang giải được giữ lại (chỉ bản mới nhất) và gửi khi kết quả về; kết quả có `seq` cũ hơn yêu cầu mới nhất vẫn hiện nhưng đánh dấu "đang cập nhật".
15. **Mở lại sau khi Lưu**: Vite tải lại trang khi file studio mới xuất hiện (glob đổi); Xưởng giữ màn đang mở trong `location.hash` (`studio.html#<id>`), nên trang tự mở lại đúng màn.

## Con số đã tính trước

Tính bằng prototype độc lập chạy bằng `node --experimental-strip-types` trong scratchpad khi viết plan (`eproto/diff.ts`, `eproto/check.ts`): bản sao `src/` hiện tại, `shapes.ts` thay bằng code plan A Task 1, `filterDecoys` của plan B, nguồn 16 màn spec C trích nguyên văn từ plan C; `poseCounts` màn neo = số neo của mảnh (đúng `buildPoseSpace` của D cho màn không xoay); `changedCells` của gây nhiễu tính như `searchSolutions`. Số ô rỗng/hiện lại của 16 màn trùng khớp bảng spec C mục 3. Test khoá đúng các số này; nếu code ra số khác thì **dừng và đối chiếu**, không sửa test theo code.

**Màn đang có (bảng hiệu chỉnh Task 2):**

| Màn | Ước lượng | pieces | choices | hollow | revive | nearMiss | hiddenEdges | raw | Điểm |
|---|---|---|---|---|---|---|---|---|---|
| 1-1 | 1 | 1/6 | 2/20 | 0 | 0 | 1 − 1280/2304 | 0/380 | 0,1250 | 1 |
| 1-2 | 1 | 1/6 | 2/20 | 0 | 0 | 1 − 352/2880 | 94/334 | 0,2463 | 2 |
| 1-3 | 2 | 1/6 | 2/20 | 0 | 0 | 1 − 2256/2304 | 0/380 | 0,0615 | 1 |
| 1-4 | 2 | 2/6 | 3/20 | 0 | 0 | 1 − 352/4032 | 4/524 | 0,2426 | 2 |
| 1-5 | 3 | 2/6 | 2/20 | 0 | 0 | 1 − 696/4560 | 188/568 | 0,2850 | 3 |
| 1-6 | 3 | 2/6 | 3/20 | 0 | 0 | 1 − 704/3456 | 188/570 | 0,2896 | 3 |

**16 màn spec C (bảng mở rộng Task 12):**

| Màn | Ước lượng | pieces | choices | hollow | revive | nearMiss | hiddenEdges | raw | Điểm |
|---|---|---|---|---|---|---|---|---|---|
| 2-1 | 2 | 1/6 | 4/20 | 576/2304 | 0/1728 | 1 − 352/1728 | 94/428 | 0,2717 | 3 |
| 2-2 | 3 | 1/6 | 4/20 | 512/4096 | 0/3584 | 1 − 728/3584 | 4/570 | 0,2168 | 2 |
| 2-3 | 3 | 2/6 | 6/20 | 384/4096 | 128/3712 | 1 − 192/3712 | 4/632 | 0,2980 | 3 |
| 2-4 | 3 | 2/6 | 6/20 | 384/3584 | 128/3200 | 1 − 192/3200 | 4/570 | 0,2988 | 3 |
| 2-5 | 4 | 3/6 | 8/20 | 1284/3196 | 512/1912 | 1 − 224/1912 | 2/636 | 0,4000 | 3 |
| 2-6 | 4 | 3/6 | 8/20 | 1536/4096 | 512/2560 | 1 − 448/2560 | 24/764 | 0,3875 | 3 |
| 3-1 | 2 | 2/6 | 6/20 | 1116/5148 | 128/4032 | 1 − 192/4032 | 4/574 | 0,3108 | 3 |
| 3-2 | 2 | 3/6 | 8/20 | 1232/6400 | 0/5168 | 1 − 248/5168 | 192/734 | 0,4144 | 3 |
| 3-3 | 3 | 3/6 | 8/20 | 312/2616 | 0/2304 | 1 − 184/2304 | 10/516 | 0,3538 | 3 |
| 3-4 | 3 | 3/6 | 8/20 | 720/5036 | 0/4316 | 1 − 448/4316 | 68/638 | 0,3700 | 3 |
| 3-5 | 3 | 3/6 | 7/20 | 217/4163 | 0/3946 | 1 − 456/3946 | 68/698 | 0,3449 | 3 |
| 3-6 | 4 | 1 (6/6) | 13/20 | 256/4096 | 0/3840 | 1 − 184/3840 | 68/788 | 0,5288 | 5 |
| 3-7 | 3 | 4/6 | 10/20 | 288/4192 | 0/3904 | 1 − 256/3904 | 8/822 | 0,4073 | 3 |
| 3-8 | 3 | 3/6 | log2(3·4·4·4)/20 | 812/5164 | 0/4352 | 1 − 224/4352 | 66/732 | 0,3708 | 3 |
| 3-9 | 3 | 2/6 | 6/20 | 980/2560 | 812/1580 | 1 − 512/1580 | 16/574 | 0,3383 | 3 |
| 3-10 | 5 | 4/6 | 10/20 | 2732/7200 | 1364/4468 | 1 − 192/4468 | 8/1084 | 0,4718 | 4 |

Mọi màn lệch ≤ 1 so với ước lượng. Ghi chú cho plan C: nguồn 3-5 (`H1.A` (24, 104), khung 64) và 3-6 (`T1.A` (88, 56)) có **khung** vượt biên bàn dù **ô** vẫn trong bàn; `checkSourceGeometry` hiện tại báo lỗi "khung mảnh vượt biên bàn". Prototype bỏ qua kiểm này để tính điểm; nếu plan C đổi toạ độ hai màn đó thì chạy lại Task 12 Step 2 và cập nhật hai dòng tương ứng (không đổi ngưỡng nếu vẫn ±1).

**Fixture tay (Task 2):** vuông khung 16, `difficultyEstimate: 1`, chương 2.

| Fixture | Mảnh (gốc) | Ô mục tiêu | parts | raw | Điểm |
|---|---|---|---|---|---|
| `single` | S1 (0,0) | 256 | tất cả 0 | 0 | 1 |
| `pair` | S1 (0,0) + neo B (0,8); S2 (8,0) | 256 | pieces 1/6, choices 1/20, hollow 1/3, revive 0, nearMiss 0 (gây nhiễu đổi 256 ô), hiddenEdges 32/128 | 0,129166… | 1 |
| `triple` | S1 (0,0); S2 (8,0); S3 khung 32 (0,0) | 768 | pieces 2/6, choices 0, hollow 1/4, revive 1/6, nearMiss 0, hiddenEdges 0,3125 | 0,170833… | 2 |
| `free` | S1 khung 32 (0,0); S2 (8,8); `placement: 'free'`, `poseCounts` [221, 285] | 768 | pieces 1/6, choices log2(62985)/20 = 0,797136…, hollow 1/4, revive 0, nearMiss 1 − 256/768, hiddenEdges 0 | 0,357617… | 3 |

**Đường viền lớp (Task 9):** khối 3 lớp của fixture `triple` (cột 8–15, hàng 0–15) cho đường `M32 0H64M32 64H64M32 0V64M64 0V64` ở tỉ lệ 4.

---

## ⏸️ TẠM DỪNG — phần dưới đây chưa được viết

> **Trạng thái (2026-10-02):** người review yêu cầu tạm dừng. Plan **chưa thực thi được**: phần trên (header, Global Constraints, 15 quyết định, bảng con số đã tính trước) đã xong; **chưa có task nào**. Người viết tiếp: đọc phần trên, giữ nguyên các quyết định và con số, rồi thay mục này bằng các task đầy đủ (TDD, code thật, CHANGELOG + commit) theo khuôn plan A, và thêm bảng tự rà soát cuối plan.

**Khung task dự kiến** (số task khớp với các tham chiếu "Task 2", "Task 9", "Task 12" ở phần trên):

| # | Task | Sản phẩm chính | Trạng thái |
|---|---|---|---|
| 1 | Serializer nguồn màn | `src/content/serializeSource.ts` → `serializeLevelSource(source, constName)`; test khoá byte trên 1-1, khứ hồi trên mọi nguồn (quyết định 5) | CHƯA VIẾT |
| 2 | Điểm độ khó + hiệu chỉnh 1-x | `src/content/difficulty.ts` → `scoreDifficulty`, `DifficultyScore`, ngưỡng `[0.14, 0.26, 0.43, 0.50]`; bảng hiệu chỉnh 6 màn 1-x và 4 fixture tay (mục "Con số đã tính trước") | CHƯA VIẾT |
| 3 | Đường authoring chung + cảnh báo | `src/content/authorLevel.ts` → `authorLevel(source)`; `collectWarnings`; `renderReportMarkdown(..., warnings = [])` (quyết định 1, 4) | CHƯA VIẾT |
| 4 | Kho studio | `src/content/studioStore.ts` → `STUDIO_ID_PATTERN`, `SaveResult`, `saveStudioLevel`, `deleteStudioLevel`; test thư mục tạm, từ chối `..`, `/`, id trùng màn campaign (ST-05, ST-06, quyết định 6, 7) | CHƯA VIẾT |
| 5 | Plugin Vite + cấu hình build | `vite.config.ts` (chỉ `index.html` khi build), `scripts/studio/studioPlugin.ts` (`/__studio/save`, `/__studio/delete`, chỉ khi `serve`) | CHƯA VIẾT |
| 6 | Màn studio trong game | `catalog.ts` nạp `src/content/studio/levels/*.json` qua `import.meta.glob`, chỉ DEV + harness (ST-07) | CHƯA VIẾT |
| 7 | Đưa màn vào campaign | `src/content/promote.ts` → `promoteStudioLevel`, `sourceFromDocument`; `scripts/promote-level.ts`; npm `content:promote`; cập nhật `AUTHORED_LEVELS` (ST-08, quyết định 8, 9) | CHƯA VIẾT |
| 8 | Trạng thái và phím tắt Xưởng | `src/studio/state.ts` (reducer, `cloneLevelSource`, tự quản `distractors`), `src/studio/keys.ts` (R, Shift+R, Delete, Ctrl+D, mũi tên) (quyết định 10, 11, 12) | CHƯA VIẾT — agent dừng giữa lúc viết task này |
| 9 | Bàn SVG | `src/studio/boardView.ts`: lưới, bóng chẵn/lẻ, viền chấm vùng ≥3 lớp (đường mẫu ở mục "Đường viền lớp"), neo nhiễu nét đứt/đỏ | CHƯA VIẾT |
| 10 | Trang Xưởng | `studio.html`, `src/studio/main.ts`, `palette.ts`, `inspector.ts`, `library.ts`, `api.ts`; "Mở SVG" qua `blob:`; mở lại bằng `location.hash` (quyết định 13, 15) | CHƯA VIẾT |
| 11 | Kiểm tra trong Worker | `src/studio/solverWorker.ts`, debounce 300 ms, hàng đợi một lần giải (quyết định 14) | CHƯA VIẾT |
| 12 | Mở rộng hiệu chỉnh lên 16 màn spec C | thêm bảng 16 màn vào test khi plan C xong | CHƯA VIẾT |
| 13 | Nghiệm thu | ảnh chụp `studio.html` 1440×900; chạy trọn tiêu chí spec mục 7; `npm run build` không chứa `studio.html` | CHƯA VIẾT |

**⚠️ Vấn đề mở, phát hiện khi viết plan này — phải xử lý trước khi chạy plan C:**

- Nguồn **3-5** (`H1`, tam giác hướng 6, khung 64, neo A (24, 104)) và **3-6** (`T1`, bình hành hướng 1, khung 48, neo A (88, 56)) có **khung** vượt biên bàn (y tới 168 > 160; x tới 136 > 128) dù **ô** vẫn nằm trong bàn. `checkSourceGeometry` hiện tại kiểm theo khung nên sẽ báo "khung mảnh vượt biên bàn".
- Hai cách, người review chọn: (1) dời toạ độ hai mảnh trong spec C / plan C rồi tính lại số liệu; (2) đổi `checkSourceGeometry` sang kiểm theo ô thực của mảnh (giống `fitsBoard`).
- Bảng điểm độ khó ở trên tính với toạ độ hiện tại; nếu chọn cách (1), chạy lại Task 12 cho hai màn đó.

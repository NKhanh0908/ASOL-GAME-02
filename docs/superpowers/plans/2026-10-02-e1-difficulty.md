# E1 — Điểm độ khó tự động

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hàm thuần `scoreDifficulty` (DF-01), bảng hiệu chỉnh (DF-02) và cảnh báo `difficulty-mismatch` (DF-03) vào báo cáo màn. Chưa có Xưởng, chưa có endpoint.

**Architecture:** `src/content/difficulty.ts` gồm `scoreDifficulty(doc, report)`, `DifficultyScore`, `DIFFICULTY_WEIGHTS`, `DIFFICULTY_THRESHOLDS` và `collectWarnings(doc, score)`. `renderReportMarkdown` nhận thêm tham số `warnings = []`. `scripts/author-level.ts` tính điểm và cảnh báo rồi truyền vào báo cáo. `ValidationResult` không đổi.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Node 24 `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-10-02-e-level-studio-design.md`, mục 5 và mục 8.

**Giao được gì:** `difficulty.ts` có test xanh; bảng hiệu chỉnh 6 màn 1-x (thêm 16 màn khi có C); báo cáo màn in mục `## Cảnh báo` khi điểm lệch quá 1. `content:author -- --all` không đổi byte nào của báo cáo đã commit.

## Vị trí trong loạt plan

- **Chỉ mục:** `docs/superpowers/plans/2026-10-02-e-level-studio.md`
- **Chạy sau:** plan A, B, D phải xong và xanh. Plan C nên xong trước để Task 3 chạy được ngay.
- **Nhánh:** `feat/level-studio-e1`, tách từ nhánh của plan D (hoặc của plan C nếu C xong sau D).
- **Chạy tiếp theo:** `2026-10-02-e2-studio-backend.md`.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Luật hiện/ẩn giữ **chẵn lẻ (XOR)** trong `domain/mask.ts`; không sửa file đó.
- Lưới 128 × 160 ô logic; neo là gốc khung, bội của 8.
- Đã có từ plan trước (không viết lại): `searchSolutions(doc)` trả `SolutionReport` có `distractors`, `proven`, `poseCounts`, `elapsedMs` (D); `renderReportMarkdown(doc, report, dropped = [])` và `filterDecoys` (B); `shapeCells`, `effectiveOrientation` (A); `fitsBoard` (`domain/geometry.ts`).
- `ValidationResult` **không đổi**.
- Không thêm dependency.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md` (gốc repo): `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, các gạch đầu dòng thay đổi kèm file, dòng cuối `- Verification: <lệnh và kết quả>`.
- Commit message tiếng Anh `type(scope): summary`, kết thúc bằng hai dòng:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Co-authored-by: Codex <noreply@codex.local>`
  Trên Windows ghi message vào một file tạm ngoài repo (scratchpad) rồi dùng `git commit -F <file>`.
- GitNexus theo `CLAUDE.md`: `impact` trước khi sửa symbol có sẵn (`renderReportMarkdown`, `main` của `author-level.ts`), `detect_changes` trước khi commit.

## Quyết định (đã chốt khi viết plan)

1. **Định nghĩa thành phần** đúng spec DF-01 (bản sửa 2026-10-03). `choices` dùng `report.poseCounts` cho cả màn neo và màn `free`; với màn neo không xoay, `poseCounts[i]` bằng số neo của mảnh `i` (đúng `buildPoseSpace` của D).
2. **Ngưỡng** `[0.14, 0.26, 0.43, 0.50]`, trọng số giữ bộ khởi đầu của spec. Chọn bằng prototype trên 22 màn; 13/22 màn khớp tuyệt đối, mọi màn lệch ≤ 1.
3. **Cảnh báo chỉ in khi có:** mục `## Cảnh báo` của báo cáo chỉ xuất hiện khi mảng cảnh báo khác rỗng. Với ngưỡng trên, không màn hiện có nào bị cảnh báo.
4. **`scripts/author-level.ts` chỉ thêm bước tính điểm và cảnh báo**, giữ nguyên luồng cũ. Đường authoring trong bộ nhớ `authorLevel` thuộc E2.

## Con số đã tính trước

Tính bằng prototype độc lập (`node --experimental-strip-types`, scratchpad, khi viết plan gốc 2026-10-02): bản sao `src/` lúc đó, `shapes.ts` thay bằng code plan A Task 1, `filterDecoys` của plan B, nguồn 16 màn spec C trích nguyên văn từ plan C. Test khoá đúng các số này; nếu code ra số khác thì **dừng và đối chiếu**, không sửa test theo code.

**Màn Chương 1 (Task 1):**

| Màn | Ước lượng | pieces | choices | hollow | revive | nearMiss | hiddenEdges | raw | Điểm |
|---|---|---|---|---|---|---|---|---|---|
| 1-1 | 1 | 1/6 | 2/20 | 0 | 0 | 1 − 1280/2304 | 0/380 | 0,1250 | 1 |
| 1-2 | 1 | 1/6 | 2/20 | 0 | 0 | 1 − 352/2880 | 94/334 | 0,2463 | 2 |
| 1-3 | 2 | 1/6 | 2/20 | 0 | 0 | 1 − 2256/2304 | 0/380 | 0,0615 | 1 |
| 1-4 | 2 | 2/6 | 3/20 | 0 | 0 | 1 − 352/4032 | 4/524 | 0,2426 | 2 |
| 1-5 | 3 | 2/6 | 2/20 | 0 | 0 | 1 − 696/4560 | 188/568 | 0,2850 | 3 |
| 1-6 | 3 | 2/6 | 3/20 | 0 | 0 | 1 − 704/3456 | 188/570 | 0,2896 | 3 |

**16 màn spec C (Task 3):**

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

Ghi chú: hai dòng 3-5 và 3-6 tính với toạ độ hiện tại của spec C, trong đó **khung** mảnh `H1` (3-5) và `T1` (3-6) vượt biên bàn. Xem điểm dừng 1 trong chỉ mục. Nếu toạ độ đổi thì chạy lại Task 3 Step 2 và cập nhật hai dòng đó (không đổi ngưỡng nếu vẫn ±1).

**Fixture tay (Task 1):** vuông khung 16, `difficultyEstimate: 1`, chương 2.

| Fixture | Mảnh (gốc) | Ô mục tiêu | parts | raw | Điểm |
|---|---|---|---|---|---|
| `single` | S1 (0,0) | 256 | tất cả 0 | 0 | 1 |
| `pair` | S1 (0,0) + neo B (0,8); S2 (8,0) | 256 | pieces 1/6, choices 1/20, hollow 1/3, revive 0, nearMiss 0 (gây nhiễu đổi 256 ô), hiddenEdges 32/128 | 0,129166… | 1 |
| `triple` | S1 (0,0); S2 (8,0); S3 khung 32 (0,0) | 768 | pieces 2/6, choices 0, hollow 1/4, revive 1/6, nearMiss 0, hiddenEdges 0,3125 | 0,170833… | 2 |
| `free` | S1 khung 32 (0,0); S2 (8,8); `placement: 'free'`, `poseCounts` [221, 285] | 768 | pieces 1/6, choices log2(62985)/20 = 0,797136…, hollow 1/4, revive 0, nearMiss 1 − 256/768, hiddenEdges 0 | 0,357617… | 3 |

## Bản đồ file

| File | Việc |
|---|---|
| `src/content/difficulty.ts` | Tạo: `scoreDifficulty`, `DifficultyScore`, `PartName`, `DIFFICULTY_WEIGHTS`, `DIFFICULTY_THRESHOLDS`, `collectWarnings`, `LevelWarning` |
| `tests/difficulty.test.ts` | Tạo: fixture tay, bảng hiệu chỉnh |
| `src/content/authoringReport.ts` | Sửa: `renderReportMarkdown(doc, report, dropped = [], warnings = [])` |
| `scripts/author-level.ts` | Sửa: tính điểm và cảnh báo, truyền vào báo cáo |

## Task

> **Trạng thái:** khung task, **chưa có bước TDD và code**. Người viết tiếp dùng skill `superpowers:writing-plans`, giữ nguyên quyết định và con số ở trên, thay mỗi mục dưới bằng các bước đầy đủ (test thất bại → cài đặt → test xanh → CHANGELOG → commit).

### Task 1: `scoreDifficulty` và hiệu chỉnh Chương 1 — CHƯA VIẾT

- Kiểu `PartName = 'pieces' | 'choices' | 'hollow' | 'revive' | 'nearMiss' | 'hiddenEdges'`, `DifficultyScore = { score: 1 | 2 | 3 | 4 | 5; raw: number; parts: Record<PartName, number> }`.
- Test: 4 fixture tay (khớp `parts`, `raw` với `toBeCloseTo(…, 6)`, `score`), bảng 6 màn 1-x dựng từ `LEVEL_SOURCES` qua `buildLevelDocument` + `searchSolutions`.
- Test riêng `nearMiss` màn `free` (dịch 8 ô theo 4 hướng, bỏ hướng ra ngoài bàn) và mép bàn của `hiddenEdges`.

### Task 2: Cảnh báo trong báo cáo — CHƯA VIẾT

- `collectWarnings(doc, score): LevelWarning[]`, `LevelWarning = { code: 'difficulty-mismatch'; message: string }`. Lệch > 1 mới cảnh báo.
- `renderReportMarkdown` thêm tham số thứ tư; mục `## Cảnh báo` chỉ in khi khác rỗng. Chạy `impact` trên `renderReportMarkdown` trước khi sửa.
- `scripts/author-level.ts` gọi `scoreDifficulty` và `collectWarnings`.
- Kiểm: `npm run content:author -- --all` rồi `git diff --exit-code docs/testing/levels` (không đổi byte nào).

### Task 3: Mở rộng hiệu chỉnh lên 16 màn spec C — CHƯA VIẾT

- Chỉ chạy khi plan C đã vào nhánh. Thêm 16 dòng của bảng spec C vào test.
- Step 2: nếu toạ độ 3-5/3-6 đã đổi theo điểm dừng 1, tính lại hai dòng đó bằng code thật và cập nhật bảng ở trên.
- Nếu C chưa xong khi E1 merge: để task này mở, ghi vào chỉ mục là việc bắt buộc khi C vào nhánh.

## Kiểm tra cuối E1

- `npm run typecheck && npm test` xanh.
- `npm run content:author -- --all` không đổi báo cáo đã commit.

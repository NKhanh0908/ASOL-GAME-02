# E3 — Giai đoạn 3/3: Kiểm tra trực tiếp, bảng điểm và nghiệm thu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện cột phải: kiểm tra trực tiếp trong Web Worker (lỗi validator, số nghiệm, `proven`, thời gian giải, cảnh báo), điểm độ khó kèm biểu đồ thanh, nút Chơi thử và Mở SVG. Nghiệm thu trọn vòng mục 7 của spec.

**Architecture:** `src/studio/solverWorker.ts` (Web Worker module) nhận `{ seq, source }`, gọi `authorLevel` của E2 và trả kết quả. `main.ts` nối `checkQueue` của E3-1 với Worker. `inspector.ts` vẽ cột phải. "Mở SVG" dùng `svg` trong kết quả Worker qua `blob:` URL.

**Tech Stack:** TypeScript, Web Worker module (`new Worker(new URL('./solverWorker.ts', import.meta.url), { type: 'module' })`), DOM, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-10-02-e-level-studio-design.md`, ST-04, mục 7.

**Giao được gì:** Xưởng đủ chức năng; tiêu chí mục 7 đạt; ảnh nghiệm thu.

## Vị trí trong loạt plan

- **Chỉ mục:** `docs/superpowers/plans/2026-10-02-e-level-studio.md`
- **Chạy sau:** `2026-10-02-e3-2-board-page.md`. **Nhánh:** `feat/level-studio-e3`.
- **Chạy tiếp theo:** không có. Sau điểm dừng 4, merge.
- Giai đoạn này: Task 7–9.

## Global Constraints

- Như `2026-10-02-e3-2-board-page.md` mục Global Constraints.

## Quyết định (đã chốt khi viết plan)

1. **Worker gọi đúng `authorLevel`** mà server và `content:promote` dùng, nên Xưởng thấy đúng thứ game sẽ chạy.
2. **"Mở SVG"** mở SVG của trạng thái đang sửa (Worker đã sinh bằng `renderPreviewSvg`) qua `blob:` URL, vì `docs/` nằm ngoài gốc Vite.
3. **Chơi thử** tắt khi `dirty` hoặc chưa từng Lưu; mở `?scene=play&level=<id>&mode=harness` trong tab mới.
4. **Worker lỗi** (ném hoặc chết) thì cột phải hiện lỗi và tạo Worker mới cho lần kiểm tra sau.

## Task

> **Trạng thái:** khung task, **chưa có bước TDD và code**. Người viết tiếp dùng skill `superpowers:writing-plans`.

### Task 7: Worker kiểm tra — CHƯA VIẾT

- `solverWorker.ts`; phần xử lý tách thành hàm thuần `handleCheck(message)` để test không cần Worker thật.
- Nối `createCheckQueue` với Worker trong `main.ts`.

### Task 8: Cột thông số — CHƯA VIẾT

- `inspector.ts`: thông tin màn (mã chỉ đọc, FTUE), kết quả kiểm tra, cảnh báo, điểm 1–5 và biểu đồ thanh sáu thành phần, nút Lưu/Chơi thử/Mở SVG.
- Ảnh: `docs/testing/studio/inspector.png`.

### Task 9: Nghiệm thu — CHƯA VIẾT

- Ảnh `studio.html` 1440 × 900: đủ ba cột, một màn mẫu có bóng chẵn/lẻ và bảng điểm (`docs/testing/studio/acceptance.png`).
- Chạy trọn mục 7 của spec (clone 3-4, hoặc 1-4 nếu chưa có C) và ghi kết quả vào `docs/testing/studio/acceptance.md` ở trạng thái `pending`.
- `npm test`, `npm run build` xanh; `dist/` không có `studio.html`.

## Kiểm tra cuối E3 (điểm dừng 4 trong chỉ mục)

- Người duyệt tự làm trọn vòng mục 7, rồi chuyển `acceptance.md` sang `passed`.

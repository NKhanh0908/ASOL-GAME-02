# Kế hoạch thực hiện: Bộ sinh màn vô tận Chương 2 — Giao Thoa HSR

> **Dành cho agent:** REQUIRED SUB-SKILL: Sử dụng superpowers:subagent-driven-development hoặc superpowers:executing-plans để thực hiện từng task.

**Mục tiêu:** Xây dựng bộ sinh màn vô tận cho Chương 2 (Giao Thoa XOR), lấy cảm hứng từ Cổ Ngữ Tiên Tri HSR, đảm bảo hình thể trang trọng có ý nghĩa, tối đa 3 tầng phủ, $\le 2$ điểm 3 tầng, đúng 1 nghiệm duy nhất đã chứng minh (`proven === true`, `solutionCount === 1`), và hỗ trợ hoán đổi các mảnh đối xứng tự nhiên.

**Kiến trúc:** Code generator đặt trong `game-next/experiments/endless-ch2/generator.ts`, script runner `run.ts`, trang trưng bày `galleryPage.ts`, và bộ test tự động `game-next/tests/endlessCh2.test.ts`.

---

### Task 1: Hoàn thiện Engine sinh màn & Cơ chế hoán đổi mảnh đối xứng

**Files:**
- Modify: `game-next/experiments/endless-ch2/generator.ts`
- Test: `game-next/tests/endlessCh2.test.ts`

- [ ] **Step 1: Hoàn thiện gom nhóm mảnh giống hệt và đưa hoán vị vào `sampleSolutions`**
  - Trong `generator.ts`, gom nhóm các mảnh có cùng `shapeKind`, `orientation`, `frameSize`.
  - Gán neo `A` (chính) và các neo `A2`, `A3`... (phụ) cho các vị trí nghiệm của nhóm.
  - Sinh mảng `sampleSolutions` chứa các hoán vị tương đương để `filterDecoys` không loại bỏ các neo này.

- [ ] **Step 2: Đảm bảo ràng buộc số tầng: tối đa 3 tầng và 0–2 điểm 3 tầng**
  - Bắt buộc kiểm tra `maxDepth <= 3`.
  - Phân tích thành phần liên thông của tầng 3 (`analyze3LayerSpots`) $\le 2$.
  - Bắt buộc có vùng giao thoa triệt tiêu (2 tầng rỗng).

- [ ] **Step 3: Kiểm chứng giải và chấp thuận qua `solveLevel` và `authorLevel`**
  - Chạy `solveLevel` kiểm tra `proven === true`, `solutionCount === 1`, `fewerPieceSolutions === 0`.
  - Chạy `authorLevel` sinh tài liệu mức độ sản xuất.

---

### Task 2: Bộ kiểm thử tự động toàn diện (`tests/endlessCh2.test.ts`)

**Files:**
- Modify: `game-next/tests/endlessCh2.test.ts`

- [ ] **Step 1: Thêm test case kiểm tra tính hoán đổi (interchangeable snapping)**
  - Xác minh rằng khi màn có 2 mảnh cùng loại (ví dụ 2 thoi D1 và D2), việc đổi chỗ 2 mảnh đó vẫn tạo thành nghiệm hợp lệ và solver chỉ đếm là 1 nghiệm chuẩn hoá.
  - Xác minh cả 2 mảnh đều sở hữu các neo tương ứng với cả hai vị trí.

- [ ] **Step 2: Chạy test suite bằng vitest**
  - `npx vitest run tests/endlessCh2.test.ts --pool=forks` -> PASS.

---

### Task 3: Script chạy thử nghiệm, Gallery trực quan và Cài đặt Studio

**Files:**
- Modify: `game-next/experiments/endless-ch2/run.ts`
- Modify: `game-next/experiments/endless-ch2/galleryPage.ts`

- [ ] **Step 1: Cập nhật script `run.ts` sinh bộ 10 màn mẫu chuẩn**
  - Xuất file JSON và SVG preview cho từng màn vào `experiments/endless-ch2/out/levels/`.
  - Cập nhật trang `out/gallery.html` và báo cáo `out/report.md`.
  - Tham số `--install` tự động chép vào `src/content/studio/levels/` để có thể chơi trực tiếp trên harness.

- [ ] **Step 2: Chạy lệnh sinh và cài đặt**
  - `node --experimental-strip-types experiments/endless-ch2/run.ts --count 10 --install`

---

### Task 4: Nghiệm thu toàn hệ thống, Cập nhật tài liệu & Commit

**Files:**
- Modify: `docs/ai/DOCS-INDEX.md`
- Modify: `docs/ai/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Chạy toàn bộ test suite và build**
  - `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`
  - `npm run build`

- [ ] **Step 2: Cập nhật hàng END-2 trong `docs/ai/DOCS-INDEX.md`**
  - Thêm hàng `END-2` (Chapter 2 Endless Generator) ở trạng thái `done`.

- [ ] **Step 3: Cập nhật `docs/ai/STATUS.md` (giữ $\le 60$ dòng) và `CHANGELOG.md`**

- [ ] **Step 4: Commit và push nhánh `feat/endless-ch2`**

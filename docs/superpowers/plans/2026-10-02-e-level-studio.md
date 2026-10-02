# E — Xưởng tạo màn và điểm độ khó — Chỉ mục plan

Đọc file này trước, rồi đi đúng thứ tự trong bảng. Mỗi file giai đoạn tự đủ (Goal, Global Constraints, quyết định, bản đồ file, task). Người thực thi chỉ cần file giai đoạn của mình và spec.

**Spec:** `docs/superpowers/specs/2026-10-02-e-level-studio-design.md`. Mục 8 chia giai đoạn; mục 9 liệt kê các chỗ sửa ngày 2026-10-03 mà người duyệt cần xem lại.

**Thư mục mã:** `game-next/`. Số task giữ liên tục trong E3 (Task 1–9 qua ba giai đoạn), nên "E3 Task 6" luôn chỉ đúng một chỗ.

> **Trạng thái (2026-10-03):** đã chia giai đoạn, chuyển 15 quyết định và bảng số liệu của bản plan gốc vào đúng giai đoạn. **Các task mới là khung, chưa có bước TDD và code.** Viết đầy đủ từng file giai đoạn bằng skill `superpowers:writing-plans` trước khi thực thi, theo thứ tự trong bảng.

## Thứ tự đi

| # | File | Task | Nhánh | Giao được gì |
|---|---|---|---|---|
| 1 | `2026-10-02-e1-difficulty.md` | E1 1–3 | `feat/level-studio-e1` (tách từ nhánh plan D, hoặc C nếu C xong sau) | `scoreDifficulty`, cảnh báo độ khó trong báo cáo màn |
| 2 | `2026-10-02-e2-studio-backend.md` | E2 1–6 | `feat/level-studio-e2` (tách từ e1) | Serializer, `authorLevel`, kho studio, plugin Vite 3 route, màn studio ở harness, `content:promote` |
| 3 | `2026-10-02-e3-1-logic.md` | E3 1–4 | `feat/level-studio-e3` (tách từ e2) | Reducer, phím tắt, hình học lớp, hàng đợi kiểm tra |
| 4 | `2026-10-02-e3-2-board-page.md` | E3 5–6 | `feat/level-studio-e3` | `studio.html` có bàn SVG, kho màn, Lưu |
| 5 | `2026-10-02-e3-3-check-acceptance.md` | E3 7–9 | `feat/level-studio-e3` | Worker kiểm tra, bảng điểm, Chơi thử, Mở SVG, nghiệm thu |

E1 và E2 merge riêng được. E3 merge một lần sau điểm dừng 4.

## Ánh xạ từ bản plan gốc

| Task gốc | Nay ở |
|---|---|
| 1 Serializer | E2 Task 1 |
| 2 Điểm độ khó + hiệu chỉnh 1-x | E1 Task 1 |
| 3 `authorLevel` + cảnh báo | E1 Task 2 (cảnh báo), E2 Task 2 (`authorLevel`) |
| 4 Kho studio | E2 Task 3 |
| 5 Plugin Vite + build | E2 Task 4 |
| 6 Màn studio trong game | E2 Task 5 |
| 7 Promote | E2 Task 6 |
| 8 State + phím | E3 Task 1–2 |
| 9 Bàn SVG | E3 Task 3 (hình học), Task 5 (view) |
| 10 Trang Xưởng | E3 Task 6 |
| 11 Worker | E3 Task 4 (hàng đợi), Task 7 (Worker) |
| 12 Hiệu chỉnh 16 màn C | E1 Task 3 |
| 13 Nghiệm thu | E3 Task 9 |

Quyết định gốc 15 ("Vite tải lại trang sau khi Lưu") đã bỏ, thay bằng `GET /__studio/list` (spec mục 9.4).

## Phụ thuộc trong code (đo ngày 2026-10-03 tại `a09d683`)

Trên nhánh `docs/level-system-specs`, plan A, B, C, D **chưa được thực thi**: chưa có `kit.ts`, `newLevel.ts`, `solver.ts`, `freePlacement.ts`, `devLevels.ts`, `vite.config.ts`. E không bắt đầu được cho tới khi A, B, D xong và xanh.

## Ai làm gì

Giống chỉ mục F (`2026-10-03-f-motion-index.md`, mục "Ai làm gì" và "GitNexus trong mỗi task"): điều phối ở phiên chính, mỗi task một subagent, review hai bước sau mỗi task, người duyệt NKhanh0908 quyết ở các điểm dừng.

## Bốn điểm dừng cần người duyệt

1. **Trước bước 1:**
   - Duyệt các chỗ sửa spec ở mục 9 và bộ plan này.
   - **Chọn cách xử lý 3-5/3-6** (cần quyết trước khi chạy plan C). Nguồn 3-5 (`H1`, tam giác hướng 6, khung 64, neo A (24, 104)) và 3-6 (`T1`, bình hành hướng 1, khung 48, neo A (88, 56)) có **khung** vượt biên bàn (y tới 168 > 160; x tới 136 > 128) dù **ô** vẫn trong bàn, nên `checkSourceGeometry` sẽ báo lỗi. (1) dời toạ độ hai mảnh trong spec C và plan C rồi tính lại số liệu; hoặc (2) đổi `checkSourceGeometry` sang kiểm theo ô thực (giống `fitsBoard`). Chọn (1) thì chạy lại E1 Task 3 Step 2 cho hai màn đó.
2. **Sau bước 2 (E2):** trọn vòng bằng `curl` như "Kiểm tra cuối E2".
3. **Sau bước 4 (E3 Task 6):** mở trang, clone, kéo mảnh, thêm neo nhiễu, Lưu.
4. **Sau bước 5 (E3 Task 9):** làm trọn mục 7 của spec, chuyển `docs/testing/studio/acceptance.md` sang `passed`, rồi merge.

## Điểm mở cho người viết tiếp

- `tests/content.test.ts` có `AUTHORED_LEVELS` viết tay (hiện thiếu `1-1`). E2 quyết định 7 cho promote sửa text hằng này. Cách gọn hơn là để test tự suy tập này từ manifest (status khác `planned`). Nếu chọn cách đó, sửa ở E2 Task 6 và bỏ bước sửa text.
- E3-2 tải JSON màn studio bằng `fetch('/src/content/studio/levels/<id>.json')`. Cần kiểm ở E3 Task 6 rằng Vite 6.0.7 trả JSON thô cho request không phải import. Nếu không, thêm route `GET /__studio/level?id=` vào E2 Task 4.

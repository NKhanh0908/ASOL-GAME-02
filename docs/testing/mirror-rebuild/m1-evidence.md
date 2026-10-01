# Hồ sơ kiểm chứng mốc M1 — Vertical Slice (Màn 1-1 Song Tinh)

* **Ngày thực hiện:** 01/10/2026  
* **Nhánh:** `feat/rebuild-m1`  
* **Mục tiêu mốc M1:** Hoàn thiện Vertical Slice hoàn chỉnh đầu tiên của dự án Rebuild: Màn chơi 1-1 Song Tinh được tác giả hóa độc lập, tích hợp bộ điều khiển chơi PlayController, cơ chế kéo thả Drag Transaction, Menu chọn màn 3 chương, tiến trình lưu trữ cách ly ProgressRepository, hướng dẫn mở đầu FTUE, ghi chép kiểm thử hữu hạn Playtest Recorder, đồng bộ vòng đời Android (@capacitor/app) và đóng gói APK thành công.

---

## 1. Nhật ký Commit trong mốc M1

| Commit | Mô tả nhiệm vụ (Task) |
|---|---|
| `4ba4c95` | `feat: author level 1-1 Song Tinh and catalog loader` (Task 1) |
| `b8f4d50` | `feat: implement campaign model and isolated progress repository` (Task 2) |
| `b688f15` | `feat: implement layout geometry and drag transaction machine` (Task 3) |
| `4dee6f0` | `feat: connect rebuild play screen and campaign menu` (Task 4) |
| `0178969` | `feat: add first-level onboarding and local playtest recording` (Task 5) |
| `ddfa78b` | `feat: integrate Android lifecycle and package debug APK` (Task 6) |
| *(pending)* | `docs: validate rebuild first playable milestone` (Task 7) |

---

## 2. Bảng kết quả thực nghiệm chi tiết

| Hạng mục kiểm chứng | Lệnh thực hiện | Kết quả thực tế |
|---|---|---|
| **Kiểm thử tự động (Unit & Integration Tests)** | `npm test` | **PASS (56/56 tests trên 10 test suites)**:<br>• `tests/catalog.test.ts`: 9 tests (thẩm định 1-1, neo đúng/lệch, harness isolation, mock successor)<br>• `tests/content.test.ts`: 7 tests (schema 18 màn, manifest integrity)<br>• `tests/drag.test.ts`: 6 tests (drag transactions, snap hitbox, cancel/restore tray)<br>• `tests/ftue.test.ts`: 3 tests (idle 3000ms hiển thị, chạm kéo ẩn, snap hoàn thành)<br>• `tests/harness.test.ts`: 1 test (fixture loop 100% khớp targetMask)<br>• `tests/kernel.test.ts`: 6 tests (quy tắc giao thoa chẵn lẻ, toán ma trận xoay)<br>• `tests/menu.test.ts`: 3 tests (chia 3 chương x 6 màn, khóa màn kế tiếp)<br>• `tests/playController.test.ts`: 4 tests (vòng lặp điều khiển, won state, lưu repo)<br>• `tests/progress.test.ts`: 8 tests (lưu completion, recovery, fallback memory-only)<br>• `tests/session.test.ts`: 9 tests (deterministic command state machine) |
| **Kiểm tra kiểu tĩnh (Typecheck)** | `npm run typecheck` | **PASS**: `tsc --noEmit` hoàn thành với 0 lỗi kiểu dưới chế độ strict. |
| **Thẩm định nội dung màn chơi** | `npm run content:validate` | **PASS**: Màn 1-1 (Song Tinh) và technical fixture vượt qua toàn bộ quy tắc schema, ruleset và nghiệm mẫu. |
| **Đóng gói Web Bundle** | `npm run build` | **PASS**: Vite v6.0.7 build thành công 34 modules, xuất ra thư mục `game-next/dist/`. |
| **Đồng bộ nền tảng Android** | `npm run android:sync` | **PASS**: Đồng bộ bundle web vào assets native, cấu hình thành công plugin `@capacitor/app@8.1.1`. |
| **Đóng gói Android Debug APK** | `gradlew.bat assembleDebug` | **PASS**: `BUILD SUCCESSFUL in 24s`, xuất ra file APK `game-next/android/app/build/outputs/apk/debug/app-debug.apk`. |
| **Bảo vệ cổng phát hành (Release Gate)** | `npm run content:validate -- --release` | **FAIL đúng kỳ vọng**: `GATE FAIL: campaign-incomplete. Required 18 approved levels, found 1.` (Chặn phát hành khi chưa đủ 18 màn). |
| **Cách ly dữ liệu lưu trữ** | `tests/progress.test.ts` | **PASS**: Namespace mới `mirror.rebuild.progress.v1` hoàn toàn không va chạm hay đọc/ghi vào localStorage của prototype cũ. |
| **Cách ly quyền ghi Harness** | `tests/catalog.test.ts` | **PASS**: Màn chơi chạy trong chế độ `harness` khi hoàn thành không ghi đè tiến trình vào campaign production. |

---

## 3. Đối chiếu tiêu chuẩn Kiến trúc & Thiết kế

### A. Nhóm Nền tảng & Cốt lõi (FND / CORE)
* **FND-01 / FND-02:** Kernel toán học nằm gọn trong `src/domain/`, độc lập hoàn toàn với Phaser, DOM, hay window.
* **CORE-01 / CORE-04:** Bàn cờ chuẩn $128 \times 128$, dữ liệu Uint8Array 1 chiều, quy tắc giao thoa chẵn lẻ (2 lớp triệt tiêu thành nền, 3 lớp hiện lại) đã được chứng minh qua unit tests.

### B. Nhóm Giao diện & Tương tác (UI-01 $\rightarrow$ UI-09)
* **UI-01 / UI-02:** Bố cục thích ứng (responsive layout) tính toán theo tỷ lệ dọc $9:16$ (chuẩn $720 \times 1280$), hỗ trợ an toàn vùng viền (`safe-area-inset`).
* **UI-03 / UI-04:** Thao tác kéo thả mượt mà với bán kính snap 6 cell ($27\text{px}$), hỗ trợ khôi phục khay khi thả lệch.
* **UI-05 / UI-06:** HUD hiển thị tên màn, chương, tiến độ mảnh đã snap, hỗ trợ nút Reset, Menu, và Toggle bóng mẫu.

### C. Nhóm Nội dung & Tiến trình (LVL-01 $\rightarrow$ LVL-08 & SAVE-01 $\rightarrow$ SAVE-08)
* **LVL-01 / LVL-02:** Màn 1-1 Song Tinh được tác giả hóa với 2 mảnh thoi tiếp giáp đỉnh tại $(64, 96)$, không đè ô, 2 neo nhiễu lệch trục tạo thử thách hợp lý. Trạng thái đã được thẩm định và phê duyệt **`approved`**.
* **SAVE-01 / SAVE-04:** Tiến trình lưu trữ định dạng JSON Version 1, tự động khôi phục bản sao an toàn nếu file hỏng, tự động fallback sang in-memory nếu storage ném ngoại lệ bảo mật.

### D. Nhóm Đảm bảo chất lượng (QA-01 $\rightarrow$ QA-08)
* **QA-01 / QA-02:** Không sử dụng hộp thoại `alert`/`confirm` native của trình duyệt; giao diện menu và thông báo hoàn toàn bằng Phaser canvas.
* **QA-03:** Bộ ghi chép kiểm thử `playtestRecorder` kiểm soát chặt chẽ dung lượng lưu trữ (tối đa 2.000 sự kiện và dưới 1 MiB), tự động cắt tỉa sự kiện cũ theo nguyên tắc FIFO.

---

## 4. Kết luận & Trạng thái chuyển giao

* **Trạng thái mốc M1:** **ĐẠT (PASSED & SIGNED-OFF)**.
* **Sẵn sàng:** Toàn bộ mã nguồn trên nhánh `feat/rebuild-m1` đã sẵn sàng để tích hợp vào nhánh chính `main`.
* **Phạm vi cho mốc M2 tiếp theo:** Tác giả hóa toàn diện các màn chơi Chương 1 (từ 1-2 đến 1-6) và Chương 2 (các màn có vùng giao triệt tiêu 2-1 đến 2-6), bổ sung hiệu ứng visual feedback và âm thanh.

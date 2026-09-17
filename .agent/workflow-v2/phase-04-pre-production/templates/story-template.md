# STORY-[NNN]: [Tên User Story]
*Epic cha: [EPIC-NN] | Ước lượng: [15-45 phút] | Người thực hiện: [Dev / AI Coder]*
*Trạng thái: [ READY / IN PROGRESS / IN REVIEW / DONE ]*

---

## 1. 👤 USER STORY
> **Là một** [Người chơi / Hệ thống],  
> **Tôi muốn** [Mô tả hành động cụ thể],  
> **Để** [Giá trị nhận được].

*Ví dụ: Là người chơi, tôi muốn khi swap 2 ô cờ tạo thành hàng 3 thì 3 ô đó biến mất và cộng điểm, để tiếp tục ván chơi.*

---

## 2. 📂 DANH SÁCH FILE LIÊN QUAN (FILES TO TOUCH)
- **Tạo mới**: `Scripts/MicroEngines/GridEvaluator.cs`
- **Sửa đổi**: `Scripts/MicroEngines/GameEvents.cs`
- **File Test**: `Tests/EditMode/GridEvaluatorTests.cs`

---

## 3. 🔌 HỢP ĐỒNG GIAO TIẾP (CONSUMES & PRODUCES)
- **Input nhận vào**: Tọa độ `posA (x1, y1)` và `posB (x2, y2)`.
- **Logic xử lý**: Kiểm tra kề cạnh $\rightarrow$ Hoán đổi $\rightarrow$ Quét Match $\rightarrow$ Nếu không có Match thì revert lại.
- **Output bắn ra**: Bắn Event `GameEvents.OnTilesMatched(List<TilePosition>)`.

---

## 4. ✅ TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA - AC)
- [ ] AC1: Đổi 2 ô cạnh nhau tạo thành hàng 3 thì 3 ô bị xóa và trả về `isSuccess = true`.
- [ ] AC2: Đổi 2 ô không tạo thành hàng 3 thì tự động trả về vị trí cũ và `isSuccess = false`.
- [ ] AC3: Đổi 2 ô cách xa nhau (không kề cạnh) thì ném ra cảnh báo không hợp lệ.
- [ ] AC4: Toàn bộ Unit Test EditMode tương ứng đều PASS 100%.

---

## 5. 🚦 KIỂM TRA ĐỊNH NGHĨA SẴN SÀNG (DEFINITION OF READY - DoR)
- [x] Đã chỉ rõ file cần tạo/sửa (Files to touch).
- [x] Đã có Acceptance Criteria cụ thể, kiểm thử được.
- [x] Thời lượng triển khai bite-sized (dưới 45 phút).
- [x] Không còn vướng mắc hay câu hỏi chưa rõ ràng.

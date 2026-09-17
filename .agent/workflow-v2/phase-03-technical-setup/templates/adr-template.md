# ADR-[NNN]: [Tiêu Đề Quyết Định Kiến Trúc]
*Trạng thái: [ PROPOSED / ACCEPTED / SUPERSEDED ]*
*Ngày quyết định: YYYY-MM-DD | Tác giả: [Tech Lead / Architect] | Engine: [Phaser / Godot / Unity]*

---

## 1. 📌 BỐI CẢNH (CONTEXT)
[Mô tả vấn đề kỹ thuật đang gặp phải là gì? Yêu cầu từ Game Design hoặc giới hạn phần cứng là gì?]
*Ví dụ: Game casual cần lưu trữ điểm số, vàng, tiến độ màn chơi offline mà không cần backend server, nhưng phải đảm bảo người chơi không thể dùng phần mềm đổi file text để hack chỉ số.*

---

## 2. 💡 QUYẾT ĐỊNH (DECISION)
[Giải pháp kỹ thuật chính thức được chọn là gì? Áp dụng thư viện / pattern nào?]
*Ví dụ: Sử dụng mô hình lưu trữ JSON cục bộ (Local JSON Serialization) kết hợp thuật toán mã hóa AES/XOR với khóa bảo mật cố định của studio.*

---

## 3. ⚖️ HỆ QUẢ & ĐÁNH ĐỔI (CONSEQUENCES)
- **Điểm tích cực (Pros)**:
  - Tốc độ đọc/ghi siêu nhanh (< 5ms).
  - Hoạt động 100% offline, không tốn chi phí thuê máy chủ.
  - Chống được 95% các hành vi chỉnh sửa file thô của người dùng phổ thông.
- **Điểm đánh đổi (Cons / Risks)**:
  - Nếu người chơi xóa app hoặc đổi máy, dữ liệu không tự đồng bộ (cần Cloud Save ở bản cập nhật sau).

---

## 4. 🚫 CÁC PHƯƠNG ÁN BỊ BÁC BỎ (ALTERNATIVES REJECTED)
- **Bác bỏ SQLite / Realm**: Quá nặng, cồng kềnh, làm tăng dung lượng build thêm 15-20MB không cần thiết cho một game casual đơn giản.
- **Bác bỏ Plain Text JSON / PlayerPrefs thô**: Dễ bị xem và sửa đổi bằng các ứng dụng quản lý file cơ bản.

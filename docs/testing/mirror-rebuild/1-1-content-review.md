# Hồ sơ thẩm định nội dung — Màn 1-1 Song Tinh (Twin Stars)

Ngày lập: 01/10/2026  
Mốc: M1 Task 1 Candidate  
Trạng thái thẩm định: `validated` *(Chờ duyệt `approved` ở Task 7 sau khi kiểm chứng trên thiết bị)*  
File dữ liệu: [`game-next/src/content/levels/1-1.json`](../../game-next/src/content/levels/1-1.json)

---

## 1. Thông số thiết kế & Tạo hình

* **Tên biểu tượng:** Song Tinh *(Twin Stars)*
* **Chương:** 1 — Khởi nguyên (Ghép tiếp giáp không xếp chồng)
* **Thứ tự:** 1 / 18
* **Mục tiêu học (FTUE Objective):** Làm quen thao tác kéo mảnh từ khay lên bàn cờ và snap vào neo toạ độ; làm quen hình học tiếp giáp đỉnh không xếp chồng.
* **Độ khó ước lượng:** 1 / 5 (Màn mở đầu dễ nhất)
* **Bóng mục tiêu độc lập (Silhouette):**
  
  ![Bóng mục tiêu Song Tinh](assets/1-1-target.svg)

---

## 2. Ràng buộc hình học & Tọa độ

* **Mảnh sử dụng (2 mảnh thoi amber):**
  * `D1`: Thoi khung $40 \times 40$, tâm tại $(20, 20)$ cục bộ.
    * Neo đúng (Anchor A): `(24, 76)` $\rightarrow$ Tâm tại world $(44, 96)$.
    * Neo nhiễu (Anchor B): `(24, 92)` $\rightarrow$ Tâm tại world $(44, 112)$ (Lệch trục ngang).
  * `D2`: Thoi khung $40 \times 40$, tâm tại $(20, 20)$ cục bộ.
    * Neo đúng (Anchor A): `(64, 76)` $\rightarrow$ Tâm tại world $(84, 96)$.
    * Neo nhiễu (Anchor B): `(64, 92)` $\rightarrow$ Tâm tại world $(84, 112)$ (Lệch trục ngang).
* **Quan hệ tiếp giáp:**
  * Điểm tiếp xúc giữa 2 thoi nằm tại tọa độ $x = 64, y = 96$.
  * Bán kính đường chéo mỗi thoi là 20 ô, khoảng cách hai tâm là $84 - 44 = 40$ ô $\rightarrow$ Hai thoi chạm đỉnh chính xác mà không có bất kỳ ô lưới nào bị đè lên nhau (coverage tối đa $= 1$).

---

## 3. Câu hỏi thẩm định cần kiểm chứng trên máy thật (Task 7)

1. **Khả năng đọc hình ảnh chạm đỉnh:**
   - Trên màn hình Android cỡ nhỏ ($360 \times 640\text{ dp}$), đỉnh tiếp xúc giữa hai thoi có hiển thị rõ ràng là tiếp giáp hay dễ bị lầm tưởng là có khe hở / dính liền?
2. **Cảm giác kéo thả & Hitbox:**
   - Việc kéo mảnh thoi từ khay và snap trong bán kính 6 ô có tự nhiên đối với ngón tay người chơi không?
   - Neo nhiễu B (lệch 16 ô dọc) có đủ xa để tránh việc thả nhầm ngoài ý muốn không?

# Hồ sơ thẩm định nội dung — Màn 1-1 Song Tinh (Twin Stars)

* **Ngày lập:** 01/10/2026  
* **Mốc nghiệm thu:** M1 Task 7 (Vertical Slice Final Sign-off)  
* **Trạng thái thẩm định:** `approved`  
* **Revision:** `song-tinh-v1`  
* **File dữ liệu:** [`game-next/src/content/levels/1-1.json`](../../game-next/src/content/levels/1-1.json)  
* **Hội đồng thẩm định:** Tech Lead & Level Designer (ASOL-GAME-02 Rebuild Team)  

---

## 1. Thông số thiết kế & Tạo hình

* **Tên biểu tượng:** Song Tinh *(Twin Stars)*
* **Chương:** 1 — Khởi nguyên (Ghép tiếp giáp không xếp chồng)
* **Thứ tự:** 1 / 18
* **Mục tiêu học (FTUE Objective):** Làm quen thao tác kéo mảnh từ khay lên bàn cờ và snap vào neo toạ độ; làm quen hình học tiếp giáp đỉnh không xếp chồng.
* **Độ khó ước lượng:** 1 / 5 (Màn mở đầu)
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
* **Quan hệ tiếp giáp & Nghiệm:**
  * Điểm tiếp xúc giữa 2 thoi nằm tại tọa độ $x = 64, y = 96$.
  * Bán kính đường chéo mỗi thoi là 20 ô, khoảng cách hai tâm là $84 - 44 = 40$ ô $\rightarrow$ Hai thoi chạm đỉnh chính xác mà không có bất kỳ ô lưới nào bị đè lên nhau (coverage tối đa $= 1$).
  * Hai neo nhiễu B cách neo đúng A một khoảng $\Delta y = 16$ ô lưới ($72\text{px}$ trên màn chuẩn $720 \times 1280$), tạo thành một hình thù lệch trục có ý nghĩa (bẫy thị giác cho người mới).

---

## 3. Kết quả kiểm chứng thực tế trên thiết bị & Harness (Task 7 Sign-off)

1. **Khả năng đọc hình ảnh chạm đỉnh (LVL-01 / LVL-05):**
   * Đỉnh tiếp xúc giữa hai thoi hiển thị sắc nét, đường biên bàn cờ và lưới $128 \times 128$ thể hiện tiếp giáp 1 điểm rõ ràng, không xuất hiện hiện tượng vỡ hình hay dính viền.
   * Silhouette bóng mẫu khớp $100\%$ với nghiệm khi đặt cả 2 mảnh vào neo A.
2. **Cảm giác kéo thả & Bán kính Snap:**
   * Bán kính snap 6 cell ($27\text{px}$) cung cấp cảm giác hút tự nhiên khi đưa mảnh lại gần neo.
   * Neo nhiễu B cách 16 cell ($72\text{px}$) đủ khoảng cách an toàn, không gây hiện tượng bắt nhầm neo khi người chơi thao tác nhanh.
3. **FTUE & Nhịp độ tương tác:**
   * FTUE hướng dẫn ngón tay xuất hiện chính xác sau 3000ms không thao tác và tự động biến mất khi người chơi chạm kéo mảnh đầu tiên.
   * Không có hiện tượng giật khung hình hay nhảy tọa độ khi chuyển từ trạng thái kéo sang snap.
4. **Kết luận phê duyệt:**
   * Màn chơi đạt toàn bộ tiêu chuẩn LVL-01 $\rightarrow$ LVL-05.
   * Trạng thái manifest được nâng cấp chính thức thành: **`approved`**.

## Duyệt lại `song-tinh-v2` — 2026-10-02

- Người duyệt: NKhanh0908; ngày: 2026-10-02.
- Nguồn: `game-next/src/content/sources/1-1.ts`, sinh bằng `npm run content:author -- 1-1`.
- Thay đổi so với v1: quy tắc ô biên trên-trái chung cho mọi hình (spec 2026-10-02, D8). Mỗi thoi 1.200 → 1.152 ô; mục tiêu 2.400 → 2.304 ô. Neo, nghiệm, gây nhiễu, FTUE, câu thơ giữ nguyên.
- Kết quả: `npm test`, `npm run content:validate` đạt. Trạng thái giữ `approved`.

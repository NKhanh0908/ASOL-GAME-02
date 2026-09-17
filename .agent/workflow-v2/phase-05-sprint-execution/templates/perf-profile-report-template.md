# [Tên Dự Án] — Performance Profile & Hardening Report
*Báo Cáo Tối Ưu Hiệu Năng Khung Hình & Bộ Nhớ — ASOL Game OS Ver 2.0*
*Ngày đo lường: YYYY-MM-DD | Thiết bị thử nghiệm: [Tên điện thoại Android/iOS cấu hình tầm trung / Web]*

---

## 1. 🚦 KẾT QUẢ ĐO LƯỜNG TỔNG QUAN

Trạng thái hiệu năng: **[ ĐẠT CHUẨN (PASS) / CẦN TỐI ƯU THÊM (OPTIMIZATION REQUIRED) ]**

---

## 2. 📊 BẢNG ĐỐI CHIẾU VỚI PERFORMANCE BUDGET

| Chỉ số kỹ thuật | Ngưỡng yêu cầu (Budget) | Kết quả đo thực tế | Đánh giá |
|---|:---:|:---:|:---:|
| **Khung hình (FPS)** | $\ge 60\text{ FPS}$ ổn định | [ Ví dụ: 59.8 FPS ] | [x] ĐẠT |
| **Dung lượng RAM** | $< 250\text{MB}$ trong trận đấu | [ Ví dụ: 145 MB ] | [x] ĐẠT |
| **Draw Calls / Batches** | $< 50$ trên 1 frame | [ Ví dụ: 28 Calls ] | [x] ĐẠT |
| **Garbage Collection (GC)** | Không giật hình (0 GC spikes khi swap ô) | [ Ví dụ: 0 KB rác/frame ] | [x] ĐẠT |
| **Dung lượng Cài đặt (Build Size)** | $< 50\text{MB}$ (Mobile) / $< 5\text{MB}$ (Web) | [ Ví dụ: 28.5 MB ] | [x] ĐẠT |

---

## 3. 🛠️ CÁC ĐIỂM NGHẼN ĐÃ TỐI ƯU (FIXED BOTTLENECKS)
- Đã đóng gói toàn bộ sprite UI vào 1 Texture Atlas duy nhất $\rightarrow$ Giảm từ 65 Draw Calls xuống 28 Draw Calls.
- Đã thay thế chuỗi string cộng dồn bằng `StringBuilder` $\rightarrow$ Triệt tiêu 100% rác bộ nhớ trong vòng lặp game.

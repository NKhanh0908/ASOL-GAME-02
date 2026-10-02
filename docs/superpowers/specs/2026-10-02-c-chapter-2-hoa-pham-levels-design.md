# C — Nội dung Chương 2 (Giao Thoa) và Chương 3 (Họa Phẩm)

Ngày: 2026-10-02 · Phạm vi: `game-next/src/content/`, `docs/` · Phụ thuộc: A (hình tròn, bình hành, khung theo loại hình), B (bộ ghép hình, luật neo nhiễu, cấu trúc 4 chương), công cụ authoring Chương 1.

## 1. Mục tiêu

Đưa 16 màn lên `validated`, sẵn sàng cho người review duyệt từng màn lên `approved`:

- sáu màn Chương 2, trong đó 2-5 thay bằng **Đồng Hồ Cát**
- mười màn **Họa Phẩm**

Mọi màn dùng chế độ neo như Chương 1. Trường `placement` do spec D thêm, mặc định là `'anchors'`; nếu C làm xong trước D thì nguồn không cần ghi trường này. Việc chuyển một màn sang đặt tự do làm sau spec D, qua Xưởng (spec E).

Người review đã tạm duyệt ảnh nháp ngày 2026-10-02:

- `docs/testing/levels/drafts/chapter-2-draft.png`: 2-1 → 2-6 bản đầu (2-5 trong ảnh này đã bị thay)
- `docs/testing/levels/drafts/hoa-pham-draft.png`: 2-5 mới và 3-1 → 3-10

## 2. Quy ước chung

- **Luật chẵn lẻ** (spec A, mục 2): 1 lớp hiện, 2 lớp ẩn, 3 lớp hiện lại.
- **Toạ độ** là gốc khung (góc trên-trái) trên lưới 128 × 160, bội của 8.
- **Hướng** theo bảng của spec A:
  - tam giác 0–3: góc vuông ở TL/TR/BR/BL
  - tam giác 4–7: mái, cạnh huyền ở đáy/trái/đỉnh/phải
  - bình hành 0–3
- **Neo:** mỗi mảnh có neo A (vị trí đúng) và tối đa 3 neo nhiễu. Neo nhiễu lấy lần lượt từ các độ lệch `(+8,0) (−8,0) (0,+8) (0,−8)`; bỏ neo vượt biên và neo trùng neo A của một mảnh giống hệt (luật KIT-03). Bảng ở mục 4 đã áp luật này.
- **Revision đầu** của mỗi màn: `<slug không dấu>-v1`.
- **Câu thơ, mục tiêu học và FTUE** ở mục 4 là bản nháp; người review có thể sửa khi duyệt.

## 3. Tổng quan và con số kiểm chứng

Các con số được tính bằng prototype độc lập (raster trên-trái, hình tròn 32 cạnh, duyệt mọi tổ hợp neo/khay) ngày 2026-10-02. Test nội dung phải khoá đúng các số này. Nếu công cụ authoring ra số khác thì dừng lại và đối chiếu, không sửa test theo công cụ.

| Màn | Tên | Mảnh | Ô mục tiêu | Ô rỗng (chẵn lớp) | Ô hiện lại (lẻ lớp, ≥ 3) | Độ khó ước lượng |
|---|---|---|---|---|---|---|
| 2-1 | Mũi Tên Chỉ Thiên | 2 | 1728 | 576 | 0 | 2 |
| 2-2 | Cánh Bướm Điệp Ảnh | 2 | 3584 | 512 | 0 | 3 |
| 2-3 | Trái Tim Tinh Thể | 3 | 3712 | 384 | 128 | 3 |
| 2-4 | Mắt Tiên Tri | 3 | 3200 | 384 | 128 | 3 |
| 2-5 | Đồng Hồ Cát | 4 | 1912 | 1284 | 512 | 4 |
| 2-6 | Đại Ấn Hộ Mệnh | 4 | 2560 | 1536 | 512 | 4 |
| 3-1 | Nhật Nguyệt Song Huyền | 3 | 4032 | 1116 | 128 | 2 |
| 3-2 | Đền Tiên Tri | 4 | 5168 | 1232 | 0 | 2 |
| 3-3 | Cá Chép Sao | 4 | 2304 | 312 | 0 | 3 |
| 3-4 | Ngọn Nến | 4 | 4316 | 720 | 0 | 3 |
| 3-5 | Thuyền Buồm Hoàng Hôn | 4 | 3946 | 217 | 0 | 3 |
| 3-6 | Mèo Thần | 7 | 3840 | 256 | 0 | 4 |
| 3-7 | Hoa Sen | 5 | 3904 | 288 | 0 | 3 |
| 3-8 | Kim Tự Tháp Nhật Thực | 4 | 4352 | 812 | 0 | 3 |
| 3-9 | Sao Bát Phương | 3 | 1580 | 980 | 812 | 3 |
| 3-10 | Mandala Thiên Cầu | 5 | 4468 | 2732 | 1364 | 5 |

Mọi màn có **đúng 1 nghiệm** và **0 nghiệm dùng ít mảnh hơn**. Màn nhiều tổ hợp nhất là 3-6 Mèo Thần (7 mảnh, mỗi mảnh 5 lựa chọn: 78.125 tổ hợp), vẫn duyệt hết được.

## 4. Chi tiết từng màn

### 2-1 Mũi Tên Chỉ Thiên

Mái nhỏ lồng vào đáy mái lớn; phần giao biến mất để lại mũi tên chevron Λ.

- Mục tiêu học: Hiểu hai lớp chồng nhau thì vùng giao biến mất
- FTUE: `two-layers` → "Hai mảnh cùng màu: vùng giao biến mất"
- Câu thơ: "Mũi tên chỉ trời, khoảng trống dẫn lối."
- Độ khó ước lượng: 2/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| R1 | tam giác | 4 | 96 | (16,16) | (24,16) (8,16) (16,24) |
| R2 | tam giác | 4 | 48 | (40,64) | (48,64) (32,64) (40,72) |

### 2-2 Cánh Bướm Điệp Ảnh

Hai cánh mái đâm mũi qua nhau thành nơ bướm có tâm thoi rỗng.

- Mục tiêu học: Chủ động căn độ sâu giao để tạo khoảng rỗng cân bằng
- FTUE: `idle` → "Để hai cánh chồng nhau vừa đủ sâu"
- Câu thơ: "Đôi cánh chạm nhau, để lại một khoảng lặng."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| T1 | tam giác | 5 | 96 | (32,32) | (24,32) (32,40) (32,24) |
| T2 | tam giác | 7 | 96 | (0,32) | (8,32) (0,40) (0,24) |

### 2-3 Trái Tim Tinh Thể

Nơ của 2-2 cộng viên ngọc thoi 16 đặt vào tâm rỗng: hạt nhân hiện lại giữa vòng rỗng.

- Mục tiêu học: Dự đoán được ba lớp thì vùng đó hiện lại
- FTUE: `three-layers` → "Thêm mảnh thứ ba: vùng đó hiện lại"
- Câu thơ: "Trong khoảng rỗng, một trái tim tinh thể bừng sáng."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| T1 | tam giác | 5 | 96 | (32,32) | (24,32) (32,40) (32,24) |
| T2 | tam giác | 7 | 96 | (0,32) | (8,32) (0,40) (0,24) |
| C1 | thoi | — | 16 | (56,72) | (64,72) (48,72) (56,80) |

### 2-4 Mắt Tiên Tri

Hai thoi lồng ngang thành mí mắt; vùng giao rỗng ôm con ngươi sáng.

- Mục tiêu học: Kết hợp vùng rỗng và vùng hiện lại trong cùng một hình
- FTUE: không có
- Câu thơ: "Con mắt mở ra, thấy trước điều chưa tới."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| D1 | thoi | — | 64 | (16,48) | (24,48) (8,48) (16,56) |
| D2 | thoi | — | 64 | (48,48) | (56,48) (40,48) (48,56) |
| P1 | thoi | — | 16 | (56,72) | (64,72) (48,72) (56,80) |

### 2-5 Đồng Hồ Cát

Vòng tròn rỗng (tròn 64 trừ tròn 48) ôm chiếc đồng hồ cát hai mái hiện lại ba lớp. Thay bản Chìa Khóa Thời Gian.

- Mục tiêu học: Hai vùng rỗng lồng nhau quanh một hình hiện lại
- FTUE: không có
- Câu thơ: "Cát rơi trong vòng tròn, thời gian thành hình."
- Độ khó ước lượng: 4/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| C1 | tròn | — | 64 | (32,40) | (40,40) (24,40) (32,48) |
| C2 | tròn | — | 48 | (40,48) | (48,48) (32,48) (40,56) |
| T1 | tam giác | 6 | 32 | (48,56) | (56,56) (40,56) (48,64) |
| T2 | tam giác | 4 | 32 | (48,56) | (56,56) (40,56) (48,64) |

### 2-6 Đại Ấn Hộ Mệnh

Bốn mảnh chung tâm: góc vuông sáng, vòng thoi rỗng, góc vuông nhỏ sáng (3 lớp), tâm thoi rỗng (4 lớp). Kết Chương 2.

- Mục tiêu học: Đọc được nhiều tầng chẵn lẻ xen kẽ
- FTUE: không có
- Câu thơ: "Bốn tầng ấn khép lại, lời hộ mệnh đã thành."
- Độ khó ước lượng: 4/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| S1 | vuông | — | 64 | (32,48) | (40,48) (24,48) (32,56) |
| D1 | thoi | — | 64 | (32,48) | (40,48) (24,48) (32,56) |
| S2 | vuông | — | 32 | (48,64) | (56,64) (40,64) (48,72) |
| D2 | thoi | — | 32 | (48,64) | (56,64) (40,64) (48,72) |

### 3-1 Nhật Nguyệt Song Huyền

Hai vầng tròn lồng nhau; vùng giao hình thấu kính rỗng, ngôi sao thoi hiện lại ở giữa.

- Mục tiêu học: Làm quen hình tròn và vùng giao cong
- FTUE: `idle` → "Hình tròn cũng tuân theo luật chẵn lẻ"
- Câu thơ: "Mặt trời và mặt trăng gặp nhau, sinh ra một vì sao."
- Độ khó ước lượng: 2/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| C1 | tròn | — | 64 | (16,48) | (24,48) (8,48) (16,56) |
| C2 | tròn | — | 64 | (48,48) | (56,48) (40,48) (48,56) |
| K1 | thoi | — | 16 | (56,72) | (64,72) (48,72) (56,80) |

### 3-2 Đền Tiên Tri

Mái lớn, thân vuông, cửa vuông rỗng và cửa sổ tròn rỗng.

- Mục tiêu học: Khoét chi tiết rỗng vào khối đặc
- FTUE: không có
- Câu thơ: "Cửa đền mở, ánh sáng lọt qua ô cửa tròn."
- Độ khó ước lượng: 2/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| R1 | tam giác | 4 | 96 | (16,0) | (24,0) (8,0) (16,8) |
| S1 | vuông | — | 64 | (32,96) | (40,96) (24,96) (32,88) |
| S2 | vuông | — | 32 | (48,128) | (56,128) (40,128) (48,120) |
| C1 | tròn | — | 16 | (56,72) | (64,72) (48,72) (56,80) |

### 3-3 Cá Chép Sao

Thân thoi, đuôi tam giác, mắt tròn rỗng và miệng rỗng.

- Mục tiêu học: Đặt chi tiết nhỏ chính xác trên khối lớn
- FTUE: không có
- Câu thơ: "Cá chép bơi ngược dòng ngân hà."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| D1 | thoi | — | 64 | (40,48) | (48,48) (32,48) (40,56) |
| T1 | tam giác | 5 | 48 | (16,56) | (24,56) (8,56) (16,64) |
| C1 | tròn | — | 16 | (72,64) | (80,64) (64,64) (72,72) |
| M1 | tam giác | 0 | 16 | (88,72) | (96,72) (80,72) (88,80) |

### 3-4 Ngọn Nến

Thân hai vuông, quầng sáng tròn ôm ngọn lửa thoi âm bản, khe rỗng giữa quầng và thân.

- Mục tiêu học: Nhìn ra hình âm bản (hình hiện bằng khoảng rỗng)
- FTUE: không có
- Câu thơ: "Ngọn lửa không cháy, chỉ để lại hình bóng."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| S1 | vuông | — | 32 | (48,96) | (56,96) (40,96) (48,104) |
| S2 | vuông | — | 32 | (48,128) | (56,128) (40,128) (48,120) |
| D1 | thoi | — | 32 | (48,56) | (56,56) (40,56) (48,64) |
| C1 | tròn | — | 64 | (32,40) | (40,40) (24,40) (32,48) |

### 3-5 Thuyền Buồm Hoàng Hôn

Thân thuyền chữ V, hai buồm tam giác, mặt trời tròn lặn sau buồm.

- Mục tiêu học: Ghép nhiều tam giác khác cỡ và một vùng giao cong
- FTUE: không có
- Câu thơ: "Mặt trời lặn sau cánh buồm, thuyền vẫn đi."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| H1 | tam giác | 6 | 64 | (24,104) | (24,96) |
| L1 | tam giác | 3 | 64 | (56,32) | (64,32) (48,32) (56,40) |
| J1 | tam giác | 2 | 32 | (24,64) | (32,64) (16,64) (24,72) |
| C1 | tròn | — | 32 | (80,48) | (88,48) (72,48) (80,56) |

### 3-6 Mèo Thần

Đầu vuông, hai tai tam giác nhỏ, hai mắt thoi rỗng, thân mái lớn, đuôi bình hành.

- Mục tiêu học: Ghép bảy mảnh, nhận ra bình hành và tam giác nhỏ
- FTUE: không có
- Câu thơ: "Mèo thần ngồi canh cửa giữa hai thế giới."
- Độ khó ước lượng: 4/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| S1 | vuông | — | 32 | (40,24) | (48,24) (32,24) (40,32) |
| E1 | tam giác | 3 | 16 | (40,8) | (48,8) (32,8) (40,16) |
| E2 | tam giác | 2 | 16 | (56,8) | (64,8) (48,8) (56,16) |
| B1 | tam giác | 4 | 96 | (8,8) | (16,8) (0,8) (8,16) |
| T1 | bình hành | 1 | 48 | (88,56) | (80,56) |
| Y1 | thoi | — | 16 | (40,32) | (48,32) (32,32) (40,40) |
| Y2 | thoi | — | 16 | (56,32) | (64,32) (48,32) (56,40) |

### 3-7 Hoa Sen

Nụ thoi lồng vào hai cánh tam giác, hai bình hành làm mặt nước.

- Mục tiêu học: Dùng vùng giao mảnh để tách cánh hoa
- FTUE: không có
- Câu thơ: "Sen nở trên mặt nước, không vướng bùn."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| P1 | thoi | — | 48 | (40,56) | (48,56) (32,56) (40,64) |
| P2 | tam giác | 3 | 48 | (16,48) | (24,48) (8,48) (16,56) |
| P3 | tam giác | 2 | 48 | (64,48) | (72,48) (56,48) (64,56) |
| W1 | bình hành | 0 | 48 | (16,104) | (24,104) (8,104) (16,112) |
| W2 | bình hành | 2 | 48 | (64,104) | (72,104) (56,104) (64,112) |

### 3-8 Kim Tự Tháp Nhật Thực

Kim tự tháp mái 128 có cửa tam giác rỗng; nhật thực từ hai hình tròn lệch nhau.

- Mục tiêu học: Hai cụm hình tách rời trên cùng một bàn
- FTUE: không có
- Câu thơ: "Khi mặt trời bị che, kim tự tháp thức giấc."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| R1 | tam giác | 4 | 128 | (0,16) | (0,24) (0,8) |
| R2 | tam giác | 4 | 32 | (48,112) | (56,112) (40,112) (48,120) |
| C1 | tròn | — | 32 | (80,16) | (72,16) (80,24) (80,8) |
| C2 | tròn | — | 32 | (88,16) | (96,16) (88,24) (88,8) |

### 3-9 Sao Bát Phương

Vuông 48 và thoi 64 chung tâm thành sao tám cánh, bát giác rỗng, mặt trời tròn hiện lại ở tâm.

- Mục tiêu học: Nhận ra vùng ba lớp ở tâm một hình đối xứng
- FTUE: không có
- Câu thơ: "Tám hướng hội tụ về một mặt trời."
- Độ khó ước lượng: 3/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| S1 | vuông | — | 48 | (40,56) | (48,56) (32,56) (40,64) |
| D1 | thoi | — | 64 | (32,48) | (40,48) (24,48) (32,56) |
| C1 | tròn | — | 32 | (48,64) | (56,64) (40,64) (48,72) |

### 3-10 Mandala Thiên Cầu

Năm mảnh chung tâm: đĩa tròn, vuông rỗng, thoi sáng, tâm tròn rỗng, ngọc thoi sáng. Kết chương Họa Phẩm.

- Mục tiêu học: Tổng hợp: năm tầng chẵn lẻ xen kẽ
- FTUE: không có
- Câu thơ: "Thiên cầu xoay quanh một viên ngọc, bức họa hoàn tất."
- Độ khó ước lượng: 5/5

| Mảnh | Hình | Hướng | Khung | Neo A | Neo nhiễu |
|---|---|---|---|---|---|
| C1 | tròn | — | 96 | (16,32) | (24,32) (8,32) (16,40) |
| S1 | vuông | — | 64 | (32,48) | (40,48) (24,48) (32,56) |
| D1 | thoi | — | 64 | (32,48) | (40,48) (24,48) (32,56) |
| C2 | tròn | — | 32 | (48,64) | (56,64) (40,64) (48,72) |
| K1 | thoi | — | 16 | (56,72) | (64,72) (48,72) (56,80) |

## 5. Đăng ký và duyệt

- **Mỗi màn:**
  - viết nguồn `src/content/sources/<id>.ts`, dùng hàm ghép hình của spec B khi phù hợp (`concentric` cho 2-6, 3-9, 3-10; `mirrorX` cho các cặp mảnh đối xứng)
  - sinh dữ liệu bằng `npm run content:author -- <id>`
  - đăng ký vào `catalog.ts` và `manifest.ts` ở trạng thái `validated`
- **Test chung `tests/levelContent.test.ts`**, mở rộng từ `chapter1Levels.test.ts` của Chương 1:
  - kiểm số mảnh, số ô mục tiêu, đúng 1 nghiệm và 0 nghiệm ít mảnh hơn
  - JSON khớp nguồn; harness nạp được; campaign chỉ nạp khi `approved`
  - riêng Chương 2–3: số ô rỗng và số ô hiện lại khớp bảng mục 3
- **Duyệt theo thứ tự campaign** (2-1 → 2-6 → 3-1 → 3-10), mỗi màn một biên bản `docs/testing/mirror-rebuild/<id>-content-review.md`, giống Task 16 của plan Chương 1.
- **FTUE:** trigger `two-layers` và `three-layers` đã có trong `application/ftue.ts`; trigger `idle` dùng cho 2-2 và 3-1.

## 6. Tiêu chí hoàn thành

- 16 màn ở `validated`, mỗi màn có JSON, SVG, báo cáo nghiệm và ảnh chụp harness (`play`, `drag`, `win`).
- Trong ảnh `win` của mọi màn: không có vạch màu mặt bàn sai chỗ, và vùng 3 lớp hiện đúng màu mảnh.
- GDD Phụ lục A/B cập nhật theo bảng mục 3.

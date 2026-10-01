# Tài Liệu Thiết Kế Kiến Trúc UI/UX: Tấm Bia Tiên Tri (Mirror)

**Ngày lập**: 2026-10-01  
**Trạng thái**: Chờ người dùng duyệt (Pending User Review)  
**Tác giả**: Antigravity (UI/UX Designer & Phaser 3 Architect)  
**Dựa trên**: GDD Gameplay, Ảnh tham chiếu *Tấm Bia Tiên Tri* (Honkai: Star Rail), Ảnh hiện trạng game  

---

## 1. Mục Tiêu & Định Hướng Thẩm Mỹ

### 1.1. Cảm xúc chủ đạo (Mood & Feel)
- Trò chơi mang phong cách **"Tấm bia đá thiên văn cổ nhìn qua lớp kính"**: ấm áp, mềm mại, huyền bí và chiêm tinh. Không mang dáng vẻ công cụ kỹ thuật hay giao diện khô cứng.
- Loại bỏ hoàn toàn các lỗi thiết kế hiện tại: viền 1px mờ nhạt, màu sắc pha trộn thiếu kiểm soát (bỏ teal/xanh lá cây), ký tự Unicode làm icon, chữ in hoa toàn bộ, và sự thiếu vắng của hình mẫu mục tiêu.

### 1.2. Ba họ màu chủ đạo nghiêm ngặt (Strict 3 Color Families)
Tuyệt đối không dùng các màu ngoài 3 họ này (ngoại trừ màu đỏ cảnh báo chỉ xuất hiện trong hộp xác nhận xóa dữ liệu):

| Họ màu | Mã Hex | Ứng dụng cụ thể |
| :--- | :--- | :--- |
| **Họ Navy** | `#080E24` | Nền vũ trụ chính (Gradient chuyển sắc dọc) |
| | `#101B32` | Mặt đá tấm bia chơi, nền khay chứa mảnh |
| | `#050A1A` | Nền tối sâu bên trong huy hiệu mục tiêu, vùng phủ modal |
| **Họ Kính Xanh Trắng** | `#68B8DC` | Viền kính chính (dày 8–10px, bo góc 36px, hiệu ứng mài vát bevel) |
| | `#CFEFFF` | Điểm phản quang sáng (Bevel highlight) ở cạnh trên khung kính |
| | `#3A5E78` | Rãnh bóng tối ở cạnh dưới khung kính (Bevel shadow) |
| **Họ Vàng Hổ Phách** | `#FFC857` | Mảnh kính đã snap, khối nút chính (CTA "Tiếp tục", "Màn tiếp theo") |
| | `#D4A359` | Lưới tọa độ bàn cờ, viền phụ đứt nét bên trong tấm bia, đường nối chòm sao |
| | `#FFE8A6` | Viền highlight phát quang của mảnh ghép, ánh sáng thức tỉnh cổ ngữ |

- **Quy tắc độ tương phản**: Chữ chính dùng `#EEF4FA`, chữ phụ `#9DAFC7` (đạt tỉ lệ tương phản $\ge 4.5:1$ trên nền navy theo chuẩn WCAG AA).

### 1.3. Quy tắc thị giác (Visual Hierarchy)
- Mỗi màn hình có **đúng một điểm nhấn chính** (sáng nhất, đặc nhất):
  - **Menu chính**: Ấn bia cổ ngữ trung tâm (280px) & Nút "Tiếp tục" khối vàng đặc.
  - **Màn chơi**: Các mảnh ghép vàng hổ phách nổi bật trên mặt đá sẫm màu.
  - **Chọn màn**: Node màn chơi hiện tại đang phát sáng nhịp nhàng.
- Ba tầng thị giác rõ rệt: **Chính** (khối đặc, sáng) > **Phụ** (viền kính, chữ phụ) > **Nền** (mờ, hoa văn đồng mức $\le 6\%$).

### 1.4. Typography & Đóng gói Offline
- **Tiêu đề & Tên cổ ngữ**: **Playfair Display** (hoặc **Philosopher**) — Serif thanh lịch, huyền bí, hỗ trợ tiếng Việt trọn vẹn, hiệu ứng viền sáng nhẹ.
- **Giao diện & Chú thích**: **Be Vietnam Pro** (hoặc **Nunito**) — Sans-serif bo tròn thân thiện, dễ đọc ở cỡ nhỏ.
- **Quy tắc kích thước**: Chữ giao diện tối thiểu 14sp, chú thích tối thiểu 12sp. Viết hoa chữ cái đầu (Title Case), **không dùng ALL-CAPS**.
- **Đóng gói**: Toàn bộ font chuyển sang định dạng WOFF2/TTF cục bộ trong `public/assets/fonts/`, nạp offline hoàn toàn qua CSS `@font-face`.

---

## 2. Bố Cục & Phân Vùng Dọc (Canvas 720×1280)

Bố cục được chia thành các dải cố định theo chiều dọc, tôn trọng Safe Area trên mọi thiết bị di động:

```
+-----------------------------------------------------------+ (y = 0)
| 0 - 96px: Thanh trên (Menu tròn 56px | Tiêu đề | Tạm dừng) |
|           [Chừa Notch / Camera đục lỗ an toàn]            |
+-----------------------------------------------------------+ (y = 96)
| 96 - 200px: HUY HIỆU MỤC TIÊU (Vòng tròn 150px)          |
|             [Chồng 30% lên đỉnh Tấm Bia]                  |
+-----------------------------------------------------------+ (y = 184)
|                                                           |
| 184 - 952px: TẤM BIA THIÊN VĂN (Bàn cờ 512 x 768)        |
|              - Viền kính bevel 10px + inner dashed gold   |
|              - Lưới vàng 8 ô (32px) + chấm giao điểm       |
|              - Các vòng cung cổ ngữ trang trí xoay sau bia |
|                                                           |
+-----------------------------------------------------------+ (y = 952)
| (Khoảng hở 16px)                                          |
+-----------------------------------------------------------+ (y = 968)
| 968 - 1108px: KHAY MẢNH (Dải đá tối, các ô kính riêng)   |
+-----------------------------------------------------------+ (y = 1108)
| (Khoảng hở 16px)                                          |
+-----------------------------------------------------------+ (y = 1124)
| 1124 - 1216px: HÀNG NÚT DƯỚI (Đặt lại 64px | Xoay 64px)   |
|                [Nút Xoay chỉ xuất hiện từ Chương 3]       |
+-----------------------------------------------------------+ (y = 1216)
| 1216 - 1280px: SAFE AREA (Chừa thanh cử chỉ Android/iOS)  |
+-----------------------------------------------------------+ (y = 1280)
```

---

## 3. Thiết Kế Chi Tiết Từng Màn Hình

### 3.1. Màn chơi (Gameplay Screen)
1. **Tấm bia đá (Board)**:
   - Kích thước $512 \times 768$ (tương ứng $128 \times 192$ ô logic, tỉ lệ 4px/ô không đổi).
   - Khung ngoài: Viền kính xanh `#68B8DC` dày 10px, có highlight bevel cạnh trên `#CFEFFF` và góc bo lớn 36px. Bên trong là đường chỉ vàng `#D4A359` nét đứt tinh xảo.
   - Bốn góc và tâm các cạnh có khắc 4 ký tự rune chiêm tinh nhỏ phát sáng mờ tượng trưng cho 4 phương vị $0^\circ / 90^\circ / 180^\circ / 270^\circ$.
   - Phía sau tấm bia: Hai cụm vòng cung đồng tâm (vòng nét mảnh xanh phát quang + vòng vàng đứt) nhô ra ở hai bên và đỉnh/đáy, tự xoay chậm ngược chiều nhau để tạo chiều sâu huyền bí (không cắt vào mặt bàn).
   - Mặt bàn: Nền `#101B32` có vignette rìa. Lưới ô vàng hổ phách `#D4A359` gom cụm 8 ô (32px), có chấm nhỏ tại giao điểm. Ở giữa bàn có khắc chìm một vòng đồng tâm rất mờ (độ mờ $\le 8\%$).
2. **Huy hiệu mục tiêu (Target Badge)**:
   - Vòng tròn 150px nằm ở đỉnh bàn cờ ($y = 148$, tràn lên thanh trên và phủ 30% mép trên tấm bia).
   - Viền kính xanh vát cạnh kết hợp hoa văn cổ ngữ bao quanh.
   - Nền tối sâu `#050A1A`, bên trong hiển thị **bóng mục tiêu màu vàng đặc `#FFC857` luôn luôn hiển thị** (bất kể cài đặt "Hình mẫu mờ" trên bàn có bật hay tắt).
   - Chạm vào huy hiệu: Phóng to nhẹ có hiệu ứng đàn hồi để người chơi nhìn rõ chi tiết.
3. **Khay mảnh (Piece Tray)**:
   - Dải nằm ngang bo tròn mềm mại tại $y = 968..1108$. Chất liệu đá tối hơn bàn cờ.
   - Mỗi mảnh nằm trong một ô lõm viền kính riêng biệt. Mảnh đã đặt lên bàn để lại một bóng mờ nhẹ trong ô khay tương ứng.
   - Kích thước hiển thị mảnh trong khay tương đồng tỉ lệ thực tế, loại bỏ hoàn toàn đường chữ thập xước cũ.
4. **Hàng nút dưới**:
   - Nút "Đặt lại": Nút tròn 64px bên trái, viền kính xanh, icon SVG mũi tên tròn xoay lại, chữ nhỏ "Đặt lại" phía dưới. Vùng chạm đạt chuẩn $\ge 64\text{px}$.
   - Nút "Xoay": Nút tròn 64px bên phải. **Ẩn hoàn toàn ở Chương 1 và Chương 2**. Chỉ xuất hiện từ Chương 3; khi chưa chọn mảnh sẽ mờ (opacity 0.3), khi chọn mảnh sẽ sáng màu vàng hổ phách.
5. **Năm trạng thái hiển thị của Màn chơi**:
   - **Trạng thái 1 (Đang kéo - Dragging)**: Mảnh nhấc lên phóng to nhẹ ($1.06\times$) kèm bóng đổ mờ rộng xuống mặt bàn. Xuất hiện vòng hào quang sáng nhẹ quanh các neo hợp lệ gần đó.
   - **Trạng thái 2 (Đã snap - Snapped)**: Mảnh hút vào neo, viền sáng `#FFE8A6` lóe nhẹ 120ms rồi cố định với màu vàng ấm `#FFC857`, đổ bóng mềm sát mặt đá.
   - **Trạng thái 3 (Vùng giao 2 lớp - Overlap Inversion)**: Vùng giao giữa 2 mảnh chuyển về màu mặt đá `#101B32` (triệt tiêu quang học) với thời gian chuyển tiếp 150ms. Rìa trong của vùng khuyết sáng nhẹ màu vàng nhạt, giúp người chơi hiểu ngay đây là cơ chế trừ hình có chủ đích.
   - **Trạng thái 4 (Mảnh tạm - Temporary Placement)**: Mảnh thả ngoài neo hiển thị viền nét đứt, độ mờ 60%, kèm nhãn chỉ dẫn nhỏ thân thiện: "Chưa đặt — chưa tính vào hình".
   - **Trạng thái 5 (Hoàn thành - Victory Celebration)**: Viền tấm bia chạy một vệt sáng xung quanh, các vòng thiên văn phía sau bừng sáng và tăng tốc độ xoay; huy hiệu mục tiêu phát quang rực rỡ; hiển thị tên biểu tượng chiêm tinh (ví dụ: "Song Tinh") kèm một câu ngạn ngữ huyền bí ngắn. Nút "Màn tiếp theo" (khối vàng đặc) nổi bật.

---

### 3.2. Menu Chính (Main Menu Screen)
1. **Điểm nhấn trung tâm**:
   - **Ấn Bia Cổ Ngữ Lớn (280px)**: Gồm 2 vòng tròn đồng tâm mang hoa văn tiên tri xoay ngược chiều nhau rất chậm. Tâm ấn bia đặt hai hình thoi vàng chạm đỉnh nhau (biểu tượng Song Tinh của Màn 1-1) phát quang nhấp nháy êm dịu.
2. **Tiêu đề Logo**:
   - Chữ **"MIRROR"** màu vàng kim sắc nét có viền sáng nhẹ (loại bỏ hoàn toàn vệt sáng hình chữ nhật mờ đục cũ).
   - Phía dưới là **hình ảnh phản chiếu lật ngược (Mirror Reflection)** mờ dần xuống nền xanh đen, tạo điểm nhận diện cốt lõi gắn liền với tựa game.
   - Phụ đề "Cổ Ngữ Chiêm Tinh" rõ ràng, kích thước 15sp.
3. **Hệ thống nút bấm**:
   - **Nút chính (Primary CTA)**: Khối vàng đặc `#FFC857`, bo góc 20px, viền bevel. Chữ "Tiếp tục" đậm, bên dưới là dòng phụ ghi tên màn kế tiếp chưa hoàn thành (ví dụ: "Màn 1-2 · Bảo Tháp Tiên Tri"). Nếu đã hoàn thành toàn bộ sẽ ghi "Chơi lại từ đầu".
   - **Nút phụ**: "Chọn màn" dạng nút viền kính xanh trong suốt.
   - **Nút Cài đặt**: Icon bánh răng cổ ngữ tròn 56px đặt ở góc trên bên phải thanh điều hướng.
   - **Chân trang**: Thông tin phiên bản nhỏ gọn `#9DAFC7` ở sát đáy màn hình.

---

### 3.3. Màn Hình Chọn Màn (Level Select Screen - Chòm Sao Chiêm Tinh)
1. **Bố cục Chòm Sao (Constellation Map)**:
   - Ba chương (Khởi Nguyên, Giao Thoa, Luân Chuyển), mỗi chương gồm 6 màn.
   - Các màn chơi được biểu diễn bằng các **node thiên thể tròn** nối với nhau bởi các đường liên kết sao phát sáng mảnh `#D4A359`, uốn lượn theo trục dọc màn hình có thể cuộn nhẹ.
2. **Bốn trạng thái của Node**:
   - **Đã hoàn thành**: Node vàng đặc `#FFC857` có biểu tượng dấu hoàn thành tinh tế bên trong.
   - **Màn hiện tại**: Node có viền phát sáng nhấp nháy mời gọi người chơi bấm vào.
   - **Chưa chơi (đã mở)**: Node viền kính xanh trong suốt.
   - **Bị khóa**: Node tối mờ với icon ổ khóa cổ ngữ nhỏ.
3. **Thông tin màn**: Khi chạm hoặc giữ vào node, hiển thị popup nhỏ chứa tên biểu tượng chiêm tinh và số sao/tiến độ.

---

### 3.4. Hộp Thoại Cài Đặt & Tạm Dừng (Settings & Pause Modal)
1. **Quy cách hiển thị**:
   - Dạng **"Tấm bia nhỏ"** viền kính bevel đồng bộ ngôn ngữ, bo góc 24px.
   - Nền phía sau phủ 55% màu tối `#050A1A` kết hợp làm mờ nhẹ, vẫn nhìn thấy bàn cờ bên dưới.
   - Nút đóng "X" tròn ở góc trên phải; cho phép chạm ra ngoài để đóng hộp thoại.
2. **Nội dung Cài đặt**:
   - Công tắc chuyển đổi (Switch Toggle): Dạng thanh trượt bo tròn thực thụ, chạm vào toàn bộ hàng để bật/tắt với animation trượt mượt mà 150ms.
   - Nhãn rõ ràng: "Hình mẫu mờ trên bàn" (chỉ điều khiển bóng mờ trên bàn cờ, không ảnh hưởng huy hiệu mục tiêu).
   - "Rung phản hồi": Tự động ẩn nếu thiết bị không hỗ trợ.
   - Tùy chọn "Giảm chuyển động": Tắt các vòng xoay nền và giảm hạt bụi sao cho người chơi nhạy cảm hoặc máy yếu.
   - **Tách biệt nút Xóa dữ liệu**: Nút "Xóa toàn bộ tiến trình" được tách xuống dòng cuối cùng, hiển thị dạng chữ cảnh báo màu cam đỏ nhạt. Khi bấm vào bắt buộc phải qua một hộp thoại xác nhận 2 nút ("Hủy" và "Xác nhận xóa") để tránh bấm nhầm với nút "Đặt lại màn".
3. **Bảng Tạm dừng (Pause Dialog)**:
   - Gồm 3 nút sắp xếp dọc theo thứ tự ưu tiên thị giác:
     1. "Tiếp tục chơi" (Khối vàng đặc nổi bật nhất).
     2. "Chơi lại màn này" (Nút viền kính).
     3. "Về chọn màn" (Nút văn bản tinh giản).

---

## 4. Chuyển Động & Hiệu Năng (Animation & Budget)

1. **Thông số thời gian chuyển động (Timings & Easing)**:
   - Chạm nút bấm: Co nhẹ $0.96\times$ trong 90ms (`Cubic.easeOut`), nhả ra nảy về $1.0\times$.
   - Mảnh hút snap: Di chuyển vào tâm neo trong 120ms (`Back.easeOut`), viền chớp sáng nhẹ.
   - Nhấc mảnh lên kéo: Phóng to $1.06\times$ trong 80ms (`Quad.easeOut`).
   - Chuyển màn (Scene Transition): Fade mờ dần 240ms (`Sine.easeInOut`).
2. **Tối ưu hóa phần cứng (Tối thiểu Android 7 / RAM 2GB)**:
   - Dùng **Canvas Textures & 9-Slice dựng sẵn một lần lúc Boot**: Không vẽ lại viền bevel phức tạp mỗi frame.
   - **Giới hạn hạt (Particle Budget)**: Tối đa 30 hạt stardust nền và 25 hạt cho hiệu ứng ăn mừng, tự động hủy sau khi hoàn thành tween.
   - **Tự động tạm dừng**: Khi app xuống nền (Pause/Inactive), toàn bộ tween xoay vòng cổ ngữ và animation sao lập tức dừng để tiết kiệm pin.

---

## 5. Lộ Trình Triển Khai (Implementation Phases)

- **Bước 1**: Xuất bộ Mockup tĩnh tương tác HTML/SVG tập trung tại `mockups/index.html` (chạy trên trình duyệt tại tỉ lệ $720 \times 1280$) hiển thị đầy đủ Menu, Chọn màn, Cài đặt và 5 trạng thái Gameplay để người dùng duyệt.
- **Bước 2**: Thiết lập file Design Tokens (`design-tokens.ts`), tải và đóng gói 2 font chữ Playfair Display & Be Vietnam Pro, tạo bộ SVG Icons và hệ thống sinh 9-slice textures trong Phaser.
- **Bước 3**: Áp dụng code theo thứ tự ưu tiên:
  1. `PlayScene`, `Hud`, `BoardRenderer` (Màn chơi và 5 trạng thái).
  2. `MenuScene` (Menu chính với ấn bia phản chiếu).
  3. `LevelSelectScene` (Màn chọn màn chòm sao).
  4. `SettingsDialog` & `PauseDialog`.

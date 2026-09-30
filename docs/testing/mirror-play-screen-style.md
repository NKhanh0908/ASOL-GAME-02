# Mirror — Style guide màn chơi

*Phong cách: Glassmorphism · phong cảnh đêm vector phẳng nhiều lớp · chủ đề Galaxy*

| Thuộc tính | Giá trị |
|---|---|
| Phạm vi | **Chỉ màn chơi (Play screen)**, khổ dọc. Menu, màn thắng và các màn khác do team tự thiết kế theo style này |
| Nền tảng | Android dọc, offline |
| Trạng thái | PROPOSED, chờ duyệt art và playtest |
| Liên quan GDD | Chương 1 (gameplay), Chương 2 (bố cục màn chơi), Chương 3 (mỹ thuật) |

Nhãn trạng thái dùng như trong GDD: **DEFINED** = đã chốt, **PROPOSED** = đề xuất cần duyệt, **ASSUMED** = giả thuyết cần playtest.

---

## 1. Tóm tắt phong cách

Màn chơi là một **đêm Galaxy yên tĩnh** nhìn qua các **tấm kính mờ**.

- **Nền:** bầu trời sao cùng ba lớp núi vector phẳng và cây thông, lớp xa nhạt, lớp gần đậm.
- **Giao diện:** các thẻ kính bán trong suốt (thanh trên, bàn chơi, khay mảnh, thanh nút) nổi trên phong cảnh.
- **Mảnh ghép:** kính vàng ánh sao, là thành phần duy nhất thay đổi độ trong suốt theo luật chơi.
- **Cảm xúc:** bình yên, huyền ảo, không hối thúc. Hợp với game không có giờ, điểm hay hình phạt. **[DEFINED]**

Chỉ dùng phong cách **ban đêm**. Không có chế độ ban ngày. **[DEFINED]**

---

## 2. Nguyên tắc thiết kế

1. **Độ trong suốt phải mang nghĩa luật.** Chỉ mảnh ghép mới đổi độ trong theo số lớp chồng. Mọi thẻ giao diện có độ mờ cố định, để người chơi không nhầm vùng hư không với hiệu ứng nền.
2. **Bàn chơi luôn đọc được.** Bàn dùng kính đục hơn các thẻ khác, để cảnh nền dù sáng nhất cũng không làm nhiễu bóng mục tiêu.
3. **Chiều sâu bằng độ sáng, không bằng chi tiết.** Lớp xa nhạt, lớp gần đậm, hình khối phẳng.
4. **Một nút nổi bật mỗi thời điểm.** Mỗi màn chỉ có một nút đặc màu.
5. **Không dựa vào màu đơn thuần.** Trạng thái quan trọng phải có thêm viền, hình dạng hoặc chữ.

---

## 3. Bảng màu

| Vai trò | Mã màu | Ghi chú |
|---|---|---|
| Trời đêm | `#0A0F1E` | Nền dưới cùng |
| Núi xa | `#141D33` | Lớp nhạt nhất |
| Núi giữa | `#101828` | |
| Núi gần | `#0B1220` | Lớp đậm nhất, phủ chân màn hình |
| Cây thông | `#070C18` | Silhouette đậm hơn núi gần |
| Thẻ kính, bàn chơi | `#0F1A2A` | Độ mờ ở mục 4 |
| Viền kính | `#FFFFFF` ở độ mờ 20–22% | Dày 1 px |
| Mảnh kính (màu duy nhất trong MVP) | `#FFD27A` | Viền `#FFF3D0` dày 1,5 px |
| Điểm nhấn UI, bóng mục tiêu, nút sao | `#6FE3FF` | Xanh cực quang |
| Trăng, hành tinh | `#C9D3DE` | |
| Sao trang trí | `#EEF4FA` ở độ mờ 40–70% | Chỉ ở nền ngoài |
| Chữ chính | `#EEF4FA` | |
| Chữ phụ | `#9DAFC7` | |
| Chữ trên nút đặc | `#060818` | Trên nền `#6FE3FF` |

Quy tắc dùng màu:
- Tím `#B06CFF` và hồng `#FF7AC8` chỉ dùng làm màu tinh vân ở **bầu trời** (độ mờ thấp). Không dùng trên bàn chơi hay nút.
- Trên bàn chơi chỉ có ba tông: nền kính đậm, vàng của mảnh, xanh cực quang của bóng mục tiêu.
- Mọi cặp chữ và nền cần kiểm tra tương phản tối thiểu 4,5:1 trên máy thật. **[ASSUMED]**

---

## 4. Các lớp hình ảnh và thẻ kính

### 4.1. Thứ tự lớp (từ xa đến gần)

| # | Lớp | Nội dung |
|---|---|---|
| 1 | Bầu trời | Nền `#0A0F1E`, sao nhỏ, trăng hoặc hành tinh, tinh vân rất mờ |
| 2 | Núi xa | Đa giác phẳng, đỉnh cao nhất |
| 3 | Núi giữa | Đa giác phẳng |
| 4 | Núi gần + cây thông | Đa giác phẳng, phủ chân màn hình |
| 5 | Thẻ kính | Thanh trên, bàn chơi, khay, thanh nút |
| 6 | Mảnh ghép và bóng mục tiêu | Nằm trên bàn kính |

### 4.2. Thông số thẻ kính

| Thẻ | Nền | Độ mờ nền | Viền | Bo góc |
|---|---|---|---|---|
| Thanh trên | Trắng | 7% | Trắng 20%, 1 px | 14 px |
| Bàn chơi | `#0F1A2A` | **88%** | Trắng 22%, 1 px | 20 px |
| Khay mảnh | `#0F1A2A` | 70% | Trắng 20%, 1 px | 18 px |
| Thanh nút | `#0F1A2A` | 70% | Trắng 20%, 1 px | 18 px |

Ghi chú kỹ thuật:
- Ưu tiên **ảnh nền dựng sẵn** (đã làm mờ) và phủ thẻ bán trong suốt lên trên. Tránh blur thời gian thực mỗi khung hình vì nặng trên Android tầm thấp. **[PROPOSED]**
- Phong cảnh phía sau bàn chơi không được sáng hơn mức làm giảm độ rõ của bóng mục tiêu. Kiểm tra với cảnh nền sáng nhất của từng chương.

---

## 5. Bố cục màn chơi (khổ dọc)

```text
┌───────────────────────────────┐
│ ☾  (trăng/hành tinh, sao)     │  Lớp 1
│ ┌───────────────────────────┐ │
│ │ Menu    Màn 2-3    Mẫu nhỏ│ │  Thanh trên
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │                           │ │
│ │   Bàn chơi kính đục       │ │
│ │   Bóng mục tiêu nét đứt   │ │
│ │                           │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Khay mảnh                 │ │  Khay
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Menu  Đặt lại  Xoay  Tiếp │ │  Thanh nút
│ └───────────────────────────┘ │
│  ▲▲ núi và cây thông phía sau │  Lớp 2–4
└───────────────────────────────┘
```

- Thứ tự từ trên xuống: thanh trên, bàn chơi, khay, thanh nút. **[DEFINED]**
- Bàn chơi chiếm phần lớn chiều cao, GDD nêu mốc khoảng 65% cho vùng bóng và bàn. Tỷ lệ chính xác chỉnh theo tỷ lệ màn hình, ưu tiên giữ vùng chạm khay và nút đủ lớn. **[PROPOSED]**
- Vùng chạm nút và mảnh tối thiểu **48 × 48 dp**, khoảng cách giữa các nút tối thiểu 8 dp. Đây là mốc tham chiếu, cần kiểm tra trên máy thật. **[PROPOSED]**
- Phải tính safe area (tai thỏ, thanh điều hướng) trên các máy Android.

---

## 6. Thành phần chi tiết

### 6.1. Thanh trên

- **Menu** (trái): viền `#6FE3FF` 1,2 px, chữ `#EEF4FA` 11 px.
- **Tên màn** (giữa): "Màn 2-3", 14 px, đậm vừa, `#EEF4FA`.
- **Mẫu nhỏ** (phải): hình mục tiêu thu nhỏ, nền `#0F1A2A`, nét đứt `#6FE3FF`. Hỗ trợ đọc tổng thể, không thay bóng mờ trên bàn.

### 6.2. Bàn chơi và bóng mục tiêu

- Nền kính đục `#0F1A2A`, độ mờ 88%, bo góc 20 px.
- **Bóng mục tiêu:** viền nét đứt `#6FE3FF` dày 1,2 px (nét 5, cách 4), nền `#6FE3FF` độ mờ khoảng 12%. Không vẽ ranh giới từng mảnh. **[DEFINED]**
- **Nút sao:** chấm `#6FE3FF` ở các đỉnh của bóng mục tiêu. Đỉnh chưa được lấp có chấm lớn hơn (bán kính khoảng 5 px), đỉnh đã lấp có chấm nhỏ (khoảng 3 px). Nút sao là gợi ý nhìn, **không phải vị trí neo**, neo vẫn không lộ. **[PROPOSED]**
- Vài chấm sao rất mờ ở góc bàn, tránh vùng giữa bàn.

### 6.3. Mảnh ghép

- Hình cơ bản: vuông, tam giác, hình thoi. **[DEFINED]**
- Nền `#FFD27A`, viền `#FFF3D0` dày 1,5 px.
- Mảnh trong khay, mảnh đang kéo và mảnh đã snap phải khác nhau bằng viền và độ sáng. **[DEFINED]**
  - Trong khay: như trên.
  - Đang kéo: viền sáng hơn, nổi lên trên khay và bàn.
  - Đã snap: dừng chắc tại neo, vòng sáng ngắn lan ra rồi tắt.

### 6.4. Ba trạng thái vùng

| Số mảnh phủ | Hiển thị |
|---|---|
| 0 | Nền bàn kính `#0F1A2A` |
| 1 | Kính vàng `#FFD27A` |
| 2 | **Hư không**: tô đúng màu nền bàn, viền nét đứt `#6FE3FF` 1,2 px (nét 4, cách 3) |
| 3 | Kính vàng trở lại, **giống hệt trạng thái 1 khi đứng yên** |

- Viền nét đứt giúp người chơi hiểu vùng khoét là chủ đích của luật, không phải lỗi mất hình.
- Vùng 2 lớp phải tô bằng màu **đặc** của nền bàn, không để trong suốt lộ cảnh núi phía sau. **[PROPOSED]**
- Các lớp phủ tiếp theo tiếp tục luân phiên hiện/trống theo bảng luật trong GDD (mục 1.3). **[DEFINED]**

### 6.5. Khay mảnh

- Nền kính `#0F1A2A` 70%, bo góc 18 px, nhãn "Khay mảnh" 11 px màu `#9DAFC7`.
- Kéo mảnh từ khay lên bàn để thử, kéo về khay để gỡ. **[DEFINED]**

### 6.6. Thanh nút

| Nút | Kiểu | Màu | Khi nào |
|---|---|---|---|
| Menu | Viền | Viền `#6FE3FF`, chữ `#EEF4FA` | Luôn có |
| Đặt lại | Viền | Viền `#6FE3FF`, chữ `#EEF4FA` | Luôn có |
| Xoay | **Nút chính (đặc)** | Nền `#6FE3FF`, chữ `#060818` | Chỉ từ Chương 3 (ẩn ở Chương 1–2) |
| Tiếp | Viền nét đứt, mờ | Viền và chữ `#9DAFC7` | Sáng thành nút chính chỉ khi thắng màn |

- Trạng thái nhấn: thu nhỏ khoảng 96% và nền sáng lên một nấc.
- Nút không dùng được phải khác bằng **viền nét đứt và chữ mờ**, không chỉ đổi màu.
- Trước Chương 3, nút Tiếp là nút chính duy nhất khi thắng. Khi có nút Xoay, tại thời điểm thắng Xoay chuyển sang kiểu viền để chỉ còn một nút đặc. **[PROPOSED]**

---

## 7. Bầu trời theo chương

Cùng bố cục phong cảnh, chỉ đổi bầu trời để đánh dấu tiến trình. Núi và cây giữ nguyên qua các chương. **[PROPOSED]**

| Chương | Bầu trời | Chi tiết |
|---|---|---|
| 1 · Tinh Vân | Dải tinh vân tím-xanh rất mờ | Trăng lưỡi liềm, ít sao |
| 2 · Nhật Thực | Hành tinh che trăng | Vành sáng mảnh quanh vật che, gợi vùng giao |
| 3 · Quỹ Đạo | Vòng quỹ đạo mảnh | Nhiều sao, vài thiên thạch nhỏ |

Trăng, hành tinh và sao chỉ nằm ở vùng trời phía trên và hai bên, không đặt sau bàn chơi.

---

## 8. Hiệu ứng và chuyển động

Đây là phạm vi hiệu ứng nhẹ. Mọi tín hiệu phải hiểu được khi tắt tiếng. **[DEFINED: cần phản hồi nhìn thấy]**

| Sự kiện | Hiệu ứng | Thời lượng gợi ý |
|---|---|---|
| Nhấc mảnh | Viền sáng lên, nổi hơn khay | Tức thì |
| Snap | Vòng sáng nhỏ lan ra rồi tắt, không che bóng mục tiêu | Dưới 0,5 giây |
| Vùng biến mất (2 lớp) | Kính tan thành vài hạt bụi sao rồi lộ nền | Ngắn |
| Vùng hiện lại (3 lớp) | Hạt sao tụ lại thành kính | Ngắn |
| Chưa khớp | Giữ nguyên, không thông báo thất bại | — |
| Thắng | Đường nối chòm sao lần lượt sáng, mẫu nhỏ đặc màu, nút Tiếp sáng, khóa thao tác kéo | Ngắn |
| Nền | Sao lấp lánh rất chậm | Liên tục, biên độ thấp |

- Không dùng tia sáng động liên tục, lens flare hay pha màu nhiều mảnh (ngoài phạm vi MVP). **[DEFINED]**
- Chuyển động nền phải nhẹ hơn nhiều so với chuyển động của mảnh đang kéo.
- Nhạc và SFX ngoài phạm vi MVP. **[DEFINED]**

---

## 9. Chữ

- Sans-serif tròn, dễ đọc trên màn nhỏ.
- Cỡ chữ nhỏ nhất 11 px, tên màn 14 px.
- Chữ nhỏ phải có tương phản đủ cao. Tránh chữ mảnh, xám nhạt trên nền kính.

---

## 10. Checklist bàn giao cho art

- [ ] Nền tách lớp: trời, ba lớp núi, cây thông, xuất riêng để đổi bầu trời theo chương.
- [ ] Ảnh nền dựng sẵn cho vùng phía sau thẻ kính.
- [ ] Bộ thẻ kính: thanh trên, bàn chơi, khay, thanh nút, đủ hai độ mờ (88% và 70%).
- [ ] Bộ mảnh ghép: vuông, tam giác, thoi, ở ba trạng thái khay, đang kéo, đã snap.
- [ ] Bóng mục tiêu, nút sao và viền nét đứt vùng hư không.
- [ ] Bộ nút: Menu, Đặt lại, Xoay, Tiếp, mỗi nút đủ trạng thái thường, nhấn, không dùng được.
- [ ] Hiệu ứng: vòng snap, hạt bụi sao (biến mất/hiện lại), đường nối chòm sao khi thắng.
- [ ] Ba bầu trời theo chương.

---

## 11. Rủi ro cần kiểm tra khi playtest

1. Bóng mục tiêu còn rõ trên bàn khi cảnh nền sáng nhất không.
2. Vùng hư không có bị hiểu nhầm là lỗi hiển thị không (viền nét đứt đủ rõ chưa).
3. Người chơi có hiểu nút sao là gợi ý nhìn chứ không phải chỗ phải thả mảnh không.
4. Nút Xoay đặt cạnh Đặt lại có gây chạm nhầm không.
5. Hiệu ứng nền và hạt sao có làm chậm Android tầm thấp không.
6. Chữ nhỏ trên nền kính có đủ tương phản trên màn thật, ngoài trời không.

---

## 12. Ngoài phạm vi tài liệu này

- Màn menu, màn hoàn thành màn, màn hoàn thành campaign, Custom Level: do team thiết kế theo cùng style.
- Âm thanh, rung máy.
- Luật cho mảnh nhiều màu và giao nhau giữa các màu khác nhau (OPEN trong GDD).

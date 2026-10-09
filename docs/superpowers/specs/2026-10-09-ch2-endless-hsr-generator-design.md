# Đặc tả thiết kế: Bộ sinh màn vô tận Chương 2 — Giao Thoa HSR (Endless Chapter 2 Generator)

- **Ngày tạo**: 2026-10-09
- **Trạng thái**: Approved
- **Tác giả**: Antigravity
- **Phạm vi**: `game-next/experiments/endless-ch2/`, `game-next/tests/endlessCh2.test.ts`, `game-next/src/content/studio/levels/`
- **Tài liệu liên quan**:
  - `docs/superpowers/specs/2026-10-08-ch1-endless-tangram-generator-design.md` (Endless Chapter 1)
  - `docs/superpowers/specs/2026-10-02-c-chapter-2-hoa-pham-levels-design.md` (Luật Giao Thoa Chương 2)
  - `game-next/src/content/solver.ts` (`solveLevel`, `canonicalKey`)
  - `game-next/src/content/authorLevel.ts` (`authorLevel`, `filterDecoys`)
  - `game-next/src/domain/mask.ts` (`evaluate` XOR mask)

---

## 1. Mục tiêu & Yêu cầu thiết kế

### 1.1 Bối cảnh & Yêu cầu từ Game Designer
Chương 2 của Mirror mang chủ đề **Giao Thoa** (Intersections), nơi các mảnh ghép có thể đặt chồng lên nhau theo quy tắc chẵn-lẻ (XOR):
- **1 tầng phủ**: Ô sáng (thuộc bóng mục tiêu).
- **2 tầng phủ**: Triệt tiêu biến mất (khoảng rỗng, âm bản).
- **3 tầng phủ**: Tái hiện bừng sáng (hạt nhân trung tâm).

Người chơi yêu cầu:
1. **Ải vô tận Chương 2 có cơ chế xếp chồng XOR**, khó hơn Chương 1 nhưng phải **chắc chắn đúng 1 nghiệm duy nhất** (`solutionCount === 1`, `fewerPieceSolutions === 0`).
2. **Thẩm mỹ Cổ Ngữ Tiên Tri HSR (Divination Slate)**: Hình khối cân đối, trang trọng, đối xứng huyền bí, không bao giờ sinh ra các hình thù dị dạng, méo mó hoặc vô nghĩa.
3. **Ràng buộc số tầng chồng**:
   - Tối đa **3 tầng** ($\text{StackDepth} \le 3$), tuyệt đối không có 4 tầng trở lên.
   - Trong một màn chơi chỉ có **1 đến 2 điểm/vùng 3 tầng** ($1 \le \text{threeLayerSpots} \le 2$), tạo điểm nhấn bừng sáng tinh tế.
4. **Trực giác kéo thả (Khắc phục lỗi người chơi phản ánh)**:
   - Các mảnh có hình dạng giống hệt nhau (`shapeKind`, `orientation`, `frameSize` trùng nhau) trong cùng màn phải **hoán đổi vị trí cho nhau được** (interchangeable).
   - Người chơi cầm khối nào thả vào cánh trái hay cánh phải đều phải hít được, không bị khóa cứng một chiều gây cảm giác lỗi game ("không đặt được 2 khối kia").

---

## 2. Kiến trúc 5 Archetype Cổ Ngữ Huyền Bí

Để đảm bảo hình dạng có ý nghĩa thiên văn và thẩm mỹ cao, generator sử dụng 5 khuôn mẫu hình học (Archetypes) lấy cảm hứng từ Chương 2 và HSR:

| Archetype | Ý niệm thiết kế | Cấu trúc mảnh | Vùng rỗng (2 tầng) | Hạt nhân (3 tầng) |
|-----------|-----------------|---------------|--------------------|-------------------|
| `oracle-butterfly` | Cánh Bướm Điệp Ảnh (Bow / Wings) | 2 cánh tam giác mái đối hướng + ngọc tâm + đỉnh vương miện | Tâm nơ bướm rỗng do hai cánh giao nhau | Viên ngọc đặt vào tâm rỗng (tầng 3) |
| `vanguard-chevron` | Mũi Tên Tiên Phong (Chevron / Spearhead) | 2 mái tam giác lồng nhau lệch trục + ngọc đỉnh + 2 cánh phụ | Khoảng rỗng hình nêm giữa hai lớp mái | Viên ngọc đặt tại điểm giao đáy mũi tên (tầng 3) |
| `prophetic-eye` | Nhãn Tiên Tri (Prophetic Eye) | 2 thoi lồng ngang mí mắt + con ngươi thoi tâm + ngọc giọt nước khóe mắt | Mí mắt giao nhau tạo khoảng rỗng hình thoi | Con ngươi thoi 16 đặt vào tâm rỗng (tầng 3) |
| `concentric-dial` | Đĩa Đồng Tâm (Cosmic Dial) | 2 vòng tròn/thoi lồng tâm + đồng hồ cát tam giác / ngọc tâm | Vành đai giao thoa giữa 2 hình đồng tâm | Lõi đồng hồ cát hoặc ngọc tâm hiện sáng (tầng 3) |
| `crystal-shield` | Khiên Tinh Thể (Crystal Shield) | Vuông đế 64 + Thoi 64 lồng tâm + Ngọc thoi 32 + Đỉnh mái tam giác | 4 cánh sao nhọn rỗng giữa vuông và thoi | Ngọc thoi 32 đặt tại trung tâm (tầng 3) |

---

## 3. Thuật toán sinh & Xác thực

### 3.1 Quy trình sinh màn (Pipeline)

```
[Seed Mulberry32]
       │
       ▼
[Chọn ngẫu nhiên 1 trong 5 Archetype]
       │
       ▼
[Dựng PlacedPieces với toạ độ căn tâm & bước lưới 8]
       │
       ▼
[Kiểm tra Composition: StackDepth <= 3 && Spots3 in [0, 2] && Has2LayerVoid]
       │ (nếu vi phạm -> thử seed kế)
       ▼
[Nhóm các mảnh giống hệt -> Chia sẻ neo nghiệm tương đương A, A2...]
       │
       ▼
[Sinh neo nhiễu "suýt đúng" (False-fit Candidates) xếp hạng theo độ khớp bóng]
       │
       ▼
[Lọc neo nhiễu qua SAT Solver: giải song song bảo toàn solutionCount === 1]
       │
       ▼
[Cổng chấp thuận authorLevel: proven === true, solutionCount === 1, fewerPieces === 0]
       │
       ▼
[Xuất bản Level JSON, SVG preview & cài đặt vào Studio]
```

### 3.2 Cơ chế hoán đổi mảnh giống hệt (Interchangeable Anchors)
Khi màn có các mảnh cùng `shapeKind`, `orientation`, `frameSize`:
1. Gom nhóm toạ độ nghiệm của các mảnh trong nhóm.
2. Mỗi mảnh nhận neo `A` tại toạ độ của chính nó, và nhận thêm neo `A2`, `A3`... tại toạ độ của các mảnh còn lại trong nhóm.
3. `sampleSolutions` liệt kê cả nghiệm chính quy lẫn nghiệm hoán vị. Nhờ đó, luật `filterDecoys` không xóa bỏ các neo hoán vị này.
4. Bộ giải `solveLevel` đã có cơ chế `canonicalKey` nhóm theo `group`, coi việc hoán đổi các mảnh giống hệt là **cùng 1 nghiệm**, đảm bảo tính duy nhất tuyệt đối (`solutionCount === 1`).

---

## 4. Kiểm thử & Tiêu chuẩn nghiệm thu

1. **Test tự động (`tests/endlessCh2.test.ts`)**:
   - Sinh màn thành công từ seed bất kỳ.
   - Đúng `chapter === 2`, `rotationEnabled === false`.
   - Bắt buộc `proven === true`, `solutionCount === 1`, `fewerPieceSolutions === 0`.
   - Số mảnh từ 3 đến 5 mảnh.
   - Số điểm 3 tầng $\le 2$.
   - Mỗi mảnh có $\ge 2$ neo nhiễu hợp lệ.
   - Mọi seed khác nhau sinh ra bóng mục tiêu khác nhau (không trùng lặp).
2. **Kiểm tra trực quan trong Harness**:
   - Chạy được lệnh `node --experimental-strip-types experiments/endless-ch2/run.ts --count 10 --install`.
   - Mở màn `?scene=play&level=endless-ch2-001&mode=harness` chơi mượt mà.
   - Thử kéo các mảnh đối xứng vào vị trí trái/phải: cả hai đều hít chuẩn xác và giải thắng.

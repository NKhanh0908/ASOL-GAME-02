# A — Bộ hình v2: hình tròn, hình bình hành và quy tắc khung theo loại hình

Ngày: 2026-10-02 · Phạm vi: `game-next` · Phụ thuộc: spec Chương 1 (`2026-10-02-chapter-1-levels-design.md`, module `domain/shapes.ts`, quy tắc ô biên trên-trái, bộ chồng lớp chẵn/lẻ).

Loạt spec hệ thống màn: **A** (spec này) → **B** bộ khung clone và 4 chương → **C** nội dung Chương 2 + Họa Phẩm, chạy song song với **D** đặt tự do → **E** Xưởng tạo màn.

## 1. Mục tiêu

Mở rộng bộ hình để tạo được tranh nghệ thuật kiểu Tangram:

- Thêm **hình tròn** và **hình bình hành**.
- Cho phép tam giác vuông nhỏ bằng nửa cạnh tam giác lớn (ví dụ khung 24 cạnh khung 48).
- Quy tắc khung theo từng loại hình, để mọi đỉnh vẫn rơi vào giao điểm lưới hiển thị.

**Ngoài phạm vi:** hình lõm, hình chữ nhật tự do, đổi màu mảnh.

## 2. Luật hiện và ẩn: giữ chẵn lẻ (XOR)

Quyết định chốt cho cả loạt A–E: mask giữ luật chẵn lẻ hiện có trong `domain/mask.ts` (`mask[idx] ^= 1`). Ô bị phủ lẻ lần thì hiện, chẵn lần thì ẩn; nên 2 mảnh giao nhau thì ẩn, 3 lớp hiện lại.

Lý do, đã đánh giá với người review:

- Mỗi mảnh chỉ cần một phép XOR mỗi ô, độc lập với các mảnh khác, nên kéo thả mượt.
- Renderer chồng lớp chẵn/lẻ đã có.
- Bộ giải nghiệm duy nhất của spec D chỉ đúng với XOR.
- Không phải sửa engine.

Luật if-else "giao là ẩn" bị loại.

## 3. Bảng hình và khung

| `shapeKind` | Hướng | Khung cho phép | Ghi chú |
|---|---|---|---|
| `square` | 0 | bội của 8, ≥ 16 | |
| `triangle` 0–3 (góc vuông TL/TR/BR/BL) | 0–3 | bội của 8, ≥ 16 | Tam giác nhỏ: khung 16 hoặc 24 |
| `triangle` 4–7 (mái) | 4–7 | bội của 16 | Đỉnh mái ở tâm khung |
| `diamond` | 0 | bội của 16 | |
| `circle` | 0 | bội của 16 | Mới |
| `parallelogram` | 0–3 | bội của 48 | Mới, đúng tỉ lệ mảnh bình hành Tangram |

Khung tối đa 128 (bề ngang bàn). Khung sai loại hình thì validator báo lỗi mới `invalid-frame-for-shape`.

**SH-01 — Hình tròn.** Đa giác đều **32 cạnh** nội tiếp khung:

- tâm `(s/2, s/2)`, bán kính `s/2`
- đỉnh `i` tại góc `2πi/32` (đỉnh 0 nằm bên phải tâm)

Cells raster hoá từ chính đa giác này, nên hình vẽ, mask và vùng giao luôn khớp nhau (LVL-02). Đa giác bất biến khi xoay 90° (32 chia hết cho 4), nên hình tròn chỉ có hướng 0 và xoay không đổi hình.

**SH-02 — Hình bình hành.** Khung `s`, đặt `k = s/3`. Cạnh dài `2k` nằm ngang hoặc dọc, cạnh xiên 45°, chiều cao `k`:

| Hướng | Mô tả | Đỉnh |
|---|---|---|
| 0 | nằm, nghiêng phải `/` | (k,k) (3k,k) (2k,2k) (0,2k) |
| 1 | đứng (hướng 0 xoay 90°) | (2k,k) (2k,3k) (k,2k) (k,0) |
| 2 | nằm, nghiêng trái `\` | (0,k) (2k,k) (3k,2k) (k,2k) |
| 3 | đứng (hướng 2 xoay 90°) | (2k,0) (2k,2k) (k,3k) (k,k) |

Bình hành đối xứng tâm, nên xoay 180° không đổi hình. Hướng hiệu dụng sau `turns` nấc: `họ + (orientation % 2 + turns) mod 2`, với họ = 0 khi hướng 0–1 và họ = 2 khi hướng 2–3. Khi lật gương (dùng ở hàm `mirrorX` của spec B), 0 ↔ 2 và 1 ↔ 3.

**SH-03 — Quy tắc ô biên.** Giữ quy tắc trên-trái của Chương 1 cho mọi hình. Đỉnh hình tròn không nguyên nên phép so tâm ô với cạnh dùng ngưỡng `1e-9`. Ở cả hai phía ngưỡng, hai hình chung một cạnh vẫn không chung ô và không hở khe.

## 4. Thay đổi code

- **`domain/model.ts`:**
  - `ShapeKind` thêm `'circle' | 'parallelogram'`.
  - `Orientation` giữ kiểu 0–7, nhưng tập hướng hợp lệ của từng loại hình do `isValidOrientation` quyết định.
- **`domain/shapes.ts`:**
  - `shapePolygon`, `effectiveOrientation` và `isValidOrientation` thêm hai hình mới.
  - Thêm hàm mới `isValidFrame(kind, orientation, frameSize)`.
- **`content/document.ts`, `content/validate.ts`:** nhận hai `shapeKind` mới; thêm mã lỗi `invalid-frame-for-shape`.
- **Renderer:** không đổi. `drawJewelPolygon`, `parityLayers` và `clipConvex` đã làm việc với đa giác lồi bất kỳ. Hình tròn có 32 mặt vát nên trông như viên ngọc cắt giác. Vùng giao giữa các hình tròn được cắt chính xác theo đa giác 32 cạnh.
- **`content/authoringReport.ts`:** SVG xem trước vẽ hai hình mới bằng `shapePolygon`.

## 5. Kiểm thử

- `shapes.test.ts`:
  - đỉnh và số ô của hình tròn khung 16/32/64
  - đỉnh và số ô của bình hành khung 48 ở cả 4 hướng
  - bình hành hướng 0 và hướng 2 là ảnh gương của nhau
  - xoay bình hành: tập ô sau `rotateCells` và raster của hướng hiệu dụng chỉ khác ở ô có tâm nằm trên viền
  - hình tròn bất biến khi xoay
  - `isValidFrame` đúng bảng ở mục 3
- `content.test.ts`: `invalid-frame-for-shape` cho thoi khung 24, bình hành khung 32 và vuông khung 12.
- `polygonClip.test.ts`: giao hai hình tròn lệch tâm có diện tích sai số dưới 1% so với công thức hình học.

## 6. Tiêu chí hoàn thành

Typecheck, test, `content:validate` và build đều xanh. Một màn thử có hình tròn và bình hành chơi được ở harness: ảnh chụp cho thấy viên ngọc tròn có mặt vát, và vùng giao giữa hai hình tròn được vẽ chính xác.

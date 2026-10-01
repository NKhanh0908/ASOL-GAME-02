# improve-v1 — Chỉ mục loạt plan cải thiện giao diện

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

**Nguồn tham chiếu:** `docs/gui/improve-v1/` — bốn artboard HTML.

Công việc chia làm bốn giai đoạn, mỗi giai đoạn một plan riêng. Thứ tự là bắt
buộc: giai đoạn sau dùng token, module và kiểu dữ liệu do giai đoạn trước tạo
ra. Nhưng giữa hai giai đoạn là một điểm dừng sạch — test xanh, build xanh,
game chạy được — nên có thể dừng lại sau bất kỳ giai đoạn nào.

Số thứ tự task chạy liên tục từ 1 tới 11 xuyên suốt bốn plan, nên khi một task
nhắc tới "Task 1" thì đó là Task 1 của giai đoạn 1, không phải task đầu của
plan đang đọc.

| Giai đoạn | Plan | Task | Giao được gì |
|---|---|---|---|
| 1 | [Nền móng](2026-10-01-gui-improve-v1-1-nen-mong.md) | 1–3 | Bảng màu mới; lưới logic 128×160 @5px; hình học màn 1-1 đúng GridSpec |
| 2 | [Module dùng chung](2026-10-01-gui-improve-v1-2-module-dung-chung.md) | 4–5 | Nền trời dùng chung; lưới thước đo năm lớp |
| 3 | [Mảnh và khung](2026-10-01-gui-improve-v1-3-manh-va-khung.md) | 6–8 | Mảnh ngọc bốn mặt vát; khung kính; HUD — màn chơi xong hẳn |
| 4 | [Các màn còn lại](2026-10-01-gui-improve-v1-4-cac-man-con-lai.md) | 9–11 | Màn hoàn thành; màn chọn màn; màn chính; rà sạch token cũ |

## Phụ thuộc giữa các giai đoạn

```
Giai đoạn 1  ──>  Giai đoạn 2  ──>  Giai đoạn 3  ──>  Giai đoạn 4
  tokens          SkyBackdrop        JewelShape        Victory
  GRID_HEIGHT     GridPainter        khung kính        LevelSelect
  1-1.json        (dùng tokens)      HUD               Menu
                                     (dùng tokens      (dùng tất cả
                                      + hình học)       phần trước)
```

- Giai đoạn 2 cần `GRID_TOKENS`, `GLASS_TOKENS`, `LAYOUT_TOKENS` và `LayoutMetrics.cellPixel: 5` từ giai đoạn 1.
- Giai đoạn 3 cần `PIECE_TOKENS` từ giai đoạn 1 và bán kính mảnh 24 ô logic từ Task 3.
- Giai đoạn 4 cần `drawJewel` từ giai đoạn 3 và `SkyBackdrop` từ giai đoạn 2.

## Nghiệm thu chung

Sau **mỗi** task trong bất kỳ plan nào:

```bash
cd game-next && npm run typecheck && npm run test
```

Sau mỗi giai đoạn, thêm:

```bash
cd game-next && npm run content:validate && npm run build
```

Giai đoạn 1 cố ý để test đỏ giữa chừng (Task 1 làm đỏ, Task 3 làm xanh lại).
Plan ghi rõ chỗ nào đỏ và task nào sửa. Đỏ ở chỗ khác là tín hiệu có gì sai —
dừng lại và báo cáo, đừng sửa test cho xanh.

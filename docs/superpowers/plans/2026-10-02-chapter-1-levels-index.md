# Chương 1 — Chỉ mục plan

Spec: `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md` · Nhánh: `feat/chapter-1-levels` · Thư mục mã: `game-next/`

Chạy lần lượt; mỗi giai đoạn phải xanh (`npm run typecheck && npm test && npm run content:validate && npm run build`) trước khi sang giai đoạn sau.

| Giai đoạn | File | Task | Giao được gì |
|---|---|---|---|
| 1. Nền móng | `2026-10-02-chapter-1-levels-1-nen-mong.md` | 1–4 | `shapes.ts`, công cụ authoring (JSON + SVG + báo cáo nghiệm), validator kiểm hình/hướng, 1-1 thành `song-tinh-v2` |
| 2. Renderer | `2026-10-02-chapter-1-levels-2-renderer.md` | 5–9 | Vẽ đa giác thật, chồng lớp chẵn/lẻ chính xác, khay N ô, chế độ harness ở dev |
| 3. Nội dung | `2026-10-02-chapter-1-levels-3-noi-dung.md` | 10–16 | Năm màn 1-2 → 1-6 ở `validated`, GDD cập nhật, cổng duyệt từng màn |

## Ba điểm dừng cần người review

1. **Task 2, Step 10** — duyệt lại 1-1 `song-tinh-v2` trước khi commit. Không đồng ý thì dừng cả loạt.
2. **Task 14, Step 6** — nếu ảnh thắng của 1-6 có vạch màu mặt bàn dọc cạnh huyền, dừng và báo.
3. **Task 16** — duyệt từng màn 1-2 → 1-6 theo thứ tự; chỉ màn được duyệt rõ ràng mới lên `approved`.

## Con số đã tính trước

Tính bằng prototype độc lập khi viết plan (raster trên-trái + duyệt mọi tổ hợp neo/khay); test của giai đoạn 3 khoá các con số này.

| Màn | Mảnh | Ô mục tiêu | Số nghiệm | Ô đổi của từng gây nhiễu |
|---|---|---|---|---|
| 1-1 | 2 | 2.304 | 1 | 1.280 / 1.280 |
| 1-2 | 2 | 2.880 | 1 | 768 / 352 |
| 1-3 | 2 | 2.304 | 1 | 2.256 / 2.352 |
| 1-4 | 3 | 4.032 | 1 | 352 / 704 / 768 |
| 1-5 | 3 | 4.560 | 1 | 696 / 696 |
| 1-6 | 3 | 3.456 | 1 | 2.256 / 2.352 / 704 |

Không màn nào có ô bị phủ hai lần trong nghiệm, và không có nghiệm nào dùng ít mảnh hơn dự định.

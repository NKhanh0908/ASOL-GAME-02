# Duyệt Chương 1 — 1-1 → 1-6

Spec: [`2026-10-02-chapter-1-levels-design.md`](../../superpowers/specs/2026-10-02-chapter-1-levels-design.md). Dữ liệu sinh bằng `npm run content:author -- <id>` từ `game-next/src/content/sources/<id>.ts`.

Chơi thử trên dev server: `cd game-next && npm run dev`, rồi mở đường dẫn harness của từng màn dưới đây.

| Màn | Trạng thái | Xem trước | Báo cáo nghiệm | Chơi thử |
|---|---|---|---|---|
| 1-1 Song Tinh | approved (`song-tinh-v2`) | [1-1.svg](1-1.svg) | [1-1-report.md](1-1-report.md) | [harness](http://localhost:5173/?scene=play&level=1-1&mode=harness) |
| 1-2 Bảo Tháp Tiên Tri | approved (`bao-thap-v1`) | [1-2.svg](1-2.svg) | [1-2-report.md](1-2-report.md) | [harness](http://localhost:5173/?scene=play&level=1-2&mode=harness) |
| 1-3 Cánh Chim Báo Điềm | approved (`canh-chim-v1`) | [1-3.svg](1-3.svg) | [1-3-report.md](1-3-report.md) | [harness](http://localhost:5173/?scene=play&level=1-3&mode=harness) |
| 1-4 Ngọn Hải Đăng | approved (`hai-dang-v1`) | [1-4.svg](1-4.svg) | [1-4-report.md](1-4-report.md) | [harness](http://localhost:5173/?scene=play&level=1-4&mode=harness) |
| 1-5 Chiếc Thuyền Sao | approved (`thuyen-sao-v1`) | [1-5.svg](1-5.svg) | [1-5-report.md](1-5-report.md) | [harness](http://localhost:5173/?scene=play&level=1-5&mode=harness) |
| 1-6 Vương Miện Bình Minh | validated | [1-6.svg](1-6.svg) | [1-6-report.md](1-6-report.md) | [harness](http://localhost:5173/?scene=play&level=1-6&mode=harness) |

Mỗi màn đều có đúng một nghiệm và không có nghiệm dùng ít mảnh hơn. Cột trạng thái được cập nhật khi từng màn được duyệt. Ảnh Chrome không được tạo theo yêu cầu nghiệm thu; người review kiểm tra trực tiếp bằng các đường dẫn harness.

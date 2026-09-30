# Mirror — Bộ spec khởi tạo bản game mới

Ngày: 2026-09-30 · Trạng thái: tài liệu đã soạn, chờ review nội dung trước khi lập kế hoạch triển khai.

Người dùng đã chọn **khởi tạo bản game mới từ đầu** và duyệt cách chia sáu spec. Prototype trong `game/` chỉ cung cấp tham khảo hành vi, công nghệ và bài học kỹ thuật. Điểm bắt đầu sản phẩm là [Master GDD](../../../gdd/master-gdd.md) hiện tại: Chương 1 ghép tiếp giáp, Chương 2 giao hai/ba lớp, Chương 3 xoay; Android dọc, offline. Hai tài liệu Galaxy vẫn chỉ là tham khảo mỹ thuật theo quyết định trong GDD.

## 1. Đọc và triển khai theo thứ tự nào

| Spec | Trách nhiệm | Phụ thuộc | Đầu ra có thể nghiệm thu |
|---|---|---|---|
| [01 — Khởi tạo và kiến trúc](01-foundation-architecture.md) | Workspace mới, module, công cụ, các quyết định kỹ thuật | GDD | Web build và Android debug shell hoạt động |
| [02 — Core puzzle](02-puzzle-core.md) | Dữ liệu runtime, ô phủ, snap, xoay, so bóng, giao dịch trạng thái | 01 | Logic thuần vượt qua các ca đúng/sai và bất biến |
| [03 — Thao tác và màn chơi](03-play-screen-interaction.md) | Input, render, bố cục, tạm dừng, phản hồi | 01, 02 | Một màn chơi được bằng chạm, hình và phép chấm đồng nhất |
| [04 — Level và FTUE](04-level-content-ftue.md) | Hợp đồng nội dung, validator, thứ tự dạy, duyệt màn | 02, 03 | Màn có hình mục tiêu, nghiệm và hướng dẫn được kiểm chứng |
| [05 — Campaign và lưu trạng thái](05-campaign-session-storage.md) | Mở khóa, lưu offline, lifecycle, phục hồi lỗi | 02, 04 | Hoàn thành → mở màn sau → đóng/mở vẫn giữ tiến độ |
| [06 — Android và nghiệm thu](06-android-validation.md) | Thiết bị, safe area, playtest/log, điều kiện bàn giao | 01–05 | Hồ sơ kiểm chứng bản chạy và các phần còn thiếu |

Mỗi yêu cầu có tiền tố `FND`, `CORE`, `UI`, `LVL`, `SAVE` hoặc `QA` để kế hoạch triển khai và test tham chiếu chính xác. Các đường dẫn `game-next/` trong spec là vị trí **dự kiến khi triển khai**, chưa phải thư mục đã được tạo.

## 2. Phạm vi và nguồn quyết định

- Bản game mới đặt tại `game-next/`, có package, lockfile, Android project và vùng lưu dữ liệu riêng. Không nhập module từ `game/src` vào runtime mới.
- Kế thừa lựa chọn Phaser + TypeScript + Vite + Capacitor từ GDD. Khởi tạo không bao gồm đổi engine hoặc nâng cấp lên phiên bản mới nhất.
- GDD quy định trải nghiệm và phạm vi; bộ spec quy định hợp đồng kỹ thuật để thực hiện trải nghiệm đó. Khi thay đổi luật sản phẩm, cập nhật quyết định trong GDD trước rồi đồng bộ các spec bị ảnh hưởng.
- Spec này không cấp Gate G2/G3 PASS. Trạng thái đó cần review và bằng chứng riêng.
- Custom Level, audio hoàn thiện, hint/skip, màu khác nhau giao nhau và dịch vụ trực tuyến không thuộc mốc khởi tạo. Custom Level chỉ được lập spec bổ sung nếu được đưa vào phạm vi sau.

Nguồn GDD khi soạn có SHA-256 `B0DA24B61A2ABD9F7BA5F3B82D1DB353FE3FC79EF6468F9393239339655FD094`. Hash nhận diện bản nội dung đã đọc, không yêu cầu đóng băng GDD; nếu GDD đổi, rà lại bảng đối chiếu dưới đây. GDD hiện có chỉnh sửa chưa commit; bộ spec không gộp các chỉnh sửa đó vào commit của tài liệu này.

## 3. Đối chiếu nguồn và xử lý phần còn mâu thuẫn

| Nguồn GDD | Spec sở hữu | Cách áp dụng |
|---|---|---|
| §1.2–1.4 | 02 | Lưới, giao cùng màu, snap 6 ô, xoay tâm khung, neo cố định, thắng theo mask |
| §1.5, §2.2–2.3 | 03, 05 | Kéo/hủy/đặt tạm, màn chơi, pause và vòng đời |
| §2.1, §4.1, Phụ lục A/B mới | 04 | Ưu tiên hành trình học mới và tên biểu tượng mới |
| §3 | 03 | Màu GDD, lưới thị giác mỗi 8 ô, vòng chiêm tinh; tham khảo Galaxy không ghi đè hành vi |
| §4.2 | 05 | Lưu màn hoàn thành, mở khóa tuần tự, phục hồi lỗi |
| §5.1–5.2 | 01, 06 | Stack, Android, safe area, chỉ số và log playtest |

GDD vẫn còn một số ghi chú từ bản trước. Để người triển khai không chọn hai cách hiểu khác nhau, bộ spec dùng các quy tắc sau:

1. §2.1 và §4.1 mới xác định **Chương 1 không cần xếp chồng trong lời giải**, giới thiệu hai lớp ở 2-1 và ba lớp ở 2-3. Ghi chú rủi ro cũ nói xếp chồng từ 1-1 không được dùng làm yêu cầu FTUE.
2. Sáu biểu tượng mới ở Phụ lục A chưa có tọa độ nghiệm và neo đầy đủ. Bằng chứng hình học của sáu level prototype cũ không xác nhận sáu biểu tượng mới. Chúng đi qua điều kiện duyệt nội dung tại spec 04.
3. “Snap vào lưới” trong lời FTUE nghĩa là hút vào **neo được khai báo cho mảnh**, không phải cho đặt tại mọi giao điểm lưới 8 ô. Lưới chiêm tinh là lớp nhìn để ước lượng vị trí.
4. Câu “1: vuông 44 (hoặc 2 tam giác)” ở 2-2 là lựa chọn nội dung chưa chốt; validator yêu cầu đúng một danh sách mảnh cụ thể trước khi duyệt level. Việc thiếu dữ liệu màn không ngăn xây core với fixture kỹ thuật.
5. “Chương 1 không xếp chồng” là ràng buộc cho thiết kế màn và nghiệm mẫu, không thêm luật va chạm riêng. Nếu người chơi đặt sai và tạo giao, core vẫn áp dụng quy luật cùng màu thống nhất; tác giả tránh neo gây giao làm rối người mới.

## 4. Các mốc có thể bắt đầu

| Mốc | Nội dung | Điều kiện hoàn thành |
|---|---|---|
| M0 — Nền tảng | Workspace, core fixture, web shell, Android debug shell | Build tái lập được; fixture có mask độc lập; mở offline |
| M1 — Một màn từ đầu đến cuối | Màn 1-1 mới sau duyệt hình học, kéo/thả, thắng, lưu hoàn thành; menu hiển thị đúng trạng thái nội dung | Màn giải được trên điện thoại; khởi động lại vẫn ghi nhận đã hoàn thành |
| M2 — Sáu màn nền tảng và xoay | Duyệt 1-1/1-2/1-3/2-1/2-2/2-3; kiểm thử xoay bằng fixture kỹ thuật trước khi có 3-1 | Luật hai/ba lớp rõ; test xoay và phục hồi đúng; màn chưa duyệt chỉ vào bằng harness nội bộ |
| M3 — Campaign | Hoàn thiện dữ liệu các màn còn lại, nối đủ 18, playtest FTUE/campaign | Mỗi màn có nghiệm và hình đã review; đạt tiêu chí spec 06 |

M2 không được phát hành như một campaign liền mạch bằng cách bỏ qua 1-4 đến 1-6. Bản thử nội bộ có thể chọn trực tiếp các level đang thử qua harness; hành vi đó không thuộc menu campaign cho người chơi.

## 5. Cách dùng bộ spec

Review hợp đồng và các lựa chọn kỹ thuật trong sáu file, sau đó dùng `superpowers:writing-plans` để viết kế hoạch triển khai M0–M1 có đường dẫn file, nhiệm vụ và lệnh kiểm tra. Việc duyệt bộ spec không tự xác nhận code hoặc nội dung 18 màn đã hoàn thành. Bước hiện tại chỉ tạo tài liệu.

# 03 — Thao tác và màn chơi

Nguồn: GDD §1.3–1.5, §2, §3, §5.1. Phụ thuộc: 01, 02. Thiết kế này áp dụng cho một màn bất kỳ; nội dung hướng dẫn từng màn ở spec 04.

## 1. Hợp đồng input và view

**UI-01:** Play controller sở hữu session và chọn mảnh. View nhận snapshot chỉ đọc gồm mask committed, targetMask, trạng thái mảnh, selectedPieceId, phase, preview kéo và thông báo ngắn. View không tự quyết định thắng hoặc ghi completion.

Một thời điểm chỉ có một pointer điều khiển kéo. Pointer khác bị bỏ qua cho đến khi thả/hủy. Hit test dùng vùng chạm có thể mở rộng quanh hình để dễ cầm; nếu nhiều mảnh cùng trúng, chọn mảnh nhìn thấy ở lớp trên cùng. Tăng draw order chỉ ảnh hưởng chọn/vẽ viền, không đổi luật vùng giao.

## 2. Giao dịch kéo

| Thời điểm | Hành vi bắt buộc |
|---|---|
| Pointer down trên mảnh | Chọn ID, giữ pointerId và độ lệch pointer–gốc mảnh; chụp pose trước kéo |
| Pointer move đúng pointerId | Cập nhật preview; không ghi session/storage hoặc phát complete |
| Pointer up vào khay | Gửi ReturnToTray; xóa preview |
| Pointer up trên board | Đổi tọa độ sang gốc khung theo ô, gửi Drop; hiển thị snapped hoặc temporary đúng outcome |
| Pointer up ngoài board/khay | Hủy giao dịch kéo, khôi phục pose trước kéo |
| Pointer cancel, blur, pause, rời scene | Hủy kéo, xóa pointer capture/preview; không commit drop muộn |

**UI-02:** Tọa độ pointer phải qua cùng phép đổi screen → canvas → board. Không làm tròn gốc trước khi tính khoảng cách snap. Cần xử lý thao tác nhấn-chọn riêng với kéo: di chuyển dưới ngưỡng 6 đơn vị canvas là tap chọn, không tự gọi Drop. Ngưỡng này là giá trị kỹ thuật ban đầu để kiểm tra cảm ứng; không đồng nhất với bán kính snap 6 ô.

**UI-03:** Trong lúc kéo, candidate mask được tạo từ cùng evaluator của spec 02: lấy bố cục committed bỏ mảnh đang kéo, thêm candidate snapped nếu ở trong vùng hút. Nếu chưa có candidate neo, vẽ mảnh bằng viền preview, không thêm vùng đặc vào candidate mask. Preview khác committed bằng viền/sáng và không phát thông báo thắng. Thả xong hoặc cancel thì vẽ lại đúng mask committed.

Nếu mảnh đã snap được kéo đi rồi thả tạm, mask sau thả phải bỏ placement cũ. Vì vậy “bóng không đổi khi chưa snap” chỉ đúng khi kéo từ khay; không được giữ bóng của placement đã bị gỡ.

## 3. Bố cục và tọa độ

**UI-04:** Cơ sở thiết kế 720 × 1280, board logic `(104,168)` kích thước 512 × 768; hệ số 4 canvas units/ô. Board có tỷ lệ 2:3; không kéo giãn khác tỷ lệ khiến hình vuông biến thành chữ nhật. Khay khoảng y=960–1160, điều khiển dưới khay. Đây là cơ sở bố cục GDD, không gán kích thước SVG tham khảo trực tiếp vào runtime.

Tính vùng hiển thị khả dụng sau system bars/cutout/gesture insets rồi bố trí HUD, khay và board. Giữ cell vuông; khoảng trống thừa dùng nền. Trên máy ngắn, có thể giảm phần trang trí/header và scale board đồng đều trước khi giảm vùng chạm. Nút cần vùng chạm tối thiểu 48 × 48 dp theo mục tiêu GDD; lớp adapter phải đo theo mật độ/scale thực tế, không coi 48 đơn vị canvas là 48 dp. Chữ phải review ở kích thước thiết bị thật.

**UI-05:** Lưới chiêm tinh là đường thị giác mỗi 8 ô (32 đơn vị canvas ở bố cục gốc), chấm giao mờ và vòng trang trí theo GDD Chương 3. Lưới không thay danh sách neo và không khiến mọi chấm đều snap được. Đường lưới/vòng nằm dưới target và mảnh, không chặn input.

## 4. Thứ tự vẽ và trạng thái

1. Nền và trang trí tĩnh.
2. Board, lưới thị giác và vòng chiêm tinh.
3. Bóng mục tiêu mờ; thumbnail dùng cùng targetMask.
4. ResultMask hoặc candidate mask trong lúc kéo.
5. Viền mảnh/selection/temporary, tín hiệu vùng đổi và drag overlay.
6. HUD, thông báo, pause overlay và xác nhận thắng.

**UI-06:** Các ô rỗng không có màu mảnh; thấy nền board tại đó. Không dùng opacity cộng dồn của sprite để mô phỏng quy luật triệt tiêu. Ở trạng thái nghỉ, ô một lớp và ba lớp dùng cùng màu. Nếu vẽ viền riêng từng mảnh, viền không được phủ kín các lỗ nhỏ tới mức người chơi hiểu sai silhouette.

**UI-07:** Temporary dùng viền đứt, fill preview mờ và thông báo “Chưa đặt — chưa tính vào hình”. Viền đứt của target và temporary cần khác rõ bằng vị trí, độ sáng/kiểu nét hoặc nhãn; không chỉ đổi hue. Selected piece có viền riêng để biết nút Xoay tác động mảnh nào.

## 5. Nút và chuyển trạng thái

| Điều khiển | Playing | Won / pause |
|---|---|---|
| Menu | Mở pause, hủy kéo đang diễn ra | Vẫn cho về chọn màn |
| Đặt lại | Reset ngay; không giới hạn lượt | Chơi lại tạo lượt mới |
| Xoay | Chỉ Chương 3; disabled khi chưa chọn hoặc đang kéo | Disabled khi won/pause |
| Màn tiếp | Ẩn | Chỉ hiện khi won và có màn kế hợp lệ; cuối campaign hiện về menu |
| Xem mẫu | Bật/tắt lớp target theo settings | Không cung cấp neo/lời giải |

**UI-08:** Pause có Tiếp tục, Chơi lại màn, Về chọn màn. Khi đang có bố cục chưa hoàn thành, chọn Về chọn màn cần thông báo rằng quay lại sẽ bắt đầu màn từ đầu, kèm lựa chọn ở lại hoặc rời màn. Bố cục vẫn giữ trong bộ nhớ khi chỉ mở/đóng pause hoặc app xuống nền. Settings nền tảng chỉ có bóng mẫu; công tắc rung chỉ xuất hiện nếu tính năng đã được triển khai và kiểm tra. Không hiển thị điều khiển rỗng cho tính năng ngoài scope.

**UI-09:** Hiệu ứng snap/đổi vùng ngắn và không giữ khóa input sau khi domain sẵn sàng. Thắng khóa kéo/xoay ngay theo state. Nếu bật giảm chuyển động trong môi trường hoặc bản cấu hình thử, tín hiệu phải còn hiểu được bằng viền/chữ tĩnh. Không bắt buộc thêm hệ thống settings giảm chuyển động ở mốc M0–M1.

## 6. Ca nghiệm thu

- Kéo đúng điểm cầm trên điện thoại nhỏ/cao; mảnh không nhảy tâm khi nhấc hoặc khi đổi canvas scale.
- Snapped → kéo → cancel khôi phục chính xác; snapped → temporary bỏ vùng đóng góp cũ; tray → temporary không tự thắng.
- Hai lớp giao hiện lỗ và ba lớp hiện lại đúng mask, cả thumbnail lẫn board; không chỉ xem ảnh minh họa.
- Thao tác hai ngón không tạo hai drag/complete; pause hoặc app background giữa kéo không để mảnh mắc kẹt.
- 1-1 và 2-3 không có nút Xoay; fixture/level Chương 3 có nút chọn đúng mảnh. Màn tiếp chỉ xuất hiện sau thắng.
- Vào/ra màn và reset nhiều lần không tạo thêm handler hoặc save completion trùng.
- Máy có cutout/gesture bar không che thumbnail, khay, nút; tỷ lệ hình giữ nguyên.

Ghi screenshot/clip tại các trạng thái snapped, temporary, giao hai lớp, giao ba lớp và pause. Screenshot một màn tĩnh không thay cho kiểm chứng drag/lifecycle.

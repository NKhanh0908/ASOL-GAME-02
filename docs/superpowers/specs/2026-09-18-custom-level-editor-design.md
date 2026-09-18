# Custom Level Editor — Thiết kế prototype

## Mục tiêu

Cho phép người chơi chọn một level có sẵn làm mẫu, thay đổi bộ mảnh và vị trí lời giải, lưu thành custom level, rồi mở lại để chơi hoặc chỉnh sửa trên web và Android.

## Phạm vi prototype

- Giữ nguyên bóng mục tiêu của level gốc.
- Cho phép dùng bốn loại mảnh cố định, không xoay:
  - Hình vuông lớn: kích thước hiện tại 48 ô.
  - Tam giác lớn: kích thước hiện tại 48 ô.
  - Tam giác nhỏ: kích thước 24 ô, bằng một nửa chiều rộng tam giác lớn.
  - Hình thoi: kích thước hiện tại 48 ô.
- Người dùng được thêm nhiều mảnh, kéo mảnh trên lưới và xóa mảnh.
- Khi lưu, vị trí hiện tại của các mảnh là lời giải dự kiến.
- Chỉ cho lưu nếu kết quả XOR của các mảnh tại vị trí đã chọn khớp 100% với bóng mục tiêu. Điều này ngăn custom level bị lưu ở trạng thái không thể thắng.
- Custom level được đặt tên và lưu cục bộ trên thiết bị.
- Không có đồng bộ tài khoản, chia sẻ online, xoay mảnh hoặc trình chỉnh sửa ô riêng lẻ trong prototype.

## Luồng người dùng

1. Màn hình chính có nút `Custom Level`.
2. Người dùng chọn một level gốc từ danh sách level có sẵn.
3. Màn hình editor hiển thị bóng mục tiêu mờ và khay bốn loại mảnh.
4. Người dùng kéo mảnh vào bàn, chọn mảnh đang có để di chuyển, hoặc xóa mảnh khỏi bàn.
5. Editor hiển thị preview XOR và trạng thái hợp lệ/không hợp lệ.
6. Khi hợp lệ, người dùng nhập tên và bấm `Lưu`.
7. Custom level xuất hiện trong danh sách riêng, có nút `Chơi`, `Chỉnh sửa` và `Xóa`.
8. Khi chơi custom level, luật kéo thả, snap, transparency và thắng giống level gốc.

## Kiến trúc dữ liệu

Tách dữ liệu level khỏi `Session` bằng một repository nhỏ:

```ts
type LevelRecord = {
  id: string;
  title: string;
  sourceLevelId: string;
  pieces: PieceDefinition[];
  solution: Placement[];
  custom: true;
  createdAt: number;
  updatedAt: number;
};
```

- Level có sẵn tiếp tục nằm trong module dữ liệu tĩnh.
- `LevelRepository` trả về danh sách built-in và custom, tìm level theo id, lưu/cập nhật/xóa custom.
- `localStorage` là adapter đầu tiên vì có sẵn trên web và Capacitor WebView, không cần thêm dependency.
- Dữ liệu lưu dưới một key phiên bản hóa, ví dụ `mirror.custom-levels.v1`.
- JSON hỏng hoặc schema cũ được bỏ qua an toàn và không làm app không khởi động.
- `Session` nhận `Level` cụ thể thay vì tự truy cập mảng built-in, để chơi được cả hai loại level.

## Editor và validation

- Editor dùng cùng lưới logic 128 × 192 và kích thước canvas hiện tại.
- Mảnh trong editor có hướng cố định và chỉ snap theo lưới.
- Vị trí lưu là tọa độ grid nguyên của mảnh.
- Mỗi loại mảnh có giới hạn số lượng hợp lý để tránh thao tác quá nặng trên mobile.
- Validation dùng cùng `evaluate` và `matchesTarget` của gameplay; không tạo luật thắng thứ hai.
- Nút lưu bị khóa khi chưa có mảnh, tên rỗng, mảnh ngoài bàn hoặc mask kết quả chưa khớp mục tiêu.
- Khi chỉnh sửa custom level, lưu cập nhật cùng id; level gốc không bị thay đổi.

## Xử lý lỗi và dữ liệu

- Nếu `localStorage` không khả dụng hoặc đầy, báo lỗi ngắn trong editor và giữ dữ liệu đang chỉnh trong bộ nhớ.
- Xóa custom level cần xác nhận một bước.
- Không tự xóa dữ liệu custom khi cập nhật app; chỉ tăng version khi có migration rõ ràng.

## Kiểm thử và tiêu chí chấp nhận

- Unit test repository: lưu, đọc lại, cập nhật, xóa, dữ liệu hỏng.
- Unit test kích thước tam giác nhỏ và validation khớp mask.
- Unit test `Session` với một custom `Level` không phụ thuộc mảng built-in.
- Browser flow: mở Custom Level, chọn level gốc, thêm bốn loại mảnh, lưu, reload, mở lại, chơi và xóa.
- Android build kiểm tra được; việc thử trên thiết bị thật vẫn ghi riêng nếu chưa có thiết bị.


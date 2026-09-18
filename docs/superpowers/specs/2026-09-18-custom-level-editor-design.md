# Custom Level Editor — Thiết kế prototype

## Mục tiêu

Cho phép người chơi tạo level mới hoặc chỉnh trực tiếp level có sẵn bằng cách kéo các mảnh lên bàn. Hình XOR hiện tại trở thành bóng mục tiêu của level; level được lưu và mở lại trên web và Android.

## Phạm vi prototype

- Khi tạo hoặc chỉnh sửa, bóng mục tiêu được sinh từ XOR của các mảnh đang đặt trên bàn.
- Bốn loại mảnh cố định, không xoay: hình vuông lớn 48 ô, tam giác lớn 48 ô, tam giác nhỏ 24 ô và hình thoi 48 ô.
- Người dùng được thêm nhiều mảnh, kéo mảnh trên lưới và xóa mảnh.
- Khi lưu, vị trí hiện tại tạo thành `target` và `solution`; các mảnh được đưa về khay khi bắt đầu chơi level đó.
- Level có sẵn được lưu bằng override cùng `id`; level gốc trong bundle vẫn được giữ để khôi phục.
- Level mới được lưu bằng id mới và xuất hiện thêm trong danh sách.
- Không có đồng bộ tài khoản, chia sẻ online, xoay mảnh hoặc trình chỉnh sửa ô riêng lẻ trong prototype.

## Luồng người dùng

1. Màn hình chính có nút `Custom Level`.
2. Người dùng chọn `Sửa level` để mở level có sẵn hoặc `Tạo level mới` để mở editor trống.
3. Editor hiển thị lưới và khay bốn loại mảnh; target preview là XOR hiện tại trên bàn.
4. Người dùng kéo mảnh vào bàn, di chuyển hoặc xóa mảnh.
5. Người dùng đặt tên rồi bấm `Lưu` để dùng hình hiện tại làm target.
6. Level cũ được cập nhật cùng id; level mới được thêm vào danh sách.
7. Danh sách có `Chơi`, `Sửa`, `Khôi phục level gốc` cho level đã override, và `Xóa` cho level mới.
8. Khi chơi, các mảnh đã dùng trong editor trở về khay; luật kéo thả, snap, transparency và thắng giống gameplay hiện tại.

## Kiến trúc dữ liệu

Tách dữ liệu level khỏi `Session` bằng một repository nhỏ:

```ts
type LevelRecord = {
  id: string;
  title: string;
  pieces: PieceDefinition[];
  solution: Placement[];
  target: Uint8Array;
  kind: 'new' | 'override';
  sourceLevelId?: string;
  createdAt: number;
  updatedAt: number;
};
```

- Level có sẵn tiếp tục nằm trong module dữ liệu tĩnh và không bị ghi đè trong bundle.
- `LevelRepository` ưu tiên override cùng id hơn built-in; level mới được nối thêm.
- `saveOverride(id, record)` cập nhật level cũ; `create(record)` tạo level mới.
- `restoreBuiltIn(id)` xóa override; `removeNew(id)` chỉ xóa level mới.
- `localStorage` dùng key phiên bản hóa `mirror.custom-levels.v1`, không thêm dependency.
- JSON hỏng hoặc schema cũ được bỏ qua an toàn và không làm app không khởi động.
- `Session` nhận `Level` cụ thể để chơi được cả built-in và level đã lưu.

## Editor và validation

- Editor dùng lưới logic 128 × 192 và canvas hiện tại; mảnh giữ hướng cố định và snap theo lưới.
- Vị trí đặt là tọa độ grid nguyên và được dùng để tạo `target` cùng `solution`.
- Nút lưu bị khóa khi chưa có mảnh, tên rỗng, mảnh ngoài bàn hoặc target rỗng.
- Khi sửa level cũ, lưu cập nhật cùng id; khi tạo mới, lưu record mới.
- Nút khôi phục chỉ hiện với level built-in đang có override.

## Xử lý lỗi và dữ liệu

- Nếu `localStorage` không khả dụng hoặc đầy, báo lỗi ngắn trong editor và giữ dữ liệu đang chỉnh trong bộ nhớ.
- Khôi phục level gốc và xóa level mới cần xác nhận một bước.
- Không tự xóa dữ liệu custom khi cập nhật app; chỉ tăng version khi có migration rõ ràng.

## Kiểm thử và tiêu chí chấp nhận

- Unit test repository: tạo mới, override, đọc ưu tiên override, khôi phục built-in, xóa level mới và dữ liệu hỏng.
- Unit test kích thước tam giác nhỏ và sinh target từ XOR.
- Unit test `Session` với một custom `Level` không phụ thuộc mảng built-in.
- Browser flow: sửa level 1-1, khôi phục level gốc, tạo level mới, lưu target từ XOR, reload, chơi và xóa level mới.
- Android build kiểm tra được; việc thử trên thiết bị thật vẫn ghi riêng nếu chưa có thiết bị.


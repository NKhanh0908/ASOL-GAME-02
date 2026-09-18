# Custom level editor verification — 2026-09-18

## Luồng đã kiểm tra

| Luồng | Kết quả |
| --- | --- |
| Mở `Tạo level mới` từ menu | Đạt; editor bắt đầu với bàn trống |
| Thêm mảnh vuông và lưu | Đạt; XOR hiện tại được lưu làm target và chuyển sang gameplay |
| Mở `Sửa` cho level 1-1 | Đạt; nạp lại các mảnh và vị trí của level |
| Lưu level cũ | Đạt; giữ nguyên id `1-1` và ghi override |
| Khôi phục level gốc | Đạt; xóa override và hiển thị lại built-in |
| Lưu trữ localStorage | Đạt qua repository tests và browser reload setup |

## Automated evidence

- `npm test`: 41 tests pass.
- `npm run build`: pass; Vite vẫn báo cảnh báo bundle Phaser lớn hơn 500 kB.
- Browser harness: tạo editor trống, thêm mảnh, lưu target, mở sửa level cũ và khôi phục built-in đều pass.
- `npm run android:sync`: pass.
- `android/gradlew.bat assembleDebug`: pass; APK ở `game/android/app/build/outputs/apk/debug/app-debug.apk`.
- Chưa claim playtest trên thiết bị Android thật.

## Giới hạn

Các ảnh và browser harness là kiểm chứng render thật trong môi trường desktop. Chưa có thiết bị Android thật trong phiên này để xác nhận cảm ứng, bàn phím nhập tên và khôi phục dữ liệu sau khi cài APK.

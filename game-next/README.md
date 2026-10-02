# Mirror Rebuild (`game-next`)

Bản tái thiết (Rebuild) của trò chơi giải đố Mirror theo bộ đặc tả thiết kế và kiến trúc được duyệt ngày 2026-09-30.

## Môi trường yêu cầu thực tế
- **Node.js:** `v24.13.1`
- **npm:** `11.13.0`
- **Java SDK:** `22.0.1`
- **Android SDK:** `compileSdkVersion 36`, `targetSdkVersion 36`, `minSdkVersion 24`

## Lệnh làm việc
- `npm test`: Chạy toàn bộ 56 kiểm thử tự động với Vitest
- `npm run typecheck`: Kiểm tra kiểu TypeScript với `tsc --noEmit`
- `npm run dev`: Chạy dev server web cục bộ với Vite
- `npm run build`: Typecheck và đóng gói web bundle vào thư mục `dist/`
- `npm run content:validate`: Thẩm định schema và dữ liệu các màn chơi trong campaign
- `npm run content:author -- <id...> | --all`: Sinh `src/content/levels/<id>.json` từ nguồn `src/content/sources/<id>.ts`, kèm ảnh xem trước `docs/testing/levels/<id>.svg` và báo cáo nghiệm `<id>-report.md`
- `npm run android:sync`: Đóng gói web bundle và đồng bộ tài nguyên vào dự án Android Capacitor
- `cmd /c gradlew.bat assembleDebug` (trong thư mục `android/`): Đóng gói Android Debug APK

## Các mốc nghiệm thu đã hoàn thành
- **Mốc M0 (Nền tảng kỹ thuật & Khung dự án):** Xem [`docs/testing/mirror-rebuild/m0-evidence.md`](../docs/testing/mirror-rebuild/m0-evidence.md)
- **Mốc M1 (Vertical Slice — Màn 1-1 Song Tinh):** Xem [`docs/testing/mirror-rebuild/m1-evidence.md`](../docs/testing/mirror-rebuild/m1-evidence.md)
- **Hồ sơ thẩm định màn 1-1:** Xem [`docs/testing/mirror-rebuild/1-1-content-review.md`](../docs/testing/mirror-rebuild/1-1-content-review.md)

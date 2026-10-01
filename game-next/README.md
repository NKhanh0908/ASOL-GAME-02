# Mirror Rebuild (`game-next`)

Bản khởi tạo mới (Rebuild) của dự án Mirror theo bộ đặc tả thiết kế và kiến trúc được duyệt ngày 2026-09-30.

## Môi trường yêu cầu thực tế
- Node.js: `v24.13.1`
- npm: `11.13.0`
- Java SDK: `22.0.1`
- Android SDK: `compileSdkVersion 36`, `targetSdkVersion 36`, `minSdkVersion 24`

## Lệnh làm việc
- `npm test`: Chạy kiểm thử tự động với Vitest (23 tests qua)
- `npm run typecheck`: Kiểm tra kiểu TypeScript với `tsc --noEmit`
- `npm run dev`: Chạy dev server web với Vite
- `npm run build`: Typecheck và build web bundle vào `dist/`
- `npm run content:validate`: Kiểm tra hợp lệ dữ liệu màn chơi
- `npm run android:sync`: Build web và đồng bộ tài nguyên vào dự án Android Capacitor
- `cmd /c gradlew.bat assembleDebug` (trong thư mục `android/`): Đóng gói APK debug

## Hồ sơ nghiệm thu
- Mốc M0 (Nền tảng kỹ thuật): Xem [`docs/testing/mirror-rebuild/m0-evidence.md`](../docs/testing/mirror-rebuild/m0-evidence.md)

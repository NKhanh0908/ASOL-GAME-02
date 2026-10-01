# Mirror Rebuild (`game-next`)

Bản khởi tạo mới (Rebuild) của dự án Mirror theo bộ đặc tả thiết kế và kiến trúc được duyệt ngày 2026-09-30.

## Môi trường yêu cầu
- Node.js: `v24.13.1`
- npm: `11.13.0`

## Lệnh làm việc
- `npm test`: Chạy kiểm thử tự động với Vitest
- `npm run typecheck`: Kiểm tra kiểu TypeScript với `tsc --noEmit`
- `npm run dev`: Chạy dev server web với Vite
- `npm run build`: Typecheck và build web bundle vào `dist/`
- `npm run content:validate`: Kiểm tra hợp lệ dữ liệu màn chơi
- `npm run android:sync`: Build web và đồng bộ tài nguyên vào dự án Android Capacitor

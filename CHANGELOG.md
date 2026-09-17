# Changelog

Nhật ký này là nguồn đọc nhanh cho người phát triển và AI. Mỗi commit có thay đổi về code, tài liệu, cấu hình hoặc level phải thêm một mục vào phần `Unreleased` trước khi push. Khi tạo bản phát hành, chuyển các mục đã hoàn tất sang một phiên bản có ngày cụ thể.

## Unreleased

### Repository setup

Commit: `docs repository setup`
Branch: `feat/mirror-prototype`

- Thêm README root làm điểm vào duy nhất cho người phát triển và AI.
- Thêm quy trình kiểm tra trước push và quy ước commit.
- Thêm changelog làm sổ theo dõi thay đổi code, tài liệu, cấu hình và level.

## 2026-09-17 — Prototype interaction refinement

Commit: `6b7f434`
Branch: `feat/mirror-prototype`

- Đổi toàn bộ mảnh và bóng mục tiêu sang một màu vàng cam.
- Thêm hình vuông, tam giác và hình thoi cho sáu level.
- Giữ mảnh ở vị trí tạm nếu thả ngoài vùng hít; vị trí tạm không tham gia kiểm tra thắng.
- Cho phép kéo mảnh xuống khay để gỡ khỏi bàn.
- Giảm bán kính hít từ 12 xuống 6 ô lưới.
- Cập nhật spec và lưu hai ảnh tham khảo trong `docs/ref/`.
- Kiểm tra: 12 test logic đạt, `npm run build` đạt, APK debug build đạt.

## 2026-09-17 — Android prototype implementation

Commit: `324716c`
Branch: `feat/mirror-prototype`

- Tạo game Phaser + TypeScript + Vite với sáu level prototype.
- Thêm bộ tính mặt nạ chồng chẵn/lẻ và kiểm tra silhouette.
- Thêm kéo thả, snap theo lưới, bóng mẫu, đặt lại và chuyển màn.
- Thêm dự án Capacitor Android, cấu hình khóa màn hình dọc và build APK debug.
- Thêm test cho mask, level và session.

## 2026-09-17 — Concept and design baseline

Commit: `8542725`
Branch: `main`

- Ghi nhận idea sheet, idea gate, đánh giá kỹ thuật và thiết kế prototype Android.
- Chốt phạm vi solo prototype sáu màn dùng Phaser + TypeScript + Capacitor.

## Quy ước ghi mục mới

Mỗi mục mới nên có cấu trúc:

```markdown
## YYYY-MM-DD — Tên thay đổi

Commit: `hash`
Branch: `branch-name`

- Thay đổi chính.
- Tác động đến gameplay, tài liệu hoặc build.
- Kiểm tra đã chạy và kết quả.
```

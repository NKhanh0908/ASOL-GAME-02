# Changelog

Nhật ký này là nguồn đọc nhanh cho người phát triển và AI. Mỗi commit có thay đổi về code, tài liệu, cấu hình hoặc level phải thêm một mục vào phần `Unreleased` trước khi push. Khi tạo bản phát hành, chuyển các mục đã hoàn tất sang một phiên bản có ngày cụ thể.

## Unreleased

### 2026-09-17 - Fixed large puzzle shape geometry

- Added deterministic square, upward triangle, and diamond raster shapes with a shared bounding-box size.
- Added cell containment checks and coverage tests for large puzzle pieces.
- Verification: focused shape tests and `npm run build` pass.

### 2026-09-17 — Kế hoạch triển khai puzzle redesign

- Ghi nhận người dùng duyệt spec thiết kế mảnh lớn và giao diện vũ trụ.
- Thêm `docs/superpowers/plans/2026-09-17-mirror-puzzle-visual-redesign.md` với 5 task: hình học, câu đố, bố cục, tương tác và kiểm chứng/đóng gói.
- Plan yêu cầu xem hình render thật và kiểm tra tương tác, không chỉ dựa vào test logic hoặc build.
- Kiểm tra: đối chiếu spec, chữ ký hàm, đường dẫn và diff; chưa triển khai gameplay.

### 2026-09-17 — Thiết kế lại câu đố và giao diện

- Thêm spec `docs/superpowers/specs/2026-09-17-mirror-puzzle-visual-redesign.md`: mảnh lớn, sáu hình đích trừu tượng cần chồng và giao diện vũ trụ nhẹ.
- Chốt hướng cố định, luật một màu; làm rõ thứ tự đặt không ảnh hưởng silhouette chẵn/lẻ.
- Ghi tiêu chí kiểm chứng dữ liệu, hình ảnh và tương tác trước khi triển khai; chưa thay đổi code gameplay.
- Kiểm tra: đọc đối chiếu luật hiện tại và rà soát liên kết tài liệu; không chạy lại test code cho thay đổi chỉ gồm spec.

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

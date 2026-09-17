# ASOL Game 02 — Mirror Prototype

Mirror là prototype game giải đố kéo thả dành cho Android và web. Người chơi đặt các mảnh vuông, tam giác và hình thoi lên lưới để tạo ra đúng hình bóng mục tiêu. Vùng chồng được tính theo quy luật chẵn/lẻ: lớp phủ chẵn biến mất, lớp phủ lẻ hiện lại.

Prototype hiện có sáu màn, chia thành hai chương. Bản chơi mở thẳng vào màn 1-1, không có tài khoản, máy chủ hay lưu tiến độ. Web và Android dùng chung mã gameplay.

## Trạng thái hiện tại

- Công nghệ: Phaser, TypeScript, Vite và Capacitor Android.
- Nền tảng kiểm chứng: trình duyệt web và Android màn hình dọc.
- Gameplay: một màu vàng cam, bóng mục tiêu mờ luôn hiển thị, mảnh có thể kéo lại hoặc kéo xuống khay để gỡ.
- Logic: lưới 128 × 192 ô, vùng hít 6 ô, chỉ mảnh đã snap mới được tính vào hình kết quả.
- Kiểm thử hiện tại: 12 test logic đã đạt; APK debug đã build được.
- Việc còn lại: playtest trên thiết bị Android thật và playtest với người chơi chưa biết luật.

## Cấu trúc repository

```text
docs/
  concept/       Ý tưởng, phạm vi và đánh giá công nghệ
  ref/           Ảnh tham khảo giao diện và trải nghiệm
  superpowers/   Spec và plan của prototype
game/
  src/domain/    Luật lưới, dữ liệu level và session
  src/ui/        Phaser scene và phần vẽ
  android/       Dự án Capacitor Android
CHANGELOG.md     Nhật ký thay đổi bắt buộc của repository
```

## Chạy bản web

Yêu cầu Node.js 22 trở lên.

```powershell
cd game
npm ci
npm run dev
```

Mở địa chỉ Vite in ra, thường là `http://localhost:5173`.

Các lệnh kiểm tra:

```powershell
npm test
npm run build
```

## Build Android debug

Cần Android SDK. Trên Windows, có thể tạo `game/android/local.properties` như sau:

```powershell
cd game
Set-Content -LiteralPath android/local.properties -Value "sdk.dir=$(($env:LOCALAPPDATA + '/Android/Sdk').Replace('\','/'))" -Encoding ascii
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

APK nằm tại `game/android/app/build/outputs/apk/debug/app-debug.apk`. Để cài lên điện thoại đã bật USB debugging, chạy `npx cap run android` từ thư mục `game` sau bước đồng bộ.

## Quy trình commit và push

Mọi thay đổi về code, tài liệu, cấu hình hoặc level phải được ghi vào [CHANGELOG.md](CHANGELOG.md) trong cùng commit. Mỗi mục cần có ngày, loại thay đổi, phạm vi file và kết quả kiểm tra.

Trước khi push:

```powershell
cd game
npm test
npm run build
cd ..
git diff --check
git status
```

Commit dùng dạng ngắn, mô tả bằng tiếng Anh để dễ lọc bằng công cụ:

```text
feat: add target silhouette hint
fix: keep free piece position after drop
docs: update prototype rules
chore: refresh Android build setup
```

Không commit `game/node_modules`, `game/dist`, `game/android/local.properties` hoặc thư mục build Android. Không sửa lịch sử commit đã push nếu không có quyết định rõ ràng của nhóm.

## Tài liệu chính

- [Idea sheet](docs/concept/idea-sheet.md)
- [Idea gate](docs/concept/idea-gate.md)
- [Đánh giá kỹ thuật](docs/concept/technical-assessment.md)
- [Spec prototype](docs/superpowers/specs/2026-09-17-mirror-android-prototype-design.md)
- [Plan triển khai](docs/superpowers/plans/2026-09-17-mirror-android-prototype.md)
- [Nhật ký thay đổi](CHANGELOG.md)

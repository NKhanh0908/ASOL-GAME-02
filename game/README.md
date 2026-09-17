# Mirror prototype

Sáu màn kiểm chứng kéo–thả và vùng chồng chẵn/lẻ. Mở thẳng vào màn 1-1; không có lưu tiến độ. Bản web và bản Android dùng cùng mã gameplay.

## Chạy trên máy tính

Yêu cầu Node.js 22 trở lên.

```powershell
cd game
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Kiểm tra logic bằng `npm test` và build web bằng `npm run build`.

## Build Android debug

Cần Android SDK, Gradle sẽ dùng `ANDROID_HOME` hoặc `android/local.properties` (dòng `sdk.dir=...`). Với Windows và SDK mặc định:

```powershell
Set-Content -LiteralPath android/local.properties -Value "sdk.dir=$(($env:LOCALAPPDATA + '/Android/Sdk').Replace('\','/'))" -Encoding ascii
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

APK nằm ở `android/app/build/outputs/apk/debug/app-debug.apk`. Muốn cài lên điện thoại, bật USB debugging, kết nối máy rồi dùng `npx cap run android` từ thư mục `game` sau khi chạy `npm run android:sync`. Ứng dụng chứa tài nguyên web cục bộ và chạy offline; giao diện khóa dọc. Android WebView và cảm ứng trên thiết bị thật vẫn cần được playtest.

## Các kiểm chứng cần làm với người chơi

Cho ít nhất 5 người chưa biết luật thử từ màn 1-1. Ghi họ có bắt đầu kéo mà không cần chỉ dẫn, tự giải thích được vùng 2 lớp biến mất/3 lớp hiện lại và tự giải màn 2-3 hay không. Tham chiếu [thiết kế prototype](../docs/superpowers/specs/2026-09-17-mirror-android-prototype-design.md).

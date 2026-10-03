# ASOL Game 02 — Mirror

Mirror là game giải đố kéo thả cho Android (màn hình dọc) và web. Người chơi đặt các mảnh hình lên lưới để tạo đúng hình bóng mục tiêu. Vùng chồng tính theo quy luật chẵn/lẻ: lớp phủ chẵn biến mất, lớp phủ lẻ hiện lại.

## Trạng thái

- Bản đang phát triển: `game-next/` (tái thiết từ 2026-09-30) — Phaser 3.90, TypeScript, Vite, Capacitor 8 Android.
- Nội dung: chương 1 (màn 1-1 đến 1-6) đã duyệt; manifest dự kiến 18 màn.
- `game/` là prototype cũ, chỉ giữ để tham khảo, không phát triển tiếp.
- Tình hình mới nhất và việc kế tiếp: [`docs/ai/STATUS.md`](docs/ai/STATUS.md).

## Chạy bản web

Yêu cầu Node.js `>=24.13.1 <25`.

```powershell
cd game-next
npm ci
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Mở thẳng một màn để duyệt: `?scene=play&level=1-3&mode=harness`.

Kiểm tra trước khi push:

```powershell
cd game-next
npm test
npm run build
cd ..
git diff --check
git status
```

## Build Android debug

Cần Android SDK và tệp `game-next/android/local.properties` trỏ tới SDK.

```powershell
cd game-next
npm run android:sync
cd android
cmd /c gradlew.bat assembleDebug
```

## Cấu trúc repository

```text
game-next/     Bản đang phát triển (domain, application, infrastructure, content, presentation)
game/          Prototype cũ (legacy)
docs/ai/       Ngữ cảnh cho AI: trạng thái, danh mục spec/plan, sơ đồ kiến trúc
docs/superpowers/  Spec và plan
docs/gdd/      Game design document
docs/testing/  Bằng chứng kiểm thử và hồ sơ duyệt màn
AGENTS.md      Hướng dẫn chung cho mọi AI agent (Claude Code, Codex, Antigravity)
CHANGELOG.md   Nhật ký thay đổi bắt buộc
```

## Quy trình làm việc

- Mọi commit thay đổi code, tài liệu, cấu hình hoặc level phải kèm mục trong [CHANGELOG.md](CHANGELOG.md).
- Commit message, spec và plan viết bằng tiếng Anh; dạng `type(scope): summary`.
- Không commit `node_modules`, `dist`, thư mục build Android, `local.properties`.
- Quy tắc đầy đủ cho AI và người: [AGENTS.md](AGENTS.md). Danh mục tài liệu: [`docs/ai/DOCS-INDEX.md`](docs/ai/DOCS-INDEX.md).

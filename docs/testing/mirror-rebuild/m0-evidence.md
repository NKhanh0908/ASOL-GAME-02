# Hồ sơ kiểm chứng mốc M0 — Mirror Rebuild

Ngày thực hiện: 01/10/2026  
Nhánh: `feat/rebuild-m0`  
Commit liên quan:
- `b740c45`: feat: initialize rebuild geometry kernel
- `5f61b44`: feat: validate rebuild content and independent fixture
- `35a9a22`: feat: implement deterministic puzzle session commands
- `e4d8c44`: feat: add offline Android rebuild fixture harness

---

## 1. Môi trường công cụ
- **Node.js:** `v24.13.1`
- **npm:** `11.13.0`
- **TypeScript:** `5.7.2`
- **Vite:** `6.0.7`
- **Vitest:** `2.1.8`
- **Phaser:** `3.90.0`
- **Capacitor CLI / Core / Android:** `8.5.2`
- **Java:** `22.0.1` (build 22.0.1+8-16)
- **Android SDK:** `compileSdkVersion 36`, `targetSdkVersion 36`, `minSdkVersion 24`

---

## 2. Bảng kết quả thực tế theo tiêu chí M0

| Hạng mục kiểm chứng | Lệnh thực hiện | Kết quả thực tế |
|---|---|---|
| **Core / content / session** | `npm test` | **PASS**: 4 files, 23/23 tests qua (kernel: 6, content: 7, session: 9, harness: 1). |
| **Typecheck TypeScript** | `npm run typecheck` | **PASS**: 0 lỗi kiểu với tsconfig strict. |
| **Kiểm tra schema nội dung (Dev)** | `npm run content:validate` | **PASS**: Technical fixture `fixture-adjacent-diamonds` hợp lệ. |
| **Web build bundle** | `npm run build` | **PASS**: Bundle tạo tại `dist/` (JS: 1.49 MB, gzip 343.95 KB, HTML + CSS đầy đủ). |
| **Đồng bộ Android Capacitor** | `npm run android:sync` | **PASS**: Copy assets web vào `android/app/src/main/assets/public`. |
| **Android debug build** | `gradlew.bat assembleDebug` | **PASS**: `BUILD SUCCESSFUL in 1m 14s` tạo ra `app-debug.apk`. |
| **Cổng bảo vệ phát hành (Release guard)** | `npm run content:validate -- --release` | **FAIL đúng kỳ vọng**: `GATE FAIL: campaign-incomplete. Required 18 approved levels, found 0.` |
| **Tính cô lập của Domain (Isolation)** | `git grep -E 'phaser\|localStorage\|...' game-next/src/domain/` | **PASS**: 0 phụ thuộc vào Phaser, DOM hoặc prototype cũ. |
| **Offline cold start máy thật** | `adb devices -l` | **Chưa kiểm chứng trên thiết bị vật lý**: Không phát hiện thiết bị USB kết nối tại thời điểm test. |

---

## 3. Kết luận mốc M0
- Hoàn thành đầy đủ scaffold workspace `game-next/`, bộ kernel toán hình học, schema/validator, session command state machine, web harness và Android wrapper.
- Đủ điều kiện kỹ thuật để bàn giao sang triển khai **M1** (Vertical Slice — Màn 1-1 Song Tinh).

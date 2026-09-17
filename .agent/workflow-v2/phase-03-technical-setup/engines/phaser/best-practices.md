# 🌐 Phaser.js Playbook — Best Practices & Standards
*ASOL Game OS Ver 2.0 — Dành cho Game Web, Telegram Mini Apps & Playable Ads*

---

## 1. 🎯 ĐỊNH VỊ & MỤC TIÊU CÔNG NGHỆ
- **Môi trường**: HTML5 / WebGL / Canvas.
- **Ngôn ngữ chuẩn**: **TypeScript** (Strict Mode, không dùng Plain JavaScript để tránh lỗi kiểu dữ liệu).
- **Trọng số tối ưu**:
  - **Dung lượng (Build Size)**: $< 5\text{MB}$ (cho Telegram Mini Apps / Web Casual) và $< 2\text{MB}$ (cho Playable Ads).
  - **Thời gian tải trang (Load Time)**: $< 2$ giây trên mạng di động 4G.
  - **Khung hình**: Ổn định 60 FPS trên trình duyệt di động (Safari iOS & Chrome Android).

---

## 2. 🏗️ CẤU TRÚC DỰ ÁN CHUẨN (PROJECT STRUCTURE)

```
src/
├── core/                         # Pure TypeScript Logic (Không phụ thuộc Phaser)
│   ├── state-machine.ts          # Finite State Machine thuần
│   ├── grid-engine.ts            # Logic tính toán bàn cờ / match-3
│   └── save-manager.ts           # Xử lý LocalStorage / Telegram CloudStorage
├── scenes/                       # Các Scene của Phaser
│   ├── BootScene.ts              # Tải assets tối thiểu (Logo, Loading Bar)
│   ├── PreloadScene.ts           # Tải toàn bộ Sprite Sheet & Audio
│   ├── MainMenuScene.ts          # Màn hình chính & Shop
│   └── GameScene.ts              # Màn hình Gameplay HUD & Playfield
├── prefabs/                      # Các đối tượng game tái sử dụng (GameObjects / Containers)
│   ├── TileView.ts               # Hiển thị 1 ô gạch
│   ├── BoosterButton.ts          # Nút bấm booster
│   └── Popups/                   # Win/Lose Popups
├── audio/                        # Quản lý âm thanh Web Audio API
└── main.ts                       # Khởi tạo Phaser.Game config
```

---

## 3. 🚨 NGUYÊN TẮC VÀNG TRONG PHASER.JS (MUST DO & NEVER DO)

### ✅ BẮT BUỘC LÀM (MUST DO):
1. **Dùng Sprite Sheet & Texture Atlas**: Gom toàn bộ ảnh nhỏ vào 1 file Atlas duy nhất (dùng TexturePacker) để giảm số lượng HTTP Requests và Draw Calls.
2. **Tách rời Pure Logic khỏi Scene**: Logic tính điểm, luật thắng/thua viết bằng Pure TypeScript Class trong thư mục `core/`. `GameScene` chỉ nhận sự kiện để cập nhật hình ảnh.
3. **Quản lý Bộ Nhớ Audio trên Web**: Âm thanh trên trình duyệt di động chỉ được phát sau khi người chơi có tương tác chạm đầu tiên (First User Touch). Dùng Web Audio thay vì HTML5 Audio tag.
4. **Hỗ trợ Responsive Canvas**: Tự động scale theo tỷ lệ màn hình (dùng chế độ `Phaser.Scale.FIT` hoặc `RESIZE`).

### ❌ TUYỆT ĐỐI CẤM (NEVER DO):
1. **Cấm tạo mới Object trong hàm `update()`**: Không dùng từ khóa `new` hay tạo hạt particle liên tục trong vòng lặp game loop để tránh rác bộ nhớ (Garbage Collection lag).
2. **Cấm lưu trữ dữ liệu không an toàn**: Khi lưu vào `localStorage`, bắt buộc phải chuyển sang JSON string và mã hóa base64/checksum cơ bản để chống sửa điểm số.
3. **Cấm dùng asset ảnh dung lượng lớn**: Mọi ảnh nền bắt buộc nén định dạng WebP hoặc PNG-8.

# 🤖 Godot 4 Playbook — Best Practices & Standards
*ASOL Game OS Ver 2.0 — Dành cho Game 2D/3D Casual Di Động (Android/iOS/PC)*

---

## 1. 🎯 ĐỊNH VỊ & MỤC TIÊU CÔNG NGHỆ
- **Môi trường**: Godot 4.x (Khuyến nghị 4.3 LTS).
- **Ngôn ngữ chuẩn**: **GDScript 2.0** (có Static Typing: `var level: int = 1`) hoặc **C#** (nếu team thuần C#).
- **Trọng số tối ưu**:
  - **Dung lượng (Build Size)**: 15MB – 30MB (Android APK / iOS IPA).
  - **Khởi động (Startup Time)**: $< 1.5$ giây.
  - **Khung hình**: Cố định 60 FPS / 120 FPS trên màn hình di động 120Hz.

---

## 2. 🏗️ CẤU TRÚC DỰ ÁN CHUẨN (PROJECT STRUCTURE)

```
res://
├── core/                         # Pure GDScript Logic & Data Models
│   ├── state_machine/            # Node FSM
│   ├── grid_evaluator.gd         # Logic tính toán bàn cờ / match
│   └── save_system.gd            # Save/Load Resource mã hóa
├── autoload/                     # Global Singletons (Chỉ dùng tối đa 2-3 singletons)
│   ├── event_bus.gd              # [CỰC KỲ QUAN TRỌNG] Central Signal Bus
│   ├── audio_manager.gd          # Quản lý phát nhạc nền & hiệu ứng
│   └── game_state.gd             # Lưu dữ liệu người chơi trong phiên
├── scenes/                       # Các Scene phân rã độc lập
│   ├── boot/                     # Splash & Kiểm tra dữ liệu
│   ├── main_menu/                # UI Menu & Shop
│   └── gameplay/                 # Scene chơi game chính
│       ├── hud.tscn              # Giao diện hiển thị máu/điểm
│       └── board.tscn            # Bàn chơi
├── assets/                       # Tài nguyên hình ảnh, font, âm thanh
│   ├── sprites/
│   ├── fonts/
│   └── audio/
└── project.godot                 # Cấu hình dự án
```

---

## 3. 🚨 NGUYÊN TẮC VÀNG TRONG GODOT 4 (MUST DO & NEVER DO)

### ✅ BẮT BUỘC LÀM (MUST DO):
1. **Giao tiếp qua Signal Bus (Event Bus)**: Các Node con **TUYỆT ĐỐI KHÔNG** gọi trực tiếp Node cha (không dùng `get_parent().get_parent()`). Dùng quy tắc: **"Signals up, Call down"** hoặc phát tín hiệu qua `EventBus.emit_signal(...)`.
2. **Luôn dùng Static Typing**: Mọi biến và hàm bắt buộc khai báo kiểu rõ ràng (`func add_gold(amount: int) -> void:`) để tăng hiệu năng xử lý của Godot lên gấp 2-3 lần.
3. **Quản lý Scene bằng Unique Names `%`**: Đặt tên unique cho các node UI quan trọng (ví dụ: `%ScoreLabel`, `%WinPopup`) để khi tái cấu trúc cây Node không bị gãy đường dẫn.
4. **Dùng Resource để Lưu Trữ Dữ Liệu**: Kế thừa `Resource` để tạo `SaveDataResource` và lưu bằng `ResourceSaver` kết hợp mã hóa password.

### ❌ TUYỆT ĐỐI CẤM (NEVER DO):
1. **Cấm gọi `get_node()` bằng đường dẫn cứng trong `_process()`**: Không viết `get_node("Path/To/Node")` liên tục trong vòng lặp mỗi khung hình.
2. **Cấm lạm dụng Autoload (Singleton)**: Không biến mọi thứ thành Autoload. Chỉ dùng cho `EventBus` và `AudioManager`.
3. **Cấm load tài nguyên bằng đường dẫn string trực tiếp trong code chạy**: Dùng `preload()` ở đầu script hoặc tải bất đồng bộ (Background Loading).

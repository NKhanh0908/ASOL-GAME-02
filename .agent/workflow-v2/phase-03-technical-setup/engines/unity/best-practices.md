# 🎮 Unity 6 Playbook — Best Practices & Standards
*ASOL Game OS Ver 2.0 — Dành cho Game Mobile Hybrid-Casual (Android/iOS)*

---

## 1. 🎯 ĐỊNH VỊ & MỤC TIÊU CÔNG NGHỆ
- **Môi trường**: Unity 6 LTS (hoặc 2022.3 LTS).
- **Ngôn ngữ chuẩn**: **C# (.NET 8 / C# 10+)**.
- **Kiến trúc cốt lõi**: **Pure C# Micro-Engines + MVP UI Pattern + Event-Driven Decoupling**.
- **Trọng số tối ưu**:
  - **Khung hình**: Cố định $\ge 60\text{ FPS}$ trên thiết bị Android/iOS tầm trung.
  - **Bộ nhớ (RAM)**: $< 250\text{MB}$ khi đang chơi màn chơi phức tạp nhất.
  - **Draw Calls / Batches**: $< 50$ Draw Calls trên một khung hình.

---

## 2. 🏗️ CẤU TRÚC DỰ ÁN CHUẨN (PROJECT STRUCTURE)

```
Assets/
├── _Project/
│   ├── Scripts/
│   │   ├── MicroEngines/         # [TẦNG 1]: PURE C# LOGIC (Không kế thừa MonoBehaviour)
│   │   │   ├── StateMachine/     # FSM thuần C#
│   │   │   ├── GridEvaluator/    # Tính toán logic bàn cờ
│   │   │   └── SaveProfile/      # Xử lý serialize JSON & AES Encrypt
│   │   ├── Adapters/             # [TẦNG 2]: CẦU NỐI MONOBEHAVIOUR (Gắn vào Unity)
│   │   │   ├── BoardAdapter.cs   # Lắng nghe Input Unity -> Gọi MicroEngine
│   │   │   └── SoundAdapter.cs   # Gọi AudioSource
│   │   ├── UI/                   # [TẦNG 3]: MVP PATTERN CHO GIAO DIỆN
│   │   │   ├── Views/            # Chỉ nhận event & hiển thị Text/Image
│   │   │   └── Presenters/       # Cầu nối giữa UI View và MicroEngine
│   │   └── Services/             # Ads Bridge, IAP Service, Analytics Wrapper
│   ├── Prefabs/                  # UI Popups, Board Tiles, Particles
│   ├── Addressables/             # Sprites, Textures, Audio tải động
│   └── Scenes/                   # Boot.unity, MainMenu.unity, Gameplay.unity
```

---

## 3. 🚨 NGUYÊN TẮC VÀNG TRONG UNITY 6 (MUST DO & NEVER DO)

### ✅ BẮT BUỘC LÀM (MUST DO):
1. **Triết lý Micro-Engine (Pure C#)**: Logic tính điểm, luật thắng thua, tính toán lưới cờ **BẮT BUỘC viết bằng Pure C#** (không kế thừa `MonoBehaviour`). Giúp unit test EditMode chạy trong $0.1$ giây mà không cần mở Unity Play Mode.
2. **Giao tiếp qua C# Actions / ScriptableObject Events**: Tuyệt đối không để `PlayerController` nắm trực tiếp tham chiếu tới `ScoreUI`. Mọi thông tin truyền qua Event.
3. **Mô hình MVP cho Giao diện UI**:
   - `View`: Chỉ chứa `TextMeshProUGUI`, `Button`, `Image`.
   - `Presenter`: Lắng nghe nút bấm từ View $\rightarrow$ Gọi MicroEngine $\rightarrow$ Cập nhật lại View.
4. **Quản lý Tài nguyên bằng Addressables**: Tải bất đồng bộ các màn chơi hoặc trang phục để giữ dung lượng cài đặt ban đầu (Initial Download Size) nhỏ gọn.

### ❌ TUYỆT ĐỐI CẤM (NEVER DO):
1. **Cấm dùng `GameObject.Find()` hoặc `GetComponent()` trong `Update()`**: Bắt buộc cache tham chiếu tại `Awake()` hoặc truyền qua Dependency Injection.
2. **Cấm tạo rác bộ nhớ trong `Update()`**: Tuyệt đối không dùng `new List()`, chuỗi cộng dồn `string + string`, hoặc gọi Coroutine liên tục gây kích hoạt Garbage Collection (GC Spikes làm khựng game).
3. **Cấm dùng Singleton bừa bãi**: Chỉ cho phép dùng tối đa 2 Singleton Service cấp cao (`GameManager`, `AudioService`). Mọi logic tính năng đều dùng Dependency Injection hoặc Event Bus.

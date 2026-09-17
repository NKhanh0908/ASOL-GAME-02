# [Tên Dự Án] — Programmer Control Manifest
*Bản Hiến Pháp Quy Tắc Lập Trình 1 Trang Dành Cho Coder & AI Coder — ASOL Game OS Ver 2.0*
*Engine: [Phaser.js / Godot 4 / Unity 6] | Trích xuất từ: Tất cả Accepted ADRs & Playbooks*

---

## 🚨 BẢNG QUY TẮC CỐT LÕI (CORE RULES MATRIX)

### 1. TẦNG 1 — FOUNDATION & SAVE LAYER
- **✅ MUST DO**: 
  - Mọi thao tác lưu dữ liệu bắt buộc gọi qua `SaveManager` / `SaveSystem`.
  - Mọi dữ liệu ghi xuống đĩa bắt buộc phải mã hóa.
- **❌ NEVER DO**: 
  - Tuyệt đối cấm ghi trực tiếp vào `PlayerPrefs` (Unity), `localStorage` thô (Phaser) hay `user://` không mã hóa (Godot).

### 2. TẦNG 2 — MICRO-ENGINES & GAME LOGIC
- **✅ MUST DO**: 
  - Logic tính điểm, luật chơi, kiểm tra thắng/thua bắt buộc viết bằng **Pure Code độc lập** (không kế thừa `MonoBehaviour` hay phụ thuộc Engine Scene).
  - Giao tiếp giữa các module bắt buộc thông qua **Event / Signal Bus**.
- **❌ NEVER DO**: 
  - Tuyệt đối cấm gọi trực tiếp giữa 2 Model con.
  - Tuyệt đối cấm nắm giữ tham chiếu vòng tròn (Circular References).

### 3. TẦNG 3 — ADAPTERS & CONTROLLERS
- **✅ MUST DO**: 
  - Đóng vai trò là cầu nối trung gian: Nhận Input người dùng $\rightarrow$ Chuyển cho Micro-Engine xử lý.
- **❌ NEVER DO**: 
  - Tuyệt đối cấm nhét logic tính toán thuật toán vào các hàm `Update()` / `_process()`.

### 4. TẦNG 4 — PRESENTATION & UI LAYER
- **✅ MUST DO**: 
  - UI Views chỉ làm duy nhất 2 việc: Lắng nghe Event từ Controller để đổi Text/Image, và gửi sự kiện khi nút bấm được chạm.
  - Tối ưu hóa vùng chạm cho ngón tay cái (Thumb-zone).
- **❌ NEVER DO**: 
  - Tuyệt đối cấm UI View tự ý thay đổi dữ liệu người chơi (ví dụ: tự ý cộng vàng mà không thông qua Logic Core).

---

## ⚡ CÁC HÀM CẤM DÙNG (FORBIDDEN APIS & ANTI-PATTERNS)

- **Unity**: Cấm `GameObject.Find()`, cấm `GetComponent()` trong `Update()`, cấm `new` object liên tục trong frame loop.
- **Godot**: Cấm `get_node()` bằng chuỗi cứng trong `_process()`, cấm lạm dụng Autoload tràn lan.
- **Phaser**: Cấm tạo mới Texture/Object trong `update()`, cấm dùng HTML5 Audio tag trực tiếp.

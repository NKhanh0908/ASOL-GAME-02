# [Tên Dự Án] — Game Concept Brief
*Hồ sơ Game Brief Chuẩn 8 Trường Bắt Buộc — ASOL Game OS Ver 2.0*
*Ngày phê duyệt: YYYY-MM-DD | Phiên bản: 1.0 | Phụ trách: [Lead / Product Owner]*

---

## 1. 🏷️ THÔNG TIN DỰ ÁN & LỰA CHỌN ENGINE (PROJECT & TECH INFO)
- **Tên thương mại dự kiến**: [Tên game hiển thị trên Store / Web]
- **Project Codename / Slug**: `[game-slug-viet-lien-khong-dau]` (Ví dụ: `cat-bakery-puzzle`)
- **Game Engine Lựa Chọn**: **[ Phaser.js / Godot 4 / Unity 6 ]**
  - *Lý do chọn engine*: [Ví dụ: Chọn Phaser vì làm Telegram Mini App dung lượng <5MB / Chọn Godot vì 2D giải đố nhanh nhẹ / Chọn Unity vì 3D Hybrid-Casual cần Ads SDK chuẩn]
- **Nền tảng & Kênh phân phối**: [Mobile Android & iOS (Dọc/Ngang) / WebGL / Telegram Mini Apps / Playable Ads]

---

## 2. 🧩 THỂ LOẠI & ĐỘNG TỪ CỐT LÕI (GENRE & CORE VERB)
- **Thể loại chính (Primary Genre)**: [Casual Puzzle / Arcade / Idle Merge / Hyper-casual]
- **Thể loại phụ (Sub-genre)**: [Cozy Simulation / Time Management / Tap & Shoot]
- **Primary Core Verb**: **[Động từ chính: *Tap / Swipe / Match-3 / Merge / Drag*]**
- **Core Loop tóm tắt (3 bước)**:
  $$\text{[Hành động Core Verb]} \longrightarrow \text{[Nhận Thưởng/Tiền/Nguyên liệu]} \longrightarrow \text{[Nâng Cấp/Mở Khóa Màn]}$$

---

## 3. 🌟 TRẢI NGHIỆM CẢM XÚC & USP (CORE FANTASY & USP)
- **Elevator Pitch (1 câu)**: [Mô tả ngắn gọn, hấp dẫn về game]
- **Core Fantasy**: [Người chơi cảm nhận điều gì khi chơi? Ví dụ: Cảm giác thư giãn ấm áp khi biến tiệm bánh nhỏ thành chuỗi cửa hàng xinh xắn]
- **Unique Selling Point (USP)**: [Điểm độc nhất vượt trội so với đối thủ nghiên cứu được từ `research-pack.md`]

---

## 4. 👥 KHÁCH HÀNG MỤC TIÊU & THỜI LƯỢNG CHƠI (TARGET AUDIENCE)
- **Target Audience**: [Người dùng 18-35 tuổi, thích game nhẹ nhàng, giải trí nhanh]
- **Session Design**: 
  - Phiên chơi ngắn: 2–3 phút / ván.
  - Tần suất chơi: 3–5 lần / ngày.
- **Yêu cầu kết nối**: [Offline-first / Instant Web / Online nhẹ]

---

## 5. 💰 MÔ HÌNH DOANH THU (MONETIZATION MODEL)
- **Mô hình chính**: **[ Pure Ad-Supported / Hybrid-Casual (Ads + IAP) / Web Ads / IAP Only ]**
- **Kênh Quảng cáo (nếu có)**:
  - *Rewarded Video* (Tích cực: Xem để nhận thêm lượt, x2 coin, hồi sinh).
  - *Interstitial Video* (Thụ động: Xuất hiện cách quãng sau mỗi 3 ván, có nút bỏ qua sau 5s).
- **Gói IAP đề xuất (nếu có)**:
  - Gói `Remove Ads` vĩnh viễn ($0.99 - $2.99).
  - Gói Starter Pack / Tiền tệ.

---

## 6. 🎨 ĐỊNH HÌNH PHONG CÁCH MỸ THUẬT (VISUAL IDENTITY ANCHOR)
- **Art Style Direction**: [2D Vector Cute / Flat Minimalist / Stylized 3D Low-poly / Pixel Art]
- **Shape Language**: Bo tròn, thân thiện (Round, Soft edges, Friendly).
- **Color Palette Mood**: [Pastel ấm áp, màu kẹo ngọt (Cozy pastel, Candy-tone)].
- **Visual References & Keywords**: `cute cat, cozy bakery, pastel color, flat vector, wholesome, clean ui`.

---

## 7. 🏗️ BẢN ĐỒ HỆ THỐNG SƠ BỘ BÀN GIAO SANG PHASE 2 (SYSTEMS MAP)
Danh mục các hệ thống sẽ được thiết kế chi tiết ở Phase 2:
1. **Core Gameplay System** (Bắt buộc - Required): Bàn chơi, cơ chế Core Verb, tính điểm, thắng/thua.
2. **Level Progression System** (Bắt buộc - Required): Bản đồ màn chơi (Level 1 $\rightarrow$ Level 50+), độ khó tăng dần.
3. **Currency & Economy System** (Bắt buộc - Required): Tiền tệ mềm (Vàng/Bánh), tiền tệ cứng (Kim cương), Shop mua sắm.
4. **Reward Ads & IAP System** (Tùy chọn theo nền tảng): Tích hợp điểm chạm xem Ads nhận thưởng.
5. **Save & Profile System** (Bắt buộc - Required): Lưu trữ Local JSON hoặc LocalStorage (Web).

---

## 8. 🎯 PHẠM VI MVP: IN-SCOPE vs OUT-OF-SCOPE (SCOPE BOUNDARIES)

| Hạng mục | Trong Phạm Vi Bản Đầu Tiên (IN-SCOPE) | Hoãn Lại Bản Sau / Không Làm (OUT-OF-SCOPE) |
|---|---|---|
| **Gameplay** | Core Loop + 30-50 Levels giải đố cơ bản | Real-time PvP, Multiplayer qua mạng |
| **Tính năng** | Cửa hàng cơ bản, Bảng nâng cấp, Lưu cục bộ | Bang hội (Guild), Chat, Chợ giao dịch vật phẩm |
| **Mỹ thuật** | 1 Bộ theme chính hoàn chỉnh + 3-5 nhân vật | Tùy biến 100+ trang phục phức tạp, 3D nặng |
| **Hệ thống** | Ads SDK / Web Ads + Local Save | Custom Backend Server riêng |

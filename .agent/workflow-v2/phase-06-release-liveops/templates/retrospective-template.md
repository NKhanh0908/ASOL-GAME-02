# [Tên Dự Án] — Project Retrospective & Knowledge Base Archive
*Báo Cáo Tổng Kết Dự Án & Đóng Góp Ngược Tài Sản Cho Studio — ASOL Game OS Ver 2.0*
*Ngày tổng kết: YYYY-MM-DD | Người chủ trì: [Producer / Tech Lead]*

---

## 1. 🌟 NHỮNG ĐIỂM LÀM TỐT (WHAT WENT WELL)
- Quy trình 6 Phase giúp dự án hoàn thành đúng hạn trong 3 tuần mà không bị trễ deadline.
- Việc áp dụng Gameplay Micro-Engine giúp tiết kiệm hơn 1 tuần code logic bàn cờ.
- Bản build đạt 60 FPS mượt mà trên 98% thiết bị, tỉ lệ crash $<0.1\%$.

---

## 2. ⚠️ NHỮNG BÀI HỌC CẦN RÚT KINH NGHIỆM (LESSONS LEARNED)
- Khâu vẽ icon UI ở Phase 2 cần chốt kích thước chính xác sớm hơn để tránh phải scale lại asset ở Phase 5.
- Tutorial ban đầu viết quá nhiều chữ, cần tuân thủ triết lý "Action-first Tutorial" ngay từ đầu.

---

## 3. 📥 ĐÓNG GÓI TÀI SẢN KẾ THỪA CHO CÁC GAME TIẾP THEO (STUDIO ASSET HARVEST)

Theo nguyên tắc **Principle 04 (Knowledge Reuse)** và **Principle 06 (Continuous Learning)**, các tài sản sau đây từ dự án này chính thức được đưa vào kho dùng chung của ASOL:

| Loại tài sản | Tên tài sản | Vị trí đóng gói trong Studio OS | Giá trị tái sử dụng cho game sau |
|---|---|---|---|
| **Gameplay Micro-Engine** | `grid-match-engine` v1.1 | `gameplay-micro-engines/grid-match-engine/` | Đã tối ưu thuật toán tìm Match-3 nhanh gấp 2 lần. |
| **Mô-đun Kỹ thuật** | `SaveProfileManager` AES | `platform-engines/unity/reusable-modules.md` | Mã hóa an toàn 100% không bị hack điểm. |
| **Prompt AI Template** | Bộ prompt sinh Icon bánh ngọt | `phase-01-concept-discovery/templates/` | Có thể dùng lại cho mọi game phong cách Cozy/Pastel. |
| **Kinh nghiệm Vận hành** | Bài học rút gọn Tutorial A/B | `docs/retrospective/lessons-learned.md` | Tránh lặp lại sai lầm viết dài dòng ở game #3. |

# EPIC-[NN]: [Tên Epic Lớn]
*Dự án: [Tên Dự Án] | Tầng Kiến Trúc: [Foundation / Micro-Engine / Adapters / UI]*
*Trạng thái: [ PLANNING / READY FOR DEV / IN PROGRESS / DONE ]*

---

## 1. 🎯 MỤC TIÊU CỐT LÕI (EPIC GOAL)
[Mô tả mục tiêu kỹ thuật hoặc nghiệp vụ mà Epic này mang lại cho dự án]
*Ví dụ: Xây dựng hoàn chỉnh bộ máy tính toán bàn cờ Match-3, các trạng thái FSM và hệ thống tính điểm độc lập.*

---

## 2. 🧩 PHẠM VI IN-SCOPE & NON-GOALS

- **Trong phạm vi (In-Scope)**:
  - Hiện thực hóa logic bàn cờ $8\times 8$.
  - Thuật toán tìm 3 ô thẳng hàng và rơi gạch cascade.
  - Bộ Unit Test tự động EditMode bao phủ 90% logic.
- **Không làm trong Epic này (Non-Goals)**:
  - Chưa vẽ UI đẹp hay popup cửa hàng (thuộc Epic khác).
  - Chưa tích hợp SDK Quảng cáo.

---

## 3. 📋 DANH SÁCH USER STORIES BÓC TÁCH (STORIES BREAKDOWN)

| Story ID | Tên Story | Ước lượng | Trạng thái |
|---|---|:---:|:---:|
| `STORY-001` | Khởi tạo Data Structs và Khung Bàn cờ rỗng | 30 phút | READY |
| `STORY-002` | Thuật toán quét 3 ô thẳng hàng (Horizontal/Vertical) | 45 phút | READY |
| `STORY-003` | Logic hoán đổi ô (Swap) và kiểm tra hợp lệ | 30 phút | READY |
| `STORY-004` | Cơ chế gạch rơi bù chỗ trống (Cascade Drop) | 45 phút | READY |

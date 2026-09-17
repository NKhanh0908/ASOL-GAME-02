# [Tên Dự Án] — Production Plan & Dashboard Overview
*Kế Hoạch Sản Xuất Tổng Quan — ASOL Game OS Ver 2.0*
*Ngày cập nhật: YYYY-MM-DD | Tổng số Epics: [N] | Tổng số Stories: [M]*

---

## 1. 📊 TIẾN ĐỘ TỔNG QUAN THEO CÁC EPICS

| Mã Epic | Tên Epic | Số Stories | Ước lượng (Giờ) | Tiến độ (%) | Trạng thái |
|---|---|:---:|:---:|:---:|:---:|
| `EPIC-01` | Core Micro-Engine & Board Logic | 6 | 4.0h | 0% | READY |
| `EPIC-02` | Level Progression & Win/Lose | 5 | 3.5h | 0% | READY |
| `EPIC-03` | UI Navigation & Shop View | 8 | 5.0h | 0% | PLANNING |
| `EPIC-04` | Ads, IAP & Save System | 4 | 2.5h | 0% | PLANNING |

---

## 2. 🗺️ LỘ TRÌNH SPRINT (SPRINT ROADMAP)

```mermaid
gantt
    title Lộ Trình Triển Khai Sprints (Dự kiến)
    dateFormat  YYYY-MM-DD
    section Sprint 1
    Core Micro-Engine (EPIC-01)   :active, s1_1, 2026-09-01, 3d
    Level Progression (EPIC-02)   :s1_2, after s1_1, 2d
    section Sprint 2
    UI Navigation & Shop (EPIC-03):s2_1, after s1_2, 3d
    Ads & Save System (EPIC-04)   :s2_2, after s2_1, 2d
```

---

## 3. 🎯 TIÊU CHÍ HOÀN THÀNH MVP (MVP TARGET DEFINITION)
- [ ] Chơi mượt mà qua 30 màn chơi.
- [ ] Tích hợp đầy đủ xem Rewarded Ads hồi sinh và banner/interstitial.
- [ ] Lưu trữ tiến độ người chơi an toàn khi tắt app mở lại.
- [ ] Đạt chuẩn 60 FPS trên thiết bị di động mục tiêu.

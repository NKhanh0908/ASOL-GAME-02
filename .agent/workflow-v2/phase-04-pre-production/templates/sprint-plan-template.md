# SPRINT-[NN] PLAN: [Mục Tiêu Sprint]
*Dự án: [Tên Dự Án] | Thời lượng Sprint: [1 Tuần / 2 Tuần] | Bắt đầu: YYYY-MM-DD | Kết thúc: YYYY-MM-DD*

---

## 1. 🎯 MỤC TIÊU SPRINT (SPRINT GOAL)
[Mục tiêu chính mà team hoặc developer cần hoàn thành trong Sprint này]
*Ví dụ: Hoàn thiện 100% logic bàn cờ và hệ thống tính điểm, có thể chơi thử bản Greybox với luật chơi hoàn chỉnh.*

---

## 2. 📋 DANH SÁCH STORIES ĐƯỢC CHỌN (SPRINT BACKLOG)

| Mã Story | Tên Story | Ước lượng | Người nhận | Trạng thái |
|---|---|:---:|:---:|:---:|
| `STORY-001` | Khởi tạo Structs bàn cờ | 30p | Dev 1 | READY |
| `STORY-002` | Thuật toán quét 3 ô thẳng hàng | 45p | Dev 1 | READY |
| `STORY-003` | Logic hoán đổi ô (Swap) | 30p | Dev 1 | READY |
| `STORY-004` | Gạch rơi bù chỗ trống (Cascade) | 45p | Dev 1 | READY |
| `STORY-005` | Score & Combo Multiplier Engine | 30p | Dev 1 | READY |

**Tổng thời lượng ước tính**: ~3.0 giờ code thực tế (chia thành 5 bite-sized tasks).

---

## 3. 🛡️ QUY TRÌNH THỰC THI BẮT BUỘC TRONG SPRINT (TDD PROTOCOL)
Mỗi Story trong Sprint phải đi qua 5 bước nghiêm ngặt:
1. `Pick Story` $\rightarrow$ Đọc AC và DoR.
2. `Write Test` $\rightarrow$ Viết Unit Test trước (Test báo đỏ Fail).
3. `Implement Code` $\rightarrow$ Viết code tính năng để Test chuyển sang xanh (Pass).
4. `Refactor & Clean` $\rightarrow$ Tối ưu code theo `control-manifest.md`.
5. `Close Story` $\rightarrow$ Đạt Definition of Done (DoD).

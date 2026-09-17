# BIÊN BẢN NGHIỆM THU GATE G5 (RELEASE CANDIDATE - RC SIGNOFF)
*Dự án: [Tên Dự Án] | Codename: [game-slug] | Ngày nghiệm thu: YYYY-MM-DD*

---

## 1. 🚦 KẾT QUẢ NGHIỆM THU TỔNG THỂ GATE G5

Quyết định khóa chất lượng: **[ CHÍNH THỨC PHÊ DUYỆT BẢN BUILD RC (GO TO RELEASE) / TẠM DỪNG FIX BUG (HOLD) ]**

---

## 2. 📋 CHECKLIST BẮT BUỘC ĐỂ ĐẠT CHUẨN RELEASE CANDIDATE

| STT | Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Kết quả |
|:---:|---|---|:---:|
| 1 | **Sprint Backlog Complete** | 100% các Stories trong Sprint đều ở trạng thái **DONE** và có Unit Test pass? | [x] ĐẠT |
| 2 | **Performance Hardening** | Khung hình $\ge 60\text{ FPS}$, RAM $< 250\text{MB}$, Draw Calls $< 50$? | [x] ĐẠT |
| 3 | **Progression & Economy** | Đã chơi thông suốt 30-50 màn, kinh tế không lạm phát, Ads không spam? | [x] ĐẠT |
| 4 | **Smoke Test / Zero Crash** | Mở/đóng app 10 lần liên tục không crash, tải màn chơi $< 2$ giây? | [x] ĐẠT |
| 5 | **Save/Load Data Integrity** | Dữ liệu lưu an toàn khi thoát app đột ngột, mã hóa chống sửa điểm hoạt động tốt? | [x] ĐẠT |
| 6 | **Ads & IAP Verification** | Callback xem Ads trả đúng quà; Mua IAP No-Ads tắt vĩnh viễn quảng cáo? | [x] ĐẠT |

---

## 3. ✍️ CHỮ KÝ BÀN GIAO SANG PHASE 6 (RELEASE & LIVEOPS)

- **Lead QA / Tester**: [Ký tên / Đã test đạt 100%]
- **Lead Developer**: [Ký tên / Khóa mã nguồn]
- **Product Owner / Producer**: [Ký tên / Phê duyệt xuất bản]

> **Lệnh kích hoạt tiếp theo**: Bản build Release Candidate đã được khóa chất lượng an toàn. Kích hoạt **Phase 6: Release & LiveOps** với lệnh `/release-checklist` để chuẩn bị xuất bản lên Store / Web!

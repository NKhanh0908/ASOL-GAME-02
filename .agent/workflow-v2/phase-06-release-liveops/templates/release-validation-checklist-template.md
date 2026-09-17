# [Tên Dự Án] — Store Release Validation Checklist
*Bộ 7 Tiêu Chuẩn Xuất Xưởng Bắt Buộc Trước Khi Phát Hành — ASOL Game OS Ver 2.0*
*Nền tảng phát hành: [Google Play / App Store / WebGL / Telegram Mini Apps] | Phiên bản: 1.0.0 (Build 1)*

---

## 1. 🚦 KẾT QUẢ KIỂM DUYỆT XUẤT XƯỞNG (GO / NO-GO VERDICT)

Trạng thái quyết định: **[ CHÍNH THỨC PHÁT HÀNH (GO) / TẠM DỪNG (NO-GO) ]**

*Quy tắc: Chỉ bấm nút GO khi 100% các mục bên dưới đều được tích dấu [x] ĐẠT.*

---

## 2. 📋 BỘ 7 TIÊU CHUẨN XUẤT XƯỞNG BẮT BUỘC (THE 7 CRITICAL GATES)

| STT | Tiêu chuẩn kiểm tra | Ngưỡng đạt chuẩn (Threshold) | Kết quả thực tế | Đánh giá |
|:---:|---|---|---|:---:|
| **1** | **Tỉ lệ Crash (Crash Rate)** | $< 1\%$ tổng số phiên chơi trên thiết bị test | 0 crash / 50 phiên | [x] ĐẠT |
| **2** | **Hiệu năng & Khung hình** | $\ge 60\text{ FPS}$ ổn định, không giật lag khi ăn combo | 59.8 FPS | [x] ĐẠT |
| **3** | **Tính toàn vẹn Save Data** | Thoát app/tắt trình duyệt mở lại không mất Vàng, Level | Test 10 lần nguyên vẹn | [x] ĐẠT |
| **4** | **Quảng cáo & Thanh toán** | Ads Rewarded trả đúng quà; Interstitial giãn cách $\ge 45\text{s}$; IAP No-Ads tắt quảng cáo vĩnh viễn | Đã test Production mode | [x] ĐẠT |
| **5** | **Bảo mật & Mã nguồn** | Bản build Release đã tắt toàn bộ `Debug.Log`, mã hóa Save Data, ký chữ ký số (Release Keystore) | Keystore Verified | [x] ĐẠT |
| **6** | **Tài sản Store & ASO** | Đầy đủ Icon $512\times 512$, Feature Graphic $1024\times 500$, 4-8 Screenshots, Video Preview | Đã upload Store Draft | [x] ĐẠT |
| **7** | **Pháp lý & Quyền riêng tư** | URL Chính sách Quyền riêng tư (Privacy Policy), Khai báo độ tuổi (Content Rating) & COPPA | URL Live Verified | [x] ĐẠT |

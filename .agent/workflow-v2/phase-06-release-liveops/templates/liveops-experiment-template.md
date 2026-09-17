# EXP-[NNN]: [Tên Thử Nghiệm LiveOps / A/B Test]
*Vòng Lặp Vận Hành O-A-H-D-I-T-R-O — ASOL Game OS Ver 2.0*
*Ngày khởi chạy: YYYY-MM-DD | Chỉ số mục tiêu: [D1 Retention / Rewarded Ads CTR / IAP Conversion]*

---

## 1. 👁️ OBSERVE & ANALYZE (QUAN SÁT & PHÂN TÍCH DỮ LIỆU THỰC TẾ)
- **Quan sát số liệu**: Dữ liệu Analytics tuần đầu cho thấy chỉ số giữ chân ngày đầu (D1 Retention) chỉ đạt $22\%$ (ngưỡng an toàn kỳ vọng là $\ge 35\%$).
- **Phân tích phễu người chơi (Funnel Analysis)**: Có tới $55\%$ người chơi mới thoát game ngay tại màn chơi Hướng dẫn (Tutorial màn 1-3).

---

## 2. 💡 HYPOTHESIZE (GIẢ THUYẾT CẢI TIẾN)
> *"Nếu chúng ta cắt giảm 50% số chữ giải thích trong Tutorial, cho người chơi tự tay chạm và ăn combo ngay ở giây thứ 5, thì tỉ lệ hoàn thành Tutorial sẽ tăng lên >85% và kéo theo D1 Retention tăng lên >32%."*

---

## 3. 🎨 DESIGN & IMPLEMENT (THIẾT KẾ & LẬP TRÌNH A/B TEST)
- **Biến thể A (Control - Bản cũ)**: Tutorial cũ với 4 hộp thoại chữ giải thích.
- **Biến thể B (Variant - Bản mới)**: Tutorial mới chỉ có bàn tay hoạt họa chỉ điểm, người chơi chạm ăn điểm ngay.
- **Tỉ lệ phân phối**: $50\%$ người chơi mới nhận bản A, $50\%$ nhận bản B.

---

## 4. 🧪 TEST & RELEASE (KẾT QUẢ KIỂM CHỨNG SAU 7 NGÀY)

| Nhóm thử nghiệm | Số người chơi mới | Tỉ lệ hoàn thành Tutorial | D1 Retention | Quyết định |
|---|:---:|:---:|:---:|:---:|
| **Nhóm A (Bản cũ)** | 1,000 | $45.2\%$ | $21.8\%$ | Bác bỏ ❌ |
| **Nhóm B (Bản mới)** | 1,000 | **$88.6\%$** | **$34.5\%$** | **ÁP DỤNG CHÍNH THỨC (WIN) ✅** |

---

## 5. 🔄 ROLLOUT (ÁP DỤNG TOÀN BỘ)
- Phát hành bản cập nhật v1.1.0 áp dụng 100% Tutorial mới cho toàn bộ người chơi.
- Đóng thử nghiệm `EXP-001`.

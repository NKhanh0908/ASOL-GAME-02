# Ghi chú ý tưởng: vùng giao của các mảnh cùng màu

*Ngày ghi: 2026-09-30 · Trạng thái: lưu quyết định nhiều màu cho giai đoạn sau MVP*

## Quy tắc đã được Product Owner nêu

- Xét từng vùng giao trên bàn chơi.
- Hai mảnh **cùng màu** phủ lên một vùng làm vùng đó trở nên trong suốt.
- Khi một mảnh cùng màu tiếp tục phủ lên vùng đang trong suốt đó, vùng lại được tô màu. Những lần phủ tiếp theo tiếp tục đổi giữa có màu và trong suốt.
- Điều kiện cùng màu là thiết yếu: không mặc định rằng hai mảnh khác màu cũng triệt tiêu nhau.

| Số mảnh cùng màu phủ một vùng | Kết quả của màu đó |
|---:|---|
| 0 | Không có |
| 1 | Hiện màu |
| 2 | Trong suốt |
| 3 | Hiện màu trở lại |

## Chưa quyết định

- Khi **hai màu khác nhau** giao nhau, vùng giao sẽ pha thành màu mới hay hiện màu của mảnh nằm trên cùng? Hai cách này đã được nêu ra nhưng chưa chọn một cách.
- Nếu một vùng có nhiều màu và một màu bị triệt tiêu, cần chốt màu còn lại được hiển thị ra sao.
- Cần chốt điều kiện thắng của các màn nhiều màu sẽ so cả màu hay chỉ so hình bóng.

## Quan hệ với tài liệu hiện tại

[GDD MVP](../superpowers/specs/2026-09-21-mirror-mvp-gdd.md) áp dụng quy tắc vùng giao cùng màu trong campaign một màu và vẫn thắng theo silhouette. Product Owner đã đặt cơ chế giao nhau giữa các màu khác nhau ở **giai đoạn sau MVP**. Ghi chú này giữ các quyết định còn mở cho giai đoạn đó; nó chưa là yêu cầu triển khai hoặc bằng chứng kiểm chứng gameplay.

# Mirror — Idea Sheet
*Ngày khởi tạo: 2026-09-17 | Người đề xuất: Product Owner | Trạng thái: Bản nháp; kế hoạch prototype đề xuất để kiểm chứng*

---

## 1. Ý tưởng cốt lõi

- **Elevator pitch:** Game puzzle casual màn hình dọc: kéo, thả và về sau xoay những mảnh kính màu để tạo đúng hình mẫu. Vùng chồng số lớp chẵn trở nên trong suốt, số lớp lẻ hiển thị trở lại; những màn cuối thêm bài toán đổi màu một tia sáng đi xuyên qua kính.
- **Trải nghiệm mong muốn:** Giải đố thư giãn, quan sát hình biến đổi khi thử các cách xếp, rồi thỏa mãn khi silhouette khớp hoàn toàn.
- **Tên dự án:** Mirror. Tên không thay đổi bản chất mảnh ghép là kính màu; chưa đánh giá tính sẵn có của tên cho phát hành.

## 2. Hành động cốt lõi và luật chơi

- **Primary core verb:** Kéo và thả mảnh kính để ghép hình.
- **Secondary verbs:** Xoay mảnh (từ Chương 3), hoàn tác, đặt lại màn, xem gợi ý.
- **Đặt mảnh:** Người chơi kéo tự do; mảnh hút nhẹ vào điểm neo ẩn khi thả gần vị trí hợp lệ. Mảnh giữ nguyên kích thước. Trước Chương 3, hướng của mảnh cố định.
- **Quy luật chồng lớp:** Tại mỗi vùng, 1/3/5… lớp hiển thị; 2/4/6… lớp trong suốt. Khi vùng hiển thị có nhiều lớp, màu nhìn thấy là màu của mảnh trên cùng. Vùng chẵn không đóng góp vào hình kết quả.
- **Điều kiện thắng cơ bản:** Silhouette cuối cùng phải khớp chính xác hình mẫu, không thiếu và không thừa vùng nhìn thấy. Hình mẫu có thumbnail cố định ở góc bàn và một lớp silhouette mờ trên bàn có thể bật/tắt.
- **Ánh sáng:** Chỉ xuất hiện ở Chương 5. Mỗi màn có một nguồn sáng và cảm biến cố định; nguồn có thể ở một trong hai phía. Tia đi thẳng, không phản xạ/đổi hướng. Tia bắt đầu ở trạng thái trung tính (hiển thị trắng), nhận màu khi đi qua các vùng kính đang hiển thị; vùng chồng chẵn không đổi màu tia. Thắng màn ánh sáng đòi hỏi cả silhouette đúng và màu tia đến cảm biến đúng.
- **Bảng màu kiểm chứng:** Màu gốc đỏ, vàng, xanh lam; đỏ + vàng = cam, vàng + xanh lam = xanh lục, đỏ + xanh lam = tím. Đây là quy ước gameplay đơn giản, không mô phỏng quang học thật. Chưa dùng tổ hợp cả ba màu.

### Light MDA

- **Mechanics:** Kéo/thả, điểm neo ẩn, lớp chồng chẵn/lẻ, xoay mảnh, pha màu tia sáng theo bảng cố định.
- **Dynamics:** Thử vị trí và thứ tự chồng, dự đoán vùng nào xuất hiện/biến mất, rồi tối ưu số thao tác.
- **Aesthetics:** Thư giãn, rõ ràng, hiện đại; tạo khoảnh khắc “à ha” khi hình mẫu hoặc màu cảm biến được giải đúng.

## 3. Đối tượng và nền tảng

- **Nền tảng mục tiêu:** Mobile, màn hình dọc, chơi offline. Làm và thử prototype trên Android trước; iOS và hệ điều hành phát hành chính thức để quyết định sau. Đề xuất engine và cách triển khai ở [`technical-assessment.md`](technical-assessment.md).
- **Người chơi mục tiêu:** Người thích puzzle casual không áp lực thời gian. Độ tuổi và thời lượng một màn là giả định cần kiểm chứng, chưa có dữ liệu người dùng.
- **Bố cục:** Ưu tiên khoảng 65% chiều cao cho bàn ghép; khay mảnh cuộn ngang ở dưới. Thumbnail “MẪU” ở góc trên của bàn, silhouette mờ trên bàn có thể bật/tắt; không dùng panel mẫu riêng làm chật vùng chơi. Các thành phần ánh sáng nằm trong bàn ghép.
- **Phong cách:** Mảnh kính đơn sắc, trong suốt nhẹ, viền rõ, hiện đại và dễ đọc trên màn hình nhỏ. Không cần hiệu ứng khúc xạ hay trang trí cầu kỳ ở bản kiểm chứng.

## 4. Điểm độc nhất và phạm vi sản phẩm dự kiến

- **USP:** Ghép đúng hình bằng cách chủ động làm vùng giao biến mất/hiện lại qua số lớp kính chẵn/lẻ, thay vì chỉ lấp đầy khoảng trống như puzzle ghép hình thông thường.
- **Quy mô sản phẩm dự kiến sau kiểm chứng:** 30 màn thiết kế thủ công, chia 5 chương. Đây là hướng phát triển dài hạn, không phải khối lượng của prototype đầu tiên:

| Chương | Số màn | Mục tiêu học |
|---|---:|---|
| 1 | 6 | Kéo–thả, điểm neo ẩn, khớp silhouette |
| 2 | 6 | Chồng lớp theo quy luật chẵn/lẻ |
| 3 | 12 | Xoay mảnh và kết hợp với hai cơ chế trước |
| 4 | 3 | Làm quen các mảnh kính nhiều màu khi ghép hình; chưa pha màu tia sáng |
| 5 | 3 | Một tia sáng, bảng pha màu và cảm biến cố định |

- **Trải nghiệm dự kiến:** Không giới hạn thời gian hay lượt. Hoàn thành đúng thì qua màn. Chấm 1–3 sao theo số thao tác và gợi ý ba cấp là ý tưởng cho giai đoạn sau; chưa cần để kiểm chứng cơ chế chính.
- **Ngoài phạm vi hiện tại:** Quảng cáo, mua hàng trong ứng dụng, bảng xếp hạng, tài khoản/cloud save, màn tự sinh, nhiều nguồn sáng cùng lúc, phản xạ hoặc đổi hướng tia, thay đổi kích thước mảnh.

## 5. Kế hoạch prototype kiểm chứng (đề xuất)

**Mục đích:** Kiểm tra liệu người mới hiểu thao tác kéo–thả, nhìn ra quy luật chồng chẵn/lẻ và thấy việc dùng quy luật đó để tạo silhouette đủ thú vị để tiếp tục phát triển. Prototype phục vụ playtest, chưa phải bản phát hành.

**Nguồn lực và giới hạn:** Một người tự thiết kế màn, làm đồ họa đơn giản và vibe code. Dự kiến 1–2 tuần làm việc, cần đo lại sau khi có bản chạy đầu tiên. Dựng bản chạy trên điện thoại Android màn hình dọc trước; chọn engine theo đánh giá kỹ thuật và mức quen tay của người làm. Không đặt mục tiêu chạy cả Android lẫn iOS ở đợt đầu.

**Quy mô:** 6 màn thủ công, gồm 3 màn Chương 1 và 3 màn Chương 2. Nếu hết thời gian, mốc tối thiểu để đánh giá kỹ thuật là 3 màn (2 màn Chương 1, 1 màn Chương 2); mốc này **chưa đủ** để kết luận về nhịp học và độ thú vị của quy luật chẵn/lẻ.

| Màn | Vai trò kiểm chứng | Nội dung chính |
|---|---|---|
| 1-1 | Người chơi nhận ra kéo–thả và điểm hút | Một mảnh, một vị trí đúng, phản hồi rõ khi thả gần điểm neo. |
| 1-2 | Hiểu ghép đúng silhouette | Hai mảnh không chồng; cần đặt đủ, không thừa vùng. |
| 1-3 | Tự áp dụng thao tác đã học | Hai hoặc ba mảnh không chồng; không thêm luật mới. |
| 2-1 | Nhận ra hai lớp làm vùng giao biến mất | Hai mảnh chồng có chủ đích; mục tiêu buộc dùng vùng trong suốt. |
| 2-2 | Nhận ra lớp thứ ba làm vùng giao hiện lại | Ba mảnh, có vùng giao ba lớp; phản hồi trực quan khi thả mảnh cuối. |
| 2-3 | Kiểm tra người chơi tự dùng quy luật | Kết hợp vùng chồng chẵn và lẻ để khớp hình; không chỉ lặp lại lời hướng dẫn. |

**Có trong prototype:** Kéo–thả bằng chạm, điểm neo ẩn và hút nhẹ, mảnh cố định hướng/kích thước, hiển thị vùng chồng theo chẵn/lẻ, thumbnail mẫu, silhouette mờ có thể bật/tắt, báo đúng/sai và chuyển màn, nút đặt lại màn. Dùng hình khối và màu phẳng; màn và nghiệm thiết kế thủ công. Kiểm tra thắng dựa trên vùng hình sau khi áp quy luật chồng, không chỉ kiểm tra mảnh nằm đúng tọa độ.

**Để sau prototype:** Xoay, ánh sáng/pha màu, Chương 3–5, 24 màn còn lại, gợi ý nhiều cấp, sao, hoàn tác, lưu tiến độ, âm thanh và hiệu ứng hoàn thiện. Nếu người thử mắc kẹt, trước hết ghi nhận chỗ vướng thay vì thêm gợi ý tự động vào bản đo đầu tiên.

**Trình tự làm cho một người:**

1. **Ngày 1–2:** Chốt công cụ và kích thước màn thử; dựng bàn, khay mảnh, kéo–thả và điểm neo. Màn 1-1 chạy được trên thiết bị mục tiêu.
2. **Ngày 3–5:** Làm luật chồng chẵn/lẻ và kiểm tra silhouette; hoàn thành 1-2, 1-3, 2-1. Kiểm tra bằng vài bố cục cố ý đúng và sai.
3. **Ngày 6–8:** Hoàn thành 2-2, 2-3, phản hồi thả mảnh/thắng màn và nút đặt lại; tự chơi liền 6 màn trên điện thoại nhỏ.
4. **Ngày 9–10 (nếu có):** Cho ít nhất 5 người chưa biết luật chơi thử, quan sát và ghi lại kết quả; sửa lỗi cản trở thao tác rồi quyết định bước tiếp theo. Mốc ngày là ước lượng, không phải cam kết tiến độ.

**Cách kiểm chứng:** Đưa máy ở màn 1-1, chỉ nói “hãy thử chơi”, không giải thích luật trước. Ghi người chơi có bắt đầu kéo mảnh trong khoảng 3 giây hay không; đây là tín hiệu về độ rõ thao tác, không phải điều kiện bắt buộc từng người phải đạt. Ở Chương 2, ghi người chơi có tự giải thích được vùng 2 lớp biến mất và 3 lớp hiện lại, có hoàn thành 2-3 mà không được nhắc luật, nơi họ dừng/đặt sai, và cảm nhận về sự thú vị. **Ngưỡng đề xuất để xem xét tiếp:** ít nhất 4/5 người bắt đầu thao tác không cần hướng dẫn và ít nhất 3/5 người tự nêu đúng quy luật rồi hoàn thành 2-3; đồng thời không còn lỗi chạm/hiển thị ngăn hoàn thành màn. Đây là mục tiêu thử nghiệm, chưa phải dữ liệu người dùng hay điều kiện tự động để Gate PASS. Nếu không đạt, sửa cách giới thiệu/hiển thị rồi thử lại trước khi tăng số màn.

## 6. Rủi ro và câu hỏi mở

- **Rủi ro gameplay:** Khi hai mảnh chồng, vùng giao biến mất dù cả hai mảnh vẫn nằm trên bàn; người mới có thể tưởng mình thả sai hoặc hình bị lỗi. Khi thêm mảnh thứ ba, vùng giao hiện lại; người chơi có thể giải được bằng thử ngẫu nhiên mà chưa hiểu quy luật. Quan sát ở 2-1 đến 2-3 xem họ có tự nói được “2 lớp mất, 3 lớp hiện” và áp dụng ở một hình khác; nếu không, điều chỉnh phản hồi thị giác hoặc nhịp dạy luật trước khi thêm màn. Đây là rủi ro *mức hiểu và cảm giác chơi*, khác với rủi ro kỹ thuật tính vùng giao.
- **Rủi ro giao diện:** Thumbnail, khay mảnh và vùng chạm phải thoải mái trên điện thoại nhỏ. Wireframe hiện chỉ là minh họa, chưa kiểm tra trên thiết bị.
- **Rủi ro kỹ thuật/sản xuất:** Tính vùng giao và so silhouette có thể tốn hơn dự kiến; nếu hết thời gian, giữ hình khối đơn giản và giảm trang trí trước khi giảm các màn kiểm chứng cốt lõi. Thứ tự lớp ảnh hưởng màu hiển thị nhưng không đổi quy luật chẵn/lẻ.
- **Chưa quyết định:** Engine được đề xuất tạm thời trong `technical-assessment.md`, cần đối chiếu mức quen tay và dựng thử trên máy Android thật. Chưa chốt mẫu máy thử, thời lượng mục tiêu mỗi màn và tên phát hành chính thức. Ngưỡng sao để dành cho giai đoạn sau.
- **Bước tiếp theo:** Dựng prototype 6 màn, playtest và ghi kết quả; có thể nghiên cứu thị trường/đối thủ ở Step 1.2 song song trước khi lập Concept Brief/Gate G1 chính thức.

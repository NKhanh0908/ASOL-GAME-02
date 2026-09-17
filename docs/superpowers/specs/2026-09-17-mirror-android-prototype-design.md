# Mirror — Thiết kế prototype Android sáu màn

*Ngày: 2026-09-17 | Trạng thái: Thiết kế đã được thống nhất trong cuộc trò chuyện; chờ duyệt bản ghi trước khi lập kế hoạch triển khai*

## 1. Mục tiêu và giới hạn

Prototype kiểm chứng thao tác kéo–thả, điểm hút ẩn, quy luật vùng chồng chẵn biến mất/lẻ hiện lại và cảm giác giải đố. Một người làm trong khoảng 1–2 tuần; thời gian là ước lượng chưa đo. Bản thử chạy offline trên Android màn hình dọc. Phạm vi là 6 màn thủ công: 3 màn Chương 1 và 3 màn Chương 2. Quy tắc gameplay lấy từ [`idea-sheet.md`](../../concept/idea-sheet.md); đánh giá công nghệ từ [`technical-assessment.md`](../../concept/technical-assessment.md).

Chưa làm Chương 3–5, xoay mảnh, tia sáng, hệ sao, gợi ý, lưu tiến độ, quảng cáo, tài khoản hoặc hệ thống chọn màn. Bản chơi mở thẳng vào 1-1. Khi hoàn thành, người chơi bấm **Màn tiếp**; hoàn thành 2-3 thì thấy thông báo kết thúc bản thử và nút chơi lại từ 1-1. Đặt lại chỉ tác động màn hiện tại.

## 2. Công nghệ và ranh giới thành phần

| Thành phần | Trách nhiệm | Phụ thuộc |
|---|---|---|
| Phaser Scene | Nhận chạm/kéo, hiển thị bàn/khay/mảnh, nút mẫu/đặt lại, phản hồi và chuyển màn | Dữ liệu màn, trạng thái chơi, bộ tính hình |
| Dữ liệu màn TypeScript | Sáu màn với kích thước bàn, mặt nạ mảnh, màu, vị trí khởi đầu, điểm neo hợp lệ và mặt nạ mẫu | Không phụ thuộc Phaser |
| Bộ tính hình TypeScript | Đếm lớp phủ và so silhouette trên lưới logic | Dữ liệu màn và vị trí mảnh, không phụ thuộc Phaser |
| Capacitor Android | Đóng gói web bundle thành ứng dụng thử trên Android | Bản build Vite/Phaser |

Chọn Phaser + TypeScript + Vite, dùng Phaser Graphics cho hình đơn giản, không cần React/Ionic hay plugin native. Capacitor được thêm để thử trên Android, không tham gia tính gameplay. Đây là game web chạy trong Android WebView; không có máy chủ hay tài nguyên tải từ mạng trong lúc chơi.

## 3. Hình, dữ liệu và luật thắng

Mảnh kính của prototype là tập ô trên cùng một lưới logic của bàn, với cạnh theo lưới. Bắt đầu với lưới 128 × 192 ô; chỉ đổi độ phân giải nếu thử trên điện thoại cho thấy viền quá thô hoặc chi phí tính hình quá cao. Mỗi mảnh giữ nguyên kích thước và hướng. Mỗi màn định nghĩa sẵn các điểm neo hợp lệ cho từng mảnh. Người chơi kéo tự do trong lúc tương tác; khi thả, chọn neo hợp lệ gần điểm gốc mảnh nhất trong bán kính hút 48 đơn vị trên mặt phẳng game thiết kế rộng 720 đơn vị. Nếu không có neo trong bán kính này, mảnh trở về vị trí trước khi kéo (hoặc khay nếu chưa đặt). Mảnh đã đặt có thể kéo lại. Bán kính hút được hiệu chỉnh qua thử máy; nó không làm đổi ô logic của một vị trí đã hút.

Sau mỗi lần đặt hoặc kéo lại, bộ tính hình dựng mặt nạ kết quả: tại mỗi ô đếm số mảnh phủ; số chẵn, kể cả 0, là ô rỗng; số lẻ là ô hiện, với màu mảnh ở trên cùng. Màu chỉ phục vụ hiển thị trong sáu màn đầu. Thắng khi toàn bộ mặt nạ ô hiện bằng mặt nạ silhouette mẫu, không có ô thiếu hay thừa. Không chấm thắng bằng cách so danh sách điểm neo với một đáp án duy nhất; các cách xếp khác nhau tạo cùng hình đều được chấp nhận.

Phaser hiển thị từ cùng mặt nạ kết quả và cùng hệ tọa độ bàn mà bộ tính hình dùng. Mảnh vẫn có viền riêng để người chơi thấy các mảnh đã đặt, kể cả khi vùng giao của chúng đang rỗng. Khi thả mảnh, vùng đổi trạng thái có phản hồi thị giác ngắn, đủ để nhận ra vùng giao 2 lớp mất và vùng 3 lớp hiện lại. Bóng silhouette mẫu bật/tắt được; thumbnail mẫu luôn hiện. Cỡ lưới và cách vẽ viền được chốt bằng thử trên điện thoại để hình nhìn thấy khớp các ô được chấm.

## 4. Luồng người chơi và nội dung sáu màn

1. **1-1:** Một mảnh, một neo. Người chơi khám phá kéo–thả và điểm hút.
2. **1-2:** Hai mảnh không chồng. Người chơi ghép đủ silhouette, không tạo vùng thừa.
3. **1-3:** Hai hoặc ba mảnh không chồng. Người chơi tự làm lại thao tác không có luật mới.
4. **2-1:** Hai mảnh có vùng giao bắt buộc; vùng 2 lớp biến mất để tạo hình mẫu.
5. **2-2:** Ba mảnh có vùng giao 3 lớp; vùng đó hiện lại.
6. **2-3:** Hình mẫu buộc dùng cả vùng chồng chẵn và lẻ. Không nhắc lại lời giải trước khi người chơi thử.

Game mở vào 1-1. Trong mỗi màn, người chơi xem thumbnail, kéo mảnh từ khay hoặc trên bàn, có thể bật/tắt bóng mẫu và đặt lại. Thả xa neo không làm mất mảnh hoặc làm thay đổi kết quả. Sau khi thắng, khóa kéo mảnh, giữ kết quả trên bàn và hiện nút **Màn tiếp** để người chơi xem điều vừa xảy ra. Không có giới hạn thời gian hay lượt.

## 5. Xử lý tình huống và kiểm chứng

- **Chạm bị hủy hoặc mất focus:** Trả mảnh đang kéo về vị trí trước khi kéo; không cập nhật mặt nạ.
- **Thả ngoài vùng hút:** Trả về vị trí cũ/khay, giữ trạng thái thắng hiện có.
- **Đặt lại:** Đưa mọi mảnh về trạng thái đầu của màn, xóa trạng thái thắng và dựng lại mặt nạ; không chuyển màn.
- **Màn hình khác tỷ lệ:** Bàn và khay co theo chiều dọc, vẫn giữ hệ tọa độ lưới riêng; kiểm tra vùng chạm trên ít nhất một điện thoại Android thật. Khóa giao diện ở chiều dọc trong bản thử.
- **Không khớp hình:** Không báo thắng; người chơi vẫn có thể di chuyển mọi mảnh và dùng Đặt lại. Không thêm gợi ý tự động trong lần playtest đầu.

Kiểm tra logic bằng các bố cục có 0/1/2/3 lớp, vùng thiếu/thừa và hai cách xếp cho cùng silhouette. Kiểm tra tương tác bằng kéo từ khay, kéo lại mảnh đã đặt, thả gần/xa neo, chạm bị hủy, Đặt lại và chuyển màn. Trong ngày 1–2 phải có bản chạy Android với chạm cơ bản; trong ngày 3–5 phải thử được chồng 2/3 lớp và so hình đúng/sai. Đây là mốc thử kỹ thuật, không phải bằng chứng đã hoàn thành.

Playtest ít nhất 5 người chưa biết luật, không giải thích trước màn 1-1. Ghi thời điểm bắt đầu kéo, lời giải thích tự nhiên của người chơi về vùng 2/3 lớp, khả năng hoàn thành 2-3 mà không nhắc luật, chỗ mắc kẹt và cảm nhận thú vị. Ngưỡng đề xuất từ idea-sheet là 4/5 người bắt đầu không cần hướng dẫn và 3/5 người nêu đúng luật rồi giải 2-3; kết quả thật mới dùng để quyết định sửa cách dạy, tăng màn hay dừng. Product Owner quyết định Gate, không tự động PASS theo số liệu.

## 6. Rủi ro và tiêu chí xem lại thiết kế

Rủi ro gameplay chính là người chơi hiểu nhầm vùng giao biến mất thành lỗi đặt mảnh hoặc giải bằng thử ngẫu nhiên mà không hiểu luật. Nếu playtest gặp tình huống này, ưu tiên sửa phản hồi vùng giao và nhịp màn 2-1/2-2 trước khi tăng số màn.

Rủi ro kỹ thuật chính là mặt nạ logic lệch hình vẽ hoặc viền lưới quá thô trên máy Android. Nếu thấy lệch, dùng lại một nguồn tọa độ cho hình và chấm thắng, tăng độ phân giải lưới hoặc đánh giá phép toán polygon. Nếu WebView cho cảm giác kéo không ổn trên máy thử sau khi đã chỉnh vùng chạm và tỷ lệ, xem lại cách input/renderer hoặc cân nhắc engine khác. Chưa có benchmark hiệu năng hay dung lượng APK; không xem lựa chọn công nghệ là đã được xác nhận cho bản phát hành.

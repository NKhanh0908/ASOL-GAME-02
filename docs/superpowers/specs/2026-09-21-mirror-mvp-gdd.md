# Mirror — Game Design Document (MVP)

*Ngày: 2026-09-21 | Trạng thái: Đã duyệt phạm vi; sẵn sàng lập kế hoạch triển khai*

## 1. Authority và mục tiêu

Mirror là game giải đố casual theo màn, chơi dọc trên Android và hoạt động offline. Người chơi kéo, thả và về sau xoay các mảnh kính để tạo silhouette mục tiêu. Điểm khác biệt của game là vùng bị phủ bởi số lớp chẵn biến mất, còn số lớp lẻ hiện lại.

Product Owner đã xác nhận core game là **“ok, thú vị”** sau giai đoạn kiểm chứng. Dữ liệu định lượng của đợt kiểm chứng không được lưu trong repository; GDD này ghi nhận quyết định tiếp tục phát triển, không suy diễn tỷ lệ hoặc thời lượng playtest.

Mục tiêu của MVP là phát hành một campaign ngắn nhưng hoàn chỉnh, đủ để người chơi học và vận dụng ba cơ chế chính. Bản phát hành miễn phí, không quảng cáo và không mua hàng trong ứng dụng.

### Nguồn và quyết định kế thừa

- Luật core, phong cách và prototype: `docs/concept/idea-sheet.md`.
- Kiến trúc/prototype đã có: Phaser, TypeScript, Vite và Capacitor Android.
- Bằng chứng kỹ thuật hiện hữu: sáu màn prototype, level editor, unit test, web/Android build được ghi trong `docs/testing/` và `CHANGELOG.md`.
- Các quyết định trong tài liệu này thay thế phạm vi sản phẩm 30 màn/5 chương đã là định hướng sau kiểm chứng trong idea sheet.

## 2. Người chơi và trải nghiệm mục tiêu

**Người chơi mục tiêu:** người thích puzzle casual, thích thử nghiệm trực quan và không muốn bị áp lực thời gian hoặc lượt đi.

**Cảm giác cần tạo ra:** thư giãn, rõ ràng và có khoảnh khắc “à ha” khi người chơi nhận ra cách tạo vùng rỗng/vùng hiện bằng chồng lớp, hoặc xoay đúng mảnh để silhouette khớp.

**Nguyên tắc trải nghiệm:**

- Không có giới hạn thời gian, lượt đi, điểm số hay hình phạt.
- Bóng mục tiêu luôn đủ thấy nhưng không vẽ sẵn ranh giới từng mảnh.
- Sai lầm phải đảo ngược dễ dàng: kéo lại, trả mảnh xuống khay hoặc đặt lại màn.
- Thử nghiệm là hành vi chính; game phản hồi ngay bằng hình ảnh thay vì giải thích dài.

## 3. Vòng lặp chơi

1. Người chơi chọn một màn đã mở trong menu campaign.
2. Quan sát bóng silhouette mục tiêu và các mảnh trong khay.
3. Kéo mảnh lên bàn; mảnh snap vào neo hợp lệ khi thả gần.
4. Quan sát silhouette thay đổi, điều chỉnh vị trí hoặc từ Chương 3 xoay mảnh.
5. Khi silhouette khớp 100%, màn thắng, bàn khóa và mở nút **Màn tiếp**.
6. Hoàn thành màn sẽ mở màn kế tiếp và tự lưu tiến độ cục bộ.

Một mảnh thả xa neo được giữ tại vị trí tạm để người chơi tiếp tục thử, nhưng không được tính vào silhouette thắng. Kéo mảnh xuống khay là thao tác gỡ chủ động. Hủy chạm hoặc mất focus khôi phục trạng thái trước kéo.

## 4. Luật chơi

### 4.1 Kéo, thả và snap

- Mảnh giữ nguyên kích thước.
- Mỗi mảnh có các neo hợp lệ do tác giả màn đặt trước.
- Thả trong bán kính snap của một neo sẽ đặt mảnh vào neo gần nhất; snap không đồng nghĩa màn đã đúng.
- Người chơi có thể kéo lại một mảnh đã đặt.
- Nút **Đặt lại** đưa mọi mảnh của màn về trạng thái ban đầu.

### 4.2 Silhouette chẵn/lẻ

Tại mỗi vùng của bàn, hệ thống đếm số mảnh phủ lên vùng đó:

- 0, 2, 4… lớp: vùng rỗng/không hiện.
- 1, 3, 5… lớp: vùng hiện trong silhouette.

Màn thắng khi mặt nạ silhouette kết quả trùng hoàn toàn mặt nạ mục tiêu: không thiếu và không thừa vùng nhìn thấy. Việc thắng dựa trên kết quả hình, không dựa trên một danh sách neo hoặc thứ tự đặt duy nhất.

### 4.3 Xoay mảnh

Từ Chương 3, người chơi chạm để chọn mảnh rồi dùng nút **Xoay**. Mỗi lần bấm xoay mảnh 90°; không dùng cử chỉ xoay để tránh thao tác nhầm trên màn hình cảm ứng. Phép xoay phải cập nhật chính xác vùng phủ, neo hợp lệ và kiểm tra silhouette.

## 5. Campaign MVP: 18 màn

| Chương | Số màn | Mục tiêu học | Nhịp độ |
|---|---:|---|---|
| 1. Khởi động | 6 | Kéo–thả, snap, đọc bóng mục tiêu, đặt lại và hình cơ bản | Giới thiệu rồi cho người chơi tự áp dụng, không gây áp lực |
| 2. Giao thoa | 6 | Chồng hai lớp để tạo rỗng; ba lớp để vùng hiện lại; silhouette rời | Từ ví dụ trực quan đến puzzle buộc suy luận quy luật chẵn/lẻ |
| 3. Xoay chuyển | 6 | Xoay 90° rồi kết hợp xoay với quy luật chẵn/lẻ | Một màn giới thiệu, các màn luyện, rồi thử thách tổng hợp |

Mỗi màn phải có lời giải hợp lệ, ít nhất một lựa chọn sai có ý nghĩa để người chơi thử, và một mục tiêu đọc được trên điện thoại dọc. Độ khó là giả thuyết thiết kế: phải xác nhận bằng playtest, không suy ra chỉ từ số mảnh hoặc số neo.

## 6. UI và luồng người chơi

### Menu campaign

- Hiển thị ba chương và các màn trong từng chương.
- Màn đầu mở sẵn; hoàn thành một màn mở màn kế tiếp.
- Hiển thị trạng thái chưa mở, đã mở và đã hoàn thành bằng hình dạng/biểu tượng cùng chữ, không chỉ dùng màu.
- Người chơi luôn có thể chơi lại màn đã hoàn thành.

### Màn chơi

- Màn hình Android dọc; khoảng 65% chiều cao dành cho bàn ghép, khay mảnh ở dưới.
- Vùng đầu hiển thị số màn/tên màn và thumbnail mẫu; bóng mục tiêu mờ nằm trực tiếp trên bàn.
- Có nút **Đặt lại** và quay về menu; từ Chương 3 có nút **Xoay** chỉ hoạt động khi mảnh được chọn.
- Mảnh đang kéo, mảnh đã snap, snap thành công và vùng chẵn/lẻ thay đổi đều cần phản hồi thị giác tức thời bằng viền/độ sáng/hình dạng; không chỉ dùng màu hay chữ.
- Khi thắng, khóa kéo mảnh, giữ kết quả trên bàn, hiển thị xác nhận ngắn và nút **Màn tiếp**. Sau màn 3-6, hiển thị hoàn thành campaign và nút chơi lại.

### Khả năng dùng

- Vùng chạm của mảnh và nút phải thoải mái trên điện thoại mục tiêu.
- Chữ và trạng thái quan trọng phải đọc được trên nền tối; màu không là dấu hiệu duy nhất.
- Không thêm gợi ý tự động trong MVP. Người chơi có các cách phục hồi rõ ràng: kéo lại, trả khay và đặt lại.

## 7. Tiến độ và dữ liệu

- Lưu cục bộ tiến độ màn mở và màn đã hoàn thành.
- Không có tài khoản, cloud save, leaderboard hoặc chia sẻ online.
- Mất/lỗi dữ liệu cục bộ không được làm game không khởi động; khi không thể khôi phục, game bắt đầu campaign mới và báo ngắn cho người chơi nếu giao diện có chỗ phù hợp.

## 8. Custom Level

Custom Level **không phải trọng tâm hay điều kiện phát hành campaign MVP**. Đây là hạng mục cuối cùng chỉ bắt đầu sau khi 18 màn campaign ổn định.

Nếu còn trong ngân sách phát triển, tính năng này được mở sau khi người chơi hoàn thành Chương 1, và chỉ hỗ trợ:

- Tạo, sửa và chơi level bằng các mảnh cố định.
- Lưu cục bộ; level có sẵn phải luôn có thể khôi phục.
- Không tài khoản, cloud save, chia sẻ online hoặc thư viện level cộng đồng.

Nếu Custom Level làm ảnh hưởng tiến độ/chất lượng campaign, nó bị cắt khỏi bản phát hành MVP mà không thay đổi phạm vi campaign.

## 9. Phạm vi kỹ thuật và phát hành

- Nền tảng phát hành: Android, khóa hướng dọc, chơi offline.
- Công nghệ kế thừa: Phaser + TypeScript + Vite; Capacitor đóng gói Android WebView.
- Web build là môi trường phát triển/kiểm tra; không phải cam kết phát hành web.
- Không bổ sung máy chủ hoặc dịch vụ bên thứ ba cho MVP.
- Tài nguyên gameplay phải được đóng gói cục bộ để app mở và chơi khi không có mạng.

## 10. Tiêu chí nghiệm thu MVP

| ID | Yêu cầu | Kiểm tra có thể quan sát |
|---|---|---|
| MVP-01 | Campaign 18 màn | Có 6 màn cho mỗi chương; tất cả có lời giải, mở khóa theo thứ tự và chơi lại được |
| MVP-02 | Luật silhouette | Bố cục 0/1/2/3 lớp cho kết quả đúng; thiếu/thừa vùng không thắng; các lời giải tạo cùng silhouette đều hợp lệ |
| MVP-03 | Xoay | Mảnh Chương 3 xoay từng nấc 90°; vùng phủ và điều kiện thắng cập nhật đúng sau xoay |
| MVP-04 | Luồng và phục hồi | Snap, thả tạm, kéo lại, trả khay, hủy chạm, mất focus và đặt lại không làm hỏng trạng thái màn |
| MVP-05 | Tiến độ | Hoàn thành màn mở màn tiếp; tiến độ tồn tại sau khi đóng/mở app; dữ liệu lỗi không chặn khởi động |
| MVP-06 | Thiết bị | APK build được, khóa dọc, mở offline và hoàn thành trọn campaign trên thiết bị Android mục tiêu |
| MVP-07 | Chất lượng | Test logic và build web/Android đạt; không có lỗi chặn tiến trình trong một lượt chơi trọn campaign |

Các kiểm tra trên là yêu cầu nghiệm thu, không xác nhận rằng chúng đã chạy cho phạm vi 18 màn. Bằng chứng hiện có chỉ áp dụng cho prototype sáu màn và editor đã ghi trong tài liệu kiểm chứng cũ.

## 11. Đo lường và rủi ro

### Đo lường

Product Owner đã xác nhận định tính rằng core game thú vị. Baseline định lượng hiện **chưa có**. Sau khi có bản 18 màn, nên ghi riêng: tỷ lệ hoàn thành mỗi màn/chương, số lần đặt lại, chỗ người chơi dừng và phản hồi về cơ chế xoay. Các số đo này là kế hoạch đánh giá, không phải kết quả đã có.

### Rủi ro và xử lý

| Rủi ro | Xử lý trước khi phát hành |
|---|---|
| Người chơi hiểu vùng biến mất là lỗi | Dùng màn Chương 2 giới thiệu trực quan, phản hồi vùng giao rõ, rồi playtest lại |
| Xoay gây khó thao tác hoặc khó hiểu | Dùng nút Xoay theo nấc 90°, tăng dần độ phức tạp trong Chương 3 và kiểm tra trên thiết bị thật |
| Câu đố khó hoặc nhịp không ổn | Tác giả level theo mục tiêu học, quan sát playtest và chỉnh/đổi level thay vì thêm hint tự động |
| Cảm ứng/layout không tốt trên Android | Kiểm tra APK trên thiết bị mục tiêu, tăng vùng chạm hoặc điều chỉnh bố cục trước phát hành |
| Custom Level làm trễ campaign | Để ở milestone cuối và cắt khỏi MVP nếu cần |

## 12. Ngoài phạm vi MVP

- Chương 4–5, mảnh nhiều màu, ánh sáng/pha màu, phản xạ hoặc nhiều nguồn sáng.
- Sao, điểm, gợi ý, giới hạn lượt/thời gian, leaderboard.
- Âm thanh và hiệu ứng hoàn thiện.
- Quảng cáo, IAP, trả phí, tài khoản, cloud save và chia sẻ level online.
- Sinh level tự động, đổi kích thước mảnh hoặc xoay bằng cử chỉ.
- iOS và các nền tảng phát hành khác.

## 13. Trạng thái sẵn sàng

GDD này chốt phạm vi và là đầu vào cho kế hoạch triển khai. Có thể lập kế hoạch campaign 18 màn, tiến độ cục bộ và cơ chế xoay ngay. Custom Level chỉ được lập kế hoạch sau khi campaign đạt tiêu chí nghiệm thu cốt lõi.

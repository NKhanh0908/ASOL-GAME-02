# Mirror — Mảnh lớn, hình đích suy luận và giao diện vũ trụ

Ngày: 2026-09-17. Trạng thái: người dùng đã duyệt bản ghi; kế hoạch triển khai ở [plan redesign](../plans/2026-09-17-mirror-puzzle-visual-redesign.md).

Tài liệu này thay thế các quyết định về kích thước mảnh, nhịp level và giao diện trong [spec ban đầu](2026-09-17-mirror-android-prototype-design.md). Những luật tương tác không được thay thế ở đây vẫn giữ nguyên.

## 1. Mục tiêu

Sáu màn cần khiến người chơi suy luận cách ghép từ một ký hiệu hình học trừu tượng. Mảnh đủ lớn để cầm trên điện thoại; hình đích có phần khuyết, vùng rỗng hoặc các phần rời được tạo bằng chồng mảnh. Tham khảo hai ảnh trong `docs/ref/` về cách đọc hình, tỷ lệ mảnh và sắc thái vũ trụ, không sao chép artwork.

Bản hiện tại dùng mảnh rộng khoảng 32–68 đơn vị trên canvas rộng 720, quá nhỏ so với bàn. Các màn đầu còn đặt hình riêng rẽ; chỉ phóng to chúng sẽ không tạo ra câu đố suy luận.

## 2. Luật đã chốt

- Ba loại mảnh: vuông, tam giác và hình thoi; hướng cố định, không xoay hay đổi kích thước trong lúc chơi.
- Một màu vàng cam. Vùng được phủ bởi số lớp chẵn biến mất, số lớp lẻ hiện lại.
- Thứ tự đặt không thay đổi silhouette khi các mảnh cùng màu. Không dùng thứ tự làm điều kiện thắng hoặc lời hướng dẫn độ khó.
- Bóng mục tiêu luôn hiện mờ trên bàn, chỉ thể hiện hình cuối cùng, không chia sẵn đường biên từng mảnh.
- Mảnh thả xa neo nằm đúng vị trí tạm, không được tính vào kết quả. Mảnh đã snap được kéo ra chỗ khác thì placement cũ bị loại khi thả; vị trí tạm vẫn được giữ.
- Bán kính snap giữ ở 6 ô logic, tương đương 24 đơn vị canvas với tỷ lệ hiện tại. Snap vào neo hợp lệ không đồng nghĩa đặt đúng đáp án.
- Chỉ so mặt nạ kết quả với mục tiêu, yêu cầu khớp 100%; không bắt buộc một danh sách đáp án duy nhất.
- Kéo xuống khay để trả mảnh; hủy chạm hoặc mất focus khôi phục trạng thái trước kéo. Đặt lại xóa cả placement và vị trí tạm. Sau thắng hiện nút tiếp và khóa kéo như bản hiện tại.

## 3. Kích thước và dữ liệu hình

Giữ canvas thiết kế 720 × 1280 và lưới logic 128 × 192. Các mảnh có chiều rộng bao khoảng 36–48 ô, tương đương 144–192 đơn vị canvas: lớn khoảng 3–5 lần mảnh đầu bản cũ. Kích thước được chọn theo câu đố, không tăng kích thước để thay cho tăng độ khó.

Hình đích chiếm khoảng 55–75% chiều ngang bàn, đặt gần tâm vùng chơi. Ngoại lệ được duyệt khi tác giả màn: riêng 1-1 rộng 60–64 ô (47–50%) để cả hai cạnh chéo của vết khuyết đọc rõ; mảnh vẫn rộng 36–48 ô. Với chỉ vuông và tam giác rộng tối đa 48 ô, bbox từ 70 ô buộc đỉnh tam giác sát cạnh vuông, làm mất một cạnh của V. Cùng một mảnh giữ đúng tỷ lệ ở khay, khi kéo và trên bàn. Tam giác có đỉnh hướng lên để tạo các vết cắt chữ V; hình thoi có trục dọc/ngang cố định. Cả ba được raster hóa về cùng lưới cho vẽ và so khớp.

Mỗi màn định nghĩa hình, neo hợp lệ và một lời giải dùng để sinh mặt nạ đích. Neo thử sai phải nằm trong vùng chơi, tạo kết quả khác mục tiêu và hợp lý để thử chồng; không đặt rải rác vô nghĩa. Mỗi mảnh có 2–4 neo, với khoảng cách đủ để tránh hai vùng snap trùng nhau.

## 4. Nhịp sáu màn thủ công

| Màn | Mảnh | Hình đích và điều người chơi học |
| --- | --- | --- |
| 1-1 | Vuông + tam giác | Một khối lớn có vết khuyết chữ V lệch tâm. Hai lớp triệt tiêu; giúp thấy chồng hình tạo phần rỗng ngay từ màn đầu. |
| 1-2 | Vuông + hình thoi | Khối vuông bị cắt chéo ở cạnh, kèm phần nhô bên ngoài. Cần xử lý đồng thời phần bị xóa và phần được thêm. |
| 1-3 | Cả ba | Ký hiệu có hai phần nhìn thấy lệch nhau và một khe rõ; không thể giải bằng đặt các mảnh tách rời. |
| 2-1 | Cả ba | Vùng hai lớp rỗng bao quanh một vùng ba lớp hiện lại, dạy đọc phần sáng nằm trong phần khuyết. |
| 2-2 | Cả ba | Các vùng nhìn thấy rời nhau nhưng cùng sinh từ ba mảnh lớn; khó đoán ranh giới mảnh gốc. |
| 2-3 | Cả ba | Ký hiệu bất đối xứng kết hợp vùng hai lớp và ba lớp, nhiều neo thử hợp lý; yêu cầu vận dụng toàn bộ luật. |

Các mô tả trên là ràng buộc thiết kế, không phải bằng chứng đã có level đạt yêu cầu. Khi triển khai, phải dựng và xem hình thực tế từng màn trước khi chốt tọa độ. Mỗi mảnh phải cần thiết: bỏ bất kỳ mảnh nào khỏi lời giải đều làm sai hình. Không dùng một đáp án tăng kích thước hoặc dịch chuyển lại cho nhiều màn. Độ khó tăng rõ là mục tiêu phải xác nhận bằng playtest, không suy ra chỉ từ số mảnh hoặc số ô chồng.

## 5. Bố cục và phong cách

Nền xanh đêm, điểm sao thưa, vòng trang trí xanh lam phát sáng nhẹ quanh vùng ghép. Mảnh vàng cam là phần sáng nhất. Khung trang trí không cắt vùng thả hoặc làm thay đổi luật biên của bàn chữ nhật logic.

Trên canvas dọc: vùng đầu khoảng y=24–150 dành cho tên game, số màn và mẫu thu nhỏ đủ đọc; vùng chơi chính khoảng y=170–920; khay khoảng y=960–1160; hàng nút khoảng y=1190–1260. Khi triển khai phải dùng hằng số bố cục chung để tọa độ vẽ, snap và vùng trả mảnh khớp nhau.

Bóng mục tiêu dùng màu vàng ở độ mờ khoảng 15%, kèm viền mảnh khi cần đọc trên nền. Lưới trang trí rất nhẹ. Mảnh tạm dùng nền trong và viền rõ; kết quả đã snap dùng màu đặc hơn. Mảnh đang kéo có viền sáng để nhận diện mảnh được chọn. Phản hồi snap và vùng chẵn/lẻ ngắn, không che mục tiêu.

Khay chia ba vị trí thoáng cho các mảnh lớn; hướng dẫn kéo xuống để trả đặt trong khay, không đè lên nút tiếp. Nút đặt lại và nút tiếp có vùng chạm riêng; thông báo thắng không che bàn. Giao diện web giữ tỷ lệ dọc và co vừa màn hình.

## 6. Thành phần và luồng trạng thái

- `domain/levels.ts`: dữ liệu sáu câu đố; tách hàm tạo hình sang module riêng nếu cần để dữ liệu dễ đọc.
- `domain/mask.ts` và `session.ts`: tiếp tục là nguồn tính luật, độc lập Phaser; chỉ thay đổi nếu kiểm chứng level hoặc tương tác phát hiện lỗi cụ thể.
- `ui/draw.ts`: vẽ từ mặt nạ thống nhất và bảng màu chung.
- Tách thông số bố cục/phong cách và phần trang trí khỏi `GameScene.ts`; scene giữ việc nhận input và đồng bộ trạng thái.
- Chạm → kéo → thả: phân biệt trả khay, snap và vị trí tạm; chỉ placement đã snap được gửi vào bộ tính hình. Hủy thao tác không làm mất mảnh hay giữ lại hình kết quả sai.

Chọn mảnh theo vùng hình thật, tránh hộp bao tam giác/thoi chặn mảnh ở dưới. Vùng bị triệt tiêu vẫn cần viền để có thể nhận diện và kéo lại. Khi các mảnh chồng hoàn toàn, ưu tiên mảnh được đưa lên trên gần nhất.

## 7. Kiểm chứng và bàn giao

Kiểm tra dữ liệu: mọi lời giải đạt 100%, các neo và ô của mảnh nằm trong bàn, mục tiêu không rỗng, mỗi mảnh cần thiết, màn yêu cầu chồng có vùng hai lớp và các màn 2-1 trở đi có vùng ba lớp thực sự. Đảo thứ tự placement phải giữ nguyên silhouette. Không hạ điều kiện test chỉ để dữ liệu mới chạy qua.

Kiểm tra tương tác trên trình duyệt: kích thước ở viewport điện thoại, kéo và thả tạm, kéo lại placement, trả khay, hủy chạm, reset, thắng và chuyển hết sáu màn. Chụp và xem ảnh cả sáu mục tiêu, kiểm tra chữ/nút không chồng và các phần khuyết đủ rõ. HTTP 200 hoặc build thành công không thay thế kiểm tra hình ảnh và tương tác.

Chạy test domain, TypeScript và build web; đồng bộ Capacitor và build APK sau khi bản web đạt. Ghi rõ kết quả thực tế vào `CHANGELOG.md`, cập nhật README và liên kết spec. Thử máy Android và playtest vẫn là bước riêng cần thiết để xác nhận độ dễ chạm, cảm giác snap và nhịp khó.

## 8. Ngoài phạm vi

Chưa thêm editor, sinh màn tự động, xoay mảnh, tài khoản, quảng cáo, hệ thống điểm hoặc mở rộng số màn. Không đổi framework. Artwork của ảnh tham khảo không được đưa vào giao diện sản phẩm.

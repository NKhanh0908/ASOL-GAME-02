# Mirror — Đánh giá kỹ thuật cho prototype Android
*Ngày đánh giá: 2026-09-17 | Trạng thái: Đề xuất, chưa có bản chạy trên thiết bị*

## 1. Bối cảnh và kết luận

Phạm vi lấy từ [`idea-sheet.md`](idea-sheet.md): một người làm prototype 6 màn thuộc Chương 1–2 trong khoảng 1–2 tuần, Android màn hình dọc, offline. Cần chứng minh kéo–thả, điểm neo ẩn, quy luật chồng chẵn/lẻ và kiểm tra silhouette. Chưa có mã game, thiết bị thử hay số đo hiệu năng trong repo; thời gian chỉ là ước lượng.

**Đề xuất tạm thời theo ưu tiên gọn nhẹ của người làm:** Phaser + TypeScript + Vite để làm game 2D; chỉ thêm Capacitor khi cần cài thử trên Android. Phaser chạy bằng WebGL/Canvas trong trình duyệt và hỗ trợ TypeScript; Capacitor có hướng dẫn riêng cho game Phaser, đóng gói web bundle vào ứng dụng Android, chạy trên thiết bị và tạo APK/AAB. Bản Android chạy trong WebView, không chuyển mã TypeScript thành engine native. Vì vậy cần đo cảm ứng/hiển thị trên máy thật trước khi kết luận đáp ứng yêu cầu. [Phaser docs](https://docs.phaser.io/), [Capacitor games](https://capacitorjs.com/docs/guides/games), [Capacitor workflow](https://capacitorjs.com/docs/basics/workflow).

| Phương án | Hợp khi | Chi phí/rủi ro với một người |
|---|---|---|
| **Phaser + TypeScript + Vite + Capacitor** (đề xuất) | Game 2D nhỏ, một người quen web, cần thử nhanh trên browser rồi cài Android | Capacitor thêm dự án Android/Gradle và WebView; phải thử trên điện thoại thật. Không cần React, Ionic hay plugin native cho sáu màn. |
| **Godot 4 + GDScript** | Người làm đã quen Godot hoặc WebView bộc lộ giới hạn | Có luồng xuất Android sẵn nhưng cần học editor/ngôn ngữ khác và cấu hình export. [Godot Android export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html). |
| **Unity 6 + C#** | Người làm đã có dự án/công cụ Unity và quen C# | Có thể phù hợp về lâu dài, nhưng thêm môi trường editor và Android Build Support cho một prototype rất nhỏ. [Unity Android setup](https://docs.unity3d.com/6000.1/Documentation/Manual/android-sdksetup.html). |

“Gọn nhẹ” ở đây là ít công cụ và ít phần game cần xây trong giai đoạn kiểm chứng; **chưa có số đo để khẳng định APK của Phaser/Capacitor nhỏ hơn Godot hoặc Unity**. Nếu người làm đã rất quen engine khác, thời gian học công cụ mới vẫn có thể làm phương án đó chậm hơn. Capacitor hiện hỗ trợ Android API 24+ và cần Android WebView phù hợp; kiểm tra phiên bản Android của máy thử trước khi bắt đầu. [Capacitor Android support](https://capacitorjs.com/docs/android).

## 2. Cách làm tối thiểu

**Dữ liệu màn:** Mỗi màn khai báo bàn chơi, danh sách mảnh (hình, màu, vị trí ban đầu), các điểm neo hợp lệ và mặt nạ silhouette mục tiêu. Không cần hệ thống lưu tiến độ hay trình biên tập màn riêng; sáu màn được tạo thủ công. Vị trí mảnh đang kéo chỉ là trạng thái tạm; khi thả gần điểm neo hợp lệ thì gắn vào neo, thả xa thì trở về vị trí trước đó/khay. Ngưỡng hút cần kiểm tra trên điện thoại thật để không khiến người chơi thấy bị “giật” sai ý.

**Luật hình:** Dùng một lưới logic có độ phân giải cố định cho riêng bàn ghép. Mỗi mảnh tạo một mặt nạ ô được phủ. Ở mỗi ô, đếm số mảnh phủ: chẵn = rỗng; lẻ = hiện, lấy màu của mảnh trên cùng trong số mảnh phủ. Mặt nạ kết quả so với mặt nạ mục tiêu sau mỗi lần thả hợp lệ. Điều này cho phép đặt hình bằng thao tác kéo tự do nhưng chấm thắng ở vị trí neo; không phụ thuộc vào màu hiển thị hoặc tọa độ tuyệt đối của mảnh. Dùng hình khối đơn giản và cùng hệ tọa độ cho mặt nạ, thumbnail và bàn chơi. Kiểm tra đủ các trường hợp 0, 1, 2, 3 lớp; đặt sai, đặt đúng và vùng thừa/thiếu. Độ phân giải lưới và chất lượng viền cần thử trên máy thật trước khi chốt; tránh coi mặt nạ thô là “khớp chính xác” ở mọi độ phân giải.

**Hiển thị và input:** Chỉ cần một Phaser Scene với bàn, khay mảnh và các nút mẫu/đặt lại. Trong lúc kéo, mảnh di chuyển theo ngón tay; sau khi thả, tính lại vùng chồng và phản hồi vùng vừa đổi. Tách logic mặt nạ TypeScript khỏi Phaser Scene để thay đổi hình vẽ không làm sai luật thắng. Dùng Phaser Graphics cho hình đơn giản; kiểm tra tỷ lệ màn dọc, vùng chạm và thao tác kéo trong Android WebView. [Phaser Graphics](https://docs.phaser.io/phaser/concepts/gameobjects/graphics).

**Đóng gói Android:** Chạy và chỉnh gameplay trên trình duyệt trước. Khi cần thử máy: build web bằng Vite, `npx cap sync android`, rồi `npx cap run android` hoặc mở dự án Android trong Android Studio. Capacitor sao chép web bundle vào dự án Android; không cần máy chủ mạng khi tài nguyên được đóng gói cục bộ. APK thử máy và AAB phát hành là hai đầu ra khác nhau; Capacitor hỗ trợ tạo cả hai. Vẫn cần Node.js và bộ công cụ Android/Android Studio để build, nên làm thử đường đóng gói trong ngày đầu. [Capacitor workflow](https://capacitorjs.com/docs/basics/workflow), [Capacitor Android](https://capacitorjs.com/docs/android), [Capacitor build](https://capacitorjs.com/docs/cli/commands/build).

**Đường nâng cấp sau prototype:** Nếu muốn mảnh có đường cong/cạnh tự do, đánh giá thư viện phép toán polygon hoặc cách vẽ mặt nạ tốt hơn. Giữ hình khối đơn giản trong sáu màn đầu để kiểm chứng luật chơi trước.

## 3. Rủi ro, phép thử và điểm quyết định

| Rủi ro | Phép thử sớm | Hướng xử lý nếu không đạt |
|---|---|---|
| **Người chơi không hiểu chồng chẵn/lẻ** (gameplay) | Ở 2-1 và 2-2, hỏi họ nghĩ điều gì đã xảy ra; ở 2-3, xem họ có dùng lại luật mà không nhắc. | Làm phản hồi vùng giao rõ hơn, sửa thứ tự/hình màn; không mặc định thêm lời giải. |
| **Mặt nạ và hình vẽ lệch nhau** (kỹ thuật) | Một màn 2 lớp và một màn 3 lớp với vùng giao, lỗ và mép sát nhau; so trực quan với kết quả thắng trên máy thật. | Dùng cùng hệ tọa độ, tăng độ phân giải mặt nạ hoặc chuyển sang xử lý polygon nếu đường viền cần chính xác hơn. |
| **Thao tác chạm/snap khó chịu** (thiết bị) | Cài APK lên một điện thoại Android thật; thử chạm mảnh nhỏ, kéo qua khay, thả sát/xa neo, đổi cỡ màn nếu có máy thứ hai. | Tăng vùng chạm độc lập với hình nhìn thấy, chỉnh ngưỡng hút và bố cục. |
| **Đóng gói Android mất thời gian** (sản xuất) | Trong ngày 1, build một trang/cảnh Phaser có chạm được, sync và chạy bằng Capacitor trên Android. | Giải quyết Node, Android Studio/SDK và cấu hình Capacitor trước khi làm đủ sáu màn; giữ gameplay chạy trong browser để tiếp tục chỉnh trong lúc xử lý build. |

**Điểm quyết định sau thử kỹ thuật:** Ngày 1–2 cần có APK chạy trên máy và kéo–thả cơ bản. Trong ngày 3–5, thử vùng chồng 2/3 lớp và so silhouette đúng/sai. Nếu một trong các việc này vướng lâu, ghi thời gian và nguyên nhân rồi điều chỉnh ước lượng 1–2 tuần trước khi làm tiếp sáu màn. Product Owner quyết định phạm vi/engine cuối cùng; đánh giá này không tự chuyển Idea Gate sang PASS.

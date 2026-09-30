# 04 — Dữ liệu level và FTUE

Nguồn: GDD §2.1, §4.1 và Phụ lục A/B hiện tại. Phụ thuộc: 02, 03. Spec này sở hữu dữ liệu nội dung, chất lượng nghiệm và tiến trình học; không tự biến phác thảo hình thành màn đã duyệt.

## 1. Manifest và trạng thái nội dung

**LVL-01:** Campaign manifest có đủ 18 ID, thứ tự từ 1-1 đến 3-6, tên và chapter theo GDD. Mỗi entry có `contentRevision`, `status` thuộc `planned`, `authored`, `validated`, `approved` và đường dẫn dữ liệu nếu đã author. Chỉ `approved` được nạp từ menu campaign cho người chơi.

- `planned`: mục tiêu học/hình tượng đã có, chưa đủ dữ liệu.
- `authored`: có danh sách mảnh, neo, target và ít nhất một nghiệm cụ thể.
- `validated`: schema, biên, nghiệm và ràng buộc chapter đã qua kiểm tra máy.
- `approved`: hình và nhịp học đã được review; evidence lưu kèm revision. Validator không tự đặt trạng thái này.

Build release yêu cầu đủ 18 entry approved. Build nội bộ có thể chỉ gồm tiền tố liên tục các màn approved hoặc cho harness chọn trực tiếp level đang thử. Màn chưa có dữ liệu không được thay bằng màn prototype cũ cùng ID.

## 2. Schema authoring phiên bản 1

| Trường | Quy tắc |
|---|---|
| `schemaVersion` | 1 |
| `id`, `chapter`, `order`, `title`, `contentRevision` | ID duy nhất; chapter 1–3; thứ tự theo manifest |
| `board` | width 128, height 192 |
| `rotationEnabled` | false ở chapter 1/2, true ở chapter 3 |
| `pieces[]` | ID vật lý riêng; `shapeKind = square/triangle/diamond`, `frameSize`, `cells`, `anchors[]`, màu amber |
| `targetCells[]` | Danh sách ô target độc lập, không trùng, sắp y rồi x; loader biên dịch sang mask |
| `sampleSolutions[]` | Ít nhất một danh sách `{pieceId, anchorId, turns}` không trùng pieceId |
| `learningObjective`, `difficultyEstimate` | Một kỹ năng chính; khó dự đoán 1–5, không phải số đo |
| `distractors[]` | Neo sai hoặc mảnh thừa được chỉ rõ; nếu không có mảnh thừa ghi rõ không có |
| `ftueSteps[]` | ID bước, trigger, điều kiện kết thúc, nội dung hiển thị theo mục 5 |

**LVL-02:** `cells` là footprint chuẩn tại turns 0 của **mảnh đã được định hướng sẵn bởi tác giả**. Chương 1 có thể cần hai tam giác quay hướng khác nhau để ghép cánh; việc định hướng sẵn không mở nút xoay cho người chơi. Hình ảnh, hit test và mask đều dùng cùng cells/frameSize. `shapeKind` mô tả hình, không được dùng một đường dựng hình thứ hai làm lệch footprint.

**LVL-03:** Target được author/export rồi lưu riêng với nghiệm mẫu. Mỗi lần validate phải tính mask từ nghiệm và so với target đã lưu. Thay nghiệm không tự thay target trong runtime. Việc này giúp phát hiện tọa độ nhập sai thay vì vừa sửa nghiệm vừa làm đổi bóng một cách vô tình.

## 3. Validator và kiểm tra nghiệm

**LVL-04:** Loader từ chối ID trùng, footprint rỗng/trùng ô, cell không nguyên hoặc ngoài frame, frame sai, anchor sai/trùng ID, target rỗng/ngoài board, pose vượt biên, reference piece/anchor không tồn tại, turns ngoài 0–3 hoặc xoay bị cấm. Báo lỗi gồm levelId, đường dẫn field và nguyên nhân.

**LVL-05:** Với mỗi nghiệm mẫu:

1. Tính footprint đầy đủ trong board; không clip.
2. So mask với targetCells đã lưu.
3. Chương 1: không có ô nào được phủ từ hai mảnh trở lên trong nghiệm. Những hình mô tả tiếp giáp cạnh/đỉnh phải có quan hệ tiếp giáp đúng khi review hình, không chỉ “không giao”.
4. Màn dạy hai lớp có vùng hai lớp rỗng nhìn được; màn dạy ba lớp có ít nhất một vùng ba lớp hiện. Review kích thước/độ rõ trên điện thoại, không chỉ tồn tại một ô.
5. Màn dạy xoay phải cần vận dụng hướng cho mục tiêu học; tránh chỉ xoay vuông đối xứng mà hình không đổi.

Kiểm tra các neo gây nhiễu tạo thay đổi có nghĩa. Với 2–4 mảnh và tập neo/góc nhỏ, công cụ authoring có thể duyệt tổ hợp để báo số nghiệm và nghiệm dùng ít mảnh hơn dự định. Nhiều nghiệm cùng mask là hợp lệ; tác giả xem chúng có bỏ qua bài học của màn hay không. Đây là kiểm tra nội dung, không thay luật thắng runtime.

## 4. Fixture khởi tạo độc lập với nội dung phát hành

**LVL-06:** M0 có fixture `fixture-adjacent-diamonds`, không dùng ID campaign 1-1:

- Board 128 × 192; hai mảnh D1/D2 là thoi trong frame 40, turns 0.
- Cell thoi khi `abs(x+0.5−20) + abs(y+0.5−20) ≤ 20`, với x/y nguyên từ 0 đến 39.
- Neo D1: A=(24,76), B=(24,92). Neo D2: A=(64,76), B=(64,92). Nghiệm mẫu D1-A + D2-A.
- TargetCells lưu từ định nghĩa hai thoi tiếp giáp đỉnh tại y=96; không có ô chung. Tạo expected mask độc lập theo công thức hình học hoặc hàng raster đã lưu, không gọi evaluator để vừa sinh expected vừa kiểm tra evaluator.
- Fixture kiểm snap, đặt sai, thiếu mảnh và thắng. Các fixture hai/ba lớp và xoay bất đối xứng dùng expected mask nhỏ độc lập như spec 02; không cần author một level đẹp để kiểm core.

Fixture trên hỗ trợ khởi tạo; **màn Song Tinh chính thức** vẫn cần review tọa độ/neo/hình ở kích thước điện thoại trước trạng thái approved.

## 5. FTUE theo hành trình mới

**LVL-07:** FTUE là lớp hướng dẫn quan sát state, không tự đặt mảnh hoặc sửa mask. Bàn tay minh họa/callout không chặn hit test. Trigger chờ không thao tác ban đầu đề xuất 3 giây; khi người chơi bắt đầu thao tác liên quan thì ẩn ngay. Thời gian phải cấu hình được để playtest, không ghi cứng vào logic core.

| Màn | Kỹ năng và nội dung | Trigger / kết thúc |
|---|---|---|
| 1-1 Song Tinh | Kéo hai thoi tiếp giáp; “Kéo mảnh vào bóng mục tiêu” | Chờ thao tác → demo tay; kết thúc khi bắt đầu kéo; bước học xác nhận khi snap lần đầu |
| 1-2 Bảo Tháp Tiên Tri | Tam giác tiếp giáp vuông; nhấn sáng mẫu | Khi vào lần đầu; kết thúc khi bắt đầu thao tác; không chỉ neo đúng |
| 1-3 Cánh Chim Báo Điềm | Tự ghép hai cánh đối xứng | Không có demo nghiệm; quan sát hoàn thành độc lập |
| 2-1 Mũi Tên Chỉ Thiên | Hai lớp làm vùng giao biến mất | Callout ngắn khi xuất hiện giao hai lớp đầu tiên; ẩn khi tiếp tục thao tác |
| 2-2 Cánh Bướm Điệp Ảnh | Chủ động tạo vùng rỗng cân bằng | Nhấn vùng mục tiêu cần quan sát, không chỉ vị trí mảnh; ẩn khi thao tác |
| 2-3 Trái Tim Tinh Thể | Mảnh thứ ba làm vùng rỗng hiện lại | Demo minh họa riêng khi chưa thao tác; xác nhận bước khi người chơi tạo giao ba lớp trong phiên |

Demo 2-3 chỉ minh họa quy luật trong overlay/swatch, không tiết lộ tọa độ nghiệm. Không có hint theo lần reset hoặc skip. Khi replay màn đã hoàn thành, không tự lặp demo. Nếu người chơi chưa hoàn thành rồi bắt đầu lại, có thể lặp FTUE; điều kiện này suy từ completion, chưa cần schema lưu tutorial riêng.

**LVL-08:** Bước hướng dẫn gửi `ftue_step_seen` khi thực sự hiện, `ftue_step_done` khi điều kiện gameplay đạt; không tính việc hết animation là học xong. Mỗi bước chỉ gửi một lần mỗi lượt vào màn.

## 6. Những dữ liệu cần author tiếp

Phụ lục A hiện mô tả sáu biểu tượng nhưng chưa đủ pose/neo; 2-2 còn lựa chọn số mảnh. Phụ lục B có tên, vai trò và số mảnh dự kiến cho 12 màn. Cả hai nhóm cần điền theo schema ở mục 2 trước khi đưa vào campaign. Không tự lấy tọa độ của Vết khuyết/Lõi sáng/Ấn lệch để gắn cho tên mới.

Đầu ra duyệt một màn gồm file dữ liệu, ảnh target xuất từ targetMask, ảnh nghiệm có phân biệt mảnh, kết quả validator, lựa chọn sai có chủ đích, người/ngày review và ghi chú playtest. Đủ sáu màn dữ liệu không đồng nghĩa đã đủ campaign tuần tự; tuân theo manifest và spec 05.

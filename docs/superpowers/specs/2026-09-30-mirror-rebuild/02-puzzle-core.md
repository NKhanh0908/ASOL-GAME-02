# 02 — Core puzzle

Nguồn: GDD §1.2–1.5. Phụ thuộc: 01. Spec này sở hữu phép chấm và chuyển trạng thái; spec 03 sở hữu cách người chơi gửi command.

## 1. Hợp đồng dữ liệu

**CORE-01:** Bàn cố định 128 × 192 ô, gốc trên trái `(0,0)`, x sang phải, y xuống dưới. Ô hợp lệ có x từ 0 đến 127, y từ 0 đến 191. Mask runtime là `Uint8Array` dài 24.576, index `y * 128 + x`, giá trị 0 hoặc 1.

| Kiểu | Trường / ý nghĩa |
|---|---|
| PieceDefinition | `id`, `frameSize` nguyên ≥2, `cells` cục bộ không trùng, `anchors` theo thứ tự, `color = amber` |
| Anchor | `id` duy nhất trong mảnh, `x`, `y` nguyên; gốc khung vuông của mảnh |
| Pose | `x`, `y`, `turns` thuộc 0/1/2/3; góc thế giới = hướng đã author trong cells + turns × 90° |
| PieceState | `tray`, `temporary` (gốc board thực), hoặc `snapped` (anchorId); luôn có `turns` |
| PuzzleState | `levelId`, trạng thái từng mảnh, `phase = playing hoặc won` |
| CommandResult | `accepted`, `reason`, snapshot mới, resultMask, tập ô đổi, `becameWon` |

Level không đổi trong phiên. `frameSize` được khai báo và giữ cố định qua mọi góc; không suy lại tâm xoay từ bounding box của các ô đang hiện. Mỗi mảnh vật lý có ID riêng, kể cả hai mảnh cùng hình. Một ID chỉ có một PieceState.

## 2. Mask và điều kiện thắng

**CORE-02:** Bắt đầu mọi ô trống. Với mỗi mảnh **snapped**, biến đổi cells theo turns và gốc neo rồi lật trạng thái từng ô phủ: trống → hiện; hiện → trống. Do đó 0/2/4 lớp trống, 1/3 lớp hiện. Màu UI không tham gia tính toán; validator từ chối level nhiều màu trong MVP.

**CORE-03:** Thắng khi resultMask bằng targetMask tại mọi ô. Target phải khác rỗng; validation level kiểm tra điều này. Không dùng “đúng tọa độ nghiệm mẫu”, phần trăm tương đồng hoặc số mảnh đã đặt để thay thế phép so. Nếu mảnh còn ở khay/tạm mà silhouette vẫn đúng, vẫn thắng theo GDD. Content validation phải phát hiện nghiệm ngoài ý muốn đáng kể để tác giả review, không thêm luật runtime bắt dùng hết mảnh.

Mảnh không hợp lệ không được cắt phần ngoài bàn rồi tính. Pose snapped phải nằm trọn trong bàn trước khi commit. Tiếp giáp cạnh/đỉnh không có chung ô thì không tạo giao.

Với vị trí tạm có gốc thực, ô cục bộ `(cx,cy)` chiếm hình chữ nhật từ `(originX+cx, originY+cy)` đến `(originX+cx+1, originY+cy+1)`. Kiểm tra vượt biên cho xoay phải tính cả mép cuối ô; không coi gốc ô 127,5 là nằm trọn trong bàn rộng 128. Với pose snapped, gốc nguyên nên điều kiện rút về giới hạn ô thông thường.

## 3. Snap và thả

**CORE-04:** `Drop(pieceId, originX, originY)` nhận gốc khung trong tọa độ ô thực; từ chối NaN/Infinity hoặc ID không có. Khoảng cách dùng **gốc mảnh**, không dùng pointer hay tâm hình.

1. Xét neo của đúng mảnh; pose tại neo với góc hiện tại phải ở trong bàn.
2. Chọn khoảng cách bình phương nhỏ nhất ≤36. Khi bằng nhau, giữ neo xuất hiện đầu trong danh sách.
3. Nếu có neo, trạng thái thành snapped tại neo đó; việc neo cùng tọa độ một mảnh khác đang dùng không làm nó mất hiệu lực.
4. Nếu không có neo, trạng thái thành temporary tại gốc vừa thả, đồng thời gỡ placement snapped cũ nếu có. Mảnh temporary không đóng góp vào resultMask.
5. Tính resultMask và chuyển won nếu khớp. `Drop` hợp lệ ngoài bán kính trả outcome `temporary`, không phải lỗi hệ thống.

**CORE-05:** `ReturnToTray(pieceId)` gỡ placement/tạm nhưng giữ turns để người chơi tiếp tục thử cùng hướng. `Reset` trả tất cả về tray và turns 0, phase playing. Đây là phân biệt giữa trả một mảnh và bắt đầu lại màn; sau won chỉ Reset/khởi tạo lượt chơi mới được phép thay đổi bố cục.

## 4. Xoay

**CORE-06:** Level khai báo `rotationEnabled`; content validator đảm bảo false ở Chương 1–2 và true ở Chương 3. Domain không suy quyền xoay bằng cách cắt chuỗi ID.

Với frame N, một nấc theo chiều kim đồng hồ: `(x,y) → (N−1−y,x)`. Hai nấc: `(N−1−x,N−1−y)`; ba nấc: `(y,N−1−x)`. Gốc khung/neo giữ nguyên.

- Snapped: kiểm tra toàn bộ footprint mới trong bàn; nếu vượt biên, từ chối toàn bộ command, không đổi góc, pose hay mask.
- Temporary: nếu footprint xoay vượt board, từ chối và giữ trạng thái cũ; nếu nằm trong board, đổi góc nhưng vẫn temporary, không tự snap.
- Tray: xoay trong khung preview của khay, không áp biên board và không tham gia mask. Khi thả mới xét board.
- Level không cho xoay, chưa chọn đúng ID hoặc đã won: từ chối không có tác động.

**CORE-07:** Xoay thành công trên bàn có thể làm thắng. Kết quả phải được chấm trước animation; ảnh động xoay không tạo các góc trung gian trong domain.

## 5. Command và tính nguyên vẹn

| Command | Khi playing | Khi won |
|---|---|---|
| Drop / ReturnToTray | Áp dụng giao dịch rồi tính lại | Từ chối |
| Rotate | Theo cờ level và biên | Từ chối |
| Reset | Trở về đầu màn | Bắt đầu lượt chơi lại |

**CORE-08:** Drag chưa thả chỉ là preview ngoài state đã commit. Core không nhận command ở mỗi pointermove. Cancel/blur/pause trong khi kéo bỏ preview, giữ nguyên state trước kéo. View có thể tạo candidate mask qua hàm pure để xem trước; candidate không gây won hoặc save.

**CORE-09:** Kết quả command từ chối phải bằng state trước command. Snapshot không cho view sửa ngược dữ liệu core. Delta vùng đổi lấy từ hai mask committed liên tiếp, dùng cho hiệu ứng tại spec 03.

## 6. Ca nghiệm thu bắt buộc

| ID | Dữ liệu / thao tác | Kết quả |
|---|---|---|
| C01 | 0, 1, 2, 3, 4 mảnh cùng phủ một ô | 0, 1, 0, 1, 0 |
| C02 | Đảo thứ tự placement hợp lệ | Mask giữ nguyên |
| C03 | Hai footprint chỉ chạm cạnh/đỉnh | Không bị triệt tiêu |
| C04 | Hai ID cùng neo, vùng phủ trùng | Cả hai tính; vùng giao trống |
| C05 | Drop cách neo đúng 6; lớn hơn 6 | Snapped; temporary |
| C06 | Hai neo cùng khoảng cách | Neo đầu thắng tie |
| C07 | Mảnh snapped kéo ra vị trí tạm | Placement cũ bị gỡ khi thả; không tính mảnh tạm |
| C08 | Preview sai rồi cancel | State/mask committed không đổi |
| C09 | Bốn lần xoay hình bất đối xứng | Cells/góc trở về ban đầu, neo không dịch |
| C10 | Xoay vượt biên | Không có thay đổi một phần |
| C11 | Thiếu hoặc thừa đúng một ô | Chưa thắng |
| C12 | Bố cục khác nghiệm mẫu nhưng cùng mask | Thắng |
| C13 | Thắng do xoay; sau đó Drop | BecameWon một lần; Drop bị từ chối |
| C14 | Reset sau temporary/xoay/won | Tray, turns 0, playing, mask rỗng |

Ít nhất một test giao ba lớp dùng expected mask khai báo độc lập. Không tạo expected mask bằng chính hàm đang kiểm thử. Thêm kiểm thử tính bất biến thứ tự và xoay bốn lần bằng vài footprint bất đối xứng, không chỉ vuông/thoi đối xứng.

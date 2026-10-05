# Mirror — Master Game Design Document

*Bản thiết kế trải nghiệm cho Android & Web MVP · Cập nhật 05/10/2026 · phiên bản 0.3.0 (Tích hợp Hệ thống Âm thanh WebAudio Synth, Chuyển động Game Feel & 22 Màn Phê Duyệt)*

## Tổng quan trong 30 giây

> **High concept:** Mirror là game giải đố ghép bóng hình (*silhouette overlap puzzle*) trên điện thoại: kéo các mảnh kính cùng màu vào bàn để tạo đúng bóng mục tiêu; hai mảnh chồng nhau làm vùng giao biến mất, mảnh thứ ba làm vùng đó hiện lại.

| Câu hỏi | Câu trả lời thiết kế |
|---|---|
| Dành cho ai? | Người thích puzzle quan sát, thử nghiệm bằng tay, chơi thư giãn mà không có đồng hồ hay giới hạn lượt. Độ tuổi và thói quen chơi cần xác nhận bằng playtest. |
| Người chơi làm gì? | Xem bóng mục tiêu, kéo mảnh từ khay vào bàn, thử các vị trí neo, quan sát vùng hiện/trống, lắng nghe phản hồi âm thanh ngũ cung khi snap, rồi ở Chương 4 xoay mảnh từng nấc 90°. |
| Điểm khác biệt | Người chơi **tạo khoảng trống có chủ đích** bằng giao nhau, thay vì chỉ lấp đầy một khuôn; vùng giao của mảnh cùng màu có thể biến mất rồi hiện lại. |
| Một phiên chơi | Mục tiêu thiết kế **2–5 phút** cho 1–3 màn đầu; đây là giả thuyết để đo, chưa phải kết quả thực tế. Có thể thoát về menu giữa hai màn. |
| Quy mô MVP | 28 màn thủ công (hiện đã phê duyệt và kiểm chứng 22 màn thuộc Chương 1, 2 và 3); Android dọc & Web, offline, miễn phí, một màu mảnh, không quảng cáo/IAP. |
| Tham chiếu | [Shadowmatic](https://www.shadowmatic.com/) cho cảm giác khám phá bóng hình; [Gorogoa](https://new.annapurnainteractive.com/en/games/gorogoa) cho cách người chơi thử thao tác hình ảnh. Đây là tham chiếu trải nghiệm, không phải mẫu sao chép cơ chế. |

**Định vị:** dùng “puzzle ghép bóng bằng vùng giao” trong mô tả sản phẩm; tránh gọi là “match hình” vì dễ bị hiểu thành match-3 hoặc ghép cặp. Không dùng hình minh họa nhiều màu trong tài liệu MVP: giao nhau giữa **khác màu** chỉ thuộc giai đoạn sau, khi đó mới quyết định pha màu hay hiện màu mảnh trên cùng.

**Trạng thái tài liệu:** Cập nhật đồng bộ với bản build `game-next` (05/10/2026). Toàn bộ 22 màn chơi của Chương 1 (Khởi Nguyên 1-1..1-6), Chương 2 (Giao Thoa 2-1..2-6) và Chương 3 (Họa Phẩm 3-1..3-10) đã hoàn thiện 100%, được giải nghiệm duy nhất bằng solver XOR và phê duyệt vào campaign (`npm run content:validate`). Hệ thống âm thanh tổng hợp thời gian thực (WebAudio Synth Engine), giai điệu ngũ cung, chuyển động game feel (F1/F2) và bố cục co giãn đàn hồi (Elastic Layout) đã được tích hợp và kiểm thử đạt chuẩn 100% (84 files / 1026 tests PASS). Nội dung thiết kế cần để hiểu Mirror được trình bày ngay trong file này.

---

## Chương 1 — Gameplay và luật

### 1.1. Trụ cột và vòng chơi

1. **Thử bằng tay, hiểu bằng mắt:** thao tác làm thay đổi hình ngay, nhất là vùng vừa biến mất hoặc hiện lại.
2. **Giải bóng kết quả:** mọi cách xếp tạo cùng silhouette đều hợp lệ; thứ tự đặt mảnh không phải điều kiện thắng.
3. **Sai sửa được:** kéo lại, trả khay hoặc đặt lại, không mất màn đã hoàn thành.

Vòng chơi: xem bóng mục tiêu → kéo/thả hoặc xoay → so vùng hiện/trống → điều chỉnh → silhouette trùng hoàn toàn → mở màn tiếp. Không có thời gian, điểm, sao, giới hạn lượt hay phạt đặt sai.

### 1.2. “Vùng” và quy luật giao

Bàn logic là lưới **128 × 160 ô**. Mỗi mảnh là tập các ô nằm trong khung vuông kích thước xác định; nét vẽ có thể mượt hơn nhưng phép chấm dùng ô lưới. Với một ô bất kỳ, đếm các **mảnh đã snap cùng màu** phủ ô đó: 0 mảnh = trống; 1 = hiện; 2 = trống; 3 = hiện. Nếu sau này có 4 mảnh cùng màu, ô lại trống. Chỉ vùng giao bị đổi trạng thái; phần còn lại của mảnh vẫn hiện. Mọi mảnh MVP có cùng một màu vàng cam. Vùng giao khác màu chưa có luật trong MVP và không xuất hiện trong 28 màn.

**Luật chẵn lẻ (chốt cho cả loạt spec A–E):** mặt nạ dùng XOR (`mask[idx] ^= 1` trong `domain/mask.ts`). Ô bị phủ lẻ lần thì hiện, chẵn lần thì ẩn:

| Số lớp phủ một ô | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Trạng thái | trống | hiện | trống | hiện lại | trống | hiện |

Luật if-else "giao là ẩn" đã bị loại: mỗi mảnh chỉ cần một phép XOR mỗi ô, renderer chồng lớp chẵn/lẻ và bộ giải nghiệm duy nhất đều dựa trên XOR.

**Thắng:** so từng ô của mặt nạ kết quả với mặt nạ mục tiêu. Mọi ô phải khớp trạng thái hiện/trống, không thiếu hoặc thừa. Không bắt buộc dùng một danh sách neo đúng duy nhất. Mảnh đang ở khay hoặc ở vị trí tạm chưa snap không tham gia mặt nạ. Trật tự đặt mảnh không đổi kết quả của MVP một màu.

### 1.3. Kéo, neo và snap

- Mỗi mảnh có danh sách neo do tác giả màn đặt. Neo là **tọa độ gốc góc trên trái của khung mảnh** trên lưới, không phải tâm chạm ngón tay. Khi kéo, game giữ độ lệch giữa ngón tay và gốc mảnh.
- Giá trị đang dùng trong prototype: thả trong bán kính Euclid **6 ô lưới** tính từ gốc mảnh đến một neo của chính mảnh đó thì snap. Với bố cục logic 4 px/ô, bán kính này là 24 đơn vị canvas; đây là giá trị cần kiểm tra cảm giác chạm trên thiết bị, chưa chốt là tối ưu. Nếu nhiều neo cùng trong bán kính, chọn neo gần nhất; nếu bằng khoảng cách, ưu tiên neo đứng trước trong dữ liệu màn để kết quả ổn định.
- **Hai mảnh có thể cùng tọa độ neo** nếu dữ liệu của từng mảnh cho phép. Không đẩy mảnh trước ra ngoài. Cả hai cùng được tính trong vùng giao. “Neo đã có người” không phải lỗi.
- Mảnh snap nằm chắc tại neo và có xung viền ngắn. Neo không hiển thị sẵn như một đáp án; khi kéo gần, có thể hiện dấu hút nhẹ để người chơi biết vùng đặt hợp lệ.
- Thả xa mọi neo: mảnh được giữ tại vị trí tạm bằng **viền đứt, độ mờ khác biệt và nhãn ngắn “Chưa đặt — chưa tính vào hình”**. Bóng kết quả chỉ vẽ các mảnh đã snap, nên mảnh tạm không tạo một bóng giả giống nghiệm. Kéo lại mảnh tạm để thử tiếp hoặc kéo xuống khay để trả. Đây là yêu cầu UX cho bản hoàn thiện; prototype hiện giữ mảnh tạm nhưng phản hồi chưa đủ rõ.
- Thả vào khay gỡ mảnh khỏi bàn. Hủy chạm/mất focus trả mảnh về trạng thái trước lần kéo. “Đặt lại” xóa mọi vị trí và góc xoay của màn hiện tại; yêu cầu xác nhận chỉ khi playtest cho thấy bấm nhầm thường xuyên.

### 1.4. Xoay

Xoay chỉ mở ở Chương 4 (Luân Chuyển). Người chơi chọn mảnh rồi bấm nút **Xoay ↻**; mỗi lần bấm xoay 90° theo chiều kim đồng hồ. Tâm xoay là **tâm khung vuông cục bộ** của mảnh. Với khung cạnh `N`, ô `(x,y)` sau một nấc thành `(N−1−y,x)`. Nếu mảnh đã snap, tọa độ neo/gốc khung **giữ nguyên**; chỉ tập ô phủ thay đổi, rồi game tính lại silhouette ngay. Nếu mảnh ở khay hoặc vị trí tạm, xoay thay đổi hướng xem trước nhưng không tạo placement được chấm. Không dùng cử chỉ xoay đa điểm trong MVP. Một lần xoay khiến ô mảnh vượt biên bàn phải bị từ chối với phản hồi ngắn; không cắt mất phần vượt biên rồi chấm như một hình khác. Quy tắc vượt biên này là thiết kế cần đồng bộ với code trước phát hành.

### 1.5. Phản hồi và phục hồi

| Tình huống | Phản hồi tối thiểu | Người chơi làm tiếp |
|---|---|---|
| Nhấc/kéo | Mảnh nổi viền và sáng hơn; xem trước vùng thay đổi | Thả gần neo hoặc kéo về khay |
| Snap | Hút ngắn tới neo; vùng giao mới đổi rõ trong một nhịp | Tiếp tục thử |
| Chưa snap | Viền đứt + nhãn “Chưa đặt — chưa tính vào hình”; bóng kết quả không đổi | Kéo lại gần vùng chơi |
| Xoay hợp lệ | Mảnh quay 90°, vùng phủ đổi tức thì | Giữ hoặc xoay tiếp |
| Xoay vượt biên | Mảnh giữ hướng cũ, rung/nháy viền nhẹ | Di chuyển rồi xoay |
| Sai hình | Chỉ ra vùng thiếu/thừa khi người chơi yêu cầu xem mẫu; không bật đáp án | Kéo lại/đặt lại |
| Đúng hình | Giữ hình hoàn chỉnh, hiện “Hoàn thành” và nút “Màn tiếp” | Chơi màn tiếp hoặc về menu |

---

## Chương 2 — FTUE và UX

### 2.1. Kịch bản học luật từ 1-1 đến 2-3

Hướng dẫn thị giác chỉ xuất hiện khi người chơi chưa thao tác, tự biến mất ngay sau hành động tương ứng. Lời ngắn dưới một dòng; không khóa màn bằng hộp thoại dài.

| Màn | Tên Biểu tượng | Hình ảnh/chuyển động trước thao tác | Người chơi cần tự làm | Dấu hiệu đã học |
|---|---|---|---|---|
| **1-1** | **Song Tinh** *(Twin Stars)* | Bóng mẫu 2 viên ngọc thoi chạm đỉnh kề nhau; bàn tay nét mảnh kéo mảnh thoi từ khay lên bóng rồi biến mất. Lời: “Kéo mảnh vào bóng mục tiêu”. | Kéo 2 mảnh thoi vào vị trí tiếp giáp đỉnh; không xếp chồng. | Bắt đầu kéo thả tự nhiên; hiểu cơ chế snap vào lưới toạ độ. |
| **1-2** | **Bảo Tháp Tiên Tri** *(Sacred Spire)* | Thumbnail mẫu và đỉnh tháp sáng nhẹ một nhịp. | Ghép tam giác đặt ngay ngắn trên đỉnh khối vuông (tiếp giáp cạnh). | Nhận biết việc phối hợp 2 hình khối khác nhau để tạo một biểu tượng có nghĩa. |
| **1-3** | **Cánh Chim Báo Điềm** *(Astral Wing)* | Hai cánh sáng đối xứng. | Ghép 2 tam giác đối xứng qua trục dọc tạo đôi cánh. | Tự so sánh hình mục tiêu và đặt mảnh chính xác mà không cần hướng dẫn. |
| **2-1** | **Mũi Tên Chỉ Thiên** *(Vanguard Arrow)* | **Bắt đầu xếp chồng:** Tam giác lồng vào khối vuông; vùng giao thoa đổi từ vàng sang nền bàn tối; lời: “Hai mảnh cùng màu: vùng giao biến mất”. | Lồng tam giác vào khối vuông để tạo vết khuyết rỗng chevron trong mũi tên. | Hiểu và tận dụng cơ chế triệt tiêu (2 lớp = rỗng) để tạo hoa văn khuyết. |
| **2-2** | **Cánh Bướm Điệp Ảnh** *(Oracle Butterfly)* | Đốm sáng chỉ vào khoảng rỗng trung tâm của hình nơ bướm. | Xếp chồng các tam giác để tạo tâm rỗng đối xứng tuyệt đối. | Chủ động tạo khoảng rỗng cân bằng từ nhiều mảnh giao nhau. |
| **2-3** | **Trái Tim Tinh Thể** *(Crystal Core)* | Khoảng rỗng hai lớp vừa tạo được khoanh sáng; mảnh thứ ba đi ngang qua trong demo ngắn, hạt nhân ở giữa bừng sáng; lời: “Thêm mảnh thứ ba: vùng đó hiện lại”. | Đặt mảnh thứ ba vào tâm rỗng để viên ngọc nhân hiện lại (3 lớp = hiện). | Dự đoán được trạng thái chẵn-lẻ (parity) của vùng giao trước khi thả mảnh. |

Chương 1 hoàn toàn thuần túy là **ghép tiếp giáp không xếp chồng**, giúp người chơi làm quen với thao tác kéo, thả, snap và tạo dựng các biểu tượng cổ ngữ hoàn chỉnh. Bước sang Chương 2, người chơi sẽ đón nhận bất ngờ thú vị khi khám phá cơ chế phép trừ triệt tiêu vùng giao và hồi sinh hạt nhân 3 lớp.

### 2.2. Kiến trúc Giao diện, Bố cục Dọc và Mô tả Màn hình

![Mockup màn chơi và ba trạng thái vùng giao](assets/gameplay-mockup.svg)

#### 2.2.1. Phân vùng Dọc Safe Area & Bố cục Đàn Hồi (Elastic Layout)
Toàn bộ bố cục màn chơi được chuẩn hóa trên canvas cơ sở $720 \times 1280$ ($9:16$). Để tương thích hoàn hảo với các tỉ lệ màn hình dài hiện đại trên thiết bị Android ($19.5:9$, $20:9$, $21:9$ như $720 \times 1600$), game áp dụng hệ thống **Bố cục đàn hồi (Elastic Vertical Layout)**: tự động tính toán phân bổ khoảng đệm (`computeVerticalOffsets`) dựa trên chiều cao thực tế và Safe Area Insets của hệ điều hành, đảm bảo bàn chơi, khay mảnh và các nút bấm luôn cân đối, không bao giờ bị cắt xén hay che khuất:

| Dải toạ độ ($Y$) | Chiều cao | Thành phần giao diện & Quy cách tương tác |
|---|---|---|
| **$0 .. 96\text{ px}$** | $96\text{ px}$ | **Header điều hướng:** Nút Menu tròn ($x=56, y=56$, kích thước $80\text{ px}$, vùng chạm $96\text{ px}$); Tiêu đề màn (Baloo 2 $36\text{ px}$) kèm tên Chương ($24\text{ px}$) ở giữa ($x=360$); Nút bật/tắt hiển thị mẫu ($x=664, y=56$). An toàn với camera đục lỗ/tai thỏ. |
| **$96 .. 184\text{ px}$** | $88\text{ px}$ | **Khoảng đệm trên & Huy hiệu Mục tiêu:** Vòng cung trang trí chiêm tinh; **Huy hiệu mục tiêu tròn đường kính $180\text{ px}$** đặt tại $(360, 168)$ chồng nhẹ lên mép trên tấm bia, chạm vào phóng to $1.35\times$ để soi chi tiết bóng cần ghép. |
| **$184 .. 952\text{ px}$** | $768\text{ px}$ | **Tấm bia thiên văn (Bàn chơi $512 \times 768$):** Tọa độ gốc $(104, 184)$, lưới logic $128 \times 192$ ô ở $4\text{ px/ô}$. Khung ngoài viền kính xanh `#68B8DC` dày $10\text{ px}$ vát mép (bevel) và bo góc lớn $36\text{ px}$, chỉ viền vàng hổ phách nét đứt `#D4A359`, lưới toạ độ $8\text{ ô}$ ($32\text{ px}$), chấm giao điểm và vòng thiên văn xoay nền. |
| **$968 .. 1108\text{ px}$** | $140\text{ px}$ | **Khay chứa mảnh ($512 \times 140$ tại $x=104$):** Dải đá sẫm bo góc $20\text{ px}$, chia ô lõm viền kính riêng cho từng mảnh cổ ngữ. Mảnh đã đặt lên bàn để lại bóng mờ định vị trong khay. |
| **$1124 .. 1216\text{ px}$** | $92\text{ px}$ | **Hàng nút điều khiển dưới:** Nút Đặt lại tròn bên trái ($x=168, y=1170$, kích thước $80\text{ px}$, vùng chạm $96\text{ px}$); Nút Xoay ↻ tròn bên phải ($x=552, y=1170$) — **ẩn ở Chương 1–3**, chỉ xuất hiện ở Chương 4 (mờ khi chưa chọn mảnh). |
| **$1216 .. 1280\text{ px}$** | $64\text{ px}$ | **Safe Area đáy:** Vùng đệm co giãn bảo vệ, tránh xung đột với thanh cử chỉ vuốt (Gesture navigation bar). |

#### 2.2.2. Chi tiết Các Màn hình trong Game
1. **Màn hình chính (Main Menu):**
   - **Ấn Bia Cổ Ngữ Trung Tâm ($280\text{ px}$):** Hai vòng tròn thiên văn lồng nhau xoay chậm ngược chiều; tâm ấn bia đặt biểu tượng hai viên ngọc thoi chạm đỉnh (*Song Tinh*) phát quang nhịp nhàng.
   - **Thương hiệu & Logo Casual ("Gương Đôi · Mirror"):** Logo chữ đôi mang phong cách cổ tích huyền bí, biểu tượng Song Tinh ngọc đôi phát sáng; phụ đề hiển thị luân phiên **20 câu sự thật thiên văn thú vị** (`MENU_TAGLINES`) mỗi lần mở menu hoặc chuyển đổi ngôn ngữ, tạo cảm hứng khám phá vũ trụ bao la.
   - **Nút Hành Động Chính (Primary CTA):** Khối vàng đặc `#FFC857` bo góc $20\text{ px}$ nổi bật; hiển thị nhãn "Tiếp tục" cùng tên màn tiếp theo cần giải (ví dụ: *"Tiếp tục · Màn 1-2 · Bảo Tháp Tiên Tri"*); nếu hoàn thành 28 màn chuyển thành *"Chơi lại từ đầu"*.
   - **Nút Phụ & Cài đặt:** Nút "Chọn màn" viền kính xanh trong suốt; nút "Cài đặt" icon bánh răng cổ ngữ tròn ($56\text{ px}$) đặt tại góc trên bên phải.
2. **Màn hình Chọn Màn (Level Select Screen — Bản đồ Chòm sao):**
   - **Bố cục Chòm sao:** Phân chia 4 chương (*Khởi Nguyên*, *Giao Thoa*, *Họa Phẩm*, *Luân Chuyển*); số chòm sao và số nút suy ra từ manifest, chòm sao Họa Phẩm 10 nút xếp thành chuỗi đèn lồng (một nút giữa, một cặp hai bên, lặp lại). Hai mươi tám màn chơi hiển thị dưới dạng các **node thiên thể tròn** nối kết bởi các đường liên kết sao phát sáng mảnh màu vàng `#D4A359` uốn lượn theo trục dọc màn hình.
   - **Bốn trạng thái của Node:**
     - *Đã hoàn thành:* Node vàng đặc `#FFC857` có dấu ấn hoàn tất, phát âm thanh chọn màn.
     - *Màn hiện tại:* Node có hào quang nhấp nháy êm dịu, nổi bật mời gọi tương tác.
     - *Đã mở:* Node viền kính xanh trong suốt.
     - *Bị khóa:* Node tối mờ với ký hiệu phong ấn cổ ngữ; chạm vào phát âm thanh cảnh báo trầm (`locked`).
   - Chạm/giữ node hiển thị thẻ thông tin ngắn: tên biểu tượng cổ ngữ và trạng thái.
3. **Màn chơi (Gameplay Screen) & Năm Trạng Thái Trực Quan Kèm Âm Thanh (F2 & G2):**
   - **Trạng thái 1 — Đang kéo (Dragging):** Mảnh nhấc lên phóng to nhẹ $1.06\times$, đàn hồi theo ngón tay, bóng đổ rộng xuống mặt đá, vòng hào quang sáng nhẹ quanh các neo hợp lệ; phát tiếng tick ngắn nhẹ khi nhấc (`lift`).
   - **Trạng thái 2 — Đã snap (Snapped):** Mảnh hút vào neo trong $120\text{ ms}$, viền lóe sáng `#FFE8A6` rồi cố định với sắc vàng ấm `#FFC857`, bóng mềm sát mặt bia; phát tiếng chuông ngọc (`bell`) **thăng tiến theo thang âm ngũ cung** (C5, D5, E5, G5, A5, C6) theo số lượng mảnh đã gắn trên bàn cờ.
   - **Trạng thái 3 — Vùng giao triệt tiêu (Overlap Inversion — 2 lớp):** Vùng giao thoa giữa 2 mảnh chuyển về màu nền tấm bia `#101B32` (triệt tiêu quang học trong $150\text{ ms}$); rãnh khuyết có viền sáng nhẹ báo hiệu cơ chế trừ hình có chủ đích. Thêm mảnh thứ ba làm vùng giao bừng sáng hiện lại (3 lớp = hiện).
   - **Trạng thái 4 — Mảnh tạm (Temporary Placement):** Thả ngoài bán kính snap, mảnh hiển thị viền đứt nét, độ mờ $60\%$ kèm nhãn chỉ dẫn *"Chưa đặt — chưa tính vào hình"*; phát tiếng chạm nhẹ (`tapSoft`). Kéo về khay hoặc bấm Đặt lại phát tiếng gió vút (`swish`).
   - **Trạng thái 5 — Hoàn thành màn (Victory Celebration — 2800 ms):** Viền tấm bia chạy vệt sáng dạ quang; các vòng thiên văn bừng sáng và tăng tốc xoay; hình ghép hoàn chỉnh phát quang nhẹ; **chuỗi pháo hoa sao dạ quang bùng nổ rực rỡ** đồng bộ cùng chuỗi **hợp âm C-major 4 nốt** (C5 → E5 → G5 → C6 arpeggio stinger); xuất hiện thẻ vinh danh mang tên biểu tượng cổ ngữ và câu ngạn ngữ chiêm tinh ngắn, cùng nút CTA khối vàng đặc *"Màn tiếp theo"*.

### 2.3. Tạm dừng, Cài đặt và Tiếp cận

Giao diện hộp thoại được thiết kế đồng bộ ngôn ngữ **"Tấm bia đá nhỏ viền kính bevel"** bo góc $24\text{ px}$, nổi trên lớp phủ mờ tối $55\%$ màu `#050A1A`, giữ được chiều sâu của bàn cờ bên dưới. Mở và đóng hộp thoại đều có âm thanh phản hồi trực quan (`open` / `close` cues).

1. **Bảng Tạm dừng (Pause Modal):**
   - Mở khi bấm nút Menu ở góc trên hoặc bấm phím Back vật lý của Android. Thao tác kéo dở dang được hủy an toàn về vị trí trước kéo; các mảnh đã snap được giữ nguyên vị trí.
   - Gồm 3 nút sắp xếp dọc theo thứ tự ưu tiên thị giác:
     1. **Tiếp tục chơi:** Khối vàng đặc `#FFC857` nổi bật nhất.
     2. **Chơi lại màn này:** Nút viền kính xanh.
     3. **Về chọn màn:** Nút văn bản tinh giản.
2. **Hộp thoại Cài đặt (Settings Modal):**
   - **Nhạc nền (Music Toggle):** Bật/tắt kênh stream nhạc nền thư giãn (mặc định bật); lưu vào bộ nhớ máy `localStorage`.
   - **Hiệu ứng âm thanh (SFX Toggle):** Bật/tắt toàn bộ âm thanh chuông ngũ cung, tiếng chạm, tiếng tick và chiến thắng (mặc định bật).
   - **Ngôn ngữ (Language Switcher):** Chuyển đổi tức thì giữa Tiếng Việt và English.
   - **Rung phản hồi (Haptics):** Bật/tắt xúc giác khi nhấc/snap/xoay mảnh; tự động ẩn nếu phần cứng thiết bị không hỗ trợ.
   - **Hình mẫu mờ trên bàn:** Bật/tắt bóng silhouette dưới mặt bia (mặc định bật); chỉ hỗ trợ quan sát trực tiếp, không làm thay đổi điều kiện chấm điểm.
   - **Giảm chuyển động (Reduced Motion):** Tắt các vòng thiên văn xoay nền và giảm hạt bụi sao cho người chơi nhạy cảm thị giác hoặc thiết bị cấu hình thấp.
   - **Xóa toàn bộ tiến trình:** Tách biệt hoàn toàn xuống đáy hộp thoại với chữ cảnh báo màu cam đỏ `#E65A5A`. Bắt buộc mở modal xác nhận $2$ bước ("Hủy" / "Xác nhận xóa") để ngăn chặn việc bấm nhầm với nút Đặt lại màn chơi.
3. **Tiếp cận & Tiêu chuẩn thao tác chạm:**
   - Mọi nút bấm và tương tác đều có diện tích chạm khả dụng $\ge 48 \times 48\text{ dp}$ (trên canvas $720\text{p}$, diện tích chạm tương đương $\ge 64\text{ px}$ đến $96\text{ px}$, nút tròn chính đạt $80\text{ px}$).
   - Thông tin trạng thái không chỉ dựa vào màu sắc mà luôn kết hợp hình dạng viền (viền liền, viền đứt, rãnh khuyết) và nhãn văn bản.
   - Tuân thủ khuyến nghị Android Edge-to-Edge: Các vùng tương tác cốt lõi nằm trọn trong Safe Area, không bị che khuất bởi thanh điều hướng hay phần khuyết màn hình.

### 2.4. Chính sách khi kẹt màn

MVP **không có hint và không có skip**; người chơi có thể kéo lại, trả khay, đặt lại hoặc về menu. Playtest không giảng luật trước cho người mới. Nếu **từ 2/5 người thử mới** dừng quá 3 phút ở cùng màn, hoặc **trên 30% lượt vào màn** kết thúc bằng thoát/đặt lại lặp từ ba lần trở lên trong mẫu beta đủ lớn, nhóm phải rà soát bóng mục tiêu, neo và FTUE của màn đó. Chỉ sau khi sửa màn và thử lại mà vẫn kẹt mới quyết định một hint **tự chọn** cho bản sau; không âm thầm đưa hint/skip vào MVP. Các ngưỡng này là tín hiệu điều tra, không tự động kết luận thiết kế thất bại.

---

## Chương 3 — Mỹ thuật và âm thanh

Mỹ thuật Mirror mang phong cách **"Tấm bia đá thiên văn cổ nhìn qua lớp kính"** (*Astrological Glass Stele*): huyền bí, sâu thẳm, sắc sảo và tĩnh lặng. Không sử dụng các chi tiết đồ họa răng cưa hay phong cách kỹ thuật khô cứng.

### 3.1. Hệ thống Ba Họ Màu Nghiêm Ngặt (Strict 3 Color Families)
Trò chơi sử dụng nghiêm ngặt 3 họ màu chủ đạo, tuyệt đối loại bỏ các màu ngoại lai (như xanh lá cây, teal cũ `#4ECDC4`) và viền 1px mờ nhạt:

| Họ màu | Mã Hex | Ứng dụng cụ thể trong giao diện |
|---|---|---|
| **Họ Navy** | `#080E24` | Nền vũ trụ sâu thẳm (gradient chuyển sắc dọc) |
| | `#101B32` | Mặt đá tấm bia chơi, nền khay chứa mảnh |
| | `#050A1A` | Nền tối sâu không gian vũ trụ, lớp phủ nền modal |
| **Họ Kính Xanh Trắng** | `#68B8DC` | Viền kính chính (dày 8–10px, bo góc 36px, hiệu ứng mài vát bevel) |
| | `#CFEFFF` | Điểm phản quang sáng (Bevel highlight) ở cạnh trên khung kính |
| | `#3A5E78` | Rãnh bóng tối ở cạnh dưới khung kính (Bevel shadow) |
| **Họ Vàng Hổ Phách** | `#FFC857` | Mảnh kính đã snap, khối nút chính (CTA "Tiếp tục", "Màn tiếp theo") |
| | `#D4A359` | Lưới tọa độ bàn cờ, viền phụ đứt nét bên trong tấm bia, đường nối chòm sao |
| | `#FFE8A6` | Viền highlight phát quang của mảnh ghép, ánh sáng thức tỉnh cổ ngữ |

- **Độ tương phản chuẩn WCAG AA:** Chữ chính dùng `#EEF4FA`, chữ phụ `#9DAFC7`, đảm bảo tỉ lệ tương phản $\ge 4.5:1$ trên toàn bộ nền tối.
- **Màu cảnh báo (Duy nhất tại hộp thoại xóa dữ liệu):** Chữ cảnh báo `#E65A5A`, nền xác nhận `#5A1A1A`.

### 3.2. Typography & Đóng gói Offline
- **Tiêu đề, Tên màn & Thương hiệu:** **Baloo 2** (SemiBold / ExtraBold) — Nét vẽ bo tròn ấm áp, thân thiện, đậm chất casual huyền bí, hỗ trợ tiếng Việt hoàn hảo với các dấu thanh sắc nét.
- **Giao diện & Chú thích:** **Be Vietnam Pro** (Sans-serif) — Nét chữ thanh thoát, độ rõ nét cao ở kích thước nhỏ trên màn hình di động.
- **Quy tắc hiển thị:** Viết hoa chữ cái đầu (Title Case) hoặc Sentence case; **tuyệt đối không dùng toàn bộ chữ in hoa (ALL-CAPS)** trên giao diện. Cỡ chữ giao diện $\ge 14\text{ sp}$, chú thích $\ge 12\text{ sp}$.
- **Đóng gói Offline 100%:** Toàn bộ font chuyển sang định dạng WOFF2/TTF cục bộ trong `public/assets/fonts/`, nạp hoàn toàn qua CSS `@font-face` không phụ thuộc mạng bên ngoài.

### 3.3. Hệ thống Lưới toạ độ Chiêm tinh & Đồ họa Vector Phẳng
1. **Lưới toạ độ vàng hổ phách (`#D4A359` mờ):** Các đường kẻ mảnh ngang dọc phân tách từng cụm 8 ô lưới ($32\text{ px}$), giúp người chơi ước lượng vị trí và vùng snap một cách tự nhiên.
2. **Chấm giao điểm toạ độ (Grid Intersection Dots):** Các chấm tròn vàng mờ tại mỗi giao điểm của hệ lưới, tạo cảm giác một bàn cờ cơ khí/thiên văn cổ đại tinh xảo.
3. **Vòng tròn ma trận thiên văn (Celestial Dial Rings):** Vòng tròn đồng tâm viền xanh cyan dạ quang và vàng đứt nét bao bọc phía sau bàn chơi, điểm xuyết các ký tự rune phương vị tại $0^\circ, 90^\circ, 180^\circ, 270^\circ$, tự xoay chậm ngược chiều nhau để tạo chiều sâu.
4. **Đồ họa Vector phẳng sắc nét:** Khử hoàn toàn hiện tượng răng cưa bậc thang (*stair-step pixel aliasing*); hình thoi và các mảnh ghép được dựng bằng vector polygon phẳng mượt mà kèm hiệu ứng viền sáng nhẹ, tiếp giáp đỉnh và cạnh thẳng tắp.

[Bàn luận style Galaxy](../testing/mirror-play-screen-style.md) và [hình tham khảo play screen](assets/galaxy_glass_layered_landscape_play_screen.svg) chỉ là **tham khảo mỹ thuật** cho không khí, chất liệu kính, bảng màu và lớp phong cảnh. GDD này là chuẩn cho luật chơi, bố cục, trạng thái nút và phản hồi tương tác. Chi tiết trong hai file tham khảo khác GDD không tự trở thành quyết định thiết kế; việc áp dụng một hướng art cụ thể cần review và kiểm tra khả năng đọc trên điện thoại.

### 3.4. Hệ thống Âm thanh Tổng hợp (WebAudio Synth Engine) & Thiết kế Game Feel

Hệ thống âm thanh của Mirror được xây dựng với nguyên lý **"Nhẹ tuyệt đối, Phản hồi tức thì, Giai điệu tương tác"**, loại bỏ hoàn toàn các file mẫu âm thanh (sample files) cồng kềnh cho SFX, thay vào đó tổng hợp trực tiếp bằng thuật toán DSP thời gian thực.

#### 3.4.1. Bộ Tổng Hợp Âm Thanh DSP Thuần TypeScript (Zero-Sample SFX Engine)
- Toàn bộ 8 hiệu ứng âm thanh cốt lõi được định nghĩa bằng mã nguồn TypeScript (`game-next/src/audio-synth/`) với các tham số dao động sóng (waveform), bao sóng biên độ ADSR (Attack-Decay-Sustain-Release), bộ lọc tần số (biquad filter) và hòa âm điều chế tần số (FM/harmonic modulation):
  1. **`bell` (Chuông ngọc vũ trụ):** Âm thanh trong trẻo, ngân vang dịu nhẹ khi mảnh ghép khớp vào lưới toạ độ (snap).
  2. **`tapSoft` (Chạm nhẹ):** Tiếng gõ tiếp xúc thanh thoát khi đặt mảnh vào vị trí tạm hoặc chạm vào các nút điều khiển.
  3. **`tick` (Lách cách thiên văn):** Tiếng click cơ khí ngắn gọn khi nhấc mảnh lên hoặc xoay mảnh $90^\circ$.
  4. **`swish` (Gió vút):** Tiếng lướt êm ái khi mảnh bay về khay hoặc thực hiện đặt lại bàn chơi (reset).
  5. **`thud` (Va chạm trầm):** Tiếng dội trầm đầm ấm khi thao tác bị từ chối hoặc chạm vào màn chơi bị khóa.
  6. **`shimmer` (Ánh sao lấp lánh):** Âm sắc dạ quang huyền ảo khi mở khóa màn chơi mới trên bản đồ chòm sao.
  7. **`stingerWin` (Hợp âm khải hoàn):** Chuỗi hòa âm arpeggio rực rỡ khi hoàn thành màn chơi.
  8. **`hollow` (Hồi âm rỗng):** Tiếng chuông rỗng cộng hưởng cho các tương tác phủ định hoặc đóng cửa sổ.
- **Audio Lab (`/audiolab.html`):** Công cụ phát triển trực quan tích hợp sẵn trong game dev-server, cho phép nhà thiết kế âm thanh tinh chỉnh waveform, thời gian envelope, tần số lọc bằng thanh trượt trực quan và sao chép cấu hình thành mã TypeScript chỉ với một cú nhấp chuột.

#### 3.4.2. Giai Điệu Ngũ Cung Tương Tác Khi Snap (Pentatonic Scale Progression)
- Để tạo cảm giác người chơi đang "dệt nên giai điệu" khi giải đố, mỗi lần một mảnh ghép được snap thành công, cao độ của âm thanh `bell` sẽ thăng tiến theo **thang âm ngũ cung tự nhiên** (`PENTATONIC_STEPS`):
  $$\text{C5} (523.25\text{ Hz}) \;\longrightarrow\; \text{D5} (587.33\text{ Hz}) \;\longrightarrow\; \text{E5} (659.25\text{ Hz}) \;\longrightarrow\; \text{G5} (783.99\text{ Hz}) \;\longrightarrow\; \text{A5} (880.00\text{ Hz}) \;\longrightarrow\; \text{C6} (1046.50\text{ Hz})$$
- Nốt nhạc được chọn tương ứng với số lượng mảnh đã đặt trên bàn cờ. Mảnh đầu tiên phát nốt C5, mảnh tiếp theo nâng lên D5, E5... mang lại sự thỏa mãn thính giác dâng trào khi câu đố dần được giải quyết trọn vẹn.

#### 3.4.3. Hợp Âm Khải Hoàn Chiến Thắng (Victory Arpeggio Stinger)
- Khi toàn bộ silhouette được khớp hoàn hảo, game kích hoạt chuỗi hợp âm **C-Major Arpeggio 4 nốt**:
  $$\text{C5} \;\xrightarrow{90\text{ ms}}\; \text{E5} \;\xrightarrow{90\text{ ms}}\; \text{G5} \;\xrightarrow{90\text{ ms}}\; \text{C6}$$
- Chuỗi âm thanh vang lên rộn rã, đồng bộ tuyệt đối cùng thời điểm pháo hoa sao dạ quang bùng nổ trong chuỗi vinh danh $2800\text{ ms}$.

#### 3.4.4. Cấu Trúc Nhạc Nền Streaming 2 Kênh (Dual-Channel Music Port)
- Hệ thống hỗ trợ phát 2 bản nhạc ambient độc lập với cơ chế chuyển tiếp âm lượng (crossfade) mượt mà không gây ngắt quãng:
  - **`music-sky`:** Nhạc nền không gian tĩnh lặng, mênh mang dành cho Màn hình chính (Main Menu) và Bản đồ chòm sao (Level Select).
  - **`music-stele`:** Nhạc nền tập trung, sâu lắng dành cho Tấm bia giải đố (PlayScene).
- **Tự động quản lý vòng đời (App Lifecycle):** Nhạc và âm thanh tự động ngắt khi chuyển tab hoặc ứng dụng chạy ngầm trên Android/iOS, phục hồi êm ái khi người chơi quay lại.

#### 3.4.5. Tối Ưu Hiệu Năng và Tiếp Cận
- Giới hạn tối đa 6 luồng âm thanh đồng thời (`MAX_SFX_VOICES = 6`) với cơ chế ngắt lặp lại ngắn dưới $30\text{ ms}$ (`REPEAT_GUARD_MS`) để tránh hiện tượng dội âm khi chạm nhanh nhiều lần.
- Mọi âm thanh đều có thể tắt độc lập qua Cài đặt (Nhạc nền / SFX). Mọi sự kiện gameplay cốt lõi đều đi kèm phản hồi thị giác và rung xúc giác (haptics), đảm bảo người chơi khiếm thính hoặc chơi ở chế độ im lặng vẫn tận hưởng trải nghiệm trọn vẹn.

---

## Chương 4 — Campaign và hệ thống

### 4.1. Cấu trúc 28 màn

Bốn chương, 6 + 6 + 10 + 6 màn (`game-next/src/content/manifest.ts`, `order` 1 → 28). Hiện tại **22 màn chơi đầu tiên (Chương 1, 2 và 3) đã được tác giả hoàn thiện, kiểm chứng nghiệm duy nhất bằng solver và chính thức phê duyệt (`approved`)**:
1. **Khởi nguyên — Ghép hình tiếp giáp** (1-1 đến 1-6): Làm quen kéo, thả, snap và giải đố hình học tạo biểu tượng cổ ngữ hoàn chỉnh; các mảnh tiếp giáp cạnh/chạm đỉnh, **hoàn toàn không xếp chồng**. *(Đã phê duyệt 6/6 màn).*
2. **Giao thoa — Bí ẩn vùng giao** (2-1 đến 2-6): Giới thiệu cơ chế "phép trừ" và chẵn-lẻ (parity): hai mảnh chồng nhau tạo hoa văn rỗng (2 lớp), ba mảnh chồng nhau làm hạt nhân ngọc hiện lại (3 lớp). *(Đã phê duyệt 6/6 màn).*
3. **Họa Phẩm — Tranh ghép nghệ thuật** (3-1 đến 3-10): Tranh kiểu Tangram ghép từ vuông, tam giác lớn/nhỏ, thoi, tròn và bình hành; luật chẵn lẻ tạo chi tiết rỗng (mắt, cửa, vầng sáng) và chi tiết hiện lại. Không xoay. *(Đã phê duyệt 10/10 màn).*
4. **Luân chuyển — Xoay chuyển định hướng** (4-1 đến 4-6): Mở khóa nút Xoay ↻ 90° kết hợp với quy luật giao thoa để hoàn thiện các đại ấn cổ ngữ đa hướng. *(Sẵn sàng triển khai).*

Chỉ Chương 4 bật `rotationEnabled`; validator báo `chapter-rotation-disabled` nếu màn chương 1–3 bật xoay và `chapter-rotation-required` nếu màn chương 4 tắt xoay. Bản phát hành (`npm run content:validate -- --release`) cần đủ 28 màn `approved` (hiện đạt 22/28 màn).

1-1 mở sẵn; hoàn thành một màn lưu tiến độ cục bộ và mở màn kế. Người chơi có thể chơi lại màn đã hoàn thành. Không có tài khoản, cloud, leaderboard, quảng cáo, IAP, tiền ảo hoặc booster. Custom Level là tính năng phụ từ prototype, không là điều kiện nghiệm thu campaign; nếu giữ, dữ liệu của nó tách khỏi tiến độ 28 màn.

Phụ lục A là **level sheet có hình và định nghĩa tạo hình cho sáu màn nền tảng** theo hệ thống Cổ Ngữ Tiên Tri mới. Phụ lục B là **khung thiết kế cho 22 màn** mở rộng (1-4 → 1-6, 2-4 → 2-6, Họa Phẩm 3-1 → 3-10, Luân Chuyển 4-1 → 4-6). Mọi màn trong bản phát hành đều đảm bảo có một nghiệm hợp lệ duy nhất, ít nhất một lựa chọn sai có ý nghĩa, bóng mục tiêu giàu tính nghệ thuật biểu tượng và chơi lại được.

### 4.2. Lưu tiến độ và lỗi

Lưu tối thiểu `version` và danh sách ID màn hoàn thành; màn mở khóa suy ra theo thứ tự campaign. Nếu dữ liệu lưu lỗi/không đọc được, game vẫn mở màn 1-1 và báo ngắn “Không đọc được tiến độ cũ”. Không ghi đè dữ liệu Custom Level khi khôi phục campaign. Chơi level tự tạo không mở khóa campaign. Mọi thao tác lưu phải chạy offline.

### 4.3. Ranh giới giai đoạn sau

Chương 5 trở đi, mảnh nhiều màu, quy tắc giao giữa khác màu, tia sáng/pha màu, iOS, tài khoản và dịch vụ trực tuyến nằm ngoài MVP. Với đỏ + xanh giao nhau, hai hướng **pha thành màu mới** hoặc **hiện màu mảnh trên cùng** vẫn chưa được chọn và chỉ xem xét khi thiết kế giai đoạn sau. Quy tắc hai mảnh **cùng màu** làm vùng giao biến mất vẫn là nền tảng cần giữ.

---

## Chương 5 — Kỹ thuật, đo lường và quyết định

### 5.1. Nền tảng và bố cục

Sản phẩm tái thiết kế chính thức được xây dựng trong thư mục `game-next/` với cấu trúc công nghệ hiện đại: **Phaser 3.90 + TypeScript 5.7 + Vite 6 + Vitest 2**, đóng gói Android bằng **Capacitor 8**. Canvas thiết kế $720 \times 1280$ (tỷ lệ chuẩn $9:16$). Bàn chơi (tấm bia) logic $128 \times 160$ ô ở $4\text{ px/ô}$; khay mảnh và hàng nút điều khiển được quản lý bởi hệ thống bố cục co giãn đàn hồi **Elastic Vertical Layout** kết hợp CSS Safe Area Insets để tự thích ứng với các màn hình Android dài từ $16:9$ đến $21:9$. Android project hiện đặt `minSdkVersion = 24` (Android 7.0), `targetSdkVersion = 36`. Ứng dụng hoạt động hoàn toàn offline, tải nhanh dưới $2\text{ giây}$ và tiết kiệm pin tối đa.

### 5.2. Sự kiện đo lường và KPI

MVP offline: lưu **log playtest cục bộ/ẩn danh** hoặc ghi quan sát thủ công; không tích hợp dịch vụ analytics hay truyền dữ liệu ra ngoài nếu chưa có quyết định riêng. Mỗi bản ghi dùng ID phiên ngẫu nhiên, ID màn và mốc thời gian tương đối, không cần tên hay danh tính người chơi.

| Sự kiện | Trường tối thiểu | Mục đích |
|---|---|---|
| `session_start`, `session_end` | session_id, elapsed_ms, lý do kết thúc | Thời lượng phiên và nơi dừng |
| `level_start`, `level_complete`, `level_exit` | level_id, elapsed_ms, số lần reset | Tỷ lệ hoàn thành từng màn |
| `piece_drop` | level_id, piece_id, snapped/temporary/tray | Phân biệt vướng thao tác với vướng giải đố |
| `piece_rotate`, `level_reset` | level_id, số lần | Nhận biết khó khăn với xoay/đặt lại |
| `ftue_step_seen`, `ftue_step_done` | level_id, step_id | Kiểm tra người mới có dùng chỉ dẫn không |

| KPI | Cách tính | Mục tiêu thiết kế ban đầu |
|---|---|---|
| Khởi động tự nhiên | Số người mới kéo mảnh trong 10 giây / số người thử | Ít nhất **4/5** người trong test quan sát đầu tiên |
| Hiểu luật giao | Số người giải thích đúng 2 lớp trống, 3 lớp hiện và tự hoàn thành 2-3 | Ít nhất **3/5** người trong test quan sát đầu tiên |
| Hoàn thành màn | `level_complete / level_start` theo từng màn | Màn 1-1 đến 1-3: **≥80%**; 2-3: **≥60%** trong beta, xem cùng số mẫu |
| Thời lượng | Trung vị thời gian từ `session_start` đến `session_end`; báo thêm trung vị từng màn hoàn thành | **2–5 phút/phiên** ở nhóm màn đầu; đo thực tế rồi điều chỉnh |
| Quay lại ngày sau (D1) | Người mở game ngày kế / người mở game ngày đầu | Theo dõi trong beta; **chưa đặt ngưỡng ra quyết định** khi chưa có mẫu và kênh tuyển người ổn định |

Đừng suy ra retention từ năm người thử trực tiếp; nhóm đó dùng để tìm lỗi hiểu luật và thao tác. Với beta, báo cả tử số/mẫu số và phân nhóm người mới/quay lại, không chỉ báo phần trăm. Các KPI trên là **đích để kiểm chứng**, không phải kết quả đã đo.

### 5.3. Trạng thái giải quyết rủi ro và các mốc hoàn thành

| Chủ đề | Trạng thái kỹ thuật & thiết kế hiện tại |
|---|---|
| **22 màn mở rộng** | **ĐÃ HOÀN THÀNH & DUYỆT:** 22 màn của Chương 1, 2 và 3 đã có mã nguồn, nghiệm duy nhất được chứng minh bằng solver XOR tự động, chạy qua validator kiểm tra 100% (`content:validate`). |
| **Hệ thống âm thanh** | **ĐÃ HOÀN THÀNH:** Bộ tổng hợp âm thanh WebAudio Synth thuần TypeScript với 8 patch âm thanh, giai điệu ngũ cung khi snap, stinger chiến thắng C-Major và 2 kênh streaming nhạc nền đã tích hợp hoàn hảo. |
| **Chuyển động & Game Feel** | **ĐÃ HOÀN THÀNH:** Bộ điều phối phản hồi `FeedbackDirector`, chuỗi ăn mừng chiến thắng $2800\text{ ms}$ pháo hoa dạ quang, kéo thả đàn hồi và hiệu ứng chuyển cảnh mượt mà. |
| **Snap 6 ô & Ưu tiên neo** | **ĐÃ ĐỒNG BỘ:** Thuật toán tính khoảng cách Euclid và ưu tiên neo theo thứ tự định nghĩa của tác giả màn chơi đã được chuẩn hóa trong kernel logic. |
| **Bố cục & Safe Area** | **ĐÃ ĐỒNG BỘ:** Bố cục Elastic Layout tự động điều chỉnh tọa độ $Y$ theo chiều cao màn hình thực tế, tương thích Edge-to-Edge trên Android. |
| **Gate G2** | Đã hoàn thành các điều kiện kỹ thuật âm thanh và gameplay feedback, sẵn sàng cho phiên nghiệm thu toàn diện trên thiết bị thật. |

### 5.4. Nguồn truy vết

Quyết định phạm vi và kiến trúc giao diện đến từ [spec MVP](../superpowers/specs/2026-09-21-mirror-mvp-gdd.md), [đặc tả UI Tấm Bia Tiên Tri](../superpowers/specs/2026-10-01-ui-redesign-divination-disc.md), [kế hoạch triển khai UI](../superpowers/plans/2026-10-01-ui-redesign-divination-disc.md), [idea sheet](../concept/idea-sheet.md) và [ghi chú giao cùng/khác màu](../concept/same-color-overlap-note.md). Bằng chứng sáu màn xem [kiểm chứng prototype](../testing/2026-09-17-mirror-redesign.md). Cấu trúc năm chương theo `.agent/workflow-v2/phase-02-gameplay-systems`. Những file `docs/concept/brief.md` và `docs/concept/g1-validation-signoff.md` trong quy trình chưa có trong repo; nội dung thiết kế không phụ thuộc việc mở các file đó để hiểu luật hoặc campaign.

---

## Phụ lục A — Level sheet sáu màn Cổ Ngữ Tiên Tri nền tảng

**Cách đọc:** Biểu tượng được thiết kế theo cảm quan Cổ ngữ &amp; Chiêm tinh (Amphoreus / Honkai Star Rail). Chương 1 là **ghép tiếp giáp không xếp chồng**; Chương 2 là **giao thoa triệt tiêu tạo hoa văn rỗng và hồi sinh hạt nhân**. `(x,y)` là neo gốc khung mảnh trên lưới 128 × 160 (neo là bội của 8); mọi mảnh Chương 1 dùng khung 48 ô. Tam giác là tam giác vuông cân; ô nằm đúng trên cạnh tính theo quy tắc trên-trái chung cho mọi hình (spec 2026-10-02). `↻` là số nấc 90° theo chiều kim đồng hồ.

![Sáu bóng mục tiêu Cổ Ngữ Tiên Tri mẫu](assets/level-silhouettes.svg)

| Màn / Vai trò | Mảnh | Bóng mục tiêu và mô tả tạo hình | Cơ chế hình học & Điểm nhấn | Khó dự đoán |
|---|---|---|---|---|
| **1-1 Song Tinh** *(Twin Stars)* · học kéo/thả, snap lưới | 2: thoi 48, thoi 48 | Hình A1: Hai viên ngọc thoi đặt cạnh nhau, chạm đỉnh tại tâm bàn (64, 80). Neo A (16,56) và (64,56). | **Không xếp chồng.** Tiếp giáp đỉnh `◆◆`. Biểu tượng cân bằng sơ khởi của vũ trụ. Revision `song-tinh-v2`. | 1/5 |
| **1-2 Bảo Tháp Tiên Tri** *(Sacred Spire)* · phối hợp hai khối | 1: vuông 48, 1: tam giác 48 (mái, hướng 4) | Hình A2: Khối vuông (40,64) làm chân tháp, mái (40,16) ngồi trọn trên cạnh trên. | **Không xếp chồng.** Tiếp giáp cạnh (đáy mái = cạnh trên vuông, y = 64). FTUE: "Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu". | 1/5 |
| **1-3 Cánh Chim Báo Điềm** *(Astral Wing)* · đối xứng trục | 2: tam giác 48 (hướng 3 và 2) | Hình A3: Đôi cánh giương, mũi cánh ở (16,56) và (112,56), hai cạnh huyền dốc vào giữa. | **Không xếp chồng.** Hai cánh chạm tại một đỉnh (64,104), không chung cạnh dọc (chung cạnh dọc chỉ ra một tam giác lớn). Đổi chỗ hai cánh cho ra kim tự tháp, sai bóng. | 2/5 |
| **2-1 Mũi Tên Chỉ Thiên** *(Vanguard Arrow)* · bước ngoặt xếp chồng | 2: mái 96 (hướng 4), mái 48 (hướng 4) | Mái nhỏ (40,64) lồng vào đáy mái lớn (16,16); phần giao biến mất để lại mũi tên chevron Λ. | **Xếp chồng 2 lớp:** vùng giao ẩn. FTUE `two-layers`: "Hai mảnh cùng màu: vùng giao biến mất". | 2/5 |
| **2-2 Cánh Bướm Điệp Ảnh** *(Oracle Butterfly)* · tâm rỗng đối xứng | 2: tam giác mái 96 (hướng 5 và 7) | Hai cánh (32,32) và (0,32) đâm mũi qua nhau thành nơ bướm có tâm thoi rỗng 32 ô. | **Xếp chồng 2 lớp:** căn độ sâu giao để tạo khoảng rỗng cân bằng. | 3/5 |
| **2-3 Trái Tim Tinh Thể** *(Crystal Core)* · quy tắc 3 lớp hiện lại | 3: nơ của 2-2 + thoi 16 (56,72) | Viên ngọc đặt vào tâm rỗng của nơ: hạt nhân hiện lại giữa vòng rỗng. | **Xếp chồng 3 lớp:** vùng đó hiện lại. FTUE `three-layers`: "Thêm mảnh thứ ba: vùng đó hiện lại". | 3/5 |

---

## Phụ lục B — Khung thiết kế cho 22 màn Cổ Ngữ Tiên Tri mở rộng

Mỗi màn mang một hình tượng cổ ngữ xác định trong vũ trụ chiêm tinh, đảm bảo bóng mục tiêu luôn giàu ý nghĩa nghệ thuật.

**Tiến độ thực tế:** 16 màn mở rộng đầu tiên thuộc Chương 1 (1-4 → 1-6), Chương 2 (2-4 → 2-6) và Chương 3 Họa Phẩm (3-1 → 3-10) đã hoàn thành tạo nguồn mã nguồn tại `src/content/sources/`, biên dịch thành JSON và chính thức đạt trạng thái `approved` (chứng minh nghiệm duy nhất bằng solver). Sáu màn thuộc Chương 4 (4-1 → 4-6 Luân Chuyển) là nhóm màn mở khóa cơ chế xoay 90° tiếp theo của campaign.

| Màn | Tên Biểu Tượng Cổ Ngữ | Vai trò sư phạm & Ràng buộc hình học | Mảnh dự kiến |
|---|---|---|---|
| **1-4** | **Ngọn Hải Đăng** *(The Pharos)* | Ghép tiếp giáp 3 khối theo trục đứng x = 64: mái (40,0), đèn thoi (40,48), đế vuông (40,96); chạm đỉnh–cạnh, không xếp chồng | 3: tam giác (mái), thoi, vuông |
| **1-5** | **Chiếc Thuyền Sao** *(Astral Barque)* | Thân vuông (16,80) + mũi tam giác hướng 0 (64,80) áp cạnh phải thân + buồm tam giác hướng 3 (40,32) ngồi trên mép trên; không xếp chồng | 3: vuông, 2 tam giác |
| **1-6** | **Vương Miện Bình Minh** *(Crown of Dawn)* | Đôi cánh của 1-3 + viên thoi (40,56) lấp vừa khe giữa: ba đỉnh cao bằng nhau tại x = 16, 64, 112; kết thúc Chương 1. Dùng thoi thay vuông vì ba mảnh khung 48 xếp ngang rộng 144 > 128 | 3: 2 tam giác, thoi |
| **2-4** | **Mắt Tiên Tri** *(Eye of the Oracle)* | Hai thoi 64 (16,48) và (48,48) lồng ngang thành mí mắt; vùng giao rỗng ôm con ngươi thoi 16 hiện lại | 3: 2 thoi 64, thoi 16 |
| **2-5** | **Đồng Hồ Cát** *(Hourglass)* | Vòng tròn rỗng (tròn 64 trừ tròn 48) ôm đồng hồ cát hai mái 32 hiện lại ba lớp. Thay bản Chìa Khóa Thời Gian | 4: tròn 64, tròn 48, 2 mái 32 |
| **2-6** | **Đại Ấn Hộ Mệnh** *(Grand Sigil)* | Bốn mảnh chung tâm (64,80): vuông 64, thoi 64, vuông 32, thoi 32 — bốn tầng chẵn lẻ xen kẽ; kết Chương 2 | 4: 2 vuông, 2 thoi |

### Chương 3 — Họa Phẩm (10 màn)

Tranh nghệ thuật ghép từ vuông, tam giác vuông lớn/nhỏ, thoi, tròn và bình hành, dùng luật chẵn lẻ để tạo chi tiết rỗng. Toạ độ đầy đủ ở spec `2026-10-02-c-chapter-2-hoa-pham-levels-design.md`.

| Màn | Tên | Hình và hiệu ứng bóng | Mảnh |
|---|---|---|---|
| **3-1** | Nhật Nguyệt Song Huyền | Hai vầng tròn lồng nhau, thấu kính rỗng, ngôi sao hiện lại | 2 tròn 64, thoi 16 |
| **3-2** | Đền Tiên Tri | Mái, thân, cửa vuông rỗng, cửa sổ tròn rỗng | mái 96, vuông 64, vuông 32, tròn 16 |
| **3-3** | Cá Chép Sao | Thân thoi, đuôi, mắt tròn rỗng, miệng rỗng | thoi 64, 2 tam giác, tròn 16 |
| **3-4** | Ngọn Nến | Quầng sáng tròn ôm ngọn lửa âm bản | 2 vuông 32, thoi 32, tròn 64 |
| **3-5** | Thuyền Buồm Hoàng Hôn | Mặt trời lặn sau cánh buồm | 3 tam giác, tròn 32 |
| **3-6** | Mèo Thần | Hai mắt rỗng, đuôi bình hành | 7 mảnh |
| **3-7** | Hoa Sen | Đường rỗng tách cánh, mặt nước bình hành | thoi 48, 2 tam giác, 2 bình hành |
| **3-8** | Kim Tự Tháp Nhật Thực | Cửa tam giác rỗng, nhật thực hai tròn | mái 128, mái 32, 2 tròn 32 |
| **3-9** | Sao Bát Phương | Sao tám cánh, bát giác rỗng, mặt trời hiện lại | vuông 48, thoi 64, tròn 32 |
| **3-10** | Mandala Thiên Cầu | Năm tầng chẵn lẻ chung tâm; kết chương | 2 tròn, vuông, 2 thoi |

### Chương 4 — Luân Chuyển (6 màn, xoay)

Đổi mã từ 3-1 → 3-6 cũ; tên và vai trò giữ nguyên.

| Màn | Tên Biểu Tượng Cổ Ngữ | Vai trò sư phạm & Ràng buộc hình học | Mảnh dự kiến |
|---|---|---|---|
| **4-1** | **La Bàn Gió** *(Anemoi Needle)* | Mở khóa nút Xoay ↻: Xoay tam giác lệch 90° để chỉ đúng hướng gió | 2-3 mảnh, 1 nấc xoay |
| **4-2** | **Lưỡi Kiếm Thiên Thể** *(Celestial Blade)* | Phân biệt đúng góc xoay với đúng vị trí neo | 3 mảnh, xoay 90°/180° |
| **4-3** | **Cánh Cung Chiêm Tinh** *(Sagittarius Bow)* | Dùng nhiều nấc xoay để tạo độ cong và dây cung | 3 mảnh |
| **4-4** | **Bánh Xe Số Phận** *(Rota Fortunae)* | Xoay 4 mảnh quanh tâm tạo bánh xe 4 nan hoa rỗng | 4 mảnh |
| **4-5** | **Thánh Giá Thiên Cầu** *(Celestial Cross)* | Xoay để tạo vùng giao 3 lớp phát sáng tại tâm chữ thập | 4 mảnh |
| **4-6** | **Đại Ấn Tiên Tri** *(The Grand Oracle Seal)* | Tổng hợp đỉnh cao: Placement + Xếp chồng 2/3 lớp + Xoay 90°; hoàn tất campaign | 4 mảnh |

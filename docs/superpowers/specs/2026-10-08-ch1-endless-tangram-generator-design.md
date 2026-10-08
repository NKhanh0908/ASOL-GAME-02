# Đặc tả thiết kế: Kho màn Endless Chương 1 (Tangram Pool, sinh offline)

- **Ngày tạo**: 2026-10-08 (sửa lại cùng ngày: chuyển từ sinh trên client sang sinh offline)
- **Trạng thái**: Draft, chờ reviewer duyệt
- **Chủ đề**: Kho màn "Endless" Chương 1 (Tangram: ghép cạnh, cấm chồng đè, không xoay), sinh sẵn trên máy dev và đóng gói vào app. Không cần server.
- **Tài liệu liên quan**:
  - `docs/content/level-kit.md` (Level Kit, luật Chương 1, KIT-03)
  - `game-next/src/content/solver.ts` (`solveLevel`)
  - `game-next/src/content/difficulty.ts` (`scoreDifficulty`)
  - `game-next/src/content/validate.ts` (cổng kiểm tra màn)
  - `game-next/src/domain/shapes.ts` (`isValidFrame`, `shapePolygon`)

---

## 1. Mục tiêu & Phạm vi

### 1.1 Mục tiêu
1. **Serverless hoàn toàn:** không server, không tài khoản, không cần mạng. Kho màn nằm trong bản cài; tiến trình lưu `localStorage`.
2. **Đủ nhiều, không cần vô hạn:** mục tiêu **khoảng 500 màn** khác nhau thật sự (xem 4.3); thử nghiệm trước với **50 màn**, tách riêng khỏi game (`game-next/experiments/endless-ch1/`).
3. **Khó ngay từ đầu:** mọi màn có **4–6 mảnh**.
4. **Chắc chắn đúng:** mọi màn trong kho có `solutionCount === 1`, `fewerPieceSolutions === 0`, qua `validate`. Kiểm tra toàn bộ kho bằng một lệnh, không dựa vào xác suất.
5. **Chạy mượt:** ở runtime chỉ giải nén và chọn màn, không sinh, không giải.

### 1.2 Ngoài phạm vi (v1)
- Sinh màn trên thiết bị.
- Tải thêm màn từ CDN (có thể bổ sung sau, định dạng kho giữ nguyên nên không phải thiết kế lại).
- Chương khác (có xoay, chồng đè).

### 1.3 Ràng buộc luật Chương 1
- **Cấm chồng đè:** mọi ô có độ phủ ≤ 1.
- **Không xoay:** `rotationEnabled: false`.
- **Neo rời rạc:** mỗi mảnh có 1 neo đúng (A) và 2–3 neo nhiễu (B, C, D). Neo là gốc khung (góc trên-trái), bội của 8, trong bàn 128 × 160.
- Mảnh phải nằm trọn trong vùng đệm bàn (đỉnh trong x ∈ [8, 120], y ∈ [8, 152]).

---

## 2. Kiến trúc tổng thể

```
┌────────────────────────── MÁY DEV (Node) ──────────────────────────┐
│ npm run pool:generate -- --count 5000 --seed 1                     │
│                                                                    │
│  1. Lắp ghép ngược: dựng silhouette từ 4–6 mảnh ghép cạnh          │
│  2. Neo nhiễu: false-fit + nudge (±8, ±16), áp KIT-03              │
│  3. Cổng: dựng LevelDocument → solveLevel → validate → scoreDifficulty│
│  4. Dedupe theo silhouette chuẩn hoá (gương X tính là một)         │
│  5. Xếp theo độ khó, đóng gói  →  src/content/pool/ch1.pool        │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ commit file pool (tạo lại được từ seed)
                                 ▼
┌──────────────────── THIẾT BỊ (web / Android) ──────────────────────┐
│  Giải nén màn theo chỉ số → LevelDocument → scene play             │
│  Chọn màn: theo độ khó + streak + lịch sử đã chơi (localStorage)   │
└─────────────────────────────────────────────────────────────────────┘
```

Nguyên tắc: **generator là công cụ build, không phải code runtime.** Vì vậy không còn ràng buộc thời gian < 20ms hay retry 3 lần; máy dev thử bao nhiêu ứng viên cũng được và chỉ giữ màn đạt.

---

## 3. Sinh màn (chạy offline)

### 3.1 Bộ mảnh cho phép
**Không hardcode.** Palette được dựng từ `isValidFrame(kind, orientation, frameSize)` trong `shapes.ts` rồi lọc theo danh sách ưu tiên Chương 1:
- vuông, tam giác vuông cân (hướng 0–3), mái (hướng 4–7), hình bình hành, thoi (làm điểm xuyết);
- kích thước khung nằm trong tập hợp lệ của từng hình (ví dụ mái chỉ khung chia hết cho 16).

Nhờ vậy khi `shapes.ts` đổi luật khung, palette tự đúng theo.

### 3.2 Lắp ghép ngược (Frontier Edge-Matching)
1. Đặt mảnh gốc gần tâm bàn (64, 80).
2. Lặp tới đủ 4–6 mảnh: chọn một cạnh biên, thử mảnh ứng viên có cạnh khớp (hoặc là đoạn con), áp sát hoàn toàn.
3. **Kiểm tra va chạm bằng mask raster** (`shapeCells`) của chính `shapes.ts`, không bằng hình học xấp xỉ: mask mảnh mới giao mask đã có phải rỗng.
4. **Cạnh chéo 45°:** hai mảnh chung cạnh huyền phải khớp từng ô sau khi rasterize. Kiểm tra bằng mask đã nêu ở bước 3; ứng viên để lại khe hoặc lệch bậc thang thì loại.
5. Silhouette (target) = hợp mask các mảnh. Vị trí ghép của mỗi mảnh là neo A.

### 3.3 Chọn ứng viên (thay heuristic cũ)
Bản trước thưởng cho hình gọn (ít cạnh, tỉ lệ vuông vức), mâu thuẫn với mục tiêu khó. Bản này:
- **Không dùng điểm hình học để chọn.** Sinh ngẫu nhiên có seed, để cổng 3.5 và `scoreDifficulty` quyết định.
- Chỉ giữ ràng buộc cấu trúc: silhouette **liên thông**, không có lỗ thủng, không có mảnh nào nằm hoàn toàn trong bóng của mảnh khác khi nhìn theo biên.
- Đo thêm **độ đa nghĩa phân rã** (số cách khác để phủ kín silhouette bằng cùng bộ mảnh, mà solver đã đếm gián tiếp qua số nghiệm khi nới neo). Chi tiết đo là việc của spike (mục 7).

### 3.4 Neo nhiễu
1. **Vừa khít giả:** với mỗi mảnh, thử các vị trí lưới 8 mà mảnh vẫn nằm trọn trong silhouette và khác neo A, rồi chọn một số làm B, C, D.
2. **Dời trượt:** các vector ±8, ±16 dọc biên (`NUDGE`, `CROSS` trong `kit.ts`).
3. **KIT-03:** bỏ neo vượt biên; bỏ neo nhiễu trùng neo A của mảnh khác cùng hình, hướng, khung.
4. Mỗi mảnh giữ 2–3 neo nhiễu sau khi lọc; mảnh còn ít hơn 2 thì màn bị loại hoặc ghi cờ.

### 3.5 Cổng chấp nhận
Với mỗi ứng viên (đủ số mảnh, đủ neo):
1. Dựng `LevelDocument` bằng cùng đường dựng của `content:author` (xem 3.6).
2. `solveLevel(doc)`: yêu cầu `proven === true`, `solutionCount === 1`, `fewerPieceSolutions === 0`.
3. Nếu `solutionCount > 1`: **thử bỏ từng neo nhiễu** (tối đa vài chục lần giải, chấp nhận được vì chạy offline) và giữ phương án còn nghiệm duy nhất mà vẫn đủ 2 neo nhiễu mỗi mảnh. Không cần sửa solver. Nếu vẫn không đạt thì bỏ ứng viên.
4. Chạy `validate` (kể cả `chapter-1-no-overlap`) và `scoreDifficulty`; lưu điểm.

### 3.6 Điều kiện tiên quyết cần xác nhận khi bắt đầu làm
- Đường dựng `LevelDocument` trong bộ nhớ (từ `buildLevelDocument` hoặc tương đương) chạy được trong Node script và trong trình duyệt/WebView. Đây là việc đầu tiên của spike.
- Vị trí code: `game-next/src/content/pool/` (generator, đóng gói, giải nén) và script trong `game-next/scripts/`. **Không đặt trong `domain/`** để giữ hướng phụ thuộc hiện tại (`content/` import `domain/`, không ngược lại).

---

## 4. Kho màn (pool)

### 4.1 Định dạng
Mỗi màn lưu: số mảnh, từng mảnh (hình, hướng, khung, neo A, danh sách neo nhiễu), độ khó, mã băm silhouette. Neo là bội của 8 nên mã hoá được bằng 1 byte mỗi tọa độ (x/8, y/8). Ước lượng 60–150 byte một màn; 5.000 màn khoảng 0,3–0,8 MB (chưa đo). Lưu dạng nhị phân hoặc JSON nén; chọn khi làm spike, quyết định bằng số đo thực.

### 4.2 Tái tạo được
Pool sinh từ `--seed` và phiên bản generator; ghi cả hai vào header file. Cùng seed và cùng phiên bản thì ra cùng pool, nên review được bằng diff của báo cáo thay vì đọc nhị phân.

### 4.3 Dedupe và "khác nhau thật sự"
- Chuẩn hoá silhouette (dịch về gốc) rồi băm; **gương X tính là trùng** vì Chương 1 không xoay nhưng người chơi coi hai hình đối xứng là cùng một đề.
- Ngoài trùng tuyệt đối, đặt ngưỡng tương đồng (ví dụ phần trăm ô trùng sau khi căn gốc) để không bơm kho bằng các biến thể gần giống nhau. Ngưỡng cụ thể chốt sau spike.
- Giới hạn số màn trên mỗi cấu hình (bộ hình) để kho không bị một kiểu chiếm hết.

### 4.4 Báo cáo
`pool:generate` xuất báo cáo: số ứng viên, tỉ lệ qua cổng, phân bố độ khó, số neo nhiễu bị bỏ bởi KIT-03 và bởi bước tỉa, số màn bị loại do trùng. Dùng để reviewer đánh giá chất lượng mà không cần chơi từng màn.

---

## 5. Runtime (trên thiết bị)

1. **Nạp pool** một lần khi vào Endless; giải nén theo chỉ số khi cần.
2. **Chọn màn:** từ độ khó mục tiêu (tăng dần theo streak, giảm khi thua) chọn ngẫu nhiên trong dải độ khó, loại màn đã chơi gần đây (lịch sử trong `localStorage`, giới hạn độ dài).
3. **Chơi:** dựng `LevelDocument` rồi vào scene play. Tham số vào: `?scene=play&mode=endless&chapter=1` (tên tham số chốt khi viết plan, theo hiện trạng scene).
4. **Tiến trình:** streak, kỷ lục, danh sách đã chơi lưu `localStorage`; hết kho thì cho chơi lại từ đầu có xáo trộn.
5. **Hạn chế:** màn trong pool không nằm trong manifest nên harness `?mode=harness` sẽ không mở trực tiếp; cần đường mở riêng cho dev (chi tiết ở plan).

Phần giao diện (nút Endless trên bản đồ, hiệu ứng thắng) **không thuộc spec này**; chờ agy hoàn tất việc chỉnh giao diện rồi mới nối vào, để tránh xung đột.

---

## 6. Kiểm thử

- **Pool test (chạy trên toàn bộ kho):** mọi màn có 4–6 mảnh, `solutionCount === 1`, `fewerPieceSolutions === 0`, độ phủ ≤ 1, mọi neo bội của 8 và trong bàn, KIT-03 được giữ, silhouette liên thông, không trùng mã băm.
- **Test generator:** cùng seed ra cùng kết quả; PRNG cố định (cùng `mulberry32` như solver).
- **Test giải nén:** vòng đi-về (đóng gói rồi giải nén) cho ra `LevelDocument` giống hệt.
- **Test chọn màn:** không lặp trong cửa sổ lịch sử; độ khó tăng theo streak.
- Test trên toàn pool chạy trong `npm test` nếu dưới vài giây; nếu lâu hơn thì tách thành script riêng chạy trước khi phát hành.

---

## 7. Spike trước khi viết plan

Một bản thử nhỏ, chỉ vuông và tam giác, 4–6 mảnh, để đo trước khi chốt:
1. Tỉ lệ ứng viên qua cổng (nghiệm duy nhất) và thời gian trên mỗi ứng viên.
2. Số neo nhiễu còn lại sau khi tỉa; nếu thấp, màn sẽ ít bẫy và cần đổi cách sinh neo.
3. `buildLevelDocument` (hoặc đường dựng tương đương) chạy được ngoài `content:author`.
4. Dung lượng thực của định dạng đóng gói.
5. Ngưỡng tương đồng cho dedupe.

---

## 8. Câu hỏi mở

1. Kích thước pool v1: 2.000, 5.000 hay lớn hơn? (đề xuất 2.000–5.000)
2. Có cần reviewer chơi thử mẫu một phần pool (ví dụ 50 màn ngẫu nhiên) trước khi phát hành không? (đề xuất có; AGENTS.md chỉ yêu cầu duyệt `approved` cho level trong manifest, pool cần quy tắc riêng)
3. Có muốn sau này tải thêm pool từ CDN tĩnh không? (không ảnh hưởng v1)

---

## 9. Quyết định đã chốt (2026-10-08, sau vòng thử 50 màn)

- **Quy mô:** pool khoảng 500 màn, thử 50 màn trước, làm tách riêng trong `game-next/experiments/endless-ch1/`, chơi thử qua `experiments/endless-ch1/play.html` (dev server). Chỉ đưa vào game sau khi thử ổn.
- **Hình trong Endless là hình trừu tượng, không cần có nghĩa.** Hình có nghĩa (nhà, thuyền, cây...) ưu tiên cho chế độ Ngao du (campaign tác giả vẽ tay). Không làm thư viện mẫu hình cho Endless vì tốn công thiết lập mà chưa chắc hiệu quả.
- **Luật thẩm mỹ tối thiểu thay cho heuristic cũ:** ghép đối xứng gương qua trục x = 64 (1–2 mảnh trên trục, còn lại theo cặp), bóng gọn (lấp đầy hộp bao 0,5–0,9, tỉ lệ 0,6–1,6), không lỗ thủng. Chế độ ghép tự do vẫn giữ để so sánh (`--mode free`).
- **Đã đo ở bản thử:** 50/50 màn đúng 1 nghiệm, không nghiệm ít mảnh hơn; khoảng 19ms mỗi ứng viên; qua cổng 26%. Độ khó tự chấm chưa phân tầng (gần như toàn mức 3).
- **Lệch đối xứng vài chục ô** dọc cạnh huyền tam giác là do cách `shapes.ts` raster đường chéo, không phải lỗi bộ sinh.
- **Còn mở:** phân tầng độ khó, cách đóng gói pool, đường mở màn trong game thật (chờ agy xong giao diện).

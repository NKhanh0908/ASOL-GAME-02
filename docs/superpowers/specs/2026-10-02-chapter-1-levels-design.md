# Chương 1 — Năm màn 1-2 → 1-6 và công cụ authoring dùng chung

Ngày: 2026-10-02 · Phạm vi: `game-next` · Phụ thuộc: spec rebuild 02 (puzzle core), 03 (màn chơi), 04 (dữ liệu level và FTUE), GUI improve-v1 (GridSpec).

## 1. Mục tiêu và phạm vi

Đưa năm màn còn lại của Chương 1 (1-2 → 1-6) từ `planned` lên `validated`, sẵn sàng để người review duyệt lên `approved`. Đồng thời xây phần dùng chung mà Chương 2 và 3 sẽ tái dùng:

1. Module hình học `domain/shapes.ts`: một định nghĩa đa giác cho mỗi hình, sinh cả cells lẫn hình vẽ.
2. Công cụ authoring `scripts/author-level.ts`: nguồn mô tả màn → JSON, ảnh xem trước SVG, báo cáo nghiệm.
3. Renderer vẽ đúng vuông, tam giác, thoi với kích thước riêng từng mảnh, và vẽ chồng lớp chẵn/lẻ chính xác cho mọi tổ hợp hình.
4. Khay chứa N mảnh thay vì cố định 2.

**Ngoài phạm vi:** nội dung Chương 2 và 3, hành vi nút xoay, biểu tượng đếm mảnh trên HUD (vẫn là thoi vì chỉ là bộ đếm), bóng mục tiêu mờ có lỗ rỗng (Chương 2), lưu tiến độ, Android build.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Mỗi chương là một sub-project riêng (spec → plan → triển khai). Spec này gồm Chương 1 và công cụ dùng chung. | Ra nội dung sớm, review từng đợt nhỏ. |
| D2 | Claude dựng nháp hình học từ mô tả GDD; người review xem SVG và chơi thử ở harness rồi duyệt. | Spec 04 yêu cầu review hình trước `approved`; validator không tự đặt trạng thái này. |
| D3 | Tam giác là **tam giác vuông cân**, 8 hướng. Không dùng tam giác cân cũ của `game/` (cạnh xiên ~63°). | Mọi cạnh nằm trên trục hoặc đường chéo 45° của lưới improve-v1; mọi đỉnh rơi vào giao điểm lưới hiển thị. |
| D4 | Một module hình học dùng chung sinh cells, hình vẽ và ảnh xem trước (phương án 1). | Chặn lệch footprint theo LVL-02 bằng cấu trúc, không bằng kỷ luật. |
| D5 | Mọi mảnh Chương 1 dùng `frameSize = 48`. | Bằng 1-1; nửa đường chéo thoi = 1 module; tháp ba tầng 1-4 cao 120/160 ô. |
| D6 | **Lệch GDD 1-3:** hai cánh chạm nhau tại một đỉnh, không chung cạnh dọc. | Hai tam giác vuông đối xứng chung cạnh dọc luôn thành một tam giác lớn (kim tự tháp hoặc phễu), không ra hình cánh. |
| D7 | **Lệch GDD 1-6:** vương miện dùng **thoi + 2 tam giác** thay vì vuông + 2 tam giác. | Với khung 48, ba mảnh xếp ngang rộng 144 > 128 ô; không thể có ba đỉnh. Thoi lấp vừa khe giữa hai cánh của 1-3, cho ba đỉnh cao bằng nhau. |
| D8 | Mọi hình, kể cả thoi, dùng **một quy tắc ô biên** (trên-trái). 1-1 được sinh lại thành `song-tinh-v2` và phải duyệt lại. | Quy tắc cũ của thoi lấy ô biên ở cả bốn cạnh, nên ở 1-6 thoi và cánh phải chung một hàng ô trên đường `x + y = 168`: validator báo `chapter-1-no-overlap` và luật chẵn/lẻ xoá một đường mảnh. Chung một quy tắc thì hai hình chung cạnh luôn lát khít, ở mọi chương. |

GDD Phụ lục A/B cần cập nhật theo D3, D5, D6, D7, D8 và lưới 128 × 160 trong cùng đợt triển khai.

## 3. Module hình học `domain/shapes.ts`

**CH1-01 — Đa giác chuẩn.** `shapePolygon(kind, orientation, frameSize)` trả về danh sách đỉnh theo toạ độ khung (gốc trên-trái, đơn vị ô logic). Đây là nguồn duy nhất cho cells, renderer và SVG.

| `shapeKind` | `orientation` | Đỉnh (khung `s`) |
|---|---|---|
| `square` | chỉ 0 | (0,0) (s,0) (s,s) (0,s) |
| `diamond` | chỉ 0 | (s/2,0) (s,s/2) (s/2,s) (0,s/2) |
| `triangle` | 0 · góc vuông trên-trái (TL) | (0,0) (s,0) (0,s) |
| | 1 · góc vuông trên-phải (TR) | (0,0) (s,0) (s,s) |
| | 2 · góc vuông dưới-phải (BR) | (s,0) (s,s) (0,s) |
| | 3 · góc vuông dưới-trái (BL) | (0,0) (0,s) (s,s) |
| | 4 · mái, cạnh huyền ở đáy | (0,s) (s,s) (s/2,s/2) |
| | 5 · mái, cạnh huyền bên trái | (0,0) (0,s) (s/2,s/2) |
| | 6 · mái, cạnh huyền ở đỉnh | (0,0) (s,0) (s/2,s/2) |
| | 7 · mái, cạnh huyền bên phải | (s,0) (s,s) (s/2,s/2) |

**CH1-02 — Raster hoá.** `rasterize(polygon, frameSize)` lấy ô `(x, y)` khi tâm ô `(x+0.5, y+0.5)` nằm trong đa giác. Tâm nằm đúng trên cạnh theo quy tắc trên-trái, áp dụng cho **mọi** hình: cạnh ngang có phần trong ở phía dưới (cạnh trên) và cạnh không ngang có phần trong ở bên phải (cạnh trái) thì tính; các cạnh còn lại thì bỏ. Hệ quả bắt buộc: hai hình bất kỳ chung một đoạn cạnh không có ô trùng và không có khe; riêng hai tam giác bù nhau qua đường chéo khung (TL + BR, TR + BL) lát kín khung `s × s`.

Quy tắc chung làm hai hình đối xứng gương có thể lệch nhau một hàng ô chéo (ví dụ khung 48: TL 1.128 ô, BR 1.176 ô), tức nửa ô 2,5px trên màn hình. Spec chỉ cam kết tính lát khít, không cam kết số ô bằng nhau giữa hai hình gương. Thoi không còn dùng quy tắc `≤` cũ (lấy biên cả bốn cạnh).

**CH1-03 — Xoay.** Một nấc 90° theo chiều kim đồng hồ đổi hướng trong cùng họ: góc `0→1→2→3→0`, mái `4→5→6→7→4`. Hướng hiệu dụng = `họ + (orientation % 4 + turns) mod 4`. Renderer vẽ đa giác của hướng hiệu dụng; mask vẫn do domain tính bằng `rotateCells(cells, frameSize, turns)` như hiện nay.

Hai cách này không thể trùng khít từng ô: không quy tắc ô biên nào vừa lát khít hai tam giác bù nhau vừa bất biến khi xoay 90° (TL và BR là ảnh xoay 180° của nhau và cùng chứa hàng ô trên đường chéo, nên quy tắc bất biến sẽ cho cả hai cùng lấy hoặc cùng bỏ hàng đó). Cam kết: tập ô sau xoay và raster của hướng hiệu dụng chỉ khác nhau ở những ô có tâm nằm đúng trên đường viền (khung 48: tối đa 48 ô, tức một hàng chéo 2,5px). Chương 1 không xoay nên không bị ảnh hưởng.

**CH1-04 — Schema.** `LevelDocument.pieces[]` có thêm trường tuỳ chọn `orientation: 0..7`. Bắt buộc với `triangle`; với `square`/`diamond` phải vắng hoặc bằng 0. Không tăng `schemaVersion` vì trường mới là tuỳ chọn và 1-1 không đổi. Validator bổ sung:

- `invalid-orientation`: thiếu hướng cho tam giác, hoặc hướng khác 0 cho vuông/thoi, hoặc ngoài 0–7.
- `shape-cells-mismatch`: `cells` khác `rasterize(shapePolygon(...))`. Giúp phát hiện cells sửa tay lệch khỏi hình.

`Piece` trong `domain/model.ts` mang thêm `shapeKind` và `orientation`; `Level` mang thêm `targetPlacements` (các placement của nghiệm mẫu thứ nhất) để renderer vẽ bóng mục tiêu bằng đa giác thật. Ba trường này tuỳ chọn ở kiểu dữ liệu để các literal `Level` viết tay trong test domain không phải sửa; validator luôn điền đủ.

Fixture kỹ thuật `fixture-adjacent-diamonds` (LVL-06) sinh lại theo quy tắc ô biên mới: cells và target vẫn tính bằng công thức giải tích độc lập với evaluator, nay là `−u−v ≤ r`, `u−v < r`, `u+v < r`, `v−u ≤ r` với `(u, v)` là toạ độ tâm ô so với tâm thoi.

## 4. Công cụ authoring

**CH1-05 — Nguồn mô tả màn.** Mỗi màn có `src/content/sources/<id>.ts` xuất một object gồm: metadata (`id`, `title`, `chapter`, `order`, `contentRevision`, `learningObjective`, `difficultyEstimate`, `victoryVerse`, `ftueSteps`), danh sách mảnh `{ id, shapeKind, orientation, anchors: [{ id, x, y }] }`, `sampleSolutions` và `distractors` có lý do. Neo là gốc khung, toạ độ là bội của 8 (giao điểm lưới hiển thị). Cells và targetCells không bao giờ gõ tay.

**CH1-06 — `scripts/author-level.ts <id | --all>`.** Chạy bằng `node --experimental-strip-types`. Thứ tự:

1. Kiểm neo là bội của 8 và khung nằm trong bàn 128 × 160; sai thì dừng.
2. Dựng `LevelDocument`: cells từ `shapes.ts`; `targetCells` = mask chẵn/lẻ của nghiệm mẫu thứ nhất, sắp theo y rồi x.
3. Ghi `src/content/levels/<id>.json` (2 dấu cách thụt lề, xuống dòng cuối file).
4. Chạy `validateLevel`; có issue thì in đủ `levelId`, đường dẫn field, mã lỗi rồi thoát mã khác 0.
5. Ghi `docs/testing/levels/<id>.svg`: lưới hiển thị và module, bóng mục tiêu, nghiệm với mỗi mảnh một màu viền, mọi neo có nhãn, các tư thế gây nhiễu vẽ nét đứt.
6. Duyệt mọi tổ hợp "mỗi mảnh ở một neo hoặc ở khay"; ghi `docs/testing/levels/<id>-report.md` gồm: số nghiệm, nghiệm dùng ít mảnh hơn dự định (phải bằng 0), và số ô lệch so với mục tiêu của từng tư thế gây nhiễu.

**CH1-07 — 1-1 đi qua cùng đường ống.** Viết `sources/1-1.ts` với cùng mảnh, neo, nghiệm và metadata như `song-tinh-v1`; sinh lại thành `song-tinh-v2` (cells và targetCells đổi theo D8, còn lại giữ nguyên). Test khẳng định tạo lại 1-1 cho JSON giống hệt file đã commit. Sau đó gỡ `scripts/regen-level-geometry.ts`.

**Cổng duyệt lại 1-1 ngay sau khi sinh lại:** trước khi commit `song-tinh-v2`, người thực thi dừng lại, báo người review số ô thay đổi (mỗi thoi 1.200 → 1.152 ô, mục tiêu 2.400 → 2.304 ô) và chờ đồng ý rõ ràng. Đồng ý thì ghi phần duyệt v2 vào `docs/testing/mirror-rebuild/1-1-content-review.md` và giữ `approved`; không đồng ý thì huỷ thay đổi và dừng. Nhờ vậy 1-1 không bao giờ rời trạng thái `approved` trên nhánh, campaign và test hiện có không bị gãy.

**CH1-08 — Đăng ký màn.** `catalog.ts` import JSON của 1-2 → 1-6. `manifest.ts` đặt `dataPath` và `status: 'validated'` khi công cụ chạy sạch. Chỉ chuyển `approved` sau review (mục 7).

**CH1-09 — Chơi thử trước khi duyệt.** `main.ts` nhận `?scene=play&level=<id>&mode=harness`, truyền `mode` vào `PlayScene`. Chế độ harness chỉ bật khi `import.meta.env.DEV`; bản build thường luôn dùng `campaign`. Campaign giữ nguyên: mở khoá tuần tự, chỉ nạp màn `approved`.

## 5. Renderer

**CH1-10 — Một điểm vẽ.** `JewelShape` có `drawJewelPolygon(g, points, variant)`. Mặt vát tổng quát: mỗi cạnh đa giác nối với trọng tâm thành một mặt tam giác, màu theo hướng pháp tuyến ngoài của cạnh, ánh xạ vào token Bắc/Đông/Nam/Tây hiện có (`PIECE_TOKENS`). `drawJewel(cx, cy, radius)` thành lớp bọc tạo đa giác thoi; kết quả vẽ thoi không đổi.

**CH1-11 — Mọi chỗ vẽ mảnh đi qua đa giác thật.** Sáu chỗ trong `BoardRenderer` (target, đang kéo, khay, chỗ trống trong khay, tạm, đã snap) và hình mục tiêu trong `TargetBadge.ts` dùng `shapePolygon(kind, hướng hiệu dụng, frameSize)` đổi sang pixel qua `layout`. Bỏ giả định `level.pieces[0].frameSize`, toạ độ bóng mục tiêu viết cứng và nhánh riêng cho 1-1 trong `TargetBadge`; mỗi mảnh dùng kích thước của chính nó. Biểu tượng đếm mảnh trên thanh HUD giữ hình thoi vì đó là bộ đếm, không đại diện cho mảnh cụ thể.

**CH1-12 — Chồng lớp chẵn/lẻ chính xác.** Module thuần `presentation/polygonClip.ts` cắt giao hai đa giác lồi (Sutherland–Hodgman). Vẽ chồng theo tầng trên các mảnh **đã snap**: mảnh màu vàng, rồi giao từng cặp màu mặt bàn, rồi giao từng bộ ba màu vàng, rồi bộ bốn màu mặt bàn… Vùng bị `k` mảnh phủ có lớp trên cùng là giao của đủ `k` mảnh, nên màu đúng theo tính chẵn lẻ của `k`. Thay hoàn toàn cách vẽ hình tròn giữa hai tâm mảnh đầu tiên. Mảnh tạm giữ kiểu mờ riêng, không tham gia chồng lớp (khớp luật: chỉ mảnh đã snap được tính vào mask). `TargetBadge` dùng cùng thuật toán trên `targetPlacements` (tô đặc, nên chồng lớp vẽ đúng). Bóng mục tiêu mờ trên bàn vẽ từng đa giác của nghiệm mẫu riêng rẽ: ở Chương 1 chúng không bao giờ giao nhau (validator chặn), còn bóng mờ có lỗ rỗng không vẽ được bằng cách sơn màu mặt bàn lên lớp trong suốt nên để lại cho spec Chương 2.

**CH1-13 — Khay N ô.** `layout.ts` chia bề ngang khay theo số mảnh của màn. Kích thước mảnh trong khay = `min(kích thước hiện tại, bề rộng ô / 2 − lề)`. `pieceHitbox` và `beginDrag` dùng chung công thức ô.

**CH1-14 — Ngôi sao chiến thắng** đặt tại trọng tâm của mask mục tiêu thay vì tâm bàn. Với 1-1 hai điểm trùng nhau.

## 6. Năm màn Chương 1

Mọi mảnh khung 48, màu amber, `rotationEnabled: false`. Toạ độ là gốc khung. Vùng hít 6 ô logic và các neo cách nhau tối thiểu 8 ô nên không có hai neo tranh nhau một lần thả.

### 1-2 Bảo Tháp Tiên Tri — độ khó 1

| Mảnh | Hình · hướng | Neo A | Neo B (gây nhiễu) |
|---|---|---|---|
| `S1` | vuông | (40, 64) | (48, 64): lệch ngang 8 |
| `R1` | tam giác · 4 (mái) | (40, 16) | (48, 16): lệch ngang 8 |

Bóng: tháp, đáy mái nằm trọn trên cạnh trên khối vuông (y = 64). Mục tiêu học: phối hợp hai hình khác nhau thành một biểu tượng. FTUE: `idle` → "Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu", kết thúc `drag-start`. Câu thơ: "Tháp vươn lên trời, lời tiên tri có chỗ đứng."

### 1-3 Cánh Chim Báo Điềm — độ khó 2

| Mảnh | Hình · hướng | Neo A | Neo B (gây nhiễu) |
|---|---|---|---|
| `W1` | tam giác · 3 (BL) | (16, 56) | (64, 56): sai bên |
| `W2` | tam giác · 2 (BR) | (64, 56) | (16, 56): sai bên |

Bóng: đôi cánh giương, hai mũi ở góc trên ngoài (16, 56) và (112, 56); hai cạnh huyền dốc vào giữa, chạm nhau tại (64, 104). Đổi chỗ hai cánh cho ra hình kim tự tháp, sai bóng. Người chơi phải tự so bóng. FTUE: không có. Câu thơ: "Đôi cánh mở ra, điềm lành bay về phương bắc."

### 1-4 Ngọn Hải Đăng — độ khó 2

| Mảnh | Hình · hướng | Neo A | Neo B (gây nhiễu) |
|---|---|---|---|
| `R1` | tam giác · 4 (mái) | (40, 0) | (48, 0) |
| `D1` | thoi | (40, 48) | (48, 48) |
| `S1` | vuông | (40, 96) | (48, 96) |

Bóng: ba tầng theo trục đứng (mái, đèn thoi, đế vuông), chạm đỉnh–cạnh tại (64, 48) và (64, 96). Mục tiêu học: ghép ba khối theo trục đứng. FTUE: không có. Câu thơ: "Ngọn hải đăng thắp sáng, thuyền lạc tìm thấy lối về."

### 1-5 Chiếc Thuyền Sao — độ khó 3

| Mảnh | Hình · hướng | Neo A | Neo B (gây nhiễu) |
|---|---|---|---|
| `S1` | vuông (thân) | (16, 80) | không có |
| `P1` | tam giác · 0 (TL, mũi) | (64, 80) | (64, 88): lệch dọc 8 |
| `L1` | tam giác · 3 (BL, buồm) | (40, 32) | (48, 32): lệch ngang 8 |

Bóng: mũi thuyền áp cạnh phải thân thuyền, cạnh huyền vát về phía sau; đáy buồm nằm trên mép trên của thân và mũi (y = 80), cột buồm tại x = 40. FTUE: không có. Câu thơ: "Thuyền sao giương buồm, dải ngân hà mở lối."

### 1-6 Vương Miện Bình Minh — độ khó 3, kết Chương 1

| Mảnh | Hình · hướng | Neo A | Neo B (gây nhiễu) |
|---|---|---|---|
| `W1` | tam giác · 3 (BL) | (16, 56) | (64, 56): sai bên |
| `W2` | tam giác · 2 (BR) | (64, 56) | (16, 56): sai bên |
| `D1` | thoi | (40, 56) | (40, 48): lệch dọc 8 |

Bóng: vương miện ba đỉnh cao bằng nhau tại x = 16, 64, 112 (y = 56), đáy phẳng y = 104. Hai cạnh dưới của thoi nằm trên hai cạnh huyền của đôi cánh (đường y = x + 40 và đối xứng), tiếp giáp cạnh, không giao. Gợi lại 1-3 để khép chương. FTUE: không có. Câu thơ: "Ba đỉnh vương miện bừng sáng, bình minh Cổ Ngữ đã đến."

Mục tiêu học của mỗi màn theo GDD Phụ lục A/B. Công cụ authoring phải xác nhận mỗi màn có đúng một mask nghiệm như thiết kế và không có nghiệm dùng ít mảnh hơn.

## 7. Quy trình duyệt từng màn

1. Claude viết nguồn, công cụ chạy sạch → `validated`, đăng ký trong catalog.
2. Người review mở `docs/testing/levels/<id>.svg` và chơi `?scene=play&level=<id>&mode=harness` trên dev server.
3. Duyệt hoặc yêu cầu sửa. Sửa thì tăng `contentRevision`.
4. Khi duyệt: Claude ghi `docs/testing/mirror-rebuild/<id>-content-review.md` theo mẫu của 1-1 (người, ngày, revision, ghi chú), rồi đổi `status` sang `approved`.

## 8. Kiểm thử

Vitest trong `game-next/tests/`:

- `shapes.test.ts`: đỉnh và số ô từng hình; TL + BR và TR + BL lát kín khung, không trùng; thoi ở 1-6 và hai cánh không chung ô; sau `turns`, tập ô `rotateCells` và raster hướng hiệu dụng chỉ khác nhau ở ô có tâm nằm trên đường viền.
- `polygonClip.test.ts`: giao vuông/tam giác/thoi; trường hợp rỗng và chỉ chạm cạnh; chồng lớp chẵn/lẻ trên fixture ba mảnh so với kết quả mong đợi viết tay độc lập.
- `authoring.test.ts`: tạo lại 1-1 giống hệt file `song-tinh-v2` đã commit; mỗi nguồn 1-2 → 1-6 dựng được, qua validator, đúng số nghiệm, không có nghiệm ít mảnh hơn; mọi neo là bội của 8.
- `content.test.ts`: `invalid-orientation` và `shape-cells-mismatch`.
- Cập nhật `layout.test.ts` và `boardRenderer.test.ts`: khay N ô, hitbox nằm trong ô của mình; renderer dùng kích thước và hình của từng mảnh.

Trước khi báo hoàn thành: `npm test`, `npm run build`, `npm run content:validate` đều đạt; ảnh chụp trình duyệt của từng màn ở chế độ harness; ảnh 1-1 trước/sau đặt cạnh nhau để người review duyệt `song-tinh-v2`. Mỗi commit kèm mục `CHANGELOG.md`.

## 9. Tiêu chí hoàn thành

- 1-2 → 1-6 ở trạng thái `validated`, có JSON, SVG và báo cáo nghiệm; chơi được ở harness.
- 1-1 sinh lại thành `song-tinh-v2` qua đường ống mới, không khác bằng mắt so với v1, và đã được duyệt lại trước khi merge.
- Vẽ chồng lớp đúng với mọi tổ hợp vuông/tam giác/thoi đã snap.
- GDD Phụ lục A/B cập nhật theo D3, D5, D6, D7, D8.
- `approved` chỉ đặt sau review của người, từng màn một.

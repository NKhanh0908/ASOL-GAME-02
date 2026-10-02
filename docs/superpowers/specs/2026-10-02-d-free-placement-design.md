# D — Chế độ đặt tự do (hít vào giao điểm lưới) và bộ giải nghiệm duy nhất

Ngày: 2026-10-02 · Phạm vi: `game-next/src/domain`, `application`, `content`, `presentation` · Phụ thuộc: A. Chạy song song được với C.

## 1. Mục tiêu

Thêm chế độ chơi khó hơn: mảnh **vẫn hít**, nhưng hít vào **mọi giao điểm lưới hiển thị** thay vì chỉ vào các neo do tác giả đặt. Vị trí hít không còn để lộ đáp án. Chế độ bật riêng cho từng màn, có hỗ trợ xoay ở màn bật `rotationEnabled`.

**Giữ nguyên:**

- luật chẵn lẻ (spec A, mục 2) và luật thắng (mask trùng mục tiêu)
- trải nghiệm hít: xem trước khi kéo, nhãn "Thả để khớp", hiệu ứng snap
- toàn bộ màn chế độ neo

**Ngoài phạm vi:** đặt tự do ở cấp ô logic (không qua lưới hiển thị), hít vào cạnh của mảnh khác.

## 2. Dữ liệu màn

**FP-01.** `LevelDocument` và `Level` thêm `placement: 'anchors' | 'free'`. Khi thiếu thì validator coi là `'anchors'`, nên mọi màn hiện có không phải sửa.

**FP-02.** Ở màn `free`:

- Mỗi mảnh có **đúng một neo, tên `A`**, là vị trí đúng mà validator và bộ giải dùng. Neo khác bị từ chối với mã lỗi `free-placement-extra-anchor`.
- `distractors` phải rỗng; mọi giao điểm lưới đã là "neo nhiễu".
- `targetCells` và `sampleSolutions` giữ nguyên ý nghĩa. `sampleSolutions[0]` trỏ neo `A` của mỗi mảnh kèm `turns`.

## 3. Luật hít

**FP-03 — Vị trí hít.**

1. Gọi `(gx, gy)` là gốc khung tương ứng với tâm mảnh đang kéo (tâm − frameSize/2, đơn vị ô logic).
2. Các ứng viên là những giao điểm `(8i, 8j)` sao cho mảnh, ở hướng hiện tại, nằm gọn trong bàn (`fitsBoard`).
3. Chọn ứng viên gần `(gx, gy)` nhất theo khoảng cách Euclid. Hoà thì ưu tiên `y` nhỏ hơn, rồi `x` nhỏ hơn, để kết quả luôn xác định.
4. Mảnh hít nếu khoảng cách ≤ **6 ô**, bằng bán kính hít hiện tại (`d² ≤ 36`). Giao điểm cách nhau 8 ô, nên ở giữa bàn luôn có ứng viên trong bán kính (điểm xa nhất cách giao điểm gần nhất khoảng 5,66 ô).
5. Không có ứng viên thì xử lý như màn neo: thả trong bàn thành mảnh tạm, thả ngoài bàn về khay.

**FP-04 — Trạng thái.** `PieceState` thêm dạng `{ kind: 'placed'; x: number; y: number; turns: Turns }`, chỉ dùng ở màn `free`. Màn neo vẫn dùng `snapped`. `placementsOf` nhận cả hai dạng. Lệnh xoay mảnh `placed` giữ nguyên gốc khung; nếu hướng mới vượt biên thì từ chối với outcome `out-of-bounds`, như mảnh `snapped` hiện nay.

**FP-05 — Giao diện.**

- `drag.ts` (`updateDrag`, `finishDrag`) gọi chung một hàm thuần `nearestGridOrigin(piece, turns, gx, gy)` cho cả xem trước lẫn thả, để vị trí xem trước luôn trùng vị trí thả.
- `snapCandidateId` của màn `free` là chuỗi `"grid:<x>,<y>"`, để HUD hiện nhãn "Thả để khớp" như cũ.
- Renderer vẽ mảnh `placed` như mảnh `snapped`, với gốc khung `(x, y)`.

## 4. Bộ giải nghiệm duy nhất

**FP-06 — Không gian tìm.** Với mỗi mảnh, liệt kê mọi tư thế `(x, y, turns)`:

- `x`, `y` là bội của 8 và mảnh nằm gọn trong bàn
- `turns ∈ {0}` khi `rotationEnabled = false`; khi xoay được thì lấy các hướng hiệu dụng khác nhau (vuông và tròn chỉ 1, thoi 1, bình hành 2, tam giác 4)
- cộng thêm lựa chọn "ở khay"

Mảnh khung 48 có khoảng 11 × 15 = 165 tư thế.

**FP-07 — Băm XOR.**

- Mỗi ô `(x, y)` của bàn có một số ngẫu nhiên 64 bit cố định, sinh từ seed hằng: `cellHash[idx]`, lưu dạng hai số 32 bit.
- Mã băm của một tư thế là XOR `cellHash` của mọi ô nó phủ.
- Luật chẵn lẻ chính là XOR, nên mã băm của một tổ hợp bằng XOR mã băm các tư thế trong tổ hợp, và tổ hợp là nghiệm khi mã băm của nó bằng mã băm của `targetCells`.

**FP-08 — Gặp-nhau-ở-giữa.**

1. Chia mảnh thành hai nửa sao cho tích số lựa chọn mỗi nửa gần bằng nhau.
2. Liệt kê nửa A vào một `Map` từ mã băm sang danh sách tổ hợp.
3. Với mỗi tổ hợp nửa B, tra `targetHash XOR hashB` trong bảng.
4. Mỗi cặp khớp được **kiểm lại bằng mask thật**, nên không có báo nhầm do va chạm băm.

Hai mảnh giống hệt (cùng hình, hướng, khung) đổi tư thế cho nhau được tính là **một** nghiệm. Báo cáo gồm:

- `solutionCount`: số nghiệm phân biệt
- `fewerPieceSolutions`
- `proven`: `true` khi đã duyệt hết

**FP-09 — Giới hạn.**

- Nếu tích số lựa chọn của nửa lớn nhất vượt `5_000_000`, bộ giải dừng với `proven = false`. Báo cáo ghi "chưa chứng minh được nghiệm duy nhất", Xưởng hiện cảnh báo vàng.
- Khi `proven = false`, `npm run content:author` vẫn ghi file, nhưng `content:validate --release` từ chối màn đó cho tới khi người review ghi `allowUnproven: true` vào nguồn kèm lý do.
- Khoảng 5 mảnh khung 48 không xoay nằm trong giới hạn.

**FP-10 — Màn neo dùng chung bộ giải.** `searchSolutions` của Chương 1 chuyển sang dùng cùng cơ chế băm, với không gian tìm là "neo của mảnh + khay". Kết quả với 16 màn đã có phải giữ nguyên (test hồi quy).

## 5. Validator và authoring

- `validate.ts`:
  - kiểm `placement`
  - màn `free` có đúng 1 neo mỗi mảnh và neo đó là bội của 8 (`free-placement-off-grid`)
  - `distractors` rỗng
- `authoringReport.ts`: báo cáo màn `free` thêm số tư thế mỗi mảnh, thời gian giải và `proven`. SVG không vẽ neo nhiễu, chỉ vẽ neo A.
- Các hàm ghép hình của spec B nhận `opts.placement = 'free'` và bỏ qua `decoys`.

## 6. Kiểm thử

- `freePlacement.test.ts`:
  - `nearestGridOrigin` ở giữa bàn, sát mép, khi hướng mới không vừa, và ở điểm hoà (quy tắc y rồi x)
  - kéo rồi thả qua `drag.ts`: vị trí xem trước trùng vị trí thả
  - `session.ts`: mảnh `placed` xoay tại chỗ; xoay vượt biên bị từ chối
- `solver.test.ts`:
  - fixture có 1 nghiệm, 2 nghiệm và vô nghiệm, với expected viết tay
  - trên bàn thu nhỏ (32 × 32, ba mảnh), kết quả gặp-nhau-ở-giữa bằng kết quả duyệt hết
  - hai mảnh giống hệt đổi chỗ được tính là 1 nghiệm
  - vượt giới hạn thì trả `proven = false`
  - hồi quy: 16 màn chế độ neo cho đúng số nghiệm như trước
- Ảnh chụp harness một màn thử ở chế độ `free`: mảnh hít vào giao điểm, có nhãn "Thả để khớp".

## 7. Tiêu chí hoàn thành

Có một màn thử chế độ `free` gồm 4 mảnh khung 48. Báo cáo của nó ghi `proven = true` và 1 nghiệm, và màn chơi thắng được ở harness. Mọi kiểm tra đều xanh. Các màn chế độ neo không đổi hành vi.

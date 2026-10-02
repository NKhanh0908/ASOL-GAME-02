# E — Xưởng tạo màn (Level Studio) và điểm độ khó tự động

Ngày: 2026-10-02 · Phạm vi: `game-next` (trang dev mới, plugin Vite, module domain dùng chung) · Phụ thuộc: A, B (bộ ghép hình, `content:new`), D (đặt tự do, bộ giải).

## 1. Mục tiêu

Một **không gian riêng** để người thiết kế tự dựng màn trên dev server:

- kéo mảnh, xem bóng chẵn/lẻ trực tiếp
- thêm neo nhiễu hoặc chọn đặt tự do, và xoay
- kiểm nghiệm duy nhất và đọc điểm độ khó ngay trên trang
- lưu vào repo, chơi thử ngay, rồi đưa màn vào campaign bằng một lệnh

**Ngoài phạm vi:** dùng Xưởng trên điện thoại; nhiều người cùng sửa một màn; Xưởng trong bản build phát hành.

## 2. Nơi chạy

**ST-01.** Xưởng là trang `game-next/studio.html` cùng entry `src/studio/main.ts`:

- Viết bằng TypeScript, DOM và SVG, không dùng Phaser.
- Chỉ có khi chạy `npm run dev`; mở `http://localhost:5173/studio.html`.
- `vite build` không đưa trang này vào bundle (`build.rollupOptions.input` chỉ gồm `index.html`).
- Xưởng import trực tiếp các module domain và content của game: `shapes`, `mask`, `validate`, `authoring`, `authoringReport`, `kit`, bộ giải của spec D. Những gì Xưởng thấy đúng là những gì game sẽ chạy.

## 3. Bố cục và thao tác

Bố cục desktop, chiều rộng ≥ 1280px, ba cột:

**ST-02 — Cột trái: kho màn.**

- Danh sách màn trong `src/content/studio/`, rồi tới các màn campaign, mỗi màn kèm trạng thái.
- Nút **Tạo mới** (từ `_template.ts`), **Clone** (từ màn đang chọn; dùng cùng logic với `content:new` của spec B) và **Xoá** (chỉ với màn studio, có hộp xác nhận).
- Màn campaign chỉ mở để xem và clone. Muốn sửa thì phải clone sang studio trước.

**ST-03 — Cột giữa: bàn.**

- Bàn 128 × 160 vẽ bằng SVG, tỉ lệ 4px/ô, có lưới hiển thị và module như ảnh xem trước của authoring.
- **Thanh hình phía trên:** loại hình, cỡ khung (chỉ hiện các cỡ hợp lệ theo `isValidFrame` của spec A) và hướng. Bấm một hình để đặt mảnh mới vào giữa bàn.
- **Kéo mảnh:** gốc khung hít vào giao điểm lưới gần nhất (dùng `nearestGridOrigin` của spec D), cho cả màn neo lẫn màn `free`. Vị trí mảnh lúc thả chính là neo A.
- **Phím tắt:**
  - `R`: hướng kế tiếp trong cùng họ
  - `Shift+R`: lật gương, dùng `mirrorX` của spec B
  - `Delete`: xoá mảnh
  - `Ctrl+D`: nhân bản mảnh
  - mũi tên: dịch 8 ô
- **Bóng chẵn/lẻ cập nhật trực tiếp:** vùng hiện màu vàng, vùng rỗng màu mặt bàn, vùng 3 lớp trở lên có viền chấm để tác giả thấy.
- **Màn neo:** với mảnh đang chọn, nút "Thêm neo nhiễu" tạo một bóng nét đứt kéo được. Neo nhiễu cũng hít vào lưới, tối đa 5 neo mỗi mảnh. Luật KIT-03 của spec B được áp ngay: neo vi phạm hiện màu đỏ, kèm lý do.
- **Màn xoay** (`rotationEnabled`): mỗi mảnh có thêm ô chọn "nghiệm xoay" (`turns` 0–3 trong `sampleSolutions`). Mảnh vẫn bắt đầu trong khay ở hướng 0.

**ST-04 — Cột phải: thông số và kiểm tra.**

- **Thông tin màn:** mã, tên, chương, `placement`, `rotationEnabled`, mục tiêu học, câu thơ, các bước FTUE (trigger, điều kiện kết thúc, chữ), và `difficultyEstimate` do tác giả ghi.
- **Kiểm tra trực tiếp**, chạy lại 300 ms sau thao tác cuối, trong Web Worker để không làm đơ trang:
  - lỗi validator (mã và trường)
  - số nghiệm, số nghiệm ít mảnh hơn, `proven`
  - thời gian giải
- **Điểm độ khó** (mục 5): số 1–5 kèm biểu đồ thanh của từng thành phần.
- **Nút:**
  - **Lưu:** tắt khi có lỗi validator.
  - **Chơi thử:** mở tab game với `?scene=play&level=<id>&mode=harness`.
  - **Mở SVG**.

## 4. Lưu vào repo

**ST-05 — Endpoint dev.** Plugin Vite `studioPlugin` chỉ gắn khi `command === 'serve'` và thêm hai route:

- `POST /__studio/save`. Body là `{ source: LevelSource }`. Server tự dựng tài liệu bằng `buildLevelDocument`, chạy `validateLevel`, rồi ghi bốn file:
  - `src/content/studio/<id>.ts`: nguồn, sinh bằng hàm `serializeLevelSource`, định dạng giống nguồn viết tay để diff dễ đọc
  - `src/content/studio/levels/<id>.json`
  - `docs/testing/levels/studio/<id>.svg`
  - `docs/testing/levels/studio/<id>-report.md`
- `POST /__studio/delete` với body `{ id }`, xoá đúng bốn file trên.

**ST-06 — An toàn ghi file.**

- `id` phải khớp `^[a-z0-9-]{1,32}$`.
- Mọi đường dẫn được dựng từ `id` trên hai thư mục gốc cố định, rồi chuẩn hoá và kiểm vẫn nằm trong thư mục gốc; ngoài ra thì trả `400`.
- Server không nhận đường dẫn từ client.
- Không ghi đè màn campaign: `id` trùng một màn trong `sources/` thì trả `409`.

**ST-07 — Màn studio trong game.**

- `catalog.ts` nạp thêm `src/content/studio/levels/*.json` qua `import.meta.glob`, **chỉ khi `import.meta.env.DEV`**, và chỉ cho chế độ harness.
- Màn studio không có trong manifest, không hiện trên bản đồ chọn màn, và campaign không bao giờ nạp chúng.

**ST-08 — Đưa vào campaign.** `npm run content:promote -- <studio-id> <mã-campaign>`:

1. chuyển nguồn sang `src/content/sources/<mã-campaign>.ts` (đổi `id`, `chapter`, `order` theo manifest)
2. chạy `content:author` cho mã mới
3. đăng ký `catalog.ts`, và trong `manifest.ts` đổi entry của mã đó thành `validated`, kèm `dataPath`
4. xoá bản studio

Mã campaign phải đang ở `planned` trong manifest; nếu không thì lệnh từ chối. Từ đây màn đi qua cổng duyệt như mọi màn khác.

## 5. Điểm độ khó

**DF-01 — `scoreDifficulty(doc, report): DifficultyScore`** trong `src/content/difficulty.ts`, là hàm thuần. Kết quả có dạng `{ score: 1..5, raw: number, parts: Record<PartName, number> }`. Các thành phần, mỗi cái chuẩn hoá về 0–1:

| Thành phần | Cách tính |
|---|---|
| `pieces` | `(số mảnh − 1) / 6`, chặn ở 1 |
| `choices` | `log2(tích số lựa chọn của từng mảnh) / 20`; màn `free` dùng số tư thế của FP-06 |
| `hollow` | ô rỗng / (ô rỗng + ô mục tiêu) |
| `revive` | ô hiện lại (lẻ lớp, ≥ 3) / ô mục tiêu |
| `nearMiss` | `1 − min(số ô đổi của các tư thế nhiễu) / ô mục tiêu`; màn `free` lấy số ô đổi nhỏ nhất khi dịch một mảnh đi 8 ô |
| `hiddenEdges` | phần viền của các mảnh trong nghiệm **không** nằm trên viền mục tiêu, tính theo số đoạn biên ô |

`raw` là tổng có trọng số của các thành phần. Bộ trọng số khởi đầu:

| `pieces` | `choices` | `hollow` | `revive` | `nearMiss` | `hiddenEdges` |
|---|---|---|---|---|---|
| 0,20 | 0,25 | 0,10 | 0,10 | 0,15 | 0,20 |

`score` là `raw` quy về 1–5 theo ngưỡng hiệu chỉnh.

**DF-02 — Hiệu chỉnh.** Các ngưỡng và trọng số được chọn sao cho 16 màn đã có cho điểm lệch tối đa 1 so với độ khó ước lượng trong spec Chương 1 và spec C. Ví dụ: 1-1 ≈ 1, 2-5 ≈ 4, 3-6 ≈ 4, 3-10 ≈ 5. Bảng hiệu chỉnh được lưu trong test. Mỗi lần đổi trọng số phải chạy lại test này.

**DF-03 — Cảnh báo.** Khi `|score − difficultyEstimate| > 1`, validator trả một **cảnh báo** (không phải lỗi). Báo cáo và Xưởng hiện cảnh báo này; nó không chặn lưu hay duyệt.

## 6. Kiểm thử

- `difficulty.test.ts`: từng thành phần với fixture tay; bảng hiệu chỉnh 16 màn (DF-02).
- `studioPlugin.test.ts`, gọi handler trên thư mục tạm, không cần server thật:
  - lưu tạo đủ bốn file
  - nguồn sinh ra qua `buildLevelDocument` cho đúng JSON đã ghi
  - từ chối id sai mẫu, id có `..` hoặc `/`, id trùng màn campaign
  - xoá chỉ xoá đúng bốn file
- `serializeLevelSource.test.ts`: lưu rồi import lại cho ra `LevelSource` bằng nhau (khứ hồi).
- `promote.test.ts`, trên thư mục tạm: chuyển đúng file, cập nhật manifest, từ chối khi mã đích không ở `planned`.
- Ảnh chụp `studio.html` bằng Chrome headless ở 1440 × 900: thấy đủ ba cột, một màn mẫu có bóng chẵn/lẻ và bảng điểm.

## 7. Tiêu chí hoàn thành

Người review mở `studio.html` và làm được trọn vòng sau mà không cần sửa code:

1. clone 3-4
2. thêm một mảnh, thêm neo nhiễu
3. thấy số nghiệm và điểm độ khó cập nhật
4. Lưu, rồi Chơi thử thắng được ở harness
5. chạy `content:promote` đưa màn vào một mã `planned`
6. `npm test` và `npm run build` xanh, và bản build không chứa `studio.html`

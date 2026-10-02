# E — Xưởng tạo màn (Level Studio) và điểm độ khó tự động

Ngày: 2026-10-02 (sửa 2026-10-03, xem mục 9) · Phạm vi: `game-next` (trang dev mới, plugin Vite, module domain dùng chung) · Phụ thuộc: A, B (bộ ghép hình, `content:new`), D (đặt tự do, bộ giải).

Spec này chia làm ba giai đoạn **E1 → E2 → E3** (mục 8). Mỗi giai đoạn có plan riêng, merge riêng được.

## 1. Mục tiêu

Một **không gian riêng** để người thiết kế tự dựng màn trên dev server:

- kéo mảnh, xem bóng chẵn/lẻ trực tiếp
- thêm neo nhiễu hoặc chọn đặt tự do, và xoay
- kiểm nghiệm duy nhất và đọc điểm độ khó ngay trên trang
- lưu vào repo, chơi thử ngay, rồi đưa màn vào campaign bằng một lệnh

**Ngoài phạm vi:** dùng Xưởng trên điện thoại; nhiều người cùng sửa một màn; Xưởng trong bản build phát hành; hoàn tác/làm lại.

## 2. Nơi chạy

**ST-01.** Xưởng là trang `game-next/studio.html` cùng entry `src/studio/main.ts`:

- Viết bằng TypeScript, DOM và SVG, không dùng Phaser.
- Chỉ có khi chạy `npm run dev`; mở `http://localhost:5173/studio.html`.
- `vite build` không đưa trang này vào bundle (`build.rollupOptions.input` chỉ gồm `index.html`). Repo hiện chưa có `vite.config.ts`; E2 tạo file này.
- Xưởng import trực tiếp các module domain và content của game: `shapes`, `mask`, `validate`, `authoring`, `authoringReport`, `kit`, bộ giải của spec D. Những gì Xưởng thấy đúng là những gì game sẽ chạy.

## 3. Bố cục và thao tác

Bố cục desktop, chiều rộng ≥ 1280px, ba cột:

**ST-02 — Cột trái: kho màn.**

- Danh sách màn studio (lấy từ `GET /__studio/list`, ST-05), rồi tới các màn campaign có nguồn (đọc từ `manifest.ts`).
- Trạng thái hiển thị cạnh mỗi màn:
  - màn campaign: `status` trong manifest (`validated`, `approved`…)
  - màn studio: nhãn `studio` kèm `difficultyEstimate`; màn đang mở có thay đổi chưa lưu thì thêm dấu `●`
- Nút **Tạo mới** (từ `_template.ts`), **Clone** (từ màn đang chọn; dùng cùng logic với `content:new` của spec B) và **Xoá** (chỉ với màn studio, có hộp xác nhận).
- Tạo mới và Clone hỏi mã màn mới. Mã phải hợp lệ theo ST-06 và chưa có trong danh sách.
- Màn campaign chỉ mở để xem và clone. Muốn sửa thì phải clone sang studio trước.

**ST-03 — Cột giữa: bàn.**

- Bàn 128 × 160 vẽ bằng SVG, tỉ lệ 4px/ô, có lưới hiển thị và module như ảnh xem trước của authoring.
- **Thanh hình phía trên:** loại hình, cỡ khung (chỉ hiện các cỡ hợp lệ theo `isValidFrame` của spec A) và hướng. Bấm một hình để đặt mảnh mới vào giữa bàn.
- **Kéo mảnh:** gốc khung hít vào giao điểm lưới gần nhất (dùng `nearestGridOrigin` của spec D), cho cả màn neo lẫn màn `free`. Gốc được kẹp để khung nằm trong bàn. Vị trí mảnh lúc thả chính là neo A.
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

- **Thông tin màn:** mã (chỉ đọc), tên, chương, `placement`, `rotationEnabled`, mục tiêu học, câu thơ, các bước FTUE (trigger, điều kiện kết thúc, chữ), và `difficultyEstimate` do tác giả ghi.
- **Đổi mã:** mã chỉ đặt lúc Tạo mới hoặc Clone. Muốn đổi mã thì Clone sang mã mới rồi Xoá bản cũ.
- **Kiểm tra trực tiếp**, chạy lại 300 ms sau thao tác cuối, trong Web Worker để không làm đơ trang:
  - lỗi validator (mã và trường)
  - số nghiệm, số nghiệm ít mảnh hơn, `proven`
  - thời gian giải
  - cảnh báo (DF-03)
- **Điểm độ khó** (mục 5): số 1–5 kèm biểu đồ thanh của từng thành phần.
- **Nút:**
  - **Lưu:** tắt khi có lỗi validator.
  - **Chơi thử:** mở tab game với `?scene=play&level=<id>&mode=harness`. Tắt khi có thay đổi chưa lưu.
  - **Mở SVG:** mở ảnh xem trước của trạng thái đang sửa trong tab mới.

## 4. Lưu vào repo

**ST-05 — Endpoint dev.** Plugin Vite `studioPlugin` chỉ gắn khi `command === 'serve'` và thêm ba route:

- `GET /__studio/list`. Trả `[{ id, title, chapter, difficultyEstimate }]` của các màn trong `src/content/studio/levels/`, sắp theo `id`.
- `POST /__studio/save`. Body là `{ source: LevelSource }`. Server tự dựng tài liệu bằng `buildLevelDocument`, chạy `validateLevel`, rồi ghi bốn file:
  - `src/content/studio/<id>.ts`: nguồn, sinh bằng hàm `serializeLevelSource`, định dạng giống nguồn viết tay để diff dễ đọc
  - `src/content/studio/levels/<id>.json`
  - `docs/testing/levels/studio/<id>.svg`
  - `docs/testing/levels/studio/<id>-report.md`
- `POST /__studio/delete` với body `{ id }`, xoá đúng bốn file trên.

Lưu chỉ bị từ chối (`400`) khi dựng tài liệu hoặc validator lỗi. Nhiều nghiệm hay nghiệm ít mảnh hơn **không** chặn lưu; chúng hiện ở cột phải và chặn `content:promote`.

Trang Xưởng không import `src/content/studio/**`, nên lưu file không làm dev server tải lại trang Xưởng. Sau khi Lưu hoặc Xoá, Xưởng gọi lại `GET /__studio/list`.

**ST-06 — An toàn.**

- `id` phải khớp `^[a-z0-9-]{1,32}$`.
- Mọi đường dẫn được dựng từ `id` trên hai thư mục gốc cố định, rồi chuẩn hoá và kiểm vẫn nằm trong thư mục gốc; ngoài ra thì trả `400`.
- Server không nhận đường dẫn từ client.
- `id` trùng bất kỳ mã nào trong `manifest.ts` hoặc `src/content/sources/` thì trả `409`. Màn studio không bao giờ chiếm mã campaign; mã campaign chỉ được gán lúc promote.
- Chống trang lạ gọi endpoint (CSRF):
  - `POST` phải có `Content-Type: application/json`; sai thì `415`. Điều này buộc trình duyệt gửi preflight với yêu cầu khác nguồn.
  - Header `Origin`, nếu có, phải trùng `http://<Host>` của chính request; sai thì `403`.
- Body lớn hơn 1 MB trả `413`.

**ST-07 — Màn studio trong game.**

- `catalog.ts` nạp thêm `src/content/studio/levels/*.json` qua `import.meta.glob`, **chỉ khi `import.meta.env.DEV`**, và chỉ cho chế độ harness.
- `loadLevel(id, 'harness')` tìm theo thứ tự: manifest (như hiện tại), màn dev của spec A, rồi màn studio. Màn studio vẫn qua `validateLevel` như mọi màn.
- Màn studio không có trong manifest, không hiện trên bản đồ chọn màn, và campaign không bao giờ nạp chúng.

**ST-08 — Đưa vào campaign.** `npm run content:promote -- <studio-id> <mã-campaign>`:

1. đọc `src/content/studio/levels/<studio-id>.json`, dựng lại `LevelSource`, đổi `id`, `chapter`, `order` theo manifest, giữ `title` và `contentRevision`
2. ghi `src/content/sources/<mã-campaign>.ts` và đăng ký vào `sources/index.ts`
3. chạy authoring cho mã mới (JSON, SVG, báo cáo), từ chối nếu không có đúng một nghiệm
4. đăng ký `catalog.ts`, và trong `manifest.ts` đổi entry của mã đó thành `validated`, kèm `dataPath`
5. xoá bản studio

Mã campaign phải đang ở `planned` trong manifest; nếu không thì lệnh từ chối và không ghi gì. Sửa tay file `.ts` của màn studio không có tác dụng với promote: phải mở và Lưu lại trong Xưởng trước. Từ đây màn đi qua cổng duyệt như mọi màn khác.

## 5. Điểm độ khó

**DF-01 — `scoreDifficulty(doc, report): DifficultyScore`** trong `src/content/difficulty.ts`, là hàm thuần. Kết quả có dạng `{ score: 1..5, raw: number, parts: Record<PartName, number> }`. Số lớp của từng ô tính trên nghiệm mẫu thứ nhất, ô đã xoay theo `turns`. Các thành phần, mỗi cái chặn trong 0–1:

| Thành phần | Cách tính |
|---|---|
| `pieces` | `(số mảnh − 1) / 6` |
| `choices` | `Σ log2(max(1, report.poseCounts[i])) / 20`, cho cả màn neo lẫn màn `free` |
| `hollow` | ô có số lớp chẵn ≥ 2 / (ô đó + ô mục tiêu) |
| `revive` | ô có số lớp lẻ ≥ 3 / ô mục tiêu |
| `nearMiss` | màn neo: `1 − min(changedCells) / ô mục tiêu` trên các dòng `report.distractors` có `changedCells !== null`; không có dòng nào thì 0. Màn `free`: dịch từng mảnh của nghiệm đi 8 ô theo 4 hướng, bỏ hướng làm mảnh ra ngoài bàn, lấy số ô đổi nhỏ nhất |
| `hiddenEdges` | số đoạn biên ô của các mảnh trong nghiệm mà hai ô hai bên **cùng** là mục tiêu hoặc **cùng** không là mục tiêu, chia cho tổng số đoạn biên ô của các mảnh. Phía ngoài mép bàn coi là không mục tiêu |

`raw` là tổng có trọng số của các thành phần:

| `pieces` | `choices` | `hollow` | `revive` | `nearMiss` | `hiddenEdges` |
|---|---|---|---|---|---|
| 0,20 | 0,25 | 0,10 | 0,10 | 0,15 | 0,20 |

`score = 1 + số ngưỡng mà raw ≥ ngưỡng`, ngưỡng `[0.14, 0.26, 0.43, 0.50]`.

**DF-02 — Hiệu chỉnh.** Trọng số và ngưỡng trên cho điểm lệch tối đa 1 so với độ khó ước lượng của 22 màn đã có (6 màn Chương 1 và 16 màn spec C). Ví dụ: 1-1 = 1, 1-5 = 3, 2-5 = 3, 3-10 = 4. Không bộ ngưỡng nào cho được đồng thời 3-6 = 4 và 3-10 = 5 vì raw của 3-6 lớn hơn raw của 3-10; bảng chọn 3-6 → 5, 3-10 → 4. Bảng hiệu chỉnh được lưu trong test. Mỗi lần đổi trọng số hay ngưỡng phải chạy lại test này.

**DF-03 — Cảnh báo.** Khi `|score − difficultyEstimate| > 1`, hàm `collectWarnings` trả cảnh báo `difficulty-mismatch`. `ValidationResult` của validator **không đổi**. Báo cáo màn (mục `## Cảnh báo`, chỉ in khi có cảnh báo) và Xưởng hiện cảnh báo này; nó không chặn lưu hay duyệt.

## 6. Kiểm thử

- `difficulty.test.ts`: từng thành phần với fixture tay; bảng hiệu chỉnh 22 màn (DF-02).
- `serializeSource.test.ts`: lưu rồi import lại cho ra `LevelSource` bằng nhau (khứ hồi) trên mọi nguồn; khoá byte trên 1-1.
- `studioStore.test.ts`, trên thư mục tạm:
  - lưu tạo đủ bốn file
  - nguồn sinh ra qua `buildLevelDocument` cho đúng JSON đã ghi
  - từ chối id sai mẫu, id có `..` hoặc `/`, id trùng mã campaign
  - xoá chỉ xoá đúng bốn file; list trả đúng danh sách
- `studioPlugin.test.ts`, gọi handler không cần server thật: mã lỗi `400`, `403`, `409`, `413`, `415`.
- `promote.test.ts`, trên thư mục tạm: chuyển đúng file, cập nhật manifest, từ chối khi mã đích không ở `planned` hoặc màn không có đúng một nghiệm.
- Ảnh chụp `studio.html` bằng Chrome headless ở 1440 × 900: thấy đủ ba cột, một màn mẫu có bóng chẵn/lẻ và bảng điểm.

## 7. Tiêu chí hoàn thành

Người review mở `studio.html` và làm được trọn vòng sau mà không cần sửa code:

1. clone 3-4 (nếu Chương 2 chưa có trong nhánh: clone 1-4)
2. thêm một mảnh, thêm neo nhiễu
3. thấy số nghiệm và điểm độ khó cập nhật
4. Lưu, rồi Chơi thử thắng được ở harness
5. chạy `content:promote` đưa màn vào một mã `planned`
6. `npm test` và `npm run build` xanh, và bản build không chứa `studio.html`

## 8. Giai đoạn

| Giai đoạn | Mục spec | Giao được gì khi đứng riêng | Phụ thuộc |
|---|---|---|---|
| **E1 — Điểm độ khó** | DF-01..03 | Mọi báo cáo màn có điểm và cảnh báo độ khó | A, B, D |
| **E2 — Hạ tầng lưu và đưa vào campaign** | ST-05..08 (kèm phần build của ST-01) | Lưu, liệt kê, xoá màn studio qua HTTP; chơi màn studio ở harness; `content:promote` | E1 |
| **E3 — Trang Xưởng** | ST-01..04, mục 7 | `studio.html` làm trọn vòng ở mục 7 | E2 |

Tiêu chí ở mục 7 là tiêu chí của E3. E1 và E2 có tiêu chí riêng trong plan của mình.

## 9. Điều chỉnh khi viết plan (2026-10-03)

Các chỗ sửa sau lần duyệt đầu, người duyệt cần xem lại:

1. **DF-01** định nghĩa chính xác từng thành phần và cách quy về 1–5 (trước đây để ngỏ).
2. **DF-02** bỏ ví dụ "3-6 ≈ 4, 3-10 ≈ 5" vì không đạt được; ghi bảng thực tế. Hiệu chỉnh trên 22 màn thay vì 16.
3. **DF-03** cảnh báo đi qua `collectWarnings`, không đổi `ValidationResult`.
4. **ST-05** thêm `GET /__studio/list`. Xưởng không còn dựa vào việc dev server tải lại trang sau khi Lưu.
5. **ST-06** thêm chống CSRF (`415`, `403`), giới hạn body (`413`). Mã studio không được trùng bất kỳ mã nào trong manifest (trước đây chỉ cấm trùng `sources/`).
6. **ST-02, ST-04** định nghĩa trạng thái trong kho màn; mã màn chỉ đọc, đổi mã bằng Clone + Xoá; Chơi thử tắt khi có thay đổi chưa lưu.
7. **ST-07** ghi thứ tự tìm màn trong `loadLevel`.
8. **ST-08** promote đọc JSON studio, giữ `title` và `contentRevision`, từ chối khi không có đúng một nghiệm.
9. **Mục 7** thêm phương án clone 1-4 khi chưa có Chương 2.
10. **Mục 8** chia ba giai đoạn E1/E2/E3.

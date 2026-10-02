# B — Bộ khung clone màn và cấu trúc 4 chương

Ngày: 2026-10-02 · Phạm vi: `game-next`, `docs/` · Phụ thuộc: A (bộ hình v2), công cụ authoring của Chương 1 (`content/authoring.ts`, `authoringReport.ts`, `scripts/author-level.ts`).

## 1. Mục tiêu

- Tạo màn mới bằng cách **clone** một màn có sẵn hoặc một file mẫu.
- Đặt mảnh bằng **hàm ghép hình** (theo tâm, đối xứng, đồng tâm, lặp, neo nhiễu) thay vì tự tính gốc khung.
- Đổi campaign thành **4 chương, 28 màn**: thêm chương **Họa Phẩm** làm Chương 3, chương xoay thành Chương 4.

## 2. Lệnh tạo màn

**KIT-01 — `npm run content:new -- <id> [--from <id-nguồn>] [--title "<tên>"]`**, chạy bằng `node --experimental-strip-types scripts/new-level.ts`:

1. Từ chối nếu `<id>` đã có nguồn trong `src/content/sources/` hoặc `src/content/studio/`.
2. Có `--from`: đọc file nguồn của `<id-nguồn>` (tìm trong `sources/` rồi `studio/`), đổi `id`, `order`, tên hằng xuất (`export const <camelCase của tên>`), đặt `contentRevision` thành `<slug>-v1`. Không có `--from`: sao chép `src/content/sources/_template.ts`.
3. Ghi `src/content/sources/<id>.ts` và đăng ký vào `sources/index.ts` (thêm một dòng `import` và một dòng trong bảng, giữ thứ tự theo id).
4. In đường dẫn file mới và lệnh tiếp theo: `npm run content:author -- <id>`.

Lệnh **không** sửa `manifest.ts` hay `catalog.ts`; việc đăng ký vào campaign vẫn qua cổng `validated` → `approved` như Chương 1.

**KIT-02 — `_template.ts`.** Một `LevelSource` hợp lệ tối thiểu (một mảnh vuông 48 đặt giữa bàn), mỗi trường có comment tiếng Việt nói rõ ý nghĩa, giá trị cho phép và ví dụ. File không được đăng ký trong `LEVEL_SOURCES`.

## 3. Thư viện ghép hình `src/content/kit.ts`

Toàn bộ là hàm thuần, trả về `PieceSource` (spec Chương 1, mục 4). Mọi hàm ném `Error` tiếng Việt khi toạ độ sai lưới hoặc khung sai loại hình (dùng `isValidFrame` của spec A).

| Hàm | Ý nghĩa |
|---|---|
| `piece(id, kind, size, center, opts?)` | Đặt mảnh theo **tâm khung** `center = [cx, cy]`. Gốc khung = tâm − size/2, phải là bội của 8. `opts.orientation` mặc định 0; `opts.decoys` là danh sách độ lệch neo nhiễu. |
| `mirrorX(p, axisX, newId)` | Bản đối xứng trái–phải qua đường thẳng đứng x = `axisX`. Đổi hướng tam giác TL↔TR, BL↔BR, mái 5↔7 (4 và 6 giữ nguyên); bình hành 0↔2, 1↔3. Neo nhiễu được lật theo. |
| `mirrorY(p, axisY, newId)` | Tương tự theo trục ngang: TL↔BL, TR↔BR, mái 4↔6; bình hành 0↔2, 1↔3. |
| `concentric(center, specs)` | Nhiều mảnh chung tâm; `specs = [{ id, kind, size, orientation?, decoys? }]`. |
| `row(idPrefix, kind, size, startCenter, step, count, opts?)` | Lặp mảnh theo bước `step = [dx, dy]`. Id là `<idPrefix>1..n`. |
| `decoys(offsets)` | Hằng sẵn: `NUDGE = [[8,0],[-8,0],[0,8]]`, `CROSS = [[8,0],[-8,0],[0,8],[0,-8]]`. |

**KIT-03 — Luật neo nhiễu.** Do `buildLevelDocument` áp dụng, không phải hàm ghép hình:

- Bỏ neo nhiễu vượt biên bàn.
- Bỏ neo nhiễu trùng neo A của một mảnh **cùng hình, cùng hướng, cùng khung**. Lý do: hai mảnh giống nhau đổi chỗ được sẽ sinh nghiệm thứ hai; lỗi này đã gặp ở bản nháp 3-8.

Neo bị bỏ được liệt kê trong báo cáo `<id>-report.md`.

## 4. Tài liệu `docs/content/level-kit.md`

1. Bảng hình (spec A, mục 3), có ảnh minh hoạ từng hướng sinh từ `renderPreviewSvg`.
2. Lưới: 128 × 160 ô logic, 1 ô hiển thị = 8, 1 module = 24; công thức tâm ↔ gốc khung.
3. Luật chẵn lẻ, kèm bảng số lớp → hiện/ẩn.
4. Quy trình: `content:new` → sửa nguồn → `content:author` → xem SVG, báo cáo nghiệm, chơi harness → `validated` → duyệt → `approved`.
5. Ba màn mẫu có chú thích từng dòng để clone: 1-2 (ghép cạnh), 2-3 (rỗng và hiện lại), 3-10 (mandala chung tâm).
6. Mẹo tăng độ khó: thêm neo nhiễu gần, giấu cạnh mảnh vào vùng rỗng, dùng chế độ đặt tự do (spec D).

## 5. Cấu trúc 4 chương

**CH-01 — Kiểu dữ liệu.** `chapter: 1 | 2 | 3 | 4` trong `ManifestEntry`, `LevelDocument` và `Level`. Luật `rotationEnabled` của validator: `false` ở chương 1–3, `true` ở chương 4. Mã lỗi `chapter-rotation-disabled` giữ nguyên tên.

**CH-02 — Manifest 28 màn:**

| Chương | Tên | Màn | Nguồn nội dung |
|---|---|---|---|
| 1 | Khởi Nguyên | 1-1 → 1-6 | spec Chương 1 |
| 2 | Giao Thoa | 2-1 → 2-6 | spec C (2-5 đổi thành **Đồng Hồ Cát**) |
| 3 | **Họa Phẩm** | 3-1 → 3-10 | spec C |
| 4 | Luân Chuyển (xoay) | 4-1 → 4-6 | Đổi mã từ 3-1 → 3-6 cũ, giữ tên và trạng thái `planned` |

Trường `order` đánh lại từ 1 đến 28. Các màn chưa có dữ liệu giữ `planned`.

**CH-03 — Bản đồ chọn màn.** `LevelSelectScene` hiện vẽ 3 chòm sao 6 nút. Sửa để số chòm sao và số nút suy ra từ manifest, không viết cứng. Chòm sao Họa Phẩm có 10 nút; bố cục 10 nút cần một mẫu toạ độ riêng trong `constellationMotion.ts` hoặc module bố cục tương ứng. Kiểm bằng ảnh chụp: không nút nào đè lên nhau hay tràn khỏi màn 720 × 1280.

**CH-04 — Release.** `content:validate --release` yêu cầu đủ 28 màn `approved` (thay cho 18).

**CH-05 — GDD.** Cập nhật `docs/gdd/master-gdd.md`:

- mục 4 (campaign) có 4 chương
- Phụ lục B thêm 10 màn Họa Phẩm và đổi mã chương xoay
- ghi rõ luật chẵn lẻ (spec A, mục 2)

## 6. Kiểm thử

- `kit.test.ts`:
  - `piece` đổi tâm ra gốc đúng và từ chối tâm lệch lưới
  - `mirrorX` của mỗi hướng tam giác và bình hành cho đúng ảnh gương; đối chiếu bằng tập ô
  - `concentric` và `row` cho đúng gốc khung
- `newLevel.test.ts`, chạy logic của script trên thư mục tạm, không đụng repo thật:
  - clone đổi đúng `id`, `order`, tên hằng, revision
  - từ chối id đã tồn tại
  - đăng ký đúng thứ tự trong `index.ts`
- `authoring.test.ts`: luật neo nhiễu KIT-03, gồm trường hợp 3-8 hai hình tròn giống nhau.
- `content.test.ts`, `catalog.test.ts`, `levelSelect.test.ts`: manifest 28 màn, 4 chương, luật xoay ở chương 4, bản đồ 4 chòm sao.

## 7. Tiêu chí hoàn thành

Từ một repo sạch, `npm run content:new -- 3-11 --from 3-4` rồi `npm run content:author -- 3-11` sinh được SVG và báo cáo mà không cần sửa tay (sau khi kiểm xong, xoá màn thử này). Campaign hiển thị 4 chòm sao. Mọi kiểm tra đều xanh.

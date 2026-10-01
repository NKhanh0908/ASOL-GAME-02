# Thiết kế: Cải thiện giao diện theo bộ mockup `improve-v1`

- Ngày: 2026-10-01
- Phạm vi: `game-next/` — toàn bộ lớp `presentation`, cộng thay đổi hình học lan tới `domain` và `content`
- Nguồn tham chiếu: `docs/gui/improve-v1/` (4 artboard HTML)

## 1. Mục tiêu

Áp dụng bộ mockup `improve-v1` lên game: vừa thay bảng màu và ngôn ngữ thị giác,
vừa sửa quy tắc hình học mà artboard `GridSpec` chỉ ra là đang sai.

Hai việc này đi cùng nhau có chủ đích. Re-skin mà không sửa hình học thì đỉnh
mảnh vẫn không rơi vào giao điểm lưới, và bộ mockup gọi đó là "lệch (lỗi cũ)".

## 2. Nguồn tham chiếu

Bốn artboard trong `docs/gui/improve-v1/`:

| Thư mục | File | Nội dung |
|---|---|---|
| `Chọn màn · Chòm sao-html` | `LevelMap.dc.html` | Bản đồ màn chơi dạng chòm sao |
| `Lưới thước đo · quy tắc-html` | `GridSpec.dc.html` | Đặc tả hình học — không phải màn chơi |
| `Màn chơi · đang kéo mảnh-html` | `Main.dc.html` | Màn chơi, trạng thái đang kéo |
| `Màn chơi · hoàn thành-html` | `Victory.dc.html` | Màn chơi, trạng thái hoàn thành |

Artboard là **mockup tham chiếu, không phải mã nguồn**. Giá trị cần lấy nằm
trong thuộc tính `style="…"` nội tuyến và khối `<helmet><style>`; phần
`support.js` và `vendor/react*.js` là runtime hiển thị, không thuộc thiết kế.

Mockup dựng trên canvas 390×844. Game chạy canvas 720×1280. Quyết định: **giữ
720×1280**, quy đổi số đo ngang theo hệ số 1.846. Vì tỉ lệ hai canvas khác nhau
(2.164 so với 1.778), bố cục dọc phải co lại chứ không nhân thẳng hệ số.

## 3. Quy tắc hình học (từ `GridSpec`)

Artboard `GridSpec` phát biểu năm quy tắc:

1. **Thoi = vuông xoay 45°.** Hai đường chéo nằm trên đường kẻ ngang và dọc.
   Nửa đường chéo phải là số nguyên ô lưới.
2. **Tam giác vuông.** Hai cạnh góc vuông nằm trên đường kẻ; cạnh huyền trùng
   đường chéo 45° của lưới.
3. **Neo = giao điểm.** Gốc mảnh luôn là bội số của 1 ô lưới; bán kính snap
   tính theo giao điểm gần nhất.
4. **Vẽ đúng đến từng pixel.** Dựng polygon bằng toạ độ nguyên theo ô rồi mới
   scale; viền vẽ phía trong mảnh để mép trùng đường kẻ.
5. **Bố cục đề xuất.** Bàn chơi 128 × 160 ô logic ở 5 px/ô (640 × 800 trên
   canvas 720), lưới hiển thị 8 ô logic mỗi ô, module đậm mỗi 3 ô lưới.

### Sai lệch hiện tại

`1-1.json` có `frameSize: 40`, tức nửa đường chéo 20 ô logic. Với lưới hiển thị
8 ô logic mỗi ô, 20 ÷ 8 = 2.5 ô — không nguyên, vi phạm quy tắc 1. Đỉnh mảnh
rơi vào giữa ô lưới thay vì giao điểm.

Sửa: nửa đường chéo thành **24 ô logic = 3 ô lưới = đúng 1 module**, tức
`frameSize: 48`. Con số này khớp mockup, nơi nửa đường chéo thoi bằng đúng một
module (66px trên lưới 22px).

## 4. Hệ số đo mới

```
Lưới logic      128 × 160      (trước: 128 × 192)
Ô logic         5 px           (trước: 4 px)
Bàn chơi        640 × 800 tại (40, 200)    (trước: 512 × 768 tại (104, 184))
Ô lưới hiển thị 8 ô logic = 40 px
Module          3 ô lưới = 120 px
Nửa đường chéo  24 ô logic = 120 px = 1 module
Khay            640 × 160 tại (40, 1032)
Header          cao 96
Thanh dưới      cao 80 tại y = 1200
Huy hiệu mục tiêu  188 px tại (360, 158)
```

Ngân sách dọc: 96 + 800 + 160 + 80 = 1136 trên 1280, còn 144 px cho khoảng cách
và safe area.

## 5. Kiến trúc

Hướng đã chọn: **token trước, tách module dùng chung, rồi migrate từng màn.**

Lý do: cả bốn màn dùng chung một nền trời và một hệ lưới, nhưng hiện trường sao
bị viết lại **ba lần** với ba hành vi khác nhau — `MenuScene` (nhấp nháy tại
chỗ), `LevelSelectScene` (trôi xuống rồi lặp), `PlayScene` (trôi xuống, biên độ
khác). Gộp lại là việc nên làm dù có re-skin hay không.

Hai module mới:

### `presentation/SkyBackdrop.ts`

```ts
new SkyBackdrop(scene, { seed: number, drift: boolean })
  .update(delta: number): void
  .destroy(): void
```

Chia tĩnh / động để không đốt khung hình:

- **Tĩnh** — vẽ một lần vào `RenderTexture`: gradient trời 4 chặng, 2 nebula,
  quầng trăng góc trên-phải, khoảng 120 sao không nhấp nháy.
- **Động** — `Graphics`, vẽ lại mỗi frame: khoảng 30 sao nhấp nháy, chu kỳ
  3.2 s, lệch pha ngẫu nhiên. Tỉ lệ này khớp mockup, nơi lớp `.tw` chỉ gắn cho
  một phần nhỏ số sao.

`drift: true` giữ hành vi sao trôi xuống của `LevelSelectScene`; `MenuScene` và
`PlayScene` dùng `false`.

`seed` làm trường sao tái lập được — cần cho test và cho ảnh chụp so sánh. Hiện
cả ba scene gọi `Math.random()` thẳng nên không kiểm chứng được gì.

### `presentation/GridPainter.ts`

```ts
paintGrid(scene, boardBounds, tokens): Phaser.GameObjects.RenderTexture
```

Lưới không đổi trong suốt màn chơi nên vẽ một lần vào `RenderTexture`. Hiện
`BoardRenderer.renderBackground` vẽ lưới bằng `Graphics` với hàng trăm lệnh
`lineBetween`.

Năm lớp, theo thứ tự mockup:

1. Lưới mảnh — mỗi 40 px, `#9CC8FF` @ .13
2. Chéo 45° — nét đứt 3/4, `#8FE0FF` @ .16, cả hai chiều
3. Module — mỗi 120 px, `#FFD27A` @ .30
4. Trục giữa — ngang và dọc qua tâm bàn, `#FFD27A` @ .60, dày 1.4
5. Vạch thước và 4 góc ngắm — vạch module dài 9 px, vạch thường 5 px ở bốn mép;
   bốn dấu góc chữ L `#FFD27A` dày 2

Lớp 2 và 5 chưa có trong code hiện tại. Chúng là thứ làm bàn chơi trông có
thước đo thay vì chỉ là ô kẻ.

Rút lưới khỏi `BoardRenderer` làm file giảm từ 535 còn khoảng 380 dòng, và
`renderBackground` còn đúng việc của nó: khung kính và khay.

### `presentation/JewelShape.ts`

`BoardRenderer.drawVectorDiamond` hiện nhận 9 tham số vị trí. Kiểu ngọc mới cần
thêm bốn mặt vát, mặt bàn gradient, quầng sáng và đốm lấp lánh — nhét tiếp sẽ
thành 15 tham số. Tách thành module riêng, đối số dạng object:

```ts
drawJewel(g, { cx, cy, radius, variant, alpha?, glow? })
variant: 'solid' | 'ghost' | 'target' | 'placeholder'
```

`variant: 'solid'` dựng sáu lớp:

1. Quầng sáng mờ phía sau — `#FFC857` @ .6–.75, blur
2. Bốn tam giác mặt vát từ tâm — Bắc `#FFEAA8`, Đông `#FFD56E`, Nam `#EFA53A`,
   Tây `#F9BF4F`
3. Mặt bàn — thoi nhỏ ở giữa, bán kính ~0.45, gradient `#FFFBEA → #F6B443`
4. Bốn đoạn nối từ đỉnh vào mặt bàn — `#FFF7DA` @ .45
5. Viền ngoài `#FFF4CC` dày 2, **vẽ phía trong** mảnh (quy tắc 4 của GridSpec)
6. Một đốm lấp lánh bốn cánh nhấp nháy, lệch về phía trên-trái

Phaser `Graphics` không có gradient fill, nên lớp 1 và 3 dùng texture sinh sẵn
trong `TextureFactory` (thêm key `jewelGlow`, `jewelTable`) rồi đặt chồng —
cùng cách `steleBorder` đang làm.

Ba variant còn lại: `ghost` (đang kéo, mờ và phóng 1.06), `target` (bóng mục
tiêu, viền nét đứt `#DDF2FF` @ .7, nền `#BFE3FF` @ .10), `placeholder` (ô trống
trong khay, thoi nét đứt `#CFEFFF` @ .55).

Năm trạng thái hiện có trong `BoardRenderer` (tray / dragging / temporary /
snapped / target) giữ nguyên, chỉ đổi lời gọi sang `drawJewel`.

## 6. Tokens

Giữ nguyên tên và hình dạng export của `designTokens.ts` (`COLOR_TOKENS`,
`COLOR_NUMBERS`, `LAYOUT_TOKENS`, `ANIM_TOKENS`, `DEPTH_TOKENS`) để không scene
nào gãy vì đổi tên. Chỉ đổi giá trị và thêm nhóm mới.

Đổi giá trị:

```
navy.spaceBackground   #080E24 → gradient #1A2470 / #2B3192 / #4A3A9E / #6B4BA8
navy.steleSurface      #101B32 → gradient #1D3482 → #14215E
iceGlass.primaryBorder #68B8DC → #A9E3FF
```

Thêm nhóm:

```ts
GRID_TOKENS  = { logicCell: 5, displayCell: 8, moduleCells: 3,
                 fine: '#9CC8FF' @.13, module: '#FFD27A' @.30,
                 axis: '#FFD27A' @.60, diagonal: '#8FE0FF' @.16 dash 3/4,
                 tick: '#FFE3A0' @.75, corner: '#FFD27A' }
GLASS_TOKENS = { frameGradient, glowOuter, shadowDrop }
PIECE_TOKENS = { faceN: '#FFEAA8', faceE: '#FFD56E',
                 faceS: '#EFA53A', faceW: '#F9BF4F',
                 outline: '#FFF4CC', outlineWidth: 2,
                 tableGradient, glowBlur }
```

`PIECE_TOKENS` tách bốn mặt vát là điểm mới: mockup vẽ thoi thành bốn tam giác
màu khác nhau, sáng ở trên-trái và tối ở dưới-phải, chứ không phải một khối
phẳng. Đó là thứ tạo cảm giác viên ngọc.

## 7. Khung kính

Mockup bọc bàn chơi và khay bằng cùng một loại khung: gradient băng
`#E6F7FF → #8BD3F5 → #4E9BD0 → #2D5E9A`, bo 30 px, viền trắng 1 px @ .25, glow
xanh 34 px, đổ bóng xuống 40 px.

Thay mã bevel thủ công hiện tại trong `BoardRenderer` (khoảng 30 dòng, hai cung
`arc` dựng sáng/tối) bằng một hàm chung trong `TextureFactory`:

```ts
makeGlassFrame(w: number, h: number, radius: number): string  // texture key
```

Texture 9-slice, dùng cho cả bàn, khay, và sau này các dialog.

## 8. HUD

`Hud.ts` đổi theo mockup, giữ nguyên cấu trúc:

- Nút tròn: viền `#A9E3FF` dày 2–3, nền radial `#3D5FC0 → #1B2A72`, glow xanh,
  highlight trong 2 px phía trên
- Tiêu đề giữa: "Song Tinh", `Playfair Display` 800 / 52 px, cộng phụ đề
  "Chương I · Màn 1-1" 24 px `#CFE3FF`
- Thanh đếm dưới: viên thuốc bo tròn, nền `rgba(15,25,80,.6)`, viền `#A9E3FF`
  @ .6, bên trong hai icon thoi (đặc = đã khớp, nét đứt = còn lại) và chữ
  "1/2 mảnh đã khớp"
- Nhãn "Thả để khớp" nổi cạnh mảnh khi kéo trúng vùng snap — **chưa có**, là
  bổ sung từ mockup

## 9. Màn Victory

Màn hoàn thành đã tồn tại dưới dạng `hud.showWinModal()`. Đây là thiết kế lại,
không phải thêm mới.

Mockup không dùng hộp thoại đè lên. Nó giữ nguyên bàn chơi đã hoàn thành làm
nền, chỉ phủ tối nhẹ:

- Bàn chơi giữ nguyên, hai mảnh đã khớp phát sáng mạnh hơn; hai vòng thiên cầu
  quay nhanh gấp ba — `updateCelestialRings` đã nhận sẵn tham số `isWon`
- Chữ "Hoàn thành", `Playfair Display`, phía trên bàn
- Câu thơ dưới bàn, in nghiêng, `#CFE3FF`
- Hai nút: "Màn tiếp theo" (nút chính amber) và "Chọn màn" (nút phụ viền băng)

Câu thơ là nội dung theo từng màn nên thuộc về file level, không phải code:
thêm trường tuỳ chọn `victoryVerse?: string` vào schema. Màn nào không khai báo
thì ẩn dòng đó. Giá trị cho 1-1: "Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân
bằng."

## 10. Màn chọn màn

`LevelSelectScene` đã là bản đồ chòm sao: node zigzag, đường nối, banner chương,
tự cuộn tới màn hiện tại. Đây là re-skin, không phải vẽ lại. `buildConstellation`
và logic cuộn giữ nguyên.

- Nền: thay trường sao tự chế bằng `SkyBackdrop({ drift: true })`
- Đường nối node: mockup dùng đường mảnh có đốm sáng chạy dọc, làm bằng
  `stroke-dashoffset`. Phaser không có thuộc tính tương đương, nên làm bằng một
  đốm sáng nhỏ tween dọc theo đường, chu kỳ 6 s
- Node: bốn texture `nodeCompleted` / `nodeCurrent` / `nodeUnlocked` /
  `nodeLocked` vẽ lại — hoàn thành là thoi amber đặc, hiện tại có vòng xung
  nhấp nháy, mở khoá là viền băng, khoá thì xám mờ
- Banner chương: `Playfair Display`, đường kẻ amber hai bên
- Thêm chỉ số tiến độ "1/18" ở header, lấy từ `progressRepository`

`MenuScene` chỉ đổi nền sang `SkyBackdrop` và áp token màu mới; bố cục giữ
nguyên.

## 11. Thay đổi lan tới domain và content

Đổi lưới logic từ 128×192 sang 128×160 chạm vào:

| File | Thay đổi |
|---|---|
| `src/domain/model.ts` | `GRID_HEIGHT` 192 → 160 |
| `src/content/document.ts` | kiểu `board: { width: 128; height: 192 }` → 160 |
| `src/content/fixtures.ts` | `board: { width: 128, height: 192 }` → 160 |
| `src/presentation/layout.ts` | `cellPixel` 4 → 5; kiểu `cellPixel: 4` nới thành `5` |
| `src/presentation/TargetBadge.ts` | bỏ hai chỗ hardcode số 192 (dòng 115, 118) |
| `src/content/levels/1-1.json` | sinh lại |

`geometry.ts`, `mask.ts`, `validate.ts` đọc hằng số từ `model.ts` nên tự theo.

### Script sinh lại content

`game-next/scripts/regen-level-geometry.ts` — chạy một lần, commit kết quả:

- `frameSize` 40 → 48; rasterize lại hình thoi với nửa đường chéo 24 ô
- `targetCells`: nội dung hiện nằm ở y 76..115 (tâm 96 của lưới 192). Dịch y đi
  −16 để về tâm 80 của lưới 160, rồi rasterize lại theo kích thước mảnh mới
- `anchors`: D1 (24,76) → (24,60) và (24,92) → (24,76); D2 tương tự với x = 64
- `board.height` 192 → 160
- thêm `victoryVerse`

Sinh bằng script, không sửa tay: `cells` của mỗi mảnh hiện có 840 phần tử và
`targetCells` có 1680.

## 12. Thứ tự thi công

Mỗi bước giữ `npm run test` và `npm run typecheck` xanh trước khi sang bước sau.
Bốn bước là bốn commit riêng.

1. **Nền móng** — tokens, domain, content, script sinh lại hình học.
   Nghiệm thu: `content:validate` xanh, `typecheck` xanh, và một test mới khẳng
   định mọi đỉnh mảnh rơi đúng bội số của một ô lưới hiển thị (40 px).
2. **Module dùng chung** — `SkyBackdrop`, `GridPainter`; ba scene bỏ code trường
   sao trùng lặp. Nghiệm thu: `skyBackdrop.test.ts` (cùng seed cho cùng toạ độ
   sao; `drift` đổi hành vi `update`), `gridPainter.test.ts` (đủ năm lớp, đường
   module đúng bội số 120 px, số vạch thước khớp kích thước bàn).
3. **Mảnh và khung** — `JewelShape`, `makeGlassFrame`, HUD. Nghiệm thu:
   `boardRenderer.test.ts`, `textureFactory.test.ts`, `hud.test.ts` cập nhật.
4. **Các màn còn lại** — Victory, LevelSelect, Menu. Nghiệm thu:
   `levelSelect.test.ts`, `menu.test.ts` cập nhật.

## 13. Rủi ro

**Bước 1 làm đỏ một loạt test đang giả định lưới 192** — `kernel.test.ts`,
`layout.test.ts`, `content.test.ts`. Đó là đỏ đúng: chúng phải đổi theo. Nhưng
nghĩa là bước 1 không nhỏ và không nên gộp commit với phần vẽ.

**Phaser thiếu gradient fill và dash-offset animation.** Hai chỗ phải đi đường
vòng: gradient dùng texture sinh sẵn (lớp quầng sáng, mặt bàn, khung kính);
hiệu ứng đốm sáng chạy trên đường nối dùng tween một đốm nhỏ thay vì dash-offset.
Kết quả sẽ gần mockup chứ không trùng khít.

**Chi phí vẽ mỗi frame.** Trường sao và lưới nếu vẽ lại mỗi frame sẽ nặng. Thiết
kế đã tách tĩnh / động để tránh: lưới và phần lớn sao vào `RenderTexture`, chỉ
khoảng 30 sao nhấp nháy là vẽ lại.

## 14. Ngoài phạm vi

- Không đổi canvas sang 390×844 hay sang layout co giãn theo tỉ lệ màn
- Không đổi `GRID_WIDTH` (giữ 128)
- Không đổi luật chơi, luật snap, hay logic tiến độ
- Không thiết kế lại `SettingsDialog` và `PauseDialog` — hai file này chỉ nhận
  token màu mới, giữ nguyên hình dạng
- Không thêm màn chơi mới; chỉ 1-1 được sinh lại hình học

# F2 — Cảm giác chơi trong màn: mảnh texture, chuyển động mượt và chuỗi thắng

Ngày: 2026-10-03 · Phạm vi: `game-next` · Phụ thuộc: **F1** (`2026-10-03-f1-scene-transitions-design.md`). F2 dùng `motion.ts`, `motionScale`, `TransitionTimeline` và cài đặt `reducedMotion` của F1. Không đổi domain, content hay luật chẵn/lẻ.

## 1. Mục tiêu

Trong màn chơi, mọi thay đổi hiện đều nhảy tức thời:

- Mảnh nhảy vào neo, nhảy về khay và đổi hướng ngay khi xoay.
- Vùng giao đổi màu tức thì.
- Khung bia đổi vàng bằng `setTexture`.

Nguyên nhân gốc:

1. **Không có vòng render theo khung hình.** `PlayScene.update()` chỉ cập nhật bầu trời. Bàn chỉ vẽ lại khi có `pointermove` hoặc `pointerup`, nên vòng thiên văn và viền nhấp nháy lúc thắng (`victoryPulse`) chỉ chạy khi ngón tay di chuyển.
2. **Không có vị trí hiển thị riêng cho mảnh.** Renderer vẽ thẳng từ trạng thái logic nên không có gì để nội suy.
3. **Vẽ lại tốn kém.** Mỗi `pointermove` xoá và vẽ lại Graphics của mọi mảnh: 6 vòng hào quang và các mặt vát bằng `fillPoints`.
4. **Tính toán thừa khi kéo.** Mặt nạ XOR 20.480 ô được tính hai lần mỗi lần kéo: `updateDrag` tính `previewMask` (renderer không dùng) và `getSnapshot` tính `committedMask`.
5. **Các token bị bỏ quên.** `ANIM_TOKENS` có sẵn `dragLiftMs`, `snapMs` và `overlapInversionMs`, nhưng chưa chỗ nào dùng.

Quyết định đã chốt với người review:

| Quyết định | Giá trị |
|---|---|
| Cách vẽ mảnh | Vẽ mỗi mảnh một lần thành texture, hiển thị bằng `Image`. Chỉ vùng giao chẵn/lẻ còn dùng Graphics |
| Cường độ | Tinh tế: thao tác 80–260 ms, nhấn mạnh vùng giao XOR. Phần thưởng lớn dồn vào chuỗi thắng khoảng 2800 ms |
| Rung | Có, dùng `@capacitor/haptics`. Nối nút "Rung phản hồi" đang để trống |

**Ngoài phạm vi:** âm thanh, đổi luật hay bố cục, chuyển cảnh giữa các scene (F1), hiệu ứng ở Menu và Bản đồ.

## 2. Kiến trúc

```
Pointer ─► PlayController ─► Transition ─► feedbackEvents() ─► FeedbackDirector
                │                                                 │   ├─ tween / hạt / camera
                ▼                                                 │   └─ HapticsPort
         PlayViewSnapshot ─► pieceTargets() ─► PieceView[] ◄── update(dt) mỗi khung hình
                                                   │
                                     BoardRenderer: Image mảnh + Graphics vùng giao
```

### 2.1 Vòng render theo khung hình

- Sự kiện pointer chỉ cập nhật controller và đánh dấu `dirty`.
- `PlayScene.update(time, delta)` gọi `boardRenderer.tick(delta, snapshot)` ở mọi khung hình:
  - Cập nhật `PieceView`.
  - Xoay vòng thiên văn theo `delta` thật (đứng yên khi `motionScale = 0`).
  - Chạy nhịp viền lúc thắng.
- Lớp vùng giao chỉ vẽ lại khi tập mảnh đã snap thay đổi.
- Lớp mảnh đang kéo không còn là Graphics nên không cần vẽ lại.
- Tham số `delta = 16` mặc định của `render()` bị bỏ.

### 2.2 Mảnh dạng texture (`PieceTextureCache`, mới)

- Khi vào màn, vẽ mỗi mảnh bằng `drawJewelPolygon` hiện có vào texture `piece:<levelId>:<pieceId>:<turns>`, kèm biến thể `solid` và `ghost`.
  - Kích thước texture là khung mảnh trên bàn (`frameSize × cellPixel`) cộng lề 22% cho hào quang.
  - Màn có `rotationEnabled` thì vẽ đủ 4 hướng. Màn không xoay chỉ vẽ `turns` ban đầu.
  - Ánh sáng mặt vát luôn từ trên-trái, nên mỗi hướng cần texture riêng chứ không xoay ảnh.
- Bóng đổ là một `Image` thứ hai dùng cùng texture, `setTintFill(0x000000)` với alpha 0.45.
- Mảnh trong khay dùng cùng texture, thu nhỏ bằng `scale = trayPieceRadiusPx / pieceRadiusPx`. Nhờ vậy di chuyển khay ↔ bàn chỉ là tween vị trí và scale.
- Texture bị huỷ khi rời scene. Đưa các key vào danh sách và gỡ chúng trong `shutdown`.
- Bóng mục tiêu và ô chờ trong khay (`target`, `placeholder`) giữ Graphics. Chúng tĩnh và chỉ vẽ lại khi `dirty`.

### 2.3 Tư thế hiển thị (`pieceMotion.ts`, mới, logic thuần)

```ts
type Pose = { x: number; y: number; scale: number; angle: number; alpha: number };

function pieceTargetPose(piece, state, ctx): Pose;   // tray / temporary / snapped / dragging
function stepPose(current: Pose, target: Pose, dtMs: number, tauMs: number): Pose;
function magnetPose(pointer: Pose, anchor: Pose, strength: number): Pose;
```

- `stepPose` làm mượt theo hàm mũ: `k = 1 − exp(−dt/τ)`. Kết quả không phụ thuộc FPS.
- `PieceView` giữ `Pose` hiện tại của từng mảnh. Mỗi khung hình nó tiến về `pieceTargetPose` với τ tuỳ trạng thái (mục 3), trừ khi đang có tween một lần (nảy, lắc) chồng lên.
- Khi `motionScale = 0`, `stepPose` trả thẳng `target`.

### 2.4 Sự kiện phản hồi (`feedbackEvents.ts`, mới, logic thuần)

```ts
type FeedbackEvent =
  | { type: 'lift'; pieceId: string }
  | { type: 'snap'; pieceId: string; anchorId: string }
  | { type: 'settle-temporary'; pieceId: string }
  | { type: 'return'; pieceId: string }
  | { type: 'rotate'; pieceId: string; turns: Turns }
  | { type: 'rotate-blocked'; pieceId: string }
  | { type: 'overlap-hollow'; layers: Polygon[] }   // vùng chẵn mới xuất hiện
  | { type: 'overlap-revive'; layers: Polygon[] }   // vùng lẻ ≥ 3 lớp mới xuất hiện
  | { type: 'reset' }
  | { type: 'won' };

function feedbackEvents(prev: PuzzleState, transition: Transition, level: Level): FeedbackEvent[];
```

- Hàm này suy sự kiện từ trạng thái trước, `Transition.outcome` và `accepted`:
  - `rotate` bị từ chối với `out-of-bounds` sinh ra `rotate-blocked`.
  - `overlap-*` lấy từ phần chênh giữa `parityLayers` trước và sau.
- `lift` phát từ `onPointerDown` khi trúng mảnh.
- `PlayScene` không tự suy diễn gì thêm, chỉ chuyển sự kiện cho `FeedbackDirector`.

### 2.5 `FeedbackDirector` (mới, `src/presentation/feedback/`)

- Nhận `FeedbackEvent[]` và chạy hiệu ứng ở mục 3.
- Chuỗi thắng dùng `TransitionTimeline` của F1 nên có sẵn `complete()` để chạm bỏ qua.
- Mọi thời lượng đi qua `scaleTiming` của F1.

### 2.6 Rung (`HapticsPort`, mới, `src/infrastructure/haptics.ts`)

```ts
interface HapticsPort {
  impact(style: 'light' | 'medium' | 'heavy'): void;
  notify(kind: 'success' | 'warning'): void;
}
```

- Bản chạy thật dùng `@capacitor/haptics`. Trên web, hoặc khi plugin không có, mọi lời gọi không làm gì, lỗi bị nuốt.
- Lời gọi bị bỏ qua khi `settings.haptics = false`.
- `Progress.settings` thêm `haptics: boolean`, mặc định `true`. Bản lưu cũ thiếu trường này đọc là `true`, không tăng `version`.
- `SettingsDialog`: nút "Rung phản hồi khi snap" đổi nhãn thành "Rung phản hồi" và lưu vào repository.
  - Nút hiện khi `Capacitor.isNativePlatform()` hoặc `'vibrate' in navigator`.
  - Bỏ điều kiện chỉ dựa vào `navigator.vibrate`, vì Android WebView không đáng tin ở điểm này.

### 2.7 Giảm tải khi kéo

- `PlayController` cache `committedMask`: tính lại khi `puzzleState` đổi, không tính trong `getSnapshot`.
- `updateDrag` chỉ tính lại `previewMask` khi `previewPlacement` đổi (x, y, turns). Thêm cờ tuỳ chọn `computePreviewMask` (mặc định `true` để giữ test cũ). Controller tắt cờ này vì renderer không dùng.
- Mục tiêu: một `pointermove` không gọi `evaluate` lần nào nếu mảnh chưa đổi ô.

## 3. Hành vi từng tương tác

τ là hằng số làm mượt của `stepPose`. Mọi giá trị nằm trong `FEEDBACK_TOKENS` ở `designTokens.ts`, cạnh `ANIM_TOKENS`.

| Sự kiện | Hình ảnh | Rung |
|---|---|---|
| `lift` | Scale 1 → 1.08 trong `dragLiftMs` 80 ms, `Back.easeOut`. Bóng đổ lệch (4, 6) → (8, 12), alpha 0.2 → 0.45. Từ khay: scale khay → 1.08 trong 140 ms | `impact('light')` |
| Đang kéo | Mảnh bám pointer với τ 35 ms. Nghiêng theo vận tốc ngang `angle = clamp(vx × 0.02, −4°, 4°)`, τ 120 ms. Hết kéo thì angle về 0 | — |
| Vào vùng hít | Mảnh bị hút: `magnetPose` dịch thêm 30% quãng còn lại tới tâm neo. Bóng mục tiêu của neo đó alpha 0.7 → 1 trong 120 ms. Nhãn "Thả để khớp" scale 0.9 → 1, alpha 0 → 1 trong 120 ms và bám mảnh với τ 60 ms | — |
| Xem trước vùng giao | Khi có neo ứng viên: vẽ trước kết quả chẵn/lẻ với các mảnh đã snap bằng nét ice mảnh, alpha 0.5. Chỉ tính lại khi neo ứng viên đổi | — |
| `snap` | Trượt vào neo trong `snapMs` 120 ms, `Cubic.easeOut`. Nảy scale 1.08 → 0.98 → 1 trong 180 ms. Một vòng ice từ tâm mảnh, bán kính 0 → 1.2 × bán kính mảnh, alpha 0.6 → 0 trong 240 ms. Biểu tượng tương ứng trên thanh đếm bật scale 1.3 → 1 | `impact('medium')` |
| `settle-temporary` | Hạ về vị trí tạm với τ 60 ms, scale 1.08 → 1, alpha → 0.6. Không có vòng sáng | `impact('light')` |
| `return` | Bay về ô khay trong 220 ms, `Cubic.easeOut`, scale → scale khay | — |
| `rotate` | Xoay tween góc từ −90° về 0 trong 160 ms, `Back.easeOut`. Texture của hướng mới được gán ngay từ đầu tween | `impact('light')` |
| `rotate-blocked` | Lắc ngang ±6 px, 3 nhịp trong 180 ms. Viền nháy ice-white alpha 0 → 0.8 → 0 (đúng GDD: "rung/nháy viền nhẹ") | `notify('warning')` |
| `overlap-hollow` | Vùng chẵn mới: màu mặt bia alpha 0 → 1 trong `overlapInversionMs` 150 ms. Đồng thời viền ice chạy dọc mép vùng: dash offset 0 → chu vi, nét 3 → 1, alpha 1 → 0 trong 320 ms | — |
| `overlap-revive` | Vùng lẻ ≥ 3 lớp mới: amber alpha 0 → 1 trong 150 ms, cộng một chớp sáng nhỏ ở tâm vùng (4 tia, 200 ms) | — |
| `reset` | Mọi mảnh trên bia bay về khay, so le 40 ms, mỗi mảnh 260 ms. Vùng giao mờ đi trong 120 ms | `impact('light')` |
| `won` | Chuỗi thắng, mục 4 | Mục 4 |

Quy tắc phụ:

- Mảnh đang kéo luôn ở lớp trên cùng (giữ quy tắc thứ tự lớp hiện có). Thứ tự lớp cố định, không đổi theo tween.
- Nút Xoay đổi trạng thái bật/tắt bằng alpha 0.3 ↔ 1 trong 150 ms, không đổi tức thời.
- Input không bị khoá trong các hiệu ứng thao tác. Nhấc một mảnh đang tween thì tween bị huỷ và mảnh tiếp tục từ `Pose` hiện tại, không bị giật.

## 4. Chuỗi thắng — 2800 ms

Chạy trên một `TransitionTimeline`. Mốc 0 là lúc mảnh cuối bắt đầu snap.

| Mốc | Hành động |
|---|---|
| 0–200 | Snap bình thường của mảnh cuối (mục 3) |
| 200–600 | Nghỉ một nhịp. Bầu trời tối thêm 12% trong 400 ms (`BackgroundScene` của F1) |
| 400–1200 | Các mảnh sáng lần lượt theo thứ tự `targetPlacements`, cách 120 ms. Mỗi mảnh có một lớp phủ sáng additive, alpha 0 → 0.7 → 0 trong 350 ms |
| 900–1500 | Một vệt sáng amber chạy quanh viền từng placement của nghiệm mẫu, alpha 1 → 0 |
| 1300 | Camera flash dịu 350 ms (`249, 199, 79`). Hai vòng cộng hưởng từ trọng tâm (amber 160 px, ice 180 px trễ 200 ms), mỗi vòng 800 ms. Tối đa 30 hạt bụi sao bung ra trong 1100 ms; alpha mỗi hạt cố định khi sinh rồi mờ dần, không random mỗi khung hình. `notify('success')` |
| 1400–2000 | Khung bia chuyển từ kính sang vàng trong 600 ms. Khay và các ô chứa mờ đi trong 400 ms |
| 2000–2800 | Thẻ thắng trượt lên y +60 → 0, alpha 0 → 1. Nhãn, tên màn, câu thơ và hai nút hiện so le 100 ms |
| Sau 2800 | Viền bia nhấp nháy nhẹ (`victoryPulse`) mỗi khung hình theo `delta` thật. Vòng thiên văn quay nhanh gấp 3 như hiện tại |

- Chạm bất kỳ trong lúc chạy chuỗi: `complete()` đưa về trạng thái cuối (khung vàng, thẻ hiện, không còn hạt).
- "Đặt lại" từ thẻ thắng chạy ngược phần thẻ và khung trong 300 ms, rồi tới `reset`.
- Bỏ ánh chớp `cameras.main.flash(350, …)` hiện tại ở mốc 0: ánh sáng dời về mốc 1300, sau nhịp nghỉ.

## 5. Giảm chuyển động

Khi `motionScale = 0` (cài đặt của F1):

- Vị trí, scale và góc đổi tức thời (`stepPose` trả thẳng `target`). Không nảy, không lắc, không nghiêng.
- Các thay đổi màu và alpha giữ lại nhưng tối đa 150 ms: vùng giao, khung vàng, thẻ thắng.
- Không có hạt, vòng sáng, vệt sáng chạy, camera flash hay chớp sáng. Vòng thiên văn đứng yên.
- `rotate-blocked` chỉ còn nháy viền, không lắc.
- Rung không phụ thuộc `motionScale`, chỉ phụ thuộc `settings.haptics`.

## 6. File thay đổi

| File | Thay đổi |
|---|---|
| `src/presentation/PieceTextureCache.ts` | Mới |
| `src/presentation/pieceMotion.ts` | Mới, logic thuần |
| `src/presentation/PieceView.ts` | Mới: `Image` mảnh + bóng + lớp sáng, giữ `Pose` |
| `src/presentation/feedback/feedbackEvents.ts` | Mới, logic thuần |
| `src/presentation/feedback/FeedbackDirector.ts` | Mới |
| `src/presentation/feedback/victorySequence.ts` | Mới: timeline mục 4 |
| `src/infrastructure/haptics.ts` | Mới |
| `src/presentation/BoardRenderer.ts` | Bỏ Graphics mảnh, dùng `PieceView`. Thêm `tick()`. Vùng giao vẽ khi `dirty`. Khung vàng chuyển bằng alpha chéo |
| `src/presentation/PlayScene.ts` | `update` gọi `tick`. Pointer chỉ đánh dấu `dirty`. Chuyển sự kiện cho `FeedbackDirector`. Bỏ `playCelebration` cũ |
| `src/presentation/Hud.ts` | Thanh đếm bật biểu tượng, nhãn hít có tween, nút Xoay đổi alpha bằng tween, thẻ thắng dàn dựng |
| `src/application/playController.ts` | Cache `committedMask`, phát `lift`, trả `prev` state cho `feedbackEvents` |
| `src/application/drag.ts` | Cờ `computePreviewMask`, tính lại có điều kiện |
| `src/presentation/designTokens.ts` | Thêm `FEEDBACK_TOKENS`, `VICTORY_TOKENS` |
| `src/presentation/SettingsDialog.ts`, `src/infrastructure/progressRepository.ts` | `settings.haptics` |
| `package.json` | Thêm `@capacitor/haptics` cùng dòng 8.x với `@capacitor/core` |

Sau F2, tuyến `menu-to-play` của F1 (mốc 950–1350) cho từng mảnh rơi vào khay riêng qua `PieceView`, thay cho việc tween cả lớp khay như một khối (rủi ro đã ghi ở F1 mục 6).

## 7. Kiểm thử

### 7.1 Tự động (vitest)

- `pieceMotion.test.ts`:
  - `pieceTargetPose` cho bốn trạng thái, với toạ độ khay và neo khớp `layout.ts`.
  - `stepPose` hội tụ về target, và chạy 2 bước 8 ms cho cùng kết quả với 1 bước 16 ms (sai số < 0.5 px).
  - `motionScale = 0` trả thẳng target.
  - `magnetPose` ở các mức strength 0 / 0.3 / 1.
- `feedbackEvents.test.ts`:
  - Mỗi `Outcome` sinh đúng sự kiện.
  - Rotate bị từ chối sinh `rotate-blocked`.
  - Snap tạo giao 2 lớp sinh `overlap-hollow`; giao 3 lớp sinh `overlap-revive`.
  - Snap mảnh cuối sinh `snap` rồi `won`.
- `victorySequence.test.ts`: tổng 2800 ms, các mốc khớp token, số hạt ≤ 30, `complete()` để lại khung vàng và thẻ hiện.
- `haptics.test.ts`: với plugin giả, ánh xạ sự kiện → lời gọi theo bảng mục 3. `haptics = false` thì không gọi. Plugin ném lỗi thì nuốt lỗi.
- `playController`: `getSnapshot()` không gọi `evaluate`, kiểm bằng spy. Kéo trong cùng một ô không tính lại mask.
- `boardRendererLayers.test.ts`: cập nhật theo thứ tự lớp mới (mảnh `Image` dưới lớp vùng giao, mảnh đang kéo trên cùng).
- `progressRepository`: bản lưu thiếu `haptics` đọc ra `true`.

### 7.2 Nghiệm thu thủ công (harness, theo miễn trừ chụp Chrome của người dùng)

- Chơi 1-1 đến 1-6 trên trình duyệt và một máy Android tầm trung. Từng hiệu ứng ở mục 3 và chuỗi thắng ở mục 4 đều nhìn thấy được.
- Kéo nhanh qua lại: mảnh không giật hay trễ, nghiêng nhẹ theo hướng kéo.
- Vòng thiên văn quay liên tục khi không chạm. Viền bia nhấp nháy sau khi thắng.
- Bật Giảm chuyển động: đúng mục 5.
- Tắt Rung: không rung. Bật Rung trên Android: rung đúng bảng.
- FPS ≥ 55 khi kéo và suốt chuỗi thắng (`?fps=1` của F1).

## 8. Rủi ro

- **Bộ nhớ texture:** màn 6 mảnh có xoay là 6 × 4 hướng × 2 biến thể = 48 texture. Mảnh lớn nhất khoảng 64 ô × 5 px × 1.44 ≈ 460 px vuông, tức khoảng 0.85 MB mỗi texture RGBA, tổng chừng 40 MB. Quá nặng cho máy yếu. Giảm nhẹ:
  - Vẽ biến thể `ghost` khi cần lần đầu, không vẽ trước.
  - Chỉ vẽ hướng khi xoay tới lần đầu.
  - Nếu vẫn quá ngưỡng thì vẽ ở 0.75 độ phân giải.
  - Plan phải đo kích thước thật của từng màn trước khi chốt.
- **`setTintFill` trên Canvas renderer** không hỗ trợ. Bóng đổ và lớp sáng cần texture riêng (đen và trắng), vẽ cùng lúc. Chọn nhánh theo `renderer.type`.
- **Xem trước vùng giao khi kéo** dùng `parityLayers` trên tối đa 6 đa giác. Chỉ tính lại khi neo ứng viên đổi, nên chi phí mỗi khung gần 0. Nếu đo thấy tốn thì bỏ tính năng này, không ảnh hưởng phần còn lại.

## 9. Điều chỉnh khi viết plan (2026-10-03)

Phát hiện khi đối chiếu với code thật; plan F2 (`2026-10-03-f2-1-logic.md`, `f2-2-renderer.md`, `f2-3-phan-hoi.md`) đã theo các điểm này và thay cho các chỗ tương ứng ở mục 2, 4 và 8.

1. **Bộ nhớ đo thật:** mọi mảnh 1-1 → 1-6 có `frameSize` 48 và không màn nào cho xoay; mỗi (mảnh × hướng) tốn 0,742 MiB, màn nặng nhất 2,22 MiB. Ước tính 40 MB ở mục 8 là cho trường hợp giả định khung 64 với 6 mảnh xoay đủ (31,6 MiB, tự hạ độ phân giải 0,75 còn 17,8 MiB, dưới ngưỡng 24 MB của F3).
2. Không cần texture `ghost` riêng: `ghost` chỉ khác `solid` ở alpha 0.75.
3. Bóng đổ và lớp chớp sáng là texture đen/trắng vẽ ở nửa độ phân giải cho cả WebGL lẫn Canvas, nên không dùng `setTintFill` và không rẽ nhánh theo `renderer.type`.
4. Lề texture là 25% mỗi phía (không phải 22%): hào quang phóng 1,22 lần quanh trọng tâm tràn khoảng 0,165 cạnh khung với tam giác vuông.
5. Texture không vẽ trong `create()`: `update()` vẽ một mảnh mỗi khung, xong trước mốc 950 ms khi mảnh rơi vào khay (giữ ngưỡng P-04 của F3).
6. `feedbackEvents` nhận thêm `subject: { command: 'move' | 'rotate' | 'reset'; pieceId: string | null }`, vì lệnh xoay bị từ chối không mang id mảnh.
7. Vòng cộng hưởng ban đầu rút còn 600 ms để khớp thiết kế 1800 ms; sau nghiệm thu, người duyệt chủ đích kéo toàn chuỗi lên 2800 ms với vòng 800 ms và các mốc ở mục 4.
8. Vệt sáng lúc thắng chạy quanh từng placement của nghiệm mẫu (chưa có phép hợp đa giác); ở Chương 1 kết quả như nhau.
9. Bóng đổ alpha 0 khi không nhấc (thay vì 0.2), để không làm tối mép vùng giao.
10. `@capacitor/haptics` chọn bản 8.0.2 (peer `@capacitor/core >=8.0.0`).

# F1 — Nền tảng chuyển động và chuyển cảnh điện ảnh

Ngày: 2026-10-03 · Phạm vi: `game-next` · Phụ thuộc: không. Không đổi domain, content hay luật chẵn/lẻ.

Loạt spec chuyển động: **F1** (spec này) nền tảng + chuyển cảnh → **F2** cảm giác trong màn chơi (nhấc, hút, xoay, vùng giao XOR, chuỗi thắng, mảnh dạng texture).

## 1. Mục tiêu

Hiện mọi lần đổi màn hình là cắt cứng: 13 lời gọi `scene.start` huỷ cảnh cũ và dựng xong cảnh mới trong một khung hình. Mỗi scene tự dựng `SkyBackdrop` với seed khác (Menu `1`, Bản đồ `3`, Play `2`), nên sao nền nhảy chỗ mỗi lần chuyển.

Spec này làm cho việc đi giữa Menu, Bản đồ và Play diễn ra **từ từ**: cảnh cũ rút đi, cảnh mới được dựng lên từng lớp trên một bầu trời chạy liên tục.

Quyết định đã chốt với người review:

| Quyết định | Giá trị |
|---|---|
| Thứ tự spec | F1 chuyển cảnh trước, F2 cảm giác trong màn sau |
| Nhịp | Điện ảnh: 1500 ms vào màn chơi, khoảng 1000 ms các tuyến khác |
| Lặp lại | Luôn chạy đầy đủ, chạm bất kỳ để bỏ qua phần còn lại |
| Cách làm | Nền chạy liên tục + dàn dựng vào/ra. Shader chỉ là lớp trang trí tuỳ chọn |

**Ngoài phạm vi:** hiệu ứng trong màn chơi (F2), âm thanh, rung, đổi bố cục màn hình.

## 2. Kiến trúc

### 2.1 `BackgroundScene` (mới)

- Scene đầu tiên trong danh sách scene của `main.ts`. Chạy suốt vòng đời game và luôn nằm dưới cùng.
- Sở hữu **một** `SkyBackdrop` (seed cố định `1`). Menu, Bản đồ và Play bỏ sky riêng, không đặt nền.
- API `setMood(mood: 'menu' | 'map' | 'play', durationMs)`: tween dần tốc độ sao trôi (`menu` 0, `map` như hiện tại, `play` 0) và độ sáng tinh vân (`play` tối hơn 15% để bia nổi lên). Không đổi giá trị đột ngột.
- `SkyBackdrop` nhận thêm hệ số trôi `driftSpeed` (0..1) thay cho cờ `drift` boolean, để tween được.

### 2.2 `SceneDirector` (mới, `src/presentation/transitions/SceneDirector.ts`)

Lối duy nhất để đổi scene. Sau F1, ngoài `SceneDirector` và `main.ts` không còn chỗ nào gọi `scene.start`.

```ts
type SceneKey = 'MenuScene' | 'LevelSelectScene' | 'PlayScene';
type TransitionContext = {
  from: SceneKey | 'boot';
  route: RouteId;          // xem mục 3
  origin?: { x: number; y: number }; // nút/node vừa bấm
};

director.go(fromScene, to: SceneKey, data, ctx: Omit<TransitionContext, 'from'>): boolean;
director.skip(): void;
director.isTransitioning(): boolean;
```

Trình tự của `go`:

1. Nếu đang chuyển thì trả `false`, không làm gì (chống bấm hai lần).
2. Khoá input cả hai scene (`input.enabled = false`). Bật một vùng chạm phủ toàn màn trên cùng để bắt "chạm để bỏ qua".
3. Gọi `from.playOut(timeline, ctx)`.
4. Khi phần ra đến mốc `handoffMs` của tuyến, gọi `scene.run(to, data)` để hai cảnh gối nhau, không có khung hình trống. Riêng tuyến `next-level` cùng là `PlayScene`: đợi phần ra xong rồi `scene.restart`.
5. Scene đích gọi `playIn(timeline, ctx)` trong `create()`, đọc `ctx` từ director.
6. Khi cả hai timeline xong: dừng scene nguồn, mở input, huỷ vùng chạm bỏ qua.

`skip()` gọi `complete()` cho các timeline đang chạy. Mọi phần tử nhảy tới trạng thái cuối trong cùng khung hình, rồi đi tiếp bước 4–6 ngay.

### 2.3 Giao diện `Choreographed`

```ts
interface Choreographed {
  playIn(tl: TransitionTimeline, ctx: TransitionContext): void;
  playOut(tl: TransitionTimeline, ctx: TransitionContext): void;
}
```

`TransitionTimeline` là lớp bọc mỏng quanh tween của Phaser:

- `at(ms, target, props, durationMs, ease)`: lên lịch một tween.
- `call(ms, fn)`: lên lịch một lời gọi hàm.
- `complete()`: đưa mọi tween về giá trị cuối và gọi các `call` chưa chạy, theo đúng thứ tự thời gian.
- `onDone(fn)`: đăng ký hàm chạy khi xong.

Mọi mốc thời gian đi qua `motion.ts`, nên Giảm chuyển động áp dụng ở một chỗ duy nhất.

### 2.4 `motion.ts` (mới, logic thuần)

- `TRANSITION_TOKENS` trong `designTokens.ts`: tổng thời lượng, `handoffMs` và các mốc của từng tuyến ở mục 3.
- `scaleTiming(ms, motionScale)`: `motionScale = 1` giữ nguyên. `motionScale = 0` thì mọi tuyến thay bằng một lần mờ chéo 150 ms.
- `stagger(index, count, spanMs)`: độ trễ so le, phân bố đều trong `spanMs`.

### 2.5 Cài đặt Giảm chuyển động

- `Progress.settings` thêm `reducedMotion: boolean`, mặc định `false`. Bản lưu cũ thiếu trường này được đọc là `false`, không tăng `version`.
- Nút "Giảm chuyển động xoay" trong `SettingsDialog` (hiện chưa nối) đổi nhãn thành "Giảm chuyển động", lưu vào repository và cập nhật `motionScale` ngay.
- Khi bật: các vòng thiên văn ở Menu và Play đứng yên.

### 2.6 Vòng đời và lỗi

- Nút Back Android trong lúc chuyển thì gọi `skip()`, không mở dialog hay đổi scene.
- App xuống nền (`onBackground`) trong lúc chuyển thì gọi `skip()` trước `game.loop.sleep()`.
- `PlayScene.init` không tải được màn thì về Menu qua director, tuyến `play-to-menu`.
- Khởi động thẳng vào harness (`main.ts`) dùng `from: 'boot'`: chỉ chạy phần vào, không có phần ra.

## 3. Dàn dựng từng tuyến

Toạ độ canvas 720×1280. Ấn Song Tinh ở Menu có tâm (360, 500) và rộng 280 px. Tấm bia có tâm (360, 600) và kích thước 640×800. Khay ở y 1016. Mốc thời gian tính bằng ms từ lúc bắt đầu tuyến.

### 3.1 `menu-to-play` — 1500 ms, handoff 200

| Mốc | Cảnh | Hành động |
|---|---|---|
| 0–350 | Menu ra | Nút "Chơi" loé vàng, co về 0.9. Logo, nút phụ, footer: alpha → 0, y −24, so le 60 ms |
| 200–700 | Menu ra / Play vào | Vòng ấn Song Tinh quay nhanh gấp 4, tâm dịch (360, 500) → (360, 600), scale ×2.2, alpha → 0. Từ 350: khung kính bia scale 0.85 → 1, alpha 0 → 1, `Back.easeOut`. Camera Play zoom 1 → 1.03 → 1 |
| 450–900 | Play vào | Mặt bia alpha 0 → 1. Lưới lộ theo vòng tròn loang từ tâm bia (geometry mask, bán kính 0 → 520). Rune phương vị sáng lần lượt B, Đ, N, T, cách 60 ms |
| 800–1150 | Play vào | Bóng mục tiêu: từng placement alpha 0 → 0.7, cách 80 ms, kèm một vệt sáng lướt chéo qua bia |
| 950–1350 | Play vào | Khung khay y +40 → 0, alpha 0 → 1. Mảnh rơi vào ô: y −60 → 0, scale 0.6 → 1, `Back.easeOut`, cách 90 ms |
| 1100–1500 | Play vào | Tiêu đề màn y −40 → 0. Nút Đặt lại/Xoay và thanh đếm y +40 → 0. Tất cả alpha 0 → 1 |

Bầu trời: `setMood('play', 1000)` ở mốc 0.

### 3.2 `map-to-play` — 1500 ms, handoff 300

- **0–450 (Bản đồ ra):** node vừa bấm (`ctx.origin`) scale 1 → 1.4 rồi phát một vòng sáng. Vòng sáng lan từ bán kính 40 đến bao trọn tấm bia. Các node, đường nối và header khác mờ dần, so le theo khoảng cách tới node bấm.
- **350–1500 (Play vào):** giống mốc 350–1500 của 3.1, nhưng khung bia mọc từ tâm vòng sáng thay vì từ ấn Song Tinh.

### 3.3 `next-level` — 1500 ms, handoff 800 (= hết phần ra)

- **0–800 (Play cũ ra):**
  - 0–300: thẻ thắng y +60, alpha → 0.
  - 100–700: các mảnh trên bia tan thành tối đa 30 hạt bụi sao (giới hạn trong GDD), bay vào tâm bia. Bóng mục tiêu mờ.
  - 300–760: tiêu đề màn và nút góc trên rút đi.
  - 500–800: khung bia **giữ nguyên** và lật sáng một nhịp (viền vàng sáng nhất rồi về kính xanh).
- **800 (restart):** `PlayScene` dựng lại. Khung bia, mặt bia và lưới hiện ngay ở trạng thái cuối, không chạy lại.
- **800–1500 (Play mới vào):** chạy đúng mốc 800–1500 của 3.1 (bóng mục tiêu, khay và mảnh, HUD).

_Sửa ngày 2026-10-03 khi viết plan: bản đầu ghi "dời sớm 300 ms", khiến tuyến chỉ dài 1200 ms, mâu thuẫn với tổng 1500 ms. Phần ra được kéo tới 800 ms thay vì dời phần vào._

### 3.4 `play-to-map` và `play-to-menu` — 1000 ms, handoff 400

- **0–450 (Play ra):** chạy ngược phần vào. HUD rút đi (y ±40, alpha → 0). Khay hạ y +40. Mảnh alpha → 0. Từ 200: bia scale 1 → 0.9, alpha → 0.
- **400–1000 (Bản đồ vào):** header y −40 → 0. Node bật ra (scale 0 → 1, `Back.easeOut`) lần lượt dọc đường nối, tính từ node hiện tại ra hai phía. Đường nối vẽ dần theo đó. Tự cuộn tới node hiện tại giữ như cũ.
- **400–1000 (Menu vào):** ấn Song Tinh scale 0.6 → 1, alpha 0 → 1. Logo y −24 → 0. Hai nút y +24 → 0, so le 80 ms.

### 3.5 `menu-to-map` và `map-to-menu` — 1000 ms, handoff 300

- **Menu → Bản đồ:** ấn Song Tinh bay lên (tâm y 500 → 120) và thu về 0.3, tan vào vị trí header bản đồ. Nút và logo mờ đi, so le. Bản đồ vào như 3.4. `setMood('map', 1000)`: sao trôi tăng dần.
- **Bản đồ → Menu:** chạy ngược, ấn Song Tinh từ header hạ về tâm. `setMood('menu', 1000)`.

### 3.6 Quy tắc chung

- Mọi tuyến luôn chạy đầy đủ. Chạm bất kỳ (kể cả nút Back) thì nhảy ngay tới trạng thái cuối.
- Input của cảnh đích chỉ mở khi tuyến kết thúc hoặc bị bỏ qua.
- Trạng thái cuối của mọi phần tử phải trùng với trạng thái khi dựng cảnh không có animation (vị trí, alpha, scale, visible).
- Bật Giảm chuyển động (`motionScale = 0`) thì mọi tuyến thay bằng một lần mờ chéo 150 ms, bầu trời đổi mood tức thời.
- Lớp trang trí WebGL tuỳ chọn: `postFX.addGlow` trên vòng sáng node (3.2) và vệt sáng lướt (3.1). Chỉ thêm khi `renderer.type === Phaser.WEBGL`. Canvas bỏ qua mà không ảnh hưởng phần còn lại.

## 4. File thay đổi

| File | Thay đổi |
|---|---|
| `src/presentation/BackgroundScene.ts` | Mới |
| `src/presentation/transitions/SceneDirector.ts` | Mới |
| `src/presentation/transitions/TransitionTimeline.ts` | Mới |
| `src/presentation/transitions/motion.ts` | Mới, logic thuần |
| `src/presentation/transitions/routes/*.ts` | Mới: dàn dựng vào/ra cho từng scene |
| `src/presentation/designTokens.ts` | Thêm `TRANSITION_TOKENS` |
| `src/presentation/SkyBackdrop.ts` | `drift` boolean → `driftSpeed` 0..1, thêm độ sáng tinh vân |
| `src/presentation/{Menu,LevelSelect,Play}Scene.ts` | Bỏ sky riêng, cài `Choreographed`, thay `scene.start` bằng director |
| `src/presentation/Hud.ts`, `BoardRenderer.ts`, `TargetBadge.ts` | Mở các đối tượng cần animate qua getter. Không đổi cách vẽ (để F2) |
| `src/presentation/SettingsDialog.ts` | Nối nút Giảm chuyển động |
| `src/infrastructure/progressRepository.ts` | `settings.reducedMotion` |
| `src/main.ts` | Đăng ký `BackgroundScene`, khởi động harness qua director, `skip()` khi Back/xuống nền |

## 5. Kiểm thử

### 5.1 Tự động (vitest)

- `motion.test.ts`:
  - `stagger` phân bố đều và không vượt `spanMs`.
  - `scaleTiming` với `motionScale` 0 và 1.
  - Tổng thời lượng mỗi tuyến bằng token (1500/1000 ms) và mọi mốc nằm trong tổng.
- `sceneDirector.test.ts` (scene giả, không cần Phaser):
  - Gọi `go` lần hai khi đang chuyển thì trả `false`.
  - Input khoá trong lúc chuyển.
  - `skip()` đưa về trạng thái cuối và mở input.
  - Back và xuống nền đều gọi `skip()`.
  - Tuyến `next-level` restart sau khi phần ra xong.
- `transitionTimeline.test.ts`: `complete()` chạy các `call` còn lại đúng thứ tự và đúng một lần.
- **Bất biến trạng thái cuối:** mỗi tuyến xuất danh sách `endPose` (id phần tử → x, y, alpha, scale, visible). Test so `endPose` với pose khi dựng không animation.
- `progressRepository`: bản lưu thiếu `reducedMotion` đọc ra `false`. Ghi rồi đọc lại giữ đúng giá trị.
- Test nguồn: `scene.start(` chỉ xuất hiện trong `SceneDirector.ts` và `main.ts`.

### 5.2 Nghiệm thu thủ công (harness, theo miễn trừ chụp Chrome của người dùng)

- Chạy đủ 7 tuyến (3.1–3.5, mỗi chiều) trên trình duyệt và một máy Android tầm trung.
- Không có khung hình trống hay chớp đen. Sao nền không nhảy chỗ giữa các cảnh.
- Chạm để bỏ qua có tác dụng ở mọi thời điểm. Sau khi bỏ qua, cảnh trông giống hệt khi chạy hết.
- Bật Giảm chuyển động thì chỉ còn mờ chéo 150 ms.
- FPS ≥ 55 suốt lúc chuyển cảnh, đo bằng `game.loop.actualFps`. Thêm tham số dev `?fps=1` hiện số FPS ở góc màn (chỉ khi `import.meta.env.DEV`).

## 6. Rủi ro

- **Geometry mask trên Canvas renderer** tốn hơn WebGL. Nếu FPS dưới 55 trên máy thử, lưới đổi sang mờ dần alpha thay cho vòng loang.
- **`BoardRenderer` vẽ lại toàn bộ Graphics mỗi khung hình** trong lúc tween mảnh rơi vào khay, có thể tốn. F1 tween lớp Graphics của khay như một khối (alpha, y) chứ không vẽ lại từng mảnh. Tween từng mảnh riêng chờ F2 chuyển mảnh sang texture.
- **Tuyến `next-level` restart cùng scene:** khung bia hiện ngay ở trạng thái cuối phải khớp đúng pixel với khung của cảnh cũ. Kiểm bằng bất biến `endPose`.

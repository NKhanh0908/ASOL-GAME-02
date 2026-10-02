# F3 — Nghiệm thu chuyển động: công cụ đo, ma trận kiểm tra và hồ sơ duyệt

Ngày: 2026-10-03 · Phạm vi: `game-next`, `docs/testing/motion/` · Phụ thuộc: **F1** (`2026-10-03-f1-scene-transitions-design.md`) và **F2** (`2026-10-03-f2-in-level-game-feel-design.md`), đều đã được duyệt ngày 2026-10-03.

## 1. Mục tiêu

F1 và F2 chỉ được merge vào `main` khi qua cổng nghiệm thu này. F3 quy định:

1. **Công cụ dev** để xem, chạy lại và đo từng chuyển cảnh và hiệu ứng (mục 2). Các công cụ này chỉ có ở dev và không vào bản build.
2. **Ma trận kiểm tra** có mã số, mỗi mục có tiêu chí đạt và cách kiểm (mục 4).
3. **Ngưỡng hiệu năng** đo được bằng số (mục 3).
4. **Hồ sơ duyệt** theo mẫu `docs/testing/mirror-rebuild/<id>-content-review.md` (mục 5).

Quy ước đã có vẫn giữ: ảnh Chrome được miễn theo yêu cầu người duyệt, và người duyệt kiểm tra trực tiếp qua đường dẫn harness.

**Ngoài phạm vi:** test tự động cho hình ảnh (so pixel), CI chạy trên thiết bị, âm thanh.

## 2. Công cụ dev

Mọi tham số chỉ có hiệu lực khi `import.meta.env.DEV`, được đọc trong `launchParams.ts` cạnh `scene`, `level` và `mode`. Bản build bỏ qua chúng. Một test nguồn kiểm điều này.

| Tham số | Tác dụng |
|---|---|
| `fps=1` | Bảng nhỏ ở góc trên-phải, cập nhật 4 lần/giây. Hiện FPS, thời gian khung p95 trong 2 giây gần nhất, số tween đang chạy và ước tính bộ nhớ texture mảnh (MB) |
| `motion=<số>` | Hệ số tốc độ cho tween và `time` của mọi scene (`tweens.timeScale`, `time.timeScale`). `0.25` là quay chậm 4 lần để soi dàn dựng. `0` tương đương bật Giảm chuyển động, không ghi vào bản lưu |
| `demo=<route>` | Sau khi khởi động, tự chạy một tuyến của F1 (`menu-to-play`, `map-to-play`, `next-level`, `play-to-map`, `play-to-menu`, `menu-to-map`, `map-to-menu`) |
| `loop=1` | Đi cùng `demo`: chạy xong thì quay về cảnh nguồn không animation, nghỉ 600 ms rồi lặp lại |
| `autosolve=<kịch bản>` | Mở rộng `win` và `drag` hiện có: thêm `snap`, `return`, `rotate`, `rotate-blocked`, `overlap-hollow`, `overlap-revive`, `reset`. Mỗi kịch bản là chuỗi pointer giả cách nhau 400 ms, chạy trên màn trong `level`. `rotate` và `rotate-blocked` cần `level=fixture-rotate` |
| `level=fixture-rotate` | Màn fixture chỉ có ở dev (`makeRotationFixture()` trong `content/fixtures.ts`): `rotationEnabled: true`, hai tam giác. Một tam giác có neo sát mép phải bia, nên xoay ở neo đó bị `out-of-bounds`. Lý do: cả 6 màn Chương 1 đều có `rotationEnabled: false`, nên không kiểm được T2-08 và T2-09 trên màn thật. Fixture không vào `campaignManifest` và bị chặn ở build thường (R-04) |
| `perf=1` | Ghi thời gian từng khung trong mỗi cửa sổ hiệu ứng: từ lúc tuyến hoặc sự kiện bắt đầu tới khi tween cuối xong. Hết cửa sổ thì in một dòng JSON ra console và đẩy vào `window.__motionPerf` |

Dòng JSON của `perf=1`:

```json
{ "window": "menu-to-play", "frames": 92, "p50Ms": 16.6, "p95Ms": 17.9, "maxMs": 31.2, "over20Ms": 1, "over50Ms": 0, "durationMs": 1512 }
```

Phần tính toán nằm trong `src/presentation/dev/perfStats.ts` (logic thuần): nhận mảng thời gian khung, trả về các trường trên. Overlay và bộ ghi chỉ gọi module này.

Đường dẫn mẫu (dev server `npm run dev`, cổng 5173):

- Soi chuyển cảnh chậm: `/?demo=menu-to-play&loop=1&motion=0.25`
- Đo chuyển cảnh: `/?demo=menu-to-play&loop=1&perf=1&fps=1`
- Đo chuỗi thắng: `/?scene=play&level=1-6&mode=harness&autosolve=win&perf=1&fps=1`
- Soi vùng giao: `/?scene=play&level=1-1&mode=harness&autosolve=overlap-hollow&motion=0.25`

## 3. Ngưỡng hiệu năng

Mọi số đo trên **thiết bị chuẩn** (mục 6.1), bản debug APK, `perf=1`.

| Mã | Chỉ số | Ngưỡng |
|---|---|---|
| P-01 | p95 thời gian khung trong mỗi tuyến F1 | ≤ 18.2 ms (≈ 55 FPS) |
| P-02 | p95 thời gian khung khi kéo liên tục 5 giây trên màn 1-6 | ≤ 18.2 ms |
| P-03 | p95 thời gian khung trong chuỗi thắng của 1-6 | ≤ 18.2 ms |
| P-04 | Khung dài nhất trong bất kỳ cửa sổ nào | ≤ 50 ms |
| P-05 | Số khung > 20 ms mỗi cửa sổ | ≤ 3 |
| P-06 | Bộ nhớ texture mảnh của màn nặng nhất (1-1 → 1-6) | ≤ 24 MB (ước tính của overlay) |
| P-07 | Kéo trong cùng một ô lưới: số lần gọi `evaluate` | 0 (test tự động của F2) |

Rủi ro đã biết: `PlayScene.create()` vẽ texture mảnh (F2) đúng lúc handoff của F1, nên dễ vượt P-04. Plan F2 phải chọn một trong hai cách và đo lại:

- vẽ texture trong phần "ra" của scene nguồn;
- vẽ rải mỗi khung một mảnh trước mốc 950 ms, là lúc mảnh rơi vào khay.

## 4. Ma trận kiểm tra

Cách kiểm: **A** là test tự động (vitest). **D** là Claude kiểm trên Chrome desktop qua các tham số dev. **T** là người duyệt kiểm trên thiết bị chuẩn.

### 4.1 Chuyển cảnh (F1)

| Mã | Kiểm tra | Tiêu chí đạt | Cách |
|---|---|---|---|
| T1-01 | Đủ 7 tuyến chạy được | Mỗi tuyến tới đúng cảnh đích, đúng dữ liệu (màn, mode, preview trail) | A + D + T |
| T1-02 | Không khung trống, không chớp đen | Quay chậm `motion=0.25`, không có khung nào chỉ thấy bầu trời trơn hay đen | D + T |
| T1-03 | Bầu trời liền mạch | Sao không nhảy chỗ giữa hai cảnh. Tốc độ trôi đổi dần trong khoảng 1 giây | D + T |
| T1-04 | Nhịp đúng spec | Tổng thời lượng mỗi tuyến lệch không quá 50 ms so với token (đọc `durationMs` của `perf=1`) | A + D |
| T1-05 | Chạm để bỏ qua | Chạm ở đầu, giữa và cuối mỗi tuyến đều lên ngay trạng thái cuối. Cảnh sau khi bỏ qua giống hệt cảnh chạy hết | A + T |
| T1-06 | Chống bấm hai lần | Bấm "Chơi" hoặc node 3 lần liên tiếp chỉ chuyển một lần | A + T |
| T1-07 | Back và xuống nền | Nút Back Android giữa tuyến thì bỏ qua, không mở dialog. Ẩn app giữa tuyến, mở lại thì cảnh đứng ở trạng thái cuối | A + T |
| T1-08 | Input đích | Không kéo được mảnh trước khi tuyến kết thúc hoặc bị bỏ qua | A + T |
| T1-09 | Giảm chuyển động | Mọi tuyến chỉ còn mờ chéo 150 ms. Cài đặt còn sau khi mở lại app | A + T |
| T1-10 | Khởi động harness | `?scene=play&level=1-3&mode=harness` chỉ chạy phần vào, không lỗi console | D |

### 4.2 Cảm giác trong màn (F2)

| Mã | Kiểm tra | Tiêu chí đạt | Cách |
|---|---|---|---|
| T2-01 | Vòng render liên tục | Không chạm vào màn: vòng thiên văn vẫn quay đều. Sau khi thắng: viền bia nhấp nháy | D + T |
| T2-02 | Nhấc mảnh | Phóng 1.08 kèm bóng đổ, có rung nhẹ | D + T |
| T2-03 | Kéo | Mảnh bám tay, không trễ thấy được, nghiêng nhẹ theo hướng kéo, hết kéo thì thẳng lại. Kéo nhanh qua lại không giật | T |
| T2-04 | Vùng hít | Mảnh bị hút nhẹ. Bóng mục tiêu sáng lên. Nhãn "Thả để khớp" hiện và ẩn mượt, bám theo mảnh | D + T |
| T2-05 | Xem trước vùng giao | Khi sắp khớp chồng lên mảnh khác, thấy trước nét vùng sẽ ẩn | D + T |
| T2-06 | Khớp neo | Trượt vào, nảy, vòng sáng ice. Biểu tượng trên thanh đếm bật lên. Rung vừa | D + T |
| T2-07 | Thả tạm và về khay | Thả tạm hạ nhẹ, không vòng sáng. Về khay bay mượt và nhỏ dần đúng cỡ ô | D + T |
| T2-08 | Xoay (`level=fixture-rotate`) | Tween 90° mượt, ánh sáng mặt vát vẫn từ trên-trái sau khi xoay | D + T |
| T2-09 | Xoay bị chặn (`level=fixture-rotate`) | Lắc ngang và nháy viền. Mảnh giữ hướng cũ. Rung cảnh báo | A + D + T |
| T2-10 | Vùng giao ẩn và hiện lại | Giao 2 lớp mờ dần về màu mặt bia, viền ice chạy dọc mép. Giao 3 lớp hiện lại amber kèm chớp nhỏ. Kết quả cuối khớp luật chẵn/lẻ | A + D + T |
| T2-11 | Đặt lại | Các mảnh bay về khay so le. Vùng giao mờ đi | D + T |
| T2-12 | Chuỗi thắng | Đúng thứ tự ở F2 mục 4. Tổng khoảng 1800 ms. ≤ 30 hạt, không hạt nào nhấp nháy loạn | A + D + T |
| T2-13 | Bỏ qua chuỗi thắng | Chạm giữa chuỗi: khung vàng, thẻ thắng hiện, không còn hạt | A + T |
| T2-14 | Nhấc mảnh đang tween | Nhấc lại mảnh đang bay về khay: mảnh đi tiếp từ chỗ hiện tại, không nhảy | T |
| T2-15 | Giảm chuyển động | Đúng F2 mục 5: vị trí tức thời, màu tối đa 150 ms, không hạt hay flash | A + T |
| T2-16 | Rung | Bật: đúng bảng sự kiện F2 mục 3. Tắt: không rung lần nào. Cài đặt còn sau khi mở lại app | A + T |
| T2-17 | Thứ tự lớp | Mảnh đang kéo luôn nằm trên vùng giao và các mảnh khác | A + D |

### 4.3 Hồi quy

| Mã | Kiểm tra | Tiêu chí đạt | Cách |
|---|---|---|---|
| R-01 | Lệnh kiểm tra | `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run build` đều đạt | A |
| R-02 | Sáu màn Chương 1 | `autosolve=win` trên 1-1 → 1-6 đều thắng. Thẻ thắng hiện đúng tên màn và câu thơ | D |
| R-03 | Tiến trình | Thắng một màn campaign rồi về bản đồ: node đúng trạng thái. Bản lưu cũ (thiếu `reducedMotion` và `haptics`) mở được | A + T |
| R-04 | Công cụ dev không lọt | Bản build bỏ qua `fps`, `motion`, `demo`, `loop`, `autosolve`, `perf` và không tải được `fixture-rotate` | A |

## 5. Hồ sơ duyệt

Mỗi spec một file: `docs/testing/motion/f1-acceptance.md` và `docs/testing/motion/f2-acceptance.md`. Trạng thái của mỗi file là `pending` → `passed` hoặc `failed`.

```markdown
# Hồ sơ nghiệm thu — F1 Chuyển cảnh

* **Ngày:** YYYY-MM-DD
* **Trạng thái:** `pending` | `passed` | `failed`
* **Commit nghiệm thu:** `<hash>`
* **Người duyệt:** <tên>
* **Spec:** [`2026-10-03-f1-scene-transitions-design.md`](../../superpowers/specs/2026-10-03-f1-scene-transitions-design.md)

## Thiết bị

| Vai trò | Máy | Android / WebView | Renderer |
|---|---|---|---|
| Chuẩn | … | … | WebGL / Canvas |
| Desktop | Chrome … | — | WebGL |

## Hiệu năng

| Cửa sổ | p95 ms | max ms | > 20 ms | Đạt |
|---|---|---|---|---|

## Ma trận

| Mã | Kết quả | Ghi chú |
|---|---|---|
| T1-01 | passed / failed / waived | … |

## Ghi chú của người review

> <trích nguyên văn>
```

Quy tắc:

- **Claude** điền phần A và D, cùng số đo desktop, rồi để trạng thái `pending`. Số đo dán nguyên dòng JSON từ `window.__motionPerf`.
- **Người duyệt** chạy các mục T và đo P-01 → P-06 trên thiết bị chuẩn. Chuyển `passed` bằng một câu trích nguyên văn trong "Ghi chú của người review", như cách đang duyệt màn.
- Mục `failed` chặn merge. Mục chỉ được chuyển `waived` khi người duyệt nói rõ, và ghi lý do trong cột Ghi chú.
- Sửa lỗi sau khi `failed` thì chạy lại đúng các mục liên quan, cộng R-01. Cập nhật commit nghiệm thu.
- Thêm `docs/testing/motion/README.md` làm mục lục: hai hồ sơ, đường dẫn mẫu ở mục 2, cách cài APK debug.

## 6. Môi trường

### 6.1 Thiết bị chuẩn

- Một điện thoại Android tầm trung do người duyệt chọn. Ghi model, phiên bản Android và phiên bản WebView vào hồ sơ. Lần nghiệm thu sau dùng lại đúng máy đó để số đo so được.
- Bản cài: `cd game-next && npm run android:sync`, rồi build APK debug trong Android Studio.
- Bản debug vẫn có `import.meta.env.DEV = false`. Vì vậy công cụ mục 2 cần thêm một cờ build `VITE_MOTION_TOOLS=1`, chỉ dùng khi build APK nghiệm thu: `VITE_MOTION_TOOLS=1 npm run android:sync`. Kiểm tra R-04 chạy trên bản build thường, không có cờ.
- Chrome desktop dùng `chrome://inspect` để đọc `window.__motionPerf` từ thiết bị.

### 6.2 Desktop

- Chrome bản ổn định, cửa sổ 390 × 844 (DevTools device mode), CPU throttling 4×, để phần D gần với máy tầm trung.

## 7. File thay đổi

| File | Thay đổi |
|---|---|
| `src/launchParams.ts` | Đọc `fps`, `motion`, `demo`, `loop`, `perf`. Bật khi `DEV` hoặc `VITE_MOTION_TOOLS` |
| `src/presentation/dev/perfStats.ts` | Mới, logic thuần |
| `src/presentation/dev/PerfOverlay.ts` | Mới: overlay `fps=1` |
| `src/presentation/dev/PerfRecorder.ts` | Mới: cửa sổ đo cho `perf=1`, nghe sự kiện bắt đầu và kết thúc từ `SceneDirector` và `FeedbackDirector` |
| `src/presentation/dev/autosolveScripts.ts` | Mới: các kịch bản `autosolve` mở rộng, tách khỏi `PlayScene.autosolve` |
| `src/content/fixtures.ts`, `src/content/catalog.ts` | `makeRotationFixture()`, chỉ nạp khi bật công cụ dev |
| `src/presentation/PlayScene.ts` | Gọi kịch bản từ `autosolveScripts`. Bỏ phần autosolve viết tay |
| `docs/testing/motion/{README,f1-acceptance,f2-acceptance}.md` | Mới, trạng thái `pending` |

## 8. Kiểm thử của chính F3

- `perfStats.test.ts`: p50/p95/max đúng trên mảng đã biết. Mảng rỗng trả về 0 mà không ném lỗi. Đếm `over20Ms` và `over50Ms` đúng ở biên (20 ms không tính, 20.01 ms có tính).
- `launchParams.test.ts`: tham số dev có hiệu lực khi `DEV` hoặc `VITE_MOTION_TOOLS`, bị bỏ qua ở build thường. `motion` ngoài [0, 4] bị kẹp về khoảng hợp lệ.
- `autosolveScripts.test.ts`: chạy mỗi kịch bản trên `PlayController` thật (không cần Phaser) và kiểm `feedbackEvents` sinh ra đúng sự kiện mà kịch bản nhắm tới, ví dụ `rotate-blocked` trên `fixture-rotate` sinh `rotate-blocked`.
- `content.test.ts`: `makeRotationFixture()` qua validator, và xoay ở neo sát mép trả `out-of-bounds`.

# Chuyển động F1–F3 — Chỉ mục plan

Đọc file này trước, rồi đi đúng thứ tự trong bảng. Mỗi file giai đoạn tự đủ (Goal, Global Constraints, bản đồ file, task TDD có code). Người thực thi chỉ cần file giai đoạn của mình và spec tương ứng.

**Spec:**
- F1 Chuyển cảnh: `docs/superpowers/specs/2026-10-03-f1-scene-transitions-design.md`
- F2 Cảm giác trong màn: `docs/superpowers/specs/2026-10-03-f2-in-level-game-feel-design.md`
- F3 Nghiệm thu: `docs/superpowers/specs/2026-10-03-f3-motion-acceptance-design.md`

Cả ba spec được NKhanh0908 duyệt ngày 2026-10-03. Mục "Điều chỉnh khi viết plan" cuối spec F2 và F3, cùng mục 3.3 của F1, là phần sửa sau khi duyệt. Người duyệt cần xem lại các phần này cùng bộ plan.

**Thư mục mã:** `game-next/`. Số task giữ liên tục trong mỗi plan (F1 Task 1–10, F2 Task 1–10, F3 Task 1–9), nên "F1 Task 6" luôn chỉ đúng một chỗ.

## Thứ tự đi

| # | File | Task | Nhánh | Giao được gì |
|---|---|---|---|---|
| 1 | `2026-10-03-f1-1-nen-tang.md` | F1 1–3 | `feat/motion-f1` (tách từ `docs/level-system-specs`) | Easing, `TransitionTimeline`, bảng bước 7 tuyến; game chưa đổi |
| 2 | `2026-10-03-f1-2-director.md` | F1 4–6 | `feat/motion-f1` | Lưu Giảm chuyển động, `BackgroundScene`, `SceneDirector` thay 13 `scene.start` |
| 3 | `2026-10-03-f1-3-dan-dung.md` | F1 7–10 | `feat/motion-f1` | Dàn dựng Menu, Bản đồ, Play; kiểm tra cuối F1 |
| 4 | `2026-10-03-f2-1-logic.md` | F2 1–4 | `feat/motion-f2` (tách từ `feat/motion-f1`) | Bỏ mask thừa khi kéo, tư thế mảnh, `feedbackEvents`, rung |
| 5 | `2026-10-03-f2-2-renderer.md` | F2 5–7 | `feat/motion-f2` | Texture mảnh, `PieceView`, `BoardRenderer.tick()` mỗi khung |
| 6 | `2026-10-03-f2-3-phan-hoi.md` | F2 8–10 | `feat/motion-f2` | `FeedbackDirector`, chuỗi thắng 1800 ms, nối F1; kiểm tra cuối F2 |
| 7 | `2026-10-03-f3-motion-acceptance.md` | F3 1–9 | `feat/motion-f3` (tách từ `feat/motion-f2`) | Công cụ đo dev, `fixture-rotate`, kịch bản autosolve, hồ sơ nghiệm thu `pending` |

Sau bước 7 và điểm dừng số 5: merge `feat/motion-f3` (chứa cả F1 và F2) vào `main`.

## Ai làm gì

| Vai | Ai | Việc |
|---|---|---|
| **Điều phối** (người follow chính) | Claude ở phiên chính | Đọc chỉ mục này, giao từng task theo thứ tự, review sau mỗi task, chạy kiểm tra cuối giai đoạn, tạo nhánh, dừng đúng các điểm dừng bên dưới, báo người duyệt |
| **Thực thi** | Mỗi task một subagent mới (skill `superpowers:subagent-driven-development`) | Chỉ làm đúng một task trong file giai đoạn: viết test thất bại, cài đặt, chạy test, thêm mục CHANGELOG, commit. Không làm task kế tiếp, không sửa spec |
| **Review task** | Claude ở phiên chính | Hai bước sau mỗi task: (1) khớp spec và plan, (2) chất lượng code. Lỗi thì trả lại đúng subagent đó sửa trước khi giao task sau |
| **Người duyệt** | NKhanh0908 | Quyết ở 5 điểm dừng; nghiệm thu trên thiết bị Android chuẩn ở F3 |

Nếu chọn chạy thẳng trong một phiên (skill `superpowers:executing-plans`), Claude vừa thực thi vừa điều phối. Các điểm dừng vẫn giữ nguyên.

## Luồng chính

1. Điều phối tạo nhánh `feat/motion-f1` từ `docs/level-system-specs`.
2. Chạy lần lượt bước 1 → 3. Hết mỗi giai đoạn chạy `npm run typecheck && npm test`. Hết bước 3 chạy thêm `npm run content:validate && npm run build`.
3. **Điểm dừng 2.** Không qua thì quay lại task tương ứng của F1.
4. Tạo `feat/motion-f2` từ `feat/motion-f1`. Chạy bước 4 → 6, với **điểm dừng 3** ở F2 Task 4 và **điểm dừng 4** sau bước 6.
5. Tạo `feat/motion-f3` từ `feat/motion-f2`. Chạy bước 7. Task 9 để hồ sơ ở trạng thái `pending`.
6. **Điểm dừng 5.** Người duyệt chuyển hồ sơ sang `passed`, rồi merge.

Một task thất bại, hoặc test của task trước bị đỏ, thì dừng luồng và báo người duyệt. Không nhảy sang task sau.

## GitNexus trong mỗi task

Repo được index bằng GitNexus (`CLAUDE.md` ở gốc repo là nguồn quy tắc). Hiện chỉ repo này được index, nên tham số `repo` không bắt buộc. Các lệnh mẫu vẫn kèm `repo: "ASOL-GAME-02"` để không hỏng nếu máy index thêm repo khác.

| Lúc | Người thực thi làm | Ghi vào báo cáo task |
|---|---|---|
| Trước khi sửa một hàm, class hay method có sẵn | `impact({ target, direction: "upstream", repo: "ASOL-GAME-02" })` | Số caller trực tiếp, luồng bị ảnh hưởng, mức rủi ro |
| Trước khi commit | `detect_changes({ scope: "staged", repo: "ASOL-GAME-02" })` | Các symbol đổi khớp đúng phạm vi task |
| Sau commit | `node .gitnexus/run.cjs analyze` (từ gốc repo, khoảng 15 s) | — |
| Đổi tên symbol | `rename`, không tìm-thay thủ công | — |

File mới tạo không cần chạy `impact`. Rủi ro **HIGH** hoặc **CRITICAL**: điều phối báo người duyệt trước khi giao task, trừ khi task đó đã được liệt kê dưới đây và người duyệt đã chấp nhận ở điểm dừng 1.

Rủi ro đã biết khi viết chỉ mục (đo ngày 2026-10-03 tại `f3e03ef`):

| Symbol | Rủi ro | Phạm vi | Task sửa |
|---|---|---|---|
| `BoardRenderer` | CRITICAL | 5 phụ thuộc trực tiếp, 6 luồng của `PlayScene` (`create`, `onRotate`, `onReset`, `onRestart`, `onToggleTarget`, `autosolve`) | F1 Task 9, F2 Task 6 (viết lại) |

Các symbol sửa khác (`PlayScene`, `Hud`, `SkyBackdrop`, `progressRepository`, `playController`, `drag`) được đo lại ở đầu task tương ứng.

## Năm điểm dừng cần người duyệt

1. **Trước bước 1:** duyệt bộ plan này cùng các điều chỉnh spec ghi ở đầu file.
2. **Sau bước 3 (F1 Task 9 Step 8):** xem tận mắt 7 tuyến trên dev server (`cd game-next && npm run dev`): không cắt cứng, sao không nhảy, chạm bỏ qua được, Giảm chuyển động chỉ còn mờ chéo. Ghi chú: 4 rune quanh bia giờ nhìn thấy được, trước đây bị mặt bia che.
3. **F2 Task 4 Step 1:** đồng ý thêm dependency `@capacitor/haptics@8.0.2` (`npm install --save-exact`) trước khi cài.
4. **Sau bước 6 (F2 Task 9 Step 9 và Task 10):** chơi 1-1 → 1-6 ở harness: mảnh bám tay và nghiêng, hút vào neo, nảy khi khớp, vùng giao mờ dần, chuỗi thắng chạm bỏ qua được.
5. **Sau bước 7 (F3 Task 9):** cài APK nghiệm thu (`VITE_MOTION_TOOLS=1 npm run android:sync`), chạy các mục T và đo P-01 → P-06 trên máy chuẩn, rồi chuyển `docs/testing/motion/f1-acceptance.md` và `f2-acceptance.md` sang `passed` bằng một câu trích nguyên văn.

## Kiểm thủ công trong từng giai đoạn

Không chặn luồng. Điều phối tự làm trên dev server và ghi kết quả vào báo cáo task.

| Giai đoạn | Bước |
|---|---|
| F1-2 | F1 Task 6 Step 11 |
| F1-3 | F1 Task 7 Step 4, Task 8 Step 3, Task 9 Step 8 (điểm dừng 2) |
| F2-2 | F2 Task 6 Step 7 |
| F2-3 | F2 Task 8 Step 5, Task 9 Step 9 |
| F3 | F3 Task 3 Step 6, Task 5 Step 6, Task 6 Step 7, Task 7 Step 7 |

## Hợp đồng giữa các plan

Tên dưới đây là chỗ nối. Đổi tên ở plan trước thì phải sửa plan sau trước khi chạy.

| Sinh ra ở | Tên | Dùng ở |
|---|---|---|
| F1 Task 1 | `EASES`, `EaseName`, `stagger`, `scaleTiming`, `getMotionScale`, `setMotionScale`, `isReducedMotion`, `RouteId`, `TRANSITION_TOKENS` | F1, F2, F3 |
| F1 Task 2 | `TransitionTimeline` (`at`, `call`, `onDone`, `advance`, `complete`) | F1, F2 (chuỗi thắng) |
| F1 Task 3 | `Poseable`, `enter`, `exit`, `applySteps`, `playIn`, `PLAY_SPECIAL`, `planStardust` | F1, F2 Task 9–10 |
| F1 Task 4 | `settings.reducedMotion`, `setReducedMotion` | F2 Task 4 (`settings.haptics` theo cùng mẫu) |
| F1 Task 5 | `BackgroundScene.setMood`, `SKY_MOODS` | F2 Task 9 (`deepen`) |
| F1 Task 6 | `director` (`go`, `boot`, `attach`, `skip`, `isTransitioning`), `SceneHost`, `Choreographed` | F3 Task 4, 7 |
| F1 Task 9 | `BoardRenderer.getTransitionParts`, `setTargetReveal`, `setFrameGold`, `Hud.getTransitionParts`, `PlayScene.transitionView()` | F2 Task 6, 10 |
| F2 Task 3 | `feedbackEvents(prev, transition, level, subject)`, `FeedbackSubject` | F2 Task 8, F3 Task 5 |
| F2 Task 5 | `PieceTextureCache` (`enqueue`, `bakeNext`, `bytesBaked`) | F2 Task 6, F3 Task 4 |
| F2 Task 8–9 | `FeedbackDirector.handle(events)`, `playVictory()`, field `PlayScene.feedback` | F3 Task 4, 6 |
| F3 Task 4 | `SceneDirector.onWindow`, `setTimeScale`, `FeedbackDirector.onWindow`, `pieceTextureBytes.ts` | F3 Task 6–9 |

Hook đo hiệu năng chỉ do F3 thêm. F2 không định nghĩa hook đo nào.

## Con số đã tính trước

**Tuyến F1** (spec F1 mục 3; `tests/transitionRoutes.test.ts` khoá các con số này):

| Tuyến | Tổng | Handoff |
|---|---|---|
| `menu-to-play`, `map-to-play` | 1500 ms | 200, 300 |
| `next-level` | 1500 ms | 800 (restart sau khi phần ra xong) |
| `play-to-map`, `play-to-menu` | 1000 ms | 400 |
| `menu-to-map`, `map-to-menu` | 1000 ms | 300 |

Giảm chuyển động: mọi tuyến là mờ chéo 150 ms.

**Bộ nhớ texture F2** (đo từ `frameSize` thật, ngưỡng F3 P-06 ≤ 24 MB): mỗi (mảnh × hướng) tốn 0,742 MiB. 1-1 → 1-3 là 1,48 MiB, 1-4 → 1-6 là 2,22 MiB, `fixture-rotate` (3 mảnh khung 32, xoay đủ 4 hướng): 0,33 MiB mỗi (mảnh × hướng), tổng 3,96 MiB.

**Fixture xoay F3** (`fixture-rotate`, Chương 3, chỉ ở harness):

| Mảnh | Hình | Neo | Vai trò |
|---|---|---|---|
| T1 | tam giác hướng 0 | A (16,48), E (97,48) | E bị `out-of-bounds` khi xoay |
| T2 | tam giác hướng 0 | A (64,48), O (16,48) | A xoay được |
| S1 | vuông | A (16,96), O (16,48) | O tạo giao 3 lớp |

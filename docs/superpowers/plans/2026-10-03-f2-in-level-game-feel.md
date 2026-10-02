# F2 — Cảm giác chơi trong màn: mảnh texture, chuyển động mượt và chuỗi thắng

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến màn chơi từ "nhảy tức thời" thành chuyển động liên tục: mảnh vẽ một lần thành texture và hiển thị bằng `Image`, tư thế hiển thị đuổi theo trạng thái logic mỗi khung hình, mỗi thao tác có phản hồi riêng (nhấc, hút, khớp, về khay, xoay, xoay bị chặn, vùng giao ẩn/hiện lại, đặt lại), chuỗi thắng 1800 ms có thể chạm bỏ qua, và rung qua `@capacitor/haptics`.

**Architecture:** Logic thuần, test được không cần Phaser: `pieceMotion.ts` (tư thế, làm mượt theo hàm mũ, nảy/lắc/chớp), `feedback/parityDiff.ts` (khoá và chênh lệch lớp chẵn/lẻ, đoạn chạy trên chu vi), `feedback/feedbackEvents.ts` (suy sự kiện từ `Transition`), `feedback/hapticCues.ts`, `feedback/victorySequence.ts` (lịch chuỗi thắng), `infrastructure/haptics.ts`; các hàm kích thước và ngân sách trong `PieceTextureCache.ts` cũng thuần nhưng nằm cùng file với phần vẽ. Phần Phaser: `PieceView` (một mảnh = container + 3 ảnh), `BoardRenderer` viết lại thành `tick()` mỗi khung hình với các lớp vẽ lại theo cờ thay đổi, `FeedbackDirector` chạy hiệu ứng trên `TransitionTimeline` của F1.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Phaser 3.90, Capacitor 8 (`@capacitor/core` 8.5.2, `@capacitor/haptics` **8.0.2**).

**Spec:** `docs/superpowers/specs/2026-10-03-f2-in-level-game-feel-design.md`. Plan này có 7 chỗ lệch nhỏ so với spec, liệt kê ở mục "Lệch so với spec" ngay dưới; người review cần duyệt các chỗ đó cùng plan.

**Giao được gì:** chơi 1-1 → 1-6 thấy mảnh bám tay, nghiêng theo hướng kéo, bị hút vào neo, nảy khi khớp, bay về khay; vùng giao mờ dần kèm viền sáng chạy; vòng thiên văn quay liên tục; chuỗi thắng dàn dựng trên một timeline chạm-để-bỏ-qua; rung trên Android; một `pointermove` trong cùng ô lưới không gọi `evaluate` lần nào.

## Vị trí trong loạt plan

- **Chạy sau:** plan F1 (`2026-10-03-f1-scene-transitions.md`) xong toàn bộ 10 task. Nhánh `feat/motion-f2` tách từ `feat/motion-f1`.
- **Dùng của F1:** `transitions/motion.ts` (`EASES`, `EaseName`, `stagger`, `scaleTiming`, `getMotionScale`, `isReducedMotion`), `transitions/TransitionTimeline.ts`, `transitions/choreography.ts` (`enter`, `exit`, `Poseable`), `transitions/routes.ts` (`playIn`), `transitions/stardust.ts`, `BoardRenderer` sau F1 (nhóm `boardBase` / lưới / `boardTop`, `getTransitionParts`, `setTargetReveal`, `setFrameGold`), `Hud.getTransitionParts`, `BackgroundScene`, `SkyBackdrop.moodState`, `skyMood.ts` (`SKY_MOODS`), `settings.reducedMotion`, `PlayScene.transitionView()`.
- **Chạy tiếp theo:** plan F3 (`2026-10-03-f3-motion-acceptance.md`). F3 Task 4 tự thêm hook đo vào module của plan này: `FeedbackDirector.onWindow` (cửa sổ theo `event.type`, chuỗi thắng tên `'won'`) và bộ đếm `pieceTextureBytes.ts` gắn vào `PieceTextureCache`. Plan F2 không định nghĩa hook đo nào.

## Lệch so với spec (cần duyệt)

1. **Không có texture `ghost` riêng.** Trong `JewelShape.drawJewelPolygon`, biến thể `ghost` vẽ y hệt `solid`, chỉ khác alpha (`PIECE_TOKENS.ghostAlpha` 0.75). Plan dùng một texture `body` và đặt `alpha` của `Image`. Spec F2 mục 2.2 và 8 tính `× 2 biến thể`.
2. **Bóng đổ và lớp sáng luôn là texture riêng (đen/trắng), không rẽ nhánh theo renderer.** Spec mục 8 cho WebGL dùng `setTintFill` và chỉ Canvas mới vẽ texture đen/trắng. Plan vẽ silhouette đen và trắng cho cả hai renderer ở **nửa độ phân giải** (bóng và chớp sáng vốn mềm), nên một đường code duy nhất, không phụ thuộc `renderer.type`, và tốn thêm 2 × 25% bộ nhớ của `body`.
3. **Lề texture 25% mỗi phía thay vì 22%.** Hào quang phóng đa giác 1.22 lần quanh **trọng tâm**; với tam giác vuông, đỉnh góc vuông cách trọng tâm ~0.75 cạnh khung, nên hào quang tràn ~0.165 cạnh. Lề 22% tổng (11% mỗi phía) sẽ cắt hào quang.
4. **`feedbackEvents` nhận thêm tham số `subject: { command, pieceId }`.** Lệnh xoay bị từ chối trả `Transition` không có id mảnh, nên không suy ra được `rotate-blocked` chỉ từ `(prev, transition, level)`.
5. **Vòng cộng hưởng lúc thắng rút còn 600 ms** (spec: "như hiện tại" 800/850 ms). Với mốc 900 + trễ 160, vòng 850 ms kết thúc ở 1910 > tổng 1800 của spec mục 4.
6. **Vệt sáng chạy quanh từng placement của nghiệm mẫu** thay vì "đa giác ngoài" của cả silhouette (spec mục 4, 700–1100). Chương 1 không có placement giao nhau (validator chặn) nên hình nhìn như nhau; hợp nhất đa giác không có sẵn trong `polygonClip.ts`.
7. **Bóng đổ alpha 0 khi không nhấc** (spec: 0.2 → 0.45). Thêm bóng thường trực dưới mảnh đã snap sẽ làm tối mép vùng giao chẵn/lẻ, đổi giao diện đã duyệt. Plan dùng `alpha = 0.45 × lift`, lệch `(4, 6) → (8, 12)` theo `lift`.

## Đo bộ nhớ texture (spec mục 8, ngưỡng F3 P-06 ≤ 24 MB)

Đọc từ `game-next/src/content/levels/*.json`: **mọi mảnh của 1-1 → 1-6 có `frameSize` 48 và mọi màn có `rotationEnabled: false`.** Ô lưới 5 px, nên khung mảnh 240 px.

Mỗi (mảnh × hướng) gồm: `body` cạnh `ceil(240 × 1.5) = 360` px → 360 × 360 × 4 = 518 400 B; `shadow` và `light` cạnh 180 px → 2 × 129 600 B. Tổng **777 600 B = 0,742 MiB**.

| Màn | Mảnh | Hướng vẽ | Bộ nhớ |
|---|---|---|---|
| 1-1 Song Tinh | 2 | 1 | 1,48 MiB |
| 1-2 Bảo Tháp | 2 | 1 | 1,48 MiB |
| 1-3 Cánh Chim | 2 | 1 | 1,48 MiB |
| 1-4 Hải Đăng | 3 | 1 | 2,22 MiB |
| 1-5 Thuyền Sao | 3 | 1 | 2,22 MiB |
| 1-6 Vương Miện | 3 | 1 | 2,22 MiB |
| `fixture-rotate` (F3, 2 tam giác, xoay đủ 4 hướng) | 2 | 4 | 5,93 MiB |
| Giả định Chương 3: 6 mảnh khung 48, xoay đủ 4 hướng | 6 | 4 | 17,80 MiB |
| Giả định xấu: 6 mảnh khung 64, xoay đủ 4 hướng, độ phân giải 1 | 6 | 4 | 31,64 MiB → **vượt** |
| Cùng giả định, độ phân giải 0,75 | 6 | 4 | 17,80 MiB |

Chiến lược chốt từ bảng:

- Độ phân giải 1 cho mọi màn hiện có (xa ngưỡng). `chooseResolution(level)` tự hạ về 0,75 nếu ước tính xấu nhất (`rotationEnabled` → 4 hướng) vượt 24 MiB.
- Hướng ban đầu vẽ ngay khi vào màn; hướng khác chỉ vẽ khi xoay tới (hoặc vẽ trước khi mảnh được chọn trong màn có xoay).
- Ước tính 40 MB của spec mục 8 dựa trên khung 64 và biến thể `ghost` riêng; với số thật thì không cần hạ độ phân giải ở Chương 1.

## Lịch vẽ texture (rủi ro F3 P-04, khung ≤ 50 ms)

Không vẽ trong `PlayScene.create()`. `create()` chỉ xếp hàng các (mảnh, hướng ban đầu); `PlayScene.update()` gọi `PieceTextureCache.bakeNext()` **một mảnh mỗi khung hình**. Màn 3 mảnh xong sau 3 khung (~50 ms), trước mốc 950 ms khay và mảnh xuất hiện trong tuyến `menu-to-play` / `map-to-play` / `next-level` của F1. `PieceView` ẩn tới khi có texture. Một lần vẽ là một Graphics (6 vòng hào quang + mặt vát) và một `generateTexture` 360 px — ước lượng 5–15 ms trên máy tầm trung, nên một mảnh mỗi khung giữ khung dưới 50 ms. Khi xoay tới hướng chưa có, `ensure()` vẽ đồng bộ trong khung bấm nút (một mảnh). F3 đo lại bằng `perf=1`.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Không khai báo `enum`, `namespace`, parameter property.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- File logic thuần (`pieceMotion.ts`, `feedback/parityDiff.ts`, `feedback/feedbackEvents.ts`, `feedback/hapticCues.ts`, `feedback/victorySequence.ts`, `infrastructure/haptics.ts`) không import runtime từ `phaser`. `PieceTextureCache.ts` gọi `drawJewelPolygon` nên kéo theo `phaser`; test của nó mock `phaser` như `boardRendererLayers.test.ts`.
- Không sửa `domain/mask.ts`, `domain/session.ts`; luật chẵn/lẻ giữ nguyên.
- Canvas 720 × 1280; ô lưới 5 px; bia `x 40, y 200, 640 × 800`, tâm `(360, 600)`; khay `x 40, y 1016, 640 × 136`.
- Depth (`DEPTH_TOKENS`): mảnh khay và mảnh snap 30; lớp giao chẵn/lẻ 31; nét xem trước vùng giao 32; mảnh tạm 50; mảnh đang kéo 60; viền nhịp thắng 61.
- Hằng số tương tác (spec mục 3): nhấc 1 → 1.08 trong 80 ms `backOut`; bóng lệch (4, 6) → (8, 12), alpha tối đa 0.45; τ kéo 35 ms, τ scale 45 ms, τ nghiêng 120 ms, τ thả tạm 60 ms, τ nghỉ 90 ms, τ nhãn hít 60 ms; nghiêng `clamp(vx × 0.02, −4°, 4°)`, `vx` tính bằng px/s; hút 30%; bóng mục tiêu 0.7 → 1 trong 120 ms; snap trượt 120 ms `cubicOut`, nảy 1.08 → 0.98 → 1 trong 180 ms, vòng ice bán kính 1.2 × mảnh, alpha 0.6 → 0 trong 240 ms; biểu tượng đếm 1.3 → 1; về khay 220 ms; xoay −90° → 0 trong 160 ms `backOut`; lắc ±6 px, 3 nhịp, 180 ms; viền nháy alpha 0 → 0.8 → 0; vùng giao mờ 150 ms, viền chạy 320 ms; hồi sinh 200 ms; đặt lại so le 40 ms, mỗi mảnh 260 ms, vùng giao mờ 120 ms; nút Xoay đổi alpha 150 ms.
- Chuỗi thắng (spec mục 4): tổng 1800 ms; trời tối thêm 0.1 ở mốc 180 trong 300 ms; mảnh sáng từ 300, cách 90 ms, mỗi mảnh 260 ms, alpha đỉnh 0.6, kết thúc ≤ 900; vệt sáng 700–1100; mốc 900: flash camera 300 ms `(249, 199, 79)`, vòng amber 160 px và ice 180 px trễ 160 ms (mỗi vòng 600 ms), ≤ 30 hạt trong 900 ms; khung vàng 1000–1400; khay mờ 300 ms; thẻ thắng 1200–1800 trượt 60 px, 4 nhóm con so le 80 ms.
- Giảm chuyển động (spec mục 5): vị trí/scale/góc tức thời; màu và alpha tối đa 150 ms; không hạt, vòng, vệt, flash, chớp, lắc; rung không phụ thuộc.
- Mỗi commit thêm một mục vào `CHANGELOG.md` ở đầu `## Unreleased` (tiếng Anh, theo mẫu mục hiện có).
- Kiểm tra trước mỗi commit: `npm run typecheck` và `npm test`; task cuối thêm `npm run content:validate` và `npm run build`.

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/application/playController.ts`, `src/application/drag.ts` | Cache `committedMask`; mask xem trước có điều kiện |
| `src/presentation/designTokens.ts` | `FEEDBACK_TOKENS`, `VICTORY_TOKENS` |
| `src/presentation/pieceMotion.ts` | `Pose`, làm mượt, tư thế đích của mảnh, đường cong nảy/lắc/chớp |
| `src/presentation/feedback/parityDiff.ts` | Khoá lớp, chênh lệch lớp, lớp giao ≥ 2, đoạn trên chu vi |
| `src/presentation/feedback/feedbackEvents.ts` | `FeedbackEvent`, suy sự kiện từ `Transition` |
| `src/presentation/feedback/hapticCues.ts` | Bảng sự kiện → lời rung |
| `src/presentation/feedback/victorySequence.ts` | Lịch chuỗi thắng (thuần) |
| `src/presentation/feedback/FeedbackDirector.ts` | Chạy hiệu ứng thao tác và chuỗi thắng |
| `src/infrastructure/haptics.ts`, `src/infrastructure/capacitorHaptics.ts` | Cổng rung thuần; driver dùng plugin |
| `src/presentation/PieceTextureCache.ts` | Vẽ texture mảnh một mảnh mỗi khung, ngân sách bộ nhớ (hàm kích thước thuần, nhưng file import `JewelShape`) |
| `src/presentation/PieceView.ts` | Một mảnh trên màn: container tư thế + container lệch chuyển cảnh + 3 ảnh |
| `src/presentation/BoardRenderer.ts` | Viết lại: `tick()` mỗi khung, mảnh là `PieceView`, lớp vẽ lại theo khoá thay đổi |
| `src/presentation/Hud.ts` | Nhãn hít mượt, biểu tượng đếm bật, nút Xoay đổi alpha mượt, thẻ thắng dàn dựng |
| `src/presentation/BackgroundScene.ts` | `deepen(extra, ms)` cho chuỗi thắng |
| `src/presentation/PlayScene.ts` | Vòng `update`, nối sự kiện phản hồi, bỏ `playCelebration` |
| `src/presentation/SettingsDialog.ts`, `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts` | `settings.haptics` |
| `src/presentation/transitions/routes.ts`, `transitions/stardust.ts` | Mảnh rơi vào khay từng mảnh; `planBurst` cho chuỗi thắng |
| `tests/helpers/fakeScene.ts` | Scene giả ghi lại mọi lời gọi (Graphics, Image, Container, Arc) |

---

### Task 1: Không tính lại mask khi không cần

**Files:**
- Modify: `game-next/src/application/drag.ts:825-958` (`DragUpdate`, `updateDrag`)
- Modify: `game-next/src/application/playController.ts`
- Test: `game-next/tests/playControllerCache.test.ts` (mới), `game-next/tests/drag.test.ts` (thêm `describe`)

**Interfaces:**
- Produces:
  - `type UpdateDragOptions = { computePreviewMask?: boolean; previous?: DragUpdate | null }`
  - `updateDrag(drag, level, pointerX, pointerY, layout, options?: UpdateDragOptions): DragUpdate`
  - `EMPTY_PREVIEW_MASK: Uint8Array` (độ dài 0, dùng chung)
  - `PlayController.getSnapshot()` không gọi `evaluate`.

- [ ] **Step 1: Viết test thất bại cho controller**

`game-next/tests/playControllerCache.test.ts`:

```ts
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/domain/mask.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/domain/mask.ts')>();
  return { ...actual, evaluate: vi.fn(actual.evaluate) };
});

import { evaluate } from '../src/domain/mask.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { createProgressRepository } from '../src/infrastructure/progressRepository.ts';
import type { StoragePort } from '../src/application/progressPort.ts';
import { PlayController } from '../src/application/playController.ts';
import { computeLayout, gridToCanvas, pieceHitbox } from '../src/presentation/layout.ts';

const layout = computeLayout(720, 1280);
const level = loadLevel('1-1', 'harness');
const storage = (): StoragePort => {
  const data: Record<string, string> = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
};
const calls = () => vi.mocked(evaluate).mock.calls.length;

describe('PlayController không tính lại mask thừa', () => {
  beforeEach(() => vi.mocked(evaluate).mockClear());

  test('getSnapshot đọc mask đã cache', () => {
    const controller = new PlayController(level, createProgressRepository(storage(), campaignManifest, 'oracle-v1'));
    vi.mocked(evaluate).mockClear();
    controller.getSnapshot();
    controller.getSnapshot();
    controller.getSnapshot();
    expect(calls()).toBe(0);
  });

  test('kéo không gọi evaluate, kể cả qua nhiều ô', () => {
    const controller = new PlayController(level, createProgressRepository(storage(), campaignManifest, 'oracle-v1'));
    const d1 = level.pieces.find((p) => p.id === 'D1')!;
    const hit = pieceHitbox(d1, { kind: 'tray', turns: 0 }, layout, 0, 2);
    vi.mocked(evaluate).mockClear();
    controller.onPointerDown(hit.x + hit.width / 2, hit.y + hit.height / 2, layout);
    for (const [x, y] of [[40, 80], [40.4, 80.2], [52, 90], [60, 100]]) {
      const p = gridToCanvas(x, y, layout);
      controller.onPointerMove(p.x, p.y, layout);
    }
    controller.getSnapshot();
    expect(calls()).toBe(0);
  });

  test('thả mảnh cập nhật mask đã cache đúng kết quả mới', () => {
    const controller = new PlayController(level, createProgressRepository(storage(), campaignManifest, 'oracle-v1'));
    const d1 = level.pieces.find((p) => p.id === 'D1')!;
    const hit = pieceHitbox(d1, { kind: 'tray', turns: 0 }, layout, 0, 2);
    controller.onPointerDown(hit.x + hit.width / 2, hit.y + hit.height / 2, layout);
    const anchor = gridToCanvas(40, 80, layout);
    const transition = controller.onPointerUp(anchor.x, anchor.y, layout)!;
    expect(controller.getSnapshot().committedMask).toEqual(transition.mask);
    controller.onReset();
    expect(controller.getSnapshot().committedMask.some(Boolean)).toBe(false);
  });
});
```

- [ ] **Step 2: Viết test thất bại cho drag**

Thêm vào cuối `game-next/tests/drag.test.ts` (dùng lại `layout`, `level`, `pieceD1` của `describe` đầu file bằng cách đặt khối mới **bên trong** `describe('Hitbox, Layout and Drag Transactions', …)`, ngay trước dấu `});` cuối):

```ts
  test('updateDrag dùng lại mask xem trước khi placement không đổi', () => {
    const state = createPuzzle(level);
    const drag = beginDrag(state, pieceD1, 200, 1000, layout);
    drag.pointerOffset = { x: 0, y: 0 };
    const a = gridToCanvas(44, 96, layout);
    const first = updateDrag(drag, level, a.x, a.y, layout);
    const again = updateDrag(drag, level, a.x + 1, a.y + 1, layout, { previous: first });
    expect(again.previewPlacement).toEqual(first.previewPlacement);
    expect(again.previewMask).toBe(first.previewMask);
  });

  test('computePreviewMask false trả mask rỗng dùng chung', () => {
    const state = createPuzzle(level);
    const drag = beginDrag(state, pieceD1, 200, 1000, layout);
    drag.pointerOffset = { x: 0, y: 0 };
    const a = gridToCanvas(44, 96, layout);
    const update = updateDrag(drag, level, a.x, a.y, layout, { computePreviewMask: false });
    expect(update.snapCandidateId).toBe('A');
    expect(update.previewMask.length).toBe(0);
  });
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/playControllerCache.test.ts tests/drag.test.ts`
Expected: FAIL — `getSnapshot` gọi `evaluate` (3 lần), kéo gọi `evaluate`; test drag: `again.previewMask` là mảng mới, `previewMask.length` là 20480.

- [ ] **Step 4: Sửa `drag.ts`**

Thêm sau kiểu `DragUpdate`:

```ts
export type UpdateDragOptions = {
  /** false: không tính mask xem trước (renderer không dùng); mặc định true để giữ test cũ */
  computePreviewMask?: boolean;
  /** Kết quả lần trước: dùng lại mask nếu placement không đổi */
  previous?: DragUpdate | null;
};

/** Mask rỗng dùng chung khi không tính xem trước */
export const EMPTY_PREVIEW_MASK = new Uint8Array(0);

function samePlacement(a: Placement | null, b: Placement | null): boolean {
  if (a === null || b === null) return a === b;
  return a.pieceId === b.pieceId && a.x === b.x && a.y === b.y && a.turns === b.turns;
}
```

Đổi chữ ký: `export function updateDrag(drag, level, pointerX, pointerY, layout, options: UpdateDragOptions = {}): DragUpdate`. Trong nhánh `!piece`, giữ nguyên. Thay toàn bộ phần từ `// Tập hợp placement ngoại trừ piece đang drag` tới hết hàm bằng:

```ts
  const snapCandidateId = best ? best.id : null;
  if (options.computePreviewMask === false) {
    return { previewPlacement, previewMask: EMPTY_PREVIEW_MASK, snapCandidateId };
  }
  const previous = options.previous ?? null;
  if (previous && previous.previewMask.length > 0 && samePlacement(previous.previewPlacement, previewPlacement)) {
    return { previewPlacement, previewMask: previous.previewMask, snapCandidateId };
  }

  // Tập hợp placement ngoại trừ piece đang drag
  const otherPlacements = placementsOf(level, drag.committedState).filter(
    (p) => p.pieceId !== piece.id
  );
  const previewPlacements = previewPlacement
    ? [...otherPlacements, previewPlacement]
    : otherPlacements;

  let previewMask: Uint8Array;
  try {
    previewMask = evaluate(level, previewPlacements);
  } catch {
    previewMask = evaluate(level, otherPlacements);
  }

  return { previewPlacement, previewMask, snapCandidateId };
```

- [ ] **Step 5: Sửa `playController.ts`**

1. Field mới `private committedMask: Uint8Array;` và trong constructor, sau `this.puzzleState = createPuzzle(level);`:

```ts
    this.committedMask = evaluate(level, placementsOf(level, this.puzzleState));
```

2. Thêm phương thức riêng và dùng ở mọi chỗ gán `puzzleState`:

```ts
  /** Mọi thay đổi trạng thái đi qua đây để mask cache luôn khớp */
  private commitState(next: PuzzleState, mask: Uint8Array): void {
    this.puzzleState = next;
    this.committedMask = mask;
  }
```

   - `onPointerUp`: thay `this.puzzleState = transition.state;` bằng `this.commitState(transition.state, transition.mask);`
   - `onRotate`: tương tự.
   - `onReset`: thay `this.puzzleState = transition.state;` bằng `this.commitState(transition.state, transition.mask);`

3. `getSnapshot()`: xoá hai dòng `committedPlacements` / `evaluate`, đổi trường thành `committedMask: this.committedMask,`. Bỏ import `Placement` nếu không còn dùng.

4. `onPointerDown` và `onPointerMove`: truyền tuỳ chọn cho `updateDrag`:

```ts
        this.dragUpdate = updateDrag(this.dragSession, this.level, pointerX, pointerY, layout, {
          computePreviewMask: false,
        });
```

```ts
    this.dragUpdate = updateDrag(this.dragSession, this.level, pointerX, pointerY, layout, {
      computePreviewMask: false,
      previous: this.dragUpdate,
    });
```

- [ ] **Step 6: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/playControllerCache.test.ts tests/drag.test.ts tests/playController.test.ts`
Expected: PASS (test controller cũ vẫn đạt: `snapCandidateId` vẫn tính, `dragPreviewMask` giờ là mảng rỗng và không test nào đọc nó).

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Stop redundant mask evaluation while dragging (F2 task 1)

- `PlayController` now caches the committed mask and updates it only when the puzzle state changes; `getSnapshot()` no longer evaluates the 20,480-cell mask.
- `updateDrag` accepts `computePreviewMask` and `previous`; the controller disables the unused preview mask, so a drag never calls `evaluate`.
- Verification: `tests/playControllerCache.test.ts` (evaluate spy) and two new drag tests failed before the change, then passed; `npm run typecheck` and `npm test` passed.
```

Run: `npm run typecheck && npm test`

```bash
git add game-next/src/application/drag.ts game-next/src/application/playController.ts game-next/tests/playControllerCache.test.ts game-next/tests/drag.test.ts CHANGELOG.md
git commit -m "perf(play): cache committed mask and skip preview mask while dragging"
```

---

### Task 2: Token phản hồi và tư thế mảnh

**Files:**
- Modify: `game-next/src/presentation/designTokens.ts` (thêm `FEEDBACK_TOKENS`, `VICTORY_TOKENS` sau `TRANSITION_TOKENS`)
- Create: `game-next/src/presentation/pieceMotion.ts`
- Test: `game-next/tests/pieceMotion.test.ts`

**Interfaces:**
- Consumes: `EASES` (F1), `pieceHitbox`, `pieceCenterCanvas`, `pieceRadiusPx`, `trayPieceRadiusPx` (`layout.ts`).
- Produces:
  - `type Pose = { x: number; y: number; scale: number; angle: number; alpha: number }`
  - `type PoseTau = { position: number; scale: number; angle: number; alpha: number }`
  - `POSE_TAU: Record<'dragging' | 'settling' | 'idle', PoseTau>`
  - `stepScalar(current, target, dtMs, tauMs): number`
  - `stepPose(current: Pose, target: Pose, dtMs: number, tau: PoseTau): Pose`
  - `lerpPose(a: Pose, b: Pose, k: number): Pose`
  - `magnetPose(pointer: Pt, anchor: Pt, strength: number): Pt`
  - `tiltDeg(vxPxPerSec: number): number`
  - `bounceScale(t)`, `shakeOffset(t)`, `lightAlpha(t)`: `t ∈ [0, 1]`
  - `type PoseInput = { layout; trayIndex; trayCount; selected; drag: { x; y; candidate: Pt | null } | null }`
  - `pieceTargetPose(piece: Piece, state: PieceState, input: PoseInput): Pose`
  - `anchorCenter(piece: Piece, anchorId: string, layout): Pt | null`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/pieceMotion.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  POSE_TAU,
  anchorCenter,
  bounceScale,
  lightAlpha,
  magnetPose,
  pieceTargetPose,
  shakeOffset,
  stepPose,
  stepScalar,
  tiltDeg,
} from '../src/presentation/pieceMotion.ts';
import type { Pose } from '../src/presentation/pieceMotion.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { computeLayout, pieceCenterCanvas, pieceHitbox } from '../src/presentation/layout.ts';
import { FEEDBACK_TOKENS, PIECE_TOKENS } from '../src/presentation/designTokens.ts';

const layout = computeLayout(720, 1280);
const level = loadLevel('1-1', 'campaign');
const d1 = level.pieces[0];

describe('làm mượt theo hàm mũ', () => {
  test('không phụ thuộc FPS: hai bước 8 ms bằng một bước 16 ms', () => {
    const a: Pose = { x: 0, y: 0, scale: 1, angle: 0, alpha: 0 };
    const b: Pose = { x: 100, y: -50, scale: 2, angle: 10, alpha: 1 };
    const one = stepPose(a, b, 16, POSE_TAU.dragging);
    const two = stepPose(stepPose(a, b, 8, POSE_TAU.dragging), b, 8, POSE_TAU.dragging);
    for (const key of ['x', 'y', 'scale', 'angle', 'alpha'] as const) {
      expect(Math.abs(one[key] - two[key])).toBeLessThan(0.5);
    }
  });

  test('hội tụ về đích', () => {
    let v = 0;
    for (let i = 0; i < 60; i++) v = stepScalar(v, 10, 16, 35);
    expect(v).toBeCloseTo(10, 3);
  });

  test('tau 0 nhảy thẳng tới đích', () => {
    expect(stepScalar(3, 9, 16, 0)).toBe(9);
  });
});

describe('hút, nghiêng và đường cong một lần', () => {
  test('magnetPose dịch thêm đúng phần trăm quãng còn lại', () => {
    expect(magnetPose({ x: 0, y: 0 }, { x: 100, y: 40 }, 0)).toEqual({ x: 0, y: 0 });
    expect(magnetPose({ x: 0, y: 0 }, { x: 100, y: 40 }, 0.3)).toEqual({ x: 30, y: 12 });
    expect(magnetPose({ x: 0, y: 0 }, { x: 100, y: 40 }, 1)).toEqual({ x: 100, y: 40 });
  });

  test('tiltDeg = vx × 0.02, kẹp ±4°', () => {
    expect(tiltDeg(100)).toBeCloseTo(2, 9);
    expect(tiltDeg(10_000)).toBe(FEEDBACK_TOKENS.tiltMaxDeg);
    expect(tiltDeg(-10_000)).toBe(-FEEDBACK_TOKENS.tiltMaxDeg);
  });

  test('bounceScale 1.08 → 0.98 → 1', () => {
    expect(bounceScale(0)).toBeCloseTo(1.08, 9);
    expect(bounceScale(0.4)).toBeCloseTo(0.98, 9);
    expect(bounceScale(1)).toBe(1);
  });

  test('shakeOffset về 0 ở hai đầu, biên độ ≤ 6 px', () => {
    expect(shakeOffset(0)).toBe(0);
    expect(shakeOffset(1)).toBe(0);
    for (let t = 0; t <= 1; t += 0.01) expect(Math.abs(shakeOffset(t))).toBeLessThanOrEqual(6);
  });

  test('lightAlpha 0 → 1 → 0', () => {
    expect(lightAlpha(0)).toBe(0);
    expect(lightAlpha(0.5)).toBeCloseTo(1, 9);
    expect(lightAlpha(1)).toBe(0);
  });
});

describe('tư thế đích của mảnh', () => {
  const base = { layout, trayIndex: 0, trayCount: 2, selected: false, drag: null };

  test('khay: tâm ô khay, scale = bán kính khay / bán kính bàn', () => {
    const pose = pieceTargetPose(d1, { kind: 'tray', turns: 0 }, base);
    const hit = pieceHitbox(d1, { kind: 'tray', turns: 0 }, layout, 0, 2);
    expect(pose.x).toBe(hit.x + hit.width / 2);
    expect(pose.y).toBe(hit.y + hit.height / 2);
    expect(pose.scale).toBeCloseTo(52 / 120, 9);
    expect(pose.alpha).toBe(0.9);
  });

  test('snap: tâm khung tại neo, scale 1', () => {
    const anchor = d1.anchors[0];
    const pose = pieceTargetPose(d1, { kind: 'snapped', anchorId: anchor.id, turns: 0 }, base);
    expect({ x: pose.x, y: pose.y }).toEqual(pieceCenterCanvas(d1.frameSize, anchor.x, anchor.y, layout));
    expect(pose.scale).toBe(1);
    expect(pose.alpha).toBe(1);
  });

  test('tạm: alpha 0.6, chọn thì 0.85', () => {
    const state = { kind: 'temporary', x: 16, y: 56, turns: 0 } as const;
    expect(pieceTargetPose(d1, state, base).alpha).toBe(0.6);
    expect(pieceTargetPose(d1, state, { ...base, selected: true }).alpha).toBe(0.85);
  });

  test('đang kéo: bám pointer; có neo ứng viên thì bị hút 30% và alpha 1', () => {
    const tray = { kind: 'tray', turns: 0 } as const;
    const free = pieceTargetPose(d1, tray, { ...base, drag: { x: 300, y: 500, candidate: null } });
    expect(free).toMatchObject({ x: 300, y: 500, scale: 1, alpha: PIECE_TOKENS.ghostAlpha });
    const hooked = pieceTargetPose(d1, tray, { ...base, drag: { x: 300, y: 500, candidate: { x: 400, y: 500 } } });
    expect(hooked).toMatchObject({ x: 330, y: 500, alpha: 1 });
  });

  test('anchorCenter trả tâm khung của neo, neo lạ thì null', () => {
    const anchor = d1.anchors[0];
    expect(anchorCenter(d1, anchor.id, layout)).toEqual(pieceCenterCanvas(d1.frameSize, anchor.x, anchor.y, layout));
    expect(anchorCenter(d1, 'không-có', layout)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/pieceMotion.test.ts`
Expected: FAIL — không tìm thấy `pieceMotion.ts`.

- [ ] **Step 3: Thêm token**

Trong `designTokens.ts`, ngay sau `TRANSITION_TOKENS`:

```ts
/** Phản hồi từng thao tác trong màn chơi (spec F2 mục 3) */
export const FEEDBACK_TOKENS = {
  liftScale: 1.08,
  liftMs: 80,
  dropLiftMs: 120,
  tau: { follow: 35, scale: 45, tilt: 120, settle: 60, idle: 90, hint: 60, targetHover: 40 },
  tiltPerPxPerSec: 0.02,
  tiltMaxDeg: 4,
  magnetStrength: 0.3,
  targetIdleAlpha: 0.7,
  hintMs: 120,
  snapMs: 120,
  bounceMs: 180,
  bounceFrom: 1.08,
  bounceDip: 0.98,
  bounceDipAt: 0.4,
  snapRingMs: 240,
  snapRingRadiusRatio: 1.2,
  snapRingAlpha: 0.6,
  counterPopScale: 1.3,
  counterPopMs: 200,
  returnMs: 220,
  rotateMs: 160,
  rotateFromDeg: -90,
  shakeMs: 180,
  shakePx: 6,
  shakeCycles: 3,
  blockedFlashAlpha: 0.8,
  overlapFadeMs: 150,
  overlapTraceMs: 320,
  overlapTraceFraction: 0.25,
  reviveFlashMs: 200,
  resetStaggerMs: 40,
  resetMs: 260,
  resetOverlapFadeMs: 120,
  rotateButtonFadeMs: 150,
  shadowRest: { x: 4, y: 6 },
  shadowLifted: { x: 8, y: 12 },
  shadowAlpha: 0.45,
  previewAlpha: 0.5,
  reducedFadeMaxMs: 150,
} as const;

/** Chuỗi thắng (spec F2 mục 4; vòng cộng hưởng rút còn 600 ms để vừa 1800 ms) */
export const VICTORY_TOKENS = {
  totalMs: 1800,
  skyDimAtMs: 180,
  skyDimMs: 300,
  skyDimExtra: 0.1,
  lightsAtMs: 300,
  lightsEndMs: 900,
  lightGapMs: 90,
  lightMs: 260,
  lightPeak: 0.6,
  traceAtMs: 700,
  traceMs: 400,
  burstAtMs: 900,
  flashMs: 300,
  ringMs: 600,
  ringGapMs: 160,
  particles: 30,
  particleMs: 900,
  frameAtMs: 1000,
  frameMs: 400,
  trayFadeMs: 300,
  cardAtMs: 1200,
  cardMs: 600,
  cardSlidePx: 60,
  cardItemGapMs: 80,
  reducedMs: 150,
  unwindMs: 300,
} as const;
```

- [ ] **Step 4: Viết `pieceMotion.ts`**

`game-next/src/presentation/pieceMotion.ts`:

```ts
import type { Piece, PieceState } from '../domain/model.ts';
import { FEEDBACK_TOKENS, PIECE_TOKENS } from './designTokens.ts';
import type { LayoutMetrics } from './layout.ts';
import { pieceCenterCanvas, pieceHitbox, pieceRadiusPx, trayPieceRadiusPx } from './layout.ts';
import { EASES } from './transitions/motion.ts';

export type Pt = { x: number; y: number };

/** Tư thế hiển thị của một mảnh; tách khỏi trạng thái logic để nội suy được */
export type Pose = { x: number; y: number; scale: number; angle: number; alpha: number };

export type PoseTau = { position: number; scale: number; angle: number; alpha: number };

const T = FEEDBACK_TOKENS.tau;

export const POSE_TAU: Record<'dragging' | 'settling' | 'idle', PoseTau> = {
  dragging: { position: T.follow, scale: T.scale, angle: T.tilt, alpha: T.settle },
  settling: { position: T.settle, scale: T.scale, angle: T.tilt, alpha: T.settle },
  idle: { position: T.idle, scale: T.scale, angle: T.tilt, alpha: T.settle },
};

/**
 * Làm mượt theo hàm mũ: phần còn thiếu giảm theo exp(−dt/τ). Vì exp(a)·exp(b)
 * = exp(a+b), chia một bước thành nhiều bước nhỏ cho đúng cùng kết quả, nên
 * chuyển động không phụ thuộc FPS.
 */
export function stepScalar(current: number, target: number, dtMs: number, tauMs: number): number {
  if (tauMs <= 0) return target;
  return target + (current - target) * Math.exp(-dtMs / tauMs);
}

export function stepPose(current: Pose, target: Pose, dtMs: number, tau: PoseTau): Pose {
  return {
    x: stepScalar(current.x, target.x, dtMs, tau.position),
    y: stepScalar(current.y, target.y, dtMs, tau.position),
    scale: stepScalar(current.scale, target.scale, dtMs, tau.scale),
    angle: stepScalar(current.angle, target.angle, dtMs, tau.angle),
    alpha: stepScalar(current.alpha, target.alpha, dtMs, tau.alpha),
  };
}

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    scale: a.scale + (b.scale - a.scale) * k,
    angle: a.angle + (b.angle - a.angle) * k,
    alpha: a.alpha + (b.alpha - a.alpha) * k,
  };
}

/** Mảnh vào vùng hít bị kéo thêm `strength` phần quãng còn lại về tâm neo */
export function magnetPose(pointer: Pt, anchor: Pt, strength: number): Pt {
  return {
    x: pointer.x + (anchor.x - pointer.x) * strength,
    y: pointer.y + (anchor.y - pointer.y) * strength,
  };
}

export function tiltDeg(vxPxPerSec: number): number {
  const max = FEEDBACK_TOKENS.tiltMaxDeg;
  return Math.min(max, Math.max(-max, vxPxPerSec * FEEDBACK_TOKENS.tiltPerPxPerSec));
}

/** Nảy khi khớp: 1.08 xuống 0.98 ở 40% rồi về 1 */
export function bounceScale(t: number): number {
  const { bounceFrom, bounceDip, bounceDipAt } = FEEDBACK_TOKENS;
  if (t >= 1) return 1;
  if (t <= bounceDipAt) return bounceFrom + (bounceDip - bounceFrom) * EASES.cubicOut(t / bounceDipAt);
  return bounceDip + (1 - bounceDip) * EASES.cubicOut((t - bounceDipAt) / (1 - bounceDipAt));
}

/** Lắc ngang khi xoay bị chặn: 3 nhịp, tắt dần */
export function shakeOffset(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return FEEDBACK_TOKENS.shakePx * Math.sin(2 * Math.PI * FEEDBACK_TOKENS.shakeCycles * t) * (1 - t);
}

/** Chớp sáng: lên đỉnh ở giữa rồi tắt */
export function lightAlpha(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(Math.PI * t);
}

export type PoseInput = {
  layout: LayoutMetrics;
  trayIndex: number;
  trayCount: number;
  selected: boolean;
  /** Chỉ có khi chính mảnh này đang được kéo; toạ độ là tâm mảnh */
  drag: { x: number; y: number; candidate: Pt | null } | null;
};

export function anchorCenter(piece: Piece, anchorId: string, layout: LayoutMetrics): Pt | null {
  const anchor = piece.anchors.find((a) => a.id === anchorId);
  return anchor ? pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, layout) : null;
}

/** Tư thế mảnh cần đạt theo trạng thái logic; PieceView đuổi theo nó mỗi khung */
export function pieceTargetPose(piece: Piece, state: PieceState, input: PoseInput): Pose {
  const { layout } = input;
  if (input.drag) {
    const { x, y, candidate } = input.drag;
    const at = candidate ? magnetPose({ x, y }, candidate, FEEDBACK_TOKENS.magnetStrength) : { x, y };
    return { x: at.x, y: at.y, scale: 1, angle: 0, alpha: candidate ? 1 : PIECE_TOKENS.ghostAlpha };
  }
  if (state.kind === 'snapped') {
    const c = anchorCenter(piece, state.anchorId, layout) ?? anchorCenter(piece, piece.anchors[0].id, layout)!;
    return { x: c.x, y: c.y, scale: 1, angle: 0, alpha: 1 };
  }
  if (state.kind === 'temporary') {
    const c = pieceCenterCanvas(piece.frameSize, state.x, state.y, layout);
    return { x: c.x, y: c.y, scale: 1, angle: 0, alpha: input.selected ? 0.85 : 0.6 };
  }
  const hit = pieceHitbox(piece, state, layout, input.trayIndex, input.trayCount);
  return {
    x: hit.x + hit.width / 2,
    y: hit.y + hit.height / 2,
    scale: trayPieceRadiusPx(layout, input.trayCount) / pieceRadiusPx(piece.frameSize, layout),
    angle: 0,
    alpha: input.selected ? 1 : 0.9,
  };
}
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/pieceMotion.test.ts`
Expected: PASS.

- [ ] **Step 6: Changelog và commit**

```markdown
### 2026-10-03 - Add feedback tokens and piece pose math (F2 task 2)

- Added `FEEDBACK_TOKENS` and `VICTORY_TOKENS` (victory rings shortened to 600 ms so the sequence fits 1800 ms) and `game-next/src/presentation/pieceMotion.ts`: frame-rate-independent exponential smoothing, magnet, velocity tilt, bounce/shake/flash curves and the target pose of a piece for tray, snapped, temporary and dragging states.
- Verification: `tests/pieceMotion.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/designTokens.ts game-next/src/presentation/pieceMotion.ts game-next/tests/pieceMotion.test.ts CHANGELOG.md
git commit -m "feat(feel): add feedback tokens and piece pose math"
```

---

### Task 3: Sự kiện phản hồi và chênh lệch vùng giao

**Files:**
- Create: `game-next/src/presentation/feedback/parityDiff.ts`
- Create: `game-next/src/presentation/feedback/feedbackEvents.ts`
- Test: `game-next/tests/parityDiff.test.ts`, `game-next/tests/feedbackEvents.test.ts`

**Interfaces:**
- Consumes: `parityLayers`, `type ParityLayer`, `type Pt` (`polygonClip.ts`), `shapePolygon`, `effectiveOrientation` (`domain/shapes.ts`).
- Produces (`parityDiff.ts`):
  - `layerKey(layer: ParityLayer): string`
  - `diffLayers(prev, next): { kept: ParityLayer[]; added: ParityLayer[] }`
  - `overlapLayers(polygons: readonly (readonly Pt[])[]): ParityLayer[]` (chỉ lớp `depth ≥ 2`)
  - `perimeterSegment(points: readonly Pt[], startFrac: number, lengthFrac: number): Pt[]`
- Produces (`feedbackEvents.ts`):
  - `type FeedbackEvent` (spec F2 mục 2.4, `layers` là `Pt[][]` toạ độ lưới)
  - `type FeedbackSubject = { command: 'move' | 'rotate' | 'reset'; pieceId: string | null }`
  - `gridPolygon(piece, x, y, turns): Pt[]`
  - `snappedPolygons(level, state, excludeId?): Pt[][]`
  - `feedbackEvents(prev: PuzzleState, transition: Transition, level: Level, subject: FeedbackSubject): FeedbackEvent[]`

- [ ] **Step 1: Viết test thất bại cho `parityDiff`**

`game-next/tests/parityDiff.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { diffLayers, layerKey, overlapLayers, perimeterSegment } from '../src/presentation/feedback/parityDiff.ts';

const sq = (x: number, y: number, s: number) => [
  { x, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s },
];

describe('lớp giao', () => {
  test('overlapLayers bỏ lớp đơn, giữ lớp 2 và 3', () => {
    const layers = overlapLayers([sq(0, 0, 16), sq(8, 0, 16), sq(4, 0, 16)]);
    expect(layers.every((l) => l.depth >= 2)).toBe(true);
    expect(layers.some((l) => l.depth === 3 && l.filled)).toBe(true);
    expect(layers.some((l) => l.depth === 2 && !l.filled)).toBe(true);
  });

  test('khoá không phụ thuộc đỉnh bắt đầu', () => {
    const a = { points: sq(0, 0, 8), depth: 2, filled: false };
    const b = { points: [...sq(0, 0, 8).slice(2), ...sq(0, 0, 8).slice(0, 2)], depth: 2, filled: false };
    expect(layerKey(a)).toBe(layerKey(b));
    expect(layerKey({ ...a, depth: 3, filled: true })).not.toBe(layerKey(a));
  });

  test('diffLayers tách lớp giữ và lớp mới', () => {
    const before = overlapLayers([sq(0, 0, 16), sq(8, 0, 16)]);
    const after = overlapLayers([sq(0, 0, 16), sq(8, 0, 16), sq(4, 0, 16)]);
    const { kept, added } = diffLayers(before, after);
    expect(kept.map(layerKey)).toEqual(before.map(layerKey).filter((k) => after.map(layerKey).includes(k)));
    expect(added.length).toBe(after.length - kept.length);
    expect(added.some((l) => l.depth === 3)).toBe(true);
  });
});

describe('perimeterSegment', () => {
  const box = sq(0, 0, 10); // chu vi 40

  test('đoạn 25% từ đầu đi hết cạnh trên rồi xuống', () => {
    const seg = perimeterSegment(box, 0, 0.25);
    expect(seg[0]).toEqual({ x: 0, y: 0 });
    expect(seg[seg.length - 1]).toEqual({ x: 10, y: 0 });
  });

  test('đoạn vắt qua điểm đầu thì quấn vòng', () => {
    const seg = perimeterSegment(box, 0.9, 0.25);
    expect(seg[0]).toEqual({ x: 0, y: 4 });
    expect(seg[seg.length - 1]).toEqual({ x: 6, y: 0 });
  });

  test('độ dài 0 hoặc đa giác suy biến thì rỗng', () => {
    expect(perimeterSegment(box, 0.3, 0)).toEqual([]);
    expect(perimeterSegment([{ x: 0, y: 0 }], 0, 0.5)).toEqual([]);
  });
});
```

- [ ] **Step 2: Viết test thất bại cho `feedbackEvents`**

`game-next/tests/feedbackEvents.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type { Level, Piece, PuzzleState, Transition } from '../src/domain/model.ts';
import { feedbackEvents } from '../src/presentation/feedback/feedbackEvents.ts';

// Ba hình vuông khung 16; neo A (0,0), B (8,0), C (4,0) cho giao 2 và 3 lớp
const square = (id: string, x: number): Piece => ({
  id, frameSize: 16, cells: [], color: 'amber', shapeKind: 'square', orientation: 0,
  anchors: [{ id: 'A', x, y: 0 }],
});
const level: Level = {
  id: 'test', title: 'Thử', chapter: 1, contentRevision: 't', rotationEnabled: true,
  pieces: [square('P1', 0), square('P2', 8), square('P3', 4)],
  targetMask: new Uint8Array(0),
};
const tray = { kind: 'tray', turns: 0 } as const;
const snapped = { kind: 'snapped', anchorId: 'A', turns: 0 } as const;
const state = (pieces: PuzzleState['pieces'], phase: PuzzleState['phase'] = 'playing'): PuzzleState =>
  ({ levelId: 'test', phase, pieces });
const transition = (next: PuzzleState, extra: Partial<Transition> = {}): Transition => ({
  accepted: true, outcome: 'snapped', state: next, mask: new Uint8Array(0), changed: [], becameWon: false, ...extra,
});

describe('feedbackEvents', () => {
  const empty = state({ P1: tray, P2: tray, P3: tray });

  test('snap đơn lẻ: chỉ có snap', () => {
    const next = state({ P1: snapped, P2: tray, P3: tray });
    expect(feedbackEvents(empty, transition(next), level, { command: 'move', pieceId: 'P1' }))
      .toEqual([{ type: 'snap', pieceId: 'P1', anchorId: 'A' }]);
  });

  test('thả tạm và về khay', () => {
    const temp = state({ P1: { kind: 'temporary', x: 40, y: 40, turns: 0 }, P2: tray, P3: tray });
    expect(feedbackEvents(empty, transition(temp, { outcome: 'temporary' }), level, { command: 'move', pieceId: 'P1' }))
      .toEqual([{ type: 'settle-temporary', pieceId: 'P1' }]);
    expect(feedbackEvents(temp, transition(empty, { outcome: 'tray' }), level, { command: 'move', pieceId: 'P1' }))
      .toEqual([{ type: 'return', pieceId: 'P1' }]);
  });

  test('giao 2 lớp sinh overlap-hollow', () => {
    const one = state({ P1: snapped, P2: tray, P3: tray });
    const two = state({ P1: snapped, P2: snapped, P3: tray });
    const events = feedbackEvents(one, transition(two), level, { command: 'move', pieceId: 'P2' });
    expect(events[0]).toEqual({ type: 'snap', pieceId: 'P2', anchorId: 'A' });
    expect(events[1].type).toBe('overlap-hollow');
    expect(events).toHaveLength(2);
  });

  test('giao 3 lớp sinh overlap-revive', () => {
    const two = state({ P1: snapped, P2: snapped, P3: tray });
    const three = state({ P1: snapped, P2: snapped, P3: snapped });
    const types = feedbackEvents(two, transition(three), level, { command: 'move', pieceId: 'P3' }).map((e) => e.type);
    expect(types).toContain('overlap-revive');
    expect(types).toContain('overlap-hollow');
  });

  test('xoay được và xoay bị chặn', () => {
    const turned = state({ P1: { ...snapped, turns: 1 }, P2: tray, P3: tray });
    const before = state({ P1: snapped, P2: tray, P3: tray });
    expect(feedbackEvents(before, transition(turned, { outcome: 'rotated' }), level, { command: 'rotate', pieceId: 'P1' }))
      .toEqual([{ type: 'rotate', pieceId: 'P1', turns: 1 }]);
    const rejected = transition(before, { accepted: false, outcome: 'out-of-bounds' });
    expect(feedbackEvents(before, rejected, level, { command: 'rotate', pieceId: 'P1' }))
      .toEqual([{ type: 'rotate-blocked', pieceId: 'P1' }]);
  });

  test('từ chối khác không sinh gì; đặt lại sinh reset', () => {
    expect(feedbackEvents(empty, transition(empty, { accepted: false, outcome: 'rotation-disabled' }), level,
      { command: 'rotate', pieceId: 'P1' })).toEqual([]);
    expect(feedbackEvents(empty, transition(empty, { outcome: 'reset' }), level, { command: 'reset', pieceId: null }))
      .toEqual([{ type: 'reset' }]);
  });

  test('mảnh cuối: snap rồi won', () => {
    const next = state({ P1: snapped, P2: tray, P3: tray }, 'won');
    const types = feedbackEvents(empty, transition(next, { outcome: 'won', becameWon: true }), level,
      { command: 'move', pieceId: 'P1' }).map((e) => e.type);
    expect(types).toEqual(['snap', 'won']);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/parityDiff.test.ts tests/feedbackEvents.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 4: Viết `parityDiff.ts`**

`game-next/src/presentation/feedback/parityDiff.ts`:

```ts
import { parityLayers } from '../polygonClip.ts';
import type { ParityLayer, Pt } from '../polygonClip.ts';

const round = (v: number): number => Math.round(v * 1000) / 1000;

/** Khoá ổn định của một lớp: độ sâu + tập đỉnh (không phụ thuộc đỉnh bắt đầu) */
export function layerKey(layer: ParityLayer): string {
  const points = layer.points.map((p) => `${round(p.x)},${round(p.y)}`).sort().join(';');
  return `${layer.depth}|${points}`;
}

export function diffLayers(
  prev: readonly ParityLayer[],
  next: readonly ParityLayer[]
): { kept: ParityLayer[]; added: ParityLayer[] } {
  const before = new Set(prev.map(layerKey));
  const kept: ParityLayer[] = [];
  const added: ParityLayer[] = [];
  for (const layer of next) (before.has(layerKey(layer)) ? kept : added).push(layer);
  return { kept, added };
}

/** Chỉ vùng giao (≥ 2 lớp); lớp đơn đã là chính mảnh */
export function overlapLayers(polygons: readonly (readonly Pt[])[]): ParityLayer[] {
  return parityLayers(polygons).filter((layer) => layer.depth >= 2);
}

/**
 * Đoạn đường gấp trên chu vi, bắt đầu ở `startFrac` chu vi, dài `lengthFrac`
 * chu vi, quấn qua điểm đầu. Dùng cho vệt sáng chạy dọc mép vùng giao.
 */
export function perimeterSegment(points: readonly Pt[], startFrac: number, lengthFrac: number): Pt[] {
  const n = points.length;
  if (n < 2 || lengthFrac <= 0) return [];
  const lens = points.map((a, i) => {
    const b = points[(i + 1) % n];
    return Math.hypot(b.x - a.x, b.y - a.y);
  });
  const total = lens.reduce((sum, l) => sum + l, 0);
  if (total === 0) return [];

  const along = (i: number, d: number): Pt => {
    const a = points[i];
    const b = points[(i + 1) % n];
    const k = lens[i] === 0 ? 0 : d / lens[i];
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  };

  const startDist = (((startFrac % 1) + 1) % 1) * total;
  let edge = 0;
  let acc = 0;
  while (edge < n - 1 && acc + lens[edge] < startDist) {
    acc += lens[edge];
    edge++;
  }
  let pos = startDist - acc;
  let remaining = Math.min(1, lengthFrac) * total;
  const out: Pt[] = [along(edge, pos)];
  while (remaining > 1e-9) {
    const room = lens[edge] - pos;
    if (remaining <= room) {
      out.push(along(edge, pos + remaining));
      break;
    }
    remaining -= room;
    edge = (edge + 1) % n;
    pos = 0;
    out.push({ ...points[edge] });
  }
  return out;
}
```

- [ ] **Step 5: Viết `feedbackEvents.ts`**

`game-next/src/presentation/feedback/feedbackEvents.ts`:

```ts
import type { Level, Piece, PuzzleState, Transition, Turns } from '../../domain/model.ts';
import { effectiveOrientation, shapePolygon } from '../../domain/shapes.ts';
import type { Pt } from '../polygonClip.ts';
import { diffLayers, overlapLayers } from './parityDiff.ts';

export type FeedbackEvent =
  | { type: 'lift'; pieceId: string }
  | { type: 'snap'; pieceId: string; anchorId: string }
  | { type: 'settle-temporary'; pieceId: string }
  | { type: 'return'; pieceId: string }
  | { type: 'rotate'; pieceId: string; turns: Turns }
  | { type: 'rotate-blocked'; pieceId: string }
  /** Vùng chẵn mới xuất hiện (toạ độ lưới) */
  | { type: 'overlap-hollow'; layers: Pt[][] }
  /** Vùng lẻ ≥ 3 lớp mới xuất hiện (toạ độ lưới) */
  | { type: 'overlap-revive'; layers: Pt[][] }
  | { type: 'reset' }
  | { type: 'won' };

/** Lệnh người chơi vừa làm; cần vì lệnh bị từ chối không mang id mảnh */
export type FeedbackSubject = { command: 'move' | 'rotate' | 'reset'; pieceId: string | null };

export function gridPolygon(piece: Piece, x: number, y: number, turns: number): Pt[] {
  const kind = piece.shapeKind ?? 'diamond';
  const orientation = effectiveOrientation(kind, piece.orientation ?? 0, turns);
  return shapePolygon(kind, orientation, piece.frameSize).map((v) => ({ x: x + v.x, y: y + v.y }));
}

export function snappedPolygons(level: Level, state: PuzzleState, excludeId?: string): Pt[][] {
  return level.pieces.flatMap((piece) => {
    const s = state.pieces[piece.id];
    if (!s || s.kind !== 'snapped' || piece.id === excludeId) return [];
    const anchor = piece.anchors.find((a) => a.id === s.anchorId);
    return anchor ? [gridPolygon(piece, anchor.x, anchor.y, s.turns)] : [];
  });
}

export function feedbackEvents(
  prev: PuzzleState,
  transition: Transition,
  level: Level,
  subject: FeedbackSubject
): FeedbackEvent[] {
  if (subject.command === 'reset') return transition.accepted ? [{ type: 'reset' }] : [];
  const pieceId = subject.pieceId;
  if (!pieceId) return [];
  if (!transition.accepted) {
    return subject.command === 'rotate' && transition.outcome === 'out-of-bounds'
      ? [{ type: 'rotate-blocked', pieceId }]
      : [];
  }

  const next = transition.state.pieces[pieceId];
  if (!next) return [];
  const events: FeedbackEvent[] = [];
  if (subject.command === 'rotate') events.push({ type: 'rotate', pieceId, turns: next.turns });
  else if (next.kind === 'snapped') events.push({ type: 'snap', pieceId, anchorId: next.anchorId });
  else if (next.kind === 'temporary') events.push({ type: 'settle-temporary', pieceId });
  else events.push({ type: 'return', pieceId });

  const { added } = diffLayers(
    overlapLayers(snappedPolygons(level, prev)),
    overlapLayers(snappedPolygons(level, transition.state))
  );
  const hollow = added.filter((l) => !l.filled).map((l) => l.points.map((p) => ({ x: p.x, y: p.y })));
  const revive = added.filter((l) => l.filled).map((l) => l.points.map((p) => ({ x: p.x, y: p.y })));
  if (hollow.length > 0) events.push({ type: 'overlap-hollow', layers: hollow });
  if (revive.length > 0) events.push({ type: 'overlap-revive', layers: revive });

  if (transition.becameWon) events.push({ type: 'won' });
  return events;
}
```

- [ ] **Step 6: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/parityDiff.test.ts tests/feedbackEvents.test.ts`
Expected: PASS. Test quấn vòng kỳ vọng đúng `[(0,4), (0,0), (6,0)]`.

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Derive feedback events from transitions (F2 task 3)

- Added `game-next/src/presentation/feedback/parityDiff.ts` (stable layer keys, kept/added overlap layers, perimeter segments for edge traces) and `feedbackEvents.ts`, which turns a `Transition` plus the player command into snap, settle, return, rotate, blocked-rotation, overlap-hollow, overlap-revive, reset and won events. The command parameter is needed because a rejected rotation carries no piece id.
- Verification: `tests/parityDiff.test.ts` and `tests/feedbackEvents.test.ts` failed for the missing modules, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/feedback game-next/tests/parityDiff.test.ts game-next/tests/feedbackEvents.test.ts CHANGELOG.md
git commit -m "feat(feel): derive feedback events and overlap diffs"
```

---

### Task 4: Rung phản hồi

**Files:**
- Modify: `game-next/package.json`, `game-next/package-lock.json` (thêm `@capacitor/haptics` 8.0.2)
- Create: `game-next/src/infrastructure/haptics.ts`, `game-next/src/infrastructure/capacitorHaptics.ts`
- Create: `game-next/src/presentation/feedback/hapticCues.ts`
- Modify: `game-next/src/application/progressPort.ts`, `game-next/src/infrastructure/progressRepository.ts`, `game-next/src/presentation/SettingsDialog.ts`
- Test: `game-next/tests/haptics.test.ts`, `game-next/tests/progress.test.ts` (thêm `describe`)

**Interfaces:**
- Produces:
  - `type HapticsDriver = { impact(style: ImpactLevel): Promise<void>; notification(kind: NotifyKind): Promise<void> }`
  - `type ImpactLevel = 'light' | 'medium' | 'heavy'`, `type NotifyKind = 'success' | 'warning'`
  - `interface HapticsPort { impact(style: ImpactLevel): void; notify(kind: NotifyKind): void }`
  - `createHaptics(driver: HapticsDriver | null, isEnabled: () => boolean): HapticsPort`
  - `capacitorHapticsDriver(): HapticsDriver`
  - `type HapticCue = { kind: 'impact'; style: ImpactLevel } | { kind: 'notify'; type: NotifyKind }`
  - `HAPTIC_CUES: Partial<Record<FeedbackEvent['type'], HapticCue>>`, `playCue(port, cue)`
  - `Progress.settings.haptics: boolean`, `ProgressRepository.setHaptics(on: boolean): LoadResult`

- [ ] **Step 1: Cài dependency**

Run: `npm install @capacitor/haptics@8.0.2 --save-exact`
Expected: `package.json` có `"@capacitor/haptics": "8.0.2"` trong `dependencies` (peer `@capacitor/core >=8.0.0`, khớp 8.5.2; `npm view @capacitor/haptics@8 peerDependencies` đã kiểm ngày 2026-10-03).

- [ ] **Step 2: Viết test thất bại**

`game-next/tests/haptics.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createHaptics } from '../src/infrastructure/haptics.ts';
import type { HapticsDriver } from '../src/infrastructure/haptics.ts';
import { HAPTIC_CUES, playCue } from '../src/presentation/feedback/hapticCues.ts';

function fakeDriver(fail: 'none' | 'throw' | 'reject' = 'none') {
  const calls: string[] = [];
  const driver: HapticsDriver = {
    impact: (style) => {
      calls.push(`impact:${style}`);
      if (fail === 'throw') throw new Error('boom');
      return fail === 'reject' ? Promise.reject(new Error('no')) : Promise.resolve();
    },
    notification: (kind) => {
      calls.push(`notify:${kind}`);
      return Promise.resolve();
    },
  };
  return { driver, calls };
}

describe('HapticsPort', () => {
  test('gọi driver khi bật', () => {
    const { driver, calls } = fakeDriver();
    const port = createHaptics(driver, () => true);
    port.impact('medium');
    port.notify('success');
    expect(calls).toEqual(['impact:medium', 'notify:success']);
  });

  test('tắt thì không gọi lần nào', () => {
    const { driver, calls } = fakeDriver();
    const port = createHaptics(driver, () => false);
    port.impact('light');
    port.notify('warning');
    expect(calls).toEqual([]);
  });

  test('không có driver (web) thì không làm gì', () => {
    expect(() => createHaptics(null, () => true).impact('heavy')).not.toThrow();
  });

  test('driver ném lỗi hoặc reject thì lỗi bị nuốt', async () => {
    expect(() => createHaptics(fakeDriver('throw').driver, () => true).impact('light')).not.toThrow();
    createHaptics(fakeDriver('reject').driver, () => true).impact('light');
    await new Promise((r) => setTimeout(r, 0)); // không có unhandled rejection làm vỡ test
  });
});

describe('bảng rung theo sự kiện (spec F2 mục 3)', () => {
  test('ánh xạ đúng', () => {
    expect(HAPTIC_CUES).toEqual({
      lift: { kind: 'impact', style: 'light' },
      snap: { kind: 'impact', style: 'medium' },
      'settle-temporary': { kind: 'impact', style: 'light' },
      rotate: { kind: 'impact', style: 'light' },
      'rotate-blocked': { kind: 'notify', type: 'warning' },
      reset: { kind: 'impact', style: 'light' },
    });
  });

  test('playCue chuyển đúng lời gọi', () => {
    const { driver, calls } = fakeDriver();
    const port = createHaptics(driver, () => true);
    playCue(port, HAPTIC_CUES['rotate-blocked']);
    playCue(port, undefined);
    expect(calls).toEqual(['notify:warning']);
  });
});
```

Thêm vào cuối `tests/progress.test.ts`:

```ts
describe('Cài đặt Rung phản hồi', () => {
  test('mặc định bật, bản lưu cũ thiếu trường đọc là true', () => {
    const repo = createProgressRepository(createMockStorage(), campaignManifest, 'oracle-v1');
    expect(repo.read().progress.settings.haptics).toBe(true);
    const legacy = JSON.stringify({
      version: 1, campaignRevision: 'oracle-v1', completed: [], settings: { showTarget: true, reducedMotion: false },
    });
    const old = createProgressRepository(createMockStorage({ 'mirror.rebuild.progress.v1': legacy }), campaignManifest, 'oracle-v1');
    expect(old.read().progress.settings.haptics).toBe(true);
    expect(old.read().recovered).toBe(false);
  });

  test('setHaptics lưu và giữ các cài đặt khác', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    repo.setReducedMotion(true);
    repo.setHaptics(false);
    expect(createProgressRepository(storage, campaignManifest, 'oracle-v1').read().progress.settings)
      .toEqual({ showTarget: true, reducedMotion: true, haptics: false });
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/haptics.test.ts tests/progress.test.ts`
Expected: FAIL — thiếu module, `settings.haptics` là `undefined`, `repo.setHaptics is not a function`.

- [ ] **Step 4: Viết `haptics.ts` (thuần)**

`game-next/src/infrastructure/haptics.ts`:

```ts
export type ImpactLevel = 'light' | 'medium' | 'heavy';
export type NotifyKind = 'success' | 'warning';

export type HapticsDriver = {
  impact(style: ImpactLevel): Promise<void>;
  notification(kind: NotifyKind): Promise<void>;
};

export interface HapticsPort {
  impact(style: ImpactLevel): void;
  notify(kind: NotifyKind): void;
}

/** Rung là trang trí: mọi lỗi (thiếu plugin, máy không hỗ trợ) bị nuốt im lặng. */
function safely(run: () => Promise<void>): void {
  try {
    run().catch(() => {});
  } catch {
    // driver ném đồng bộ
  }
}

export function createHaptics(driver: HapticsDriver | null, isEnabled: () => boolean): HapticsPort {
  return {
    impact(style) {
      if (driver && isEnabled()) safely(() => driver.impact(style));
    },
    notify(kind) {
      if (driver && isEnabled()) safely(() => driver.notification(kind));
    },
  };
}
```

`game-next/src/infrastructure/capacitorHaptics.ts` (không test, chỉ chạy trên máy):

```ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { HapticsDriver } from './haptics.ts';

const IMPACT = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy } as const;
const NOTIFY = { success: NotificationType.Success, warning: NotificationType.Warning } as const;

export function capacitorHapticsDriver(): HapticsDriver {
  return {
    impact: (style) => Haptics.impact({ style: IMPACT[style] }),
    notification: (kind) => Haptics.notification({ type: NOTIFY[kind] }),
  };
}
```

`game-next/src/presentation/feedback/hapticCues.ts`:

```ts
import type { HapticsPort, ImpactLevel, NotifyKind } from '../../infrastructure/haptics.ts';
import type { FeedbackEvent } from './feedbackEvents.ts';

export type HapticCue = { kind: 'impact'; style: ImpactLevel } | { kind: 'notify'; type: NotifyKind };

/** `won` không có ở đây: chuỗi thắng rung `success` ở mốc 900 ms */
export const HAPTIC_CUES: Partial<Record<FeedbackEvent['type'], HapticCue>> = {
  lift: { kind: 'impact', style: 'light' },
  snap: { kind: 'impact', style: 'medium' },
  'settle-temporary': { kind: 'impact', style: 'light' },
  rotate: { kind: 'impact', style: 'light' },
  'rotate-blocked': { kind: 'notify', type: 'warning' },
  reset: { kind: 'impact', style: 'light' },
};

export function playCue(port: HapticsPort, cue: HapticCue | undefined): void {
  if (!cue) return;
  if (cue.kind === 'impact') port.impact(cue.style);
  else port.notify(cue.type);
}
```

- [ ] **Step 5: `settings.haptics`**

`progressPort.ts`: `settings` thêm `haptics: boolean;`; interface thêm `setHaptics(on: boolean): LoadResult;`.

`progressRepository.ts`:
1. `defaultProgress()`: `settings: { showTarget: true, reducedMotion: false, haptics: true },`
2. Sau khối `reducedMotion` (F1 Task 4):

```ts
      const haptics =
        parsed.settings && typeof parsed.settings.haptics === 'boolean'
          ? parsed.settings.haptics
          : true;
```

   và `settings: { showTarget, reducedMotion, haptics },`.
3. Sau `setReducedMotion`:

```ts
    setHaptics(on: boolean): LoadResult {
      const current = readFromStorage().progress;
      return saveToStorage({ ...current, settings: { ...current.settings, haptics: on } });
    },
```

- [ ] **Step 6: Nút trong `SettingsDialog`**

Import `import { Capacitor } from '@capacitor/core';`. Thay khối "Toggle 3":

```ts
    // Toggle 3: Rung phản hồi — Android WebView không đáng tin ở navigator.vibrate,
    // nên hiện khi chạy native (plugin Haptics) hoặc trình duyệt có vibrate
    const canVibrate =
      Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && 'vibrate' in navigator);
    if (canVibrate) {
      this.createToggleRow(
        -modalH / 2 + 240,
        'Rung phản hồi',
        this.progressRepo.read().progress.settings.haptics,
        (on) => {
          this.progressRepo.setHaptics(on);
        }
      );
    }
```

- [ ] **Step 7: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/haptics.test.ts tests/progress.test.ts && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 8: Changelog và commit**

```markdown
### 2026-10-03 - Add haptics port and persisted setting (F2 task 4)

- Added `@capacitor/haptics` 8.0.2 (peer `@capacitor/core >=8.0.0`), a pure `HapticsPort` that swallows driver errors and respects the setting, a Capacitor driver, and the event-to-cue table from spec F2 section 3.
- Added `settings.haptics` (default `true`, legacy saves read as `true`) with `setHaptics`; the "Rung phản hồi" toggle now persists and appears on native platforms or browsers with `navigator.vibrate`.
- Verification: `tests/haptics.test.ts` and two progress tests failed before the change, then passed; `npm run typecheck` and `npm test` passed. Native sync (`npm run android:sync`) is exercised in plan F3.
```

```bash
git add game-next/package.json game-next/package-lock.json game-next/src/infrastructure game-next/src/presentation/feedback/hapticCues.ts game-next/src/application/progressPort.ts game-next/src/presentation/SettingsDialog.ts game-next/tests/haptics.test.ts game-next/tests/progress.test.ts CHANGELOG.md
git commit -m "feat(feel): add haptics port and persisted haptics setting"
```

---

### Task 5: Texture mảnh và ngân sách bộ nhớ

**Files:**
- Create: `game-next/src/presentation/PieceTextureCache.ts`
- Test: `game-next/tests/pieceTextureCache.test.ts`

**Interfaces:**
- Consumes: `drawJewelPolygon` (`JewelShape.ts`), `piecePolygonAround` (`layout.ts`).
- Produces:
  - `TEXTURE_PAD_RATIO = 0.25`, `SILHOUETTE_SCALE = 0.5`, `TEXTURE_BUDGET_BYTES = 24 * 1024 * 1024`
  - `bodyTextureSize(frameSize, cellPixel, resolution): number`
  - `pieceTurnBytes(frameSize, cellPixel, resolution): number`
  - `levelTextureBytes(level, cellPixel, resolution): number` (xấu nhất: 4 hướng nếu xoay được)
  - `chooseResolution(level, cellPixel): 1 | 0.75`
  - `type PieceTextureKeys = { body: string; shadow: string; light: string; resolution: number }`
  - `interface PieceTextureSource { keys(pieceId, turns): PieceTextureKeys | null; ensure(pieceId, turns): PieceTextureKeys }`
  - `class PieceTextureCache implements PieceTextureSource`: `enqueue(pieceId, turns)`, `bakeNext(): boolean`, `bytesBaked(): number`, `destroy()`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/pieceTextureCache.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { loadLevel } from '../src/content/catalog.ts';
import type { Level } from '../src/domain/model.ts';
import {
  PieceTextureCache,
  TEXTURE_BUDGET_BYTES,
  bodyTextureSize,
  chooseResolution,
  levelTextureBytes,
  pieceTurnBytes,
} from '../src/presentation/PieceTextureCache.ts';
import { createFakeScene } from './helpers/fakeScene.ts';

vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} } } }));

const MiB = 1024 * 1024;

describe('kích thước và bộ nhớ texture', () => {
  test('khung 48 ô ở 5 px: body 360 px, một (mảnh × hướng) 777 600 B', () => {
    expect(bodyTextureSize(48, 5, 1)).toBe(360);
    expect(pieceTurnBytes(48, 5, 1)).toBe(360 * 360 * 4 + 2 * 180 * 180 * 4);
  });

  test.each(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'])('%s dưới ngưỡng 24 MiB ở độ phân giải 1', (id) => {
    const level = loadLevel(id, 'harness');
    const bytes = levelTextureBytes(level, 5, 1);
    expect(bytes).toBe(level.pieces.length * 777_600);
    expect(bytes).toBeLessThan(TEXTURE_BUDGET_BYTES);
    expect(chooseResolution(level, 5)).toBe(1);
  });

  test('màn giả định 6 mảnh khung 64 xoay được: hạ về 0,75 và vừa ngân sách', () => {
    const base = loadLevel('1-1', 'harness');
    const heavy: Level = {
      ...base,
      rotationEnabled: true,
      pieces: Array.from({ length: 6 }, (_, i) => ({ ...base.pieces[0], id: `H${i}`, frameSize: 64 })),
    };
    expect(levelTextureBytes(heavy, 5, 1) / MiB).toBeGreaterThan(24);
    expect(chooseResolution(heavy, 5)).toBe(0.75);
    expect(levelTextureBytes(heavy, 5, 0.75)).toBeLessThanOrEqual(TEXTURE_BUDGET_BYTES);
  });
});

describe('PieceTextureCache vẽ rải', () => {
  test('mỗi bakeNext vẽ đúng một (mảnh × hướng); keys có sau khi vẽ', () => {
    const { scene, calls } = createFakeScene();
    const level = loadLevel('1-4', 'harness');
    const cache = new PieceTextureCache(scene as Phaser.Scene, level, 5);
    level.pieces.forEach((p) => cache.enqueue(p.id, 0));
    expect(cache.keys(level.pieces[0].id, 0)).toBeNull();
    expect(cache.bakeNext()).toBe(true);
    expect(cache.keys(level.pieces[0].id, 0)).not.toBeNull();
    expect(cache.keys(level.pieces[1].id, 0)).toBeNull();
    expect(calls.filter((c) => c.method === 'generateTexture')).toHaveLength(3); // body, shadow, light
    cache.bakeNext();
    cache.bakeNext();
    expect(cache.bakeNext()).toBe(false);
    expect(cache.bytesBaked()).toBe(3 * 777_600);
  });

  test('ensure vẽ đồng bộ hướng chưa có và không vẽ lại lần hai', () => {
    const { scene, calls } = createFakeScene();
    const level = loadLevel('1-1', 'harness');
    const cache = new PieceTextureCache(scene as Phaser.Scene, level, 5);
    const keys = cache.ensure(level.pieces[0].id, 2);
    expect(keys.body).toBe(`piece:1-1:${level.pieces[0].id}:2:body`);
    cache.ensure(level.pieces[0].id, 2);
    expect(calls.filter((c) => c.method === 'generateTexture')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Viết scene giả dùng chung**

`game-next/tests/helpers/fakeScene.ts`:

```ts
import type Phaser from 'phaser';

export type FakeCall = {
  owner: number;
  kind: string;
  method: string;
  args: unknown[];
  depth: number;
  color: number | null;
};

export type FakeObject = Record<string, unknown> & { __id: number; __kind: string; __depth: number };

/**
 * Scene giả: mọi GameObject là Proxy ghi lại lời gọi kèm depth và màu tô hiện
 * tại. Thuộc tính số (x, y, alpha, scale…) đọc/ghi như object thường.
 */
export function createFakeScene() {
  const calls: FakeCall[] = [];
  const objects: FakeObject[] = [];
  let nextId = 0;

  const make = (kind: string): FakeObject => {
    const store: Record<string, unknown> = {
      __id: nextId++, __kind: kind, __depth: 0, __color: null,
      x: 0, y: 0, alpha: 1, scaleX: 1, scaleY: 1, angle: 0, visible: true,
    };
    const proxy: FakeObject = new Proxy(store, {
      get(target, prop: string | symbol) {
        if (typeof prop === 'symbol') return undefined;
        if (prop in target) return target[prop];
        return (...args: unknown[]) => {
          if (prop === 'setDepth') target.__depth = args[0];
          if (prop === 'fillStyle') target.__color = args[0];
          if (prop === 'setAlpha') target.alpha = args[0];
          if (prop === 'setVisible') target.visible = args[0];
          if (prop === 'setPosition') {
            target.x = args[0];
            target.y = args[1] ?? args[0];
          }
          calls.push({
            owner: target.__id as number, kind, method: prop, args,
            depth: target.__depth as number, color: target.__color as number | null,
          });
          return proxy;
        };
      },
      set(target, prop: string, value) {
        target[prop] = value;
        return true;
      },
    }) as FakeObject;
    objects.push(proxy);
    return proxy;
  };

  const scene = {
    add: {
      graphics: () => make('graphics'),
      image: () => make('image'),
      container: () => make('container'),
      circle: () => make('circle'),
    },
    make: { graphics: () => make('graphics') },
    textures: { exists: () => false, remove: () => {} },
  } as unknown as Phaser.Scene;

  return { scene, calls, objects };
}

/** Nguồn texture giả luôn sẵn sàng, cho test renderer */
export const readyTextures = {
  keys: (pieceId: string, turns: number) => ({
    body: `b:${pieceId}:${turns}`, shadow: `s:${pieceId}:${turns}`, light: `l:${pieceId}:${turns}`, resolution: 1,
  }),
  ensure: (pieceId: string, turns: number) => readyTextures.keys(pieceId, turns),
};
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/pieceTextureCache.test.ts`
Expected: FAIL — không tìm thấy `PieceTextureCache.ts`.

- [ ] **Step 4: Viết `PieceTextureCache.ts`**

`game-next/src/presentation/PieceTextureCache.ts`:

```ts
import type Phaser from 'phaser';
import type { Level, Piece } from '../domain/model.ts';
import { drawJewelPolygon } from './JewelShape.ts';
import { piecePolygonAround } from './layout.ts';

/** Lề mỗi phía so với cạnh khung: hào quang tam giác tràn ~0.165 cạnh */
export const TEXTURE_PAD_RATIO = 0.25;
/** Bóng đổ và chớp sáng vẽ ở nửa độ phân giải: chúng vốn mềm */
export const SILHOUETTE_SCALE = 0.5;
/** Ngưỡng F3 P-06 */
export const TEXTURE_BUDGET_BYTES = 24 * 1024 * 1024;

export type PieceTextureKeys = { body: string; shadow: string; light: string; resolution: number };

export interface PieceTextureSource {
  keys(pieceId: string, turns: number): PieceTextureKeys | null;
  ensure(pieceId: string, turns: number): PieceTextureKeys;
}

export function bodyTextureSize(frameSize: number, cellPixel: number, resolution: number): number {
  return Math.ceil(frameSize * cellPixel * (1 + 2 * TEXTURE_PAD_RATIO) * resolution);
}

function silhouetteSize(body: number): number {
  return Math.ceil(body * SILHOUETTE_SCALE);
}

export function pieceTurnBytes(frameSize: number, cellPixel: number, resolution: number): number {
  const body = bodyTextureSize(frameSize, cellPixel, resolution);
  const sil = silhouetteSize(body);
  return 4 * (body * body + 2 * sil * sil);
}

/** Ước tính xấu nhất của màn: xoay được thì đủ 4 hướng mỗi mảnh */
export function levelTextureBytes(level: Level, cellPixel: number, resolution: number): number {
  const turns = level.rotationEnabled ? 4 : 1;
  return level.pieces.reduce((sum, p) => sum + turns * pieceTurnBytes(p.frameSize, cellPixel, resolution), 0);
}

export function chooseResolution(level: Level, cellPixel: number): 1 | 0.75 {
  return levelTextureBytes(level, cellPixel, 1) <= TEXTURE_BUDGET_BYTES ? 1 : 0.75;
}

/**
 * Vẽ mỗi (mảnh × hướng) một lần thành ba texture: thân ngọc, bóng đen, chớp
 * trắng. `bakeNext` vẽ một mảnh mỗi khung để không có khung nào quá 50 ms
 * (F3 P-04); `ensure` vẽ đồng bộ khi cần ngay (xoay tới hướng mới).
 */
export class PieceTextureCache implements PieceTextureSource {
  private readonly scene: Phaser.Scene;
  private readonly level: Level;
  private readonly cellPixel: number;
  private readonly resolution: 1 | 0.75;
  private readonly baked = new Map<string, PieceTextureKeys>();
  private readonly queue: Array<{ pieceId: string; turns: number }> = [];
  private bytes = 0;

  constructor(scene: Phaser.Scene, level: Level, cellPixel: number) {
    this.scene = scene;
    this.level = level;
    this.cellPixel = cellPixel;
    this.resolution = chooseResolution(level, cellPixel);
  }

  enqueue(pieceId: string, turns: number): void {
    const t = ((turns % 4) + 4) % 4;
    if (this.baked.has(this.id(pieceId, t))) return;
    if (this.queue.some((q) => q.pieceId === pieceId && q.turns === t)) return;
    this.queue.push({ pieceId, turns: t });
  }

  bakeNext(): boolean {
    const next = this.queue.shift();
    if (!next) return false;
    this.ensure(next.pieceId, next.turns);
    return true;
  }

  keys(pieceId: string, turns: number): PieceTextureKeys | null {
    return this.baked.get(this.id(pieceId, turns)) ?? null;
  }

  ensure(pieceId: string, turns: number): PieceTextureKeys {
    const existing = this.keys(pieceId, turns);
    if (existing) return existing;
    const piece = this.level.pieces.find((p) => p.id === pieceId);
    if (!piece) throw new Error(`unknown-piece:${pieceId}`);
    const keys = this.bake(piece, turns);
    this.baked.set(this.id(pieceId, turns), keys);
    return keys;
  }

  bytesBaked(): number {
    return this.bytes;
  }

  destroy(): void {
    for (const keys of this.baked.values()) {
      for (const key of [keys.body, keys.shadow, keys.light]) {
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      }
    }
    this.baked.clear();
    this.queue.length = 0;
    this.bytes = 0;
  }

  private id(pieceId: string, turns: number): string {
    return `${pieceId}:${turns}`;
  }

  private bake(piece: Piece, turns: number): PieceTextureKeys {
    const prefix = `piece:${this.level.id}:${piece.id}:${turns}`;
    const keys: PieceTextureKeys = {
      body: `${prefix}:body`,
      shadow: `${prefix}:shadow`,
      light: `${prefix}:light`,
      resolution: this.resolution,
    };
    const framePx = piece.frameSize * this.cellPixel * this.resolution;
    const size = bodyTextureSize(piece.frameSize, this.cellPixel, this.resolution);
    const sil = silhouetteSize(size);
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);

    drawJewelPolygon(g, piecePolygonAround(piece, turns, size / 2, size / 2, framePx), {
      variant: 'solid',
      sizePx: framePx / 2,
    });
    g.generateTexture(keys.body, size, size);

    const outline = piecePolygonAround(piece, turns, sil / 2, sil / 2, framePx * SILHOUETTE_SCALE);
    for (const [key, color] of [[keys.shadow, 0x000000], [keys.light, 0xffffff]] as const) {
      g.clear();
      g.fillStyle(color, 1);
      g.fillPoints(outline, true);
      g.generateTexture(key, sil, sil);
    }
    g.destroy();
    this.bytes += pieceTurnBytes(piece.frameSize, this.cellPixel, this.resolution);
    return keys;
  }
}
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/pieceTextureCache.test.ts && npm run typecheck`
Expected: PASS. `drawJewelPolygon` chạy trên Graphics giả (Proxy) với `Phaser.Geom.Point` đã mock.

- [ ] **Step 6: Changelog và commit**

```markdown
### 2026-10-03 - Add piece texture cache with a memory budget (F2 task 5)

- Added `game-next/src/presentation/PieceTextureCache.ts`: each piece orientation is baked once into a 360 px jewel body plus half-resolution black and white silhouettes (no `setTintFill`, so WebGL and Canvas share one path), one piece per frame, with synchronous `ensure` for rotations.
- Measured budget: every Chapter 1 piece has `frameSize` 48 and no level rotates, so levels use 1.48-2.22 MiB; a rotating 6-piece level of 64-cell frames would exceed 24 MiB and automatically drops to 0.75 resolution (17.8 MiB).
- Added the shared test helper `tests/helpers/fakeScene.ts`.
- Verification: `tests/pieceTextureCache.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/PieceTextureCache.ts game-next/tests/pieceTextureCache.test.ts game-next/tests/helpers/fakeScene.ts CHANGELOG.md
git commit -m "feat(feel): bake piece textures one per frame within a memory budget"
```

---

### Task 6: `PieceView`, `BoardRenderer.tick()` và vòng render theo khung hình

**Files:**
- Create: `game-next/src/presentation/PieceView.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts` (viết lại phần mảnh và vòng vẽ)
- Modify: `game-next/src/presentation/PlayScene.ts` (`create`, `update`, pointer, `refreshView`, `transitionView`)
- Modify: `game-next/tests/boardRendererLayers.test.ts` (viết lại), `game-next/tests/boardRendererReveal.test.ts` (F1, đổi constructor và scene giả)

**Interfaces:**
- Consumes: `PieceTextureSource`, `PieceTextureKeys`, `SILHOUETTE_SCALE`, `pieceTargetPose`, `POSE_TAU`, `stepPose`, `stepScalar`, `lerpPose`, `tiltDeg`, `bounceScale`, `shakeOffset`, `lightAlpha`, `anchorCenter`, `EASES`, `isReducedMotion`, `getMotionScale`.
- Produces (`PieceView`):
  - `constructor(scene)`; `root`, `offset` (container)
  - `setTextures(keys: PieceTextureKeys, turns: number)`, `hasTextures()`, `turns(): number | null`
  - `setDepth(depth)`, `currentPose(): Pose | null`
  - `update(dtMs, target: Pose, tau: PoseTau, opts: { dragging: boolean; reduced: boolean })`
  - `setLifted(on, durationMs, ease)`, `dropLiftNow()`
  - `glideTo(to: Pose, durationMs, ease, delayMs?)`, `cancelGlide()`
  - `play(kind: 'bounce' | 'shake' | 'spin' | 'light', durationMs, amount?)`
  - `destroy()`
- Produces (`BoardRenderer`, thay chữ ký constructor):
  - `constructor(scene, layout, level: Level, textures: PieceTextureSource)`
  - `tick(dtMs, snapshot, pieces)`; `render(level, snapshot, pieces)` = `tick(0, …)` (giữ cho test)
  - `getPieceView(id): PieceView | undefined`
  - `targetPoseFor(piece, state, trayIndex): Pose`
  - `canvasPolygonAt(piece, turns, pose): CanvasPoint[]`
  - `getGoldFrame(): Phaser.GameObjects.Image | null`, `getTrayParts(): Poseable[]`
  - `setTrayVisible(visible: boolean, alpha: number)`
  - Giữ từ F1: `getTransitionParts`, `setTargetReveal`, `setFrameGold`, `setVictoryMode`, `destroy`

- [ ] **Step 1: Viết lại test thứ tự lớp (thất bại)**

Thay toàn bộ `game-next/tests/boardRendererLayers.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PieceState } from '../src/domain/model.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS } from '../src/presentation/designTokens.ts';
import { createFakeScene, readyTextures } from './helpers/fakeScene.ts';

vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} }, BlendModes: { ADD: 1 } } }));

describe('BoardRenderer thứ tự lớp khi kéo qua vùng giao', () => {
  test.each(['dragging', 'temporary'] as const)('%s nằm trên vùng triệt tiêu, dưới hiệu ứng thắng', (mode) => {
    const { scene, calls, objects } = createFakeScene();
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const original = loadLevel('1-1', 'campaign');
    const piece = original.pieces[0];
    const level = { ...original, pieces: ['P1', 'P2', 'P3'].map((id) => ({ ...piece, id })) };
    const renderer = new BoardRenderer(scene as Phaser.Scene, computeLayout(720, 1280), level, readyTextures);
    staticBoard.mockRestore();
    const states: Record<string, PieceState> = {
      P1: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P2: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P3: mode === 'dragging' ? { kind: 'tray', turns: 0 } : { kind: 'temporary', x: 16, y: 56, turns: 0 },
    };
    const snapshot: PlayViewSnapshot = {
      levelId: level.id, phase: 'won', showTarget: false, snappedCount: 2, totalPieces: 3,
      canRotate: false, selectedPieceId: 'P3', dragPreviewMask: null, snapCandidateId: null,
      dragInfo: mode === 'dragging' ? { pieceId: 'P3', x: 240, y: 600, snapCandidateId: null } : null,
      committedMask: level.targetMask,
    };
    renderer.render(level, snapshot, states);
    const allocated = objects.length;
    renderer.tick(16, snapshot, states);
    renderer.tick(16, snapshot, states);

    const parity = calls.find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!;
    const moving = renderer.getPieceView('P3')!.root as unknown as { __depth: number };
    const victory = calls.find((c) => c.method === 'strokeRoundedRect')!;
    expect(parity).toBeDefined();
    expect(victory).toBeDefined();
    expect(moving.__depth).toBe(mode === 'dragging' ? DEPTH_TOKENS.draggingPiece : DEPTH_TOKENS.temporaryPieces);
    expect(parity.depth).toBeLessThan(moving.__depth);
    expect(moving.__depth).toBeLessThan(victory.depth);
    if (mode === 'temporary') {
      expect(calls.some((c) => c.method === 'strokeCircle' && c.args[2] === 4 && c.depth === DEPTH_TOKENS.temporaryPieces)).toBe(true);
    }
    // Sparkle trắng ở tâm đã bị bỏ (CHANGELOG 2026-10-02)
    expect(calls.some((c) => c.method === 'fillCircle' && c.color === 0xffffff)).toBe(false);
    // tick không cấp phát GameObject mới
    expect(objects.length).toBe(allocated);
    renderer.destroy();
  });
});
```

Và trong `tests/boardRendererReveal.test.ts` (F1 Task 9): thay khối tạo `scene` thủ công bằng scene giả, đổi constructor, và đọc lần vẽ cuối của lớp bóng mục tiêu từ `calls`:

```ts
import { createFakeScene, readyTextures } from './helpers/fakeScene.ts';
// …
    const { scene, calls } = createFakeScene();
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const level = loadLevel('1-1', 'campaign');
    const renderer = new BoardRenderer(scene as Phaser.Scene, computeLayout(720, 1280), level, readyTextures);
    staticBoard.mockRestore();
    /** fillStyle alpha của lớp bóng mục tiêu (depth 20) kể từ lần clear gần nhất */
    const targetAlphas = () => {
      const target = calls.filter((c) => c.depth === 20);
      const lastClear = target.map((c) => c.method).lastIndexOf('clear');
      return target.slice(lastClear + 1).filter((c) => c.method === 'fillStyle').map((c) => c.args[1] as number);
    };
```

Phần còn lại của test giữ nguyên ý: `render` → `full = targetAlphas()`; `setTargetReveal([0, 0])` → `[]`; `[0.5, 0.5]` → từng giá trị `toBeCloseTo(full[i] * 0.5, 9)`; `null` → bằng `full`. Mock `phaser` thêm `BlendModes: { ADD: 1 }`.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/boardRendererLayers.test.ts tests/boardRendererReveal.test.ts`
Expected: FAIL — constructor nhận `trayCount` số, không có `tick`, không có `getPieceView`.

- [ ] **Step 3: Viết `PieceView.ts`**

`game-next/src/presentation/PieceView.ts`:

```ts
import Phaser from 'phaser';
import { FEEDBACK_TOKENS } from './designTokens.ts';
import type { PieceTextureKeys } from './PieceTextureCache.ts';
import { SILHOUETTE_SCALE } from './PieceTextureCache.ts';
import {
  bounceScale,
  lerpPose,
  lightAlpha,
  shakeOffset,
  stepPose,
  stepScalar,
  tiltDeg,
} from './pieceMotion.ts';
import type { Pose, PoseTau } from './pieceMotion.ts';
import { EASES } from './transitions/motion.ts';
import type { EaseName } from './transitions/motion.ts';

type Timed = { elapsedMs: number; delayMs: number; durationMs: number };
type Glide = Timed & { from: Pose; to: Pose; ease: EaseName };
type LiftTween = Timed & { from: number; to: number; ease: EaseName };
type EffectKind = 'bounce' | 'shake' | 'spin' | 'light';
type Effect = Timed & { kind: EffectKind; amount: number };

function progress(t: Timed): number {
  const active = t.elapsedMs - t.delayMs;
  if (active <= 0) return 0;
  return t.durationMs <= 0 ? 1 : Math.min(1, active / t.durationMs);
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/**
 * Một mảnh trên màn chơi. `root` mang tư thế (đuổi theo trạng thái logic mỗi
 * khung); `offset` là lớp lệch riêng cho dàn dựng chuyển cảnh của F1, nên
 * tween chuyển cảnh không đánh nhau với tư thế. Bên trong: bóng, thân, chớp.
 */
export class PieceView {
  readonly root: Phaser.GameObjects.Container;
  readonly offset: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly body: Phaser.GameObjects.Image;
  private readonly light: Phaser.GameObjects.Image;
  private keys: PieceTextureKeys | null = null;
  private bakedTurns: number | null = null;
  private pose: Pose | null = null;
  private glide: Glide | null = null;
  private liftTween: LiftTween | null = null;
  private lift = 0;
  private tilt = 0;
  private effects: Effect[] = [];

  constructor(scene: Phaser.Scene) {
    this.shadow = scene.add.image(0, 0, '__DEFAULT');
    this.body = scene.add.image(0, 0, '__DEFAULT');
    this.light = scene.add.image(0, 0, '__DEFAULT').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.offset = scene.add.container(0, 0, [this.shadow, this.body, this.light]);
    this.root = scene.add.container(0, 0, [this.offset]).setVisible(false);
  }

  setTextures(keys: PieceTextureKeys, turns: number): void {
    this.keys = keys;
    this.bakedTurns = turns;
    this.body.setTexture(keys.body);
    this.shadow.setTexture(keys.shadow);
    this.light.setTexture(keys.light);
  }

  hasTextures(): boolean {
    return this.keys !== null;
  }

  turns(): number | null {
    return this.bakedTurns;
  }

  setDepth(depth: number): void {
    this.root.setDepth(depth);
  }

  currentPose(): Pose | null {
    return this.pose ? { ...this.pose } : null;
  }

  setLifted(on: boolean, durationMs: number, ease: EaseName): void {
    const to = on ? 1 : 0;
    if (durationMs <= 0) {
      this.lift = to;
      this.liftTween = null;
      return;
    }
    this.liftTween = { from: this.lift, to, elapsedMs: 0, delayMs: 0, durationMs, ease };
  }

  /** Khi khớp: tắt nhấc ngay, nhịp nảy tiếp nối từ 1.08 */
  dropLiftNow(): void {
    this.lift = 0;
    this.liftTween = null;
  }

  glideTo(to: Pose, durationMs: number, ease: EaseName, delayMs = 0): void {
    if (!this.pose || (durationMs <= 0 && delayMs <= 0)) {
      this.pose = { ...to };
      this.glide = null;
      return;
    }
    this.glide = { from: { ...this.pose }, to: { ...to }, elapsedMs: 0, delayMs, durationMs, ease };
  }

  /** Nhấc lại mảnh đang bay: đi tiếp từ tư thế hiện tại, không nhảy (F3 T2-14) */
  cancelGlide(): void {
    this.glide = null;
  }

  play(kind: EffectKind, durationMs: number, amount = 1): void {
    if (durationMs <= 0) return;
    this.effects = this.effects.filter((e) => e.kind !== kind);
    this.effects.push({ kind, amount, elapsedMs: 0, delayMs: 0, durationMs });
  }

  update(dtMs: number, target: Pose, tau: PoseTau, opts: { dragging: boolean; reduced: boolean }): void {
    if (!this.keys) return;
    const prevX = this.pose?.x ?? target.x;
    if (!this.pose) this.pose = { ...target };

    if (this.glide) {
      this.glide.elapsedMs += dtMs;
      const t = progress(this.glide);
      this.pose = lerpPose(this.glide.from, this.glide.to, EASES[this.glide.ease](t));
      if (t >= 1) this.glide = null;
    } else {
      this.pose = opts.reduced ? { ...target } : stepPose(this.pose, target, dtMs, tau);
    }

    const vx = dtMs > 0 ? ((this.pose.x - prevX) * 1000) / dtMs : 0;
    const tiltTarget = opts.dragging && !opts.reduced ? tiltDeg(vx) : 0;
    this.tilt = opts.reduced ? 0 : stepScalar(this.tilt, tiltTarget, dtMs, tau.angle);

    if (this.liftTween) {
      this.liftTween.elapsedMs += dtMs;
      const t = progress(this.liftTween);
      this.lift = lerp(this.liftTween.from, this.liftTween.to, EASES[this.liftTween.ease](t));
      if (t >= 1) this.liftTween = null;
    }

    let scaleMul = 1;
    let dx = 0;
    let spin = 0;
    let flash = 0;
    this.effects = this.effects.filter((e) => {
      e.elapsedMs += dtMs;
      const t = progress(e);
      if (e.kind === 'bounce') scaleMul *= bounceScale(t);
      else if (e.kind === 'shake') dx += shakeOffset(t) * e.amount;
      else if (e.kind === 'spin') spin += e.amount * (1 - EASES.backOut(t));
      else flash = Math.max(flash, e.amount * lightAlpha(t));
      return t < 1;
    });

    const { x, y, scale, angle, alpha } = this.pose;
    const liftScale = 1 + (FEEDBACK_TOKENS.liftScale - 1) * this.lift;
    this.root
      .setPosition(x + dx, y)
      .setScale(scale * liftScale * scaleMul)
      .setAngle(angle + this.tilt + spin)
      .setAlpha(alpha)
      .setVisible(true);

    const res = this.keys.resolution;
    const silScale = 1 / (res * SILHOUETTE_SCALE);
    const { shadowRest: rest, shadowLifted: lifted } = FEEDBACK_TOKENS;
    this.body.setScale(1 / res);
    this.shadow
      .setScale(silScale)
      .setPosition(lerp(rest.x, lifted.x, this.lift), lerp(rest.y, lifted.y, this.lift))
      .setAlpha(FEEDBACK_TOKENS.shadowAlpha * this.lift);
    this.light.setScale(silScale).setAlpha(flash);
  }

  destroy(): void {
    this.root.destroy();
  }
}
```

- [ ] **Step 4: Viết lại `BoardRenderer.ts`**

Thay toàn bộ file bằng bản dưới (giữ nguyên phần `drawStaticBoard`, rune, `setTargetReveal` mà F1 Task 9 đã thêm; khác biệt chính: mảnh là `PieceView`, có `goldFrame`, vẽ theo khoá thay đổi):

```ts
import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import type { CanvasPoint, LayoutMetrics } from './layout.ts';
import {
  pieceCenterCanvas,
  pieceHitbox,
  piecePolygonAround,
  piecePolygonCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
  trayWellRects,
} from './layout.ts';
import { GridPainter } from './GridPainter.ts';
import { drawJewelPolygon } from './JewelShape.ts';
import type { ParityLayer } from './polygonClip.ts';
import type { PlayViewSnapshot } from '../application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS, FEEDBACK_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { getMotionScale, isReducedMotion } from './transitions/motion.ts';
import type { Poseable } from './transitions/choreography.ts';
import { PieceView } from './PieceView.ts';
import type { PieceTextureSource } from './PieceTextureCache.ts';
import { POSE_TAU, anchorCenter, pieceTargetPose, stepScalar } from './pieceMotion.ts';
import type { Pose } from './pieceMotion.ts';
import { diffLayers, overlapLayers } from './feedback/parityDiff.ts';

export type BoardTransitionParts = {
  board: Poseable[];
  runes: Poseable[];
  rings: Poseable[];
  tray: Poseable[];
  trayPieces: Poseable[];
  pieces: Poseable[];
  targets: Poseable[];
  grid: Phaser.GameObjects.RenderTexture | null;
};

type Snapped = { piece: Piece; state: Extract<PieceState, { kind: 'snapped' }> };

const DEPTH_FOR: Record<'tray' | 'snapped' | 'temporary' | 'dragging', number> = {
  tray: DEPTH_TOKENS.placedPieces,
  snapped: DEPTH_TOKENS.placedPieces,
  temporary: DEPTH_TOKENS.temporaryPieces,
  dragging: DEPTH_TOKENS.draggingPiece,
};

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layout: LayoutMetrics;
  private readonly level: Level;
  private readonly textures: PieceTextureSource;
  private readonly trayCount: number;

  private readonly ringGraphics: Phaser.GameObjects.Graphics;
  private readonly targetGraphics: Phaser.GameObjects.Graphics;
  private readonly placeholderGraphics: Phaser.GameObjects.Graphics;
  private readonly parityGraphics: Phaser.GameObjects.Graphics;
  private readonly parityIncomingGraphics: Phaser.GameObjects.Graphics;
  private readonly parityFadeGraphics: Phaser.GameObjects.Graphics;
  private readonly previewGraphics: Phaser.GameObjects.Graphics;
  private readonly temporaryGraphics: Phaser.GameObjects.Graphics;
  private readonly fxGraphics: Phaser.GameObjects.Graphics;

  private gridTexture: Phaser.GameObjects.RenderTexture | null = null;
  private boardSurface: Phaser.GameObjects.Image | null = null;
  private boardFrame: Phaser.GameObjects.Image | null = null;
  private goldFrame: Phaser.GameObjects.Image | null = null;
  private boardBase: Phaser.GameObjects.Container | null = null;
  private boardTop: Phaser.GameObjects.Container | null = null;
  private runes: Phaser.GameObjects.Arc[] = [];
  private trayWells: Phaser.GameObjects.Image[] = [];
  private trayFrame: Phaser.GameObjects.Image | null = null;

  private readonly views = new Map<string, PieceView>();
  private ring1Angle = 0;
  private ring2Angle = 0;
  private victoryPulse = 0;

  private targetReveal: readonly number[] | null = null;
  private hoverAlpha: number[];
  private targetKey = '';
  private staticKey = '';
  private previewKey = '';
  private parityKey = '';
  private currentParity: ParityLayer[] = [];
  private incoming: { alpha: number } | null = null;
  private parityFade: { alpha: number; ms: number } | null = null;
  private lastSnapshot: PlayViewSnapshot | null = null;

  constructor(scene: Phaser.Scene, layout: LayoutMetrics, level: Level, textures: PieceTextureSource) {
    this.scene = scene;
    this.layout = layout;
    this.level = level;
    this.textures = textures;
    this.trayCount = level.pieces.length;
    this.hoverAlpha = (level.targetPlacements ?? []).map(() => FEEDBACK_TOKENS.targetIdleAlpha);

    this.ringGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.celestialRings);
    this.targetGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.targetSilhouette);
    this.placeholderGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces);
    // Giao chẵn/lẻ chỉ phủ mảnh đã snap; mảnh đang di chuyển luôn nằm trên.
    this.parityGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.parityIncomingGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.parityFadeGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 1);
    this.previewGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    this.temporaryGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.temporaryPieces);
    this.fxGraphics = scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);

    this.drawStaticBoard();
    for (const piece of level.pieces) this.views.set(piece.id, new PieceView(scene));
  }

  // drawStaticBoard: giữ nguyên bản F1 Task 9, chỉ thêm goldFrame vào boardTop:
  //   this.goldFrame = this.scene.add.image(left, top, TEXTURE_KEYS.goldFrameBoard).setOrigin(0, 0).setAlpha(0);
  //   this.boardTop = this.scene.add.container(cx, cy, [...this.runes, this.boardFrame, this.goldFrame])…
  // và dùng this.trayCount cho trayWellRects.

  /** Gọi mỗi khung hình từ PlayScene.update */
  public tick(dtMs: number, snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.lastSnapshot = snapshot;
    const reduced = isReducedMotion();
    const dragId = snapshot.dragInfo?.pieceId ?? null;
    this.updateCelestialRings(dtMs, snapshot.phase === 'won');
    this.syncTargets(dtMs, snapshot, reduced);
    this.syncPieceViews(dtMs, snapshot, pieces, reduced);
    this.syncStaticOverlays(dragId, pieces);
    this.syncParity(dtMs, dragId, pieces);
    this.syncPreview(snapshot, pieces);
    this.fxGraphics.clear();
    if (snapshot.phase === 'won') {
      this.victoryPulse += dtMs * 0.004 * getMotionScale();
      this.drawVictoryPulse();
    }
  }

  /** Giữ chữ ký cũ cho test: vẽ ngay một khung không trôi thời gian */
  public render(_level: Level, snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    this.tick(0, snapshot, pieces);
  }

  public getPieceView(id: string): PieceView | undefined {
    return this.views.get(id);
  }

  public targetPoseFor(piece: Piece, state: PieceState, trayIndex: number): Pose {
    return pieceTargetPose(piece, state, {
      layout: this.layout, trayIndex, trayCount: this.trayCount, selected: false, drag: null,
    });
  }

  public canvasPolygonAt(piece: Piece, turns: number, pose: Pose): CanvasPoint[] {
    return piecePolygonAround(piece, turns, pose.x, pose.y, piece.frameSize * this.layout.cellPixel * pose.scale);
  }

  public getGoldFrame(): Phaser.GameObjects.Image | null {
    return this.goldFrame;
  }

  public getTrayParts(): Poseable[] {
    return [this.trayFrame, ...this.trayWells].filter((x): x is Phaser.GameObjects.Image => x !== null);
  }

  public setTrayVisible(visible: boolean, alpha: number): void {
    for (const part of this.getTrayParts() as Phaser.GameObjects.Image[]) part.setVisible(visible).setAlpha(alpha);
  }

  public setFrameGold(on: boolean): void {
    this.goldFrame?.setAlpha(on ? 1 : 0);
  }

  public setVictoryMode(on: boolean): void {
    this.setFrameGold(on);
    this.setTrayVisible(!on, 1);
  }

  /** Đặt lại: bản sao vùng giao hiện tại mờ dần trong `ms` */
  public fadeOutParity(ms: number): void {
    this.parityFadeGraphics.clear();
    this.drawLayers(this.parityFadeGraphics, this.currentParity);
    this.parityFadeGraphics.setAlpha(1);
    this.parityFade = { alpha: 1, ms: Math.max(1, ms) };
  }

  public setTargetReveal(values: readonly number[] | null): void {
    this.targetReveal = values;
    if (this.lastSnapshot) this.drawTargetSilhouette(this.lastSnapshot);
  }

  public getTransitionParts(): BoardTransitionParts {
    const present = <T>(items: Array<T | null | undefined>): T[] =>
      items.filter((item): item is T => item !== null && item !== undefined);
    const offsets = this.level.pieces.map((p) => this.views.get(p.id)!.offset);
    return {
      board: present<Poseable>([this.boardBase, this.gridTexture, this.boardTop]),
      runes: [...this.runes],
      rings: [this.ringGraphics],
      tray: this.getTrayParts(),
      trayPieces: offsets,
      pieces: [
        ...offsets, this.parityGraphics, this.parityIncomingGraphics, this.previewGraphics,
        this.temporaryGraphics, this.fxGraphics,
      ],
      targets: [this.targetGraphics, this.placeholderGraphics],
      grid: this.gridTexture,
    };
  }

  // updateCelestialRings(delta, isWon): giữ nguyên bản F1 (đã nhân getMotionScale()).

  private syncPieceViews(
    dtMs: number,
    snapshot: PlayViewSnapshot,
    pieces: Readonly<Record<string, PieceState>>,
    reduced: boolean
  ): void {
    const drag = snapshot.dragInfo;
    this.level.pieces.forEach((piece, index) => {
      const view = this.views.get(piece.id)!;
      const state = pieces[piece.id] ?? { kind: 'tray', turns: 0 };
      if (view.turns() !== state.turns) {
        const keys = this.textures.keys(piece.id, state.turns);
        if (!keys) return; // chưa vẽ xong: ẩn tới khung sau
        view.setTextures(keys, state.turns);
      }
      const dragging = drag !== null && drag.pieceId === piece.id;
      const target = pieceTargetPose(piece, state, {
        layout: this.layout,
        trayIndex: index,
        trayCount: this.trayCount,
        selected: snapshot.selectedPieceId === piece.id,
        drag: dragging
          ? {
              x: drag.x,
              y: drag.y,
              candidate: drag.snapCandidateId ? anchorCenter(piece, drag.snapCandidateId, this.layout) : null,
            }
          : null,
      });
      view.setDepth(DEPTH_FOR[dragging ? 'dragging' : state.kind]);
      const tau = POSE_TAU[dragging ? 'dragging' : state.kind === 'temporary' ? 'settling' : 'idle'];
      view.update(dtMs, target, tau, { dragging, reduced });
    });
  }

  /** Ô chờ trong khay khi kéo từ khay, và chấm chú thích trên mảnh tạm */
  private syncStaticOverlays(dragId: string | null, pieces: Readonly<Record<string, PieceState>>): void {
    const key = `${dragId}|${JSON.stringify(pieces)}`;
    if (key === this.staticKey) return;
    this.staticKey = key;
    this.placeholderGraphics.clear();
    this.temporaryGraphics.clear();
    this.level.pieces.forEach((piece, index) => {
      const state = pieces[piece.id] ?? { kind: 'tray', turns: 0 };
      if (piece.id === dragId && state.kind === 'tray') {
        const hit = pieceHitbox(piece, state, this.layout, index, this.trayCount);
        const radius = trayPieceRadiusPx(this.layout, this.trayCount);
        drawJewelPolygon(
          this.placeholderGraphics,
          piecePolygonAround(piece, state.turns, hit.x + hit.width / 2, hit.y + hit.height / 2, radius * 2),
          { variant: 'placeholder', sizePx: radius }
        );
      }
      if (state.kind === 'temporary' && piece.id !== dragId) {
        const radiusPx = pieceRadiusPx(piece.frameSize, this.layout);
        const center = pieceCenterCanvas(piece.frameSize, state.x, state.y, this.layout);
        this.temporaryGraphics.lineStyle(1, COLOR_NUMBERS.textSecondary, 0.4);
        this.temporaryGraphics.strokeCircle(center.x, center.y - radiusPx - 14, 4);
      }
    });
  }

  private snappedEntries(dragId: string | null, pieces: Readonly<Record<string, PieceState>>): Snapped[] {
    return this.level.pieces.flatMap((piece) => {
      const state = pieces[piece.id];
      return state && state.kind === 'snapped' && piece.id !== dragId ? [{ piece, state }] : [];
    });
  }

  private canvasPolygons(entries: readonly Snapped[]): CanvasPoint[][] {
    return entries.flatMap(({ piece, state }) => {
      const anchor = piece.anchors.find((a) => a.id === state.anchorId);
      return anchor ? [piecePolygonCanvas(piece, anchor.x, anchor.y, state.turns, this.layout)] : [];
    });
  }

  /**
   * Vùng giao: lớp cũ vẽ ngay, lớp mới mờ dần trong overlapFadeMs (giữ cả khi
   * Giảm chuyển động vì ≤ 150 ms là đổi màu, không phải chuyển động).
   */
  private syncParity(dtMs: number, dragId: string | null, pieces: Readonly<Record<string, PieceState>>): void {
    const entries = this.snappedEntries(dragId, pieces);
    const key = entries.map(({ piece, state }) => `${piece.id}:${state.anchorId}:${state.turns}`).join('|');
    if (key !== this.parityKey) {
      this.parityKey = key;
      const next = overlapLayers(this.canvasPolygons(entries));
      const { kept, added } = diffLayers(this.currentParity, next);
      this.currentParity = next;
      this.parityGraphics.clear();
      this.drawLayers(this.parityGraphics, kept);
      this.parityIncomingGraphics.clear();
      if (added.length > 0) {
        this.drawLayers(this.parityIncomingGraphics, added);
        this.incoming = { alpha: 0 };
        this.parityIncomingGraphics.setAlpha(0);
      } else {
        this.incoming = null;
      }
    }
    if (this.incoming) {
      this.incoming.alpha = Math.min(1, this.incoming.alpha + dtMs / FEEDBACK_TOKENS.overlapFadeMs);
      this.parityIncomingGraphics.setAlpha(this.incoming.alpha);
      if (this.incoming.alpha >= 1) {
        this.parityGraphics.clear();
        this.drawLayers(this.parityGraphics, this.currentParity);
        this.parityIncomingGraphics.clear();
        this.incoming = null;
      }
    }
    if (this.parityFade) {
      this.parityFade.alpha = Math.max(0, this.parityFade.alpha - dtMs / this.parityFade.ms);
      this.parityFadeGraphics.setAlpha(this.parityFade.alpha);
      if (this.parityFade.alpha <= 0) {
        this.parityFadeGraphics.clear();
        this.parityFade = null;
      }
    }
  }

  /** Nét xem trước vùng sẽ ẩn khi mảnh đang kéo có neo ứng viên */
  private syncPreview(snapshot: PlayViewSnapshot, pieces: Readonly<Record<string, PieceState>>): void {
    const drag = snapshot.dragInfo;
    const key = drag ? `${drag.pieceId}|${drag.snapCandidateId}` : '';
    if (key === this.previewKey) return;
    this.previewKey = key;
    this.previewGraphics.clear();
    if (!drag || !drag.snapCandidateId) return;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    const anchor = piece?.anchors.find((a) => a.id === drag.snapCandidateId);
    if (!piece || !anchor) return;
    const turns = (pieces[piece.id] ?? { turns: 0 }).turns;
    const polygons = [
      ...this.canvasPolygons(this.snappedEntries(drag.pieceId, pieces)),
      piecePolygonCanvas(piece, anchor.x, anchor.y, turns, this.layout),
    ];
    this.previewGraphics.lineStyle(1.5, COLOR_NUMBERS.icePrimary, FEEDBACK_TOKENS.previewAlpha);
    for (const layer of overlapLayers(polygons)) {
      this.previewGraphics.strokePoints(layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y)), true, true);
    }
  }

  private drawLayers(g: Phaser.GameObjects.Graphics, layers: readonly ParityLayer[]): void {
    for (const layer of layers) {
      const pts = layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y));
      if (layer.filled) {
        g.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
        g.fillPoints(pts, true);
      } else {
        // Triệt tiêu quang học về màu mặt bia, rìa trong sáng nhẹ màu vàng nhạt
        g.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
        g.fillPoints(pts, true);
        g.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.7);
        g.strokePoints(pts, true, true);
      }
    }
  }

  /** Bóng mục tiêu: sáng 0.7 → 1 trong ~120 ms khi neo của nó là ứng viên */
  private syncTargets(dtMs: number, snapshot: PlayViewSnapshot, reduced: boolean): void {
    const drag = snapshot.dragInfo;
    let moving = false;
    (this.level.targetPlacements ?? []).forEach((placement, i) => {
      const piece = this.level.pieces.find((p) => p.id === placement.pieceId);
      const anchor = piece?.anchors.find((a) => a.x === placement.x && a.y === placement.y);
      const hovered = drag !== null && drag.pieceId === placement.pieceId && anchor !== undefined && drag.snapCandidateId === anchor.id;
      const goal = hovered ? 1 : FEEDBACK_TOKENS.targetIdleAlpha;
      const next = reduced ? goal : stepScalar(this.hoverAlpha[i], goal, dtMs, FEEDBACK_TOKENS.tau.targetHover);
      if (Math.abs(next - this.hoverAlpha[i]) > 1e-4) moving = true;
      this.hoverAlpha[i] = Math.abs(next - goal) < 1e-3 ? goal : next;
    });
    const key = `${snapshot.showTarget}|${this.hoverAlpha.join(',')}`;
    if (key !== this.targetKey || moving) {
      this.targetKey = key;
      this.drawTargetSilhouette(snapshot);
    }
  }

  private drawTargetSilhouette(snapshot: PlayViewSnapshot): void {
    this.targetGraphics.clear();
    if (!snapshot.showTarget) return;
    (this.level.targetPlacements ?? []).forEach((placement, index) => {
      const reveal = this.targetReveal?.[index] ?? 1;
      if (reveal <= 0) return;
      const piece = this.level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return;
      drawJewelPolygon(
        this.targetGraphics,
        piecePolygonCanvas(piece, placement.x, placement.y, placement.turns, this.layout),
        { variant: 'target', alpha: this.hoverAlpha[index] * reveal, sizePx: pieceRadiusPx(piece.frameSize, this.layout) }
      );
    });
  }

  private drawVictoryPulse(): void {
    const { boardBounds } = this.layout;
    this.fxGraphics.lineStyle(2.5, COLOR_NUMBERS.amberGlow, 0.6 + Math.sin(this.victoryPulse) * 0.3);
    this.fxGraphics.strokeRoundedRect(boardBounds.x - 2, boardBounds.y - 2, boardBounds.width + 4, boardBounds.height + 4, 38);
  }

  public destroy(): void {
    for (const g of [
      this.ringGraphics, this.targetGraphics, this.placeholderGraphics, this.parityGraphics,
      this.parityIncomingGraphics, this.parityFadeGraphics, this.previewGraphics,
      this.temporaryGraphics, this.fxGraphics,
    ]) g.destroy();
    for (const view of this.views.values()) view.destroy();
    this.boardBase?.destroy();
    this.boardTop?.destroy();
    this.gridTexture?.destroy();
    this.trayFrame?.destroy();
    this.trayWells.forEach((w) => w.destroy());
  }
}
```

Ghi chú khi dán: phương thức `drawStaticBoard` và `updateCelestialRings` copy nguyên từ file sau F1 Task 9 (bỏ `this.bgGraphics` nếu còn), chỉ đổi hai điểm ghi trong comment ở trên. Xoá `drawTrayPiece`, `drawTrayPlaceholder`, `drawDraggingPiece`, `drawTemporaryPiece`, `drawSnappedPiece`, `drawOverlapInversion`, `drawVictoryCelebration`, `trayPoints`, các field `piecesGraphics` / `draggingGraphics`, `lastLevel`; import `ANIM_TOKENS`, `PIECE_TOKENS`, `LAYOUT_TOKENS` nếu không còn dùng. `TEXTURE_KEYS.goldFrameBoard` đã có.

- [ ] **Step 5: `PlayScene` dùng cache, tick mỗi khung**

Trong `PlayScene.ts`:

1. Field: `private textureCache!: PieceTextureCache;`. Import `PieceTextureCache` và `isReducedMotion` (chưa dùng ở task này thì bỏ).
2. `create()`, ngay trước `this.boardRenderer = …`:

```ts
    // Texture mảnh vẽ rải mỗi khung một mảnh trong update(), không vẽ trong
    // create() để handoff của chuyển cảnh F1 không có khung > 50 ms.
    this.textureCache = new PieceTextureCache(this, this.level, layout.cellPixel);
    for (const piece of this.level.pieces) this.textureCache.enqueue(piece.id, 0);
    this.events.once('shutdown', () => this.textureCache.destroy());
```

   và `this.boardRenderer = new BoardRenderer(this, layout, this.level, this.textureCache);`.
3. Thêm lại `update` (F1 đã xoá):

```ts
  update(_time: number, delta: number): void {
    if (this.loadFailed) return;
    this.textureCache.bakeNext();
    this.boardRenderer.tick(delta, this.controller.getSnapshot(), this.controller.getPuzzleState().pieces);
  }
```

4. `pointermove` chỉ còn `this.controller.onPointerMove(pointer.x, pointer.y, layout);` — renderer tự vẽ trong `update`. Nhãn "Thả để khớp" giữ trong `refreshView()` tạm thời và gọi thêm ở `update` (Task 8 thay bằng bản mượt):

```ts
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.controller.onPointerMove(pointer.x, pointer.y, layout);
      this.updateSnapHint();
    });
```

5. `refreshView()` bỏ dòng `this.boardRenderer.render(...)`; tách khối nhãn hít thành `private updateSnapHint(): void` (nội dung cũ, đọc `this.controller.getSnapshot()`), gọi từ `refreshView`.

- [ ] **Step 6: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/boardRendererLayers.test.ts tests/boardRendererReveal.test.ts && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: Kiểm thủ công**

Run: `npm run dev`, mở `/?scene=play&level=1-4&mode=harness`. Kiểm:
- Mảnh trong khay hiện sau vài khung, cùng hình ngọc như trước.
- Kéo: mảnh bám tay mượt, nghiêng nhẹ theo hướng kéo, lớn dần từ cỡ khay lên cỡ bàn.
- Thả: mảnh trượt vào neo (chưa có nảy), về khay trượt về.
- Vòng thiên văn quay khi không chạm tay; vùng giao 2 mảnh mờ dần khi xuất hiện.
- Console không lỗi, kể cả khi chuyển màn kế (texture màn cũ bị gỡ).

- [ ] **Step 8: Changelog và commit**

```markdown
### 2026-10-03 - Render pieces as textured views every frame (F2 task 6)

- Added `game-next/src/presentation/PieceView.ts` (a pose-driven container with a separate transition offset layer, shadow, jewel body and additive flash) and rewrote `BoardRenderer` around a per-frame `tick()`: pieces follow smoothed target poses, static overlays, target hover, parity layers (new layers fade in over 150 ms) and the drag overlap preview redraw only when their key changes; the gold frame is now a crossfadable image.
- `PlayScene.update` bakes one piece texture per frame and ticks the renderer; pointer moves no longer redraw the board.
- Rewrote `tests/boardRendererLayers.test.ts` on the shared fake scene (pieces are images, not `fillPoints`) and moved `tests/boardRendererReveal.test.ts` to the new constructor.
- Verification: both renderer tests failed against the old constructor, then passed; `npm run typecheck` and `npm test` passed; manual harness check of 1-4.
```

```bash
git add game-next/src/presentation/PieceView.ts game-next/src/presentation/BoardRenderer.ts game-next/src/presentation/PlayScene.ts game-next/tests/boardRendererLayers.test.ts game-next/tests/boardRendererReveal.test.ts CHANGELOG.md
git commit -m "feat(feel): render pieces as textured views on a per-frame tick"
```

---

### Task 7: Kiểm vùng giao và xem trước

**Files:**
- Test: `game-next/tests/boardRendererParity.test.ts` (mới, khoá hành vi Task 6)

Task này chỉ thêm test cho phần vùng giao của `BoardRenderer` (đã viết ở Task 6) — tách ra để người review có thể chặn riêng nếu hành vi mờ dần sai.

**Interfaces:**
- Consumes: `BoardRenderer` (Task 6), `createFakeScene`, `readyTextures`.

- [ ] **Step 1: Viết test**

`game-next/tests/boardRendererParity.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PieceState } from '../src/domain/model.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS } from '../src/presentation/designTokens.ts';
import { createFakeScene, readyTextures } from './helpers/fakeScene.ts';

vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} }, BlendModes: { ADD: 1 } } }));

function setup() {
  const fake = createFakeScene();
  const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
  const original = loadLevel('1-1', 'campaign');
  const level = { ...original, pieces: ['P1', 'P2'].map((id) => ({ ...original.pieces[0], id })) };
  const renderer = new BoardRenderer(fake.scene as Phaser.Scene, computeLayout(720, 1280), level, readyTextures);
  staticBoard.mockRestore();
  const snapshot = (over: Partial<PlayViewSnapshot> = {}): PlayViewSnapshot => ({
    levelId: level.id, phase: 'playing', showTarget: false, snappedCount: 0, totalPieces: 2,
    canRotate: false, selectedPieceId: null, dragPreviewMask: null, snapCandidateId: null,
    dragInfo: null, committedMask: level.targetMask, ...over,
  });
  return { ...fake, renderer, snapshot };
}

const snapped: PieceState = { kind: 'snapped', anchorId: 'A', turns: 0 };
const tray: PieceState = { kind: 'tray', turns: 0 };

describe('vùng giao mờ dần', () => {
  test('lớp mới bắt đầu alpha 0 và đạt 1 sau 150 ms, rồi gộp vào lớp ổn định', () => {
    const { renderer, snapshot, calls } = setup();
    renderer.tick(16, snapshot(), { P1: snapped, P2: tray });
    renderer.tick(0, snapshot(), { P1: snapped, P2: snapped });
    const incomingOwner = calls.find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!.owner;
    const alphaOf = () => [...calls].reverse().find((c) => c.owner === incomingOwner && c.method === 'setAlpha')?.args[0];
    expect(alphaOf()).toBe(0);
    renderer.tick(75, snapshot(), { P1: snapped, P2: snapped });
    expect(alphaOf()).toBeCloseTo(0.5, 5);
    renderer.tick(80, snapshot(), { P1: snapped, P2: snapped });
    const stable = calls.filter((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop
      && c.owner !== incomingOwner);
    expect(stable.length).toBeGreaterThan(0);
  });

  test('fadeOutParity vẽ bản sao rồi mờ về 0', () => {
    const { renderer, snapshot, calls } = setup();
    renderer.tick(0, snapshot(), { P1: snapped, P2: snapped });
    renderer.tick(200, snapshot(), { P1: snapped, P2: snapped });
    const before = calls.length;
    renderer.fadeOutParity(120);
    renderer.tick(0, snapshot(), { P1: tray, P2: tray });
    renderer.tick(130, snapshot(), { P1: tray, P2: tray });
    // Chỉ đọc lớp bản sao: đối tượng nhận fillPoints màu mặt bia sau fadeOutParity
    const fadeOwner = calls.slice(before)
      .find((c) => c.method === 'fillPoints' && c.color === COLOR_NUMBERS.boardSurfaceTop)!.owner;
    const alphas = calls.filter((c) => c.owner === fadeOwner && c.method === 'setAlpha').map((c) => c.args[0]);
    expect(alphas[0]).toBe(1);
    expect(alphas[alphas.length - 1]).toBe(0);
  });

  test('xem trước: có neo ứng viên chồng lên mảnh đã snap thì vẽ nét ở depth 32', () => {
    const { renderer, snapshot, calls } = setup();
    const drag = { pieceId: 'P2', x: 300, y: 600, snapCandidateId: 'A' };
    renderer.tick(16, snapshot({ dragInfo: drag }), { P1: snapped, P2: tray });
    expect(calls.some((c) => c.method === 'strokePoints' && c.depth === DEPTH_TOKENS.placedPieces + 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test**

Run: `npx vitest run tests/boardRendererParity.test.ts`
Expected: PASS ngay (hành vi đã có từ Task 6). Nếu FAIL, sửa `BoardRenderer.syncParity`/`syncPreview` cho khớp spec F2 mục 3 (dòng `overlap-hollow` và "Xem trước vùng giao") — không sửa test.

- [ ] **Step 3: Changelog và commit**

```markdown
### 2026-10-03 - Lock parity fade and overlap preview behaviour (F2 task 7)

- Added `tests/boardRendererParity.test.ts`: new overlap layers fade from 0 to 1 over 150 ms and merge into the stable layer, reset copies fade out, and a snap candidate over a placed piece draws the preview outline above placed pieces.
- Verification: `npx vitest run tests/boardRendererParity.test.ts`, `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/tests/boardRendererParity.test.ts CHANGELOG.md
git commit -m "test(feel): lock parity fade and overlap preview behaviour"
```

---

### Task 8: `FeedbackDirector` cho thao tác và HUD mượt

**Files:**
- Create: `game-next/src/presentation/feedback/FeedbackDirector.ts`
- Modify: `game-next/src/presentation/Hud.ts`
- Modify: `game-next/src/presentation/PlayScene.ts`
- Test: không thêm test Phaser; logic đã có test ở Task 2–4. Nghiệm thu bằng mắt ở Step 6 và ở F3.

**Interfaces:**
- Consumes: `FeedbackEvent`, `FeedbackSubject`, `feedbackEvents`, `HAPTIC_CUES`, `playCue`, `HapticsPort`, `createHaptics`, `capacitorHapticsDriver`, `perimeterSegment`, `TransitionTimeline`, `scaleTiming`, `isReducedMotion`, `stepScalar`, `lightAlpha`.
- Produces:
  - `type FeedbackDeps = { scene; level; layout; board: BoardRenderer; hud: Hud; textures: PieceTextureCache; haptics: HapticsPort; getState(): PuzzleState; background(): BackgroundScene | null }`
  - `class FeedbackDirector`: `handle(events)`, `tick(dtMs)` (Task 9 thêm `playVictory`, `skipVictory`, `isVictoryRunning`, `unwindVictory`)
  - `Hud.tickSnapHint(dtMs: number, target: { x: number; y: number } | null)`, `Hud.popCounterIcon(index: number)`

- [ ] **Step 1: HUD — nhãn hít, biểu tượng đếm, nút Xoay**

Trong `Hud.ts`:

1. Import `import { stepScalar } from './pieceMotion.ts'; import { isReducedMotion } from './transitions/motion.ts'; import { FEEDBACK_TOKENS } from './designTokens.ts';` (gộp vào dòng import token hiện có).
2. Field: `private matchIconCenters: number[] = []; private hint = { alpha: 0, x: 0, y: 0 }; private lastCanRotate: boolean | null = null;`
3. Trong `drawMatchBar`, vòng `for` icon: thêm `this.matchIconCenters[i] = cx;` (reset `this.matchIconCenters = [];` trước vòng).
4. Trong `update(snapshot)` thay khối bật/tắt nút Xoay:

```ts
    if (snapshot.canRotate !== this.lastCanRotate) {
      this.lastCanRotate = snapshot.canRotate;
      if (snapshot.canRotate) this.rotateBtnBase.setInteractive({ useHandCursor: true });
      else this.rotateBtnBase.disableInteractive();
      this.scene.tweens.killTweensOf(this.rotateContainer);
      this.scene.tweens.add({
        targets: this.rotateContainer,
        alpha: snapshot.canRotate ? 1.0 : 0.3,
        duration: FEEDBACK_TOKENS.rotateButtonFadeMs,
        ease: 'Sine.easeInOut',
      });
    }
```

5. Thay `showSnapHint` / `hideSnapHint` bằng:

```ts
  /** Nhãn "Thả để khớp": hiện/ẩn trong ~120 ms, bám mảnh với τ 60 ms */
  public tickSnapHint(dtMs: number, target: { x: number; y: number } | null): void {
    if (!this.snapHint) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0xfff4d2, 1);
      bg.fillRoundedRect(-80, -22, 160, 44, 14);
      const label = this.scene.add
        .text(0, 0, SNAP_HINT_TEXT, {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '22px',
          color: COLOR_TOKENS.text.onAmber,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.snapHint = this.scene.add.container(0, 0, [bg, label]).setDepth(DEPTH_TOKENS.hudControls).setAlpha(0);
    }
    const reduced = isReducedMotion();
    const goal = target ? 1 : 0;
    const fadeTau = FEEDBACK_TOKENS.hintMs / 3;
    if (target && this.hint.alpha < 0.01) {
      this.hint.x = target.x;
      this.hint.y = target.y;
    } else if (target) {
      this.hint.x = reduced ? target.x : stepScalar(this.hint.x, target.x, dtMs, FEEDBACK_TOKENS.tau.hint);
      this.hint.y = reduced ? target.y : stepScalar(this.hint.y, target.y, dtMs, FEEDBACK_TOKENS.tau.hint);
    }
    this.hint.alpha = stepScalar(this.hint.alpha, goal, dtMs, fadeTau);
    if (Math.abs(this.hint.alpha - goal) < 0.01) this.hint.alpha = goal;
    const scale = reduced ? 1 : 0.9 + 0.1 * this.hint.alpha;
    this.snapHint
      .setPosition(this.hint.x, this.hint.y)
      .setAlpha(this.hint.alpha)
      .setScale(scale)
      .setVisible(this.hint.alpha > 0);
  }

  /** Biểu tượng thứ `index` trên thanh đếm bật 1.3 → 1 khi một mảnh khớp */
  public popCounterIcon(index: number): void {
    const cx = this.matchIconCenters[index];
    if (cx === undefined || isReducedMotion()) return;
    const pop = this.scene.add.graphics();
    drawJewel(pop, { cx: 0, cy: 0, radius: 14, variant: 'solid' });
    pop.setPosition(cx, 0).setScale(FEEDBACK_TOKENS.counterPopScale);
    this.matchBar.add(pop);
    this.scene.tweens.add({
      targets: pop,
      scaleX: 1,
      scaleY: 1,
      duration: FEEDBACK_TOKENS.counterPopMs,
      ease: 'Back.easeOut',
      onComplete: () => pop.destroy(),
    });
  }
```

6. `destroy()` giữ `this.snapHint?.destroy();`.

- [ ] **Step 2: Viết `FeedbackDirector.ts` (phần thao tác)**

`game-next/src/presentation/feedback/FeedbackDirector.ts`:

```ts
import Phaser from 'phaser';
import type { Level, Piece, PuzzleState } from '../../domain/model.ts';
import type { BackgroundScene } from '../BackgroundScene.ts';
import type { BoardRenderer } from '../BoardRenderer.ts';
import { COLOR_NUMBERS, DEPTH_TOKENS, FEEDBACK_TOKENS } from '../designTokens.ts';
import type { Hud } from '../Hud.ts';
import type { LayoutMetrics } from '../layout.ts';
import { gridToCanvas, pieceRadiusPx } from '../layout.ts';
import type { PieceTextureCache } from '../PieceTextureCache.ts';
import { lightAlpha } from '../pieceMotion.ts';
import type { Pt } from '../polygonClip.ts';
import { isReducedMotion, scaleTiming } from '../transitions/motion.ts';
import { TransitionTimeline } from '../transitions/TransitionTimeline.ts';
import type { HapticsPort } from '../../infrastructure/haptics.ts';
import type { FeedbackEvent } from './feedbackEvents.ts';
import { HAPTIC_CUES, playCue } from './hapticCues.ts';
import { perimeterSegment } from './parityDiff.ts';

export type FeedbackDeps = {
  scene: Phaser.Scene;
  level: Level;
  layout: LayoutMetrics;
  board: BoardRenderer;
  hud: Hud;
  textures: PieceTextureCache;
  haptics: HapticsPort;
  getState(): PuzzleState;
  background(): BackgroundScene | null;
};

const F = FEEDBACK_TOKENS;
const toGeom = (pts: readonly Pt[]) => pts.map((p) => new Phaser.Geom.Point(p.x, p.y));

/**
 * Chạy phản hồi hình và rung cho từng sự kiện. Mọi hiệu ứng ngắn là một
 * TransitionTimeline riêng, được tick từ PlayScene.update — cùng cơ chế với
 * chuyển cảnh F1, nên Giảm chuyển động và bỏ qua hoạt động giống nhau.
 */
export class FeedbackDirector {
  private readonly deps: FeedbackDeps;
  private effects: TransitionTimeline[] = [];

  constructor(deps: FeedbackDeps) {
    this.deps = deps;
  }

  handle(events: readonly FeedbackEvent[]): void {
    for (const event of events) {
      playCue(this.deps.haptics, HAPTIC_CUES[event.type]);
      this.visual(event);
    }
  }

  tick(dtMs: number): void {
    for (const tl of this.effects) tl.advance(dtMs);
    this.effects = this.effects.filter((tl) => !tl.isFinished());
  }

  protected fx(): TransitionTimeline {
    const tl = new TransitionTimeline();
    this.effects.push(tl);
    return tl;
  }

  protected piece(id: string): Piece | undefined {
    return this.deps.level.pieces.find((p) => p.id === id);
  }

  private visual(event: FeedbackEvent): void {
    const { board, textures, level } = this.deps;
    const reduced = isReducedMotion();
    switch (event.type) {
      case 'lift': {
        const view = board.getPieceView(event.pieceId);
        view?.cancelGlide();
        view?.setLifted(true, scaleTiming(F.liftMs), 'backOut');
        if (level.rotationEnabled) {
          const turns = this.deps.getState().pieces[event.pieceId]?.turns ?? 0;
          textures.enqueue(event.pieceId, turns + 1);
        }
        return;
      }
      case 'snap': {
        const piece = this.piece(event.pieceId);
        const view = board.getPieceView(event.pieceId);
        const state = this.deps.getState().pieces[event.pieceId];
        if (!piece || !view || !state) return;
        view.dropLiftNow();
        view.glideTo(board.targetPoseFor(piece, state, level.pieces.indexOf(piece)), scaleTiming(F.snapMs), 'cubicOut');
        if (reduced) return;
        view.play('bounce', F.bounceMs);
        const target = board.targetPoseFor(piece, state, 0);
        this.snapRing(target, pieceRadiusPx(piece.frameSize, this.deps.layout));
        const snapped = Object.values(this.deps.getState().pieces).filter((s) => s.kind === 'snapped').length;
        this.deps.hud.popCounterIcon(snapped - 1);
        return;
      }
      case 'settle-temporary':
        board.getPieceView(event.pieceId)?.setLifted(false, scaleTiming(F.dropLiftMs), 'cubicOut');
        return;
      case 'return': {
        const piece = this.piece(event.pieceId);
        const view = board.getPieceView(event.pieceId);
        if (!piece || !view) return;
        view.setLifted(false, scaleTiming(F.returnMs), 'cubicOut');
        view.glideTo(
          board.targetPoseFor(piece, { kind: 'tray', turns: this.deps.getState().pieces[piece.id]?.turns ?? 0 }, level.pieces.indexOf(piece)),
          scaleTiming(F.returnMs),
          'cubicOut'
        );
        return;
      }
      case 'rotate': {
        const view = board.getPieceView(event.pieceId);
        if (!view) return;
        view.setTextures(textures.ensure(event.pieceId, event.turns), event.turns);
        if (!reduced) view.play('spin', F.rotateMs, F.rotateFromDeg);
        textures.enqueue(event.pieceId, event.turns + 1);
        return;
      }
      case 'rotate-blocked': {
        const view = board.getPieceView(event.pieceId);
        if (!reduced) view?.play('shake', F.shakeMs);
        this.flashOutline(event.pieceId);
        return;
      }
      case 'overlap-hollow':
        if (!reduced) for (const layer of event.layers) this.traceEdge(layer);
        return;
      case 'overlap-revive':
        if (!reduced) for (const layer of event.layers) this.reviveFlash(layer);
        return;
      case 'reset':
        this.resetPieces();
        return;
      case 'won':
        // Task 9: this.playVictory();
        return;
    }
  }

  private snapRing(center: { x: number; y: number }, radius: number): void {
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);
    const s = { r: 0, a: F.snapRingAlpha };
    const draw = () => {
      g.clear();
      g.lineStyle(2, COLOR_NUMBERS.icePrimary, s.a);
      g.strokeCircle(center.x, center.y, s.r);
    };
    const tl = this.fx();
    tl.at(0, s, { r: radius * F.snapRingRadiusRatio, a: 0 }, F.snapRingMs, 'cubicOut', draw);
    tl.call(F.snapRingMs, () => g.destroy());
    tl.advance(0);
  }

  private traceEdge(gridLayer: Pt[]): void {
    const points = gridLayer.map((p) => gridToCanvas(p.x, p.y, this.deps.layout));
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    const s = { p: 0 };
    const draw = () => {
      g.clear();
      const seg = perimeterSegment(points, s.p, F.overlapTraceFraction);
      if (seg.length < 2) return;
      g.lineStyle(3 - 2 * s.p, COLOR_NUMBERS.iceHighlight, 1 - s.p);
      g.strokePoints(toGeom(seg), false, false);
    };
    const tl = this.fx();
    tl.at(0, s, { p: 1 }, F.overlapTraceMs, 'linear', draw);
    tl.call(F.overlapTraceMs, () => g.destroy());
    tl.advance(0);
  }

  private reviveFlash(gridLayer: Pt[]): void {
    const pts = gridLayer.map((p) => gridToCanvas(p.x, p.y, this.deps.layout));
    const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.placedPieces + 2);
    const s = { k: 0 };
    const draw = () => {
      g.clear();
      const len = 18 * lightAlpha(s.k);
      g.lineStyle(2, COLOR_NUMBERS.amberGlow, lightAlpha(s.k));
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.lineBetween(c.x, c.y, c.x + Math.cos(a) * len, c.y + Math.sin(a) * len);
      }
    };
    const tl = this.fx();
    tl.at(0, s, { k: 1 }, F.reviveFlashMs, 'linear', draw);
    tl.call(F.reviveFlashMs, () => g.destroy());
    tl.advance(0);
  }

  /** Nháy viền ice-white khi xoay bị chặn; giữ cả khi Giảm chuyển động */
  private flashOutline(pieceId: string): void {
    const piece = this.piece(pieceId);
    const view = this.deps.board.getPieceView(pieceId);
    const pose = view?.currentPose();
    if (!piece || !pose) return;
    const turns = this.deps.getState().pieces[pieceId]?.turns ?? 0;
    const pts = this.deps.board.canvasPolygonAt(piece, turns, pose);
    const g = this.deps.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);
    const s = { a: 0 };
    const draw = () => {
      g.clear();
      g.lineStyle(3, COLOR_NUMBERS.iceHighlight, s.a);
      g.strokePoints(toGeom(pts), true, true);
    };
    const half = Math.min(F.shakeMs / 2, F.reducedFadeMaxMs / 2);
    const tl = this.fx();
    tl.at(0, s, { a: F.blockedFlashAlpha }, half, 'linear', draw);
    tl.at(half, s, { a: 0 }, half, 'linear', draw);
    tl.call(half * 2, () => g.destroy());
    tl.advance(0);
  }

  /** Đặt lại: mảnh trên bia bay về khay so le 40 ms; vùng giao mờ trong 120 ms */
  private resetPieces(): void {
    const { board, level } = this.deps;
    board.fadeOutParity(F.resetOverlapFadeMs);
    let k = 0;
    level.pieces.forEach((piece, index) => {
      const view = board.getPieceView(piece.id);
      const pose = view?.currentPose();
      if (!view || !pose) return;
      const tray = board.targetPoseFor(piece, { kind: 'tray', turns: 0 }, index);
      if (Math.hypot(pose.x - tray.x, pose.y - tray.y) < 1) return;
      view.setLifted(false, 0, 'linear');
      view.glideTo(tray, scaleTiming(F.resetMs), 'cubicOut', scaleTiming(F.resetStaggerMs * k));
      k++;
    });
  }
}
```

- [ ] **Step 3: Nối `PlayScene`**

Trong `PlayScene.ts`:

1. Import: `FeedbackDirector`, `feedbackEvents`, `type FeedbackSubject`, `createHaptics`, `capacitorHapticsDriver`, `Capacitor` (`@capacitor/core`), `BackgroundScene` (type), `type PuzzleState`, `type Transition`.
2. Field `private feedback!: FeedbackDirector;`
3. Sau khi tạo `this.hud` trong `create()`:

```ts
    const haptics = createHaptics(
      Capacitor.isNativePlatform() ? capacitorHapticsDriver() : null,
      () => savedProgress.settings.haptics
    );
    this.feedback = new FeedbackDirector({
      scene: this,
      level: this.level,
      layout,
      board: this.boardRenderer,
      hud: this.hud,
      textures: this.textureCache,
      haptics,
      getState: () => this.controller.getPuzzleState(),
      background: () => this.scene.get('BackgroundScene') as BackgroundScene | null,
    });
```

4. Thêm hàm chung:

```ts
  /** Áp kết quả một lệnh: phát phản hồi rồi cập nhật HUD */
  private commit(prev: PuzzleState, transition: Transition | null, subject: FeedbackSubject): void {
    if (!transition) return;
    this.feedback.handle(feedbackEvents(prev, transition, this.level, subject));
    this.refreshView();
    if (transition.becameWon) this.playCelebration(this.layout); // Task 9 chuyển vào FeedbackDirector
  }
```

5. Pointer handlers thay toàn bộ:

```ts
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.controller.onPointerDown(pointer.x, pointer.y, layout)) return;
      const pieceId = this.controller.getSnapshot().dragInfo?.pieceId;
      if (pieceId) this.feedback.handle([{ type: 'lift', pieceId }]);
      this.refreshView();
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.controller.onPointerMove(pointer.x, pointer.y, layout);
    });

    const release = (pointer: Phaser.Input.Pointer) => {
      const pieceId = this.controller.getSnapshot().dragInfo?.pieceId ?? null;
      const prev = this.controller.getPuzzleState();
      this.commit(prev, this.controller.onPointerUp(pointer.x, pointer.y, layout), { command: 'move', pieceId });
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.input.on('gameout', () => {
      const pieceId = this.controller.getSnapshot().dragInfo?.pieceId ?? null;
      const prev = this.controller.getPuzzleState();
      this.commit(prev, this.controller.onPointerCancel(), { command: 'move', pieceId });
    });
```

6. Callback HUD `onRotate`:

```ts
      onRotate: () => {
        const pieceId = this.controller.getSnapshot().selectedPieceId;
        const prev = this.controller.getPuzzleState();
        this.commit(prev, this.controller.onRotate(), { command: 'rotate', pieceId });
      },
```

   `onReset` (HUD) và `onRestart` (PauseDialog) cùng gọi `this.resetLevel()`:

```ts
  private resetLevel(): void {
    const prev = this.controller.getPuzzleState();
    const transition = this.controller.onReset();
    this.cleanupCelebration();
    this.boardRenderer.setVictoryMode(false);
    this.hud.hideWinModal();
    this.commit(prev, transition, { command: 'reset', pieceId: null });
  }
```

7. `update()`:

```ts
  update(_time: number, delta: number): void {
    if (this.loadFailed) return;
    this.textureCache.bakeNext();
    this.feedback.tick(delta);
    const snapshot = this.controller.getSnapshot();
    this.boardRenderer.tick(delta, snapshot, this.controller.getPuzzleState().pieces);
    this.hud.tickSnapHint(delta, this.snapHintTarget(snapshot));
  }

  private snapHintTarget(snapshot: PlayViewSnapshot): { x: number; y: number } | null {
    const drag = snapshot.dragInfo;
    if (!drag || drag.snapCandidateId === null) return null;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    const radius = piece ? pieceRadiusPx(piece.frameSize, this.layout) : 120;
    return { x: drag.x + radius * 0.8, y: drag.y + radius * 0.5 };
  }
```

   Xoá `updateSnapHint` (Task 6) và mọi lời gọi `showSnapHint`/`hideSnapHint`. `refreshView()` chỉ còn `this.hud.update(this.controller.getSnapshot());`.
8. `autosolve`: thay `this.refreshView(); if (transition?.becameWon) this.playCelebration(layout);` bằng `this.commit(prev, transition, { command: 'move', pieceId: piece.id });` với `const prev = this.controller.getPuzzleState();` ngay trước `onPointerUp`; nhánh `drag` giữ `this.refreshView()`.

- [ ] **Step 4: Typecheck, test**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 5: Kiểm thủ công trên harness**

Run: `npm run dev`. Trên `/?scene=play&level=1-1&mode=harness` và `level=1-4`:
- Nhấc: mảnh phồng 1.08, bóng hiện và lệch xa dần.
- Vào vùng hít: mảnh bị hút nhẹ, bóng mục tiêu sáng dần, nhãn "Thả để khớp" hiện mượt và bám theo.
- Khớp: trượt vào, nảy, vòng ice lan ra, biểu tượng thanh đếm bật lên.
- Thả tạm: hạ mượt, mờ 0.6. Thả vào khay: bay về nhỏ dần.
- Đặt 2 mảnh chồng: vùng giao mờ dần kèm vệt sáng chạy dọc mép; khi đang kéo mảnh thứ hai vào neo chồng, thấy trước nét vùng giao.
- Đặt lại: mảnh bay về khay so le.
- Nhấc lại mảnh đang bay về khay: không nhảy.
- Bật Giảm chuyển động: mọi vị trí tức thời, không vòng/vệt; vùng giao vẫn mờ trong 150 ms.
- Xoay (cần màn `fixture-rotate` của F3; nếu chưa có, tạm bật `rotationEnabled` trong bản sao cục bộ không commit): xoay mượt, ánh sáng mặt vát vẫn trên-trái; xoay sát mép: lắc và nháy viền.

- [ ] **Step 6: Changelog và commit**

```markdown
### 2026-10-03 - Play per-interaction feedback (F2 task 8)

- Added `game-next/src/presentation/feedback/FeedbackDirector.ts`: lift, magnet-assisted snap glide with bounce, ice ring and counter pop, temporary settle, tray return, rotation spin with lazily baked orientations, blocked-rotation shake and outline flash, overlap edge traces and revive flashes, staggered reset, and haptic cues for each event; short effects run on F1 transition timelines.
- `Hud` now fades and follows the snap hint smoothly, pops the match-bar icon and fades the rotate button; `PlayScene` routes every command through `feedbackEvents`.
- Verification: `npm run typecheck` and `npm test` passed; manual harness check of 1-1 and 1-4 with and without reduced motion.
```

```bash
git add game-next/src/presentation/feedback/FeedbackDirector.ts game-next/src/presentation/Hud.ts game-next/src/presentation/PlayScene.ts CHANGELOG.md
git commit -m "feat(feel): play per-interaction feedback and smooth HUD cues"
```

---

### Task 9: Chuỗi thắng 1800 ms

**Files:**
- Create: `game-next/src/presentation/feedback/victorySequence.ts`
- Modify: `game-next/src/presentation/transitions/stardust.ts` (thêm `planBurst`, `burstAt`)
- Modify: `game-next/src/presentation/feedback/FeedbackDirector.ts`
- Modify: `game-next/src/presentation/Hud.ts` (thẻ thắng dàn dựng)
- Modify: `game-next/src/presentation/BackgroundScene.ts` (`deepen`)
- Modify: `game-next/src/presentation/PlayScene.ts` (bỏ `playCelebration`, `cleanupCelebration`, `celebrationContainer`)
- Test: `game-next/tests/victorySequence.test.ts`, `game-next/tests/transitionRoutes.test.ts` (thêm test `planBurst`)

**Interfaces:**
- Consumes: `VICTORY_TOKENS`, `stagger`, `enter`, `exit`, `TransitionTimeline`, `SKY_MOODS`.
- Produces:
  - `VICTORY_CARD_GROUPS = 4`; `type VictoryPlan`; `victoryPlan(pieceCount, reduced): VictoryPlan`; `victoryEndMs(plan): number`
  - `planBurst(center, count, random?, minDist?, maxDist?): DustParticle[]`; `burstAt(p, t)`
  - `FeedbackDirector.playVictory()`, `isVictoryRunning()`, `skipVictory()`, `unwindVictory(onDone)`
  - `Hud.playWinCard(tl, plan, verse?)`, `Hud.unwindWinCard(tl, ms)`, `Hud.showWinModal(verse?)` (tức thời)
  - `BackgroundScene.deepen(extraDim: number, durationMs: number): void`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/victorySequence.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { VICTORY_CARD_GROUPS, victoryEndMs, victoryPlan } from '../src/presentation/feedback/victorySequence.ts';
import { VICTORY_TOKENS } from '../src/presentation/designTokens.ts';

describe('lịch chuỗi thắng (spec F2 mục 4)', () => {
  test.each([1, 2, 3, 6])('%i mảnh: kết thúc đúng 1800 ms, mảnh sáng trong 300–900', (n) => {
    const plan = victoryPlan(n, false);
    expect(victoryEndMs(plan)).toBe(1800);
    expect(plan.lightStartsMs).toHaveLength(n);
    expect(plan.lightStartsMs[0]).toBe(300);
    expect(Math.max(...plan.lightStartsMs) + plan.lightMs).toBeLessThanOrEqual(900);
  });

  test('3 mảnh cách nhau 90 ms', () => {
    expect(victoryPlan(3, false).lightStartsMs).toEqual([300, 390, 480]);
  });

  test('≤ 30 hạt; vòng xong trước 1800', () => {
    const plan = victoryPlan(3, false);
    expect(plan.particles).toBeLessThanOrEqual(30);
    expect(plan.burstAtMs + VICTORY_TOKENS.ringGapMs + VICTORY_TOKENS.ringMs).toBeLessThanOrEqual(1800);
  });

  test('thẻ thắng: 4 nhóm, nhóm cuối kết thúc ở 1800', () => {
    const plan = victoryPlan(2, false);
    expect(plan.cardAtMs + (VICTORY_CARD_GROUPS - 1) * plan.cardItemGapMs + plan.cardItemMs).toBe(1800);
  });

  test('Giảm chuyển động: 150 ms, không hạt/vòng/vệt/flash/trượt', () => {
    const plan = victoryPlan(3, true);
    expect(victoryEndMs(plan)).toBe(150);
    expect(plan).toMatchObject({
      particles: 0, rings: false, cameraFlash: false, traceMs: 0, lightStartsMs: [], skyDim: null, cardSlidePx: 0,
    });
  });
});
```

Thêm vào `tests/transitionRoutes.test.ts` (trong `describe('bụi sao', …)`):

```ts
  test('planBurst: bung từ tâm ra ngoài trong 40–200 px, alpha cố định, tối đa 30', () => {
    const ps = planBurst(center, 99, seq([0.25, 0.5, 0.75]));
    expect(ps).toHaveLength(STARDUST_MAX);
    for (const p of ps) {
      expect(p.x0).toBe(center.x);
      const d = Math.hypot(p.x1 - center.x, p.y1 - center.y);
      expect(d).toBeGreaterThanOrEqual(40);
      expect(d).toBeLessThanOrEqual(200);
    }
    expect(burstAt(ps[0], 1).alpha).toBe(0);
    expect(burstAt(ps[0], 0).alpha).toBe(ps[0].alpha);
  });
```

(Import thêm `planBurst`, `burstAt` ở đầu file.)

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/victorySequence.test.ts tests/transitionRoutes.test.ts`
Expected: FAIL — thiếu module và hàm.

- [ ] **Step 3: Viết `victorySequence.ts`**

`game-next/src/presentation/feedback/victorySequence.ts`:

```ts
import { VICTORY_TOKENS } from '../designTokens.ts';
import { stagger } from '../transitions/motion.ts';

/** Nhãn, tên màn, câu thơ, hàng nút */
export const VICTORY_CARD_GROUPS = 4;

export type VictoryPlan = {
  totalMs: number;
  skyDim: { atMs: number; ms: number; extra: number } | null;
  lightStartsMs: number[];
  lightMs: number;
  lightPeak: number;
  traceAtMs: number;
  traceMs: number;
  burstAtMs: number;
  particles: number;
  particleMs: number;
  rings: boolean;
  cameraFlash: boolean;
  frameAtMs: number;
  frameMs: number;
  trayFadeMs: number;
  cardAtMs: number;
  cardMs: number;
  cardSlidePx: number;
  cardItemGapMs: number;
  cardItemMs: number;
};

export function victoryPlan(pieceCount: number, reduced: boolean): VictoryPlan {
  const T = VICTORY_TOKENS;
  if (reduced) {
    const ms = T.reducedMs;
    return {
      totalMs: ms, skyDim: null, lightStartsMs: [], lightMs: 0, lightPeak: 0, traceAtMs: 0, traceMs: 0,
      burstAtMs: 0, particles: 0, particleMs: 0, rings: false, cameraFlash: false,
      frameAtMs: 0, frameMs: ms, trayFadeMs: ms, cardAtMs: 0, cardMs: ms, cardSlidePx: 0,
      cardItemGapMs: 0, cardItemMs: ms,
    };
  }
  // Nhiều mảnh thì thu khoảng cách để mảnh cuối vẫn tắt trước 900 ms
  const span = Math.min(T.lightGapMs * Math.max(0, pieceCount - 1), T.lightsEndMs - T.lightsAtMs - T.lightMs);
  return {
    totalMs: T.totalMs,
    skyDim: { atMs: T.skyDimAtMs, ms: T.skyDimMs, extra: T.skyDimExtra },
    lightStartsMs: Array.from({ length: pieceCount }, (_, i) => T.lightsAtMs + stagger(i, pieceCount, span)),
    lightMs: T.lightMs,
    lightPeak: T.lightPeak,
    traceAtMs: T.traceAtMs,
    traceMs: T.traceMs,
    burstAtMs: T.burstAtMs,
    particles: T.particles,
    particleMs: T.particleMs,
    rings: true,
    cameraFlash: true,
    frameAtMs: T.frameAtMs,
    frameMs: T.frameMs,
    trayFadeMs: T.trayFadeMs,
    cardAtMs: T.cardAtMs,
    cardMs: T.cardMs,
    cardSlidePx: T.cardSlidePx,
    cardItemGapMs: T.cardItemGapMs,
    cardItemMs: T.cardMs - T.cardItemGapMs * (VICTORY_CARD_GROUPS - 1),
  };
}

export function victoryEndMs(plan: VictoryPlan): number {
  const T = VICTORY_TOKENS;
  return Math.max(
    ...plan.lightStartsMs.map((s) => s + plan.lightMs),
    plan.traceAtMs + plan.traceMs,
    plan.rings ? plan.burstAtMs + T.ringGapMs + T.ringMs : 0,
    plan.burstAtMs + plan.particleMs,
    plan.frameAtMs + Math.max(plan.frameMs, plan.trayFadeMs),
    plan.cardAtMs + plan.cardMs,
    plan.cardAtMs + (VICTORY_CARD_GROUPS - 1) * plan.cardItemGapMs + plan.cardItemMs
  );
}
```

- [ ] **Step 4: `planBurst` trong `stardust.ts`**

Thêm cuối `game-next/src/presentation/transitions/stardust.ts`:

```ts
/** Hạt bung từ tâm ra ngoài (chuỗi thắng); alpha cố định, tắt dần khi bay */
export function planBurst(
  center: Point,
  count: number,
  random: () => number = Math.random,
  minDist = 40,
  maxDist = 200
): DustParticle[] {
  const n = Math.min(STARDUST_MAX, Math.max(0, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const dist = minDist + random() * (maxDist - minDist);
    return {
      x0: center.x,
      y0: center.y,
      x1: center.x + Math.cos(angle) * dist,
      y1: center.y + Math.sin(angle) * dist,
      radius: 1.5 + random() * 2,
      color: DUST_COLORS[i % DUST_COLORS.length],
      alpha: 0.7 + random() * 0.3,
    };
  });
}

export function burstAt(p: DustParticle, t: number): { x: number; y: number; alpha: number; radius: number } {
  return {
    x: p.x0 + (p.x1 - p.x0) * t,
    y: p.y0 + (p.y1 - p.y0) * t,
    alpha: p.alpha * (1 - t),
    radius: p.radius * (1 - 0.3 * t),
  };
}
```

- [ ] **Step 5: `BackgroundScene.deepen`**

Thêm vào `BackgroundScene.ts` (import `SKY_MOODS` đã có):

```ts
  /** Chuỗi thắng: trời tối thêm `extraDim` so với mood play. setMood kế tiếp sẽ đưa về. */
  deepen(extraDim: number, durationMs: number): void {
    if (!this.sky) return;
    this.tweens.killTweensOf(this.sky.moodState);
    this.tweens.add({
      targets: this.sky.moodState,
      dim: SKY_MOODS.play.dim + extraDim,
      duration: durationMs,
      ease: 'Sine.easeOut',
    });
  }
```

- [ ] **Step 6: HUD — thẻ thắng dàn dựng**

Trong `Hud.ts`:

1. Field `private winItems: Poseable[][] = [];` — cuối khối dựng thẻ thắng (trước `this.winContainer.add([...])`): `this.winItems = [[winLabel], [winTitle], [winVerse], [selectBtnBg, selectBtn, nextBtnBg, nextBtn]];`
2. Import `enter`, `exit`, `type Poseable` từ `./transitions/choreography.ts`; `type TransitionTimeline`; `type VictoryPlan` từ `./feedback/victorySequence.ts`.
3. Thay `showWinModal` và `hideWinModal`:

```ts
  /** Nội dung và chỗ đứng của thẻ; không đụng tư thế để dàn dựng tự lo */
  private prepareWinModal(victoryVerse?: string): void {
    this.winVerseText
      .setText(victoryVerse ? `“${victoryVerse}”` : '')
      .setVisible(Boolean(victoryVerse));
    // Thẻ chiếm chỗ hàng đáy, nên nút và thanh đếm phải nhường chỗ
    this.resetContainer.setVisible(false);
    this.rotateContainer.setVisible(false);
    this.matchBar.setVisible(false);
    this.winContainer.setVisible(true);
  }

  /** Hiện ngay (khôi phục trạng thái đã thắng) */
  public showWinModal(victoryVerse?: string): void {
    this.winContainer.setPosition(0, 0).setAlpha(1);
    this.prepareWinModal(victoryVerse);
  }

  /**
   * Chuỗi thắng: thẻ trượt lên, bốn nhóm con hiện so le. Mọi `enter` lên lịch
   * ngay (đặt tư thế lệch lúc thẻ còn ẩn); lời gọi hiện thẻ ở cùng mốc đứng
   * sau các tween, nên `complete()` gói gọn trong một lượt xử lý.
   */
  public playWinCard(tl: TransitionTimeline, plan: VictoryPlan, victoryVerse?: string): void {
    enter(tl, this.winContainer, plan.cardAtMs, plan.cardMs, { dy: plan.cardSlidePx, alpha: 0 });
    this.winItems.forEach((group, i) => {
      for (const item of group) {
        enter(tl, item, plan.cardAtMs + i * plan.cardItemGapMs, plan.cardItemMs, { alpha: 0 });
      }
    });
    tl.call(plan.cardAtMs, () => this.prepareWinModal(victoryVerse));
  }

  public unwindWinCard(tl: TransitionTimeline, ms: number): void {
    exit(tl, this.winContainer, 0, ms, { dy: 60, alpha: 0 });
    tl.call(ms, () => this.hideWinModal());
  }

  public hideWinModal(): void {
    this.winContainer.setVisible(false).setPosition(0, 0).setAlpha(1);
    this.resetContainer.setVisible(true);
    this.rotateContainer.setVisible(this.rotateAllowed);
    this.matchBar.setVisible(true);
  }
```

- [ ] **Step 7: `FeedbackDirector` — chuỗi thắng**

Thêm vào `FeedbackDirector.ts` (import `victoryPlan`, `type VictoryPlan`, `VICTORY_TOKENS`, `planBurst`, `burstAt`, `gridPolygon`):

```ts
  private victory: TransitionTimeline | null = null;
  private victoryCleanup: Array<() => void> = [];
  isVictoryRunning(): boolean {
    return this.victory !== null && !this.victory.isFinished();
  }

  /** Chạm khi đang chạy: khung vàng, thẻ hiện, không còn hạt */
  skipVictory(): void {
    if (!this.victory) return;
    this.victory.complete(); // chạy mọi call còn lại: setVictoryMode(true), hiện thẻ
    for (const clean of this.victoryCleanup) clean();
    this.victoryCleanup = [];
  }

  playVictory(): void {
    const { scene, board, hud, level, layout } = this.deps;
    const plan = victoryPlan(level.pieces.length, isReducedMotion());
    const tl = new TransitionTimeline();
    this.victory = tl;

    if (plan.skyDim) {
      const dim = plan.skyDim;
      tl.call(dim.atMs, () => this.deps.background()?.deepen(dim.extra, dim.ms));
    }

    level.pieces.forEach((piece, i) => {
      const start = plan.lightStartsMs[i];
      if (start === undefined) return;
      tl.call(start, () => board.getPieceView(piece.id)?.play('light', plan.lightMs, plan.lightPeak));
    });

    if (plan.traceMs > 0) {
      for (const placement of level.targetPlacements ?? []) {
        const piece = level.pieces.find((p) => p.id === placement.pieceId);
        if (!piece) continue;
        const pts = gridPolygon(piece, placement.x, placement.y, placement.turns).map((p) => gridToCanvas(p.x, p.y, layout));
        const g = scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1);
        this.victoryCleanup.push(() => g.destroy());
        const s = { p: 0 };
        const draw = () => {
          g.clear();
          const seg = perimeterSegment(pts, s.p, 0.3);
          if (seg.length < 2) return;
          g.lineStyle(3, COLOR_NUMBERS.amberGlow, 1 - s.p);
          g.strokePoints(toGeom(seg), false, false);
        };
        tl.at(plan.traceAtMs, s, { p: 1 }, plan.traceMs, 'cubicInOut', draw);
        tl.call(plan.traceAtMs + plan.traceMs, () => g.destroy());
      }
    }

    tl.call(plan.burstAtMs, () => {
      this.deps.haptics.notify('success');
      if (plan.cameraFlash) scene.cameras.main.flash(VICTORY_TOKENS.flashMs, 249, 199, 79, false);
    });
    if (plan.rings || plan.particles > 0) this.burst(tl, plan);

    const gold = board.getGoldFrame();
    if (gold) tl.at(plan.frameAtMs, gold, { alpha: 1 }, plan.frameMs, 'sineInOut');
    for (const part of board.getTrayParts()) tl.at(plan.frameAtMs, part, { alpha: 0 }, plan.trayFadeMs, 'linear');
    tl.call(plan.frameAtMs + Math.max(plan.frameMs, plan.trayFadeMs), () => board.setVictoryMode(true));

    hud.playWinCard(tl, plan, level.victoryVerse);
    tl.advance(0);
  }

  private burst(tl: TransitionTimeline, plan: VictoryPlan): void {
    const { scene, level, layout } = this.deps;
    const centroid = maskCentroid(level.targetMask) ?? { x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
    const c = gridToCanvas(centroid.x, centroid.y, layout);
    const g = scene.add.graphics().setDepth(90);
    this.victoryCleanup.push(() => g.destroy());
    const particles = planBurst(c, plan.particles);
    const s = { r1: 10, a1: 0, r2: 10, a2: 0, t: 0 };
    const draw = () => {
      g.clear();
      if (s.a1 > 0) { g.lineStyle(2.5, 0xffd166, s.a1); g.strokeCircle(c.x, c.y, s.r1); }
      if (s.a2 > 0) { g.lineStyle(1.8, 0x4ecdc4, s.a2); g.strokeCircle(c.x, c.y, s.r2); }
      for (const p of particles) {
        const d = burstAt(p, s.t);
        if (d.alpha <= 0) continue;
        g.fillStyle(p.color, d.alpha);
        g.fillCircle(d.x, d.y, d.radius);
      }
    };
    const T = VICTORY_TOKENS;
    if (plan.rings) {
      tl.call(plan.burstAtMs, () => { s.a1 = 0.9; });
      tl.at(plan.burstAtMs, s, { r1: 160, a1: 0 }, T.ringMs, 'cubicOut', draw);
      tl.call(plan.burstAtMs + T.ringGapMs, () => { s.a2 = 0.8; });
      tl.at(plan.burstAtMs + T.ringGapMs, s, { r2: 180, a2: 0 }, T.ringMs, 'cubicOut', draw);
    }
    if (particles.length > 0) tl.at(plan.burstAtMs, s, { t: 1 }, plan.particleMs, 'cubicOut', draw);
    tl.call(plan.burstAtMs + Math.max(plan.particleMs, T.ringGapMs + T.ringMs), () => g.destroy());
  }

  /** Đặt lại từ thẻ thắng: thẻ và khung chạy ngược 300 ms (≤ 150 khi Giảm chuyển động) rồi mới đặt lại */
  unwindVictory(onDone: () => void): void {
    if (this.victory && !this.victory.isFinished()) this.skipVictory();
    this.victory = null;
    const { board, hud } = this.deps;
    const ms = isReducedMotion() ? VICTORY_TOKENS.reducedMs : VICTORY_TOKENS.unwindMs;
    const tl = this.fx();
    board.setTrayVisible(true, 0);
    hud.unwindWinCard(tl, ms);
    const gold = board.getGoldFrame();
    if (gold) tl.at(0, gold, { alpha: 0 }, ms, 'sineInOut');
    for (const part of board.getTrayParts()) tl.at(0, part, { alpha: 1 }, ms, 'linear');
    tl.call(ms, () => {
      board.setVictoryMode(false);
      onDone();
    });
    tl.advance(0);
  }
```

   Trong `visual`, nhánh `'won'`: `this.playVictory(); return;`. Import `maskCentroid` (`../../domain/mask.ts`), `GRID_WIDTH`, `GRID_HEIGHT` (`../../domain/model.ts`). Thay `tick`:

```ts
  tick(dtMs: number): void {
    if (this.victory) {
      this.victory.advance(dtMs);
      if (this.victory.isFinished()) this.victoryCleanup = [];
    }
    for (const tl of this.effects) tl.advance(dtMs);
    this.effects = this.effects.filter((tl) => !tl.isFinished());
  }
```

- [ ] **Step 8: `PlayScene` bỏ màn thắng cũ**

1. Xoá `playCelebration`, `cleanupCelebration`, field `celebrationContainer`, import `maskCentroid` nếu không còn dùng.
2. `commit()`: bỏ dòng `if (transition.becameWon) this.playCelebration(…)` (sự kiện `won` đã gọi `playVictory`).
3. `pointerdown`: dòng đầu handler:

```ts
      if (this.feedback.isVictoryRunning()) {
        this.feedback.skipVictory();
        return;
      }
```

4. `resetLevel()`:

```ts
  private resetLevel(): void {
    const run = () => {
      const prev = this.controller.getPuzzleState();
      this.commit(prev, this.controller.onReset(), { command: 'reset', pieceId: null });
    };
    if (this.controller.getSnapshot().phase === 'won') this.feedback.unwindVictory(run);
    else run();
  }
```

- [ ] **Step 9: Chạy test, typecheck, kiểm thủ công**

Run: `npx vitest run tests/victorySequence.test.ts tests/transitionRoutes.test.ts && npm run typecheck && npm test`
Expected: PASS.

Run: `npm run dev`, `/?scene=play&level=1-6&mode=harness&autosolve=win` và chơi tay 1-1:
- Đúng thứ tự: khớp mảnh cuối → nghỉ → trời tối nhẹ → các mảnh chớp lần lượt → vệt sáng chạy quanh → flash + 2 vòng + bụi sao → khung chuyển vàng, khay mờ → thẻ trượt lên, 4 nhóm hiện so le.
- Chạm giữa chừng: lên ngay khung vàng và thẻ, không còn hạt.
- "Đặt lại" trên thẻ: thẻ trượt xuống, khung về kính, khay hiện lại, rồi mảnh bay về khay.
- "Màn tiếp theo": chạy tuyến `next-level` của F1 bình thường.
- Giảm chuyển động: chỉ còn khung và thẻ mờ trong 150 ms, vẫn rung `success` trên Android.

- [ ] **Step 10: Changelog và commit**

```markdown
### 2026-10-03 - Stage the 1800 ms victory sequence (F2 task 9)

- Added `game-next/src/presentation/feedback/victorySequence.ts` (pure schedule, 150 ms under reduced motion) and the victory timeline in `FeedbackDirector`: hold, sky deepening, staggered piece flashes, amber traces around each target placement, flash with two 600 ms resonance rings and at most 30 fixed-alpha particles, gold-frame crossfade with tray fade, and a sliding win card with four staggered groups; tap skips to the end state and resetting from the card unwinds it first.
- Removed the old `playCelebration` from `PlayScene`; added `BackgroundScene.deepen` and `planBurst` / `burstAt`.
- Verification: `tests/victorySequence.test.ts` and the new burst test failed before the change, then passed; `npm run typecheck` and `npm test` passed; manual harness check of 1-1 and 1-6 including skip, unwind and reduced motion.
```

```bash
git add game-next/src/presentation game-next/tests/victorySequence.test.ts game-next/tests/transitionRoutes.test.ts CHANGELOG.md
git commit -m "feat(feel): stage the skippable victory sequence"
```

---

### Task 10: Nối với chuyển cảnh F1 và kiểm tra cuối

**Files:**
- Modify: `game-next/src/presentation/transitions/routes.ts` (bước `trayPieces` của `playIn`)
- Modify: `game-next/README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `BoardRenderer.getTransitionParts().trayPieces` — từ Task 6 là các `PieceView.offset` theo thứ tự mảnh.

- [ ] **Step 1: Mảnh rơi vào khay từng mảnh**

Trong `routes.ts`, hàm `playIn`, thay dòng `trayPieces` (và comment F1 phía trên nó):

```ts
    // Từng mảnh rơi vào ô khay: y −60 → 0, scale 0.6 → 1, so le (spec F1 mục 3.1)
    { part: 'trayPieces', atMs: 950, durationMs: 220, delta: { dy: -60, scale: 0.6, alpha: 0 }, ease: 'backOut', spanMs: 180 },
```

Kết thúc 950 + 180 + 220 = 1350, đúng spec F1 mục 3.1. `tests/transitionRoutes.test.ts` vẫn đạt (bước kết thúc muộn nhất vẫn là HUD ở 1500).

- [ ] **Step 2: Kiểm `transitionView()` của PlayScene**

`PlayScene.transitionView()` (F1 Task 9) đọc `board.trayPieces` và `board.pieces` — từ Task 6 đã là `offset` của `PieceView`, nên không cần sửa. Xác nhận bằng `npm run typecheck`.

- [ ] **Step 3: Rà Giảm chuyển động**

`grep -rn "tweens.add\|scene.tweens" src/presentation/Hud.ts src/presentation/feedback src/presentation/PieceView.ts src/presentation/BoardRenderer.ts` — mọi tween dịch vị trí/scale phải qua `scaleTiming` hoặc có nhánh `isReducedMotion()`; tween alpha ≤ 150 ms được giữ. Đối chiếu từng dòng với spec F2 mục 5; mục nào lệch thì sửa tại chỗ trong task này.

- [ ] **Step 4: Chạy đủ bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: tất cả PASS (Vite có thể còn cảnh báo chunk lớn có từ trước).

- [ ] **Step 5: Đối chiếu spec**

| Spec F2 | Ở đâu |
|---|---|
| 2.1 Vòng render | Task 6 (`tick`, `PlayScene.update`) |
| 2.2 Mảnh texture | Task 5, Task 6 (lệch 1–3 ở đầu plan) |
| 2.3 Tư thế | Task 2, `PieceView` Task 6 |
| 2.4 Sự kiện | Task 3 (lệch 4) |
| 2.5 FeedbackDirector | Task 8, 9 |
| 2.6 Rung | Task 4, nối ở Task 8 |
| 2.7 Giảm tải kéo | Task 1 |
| 3 Từng tương tác | Task 6 (kéo, hút, bóng mục tiêu, xem trước, vùng giao mờ), Task 8 (còn lại) |
| 4 Chuỗi thắng | Task 9 (lệch 5, 6) |
| 5 Giảm chuyển động | Task 2–9, rà ở Step 3 |
| 7.1 Test tự động | `pieceMotion`, `feedbackEvents`, `parityDiff`, `victorySequence`, `haptics`, `playControllerCache`, `pieceTextureCache`, `boardRendererLayers`, `boardRendererParity`, `progress` |
| 7.2 Nghiệm thu thủ công | Plan F3 |

- [ ] **Step 6: README**

Trong `game-next/README.md`, sau đoạn "Chuyển cảnh" của F1:

```markdown
### Phản hồi trong màn

Mảnh là `PieceView` (texture vẽ một lần trong `PieceTextureCache`, một mảnh mỗi khung). `BoardRenderer.tick()` chạy mỗi khung từ `PlayScene.update`; mọi lệnh người chơi đi qua `feedbackEvents()` rồi `FeedbackDirector.handle()`. Thời lượng ở `FEEDBACK_TOKENS` và `VICTORY_TOKENS` trong `designTokens.ts`.
```

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Complete F2 in-level game feel

- Pieces now drop into the tray one by one during the F1 play-in (950-1350 ms, 0.6 → 1 scale); documented the feedback entry points in `game-next/README.md`; audited reduced-motion handling against spec F2 section 5.
- Verification: `npm run typecheck`, `npm test`, `npm run content:validate` and `npm run build` passed; spec F2 sections 2-7 cross-checked. Device acceptance is tracked by plan F3.
```

```bash
git add game-next/src/presentation/transitions/routes.ts game-next/README.md CHANGELOG.md
git commit -m "feat(feel): drop tray pieces individually and document feedback flow"
```

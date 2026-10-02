# D — Chế độ đặt tự do (hít vào giao điểm lưới) và bộ giải nghiệm duy nhất

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chế độ `placement: 'free'` cho từng màn: mảnh hít vào mọi giao điểm lưới (bội của 8) thay vì neo do tác giả đặt; kèm bộ giải gặp-nhau-ở-giữa dùng băm XOR 64 bit chứng minh nghiệm duy nhất, dùng chung cho cả màn neo.

**Architecture:** Luật hít nằm trong một hàm thuần `nearestGridOrigin` ở `domain/freePlacement.ts`; `session.ts` (lệnh thả) và `drag.ts` (xem trước và thả) cùng gọi hàm đó nên vị trí xem trước luôn trùng vị trí thả. Mảnh hít ở màn `free` mang trạng thái mới `placed` (gốc khung nằm ngay trong trạng thái). Renderer và hit test đọc gốc khung qua một hàm chung `pieceBoardOrigin` trong `layout.ts`. Bộ giải `content/solver.ts` dựng không gian tư thế (neo hoặc giao điểm lưới × hướng hiệu dụng + khay), băm XOR, chia đôi cân bằng tích số lựa chọn, tra bảng băm mảng định kiểu và kiểm lại mọi kết quả trùng băm bằng mask thật. `authoringReport.searchSolutions` chuyển sang gọi bộ giải; `content:validate --release` chặn màn chưa chứng minh.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Node 24 `--experimental-strip-types`, Phaser 3.90, Chrome headless để chụp ảnh.

**Spec:** `docs/superpowers/specs/2026-10-02-d-free-placement-design.md`

**Giao được gì:** màn dev `dev-free-placement` (4 mảnh khung 48, chỉ neo A) mở được bằng `?scene=play&level=dev-free-placement&mode=harness`, mảnh hít vào giao điểm kèm nhãn "Thả để khớp", thắng được; bộ giải báo `proven = true`, 1 nghiệm; mọi màn chế độ neo giữ nguyên hành vi và số nghiệm.

## Vị trí trong loạt plan

- **Chạy sau:** plan A (`2026-10-02-a-shapes-v2.md`) và plan B (`2026-10-02-b-level-kit-chapters.md`) — phải xong và xanh. Làm trên nhánh mới tách từ nhánh của plan B: `feat/free-placement`.
- **Song song được với:** plan C (`2026-10-02-c-chapter-2-hoa-pham-levels.md`). Plan C không đổi `session.ts`, `drag.ts`, `authoringReport.ts`; nếu C merge trước, test hồi quy ở Task 5 tự phủ thêm các màn của C.
- **Chạy tiếp theo:** plan E (Xưởng — `2026-10-02-e-level-studio-design.md`), dùng `nearestGridOrigin`, `solveLevel` và cách nạp màn dev của plan này.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Script chạy bằng `node --experimental-strip-types`: không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Luật hiện/ẩn giữ **chẵn lẻ (XOR)** trong `domain/mask.ts`; không sửa file đó.
- Lưới 128 × 160 ô logic; giao điểm lưới hiển thị là bội của `GRID_STEP = 8`; bán kính hít `d² ≤ SNAP_RADIUS_SQ = 36` (6 ô), đo giữa gốc khung thả và gốc khung ứng viên (tương đương đo giữa hai tâm).
- Canvas 720 × 1280; bàn ở `(40, 200)`, 5px mỗi ô logic; khay ở `(40, 1016)` cao 136.
- Màn chế độ neo (`placement` thiếu hoặc `'anchors'`) **không đổi hành vi**: mọi test cũ phải xanh, `npm run content:author -- --all` không làm đổi file `src/content/levels/*.json` nào.
- Không thêm dependency.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md` (gốc repo): `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, các gạch đầu dòng thay đổi kèm file, dòng cuối `- Verification: <lệnh và kết quả>`.
- Commit message tiếng Anh `type(scope): summary`, kết thúc bằng hai dòng:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Co-authored-by: Codex <noreply@codex.local>`
  Trên Windows ghi message vào một file tạm ngoài repo rồi dùng `git commit -F <file>`.
- Dev server cho ảnh chụp: `npm run dev -- --port 5173 --strictPort` chạy nền; ảnh lưu ở `docs/testing/levels/screens/`.

## Quyết định ngoài spec (đã chốt khi viết plan)

1. **Chỉ xét 4 giao điểm quanh điểm thả.** Spec FP-03 nói "ứng viên là mọi giao điểm vừa bàn, chọn gần nhất, xa hơn 6 thì không hít". Giao điểm cách nhau 8 nên mọi giao điểm ngoài 4 góc của ô lưới chứa `(gx, gy)` đều cách ≥ 8 > 6; `nearestGridOrigin` chỉ duyệt 4 góc theo thứ tự `y` tăng rồi `x` tăng với phép so `<`, cho kết quả giống hệt định nghĩa đầy đủ (kể cả luật hoà) mà không phải quét 336 giao điểm mỗi khung hình.
2. **Xem trước và thả dùng cùng đầu vào nguyên.** `drag.ts` làm tròn `tâm − nửa khung` thành số nguyên trước khi gọi `nearestGridOrigin`, và gửi đúng số nguyên đó (hoặc giao điểm đã chọn) vào lệnh `drop`. `session.ts` gọi lại `nearestGridOrigin` trên toạ độ lệnh nên luôn ra cùng kết quả.
3. **"Vừa bàn" theo ô, không theo khung.** Ứng viên và tư thế bộ giải dùng đúng ngữ nghĩa `fitsBoard` (mọi ô của mảnh trong bàn, gốc ≥ 0). Vì vậy mái hướng 6 khung 48 (chỉ cao 24 ô) có 198 tư thế chứ không phải 165. Màn chơi và bộ giải nhất quán với nhau.
4. **Hướng đại diện.** Khi xoay được, bộ giải lấy với mỗi hướng hiệu dụng khác nhau (`effectiveOrientation` của plan A) nấc `turns` nhỏ nhất, và ô của tư thế là `rotateCells(cells, frameSize, turns)` — đúng thứ game tính mask. Prototype cho thấy `rotateCells` của thoi 48 cho 4 tập ô khác nhau ở viền (quy tắc trên-trái), nhưng spec FP-06 chốt "thoi 1 hướng", nên bộ giải theo spec.
5. **Bảng băm bằng mảng định kiểu**, không dùng `Map` của JS: ở giới hạn 5 000 000 tổ hợp, `Map` khoá chuỗi tốn hàng trăm MB. Bảng dùng `Uint32Array` cho hai nửa mã băm, `Int32Array` cho đầu xích và xích (≈ 120 MB ở giới hạn).
6. **Khử trùng nghiệm theo khoá chuẩn.** Mỗi nghiệm khớp mask được quy về khoá: gom mảnh theo nhóm `shapeKind:orientation:frameSize`, trong nhóm sắp xếp chuỗi tư thế `x,y,turns` (hoặc `khay`). Hai mảnh giống hệt đổi chỗ cho cùng khoá → một nghiệm. Test cũ `đếm được nghiệm thứ hai khi hai mảnh giống nhau đổi chỗ được` (kỳ vọng 2) **đổi thành kỳ vọng 1** — đây là thay đổi chủ ý theo FP-08, không phải hồi quy.
7. **`SolutionReport` thêm ba trường** `proven`, `poseCounts`, `elapsedMs` (hợp đồng chỉ nêu `proven`; hai trường còn lại cần cho báo cáo màn `free`). Báo cáo markdown của màn neo **không đổi** (khối "đặt tự do" chỉ in khi `placement === 'free'`, dòng cảnh báo chỉ in khi `proven = false`), nên `content:author -- --all` không làm đổi báo cáo đã commit.
8. **Kiểm chéo trên bàn thu nhỏ:** xuất `buildPoseSpace(doc, board?)`, `solvePoseSpace(space, options?)` và `balancedSplit(optionCounts)`; `solveLevel(doc, options) = solvePoseSpace(buildPoseSpace(doc), options)`. Test dựng không gian tư thế 32 × 32 rồi so với một hàm duyệt hết viết riêng trong test. `SolverOptions` giữ đúng `{ limit?: number }`.
9. **Outcome của lệnh thả ở màn `free` vẫn là `'snapped'`** (trạng thái là `placed`), để FTUE, telemetry và hiệu ứng snap không phải đổi.
10. **Mã lỗi validator thêm** ngoài hợp đồng: `invalid-placement` (giá trị lạ) và `invalid-allow-unproven` (thiếu lý do).
11. **Một nguồn duy nhất cho màn thử `free`:** `FREE_DEMO_SOURCE` xuất từ `src/content/devLevels.ts` (file của plan A). Test bộ giải, test báo cáo và harness đều dùng nó; màn không vào manifest nên campaign không bao giờ thấy.
12. **Cổng phát hành là hàm thuần** `releaseBlocker(doc, report)` trong `authoringReport.ts` (test được); `scripts/validate-content.ts` chỉ chạy bộ giải khi có `--release`.
13. **Bóng mục tiêu ở màn `free`** sáng lên khi `snapCandidateId === "grid:<x>,<y>"` của placement mục tiêu (màn neo vẫn so theo id neo).

## Con số đã tính trước

Tính bằng prototype độc lập `dproto*.mjs` trong scratchpad khi viết plan (raster trên-trái như `shapes.ts`, `rotateCells` như `geometry.ts`, duyệt hết và gặp-nhau-ở-giữa viết riêng). Test khoá đúng các số này; nếu code ra số khác thì **dừng và đối chiếu**, không sửa test theo code.

| Trường hợp | Số tư thế mỗi mảnh | Ô mục tiêu | Tích nửa lớn | Nghiệm | Ít mảnh hơn |
|---|---|---|---|---|---|
| `FREE_DEMO_SOURCE`: vuông S1 (16,16), thoi D1 (16,16), tam giác hướng 1 T1 (64,64), mái hướng 6 T2 (40,104), khung 48, không xoay | 165, 165, 165, 198 | 2904 | 33 034 | 1 | 0 |
| cùng màn, `limit: 1000` | 165, 165, 165, 198 | 2904 | 33 034 > 1000 | `proven = false` | — |
| "một nghiệm": vuông (16,16) + thoi (64,64) | 165, 165 | 3456 | 166 | 1 | 0 |
| "hai nghiệm": vuông (16,16) + tam giác 0 và tam giác 2 cùng gốc (64,96) | 165, 165, 165 | 4608 | 27 556 | 2 | 0 |
| "vô nghiệm": một vuông, mục tiêu dịch phải 4 ô | 165 | 2304 | 166 | 0 | 0 |
| hai vuông giống hệt (16,16) và (64,64) | 165, 165 | 4608 | 166 | 1 (2 lần trùng băm gộp lại) | 0 |
| vuông + thoi + mảnh thừa tam giác 0 (40,104) không trong nghiệm mẫu | 165, 165, 165 | 3456 | 27 556 | 1 | 1 |
| bàn 32 × 32, xoay được: vuông 16 (0,0), tam giác 0 khung 16 (16,16), tam giác 2 khung 16 (16,16) | 9, 36, 36 | 512 | 370 | 8 (duyệt hết: 8) | 0 |
| cùng màn, không xoay | 9, 9, 9 | 512 | 100 | 2 (duyệt hết: 2) | 0 |
| 5 mảnh khung 48 (thêm vuông) | 165 × 4, 198 | — | **4 574 296** ≤ 5 000 000 | — | — |

- Mỗi mảnh khung 48 không xoay mà ô phủ kín khung (vuông, thoi, tam giác góc): `11 × 15 = 165` tư thế; mái hướng 5 (rộng 24 cột) có 210; mái hướng 6 (cao 24 hàng) có 198.
- `balancedSplit([166, 166, 166, 199]).maxProduct = 33 034`; `balancedSplit([166, 166, 166, 199, 166]).maxProduct = 4 574 296` (prototype ngây thơ giải hết 5 mảnh này trong 8,3 s; bản mảng định kiểu nhanh hơn).

---

### Task 1: Hàm hít giao điểm lưới `nearestGridOrigin`

**Files:**
- Create: `game-next/src/domain/freePlacement.ts`
- Test: `game-next/tests/freePlacement.test.ts` (file mới)

**Interfaces:**
- Consumes: `Piece`, `Turns` (`model.ts`); `fitsBoard`, `rotateCells` (`geometry.ts`); `shapeCells` (`shapes.ts`, chỉ trong test).
- Produces:
  - `GRID_STEP = 8`, `SNAP_RADIUS_SQ = 36`
  - `nearestGridOrigin(piece: Piece, turns: Turns, gx: number, gy: number): { x: number; y: number } | null`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/freePlacement.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type { Piece } from '../src/domain/model.ts';
import { GRID_STEP, SNAP_RADIUS_SQ, nearestGridOrigin } from '../src/domain/freePlacement.ts';
import { shapeCells } from '../src/domain/shapes.ts';

function makePiece(
  id: string,
  kind: 'square' | 'triangle',
  orientation: 0 | 5,
  x: number,
  y: number
): Piece {
  return {
    id,
    frameSize: 48,
    cells: shapeCells(kind, orientation, 48),
    anchors: [{ id: 'A', x, y }],
    color: 'amber',
    shapeKind: kind,
    orientation,
  };
}

const square = makePiece('S1', 'square', 0, 16, 16);
/** Mái hướng 5 (cạnh huyền bên trái): ô chỉ rộng 24 cột nên gốc x đi tới 104; xoay 1 nấc thành rộng 48 cột. */
const roof = makePiece('T5', 'triangle', 5, 8, 8);

describe('nearestGridOrigin (FP-03)', () => {
  test('hằng số lưới và bán kính hít', () => {
    expect(GRID_STEP).toBe(8);
    expect(SNAP_RADIUS_SQ).toBe(36);
  });

  test('giữa bàn: chọn giao điểm gần nhất', () => {
    expect(nearestGridOrigin(square, 0, 34, 59)).toEqual({ x: 32, y: 56 });
  });

  test('điểm xa nhất trong ô lưới (cách 4 góc như nhau, d² = 32) vẫn hít, hoà thì lấy y rồi x nhỏ', () => {
    expect(nearestGridOrigin(square, 0, 36, 60)).toEqual({ x: 32, y: 56 });
  });

  test('hoà theo y: ưu tiên y nhỏ hơn', () => {
    // (40,56) và (40,64) cùng d² = 25
    expect(nearestGridOrigin(square, 0, 37, 60)).toEqual({ x: 40, y: 56 });
  });

  test('hoà theo x: ưu tiên x nhỏ hơn', () => {
    // (56,40) và (64,40) cùng d² = 25
    expect(nearestGridOrigin(square, 0, 60, 37)).toEqual({ x: 56, y: 40 });
  });

  test('sát mép phải: giao điểm ngoài bàn bị bỏ, quá bán kính thì không hít', () => {
    // Vuông 48 chỉ vừa tới gốc x = 80
    expect(nearestGridOrigin(square, 0, 84, 40)).toEqual({ x: 80, y: 40 });
    // (88,40) cách 1 ô nhưng không vừa bàn; (80,40) cách 7 ô (d² = 49)
    expect(nearestGridOrigin(square, 0, 87, 40)).toBeNull();
  });

  test('toạ độ âm sát góc trên-trái vẫn hít vào (0,0)', () => {
    expect(nearestGridOrigin(square, 0, -3, -2)).toEqual({ x: 0, y: 0 });
  });

  test('hướng mới không vừa bàn thì không hít', () => {
    expect(nearestGridOrigin(roof, 0, 104, 40)).toEqual({ x: 104, y: 40 });
    expect(nearestGridOrigin(roof, 1, 104, 40)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/freePlacement.test.ts`
Expected: FAIL — không resolve được `../src/domain/freePlacement.ts`.

- [ ] **Step 3: Viết `freePlacement.ts`**

Tạo `game-next/src/domain/freePlacement.ts`:

```ts
import type { Piece, Turns } from './model.ts';
import { fitsBoard, rotateCells } from './geometry.ts';

/** Khoảng cách giữa hai giao điểm lưới hiển thị, đơn vị ô logic. */
export const GRID_STEP = 8;

/** Bán kính hít 6 ô, so bằng bình phương khoảng cách (giống màn neo). */
export const SNAP_RADIUS_SQ = 36;

/**
 * Giao điểm lưới để hít mảnh ở màn đặt tự do (spec D, FP-03).
 *
 * `(gx, gy)` là gốc khung tương ứng với tâm mảnh đang kéo. Ứng viên là các
 * giao điểm (8i, 8j) mà mảnh, ở hướng `turns`, nằm gọn trong bàn. Chọn ứng
 * viên gần nhất theo Euclid; hoà thì lấy y nhỏ hơn, rồi x nhỏ hơn. Xa hơn
 * 6 ô thì trả null.
 *
 * Giao điểm cách nhau 8 ô nên chỉ 4 góc của ô lưới chứa (gx, gy) có thể nằm
 * trong bán kính 6; mọi giao điểm khác cách ít nhất 8. Duyệt 4 góc theo thứ
 * tự y rồi x với phép so `<` cho đúng luật hoà.
 */
export function nearestGridOrigin(
  piece: Piece,
  turns: Turns,
  gx: number,
  gy: number
): { x: number; y: number } | null {
  const cells = rotateCells(piece.cells, piece.frameSize, turns);
  const x0 = Math.floor(gx / GRID_STEP) * GRID_STEP;
  const y0 = Math.floor(gy / GRID_STEP) * GRID_STEP;

  let best: { x: number; y: number } | null = null;
  let bestDistance = Infinity;
  for (const y of [y0, y0 + GRID_STEP]) {
    for (const x of [x0, x0 + GRID_STEP]) {
      const d = (x - gx) ** 2 + (y - gy) ** 2;
      if (d < bestDistance && fitsBoard(cells, x, y)) {
        best = { x, y };
        bestDistance = d;
      }
    }
  }
  return best !== null && bestDistance <= SNAP_RADIUS_SQ ? best : null;
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/freePlacement.test.ts`
Expected: PASS 8 test.

- [ ] **Step 5: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 6: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Add grid-intersection snapping helper for free placement

- Added `GRID_STEP`, `SNAP_RADIUS_SQ` and `nearestGridOrigin` in `game-next/src/domain/freePlacement.ts` (spec D FP-03): nearest fitting multiple-of-8 origin within 6 cells, ties by smaller y then x.
- Added `game-next/tests/freePlacement.test.ts` for mid-board, edge, rotated-fit and tie-break cases.
- Verification: `npx vitest run tests/freePlacement.test.ts` failed before the module existed and passed after; `npm run typecheck` and `npm test` passed.
```

Message:

```text
feat(domain): add grid-intersection snapping for free placement

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/domain/freePlacement.ts tests/freePlacement.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 2: Dữ liệu màn và validator nhận `placement`

**Files:**
- Modify: `game-next/src/domain/model.ts` (thêm `PlacementMode`, `Level.placement`)
- Modify: `game-next/src/content/document.ts` (`LevelDocument.placement?`, `allowUnproven?`)
- Modify: `game-next/src/content/validate.ts` (kiểm `placement`, luật màn `free`, `allowUnproven`)
- Modify: `game-next/src/content/authoring.ts` (`buildLevelDocument` chép hai trường mới)
- Modify: `game-next/tests/kernel.test.ts`, `game-next/tests/session.test.ts` (literal `Level` thêm `placement: 'anchors'`)
- Test: `game-next/tests/content.test.ts`, `game-next/tests/authoring.test.ts`

**Interfaces:**
- Consumes: `GRID_STEP` (Task 1).
- Produces:
  - `type PlacementMode = 'anchors' | 'free'`; `Level.placement: PlacementMode` (validator luôn điền, mặc định `'anchors'`).
  - `LevelDocument.placement?: PlacementMode`, `LevelDocument.allowUnproven?: { reason: string }`. `LevelSource` là `Omit<LevelDocument, …>` nên tự có hai trường tuỳ chọn này.
  - Mã lỗi: `invalid-placement`, `free-placement-extra-anchor`, `free-placement-off-grid`, `free-placement-distractors`, `invalid-allow-unproven`.

- [ ] **Step 1: Viết test thất bại**

(a) Thêm vào **cuối** `game-next/tests/content.test.ts` (các import `validateLevel`, `makeAdjacentFixture`, `buildLevelDocument`, `LevelSource` đã có ở đầu file):

```ts
describe('Chế độ đặt mảnh (spec D, FP-01/FP-02)', () => {
  const freeSource: LevelSource = {
    id: 'test-free',
    title: 'Đặt tự do thử',
    chapter: 2,
    order: 900,
    contentRevision: 't1',
    rotationEnabled: false,
    placement: 'free',
    pieces: [
      { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 16 }] },
      { id: 'D1', shapeKind: 'diamond', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 64 }] },
    ],
    sampleSolutions: [
      [
        { pieceId: 'S1', anchorId: 'A', turns: 0 },
        { pieceId: 'D1', anchorId: 'A', turns: 0 },
      ],
    ],
    learningObjective: 'thử',
    difficultyEstimate: 1,
    distractors: [],
    ftueSteps: [],
  };

  function codesOf(doc: unknown): string[] {
    const result = validateLevel(doc);
    return result.ok ? [] : result.issues.map((i) => i.code);
  }

  test('thiếu placement thì validator coi là anchors', () => {
    const result = validateLevel(makeAdjacentFixture());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.level.placement).toBe('anchors');
  });

  test('màn free hợp lệ mang placement free', () => {
    const result = validateLevel(buildLevelDocument(freeSource));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.level.placement).toBe('free');
  });

  test('placement lạ bị từ chối', () => {
    const doc = buildLevelDocument(freeSource);
    (doc as { placement?: string }).placement = 'grid';
    expect(codesOf(doc)).toContain('invalid-placement');
  });

  test('màn free có neo thứ hai hoặc neo không tên A bị từ chối', () => {
    const extra = buildLevelDocument(freeSource);
    extra.pieces[0].anchors.push({ id: 'B', x: 24, y: 16 });
    expect(codesOf(extra)).toContain('free-placement-extra-anchor');
    const renamed = buildLevelDocument(freeSource);
    renamed.pieces[1].anchors[0].id = 'Z';
    expect(codesOf(renamed)).toContain('free-placement-extra-anchor');
  });

  test('màn free có neo lệch lưới bị từ chối', () => {
    const doc = buildLevelDocument(freeSource);
    doc.pieces[0].anchors[0].x = 20;
    expect(codesOf(doc)).toContain('free-placement-off-grid');
  });

  test('màn free không được khai báo distractors', () => {
    const doc = buildLevelDocument(freeSource);
    doc.distractors = [{ pieceId: 'S1', anchorId: 'A', reason: 'thử' }];
    expect(codesOf(doc)).toContain('free-placement-distractors');
  });

  test('allowUnproven phải có lý do', () => {
    const empty = buildLevelDocument(freeSource);
    empty.allowUnproven = { reason: '   ' };
    expect(codesOf(empty)).toContain('invalid-allow-unproven');
    const ok = buildLevelDocument(freeSource);
    ok.allowUnproven = { reason: 'Đã chơi thử, không thấy nghiệm thứ hai' };
    expect(validateLevel(ok).ok).toBe(true);
  });
});
```

(b) Thêm vào **cuối** `game-next/tests/authoring.test.ts` (đã có `songTinh`, `cloneSource`, `buildLevelDocument` ở đầu file):

```ts
describe('buildLevelDocument chép chế độ đặt (spec D)', () => {
  test('chép placement và allowUnproven; màn neo không sinh khoá placement', () => {
    const free: LevelSource = {
      ...cloneSource(songTinh),
      id: 'test-free-copy',
      placement: 'free',
      allowUnproven: { reason: 'thử' },
      pieces: cloneSource(songTinh).pieces.map((p) => ({ ...p, anchors: p.anchors.slice(0, 1) })),
      distractors: [],
    };
    const doc = buildLevelDocument(free);
    expect(doc.placement).toBe('free');
    expect(doc.allowUnproven).toEqual({ reason: 'thử' });
    const anchors = buildLevelDocument(cloneSource(songTinh));
    expect('placement' in anchors).toBe(false);
    expect('allowUnproven' in anchors).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/content.test.ts tests/authoring.test.ts`
Expected: FAIL — `result.level.placement` là `undefined`; các mã lỗi mới chưa có; `doc.placement` không được chép.

- [ ] **Step 3: Kiểu dữ liệu**

(a) `game-next/src/domain/model.ts`: ngay trên `export type Level = Readonly<{` thêm:

```ts
/** Chế độ đặt mảnh: 'anchors' hít vào neo tác giả đặt; 'free' hít vào mọi giao điểm lưới (spec D) */
export type PlacementMode = 'anchors' | 'free';
```

và trong `Level`, ngay dưới dòng `rotationEnabled: boolean;` thêm:

```ts
  /** Validator luôn điền; thiếu trong tài liệu thì là 'anchors' */
  placement: PlacementMode;
```

(b) `game-next/src/content/document.ts`: thêm `PlacementMode` vào câu `import type { … } from '../domain/model.ts';` ở đầu file. Trong `LevelDocument`, ngay dưới dòng `rotationEnabled: boolean;` thêm:

```ts
  /** Chế độ đặt mảnh (spec D, FP-01). Thiếu thì là 'anchors'; màn neo không ghi khoá này. */
  placement?: PlacementMode;
  /** Người review cho phát hành dù bộ giải chưa chứng minh nghiệm duy nhất (FP-09) */
  allowUnproven?: { reason: string };
```

- [ ] **Step 4: Validator**

Trong `game-next/src/content/validate.ts`:

(a) Thêm `PlacementMode` vào câu `import type { … } from '../domain/model.ts';` và thêm import:

```ts
import { GRID_STEP } from '../domain/freePlacement.ts';
```

(b) Ngay **trước** dòng comment `// Pieces validation` thêm:

```ts
  // Chế độ đặt (FP-01): thiếu thì là 'anchors'
  const rawPlacement: unknown = doc.placement;
  const placement: PlacementMode = rawPlacement === 'free' ? 'free' : 'anchors';
  if (rawPlacement !== undefined && rawPlacement !== 'anchors' && rawPlacement !== 'free') {
    issues.push({ levelId, field: 'placement', code: 'invalid-placement' });
  }
  // Màn đặt tự do: mọi giao điểm lưới đã là neo nhiễu nên distractors phải rỗng (FP-02)
  if (placement === 'free' && Array.isArray(doc.distractors) && doc.distractors.length > 0) {
    issues.push({ levelId, field: 'distractors', code: 'free-placement-distractors' });
  }
  const allow: unknown = doc.allowUnproven;
  if (
    allow !== undefined &&
    (typeof allow !== 'object' ||
      allow === null ||
      typeof (allow as { reason?: unknown }).reason !== 'string' ||
      (allow as { reason: string }).reason.trim() === '')
  ) {
    issues.push({ levelId, field: 'allowUnproven', code: 'invalid-allow-unproven' });
  }
```

(c) Trong nhánh `else` của `if (!Array.isArray(p.anchors) || p.anchors.length === 0)`, ngay **sau** vòng `for (const anchor of p.anchors) { … }` (vẫn trong nhánh `else`), thêm:

```ts
        // Màn đặt tự do: mỗi mảnh đúng một neo A, nằm trên giao điểm lưới (FP-02)
        if (placement === 'free') {
          if (p.anchors.length !== 1 || p.anchors[0].id !== 'A') {
            issues.push({ levelId, field: `${pField}.anchors`, code: 'free-placement-extra-anchor' });
          }
          const offGrid = p.anchors.some(
            (a) =>
              Number.isInteger(a.x) &&
              Number.isInteger(a.y) &&
              (a.x % GRID_STEP !== 0 || a.y % GRID_STEP !== 0)
          );
          if (offGrid) {
            issues.push({ levelId, field: `${pField}.anchors`, code: 'free-placement-off-grid' });
          }
        }
```

(d) Trong object `dummyLevel`, ngay dưới dòng `rotationEnabled: Boolean(doc.rotationEnabled),` thêm `placement,`. Trong object `level` của `return { ok: true, … }` cuối hàm, ngay dưới dòng `rotationEnabled: doc.rotationEnabled!,` thêm `placement,`.

- [ ] **Step 5: Authoring**

Trong `game-next/src/content/authoring.ts`, trong `buildLevelDocument`, ngay **sau** khối

```ts
  if (source.victoryVerse !== undefined) {
    doc.victoryVerse = source.victoryVerse;
  }
```

thêm:

```ts
  // Chỉ ghi khi có, để JSON của các màn neo đã commit không đổi
  if (source.placement !== undefined) {
    doc.placement = source.placement;
  }
  if (source.allowUnproven !== undefined) {
    doc.allowUnproven = { reason: source.allowUnproven.reason };
  }
```

- [ ] **Step 6: Literal `Level` trong test**

Thêm dòng `placement: 'anchors',` ngay dưới dòng `rotationEnabled: …,` của mỗi literal kiểu `Level` sau:

- `game-next/tests/kernel.test.ts`: ba literal `id: 'kernel'`, `id: 'parity'`, `id: 'err'`.
- `game-next/tests/session.test.ts`: ba literal `id: 'tie-level'`, `id: 'same-anchor'`, `id: 'rotate-ch3'`.

Sau đó chạy `npm run typecheck`. Nếu plan A/B/C đã thêm literal `Level` khác, TypeScript báo `Property 'placement' is missing` đúng tại chỗ đó: thêm cùng một dòng `placement: 'anchors',`.

- [ ] **Step 7: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/content.test.ts tests/authoring.test.ts tests/kernel.test.ts tests/session.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 8: Toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all && git status --short src/content/levels`
Expected: xanh; lệnh cuối **không in dòng nào** (JSON màn neo không đổi vì không ghi khoá `placement`).

- [ ] **Step 9: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Add placement mode to level data and validator

- Added `PlacementMode` and required `Level.placement` in `game-next/src/domain/model.ts`; optional `placement` and `allowUnproven` in `game-next/src/content/document.ts`.
- `game-next/src/content/validate.ts` defaults `placement` to `anchors` and rejects `invalid-placement`, `free-placement-extra-anchor`, `free-placement-off-grid`, `free-placement-distractors` and `invalid-allow-unproven`.
- `buildLevelDocument` copies both fields only when present, so committed anchor-mode JSON is unchanged.
- Verification: the new content and authoring tests failed before the change and passed after; typecheck, all tests, `content:validate` and `content:author -- --all` passed with no JSON diff.
```

Message:

```text
feat(content): add placement mode and free-placement validation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/domain/model.ts src/content/document.ts src/content/validate.ts src/content/authoring.ts tests/content.test.ts tests/authoring.test.ts tests/kernel.test.ts tests/session.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

(Nếu Step 6 sửa thêm file test khác, `git add` cả file đó.)

---

### Task 3: Trạng thái `placed` trong phiên chơi, hit test và đếm mảnh

**Files:**
- Modify: `game-next/src/domain/model.ts` (`PieceState` thêm `placed`)
- Modify: `game-next/src/domain/session.ts` (`placementsOf`, lệnh `rotate`, lệnh `drop`)
- Modify: `game-next/src/presentation/layout.ts` (`pieceBoardOrigin`, `pieceHitbox`)
- Modify: `game-next/src/application/playController.ts` (`snappedCount`)
- Test: `game-next/tests/freePlacement.test.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `nearestGridOrigin` (Task 1); `Level.placement` (Task 2).
- Produces:
  - `PieceState` thêm `Readonly<{ kind: 'placed'; x: number; y: number; turns: Turns }>`.
  - Lệnh `drop` ở màn `free`: có giao điểm → `placed`, outcome `'snapped'`; không có → `temporary` như cũ.
  - Lệnh `rotate` trên `placed`: giữ gốc khung, vượt biên → `accepted: false`, outcome `'out-of-bounds'`.
  - `pieceBoardOrigin(piece: Piece, state: PieceState): { x: number; y: number } | null` trong `layout.ts` (null khi ở khay).
  - `PlayViewSnapshot.snappedCount` đếm cả `snapped` lẫn `placed`.

- [ ] **Step 1: Viết test thất bại**

(a) Thêm vào câu import đầu `game-next/tests/freePlacement.test.ts`: đổi `import type { Piece } from '../src/domain/model.ts';` thành

```ts
import type { Level, Piece } from '../src/domain/model.ts';
import { TOTAL_CELLS } from '../src/domain/model.ts';
import { evaluate } from '../src/domain/mask.ts';
import { applyCommand, createPuzzle, placementsOf } from '../src/domain/session.ts';
import { computeLayout, pieceHitbox } from '../src/presentation/layout.ts';
```

(b) Thêm vào **cuối** file:

```ts
/** Màn free một mảnh, xoay được; mục tiêu là mái hướng 5 tại (8, 8). */
function freeLevel(): Level {
  const base: Level = {
    id: 'free-test',
    title: 'Đặt tự do',
    chapter: 3,
    contentRevision: 'test',
    rotationEnabled: true,
    placement: 'free',
    targetMask: new Uint8Array(TOTAL_CELLS),
    pieces: [roof],
  };
  return { ...base, targetMask: evaluate(base, [{ pieceId: 'T5', x: 8, y: 8, turns: 0 }]) };
}

describe('Phiên chơi màn đặt tự do (FP-03, FP-04)', () => {
  const level = freeLevel();

  test('thả gần giao điểm thì thành mảnh placed, outcome vẫn là snapped', () => {
    const t = applyCommand(level, createPuzzle(level), { type: 'drop', pieceId: 'T5', x: 82, y: 43 });
    expect(t.outcome).toBe('snapped');
    expect(t.state.pieces.T5).toEqual({ kind: 'placed', x: 80, y: 40, turns: 0 });
    expect(placementsOf(level, t.state)).toEqual([{ pieceId: 'T5', x: 80, y: 40, turns: 0 }]);
    expect(t.mask.some(Boolean)).toBe(true);
  });

  test('không có giao điểm vừa bàn trong bán kính thì thành mảnh tạm', () => {
    // (104,40) cách 7 ô; (112,40) không vừa bàn
    const t = applyCommand(level, createPuzzle(level), { type: 'drop', pieceId: 'T5', x: 111, y: 40 });
    expect(t.outcome).toBe('temporary');
    expect(t.state.pieces.T5).toEqual({ kind: 'temporary', x: 111, y: 40, turns: 0 });
  });

  test('xoay mảnh placed giữ nguyên gốc khung', () => {
    const placed = applyCommand(level, createPuzzle(level), { type: 'drop', pieceId: 'T5', x: 80, y: 40 });
    const rotated = applyCommand(level, placed.state, { type: 'rotate', pieceId: 'T5' });
    expect(rotated.accepted).toBe(true);
    expect(rotated.outcome).toBe('rotated');
    expect(rotated.state.pieces.T5).toEqual({ kind: 'placed', x: 80, y: 40, turns: 1 });
  });

  test('xoay vượt biên bị từ chối với out-of-bounds', () => {
    const placed = applyCommand(level, createPuzzle(level), { type: 'drop', pieceId: 'T5', x: 104, y: 40 });
    expect(placed.state.pieces.T5).toEqual({ kind: 'placed', x: 104, y: 40, turns: 0 });
    const rotated = applyCommand(level, placed.state, { type: 'rotate', pieceId: 'T5' });
    expect(rotated.accepted).toBe(false);
    expect(rotated.outcome).toBe('out-of-bounds');
    expect(rotated.state).toBe(placed.state);
  });

  test('hít đúng giao điểm của nghiệm thì thắng', () => {
    const t = applyCommand(level, createPuzzle(level), { type: 'drop', pieceId: 'T5', x: 10, y: 5 });
    expect(t.becameWon).toBe(true);
    expect(t.state.pieces.T5).toEqual({ kind: 'placed', x: 8, y: 8, turns: 0 });
  });

  test('hitbox của mảnh placed đặt tại gốc khung', () => {
    const layout = computeLayout(720, 1280);
    expect(pieceHitbox(roof, { kind: 'placed', x: 80, y: 40, turns: 0 }, layout)).toEqual({
      x: 440,
      y: 400,
      width: 240,
      height: 240,
    });
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/freePlacement.test.ts`
Expected: FAIL ở 6 test mới (lệnh thả vẫn tìm neo nên ra `temporary`; hitbox của `placed` rơi vào nhánh khay).

- [ ] **Step 3: Kiểu `PieceState`**

Trong `game-next/src/domain/model.ts`, thay khối `export type PieceState = …` bằng:

```ts
export type PieceState =
  | Readonly<{ kind: 'tray'; turns: Turns }>
  | Readonly<{ kind: 'temporary'; x: number; y: number; turns: Turns }>
  | Readonly<{ kind: 'snapped'; anchorId: string; turns: Turns }>
  /** Chỉ ở màn placement 'free': đã hít vào giao điểm lưới (x, y) */
  | Readonly<{ kind: 'placed'; x: number; y: number; turns: Turns }>;
```

- [ ] **Step 4: `session.ts`**

Trong `game-next/src/domain/session.ts`:

(a) Thêm import dưới dòng `import { evaluate, matchesTarget } from './mask.ts';`:

```ts
import { nearestGridOrigin } from './freePlacement.ts';
```

(b) Trong `placementsOf`, thay toàn bộ vòng `for (const [pieceId, pState] of Object.entries(state.pieces)) { … }` bằng:

```ts
  for (const [pieceId, pState] of Object.entries(state.pieces)) {
    if (pState.kind === 'placed') {
      // Màn đặt tự do: gốc khung nằm ngay trong trạng thái (FP-04)
      placements.push({ pieceId, x: pState.x, y: pState.y, turns: pState.turns });
    } else if (pState.kind === 'snapped') {
      const piece = level.pieces.find((p) => p.id === pieceId);
      if (!piece) continue;
      const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
      if (!anchor) continue;
      placements.push({
        pieceId,
        x: anchor.x,
        y: anchor.y,
        turns: pState.turns,
      });
    }
  }
```

(c) Trong nhánh lệnh `rotate`, ngay **trước** dòng `} else if (currentPieceState.kind === 'temporary') {` chèn:

```ts
    } else if (currentPieceState.kind === 'placed') {
      // Xoay tại chỗ: giữ gốc khung; vượt biên thì từ chối như mảnh đã khớp neo
      if (!fitsBoard(nextRotatedCells, currentPieceState.x, currentPieceState.y)) {
        return {
          accepted: false,
          outcome: 'out-of-bounds',
          state,
          mask: currentMask,
          changed: [],
          becameWon: false,
        };
      }
      nextPieceState = {
        kind: 'placed',
        x: currentPieceState.x,
        y: currentPieceState.y,
        turns: nextTurns,
      };
```

(d) Trong nhánh lệnh `drop`, thay toàn bộ đoạn từ dòng `const rotatedCells = rotateCells(piece.cells, piece.frameSize, currentPieceState.turns);` tới hết khối `if (best) { … } else { … outcome = 'temporary'; }` (ngay trước `const nextPieces = {`) bằng:

```ts
    const turns = currentPieceState.turns;
    let nextPieceState: PieceState;
    let outcome: Outcome;

    if (level.placement === 'free') {
      // Màn đặt tự do: hít vào giao điểm lưới gần nhất mà mảnh vừa bàn (FP-03).
      // Outcome vẫn là 'snapped' để FTUE, telemetry và hiệu ứng snap dùng chung.
      const origin = nearestGridOrigin(piece, turns, command.x, command.y);
      if (origin) {
        nextPieceState = { kind: 'placed', x: origin.x, y: origin.y, turns };
        outcome = 'snapped';
      } else {
        nextPieceState = { kind: 'temporary', x: command.x, y: command.y, turns };
        outcome = 'temporary';
      }
    } else {
      const rotatedCells = rotateCells(piece.cells, piece.frameSize, turns);

      // Tìm neo gần nhất trong bán kính 6 ô (d^2 <= 36)
      // Phép so d < bestDistance giữ neo đứng trước khi khoảng cách bằng nhau (tie)
      let best: Anchor | undefined;
      let bestDistance = Infinity;
      for (const anchor of piece.anchors) {
        const d = (anchor.x - command.x) ** 2 + (anchor.y - command.y) ** 2;
        if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
          best = anchor;
          bestDistance = d;
        }
      }

      if (best) {
        nextPieceState = { kind: 'snapped', anchorId: best.id, turns };
        outcome = 'snapped';
      } else {
        nextPieceState = { kind: 'temporary', x: command.x, y: command.y, turns };
        outcome = 'temporary';
      }
    }
```

- [ ] **Step 5: `layout.ts`**

Trong `game-next/src/presentation/layout.ts`:

(a) Ngay **trên** `export function pieceHitbox(` thêm:

```ts
/**
 * Gốc khung của mảnh đang nằm trên bàn: neo đã khớp, giao điểm lưới (màn
 * đặt tự do) hoặc vị trí tạm. Null khi mảnh ở khay.
 */
export function pieceBoardOrigin(piece: Piece, state: PieceState): { x: number; y: number } | null {
  if (state.kind === 'tray') return null;
  if (state.kind === 'snapped') {
    const anchor = piece.anchors.find((a) => a.id === state.anchorId) ?? piece.anchors[0];
    return { x: anchor.x, y: anchor.y };
  }
  return { x: state.x, y: state.y };
}
```

(b) Trong `pieceHitbox`, thay hai khối `if (state.kind === 'snapped') { … }` và `if (state.kind === 'temporary') { … }` bằng:

```ts
  const origin = pieceBoardOrigin(piece, state);
  if (origin) {
    const pos = gridToCanvas(origin.x, origin.y, layout);
    return {
      x: pos.x,
      y: pos.y,
      width: size,
      height: size,
    };
  }
```

- [ ] **Step 6: `playController.ts`**

Trong `getSnapshot()` của `game-next/src/application/playController.ts`, thay

```ts
      (p) => p.kind === 'snapped'
```

bằng:

```ts
      (p) => p.kind === 'snapped' || p.kind === 'placed'
```

- [ ] **Step 7: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/freePlacement.test.ts tests/session.test.ts tests/layout.test.ts tests/playController.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 8: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh. Nếu TypeScript báo `BoardRenderer.ts` hay `drag.ts` thiếu nhánh `placed` thì đó là phần của Task 4 — chỉ chấp nhận khi lỗi là truy cập `anchorId` trên kiểu hợp có `placed`; khi đó làm luôn Step 3–4 của Task 4 trước khi commit Task này. (Với code hiện tại hai file đó chỉ so `kind === 'snapped'`/`'temporary'` nên không lỗi.)

- [ ] **Step 9: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Snap free-placement drops to grid intersections in the session

- Added the `placed` piece state in `game-next/src/domain/model.ts`; `game-next/src/domain/session.ts` snaps drops on free levels through `nearestGridOrigin`, rotates placed pieces in place and rejects out-of-bounds rotations.
- Added `pieceBoardOrigin` in `game-next/src/presentation/layout.ts` and used it for hit testing; `snappedCount` in `game-next/src/application/playController.ts` counts placed pieces.
- Verification: the new session and hitbox tests in `tests/freePlacement.test.ts` failed before the change and passed after; typecheck and all tests passed.
```

Message:

```text
feat(domain): add placed piece state and grid snapping for free levels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/domain/model.ts src/domain/session.ts src/presentation/layout.ts src/application/playController.ts tests/freePlacement.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 4: Kéo thả và renderer dùng chung luật hít

**Files:**
- Modify: `game-next/src/application/drag.ts` (thay toàn bộ file)
- Modify: `game-next/src/presentation/BoardRenderer.ts` (vòng vẽ mảnh, `drawSnappedPiece`, `drawOverlapInversion`, `drawTargetSilhouette`)
- Test: `game-next/tests/freePlacement.test.ts` (thêm `describe`), `game-next/tests/boardRendererLayers.test.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `nearestGridOrigin` (Task 1); `pieceBoardOrigin`, trạng thái `placed` (Task 3).
- Produces:
  - `updateDrag`/`finishDrag` ở màn `free` gọi `nearestGridOrigin` với cùng đầu vào nguyên; `snapCandidateId = "grid:<x>,<y>"`.
  - `beginDrag` lấy tâm mảnh `placed` từ gốc `(x, y)`.
  - Renderer vẽ `placed` như `snapped` tại gốc `(x, y)` và đưa nó vào lớp chẵn/lẻ.

- [ ] **Step 1: Viết test thất bại**

(a) Thêm vào đầu `game-next/tests/freePlacement.test.ts`: đổi `import { computeLayout, pieceHitbox } from '../src/presentation/layout.ts';` thành

```ts
import { computeLayout, gridToCanvas, pieceHitbox } from '../src/presentation/layout.ts';
import { beginDrag, finishDrag, updateDrag } from '../src/application/drag.ts';
```

và thêm vào **cuối** file:

```ts
describe('Kéo thả màn đặt tự do: xem trước trùng vị trí thả (FP-05)', () => {
  const layout = computeLayout(720, 1280);
  const level = freeLevel();

  /** Kéo bằng tâm mảnh (pointerOffset = 0) tới gốc khung (originX, originY). */
  function dragTo(originX: number, originY: number) {
    const drag = beginDrag(createPuzzle(level), roof, 300, 1080, layout);
    drag.pointerOffset = { x: 0, y: 0 };
    const pointer = gridToCanvas(originX + 24, originY + 24, layout);
    return {
      update: updateDrag(drag, level, pointer.x, pointer.y, layout),
      transition: finishDrag(drag, level, pointer.x, pointer.y, layout),
    };
  }

  test('gần giao điểm: nhãn grid:<x>,<y> và xem trước đúng giao điểm', () => {
    const { update, transition } = dragTo(82, 43);
    expect(update.snapCandidateId).toBe('grid:80,40');
    expect(update.previewPlacement).toEqual({ pieceId: 'T5', x: 80, y: 40, turns: 0 });
    expect(transition.state.pieces.T5).toEqual({ kind: 'placed', x: 80, y: 40, turns: 0 });
  });

  test('quét vùng sát mép phải: vị trí xem trước luôn trùng vị trí thả', () => {
    let snapped = 0;
    let missed = 0;
    for (let oy = 32; oy <= 48; oy++) {
      for (let ox = 96; ox <= 112; ox++) {
        const { update, transition } = dragTo(ox, oy);
        const placed = transition.state.pieces.T5;
        if (update.snapCandidateId === null) {
          missed++;
          expect(placed.kind).not.toBe('placed');
        } else {
          snapped++;
          if (placed.kind !== 'placed') throw new Error(`thả lệch xem trước tại (${ox}, ${oy})`);
          expect(update.snapCandidateId).toBe(`grid:${placed.x},${placed.y}`);
          expect(update.previewPlacement).toEqual({ pieceId: 'T5', x: placed.x, y: placed.y, turns: 0 });
        }
      }
    }
    // Vùng quét có cả chỗ hít lẫn chỗ không hít (sát mép, quá 6 ô)
    expect(snapped).toBeGreaterThan(0);
    expect(missed).toBeGreaterThan(0);
  });
});
```

(b) Thêm vào **cuối** `game-next/tests/boardRendererLayers.test.ts`:

```ts
describe('BoardRenderer vẽ mảnh placed như mảnh đã khớp (FP-05)', () => {
  test('mảnh placed trùng chỗ mảnh snapped tạo vùng triệt tiêu chẵn/lẻ', () => {
    const draws: Array<{ method: string; color: number | null }> = [];
    const scene = { add: { graphics: () => {
      let color: number | null = null;
      const graphics: object = new Proxy({}, { get: (_, method: string) => (...args: unknown[]) => {
        if (method === 'fillStyle') color = args[0] as number;
        draws.push({ method, color });
        return graphics;
      } });
      return graphics;
    } } } as unknown as Phaser.Scene;
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const renderer = new BoardRenderer(scene, computeLayout(720, 1280), 2);
    staticBoard.mockRestore();
    const original = loadLevel('1-1', 'campaign');
    const piece = original.pieces[0];
    const level = {
      ...original,
      placement: 'free' as const,
      pieces: ['P1', 'P2'].map((id) => ({ ...piece, id })),
    };
    const states: Record<string, PieceState> = {
      P1: { kind: 'snapped', anchorId: 'A', turns: 0 },
      P2: { kind: 'placed', x: piece.anchors[0].x, y: piece.anchors[0].y, turns: 0 },
    };
    const snapshot: PlayViewSnapshot = {
      levelId: level.id, phase: 'playing', showTarget: false, snappedCount: 2, totalPieces: 2,
      canRotate: false, selectedPieceId: null, dragPreviewMask: null, snapCandidateId: null,
      dragInfo: null, committedMask: level.targetMask,
    };
    renderer.render(level, snapshot, states);
    expect(
      draws.some((d) => d.method === 'fillPoints' && d.color === COLOR_NUMBERS.boardSurfaceTop)
    ).toBe(true);
    renderer.destroy();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/freePlacement.test.ts tests/boardRendererLayers.test.ts`
Expected: FAIL — `snapCandidateId` là `null` (drag còn tìm neo); renderer bỏ qua mảnh `placed` (tìm `anchorId` không có) nên không có lớp triệt tiêu.

- [ ] **Step 3: Thay toàn bộ `drag.ts`**

Thay toàn bộ `game-next/src/application/drag.ts` bằng:

```ts
import type {
  Anchor,
  Level,
  Piece,
  PieceState,
  Placement,
  PuzzleState,
  Transition,
  Turns,
} from '../domain/model.ts';
import { fitsBoard, rotateCells } from '../domain/geometry.ts';
import { nearestGridOrigin } from '../domain/freePlacement.ts';
import { evaluate } from '../domain/mask.ts';
import { applyCommand, placementsOf } from '../domain/session.ts';
import type { LayoutMetrics } from '../presentation/layout.ts';
import {
  canvasToGrid,
  gridToCanvas,
  pieceBoardOrigin,
  pieceHitbox,
} from '../presentation/layout.ts';

export type DragSession = {
  pieceId: string;
  startWorld: { x: number; y: number };
  pointerOffset: { x: number; y: number };
  originState: PieceState;
  committedState: PuzzleState;
};

export type DragUpdate = {
  previewPlacement: Placement | null;
  previewMask: Uint8Array;
  snapCandidateId: string | null;
};

type SnapTarget = { x: number; y: number; candidateId: string };

/**
 * Đích hít khi tâm mảnh nằm ở ô `grid`: neo gần nhất (màn neo) hoặc giao
 * điểm lưới gần nhất (màn đặt tự do). updateDrag và finishDrag cùng gọi hàm
 * này nên vị trí xem trước luôn trùng vị trí thả (FP-05).
 */
function snapTarget(
  level: Level,
  piece: Piece,
  turns: Turns,
  grid: { x: number; y: number }
): SnapTarget | null {
  const halfFrame = piece.frameSize / 2;

  if (level.placement === 'free') {
    // Làm tròn trước khi tìm: lệnh drop gửi đúng số nguyên này khi không hít,
    // và session.ts gọi lại nearestGridOrigin trên nó nên ra cùng kết quả.
    const gx = Math.round(grid.x - halfFrame);
    const gy = Math.round(grid.y - halfFrame);
    const origin = nearestGridOrigin(piece, turns, gx, gy);
    return origin ? { x: origin.x, y: origin.y, candidateId: `grid:${origin.x},${origin.y}` } : null;
  }

  const rotatedCells = rotateCells(piece.cells, piece.frameSize, turns);
  // Tìm neo gần nhất trong bán kính hít: d <= 36 (6 ô, tương ứng 30px canvas).
  // `grid` luôn là TÂM mảnh (pointerOffset tính từ tâm trong beginDrag); so
  // với gốc neo sẽ cho hít nhầm khi tâm mảnh rơi gần gốc neo.
  let best: Anchor | undefined;
  let bestDistance = Infinity;
  for (const anchor of piece.anchors) {
    const d = (anchor.x + halfFrame - grid.x) ** 2 + (anchor.y + halfFrame - grid.y) ** 2;
    if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
      best = anchor;
      bestDistance = d;
    }
  }
  return best ? { x: best.x, y: best.y, candidateId: best.id } : null;
}

export function beginDrag(
  state: PuzzleState,
  piece: Piece,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics,
  pieceIndexInTray: number = 0,
  trayCount: number = 2
): DragSession {
  const originState = state.pieces[piece.id] ?? { kind: 'tray', turns: 0 };
  let pieceCenterX = pointerX;
  let pieceCenterY = pointerY;

  const halfFrame = piece.frameSize / 2;
  const origin = pieceBoardOrigin(piece, originState);

  if (origin) {
    // Mảnh trên bàn (neo, giao điểm lưới hoặc vị trí tạm): tâm = gốc + nửa khung
    const pos = gridToCanvas(origin.x + halfFrame, origin.y + halfFrame, layout);
    pieceCenterX = pos.x;
    pieceCenterY = pos.y;
  } else {
    const hitbox = pieceHitbox(piece, originState, layout, pieceIndexInTray, trayCount);
    pieceCenterX = hitbox.x + hitbox.width / 2;
    pieceCenterY = hitbox.y + hitbox.height / 2;
  }

  return {
    pieceId: piece.id,
    startWorld: { x: pointerX, y: pointerY },
    pointerOffset: {
      x: pointerX - pieceCenterX,
      y: pointerY - pieceCenterY,
    },
    originState,
    committedState: state,
  };
}

export function updateDrag(
  drag: DragSession,
  level: Level,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics
): DragUpdate {
  const piece = level.pieces.find((p) => p.id === drag.pieceId);
  if (!piece) {
    const committedPlacements = placementsOf(level, drag.committedState);
    return {
      previewPlacement: null,
      previewMask: evaluate(level, committedPlacements),
      snapCandidateId: null,
    };
  }

  const halfFrame = piece.frameSize / 2;
  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);
  const turns = drag.originState.turns;
  const target = snapTarget(level, piece, turns, grid);

  let previewPlacement: Placement | null = null;
  if (target) {
    previewPlacement = { pieceId: piece.id, x: target.x, y: target.y, turns };
  } else {
    // `grid` là tâm mảnh, nên gốc luôn bằng tâm trừ nửa khung. Trước đây chỗ
    // này chọn giữa hai cách hiểu và đặt tâm vào vị trí gốc, làm mảnh nhảy
    // xuống-phải đúng nửa khung.
    const rotatedCells = rotateCells(piece.cells, piece.frameSize, turns);
    const dropX = Math.round(grid.x - halfFrame);
    const dropY = Math.round(grid.y - halfFrame);
    if (fitsBoard(rotatedCells, dropX, dropY)) {
      previewPlacement = { pieceId: piece.id, x: dropX, y: dropY, turns };
    }
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

  return {
    previewPlacement,
    previewMask,
    snapCandidateId: target ? target.candidateId : null,
  };
}

export function finishDrag(
  drag: DragSession,
  level: Level,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics
): Transition {
  // Thả vào vùng khay mảnh (trayBounds) -> trả về khay
  const inTray =
    pointerX >= layout.trayBounds.x &&
    pointerX <= layout.trayBounds.x + layout.trayBounds.width &&
    pointerY >= layout.trayBounds.y &&
    pointerY <= layout.trayBounds.y + layout.trayBounds.height;

  if (inTray) {
    return applyCommand(level, drag.committedState, {
      type: 'return',
      pieceId: drag.pieceId,
    });
  }

  const piece = level.pieces.find((p) => p.id === drag.pieceId);
  const halfFrame = piece ? piece.frameSize / 2 : 20;
  const pieceCanvasX = pointerX - drag.pointerOffset.x;
  const pieceCanvasY = pointerY - drag.pointerOffset.y;
  const grid = canvasToGrid(pieceCanvasX, pieceCanvasY, layout);

  if (piece) {
    const turns = drag.originState.turns;
    const target = snapTarget(level, piece, turns, grid);

    if (target) {
      // Hút chuẩn xác vào neo hoặc giao điểm đã thấy lúc xem trước
      return applyCommand(level, drag.committedState, {
        type: 'drop',
        pieceId: drag.pieceId,
        x: target.x,
        y: target.y,
      });
    }

    // Không hít nhưng vẫn thả trong bàn: gốc = tâm − nửa khung
    const rotatedCells = rotateCells(piece.cells, piece.frameSize, turns);
    const dropX = Math.round(grid.x - halfFrame);
    const dropY = Math.round(grid.y - halfFrame);

    if (fitsBoard(rotatedCells, dropX, dropY)) {
      return applyCommand(level, drag.committedState, {
        type: 'drop',
        pieceId: drag.pieceId,
        x: dropX,
        y: dropY,
      });
    }
  }

  // Thả ngoài phạm vi bàn cờ: trả về khay
  return applyCommand(level, drag.committedState, {
    type: 'return',
    pieceId: drag.pieceId,
  });
}

export function cancelDrag(drag: DragSession, level: Level): Transition {
  const placements = placementsOf(level, drag.committedState);
  const mask = evaluate(level, placements);

  return {
    accepted: true,
    outcome: 'tray',
    state: drag.committedState,
    mask,
    changed: [],
    becameWon: false,
  };
}
```

- [ ] **Step 4: `BoardRenderer.ts`**

Trong `game-next/src/presentation/BoardRenderer.ts`:

(a) Thêm `pieceBoardOrigin` vào câu import từ `./layout.ts` (giữ thứ tự chữ cái: sau `pieceHitbox`). Ngay dưới khối import, trên `export class BoardRenderer {`, thêm:

```ts
/** Mảnh đã khớp trên bàn (neo hoặc giao điểm lưới), quy về gốc khung chung. */
type BoardPiece = { piece: Piece; x: number; y: number; turns: number };
```

(b) Trong `render(…)`, thay dòng

```ts
    const snappedPieces: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }> = [];
```

bằng:

```ts
    const boardPieces: BoardPiece[] = [];
```

thay khối

```ts
      } else {
        // Trạng thái 2: Đã snap
        snappedPieces.push({ piece, pState });
        this.drawSnappedPiece(piece, pState);
      }
```

bằng:

```ts
      } else {
        // Trạng thái 2: Đã khớp — neo (màn neo) hoặc giao điểm lưới (màn đặt tự do)
        const origin = pieceBoardOrigin(piece, pState);
        if (!origin) continue;
        boardPieces.push({ piece, x: origin.x, y: origin.y, turns: pState.turns });
        this.drawSnappedPiece(piece, origin.x, origin.y, pState.turns);
      }
```

và thay

```ts
    if (snappedPieces.length >= 2) {
      this.drawOverlapInversion(snappedPieces);
    }
```

bằng:

```ts
    if (boardPieces.length >= 2) {
      this.drawOverlapInversion(boardPieces);
    }
```

(c) Thay toàn bộ phương thức `drawSnappedPiece` bằng:

```ts
  private drawSnappedPiece(piece: Piece, x: number, y: number, turns: number): void {
    drawJewelPolygon(
      this.piecesGraphics,
      piecePolygonCanvas(piece, x, y, turns, this.layout),
      { variant: 'solid', sizePx: pieceRadiusPx(piece.frameSize, this.layout) }
    );
  }
```

(d) Trong `drawOverlapInversion`, thay chữ ký và khối tính `polygons`:

```ts
  private drawOverlapInversion(
    snapped: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }>
  ): void {
    const polygons = snapped.flatMap(({ piece, pState }) => {
      const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
      return anchor ? [piecePolygonCanvas(piece, anchor.x, anchor.y, pState.turns, this.layout)] : [];
    });
```

bằng:

```ts
  private drawOverlapInversion(boardPieces: BoardPiece[]): void {
    const polygons = boardPieces.map(({ piece, x, y, turns }) =>
      piecePolygonCanvas(piece, x, y, turns, this.layout)
    );
```

(phần còn lại của phương thức giữ nguyên).

(e) Trong `drawTargetSilhouette`, thay hai câu

```ts
      const anchor = piece.anchors.find((a) => a.x === placement.x && a.y === placement.y);
      const isHovered =
        drag !== null &&
        drag.pieceId === piece.id &&
        anchor !== undefined &&
        drag.snapCandidateId === anchor.id;
```

bằng:

```ts
      // Màn đặt tự do đánh dấu ứng viên bằng giao điểm; màn neo bằng id neo
      const candidateId =
        level.placement === 'free'
          ? `grid:${placement.x},${placement.y}`
          : piece.anchors.find((a) => a.x === placement.x && a.y === placement.y)?.id;
      const isHovered =
        drag !== null &&
        drag.pieceId === piece.id &&
        candidateId !== undefined &&
        drag.snapCandidateId === candidateId;
```

Nếu sau các thay đổi trên `PieceState` không còn được dùng trong file, giữ nguyên import (vẫn dùng ở chữ ký `render` và `trayPoints`).

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/freePlacement.test.ts tests/boardRendererLayers.test.ts tests/drag.test.ts tests/playController.test.ts tests/catalog.test.ts tests/harness.test.ts`
Expected: PASS toàn bộ (test kéo thả màn neo giữ nguyên kết quả).

- [ ] **Step 6: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 7: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Share grid snapping between drag preview, drop and renderer

- `game-next/src/application/drag.ts` resolves the snap target once per call (`snapTarget`): anchors on anchor levels, `nearestGridOrigin` on free levels with `grid:<x>,<y>` candidate ids, so preview and drop always agree.
- `game-next/src/presentation/BoardRenderer.ts` draws placed pieces like snapped ones, includes them in parity layers and highlights the target silhouette by grid candidate on free levels.
- Verification: the drag sweep test and renderer parity test failed before the change and passed after; typecheck and all tests passed.
```

Message:

```text
feat(app): preview and draw grid-snapped pieces on free levels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/application/drag.ts src/presentation/BoardRenderer.ts tests/freePlacement.test.ts tests/boardRendererLayers.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 5: Bộ giải gặp-nhau-ở-giữa `content/solver.ts`

**Files:**
- Create: `game-next/src/content/solver.ts`
- Modify: `game-next/src/content/devLevels.ts` (xuất `FREE_DEMO_SOURCE`, chưa đăng ký)
- Test: `game-next/tests/solver.test.ts` (file mới)

**Interfaces:**
- Consumes: `LevelDocument` (Task 2); `GRID_STEP` (Task 1); `rotateCells`; `effectiveOrientation` (plan A); `buildLevelDocument`, `LevelSource`, `PieceSource`; `LEVEL_SOURCES`.
- Produces:
  - `SOLVER_LIMIT = 5_000_000`
  - `type SolverOptions = { limit?: number }`
  - `type SolverResult = { solutionCount: number; fewerPieceSolutions: number; proven: boolean; poseCounts: number[]; elapsedMs: number }` — `poseCounts[i]` là số tư thế trên bàn của mảnh `i`, **không** tính khay.
  - `type SolverPose`, `type PoseSpace`
  - `representativeTurns(piece, rotationEnabled): Turns[]`
  - `buildPoseSpace(doc, board?: { width: number; height: number }): PoseSpace` — mặc định 128 × 160; ném `solver:target-outside-board:<id>` nếu ô mục tiêu ra ngoài bàn đang giải.
  - `balancedSplit(optionCounts: readonly number[]): { table: number[]; scan: number[]; maxProduct: number }`
  - `solvePoseSpace(space, options?): SolverResult`
  - `solveLevel(doc: LevelDocument, options?: SolverOptions): SolverResult`
  - `FREE_DEMO_SOURCE: LevelSource` trong `devLevels.ts`.

- [ ] **Step 1: Thêm `FREE_DEMO_SOURCE` vào `devLevels.ts`**

Trong `game-next/src/content/devLevels.ts` (file của plan A), ngay **trên** dòng `export const DEV_LEVEL_DOCUMENTS` thêm:

```ts
/**
 * Màn thử chế độ đặt tự do (spec D): bốn mảnh khung 48, mỗi mảnh chỉ có neo A.
 * Dùng chung cho test bộ giải, test báo cáo và harness. Bộ giải (prototype):
 * 165/165/165/198 tư thế, 2904 ô mục tiêu, đúng 1 nghiệm.
 */
export const FREE_DEMO_SOURCE: LevelSource = {
  id: 'dev-free-placement',
  title: 'Thử đặt tự do',
  chapter: 2,
  order: 998,
  contentRevision: 'dev-free-v1',
  rotationEnabled: false,
  placement: 'free',
  pieces: [
    { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 16 }] },
    { id: 'D1', shapeKind: 'diamond', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 16 }] },
    { id: 'T1', shapeKind: 'triangle', orientation: 1, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 64 }] },
    { id: 'T2', shapeKind: 'triangle', orientation: 6, frameSize: 48, anchors: [{ id: 'A', x: 40, y: 104 }] },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Kiểm tra mảnh hít vào mọi giao điểm lưới và bộ giải chứng minh nghiệm duy nhất',
  difficultyEstimate: 2,
  distractors: [],
  ftueSteps: [],
  victoryVerse: 'Không neo dẫn lối, sao vẫn về đúng chỗ.',
};
```

- [ ] **Step 2: Viết test thất bại**

Tạo `game-next/tests/solver.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource, PieceSource } from '../src/content/authoring.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { FREE_DEMO_SOURCE } from '../src/content/devLevels.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import {
  SOLVER_LIMIT,
  balancedSplit,
  buildPoseSpace,
  solveLevel,
  solvePoseSpace,
} from '../src/content/solver.ts';
import type { PoseSpace } from '../src/content/solver.ts';

function p(
  id: string,
  shapeKind: PieceSource['shapeKind'],
  orientation: PieceSource['orientation'],
  frameSize: number,
  x: number,
  y: number
): PieceSource {
  return { id, shapeKind, orientation, frameSize, anchors: [{ id: 'A', x, y }] };
}

/** Màn free; nghiệm mẫu gồm `inSample` mảnh đầu tại neo A, turns 0. */
function freeDoc(
  id: string,
  pieces: PieceSource[],
  options: { inSample?: number; rotationEnabled?: boolean } = {}
): LevelDocument {
  const rotationEnabled = options.rotationEnabled ?? false;
  const used = pieces.slice(0, options.inSample ?? pieces.length);
  const source: LevelSource = {
    id,
    title: 'Thử bộ giải',
    chapter: rotationEnabled ? 4 : 2,
    order: 900,
    contentRevision: 'test-v1',
    rotationEnabled,
    placement: 'free',
    pieces,
    sampleSolutions: [used.map((piece) => ({ pieceId: piece.id, anchorId: 'A', turns: 0 as const }))],
    learningObjective: 'thử bộ giải',
    difficultyEstimate: 1,
    distractors: [],
    ftueSteps: [],
  };
  return buildLevelDocument(source);
}

/** Duyệt hết mọi tổ hợp của cùng không gian tư thế, không dùng băm. */
function bruteForce(space: PoseSpace): { count: number; fewer: number } {
  const target = new Uint8Array(space.width * space.height);
  for (const c of space.target) target[c] = 1;
  const mask = new Uint8Array(target.length);
  const picks: string[] = [];
  const solutions = new Set<string>();
  const fewer = new Set<string>();
  const visit = (index: number): void => {
    if (index === space.pieces.length) {
      for (let i = 0; i < mask.length; i++) if (mask[i] !== target[i]) return;
      const groups = new Map<string, string[]>();
      space.pieces.forEach((piece, i) => {
        groups.set(piece.group, [...(groups.get(piece.group) ?? []), picks[i]]);
      });
      const key = [...groups.keys()]
        .sort()
        .map((g) => `${g}=${groups.get(g)!.sort().join('|')}`)
        .join('/');
      solutions.add(key);
      if (picks.includes('khay')) fewer.add(key);
      return;
    }
    picks[index] = 'khay';
    visit(index + 1);
    for (const pose of space.pieces[index].poses) {
      for (const c of pose.cells) mask[c] ^= 1;
      picks[index] = `${pose.x},${pose.y},${pose.turns}`;
      visit(index + 1);
      for (const c of pose.cells) mask[c] ^= 1;
    }
  };
  visit(0);
  return { count: solutions.size, fewer: fewer.size };
}

const demo = buildLevelDocument(FREE_DEMO_SOURCE);

describe('Không gian tư thế (FP-06)', () => {
  test('màn thử free: 165/165/165/198 tư thế, 2904 ô mục tiêu (số tính bằng prototype)', () => {
    expect(demo.targetCells).toHaveLength(2904);
    const space = buildPoseSpace(demo);
    expect(space.pieces.map((piece) => piece.poses.length)).toEqual([165, 165, 165, 198]);
    // Mọi gốc là bội của 8
    for (const piece of space.pieces) {
      for (const pose of piece.poses) {
        expect(pose.x % 8).toBe(0);
        expect(pose.y % 8).toBe(0);
      }
    }
  });

  test('màn neo: tư thế là các neo, turns 0 khi không xoay', () => {
    const space = buildPoseSpace(buildLevelDocument(LEVEL_SOURCES['1-1']));
    expect(space.pieces.map((piece) => piece.poses.map((pose) => [pose.x, pose.y, pose.turns]))).toEqual([
      [
        [16, 56, 0],
        [16, 72, 0],
      ],
      [
        [64, 56, 0],
        [64, 72, 0],
      ],
    ]);
  });

  test('mục tiêu ra ngoài bàn thu nhỏ thì báo lỗi', () => {
    expect(() => buildPoseSpace(demo, { width: 32, height: 32 })).toThrow(/solver:target-outside-board/);
  });
});

describe('balancedSplit (FP-08, FP-09)', () => {
  test('4 và 5 mảnh khung 48 (số tính bằng prototype)', () => {
    expect(balancedSplit([166, 166, 166, 199]).maxProduct).toBe(33_034);
    const five = balancedSplit([166, 166, 166, 199, 166]);
    expect(five.maxProduct).toBe(4_574_296);
    expect(five.maxProduct).toBeLessThanOrEqual(SOLVER_LIMIT);
    expect([...five.table, ...five.scan].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('solveLevel (FP-07, FP-08)', () => {
  test('màn thử free 4 mảnh khung 48: proven, đúng 1 nghiệm', () => {
    expect(solveLevel(demo)).toMatchObject({
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
      poseCounts: [165, 165, 165, 198],
    });
  });

  test('fixture một nghiệm: vuông và thoi tách rời', () => {
    const doc = freeDoc('t-one', [p('S1', 'square', 0, 48, 16, 16), p('D1', 'diamond', 0, 48, 64, 64)]);
    expect(solveLevel(doc)).toMatchObject({ solutionCount: 1, fewerPieceSolutions: 0, proven: true });
  });

  test('fixture hai nghiệm: hai tam giác ghép thành vuông đổi chỗ được với mảnh vuông', () => {
    const doc = freeDoc('t-two', [
      p('S1', 'square', 0, 48, 16, 16),
      p('T1', 'triangle', 0, 48, 64, 96),
      p('T2', 'triangle', 2, 48, 64, 96),
    ]);
    expect(solveLevel(doc)).toMatchObject({ solutionCount: 2, fewerPieceSolutions: 0, proven: true });
  });

  test('fixture vô nghiệm: mục tiêu lệch 4 ô khỏi lưới', () => {
    const doc = freeDoc('t-zero', [p('S1', 'square', 0, 48, 16, 16)]);
    doc.targetCells = doc.targetCells.map(([x, y]) => [x + 4, y] as const);
    expect(solveLevel(doc)).toMatchObject({ solutionCount: 0, fewerPieceSolutions: 0, proven: true });
  });

  test('hai mảnh giống hệt đổi chỗ cho nhau chỉ tính một nghiệm', () => {
    const doc = freeDoc('t-twins', [p('S1', 'square', 0, 48, 16, 16), p('S2', 'square', 0, 48, 64, 64)]);
    expect(solveLevel(doc).solutionCount).toBe(1);
  });

  test('mảnh thừa không trong nghiệm mẫu: 1 nghiệm, và đó là nghiệm ít mảnh hơn', () => {
    const doc = freeDoc(
      't-extra',
      [p('S1', 'square', 0, 48, 16, 16), p('D1', 'diamond', 0, 48, 64, 64), p('X1', 'triangle', 0, 48, 40, 104)],
      { inSample: 2 }
    );
    expect(solveLevel(doc)).toMatchObject({ solutionCount: 1, fewerPieceSolutions: 1, proven: true });
  });

  test('vượt giới hạn thì dừng ngay với proven = false', () => {
    expect(solveLevel(demo, { limit: 1000 })).toMatchObject({
      solutionCount: 0,
      fewerPieceSolutions: 0,
      proven: false,
      poseCounts: [165, 165, 165, 198],
    });
  });
});

describe('Kiểm chéo với duyệt hết trên bàn 32 × 32', () => {
  const pieces = [
    p('S1', 'square', 0, 16, 0, 0),
    p('T1', 'triangle', 0, 16, 16, 16),
    p('T2', 'triangle', 2, 16, 16, 16),
  ];

  test('xoay được: 9/36/36 tư thế, 8 nghiệm, bằng kết quả duyệt hết (số tính bằng prototype)', () => {
    const space = buildPoseSpace(freeDoc('t-small-rot', pieces, { rotationEnabled: true }), {
      width: 32,
      height: 32,
    });
    expect(space.pieces.map((piece) => piece.poses.length)).toEqual([9, 36, 36]);
    const solved = solvePoseSpace(space);
    expect(solved.solutionCount).toBe(8);
    expect({ count: solved.solutionCount, fewer: solved.fewerPieceSolutions }).toEqual(bruteForce(space));
  });

  test('không xoay: 9/9/9 tư thế, 2 nghiệm, bằng kết quả duyệt hết', () => {
    const space = buildPoseSpace(freeDoc('t-small', pieces), { width: 32, height: 32 });
    expect(space.pieces.map((piece) => piece.poses.length)).toEqual([9, 9, 9]);
    const solved = solvePoseSpace(space);
    expect(solved.solutionCount).toBe(2);
    expect({ count: solved.solutionCount, fewer: solved.fewerPieceSolutions }).toEqual(bruteForce(space));
  });
});

describe('Hồi quy: mọi màn chế độ neo có nguồn (FP-10)', () => {
  test.each(Object.keys(LEVEL_SOURCES))('%s vẫn đúng 1 nghiệm, không nghiệm ít mảnh, proven', (id) => {
    expect(solveLevel(buildLevelDocument(LEVEL_SOURCES[id]))).toMatchObject({
      solutionCount: 1,
      fewerPieceSolutions: 0,
      proven: true,
    });
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/solver.test.ts`
Expected: FAIL — không resolve được `../src/content/solver.ts`.

- [ ] **Step 4: Viết `solver.ts`**

Tạo `game-next/src/content/solver.ts`:

```ts
import type { Cell, Turns } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import { rotateCells } from '../domain/geometry.ts';
import { GRID_STEP } from '../domain/freePlacement.ts';
import { effectiveOrientation } from '../domain/shapes.ts';
import type { LevelDocument } from './document.ts';

/** Trần tích số lựa chọn của nửa lớn; vượt thì không duyệt (FP-09). */
export const SOLVER_LIMIT = 5_000_000;

/** Seed cố định để mã băm ô giống nhau giữa mọi lần chạy (FP-07). */
const HASH_SEED = 0x5eed;

/** Quá số mảnh này thì việc thử mọi cách chia đôi (2^n) không còn rẻ. */
const MAX_PIECES = 20;

export type SolverOptions = { limit?: number };

export type SolverResult = {
  solutionCount: number;
  fewerPieceSolutions: number;
  proven: boolean;
  /** Số tư thế trên bàn của từng mảnh, không tính lựa chọn "ở khay" */
  poseCounts: number[];
  elapsedMs: number;
};

/** Một tư thế đặt mảnh; `cells` là chỉ số ô tuyệt đối y * width + x trên bàn đang giải. */
export type SolverPose = Readonly<{ x: number; y: number; turns: Turns; cells: Int32Array }>;

export type PoseSpace = Readonly<{
  width: number;
  height: number;
  pieces: ReadonlyArray<Readonly<{ id: string; group: string; poses: readonly SolverPose[] }>>;
  target: Int32Array;
}>;

type DocPiece = LevelDocument['pieces'][number];

/**
 * Nấc xoay đại diện: mỗi hướng hiệu dụng khác nhau lấy nấc nhỏ nhất (FP-06).
 * Vuông, thoi, tròn 1; bình hành 2; tam giác 4. Không xoay thì chỉ nấc 0.
 */
export function representativeTurns(piece: DocPiece, rotationEnabled: boolean): Turns[] {
  if (!rotationEnabled) return [0];
  const seen = new Set<number>();
  const result: Turns[] = [];
  for (const turns of [0, 1, 2, 3] as const) {
    const orientation = effectiveOrientation(piece.shapeKind, piece.orientation ?? 0, turns);
    if (seen.has(orientation)) continue;
    seen.add(orientation);
    result.push(turns);
  }
  return result;
}

/** Cùng ngữ nghĩa với fitsBoard nhưng trên bàn kích thước tuỳ ý (để kiểm chéo bàn thu nhỏ). */
function fitsRegion(
  cells: readonly Cell[],
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  for (const [cx, cy] of cells) {
    const px = x + cx;
    const py = y + cy;
    if (px < 0 || px >= width || py < 0 || py >= height) return false;
  }
  return true;
}

/**
 * Liệt kê tư thế của mọi mảnh (FP-06). Màn neo: các neo của mảnh. Màn free:
 * mọi gốc là bội của 8 mà mảnh vừa bàn. Mỗi gốc nhân với các nấc xoay đại
 * diện. Lựa chọn "ở khay" không nằm trong danh sách; bộ giải tự thêm.
 */
export function buildPoseSpace(
  doc: LevelDocument,
  board: { width: number; height: number } = { width: GRID_WIDTH, height: GRID_HEIGHT }
): PoseSpace {
  const { width, height } = board;
  const free = doc.placement === 'free';

  const pieces = doc.pieces.map((piece) => {
    const origins: Array<{ x: number; y: number }> = [];
    if (free) {
      for (let y = 0; y < height; y += GRID_STEP) {
        for (let x = 0; x < width; x += GRID_STEP) origins.push({ x, y });
      }
    } else {
      for (const anchor of piece.anchors) origins.push({ x: anchor.x, y: anchor.y });
    }

    const poses: SolverPose[] = [];
    for (const turns of representativeTurns(piece, doc.rotationEnabled)) {
      const cells = rotateCells(piece.cells, piece.frameSize, turns);
      for (const { x, y } of origins) {
        if (!fitsRegion(cells, x, y, width, height)) continue;
        poses.push({
          x,
          y,
          turns,
          cells: Int32Array.from(cells, ([cx, cy]) => (y + cy) * width + x + cx),
        });
      }
    }
    return {
      id: piece.id,
      // Hai mảnh cùng hình, hướng, khung là "giống hệt": đổi chỗ không sinh nghiệm mới
      group: `${piece.shapeKind}:${piece.orientation ?? 0}:${piece.frameSize}`,
      poses,
    };
  });

  const target = Int32Array.from(doc.targetCells, ([x, y]) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      throw new Error(`solver:target-outside-board:${doc.id}`);
    }
    return y * width + x;
  });

  return { width, height, pieces, target };
}

/**
 * Chia mảnh thành hai nửa sao cho tích số lựa chọn của nửa lớn nhỏ nhất
 * (FP-08). `table` là nửa có tích nhỏ hơn (dựng bảng băm), `scan` là nửa còn
 * lại (duyệt và tra bảng). Hoà thì giữ cách chia gặp trước.
 */
export function balancedSplit(
  optionCounts: readonly number[]
): { table: number[]; scan: number[]; maxProduct: number } {
  const n = optionCounts.length;
  if (n > MAX_PIECES) throw new Error(`solver:too-many-pieces:${n}`);

  let bestMask = 0;
  let bestMax = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    let inside = 1;
    let outside = 1;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) inside *= optionCounts[i];
      else outside *= optionCounts[i];
    }
    const max = Math.max(inside, outside);
    if (max < bestMax) {
      bestMax = max;
      bestMask = mask;
    }
  }

  const inside: number[] = [];
  const outside: number[] = [];
  let insideProduct = 1;
  let outsideProduct = 1;
  for (let i = 0; i < n; i++) {
    if (bestMask & (1 << i)) {
      inside.push(i);
      insideProduct *= optionCounts[i];
    } else {
      outside.push(i);
      outsideProduct *= optionCounts[i];
    }
  }
  return insideProduct <= outsideProduct
    ? { table: inside, scan: outside, maxProduct: bestMax }
    : { table: outside, scan: inside, maxProduct: bestMax };
}

/** PRNG mulberry32: đủ đều cho mã băm, xác định theo seed. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/**
 * Duyệt mọi tổ hợp lựa chọn của nhóm mảnh `group` theo kiểu đồng hồ đo:
 * chữ số đầu đổi nhanh nhất, nên chỉ số tổ hợp = d0 + r0 * (d1 + r1 * (…)).
 * Mã băm được cập nhật tăng dần bằng XOR (bỏ lựa chọn cũ, thêm lựa chọn mới).
 */
function forEachCombo(
  group: readonly number[],
  optHi: readonly Uint32Array[],
  optLo: readonly Uint32Array[],
  visit: (index: number, hi: number, lo: number, digits: Int32Array) => void
): void {
  const digits = new Int32Array(group.length);
  let hi = 0;
  let lo = 0;
  let index = 0;
  for (;;) {
    visit(index, hi >>> 0, lo >>> 0, digits);
    index++;
    let k = 0;
    for (; k < group.length; k++) {
      const piece = group[k];
      const current = digits[k];
      const next = current + 1 === optHi[piece].length ? 0 : current + 1;
      hi ^= optHi[piece][current] ^ optHi[piece][next];
      lo ^= optLo[piece][current] ^ optLo[piece][next];
      digits[k] = next;
      if (next !== 0) break;
    }
    if (k === group.length) return;
  }
}

/** Kiểm lại bằng mask thật: loại mọi trùng băm giả (FP-08 bước 4). */
function matchesExactly(
  space: PoseSpace,
  choice: Int32Array,
  scratch: Uint8Array,
  targetMask: Uint8Array
): boolean {
  const apply = (): void => {
    space.pieces.forEach((piece, p) => {
      const option = choice[p];
      if (option === 0) return;
      for (const c of piece.poses[option - 1].cells) scratch[c] ^= 1;
    });
  };
  apply();
  let same = true;
  for (let i = 0; i < scratch.length; i++) {
    if (scratch[i] !== targetMask[i]) {
      same = false;
      break;
    }
  }
  apply(); // XOR lần nữa để trả scratch về toàn 0
  return same;
}

/** Khoá chuẩn của một nghiệm: trong mỗi nhóm mảnh giống hệt, tư thế được sắp xếp. */
function canonicalKey(space: PoseSpace, choice: Int32Array): string {
  const groups = new Map<string, string[]>();
  space.pieces.forEach((piece, p) => {
    const option = choice[p];
    const pose = option === 0 ? null : piece.poses[option - 1];
    const label = pose === null ? 'khay' : `${pose.x},${pose.y},${pose.turns}`;
    const list = groups.get(piece.group);
    if (list) list.push(label);
    else groups.set(piece.group, [label]);
  });
  return [...groups.keys()]
    .sort()
    .map((g) => `${g}=${groups.get(g)!.sort().join('|')}`)
    .join('/');
}

/**
 * Đếm nghiệm phân biệt bằng gặp-nhau-ở-giữa trên mã băm XOR 64 bit (FP-07, FP-08).
 * Lựa chọn 0 của mỗi mảnh là "ở khay" (mã băm 0), lựa chọn k là tư thế k − 1.
 */
export function solvePoseSpace(space: PoseSpace, options: SolverOptions = {}): SolverResult {
  const started = performance.now();
  const limit = options.limit ?? SOLVER_LIMIT;
  const pieces = space.pieces;
  const n = pieces.length;
  const poseCounts = pieces.map((piece) => piece.poses.length);
  const cellCount = space.width * space.height;

  // Mã băm 64 bit mỗi ô, lưu thành hai số 32 bit
  const random = mulberry32(HASH_SEED);
  const cellHi = new Uint32Array(cellCount);
  const cellLo = new Uint32Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    cellHi[i] = random();
    cellLo[i] = random();
  }

  const optHi: Uint32Array[] = [];
  const optLo: Uint32Array[] = [];
  for (const piece of pieces) {
    const hiList = new Uint32Array(piece.poses.length + 1);
    const loList = new Uint32Array(piece.poses.length + 1);
    piece.poses.forEach((pose, k) => {
      let hi = 0;
      let lo = 0;
      for (const c of pose.cells) {
        hi ^= cellHi[c];
        lo ^= cellLo[c];
      }
      hiList[k + 1] = hi >>> 0;
      loList[k + 1] = lo >>> 0;
    });
    optHi.push(hiList);
    optLo.push(loList);
  }

  let targetHi = 0;
  let targetLo = 0;
  for (const c of space.target) {
    targetHi ^= cellHi[c];
    targetLo ^= cellLo[c];
  }
  targetHi >>>= 0;
  targetLo >>>= 0;

  const split = balancedSplit(pieces.map((piece) => piece.poses.length + 1));
  if (split.maxProduct > limit) {
    return {
      solutionCount: 0,
      fewerPieceSolutions: 0,
      proven: false,
      poseCounts,
      elapsedMs: performance.now() - started,
    };
  }

  // Bảng băm của nửa nhỏ: mảng định kiểu, xích theo bit thấp của nửa sau mã băm
  const tableSize = split.table.reduce((product, p) => product * optHi[p].length, 1);
  let bits = 1;
  while (1 << bits < tableSize * 2) bits++;
  const bucketMask = (1 << bits) - 1;
  const heads = new Int32Array(1 << bits).fill(-1);
  const chain = new Int32Array(tableSize);
  const keyHi = new Uint32Array(tableSize);
  const keyLo = new Uint32Array(tableSize);
  forEachCombo(split.table, optHi, optLo, (index, hi, lo) => {
    keyHi[index] = hi;
    keyLo[index] = lo;
    const bucket = lo & bucketMask;
    chain[index] = heads[bucket];
    heads[bucket] = index;
  });

  const targetMask = new Uint8Array(cellCount);
  for (const c of space.target) targetMask[c] = 1;
  const scratch = new Uint8Array(cellCount);
  const choice = new Int32Array(n);
  const solutions = new Set<string>();
  const fewer = new Set<string>();

  forEachCombo(split.scan, optHi, optLo, (_, hi, lo, digits) => {
    const needHi = (targetHi ^ hi) >>> 0;
    const needLo = (targetLo ^ lo) >>> 0;
    for (let entry = heads[needLo & bucketMask]; entry !== -1; entry = chain[entry]) {
      if (keyHi[entry] !== needHi || keyLo[entry] !== needLo) continue;
      let rest = entry;
      for (const p of split.table) {
        const radix = optHi[p].length;
        choice[p] = rest % radix;
        rest = Math.floor(rest / radix);
      }
      split.scan.forEach((p, k) => {
        choice[p] = digits[k];
      });
      if (!matchesExactly(space, choice, scratch, targetMask)) continue;
      const key = canonicalKey(space, choice);
      solutions.add(key);
      if (choice.some((option) => option === 0)) fewer.add(key);
    }
  });

  return {
    solutionCount: solutions.size,
    fewerPieceSolutions: fewer.size,
    proven: true,
    poseCounts,
    elapsedMs: performance.now() - started,
  };
}

/** Giải một màn trên bàn 128 × 160 (màn neo hoặc màn free). */
export function solveLevel(doc: LevelDocument, options: SolverOptions = {}): SolverResult {
  return solvePoseSpace(buildPoseSpace(doc), options);
}
```

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/solver.test.ts`
Expected: PASS toàn bộ; cả file chạy dưới vài giây. Nếu bất kỳ số nào (165/198, 2904, 33 034, 4 574 296, 1/2/0/1/1 nghiệm, 8 và 2 trên bàn 32 × 32) khác bảng "Con số đã tính trước", **dừng**: đối chiếu `representativeTurns`, `fitsRegion` và `canonicalKey`, không sửa test.

- [ ] **Step 6: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 7: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Add hashed meet-in-the-middle level solver

- Added `game-next/src/content/solver.ts`: pose spaces for anchor and free levels, 64-bit XOR cell hashing from a fixed seed, balanced split with a 5,000,000 option limit, typed-array hash table, exact mask re-check and canonical keys so identical pieces swapping count once.
- Exported `FREE_DEMO_SOURCE` (4 frame-48 pieces, anchor A only) from `game-next/src/content/devLevels.ts` as the shared free-placement fixture.
- Added `game-next/tests/solver.test.ts` with 1/2/0-solution fixtures, identical-piece swap, fewer-piece case, limit cut-off, a 32x32 brute-force cross-check and a regression over every authored source.
- Verification: `npx vitest run tests/solver.test.ts` failed before the module existed and passed after with the prototype-computed counts; typecheck and all tests passed.
```

Message:

```text
feat(content): add hashed meet-in-the-middle level solver

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/solver.ts src/content/devLevels.ts tests/solver.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 6: Báo cáo authoring dùng bộ giải, cổng phát hành

**Files:**
- Modify: `game-next/src/content/authoringReport.ts` (`SolutionReport`, `searchSolutions`, `renderReportMarkdown`, `renderPreviewSvg`, `releaseBlocker`)
- Modify: `game-next/scripts/author-level.ts` (cảnh báo khi chưa chứng minh)
- Modify: `game-next/scripts/validate-content.ts` (chặn ở `--release`)
- Test: `game-next/tests/authoringReport.test.ts`

**Interfaces:**
- Consumes: `solveLevel` (Task 5); `FREE_DEMO_SOURCE` (Task 5); `LevelDocument.allowUnproven`, `placement` (Task 2).
- Produces:
  - `SolutionReport` thêm `proven: boolean`, `poseCounts: number[]`, `elapsedMs: number`; `searchSolutions(doc)` giữ chữ ký.
  - `releaseBlocker(doc: LevelDocument, report: SolutionReport): string | null` — trả `'unproven-unique-solution'` khi `!proven` và không có `allowUnproven`.
  - Markdown màn `free` thêm: chế độ đặt, số tư thế mỗi mảnh, thời gian giải, đã chứng minh; mọi màn `proven = false` thêm dòng cảnh báo. SVG màn `free` chỉ vẽ neo `A`.

- [ ] **Step 1: Viết test thất bại**

Trong `game-next/tests/authoringReport.test.ts`:

(a) Đổi câu import từ `../src/content/authoringReport.ts` thành:

```ts
import {
  releaseBlocker,
  renderPreviewSvg,
  renderReportMarkdown,
  searchSolutions,
} from '../src/content/authoringReport.ts';
import { FREE_DEMO_SOURCE } from '../src/content/devLevels.ts';
```

(b) Trong test `'1-1 có đúng một nghiệm, …'`, thêm dòng cuối `expect(report.proven).toBe(true);`.

(c) Thay **toàn bộ** test `'đếm được nghiệm thứ hai khi hai mảnh giống nhau đổi chỗ được'` (nếu plan B đã đổi tên hoặc xoá test này thì chỉ thêm test dưới vào cùng `describe('searchSolutions', …)`) bằng:

```ts
  test('hai mảnh giống hệt đổi chỗ cho nhau chỉ tính một nghiệm (FP-08)', () => {
    const twins: LevelSource = {
      ...structuredClone(LEVEL_SOURCES['1-1']),
      id: 'test-twins',
      pieces: [
        { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }] },
        { id: 'S2', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    const doc = buildLevelDocument(twins);
    // Thêm neo đổi chỗ sau khi dựng, để không phụ thuộc luật lọc neo nhiễu KIT-03 của plan B
    doc.pieces[0].anchors.push({ id: 'B', x: 64, y: 56 });
    doc.pieces[1].anchors.push({ id: 'B', x: 16, y: 56 });
    expect(searchSolutions(doc).solutionCount).toBe(1);
  });
```

(d) Thêm vào **cuối** file:

```ts
describe('Báo cáo và cổng phát hành cho màn đặt tự do (spec D)', () => {
  const demo = buildLevelDocument(FREE_DEMO_SOURCE);

  test('báo cáo màn free ghi số tư thế, thời gian giải và đã chứng minh', () => {
    const report = searchSolutions(demo);
    expect(report).toMatchObject({ solutionCount: 1, fewerPieceSolutions: 0, proven: true });
    const md = renderReportMarkdown(demo, report);
    expect(md).toContain('- Chế độ đặt: tự do (hít vào mọi giao điểm lưới)');
    expect(md).toContain('- Số tư thế mỗi mảnh: S1 165, D1 165, T1 165, T2 198');
    expect(md).toMatch(/- Thời gian giải: \d+ ms/);
    expect(md).toContain('- Đã chứng minh: có');
    expect(md).not.toContain('Chưa chứng minh');
  });

  test('báo cáo chưa chứng minh có dòng cảnh báo; màn neo không có khối đặt tự do', () => {
    const md = renderReportMarkdown(demo, { ...searchSolutions(demo), proven: false });
    expect(md).toContain('**Chưa chứng minh được nghiệm duy nhất**');
    const anchors = renderReportMarkdown(songTinh, searchSolutions(songTinh));
    expect(anchors).not.toContain('Chế độ đặt');
    expect(anchors).not.toContain('Chưa chứng minh');
  });

  test('SVG màn free chỉ vẽ neo A, không có nét đứt gây nhiễu', () => {
    const svg = renderPreviewSvg(demo);
    expect(svg.match(/<circle /g)).toHaveLength(4);
    expect(svg).toContain('T2.A');
    expect(svg).not.toContain('stroke-dasharray');
  });

  test('releaseBlocker chặn màn chưa chứng minh trừ khi có allowUnproven', () => {
    const report = searchSolutions(demo);
    expect(releaseBlocker(demo, report)).toBeNull();
    expect(releaseBlocker(demo, { ...report, proven: false })).toBe('unproven-unique-solution');
    const allowed = { ...demo, allowUnproven: { reason: 'Đã chơi thử' } };
    expect(releaseBlocker(allowed, { ...report, proven: false })).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/authoringReport.test.ts`
Expected: FAIL — `releaseBlocker` chưa có; `proven` là `undefined`; test hai mảnh giống hệt ra 2.

- [ ] **Step 3: `authoringReport.ts`**

Trong `game-next/src/content/authoringReport.ts`:

(a) Thêm import dưới `import type { LevelDocument } from './document.ts';`:

```ts
import { solveLevel } from './solver.ts';
```

(b) Thay kiểu `SolutionReport` bằng:

```ts
export type SolutionReport = {
  solutionCount: number;
  fewerPieceSolutions: number;
  /** false khi bộ giải dừng vì vượt giới hạn (FP-09) */
  proven: boolean;
  /** Số tư thế trên bàn của từng mảnh (không tính khay) */
  poseCounts: number[];
  elapsedMs: number;
  distractors: Array<{
    pieceId: string;
    anchorId: string | null;
    reason: string;
    changedCells: number | null;
  }>;
};
```

(c) Thay comment JSDoc và phần đầu thân `searchSolutions` — từ dòng `/**` ngay trên `export function searchSolutions` tới hết vòng `for (const choice of combos) { … }` — bằng:

```ts
/**
 * Đếm nghiệm bằng bộ giải chung (spec D, FP-10): màn neo duyệt "neo của mảnh
 * + khay", màn free duyệt mọi giao điểm lưới. Hai mảnh giống hệt đổi chỗ chỉ
 * tính một nghiệm. Số ô đổi của từng tư thế gây nhiễu vẫn tính như trước.
 */
export function searchSolutions(doc: LevelDocument): SolutionReport {
  const target = targetMaskOf(doc);
  const solved = solveLevel(doc);
```

Giữ nguyên khối `const base = …` và `const distractors = …`. Thay câu `return` cuối hàm bằng:

```ts
  return {
    solutionCount: solved.solutionCount,
    fewerPieceSolutions: solved.fewerPieceSolutions,
    proven: solved.proven,
    poseCounts: solved.poseCounts,
    elapsedMs: solved.elapsedMs,
    distractors,
  };
}

/** Lý do chặn phát hành (FP-09): chưa chứng minh nghiệm duy nhất và người review chưa ghi allowUnproven. */
export function releaseBlocker(doc: LevelDocument, report: SolutionReport): string | null {
  return !report.proven && doc.allowUnproven === undefined ? 'unproven-unique-solution' : null;
}
```

(d) Trong `renderReportMarkdown`, ngay **sau** dòng `` `- Nghiệm dùng ít mảnh hơn: ${report.fewerPieceSolutions}`, `` thêm:

```ts
    ...(report.proven
      ? []
      : [
          '- **Chưa chứng minh được nghiệm duy nhất** (vượt giới hạn bộ giải); phát hành cần `allowUnproven` kèm lý do.',
        ]),
    ...(doc.placement === 'free'
      ? [
          '- Chế độ đặt: tự do (hít vào mọi giao điểm lưới)',
          `- Số tư thế mỗi mảnh: ${doc.pieces.map((p, i) => `${p.id} ${report.poseCounts[i]}`).join(', ')}`,
          `- Thời gian giải: ${Math.round(report.elapsedMs)} ms`,
          `- Đã chứng minh: ${report.proven ? 'có' : 'không'}`,
        ]
      : []),
```

(e) Trong `renderPreviewSvg`, ở vòng vẽ neo, thay dòng `for (const anchor of piece.anchors) {` bằng:

```ts
    for (const anchor of piece.anchors) {
      // Màn free: mọi giao điểm đã là neo nhiễu nên chỉ vẽ neo A (vị trí đúng)
      if (doc.placement === 'free' && anchor.id !== 'A') continue;
```

- [ ] **Step 4: `author-level.ts`**

Trong `game-next/scripts/author-level.ts`, ngay **sau** câu `console.log(` in số ô mục tiêu và số nghiệm (trước `if (report.fewerPieceSolutions > 0) {`) thêm:

```ts
  if (!report.proven) {
    // Vẫn ghi file (FP-09); chỉ --release mới chặn
    console.warn(
      `[author-level] CẢNH BÁO ${id}: chưa chứng minh được nghiệm duy nhất (vượt giới hạn bộ giải); ` +
        'content:validate --release sẽ chặn nếu nguồn thiếu allowUnproven'
    );
  }
```

- [ ] **Step 5: `validate-content.ts`**

Trong `game-next/scripts/validate-content.ts`:

(a) Thêm import dưới `import { makeAdjacentFixture } from '../src/content/fixtures.ts';`:

```ts
import { releaseBlocker, searchSolutions } from '../src/content/authoringReport.ts';
import type { LevelDocument } from '../src/content/document.ts';
```

(b) Trong vòng `for (const entry of campaignManifest)`, ngay **trước** dòng `validatedCount++;` thêm:

```ts
    // Release: bộ giải phải chứng minh nghiệm duy nhất, trừ khi người review ghi allowUnproven (FP-09)
    if (isReleaseMode) {
      const doc = raw as LevelDocument;
      const blocker = releaseBlocker(doc, searchSolutions(doc));
      if (blocker) {
        console.error(
          `[validate-content] FAIL: Level ${entry.id} ${blocker}: chưa chứng minh được nghiệm duy nhất; ` +
            'cần ghi allowUnproven kèm lý do vào nguồn.'
        );
        process.exit(1);
      }
    }
```

- [ ] **Step 6: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/authoringReport.test.ts tests/solver.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 7: Toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all && git status --short src/content/levels ../docs/testing/levels`
Expected: xanh; dòng cuối **không in gì** (JSON, SVG và báo cáo của màn neo không đổi).

Run: `npm run content:validate -- --release`
Expected: mọi màn có dữ liệu in `PASS` (không màn nào bị `unproven-unique-solution`), rồi lệnh dừng ở `GATE FAIL: campaign-incomplete` như trước plan này (chưa đủ màn `approved`). Exit code 1 ở đây là đúng.

- [ ] **Step 8: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Route authoring reports through the solver and gate unproven levels

- `searchSolutions` in `game-next/src/content/authoringReport.ts` now uses `solveLevel`; `SolutionReport` adds `proven`, `poseCounts` and `elapsedMs`; identical pieces swapping count as one solution (the twins test now expects 1).
- Free-level reports list pose counts, solve time and proof status; unproven reports carry a warning; free-level SVGs draw only anchor A.
- Added `releaseBlocker`; `scripts/validate-content.ts --release` rejects unproven levels without `allowUnproven`, and `scripts/author-level.ts` warns but still writes.
- Verification: the new report tests failed before the change and passed after; typecheck, all tests, `content:validate` and `content:author -- --all` passed with no diff in committed levels or reports.
```

Message:

```text
refactor(content): route searchSolutions through the solver and gate unproven levels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/authoringReport.ts scripts/author-level.ts scripts/validate-content.ts tests/authoringReport.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 7: Hàm ghép hình bỏ neo nhiễu ở màn `free`

**Files:**
- Modify: `game-next/src/content/kit.ts` (plan B)
- Test: `game-next/tests/kit.test.ts` (plan B; thêm `describe` cuối file)

**Interfaces:**
- Consumes: `piece`, `row`, `concentric`, `NUDGE`, `CROSS` của plan B (chữ ký theo spec B mục 3: `piece(id, kind, size, center, opts?)`, `row(idPrefix, kind, size, startCenter, step, count, opts?)`, `concentric(center, specs)`); `PlacementMode` (Task 2).
- Produces: `opts.placement?: PlacementMode` ở `piece` và `row`; tham số thứ ba tuỳ chọn `opts?: { placement?: PlacementMode }` ở `concentric`. Khi `placement === 'free'`, `decoys` bị bỏ qua: mảnh chỉ có neo `A`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào **cuối** `game-next/tests/kit.test.ts` (nếu `piece`, `row`, `concentric`, `NUDGE`, `CROSS` chưa có trong câu import từ `../src/content/kit.ts` thì thêm vào):

```ts
describe('Hàm ghép hình ở chế độ đặt tự do (spec D mục 5)', () => {
  test('piece bỏ neo nhiễu khi placement là free', () => {
    const withDecoys = piece('S1', 'square', 48, [40, 64], { decoys: NUDGE });
    expect(withDecoys.anchors.length).toBeGreaterThan(1);
    const free = piece('S1', 'square', 48, [40, 64], { decoys: NUDGE, placement: 'free' });
    expect(free.anchors).toEqual([{ id: 'A', x: 16, y: 40 }]);
  });

  test('row và concentric cũng bỏ neo nhiễu', () => {
    const rowPieces = row('R', 'square', 48, [40, 64], [48, 0], 2, { decoys: CROSS, placement: 'free' });
    expect(rowPieces.map((p) => p.anchors)).toEqual([
      [{ id: 'A', x: 16, y: 40 }],
      [{ id: 'A', x: 64, y: 40 }],
    ]);
    const rings = concentric(
      [64, 80],
      [
        { id: 'S1', kind: 'square', size: 48, decoys: NUDGE },
        { id: 'D1', kind: 'diamond', size: 48, decoys: NUDGE },
      ],
      { placement: 'free' }
    );
    expect(rings.map((p) => p.anchors)).toEqual([
      [{ id: 'A', x: 40, y: 56 }],
      [{ id: 'A', x: 40, y: 56 }],
    ]);
  });
});
```

Run: `npx vitest run tests/kit.test.ts`
Expected: FAIL — `free.anchors` còn neo nhiễu (và TypeScript/IDE báo `placement` không có trong kiểu tuỳ chọn).

- [ ] **Step 2: Sửa `kit.ts`**

Trong `game-next/src/content/kit.ts`:

(a) Thêm `import type { PlacementMode } from '../domain/model.ts';` (gộp vào câu `import type` từ `model.ts` nếu đã có).

(b) Trong kiểu tuỳ chọn của `piece` (kiểu chứa `orientation?` và `decoys?`), thêm trường:

```ts
  /** 'free': màn đặt tự do, bỏ qua decoys (mọi giao điểm lưới đã là neo nhiễu) */
  placement?: PlacementMode;
```

(c) Ở chỗ `piece` đổi `opts.decoys` thành danh sách neo B, C, D…, thay biểu thức lấy danh sách độ lệch (dạng `opts?.decoys ?? []` hoặc `opts.decoys ?? []`) bằng:

```ts
opts?.placement === 'free' ? [] : (opts?.decoys ?? [])
```

(d) `row` đã chuyển `opts` cho `piece` (spec B mục 3) nên không phải sửa; nếu `row` dựng tuỳ chọn mới thay vì chuyển nguyên `opts`, thêm `placement: opts?.placement` vào object đó.

(e) Đổi chữ ký `concentric(center, specs)` thành `concentric(center, specs, opts?: { placement?: PlacementMode })` và trong lời gọi `piece(...)` cho mỗi phần tử `specs`, thêm `placement: opts?.placement` vào object tuỳ chọn truyền vào.

- [ ] **Step 3: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/kit.test.ts`
Expected: PASS toàn bộ (test cũ của plan B giữ nguyên vì `placement` mặc định không có).

- [ ] **Step 4: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 5: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Skip kit decoys on free-placement pieces

- `piece`, `row` and `concentric` in `game-next/src/content/kit.ts` accept `placement: 'free'` and then emit only anchor A, ignoring `decoys`.
- Verification: the new kit tests failed before the change and passed after; typecheck and all tests passed.
```

Message:

```text
feat(content): skip kit decoys for free-placement pieces

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/kit.ts tests/kit.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 8: Màn dev `dev-free-placement` chơi được ở harness

**Files:**
- Modify: `game-next/src/content/devLevels.ts` (đăng ký `FREE_DEMO_SOURCE` vào `DEV_LEVEL_DOCUMENTS`)
- Test: `game-next/tests/catalog.test.ts`, `game-next/tests/playController.test.ts` (thêm `describe` cuối file)
- Create (ảnh bằng chứng): `docs/testing/levels/screens/dev-free-placement-{play,drag,win}.png`

**Interfaces:**
- Consumes: `FREE_DEMO_SOURCE` (Task 5); nhánh nạp màn dev của `loadLevel` (plan A); `scripts/shoot-level.sh`; toàn bộ Task 1–4.
- Produces: `loadLevel('dev-free-placement', 'harness')` trả màn `placement: 'free'` trên dev server; campaign không bao giờ nạp được.

- [ ] **Step 1: Viết test thất bại**

(a) Thêm vào **cuối** `game-next/tests/catalog.test.ts`:

```ts
describe('Màn dev thử chế độ đặt tự do (spec D)', () => {
  test('dev-free-placement nạp được ở harness, mỗi mảnh một neo A', () => {
    const level = loadLevel('dev-free-placement', 'harness');
    expect(level.placement).toBe('free');
    expect(level.pieces.map((p) => [p.id, p.frameSize, p.anchors.map((a) => a.id)])).toEqual([
      ['S1', 48, ['A']],
      ['D1', 48, ['A']],
      ['T1', 48, ['A']],
      ['T2', 48, ['A']],
    ]);
  });

  test('màn dev không bao giờ nạp ở campaign', () => {
    expect(() => loadLevel('dev-free-placement', 'campaign')).toThrow('unavailable:dev-free-placement');
  });
});
```

(b) Thêm vào **cuối** `game-next/tests/playController.test.ts`:

```ts
describe('Màn đặt tự do thắng được qua PlayController (spec D mục 7)', () => {
  const layout = computeLayout(720, 1280);

  test('kéo bốn mảnh tới gần giao điểm đúng: nhãn hít grid, mảnh hít và màn thắng', () => {
    const level = loadLevel('dev-free-placement', 'harness');
    const repo = createProgressRepository(createMockStorage(), campaignManifest, 'oracle-v1');
    const controller = new PlayController(level, repo, false);

    let last = null as ReturnType<PlayController['onPointerUp']>;
    level.pieces.forEach((piece, index) => {
      const start = pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, index, level.pieces.length);
      const anchor = piece.anchors[0];
      const center = gridToCanvas(anchor.x + piece.frameSize / 2, anchor.y + piece.frameSize / 2, layout);
      expect(controller.onPointerDown(start.x + start.width / 2, start.y + start.height / 2, layout)).toBe(true);
      // Lệch (+12, −12) px khỏi tâm đích = (+2, −3) ô: vẫn trong bán kính hít
      controller.onPointerMove(center.x + 12, center.y - 12, layout);
      expect(controller.getSnapshot().snapCandidateId).toBe(`grid:${anchor.x},${anchor.y}`);
      last = controller.onPointerUp(center.x + 12, center.y - 12, layout);
    });

    expect(last?.becameWon).toBe(true);
    expect(controller.getSnapshot().phase).toBe('won');
    expect(controller.getSnapshot().snappedCount).toBe(4);
    for (const piece of level.pieces) {
      expect(controller.getPuzzleState().pieces[piece.id].kind).toBe('placed');
    }
  });
});
```

Run: `npx vitest run tests/catalog.test.ts tests/playController.test.ts`
Expected: FAIL — `unavailable:dev-free-placement` ở harness (chưa đăng ký).

- [ ] **Step 2: Đăng ký màn dev**

Trong `game-next/src/content/devLevels.ts`, thay khối

```ts
export const DEV_LEVEL_DOCUMENTS: Readonly<Record<string, unknown>> = import.meta.env.DEV
  ? { [shapesV2.id]: buildLevelDocument(shapesV2) }
  : {};
```

bằng:

```ts
export const DEV_LEVEL_DOCUMENTS: Readonly<Record<string, unknown>> = import.meta.env.DEV
  ? {
      [shapesV2.id]: buildLevelDocument(shapesV2),
      [FREE_DEMO_SOURCE.id]: buildLevelDocument(FREE_DEMO_SOURCE),
    }
  : {};
```

- [ ] **Step 3: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/catalog.test.ts tests/playController.test.ts`
Expected: PASS.

- [ ] **Step 4: Toàn bộ kiểm tra và build**

Run: `npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: xanh. Bản build không chứa màn dev: `grep -c "dev-free-placement" dist/assets/*.js` in `0` cho mọi file.

- [ ] **Step 5: Chụp ảnh và xem bằng mắt**

Chạy dev server nền: `npm run dev -- --port 5173 --strictPort` (chờ dòng `Local: http://localhost:5173`).

Run: `bash scripts/shoot-level.sh dev-free-placement ../docs/testing/levels/screens 5173 harness`

Mở ba ảnh và xác nhận:
- `play`: khay có **bốn ô** (vuông, thoi, tam giác, mái); bóng mục tiêu gồm khung vuông có thoi rỗng ở giữa (bốn góc tam giác), một tam giác và một mái nhỏ.
- `drag`: ba mảnh đầu đã hít đúng chỗ; mảnh mái T2 đang kéo gần đích, có nhãn **"Thả để khớp"** và bóng mục tiêu của T2 sáng lên; vùng giữa vuông S1 và thoi D1 **có màu mặt bàn** (chẵn lẻ).
- `win`: thẻ hoàn thành có câu thơ "Không neo dẫn lối, sao vẫn về đúng chỗ."

Bất kỳ ảnh nào sai (mảnh không hít, không có nhãn, mảnh lệch nửa ô lưới, vùng S1–D1 không rỗng) là lỗi: sửa trước khi commit. Dừng dev server sau khi chụp.

- [ ] **Step 6: CHANGELOG và commit**

Thêm vào đầu `## Unreleased` của `CHANGELOG.md`:

```markdown
### 2026-10-02 - Add dev-only free-placement harness level

- Registered `FREE_DEMO_SOURCE` as `dev-free-placement` in `game-next/src/content/devLevels.ts` (dev server and harness only, never in the manifest or campaign).
- Added catalog and PlayController tests: the level loads in harness, pieces snap to `grid:<x>,<y>` candidates and the level is won; added screenshots `docs/testing/levels/screens/dev-free-placement-{play,drag,win}.png`.
- Verification: the new tests failed before registration and passed after; typecheck, all tests, `content:validate` and `build` passed; the build contains no `dev-free-placement` string; screenshots checked by eye.
```

Message:

```text
feat(content): add dev-only free-placement harness level

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/devLevels.ts tests/catalog.test.ts tests/playController.test.ts ../docs/testing/levels/screens/dev-free-placement-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

## Kết thúc plan D

`npm run typecheck && npm test && npm run content:validate && npm run build` xanh; tám commit mới trên `feat/free-placement`; ảnh `dev-free-placement-*` đã commit. Báo người review kèm ảnh `drag` (nhãn "Thả để khớp" trên giao điểm), báo cáo bộ giải của màn thử (`proven = true`, 1 nghiệm, 165/165/165/198 tư thế) và hai thay đổi hành vi có chủ ý: hai mảnh giống hệt đổi chỗ giờ tính là một nghiệm; `SolutionReport` có thêm ba trường.

## Self-review: đối chiếu spec → task

| Mục spec | Nội dung | Task |
|---|---|---|
| FP-01 | `placement` trong `LevelDocument`/`Level`, mặc định `anchors` | Task 2 (kiểu, validator, authoring; test `thiếu placement thì validator coi là anchors`) |
| FP-02 | đúng một neo `A`, bội của 8, `distractors` rỗng, `sampleSolutions` trỏ neo A | Task 2 (`free-placement-extra-anchor`, `free-placement-off-grid`, `free-placement-distractors`); Task 5/8 (`FREE_DEMO_SOURCE`) |
| FP-03 | ứng viên bội của 8 vừa bàn, gần nhất, hoà y rồi x, `d² ≤ 36`, không có thì tạm/khay | Task 1 (`nearestGridOrigin` + 8 test); Task 3 (lệnh `drop` → `placed`/`temporary`); Task 4 (thả ngoài bàn về khay giữ nguyên trong `finishDrag`) |
| FP-04 | trạng thái `placed`, `placementsOf`, xoay giữ gốc, `out-of-bounds` | Task 3 |
| FP-05 | `drag.ts` dùng chung hàm, `"grid:<x>,<y>"`, renderer vẽ như `snapped` | Task 4 (`snapTarget`, test quét xem trước = thả, test renderer chẵn lẻ, bóng mục tiêu) |
| FP-06 | tư thế bội của 8 × hướng hiệu dụng + khay | Task 5 (`buildPoseSpace`, `representativeTurns`; 165/198 tư thế) |
| FP-07 | băm XOR 64 bit, seed cố định | Task 5 (`mulberry32(0x5eed)`, hai `Uint32Array`) |
| FP-08 | gặp-nhau-ở-giữa, kiểm lại bằng mask, mảnh giống hệt tính một, báo `solutionCount`/`fewerPieceSolutions`/`proven` | Task 5 (`balancedSplit`, `matchesExactly`, `canonicalKey`); Task 6 (test đổi chỗ trong `searchSolutions`) |
| FP-09 | giới hạn 5 000 000 → `proven = false`; author vẫn ghi; `--release` chặn trừ `allowUnproven` | Task 5 (test `limit: 1000`, `balancedSplit` 5 mảnh); Task 2 (`allowUnproven`); Task 6 (`releaseBlocker`, cảnh báo author, cổng release) |
| FP-10 | `searchSolutions` dùng bộ giải, màn neo giữ nguyên số nghiệm | Task 6 (`searchSolutions` → `solveLevel`); Task 5 (test hồi quy `test.each` mọi `LEVEL_SOURCES`) |
| Mục 5 — validator | kiểm `placement`, một neo, bội của 8, `distractors` rỗng | Task 2 |
| Mục 5 — authoringReport | số tư thế, thời gian giải, `proven`; SVG chỉ neo A | Task 6 |
| Mục 5 — kit | `opts.placement = 'free'` bỏ `decoys` | Task 7 |
| Mục 6 — `freePlacement.test.ts` | giữa bàn, sát mép, hướng mới không vừa, điểm hoà; xem trước = thả; xoay `placed` tại chỗ và bị từ chối khi vượt biên | Task 1, Task 3, Task 4 |
| Mục 6 — `solver.test.ts` | 1/2/0 nghiệm; bàn 32 × 32 ba mảnh so với duyệt hết; giống hệt đổi chỗ = 1; vượt giới hạn; hồi quy màn neo | Task 5 |
| Mục 6 — ảnh harness | mảnh hít giao điểm, nhãn "Thả để khớp" | Task 8 Step 5 |
| Mục 7 — tiêu chí | màn thử 4 mảnh khung 48, `proven = true`, 1 nghiệm, thắng được ở harness; mọi kiểm tra xanh; màn neo không đổi | Task 5 (test bộ giải), Task 6 (báo cáo), Task 8 (PlayController thắng + ảnh), Task 2/6 Step kiểm `git status` không đổi JSON/báo cáo |

Kiểm tra thêm khi viết plan:
- Không còn chỗ nào trong `src/` so `kind === 'snapped'` mà bỏ sót `placed`: `layout.ts` và `drag.ts` đi qua `pieceBoardOrigin`; `BoardRenderer.ts` và `playController.ts` sửa trực tiếp; `session.ts` sửa ba nhánh.
- Tên kiểu và hàm thống nhất giữa các task: `PlacementMode`, `nearestGridOrigin`, `GRID_STEP`, `SNAP_RADIUS_SQ`, `pieceBoardOrigin`, `SolverOptions`, `SolverResult`, `solveLevel`, `buildPoseSpace`, `solvePoseSpace`, `balancedSplit`, `releaseBlocker`, `FREE_DEMO_SOURCE`.
- Mọi con số trong test lấy từ bảng "Con số đã tính trước" (prototype độc lập), không lấy từ code đang viết.

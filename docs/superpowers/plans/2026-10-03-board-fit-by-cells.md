# Sửa luật "vừa bàn": tính theo ô thật, không theo hộp khung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `checkSourceGeometry` chấp nhận mảnh có hộp khung thò ra ngoài bàn miễn là mọi **ô thật** của mảnh nằm trong bàn, để hai màn `3-5` và `3-6` của plan C author được với đúng toạ độ spec; màn bật xoay vẫn giữ luật hộp khung.

**Architecture:** Luật "vừa bàn" hiện nằm ở hai nơi với hai ngữ nghĩa khác nhau. `fitsBoard` (`domain/geometry.ts`) **đã** duyệt từng ô — màn chơi, bộ giải và validator nghiệm mẫu đều đúng rồi, không đụng tới. Chỉ `content/authoring.ts` đang kiểm hộp khung `anchor + frameSize`, ở hai chỗ: `checkSourceGeometry` (neo nào cũng kiểm) và `filterDecoys` (lý do `out-of-bounds` của KIT-03). Plan này gom hai chỗ đó về một hàm chung `anchorFitsBoard`, dùng `shapeCells` để lấy ô thật. Mảnh của màn `rotationEnabled: true` vẫn phải vừa cả hộp khung, vì bốn nấc xoay quay trong khung: ô ở nấc khác có thể chạm tới mép khung.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest. Không thêm dependency, không đổi renderer.

**Spec:** không có spec mới. Thẩm quyền là toạ độ bảng mục 4 của `docs/superpowers/specs/2026-10-02-c-chapter-2-hoa-pham-levels-design.md` (bảng đã được kiểm độc lập, plan C cấm tự chỉnh) và quyết định số 3 của `docs/superpowers/plans/2026-10-02-d-free-placement.md` ("Vừa bàn theo ô, không theo khung"). Plan này chỉ kéo `authoring.ts` về cho khớp hai tài liệu đó.

**Giao được gì:** `checkSourceGeometry` nhận `3-5 H1` (tam giác hướng 6, khung 64, neo `(24, 104)`) và `3-6 T1` (bình hành hướng 1, khung 48, neo `(88, 56)`); mọi màn đang có author lại ra JSON **không đổi một byte**; màn bật xoay vẫn bị từ chối nếu hộp khung thò ra.

## Vị trí trong loạt plan

- **Chạy sau:** plan B (đã merge vào `main` ở `dee44e5`). Làm trên nhánh `fix/board-fit-by-cells` tách từ `main`.
- **Chặn:** plan C task 11 (`3-5`) và task 12 (`3-6`). Merge plan này trước, rồi nhánh `feat/chapter-2-hoa-pham` rebase hoặc merge `main` vào để chạy tiếp.
- **Liên quan:** plan D dùng đúng ngữ nghĩa này ở bộ giải chế độ `free`; sau plan này quyết định số 3 của plan D không còn là ngoại lệ nữa.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`.
- Import nội bộ luôn kèm đuôi `.ts`; kiểu chỉ import bằng `import type`.
- Comment tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- **Không sửa `domain/geometry.ts`, `domain/mask.ts`, `application/drag.ts`, `domain/session.ts`.** Chúng đã dùng `fitsBoard` theo ô; plan này không đổi hành vi lúc chơi.
- **Không sửa nguồn màn nào, không sửa toạ độ nào.** Nếu sau khi sửa mà `content:author -- --all` làm đổi một file `src/content/levels/*.json`, **dừng lại** và báo người review: nghĩa là luật mới rộng hơn dự tính.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md`.
- Commit message tiếng Anh `type(scope): summary`.

## Con số đã tính trước

Tính bằng `shapeCells` trên `main` tại `1f7777b`:

| Mảnh | Hướng | Khung | Neo A | Hộp khung chạm | Ô thật chạm | Bàn |
|---|---|---|---|---|---|---|
| `3-5 H1` tam giác | 6 | 64 | (24, 104) | y = 168 | y = 135 | 160 |
| `3-6 T1` bình hành | 1 | 48 | (88, 56) | x = 136 | x = 119 | 128 |

Tam giác hướng 6 chỉ chiếm nửa trên khung; bình hành hướng 1 chỉ chiếm 1/3 giữa theo chiều ngang. Không màn nào trong 16 màn đang có bị luật cũ chặn, nên luật mới rộng hơn không làm đổi màn nào.

---

### Task 1: `anchorFitsBoard` theo ô thật trong `content/authoring.ts`

**Files:**
- Modify: `game-next/src/content/authoring.ts`
- Test: `game-next/tests/authoring.test.ts`

**Interfaces:**
- Consumes: `shapeCells` (`domain/shapes.ts`), `GRID_WIDTH`, `GRID_HEIGHT` (`domain/model.ts`) — cả hai đã import sẵn trong file.
- Produces: `anchorFitsBoard(piece: PieceSource, anchor: { x: number; y: number }, rotationEnabled: boolean): boolean`, dùng chung cho `checkSourceGeometry` và `filterDecoys`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `game-next/tests/authoring.test.ts`:

```ts
describe('vừa bàn tính theo ô thật', () => {
  function sourceWith(piece: LevelSource['pieces'][number], rotationEnabled = false): LevelSource {
    return {
      ...cloneSource(songTinh),
      rotationEnabled,
      pieces: [piece],
      sampleSolutions: [[{ pieceId: piece.id, anchorId: 'A', turns: 0 }]],
      distractors: [],
    };
  }

  const thuyenBuomHull: LevelSource['pieces'][number] = {
    id: 'H1',
    shapeKind: 'triangle',
    orientation: 6,
    frameSize: 64,
    anchors: [{ id: 'A', x: 24, y: 104 }],
  };

  const meoThanTail: LevelSource['pieces'][number] = {
    id: 'T1',
    shapeKind: 'parallelogram',
    orientation: 1,
    frameSize: 48,
    anchors: [{ id: 'A', x: 88, y: 56 }],
  };

  test('mái hướng 6 có khung thò dưới đáy nhưng ô thật trong bàn: nhận', () => {
    expect(checkSourceGeometry(sourceWith(thuyenBuomHull))).toEqual([]);
  });

  test('bình hành hướng 1 có khung thò phải nhưng ô thật trong bàn: nhận', () => {
    expect(checkSourceGeometry(sourceWith(meoThanTail))).toEqual([]);
  });

  test('ô thật vượt biên vẫn bị từ chối', () => {
    const overflow = { ...thuyenBuomHull, orientation: 4 as const };
    expect(checkSourceGeometry(sourceWith(overflow)).join('\n')).toMatch(/vượt biên bàn/);
  });

  test('màn bật xoay vẫn đòi cả hộp khung vừa bàn', () => {
    expect(checkSourceGeometry(sourceWith(thuyenBuomHull, true)).join('\n')).toMatch(
      /vượt biên bàn khi xoay/
    );
  });

  test('neo âm vẫn bị từ chối', () => {
    const negative = { ...meoThanTail, anchors: [{ id: 'A', x: -8, y: 56 }] };
    expect(checkSourceGeometry(sourceWith(negative)).join('\n')).toMatch(/vượt biên bàn/);
  });
});
```

Run: `npx vitest run tests/authoring.test.ts`
Expected: FAIL ở hai test đầu (luật cũ báo "khung mảnh vượt biên bàn") và ở test màn xoay (thông điệp chưa có chữ "khi xoay"). Ba test còn lại có thể xanh sẵn.

- [ ] **Step 2: Thêm `anchorFitsBoard`**

Trong `game-next/src/content/authoring.ts`, thêm ngay trên `checkSourceGeometry`:

```ts
/**
 * Mảnh đặt ở neo này có nằm trong bàn không.
 *
 * Màn không xoay: chỉ cần mọi **ô thật** của mảnh trong bàn — hộp khung được
 * phép thò ra, vì tam giác mái và bình hành không lấp kín khung (ví dụ `3-5
 * H1` và `3-6 T1` của spec C). Cùng ngữ nghĩa với `fitsBoard` lúc chơi.
 *
 * Màn bật xoay: đòi cả hộp khung vừa bàn, vì bốn nấc xoay quay trong khung
 * nên ô ở nấc khác có thể chạm tới mép khung.
 *
 * Gốc khung âm luôn bị từ chối: renderer đặt khung từ gốc này.
 */
export function anchorFitsBoard(
  piece: PieceSource,
  anchor: { x: number; y: number },
  rotationEnabled: boolean
): boolean {
  if (anchor.x < 0 || anchor.y < 0) return false;
  if (rotationEnabled) {
    return anchor.x + piece.frameSize <= GRID_WIDTH && anchor.y + piece.frameSize <= GRID_HEIGHT;
  }
  return shapeCells(piece.shapeKind, piece.orientation, piece.frameSize).every(
    ([cx, cy]) =>
      anchor.x + cx >= 0 &&
      anchor.y + cy >= 0 &&
      anchor.x + cx < GRID_WIDTH &&
      anchor.y + cy < GRID_HEIGHT
  );
}
```

- [ ] **Step 3: Dùng hàm chung trong `checkSourceGeometry`**

Thay khối kiểm biên hiện có

```ts
      if (
        anchor.x < 0 ||
        anchor.y < 0 ||
        anchor.x + piece.frameSize > GRID_WIDTH ||
        anchor.y + piece.frameSize > GRID_HEIGHT
      ) {
        problems.push(`${label}: khung mảnh vượt biên bàn`);
      }
```

bằng:

```ts
      if (!anchorFitsBoard(piece, anchor, source.rotationEnabled)) {
        problems.push(
          source.rotationEnabled
            ? `${label}: khung mảnh vượt biên bàn khi xoay`
            : `${label}: mảnh vượt biên bàn`
        );
      }
```

- [ ] **Step 4: Dùng hàm chung trong `filterDecoys`**

Trong `filterDecoys`, thay

```ts
      const outside =
        anchor.x < 0 ||
        anchor.y < 0 ||
        anchor.x + piece.frameSize > GRID_WIDTH ||
        anchor.y + piece.frameSize > GRID_HEIGHT;
```

bằng:

```ts
      const outside = !anchorFitsBoard(piece, anchor, source.rotationEnabled);
```

Giữ nguyên mã lý do `'out-of-bounds'` và thứ tự kiểm (vượt biên trước, trùng mảnh sau), để bảng "Neo nhiễu đã bỏ" trong báo cáo không đổi dạng.

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/authoring.test.ts tests/content.test.ts tests/kit.test.ts`
Expected: PASS toàn bộ. Nếu một test cũ đỏ vì luật mới rộng hơn, **dừng** và báo người review kèm tên test — không sửa test cho vừa code.

- [ ] **Step 6: Toàn bộ kiểm tra và chứng minh không đổi nội dung**

Run: `npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all`
Expected: xanh. Sau đó `git status --short src/content/levels docs/testing/levels` phải **trống**: luật mới không làm đổi màn nào đang có. Nếu có file đổi, dừng và báo.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-03 - Measure board fit by real cells in authoring`. Message: `fix(content): measure board fit by piece cells, not frame box`.

---

### Task 2: Ghi lại bất biến và dọn hồ sơ

**Files:**
- Modify: `docs/ai/ARCHITECTURE.md`
- Modify: `docs/ai/STATUS.md`
- Modify: `docs/ai/DOCS-INDEX.md`
- Modify: `docs/superpowers/plans/2026-10-02-d-free-placement.md`

- [ ] **Step 1: ARCHITECTURE**

Trong mục nói về pipeline nội dung, thêm bất biến:

> "Vừa bàn" luôn tính theo **ô thật** của mảnh, không theo hộp khung: `fitsBoard` (`domain/geometry.ts`) và `anchorFitsBoard` (`content/authoring.ts`) phải cùng ngữ nghĩa. Ngoại lệ duy nhất là màn `rotationEnabled: true`, nơi hộp khung phải vừa bàn vì bốn nấc xoay quay trong khung.

- [ ] **Step 2: STATUS**

Bỏ mục chặn "C: piece frames in sources 3-5 and 3-6 leave the board — needs a reviewer decision" khỏi phần Open decisions; ghi vào phần Now rằng plan C task 11–12 đã hết chặn sau khi nhánh này merge.

- [ ] **Step 3: DOCS-INDEX**

Thêm hàng cho plan này: không có spec, thẩm quyền là spec C mục 4 và quyết định 3 của plan D, trạng thái theo tiến độ thật.

- [ ] **Step 4: Plan D**

Ở quyết định số 3 của `2026-10-02-d-free-placement.md`, ghi thêm một câu: từ nhánh này, `authoring.ts` đã cùng ngữ nghĩa, nên quyết định đó không còn là điểm lệch giữa authoring và lúc chơi.

- [ ] **Step 5: CHANGELOG và commit**

Mục `### 2026-10-03 - Record the cell-based board-fit invariant`. Message: `docs(ai): record cell-based board fit invariant`.

---

## Kết thúc plan

`npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all` xanh, `src/content/levels/` và `docs/testing/levels/` không có file nào đổi; hai commit trên `fix/board-fit-by-cells`. Báo người review kèm: hai test chứng minh `3-5 H1` và `3-6 T1` được nhận, và test chứng minh màn bật xoay vẫn bị từ chối. Sau khi merge vào `main`, nhánh `feat/chapter-2-hoa-pham` lấy `main` về rồi chạy tiếp plan C task 11.

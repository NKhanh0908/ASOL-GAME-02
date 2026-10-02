# B — Bộ khung clone màn và cấu trúc 4 chương

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép tạo màn mới bằng cách clone (`npm run content:new`), đặt mảnh bằng hàm ghép hình thay vì tự tính gốc khung, tự bỏ neo nhiễu nguy hiểm (KIT-03), và đổi campaign thành 4 chương / 28 màn với chòm sao Họa Phẩm 10 nút.

**Architecture:** `content/kit.ts` là các hàm thuần trả về `PieceSource` (đổi tâm → gốc khung, lật gương bằng `mirrorOrientation` của plan A, đồng tâm, lặp). `buildLevelDocument` gọi `filterDecoys` trước khi kiểm hình học; báo cáo nghiệm liệt kê neo bị bỏ. `content/newLevel.ts` là phần thuần của lệnh clone (đổi tên, đổi trường, đăng ký bảng nguồn); `scripts/new-level.ts` chỉ đọc/ghi file. Thông tin chương (số La Mã, tên, luật xoay, số màn phát hành) gom vào `content/chapters.ts`; validator, HUD, bản đồ và cổng release cùng đọc từ đó. Toạ độ bản đồ chọn màn chuyển sang module thuần `presentation/constellationLayout.ts` suy ra từ manifest, nên test được không cần Phaser.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Node 24 `--experimental-strip-types`, Phaser 3.90, Chrome headless để chụp ảnh.

**Spec:** `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md`

**Giao được gì:** `npm run content:new -- <id> [--from <id>] [--title "<tên>"]` tạo và đăng ký nguồn mới; `src/content/kit.ts` (`piece`, `mirrorX`, `mirrorY`, `concentric`, `row`, `NUDGE`, `CROSS`); luật neo nhiễu KIT-03 trong `buildLevelDocument` và báo cáo; `docs/content/level-kit.md` kèm 15 ảnh hình; manifest 28 màn 4 chương; bản đồ chọn màn 4 chòm sao (Họa Phẩm 10 nút) có ảnh chụp; cổng release 28 màn; GDD cập nhật.

## Vị trí trong loạt plan

- **Chạy sau:** plan A (`2026-10-02-a-shapes-v2.md`) và Chương 1 giai đoạn 3 (`2026-10-02-chapter-1-levels-3-noi-dung.md`). Làm trên nhánh mới tách từ nhánh của plan A: `feat/level-kit-chapters`.
- **Chạy tiếp theo:** plan C (`2026-10-02-c-chapter-2-hoa-pham-levels.md`) và plan D (`2026-10-02-d-free-placement.md`), song song.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**; kiểu chỉ import bằng `import type`. Script chạy bằng `node --experimental-strip-types`: không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị tiếng Việt theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Luật hiện/ẩn giữ **chẵn lẻ (XOR)** trong `domain/mask.ts`; không sửa file đó.
- Lưới 128 × 160; 1 ô hiển thị = 8 ô logic; 1 module = 24. Neo là gốc khung, bội của 8 (kiểm ở authoring).
- Đã có từ plan A (không viết lại): `ShapeKind` 5 hình, `Orientation = 0..7`, `shapePolygon`, `shapeCells`, `effectiveOrientation`, `isValidOrientation`, `isValidFrame(kind, orientation, frameSize)` (bảng bám lưới), `isStructuralFrame`, `mirrorOrientation(kind, orientation, axis: 'x' | 'y')`, `CIRCLE_SEGMENTS = 32`; `checkSourceGeometry` đã từ chối khung sai `isValidFrame`.
- **Giữ nguyên trạng thái hiện có của 1-x** (`status`, `contentRevision`, `dataPath` của 1-1 → 1-6 do Chương 1 giai đoạn 3 đặt). Không bao giờ tự đặt `status: 'approved'`.
- Lệnh `content:new` **không** sửa `manifest.ts` hay `catalog.ts`.
- Không thêm dependency.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md` (gốc repo): `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, các gạch đầu dòng thay đổi kèm file, dòng cuối `- Verification: <lệnh và kết quả>`.
- Commit message tiếng Anh `type(scope): summary`, kết thúc bằng hai dòng:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Co-authored-by: Codex <noreply@codex.local>`
  Trên Windows dùng `git commit -F <file>` (file tạm trong scratchpad, không commit file đó).
- Dev server cho ảnh chụp: `npm run dev -- --port 5173 --strictPort` chạy nền; Chrome: `"/c/Program Files/Google/Chrome/Application/chrome.exe"`.

## Quyết định ngoài spec (đã chốt khi viết plan)

1. **Neo được bảo vệ khỏi KIT-03:** neo `A` và mọi neo được `sampleSolutions` trỏ tới. Spec chỉ nói neo A; thêm điều kiện thứ hai để không bao giờ làm hỏng nghiệm mẫu của nguồn cũ.
2. **Báo cáo chỉ thêm mục "Neo nhiễu đã bỏ" khi có neo bị bỏ**, để `docs/testing/levels/1-x-report.md` không đổi byte nào khi chạy lại `content:author`.
3. **`content:new` đổi cả `chapter`** theo tiền tố của id mới (`3-11` → `chapter: 3`) khi tiền tố là 1–4, để clone sang chương khác không lệch chương. Tiêu đề mặc định: tên trong manifest nếu id đã có, nếu không thì `Màn <id>`. `order`: số trong manifest nếu id đã có, nếu không thì `order` lớn nhất + 1.
4. **Validator thêm mã `chapter-rotation-required`** cho màn chương 4 có `rotationEnabled: false` (spec: "true ở chương 4"). `chapter-rotation-disabled` giữ tên, áp cho chương 1–3. `solution-rotation-disallowed` mở rộng từ chương 1 sang chương 1–3.
5. **`src/content/chapters.ts`** là nguồn duy nhất cho tên/số La Mã/luật xoay của chương và `RELEASE_LEVEL_COUNT = 28`. HUD đổi theo: nút Xoay chỉ hiện ở Chương 4, dòng phụ ghi "Chương IV".
6. **Bố cục bản đồ** tách sang `src/presentation/constellationLayout.ts` (thay vì nhét vào `constellationMotion.ts`). Chòm sao 6 nút giữ đúng công thức zigzag cũ (toạ độ Chương 1–2 không đổi); chòm sao đúng 10 nút dùng mẫu "chuỗi đèn lồng" `TEN_NODE_PATTERN`.
7. **Tham số dev `?scene=levelSelect&focus=<id>`** để cuộn bản đồ tới một màn khi chụp ảnh; bỏ qua ở bản build.
8. **GDD:** plan B viết luôn bảng Họa Phẩm trong Phụ lục B **đúng nguyên văn** bảng ở plan C Task 17 Step 2, và hàng `| **2-5** |` đúng nguyên văn plan C. Khi chạy plan C Task 17 Step 2, phần "Ngay sau bảng Phụ lục B, thêm…" đã có sẵn: chỉ kiểm tra, không thêm lần nữa. Sáu màn xoay tách ra bảng con "Chương 4 — Luân Chuyển".
9. **Nghiệm thu mục 7** chạy `--from 1-2` thay cho `--from 3-4`, vì nguồn 3-4 chỉ có sau plan C. Lệnh đúng nguyên văn spec (`3-11 --from 3-4`) được chạy lại ở cuối plan C.
10. **Ảnh bảng hình** sinh bằng script `npm run content:gallery` (`scripts/render-kit-gallery.ts`), có test khoá tài liệu trỏ đúng 15 ảnh.

## Con số đã tính trước

| Gọi hàm | Gốc khung kỳ vọng |
|---|---|
| `piece('S1', 'square', 48, [64, 80])` | (40, 56) |
| `concentric([64, 80], …)` tròn 96 / vuông 64 / thoi 64 / tròn 32 / thoi 16 | (16,32) (32,48) (32,48) (48,64) (56,72) — đúng bảng 3-10 của spec C |
| `row('S', 'square', 32, [24, 40], [32, 0], 3)` | S1 (8,24), S2 (40,24), S3 (72,24) |
| `mirrorX(piece('T1', 'triangle', 96, [80, 80], { orientation: 5 }), 64, 'T2')` | T2 hướng 7, gốc (0, 32) — đúng 2-2/2-3 của spec C |
| Hai tròn 32 gốc (80,16) và (88,16), neo nhiễu `CROSS` | bỏ `C1.B` (88,16) và `C2.C` (80,16); còn 1 nghiệm (trước khi bỏ: 2) |
| Bản đồ: nút đầu Chương 1 / 2 / 3 / 4 | y = 270 / 1330 / 2390 / 3490; tổng chiều cao 4530 |

---

### Task 1: Thư viện ghép hình `content/kit.ts`

**Files:**
- Create: `game-next/src/content/kit.ts`
- Test: `game-next/tests/kit.test.ts`

**Interfaces:**
- Consumes: `PieceSource`, `ANCHOR_STEP` (`src/content/authoring.ts`); `isValidFrame`, `isValidOrientation`, `mirrorOrientation`, `shapeCells`, `shapePolygon` (`src/domain/shapes.ts`, plan A); `Orientation`, `ShapeKind` (`src/domain/model.ts`).
- Produces:
  - `type DecoyOffsets = ReadonlyArray<readonly [number, number]>`
  - `type PieceSpec = { id: string; kind: ShapeKind; size: number; orientation?: Orientation; decoys?: DecoyOffsets }`
  - `piece(id, kind, size, center: readonly [number, number], opts?: { orientation?: Orientation; decoys?: DecoyOffsets }): PieceSource`
  - `mirrorX(p: PieceSource, axisX: number, newId: string): PieceSource`, `mirrorY(p, axisY, newId)`
  - `concentric(center, specs: PieceSpec[]): PieceSource[]`
  - `row(idPrefix, kind, size, startCenter, step: readonly [number, number], count, opts?): PieceSource[]`
  - `NUDGE`, `CROSS`, `DECOY_IDS = ['B','C','D','E','F']`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/kit.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type { PieceSource } from '../src/content/authoring.ts';
import { CROSS, NUDGE, concentric, mirrorX, mirrorY, piece, row } from '../src/content/kit.ts';
import type { Orientation } from '../src/domain/model.ts';
import { shapeCells, shapePolygon } from '../src/domain/shapes.ts';
import type { Vertex } from '../src/domain/shapes.ts';

/** Tâm điểm nằm đúng trên một cạnh của đa giác (kể cả đầu mút). */
function onOutline(polygon: readonly Vertex[], px: number, py: number): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    const within =
      px >= Math.min(a.x, b.x) &&
      px <= Math.max(a.x, b.x) &&
      py >= Math.min(a.y, b.y) &&
      py <= Math.max(a.y, b.y);
    if (cross === 0 && within) return true;
  }
  return false;
}

/** Ô tuyệt đối trên bàn của mảnh đặt ở neo A. */
function absoluteCells(p: PieceSource): Set<string> {
  const a = p.anchors[0];
  return new Set(
    shapeCells(p.shapeKind, p.orientation, p.frameSize).map(([x, y]) => `${a.x + x},${a.y + y}`)
  );
}

/**
 * So ảnh gương bằng tập ô: phản chiếu từng ô của mảnh gốc rồi so với raster
 * của mảnh lật. Chỉ được lệch ở ô có tâm nằm đúng trên viền (quy tắc trên-trái).
 */
function expectMirrorImage(
  original: PieceSource,
  mirrored: PieceSource,
  reflect: (x: number, y: number) => readonly [number, number]
): void {
  const reflected = new Set(
    [...absoluteCells(original)].map((k) => {
      const [x, y] = k.split(',').map(Number);
      const [rx, ry] = reflect(x, y);
      return `${rx},${ry}`;
    })
  );
  const direct = absoluteCells(mirrored);
  const polygon = shapePolygon(mirrored.shapeKind, mirrored.orientation, mirrored.frameSize);
  const a = mirrored.anchors[0];
  const diff = [
    ...[...reflected].filter((k) => !direct.has(k)),
    ...[...direct].filter((k) => !reflected.has(k)),
  ];
  expect(diff.length).toBeLessThanOrEqual(2 * mirrored.frameSize);
  for (const k of diff) {
    const [x, y] = k.split(',').map(Number);
    expect(onOutline(polygon, x - a.x + 0.5, y - a.y + 0.5)).toBe(true);
  }
}

describe('piece: đặt mảnh theo tâm khung', () => {
  test('đổi tâm ra gốc khung = tâm − khung/2', () => {
    expect(piece('S1', 'square', 48, [64, 80])).toEqual({
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [{ id: 'A', x: 40, y: 56 }],
    });
  });

  test('neo nhiễu đặt tên B, C, D… theo thứ tự độ lệch', () => {
    const p = piece('T1', 'triangle', 48, [40, 56], { orientation: 4, decoys: NUDGE });
    expect(p.orientation).toBe(4);
    expect(p.anchors).toEqual([
      { id: 'A', x: 16, y: 32 },
      { id: 'B', x: 24, y: 32 },
      { id: 'C', x: 8, y: 32 },
      { id: 'D', x: 16, y: 40 },
    ]);
  });

  test('hằng neo nhiễu sẵn có', () => {
    expect(NUDGE).toEqual([[8, 0], [-8, 0], [0, 8]]);
    expect(CROSS).toEqual([[8, 0], [-8, 0], [0, 8], [0, -8]]);
  });

  test('từ chối tâm cho gốc khung lệch lưới', () => {
    expect(() => piece('S1', 'square', 48, [60, 80])).toThrow(/không phải bội của 8/);
  });

  test('từ chối khung sai loại hình và neo nhiễu lệch lưới', () => {
    expect(() => piece('K1', 'diamond', 24, [64, 80])).toThrow(/khung 24 không hợp lệ cho diamond/);
    expect(() => piece('S1', 'square', 48, [64, 80], { decoys: [[4, 0]] })).toThrow(/neo nhiễu \(4, 0\)/);
    expect(() =>
      piece('S1', 'square', 48, [64, 80], {
        decoys: [[8, 0], [-8, 0], [0, 8], [0, -8], [16, 0], [-16, 0]],
      })
    ).toThrow(/tối đa 5 neo nhiễu/);
  });
});

describe('mirrorX / mirrorY: ảnh gương đối chiếu bằng tập ô', () => {
  test('mirrorX mỗi hướng tam giác', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      const p = piece('P', 'triangle', 48, [40, 56], { orientation: o });
      const m = mirrorX(p, 64, 'Q');
      expect(m.anchors[0]).toEqual({ id: 'A', x: 64, y: 32 });
      expectMirrorImage(p, m, (x, y) => [127 - x, y]);
    }
  });

  test('mirrorX mỗi hướng bình hành', () => {
    for (const o of [0, 1, 2, 3] as Orientation[]) {
      const p = piece('P', 'parallelogram', 48, [40, 56], { orientation: o });
      const m = mirrorX(p, 64, 'Q');
      expect(m.orientation).toBe(([2, 3, 0, 1] as const)[o]);
      expectMirrorImage(p, m, (x, y) => [127 - x, y]);
    }
  });

  test('mirrorY mỗi hướng tam giác và bình hành', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      const p = piece('P', 'triangle', 48, [40, 56], { orientation: o });
      const m = mirrorY(p, 80, 'Q');
      expect(m.anchors[0]).toEqual({ id: 'A', x: 16, y: 80 });
      expectMirrorImage(p, m, (x, y) => [x, 159 - y]);
    }
    for (const o of [0, 1, 2, 3] as Orientation[]) {
      const p = piece('P', 'parallelogram', 48, [40, 56], { orientation: o });
      expectMirrorImage(p, mirrorY(p, 80, 'Q'), (x, y) => [x, 159 - y]);
    }
  });

  test('neo nhiễu được lật theo; hình tròn giữ hướng 0', () => {
    const p = piece('C1', 'circle', 48, [40, 56], { decoys: [[8, 0], [0, 8]] });
    const m = mirrorX(p, 64, 'C2');
    expect(m.id).toBe('C2');
    expect(m.orientation).toBe(0);
    expect(m.anchors).toEqual([
      { id: 'A', x: 64, y: 32 },
      { id: 'B', x: 56, y: 32 },
      { id: 'C', x: 64, y: 40 },
    ]);
  });

  test('cánh 2-2/2-3 của spec C: hướng 5 lật thành 7 tại gốc (0, 32)', () => {
    const wing = piece('T1', 'triangle', 96, [80, 80], { orientation: 5, decoys: [[-8, 0], [0, 8], [0, -8]] });
    expect(wing.anchors[0]).toEqual({ id: 'A', x: 32, y: 32 });
    const other = mirrorX(wing, 64, 'T2');
    expect(other.orientation).toBe(7);
    expect(other.anchors).toEqual([
      { id: 'A', x: 0, y: 32 },
      { id: 'B', x: 8, y: 32 },
      { id: 'C', x: 0, y: 40 },
      { id: 'D', x: 0, y: 24 },
    ]);
  });

  test('từ chối trục làm gốc khung lệch lưới', () => {
    const p = piece('P', 'square', 48, [40, 56]);
    expect(() => mirrorX(p, 62, 'Q')).toThrow(/không phải bội của 8/);
    expect(() => mirrorY(p, 81, 'Q')).toThrow(/không phải bội của 8/);
  });
});

describe('concentric và row', () => {
  test('concentric cho đúng gốc khung của mandala 3-10', () => {
    const pieces = concentric([64, 80], [
      { id: 'C1', kind: 'circle', size: 96, decoys: NUDGE },
      { id: 'S1', kind: 'square', size: 64 },
      { id: 'D1', kind: 'diamond', size: 64 },
      { id: 'C2', kind: 'circle', size: 32 },
      { id: 'K1', kind: 'diamond', size: 16 },
    ]);
    expect(pieces.map((p) => [p.id, p.anchors[0].x, p.anchors[0].y])).toEqual([
      ['C1', 16, 32],
      ['S1', 32, 48],
      ['D1', 32, 48],
      ['C2', 48, 64],
      ['K1', 56, 72],
    ]);
    expect(pieces[0].anchors.map((a) => a.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  test('row lặp theo bước, id <prefix>1..n', () => {
    const pieces = row('S', 'square', 32, [24, 40], [32, 0], 3, { decoys: [[0, 8]] });
    expect(pieces.map((p) => [p.id, p.anchors[0].x, p.anchors[0].y])).toEqual([
      ['S1', 8, 24],
      ['S2', 40, 24],
      ['S3', 72, 24],
    ]);
    expect(pieces[2].anchors[1]).toEqual({ id: 'B', x: 72, y: 32 });
    expect(() => row('S', 'square', 32, [24, 40], [32, 0], 0)).toThrow(/số nguyên ≥ 1/);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/kit.test.ts`
Expected: FAIL — `Failed to resolve import "../src/content/kit.ts"`.

- [ ] **Step 3: Viết `kit.ts`**

Tạo `game-next/src/content/kit.ts`:

```ts
import type { Orientation, ShapeKind } from '../domain/model.ts';
import { isValidFrame, isValidOrientation, mirrorOrientation } from '../domain/shapes.ts';
import { ANCHOR_STEP } from './authoring.ts';
import type { PieceSource } from './authoring.ts';

/** Độ lệch neo nhiễu [dx, dy] so với neo A, đơn vị ô logic (bội của 8). */
export type DecoyOffsets = ReadonlyArray<readonly [number, number]>;

export type PieceOptions = { orientation?: Orientation; decoys?: DecoyOffsets };

/** Mô tả một mảnh trong `concentric`: cùng tâm, khác hình/khung/hướng. */
export type PieceSpec = {
  id: string;
  kind: ShapeKind;
  size: number;
  orientation?: Orientation;
  decoys?: DecoyOffsets;
};

/** Ba neo nhiễu sát: lệch phải, lệch trái, lệch xuống 8 ô. */
export const NUDGE: DecoyOffsets = [[8, 0], [-8, 0], [0, 8]];
/** Bốn neo nhiễu chữ thập: lệch phải, trái, xuống, lên 8 ô. */
export const CROSS: DecoyOffsets = [[8, 0], [-8, 0], [0, 8], [0, -8]];
/** Neo A là vị trí đúng; neo nhiễu đặt tên lần lượt B–F. */
export const DECOY_IDS = ['B', 'C', 'D', 'E', 'F'] as const;

function onGrid(value: number): boolean {
  return Number.isInteger(value) && value % ANCHOR_STEP === 0;
}

/**
 * Đặt mảnh theo tâm khung. Gốc khung = tâm − khung/2, phải là bội của 8.
 * Khung phải hợp lệ cho loại hình (bảng spec A mục 3).
 */
export function piece(
  id: string,
  kind: ShapeKind,
  size: number,
  center: readonly [number, number],
  opts: PieceOptions = {}
): PieceSource {
  const orientation = opts.orientation ?? 0;
  if (!isValidOrientation(kind, orientation)) {
    throw new Error(`piece ${id}: hướng ${orientation} không hợp lệ cho ${kind}`);
  }
  if (!isValidFrame(kind, orientation, size)) {
    throw new Error(`piece ${id}: khung ${size} không hợp lệ cho ${kind} hướng ${orientation}`);
  }
  const [cx, cy] = center;
  const x = cx - size / 2;
  const y = cy - size / 2;
  if (!onGrid(x) || !onGrid(y)) {
    throw new Error(
      `piece ${id}: tâm (${cx}, ${cy}) cho gốc khung (${x}, ${y}), không phải bội của ${ANCHOR_STEP}`
    );
  }
  const decoys = opts.decoys ?? [];
  if (decoys.length > DECOY_IDS.length) {
    throw new Error(`piece ${id}: tối đa ${DECOY_IDS.length} neo nhiễu (B–F), nhận ${decoys.length}`);
  }
  const anchors: PieceSource['anchors'] = [{ id: 'A', x, y }];
  decoys.forEach(([dx, dy], i) => {
    if (!onGrid(dx) || !onGrid(dy)) {
      throw new Error(`piece ${id}: neo nhiễu (${dx}, ${dy}) không phải bội của ${ANCHOR_STEP}`);
    }
    anchors.push({ id: DECOY_IDS[i], x: x + dx, y: y + dy });
  });
  return { id, shapeKind: kind, orientation, frameSize: size, anchors };
}

function mirrored(p: PieceSource, newId: string, axis: 'x' | 'y', line: number): PieceSource {
  const anchors = p.anchors.map((a) => {
    const x = axis === 'x' ? 2 * line - a.x - p.frameSize : a.x;
    const y = axis === 'y' ? 2 * line - a.y - p.frameSize : a.y;
    if (!onGrid(x) || !onGrid(y)) {
      throw new Error(
        `mirror${axis.toUpperCase()} ${newId}: trục ${axis} = ${line} đưa neo ${a.id} tới (${x}, ${y}), không phải bội của ${ANCHOR_STEP}`
      );
    }
    return { id: a.id, x, y };
  });
  return {
    id: newId,
    shapeKind: p.shapeKind,
    orientation: mirrorOrientation(p.shapeKind, p.orientation, axis),
    frameSize: p.frameSize,
    anchors,
  };
}

/** Bản đối xứng trái–phải qua đường thẳng đứng x = axisX; neo nhiễu lật theo. */
export function mirrorX(p: PieceSource, axisX: number, newId: string): PieceSource {
  return mirrored(p, newId, 'x', axisX);
}

/** Bản đối xứng trên–dưới qua đường nằm ngang y = axisY; neo nhiễu lật theo. */
export function mirrorY(p: PieceSource, axisY: number, newId: string): PieceSource {
  return mirrored(p, newId, 'y', axisY);
}

/** Nhiều mảnh chung một tâm khung. */
export function concentric(center: readonly [number, number], specs: readonly PieceSpec[]): PieceSource[] {
  return specs.map((s) =>
    piece(s.id, s.kind, s.size, center, { orientation: s.orientation, decoys: s.decoys })
  );
}

/** Lặp một mảnh theo bước [dx, dy]; id là <idPrefix>1..count. */
export function row(
  idPrefix: string,
  kind: ShapeKind,
  size: number,
  startCenter: readonly [number, number],
  step: readonly [number, number],
  count: number,
  opts: PieceOptions = {}
): PieceSource[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`row ${idPrefix}: count phải là số nguyên ≥ 1, nhận ${count}`);
  }
  return Array.from({ length: count }, (_, i) =>
    piece(
      `${idPrefix}${i + 1}`,
      kind,
      size,
      [startCenter[0] + i * step[0], startCenter[1] + i * step[1]],
      opts
    )
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/kit.test.ts`
Expected: PASS (13 test). Nếu một test `expectMirrorImage` đỏ vì ô lệch **không** nằm trên viền: dừng, đối chiếu bảng `mirrorOrientation` của plan A với spec B mục 3 (tam giác TL↔TR, BL↔BR, mái 5↔7 theo trục dọc; TL↔BL, TR↔BR, mái 4↔6 theo trục ngang; bình hành 0↔2, 1↔3), không nới test.

- [ ] **Step 5: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 6: CHANGELOG và commit**

Thêm đầu `## Unreleased` trong `../CHANGELOG.md`:

```markdown
### 2026-10-02 - Add level kit placement helpers

- Added `src/content/kit.ts` with `piece` (center-based placement), `mirrorX`, `mirrorY`, `concentric`, `row` and the `NUDGE`/`CROSS` decoy offsets; every helper rejects off-grid origins and frames that fail `isValidFrame`.
- Added `tests/kit.test.ts` comparing mirrored triangles and parallelograms by cell sets.
- Verification: `npx vitest run tests/kit.test.ts` failed before the module existed and passes after; `npm run typecheck` and `npm test` pass.
```

Message:

```text
feat(content): add level kit placement helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/kit.ts tests/kit.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 2: Luật neo nhiễu KIT-03 trong authoring và báo cáo

**Files:**
- Modify: `game-next/src/content/authoring.ts` (thêm `filterDecoys`, gọi trong `buildLevelDocument`)
- Modify: `game-next/src/content/authoringReport.ts` (`renderReportMarkdown`)
- Modify: `game-next/scripts/author-level.ts`
- Test: `game-next/tests/authoring.test.ts` (thêm một `describe` cuối file)

**Interfaces:**
- Consumes: `piece`, `CROSS` (Task 1); `searchSolutions` (`authoringReport.ts`).
- Produces:
  - `type DroppedDecoy = { pieceId: string; anchorId: string; reason: 'out-of-bounds' | 'clashes-identical-piece' }`
  - `filterDecoys(source: LevelSource): { source: LevelSource; dropped: DroppedDecoy[] }` — không sửa input.
  - `buildLevelDocument` gọi `filterDecoys` trước `checkSourceGeometry`.
  - `renderReportMarkdown(doc, report, dropped: readonly DroppedDecoy[] = [])`.

- [ ] **Step 1: Viết test thất bại**

(a) Trong `game-next/tests/authoring.test.ts`, đổi hai dòng import đầu file thành:

```ts
import { buildLevelDocument, checkSourceGeometry, filterDecoys } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import { renderReportMarkdown, searchSolutions } from '../src/content/authoringReport.ts';
import { CROSS, piece } from '../src/content/kit.ts';
```

(b) Thêm vào **cuối** file:

```ts
describe('luật neo nhiễu KIT-03', () => {
  /** Ca 3-8: hai hình tròn giống hệt, neo nhiễu ±8 của mỗi cái trùng neo A của cái kia. */
  function twoCircles(): LevelSource {
    return {
      ...cloneSource(songTinh),
      id: 'test-kit03',
      chapter: 3,
      order: 20,
      pieces: [
        piece('C1', 'circle', 32, [96, 32], { decoys: CROSS }),
        piece('C2', 'circle', 32, [104, 32], { decoys: CROSS }),
      ],
      sampleSolutions: [
        [
          { pieceId: 'C1', anchorId: 'A', turns: 0 },
          { pieceId: 'C2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [
        { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
        { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
        { pieceId: 'C2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
      ],
      ftueSteps: [],
    };
  }

  test('bỏ neo nhiễu trùng neo A của mảnh cùng hình, cùng hướng, cùng khung', () => {
    const source = twoCircles();
    expect(source.pieces[0].anchors[0]).toEqual({ id: 'A', x: 80, y: 16 });
    expect(source.pieces[1].anchors[0]).toEqual({ id: 'A', x: 88, y: 16 });
    const { source: filtered, dropped } = filterDecoys(source);
    expect(dropped).toEqual([
      { pieceId: 'C1', anchorId: 'B', reason: 'clashes-identical-piece' },
      { pieceId: 'C2', anchorId: 'C', reason: 'clashes-identical-piece' },
    ]);
    expect(filtered.pieces[0].anchors.map((a) => a.id)).toEqual(['A', 'C', 'D', 'E']);
    expect(filtered.pieces[1].anchors.map((a) => a.id)).toEqual(['A', 'B', 'D', 'E']);
    // Gây nhiễu trỏ vào neo đã bỏ cũng bị bỏ
    expect(filtered.distractors).toEqual([{ pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' }]);
    // Không sửa nguồn gốc
    expect(source.pieces[0].anchors).toHaveLength(5);
  });

  test('sau khi lọc chỉ còn một nghiệm; giữ neo trùng thì có nghiệm thứ hai', () => {
    const doc = buildLevelDocument(twoCircles());
    expect(validateLevel(doc).ok).toBe(true);
    expect(searchSolutions(doc).solutionCount).toBe(1);
    expect(searchSolutions(doc).fewerPieceSolutions).toBe(0);

    const unsafe = structuredClone(doc);
    unsafe.pieces[0].anchors.push({ id: 'B', x: 88, y: 16 });
    unsafe.pieces[1].anchors.push({ id: 'C', x: 80, y: 16 });
    expect(searchSolutions(unsafe).solutionCount).toBe(2);
  });

  test('bỏ neo nhiễu vượt biên bàn, giữ neo A', () => {
    const source: LevelSource = {
      ...cloneSource(songTinh),
      pieces: [piece('S1', 'square', 48, [24, 24], { decoys: CROSS })],
      sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
      distractors: [
        { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
        { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
      ],
    };
    const { dropped } = filterDecoys(source);
    expect(dropped).toEqual([
      { pieceId: 'S1', anchorId: 'C', reason: 'out-of-bounds' },
      { pieceId: 'S1', anchorId: 'E', reason: 'out-of-bounds' },
    ]);
    const doc = buildLevelDocument(source);
    expect(doc.pieces[0].anchors.map((a) => a.id)).toEqual(['A', 'B', 'D']);
    expect(doc.distractors).toEqual([{ pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' }]);
  });

  test('neo A vượt biên vẫn bị từ chối, không bị lọc', () => {
    const source: LevelSource = {
      ...cloneSource(songTinh),
      pieces: [piece('S1', 'square', 48, [16, 24])],
      sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
      distractors: [],
    };
    expect(filterDecoys(source).dropped).toEqual([]);
    expect(() => buildLevelDocument(source)).toThrow(/vượt biên/);
  });

  test('các màn đã có nguồn không mất neo nào', () => {
    for (const source of Object.values(LEVEL_SOURCES)) {
      expect(filterDecoys(source).dropped).toEqual([]);
    }
  });

  test('báo cáo liệt kê neo đã bỏ; không có neo bỏ thì không thêm mục', () => {
    const source = twoCircles();
    const doc = buildLevelDocument(source);
    const md = renderReportMarkdown(doc, searchSolutions(doc), filterDecoys(source).dropped);
    expect(md).toContain('## Neo nhiễu đã bỏ (KIT-03)');
    expect(md).toContain('| C1 | B | Trùng neo A của mảnh cùng hình, cùng hướng, cùng khung |');
    expect(md).toContain('| C2 | C | Trùng neo A của mảnh cùng hình, cùng hướng, cùng khung |');
    const plain = buildLevelDocument(songTinh);
    expect(renderReportMarkdown(plain, searchSolutions(plain))).not.toContain('Neo nhiễu đã bỏ');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/authoring.test.ts`
Expected: FAIL — `filterDecoys` không được export (`TypeError: filterDecoys is not a function` hoặc lỗi import); các test cũ vẫn PASS.

- [ ] **Step 3: `filterDecoys` trong `authoring.ts`**

Trong `game-next/src/content/authoring.ts`, thêm ngay **sau** hàm `checkSourceGeometry`:

```ts
/** Neo bị luật KIT-03 bỏ, liệt kê trong báo cáo `<id>-report.md`. */
export type DroppedDecoy = {
  pieceId: string;
  anchorId: string;
  reason: 'out-of-bounds' | 'clashes-identical-piece';
};

/** Neo đúng của mỗi mảnh; không bao giờ bị lọc. */
export const TRUE_ANCHOR_ID = 'A';

/**
 * Luật neo nhiễu KIT-03, chạy trước kiểm hình học:
 * - bỏ neo nhiễu có khung vượt biên bàn;
 * - bỏ neo nhiễu trùng neo A của một mảnh khác cùng hình, cùng hướng, cùng
 *   khung (hai mảnh giống hệt đổi chỗ được sẽ sinh nghiệm thứ hai — lỗi gặp ở
 *   bản nháp 3-8).
 * Neo A và neo mà nghiệm mẫu trỏ tới luôn được giữ. Gây nhiễu trỏ vào neo bị
 * bỏ cũng bị bỏ. Không sửa `source`.
 */
export function filterDecoys(source: LevelSource): { source: LevelSource; dropped: DroppedDecoy[] } {
  const usedBySolution = new Set(
    source.sampleSolutions.flat().map((step) => `${step.pieceId}.${step.anchorId}`)
  );
  const dropped: DroppedDecoy[] = [];
  const pieces = source.pieces.map((piece) => {
    const anchors = piece.anchors.filter((anchor) => {
      if (anchor.id === TRUE_ANCHOR_ID || usedBySolution.has(`${piece.id}.${anchor.id}`)) {
        return true;
      }
      const outside =
        anchor.x < 0 ||
        anchor.y < 0 ||
        anchor.x + piece.frameSize > GRID_WIDTH ||
        anchor.y + piece.frameSize > GRID_HEIGHT;
      if (outside) {
        dropped.push({ pieceId: piece.id, anchorId: anchor.id, reason: 'out-of-bounds' });
        return false;
      }
      const clashes = source.pieces.some(
        (other) =>
          other !== piece &&
          other.shapeKind === piece.shapeKind &&
          other.orientation === piece.orientation &&
          other.frameSize === piece.frameSize &&
          other.anchors.some((a) => a.id === TRUE_ANCHOR_ID && a.x === anchor.x && a.y === anchor.y)
      );
      if (clashes) {
        dropped.push({ pieceId: piece.id, anchorId: anchor.id, reason: 'clashes-identical-piece' });
        return false;
      }
      return true;
    });
    return { ...piece, anchors: anchors.map((a) => ({ ...a })) };
  });
  const droppedKeys = new Set(dropped.map((d) => `${d.pieceId}.${d.anchorId}`));
  const distractors = source.distractors.filter(
    (d) => d.anchorId === undefined || !droppedKeys.has(`${d.pieceId}.${d.anchorId}`)
  );
  return { source: { ...source, pieces, distractors }, dropped };
}
```

Rồi trong `buildLevelDocument`, thay hai dòng đầu thân hàm

```ts
export function buildLevelDocument(source: LevelSource): LevelDocument {
  const problems = checkSourceGeometry(source);
```

bằng:

```ts
export function buildLevelDocument(input: LevelSource): LevelDocument {
  // KIT-03 chạy trước kiểm hình học: neo nhiễu vượt biên bị bỏ thay vì báo lỗi
  const { source } = filterDecoys(input);
  const problems = checkSourceGeometry(source);
```

(Phần còn lại của hàm dùng biến `source` như cũ, không sửa.)

- [ ] **Step 4: Báo cáo liệt kê neo bị bỏ**

Trong `game-next/src/content/authoringReport.ts`:

(a) Thêm dưới import `LevelDocument`:

```ts
import type { DroppedDecoy } from './authoring.ts';
```

(b) Thay toàn bộ hàm `renderReportMarkdown` bằng:

```ts
const DROP_REASON_TEXT: Readonly<Record<DroppedDecoy['reason'], string>> = {
  'out-of-bounds': 'Vượt biên bàn',
  'clashes-identical-piece': 'Trùng neo A của mảnh cùng hình, cùng hướng, cùng khung',
};

export function renderReportMarkdown(
  doc: LevelDocument,
  report: SolutionReport,
  dropped: readonly DroppedDecoy[] = []
): string {
  // Chỉ thêm mục khi có neo bị bỏ, để báo cáo các màn cũ không đổi
  const droppedLines =
    dropped.length === 0
      ? []
      : [
          '## Neo nhiễu đã bỏ (KIT-03)',
          '',
          '| Mảnh | Neo | Lý do |',
          '|---|---|---|',
          ...dropped.map((d) => `| ${d.pieceId} | ${d.anchorId} | ${DROP_REASON_TEXT[d.reason]} |`),
          '',
        ];
  const lines = [
    `# ${doc.id} ${doc.title}`,
    '',
    `- Revision: \`${doc.contentRevision}\``,
    `- Mục tiêu học: ${doc.learningObjective}`,
    `- Số mảnh: ${doc.pieces.length}; số ô mục tiêu: ${doc.targetCells.length}`,
    `- Số nghiệm: ${report.solutionCount}`,
    `- Nghiệm dùng ít mảnh hơn: ${report.fewerPieceSolutions}`,
    '',
    '## Tư thế gây nhiễu',
    '',
    '| Mảnh | Neo | Lý do | Số ô đổi so với mục tiêu |',
    '|---|---|---|---|',
    ...report.distractors.map(
      (d) => `| ${d.pieceId} | ${d.anchorId ?? '—'} | ${d.reason} | ${d.changedCells ?? '—'} |`
    ),
    '',
    ...droppedLines,
    `Ảnh xem trước: \`${doc.id}.svg\`. Sinh bằng \`npm run content:author -- ${doc.id}\`; không sửa tay.`,
    '',
  ];
  return lines.join('\n');
}
```

- [ ] **Step 5: CLI truyền neo bị bỏ vào báo cáo**

Trong `game-next/scripts/author-level.ts`:

(a) Đổi import authoring thành:

```ts
import { buildLevelDocument, filterDecoys, serializeLevelDocument } from '../src/content/authoring.ts';
```

(b) Thay dòng

```ts
  writeFileSync(resolve(REPORT_DIR, `${id}-report.md`), renderReportMarkdown(doc, report), 'utf8');
```

bằng:

```ts
  const { dropped } = filterDecoys(source);
  writeFileSync(resolve(REPORT_DIR, `${id}-report.md`), renderReportMarkdown(doc, report, dropped), 'utf8');
  if (dropped.length > 0) {
    console.log(`[author-level] ${id}: bỏ ${dropped.length} neo nhiễu theo KIT-03 (xem ${id}-report.md)`);
  }
```

- [ ] **Step 6: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/authoring.test.ts tests/authoringReport.test.ts`
Expected: PASS toàn bộ, kể cả "tạo lại 1-1 cho đúng file đã commit".

- [ ] **Step 7: Toàn bộ kiểm tra, dữ liệu cũ không đổi**

Run: `npm run typecheck && npm test && npm run content:author -- --all && npm run content:validate`
Expected: xanh; mỗi màn in `PASS`, không màn nào in dòng "bỏ … neo nhiễu".
Run: `git status --short src/content/levels ../docs/testing/levels`
Expected: không có dòng nào (JSON, SVG, báo cáo của mọi màn 1-x giống hệt trước). Nếu có file đổi: dừng, báo người review kèm diff.

- [ ] **Step 8: CHANGELOG và commit**

```markdown
### 2026-10-02 - Drop unsafe decoy anchors during authoring

- Added `filterDecoys` to `src/content/authoring.ts`: decoy anchors outside the board, or equal to the A anchor of another piece with the same shape, orientation and frame, are dropped before geometry checks; distractors pointing at dropped anchors are removed (KIT-03).
- `renderReportMarkdown` in `src/content/authoringReport.ts` lists dropped anchors; `scripts/author-level.ts` passes them through.
- Added the 3-8 twin-circle regression to `tests/authoring.test.ts` (one solution after filtering, two without).
- Verification: the new tests failed before `filterDecoys` existed and pass after; `npm run typecheck`, `npm test`, `npm run content:author -- --all` and `npm run content:validate` pass with no change to committed level data or reports.
```

Message:

```text
feat(content): drop unsafe decoy anchors during authoring

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/authoring.ts src/content/authoringReport.ts scripts/author-level.ts tests/authoring.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 3: File mẫu và lệnh `content:new`

**Files:**
- Create: `game-next/src/content/sources/_template.ts`
- Create: `game-next/src/content/newLevel.ts`
- Create: `game-next/scripts/new-level.ts`
- Modify: `game-next/package.json` (script `content:new`)
- Modify: `game-next/README.md` (một dòng lệnh)
- Test: `game-next/tests/newLevel.test.ts`

**Interfaces:**
- Consumes: `piece` (Task 1); `LevelSource`, `buildLevelDocument` (`authoring.ts`); `searchSolutions`; `validateLevel`; `LEVEL_SOURCES`; `campaignManifest`; `ManifestEntry`.
- Produces:
  - `src/content/sources/_template.ts`: `export const levelTemplate: LevelSource` (không đăng ký).
  - `src/content/newLevel.ts`: `stripVietnamese(text)`, `constNameFromTitle(title)`, `slugFromTitle(title)`, `compareLevelIds(a, b)`, `createLevelSourceText(opts: { id; order; title; fromText; fromConstName; slug }): string`, `registerInSourceIndex(indexText, id, constName): string`.
  - `scripts/new-level.ts`: `createNewLevel(opts: NewLevelOptions): NewLevelResult` (export để test chạy trên thư mục tạm) và phần CLI chỉ chạy khi gọi trực tiếp.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/newLevel.test.ts`:

```ts
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createNewLevel } from '../scripts/new-level.ts';
import { buildLevelDocument } from '../src/content/authoring.ts';
import { searchSolutions } from '../src/content/authoringReport.ts';
import {
  compareLevelIds,
  constNameFromTitle,
  createLevelSourceText,
  registerInSourceIndex,
  slugFromTitle,
} from '../src/content/newLevel.ts';
import { levelTemplate } from '../src/content/sources/_template.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

const REAL_SOURCES = fileURLToPath(new URL('../src/content/sources/', import.meta.url));
const SONG_TINH_TEXT = readFileSync(join(REAL_SOURCES, '1-1.ts'), 'utf8').replace(/\r\n/g, '\n');
const MANIFEST = [
  { id: '1-1', title: 'Song Tinh', order: 1 },
  { id: '3-4', title: 'Ngọn Nến', order: 16 },
];

describe('tên hằng, slug và thứ tự id', () => {
  test('bỏ dấu tiếng Việt, camelCase', () => {
    expect(constNameFromTitle('Thuyền Buồm Hoàng Hôn')).toBe('thuyenBuomHoangHon');
    expect(constNameFromTitle('Đại Ấn Hộ Mệnh')).toBe('daiAnHoMenh');
    expect(constNameFromTitle('Ngọn Nến')).toBe('ngonNen');
    expect(constNameFromTitle('3 Sao')).toBe('level3Sao');
    expect(() => constNameFromTitle('…')).toThrow(/không có chữ cái/);
  });

  test('slug không dấu nối gạch ngang', () => {
    expect(slugFromTitle('Mèo Thần')).toBe('meo-than');
    expect(slugFromTitle('Màn 3-11')).toBe('man-3-11');
  });

  test('so id theo số từng phần: 3-9 < 3-10 < 3-11 < 4-1', () => {
    const ids = ['4-1', '3-11', '3-10', '1-1', '3-9'];
    expect([...ids].sort(compareLevelIds)).toEqual(['1-1', '3-9', '3-10', '3-11', '4-1']);
  });
});

describe('createLevelSourceText', () => {
  const opts = {
    id: '3-11',
    order: 29,
    title: 'Ngọn Nến Thử',
    fromText: SONG_TINH_TEXT,
    fromConstName: 'songTinh',
    slug: 'ngon-nen-thu',
  };

  test('đổi id, order, chương, tiêu đề, revision và tên hằng; giữ mảnh', () => {
    const out = createLevelSourceText(opts);
    expect(out).toContain("  id: '3-11',");
    expect(out).toContain('  order: 29,');
    expect(out).toContain('  chapter: 3,');
    expect(out).toContain("  title: 'Ngọn Nến Thử',");
    expect(out).toContain("  contentRevision: 'ngon-nen-thu-v1',");
    expect(out).toContain('export const ngonNenThu: LevelSource =');
    expect(out).not.toContain('export const songTinh');
    expect(out).toContain("      id: 'D1',");
    expect(out).toContain("  rotationEnabled: false,");
  });

  test('thoát dấu nháy đơn trong tiêu đề', () => {
    const out = createLevelSourceText({ ...opts, title: "Mắt 'Tiên' Tri" });
    expect(out).toContain("  title: 'Mắt \\'Tiên\\' Tri',");
    expect(out).toContain('export const matTienTri: LevelSource =');
  });

  test('giữ kiểu xuống dòng CRLF', () => {
    const out = createLevelSourceText({ ...opts, fromText: SONG_TINH_TEXT.replace(/\n/g, '\r\n') });
    expect(out).toContain("  id: '3-11',\r\n");
    expect(out.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });

  test('từ chối nguồn thiếu trường cấp màn', () => {
    const broken = SONG_TINH_TEXT.replace(/^  contentRevision: .*\n/m, '');
    expect(() => createLevelSourceText({ ...opts, fromText: broken })).toThrow(/đúng một dòng contentRevision/);
  });
});

describe('registerInSourceIndex', () => {
  const INDEX = [
    "import type { LevelSource } from '../authoring.ts';",
    "import { songTinh } from './1-1.ts';",
    "import { saoBatPhuong } from './3-9.ts';",
    "import { banSao } from './3-11.ts';",
    '',
    '/** Mọi màn có nguồn mô tả. */',
    'export const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {',
    "  '1-1': songTinh,",
    "  '3-9': saoBatPhuong,",
    "  '3-11': banSao,",
    '};',
    '',
  ].join('\n');

  test('chèn import và dòng bảng đúng thứ tự id', () => {
    expect(registerInSourceIndex(INDEX, '3-10', 'mandalaThienCau')).toBe(
      [
        "import type { LevelSource } from '../authoring.ts';",
        "import { songTinh } from './1-1.ts';",
        "import { saoBatPhuong } from './3-9.ts';",
        "import { mandalaThienCau } from './3-10.ts';",
        "import { banSao } from './3-11.ts';",
        '',
        '/** Mọi màn có nguồn mô tả. */',
        'export const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {',
        "  '1-1': songTinh,",
        "  '3-9': saoBatPhuong,",
        "  '3-10': mandalaThienCau,",
        "  '3-11': banSao,",
        '};',
        '',
      ].join('\n')
    );
  });

  test('id lớn nhất nối vào cuối; giữ CRLF', () => {
    const out = registerInSourceIndex(INDEX.replace(/\n/g, '\r\n'), '4-1', 'laBanGio');
    expect(out).toContain("import { banSao } from './3-11.ts';\r\nimport { laBanGio } from './4-1.ts';\r\n");
    expect(out).toContain("  '3-11': banSao,\r\n  '4-1': laBanGio,\r\n};");
  });

  test('từ chối id hoặc tên hằng đã đăng ký', () => {
    expect(() => registerInSourceIndex(INDEX, '3-9', 'khac')).toThrow(/Màn 3-9 đã được đăng ký/);
    expect(() => registerInSourceIndex(INDEX, '2-1', 'songTinh')).toThrow(/Tên hằng songTinh/);
  });
});

describe('_template.ts', () => {
  test('là một LevelSource hợp lệ tối thiểu: một vuông 48 giữa bàn, một nghiệm', () => {
    expect(levelTemplate.pieces).toHaveLength(1);
    expect(levelTemplate.pieces[0]).toMatchObject({ shapeKind: 'square', frameSize: 48 });
    expect(levelTemplate.pieces[0].anchors[0]).toEqual({ id: 'A', x: 40, y: 56 });
    const doc = buildLevelDocument(levelTemplate);
    expect(validateLevel(doc).ok).toBe(true);
    expect(searchSolutions(doc).solutionCount).toBe(1);
  });

  test('không được đăng ký trong LEVEL_SOURCES', () => {
    expect(Object.values(LEVEL_SOURCES)).not.toContain(levelTemplate);
    expect(Object.keys(LEVEL_SOURCES)).not.toContain(levelTemplate.id);
  });
});

describe('createNewLevel trên thư mục tạm', () => {
  let root = '';
  let sourcesDir = '';
  let studioDir = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'new-level-'));
    sourcesDir = join(root, 'sources');
    studioDir = join(root, 'studio');
    mkdirSync(sourcesDir);
    mkdirSync(studioDir);
    for (const file of ['1-1.ts', '_template.ts', 'index.ts']) {
      copyFileSync(join(REAL_SOURCES, file), join(sourcesDir, file));
    }
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test('clone đổi id, order, tên hằng, revision và đăng ký vào index.ts', () => {
    const result = createNewLevel({ id: '3-11', from: '1-1', title: 'Ngọn Nến Thử', sourcesDir, studioDir, manifest: MANIFEST });
    expect(result.filePath).toBe(join(sourcesDir, '3-11.ts'));
    expect(result.constName).toBe('ngonNenThu');
    expect(result.nextCommand).toBe('npm run content:author -- 3-11');
    const text = readFileSync(result.filePath, 'utf8');
    expect(text).toContain("  id: '3-11',");
    expect(text).toContain('  order: 17,');
    expect(text).toContain('  chapter: 3,');
    expect(text).toContain("  contentRevision: 'ngon-nen-thu-v1',");
    expect(text).toContain('export const ngonNenThu: LevelSource =');
    const index = readFileSync(join(sourcesDir, 'index.ts'), 'utf8');
    expect(index).toContain("import { ngonNenThu } from './3-11.ts';");
    expect(index).toContain("  '3-11': ngonNenThu,");
  });

  test('không có --from: sao chép _template.ts, lấy tên và order từ manifest', () => {
    const result = createNewLevel({ id: '3-4', sourcesDir, studioDir, manifest: MANIFEST });
    expect(result.constName).toBe('ngonNen');
    const text = readFileSync(result.filePath, 'utf8');
    expect(text).toContain("  title: 'Ngọn Nến',");
    expect(text).toContain('  order: 16,');
    expect(text).toContain("  contentRevision: 'ngon-nen-v1',");
    expect(text).toContain("piece('S1', 'square', 48, [64, 80]");
  });

  test('đăng ký đúng thứ tự trong index.ts', () => {
    createNewLevel({ id: '2-1', title: 'Mũi Tên Chỉ Thiên', sourcesDir, studioDir, manifest: MANIFEST });
    const lines = readFileSync(join(sourcesDir, 'index.ts'), 'utf8').replace(/\r\n/g, '\n').split('\n');
    const importAt = lines.indexOf("import { muiTenChiThien } from './2-1.ts';");
    const entryAt = lines.indexOf("  '2-1': muiTenChiThien,");
    expect(importAt).toBeGreaterThan(0);
    expect(entryAt).toBeGreaterThan(importAt);
    // Mọi import 1-x đứng trước, mọi dòng bảng 1-x đứng trước
    lines.forEach((line, i) => {
      if (/^import \{ \w+ \} from '\.\/1-\d+\.ts';$/.test(line)) expect(i).toBeLessThan(importAt);
      if (/^  '1-\d+': \w+,$/.test(line)) expect(i).toBeLessThan(entryAt);
    });
  });

  test('tìm nguồn trong studio/ khi sources/ không có', () => {
    writeFileSync(join(studioDir, '9-1.ts'), SONG_TINH_TEXT.replace("id: '1-1'", "id: '9-1'"), 'utf8');
    const result = createNewLevel({ id: '3-12', from: '9-1', title: 'Bản Xưởng', sourcesDir, studioDir, manifest: MANIFEST });
    expect(readFileSync(result.filePath, 'utf8')).toContain("  id: '3-12',");
  });

  test('từ chối id đã có nguồn trong sources/ hoặc studio/, không ghi gì', () => {
    const before = readFileSync(join(sourcesDir, 'index.ts'), 'utf8');
    expect(() => createNewLevel({ id: '1-1', sourcesDir, studioDir, manifest: MANIFEST })).toThrow(/Màn 1-1 đã có nguồn/);
    writeFileSync(join(studioDir, '3-20.ts'), '// nháp xưởng\n', 'utf8');
    expect(() => createNewLevel({ id: '3-20', sourcesDir, studioDir, manifest: MANIFEST })).toThrow(/Màn 3-20 đã có nguồn/);
    expect(existsSync(join(sourcesDir, '3-20.ts'))).toBe(false);
    expect(readFileSync(join(sourcesDir, 'index.ts'), 'utf8')).toBe(before);
  });

  test('từ chối nguồn --from không tồn tại và tên hằng trùng', () => {
    expect(() => createNewLevel({ id: '3-12', from: '7-7', sourcesDir, studioDir, manifest: MANIFEST })).toThrow(/Không tìm thấy nguồn của màn 7-7/);
    expect(() => createNewLevel({ id: '3-12', from: '1-1', title: 'Song Tinh', sourcesDir, studioDir, manifest: MANIFEST })).toThrow(/Tên hằng songTinh/);
    expect(existsSync(join(sourcesDir, '3-12.ts'))).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/newLevel.test.ts`
Expected: FAIL — không resolve được `../scripts/new-level.ts`, `../src/content/newLevel.ts`, `../src/content/sources/_template.ts`.

- [ ] **Step 3: Viết `_template.ts`**

Tạo `game-next/src/content/sources/_template.ts`:

```ts
import type { LevelSource } from '../authoring.ts';
import { piece } from '../kit.ts';

/**
 * File mẫu cho `npm run content:new -- <id>` khi không có `--from`.
 * KHÔNG đăng ký trong LEVEL_SOURCES. Lệnh tạo màn tự đổi id, title, chapter,
 * order, contentRevision và tên hằng; các trường còn lại sửa tay rồi chạy
 * `npm run content:author -- <id>` để sinh JSON, SVG và báo cáo nghiệm.
 * Hướng dẫn đầy đủ: docs/content/level-kit.md.
 */
export const levelTemplate: LevelSource = {
  // Mã màn "<chương>-<số thứ tự>", trùng tên file nguồn. Ví dụ: '3-11'.
  id: 'mau-1',
  // Tên hiển thị tiếng Việt có dấu, 2–5 chữ; sinh ra tên hằng và slug. Ví dụ: 'Ngọn Nến'.
  title: 'Màn Mẫu',
  // Chương 1–4: 1 ghép cạnh không chồng, 2 chồng lớp chẵn lẻ, 3 Họa Phẩm, 4 xoay. Ví dụ: 3.
  chapter: 1,
  // Thứ tự trong campaign, 1–28 với màn có trong manifest. Ví dụ: 16 cho 3-4.
  order: 99,
  // Phiên bản nội dung "<slug không dấu>-v<n>"; tăng n mỗi lần sửa sau duyệt. Ví dụ: 'ngon-nen-v1'.
  contentRevision: 'man-mau-v1',
  // Chỉ chương 4 được true; chương 1–3 bật xoay thì validator báo chapter-rotation-disabled.
  rotationEnabled: false,
  // Danh sách mảnh, dựng bằng hàm ghép hình của src/content/kit.ts:
  //   piece(id, hình, khung, [tâm x, tâm y], { orientation, decoys })
  //   hình: 'square' | 'triangle' | 'diamond' | 'circle' | 'parallelogram'
  //   khung: theo bảng hình (vuông bội 8, thoi/tròn/mái bội 16, bình hành bội 48; tối đa 128)
  //   tâm: gốc khung = tâm − khung/2 phải là bội của 8. Tâm bàn là [64, 80].
  //   decoys: độ lệch neo nhiễu so với neo A, ví dụ NUDGE, CROSS hoặc [[8, 0]].
  // Ví dụ: piece('C1', 'circle', 32, [64, 80], { decoys: NUDGE }).
  pieces: [piece('S1', 'square', 48, [64, 80], { decoys: [[8, 0]] })],
  // Nghiệm mẫu: mỗi mảnh một bước, anchorId 'A'; turns 1–3 chỉ dùng ở chương 4.
  // Ví dụ: [[{ pieceId: 'C1', anchorId: 'A', turns: 0 }]].
  sampleSolutions: [[{ pieceId: 'S1', anchorId: 'A', turns: 0 }]],
  // Một câu nói màn dạy gì. Ví dụ: 'Làm quen hình tròn và vùng giao cong'.
  learningObjective: 'Đặt một mảnh đúng vào bóng mục tiêu',
  // Độ khó ước lượng 1–5. Ví dụ: 3.
  difficultyEstimate: 1,
  // Tư thế gây nhiễu có chủ đích { pieceId, anchorId, reason }; neo bị luật KIT-03 bỏ thì dòng đó cũng bị bỏ.
  // Ví dụ: { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' }.
  distractors: [{ pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' }],
  // Bước hướng dẫn: trigger 'idle' | 'first-snap' | 'two-layers' | 'three-layers',
  // end 'drag-start' | 'snap' | 'two-layers' | 'three-layers'. Để [] nếu không cần.
  // Ví dụ: [{ id: 'drag-first', trigger: 'idle', end: 'drag-start', text: 'Kéo mảnh vào bóng mục tiêu' }].
  ftueSteps: [],
  // Câu thơ ở màn hoàn thành; không bắt buộc, xoá dòng này để ẩn.
  victoryVerse: 'Một mảnh về đúng chỗ, bầu trời thêm một vì sao.',
};
```

- [ ] **Step 4: Viết `newLevel.ts`**

Tạo `game-next/src/content/newLevel.ts`:

```ts
/**
 * Phần thuần của lệnh `npm run content:new`: đặt tên, sửa trường cấp màn và
 * đăng ký vào `sources/index.ts`. Đọc/ghi file nằm ở `scripts/new-level.ts`.
 */

/** Bỏ dấu tiếng Việt: "Ngọn Nến" → "Ngon Nen". */
export function stripVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function titleWords(title: string): string[] {
  return stripVietnamese(title)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Tên hằng xuất của nguồn: "Thuyền Buồm Hoàng Hôn" → "thuyenBuomHoangHon". */
export function constNameFromTitle(title: string): string {
  const words = titleWords(title);
  if (words.length === 0) {
    throw new Error(`Tên màn "${title}" không có chữ cái hay chữ số nào để đặt tên hằng`);
  }
  const name = words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join('');
  // Tên biến không được bắt đầu bằng chữ số
  return /^[0-9]/.test(name) ? `level${name[0].toUpperCase()}${name.slice(1)}` : name;
}

/** Slug không dấu cho contentRevision: "Mèo Thần" → "meo-than". */
export function slugFromTitle(title: string): string {
  return titleWords(title).join('-');
}

/** So id màn theo số từng phần: "3-9" < "3-10" < "4-1". */
export function compareLevelIds(a: string, b: string): number {
  const pa = a.split('-');
  const pb = b.split('-');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? '';
    const y = pb[i] ?? '';
    if (x === y) continue;
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) return Number(x) - Number(y);
    return x < y ? -1 : 1;
  }
  return 0;
}

function quote(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function replaceOnce(text: string, pattern: RegExp, replacement: string, field: string): string {
  const count = text.match(new RegExp(pattern.source, 'gm'))?.length ?? 0;
  if (count !== 1) {
    throw new Error(`Nguồn gốc phải có đúng một dòng ${field} ở cấp màn, tìm thấy ${count}`);
  }
  return text.replace(pattern, () => replacement);
}

export type CreateLevelSourceOptions = {
  id: string;
  order: number;
  title: string;
  fromText: string;
  fromConstName: string;
  slug: string;
};

/**
 * Viết lại nguồn gốc thành nguồn của màn mới: đổi id, title, order,
 * contentRevision (`<slug>-v1`), chapter (theo tiền tố 1–4 của id) và tên hằng
 * xuất. Chỉ sửa trường cấp màn (thụt 2 dấu cách); mảnh giữ nguyên.
 */
export function createLevelSourceText(opts: CreateLevelSourceOptions): string {
  const eol = opts.fromText.includes('\r\n') ? '\r\n' : '\n';
  let text = opts.fromText.replace(/\r\n/g, '\n');
  text = replaceOnce(text, /^  id: '[^']*',$/m, `  id: ${quote(opts.id)},`, 'id');
  text = replaceOnce(text, /^  title: '(?:[^'\\]|\\.)*',$/m, `  title: ${quote(opts.title)},`, 'title');
  text = replaceOnce(text, /^  order: \d+,$/m, `  order: ${opts.order},`, 'order');
  text = replaceOnce(
    text,
    /^  contentRevision: '[^']*',$/m,
    `  contentRevision: ${quote(`${opts.slug}-v1`)},`,
    'contentRevision'
  );
  const chapter = /^([1-4])-/.exec(opts.id);
  if (chapter) {
    text = replaceOnce(text, /^  chapter: \d+,$/m, `  chapter: ${chapter[1]},`, 'chapter');
  }
  const constName = constNameFromTitle(opts.title);
  text = replaceOnce(
    text,
    new RegExp(`^export const ${opts.fromConstName}: LevelSource =`, 'm'),
    `export const ${constName}: LevelSource =`,
    `export const ${opts.fromConstName}`
  );
  return text.replace(/\n/g, eol);
}

const IMPORT_LINE = /^import \{ (\w+) \} from '\.\/([^']+)\.ts';$/;
const ENTRY_LINE = /^  '([^']+)': (\w+),$/;

type IndexRow = { line: number; id: string; name: string };

/** Thêm một dòng import và một dòng trong bảng LEVEL_SOURCES, giữ thứ tự theo id. */
export function registerInSourceIndex(indexText: string, id: string, constName: string): string {
  const eol = indexText.includes('\r\n') ? '\r\n' : '\n';
  const lines = indexText.replace(/\r\n/g, '\n').split('\n');
  const imports: IndexRow[] = [];
  const entries: IndexRow[] = [];
  lines.forEach((text, line) => {
    const im = IMPORT_LINE.exec(text);
    if (im) imports.push({ line, id: im[2], name: im[1] });
    const en = ENTRY_LINE.exec(text);
    if (en) entries.push({ line, id: en[1], name: en[2] });
  });
  if (imports.length === 0 || entries.length === 0) {
    throw new Error('sources/index.ts không đúng dạng: cần ít nhất một dòng import nguồn và một dòng trong LEVEL_SOURCES');
  }
  if (imports.some((r) => r.id === id) || entries.some((r) => r.id === id)) {
    throw new Error(`Màn ${id} đã được đăng ký trong sources/index.ts`);
  }
  if (imports.some((r) => r.name === constName)) {
    throw new Error(`Tên hằng ${constName} đã dùng trong sources/index.ts; đặt --title khác`);
  }
  // Chèn dòng bảng trước (nằm sau các import) để chỉ số dòng import không đổi
  const entryAt = entries.find((r) => compareLevelIds(id, r.id) < 0)?.line ?? entries[entries.length - 1].line + 1;
  lines.splice(entryAt, 0, `  '${id}': ${constName},`);
  const importAt = imports.find((r) => compareLevelIds(id, r.id) < 0)?.line ?? imports[imports.length - 1].line + 1;
  lines.splice(importAt, 0, `import { ${constName} } from './${id}.ts';`);
  return lines.join(eol);
}
```

- [ ] **Step 5: Viết CLI `scripts/new-level.ts`**

Tạo `game-next/scripts/new-level.ts`:

```ts
/**
 * Tạo nguồn màn mới bằng cách clone một màn có sẵn hoặc file mẫu.
 *
 *   npm run content:new -- 3-11 --from 3-4
 *   npm run content:new -- 3-11 --title "Ngọn Nến Thử"
 *
 * Ghi src/content/sources/<id>.ts và đăng ký vào sources/index.ts. Không sửa
 * manifest.ts hay catalog.ts: đưa màn vào campaign vẫn qua validated → approved.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ManifestEntry } from '../src/content/document.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import {
  constNameFromTitle,
  createLevelSourceText,
  registerInSourceIndex,
  slugFromTitle,
} from '../src/content/newLevel.ts';

export const TEMPLATE_FILE = '_template.ts';

export type NewLevelOptions = {
  id: string;
  from?: string;
  title?: string;
  sourcesDir: string;
  studioDir: string;
  manifest: ReadonlyArray<Pick<ManifestEntry, 'id' | 'title' | 'order'>>;
};

export type NewLevelResult = { filePath: string; constName: string; nextCommand: string };

export function createNewLevel(opts: NewLevelOptions): NewLevelResult {
  const { id, sourcesDir, studioDir } = opts;
  if (!/^[0-9a-z]+(?:-[0-9a-z]+)*$/.test(id)) {
    throw new Error(`Mã màn "${id}" không hợp lệ: chỉ dùng chữ thường, số và gạch ngang, ví dụ 3-11`);
  }
  for (const dir of [sourcesDir, studioDir]) {
    const existing = join(dir, `${id}.ts`);
    if (existsSync(existing)) {
      throw new Error(`Màn ${id} đã có nguồn tại ${existing}`);
    }
  }

  let fromPath = join(sourcesDir, TEMPLATE_FILE);
  if (opts.from !== undefined) {
    const candidates = [join(sourcesDir, `${opts.from}.ts`), join(studioDir, `${opts.from}.ts`)];
    const found = candidates.find((p) => existsSync(p));
    if (!found) {
      throw new Error(`Không tìm thấy nguồn của màn ${opts.from} trong sources/ hoặc studio/`);
    }
    fromPath = found;
  }
  const fromText = readFileSync(fromPath, 'utf8');
  const constMatch = /^export const (\w+): LevelSource =/m.exec(fromText);
  if (!constMatch) {
    throw new Error(`Không tìm thấy dòng "export const <tên>: LevelSource =" trong ${fromPath}`);
  }

  const entry = opts.manifest.find((e) => e.id === id);
  const title = opts.title ?? entry?.title ?? `Màn ${id}`;
  const order = entry?.order ?? Math.max(0, ...opts.manifest.map((e) => e.order)) + 1;
  const constName = constNameFromTitle(title);

  // Tính hết trước khi ghi: lỗi ở bước nào cũng không để lại file dở
  const indexPath = join(sourcesDir, 'index.ts');
  const indexText = registerInSourceIndex(readFileSync(indexPath, 'utf8'), id, constName);
  const sourceText = createLevelSourceText({
    id,
    order,
    title,
    fromText,
    fromConstName: constMatch[1],
    slug: slugFromTitle(title),
  });

  const filePath = join(sourcesDir, `${id}.ts`);
  writeFileSync(filePath, sourceText, 'utf8');
  writeFileSync(indexPath, indexText, 'utf8');
  return { filePath, constName, nextCommand: `npm run content:author -- ${id}` };
}

function parseArgs(argv: readonly string[]): { id?: string; from?: string; title?: string } {
  const parsed: { id?: string; from?: string; title?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from' || arg === '--title') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`Thiếu giá trị sau ${arg}`);
      if (arg === '--from') parsed.from = value;
      else parsed.title = value;
      i++;
    } else if (arg.startsWith('--')) {
      throw new Error(`Tham số không hỗ trợ: ${arg}`);
    } else if (parsed.id === undefined) {
      parsed.id = arg;
    } else {
      throw new Error(`Chỉ nhận một mã màn, thừa: ${arg}`);
    }
  }
  return parsed;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolve(entry).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isMainModule()) {
  const HERE = dirname(fileURLToPath(import.meta.url));
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.id) {
      console.error('Dùng: npm run content:new -- <id> [--from <id-nguồn>] [--title "<tên>"]');
      process.exit(1);
    }
    const result = createNewLevel({
      id: args.id,
      from: args.from,
      title: args.title,
      sourcesDir: resolve(HERE, '../src/content/sources'),
      studioDir: resolve(HERE, '../src/content/studio'),
      manifest: campaignManifest,
    });
    console.log(
      `[new-level] Đã tạo ${relative(process.cwd(), result.filePath)} (hằng ${result.constName}) và đăng ký vào src/content/sources/index.ts`
    );
    console.log(`[new-level] Bước tiếp theo: ${result.nextCommand}`);
  } catch (err) {
    console.error(`[new-level] FAIL ${(err as Error).message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 6: Script npm và README**

(a) Trong `game-next/package.json`, thêm vào `scripts` ngay sau dòng `"content:author": ...,`:

```json
    "content:new": "node --experimental-strip-types scripts/new-level.ts",
```

(b) Trong `game-next/README.md`, thêm ngay sau dòng `- \`npm run content:author -- <id...> | --all\`: ...`:

```markdown
- `npm run content:new -- <id> [--from <id-nguồn>] [--title "<tên>"]`: Tạo nguồn `src/content/sources/<id>.ts` bằng cách clone màn có sẵn (hoặc `_template.ts`) và đăng ký vào `sources/index.ts`; xem `docs/content/level-kit.md`
```

- [ ] **Step 7: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/newLevel.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 8: Thử lệnh thật rồi hoàn tác**

Run: `npm run content:new -- 1-1`
Expected: exit 1, in `[new-level] FAIL Màn 1-1 đã có nguồn tại …`.

Run: `npm run content:new -- 9-1 --title "Thử Lệnh"` rồi `npm run content:author -- 9-1`
Expected: lệnh đầu in đường dẫn `src/content/sources/9-1.ts` (hằng `thuLenh`) và `Bước tiếp theo: npm run content:author -- 9-1`; lệnh sau in `PASS 9-1`.
Hoàn tác: `rm src/content/sources/9-1.ts src/content/levels/9-1.json ../docs/testing/levels/9-1.svg ../docs/testing/levels/9-1-report.md && git checkout -- src/content/sources/index.ts`; `git status --short src/content ../docs/testing/levels` chỉ còn các file của task này.

- [ ] **Step 9: Toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh.

- [ ] **Step 10: CHANGELOG và commit**

```markdown
### 2026-10-02 - Add level template and content:new clone command

- Added `src/content/sources/_template.ts`, a minimal valid source (one 48 square at the board center) with a Vietnamese comment per field; it is not registered in `LEVEL_SOURCES`.
- Added `src/content/newLevel.ts` (const name and slug from Vietnamese titles, field rewrite, sorted registration in `sources/index.ts`) and `scripts/new-level.ts` behind `npm run content:new -- <id> [--from <id>] [--title "<name>"]`; existing ids in `sources/` or `studio/` are refused.
- Added `tests/newLevel.test.ts`, which runs the command logic on temporary directories.
- Verification: the new tests failed before the modules existed and pass after; a trial `content:new` + `content:author` on a throwaway id passed and was reverted; `npm run typecheck`, `npm test` and `npm run content:validate` pass.
```

Message:

```text
feat(content): add level template and content:new clone command

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/content/sources/_template.ts src/content/newLevel.ts scripts/new-level.ts package.json README.md tests/newLevel.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 4: Bốn chương, manifest 28 màn, luật xoay chương 4 và cổng release

**Files:**
- Modify: `game-next/src/domain/model.ts` (kiểu `Chapter`, `Level.chapter`)
- Modify: `game-next/src/content/document.ts` (`ManifestEntry.chapter`, `LevelDocument.chapter`)
- Create: `game-next/src/content/chapters.ts`
- Modify: `game-next/src/content/validate.ts` (chương, luật xoay)
- Modify: `game-next/src/content/manifest.ts` (28 màn)
- Modify: `game-next/scripts/validate-content.ts` (cổng release)
- Modify: `game-next/src/presentation/Hud.ts` (số La Mã, nút Xoay)
- Test (sửa vì manifest 28 màn / đổi mã 3-x): `tests/content.test.ts`, `tests/catalog.test.ts`, `tests/menu.test.ts`, `tests/progress.test.ts`, `tests/hud.test.ts`, `tests/levelSelect.test.ts` (chỉ ba test `formatProgress`), `tests/session.test.ts` (một literal)

**Interfaces:**
- Consumes: `makeAdjacentFixture`, `validateLevel`, `loadLevel`, `nextLevelId`.
- Produces:
  - `type Chapter = 1 | 2 | 3 | 4` (`model.ts`), dùng ở `ManifestEntry`, `LevelDocument`, `Level`.
  - `src/content/chapters.ts`: `ChapterInfo`, `CHAPTERS`, `RELEASE_LEVEL_COUNT = 28`, `chapterInfo(n)`, `chapterOfLevelId(id)`, `chapterLabel(n)`, `releaseGate(manifest)`.
  - Mã lỗi validator: `invalid-chapter` (ngoài 1–4), `chapter-rotation-disabled` (chương 1–3 bật xoay), `chapter-rotation-required` (chương 4 tắt xoay), `solution-rotation-disallowed` (turns ≠ 0 ở chương 1–3).

**Test cũ phải sửa (assertion mới chính xác):**

| File | Test cũ | Sửa thành |
|---|---|---|
| `tests/content.test.ts` | `campaignManifest chứa đủ 18 màn` (`toBe(18)`) | thay bằng test `manifest 28 màn…` ở Step 1(a) — giữ hằng `AUTHORED_LEVELS` hiện có |
| `tests/menu.test.ts` | `18 màn được phân bố đều vào 3 chương` (`ch3[5].id` = `'3-6'`) | test `28 màn chia vào 4 chương 6/6/10/6` ở Step 1(c) |
| `tests/progress.test.ts` | `expect(nextLevelId(campaignManifest, '3-6')).toBeNull();` | `expect(nextLevelId(campaignManifest, '3-6')).toBe('3-7');` `expect(nextLevelId(campaignManifest, '3-10')).toBe('4-1');` `expect(nextLevelId(campaignManifest, '4-6')).toBeNull();` |
| `tests/hud.test.ts` | `quy tắc nút Xoay chỉ hiển thị từ Chương 3` (`'3-1'` → true) | test `nút Xoay chỉ hiển thị ở Chương 4` ở Step 1(e) |
| `tests/levelSelect.test.ts` | `formatProgress(0, 18)` … `'18/18'` | `formatProgress(0, 28)` → `'0/28'`, `(1, 28)` → `'1/28'`, `(28, 28)` → `'28/28'`; `not.toContain('✦')` dùng `(1, 28)` |
| `tests/session.test.ts` | literal `Level` id `'rotate-ch3'` có `chapter: 3, rotationEnabled: true` | `chapter: 4` (chương xoay mới; kiểu vẫn hợp lệ nếu để 3, đổi cho đúng nghĩa) |

`tests/levelSelect.test.ts` test `18 màn được gán đúng tọa độ…` được thay ở Task 5, không sửa ở task này.

- [ ] **Step 1: Viết test thất bại**

(a) `game-next/tests/content.test.ts`: thêm import

```ts
import { CHAPTERS, RELEASE_LEVEL_COUNT, chapterInfo, chapterLabel, chapterOfLevelId, releaseGate } from '../src/content/chapters.ts';
```

thay **toàn bộ** test `campaignManifest chứa đủ 18 màn` bằng:

```ts
  test('manifest 28 màn, order 1..28, chương 6/6/10/6; màn chưa có dữ liệu là planned', () => {
    expect(campaignManifest).toHaveLength(28);
    expect(campaignManifest.map((e) => e.order)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
    const ids = (chapter: number) => campaignManifest.filter((e) => e.chapter === chapter).map((e) => e.id);
    expect(ids(1)).toEqual(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6']);
    expect(ids(2)).toEqual(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6']);
    expect(ids(3)).toEqual(['3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10']);
    expect(ids(4)).toEqual(['4-1', '4-2', '4-3', '4-4', '4-5', '4-6']);
    expect(campaignManifest[0].id).toBe('1-1');
    expect(campaignManifest[0].status).toBe('approved');
    for (const entry of campaignManifest.slice(1)) {
      if (AUTHORED_LEVELS.has(entry.id)) {
        expect(['validated', 'approved']).toContain(entry.status);
      } else {
        expect(entry.status).toBe('planned');
      }
    }
  });

  test('tên màn chương 2–4 theo spec B (CH-02)', () => {
    const titles = (chapter: number) => campaignManifest.filter((e) => e.chapter === chapter).map((e) => e.title);
    expect(titles(2)).toEqual([
      'Mũi Tên Chỉ Thiên', 'Cánh Bướm Điệp Ảnh', 'Trái Tim Tinh Thể', 'Mắt Tiên Tri', 'Đồng Hồ Cát', 'Đại Ấn Hộ Mệnh',
    ]);
    expect(titles(3)).toEqual([
      'Nhật Nguyệt Song Huyền', 'Đền Tiên Tri', 'Cá Chép Sao', 'Ngọn Nến', 'Thuyền Buồm Hoàng Hôn',
      'Mèo Thần', 'Hoa Sen', 'Kim Tự Tháp Nhật Thực', 'Sao Bát Phương', 'Mandala Thiên Cầu',
    ]);
    expect(campaignManifest.filter((e) => e.chapter === 4).map((e) => [e.id, e.title, e.order])).toEqual([
      ['4-1', 'La Bàn Gió', 23],
      ['4-2', 'Lưỡi Kiếm Thiên Thể', 24],
      ['4-3', 'Cánh Cung Chiêm Tinh', 25],
      ['4-4', 'Bánh Xe Số Phận', 26],
      ['4-5', 'Thánh Giá Thiên Cầu', 27],
      ['4-6', 'Đại Ấn Tiên Tri', 28],
    ]);
  });
```

và thêm vào **cuối** file:

```ts
describe('Bốn chương và luật xoay (CH-01, CH-04)', () => {
  const codes = (r: ReturnType<typeof validateLevel>) => (r.ok ? [] : r.issues.map((i) => i.code));

  test('bảng chương: tên, số La Mã, chỉ chương 4 xoay', () => {
    expect(CHAPTERS.map((c) => [c.chapter, c.roman, c.name, c.rotationEnabled])).toEqual([
      [1, 'I', 'Khởi Nguyên', false],
      [2, 'II', 'Giao Thoa', false],
      [3, 'III', 'Họa Phẩm', false],
      [4, 'IV', 'Luân Chuyển', true],
    ]);
    expect(chapterInfo(5)).toBeUndefined();
    expect(chapterOfLevelId('3-10')).toBe(3);
    expect(chapterOfLevelId('4-1')).toBe(4);
    expect(chapterOfLevelId('dev-shapes-v2')).toBeUndefined();
    expect(chapterLabel(3)).toBe('Chương III · Họa Phẩm');
  });

  test('chương 4 bật xoay thì hợp lệ', () => {
    const doc = makeAdjacentFixture();
    doc.chapter = 4;
    doc.rotationEnabled = true;
    const result = validateLevel(doc);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.level.chapter).toBe(4);
  });

  test('chương 1–3 bật xoay báo chapter-rotation-disabled', () => {
    for (const chapter of [1, 2, 3] as const) {
      const doc = makeAdjacentFixture();
      doc.chapter = chapter;
      doc.rotationEnabled = true;
      expect(codes(validateLevel(doc))).toContain('chapter-rotation-disabled');
    }
  });

  test('chương 4 tắt xoay báo chapter-rotation-required', () => {
    const doc = makeAdjacentFixture();
    doc.chapter = 4;
    doc.rotationEnabled = false;
    expect(codes(validateLevel(doc))).toContain('chapter-rotation-required');
  });

  test('chương ngoài 1–4 báo invalid-chapter; turns ≠ 0 ở chương 2–3 bị cấm', () => {
    const bad = makeAdjacentFixture() as unknown as { chapter: number };
    bad.chapter = 5;
    expect(codes(validateLevel(bad))).toContain('invalid-chapter');
    const turned = makeAdjacentFixture();
    turned.chapter = 3;
    turned.sampleSolutions[0][0].turns = 1;
    expect(codes(validateLevel(turned))).toContain('solution-rotation-disallowed');
  });

  test('cổng release cần đủ 28 màn approved', () => {
    expect(RELEASE_LEVEL_COUNT).toBe(28);
    expect(campaignManifest).toHaveLength(RELEASE_LEVEL_COUNT);
    const gate = releaseGate(campaignManifest);
    expect(gate.required).toBe(28);
    expect(gate.ok).toBe(false);
    const allApproved = campaignManifest.map((e) => ({ ...e, status: 'approved' as const }));
    expect(releaseGate(allApproved)).toEqual({ ok: true, approved: 28, required: 28 });
    expect(releaseGate(allApproved.slice(0, 18)).ok).toBe(false);
  });
});
```

(b) `game-next/tests/catalog.test.ts`: thêm vào **cuối** file:

```ts
describe('Manifest 28 màn trong catalog (CH-02)', () => {
  test('màn planned ở mọi chương không nạp được ở cả hai chế độ', () => {
    for (const e of campaignManifest.filter((m) => m.status === 'planned')) {
      expect(() => loadLevel(e.id, 'harness')).toThrow(`unavailable:${e.id}`);
      expect(() => loadLevel(e.id, 'campaign')).toThrow(`unavailable:${e.id}`);
    }
  });

  test('mã 3-x giờ là Họa Phẩm; chương xoay đổi sang 4-1 → 4-6, giữ tên', () => {
    expect(campaignManifest.find((e) => e.id === '3-1')).toMatchObject({ title: 'Nhật Nguyệt Song Huyền', chapter: 3, order: 13 });
    expect(campaignManifest.find((e) => e.id === '3-10')).toMatchObject({ title: 'Mandala Thiên Cầu', chapter: 3, order: 22 });
    expect(campaignManifest.find((e) => e.id === '4-1')).toMatchObject({ title: 'La Bàn Gió', chapter: 4, order: 23 });
    expect(() => loadLevel('4-1', 'harness')).toThrow('unavailable:4-1');
  });
});
```

(c) `game-next/tests/menu.test.ts`: thay test `18 màn được phân bố đều vào 3 chương (mỗi chương 6 màn)` bằng:

```ts
  test('28 màn chia vào 4 chương 6/6/10/6', () => {
    const chapter = (c: number) => campaignManifest.filter((m) => m.chapter === c);
    expect([1, 2, 3, 4].map((c) => chapter(c).length)).toEqual([6, 6, 10, 6]);
    expect(chapter(1)[0].id).toBe('1-1');
    expect(chapter(3)[9].id).toBe('3-10');
    expect(chapter(4)[5].id).toBe('4-6');
  });
```

(d) `game-next/tests/progress.test.ts`: thay dòng `expect(nextLevelId(campaignManifest, '3-6')).toBeNull();` bằng:

```ts
    expect(nextLevelId(campaignManifest, '3-6')).toBe('3-7');
    expect(nextLevelId(campaignManifest, '3-10')).toBe('4-1');
    expect(nextLevelId(campaignManifest, '4-6')).toBeNull();
```

(e) `game-next/tests/hud.test.ts`: thêm import `import { chapterInfo, chapterOfLevelId } from '../src/content/chapters.ts';` và thay test `quy tắc nút Xoay chỉ hiển thị từ Chương 3` bằng:

```ts
  test('nút Xoay chỉ hiển thị ở Chương 4 (Luân Chuyển)', () => {
    const rotates = (levelId: string) => chapterInfo(chapterOfLevelId(levelId) ?? 1)?.rotationEnabled;
    expect(rotates('1-1')).toBe(false);
    expect(rotates('2-3')).toBe(false);
    expect(rotates('3-1')).toBe(false);
    expect(rotates('3-10')).toBe(false);
    expect(rotates('4-1')).toBe(true);
    expect(rotates('4-6')).toBe(true);
    expect(rotates('dev-shapes-v2')).toBe(false);
  });
```

(f) `game-next/tests/levelSelect.test.ts`: trong `describe('Màn chọn màn theo mockup improve-v1', …)` thay ba dòng `formatProgress(...18)` bằng:

```ts
    expect(formatProgress(0, 28)).toBe('0/28');
    expect(formatProgress(1, 28)).toBe('1/28');
    expect(formatProgress(28, 28)).toBe('28/28');
```

và `expect(formatProgress(1, 18)).not.toContain('✦');` thành `expect(formatProgress(1, 28)).not.toContain('✦');`.

(g) `game-next/tests/session.test.ts`: trong literal `Level` có `id: 'rotate-ch3'`, đổi `chapter: 3,` thành `chapter: 4,`.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/content.test.ts tests/catalog.test.ts tests/menu.test.ts tests/progress.test.ts tests/hud.test.ts`
Expected: FAIL — không resolve được `../src/content/chapters.ts`; sau khi có module thì đỏ ở độ dài manifest (18 ≠ 28) và luật xoay.

- [ ] **Step 3: Kiểu `Chapter`**

(a) `game-next/src/domain/model.ts`: thêm ngay trên `export type Level = Readonly<{`:

```ts
/** Bốn chương campaign: 1 Khởi Nguyên, 2 Giao Thoa, 3 Họa Phẩm, 4 Luân Chuyển (xoay). */
export type Chapter = 1 | 2 | 3 | 4;
```

và trong `Level` đổi `chapter: 1 | 2 | 3;` thành `chapter: Chapter;`.

(b) `game-next/src/content/document.ts`: đổi import đầu file thành `import type { Cell, Chapter, Level, Orientation, ShapeKind, Turns } from '../domain/model.ts';` (giữ mọi tên đang có, thêm `Chapter`), rồi đổi **cả hai** dòng `chapter: 1 | 2 | 3;` (trong `ManifestEntry` và `LevelDocument`) thành `chapter: Chapter;`.

- [ ] **Step 4: Viết `chapters.ts`**

Tạo `game-next/src/content/chapters.ts`:

```ts
import type { Chapter } from '../domain/model.ts';
import type { ManifestEntry } from './document.ts';

export type ChapterInfo = Readonly<{
  chapter: Chapter;
  roman: string;
  name: string;
  /** Chỉ chương xoay được bật `rotationEnabled` (CH-01) */
  rotationEnabled: boolean;
}>;

/** Bốn chương của campaign (spec B mục 5). */
export const CHAPTERS: readonly ChapterInfo[] = [
  { chapter: 1, roman: 'I', name: 'Khởi Nguyên', rotationEnabled: false },
  { chapter: 2, roman: 'II', name: 'Giao Thoa', rotationEnabled: false },
  { chapter: 3, roman: 'III', name: 'Họa Phẩm', rotationEnabled: false },
  { chapter: 4, roman: 'IV', name: 'Luân Chuyển', rotationEnabled: true },
];

/** Bản phát hành cần đủ ngần này màn approved (CH-04). */
export const RELEASE_LEVEL_COUNT = 28;

export function chapterInfo(chapter: number): ChapterInfo | undefined {
  return CHAPTERS.find((c) => c.chapter === chapter);
}

/** Chương suy từ mã màn "<chương>-<số>"; mã khác (màn dev) trả undefined. */
export function chapterOfLevelId(levelId: string): Chapter | undefined {
  const match = /^(\d+)-/.exec(levelId);
  return match ? chapterInfo(Number(match[1]))?.chapter : undefined;
}

/** Tiêu đề chòm sao: "Chương III · Họa Phẩm". */
export function chapterLabel(chapter: number): string {
  const info = chapterInfo(chapter);
  return info ? `Chương ${info.roman} · ${info.name}` : `Chương ${chapter}`;
}

export function releaseGate(manifest: readonly ManifestEntry[]): { ok: boolean; approved: number; required: number } {
  const approved = manifest.filter((e) => e.status === 'approved').length;
  return {
    ok: manifest.length === RELEASE_LEVEL_COUNT && approved === RELEASE_LEVEL_COUNT,
    approved,
    required: RELEASE_LEVEL_COUNT,
  };
}
```

- [ ] **Step 5: Validator**

Trong `game-next/src/content/validate.ts`:

(a) Thêm `Chapter` vào câu `import type { … } from '../domain/model.ts';` đầu file, và thêm dưới các import:

```ts
import { chapterInfo } from './chapters.ts';
```

(b) Thay khối

```ts
  if (![1, 2, 3].includes(doc.chapter as number)) {
    issues.push({ levelId, field: 'chapter', code: 'invalid-chapter' });
  }
```

bằng:

```ts
  const chapterRule = chapterInfo(doc.chapter as number);
  if (!chapterRule) {
    issues.push({ levelId, field: 'chapter', code: 'invalid-chapter' });
  }
```

(c) Thay khối

```ts
  // Chapter 1 & 2: rotation must not be enabled
  if ((doc.chapter === 1 || doc.chapter === 2) && doc.rotationEnabled) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-disabled' });
  }
```

bằng:

```ts
  // Xoay chỉ mở ở chương xoay (Chương 4 — Luân Chuyển): chương 1–3 cấm bật, chương 4 bắt buộc bật
  if (chapterRule && !chapterRule.rotationEnabled && doc.rotationEnabled === true) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-disabled' });
  }
  if (chapterRule && chapterRule.rotationEnabled && doc.rotationEnabled === false) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-required' });
  }
```

(d) Thay `if (doc.chapter === 1 && step.turns !== 0) {` bằng `if (chapterRule && !chapterRule.rotationEnabled && step.turns !== 0) {`.

(e) Đổi **cả hai** chỗ `as 1 | 2 | 3` (trong `dummyLevel` và trong `level` trả về) thành `as Chapter`.

- [ ] **Step 6: Manifest 28 màn**

Trong `game-next/src/content/manifest.ts`: **giữ nguyên sáu dòng 1-1 → 1-6 hiện có** (trạng thái, `contentRevision`, `dataPath` do Chương 1 giai đoạn 3 đặt). Thay toàn bộ phần từ comment `// Chương 2 — Giao thoa` đến hết mảng bằng:

```ts
  // Chương 2 — Giao Thoa (vùng giao triệt tiêu và hạt nhân hiện lại)
  { id: '2-1', title: 'Mũi Tên Chỉ Thiên', chapter: 2, order: 7, contentRevision: 'v0.1', status: 'planned' },
  { id: '2-2', title: 'Cánh Bướm Điệp Ảnh', chapter: 2, order: 8, contentRevision: 'v0.1', status: 'planned' },
  { id: '2-3', title: 'Trái Tim Tinh Thể', chapter: 2, order: 9, contentRevision: 'v0.1', status: 'planned' },
  { id: '2-4', title: 'Mắt Tiên Tri', chapter: 2, order: 10, contentRevision: 'v0.1', status: 'planned' },
  { id: '2-5', title: 'Đồng Hồ Cát', chapter: 2, order: 11, contentRevision: 'v0.1', status: 'planned' },
  { id: '2-6', title: 'Đại Ấn Hộ Mệnh', chapter: 2, order: 12, contentRevision: 'v0.1', status: 'planned' },

  // Chương 3 — Họa Phẩm (tranh ghép nghệ thuật, không xoay)
  { id: '3-1', title: 'Nhật Nguyệt Song Huyền', chapter: 3, order: 13, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-2', title: 'Đền Tiên Tri', chapter: 3, order: 14, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-3', title: 'Cá Chép Sao', chapter: 3, order: 15, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-4', title: 'Ngọn Nến', chapter: 3, order: 16, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-5', title: 'Thuyền Buồm Hoàng Hôn', chapter: 3, order: 17, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-6', title: 'Mèo Thần', chapter: 3, order: 18, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-7', title: 'Hoa Sen', chapter: 3, order: 19, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-8', title: 'Kim Tự Tháp Nhật Thực', chapter: 3, order: 20, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-9', title: 'Sao Bát Phương', chapter: 3, order: 21, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-10', title: 'Mandala Thiên Cầu', chapter: 3, order: 22, contentRevision: 'v0.1', status: 'planned' },

  // Chương 4 — Luân Chuyển (xoay chuyển định hướng; đổi mã từ 3-1 → 3-6 cũ, giữ tên)
  { id: '4-1', title: 'La Bàn Gió', chapter: 4, order: 23, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-2', title: 'Lưỡi Kiếm Thiên Thể', chapter: 4, order: 24, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-3', title: 'Cánh Cung Chiêm Tinh', chapter: 4, order: 25, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-4', title: 'Bánh Xe Số Phận', chapter: 4, order: 26, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-5', title: 'Thánh Giá Thiên Cầu', chapter: 4, order: 27, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-6', title: 'Đại Ấn Tiên Tri', chapter: 4, order: 28, contentRevision: 'v0.1', status: 'planned' },
];
```

- [ ] **Step 7: Cổng release**

Trong `game-next/scripts/validate-content.ts`:

(a) Thêm dưới import `makeAdjacentFixture`:

```ts
import { releaseGate } from '../src/content/chapters.ts';
```

(b) Thay toàn bộ khối từ comment `// 3. Nếu là Release mode: yêu cầu toàn bộ 18 màn phải có status 'approved'` đến hết `if (isReleaseMode) { … }` bằng:

```ts
// 3. Release mode: cần đủ RELEASE_LEVEL_COUNT (28) màn 'approved' (CH-04)
if (isReleaseMode) {
  const gate = releaseGate(campaignManifest);
  if (!gate.ok) {
    console.error(
      `[validate-content] GATE FAIL: campaign-incomplete. Required ${gate.required} approved levels, found ${gate.approved}.`
    );
    process.exit(1);
  }
}
```

- [ ] **Step 8: HUD theo bảng chương**

Trong `game-next/src/presentation/Hud.ts`:

(a) Thêm import `import { CHAPTERS, chapterInfo, chapterOfLevelId } from '../content/chapters.ts';`.

(b) Thay hai dòng

```ts
    const chapterNum = parseInt(this.levelId.split('-')[0], 10) || 1;
    const chapterRoman = chapterNum === 1 ? 'Chương I' : chapterNum === 2 ? 'Chương II' : 'Chương III';
```

bằng:

```ts
    // Màn dev (mã không theo "<chương>-<số>") hiển thị như Chương I
    const chapter = chapterInfo(chapterOfLevelId(this.levelId) ?? 1) ?? CHAPTERS[0];
    const chapterRoman = `Chương ${chapter.roman}`;
```

(c) Thay comment `// 4. Hàng nút dưới cùng: Đặt lại ở góc trái, Xoay ở góc phải (từ Chương` và dòng tiếp theo `// 3), thanh đếm mảnh ở giữa — theo mockup. …` thành `// 4. Hàng nút dưới cùng: Đặt lại ở góc trái, Xoay ở góc phải (chỉ Chương` / `// 4 — Luân Chuyển), thanh đếm mảnh ở giữa — theo mockup. …` (giữ phần còn lại của câu comment).

(d) Thay `const isChapter3Plus = chapterNum >= 3;` bằng `const rotationChapter = chapter.rotationEnabled;`; thay comment `// B. Nút Xoay tròn 112px (Chỉ hiện từ Chương 3)` bằng `// B. Nút Xoay tròn 112px (chỉ hiện ở Chương 4)`; thay

```ts
    this.rotateAllowed = isChapter3Plus;
    if (!isChapter3Plus) {
```

bằng

```ts
    this.rotateAllowed = rotationChapter;
    if (!rotationChapter) {
```

Kiểm: `grep -n "isChapter3Plus\|chapterNum" src/presentation/Hud.ts` không in dòng nào.

- [ ] **Step 9: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/content.test.ts tests/catalog.test.ts tests/menu.test.ts tests/progress.test.ts tests/hud.test.ts tests/levelSelect.test.ts tests/session.test.ts`
Expected: PASS toàn bộ (test zigzag 18 màn cũ trong `levelSelect.test.ts` vẫn PASS vì chỉ tính toán cục bộ; Task 5 thay nó).

- [ ] **Step 10: Toàn bộ kiểm tra và cổng release**

Run: `npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all`
Expected: xanh; `git status --short src/content/levels ../docs/testing/levels` không có dòng nào.
Run: `npm run content:validate -- --release`
Expected: exit 1, dòng cuối `[validate-content] GATE FAIL: campaign-incomplete. Required 28 approved levels, found <N>.` (N = số màn 1-x đang approved).

- [ ] **Step 11: CHANGELOG và commit**

```markdown
### 2026-10-02 - Restructure campaign into four chapters and 28 levels

- Added `Chapter = 1 | 2 | 3 | 4` (`src/domain/model.ts`, `src/content/document.ts`) and `src/content/chapters.ts` (names, roman numerals, rotation rule, `RELEASE_LEVEL_COUNT = 28`, `releaseGate`).
- `src/content/manifest.ts` now lists 28 levels: chapter 2 with 2-5 renamed Dong Ho Cat, new chapter 3 Hoa Pham (3-1 to 3-10), and the rotation chapter renumbered 4-1 to 4-6 with its titles kept; chapter 1 entries are unchanged.
- `src/content/validate.ts` accepts chapters 1-4, keeps `chapter-rotation-disabled` for chapters 1-3, adds `chapter-rotation-required` for chapter 4 and forbids non-zero turns outside chapter 4.
- `scripts/validate-content.ts --release` requires 28 approved levels; `src/presentation/Hud.ts` shows the rotate button only in chapter 4.
- Updated manifest-dependent assertions in content, catalog, menu, progress, hud, levelSelect and session tests.
- Verification: the updated tests failed against the 18-level manifest and pass after; `npm run typecheck`, `npm test`, `npm run content:validate` and `npm run content:author -- --all` pass with no level data change; `content:validate -- --release` fails with "Required 28 approved levels".
```

Message:

```text
feat(content): restructure campaign into four chapters and 28 levels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/domain/model.ts src/content/document.ts src/content/chapters.ts src/content/validate.ts src/content/manifest.ts scripts/validate-content.ts src/presentation/Hud.ts tests/content.test.ts tests/catalog.test.ts tests/menu.test.ts tests/progress.test.ts tests/hud.test.ts tests/levelSelect.test.ts tests/session.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 5: Bản đồ chọn màn 4 chòm sao, Họa Phẩm 10 nút

**Files:**
- Create: `game-next/src/presentation/constellationLayout.ts`
- Modify: `game-next/src/presentation/LevelSelectScene.ts`
- Modify: `game-next/src/launchParams.ts`, `game-next/src/main.ts` (tham số dev `focus`)
- Test: `game-next/tests/levelSelect.test.ts` (thay test zigzag 18 màn), `game-next/tests/launchParams.test.ts`
- Create (ảnh bằng chứng): `docs/testing/levels/screens/level-select-{khoi-nguyen,hoa-pham,luan-chuyen}.png`

**Interfaces:**
- Consumes: `campaignManifest`, `chapterLabel` (Task 4), `Chapter`.
- Produces:
  - `type MapEntry = { id: string; title: string; chapter: Chapter }`
  - `type MapNode = MapEntry & { index: number; x: number; y: number }`
  - `type ChapterBand = { chapter: Chapter; bannerY: number; top: number; bottom: number; nodeCount: number }`
  - `TEN_NODE_PATTERN: ReadonlyArray<readonly [number, number]>` (x tuyệt đối, dy so với nút đầu chương)
  - `layoutCampaignMap(entries: readonly MapEntry[]): { nodes: MapNode[]; chapters: ChapterBand[]; totalHeight: number }`
  - `LaunchTarget` thêm `{ scene: 'LevelSelectScene'; focusLevelId?: string }`

- [ ] **Step 1: Viết test thất bại**

(a) `game-next/tests/levelSelect.test.ts`: thêm import

```ts
import { TEN_NODE_PATTERN, layoutCampaignMap } from '../src/presentation/constellationLayout.ts';
```

và thay **toàn bộ** test `18 màn được gán đúng tọa độ uốn lượn theo trục dọc màn hình` bằng:

```ts
  test('bố cục suy ra từ manifest: 4 chòm sao 6/6/10/6, đúng thứ tự', () => {
    const layout = layoutCampaignMap(campaignManifest);
    expect(layout.chapters.map((c) => [c.chapter, c.nodeCount])).toEqual([[1, 6], [2, 6], [3, 10], [4, 6]]);
    expect(layout.nodes.map((n) => n.id)).toEqual(campaignManifest.map((e) => e.id));
  });
```

và thêm vào **cuối** file:

```ts
describe('Bố cục bản đồ chòm sao (CH-03)', () => {
  const layout = layoutCampaignMap(campaignManifest);

  test('chòm sao 6 nút giữ toạ độ zigzag cũ của Chương 1–2', () => {
    expect(layout.nodes[0]).toMatchObject({ id: '1-1', x: 225, y: 270 });
    expect(layout.nodes[1]).toMatchObject({ id: '1-2', x: 503, y: 430 });
    expect(layout.nodes[6]).toMatchObject({ id: '2-1', y: 1330 });
  });

  test('chòm sao Họa Phẩm dùng mẫu 10 nút', () => {
    const hoaPham = layout.nodes.filter((n) => n.chapter === 3);
    const y0 = hoaPham[0].y;
    expect(y0).toBe(2390);
    expect(hoaPham.map((n) => [n.x, n.y - y0])).toEqual(TEN_NODE_PATTERN.map(([x, dy]) => [x, dy]));
    expect(layout.nodes.find((n) => n.id === '4-1')?.y).toBe(3490);
    expect(layout.totalHeight).toBe(4530);
  });

  test('không nút nào đè nhau hay tràn khỏi bề ngang 720', () => {
    for (const n of layout.nodes) {
      // Huy hiệu tên màn hiện tại rộng 260px, tâm tại x của nút
      expect(n.x - 130).toBeGreaterThanOrEqual(0);
      expect(n.x + 130).toBeLessThanOrEqual(720);
    }
    for (let i = 0; i < layout.nodes.length; i++) {
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const a = layout.nodes[i];
        const b = layout.nodes[j];
        const apart = Math.abs(a.y - b.y) >= 130 || Math.abs(a.x - b.x) >= 280;
        expect(apart, `${a.id} và ${b.id}`).toBe(true);
      }
    }
  });

  test('tiêu đề chương nằm giữa hai chòm sao; dải màu nối liền', () => {
    layout.chapters.forEach((band, i) => {
      const own = layout.nodes.filter((n) => n.chapter === band.chapter);
      expect(Math.min(...own.map((n) => n.y)) - band.bannerY).toBeGreaterThanOrEqual(60);
      if (i > 0) {
        const prev = layout.nodes.filter((n) => n.chapter === layout.chapters[i - 1].chapter);
        expect(band.bannerY - Math.max(...prev.map((n) => n.y))).toBeGreaterThanOrEqual(60);
        expect(band.top).toBe(layout.chapters[i - 1].bottom);
      }
    });
    expect(layout.chapters[0].top).toBe(0);
    expect(layout.chapters[layout.chapters.length - 1].bottom).toBe(layout.totalHeight);
    expect(layout.totalHeight).toBe(layout.nodes[layout.nodes.length - 1].y + 240);
  });

  test('số chòm sao và số nút không viết cứng', () => {
    const small = layoutCampaignMap([
      { id: 'a-1', title: 'A', chapter: 1 },
      { id: 'a-2', title: 'B', chapter: 1 },
      { id: 'b-1', title: 'C', chapter: 2 },
    ]);
    expect(small.chapters.map((c) => [c.chapter, c.nodeCount])).toEqual([[1, 2], [2, 1]]);
    expect(small.nodes.map((n) => n.y)).toEqual([270, 430, 690]);
  });
});
```

(b) `game-next/tests/launchParams.test.ts`: thêm vào cuối `describe('resolveLaunch', …)`:

```ts
  test('focus cuộn bản đồ tới một màn, chỉ ở dev', () => {
    expect(resolveLaunch('?scene=levelSelect&focus=3-4', true)).toEqual({ scene: 'LevelSelectScene', focusLevelId: '3-4' });
    expect(resolveLaunch('?scene=levelSelect&focus=3-4', false)).toEqual({ scene: 'LevelSelectScene' });
    expect(resolveLaunch('?scene=levelSelect', true)).toEqual({ scene: 'LevelSelectScene' });
  });
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/levelSelect.test.ts tests/launchParams.test.ts`
Expected: FAIL — không resolve được `constellationLayout.ts`; test `focus` đỏ vì thiếu `focusLevelId`.

- [ ] **Step 3: Viết `constellationLayout.ts`**

Tạo `game-next/src/presentation/constellationLayout.ts`:

```ts
import type { Chapter } from '../domain/model.ts';

export type MapEntry = { id: string; title: string; chapter: Chapter };
export type MapNode = MapEntry & { index: number; x: number; y: number };
export type ChapterBand = {
  chapter: Chapter;
  /** Tâm dòng tiêu đề chương */
  bannerY: number;
  /** Dải màu nền của chương: [top, bottom) */
  top: number;
  bottom: number;
  nodeCount: number;
};
export type CampaignMapLayout = { nodes: MapNode[]; chapters: ChapterBand[]; totalHeight: number };

const FIRST_NODE_Y = 270;
const NODE_STEP_Y = 160;
const CHAPTER_GAP_Y = 100;
const BANNER_OFFSET_Y = 85;
const BAND_OFFSET_Y = 170;
const BOTTOM_PADDING = 240;

/**
 * Chòm sao 10 nút (Họa Phẩm): chuỗi đèn lồng — một nút giữa, một cặp hai
 * bên, lặp lại. [x tuyệt đối, dy so với nút đầu chương]. Cặp cùng hàng cách
 * nhau 320px (> huy hiệu 260px); các hàng cách nhau 140px.
 */
export const TEN_NODE_PATTERN: ReadonlyArray<readonly [number, number]> = [
  [360, 0],
  [200, 140],
  [520, 140],
  [360, 280],
  [200, 420],
  [520, 420],
  [360, 560],
  [200, 700],
  [520, 700],
  [360, 840],
];

/** Zigzag cũ của bản đồ 18 màn, theo chỉ số toàn cục: x trong [191, 529]. */
function zigzagX(index: number): number {
  const dir = index % 2 === 0 ? -1 : 1;
  return 360 + dir * (135 + ((index * 43) % 35));
}

/**
 * Toạ độ nút và dải chương suy ra từ manifest: mỗi nhóm chương liền nhau là
 * một chòm sao. Chòm sao đúng 10 nút dùng TEN_NODE_PATTERN, còn lại zigzag.
 */
export function layoutCampaignMap(entries: readonly MapEntry[]): CampaignMapLayout {
  const groups: Array<{ chapter: Chapter; entries: MapEntry[] }> = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.chapter === entry.chapter) last.entries.push(entry);
    else groups.push({ chapter: entry.chapter, entries: [entry] });
  }

  const nodes: MapNode[] = [];
  const bands: Array<Omit<ChapterBand, 'bottom'>> = [];
  let cursorY = FIRST_NODE_Y;
  groups.forEach((group, g) => {
    if (g > 0) cursorY += CHAPTER_GAP_Y;
    const firstY = cursorY;
    if (group.entries.length === TEN_NODE_PATTERN.length) {
      group.entries.forEach((entry, i) => {
        const [x, dy] = TEN_NODE_PATTERN[i];
        nodes.push({ ...entry, index: nodes.length, x, y: firstY + dy });
      });
      cursorY = firstY + TEN_NODE_PATTERN[TEN_NODE_PATTERN.length - 1][1] + NODE_STEP_Y;
    } else {
      for (const entry of group.entries) {
        const index = nodes.length;
        nodes.push({ ...entry, index, x: zigzagX(index), y: cursorY });
        cursorY += NODE_STEP_Y;
      }
    }
    bands.push({
      chapter: group.chapter,
      bannerY: firstY - BANNER_OFFSET_Y,
      top: g === 0 ? 0 : firstY - BAND_OFFSET_Y,
      nodeCount: group.entries.length,
    });
  });

  const totalHeight = nodes.length > 0 ? nodes[nodes.length - 1].y + BOTTOM_PADDING : FIRST_NODE_Y;
  const chapters: ChapterBand[] = bands.map((band, i) => ({
    ...band,
    bottom: i + 1 < bands.length ? bands[i + 1].top : totalHeight,
  }));
  return { nodes, chapters, totalHeight };
}
```

- [ ] **Step 4: Tham số dev `focus`**

(a) `game-next/src/launchParams.ts`: đổi dòng `| { scene: 'LevelSelectScene' }` thành `| { scene: 'LevelSelectScene'; focusLevelId?: string }`, và thay

```ts
  if (scene === 'levelSelect') {
    return { scene: 'LevelSelectScene' };
  }
```

bằng:

```ts
  if (scene === 'levelSelect') {
    // focus chỉ dùng ở dev để chụp ảnh một chòm sao bất kỳ
    const focus = params.get('focus');
    return isDev && focus ? { scene: 'LevelSelectScene', focusLevelId: focus } : { scene: 'LevelSelectScene' };
  }
```

(b) `game-next/src/main.ts`: thay dòng `      game.scene.start('LevelSelectScene');` (trong nhánh `else` của khối `launch.scene !== 'MenuScene'`) bằng:

```ts
      game.scene.start('LevelSelectScene', launch.focusLevelId ? { focusLevelId: launch.focusLevelId } : undefined);
```

- [ ] **Step 5: `LevelSelectScene` dùng bố cục**

Trong `game-next/src/presentation/LevelSelectScene.ts`:

(a) Thêm import:

```ts
import { chapterLabel } from '../content/chapters.ts';
import type { Chapter } from '../domain/model.ts';
import { layoutCampaignMap } from './constellationLayout.ts';
```

(b) Thêm ngay sau `type NodeInfo = { … };`:

```ts
/** Sắc độ nền từng chương, phủ rất nhẹ để nền trời vẫn lộ ra. */
const CHAPTER_TINTS: Readonly<Record<Chapter, { color: number; alpha: number }>> = {
  1: { color: 0x7fb8ff, alpha: 0.04 }, // Khởi Nguyên: xanh trời
  2: { color: 0xb48cff, alpha: 0.06 }, // Giao Thoa: tím giao thoa
  3: { color: 0x7ee0c8, alpha: 0.05 }, // Họa Phẩm: ngọc bích
  4: { color: 0xffb86b, alpha: 0.06 }, // Luân Chuyển: hổ phách hoàng hôn
};
```

(c) Thêm field `private focusLevelId?: string;` dưới `private toastContainer?: …;`, và thêm method ngay sau `constructor`:

```ts
  init(data?: { focusLevelId?: string }): void {
    this.focusLevelId = data?.focusLevelId;
  }
```

(d) Trong `buildConstellation`, thay toàn bộ đoạn từ `const nodes: NodeInfo[] = [];` (dòng đầu thân hàm) đến hết dòng `this.mapContainer.add(chBackdrop);` bằng:

```ts
    // 1. Toạ độ nút và dải chương suy ra từ manifest (constellationLayout.ts)
    const layout = layoutCampaignMap(campaignManifest);
    const nodes: NodeInfo[] = layout.nodes.map((mapNode) => {
      const access = levelAccess(campaignManifest, completedLevels, mapNode.id);
      let state: NodeInfo['state'] = 'locked';
      if (access.completed) {
        state = 'completed';
      } else if (access.unlocked && access.available) {
        state = 'current';
      } else if (access.unlocked && !access.available) {
        state = 'unlocked';
      }
      return {
        id: mapNode.id,
        title: mapNode.title,
        chapter: mapNode.chapter,
        x: mapNode.x,
        y: mapNode.y,
        state,
        available: access.available,
      };
    });
    const currentNode = nodes.find((n) => n.state === 'current') ?? null;

    // 2. Sắc độ riêng cho từng chương theo dải của bố cục
    const chBackdrop = this.add.graphics();
    for (const band of layout.chapters) {
      const tint = CHAPTER_TINTS[band.chapter];
      chBackdrop.fillStyle(tint.color, tint.alpha);
      chBackdrop.fillRect(0, band.top, 720, band.bottom - band.top);
    }
    this.mapContainer.add(chBackdrop);
```

(e) Thay đoạn tiêu đề chương — từ `const chapterTitles = [` đến dòng `const bannerY = firstNode.y - 85;` và dòng `const chContainer = this.add.container(360, bannerY);` — bằng:

```ts
    for (const band of layout.chapters) {
      const chContainer = this.add.container(360, band.bannerY);
```

và trong lời gọi `this.add.text(0, 0, chapterTitles[c], {` đổi `chapterTitles[c]` thành `chapterLabel(band.chapter)`. (Phần thân còn lại của vòng lặp — chữ serif, hai gạch amber, `this.mapContainer.add(chContainer)` — giữ nguyên.)

(f) Thay

```ts
    const totalHeight = nodes[nodes.length - 1].y + 240;
    this.minY = Math.min(0, 1280 - totalHeight);

    return currentNode;
```

bằng:

```ts
    this.minY = Math.min(0, 1280 - layout.totalHeight);

    // Dev có thể cuộn tới màn bất kỳ qua ?focus=<id>; mặc định là màn hiện tại
    const focusNode = this.focusLevelId ? nodes.find((n) => n.id === this.focusLevelId) : undefined;
    return focusNode ?? currentNode;
```

Kiểm: `grep -n "i === 6\|i === 12\|c \* 6\|chapterTitles\|2200" src/presentation/LevelSelectScene.ts` không in dòng nào.

- [ ] **Step 6: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/levelSelect.test.ts tests/launchParams.test.ts`
Expected: PASS.

- [ ] **Step 7: Toàn bộ kiểm tra và build**

Run: `npm run typecheck && npm test && npm run build`
Expected: xanh.

- [ ] **Step 8: Chụp ảnh và xem bằng mắt**

Chạy dev server nền: `npm run dev -- --port 5173 --strictPort` (chờ `Local: http://localhost:5173`). Rồi (bash):

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p ../docs/testing/levels/screens
for shot in "khoi-nguyen|" "hoa-pham|&focus=3-4" "luan-chuyen|&focus=4-3"; do
  name="${shot%%|*}"; query="${shot#*|}"
  "$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --force-device-scale-factor=1 --window-size=720,1280 --virtual-time-budget=6000 \
    --screenshot="../docs/testing/levels/screens/level-select-${name}.png" \
    "http://localhost:5173/?scene=levelSelect${query}"
done
```

Mở ba ảnh và xác nhận:
- `khoi-nguyen`: tiêu đề "Chương I · Khởi Nguyên", nút 1-1 nhấp nháy có huy hiệu tên; huy hiệu tiến độ góc phải dạng `x/28`.
- `hoa-pham`: tiêu đề "Chương III · Họa Phẩm"; đủ 10 nút 3-1 → 3-10 xếp chuỗi đèn lồng (giữa – cặp – giữa …); nền ngọc bích nhạt; không nút hay số màn nào đè nhau, không nút nào chạm mép trái/phải.
- `luan-chuyen`: tiêu đề "Chương IV · Luân Chuyển" và đủ 6 nút 4-1 → 4-6; không còn tiêu đề "Chương III · Luân Chuyển".

Ảnh nào sai là lỗi: sửa trước khi commit. Dừng dev server sau khi chụp.

- [ ] **Step 9: CHANGELOG và commit**

```markdown
### 2026-10-02 - Derive the constellation map from the 28-level manifest

- Added `src/presentation/constellationLayout.ts`: chapters and nodes come from the manifest; six-node chapters keep the previous zigzag, the ten-node Hoa Pham chapter uses a lantern-chain pattern.
- `src/presentation/LevelSelectScene.ts` draws four constellations with per-chapter tints and titles from `chapterLabel`; a dev-only `?scene=levelSelect&focus=<id>` (`src/launchParams.ts`, `src/main.ts`) scrolls to any level for screenshots.
- Added layout overlap and bounds tests to `tests/levelSelect.test.ts` and screenshots `docs/testing/levels/screens/level-select-{khoi-nguyen,hoa-pham,luan-chuyen}.png`.
- Verification: the layout tests failed before the module existed and pass after; `npm run typecheck`, `npm test` and `npm run build` pass; headless Chrome shots at 720x1280 show four constellations with no overlapping nodes.
```

Message:

```text
feat(app): derive constellation map from the 28-level manifest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add src/presentation/constellationLayout.ts src/presentation/LevelSelectScene.ts src/launchParams.ts src/main.ts tests/levelSelect.test.ts tests/launchParams.test.ts ../docs/testing/levels/screens/level-select-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 6: Tài liệu `docs/content/level-kit.md` và ảnh bảng hình

**Files:**
- Create: `game-next/scripts/render-kit-gallery.ts`
- Modify: `game-next/package.json` (script `content:gallery`)
- Create: `docs/content/level-kit.md`
- Create (sinh ra): `docs/content/kit/*.svg` (15 file)
- Test: `game-next/tests/levelKitDoc.test.ts`

**Interfaces:**
- Consumes: `piece` (Task 1); `buildLevelDocument`; `renderPreviewSvg`.
- Produces: `GALLERY`, `galleryFileName(kind, orientation)` (export từ `scripts/render-kit-gallery.ts`); tài liệu spec B mục 4.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/levelKitDoc.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { GALLERY, galleryFileName } from '../scripts/render-kit-gallery.ts';

const DOC = fileURLToPath(new URL('../../docs/content/level-kit.md', import.meta.url));
const KIT_DIR = fileURLToPath(new URL('../../docs/content/kit/', import.meta.url));

describe('docs/content/level-kit.md', () => {
  test('bảng hình có đủ 15 hướng', () => {
    expect(GALLERY.flatMap((g) => g.orientations.map((o) => galleryFileName(g.kind, o)))).toHaveLength(15);
  });

  test('trỏ tới mọi ảnh hình và ảnh đã được sinh', () => {
    const md = readFileSync(DOC, 'utf8');
    for (const g of GALLERY) {
      for (const o of g.orientations) {
        const file = galleryFileName(g.kind, o);
        expect(md).toContain(`kit/${file}`);
        expect(existsSync(KIT_DIR + file)).toBe(true);
      }
    }
  });

  test('đủ sáu mục của spec B mục 4 và ba màn mẫu', () => {
    const md = readFileSync(DOC, 'utf8');
    for (const heading of [
      '## 1. Bảng hình',
      '## 2. Lưới và toạ độ',
      '## 3. Luật chẵn lẻ',
      '## 4. Quy trình tạo màn',
      '## 5. Ba màn mẫu để clone',
      '## 6. Mẹo tăng độ khó',
    ]) {
      expect(md).toContain(heading);
    }
    expect(md).toContain('### 1-2 Bảo Tháp Tiên Tri');
    expect(md).toContain('### 2-3 Trái Tim Tinh Thể');
    expect(md).toContain('### 3-10 Mandala Thiên Cầu');
    expect(md).toContain('npm run content:new');
    expect(md).toContain('mirrorX(');
    expect(md).toContain('concentric(');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/levelKitDoc.test.ts`
Expected: FAIL — không resolve được `../scripts/render-kit-gallery.ts`.

- [ ] **Step 3: Script sinh ảnh**

Tạo `game-next/scripts/render-kit-gallery.ts`:

```ts
/**
 * Sinh ảnh minh hoạ bảng hình cho docs/content/level-kit.md.
 *
 *   npm run content:gallery
 *
 * Mỗi hình, mỗi hướng: một mảnh khung 48 đặt giữa bàn, vẽ bằng renderPreviewSvg.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import { renderPreviewSvg } from '../src/content/authoringReport.ts';
import { piece } from '../src/content/kit.ts';
import type { Orientation, ShapeKind } from '../src/domain/model.ts';

export const GALLERY: ReadonlyArray<{ kind: ShapeKind; orientations: readonly Orientation[] }> = [
  { kind: 'square', orientations: [0] },
  { kind: 'triangle', orientations: [0, 1, 2, 3, 4, 5, 6, 7] },
  { kind: 'diamond', orientations: [0] },
  { kind: 'circle', orientations: [0] },
  { kind: 'parallelogram', orientations: [0, 1, 2, 3] },
];

export function galleryFileName(kind: ShapeKind, orientation: Orientation): string {
  return `${kind}-${orientation}.svg`;
}

function gallerySource(kind: ShapeKind, orientation: Orientation): LevelSource {
  return {
    id: `kit-${kind}-${orientation}`,
    title: `${kind} hướng ${orientation}`,
    chapter: 1,
    order: 1,
    contentRevision: 'kit-gallery',
    rotationEnabled: false,
    pieces: [piece('P1', kind, 48, [64, 80], { orientation })],
    sampleSolutions: [[{ pieceId: 'P1', anchorId: 'A', turns: 0 }]],
    learningObjective: 'Minh hoạ bảng hình',
    difficultyEstimate: 1,
    distractors: [],
    ftueSteps: [],
  };
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolve(entry).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isMainModule()) {
  const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/content/kit');
  mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const g of GALLERY) {
    for (const o of g.orientations) {
      const svg = renderPreviewSvg(buildLevelDocument(gallerySource(g.kind, o)));
      writeFileSync(resolve(outDir, galleryFileName(g.kind, o)), svg, 'utf8');
      count++;
    }
  }
  console.log(`[kit-gallery] Đã ghi ${count} ảnh vào docs/content/kit/`);
}
```

Trong `game-next/package.json`, thêm vào `scripts` ngay sau dòng `"content:new": …,`:

```json
    "content:gallery": "node --experimental-strip-types scripts/render-kit-gallery.ts",
```

Run: `npm run content:gallery`
Expected: `[kit-gallery] Đã ghi 15 ảnh vào docs/content/kit/`.

- [ ] **Step 4: Viết tài liệu**

Tạo `docs/content/level-kit.md` với đúng nội dung sau:

````markdown
# Bộ khung tạo màn (level kit)

Tài liệu cho người tạo màn: hình nào dùng được, đặt mảnh thế nào, luật hiện/ẩn, quy trình từ nguồn tới `approved`, và ba màn mẫu để clone. Spec gốc: `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` (B) và `2026-10-02-a-shapes-v2-design.md` (A).

## 1. Bảng hình

Mọi khung là hình vuông cạnh `s` (ô logic), tối đa 128. Ảnh minh hoạ là khung 48 giữa bàn, sinh bằng `npm run content:gallery` (dùng `renderPreviewSvg`, không sửa tay).

| Hình | `shapeKind` | Hướng | Khung cho phép | Minh hoạ |
|---|---|---|---|---|
| Vuông | `square` | 0 | bội của 8, ≥ 16 | <img src="kit/square-0.svg" width="80" alt="vuông"> |
| Tam giác vuông cân, góc vuông ở TL/TR/BR/BL | `triangle` | 0–3 | bội của 8, ≥ 16 (tam giác nhỏ: 16 hoặc 24) | <img src="kit/triangle-0.svg" width="80" alt="tam giác 0"> <img src="kit/triangle-1.svg" width="80" alt="tam giác 1"> <img src="kit/triangle-2.svg" width="80" alt="tam giác 2"> <img src="kit/triangle-3.svg" width="80" alt="tam giác 3"> |
| Mái, cạnh huyền ở đáy/trái/đỉnh/phải, đỉnh mái ở tâm khung | `triangle` | 4–7 | bội của 16, ≥ 16 | <img src="kit/triangle-4.svg" width="80" alt="mái 4"> <img src="kit/triangle-5.svg" width="80" alt="mái 5"> <img src="kit/triangle-6.svg" width="80" alt="mái 6"> <img src="kit/triangle-7.svg" width="80" alt="mái 7"> |
| Thoi | `diamond` | 0 | bội của 16, ≥ 16 | <img src="kit/diamond-0.svg" width="80" alt="thoi"> |
| Tròn (đa giác đều 32 cạnh) | `circle` | 0 | bội của 16, ≥ 16 | <img src="kit/circle-0.svg" width="80" alt="tròn"> |
| Bình hành: 0 nằm nghiêng phải, 1 đứng, 2 nằm nghiêng trái, 3 đứng | `parallelogram` | 0–3 | bội của 48, ≥ 48 | <img src="kit/parallelogram-0.svg" width="80" alt="bình hành 0"> <img src="kit/parallelogram-1.svg" width="80" alt="bình hành 1"> <img src="kit/parallelogram-2.svg" width="80" alt="bình hành 2"> <img src="kit/parallelogram-3.svg" width="80" alt="bình hành 3"> |

Lật gương (`mirrorX` qua trục dọc, `mirrorY` qua trục ngang) tự đổi hướng:

| Hình | `mirrorX` | `mirrorY` |
|---|---|---|
| Tam giác 0–3 | 0↔1, 2↔3 (TL↔TR, BL↔BR) | 0↔3, 1↔2 (TL↔BL, TR↔BR) |
| Mái 4–7 | 5↔7; 4 và 6 giữ nguyên | 4↔6; 5 và 7 giữ nguyên |
| Bình hành | 0↔2, 1↔3 | 0↔2, 1↔3 |
| Vuông, thoi, tròn | giữ 0 | giữ 0 |

## 2. Lưới và toạ độ

- Bàn logic 128 × 160 ô. **1 ô hiển thị = 8 ô logic**, **1 module = 24 ô logic** (vạch lưới đậm).
- Neo là **gốc khung** (góc trên-trái) và phải là bội của 8.
- Hàm ghép hình nhận **tâm khung**: `gốc = tâm − s/2`, `tâm = gốc + s/2`. Tâm bàn là `(64, 80)`.
- Ví dụ: vuông 48 tâm `(64, 80)` → gốc `(40, 56)`; tròn 96 tâm `(64, 80)` → gốc `(16, 32)`; thoi 16 tâm `(64, 80)` → gốc `(56, 72)`.
- Khung `s` có tâm trên lưới 8 khi `s/2` là bội của 8 (khung 16, 32, 48, 64, 96, 128). Khung 24 hay 40 thì tâm phải lệch 4: `piece` sẽ báo lỗi nếu gốc tính ra không phải bội của 8.

| Hàm (`src/content/kit.ts`) | Dùng khi |
|---|---|
| `piece(id, hình, khung, [cx, cy], { orientation, decoys })` | Đặt một mảnh theo tâm; neo A = vị trí đúng, neo nhiễu tên B–F theo thứ tự `decoys` |
| `mirrorX(p, x, newId)` / `mirrorY(p, y, newId)` | Mảnh đối xứng qua đường x = `x` / y = `y`; neo nhiễu lật theo |
| `concentric([cx, cy], specs)` | Nhiều mảnh chung tâm (mandala, sao, vầng sáng) |
| `row(prefix, hình, khung, [cx, cy], [dx, dy], n)` | Lặp mảnh đều nhau; id `<prefix>1..n` |
| `NUDGE` = `[[8,0],[-8,0],[0,8]]`, `CROSS` = `NUDGE` + `[0,-8]` | Bộ neo nhiễu sát dựng sẵn |

**Luật neo nhiễu KIT-03** (do `buildLevelDocument` áp dụng): neo nhiễu vượt biên bàn bị bỏ; neo nhiễu trùng neo A của một mảnh khác **cùng hình, cùng hướng, cùng khung** bị bỏ (hai mảnh giống hệt đổi chỗ sẽ sinh nghiệm thứ hai). Neo bị bỏ được liệt kê trong `docs/testing/levels/<id>-report.md`, mục "Neo nhiễu đã bỏ".

## 3. Luật chẵn lẻ

Mặt nạ dùng XOR: ô bị phủ **lẻ** lần thì hiện, **chẵn** lần thì ẩn. Mọi mảnh cùng màu.

| Số lớp phủ một ô | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Trạng thái | ẩn | hiện | ẩn | hiện lại | ẩn | hiện |

Hệ quả khi thiết kế: chồng hai mảnh để khoét chỗ rỗng (mắt, cửa, khe); đặt mảnh thứ ba vào chỗ rỗng để nó hiện lại (ngọc, con ngươi). Chương 1 cấm chồng (`chapter-1-no-overlap`); xoay chỉ có ở Chương 4.

## 4. Quy trình tạo màn

1. `npm run content:new -- <id> --from <id-nguồn>` (hoặc không có `--from` để dùng `src/content/sources/_template.ts`; thêm `--title "<tên>"` nếu id chưa có trong manifest). Lệnh ghi `src/content/sources/<id>.ts`, đăng ký vào `sources/index.ts`, đổi `id`, `order`, `chapter`, tên hằng và `contentRevision` = `<slug>-v1`. Lệnh từ chối id đã có nguồn trong `sources/` hoặc `studio/`.
2. Sửa nguồn: mảnh bằng hàm ghép hình, `sampleSolutions`, `distractors`, mục tiêu học, FTUE, câu thơ.
3. `npm run content:author -- <id>`: sinh `src/content/levels/<id>.json`, `docs/testing/levels/<id>.svg` và `<id>-report.md`. Lệnh thất bại nếu có nghiệm dùng ít mảnh hơn.
4. Xem SVG, đọc báo cáo (số nghiệm phải là 1; mỗi gây nhiễu đổi bao nhiêu ô; neo nào bị KIT-03 bỏ). Chơi thử ở harness: `npm run dev` rồi mở `http://localhost:5173/?scene=play&level=<id>&mode=harness` (chỉ màn có trong manifest với `validated` trở lên).
5. Đăng ký vào `src/content/manifest.ts` và `src/content/catalog.ts` ở trạng thái `validated` (lệnh `content:new` không làm việc này).
6. Người review duyệt → đổi sang `approved` và tăng revision nếu sửa nguồn sau duyệt. Bản phát hành cần đủ 28 màn `approved` (`npm run content:validate -- --release`).

## 5. Ba màn mẫu để clone

### 1-2 Bảo Tháp Tiên Tri

Ghép cạnh: mái đặt khít trên đỉnh khối vuông, không chồng. Bản dưới cho đúng JSON của nguồn 1-2 hiện có.

```ts
import type { LevelSource } from '../authoring.ts'; // kiểu nguồn mô tả
import { piece } from '../kit.ts'; // hàm đặt mảnh theo tâm

export const baoThap: LevelSource = {
  id: '1-2', // mã màn, trùng tên file
  title: 'Bảo Tháp Tiên Tri', // tên hiển thị
  chapter: 1, // chương 1: ghép cạnh, cấm chồng
  order: 2, // thứ tự trong campaign
  contentRevision: 'bao-thap-v1', // slug không dấu + phiên bản
  rotationEnabled: false, // chương 1–3 không xoay
  pieces: [
    // Chân tháp: vuông 48, tâm (64, 88) → gốc (40, 64); neo nhiễu B lệch phải 8 ô
    piece('S1', 'square', 48, [64, 88], { decoys: [[8, 0]] }),
    // Mái hướng 4 (cạnh huyền ở đáy), tâm (64, 40) → gốc (40, 16); đáy mái y = 64 chạm đỉnh chân tháp
    piece('R1', 'triangle', 48, [64, 40], { orientation: 4, decoys: [[8, 0]] }),
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 }, // chân tháp vào neo đúng
      { pieceId: 'R1', anchorId: 'A', turns: 0 }, // mái vào neo đúng
    ],
  ],
  learningObjective: 'Phối hợp hai hình khối khác nhau thành một biểu tượng', // màn dạy gì
  difficultyEstimate: 1, // 1–5
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Chân tháp lệch ngang' }, // gây nhiễu có chủ đích
    { pieceId: 'R1', anchorId: 'B', reason: 'Mái lệch khỏi trục tháp' },
  ],
  ftueSteps: [
    { id: 'combine-shapes', trigger: 'idle', end: 'drag-start', text: 'Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu' }, // gợi ý khi ngồi yên
  ],
  victoryVerse: 'Tháp vươn lên trời, lời tiên tri có chỗ đứng.', // câu thơ khi thắng
};
```

### 2-3 Trái Tim Tinh Thể

Rỗng và hiện lại: hai cánh mái đâm qua nhau để lại tâm thoi rỗng (2 lớp), viên ngọc thoi 16 đặt vào đó hiện lại (3 lớp). Toạ độ theo spec C; nguồn thật do plan C viết.

```ts
import type { LevelSource } from '../authoring.ts'; // kiểu nguồn mô tả
import { NUDGE, mirrorX, piece } from '../kit.ts'; // đặt theo tâm, lật gương, neo nhiễu sát

// Cánh phải: mái 96 hướng 5, tâm (80, 80) → gốc (32, 32). Không có neo lệch phải (sẽ vượt biên).
const wing = piece('T1', 'triangle', 96, [80, 80], { orientation: 5, decoys: [[-8, 0], [0, 8], [0, -8]] });

export const traiTimTinhThe: LevelSource = {
  id: '2-3', // mã màn
  title: 'Trái Tim Tinh Thể', // tên hiển thị
  chapter: 2, // chương 2: chồng lớp chẵn lẻ
  order: 9, // thứ tự trong campaign
  contentRevision: 'trai-tim-tinh-the-v1', // slug + phiên bản
  rotationEnabled: false, // không xoay
  pieces: [
    wing, // cánh phải, neo nhiễu B (24,32), C (32,40), D (32,24)
    mirrorX(wing, 64, 'T2'), // cánh trái qua trục x = 64: hướng 7, gốc (0, 32), neo nhiễu B (8,32), C (0,40), D (0,24)
    piece('C1', 'diamond', 16, [64, 80], { decoys: NUDGE }), // ngọc thoi 16 ở tâm rỗng, gốc (56, 72)
  ],
  sampleSolutions: [
    [
      { pieceId: 'T1', anchorId: 'A', turns: 0 }, // cánh phải
      { pieceId: 'T2', anchorId: 'A', turns: 0 }, // cánh trái: vùng giao 2 lớp → rỗng
      { pieceId: 'C1', anchorId: 'A', turns: 0 }, // ngọc: 3 lớp → hiện lại
    ],
  ],
  learningObjective: 'Dự đoán được ba lớp thì vùng đó hiện lại', // màn dạy gì
  difficultyEstimate: 3, // 1–5
  distractors: [
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' }, // cánh ăn sâu quá
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, // ngọc lệch khỏi tâm rỗng
  ],
  ftueSteps: [
    { id: 'third-layer', trigger: 'two-layers', end: 'three-layers', text: 'Thêm mảnh thứ ba: vùng đó hiện lại' }, // gợi ý sau khi có vùng 2 lớp
  ],
  victoryVerse: 'Trong khoảng rỗng, một trái tim tinh thể bừng sáng.', // câu thơ khi thắng
};
```

### 3-10 Mandala Thiên Cầu

Mandala chung tâm: năm tầng chẵn lẻ xen kẽ (đĩa tròn, vuông rỗng, thoi sáng, tâm tròn rỗng, ngọc thoi sáng). Toạ độ theo spec C; nguồn thật do plan C viết.

```ts
import type { LevelSource } from '../authoring.ts'; // kiểu nguồn mô tả
import { NUDGE, concentric } from '../kit.ts'; // nhiều mảnh chung tâm, neo nhiễu sát

export const mandalaThienCau: LevelSource = {
  id: '3-10', // mã màn
  title: 'Mandala Thiên Cầu', // tên hiển thị
  chapter: 3, // chương 3: Họa Phẩm
  order: 22, // màn cuối Họa Phẩm
  contentRevision: 'mandala-thien-cau-v1', // slug + phiên bản
  rotationEnabled: false, // không xoay
  // Năm mảnh chung tâm bàn (64, 80); gốc khung = tâm − khung/2
  pieces: concentric([64, 80], [
    { id: 'C1', kind: 'circle', size: 96, decoys: NUDGE }, // đĩa ngoài, gốc (16, 32): 1 lớp → hiện
    { id: 'S1', kind: 'square', size: 64, decoys: NUDGE }, // vuông, gốc (32, 48): 2 lớp → rỗng
    { id: 'D1', kind: 'diamond', size: 64, decoys: NUDGE }, // thoi, gốc (32, 48): 3 lớp → hiện lại
    { id: 'C2', kind: 'circle', size: 32, decoys: NUDGE }, // tâm tròn, gốc (48, 64): 4 lớp → rỗng
    { id: 'K1', kind: 'diamond', size: 16, decoys: NUDGE }, // ngọc, gốc (56, 72): 5 lớp → hiện
  ]),
  sampleSolutions: [
    [
      { pieceId: 'C1', anchorId: 'A', turns: 0 }, // mỗi mảnh vào neo A
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
      { pieceId: 'K1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Tổng hợp: năm tầng chẵn lẻ xen kẽ', // màn dạy gì
  difficultyEstimate: 5, // màn khó nhất chương
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' }, // một tầng lệch là cả vòng rỗng lệch
    { pieceId: 'K1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
  ],
  ftueSteps: [], // không cần hướng dẫn
  victoryVerse: 'Thiên cầu xoay quanh một viên ngọc, bức họa hoàn tất.', // câu thơ khi thắng
};
```

## 6. Mẹo tăng độ khó

- **Neo nhiễu gần:** dùng `NUDGE` hoặc `CROSS` thay cho một neo lệch xa; mảnh lệch 8 ô chỉ đổi vài trăm ô nên khó nhận ra. Xem cột "Số ô đổi" trong báo cáo: số càng nhỏ, gây nhiễu càng tinh.
- **Giấu cạnh mảnh vào vùng rỗng:** cho cạnh một mảnh nằm trong vùng 2 lớp của hai mảnh khác, người chơi không thấy đường viền để căn.
- **Nhiều mảnh giống nhau:** đặt hai mảnh cùng hình, cùng khung ở hai chỗ; KIT-03 tự bỏ neo nhiễu trùng chỗ để nghiệm vẫn duy nhất.
- **Đối xứng giả:** dùng `mirrorX` cho hình tổng thể nhưng cho một bên neo nhiễu khác bên kia.
- **Chế độ đặt tự do** (spec D, khi có): mảnh hít vào mọi giao điểm lưới thay vì vài neo, nên không còn gợi ý vị trí.
````

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/levelKitDoc.test.ts`
Expected: PASS.

- [ ] **Step 6: Kiểm ví dụ 1-2 khớp nguồn thật**

Run: `node --experimental-strip-types -e "import('./src/content/kit.ts').then(async (k) => { const { LEVEL_SOURCES } = await import('./src/content/sources/index.ts'); const a = [k.piece('S1','square',48,[64,88],{decoys:[[8,0]]}), k.piece('R1','triangle',48,[64,40],{orientation:4,decoys:[[8,0]]})]; console.log(JSON.stringify(a) === JSON.stringify(LEVEL_SOURCES['1-2'].pieces)); })"`
Expected: in `true`. Nếu `false`: sửa ví dụ trong tài liệu cho khớp nguồn 1-2, không sửa nguồn.

- [ ] **Step 7: Toàn bộ kiểm tra**

Run: `npm run typecheck && npm test`
Expected: xanh.

- [ ] **Step 8: CHANGELOG và commit**

```markdown
### 2026-10-02 - Document the level kit

- Added `docs/content/level-kit.md`: shape table with generated previews, grid and center-to-origin formula, parity table, authoring workflow from `content:new` to `approved`, three annotated sample levels (1-2, 2-3, 3-10) and difficulty tips.
- Added `scripts/render-kit-gallery.ts` (`npm run content:gallery`) generating `docs/content/kit/*.svg` with `renderPreviewSvg`, and `tests/levelKitDoc.test.ts` keeping the document in sync with the gallery.
- Verification: the doc test failed before the gallery script existed and passes after; `npm run content:gallery` wrote 15 images; the 1-2 kit example matches the committed 1-2 source; `npm run typecheck` and `npm test` pass.
```

Message:

```text
docs(content): add level kit guide with shape gallery

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add scripts/render-kit-gallery.ts package.json tests/levelKitDoc.test.ts ../docs/content/level-kit.md ../docs/content/kit/*.svg ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 7: Cập nhật GDD (CH-05)

**Files:**
- Modify: `docs/gdd/master-gdd.md`

**Interfaces:**
- Consumes: manifest 28 màn (Task 4); bảng Họa Phẩm và hàng 2-5 nguyên văn từ plan C Task 17 Step 2.
- Produces: GDD 4 chương; plan C Task 17 Step 2 chỉ còn phải thay hàng 2-4 và 2-6.

- [ ] **Step 1: Tổng quan, luật chẵn lẻ và xoay**

Trong `docs/gdd/master-gdd.md` (mỗi thay thế khớp đúng một chỗ):

(a) `rồi từ Chương 3 xoay mảnh từng nấc 90°.` → `rồi ở Chương 4 xoay mảnh từng nấc 90°.`

(b) `| Quy mô MVP | 18 màn thủ công dự kiến, ba chương × sáu màn;` → `| Quy mô MVP | 28 màn thủ công dự kiến, bốn chương (6 + 6 + 10 + 6 màn);`

(c) `Bàn logic là lưới **128 × 192 ô**.` → `Bàn logic là lưới **128 × 160 ô**.` (khớp `GRID_HEIGHT` trong code)

(d) `Vùng giao khác màu chưa có luật trong MVP và không xuất hiện trong 18 màn.` → `Vùng giao khác màu chưa có luật trong MVP và không xuất hiện trong 28 màn.`, rồi chèn ngay sau đoạn đó (trước đoạn bắt đầu bằng `**Thắng:**`) một dòng trống và:

```markdown
**Luật chẵn lẻ (chốt cho cả loạt spec A–E):** mặt nạ dùng XOR (`mask[idx] ^= 1` trong `domain/mask.ts`). Ô bị phủ lẻ lần thì hiện, chẵn lần thì ẩn:

| Số lớp phủ một ô | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Trạng thái | trống | hiện | trống | hiện lại | trống | hiện |

Luật if-else "giao là ẩn" đã bị loại: mỗi mảnh chỉ cần một phép XOR mỗi ô, renderer chồng lớp chẵn/lẻ và bộ giải nghiệm duy nhất đều dựa trên XOR.
```

(e) `Xoay chỉ mở từ Chương 3.` → `Xoay chỉ mở ở Chương 4 (Luân Chuyển).`

(f) `ẩn ở Chương 1 & 2**, chỉ xuất hiện từ Chương 3` → `ẩn ở Chương 1–3**, chỉ xuất hiện ở Chương 4`

(g) `Phân chia 3 chương (*Khởi Nguyên*, *Giao Thoa*, *Luân Chuyển*). Mười tám màn chơi hiển thị` → `Phân chia 4 chương (*Khởi Nguyên*, *Giao Thoa*, *Họa Phẩm*, *Luân Chuyển*); số chòm sao và số nút suy ra từ manifest, chòm sao Họa Phẩm 10 nút xếp thành chuỗi đèn lồng (một nút giữa, một cặp hai bên, lặp lại). Hai mươi tám màn chơi hiển thị`

- [ ] **Step 2: Mục 4 — campaign 4 chương**

Thay từ dòng `### 4.1. Cấu trúc 18 màn` đến hết dòng `3. **Luân chuyển — Xoay chuyển định hướng** (3-1 đến 3-6): …` bằng:

```markdown
### 4.1. Cấu trúc 28 màn

Bốn chương, 6 + 6 + 10 + 6 màn (`game-next/src/content/manifest.ts`, `order` 1 → 28):
1. **Khởi nguyên — Ghép hình tiếp giáp** (1-1 đến 1-6): Làm quen kéo, thả, snap và giải đố hình học tạo biểu tượng cổ ngữ hoàn chỉnh; các mảnh tiếp giáp cạnh/chạm đỉnh, **hoàn toàn không xếp chồng**.
2. **Giao thoa — Bí ẩn vùng giao** (2-1 đến 2-6): Giới thiệu cơ chế "phép trừ" và chẵn-lẻ (parity): hai mảnh chồng nhau tạo hoa văn rỗng (2 lớp), ba mảnh chồng nhau làm hạt nhân ngọc hiện lại (3 lớp).
3. **Họa Phẩm — Tranh ghép nghệ thuật** (3-1 đến 3-10): Tranh kiểu Tangram ghép từ vuông, tam giác lớn/nhỏ, thoi, tròn và bình hành; luật chẵn lẻ tạo chi tiết rỗng (mắt, cửa, vầng sáng) và chi tiết hiện lại. Không xoay.
4. **Luân chuyển — Xoay chuyển định hướng** (4-1 đến 4-6): Mở khóa nút Xoay ↻ 90° kết hợp với quy luật giao thoa để hoàn thiện các đại ấn cổ ngữ đa hướng. Đổi mã từ 3-1 → 3-6 cũ, giữ tên màn.

Chỉ Chương 4 bật `rotationEnabled`; validator báo `chapter-rotation-disabled` nếu màn chương 1–3 bật xoay và `chapter-rotation-required` nếu màn chương 4 tắt xoay. Bản phát hành (`npm run content:validate -- --release`) cần đủ 28 màn `approved`.
```

Rồi trong cùng mục 4:
- `dữ liệu của nó tách khỏi tiến độ 18 màn.` → `dữ liệu của nó tách khỏi tiến độ 28 màn.`
- `Phụ lục B là **12 khung thiết kế** mở rộng.` → `Phụ lục B là **khung thiết kế cho 22 màn** mở rộng (1-4 → 1-6, 2-4 → 2-6, Họa Phẩm 3-1 → 3-10, Luân Chuyển 4-1 → 4-6).`
- `Chương 4–5, mảnh nhiều màu,` → `Chương 5 trở đi, mảnh nhiều màu,`

Và ở mục 5.3: hàng `| 12 màn mở rộng | Chưa duyệt dữ liệu mục tiêu/nghiệm. Hoàn thiện Phụ lục B trước khi gọi campaign 18 màn là hoàn chỉnh. |` → `| 22 màn mở rộng | Chưa duyệt dữ liệu mục tiêu/nghiệm. Hoàn thiện Phụ lục B trước khi gọi campaign 28 màn là hoàn chỉnh. |`

- [ ] **Step 3: Phụ lục B — Họa Phẩm và đổi mã chương xoay**

(a) `## Phụ lục B — Khung thiết kế cho 12 màn Cổ Ngữ Tiên Tri mở rộng` → `## Phụ lục B — Khung thiết kế cho 22 màn Cổ Ngữ Tiên Tri mở rộng`

(b) Thay hàng bắt đầu bằng `| **2-5** |` bằng (nguyên văn plan C Task 17 Step 2):

```markdown
| **2-5** | **Đồng Hồ Cát** *(Hourglass)* | Vòng tròn rỗng (tròn 64 trừ tròn 48) ôm đồng hồ cát hai mái 32 hiện lại ba lớp. Thay bản Chìa Khóa Thời Gian | 4: tròn 64, tròn 48, 2 mái 32 |
```

(c) Cắt sáu hàng `| **3-1** |` … `| **3-6** |` ra khỏi bảng (bảng chính kết thúc ở hàng `| **2-6** |`). Ngay sau bảng chính, thêm một dòng trống rồi (bảng Họa Phẩm nguyên văn plan C Task 17 Step 2):

```markdown
### Chương 3 — Họa Phẩm (10 màn)

Tranh nghệ thuật ghép từ vuông, tam giác vuông lớn/nhỏ, thoi, tròn và bình hành, dùng luật chẵn lẻ để tạo chi tiết rỗng. Toạ độ đầy đủ ở spec `2026-10-02-c-chapter-2-hoa-pham-levels-design.md`.

| Màn | Tên | Hình và hiệu ứng bóng | Mảnh |
|---|---|---|---|
| **3-1** | Nhật Nguyệt Song Huyền | Hai vầng tròn lồng nhau, thấu kính rỗng, ngôi sao hiện lại | 2 tròn 64, thoi 16 |
| **3-2** | Đền Tiên Tri | Mái, thân, cửa vuông rỗng, cửa sổ tròn rỗng | mái 96, vuông 64, vuông 32, tròn 16 |
| **3-3** | Cá Chép Sao | Thân thoi, đuôi, mắt tròn rỗng, miệng rỗng | thoi 64, 2 tam giác, tròn 16 |
| **3-4** | Ngọn Nến | Quầng sáng tròn ôm ngọn lửa âm bản | 2 vuông 32, thoi 32, tròn 64 |
| **3-5** | Thuyền Buồm Hoàng Hôn | Mặt trời lặn sau cánh buồm | 3 tam giác, tròn 32 |
| **3-6** | Mèo Thần | Hai mắt rỗng, đuôi bình hành | 7 mảnh |
| **3-7** | Hoa Sen | Đường rỗng tách cánh, mặt nước bình hành | thoi 48, 2 tam giác, 2 bình hành |
| **3-8** | Kim Tự Tháp Nhật Thực | Cửa tam giác rỗng, nhật thực hai tròn | mái 128, mái 32, 2 tròn 32 |
| **3-9** | Sao Bát Phương | Sao tám cánh, bát giác rỗng, mặt trời hiện lại | vuông 48, thoi 64, tròn 32 |
| **3-10** | Mandala Thiên Cầu | Năm tầng chẵn lẻ chung tâm; kết chương | 2 tròn, vuông, 2 thoi |

### Chương 4 — Luân Chuyển (6 màn, xoay)

Đổi mã từ 3-1 → 3-6 cũ; tên và vai trò giữ nguyên.

| Màn | Tên Biểu Tượng Cổ Ngữ | Vai trò sư phạm & Ràng buộc hình học | Mảnh dự kiến |
|---|---|---|---|
```

rồi dán sáu hàng vừa cắt vào cuối bảng Chương 4, chỉ đổi ô đầu `**3-1**` … `**3-6**` thành `**4-1**` … `**4-6**` (giữ nguyên ba ô còn lại của mỗi hàng).

- [ ] **Step 4: Kiểm tra**

Run (từ `game-next/`): `grep -n "18 màn\|Mười tám\|từ Chương 3\|3-1 đến 3-6\|12 màn\|12 khung\|128 × 192" ../docs/gdd/master-gdd.md`
Expected: không in dòng nào.
Run: `grep -c "^| \*\*4-[1-6]\*\* |" ../docs/gdd/master-gdd.md` → `6`; `grep -c "^| \*\*3-[0-9]*\*\* |" ../docs/gdd/master-gdd.md` → `10`; `grep -c "Chương 3 — Họa Phẩm (10 màn)" ../docs/gdd/master-gdd.md` → `1`.
Run: `npm test` → xanh.

- [ ] **Step 5: CHANGELOG và commit**

```markdown
### 2026-10-02 - Update GDD for the four-chapter campaign

- `docs/gdd/master-gdd.md`: section 4 now describes four chapters (6 + 6 + 10 + 6 levels) and the 28-level release gate; rotation moves to chapter 4 everywhere (overview, rotation rules, HUD layout, level select).
- Added the parity (XOR) rule and layer table to section 1.2 and fixed the board size to 128 x 160.
- Appendix B adds the ten Hoa Pham levels, renames 2-5 to Dong Ho Cat and moves the rotation levels to a chapter 4 table as 4-1 to 4-6.
- Verification: grep finds no remaining "18 màn", "từ Chương 3" or "3-1 đến 3-6"; appendix B has 10 chapter-3 rows and 6 chapter-4 rows; `npm test` passes.
```

Message:

```text
docs(gdd): describe four-chapter campaign and parity rule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Co-authored-by: Codex <noreply@codex.local>
```

```bash
git add ../docs/gdd/master-gdd.md ../CHANGELOG.md
git commit -F <file chứa message>
```

---

## Nghiệm thu tiêu chí spec B mục 7 (không commit)

Từ cây làm việc sạch (`git status --short` rỗng), trong `game-next/`:

1. `npm run content:new -- 3-11 --from 1-2 --title "Bảo Tháp Thử"`
   Expected: `[new-level] Đã tạo src/content/sources/3-11.ts (hằng baoThapThu) …` và `Bước tiếp theo: npm run content:author -- 3-11`.
2. `npm run content:author -- 3-11`
   Expected: `PASS 3-11`; có `src/content/levels/3-11.json`, `../docs/testing/levels/3-11.svg`, `../docs/testing/levels/3-11-report.md` (báo cáo ghi `Số nghiệm: 1`). Không sửa tay file nào.
3. `npm run content:new -- 3-12` rồi `npm run content:author -- 3-12` (đường file mẫu): `PASS 3-12`.
4. `npm run typecheck && npm test && npm run content:validate` xanh khi hai màn thử còn đăng ký.
5. Xoá màn thử: `rm src/content/sources/3-11.ts src/content/sources/3-12.ts src/content/levels/3-11.json src/content/levels/3-12.json ../docs/testing/levels/3-11.svg ../docs/testing/levels/3-11-report.md ../docs/testing/levels/3-12.svg ../docs/testing/levels/3-12-report.md && git checkout -- src/content/sources/index.ts`; `git status --short` rỗng.
6. Lệnh đúng nguyên văn spec (`npm run content:new -- 3-11 --from 3-4`) cần nguồn 3-4: chạy lại bước 1–2 và 5 với `--from 3-4` ở cuối plan C.

## Kết thúc plan B

`npm run typecheck && npm test && npm run content:validate && npm run build` xanh; bảy commit mới trên `feat/level-kit-chapters`; ba ảnh bản đồ và 15 ảnh bảng hình đã commit; `content:validate -- --release` báo cần 28 màn. Báo người review kèm ảnh `level-select-hoa-pham.png` và các quyết định ngoài spec (đặc biệt: mã lỗi mới `chapter-rotation-required`, HUD chỉ hiện nút Xoay ở Chương 4, bảng Họa Phẩm trong GDD đã viết sẵn cho plan C).

## Tự rà soát: yêu cầu spec → task

| Yêu cầu spec B | Task / bước |
|---|---|
| KIT-01 lệnh `content:new`: từ chối id có ở `sources/`/`studio/`; `--from` tìm `sources/` rồi `studio/`; đổi `id`, `order`, tên hằng, `contentRevision` = `<slug>-v1`; không `--from` dùng `_template.ts`; ghi file và đăng ký `index.ts` theo thứ tự id; in đường dẫn và lệnh tiếp theo; không sửa manifest/catalog | Task 3 Step 4–5 (`createNewLevel`, `registerInSourceIndex`, CLI), test Step 1, thử Step 8 |
| KIT-02 `_template.ts` hợp lệ tối thiểu (vuông 48 giữa bàn), comment tiếng Việt từng trường, không đăng ký | Task 3 Step 3, test `_template.ts` |
| Mục 3 `piece`, `mirrorX`, `mirrorY`, `concentric`, `row`, hằng `NUDGE`/`CROSS` (hàng `decoys(offsets)` của spec), lỗi tiếng Việt khi lệch lưới/khung sai (`isValidFrame`) | Task 1 |
| KIT-03 bỏ neo nhiễu vượt biên / trùng neo A của mảnh giống hệt, do `buildLevelDocument` áp dụng, liệt kê trong báo cáo | Task 2 |
| Mục 4.1 bảng hình có ảnh từng hướng sinh từ `renderPreviewSvg` | Task 6 Step 3–4 (`content:gallery`, 15 ảnh) |
| Mục 4.2 lưới, ô hiển thị, module, công thức tâm ↔ gốc | Task 6 Step 4, mục 2 tài liệu |
| Mục 4.3 luật chẵn lẻ và bảng số lớp | Task 6 Step 4, mục 3 tài liệu |
| Mục 4.4 quy trình `content:new` → … → `approved` | Task 6 Step 4, mục 4 tài liệu |
| Mục 4.5 ba màn mẫu chú thích từng dòng (1-2, 2-3, 3-10) | Task 6 Step 4 mục 5, Step 6 kiểm 1-2 khớp nguồn |
| Mục 4.6 mẹo tăng độ khó (neo gần, giấu cạnh, đặt tự do) | Task 6 Step 4, mục 6 tài liệu |
| CH-01 `chapter: 1|2|3|4` ở `ManifestEntry`, `LevelDocument`, `Level`; xoay chỉ chương 4; giữ mã `chapter-rotation-disabled` | Task 4 Step 3–5 |
| CH-02 manifest 28 màn, `order` 1–28, 2-5 Đồng Hồ Cát, Họa Phẩm 3-1 → 3-10, chương xoay 4-1 → 4-6 giữ tên, chưa có dữ liệu là `planned` | Task 4 Step 6, test Step 1(a)(b) |
| CH-03 bản đồ suy ra từ manifest, chòm sao Họa Phẩm 10 nút có mẫu toạ độ riêng, ảnh chụp 720 × 1280 không đè/tràn | Task 5 (test chồng lấn + ảnh Step 8) |
| CH-04 `--release` cần 28 màn `approved` | Task 4 Step 7, test `releaseGate`, Step 10 |
| CH-05 GDD: mục 4 có 4 chương; Phụ lục B thêm 10 màn Họa Phẩm, đổi mã chương xoay; ghi rõ luật chẵn lẻ | Task 7 |
| Mục 6 `kit.test.ts` (tâm → gốc, từ chối lệch lưới, `mirrorX` từng hướng đối chiếu tập ô, `concentric`, `row`) | Task 1 Step 1 |
| Mục 6 `newLevel.test.ts` trên thư mục tạm (đổi id/order/tên hằng/revision, từ chối id có sẵn, thứ tự `index.ts`) | Task 3 Step 1 |
| Mục 6 `authoring.test.ts` luật KIT-03 kèm ca 3-8 hai hình tròn | Task 2 Step 1 |
| Mục 6 `content.test.ts`, `catalog.test.ts`, `levelSelect.test.ts`: 28 màn, 4 chương, xoay chương 4, bản đồ 4 chòm sao | Task 4 Step 1, Task 5 Step 1 |
| Mục 7 clone + author không sửa tay, xoá màn thử; campaign 4 chòm sao; mọi kiểm tra xanh | Mục "Nghiệm thu" (dùng `--from 1-2`, lặp lại với `--from 3-4` sau plan C), Task 5 Step 8, "Kết thúc plan B" |

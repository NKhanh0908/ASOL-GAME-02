# Chương 1 — Giai đoạn 1/3: Hình học, công cụ authoring và 1-1 v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng module hình học dùng chung, công cụ sinh màn từ nguồn mô tả (JSON + SVG + báo cáo nghiệm), và đưa 1-1 qua đường ống mới thành `song-tinh-v2`.

**Architecture:** `domain/shapes.ts` là nguồn duy nhất của hình: đa giác chuẩn theo `shapeKind` + `orientation` + `frameSize`, raster hoá theo quy tắc ô biên trên-trái. `content/authoring.ts` biến nguồn `content/sources/<id>.ts` thành `LevelDocument`; `content/authoringReport.ts` duyệt nghiệm và vẽ SVG. `scripts/author-level.ts` là vỏ CLI mỏng ghi file. Validator kiểm thêm hướng và đối chiếu cells với hình.

**Tech Stack:** TypeScript (ESM, đuôi `.ts` trong import), Vitest, Node 24 `--experimental-strip-types` cho script.

**Spec:** `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`

**Giao được gì sau giai đoạn này:** `npm run content:author -- 1-1` sinh lại 1-1 từ nguồn, kèm `docs/testing/levels/1-1.svg` và `1-1-report.md`; validator từ chối cells lệch khỏi hình; 1-1 là `song-tinh-v2` đã được người review duyệt lại. Màn chơi trông y như trước (renderer chưa đổi).

## Vị trí trong loạt plan

- **Chạy trước:** không có. Nhánh làm việc: `feat/chapter-1-levels`.
- **Chạy tiếp theo:** `2026-10-02-chapter-1-levels-2-renderer.md`

Chỉ mục: `docs/superpowers/plans/2026-10-02-chapter-1-levels-index.md`

## Global Constraints

Áp dụng cho **mọi** task bên dưới:

- Thư mục làm việc: `game-next/`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó. Node `>=24.13.1 <25`.
- Import nội bộ **luôn kèm đuôi `.ts`**. Kiểu chỉ import bằng `import type` (bắt buộc để `node --experimental-strip-types` chạy được script).
- Script chạy bằng strip-types: **không** dùng `enum`, `namespace`, hay parameter property (`constructor(private x)`).
- Comment và chuỗi hiển thị viết **tiếng Việt** theo văn phong file hiện có; tên biến/hàm tiếng Anh.
- Lưới logic 128 × 160 (`GRID_WIDTH`, `GRID_HEIGHT` trong `src/domain/model.ts`). 1 ô hiển thị = 8 ô logic; 1 module = 24 ô logic.
- Mọi mảnh Chương 1: `frameSize = 48`, màu `amber`. Neo là **gốc khung** (góc trên-trái), toạ độ là bội của 8.
- Quy tắc ô biên (mọi hình, kể cả thoi): ô `(x, y)` thuộc hình khi tâm `(x+0.5, y+0.5)` nằm trong đa giác; tâm nằm đúng trên cạnh thì chỉ tính khi pháp tuyến hướng vào trong của cạnh có `nx > 0`, hoặc `nx = 0` và `ny > 0`.
- Không thêm dependency mới.
- Không bao giờ tự đặt `status: 'approved'` cho một màn khi người review chưa đồng ý rõ ràng trong cuộc trò chuyện.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục vào đầu phần `## Unreleased` của `CHANGELOG.md` (ở gốc repo) theo mẫu: `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, các gạch đầu dòng mô tả thay đổi kèm file, dòng cuối `- Verification: <lệnh đã chạy và kết quả>`.
- Commit message tiếng Anh dạng `type(scope): summary`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Trên Windows dùng `git commit -F <file>` nếu message nhiều dòng.

---

### Task 1: Module hình học `domain/shapes.ts`

**Files:**
- Modify: `game-next/src/domain/model.ts` (thêm hai kiểu sau dòng `export type Turns = 0 | 1 | 2 | 3;`)
- Create: `game-next/src/domain/shapes.ts`
- Test: `game-next/tests/shapes.test.ts`

**Interfaces:**
- Consumes: `Cell` từ `src/domain/model.ts`; `rotateCells(cells, frameSize, turns)` từ `src/domain/geometry.ts` (chỉ trong test).
- Produces:
  - `type ShapeKind = 'square' | 'triangle' | 'diamond'` và `type Orientation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7` (trong `model.ts`).
  - `type Vertex = Readonly<{ x: number; y: number }>`
  - `isValidOrientation(kind: ShapeKind, orientation: number): orientation is Orientation`
  - `shapePolygon(kind: ShapeKind, orientation: Orientation, frameSize: number): Vertex[]`
  - `effectiveOrientation(kind: ShapeKind, orientation: Orientation, turns: number): Orientation`
  - `rasterize(polygon: readonly Vertex[], frameSize: number): Cell[]`
  - `shapeCells(kind: ShapeKind, orientation: Orientation, frameSize: number): Cell[]`

- [ ] **Step 1: Thêm hai kiểu vào `model.ts`**

Ngay sau dòng `export type Turns = 0 | 1 | 2 | 3;` thêm:

```ts
export type ShapeKind = 'square' | 'triangle' | 'diamond';
/**
 * Hướng tam giác vuông cân: 0–3 là góc vuông ở góc khung TL/TR/BR/BL,
 * 4–7 là mái có cạnh huyền nằm ở đáy/trái/đỉnh/phải khung. Vuông và thoi luôn 0.
 */
export type Orientation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

- [ ] **Step 2: Viết test thất bại**

Tạo `game-next/tests/shapes.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  effectiveOrientation,
  isValidOrientation,
  shapeCells,
  shapePolygon,
} from '../src/domain/shapes.ts';
import type { Vertex } from '../src/domain/shapes.ts';
import { rotateCells } from '../src/domain/geometry.ts';
import type { Cell, Orientation } from '../src/domain/model.ts';

const S = 48;
const key = ([x, y]: Cell): string => `${x},${y}`;

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

function placed(cells: Cell[], ox: number, oy: number): Set<string> {
  return new Set(cells.map(([x, y]) => `${ox + x},${oy + y}`));
}

describe('shapePolygon theo bảng đỉnh của spec', () => {
  test('vuông và thoi', () => {
    expect(shapePolygon('square', 0, S)).toEqual([
      { x: 0, y: 0 },
      { x: 48, y: 0 },
      { x: 48, y: 48 },
      { x: 0, y: 48 },
    ]);
    expect(shapePolygon('diamond', 0, S)).toEqual([
      { x: 24, y: 0 },
      { x: 48, y: 24 },
      { x: 24, y: 48 },
      { x: 0, y: 24 },
    ]);
  });

  test('tam giác góc BL và mái hướng 4', () => {
    expect(shapePolygon('triangle', 3, S)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 48 },
      { x: 48, y: 48 },
    ]);
    expect(shapePolygon('triangle', 4, S)).toEqual([
      { x: 0, y: 48 },
      { x: 48, y: 48 },
      { x: 24, y: 24 },
    ]);
  });
});

describe('rasterize theo quy tắc ô biên trên-trái', () => {
  test('số ô từng hình ở khung 48', () => {
    expect(shapeCells('square', 0, S)).toHaveLength(2304);
    expect(shapeCells('diamond', 0, S)).toHaveLength(1152);
    const triangleCounts = ([0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]).map(
      (o) => shapeCells('triangle', o, S).length
    );
    expect(triangleCounts).toEqual([1128, 1176, 1176, 1128, 576, 552, 576, 600]);
  });

  test('mọi ô nằm trong khung', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      for (const [x, y] of shapeCells('triangle', o, S)) {
        expect(x >= 0 && x < S && y >= 0 && y < S).toBe(true);
      }
    }
  });

  test('hai tam giác bù nhau lát kín khung, không trùng ô', () => {
    for (const [a, b] of [
      [0, 2],
      [1, 3],
    ] as Array<[Orientation, Orientation]>) {
      const first = new Set(shapeCells('triangle', a, S).map(key));
      const second = shapeCells('triangle', b, S).map(key);
      expect(second.filter((k) => first.has(k))).toHaveLength(0);
      expect(first.size + second.length).toBe(S * S);
    }
  });

  test('thoi và hai cánh của 1-6 chung cạnh nhưng không chung ô', () => {
    const w1 = placed(shapeCells('triangle', 3, S), 16, 56);
    const w2 = placed(shapeCells('triangle', 2, S), 64, 56);
    const d1 = placed(shapeCells('diamond', 0, S), 40, 56);
    for (const k of d1) {
      expect(w1.has(k)).toBe(false);
      expect(w2.has(k)).toBe(false);
    }
  });
});

describe('xoay', () => {
  test('effectiveOrientation quay vòng trong cùng họ', () => {
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 0, t))).toEqual([0, 1, 2, 3]);
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 3, t))).toEqual([3, 0, 1, 2]);
    expect([0, 1, 2, 3].map((t) => effectiveOrientation('triangle', 6, t))).toEqual([6, 7, 4, 5]);
    expect(effectiveOrientation('diamond', 0, 3)).toBe(0);
    expect(effectiveOrientation('square', 0, 1)).toBe(0);
  });

  test('rotateCells và raster hướng hiệu dụng chỉ khác ở ô có tâm nằm trên viền', () => {
    for (const o of [0, 1, 2, 3, 4, 5, 6, 7] as Orientation[]) {
      for (const t of [1, 2, 3]) {
        const rotated = new Set(rotateCells(shapeCells('triangle', o, S), S, t).map(key));
        const eff = effectiveOrientation('triangle', o, t);
        const direct = new Set(shapeCells('triangle', eff, S).map(key));
        const polygon = shapePolygon('triangle', eff, S);
        const diff = [
          ...[...rotated].filter((k) => !direct.has(k)),
          ...[...direct].filter((k) => !rotated.has(k)),
        ];
        expect(diff.length).toBeLessThanOrEqual(S);
        for (const k of diff) {
          const [x, y] = k.split(',').map(Number);
          expect(onOutline(polygon, x + 0.5, y + 0.5)).toBe(true);
        }
      }
    }
  });
});

describe('isValidOrientation', () => {
  test('tam giác nhận 0–7, vuông và thoi chỉ nhận 0', () => {
    expect(isValidOrientation('triangle', 7)).toBe(true);
    expect(isValidOrientation('triangle', 8)).toBe(false);
    expect(isValidOrientation('triangle', 1.5)).toBe(false);
    expect(isValidOrientation('square', 0)).toBe(true);
    expect(isValidOrientation('square', 1)).toBe(false);
    expect(isValidOrientation('diamond', 2)).toBe(false);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/shapes.test.ts`
Expected: FAIL — `Failed to resolve import "../src/domain/shapes.ts"`.

- [ ] **Step 4: Viết `shapes.ts`**

Tạo `game-next/src/domain/shapes.ts`:

```ts
import type { Cell, Orientation, ShapeKind } from './model.ts';

/** Một đỉnh đa giác theo toạ độ khung mảnh (gốc trên-trái), đơn vị ô logic. */
export type Vertex = Readonly<{ x: number; y: number }>;

function v(x: number, y: number): Vertex {
  return { x, y };
}

export function isValidOrientation(kind: ShapeKind, orientation: number): orientation is Orientation {
  if (!Number.isInteger(orientation)) return false;
  if (kind === 'triangle') return orientation >= 0 && orientation <= 7;
  return orientation === 0;
}

/**
 * Đa giác chuẩn của một hình trong khung frameSize × frameSize.
 *
 * Đây là nguồn duy nhất cho cells, renderer và ảnh xem trước: cells raster hoá
 * từ chính đa giác này nên không thể lệch khỏi hình vẽ (LVL-02).
 */
export function shapePolygon(kind: ShapeKind, orientation: Orientation, frameSize: number): Vertex[] {
  const s = frameSize;
  const h = frameSize / 2;
  if (kind === 'square') return [v(0, 0), v(s, 0), v(s, s), v(0, s)];
  if (kind === 'diamond') return [v(h, 0), v(s, h), v(h, s), v(0, h)];
  switch (orientation) {
    case 0:
      return [v(0, 0), v(s, 0), v(0, s)];
    case 1:
      return [v(0, 0), v(s, 0), v(s, s)];
    case 2:
      return [v(s, 0), v(s, s), v(0, s)];
    case 3:
      return [v(0, 0), v(0, s), v(s, s)];
    case 4:
      return [v(0, s), v(s, s), v(h, h)];
    case 5:
      return [v(0, 0), v(0, s), v(h, h)];
    case 6:
      return [v(0, 0), v(s, 0), v(h, h)];
    case 7:
      return [v(s, 0), v(s, s), v(h, h)];
  }
}

/**
 * Hướng sau khi xoay `turns` nấc 90° theo chiều kim đồng hồ.
 * Góc quay vòng 0→1→2→3, mái quay vòng 4→5→6→7. Vuông và thoi không đổi.
 */
export function effectiveOrientation(
  kind: ShapeKind,
  orientation: Orientation,
  turns: number
): Orientation {
  if (kind !== 'triangle') return 0;
  const family = orientation < 4 ? 0 : 4;
  const step = (((orientation % 4) + turns) % 4 + 4) % 4;
  return (family + step) as Orientation;
}

type Edge = { ax: number; ay: number; nx: number; ny: number; inclusive: boolean };

/** Các cạnh kèm pháp tuyến hướng vào trong; đa giác lồi nên lấy trọng tâm đỉnh làm mốc. */
function edgesOf(polygon: readonly Vertex[]): Edge[] {
  const n = polygon.length;
  const cx = polygon.reduce((sum, p) => sum + p.x, 0) / n;
  const cy = polygon.reduce((sum, p) => sum + p.y, 0) / n;
  return polygon.map((a, i) => {
    const b = polygon[(i + 1) % n];
    let nx = -(b.y - a.y);
    let ny = b.x - a.x;
    if (nx * (cx - a.x) + ny * (cy - a.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    // Quy tắc trên-trái: chỉ cạnh trái (phần trong ở bên phải) và cạnh trên
    // nằm ngang (phần trong ở bên dưới) giữ ô có tâm nằm đúng trên cạnh.
    return { ax: a.x, ay: a.y, nx, ny, inclusive: nx > 0 || (nx === 0 && ny > 0) };
  });
}

/**
 * Raster hoá đa giác lồi: lấy ô có tâm nằm trong đa giác. Hai hình chung một
 * đoạn cạnh luôn có pháp tuyến ngược chiều nên đúng một bên giữ hàng ô trên
 * cạnh đó: không trùng ô, không hở khe.
 */
export function rasterize(polygon: readonly Vertex[], frameSize: number): Cell[] {
  const edges = edgesOf(polygon);
  const cells: Cell[] = [];
  for (let y = 0; y < frameSize; y++) {
    for (let x = 0; x < frameSize; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let inside = true;
      for (const e of edges) {
        const d = e.nx * (px - e.ax) + e.ny * (py - e.ay);
        if (d < 0 || (d === 0 && !e.inclusive)) {
          inside = false;
          break;
        }
      }
      if (inside) cells.push([x, y]);
    }
  }
  return cells;
}

export function shapeCells(kind: ShapeKind, orientation: Orientation, frameSize: number): Cell[] {
  return rasterize(shapePolygon(kind, orientation, frameSize), frameSize);
}
```

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/shapes.test.ts`
Expected: PASS (9 test).

- [ ] **Step 6: Typecheck và toàn bộ test**

Run: `npm run typecheck && npm test`
Expected: không lỗi; toàn bộ test xanh (141 test cũ + 9 test mới).

- [ ] **Step 7: CHANGELOG và commit**

Thêm mục `### 2026-10-02 - Add shared shape module` vào `CHANGELOG.md` (mô tả `src/domain/shapes.ts`, hai kiểu mới trong `model.ts`, `tests/shapes.test.ts`; Verification: typecheck + `npm test`).

```bash
git add src/domain/model.ts src/domain/shapes.ts tests/shapes.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

Message: `feat(domain): add shared shape module with top-left raster rule` + dòng Co-Authored-By.

---

### Task 2: Builder từ nguồn mô tả, 1-1 thành `song-tinh-v2`

**Files:**
- Modify: `game-next/src/content/document.ts` (thêm `orientation?` vào mảnh)
- Create: `game-next/src/content/authoring.ts`
- Create: `game-next/src/content/sources/1-1.ts`
- Create: `game-next/src/content/sources/index.ts`
- Create: `game-next/scripts/author-level.ts`
- Modify: `game-next/package.json` (thêm script `content:author`)
- Modify: `game-next/src/content/manifest.ts:4` (revision 1-1)
- Modify: `game-next/src/content/levels/1-1.json` (sinh lại bằng script, không sửa tay)
- Modify: `docs/testing/mirror-rebuild/1-1-content-review.md` (thêm phần duyệt v2, chỉ sau khi người review đồng ý)
- Delete: `game-next/scripts/regen-level-geometry.ts`
- Test: `game-next/tests/authoring.test.ts`

**Interfaces:**
- Consumes: `shapeCells` (Task 1), `rotateCells` từ `src/domain/geometry.ts`, `validateLevel` từ `src/content/validate.ts`, `LevelDocument` từ `src/content/document.ts`.
- Produces:
  - `ANCHOR_STEP = 8`
  - `type PieceSource = { id: string; shapeKind: ShapeKind; orientation: Orientation; frameSize: number; anchors: Array<{ id: string; x: number; y: number }> }`
  - `type LevelSource = Omit<LevelDocument, 'schemaVersion' | 'board' | 'pieces' | 'targetCells'> & { pieces: PieceSource[] }`
  - `checkSourceGeometry(source: LevelSource): string[]`
  - `buildLevelDocument(source: LevelSource): LevelDocument` — ném `Error` có message bắt đầu `authoring:<id>` khi hình học sai.
  - `serializeLevelDocument(doc: LevelDocument): string`
  - `LEVEL_SOURCES: Readonly<Record<string, LevelSource>>` trong `src/content/sources/index.ts`
  - Lệnh `npm run content:author -- <id...> | --all`

- [ ] **Step 1: Thêm `orientation` vào schema tài liệu**

Trong `game-next/src/content/document.ts`, sửa dòng import đầu file thành:

```ts
import type { Cell, Level, Orientation, Turns } from '../domain/model.ts';
```

và trong kiểu `pieces` của `LevelDocument`, ngay sau dòng `shapeKind: 'square' | 'triangle' | 'diamond';` thêm:

```ts
    /** Bắt buộc với tam giác (0–7); vuông và thoi bỏ trống hoặc 0 */
    orientation?: Orientation;
```

- [ ] **Step 2: Viết test thất bại**

Tạo `game-next/tests/authoring.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import rawSongTinh from '../src/content/levels/1-1.json';
import { buildLevelDocument, checkSourceGeometry } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

const songTinh = LEVEL_SOURCES['1-1'];

function cloneSource(source: LevelSource): LevelSource {
  return structuredClone(source);
}

describe('buildLevelDocument', () => {
  test('tạo lại 1-1 cho đúng file đã commit', () => {
    expect(buildLevelDocument(songTinh)).toEqual(rawSongTinh);
  });

  test('1-1 v2: mỗi thoi 1.152 ô, mục tiêu 2.304 ô, qua validator', () => {
    const doc = buildLevelDocument(songTinh);
    expect(doc.contentRevision).toBe('song-tinh-v2');
    expect(doc.pieces.map((p) => p.cells.length)).toEqual([1152, 1152]);
    expect(doc.targetCells).toHaveLength(2304);
    expect(validateLevel(doc).ok).toBe(true);
  });

  test('targetCells sắp theo y rồi x, không trùng', () => {
    const cells = buildLevelDocument(songTinh).targetCells;
    for (let i = 1; i < cells.length; i++) {
      const [px, py] = cells[i - 1];
      const [x, y] = cells[i];
      expect(y > py || (y === py && x > px)).toBe(true);
    }
  });

  test('tam giác ghi orientation, vuông và thoi thì không', () => {
    const source: LevelSource = {
      ...cloneSource(songTinh),
      pieces: [
        { id: 'T1', shapeKind: 'triangle', orientation: 2, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }] },
        { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'T1', anchorId: 'A', turns: 0 },
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    const doc = buildLevelDocument(source);
    expect(doc.pieces[0].orientation).toBe(2);
    expect('orientation' in doc.pieces[1]).toBe(false);
  });

  test('từ chối neo không phải bội của 8', () => {
    const bad = cloneSource(songTinh);
    bad.pieces[0].anchors[0].x = 17;
    expect(checkSourceGeometry(bad)).toHaveLength(1);
    expect(() => buildLevelDocument(bad)).toThrow(/bội của 8/);
  });

  test('từ chối khung vượt biên bàn', () => {
    const bad = cloneSource(songTinh);
    bad.pieces[1].anchors[0].x = 88;
    expect(() => buildLevelDocument(bad)).toThrow(/vượt biên/);
  });

  test('từ chối nghiệm trỏ tới neo không tồn tại', () => {
    const bad = cloneSource(songTinh);
    bad.sampleSolutions[0][0].anchorId = 'Z';
    expect(() => buildLevelDocument(bad)).toThrow(/không tồn tại/);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/authoring.test.ts`
Expected: FAIL — `Failed to resolve import "../src/content/authoring.ts"`.

- [ ] **Step 4: Viết `authoring.ts`**

Tạo `game-next/src/content/authoring.ts`:

```ts
import type { Cell, Orientation, ShapeKind } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { rotateCells } from '../domain/geometry.ts';
import { shapeCells } from '../domain/shapes.ts';
import type { LevelDocument } from './document.ts';

/** Neo phải rơi vào giao điểm lưới hiển thị: 1 ô hiển thị = 8 ô logic. */
export const ANCHOR_STEP = 8;

export type PieceSource = {
  id: string;
  shapeKind: ShapeKind;
  orientation: Orientation;
  frameSize: number;
  anchors: Array<{ id: string; x: number; y: number }>;
};

/**
 * Nguồn mô tả một màn: mọi thứ của LevelDocument trừ những phần được sinh ra
 * (cells của mảnh, targetCells, board, schemaVersion). Cells và target không
 * bao giờ gõ tay.
 */
export type LevelSource = Omit<LevelDocument, 'schemaVersion' | 'board' | 'pieces' | 'targetCells'> & {
  pieces: PieceSource[];
};

export function checkSourceGeometry(source: LevelSource): string[] {
  const problems: string[] = [];
  for (const piece of source.pieces) {
    for (const anchor of piece.anchors) {
      const label = `${piece.id}.${anchor.id} tại (${anchor.x}, ${anchor.y})`;
      if (anchor.x % ANCHOR_STEP !== 0 || anchor.y % ANCHOR_STEP !== 0) {
        problems.push(`${label}: neo không phải bội của ${ANCHOR_STEP}`);
      }
      if (
        anchor.x < 0 ||
        anchor.y < 0 ||
        anchor.x + piece.frameSize > GRID_WIDTH ||
        anchor.y + piece.frameSize > GRID_HEIGHT
      ) {
        problems.push(`${label}: khung mảnh vượt biên bàn`);
      }
    }
  }
  return problems;
}

export function buildLevelDocument(source: LevelSource): LevelDocument {
  const problems = checkSourceGeometry(source);
  if (problems.length > 0) {
    throw new Error(`authoring:${source.id}\n${problems.join('\n')}`);
  }

  const pieces: LevelDocument['pieces'] = source.pieces.map((p) => ({
    id: p.id,
    shapeKind: p.shapeKind,
    ...(p.shapeKind === 'triangle' ? { orientation: p.orientation } : {}),
    frameSize: p.frameSize,
    cells: shapeCells(p.shapeKind, p.orientation, p.frameSize),
    anchors: p.anchors.map((a) => ({ id: a.id, x: a.x, y: a.y })),
    color: 'amber' as const,
  }));

  // Target = mask chẵn/lẻ của nghiệm mẫu thứ nhất. Validator sẽ tính lại từ
  // nghiệm và so với target đã lưu (LVL-03).
  const mask = new Uint8Array(TOTAL_CELLS);
  for (const step of source.sampleSolutions[0] ?? []) {
    const piece = pieces.find((p) => p.id === step.pieceId);
    const anchor = piece?.anchors.find((a) => a.id === step.anchorId);
    if (!piece || !anchor) {
      throw new Error(
        `authoring:${source.id}\nnghiệm mẫu trỏ tới ${step.pieceId}.${step.anchorId} không tồn tại`
      );
    }
    for (const [cx, cy] of rotateCells(piece.cells, piece.frameSize, step.turns)) {
      mask[(anchor.y + cy) * GRID_WIDTH + anchor.x + cx] ^= 1;
    }
  }
  const targetCells: Cell[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (mask[i]) targetCells.push([i % GRID_WIDTH, Math.floor(i / GRID_WIDTH)]);
  }

  // Thứ tự khoá giữ đúng thứ tự trong file JSON hiện có để diff dễ đọc.
  const doc: LevelDocument = {
    schemaVersion: 1,
    id: source.id,
    title: source.title,
    chapter: source.chapter,
    order: source.order,
    contentRevision: source.contentRevision,
    board: { width: GRID_WIDTH, height: GRID_HEIGHT },
    rotationEnabled: source.rotationEnabled,
    pieces,
    targetCells,
    sampleSolutions: source.sampleSolutions,
    learningObjective: source.learningObjective,
    difficultyEstimate: source.difficultyEstimate,
    distractors: source.distractors,
    ftueSteps: source.ftueSteps,
  };
  if (source.victoryVerse !== undefined) {
    doc.victoryVerse = source.victoryVerse;
  }
  return doc;
}

export function serializeLevelDocument(doc: LevelDocument): string {
  return JSON.stringify(doc, null, 2) + '\n';
}
```

- [ ] **Step 5: Viết nguồn 1-1 và bảng nguồn**

Tạo `game-next/src/content/sources/1-1.ts` (mảnh, neo, nghiệm và metadata giữ nguyên `song-tinh-v1`; chỉ revision đổi):

```ts
import type { LevelSource } from '../authoring.ts';

/** 1-1 Song Tinh: hai thoi chạm đỉnh tại tâm bàn (64, 80). */
export const songTinh: LevelSource = {
  id: '1-1',
  title: 'Song Tinh',
  chapter: 1,
  order: 1,
  contentRevision: 'song-tinh-v2',
  rotationEnabled: false,
  pieces: [
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 16, y: 72 },
      ],
    },
    {
      id: 'D2',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 56 },
        { id: 'B', x: 64, y: 72 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Kéo hai mảnh tiếp giáp đỉnh, không xếp chồng',
  difficultyEstimate: 1,
  distractors: [
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch trục ngang' },
    { pieceId: 'D2', anchorId: 'B', reason: 'Lệch trục ngang' },
  ],
  ftueSteps: [
    { id: 'drag-first', trigger: 'idle', end: 'drag-start', text: 'Kéo mảnh vào bóng mục tiêu' },
  ],
  victoryVerse: 'Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.',
};
```

Trước khi đi tiếp, so metadata với file cũ: `node -e "const d=require('./src/content/levels/1-1.json');console.log(JSON.stringify({lo:d.learningObjective,v:d.victoryVerse,diff:d.difficultyEstimate,dis:d.distractors,f:d.ftueSteps}))"` — mọi chuỗi phải giống hệt nguồn ở trên.

Tạo `game-next/src/content/sources/index.ts`:

```ts
import type { LevelSource } from '../authoring.ts';
import { songTinh } from './1-1.ts';

/** Mọi màn có nguồn mô tả. Thêm màn mới: tạo file nguồn rồi đăng ký ở đây. */
export const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {
  '1-1': songTinh,
};
```

- [ ] **Step 6: Viết CLI `author-level.ts`**

Tạo `game-next/scripts/author-level.ts`:

```ts
/**
 * Sinh dữ liệu màn từ nguồn mô tả trong src/content/sources/.
 *
 *   npm run content:author -- 1-2
 *   npm run content:author -- --all
 *
 * Mỗi màn: dựng LevelDocument, chạy validator, ghi src/content/levels/<id>.json.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevelDocument, serializeLevelDocument } from '../src/content/authoring.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = resolve(HERE, '../src/content/levels');

function authorOne(id: string): boolean {
  const source = LEVEL_SOURCES[id];
  if (!source) {
    console.error(`[author-level] Không có nguồn cho màn ${id}`);
    return false;
  }

  let doc: LevelDocument;
  try {
    doc = buildLevelDocument(source);
  } catch (err) {
    console.error(`[author-level] FAIL ${(err as Error).message}`);
    return false;
  }

  const result = validateLevel(doc);
  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(`[author-level] FAIL ${issue.levelId} ${issue.field}: ${issue.code}`);
    }
    return false;
  }

  writeFileSync(resolve(LEVELS_DIR, `${id}.json`), serializeLevelDocument(doc), 'utf8');
  console.log(`[author-level] PASS ${id}: ${doc.targetCells.length} ô mục tiêu`);
  return true;
}

const args = process.argv.slice(2);
const ids = args.includes('--all') ? Object.keys(LEVEL_SOURCES) : args;
if (ids.length === 0) {
  console.error('Dùng: npm run content:author -- <id...> | --all');
  process.exit(1);
}
const results = ids.map((id) => authorOne(id));
process.exit(results.every(Boolean) ? 0 : 1);
```

Trong `game-next/package.json`, phần `scripts`, thêm ngay sau dòng `"content:validate": ...`:

```json
    "content:author": "node --experimental-strip-types scripts/author-level.ts",
```

- [ ] **Step 7: Chạy test, xác nhận chỉ test "đúng file đã commit" còn đỏ**

Run: `npx vitest run tests/authoring.test.ts`
Expected: 6 PASS, 1 FAIL ở `tạo lại 1-1 cho đúng file đã commit` (file JSON cũ vẫn là v1: 1.200 ô mỗi thoi, revision `song-tinh-v1`).

- [ ] **Step 8: Sinh lại 1-1 và đổi revision trong manifest**

Run: `npm run content:author -- 1-1`
Expected: `[author-level] PASS 1-1: 2304 ô mục tiêu`, exit 0.

Trong `game-next/src/content/manifest.ts` dòng 1-1, đổi `contentRevision: 'song-tinh-v1'` thành `contentRevision: 'song-tinh-v2'` (giữ nguyên `status: 'approved'` và `dataPath`).

Xoá script cũ: `git rm scripts/regen-level-geometry.ts`.

- [ ] **Step 9: Chạy toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: tất cả xanh; `content:validate` in `PASS: Level 1-1 (Song Tinh) validated.`

Kiểm tra diff chỉ chạm cells/target/revision: `git diff --stat src/content/levels/1-1.json` và `node -e "const a=require('./src/content/levels/1-1.json');console.log(a.contentRevision,a.pieces.map(p=>p.cells.length),a.targetCells.length,JSON.stringify(a.pieces.map(p=>p.anchors)))"` → `song-tinh-v2 [ 1152, 1152 ] 2304` và neo không đổi.

- [ ] **Step 10: CỔNG DUYỆT — dừng lại và hỏi người review**

**Không commit trước khi có câu trả lời.** Gửi người review đúng nội dung sau và chờ:

> 1-1 đã được sinh lại thành `song-tinh-v2` qua đường ống mới. Neo, nghiệm, chữ và câu thơ giữ nguyên. Thay đổi duy nhất: theo quy tắc ô biên chung, mỗi thoi bỏ hàng ô trên hai cạnh bên phải (1.200 → 1.152 ô), mục tiêu 2.400 → 2.304 ô. Hình vẽ không đổi vì renderer vẽ đa giác; chênh lệch là nửa ô (2,5px) dọc viền và chỉ ảnh hưởng mask. Bạn duyệt `song-tinh-v2` để 1-1 giữ `approved` không?

- Nếu **đồng ý**: sang Step 11.
- Nếu **không đồng ý**: chạy `git restore --staged --worktree src/content/levels/1-1.json src/content/manifest.ts scripts/regen-level-geometry.ts`, báo lại và dừng toàn bộ plan.

- [ ] **Step 11: Ghi biên bản duyệt v2**

Thêm vào cuối `docs/testing/mirror-rebuild/1-1-content-review.md`:

```markdown

## Duyệt lại `song-tinh-v2` — 2026-10-02

- Người duyệt: <tên người review như họ tự xưng trong cuộc trò chuyện>; ngày: <ngày duyệt>.
- Nguồn: `game-next/src/content/sources/1-1.ts`, sinh bằng `npm run content:author -- 1-1`.
- Thay đổi so với v1: quy tắc ô biên trên-trái chung cho mọi hình (spec 2026-10-02, D8). Mỗi thoi 1.200 → 1.152 ô; mục tiêu 2.400 → 2.304 ô. Neo, nghiệm, gây nhiễu, FTUE, câu thơ giữ nguyên.
- Kết quả: `npm test`, `npm run content:validate` đạt. Trạng thái giữ `approved`.
```

- [ ] **Step 12: CHANGELOG và commit**

Thêm mục `### 2026-10-02 - Author levels from source files; regenerate 1-1 as song-tinh-v2` (file: `authoring.ts`, `sources/`, `scripts/author-level.ts`, `package.json`, `manifest.ts`, `levels/1-1.json`, xoá `regen-level-geometry.ts`, biên bản duyệt; Verification).

```bash
git add src/content/document.ts src/content/authoring.ts src/content/sources scripts/author-level.ts package.json src/content/manifest.ts src/content/levels/1-1.json tests/authoring.test.ts ../docs/testing/mirror-rebuild/1-1-content-review.md ../CHANGELOG.md
git commit -F <file chứa message>
```

Message: `feat(content): author levels from source files, regenerate 1-1 as song-tinh-v2`.

---

### Task 3: Model và validator nhận hình, hướng và placement mục tiêu

**Files:**
- Modify: `game-next/src/domain/model.ts` (`Piece`, `Level`)
- Modify: `game-next/src/content/validate.ts`
- Modify: `game-next/src/content/fixtures.ts`
- Test: `game-next/tests/content.test.ts` (thêm một `describe` mới ở cuối file)

**Interfaces:**
- Consumes: `isValidOrientation`, `shapeCells` (Task 1); `buildLevelDocument`, `LevelSource` (Task 2).
- Produces:
  - `Piece.shapeKind?: ShapeKind`, `Piece.orientation?: Orientation` — validator luôn điền.
  - `Level.targetPlacements?: readonly Placement[]` — placement của nghiệm mẫu thứ nhất; validator luôn điền.
  - Mã lỗi mới: `invalid-shape-kind`, `invalid-orientation`, `shape-cells-mismatch`.
  - Fixture `fixture-adjacent-diamonds` theo quy tắc ô biên mới (mỗi thoi khung 40 có 800 ô).

- [ ] **Step 1: Viết test thất bại**

Thêm vào **cuối** `game-next/tests/content.test.ts` (các import mới đặt cùng nhóm import đầu file):

```ts
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
```

```ts
describe('Hình mảnh, hướng và placement mục tiêu (CH1-04)', () => {
  const triangleSource: LevelSource = {
    id: 'test-tri',
    title: 'Tam giác thử',
    chapter: 1,
    order: 1,
    contentRevision: 't1',
    rotationEnabled: false,
    pieces: [
      { id: 'T1', shapeKind: 'triangle', orientation: 2, frameSize: 48, anchors: [{ id: 'A', x: 40, y: 56 }] },
    ],
    sampleSolutions: [[{ pieceId: 'T1', anchorId: 'A', turns: 0 }]],
    learningObjective: 'thử',
    difficultyEstimate: 1,
    distractors: [],
    ftueSteps: [],
  };

  function codes(doc: unknown): string[] {
    const result = validateLevel(doc);
    return result.ok ? [] : result.issues.map((i) => i.code);
  }

  test('tam giác hợp lệ mang shapeKind, orientation và targetPlacements', () => {
    const result = validateLevel(buildLevelDocument(triangleSource));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.level.pieces[0].shapeKind).toBe('triangle');
      expect(result.level.pieces[0].orientation).toBe(2);
      expect(result.level.targetPlacements).toEqual([{ pieceId: 'T1', x: 40, y: 56, turns: 0 }]);
    }
  });

  test('tam giác thiếu orientation bị từ chối', () => {
    const doc = buildLevelDocument(triangleSource);
    delete doc.pieces[0].orientation;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('orientation ngoài 0–7 bị từ chối', () => {
    const doc = buildLevelDocument(triangleSource);
    (doc.pieces[0] as { orientation?: number }).orientation = 9;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('thoi có orientation khác 0 bị từ chối', () => {
    const doc = makeAdjacentFixture();
    doc.pieces[0].orientation = 3;
    expect(codes(doc)).toContain('invalid-orientation');
  });

  test('shapeKind lạ bị từ chối', () => {
    const doc = makeAdjacentFixture() as unknown as { pieces: Array<{ shapeKind: string }> };
    doc.pieces[0].shapeKind = 'hexagon';
    expect(codes(doc)).toContain('invalid-shape-kind');
  });

  test('cells sửa tay lệch khỏi hình bị từ chối', () => {
    const doc = makeAdjacentFixture();
    doc.pieces[0].cells = doc.pieces[0].cells.slice(1);
    expect(codes(doc)).toContain('shape-cells-mismatch');
  });

  test('fixture kỹ thuật theo quy tắc ô biên mới: 800 ô mỗi thoi, hợp lệ', () => {
    const doc = makeAdjacentFixture();
    expect(doc.pieces.map((p) => p.cells.length)).toEqual([800, 800]);
    expect(validateLevel(doc).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/content.test.ts`
Expected: FAIL ở các test mới (chưa có mã lỗi mới; `targetPlacements` undefined; fixture còn quy tắc cũ — 840 ô thay vì 800).

- [ ] **Step 3: Mở rộng `Piece` và `Level`**

Trong `game-next/src/domain/model.ts`, thay khai báo `Piece` và `Level` bằng:

```ts
export type Piece = Readonly<{
  id: string;
  frameSize: number;
  cells: readonly Cell[];
  anchors: readonly Anchor[];
  color: 'amber';
  /** Validator luôn điền; literal viết tay trong test domain có thể bỏ trống (renderer coi là thoi) */
  shapeKind?: ShapeKind;
  orientation?: Orientation;
}>;

export type Level = Readonly<{
  id: string;
  title: string;
  chapter: 1 | 2 | 3;
  contentRevision: string;
  rotationEnabled: boolean;
  pieces: readonly Piece[];
  targetMask: Uint8Array;
  /** Câu thơ hiện ở màn hoàn thành; màn nào không khai báo thì bỏ qua */
  victoryVerse?: string;
  /** Placement của nghiệm mẫu thứ nhất, để vẽ bóng mục tiêu bằng đa giác thật */
  targetPlacements?: readonly Placement[];
}>;
```

- [ ] **Step 4: Validator kiểm hình, hướng và cells**

Trong `game-next/src/content/validate.ts`:

(a) Sửa import đầu file thành:

```ts
import type { Cell, Level, Orientation, Piece, Placement, Turns } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { fitsBoard, rotateCells } from '../domain/geometry.ts';
import { evaluate, matchesTarget } from '../domain/mask.ts';
import { isValidOrientation, shapeCells } from '../domain/shapes.ts';
import type { LevelDocument, ValidationIssue, ValidationResult } from './document.ts';
```

(b) Thay khối kiểm cells hiện có (từ `if (!Array.isArray(p.cells) || p.cells.length === 0) {` đến hết vòng `for (const cell of p.cells)` và dấu `}` đóng nhánh `else`) bằng:

```ts
      let cellsValid = false;
      if (!Array.isArray(p.cells) || p.cells.length === 0) {
        issues.push({ levelId, field: `${pField}.cells`, code: 'empty-cells' });
      } else {
        cellsValid = true;
        for (const cell of p.cells) {
          if (
            !Array.isArray(cell) ||
            cell.length !== 2 ||
            !Number.isInteger(cell[0]) ||
            !Number.isInteger(cell[1]) ||
            cell[0] < 0 ||
            cell[0] >= p.frameSize ||
            cell[1] < 0 ||
            cell[1] >= p.frameSize
          ) {
            issues.push({ levelId, field: `${pField}.cells`, code: 'invalid-cell-coordinate' });
            cellsValid = false;
            break;
          }
        }
      }

      // Hình và hướng: cells phải đúng bằng raster của đa giác chuẩn (LVL-02)
      const orientation = (p.orientation ?? 0) as Orientation;
      const shapeKindValid =
        p.shapeKind === 'square' || p.shapeKind === 'triangle' || p.shapeKind === 'diamond';
      if (!shapeKindValid) {
        issues.push({ levelId, field: `${pField}.shapeKind`, code: 'invalid-shape-kind' });
      } else if (
        (p.shapeKind === 'triangle' && p.orientation === undefined) ||
        !isValidOrientation(p.shapeKind, orientation)
      ) {
        issues.push({ levelId, field: `${pField}.orientation`, code: 'invalid-orientation' });
      } else if (cellsValid && Number.isInteger(p.frameSize) && p.frameSize > 0) {
        const expected = new Set(
          shapeCells(p.shapeKind, orientation, p.frameSize).map(([x, y]) => `${x},${y}`)
        );
        const actual = new Set(p.cells.map(([x, y]) => `${x},${y}`));
        const same =
          actual.size === p.cells.length &&
          actual.size === expected.size &&
          [...actual].every((k) => expected.has(k));
        if (!same) {
          issues.push({ levelId, field: `${pField}.cells`, code: 'shape-cells-mismatch' });
        }
      }
```

(c) Trong khối `parsedPieces.push({...})`, thêm hai trường ngay sau `color: 'amber',`:

```ts
          shapeKind: p.shapeKind,
          orientation: (p.orientation ?? 0) as Orientation,
```

(d) Ngay trên dòng comment `// Sample solutions validation` (tức sau khi khối kiểm `targetCells` kết thúc, ở cấp thân hàm để khối `return` cuối hàm nhìn thấy) thêm:

```ts
  let firstPlacements: Placement[] | undefined;
```

(e) Trong vòng nghiệm, ngay sau khối `if (placements.length === solution.length) { try { ... } catch ... }` thêm:

```ts
      if (sIdx === 0 && placements.length === solution.length) {
        firstPlacements = placements;
      }
```

(f) Trong object `level` trả về ở cuối hàm, thêm sau `victoryVerse: doc.victoryVerse,`:

```ts
      targetPlacements: firstPlacements ?? [],
```

- [ ] **Step 5: Sinh lại fixture theo quy tắc mới**

Thay toàn bộ phần đầu hàm `makeAdjacentFixture` trong `game-next/src/content/fixtures.ts` (khai báo `diamondCells` và `targetCells` cùng hai vòng lặp) bằng:

```ts
  const diamondCells: Cell[] = [];
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 40; x++) {
      if (insideDiamond(x + 0.5, y + 0.5, 20, 20, 20)) {
        diamondCells.push([x, y]);
      }
    }
  }

  const targetCells: Cell[] = [];
  for (let wy = 0; wy < GRID_HEIGHT; wy++) {
    for (let wx = 0; wx < GRID_WIDTH; wx++) {
      const insideD1 = insideDiamond(wx + 0.5, wy + 0.5, 44, 96, 20);
      const insideD2 = insideDiamond(wx + 0.5, wy + 0.5, 84, 96, 20);
      if (insideD1 || insideD2) {
        targetCells.push([wx, wy]);
      }
    }
  }
```

và thêm hàm này ngay trên `export function makeAdjacentFixture`:

```ts
/**
 * Thoi tâm (cx, cy), nửa đường chéo r, theo quy tắc ô biên trên-trái của
 * shapes.ts: giữ ô có tâm trên hai cạnh bên trái, bỏ hai cạnh bên phải. Viết
 * bằng bất đẳng thức riêng để target không phụ thuộc evaluator hay rasterize.
 */
function insideDiamond(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const u = px - cx;
  const v = py - cy;
  return -u - v <= r && u - v < r && u + v < r && v - u <= r;
}
```

- [ ] **Step 6: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/content.test.ts`
Expected: PASS toàn bộ, gồm 7 test mới.

- [ ] **Step 7: Toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: tất cả xanh. Nếu `tests/harness.test.ts` hoặc test khác hỏng vì số ô của fixture, đọc lỗi: chúng phải không phụ thuộc số ô cụ thể; nếu có assertion số ô cứng (840) thì đổi thành 800 và ghi rõ trong commit.

- [ ] **Step 8: CHANGELOG và commit**

Mục `### 2026-10-02 - Validate piece shapes, orientations and target placements`. Message: `feat(content): validate shape kind, orientation and cells against shape polygons`.

```bash
git add src/domain/model.ts src/content/validate.ts src/content/fixtures.ts tests/content.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 4: Báo cáo nghiệm và ảnh xem trước SVG

**Files:**
- Create: `game-next/src/content/authoringReport.ts`
- Modify: `game-next/scripts/author-level.ts`
- Modify: `game-next/README.md` (thêm lệnh `content:author` vào danh sách lệnh)
- Create (sinh bằng script): `docs/testing/levels/1-1.svg`, `docs/testing/levels/1-1-report.md`
- Test: `game-next/tests/authoringReport.test.ts`

**Interfaces:**
- Consumes: `LevelDocument`; `shapePolygon` (Task 1); `buildLevelDocument`, `LEVEL_SOURCES` (Task 2).
- Produces:
  - `type SolutionReport = { solutionCount: number; fewerPieceSolutions: number; distractors: Array<{ pieceId: string; anchorId: string | null; reason: string; changedCells: number | null }> }`
  - `searchSolutions(doc: LevelDocument): SolutionReport` — duyệt mọi tổ hợp "mỗi mảnh ở một neo hoặc ở khay", `turns = 0` (Chương 1 không xoay; Chương 3 mở rộng sau).
  - `renderReportMarkdown(doc: LevelDocument, report: SolutionReport): string`
  - `renderPreviewSvg(doc: LevelDocument): string` — mỗi đa giác nghiệm có thuộc tính `data-piece="<id>"`, mỗi tư thế gây nhiễu có `stroke-dasharray`.
  - CLI ghi `docs/testing/levels/<id>.svg` và `<id>-report.md`, thoát mã 1 nếu `fewerPieceSolutions > 0`.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/authoringReport.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import {
  renderPreviewSvg,
  renderReportMarkdown,
  searchSolutions,
} from '../src/content/authoringReport.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';

const songTinh = buildLevelDocument(LEVEL_SOURCES['1-1']);

describe('searchSolutions', () => {
  test('1-1 có đúng một nghiệm, không nghiệm ít mảnh, mỗi neo B đổi 1.280 ô', () => {
    const report = searchSolutions(songTinh);
    expect(report.solutionCount).toBe(1);
    expect(report.fewerPieceSolutions).toBe(0);
    expect(report.distractors.map((d) => d.changedCells)).toEqual([1280, 1280]);
  });

  test('đếm được nghiệm thứ hai khi hai mảnh giống nhau đổi chỗ được', () => {
    const twins: LevelSource = {
      ...structuredClone(LEVEL_SOURCES['1-1']),
      id: 'test-twins',
      pieces: [
        { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }, { id: 'B', x: 64, y: 56 }] },
        { id: 'S2', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }, { id: 'B', x: 16, y: 56 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    expect(searchSolutions(buildLevelDocument(twins)).solutionCount).toBe(2);
  });

  test('báo nghiệm ít mảnh hơn khi có mảnh thừa không cần dùng', () => {
    // X1 không nằm trong nghiệm mẫu nên target chỉ gồm D1 + D2; nghiệm duy nhất để X1 ở khay
    const extra: LevelSource = {
      ...structuredClone(LEVEL_SOURCES['1-1']),
      id: 'test-extra',
      pieces: [
        ...structuredClone(LEVEL_SOURCES['1-1'].pieces),
        { id: 'X1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 40, y: 104 }] },
      ],
      distractors: [],
    };
    const report = searchSolutions(buildLevelDocument(extra));
    expect(report.solutionCount).toBe(1);
    expect(report.fewerPieceSolutions).toBe(1);
  });
});

describe('renderPreviewSvg và renderReportMarkdown', () => {
  test('SVG có đủ đa giác nghiệm và tư thế gây nhiễu', () => {
    const svg = renderPreviewSvg(songTinh);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('data-piece="D1"');
    expect(svg).toContain('data-piece="D2"');
    expect(svg.match(/stroke-dasharray/g)).toHaveLength(2);
    expect(svg).toContain('D1.A');
    expect(svg).toContain('D2.B');
  });

  test('báo cáo markdown ghi số nghiệm và số ô đổi của từng gây nhiễu', () => {
    const md = renderReportMarkdown(songTinh, searchSolutions(songTinh));
    expect(md).toContain('# 1-1 Song Tinh');
    expect(md).toContain('Số nghiệm: 1');
    expect(md).toContain('Nghiệm dùng ít mảnh hơn: 0');
    expect(md).toContain('| D1 | B | Lệch trục ngang | 1280 |');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/authoringReport.test.ts`
Expected: FAIL — không resolve được `../src/content/authoringReport.ts`.

- [ ] **Step 3: Viết `authoringReport.ts`**

Tạo `game-next/src/content/authoringReport.ts`:

```ts
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { shapePolygon } from '../domain/shapes.ts';
import type { LevelDocument } from './document.ts';

export type SolutionReport = {
  solutionCount: number;
  fewerPieceSolutions: number;
  distractors: Array<{
    pieceId: string;
    anchorId: string | null;
    reason: string;
    changedCells: number | null;
  }>;
};

function targetMaskOf(doc: LevelDocument): Uint8Array {
  const mask = new Uint8Array(TOTAL_CELLS);
  for (const [x, y] of doc.targetCells) mask[y * GRID_WIDTH + x] = 1;
  return mask;
}

/** choice[i] là chỉ số neo của mảnh i, hoặc -1 khi mảnh nằm ở khay. */
function maskFor(doc: LevelDocument, choice: readonly number[]): Uint8Array {
  const mask = new Uint8Array(TOTAL_CELLS);
  doc.pieces.forEach((piece, i) => {
    const anchorIndex = choice[i];
    if (anchorIndex < 0) return;
    const anchor = piece.anchors[anchorIndex];
    for (const [cx, cy] of piece.cells) {
      mask[(anchor.y + cy) * GRID_WIDTH + anchor.x + cx] ^= 1;
    }
  });
  return mask;
}

function diffCount(a: Uint8Array, b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
  return count;
}

/**
 * Duyệt mọi tổ hợp neo/khay của các mảnh (turns = 0). Với 2–4 mảnh và 1–3 neo
 * mỗi mảnh, số tổ hợp tối đa vài trăm nên duyệt hết là đủ nhanh.
 */
export function searchSolutions(doc: LevelDocument): SolutionReport {
  const target = targetMaskOf(doc);
  let combos: number[][] = [[]];
  for (const piece of doc.pieces) {
    const options = [-1, ...piece.anchors.map((_, i) => i)];
    combos = combos.flatMap((c) => options.map((o) => [...c, o]));
  }

  let solutionCount = 0;
  let fewerPieceSolutions = 0;
  for (const choice of combos) {
    if (diffCount(maskFor(doc, choice), target) === 0) {
      solutionCount++;
      if (choice.includes(-1)) fewerPieceSolutions++;
    }
  }

  const base = doc.pieces.map((piece) => {
    const step = doc.sampleSolutions[0]?.find((s) => s.pieceId === piece.id);
    return step ? piece.anchors.findIndex((a) => a.id === step.anchorId) : -1;
  });

  const distractors = doc.distractors.map((d) => {
    const pieceIndex = doc.pieces.findIndex((p) => p.id === d.pieceId);
    const anchorIndex =
      pieceIndex >= 0 && d.anchorId
        ? doc.pieces[pieceIndex].anchors.findIndex((a) => a.id === d.anchorId)
        : -1;
    if (pieceIndex < 0 || anchorIndex < 0) {
      return { pieceId: d.pieceId, anchorId: d.anchorId ?? null, reason: d.reason, changedCells: null };
    }
    const choice = base.slice();
    choice[pieceIndex] = anchorIndex;
    return {
      pieceId: d.pieceId,
      anchorId: d.anchorId ?? null,
      reason: d.reason,
      changedCells: diffCount(maskFor(doc, choice), target),
    };
  });

  return { solutionCount, fewerPieceSolutions, distractors };
}

export function renderReportMarkdown(doc: LevelDocument, report: SolutionReport): string {
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
    `Ảnh xem trước: \`${doc.id}.svg\`. Sinh bằng \`npm run content:author -- ${doc.id}\`; không sửa tay.`,
    '',
  ];
  return lines.join('\n');
}

const SCALE = 4;
const PIECE_COLORS = ['#FFC857', '#7EE0A1', '#FF8FA3', '#8FB8FF'];

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function polygonPoints(doc: LevelDocument, pieceIndex: number, ax: number, ay: number): string {
  const piece = doc.pieces[pieceIndex];
  return shapePolygon(piece.shapeKind, piece.orientation ?? 0, piece.frameSize)
    .map((v) => `${(ax + v.x) * SCALE},${(ay + v.y) * SCALE}`)
    .join(' ');
}

/** Đường bao mục tiêu: mỗi hàng ô là các đoạn chạy liền nhau. */
function targetPath(doc: LevelDocument): string {
  const mask = targetMaskOf(doc);
  const parts: string[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    let x = 0;
    while (x < GRID_WIDTH) {
      if (!mask[y * GRID_WIDTH + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < GRID_WIDTH && mask[y * GRID_WIDTH + x]) x++;
      parts.push(`M${start * SCALE} ${y * SCALE}h${(x - start) * SCALE}v${SCALE}h${-(x - start) * SCALE}z`);
    }
  }
  return parts.join('');
}

export function renderPreviewSvg(doc: LevelDocument): string {
  const w = GRID_WIDTH * SCALE;
  const h = GRID_HEIGHT * SCALE;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 40}" viewBox="0 0 ${w} ${h + 40}">`);
  out.push(`<rect width="${w}" height="${h + 40}" fill="#101a4f"/>`);

  // Lưới hiển thị (8 ô) và module (24 ô)
  for (let x = 0; x <= GRID_WIDTH; x += 8) {
    const color = x % 24 === 0 ? '#3b56b8' : '#22336f';
    out.push(`<line x1="${x * SCALE}" y1="0" x2="${x * SCALE}" y2="${h}" stroke="${color}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= GRID_HEIGHT; y += 8) {
    const color = y % 24 === 0 ? '#3b56b8' : '#22336f';
    out.push(`<line x1="0" y1="${y * SCALE}" x2="${w}" y2="${y * SCALE}" stroke="${color}" stroke-width="1"/>`);
  }

  out.push(`<path d="${targetPath(doc)}" fill="#BFE3FF" fill-opacity="0.35"/>`);

  // Nghiệm mẫu: mỗi mảnh một màu viền
  for (const step of doc.sampleSolutions[0] ?? []) {
    const index = doc.pieces.findIndex((p) => p.id === step.pieceId);
    const anchor = doc.pieces[index]?.anchors.find((a) => a.id === step.anchorId);
    if (index < 0 || !anchor) continue;
    out.push(
      `<polygon data-piece="${step.pieceId}" points="${polygonPoints(doc, index, anchor.x, anchor.y)}" fill="none" stroke="${PIECE_COLORS[index % PIECE_COLORS.length]}" stroke-width="3"/>`
    );
  }

  // Tư thế gây nhiễu: nét đứt cùng màu mảnh
  for (const d of doc.distractors) {
    const index = doc.pieces.findIndex((p) => p.id === d.pieceId);
    const anchor = doc.pieces[index]?.anchors.find((a) => a.id === d.anchorId);
    if (index < 0 || !anchor) continue;
    out.push(
      `<polygon points="${polygonPoints(doc, index, anchor.x, anchor.y)}" fill="none" stroke="${PIECE_COLORS[index % PIECE_COLORS.length]}" stroke-width="2" stroke-dasharray="8 6" stroke-opacity="0.8"/>`
    );
  }

  // Neo: chấm tại gốc khung, kèm nhãn
  doc.pieces.forEach((piece, index) => {
    for (const anchor of piece.anchors) {
      const cx = anchor.x * SCALE;
      const cy = anchor.y * SCALE;
      out.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${PIECE_COLORS[index % PIECE_COLORS.length]}"/>`);
      out.push(
        `<text x="${cx + 6}" y="${cy + 14}" fill="#DDF2FF" font-family="sans-serif" font-size="12">${escapeXml(`${piece.id}.${anchor.id}`)}</text>`
      );
    }
  });

  out.push(
    `<text x="8" y="${h + 26}" fill="#DDF2FF" font-family="sans-serif" font-size="16">${escapeXml(`${doc.id} · ${doc.title} · ${doc.contentRevision}`)}</text>`
  );
  out.push('</svg>');
  return out.join('\n') + '\n';
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/authoringReport.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: CLI ghi SVG và báo cáo**

Trong `game-next/scripts/author-level.ts`:

(a) Đổi dòng import `node:fs` thành `import { mkdirSync, writeFileSync } from 'node:fs';` và thêm import:

```ts
import { renderPreviewSvg, renderReportMarkdown, searchSolutions } from '../src/content/authoringReport.ts';
```

(b) Thêm hằng sau `LEVELS_DIR`:

```ts
const REPORT_DIR = resolve(HERE, '../../docs/testing/levels');
```

(c) Thay hai dòng cuối của `authorOne` (`writeFileSync(...)` và `console.log(...)`, trước `return true;`) bằng:

```ts
  const report = searchSolutions(doc);
  writeFileSync(resolve(LEVELS_DIR, `${id}.json`), serializeLevelDocument(doc), 'utf8');
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(resolve(REPORT_DIR, `${id}.svg`), renderPreviewSvg(doc), 'utf8');
  writeFileSync(resolve(REPORT_DIR, `${id}-report.md`), renderReportMarkdown(doc, report), 'utf8');

  console.log(
    `[author-level] ${id}: ${doc.targetCells.length} ô mục tiêu, ${report.solutionCount} nghiệm, ` +
      `${report.fewerPieceSolutions} nghiệm ít mảnh hơn`
  );
  if (report.fewerPieceSolutions > 0) {
    console.error(`[author-level] FAIL ${id}: có nghiệm dùng ít mảnh hơn dự định`);
    return false;
  }
  console.log(`[author-level] PASS ${id}`);
```

Cập nhật comment đầu file: thêm dòng `Ghi thêm docs/testing/levels/<id>.svg và <id>-report.md; thất bại nếu có nghiệm dùng ít mảnh hơn.`

- [ ] **Step 6: Chạy CLI cho 1-1 và xem kết quả**

Run: `npm run content:author -- 1-1`
Expected: `1-1: 2304 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn` rồi `PASS 1-1`. `git status` cho thấy `levels/1-1.json` **không đổi** và hai file mới trong `docs/testing/levels/`. Mở `docs/testing/levels/1-1.svg` bằng công cụ đọc ảnh/trình duyệt để xác nhận: hai thoi viền màu chạm đỉnh tại giữa bàn, hai thoi nét đứt thấp hơn 16 ô, nhãn D1.A/D1.B/D2.A/D2.B.

- [ ] **Step 7: README**

Trong `game-next/README.md`, phần "Lệnh làm việc", thêm sau dòng `npm run content:validate`:

```markdown
- `npm run content:author -- <id...> | --all`: Sinh `src/content/levels/<id>.json` từ nguồn `src/content/sources/<id>.ts`, kèm ảnh xem trước `docs/testing/levels/<id>.svg` và báo cáo nghiệm `<id>-report.md`
```

- [ ] **Step 8: Toàn bộ kiểm tra, CHANGELOG, commit**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh.

Mục `### 2026-10-02 - Add solution search and SVG previews to level authoring`. Message: `feat(content): add solution search report and SVG preview to level authoring`.

```bash
git add src/content/authoringReport.ts scripts/author-level.ts README.md tests/authoringReport.test.ts ../docs/testing/levels/1-1.svg ../docs/testing/levels/1-1-report.md ../CHANGELOG.md
git commit -F <file chứa message>
```

---

## Kết thúc giai đoạn 1

Kiểm tra trước khi sang giai đoạn 2: `npm run typecheck && npm test && npm run content:validate && npm run build` xanh; `git log --oneline` có 4 commit mới; 1-1 là `song-tinh-v2`, `approved`, có biên bản duyệt v2.

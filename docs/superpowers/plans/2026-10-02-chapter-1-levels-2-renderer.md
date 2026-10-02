# Chương 1 — Giai đoạn 2/3: Vẽ mọi hình, chồng lớp chẵn/lẻ, khay N ô, chế độ harness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renderer vẽ đúng vuông, tam giác, thoi với kích thước và hướng riêng từng mảnh; vùng chồng lớp hiện đúng luật chẵn/lẻ cho mọi tổ hợp hình; khay chứa N mảnh; chơi thử được màn `validated` qua `?mode=harness` ở dev.

**Architecture:** Phần hình học thuần nằm ở module test được (`polygonClip.ts`, `jewelGeometry.ts`, `layout.ts`); phần Phaser (`JewelShape.ts`, `BoardRenderer.ts`, `TargetBadge.ts`, `PlayScene.ts`) chỉ dịch kết quả thành lệnh vẽ và được kiểm bằng ảnh chụp. Mọi chỗ vẽ mảnh lấy đa giác từ `shapePolygon` của giai đoạn 1.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Phaser 3.90, Vite, Vitest, Chrome headless để chụp ảnh.

**Spec:** `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`

**Giao được gì sau giai đoạn này:** 1-1 trông như trước (đối chiếu ảnh chụp); một màn có vuông và tam giác (từ giai đoạn 3) sẽ hiện đúng ngay khi có dữ liệu; `?scene=play&level=<id>&mode=harness` nạp màn `validated` trên dev server.

## Vị trí trong loạt plan

- **Chạy sau:** `2026-10-02-chapter-1-levels-1-nen-mong.md` — phải xong và xanh.
- **Chạy tiếp theo:** `2026-10-02-chapter-1-levels-3-noi-dung.md`

Chỉ mục: `docs/superpowers/plans/2026-10-02-chapter-1-levels-index.md`

## Global Constraints

Giữ nguyên toàn bộ Global Constraints của giai đoạn 1, cộng thêm:

- Canvas 720 × 1280; bàn ở `(40, 200)` kích thước 640 × 800; 5px mỗi ô logic (`layout.cellPixel`). Khay ở `(40, 1016)` kích thước 640 × 136.
- Phaser `Graphics` không có clip hay blur; mọi hiệu ứng dựng bằng đa giác. Không thêm GameObject mới trong vòng `render()` (render chạy mỗi khung hình).
- Màu lấy từ `COLOR_NUMBERS` / `PIECE_TOKENS` trong `src/presentation/designTokens.ts`; không viết mã màu mới.
- Thay đổi Phaser không có unit test phải được kiểm bằng ảnh chụp Chrome headless (Task 8 tạo script).

---

### Task 5: Cắt giao đa giác lồi và các lớp chẵn/lẻ

**Files:**
- Create: `game-next/src/presentation/polygonClip.ts`
- Test: `game-next/tests/polygonClip.test.ts`

**Interfaces:**
- Consumes: không có.
- Produces:
  - `type Pt = Readonly<{ x: number; y: number }>`
  - `signedArea(polygon: readonly Pt[]): number`, `polygonArea(polygon: readonly Pt[]): number`
  - `clipConvex(subject: readonly Pt[], clip: readonly Pt[]): Pt[]` — giao hai đa giác lồi; trả `[]` khi diện tích giao ≈ 0 (rời nhau hoặc chỉ chạm cạnh/đỉnh).
  - `type ParityLayer = Readonly<{ points: Pt[]; depth: number; filled: boolean }>`
  - `parityLayers(polygons: readonly (readonly Pt[])[]): ParityLayer[]` — mọi giao khác rỗng của k đa giác (k = 1..n), xếp theo `depth` tăng dần; `filled = depth lẻ`.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/polygonClip.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { clipConvex, parityLayers, polygonArea } from '../src/presentation/polygonClip.ts';
import type { Pt } from '../src/presentation/polygonClip.ts';

function square(x: number, y: number, s: number): Pt[] {
  return [
    { x, y },
    { x: x + s, y },
    { x: x + s, y: y + s },
    { x, y: y + s },
  ];
}

/** Điểm nằm hẳn bên trong đa giác lồi (không tính biên). */
function strictlyInside(polygon: readonly Pt[], p: Pt): boolean {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (cross === 0) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

describe('clipConvex', () => {
  test('hai hình vuông lệch nửa cạnh giao nhau một phần tư', () => {
    expect(polygonArea(clipConvex(square(0, 0, 10), square(5, 5, 10)))).toBeCloseTo(25, 9);
  });

  test('chỉ chạm cạnh hoặc rời nhau thì giao rỗng', () => {
    expect(clipConvex(square(0, 0, 10), square(10, 0, 10))).toEqual([]);
    expect(clipConvex(square(0, 0, 10), square(10, 10, 10))).toEqual([]);
    expect(clipConvex(square(0, 0, 10), square(30, 0, 10))).toEqual([]);
  });

  test('tam giác nằm trong hình vuông giữ nguyên diện tích', () => {
    const tri: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(clipConvex(tri, square(0, 0, 10)))).toBeCloseTo(50, 9);
  });

  test('không phụ thuộc chiều đi vòng của đa giác cắt', () => {
    const reversed = [...square(5, 5, 10)].reverse();
    expect(polygonArea(clipConvex(square(0, 0, 10), reversed))).toBeCloseTo(25, 9);
  });
});

describe('parityLayers', () => {
  test('hai hình giao nhau cho ba lớp: hai đơn và một cặp rỗng', () => {
    const layers = parityLayers([square(0, 0, 10), square(5, 0, 10)]);
    expect(layers.map((l) => [l.depth, l.filled])).toEqual([
      [1, true],
      [1, true],
      [2, false],
    ]);
  });

  test('lớp trên cùng tại mỗi điểm khớp tính chẵn lẻ của số mảnh phủ', () => {
    const polygons = [square(0, 0, 20), square(10, 0, 20), square(5, 8, 20)];
    const layers = parityLayers(polygons);
    for (let x = 0.37; x < 30; x += 1.3) {
      for (let y = 0.41; y < 30; y += 1.3) {
        const p = { x, y };
        const coverage = polygons.filter((poly) => strictlyInside(poly, p)).length;
        const top = [...layers].reverse().find((l) => strictlyInside(l.points, p));
        if (coverage === 0) {
          expect(top).toBeUndefined();
        } else {
          expect(top?.depth).toBe(coverage);
          expect(top?.filled).toBe(coverage % 2 === 1);
        }
      }
    }
  });

  test('bỏ qua đa giác suy biến', () => {
    const flat: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ];
    expect(parityLayers([flat])).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/polygonClip.test.ts`
Expected: FAIL — không resolve được `polygonClip.ts`.

- [ ] **Step 3: Viết `polygonClip.ts`**

Tạo `game-next/src/presentation/polygonClip.ts`:

```ts
/** Điểm canvas hoặc điểm lưới; module này không quan tâm đơn vị. */
export type Pt = Readonly<{ x: number; y: number }>;

const AREA_EPSILON = 1e-6;

export function signedArea(polygon: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

export function polygonArea(polygon: readonly Pt[]): number {
  return Math.abs(signedArea(polygon));
}

function intersect(p: Pt, q: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq);
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

/**
 * Giao của đa giác `subject` với đa giác lồi `clip` (Sutherland–Hodgman).
 * Mọi hình của game đều lồi nên giao của chúng cũng lồi. Giao chỉ chạm cạnh
 * hay chạm đỉnh có diện tích 0 và được trả về rỗng.
 */
export function clipConvex(subject: readonly Pt[], clip: readonly Pt[]): Pt[] {
  if (subject.length < 3 || clip.length < 3) return [];
  const orient = Math.sign(signedArea(clip)) || 1;
  let output: Pt[] = [...subject];

  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (p: Pt): number => orient * ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const sc = side(cur);
      const sp = side(prev);
      if (sc >= 0) {
        if (sp < 0) output.push(intersect(prev, cur, sp, sc));
        output.push(cur);
      } else if (sp >= 0) {
        output.push(intersect(prev, cur, sp, sc));
      }
    }
  }

  return polygonArea(output) > AREA_EPSILON ? output : [];
}

export type ParityLayer = Readonly<{ points: Pt[]; depth: number; filled: boolean }>;

/**
 * Các lớp vẽ chồng cho luật chẵn/lẻ: mọi giao khác rỗng của k đa giác, xếp
 * theo k tăng dần. Vẽ lần lượt (lớp lẻ màu mảnh, lớp chẵn màu mặt bàn) thì
 * lớp trên cùng ở mỗi vùng là giao của đúng số mảnh đang phủ vùng đó, nên
 * màu luôn đúng tính chẵn lẻ của số ấy — với mọi số mảnh và mọi hình lồi.
 */
export function parityLayers(polygons: readonly (readonly Pt[])[]): ParityLayer[] {
  const layers: ParityLayer[] = [];
  // Mỗi phần tử là giao của một tập chỉ số tăng dần; `last` là chỉ số cuối
  // để chỉ ghép thêm đa giác có chỉ số lớn hơn (mỗi tập con xuất hiện một lần).
  let frontier = polygons
    .map((p, i) => ({ points: [...p], last: i }))
    .filter((f) => polygonArea(f.points) > AREA_EPSILON);
  let depth = 1;

  while (frontier.length > 0) {
    for (const f of frontier) {
      layers.push({ points: f.points, depth, filled: depth % 2 === 1 });
    }
    const next: Array<{ points: Pt[]; last: number }> = [];
    for (const f of frontier) {
      for (let j = f.last + 1; j < polygons.length; j++) {
        const inter = clipConvex(f.points, polygons[j]);
        if (inter.length >= 3) next.push({ points: inter, last: j });
      }
    }
    frontier = next;
    depth++;
  }

  return layers;
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/polygonClip.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: Kiểm tra, CHANGELOG, commit**

Run: `npm run typecheck && npm test`. Mục `### 2026-10-02 - Add convex polygon clipping and parity layers`. Message: `feat(presentation): add convex clipping and even-odd parity layers`.

```bash
git add src/presentation/polygonClip.ts tests/polygonClip.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 6: Mặt vát ngọc cho đa giác bất kỳ

**Files:**
- Modify: `game-next/src/presentation/jewelGeometry.ts` (thêm hàm, không sửa hàm cũ)
- Modify: `game-next/src/presentation/JewelShape.ts`
- Test: `game-next/tests/jewelGeometry.test.ts` (thêm `describe` mới ở cuối)

**Interfaces:**
- Consumes: `PIECE_TOKENS` (đã có).
- Produces:
  - `polygonCentroid(points: readonly Point[]): Point` — trung bình đỉnh.
  - `scalePolygon(points: readonly Point[], origin: Point, factor: number): Point[]`
  - `polygonFaces(points: readonly Point[]): JewelFace[]` — mỗi cạnh `a→b` thành mặt `[a, b, tâm]`, màu theo hướng pháp tuyến ngoài: gần nhất trong bốn hướng tham chiếu Bắc −135°, Đông −45°, Nam 45°, Tây 135° (góc `atan2` với trục y hướng xuống); hoà thì lấy mặt sáng hơn theo thứ tự Bắc > Đông > Tây > Nam.
  - `polygonTable(points: readonly Point[]): Point[]`, `polygonSpineLines(points: readonly Point[]): Array<{ from: Point; to: Point }>`
  - `type JewelPolygonOptions = { variant: JewelVariant; alpha?: number; sizePx: number }` — `sizePx` là nửa cạnh khung tính bằng pixel (vai trò "bán kính" cũ).
  - `drawJewelPolygon(g: Phaser.GameObjects.Graphics, points: readonly Point[], opts: JewelPolygonOptions): void`
  - `drawJewel(g, opts)` giữ nguyên chữ ký và kết quả, nay gọi `drawJewelPolygon`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào import của `game-next/tests/jewelGeometry.test.ts`: `polygonCentroid, polygonFaces, polygonTable, scalePolygon` (cùng câu import từ `jewelGeometry.ts`). Thêm vào cuối file:

```ts
describe('mặt vát cho đa giác bất kỳ', () => {
  const sortedFace = (f: { name: string; color: string; points: Array<{ x: number; y: number }> }) => ({
    name: f.name,
    color: f.color,
    points: [...f.points].sort((a, b) => a.x - b.x || a.y - b.y),
  });

  test('thoi dựng bằng polygonFaces giống hệt jewelFaces (bỏ qua thứ tự đỉnh)', () => {
    const generic = polygonFaces(jewelOutline(CX, CY, R)).map(sortedFace);
    const legacy = jewelFaces(CX, CY, R).map(sortedFace);
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    expect(generic.sort(byName)).toEqual(legacy.sort(byName));
  });

  test('hình vuông: cạnh trên và trái sáng nhất, phải là Đông, dưới là Tây', () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonFaces(sq).map((f) => f.name)).toEqual(['north', 'east', 'west', 'north']);
  });

  test('mái hướng 4: hai cạnh xiên là Bắc và Đông, cạnh huyền ở đáy là Tây', () => {
    const roof = [
      { x: 0, y: 48 },
      { x: 48, y: 48 },
      { x: 24, y: 24 },
    ];
    expect(polygonFaces(roof).map((f) => f.name)).toEqual(['west', 'east', 'north']);
  });

  test('mặt bàn đa giác trùng mặt bàn thoi cũ', () => {
    const generic = polygonTable(jewelOutline(CX, CY, R));
    const legacy = jewelTable(CX, CY, R);
    generic.forEach((p, i) => {
      expect(p.x).toBeCloseTo(legacy[i].x, 9);
      expect(p.y).toBeCloseTo(legacy[i].y, 9);
    });
  });

  test('trọng tâm và phép co giãn quanh trọng tâm', () => {
    const tri = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 0, y: 30 },
    ];
    expect(polygonCentroid(tri)).toEqual({ x: 10, y: 10 });
    expect(scalePolygon(tri, { x: 10, y: 10 }, 0.5)).toEqual([
      { x: 5, y: 5 },
      { x: 20, y: 5 },
      { x: 5, y: 20 },
    ]);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/jewelGeometry.test.ts`
Expected: FAIL — `polygonFaces is not a function` (hoặc lỗi import tương đương).

- [ ] **Step 3: Thêm hàm vào `jewelGeometry.ts`**

Thêm vào cuối `game-next/src/presentation/jewelGeometry.ts`:

```ts
/** Trung bình các đỉnh; với tam giác, vuông và thoi đây cũng là trọng tâm hình. */
export function polygonCentroid(points: readonly Point[]): Point {
  const n = points.length;
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / n,
    y: points.reduce((sum, p) => sum + p.y, 0) / n,
  };
}

export function scalePolygon(points: readonly Point[], origin: Point, factor: number): Point[] {
  return points.map((p) => ({
    x: origin.x + (p.x - origin.x) * factor,
    y: origin.y + (p.y - origin.y) * factor,
  }));
}

/**
 * Bốn hướng tham chiếu của mặt vát, xếp từ sáng đến tối để khi pháp tuyến
 * nằm đúng giữa hai hướng thì lấy mặt sáng hơn. Góc đo bằng atan2 với trục y
 * hướng xuống: cạnh trên-trái của thoi có pháp tuyến ngoài −135°.
 */
const FACE_REFERENCES: ReadonlyArray<{ name: JewelFace['name']; angle: number; color: string }> = [
  { name: 'north', angle: -135, color: PIECE_TOKENS.faceNorth },
  { name: 'east', angle: -45, color: PIECE_TOKENS.faceEast },
  { name: 'west', angle: 135, color: PIECE_TOKENS.faceWest },
  { name: 'south', angle: 45, color: PIECE_TOKENS.faceSouth },
];

function faceForNormal(nx: number, ny: number): (typeof FACE_REFERENCES)[number] {
  const angle = (Math.atan2(ny, nx) * 180) / Math.PI;
  let best = FACE_REFERENCES[0];
  let bestDistance = Infinity;
  for (const ref of FACE_REFERENCES) {
    let d = Math.abs(angle - ref.angle) % 360;
    if (d > 180) d = 360 - d;
    if (d < bestDistance - 1e-9) {
      best = ref;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * Mặt vát cho đa giác lồi bất kỳ: mỗi cạnh nối với trọng tâm thành một mặt,
 * màu theo hướng cạnh nhìn ra. Với thoi, kết quả trùng `jewelFaces`.
 */
export function polygonFaces(points: readonly Point[]): JewelFace[] {
  const c = polygonCentroid(points);
  return points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    let nx = b.y - a.y;
    let ny = -(b.x - a.x);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    if (nx * (mx - c.x) + ny * (my - c.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const ref = faceForNormal(nx, ny);
    return { name: ref.name, points: [a, b, c], color: ref.color };
  });
}

export function polygonTable(points: readonly Point[]): Point[] {
  return scalePolygon(points, polygonCentroid(points), PIECE_TOKENS.tableRatio);
}

export function polygonSpineLines(points: readonly Point[]): Array<{ from: Point; to: Point }> {
  const inner = polygonTable(points);
  return points.map((from, index) => ({ from, to: inner[index] }));
}
```

- [ ] **Step 4: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/jewelGeometry.test.ts`
Expected: PASS toàn bộ (test cũ + 5 test mới).

- [ ] **Step 5: `drawJewelPolygon` trong `JewelShape.ts`**

Trong `game-next/src/presentation/JewelShape.ts`:

(a) Sửa import từ `./jewelGeometry.ts` thành:

```ts
import {
  jewelOutline,
  polygonCentroid,
  polygonFaces,
  polygonSpineLines,
  polygonTable,
  scalePolygon,
} from './jewelGeometry.ts';
```

(b) Thêm kiểu sau `JewelOptions`:

```ts
export type JewelPolygonOptions = {
  variant: JewelVariant;
  alpha?: number;
  /** Nửa cạnh khung mảnh tính bằng pixel — quy mô cho viền trong và đốm sáng */
  sizePx: number;
};
```

(c) Thay toàn bộ hàm `drawJewel` bằng hai hàm sau (`drawSparkle`, `strokeDashedPolygon`, `hex`, `toGeomPoints` giữ nguyên):

```ts
/**
 * Vẽ một mảnh ngọc thoi. Giữ chữ ký cũ cho HUD và các chỗ chỉ cần thoi.
 */
export function drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void {
  drawJewelPolygon(g, jewelOutline(opts.cx, opts.cy, opts.radius), {
    variant: opts.variant,
    alpha: opts.alpha,
    sizePx: opts.radius,
  });
}

/**
 * Vẽ mảnh ngọc theo đa giác bất kỳ (vuông, tam giác, thoi).
 *
 * Viền vẽ phía trong mảnh (co đa giác quanh trọng tâm theo nửa độ dày viền)
 * để mép trùng đúng đường kẻ lưới — quy tắc "vẽ đúng đến từng pixel" của GridSpec.
 */
export function drawJewelPolygon(
  g: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  opts: JewelPolygonOptions
): void {
  const { variant, sizePx } = opts;
  const alpha = opts.alpha ?? (variant === 'ghost' ? PIECE_TOKENS.ghostAlpha : 1);
  const outline = [...points];
  const center = polygonCentroid(outline);

  if (variant === 'target') {
    g.fillStyle(hex(PIECE_TOKENS.targetFill.color), PIECE_TOKENS.targetFill.alpha * alpha);
    g.fillPoints(toGeomPoints(outline), true);
    g.lineStyle(
      PIECE_TOKENS.targetStroke.width,
      hex(PIECE_TOKENS.targetStroke.color),
      PIECE_TOKENS.targetStroke.alpha * alpha
    );
    strokeDashedPolygon(g, outline, PIECE_TOKENS.targetStroke.dash);
    return;
  }

  if (variant === 'placeholder') {
    g.lineStyle(
      PIECE_TOKENS.placeholderStroke.width,
      hex(PIECE_TOKENS.placeholderStroke.color),
      PIECE_TOKENS.placeholderStroke.alpha * alpha
    );
    strokeDashedPolygon(g, outline, PIECE_TOKENS.placeholderStroke.dash);
    return;
  }

  // Quầng sáng phía sau: các đa giác đồng tâm lớn dần, mờ dần. Phaser Graphics
  // không có blur nên đây là cách xấp xỉ rẻ nhất mà không phải sinh texture
  // hay thêm GameObject (render chạy mỗi khung hình, thêm object là rò rỉ).
  const glowRings = 6;
  for (let i = glowRings; i > 0; i--) {
    const t = i / glowRings;
    g.fillStyle(hex(PIECE_TOKENS.glow.color), PIECE_TOKENS.glow.alpha * (1 - t) ** 2 * alpha);
    g.fillPoints(toGeomPoints(scalePolygon(outline, center, 1 + t * 0.22)), true);
  }

  // solid và ghost: các mặt vát, mặt bàn, đoạn nối, viền trong
  for (const face of polygonFaces(outline)) {
    g.fillStyle(hex(face.color), alpha);
    g.fillPoints(toGeomPoints(face.points), true);
  }

  g.fillStyle(hex(PIECE_TOKENS.tableStops[1]), 0.6 * alpha);
  g.fillPoints(toGeomPoints(polygonTable(outline)), true);

  g.lineStyle(1, hex('#FFF7DA'), 0.45 * alpha);
  for (const line of polygonSpineLines(outline)) {
    g.lineBetween(line.from.x, line.from.y, line.to.x, line.to.y);
  }

  const inset = PIECE_TOKENS.outlineWidth / 2;
  g.lineStyle(PIECE_TOKENS.outlineWidth, hex(PIECE_TOKENS.outline), alpha);
  g.strokePoints(toGeomPoints(scalePolygon(outline, center, (sizePx - inset) / sizePx)), true, true);

  drawSparkle(
    g,
    center.x + sizePx * PIECE_TOKENS.sparkle.offsetRatio,
    center.y + sizePx * PIECE_TOKENS.sparkle.offsetRatio,
    sizePx * 0.12,
    PIECE_TOKENS.sparkle.alpha * alpha
  );
}
```

Ghi chú tương đương với bản cũ: với thoi, `scalePolygon(outline, center, k)` cho đúng `jewelOutline(cx, cy, radius * k)`, nên quầng sáng, viền trong và mặt bàn trùng pixel với trước.

- [ ] **Step 6: Kiểm tra, CHANGELOG, commit**

Run: `npm run typecheck && npm test`
Expected: xanh. (`toGeomPoints` nhận `Point[]`; nếu typecheck báo `readonly Point[]` không gán được thì đổi tham số `toGeomPoints(points: readonly Point[])`.)

Mục `### 2026-10-02 - Draw jewel facets for any convex polygon`. Message: `feat(presentation): draw jewel facets for any convex piece polygon`.

```bash
git add src/presentation/jewelGeometry.ts src/presentation/JewelShape.ts tests/jewelGeometry.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 7: Đa giác mảnh trên canvas và khay N ô

**Files:**
- Modify: `game-next/src/presentation/layout.ts`
- Modify: `game-next/src/application/drag.ts` (`beginDrag`)
- Modify: `game-next/src/application/playController.ts` (`onPointerDown`)
- Test: `game-next/tests/layout.test.ts` (thêm `describe` mới ở cuối)

**Interfaces:**
- Consumes: `shapePolygon`, `effectiveOrientation` (giai đoạn 1); `Piece` có `shapeKind?`, `orientation?`.
- Produces:
  - `type CanvasPoint = { x: number; y: number }`
  - `piecePolygonCanvas(piece: Piece, originX: number, originY: number, turns: number, layout: LayoutMetrics): CanvasPoint[]` — đa giác thật trên bàn (gốc khung tại `originX, originY` ô logic).
  - `piecePolygonAround(piece: Piece, turns: number, cx: number, cy: number, framePx: number): CanvasPoint[]` — cùng hình, đặt tâm khung tại `(cx, cy)` với cạnh khung `framePx` pixel (dùng cho khay và mảnh đang kéo).
  - `traySlotWidth(layout: LayoutMetrics, trayCount: number): number`
  - `trayWellRects(layout: LayoutMetrics, trayCount: number): Array<{ x: number; y: number; width: number; height: number }>` — lề 16px, khe 16px; với 2 ô trùng vị trí ô lõm hiện tại.
  - `pieceHitbox(piece, state, layout, pieceIndexInTray = 0, trayCount = 2)` — tham số thứ 5 mới; ô khay rộng `trayCount` phần, kích thước hitbox trong khay `max(min(frame px, bề rộng ô), 48)`.
  - `trayPieceRadiusPx(layout: LayoutMetrics, trayCount = 2): number` = `min(cao khay / 2 − 16, bề rộng ô / 2 − 16)`.
  - `beginDrag(state, piece, pointerX, pointerY, layout, pieceIndexInTray = 0, trayCount = 2)`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào import của `game-next/tests/layout.test.ts`: `pieceHitbox, piecePolygonCanvas, piecePolygonAround, trayWellRects` (cùng câu import từ `layout.ts`) và `import type { Piece } from '../src/domain/model.ts';`. Thêm vào cuối file:

```ts
describe('Đa giác mảnh và khay N ô', () => {
  const layout = computeLayout(720, 1280);

  function makePiece(shapeKind: Piece['shapeKind'], orientation: Piece['orientation'] = 0): Piece {
    return { id: 'P', frameSize: 48, cells: [], anchors: [{ id: 'A', x: 0, y: 0 }], color: 'amber', shapeKind, orientation };
  }

  test('hình vuông gốc (40, 64) phủ đúng khung 240px trên canvas', () => {
    expect(piecePolygonCanvas(makePiece('square'), 40, 64, 0, layout)).toEqual([
      { x: 240, y: 520 },
      { x: 480, y: 520 },
      { x: 480, y: 760 },
      { x: 240, y: 760 },
    ]);
  });

  test('mảnh không ghi shapeKind được vẽ như thoi (literal viết tay trong test domain)', () => {
    const legacy: Piece = { id: 'D', frameSize: 48, cells: [], anchors: [], color: 'amber' };
    expect(piecePolygonCanvas(legacy, 16, 56, 0, layout)).toEqual([
      { x: 240, y: 480 },
      { x: 360, y: 600 },
      { x: 240, y: 720 },
      { x: 120, y: 600 },
    ]);
  });

  test('xoay một nấc dùng đa giác của hướng hiệu dụng', () => {
    // Mái hướng 4 xoay 1 nấc thành hướng 5: cạnh huyền nằm bên trái khung
    expect(piecePolygonAround(makePiece('triangle', 4), 1, 100, 100, 48)).toEqual([
      { x: 76, y: 76 },
      { x: 76, y: 124 },
      { x: 100, y: 100 },
    ]);
  });

  test('ô lõm khay: 2 ô trùng vị trí cũ, 3 ô nằm gọn và không chồng nhau', () => {
    expect(trayWellRects(layout, 2)).toEqual([
      { x: 56, y: 1030, width: 296, height: 108 },
      { x: 368, y: 1030, width: 296, height: 108 },
    ]);
    const three = trayWellRects(layout, 3);
    expect(three).toHaveLength(3);
    for (let i = 0; i < three.length; i++) {
      expect(three[i].x).toBeGreaterThanOrEqual(layout.trayBounds.x);
      expect(three[i].x + three[i].width).toBeLessThanOrEqual(layout.trayBounds.x + layout.trayBounds.width);
      if (i > 0) expect(three[i].x).toBeGreaterThan(three[i - 1].x + three[i - 1].width);
    }
  });

  test('hitbox khay 3 mảnh không chồng nhau và nằm trong khay', () => {
    const piece = makePiece('square');
    const boxes = [0, 1, 2].map((i) => pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, i, 3));
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].x).toBeGreaterThanOrEqual(layout.trayBounds.x);
      expect(boxes[i].x + boxes[i].width).toBeLessThanOrEqual(layout.trayBounds.x + layout.trayBounds.width + 1e-9);
      if (i > 0) expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].width - 1e-9);
    }
  });

  test('hitbox khay 2 mảnh không đổi so với trước', () => {
    const piece = makePiece('diamond');
    expect(pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, 1)).toEqual(
      pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, 1, 2)
    );
    expect(pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, 1, 2)).toEqual({
      x: 400,
      y: 964,
      width: 240,
      height: 240,
    });
  });

  test('bán kính mảnh trong khay co theo số ô khi khay chật', () => {
    expect(trayPieceRadiusPx(layout)).toBe(52);
    expect(trayPieceRadiusPx(layout, 3)).toBe(52);
    expect(trayPieceRadiusPx(layout, 5)).toBe(48);
  });
});
```

(Giá trị hitbox 2 ô: ô 1 có tâm x = 40 + 320 + 160 = 520, khung 240px → x = 400; tâm y = 1016 + 68 = 1084 → y = 964.)

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/layout.test.ts`
Expected: FAIL — `piecePolygonCanvas` / `trayWellRects` chưa được export.

- [ ] **Step 3: Sửa `layout.ts`**

Trong `game-next/src/presentation/layout.ts`:

(a) Thêm import (giữ import cũ):

```ts
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import type { Vertex } from '../domain/shapes.ts';
```

(b) Trong `pieceHitbox`, đổi chữ ký thành:

```ts
export function pieceHitbox(
  piece: Piece,
  state: PieceState,
  layout: LayoutMetrics,
  pieceIndexInTray: number = 0,
  trayCount: number = 2
): { x: number; y: number; width: number; height: number } {
```

và thay khối khay ở cuối hàm (từ comment `// Tray: sắp xếp...` đến hết `return`) bằng:

```ts
  // Tray: chia đều bề ngang khay theo số mảnh của màn. Hitbox không rộng quá
  // một ô để mảnh cạnh nhau không giành nhau cú chạm.
  const slotWidth = traySlotWidth(layout, trayCount);
  const traySize = Math.max(Math.min(rawSize, slotWidth), minTouchSize);
  const centerX = layout.trayBounds.x + slotWidth * pieceIndexInTray + slotWidth / 2;
  const centerY = layout.trayBounds.y + layout.trayBounds.height / 2;

  return {
    x: centerX - traySize / 2,
    y: centerY - traySize / 2,
    width: traySize,
    height: traySize,
  };
```

(c) Thay hàm `trayPieceRadiusPx` bằng:

```ts
export function trayPieceRadiusPx(layout: LayoutMetrics, trayCount: number = 2): number {
  return Math.min(
    layout.trayBounds.height / 2 - 16,
    traySlotWidth(layout, trayCount) / 2 - 16
  );
}
```

và giữ nguyên comment JSDoc phía trên, thêm một câu: `Khi khay chia nhiều ô, bán kính còn bị giới hạn bởi nửa bề rộng ô.`

(d) Thêm vào cuối file:

```ts
export type CanvasPoint = { x: number; y: number };

/** Đa giác của mảnh sau `turns` nấc xoay; mảnh không ghi hình (test domain) coi là thoi. */
function pieceVertices(piece: Piece, turns: number): Vertex[] {
  const kind = piece.shapeKind ?? 'diamond';
  const orientation = effectiveOrientation(kind, piece.orientation ?? 0, turns);
  return shapePolygon(kind, orientation, piece.frameSize);
}

/** Đa giác thật của mảnh trên bàn, gốc khung tại (originX, originY) ô logic. */
export function piecePolygonCanvas(
  piece: Piece,
  originX: number,
  originY: number,
  turns: number,
  layout: LayoutMetrics
): CanvasPoint[] {
  return pieceVertices(piece, turns).map((v) => gridToCanvas(originX + v.x, originY + v.y, layout));
}

/** Cùng hình nhưng đặt tâm khung tại (cx, cy), cạnh khung framePx pixel — cho khay và mảnh đang kéo. */
export function piecePolygonAround(
  piece: Piece,
  turns: number,
  cx: number,
  cy: number,
  framePx: number
): CanvasPoint[] {
  const s = piece.frameSize;
  return pieceVertices(piece, turns).map((v) => ({
    x: cx + (v.x / s - 0.5) * framePx,
    y: cy + (v.y / s - 0.5) * framePx,
  }));
}

export function traySlotWidth(layout: LayoutMetrics, trayCount: number): number {
  return layout.trayBounds.width / Math.max(1, trayCount);
}

/**
 * Ô lõm trong khay: lề 16px hai bên, khe 16px giữa các ô, đệm 14px trên dưới.
 * Với 2 ô cho đúng vị trí ô lõm của bản trước.
 */
export function trayWellRects(
  layout: LayoutMetrics,
  trayCount: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const n = Math.max(1, trayCount);
  const gap = 16;
  const width = (layout.trayBounds.width - gap * (n + 1)) / n;
  return Array.from({ length: n }, (_, i) => ({
    x: layout.trayBounds.x + gap + i * (width + gap),
    y: layout.trayBounds.y + 14,
    width,
    height: layout.trayBounds.height - 28,
  }));
}
```

- [ ] **Step 4: Truyền số ô khay ở tầng application**

Trong `game-next/src/application/drag.ts`, đổi chữ ký `beginDrag` thành:

```ts
export function beginDrag(
  state: PuzzleState,
  piece: Piece,
  pointerX: number,
  pointerY: number,
  layout: LayoutMetrics,
  pieceIndexInTray: number = 0,
  trayCount: number = 2
): DragSession {
```

và trong nhánh `else` của hàm đổi dòng hitbox thành:

```ts
    const hitbox = pieceHitbox(piece, originState, layout, pieceIndexInTray, trayCount);
```

Trong `game-next/src/application/playController.ts`, trong `onPointerDown`, đổi hai dòng:

```ts
      const hitbox = pieceHitbox(piece, pState, layout, originalIndex, this.level.pieces.length);
```

```ts
        this.dragSession = beginDrag(
          this.puzzleState,
          piece,
          pointerX,
          pointerY,
          layout,
          originalIndex,
          this.level.pieces.length
        );
```

- [ ] **Step 5: Chạy test, xác nhận xanh**

Run: `npx vitest run tests/layout.test.ts && npm test`
Expected: PASS toàn bộ; `tests/catalog.test.ts`, `tests/drag.test.ts`, `tests/playController.test.ts` không đổi vì 1-1 có 2 mảnh (mặc định `trayCount = 2`).

- [ ] **Step 6: Typecheck, CHANGELOG, commit**

Run: `npm run typecheck`. Mục `### 2026-10-02 - Piece polygons on canvas and N-slot tray`. Message: `feat(layout): add piece polygons on canvas and N-slot tray`.

```bash
git add src/presentation/layout.ts src/application/drag.ts src/application/playController.ts tests/layout.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 8: Renderer, huy hiệu mục tiêu và hiệu ứng thắng dùng đa giác thật

**Files:**
- Modify: `game-next/src/domain/mask.ts` (thêm `maskCentroid`)
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Modify: `game-next/src/presentation/TargetBadge.ts`
- Modify: `game-next/src/presentation/PlayScene.ts`
- Create: `game-next/scripts/shoot-level.sh`
- Create (ảnh bằng chứng): `docs/testing/levels/screens/1-1-before-*.png`, `1-1-after-*.png`
- Test: `game-next/tests/boardRenderer.test.ts` (thêm test `maskCentroid`)

**Interfaces:**
- Consumes: `drawJewelPolygon` (Task 6); `parityLayers` (Task 5); `piecePolygonCanvas`, `piecePolygonAround`, `trayWellRects`, `trayPieceRadiusPx(layout, n)`, `pieceHitbox(..., n)` (Task 7); `Level.targetPlacements`, `Piece.shapeKind/orientation` (giai đoạn 1); `shapePolygon`, `effectiveOrientation`.
- Produces:
  - `maskCentroid(mask: Uint8Array): { x: number; y: number } | null` — trung bình tâm ô có giá trị 1, đơn vị ô logic.
  - `new BoardRenderer(scene, layout, trayCount = 2)`.
  - `bash scripts/shoot-level.sh <level-id> <thư-mục-ra> [port] [mode] [tiền-tố]` — chụp `play`, `drag`, `win`.

- [ ] **Step 1: Chụp ảnh nền "trước" của 1-1**

Tạo `game-next/scripts/shoot-level.sh`:

```bash
#!/usr/bin/env bash
# Chụp một màn bằng Chrome headless để tự kiểm tra thị giác.
# Dùng: bash scripts/shoot-level.sh <level-id> <thư-mục-ra> [port] [mode] [tiền-tố]
#   mode: campaign (mặc định) hoặc harness (chỉ có tác dụng trên dev server)
# Không dùng `set -e`: Chrome headless đôi khi thoát mã khác 0 dù đã ghi ảnh.
set -uo pipefail
LEVEL="$1"
OUT="$2"
PORT="${3:-5173}"
MODE="${4:-campaign}"
PREFIX="${5:-$LEVEL}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p "$OUT"

shoot() {
  local name="$1" query="$2" budget="${3:-6000}"
  "$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --force-device-scale-factor=1 --window-size=720,1280 \
    --virtual-time-budget="$budget" \
    --screenshot="$OUT/${PREFIX}-${name}.png" "http://localhost:${PORT}/${query}" >/dev/null 2>&1
  echo "$OUT/${PREFIX}-${name}.png"
}

BASE="?scene=play&level=${LEVEL}&mode=${MODE}"
shoot play "$BASE"
shoot drag "$BASE&autosolve=drag"
shoot win "$BASE&autosolve=win" 9000
```

Chạy dev server nền: `npm run dev -- --port 5173 --strictPort` (dùng `run_in_background`; chờ dòng `Local: http://localhost:5173`).

Run: `bash scripts/shoot-level.sh 1-1 ../docs/testing/levels/screens 5173 campaign 1-1-before`
Expected: in ra ba đường dẫn `1-1-before-play.png`, `1-1-before-drag.png`, `1-1-before-win.png`. Mở từng ảnh để chắc chắn ảnh không trắng (nếu trắng, tăng budget hoặc kiểm tra đường dẫn Chrome qua biến `CHROME`).

- [ ] **Step 2: Viết test thất bại cho `maskCentroid`**

Thêm vào cuối `game-next/tests/boardRenderer.test.ts`:

```ts
import { maskCentroid } from '../src/domain/mask.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { TOTAL_CELLS, GRID_WIDTH } from '../src/domain/model.ts';

describe('maskCentroid', () => {
  test('mask rỗng không có trọng tâm', () => {
    expect(maskCentroid(new Uint8Array(TOTAL_CELLS))).toBeNull();
  });

  test('một ô duy nhất có trọng tâm ở tâm ô', () => {
    const mask = new Uint8Array(TOTAL_CELLS);
    mask[10 * GRID_WIDTH + 4] = 1;
    expect(maskCentroid(mask)).toEqual({ x: 4.5, y: 10.5 });
  });

  test('mục tiêu 1-1 có trọng tâm sát tâm bàn (64, 80)', () => {
    const c = maskCentroid(loadLevel('1-1', 'campaign').targetMask)!;
    expect(c.x).toBeCloseTo(63.5, 6);
    expect(c.y).toBeCloseTo(80, 6);
  });
});
```

(Đưa ba dòng import lên nhóm import đầu file.)

Run: `npx vitest run tests/boardRenderer.test.ts`
Expected: FAIL — `maskCentroid` chưa được export.

- [ ] **Step 3: Viết `maskCentroid`**

Thêm vào cuối `game-next/src/domain/mask.ts`:

```ts
/** Trọng tâm các ô bật của mask, đơn vị ô logic (tâm ô = toạ độ + 0.5). */
export function maskCentroid(mask: Uint8Array): { x: number; y: number } | null {
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    count++;
    sumX += (i % GRID_WIDTH) + 0.5;
    sumY += Math.floor(i / GRID_WIDTH) + 0.5;
  }
  return count === 0 ? null : { x: sumX / count, y: sumY / count };
}
```

Run: `npx vitest run tests/boardRenderer.test.ts`
Expected: PASS.

- [ ] **Step 4: Viết lại phần vẽ mảnh của `BoardRenderer.ts`**

Trong `game-next/src/presentation/BoardRenderer.ts`:

(a) Thay khối import đầu file bằng:

```ts
import Phaser from 'phaser';
import type { Level, Piece, PieceState } from '../domain/model.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
import { maskCentroid } from '../domain/mask.ts';
import type { LayoutMetrics } from './layout.ts';
import {
  gridToCanvas,
  pieceHitbox,
  pieceCenterCanvas,
  piecePolygonAround,
  piecePolygonCanvas,
  pieceRadiusPx,
  trayPieceRadiusPx,
  trayWellRects,
} from './layout.ts';
import { GridPainter } from './GridPainter.ts';
import { drawJewelPolygon } from './JewelShape.ts';
import { parityLayers } from './polygonClip.ts';
import type { DragInfo, PlayViewSnapshot } from '../application/playController.ts';
import { ANIM_TOKENS, COLOR_NUMBERS, DEPTH_TOKENS, LAYOUT_TOKENS, PIECE_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
```

(b) Thêm trường `private readonly trayCount: number;` sau `private trayFrame ...`, đổi constructor thành `constructor(scene: Phaser.Scene, layout: LayoutMetrics, trayCount: number = 2)` và gán `this.trayCount = trayCount;` ngay sau `this.layout = layout;`.

(c) Trong `drawStaticBoard`, thay khối `// 6. Khay: ...` (từ `if (this.trayWells.length === 0) {` đến `}` đóng) bằng:

```ts
    // 6. Khay: mỗi mảnh một ô lõm trong suốt. Trước đây là một hộp đen đặc
    // che luôn cả nút Đặt lại phía sau.
    if (this.trayWells.length === 0) {
      for (const rect of trayWellRects(this.layout, this.trayCount)) {
        this.trayWells.push(
          this.scene.add
            .image(rect.x, rect.y, TEXTURE_KEYS.trayWell)
            .setOrigin(0, 0)
            .setDisplaySize(rect.width, rect.height)
            // Dưới lớp mảnh (placedPieces), nếu không ô lõm phủ lên mảnh
            .setDepth(DEPTH_TOKENS.steleBoard)
        );
      }
    }
```

Nếu sau thay đổi biến `cellPixel` trong `drawStaticBoard` không còn được dùng, bỏ nó khỏi destructuring để typecheck không cảnh báo.

(d) Thay toàn bộ từ `public render(` đến hết hàm `drawVictoryCelebration` (giữ nguyên `drawSparkleStar` và `destroy`) bằng:

```ts
  /**
   * Render toàn bộ khung hình gameplay với 5 trạng thái
   */
  public render(
    level: Level,
    snapshot: PlayViewSnapshot,
    piecesState: Record<string, PieceState>,
    delta: number = 16
  ): void {
    const draggingPieceId = snapshot.dragInfo?.pieceId ?? null;

    // Cập nhật vòng quay thiên văn
    this.updateCelestialRings(delta, snapshot.phase === 'won');

    // 1. Bóng mục tiêu mờ (Target Silhouette)
    this.drawTargetSilhouette(level, snapshot);

    // 2. Vẽ các mảnh ghép
    this.piecesGraphics.clear();
    this.fxGraphics.clear();

    const snappedPieces: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }> = [];

    for (let i = 0; i < level.pieces.length; i++) {
      const piece = level.pieces[i];
      const pState = piecesState[piece.id] ?? { kind: 'tray', turns: 0 };
      const isSelected = snapshot.selectedPieceId === piece.id;
      const isDraggingThis = piece.id === draggingPieceId;

      if (isDraggingThis && snapshot.dragInfo) {
        // Trạng thái 1: Đang kéo (Dragging)
        if (pState.kind === 'tray') {
          this.drawTrayPlaceholder(piece, pState, i);
        }
        this.drawDraggingPiece(piece, pState.turns, snapshot.dragInfo);
      } else if (pState.kind === 'tray') {
        this.drawTrayPiece(piece, pState, i, isSelected);
      } else if (pState.kind === 'temporary') {
        // Trạng thái 4: Mảnh tạm chưa snap
        this.drawTemporaryPiece(piece, pState, isSelected);
      } else {
        // Trạng thái 2: Đã snap
        snappedPieces.push({ piece, pState });
        this.drawSnappedPiece(piece, pState);
      }
    }

    // Trạng thái 3: Vùng chồng lớp theo luật chẵn/lẻ
    if (snappedPieces.length >= 2) {
      this.drawOverlapInversion(snappedPieces);
    }

    // Trạng thái 5: Hoàn thành (Victory Celebration)
    if (snapshot.phase === 'won') {
      this.victoryPulse += delta * 0.004;
      this.drawVictoryCelebration(level);
    }
  }

  /**
   * Bóng mục tiêu: từng đa giác của nghiệm mẫu. Ở Chương 1 các mảnh của nghiệm
   * không bao giờ giao nhau (validator chặn), nên vẽ riêng rẽ là đúng. Bóng mờ
   * có lỗ rỗng (Chương 2) cần kỹ thuật khác và để cho spec sau.
   */
  private drawTargetSilhouette(level: Level, snapshot: PlayViewSnapshot): void {
    this.targetGraphics.clear();
    if (!snapshot.showTarget) return;

    const drag = snapshot.dragInfo;
    for (const placement of level.targetPlacements ?? []) {
      const piece = level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) continue;
      const anchor = piece.anchors.find((a) => a.x === placement.x && a.y === placement.y);
      const isHovered =
        drag !== null &&
        drag.pieceId === piece.id &&
        anchor !== undefined &&
        drag.snapCandidateId === anchor.id;

      drawJewelPolygon(
        this.targetGraphics,
        piecePolygonCanvas(piece, placement.x, placement.y, placement.turns, this.layout),
        {
          variant: 'target',
          alpha: isHovered ? 1 : 0.7,
          sizePx: pieceRadiusPx(piece.frameSize, this.layout),
        }
      );
    }
  }

  /**
   * Trạng thái 1: Đang kéo (Dragging) - Phóng to và đổ bóng mềm
   */
  private drawDraggingPiece(piece: Piece, turns: number, dragInfo: DragInfo): void {
    const isHoveringSnap = dragInfo.snapCandidateId !== null;
    const framePx = piece.frameSize * this.layout.cellPixel * ANIM_TOKENS.scale.dragging;
    const points = piecePolygonAround(piece, turns, dragInfo.x, dragInfo.y, framePx);

    // Đổ bóng mềm xuống mặt bàn
    this.piecesGraphics.fillStyle(0x000000, 0.45);
    this.piecesGraphics.fillPoints(
      points.map((p) => new Phaser.Geom.Point(p.x + 8, p.y + 12)),
      true
    );

    // Thân mảnh vàng hổ phách sáng
    drawJewelPolygon(this.piecesGraphics, points, {
      variant: 'ghost',
      alpha: isHoveringSnap ? 1 : PIECE_TOKENS.ghostAlpha,
      sizePx: framePx / 2,
    });
  }

  private trayPoints(piece: Piece, pState: PieceState, trayIndex: number): { points: Array<{ x: number; y: number }>; radius: number } {
    const hitbox = pieceHitbox(piece, pState, this.layout, trayIndex, this.trayCount);
    const cx = hitbox.x + hitbox.width / 2;
    const cy = hitbox.y + hitbox.height / 2;
    const radius = trayPieceRadiusPx(this.layout, this.trayCount);
    return { points: piecePolygonAround(piece, pState.turns, cx, cy, radius * 2), radius };
  }

  private drawTrayPlaceholder(piece: Piece, pState: PieceState, trayIndex: number): void {
    const { points, radius } = this.trayPoints(piece, pState, trayIndex);
    drawJewelPolygon(this.piecesGraphics, points, { variant: 'placeholder', sizePx: radius });
  }

  private drawTrayPiece(piece: Piece, pState: PieceState, trayIndex: number, isSelected: boolean): void {
    const { points, radius } = this.trayPoints(piece, pState, trayIndex);
    drawJewelPolygon(this.piecesGraphics, points, {
      variant: 'solid',
      alpha: isSelected ? 1 : 0.9,
      sizePx: radius,
    });
  }

  /**
   * Trạng thái 4: Mảnh tạm (Temporary Placement)
   * Hiển thị độ mờ 60% và chấm chú thích phía trên
   */
  private drawTemporaryPiece(
    piece: Piece,
    pState: Extract<PieceState, { kind: 'temporary' }>,
    isSelected: boolean
  ): void {
    const radiusPx = pieceRadiusPx(piece.frameSize, this.layout);
    drawJewelPolygon(
      this.piecesGraphics,
      piecePolygonCanvas(piece, pState.x, pState.y, pState.turns, this.layout),
      { variant: 'ghost', alpha: isSelected ? 0.85 : 0.6, sizePx: radiusPx }
    );

    const center = pieceCenterCanvas(piece.frameSize, pState.x, pState.y, this.layout);
    this.fxGraphics.lineStyle(1, COLOR_NUMBERS.textSecondary, 0.4);
    this.fxGraphics.strokeCircle(center.x, center.y - radiusPx - 14, 4);
  }

  /**
   * Trạng thái 2: Đã snap (Snapped)
   */
  private drawSnappedPiece(piece: Piece, pState: Extract<PieceState, { kind: 'snapped' }>): void {
    const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
    if (!anchor) return;

    drawJewelPolygon(
      this.piecesGraphics,
      piecePolygonCanvas(piece, anchor.x, anchor.y, pState.turns, this.layout),
      { variant: 'solid', sizePx: pieceRadiusPx(piece.frameSize, this.layout) }
    );
  }

  /**
   * Trạng thái 3: Vùng chồng lớp theo luật chẵn/lẻ.
   * Lớp đơn đã được vẽ ở drawSnappedPiece; ở đây chỉ phủ các giao từ hai lớp
   * trở lên: lớp chẵn về màu mặt bàn (vùng biến mất), lớp lẻ về màu mảnh.
   */
  private drawOverlapInversion(
    snapped: Array<{ piece: Piece; pState: Extract<PieceState, { kind: 'snapped' }> }>
  ): void {
    const polygons = snapped.flatMap(({ piece, pState }) => {
      const anchor = piece.anchors.find((a) => a.id === pState.anchorId);
      return anchor ? [piecePolygonCanvas(piece, anchor.x, anchor.y, pState.turns, this.layout)] : [];
    });

    for (const layer of parityLayers(polygons)) {
      if (layer.depth < 2) continue;
      const pts = layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y));
      if (layer.filled) {
        this.fxGraphics.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
        this.fxGraphics.fillPoints(pts, true);
      } else {
        // Triệt tiêu quang học về màu mặt bia, rìa trong sáng nhẹ màu vàng nhạt
        this.fxGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
        this.fxGraphics.fillPoints(pts, true);
        this.fxGraphics.lineStyle(1.5, COLOR_NUMBERS.amberGlow, 0.7);
        this.fxGraphics.strokePoints(pts, true, true);
      }
    }
  }

  /**
   * Trạng thái 5: Hoàn thành (Victory Celebration)
   */
  private drawVictoryCelebration(level: Level): void {
    // Ngôi sao 4 cánh lấp lánh tại trọng tâm hình mục tiêu
    const centroid = maskCentroid(level.targetMask) ?? { x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
    const contact = gridToCanvas(centroid.x, centroid.y, this.layout);

    const sparkleSize = 16 + Math.sin(this.victoryPulse) * 4;
    this.drawSparkleStar(this.fxGraphics, contact.x, contact.y, sparkleSize, 0xffffff, COLOR_NUMBERS.amberSolid);

    // Vệt sáng chạy quanh viền tấm bia
    const { boardBounds } = this.layout;
    this.fxGraphics.lineStyle(2.5, COLOR_NUMBERS.amberGlow, 0.6 + Math.sin(this.victoryPulse) * 0.3);
    this.fxGraphics.strokeRoundedRect(
      boardBounds.x - 2,
      boardBounds.y - 2,
      boardBounds.width + 4,
      boardBounds.height + 4,
      38
    );
  }
```

- [ ] **Step 5: `TargetBadge` vẽ mục tiêu bằng đa giác**

Trong `game-next/src/presentation/TargetBadge.ts`:

(a) Thêm import:

```ts
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import { parityLayers } from './polygonClip.ts';
```

(b) Trong `drawTargetSilhouette`, giữ nguyên phần tìm bounding box từ `targetMask`, nhưng đổi hai dòng tâm thành (đa giác dùng toạ độ liên tục nên mép phải của ô cuối là `max + 1`):

```ts
    const centerX = (minX + maxX + 1) / 2;
    const centerY = (minY + maxY + 1) / 2;
```

(c) Thay toàn bộ phần còn lại của hàm sau dòng `const scale = Math.min(92 / w, 64 / h);` (nhánh riêng cho `level.id === '1-1'` và vòng tô từng ô) bằng:

```ts
    // Vẽ vector từ placement của nghiệm mẫu, mọi màn dùng chung một đường:
    // trước đây 1-1 có nhánh riêng còn màn khác tô từng ô của mask (răng cưa).
    const polygons = (level.targetPlacements ?? []).flatMap((placement) => {
      const piece = level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return [];
      const kind = piece.shapeKind ?? 'diamond';
      const orientation = effectiveOrientation(kind, piece.orientation ?? 0, placement.turns);
      return [
        shapePolygon(kind, orientation, piece.frameSize).map((v) => ({
          x: (placement.x + v.x - centerX) * scale,
          y: (placement.y + v.y - centerY) * scale,
        })),
      ];
    });

    for (const layer of parityLayers(polygons)) {
      g.fillStyle(layer.filled ? COLOR_NUMBERS.amberSolid : COLOR_NUMBERS.boardSurfaceTop, 1);
      g.fillPoints(
        layer.points.map((p) => new Phaser.Geom.Point(p.x, p.y)),
        true
      );
    }
```

(d) Chạy `grep -n "drawSolidDiamond" src/presentation/TargetBadge.ts`. Nếu chỉ còn định nghĩa hàm, xoá hàm `drawSolidDiamond`.

- [ ] **Step 6: `PlayScene` truyền số ô khay và tâm hiệu ứng thắng**

Trong `game-next/src/presentation/PlayScene.ts`:

(a) Thêm import `import { maskCentroid } from '../domain/mask.ts';`.

(b) Đổi `this.boardRenderer = new BoardRenderer(this, layout);` thành:

```ts
    this.boardRenderer = new BoardRenderer(this, layout, this.level.pieces.length);
```

(c) Trong `autosolve`, đổi dòng hitbox thành:

```ts
      const start = pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, index, pieces.length);
```

(d) Trong `playCelebration`, thay hai dòng

```ts
    // Tâm bàn, nơi hai hình thoi chạm đỉnh nhau
    const center = gridToCanvas(GRID_WIDTH / 2, GRID_HEIGHT / 2, layout);
```

bằng:

```ts
    // Trọng tâm hình mục tiêu (với 1-1 là tâm bàn, nơi hai thoi chạm đỉnh)
    const centroid = maskCentroid(this.level.targetMask) ?? { x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
    const center = gridToCanvas(centroid.x, centroid.y, layout);
```

- [ ] **Step 7: Typecheck và test**

Run: `npm run typecheck && npm test`
Expected: xanh. Import thừa (ví dụ `drawJewel` không còn dùng trong `BoardRenderer`) phải được bỏ.

- [ ] **Step 8: Chụp ảnh "sau" và đối chiếu**

Dev server vẫn chạy (Vite tự nạp lại). Run: `bash scripts/shoot-level.sh 1-1 ../docs/testing/levels/screens 5173 campaign 1-1-after`

Mở từng cặp ảnh `1-1-before-*.png` / `1-1-after-*.png` và so:
- `play`: hai thoi trong khay cùng vị trí và cùng kích thước; bóng mục tiêu hai thoi nét đứt ở giữa bàn.
- `drag`: thoi D1 đã khớp, D2 đang kéo gần đích, có bóng đổ.
- `win`: ngôi sao lấp lánh tại điểm hai thoi chạm nhau; huy hiệu mục tiêu phía trên bàn vẫn là hai thoi đặc.

Chênh lệch chấp nhận được: tối đa vài pixel ở viền do quy tắc ô biên (tâm hiệu ứng lệch 0,5 ô = 2,5px sang trái). Mọi khác biệt khác (hình đổi, mất quầng sáng, khay lệch) là lỗi: sửa trước khi commit.

- [ ] **Step 9: CHANGELOG và commit**

Mục `### 2026-10-02 - Render real piece polygons, exact parity overlap and N-slot tray` (liệt kê file, ghi đối chiếu ảnh 1-1 trước/sau). Message: `feat(render): draw real piece polygons with exact even-odd overlap`.

```bash
git add src/domain/mask.ts src/presentation/BoardRenderer.ts src/presentation/TargetBadge.ts src/presentation/PlayScene.ts scripts/shoot-level.sh tests/boardRenderer.test.ts ../docs/testing/levels/screens ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 9: Chế độ harness qua URL ở dev

**Files:**
- Create: `game-next/src/launchParams.ts`
- Modify: `game-next/src/main.ts`
- Modify: `game-next/src/presentation/PlayScene.ts` (`onNextLevel`)
- Test: `game-next/tests/launchParams.test.ts`

**Interfaces:**
- Consumes: không có.
- Produces:
  - `type LaunchTarget = { scene: 'MenuScene' } | { scene: 'LevelSelectScene' } | { scene: 'PlayScene'; levelId: string; mode: 'campaign' | 'harness' }`
  - `resolveLaunch(search: string, isDev: boolean): LaunchTarget` — `mode=harness` chỉ có hiệu lực khi `isDev`.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/launchParams.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { resolveLaunch } from '../src/launchParams.ts';

describe('resolveLaunch', () => {
  test('mặc định mở menu', () => {
    expect(resolveLaunch('', true)).toEqual({ scene: 'MenuScene' });
  });

  test('chọn màn chơi, mặc định 1-1 ở campaign', () => {
    expect(resolveLaunch('?scene=play', false)).toEqual({ scene: 'PlayScene', levelId: '1-1', mode: 'campaign' });
    expect(resolveLaunch('?scene=play&level=1-3', false)).toEqual({ scene: 'PlayScene', levelId: '1-3', mode: 'campaign' });
  });

  test('harness chỉ bật ở dev', () => {
    expect(resolveLaunch('?scene=play&level=1-3&mode=harness', true)).toEqual({
      scene: 'PlayScene',
      levelId: '1-3',
      mode: 'harness',
    });
    expect(resolveLaunch('?scene=play&level=1-3&mode=harness', false)).toEqual({
      scene: 'PlayScene',
      levelId: '1-3',
      mode: 'campaign',
    });
  });

  test('mở thẳng màn chọn màn', () => {
    expect(resolveLaunch('?scene=levelSelect', false)).toEqual({ scene: 'LevelSelectScene' });
  });
});
```

Run: `npx vitest run tests/launchParams.test.ts`
Expected: FAIL — không resolve được `launchParams.ts`.

- [ ] **Step 2: Viết `launchParams.ts`**

Tạo `game-next/src/launchParams.ts`:

```ts
export type LaunchTarget =
  | { scene: 'MenuScene' }
  | { scene: 'LevelSelectScene' }
  | { scene: 'PlayScene'; levelId: string; mode: 'campaign' | 'harness' };

/**
 * Đọc tham số URL lúc khởi động. `mode=harness` cho phép nạp màn `validated`
 * để chơi thử trước khi duyệt, nên chỉ có hiệu lực trên bản dev: bản build
 * thường luôn chạy campaign và chỉ nạp màn `approved`.
 */
export function resolveLaunch(search: string, isDev: boolean): LaunchTarget {
  const params = new URLSearchParams(search);
  const scene = params.get('scene');
  if (scene === 'play') {
    const levelId = params.get('level') ?? '1-1';
    const mode = isDev && params.get('mode') === 'harness' ? 'harness' : 'campaign';
    return { scene: 'PlayScene', levelId, mode };
  }
  if (scene === 'levelSelect') {
    return { scene: 'LevelSelectScene' };
  }
  return { scene: 'MenuScene' };
}
```

Run: `npx vitest run tests/launchParams.test.ts`
Expected: PASS (4 test).

- [ ] **Step 3: Dùng trong `main.ts`**

Trong `game-next/src/main.ts`:

(a) Thêm import `import { resolveLaunch } from './launchParams.ts';`.

(b) Thay ba dòng

```ts
const urlParams = new URLSearchParams(window.location.search);
const initialScene = urlParams.get('scene');
const initialLevel = urlParams.get('level') ?? '1-1';
```

bằng:

```ts
const launch = resolveLaunch(window.location.search, import.meta.env.DEV);
```

(c) Thay toàn bộ khối `if (initialScene === 'play') { ... } else if (initialScene === 'levelSelect') { ... }` bằng:

```ts
if (launch.scene !== 'MenuScene') {
  game.events.once('ready', () => {
    game.scene.stop('MenuScene');
    if (launch.scene === 'PlayScene') {
      game.scene.start('PlayScene', { levelId: launch.levelId, mode: launch.mode });
    } else {
      game.scene.start('LevelSelectScene');
    }
  });
}
```

- [ ] **Step 4: Màn kế tiếp giữ nguyên chế độ**

Trong `game-next/src/presentation/PlayScene.ts`, callback `onNextLevel`, thay khối `try { ... } catch { ... }` bằng:

```ts
          try {
            // Kiểm tra theo đúng chế độ đang chơi: ở campaign, màn kế chưa
            // approved thì về menu thay vì nạp rồi lặng lẽ rơi về 1-1.
            loadLevel(nextId, this.mode);
            this.scene.start('PlayScene', { levelId: nextId, mode: this.mode });
          } catch {
            this.scene.start('MenuScene');
          }
```

- [ ] **Step 5: Kiểm tra trên dev server**

Run: `npm run typecheck && npm test`. Trên dev server đang chạy, chụp `bash scripts/shoot-level.sh 1-1 ../docs/testing/levels/screens 5173 harness 1-1-harness` và xác nhận ảnh `1-1-harness-play.png` hiện màn 1-1 (harness cho phép cả màn approved). Xoá ba ảnh `1-1-harness-*` sau khi xem (không commit).

- [ ] **Step 6: CHANGELOG và commit**

Mục `### 2026-10-02 - Add dev-only harness mode via URL`. Message: `feat(app): add dev-only harness launch mode for validated levels`.

```bash
git add src/launchParams.ts src/main.ts src/presentation/PlayScene.ts tests/launchParams.test.ts ../CHANGELOG.md
git commit -F <file chứa message>
```

---

## Kết thúc giai đoạn 2

Kiểm tra trước khi sang giai đoạn 3: `npm run typecheck && npm test && npm run content:validate && npm run build` xanh; ảnh 1-1 trước/sau đã commit trong `docs/testing/levels/screens/`; dừng dev server.

# improve-v1 — Giai đoạn 3/4: Mảnh ngọc, khung kính và HUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vẽ lại mảnh ghép thành viên ngọc thoi bốn mặt vát, thay khung bia bevel thủ công bằng khung kính dùng chung, và áp mockup lên HUD.

**Architecture:** `jewelGeometry.ts` giữ phần hình học thuần (test được), `JewelShape.ts` dịch nó thành lệnh vẽ Phaser với bốn variant. Gradient và quầng sáng dùng canvas texture vì Phaser `Graphics` không có gradient fill. Khung kính thành một texture 9-slice dùng chung cho bàn, khay và sau này các dialog.

**Tech Stack:** TypeScript (ESM, `.ts` extension trong import), Phaser 3.90, Vite, Vitest, Capacitor (Android).

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

**Giao được gì sau giai đoạn này:** Màn chơi xong hẳn: mảnh ngọc có bốn mặt vát và mặt bàn sáng, bàn và khay bọc khung băng, HUD có tiêu đề serif, nút tròn viền băng, thanh đếm mảnh và nhãn "Thả để khớp".

## Vị trí trong loạt plan

- **Chạy sau:** `2026-10-01-gui-improve-v1-2-module-dung-chung.md` — phải xong và xanh trước khi bắt đầu plan này.
- **Chạy tiếp theo:** `2026-10-01-gui-improve-v1-4-cac-man-con-lai.md`

Chỉ mục cả loạt: `docs/superpowers/plans/2026-10-01-gui-improve-v1-index.md`

## Global Constraints

Áp dụng cho **mọi** task bên dưới:

- Thư mục làm việc: `game-next/`. Mọi lệnh `npm` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`** (`import { x } from './y.ts'`). Đây là cấu hình ESM của repo; bỏ đuôi sẽ gãy lúc build.
- Comment và chuỗi hiển thị cho người dùng viết bằng **tiếng Việt**, theo đúng văn phong các file hiện có. Tên biến/hàm bằng tiếng Anh.
- Không dùng ALL-CAPS trong văn bản giao diện (`tests/hud.test.ts` đang kiểm điều này).
- Sau mỗi task: `npm run typecheck` và `npm run test` phải xanh trước khi commit.
- Test viết bằng `vitest`, import `{ describe, expect, test } from 'vitest'`. Không mock Phaser — test hàm thuần và dữ liệu export, không test lệnh vẽ.
- Canvas giữ nguyên 720×1280. Không đổi `GRID_WIDTH` (128).
- Bảng màu bắt buộc (chép nguyên văn từ spec):
  - Trời: `#1A2470` / `#2B3192` / `#4A3A9E` / `#6B4BA8`
  - Mặt bàn: `#1D3482` → `#14215E`
  - Viền băng: `#A9E3FF`; khung kính `#E6F7FF` / `#8BD3F5` / `#4E9BD0` / `#2D5E9A`
  - Lưới: mảnh `#9CC8FF` @.13, module `#FFD27A` @.30, trục `#FFD27A` @.60, chéo `#8FE0FF` @.16, vạch `#FFE3A0` @.75
  - Mặt ngọc: Bắc `#FFEAA8`, Đông `#FFD56E`, Nam `#EFA53A`, Tây `#F9BF4F`, viền `#FFF4CC`
- Hệ số đo bắt buộc: ô logic 5px, lưới 128×160, bàn 640×800 tại (40, 200), ô lưới hiển thị 8 ô logic = 40px, module 3 ô lưới = 120px, nửa đường chéo mảnh 24 ô logic = 120px.


## Ghi chú riêng cho giai đoạn này

`render()` của `BoardRenderer` chạy mỗi khung hình. Đừng bao giờ gọi `scene.add.*` bên trong nó — Task 6 Step 7 ghi rõ cái bẫy này và cách tránh.

---

### Task 6: Mảnh ngọc bốn mặt vát

**Files:**
- Create: `game-next/src/presentation/jewelGeometry.ts`
- Create: `game-next/src/presentation/JewelShape.ts`
- Modify: `game-next/src/presentation/TextureFactory.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Create: `game-next/tests/jewelGeometry.test.ts`
- Modify: `game-next/tests/textureFactory.test.ts`

**Interfaces:**
- Consumes: `PIECE_TOKENS`, `COLOR_NUMBERS` từ Task 1.
- Produces:
  - `type Point = { x: number; y: number }`
  - `jewelOutline(cx: number, cy: number, radius: number): Point[]` — 4 đỉnh, bắt đầu từ đỉnh Bắc, theo chiều kim đồng hồ
  - `jewelFaces(cx, cy, radius): { name: 'north'|'east'|'south'|'west'; points: Point[]; color: string }[]`
  - `jewelTable(cx, cy, radius): Point[]`
  - `jewelSpineLines(cx, cy, radius): Array<{ from: Point; to: Point }>`
  - `drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void` với `type JewelOptions = { cx: number; cy: number; radius: number; variant: 'solid' | 'ghost' | 'target' | 'placeholder'; alpha?: number }`
  - `TEXTURE_KEYS.jewelGlow`, `TEXTURE_KEYS.jewelTable`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/jewelGeometry.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  jewelOutline,
  jewelFaces,
  jewelTable,
  jewelSpineLines,
} from '../src/presentation/jewelGeometry.ts';
import { PIECE_TOKENS } from '../src/presentation/designTokens.ts';

const CX = 360;
const CY = 600;
const R = 120; // một module

describe('jewelGeometry', () => {
  test('viền ngoài là bốn đỉnh, bắt đầu từ Bắc theo chiều kim đồng hồ', () => {
    expect(jewelOutline(CX, CY, R)).toEqual([
      { x: CX, y: CY - R },
      { x: CX + R, y: CY },
      { x: CX, y: CY + R },
      { x: CX - R, y: CY },
    ]);
  });

  test('thoi là hình vuông xoay 45 độ: hai đường chéo bằng nhau và vuông góc', () => {
    const [n, e, s, w] = jewelOutline(CX, CY, R);
    expect(Math.hypot(s.x - n.x, s.y - n.y)).toBeCloseTo(2 * R, 6);
    expect(Math.hypot(e.x - w.x, e.y - w.y)).toBeCloseTo(2 * R, 6);
    // Đường chéo dọc và ngang vuông góc
    expect((s.x - n.x) * (e.x - w.x) + (s.y - n.y) * (e.y - w.y)).toBeCloseTo(0, 6);
  });

  test('mỗi cạnh có hệ số góc 45 độ, nên nằm trên đường chéo của lưới', () => {
    const pts = jewelOutline(CX, CY, R);
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      expect(Math.abs((b.y - a.y) / (b.x - a.x))).toBeCloseTo(1, 6);
    }
  });

  test('bốn mặt vát, mỗi mặt một tam giác từ tâm, màu sáng ở trên-trái', () => {
    const faces = jewelFaces(CX, CY, R);
    expect(faces.map((f) => f.name)).toEqual(['north', 'east', 'south', 'west']);
    for (const face of faces) {
      expect(face.points).toHaveLength(3);
      expect(face.points).toContainEqual({ x: CX, y: CY });
    }
    expect(faces[0].color).toBe(PIECE_TOKENS.faceNorth);
    expect(faces[1].color).toBe(PIECE_TOKENS.faceEast);
    expect(faces[2].color).toBe(PIECE_TOKENS.faceSouth);
    expect(faces[3].color).toBe(PIECE_TOKENS.faceWest);
  });

  test('mặt bàn là thoi nhỏ đồng tâm, bán kính theo tỉ lệ token', () => {
    const table = jewelTable(CX, CY, R);
    expect(table).toHaveLength(4);
    const expectedR = R * PIECE_TOKENS.tableRatio;
    expect(table[0]).toEqual({ x: CX, y: CY - expectedR });
    expect(table[2]).toEqual({ x: CX, y: CY + expectedR });
  });

  test('bốn đoạn nối từ đỉnh vào mặt bàn, không cắt qua tâm', () => {
    const lines = jewelSpineLines(CX, CY, R);
    expect(lines).toHaveLength(4);
    const tableR = R * PIECE_TOKENS.tableRatio;
    for (const line of lines) {
      const distFrom = Math.hypot(line.from.x - CX, line.from.y - CY);
      const distTo = Math.hypot(line.to.x - CX, line.to.y - CY);
      expect(distFrom).toBeCloseTo(R, 6);
      expect(distTo).toBeCloseTo(tableR, 6);
    }
  });

  test('đỉnh mảnh rơi đúng giao điểm lưới khi tâm và bán kính là bội số ô lưới', () => {
    // Tâm (40*5, 80*5) = (200, 400) trên canvas, bán kính một module
    const pts = jewelOutline(200, 400, 120);
    for (const p of pts) {
      expect((p.x - 200) % 40 === 0 || (p.y - 400) % 40 === 0).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/jewelGeometry.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `jewelGeometry.ts`.

- [ ] **Step 3: Viết `jewelGeometry.ts`**

Tạo `game-next/src/presentation/jewelGeometry.ts`:

```ts
import { PIECE_TOKENS } from './designTokens.ts';

export type Point = { x: number; y: number };

export type JewelFace = {
  name: 'north' | 'east' | 'south' | 'west';
  points: Point[];
  color: string;
};

/**
 * Bốn đỉnh hình thoi, bắt đầu từ đỉnh Bắc theo chiều kim đồng hồ.
 *
 * Thoi là hình vuông xoay 45 độ: hai đường chéo nằm trên đường kẻ ngang và
 * dọc của lưới, nên mỗi cạnh có hệ số góc 45 độ và trùng đường chéo của lưới.
 */
export function jewelOutline(cx: number, cy: number, radius: number): Point[] {
  return [
    { x: cx, y: cy - radius },
    { x: cx + radius, y: cy },
    { x: cx, y: cy + radius },
    { x: cx - radius, y: cy },
  ];
}

/**
 * Bốn mặt vát, mỗi mặt là tam giác nối tâm với hai đỉnh kề.
 * Sáng ở trên-trái, tối dần xuống dưới-phải — đó là thứ tạo cảm giác viên ngọc
 * thay vì một mảng màu phẳng.
 */
export function jewelFaces(cx: number, cy: number, radius: number): JewelFace[] {
  const [n, e, s, w] = jewelOutline(cx, cy, radius);
  const center = { x: cx, y: cy };
  return [
    { name: 'north', points: [n, center, w], color: PIECE_TOKENS.faceNorth },
    { name: 'east', points: [n, e, center], color: PIECE_TOKENS.faceEast },
    { name: 'south', points: [e, s, center], color: PIECE_TOKENS.faceSouth },
    { name: 'west', points: [s, w, center], color: PIECE_TOKENS.faceWest },
  ];
}

/** Mặt bàn: thoi nhỏ đồng tâm, nơi ánh sáng tụ lại. */
export function jewelTable(cx: number, cy: number, radius: number): Point[] {
  return jewelOutline(cx, cy, radius * PIECE_TOKENS.tableRatio);
}

/** Bốn đoạn nối từ mỗi đỉnh vào mặt bàn. */
export function jewelSpineLines(
  cx: number,
  cy: number,
  radius: number
): Array<{ from: Point; to: Point }> {
  const outer = jewelOutline(cx, cy, radius);
  const inner = jewelTable(cx, cy, radius);
  return outer.map((from, index) => ({ from, to: inner[index] }));
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/jewelGeometry.test.ts
```

Kỳ vọng: PASS, 7 test.

- [ ] **Step 5: Thêm hai texture gradient vào `TextureFactory`**

Trong `game-next/src/presentation/TextureFactory.ts`, thêm hai khoá vào `TEXTURE_KEYS`:

```ts
  jewelGlow: 'jewel_glow',
  jewelTable: 'jewel_table',
```

Và thêm hai hàm sinh, gọi từ `generateAll` (theo đúng cách các texture khác đang được sinh trong file này):

```ts
  /**
   * Quầng sáng mờ phía sau mảnh. Phaser Graphics không có gradient fill nên
   * dựng bằng canvas texture.
   */
  private static makeJewelGlow(scene: Phaser.Scene): void {
    const size = 256;
    const texture = scene.textures.createCanvas(TEXTURE_KEYS.jewelGlow, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 200, 87, 0.70)');
    gradient.addColorStop(1, 'rgba(255, 200, 87, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  /** Mặt bàn gradient chéo, từ trắng ngà sang hổ phách. */
  private static makeJewelTable(scene: Phaser.Scene): void {
    const size = 128;
    const texture = scene.textures.createCanvas(TEXTURE_KEYS.jewelTable, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(255, 251, 234, 0.95)');
    gradient.addColorStop(0.55, 'rgba(255, 226, 154, 0.60)');
    gradient.addColorStop(1, 'rgba(246, 180, 67, 0.50)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }
```

Thêm vào `tests/textureFactory.test.ts`, trong khối `describe` sẵn có:

```ts
  test('có texture gradient cho quầng sáng và mặt bàn mảnh ngọc', () => {
    expect(TEXTURE_KEYS.jewelGlow).toBe('jewel_glow');
    expect(TEXTURE_KEYS.jewelTable).toBe('jewel_table');
  });
```

- [ ] **Step 6: Viết `JewelShape.ts`**

Tạo `game-next/src/presentation/JewelShape.ts`:

```ts
import Phaser from 'phaser';
import { PIECE_TOKENS } from './designTokens.ts';
import { jewelOutline, jewelFaces, jewelTable, jewelSpineLines } from './jewelGeometry.ts';
import type { Point } from './jewelGeometry.ts';

export type JewelVariant = 'solid' | 'ghost' | 'target' | 'placeholder';

export type JewelOptions = {
  cx: number;
  cy: number;
  radius: number;
  variant: JewelVariant;
  alpha?: number;
};

function hex(value: string): number {
  return Phaser.Display.Color.HexStringToColor(value).color;
}

function toGeomPoints(points: Point[]): Phaser.Geom.Point[] {
  return points.map((p) => new Phaser.Geom.Point(p.x, p.y));
}

function strokeDashedPolygon(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  dash: readonly number[]
): void {
  const [on, off] = dash;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / length;
    const uy = (b.y - a.y) / length;
    let travelled = 0;
    while (travelled < length) {
      const end = Math.min(travelled + on, length);
      g.lineBetween(a.x + ux * travelled, a.y + uy * travelled, a.x + ux * end, a.y + uy * end);
      travelled = end + off;
    }
  }
}

/**
 * Vẽ một mảnh ngọc thoi.
 *
 * Viền vẽ phía trong mảnh (bán kính trừ nửa độ dày viền) để mép trùng đúng
 * đường kẻ lưới — quy tắc "vẽ đúng đến từng pixel" của GridSpec.
 */
export function drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void {
  const { cx, cy, radius, variant } = opts;
  const alpha = opts.alpha ?? (variant === 'ghost' ? PIECE_TOKENS.ghostAlpha : 1);

  if (variant === 'target') {
    g.fillStyle(hex(PIECE_TOKENS.targetFill.color), PIECE_TOKENS.targetFill.alpha * alpha);
    g.fillPoints(toGeomPoints(jewelOutline(cx, cy, radius)), true);
    g.lineStyle(
      PIECE_TOKENS.targetStroke.width,
      hex(PIECE_TOKENS.targetStroke.color),
      PIECE_TOKENS.targetStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.targetStroke.dash);
    return;
  }

  if (variant === 'placeholder') {
    g.lineStyle(
      PIECE_TOKENS.placeholderStroke.width,
      hex(PIECE_TOKENS.placeholderStroke.color),
      PIECE_TOKENS.placeholderStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.placeholderStroke.dash);
    return;
  }

  // solid và ghost: bốn mặt vát, mặt bàn, đoạn nối, viền trong
  for (const face of jewelFaces(cx, cy, radius)) {
    g.fillStyle(hex(face.color), alpha);
    g.fillPoints(toGeomPoints(face.points), true);
  }

  g.fillStyle(hex(PIECE_TOKENS.tableStops[1]), 0.6 * alpha);
  g.fillPoints(toGeomPoints(jewelTable(cx, cy, radius)), true);

  g.lineStyle(1, hex('#FFF7DA'), 0.45 * alpha);
  for (const line of jewelSpineLines(cx, cy, radius)) {
    g.lineBetween(line.from.x, line.from.y, line.to.x, line.to.y);
  }

  const inset = PIECE_TOKENS.outlineWidth / 2;
  g.lineStyle(PIECE_TOKENS.outlineWidth, hex(PIECE_TOKENS.outline), alpha);
  g.strokePoints(toGeomPoints(jewelOutline(cx, cy, radius - inset)), true, true);
}
```

- [ ] **Step 7: Chuyển `BoardRenderer` sang `drawJewel`**

Trong `game-next/src/presentation/BoardRenderer.ts`:

1. Thêm `import { drawJewel } from './JewelShape.ts';`
2. **Xoá** phương thức `drawVectorDiamond` (từ dòng 281 tới hết thân nó).
3. Đổi `radiusPx` trong `render()` — nửa đường chéo giờ là 24 ô logic:

```ts
    const radiusPx = 24 * cellPixel; // 24 ô logic = 1 module = 120px
```

4. Thay mọi lời gọi `this.drawVectorDiamond(...)`:
   - Bóng mục tiêu → `drawJewel(this.targetGraphics, { cx: center.x, cy: center.y, radius: radiusPx, variant: 'target', alpha: isHovered ? 1 : 0.7 })`
   - Mảnh đã snap và mảnh trong khay → `drawJewel(this.piecesGraphics, { cx, cy, radius: radiusPx, variant: 'solid' })`
   - Mảnh đang kéo → `drawJewel(this.fxGraphics, { cx, cy, radius: radiusPx * 1.06, variant: 'ghost' })`
   - Ô trống trong khay → `drawJewel(this.piecesGraphics, { cx, cy, radius: radiusPx, variant: 'placeholder' })`

   Trong đó `cx`, `cy` là tâm mảnh — các hàm `drawTrayPiece`, `drawSnappedPiece`, `drawTemporaryPiece`, `drawDraggingPiece`, `drawTrayPlaceholder` đã tính sẵn tâm; giữ nguyên cách chúng tính.

5. Thêm quầng sáng cho mảnh đặc: trước khi gọi `drawJewel` variant `solid`, đặt một image quầng:

```ts
    // Quầng sáng dùng texture gradient vì Graphics không có blur
    this.scene.add
      .image(cx, cy, TEXTURE_KEYS.jewelGlow)
      .setDisplaySize(radiusPx * 2.6, radiusPx * 2.6)
      .setDepth(DEPTH_TOKENS.placedPieces - 1);
```

   Lưu ý: chỉ tạo image **một lần** cho mỗi mảnh, trong hàm khởi tạo renderer hoặc khi mảnh đổi trạng thái — **không** tạo trong `render()`, vì `render()` chạy mỗi khung hình và sẽ rò rỉ hàng nghìn object. Nếu dễ nhất là giữ một `Map<string, Phaser.GameObjects.Image>` theo `piece.id` rồi chỉ cập nhật `setPosition`/`setVisible`, làm theo cách đó.

- [ ] **Step 8: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 9: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/?scene=play&level=1-1`. Kỳ vọng: mảnh có bốn mặt vát màu khác nhau, mặt bàn sáng ở giữa, viền trắng ngà, quầng vàng phía sau. Kéo thử một mảnh: bản sao mờ phóng to 1.06. Kiểm đỉnh mảnh có nằm đúng giao điểm lưới không — đây là điểm mấu chốt của cả đợt này. Ctrl-C.

- [ ] **Step 10: Commit**

```bash
cd game-next && git add src/presentation/jewelGeometry.ts src/presentation/JewelShape.ts src/presentation/TextureFactory.ts src/presentation/BoardRenderer.ts tests/jewelGeometry.test.ts tests/textureFactory.test.ts
git commit -m "feat(piece): mảnh ngọc thoi bốn mặt vát

Thay drawVectorDiamond (9 tham số vị trí) bằng drawJewel với bốn variant.
Bán kính 24 ô logic = 1 module nên đỉnh rơi đúng giao điểm lưới. Viền vẽ
phía trong để mép trùng đường kẻ."
```

---

### Task 7: Khung kính dùng chung

**Files:**
- Modify: `game-next/src/presentation/TextureFactory.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Modify: `game-next/tests/textureFactory.test.ts`

**Interfaces:**
- Consumes: `GLASS_TOKENS` từ Task 1.
- Produces: `TextureFactory.makeGlassFrame(scene, key, width, height, radius): string` trả về khoá texture; `TEXTURE_KEYS.glassFrameBoard`, `TEXTURE_KEYS.glassFrameTray`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/textureFactory.test.ts`, trong khối `describe` sẵn có:

```ts
  test('có khoá texture khung kính cho bàn và khay', () => {
    expect(TEXTURE_KEYS.glassFrameBoard).toBe('glass_frame_board');
    expect(TEXTURE_KEYS.glassFrameTray).toBe('glass_frame_tray');
  });

  test('khung kính dùng đúng bốn chặng màu băng của mockup', () => {
    expect(GLASS_TOKENS.frameStops).toEqual(['#E6F7FF', '#8BD3F5', '#4E9BD0', '#2D5E9A']);
    expect(GLASS_TOKENS.cornerRadius).toBe(30);
  });
```

Thêm import ở đầu file test:

```ts
import { GLASS_TOKENS } from '../src/presentation/designTokens.ts';
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/textureFactory.test.ts
```

Kỳ vọng: FAIL — `TEXTURE_KEYS.glassFrameBoard` là `undefined`.

- [ ] **Step 3: Viết `makeGlassFrame`**

Trong `game-next/src/presentation/TextureFactory.ts`, thêm hai khoá:

```ts
  glassFrameBoard: 'glass_frame_board',
  glassFrameTray: 'glass_frame_tray',
```

Và hàm sinh:

```ts
  /**
   * Khung kính bao quanh bàn chơi và khay mảnh: gradient băng từ trắng xanh
   * xuống xanh đậm, bo góc, viền tóc trắng mờ ở mép trong.
   */
  public static makeGlassFrame(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    radius: number
  ): string {
    if (scene.textures.exists(key)) return key;

    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) return key;
    const ctx = texture.getContext();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    GLASS_TOKENS.frameStops.forEach((stop, index) => {
      gradient.addColorStop(GLASS_TOKENS.frameStopOffsets[index], stop);
    });

    ctx.fillStyle = gradient;
    ctx.beginPath();
    // roundRect có mặt trên mọi browser mà Capacitor nhắm tới
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();

    // Viền tóc trắng mờ ở mép ngoài
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Khoét lòng khung để chỉ còn viền dày GLASS_TOKENS.padding
    const pad = GLASS_TOKENS.padding;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, Math.max(0, radius - pad));
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    texture.refresh();
    return key;
  }
```

Trong `generateAll`, gọi cho hai kích thước đang dùng:

```ts
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameBoard,
      LAYOUT_TOKENS.board.width,
      LAYOUT_TOKENS.board.height,
      LAYOUT_TOKENS.board.cornerRadius
    );
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameTray,
      LAYOUT_TOKENS.tray.width,
      LAYOUT_TOKENS.tray.height,
      LAYOUT_TOKENS.tray.cornerRadius
    );
```

Thêm import `GLASS_TOKENS` và `LAYOUT_TOKENS` vào `TextureFactory.ts` nếu chưa có.

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/textureFactory.test.ts
```

Kỳ vọng: PASS.

- [ ] **Step 5: Dùng khung kính trong `BoardRenderer`**

Trong `renderBackground` của `game-next/src/presentation/BoardRenderer.ts`:

1. **Xoá** khối bevel thủ công — hai lệnh `lineStyle(3, iceHighlight, 0.9)` / `lineStyle(3, iceShadow, 0.85)` cùng các `arc` và `lineTo` đi kèm (quanh dòng 63–77), và lệnh `strokeRoundedRect` viền 10px.
2. Mặt bàn: thay `fillStyle(COLOR_NUMBERS.navyStele, 0.98)` bằng gradient hai chặng — vì `Graphics` không có gradient, dùng hai lớp phủ xấp xỉ:

```ts
    this.bgGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x, boardBounds.y, boardBounds.width, boardBounds.height,
      LAYOUT_TOKENS.board.cornerRadius
    );
    this.bgGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceBottom, 0.6);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x, boardBounds.y + boardBounds.height / 2,
      boardBounds.width, boardBounds.height / 2,
      LAYOUT_TOKENS.board.cornerRadius
    );
```

3. Đặt khung kính lên trên, một lần trong hàm khởi tạo renderer:

```ts
    this.scene.add
      .image(boardBounds.x, boardBounds.y, TEXTURE_KEYS.glassFrameBoard)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.boardGrid + 1);
    this.scene.add
      .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.trayArea);
```

- [ ] **Step 6: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 7: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=play&level=1-1`. Kỳ vọng: bàn và khay cùng được bao bởi khung băng sáng ở trên, đậm ở dưới; không còn viền cyan phẳng cũ. Ctrl-C.

- [ ] **Step 8: Commit**

```bash
cd game-next && git add src/presentation/TextureFactory.ts src/presentation/BoardRenderer.ts tests/textureFactory.test.ts
git commit -m "feat(frame): khung kính dùng chung cho bàn và khay

Thay 30 dòng bevel thủ công bằng một texture 9-slice sinh từ GLASS_TOKENS."
```

---

### Task 8: HUD theo mockup

**Files:**
- Modify: `game-next/src/presentation/Hud.ts`
- Modify: `game-next/tests/hud.test.ts`

**Interfaces:**
- Consumes: `COLOR_TOKENS`, `TYPO_TOKENS`, `LAYOUT_TOKENS`, `PIECE_TOKENS` từ Task 1; `drawJewel` từ Task 6.
- Produces: `Hud.showSnapHint(x: number, y: number): void` và `Hud.hideSnapHint(): void` — nhãn "Thả để khớp"; `Hud.setMatchCount(matched: number, total: number): void`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/hud.test.ts`:

```ts
import { COLOR_TOKENS, PIECE_TOKENS } from '../src/presentation/designTokens.ts';

  test('nhãn gợi ý thả mảnh dùng đúng chuỗi tiếng Việt của mockup', () => {
    const SNAP_HINT = 'Thả để khớp';
    expect(SNAP_HINT).toBe('Thả để khớp');
    expect(SNAP_HINT).not.toBe(SNAP_HINT.toUpperCase());
  });

  test('thanh đếm mảnh hiển thị đúng định dạng n/m', () => {
    const format = (matched: number, total: number) => `${matched}/${total} mảnh đã khớp`;
    expect(format(0, 2)).toBe('0/2 mảnh đã khớp');
    expect(format(1, 2)).toBe('1/2 mảnh đã khớp');
    expect(format(2, 2)).toBe('2/2 mảnh đã khớp');
  });

  test('nút tròn dùng viền băng và nền radial mới', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');
    expect(COLOR_TOKENS.iceGlass.buttonFillTop).toBe('#3D5FC0');
    expect(COLOR_TOKENS.iceGlass.buttonFillBottom).toBe('#1B2A72');
  });

  test('icon đếm mảnh dùng cùng bảng màu với mảnh ngọc', () => {
    expect(PIECE_TOKENS.faceNorth).toBe('#FFEAA8');
    expect(PIECE_TOKENS.placeholderStroke.color).toBe('#CFEFFF');
  });
```

(Giữ nguyên các test sẵn có trong file; chỉ thêm bốn test này và dòng import.)

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/hud.test.ts
```

Kỳ vọng: FAIL ở test nút tròn — `buttonFillTop` chưa tồn tại nếu Task 1 chưa đủ; nếu Task 1 đã xong thì các test này xanh ngay và đó cũng chấp nhận được. Mục đích chính của Task 8 là phần vẽ, mà phần vẽ không test bằng vitest được — nên dùng chạy thử trực quan ở Step 5 làm nghiệm thu.

- [ ] **Step 3: Đổi phần vẽ HUD**

Trong `game-next/src/presentation/Hud.ts`:

1. **Nút tròn** — mọi nút (tạm dừng, bật/tắt hình mẫu, đặt lại): viền `COLOR_TOKENS.iceGlass.primaryBorder` dày 3, nền radial từ `buttonFillTop` ở 35%/30% sang `buttonFillBottom`, cộng một highlight trong: cung sáng `rgba(255,255,255,0.35)` dày 2 ở nửa trên. Phaser không có radial gradient cho `Graphics`, nên xấp xỉ bằng hai vòng tròn lồng: `fillCircle` màu `buttonFillBottom` cho toàn nút, rồi `fillCircle` màu `buttonFillTop` alpha 0.6 bán kính 0.7 lệch lên trên-trái 15%.
2. **Tiêu đề** — "Song Tinh" dùng `TYPO_TOKENS.fontFamily.serif`, `fontSize: TYPO_TOKENS.fontSize.headerTitle` (52px), màu `COLOR_TOKENS.text.primary`, đặt tại x=360 căn giữa, y=34. Phụ đề `Chương I · Màn 1-1` dùng `fontFamily.sans` 24px màu `COLOR_TOKENS.text.secondary`, y=72.
3. **Thanh đếm dưới** — viên thuốc bo tròn tại y = `LAYOUT_TOKENS.bottomBar.y + 6`, cao 56, nền `0x0f1950` alpha 0.6, viền `icePrimary` alpha 0.6 dày 1.5. Bên trong, từ trái sang: một thoi đặc vẽ bằng `drawJewel(..., { variant: 'solid', radius: 14 })` cho mỗi mảnh đã khớp, một thoi nét đứt `variant: 'placeholder'` cho mỗi mảnh còn lại, rồi chuỗi `${matched}/${total} mảnh đã khớp` 26px.
4. **Nhãn gợi ý thả mảnh** — thêm hai phương thức:

```ts
  private snapHint: Phaser.GameObjects.Container | null = null;

  /** Nhãn "Thả để khớp" nổi cạnh mảnh khi kéo trúng vùng snap */
  public showSnapHint(x: number, y: number): void {
    if (!this.snapHint) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0xfff4d2, 1);
      bg.fillRoundedRect(0, 0, 160, 44, 14);
      const label = this.scene.add.text(80, 22, 'Thả để khớp', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.onAmber,
      }).setOrigin(0.5);
      this.snapHint = this.scene.add
        .container(0, 0, [bg, label])
        .setDepth(DEPTH_TOKENS.hudControls);
    }
    this.snapHint.setPosition(x, y).setVisible(true);
  }

  public hideSnapHint(): void {
    this.snapHint?.setVisible(false);
  }
```

5. Trong `PlayScene.refreshView`, gọi `this.hud.showSnapHint(...)` khi `snapshot.dragInfo?.snapCandidateId` khác null, ngược lại `this.hud.hideSnapHint()`. Toạ độ: ngay bên phải mảnh đang kéo, lệch `+radiusPx * 0.8` theo x và `+radiusPx * 0.5` theo y.

- [ ] **Step 4: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 5: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=play&level=1-1`. Kiểm: tiêu đề serif lớn với phụ đề chương, hai nút tròn viền băng ở hai góc trên, thanh đếm "0/2 mảnh đã khớp" ở đáy với hai thoi nét đứt. Kéo một mảnh tới vị trí đúng — nhãn "Thả để khớp" phải hiện ra và biến mất khi kéo đi chỗ khác. Thả mảnh — thanh đếm đổi thành "1/2" và một thoi chuyển từ nét đứt sang đặc. Ctrl-C.

- [ ] **Step 6: Commit**

```bash
cd game-next && git add src/presentation/Hud.ts src/presentation/PlayScene.ts tests/hud.test.ts
git commit -m "feat(hud): HUD theo mockup improve-v1

Nút tròn viền băng, tiêu đề serif kèm phụ đề chương, thanh đếm dạng viên
thuốc với icon thoi. Thêm nhãn 'Thả để khớp' khi kéo trúng vùng snap."
```


---

## Ghi chú cho người thực thi

**Thứ tự task là bắt buộc.** Task 2 làm đỏ test của Task 1; Task 3 làm xanh lại. Đừng gộp — mỗi task là một commit riêng để dễ lần ngược khi có gì sai.

**Khi test đỏ ngoài dự kiến:** plan này ghi rõ chỗ nào test *sẽ* đỏ và task nào sửa (Task 1 Step 6, Task 2 Step 7). Test đỏ ở chỗ khác là tín hiệu có gì đó sai — dừng lại và báo cáo, đừng sửa test cho xanh.

**Phaser và gradient:** ba chỗ phải đi đường vòng, đã ghi trong spec — gradient trời (dải ngang nội suy), gradient mặt bàn và quầng sáng (canvas texture), nét đứt (chia đoạn thủ công). Nếu thấy cách nào gọn hơn mà vẫn đúng màu, dùng nó.

**Rò rỉ object:** `render()` của `BoardRenderer` chạy mỗi khung hình. Đừng bao giờ `scene.add.*` bên trong nó. Task 6 Step 7 có ghi rõ cái bẫy này.

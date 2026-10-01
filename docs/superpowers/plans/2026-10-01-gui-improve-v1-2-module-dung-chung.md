# improve-v1 — Giai đoạn 2/4: Module dùng chung — nền trời và lưới thước đo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách nền trời và lưới bàn chơi thành hai module dùng chung, thay cho ba bản trường sao trùng lặp và phần vẽ lưới nằm lẫn trong BoardRenderer.

**Architecture:** Mỗi module chia làm hai lớp: một file hàm thuần tính toạ độ (test bằng vitest, không cần Phaser) và một wrapper Phaser chỉ dịch toạ độ thành lệnh vẽ. Đây là pattern đã có sẵn trong repo ở `constellationMotion.ts`. Phần tĩnh vẽ một lần vào `RenderTexture`; chỉ sao nhấp nháy là vẽ lại mỗi khung hình.

**Tech Stack:** TypeScript (ESM, `.ts` extension trong import), Phaser 3.90, Vite, Vitest, Capacitor (Android).

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

**Giao được gì sau giai đoạn này:** Cả bốn màn dùng chung một nền trời gradient có nebula và sao. Bàn chơi có đủ năm lớp lưới, gồm đường chéo 45°, vạch thước và dấu góc — ba thứ trước đây không có.

## Vị trí trong loạt plan

- **Chạy sau:** `2026-10-01-gui-improve-v1-1-nen-mong.md` — phải xong và xanh trước khi bắt đầu plan này.
- **Chạy tiếp theo:** `2026-10-01-gui-improve-v1-3-manh-va-khung.md`

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

Hai module này là lý do chọn hướng "token trước, tách module dùng chung". `MenuScene`, `LevelSelectScene` và `PlayScene` đang mỗi file tự viết một trường sao với hành vi khác nhau. Gộp lại là việc nên làm dù có re-skin hay không.

---

### Task 4: Trường sao dùng chung

**Files:**
- Create: `game-next/src/presentation/starField.ts`
- Create: `game-next/src/presentation/SkyBackdrop.ts`
- Create: `game-next/tests/starField.test.ts`

**Interfaces:**
- Consumes: `COLOR_TOKENS`, `ANIM_TOKENS`, `DEPTH_TOKENS`, `LAYOUT_TOKENS` từ Task 1.
- Produces:
  - `generateStarField(seed: number, bounds: { width: number; height: number }): StarField`
  - `type Star = { x: number; y: number; r: number; alpha: number; color: string; twinkles: boolean; phaseMs: number; driftSpeed: number }`
  - `type StarField = { static: Star[]; twinkling: Star[] }`
  - `twinkleAlpha(star: Star, elapsedMs: number): number`
  - `advanceDrift(star: Star, deltaMs: number, height: number): number`
  - `class SkyBackdrop { constructor(scene: Phaser.Scene, opts: { seed: number; drift: boolean }); update(deltaMs: number): void; destroy(): void }`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/starField.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  generateStarField,
  twinkleAlpha,
  advanceDrift,
} from '../src/presentation/starField.ts';

const BOUNDS = { width: 720, height: 1280 };

describe('starField', () => {
  test('cùng seed cho cùng trường sao, khác seed cho trường khác', () => {
    const a = generateStarField(42, BOUNDS);
    const b = generateStarField(42, BOUNDS);
    const c = generateStarField(43, BOUNDS);

    expect(a).toEqual(b);
    expect(a.static[0]).not.toEqual(c.static[0]);
  });

  test('khoảng 120 sao tĩnh và 30 sao nhấp nháy, đúng tỉ lệ mockup', () => {
    const field = generateStarField(1, BOUNDS);
    expect(field.static).toHaveLength(120);
    expect(field.twinkling).toHaveLength(30);
    expect(field.static.every((s) => s.twinkles === false)).toBe(true);
    expect(field.twinkling.every((s) => s.twinkles === true)).toBe(true);
  });

  test('mọi sao nằm trong khung và có bán kính hợp lệ', () => {
    const field = generateStarField(7, BOUNDS);
    for (const star of [...field.static, ...field.twinkling]) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(BOUNDS.width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(BOUNDS.height);
      expect(star.r).toBeGreaterThanOrEqual(0.6);
      expect(star.r).toBeLessThanOrEqual(1.7 * 1.846);
      expect(['#FFFFFF', '#CFE6FF', '#FFE8B8']).toContain(star.color);
    }
  });

  test('độ sáng nhấp nháy dao động quanh alpha gốc và không bao giờ âm', () => {
    const [star] = generateStarField(3, BOUNDS).twinkling;
    const samples = Array.from({ length: 64 }, (_, i) => twinkleAlpha(star, i * 50));

    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    // Thật sự có dao động, không phải hằng số
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
  });

  test('chu kỳ nhấp nháy lặp lại sau 3.2 giây', () => {
    const [star] = generateStarField(5, BOUNDS).twinkling;
    expect(twinkleAlpha(star, 1000)).toBeCloseTo(twinkleAlpha(star, 1000 + 3200), 5);
  });

  test('sao trôi xuống và quấn vòng khi vượt mép dưới', () => {
    const star = { ...generateStarField(9, BOUNDS).static[0], y: 1270, driftSpeed: 0.2 };
    const next = advanceDrift(star, 100, BOUNDS.height);
    expect(next).toBeLessThan(100); // đã quấn về phía trên
    expect(next).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/starField.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `starField.ts`.

- [ ] **Step 3: Viết `starField.ts`**

Tạo `game-next/src/presentation/starField.ts`:

```ts
import { COLOR_TOKENS, ANIM_TOKENS } from './designTokens.ts';

export type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
  twinkles: boolean;
  /** Lệch pha trong chu kỳ nhấp nháy, tính bằng mili giây */
  phaseMs: number;
  /** Tốc độ trôi xuống, pixel mỗi mili giây */
  driftSpeed: number;
};

export type StarField = {
  static: Star[];
  twinkling: Star[];
};

const STATIC_COUNT = 120;
const TWINKLING_COUNT = 30;

/** Hệ số quy đổi từ canvas mockup 390 rộng sang canvas game 720 rộng */
const MOCKUP_SCALE = 1.846;

const STAR_COLORS = [
  COLOR_TOKENS.sky.starWhite,
  COLOR_TOKENS.sky.starBlue,
  COLOR_TOKENS.sky.starWarm,
];

/**
 * Mulberry32: bộ sinh số giả ngẫu nhiên 32-bit, nhỏ và tái lập được.
 * Cần tái lập để test và ảnh chụp so sánh cho kết quả ổn định.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStar(rand: () => number, bounds: { width: number; height: number }, twinkles: boolean): Star {
  return {
    x: rand() * bounds.width,
    y: rand() * bounds.height,
    r: (0.6 + rand() * 1.1) * MOCKUP_SCALE,
    alpha: 0.45 + rand() * 0.54,
    color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
    twinkles,
    phaseMs: rand() * ANIM_TOKENS.duration.twinkleCycleMs,
    driftSpeed: 0.006 + rand() * 0.009,
  };
}

export function generateStarField(
  seed: number,
  bounds: { width: number; height: number }
): StarField {
  const rand = mulberry32(seed);
  return {
    static: Array.from({ length: STATIC_COUNT }, () => makeStar(rand, bounds, false)),
    twinkling: Array.from({ length: TWINKLING_COUNT }, () => makeStar(rand, bounds, true)),
  };
}

/**
 * Độ sáng của một sao nhấp nháy tại thời điểm elapsedMs.
 * Mockup dùng keyframe 0%/100% ở .25 và 50% ở 1 — tức sin toàn phần.
 */
export function twinkleAlpha(star: Star, elapsedMs: number): number {
  const cycle = ANIM_TOKENS.duration.twinkleCycleMs;
  const t = ((elapsedMs + star.phaseMs) % cycle) / cycle;
  const wave = (1 - Math.cos(t * Math.PI * 2)) / 2; // 0 .. 1
  const value = 0.25 + wave * 0.75;
  return Math.max(0, Math.min(1, value * star.alpha + value * (1 - star.alpha) * 0.4));
}

/** Toạ độ y mới sau khi trôi xuống, quấn vòng lên đỉnh khi vượt mép dưới. */
export function advanceDrift(star: Star, deltaMs: number, height: number): number {
  const next = star.y + star.driftSpeed * deltaMs;
  return next > height ? next - height : next;
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/starField.test.ts
```

Kỳ vọng: PASS, 6 test.

- [ ] **Step 5: Viết wrapper `SkyBackdrop.ts`**

Tạo `game-next/src/presentation/SkyBackdrop.ts`:

```ts
import Phaser from 'phaser';
import { COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';
import { generateStarField, twinkleAlpha, advanceDrift } from './starField.ts';
import type { Star } from './starField.ts';

export type SkyBackdropOptions = {
  seed: number;
  /** true cho màn chọn màn: sao trôi xuống rồi quấn vòng */
  drift: boolean;
};

/**
 * Nền trời dùng chung cho mọi màn: gradient bốn chặng, hai nebula, quầng
 * trăng, và trường sao.
 *
 * Phần tĩnh vẽ một lần vào RenderTexture. Chỉ 30 sao nhấp nháy là vẽ lại mỗi
 * khung hình — vẽ lại cả 150 sao mỗi frame là chi phí không cần thiết.
 */
export class SkyBackdrop {
  private readonly scene: Phaser.Scene;
  private readonly options: SkyBackdropOptions;
  private readonly staticLayer: Phaser.GameObjects.RenderTexture;
  private readonly twinkleLayer: Phaser.GameObjects.Graphics;
  private readonly twinklingStars: Star[];
  private readonly staticStars: Star[];
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, options: SkyBackdropOptions) {
    this.scene = scene;
    this.options = options;

    const { width, height } = LAYOUT_TOKENS.canvas;
    const field = generateStarField(options.seed, { width, height });
    this.staticStars = field.static;
    this.twinklingStars = field.twinkling;

    this.staticLayer = scene.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.backgroundSky);

    this.twinkleLayer = scene.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 1);

    this.paintStatic();
  }

  private paintStatic(): void {
    const { width, height } = LAYOUT_TOKENS.canvas;
    const g = this.scene.add.graphics();

    // Gradient trời: Phaser Graphics không có gradient fill, nên xấp xỉ bằng
    // các dải ngang nội suy giữa bốn chặng màu.
    const stops = COLOR_TOKENS.sky.stops.map((hex) =>
      Phaser.Display.Color.HexStringToColor(hex)
    );
    const offsets = COLOR_TOKENS.sky.stopOffsets;
    const bandCount = 128;
    for (let i = 0; i < bandCount; i++) {
      const t = i / (bandCount - 1);
      let segment = 0;
      while (segment < offsets.length - 2 && t > offsets[segment + 1]) segment++;
      const localT =
        (t - offsets[segment]) / (offsets[segment + 1] - offsets[segment] || 1);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        stops[segment],
        stops[segment + 1],
        100,
        Math.round(Math.max(0, Math.min(1, localT)) * 100)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, (height / bandCount) * i, width, height / bandCount + 1);
    }

    // Hai nebula và quầng trăng: xấp xỉ radial gradient bằng các vòng tròn
    // đồng tâm giảm dần độ mờ.
    this.paintGlow(g, 108, 436, 396, COLOR_TOKENS.sky.nebulaBlue, 0.45);
    this.paintGlow(g, 648, 966, 360, COLOR_TOKENS.sky.nebulaPink, 0.32);
    this.paintGlow(g, 619, 140, 158, COLOR_TOKENS.sky.moonHalo, 0.35);
    this.paintGlow(g, 619, 140, 62, COLOR_TOKENS.sky.moonCore, 0.9);

    for (const star of this.staticStars) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(star.color).color, star.alpha);
      g.fillCircle(star.x, star.y, star.r);
    }

    this.staticLayer.draw(g);
    g.destroy();
  }

  private paintGlow(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    hex: string,
    peakAlpha: number
  ): void {
    const color = Phaser.Display.Color.HexStringToColor(hex).color;
    const rings = 24;
    for (let i = rings; i > 0; i--) {
      const t = i / rings;
      g.fillStyle(color, peakAlpha * (1 - t) ** 2);
      g.fillCircle(cx, cy, radius * t);
    }
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const { height } = LAYOUT_TOKENS.canvas;

    this.twinkleLayer.clear();
    for (const star of this.twinklingStars) {
      if (this.options.drift) {
        star.y = advanceDrift(star, deltaMs, height);
      }
      const alpha = twinkleAlpha(star, this.elapsedMs);
      this.twinkleLayer.fillStyle(
        Phaser.Display.Color.HexStringToColor(star.color).color,
        alpha
      );
      this.twinkleLayer.fillCircle(star.x, star.y, star.r);
    }
  }

  public destroy(): void {
    this.staticLayer.destroy();
    this.twinkleLayer.destroy();
  }
}
```

- [ ] **Step 6: Thay trường sao tự chế trong ba scene**

Trong **cả ba** file `MenuScene.ts`, `LevelSelectScene.ts`, `PlayScene.ts`:

1. Xoá khai báo `type StarParticle = {...}` ở đầu file.
2. Xoá thuộc tính `private starGraphics!: Phaser.GameObjects.Graphics;` và `private stars: StarParticle[] = [];`.
3. Thêm `private sky!: SkyBackdrop;` và import `import { SkyBackdrop } from './SkyBackdrop.ts';`.
4. Trong `create()`, thay khối khởi tạo sao bằng:
   - `MenuScene`: `this.sky = new SkyBackdrop(this, { seed: 1, drift: false });`
   - `PlayScene`: `this.sky = new SkyBackdrop(this, { seed: 2, drift: false });`
   - `LevelSelectScene`: `this.sky = new SkyBackdrop(this, { seed: 3, drift: true });`
   Đặt dòng này **ngay sau** `TextureFactory.generateAll(this)` để nền nằm dưới mọi thứ khác.
5. Trong `update(_time, delta)`, thay vòng lặp vẽ sao bằng `this.sky.update(delta);`.
6. Nếu scene nào chưa có `update`, thêm:

```ts
  update(_time: number, delta: number): void {
    this.sky.update(delta);
  }
```

`PlayScene.update` hiện còn phần khác không? Không — thân nó chỉ vẽ sao, nên sau khi thay chỉ còn một dòng.

- [ ] **Step 7: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh. `tests/menu.test.ts` và `tests/levelSelect.test.ts` không chạm vào trường sao nên không bị ảnh hưởng.

- [ ] **Step 8: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/`. Kỳ vọng: nền chuyển từ xanh đậm sang tím ở đáy, có quầng trăng ở góc trên-phải, sao nhấp nháy. Mở `?scene=levelSelect` để xác nhận sao trôi xuống. Ctrl-C để dừng.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/presentation/starField.ts src/presentation/SkyBackdrop.ts src/presentation/MenuScene.ts src/presentation/LevelSelectScene.ts src/presentation/PlayScene.ts tests/starField.test.ts
git commit -m "feat(sky): nền trời dùng chung cho mọi màn

Gộp ba cách vẽ trường sao khác nhau (Menu, LevelSelect, Play) thành một
module. Trường sao sinh theo seed nên tái lập được. Phần tĩnh vào
RenderTexture, chỉ 30 sao nhấp nháy vẽ lại mỗi khung hình."
```

---

### Task 5: Lưới thước đo năm lớp

**Files:**
- Create: `game-next/src/presentation/gridLayers.ts`
- Create: `game-next/src/presentation/GridPainter.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts` (bỏ phần vẽ lưới)
- Create: `game-next/tests/gridLayers.test.ts`

**Interfaces:**
- Consumes: `GRID_TOKENS`, `LAYOUT_TOKENS` từ Task 1; `LayoutMetrics` từ Task 2.
- Produces:
  - `type Segment = { x1: number; y1: number; x2: number; y2: number }`
  - `type GridLayer = { name: 'fine' | 'diagonal' | 'module' | 'axis' | 'tick'; segments: Segment[] }`
  - `buildGridLayers(board: { x: number; y: number; width: number; height: number }): GridLayer[]`
  - `buildCornerMarks(board): Segment[]`
  - `class GridPainter { static paint(scene: Phaser.Scene, board): Phaser.GameObjects.RenderTexture }`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/gridLayers.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { buildGridLayers, buildCornerMarks } from '../src/presentation/gridLayers.ts';
import { LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';

const BOARD = LAYOUT_TOKENS.board;

describe('gridLayers', () => {
  const layers = buildGridLayers(BOARD);
  const byName = (name: string) => layers.find((l) => l.name === name)!;

  test('đủ năm lớp theo đúng thứ tự vẽ của mockup', () => {
    expect(layers.map((l) => l.name)).toEqual([
      'fine',
      'diagonal',
      'module',
      'axis',
      'tick',
    ]);
  });

  test('lưới mảnh cách nhau 40px, phủ kín bàn theo cả hai chiều', () => {
    const fine = byName('fine').segments;
    const verticals = fine.filter((s) => s.x1 === s.x2);
    const horizontals = fine.filter((s) => s.y1 === s.y2);

    expect(verticals).toHaveLength(BOARD.width / 40 + 1); // 17
    expect(horizontals).toHaveLength(BOARD.height / 40 + 1); // 21

    const xs = verticals.map((s) => s.x1).sort((a, b) => a - b);
    expect(xs[0]).toBe(BOARD.x);
    expect(xs.at(-1)).toBe(BOARD.x + BOARD.width);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBe(40);
    }
  });

  test('lưới module cách nhau 120px', () => {
    const module = byName('module').segments;
    const verticals = module.filter((s) => s.x1 === s.x2).map((s) => s.x1).sort((a, b) => a - b);
    for (let i = 1; i < verticals.length; i++) {
      expect(verticals[i] - verticals[i - 1]).toBe(120);
    }
    expect(verticals.every((x) => (x - BOARD.x) % 120 === 0)).toBe(true);
  });

  test('trục giữa đi qua đúng tâm bàn, một ngang một dọc', () => {
    const axis = byName('axis').segments;
    expect(axis).toHaveLength(2);
    const vertical = axis.find((s) => s.x1 === s.x2)!;
    const horizontal = axis.find((s) => s.y1 === s.y2)!;
    expect(vertical.x1).toBe(BOARD.x + BOARD.width / 2);
    expect(horizontal.y1).toBe(BOARD.y + BOARD.height / 2);
  });

  test('đường chéo 45 độ có hệ số góc đúng bằng 1 hoặc -1', () => {
    const diagonal = byName('diagonal').segments;
    expect(diagonal.length).toBeGreaterThan(0);
    for (const s of diagonal) {
      const slope = Math.abs((s.y2 - s.y1) / (s.x2 - s.x1));
      expect(slope).toBeCloseTo(1, 6);
    }
  });

  test('vạch thước nằm ở bốn mép, vạch module dài hơn vạch thường', () => {
    const ticks = byName('tick').segments;
    const lengths = ticks.map((s) => Math.abs(s.x2 - s.x1) + Math.abs(s.y2 - s.y1));
    expect(new Set(lengths)).toEqual(new Set([5, 9]));
    expect(lengths.filter((l) => l === 9).length).toBeGreaterThan(0);
  });

  test('mọi đoạn nằm trong biên bàn chơi', () => {
    for (const layer of layers) {
      for (const s of layer.segments) {
        for (const x of [s.x1, s.x2]) {
          expect(x).toBeGreaterThanOrEqual(BOARD.x);
          expect(x).toBeLessThanOrEqual(BOARD.x + BOARD.width);
        }
        for (const y of [s.y1, s.y2]) {
          expect(y).toBeGreaterThanOrEqual(BOARD.y);
          expect(y).toBeLessThanOrEqual(BOARD.y + BOARD.height);
        }
      }
    }
  });

  test('bốn dấu góc chữ L, mỗi dấu hai đoạn', () => {
    const marks = buildCornerMarks(BOARD);
    expect(marks).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/gridLayers.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `gridLayers.ts`.

- [ ] **Step 3: Viết `gridLayers.ts`**

Tạo `game-next/src/presentation/gridLayers.ts`:

```ts
import { GRID_TOKENS } from './designTokens.ts';

export type Segment = { x1: number; y1: number; x2: number; y2: number };

export type GridLayerName = 'fine' | 'diagonal' | 'module' | 'axis' | 'tick';

export type GridLayer = {
  name: GridLayerName;
  segments: Segment[];
};

export type BoardBox = { x: number; y: number; width: number; height: number };

/** Một ô lưới hiển thị, tính bằng pixel canvas: 8 ô logic x 5px = 40px */
export const DISPLAY_CELL_PX =
  GRID_TOKENS.logicCellPx * GRID_TOKENS.displayCellInLogicCells;

/** Một module: 3 ô lưới hiển thị = 120px */
export const MODULE_PX = DISPLAY_CELL_PX * GRID_TOKENS.moduleInDisplayCells;

function lineGrid(board: BoardBox, step: number): Segment[] {
  const segments: Segment[] = [];
  for (let x = board.x; x <= board.x + board.width; x += step) {
    segments.push({ x1: x, y1: board.y, x2: x, y2: board.y + board.height });
  }
  for (let y = board.y; y <= board.y + board.height; y += step) {
    segments.push({ x1: board.x, y1: y, x2: board.x + board.width, y2: y });
  }
  return segments;
}

/**
 * Đường chéo 45 độ, cắt theo biên bàn.
 * Đi theo cả hai chiều, cách nhau một module để không làm rối mặt bàn.
 */
function diagonals(board: BoardBox): Segment[] {
  const segments: Segment[] = [];
  const { x, y, width, height } = board;
  const step = MODULE_PX;

  const clipDown = (startX: number): Segment | null => {
    // Đường y = (px - startX) + y, cắt trong hộp
    const x1 = Math.max(x, startX);
    const y1 = y + (x1 - startX);
    const x2 = Math.min(x + width, startX + height);
    const y2 = y + (x2 - startX);
    if (x2 <= x1 || y1 > y + height || y2 > y + height) {
      const cappedX2 = Math.min(x2, startX + height);
      if (cappedX2 <= x1) return null;
      return { x1, y1, x2: cappedX2, y2: y + (cappedX2 - startX) };
    }
    return { x1, y1, x2, y2 };
  };

  const clipUp = (startX: number): Segment | null => {
    // Đường y = -(px - startX) + (y + height)
    const x1 = Math.max(x, startX - height);
    const y1 = y + height - (x1 - (startX - height));
    const x2 = Math.min(x + width, startX);
    const y2 = y + height - (x2 - (startX - height));
    if (x2 <= x1) return null;
    return { x1, y1, x2, y2 };
  };

  for (let startX = x - height; startX <= x + width; startX += step) {
    const down = clipDown(startX);
    if (down) segments.push(down);
  }
  for (let startX = x; startX <= x + width + height; startX += step) {
    const up = clipUp(startX);
    if (up) segments.push(up);
  }

  return segments.filter(
    (s) =>
      s.x1 >= x && s.x2 <= x + width && s.y1 >= y && s.y2 >= y &&
      s.y1 <= y + height && s.y2 <= y + height && s.x2 > s.x1
  );
}

function axes(board: BoardBox): Segment[] {
  const cx = board.x + board.width / 2;
  const cy = board.y + board.height / 2;
  return [
    { x1: cx, y1: board.y, x2: cx, y2: board.y + board.height },
    { x1: board.x, y1: cy, x2: board.x + board.width, y2: cy },
  ];
}

/**
 * Vạch thước ở bốn mép bàn. Vạch rơi vào đường module dài hơn vạch thường,
 * cho mắt bắt được nhịp 3 ô mà không cần đếm.
 */
function ticks(board: BoardBox): Segment[] {
  const segments: Segment[] = [];
  const { shortLen, longLen } = GRID_TOKENS.tick;
  const right = board.x + board.width;
  const bottom = board.y + board.height;

  for (let x = board.x; x <= right; x += DISPLAY_CELL_PX) {
    const len = (x - board.x) % MODULE_PX === 0 ? longLen : shortLen;
    segments.push({ x1: x, y1: board.y, x2: x, y2: board.y + len });
    segments.push({ x1: x, y1: bottom, x2: x, y2: bottom - len });
  }
  for (let y = board.y; y <= bottom; y += DISPLAY_CELL_PX) {
    const len = (y - board.y) % MODULE_PX === 0 ? longLen : shortLen;
    segments.push({ x1: board.x, y1: y, x2: board.x + len, y2: y });
    segments.push({ x1: right, y1: y, x2: right - len, y2: y });
  }

  return segments;
}

export function buildGridLayers(board: BoardBox): GridLayer[] {
  return [
    { name: 'fine', segments: lineGrid(board, DISPLAY_CELL_PX) },
    { name: 'diagonal', segments: diagonals(board) },
    { name: 'module', segments: lineGrid(board, MODULE_PX) },
    { name: 'axis', segments: axes(board) },
    { name: 'tick', segments: ticks(board) },
  ];
}

/** Bốn dấu ngắm chữ L ở bốn góc bàn, mỗi dấu gồm hai đoạn. */
export function buildCornerMarks(board: BoardBox): Segment[] {
  const { armLen, inset } = GRID_TOKENS.corner;
  const left = board.x + inset;
  const right = board.x + board.width - inset;
  const top = board.y + inset;
  const bottom = board.y + board.height - inset;

  return [
    { x1: left, y1: top + armLen, x2: left, y2: top },
    { x1: left, y1: top, x2: left + armLen, y2: top },
    { x1: right, y1: top + armLen, x2: right, y2: top },
    { x1: right, y1: top, x2: right - armLen, y2: top },
    { x1: left, y1: bottom - armLen, x2: left, y2: bottom },
    { x1: left, y1: bottom, x2: left + armLen, y2: bottom },
    { x1: right, y1: bottom - armLen, x2: right, y2: bottom },
    { x1: right, y1: bottom, x2: right - armLen, y2: bottom },
  ];
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/gridLayers.test.ts
```

Kỳ vọng: PASS, 8 test. Nếu test "mọi đoạn nằm trong biên" đỏ ở lớp `diagonal`, sửa phép cắt trong `diagonals()` cho tới khi xanh — biên là yêu cầu, không phải gợi ý.

- [ ] **Step 5: Viết `GridPainter.ts`**

Tạo `game-next/src/presentation/GridPainter.ts`:

```ts
import Phaser from 'phaser';
import { DEPTH_TOKENS, GRID_TOKENS } from './designTokens.ts';
import { buildGridLayers, buildCornerMarks } from './gridLayers.ts';
import type { BoardBox, GridLayerName, Segment } from './gridLayers.ts';

const STYLE: Record<GridLayerName, { color: string; alpha: number; width: number; dash?: readonly number[] }> = {
  fine: GRID_TOKENS.fine,
  diagonal: GRID_TOKENS.diagonal,
  module: GRID_TOKENS.module,
  axis: GRID_TOKENS.axis,
  tick: GRID_TOKENS.tick,
};

/**
 * Lưới không đổi trong suốt màn chơi, nên vẽ một lần vào RenderTexture.
 * Vẽ bằng Graphics mỗi khung hình là hàng trăm lệnh lineBetween không cần thiết.
 */
export class GridPainter {
  public static paint(scene: Phaser.Scene, board: BoardBox): Phaser.GameObjects.RenderTexture {
    const texture = scene.add
      .renderTexture(board.x, board.y, board.width, board.height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.boardGrid);

    const g = scene.add.graphics();

    for (const layer of buildGridLayers(board)) {
      const style = STYLE[layer.name];
      const color = Phaser.Display.Color.HexStringToColor(style.color).color;
      g.lineStyle(style.width, color, style.alpha);
      for (const s of layer.segments) {
        const local = {
          x1: s.x1 - board.x,
          y1: s.y1 - board.y,
          x2: s.x2 - board.x,
          y2: s.y2 - board.y,
        };
        if (style.dash) {
          GridPainter.strokeDashed(g, local, style.dash);
        } else {
          g.lineBetween(local.x1, local.y1, local.x2, local.y2);
        }
      }
    }

    const corner = GRID_TOKENS.corner;
    g.lineStyle(corner.width, Phaser.Display.Color.HexStringToColor(corner.color).color, 1);
    for (const s of buildCornerMarks(board)) {
      g.lineBetween(s.x1 - board.x, s.y1 - board.y, s.x2 - board.x, s.y2 - board.y);
    }

    texture.draw(g);
    g.destroy();
    return texture;
  }

  /** Phaser Graphics không có nét đứt, nên chia đoạn thủ công. */
  private static strokeDashed(
    g: Phaser.GameObjects.Graphics,
    s: Segment,
    dash: readonly number[]
  ): void {
    const [on, off] = dash;
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const length = Math.hypot(dx, dy);
    if (length === 0) return;
    const ux = dx / length;
    const uy = dy / length;

    let travelled = 0;
    while (travelled < length) {
      const segmentEnd = Math.min(travelled + on, length);
      g.lineBetween(
        s.x1 + ux * travelled,
        s.y1 + uy * travelled,
        s.x1 + ux * segmentEnd,
        s.y1 + uy * segmentEnd
      );
      travelled = segmentEnd + off;
    }
  }
}
```

Lưu ý: `GridPainter.paint` nhận `board` theo toạ độ canvas nhưng vẽ vào texture gốc (0, 0), nên mọi toạ độ phải trừ đi `board.x` / `board.y` trước khi vẽ — biến `local` ở trên làm việc đó, và `strokeDashed` cũng nhận đoạn đã trừ. Quên một chỗ là lưới lệch đi đúng bằng vị trí bàn.

- [ ] **Step 6: Bỏ phần vẽ lưới khỏi `BoardRenderer.ts`**

Trong `game-next/src/presentation/BoardRenderer.ts`, trong `renderBackground` (quanh dòng 88–112), **xoá** các khối:
- lưới đều mỗi `cellPixel * N` (`lineStyle(1, ..., 0.12)` + hai vòng lặp `lineBetween`)
- hai trục giữa (`lineStyle(1.5, ..., 0.28)` + hai `lineBetween`)
- các chấm toạ độ (`fillCircle(x, y, 1.5)` trong vòng lặp)

Thay bằng một lần gọi trong hàm khởi tạo của renderer (nơi đã tạo `bgGraphics`):

```ts
import { GridPainter } from './GridPainter.ts';
// ...
    this.gridTexture = GridPainter.paint(scene, this.layout.boardBounds);
```

Thêm thuộc tính `private gridTexture: Phaser.GameObjects.RenderTexture;` và huỷ nó trong `destroy()` nếu renderer có hàm đó.

- [ ] **Step 7: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 8: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/?scene=play&level=1-1`. Kỳ vọng thấy đủ: lưới mảnh, đường chéo nét đứt, đường module đậm hơn, hai trục giữa, vạch thước ở bốn mép, bốn dấu góc chữ L. Ctrl-C.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/presentation/gridLayers.ts src/presentation/GridPainter.ts src/presentation/BoardRenderer.ts tests/gridLayers.test.ts
git commit -m "feat(grid): lưới thước đo năm lớp theo mockup improve-v1

Thêm lớp chéo 45 độ, vạch thước và dấu góc — ba thứ chưa có. Lưới vẽ một
lần vào RenderTexture thay vì hàng trăm lineBetween mỗi khung hình."
```


---

## Ghi chú cho người thực thi

**Thứ tự task là bắt buộc.** Task 2 làm đỏ test của Task 1; Task 3 làm xanh lại. Đừng gộp — mỗi task là một commit riêng để dễ lần ngược khi có gì sai.

**Khi test đỏ ngoài dự kiến:** plan này ghi rõ chỗ nào test *sẽ* đỏ và task nào sửa (Task 1 Step 6, Task 2 Step 7). Test đỏ ở chỗ khác là tín hiệu có gì đó sai — dừng lại và báo cáo, đừng sửa test cho xanh.

**Phaser và gradient:** ba chỗ phải đi đường vòng, đã ghi trong spec — gradient trời (dải ngang nội suy), gradient mặt bàn và quầng sáng (canvas texture), nét đứt (chia đoạn thủ công). Nếu thấy cách nào gọn hơn mà vẫn đúng màu, dùng nó.

**Rò rỉ object:** `render()` của `BoardRenderer` chạy mỗi khung hình. Đừng bao giờ `scene.add.*` bên trong nó. Task 6 Step 7 có ghi rõ cái bẫy này.

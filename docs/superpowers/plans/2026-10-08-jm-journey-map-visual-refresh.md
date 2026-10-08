# Journey Map Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the menu and level-select screens a layered Milky Way sky, a distinct sky zone per chapter, a ghost silhouette on the current node, and an XOR gate between chapters, without moving any menu layout and without adding image assets.

**Architecture:** All art is drawn with Canvas 2D (`radialGlow` already exists in `SkyBackdrop.ts`) and baked once into textures. Pure, Phaser-free modules (`milkyWay.ts`, `shootingStar.ts`, `frameBudget.ts`, `chapterZoneModel.ts`, `nodeGhost.ts`, `chapterGateModel.ts`, `menu/factBacking.ts`) hold the decisions and are unit-tested; thin Phaser modules (`chapterZone.ts`, `chapterGate.ts`) bake and place textures. A session-wide `frameBudget` drops optional effects if the device runs below 45 FPS.

**Tech Stack:** Phaser 3.90, TypeScript 5.7, Vitest 2, Capacitor 8 Android.

**Spec:** `docs/superpowers/specs/2026-10-08-c-journey-map-visual-refresh-design.md` (approved). Mockups: `docs/gdd/assets/ui-directions/C-journey-scroll.html`, gate record `docs/gdd/assets/ui-directions/direction-approved.md`.

## Global Constraints

- Work in `game-next/`; never edit `game/`. Node `>=24.13.1 <25`.
- Menu layout is frozen (spec §3): positions in `MenuScene.buildMainMenu` do not move. Only the fact line gains a backing.
- No new image files, no Rive/Figma. Textures are generated in code.
- Colours come from `designTokens.ts`; no ad-hoc hex in scenes.
- Fact line contrast must be ≥ 4.5:1 over the brightest cloud colour.
- Reduced motion (`isReducedMotion()`): static clouds, no shooting star, no gate animation.
- Performance: Redmi Note 13 Pro 5G ≥ 55 FPS; Redmi 12 ≥ 45 FPS, below that effects fall back automatically.
- No new persisted localStorage key (gate memory is in-memory only).
- Locked nodes never show a silhouette (no spoilers); the ghost silhouette is for the current node only.
- Commit messages: `type(scope): summary` in English, ending with the `Co-Authored-By` line the session requires. Every commit includes its `CHANGELOG.md` entry (repo root, under `## Unreleased`, newest first, with a `Verification:` bullet).
- Before editing an existing symbol run GitNexus `impact({target, direction: "upstream"})` and report HIGH/CRITICAL to the reviewer; before each commit run `detect_changes()`. If the MCP server is unavailable, say so in the CHANGELOG verification bullet.
- Branch: `feat/journey-map-visuals`, from `feat/studio-e4` (current HEAD) unless the reviewer has merged it to `main` by then; then from `main`.
- Reviewer stop points: after Task 1 (sky look) and after Task 7 (device FPS). Stop and wait.

## File Structure

| File | Responsibility |
|------|----------------|
| `src/presentation/designTokens.ts` | modify: `sky.cloud`, `zone`, `gate` colour tokens |
| `src/presentation/starField.ts` | modify: export `mulberry32`; `sparkle` flag; `sparklePoints` |
| `src/presentation/milkyWay.ts` | new, pure: `milkyWayBlobs` cloud layout |
| `src/presentation/shootingStar.ts` | new, pure: schedule and path of a shooting star |
| `src/presentation/frameBudget.ts` | new, pure: rolling frame-time monitor, session singleton |
| `src/presentation/SkyBackdrop.ts` | modify: paint clouds, draw sparkles and shooting star, feed `frameBudget` |
| `src/devtools/fpsOverlay.ts` | new: `?fps` overlay and `window.__mirrorFps` |
| `src/main.ts` | modify: install the overlay |
| `src/presentation/menu/factBacking.ts` | new, pure: backing rect for the fact line |
| `src/presentation/MenuScene.ts` | modify: draw the backing |
| `src/presentation/chapterZoneModel.ts` | new, pure: zone specs and blobs |
| `src/presentation/chapterZone.ts` | new: bake one zone texture per chapter band |
| `src/presentation/nodeGhost.ts` | new, pure: which node states show the ghost |
| `src/presentation/chapterGateModel.ts` | new, pure: gate geometry, cleared chapters, gate memory logic |
| `src/presentation/chapterGate.ts` | new: bake gate textures, build and animate a gate |
| `src/presentation/LevelSelectScene.ts` | modify: zones, ghost, gates (remove `CHAPTER_TINTS`) |
| `tests/*.test.ts` | one test file per new pure module |

---

### Task 1: Milky Way sky layer (spike, then reviewer stop)

**Files:**
- Modify: `src/presentation/designTokens.ts` (inside `COLOR_TOKENS.sky`), `src/presentation/starField.ts` (export `mulberry32`), `src/presentation/SkyBackdrop.ts` (`paintSky`)
- Create: `src/presentation/milkyWay.ts`
- Test: `tests/milkyWay.test.ts`

**Interfaces:**
- Produces: `COLOR_TOKENS.sky.cloud` with keys `base, mid, violet, core, hot`; `type CloudBlob = { x: number; y: number; r: number; hex: string; alpha: number }`; `milkyWayBlobs(seed: number, width: number, height: number): CloudBlob[]`; `CLOUD_BLOB_COUNT: number`; `MILKY_WAY_SEED: number`; `mulberry32(seed: number): () => number` exported from `starField.ts`.

- [ ] **Step 1: Impact check**

Run GitNexus `impact` on `SkyBackdrop` and `generateStarField` (upstream). Note the result for the CHANGELOG. Run `grep -rn "SkyBackdrop" tests` and read any hit before changing `paintSky`.

- [ ] **Step 2: Write the failing test** — `tests/milkyWay.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { CLOUD_BLOB_COUNT, milkyWayBlobs } from '../src/presentation/milkyWay.ts';
import { COLOR_TOKENS } from '../src/presentation/designTokens.ts';

const W = 720;
const H = 1280;

describe('milkyWayBlobs', () => {
  test('same seed gives the same blobs, a different seed gives different ones', () => {
    expect(milkyWayBlobs(7, W, H)).toEqual(milkyWayBlobs(7, W, H));
    expect(milkyWayBlobs(7, W, H)[0]).not.toEqual(milkyWayBlobs(8, W, H)[0]);
  });

  test('blob count, colours and sizes are valid', () => {
    const blobs = milkyWayBlobs(7, W, H);
    const allowed = Object.values(COLOR_TOKENS.sky.cloud);
    expect(blobs).toHaveLength(CLOUD_BLOB_COUNT);
    for (const b of blobs) {
      expect(allowed).toContain(b.hex);
      expect(b.alpha).toBeGreaterThan(0);
      expect(b.alpha).toBeLessThanOrEqual(1);
      expect(b.r).toBeGreaterThan(0);
    }
  });

  test('the band is centred on the canvas', () => {
    const blobs = milkyWayBlobs(7, W, H);
    const meanX = blobs.reduce((s, b) => s + b.x, 0) / blobs.length;
    const meanY = blobs.reduce((s, b) => s + b.y, 0) / blobs.length;
    expect(Math.abs(meanX - W / 2)).toBeLessThan(W * 0.15);
    expect(Math.abs(meanY - H / 2)).toBeLessThan(H * 0.15);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/milkyWay.test.ts`
Expected: FAIL (module `milkyWay.ts` not found).

- [ ] **Step 4: Add the tokens** — in `designTokens.ts`, inside `COLOR_TOKENS.sky` after `starWarm`:

```ts
    /** Dải Ngân Hà nhiều lớp, từ ngoài vào lõi (ref: docs/ref/image copy.png) */
    cloud: {
      base: '#2A3CB4',
      mid: '#4A56D8',
      violet: '#8B5CE6',
      core: '#E9A4F0',
      hot: '#FFE6F6',
    },
```

- [ ] **Step 5: Export `mulberry32`** — in `starField.ts` change `function mulberry32(` to `export function mulberry32(`.

- [ ] **Step 6: Create `src/presentation/milkyWay.ts`**

```ts
import { COLOR_TOKENS } from './designTokens.ts';
import { mulberry32 } from './starField.ts';

export type CloudBlob = { x: number; y: number; r: number; hex: string; alpha: number };

/** Dải chạy từ trái-dưới lên phải-trên, như ảnh ref. */
const BAND_ANGLE = (-52 * Math.PI) / 180;
export const MILKY_WAY_SEED = 7;

const { cloud } = COLOR_TOKENS.sky;

/** Từ lớp ngoài rộng, mờ, đến lõi hẹp, sáng. Tinh chỉnh `alpha` bằng mắt theo ảnh ref. */
const LAYERS = [
  { hex: cloud.base, count: 22, halfWidth: 300, rMin: 150, rMax: 260, alpha: 0.28 },
  { hex: cloud.mid, count: 18, halfWidth: 200, rMin: 110, rMax: 190, alpha: 0.3 },
  { hex: cloud.violet, count: 14, halfWidth: 120, rMin: 80, rMax: 140, alpha: 0.34 },
  { hex: cloud.core, count: 10, halfWidth: 60, rMin: 50, rMax: 90, alpha: 0.3 },
  { hex: cloud.hot, count: 4, halfWidth: 24, rMin: 40, rMax: 70, alpha: 0.22 },
] as const;

export const CLOUD_BLOB_COUNT = LAYERS.reduce((sum, layer) => sum + layer.count, 0);

/**
 * Toạ độ các quầng mây trong khung `width` x `height`. Thuần và tái lập được.
 * Mỗi lớp rải dọc dải với độ lệch ngang uốn sóng, nên mép dải không thẳng.
 */
export function milkyWayBlobs(seed: number, width: number, height: number): CloudBlob[] {
  const rand = mulberry32(seed);
  const dx = Math.cos(BAND_ANGLE);
  const dy = Math.sin(BAND_ANGLE);
  const nx = -dy;
  const ny = dx;
  const length = Math.hypot(width, height);
  const blobs: CloudBlob[] = [];

  LAYERS.forEach((layer, li) => {
    for (let i = 0; i < layer.count; i++) {
      const t = (i + rand() * 0.8) / layer.count - 0.5;
      const wobble = Math.sin(t * 9 + li * 1.7) * layer.halfWidth * 0.35;
      const off = (rand() * 2 - 1) * layer.halfWidth * 0.6 + wobble;
      blobs.push({
        x: width / 2 + dx * t * length + nx * off,
        y: height / 2 + dy * t * length + ny * off,
        r: layer.rMin + rand() * (layer.rMax - layer.rMin),
        hex: layer.hex,
        alpha: layer.alpha,
      });
    }
  });
  return blobs;
}
```

- [ ] **Step 7: Paint the clouds** — in `SkyBackdrop.ts` add `import { milkyWayBlobs, MILKY_WAY_SEED } from './milkyWay.ts';`. In `paintSky`, change the cache key line to `const key = \`sky_milky_${width}x${viewHeight}\`;` and, directly after `ctx.fillRect(0, 0, width, viewHeight);` (the gradient fill), insert:

```ts
        for (const blob of milkyWayBlobs(MILKY_WAY_SEED, width, height)) {
          radialGlow(ctx, blob.x, frameTop + blob.y, blob.r, blob.hex, blob.alpha);
        }
```

Update the class doc comment line "gradient bốn chặng, hai nebula…" to mention the Milky Way cloud layers.

- [ ] **Step 8: Run tests, typecheck**

Run: `npx vitest run tests/milkyWay.test.ts tests/starField.test.ts tests/designTokens.test.ts` then `npm run typecheck`
Expected: PASS; no type errors.

- [ ] **Step 9: Look at it** — run `npm run dev`, open `http://localhost:5173/?scene=menu` and `?scene=levelSelect` in Chrome at 450×800. Compare with `docs/ref/image copy.png` and `docs/gdd/assets/ui-directions/shots/C-journey-scroll.png`. Adjust only the `alpha`/`count` values in `LAYERS` until the band reads as layered (dark outer, violet middle, soft pink core) without washing out the logo and buttons. Save a screenshot of each to `docs/testing/journey-map/task1-menu.png` and `task1-map.png`.

- [ ] **Step 10: CHANGELOG and commit**

Add a CHANGELOG entry `### 2026-10-08 - Milky Way sky layer` listing the files above and a `Verification:` bullet (test run, typecheck, screenshots, GitNexus impact result). Then:

```bash
git add game-next/src/presentation game-next/tests/milkyWay.test.ts CHANGELOG.md docs/testing/journey-map
git commit -m "feat(ui): layered Milky Way sky behind menu and map"
```

**STOP — reviewer stop point.** Ask the reviewer to approve the look (screenshots) before Task 2. If the canvas version does not match the mockup closely enough, report that instead of continuing.

---

### Task 2: Sparkle stars and shooting star

**Files:**
- Modify: `src/presentation/starField.ts`, `src/presentation/SkyBackdrop.ts`
- Create: `src/presentation/shootingStar.ts`
- Test: `tests/starField.test.ts` (append), `tests/shootingStar.test.ts`

**Interfaces:**
- Consumes: `isReducedMotion()` from `./transitions/motion.ts`.
- Produces: `Star.sparkle: boolean`; `sparklePoints(x: number, y: number, r: number): { x: number; y: number }[]` (8 points); in `shootingStar.ts`: `type ShootingStarSpec`, `nextShootingStarDelayMs(rand): number`, `makeShootingStar(rand, bounds): ShootingStarSpec`, `shootingStarSegment(spec, elapsedMs): { tailX; tailY; headX; headY; alpha } | null`.

- [ ] **Step 1: Impact check** — GitNexus `impact` on `Star` and `generateStarField`.

- [ ] **Step 2: Failing tests**

Append to `tests/starField.test.ts` (import `sparklePoints` in the existing import list):

```ts
describe('sparkles', () => {
  test('3 of the 30 twinkling stars are sparkles, no static star is', () => {
    const field = generateStarField(1, BOUNDS);
    expect(field.twinkling.filter((s) => s.sparkle)).toHaveLength(3);
    expect(field.static.some((s) => s.sparkle)).toBe(false);
  });

  test('sparklePoints returns an 8-point four-pointed star around the centre', () => {
    const pts = sparklePoints(100, 200, 2);
    expect(pts).toHaveLength(8);
    expect(pts[0]).toEqual({ x: 100, y: 200 - 2 * 6 });
    expect(pts[2]).toEqual({ x: 100 + 2 * 6, y: 200 });
  });
});
```

Create `tests/shootingStar.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  makeShootingStar,
  nextShootingStarDelayMs,
  shootingStarSegment,
} from '../src/presentation/shootingStar.ts';

const BOUNDS = { width: 720, height: 1280 };
const fixed = (v: number) => () => v;

describe('shootingStar', () => {
  test('delay is between 6 and 12 seconds', () => {
    expect(nextShootingStarDelayMs(fixed(0))).toBe(6000);
    expect(nextShootingStarDelayMs(fixed(0.999))).toBeLessThan(12000);
  });

  test('the star starts in the upper part of the canvas and travels down-left', () => {
    const spec = makeShootingStar(fixed(0.5), BOUNDS);
    expect(spec.y).toBeLessThan(BOUNDS.height * 0.5);
    expect(spec.dx).toBeLessThan(0);
    expect(spec.dy).toBeGreaterThan(0);
    expect(Math.hypot(spec.dx, spec.dy)).toBeCloseTo(1, 5);
  });

  test('segment fades in and out and ends', () => {
    const spec = makeShootingStar(fixed(0.5), BOUNDS);
    expect(shootingStarSegment(spec, -1)).toBeNull();
    expect(shootingStarSegment(spec, spec.durationMs)).toBeNull();
    const mid = shootingStarSegment(spec, spec.durationMs / 2)!;
    expect(mid.alpha).toBeCloseTo(1, 1);
    const early = shootingStarSegment(spec, spec.durationMs * 0.02)!;
    expect(early.alpha).toBeLessThan(0.2);
  });

  test('the tail is never longer than 120px and trails the head', () => {
    const spec = makeShootingStar(fixed(0.5), BOUNDS);
    const seg = shootingStarSegment(spec, spec.durationMs * 0.8)!;
    expect(Math.hypot(seg.headX - seg.tailX, seg.headY - seg.tailY)).toBeLessThanOrEqual(120.0001);
    expect(seg.tailX).toBeGreaterThan(seg.headX);
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run tests/starField.test.ts tests/shootingStar.test.ts`
Expected: FAIL (`sparkle`, `sparklePoints`, module missing).

- [ ] **Step 4: Implement sparkles** — in `starField.ts`: add `sparkle: boolean;` to `Star` (after `twinkles`); in `makeStar` return add `sparkle: false,`; change `twinkling` in `generateStarField` to:

```ts
    twinkling: Array.from({ length: TWINKLING_COUNT }, (_, i) => ({
      ...makeStar(rand, bounds, true),
      // Cứ mười sao nhấp nháy thì một sao lấp lánh bốn cánh (3 trên 30)
      sparkle: i % 10 === 0,
    })),
```

and append:

```ts
/** Đa giác sao bốn cánh quanh (x, y); cánh dài gấp 6 lần bán kính sao. */
export function sparklePoints(x: number, y: number, r: number): { x: number; y: number }[] {
  const outer = r * 6;
  const inner = r * 1.4;
  return [
    { x, y: y - outer },
    { x: x + inner, y: y - inner },
    { x: x + outer, y },
    { x: x + inner, y: y + inner },
    { x, y: y + outer },
    { x: x - inner, y: y + inner },
    { x: x - outer, y },
    { x: x - inner, y: y - inner },
  ];
}
```

- [ ] **Step 5: Implement `src/presentation/shootingStar.ts`**

```ts
export type ShootingStarSpec = {
  x: number;
  y: number;
  /** Vector đơn vị hướng bay */
  dx: number;
  dy: number;
  travel: number;
  durationMs: number;
};

export type ShootingStarSegment = {
  tailX: number;
  tailY: number;
  headX: number;
  headY: number;
  alpha: number;
};

const TAIL_PX = 120;

export function nextShootingStarDelayMs(rand: () => number): number {
  return 6000 + rand() * 6000;
}

/** Bắt đầu ở nửa trên, bay chếch xuống trái. */
export function makeShootingStar(
  rand: () => number,
  bounds: { width: number; height: number }
): ShootingStarSpec {
  const angle = ((150 + rand() * 20) * Math.PI) / 180;
  return {
    x: bounds.width * (0.45 + rand() * 0.5),
    y: bounds.height * (0.05 + rand() * 0.35),
    dx: Math.cos(angle),
    dy: Math.sin(angle),
    travel: 260 + rand() * 160,
    durationMs: 700 + rand() * 400,
  };
}

export function shootingStarSegment(
  spec: ShootingStarSpec,
  elapsedMs: number
): ShootingStarSegment | null {
  const p = elapsedMs / spec.durationMs;
  if (p < 0 || p >= 1) return null;
  const headX = spec.x + spec.dx * spec.travel * p;
  const headY = spec.y + spec.dy * spec.travel * p;
  const tail = Math.min(TAIL_PX, spec.travel * p);
  return {
    headX,
    headY,
    tailX: headX - spec.dx * tail,
    tailY: headY - spec.dy * tail,
    alpha: Math.sin(Math.PI * p),
  };
}
```

- [ ] **Step 6: Wire into `SkyBackdrop`** — add imports `sparklePoints` (from `./starField.ts`), `makeShootingStar, nextShootingStarDelayMs, shootingStarSegment` and type `ShootingStarSpec` (from `./shootingStar.ts`), `isReducedMotion` (from `./transitions/motion.ts`). Add fields:

```ts
  private shootingStar: ShootingStarSpec | null = null;
  private shootingStarStartedMs = 0;
  private nextShootingStarAtMs = nextShootingStarDelayMs(Math.random);
```

In `update`, inside the twinkling loop replace the `fillCircle` line with:

```ts
      if (star.sparkle) {
        this.twinkleLayer.fillPoints(sparklePoints(star.x, y, star.r), true);
      } else {
        this.twinkleLayer.fillCircle(star.x, y, star.r);
      }
```

and after the loop (before `this.dimLayer.setAlpha`) add `this.drawShootingStar();`. Add the method:

```ts
  /** Một sao băng tại một thời điểm; bỏ qua khi giảm chuyển động hoặc nền đang tối (mood play). */
  private drawShootingStar(): void {
    if (isReducedMotion() || this.moodState.dim > 0) {
      this.shootingStar = null;
      return;
    }
    if (!this.shootingStar) {
      if (this.elapsedMs < this.nextShootingStarAtMs) return;
      this.shootingStar = makeShootingStar(Math.random, LAYOUT_TOKENS.canvas);
      this.shootingStarStartedMs = this.elapsedMs;
    }
    const seg = shootingStarSegment(this.shootingStar, this.elapsedMs - this.shootingStarStartedMs);
    if (!seg) {
      this.shootingStar = null;
      this.nextShootingStarAtMs = this.elapsedMs + nextShootingStarDelayMs(Math.random);
      return;
    }
    this.twinkleLayer.lineStyle(2, 0xffffff, seg.alpha * 0.9);
    this.twinkleLayer.lineBetween(seg.tailX, seg.tailY, seg.headX, seg.headY);
    this.twinkleLayer.fillStyle(0xffffff, seg.alpha);
    this.twinkleLayer.fillCircle(seg.headX, seg.headY, 2.2);
  }
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run tests/starField.test.ts tests/shootingStar.test.ts` then `npm run typecheck`
Expected: PASS.

- [ ] **Step 8: CHANGELOG and commit** — entry `### 2026-10-08 - Sparkle stars and shooting star`; verification lists the test commands and a visual check on the menu (wait up to 12 s for a shooting star; with Settings → reduced motion on, none appears).

```bash
git add game-next/src/presentation game-next/tests CHANGELOG.md
git commit -m "feat(ui): four-point sparkles and an occasional shooting star"
```

---

### Task 3: Frame budget and FPS overlay

**Files:**
- Create: `src/presentation/frameBudget.ts`, `src/devtools/fpsOverlay.ts`
- Modify: `src/presentation/SkyBackdrop.ts`, `src/main.ts`
- Test: `tests/frameBudget.test.ts`

**Interfaces:**
- Produces: `class FrameBudget { push(deltaMs: number): void; get reduced(): boolean; reset(): void }`, `const frameBudget: FrameBudget` (session singleton), constants `FRAME_WINDOW = 60`, `SLOW_FRAME_MS`, `HITCH_MS`; `installFpsOverlay(game: Phaser.Game): void` (always defines `window.__mirrorFps`; shows a DOM label only when the URL has `?fps`).

- [ ] **Step 1: Failing test** — `tests/frameBudget.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { FRAME_WINDOW, FrameBudget } from '../src/presentation/frameBudget.ts';

function feed(budget: FrameBudget, deltaMs: number, frames: number): void {
  for (let i = 0; i < frames; i++) budget.push(deltaMs);
}

describe('FrameBudget', () => {
  test('stays on full effects at 60 fps', () => {
    const b = new FrameBudget();
    feed(b, 16.7, FRAME_WINDOW * 5);
    expect(b.reduced).toBe(false);
  });

  test('one slow window is not enough, two consecutive slow windows reduce effects', () => {
    const b = new FrameBudget();
    feed(b, 30, FRAME_WINDOW);
    expect(b.reduced).toBe(false);
    feed(b, 30, FRAME_WINDOW);
    expect(b.reduced).toBe(true);
  });

  test('a fast window between slow ones resets the count', () => {
    const b = new FrameBudget();
    feed(b, 30, FRAME_WINDOW);
    feed(b, 16, FRAME_WINDOW);
    feed(b, 30, FRAME_WINDOW);
    expect(b.reduced).toBe(false);
  });

  test('hitches over 100 ms (scene changes, texture bakes) are ignored', () => {
    const b = new FrameBudget();
    for (let i = 0; i < FRAME_WINDOW * 3; i++) {
      b.push(16);
      b.push(400);
    }
    expect(b.reduced).toBe(false);
  });

  test('reduced is sticky for the session until reset', () => {
    const b = new FrameBudget();
    feed(b, 30, FRAME_WINDOW * 2);
    feed(b, 16, FRAME_WINDOW * 3);
    expect(b.reduced).toBe(true);
    b.reset();
    expect(b.reduced).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/frameBudget.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `src/presentation/frameBudget.ts`**

```ts
export const FRAME_WINDOW = 60;
/** Dưới 45 FPS thì coi là chậm. */
export const SLOW_FRAME_MS = 1000 / 45;
/** Khung dài hơn mức này là khựng do đổi cảnh hoặc nướng texture, không tính. */
export const HITCH_MS = 100;

/**
 * Theo dõi thời gian khung hình theo cửa sổ 60 khung. Hai cửa sổ liên tiếp chậm
 * hơn 45 FPS thì chuyển sang hiệu ứng giảm cho cả phiên. Giữ nguyên cả phiên để
 * hiệu ứng không bật tắt liên tục.
 */
export class FrameBudget {
  private sum = 0;
  private count = 0;
  private slowWindows = 0;
  private isReduced = false;

  push(deltaMs: number): void {
    if (deltaMs <= 0 || deltaMs > HITCH_MS) return;
    this.sum += deltaMs;
    this.count++;
    if (this.count < FRAME_WINDOW) return;
    const mean = this.sum / this.count;
    this.sum = 0;
    this.count = 0;
    this.slowWindows = mean > SLOW_FRAME_MS ? this.slowWindows + 1 : 0;
    if (this.slowWindows >= 2) this.isReduced = true;
  }

  get reduced(): boolean {
    return this.isReduced;
  }

  reset(): void {
    this.sum = 0;
    this.count = 0;
    this.slowWindows = 0;
    this.isReduced = false;
  }
}

export const frameBudget = new FrameBudget();
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run tests/frameBudget.test.ts` → PASS.

- [ ] **Step 5: Use it in `SkyBackdrop`** — import `frameBudget` from `./frameBudget.ts`. At the top of `update(deltaMs)` add `frameBudget.push(deltaMs);`. In the twinkling loop change `for (const star of this.twinklingStars)` to `this.twinklingStars.forEach((star, i) => {` … `});` with first line `if (frameBudget.reduced && i % 2 === 1) return;` (halves the twinkling stars on a slow device). In `drawShootingStar` extend the first guard to `if (isReducedMotion() || frameBudget.reduced || this.moodState.dim > 0)`.

- [ ] **Step 6: Create `src/devtools/fpsOverlay.ts`**

```ts
import type Phaser from 'phaser';
import { frameBudget } from '../presentation/frameBudget.ts';

declare global {
  interface Window {
    __mirrorFps?: () => number;
  }
}

/**
 * `window.__mirrorFps()` luôn có, để đo trên máy Android qua chrome://inspect:
 *   setInterval(() => console.log(__mirrorFps().toFixed(0)), 500)
 * Nhãn trên màn hình chỉ hiện khi URL có `?fps` (bản web).
 */
export function installFpsOverlay(game: Phaser.Game): void {
  window.__mirrorFps = () => game.loop.actualFps;
  if (!new URLSearchParams(window.location.search).has('fps')) return;

  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:4px;left:4px;z-index:9999;padding:2px 6px;font:12px monospace;color:#0f0;background:#000a;pointer-events:none';
  document.body.appendChild(el);
  window.setInterval(() => {
    el.textContent = `${game.loop.actualFps.toFixed(0)} fps${frameBudget.reduced ? ' (reduced)' : ''}`;
  }, 500);
}
```

- [ ] **Step 7: Install it in `main.ts`** — add `import { installFpsOverlay } from './devtools/fpsOverlay.ts';` with the other imports, and directly after the statement `const game = new Phaser.Game({ … });` (starts at line 106) add `installFpsOverlay(game);`.

- [ ] **Step 8: Typecheck and full test** — `npm run typecheck` then `npm test`. Expected: all pass.

- [ ] **Step 9: CHANGELOG and commit** — entry `### 2026-10-08 - Frame budget and FPS overlay`; verification includes `npm test` counts and opening `http://localhost:5173/?scene=menu&fps` to see the label.

```bash
git add game-next/src game-next/tests CHANGELOG.md
git commit -m "feat(ui): frame budget drops optional sky effects below 45 fps"
```

---

### Task 4: Readable fact line on the menu

**Files:**
- Create: `src/presentation/menu/factBacking.ts`
- Modify: `src/presentation/MenuScene.ts` (fact caption block, ~line 185)
- Test: `tests/factBacking.test.ts`

**Interfaces:**
- Produces: `FACT_BACKING_ALPHA = 0.72`; `factBackingRect(textWidth: number, textHeight: number, cx: number, cy: number): { x: number; y: number; w: number; h: number; radius: number }`.

- [ ] **Step 1: Impact check** — GitNexus `impact` on `MenuScene` and `buildMainMenu`.

- [ ] **Step 2: Failing test** — `tests/factBacking.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { FACT_BACKING_ALPHA, factBackingRect } from '../src/presentation/menu/factBacking.ts';
import { COLOR_TOKENS } from '../src/presentation/designTokens.ts';

function lum(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function blend(bg: string, over: string, alpha: number): string {
  const mix = [1, 3, 5].map((i) => {
    const b = parseInt(bg.slice(i, i + 2), 16);
    const o = parseInt(over.slice(i, i + 2), 16);
    return Math.round(o * alpha + b * (1 - alpha));
  });
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

describe('factBackingRect', () => {
  test('is centred on the text with padding', () => {
    const r = factBackingRect(400, 40, 360, 830);
    expect(r.x + r.w / 2).toBe(360);
    expect(r.y + r.h / 2).toBe(830);
    expect(r.w).toBeGreaterThan(400);
    expect(r.h).toBeGreaterThan(40);
  });

  test('text stays at 4.5:1 over the brightest cloud colour', () => {
    const bg = blend(COLOR_TOKENS.sky.cloud.hot, COLOR_TOKENS.modal.backdrop, FACT_BACKING_ALPHA);
    const l1 = lum('#B9C9F2');
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 3: Run it to verify it fails** — `npx vitest run tests/factBacking.test.ts` → FAIL.

- [ ] **Step 4: Implement `src/presentation/menu/factBacking.ts`**

```ts
/** Nền tối mờ sau câu thiên văn để đọc được trên dải mây sáng nhất. */
export const FACT_BACKING_ALPHA = 0.72;

const PAD_X = 22;
const PAD_Y = 12;

export function factBackingRect(
  textWidth: number,
  textHeight: number,
  cx: number,
  cy: number
): { x: number; y: number; w: number; h: number; radius: number } {
  const w = textWidth + PAD_X * 2;
  const h = textHeight + PAD_Y * 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h, radius: 20 };
}
```

- [ ] **Step 5: Run to verify it passes** — `npx vitest run tests/factBacking.test.ts` → PASS.

- [ ] **Step 6: Use it in `MenuScene.ts`** — import `{ FACT_BACKING_ALPHA, factBackingRect } from './menu/factBacking.ts'`. Replace the line `this.titleBlock.add(factCaption);` with:

```ts
    const backing = factBackingRect(factCaption.width, factCaption.height, 360, 830);
    const factBacking = this.add.graphics();
    factBacking.fillStyle(COLOR_NUMBERS.navyBackdrop, FACT_BACKING_ALPHA);
    factBacking.fillRoundedRect(backing.x, backing.y, backing.w, backing.h, backing.radius);
    factBacking.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.2);
    factBacking.strokeRoundedRect(backing.x, backing.y, backing.w, backing.h, backing.radius);
    this.titleBlock.add([factBacking, factCaption]);
```

The caption's position, text and wrap width are unchanged (layout frozen).

- [ ] **Step 7: Typecheck, test, look** — `npm run typecheck`, `npm test`; open `?scene=menu` and check the line reads over the bright band (try several reloads: the fact is random). Save `docs/testing/journey-map/task4-menu.png`.

- [ ] **Step 8: CHANGELOG and commit** — entry `### 2026-10-08 - Menu fact line backing`.

```bash
git add game-next/src game-next/tests CHANGELOG.md docs/testing/journey-map
git commit -m "feat(ui): translucent backing keeps the menu fact line readable"
```

---

### Task 5: Chapter sky zones on the map

**Files:**
- Modify: `src/presentation/designTokens.ts` (add `COLOR_TOKENS.zone`), `src/presentation/LevelSelectScene.ts` (remove `CHAPTER_TINTS`, lines 37-42; replace the backdrop loop at ~lines 261-268)
- Create: `src/presentation/chapterZoneModel.ts`, `src/presentation/chapterZone.ts`
- Test: `tests/chapterZoneModel.test.ts`

**Interfaces:**
- Consumes: `radialGlow` from `./SkyBackdrop.ts`; `ChapterBand` from `./constellationLayout.ts`; `mulberry32` from `./starField.ts`.
- Produces: `COLOR_TOKENS.zone[1..4] = { base, accent }`; `ZONE_FADE_PX = 220`; `type ZoneSpec`, `CHAPTER_ZONES: Record<Chapter, ZoneSpec>`; `type ZoneBlob = { x; y; r; hex; alpha; stretch }`; `zoneBlobs(chapter: Chapter, bandHeight: number, seed: number): ZoneBlob[]` (local coordinates: y in `[ZONE_FADE_PX, ZONE_FADE_PX + bandHeight]`); `bakeChapterZone(scene: Phaser.Scene, band: ChapterBand): Phaser.GameObjects.GameObject`.

- [ ] **Step 1: Impact check** — GitNexus `impact` on `buildConstellation` and `CHAPTER_TINTS`.

- [ ] **Step 2: Failing test** — `tests/chapterZoneModel.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { CHAPTER_ZONES, ZONE_FADE_PX, zoneBlobs } from '../src/presentation/chapterZoneModel.ts';
import { COLOR_TOKENS } from '../src/presentation/designTokens.ts';

const CHAPTERS = [1, 2, 3, 4] as const;

describe('chapter zones', () => {
  test('every chapter has a zone built from its own tokens', () => {
    for (const c of CHAPTERS) {
      expect(CHAPTER_ZONES[c].base).toBe(COLOR_TOKENS.zone[c].base);
      expect(CHAPTER_ZONES[c].accent).toBe(COLOR_TOKENS.zone[c].accent);
    }
  });

  test('the four chapters have four different base colours', () => {
    const bases = new Set(CHAPTERS.map((c) => CHAPTER_ZONES[c].base));
    expect(bases.size).toBe(4);
  });

  test('blobs stay inside the padded band and never exceed the fade distance', () => {
    for (const c of CHAPTERS) {
      for (const b of zoneBlobs(c, 1100, 5)) {
        expect(b.y).toBeGreaterThanOrEqual(ZONE_FADE_PX);
        expect(b.y).toBeLessThanOrEqual(ZONE_FADE_PX + 1100);
        expect(b.r).toBeLessThanOrEqual(ZONE_FADE_PX);
        expect([CHAPTER_ZONES[c].base, CHAPTER_ZONES[c].accent]).toContain(b.hex);
      }
    }
  });

  test('is deterministic and scales with band height', () => {
    expect(zoneBlobs(2, 1100, 5)).toEqual(zoneBlobs(2, 1100, 5));
    expect(zoneBlobs(2, 1800, 5).length).toBeGreaterThan(zoneBlobs(2, 700, 5).length);
  });

  test('chapter 2 adds two overlapping discs, chapter 3 stretches its blobs', () => {
    const discs = zoneBlobs(2, 1100, 5).filter((b) => b.r === 200);
    expect(discs).toHaveLength(2);
    expect(zoneBlobs(3, 1100, 5).every((b) => b.stretch > 1)).toBe(true);
    expect(zoneBlobs(1, 1100, 5).every((b) => b.stretch === 1)).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails** — `npx vitest run tests/chapterZoneModel.test.ts` → FAIL.

- [ ] **Step 4: Tokens** — in `designTokens.ts` add to `COLOR_TOKENS` (after `sky`):

```ts
  /** Vùng trời riêng của từng chương trên bản đồ */
  zone: {
    1: { base: '#3A5BD0', accent: '#7FB8FF' },
    2: { base: '#8B5CE6', accent: '#E9A4F0' },
    3: { base: '#2FB5A0', accent: '#7EE0C8' },
    4: { base: '#E08A3C', accent: '#FFB86B' },
  },
```

- [ ] **Step 5: Create `src/presentation/chapterZoneModel.ts`**

```ts
import type { Chapter } from '../domain/model.ts';
import { COLOR_TOKENS } from './designTokens.ts';
import { mulberry32 } from './starField.ts';

/** Vùng đệm phía trên và dưới mỗi dải chương; bằng bán kính blob lớn nhất để mép mờ liền với chương kề. */
export const ZONE_FADE_PX = 220;

export type ZoneSpec = {
  base: string;
  accent: string;
  /** 1 là tròn, >1 kéo giãn ngang (nét cọ của Họa Phẩm) */
  stretch: number;
  alpha: number;
  /** Số blob trên mỗi 110px chiều cao dải */
  density: number;
  /** Hai đĩa chồng nhau gợi XOR (Giao Thoa) */
  discs?: boolean;
  /** Vài cung quỹ đạo mờ (Luân Chuyển) */
  arcs?: boolean;
};

const z = COLOR_TOKENS.zone;

export const CHAPTER_ZONES: Readonly<Record<Chapter, ZoneSpec>> = {
  1: { base: z[1].base, accent: z[1].accent, stretch: 1, alpha: 0.1, density: 0.7 },
  2: { base: z[2].base, accent: z[2].accent, stretch: 1, alpha: 0.14, density: 1, discs: true },
  3: { base: z[3].base, accent: z[3].accent, stretch: 2.2, alpha: 0.13, density: 1 },
  4: { base: z[4].base, accent: z[4].accent, stretch: 1, alpha: 0.14, density: 1, arcs: true },
};

export type ZoneBlob = {
  x: number;
  y: number;
  r: number;
  hex: string;
  alpha: number;
  stretch: number;
};

const MAP_WIDTH = 720;
const DISC_RADIUS = 200;

/** Toạ độ cục bộ của texture vùng: y chạy từ 0 (đầu vùng đệm) tới bandHeight + 2 * ZONE_FADE_PX. */
export function zoneBlobs(chapter: Chapter, bandHeight: number, seed: number): ZoneBlob[] {
  const spec = CHAPTER_ZONES[chapter];
  const rand = mulberry32(seed);
  const count = Math.max(4, Math.round((bandHeight / 110) * spec.density));
  const blobs: ZoneBlob[] = [];
  for (let i = 0; i < count; i++) {
    blobs.push({
      x: rand() * MAP_WIDTH,
      y: ZONE_FADE_PX + rand() * bandHeight,
      r: 120 + rand() * 100,
      hex: i % 3 === 0 ? spec.accent : spec.base,
      alpha: spec.alpha,
      stretch: spec.stretch,
    });
  }
  if (spec.discs) {
    const cy = ZONE_FADE_PX + bandHeight / 2;
    blobs.push(
      { x: 250, y: cy, r: DISC_RADIUS, hex: spec.accent, alpha: spec.alpha, stretch: 1 },
      { x: 470, y: cy, r: DISC_RADIUS, hex: spec.accent, alpha: spec.alpha, stretch: 1 }
    );
  }
  return blobs;
}
```

- [ ] **Step 6: Run to verify it passes** — `npx vitest run tests/chapterZoneModel.test.ts` → PASS.

- [ ] **Step 7: Create `src/presentation/chapterZone.ts`**

```ts
import type Phaser from 'phaser';
import type { ChapterBand } from './constellationLayout.ts';
import { CHAPTER_ZONES, ZONE_FADE_PX, zoneBlobs } from './chapterZoneModel.ts';
import { radialGlow } from './SkyBackdrop.ts';

/** Bake ở nửa độ phân giải: mây mềm nên không mất chi tiết, bộ nhớ texture giảm 4 lần. */
const SCALE = 0.5;

/**
 * Nướng một texture vùng trời cho dải chương và trả về ảnh đã đặt đúng chỗ.
 * Texture được gỡ khi scene tắt để Redmi 12 không giữ bộ nhớ thừa.
 */
export function bakeChapterZone(
  scene: Phaser.Scene,
  band: ChapterBand
): Phaser.GameObjects.GameObject {
  const height = band.bottom - band.top;
  const key = `zone_${band.chapter}_${Math.round(height)}`;
  const tm = scene.textures;

  if (!tm.exists(key)) {
    const texW = Math.ceil(720 * SCALE);
    const texH = Math.ceil((height + ZONE_FADE_PX * 2) * SCALE);
    const canvas = tm.createCanvas(key, texW, texH);
    if (canvas) {
      const ctx = canvas.context;
      ctx.scale(SCALE, SCALE);
      for (const b of zoneBlobs(band.chapter, height, band.chapter * 101)) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.stretch, 1);
        radialGlow(ctx, 0, 0, b.r, b.hex, b.alpha);
        ctx.restore();
      }
      if (CHAPTER_ZONES[band.chapter].arcs) {
        ctx.strokeStyle = CHAPTER_ZONES[band.chapter].accent;
        ctx.globalAlpha = 0.14;
        ctx.lineWidth = 3;
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath();
          ctx.arc(600, ZONE_FADE_PX + height * 0.5, 160 + k * 70, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      canvas.refresh();
    }
  }

  scene.events.once('shutdown', () => {
    if (tm.exists(key)) tm.remove(key);
  });

  if (!tm.exists(key)) return scene.add.graphics();
  return scene.add.image(360, (band.top + band.bottom) / 2, key).setScale(1 / SCALE);
}
```

- [ ] **Step 8: Use it in `LevelSelectScene.ts`** — add `import { bakeChapterZone } from './chapterZone.ts';`. Delete the `CHAPTER_TINTS` constant (lines 37-42). Replace the block commented `// 2. Sắc độ riêng cho từng chương…` through `this.mapContainer.add(chBackdrop);` with:

```ts
    // 2. Vùng trời riêng cho từng chương (chapterZone.ts), một texture mỗi dải
    for (const band of layout.chapters) {
      this.mapContainer.add(bakeChapterZone(this, band));
    }
```

Remove the `Chapter` import from `'../domain/model.ts'` only if the typecheck reports it unused.

- [ ] **Step 9: Typecheck, test, look** — `npm run typecheck`, `npm test`. Open `?scene=levelSelect` and scroll through all four chapters; each should read as its own colour and motif (two discs in chapter 2, stretched jade patches in 3, orbit arcs in 4) and blend at chapter borders without a visible seam. Save `docs/testing/journey-map/task5-map-ch1.png` … `-ch4.png`.

- [ ] **Step 10: CHANGELOG and commit** — entry `### 2026-10-08 - Chapter sky zones`; mention `CHAPTER_TINTS` removed.

```bash
git add game-next/src game-next/tests CHANGELOG.md docs/testing/journey-map
git commit -m "feat(ui): distinct sky zone per chapter on the level map"
```

---

### Task 6: Ghost silhouette on the current node

**Files:**
- Create: `src/presentation/nodeGhost.ts`
- Modify: `src/presentation/LevelSelectScene.ts` (`state === 'current'` branch, ~line 399)
- Test: `tests/nodeGhost.test.ts`

**Interfaces:**
- Produces: `GHOST_SILHOUETTE = { scale: 1.9, alpha: 0.22 }`; `showsGhostSilhouette(state: 'locked' | 'completed' | 'current' | 'unlocked'): boolean`.

- [ ] **Step 1: Failing test** — `tests/nodeGhost.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { GHOST_SILHOUETTE, showsGhostSilhouette } from '../src/presentation/nodeGhost.ts';

describe('nodeGhost', () => {
  test('only the current node shows a ghost (locked levels must not spoil)', () => {
    expect(showsGhostSilhouette('current')).toBe(true);
    expect(showsGhostSilhouette('locked')).toBe(false);
    expect(showsGhostSilhouette('unlocked')).toBe(false);
    expect(showsGhostSilhouette('completed')).toBe(false);
  });

  test('the ghost is faint and larger than the node', () => {
    expect(GHOST_SILHOUETTE.alpha).toBeLessThanOrEqual(0.3);
    expect(GHOST_SILHOUETTE.scale).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run tests/nodeGhost.test.ts` → FAIL.

- [ ] **Step 3: Implement `src/presentation/nodeGhost.ts`**

```ts
export const GHOST_SILHOUETTE = { scale: 1.9, alpha: 0.22 } as const;

/** Chỉ node hiện tại có bóng mờ; node khoá không hiện để khỏi lộ đáp án. */
export function showsGhostSilhouette(
  state: 'locked' | 'completed' | 'current' | 'unlocked'
): boolean {
  return state === 'current';
}
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run tests/nodeGhost.test.ts` → PASS.

- [ ] **Step 5: Draw it in `LevelSelectScene.ts`** — import `{ GHOST_SILHOUETTE, showsGhostSilhouette } from './nodeGhost.ts'`. Add a private method next to `showToast`:

```ts
  /** Bóng mờ của hình mục tiêu phía sau huy hiệu node hiện tại. */
  private addGhostSilhouette(container: Phaser.GameObjects.Container, levelId: string): void {
    const ghost = this.add.graphics();
    try {
      drawTargetSilhouette(ghost, loadLevel(levelId, this.mode), NODE_SILHOUETTE_FIT, {
        filled: COLOR_NUMBERS.iceHighlight,
        hollow: COLOR_NUMBERS.amberGlow,
      });
    } catch {
      // Level JSON không có ở chế độ này: bỏ bóng mờ, node vẫn dùng được.
      ghost.destroy();
      return;
    }
    ghost.setScale(GHOST_SILHOUETTE.scale).setAlpha(GHOST_SILHOUETTE.alpha);
    container.addAt(ghost, 0);
  }
```

At the start of the `else if (node.state === 'current') {` branch add:

```ts
        if (showsGhostSilhouette(node.state)) this.addGhostSilhouette(nodeContainer, node.id);
```

- [ ] **Step 6: Typecheck, test, look** — `npm run typecheck`, `npm test`. In the map, only the current node has a faint shape behind its diamond and it must not hide the node number. Save `docs/testing/journey-map/task6-current-node.png`.

- [ ] **Step 7: CHANGELOG and commit** — entry `### 2026-10-08 - Ghost silhouette on the current node`.

```bash
git add game-next/src game-next/tests CHANGELOG.md docs/testing/journey-map
git commit -m "feat(ui): faint target silhouette behind the current map node"
```

---

### Task 7: XOR chapter gate (then reviewer stop)

**Files:**
- Create: `src/presentation/chapterGateModel.ts`, `src/presentation/chapterGate.ts`
- Modify: `src/presentation/LevelSelectScene.ts` (chapter banner loop, ~lines 296-340)
- Test: `tests/chapterGateModel.test.ts`

**Interfaces:**
- Consumes: `isReducedMotion()` from `./transitions/motion.ts`; `Chapter` type.
- Produces:
  - `GATE = { cx: 360, rx: 150, ry: 34, closedOffset: 40, openOffset: 170, openMs: 600 }`
  - `gateRings(cy: number, spread: number): [GateRing, GateRing]` where `GateRing = { cx; cy; rx; ry }` and `spread` is 0 (closed) to 1 (open)
  - `clearedChapters(nodes: ReadonlyArray<{ chapter: Chapter; state: string }>): Set<Chapter>`
  - `resolveGates(chapters: readonly Chapter[], cleared: ReadonlySet<Chapter>, remembered: ReadonlySet<Chapter> | null): { gates: GateState[]; remembered: Set<Chapter> }` with `GateState = { chapter: Chapter; open: boolean; animate: boolean }` (no gate for the first chapter)
  - `gateMemory: { value: ReadonlySet<Chapter> | null }`
  - `addChapterGate(scene, bannerY, gate: GateState): Phaser.GameObjects.Container`

- [ ] **Step 1: Impact check** — GitNexus `impact` on `buildConstellation` again (the banner loop is inside it).

- [ ] **Step 2: Failing test** — `tests/chapterGateModel.test.ts`

```ts
import { describe, expect, test } from 'vitest';
import { GATE, clearedChapters, gateRings, resolveGates } from '../src/presentation/chapterGateModel.ts';

describe('gateRings', () => {
  test('closed rings overlap, open rings do not, and both stay on the 720px map', () => {
    const [a0, b0] = gateRings(500, 0);
    expect(b0.cx - a0.cx).toBeLessThan(a0.rx * 2);
    const [a1, b1] = gateRings(500, 1);
    expect(b1.cx - a1.cx).toBeGreaterThan(a1.rx * 2);
    expect(a1.cx - a1.rx).toBeGreaterThanOrEqual(0);
    expect(b1.cx + b1.rx).toBeLessThanOrEqual(720);
    expect(a0.cy).toBe(500);
  });

  test('rings are symmetric around the map centre', () => {
    const [a, b] = gateRings(0, 0.5);
    expect(a.cx + b.cx).toBe(GATE.cx * 2);
  });
});

describe('clearedChapters', () => {
  test('a chapter is cleared only when every node in it is completed', () => {
    const nodes = [
      { chapter: 1 as const, state: 'completed' },
      { chapter: 1 as const, state: 'completed' },
      { chapter: 2 as const, state: 'completed' },
      { chapter: 2 as const, state: 'current' },
    ];
    expect([...clearedChapters(nodes)]).toEqual([1]);
  });
});

describe('resolveGates', () => {
  const chapters = [1, 2, 3, 4] as const;

  test('there is no gate for the first chapter and a gate opens when the previous chapter is cleared', () => {
    const { gates } = resolveGates(chapters, new Set([1]), null);
    expect(gates.map((g) => g.chapter)).toEqual([2, 3, 4]);
    expect(gates.map((g) => g.open)).toEqual([true, false, false]);
  });

  test('the first visit of a session shows already-cleared gates open without animating', () => {
    const { gates, remembered } = resolveGates(chapters, new Set([1, 2]), null);
    expect(gates.every((g) => !g.animate)).toBe(true);
    expect([...remembered].sort()).toEqual([2, 3]);
  });

  test('a gate that opened since the last visit animates exactly once', () => {
    const first = resolveGates(chapters, new Set([1]), null);
    const second = resolveGates(chapters, new Set([1, 2]), first.remembered);
    expect(second.gates.find((g) => g.chapter === 3)).toMatchObject({ open: true, animate: true });
    expect(second.gates.find((g) => g.chapter === 2)).toMatchObject({ open: true, animate: false });
    const third = resolveGates(chapters, new Set([1, 2]), second.remembered);
    expect(third.gates.every((g) => !g.animate)).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify it fails** — `npx vitest run tests/chapterGateModel.test.ts` → FAIL.

- [ ] **Step 4: Implement `src/presentation/chapterGateModel.ts`**

```ts
import type { Chapter } from '../domain/model.ts';

export const GATE = {
  cx: 360,
  rx: 150,
  ry: 34,
  closedOffset: 40,
  openOffset: 170,
  openMs: 600,
} as const;

export type GateRing = { cx: number; cy: number; rx: number; ry: number };
export type GateState = { chapter: Chapter; open: boolean; animate: boolean };

/** Hai vòng elip đối xứng quanh giữa bản đồ; spread 0 là chồng nhau (đóng), 1 là tách ra (mở). */
export function gateRings(cy: number, spread: number): [GateRing, GateRing] {
  const dx = GATE.closedOffset + (GATE.openOffset - GATE.closedOffset) * spread;
  return [
    { cx: GATE.cx - dx, cy, rx: GATE.rx, ry: GATE.ry },
    { cx: GATE.cx + dx, cy, rx: GATE.rx, ry: GATE.ry },
  ];
}

export function clearedChapters(
  nodes: ReadonlyArray<{ chapter: Chapter; state: string }>
): Set<Chapter> {
  const total = new Map<Chapter, number>();
  const done = new Map<Chapter, number>();
  for (const n of nodes) {
    total.set(n.chapter, (total.get(n.chapter) ?? 0) + 1);
    if (n.state === 'completed') done.set(n.chapter, (done.get(n.chapter) ?? 0) + 1);
  }
  const cleared = new Set<Chapter>();
  for (const [chapter, count] of total) {
    if (done.get(chapter) === count) cleared.add(chapter);
  }
  return cleared;
}

/**
 * Cổng của chương N mở khi chương N-1 đã xong. `remembered` là các cổng đã mở ở
 * lần xem trước trong phiên (chỉ lưu trong bộ nhớ). Lần đầu của phiên (null) thì
 * cổng đã mở hiện luôn ở trạng thái mở, không chạy hoạt ảnh.
 */
export function resolveGates(
  chapters: readonly Chapter[],
  cleared: ReadonlySet<Chapter>,
  remembered: ReadonlySet<Chapter> | null
): { gates: GateState[]; remembered: Set<Chapter> } {
  const gates: GateState[] = [];
  const nextRemembered = new Set<Chapter>();
  for (let i = 1; i < chapters.length; i++) {
    const chapter = chapters[i];
    const open = cleared.has(chapters[i - 1]);
    gates.push({ chapter, open, animate: open && remembered !== null && !remembered.has(chapter) });
    if (open) nextRemembered.add(chapter);
  }
  return { gates, remembered: nextRemembered };
}

/** Bộ nhớ trong phiên; không có khoá localStorage mới. */
export const gateMemory: { value: ReadonlySet<Chapter> | null } = { value: null };
```

- [ ] **Step 5: Run to verify it passes** — `npx vitest run tests/chapterGateModel.test.ts` → PASS.

- [ ] **Step 6: Create `src/presentation/chapterGate.ts`**

```ts
import type Phaser from 'phaser';
import { GATE, gateRings } from './chapterGateModel.ts';
import type { GateState } from './chapterGateModel.ts';
import { isReducedMotion } from './transitions/motion.ts';

const W = 720;
const H = 120;
const CY = H / 2;
const CLOSED_KEY = 'gate_closed';
const RING_KEY = 'gate_ring';

/**
 * Hai texture dùng chung cho mọi cổng.
 *  - gate_closed: hai vòng chồng nhau, phần giao để trống bằng compositing 'xor'
 *    của canvas, tức là đúng luật chẵn-biến-mất của game.
 *  - gate_ring: một vòng đơn, đặt hai bản khi cổng mở.
 */
function ensureGateTextures(scene: Phaser.Scene): void {
  const tm = scene.textures;

  if (!tm.exists(CLOSED_KEY)) {
    const canvas = tm.createCanvas(CLOSED_KEY, W, H);
    if (canvas) {
      const ctx = canvas.context;
      const [a, b] = gateRings(CY, 0);
      ctx.fillStyle = 'rgba(169, 227, 255, 0.16)';
      ctx.beginPath();
      ctx.ellipse(a.cx, a.cy, a.rx, a.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'xor';
      ctx.beginPath();
      ctx.ellipse(b.cx, b.cy, b.rx, b.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(207, 239, 255, 0.7)';
      for (const r of [a, b]) {
        ctx.beginPath();
        ctx.ellipse(r.cx, r.cy, r.rx, r.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      canvas.refresh();
    }
  }

  if (!tm.exists(RING_KEY)) {
    const canvas = tm.createCanvas(RING_KEY, W, H);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = 'rgba(255, 232, 166, 0.10)';
      ctx.strokeStyle = 'rgba(255, 232, 166, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W / 2, CY, GATE.rx, GATE.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      canvas.refresh();
    }
  }
}

/**
 * Cổng giữa hai chương, đặt phía sau tiêu đề chương. Đóng: hai vòng chồng nhau.
 * Mở: hai vòng tách ra hai bên; nếu `gate.animate` thì tách dần trong GATE.openMs
 * (bỏ qua khi Giảm chuyển động).
 */
export function addChapterGate(
  scene: Phaser.Scene,
  bannerY: number,
  gate: GateState
): Phaser.GameObjects.Container {
  ensureGateTextures(scene);
  const container = scene.add.container(0, bannerY);
  const closed = scene.add.image(GATE.cx, 0, CLOSED_KEY);
  const left = scene.add.image(GATE.cx - GATE.closedOffset, 0, RING_KEY);
  const right = scene.add.image(GATE.cx + GATE.closedOffset, 0, RING_KEY);
  container.add([closed, left, right]);

  const apply = (spread: number): void => {
    const [a, b] = gateRings(0, spread);
    left.setX(a.cx);
    right.setX(b.cx);
    const ringAlpha = Math.min(1, spread * 4);
    left.setAlpha(ringAlpha);
    right.setAlpha(ringAlpha);
    closed.setAlpha(1 - ringAlpha);
  };

  if (!gate.open) {
    apply(0);
  } else if (gate.animate && !isReducedMotion()) {
    apply(0);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: GATE.openMs,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => apply(tween.getValue() ?? 1),
    });
  } else {
    apply(1);
  }
  return container;
}
```

- [ ] **Step 7: Place the gates in `LevelSelectScene.ts`** — add imports `addChapterGate` from `./chapterGate.ts` and `{ clearedChapters, gateMemory, resolveGates }` from `./chapterGateModel.ts`. In `buildConstellation`, directly before the `// 4. Tiêu đề phân đoạn Chương` loop add:

```ts
    const resolved = resolveGates(
      layout.chapters.map((b) => b.chapter),
      clearedChapters(nodes),
      gateMemory.value
    );
    gateMemory.value = resolved.remembered;
```

Inside the loop, immediately before `chContainer.add([plate, chBg, chText]);` add:

```ts
      const gate = resolved.gates.find((g) => g.chapter === band.chapter);
      if (gate) {
        const gateView = addChapterGate(this, band.bannerY, gate);
        this.mapContainer.add(gateView);
        this.linkParts.push(gateView);
      }
```

(Added before `this.mapContainer.add(chContainer)` so the gate sits behind the banner text.)

- [ ] **Step 8: Typecheck, test, look** — `npm run typecheck`, `npm test`. In `?scene=levelSelect` the boundary banners for chapters 2–4 show the overlapping rings with an empty lens in the middle; with progress that clears chapter 1 (use Studio/harness or edit localStorage progress in dev) the chapter-2 gate shows two separate amber rings; the first open after a fresh clear animates once and not again after leaving and re-entering the map. Check the banner rule lines do not clash with the ring outlines; if they do, remove the `chBg.lineBetween` rules for chapters that have a gate. Save `docs/testing/journey-map/task7-gate-closed.png` and `task7-gate-open.png`.

- [ ] **Step 9: CHANGELOG and commit** — entry `### 2026-10-08 - XOR chapter gate`.

```bash
git add game-next/src game-next/tests CHANGELOG.md docs/testing/journey-map
git commit -m "feat(ui): XOR gate between chapters on the level map"
```

**STOP — reviewer stop point.** Build the debug APK and measure on both phones (see Task 8 Step 1) before the reviewer signs off.

---

### Task 8: Device measurement and docs

**Files:**
- Modify: `docs/ai/STATUS.md`, `docs/ai/ARCHITECTURE.md`, `docs/ai/DOCS-INDEX.md`, `CHANGELOG.md`
- Create: `docs/testing/journey-map/device-fps.md`

- [ ] **Step 1: Build and install**

Run (from `game-next/`): `npm run android:sync`, then in `game-next/android/`: `cmd /c gradlew.bat assembleDebug`. Install `app/build/outputs/apk/debug/app-debug.apk` on the Redmi Note 13 Pro 5G and the Redmi 12 (`adb install -r <apk>`).

- [ ] **Step 2: Measure FPS** — With each phone connected over USB and USB debugging on, open `chrome://inspect` in desktop Chrome, inspect the app WebView, and run in the console: `setInterval(() => console.log(__mirrorFps().toFixed(0)), 500)`. For each phone record the average and the lowest value over 20 s for: (a) menu idle, (b) level map scrolling fast through all four chapters, (c) map right after clearing a chapter (gate animation). Also record whether `frameBudget` switched to reduced effects (call `__mirrorFps` is not enough: check that the shooting star stopped appearing).

- [ ] **Step 3: Write `docs/testing/journey-map/device-fps.md`** — table of device × scene × average/lowest FPS, the pass/fail against the budget (Note 13 Pro ≥ 55, Redmi 12 ≥ 45), and observations. If a device misses its budget, do not tune blindly: report which scene misses and by how much to the reviewer.

- [ ] **Step 4: Docs**

- `docs/ai/ARCHITECTURE.md`: add a short "Sky and map visuals" note: sky is a baked texture (`milkyWay.ts` + `SkyBackdrop.paintSky`), per-chapter zones are baked per band at half resolution and removed on scene shutdown, gates use canvas `xor` compositing, `frameBudget` is a session singleton that drops shooting stars and halves twinkling stars below 45 FPS, `window.__mirrorFps()` exists for device measurement.
- `docs/ai/STATUS.md`: overwrite per `AGENTS.md` (≤ 60 lines, bump the date, add the JM stream row, next step, device results, gotchas learned).
- `docs/ai/DOCS-INDEX.md`: set row `JM` plan column to `plans/2026-10-08-jm-journey-map-visual-refresh.md` and state `done` (or `in-progress` if the FPS check failed).
- `CHANGELOG.md`: entry `### 2026-10-08 - Journey map visual refresh: device results and docs` with the FPS numbers in the `Verification:` bullet.

- [ ] **Step 5: Final check and commit**

Run from `game-next/`: `npm test`, `npm run build`; from repo root: `git diff --check`, `git status`. Run GitNexus `detect_changes()` and confirm the affected symbols are `SkyBackdrop`, `MenuScene`, `LevelSelectScene` and the new modules.

```bash
git add docs CHANGELOG.md
git commit -m "docs(ai): journey map refresh device results and architecture notes"
```

---

## Self-Review

1. **Spec coverage:** §1 sky → Task 1–2; menu style + frozen layout + fact backing → Tasks 1, 4; chapter zones → Task 5; silhouette (current node ghost, locked none, completed unchanged) → Task 6; XOR gate and once-per-clear animation → Task 7; §6 budget (devices, reduced fallback, baked textures, shutdown release, reduced motion) → Tasks 3, 5, 7, 8; §7 testing → one test file per pure module plus device check; §8 risks (Canvas look) → Task 1 spike and stop. Deferred items (landmarks, stelae, end-of-chapter pacing) have no tasks, as in the spec.
2. **Placeholder scan:** no TBD/TODO; every code step has code; visual tuning in Task 1 Step 9 names exactly which values to adjust.
3. **Type consistency:** `CloudBlob`, `ZoneBlob`, `GateState`, `GateRing`, `showsGhostSilhouette`, `frameBudget`, `mulberry32` names match across tasks. `Chapter` is `1|2|3|4` from `domain/model.ts`. Node states are `'locked' | 'completed' | 'current' | 'unlocked'` as in `LevelSelectScene`.

# F1 — Nền tảng chuyển động và chuyển cảnh điện ảnh

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay 13 lời gọi `scene.start` cắt cứng bằng một `SceneDirector` cho cảnh cũ rút đi và cảnh mới dựng lên từng lớp, trên một bầu trời chạy liên tục. Tuyến vào màn chơi dài 1500 ms, các tuyến khác 1000 ms. Chạm bất kỳ để bỏ qua, và có cài đặt Giảm chuyển động.

**Architecture:**
- Logic thời gian là TypeScript thuần, test được không cần Phaser: `motion.ts` (easing, so le), `TransitionTimeline` (bộ lập lịch tự giữ đồng hồ), `choreography.ts` (đưa phần tử vào/ra theo bảng bước), `routes.ts` (bảng bước từng tuyến), `SceneDirector` (máy trạng thái chuyển cảnh qua cổng `SceneHost`).
- Phần Phaser chỉ gồm `PhaserSceneHost`, `BackgroundScene`, và các hàm dàn dựng hiệu ứng đặc biệt cho từng scene.
- Mỗi scene cài `Choreographed` (`playIn` và `playOut`) rồi gọi `director.attach(this)` ở cuối `create()`.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Phaser 3.90, Capacitor 8.

**Spec:** `docs/superpowers/specs/2026-10-03-f1-scene-transitions-design.md` (mục 3.3 đã sửa ngày 2026-10-03: `next-level` có handoff 800 ms).

**Giao được gì:** đi giữa Menu, Bản đồ và Play không còn cắt cứng. Sao nền liền mạch giữa các cảnh. Tuyến nào cũng chạm để bỏ qua được. Bật "Giảm chuyển động" thì mọi tuyến chỉ còn mờ chéo 150 ms.

## Vị trí trong loạt plan

- **Nhánh:** `feat/motion-f1`, tách từ `docs/level-system-specs` (nhánh có đủ ba spec F1–F3).
- **Chạy tiếp theo:** plan F2 (`2026-10-03-f2-in-level-game-feel.md`). F2 dùng `motion.ts`, `TransitionTimeline` và `getMotionScale()` của plan này.
- **Để lại cho F3:** overlay `?fps=1` mà spec F1 mục 5.2 nhắc tới được làm trong plan F3 (spec F3 mục 2 định nghĩa đầy đủ). Plan này không làm overlay.
- **Không làm:** lớp trang trí WebGL `postFX` (spec F1 mục 3.6, ghi là tuỳ chọn).

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm` và `npx` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**. Kiểu chỉ import bằng `import type`. Không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị viết tiếng Việt theo văn phong file hiện có. Tên biến và hàm viết tiếng Anh.
- File logic thuần (`motion.ts`, `TransitionTimeline.ts`, `choreography.ts`, `routes.ts`, `stardust.ts`, `skyMood.ts`, phần lõi của `SceneDirector.ts`) **không import runtime từ `phaser`**. Chỉ được `import type`.
- Canvas 720 × 1280. Bia `x 40, y 200, 640 × 800`, tâm `(360, 600)`. Ấn Song Tinh ở Menu tâm `(360, 500)`. Khay `y 1016`.
- Thời lượng tuyến: `menu-to-play`, `map-to-play` và `next-level` là 1500 ms; `play-to-map`, `play-to-menu`, `menu-to-map` và `map-to-menu` là 1000 ms.
- Handoff: `menu-to-play` 200, `map-to-play` 300, `next-level` 800, `play-to-map` 400, `play-to-menu` 400, `menu-to-map` 300, `map-to-menu` 300.
- Mờ chéo khi Giảm chuyển động: 150 ms. Đổi mood bầu trời: 1000 ms (0 ms khi Giảm chuyển động).
- Mood bầu trời: `menu` `{ driftSpeed: 0, dim: 0 }`, `map` `{ driftSpeed: 1, dim: 0 }`, `play` `{ driftSpeed: 0, dim: 0.15 }`.
- Sau plan này, `scene.start(` chỉ còn xuất hiện trong `src/presentation/transitions/SceneDirector.ts`.
- Mỗi commit thêm một mục vào `CHANGELOG.md` ở đầu `## Unreleased` (quy tắc của repo), viết tiếng Anh theo mẫu mục hiện có.
- Kiểm tra trước mỗi commit: `npm run typecheck` và `npm test`. Task cuối chạy thêm `npm run content:validate` và `npm run build`.

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/presentation/transitions/motion.ts` | Easing, `stagger`, `scaleTiming`, trạng thái `motionScale`, kiểu `RouteId` |
| `src/presentation/transitions/TransitionTimeline.ts` | Bộ lập lịch tween và lời gọi, tự giữ đồng hồ, có `complete()` |
| `src/presentation/transitions/choreography.ts` | `Poseable`, `enter`, `exit`, `applySteps`, `stepsEndMs`, `orderByDistance` |
| `src/presentation/transitions/routes.ts` | Bảng bước và hằng số hiệu ứng đặc biệt của từng tuyến |
| `src/presentation/transitions/stardust.ts` | Lập kế hoạch ≤ 30 hạt bụi sao (thuần) |
| `src/presentation/transitions/SceneDirector.ts` | `SceneDirector`, `SceneHost`, `Choreographed`, `PhaserSceneHost`, singleton `director` |
| `src/presentation/transitions/playChoreography.ts` | Hiệu ứng đặc biệt của Play: lưới loang, bóng mục tiêu, vệt sáng, zoom, bụi sao, lật khung |
| `src/presentation/skyMood.ts` | Mood bầu trời và hàm cộng dồn trôi (thuần) |
| `src/presentation/SkyBackdrop.ts` | `driftSpeed` và `dim` thay cho cờ `drift` |
| `src/presentation/BackgroundScene.ts` | Scene nền chạy suốt game, `setMood` |
| `src/presentation/designTokens.ts` | `TRANSITION_TOKENS` |
| `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts` | `settings.reducedMotion`, `setReducedMotion` |
| `src/presentation/SettingsDialog.ts` | Nối nút Giảm chuyển động |
| `src/presentation/{Menu,LevelSelect,Play}Scene.ts` | Bỏ sky riêng, cài `Choreographed`, đổi scene qua director |
| `src/presentation/BoardRenderer.ts`, `Hud.ts`, `TargetBadge.ts` | Gom phần tử vào nhóm animate được, mở getter phần tử |
| `src/main.ts` | Đăng ký `BackgroundScene`, nối host, `boot`, xử lý Back và xuống nền |

---

### Task 1: Easing, so le và hệ số chuyển động

**Files:**
- Create: `game-next/src/presentation/transitions/motion.ts`
- Modify: `game-next/src/presentation/designTokens.ts` (thêm `TRANSITION_TOKENS` sau `ANIM_TOKENS`)
- Test: `game-next/tests/motion.test.ts`

**Interfaces:**
- Produces:
  - `EaseName = 'linear' | 'cubicOut' | 'cubicInOut' | 'backOut' | 'sineInOut'`
  - `EASES: Record<EaseName, (t: number) => number>`
  - `stagger(index: number, count: number, spanMs: number): number`
  - `scaleTiming(ms: number, scale?: number): number`
  - `getMotionScale(): number`, `setMotionScale(value: number): void`, `isReducedMotion(scale?: number): boolean`
  - `RouteId` (khoá của `TRANSITION_TOKENS.routes`)
  - `TRANSITION_TOKENS: { crossfadeMs: 150; moodMs: 1000; routes: Record<RouteId, { totalMs: number; handoffMs: number }> }`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/motion.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import {
  EASES,
  getMotionScale,
  isReducedMotion,
  scaleTiming,
  setMotionScale,
  stagger,
} from '../src/presentation/transitions/motion.ts';
import { TRANSITION_TOKENS } from '../src/presentation/designTokens.ts';

afterEach(() => setMotionScale(1));

describe('easing', () => {
  test.each(Object.keys(EASES) as Array<keyof typeof EASES>)('%s đi từ 0 tới 1', (name) => {
    expect(EASES[name](0)).toBeCloseTo(0, 9);
    expect(EASES[name](1)).toBeCloseTo(1, 9);
  });

  test('backOut vượt quá 1 ở giữa rồi về đúng 1', () => {
    expect(Math.max(...[0.6, 0.7, 0.8].map(EASES.backOut))).toBeGreaterThan(1);
  });
});

describe('stagger', () => {
  test('phân bố đều trong khoảng, phần tử cuối đúng bằng span', () => {
    expect([0, 1, 2, 3].map((i) => stagger(i, 4, 180))).toEqual([0, 60, 120, 180]);
  });

  test('một phần tử hoặc span 0 thì không trễ', () => {
    expect(stagger(0, 1, 300)).toBe(0);
    expect(stagger(2, 5, 0)).toBe(0);
  });

  test('chỉ số ngoài khoảng bị kẹp, không vượt span', () => {
    expect(stagger(9, 4, 180)).toBe(180);
    expect(stagger(-1, 4, 180)).toBe(0);
  });
});

describe('hệ số chuyển động', () => {
  test('mặc định 1, Giảm chuyển động là 0', () => {
    expect(getMotionScale()).toBe(1);
    setMotionScale(0);
    expect(getMotionScale()).toBe(0);
    expect(isReducedMotion()).toBe(true);
  });

  test('giá trị dương bất kỳ quy về 1', () => {
    setMotionScale(0.4);
    expect(getMotionScale()).toBe(1);
  });

  test('scaleTiming giữ nguyên ở 1, về 0 khi Giảm chuyển động', () => {
    expect(scaleTiming(120, 1)).toBe(120);
    expect(scaleTiming(120, 0)).toBe(0);
  });
});

describe('TRANSITION_TOKENS', () => {
  test('bảy tuyến với tổng và handoff theo spec', () => {
    expect(TRANSITION_TOKENS.routes).toEqual({
      'menu-to-play': { totalMs: 1500, handoffMs: 200 },
      'map-to-play': { totalMs: 1500, handoffMs: 300 },
      'next-level': { totalMs: 1500, handoffMs: 800 },
      'play-to-map': { totalMs: 1000, handoffMs: 400 },
      'play-to-menu': { totalMs: 1000, handoffMs: 400 },
      'menu-to-map': { totalMs: 1000, handoffMs: 300 },
      'map-to-menu': { totalMs: 1000, handoffMs: 300 },
    });
    expect(TRANSITION_TOKENS.crossfadeMs).toBe(150);
    expect(TRANSITION_TOKENS.moodMs).toBe(1000);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/motion.test.ts`
Expected: FAIL vì không tìm thấy module `motion.ts`.

- [ ] **Step 3: Thêm token**

Trong `game-next/src/presentation/designTokens.ts`, ngay sau khối `ANIM_TOKENS`:

```ts
/** Chuyển cảnh giữa Menu, Bản đồ và Play (spec F1 mục 3) */
export const TRANSITION_TOKENS = {
  crossfadeMs: 150,
  moodMs: 1000,
  routes: {
    'menu-to-play': { totalMs: 1500, handoffMs: 200 },
    'map-to-play': { totalMs: 1500, handoffMs: 300 },
    'next-level': { totalMs: 1500, handoffMs: 800 },
    'play-to-map': { totalMs: 1000, handoffMs: 400 },
    'play-to-menu': { totalMs: 1000, handoffMs: 400 },
    'menu-to-map': { totalMs: 1000, handoffMs: 300 },
    'map-to-menu': { totalMs: 1000, handoffMs: 300 },
  },
} as const;
```

- [ ] **Step 4: Viết `motion.ts`**

`game-next/src/presentation/transitions/motion.ts`:

```ts
import { TRANSITION_TOKENS } from '../designTokens.ts';

export type RouteId = keyof typeof TRANSITION_TOKENS.routes;

export type EaseName = 'linear' | 'cubicOut' | 'cubicInOut' | 'backOut' | 'sineInOut';

/** Hàm easing thuần, t trong [0, 1]. Tự viết để test được mà không cần Phaser. */
export const EASES: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  cubicOut: (t) => 1 - (1 - t) ** 3,
  cubicInOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/** Độ trễ so le của phần tử thứ `index` trong `count` phần tử, trải đều trên `spanMs`. */
export function stagger(index: number, count: number, spanMs: number): number {
  if (count <= 1 || spanMs <= 0) return 0;
  const i = Math.min(Math.max(index, 0), count - 1);
  return (i * spanMs) / (count - 1);
}

let motionScale = 1;

/** 1 là chuyển động đầy đủ, 0 là Giảm chuyển động. Không có mức giữa. */
export function getMotionScale(): number {
  return motionScale;
}

export function setMotionScale(value: number): void {
  motionScale = value <= 0 ? 0 : 1;
}

export function isReducedMotion(scale: number = motionScale): boolean {
  return scale <= 0;
}

/** Thời lượng chuyển động dịch vị trí: giữ nguyên, hoặc 0 khi Giảm chuyển động. */
export function scaleTiming(ms: number, scale: number = motionScale): number {
  return isReducedMotion(scale) ? 0 : ms;
}
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/motion.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck, test toàn bộ, thêm changelog, commit**

Thêm vào đầu `## Unreleased` trong `CHANGELOG.md`:

```markdown
### 2026-10-03 - Add motion primitives for scene transitions (F1 task 1)

- Added `game-next/src/presentation/transitions/motion.ts` (pure easing functions, `stagger`, `scaleTiming`, a global 0/1 motion scale) and `TRANSITION_TOKENS` with the seven routes from spec F1.
- Verification: `tests/motion.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.
```

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add game-next/src/presentation/transitions/motion.ts game-next/src/presentation/designTokens.ts game-next/tests/motion.test.ts CHANGELOG.md
git commit -m "feat(motion): add easing, stagger and transition tokens"
```

---

### Task 2: `TransitionTimeline`

**Files:**
- Create: `game-next/src/presentation/transitions/TransitionTimeline.ts`
- Test: `game-next/tests/transitionTimeline.test.ts`

**Interfaces:**
- Consumes: `EaseName`, `EASES` từ Task 1.
- Produces: `class TransitionTimeline`, gồm:
  - `constructor(originMs?: number)`
  - `at(ms: number, target: object, to: Record<string, number>, durationMs: number, ease?: EaseName, onUpdate?: () => void): this`
  - `call(ms: number, fn: () => void): this`
  - `onDone(fn: () => void): this`
  - `advance(dtMs: number): void`
  - `complete(): void`
  - `readonly durationMs: number`
  - `isFinished(): boolean`
- `ms` là mốc tính từ đầu tuyến. Timeline trừ `originMs` để ra mốc của riêng nó, kẹp ≥ 0.

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/transitionTimeline.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { TransitionTimeline } from '../src/presentation/transitions/TransitionTimeline.ts';

describe('TransitionTimeline', () => {
  test('tween tuyến tính theo thời gian, giá trị đầu lấy lúc tween bắt đầu', () => {
    const target = { x: 0 };
    const tl = new TransitionTimeline().at(100, target, { x: 10 }, 200, 'linear');
    target.x = 4; // đổi trước khi tween bắt đầu: tween phải đi từ 4
    tl.advance(100);
    expect(target.x).toBe(4);
    tl.advance(100);
    expect(target.x).toBeCloseTo(7, 9);
    tl.advance(100);
    expect(target.x).toBe(10);
    expect(tl.isFinished()).toBe(true);
  });

  test('originMs dời mốc: mốc tuyến 300 với origin 200 chạy ở mốc riêng 100', () => {
    const target = { a: 0 };
    const tl = new TransitionTimeline(200).at(300, target, { a: 1 }, 100, 'linear');
    expect(tl.durationMs).toBe(200);
    tl.advance(150);
    expect(target.a).toBeCloseTo(0.5, 9);
  });

  test('call chạy đúng một lần khi qua mốc', () => {
    const calls: number[] = [];
    const tl = new TransitionTimeline().call(50, () => calls.push(50));
    tl.advance(49);
    expect(calls).toEqual([]);
    tl.advance(1);
    tl.advance(10);
    expect(calls).toEqual([50]);
  });

  test('complete đưa mọi tween về đích, chạy call còn lại theo thứ tự mốc, đúng một lần', () => {
    const order: string[] = [];
    const a = { v: 0 };
    const tl = new TransitionTimeline()
      .call(300, () => order.push('c300'))
      .at(100, a, { v: 5 }, 100, 'cubicOut', () => order.push(`u${a.v}`))
      .call(0, () => order.push('c0'));
    tl.advance(0);
    tl.complete();
    tl.complete();
    expect(a.v).toBe(5);
    expect(order).toEqual(['c0', 'u5', 'c300']);
  });

  test('onDone chạy một lần khi xong; đăng ký sau khi xong thì chạy ngay', () => {
    let done = 0;
    const tl = new TransitionTimeline().at(0, { v: 0 }, { v: 1 }, 10).onDone(() => done++);
    tl.advance(5);
    expect(done).toBe(0);
    tl.advance(5);
    tl.advance(5);
    expect(done).toBe(1);
    tl.onDone(() => done++);
    expect(done).toBe(2);
  });

  test('timeline rỗng xong ngay ở advance(0)', () => {
    let done = false;
    const tl = new TransitionTimeline().onDone(() => (done = true));
    tl.advance(0);
    expect(done).toBe(true);
    expect(tl.durationMs).toBe(0);
  });

  test('tween thời lượng 0 nhảy thẳng tới đích', () => {
    const t = { y: 3 };
    new TransitionTimeline().at(0, t, { y: 9 }, 0).advance(0);
    expect(t.y).toBe(9);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/transitionTimeline.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 3: Viết `TransitionTimeline.ts`**

`game-next/src/presentation/transitions/TransitionTimeline.ts`:

```ts
import type { EaseName } from './motion.ts';
import { EASES } from './motion.ts';

type NumericProps = Record<string, number>;

type TweenEntry = {
  kind: 'tween';
  atMs: number;
  order: number;
  durationMs: number;
  target: NumericProps;
  to: NumericProps;
  from: NumericProps | null;
  ease: (t: number) => number;
  onUpdate?: () => void;
  done: boolean;
};

type CallEntry = { kind: 'call'; atMs: number; order: number; fn: () => void; done: boolean };

/**
 * Bộ lập lịch của một nửa chuyển cảnh. Tự giữ đồng hồ (SceneDirector gọi
 * `advance` mỗi khung hình), không dùng tween của Phaser, nên `complete()` đưa
 * mọi thứ về trạng thái cuối ngay trong cùng khung hình và test được bằng
 * vitest.
 */
export class TransitionTimeline {
  private readonly originMs: number;
  private readonly entries: Array<TweenEntry | CallEntry> = [];
  private doneCallbacks: Array<() => void> = [];
  private elapsedMs = 0;
  private finished = false;
  private counter = 0;

  constructor(originMs = 0) {
    this.originMs = originMs;
  }

  /** Mốc `ms` tính từ đầu tuyến; timeline trừ đi `originMs` của riêng nó. */
  at(
    ms: number,
    target: object,
    to: NumericProps,
    durationMs: number,
    ease: EaseName = 'cubicOut',
    onUpdate?: () => void
  ): this {
    this.entries.push({
      kind: 'tween',
      atMs: Math.max(0, ms - this.originMs),
      order: this.counter++,
      durationMs: Math.max(0, durationMs),
      target: target as NumericProps,
      to,
      from: null,
      ease: EASES[ease],
      onUpdate,
      done: false,
    });
    return this;
  }

  call(ms: number, fn: () => void): this {
    this.entries.push({
      kind: 'call',
      atMs: Math.max(0, ms - this.originMs),
      order: this.counter++,
      fn,
      done: false,
    });
    return this;
  }

  onDone(fn: () => void): this {
    if (this.finished) fn();
    else this.doneCallbacks.push(fn);
    return this;
  }

  get durationMs(): number {
    let end = 0;
    for (const e of this.entries) {
      end = Math.max(end, e.atMs + (e.kind === 'tween' ? e.durationMs : 0));
    }
    return end;
  }

  isFinished(): boolean {
    return this.finished;
  }

  advance(dtMs: number): void {
    if (this.finished) return;
    this.elapsedMs += dtMs;
    this.process(this.elapsedMs);
    if (this.elapsedMs >= this.durationMs) this.finish();
  }

  complete(): void {
    if (this.finished) return;
    this.process(Number.POSITIVE_INFINITY);
    this.finish();
  }

  private process(now: number): void {
    const sorted = [...this.entries].sort((a, b) => a.atMs - b.atMs || a.order - b.order);
    for (const e of sorted) {
      if (e.done || now < e.atMs) continue;
      if (e.kind === 'call') {
        e.done = true;
        e.fn();
        continue;
      }
      if (!e.from) {
        const from: NumericProps = {};
        for (const key of Object.keys(e.to)) from[key] = e.target[key];
        e.from = from;
      }
      const t = e.durationMs === 0 ? 1 : Math.min(1, (now - e.atMs) / e.durationMs);
      const k = t >= 1 ? 1 : e.ease(t);
      for (const key of Object.keys(e.to)) {
        e.target[key] = e.from[key] + (e.to[key] - e.from[key]) * k;
      }
      e.onUpdate?.();
      if (t >= 1) e.done = true;
    }
  }

  private finish(): void {
    this.finished = true;
    const callbacks = this.doneCallbacks;
    this.doneCallbacks = [];
    for (const cb of callbacks) cb();
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/transitionTimeline.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: Changelog và commit**

```markdown
### 2026-10-03 - Add a self-clocked transition timeline (F1 task 2)

- Added `game-next/src/presentation/transitions/TransitionTimeline.ts`: tweens and calls scheduled on route-relative milestones, driven by `advance`, with `complete()` that jumps every entry to its end state in milestone order exactly once.
- Verification: `tests/transitionTimeline.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.
```

Run: `npm run typecheck && npm test`

```bash
git add game-next/src/presentation/transitions/TransitionTimeline.ts game-next/tests/transitionTimeline.test.ts CHANGELOG.md
git commit -m "feat(motion): add self-clocked transition timeline"
```

---

### Task 3: Dàn dựng theo bảng bước và bảng tuyến

**Files:**
- Create: `game-next/src/presentation/transitions/choreography.ts`
- Create: `game-next/src/presentation/transitions/routes.ts`
- Create: `game-next/src/presentation/transitions/stardust.ts`
- Test: `game-next/tests/choreography.test.ts`, `game-next/tests/transitionRoutes.test.ts`

**Interfaces:**
- Consumes: `TransitionTimeline`, `EaseName`, `stagger`, `TRANSITION_TOKENS`.
- Produces (`choreography.ts`):
  - `type Poseable = { x: number; y: number; alpha: number; scaleX: number; scaleY: number }`
  - `type PoseDelta = { dx?: number; dy?: number; alpha?: number; scale?: number }`
  - `type Step = { part: string; atMs: number; durationMs: number; delta: PoseDelta; ease?: EaseName; spanMs?: number }`
  - `type Parts = Record<string, readonly Poseable[]>`
  - `enter(tl, target, atMs, durationMs, from: PoseDelta, ease?)`: đặt ngay tư thế lệch rồi tween về tư thế tự nhiên
  - `exit(tl, target, atMs, durationMs, to: PoseDelta, ease?)`: tween từ tư thế hiện tại tới tư thế lệch
  - `applySteps(tl, steps, parts, mode: 'enter' | 'exit'): void`
  - `stepsEndMs(steps): number`
  - `orderByDistance<T>(items: readonly T[], anchor: number): T[]`
- Produces (`routes.ts`):
  - `MENU_OUT_TO_PLAY`, `MENU_OUT_TO_MAP`, `MENU_SPECIAL`, `menuIn(from: 'map' | 'play')`
  - `mapIn(startMs: number)`, `MAP_OUT_TO_PLAY`, `MAP_OUT_TO_MENU`, `MAP_SPECIAL`
  - `playIn(variant: 'menu' | 'node' | 'next', center: Point, origin?: Point)`, `PLAY_OUT_NEXT`, `PLAY_OUT_LEAVE`, `PLAY_SPECIAL`
  - `type Point = { x: number; y: number }`
- Produces (`stardust.ts`):
  - `STARDUST_MAX = 30`
  - `type DustParticle`
  - `planStardust(sources, center, count, random?)`
  - `dustAt(p, t)`

- [ ] **Step 1: Viết test thất bại cho `choreography.ts`**

`game-next/tests/choreography.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { TransitionTimeline } from '../src/presentation/transitions/TransitionTimeline.ts';
import {
  applySteps,
  enter,
  exit,
  orderByDistance,
  stepsEndMs,
} from '../src/presentation/transitions/choreography.ts';
import type { Poseable } from '../src/presentation/transitions/choreography.ts';

const pose = (over: Partial<Poseable> = {}): Poseable => ({
  x: 100, y: 200, alpha: 1, scaleX: 1, scaleY: 1, ...over,
});

describe('enter / exit', () => {
  test('enter đặt ngay tư thế lệch, complete trả đúng tư thế tự nhiên', () => {
    const p = pose({ scaleX: 2, scaleY: -0.85 });
    const tl = new TransitionTimeline();
    enter(tl, p, 0, 300, { dy: -40, alpha: 0, scale: 0.5 });
    expect(p).toEqual({ x: 100, y: 160, alpha: 0, scaleX: 1, scaleY: -0.425 });
    tl.complete();
    expect(p).toEqual({ x: 100, y: 200, alpha: 1, scaleX: 2, scaleY: -0.85 });
  });

  test('exit giữ nguyên lúc lên lịch, complete tới tư thế lệch', () => {
    const p = pose();
    const tl = new TransitionTimeline();
    exit(tl, p, 100, 200, { dx: 30, alpha: 0, scale: 0.9 });
    expect(p).toEqual(pose());
    tl.complete();
    expect(p.x).toBe(130);
    expect(p.alpha).toBe(0);
    expect(p.scaleX).toBeCloseTo(0.9, 9);
  });

  test('exit không đụng thuộc tính không có trong delta', () => {
    const p = pose({ alpha: 0.4 });
    const tl = new TransitionTimeline();
    exit(tl, p, 0, 100, { dy: 10 });
    tl.complete();
    expect(p.alpha).toBe(0.4);
    expect(p.y).toBe(210);
  });
});

describe('applySteps', () => {
  test('so le theo spanMs trong một part, part thiếu thì bỏ qua', () => {
    const a = pose();
    const b = pose();
    const tl = new TransitionTimeline();
    applySteps(tl, [
      { part: 'row', atMs: 0, durationMs: 100, delta: { alpha: 0 }, ease: 'linear', spanMs: 100 },
      { part: 'missing', atMs: 0, durationMs: 100, delta: { alpha: 0 } },
    ], { row: [a, b] }, 'exit');
    tl.advance(50);
    expect(a.alpha).toBeCloseTo(0.5, 9);
    expect(b.alpha).toBe(1);
    tl.advance(100);
    expect(a.alpha).toBe(0);
    expect(b.alpha).toBeCloseTo(0.5, 9);
  });

  test('stepsEndMs tính cả span và thời lượng', () => {
    expect(stepsEndMs([
      { part: 'a', atMs: 100, durationMs: 300, delta: {} },
      { part: 'b', atMs: 500, durationMs: 420, delta: {}, spanMs: 80 },
    ])).toBe(1000);
    expect(stepsEndMs([])).toBe(0);
  });
});

describe('orderByDistance', () => {
  test('gần mốc trước, cùng khoảng cách thì giữ thứ tự gốc', () => {
    expect(orderByDistance(['a', 'b', 'c', 'd', 'e'], 2)).toEqual(['c', 'b', 'd', 'a', 'e']);
    expect(orderByDistance(['a', 'b'], 0)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Viết test thất bại cho bảng tuyến và bụi sao**

`game-next/tests/transitionRoutes.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { TRANSITION_TOKENS } from '../src/presentation/designTokens.ts';
import { stepsEndMs } from '../src/presentation/transitions/choreography.ts';
import {
  MAP_OUT_TO_MENU,
  MAP_OUT_TO_PLAY,
  MAP_SPECIAL,
  MENU_OUT_TO_MAP,
  MENU_OUT_TO_PLAY,
  MENU_SPECIAL,
  PLAY_OUT_LEAVE,
  PLAY_OUT_NEXT,
  PLAY_SPECIAL,
  mapIn,
  menuIn,
  playIn,
} from '../src/presentation/transitions/routes.ts';
import { STARDUST_MAX, dustAt, planStardust } from '../src/presentation/transitions/stardust.ts';

const R = TRANSITION_TOKENS.routes;
const center = { x: 360, y: 600 };

describe('phần vào kết thúc đúng tổng thời lượng tuyến', () => {
  test.each([
    ['menu-to-play', playIn('menu', center)],
    ['map-to-play', playIn('node', center, { x: 200, y: 700 })],
    ['next-level', playIn('next', center)],
    ['play-to-map', mapIn(400)],
    ['menu-to-map', mapIn(300)],
    ['play-to-menu', menuIn('play')],
    ['map-to-menu', menuIn('map')],
  ] as const)('%s', (route, steps) => {
    expect(stepsEndMs(steps)).toBe(R[route].totalMs);
    for (const s of steps) expect(s.atMs).toBeGreaterThanOrEqual(R[route].handoffMs);
  });
});

describe('phần ra nằm trong tổng; next-level xong trước handoff', () => {
  test.each([
    ['menu-to-play', MENU_OUT_TO_PLAY],
    ['menu-to-map', MENU_OUT_TO_MAP],
    ['map-to-play', MAP_OUT_TO_PLAY],
    ['map-to-menu', MAP_OUT_TO_MENU],
    ['play-to-map', PLAY_OUT_LEAVE],
    ['next-level', PLAY_OUT_NEXT],
  ] as const)('%s', (route, steps) => {
    expect(stepsEndMs(steps)).toBeLessThanOrEqual(R[route].totalMs);
  });

  test('next-level: bước và hiệu ứng đặc biệt xong trước mốc restart 800', () => {
    const handoff = R['next-level'].handoffMs;
    expect(stepsEndMs(PLAY_OUT_NEXT)).toBeLessThanOrEqual(handoff);
    expect(PLAY_SPECIAL.dustAtMs + PLAY_SPECIAL.dustMs).toBeLessThanOrEqual(handoff);
    expect(PLAY_SPECIAL.flashAtMs + PLAY_SPECIAL.flashMs).toBeLessThanOrEqual(handoff);
  });
});

describe('hiệu ứng đặc biệt nằm trong tuyến', () => {
  test('Play vào', () => {
    const total = R['menu-to-play'].totalMs;
    expect(PLAY_SPECIAL.gridRevealAtMs + PLAY_SPECIAL.gridRevealMs).toBeLessThanOrEqual(total);
    expect(PLAY_SPECIAL.targetsAtMs + PLAY_SPECIAL.targetsSpanMs + PLAY_SPECIAL.targetsMs).toBe(1150);
    expect(PLAY_SPECIAL.glintAtMs + PLAY_SPECIAL.glintMs).toBe(1150);
    expect(PLAY_SPECIAL.zoomAtMs).toBeGreaterThanOrEqual(R['menu-to-play'].handoffMs);
  });

  test('Menu và Bản đồ ra', () => {
    expect(MENU_SPECIAL.spinAtMs + MENU_SPECIAL.spinMs).toBe(700);
    expect(MAP_SPECIAL.ringMs).toBe(450);
  });
});

describe('khung bia từ node: lệch đúng về điểm chạm', () => {
  test('dx, dy là khoảng từ tâm bia tới node', () => {
    const board = playIn('node', center, { x: 200, y: 700 }).find((s) => s.part === 'board')!;
    expect(board.delta).toEqual({ dx: -160, dy: 100, scale: 0.2, alpha: 0 });
  });

  test('next-level không chạy lại bia, lưới hay rune', () => {
    const parts = playIn('next', center).map((s) => s.part);
    expect(parts).not.toContain('board');
    expect(parts).not.toContain('runes');
  });
});

describe('bụi sao', () => {
  const seq = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length];
  };

  test('không quá 30 hạt, alpha cố định trong [0.7, 1]', () => {
    const ps = planStardust([{ x: 100, y: 100 }, { x: 500, y: 300 }], center, 99, seq([0.1, 0.5, 0.9]));
    expect(ps).toHaveLength(STARDUST_MAX);
    for (const p of ps) {
      expect(p.alpha).toBeGreaterThanOrEqual(0.7);
      expect(p.alpha).toBeLessThanOrEqual(1);
      expect(p.x1).toBe(center.x);
      expect(p.y1).toBe(center.y);
    }
  });

  test('không có nguồn thì không có hạt', () => {
    expect(planStardust([], center, 30)).toEqual([]);
  });

  test('dustAt: mờ ở hai đầu, tới tâm khi t = 1', () => {
    const [p] = planStardust([{ x: 0, y: 0 }], center, 1, seq([0.5]));
    expect(dustAt(p, 0).alpha).toBeCloseTo(0, 9);
    expect(dustAt(p, 1).alpha).toBeCloseTo(0, 9);
    expect(dustAt(p, 0.5).alpha).toBeCloseTo(p.alpha, 9);
    expect(dustAt(p, 1).x).toBe(center.x);
  });
});
```

- [ ] **Step 3: Chạy hai test, xác nhận thất bại**

Run: `npx vitest run tests/choreography.test.ts tests/transitionRoutes.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 4: Viết `choreography.ts`**

`game-next/src/presentation/transitions/choreography.ts`:

```ts
import type { EaseName } from './motion.ts';
import { stagger } from './motion.ts';
import type { TransitionTimeline } from './TransitionTimeline.ts';

/** Mọi GameObject của Phaser đều thoả kiểu này (Transform + Alpha). */
export type Poseable = { x: number; y: number; alpha: number; scaleX: number; scaleY: number };

export type PoseDelta = { dx?: number; dy?: number; alpha?: number; scale?: number };

export type Step = {
  part: string;
  atMs: number;
  durationMs: number;
  delta: PoseDelta;
  ease?: EaseName;
  /** Trải các phần tử của part trên khoảng này (so le đều) */
  spanMs?: number;
};

export type Parts = Record<string, readonly Poseable[]>;

/**
 * Đưa phần tử VÀO: ghi lại tư thế tự nhiên, đặt ngay tư thế lệch, rồi tween
 * về tư thế tự nhiên. Vì đích luôn là tư thế lúc dựng cảnh, trạng thái cuối
 * sau khi bỏ qua trùng với cảnh dựng không có animation.
 */
export function enter(
  tl: TransitionTimeline,
  target: Poseable,
  atMs: number,
  durationMs: number,
  from: PoseDelta,
  ease: EaseName = 'cubicOut'
): void {
  const natural = {
    x: target.x,
    y: target.y,
    alpha: target.alpha,
    scaleX: target.scaleX,
    scaleY: target.scaleY,
  };
  target.x = natural.x + (from.dx ?? 0);
  target.y = natural.y + (from.dy ?? 0);
  if (from.alpha !== undefined) target.alpha = from.alpha;
  if (from.scale !== undefined) {
    target.scaleX = natural.scaleX * from.scale;
    target.scaleY = natural.scaleY * from.scale;
  }
  tl.at(atMs, target, natural, durationMs, ease);
}

/** Đưa phần tử RA: tween từ tư thế hiện tại tới tư thế lệch. */
export function exit(
  tl: TransitionTimeline,
  target: Poseable,
  atMs: number,
  durationMs: number,
  to: PoseDelta,
  ease: EaseName = 'cubicOut'
): void {
  const props: Record<string, number> = {};
  if (to.dx !== undefined) props.x = target.x + to.dx;
  if (to.dy !== undefined) props.y = target.y + to.dy;
  if (to.alpha !== undefined) props.alpha = to.alpha;
  if (to.scale !== undefined) {
    props.scaleX = target.scaleX * to.scale;
    props.scaleY = target.scaleY * to.scale;
  }
  tl.at(atMs, target, props, durationMs, ease);
}

export function applySteps(
  tl: TransitionTimeline,
  steps: readonly Step[],
  parts: Parts,
  mode: 'enter' | 'exit'
): void {
  const move = mode === 'enter' ? enter : exit;
  for (const step of steps) {
    const targets = parts[step.part] ?? [];
    targets.forEach((target, i) => {
      const at = step.atMs + stagger(i, targets.length, step.spanMs ?? 0);
      move(tl, target, at, step.durationMs, step.delta, step.ease ?? 'cubicOut');
    });
  }
}

export function stepsEndMs(steps: readonly Step[]): number {
  return steps.reduce((end, s) => Math.max(end, s.atMs + (s.spanMs ?? 0) + s.durationMs), 0);
}

/** Thứ tự bật/tắt node: gần node mốc trước, lan ra hai phía. */
export function orderByDistance<T>(items: readonly T[], anchor: number): T[] {
  return items
    .map((item, i) => ({ item, i, d: Math.abs(i - anchor) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((entry) => entry.item);
}
```

- [ ] **Step 5: Viết `routes.ts`**

`game-next/src/presentation/transitions/routes.ts`:

```ts
import type { Step } from './choreography.ts';

export type Point = { x: number; y: number };

// ---------- Menu (spec F1 mục 3.1, 3.4, 3.5) ----------
// Part: emblem, titleBlock, primaryButton, buttons (chính + phụ),
// chrome (tiêu đề, nút phụ, cài đặt, footer), corner (cài đặt, footer).

export const MENU_OUT_TO_PLAY: readonly Step[] = [
  { part: 'primaryButton', atMs: 0, durationMs: 350, delta: { scale: 0.9, alpha: 0 } },
  { part: 'chrome', atMs: 0, durationMs: 170, delta: { dy: -24, alpha: 0 }, spanMs: 180 },
  { part: 'emblem', atMs: 200, durationMs: 500, delta: { dy: 100, scale: 2.2, alpha: 0 }, ease: 'cubicInOut' },
];

export const MENU_OUT_TO_MAP: readonly Step[] = [
  { part: 'emblem', atMs: 0, durationMs: 500, delta: { dy: -380, scale: 0.3, alpha: 0 }, ease: 'cubicInOut' },
  { part: 'chrome', atMs: 0, durationMs: 200, delta: { dy: -24, alpha: 0 }, spanMs: 180 },
  { part: 'primaryButton', atMs: 60, durationMs: 200, delta: { dy: -24, alpha: 0 } },
];

/** Vòng ấn Song Tinh quay nhanh gấp 4 khi đi vào màn chơi */
export const MENU_SPECIAL = { spinAtMs: 200, spinMs: 500, spinPeak: 4 } as const;

export function menuIn(from: 'map' | 'play'): Step[] {
  const emblem: Step = from === 'map'
    ? { part: 'emblem', atMs: 300, durationMs: 500, delta: { dy: -380, scale: 0.3, alpha: 0 }, ease: 'cubicInOut' }
    : { part: 'emblem', atMs: 400, durationMs: 500, delta: { scale: 0.6, alpha: 0 }, ease: 'backOut' };
  return [
    emblem,
    { part: 'titleBlock', atMs: 400, durationMs: 400, delta: { dy: -24, alpha: 0 } },
    { part: 'buttons', atMs: 500, durationMs: 420, delta: { dy: 24, alpha: 0 }, spanMs: 80 },
    { part: 'corner', atMs: 600, durationMs: 400, delta: { alpha: 0 } },
  ];
}

// ---------- Bản đồ (spec F1 mục 3.2, 3.4, 3.5) ----------
// Part: header, nodes (xếp theo khoảng cách tới node mốc), tappedNode,
// otherNodes, links (đường nối, đốm sáng, tiêu đề chương).

/** `startMs` là 300 khi từ Menu, 400 khi từ Play; mọi bước kết thúc ở 1000. */
export function mapIn(startMs: number): Step[] {
  return [
    { part: 'header', atMs: startMs, durationMs: 400, delta: { dy: -40, alpha: 0 } },
    {
      part: 'nodes',
      atMs: startMs + 100,
      durationMs: 300,
      delta: { scale: 0, alpha: 0 },
      ease: 'backOut',
      spanMs: 600 - startMs,
    },
    { part: 'links', atMs: startMs + 100, durationMs: 900 - startMs, delta: { alpha: 0 } },
  ];
}

export const MAP_OUT_TO_PLAY: readonly Step[] = [
  { part: 'tappedNode', atMs: 0, durationMs: 300, delta: { scale: 1.4 }, ease: 'backOut' },
  { part: 'tappedNode', atMs: 300, durationMs: 150, delta: { alpha: 0 } },
  { part: 'otherNodes', atMs: 0, durationMs: 250, delta: { alpha: 0 }, spanMs: 200 },
  { part: 'header', atMs: 0, durationMs: 300, delta: { dy: -40, alpha: 0 } },
  { part: 'links', atMs: 0, durationMs: 300, delta: { alpha: 0 } },
];

export const MAP_OUT_TO_MENU: readonly Step[] = [
  { part: 'header', atMs: 0, durationMs: 300, delta: { dy: -40, alpha: 0 } },
  { part: 'nodes', atMs: 0, durationMs: 200, delta: { alpha: 0 }, spanMs: 250 },
  { part: 'links', atMs: 0, durationMs: 450, delta: { alpha: 0 } },
];

/** Vòng sáng lan từ node vừa bấm tới bao trọn tấm bia */
export const MAP_SPECIAL = { ringStartRadius: 40, ringMs: 450 } as const;

// ---------- Play (spec F1 mục 3.1–3.4) ----------
// Part: board (đế bia, lưới, nắp bia), runes, rings, tray (khung + ô),
// trayPieces, pieces, targets, title, topButtons, bottomBar, winCard.

export function playIn(variant: 'menu' | 'node' | 'next', center: Point, origin?: Point): Step[] {
  const steps: Step[] = [];
  if (variant === 'menu' || (variant === 'node' && !origin)) {
    steps.push({ part: 'board', atMs: 350, durationMs: 450, delta: { scale: 0.85, alpha: 0 }, ease: 'backOut' });
  } else if (variant === 'node' && origin) {
    steps.push({
      part: 'board',
      atMs: 350,
      durationMs: 500,
      delta: { dx: origin.x - center.x, dy: origin.y - center.y, scale: 0.2, alpha: 0 },
    });
  }
  if (variant !== 'next') {
    steps.push(
      { part: 'rings', atMs: 350, durationMs: 450, delta: { alpha: 0 } },
      { part: 'runes', atMs: 500, durationMs: 200, delta: { alpha: 0 }, spanMs: 180 }
    );
  }
  steps.push(
    { part: 'tray', atMs: 950, durationMs: 300, delta: { dy: 40, alpha: 0 } },
    // F1 tween cả lớp mảnh như một khối; F2 cho từng mảnh rơi riêng
    { part: 'trayPieces', atMs: 1000, durationMs: 350, delta: { dy: -60, alpha: 0 }, ease: 'backOut' },
    { part: 'title', atMs: 1100, durationMs: 340, delta: { dy: -40, alpha: 0 }, spanMs: 60 },
    { part: 'topButtons', atMs: 1100, durationMs: 400, delta: { alpha: 0, scale: 0.8 }, ease: 'backOut' },
    { part: 'bottomBar', atMs: 1150, durationMs: 290, delta: { dy: 40, alpha: 0 }, spanMs: 60 }
  );
  return steps;
}

export const PLAY_OUT_NEXT: readonly Step[] = [
  { part: 'winCard', atMs: 0, durationMs: 300, delta: { dy: 60, alpha: 0 } },
  { part: 'pieces', atMs: 100, durationMs: 500, delta: { alpha: 0 } },
  { part: 'targets', atMs: 100, durationMs: 400, delta: { alpha: 0 } },
  { part: 'title', atMs: 300, durationMs: 400, delta: { dy: -40, alpha: 0 }, spanMs: 60 },
  { part: 'topButtons', atMs: 300, durationMs: 400, delta: { alpha: 0 } },
];

export const PLAY_OUT_LEAVE: readonly Step[] = [
  { part: 'title', atMs: 0, durationMs: 250, delta: { dy: -40, alpha: 0 }, spanMs: 60 },
  { part: 'topButtons', atMs: 0, durationMs: 250, delta: { alpha: 0 } },
  { part: 'bottomBar', atMs: 0, durationMs: 250, delta: { dy: 40, alpha: 0 }, spanMs: 60 },
  { part: 'winCard', atMs: 0, durationMs: 250, delta: { dy: 40, alpha: 0 } },
  { part: 'pieces', atMs: 0, durationMs: 250, delta: { alpha: 0 } },
  { part: 'targets', atMs: 0, durationMs: 200, delta: { alpha: 0 } },
  { part: 'tray', atMs: 50, durationMs: 300, delta: { dy: 40, alpha: 0 } },
  { part: 'rings', atMs: 0, durationMs: 300, delta: { alpha: 0 } },
  { part: 'board', atMs: 200, durationMs: 250, delta: { scale: 0.9, alpha: 0 } },
];

export const PLAY_SPECIAL = {
  zoomAtMs: 350,
  zoomMs: 450,
  zoomPeak: 1.03,
  gridRevealAtMs: 450,
  gridRevealMs: 450,
  gridRevealRadius: 520,
  targetsAtMs: 800,
  targetsSpanMs: 160,
  targetsMs: 190,
  glintAtMs: 800,
  glintMs: 350,
  dustAtMs: 100,
  dustMs: 600,
  flashAtMs: 500,
  flashMs: 300,
} as const;
```

- [ ] **Step 6: Viết `stardust.ts`**

`game-next/src/presentation/transitions/stardust.ts`:

```ts
import type { Point } from './routes.ts';

/** Giới hạn hạt bụi sao của GDD (mục 3.4) */
export const STARDUST_MAX = 30;

export type DustParticle = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
  color: number;
  /** Cố định khi sinh; không random lại mỗi khung hình */
  alpha: number;
};

const DUST_COLORS = [0xffd166, 0xf9c74f, 0x4ecdc4, 0xffffff] as const;

/** Hạt sinh quanh tâm các mảnh, bay vào `center`. */
export function planStardust(
  sources: readonly Point[],
  center: Point,
  count: number,
  random: () => number = Math.random,
  spreadPx = 60
): DustParticle[] {
  if (sources.length === 0) return [];
  const n = Math.min(STARDUST_MAX, Math.max(0, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => {
    const source = sources[i % sources.length];
    const angle = random() * Math.PI * 2;
    const dist = random() * spreadPx;
    return {
      x0: source.x + Math.cos(angle) * dist,
      y0: source.y + Math.sin(angle) * dist,
      x1: center.x,
      y1: center.y,
      radius: 1.5 + random() * 2,
      color: DUST_COLORS[i % DUST_COLORS.length],
      alpha: 0.7 + random() * 0.3,
    };
  });
}

/** Vị trí tại tiến độ t: sáng dần rồi tắt khi tới tâm. */
export function dustAt(p: DustParticle, t: number): { x: number; y: number; alpha: number; radius: number } {
  return {
    x: p.x0 + (p.x1 - p.x0) * t,
    y: p.y0 + (p.y1 - p.y0) * t,
    alpha: p.alpha * Math.sin(Math.PI * t),
    radius: p.radius * (1 - 0.5 * t),
  };
}
```

- [ ] **Step 7: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/choreography.test.ts tests/transitionRoutes.test.ts`
Expected: PASS. Nếu `dustAt(p, 1).alpha` ra `1.2e-16` thì `toBeCloseTo` vẫn đạt.

- [ ] **Step 8: Changelog và commit**

```markdown
### 2026-10-03 - Add choreography steps and route tables (F1 task 3)

- Added `game-next/src/presentation/transitions/choreography.ts` (enter/exit poses that always return to the natural pose, step tables with even stagger), `routes.ts` (step tables and special-effect timings for all seven routes) and `stardust.ts` (at most 30 particles with fixed alpha).
- Verification: `tests/choreography.test.ts` and `tests/transitionRoutes.test.ts` failed for the missing modules, then passed; every in-phase ends exactly at its route total and `next-level` finishes its out-phase before the 800 ms restart; `npm run typecheck` and `npm test` passed.
```

Run: `npm run typecheck && npm test`

```bash
git add game-next/src/presentation/transitions/choreography.ts game-next/src/presentation/transitions/routes.ts game-next/src/presentation/transitions/stardust.ts game-next/tests/choreography.test.ts game-next/tests/transitionRoutes.test.ts CHANGELOG.md
git commit -m "feat(motion): add choreography steps and route tables"
```

---

### Task 4: Cài đặt Giảm chuyển động được lưu

**Files:**
- Modify: `game-next/src/application/progressPort.ts`
- Modify: `game-next/src/infrastructure/progressRepository.ts`
- Modify: `game-next/src/presentation/SettingsDialog.ts:73-81`
- Test: `game-next/tests/progress.test.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `setMotionScale` (Task 1).
- Produces:
  - `Progress.settings.reducedMotion: boolean`
  - `ProgressRepository.setReducedMotion(on: boolean): LoadResult`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `game-next/tests/progress.test.ts` (dùng lại `createMockStorage` có sẵn đầu file):

```ts
describe('Cài đặt Giảm chuyển động', () => {
  test('mặc định tắt', () => {
    const repo = createProgressRepository(createMockStorage(), campaignManifest, 'oracle-v1');
    expect(repo.read().progress.settings.reducedMotion).toBe(false);
  });

  test('ghi rồi đọc lại giữ đúng giá trị, không đụng showTarget', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    repo.setShowTarget(false);
    repo.setReducedMotion(true);
    const again = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    expect(again.read().progress.settings).toEqual({ showTarget: false, reducedMotion: true });
  });

  test('bản lưu cũ thiếu trường đọc ra false, không bị coi là hỏng', () => {
    const legacy = JSON.stringify({
      version: 1,
      campaignRevision: 'oracle-v1',
      completed: ['1-1'],
      settings: { showTarget: true },
    });
    const storage = createMockStorage({ 'mirror.rebuild.progress.v1': legacy });
    const result = createProgressRepository(storage, campaignManifest, 'oracle-v1').read();
    expect(result.recovered).toBe(false);
    expect(result.progress.completed).toEqual(['1-1']);
    expect(result.progress.settings.reducedMotion).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/progress.test.ts`
Expected: FAIL. Test mặc định nhận `undefined` thay vì `false`, và `repo.setReducedMotion is not a function`.

- [ ] **Step 3: Mở rộng kiểu**

`game-next/src/application/progressPort.ts`: đổi `settings` và thêm phương thức.

```ts
  settings: {
    showTarget: boolean;
    reducedMotion: boolean;
  };
```

```ts
export interface ProgressRepository {
  read(): LoadResult;
  complete(id: string): LoadResult;
  setShowTarget(show: boolean): LoadResult;
  setReducedMotion(on: boolean): LoadResult;
  reset(): LoadResult;
}
```

- [ ] **Step 4: Cài đặt trong repository**

Trong `game-next/src/infrastructure/progressRepository.ts`:

1. `defaultProgress()`: `settings: { showTarget: true, reducedMotion: false },`
2. Trong nhánh parse, sau khối `const showTarget = …`:

```ts
      const reducedMotion =
        parsed.settings && typeof parsed.settings.reducedMotion === 'boolean'
          ? parsed.settings.reducedMotion
          : false;
```

   và đổi dòng dựng `progress` thành `settings: { showTarget, reducedMotion },`.

3. Thêm phương thức sau `setShowTarget`:

```ts
    setReducedMotion(on: boolean): LoadResult {
      const current = readFromStorage().progress;
      return saveToStorage({
        ...current,
        settings: { ...current.settings, reducedMotion: on },
      });
    },
```

- [ ] **Step 5: Nối nút trong `SettingsDialog`**

Trong `game-next/src/presentation/SettingsDialog.ts`, thêm import `import { setMotionScale } from './transitions/motion.ts';`. Thay khối "Toggle 2" (dòng 73–81) bằng:

```ts
    // Toggle 2: Giảm chuyển động — chuyển cảnh chỉ còn mờ chéo 150 ms
    this.createToggleRow(
      -modalH / 2 + 175,
      'Giảm chuyển động',
      this.progressRepo.read().progress.settings.reducedMotion,
      (on) => {
        this.progressRepo.setReducedMotion(on);
        setMotionScale(on ? 0 : 1);
      }
    );
```

- [ ] **Step 6: Chạy test, typecheck**

Run: `npx vitest run tests/progress.test.ts && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Persist the reduced-motion setting (F1 task 4)

- Added `settings.reducedMotion` (default `false`, legacy saves read as `false` without recovery) and `setReducedMotion` to the progress repository; wired the previously empty "Giảm chuyển động" toggle in `SettingsDialog` to persist the value and update the global motion scale.
- Verification: three new progress tests failed before the change, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/application/progressPort.ts game-next/src/infrastructure/progressRepository.ts game-next/src/presentation/SettingsDialog.ts game-next/tests/progress.test.ts CHANGELOG.md
git commit -m "feat(settings): persist reduced motion and wire its toggle"
```

---

### Task 5: Mood bầu trời và `BackgroundScene`

**Files:**
- Create: `game-next/src/presentation/skyMood.ts`
- Create: `game-next/src/presentation/BackgroundScene.ts`
- Modify: `game-next/src/presentation/SkyBackdrop.ts`
- Test: `game-next/tests/skyMood.test.ts`

**Interfaces:**
- Produces:
  - `type SkyMood = 'menu' | 'map' | 'play'`
  - `type MoodState = { driftSpeed: number; dim: number }`
  - `SKY_MOODS: Record<SkyMood, MoodState>`
  - `advanceDrift(driftMs: number, deltaMs: number, driftSpeed: number): number`
  - `interface MoodTarget { setMood(mood: SkyMood, durationMs: number): void }`
  - `class BackgroundScene extends Phaser.Scene implements MoodTarget` (key `'BackgroundScene'`)
  - `SkyBackdrop` nhận option `{ seed: number; driftSpeed: number }`. Thuộc tính công khai `moodState: MoodState` được tween trực tiếp.

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/skyMood.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { SKY_MOODS, advanceDrift } from '../src/presentation/skyMood.ts';

describe('mood bầu trời', () => {
  test('ba mood theo spec F1 mục 2.1', () => {
    expect(SKY_MOODS).toEqual({
      menu: { driftSpeed: 0, dim: 0 },
      map: { driftSpeed: 1, dim: 0 },
      play: { driftSpeed: 0, dim: 0.15 },
    });
  });

  test('quãng trôi cộng dồn theo tốc độ, không nhảy khi đổi tốc độ', () => {
    let d = 0;
    d = advanceDrift(d, 1000, 1);
    expect(d).toBe(1000);
    d = advanceDrift(d, 1000, 0.5);
    expect(d).toBe(1500);
    d = advanceDrift(d, 1000, 0);
    expect(d).toBe(1500);
  });

  test('tốc độ âm coi như đứng yên', () => {
    expect(advanceDrift(10, 100, -1)).toBe(10);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/skyMood.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 3: Viết `skyMood.ts`**

`game-next/src/presentation/skyMood.ts`:

```ts
export type SkyMood = 'menu' | 'map' | 'play';

export type MoodState = { driftSpeed: number; dim: number };

/** Sao trôi ở bản đồ; tối 15% ở màn chơi để tấm bia nổi lên. */
export const SKY_MOODS: Record<SkyMood, MoodState> = {
  menu: { driftSpeed: 0, dim: 0 },
  map: { driftSpeed: 1, dim: 0 },
  play: { driftSpeed: 0, dim: 0.15 },
};

/**
 * Quãng trôi tính bằng ms "chạy đủ tốc độ". Cộng dồn theo tốc độ hiện tại nên
 * khi tween tốc độ về 0, sao chậm dần rồi dừng tại chỗ chứ không giật về vị
 * trí cũ.
 */
export function advanceDrift(driftMs: number, deltaMs: number, driftSpeed: number): number {
  return driftMs + deltaMs * Math.max(0, driftSpeed);
}

export interface MoodTarget {
  setMood(mood: SkyMood, durationMs: number): void;
}
```

- [ ] **Step 4: Sửa `SkyBackdrop.ts`**

Trong `game-next/src/presentation/SkyBackdrop.ts`:

1. Import thêm: `import { COLOR_NUMBERS, COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';` (thêm `COLOR_NUMBERS`), và `import { advanceDrift } from './skyMood.ts'; import type { MoodState } from './skyMood.ts';`.
2. Đổi kiểu option:

```ts
export type SkyBackdropOptions = {
  seed: number;
  /** 0 đứng yên, 1 trôi đủ tốc độ; BackgroundScene tween giá trị này */
  driftSpeed: number;
};
```

3. Thêm field công khai và lớp tối:

```ts
  public readonly moodState: MoodState;
  private readonly dimLayer: Phaser.GameObjects.Rectangle;
  private driftMs = 0;
```

4. Trong constructor, sau khi tạo `twinkleLayer`:

```ts
    this.moodState = { driftSpeed: options.driftSpeed, dim: 0 };
    // Lớp tối phủ cả trời và sao: mood `play` làm nền lùi lại sau tấm bia
    this.dimLayer = scene.add
      .rectangle(0, 0, width, height, COLOR_NUMBERS.navyBackdrop, 1)
      .setOrigin(0, 0)
      .setAlpha(0)
      .setDepth(DEPTH_TOKENS.backgroundSky + 3);
```

5. Thay toàn bộ thân `update`:

```ts
  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    this.driftMs = advanceDrift(this.driftMs, deltaMs, this.moodState.driftSpeed);
    const { height } = LAYOUT_TOKENS.canvas;
    const offset = driftOffset(this.driftMs, height);

    // tilePositionY âm dần thì texture đi xuống, tức sao rơi xuống.
    this.starLayer.tilePositionY = -offset;

    this.twinkleLayer.clear();
    for (const star of this.twinklingStars) {
      const y = (star.y + offset) % height;
      const alpha = twinkleAlpha(star, this.elapsedMs);
      this.twinkleLayer.fillStyle(
        Phaser.Display.Color.HexStringToColor(star.color).color,
        alpha
      );
      this.twinkleLayer.fillCircle(star.x, y, star.r);
    }

    this.dimLayer.setAlpha(this.moodState.dim);
  }
```

6. Trong `destroy()` thêm `this.dimLayer.destroy();`. Field `options` không còn được đọc, nên xoá `private readonly options` và dòng gán `this.options = options;`.

- [ ] **Step 5: Viết `BackgroundScene.ts`**

`game-next/src/presentation/BackgroundScene.ts`:

```ts
import Phaser from 'phaser';
import { SkyBackdrop } from './SkyBackdrop.ts';
import { SKY_MOODS } from './skyMood.ts';
import type { MoodTarget, SkyMood } from './skyMood.ts';

/**
 * Bầu trời duy nhất của cả game, luôn nằm dưới cùng. Menu, Bản đồ và Play
 * vẽ trong suốt phía trên, nên khi chuyển cảnh sao không bao giờ nhảy chỗ.
 */
export class BackgroundScene extends Phaser.Scene implements MoodTarget {
  private sky!: SkyBackdrop;

  constructor() {
    super({ key: 'BackgroundScene' });
  }

  create(): void {
    this.sky = new SkyBackdrop(this, { seed: 1, driftSpeed: 0 });
  }

  update(_time: number, delta: number): void {
    this.sky.update(delta);
  }

  setMood(mood: SkyMood, durationMs: number): void {
    if (!this.sky) return;
    const target = SKY_MOODS[mood];
    this.tweens.killTweensOf(this.sky.moodState);
    if (durationMs <= 0) {
      Object.assign(this.sky.moodState, target);
      return;
    }
    this.tweens.add({
      targets: this.sky.moodState,
      driftSpeed: target.driftSpeed,
      dim: target.dim,
      duration: durationMs,
      ease: 'Sine.easeInOut',
    });
  }
}
```

- [ ] **Step 6: Giữ các scene cũ biên dịch được**

Ba scene còn tự dựng sky cho tới Task 6. Đổi option cho khớp kiểu mới:
- `MenuScene.ts:32`: `{ seed: 1, driftSpeed: 0 }`
- `LevelSelectScene.ts:62`: `{ seed: 3, driftSpeed: 1 }`
- `PlayScene.ts:74`: `{ seed: 2, driftSpeed: 0 }`

- [ ] **Step 7: Test, typecheck, commit**

Run: `npx vitest run tests/skyMood.test.ts && npm run typecheck && npm test`
Expected: PASS.

```markdown
### 2026-10-03 - Add sky moods and a persistent background scene (F1 task 5)

- Added `game-next/src/presentation/skyMood.ts` (menu/map/play moods, speed-weighted drift accumulation) and `BackgroundScene.ts`, which owns one `SkyBackdrop` and tweens its drift speed and dim layer.
- Replaced the `drift` flag of `SkyBackdrop` with a tweenable `driftSpeed` and added a navy dim layer; existing scenes keep their own sky until the director task.
- Verification: `tests/skyMood.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/skyMood.ts game-next/src/presentation/BackgroundScene.ts game-next/src/presentation/SkyBackdrop.ts game-next/src/presentation/MenuScene.ts game-next/src/presentation/LevelSelectScene.ts game-next/src/presentation/PlayScene.ts game-next/tests/skyMood.test.ts CHANGELOG.md
git commit -m "feat(motion): add sky moods and persistent background scene"
```

---

### Task 6: `SceneDirector` và chuyển mọi `scene.start` qua director

**Files:**
- Create: `game-next/src/presentation/transitions/SceneDirector.ts`
- Modify: `game-next/src/main.ts`
- Modify: `game-next/src/presentation/MenuScene.ts`, `LevelSelectScene.ts`, `PlayScene.ts`. Bỏ sky riêng, thêm `directorKey`, `playIn` và `playOut` để trống, gọi `director.attach(this)`, thay `scene.start`.
- Test: `game-next/tests/sceneDirector.test.ts`, `game-next/tests/sceneStartGate.test.ts`

**Interfaces:**
- Consumes: `TransitionTimeline`, `TRANSITION_TOKENS`, `RouteId`, `isReducedMotion`, `SkyMood`, `MoodTarget`.
- Produces:
  - `type SceneKey = 'MenuScene' | 'LevelSelectScene' | 'PlayScene'`
  - `type TransitionContext = { from: SceneKey | 'boot'; route: RouteId; origin?: { x: number; y: number } }`
  - `interface Choreographed { readonly directorKey: SceneKey; playIn(tl, ctx): void; playOut(tl, ctx): void }`
  - `interface SceneHost` (mục Step 3)
  - `class SceneDirector`:
    - `setHost(host)`
    - `go(fromScene: Choreographed, to: SceneKey, data: object, ctx: { route: RouteId; origin?: Point }): boolean`
    - `boot(to: SceneKey, data: object): void`
    - `attach(scene: Choreographed): void`
    - `skip(): void`
    - `isTransitioning(): boolean`
  - `class PhaserSceneHost implements SceneHost`
  - `export const director: SceneDirector`

- [ ] **Step 1: Viết test thất bại cho director**

`game-next/tests/sceneDirector.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import { SceneDirector } from '../src/presentation/transitions/SceneDirector.ts';
import type {
  Choreographed,
  SceneHost,
  SceneKey,
  TransitionContext,
} from '../src/presentation/transitions/SceneDirector.ts';
import type { TransitionTimeline } from '../src/presentation/transitions/TransitionTimeline.ts';
import { setMotionScale } from '../src/presentation/transitions/motion.ts';
import type { SkyMood } from '../src/presentation/skyMood.ts';

afterEach(() => setMotionScale(1));

class FakeScene implements Choreographed {
  readonly directorKey: SceneKey;
  readonly ins: TransitionContext[] = [];
  readonly outs: TransitionContext[] = [];
  readonly probe = { v: 0 };
  private readonly director: SceneDirector;

  constructor(key: SceneKey, director: SceneDirector) {
    this.directorKey = key;
    this.director = director;
  }

  create(): void {
    this.director.attach(this);
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    this.ins.push(ctx);
    tl.at(1000, this.probe, { v: 1 }, 0, 'linear');
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    this.outs.push(ctx);
    tl.at(0, this.probe, { v: -1 }, 450, 'linear');
  }
}

class FakeHost implements SceneHost {
  readonly log: string[] = [];
  readonly input: Partial<Record<SceneKey, boolean>> = {};
  readonly alpha: Partial<Record<SceneKey, number>> = {};
  readonly moods: Array<[SkyMood, number]> = [];
  skipArmed: (() => void) | null = null;
  scenes: Partial<Record<SceneKey, FakeScene>> = {};
  private stepCb: ((dt: number) => void) | null = null;
  private queue: Array<() => void> = [];

  start(key: SceneKey): void {
    this.log.push(`start:${key}`);
    this.queue.push(() => this.scenes[key]!.create());
  }
  restart(key: SceneKey): void {
    this.log.push(`restart:${key}`);
    this.queue.push(() => this.scenes[key]!.create());
  }
  stop(key: SceneKey): void {
    this.log.push(`stop:${key}`);
  }
  setInputEnabled(key: SceneKey, enabled: boolean): void {
    this.input[key] = enabled;
  }
  setCameraAlpha(key: SceneKey, alpha: number): void {
    this.alpha[key] = alpha;
  }
  setMood(mood: SkyMood, durationMs: number): void {
    this.moods.push([mood, durationMs]);
  }
  armSkip(onSkip: () => void): void {
    this.skipArmed = onSkip;
  }
  disarmSkip(): void {
    this.skipArmed = null;
  }
  onStep(cb: (dt: number) => void): void {
    this.stepCb = cb;
  }
  /** Giống Phaser: hàng đợi scene xử lý đầu khung, rồi tới sự kiện step */
  tick(dt: number): void {
    const queued = this.queue;
    this.queue = [];
    queued.forEach((run) => run());
    this.stepCb?.(dt);
  }
  run(ms: number, dt = 50): void {
    for (let t = 0; t < ms; t += dt) this.tick(dt);
  }
}

function setup() {
  const director = new SceneDirector();
  const host = new FakeHost();
  const menu = new FakeScene('MenuScene', director);
  const play = new FakeScene('PlayScene', director);
  host.scenes = { MenuScene: menu, PlayScene: play };
  director.setHost(host);
  return { director, host, menu, play };
}

describe('SceneDirector', () => {
  test('khoá input, chạy cảnh đích ở mốc handoff, dừng cảnh nguồn, mở input ở khung sau', () => {
    const { director, host, menu, play } = setup();
    expect(director.go(menu, 'PlayScene', { levelId: '1-1' }, { route: 'menu-to-play' })).toBe(true);
    expect(host.input.MenuScene).toBe(false);
    expect(host.skipArmed).not.toBeNull();
    expect(host.moods).toEqual([['play', 1000]]);

    host.tick(150);
    expect(host.log).toEqual([]);
    host.tick(50); // mốc 200 = handoff
    expect(host.log).toEqual(['start:PlayScene']);
    host.tick(16); // hàng đợi: PlayScene.create -> attach
    expect(play.ins).toEqual([{ from: 'MenuScene', route: 'menu-to-play' }]);
    expect(host.input.PlayScene).toBe(false);

    host.run(1400);
    expect(host.log).toEqual(['start:PlayScene', 'stop:MenuScene']);
    expect(host.skipArmed).toBeNull();
    expect(director.isTransitioning()).toBe(false);
    host.tick(16);
    expect(host.input.PlayScene).toBe(true);
  });

  test('đang chuyển thì go trả false (chống bấm hai lần)', () => {
    const { director, menu } = setup();
    expect(director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' })).toBe(true);
    expect(director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' })).toBe(false);
  });

  test('skip trước handoff: cảnh đích vẫn được chạy và lên ngay trạng thái cuối', () => {
    const { director, host, menu, play } = setup();
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    host.tick(16);
    director.skip();
    expect(menu.probe.v).toBe(-1);
    expect(host.log).toEqual(['start:PlayScene']);
    host.tick(16);
    expect(play.probe.v).toBe(1);
    expect(host.log).toEqual(['start:PlayScene', 'stop:MenuScene']);
    expect(director.isTransitioning()).toBe(false);
  });

  test('next-level: restart sau khi phần ra xong, không stop', () => {
    const { director, host, play } = setup();
    director.go(play, 'PlayScene', { levelId: '1-2' }, { route: 'next-level' });
    host.run(400); // phần ra giả dài 450 ms
    expect(host.log).toEqual([]);
    host.run(100);
    expect(host.log).toEqual(['restart:PlayScene']);
    host.run(1000);
    expect(host.log).toEqual(['restart:PlayScene']);
    expect(director.isTransitioning()).toBe(false);
  });

  test('Giảm chuyển động: không gọi playOut/playIn, mờ chéo camera 150 ms, mood tức thời', () => {
    setMotionScale(0);
    const { director, host, menu, play } = setup();
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    expect(menu.outs).toEqual([]);
    expect(host.moods).toEqual([['play', 0]]);
    expect(host.log).toEqual(['start:PlayScene']);
    host.tick(16);
    expect(play.ins).toEqual([]);
    expect(host.alpha.PlayScene).toBeLessThan(0.2); // đặt 0 lúc attach, rồi tiến 16/150
    host.run(200);
    expect(host.alpha.PlayScene).toBe(1);
    expect(host.alpha.MenuScene).toBe(1); // trả alpha trước khi stop
    expect(host.log).toEqual(['start:PlayScene', 'stop:MenuScene']);
  });

  test('boot chỉ có phần vào, ctx.from là boot', () => {
    const { director, host, play } = setup();
    director.boot('PlayScene', { levelId: '1-3' });
    expect(host.log).toEqual(['start:PlayScene']);
    host.tick(16);
    expect(play.ins[0].from).toBe('boot');
    host.run(1500);
    expect(director.isTransitioning()).toBe(false);
    expect(host.log).toEqual(['start:PlayScene']);
  });

  test('attach ngoài chuyển cảnh không làm gì', () => {
    const { director, host, menu } = setup();
    director.attach(menu);
    expect(menu.ins).toEqual([]);
    expect(host.input.MenuScene).toBeUndefined();
  });
});
```

- [ ] **Step 2: Viết test cổng nguồn**

`game-next/tests/sceneStartGate.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : [];
  });
}

describe('chỉ SceneDirector được đổi scene', () => {
  test('scene.start( chỉ có trong transitions/SceneDirector.ts', () => {
    const offenders = walk(SRC)
      .filter((file) => /scene\.start\(/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(SRC, file).replaceAll('\\', '/'));
    expect(offenders).toEqual(['presentation/transitions/SceneDirector.ts']);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/sceneDirector.test.ts tests/sceneStartGate.test.ts`
Expected: test director FAIL vì thiếu module. Test cổng FAIL và liệt kê `main.ts`, `MenuScene.ts`, `LevelSelectScene.ts`, `PlayScene.ts`.

- [ ] **Step 4: Viết `SceneDirector.ts`**

`game-next/src/presentation/transitions/SceneDirector.ts`:

```ts
import type Phaser from 'phaser';
import { TRANSITION_TOKENS } from '../designTokens.ts';
import type { MoodTarget, SkyMood } from '../skyMood.ts';
import type { RouteId } from './motion.ts';
import { isReducedMotion } from './motion.ts';
import { TransitionTimeline } from './TransitionTimeline.ts';

export type SceneKey = 'MenuScene' | 'LevelSelectScene' | 'PlayScene';

export type TransitionContext = {
  from: SceneKey | 'boot';
  route: RouteId;
  /** Nút hoặc node vừa bấm, để cảnh mới mọc ra từ đúng chỗ đó */
  origin?: { x: number; y: number };
};

export interface Choreographed {
  readonly directorKey: SceneKey;
  playIn(tl: TransitionTimeline, ctx: TransitionContext): void;
  playOut(tl: TransitionTimeline, ctx: TransitionContext): void;
}

/** Cổng tới Phaser; test dùng bản giả. */
export interface SceneHost {
  start(key: SceneKey, data: object): void;
  restart(key: SceneKey, data: object): void;
  stop(key: SceneKey): void;
  setInputEnabled(key: SceneKey, enabled: boolean): void;
  setCameraAlpha(key: SceneKey, alpha: number): void;
  setMood(mood: SkyMood, durationMs: number): void;
  armSkip(onSkip: () => void): void;
  disarmSkip(): void;
  onStep(cb: (deltaMs: number) => void): void;
}

const ROUTE_MOOD: Record<RouteId, SkyMood> = {
  'menu-to-play': 'play',
  'map-to-play': 'play',
  'next-level': 'play',
  'play-to-map': 'map',
  'play-to-menu': 'menu',
  'menu-to-map': 'map',
  'map-to-menu': 'menu',
};

/** Tuyến dùng cho phần vào khi khởi động thẳng vào một cảnh */
const BOOT_ROUTE: Record<SceneKey, RouteId> = {
  MenuScene: 'play-to-menu',
  LevelSelectScene: 'menu-to-map',
  PlayScene: 'menu-to-play',
};

export class SceneDirector {
  private host: SceneHost | null = null;
  private busy = false;
  private skipping = false;
  private fromKey: SceneKey | null = null;
  private toKey: SceneKey | null = null;
  private outTl: TransitionTimeline | null = null;
  private inTl: TransitionTimeline | null = null;
  private incoming: { key: SceneKey; ctx: TransitionContext } | null = null;
  private outDone = false;
  private inDone = false;
  private pendingEnable: SceneKey | null = null;

  setHost(host: SceneHost): void {
    this.host = host;
    host.onStep((dt) => this.step(dt));
  }

  isTransitioning(): boolean {
    return this.busy;
  }

  go(
    fromScene: Choreographed,
    to: SceneKey,
    data: object,
    ctx: { route: RouteId; origin?: { x: number; y: number } }
  ): boolean {
    const host = this.host;
    if (!host || this.busy) return false;

    const fromKey = fromScene.directorKey;
    const fullCtx: TransitionContext = { ...ctx, from: fromKey };
    const reduced = isReducedMotion();
    this.begin(fromKey, to);
    host.setInputEnabled(fromKey, false);
    host.setMood(ROUTE_MOOD[ctx.route], reduced ? 0 : TRANSITION_TOKENS.moodMs);

    const out = new TransitionTimeline(0);
    this.outTl = out;
    if (reduced) {
      const fade = { alpha: 1 };
      out.at(0, fade, { alpha: 0 }, TRANSITION_TOKENS.crossfadeMs, 'linear', () =>
        host.setCameraAlpha(fromKey, fade.alpha)
      );
    } else {
      fromScene.playOut(out, fullCtx);
    }

    this.incoming = { key: to, ctx: fullCtx };
    if (fromKey === to) {
      // Cùng scene (màn kế): đợi phần ra xong rồi mới dựng lại
      out.onDone(() => {
        this.outDone = true;
        host.restart(to, data);
      });
    } else {
      const handoff = reduced ? 0 : TRANSITION_TOKENS.routes[ctx.route].handoffMs;
      out.call(handoff, () => host.start(to, data));
      out.onDone(() => {
        this.outDone = true;
        this.maybeFinish();
      });
    }
    out.advance(0);
    return true;
  }

  /** Khởi động thẳng vào một cảnh: chỉ có phần vào. */
  boot(to: SceneKey, data: object): void {
    const host = this.host;
    if (!host || this.busy) return;
    const route = BOOT_ROUTE[to];
    this.begin(null, to);
    this.outDone = true;
    host.setMood(ROUTE_MOOD[route], 0);
    this.incoming = { key: to, ctx: { from: 'boot', route } };
    host.start(to, data);
  }

  /** Mỗi scene gọi ở cuối create(). Ngoài chuyển cảnh thì không làm gì. */
  attach(scene: Choreographed): void {
    const host = this.host;
    const incoming = this.incoming;
    if (!host || !incoming || incoming.key !== scene.directorKey) return;
    this.incoming = null;
    host.setInputEnabled(incoming.key, false);

    const reduced = isReducedMotion();
    const tl = new TransitionTimeline(
      reduced ? 0 : TRANSITION_TOKENS.routes[incoming.ctx.route].handoffMs
    );
    this.inTl = tl;
    if (reduced) {
      const fade = { alpha: 0 };
      host.setCameraAlpha(incoming.key, 0);
      tl.at(0, fade, { alpha: 1 }, TRANSITION_TOKENS.crossfadeMs, 'linear', () =>
        host.setCameraAlpha(incoming.key, fade.alpha)
      );
    } else {
      scene.playIn(tl, incoming.ctx);
    }
    tl.onDone(() => {
      this.inDone = true;
      this.maybeFinish();
    });
    if (this.skipping) tl.complete();
    else tl.advance(0);
  }

  skip(): void {
    if (!this.busy) return;
    this.skipping = true;
    this.outTl?.complete();
    this.inTl?.complete();
  }

  private begin(fromKey: SceneKey | null, toKey: SceneKey): void {
    this.busy = true;
    this.skipping = false;
    this.fromKey = fromKey;
    this.toKey = toKey;
    this.outDone = false;
    this.inDone = false;
    this.outTl = null;
    this.inTl = null;
    this.host?.armSkip(() => this.skip());
  }

  private step(dt: number): void {
    if (this.pendingEnable && this.host) {
      this.host.setInputEnabled(this.pendingEnable, true);
      this.pendingEnable = null;
    }
    this.outTl?.advance(dt);
    this.inTl?.advance(dt);
  }

  private maybeFinish(): void {
    const host = this.host;
    if (!host || !this.busy || !this.outDone || !this.inDone) return;
    if (this.fromKey && this.fromKey !== this.toKey) {
      host.setCameraAlpha(this.fromKey, 1);
      host.stop(this.fromKey);
    }
    // Mở input ở khung sau: chạm vừa dùng để bỏ qua không được rơi xuống cảnh mới
    this.pendingEnable = this.toKey;
    host.disarmSkip();
    this.busy = false;
    this.skipping = false;
    this.outTl = null;
    this.inTl = null;
    this.fromKey = null;
    this.toKey = null;
  }
}

/** Chờ chừng này sau khi bắt đầu chuyển mới nhận chạm bỏ qua (tránh chính cú chạm khởi động) */
const SKIP_ARM_GUARD_MS = 80;

export class PhaserSceneHost implements SceneHost {
  private readonly game: Phaser.Game;
  private skipHandler: (() => void) | null = null;

  constructor(game: Phaser.Game) {
    this.game = game;
  }

  start(key: SceneKey, data: object): void {
    this.game.scene.start(key, data);
    this.game.scene.bringToTop(key);
  }

  restart(key: SceneKey, data: object): void {
    this.game.scene.getScene(key)?.scene.restart(data);
  }

  stop(key: SceneKey): void {
    this.game.scene.stop(key);
  }

  setInputEnabled(key: SceneKey, enabled: boolean): void {
    const scene = this.game.scene.getScene(key);
    if (scene?.input) scene.input.enabled = enabled;
  }

  setCameraAlpha(key: SceneKey, alpha: number): void {
    this.game.scene.getScene(key)?.cameras?.main?.setAlpha(alpha);
  }

  setMood(mood: SkyMood, durationMs: number): void {
    const background = this.game.scene.getScene('BackgroundScene') as unknown as MoodTarget | null;
    background?.setMood(mood, durationMs);
  }

  armSkip(onSkip: () => void): void {
    this.disarmSkip();
    const armedAt = performance.now();
    this.skipHandler = () => {
      if (performance.now() - armedAt >= SKIP_ARM_GUARD_MS) onSkip();
    };
    this.game.canvas.addEventListener('pointerdown', this.skipHandler);
  }

  disarmSkip(): void {
    if (this.skipHandler) this.game.canvas.removeEventListener('pointerdown', this.skipHandler);
    this.skipHandler = null;
  }

  onStep(cb: (deltaMs: number) => void): void {
    this.game.events.on('step', (_time: number, delta: number) => cb(delta));
  }
}

export const director = new SceneDirector();
```

- [ ] **Step 5: Chạy test director, xác nhận đạt**

Run: `npx vitest run tests/sceneDirector.test.ts`
Expected: PASS (7 test). Test cổng nguồn vẫn FAIL cho tới Step 9.

- [ ] **Step 6: `main.ts` dùng BackgroundScene và director**

Thay toàn bộ `game-next/src/main.ts` từ dòng `const launch = …` tới hết file bằng:

```ts
const launch = resolveLaunch(window.location.search, import.meta.env.DEV);

const savedSettings = createProgressRepository(localStorage, campaignManifest, 'oracle-v1')
  .read().progress.settings;
setMotionScale(savedSettings.reducedMotion ? 0 : 1);

// BackgroundScene đứng đầu nên tự khởi động và luôn vẽ dưới cùng; các scene
// khác chỉ chạy khi SceneDirector gọi.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#1A2470',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BackgroundScene, MenuScene, PlayScene, LevelSelectScene, FixtureScene],
});

director.setHost(new PhaserSceneHost(game));

game.events.once('ready', () => {
  if (launch.scene === 'PlayScene') {
    director.boot('PlayScene', { levelId: launch.levelId, mode: launch.mode });
  } else {
    director.boot(launch.scene, {});
  }
});

setupAndroidLifecycle({
  onHardwareBack: () => {
    if (director.isTransitioning()) {
      director.skip();
      return;
    }
    const activePlayScene = game.scene.getScene('PlayScene') as PlayScene;
    const activeLevelSelect = game.scene.getScene('LevelSelectScene') as LevelSelectScene;

    if (activePlayScene && activePlayScene.scene.isActive()) {
      activePlayScene.onHardwareBack();
    } else if (activeLevelSelect && activeLevelSelect.scene.isActive()) {
      activeLevelSelect.goToMenu();
    } else {
      App.exitApp();
    }
  },
  onBackground: () => {
    director.skip();
    game.loop.sleep();
  },
  onResume: () => {
    game.loop.wake();
  },
});
```

Đổi khối import ở đầu file thành:

```ts
import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { BackgroundScene } from './presentation/BackgroundScene.ts';
import { MenuScene } from './presentation/MenuScene.ts';
import { PlayScene } from './presentation/PlayScene.ts';
import { LevelSelectScene } from './presentation/LevelSelectScene.ts';
import { FixtureScene } from './presentation/FixtureScene.ts';
import { setupAndroidLifecycle } from './infrastructure/lifecycle.ts';
import { createProgressRepository } from './infrastructure/progressRepository.ts';
import { campaignManifest } from './content/manifest.ts';
import { director, PhaserSceneHost } from './presentation/transitions/SceneDirector.ts';
import { setMotionScale } from './presentation/transitions/motion.ts';
import { resolveLaunch } from './launchParams.ts';
import './style.css';
```

Hai listener `error` và `unhandledrejection` giữ nguyên.

- [ ] **Step 7: MenuScene qua director (dàn dựng để trống)**

Trong `game-next/src/presentation/MenuScene.ts`:

1. Bỏ `import { SkyBackdrop } …`, field `sky`, dòng `this.sky = new SkyBackdrop(…)` và `this.sky.update(delta);` trong `update`.
2. Import thêm:

```ts
import { director } from './transitions/SceneDirector.ts';
import type { Choreographed, TransitionContext } from './transitions/SceneDirector.ts';
import type { TransitionTimeline } from './transitions/TransitionTimeline.ts';
```

3. Khai báo lớp: `export class MenuScene extends Phaser.Scene implements Choreographed {`. Thêm field `readonly directorKey = 'MenuScene' as const;`.
4. Cuối `create()` thêm `director.attach(this);`.
5. Nút chính (dòng 125–129) và nút phụ (dòng 153–159):

```ts
    btnZone.on('pointerdown', () => {
      btnZone.disableInteractive();
      this.animateButtonTap(mainBtnText, () => {
        director.go(this, 'PlayScene', { levelId: targetLevel.id }, {
          route: 'menu-to-play',
          origin: { x: btnX, y: btnY },
        });
      });
    });
```

```ts
    secBtnZone.on('pointerdown', () => {
      secBtnZone.disableInteractive();
      this.animateButtonTap(secBtnText, () => {
        director.go(this, 'LevelSelectScene', {}, { route: 'menu-to-map' });
      });
    });
```

6. Thêm hai phương thức rỗng (Task 7 lấp nội dung):

```ts
  playIn(_tl: TransitionTimeline, _ctx: TransitionContext): void {}

  playOut(_tl: TransitionTimeline, _ctx: TransitionContext): void {}
```

- [ ] **Step 8: LevelSelectScene qua director (dàn dựng để trống)**

Trong `game-next/src/presentation/LevelSelectScene.ts`:

1. Bỏ import, field, dòng tạo sky và `this.sky.update(delta)`. Xoá luôn method `update` vì nó chỉ còn rỗng.
2. Import như Step 7. Khai báo `implements Choreographed`, field `readonly directorKey = 'LevelSelectScene' as const;`.
3. Cuối `create()` thêm `director.attach(this);`.
4. Nút quay lại (dòng 113): `backBtn.on('pointerdown', () => this.goToMenu());` và thêm phương thức công khai (main.ts dùng cho nút Back):

```ts
  public goToMenu(): void {
    director.go(this, 'MenuScene', {}, { route: 'map-to-menu' });
  }
```

5. Chạm node (dòng 405–409):

```ts
          director.go(this, 'PlayScene', {
            levelId: node.id,
            mode: this.mode,
            previewCompletedThrough: this.previewCompletedThrough,
          }, {
            route: 'map-to-play',
            origin: { x: node.x, y: node.y + this.mapContainer.y },
          });
```

6. Thêm `playIn` và `playOut` rỗng như Step 7.

- [ ] **Step 9: PlayScene qua director (dàn dựng để trống)**

Trong `game-next/src/presentation/PlayScene.ts`:

1. Bỏ import và field `sky`, dòng `this.sky = new SkyBackdrop(…)`, và xoá cả method `update` (nó chỉ gọi `sky.update`).
2. Import như Step 7. Khai báo `implements Choreographed`, field `readonly directorKey = 'PlayScene' as const;` và `private loadFailed = false;`.
3. Trong `init`: đầu hàm thêm `this.loadFailed = false;`. Trong `catch (fallbackErr)` thay `this.scene.start('MenuScene');` bằng `this.loadFailed = true;`.
4. Đầu `create()`:

```ts
    if (this.loadFailed) {
      // Không tải được cả 1-1: kết thúc chuyển cảnh đang chờ rồi về Menu
      director.attach(this);
      director.skip();
      this.time.delayedCall(0, () => {
        director.go(this, 'MenuScene', {}, { route: 'play-to-menu' });
      });
      return;
    }
```

5. Cuối `create()` (sau khối autosolve) thêm `director.attach(this);`.
6. `onNextLevel` (dòng 133–156) đổi thành:

```ts
      onNextLevel: () => {
        const nextId = nextLevelId(campaignManifest, this.level.id);
        let playable = false;
        if (nextId) {
          try {
            // Kiểm tra đúng chế độ: campaign về menu nếu màn kế chưa approved.
            loadLevel(nextId, this.mode);
            playable = true;
          } catch {
            playable = false;
          }
        }
        if (nextId && playable) {
          director.go(this, 'PlayScene', {
            levelId: nextId,
            mode: this.mode,
            previewCompletedThrough: this.mode === 'harness'
              ? furthestLevelId(campaignManifest, this.previewCompletedThrough, this.level.id)
              : undefined,
          }, { route: 'next-level' });
        } else {
          director.go(this, 'MenuScene', {}, { route: 'play-to-menu' });
        }
      },
```

7. `openLevelSelect()`: thay `this.scene.start('LevelSelectScene', {…})` bằng `director.go(this, 'LevelSelectScene', {…}, { route: 'play-to-map' });`, giữ nguyên object dữ liệu.
8. Thêm `playIn` và `playOut` rỗng như Step 7.

- [ ] **Step 10: Chạy toàn bộ test và typecheck**

Run: `npm run typecheck && npm test`
Expected: PASS, gồm cả `sceneStartGate.test.ts`. Nếu cổng còn báo file nào, sửa nốt lời gọi trong file đó.

- [ ] **Step 11: Kiểm thủ công nhanh**

Run: `npm run dev`, mở `http://localhost:5173/`.

Expected:
- Menu hiện ra với nền sao.
- Bấm "Bắt đầu": khoảng 200 ms sau Play hiện ra và sao nền không nhảy chỗ. Lúc này chưa có dàn dựng, nên trông vẫn như một nhát cắt chậm.
- Mở `?scene=play&level=1-3&mode=harness`: vào thẳng màn, console không lỗi.

- [ ] **Step 12: Changelog và commit**

```markdown
### 2026-10-03 - Route every scene change through SceneDirector (F1 task 6)

- Added `game-next/src/presentation/transitions/SceneDirector.ts`: a transition state machine behind a `SceneHost` port (input lock, overlapping hand-off, tap or Back to skip, deferred input re-enable, same-scene restart for the next level, 150 ms crossfade under reduced motion) and its Phaser host.
- `BackgroundScene` now owns the only sky; Menu, Level Select and Play no longer build their own. All 13 `scene.start` calls now go through the director; `main.ts` boots through it and skips an active transition on Android Back or backgrounding.
- Verification: `tests/sceneDirector.test.ts` failed for the missing module and `tests/sceneStartGate.test.ts` listed four offending files, then both passed; `npm run typecheck` and `npm test` passed; manual check on the dev server: menu → play keeps the star field in place.
```

```bash
git add game-next/src game-next/tests/sceneDirector.test.ts game-next/tests/sceneStartGate.test.ts CHANGELOG.md
git commit -m "feat(motion): route scene changes through SceneDirector"
```

---

### Task 7: Dàn dựng Menu

**Files:**
- Modify: `game-next/src/presentation/MenuScene.ts`
- Test: không thêm. Bảng bước của Menu đã được test ở Task 3. Phần còn lại là ghép GameObject, nghiệm thu ở Task 10.

**Interfaces:**
- Consumes: `applySteps`, `Parts`, `MENU_OUT_TO_PLAY`, `MENU_OUT_TO_MAP`, `MENU_SPECIAL`, `menuIn`, `getMotionScale`.

- [ ] **Step 1: Gom phần tử thành nhóm animate được**

Trong `buildMainMenu` của `MenuScene.ts`, gom từng cụm vào container đặt tại tâm của cụm, rồi tạo con theo toạ độ tương đối.

Field mới:

```ts
  private titleBlock!: Phaser.GameObjects.Container;
  private primaryButton!: Phaser.GameObjects.Container;
  private secondaryButton!: Phaser.GameObjects.Container;
  private settingsButton!: Phaser.GameObjects.Container;
  private footer!: Phaser.GameObjects.Text;
  /** Hệ số tốc độ vòng ấn; tween lên 4 khi đi vào màn chơi */
  private readonly emblemMotion = { ringSpeed: 1 };
```

Các thay đổi:
- **Cài đặt:** tạo `settingsBtn` và `settingsIcon` tại `(0, 0)`, rồi `this.settingsButton = this.add.container(664, 52, [settingsBtn, settingsIcon]);`.
- **Tiêu đề:** `titleText` tại `(0, -50)`, `reflectionText` tại `(0, 0)`, `subtitleText` tại `(0, 50)`, rồi `this.titleBlock = this.add.container(360, 260, [titleText, reflectionText, subtitleText]);`.
- **Nút chính:** `btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 20)`, `mainBtnText` tại `(0, -12)`, `subBtnText` tại `(0, 14)`, `btnZone` tại `(0, 0)`, rồi `this.primaryButton = this.add.container(btnX, btnY, [btnBg, mainBtnText, subBtnText, btnZone]);`.
- **Nút phụ:** `secBtnBg` vẽ quanh `(0, 0)` với `fillRoundedRect(-btnWidth / 2, -28, btnWidth, 56, 18)` (stroke tương tự), `secBtnText` tại `(0, 0)`, `secBtnZone` tại `(0, 0)`, rồi `this.secondaryButton = this.add.container(btnX, secBtnY, [secBtnBg, secBtnText, secBtnZone]);`.
- **Footer:** `this.footer = footerText`.
- Thay các lời gọi `this.uiContainer.add([...])` bằng một lần: `this.uiContainer.add([this.settingsButton, this.titleBlock, this.primaryButton, this.secondaryButton, this.footer]);`.

- [ ] **Step 2: Ấn Song Tinh vẽ quanh gốc của chính nó**

Trong `create()` đổi thành `this.emblemGraphics = this.add.graphics().setPosition(360, 500);`.

Trong `update`:
- `const cx = 0; const cy = 0;`
- Quay vòng theo tốc độ dàn dựng và tắt khi Giảm chuyển động:

```ts
    const spin = this.emblemMotion.ringSpeed * getMotionScale();
    this.ringAngle1 += delta * 0.0003 * spin;
    this.ringAngle2 -= delta * 0.0002 * spin;
    this.pulseTime += delta * 0.003;
```

Import `getMotionScale` từ `./transitions/motion.ts`.

- [ ] **Step 3: Lấp `playIn` và `playOut`**

```ts
  private transitionParts(): Parts {
    return {
      emblem: [this.emblemGraphics],
      titleBlock: [this.titleBlock],
      primaryButton: [this.primaryButton],
      buttons: [this.primaryButton, this.secondaryButton],
      chrome: [this.titleBlock, this.secondaryButton, this.settingsButton, this.footer],
      corner: [this.settingsButton, this.footer],
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    applySteps(tl, menuIn(ctx.from === 'LevelSelectScene' ? 'map' : 'play'), this.transitionParts(), 'enter');
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (ctx.route === 'menu-to-play') {
      applySteps(tl, MENU_OUT_TO_PLAY, this.transitionParts(), 'exit');
      tl.at(MENU_SPECIAL.spinAtMs, this.emblemMotion, { ringSpeed: MENU_SPECIAL.spinPeak }, MENU_SPECIAL.spinMs, 'cubicInOut');
    } else {
      applySteps(tl, MENU_OUT_TO_MAP, this.transitionParts(), 'exit');
    }
  }
```

Import `applySteps` và `type Parts` từ `./transitions/choreography.ts`, và `MENU_OUT_TO_MAP`, `MENU_OUT_TO_PLAY`, `MENU_SPECIAL`, `menuIn` từ `./transitions/routes.ts`.

- [ ] **Step 4: Typecheck, test, kiểm thủ công**

Run: `npm run typecheck && npm test`
Expected: PASS.

Run: `npm run dev`, mở `/`. Kiểm:
- Lúc khởi động, ấn Song Tinh mọc lên, tiêu đề hạ xuống, hai nút nhô lên lần lượt.
- Bấm "Bắt đầu": nút co lại và mờ đi, phần còn lại rút lên, vòng ấn quay nhanh dần và trôi xuống tâm bia.
- Bấm "Chọn màn chơi": ấn bay lên header.
- Vị trí mọi phần tử sau dàn dựng trùng hệt trước plan này. So bằng mắt với `docs/gui/improve-v1` hoặc ảnh chụp trước khi sửa.

- [ ] **Step 5: Changelog và commit**

```markdown
### 2026-10-03 - Choreograph the main menu (F1 task 7)

- Grouped the menu title, buttons, settings and footer into animatable containers and drew the Song Tinh emblem around its own origin; added menu in/out choreography (button collapse, staggered chrome, emblem descending into the board or flying to the map header, 4x ring spin) and stopped the emblem rings under reduced motion.
- Verification: `npm run typecheck` and `npm test` passed; manual dev-server check of boot, menu → play and menu → map.
```

```bash
git add game-next/src/presentation/MenuScene.ts CHANGELOG.md
git commit -m "feat(motion): choreograph main menu transitions"
```

---

### Task 8: Dàn dựng Bản đồ

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts`

**Interfaces:**
- Consumes: `applySteps`, `orderByDistance`, `Parts`, `mapIn`, `MAP_OUT_TO_PLAY`, `MAP_OUT_TO_MENU`, `MAP_SPECIAL`, `LAYOUT_TOKENS`.

- [ ] **Step 1: Giữ tham chiếu node và đường nối**

Field mới:

```ts
  private nodeViews: Array<{ info: NodeInfo; container: Phaser.GameObjects.Container }> = [];
  private linkParts: Poseable[] = [];
  private tappedIndex: number | null = null;
```

Trong `buildConstellation`:
- Đầu hàm: `this.nodeViews = []; this.linkParts = [];`
- Sau khi tạo `linesGraphics`: `this.linkParts.push(linesGraphics);`
- Sau khi tạo mỗi `spark`: `this.linkParts.push(spark);`
- Sau khi tạo mỗi `chContainer`: `this.linkParts.push(chContainer);`
- Trong vòng node, sau `this.mapContainer.add(nodeContainer);`: `this.nodeViews.push({ info: node, container: nodeContainer });`
- Trong handler chạm node, trước `director.go(…)`: `this.tappedIndex = this.nodeViews.findIndex((v) => v.info.id === node.id);`

`Graphics`, `Arc` và `Container` đều thoả `Poseable` (`x`, `y`, `alpha`, `scaleX`, `scaleY`).

- [ ] **Step 2: Lấp `playIn`, `playOut` và vòng sáng**

```ts
  private anchorIndex(): number {
    const current = this.nodeViews.findIndex((v) => v.info.state === 'current');
    return current >= 0 ? current : 0;
  }

  private transitionParts(anchor: number): Parts {
    const ordered = orderByDistance(this.nodeViews.map((v) => v.container), anchor);
    const tapped = this.nodeViews[anchor]?.container;
    return {
      header: [this.headerContainer],
      nodes: ordered,
      tappedNode: tapped ? [tapped] : [],
      otherNodes: ordered.filter((c) => c !== tapped),
      links: this.linkParts,
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    applySteps(tl, mapIn(ctx.from === 'PlayScene' ? 400 : 300), this.transitionParts(this.anchorIndex()), 'enter');
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (ctx.route === 'map-to-play') {
      applySteps(tl, MAP_OUT_TO_PLAY, this.transitionParts(this.tappedIndex ?? this.anchorIndex()), 'exit');
      if (ctx.origin) this.expandRing(tl, ctx.origin);
    } else {
      applySteps(tl, MAP_OUT_TO_MENU, this.transitionParts(this.anchorIndex()), 'exit');
    }
  }

  /** Vòng sáng lan từ node vừa bấm tới bao trọn vị trí tấm bia của màn chơi */
  private expandRing(tl: TransitionTimeline, origin: { x: number; y: number }): void {
    const b = LAYOUT_TOKENS.board;
    const corners = [
      [b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height],
    ];
    const maxRadius = Math.max(...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
    const ring = this.add.graphics().setDepth(200);
    const state = { radius: MAP_SPECIAL.ringStartRadius, alpha: 0.9 };
    const draw = () => {
      ring.clear();
      ring.fillStyle(COLOR_NUMBERS.icePrimary, state.alpha * 0.12);
      ring.fillCircle(origin.x, origin.y, state.radius);
      ring.lineStyle(3, COLOR_NUMBERS.icePrimary, state.alpha);
      ring.strokeCircle(origin.x, origin.y, state.radius);
    };
    draw();
    tl.at(0, state, { radius: maxRadius, alpha: 0.3 }, MAP_SPECIAL.ringMs, 'cubicOut', draw);
  }
```

Import thêm `LAYOUT_TOKENS` vào dòng import `designTokens` hiện có. Import `applySteps`, `orderByDistance`, `type Parts`, `type Poseable` từ `./transitions/choreography.ts`, và `MAP_OUT_TO_MENU`, `MAP_OUT_TO_PLAY`, `MAP_SPECIAL`, `mapIn` từ `./transitions/routes.ts`.

Vòng sáng tự huỷ khi scene bị `stop` ở cuối chuyển cảnh, nên không cần dọn.

- [ ] **Step 3: Typecheck, test, kiểm thủ công**

Run: `npm run typecheck && npm test`

Run: `npm run dev`. Kiểm:
- Menu → Bản đồ: header trượt xuống, node bật ra từ node hiện tại lan ra hai phía, đường nối hiện dần, sao bắt đầu trôi dần.
- Bấm node: node phóng to, vòng sáng lan ra, các node khác mờ dần.
- Nút quay lại: về Menu, sao dừng trôi dần.

- [ ] **Step 4: Changelog và commit**

```markdown
### 2026-10-03 - Choreograph the constellation map (F1 task 8)

- Kept references to map nodes and links; nodes now pop in outward from the current node, the tapped node grows and emits a ring that expands to the board footprint, and the header and links fade on exit.
- Verification: `npm run typecheck` and `npm test` passed; manual dev-server check of menu ↔ map and map → play.
```

```bash
git add game-next/src/presentation/LevelSelectScene.ts CHANGELOG.md
git commit -m "feat(motion): choreograph constellation map transitions"
```

---

### Task 9: Dàn dựng Play

**Files:**
- Create: `game-next/src/presentation/transitions/playChoreography.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Modify: `game-next/src/presentation/Hud.ts`
- Modify: `game-next/src/presentation/TargetBadge.ts`
- Modify: `game-next/src/presentation/PlayScene.ts`
- Test: `game-next/tests/boardRendererLayers.test.ts` (phải còn xanh), `game-next/tests/boardRendererReveal.test.ts` (mới)

**Interfaces:**
- Consumes: `applySteps`, `Parts`, `Poseable`, `playIn`, `PLAY_OUT_NEXT`, `PLAY_OUT_LEAVE`, `PLAY_SPECIAL`, `planStardust`, `dustAt`, `STARDUST_MAX`, `stagger`, `getMotionScale`.
- Produces:
  - `BoardRenderer.getTransitionParts(): BoardTransitionParts` với `{ board, runes, rings, tray, trayPieces, pieces, targets: Poseable[]; grid: RenderTexture | null }`
  - `BoardRenderer.setTargetReveal(values: readonly number[] | null): void`
  - `BoardRenderer.setFrameGold(on: boolean): void`
  - `Hud.getTransitionParts(): { title, topButtons, bottomBar, winCard: Poseable[] }`
  - `TargetBadge.getContainer(): Phaser.GameObjects.Container`
  - `choreographPlayIn(tl, ctx, view: PlayTransitionView)`, `choreographPlayOut(tl, ctx, view)`

- [ ] **Step 1: Viết test thất bại cho bóng mục tiêu hiện dần**

`game-next/tests/boardRendererReveal.test.ts` (dùng cùng cách mock Phaser như `boardRendererLayers.test.ts`):

```ts
import { describe, expect, test, vi } from 'vitest';
import type Phaser from 'phaser';
import { BoardRenderer } from '../src/presentation/BoardRenderer.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { PlayViewSnapshot } from '../src/application/playController.ts';

vi.mock('phaser', () => ({ default: { Display: { Color: {
  HexStringToColor: (value: string) => ({ color: Number.parseInt(value.slice(1), 16) }),
} }, Geom: { Point: class {
  x: number;
  y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
} } } }));

describe('BoardRenderer.setTargetReveal', () => {
  test('nhân alpha bóng mục tiêu theo từng placement và vẽ lại ngay', () => {
    const fills: Array<{ depth: number; alpha: number }> = [];
    const scene = { add: { graphics: () => {
      let depth = 0;
      const g: object = new Proxy({}, { get: (_, method: string) => (...args: unknown[]) => {
        if (method === 'setDepth') depth = args[0] as number;
        if (method === 'fillStyle') fills.push({ depth, alpha: args[1] as number });
        if (method === 'clear' && depth === 20) fills.length = 0;
        return g;
      } });
      return g;
    } } } as unknown as Phaser.Scene;
    const staticBoard = vi.spyOn(BoardRenderer.prototype, 'drawStaticBoard').mockImplementation(() => {});
    const renderer = new BoardRenderer(scene, computeLayout(720, 1280), 2);
    staticBoard.mockRestore();
    const level = loadLevel('1-1', 'campaign');
    const snapshot: PlayViewSnapshot = {
      levelId: level.id, phase: 'playing', showTarget: true, snappedCount: 0, totalPieces: 2,
      canRotate: false, selectedPieceId: null, dragPreviewMask: null, snapCandidateId: null,
      dragInfo: null, committedMask: new Uint8Array(level.targetMask.length),
    };
    renderer.render(level, snapshot, {});
    const full = fills.filter((f) => f.depth === 20).map((f) => f.alpha);
    expect(full.length).toBeGreaterThan(0);

    renderer.setTargetReveal([0, 0]);
    expect(fills.filter((f) => f.depth === 20)).toEqual([]);

    renderer.setTargetReveal([0.5, 0.5]);
    const half = fills.filter((f) => f.depth === 20).map((f) => f.alpha);
    expect(half).toHaveLength(full.length);
    half.forEach((alpha, i) => expect(alpha).toBeCloseTo(full[i] * 0.5, 9));

    renderer.setTargetReveal(null);
    expect(fills.filter((f) => f.depth === 20).map((f) => f.alpha)).toEqual(full);
    renderer.destroy();
  });
});
```

Depth 20 là `DEPTH_TOKENS.targetSilhouette`. Lệnh `clear` của lớp bóng mục tiêu xoá danh sách ghi lại, nên mảng chỉ chứa lần vẽ cuối.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/boardRendererReveal.test.ts`
Expected: FAIL với `renderer.setTargetReveal is not a function`.

- [ ] **Step 3: Sửa `BoardRenderer.ts`**

1. Import thêm: `import { getMotionScale } from './transitions/motion.ts'; import type { Poseable } from './transitions/choreography.ts';`.
2. Kiểu công khai đặt đầu file:

```ts
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
```

3. Bỏ field `bgGraphics` (dòng tạo trong constructor, `clear()` trong `drawStaticBoard`, `destroy()`), và xoá method `drawCardinalRunes`. Thêm field:

```ts
  private boardBase: Phaser.GameObjects.Container | null = null;
  private boardTop: Phaser.GameObjects.Container | null = null;
  private runes: Phaser.GameObjects.Arc[] = [];
  private targetReveal: readonly number[] | null = null;
  private lastLevel: Level | null = null;
  private lastSnapshot: PlayViewSnapshot | null = null;
```

4. Thay phần dựng mặt bàn, khung và lưới trong `drawStaticBoard`, từ mục 1 tới mục 5 (mục khay giữ nguyên):

```ts
    const { boardBounds, trayBounds } = this.layout;
    const cx = boardBounds.x + boardBounds.width / 2;
    const cy = boardBounds.y + boardBounds.height / 2;
    const left = -boardBounds.width / 2;
    const top = -boardBounds.height / 2;

    // Bia chia ba lớp quanh tâm (360, 600) để co giãn quanh tâm khi chuyển cảnh:
    // đế (mặt bàn) < lưới (RenderTexture) < nắp (rune + khung kính).
    if (!this.boardBase) {
      this.boardSurface = this.scene.add.image(left, top, TEXTURE_KEYS.boardSurface).setOrigin(0, 0);
      this.boardBase = this.scene.add
        .container(cx, cy, [this.boardSurface])
        .setDepth(DEPTH_TOKENS.steleBoard);
    }

    if (!this.gridTexture) {
      this.gridTexture = GridPainter.paint(this.scene, boardBounds)
        .setOrigin(0.5, 0.5)
        .setPosition(cx, cy);
    }

    if (!this.boardTop) {
      // 4 rune phương vị theo thứ tự Bắc, Đông, Nam, Tây (thứ tự sáng lên)
      const inset = 24;
      this.runes = [
        [0, top + inset],
        [-left - inset, 0],
        [0, -top - inset],
        [left + inset, 0],
      ].map(([x, y]) => this.scene.add.circle(x, y, 3, COLOR_NUMBERS.gridModule, 0.45));
      this.boardFrame = this.scene.add.image(left, top, TEXTURE_KEYS.glassFrameBoard).setOrigin(0, 0);
      this.boardTop = this.scene.add
        .container(cx, cy, [...this.runes, this.boardFrame])
        .setDepth(DEPTH_TOKENS.boardGrid + 1);
      this.trayFrame = this.scene.add
        .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
        .setOrigin(0, 0)
        .setDepth(DEPTH_TOKENS.trayArea);
    }
```

   Ghi chú cho người review: trước đây 4 rune vẽ vào `bgGraphics`, cùng depth với mặt bàn nhưng tạo trước, nên bị mặt bàn che. Giờ rune nằm trên lưới, dưới khung, nên nhìn thấy được. Đây là thay đổi hình ảnh có chủ ý, vì spec F1 mục 3.1 cho rune sáng lần lượt.

5. Tách đổi khung khỏi chế độ thắng:

```ts
  public setFrameGold(on: boolean): void {
    this.boardFrame?.setTexture(on ? TEXTURE_KEYS.goldFrameBoard : TEXTURE_KEYS.glassFrameBoard);
  }

  public setVictoryMode(on: boolean): void {
    this.setFrameGold(on);
    this.trayFrame?.setVisible(!on);
    for (const well of this.trayWells) well.setVisible(!on);
  }
```

6. Vòng thiên văn đứng yên khi Giảm chuyển động. Dòng đầu `updateCelestialRings`:

```ts
    const speedMult = (isWon ? 3.0 : 1.0) * getMotionScale();
```

7. `render()` lưu lần vẽ cuối. Đầu hàm thêm `this.lastLevel = level; this.lastSnapshot = snapshot;`.
8. `drawTargetSilhouette` nhân alpha theo placement:

```ts
    const drag = snapshot.dragInfo;
    (level.targetPlacements ?? []).forEach((placement, index) => {
      const reveal = this.targetReveal?.[index] ?? 1;
      if (reveal <= 0) return;
      const piece = level.pieces.find((p) => p.id === placement.pieceId);
      if (!piece) return;
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
          alpha: (isHovered ? 1 : 0.7) * reveal,
          sizePx: pieceRadiusPx(piece.frameSize, this.layout),
        }
      );
    });
```

9. Phương thức mới:

```ts
  /** Hệ số hiện dần của từng bóng mục tiêu (null = hiện đủ); vẽ lại ngay. */
  public setTargetReveal(values: readonly number[] | null): void {
    this.targetReveal = values;
    if (this.lastLevel && this.lastSnapshot) {
      this.drawTargetSilhouette(this.lastLevel, this.lastSnapshot);
    }
  }

  public getTransitionParts(): BoardTransitionParts {
    const present = <T>(items: Array<T | null | undefined>): T[] =>
      items.filter((item): item is T => item !== null && item !== undefined);
    return {
      board: present<Poseable>([this.boardBase, this.gridTexture, this.boardTop]),
      runes: [...this.runes],
      rings: [this.ringGraphics],
      tray: present<Poseable>([this.trayFrame, ...this.trayWells]),
      trayPieces: [this.piecesGraphics],
      pieces: [this.piecesGraphics, this.parityGraphics, this.temporaryGraphics, this.draggingGraphics, this.fxGraphics],
      targets: [this.targetGraphics],
      grid: this.gridTexture,
    };
  }
```

10. `destroy()` thêm `this.boardBase?.destroy(); this.boardTop?.destroy(); this.gridTexture?.destroy(); this.trayFrame?.destroy(); this.trayWells.forEach((w) => w.destroy());`.

- [ ] **Step 4: Chạy hai test renderer**

Run: `npx vitest run tests/boardRendererReveal.test.ts tests/boardRendererLayers.test.ts tests/boardRenderer.test.ts`
Expected: PASS. Test thứ tự lớp cũ không đổi, vì `drawStaticBoard` bị mock và các lớp Graphics giữ nguyên depth.

- [ ] **Step 5: `Hud` và `TargetBadge` mở phần tử**

Trong `Hud.ts`:
- Field `private menuButton: Phaser.GameObjects.Container;`
- Trong constructor, thay khối nút Menu (dòng 65–72):

```ts
    this.menuButton = this.scene.add.container(56, 56);
    const menuBtn = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const menuIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    menuBtn.on('pointerdown', () => {
      this.animateButtonTap(menuBtn, () => this.callbacks.onMenu());
    });
    this.menuButton.add([menuBtn, menuIcon]);
```

- Phương thức:

```ts
  public getTransitionParts(): { title: Poseable[]; topButtons: Poseable[]; bottomBar: Poseable[]; winCard: Poseable[] } {
    return {
      title: [this.titleText, this.subtitleText],
      topButtons: [this.menuButton, this.targetButton],
      bottomBar: [this.resetContainer, this.matchBar, this.rotateContainer],
      winCard: [this.winContainer],
    };
  }
```

- `destroy()` thêm `this.menuButton.destroy();`. Import `type Poseable`.

Trong `TargetBadge.ts` thêm:

```ts
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
```

- [ ] **Step 6: Viết `playChoreography.ts`**

`game-next/src/presentation/transitions/playChoreography.ts`:

```ts
import Phaser from 'phaser';
import { COLOR_NUMBERS, DEPTH_TOKENS, LAYOUT_TOKENS } from '../designTokens.ts';
import { applySteps } from './choreography.ts';
import type { Parts } from './choreography.ts';
import { stagger } from './motion.ts';
import { PLAY_OUT_LEAVE, PLAY_OUT_NEXT, PLAY_SPECIAL, playIn } from './routes.ts';
import type { Point } from './routes.ts';
import type { TransitionContext } from './SceneDirector.ts';
import { STARDUST_MAX, dustAt, planStardust } from './stardust.ts';
import type { TransitionTimeline } from './TransitionTimeline.ts';

export type PlayTransitionView = {
  scene: Phaser.Scene;
  parts: Parts;
  grid: Phaser.GameObjects.RenderTexture | null;
  boardBounds: { x: number; y: number; width: number; height: number };
  targetCount: number;
  setTargetReveal(values: readonly number[] | null): void;
  setFrameGold(on: boolean): void;
  /** Tâm các mảnh đang trên bia, nguồn của bụi sao khi sang màn kế */
  pieceCenters: Point[];
};

const GLINT_KEY = 'transition_glint';

function centerOf(b: PlayTransitionView['boardBounds']): Point {
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

export function choreographPlayIn(tl: TransitionTimeline, ctx: TransitionContext, view: PlayTransitionView): void {
  const center = centerOf(view.boardBounds);
  const variant = ctx.route === 'next-level' ? 'next' : ctx.route === 'map-to-play' ? 'node' : 'menu';
  applySteps(tl, playIn(variant, center, ctx.origin), view.parts, 'enter');
  if (variant !== 'next') {
    revealGrid(tl, view, center);
    zoomCamera(tl, view.scene);
  }
  revealTargets(tl, view);
  sweepGlint(tl, view);
}

export function choreographPlayOut(tl: TransitionTimeline, ctx: TransitionContext, view: PlayTransitionView): void {
  if (ctx.route === 'next-level') {
    applySteps(tl, PLAY_OUT_NEXT, view.parts, 'exit');
    implodeStardust(tl, view);
    flashFrame(tl, view);
  } else {
    applySteps(tl, PLAY_OUT_LEAVE, view.parts, 'exit');
  }
}

/** Lưới lộ dần theo vòng tròn loang từ tâm bia */
function revealGrid(tl: TransitionTimeline, view: PlayTransitionView, center: Point): void {
  const grid = view.grid;
  if (!grid) return;
  const shape = view.scene.make.graphics({ x: 0, y: 0 }, false);
  const state = { radius: 0 };
  const draw = () => {
    shape.clear();
    shape.fillStyle(0xffffff, 1);
    shape.fillCircle(center.x, center.y, Math.max(1, state.radius));
  };
  draw();
  grid.setMask(shape.createGeometryMask());
  tl.at(PLAY_SPECIAL.gridRevealAtMs, state, { radius: PLAY_SPECIAL.gridRevealRadius }, PLAY_SPECIAL.gridRevealMs, 'cubicOut', draw);
  tl.call(PLAY_SPECIAL.gridRevealAtMs + PLAY_SPECIAL.gridRevealMs, () => {
    grid.clearMask(true);
    shape.destroy();
  });
}

function zoomCamera(tl: TransitionTimeline, scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  const half = PLAY_SPECIAL.zoomMs / 2;
  tl.at(PLAY_SPECIAL.zoomAtMs, cam, { zoom: PLAY_SPECIAL.zoomPeak }, half, 'sineInOut');
  tl.at(PLAY_SPECIAL.zoomAtMs + half, cam, { zoom: 1 }, half, 'sineInOut');
}

function revealTargets(tl: TransitionTimeline, view: PlayTransitionView): void {
  const n = view.targetCount;
  if (n === 0) return;
  const state: Record<string, number> = {};
  for (let i = 0; i < n; i++) state[`p${i}`] = 0;
  const push = () => view.setTargetReveal(Array.from({ length: n }, (_, i) => state[`p${i}`]));
  push();
  for (let i = 0; i < n; i++) {
    tl.at(
      PLAY_SPECIAL.targetsAtMs + stagger(i, n, PLAY_SPECIAL.targetsSpanMs),
      state,
      { [`p${i}`]: 1 },
      PLAY_SPECIAL.targetsMs,
      'cubicOut',
      push
    );
  }
  tl.call(PLAY_SPECIAL.targetsAtMs + PLAY_SPECIAL.targetsSpanMs + PLAY_SPECIAL.targetsMs, () =>
    view.setTargetReveal(null)
  );
}

function ensureGlintTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GLINT_KEY)) return;
  const canvas = scene.textures.createCanvas(GLINT_KEY, 180, 1100);
  if (!canvas) return;
  const ctx = canvas.context;
  const gradient = ctx.createLinearGradient(0, 0, 180, 0);
  gradient.addColorStop(0, 'rgba(255, 244, 204, 0)');
  gradient.addColorStop(0.5, 'rgba(255, 244, 204, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 244, 204, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 180, 1100);
  canvas.refresh();
}

/** Vệt sáng lướt chéo qua bia lúc bóng mục tiêu hiện ra */
function sweepGlint(tl: TransitionTimeline, view: PlayTransitionView): void {
  const { scene, boardBounds: b } = view;
  ensureGlintTexture(scene);
  const glint = scene.add
    .image(b.x - 160, b.y + b.height / 2, GLINT_KEY)
    .setAngle(20)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(DEPTH_TOKENS.targetSilhouette + 1);
  const clip = scene.make.graphics({ x: 0, y: 0 }, false);
  clip.fillStyle(0xffffff, 1);
  clip.fillRoundedRect(b.x, b.y, b.width, b.height, LAYOUT_TOKENS.board.cornerRadius);
  glint.setMask(clip.createGeometryMask());
  tl.at(PLAY_SPECIAL.glintAtMs, glint, { x: b.x + b.width + 160 }, PLAY_SPECIAL.glintMs, 'cubicInOut');
  tl.call(PLAY_SPECIAL.glintAtMs + PLAY_SPECIAL.glintMs, () => {
    glint.destroy();
    clip.destroy();
  });
}

function implodeStardust(tl: TransitionTimeline, view: PlayTransitionView): void {
  const center = centerOf(view.boardBounds);
  const particles = planStardust(view.pieceCenters, center, STARDUST_MAX);
  if (particles.length === 0) return;
  const g = view.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 2);
  const state = { t: 0 };
  const draw = () => {
    g.clear();
    for (const p of particles) {
      const d = dustAt(p, state.t);
      if (d.alpha <= 0) continue;
      g.fillStyle(p.color, d.alpha);
      g.fillCircle(d.x, d.y, d.radius);
    }
  };
  tl.at(PLAY_SPECIAL.dustAtMs, state, { t: 1 }, PLAY_SPECIAL.dustMs, 'cubicInOut', draw);
  tl.call(PLAY_SPECIAL.dustAtMs + PLAY_SPECIAL.dustMs, () => g.destroy());
}

/** Khung bia lật sáng một nhịp: viền vàng sáng nhất rồi về kính xanh */
function flashFrame(tl: TransitionTimeline, view: PlayTransitionView): void {
  const b = view.boardBounds;
  const g = view.scene.add.graphics().setDepth(DEPTH_TOKENS.draggingPiece + 1).setAlpha(0);
  g.lineStyle(6, COLOR_NUMBERS.amberGlow, 1);
  g.strokeRoundedRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4, 38);
  // call phải đứng trước tween cùng mốc để tween bắt đầu từ alpha 0.9
  tl.call(PLAY_SPECIAL.flashAtMs, () => {
    view.setFrameGold(false);
    g.setAlpha(0.9);
  });
  tl.at(PLAY_SPECIAL.flashAtMs, g, { alpha: 0 }, PLAY_SPECIAL.flashMs, 'cubicOut');
}
```

- [ ] **Step 7: PlayScene lấp `playIn` và `playOut`**

Trong `PlayScene.ts`, import `choreographPlayIn`, `choreographPlayOut` và `type PlayTransitionView` từ `./transitions/playChoreography.ts`. Import thêm `pieceCenterCanvas` vào dòng import `layout.ts`.

```ts
  private transitionView(): PlayTransitionView {
    const board = this.boardRenderer.getTransitionParts();
    const hud = this.hud.getTransitionParts();
    const state = this.controller.getPuzzleState();
    const pieceCenters = this.level.pieces.flatMap((piece) => {
      const s = state.pieces[piece.id];
      if (!s || s.kind !== 'snapped') return [];
      const anchor = piece.anchors.find((a) => a.id === s.anchorId);
      return anchor ? [pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, this.layout)] : [];
    });
    return {
      scene: this,
      parts: {
        board: board.board,
        runes: board.runes,
        rings: board.rings,
        tray: board.tray,
        trayPieces: board.trayPieces,
        pieces: board.pieces,
        targets: board.targets,
        title: hud.title,
        topButtons: [...hud.topButtons, this.targetBadge.getContainer()],
        bottomBar: hud.bottomBar,
        winCard: hud.winCard,
      },
      grid: board.grid,
      boardBounds: this.layout.boardBounds,
      targetCount: this.level.targetPlacements?.length ?? 0,
      setTargetReveal: (values) => this.boardRenderer.setTargetReveal(values),
      setFrameGold: (on) => this.boardRenderer.setFrameGold(on),
      pieceCenters,
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (this.loadFailed) return;
    choreographPlayIn(tl, ctx, this.transitionView());
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (this.loadFailed) return;
    choreographPlayOut(tl, ctx, this.transitionView());
  }
```

- [ ] **Step 8: Typecheck, test, kiểm thủ công**

Run: `npm run typecheck && npm test`
Expected: PASS.

Run: `npm run dev`. Kiểm theo spec F1 mục 3.1–3.4:
- Menu → Play: bia mọc lên, lưới loang từ tâm, rune sáng B→Đ→N→T, bóng mục tiêu hiện lần lượt kèm vệt sáng, khay trồi lên, mảnh rơi vào, HUD trượt vào.
- Bản đồ → Play: bia mọc từ node vừa bấm.
- Thắng 1-1 rồi bấm "Màn tiếp theo": thẻ trượt xuống, mảnh tan thành bụi bay vào tâm, khung lật sáng về kính, màn 1-2 hiện bóng mục tiêu, khay và HUD. Khung bia không chạy lại.
- Play → Bản đồ (nút Menu → Chọn màn): HUD rút, khay hạ, bia co rồi tan.
- Chạm giữa chừng mỗi tuyến: lên ngay trạng thái cuối, và kéo được mảnh bình thường ngay sau đó.
- Bật Giảm chuyển động trong Cài đặt: mọi tuyến chỉ còn mờ chéo.

- [ ] **Step 9: Changelog và commit**

```markdown
### 2026-10-03 - Choreograph the play scene (F1 task 9)

- Split the board into base, grid and top layers centred on (360, 600), made the four cardinal runes visible above the grid (previously hidden under the board surface), added per-placement target reveal and a gold-frame toggle to `BoardRenderer`, and exposed animatable HUD and target-badge parts.
- Added `game-next/src/presentation/transitions/playChoreography.ts`: board rise (from the tapped node on the map route), radial grid reveal, staggered runes and targets with a glint sweep, camera breath, tray and HUD entry; next-level stardust implosion and frame flash; leave-to-map/menu collapse. Celestial rings stop under reduced motion.
- Verification: `tests/boardRendererReveal.test.ts` failed for the missing method, then passed; `tests/boardRendererLayers.test.ts` unchanged and passing; `npm run typecheck` and `npm test` passed; manual dev-server check of all play routes, tap-to-skip and reduced motion.
```

```bash
git add game-next/src game-next/tests/boardRendererReveal.test.ts CHANGELOG.md
git commit -m "feat(motion): choreograph play scene transitions"
```

---

### Task 10: Kiểm tra cuối và tài liệu

**Files:**
- Modify: `game-next/README.md` (mục mô tả chuyển cảnh)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Chạy đủ bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: tất cả PASS. Vite vẫn có thể báo chunk lớn, đây là cảnh báo cũ.

- [ ] **Step 2: Đối chiếu spec**

Đi qua bảng sau. Mục nào không đạt thì quay lại task tương ứng.

| Spec F1 | Kiểm |
|---|---|
| 2.1 Một bầu trời, mood đổi dần | Không scene nào ngoài `BackgroundScene` tạo `SkyBackdrop` (`grep -rn "new SkyBackdrop" src` chỉ ra 1 dòng) |
| 2.2 Lối duy nhất | `tests/sceneStartGate.test.ts` xanh |
| 2.5 Giảm chuyển động lưu được | Bật, tải lại trang, mở Cài đặt: nút vẫn bật; chuyển cảnh là mờ chéo |
| 2.6 Back và xuống nền | Test director xanh; trên thiết bị, kiểm ở plan F3 |
| 3.1–3.5 bảy tuyến | `tests/transitionRoutes.test.ts` xanh, và kiểm bằng mắt ở Task 7–9 |
| 3.6 Chạm bỏ qua | Kiểm bằng mắt ở Task 9 Step 8 |

- [ ] **Step 3: Cập nhật README**

Trong `game-next/README.md`, thêm một đoạn ngắn dưới phần mô tả cấu trúc:

```markdown
### Chuyển cảnh

Mọi lần đổi scene đi qua `director.go(...)` trong `src/presentation/transitions/SceneDirector.ts`; không gọi `scene.start` trực tiếp (test `sceneStartGate` chặn). Mỗi scene cài `playIn`/`playOut`; bảng bước của từng tuyến ở `transitions/routes.ts`. Bầu trời thuộc `BackgroundScene`.
```

- [ ] **Step 4: Changelog và commit**

```markdown
### 2026-10-03 - Complete F1 scene transitions

- Documented the transition entry point in `game-next/README.md`.
- Verification: `npm run typecheck`, `npm test`, `npm run content:validate` and `npm run build` passed; spec F1 sections 2–3 cross-checked. Device acceptance is tracked by plan F3.
```

```bash
git add game-next/README.md CHANGELOG.md
git commit -m "docs(motion): document scene transition entry point"
```

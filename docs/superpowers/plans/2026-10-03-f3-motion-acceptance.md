# F3 — Nghiệm thu chuyển động: công cụ đo, ma trận kiểm tra và hồ sơ duyệt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng bộ công cụ chỉ dùng ở dev để xem, chạy lại và đo từng chuyển cảnh (F1) và hiệu ứng trong màn (F2). Thêm màn fixture có xoay, và lập hai hồ sơ nghiệm thu `pending` có số đo desktop để người duyệt kiểm trên thiết bị.

**Architecture:**
- Phần tính toán là TypeScript thuần, test bằng vitest: `perfStats` (p50/p95/max), `PerfRecorder` (cửa sổ đo), `resolveDevTools` (đọc tham số URL), `autosolveScripts` (kịch bản pointer giả), `demoPlan` (tuyến demo) và `makeRotationFixture`.
- Phần Phaser và DOM chỉ là lớp nối:
  - overlay DOM cho `fps=1`;
  - bộ hệ số tốc độ cho `motion`;
  - `DemoRunner` cho `demo` và `loop`;
  - một listener `step` đưa thời gian khung vào `PerfRecorder`.
- F1 và F2 phát sự kiện mở/đóng cửa sổ qua một kiểu chung `MotionWindowEvent`. Đây là hook nhỏ trên module F1 và F2, định nghĩa ở Task 4.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Phaser 3.90, Vite 6 (`import.meta.env`), Capacitor 8.

**Spec:** `docs/superpowers/specs/2026-10-03-f3-motion-acceptance-design.md`

**Giao được gì:**
- Đường dẫn dev ở spec F3 mục 2 chạy được.
- `VITE_MOTION_TOOLS=1 npm run android:sync` cho ra bản APK nghiệm thu có công cụ đo.
- Có `docs/testing/motion/{README,f1-acceptance,f2-acceptance}.md` với phần A và D đã điền, trạng thái `pending`.

## Vị trí trong loạt plan

- **Nhánh:** `feat/motion-f3`, tách từ `feat/motion-f2`.
- **Chạy sau:** plan F1 (`2026-10-03-f1-scene-transitions.md`) và plan F2 (`2026-10-03-f2-in-level-game-feel.md`).
- **Dùng từ F1:** `director` với `go`, `boot`, `skip`, `isTransitioning`; `TransitionTimeline`; `TRANSITION_TOKENS`; `RouteId`; `setMotionScale`; `resolveLaunch`.
- **Dùng từ F2** (tên theo spec F2 mục 2 và 6): `feedbackEvents(prev, transition, level, subject: FeedbackSubject)` trong `src/presentation/feedback/feedbackEvents.ts`, `FeedbackDirector` trong `src/presentation/feedback/FeedbackDirector.ts`, `PieceTextureCache` trong `src/presentation/PieceTextureCache.ts`. Task 4 thêm hook lên hai module sau. **Trước Task 4, đối chiếu tên với plan F2 đã merge.** Nếu F2 đặt tên khác thì giữ tên của F2 và sửa lại các chỗ dùng trong plan này.
- **Giả định về F2:** `PlayScene.update(_time, delta)` chuyển đúng một biến `delta` cho mọi tick của F2 (`boardRenderer.tick`, timeline của `FeedbackDirector`). Task 6 nhân `delta` với hệ số dev tại đúng dòng đó.

## Global Constraints

- Thư mục làm việc: `game-next/`. Node `>=24.13.1 <25`. Mọi lệnh `npm` và `npx` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`**. Kiểu chỉ import bằng `import type`. Không `enum`, không `namespace`, không parameter property.
- Comment và chuỗi hiển thị viết tiếng Việt theo văn phong file hiện có. Tên biến và hàm viết tiếng Anh.
- File logic thuần (`perfStats.ts`, `PerfRecorder.ts`, `motionWindow.ts`, `devTools.ts`, `autosolveScripts.ts`, `demoPlan.ts`) **không import runtime từ `phaser`**.
- Công cụ dev bật khi `import.meta.env.DEV === true` **hoặc** `import.meta.env.VITE_MOTION_TOOLS === '1'`. Bản build thường (không có cờ) bỏ qua `fps`, `motion`, `demo`, `loop`, `autosolve`, `perf`, `level=fixture-rotate`, và cả `mode=harness` như hiện nay.
- `motion` kẹp trong `[0, 4]`. `0` tương đương Giảm chuyển động nhưng không ghi vào bản lưu.
- Kịch bản `autosolve`: `win`, `drag`, `snap`, `return`, `rotate`, `rotate-blocked`, `overlap-hollow`, `overlap-revive`, `reset`. Các bước cách nhau 400 ms.
- `level=fixture-rotate` chỉ tải được ở mode `harness` khi bật công cụ dev, và không có trong `campaignManifest`.
- Ngưỡng hiệu năng (spec F3 mục 3):
  - P-01, P-02, P-03: p95 ≤ 18.2 ms.
  - P-04: khung dài nhất ≤ 50 ms.
  - P-05: không quá 3 khung trên 20 ms mỗi cửa sổ.
  - P-06: texture mảnh ≤ 24 MB.
  - P-07: 0 lần gọi `evaluate` khi kéo trong cùng ô.
- Biên đếm: `over20Ms` đếm khung `> 20` (20 không tính, 20.01 có tính); `over50Ms` đếm khung `> 50`.
- Percentile dùng **nearest-rank**: sắp tăng dần, lấy phần tử thứ `ceil(p/100 × n)`, đánh số từ 1.
- Dòng JSON đo: `{ window, frames, p50Ms, p95Ms, maxMs, over20Ms, over50Ms, durationMs }`. Các trường ms làm tròn 1 chữ số thập phân, `durationMs` làm tròn tới số nguyên.
- Sau plan này, `scene.start(` vẫn chỉ xuất hiện trong `src/presentation/transitions/SceneDirector.ts` (test `sceneStartGate` của F1).
- Mỗi commit thêm một mục vào đầu `## Unreleased` trong `CHANGELOG.md`, viết tiếng Anh theo mẫu mục hiện có.
- Kiểm tra trước mỗi commit: `npm run typecheck` và `npm test`.

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/presentation/transitions/motionWindow.ts` | Kiểu `MotionWindowEvent` và `MotionWindowEmitter` dùng chung cho F1, F2, F3 |
| `src/presentation/dev/perfStats.ts` | `perfStats`, `formatPerfLine`, `rollingP95` (thuần) |
| `src/presentation/dev/PerfRecorder.ts` | Cửa sổ đo lồng nhau, gom thời gian khung, xuất dòng JSON (thuần) |
| `src/presentation/dev/devTools.ts` | Kiểu `DevTools`, `AUTOSOLVE_SCRIPTS`, trạng thái dùng chung `getDevTools` và `setDevTools` (thuần) |
| `src/launchParams.ts` | Thêm `devToolsEnabled`, `resolveDevTools` |
| `src/vite-env.d.ts` | Khai kiểu `VITE_MOTION_TOOLS`, `window.__motionPerf` |
| `src/content/fixtures.ts` | `makeRotationFixture`, `ROTATION_FIXTURE_ID` |
| `src/content/catalog.ts` | `loadLevel(id, mode, options?)` nạp fixture khi `devFixtures` |
| `src/presentation/Hud.ts` | Nút Xoay hiện theo `rotationEnabled` thay vì số chương đọc từ id |
| `src/presentation/transitions/SceneDirector.ts` | Hook: `onWindow`, `setTimeScale` |
| `src/presentation/feedback/FeedbackDirector.ts` | Hook: `onWindow` (module F2) |
| `src/presentation/PieceTextureCache.ts` | Hook: `livePieceTextureBytes()` (module F2) |
| `src/presentation/dev/autosolveScripts.ts` | Dựng kịch bản pointer giả cho từng tên (thuần) |
| `src/presentation/dev/demoPlan.ts` | Cảnh nguồn, cảnh đích và dữ liệu của từng tuyến demo (thuần) |
| `src/presentation/dev/DemoRunner.ts` | Chạy `demo` và `loop` qua `director` |
| `src/presentation/dev/PerfOverlay.ts` | Overlay DOM cho `fps=1` |
| `src/presentation/dev/devTimeScale.ts` | Hệ số tốc độ dev cho tween, time, director và tick của F2 |
| `src/presentation/PlayScene.ts` | Nạp fixture, chạy kịch bản qua `input.emit`, cửa sổ `drag`, nhân `delta` |
| `src/presentation/LevelSelectScene.ts` | `demoOrigin()` |
| `src/main.ts` | Nối công cụ dev |
| `docs/testing/motion/{README,f1-acceptance,f2-acceptance}.md` | Hồ sơ nghiệm thu |

---

### Task 1: Thống kê khung hình và bộ ghi cửa sổ đo

**Files:**
- Create: `game-next/src/presentation/transitions/motionWindow.ts`
- Create: `game-next/src/presentation/dev/perfStats.ts`
- Create: `game-next/src/presentation/dev/PerfRecorder.ts`
- Test: `game-next/tests/perfStats.test.ts`, `game-next/tests/perfRecorder.test.ts`

**Interfaces:**
- Produces (`motionWindow.ts`):
  - `type MotionWindowEvent = { phase: 'start' | 'end'; window: string }`
  - `type MotionWindowListener = (event: MotionWindowEvent) => void`
  - `class MotionWindowEmitter`:
    - `on(listener): () => void` (trả hàm huỷ đăng ký)
    - `emit(event): void`
    - `open(window: string): { end(): void }` (phát `start` ngay; `end()` phát `end` đúng một lần)
- Produces (`perfStats.ts`):
  - `type PerfStats = { frames: number; p50Ms: number; p95Ms: number; maxMs: number; over20Ms: number; over50Ms: number; durationMs: number }`
  - `type PerfLine = { window: string } & PerfStats`
  - `perfStats(frameMs: readonly number[]): PerfStats`
  - `formatPerfLine(window: string, stats: PerfStats): PerfLine` (làm tròn)
  - `rollingP95(samples: ReadonlyArray<{ atMs: number; frameMs: number }>, nowMs: number, windowMs: number): number`
- Produces (`PerfRecorder.ts`):
  - `class PerfRecorder`: `constructor(sink: (line: PerfLine) => void)`, `begin(window)`, `end(window)`, `frame(deltaMs)`, `listen(event: MotionWindowEvent)`, `readonly lines: PerfLine[]`

- [ ] **Step 1: Viết test thất bại cho `perfStats`**

`game-next/tests/perfStats.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { formatPerfLine, perfStats, rollingP95 } from '../src/presentation/dev/perfStats.ts';

describe('perfStats', () => {
  test('nearest-rank trên mảng đã biết', () => {
    const s = perfStats([10, 20, 30, 40]);
    expect(s).toEqual({
      frames: 4, p50Ms: 20, p95Ms: 40, maxMs: 40, over20Ms: 2, over50Ms: 0, durationMs: 100,
    });
  });

  test('không phụ thuộc thứ tự đầu vào', () => {
    expect(perfStats([40, 10, 30, 20])).toEqual(perfStats([10, 20, 30, 40]));
  });

  test('p95 trên 20 khung là khung thứ 19', () => {
    const frames = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(perfStats(frames).p95Ms).toBe(19);
  });

  test('biên: 20 ms không tính, 20.01 ms có tính; 50 tương tự', () => {
    const s = perfStats([20, 20.01, 50, 50.01]);
    expect(s.over20Ms).toBe(3);
    expect(s.over50Ms).toBe(1);
  });

  test('mảng rỗng trả 0, không ném lỗi', () => {
    expect(perfStats([])).toEqual({
      frames: 0, p50Ms: 0, p95Ms: 0, maxMs: 0, over20Ms: 0, over50Ms: 0, durationMs: 0,
    });
  });

  test('formatPerfLine làm tròn 1 chữ số, durationMs làm tròn số nguyên, window đứng đầu', () => {
    const line = formatPerfLine('menu-to-play', perfStats([16.66, 17.94, 31.17]));
    expect(line).toEqual({
      window: 'menu-to-play', frames: 3, p50Ms: 17.9, p95Ms: 31.2, maxMs: 31.2,
      over20Ms: 1, over50Ms: 0, durationMs: 66,
    });
    expect(Object.keys(line)[0]).toBe('window');
  });
});

describe('rollingP95', () => {
  test('chỉ tính mẫu trong cửa sổ gần nhất', () => {
    const samples = [
      { atMs: 0, frameMs: 100 },
      { atMs: 1500, frameMs: 10 },
      { atMs: 2500, frameMs: 20 },
    ];
    expect(rollingP95(samples, 3000, 2000)).toBe(20);
    expect(rollingP95([], 3000, 2000)).toBe(0);
  });
});
```

- [ ] **Step 2: Viết test thất bại cho `PerfRecorder` và `MotionWindowEmitter`**

`game-next/tests/perfRecorder.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { PerfRecorder } from '../src/presentation/dev/PerfRecorder.ts';
import type { PerfLine } from '../src/presentation/dev/perfStats.ts';
import { MotionWindowEmitter } from '../src/presentation/transitions/motionWindow.ts';

describe('PerfRecorder', () => {
  test('cửa sổ lồng nhau gom khung riêng, end xuất đúng một dòng', () => {
    const out: PerfLine[] = [];
    const rec = new PerfRecorder((line) => out.push(line));
    rec.begin('menu-to-play');
    rec.frame(16);
    rec.begin('snap');
    rec.frame(18);
    rec.end('snap');
    rec.frame(40);
    rec.end('menu-to-play');
    rec.end('menu-to-play'); // không mở thì bỏ qua
    expect(out.map((l) => [l.window, l.frames, l.maxMs])).toEqual([
      ['snap', 1, 18],
      ['menu-to-play', 3, 40],
    ]);
    expect(rec.lines).toEqual(out);
  });

  test('frame ngoài cửa sổ không được ghi', () => {
    const out: PerfLine[] = [];
    const rec = new PerfRecorder((line) => out.push(line));
    rec.frame(99);
    rec.begin('won');
    rec.end('won');
    expect(out[0].frames).toBe(0);
  });

  test('listen ánh xạ start/end sang begin/end', () => {
    const out: PerfLine[] = [];
    const rec = new PerfRecorder((line) => out.push(line));
    rec.listen({ phase: 'start', window: 'drag' });
    rec.frame(16);
    rec.listen({ phase: 'end', window: 'drag' });
    expect(out).toHaveLength(1);
  });
});

describe('MotionWindowEmitter', () => {
  test('open phát start ngay, end đúng một lần; huỷ đăng ký thì thôi nhận', () => {
    const seen: string[] = [];
    const emitter = new MotionWindowEmitter();
    const off = emitter.on((e) => seen.push(`${e.phase}:${e.window}`));
    const w = emitter.open('snap');
    w.end();
    w.end();
    off();
    emitter.emit({ phase: 'start', window: 'x' });
    expect(seen).toEqual(['start:snap', 'end:snap']);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/perfStats.test.ts tests/perfRecorder.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 4: Viết `motionWindow.ts`**

`game-next/src/presentation/transitions/motionWindow.ts`:

```ts
/**
 * Cửa sổ hiệu ứng: khoảng từ lúc một chuyển cảnh hoặc hiệu ứng bắt đầu tới khi
 * tween cuối của nó xong. SceneDirector và FeedbackDirector phát sự kiện này;
 * công cụ đo của F3 nghe để biết khung nào thuộc cửa sổ nào.
 */
export type MotionWindowEvent = { phase: 'start' | 'end'; window: string };

export type MotionWindowListener = (event: MotionWindowEvent) => void;

export class MotionWindowEmitter {
  private listeners: MotionWindowListener[] = [];

  on(listener: MotionWindowListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: MotionWindowEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }

  /** Phát `start` ngay; `end()` phát `end` đúng một lần dù gọi nhiều lần. */
  open(window: string): { end(): void } {
    this.emit({ phase: 'start', window });
    let ended = false;
    return {
      end: () => {
        if (ended) return;
        ended = true;
        this.emit({ phase: 'end', window });
      },
    };
  }
}
```

- [ ] **Step 5: Viết `perfStats.ts`**

`game-next/src/presentation/dev/perfStats.ts`:

```ts
export type PerfStats = {
  frames: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  over20Ms: number;
  over50Ms: number;
  durationMs: number;
};

export type PerfLine = { window: string } & PerfStats;

/** Nearest-rank: phần tử thứ ceil(p/100 × n), đánh số từ 1, của mảng đã sắp. */
function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

export function perfStats(frameMs: readonly number[]): PerfStats {
  const sorted = [...frameMs].sort((a, b) => a - b);
  return {
    frames: sorted.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted.length ? sorted[sorted.length - 1] : 0,
    over20Ms: sorted.filter((f) => f > 20).length,
    over50Ms: sorted.filter((f) => f > 50).length,
    durationMs: sorted.reduce((sum, f) => sum + f, 0),
  };
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Dòng JSON đúng mẫu spec F3 mục 2: window đứng đầu, ms một chữ số thập phân. */
export function formatPerfLine(window: string, stats: PerfStats): PerfLine {
  return {
    window,
    frames: stats.frames,
    p50Ms: round1(stats.p50Ms),
    p95Ms: round1(stats.p95Ms),
    maxMs: round1(stats.maxMs),
    over20Ms: stats.over20Ms,
    over50Ms: stats.over50Ms,
    durationMs: Math.round(stats.durationMs),
  };
}

/** p95 thời gian khung trong `windowMs` gần nhất, cho overlay `fps=1`. */
export function rollingP95(
  samples: ReadonlyArray<{ atMs: number; frameMs: number }>,
  nowMs: number,
  windowMs: number
): number {
  const recent = samples.filter((s) => nowMs - s.atMs <= windowMs).map((s) => s.frameMs);
  return perfStats(recent).p95Ms;
}
```

- [ ] **Step 6: Viết `PerfRecorder.ts`**

`game-next/src/presentation/dev/PerfRecorder.ts`:

```ts
import type { MotionWindowEvent } from '../transitions/motionWindow.ts';
import { formatPerfLine, perfStats } from './perfStats.ts';
import type { PerfLine } from './perfStats.ts';

/**
 * Gom thời gian khung theo cửa sổ. Nhiều cửa sổ có thể mở cùng lúc (chuyển
 * cảnh và hiệu ứng snap chồng nhau): mỗi khung được ghi vào mọi cửa sổ đang mở.
 */
export class PerfRecorder {
  readonly lines: PerfLine[] = [];
  private readonly sink: (line: PerfLine) => void;
  private open: Array<{ window: string; frames: number[] }> = [];

  constructor(sink: (line: PerfLine) => void) {
    this.sink = sink;
  }

  begin(window: string): void {
    this.open.push({ window, frames: [] });
  }

  /** Đóng cửa sổ cùng tên mở gần nhất; không có thì bỏ qua. */
  end(window: string): void {
    let index = -1;
    for (let i = this.open.length - 1; i >= 0; i--) {
      if (this.open[i].window === window) {
        index = i;
        break;
      }
    }
    if (index < 0) return;
    const [closed] = this.open.splice(index, 1);
    const line = formatPerfLine(closed.window, perfStats(closed.frames));
    this.lines.push(line);
    this.sink(line);
  }

  frame(deltaMs: number): void {
    for (const w of this.open) w.frames.push(deltaMs);
  }

  listen(event: MotionWindowEvent): void {
    if (event.phase === 'start') this.begin(event.window);
    else this.end(event.window);
  }
}
```

- [ ] **Step 7: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/perfStats.test.ts tests/perfRecorder.test.ts`
Expected: PASS. Kiểm tay ví dụ `formatPerfLine`: sắp xếp ra `[16.66, 17.94, 31.17]`; p50 là phần tử thứ `ceil(1.5) = 2`, tức 17.94 → 17.9; p95 là phần tử thứ `ceil(2.85) = 3`, tức 31.17 → 31.2; tổng 65.77 → 66.

- [ ] **Step 8: Changelog và commit**

Run: `npm run typecheck && npm test`

```markdown
### 2026-10-03 - Add frame statistics and motion windows (F3 task 1)

- Added `game-next/src/presentation/transitions/motionWindow.ts` (shared start/end window events), `dev/perfStats.ts` (nearest-rank p50/p95, max, >20 ms and >50 ms counts, rolling p95) and `dev/PerfRecorder.ts` (nested measurement windows emitting the JSON line defined in spec F3).
- Verification: `tests/perfStats.test.ts` and `tests/perfRecorder.test.ts` failed for the missing modules, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/transitions/motionWindow.ts game-next/src/presentation/dev/perfStats.ts game-next/src/presentation/dev/PerfRecorder.ts game-next/tests/perfStats.test.ts game-next/tests/perfRecorder.test.ts CHANGELOG.md
git commit -m "feat(dev): add frame statistics and motion window recorder"
```

---

### Task 2: Đọc tham số dev và cờ `VITE_MOTION_TOOLS`

**Files:**
- Create: `game-next/src/presentation/dev/devTools.ts`
- Modify: `game-next/src/launchParams.ts`
- Modify: `game-next/src/vite-env.d.ts`
- Test: `game-next/tests/launchParams.test.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `RouteId`, `TRANSITION_TOKENS` (F1).
- Produces (`devTools.ts`):
  - `AUTOSOLVE_SCRIPTS` (tuple 9 tên), `type AutosolveScript = typeof AUTOSOLVE_SCRIPTS[number]`
  - `type DevTools = { enabled: boolean; fps: boolean; perf: boolean; motion: number | null; demo: RouteId | null; loop: boolean; autosolve: AutosolveScript | null }`
  - `DEV_TOOLS_OFF: DevTools`, `getDevTools(): DevTools`, `setDevTools(tools: DevTools): void`
- Produces (`launchParams.ts`):
  - `devToolsEnabled(env: { DEV?: boolean; VITE_MOTION_TOOLS?: string }): boolean`
  - `resolveDevTools(search: string, enabled: boolean): DevTools`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `game-next/tests/launchParams.test.ts`. Đổi dòng import đầu file thành `import { devToolsEnabled, resolveDevTools, resolveLaunch } from '../src/launchParams.ts';` và thêm `import { DEV_TOOLS_OFF } from '../src/presentation/dev/devTools.ts';`.

```ts
describe('devToolsEnabled', () => {
  test('bật ở dev hoặc khi VITE_MOTION_TOOLS=1, tắt ở build thường', () => {
    expect(devToolsEnabled({ DEV: true })).toBe(true);
    expect(devToolsEnabled({ DEV: false, VITE_MOTION_TOOLS: '1' })).toBe(true);
    expect(devToolsEnabled({ DEV: false })).toBe(false);
    expect(devToolsEnabled({ DEV: false, VITE_MOTION_TOOLS: 'true' })).toBe(false);
  });
});

describe('resolveDevTools', () => {
  const all = '?fps=1&perf=1&motion=0.25&demo=menu-to-play&loop=1&autosolve=rotate-blocked';

  test('đọc đủ sáu tham số khi bật', () => {
    expect(resolveDevTools(all, true)).toEqual({
      enabled: true, fps: true, perf: true, motion: 0.25, demo: 'menu-to-play', loop: true,
      autosolve: 'rotate-blocked',
    });
  });

  test('build thường bỏ qua mọi tham số (R-04)', () => {
    expect(resolveDevTools(all, false)).toEqual(DEV_TOOLS_OFF);
    expect(DEV_TOOLS_OFF.enabled).toBe(false);
  });

  test('motion kẹp về [0, 4]; giá trị không phải số thì bỏ', () => {
    expect(resolveDevTools('?motion=9', true).motion).toBe(4);
    expect(resolveDevTools('?motion=-1', true).motion).toBe(0);
    expect(resolveDevTools('?motion=abc', true).motion).toBeNull();
    expect(resolveDevTools('', true).motion).toBeNull();
  });

  test('demo và autosolve lạ thì bỏ; loop chỉ có nghĩa cùng demo', () => {
    const t = resolveDevTools('?demo=nowhere&autosolve=fly&loop=1', true);
    expect(t.demo).toBeNull();
    expect(t.autosolve).toBeNull();
    expect(t.loop).toBe(false);
  });

  test('chín kịch bản autosolve đều nhận', () => {
    for (const name of ['win', 'drag', 'snap', 'return', 'rotate', 'rotate-blocked', 'overlap-hollow', 'overlap-revive', 'reset']) {
      expect(resolveDevTools(`?autosolve=${name}`, true).autosolve).toBe(name);
    }
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/launchParams.test.ts`
Expected: FAIL. `devToolsEnabled` và `resolveDevTools` chưa được export, và module `devTools.ts` chưa có.

- [ ] **Step 3: Viết `devTools.ts`**

`game-next/src/presentation/dev/devTools.ts`:

```ts
import type { RouteId } from '../transitions/motion.ts';

export const AUTOSOLVE_SCRIPTS = [
  'win',
  'drag',
  'snap',
  'return',
  'rotate',
  'rotate-blocked',
  'overlap-hollow',
  'overlap-revive',
  'reset',
] as const;

export type AutosolveScript = (typeof AUTOSOLVE_SCRIPTS)[number];

export type DevTools = {
  /** true khi DEV hoặc VITE_MOTION_TOOLS=1; mọi công cụ dưới đây chỉ có nghĩa khi bật */
  enabled: boolean;
  fps: boolean;
  perf: boolean;
  /** Hệ số tốc độ [0, 4]; 0 là Giảm chuyển động không lưu; null là không đổi */
  motion: number | null;
  demo: RouteId | null;
  loop: boolean;
  autosolve: AutosolveScript | null;
};

export const DEV_TOOLS_OFF: DevTools = {
  enabled: false,
  fps: false,
  perf: false,
  motion: null,
  demo: null,
  loop: false,
  autosolve: null,
};

let current: DevTools = DEV_TOOLS_OFF;

/** main.ts đặt một lần lúc khởi động; scene đọc qua getDevTools(). */
export function setDevTools(tools: DevTools): void {
  current = tools;
}

export function getDevTools(): DevTools {
  return current;
}
```

- [ ] **Step 4: Mở rộng `launchParams.ts`**

Thêm vào cuối `game-next/src/launchParams.ts`:

```ts
import { TRANSITION_TOKENS } from './presentation/designTokens.ts';
import type { RouteId } from './presentation/transitions/motion.ts';
import { AUTOSOLVE_SCRIPTS, DEV_TOOLS_OFF } from './presentation/dev/devTools.ts';
import type { AutosolveScript, DevTools } from './presentation/dev/devTools.ts';

/**
 * Công cụ đo của F3 bật ở dev server, hoặc ở bản build nghiệm thu được dựng
 * với `VITE_MOTION_TOOLS=1` (APK debug chạy trên máy chuẩn có DEV = false).
 */
export function devToolsEnabled(env: { DEV?: boolean; VITE_MOTION_TOOLS?: string }): boolean {
  return env.DEV === true || env.VITE_MOTION_TOOLS === '1';
}

export function resolveDevTools(search: string, enabled: boolean): DevTools {
  if (!enabled) return DEV_TOOLS_OFF;
  const params = new URLSearchParams(search);

  const rawMotion = params.get('motion');
  const motionNumber = rawMotion === null || rawMotion.trim() === '' ? Number.NaN : Number(rawMotion);
  const motion = Number.isFinite(motionNumber) ? Math.min(4, Math.max(0, motionNumber)) : null;

  const rawDemo = params.get('demo');
  const demo = rawDemo !== null && rawDemo in TRANSITION_TOKENS.routes ? (rawDemo as RouteId) : null;

  const rawScript = params.get('autosolve');
  const autosolve = (AUTOSOLVE_SCRIPTS as readonly string[]).includes(rawScript ?? '')
    ? (rawScript as AutosolveScript)
    : null;

  return {
    enabled: true,
    fps: params.get('fps') === '1',
    perf: params.get('perf') === '1',
    motion,
    demo,
    loop: demo !== null && params.get('loop') === '1',
    autosolve,
  };
}
```

Đưa ba dòng `import` lên đầu file theo quy ước, trên `export type LaunchTarget`.

- [ ] **Step 5: Khai kiểu trong `vite-env.d.ts`**

Thay toàn bộ `game-next/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" khi build APK nghiệm thu F3: bật công cụ đo ngoài dev server */
  readonly VITE_MOTION_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Các dòng đo của `perf=1`, đọc qua chrome://inspect trên thiết bị */
  __motionPerf?: Array<import('./presentation/dev/perfStats.ts').PerfLine>;
}
```

- [ ] **Step 6: Chạy test, typecheck**

Run: `npx vitest run tests/launchParams.test.ts && npm run typecheck && npm test`
Expected: PASS. Các test cũ của `resolveLaunch` không đổi.

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Parse F3 developer tools from the URL (F3 task 2)

- Added `game-next/src/presentation/dev/devTools.ts` (tool flags, the nine autosolve scripts, shared state) and `devToolsEnabled`/`resolveDevTools` in `launchParams.ts`; tools are active on the dev server or in builds made with `VITE_MOTION_TOOLS=1`, and normal builds ignore every tool parameter.
- Declared `VITE_MOTION_TOOLS` and `window.__motionPerf` in `vite-env.d.ts`.
- Verification: new `launchParams` tests failed for the missing exports, then passed; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/dev/devTools.ts game-next/src/launchParams.ts game-next/src/vite-env.d.ts game-next/tests/launchParams.test.ts CHANGELOG.md
git commit -m "feat(dev): parse motion tool parameters behind dev or build flag"
```

---

### Task 3: Màn fixture có xoay `fixture-rotate`

**Files:**
- Modify: `game-next/src/content/fixtures.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/presentation/Hud.ts` (tham số `rotationEnabled`)
- Modify: `game-next/src/presentation/PlayScene.ts` (truyền `devFixtures` và `rotationEnabled`)
- Test: `game-next/tests/content.test.ts` (thêm `describe`), `game-next/tests/catalog.test.ts` (thêm test)

**Interfaces:**
- Produces:
  - `ROTATION_FIXTURE_ID = 'fixture-rotate'`
  - `makeRotationFixture(): LevelDocument`
  - `loadLevel(id: string, mode: 'campaign' | 'harness', options?: { devFixtures?: boolean }): Level`
  - `new Hud(scene, title, callbacks, levelId, rotationEnabled?: boolean)`. Khi bỏ trống, giữ quy tắc cũ (chương ≥ 3).

**Thiết kế fixture** (đã kiểm với `shapes.ts`, `geometry.ts`, `session.ts` và `validate.ts`):

Validator chặn `rotationEnabled` ở Chương 1 và 2 (`chapter-rotation-disabled`), nên fixture là **Chương 3**. Ba mảnh, khung 32:

| Mảnh | Hình | Neo | Vai trò |
|---|---|---|---|
| `T1` | `triangle` hướng 0 | `A (16, 48)` nghiệm, `E (97, 48)` sát mép phải | `rotate-blocked` ở `E` |
| `T2` | `triangle` hướng 0 | `A (64, 48)` nghiệm, `O (16, 48)` trùng `T1.A` | `rotate` ở `A`; `overlap-hollow` khi cùng `T1.A` |
| `S1` | `square` | `A (16, 96)` nghiệm, `O (16, 48)` | `overlap-revive` (3 lớp) khi cùng `T1.A` và `T2.O` |

Vì sao `E` bị chặn khi xoay:
- Tam giác hướng 0 có đỉnh `(0,0) (32,0) (0,32)`. Cạnh huyền có pháp tuyến hướng về gốc nên không được giữ biên (`inclusive = false`), do đó chỉ giữ ô có `x + y ≤ 30`. Cột `x = 31` trống, ô xa nhất về bên phải là `x = 30`.
- Ở `E`, ô xa nhất nằm tại `97 + 30 = 127`, vẫn trong bàn (`fitsBoard` đạt).
- `rotateCells` 1 nấc đổi `(x, y)` thành `(31 − y, x)`. Ô `(0, 0)` thành `(31, 0)`, nằm tại `97 + 31 = 128` ngoài bàn, nên `applyCommand` trả `out-of-bounds`.

`T2` ở `A (64, 48)` xoay được, vì khung `64..95` nằm gọn trong bàn. Ba vị trí nghiệm không chồng nhau, nên mục tiêu là hợp ba hình.

Vì sao Hud cần sửa: `Hud` hiện quyết định hiện nút Xoay bằng số chương tách từ id màn (`parseInt('fixture-rotate')` ra `NaN`, rơi về Chương 1), nên nút bị ẩn. Thêm tham số `rotationEnabled` và để `PlayScene` truyền `level.rotationEnabled`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `game-next/tests/content.test.ts`. Import thêm `makeRotationFixture`, `ROTATION_FIXTURE_ID` từ `../src/content/fixtures.ts`; `applyCommand`, `createPuzzle` từ `../src/domain/session.ts`; `fitsBoard`, `rotateCells` từ `../src/domain/geometry.ts`.

```ts
describe('Fixture xoay chỉ dùng ở dev', () => {
  test('qua validator, Chương 3, có xoay, ba mảnh khung 32', () => {
    const result = validateLevel(makeRotationFixture());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.level.id).toBe(ROTATION_FIXTURE_ID);
    expect(result.level.chapter).toBe(3);
    expect(result.level.rotationEnabled).toBe(true);
    expect(result.level.pieces.map((p) => [p.id, p.frameSize])).toEqual([['T1', 32], ['T2', 32], ['S1', 32]]);
  });

  test('neo E của T1 vừa bàn ở hướng 0 nhưng xoay một nấc thì ra ngoài', () => {
    const doc = makeRotationFixture();
    const t1 = doc.pieces.find((p) => p.id === 'T1')!;
    const e = t1.anchors.find((a) => a.id === 'E')!;
    expect(fitsBoard(t1.cells, e.x, e.y)).toBe(true);
    expect(fitsBoard(rotateCells(t1.cells, t1.frameSize, 1), e.x, e.y)).toBe(false);
  });

  test('applyCommand xoay T1 ở E trả out-of-bounds; xoay T2 ở A thì được', () => {
    const result = validateLevel(makeRotationFixture());
    if (!result.ok) throw new Error('fixture invalid');
    const level = result.level;
    let state = createPuzzle(level);
    state = applyCommand(level, state, { type: 'drop', pieceId: 'T1', x: 97, y: 48 }).state;
    expect(state.pieces.T1).toEqual({ kind: 'snapped', anchorId: 'E', turns: 0 });
    const blocked = applyCommand(level, state, { type: 'rotate', pieceId: 'T1' });
    expect(blocked.accepted).toBe(false);
    expect(blocked.outcome).toBe('out-of-bounds');

    state = applyCommand(level, state, { type: 'drop', pieceId: 'T2', x: 64, y: 48 }).state;
    const turned = applyCommand(level, state, { type: 'rotate', pieceId: 'T2' });
    expect(turned.accepted).toBe(true);
    expect(turned.outcome).toBe('rotated');
  });

  test('T1.A, T2.O, S1.O có ô chung: giao 2 lớp và 3 lớp', () => {
    const doc = makeRotationFixture();
    const at = (pieceId: string, anchorId: string) => {
      const p = doc.pieces.find((x) => x.id === pieceId)!;
      const a = p.anchors.find((x) => x.id === anchorId)!;
      return new Set(p.cells.map(([x, y]) => `${x + a.x},${y + a.y}`));
    };
    const t1 = at('T1', 'A');
    const t2 = at('T2', 'O');
    const s1 = at('S1', 'O');
    const both = [...t1].filter((k) => t2.has(k));
    expect(both.length).toBe(t1.size);
    expect(both.filter((k) => s1.has(k)).length).toBeGreaterThan(0);
  });
});
```

Thêm vào `game-next/tests/catalog.test.ts` (import `loadLevel` nếu file chưa có):

```ts
test('fixture-rotate chỉ tải ở harness khi bật công cụ dev (R-04)', () => {
  expect(() => loadLevel('fixture-rotate', 'harness')).toThrow('unavailable:fixture-rotate');
  expect(() => loadLevel('fixture-rotate', 'campaign', { devFixtures: true })).toThrow('unavailable:fixture-rotate');
  expect(loadLevel('fixture-rotate', 'harness', { devFixtures: true }).rotationEnabled).toBe(true);
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/content.test.ts tests/catalog.test.ts`
Expected: FAIL vì `makeRotationFixture` không được export và `loadLevel` không nhận fixture.

- [ ] **Step 3: Viết `makeRotationFixture`**

Thêm vào `game-next/src/content/fixtures.ts`:

```ts
import { shapeCells } from '../domain/shapes.ts';

export const ROTATION_FIXTURE_ID = 'fixture-rotate';

/**
 * Màn thử chỉ có ở dev cho nghiệm thu F3: cả sáu màn Chương 1 đều tắt xoay,
 * và không màn nào có giao ba lớp. Chương 3 vì validator cấm xoay ở Chương 1–2.
 *
 * T1.E (97, 48): tam giác hướng 0 không chiếm cột x = 31 của khung (cạnh huyền
 * không giữ biên), nên vừa khít mép phải ở x = 127; xoay một nấc thì ô (0, 0)
 * thành (31, 0) và rơi ra x = 128 -> out-of-bounds.
 */
export function makeRotationFixture(): LevelDocument {
  const frame = 32;
  const triangle = shapeCells('triangle', 0, frame);
  const square = shapeCells('square', 0, frame);
  const solution = [
    { cells: triangle, x: 16, y: 48 },
    { cells: triangle, x: 64, y: 48 },
    { cells: square, x: 16, y: 96 },
  ];
  const targetCells: Cell[] = solution.flatMap(({ cells, x, y }) =>
    cells.map(([cx, cy]) => [x + cx, y + cy] as const)
  );

  return {
    schemaVersion: 1,
    id: ROTATION_FIXTURE_ID,
    title: 'Bia Thử Xoay',
    chapter: 3,
    order: 1,
    contentRevision: 'fixture-rotate-v1',
    board: { width: 128, height: 160 },
    rotationEnabled: true,
    pieces: [
      {
        id: 'T1',
        shapeKind: 'triangle',
        orientation: 0,
        frameSize: frame,
        cells: triangle.map(([x, y]) => [x, y]),
        anchors: [
          { id: 'A', x: 16, y: 48 },
          { id: 'E', x: 97, y: 48 },
        ],
        color: 'amber',
      },
      {
        id: 'T2',
        shapeKind: 'triangle',
        orientation: 0,
        frameSize: frame,
        cells: triangle.map(([x, y]) => [x, y]),
        anchors: [
          { id: 'A', x: 64, y: 48 },
          { id: 'O', x: 16, y: 48 },
        ],
        color: 'amber',
      },
      {
        id: 'S1',
        shapeKind: 'square',
        frameSize: frame,
        cells: square.map(([x, y]) => [x, y]),
        anchors: [
          { id: 'A', x: 16, y: 96 },
          { id: 'O', x: 16, y: 48 },
        ],
        color: 'amber',
      },
    ],
    targetCells,
    sampleSolutions: [
      [
        { pieceId: 'T1', anchorId: 'A', turns: 0 },
        { pieceId: 'T2', anchorId: 'A', turns: 0 },
        { pieceId: 'S1', anchorId: 'A', turns: 0 },
      ],
    ],
    learningObjective: 'Thử xoay, xoay bị chặn, giao hai lớp và ba lớp',
    difficultyEstimate: 1,
    distractors: [
      { pieceId: 'T1', anchorId: 'E', reason: 'Sát mép phải: xoay bị chặn' },
      { pieceId: 'T2', anchorId: 'O', reason: 'Trùng T1: vùng triệt tiêu' },
      { pieceId: 'S1', anchorId: 'O', reason: 'Chồng ba lớp: vùng hiện lại' },
    ],
    ftueSteps: [],
  };
}
```

- [ ] **Step 4: `loadLevel` nạp fixture khi được phép**

Trong `game-next/src/content/catalog.ts`, thêm `import { ROTATION_FIXTURE_ID, makeRotationFixture } from './fixtures.ts';`. Đổi chữ ký và chèn nhánh fixture ở đầu thân hàm:

```ts
export function loadLevel(
  id: string,
  mode: 'campaign' | 'harness',
  options: { devFixtures?: boolean } = {}
): Level {
  if (id === ROTATION_FIXTURE_ID) {
    // Chỉ harness: campaign sẽ ghi tiến trình cho một id không có trong manifest
    if (!options.devFixtures || mode !== 'harness') throw new Error(`unavailable:${id}`);
    const fixture = validateLevel(makeRotationFixture());
    if (!fixture.ok) {
      throw new Error(`validation-failed:${id} -> ${JSON.stringify(fixture.issues)}`);
    }
    return fixture.level;
  }

  const entry = campaignManifest.find((e) => e.id === id);
  // … phần còn lại giữ nguyên
```

- [ ] **Step 5: Nút Xoay theo `rotationEnabled`**

Trong `game-next/src/presentation/Hud.ts`:
- Constructor đổi thành `constructor(scene: Phaser.Scene, title: string, callbacks: HudCallbacks, levelId: string = '1-1', rotationEnabled?: boolean)`.
- Dòng `const isChapter3Plus = chapterNum >= 3;` thành:

```ts
    // Màn thật bật xoay từ Chương 3; fixture dev không có số chương trong id
    const isChapter3Plus = rotationEnabled ?? chapterNum >= 3;
```

Trong `game-next/src/presentation/PlayScene.ts`:
- Import `getDevTools` từ `./dev/devTools.ts`.
- Trong `init`, cả hai lời gọi `loadLevel(…, this.mode)` thành `loadLevel(…, this.mode, { devFixtures: getDevTools().enabled })`.
- Lời gọi `new Hud(…, this.level.id)` thêm đối số cuối `this.level.rotationEnabled`.

- [ ] **Step 6: Chạy test, typecheck, kiểm thủ công**

Run: `npx vitest run tests/content.test.ts tests/catalog.test.ts && npm run typecheck && npm test && npm run content:validate`
Expected: PASS. `content:validate` chỉ duyệt manifest nên không đụng fixture.

Run: `npm run dev`, mở `http://localhost:5173/?scene=play&level=fixture-rotate&mode=harness`.

Expected:
- Ba mảnh trong khay, nút Xoay hiện.
- Kéo `T1` sát mép phải rồi bấm Xoay: mảnh giữ hướng, có hiệu ứng `rotate-blocked` của F2.
- Kéo `T2` vào giữa rồi bấm Xoay: mảnh xoay.

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Add the dev-only rotation fixture (F3 task 3)

- Added `makeRotationFixture()` (`fixture-rotate`, chapter 3, two 32-cell triangles and a square): anchor `T1.E (97, 48)` fits the right edge at turn 0 and leaves the board after one turn; `T1.A`/`T2.O`/`S1.O` stack two and three layers. `loadLevel` serves it only in harness mode with developer tools enabled.
- `Hud` now shows the rotate button from `level.rotationEnabled` instead of the chapter digit parsed from the level id, which hid it for the fixture.
- Verification: new content and catalog tests failed for the missing fixture, then passed; `applyCommand` returns `out-of-bounds` at `T1.E` and `rotated` at `T2.A`; `npm run typecheck`, `npm test` and `npm run content:validate` passed; manual dev-server check of the fixture.
```

```bash
git add game-next/src/content/fixtures.ts game-next/src/content/catalog.ts game-next/src/presentation/Hud.ts game-next/src/presentation/PlayScene.ts game-next/tests/content.test.ts game-next/tests/catalog.test.ts CHANGELOG.md
git commit -m "feat(dev): add rotation fixture for motion acceptance"
```

---

### Task 4: Hook cửa sổ đo và tốc độ trên module F1, F2

**Files:**
- Modify: `game-next/src/presentation/transitions/SceneDirector.ts` (module F1)
- Modify: `game-next/src/presentation/feedback/FeedbackDirector.ts` (module F2)
- Modify: `game-next/src/presentation/PieceTextureCache.ts` (module F2)
- Test: `game-next/tests/sceneDirector.test.ts` (thêm `describe`), `game-next/tests/pieceTextureBytes.test.ts` (mới)

**Interfaces (hook, chữ ký chính xác):**
- `SceneDirector.onWindow(listener: MotionWindowListener): () => void`
  - `go()` phát `{ phase: 'start', window: ctx.route }`.
  - `boot()` phát `{ phase: 'start', window: 'boot' }`.
  - Khi chuyển cảnh kết thúc (trong `maybeFinish`) thì phát `end` cùng tên.
- `SceneDirector.setTimeScale(scale: number): void`: `step(dt)` dùng `dt * scale` cho timeline; `scale` kẹp `[0, 4]`. Phải dùng thêm hook này vì timeline của F1 tự giữ đồng hồ, không chịu `tweens.timeScale` của Phaser.
- `FeedbackDirector.onWindow(listener: MotionWindowListener): () => void`: mỗi hiệu ứng của một `FeedbackEvent` có chuyển động mở cửa sổ tên `event.type` (chuỗi thắng là `'won'`) và đóng khi tween hoặc timeline cuối của hiệu ứng đó xong.
- `livePieceTextureBytes(): number`, export từ `PieceTextureCache.ts`: tổng `width × height × 4` của mọi texture mảnh đang sống. Cộng khi tạo texture, trừ khi gỡ.

- [ ] **Step 1: Đối chiếu tên với F2 đã merge**

Run: `grep -n "class FeedbackDirector\|export class PieceTextureCache\|addTexture\|textures.remove\|generateTexture\|createCanvas" game-next/src/presentation/feedback/FeedbackDirector.ts game-next/src/presentation/PieceTextureCache.ts`

Expected: thấy hai class và chỗ tạo/gỡ texture. Ghi lại tên thật của:
- (a) phương thức nhận sự kiện của `FeedbackDirector`: plan F2 đặt là `handle(events)`, chuỗi thắng chạy riêng trong `playVictory()`;
- (b) chỗ tạo và gỡ texture trong `PieceTextureCache`.

Các bước dưới dùng `handle`, `playVictory` và `register`/`release`. Nếu code F2 đã merge đặt tên khác, thay bằng tên thật.

- [ ] **Step 2: Viết test thất bại cho hook của director**

Thêm vào cuối `game-next/tests/sceneDirector.test.ts` (dùng `setup()` và `FakeHost` có sẵn trong file từ F1):

```ts
describe('SceneDirector — hook đo của F3', () => {
  test('phát start khi go, end khi xong, tên là route', () => {
    const { director, host, menu } = setup();
    const seen: string[] = [];
    director.onWindow((e) => seen.push(`${e.phase}:${e.window}`));
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    expect(seen).toEqual(['start:menu-to-play']);
    host.run(1600);
    expect(seen).toEqual(['start:menu-to-play', 'end:menu-to-play']);
  });

  test('boot phát cửa sổ tên boot', () => {
    const { director, host } = setup();
    const seen: string[] = [];
    director.onWindow((e) => seen.push(`${e.phase}:${e.window}`));
    director.boot('PlayScene', {});
    host.run(1600);
    expect(seen).toEqual(['start:boot', 'end:boot']);
  });

  test('setTimeScale 0.25 làm tuyến dài gấp 4', () => {
    const { director, host, menu } = setup();
    director.setTimeScale(0.25);
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    host.run(3000); // timeline mới đi 750 ms: phần vào (mốc 1000) chưa xong
    expect(director.isTransitioning()).toBe(true);
    host.run(1500); // timeline tới 1125 ms
    expect(director.isTransitioning()).toBe(false);
  });
});
```

Kiểm toán của test cuối: `FakeScene` của F1 cho phần vào xong ở mốc tuyến 1000 (`playIn` tại 1000, handoff 200). Ở tốc độ 0.25 cần khoảng 4050 ms thời gian thật: 800 ms tới handoff, cộng 3200 ms cho 800 ms còn lại của phần vào. Vì vậy sau 3000 ms tuyến còn chạy, sau 4500 ms đã xong.

- [ ] **Step 3: Viết test thất bại cho bộ đếm texture**

`game-next/tests/pieceTextureBytes.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import {
  livePieceTextureBytes,
  registerPieceTextureBytes,
  releasePieceTextureBytes,
} from '../src/presentation/pieceTextureBytes.ts';

afterEach(() => releasePieceTextureBytes('*'));

describe('bộ đếm bộ nhớ texture mảnh', () => {
  test('cộng khi tạo, trừ khi gỡ, đăng ký trùng key không cộng hai lần', () => {
    registerPieceTextureBytes('piece:1-1:D1:0', 460, 460);
    registerPieceTextureBytes('piece:1-1:D1:0', 460, 460);
    registerPieceTextureBytes('piece:1-1:D2:0', 100, 50);
    expect(livePieceTextureBytes()).toBe(460 * 460 * 4 + 100 * 50 * 4);
    releasePieceTextureBytes('piece:1-1:D1:0');
    expect(livePieceTextureBytes()).toBe(100 * 50 * 4);
  });
});
```

Bộ đếm đặt ở module thuần riêng `src/presentation/pieceTextureBytes.ts`, để test không phải import `PieceTextureCache` (module này import Phaser). `PieceTextureCache.ts` re-export `livePieceTextureBytes` từ module thuần, đúng chữ ký đã hẹn.

- [ ] **Step 4: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/sceneDirector.test.ts tests/pieceTextureBytes.test.ts`
Expected: FAIL. `director.onWindow is not a function`, và module `pieceTextureBytes.ts` chưa có.

- [ ] **Step 5: Thêm hook vào `SceneDirector`**

Trong `game-next/src/presentation/transitions/SceneDirector.ts`:

1. Import: `import { MotionWindowEmitter } from './motionWindow.ts'; import type { MotionWindowListener } from './motionWindow.ts';`
2. Field: `private readonly windows = new MotionWindowEmitter(); private windowName: string | null = null; private timeScale = 1;`
3. Phương thức công khai:

```ts
  /** F3: nghe cửa sổ chuyển cảnh để đo thời gian khung */
  onWindow(listener: MotionWindowListener): () => void {
    return this.windows.on(listener);
  }

  /** F3 `motion=<số>`: timeline tự giữ đồng hồ nên không chịu tweens.timeScale */
  setTimeScale(scale: number): void {
    this.timeScale = Math.min(4, Math.max(0, scale));
  }
```

4. Trong `go()`, ngay sau `this.begin(fromKey, to);`: `this.openWindow(ctx.route);`
5. Trong `boot()`, ngay sau `this.begin(null, to);`: `this.openWindow('boot');`
6. Trong `step(dt)`, thay hai dòng `advance(dt)` bằng:

```ts
    const scaled = dt * this.timeScale;
    this.outTl?.advance(scaled);
    this.inTl?.advance(scaled);
```

7. Cuối `maybeFinish()`, sau `this.toKey = null;`: `this.closeWindow();`
8. Hai helper riêng:

```ts
  private openWindow(name: string): void {
    this.windowName = name;
    this.windows.emit({ phase: 'start', window: name });
  }

  private closeWindow(): void {
    if (this.windowName === null) return;
    const name = this.windowName;
    this.windowName = null;
    this.windows.emit({ phase: 'end', window: name });
  }
```

- [ ] **Step 6: Bộ đếm texture và hook trong `PieceTextureCache`**

`game-next/src/presentation/pieceTextureBytes.ts`:

```ts
/** Ước tính bộ nhớ texture mảnh (RGBA, 4 byte/điểm ảnh) cho overlay F3 và ngưỡng P-06. */
const live = new Map<string, number>();

export function registerPieceTextureBytes(key: string, width: number, height: number): void {
  live.set(key, width * height * 4);
}

/** `'*'` gỡ hết (dùng trong test và khi scene tắt). */
export function releasePieceTextureBytes(key: string): void {
  if (key === '*') live.clear();
  else live.delete(key);
}

export function livePieceTextureBytes(): number {
  let total = 0;
  for (const bytes of live.values()) total += bytes;
  return total;
}
```

Trong `game-next/src/presentation/PieceTextureCache.ts` (module F2):
- `import { registerPieceTextureBytes, releasePieceTextureBytes } from './pieceTextureBytes.ts';`
- `export { livePieceTextureBytes } from './pieceTextureBytes.ts';`
- Ngay sau chỗ tạo mỗi texture: `registerPieceTextureBytes(key, width, height);`, với `width` và `height` là kích thước texture vừa vẽ.
- Ngay sau chỗ gỡ mỗi texture (`textures.remove(key)` trong `shutdown` hoặc `destroy`): `releasePieceTextureBytes(key);`

- [ ] **Step 7: Hook cửa sổ trong `FeedbackDirector`**

Trong `game-next/src/presentation/feedback/FeedbackDirector.ts` (module F2):
- `import { MotionWindowEmitter } from '../transitions/motionWindow.ts'; import type { MotionWindowListener } from '../transitions/motionWindow.ts';`
- Field `private readonly windows = new MotionWindowEmitter();`
- Phương thức:

```ts
  /** F3: mỗi hiệu ứng mở một cửa sổ tên `event.type`, đóng khi tween cuối xong */
  onWindow(listener: MotionWindowListener): () => void {
    return this.windows.on(listener);
  }
```

- Trong `playVictory()`: ngay sau `this.victory = tl;` thêm `const won = this.windows.open('won'); tl.onDone(() => won.end());`.
- Trong `handle(events)` (Step 1 xác nhận tên thật), ở nhánh chạy hiệu ứng của mỗi `event`:
  - đầu nhánh: `const window = this.windows.open(event.type);`
  - đóng cửa sổ ở `onComplete` của tween cuối của hiệu ứng, hoặc `onDone` của `TransitionTimeline` chuỗi thắng: `window.end();`
  - sự kiện không có chuyển động (ví dụ `lift` khi Giảm chuyển động bật): gọi `window.end()` ngay sau khi mở.

- [ ] **Step 8: Chạy test, typecheck**

Run: `npx vitest run tests/sceneDirector.test.ts tests/pieceTextureBytes.test.ts && npm run typecheck && npm test`
Expected: PASS. Các test director của F1 không đổi.

- [ ] **Step 9: Changelog và commit**

```markdown
### 2026-10-03 - Add measurement hooks to the F1 and F2 directors (F3 task 4)

- `SceneDirector` now emits start/end motion windows per route (`boot` for launches) and accepts a developer time scale applied to its self-clocked timelines.
- `FeedbackDirector` emits a window per feedback effect named after the event type; `PieceTextureCache` reports live texture bytes through the new pure `pieceTextureBytes.ts` counter.
- Verification: new director and texture-counter tests failed before the hooks, then passed; existing F1 director tests unchanged and passing; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/presentation/transitions/SceneDirector.ts game-next/src/presentation/feedback/FeedbackDirector.ts game-next/src/presentation/PieceTextureCache.ts game-next/src/presentation/pieceTextureBytes.ts game-next/tests/sceneDirector.test.ts game-next/tests/pieceTextureBytes.test.ts CHANGELOG.md
git commit -m "feat(dev): emit motion windows from directors and count texture bytes"
```

---

### Task 5: Kịch bản `autosolve`

**Files:**
- Create: `game-next/src/presentation/dev/autosolveScripts.ts`
- Modify: `game-next/src/presentation/PlayScene.ts` (bỏ `autosolve` viết tay, chạy kịch bản qua `input.emit`)
- Test: `game-next/tests/autosolveScripts.test.ts`

**Interfaces:**
- Consumes: `AutosolveScript`, `LayoutMetrics`, `pieceHitbox`, `pieceCenterCanvas`, `fitsBoard`, `rotateCells`, `feedbackEvents` (F2), `PlayController`.
- Produces:
  - `type ScriptStep = { kind: 'down' | 'move' | 'up'; x: number; y: number } | { kind: 'rotate' } | { kind: 'reset' }`
  - `buildScript(name: AutosolveScript, level: Level, layout: LayoutMetrics): ScriptStep[]`. Trả `[]` khi màn không có cấu hình phù hợp (ví dụ `rotate` trên màn tắt xoay).
  - `SCRIPT_STEP_MS = 400`
  - `PlayScene.runScript(name: AutosolveScript): void` (công khai, `DemoRunner` dùng)

**Cách chọn neo** (tổng quát, không gắn với id màn):

| Kịch bản | Bước |
|---|---|
| `win` | Lần lượt từng mảnh: nhấn ở khay, thả ở tâm neo của `targetPlacements` |
| `drag` | Đặt đủ trừ mảnh cuối; mảnh cuối nhấn ở khay rồi kéo tới tâm neo lệch `(+12, −12)`, không thả |
| `snap` | Mảnh đầu: nhấn ở khay, kéo tới tâm neo nghiệm, thả |
| `return` | Như `snap`, rồi nhấn lại mảnh đó và thả ở tâm khay |
| `rotate` | Mảnh đầu có neo xoay được (`fitsBoard` sau 1 nấc): snap ở neo đó, bấm Xoay |
| `rotate-blocked` | Mảnh đầu có neo vừa ở hướng 0 nhưng không vừa sau 1 nấc: snap ở đó, bấm Xoay |
| `overlap-hollow` | Cặp neo đầu tiên của hai mảnh khác nhau có ô chung: snap cả hai |
| `overlap-revive` | Bộ ba neo đầu tiên của ba mảnh khác nhau có ô chung: snap cả ba |
| `reset` | Như `snap`, rồi bấm Đặt lại |

Trên dữ liệu hiện có:
- Màn 1-1 không có cặp neo chồng nhau, nên `overlap-hollow` trên 1-1 trả `[]`. Dùng 1-3 (`W1.A` × `W2.B`, 576 ô chung) hoặc `fixture-rotate`.
- Không màn Chương 1 nào có bộ ba chồng nhau, nên `overlap-revive` chỉ chạy trên `fixture-rotate`.

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/autosolveScripts.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { PlayController } from '../src/application/playController.ts';
import { createProgressRepository } from '../src/infrastructure/progressRepository.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { computeLayout } from '../src/presentation/layout.ts';
import { buildScript } from '../src/presentation/dev/autosolveScripts.ts';
import type { AutosolveScript } from '../src/presentation/dev/devTools.ts';
import { feedbackEvents } from '../src/presentation/feedback/feedbackEvents.ts';
import type { Level } from '../src/domain/model.ts';

const layout = computeLayout(720, 1280);

function memoryStorage() {
  const data: Record<string, string> = {};
  return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } };
}

/** Chạy kịch bản trên controller thật, trả tên sự kiện phản hồi F2 sinh ra */
function run(level: Level, name: AutosolveScript): string[] {
  const repo = createProgressRepository(memoryStorage(), campaignManifest, 'oracle-v1');
  const controller = new PlayController(level, repo, false, true);
  const events: string[] = [];
  for (const step of buildScript(name, level, layout)) {
    const prev = controller.getPuzzleState();
    // Mảnh đang chọn trước bước này: lệnh thả và xoay áp lên nó (FeedbackSubject của F2)
    const selected = controller.getSnapshot().selectedPieceId;
    let transition = null;
    if (step.kind === 'down') {
      if (controller.onPointerDown(step.x, step.y, layout)) events.push('lift');
    } else if (step.kind === 'move') {
      controller.onPointerMove(step.x, step.y, layout);
    } else if (step.kind === 'up') {
      transition = controller.onPointerUp(step.x, step.y, layout);
    } else if (step.kind === 'rotate') {
      transition = controller.onRotate();
    } else {
      transition = controller.onReset();
    }
    if (transition) {
      const subject = step.kind === 'reset'
        ? { command: 'reset' as const, pieceId: null }
        : { command: step.kind === 'rotate' ? ('rotate' as const) : ('move' as const), pieceId: selected };
      events.push(...feedbackEvents(prev, transition, level, subject).map((e) => e.type));
    }
  }
  return events;
}

const fixture = () => loadLevel('fixture-rotate', 'harness', { devFixtures: true });

describe('autosolveScripts sinh đúng sự kiện mục tiêu', () => {
  test.each([
    ['win', '1-1', 'won'],
    ['snap', '1-1', 'snap'],
    ['return', '1-1', 'return'],
    ['reset', '1-1', 'reset'],
    ['overlap-hollow', '1-3', 'overlap-hollow'],
  ] as const)('%s trên %s sinh %s', (name, id, expected) => {
    expect(run(loadLevel(id, 'campaign'), name)).toContain(expected);
  });

  test.each([
    ['rotate', 'rotate'],
    ['rotate-blocked', 'rotate-blocked'],
    ['overlap-hollow', 'overlap-hollow'],
    ['overlap-revive', 'overlap-revive'],
    ['win', 'won'],
  ] as const)('%s trên fixture-rotate sinh %s', (name, expected) => {
    expect(run(fixture(), name)).toContain(expected);
  });

  test('drag dừng giữa chừng: có lift, không thắng', () => {
    const events = run(loadLevel('1-1', 'campaign'), 'drag');
    expect(events).toContain('lift');
    expect(events).not.toContain('won');
  });

  test('màn không đủ điều kiện thì kịch bản rỗng', () => {
    const one = loadLevel('1-1', 'campaign');
    expect(buildScript('rotate', one, layout)).toEqual([]);
    expect(buildScript('overlap-hollow', one, layout)).toEqual([]);
    expect(buildScript('overlap-revive', loadLevel('1-6', 'campaign'), layout)).toEqual([]);
  });

  test('R-02: win thắng cả sáu màn Chương 1', () => {
    for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6']) {
      expect(run(loadLevel(id, 'campaign'), 'win')).toContain('won');
    }
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/autosolveScripts.test.ts`
Expected: FAIL vì không tìm thấy module `autosolveScripts.ts`.

- [ ] **Step 3: Viết `autosolveScripts.ts`**

`game-next/src/presentation/dev/autosolveScripts.ts`:

```ts
import type { Anchor, Level, Piece } from '../../domain/model.ts';
import { fitsBoard, rotateCells } from '../../domain/geometry.ts';
import type { LayoutMetrics } from '../layout.ts';
import { pieceCenterCanvas, pieceHitbox } from '../layout.ts';
import type { AutosolveScript } from './devTools.ts';

export type ScriptStep =
  | { kind: 'down' | 'move' | 'up'; x: number; y: number }
  | { kind: 'rotate' }
  | { kind: 'reset' };

/** Khoảng cách giữa hai bước khi chạy trong game (spec F3 mục 2) */
export const SCRIPT_STEP_MS = 400;

type Ctx = { level: Level; layout: LayoutMetrics };

function trayCenter(ctx: Ctx, piece: Piece): { x: number; y: number } {
  const index = ctx.level.pieces.indexOf(piece);
  const box = pieceHitbox(piece, { kind: 'tray', turns: 0 }, ctx.layout, index, ctx.level.pieces.length);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function anchorCenter(ctx: Ctx, piece: Piece, anchor: Anchor): { x: number; y: number } {
  return pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, ctx.layout);
}

/** Nhấn ở khay, kéo tới tâm neo, thả: mảnh snap vào đúng neo đó. */
function place(ctx: Ctx, piece: Piece, anchor: Anchor): ScriptStep[] {
  const from = trayCenter(ctx, piece);
  const to = anchorCenter(ctx, piece, anchor);
  return [
    { kind: 'down', ...from },
    { kind: 'move', ...to },
    { kind: 'up', ...to },
  ];
}

function solutionAnchor(ctx: Ctx, piece: Piece): Anchor {
  const placement = (ctx.level.targetPlacements ?? []).find((p) => p.pieceId === piece.id);
  return (
    (placement && piece.anchors.find((a) => a.x === placement.x && a.y === placement.y)) ??
    piece.anchors[0]
  );
}

function cellsAt(piece: Piece, anchor: Anchor): Set<string> {
  return new Set(piece.cells.map(([x, y]) => `${x + anchor.x},${y + anchor.y}`));
}

function fitsAfterTurn(piece: Piece, anchor: Anchor): boolean {
  return fitsBoard(rotateCells(piece.cells, piece.frameSize, 1), anchor.x, anchor.y);
}

function findRotatable(ctx: Ctx, blocked: boolean): { piece: Piece; anchor: Anchor } | null {
  if (!ctx.level.rotationEnabled) return null;
  for (const piece of ctx.level.pieces) {
    for (const anchor of piece.anchors) {
      if (!fitsBoard(piece.cells, anchor.x, anchor.y)) continue;
      if (fitsAfterTurn(piece, anchor) !== blocked) return { piece, anchor };
    }
  }
  return null;
}

function findOverlap(ctx: Ctx, size: 2 | 3): Array<{ piece: Piece; anchor: Anchor }> | null {
  const pieces = ctx.level.pieces;
  const search = (start: number, chosen: Array<{ piece: Piece; anchor: Anchor; cells: Set<string> }>):
    Array<{ piece: Piece; anchor: Anchor }> | null => {
    if (chosen.length === size) return chosen.map(({ piece, anchor }) => ({ piece, anchor }));
    for (let i = start; i < pieces.length; i++) {
      for (const anchor of pieces[i].anchors) {
        const cells = cellsAt(pieces[i], anchor);
        const common = chosen.length === 0
          ? cells
          : new Set([...chosen[chosen.length - 1].cells].filter((k) => cells.has(k)));
        if (common.size === 0) continue;
        const found = search(i + 1, [...chosen, { piece: pieces[i], anchor, cells: common }]);
        if (found) return found;
      }
    }
    return null;
  };
  return search(0, []);
}

export function buildScript(name: AutosolveScript, level: Level, layout: LayoutMetrics): ScriptStep[] {
  const ctx: Ctx = { level, layout };
  const first = level.pieces[0];
  if (!first) return [];

  switch (name) {
    case 'win':
      return level.pieces.flatMap((p) => place(ctx, p, solutionAnchor(ctx, p)));
    case 'drag': {
      const last = level.pieces[level.pieces.length - 1];
      const target = anchorCenter(ctx, last, solutionAnchor(ctx, last));
      return [
        ...level.pieces.slice(0, -1).flatMap((p) => place(ctx, p, solutionAnchor(ctx, p))),
        { kind: 'down', ...trayCenter(ctx, last) },
        // Lệch nhẹ khỏi đích để còn trong vùng hít, như autosolve=drag cũ
        { kind: 'move', x: target.x + 12, y: target.y - 12 },
      ];
    }
    case 'snap':
      return place(ctx, first, solutionAnchor(ctx, first));
    case 'return': {
      const at = anchorCenter(ctx, first, solutionAnchor(ctx, first));
      const tray = layout.trayBounds;
      const trayMid = { x: tray.x + tray.width / 2, y: tray.y + tray.height / 2 };
      return [
        ...place(ctx, first, solutionAnchor(ctx, first)),
        { kind: 'down', ...at },
        { kind: 'move', ...trayMid },
        { kind: 'up', ...trayMid },
      ];
    }
    case 'rotate':
    case 'rotate-blocked': {
      const found = findRotatable(ctx, name === 'rotate-blocked');
      return found ? [...place(ctx, found.piece, found.anchor), { kind: 'rotate' }] : [];
    }
    case 'overlap-hollow':
    case 'overlap-revive': {
      const found = findOverlap(ctx, name === 'overlap-hollow' ? 2 : 3);
      return found ? found.flatMap(({ piece, anchor }) => place(ctx, piece, anchor)) : [];
    }
    case 'reset':
      return [...place(ctx, first, solutionAnchor(ctx, first)), { kind: 'reset' }];
  }
}
```

Lưu ý `findRotatable(ctx, false)` tìm neo **xoay được**: điều kiện `fitsAfterTurn !== false`, tức `fitsAfterTurn === true`. Với `blocked = true`, điều kiện là `fitsAfterTurn === false`. Trên fixture, `rotate` chọn `T1.A` (16, 48), là neo đầu tiên xoay được. `rotate-blocked` chọn `T1.E`.

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx vitest run tests/autosolveScripts.test.ts`
Expected: PASS. Nếu `return` không sinh `'return'`, kiểm tâm khay có nằm trong `trayBounds` không (`finishDrag` trả mảnh về khay khi điểm thả trong khay).

- [ ] **Step 5: PlayScene chạy kịch bản qua `input.emit`**

Trong `game-next/src/presentation/PlayScene.ts`:

1. Import `buildScript`, `SCRIPT_STEP_MS` từ `./dev/autosolveScripts.ts`; `type AutosolveScript`, `getDevTools` từ `./dev/devTools.ts`; `director` đã có từ F1.
2. Lưu callback của Hud vào field để kịch bản bấm Xoay và Đặt lại giống người chơi. Trong `create`, tách object callback đang truyền vào `new Hud(…)` ra thành `this.hudCallbacks = { … }` (field `private hudCallbacks!: HudCallbacks;`, import `type HudCallbacks` từ `./Hud.ts`), rồi truyền `this.hudCallbacks`.
3. Xoá phương thức `autosolve` cũ và khối `if (import.meta.env.DEV) { … autosolve … }` cuối `create`. Thay bằng:

```ts
    const script = getDevTools().autosolve;
    if (script) this.runScriptWhenIdle(script);
```

4. Thêm:

```ts
  /** Kịch bản chạy sau khi chuyển cảnh vào màn xong, để không lẫn vào số đo tuyến */
  private runScriptWhenIdle(name: AutosolveScript): void {
    if (!director.isTransitioning()) {
      this.runScript(name);
      return;
    }
    const off = director.onWindow((e) => {
      if (e.phase !== 'end') return;
      off();
      this.runScript(name);
    });
  }

  /**
   * Phát lại kịch bản qua đúng listener pointer của scene, nên phản hồi F2 và
   * cửa sổ đo chạy như khi người chơi thao tác thật.
   */
  public runScript(name: AutosolveScript): void {
    const steps = buildScript(name, this.level, this.layout);
    if (steps.length === 0) {
      console.warn(`[autosolve] Màn ${this.level.id} không có cấu hình cho kịch bản "${name}"`);
      return;
    }
    steps.forEach((step, i) => {
      this.time.delayedCall(i * SCRIPT_STEP_MS, () => {
        if (step.kind === 'rotate') this.hudCallbacks.onRotate();
        else if (step.kind === 'reset') this.hudCallbacks.onReset();
        else {
          const event = step.kind === 'down' ? 'pointerdown' : step.kind === 'move' ? 'pointermove' : 'pointerup';
          this.input.emit(event, { x: step.x, y: step.y } as Phaser.Input.Pointer);
        }
      });
    });
  }
```

- [ ] **Step 6: Typecheck, test, kiểm thủ công**

Run: `npm run typecheck && npm test`

Run: `npm run dev`. Mở lần lượt:
- `/?scene=play&level=1-1&mode=harness&autosolve=win`: thắng sau khoảng 2.4 s.
- `/?scene=play&level=1-3&mode=harness&autosolve=overlap-hollow&motion=0.25`: vùng giao ẩn đi, quay chậm.
- `/?scene=play&level=fixture-rotate&mode=harness&autosolve=rotate-blocked`: lắc và nháy viền.
- `/?scene=play&level=fixture-rotate&mode=harness&autosolve=overlap-revive`: vùng ba lớp hiện lại.

`motion=0.25` chỉ có tác dụng sau Task 6.

- [ ] **Step 7: Changelog và commit**

```markdown
### 2026-10-03 - Add autosolve scripts for motion acceptance (F3 task 5)

- Added `game-next/src/presentation/dev/autosolveScripts.ts`: nine pointer scripts built from level data (solution anchors, the first rotatable or blocked anchor, the first two- or three-layer overlap); `PlayScene` replays them through its own input listeners after the entry transition, replacing the hand-written `autosolve`.
- Level 1-1 has no overlapping anchors and no Chapter 1 level stacks three layers, so `overlap-hollow` uses 1-3 or `fixture-rotate` and `overlap-revive` uses `fixture-rotate`.
- Verification: `tests/autosolveScripts.test.ts` failed for the missing module, then passed, including `win` on all six Chapter 1 levels (R-02); `npm run typecheck` and `npm test` passed; manual dev-server check of four scripts.
```

```bash
git add game-next/src/presentation/dev/autosolveScripts.ts game-next/src/presentation/PlayScene.ts game-next/tests/autosolveScripts.test.ts CHANGELOG.md
git commit -m "feat(dev): add autosolve scripts replayed through scene input"
```

---

### Task 6: Overlay `fps`, ghi `perf`, tốc độ `motion`

**Files:**
- Create: `game-next/src/presentation/dev/PerfOverlay.ts`
- Create: `game-next/src/presentation/dev/devTimeScale.ts`
- Modify: `game-next/src/presentation/PlayScene.ts` (cửa sổ `drag`, nhân `delta`)
- Modify: `game-next/src/main.ts`
- Test: `game-next/tests/devTimeScale.test.ts`

**Interfaces:**
- Consumes: `PerfRecorder`, `rollingP95`, `livePieceTextureBytes`, `director.onWindow`, `director.setTimeScale`, `FeedbackDirector.onWindow`, `setMotionScale`, `getDevTools`.
- Produces:
  - `getDevTimeScale(): number`, `setDevTimeScale(scale: number): void` (kẹp `[0, 4]`; 0 coi như 1 vì `motion=0` nghĩa là Giảm chuyển động)
  - `getPerfRecorder(): PerfRecorder | null`, `setPerfRecorder(r: PerfRecorder | null): void`
  - `class PerfOverlay`: `constructor(game: Phaser.Game)`, `destroy()`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/devTimeScale.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest';
import { getDevTimeScale, setDevTimeScale } from '../src/presentation/dev/devTimeScale.ts';

afterEach(() => setDevTimeScale(1));

describe('devTimeScale', () => {
  test('mặc định 1, nhận giá trị trong (0, 4]', () => {
    expect(getDevTimeScale()).toBe(1);
    setDevTimeScale(0.25);
    expect(getDevTimeScale()).toBe(0.25);
    setDevTimeScale(9);
    expect(getDevTimeScale()).toBe(4);
  });

  test('0 hoặc âm coi như 1: motion=0 là Giảm chuyển động, không phải dừng hình', () => {
    setDevTimeScale(0);
    expect(getDevTimeScale()).toBe(1);
    setDevTimeScale(-2);
    expect(getDevTimeScale()).toBe(1);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/devTimeScale.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 3: Viết `devTimeScale.ts`**

`game-next/src/presentation/dev/devTimeScale.ts`:

```ts
import type { PerfRecorder } from './PerfRecorder.ts';

let timeScale = 1;
let recorder: PerfRecorder | null = null;

/** Hệ số tốc độ của `motion=<số>`; 0 là Giảm chuyển động nên tốc độ giữ 1. */
export function setDevTimeScale(scale: number): void {
  timeScale = scale > 0 ? Math.min(4, scale) : 1;
}

export function getDevTimeScale(): number {
  return timeScale;
}

export function setPerfRecorder(next: PerfRecorder | null): void {
  recorder = next;
}

export function getPerfRecorder(): PerfRecorder | null {
  return recorder;
}
```

- [ ] **Step 4: Viết `PerfOverlay.ts`**

`game-next/src/presentation/dev/PerfOverlay.ts`:

```ts
import type Phaser from 'phaser';
import { livePieceTextureBytes } from '../pieceTextureBytes.ts';
import { rollingP95 } from './perfStats.ts';

const REFRESH_MS = 250;
const WINDOW_MS = 2000;

/**
 * Bảng `fps=1` ở góc trên-phải. Dùng DOM thay vì GameObject để không nằm
 * trong scene nào: chuyển cảnh không che, không đổi số đo của canvas.
 */
export class PerfOverlay {
  private readonly game: Phaser.Game;
  private readonly el: HTMLDivElement;
  private readonly timer: number;
  private samples: Array<{ atMs: number; frameMs: number }> = [];
  private readonly onStep = (_time: number, delta: number) => {
    const now = performance.now();
    this.samples.push({ atMs: now, frameMs: delta });
    this.samples = this.samples.filter((s) => now - s.atMs <= WINDOW_MS);
  };

  constructor(game: Phaser.Game) {
    this.game = game;
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '8px',
      right: '8px',
      zIndex: '9999',
      padding: '6px 8px',
      font: '12px/1.4 ui-monospace, monospace',
      color: '#FFF4CC',
      background: 'rgba(5, 10, 26, 0.8)',
      borderRadius: '6px',
      pointerEvents: 'none',
      whiteSpace: 'pre',
    });
    document.body.appendChild(this.el);
    game.events.on('step', this.onStep);
    this.timer = window.setInterval(() => this.refresh(), REFRESH_MS);
  }

  private refresh(): void {
    const fps = this.game.loop.actualFps;
    const p95 = rollingP95(this.samples, performance.now(), WINDOW_MS);
    const tweens = this.game.scene
      .getScenes(true)
      .reduce((n, scene) => n + scene.tweens.getTweens().length, 0);
    const mb = livePieceTextureBytes() / (1024 * 1024);
    this.el.textContent =
      `FPS ${fps.toFixed(1)}\np95 ${p95.toFixed(1)} ms\ntweens ${tweens}\ntex ${mb.toFixed(1)} MB`;
  }

  destroy(): void {
    window.clearInterval(this.timer);
    this.game.events.off('step', this.onStep);
    this.el.remove();
  }
}
```

- [ ] **Step 5: Nối trong `main.ts`**

Trong `game-next/src/main.ts`:

1. Import:

```ts
import { devToolsEnabled, resolveDevTools, resolveLaunch } from './launchParams.ts';
import { setDevTools } from './presentation/dev/devTools.ts';
import { PerfRecorder } from './presentation/dev/PerfRecorder.ts';
import { PerfOverlay } from './presentation/dev/PerfOverlay.ts';
import { getDevTimeScale, setDevTimeScale, setPerfRecorder } from './presentation/dev/devTimeScale.ts';
```

2. Thay dòng `const launch = resolveLaunch(window.location.search, import.meta.env.DEV);` bằng:

```ts
const toolsOn = devToolsEnabled(import.meta.env);
// Bản APK nghiệm thu (VITE_MOTION_TOOLS=1) cũng cần harness để mở fixture-rotate
const launch = resolveLaunch(window.location.search, toolsOn);
const devTools = resolveDevTools(window.location.search, toolsOn);
setDevTools(devTools);
```

3. Sau dòng `setMotionScale(savedSettings.reducedMotion ? 0 : 1);` (F1):

```ts
// motion=0: Giảm chuyển động cho phiên này, không ghi bản lưu
if (devTools.motion === 0) setMotionScale(0);
if (devTools.motion !== null) setDevTimeScale(devTools.motion);
```

4. Sau `director.setHost(new PhaserSceneHost(game));`:

```ts
if (devTools.enabled) {
  director.setTimeScale(getDevTimeScale());
  // Tween và đồng hồ của mọi scene đang chạy theo cùng hệ số dev
  game.events.on('step', () => {
    for (const scene of game.scene.getScenes(true)) {
      scene.tweens.timeScale = getDevTimeScale();
      scene.time.timeScale = getDevTimeScale();
    }
  });
}

if (devTools.perf) {
  const recorder = new PerfRecorder((line) => {
    console.log(JSON.stringify(line));
    (window.__motionPerf ??= []).push(line);
  });
  setPerfRecorder(recorder);
  director.onWindow((e) => recorder.listen(e));
  game.events.on('step', (_time: number, delta: number) => recorder.frame(delta));
}

if (devTools.fps) new PerfOverlay(game);
```

- [ ] **Step 6: PlayScene nối cửa sổ `drag`, phản hồi F2 và `delta`**

Trong `game-next/src/presentation/PlayScene.ts`:

1. Import `getDevTimeScale` và `getPerfRecorder` từ `./dev/devTimeScale.ts`.
2. Cuối `create()`, trước `director.attach(this)`:

```ts
    const recorder = getPerfRecorder();
    if (recorder) {
      // Đăng ký sau listener của F2 nên chạy sau: lúc này controller đã biết có kéo hay không
      this.input.on('pointerdown', () => {
        if (this.controller.getSnapshot().dragInfo) recorder.begin('drag');
      });
      const endDrag = () => recorder.end('drag');
      this.input.on('pointerup', endDrag);
      this.input.on('pointerupoutside', endDrag);
      // Tên field FeedbackDirector theo plan F2; đổi nếu F2 đặt khác
      const off = this.feedback.onWindow((e) => recorder.listen(e));
      this.events.once('shutdown', off);
    }
```

3. Trong `update(_time, delta)` của F2, dòng đầu thân hàm thêm `const scaledDelta = delta * getDevTimeScale();`, rồi thay mọi chỗ dùng `delta` trong thân hàm bằng `scaledDelta`.

- [ ] **Step 7: Typecheck, test, kiểm thủ công**

Run: `npx vitest run tests/devTimeScale.test.ts && npm run typecheck && npm test`

Run: `npm run dev`, mở `/?fps=1&perf=1`.

Expected:
- Góc phải hiện 4 dòng `FPS`, `p95`, `tweens`, `tex`.
- Bấm "Bắt đầu": console in một dòng JSON có `"window":"menu-to-play"` và `durationMs` khoảng 1500.
- Kéo một mảnh rồi thả: có dòng `"window":"drag"` và dòng `"window":"snap"`.
- Gõ `window.__motionPerf` trong console: ra mảng các dòng đó.

Mở `/?scene=play&level=1-1&mode=harness&motion=0.25&autosolve=win`: mọi thứ chậm 4 lần, `durationMs` của `won` khoảng 7200.

- [ ] **Step 8: Changelog và commit**

```markdown
### 2026-10-03 - Add fps overlay, perf recording and dev time scale (F3 task 6)

- Added a DOM overlay for `fps=1` (FPS, rolling 2 s p95, active tweens, live piece texture MB), `perf=1` recording of route, feedback and drag windows to the console and `window.__motionPerf`, and `motion=<n>` scaling Phaser tweens and clocks, the director timelines and the F2 play tick; `motion=0` applies reduced motion for the session only.
- Verification: `tests/devTimeScale.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed; manual dev-server check of the overlay, JSON lines and slow motion.
```

```bash
git add game-next/src/presentation/dev/PerfOverlay.ts game-next/src/presentation/dev/devTimeScale.ts game-next/src/presentation/PlayScene.ts game-next/src/main.ts game-next/tests/devTimeScale.test.ts CHANGELOG.md
git commit -m "feat(dev): add fps overlay, perf windows and dev time scale"
```

---

### Task 7: `demo` và `loop`

**Files:**
- Create: `game-next/src/presentation/dev/demoPlan.ts`
- Create: `game-next/src/presentation/dev/DemoRunner.ts`
- Modify: `game-next/src/presentation/LevelSelectScene.ts` (`demoOrigin()`)
- Modify: `game-next/src/main.ts`
- Test: `game-next/tests/demoPlan.test.ts`

**Interfaces:**
- Consumes: `director` (`go`, `boot`, `skip`, `onWindow`, `isTransitioning`), `RouteId`, `SceneKey`, `Choreographed`, `PlayScene.runScript`.
- Produces:
  - `type DemoPlan = { source: SceneKey; sourceData: object; target: SceneKey; targetData: object; prepareWin: boolean }`
  - `demoPlan(route: RouteId): DemoPlan`
  - `DEMO_REST_MS = 600`, `DEMO_WIN_SETTLE_MS = 2000`
  - `LevelSelectScene.demoOrigin(): { x: number; y: number }`
  - `class DemoRunner`: `constructor(game: Phaser.Game, route: RouteId, loop: boolean)`, `start(): void`

- [ ] **Step 1: Viết test thất bại**

`game-next/tests/demoPlan.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { TRANSITION_TOKENS } from '../src/presentation/designTokens.ts';
import { demoPlan } from '../src/presentation/dev/demoPlan.ts';
import type { RouteId } from '../src/presentation/transitions/motion.ts';

describe('demoPlan', () => {
  test('mỗi tuyến có cảnh nguồn và đích đúng tên tuyến', () => {
    const expected: Record<RouteId, [string, string]> = {
      'menu-to-play': ['MenuScene', 'PlayScene'],
      'map-to-play': ['LevelSelectScene', 'PlayScene'],
      'next-level': ['PlayScene', 'PlayScene'],
      'play-to-map': ['PlayScene', 'LevelSelectScene'],
      'play-to-menu': ['PlayScene', 'MenuScene'],
      'menu-to-map': ['MenuScene', 'LevelSelectScene'],
      'map-to-menu': ['LevelSelectScene', 'MenuScene'],
    };
    for (const route of Object.keys(TRANSITION_TOKENS.routes) as RouteId[]) {
      const plan = demoPlan(route);
      expect([plan.source, plan.target]).toEqual(expected[route]);
    }
  });

  test('chỉ next-level cần thắng màn nguồn trước; màn chơi dùng harness', () => {
    const next = demoPlan('next-level');
    expect(next.prepareWin).toBe(true);
    expect(next.sourceData).toEqual({ levelId: '1-1', mode: 'harness' });
    expect(next.targetData).toEqual({ levelId: '1-2', mode: 'harness' });
    expect(demoPlan('menu-to-play').prepareWin).toBe(false);
    expect(demoPlan('map-to-play').sourceData).toEqual({ mode: 'harness' });
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx vitest run tests/demoPlan.test.ts`
Expected: FAIL vì không tìm thấy module.

- [ ] **Step 3: Viết `demoPlan.ts`**

`game-next/src/presentation/dev/demoPlan.ts`:

```ts
import type { RouteId } from '../transitions/motion.ts';
import type { SceneKey } from '../transitions/SceneDirector.ts';

export type DemoPlan = {
  source: SceneKey;
  sourceData: object;
  target: SceneKey;
  targetData: object;
  /** next-level: thắng màn nguồn trước rồi mới bấm "Màn tiếp theo" */
  prepareWin: boolean;
};

/** Nghỉ giữa hai lần lặp (spec F3 mục 2) */
export const DEMO_REST_MS = 600;
/** Đợi chuỗi thắng 1800 ms của F2 xong trước khi sang màn kế */
export const DEMO_WIN_SETTLE_MS = 2000;

const PLAY_1_1 = { levelId: '1-1', mode: 'harness' } as const;
const MAP = { mode: 'harness' } as const;

export function demoPlan(route: RouteId): DemoPlan {
  switch (route) {
    case 'menu-to-play':
      return { source: 'MenuScene', sourceData: {}, target: 'PlayScene', targetData: PLAY_1_1, prepareWin: false };
    case 'map-to-play':
      return { source: 'LevelSelectScene', sourceData: MAP, target: 'PlayScene', targetData: PLAY_1_1, prepareWin: false };
    case 'next-level':
      return {
        source: 'PlayScene',
        sourceData: PLAY_1_1,
        target: 'PlayScene',
        targetData: { levelId: '1-2', mode: 'harness' },
        prepareWin: true,
      };
    case 'play-to-map':
      return { source: 'PlayScene', sourceData: PLAY_1_1, target: 'LevelSelectScene', targetData: MAP, prepareWin: false };
    case 'play-to-menu':
      return { source: 'PlayScene', sourceData: PLAY_1_1, target: 'MenuScene', targetData: {}, prepareWin: false };
    case 'menu-to-map':
      return { source: 'MenuScene', sourceData: {}, target: 'LevelSelectScene', targetData: MAP, prepareWin: false };
    case 'map-to-menu':
      return { source: 'LevelSelectScene', sourceData: MAP, target: 'MenuScene', targetData: {}, prepareWin: false };
  }
}
```

- [ ] **Step 4: `LevelSelectScene.demoOrigin()`**

Thêm vào `game-next/src/presentation/LevelSelectScene.ts`. F1 Task 8 có `nodeViews` và `anchorIndex()`.

```ts
  /** F3 demo map-to-play: điểm chạm giả là node hiện tại, theo toạ độ màn hình */
  public demoOrigin(): { x: number; y: number } {
    const view = this.nodeViews[this.anchorIndex()];
    return view
      ? { x: view.info.x, y: view.info.y + this.mapContainer.y }
      : { x: 360, y: 640 };
  }
```

- [ ] **Step 5: Viết `DemoRunner.ts`**

`game-next/src/presentation/dev/DemoRunner.ts`:

```ts
import type Phaser from 'phaser';
import type { RouteId } from '../transitions/motion.ts';
import { director } from '../transitions/SceneDirector.ts';
import type { Choreographed, SceneKey } from '../transitions/SceneDirector.ts';
import { DEMO_REST_MS, DEMO_WIN_SETTLE_MS, demoPlan } from './demoPlan.ts';
import type { DemoPlan } from './demoPlan.ts';

type Phase = 'booting' | 'running';

/**
 * `demo=<route>`: dựng cảnh nguồn, chạy tuyến. `loop=1`: xong thì quay về cảnh
 * nguồn không animation (boot rồi skip), nghỉ 600 ms và chạy lại.
 */
export class DemoRunner {
  private readonly game: Phaser.Game;
  private readonly route: RouteId;
  private readonly loop: boolean;
  private readonly plan: DemoPlan;
  private phase: Phase = 'booting';

  constructor(game: Phaser.Game, route: RouteId, loop: boolean) {
    this.game = game;
    this.route = route;
    this.loop = loop;
    this.plan = demoPlan(route);
  }

  start(): void {
    director.onWindow((e) => {
      if (e.phase !== 'end') return;
      if (this.phase === 'booting') {
        this.phase = 'running';
        window.setTimeout(() => this.prepareAndGo(), DEMO_REST_MS);
      } else if (this.loop) {
        this.phase = 'booting';
        this.resetToSource();
      }
    });
    this.resetToSource();
  }

  private scene(key: SceneKey): Choreographed & Phaser.Scene {
    return this.game.scene.getScene(key) as unknown as Choreographed & Phaser.Scene;
  }

  /** Về cảnh nguồn ngay: dừng mọi cảnh đang chạy, boot cảnh nguồn rồi bỏ qua phần vào. */
  private resetToSource(): void {
    for (const key of ['MenuScene', 'LevelSelectScene', 'PlayScene'] as const) {
      if (this.game.scene.isActive(key)) this.game.scene.stop(key);
    }
    director.boot(this.plan.source, this.plan.sourceData);
    director.skip();
  }

  private prepareAndGo(): void {
    if (this.plan.prepareWin) {
      const play = this.scene('PlayScene') as unknown as { runScript(name: 'win'): void };
      play.runScript('win');
      // win có 3 bước mỗi mảnh, cách 400 ms; 1-1 có 2 mảnh
      window.setTimeout(() => this.go(), 6 * 400 + DEMO_WIN_SETTLE_MS);
      return;
    }
    this.go();
  }

  private go(): void {
    const from = this.scene(this.plan.source);
    const origin = this.plan.source === 'LevelSelectScene'
      ? (from as unknown as { demoOrigin(): { x: number; y: number } }).demoOrigin()
      : undefined;
    director.go(from, this.plan.target, this.plan.targetData, { route: this.route, origin });
  }
}
```

- [ ] **Step 6: Nối trong `main.ts`**

Trong `game.events.once('ready', …)` của F1, bọc như sau:

```ts
game.events.once('ready', () => {
  if (devTools.demo) {
    new DemoRunner(game, devTools.demo, devTools.loop).start();
    return;
  }
  if (launch.scene === 'PlayScene') {
    director.boot('PlayScene', { levelId: launch.levelId, mode: launch.mode });
  } else {
    director.boot(launch.scene, {});
  }
});
```

Import `DemoRunner` từ `./presentation/dev/DemoRunner.ts`.

- [ ] **Step 7: Test, kiểm thủ công**

Run: `npx vitest run tests/demoPlan.test.ts && npm run typecheck && npm test`
Expected: PASS. Riêng `sceneStartGate` phải còn xanh, vì `DemoRunner` chỉ dùng `scene.stop` và `director.boot`.

Run: `npm run dev`. Mở lần lượt 7 đường dẫn `/?demo=<route>&loop=1&motion=0.25`, từ `menu-to-play` tới `map-to-menu`.

Expected:
- Mỗi tuyến tự chạy và lặp.
- Giữa hai lần lặp, cảnh nguồn hiện ngay rồi nghỉ khoảng 0.6 s.
- `next-level` thắng 1-1 trước rồi mới sang 1-2.

- [ ] **Step 8: Changelog và commit**

```markdown
### 2026-10-03 - Add route demos with loop (F3 task 7)

- Added `dev/demoPlan.ts` (source and target scene with data for each of the seven routes) and `dev/DemoRunner.ts`: `demo=<route>` boots the source scene, runs the route through the director, and `loop=1` snaps back to the source without animation, rests 600 ms and repeats; `next-level` wins 1-1 first. `LevelSelectScene.demoOrigin()` supplies the current node as the tap origin.
- Verification: `tests/demoPlan.test.ts` failed for the missing module, then passed; `sceneStartGate` still passes; `npm run typecheck` and `npm test` passed; manual dev-server run of all seven demos in slow motion.
```

```bash
git add game-next/src/presentation/dev/demoPlan.ts game-next/src/presentation/dev/DemoRunner.ts game-next/src/presentation/LevelSelectScene.ts game-next/src/main.ts game-next/tests/demoPlan.test.ts CHANGELOG.md
git commit -m "feat(dev): add looping route demos"
```

---

### Task 8: Hồ sơ nghiệm thu

**Files:**
- Create: `docs/testing/motion/README.md`
- Create: `docs/testing/motion/f1-acceptance.md`
- Create: `docs/testing/motion/f2-acceptance.md`

**Phân bổ ma trận** (31 mục của spec F3 mục 4):
- `f1-acceptance.md`: T1-01 → T1-10 và R-01 → R-04; hiệu năng P-01, P-04, P-05.
- `f2-acceptance.md`: T2-01 → T2-17 và R-01 → R-04; hiệu năng P-02 → P-07.

R chạy lại ở cả hai lần nghiệm thu, vì F1 merge trước F2. Tổng mục khác nhau: 10 + 17 + 4 = 31.

- [ ] **Step 1: Viết `README.md`**

`docs/testing/motion/README.md`:

````markdown
# Nghiệm thu chuyển động — F1, F2

Spec: [`2026-10-03-f3-motion-acceptance-design.md`](../../superpowers/specs/2026-10-03-f3-motion-acceptance-design.md)

| Hồ sơ | Spec | Trạng thái |
|---|---|---|
| [F1 Chuyển cảnh](f1-acceptance.md) | [F1](../../superpowers/specs/2026-10-03-f1-scene-transitions-design.md) | `pending` |
| [F2 Cảm giác trong màn](f2-acceptance.md) | [F2](../../superpowers/specs/2026-10-03-f2-in-level-game-feel-design.md) | `pending` |

## Đường dẫn dev

Chạy `cd game-next && npm run dev`, rồi mở:

- Soi chuyển cảnh chậm: <http://localhost:5173/?demo=menu-to-play&loop=1&motion=0.25>
- Đo chuyển cảnh: <http://localhost:5173/?demo=menu-to-play&loop=1&perf=1&fps=1>
- Đo chuỗi thắng: <http://localhost:5173/?scene=play&level=1-6&mode=harness&autosolve=win&perf=1&fps=1>
- Soi vùng giao: <http://localhost:5173/?scene=play&level=1-3&mode=harness&autosolve=overlap-hollow&motion=0.25>
- Xoay và xoay bị chặn: <http://localhost:5173/?scene=play&level=fixture-rotate&mode=harness&autosolve=rotate-blocked>
- Giao ba lớp: <http://localhost:5173/?scene=play&level=fixture-rotate&mode=harness&autosolve=overlap-revive>

Tuyến cho `demo`: `menu-to-play`, `map-to-play`, `next-level`, `play-to-map`, `play-to-menu`, `menu-to-map`, `map-to-menu`.

Kịch bản cho `autosolve`: `win`, `drag`, `snap`, `return`, `rotate`, `rotate-blocked`, `overlap-hollow`, `overlap-revive`, `reset`. Lưu ý:
- 1-1 không có neo chồng nhau, nên dùng 1-3 để soi vùng giao.
- Chỉ `fixture-rotate` có giao ba lớp và xoay.

## Bản cài nghiệm thu trên thiết bị

```bash
cd game-next
VITE_MOTION_TOOLS=1 npm run android:sync   # PowerShell: $env:VITE_MOTION_TOOLS='1'; npm run android:sync
```

Mở `game-next/android` trong Android Studio, build APK debug và cài lên máy chuẩn. Đọc số đo từ Chrome desktop:
1. Mở `chrome://inspect`, chọn WebView của Mirror, bấm Inspect.
2. Trong console, gõ `copy(JSON.stringify(window.__motionPerf, null, 2))` rồi dán vào hồ sơ.

Trên APK không có thanh địa chỉ. Để dùng tham số, chạy trong console của WebView:

```js
location.search = '?demo=menu-to-play&loop=1&perf=1&fps=1'
```

Kiểm R-04 bằng bản build **không** có cờ: `npm run android:sync`.
````

- [ ] **Step 2: Viết `f1-acceptance.md`**

`docs/testing/motion/f1-acceptance.md`:

```markdown
# Hồ sơ nghiệm thu — F1 Chuyển cảnh

* **Ngày:** YYYY-MM-DD
* **Trạng thái:** `pending`
* **Commit nghiệm thu:** `<hash>`
* **Người duyệt:** NKhanh0908
* **Spec:** [`2026-10-03-f1-scene-transitions-design.md`](../../superpowers/specs/2026-10-03-f1-scene-transitions-design.md)

## Thiết bị

| Vai trò | Máy | Android / WebView | Renderer |
|---|---|---|---|
| Chuẩn | … | … | WebGL / Canvas |
| Desktop | Chrome … (390 × 844, CPU 4× chậm) | — | WebGL |

## Hiệu năng

Ngưỡng: P-01 p95 ≤ 18.2 ms · P-04 max ≤ 50 ms · P-05 > 20 ms ≤ 3 khung.

| Cửa sổ | Máy | p95 ms | max ms | > 20 ms | Đạt |
|---|---|---|---|---|---|
| menu-to-play | Desktop | | | | |
| map-to-play | Desktop | | | | |
| next-level | Desktop | | | | |
| play-to-map | Desktop | | | | |
| play-to-menu | Desktop | | | | |
| menu-to-map | Desktop | | | | |
| map-to-menu | Desktop | | | | |
| menu-to-play | Chuẩn | | | | |
| map-to-play | Chuẩn | | | | |
| next-level | Chuẩn | | | | |
| play-to-map | Chuẩn | | | | |
| play-to-menu | Chuẩn | | | | |
| menu-to-map | Chuẩn | | | | |
| map-to-menu | Chuẩn | | | | |

<details><summary>Dòng JSON gốc</summary>

```json
[]
```

</details>

## Ma trận

| Mã | Cách | Kết quả | Ghi chú |
|---|---|---|---|
| T1-01 | A + D + T | | |
| T1-02 | D + T | | |
| T1-03 | D + T | | |
| T1-04 | A + D | | |
| T1-05 | A + T | | |
| T1-06 | A + T | | |
| T1-07 | A + T | | |
| T1-08 | A + T | | |
| T1-09 | A + T | | |
| T1-10 | D | | |
| R-01 | A | | |
| R-02 | D | | |
| R-03 | A + T | | |
| R-04 | A | | |

Kết quả: `passed`, `failed` hoặc `waived`. Chỉ được ghi `waived` khi người duyệt nói rõ, và phải ghi lý do ở cột Ghi chú.

## Ghi chú của người review

> 
```

- [ ] **Step 3: Viết `f2-acceptance.md`**

`docs/testing/motion/f2-acceptance.md`: phần đầu, Thiết bị và Ghi chú của người review giống hệt `f1-acceptance.md`, chỉ khác tiêu đề `# Hồ sơ nghiệm thu — F2 Cảm giác trong màn` và dòng Spec trỏ tới `2026-10-03-f2-in-level-game-feel-design.md`. Hai phần còn lại:

```markdown
## Hiệu năng

Ngưỡng: P-02, P-03 p95 ≤ 18.2 ms · P-04 max ≤ 50 ms · P-05 > 20 ms ≤ 3 khung · P-06 texture ≤ 24 MB · P-07 `evaluate` = 0 (test tự động).

| Cửa sổ | Máy | p95 ms | max ms | > 20 ms | Đạt |
|---|---|---|---|---|---|
| drag 5 s, 1-6 (P-02) | Desktop | | | | |
| won, 1-6 (P-03) | Desktop | | | | |
| snap | Desktop | | | | |
| overlap-hollow, 1-3 | Desktop | | | | |
| drag 5 s, 1-6 (P-02) | Chuẩn | | | | |
| won, 1-6 (P-03) | Chuẩn | | | | |
| snap | Chuẩn | | | | |
| overlap-hollow, 1-3 | Chuẩn | | | | |

| P-06 texture mảnh | Màn | MB (overlay `tex`) | Đạt |
|---|---|---|---|
| Desktop | 1-1 → 1-6, ghi màn lớn nhất | | |
| Chuẩn | 1-1 → 1-6, ghi màn lớn nhất | | |

<details><summary>Dòng JSON gốc</summary>

```json
[]
```

</details>

## Ma trận

| Mã | Cách | Kết quả | Ghi chú |
|---|---|---|---|
| T2-01 | D + T | | |
| T2-02 | D + T | | |
| T2-03 | T | | |
| T2-04 | D + T | | |
| T2-05 | D + T | | |
| T2-06 | D + T | | |
| T2-07 | D + T | | |
| T2-08 | D + T | | `level=fixture-rotate` |
| T2-09 | A + D + T | | `level=fixture-rotate` |
| T2-10 | A + D + T | | 1-3 cho 2 lớp, `fixture-rotate` cho 3 lớp |
| T2-11 | D + T | | |
| T2-12 | A + D + T | | |
| T2-13 | A + T | | |
| T2-14 | T | | |
| T2-15 | A + T | | |
| T2-16 | A + T | | |
| T2-17 | A + D | | |
| R-01 | A | | |
| R-02 | D | | |
| R-03 | A + T | | |
| R-04 | A | | |

Kết quả: `passed`, `failed` hoặc `waived`. Chỉ được ghi `waived` khi người duyệt nói rõ, và phải ghi lý do ở cột Ghi chú.
```

- [ ] **Step 4: Đếm mục**

Run: `grep -cE "^\| (T1|T2|R)-[0-9]+" docs/testing/motion/f1-acceptance.md docs/testing/motion/f2-acceptance.md`
Expected: `f1-acceptance.md:14`, `f2-acceptance.md:21`. Trừ 4 mục R lặp lại, còn 10 + 17 + 4 = 31.

- [ ] **Step 5: Changelog và commit**

```markdown
### 2026-10-03 - Add motion acceptance records (F3 task 8)

- Added `docs/testing/motion/README.md` (dev links, autosolve and demo names, acceptance APK build with `VITE_MOTION_TOOLS=1`, reading `window.__motionPerf` through `chrome://inspect`) and pending records `f1-acceptance.md` (T1-01..T1-10, R-01..R-04, P-01/P-04/P-05) and `f2-acceptance.md` (T2-01..T2-17, R-01..R-04, P-02..P-07) following the content-review format.
- Verification: matrix rows counted (31 distinct items); links checked against existing spec paths; no runtime code changed.
```

```bash
git add docs/testing/motion CHANGELOG.md
git commit -m "docs(testing): add motion acceptance records"
```

---

### Task 9: Claude chạy phần A và D, điền số đo desktop

**Files:**
- Modify: `docs/testing/motion/f1-acceptance.md`
- Modify: `docs/testing/motion/f2-acceptance.md`
- Modify: `CHANGELOG.md`

Người duyệt đã miễn chụp ảnh Chrome. Phần D là Claude kiểm bằng mắt trên dev server cộng số đo `perf=1`, không lưu ảnh vào repo.

- [ ] **Step 1: Phần A**

Run: `cd game-next && npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: tất cả PASS. Vite vẫn có thể báo chunk lớn, đây là cảnh báo cũ. Ghi `passed` cho R-01 ở cả hai hồ sơ.

Ánh xạ test tự động sang mục A. Ghi `passed` khi test tương ứng xanh:

| Mục | Test |
|---|---|
| T1-01, T1-04 | `transitionRoutes.test.ts`, `sceneDirector.test.ts`, `demoPlan.test.ts` |
| T1-05, T1-06, T1-07, T1-08 | `sceneDirector.test.ts` (skip, go lần hai, skip khi Back/xuống nền, khoá input) |
| T1-09, R-03 | `sceneDirector.test.ts` (Giảm chuyển động), `progress.test.ts` (bản lưu cũ) |
| T2-09, T2-10 | `autosolveScripts.test.ts`, `content.test.ts`, `feedbackEvents.test.ts` của F2 |
| T2-12, T2-13 | `victorySequence.test.ts` của F2 |
| T2-15, T2-16 | `pieceMotion.test.ts`, `haptics.test.ts`, `progress.test.ts` của F2 |
| T2-17 | `boardRendererLayers.test.ts` |
| R-02 | `autosolveScripts.test.ts` (win sáu màn), rồi xác nhận bằng mắt ở Step 3 |
| R-04 | `launchParams.test.ts`, `catalog.test.ts` |
| P-07 | test spy `evaluate` của F2 trong `playController.test.ts` |

- [ ] **Step 2: Đo desktop**

Chuẩn bị:
1. Run `npm run dev`.
2. Chrome bản ổn định, DevTools → device mode 390 × 844 → Performance → CPU 4× slowdown, giữ DevTools mở trong lúc đo.
3. Mỗi cửa sổ đo **ba lần**. Ghi lần có p95 **cao nhất** (cách bảo thủ).

Bảy tuyến F1, với mỗi `<route>` mở `http://localhost:5173/?demo=<route>&loop=1&perf=1&fps=1`, để chạy 4 vòng, rồi trong console:

```js
copy(JSON.stringify(window.__motionPerf.filter((l) => l.window !== 'boot'), null, 2))
```

Dán vào khối "Dòng JSON gốc" của `f1-acceptance.md`. Điền bảng Hiệu năng hàng Desktop.

F2:
- **Chuỗi thắng (P-03):** `?scene=play&level=1-6&mode=harness&autosolve=win&perf=1&fps=1`, lấy dòng `won`.
- **Kéo 5 s (P-02):** `?scene=play&level=1-6&mode=harness&perf=1&fps=1`, kéo một mảnh qua lại liên tục khoảng 5 giây rồi thả. Lấy dòng `drag` có `durationMs` từ 4500 trở lên.
- **Snap:** dòng `snap` từ lần đo trên.
- **Vùng giao:** `?scene=play&level=1-3&mode=harness&autosolve=overlap-hollow&perf=1`, lấy dòng `overlap-hollow`.
- **P-06:** mở lần lượt 1-1 → 1-6 với `fps=1`, ghi số `tex` lớn nhất cùng tên màn.

Dán JSON vào `f2-acceptance.md`.

Cột "Đạt" ghi `✓` hoặc `✗` theo ngưỡng. Một hàng Desktop `✗` không tự làm mục `failed` (ngưỡng đặt cho thiết bị chuẩn), nhưng phải ghi rõ ở Ghi chú để người duyệt biết.

- [ ] **Step 3: Phần D**

Với mỗi mục có D trong ma trận, mở đường dẫn tương ứng ở README (thêm `motion=0.25` khi cần soi), kiểm theo cột "Tiêu chí đạt" của spec F3 mục 4, rồi ghi `passed` hoặc `failed` kèm một câu ghi chú cụ thể. Ví dụ: "rune sáng B→Đ→N→T, không khung trống ở `motion=0.25`".

Các mục chỉ có T (T2-03, T2-14) **để trống** cho người duyệt. Mục có cả D và T: ghi kết quả D vào Ghi chú, để cột Kết quả trống chờ phần T.

- [ ] **Step 4: Giữ trạng thái `pending`**

Ở đầu cả hai hồ sơ:
- Ngày: ngày đo.
- Commit nghiệm thu: lấy từ `git rev-parse --short HEAD` **trước** commit này.
- Dòng Thiết bị Desktop: ghi phiên bản Chrome (`chrome://version`).
- Trạng thái giữ `pending`.
- Không điền "Ghi chú của người review".

- [ ] **Step 5: Changelog và commit**

```markdown
### 2026-10-03 - Record automated and desktop motion acceptance (F3 task 9)

- Filled the automated (A) and desktop (D) parts of `docs/testing/motion/f1-acceptance.md` and `f2-acceptance.md`, with raw `perf=1` JSON lines for the seven routes, the 1-6 drag and victory windows, snap, overlap and the largest piece-texture footprint; both records stay `pending` for device checks by the reviewer.
- Verification: `npm run typecheck`, `npm test`, `npm run content:validate` and `npm run build` passed; desktop Chrome at 390 × 844 with 4× CPU throttling, worst of three runs per window. Chrome screenshots waived by the user.
```

```bash
git add docs/testing/motion CHANGELOG.md
git commit -m "docs(testing): record automated and desktop motion acceptance"
```

Sau commit này, nhắn người duyệt: hai hồ sơ đang chờ phần T và số đo trên thiết bị chuẩn. Người duyệt chuyển `passed` bằng một câu trích nguyên văn.

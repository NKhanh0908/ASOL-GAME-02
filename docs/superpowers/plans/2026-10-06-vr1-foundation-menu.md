# VR1 Visual Refactor — Shared Foundation and Main Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the purple from the shared sky gradient, replace scattered decorative glow with a declared four-tier ladder, and rebuild the Main Menu around a hero that animates the XOR rule.

**Architecture:** All work is in `game-next/src/presentation/`. Pure geometry and token data go in their own modules with Vitest coverage; Phaser rendering consumes them and is verified by hand, matching how this repo already separates `pieceMotion.ts` / `constellationMotion.ts` from their scenes. The one extraction is the menu emblem, which is being rewritten anyway.

**Tech Stack:** TypeScript 5.7, Phaser 3.90, Vitest 2, Vite 6. Run everything from `game-next/`.

**Spec:** `docs/superpowers/specs/2026-10-05-visual-refactor-foundation-menu-design.md`

**Depends on:** VR0 (`specs/2026-10-06-vr0-motion-language-design.md`) must land
first. Every easing and duration in this plan is read from `MOTION_FAMILIES`
rather than chosen locally — that is the whole reason VR0 was sequenced ahead.

## Global Constraints

- Node `>=24.13.1 <25`. All commands run from `game-next/`.
- Three colour families only: navy, ice glass, amber gold. `#4ECDC4` and purple outside these families are banned.
- New sky stops, verbatim: `['#1A2470', '#1E2A80', '#24307F', '#1B2563']`.
- Logo extrusion, verbatim: `#11204F` then `#0B163A`. Logo ivory highlight: `#FFF4D6`.
- Glow is a state, not decoration. Exactly one tier-3 element per screen.
- `sky.stops` is shared by all three scenes — every change is checked against Menu, Level Select and Gameplay.
- Test titles in this repo are written in Vietnamese; match the surrounding files. Code comments, commit messages and docs are English per `AGENTS.md`.
- Reduced Motion is read through `isReducedMotion()` / `getMotionScale()` in `src/presentation/transitions/motion.ts`.
- Easing and duration come from `MOTION_FAMILIES` (VR0). Menu buttons and the ripple are the `ui` family; the emblem orbit and its star are `magic`. Never write a raw easing name or duration literal in a scene.
- Every commit that changes code or docs adds its `CHANGELOG.md` entry.
- Run `impact({target})` before editing a symbol, and `detect_changes()` before committing, per `AGENTS.md`.

---

### Task 1: Palette truth — cut the purple and remove banned colours

Two existing tests assert the old values and will fail until updated; that is intended and is the signal this task is working.

**Files:**
- Modify: `src/presentation/designTokens.ts` (`COLOR_TOKENS.sky.stops`, `COLOR_NUMBERS.skyBottom`)
- Modify: `src/presentation/feedback/FeedbackDirector.ts:322-323`
- Modify: `src/presentation/transitions/stardust.ts:17`
- Test: `tests/designTokens.test.ts` (update), `tests/bannedColors.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `COLOR_TOKENS.sky.stops` as the four new hex strings; `COLOR_NUMBERS.skyBottom = 0x1b2563`. Tasks 5–7 read these.

- [ ] **Step 1: Write the failing repo-wide guard test**

The existing guard only stringifies `COLOR_TOKENS`, which is why `#4ECDC4` survived in two other files. This one reads source.

Create `tests/bannedColors.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Collect every .ts file under src/ */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

const BANNED = [
  // Teal the GDD removed by name. Has now survived two cleanups.
  /4ECDC4/i,
  // Purple sky tail cut by VR1.
  /6B4BA8/i,
  /4A3A9E/i,
  // Stray yellow that is not an amber token.
  /FFD166/i,
];

describe('Màu bị cấm không được quay lại', () => {
  const files = sourceFiles('src');

  test('quét toàn bộ src/ không còn mã màu ngoài ba họ màu', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of BANNED) {
        if (pattern.test(text)) offenders.push(`${file} chứa ${pattern.source}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test('quét có tác dụng thật: bắt được chuỗi mồi', () => {
    // Guards the guard: if the scan silently found no files, the test above
    // would pass vacuously.
    expect(files.length).toBeGreaterThan(40);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- bannedColors`
Expected: FAIL — offenders lists `src/presentation/feedback/FeedbackDirector.ts` (4ECDC4 and FFD166), `src/presentation/transitions/stardust.ts` (4ECDC4), and `src/presentation/designTokens.ts` (6B4BA8, 4A3A9E).

- [ ] **Step 3: Cut the purple in the tokens**

In `src/presentation/designTokens.ts`, inside `COLOR_TOKENS.sky`:

```ts
    stops: ['#1A2470', '#1E2A80', '#24307F', '#1B2563'],
```

and in `COLOR_NUMBERS`:

```ts
  skyBottom: 0x1b2563,
```

- [ ] **Step 4: Remove the banned colours from the two consumers**

`src/presentation/feedback/FeedbackDirector.ts`, replacing lines 322–323:

```ts
      if (s.a1 > 0) { g.lineStyle(2.5, COLOR_NUMBERS.amberSolid, s.a1); g.strokeCircle(c.x, c.y, s.r1); }
      if (s.a2 > 0) { g.lineStyle(1.8, COLOR_NUMBERS.icePrimary, s.a2); g.strokeCircle(c.x, c.y, s.r2); }
```

Add the import if the file does not already have it:

```ts
import { COLOR_NUMBERS } from '../designTokens.ts';
```

`src/presentation/transitions/stardust.ts` line 17:

```ts
const DUST_COLORS = [0xffc857, 0xf9c74f, 0xa9e3ff, 0xffffff] as const;
```

- [ ] **Step 5: Update the stale assertions in the existing token test**

`tests/designTokens.test.ts` currently asserts the old gradient. Replace that expectation:

```ts
    expect(COLOR_TOKENS.sky.stops).toEqual(['#1A2470', '#1E2A80', '#24307F', '#1B2563']);
```

Leave the other assertions in that test alone.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, including `bannedColors` and `designTokens`.

- [ ] **Step 7: Check all three scenes by eye**

Run: `npm run dev`, then open in turn:
- `?scene=menu`
- `?scene=map`
- `?scene=play&level=1-3&mode=harness`

Expected: no magenta cast at the bottom of any screen; the gradient stays navy-blue top to bottom.

- [ ] **Step 8: Commit**

```bash
git add src/presentation/designTokens.ts src/presentation/feedback/FeedbackDirector.ts src/presentation/transitions/stardust.ts tests/designTokens.test.ts tests/bannedColors.test.ts CHANGELOG.md
git commit -m "fix(visual): cut purple sky tail and remove banned colours"
```

---

### Task 2: Declare the glow ladder

**Files:**
- Modify: `src/presentation/designTokens.ts`
- Test: `tests/glowTiers.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `GLOW_TIERS: Record<0|1|2|3, GlowTier>` where `GlowTier = { blur: number; alpha: number; color: string }`, tier 0 being `{ blur: 0, alpha: 0, color: 'transparent' }`.
  - `SCREEN_FOCUS: Record<'menu'|'map'|'play', string>` naming the single tier-3 element per screen.
  - `glowTier(tier)` returning the tier record.

  Tasks 4–7 read these instead of hard-coding shadow numbers.

- [ ] **Step 1: Write the failing test**

Create `tests/glowTiers.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { GLOW_TIERS, SCREEN_FOCUS, glowTier } from '../src/presentation/designTokens.ts';

describe('Thang glow bốn bậc', () => {
  test('bậc 0 là không phát sáng, không phải phát sáng rất nhẹ', () => {
    expect(GLOW_TIERS[0].blur).toBe(0);
    expect(GLOW_TIERS[0].alpha).toBe(0);
  });

  test('độ sáng tăng nghiêm ngặt theo bậc', () => {
    const blurs = [0, 1, 2, 3].map((t) => GLOW_TIERS[t as 0 | 1 | 2 | 3].blur);
    const sorted = [...blurs].sort((a, b) => a - b);
    expect(blurs).toEqual(sorted);
    expect(new Set(blurs).size).toBe(4);
  });

  test('mỗi màn khai báo đúng một tiêu điểm bậc 3', () => {
    expect(Object.keys(SCREEN_FOCUS).sort()).toEqual(['map', 'menu', 'play']);
    for (const name of Object.values(SCREEN_FOCUS)) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  test('tiêu điểm của menu là nút Tiếp tục', () => {
    expect(SCREEN_FOCUS.menu).toBe('continueButton');
  });

  test('glowTier trả về đúng bản ghi', () => {
    expect(glowTier(3)).toBe(GLOW_TIERS[3]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- glowTiers`
Expected: FAIL — `GLOW_TIERS` is not exported.

- [ ] **Step 3: Add the tokens**

Append to `src/presentation/designTokens.ts`:

```ts
export type GlowTier = Readonly<{ blur: number; alpha: number; color: string }>;

/**
 * Glow is a state, not default decoration. Tier 0 means no glow at all, not a
 * faint one — that distinction is what keeps the single tier-3 focus readable.
 */
export const GLOW_TIERS: Readonly<Record<0 | 1 | 2 | 3, GlowTier>> = {
  0: { blur: 0, alpha: 0, color: 'transparent' },
  1: { blur: 8, alpha: 0.25, color: '#A9E3FF' },
  2: { blur: 16, alpha: 0.4, color: '#A9E3FF' },
  3: { blur: 34, alpha: 0.85, color: '#FFC857' },
} as const;

/** The one tier-3 element each screen is allowed. */
export const SCREEN_FOCUS = {
  menu: 'continueButton',
  map: 'currentNode',
  play: 'draggingPiece',
} as const;

export function glowTier(tier: 0 | 1 | 2 | 3): GlowTier {
  return GLOW_TIERS[tier];
}
```

- [ ] **Step 4: Run the test**

Run: `npm test -- glowTiers`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/designTokens.ts tests/glowTiers.test.ts CHANGELOG.md
git commit -m "feat(visual): declare the four-tier glow ladder as tokens"
```

---

### Task 3: XOR overlap geometry for the menu emblem

Pure module, no Phaser. The current emblem paints a fixed navy diamond between the jewels; this computes the real intersection so it empties correctly at any separation.

**Files:**
- Create: `src/presentation/menu/dualJewelGeometry.ts`
- Test: `tests/dualJewelGeometry.test.ts`

**Interfaces:**
- Consumes: `jewelOutline(cx, cy, radius): Point[]` from `src/presentation/jewelGeometry.ts`; `clipConvex(subject, clip): Pt[]` and `polygonArea(polygon): number` from `src/presentation/polygonClip.ts`.
- Produces:
  - `EMBLEM_LOOP_MS = 6000`
  - `REST_OFFSET = 38`, `OVERLAP_OFFSET = 20` (half-distance between the two jewel centres, in pixels)
  - `emblemOffsetAt(tMs: number): number` — half-separation at a point in the loop
  - `emblemOverlap(offset: number, radius: number): Pt[]` — the intersection polygon, empty when the jewels do not meet
  - `emblemStarAlpha(tMs: number): number` — 0 to 1 for the star inside the empty region
  - `FROZEN_POSE_MS = 3400` — the pose held under Reduced Motion
  - `nextElapsed(currentMs: number, deltaMs: number, reduced: boolean): number` — the advance-or-freeze decision, kept pure so spec §6's Reduced Motion requirement is covered by a test rather than only by eye

  Task 4 renders from these.

- [ ] **Step 1: Write the failing tests**

Create `tests/dualJewelGeometry.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { polygonArea } from '../src/presentation/polygonClip.ts';
import {
  EMBLEM_LOOP_MS,
  FROZEN_POSE_MS,
  REST_OFFSET,
  OVERLAP_OFFSET,
  emblemOffsetAt,
  emblemOverlap,
  emblemStarAlpha,
  nextElapsed,
} from '../src/presentation/menu/dualJewelGeometry.ts';

const R = 68;

describe('Hình học vòng lặp XOR của biểu tượng Ngọc Đôi', () => {
  test('lúc nghỉ hai viên tách rời, không có vùng giao', () => {
    const offset = emblemOffsetAt(0);
    expect(offset).toBe(REST_OFFSET);
    expect(polygonArea(emblemOverlap(offset, R))).toBe(0);
  });

  test('tại 3,0s hai viên đã chồng, vùng giao có diện tích thật', () => {
    const offset = emblemOffsetAt(3000);
    expect(offset).toBeLessThan(REST_OFFSET);
    expect(polygonArea(emblemOverlap(offset, R))).toBeGreaterThan(0);
  });

  test('vùng giao lớn dần khi hai viên tiến lại gần nhau', () => {
    const far = polygonArea(emblemOverlap(30, R));
    const near = polygonArea(emblemOverlap(OVERLAP_OFFSET, R));
    expect(near).toBeGreaterThan(far);
  });

  test('ngôi sao chỉ sáng sau khi vùng giao đã hình thành', () => {
    expect(emblemStarAlpha(0)).toBe(0);
    expect(emblemStarAlpha(2000)).toBe(0);
    expect(emblemStarAlpha(FROZEN_POSE_MS)).toBeGreaterThan(0.5);
  });

  test('vòng lặp khép kín: đầu và cuối cùng một tư thế', () => {
    expect(emblemOffsetAt(0)).toBeCloseTo(emblemOffsetAt(EMBLEM_LOOP_MS), 5);
  });

  test('tư thế đóng băng của Giảm chuyển động có cả vùng giao lẫn ngôi sao', () => {
    const offset = emblemOffsetAt(FROZEN_POSE_MS);
    expect(polygonArea(emblemOverlap(offset, R))).toBeGreaterThan(0);
    expect(emblemStarAlpha(FROZEN_POSE_MS)).toBeGreaterThan(0.5);
  });

  test('bật Giảm chuyển động thì thời gian không tiến, luôn giữ tư thế đã chồng', () => {
    expect(nextElapsed(0, 16, true)).toBe(FROZEN_POSE_MS);
    expect(nextElapsed(FROZEN_POSE_MS, 16, true)).toBe(FROZEN_POSE_MS);
    // Many frames later it is still the same pose, not drifting.
    let t = 0;
    for (let i = 0; i < 100; i++) t = nextElapsed(t, 16, true);
    expect(t).toBe(FROZEN_POSE_MS);
  });

  test('tắt Giảm chuyển động thì thời gian tiến bình thường', () => {
    expect(nextElapsed(0, 16, false)).toBe(16);
    expect(nextElapsed(1000, 16, false)).toBe(1016);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test -- dualJewelGeometry`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `src/presentation/menu/dualJewelGeometry.ts`:

```ts
import { jewelOutline } from '../jewelGeometry.ts';
import { clipConvex, type Pt } from '../polygonClip.ts';

/** Full loop length. The reviewer chose the full XOR reveal over a hint. */
export const EMBLEM_LOOP_MS = 6000;

/** Half-distance between the two jewel centres, in pixels. */
export const REST_OFFSET = 38;
export const OVERLAP_OFFSET = 20;

/** Pose held when Reduced Motion is on: overlapped, star lit. */
export const FROZEN_POSE_MS = 3400;

const APPROACH_START_MS = 800;
const APPROACH_END_MS = 3000;
const HOLD_END_MS = 4000;
const RETREAT_END_MS = 5400;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Half-separation of the jewel centres at a point in the loop. */
export function emblemOffsetAt(tMs: number): number {
  const t = ((tMs % EMBLEM_LOOP_MS) + EMBLEM_LOOP_MS) % EMBLEM_LOOP_MS;
  if (t <= APPROACH_START_MS) return REST_OFFSET;
  if (t <= APPROACH_END_MS) {
    const p = (t - APPROACH_START_MS) / (APPROACH_END_MS - APPROACH_START_MS);
    return lerp(REST_OFFSET, OVERLAP_OFFSET, easeInOut(p));
  }
  if (t <= HOLD_END_MS) return OVERLAP_OFFSET;
  if (t <= RETREAT_END_MS) {
    const p = (t - HOLD_END_MS) / (RETREAT_END_MS - HOLD_END_MS);
    return lerp(OVERLAP_OFFSET, REST_OFFSET, easeInOut(p));
  }
  return REST_OFFSET;
}

/**
 * Intersection of the two jewels. Empty when they do not meet, so the caller
 * can simply skip drawing rather than special-casing the rest pose.
 */
export function emblemOverlap(offset: number, radius: number): Pt[] {
  const left = jewelOutline(-offset, 0, radius);
  const right = jewelOutline(offset, 0, radius);
  if (offset * 2 >= radius * 2) return [];
  return clipConvex(left, right);
}

/** Star fades in once the overlap exists, and out again as the jewels part. */
export function emblemStarAlpha(tMs: number): number {
  const t = ((tMs % EMBLEM_LOOP_MS) + EMBLEM_LOOP_MS) % EMBLEM_LOOP_MS;
  if (t <= APPROACH_END_MS) return 0;
  if (t <= FROZEN_POSE_MS) {
    return (t - APPROACH_END_MS) / (FROZEN_POSE_MS - APPROACH_END_MS);
  }
  if (t <= HOLD_END_MS) return 1;
  if (t <= RETREAT_END_MS) {
    return 1 - (t - HOLD_END_MS) / (RETREAT_END_MS - HOLD_END_MS);
  }
  return 0;
}

/**
 * Advance the loop, or hold the taught pose when Reduced Motion is on. Kept
 * here rather than inside the renderer so the behaviour is covered by a test
 * instead of only by eye.
 */
export function nextElapsed(currentMs: number, deltaMs: number, reduced: boolean): number {
  return reduced ? FROZEN_POSE_MS : currentMs + deltaMs;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- dualJewelGeometry`
Expected: PASS, all eight.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/menu/dualJewelGeometry.ts tests/dualJewelGeometry.test.ts CHANGELOG.md
git commit -m "feat(menu): add real XOR overlap geometry for the dual jewel emblem"
```

---

### Task 4: Extract and rewrite the emblem renderer

**Files:**
- Create: `src/presentation/menu/DualJewelEmblem.ts`
- Modify: `src/presentation/MenuScene.ts` — delete `renderDualJewelEmblem`, `drawFacetedJewel`, `drawDiamond`, `drawSparkle` (currently lines 793–941), and the emblem branch of `update`

**Interfaces:**
- Consumes: Task 3's exports; `glowTier` from Task 2; `isReducedMotion` from `src/presentation/transitions/motion.ts`.
- Produces: `class DualJewelEmblem` with
  - `constructor(scene: Phaser.Scene, x: number, y: number)`
  - `update(deltaMs: number): void`
  - `graphics(): Phaser.GameObjects.Graphics[]` — for `transitionParts()`
  - `setRingSpeed(speed: number): void` — the existing `MENU_SPECIAL.spinPeak` hook

- [ ] **Step 1: Run impact analysis first**

Run `impact({target: "renderDualJewelEmblem", direction: "upstream"})` and report the blast radius before editing, per `AGENTS.md`. Expected: callers are `MenuScene.update` and `transitionParts` only. **Stop and report to the user if it comes back HIGH or CRITICAL.**

- [ ] **Step 2: Write the renderer**

Create `src/presentation/menu/DualJewelEmblem.ts`. It owns the two graphics objects the scene used to own:

```ts
import Phaser from 'phaser';
import { COLOR_NUMBERS, glowTier } from '../designTokens.ts';
import { jewelOutline } from '../jewelGeometry.ts';
import { getMotionScale, isReducedMotion } from '../transitions/motion.ts';
import {
  emblemOffsetAt,
  emblemOverlap,
  emblemStarAlpha,
  nextElapsed,
} from './dualJewelGeometry.ts';

const JEWEL_RADIUS = 68;
const ORBIT_RADIUS = 150;

export class DualJewelEmblem {
  private readonly emblemGraphics: Phaser.GameObjects.Graphics;
  private readonly sparkleGraphics: Phaser.GameObjects.Graphics;
  private elapsedMs = 0;
  private ringAngle1 = 0;
  private ringAngle2 = 0;
  private ringSpeed = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.emblemGraphics = scene.add.graphics().setPosition(x, y);
    this.sparkleGraphics = scene.add.graphics().setPosition(x, y);
  }

  graphics(): Phaser.GameObjects.Graphics[] {
    return [this.emblemGraphics, this.sparkleGraphics];
  }

  setRingSpeed(speed: number): void {
    this.ringSpeed = speed;
  }

  update(deltaMs: number): void {
    // Reduced Motion holds the taught pose rather than switching the lesson
    // off: the overlap and its star stay on screen, nothing moves.
    const reduced = isReducedMotion();
    this.elapsedMs = nextElapsed(this.elapsedMs, deltaMs, reduced);
    if (!reduced) {
      const spin = this.ringSpeed * getMotionScale();
      this.ringAngle1 += deltaMs * 0.0003 * spin;
      this.ringAngle2 -= deltaMs * 0.0002 * spin;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.emblemGraphics;
    const s = this.sparkleGraphics;
    g.clear();
    s.clear();

    const offset = emblemOffsetAt(this.elapsedMs);

    // Tier 1: the orbit is structure, not an invitation.
    const ring = glowTier(1);
    g.lineStyle(1.2, COLOR_NUMBERS.icePrimary, ring.alpha);
    g.strokeCircle(0, 0, ORBIT_RADIUS);
    this.drawOrbitDust(g);

    // Both jewels, then the overlap punched out in sky navy.
    for (const cx of [-offset, offset]) {
      g.fillStyle(COLOR_NUMBERS.amberSolid, 1);
      g.fillPoints(jewelOutline(cx, 0, JEWEL_RADIUS).map((p) => new Phaser.Geom.Point(p.x, p.y)), true);
    }

    const overlap = emblemOverlap(offset, JEWEL_RADIUS);
    if (overlap.length >= 3) {
      g.fillStyle(COLOR_NUMBERS.skyBottom, 1);
      g.fillPoints(overlap.map((p) => new Phaser.Geom.Point(p.x, p.y)), true);

      const alpha = emblemStarAlpha(this.elapsedMs);
      if (alpha > 0) this.drawStar(s, 0, 0, 14, alpha);
    }
  }

  private drawOrbitDust(g: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < 4; i++) {
      const a = this.ringAngle1 + (i * Math.PI) / 2;
      g.fillStyle(COLOR_NUMBERS.textSecondary, 0.6);
      g.fillCircle(Math.cos(a) * ORBIT_RADIUS, Math.sin(a) * ORBIT_RADIUS, 3);
    }
    for (let i = 0; i < 4; i++) {
      const a = this.ringAngle2 + (i * Math.PI) / 2 + Math.PI / 4;
      g.fillStyle(COLOR_NUMBERS.gridModule, 0.5);
      g.fillCircle(Math.cos(a) * 125, Math.sin(a) * 125, 2.5);
    }
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    alpha: number
  ): void {
    g.fillStyle(0xffffff, alpha);
    const pts = [
      new Phaser.Geom.Point(cx, cy - r),
      new Phaser.Geom.Point(cx + r * 0.28, cy - r * 0.28),
      new Phaser.Geom.Point(cx + r, cy),
      new Phaser.Geom.Point(cx + r * 0.28, cy + r * 0.28),
      new Phaser.Geom.Point(cx, cy + r),
      new Phaser.Geom.Point(cx - r * 0.28, cy + r * 0.28),
      new Phaser.Geom.Point(cx - r, cy),
      new Phaser.Geom.Point(cx - r * 0.28, cy - r * 0.28),
    ];
    g.fillPoints(pts, true);
  }
}
```

- [ ] **Step 3: Wire it into the scene**

In `src/presentation/MenuScene.ts`:

- Add `import { DualJewelEmblem } from './menu/DualJewelEmblem.ts';`
- Replace the `emblemGraphics` and `sparkleGraphics` fields with `private emblem!: DualJewelEmblem;`
- Where those graphics were created (around line 64), construct `this.emblem = new DualJewelEmblem(this, 360, 500 + this.blockOffsetY);`
- Replace the body of `update` with:

```ts
  override update(_time: number, delta: number): void {
    this.emblem.update(delta);
  }
```

- In `transitionParts()`, replace `emblem: [this.emblemGraphics, this.sparkleGraphics]` with `emblem: this.emblem.graphics()`
- In `playIn`, replace the `this.emblemMotion` tween target with `this.emblem.setRingSpeed(MENU_SPECIAL.spinPeak)` at `MENU_SPECIAL.spinAtMs`
- Delete `renderDualJewelEmblem`, `drawFacetedJewel`, `drawDiamond`, `drawSparkle`, the `emblemMotion`, `ringAngle1`, `ringAngle2` and `pulseTime` fields

Keep `drawSparkle`'s remaining caller at line 467 working: if the logo sheen still needs it, move that one call to a local helper in the logo code rather than keeping the whole emblem block.

- [ ] **Step 4: Typecheck and test**

Run: `npm run typecheck && npm test`
Expected: both clean. Typecheck is what catches a missed reference to a deleted field.

- [ ] **Step 5: Verify the loop and Reduced Motion by eye**

Run: `npm run dev`, open `?scene=menu`.
Expected: jewels drift together over ~2s, the overlap empties to navy, a star fades in, they part, loop repeats on a 6s cycle.
Then enable Giảm chuyển động in Settings and reopen the menu.
Expected: the emblem sits still in the overlapped pose with the star visible — not separated, not moving.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/menu/DualJewelEmblem.ts src/presentation/MenuScene.ts CHANGELOG.md
git commit -m "refactor(menu): extract dual jewel emblem and animate the XOR rule"
```

---

### Task 5: Menu layout C and the fact caption

**Files:**
- Modify: `src/presentation/MenuScene.ts` (`buildMainMenu`, around lines 76–375)

**Interfaces:**
- Consumes: `LAYOUT_TOKENS.canvas` (720×1280), Task 2's `glowTier`.
- Produces: no new exports.

- [ ] **Step 1: Re-lay the vertical stack**

Order top to bottom, on the 720×1280 canvas: top bar (unchanged) → logo block → hero → fact caption → Continue → Level Select → footer. The hero takes the largest share because it now carries the animation; the buttons move down into thumb reach and fill what was ~28% dead space.

Target centres, to adjust against the running build rather than treat as exact:

```
logo block      y ≈ 300
hero centre     y ≈ 620   (orbit radius 150, so it spans ~470–770)
fact caption    y ≈ 830
Continue        y ≈ 980
Level Select    y ≈ 1075
footer          y ≈ 1240
```

- [ ] **Step 2: Upgrade the fact caption**

Layout C keeps the fact under the hero, so issue #2 is answered typographically. Raise its colour from the current dim blue to `#B9C9F2`, step the size up to `TYPO_TOKENS.fontSize.caption`, and prefix it with a ◆ so it reads as a deliberate element rather than stray subtitle text. No background panel — that would add another glowing object to a screen this work is calming.

- [ ] **Step 3: Apply the glow tiers**

Continue button uses `glowTier(3)`. Secondary button and the logo glass bar use `glowTier(1)`. The fact caption and the logo use `glowTier(0)`, meaning no shadow is set at all.

- [ ] **Step 4: Typecheck and test**

Run: `npm run typecheck && npm test`
Expected: clean.

- [ ] **Step 5: Check the shortest supported aspect**

Run: `npm run dev`, open `?scene=menu`, and resize the viewport to 16:9 (e.g. 720×1280 scaled to 405×720).
Expected: nothing overlaps; the footer stays clear of the Level Select button; the hero orbit is not clipped.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/MenuScene.ts CHANGELOG.md
git commit -m "feat(menu): adopt layout C and lift the astronomy fact caption"
```

---

### Task 6: Logo recolour

**Files:**
- Modify: `src/presentation/MenuScene.ts` (`buildCasualMirrorLogo`, lines 375–561)

**Interfaces:**
- Consumes: Task 2's `glowTier`.
- Produces: no new exports. The letterforms are not redrawn — this is colour only.

- [ ] **Step 1: Replace the purple extrusion and the glow**

| Part | Value |
|---|---|
| Face | `#FFC857` — unchanged |
| Top highlight | `#FFF4D6`, 1px offset up-left — replaces the glow |
| Extrusion | `#11204F` then `#0B163A` |
| Glow | removed — `glowTier(0)` |
| Reflection | kept, alpha lowered to `0.22` |

- [ ] **Step 2: Run the banned-colour guard**

Run: `npm test -- bannedColors`
Expected: PASS. If a purple literal remains in the logo code, this is what catches it.

- [ ] **Step 3: Full suite and typecheck**

Run: `npm run typecheck && npm test`
Expected: clean.

- [ ] **Step 4: Check by eye**

Run: `npm run dev`, open `?scene=menu`.
Expected: the logo reads as carved rather than lit; no purple halo; the Continue button is now clearly the brightest thing on screen.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/MenuScene.ts CHANGELOG.md
git commit -m "feat(menu): recolour the logo to ivory highlight and navy extrusion"
```

---

### Task 7: Settings gear and the diamond ripple

**Files:**
- Modify: `src/presentation/MenuScene.ts` (settings button construction; ripple at lines 650–715)

**Interfaces:**
- Consumes: Task 2's `glowTier`; `jewelOutline` from `src/presentation/jewelGeometry.ts`.
- Produces: `strokeDiamond(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void` exported from `src/presentation/menu/diamondMotif.ts`. VR3 reuses this for the snap pulse.

- [ ] **Step 0: Create the shared ◆ helper**

Spec §3.4 calls for one draw function instead of each site drawing its own diamond. Create `src/presentation/menu/diamondMotif.ts`:

```ts
import Phaser from 'phaser';
import { jewelOutline } from '../jewelGeometry.ts';

/** The ◆ motif, stroked. One function so every site agrees on the shape. */
export function strokeDiamond(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number
): void {
  const pts = jewelOutline(x, y, radius).map((p) => new Phaser.Geom.Point(p.x, p.y));
  g.strokePoints(pts, true);
}
```

- [ ] **Step 1: Close the gear outline**

The current icon draws spokes radiating from a centre, which reads as a sun beside the moon halo in the same corner. Replace it with a single closed path whose teeth are part of the outline, plus the centre ring.

- [ ] **Step 2: Turn the ripple into a diamond**

At `MenuScene.ts:663-665` the tap ripple currently strokes two concentric circles — this is the "mysterious badge" the reviewer saw on the orbit. Replace both `strokeCircle` calls with `strokeDiamond` from Step 0 at the same radii, and lower it to `glowTier(1)`:

```ts
        strokeDiamond(ripple, x, y, rippleData.radius);
        strokeDiamond(ripple, x, y, rippleData.radius * 0.7);
```

- [ ] **Step 3: Typecheck and test**

Run: `npm run typecheck && npm test`
Expected: clean.

- [ ] **Step 4: Check by eye**

Run: `npm run dev`, open `?scene=menu`, and tap the background.
Expected: a diamond ripple, not a circle; the settings icon no longer resembles the moon glow at the top right.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/MenuScene.ts CHANGELOG.md
git commit -m "feat(menu): close the settings gear outline and make the tap ripple a diamond"
```

---

### Task 8: Reconcile the GDD palette table

Spec §2 decision 1 makes the code authoritative, so the document follows the code — not the reverse. Without this task the GDD still describes a game that was never shipped.

**Files:**
- Modify: `docs/gdd/master-gdd.md` §3.1
- Modify: `docs/ai/ARCHITECTURE.md`

- [ ] **Step 1: Rewrite the three colour family rows**

Replace the GDD's values with the shipped tokens: navy `#1A2470` / `#1D3482` / `#050A1A`; ice glass `#A9E3FF` / `#CFEFFF` / `#3A5E78`; amber `#FFC857` / `#FFD27A` / `#FFE8A6`. Keep the ban on `#4ECDC4` and add a line recording that the glow ladder, not per-element decoration, governs brightness.

- [ ] **Step 2: Record the invariant**

Add to `docs/ai/ARCHITECTURE.md` under Invariants:

```markdown
- Glow is a state, not decoration: `GLOW_TIERS` in `designTokens.ts` is the only
  source of glow values, and `SCREEN_FOCUS` names the single tier-3 element each
  screen is allowed. `tests/bannedColors.test.ts` scans all of `src/` for colours
  outside the three families — `#4ECDC4` reached production twice before it existed.
```

- [ ] **Step 3: Verify the whole stream**

Run: `npm run typecheck && npm test && npm run build`
Expected: all clean.

Run `detect_changes()` and confirm the affected symbols are confined to the presentation layer.

- [ ] **Step 4: Check all three screens one last time**

Run: `npm run dev` and open `?scene=menu`, `?scene=map`, `?scene=play&level=1-3&mode=harness`.
Expected: consistent navy-blue sky on all three; one obvious focal point per screen.

- [ ] **Step 5: Commit**

```bash
git add docs/gdd/master-gdd.md docs/ai/ARCHITECTURE.md CHANGELOG.md docs/ai/STATUS.md
git commit -m "docs(gdd): reconcile the palette table with the shipped tokens"
```

---

## Notes for the executor

- **Task 1 breaks two existing assertions on purpose.** `tests/designTokens.test.ts` asserts the old purple gradient. Step 5 updates it. Do not "fix" it by reverting the token.
- **Tasks 5–7 all edit `MenuScene.ts`.** Run them in order, not in parallel, or they will conflict.
- **Task 3 has no Phaser import and must keep it that way.** Vitest runs without a browser in this repo; that is why the geometry is separate from the renderer.
- **VR0 lands before Task 1.** If `MOTION_FAMILIES` is not yet exported from `designTokens.ts`, stop and execute the VR0 plan first rather than inlining easing values here.
- The deferred items — two-layer parallax, the water-ripple logo reflection, and anything in Level Select or Gameplay beyond not regressing them — are out of scope. See spec §7.

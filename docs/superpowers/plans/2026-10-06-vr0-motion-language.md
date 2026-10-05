# VR0 Motion Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, sequentially in one session. The reviewer has chosen inline execution over subagent dispatch. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the codebase one named vocabulary for motion — four families over the existing easing registry — so VR1 onwards reads easing and duration from a table instead of each screen choosing its own.

**Architecture:** `transitions/motion.ts` already holds `EASES`, five pure easing functions with no Phaser dependency and existing test coverage. This plan adds the one missing ease and a semantic layer naming which ease and duration each kind of thing uses. No call site changes and no behaviour changes — the families were chosen to describe what the code already does.

**Tech Stack:** TypeScript 5.7, Vitest 2. Run everything from `game-next/`.

**Spec:** `docs/superpowers/specs/2026-10-06-vr0-motion-language-design.md`

## Global Constraints

- Node `>=24.13.1 <25`. All commands run from `game-next/`.
- `MOTION_FAMILIES` lives in `src/presentation/transitions/motion.ts`, **not** in `designTokens.ts`. `designTokens.ts` imports nothing and must stay a leaf module; `motion.ts` imports from it. Putting the table in `designTokens.ts` while it references `EaseName` creates an import cycle. `ARCHITECTURE.md` records the same trap for `src/content/audio/root.ts`.
- Durations are referenced from `ANIM_TOKENS.duration`, never restated as literals.
- **No existing call site changes in this plan.** Adoption happens in VR1 onwards. A diff that touches a scene file means the scope has slipped.
- Test titles in Vietnamese to match the surrounding files; comments, commits and docs in English per `AGENTS.md`.
- Every commit that changes code or docs adds its `CHANGELOG.md` entry.
- Run `detect_changes()` before committing, per `AGENTS.md`.

---

### Task 1: Add the missing ease

`quartOut` is the only ease the assessment names that `EASES` lacks. The existing
`test.each(Object.keys(EASES))` in `tests/motion.test.ts` covers the 0→1
endpoints automatically once it is added, so this task adds only what that
generic test cannot check: the deceleration shape.

**Files:**
- Modify: `src/presentation/transitions/motion.ts` (`EaseName` union, `EASES`)
- Test: `tests/motion.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `'quartOut'` as a member of `EaseName`, and `EASES.quartOut: (t: number) => number`. Task 2's `glass` family names it.

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe('easing', ...)` block in `tests/motion.test.ts`:

```ts
  test('quartOut giảm tốc: nửa đầu đi được nhiều hơn nửa sau', () => {
    const f = EASES.quartOut;
    expect(f(0)).toBeCloseTo(0, 9);
    expect(f(1)).toBeCloseTo(1, 9);
    // A decelerating ease covers most of the distance early.
    expect(f(0.5)).toBeGreaterThan(0.9);
  });

  test('quartOut đơn điệu tăng', () => {
    const f = EASES.quartOut;
    for (let i = 0; i < 20; i++) {
      expect(f((i + 1) / 20)).toBeGreaterThan(f(i / 20));
    }
  });

  test('quartOut giảm tốc mạnh hơn cubicOut', () => {
    // This is why it belongs to the heavier `glass` family.
    expect(EASES.quartOut(0.5)).toBeGreaterThan(EASES.cubicOut(0.5));
  });
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- motion`
Expected: FAIL — `EASES.quartOut` is undefined, so `f(0)` throws.

- [ ] **Step 3: Add the ease**

In `src/presentation/transitions/motion.ts`, extend the union:

```ts
export type EaseName = 'linear' | 'cubicOut' | 'cubicInOut' | 'quartOut' | 'backOut' | 'sineInOut';
```

and add the function to `EASES`, next to `cubicOut`:

```ts
  quartOut: (t) => 1 - (1 - t) ** 4,
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- motion`
Expected: PASS, including the generic `test.each` which now also exercises `quartOut`.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean. `EaseName` is a union used in `routes.ts`; widening it cannot break existing members.

- [ ] **Step 6: Commit**

```bash
git add src/presentation/transitions/motion.ts tests/motion.test.ts CHANGELOG.md
git commit -m "feat(motion): add quartOut easing for the glass family"
```

---

### Task 2: Declare the four motion families

**Files:**
- Modify: `src/presentation/transitions/motion.ts`
- Test: `tests/motionFamilies.test.ts` (create)

**Interfaces:**
- Consumes: Task 1's `EaseName` and `EASES`; `ANIM_TOKENS` from `../designTokens.ts`.
- Produces:
  - `MotionFamilyName = 'ui' | 'glass' | 'magic' | 'piece'`
  - `MOTION_FAMILIES: Record<MotionFamilyName, MotionFamily>`
  - `motionFamily(name): MotionFamily`

  VR1 Tasks 4–7 read these. The `piece` entry carries no ease or duration because piece motion is governed by `POSE_TAU` in `pieceMotion.ts`; it exists so the vocabulary is complete and so a reader looking for "what drives piece motion" is pointed at the right module rather than concluding it was forgotten.

- [ ] **Step 1: Write the failing test**

Create `tests/motionFamilies.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  EASES,
  MOTION_FAMILIES,
  motionFamily,
  type MotionFamilyName,
  type MotionFamily,
} from '../src/presentation/transitions/motion.ts';
import { ANIM_TOKENS } from '../src/presentation/designTokens.ts';

describe('Bốn họ chuyển động', () => {
  test('đúng bốn họ, đúng tên', () => {
    expect(Object.keys(MOTION_FAMILIES).sort()).toEqual(['glass', 'magic', 'piece', 'ui']);
  });

  test('mọi ease được họ gọi tên đều tồn tại trong EASES', () => {
    // This is the assertion that stops a family drifting from the registry.
    for (const family of Object.values(MOTION_FAMILIES) as MotionFamily[]) {
      if (family.ease === null) continue;
      expect(Object.keys(EASES)).toContain(family.ease);
    }
  });

  test('họ ui có hai nhịp: báo nhận cú chạm nhanh hơn chuyển cảnh', () => {
    expect(MOTION_FAMILIES.ui.tapMs).toBeLessThan(MOTION_FAMILIES.ui.standardMs);
  });

  test('duration lấy từ ANIM_TOKENS, không chép lại số', () => {
    expect(MOTION_FAMILIES.ui.tapMs).toBe(ANIM_TOKENS.duration.buttonTapMs);
  });

  test('họ piece không có ease: chuyển động mảnh do POSE_TAU điều khiển', () => {
    expect(MOTION_FAMILIES.piece.ease).toBeNull();
    expect(MOTION_FAMILIES.piece.governedBy).toBe('POSE_TAU');
  });

  test('họ magic có dải thời lượng chứ không phải một giá trị', () => {
    expect(MOTION_FAMILIES.magic.minMs).toBeLessThan(MOTION_FAMILIES.magic.maxMs);
  });

  test('motionFamily trả về đúng bản ghi', () => {
    const names: MotionFamilyName[] = ['ui', 'glass', 'magic', 'piece'];
    for (const n of names) expect(motionFamily(n)).toBe(MOTION_FAMILIES[n]);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- motionFamilies`
Expected: FAIL — `MOTION_FAMILIES` is not exported.

- [ ] **Step 3: Add the family table**

Append to `src/presentation/transitions/motion.ts`. Note the import of
`ANIM_TOKENS` joins the existing `designTokens.ts` import at the top of the file:

```ts
import { ANIM_TOKENS, TRANSITION_TOKENS } from '../designTokens.ts';
```

```ts
export type MotionFamilyName = 'ui' | 'glass' | 'magic' | 'piece';

/**
 * One type per family rather than a single shape full of optional fields, so
 * `MOTION_FAMILIES.ui.tapMs` is a `number` at the call site instead of
 * `number | undefined`. A shared optional shape typechecks here but pushes a
 * non-null assertion onto every consumer.
 */
export type UiFamily = Readonly<{ ease: EaseName; tapMs: number; standardMs: number }>;
export type GlassFamily = Readonly<{ ease: EaseName; durationMs: number }>;
export type MagicFamily = Readonly<{ ease: EaseName; minMs: number; maxMs: number }>;
/** `piece` is integrated frame by frame by POSE_TAU, so it has no ease. */
export type PieceFamily = Readonly<{ ease: null; governedBy: 'POSE_TAU' }>;

export type MotionFamilies = Readonly<{
  ui: UiFamily;
  glass: GlassFamily;
  magic: MagicFamily;
  piece: PieceFamily;
}>;

export type MotionFamily = UiFamily | GlassFamily | MagicFamily | PieceFamily;

/**
 * One vocabulary for motion, so a reader can tell from the call site why a
 * value was chosen. `cubicOut` and `sineInOut` already dominate the codebase —
 * two of these four families describe what the code does rather than change it.
 */
export const MOTION_FAMILIES: MotionFamilies = {
  // Buttons, modals, toggles, navigation. Two beats: acknowledging a press
  // must feel immediate, while a transition reads better slower.
  ui: {
    ease: 'cubicOut',
    tapMs: ANIM_TOKENS.duration.buttonTapMs,
    standardMs: 200,
  },
  // Glass panels, the target medallion, the stele frame. Heavier deceleration
  // than `ui` so these read as having mass.
  glass: {
    ease: 'quartOut',
    durationMs: 300,
  },
  // Runes, constellations, shimmer, glow pulses. Slow and symmetric.
  magic: {
    ease: 'sineInOut',
    minMs: 600,
    maxMs: 1400,
  },
  // Drag, pickup, snap, settle. Governed by POSE_TAU exponential smoothing in
  // pieceMotion.ts, not by a tween — see VR0 spec §2.1 for why that model was
  // kept over the damped spring the assessment proposed.
  piece: {
    ease: null,
    governedBy: 'POSE_TAU',
  },
} as const;

/** Generic so the caller keeps the specific family type, not the union. */
export function motionFamily<K extends MotionFamilyName>(name: K): MotionFamilies[K] {
  return MOTION_FAMILIES[name];
}
```

`backOut` is deliberately absent from the table. It is an overshoot variant used
at eight existing call sites; it stays available through `EASES` directly rather
than being forced into a family that does not fit it.

- [ ] **Step 4: Run the tests**

Run: `npm test -- motionFamilies`
Expected: PASS, all seven.

- [ ] **Step 5: Confirm nothing else moved**

Run: `npm run typecheck && npm test && npm run build`
Expected: all clean. The suite grows by the ten tests this plan adds, plus one more case in the generic `test.each` over `EASES`. Nothing existing should change — this plan adds vocabulary only.

- [ ] **Step 6: Confirm scope did not slip**

Run: `git diff --stat HEAD~2`
Expected: only `transitions/motion.ts`, the two test files, `CHANGELOG.md` and docs. **If any scene file appears, the adoption work leaked in from VR1 — revert it.**

Run `detect_changes()` and confirm the affected symbols stay inside the transitions module.

- [ ] **Step 7: Record the invariant**

Add to `docs/ai/ARCHITECTURE.md` under Invariants:

```markdown
- Motion vocabulary: `MOTION_FAMILIES` in `transitions/motion.ts` names the ease
  and duration for each kind of motion (`ui`, `glass`, `magic`, `piece`). It lives
  there, not in `designTokens.ts`, because `designTokens.ts` imports nothing and
  must stay a leaf module. `piece` carries no ease — piece motion is integrated
  by `POSE_TAU` in `pieceMotion.ts`. `backOut` is intentionally outside the
  families as an overshoot variant.
```

- [ ] **Step 8: Commit**

```bash
git add src/presentation/transitions/motion.ts tests/motionFamilies.test.ts docs/ai/ARCHITECTURE.md CHANGELOG.md docs/ai/STATUS.md
git commit -m "feat(motion): declare the four motion families"
```

---

## Notes for the executor

- **This plan must land before the VR1 plan starts.** VR1 Tasks 4–7 read `MOTION_FAMILIES`; its own notes say to stop and come here first if the export is missing.
- **Resist adopting the families while you are here.** Changing an existing animation to read from the table is VR1's work. Keeping VR0 to vocabulary is what makes it reviewable in one sitting and impossible to regress the running game with.
- **The `piece` family looks empty on purpose.** It has no ease because `POSE_TAU` integrates piece motion frame by frame. Deleting it would leave a reader wondering whether piece motion was forgotten.
- Expected total: two commits, roughly 60 lines of source and 10 new tests.

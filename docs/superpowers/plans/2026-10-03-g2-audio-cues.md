# G2 Audio Cues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every F2 feedback event, the victory sequence and the main UI buttons sound, with snaps forming a rising pentatonic melody that resolves on the winning piece.

**Architecture:** A pure table (`audioCues.ts`) turns one batch of F2 `FeedbackEvent`s plus the snapped-piece count into `AudioCue[]`; `FeedbackDirector` hands them to `SfxPort` next to its haptics call. The victory timeline's 900 ms call also ducks the music and plays the stinger, so tap-to-skip (`TransitionTimeline.complete()`) fires it exactly once. A small `playUiCue(scene, cue)` helper covers buttons and dialogs.

**Tech Stack:** TypeScript 5.7, Vitest 2, Phaser 3.90.

**Spec:** `docs/superpowers/specs/2026-10-03-g-audio-design.md` (§3 cues, §8 testing). Index: `docs/superpowers/plans/2026-10-03-g-audio-index.md`. Depends on G1 (Tasks 3–9) and F2 (Tasks 8–10).

## Global Constraints

- Branch `feat/audio`, after G1 stop point 4 was passed.
- Cue logic is deterministic: no `Math.random`, same input → same output.
- Pentatonic steps in semitones from the root: `[-5, -3, 0, 2, 4, 7, 9, 12]`; `rate = 2^(semitones / 12)`. Normal snaps use steps 0–6; step 7 (octave) is reserved for the winning snap.
- Volumes and delays come only from `AUDIO_TOKENS` (Task 7); tuning changes the token table, never the logic.
- Audio does not depend on `motionScale`; every cue already has a visual counterpart in F2.
- No `tap` sound where another cue already plays (index departure 6): Hud Reset and Rotate, and buttons that only open a dialog.
- Code comments, docs, CHANGELOG, commit messages in English. Every commit adds a `CHANGELOG.md` entry with a `Verification:` bullet. `impact` before editing existing symbols; `detect_changes` before committing.

## File map

| File | Responsibility |
|---|---|
| `src/presentation/feedback/audioCues.ts` | Pure: pitch table, event → cue, victory audio helpers |
| `src/presentation/feedback/FeedbackDirector.ts` | Calls the helpers (F2 file) |
| `src/presentation/PlayScene.ts` | Passes `audio` into `FeedbackDirector` |
| `src/presentation/audio/uiCues.ts` | `uiCue`, `playUiCue` |
| `MenuScene.ts`, `LevelSelectScene.ts`, `Hud.ts`, `PauseDialog.ts`, `SettingsDialog.ts` | One `playUiCue` call per listed handler |
| `docs/testing/audio/g-acceptance.md` | Manual acceptance record (`pending`) |

---

### Task 10: Event → cue table

**Files:**
- Create: `game-next/src/presentation/feedback/audioCues.ts`
- Test: `game-next/tests/audioCues.test.ts`

**Interfaces:**
- Consumes: `FeedbackEvent` (F2, `src/presentation/feedback/feedbackEvents.ts`); `PuzzleState` (`src/domain/model.ts`); `AudioCue`, `SfxPort` (Task 8); `AudioServices` (Task 9); `AUDIO_TOKENS` (Task 7).
- Produces:
  - `PENTATONIC_STEPS: readonly number[]`
  - `pitchFor(step: number): number`
  - `snappedCount(state: PuzzleState): number`
  - `audioCues(events: readonly FeedbackEvent[], ctx: { snappedCount: number }): AudioCue[]`
  - `STINGER_CUE: AudioCue`
  - `playFeedbackAudio(sfx: SfxPort, events: readonly FeedbackEvent[], state: PuzzleState): void`
  - `playVictoryAudio(audio: AudioServices): void`

- [ ] **Step 1: Write the failing tests**

`game-next/tests/audioCues.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type { PuzzleState } from '../src/domain/model.ts';
import type { AudioCue } from '../src/infrastructure/sfx.ts';
import type { AudioServices } from '../src/presentation/audio/audioServices.ts';
import { SILENT_AUDIO } from '../src/presentation/audio/audioServices.ts';
import { AUDIO_TOKENS } from '../src/presentation/designTokens.ts';
import {
  PENTATONIC_STEPS,
  STINGER_CUE,
  audioCues,
  pitchFor,
  playFeedbackAudio,
  playVictoryAudio,
  snappedCount,
} from '../src/presentation/feedback/audioCues.ts';
import type { FeedbackEvent } from '../src/presentation/feedback/feedbackEvents.ts';

const C = AUDIO_TOKENS.cues;
const snap: FeedbackEvent = { type: 'snap', pieceId: 'a', anchorId: 'A' };
const won: FeedbackEvent = { type: 'won' };
const rateAt = (k: number) => audioCues([snap], { snappedCount: k })[0].rate;
const one = (event: FeedbackEvent) => audioCues([event], { snappedCount: 1 });

describe('pitchFor', () => {
  test('major pentatonic around the root', () => {
    expect(PENTATONIC_STEPS).toEqual([-5, -3, 0, 2, 4, 7, 9, 12]);
    const rates = PENTATONIC_STEPS.map((_, i) => pitchFor(i));
    [0.7492, 0.8409, 1, 1.1225, 1.2599, 1.4983, 1.6818, 2].forEach((r, i) => expect(rates[i]).toBeCloseTo(r, 3));
  });

  test('clamps outside the table', () => {
    expect(pitchFor(-3)).toBe(pitchFor(0));
    expect(pitchFor(42)).toBe(2);
  });
});

describe('snap melody', () => {
  test('rises with each snapped piece, starting at step 0', () => {
    expect(rateAt(1)).toBe(pitchFor(0));
    const rates = [1, 2, 3, 4].map(rateAt);
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeGreaterThan(rates[i - 1]);
  });

  test('taking a piece off lowers the next snap', () => {
    expect(rateAt(2)).toBeLessThan(rateAt(3));
  });

  test('normal snaps stop at step 6; the octave is kept for the win', () => {
    expect(rateAt(8)).toBe(pitchFor(6));
    expect(rateAt(12)).toBe(pitchFor(6));
  });

  test('the winning snap resolves to the octave root', () => {
    expect(audioCues([snap, won], { snappedCount: 3 })).toEqual([{ key: 'bell', rate: 2, volume: C.snapWin, delayMs: 0 }]);
  });

  test('a normal snap is a bell at the snap volume', () => {
    expect(audioCues([snap], { snappedCount: 3 })).toEqual([{ key: 'bell', rate: pitchFor(2), volume: C.snap, delayMs: 0 }]);
  });
});

describe('other events', () => {
  const cue = (key: AudioCue['key'], volume: number, rate = 1, delayMs = 0): AudioCue => ({ key, rate, volume, delayMs });

  test.each<[FeedbackEvent, AudioCue[]]>([
    [{ type: 'lift', pieceId: 'a' }, [cue('tick', C.lift)]],
    [{ type: 'settle-temporary', pieceId: 'a' }, [cue('tap-soft', C.settle)]],
    [{ type: 'return', pieceId: 'a' }, [cue('swish', C.return)]],
    [{ type: 'rotate', pieceId: 'a', turns: 1 }, [cue('tick', C.rotate, C.rotateRate)]],
    [{ type: 'rotate-blocked', pieceId: 'a' }, [cue('thud', C.rotateBlocked)]],
    [{ type: 'overlap-hollow', layers: [] }, [cue('hollow', C.overlap, 1, AUDIO_TOKENS.overlapDelayMs)]],
    [{ type: 'overlap-revive', layers: [] }, [cue('shimmer', C.overlap, 1, AUDIO_TOKENS.overlapDelayMs)]],
    [{ type: 'won' }, []],
  ])('%o', (event, expected) => {
    expect(one(event)).toEqual(expected);
  });

  test('reset plays one swish however many pieces return', () => {
    const events: FeedbackEvent[] = [
      { type: 'reset' },
      { type: 'return', pieceId: 'a' },
      { type: 'return', pieceId: 'b' },
    ];
    expect(audioCues(events, { snappedCount: 0 })).toEqual([{ key: 'swish', rate: 1, volume: C.reset, delayMs: 0 }]);
  });

  test('same input, same output', () => {
    const events: FeedbackEvent[] = [snap, { type: 'overlap-hollow', layers: [] }];
    expect(audioCues(events, { snappedCount: 2 })).toEqual(audioCues(events, { snappedCount: 2 }));
  });
});

describe('helpers', () => {
  const state: PuzzleState = {
    levelId: 'x',
    phase: 'playing',
    pieces: {
      a: { kind: 'snapped', anchorId: 'A', turns: 0 },
      b: { kind: 'tray', turns: 0 },
      c: { kind: 'temporary', x: 0, y: 0, turns: 0 },
      d: { kind: 'snapped', anchorId: 'D', turns: 0 },
    },
  };

  test('snappedCount counts only snapped pieces', () => {
    expect(snappedCount(state)).toBe(2);
  });

  test('playFeedbackAudio uses the state after the move', () => {
    const played: AudioCue[][] = [];
    playFeedbackAudio({ ...SILENT_AUDIO.sfx, play: (cues) => played.push([...cues]) }, [snap], state);
    expect(played).toEqual([[{ key: 'bell', rate: pitchFor(1), volume: C.snap, delayMs: 0 }]]);
  });

  test('playVictoryAudio ducks the music and plays the stinger', () => {
    const ducks: Array<[number, number]> = [];
    const played: AudioCue[][] = [];
    const audio: AudioServices = {
      music: { ...SILENT_AUDIO.music, duck: (level, holdMs) => ducks.push([level, holdMs]) },
      sfx: { ...SILENT_AUDIO.sfx, play: (cues) => played.push([...cues]) },
    };
    playVictoryAudio(audio);
    expect(ducks).toEqual([[AUDIO_TOKENS.duck.level, AUDIO_TOKENS.duck.holdMs]]);
    expect(played).toEqual([[STINGER_CUE]]);
    expect(STINGER_CUE).toEqual({ key: 'stinger-win', rate: 1, volume: C.stinger, delayMs: 0 });
  });
});
```

If F2's `Turns` type rejects the literal `1` or `0`, cast with `as Turns` imported from `src/domain/model.ts`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/audioCues.test.ts`
Expected: FAIL, cannot resolve `../src/presentation/feedback/audioCues.ts`.

- [ ] **Step 3: Write `src/presentation/feedback/audioCues.ts`**

```ts
import type { PuzzleState } from '../../domain/model.ts';
import type { SfxKey } from '../../infrastructure/audioManifest.ts';
import type { AudioCue, SfxPort } from '../../infrastructure/sfx.ts';
import type { AudioServices } from '../audio/audioServices.ts';
import { AUDIO_TOKENS } from '../designTokens.ts';
import type { FeedbackEvent } from './feedbackEvents.ts';

/** Major pentatonic, semitones from the music root (spec G §3.1). */
export const PENTATONIC_STEPS: readonly number[] = [-5, -3, 0, 2, 4, 7, 9, 12];

const WIN_STEP = PENTATONIC_STEPS.length - 1;
const LAST_NORMAL_STEP = WIN_STEP - 1;

export function pitchFor(step: number): number {
  const i = Math.max(0, Math.min(WIN_STEP, Math.floor(step)));
  return 2 ** (PENTATONIC_STEPS[i] / 12);
}

export function snappedCount(state: PuzzleState): number {
  return Object.values(state.pieces).filter((p) => p.kind === 'snapped').length;
}

const cue = (key: SfxKey, volume: number, rate = 1, delayMs = 0): AudioCue => ({ key, rate, volume, delayMs });

export const STINGER_CUE: AudioCue = cue('stinger-win', AUDIO_TOKENS.cues.stinger);

/**
 * One transition's events → sound cues (spec G §3.3). The whole batch is
 * needed: a `won` in the batch turns the snap into the resolving octave, and
 * `reset` swallows the per-piece `return`s.
 */
export function audioCues(events: readonly FeedbackEvent[], ctx: { snappedCount: number }): AudioCue[] {
  const c = AUDIO_TOKENS.cues;
  const won = events.some((e) => e.type === 'won');
  const reset = events.some((e) => e.type === 'reset');
  const out: AudioCue[] = [];
  for (const event of events) {
    switch (event.type) {
      case 'lift':
        out.push(cue('tick', c.lift));
        break;
      case 'snap':
        out.push(
          won
            ? cue('bell', c.snapWin, pitchFor(WIN_STEP))
            : cue('bell', c.snap, pitchFor(Math.min(ctx.snappedCount - 1, LAST_NORMAL_STEP)))
        );
        break;
      case 'settle-temporary':
        out.push(cue('tap-soft', c.settle));
        break;
      case 'return':
        if (!reset) out.push(cue('swish', c.return));
        break;
      case 'rotate':
        out.push(cue('tick', c.rotate, c.rotateRate));
        break;
      case 'rotate-blocked':
        out.push(cue('thud', c.rotateBlocked));
        break;
      case 'overlap-hollow':
        out.push(cue('hollow', c.overlap, 1, AUDIO_TOKENS.overlapDelayMs));
        break;
      case 'overlap-revive':
        out.push(cue('shimmer', c.overlap, 1, AUDIO_TOKENS.overlapDelayMs));
        break;
      case 'reset':
        out.push(cue('swish', c.reset));
        break;
      case 'won':
        // The stinger belongs to the victory timeline (playVictoryAudio)
        break;
    }
  }
  return out;
}

export function playFeedbackAudio(sfx: SfxPort, events: readonly FeedbackEvent[], state: PuzzleState): void {
  sfx.play(audioCues(events, { snappedCount: snappedCount(state) }));
}

export function playVictoryAudio(audio: AudioServices): void {
  audio.music.duck(AUDIO_TOKENS.duck.level, AUDIO_TOKENS.duck.holdMs);
  audio.sfx.play([STINGER_CUE]);
}
```

Compare the `switch` with the `FeedbackEvent` union in `feedbackEvents.ts`. If F2 added event types beyond spec F2 §2.4, add a `case` with no cue (`break`) for each and list them in the CHANGELOG entry.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/audioCues.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: CHANGELOG and commit**

```markdown
### 2026-10-03 - Map feedback events to sound cues (G task 10)

- Added `game-next/src/presentation/feedback/audioCues.ts`: major-pentatonic `pitchFor`, event batch → cue table from spec G §3.3 (winning snap resolves to the octave, reset swallows returns, overlap cues delayed 60 ms), plus `playFeedbackAudio` and `playVictoryAudio` (duck + stinger).
- Verification: `tests/audioCues.test.ts` failed first, then passed; `npm run typecheck` passed.
```

```bash
git add game-next/src/presentation/feedback/audioCues.ts game-next/tests/audioCues.test.ts CHANGELOG.md
git commit -m "feat(audio): map feedback events to pitched sound cues"
```

---

### Task 11: Sound in the level and the victory

**Files:**
- Modify: `game-next/src/presentation/feedback/FeedbackDirector.ts`
- Modify: `game-next/src/presentation/PlayScene.ts`
- Modify (only if it constructs `FeedbackDirector`): any test under `game-next/tests/`

**Interfaces:**
- Consumes: `playFeedbackAudio`, `playVictoryAudio` (Task 10); `audioServices`, `SILENT_AUDIO`, `AudioServices` (Task 9); F2 `FeedbackDeps`, `FeedbackDirector.handle`, `FeedbackDirector.playVictory`.
- Produces: `FeedbackDeps.audio: AudioServices`.

Run `impact` on `FeedbackDirector` (`handle`, `playVictory`) and `PlayScene.create` first; report the risk.

- [ ] **Step 1: Find constructions of `FeedbackDirector`**

Run: `grep -rn "new FeedbackDirector(" src tests`
Expected: `src/presentation/PlayScene.ts` and possibly tests. Every match gets the new `audio` field below.

- [ ] **Step 2: Extend `FeedbackDeps` and `handle`**

In `game-next/src/presentation/feedback/FeedbackDirector.ts`:

1. Imports:

```ts
import type { AudioServices } from '../audio/audioServices.ts';
import { playFeedbackAudio, playVictoryAudio } from './audioCues.ts';
```

2. Add to `FeedbackDeps`, after `haptics: HapticsPort;`: `audio: AudioServices;`
3. First line inside `handle(events)`, before the existing loop:

```ts
    playFeedbackAudio(this.deps.audio.sfx, events, this.deps.getState());
```

4. In `playVictory()`, inside the `tl.call(plan.burstAtMs, () => { … })` callback, right after `this.deps.haptics.notify('success');`:

```ts
      // Same call as the flash, so tap-to-skip (complete()) still fires it exactly once
      playVictoryAudio(this.deps.audio);
```

- [ ] **Step 3: Pass the services from `PlayScene`**

In `game-next/src/presentation/PlayScene.ts`: import `import { audioServices } from './audio/audioServices.ts';` and add `audio: audioServices(this),` to the object passed to `new FeedbackDirector({ … })`, after `haptics,`.

In each test found in Step 1, add `audio: SILENT_AUDIO,` (import from `../src/presentation/audio/audioServices.ts`).

- [ ] **Step 4: Typecheck and tests**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 5: Manual check**

Run: `npm run dev`; open `?scene=play&level=1-3&mode=harness` and then play 1-1 → 1-6 from the map. Record in the task report:
1. Lift: faint tick. Each snap: a bell, one step higher than the previous snap. Remove a piece and snap again: lower.
2. Last piece: the bell jumps to the high root; at the flash the stinger plays and the music dips, then returns within ~2.5 s.
3. Tap during the victory before the flash: stinger plays once, not twice.
4. Reset with several pieces on the board: one swish.
5. Overlap that hollows: a breath right after the bell; three-layer revival: shimmer.
6. Settings → "Hiệu ứng âm thanh" off: level is silent except music; "Giảm chuyển động" on: sounds unchanged.

- [ ] **Step 6: CHANGELOG and commit**

```markdown
### 2026-10-03 - Play sound cues in levels and on victory (G task 11)

- `FeedbackDirector` plays `audioCues` for every event batch beside its haptics, and the victory timeline's flash call ducks the music and plays the stinger; `PlayScene` passes `audioServices(this)`.
- Verification: `npm run typecheck` and `npm test` passed; manual check of steps 1–6 in the harness recorded.
```

```bash
git add game-next/src/presentation/feedback/FeedbackDirector.ts game-next/src/presentation/PlayScene.ts game-next/tests CHANGELOG.md
git commit -m "feat(audio): play feedback and victory sounds in levels"
```

---

### Task 12: UI cues, acceptance record, final check

**Files:**
- Create: `game-next/src/presentation/audio/uiCues.ts`
- Modify: `game-next/src/presentation/MenuScene.ts`, `LevelSelectScene.ts`, `Hud.ts`, `PauseDialog.ts`, `SettingsDialog.ts`
- Create: `docs/testing/audio/g-acceptance.md`
- Test: `game-next/tests/uiCues.test.ts`

**Interfaces:**
- Consumes: `audioServices` (Task 9), `AudioCue` (Task 8), `AUDIO_TOKENS` (Task 7).
- Produces: `type UiCue = 'tap' | 'open' | 'close' | 'node' | 'locked'`, `uiCue(cue: UiCue): AudioCue`, `playUiCue(scene: Phaser.Scene, cue: UiCue): void`.

Run `impact` on `Hud`, `PauseDialog.open`/`close`, `SettingsDialog.open`/`close`/`createToggleRow` first.

- [ ] **Step 1: Write the failing tests**

`game-next/tests/uiCues.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type Phaser from 'phaser';
import type { AudioCue } from '../src/infrastructure/sfx.ts';
import { AUDIO_REGISTRY_KEY, SILENT_AUDIO } from '../src/presentation/audio/audioServices.ts';
import { playUiCue, uiCue } from '../src/presentation/audio/uiCues.ts';
import { AUDIO_TOKENS } from '../src/presentation/designTokens.ts';

const C = AUDIO_TOKENS.cues;

describe('ui cues', () => {
  test('each UI cue maps to one sample at its token volume', () => {
    expect(uiCue('tap')).toEqual({ key: 'tick', rate: 1, volume: C.uiTap, delayMs: 0 });
    expect(uiCue('open')).toEqual({ key: 'tap-soft', rate: 1, volume: C.uiDialog, delayMs: 0 });
    expect(uiCue('close')).toEqual({ key: 'tap-soft', rate: 1, volume: C.uiDialog, delayMs: 0 });
    expect(uiCue('node')).toEqual({ key: 'bell', rate: 1, volume: C.uiNode, delayMs: 0 });
    expect(uiCue('locked')).toEqual({ key: 'thud', rate: 1, volume: C.uiLocked, delayMs: 0 });
  });

  test('playUiCue sends the cue to the registered SfxPort', () => {
    const played: AudioCue[][] = [];
    const services = { music: SILENT_AUDIO.music, sfx: { ...SILENT_AUDIO.sfx, play: (c: readonly AudioCue[]) => played.push([...c]) } };
    const scene = { registry: { get: (k: string) => (k === AUDIO_REGISTRY_KEY ? services : undefined) } } as unknown as Phaser.Scene;
    playUiCue(scene, 'node');
    expect(played).toEqual([[uiCue('node')]]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/uiCues.test.ts`
Expected: FAIL, cannot resolve `uiCues.ts`.

- [ ] **Step 3: Write `src/presentation/audio/uiCues.ts`**

```ts
import type Phaser from 'phaser';
import type { AudioCue } from '../../infrastructure/sfx.ts';
import { AUDIO_TOKENS } from '../designTokens.ts';
import { audioServices } from './audioServices.ts';

export type UiCue = 'tap' | 'open' | 'close' | 'node' | 'locked';

/** Spec G §3.4 */
export function uiCue(cue: UiCue): AudioCue {
  const c = AUDIO_TOKENS.cues;
  switch (cue) {
    case 'tap':
      return { key: 'tick', rate: 1, volume: c.uiTap, delayMs: 0 };
    case 'open':
    case 'close':
      return { key: 'tap-soft', rate: 1, volume: c.uiDialog, delayMs: 0 };
    case 'node':
      return { key: 'bell', rate: 1, volume: c.uiNode, delayMs: 0 };
    case 'locked':
      return { key: 'thud', rate: 1, volume: c.uiLocked, delayMs: 0 };
  }
}

export function playUiCue(scene: Phaser.Scene, cue: UiCue): void {
  audioServices(scene).sfx.play([uiCue(cue)]);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/uiCues.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire the handlers**

Add `import { playUiCue } from './audio/uiCues.ts';` to each file below, then make exactly these edits (find handlers by the variable names; line numbers moved during F1/F2):

| File | Handler | Edit |
|---|---|---|
| `MenuScene.ts` | `btnZone.on('pointerdown', …)` (Play) and `secBtnZone.on('pointerdown', …)` | First line of the callback: `playUiCue(this, 'tap');` |
| `MenuScene.ts` | `settingsBtn` | No change (the dialog's `open` cue sounds) |
| `LevelSelectScene.ts` | `backBtn.on('pointerdown', …)` | First line: `playUiCue(this, 'tap');` |
| `LevelSelectScene.ts` | `nodeSprite.on('pointerdown', …)` | In the `locked` branch and the `!node.available` branch, before `showToast`: `playUiCue(this, 'locked');`. In the branch that goes to the level, before `director.go(…)`: `playUiCue(this, 'node');` |
| `Hud.ts` | `targetBtnBase.on('pointerdown', …)` | First line: `playUiCue(this.scene, 'tap');` |
| `Hud.ts` | `selectHit.on('pointerdown', …)`, `nextHit.on('pointerdown', …)` | Change each to a block that calls `playUiCue(this.scene, 'tap');` before the existing callback, e.g. `selectHit.on('pointerdown', () => { playUiCue(this.scene, 'tap'); this.callbacks.onLevelSelect(); });` |
| `Hud.ts` | `menuBtn`, `resetBtnBase`, `rotateBtnBase` | No change (dialog `open`, feedback `reset`, feedback `rotate`) |
| `PauseDialog.ts` | `open()` | After `if (this.container) return;`: `playUiCue(this.scene, 'open');` |
| `PauseDialog.ts` | `close()` | First line inside `if (this.container) {`: `playUiCue(this.scene, 'close');` |
| `SettingsDialog.ts` | `open()` / `close()` | Same as `PauseDialog` |
| `SettingsDialog.ts` | `createToggleRow` → `hitZone.on('pointerdown', …)` | After `onChange(isChecked);`: `playUiCue(this.scene, 'tap');` (turning SFX off silences this tap; turning it on makes it the preview tick) |

- [ ] **Step 6: Typecheck, tests, build**

Run: `npm run typecheck && npm test && npm run build`
Expected: PASS.

- [ ] **Step 7: Write the acceptance record**

`docs/testing/audio/g-acceptance.md`:

```markdown
# G audio acceptance

Status: pending

Spec: `docs/superpowers/specs/2026-10-03-g-audio-design.md` §8.2. Build: commit `<sha>` on `feat/audio`.
Devices: Chrome stable, DevTools device 390 × 844; the mid-range Android phone used for F3 (model, Android version, WebView version: ____).

| ID | Check | Chrome | Android |
|---|---|---|---|
| A-01 | Fresh open: silent until first tap on web, then music fades in. Android: note whether music starts at app open | | |
| A-02 | Menu → Map: music unchanged. Map → level: crossfade ~1.5 s, no gap, no loud overlap. Level → Map: ~1 s back | | |
| A-03 | 5–6 piece level: snaps rise one step at a time; last piece jumps to the high root | | |
| A-04 | Victory: stinger at the flash, music dips and returns | | |
| A-05 | Tap to skip the victory early: stinger exactly once | | |
| A-06 | Reset with several pieces on the board: one swish | | |
| A-07 | Hollow overlap: breath after the bell; three-layer revival: shimmer | | |
| A-08 | Both loops play two full passes with no audible seam | | |
| A-09 | Toggles: "Nhạc nền" off fades out, on resumes; "Hiệu ứng âm thanh" off silences cues; both persist after reopening | | |
| A-10 | Background / resume (Android), hidden tab (web): silent while away, resumes on return | | |
| A-11 | Both toggles off: a whole level is playable, every feedback still visible | | |
| A-12 | Start Spotify/YouTube, then open the game: record whether the other app pauses (spec §9) | — | |
| A-13 | Snap bell vs. snap ring timing on Android: in sync or late (spec §9) | — | |
| A-14 | UI: Play/Map/Back/target/victory buttons tick; dialogs open/close softly; locked node thuds; open node rings | | |

Result: _(reviewer writes "passed" with one quoted sentence, or lists failing IDs)_
```

- [ ] **Step 8: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add UI sound cues and audio acceptance record (G task 12)

- Added `playUiCue` (`game-next/src/presentation/audio/uiCues.ts`) and wired it into Menu, Map, Hud victory/target buttons and both dialogs; no extra tap where a feedback or dialog cue already sounds.
- Added `docs/testing/audio/g-acceptance.md` (status `pending`) with checks A-01 → A-14 from spec G §8.2 and §9.
- Verification: `tests/uiCues.test.ts` failed first, then passed; `npm run typecheck`, `npm test`, `npm run build` passed.
```

```bash
git add game-next/src/presentation/audio/uiCues.ts game-next/src/presentation/MenuScene.ts game-next/src/presentation/LevelSelectScene.ts game-next/src/presentation/Hud.ts game-next/src/presentation/PauseDialog.ts game-next/src/presentation/SettingsDialog.ts game-next/tests/uiCues.test.ts docs/testing/audio/g-acceptance.md CHANGELOG.md
git commit -m "feat(audio): add UI sound cues and acceptance checklist"
```

- [ ] **Step 9: G phase check and STOP (index stop point 5)**

Run (in `game-next/`): `npm run typecheck && npm test && npm run content:validate && npm run build`
Run (repo root): `git diff --check && git status`
Expected: all pass; working tree clean.

Build the APK (`npm run android:sync`, then `cmd /c gradlew.bat assembleDebug` in `game-next/android/`) and hand the reviewer `docs/testing/audio/g-acceptance.md`. The controller updates `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md` (row G → `in-progress`, awaiting acceptance). Stop until the reviewer marks the record `passed`; then the reviewer merges `feat/audio`.

# GS1 Synth Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a self-contained audio synthesis engine, Mirror's eight sound effects as declarative patches, a CLI that renders review artifacts, and a browser Audio Lab for tuning.

**Architecture:** `src/audio-synth/` is a pure, dependency-free library: sample-level DSP primitives, a declarative `Patch` type, and `renderPatch(patch, sampleRate) -> Float32Array`. It imports nothing — not Phaser, not Node, not Mirror. Mirror's eight patches live in `src/content/audio/sources/`, mirroring how levels live in `src/content/sources/`. A Node script renders WAV and SVG review artifacts; a dev-only browser page plays the same code the game will.

**Tech Stack:** TypeScript 5.7 (ESM, `.ts` import suffixes), Vitest 2, Vite 6, Node 24 (`--experimental-strip-types` for scripts). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-05-audio-synth-engine-design.md`. Index (order, branches, stop points, contracts, deviations): `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md`.

## Global Constraints

- Work in `game-next/` on branch `feat/audio-synth`, worktree `D:\Working\ASOL\ASOL-GAME-02-audio`. Baseline before Task 1: `npm run typecheck` clean, `npm test` 68 files / 829 tests passing.
- **No new dependencies.** The repository keeps 4 runtime and 5 dev dependencies. `ffmpeg-static` is never added.
- `src/audio-synth/**` imports nothing outside itself. No `phaser`, no `node:*`, no Mirror modules. This is what makes the folder portable; a test enforces it in Task 8.
- Every render is deterministic: seeded PRNG only, never `Math.random`. Same patch and sample rate produce byte-identical output.
- Imports use the `.ts` suffix, matching the rest of the codebase.
- Test files go in `game-next/tests/`, named `<subject>.test.ts`. Use English `describe` names for engine units, matching `buildLevelDocument` and `maskCentroid` in the existing suite.
- Code comments, docs, CHANGELOG entries and commit messages in English. UI labels stay Vietnamese.
- Commit messages `type(scope): summary`. Every commit adds a `CHANGELOG.md` entry under `## Unreleased` (newest first) with a `Verification:` bullet.
- Before each commit run GitNexus `detect_changes({ scope: "staged", repo: "ASOL-GAME-02" })`; say so in the verification bullet if the server is unavailable.
- Sample rate is 44100 everywhere unless a test says otherwise.

## File map

| File | Responsibility |
|---|---|
| `src/audio-synth/dsp.ts` | PRNG, noise, envelope, oscillators, FM, biquad filters — sample level |
| `src/audio-synth/patch.ts` | `Patch` and friends, `validatePatch` |
| `src/audio-synth/normalize.ts` | `measure`, `applyNormalize` |
| `src/audio-synth/render.ts` | `renderPatch` — layers, filters, envelopes, mix, normalize, fade-out |
| `src/audio-synth/wav.ts` | `encodeWav`, `decodeWavSamples` |
| `src/audio-synth/report.ts` | `renderWaveformSvg`, `renderAudioReport` |
| `src/audio-synth/presets.ts` | Three generic starter patches |
| `src/audio-synth/README.md` | Onboarding document; travels with the folder |
| `src/content/audio/root.ts` | `MUSIC_ROOT_HZ` alone, so patches can read it without importing the registry |
| `src/content/audio/sources/<key>.ts` | Mirror's eight patches |
| `src/content/audio/index.ts` | `SfxKey`, `SFX_KEYS`, `SFX_PATCHES`; re-exports `MUSIC_ROOT_HZ` |
| `scripts/audio-author.ts` | `npm run audio:author [-- <key>... | --all]` |
| `audiolab.html`, `src/devtools/audiolab/` | Audio Lab, dev only |

---

### Task 1: DSP primitives

**Files:**
- Create: `game-next/src/audio-synth/dsp.ts`
- Test: `game-next/tests/dsp.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = () => number`, `mulberry32(seed: number): Rng`
  - `noise(color: 'white' | 'pink', n: number, rng: Rng): Float32Array`
  - `type EnvelopeShape = { attackMs: number; decayMs: number; sustain?: number; releaseMs?: number; curve?: 'lin' | 'exp' }`
  - `envelope(env: EnvelopeShape, n: number, sampleRate: number): Float32Array`
  - `type OscKind = 'sine' | 'triangle' | 'saw' | 'square'`
  - `osc(kind: OscKind, hzStart: number, hzEnd: number, n: number, sampleRate: number): Float32Array`
  - `fmOsc(carrierHz: number, ratio: number, index: number, indexEnv: Float32Array | null, n: number, sampleRate: number): Float32Array`
  - `type FilterKind = 'lowpass' | 'highpass' | 'bandpass'`, `type Coeffs = { b0: number; b1: number; b2: number; a1: number; a2: number }`
  - `biquadCoeffs(kind: FilterKind, hz: number, q: number, sampleRate: number): Coeffs`
  - `applyBiquad(input: Float32Array, kind: FilterKind, hzStart: number, hzEnd: number, q: number, sampleRate: number): Float32Array`

- [ ] **Step 1: Write the failing test**

`game-next/tests/dsp.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  applyBiquad,
  envelope,
  fmOsc,
  mulberry32,
  noise,
  osc,
} from '../src/audio-synth/dsp.ts';

const SR = 44100;

function rms(xs: Float32Array): number {
  let sum = 0;
  for (const x of xs) sum += x * x;
  return Math.sqrt(sum / xs.length);
}

describe('mulberry32', () => {
  test('same seed yields the same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const left = [a(), a(), a(), a()];
    const right = [b(), b(), b(), b()];
    expect(left).toEqual(right);
  });

  test('different seeds diverge, and values stay in [0, 1)', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('noise', () => {
  test('white noise fills the range and is reproducible', () => {
    const first = noise('white', 2048, mulberry32(3));
    const second = noise('white', 2048, mulberry32(3));
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(rms(first)).toBeGreaterThan(0.4);
    expect(Math.max(...first)).toBeLessThanOrEqual(1);
    expect(Math.min(...first)).toBeGreaterThanOrEqual(-1);
  });

  test('pink noise has less high-frequency energy than white', () => {
    const white = noise('white', 8192, mulberry32(5));
    const pink = noise('pink', 8192, mulberry32(5));
    // A difference filter approximates high-frequency content.
    const highs = (xs: Float32Array) => {
      let sum = 0;
      for (let i = 1; i < xs.length; i++) sum += (xs[i] - xs[i - 1]) ** 2;
      return Math.sqrt(sum / (xs.length - 1));
    };
    expect(highs(pink)).toBeLessThan(highs(white));
  });
});

describe('envelope', () => {
  test('a pure decay starts at one and ends at zero', () => {
    const env = envelope({ attackMs: 0, decayMs: 100 }, 4410, SR);
    expect(env[0]).toBeCloseTo(1, 5);
    expect(env[env.length - 1]).toBeCloseTo(0, 5);
  });

  test('attack rises from zero and reaches one', () => {
    const env = envelope({ attackMs: 50, decayMs: 50 }, 4410, SR);
    expect(env[0]).toBeCloseTo(0, 5);
    expect(Math.max(...env)).toBeCloseTo(1, 3);
  });

  test('an exponential decay is monotonic and stays below the linear one', () => {
    const lin = envelope({ attackMs: 0, decayMs: 100, curve: 'lin' }, 4410, SR);
    const exp = envelope({ attackMs: 0, decayMs: 100, curve: 'exp' }, 4410, SR);
    for (let i = 1; i < exp.length; i++) expect(exp[i]).toBeLessThanOrEqual(exp[i - 1] + 1e-7);
    expect(exp[2205]).toBeLessThan(lin[2205]);
  });

  test('sustain holds, then release falls to zero', () => {
    const env = envelope(
      { attackMs: 0, decayMs: 10, sustain: 0.5, releaseMs: 10 },
      Math.round(SR * 0.1),
      SR,
    );
    expect(env[Math.round(SR * 0.05)]).toBeCloseTo(0.5, 3);
    expect(env[env.length - 1]).toBeCloseTo(0, 5);
  });
});

describe('osc', () => {
  test('a sine has the expected amplitude and near-zero mean', () => {
    const wave = osc('sine', 440, 440, SR, SR);
    expect(Math.max(...wave)).toBeCloseTo(1, 1);
    expect(rms(wave)).toBeCloseTo(Math.SQRT1_2, 2);
    const mean = wave.reduce((a, b) => a + b, 0) / wave.length;
    expect(Math.abs(mean)).toBeLessThan(0.01);
  });

  test('a square only takes two values', () => {
    const wave = osc('square', 100, 100, 1000, SR);
    expect(new Set(Array.from(wave))).toEqual(new Set([1, -1]));
  });

  test('a glide ends near the target frequency', () => {
    const wave = osc('sine', 100, 800, SR, SR);
    const crossings = (from: number, to: number) => {
      let n = 0;
      for (let i = from + 1; i < to; i++) if (wave[i - 1] < 0 && wave[i] >= 0) n++;
      return n;
    };
    // The last tenth of a second should hold roughly the target frequency.
    expect(crossings(SR - 4410, SR)).toBeGreaterThan(60);
  });
});

describe('fmOsc', () => {
  test('zero index collapses to a plain sine', () => {
    const plain = osc('sine', 300, 300, 1000, SR);
    const fm = fmOsc(300, 3.5, 0, null, 1000, SR);
    for (let i = 0; i < 1000; i++) expect(fm[i]).toBeCloseTo(plain[i], 5);
  });

  test('a non-zero index adds partials', () => {
    const plain = osc('sine', 300, 300, 4096, SR);
    const fm = fmOsc(300, 3.5, 6, null, 4096, SR);
    let diff = 0;
    for (let i = 0; i < 4096; i++) diff += Math.abs(fm[i] - plain[i]);
    expect(diff / 4096).toBeGreaterThan(0.1);
  });
});

describe('applyBiquad', () => {
  test('a lowpass passes a tone below its cutoff and blocks one above', () => {
    const low = osc('sine', 100, 100, SR, SR);
    const high = osc('sine', 8000, 8000, SR, SR);
    const passed = applyBiquad(low, 'lowpass', 500, 500, 0.707, SR);
    const blocked = applyBiquad(high, 'lowpass', 500, 500, 0.707, SR);
    expect(rms(passed)).toBeGreaterThan(rms(low) * 0.8);
    expect(rms(blocked)).toBeLessThan(rms(high) * 0.05);
  });

  test('a highpass does the opposite', () => {
    const low = osc('sine', 100, 100, SR, SR);
    const high = osc('sine', 8000, 8000, SR, SR);
    expect(rms(applyBiquad(low, 'highpass', 2000, 2000, 0.707, SR))).toBeLessThan(rms(low) * 0.05);
    expect(rms(applyBiquad(high, 'highpass', 2000, 2000, 0.707, SR))).toBeGreaterThan(rms(high) * 0.8);
  });

  test('a sweep lands on the end cutoff', () => {
    const high = osc('sine', 6000, 6000, SR, SR);
    const swept = applyBiquad(high, 'lowpass', 12000, 400, 0.707, SR);
    const head = swept.subarray(0, 4410);
    const tail = swept.subarray(SR - 4410);
    expect(rms(tail)).toBeLessThan(rms(head) * 0.2);
  });

  test('the output is finite everywhere', () => {
    const out = applyBiquad(noise('white', 4096, mulberry32(9)), 'bandpass', 1000, 1000, 2, SR);
    for (const v of out) expect(Number.isFinite(v)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/dsp.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/dsp.ts`.

- [ ] **Step 3: Implement**

`game-next/src/audio-synth/dsp.ts`:

```ts
/**
 * Sample-level DSP primitives.
 *
 * Everything here is pure and deterministic: given the same arguments
 * (and the same Rng) a function returns the same samples. Nothing in this
 * file imports anything, which is what lets the folder be copied into
 * another project unchanged.
 */

export type Rng = () => number;

/** Small, fast, well-distributed PRNG. Used instead of Math.random so renders repeat. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noise(color: 'white' | 'pink', n: number, rng: Rng): Float32Array {
  const out = new Float32Array(n);
  if (color === 'white') {
    for (let i = 0; i < n; i++) out[i] = rng() * 2 - 1;
    return out;
  }
  // Paul Kellet's economy pink-noise filter: three one-pole sections summed.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = rng() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 0.1050186;
    out[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.1848) * 0.35));
  }
  return out;
}

export type EnvelopeShape = {
  attackMs: number;
  decayMs: number;
  sustain?: number;
  releaseMs?: number;
  curve?: 'lin' | 'exp';
};

/**
 * Attack 0 -> 1, decay 1 -> sustain, hold, release sustain -> 0.
 * With no sustain and no release this is the plain AD shape most effects use.
 */
export function envelope(env: EnvelopeShape, n: number, sampleRate: number): Float32Array {
  const out = new Float32Array(n);
  const perMs = sampleRate / 1000;
  const a = Math.max(0, Math.round(env.attackMs * perMs));
  const d = Math.max(0, Math.round(env.decayMs * perMs));
  const r = Math.max(0, Math.round((env.releaseMs ?? 0) * perMs));
  const sustain = env.sustain ?? 0;
  const exp = env.curve === 'exp';
  const releaseStart = Math.max(a + d, n - r);

  for (let i = 0; i < n; i++) {
    let v: number;
    if (i < a) {
      const t = a === 0 ? 1 : i / a;
      v = exp ? t * t : t;
    } else if (i < a + d) {
      const t = d === 0 ? 1 : (i - a) / d;
      const fall = exp ? (1 - t) ** 3 : 1 - t;
      v = sustain + (1 - sustain) * fall;
    } else if (i < releaseStart) {
      v = sustain;
    } else {
      const t = r === 0 ? 1 : (i - releaseStart) / r;
      v = sustain * (exp ? (1 - t) ** 3 : 1 - t);
    }
    out[i] = v;
  }
  return out;
}

export type OscKind = 'sine' | 'triangle' | 'saw' | 'square';

function waveform(kind: OscKind, phase: number): number {
  switch (kind) {
    case 'sine':
      return Math.sin(2 * Math.PI * phase);
    case 'saw':
      return 2 * phase - 1;
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'triangle':
      return 4 * Math.abs(phase - 0.5) - 1;
  }
}

/** Linear frequency glide from hzStart to hzEnd across the whole buffer. */
export function osc(
  kind: OscKind,
  hzStart: number,
  hzEnd: number,
  n: number,
  sampleRate: number,
): Float32Array {
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0 : i / (n - 1);
    const hz = hzStart + (hzEnd - hzStart) * t;
    out[i] = waveform(kind, phase);
    phase += hz / sampleRate;
    if (phase >= 1) phase -= Math.floor(phase);
  }
  return out;
}

/**
 * Two-operator FM. A modulator at carrierHz * ratio bends the carrier's phase.
 * A non-integer ratio gives inharmonic partials, which is what makes bells
 * and struck metal sound the way they do.
 */
export function fmOsc(
  carrierHz: number,
  ratio: number,
  index: number,
  indexEnv: Float32Array | null,
  n: number,
  sampleRate: number,
): Float32Array {
  const out = new Float32Array(n);
  const modHz = carrierHz * ratio;
  let carrierPhase = 0;
  let modPhase = 0;
  for (let i = 0; i < n; i++) {
    const depth = index * (indexEnv ? indexEnv[i] : 1);
    out[i] = Math.sin(2 * Math.PI * carrierPhase + Math.sin(2 * Math.PI * modPhase) * depth);
    carrierPhase += carrierHz / sampleRate;
    if (carrierPhase >= 1) carrierPhase -= Math.floor(carrierPhase);
    modPhase += modHz / sampleRate;
    if (modPhase >= 1) modPhase -= Math.floor(modPhase);
  }
  return out;
}

export type FilterKind = 'lowpass' | 'highpass' | 'bandpass';
export type Coeffs = { b0: number; b1: number; b2: number; a1: number; a2: number };

/** Robert Bristow-Johnson's cookbook biquad, normalised by a0. */
export function biquadCoeffs(
  kind: FilterKind,
  hz: number,
  q: number,
  sampleRate: number,
): Coeffs {
  const clamped = Math.max(1, Math.min(hz, sampleRate * 0.49));
  const w0 = (2 * Math.PI * clamped) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * Math.max(0.0001, q));
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let b0: number;
  let b1: number;
  let b2: number;
  if (kind === 'lowpass') {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = b0;
  } else if (kind === 'highpass') {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = b0;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Direct form I. Recomputes coefficients per sample when the cutoff sweeps. */
export function applyBiquad(
  input: Float32Array,
  kind: FilterKind,
  hzStart: number,
  hzEnd: number,
  q: number,
  sampleRate: number,
): Float32Array {
  const n = input.length;
  const out = new Float32Array(n);
  const sweeps = hzEnd !== hzStart;
  let c = biquadCoeffs(kind, hzStart, q, sampleRate);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < n; i++) {
    if (sweeps) {
      const t = n <= 1 ? 0 : i / (n - 1);
      c = biquadCoeffs(kind, hzStart + (hzEnd - hzStart) * t, q, sampleRate);
    }
    const x = input[i];
    const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dsp.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 6: CHANGELOG and commit**

Add under `## Unreleased` in `CHANGELOG.md`:

```markdown
### 2026-10-05 - Audio synth DSP primitives (GS task 1)

- Added `game-next/src/audio-synth/dsp.ts`: seeded `mulberry32` PRNG, white and pink `noise`, an AD/ADSR `envelope`, gliding `osc` for sine/triangle/saw/square, two-operator `fmOsc`, and RBJ `biquadCoeffs` / `applyBiquad` with per-sample cutoff sweeping. The file imports nothing.
- Verification: `tests/dsp.test.ts` failed first, then passed (14 tests); filter tests assert real attenuation by comparing tone RMS across the cutoff. `npm run typecheck` clean. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/dsp.ts game-next/tests/dsp.test.ts CHANGELOG.md
git commit -m "feat(audio): add deterministic DSP primitives"
```

---

### Task 2: Patch types and validation

**Files:**
- Create: `game-next/src/audio-synth/patch.ts`
- Test: `game-next/tests/audioPatchValidate.test.ts`

**Interfaces:**
- Consumes: `EnvelopeShape`, `OscKind`, `FilterKind` (Task 1).
- Produces:
  - `type Envelope = EnvelopeShape`
  - `type Source = { kind: OscKind; hz: number; glideToHz?: number } | { kind: 'noise'; color: 'white' | 'pink' } | { kind: 'fm'; carrierHz: number; ratio: number; index: number; indexEnv?: Envelope }`
  - `type Filter = { kind: FilterKind; hz: number; q?: number; sweepToHz?: number }`
  - `type Layer = { startMs?: number; source: Source; env: Envelope; filter?: Filter; gain?: number }`
  - `type NormalizeTarget = { peak: number } | { rms: number }`
  - `type Patch = { durationMs: number; seed: number; layers: Layer[]; normalize: NormalizeTarget }`
  - `type PatchIssue = { path: string; message: string }`
  - `validatePatch(patch: Patch, sampleRate: number): PatchIssue[]` — empty means valid

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioPatchValidate.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { validatePatch } from '../src/audio-synth/patch.ts';
import type { Patch } from '../src/audio-synth/patch.ts';

const SR = 44100;

const good = (): Patch => ({
  durationMs: 200,
  seed: 1,
  layers: [{ source: { kind: 'sine', hz: 440 }, env: { attackMs: 1, decayMs: 190 } }],
  normalize: { peak: 0.8 },
});

describe('validatePatch', () => {
  test('a well-formed patch has no issues', () => {
    expect(validatePatch(good(), SR)).toEqual([]);
  });

  test('duration must be positive', () => {
    const patch = { ...good(), durationMs: 0 };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('durationMs');
  });

  test('at least one layer is required', () => {
    const patch = { ...good(), layers: [] };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers');
  });

  test('a layer cannot start after the patch ends', () => {
    const patch = good();
    patch.layers[0].startMs = 500;
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers[0].startMs');
  });

  test('a filter cutoff above Nyquist is rejected', () => {
    const patch = good();
    patch.layers[0].filter = { kind: 'lowpass', hz: 30000 };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers[0].filter.hz');
  });

  test('a sweep target above Nyquist is rejected', () => {
    const patch = good();
    patch.layers[0].filter = { kind: 'lowpass', hz: 1000, sweepToHz: 40000 };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers[0].filter.sweepToHz');
  });

  test('non-finite numbers are rejected wherever they appear', () => {
    const patch = good();
    patch.layers[0].source = { kind: 'sine', hz: Number.NaN };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers[0].source.hz');
  });

  test('normalize targets must be positive and at most one', () => {
    expect(validatePatch({ ...good(), normalize: { peak: 0 } }, SR).map((i) => i.path)).toContain(
      'normalize.peak',
    );
    expect(validatePatch({ ...good(), normalize: { rms: 1.5 } }, SR).map((i) => i.path)).toContain(
      'normalize.rms',
    );
  });

  test('envelope times cannot be negative', () => {
    const patch = good();
    patch.layers[0].env = { attackMs: -1, decayMs: 10 };
    expect(validatePatch(patch, SR).map((i) => i.path)).toContain('layers[0].env.attackMs');
  });

  test('every issue carries a human-readable message', () => {
    const patch = { ...good(), durationMs: -5 };
    for (const issue of validatePatch(patch, SR)) expect(issue.message.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioPatchValidate.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/patch.ts`.

- [ ] **Step 3: Implement**

`game-next/src/audio-synth/patch.ts`:

```ts
/**
 * The declarative description of one sound.
 *
 * Five concepts: a Source makes raw signal, an Envelope shapes its level,
 * a Filter colours it, a Layer binds those together, and normalize sets how
 * loud the finished sum is. Layers are summed; startMs offsets one so a
 * single patch can hold a chord or an arpeggio.
 */
import type { EnvelopeShape, FilterKind, OscKind } from './dsp.ts';

export type Envelope = EnvelopeShape;

export type Source =
  | { kind: OscKind; hz: number; glideToHz?: number }
  | { kind: 'noise'; color: 'white' | 'pink' }
  | { kind: 'fm'; carrierHz: number; ratio: number; index: number; indexEnv?: Envelope };

export type Filter = { kind: FilterKind; hz: number; q?: number; sweepToHz?: number };

export type Layer = {
  startMs?: number;
  source: Source;
  env: Envelope;
  filter?: Filter;
  gain?: number;
};

export type NormalizeTarget = { peak: number } | { rms: number };

export type Patch = {
  durationMs: number;
  seed: number;
  layers: Layer[];
  normalize: NormalizeTarget;
};

export type PatchIssue = { path: string; message: string };

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function checkEnvelope(env: Envelope, path: string, issues: PatchIssue[]): void {
  for (const key of ['attackMs', 'decayMs'] as const) {
    if (!finite(env[key]) || env[key] < 0) {
      issues.push({ path: `${path}.${key}`, message: `${key} must be a number >= 0` });
    }
  }
  if (env.releaseMs !== undefined && (!finite(env.releaseMs) || env.releaseMs < 0)) {
    issues.push({ path: `${path}.releaseMs`, message: 'releaseMs must be a number >= 0' });
  }
  if (env.sustain !== undefined && (!finite(env.sustain) || env.sustain < 0 || env.sustain > 1)) {
    issues.push({ path: `${path}.sustain`, message: 'sustain must be between 0 and 1' });
  }
}

/** Returns every problem it can find. An empty array means the patch renders. */
export function validatePatch(patch: Patch, sampleRate: number): PatchIssue[] {
  const issues: PatchIssue[] = [];
  const nyquist = sampleRate / 2;

  if (!finite(patch.durationMs) || patch.durationMs <= 0) {
    issues.push({ path: 'durationMs', message: 'durationMs must be a number > 0' });
  }
  if (!finite(patch.seed)) {
    issues.push({ path: 'seed', message: 'seed must be a finite number' });
  }
  if (!Array.isArray(patch.layers) || patch.layers.length === 0) {
    issues.push({ path: 'layers', message: 'a patch needs at least one layer' });
  }

  if ('peak' in patch.normalize) {
    const { peak } = patch.normalize;
    if (!finite(peak) || peak <= 0 || peak > 1) {
      issues.push({ path: 'normalize.peak', message: 'peak must be between 0 (exclusive) and 1' });
    }
  } else {
    const { rms } = patch.normalize;
    if (!finite(rms) || rms <= 0 || rms > 1) {
      issues.push({ path: 'normalize.rms', message: 'rms must be between 0 (exclusive) and 1' });
    }
  }

  (patch.layers ?? []).forEach((layer, i) => {
    const at = `layers[${i}]`;

    if (layer.startMs !== undefined) {
      if (!finite(layer.startMs) || layer.startMs < 0) {
        issues.push({ path: `${at}.startMs`, message: 'startMs must be a number >= 0' });
      } else if (layer.startMs >= patch.durationMs) {
        issues.push({ path: `${at}.startMs`, message: 'startMs must be before the patch ends' });
      }
    }
    if (layer.gain !== undefined && (!finite(layer.gain) || layer.gain < 0)) {
      issues.push({ path: `${at}.gain`, message: 'gain must be a number >= 0' });
    }

    const src = layer.source;
    if (src.kind === 'noise') {
      if (src.color !== 'white' && src.color !== 'pink') {
        issues.push({ path: `${at}.source.color`, message: 'color must be white or pink' });
      }
    } else if (src.kind === 'fm') {
      for (const key of ['carrierHz', 'ratio', 'index'] as const) {
        if (!finite(src[key]) || src[key] < 0) {
          issues.push({ path: `${at}.source.${key}`, message: `${key} must be a number >= 0` });
        }
      }
      if (finite(src.carrierHz) && src.carrierHz > nyquist) {
        issues.push({ path: `${at}.source.carrierHz`, message: 'carrierHz is above Nyquist' });
      }
      if (src.indexEnv) checkEnvelope(src.indexEnv, `${at}.source.indexEnv`, issues);
    } else {
      if (!finite(src.hz) || src.hz <= 0) {
        issues.push({ path: `${at}.source.hz`, message: 'hz must be a number > 0' });
      } else if (src.hz > nyquist) {
        issues.push({ path: `${at}.source.hz`, message: 'hz is above Nyquist' });
      }
      if (src.glideToHz !== undefined && (!finite(src.glideToHz) || src.glideToHz <= 0)) {
        issues.push({ path: `${at}.source.glideToHz`, message: 'glideToHz must be a number > 0' });
      }
    }

    checkEnvelope(layer.env, `${at}.env`, issues);

    if (layer.filter) {
      const f = layer.filter;
      if (!finite(f.hz) || f.hz <= 0 || f.hz >= nyquist) {
        issues.push({ path: `${at}.filter.hz`, message: 'filter hz must be between 0 and Nyquist' });
      }
      if (f.sweepToHz !== undefined && (!finite(f.sweepToHz) || f.sweepToHz <= 0 || f.sweepToHz >= nyquist)) {
        issues.push({
          path: `${at}.filter.sweepToHz`,
          message: 'filter sweepToHz must be between 0 and Nyquist',
        });
      }
      if (f.q !== undefined && (!finite(f.q) || f.q <= 0)) {
        issues.push({ path: `${at}.filter.q`, message: 'q must be a number > 0' });
      }
    }
  });

  return issues;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/audioPatchValidate.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: CHANGELOG and commit**

```markdown
### 2026-10-05 - Audio patch model and validation (GS task 2)

- Added `game-next/src/audio-synth/patch.ts`: the declarative `Patch` / `Layer` / `Source` / `Envelope` / `Filter` types and `validatePatch`, which reports every problem it finds with a path and a message rather than throwing on the first.
- Verification: `tests/audioPatchValidate.test.ts` failed first, then passed (10 tests) covering duration, empty layers, late `startMs`, cutoffs above Nyquist, NaN, normalize bounds and negative envelope times. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/patch.ts game-next/tests/audioPatchValidate.test.ts CHANGELOG.md
git commit -m "feat(audio): add the patch model and validator"
```

---

### Task 3: Normalize and render

**Files:**
- Create: `game-next/src/audio-synth/normalize.ts`, `game-next/src/audio-synth/render.ts`
- Test: `game-next/tests/audioRender.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1 and 2.
- Produces:
  - `type Measurement = { peak: number; rms: number }`
  - `measure(samples: Float32Array): Measurement`
  - `applyNormalize(samples: Float32Array, target: NormalizeTarget): Float32Array`
  - `FADE_OUT_MS = 3`
  - `renderPatch(patch: Patch, sampleRate: number): Float32Array` — throws `Error` listing issues if the patch is invalid

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioRender.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { applyNormalize, measure } from '../src/audio-synth/normalize.ts';
import type { Patch } from '../src/audio-synth/patch.ts';
import { FADE_OUT_MS, renderPatch } from '../src/audio-synth/render.ts';

const SR = 44100;

const simple = (over: Partial<Patch> = {}): Patch => ({
  durationMs: 200,
  seed: 11,
  layers: [{ source: { kind: 'sine', hz: 440 }, env: { attackMs: 1, decayMs: 199 } }],
  normalize: { peak: 0.8 },
  ...over,
});

describe('measure and applyNormalize', () => {
  test('measure reports peak and rms', () => {
    const m = measure(Float32Array.from([0, 0.5, -1, 0.5]));
    expect(m.peak).toBe(1);
    expect(m.rms).toBeCloseTo(Math.sqrt((0 + 0.25 + 1 + 0.25) / 4), 6);
  });

  test('a peak target scales the loudest sample onto it', () => {
    const out = applyNormalize(Float32Array.from([0.1, -0.2, 0.05]), { peak: 0.9 });
    expect(measure(out).peak).toBeCloseTo(0.9, 6);
  });

  test('an rms target scales to that rms', () => {
    const out = applyNormalize(Float32Array.from([0.1, -0.1, 0.1, -0.1]), { rms: 0.4 });
    expect(measure(out).rms).toBeCloseTo(0.4, 6);
  });

  test('an rms target never pushes the peak past 0.99', () => {
    const out = applyNormalize(Float32Array.from([0.001, 0.5, -0.001]), { rms: 0.9 });
    expect(measure(out).peak).toBeLessThanOrEqual(0.99 + 1e-6);
  });

  test('silence is left alone instead of dividing by zero', () => {
    const out = applyNormalize(new Float32Array(16), { peak: 0.8 });
    expect(Array.from(out)).toEqual(Array.from(new Float32Array(16)));
  });
});

describe('renderPatch', () => {
  test('produces exactly the requested number of samples', () => {
    expect(renderPatch(simple(), SR).length).toBe(Math.round((200 * SR) / 1000));
    expect(renderPatch(simple({ durationMs: 1000 }), 8000).length).toBe(8000);
  });

  test('is deterministic for a noise patch', () => {
    const noisy = simple({
      layers: [{ source: { kind: 'noise', color: 'white' }, env: { attackMs: 1, decayMs: 199 } }],
    });
    expect(Array.from(renderPatch(noisy, SR))).toEqual(Array.from(renderPatch(noisy, SR)));
  });

  test('a different seed gives different samples', () => {
    const a = simple({
      seed: 1,
      layers: [{ source: { kind: 'noise', color: 'white' }, env: { attackMs: 1, decayMs: 199 } }],
    });
    const b = { ...a, seed: 2 };
    expect(Array.from(renderPatch(a, SR))).not.toEqual(Array.from(renderPatch(b, SR)));
  });

  test('every sample is finite and within range', () => {
    const out = renderPatch(simple(), SR);
    for (const v of out) {
      expect(Number.isFinite(v)).toBe(true);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
  });

  test('hits the normalize target', () => {
    expect(measure(renderPatch(simple({ normalize: { peak: 0.5 } }), SR)).peak).toBeCloseTo(0.5, 3);
  });

  test('a layer with startMs is silent before it starts', () => {
    const delayed = simple({
      durationMs: 400,
      layers: [
        { startMs: 200, source: { kind: 'sine', hz: 440 }, env: { attackMs: 1, decayMs: 199 } },
      ],
    });
    const out = renderPatch(delayed, SR);
    const startSample = Math.round((200 * SR) / 1000);
    for (let i = 0; i < startSample; i++) expect(out[i]).toBe(0);
    expect(Math.max(...Array.from(out.subarray(startSample)).map(Math.abs))).toBeGreaterThan(0.1);
  });

  test('two layers sum', () => {
    const two = simple({
      normalize: { peak: 1 },
      layers: [
        { source: { kind: 'sine', hz: 200 }, env: { attackMs: 0, decayMs: 0, sustain: 1 } },
        { source: { kind: 'sine', hz: 200 }, env: { attackMs: 0, decayMs: 0, sustain: 1 } },
      ],
    });
    const one = simple({
      normalize: { peak: 1 },
      layers: [{ source: { kind: 'sine', hz: 200 }, env: { attackMs: 0, decayMs: 0, sustain: 1 } }],
    });
    // Both normalize to the same peak, so compare the pre-normalize shape via rms ratio.
    expect(measure(renderPatch(two, SR)).rms).toBeCloseTo(measure(renderPatch(one, SR)).rms, 2);
  });

  test('gain scales a layer relative to its neighbour', () => {
    const patch = simple({
      normalize: { peak: 1 },
      layers: [
        { source: { kind: 'sine', hz: 200 }, env: { attackMs: 0, decayMs: 0, sustain: 1 }, gain: 1 },
        { startMs: 100, source: { kind: 'sine', hz: 900 }, env: { attackMs: 0, decayMs: 0, sustain: 1 }, gain: 0.1 },
      ],
    });
    const out = renderPatch(patch, SR);
    expect(Number.isFinite(out[0])).toBe(true);
    expect(measure(out).peak).toBeCloseTo(1, 3);
  });

  test('the tail fades out so playback does not click', () => {
    const out = renderPatch(
      simple({ layers: [{ source: { kind: 'sine', hz: 200 }, env: { attackMs: 0, decayMs: 0, sustain: 1 } }] }),
      SR,
    );
    expect(Math.abs(out[out.length - 1])).toBeLessThan(0.02);
    const beforeFade = out.length - Math.round((FADE_OUT_MS * SR) / 1000) - 1;
    expect(Math.abs(out[beforeFade])).toBeGreaterThan(0.1);
  });

  test('an invalid patch throws with the offending paths', () => {
    expect(() => renderPatch(simple({ durationMs: -1 }), SR)).toThrow(/durationMs/);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioRender.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/normalize.ts`.

- [ ] **Step 3: Implement `normalize.ts`**

`game-next/src/audio-synth/normalize.ts`:

```ts
import type { NormalizeTarget } from './patch.ts';

export type Measurement = { peak: number; rms: number };

/** Hard ceiling applied after an rms target, so a quiet-but-spiky patch cannot clip. */
export const CEILING = 0.99;

export function measure(samples: Float32Array): Measurement {
  let peak = 0;
  let sum = 0;
  for (const v of samples) {
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sum += v * v;
  }
  return { peak, rms: samples.length === 0 ? 0 : Math.sqrt(sum / samples.length) };
}

/** Scales in place-free fashion; silence is returned untouched rather than divided by zero. */
export function applyNormalize(samples: Float32Array, target: NormalizeTarget): Float32Array {
  const { peak, rms } = measure(samples);
  let scale: number;
  if ('peak' in target) {
    if (peak === 0) return samples;
    scale = target.peak / peak;
  } else {
    if (rms === 0) return samples;
    scale = target.rms / rms;
    if (peak * scale > CEILING) scale = CEILING / peak;
  }
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * scale;
  return out;
}
```

- [ ] **Step 4: Implement `render.ts`**

`game-next/src/audio-synth/render.ts`:

```ts
/**
 * Turns a Patch into samples.
 *
 * Per layer: build the source, colour it with the filter, shape it with the
 * envelope, scale by gain, and add it into the mix at its start offset. Then
 * normalize the sum and fade the last few milliseconds so playback cannot click.
 */
import { applyBiquad, envelope, fmOsc, mulberry32, noise, osc } from './dsp.ts';
import { validatePatch } from './patch.ts';
import type { Layer, Patch } from './patch.ts';
import { applyNormalize } from './normalize.ts';

export const FADE_OUT_MS = 3;

/** Each layer gets its own PRNG stream, so adding a layer does not disturb earlier ones. */
const SEED_STRIDE = 7919;

function renderLayer(layer: Layer, seed: number, n: number, sampleRate: number): Float32Array {
  const src = layer.source;
  let signal: Float32Array;

  if (src.kind === 'noise') {
    signal = noise(src.color, n, mulberry32(seed));
  } else if (src.kind === 'fm') {
    const indexEnv = src.indexEnv ? envelope(src.indexEnv, n, sampleRate) : null;
    signal = fmOsc(src.carrierHz, src.ratio, src.index, indexEnv, n, sampleRate);
  } else {
    signal = osc(src.kind, src.hz, src.glideToHz ?? src.hz, n, sampleRate);
  }

  if (layer.filter) {
    const f = layer.filter;
    signal = applyBiquad(signal, f.kind, f.hz, f.sweepToHz ?? f.hz, f.q ?? 0.707, sampleRate);
  }

  const env = envelope(layer.env, n, sampleRate);
  const gain = layer.gain ?? 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = signal[i] * env[i] * gain;
  return out;
}

export function renderPatch(patch: Patch, sampleRate: number): Float32Array {
  const issues = validatePatch(patch, sampleRate);
  if (issues.length > 0) {
    throw new Error(
      `invalid patch: ${issues.map((i) => `${i.path} (${i.message})`).join('; ')}`,
    );
  }

  const n = Math.round((patch.durationMs * sampleRate) / 1000);
  const mix = new Float32Array(n);

  patch.layers.forEach((layer, index) => {
    const start = Math.round(((layer.startMs ?? 0) * sampleRate) / 1000);
    const length = n - start;
    if (length <= 0) return;
    const rendered = renderLayer(layer, patch.seed + index * SEED_STRIDE, length, sampleRate);
    for (let i = 0; i < length; i++) mix[start + i] += rendered[i];
  });

  const normalized = applyNormalize(mix, patch.normalize);

  const fade = Math.min(normalized.length, Math.round((FADE_OUT_MS * sampleRate) / 1000));
  for (let i = 0; i < fade; i++) {
    const idx = normalized.length - fade + i;
    normalized[idx] *= 1 - i / fade;
  }
  return normalized;
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/audioRender.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 6: Run the whole suite and typecheck**

Run: `npm run typecheck && npm test`
Expected: all PASS; the earlier 829 tests still pass.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-05 - Audio patch renderer (GS task 3)

- Added `game-next/src/audio-synth/normalize.ts` (`measure`, `applyNormalize` with a 0.99 ceiling on rms targets) and `game-next/src/audio-synth/render.ts` (`renderPatch`), which builds each layer, filters it, shapes it, sums at the layer's start offset, normalizes, and applies a 3 ms fade-out so playback cannot click.
- Each layer draws from its own seeded PRNG stream, so adding a layer leaves earlier layers byte-identical.
- Verification: `tests/audioRender.test.ts` failed first, then passed (16 tests) including byte-identical repeat renders, the `startMs` silence window, the normalize target and the fade-out. `npm run typecheck` and the full `npm test` clean. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/normalize.ts game-next/src/audio-synth/render.ts game-next/tests/audioRender.test.ts CHANGELOG.md
git commit -m "feat(audio): render patches to samples deterministically"
```

---

### Task 4: WAV encoding

**Files:**
- Create: `game-next/src/audio-synth/wav.ts`
- Test: `game-next/tests/wav.test.ts`

**Interfaces:**
- Produces:
  - `encodeWav(samples: Float32Array, sampleRate: number): Uint8Array` — 16-bit PCM, mono
  - `decodeWavSamples(bytes: Uint8Array): { sampleRate: number; samples: Float32Array }`

- [ ] **Step 1: Write the failing test**

`game-next/tests/wav.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { decodeWavSamples, encodeWav } from '../src/audio-synth/wav.ts';

const ascii = (bytes: Uint8Array, at: number, len: number) =>
  String.fromCharCode(...Array.from(bytes.subarray(at, at + len)));

describe('encodeWav', () => {
  test('writes a RIFF/WAVE header for 16-bit mono', () => {
    const bytes = encodeWav(Float32Array.from([0, 0.5, -0.5]), 44100);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(ascii(bytes, 0, 4)).toBe('RIFF');
    expect(ascii(bytes, 8, 4)).toBe('WAVE');
    expect(ascii(bytes, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16); // PCM fmt chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(ascii(bytes, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(3 * 2);
    expect(bytes.length).toBe(44 + 3 * 2);
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
  });

  test('clamps samples outside the range instead of wrapping', () => {
    const { samples } = decodeWavSamples(encodeWav(Float32Array.from([2, -2]), 8000));
    expect(samples[0]).toBeCloseTo(1, 3);
    expect(samples[1]).toBeCloseTo(-1, 3);
  });
});

describe('round trip', () => {
  test('decoding what was encoded returns the same audio within 16-bit precision', () => {
    const original = new Float32Array(512);
    for (let i = 0; i < original.length; i++) original[i] = Math.sin((i / 512) * Math.PI * 8) * 0.8;
    const { sampleRate, samples } = decodeWavSamples(encodeWav(original, 22050));
    expect(sampleRate).toBe(22050);
    expect(samples.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) expect(samples[i]).toBeCloseTo(original[i], 3);
  });

  test('an empty buffer survives the trip', () => {
    const { samples } = decodeWavSamples(encodeWav(new Float32Array(0), 44100));
    expect(samples.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/wav.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/wav.ts`.

- [ ] **Step 3: Implement**

`game-next/src/audio-synth/wav.ts`:

```ts
/** Minimal 16-bit PCM mono WAV reader and writer. No dependencies, browser and Node alike. */

const HEADER_BYTES = 44;

function writeAscii(view: DataView, at: number, text: string): void {
  for (let i = 0; i < text.length; i++) view.setUint8(at + i, text.charCodeAt(i));
}

export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataBytes = samples.length * 2;
  const bytes = new Uint8Array(HEADER_BYTES + dataBytes);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, HEADER_BYTES + dataBytes - 8, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(HEADER_BYTES + i * 2, Math.round(clamped * 32767), true);
  }
  return bytes;
}

export function decodeWavSamples(bytes: Uint8Array): {
  sampleRate: number;
  samples: Float32Array;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sampleRate = view.getUint32(24, true);
  const dataBytes = view.getUint32(40, true);
  const count = Math.floor(dataBytes / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) samples[i] = view.getInt16(HEADER_BYTES + i * 2, true) / 32767;
  return { sampleRate, samples };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/wav.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: CHANGELOG and commit**

```markdown
### 2026-10-05 - WAV encoder for audio review artifacts (GS task 4)

- Added `game-next/src/audio-synth/wav.ts`: `encodeWav` writes 16-bit PCM mono with a correct RIFF header and clamps out-of-range samples; `decodeWavSamples` reads it back so the round trip is testable rather than header-deep.
- Verification: `tests/wav.test.ts` failed first, then passed (4 tests) checking every header field, clamping, a 512-sample sine round trip within 16-bit precision, and the empty buffer. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/wav.ts game-next/tests/wav.test.ts CHANGELOG.md
git commit -m "feat(audio): add a WAV encoder and decoder"
```

---

### Task 5: Mirror's eight patches

**Files:**
- Create: `game-next/src/content/audio/root.ts`
- Create: `game-next/src/content/audio/index.ts`
- Create: `game-next/src/content/audio/sources/bell.ts`, `tick.ts`, `tapSoft.ts`, `thud.ts`, `hollow.ts`, `shimmer.ts`, `swish.ts`, `stingerWin.ts`
- Test: `game-next/tests/audioPatches.test.ts`

**Interfaces:**
- Consumes: `Patch` (Task 2), `renderPatch`, `measure` (Task 3).
- Produces:
  - `MUSIC_ROOT_HZ: number` in `root.ts`, re-exported from `index.ts`
  - `type SfxKey = 'bell' | 'tick' | 'tap-soft' | 'thud' | 'hollow' | 'shimmer' | 'swish' | 'stinger-win'`
  - `SFX_KEYS: readonly SfxKey[]`
  - `SFX_PATCHES: Record<SfxKey, Patch>`

Note the file names are camelCase (`tapSoft.ts`) while the keys are kebab-case (`tap-soft`), matching how the rest of `src/` names files.

**`MUSIC_ROOT_HZ` lives in its own file on purpose.** Three patches need it, and `index.ts` imports those patches. If the constant lived in `index.ts` the graph would be circular, and because the patches read it while their module is still evaluating, the second module in the cycle would hit the temporal dead zone and throw `ReferenceError` at import time. A leaf module both sides can import removes the cycle; `index.ts` re-exports it so callers see one entry point.

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioPatches.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { MUSIC_ROOT_HZ, SFX_KEYS, SFX_PATCHES } from '../src/content/audio/index.ts';
import type { SfxKey } from '../src/content/audio/index.ts';
import { validatePatch } from '../src/audio-synth/patch.ts';
import { measure } from '../src/audio-synth/normalize.ts';
import { renderPatch } from '../src/audio-synth/render.ts';

const SR = 44100;

/** The sound brief in spec G section 3.2, as a check rather than a promise. */
const LIMIT_MS: Record<SfxKey, { min?: number; max: number }> = {
  bell: { max: 1500 },
  tick: { max: 150 },
  'tap-soft': { max: 300 },
  thud: { max: 400 },
  hollow: { max: 1000 },
  shimmer: { max: 1000 },
  swish: { max: 600 },
  'stinger-win': { min: 3000, max: 5000 },
};

describe('Mirror sfx patches', () => {
  test('one patch per key, no extras', () => {
    expect(Object.keys(SFX_PATCHES).sort()).toEqual([...SFX_KEYS].sort());
    expect(SFX_KEYS).toHaveLength(8);
  });

  test('every patch is valid', () => {
    for (const key of SFX_KEYS) {
      expect(validatePatch(SFX_PATCHES[key], SR), key).toEqual([]);
    }
  });

  test('every patch is inside the brief length limit', () => {
    for (const key of SFX_KEYS) {
      const { durationMs } = SFX_PATCHES[key];
      expect(durationMs, key).toBeLessThanOrEqual(LIMIT_MS[key].max);
      if (LIMIT_MS[key].min !== undefined) {
        expect(durationMs, key).toBeGreaterThanOrEqual(LIMIT_MS[key].min);
      }
    }
  });

  test('every patch renders to audible, in-range, finite audio', () => {
    for (const key of SFX_KEYS) {
      const out = renderPatch(SFX_PATCHES[key], SR);
      const { peak, rms } = measure(out);
      expect(peak, `${key} peak`).toBeGreaterThan(0.1);
      expect(peak, `${key} peak`).toBeLessThanOrEqual(1);
      expect(rms, `${key} rms`).toBeGreaterThan(0.001);
      for (const v of out) expect(Number.isFinite(v)).toBe(true);
    }
  });

  test('renders repeat byte for byte', () => {
    for (const key of SFX_KEYS) {
      expect(Array.from(renderPatch(SFX_PATCHES[key], SR))).toEqual(
        Array.from(renderPatch(SFX_PATCHES[key], SR)),
      );
    }
  });

  test('the bell is built on the music root so it sits in key', () => {
    const bell = SFX_PATCHES.bell;
    const layer = bell.layers[0];
    expect(layer.source.kind).toBe('fm');
    if (layer.source.kind !== 'fm') throw new Error('unreachable');
    expect(layer.source.carrierHz / MUSIC_ROOT_HZ).toBeCloseTo(2, 5);
  });

  test('the stinger resolves on its last voice', () => {
    const stinger = SFX_PATCHES['stinger-win'];
    expect(stinger.layers.length).toBeGreaterThanOrEqual(3);
    const starts = stinger.layers.map((l) => l.startMs ?? 0);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
    const last = stinger.layers[stinger.layers.length - 1].source;
    if (last.kind !== 'fm') throw new Error('the stinger voices are fm');
    // The final voice is the octave above the root.
    expect(last.carrierHz / MUSIC_ROOT_HZ).toBeCloseTo(4, 2);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioPatches.test.ts`
Expected: FAIL — cannot resolve `../src/content/audio/index.ts`.

- [ ] **Step 3: Write the root and the registry**

`game-next/src/content/audio/root.ts`:

```ts
/**
 * The tonal centre every pitched effect is built on: D4.
 *
 * Set this to the root of whatever music the reviewer sources, and the bell
 * is in tune by construction. There is nothing to measure.
 *
 * It sits in its own file because the patches that use it are themselves
 * imported by index.ts; a constant exported from index.ts would make that
 * graph circular and throw at import time.
 */
export const MUSIC_ROOT_HZ = 293.66;
```

`game-next/src/content/audio/index.ts`:

```ts
/**
 * Mirror's sound effects, as patches rather than files.
 *
 * The engine that renders these lives in src/audio-synth/ and knows nothing
 * about Mirror. This file is the Mirror-side content, the same way
 * src/content/sources/ holds level content.
 */
import type { Patch } from '../../audio-synth/patch.ts';
import { bell } from './sources/bell.ts';
import { hollow } from './sources/hollow.ts';
import { shimmer } from './sources/shimmer.ts';
import { stingerWin } from './sources/stingerWin.ts';
import { swish } from './sources/swish.ts';
import { tapSoft } from './sources/tapSoft.ts';
import { thud } from './sources/thud.ts';
import { tick } from './sources/tick.ts';

export type SfxKey =
  | 'bell'
  | 'tick'
  | 'tap-soft'
  | 'thud'
  | 'hollow'
  | 'shimmer'
  | 'swish'
  | 'stinger-win';

export const SFX_KEYS: readonly SfxKey[] = [
  'bell',
  'tick',
  'tap-soft',
  'thud',
  'hollow',
  'shimmer',
  'swish',
  'stinger-win',
];

export { MUSIC_ROOT_HZ } from './root.ts';

export const SFX_PATCHES: Record<SfxKey, Patch> = {
  bell,
  tick,
  'tap-soft': tapSoft,
  thud,
  hollow,
  shimmer,
  swish,
  'stinger-win': stingerWin,
};
```

- [ ] **Step 4: Write the eight patches**

`game-next/src/content/audio/sources/bell.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Crystal bell, one clear pitch, an octave above the music root.
 *
 * A ratio of 3.5 is deliberately not a whole number: the partials it creates
 * do not line up with the harmonic series, and that mismatch is what the ear
 * reads as struck glass or metal rather than an organ pipe. The modulation
 * index falls away fast, so the strike is bright and the tail is pure.
 */
export const bell: Patch = {
  durationMs: 1400,
  seed: 101,
  layers: [
    {
      source: {
        kind: 'fm',
        carrierHz: MUSIC_ROOT_HZ * 2,
        ratio: 3.5,
        index: 6,
        indexEnv: { attackMs: 0, decayMs: 180, curve: 'exp' },
      },
      env: { attackMs: 2, decayMs: 1398, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.9 },
};
```

`game-next/src/content/audio/sources/tick.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';

/** Very light glass tap: a high noise burst, gone almost before it registers. */
export const tick: Patch = {
  durationMs: 120,
  seed: 102,
  layers: [
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'highpass', hz: 6000, q: 0.8 },
      env: { attackMs: 1, decayMs: 59, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.5 },
};
```

`game-next/src/content/audio/sources/tapSoft.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';

/** Soft, low, muted tap: a short sine with the top rolled off. */
export const tapSoft: Patch = {
  durationMs: 220,
  seed: 103,
  layers: [
    {
      source: { kind: 'sine', hz: 180 },
      filter: { kind: 'lowpass', hz: 900, q: 0.7 },
      env: { attackMs: 3, decayMs: 120, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.6 },
};
```

`game-next/src/content/audio/sources/thud.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';

/**
 * Dull, blocked knock. A falling sine gives the weight; a short lowpassed
 * noise layer on top gives the contact its edge.
 */
export const thud: Patch = {
  durationMs: 350,
  seed: 104,
  layers: [
    {
      source: { kind: 'sine', hz: 120, glideToHz: 60 },
      env: { attackMs: 2, decayMs: 220, curve: 'exp' },
    },
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'lowpass', hz: 400, q: 0.7 },
      env: { attackMs: 1, decayMs: 90, curve: 'exp' },
      gain: 0.4,
    },
  ],
  normalize: { peak: 0.8 },
};
```

`game-next/src/content/audio/sources/hollow.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';

/**
 * Low, airy breath. Pink noise through a narrow bandpass, with a slow attack
 * so it swells rather than starts. An rms target keeps it present without a
 * peak that fights the sharper cues.
 */
export const hollow: Patch = {
  durationMs: 900,
  seed: 105,
  layers: [
    {
      source: { kind: 'noise', color: 'pink' },
      filter: { kind: 'bandpass', hz: 320, q: 1.4 },
      env: { attackMs: 300, decayMs: 560, curve: 'lin' },
    },
  ],
  normalize: { rms: 0.12 },
};
```

`game-next/src/content/audio/sources/shimmer.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Bright sparkle. Three high partials of the root, each drifting a couple of
 * hertz over its life so they beat gently against one another instead of
 * sitting still.
 */
export const shimmer: Patch = {
  durationMs: 900,
  seed: 106,
  layers: [
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 8, glideToHz: MUSIC_ROOT_HZ * 8 + 2 },
      env: { attackMs: 10, decayMs: 880, curve: 'exp' },
    },
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 10, glideToHz: MUSIC_ROOT_HZ * 10 - 3 },
      env: { attackMs: 20, decayMs: 860, curve: 'exp' },
      gain: 0.7,
    },
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 12, glideToHz: MUSIC_ROOT_HZ * 12 + 4 },
      env: { attackMs: 35, decayMs: 840, curve: 'exp' },
      gain: 0.5,
    },
  ],
  normalize: { peak: 0.5 },
};
```

`game-next/src/content/audio/sources/swish.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';

/** Light air swish, falling: white noise through a bandpass sweeping downward. */
export const swish: Patch = {
  durationMs: 520,
  seed: 107,
  layers: [
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'bandpass', hz: 4000, q: 1.2, sweepToHz: 800 },
      env: { attackMs: 60, decayMs: 440, curve: 'lin' },
    },
  ],
  normalize: { peak: 0.5 },
};
```

`game-next/src/content/audio/sources/stingerWin.ts`:

```ts
import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Victory chord: four bell voices entering in turn and resolving on the
 * octave. The steps are 0, 4, 7 and 12 semitones above the bell's own
 * register, which is the same major-pentatonic world the in-level snaps use.
 */
const STEP = (semitones: number) => MUSIC_ROOT_HZ * 2 * 2 ** (semitones / 12);

const voice = (semitones: number, startMs: number, decayMs: number) =>
  ({
    startMs,
    source: {
      kind: 'fm' as const,
      carrierHz: STEP(semitones),
      ratio: 3.5,
      index: 5,
      indexEnv: { attackMs: 0, decayMs: 200, curve: 'exp' as const },
    },
    env: { attackMs: 3, decayMs, curve: 'exp' as const },
  });

export const stingerWin: Patch = {
  durationMs: 3600,
  seed: 108,
  layers: [
    voice(0, 0, 3000),
    voice(4, 180, 2800),
    voice(7, 360, 2600),
    voice(12, 620, 2900),
  ],
  normalize: { peak: 0.95 },
};
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/audioPatches.test.ts`
Expected: PASS, 7 tests.

If "every patch renders to audible audio" fails on `hollow` because its rms target leaves the peak low, do not loosen the test — raise `normalize.rms` until the peak clears 0.1. The reviewer re-tunes it at stop point 1 anyway.

- [ ] **Step 6: Typecheck and full suite**

Run: `npm run typecheck && npm test`
Expected: all PASS.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-05 - Mirror's eight sound effects as patches (GS task 5)

- Added `game-next/src/content/audio/index.ts` (`SfxKey`, `SFX_KEYS`, `SFX_PATCHES`, `MUSIC_ROOT_HZ` = 293.66 Hz / D4) and the eight patches under `game-next/src/content/audio/sources/`: `bell` (FM ratio 3.5 on the root's octave), `tick`, `tapSoft`, `thud`, `hollow`, `shimmer`, `swish` and `stingerWin` (four bell voices resolving on the octave).
- The bell is built from `MUSIC_ROOT_HZ`, so it is in the music's key by construction; nothing measures pitch.
- Verification: `tests/audioPatches.test.ts` failed first, then passed (7 tests). The sound brief's length table from spec G section 3.2 is now an assertion, alongside validity, audibility, finiteness and byte-identical repeat renders. `npm run typecheck` and the full `npm test` clean. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/content/audio game-next/tests/audioPatches.test.ts CHANGELOG.md
git commit -m "feat(audio): add the eight Mirror sound effect patches"
```

---

### Task 6: `audio:author` and review artifacts

**Files:**
- Create: `game-next/src/audio-synth/report.ts`
- Create: `game-next/scripts/audio-author.ts`
- Modify: `game-next/package.json` (add the `audio:author` script)
- Test: `game-next/tests/audioReport.test.ts`

**Interfaces:**
- Consumes: `SFX_KEYS`, `SFX_PATCHES` (Task 5); `renderPatch` (Task 3); `measure` (Task 3); `encodeWav` (Task 4).
- Produces:
  - `type ReportRow = { key: string; durationMs: number; peak: number; rms: number; pitchHz: number | null; limitMs: number; withinLimit: boolean }`
  - `renderWaveformSvg(samples: Float32Array, width?: number, height?: number): string`
  - `renderAudioReport(rows: readonly ReportRow[]): string`
  - `npm run audio:author [-- <key>... | --all]`, writing `docs/testing/audio/<key>.wav`, `<key>.svg` and `report.md`

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioReport.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { renderAudioReport, renderWaveformSvg } from '../src/audio-synth/report.ts';
import type { ReportRow } from '../src/audio-synth/report.ts';

const rows: ReportRow[] = [
  { key: 'bell', durationMs: 1400, peak: 0.9, rms: 0.21, pitchHz: 587.32, limitMs: 1500, withinLimit: true },
  { key: 'tick', durationMs: 120, peak: 0.5, rms: 0.08, pitchHz: null, limitMs: 150, withinLimit: true },
  { key: 'swish', durationMs: 700, peak: 0.5, rms: 0.1, pitchHz: null, limitMs: 600, withinLimit: false },
];

describe('renderWaveformSvg', () => {
  test('produces a self-contained svg sized as asked', () => {
    const svg = renderWaveformSvg(Float32Array.from([0, 0.5, -0.5, 1, -1]), 200, 40);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 200 40"');
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('<polyline');
  });

  test('an empty buffer still yields valid svg', () => {
    const svg = renderWaveformSvg(new Float32Array(0), 100, 20);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });
});

describe('renderAudioReport', () => {
  test('lists every row in a markdown table', () => {
    const md = renderAudioReport(rows);
    expect(md).toContain('| key | duration | limit | peak | rms | pitch |');
    for (const row of rows) expect(md).toContain(`| ${row.key} |`);
  });

  test('marks rows outside their limit', () => {
    const md = renderAudioReport(rows);
    const swishLine = md.split('\n').find((l) => l.startsWith('| swish |')) ?? '';
    const bellLine = md.split('\n').find((l) => l.startsWith('| bell |')) ?? '';
    expect(swishLine).toContain('OVER');
    expect(bellLine).not.toContain('OVER');
  });

  test('says how many failed', () => {
    expect(renderAudioReport(rows)).toContain('1 of 3 over the limit');
    expect(renderAudioReport([rows[0]])).toContain('all 1 within the limit');
  });

  test('shows a dash where there is no pitch', () => {
    const tickLine = renderAudioReport(rows).split('\n').find((l) => l.startsWith('| tick |')) ?? '';
    expect(tickLine).toContain('| — |');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioReport.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/report.ts`.

- [ ] **Step 3: Implement `report.ts`**

`game-next/src/audio-synth/report.ts`:

```ts
/** Pure renderers for the review artifacts: a waveform preview and a markdown summary. */

export type ReportRow = {
  key: string;
  durationMs: number;
  peak: number;
  rms: number;
  pitchHz: number | null;
  limitMs: number;
  withinLimit: boolean;
};

/** Min/max envelope per column, drawn as one polyline. */
export function renderWaveformSvg(samples: Float32Array, width = 640, height = 120): string {
  const mid = height / 2;
  const points: string[] = [];
  if (samples.length > 0) {
    const perColumn = Math.max(1, Math.floor(samples.length / width));
    for (let x = 0; x < width; x++) {
      const from = x * perColumn;
      if (from >= samples.length) break;
      const to = Math.min(samples.length, from + perColumn);
      let lo = samples[from];
      let hi = samples[from];
      for (let i = from; i < to; i++) {
        if (samples[i] < lo) lo = samples[i];
        if (samples[i] > hi) hi = samples[i];
      }
      points.push(`${x},${(mid - hi * mid).toFixed(2)}`);
      points.push(`${x},${(mid - lo * mid).toFixed(2)}`);
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `  <rect width="${width}" height="${height}" fill="#070a14"/>`,
    `  <line x1="0" y1="${mid}" x2="${width}" y2="${mid}" stroke="#1e293b" stroke-width="1"/>`,
    `  <polyline fill="none" stroke="#7fd8ff" stroke-width="1" points="${points.join(' ')}"/>`,
    `</svg>`,
    '',
  ].join('\n');
}

export function renderAudioReport(rows: readonly ReportRow[]): string {
  const over = rows.filter((r) => !r.withinLimit).length;
  const verdict =
    over === 0 ? `all ${rows.length} within the limit` : `${over} of ${rows.length} over the limit`;

  const lines = [
    '# Audio render report',
    '',
    'Generated by `npm run audio:author`. Nothing here ships; these are listening copies.',
    '',
    `Result: ${verdict}.`,
    '',
    '| key | duration | limit | peak | rms | pitch |',
    '|---|---|---|---|---|---|',
  ];
  for (const r of rows) {
    const flag = r.withinLimit ? '' : ' OVER';
    lines.push(
      `| ${r.key} | ${r.durationMs} ms${flag} | ${r.limitMs} ms | ${r.peak.toFixed(3)} | ${r.rms.toFixed(3)} | ${
        r.pitchHz === null ? '—' : `${r.pitchHz.toFixed(2)} Hz`
      } |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
```

- [ ] **Step 4: Run the report tests**

Run: `npx vitest run tests/audioReport.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the CLI**

`game-next/scripts/audio-author.ts`:

```ts
/**
 * Render Mirror's sound effects to listening copies.
 *
 *   npm run audio:author -- bell tick
 *   npm run audio:author -- --all
 *
 * Writes docs/testing/audio/<key>.wav, <key>.svg and report.md. None of it
 * ships: the game synthesizes these patches at runtime. Exits non-zero if a
 * patch is invalid or longer than the sound brief allows.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measure } from '../src/audio-synth/normalize.ts';
import { renderPatch } from '../src/audio-synth/render.ts';
import { renderAudioReport, renderWaveformSvg } from '../src/audio-synth/report.ts';
import type { ReportRow } from '../src/audio-synth/report.ts';
import { encodeWav } from '../src/audio-synth/wav.ts';
import { MUSIC_ROOT_HZ, SFX_KEYS, SFX_PATCHES } from '../src/content/audio/index.ts';
import type { SfxKey } from '../src/content/audio/index.ts';

const SAMPLE_RATE = 44100;
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../../docs/testing/audio');

/** Spec G section 3.2. Kept here as well as in the test so the CLI can fail loudly. */
const LIMIT_MS: Record<SfxKey, number> = {
  bell: 1500,
  tick: 150,
  'tap-soft': 300,
  thud: 400,
  hollow: 1000,
  shimmer: 1000,
  swish: 600,
  'stinger-win': 5000,
};

/** The configured pitch, read from the patch. Nothing is estimated. */
function pitchOf(key: SfxKey): number | null {
  const first = SFX_PATCHES[key].layers[0]?.source;
  if (!first) return null;
  if (first.kind === 'fm') return first.carrierHz;
  if (first.kind === 'noise') return null;
  return first.hz;
}

function main(): void {
  const args = process.argv.slice(2);
  const keys: SfxKey[] =
    args.length === 0 || args.includes('--all')
      ? [...SFX_KEYS]
      : (args.filter((a) => (SFX_KEYS as readonly string[]).includes(a)) as SfxKey[]);

  const unknown = args.filter(
    (a) => a !== '--all' && !(SFX_KEYS as readonly string[]).includes(a),
  );
  if (unknown.length > 0) {
    console.error(`[audio-author] unknown key(s): ${unknown.join(', ')}`);
    console.error(`[audio-author] known keys: ${SFX_KEYS.join(', ')}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const rows: ReportRow[] = [];
  let failed = false;

  for (const key of keys) {
    let samples: Float32Array;
    try {
      samples = renderPatch(SFX_PATCHES[key], SAMPLE_RATE);
    } catch (err) {
      console.error(`[audio-author] FAIL ${key}: ${(err as Error).message}`);
      failed = true;
      continue;
    }

    writeFileSync(resolve(OUT_DIR, `${key}.wav`), encodeWav(samples, SAMPLE_RATE));
    writeFileSync(resolve(OUT_DIR, `${key}.svg`), renderWaveformSvg(samples), 'utf8');

    const { peak, rms } = measure(samples);
    const durationMs = SFX_PATCHES[key].durationMs;
    const withinLimit = durationMs <= LIMIT_MS[key];
    if (!withinLimit) failed = true;
    rows.push({ key, durationMs, peak, rms, pitchHz: pitchOf(key), limitMs: LIMIT_MS[key], withinLimit });

    const kb = (samples.length * 2 + 44) / 1024;
    console.log(
      `${key.padEnd(12)} ${String(durationMs).padStart(5)} ms  peak ${peak.toFixed(3)}  ${kb.toFixed(1)} KB${
        withinLimit ? '' : '  OVER LIMIT'
      }`,
    );
  }

  writeFileSync(resolve(OUT_DIR, 'report.md'), renderAudioReport(rows), 'utf8');
  console.log(`\n[audio-author] music root ${MUSIC_ROOT_HZ} Hz · wrote ${rows.length} sound(s) to docs/testing/audio/`);
  if (failed) process.exit(1);
}

main();
```

- [ ] **Step 6: Add the npm script**

In `game-next/package.json`, after the `content:gallery` line in `"scripts"`:

```json
    "audio:author": "node --experimental-strip-types scripts/audio-author.ts",
```

- [ ] **Step 7: Run it**

Run (from `game-next/`): `npm run audio:author -- --all`
Expected: eight lines, none saying `OVER LIMIT`, exit 0, and `docs/testing/audio/` now holds 8 `.wav`, 8 `.svg` and `report.md`.

Run: `npm run audio:author -- nope`
Expected: `unknown key(s): nope`, exit 1.

- [ ] **Step 8: Listen**

Open `docs/testing/audio/bell.wav` in any player. It should be a clean bell with one pitch. This is a sanity check for the executor, not the reviewer's gate — that is stop point 1 after Task 7.

- [ ] **Step 9: CHANGELOG and commit**

```markdown
### 2026-10-05 - audio:author renders listening copies (GS task 6)

- Added `game-next/src/audio-synth/report.ts` (`renderWaveformSvg`, `renderAudioReport`) and `game-next/scripts/audio-author.ts`, plus the `audio:author` script in `game-next/package.json`. Running it writes `docs/testing/audio/<key>.wav`, `<key>.svg` and `report.md`, and exits non-zero if a patch is invalid or longer than the brief allows.
- The report shows the configured pitch read from each patch; nothing estimates pitch, because the patches set it.
- Verification: `tests/audioReport.test.ts` failed first, then passed (6 tests). `npm run audio:author -- --all` wrote 17 files with no key over its limit; `npm run audio:author -- nope` exited 1. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/report.ts game-next/scripts/audio-author.ts game-next/package.json game-next/tests/audioReport.test.ts docs/testing/audio CHANGELOG.md
git commit -m "feat(audio): render sound review artifacts from patches"
```

---

### Task 7: Audio Lab

**Files:**
- Create: `game-next/audiolab.html`
- Create: `game-next/src/devtools/audiolab/serialize.ts`, `game-next/src/devtools/audiolab/main.ts`
- Test: `game-next/tests/audiolabSerialize.test.ts`

**Interfaces:**
- Consumes: `Patch` (Task 2), `renderPatch` (Task 3), `SFX_KEYS`, `SFX_PATCHES`, `MUSIC_ROOT_HZ` (Task 5).
- Produces:
  - `patchToTypeScript(name: string, patch: Patch): string`
  - `PENTATONIC_STEPS: readonly number[]` and `ladderRates(): number[]`
  - the page at `/audiolab.html`

`vite.config.ts` already restricts `build.rollupOptions.input` to `index.html`, exactly as `studio.html` relies on, so this page needs no config change and ships nothing. Do not add it to the input map.

- [ ] **Step 1: Write the failing test**

`game-next/tests/audiolabSerialize.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { PENTATONIC_STEPS, ladderRates, patchToTypeScript } from '../src/devtools/audiolab/serialize.ts';
import { validatePatch } from '../src/audio-synth/patch.ts';
import type { Patch } from '../src/audio-synth/patch.ts';
import { SFX_PATCHES } from '../src/content/audio/index.ts';

describe('patchToTypeScript', () => {
  test('emits an exported const with the given name', () => {
    const out = patchToTypeScript('tick', SFX_PATCHES.tick);
    expect(out).toContain('export const tick: Patch = {');
    expect(out.trimEnd().endsWith('};')).toBe(true);
  });

  test('round-trips through JSON into an equal, still-valid patch', () => {
    for (const [name, patch] of Object.entries(SFX_PATCHES)) {
      const body = patchToTypeScript(name, patch);
      const json = body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1);
      const parsed = JSON.parse(json) as Patch;
      expect(parsed).toEqual(JSON.parse(JSON.stringify(patch)));
      expect(validatePatch(parsed, 44100)).toEqual([]);
    }
  });

  test('omits undefined optional fields rather than printing undefined', () => {
    expect(patchToTypeScript('tick', SFX_PATCHES.tick)).not.toContain('undefined');
  });
});

describe('ladderRates', () => {
  test('matches the G2 pentatonic steps', () => {
    expect(PENTATONIC_STEPS).toEqual([-5, -3, 0, 2, 4, 7, 9, 12]);
  });

  test('every step is a major-pentatonic degree of the root', () => {
    const degrees = new Set([0, 2, 4, 7, 9]);
    for (const step of PENTATONIC_STEPS) expect(degrees.has(((step % 12) + 12) % 12)).toBe(true);
  });

  test('rates rise and the last one is exactly an octave', () => {
    const rates = ladderRates();
    expect(rates).toHaveLength(8);
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    expect(rates[rates.length - 1]).toBeCloseTo(2, 10);
    expect(rates[2]).toBeCloseTo(1, 10);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audiolabSerialize.test.ts`
Expected: FAIL — cannot resolve `../src/devtools/audiolab/serialize.ts`.

- [ ] **Step 3: Implement `serialize.ts`**

`game-next/src/devtools/audiolab/serialize.ts`:

```ts
import type { Patch } from '../../audio-synth/patch.ts';

/** The eight steps G2 uses for snapped pieces. Index 7, the octave, is the winning snap. */
export const PENTATONIC_STEPS: readonly number[] = [-5, -3, 0, 2, 4, 7, 9, 12];

export function ladderRates(): number[] {
  return PENTATONIC_STEPS.map((semitones) => 2 ** (semitones / 12));
}

/**
 * Prints a patch as the body of a source file.
 *
 * JSON.stringify drops undefined optional fields, which is exactly what we
 * want: the output is the patch, with nothing to clean up by hand.
 */
export function patchToTypeScript(name: string, patch: Patch): string {
  return `export const ${name}: Patch = ${JSON.stringify(patch, null, 2)};\n`;
}
```

- [ ] **Step 4: Run the serialize tests**

Run: `npx vitest run tests/audiolabSerialize.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the page**

`game-next/audiolab.html`:

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Phòng âm thanh · Mirror Audio Lab</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        background: #070a14;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p.hint { color: #94a3b8; font-size: 13px; margin: 0 0 20px; }
      .cues { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
      button {
        background: #14213d; color: #e2e8f0; border: 1px solid #334155;
        border-radius: 8px; padding: 10px 14px; font-size: 14px; cursor: pointer;
      }
      button:hover { border-color: #7fd8ff; }
      button.active { border-color: #7fd8ff; background: #1e3a5f; }
      .panel { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
      .params { display: flex; flex-direction: column; gap: 10px; }
      .row { display: grid; grid-template-columns: 1fr 90px; gap: 8px; align-items: center; font-size: 12px; }
      .row input { width: 100%; }
      .row span { color: #94a3b8; font-family: ui-monospace, monospace; text-align: right; }
      #wave { width: 100%; background: #0b1020; border: 1px solid #1e293b; border-radius: 8px; }
      #stats { font-family: ui-monospace, monospace; font-size: 12px; color: #94a3b8; margin-top: 8px; }
      textarea {
        width: 100%; height: 220px; margin-top: 12px; background: #0b1020; color: #cbd5e1;
        border: 1px solid #1e293b; border-radius: 8px; padding: 10px;
        font-family: ui-monospace, monospace; font-size: 12px;
      }
    </style>
  </head>
  <body>
    <h1>Phòng âm thanh</h1>
    <p class="hint">
      Bấm một cue để nghe. Kéo slider để chỉnh, nghe lại ngay. Xong thì bấm
      <strong>Copy as TypeScript</strong> và dán vào <code>src/content/audio/sources/</code>.
    </p>
    <div class="cues" id="cues"></div>
    <div class="cues">
      <button id="ladder">▶ Thang ngũ cung (bell ×8)</button>
      <button id="copy">Copy as TypeScript</button>
      <button id="reset">Khôi phục gốc</button>
    </div>
    <div class="panel">
      <div class="params" id="params"></div>
      <div>
        <canvas id="wave" width="640" height="120"></canvas>
        <div id="stats"></div>
        <textarea id="out" readonly></textarea>
      </div>
    </div>
    <script type="module" src="/src/devtools/audiolab/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Implement the page logic**

`game-next/src/devtools/audiolab/main.ts`:

```ts
/**
 * Audio Lab — dev only.
 *
 * Plays the same patches, through the same renderer, that the game will use.
 * Not listed in vite.config.ts build input, so it never reaches production.
 */
import { measure } from '../../audio-synth/normalize.ts';
import type { Patch } from '../../audio-synth/patch.ts';
import { renderPatch } from '../../audio-synth/render.ts';
import { SFX_KEYS, SFX_PATCHES } from '../../content/audio/index.ts';
import type { SfxKey } from '../../content/audio/index.ts';
import { ladderRates, patchToTypeScript } from './serialize.ts';

const SR = 44100;
const ctx = new AudioContext();

const original = JSON.parse(JSON.stringify(SFX_PATCHES)) as Record<SfxKey, Patch>;
const working = JSON.parse(JSON.stringify(SFX_PATCHES)) as Record<SfxKey, Patch>;
let current: SfxKey = 'bell';

/** Every numeric leaf of the current patch, as a path the sliders can write back to. */
type Knob = { path: string; get(): number; set(v: number): void; min: number; max: number; step: number };

function rangeFor(path: string, value: number): { min: number; max: number; step: number } {
  if (path.endsWith('Ms')) return { min: 0, max: Math.max(2000, value * 2), step: 1 };
  if (path.endsWith('Hz')) return { min: 20, max: Math.max(12000, value * 2), step: 1 };
  if (path.endsWith('.q')) return { min: 0.1, max: 12, step: 0.1 };
  if (path.endsWith('.gain') || path.endsWith('.peak') || path.endsWith('.rms') || path.endsWith('.sustain')) {
    return { min: 0, max: 1, step: 0.01 };
  }
  if (path.endsWith('.ratio') || path.endsWith('.index')) return { min: 0, max: 16, step: 0.1 };
  return { min: 0, max: Math.max(1, value * 2), step: 0.01 };
}

function collectKnobs(node: Record<string, unknown>, prefix: string, out: Knob[]): void {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number') {
      if (key === 'seed') continue;
      const { min, max, step } = rangeFor(path, value);
      out.push({
        path,
        min,
        max,
        step,
        get: () => node[key] as number,
        set: (v) => {
          node[key] = v;
        },
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) =>
        collectKnobs(item as Record<string, unknown>, `${path}[${i}]`, out),
      );
    } else if (value && typeof value === 'object') {
      collectKnobs(value as Record<string, unknown>, path, out);
    }
  }
}

function play(patch: Patch, rate = 1): void {
  void ctx.resume();
  const samples = renderPatch(patch, SR);
  const buffer = ctx.createBuffer(1, samples.length, SR);
  buffer.copyToChannel(samples, 0);
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.playbackRate.value = rate;
  node.connect(ctx.destination);
  node.start();
}

function draw(patch: Patch): void {
  const canvas = document.getElementById('wave') as HTMLCanvasElement;
  const g = canvas.getContext('2d');
  if (!g) return;
  const samples = renderPatch(patch, SR);
  const { width, height } = canvas;
  const mid = height / 2;
  g.fillStyle = '#0b1020';
  g.fillRect(0, 0, width, height);
  g.strokeStyle = '#1e293b';
  g.beginPath();
  g.moveTo(0, mid);
  g.lineTo(width, mid);
  g.stroke();
  g.strokeStyle = '#7fd8ff';
  g.beginPath();
  const perColumn = Math.max(1, Math.floor(samples.length / width));
  for (let x = 0; x < width; x++) {
    const from = x * perColumn;
    if (from >= samples.length) break;
    let lo = samples[from];
    let hi = samples[from];
    for (let i = from; i < Math.min(samples.length, from + perColumn); i++) {
      if (samples[i] < lo) lo = samples[i];
      if (samples[i] > hi) hi = samples[i];
    }
    g.moveTo(x, mid - hi * mid);
    g.lineTo(x, mid - lo * mid);
  }
  g.stroke();

  const { peak, rms } = measure(samples);
  const started = performance.now();
  renderPatch(patch, SR);
  const renderMs = performance.now() - started;
  const stats = document.getElementById('stats');
  if (stats) {
    stats.textContent = `${patch.durationMs} ms · peak ${peak.toFixed(3)} · rms ${rms.toFixed(3)} · render ${renderMs.toFixed(1)} ms`;
  }
  const out = document.getElementById('out') as HTMLTextAreaElement | null;
  if (out) out.value = patchToTypeScript(current.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), patch);
}

function buildParams(): void {
  const host = document.getElementById('params');
  if (!host) return;
  host.innerHTML = '';
  const knobs: Knob[] = [];
  collectKnobs(working[current] as unknown as Record<string, unknown>, '', knobs);
  for (const knob of knobs) {
    const row = document.createElement('div');
    row.className = 'row';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(knob.min);
    input.max = String(knob.max);
    input.step = String(knob.step);
    input.value = String(knob.get());
    const readout = document.createElement('span');
    readout.textContent = `${knob.path.split('.').slice(-1)[0]} ${knob.get()}`;
    input.addEventListener('input', () => {
      knob.set(Number(input.value));
      readout.textContent = `${knob.path.split('.').slice(-1)[0]} ${input.value}`;
      draw(working[current]);
    });
    input.addEventListener('change', () => play(working[current]));
    row.append(input, readout);
    host.append(row);
  }
}

function select(key: SfxKey): void {
  current = key;
  for (const el of document.querySelectorAll('#cues button')) {
    el.classList.toggle('active', el.getAttribute('data-key') === key);
  }
  buildParams();
  draw(working[key]);
  play(working[key]);
}

function boot(): void {
  const cues = document.getElementById('cues');
  if (cues) {
    for (const key of SFX_KEYS) {
      const button = document.createElement('button');
      button.textContent = key;
      button.setAttribute('data-key', key);
      button.addEventListener('click', () => select(key));
      cues.append(button);
    }
  }

  document.getElementById('ladder')?.addEventListener('click', () => {
    ladderRates().forEach((rate, i) => {
      window.setTimeout(() => play(working.bell, rate), i * 260);
    });
  });

  document.getElementById('copy')?.addEventListener('click', () => {
    const out = document.getElementById('out') as HTMLTextAreaElement | null;
    if (out) void navigator.clipboard.writeText(out.value);
  });

  document.getElementById('reset')?.addEventListener('click', () => {
    working[current] = JSON.parse(JSON.stringify(original[current])) as Patch;
    select(current);
  });

  select('bell');
}

boot();
```

- [ ] **Step 7: Check it in the browser**

Run: `npm run dev`, then open `http://localhost:5173/audiolab.html`.

Confirm: all eight buttons play; moving a slider redraws the waveform and replays on release; **Thang ngũ cung** plays eight rising bells ending an octave above the first; **Copy as TypeScript** puts a patch body on the clipboard; **Khôi phục gốc** restores the shipped values.

- [ ] **Step 8: Confirm it ships nothing**

Run: `npm run build`
Then run: `ls dist/` and `grep -rl "audiolab" dist/ || echo "not in dist"`
Expected: `not in dist`, and no `audiolab.html` in `dist/`.

- [ ] **Step 9: CHANGELOG and commit**

```markdown
### 2026-10-05 - Audio Lab for tuning sound effects (GS task 7)

- Added `game-next/audiolab.html` and `game-next/src/devtools/audiolab/` (`serialize.ts`, `main.ts`): a dev-only page that plays every patch through the same renderer the game uses, generates a slider per numeric field, draws the waveform with peak/rms/render-time, plays the G2 pentatonic ladder on the bell, and copies the tuned patch out as TypeScript.
- The page is not listed in `vite.config.ts` build input, following `studio.html`, so production ships none of it.
- Verification: `tests/audiolabSerialize.test.ts` failed first, then passed (6 tests), including a JSON round trip proving a copied patch is still valid. Browser check of all eight cues, the ladder, copy and reset. `npm run build` then `grep -rl audiolab dist/` found nothing. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/audiolab.html game-next/src/devtools/audiolab game-next/tests/audiolabSerialize.test.ts CHANGELOG.md
git commit -m "feat(audio): add the Audio Lab tuning page"
```

- [ ] **Step 10: STOP (index stop point 1)**

Tell the reviewer:

1. Run `npm run dev` and open `http://localhost:5173/audiolab.html`.
2. Play all eight cues, then **Thang ngũ cung** — the eight rising bells are what a run of snapped pieces will sound like in a level.
3. Tune anything that is wrong, press **Copy as TypeScript**, and send back the patch body plus which key it is for.
4. Listening copies of the current state are in `docs/testing/audio/*.wav` with a summary in `report.md`.

Do not start Task 8 until the reviewer says the eight sounds are good enough to wire in. Apply their patches, re-run `npm run audio:author -- --all` and `npm test`, and commit that as a separate "tune" commit.

---

### Task 8: Engine README and presets

**Files:**
- Create: `game-next/src/audio-synth/README.md`
- Create: `game-next/src/audio-synth/presets.ts`
- Test: `game-next/tests/audioSynthPortable.test.ts`

**Interfaces:**
- Produces: `clickPreset`, `bellPreset`, `whooshPreset` — three generic `Patch` values that travel with the engine.

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioSynthPortable.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { validatePatch } from '../src/audio-synth/patch.ts';
import { renderPatch } from '../src/audio-synth/render.ts';
import { bellPreset, clickPreset, whooshPreset } from '../src/audio-synth/presets.ts';

const dir = fileURLToPath(new URL('../src/audio-synth/', import.meta.url));

describe('the engine folder stays portable', () => {
  test('no file imports anything outside src/audio-synth/', () => {
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const text = readFileSync(dir + file, 'utf8');
      for (const match of text.matchAll(/from\s+'([^']+)'/g)) {
        const target = match[1];
        const local = target.startsWith('./') && !target.startsWith('../');
        if (!local) offenders.push(`${file} -> ${target}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test('the README documents each of the five concepts and how to port it', () => {
    const readme = readFileSync(dir + 'README.md', 'utf8');
    for (const heading of ['Source', 'Envelope', 'Filter', 'Layer', 'normalize']) {
      expect(readme, heading).toContain(heading);
    }
    expect(readme).toContain('Porting it to another project');
    expect(readme).toContain('renderPatch');
  });
});

describe('presets', () => {
  test('each preset is valid and renders', () => {
    for (const [name, patch] of Object.entries({ clickPreset, bellPreset, whooshPreset })) {
      expect(validatePatch(patch, 44100), name).toEqual([]);
      expect(renderPatch(patch, 44100).length, name).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioSynthPortable.test.ts`
Expected: FAIL — cannot resolve `../src/audio-synth/presets.ts`.

- [ ] **Step 3: Write `presets.ts`**

`game-next/src/audio-synth/presets.ts`:

```ts
/**
 * Three starting points, so a new project does not begin from an empty file.
 * Copy one, change the numbers, listen. Mirror's own eight patches in
 * src/content/audio/sources/ are fuller worked examples.
 */
import type { Patch } from './patch.ts';

/** A short, dry UI click. Raise the highpass for something thinner. */
export const clickPreset: Patch = {
  durationMs: 100,
  seed: 1,
  layers: [
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'highpass', hz: 4000, q: 0.8 },
      env: { attackMs: 1, decayMs: 50, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.5 },
};

/** A struck bell. The non-integer ratio is what makes it metal and not an organ. */
export const bellPreset: Patch = {
  durationMs: 1200,
  seed: 2,
  layers: [
    {
      source: {
        kind: 'fm',
        carrierHz: 440,
        ratio: 3.5,
        index: 6,
        indexEnv: { attackMs: 0, decayMs: 150, curve: 'exp' },
      },
      env: { attackMs: 2, decayMs: 1198, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.9 },
};

/** Air moving past. Sweep the bandpass the other way for a rising whoosh. */
export const whooshPreset: Patch = {
  durationMs: 600,
  seed: 3,
  layers: [
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'bandpass', hz: 3000, q: 1.2, sweepToHz: 600 },
      env: { attackMs: 80, decayMs: 500, curve: 'lin' },
    },
  ],
  normalize: { peak: 0.5 },
};
```

- [ ] **Step 4: Write the README**

`game-next/src/audio-synth/README.md`:

````markdown
# audio-synth

A tiny, dependency-free sound-effect synthesizer. You describe a sound as data; it gives you samples.

It imports nothing — not a framework, not Node, not the game around it. Copy the folder into another project and it works.

## Hello, bell

```ts
import { renderPatch } from './audio-synth/render.ts';
import type { Patch } from './audio-synth/patch.ts';

const bell: Patch = {
  durationMs: 1200,
  seed: 1,
  layers: [
    {
      source: { kind: 'fm', carrierHz: 440, ratio: 3.5, index: 6,
                indexEnv: { attackMs: 0, decayMs: 150, curve: 'exp' } },
      env: { attackMs: 2, decayMs: 1198, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.9 },
};

const samples = renderPatch(bell, 44100); // Float32Array, mono
```

To hear it in a browser:

```ts
const buffer = ctx.createBuffer(1, samples.length, 44100);
buffer.copyToChannel(samples, 0);
const node = ctx.createBufferSource();
node.buffer = buffer;
node.connect(ctx.destination);
node.start();
```

## The five concepts

A **Patch** is a duration, a seed, a list of layers, and a loudness target. Layers are summed.

### Source — where the signal comes from

| Kind | Fields | Use for |
|---|---|---|
| `sine`, `triangle`, `saw`, `square` | `hz`, optional `glideToHz` | tones, thuds, pitched hits |
| `noise` | `color: 'white' \| 'pink'` | ticks, air, impacts |
| `fm` | `carrierHz`, `ratio`, `index`, optional `indexEnv` | bells, chimes, struck metal |

`glideToHz` slides the pitch linearly across the layer. Use it for a falling thud.

### Envelope — how the level moves

`{ attackMs, decayMs, sustain?, releaseMs?, curve? }`

Rises 0 to 1 over `attackMs`, falls to `sustain` (default 0) over `decayMs`, holds, then falls to 0 over `releaseMs`. With no sustain and no release this is the plain attack-decay shape almost every effect wants.

`curve: 'exp'` bends the fall so it drops fast then lingers. That is how struck and plucked things actually decay, and it almost always sounds better than `'lin'` for a hit. Keep `'lin'` for swells.

### Filter — how it is coloured

`{ kind: 'lowpass' | 'highpass' | 'bandpass', hz, q?, sweepToHz? }`

`q` defaults to 0.707, which is flat. Raise it for a resonant, vocal quality. `sweepToHz` moves the cutoff across the layer — a bandpass swept downward is a whoosh, swept upward is a riser.

### Layer — one voice

`{ source, env, filter?, gain?, startMs? }`

Processing order is **source → filter → envelope → gain**. Filtering before the envelope matters: it guarantees the tail still reaches zero, so the sound cannot click.

`startMs` delays a layer. That is how one patch holds a chord or an arpeggio — see `stingerWin.ts` for four bell voices entering in turn.

### normalize — how loud the result is

`{ peak: 0.9 }` scales the loudest sample onto 0.9. `{ rms: 0.12 }` matches average energy instead, which is the right choice for sustained, noisy sounds whose peak is not representative — and it is limited to 0.99 so it cannot clip.

Set loudness here, never by hand-tuning every `gain`. Use `gain` only for the balance *between* layers.

## Why seeds

Noise is drawn from a seeded PRNG, never `Math.random`. The same patch therefore renders the same bytes every time, which means the version someone approved by ear is exactly the version that ships, and tests can assert on real output. Each layer draws from its own stream, so adding a layer leaves the earlier ones untouched.

## Adding a sound

1. Copy the closest preset from `presets.ts` into a new file.
2. Change the numbers. Start with duration and the source, get that right, then shape with the envelope, then colour with the filter.
3. Register it wherever your project lists its sounds.
4. Listen, adjust, repeat. In Mirror that loop is the Audio Lab at `/audiolab.html`.

A rule of thumb for each sound family:

| Want | Start from | Then |
|---|---|---|
| click, tick | `clickPreset` | raise the highpass to thin it, shorten `decayMs` to sharpen it |
| bell, chime | `bellPreset` | `carrierHz` sets the pitch; `ratio` sets how metallic (try 1.4, 2.7, 3.5); `index` sets how bright the strike is |
| whoosh, swish | `whooshPreset` | sweep the bandpass further for more movement, raise `q` to narrow it |
| thud, impact | a `sine` with `glideToHz` below it | add a short lowpassed noise layer at `gain: 0.3`–`0.5` for the contact |
| drone, pad | several detuned `sine` layers, long `attackMs` | detune by a few hertz with `glideToHz` so they beat |

## Porting it to another project

1. Copy `src/audio-synth/` in. There are no dependencies to install and no build step.
2. Write your patches somewhere outside this folder, importing `Patch` from `patch.ts`. Keep the folder clean so the next copy is just as easy.
3. Call `renderPatch(patch, ctx.sampleRate)` and push the result into an `AudioBuffer`, as in *Hello, bell* above. Render once at start-up and cache; rendering a short sound costs a few milliseconds.

A test in this repo (`tests/audioSynthPortable.test.ts`) fails if any file here starts importing from outside the folder. Keep it.

## What is in each file

| File | What it holds |
|---|---|
| `dsp.ts` | the primitives: PRNG, noise, envelope, oscillators, FM, biquad filters |
| `patch.ts` | the `Patch` types and `validatePatch` |
| `render.ts` | `renderPatch` — the only function most callers need |
| `normalize.ts` | `measure` and `applyNormalize` |
| `wav.ts` | `encodeWav` / `decodeWavSamples`, for writing listening copies |
| `report.ts` | waveform SVG and a markdown summary, for review artifacts |
| `presets.ts` | three starting points |

## What it deliberately does not do

No stereo, no reverb, no delay, no sample playback, no music sequencing. Effects are mono and short; anything longer or wider belongs in an audio file. If you need reverb, render a tail into the patch with a long decay, or use the platform's own convolver on the output node.
````

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/audioSynthPortable.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Phase check**

Run (from `game-next/`): `npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: all PASS. The suite should now be 68 + 7 = 75 files.

Run (repo root): `git diff --check && git status`
Expected: clean.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-05 - Audio engine README and presets (GS task 8)

- Added `game-next/src/audio-synth/README.md`, the onboarding document that travels with the folder: a runnable "hello bell", the five concepts with the reasoning behind each (why exponential decay, why filter before envelope, why seeds), a per-family tuning table, a three-step porting guide, and an explicit list of what the engine does not do.
- Added `game-next/src/audio-synth/presets.ts` with `clickPreset`, `bellPreset` and `whooshPreset` so a new project starts from something that already makes a sound.
- Verification: `tests/audioSynthPortable.test.ts` failed first, then passed (3 tests). It enforces portability by failing if any file in `src/audio-synth/` imports from outside the folder, and checks the README covers all five concepts and the porting section. Full phase check — `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run build` — passed. GitNexus `detect_changes` on the staged set.
```

```bash
git add game-next/src/audio-synth/README.md game-next/src/audio-synth/presets.ts game-next/tests/audioSynthPortable.test.ts CHANGELOG.md
git commit -m "docs(audio): document the synth engine and add presets"
```

GS1 is done. Report to the controller: the engine exists, the eight sounds render, the Lab runs, and the README is in place. GS2 (`2026-10-05-gs2-wiring.md`) wires it into the game and needs the reviewer's music first (index stop point 2).

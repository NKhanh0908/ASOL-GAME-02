# Audio Synthesis Engine — Design

Status: draft, awaiting reviewer approval
Date: 2026-10-05
Supersedes: the asset-sourcing half of `docs/superpowers/specs/2026-10-03-g-audio-design.md` (§3.2 sample library, §4.1 selection) and plan `2026-10-03-g0-audio-assets.md`

## 1. Why

The G audio plan chain sources all ten sounds from CC0 libraries. Review of that chain found its weak points sit entirely in acquisition, not in code:

- the agent cannot hear, so picking depends on a reviewer listening to about 25 candidates and downloading ten originals by hand;
- Freesound needs a login and Pixabay blocks scripted access, so metadata collection is unreliable;
- the bell's pitch must be measured by FFT and shifted with `asetrate`, a whole subsystem that exists only because the pitch of a borrowed file is unknown;
- `loudnorm` runs single-pass, so the stated −18 LUFS target is unverified by any test;
- ten sounds recorded in ten different rooms do not cohere, and the sound brief ("ancient astronomical stone stele seen through glass") is a brief about coherence.

Every sound in the brief — bell, tick, tap-soft, thud, hollow, shimmer, swish, stinger-win — is elementary synthesis. Generating them removes all five problems at once and yields an asset the project keeps: a small, documented engine.

Music is excluded. The reviewer sources the two ambient tracks themselves. Drone pads are the one category where synthesis risks sounding sterile, and sourcing them carries none of the pitch or coherence problems that affect the effects.

## 2. Goals

1. All eight Mirror sound effects are synthesized from declarative patches in TypeScript, with no audio files shipped for them.
2. The engine is self-contained: a future project copies one folder and its README, and is productive without reading Mirror.
3. A reviewer can hear a change within seconds, in a browser, and copy the tuned result straight into a patch file.
4. Determinism: the same patch renders the same bytes, so what the reviewer approves is what ships, and the renderer is unit-testable.
5. The sound brief's length limits become executable tests rather than prose.

## 3. Non-goals

- Music synthesis, playback, or encoding. `MusicPort` (G1 Task 7) is unchanged and plays reviewer-supplied files.
- Replacing `SfxPort`, the cue table, or any G2 logic.
- Publishing the engine to npm, or extracting it into a workspace package.
- Runtime parameter variation. Cue logic stays deterministic, per the G2 constraint; `SfxPort.repeatGapMs` already prevents machine-gun repetition.

## 4. Architecture

Three layers; inner layers know nothing of outer ones.

```
src/audio-synth/            ENGINE — pure, zero dependencies, no Mirror imports
  dsp.ts                      oscillators, noise, envelopes, filters; sample level
  render.ts                   renderPatch(patch, sampleRate) -> Float32Array (mono)
  patch.ts                    Patch types and validatePatch
  normalize.ts                peak/RMS measurement and scaling
  wav.ts                      Float32Array -> WAV bytes
  webaudio.ts                 Float32Array -> AudioBuffer; renderAll(patches, ctx)
  presets/                    annotated starter patches
  README.md                   onboarding document; travels with the folder

src/content/audio/          MIRROR CONTENT — mirrors src/content/sources/ for levels
  sources/<key>.ts            the eight patches
  index.ts                    SFX_PATCHES registry

src/infrastructure/
  synthSfxDriver.ts           implements G1's SfxDriver over WebAudio + engine

src/devtools/audiolab/      AUDIO LAB — dev only, excluded from the production build
audiolab.html               Vite entry, not listed in build.rollupOptions.input

scripts/audio-author.ts     npm run audio:author [-- <key>... | --all]
```

The engine layer imports nothing — not Phaser, not Mirror, not Node. `wav.ts` returns bytes; the caller writes them. This is what makes the folder portable.

The layout deliberately copies the existing level pipeline (`src/content/sources/<id>.ts` -> `authoring.ts` -> validator -> committed artifact + SVG preview + report). A developer who understands `content:author` understands `audio:author` without learning a new concept.

## 5. Patch model

Five concepts: source, envelope, filter, layer, normalize.

```ts
type Patch = {
  durationMs: number;
  seed: number;
  layers: Layer[];
  normalize: { peak: number } | { rms: number };
};

type Layer = {
  startMs?: number;
  source: Source;
  env: Envelope;
  filter?: Filter;
  gain?: number;
};

type Source =
  | { kind: 'sine' | 'triangle' | 'saw' | 'square'; hz: number; glideToHz?: number }
  | { kind: 'noise'; color: 'white' | 'pink' }
  | { kind: 'fm'; carrierHz: number; ratio: number; index: number; indexEnv?: Envelope };

type Envelope = {
  attackMs: number;
  decayMs: number;
  sustain?: number;
  releaseMs?: number;
  curve?: 'lin' | 'exp';
};

type Filter = {
  kind: 'lowpass' | 'highpass' | 'bandpass';
  hz: number;
  q?: number;
  sweepToHz?: number;
};
```

Layers are summed. `startMs` lets one patch hold a chord or an arpeggio, which is how the stinger is built. Output is mono.

`validatePatch` rejects: non-positive `durationMs`, empty `layers`, a layer whose `startMs` exceeds `durationMs`, a filter cutoff above Nyquist, and a non-finite number anywhere.

## 6. Rendering and determinism

`renderPatch(patch, sampleRate)` returns a `Float32Array` of exactly `round(durationMs * sampleRate / 1000)` samples.

Noise uses a seeded PRNG (`mulberry32`) initialised from `patch.seed`, never `Math.random`. Each noise layer derives its stream from `seed` plus the layer index, so adding a layer does not change the layers before it.

Consequence: an identical patch and sample rate produce byte-identical output. The WAV the reviewer approves is sample-for-sample what the browser synthesizes at runtime, and tests can assert on real output rather than on shape alone.

## 7. Loudness

`normalize` runs after all layers are summed:

- `{ peak: p }` scales so `max(abs(sample))` equals `p`.
- `{ rms: r }` scales so the root-mean-square equals `r`, then hard-limits to 0.99 if that pushes the peak over.

This replaces the plan's `loudnorm` filter. It is deterministic, measurable in a unit test, and needs no external binary. Per-key targets live in the patch files and are asserted in `audioPatches.test.ts`.

## 8. Runtime integration

One new file touches Mirror:

```ts
// src/infrastructure/synthSfxDriver.ts
synthSfxDriver(ctx: AudioContext, patches: Record<SfxKey, Patch>): SfxDriver
```

It implements G1 Task 8's `SfxDriver` interface verbatim:

- `isLocked()` — `ctx.state !== 'running'`
- `has(key)` — the key has a rendered buffer
- `play(key, { rate, volume })` — an `AudioBufferSourceNode` with `playbackRate = rate` through a `GainNode`; returns `buffer.duration * 1000 / rate` in ms

`SfxPort`, `AudioCue`, `SfxEnv`, `SfxOptions` and `createSfx` are unchanged, and so are their tests, which drive a fake driver. The pentatonic pitching in G2 keeps using `playbackRate`; the cue table is untouched.

Buffers are rendered in the `game.events 'ready'` handler, where the plan already creates audio services. Estimated cost is about 50 ms for all eight. The dev build logs the measured time; the acceptance threshold is under 100 ms on a mid-range Android device. If it exceeds that, the fallback is lazy per-key rendering on first play, cached — no redesign needed.

## 9. The music key

The bell no longer needs measuring. The reviewer states the key of the music they sourced, and `sources/bell.ts` sets `carrierHz` to that root. The bell is born in tune. `MUSIC_ROOT_SEMITONE` changes from a measured value in the manifest to an input constant next to the patch, and the index's departures 1 and 2 cease to apply.

## 10. The eight patches

| Key | Construction | Limit |
|---|---|---|
| `bell` | one `fm` layer, ratio 3.5 (inharmonic), `indexEnv` decaying fast, exponential amplitude decay | 1.5 s |
| `tick` | white `noise`, highpass, 20 ms decay | 150 ms |
| `tap-soft` | `sine` 180 Hz, lowpass, 60 ms decay | 300 ms |
| `thud` | `sine` glide 120 -> 60 Hz plus a `noise` layer, lowpass | 400 ms |
| `hollow` | pink `noise`, bandpass, 300 ms attack | 1 s |
| `shimmer` | three detuned high layers, long decay | 1 s |
| `swish` | white `noise`, bandpass `sweepToHz` 4000 -> 800 | 600 ms |
| `stinger-win` | four `fm` layers offset by `startMs`, pentatonic, resolving to the root | 3-5 s |

## 11. Audio Lab

A dev-only page at `audiolab.html`, with code in `src/devtools/audiolab/`. It is not listed in `build.rollupOptions.input`, so production ships zero bytes of it. It imports the engine and the patch sources directly, so it plays exactly what the game plays.

In scope:

- a grid of the eight cues, click to play;
- a parameter panel generated from the patch schema, re-rendering on change;
- a waveform canvas with duration, peak and RMS;
- **Copy as TypeScript**, producing the body of `src/content/audio/sources/<key>.ts`;
- **Pentatonic ladder**, playing `bell` through G2's eight steps `[-5, -3, 0, 2, 4, 7, 9, 12]` in order.

The ladder matters most: the likeliest failure is not a bad bell but a sequence of bells that does not read as a melody, and this answers that question without waiting for G2.

Out of scope: spectrum display, A/B comparison, in-browser recording, music editing.

## 12. Build-time tooling

`npm run audio:author [-- <key>... | --all]` renders review artifacts into `docs/testing/audio/`:

- `<key>.wav` — to listen to and archive;
- `<key>.svg` — waveform preview;
- `report.md` — per key: duration, peak, RMS, the configured pitch for tonal patches (read from the patch, not estimated — the engine measures no pitch), and the brief's limit with pass or fail.

Nothing it writes is shipped. It exits non-zero if any patch fails validation or exceeds its length limit.

## 13. Testing

| File | Asserts |
|---|---|
| `tests/dsp.test.ts` | envelopes reach zero on time; exponential curves are monotonic; a lowpass measurably attenuates band energy above its cutoff when fed white noise; the PRNG is reproducible |
| `tests/audioRender.test.ts` | exact sample count; no NaN or Infinity; `abs(sample) <= 1` after normalize; identical bytes across two renders; a layer with `startMs` is silent before it |
| `tests/audioPatches.test.ts` | every `SfxKey` has a valid patch; each patch is within the brief's length limit; normalize targets hold |
| `tests/synthSfxDriver.test.ts` | `has`, `isLocked`, and the duration `play` returns, against a fake `AudioContext` |
| `tests/wav.test.ts` | header fields; round-trip preserves samples |

The sound brief's length table becomes `audioPatches.test.ts`: a promise in a document becomes a check in CI.

## 14. Error handling

- `AudioContext` suspended by autoplay policy: `isLocked()` is true and `SfxPort`'s existing warn-once-then-skip path handles it. Unchanged.
- No `AudioContext` at all: the driver is `null`, and `createSfx` already accepts `SfxDriver | null`.
- A render throws: caught, and services fall back to `SILENT_AUDIO`.
- Audio never blocks input and never stops a scene. Unchanged from the G spec.

## 15. Effect on the G plan chain

| Task | Change |
|---|---|
| G0 (1-2) | Replaced: build the engine, the eight patches and the Lab instead of researching CC0 libraries |
| 3 manifest | Shrinks to the two music assets plus the key and id types; effects move to `SFX_PATCHES` |
| 4 ffmpeg tool | Deleted — `ffmpegArgs`, `loopFilter`, `parseDurationSec`, `estimatePitchHz`, `centsToRoot` and `--probe` all go |
| 5 processed files | Deleted; replaced by authoring patches and the review listen |
| 6 settings | Unchanged |
| 7 `MusicPort`, tokens | Unchanged |
| 8 `SfxPort` | `phaserSfxDriver` becomes `synthSfxDriver`; the port and its tests are unchanged |
| 9 wiring | `BackgroundScene` no longer preloads effects; the rest is unchanged |
| 10-12 (G2) | Unchanged |

Index departures 1, 2 and 4 are void. Departure 3 becomes a note for the reviewer when sourcing music, not a blocker.

`ffmpeg-static` is not added. The repository keeps its four runtime and five dev dependencies.

## 16. Sequencing

The engine, the patches, the Lab, the author script and the README depend on neither F1 nor F2: they touch no scene, no director, and no feedback code. They can be built now, on `feat/audio-synth` from `main`, in parallel with F1 Phase 3 and F2.

Only Tasks 6-12, which wire audio into the game, must wait for F2 to merge.

Under the previous chain only asset research could run in parallel, and that step was gated on reviewer availability. Now the heaviest work parallelises and the serial remainder is smaller.

## 17. Inputs required from the reviewer

1. Two ambient tracks, sourced and licence-checked (CC0 or Pixabay), placed in `game-next/public/audio/`.
2. Their key, stated once, so `sources/bell.ts` can set `carrierHz`. "Drone, no clear key" is an acceptable answer; the bell then defines the key.
3. Encoding is manual: `.ogg` covers Chrome and the Android WebView, and `.m4a` is only needed if iOS or Safari becomes a target.

## 18. Risks

| Risk | Mitigation |
|---|---|
| Synthesized effects sound thin or clinical | The Lab makes iteration cost seconds, and the pentatonic ladder tests the sequence, not just single hits. If one key cannot be made to sound right, that key alone falls back to a sourced CC0 file; the manifest still supports file-backed assets for music |
| Boot render exceeds the time budget | Measured and logged in dev, with a documented fallback to lazy per-key rendering |
| "Where are the sound files?" surprises a new developer | The README is a deliverable, not an afterthought, and `audio:author` leaves listenable WAVs plus a report in `docs/testing/audio/` |
| Rework of the already-written G1 plan | Confined to Tasks 3-5, 8 and 9; G2 and Tasks 6-7 are untouched |

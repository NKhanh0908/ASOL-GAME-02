# G1 Audio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship processed audio files plus the two playback ports, the two settings, and scene music that crossfades on every F1 route.

**Architecture:** A typed manifest (`audioManifest.ts`) is the single source for every audio file. A Node script with `ffmpeg-static` turns gitignored originals into `public/audio/*.ogg|m4a`. Runtime has two pure, injectable ports: `MusicPort` streams two `HTMLAudioElement`s with ramped crossfades; `SfxPort` plays short WebAudio sounds through a Phaser driver. `main.ts` creates both, puts them in `game.registry`, and `SceneDirector` asks for the scene's track on each route.

**Tech Stack:** TypeScript 5.7 (ESM, `.ts` import suffixes), Vitest 2, Phaser 3.90, Vite 6 (`public/` copied as-is), Node 24 (`--experimental-strip-types` for scripts), `ffmpeg-static` 5.3.0.

**Spec:** `docs/superpowers/specs/2026-10-03-g-audio-design.md`. Index (order, branches, stop points, departures): `docs/superpowers/plans/2026-10-03-g-audio-index.md`. G0 output: `docs/testing/audio/candidates.md` → `## Selected`.

## Global Constraints

- Work in `game-next/` on branch `feat/audio` (index → Branches). F1 and F2 are merged into it; their names (`director`, `SceneDirector`, `BackgroundScene`, `settings.reducedMotion`, `settings.haptics`, `TRANSITION_TOKENS`) exist.
- Licences allowed: `CC0-1.0`, `Pixabay`. Originals stay in gitignored `game-next/audio-src/`; only processed files under `game-next/public/audio/` are committed.
- Formats: every key ships `<key>.ogg` (Vorbis) and `<key>.m4a` (AAC 96 kbps). No MP3.
- Loudness: SFX/stinger mono, −18 LUFS, true peak ≤ −3 dB; music stereo, −23 LUFS, 96 kbps, 60–150 s, loop crossfade baked in (default 2000 ms).
- Budget: SFX + stinger ≤ 300 KB per format; each track ≤ 2 MB per format; all of `public/audio/` ≤ 9 MB.
- Settings: `settings.music` and `settings.sfx`, default `true`; legacy saves missing them read `true` without `recovered` and without a `version` bump.
- Audio never depends on `motionScale`. Audio errors never block input or stop a scene; each key/track warns at most once.
- Pure files (`audioManifest.ts`, `music.ts`, `sfx.ts`, `scripts/audio/*`) import nothing from `phaser` at runtime.
- Code comments, docs, CHANGELOG and commit messages in English; UI labels stay Vietnamese. Commit messages `type(scope): summary`. Every commit adds a `CHANGELOG.md` entry under `## Unreleased` (newest first) with a `Verification:` bullet.
- Before editing an existing symbol run GitNexus `impact` (index → GitNexus); before each commit run `detect_changes`.

## File map

| File | Responsibility |
|---|---|
| `src/infrastructure/audioManifest.ts` | Keys, licences, budget, music root, every asset's source and processing |
| `scripts/audio/ffmpegArgs.ts` | Pure: ffmpeg argument and filter-graph builder, duration parser |
| `scripts/audio/pitch.ts` | Pure: pitch estimate, cents to the music root |
| `scripts/process-audio.ts` | CLI: `npm run audio:process [keys…]`, `-- --probe <file…>` |
| `public/audio/*` | Processed files (committed) |
| `src/infrastructure/music.ts` | Pure `MusicPort` with injected media/clock |
| `src/infrastructure/sfx.ts` | Pure `SfxPort` with injected driver/clock; `AudioCue` type |
| `src/infrastructure/phaserSfx.ts` | `SfxDriver` over `game.sound` |
| `src/infrastructure/browserAudioEnv.ts` | Real `MusicEnv` / `SfxEnv` (DOM timers, `Audio`, gestures, visibility) |
| `src/presentation/designTokens.ts` | `AUDIO_TOKENS` |
| `src/presentation/audio/audioServices.ts` | Registry key, silent fallback, `audioServices(scene)` |
| `src/presentation/audio/tracks.ts` | `trackFor(scene)` |
| `src/presentation/transitions/SceneDirector.ts` | `setMusic`, track request in `go` / `boot` |
| `src/presentation/BackgroundScene.ts` | Preload SFX |
| `src/presentation/SettingsDialog.ts` | Two toggles, taller modal |
| `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts` | `music`, `sfx` settings |
| `src/main.ts` | Create ports, registry, lifecycle |

---

### Task 3: Audio manifest

**Files:**
- Create: `game-next/src/infrastructure/audioManifest.ts`
- Test: `game-next/tests/audioManifest.test.ts`

**Interfaces:**
- Consumes: `docs/testing/audio/candidates.md` → `## Selected` (G Task 2).
- Produces:
  - `type SfxKey = 'bell' | 'tick' | 'tap-soft' | 'thud' | 'hollow' | 'shimmer' | 'swish' | 'stinger-win'`
  - `type TrackId = 'music-sky' | 'music-stele'`, `type AudioKey = SfxKey | TrackId`
  - `type AudioLicense = 'CC0-1.0' | 'Pixabay'`, `type AudioKind = 'sfx' | 'stinger' | 'music'`
  - `type AudioProcess = { trimStartMs?: number; trimEndMs?: number; gainDb?: number; pitchCents?: number; loopCrossfadeMs?: number }`
  - `type AudioAsset = { key: AudioKey; kind: AudioKind; files: readonly string[]; source: { title: string; author: string; url: string; license: AudioLicense; srcFile: string }; process: AudioProcess }`
  - `SFX_KEYS: readonly SfxKey[]`, `TRACK_IDS: readonly TrackId[]`, `AUDIO_LICENSES`, `AUDIO_FORMATS = ['ogg', 'm4a']`, `AUDIO_BUDGET`, `MUSIC_ROOT_SEMITONE: number`, `AUDIO_ASSETS: readonly AudioAsset[]`
  - `assetUrls(key: AudioKey): string[]` → `['audio/<key>.ogg', 'audio/<key>.m4a']`

- [ ] **Step 1: Write the failing test**

`game-next/tests/audioManifest.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  AUDIO_ASSETS,
  AUDIO_LICENSES,
  MUSIC_ROOT_SEMITONE,
  SFX_KEYS,
  TRACK_IDS,
  assetUrls,
} from '../src/infrastructure/audioManifest.ts';
import type { AudioKey } from '../src/infrastructure/audioManifest.ts';

describe('audio manifest', () => {
  test('one asset per key, no extras', () => {
    const keys = AUDIO_ASSETS.map((a) => a.key).sort();
    expect(keys).toEqual([...SFX_KEYS, ...TRACK_IDS].sort());
  });

  test('kind is fixed per key', () => {
    for (const asset of AUDIO_ASSETS) {
      const expected = asset.key === 'stinger-win' ? 'stinger' : asset.key.startsWith('music-') ? 'music' : 'sfx';
      expect(asset.kind, asset.key).toBe(expected);
    }
  });

  test('every source is allowed, linked and named after its key', () => {
    for (const { key, source } of AUDIO_ASSETS) {
      expect(AUDIO_LICENSES, key).toContain(source.license);
      expect(source.url, key).toMatch(/^https:\/\//);
      expect(source.title.length, key).toBeGreaterThan(0);
      expect(source.author.length, key).toBeGreaterThan(0);
      expect(source.srcFile.startsWith(`${key}.`), key).toBe(true);
    }
  });

  test('each key ships ogg then m4a', () => {
    for (const asset of AUDIO_ASSETS) expect(asset.files).toEqual([`${asset.key}.ogg`, `${asset.key}.m4a`]);
  });

  test('music tracks loop with a crossfade', () => {
    for (const id of TRACK_IDS) {
      const asset = AUDIO_ASSETS.find((a) => a.key === id)!;
      expect(asset.process.loopCrossfadeMs).toBeGreaterThan(0);
    }
  });

  test('urls are relative to the page', () => {
    expect(assetUrls('bell')).toEqual(['audio/bell.ogg', 'audio/bell.m4a']);
    expect(assetUrls('nope' as AudioKey)).toEqual([]);
  });

  test('music root is a pitch class', () => {
    expect(Number.isInteger(MUSIC_ROOT_SEMITONE)).toBe(true);
    expect(MUSIC_ROOT_SEMITONE).toBeGreaterThanOrEqual(0);
    expect(MUSIC_ROOT_SEMITONE).toBeLessThanOrEqual(11);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioManifest.test.ts`
Expected: FAIL, cannot resolve `../src/infrastructure/audioManifest.ts`.

- [ ] **Step 3: Write the manifest**

`game-next/src/infrastructure/audioManifest.ts`. Copy `MUSIC_ROOT_SEMITONE` and every `source` from `docs/testing/audio/candidates.md` → `## Selected`; replace each `«…»` with the value from that table. `process` stays `{}` for SFX here (Task 5 fills `bell.pitchCents` after measuring).

```ts
/**
 * Every audio file the game ships (spec G §4.2). Originals live in the
 * gitignored `audio-src/`; `npm run audio:process` writes `public/audio/`.
 */

export type SfxKey = 'bell' | 'tick' | 'tap-soft' | 'thud' | 'hollow' | 'shimmer' | 'swish' | 'stinger-win';
export type TrackId = 'music-sky' | 'music-stele';
export type AudioKey = SfxKey | TrackId;
export type AudioLicense = 'CC0-1.0' | 'Pixabay';
export type AudioKind = 'sfx' | 'stinger' | 'music';

export type AudioProcess = {
  trimStartMs?: number;
  /** Cut this much from the end */
  trimEndMs?: number;
  gainDb?: number;
  /** Bell only: shift so that rate 1 is the music root */
  pitchCents?: number;
  /** Music only: tail-over-head crossfade baked into the loop point */
  loopCrossfadeMs?: number;
};

export type AudioAsset = {
  key: AudioKey;
  kind: AudioKind;
  /** Relative to public/audio/ */
  files: readonly string[];
  source: { title: string; author: string; url: string; license: AudioLicense; srcFile: string };
  process: AudioProcess;
};

export const SFX_KEYS: readonly SfxKey[] = ['bell', 'tick', 'tap-soft', 'thud', 'hollow', 'shimmer', 'swish', 'stinger-win'];
export const TRACK_IDS: readonly TrackId[] = ['music-sky', 'music-stele'];
export const AUDIO_LICENSES: readonly AudioLicense[] = ['CC0-1.0', 'Pixabay'];
export const AUDIO_FORMATS = ['ogg', 'm4a'] as const;

export const AUDIO_BUDGET = {
  sfxBytesPerFormat: 300 * 1024,
  trackBytesPerFormat: 2 * 1024 * 1024,
  totalBytes: 9 * 1024 * 1024,
} as const;

/** Tonic shared by both tracks, C = 0. Build-time only: `bell` is tuned to it. */
export const MUSIC_ROOT_SEMITONE = «semitone»;

const files = (key: AudioKey) => [`${key}.ogg`, `${key}.m4a`] as const;

export const AUDIO_ASSETS: readonly AudioAsset[] = [
  {
    key: 'bell',
    kind: 'sfx',
    files: files('bell'),
    source: { title: '«title»', author: '«author»', url: '«url»', license: '«CC0-1.0|Pixabay»', srcFile: '«bell.ext»' },
    process: {},
  },
  // Same shape, in this order, with kind as shown:
  // 'tick' sfx, 'tap-soft' sfx, 'thud' sfx, 'hollow' sfx, 'shimmer' sfx, 'swish' sfx,
  // 'stinger-win' stinger,
  // 'music-sky' music with process: { loopCrossfadeMs: 2000 },
  // 'music-stele' music with process: { loopCrossfadeMs: 2000 }.
];

export function assetUrls(key: AudioKey): string[] {
  const asset = AUDIO_ASSETS.find((a) => a.key === key);
  return asset ? asset.files.map((f) => `audio/${f}`) : [];
}
```

Write all ten entries out in full (no comment placeholder left in the array).

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/audioManifest.test.ts && npm run typecheck`
Expected: PASS (7 tests), no type errors.

- [ ] **Step 5: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add audio manifest (G task 3)

- Added `game-next/src/infrastructure/audioManifest.ts`: sound keys, allowed licences, size budget, music root and the source of every picked file from `docs/testing/audio/candidates.md`.
- Verification: `tests/audioManifest.test.ts` failed before the file existed, then passed (7 tests); `npm run typecheck` passed.
```

```bash
git add game-next/src/infrastructure/audioManifest.ts game-next/tests/audioManifest.test.ts CHANGELOG.md
git commit -m "feat(audio): add audio asset manifest"
```

---

### Task 4: Processing tool

**Files:**
- Modify: `game-next/package.json`, `game-next/package-lock.json`
- Create: `game-next/scripts/audio/ffmpegArgs.ts`, `game-next/scripts/audio/pitch.ts`, `game-next/scripts/process-audio.ts`
- Test: `game-next/tests/audioProcessing.test.ts`

**Interfaces:**
- Consumes: `AudioAsset`, `AUDIO_ASSETS`, `MUSIC_ROOT_SEMITONE` (Task 3).
- Produces:
  - `type AudioFormat = 'ogg' | 'm4a'`
  - `ffmpegArgs(asset: AudioAsset, input: string, output: string, format: AudioFormat, durationSec?: number): string[]`
  - `loopFilter(durationSec: number, crossfadeSec: number): string`
  - `parseDurationSec(ffmpegStderr: string): number`
  - `estimatePitchHz(samples: Float32Array, sampleRate: number, minHz?: number, maxHz?: number): number | null`
  - `centsToRoot(hz: number, rootSemitone: number): number`
  - `npm run audio:process [keys…]`, `npm run audio:process -- --probe <file…>`

- [ ] **Step 1: Add the dependency (index stop point 3)**

Run (from `game-next/`): `npm install ffmpeg-static@5.3.0 --save-dev --save-exact`
Expected: `"ffmpeg-static": "5.3.0"` under `devDependencies`.

Run: `node -e "const f=require('ffmpeg-static');const r=require('child_process').spawnSync(f,['-hide_banner','-encoders'],{encoding:'utf8'});console.log(/libvorbis/.test(r.stdout), /\baac\b/.test(r.stdout))"`
Expected: `true true`. If `libvorbis` is `false`, STOP and report; do not switch codecs on your own.

- [ ] **Step 2: Write the failing tests**

`game-next/tests/audioProcessing.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { ffmpegArgs, loopFilter, parseDurationSec } from '../scripts/audio/ffmpegArgs.ts';
import { centsToRoot, estimatePitchHz } from '../scripts/audio/pitch.ts';
import type { AudioAsset } from '../src/infrastructure/audioManifest.ts';

const source = { title: 't', author: 'a', url: 'https://x', license: 'CC0-1.0' as const, srcFile: 'k.wav' };
const sfx = (process: AudioAsset['process'] = {}): AudioAsset => ({ key: 'bell', kind: 'sfx', files: [], source, process });
const music: AudioAsset = { key: 'music-sky', kind: 'music', files: [], source, process: { loopCrossfadeMs: 2000 } };
const graphOf = (args: string[]) => args[args.indexOf('-filter_complex') + 1];

describe('ffmpegArgs', () => {
  test('sfx: mono, trimmed, -18 LUFS, Vorbis q4', () => {
    const args = ffmpegArgs(sfx(), 'in.wav', 'out/bell.ogg', 'ogg');
    const graph = graphOf(args);
    expect(args.slice(0, 6)).toEqual(['-y', '-hide_banner', '-loglevel', 'error', '-i', 'in.wav']);
    expect(graph.startsWith('[0:a]aresample=44100')).toBe(true);
    expect(graph).toContain('silenceremove=start_periods=1:start_threshold=-50dB');
    expect(graph).toContain('afade=t=in:d=0.010');
    expect(graph).toContain('loudnorm=I=-18:TP=-3:LRA=11');
    expect(graph.endsWith('aresample=44100[out]')).toBe(true);
    expect(args).toEqual(expect.arrayContaining(['-map', '[out]', '-ac', '1', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4']));
    expect(args.at(-1)).toBe('out/bell.ogg');
  });

  test('sfx m4a uses AAC 96k with faststart', () => {
    const args = ffmpegArgs(sfx(), 'in.wav', 'bell.m4a', 'm4a');
    expect(args).toEqual(expect.arrayContaining(['-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart']));
  });

  test('trim, gain and pitch become filters', () => {
    const graph = graphOf(ffmpegArgs(sfx({ trimStartMs: 120, trimEndMs: 300, gainDb: -2, pitchCents: 100 }), 'i', 'o.ogg', 'ogg'));
    expect(graph).toContain('atrim=start=0.120');
    expect(graph).toContain('areverse,atrim=start=0.300,asetpts=PTS-STARTPTS,areverse');
    expect(graph).toContain('volume=-2dB');
    expect(graph).toContain('asetrate=46722,aresample=44100'); // 44100 * 2^(100/1200)
  });

  test('music needs its duration', () => {
    expect(() => ffmpegArgs(music, 'i', 'o.ogg', 'ogg')).toThrow(/durationSec/);
  });

  test('music: stereo, baked loop, -23 LUFS, 96k', () => {
    const args = ffmpegArgs(music, 'i', 'music-sky.ogg', 'ogg', 90);
    const graph = graphOf(args);
    expect(graph).toContain('asplit=3[h][m][t]');
    expect(graph).toContain('[t]atrim=88.000:90.000');
    expect(graph).toContain('loudnorm=I=-23:TP=-2:LRA=11');
    expect(graph).not.toContain('silenceremove');
    expect(args).toEqual(expect.arrayContaining(['-ac', '2', '-c:a', 'libvorbis', '-b:a', '96k']));
  });

  test('music loop length accounts for trims', () => {
    const graph = graphOf(ffmpegArgs({ ...music, process: { loopCrossfadeMs: 2000, trimEndMs: 10000 } }, 'i', 'o.ogg', 'ogg', 90));
    expect(graph).toContain('[t]atrim=78.000:80.000');
  });
});

describe('loopFilter', () => {
  test('head fades in under the tail, then the middle follows', () => {
    expect(loopFilter(10, 2)).toBe(
      'asplit=3[h][m][t];' +
        '[h]atrim=0:2.000,asetpts=PTS-STARTPTS,afade=t=in:d=2.000[h2];' +
        '[t]atrim=8.000:10.000,asetpts=PTS-STARTPTS,afade=t=out:d=2.000[t2];' +
        '[h2][t2]amix=inputs=2:normalize=0[x];' +
        '[m]atrim=2.000:8.000,asetpts=PTS-STARTPTS[m2];' +
        '[x][m2]concat=n=2:v=0:a=1'
    );
  });

  test('refuses tracks shorter than three crossfades', () => {
    expect(() => loopFilter(5, 2)).toThrow(/too short/);
  });
});

describe('parseDurationSec', () => {
  test('reads the Duration line', () => {
    expect(parseDurationSec('Input #0, wav\n  Duration: 00:01:23.45, bitrate: 1411 kb/s')).toBeCloseTo(83.45, 5);
  });
  test('throws without one', () => {
    expect(() => parseDurationSec('nothing')).toThrow(/Duration/);
  });
});

function tone(freqs: Array<[number, number]>, sampleRate = 44100, seconds = 0.5): Float32Array {
  const out = new Float32Array(Math.round(sampleRate * seconds));
  for (let i = 0; i < out.length; i++) {
    for (const [f, amp] of freqs) out[i] += amp * Math.sin((2 * Math.PI * f * i) / sampleRate);
  }
  return out;
}

describe('estimatePitchHz', () => {
  test('pure tone', () => {
    expect(estimatePitchHz(tone([[440, 1]]), 44100)!).toBeCloseTo(440, -1);
  });
  test('harmonic tone reports the fundamental, not an overtone', () => {
    const hz = estimatePitchHz(tone([[220, 1], [440, 0.6], [660, 0.4]]), 44100)!;
    expect(Math.abs(hz - 220) / 220).toBeLessThan(0.01);
  });
  test('silence has no pitch', () => {
    expect(estimatePitchHz(new Float32Array(22050), 44100)).toBeNull();
  });
});

describe('centsToRoot', () => {
  test('already on the root', () => {
    expect(centsToRoot(440, 9)).toBe(0);
    expect(centsToRoot(523.25, 0)).toBe(0);
  });
  test('shortest way to the root pitch class', () => {
    expect(centsToRoot(440, 2)).toBe(500); // A up to D
    expect(centsToRoot(466.16, 9)).toBe(-100); // A# down to A
  });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/audioProcessing.test.ts`
Expected: FAIL, cannot resolve `../scripts/audio/ffmpegArgs.ts`.

- [ ] **Step 4: Write `scripts/audio/ffmpegArgs.ts`**

```ts
import type { AudioAsset } from '../../src/infrastructure/audioManifest.ts';

export type AudioFormat = 'ogg' | 'm4a';

const RATE = 44100;
const sec = (ms: number) => (ms / 1000).toFixed(3);
const f3 = (n: number) => n.toFixed(3);

export function parseDurationSec(ffmpegStderr: string): number {
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(ffmpegStderr);
  if (!m) throw new Error('no Duration in ffmpeg output');
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/**
 * Seamless loop: the first `x` seconds fade in under the last `x` seconds
 * fading out, then the middle follows. Playing the result on repeat joins
 * middle-end → tail and head-end → middle-start without a seam.
 */
export function loopFilter(durationSec: number, crossfadeSec: number): string {
  const x = crossfadeSec;
  const end = durationSec;
  if (end < 3 * x) throw new Error(`track too short (${end}s) for a ${x}s loop crossfade`);
  return [
    'asplit=3[h][m][t]',
    `[h]atrim=0:${f3(x)},asetpts=PTS-STARTPTS,afade=t=in:d=${f3(x)}[h2]`,
    `[t]atrim=${f3(end - x)}:${f3(end)},asetpts=PTS-STARTPTS,afade=t=out:d=${f3(x)}[t2]`,
    '[h2][t2]amix=inputs=2:normalize=0[x]',
    `[m]atrim=${f3(x)}:${f3(end - x)},asetpts=PTS-STARTPTS[m2]`,
    '[x][m2]concat=n=2:v=0:a=1',
  ].join(';');
}

export function ffmpegArgs(
  asset: AudioAsset,
  input: string,
  output: string,
  format: AudioFormat,
  durationSec?: number
): string[] {
  const p = asset.process;
  const music = asset.kind === 'music';

  const pre = [`aresample=${RATE}`];
  if (p.trimStartMs) pre.push(`atrim=start=${sec(p.trimStartMs)}`, 'asetpts=PTS-STARTPTS');
  if (p.trimEndMs) pre.push('areverse', `atrim=start=${sec(p.trimEndMs)}`, 'asetpts=PTS-STARTPTS', 'areverse');
  if (p.gainDb) pre.push(`volume=${p.gainDb}dB`);
  if (p.pitchCents) pre.push(`asetrate=${Math.round(RATE * 2 ** (p.pitchCents / 1200))}`, `aresample=${RATE}`);

  let graph: string;
  if (music) {
    if (durationSec === undefined) throw new Error(`${asset.key}: music needs durationSec`);
    const length = durationSec - (p.trimStartMs ?? 0) / 1000 - (p.trimEndMs ?? 0) / 1000;
    const loop = loopFilter(length, (p.loopCrossfadeMs ?? 2000) / 1000);
    graph = `[0:a]${pre.join(',')},${loop},loudnorm=I=-23:TP=-2:LRA=11,aresample=${RATE}[out]`;
  } else {
    const trim = 'silenceremove=start_periods=1:start_threshold=-50dB';
    // Trim silence at both ends; the 10 ms fade-out is a fade-in on the reversed signal
    const edges = [trim, 'areverse', trim, 'afade=t=in:d=0.010', 'areverse'];
    graph = `[0:a]${[...pre, ...edges].join(',')},loudnorm=I=-18:TP=-3:LRA=11,aresample=${RATE}[out]`;
  }

  const codec =
    format === 'ogg'
      ? ['-c:a', 'libvorbis', ...(music ? ['-b:a', '96k'] : ['-q:a', '4'])]
      : ['-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart'];

  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-filter_complex', graph,
    '-map', '[out]',
    '-ac', music ? '2' : '1',
    '-ar', String(RATE),
    ...codec,
    output,
  ];
}
```

- [ ] **Step 5: Write `scripts/audio/pitch.ts`**

```ts
/**
 * Autocorrelation pitch estimate for a short mono excerpt. The biased
 * normalisation (divide by total energy) makes the true period beat its
 * multiples, which avoids octave-down errors on harmonic sounds.
 */
export function estimatePitchHz(samples: Float32Array, sampleRate: number, minHz = 80, maxHz = 2000): number | null {
  let energy = 0;
  for (const s of samples) energy += s * s;
  if (energy === 0) return null;

  const minLag = Math.max(1, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), samples.length - 2);
  const corr = new Float64Array(maxLag + 2);
  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < samples.length; i++) sum += samples[i] * samples[i + lag];
    corr[lag] = sum / energy;
    if (lag <= maxLag && corr[lag] > best) {
      best = corr[lag];
      bestLag = lag;
    }
  }
  if (bestLag < 0 || best < 0.3) return null;

  // Parabolic interpolation around the peak for sub-sample precision
  let shift = 0;
  if (bestLag > minLag) {
    const a = corr[bestLag - 1];
    const c = corr[bestLag + 1];
    const denom = a - 2 * best + c;
    if (denom !== 0) shift = (0.5 * (a - c)) / denom;
  }
  return sampleRate / (bestLag + shift);
}

/** Cents to move `hz` onto the nearest pitch of class `rootSemitone` (C = 0), in (-600, 600]. */
export function centsToRoot(hz: number, rootSemitone: number): number {
  const midi = 69 + 12 * Math.log2(hz / 440);
  let diff = (rootSemitone - midi) % 12;
  if (diff > 6) diff -= 12;
  if (diff <= -6) diff += 12;
  return Math.round(diff * 100) || 0;
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/audioProcessing.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 7: Write the CLI `scripts/process-audio.ts`**

```ts
/**
 * npm run audio:process            → process every asset whose original exists
 * npm run audio:process -- bell    → only the listed keys
 * npm run audio:process -- --probe audio-src/bell.wav
 *                                  → duration, pitch and cents to the music root
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIO_ASSETS, MUSIC_ROOT_SEMITONE } from '../src/infrastructure/audioManifest.ts';
import { ffmpegArgs, parseDurationSec } from './audio/ffmpegArgs.ts';
import { centsToRoot, estimatePitchHz } from './audio/pitch.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'audio-src');
const outDir = join(root, 'public', 'audio');
const ffmpeg = createRequire(import.meta.url)('ffmpeg-static') as string | null;
if (!ffmpeg) {
  console.error('ffmpeg-static has no binary for this platform');
  process.exit(1);
}
const bin: string = ffmpeg;

function durationOf(file: string): number {
  // With no output ffmpeg exits non-zero but still prints the input's Duration
  const r = spawnSync(bin, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  return parseDurationSec(r.stderr);
}

function probe(file: string): void {
  const r = spawnSync(
    bin,
    ['-hide_banner', '-loglevel', 'error', '-ss', '0.05', '-t', '0.5', '-i', file, '-ac', '1', '-ar', '44100', '-f', 'f32le', 'pipe:1'],
    { maxBuffer: 1 << 26 }
  );
  const bytes = Uint8Array.from(r.stdout as Buffer);
  const samples = new Float32Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 4));
  const hz = estimatePitchHz(samples, 44100);
  console.log(`${file}: ${durationOf(file).toFixed(2)} s`);
  console.log(
    hz === null
      ? '  pitch: not found'
      : `  pitch: ${hz.toFixed(1)} Hz → pitchCents ${centsToRoot(hz, MUSIC_ROOT_SEMITONE)} (root ${MUSIC_ROOT_SEMITONE})`
  );
}

function processAll(only: Set<string>): void {
  mkdirSync(outDir, { recursive: true });
  let failed = false;
  for (const asset of AUDIO_ASSETS) {
    if (only.size > 0 && !only.has(asset.key)) continue;
    const input = join(srcDir, asset.source.srcFile);
    if (!existsSync(input)) {
      console.warn(`skip ${asset.key}: audio-src/${asset.source.srcFile} not found`);
      continue;
    }
    const duration = asset.kind === 'music' ? durationOf(input) : undefined;
    for (const file of asset.files) {
      const out = join(outDir, file);
      const r = spawnSync(bin, ffmpegArgs(asset, input, out, file.endsWith('.ogg') ? 'ogg' : 'm4a', duration), {
        encoding: 'utf8',
      });
      if (r.status !== 0) {
        failed = true;
        console.error(`${file}: ffmpeg failed\n${r.stderr}`);
        continue;
      }
      console.log(`${file}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
    }
  }
  if (failed) process.exit(1);
}

const args = process.argv.slice(2);
if (args[0] === '--probe') {
  for (const file of args.slice(1)) probe(resolve(file));
} else {
  processAll(new Set(args));
}
```

In `game-next/package.json` → `scripts`, after `content:gallery`:

```json
    "audio:process": "node --experimental-strip-types scripts/process-audio.ts",
```

- [ ] **Step 8: Smoke-run and typecheck**

Run: `npm run audio:process -- --probe audio-src/bell.*`
Expected: a duration line and a pitch line (a number or "not found"). No crash.

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 9: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add audio processing tool (G task 4)

- Added `ffmpeg-static` 5.3.0 (devDependency) and `npm run audio:process`: trims, normalises (-18 LUFS SFX, -23 LUFS music), bakes music loop crossfades and encodes Ogg Vorbis + AAC from `audio-src/` into `public/audio/`; `--probe` prints duration, pitch and cents to the music root.
- Pure builders in `game-next/scripts/audio/ffmpegArgs.ts` and `scripts/audio/pitch.ts`.
- Verification: `tests/audioProcessing.test.ts` failed first, then passed (15 tests); probe smoke run on `audio-src/bell.*`; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/package.json game-next/package-lock.json game-next/scripts/audio game-next/scripts/process-audio.ts game-next/tests/audioProcessing.test.ts CHANGELOG.md
git commit -m "feat(audio): add ffmpeg processing script"
```

---

### Task 5: Processed audio files

**Files:**
- Modify: `game-next/src/infrastructure/audioManifest.ts` (`bell.process.pitchCents`, optional trims)
- Create: `game-next/public/audio/*.ogg`, `game-next/public/audio/*.m4a` (20 files)
- Modify: `game-next/tests/audioManifest.test.ts` (add a `describe`)

**Interfaces:**
- Consumes: `npm run audio:process` (Task 4), `AUDIO_BUDGET`, `AUDIO_FORMATS`, `TRACK_IDS` (Task 3).
- Produces: the 20 files that `assetUrls` points to.

- [ ] **Step 1: Write the failing test**

Append to `game-next/tests/audioManifest.test.ts` (merge the new names into the existing import from `audioManifest.ts`):

```ts
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AUDIO_BUDGET, AUDIO_FORMATS } from '../src/infrastructure/audioManifest.ts';

const audioDir = fileURLToPath(new URL('../public/audio/', import.meta.url));
const size = (file: string) => statSync(audioDir + file).size;

describe('processed files in public/audio', () => {
  test('exactly the files the manifest lists', () => {
    const onDisk = readdirSync(audioDir).sort();
    expect(onDisk).toEqual(AUDIO_ASSETS.flatMap((a) => a.files).sort());
  });

  test('inside the size budget', () => {
    for (const format of AUDIO_FORMATS) {
      const sfxBytes = AUDIO_ASSETS.filter((a) => a.kind !== 'music').reduce((n, a) => n + size(`${a.key}.${format}`), 0);
      expect(sfxBytes, `sfx ${format}`).toBeLessThanOrEqual(AUDIO_BUDGET.sfxBytesPerFormat);
      for (const id of TRACK_IDS) {
        expect(size(`${id}.${format}`), `${id}.${format}`).toBeLessThanOrEqual(AUDIO_BUDGET.trackBytesPerFormat);
      }
    }
    const total = readdirSync(audioDir).reduce((n, f) => n + size(f), 0);
    expect(total).toBeLessThanOrEqual(AUDIO_BUDGET.totalBytes);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/audioManifest.test.ts`
Expected: FAIL with `ENOENT` on `public/audio/`.

- [ ] **Step 3: Tune the bell**

Run: `npm run audio:process -- --probe audio-src/<bell srcFile>`
Set `process: { pitchCents: <printed value> }` on the `bell` entry. If the probe says "not found", leave `pitchCents` out and write "bell pitch not measured" in the CHANGELOG entry; the reviewer checks it by ear at stop point 4.

- [ ] **Step 4: Fit the music lengths**

Run: `npm run audio:process -- --probe audio-src/<music-sky srcFile> audio-src/<music-stele srcFile>`
For a track longer than 150 s, set `trimEndMs: (duration − 150) × 1000` (rounded) so the loop is ≤ 150 s. A track shorter than 60 s: STOP and ask the reviewer.

- [ ] **Step 5: Process**

Run: `npm run audio:process`
Expected: 20 lines `<file>  <n> KB`, no "skip", exit code 0.

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/audioManifest.test.ts`
Expected: PASS. If a budget assertion fails: for a track, lower its length with `trimEndMs` and re-run Step 5; for SFX, trim the longest file with `trimEndMs`. Never raise `AUDIO_BUDGET`.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add processed audio files (G task 5)

- Generated 10 sounds × (Ogg Vorbis, AAC) into `game-next/public/audio/` with `npm run audio:process`; tuned `bell` by `<n>` cents to the music root and set music trims in `audioManifest.ts`.
- Verification: manifest/file and size-budget tests failed before generation, then passed; SFX total <a> KB ogg / <b> KB m4a, tracks <c>/<d> KB.
```

(Fill the numbers from Step 5's output.)

```bash
git add game-next/public/audio game-next/src/infrastructure/audioManifest.ts game-next/tests/audioManifest.test.ts CHANGELOG.md
git commit -m "feat(audio): add processed sound and music files"
```

---

### Task 6: Music and sound settings

**Files:**
- Modify: `game-next/src/application/progressPort.ts`
- Modify: `game-next/src/infrastructure/progressRepository.ts`
- Test: `game-next/tests/progress.test.ts`

**Interfaces:**
- Consumes: the F1/F2 settings shape `{ showTarget, reducedMotion, haptics }`.
- Produces: `Progress.settings.music: boolean`, `Progress.settings.sfx: boolean`, `ProgressRepository.setMusic(on: boolean): LoadResult`, `ProgressRepository.setSfx(on: boolean): LoadResult`.

- [ ] **Step 1: Write the failing tests**

Append to `game-next/tests/progress.test.ts` (reuse the file's `createMockStorage`):

```ts
describe('Audio settings', () => {
  test('both default on', () => {
    const repo = createProgressRepository(createMockStorage(), campaignManifest, 'oracle-v1');
    expect(repo.read().progress.settings.music).toBe(true);
    expect(repo.read().progress.settings.sfx).toBe(true);
  });

  test('saved independently of other settings', () => {
    const storage = createMockStorage();
    const repo = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    repo.setMusic(false);
    repo.setSfx(false);
    repo.setSfx(true);
    const again = createProgressRepository(storage, campaignManifest, 'oracle-v1');
    expect(again.read().progress.settings).toEqual({
      showTarget: true,
      reducedMotion: false,
      haptics: true,
      music: false,
      sfx: true,
    });
  });

  test('legacy save without the fields reads both on and is not recovered', () => {
    const legacy = JSON.stringify({
      version: 1,
      campaignRevision: 'oracle-v1',
      completed: ['1-1'],
      settings: { showTarget: false, reducedMotion: true, haptics: false },
    });
    const storage = createMockStorage({ 'mirror.rebuild.progress.v1': legacy });
    const result = createProgressRepository(storage, campaignManifest, 'oracle-v1').read();
    expect(result.recovered).toBe(false);
    expect(result.progress.settings).toEqual({
      showTarget: false,
      reducedMotion: true,
      haptics: false,
      music: true,
      sfx: true,
    });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/progress.test.ts`
Expected: FAIL, `music` is `undefined` and `repo.setMusic is not a function`.

- [ ] **Step 3: Extend the port**

`game-next/src/application/progressPort.ts`: add to `settings`:

```ts
    music: boolean;
    sfx: boolean;
```

and to `ProgressRepository` after `setHaptics`:

```ts
  setMusic(on: boolean): LoadResult;
  setSfx(on: boolean): LoadResult;
```

- [ ] **Step 4: Implement in the repository**

In `game-next/src/infrastructure/progressRepository.ts`:

1. `defaultProgress()`: `settings: { showTarget: true, reducedMotion: false, haptics: true, music: true, sfx: true },`
2. After the `haptics` parse block:

```ts
      const music =
        parsed.settings && typeof parsed.settings.music === 'boolean' ? parsed.settings.music : true;
      const sfx =
        parsed.settings && typeof parsed.settings.sfx === 'boolean' ? parsed.settings.sfx : true;
```

   and change the settings line to `settings: { showTarget, reducedMotion, haptics, music, sfx },`.
3. After `setHaptics`:

```ts
    setMusic(on: boolean): LoadResult {
      const current = readFromStorage().progress;
      return saveToStorage({ ...current, settings: { ...current.settings, music: on } });
    },

    setSfx(on: boolean): LoadResult {
      const current = readFromStorage().progress;
      return saveToStorage({ ...current, settings: { ...current.settings, sfx: on } });
    },
```

- [ ] **Step 5: Update older exact-shape assertions**

Run: `grep -n "settings).toEqual" tests/progress.test.ts`
For every match from F1/F2 tests, add `music: true, sfx: true` to the expected object (those tests never change audio settings).

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/progress.test.ts && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-03 - Persist music and sound settings (G task 6)

- Added `settings.music` and `settings.sfx` (default `true`; legacy saves read `true` without recovery or a version bump) with `setMusic` / `setSfx` in the progress repository.
- Verification: three new progress tests failed first, then passed; older exact-shape assertions extended; `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/application/progressPort.ts game-next/src/infrastructure/progressRepository.ts game-next/tests/progress.test.ts CHANGELOG.md
git commit -m "feat(settings): persist music and sound effect toggles"
```

---

### Task 7: `MusicPort` and audio tokens

**Files:**
- Create: `game-next/src/infrastructure/music.ts`
- Create: `game-next/src/infrastructure/browserAudioEnv.ts` (only `browserMusicEnv` in this task)
- Modify: `game-next/src/presentation/designTokens.ts` (add `AUDIO_TOKENS`)
- Test: `game-next/tests/music.test.ts`, `game-next/tests/designTokens.test.ts`

**Interfaces:**
- Consumes: `TrackId` (Task 3).
- Produces:
  - `type MediaLike = { src: string; loop: boolean; preload: string; volume: number; readonly paused: boolean; play(): Promise<void>; pause(): void; addEventListener(type: 'error', listener: () => void): void }`
  - `type MusicEnv = { createElement(): MediaLike; canPlayOgg(): boolean; setInterval(cb: () => void, ms: number): number; clearInterval(id: number): void; now(): number; onFirstGesture(cb: () => void): void; onVisibilityChange(cb: (hidden: boolean) => void): void; warn(msg: string): void }`
  - `type MusicOptions = { volume: number; toggleOutMs: number; toggleInMs: number; duckDownMs: number; duckUpMs: number; files(id: TrackId): readonly string[] }`
  - `interface MusicPort { setTrack(id: TrackId | null, fadeMs: number): void; duck(level: number, holdMs: number): void; pause(): void; resume(): void; setEnabled(on: boolean): void }`
  - `createMusic(env: MusicEnv, opts: MusicOptions): MusicPort`
  - `browserMusicEnv(): MusicEnv`
  - `AUDIO_TOKENS` (shape in Step 6)

- [ ] **Step 1: Write the failing tests**

`game-next/tests/music.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createMusic } from '../src/infrastructure/music.ts';
import type { MediaLike, MusicEnv, MusicOptions } from '../src/infrastructure/music.ts';

class FakeMedia implements MediaLike {
  src = '';
  loop = false;
  preload = '';
  volume = 1;
  paused = true;
  plays = 0;
  reject: Error | null = null;
  private onError: (() => void) | null = null;
  play(): Promise<void> {
    this.plays++;
    if (this.reject) return Promise.reject(this.reject);
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  addEventListener(_type: 'error', listener: () => void): void {
    this.onError = listener;
  }
  fail(): void {
    this.onError?.();
  }
}

function setup(ogg = true) {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, () => void>();
  const media: FakeMedia[] = [];
  const gestures: Array<() => void> = [];
  const warnings: string[] = [];
  let visibility: ((hidden: boolean) => void) | null = null;
  const env: MusicEnv = {
    createElement: () => {
      const m = new FakeMedia();
      media.push(m);
      return m;
    },
    canPlayOgg: () => ogg,
    setInterval: (cb) => {
      const id = nextId++;
      timers.set(id, cb);
      return id;
    },
    clearInterval: (id) => {
      timers.delete(id);
    },
    now: () => now,
    onFirstGesture: (cb) => {
      gestures.push(cb);
    },
    onVisibilityChange: (cb) => {
      visibility = cb;
    },
    warn: (msg) => {
      warnings.push(msg);
    },
  };
  const opts: MusicOptions = {
    volume: 0.5,
    toggleOutMs: 300,
    toggleInMs: 1000,
    duckDownMs: 200,
    duckUpMs: 800,
    files: (id) => [`audio/${id}.ogg`, `audio/${id}.m4a`],
  };
  const music = createMusic(env, opts);
  const advance = (ms: number) => {
    for (let t = 0; t < ms; t += 50) {
      now += 50;
      [...timers.values()].forEach((cb) => cb());
    }
  };
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { music, media, advance, flush, gestures, warnings, hide: (h: boolean) => visibility?.(h) };
}

describe('MusicPort', () => {
  test('starts a looping track and fades it in', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 1000);
    const [a] = media;
    expect(a.src).toBe('audio/music-sky.ogg');
    expect(a.loop).toBe(true);
    expect(a.plays).toBe(1);
    expect(a.volume).toBe(0);
    advance(500);
    expect(a.volume).toBeCloseTo(0.25, 5);
    advance(500);
    expect(a.volume).toBeCloseTo(0.5, 5);
  });

  test('falls back to m4a without Ogg support', () => {
    const { music, media } = setup(false);
    music.setTrack('music-sky', 0);
    expect(media[0].src).toBe('audio/music-sky.m4a');
  });

  test('asking for the playing track does nothing', () => {
    const { music, media } = setup();
    music.setTrack('music-sky', 0);
    music.setTrack('music-sky', 1000);
    expect(media[0].plays).toBe(1);
    expect(media[1].plays).toBe(0);
  });

  test('crossfades between two elements and unloads the old one', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    advance(100);
    music.setTrack('music-stele', 1500);
    const [a, b] = media;
    expect(b.src).toBe('audio/music-stele.ogg');
    advance(750);
    expect(a.volume).toBeCloseTo(0.25, 5);
    expect(b.volume).toBeCloseTo(0.25, 5);
    advance(750);
    expect(a.paused).toBe(true);
    expect(a.src).toBe('');
    expect(b.volume).toBeCloseTo(0.5, 5);
  });

  test('switching back mid-fade reuses the fading element', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.setTrack('music-stele', 1000);
    advance(500);
    music.setTrack('music-sky', 1000);
    expect(media[0].src).toBe('audio/music-sky.ogg');
    advance(1000);
    expect(media[0].volume).toBeCloseTo(0.5, 5);
    expect(media[1].src).toBe('');
  });

  test('duck lowers, holds, then restores', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.duck(0.3, 1500);
    advance(200);
    expect(media[0].volume).toBeCloseTo(0.15, 5);
    advance(1500);
    expect(media[0].volume).toBeCloseTo(0.15, 5);
    advance(800);
    expect(media[0].volume).toBeCloseTo(0.5, 5);
  });

  test('a new track cancels the duck', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.duck(0.3, 1500);
    advance(100);
    music.setTrack('music-stele', 1000);
    advance(1000);
    expect(media[1].volume).toBeCloseTo(0.5, 5);
  });

  test('disable fades out and pauses but keeps the track; enable resumes it', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.setEnabled(false);
    advance(300);
    expect(media[0].paused).toBe(true);
    expect(media[0].src).toBe('audio/music-sky.ogg');
    music.setEnabled(true);
    expect(media[0].plays).toBe(2);
    advance(1000);
    expect(media[0].volume).toBeCloseTo(0.5, 5);
  });

  test('while disabled a new track is remembered, not played', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.setEnabled(false);
    advance(300);
    music.setTrack('music-stele', 1500);
    expect(media[1].plays).toBe(0);
    music.setEnabled(true);
    expect(media[1].src).toBe('audio/music-stele.ogg');
    expect(media[1].plays).toBe(1);
    advance(1000);
    expect(media[1].volume).toBeCloseTo(0.5, 5);
    expect(media[0].src).toBe('');
  });

  test('pause stops at once; resume plays again only when enabled', () => {
    const { music, media, advance } = setup();
    music.setTrack('music-sky', 0);
    music.pause();
    expect(media[0].paused).toBe(true);
    music.resume();
    expect(media[0].plays).toBe(2);
    music.setEnabled(false);
    advance(300);
    music.pause();
    music.resume();
    expect(media[0].plays).toBe(2);
  });

  test('a track set while paused waits for resume', () => {
    const { music, media } = setup();
    music.pause();
    music.setTrack('music-sky', 0);
    expect(media[0].plays).toBe(0);
    music.resume();
    expect(media[0].plays).toBe(1);
  });

  test('hidden page pauses, visible page resumes', () => {
    const { music, media, hide } = setup();
    music.setTrack('music-sky', 0);
    hide(true);
    expect(media[0].paused).toBe(true);
    hide(false);
    expect(media[0].plays).toBe(2);
  });

  test('autoplay block waits for the first gesture, then fades in', async () => {
    const { music, media, gestures, flush, advance } = setup();
    media[0].reject = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    music.setTrack('music-sky', 0);
    await flush();
    expect(gestures).toHaveLength(1);
    media[0].reject = null;
    gestures[0]();
    expect(media[0].plays).toBe(2);
    expect(media[0].volume).toBe(0);
    advance(1000);
    expect(media[0].volume).toBeCloseTo(0.5, 5);
  });

  test('load errors and other play failures warn once per track', async () => {
    const { music, media, warnings, flush } = setup();
    media[0].reject = new Error('decode');
    music.setTrack('music-sky', 0);
    await flush();
    media[0].fail();
    media[0].fail();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('music-sky');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/music.test.ts`
Expected: FAIL, cannot resolve `../src/infrastructure/music.ts`.

- [ ] **Step 3: Write `src/infrastructure/music.ts`**

```ts
import type { TrackId } from './audioManifest.ts';

/** The part of HTMLAudioElement the port uses; tests pass a fake. */
export type MediaLike = {
  src: string;
  loop: boolean;
  preload: string;
  volume: number;
  readonly paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: 'error', listener: () => void): void;
};

export type MusicEnv = {
  createElement(): MediaLike;
  canPlayOgg(): boolean;
  setInterval(cb: () => void, ms: number): number;
  clearInterval(id: number): void;
  now(): number;
  /** Calls `cb` once on the next pointerdown/keydown */
  onFirstGesture(cb: () => void): void;
  onVisibilityChange(cb: (hidden: boolean) => void): void;
  warn(msg: string): void;
};

export type MusicOptions = {
  volume: number;
  toggleOutMs: number;
  toggleInMs: number;
  duckDownMs: number;
  duckUpMs: number;
  files(id: TrackId): readonly string[];
};

export interface MusicPort {
  setTrack(id: TrackId | null, fadeMs: number): void;
  duck(level: number, holdMs: number): void;
  pause(): void;
  resume(): void;
  setEnabled(on: boolean): void;
}

type Ramp = { from: number; to: number; start: number; ms: number };
type EndAction = 'none' | 'pause' | 'unload';
type Slot = { el: MediaLike; track: TrackId | null; gain: number; ramp: Ramp | null; end: EndAction };

const TICK_MS = 50;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function rampAt(r: Ramp, now: number): number {
  if (r.ms <= 0) return r.to;
  return r.from + (r.to - r.from) * clamp01((now - r.start) / r.ms);
}

/**
 * Streams background music on two alternating elements (spec G §2.3).
 * Streaming keeps RAM low; WebAudio would decode whole tracks to PCM.
 */
export function createMusic(env: MusicEnv, opts: MusicOptions): MusicPort {
  const warned = new Set<string>();
  const warnOnce = (track: TrackId | null, why: string) => {
    if (!track || warned.has(track)) return;
    warned.add(track);
    env.warn(`[music] ${track}: ${why}`);
  };

  const makeSlot = (): Slot => {
    const slot: Slot = { el: env.createElement(), track: null, gain: 0, ramp: null, end: 'none' };
    slot.el.loop = true;
    slot.el.preload = 'auto';
    slot.el.addEventListener('error', () => warnOnce(slot.track, 'failed to load'));
    return slot;
  };
  const slots: [Slot, Slot] = [makeSlot(), makeSlot()];
  let active = 0;
  let wanted: TrackId | null = null;
  let enabled = true;
  let paused = false;
  let waitingForGesture = false;
  let duckLevel = 1;
  let duckRamp: Ramp | null = null;
  let duckReleaseAt: number | null = null;
  let timer: number | null = null;

  const pickFile = (id: TrackId): string => {
    const files = opts.files(id);
    const ext = env.canPlayOgg() ? '.ogg' : '.m4a';
    return files.find((f) => f.endsWith(ext)) ?? files[0] ?? '';
  };

  const apply = () => {
    for (const s of slots) s.el.volume = clamp01(s.gain * duckLevel * opts.volume);
  };

  function tick(): void {
    const now = env.now();
    let busy = false;
    for (const s of slots) {
      if (!s.ramp) continue;
      s.gain = rampAt(s.ramp, now);
      if (now - s.ramp.start < s.ramp.ms) {
        busy = true;
        continue;
      }
      s.ramp = null;
      if (s.end !== 'none') {
        s.el.pause();
        if (s.end === 'unload') {
          s.el.src = '';
          s.track = null;
        }
        s.end = 'none';
      }
    }
    if (duckReleaseAt !== null && now >= duckReleaseAt) {
      duckRamp = { from: duckLevel, to: 1, start: now, ms: opts.duckUpMs };
      duckReleaseAt = null;
    }
    if (duckRamp) {
      duckLevel = rampAt(duckRamp, now);
      if (now - duckRamp.start >= duckRamp.ms) duckRamp = null;
      else busy = true;
    }
    if (duckReleaseAt !== null) busy = true;
    apply();
    if (!busy && timer !== null) {
      env.clearInterval(timer);
      timer = null;
    }
  }

  function kick(): void {
    if (timer === null) timer = env.setInterval(tick, TICK_MS);
    tick();
  }

  function onPlayError(track: TrackId, err: unknown): void {
    if ((err as { name?: string } | null)?.name === 'NotAllowedError') {
      if (waitingForGesture) return;
      waitingForGesture = true;
      env.onFirstGesture(() => {
        waitingForGesture = false;
        const s = slots[active];
        if (!s.track) return;
        s.gain = 0;
        s.end = 'none';
        s.ramp = { from: 0, to: 1, start: env.now(), ms: opts.toggleInMs };
        tryPlay(s);
        kick();
      });
      return;
    }
    warnOnce(track, 'play() failed');
  }

  function tryPlay(slot: Slot): void {
    const track = slot.track;
    if (paused || !enabled || !track) return;
    try {
      slot.el.play().catch((err: unknown) => onPlayError(track, err));
    } catch (err) {
      onPlayError(track, err);
    }
  }

  function startOn(slot: Slot, id: TrackId, fadeMs: number): void {
    if (slot.track !== id) {
      slot.track = id;
      slot.el.src = pickFile(id);
      slot.gain = 0;
    }
    slot.end = 'none';
    slot.ramp = { from: slot.gain, to: 1, start: env.now(), ms: fadeMs };
    tryPlay(slot);
  }

  function fadeOut(slot: Slot, ms: number, end: EndAction): void {
    slot.ramp = { from: slot.gain, to: 0, start: env.now(), ms };
    slot.end = end;
  }

  function crossTo(id: TrackId | null, fadeMs: number): void {
    const cur = slots[active];
    if (id !== null && cur.track === id) {
      startOn(cur, id, fadeMs);
    } else {
      if (cur.track) {
        fadeOut(cur, fadeMs, 'unload');
        active = 1 - active;
      }
      if (id !== null) startOn(slots[active], id, fadeMs);
    }
    kick();
  }

  const port: MusicPort = {
    setTrack(id, fadeMs) {
      if (id === wanted) return;
      wanted = id;
      if (duckRamp || duckReleaseAt !== null || duckLevel < 1) {
        duckReleaseAt = null;
        duckRamp = { from: duckLevel, to: 1, start: env.now(), ms: opts.duckDownMs };
      }
      if (!enabled) return;
      crossTo(id, fadeMs);
    },

    duck(level, holdMs) {
      const now = env.now();
      duckRamp = { from: duckLevel, to: clamp01(level), start: now, ms: opts.duckDownMs };
      duckReleaseAt = now + opts.duckDownMs + holdMs;
      kick();
    },

    pause() {
      if (paused) return;
      paused = true;
      // Jump every fade to its end so nothing is left half-done while hidden
      for (const s of slots) if (s.ramp) s.ramp = { ...s.ramp, ms: 0 };
      if (duckRamp) duckRamp = { ...duckRamp, ms: 0 };
      tick();
      for (const s of slots) s.el.pause();
    },

    resume() {
      if (!paused) return;
      paused = false;
      tryPlay(slots[active]);
    },

    setEnabled(on) {
      if (on === enabled) return;
      enabled = on;
      if (!on) {
        for (const s of slots) {
          if (s.track) fadeOut(s, opts.toggleOutMs, s === slots[active] ? 'pause' : 'unload');
        }
        kick();
        return;
      }
      if (wanted !== null) crossTo(wanted, opts.toggleInMs);
    },
  };

  env.onVisibilityChange((hidden) => (hidden ? port.pause() : port.resume()));
  return port;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/music.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Write `src/infrastructure/browserAudioEnv.ts`**

```ts
import type { MusicEnv } from './music.ts';

/** Real browser wiring for MusicPort. Not unit-tested: it is only DOM calls. */
export function browserMusicEnv(): MusicEnv {
  return {
    createElement: () => new Audio(),
    canPlayOgg: () => new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '',
    setInterval: (cb, ms) => window.setInterval(cb, ms),
    clearInterval: (id) => window.clearInterval(id),
    now: () => performance.now(),
    onFirstGesture: (cb) => {
      const once = () => {
        window.removeEventListener('pointerdown', once, true);
        window.removeEventListener('keydown', once, true);
        cb();
      };
      window.addEventListener('pointerdown', once, true);
      window.addEventListener('keydown', once, true);
    },
    onVisibilityChange: (cb) => {
      document.addEventListener('visibilitychange', () => cb(document.hidden));
    },
    warn: (msg) => console.warn(msg),
  };
}
```

- [ ] **Step 6: Add `AUDIO_TOKENS`**

Append to `game-next/src/presentation/designTokens.ts`:

```ts
/** Audio levels and timings (spec G). Cue volumes are multiplied by the bus volume. */
export const AUDIO_TOKENS = {
  musicVolume: 0.45,
  sfxVolume: 0.8,
  maxVoices: 6,
  repeatGapMs: 40,
  toggleOutMs: 300,
  toggleInMs: 1000,
  bootFadeMs: 1000,
  duck: { level: 0.3, holdMs: 1500, downMs: 200, upMs: 800 },
  overlapDelayMs: 60,
  cues: {
    lift: 0.35,
    snap: 0.8,
    snapWin: 0.9,
    settle: 0.4,
    return: 0.3,
    rotate: 0.4,
    rotateRate: 1.12,
    rotateBlocked: 0.6,
    overlap: 0.6,
    reset: 0.4,
    stinger: 0.9,
    uiTap: 0.4,
    uiDialog: 0.35,
    uiNode: 0.5,
    uiLocked: 0.5,
  },
} as const;
```

Add `AUDIO_TOKENS` to the import list in `tests/designTokens.test.ts` and this test inside its `describe`:

```ts
  test('audio tokens keep music under effects and match spec G timings', () => {
    expect(AUDIO_TOKENS.musicVolume).toBeLessThan(AUDIO_TOKENS.sfxVolume);
    expect(AUDIO_TOKENS.duck).toEqual({ level: 0.3, holdMs: 1500, downMs: 200, upMs: 800 });
    expect(AUDIO_TOKENS.maxVoices).toBe(6);
    expect(AUDIO_TOKENS.repeatGapMs).toBe(40);
    expect(AUDIO_TOKENS.overlapDelayMs).toBe(60);
  });
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/music.test.ts tests/designTokens.test.ts && npm run typecheck`
Expected: PASS. `typecheck` also proves `HTMLAudioElement` satisfies `MediaLike`.

- [ ] **Step 8: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add streaming music port (G task 7)

- Added `MusicPort` (`game-next/src/infrastructure/music.ts`): two alternating `HTMLAudioElement`s with ramped crossfades, duck/hold/restore, settings toggle that pauses but keeps the track, lifecycle pause/resume, visibility handling, autoplay-block recovery on first gesture, warn-once errors; browser wiring in `browserAudioEnv.ts`.
- Added `AUDIO_TOKENS` to `designTokens.ts`.
- Verification: `tests/music.test.ts` failed first, then passed (14 tests); new design-token test passed; `npm run typecheck` passed.
```

```bash
git add game-next/src/infrastructure/music.ts game-next/src/infrastructure/browserAudioEnv.ts game-next/src/presentation/designTokens.ts game-next/tests/music.test.ts game-next/tests/designTokens.test.ts CHANGELOG.md
git commit -m "feat(audio): add streaming music port"
```

---

### Task 8: `SfxPort`

**Files:**
- Create: `game-next/src/infrastructure/sfx.ts`, `game-next/src/infrastructure/phaserSfx.ts`
- Modify: `game-next/src/infrastructure/browserAudioEnv.ts` (add `browserSfxEnv`)
- Test: `game-next/tests/sfx.test.ts`

**Interfaces:**
- Consumes: `SfxKey`, `SFX_KEYS` (Task 3).
- Produces:
  - `type AudioCue = { key: SfxKey; rate: number; volume: number; delayMs: number }`
  - `type SfxDriver = { isLocked(): boolean; has(key: SfxKey): boolean; play(key: SfxKey, config: { rate: number; volume: number }): number }` (returns the sound's length in ms)
  - `type SfxEnv = { now(): number; setTimeout(cb: () => void, ms: number): number; clearTimeout(id: number): void; warn(msg: string): void }`
  - `type SfxOptions = { volume: number; maxVoices: number; repeatGapMs: number }`
  - `interface SfxPort { play(cues: readonly AudioCue[]): void; setEnabled(on: boolean): void }`
  - `createSfx(driver: SfxDriver | null, env: SfxEnv, opts: SfxOptions): SfxPort`
  - `phaserSfxDriver(sound: Phaser.Sound.BaseSoundManager): SfxDriver`, `browserSfxEnv(): SfxEnv`

- [ ] **Step 1: Write the failing tests**

`game-next/tests/sfx.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { SFX_KEYS } from '../src/infrastructure/audioManifest.ts';
import type { SfxKey } from '../src/infrastructure/audioManifest.ts';
import { createSfx } from '../src/infrastructure/sfx.ts';
import type { AudioCue, SfxDriver, SfxEnv } from '../src/infrastructure/sfx.ts';

function setup(lengthMs = 500) {
  const calls: Array<{ key: SfxKey; rate: number; volume: number }> = [];
  const loaded = new Set<SfxKey>(SFX_KEYS);
  const state = { locked: false, throwOn: null as SfxKey | null };
  const driver: SfxDriver = {
    isLocked: () => state.locked,
    has: (key) => loaded.has(key),
    play: (key, config) => {
      if (key === state.throwOn) throw new Error('boom');
      calls.push({ key, ...config });
      return lengthMs;
    },
  };
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; cb: () => void }>();
  const warnings: string[] = [];
  const env: SfxEnv = {
    now: () => now,
    setTimeout: (cb, ms) => {
      const id = nextId++;
      timers.set(id, { at: now + ms, cb });
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
    warn: (msg) => {
      warnings.push(msg);
    },
  };
  const advance = (ms: number) => {
    now += ms;
    for (const [id, t] of [...timers]) {
      if (t.at <= now) {
        timers.delete(id);
        t.cb();
      }
    }
  };
  const sfx = createSfx(driver, env, { volume: 0.8, maxVoices: 6, repeatGapMs: 40 });
  return { sfx, calls, loaded, state, warnings, advance };
}

const cue = (key: SfxKey, extra: Partial<AudioCue> = {}): AudioCue => ({ key, rate: 1, volume: 1, delayMs: 0, ...extra });

describe('SfxPort', () => {
  test('plays with the cue rate and volume times the bus volume', () => {
    const { sfx, calls } = setup();
    sfx.play([cue('bell', { rate: 1.5, volume: 0.5 })]);
    expect(calls).toEqual([{ key: 'bell', rate: 1.5, volume: 0.4 }]);
  });

  test('disabled plays nothing until enabled again', () => {
    const { sfx, calls } = setup();
    sfx.setEnabled(false);
    sfx.play([cue('tick')]);
    expect(calls).toHaveLength(0);
    sfx.setEnabled(true);
    sfx.play([cue('tick')]);
    expect(calls).toHaveLength(1);
  });

  test('no driver is silent and safe', () => {
    const sfx = createSfx(null, { now: () => 0, setTimeout: () => 0, clearTimeout: () => {}, warn: () => {} }, {
      volume: 1,
      maxVoices: 6,
      repeatGapMs: 40,
    });
    expect(() => sfx.play([cue('tick')])).not.toThrow();
  });

  test('locked audio skips quietly', () => {
    const { sfx, calls, state, warnings } = setup();
    state.locked = true;
    sfx.play([cue('tick')]);
    expect(calls).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  test('missing or failing sounds warn once per key and never throw', () => {
    const { sfx, loaded, state, warnings, advance } = setup();
    loaded.delete('hollow');
    state.throwOn = 'thud';
    sfx.play([cue('hollow'), cue('thud')]);
    advance(100);
    sfx.play([cue('hollow'), cue('thud')]);
    expect(warnings).toHaveLength(2);
  });

  test('the same key within the repeat gap is dropped', () => {
    const { sfx, calls, advance } = setup();
    sfx.play([cue('bell')]);
    advance(39);
    sfx.play([cue('bell')]);
    expect(calls).toHaveLength(1);
    advance(1);
    sfx.play([cue('bell')]);
    expect(calls).toHaveLength(2);
  });

  test('at most six voices at once; ended voices free their slot', () => {
    const { sfx, calls, advance } = setup(500);
    sfx.play(['bell', 'tick', 'tap-soft', 'thud', 'hollow', 'shimmer', 'swish'].map((k) => cue(k as SfxKey)));
    expect(calls).toHaveLength(6);
    advance(500);
    sfx.play([cue('swish')]);
    expect(calls).toHaveLength(7);
  });

  test('delayed cues fire later and are cancelled by disabling', () => {
    const { sfx, calls, advance } = setup();
    sfx.play([cue('hollow', { delayMs: 60 })]);
    advance(59);
    expect(calls).toHaveLength(0);
    advance(1);
    expect(calls).toHaveLength(1);
    sfx.play([cue('shimmer', { delayMs: 60 })]);
    sfx.setEnabled(false);
    sfx.setEnabled(true);
    advance(100);
    expect(calls).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/sfx.test.ts`
Expected: FAIL, cannot resolve `../src/infrastructure/sfx.ts`.

- [ ] **Step 3: Write `src/infrastructure/sfx.ts`**

```ts
import type { SfxKey } from './audioManifest.ts';

export type AudioCue = { key: SfxKey; rate: number; volume: number; delayMs: number };

export type SfxDriver = {
  isLocked(): boolean;
  has(key: SfxKey): boolean;
  /** Starts the sound and returns its length in ms (0 if unknown) */
  play(key: SfxKey, config: { rate: number; volume: number }): number;
};

export type SfxEnv = {
  now(): number;
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
  warn(msg: string): void;
};

export type SfxOptions = { volume: number; maxVoices: number; repeatGapMs: number };

export interface SfxPort {
  play(cues: readonly AudioCue[]): void;
  setEnabled(on: boolean): void;
}

/** Sound effects are decoration: every failure is swallowed (spec G §2.2, §6). */
export function createSfx(driver: SfxDriver | null, env: SfxEnv, opts: SfxOptions): SfxPort {
  let enabled = true;
  const voiceEnds: number[] = [];
  const lastStart = new Map<SfxKey, number>();
  const pending = new Set<number>();
  const warned = new Set<SfxKey>();

  const warnOnce = (key: SfxKey, why: string) => {
    if (warned.has(key)) return;
    warned.add(key);
    env.warn(`[sfx] ${key}: ${why}`);
  };

  function fire(cue: AudioCue): void {
    if (!enabled || !driver) return;
    try {
      if (driver.isLocked()) return;
      if (!driver.has(cue.key)) {
        warnOnce(cue.key, 'not loaded');
        return;
      }
      const now = env.now();
      for (let i = voiceEnds.length - 1; i >= 0; i--) if (voiceEnds[i] <= now) voiceEnds.splice(i, 1);
      const last = lastStart.get(cue.key);
      if (last !== undefined && now - last < opts.repeatGapMs) return;
      if (voiceEnds.length >= opts.maxVoices) return;
      const lengthMs = driver.play(cue.key, { rate: cue.rate, volume: cue.volume * opts.volume });
      lastStart.set(cue.key, now);
      voiceEnds.push(now + Math.max(0, lengthMs));
    } catch {
      warnOnce(cue.key, 'play failed');
    }
  }

  return {
    play(cues) {
      if (!enabled) return;
      for (const cue of cues) {
        if (cue.delayMs > 0) {
          const id = env.setTimeout(() => {
            pending.delete(id);
            fire(cue);
          }, cue.delayMs);
          pending.add(id);
        } else {
          fire(cue);
        }
      }
    },

    setEnabled(on) {
      enabled = on;
      if (on) return;
      for (const id of pending) env.clearTimeout(id);
      pending.clear();
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/sfx.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Phaser driver and browser env**

`game-next/src/infrastructure/phaserSfx.ts`:

```ts
import type Phaser from 'phaser';
import type { SfxDriver } from './sfx.ts';

/** SfxDriver over Phaser's global sound manager; keys are the SfxKey names loaded in BackgroundScene. */
export function phaserSfxDriver(sound: Phaser.Sound.BaseSoundManager): SfxDriver {
  return {
    isLocked: () => sound.locked,
    has: (key) => sound.game.cache.audio.exists(key),
    play: (key, config) => {
      const s = sound.add(key, { rate: config.rate, volume: config.volume });
      s.once('complete', () => s.destroy());
      s.play();
      return (s.duration * 1000) / config.rate;
    },
  };
}
```

Append to `game-next/src/infrastructure/browserAudioEnv.ts` (and add `import type { SfxEnv } from './sfx.ts';` at the top):

```ts
export function browserSfxEnv(): SfxEnv {
  return {
    now: () => performance.now(),
    setTimeout: (cb, ms) => window.setTimeout(cb, ms),
    clearTimeout: (id) => window.clearTimeout(id),
    warn: (msg) => console.warn(msg),
  };
}
```

- [ ] **Step 6: Typecheck and full tests**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: CHANGELOG and commit**

```markdown
### 2026-10-03 - Add sound effect port (G task 8)

- Added `SfxPort` (`game-next/src/infrastructure/sfx.ts`): bus volume, 6-voice limit, 40 ms same-key gap, delayed cues cancelled on disable, warn-once and swallow-all error handling; Phaser driver in `phaserSfx.ts`; `browserSfxEnv`.
- Verification: `tests/sfx.test.ts` failed first, then passed (8 tests); `npm run typecheck` and `npm test` passed.
```

```bash
git add game-next/src/infrastructure/sfx.ts game-next/src/infrastructure/phaserSfx.ts game-next/src/infrastructure/browserAudioEnv.ts game-next/tests/sfx.test.ts CHANGELOG.md
git commit -m "feat(audio): add sound effect port"
```

---

### Task 9: Wire audio into the game

**Files:**
- Create: `game-next/src/presentation/audio/audioServices.ts`, `game-next/src/presentation/audio/tracks.ts`
- Modify: `game-next/src/presentation/transitions/SceneDirector.ts`
- Modify: `game-next/src/presentation/BackgroundScene.ts`
- Modify: `game-next/src/presentation/SettingsDialog.ts`
- Modify: `game-next/src/main.ts`
- Test: `game-next/tests/audioServices.test.ts`, `game-next/tests/sceneDirector.test.ts` (add a `describe`)

**Interfaces:**
- Consumes: `MusicPort`, `createMusic`, `browserMusicEnv` (Task 7); `SfxPort`, `createSfx`, `phaserSfxDriver`, `browserSfxEnv` (Task 8); `SFX_KEYS`, `assetUrls`, `TrackId` (Task 3); `setMusic`, `setSfx`, `settings.music`, `settings.sfx` (Task 6); `AUDIO_TOKENS` (Task 7); F1 `SceneDirector`, `SceneKey`, `TRANSITION_TOKENS`, `BackgroundScene`.
- Produces:
  - `type AudioServices = { music: MusicPort; sfx: SfxPort }`, `AUDIO_REGISTRY_KEY = 'audio'`, `SILENT_AUDIO: AudioServices`, `audioServices(scene: Phaser.Scene): AudioServices`
  - `trackFor(scene: SceneKey): TrackId`
  - `SceneDirector.setMusic(music: Pick<MusicPort, 'setTrack'>): void`

Run `impact` on `SceneDirector`, `BackgroundScene`, `SettingsDialog` first and report.

- [ ] **Step 1: Write the failing tests**

`game-next/tests/audioServices.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import type Phaser from 'phaser';
import { AUDIO_REGISTRY_KEY, SILENT_AUDIO, audioServices } from '../src/presentation/audio/audioServices.ts';
import type { AudioServices } from '../src/presentation/audio/audioServices.ts';
import { trackFor } from '../src/presentation/audio/tracks.ts';

const sceneWith = (value: unknown) =>
  ({ registry: { get: (key: string) => (key === AUDIO_REGISTRY_KEY ? value : undefined) } }) as unknown as Phaser.Scene;

describe('audio services', () => {
  test('reads the services from the game registry', () => {
    const services = { music: SILENT_AUDIO.music, sfx: SILENT_AUDIO.sfx } satisfies AudioServices;
    expect(audioServices(sceneWith(services))).toBe(services);
  });

  test('falls back to silent services that accept every call', () => {
    const audio = audioServices(sceneWith(undefined));
    expect(audio).toBe(SILENT_AUDIO);
    expect(() => {
      audio.music.setTrack('music-sky', 100);
      audio.music.duck(0.3, 100);
      audio.music.pause();
      audio.music.resume();
      audio.music.setEnabled(false);
      audio.sfx.play([{ key: 'tick', rate: 1, volume: 1, delayMs: 0 }]);
      audio.sfx.setEnabled(false);
    }).not.toThrow();
  });
});

describe('trackFor', () => {
  test('menu and map share the sky track; play has its own', () => {
    expect(trackFor('MenuScene')).toBe('music-sky');
    expect(trackFor('LevelSelectScene')).toBe('music-sky');
    expect(trackFor('PlayScene')).toBe('music-stele');
  });
});
```

Append to `game-next/tests/sceneDirector.test.ts`, using the file's own `setup()` (it returns `{ director, host, menu, play }`; `host.run(ms)` advances frames):

```ts
describe('music follows the scene', () => {
  test('boot uses the boot fade; go uses the route length', () => {
    const { director, host, menu } = setup();
    const calls: Array<[string | null, number]> = [];
    director.setMusic({ setTrack: (id, ms) => calls.push([id, ms]) });
    director.boot('MenuScene', {});
    host.run(2000);
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    expect(calls).toEqual([
      ['music-sky', 1000],
      ['music-stele', 1500],
    ]);
  });

  test('a refused go leaves the music alone', () => {
    const { director, menu } = setup();
    const calls: unknown[] = [];
    director.setMusic({ setTrack: (...args) => calls.push(args) });
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    director.go(menu, 'PlayScene', {}, { route: 'menu-to-play' });
    expect(calls).toHaveLength(1);
  });
});
```

If F1's `setup()` has a different shape, adapt only the setup lines to what the file defines; keep the assertions.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/audioServices.test.ts tests/sceneDirector.test.ts`
Expected: FAIL, cannot resolve `audioServices.ts`, and `director.setMusic is not a function`.

- [ ] **Step 3: `audioServices.ts` and `tracks.ts`**

`game-next/src/presentation/audio/audioServices.ts`:

```ts
import type Phaser from 'phaser';
import type { MusicPort } from '../../infrastructure/music.ts';
import type { SfxPort } from '../../infrastructure/sfx.ts';

export type AudioServices = { music: MusicPort; sfx: SfxPort };

/** main.ts stores the services in game.registry under this key. */
export const AUDIO_REGISTRY_KEY = 'audio';

/** Used before main.ts has registered audio (harness, FixtureScene) — every call is a no-op. */
export const SILENT_AUDIO: AudioServices = {
  music: { setTrack() {}, duck() {}, pause() {}, resume() {}, setEnabled() {} },
  sfx: { play() {}, setEnabled() {} },
};

export function audioServices(scene: Phaser.Scene): AudioServices {
  const found = scene.registry?.get(AUDIO_REGISTRY_KEY) as AudioServices | undefined;
  return found ?? SILENT_AUDIO;
}
```

`game-next/src/presentation/audio/tracks.ts`:

```ts
import type { TrackId } from '../../infrastructure/audioManifest.ts';
import type { SceneKey } from '../transitions/SceneDirector.ts';

/** Spec G §3.6: Menu and Map share the sky track; the level has its own. */
export function trackFor(scene: SceneKey): TrackId {
  return scene === 'PlayScene' ? 'music-stele' : 'music-sky';
}
```

- [ ] **Step 4: `SceneDirector` asks for the track**

In `game-next/src/presentation/transitions/SceneDirector.ts`:

1. Imports:

```ts
import type { MusicPort } from '../../infrastructure/music.ts';
import { trackFor } from '../audio/tracks.ts';
import { AUDIO_TOKENS } from '../designTokens.ts';
```

2. Field next to `private host`: `private music: Pick<MusicPort, 'setTrack'> | null = null;`
3. Method after `setHost`:

```ts
  setMusic(music: Pick<MusicPort, 'setTrack'>): void {
    this.music = music;
  }
```

4. In `go(...)`, directly after `if (!host || this.busy) return false;`:

```ts
    // Music fades over the whole route, independent of reduced motion (spec G §3.6, §3.7)
    this.music?.setTrack(trackFor(to), TRANSITION_TOKENS.routes[ctx.route].totalMs);
```

5. In `boot(...)`, directly after `if (!host || this.busy) return;`:

```ts
    this.music?.setTrack(trackFor(to), AUDIO_TOKENS.bootFadeMs);
```

Routes that keep the same track (`menu-to-map`, `map-to-menu`, `next-level`) need no special case: `MusicPort.setTrack` ignores the track that is already wanted.

- [ ] **Step 5: Preload SFX in `BackgroundScene`**

In `game-next/src/presentation/BackgroundScene.ts`, add imports and a `preload` method before `create`:

```ts
import { SFX_KEYS, assetUrls } from '../infrastructure/audioManifest.ts';
```

```ts
  preload(): void {
    // Small and needed on every screen; music streams on demand instead (spec G §2.6)
    for (const key of SFX_KEYS) this.load.audio(key, assetUrls(key));
  }
```

- [ ] **Step 6: Settings toggles**

In `game-next/src/presentation/SettingsDialog.ts`:

1. Import `import { audioServices } from './audio/audioServices.ts';`.
2. `const modalH = 440;` → `const modalH = 560;` and the comment above it to `(460 x 560)`.
3. In `showDeleteConfirmation`, `.rectangle(0, 0, 460, 440, …)` → `.rectangle(0, 0, 460, 560, …)`.
4. After the "Toggle 2" block (reduced motion), insert:

```ts
    const audio = audioServices(this.scene);
    const audioSettings = this.progressRepo.read().progress.settings;

    // Background music: fades out and pauses when off (spec G §5.1)
    this.createToggleRow(-modalH / 2 + 240, 'Nhạc nền', audioSettings.music, (on) => {
      this.progressRepo.setMusic(on);
      audio.music.setEnabled(on);
    });

    // Sound effects
    this.createToggleRow(-modalH / 2 + 305, 'Hiệu ứng âm thanh', audioSettings.sfx, (on) => {
      this.progressRepo.setSfx(on);
      audio.sfx.setEnabled(on);
    });
```

5. In the haptics toggle ("Toggle 3"), change its row offset `-modalH / 2 + 240` to `-modalH / 2 + 370`.

- [ ] **Step 7: Create the services in `main.ts`**

In `game-next/src/main.ts` (F1/F2 version):

1. Imports:

```ts
import { assetUrls } from './infrastructure/audioManifest.ts';
import { browserMusicEnv, browserSfxEnv } from './infrastructure/browserAudioEnv.ts';
import { createMusic } from './infrastructure/music.ts';
import { phaserSfxDriver } from './infrastructure/phaserSfx.ts';
import { createSfx } from './infrastructure/sfx.ts';
import { AUDIO_REGISTRY_KEY } from './presentation/audio/audioServices.ts';
import type { AudioServices } from './presentation/audio/audioServices.ts';
import { AUDIO_TOKENS } from './presentation/designTokens.ts';
```

2. After the line that calls `setMotionScale(savedSettings.reducedMotion ? 0 : 1);`:

```ts
// Music lives outside every scene so it plays on through transitions (spec G §2.3)
const music = createMusic(browserMusicEnv(), {
  volume: AUDIO_TOKENS.musicVolume,
  toggleOutMs: AUDIO_TOKENS.toggleOutMs,
  toggleInMs: AUDIO_TOKENS.toggleInMs,
  duckDownMs: AUDIO_TOKENS.duck.downMs,
  duckUpMs: AUDIO_TOKENS.duck.upMs,
  files: assetUrls,
});
music.setEnabled(savedSettings.music);
```

3. After `director.setHost(new PhaserSceneHost(game));`: `director.setMusic(music);`
4. At the top of the `game.events.once('ready', () => { … })` callback, before any `director.boot`:

```ts
  // game.sound only exists once Phaser has booted
  const sfx = createSfx(phaserSfxDriver(game.sound), browserSfxEnv(), {
    volume: AUDIO_TOKENS.sfxVolume,
    maxVoices: AUDIO_TOKENS.maxVoices,
    repeatGapMs: AUDIO_TOKENS.repeatGapMs,
  });
  sfx.setEnabled(savedSettings.sfx);
  const audio: AudioServices = { music, sfx };
  game.registry.set(AUDIO_REGISTRY_KEY, audio);
```

5. In `setupAndroidLifecycle({...})`: append to `onBackground`: `music.pause(); game.sound?.pauseAll();` and append to `onResume`: `game.sound?.resumeAll(); music.resume();`.

- [ ] **Step 8: Run tests, typecheck, build**

Run: `npx vitest run tests/audioServices.test.ts tests/sceneDirector.test.ts && npm run typecheck && npm test && npm run build`
Expected: PASS; `dist/audio/` contains the 20 files (`ls dist/audio | wc -l` → 20).

- [ ] **Step 9: Manual check in the browser**

Run: `npm run dev`, open the printed URL in Chrome (DevTools device 390 × 844).
Check and write the result into the task report:
1. Before the first tap: silence. First tap: `music-sky` fades in over ~1 s.
2. Menu → Map: music continues unchanged. Map → a level: crossfade to `music-stele` over ~1.5 s. Back to Map: crossfade back over ~1 s.
3. Settings: "Nhạc nền" off → fades out; on → same track fades back in. Reopen the app: toggles keep their state. Settings modal: five rows (four when haptics is hidden), nothing overlaps the "Xóa toàn bộ tiến trình chơi" link.
4. Switch browser tab away and back: music stops and resumes.
5. Console: no `[music]` or `[sfx]` warnings.

- [ ] **Step 10: CHANGELOG and commit**

```markdown
### 2026-10-03 - Play scene music and register audio services (G task 9)

- `main.ts` creates `MusicPort` and `SfxPort`, applies saved settings, registers them in `game.registry` (`audioServices(scene)` falls back to silence), and pauses/resumes audio with the app lifecycle.
- `SceneDirector` requests `trackFor(scene)` on every route (route length) and on boot (1000 ms); `BackgroundScene` preloads the 8 SFX; `SettingsDialog` gains "Nhạc nền" and "Hiệu ứng âm thanh" toggles in a 560 px modal.
- Verification: `tests/audioServices.test.ts` and two director tests failed first, then passed; `npm run typecheck`, `npm test`, `npm run build` passed (20 files in `dist/audio/`); browser check of steps 1–5 recorded.
```

```bash
git add game-next/src/presentation/audio game-next/src/presentation/transitions/SceneDirector.ts game-next/src/presentation/BackgroundScene.ts game-next/src/presentation/SettingsDialog.ts game-next/src/main.ts game-next/tests/audioServices.test.ts game-next/tests/sceneDirector.test.ts CHANGELOG.md
git commit -m "feat(audio): play scene music and wire audio services"
```

- [ ] **Step 11: G1 phase check and STOP (index stop point 4)**

Run: `npm run typecheck && npm test && npm run content:validate && npm run build`
Expected: all PASS.

Build an APK for the reviewer: `npm run android:sync`, then in `game-next/android/`: `cmd /c gradlew.bat assembleDebug`.

Tell the reviewer what to check on the phone and in Chrome: both loops seamless over two passes; crossfades smooth; music starts at app open or on first tap (note which); background/resume; whether another app's music (Spotify/YouTube) is paused when the game's music starts (spec §9). Wait for the answer before G2.

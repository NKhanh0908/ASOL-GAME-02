# Audio G0–G2 — Plan index

Read this file first, then follow the table in order. Each phase file is self-contained (Goal, Global Constraints, file map, TDD tasks with code). An executor needs only their phase file plus the spec.

**Spec:** `docs/superpowers/specs/2026-10-03-g-audio-design.md` (written 2026-10-03, reviewed by NKhanh0908 before these plans were requested).

**Code folder:** `game-next/`. Task numbers run continuously across the three phases (Task 1–12), so "G Task 6" always means one place.

## Order

| # | File | Tasks | Branch | Delivers |
|---|---|---|---|---|
| 1 | `2026-10-03-g0-audio-assets.md` | 1–2 | `docs/audio-g0` from `main` | Candidate shortlist, reviewer's picks, music key, originals in `game-next/audio-src/` (gitignored) |
| 2 | `2026-10-03-g1-audio-foundation.md` | 3–9 | `feat/audio` (see Branches) | `audio:process`, processed files in `public/audio/`, manifest, `MusicPort`, `SfxPort`, settings, scene music |
| 3 | `2026-10-03-g2-audio-cues.md` | 10–12 | `feat/audio` | Event → cue table, victory stinger, UI cues, acceptance record |

## Branches

- **G0** touches only docs and `game-next/.gitignore`, so it starts now on `docs/audio-g0` from `main`. The reviewer merges it into `main`.
- **G1 and G2** need F1 (`SceneDirector`, `BackgroundScene`, `settings.reducedMotion`) and F2 (`FeedbackDirector`, `settings.haptics`, victory timeline). The reviewer chose "after F2" during brainstorming. Create `feat/audio` from the newest branch that contains F2 Task 10 **and** G0:
  - if `feat/motion-f3` (or `main` after the F merge) exists, branch from it, then `git merge docs/audio-g0` if G0 is not merged yet;
  - never rebase or rewrite pushed history.

## Roles

| Role | Who | Work |
|---|---|---|
| Controller | Claude in the main session | Reads this index, hands out tasks in order, reviews after each task, runs phase checks, updates `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`, stops at stop points |
| Executor | One fresh subagent per task (`superpowers:subagent-driven-development`) | Exactly one task: failing test, implementation, tests, CHANGELOG entry, commit |
| Reviewer | NKhanh0908 | Listens and picks assets, decides at stop points, approves on device |

## Stop points

1. **Before Task 1:** approve this plan set and the spec departures below.
2. **G0 Task 1 Step 5:** the reviewer listens to the shortlist, picks one file per key and two tracks, downloads the originals into `game-next/audio-src/` with the given names, and states the music key. No task after this runs until the picks are written down.
3. **G1 Task 4 Step 1:** agree to add `ffmpeg-static@5.3.0` as an exact devDependency (already agreed in brainstorming; confirm the version).
4. **After G1 Task 9:** on a mid-range Android phone and Chrome: both loops are seamless, crossfades sound smooth, the bell sits in the music's key, record audio-focus behaviour (spec §9).
5. **After G2 Task 12:** the reviewer runs `docs/testing/audio/g-acceptance.md` and changes its status to `passed` with a quoted sentence.

A failed task, or a red test from an earlier task, stops the flow; report to the reviewer.

## GitNexus in every task

| When | Executor does | Report |
|---|---|---|
| Before editing an existing function, class or method | `impact({ target, direction: "upstream", repo: "ASOL-GAME-02" })` | Direct callers, affected flows, risk |
| Before commit | `detect_changes({ scope: "staged", repo: "ASOL-GAME-02" })` | Changed symbols match the task |
| After commit | `node .gitnexus/run.cjs analyze` from the repo root | — |

New files need no `impact`. HIGH or CRITICAL risk: the controller tells the reviewer before handing out the task. Known before writing: `SceneDirector.go` (G Task 9) and `FeedbackDirector.handle` / `playVictory` (G Task 11) sit on every scene change and every move; they did not exist when this plan was written, so measure at the start of the task. If the GitNexus MCP server is unavailable, say so in the CHANGELOG verification bullet.

## Contracts between tasks

| Produced in | Name | Used in |
|---|---|---|
| Task 2 | `## Selected` table and `MUSIC_ROOT_SEMITONE` in `docs/testing/audio/candidates.md`; originals in `game-next/audio-src/` | 3, 5 |
| Task 3 | `SfxKey`, `TrackId`, `AudioKey`, `SFX_KEYS`, `TRACK_IDS`, `AudioAsset`, `AudioProcess`, `AudioLicense`, `AUDIO_LICENSES`, `AUDIO_FORMATS`, `AUDIO_BUDGET`, `MUSIC_ROOT_SEMITONE`, `AUDIO_ASSETS`, `assetUrls(key)` | 4–12 |
| Task 4 | `ffmpegArgs`, `loopFilter`, `parseDurationSec`, `estimatePitchHz`, `centsToRoot`, `npm run audio:process` | 5 |
| Task 5 | 20 files in `game-next/public/audio/` | 9 |
| Task 6 | `Progress.settings.music`, `Progress.settings.sfx`, `setMusic`, `setSfx` | 9 |
| Task 7 | `MediaLike`, `MusicEnv`, `MusicOptions`, `MusicPort`, `createMusic`, `browserMusicEnv`, `AUDIO_TOKENS` | 8–12 |
| Task 8 | `AudioCue`, `SfxDriver`, `SfxEnv`, `SfxOptions`, `SfxPort`, `createSfx`, `phaserSfxDriver`, `browserSfxEnv` | 9–12 |
| Task 9 | `AudioServices`, `AUDIO_REGISTRY_KEY`, `SILENT_AUDIO`, `audioServices(scene)`, `trackFor(scene)`, `SceneDirector.setMusic` | 10–12 |
| Task 10 | `PENTATONIC_STEPS`, `pitchFor`, `snappedCount`, `audioCues`, `STINGER_CUE`, `playFeedbackAudio`, `playVictoryAudio` | 11 |
| Task 11 | `FeedbackDeps.audio` | — |
| Task 12 | `UiCue`, `uiCue`, `playUiCue`, `docs/testing/audio/g-acceptance.md` | — |

## Spec departures (review at stop point 1)

1. **Music key lives in the manifest.** `MUSIC_ROOT_SEMITONE` is exported from `audioManifest.ts`, not `AUDIO_TOKENS`. Only the build script uses it: `bell` is pitch-shifted to the root at processing time, so runtime code never needs the key. The spec's `rootNote` field is dropped; `bell.process.pitchCents` (measured with `--probe`) replaces it.
2. **`audio:process --probe <file>`** prints duration, estimated pitch and the cents needed to reach the root. Spec §4.1 left "how to measure the bell" open.
3. **Two tracks must share a key.** If the reviewer's favourite tracks differ in key, G0 stops and asks, instead of building the per-track key path from spec §9 up front (YAGNI).
4. **Originals are downloaded by the reviewer.** Freesound originals need a logged-in account and Pixabay blocks scripted downloads, so the agent only lists links.
5. **`.gitignore` entry goes into `game-next/.gitignore`** (`audio-src/`), not the root file, which has unrelated uncommitted edits.
6. **No `tap` sound where another cue already plays:** Hud Reset and Rotate (the feedback events `reset` and `rotate` sound), and buttons that open a dialog (the dialog's `open` cue sounds). Spec §3.4 listed Reset, Rotate and Pause under `tap`.
7. **Audio services are created in the `game.events 'ready'` handler**, because `game.sound` does not exist until Phaser boots. `MusicPort` itself is created at module load.
8. **Acceptance record is a new file** `docs/testing/audio/g-acceptance.md` (status `pending`), modelled on `docs/testing/motion/*-acceptance.md`, instead of editing F3's records.
9. **`SfxDriver.play` returns the sound's length in ms**, so the 6-voice limit counts real voices. The shared `AudioCue` type lives in `src/infrastructure/sfx.ts`.

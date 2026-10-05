# Audio Synthesis (GS) — Plan index

Read this file first, then follow the table in order. Each phase file is self-contained (Goal, Global Constraints, file map, TDD tasks with code). An executor needs only their phase file plus the spec.

**Spec:** `docs/superpowers/specs/2026-10-05-audio-synth-engine-design.md`

**Code folder:** `game-next/`. Task numbers run continuously across the two phases (Task 1–12), so "GS Task 6" always means one place.

## Order

| # | File | Tasks | Delivers |
|---|---|---|---|
| 1 | `2026-10-05-gs1-synth-engine.md` | 1–8 | `src/audio-synth/` engine, the eight patches, `npm run audio:author`, the Audio Lab, the README |
| 2 | `2026-10-05-gs2-wiring.md` | 9–12 | `settings.music` / `settings.sfx`, `MusicPort`, `SfxPort` over `synthSfxDriver`, audio wired into the game |

After Task 12, G2 (`2026-10-03-g2-audio-cues.md`, Tasks 10–12 in its own numbering) runs **unchanged**. It is renumbered as GS Tasks 13–15 when scheduling, but not one line of it is edited.

## Branch

Everything runs on `feat/audio-synth`, already created from `main` and merged up to `f964e13` (F1 and F2 complete). The worktree is `D:\Working\ASOL\ASOL-GAME-02-audio`; `npm ci` has run there and the baseline is green (68 files, 829 tests).

Do not rebase or rewrite pushed history — the branch is already on `origin`. The reviewer (NKhanh0908) merges.

## Why this replaces G0 and part of G1

`docs/superpowers/specs/2026-10-03-g-audio-design.md` is still the authority for **music**, cue semantics and settings. Its sample-sourcing half is superseded. Concretely:

| Old | Now |
|---|---|
| G0 Tasks 1–2 (shortlist, reviewer picks) | Deleted. GS Tasks 1–8 build the engine instead |
| G1 Task 3 (manifest of 10 assets) | GS Task 9 keeps only the two music assets |
| G1 Task 4 (ffmpeg tool, pitch probe) | Deleted. `ffmpeg-static` is never added |
| G1 Task 5 (20 processed files) | Deleted. GS Task 5 authors patches instead |
| G1 Task 6 (settings) | GS Task 9, unchanged in substance |
| G1 Task 7 (`MusicPort`, `AUDIO_TOKENS`) | GS Task 10, unchanged in substance |
| G1 Task 8 (`SfxPort`) | GS Task 11: the port is unchanged, the driver is new |
| G1 Task 9 (wiring) | GS Task 12: no SFX preload, otherwise the same |
| G2 Tasks 10–12 | Untouched |

Index departures 1, 2 and 4 of `2026-10-03-g-audio-index.md` are void. Departure 3 (two tracks sharing a key) becomes a note for the reviewer when sourcing music, not a blocker.

## Roles

| Role | Who | Work |
|---|---|---|
| Controller | Claude in the main session | Reads this index, hands out tasks in order, reviews after each task, runs phase checks, updates `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`, stops at stop points |
| Executor | One fresh subagent per task (`superpowers:subagent-driven-development`) | Exactly one task: failing test, implementation, tests, CHANGELOG entry, commit |
| Reviewer | NKhanh0908 | Listens, tunes in the Audio Lab, sources the music, approves on device |

## Stop points

1. **After Task 7 (Audio Lab).** The reviewer opens `/audiolab.html`, plays all eight cues and the pentatonic ladder, tunes what they want changed, and uses **Copy as TypeScript** to hand back the patch bodies. The controller re-authors and re-runs Task 6. No task after this runs until the reviewer says the eight sounds are good enough to wire in.
2. **Before Task 9.** The reviewer supplies the two music tracks (§17 of the spec) and states their key, or says "drone, no key". Tasks 9–12 can start without the files, but Task 12's browser check needs them.
3. **After Task 12.** Phase check and APK; the reviewer confirms on a mid-range Android phone that effects sound on every action, that the boot render stays under 100 ms, and that audio never blocks input.

A failed task, or a red test from an earlier task, stops the flow; report to the reviewer.

## GitNexus in every task

| When | Executor does | Report |
|---|---|---|
| Before editing an existing function, class or method | `impact({ target, direction: "upstream", repo: "ASOL-GAME-02" })` | Direct callers, affected flows, risk |
| Before commit | `detect_changes({ scope: "staged", repo: "ASOL-GAME-02" })` | Changed symbols match the task |
| After commit | `node .gitnexus/run.cjs analyze` from the repo root | — |

Tasks 1–8 create new files almost entirely, so most need no `impact`. Known existing symbols that later tasks touch: `SettingsDialog` (Task 9 and 12), `SceneDirector.go` / `SceneDirector.boot` (Task 12), `BackgroundScene` (Task 12), `main.ts` boot (Task 12). `SceneDirector.go` sits on every scene change — measure at the start of Task 12 and tell the reviewer if it reports HIGH or CRITICAL. If the GitNexus MCP server is unavailable, say so in that task's CHANGELOG verification bullet.

## Contracts between tasks

| Produced in | Name | Used in |
|---|---|---|
| 1 | `Rng`, `mulberry32`, `noise`, `envelope`, `osc`, `fmOsc`, `biquadCoeffs`, `applyBiquad` | 3 |
| 2 | `Patch`, `Layer`, `Source`, `Envelope`, `Filter`, `validatePatch`, `PatchIssue` | 3, 5, 6, 7 |
| 3 | `renderPatch`, `measure`, `applyNormalize`, `Measurement` | 4, 6, 7, 11 |
| 4 | `encodeWav`, `decodeWavSamples` | 6 |
| 5 | `SfxKey`, `SFX_KEYS`, `SFX_PATCHES`, `MUSIC_ROOT_HZ` | 6, 7, 11, 12 |
| 6 | `npm run audio:author`, `renderWaveformSvg`, `renderAudioReport`, files in `docs/testing/audio/` | — |
| 7 | `audiolab.html`, `src/devtools/audiolab/` | — |
| 8 | `src/audio-synth/README.md`, `presets.ts` | — |
| 9 | `Progress.settings.music`, `Progress.settings.sfx`, `setMusic`, `setSfx`, `AUDIO_ASSETS` (music only), `TrackId`, `TRACK_IDS`, `musicUrls` | 10, 12 |
| 10 | `MediaLike`, `MusicEnv`, `MusicOptions`, `MusicPort`, `createMusic`, `browserMusicEnv`, `AUDIO_TOKENS` | 11, 12, G2 |
| 11 | `AudioCue`, `SfxDriver`, `SfxEnv`, `SfxOptions`, `SfxPort`, `createSfx`, `browserSfxEnv`, `synthSfxDriver`, `renderAll` | 12, G2 |
| 12 | `AudioServices`, `AUDIO_REGISTRY_KEY`, `SILENT_AUDIO`, `audioServices(scene)`, `trackFor(scene)`, `SceneDirector.setMusic` | G2 |

The names in rows 10–12 are deliberately identical to the ones `2026-10-03-g2-audio-cues.md` consumes, which is why G2 needs no edit.

## Deviations from the spec (review before Task 1)

1. **`presets/` is a single file, not a folder.** `src/audio-synth/presets.ts` holds three generic starter patches. Mirror's eight live in `src/content/audio/sources/`, and the README points at those as worked examples. One file instead of a folder of near-duplicates.
2. **The music root is stored in hertz, not semitones.** `MUSIC_ROOT_HZ` in `src/content/audio/index.ts` replaces `MUSIC_ROOT_SEMITONE`. The bell patch needs a frequency; converting semitones to hertz at one call site only adds a step that can be got wrong. A comment records which note it is.
3. **A 3 ms fade-out is applied to every rendered patch.** Not in the spec. Without it a patch whose envelope ends above zero clicks on every play. It is unconditional and tested.
4. **`decodeWavSamples` is added to `wav.ts`** so the WAV round-trip test is real rather than a header check.

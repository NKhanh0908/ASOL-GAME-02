# Status — updated 2026-10-06 by Claude Code (VR1 and VR2 visual refactor specs drafted)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main` (merged `feat/audio-synth`). Working directory D:\Working\ASOL\ASOL-GAME-02.
- Audio Streams G and GS: officially APPROVED and COMPLETED. Dual-channel streaming music (`music-sky.mp3` & `music-stele.mp3`), procedural WebAudio synth effects, interactive pentatonic snap chimes, UI cues, and studio splash sound intro.
- Acceptance passed in `docs/testing/audio/g-acceptance.md`.
- Android & Web assets synced via Capacitor.
- Next step: reviewer reviews the VR1 and VR2 specs, then their implementation plans are written. VR3 (Gameplay) waits on the reviewer's third assessment.
- Verified: typecheck clean, 84 files / 1037 tests pass, `npm run build` clean, `npm run android:sync` clean.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete, accepted and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | complete; approved by reviewer; acceptance passed | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | complete; dual-channel music & SFX approved | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |
| VR visual refactor (VR1 → VR2 → VR3) | VR1 and VR2 specs drafted, awaiting reviewer; VR3 waits on its assessment | `docs/ai/DOCS-INDEX.md` rows VR1–VR2 |

## Open decisions / blockers

- Audio streams G & GS: complete and approved.
- VR1 and VR2 decisions are settled. VR3 is blocked until the reviewer sends the Gameplay assessment.
- VR2 defers per-chapter constellation shapes, per-chapter progress and the return-to-current button; issue #1 ("no sense of journey") is therefore only partly addressed until that deferred work happens.
- VR1 §2 decision 1 makes the code authoritative over the GDD palette, so `docs/gdd/master-gdd.md` §3.1 must be rewritten during VR1 implementation.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.

## Gotchas learned recently

- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`, ensuring tracks stream uninterrupted across level-to-level transitions and restart only when routing changes scene families.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets (`[usesuno.com]`) as wildcards — must pass `-LiteralPath`.
- `SplashScene` audio: triggers via `audioServices(this).sfx.play(...)` scheduled with `this.time.delayedCall`, falling back gracefully to `SILENT_AUDIO` if called before `ready`.
- `AUDIO_REGISTRY_KEY = 'audio'` in `game.registry`: calls before `ready` fall back to `SILENT_AUDIO` without throwing.

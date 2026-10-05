# Status — updated 2026-10-06 by Claude Code (VR0 plan ready; execute VR0 then VR1)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main` (merged `feat/audio-synth`). Working directory D:\Working\ASOL\ASOL-GAME-02.
- Audio Streams G and GS: officially APPROVED and COMPLETED. Dual-channel streaming music (`music-sky.mp3` & `music-stele.mp3`), procedural WebAudio synth effects, interactive pentatonic snap chimes, UI cues, and studio splash sound intro.
- Acceptance passed in `docs/testing/audio/g-acceptance.md`.
- Android & Web assets synced via Capacitor.
- Next step: execute `plans/2026-10-06-vr0-motion-language.md` (2 tasks), then `plans/2026-10-06-vr1-foundation-menu.md` (8 tasks). Sequential inline execution, not subagent dispatch.

## Concurrent work in progress — read before editing

Two agents are working in this checkout at the same time. Respect the split or
you will silently overwrite the other's edits, which already happened once today.

| Owner | Files |
|-------|-------|
| Executor (VR0 then VR1) | `game-next/src/`, `game-next/tests/`, `CHANGELOG.md` |
| Spec author (VR3b, VR2 plan, VR3a) | `docs/superpowers/specs/`, `docs/superpowers/plans/` — new files only |
| **Nobody until both finish** | `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md` |

`STATUS.md` and `DOCS-INDEX.md` are updated in one pass at the end by the
controller session, per the `AGENTS.md` end-of-task rule. If you need to record
something before then, put it in your `CHANGELOG.md` entry instead.

**Execution order is fixed:** VR0 must land before VR1 starts. The VR1 plan
reads `MOTION_FAMILIES`, which VR0 creates; the VR1 plan's executor notes say to
stop and run VR0 first if that export is missing.
- The gameplay assessment was decomposed into VR0 / VR3a / VR3b; VR3a and VR3b specs are written after VR0 and VR1 land.
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
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0 and VR1 spec + plan approved, ready to execute in that order; VR2 spec approved, plan deferred; VR3a/VR3b not yet written | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |

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

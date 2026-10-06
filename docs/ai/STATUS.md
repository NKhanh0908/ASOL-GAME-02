# Status — updated 2026-10-06 by Claude Code (VR0 and VR1 executed and verified)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main` (merged `feat/audio-synth`). Working directory D:\Working\ASOL\ASOL-GAME-02.
- Audio Streams G and GS: officially APPROVED and COMPLETED. Dual-channel streaming music (`music-sky.mp3` & `music-stele.mp3`), procedural WebAudio synth effects, interactive pentatonic snap chimes, UI cues, and studio splash sound intro.
- Acceptance passed in `docs/testing/audio/g-acceptance.md`.
- Android & Web assets synced via Capacitor.
- Next step: write the VR3b spec (it unblocks the VR2 plan — the victory ritual rewrites the card VR2 adds its constellation strip to), then the VR2 plan, then VR3a.


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
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0 and VR1 **done** on `main`; VR2 spec approved, plan deferred until VR3b; VR3a/VR3b not yet written | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |

## Open decisions / blockers

- Audio streams G & GS: complete and approved.
- VR2's plan is blocked on VR3b, not on a decision: the victory ritual (assessment §7) rewrites the same completion card VR2 adds its constellation strip to.
- VR2 defers per-chapter constellation shapes, per-chapter progress and the return-to-current button; issue #1 ("no sense of journey") is therefore only partly addressed until that deferred work happens.
- VR1 §2 decision 1 makes the code authoritative over the GDD palette, so `docs/gdd/master-gdd.md` §3.1 must be rewritten during VR1 implementation.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.

## Gotchas learned recently

- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`, ensuring tracks stream uninterrupted across level-to-level transitions and restart only when routing changes scene families.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets (`[usesuno.com]`) as wildcards — must pass `-LiteralPath`.
- `SplashScene` audio: triggers via `audioServices(this).sfx.play(...)` scheduled with `this.time.delayedCall`, falling back gracefully to `SILENT_AUDIO` if called before `ready`.
- `AUDIO_REGISTRY_KEY = 'audio'` in `game.registry`: calls before `ready` fall back to `SILENT_AUDIO` without throwing.

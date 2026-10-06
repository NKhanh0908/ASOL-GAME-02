# Status — updated 2026-10-06 by Claude Code (VR3b spec written)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`, clean at `015047d` before this task. Working directory D:\Working\ASOL\ASOL-GAME-02.
- VR3b spec written and committed: `docs/superpowers/specs/2026-10-06-vr3b-medallion-victory-ritual-design.md`. It owns the victory card geometry and reserves the slot VR2 fills, so **the VR2 plan is now unblocked**.
- VR2 spec amended in the same pass: VR3b dependency, reserved slot, corrected audio cue, state aligned to `approved`.
- Next step: reviewer reads the VR3b spec. Then write the VR2 plan and the VR3b plan (either order; VR3b must be executed first because VR2 depends on its card slot), then VR3a.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete and on `main`; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | complete; approved; acceptance passed | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | complete; approved | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0, VR1 **done** on `main`; VR2 approved and unblocked; **VR3b spec written, awaiting review**; VR3a not written | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 are `planned` in `manifest.ts:32-37`, so 22 of 28 levels are approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- VR3b spec is `draft` pending reviewer approval. Nothing else in the VR chain can be planned until it is read, because it sets the victory card geometry both VR2 and VR3b write to.
- Execution order within VR is now fixed by a data dependency, not a preference: VR3b before VR2.
- VR3b §7 flags one unverified pair of numbers: the Eye crossfade alphas (result 0.55, target ghost 0.35) must be checked on a real device in daylight before they are treated as final.
- Chapter 4's six levels are the remaining content work and are independent of the VR chain. They need a plan of their own; nothing blocks them today.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.

## Gotchas learned recently

- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, its bottom sits at 1274 of 1280. Anything that makes it taller must re-anchor to the bottom edge and grow upward, and must also regenerate `victory_card_frame` / `victory_card_surface`, whose sizes are hardcoded in `TextureFactory.ts:63-71`.
- `showWinModal()` is a second, timeline-free entry point to the won state (re-entering a finished level). Any screen state the victory timeline establishes — sky dim, tray fade — must be applied there too, or the two paths disagree.
- `shimmer` is not free: it is already the `overlap-revive` cue in play (`audioCues.ts:64-65`). New "magical" moments need their own patch or they collide with gameplay feedback.
- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`, so tracks stream uninterrupted across level transitions and restart only when routing changes scene families.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.
- `AUDIO_REGISTRY_KEY = 'audio'` in `game.registry`: calls before `ready` fall back to `SILENT_AUDIO` without throwing.

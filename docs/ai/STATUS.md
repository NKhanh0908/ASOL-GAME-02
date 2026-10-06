# Status — updated 2026-10-06 by Claude Code (VR1 accepted, VR3b approved, VR2 plan written)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `main`, clean at `015047d` before this task. Working directory D:\Working\ASOL\ASOL-GAME-02.
- **VR1 accepted by the reviewer** on 2026-10-06, after the two emblem defects were fixed (`1fe3818`, `015047d`).
- **VR3b spec approved** by the reviewer, but its plan is **deferred by reviewer decision** — not blocked.
- **VR2 plan written**: `docs/superpowers/plans/2026-10-06-vr2-level-select.md`, 8 tasks covering spec §3.2–§3.6. Spec §3.1 (constellation strip in the victory card) is excluded because it needs VR3b's card slot.
- Next step: execute the VR2 plan, Task 1 first. Task 3 Step 5 is a reviewer stop: if completed-node silhouettes are unreadable at 46×32, stop and report rather than enlarging the node.

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
| VR visual refactor (VR0 → VR1 → VR2 → VR3a → VR3b) | VR0 done; VR1 done and **accepted**; VR2 spec + plan ready, **not yet executed**; VR3b spec approved, plan deferred; VR3a not written | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| Chapter 4 content (Luân Chuyển) | **not started**; 4-1…4-6 are `planned` in `manifest.ts:32-37`, so 22 of 28 levels are approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- The victory card is untouched until VR3b runs, so VR2's constellation strip — the item ranked first in the original assessment — stays unbuilt. Issue #1 ("no sense of journey") is therefore addressed less than the VR2 spec assumed.
- VR3b §7 flags one unverified pair of numbers: the Eye crossfade alphas (result 0.55, target ghost 0.35) must be checked on a real device in daylight before they are treated as final.
- The VR2 plan corrects spec §3.2: a 96px diamond node allows a 46×32 silhouette box, not the "~68px" the spec estimated. Whether that still reads is a reviewer call at Task 3.
- Chapter 4's six levels are the remaining content work and are independent of the VR chain. They need a plan of their own; nothing blocks them today.
- F3: approved, not started; the reviewer performs its Android/device checks during later execution.

## Gotchas learned recently

- The victory card is **bottom-constrained**: top-anchored at `trayBounds.y - 4` with height 262, its bottom sits at 1274 of 1280. Anything that makes it taller must re-anchor to the bottom edge and grow upward, and must also regenerate `victory_card_frame` / `victory_card_surface`, whose sizes are hardcoded in `TextureFactory.ts:63-71`.
- `showWinModal()` is a second, timeline-free entry point to the won state (re-entering a finished level). Any screen state the victory timeline establishes — sky dim, tray fade — must be applied there too, or the two paths disagree.
- `shimmer` is not free: it is already the `overlap-revive` cue in play (`audioCues.ts:64-65`). New "magical" moments need their own patch or they collide with gameplay feedback.
- Music continuity: `MusicPort.setTrack` returns early when `id === wanted`, so tracks stream uninterrupted across level transitions and restart only when routing changes scene families.
- PowerShell `Copy-Item` / `Test-Path` treats square brackets as wildcards — pass `-LiteralPath`.
- `AUDIO_REGISTRY_KEY = 'audio'` in `game.registry`: calls before `ready` fall back to `SILENT_AUDIO` without throwing.

# Status — updated 2026-10-09 (GX2 galaxy themes for chapters 3–5 implemented)

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/journey-map-visuals`. Working directory D:\Working\ASOL\ASOL-GAME-02. The GX work up to `bd0c0ed` is pushed; the GX2 commits (`fcedaee` … latest) are local, not pushed.
- GX2 done (plan `docs/superpowers/plans/2026-10-09-galaxy-themes-chapters-4-6.md`, 11 tasks, then re-numbered): `Chapter` is 1–5 (5 Lăng Kính), themes for ring/cluster/prism from GalaxyKit/Menu3/Menu4, layered artwork with motion, hero emblems for the menu, a banner-only teaser band for chapter 5 on the map, dev params `?scene=menu&chapter=N` and `?scene=levelSelect&revealAll=1`.
- Mapping (matches the mockup numbering, reviewer decision 2026-10-09): 3 Luân Chuyển = ring (Menu3, the 10 existing levels), 4 Hội Tụ = cluster (Menu4, the 6 planned 4-x levels), 5 Lăng Kính = prism (no levels yet). The old interim Họa Phẩm theme is gone. `rotationEnabled` still follows the level content, so the rotation chapter is chapter 4, now named Hội Tụ.
- Verified: 97 test files / 1,179 tests, typecheck, build, and `scripts/check-galaxy-chapters.mjs` (menu heroes, layers, motion/reduced motion, every map band) all pass; menus and layers were compared side by side with the mockups.
- Chapter III menu hero: the refresh arrow and the pinwheel turn slowly and steadily (clockwise, 18 s / 26 s per lap; `RING_HERO_SPIN_MS`) to signal that pieces rotate from chapter III on; they stop under reduced motion.
- **Next step**: reviewer visual acceptance of chapters 3–5 (menu heroes and map bands), then decisions below. Not pushed or merged.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | F1 & F2 complete; F3 approved but deferred | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| GS audio synthesis (Tasks 1–12) | complete; approved; acceptance passed | `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` |
| G audio (music, cues) | complete; approved | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |
| VR visual refactor (VR0 → VR3b) | **all done**; visual-polish pass committed | `docs/ai/DOCS-INDEX.md` rows VR0–VR3b |
| GX Galaxy Themes & Spatial Zoom (I–II) | implemented; awaiting visual acceptance | `docs/superpowers/plans/2026-10-08-galaxy-themes-and-spatial-zoom.md` |
| **GX2 Galaxy themes chapters 3–5** | **implemented**; awaiting visual acceptance | `docs/superpowers/plans/2026-10-09-galaxy-themes-chapters-4-6.md` |
| E4 studio orientation + round-trip | **done**; implemented on `feat/studio-e4` | `docs/superpowers/plans/2026-10-06-e4-studio-orientation-and-roundtrip.md` |
| CH1H chapter 1 hard tail (1-7…1-9) | **plan approved; ready to execute** | `docs/superpowers/plans/2026-10-06-ch1h-chapter-1-hard-tail.md` |
| Chapter 4 content (Hội Tụ, rotation levels) | **not started**; 4-1…4-6 planned; 22 of 28 approved | `docs/superpowers/specs/2026-10-02-b-level-kit-chapters-design.md` |

## Open decisions / blockers

- **GX2 follow-ups for the reviewer**: (1) the rotation levels (4-x, `rotationEnabled: true`) now sit in chapter Hội Tụ while chapter Luân Chuyển (3) has no rotation, which contradicts the kit's "hợp với chương Xoay" — decide whether to re-home content or rename; (2) chapter V (prism) has no Menu mockup: the hero is a placeholder that duplicates the prism in the artwork; (3) chapter 3's ten nodes use the lantern-chain pattern inside the ring, GalaxyMap puts seven on the ellipse; (4) check texture memory on an Android device (about 40 MB of new SVG textures when the map loads every galaxy).
- **Spec language**: `AGENTS.md` says specs are written in English, but every older spec (B, C, D, E…) is Vietnamese. CH1H, E4 and GX2 are English. Reviewer to decide.
- Remaining content work is nine levels: chapter 4 (4-1…4-6) plus CH1H (1-7…1-9).
- VR2 §3.1 (constellation strip) is unblocked by the 48 px slot created in VR3b Task 1. F3: approved, not started.
- The LOC (multi-language) spec and its `DOCS-INDEX.md` row belong to another session and are uncommitted; leave them alone.

## Gotchas learned recently

- Visual QA: `.shots/galaxy/`; `game-next/scripts/check-galaxy-ui.mjs` (chapters 1–3 menus) and `check-galaxy-chapters.mjs` (chapters 3–5 heroes, layers, map bands) need a dev server on :5173, `PLAYWRIGHT_MODULE` (playwright-core entry point) and optional `CHROMIUM_EXECUTABLE`. The first request after starting Vite can take ~50 s. The browser profile is isolated from user progress.
- A slow dev server (10+ s per request) was caused by a stray `find /` from an earlier command; check `Get-Process find` before blaming the app.
- `docs/ai/DOCS-INDEX.md` has mixed LF/CRLF lines; edit it line-wise (`splitlines(keepends=True)`) or rows land outside the table.
- Python `open()` defaults to cp1252 on this machine: pass `encoding='utf-8'` (or set `PYTHONUTF8=1`) when editing Vietnamese text.
- User-provided `docs/ref/*.png` and `docs/screenshots/web/m3/` remain untouched.
- Full default-parallel Vitest exhausted memory; use `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`. On Windows, tinypool workers may exit unexpectedly unless run per-file or with `--pool=forks`.
- Windows sandbox Vite build: requires filesystem bypass on Windows to resolve realpath for `index.html` modules.

# Status — updated 2026-10-05 by Antigravity

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/motion-f1` (branched from `main`).
- Product state: Plan E (Level Studio) and Mobile Display Tier 0/2 + Casual visual branding on `main`. F1 Phase 1 (Tasks 1–3: easing, `TransitionTimeline`, `choreography`, `routes`, `stardust`) completed on `feat/motion-f1`.
- Next step: F1 Phase 2 (Tasks 4–6: reducedMotion persistence, `BackgroundScene`, and `SceneDirector`) in `docs/superpowers/plans/2026-10-03-f1-2-director.md`.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | complete; merged to `main` | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| BR casual branding, splash & bilingual | complete; merged to `main` | `docs/gdd/assets/` mockups |
| F motion (F1 → F2 → F3) | in progress; F1 Tasks 1–3 done on `feat/motion-f1` | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- MD: Tier 0 and Tier 2 merged to `main`. Safe-area insets are read once and cached.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 can start now; G1/G2 wait for F2.

## Gotchas learned recently

- A webfont can load perfectly and still be the wrong choice: Fredoka has no Vietnamese subset, so tone-marked vowels fell back per character and split words mid-way. Check the subset list on the Google Fonts API before adopting a face; `tests/displayFontCoverage.test.ts` now guards this.
- A full-screen overlay sized to the 720x1280 artboard leaves bright bands on tall screens. Size overlays from `designViewBounds`.
- Phaser draws text onto a canvas; setting `ctx.font` does not trigger a webfont download. Fonts must be loaded explicitly via `document.fonts.load` before creating scenes.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).

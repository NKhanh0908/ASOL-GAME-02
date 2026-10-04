# Status — updated 2026-10-04 by Claude Code

Overwrite this file at the end of every task. History lives in `CHANGELOG.md`; keep this file ≤ 60 lines.

## Now

- Branch: `feat/mobile-display-tier0` (branched from `main`, not merged).
- Product state: Plan E (Level Studio) merged to `main`. Tier 0 and Tier 2 of the mobile display work are both implemented on the current branch; 639/639 tests pass, build clean, debug APK built.
- Next step: the reviewer plays the new debug APK. Tier 0 already passed its play-test (immersive, crisp text, Cormorant), and that test is what produced the Tier 2 scope. If Tier 2 looks right on hardware, this branch merges and work returns to Plan F or Plan G.

## Streams

| Stream | State | Entry doc |
|--------|-------|-----------|
| Level system A → B → C/D → E | complete; Plan E merged to `main` | `docs/ai/DOCS-INDEX.md` rows A–E |
| MD mobile display (Tier 0 + Tier 2) | implemented, awaiting device play-test of Tier 2 | `docs/superpowers/plans/2026-10-04-mobile-display-quick-wins.md` |
| F motion (F1 → F2 → F3) | specs approved, plans ready, not started | `docs/superpowers/plans/2026-10-03-f-motion-index.md` |
| C chapter 2 + Hoa Pham | complete; all 16 levels approved and available in campaign order | `docs/superpowers/plans/2026-10-02-c-chapter-2-hoa-pham-levels.md` |
| G audio (G0 → G1 → G2) | spec approved, plans written, not started | `docs/superpowers/plans/2026-10-03-g-audio-index.md` |
| BF board-fit-by-cells | complete, merged to `main` with Plan C | `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md` |

## Open decisions / blockers

- MD: Tier 0 passed its device play-test (`docs/screenshots/mobile/m0/`). Tier 2 has not been seen on hardware yet. The APK is at `game-next/android/app/build/outputs/apk/debug/app-debug.apk`.
- MD: deferred on purpose — `TextureFactory` and `GridPainter` still bake bitmaps at design size, so buttons, icons and the grid texture stay as soft as they are today. The Tier 0 screenshots did not make this obviously wrong; revisit only if the reviewer sees it.
- MD: safe-area insets are read once and cached. In immersive mode most devices report zero, so the inset paths are covered by unit tests rather than by the play-test.
- F1 §3.3 edited after approval; F2 plans list 7 spec departures — review at F stop point 1.
- G: plans await review at G stop point 1 (9 spec departures listed in the index). G0 can start now; G1/G2 wait for F2.

## Gotchas learned recently

- A full-screen overlay sized to the 720x1280 artboard (dialog dimmers, input blockers) leaves bright bands on tall screens. Size overlays from `designViewBounds`, and centre dialog containers on the real height, not on (360, 640).
- The sky gradient's edge colour is not its first or last stop: the nebula glows are painted over it and reach past the frame. Anything that tries to match the sky at the frame boundary will show a seam.
- Phaser `autoCenter` centers the canvas with `style.marginTop`. Any flex or grid centering on the parent is applied on top of it, so the canvas ends up offset twice. Pick one; never both.
- Phaser draws text onto a canvas, and setting `ctx.font` does not trigger a webfont download. `document.fonts.ready` resolves without the font ever loading unless something explicitly calls `document.fonts.load`.
- Camera zoom makes `pointer.x/y` diverge from design coordinates. Anything hit-testing against layout must read `pointer.worldX/worldY`.
- Top-level `await` in `src/main.ts` passes typecheck but fails the esbuild step of `npm run build`.
- `rotationEnabled` is strictly tied to `chapter === 4`; studioReducer synchronizes them automatically to avoid `chapter-rotation-disabled`.
- Campaign levels are read-only references in Studio; saving them automatically guides user to clone into a new studio ID.
- Browser modules cannot import node-dependent modules (`promote.ts` importing `node:fs`); pure functions like `sourceFromDocument` live in `src/content/sourceFromDocument.ts`.
- `catalog.ts` loads studio levels only in harness mode when DEV; campaign mode strictly rejects studio levels.
- `build:release` fails by design until all 28 levels are approved (currently 22; Chapter 4 has six planned levels).

# Plan — Mobile display quick wins (Tier 0)

- **Branch:** `feat/mobile-display-tier0` (from `main`)
- **Spec:** none. Scope agreed in chat on 2026-10-04; too small for an architecture spec.
- **Goal:** the Android APK fills the screen, renders crisply, and keeps its typography offline — without touching the layout engine or `BoardRenderer`.
- **Non-goal:** redistributing the vertical layout for tall screens (that is "Tier 2"). Decide whether to do it *after* playing this build on a real device.

## Why

Screenshots from a 1080x2460 device (`docs/screenshots/mobile/`) show a large black band above the game, none below, a visible status bar, and soft text.

Root cause of the band, confirmed against `node_modules/phaser/src/scale/ScaleManager.js:1217-1239`: `autoCenter: CENTER_BOTH` centers the canvas by writing `style.marginTop`, while `#game` is a flex container with `align-items: center` that already centers the canvas' margin box. The offset is applied twice, so the canvas starts at 405px instead of 270px and runs off the bottom edge.

Blur has a separate cause: the canvas backing store is 720x1280 and is upscaled to 1080 physical pixels. `TextureFactory` and `GridPainter` additionally bake buttons, icons and the grid into bitmaps at design size, so raising the canvas resolution alone would leave them soft.

## Tasks

Each task ends with `npm test` and `npm run typecheck` passing.

### T1 — Remove the double centering

Drop the flex centering from `#game` in `game-next/src/style.css` and let Phaser own the canvas position. Keep `autoCenter: CENTER_BOTH` as the single source of truth.

**Verification:** dev server, `canvas.style.marginTop` equals `(parentHeight - canvasHeight) / 2`, and the canvas' `getBoundingClientRect().top` equals that same value.

### T2 — Immersive mode and display cutout

- `android/app/src/main/java/com/nkhanh/mirror/rebuild/MainActivity.java`: `WindowCompat.setDecorFitsSystemWindows(window, false)`; hide system bars via `WindowInsetsControllerCompat` with `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`; re-apply in `onWindowFocusChanged` so returning from background does not restore the bars.
- `android/app/src/main/res/values/styles.xml`: add `android:windowLayoutInDisplayCutoutMode = shortEdges` to `AppTheme.NoActionBar`; set the splash background to `colorPrimaryDark` to stop the white flash.
- `android/app/src/main/AndroidManifest.xml`: already locks `android:screenOrientation="portrait"`, so nothing to change.

No new Capacitor plugin. The cutout mode is set from Java rather than from the theme, because `windowLayoutInDisplayCutoutMode` needs API 27+ and a `values-v27` variant would mean duplicating the whole theme.

**Verification:** debug APK on device — no status or navigation bar, swipe from the edge brings them back transiently.

### T3 — Render at device pixel resolution

- `game-next/src/presentation/viewport.ts` (new, Phaser-free): `readViewport()` returns `{ cssWidth, cssHeight, dpr }` with `dpr` capped at 3.
- `game-next/src/main.ts`: size the game to `cssWidth * dpr` x `cssHeight * dpr` so the backing store matches physical pixels; the design coordinate space stays 720 wide via a camera zoom of `bufferWidth / 720`.
- `game-next/src/presentation/PlayScene.ts:161-181` and `LevelSelectScene.ts:405-414`: switch pointer reads from `pointer.x/y` to `pointer.worldX/worldY`. Camera zoom breaks screen-space coordinates silently, so this is the main risk in the task.
- Phaser `Text`: `designViewport.ts` wraps each scene's `add.text` factory so every label rasterises at the device scale. Wrapping the factory keeps this to one place instead of editing 41 call sites.

**Deferred, by decision on 2026-10-04:** `TextureFactory` and `GridPainter` still bake their bitmaps at design size, so buttons, icons and the grid texture are upscaled by the camera exactly as they are today — no better, no worse. Fixing them means scaling the generated canvases and compensating at all 18 image call sites, four of which are inside `BoardRenderer` (CRITICAL). Everything drawn as vectors, and all text, is now crisp. Decide at the stop point whether the remaining softness is visible on a real device.

**Verification:** new `tests/viewport.test.ts`; visual check on the APK.

### T4 — Bleed the backdrop into the letterbox

`game-next/src/presentation/SkyBackdrop.ts`: draw the gradient and star field across the full canvas rather than the 720x1280 design rect, so any residual letterbox shows sky instead of black.

**Verification:** on device, no black band at either end.

### T5 — Self-hosted fonts and the Cormorant switch

- Add `game-next/public/fonts/` with woff2 for Be Vietnam Pro (400/500/600/700) and Cormorant Garamond (600), Latin + Vietnamese subsets.
- `game-next/src/style.css`: replace the `fonts.googleapis.com` `@import` with local `@font-face` rules. The import makes the first offline launch fall back to Roboto.
- `game-next/src/main.ts`: `await document.fonts.ready` before `new Phaser.Game()`, so `Phaser.Text` does not measure against a fallback face.
- `game-next/src/presentation/designTokens.ts`: point `TYPO_TOKENS.fontFamily.serif` at Cormorant Garamond; bump `heroTitle` and `modalTitle` one step, since Cormorant is lighter than Playfair on the navy background.

**Verification:** load with the network disabled in DevTools and confirm both faces still render.


## Tier 2 — elastic vertical layout (added 2026-10-04, after the Tier 0 play-test)

The Tier 0 play-test (`docs/screenshots/mobile/m0/`) confirmed immersive mode, crisp text and the Cormorant switch. It also showed two things worth fixing and one thing Tier 0 was never going to fix.

### T6 — Remove the backdrop seam

`bleedSky` filled the overflow with the raw first and last gradient stop. That was wrong: the pink nebula at (648, 966) with radius 360 reaches y=1326, so the frame edge is never the bare stop colour, and the joint always stepped. `paintSky` now renders the gradient canvas at the real visible height with the nebulae offset by the frame origin; a canvas gradient clamps outside its endpoints, so there is no boundary left to mismatch. `bleedSky` is deleted.

### T7 — Dialog overlays cover the whole view

`SettingsDialog` and `PauseDialog` sized their dimming rectangle to 720x1280 and centred their container on (360, 640), so the overflow stayed bright on a tall screen. Both now read `designViewBounds`.

### T8 — Elastic layout

`computeLayout(designWidth, designHeight, safeArea)` distributes vertically: header below the top inset, bottom bar above the bottom inset, tray above the bar, board centred in what remains and clamped so the target badge never rides over the chapter subtitle. `Hud`, `TargetBadge`, `MenuScene` and `LevelSelectScene` anchor to it instead of to fixed offsets.

The board stays 640x800 and `cellPixel` stays 5, so grid maths, hit testing and `BoardRenderer` (CRITICAL) are untouched.

**Verification:** `tests/layoutElastic.test.ts` covers 9:16, 9:19.5 and 9:21 with and without insets. The key assertion is that the 9:16 case reproduces the original artboard exactly (board y=200, tray y=1016, bottom bar y=1164) - that is the no-regression guarantee.

## Reviewer stop point

After T5: done. The reviewer played the build and the result scoped Tier 2 (T6-T8).

After T8: build the debug APK again and hand it over. If the layout reads right on hardware, the branch merges. The open question for that pass is whether buttons, icons and the grid texture still look soft - that is the deferred `TextureFactory`/`GridPainter` work, and it is the only part of the original blur diagnosis left unaddressed.

## Blast radius

GitNexus `impact`, measured 2026-10-04:

- `computeLayout` — LOW, 1 direct dependant. Not modified by this plan.
- `BoardRenderer` — CRITICAL, 5 direct dependants, 6 flows, but all of them live inside `PlayScene.ts`. Not modified by this plan; the design width and `cellPixel = 5` are unchanged.
- `TextureFactory`, `GridPainter`, `SkyBackdrop` — leaf modules in `Presentation`, no dependants outside it.

Run `detect_changes()` before the final commit.

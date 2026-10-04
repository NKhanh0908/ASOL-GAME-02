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

## Reviewer stop point

After T5: build the debug APK, hand it to the reviewer (NKhanh0908) to play on a real device. The reviewer decides whether Tier 2 (elastic height, safe-area redistribution) is still needed. Do not start Tier 2 without that decision.

## Blast radius

GitNexus `impact`, measured 2026-10-04:

- `computeLayout` — LOW, 1 direct dependant. Not modified by this plan.
- `BoardRenderer` — CRITICAL, 5 direct dependants, 6 flows, but all of them live inside `PlayScene.ts`. Not modified by this plan; the design width and `cellPixel = 5` are unchanged.
- `TextureFactory`, `GridPainter`, `SkyBackdrop` — leaf modules in `Presentation`, no dependants outside it.

Run `detect_changes()` before the final commit.

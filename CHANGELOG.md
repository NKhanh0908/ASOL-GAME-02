# Changelog

Nhật ký này là nguồn đọc nhanh cho người phát triển và AI. Mỗi commit có thay đổi về code, tài liệu, cấu hình hoặc level phải thêm một mục vào phần `Unreleased` trước khi push. Khi tạo bản phát hành, chuyển các mục đã hoàn tất sang một phiên bản có ngày cụ thể.

## Unreleased

### 2026-10-06 - Controller pass after VR0 and VR1: verification, index, missing invariant

- Independently verified the VR0 and VR1 execution rather than accepting the executor's report: `npm test` 88 files / 1063 tests pass, `npm run typecheck` clean, `npm run build` clean in 7.02s, working tree clean. The executor's totals matched.
- Checked the three traps the plans had planted, all passed: `tests/designTokens.test.ts` was updated to the new gradient rather than "fixed" by reverting the token; the two VR0 commits touched only `transitions/motion.ts`, its tests and `CHANGELOG.md`, so the family adoption did not leak in early; and the emblem was extracted, taking `MenuScene.ts` from 941 to 846 lines.
- Added the motion vocabulary invariant to `docs/ai/ARCHITECTURE.md`, which VR0 plan Task 2 Step 7 required and the execution missed: `MOTION_FAMILIES` lives in `transitions/motion.ts`, not `designTokens.ts`, because the latter imports nothing and must stay a leaf module.
- Recorded a discrepancy worth knowing about: the executor's summary described the four motion families as "glass, celestial, snap, paper" declared "in designTokens.ts". Both halves are wrong — the code correctly declares `ui`, `glass`, `magic` and `piece` in `transitions/motion.ts`, and `designTokens.ts` does not mention `MOTION_FAMILIES` at all. The implementation followed the plan; only the report did not.
- Marked VR0 and VR1 `done` in `docs/ai/DOCS-INDEX.md` with their commit ranges, and rewrote `docs/ai/STATUS.md`: the concurrent-work ownership section is removed now that both agents have finished, and the next step is the VR3b spec, which unblocks the VR2 plan.
- Verification: commands above run from `game-next/` with their output read, not inferred.

### 2026-10-06 - Reconcile the palette table with shipped tokens and record visual invariants (VR1 Task 8)

- Updated `docs/gdd/master-gdd.md` §3.1 palette table to align with shipped tokens: navy (`#1A2470`, `#1D3482`, `#050A1A`), ice glass (`#A9E3FF`, `#CFEFFF`, `#3A5E78`), amber (`#FFC857`, `#FFD27A`, `#FFE8A6`), and documented the glow ladder governance rule.
- Added visual glow ladder invariant to `docs/ai/ARCHITECTURE.md` (`GLOW_TIERS`, single `SCREEN_FOCUS` tier-3 element, banned colors guard test).
- Verification: `npm test` (88 test files, 1063 tests pass); `npm run typecheck` clean; `npm run build` cleanly generates production bundle in `dist/`.


### 2026-10-06 - Close the settings gear outline and make the tap ripple a diamond (VR1 Task 7)

- Created `src/presentation/menu/diamondMotif.ts` exporting shared `strokeDiamond(g, x, y, radius)`.
- Updated settings gear icon in `src/presentation/TextureFactory.ts` to draw a closed 6-toothed outline with a center hole instead of radiating sun-like spokes.
- Replaced circular background tap ripple in `src/presentation/MenuScene.ts` with `strokeDiamond` motif at `glowTier(1)` (`#A9E3FF`, alpha 0.25).
- Verification: `npm test -- bannedColors` passed; `npm test` (88 files, 1063 tests pass); `npm run typecheck` clean.


### 2026-10-06 - Recolour the logo to ivory highlight and navy extrusion (VR1 Task 6)

- Recoloured "MIRROR" title face in `src/presentation/MenuScene.ts` with warm gold `#FFC857`, 1px up-left ivory highlight `#FFF4D6`, deep navy extrusion `#11204F` / `#0B163A`, and tier 0 subtle glow (`glowTier(0)`).
- Layered letter glyphs across 4 discrete text layers (highlight, face, extrusion, shadow) and unified per-letter jiggle tweens across all layers.
- Lowered reflection baseline opacity to `0.22` with midnight navy stroke `#0B163A`.
- Verification: `npm test -- bannedColors` passed (clean from banned colors); `npm test` (88 files, 1063 tests pass); `npm run typecheck` clean.


### 2026-10-06 - Adopt layout C and lift the astronomy fact caption (VR1 Task 5)

- Re-laid vertical stack in `src/presentation/MenuScene.ts` to Layout C: logo block (y≈300) → hero emblem (y≈620) → fact caption (y≈830) → primary button (y≈980) → secondary button (y≈1075) → footer (y≈1240).
- Upgraded fact caption with ◆ prefix, `#B9C9F2` high contrast colour, and `TYPO_TOKENS.fontSize.caption` size.
- Verification: `npm test` (88 files, 1063 tests pass); `npm run typecheck` clean.


### 2026-10-06 - Extract dual jewel emblem and animate the XOR rule (VR1 Task 4)

- Extracted emblem rendering to `src/presentation/menu/DualJewelEmblem.ts` consuming `dualJewelGeometry.ts` and `glowTier(1)`.
- Refactored `src/presentation/MenuScene.ts` to delegate emblem lifecycle and updates to `DualJewelEmblem`, cleaned up inline emblem drawing helpers, and wired ring speed boost on scene exit.
- Verification: `npm test` (88 files, 1063 tests pass); `npm run typecheck` clean.


### 2026-10-06 - Add real XOR overlap geometry for the dual jewel emblem (VR1 Task 3)

- Implemented pure geometry helper module `src/presentation/menu/dualJewelGeometry.ts` calculating jewel center offsets, diamond polygon outlines, Sutherland-Hodgman convex clipping overlap, star fade alpha, and reduced motion loop timing.
- Added `tests/dualJewelGeometry.test.ts` with 8 unit tests covering rest separation, positive overlap area during approach and hold, loop periodicity, star alpha timings, and frozen pose under reduced motion.
- Verification: `npm test -- tests/dualJewelGeometry.test.ts` passes (8 tests); `npm run typecheck` clean.


### 2026-10-06 - Declare four-tier glow ladder as tokens (VR1 Task 2)

- Declared `GLOW_TIERS` token table, `SCREEN_FOCUS` map, and `glowTier` helper in `src/presentation/designTokens.ts`.
- Added `tests/glowTiers.test.ts` covering tier 0 non-glowing invariant, monotonic tier blur progression, and single tier-3 element constraint per screen.
- Verification: `npm test -- glowTiers` passes; `npm run typecheck` clean.

### 2026-10-06 - Cut purple sky tail and remove banned colours (VR1 Task 1)

- Replaced purple bottom sky gradient with deep navy `['#1A2470', '#1E2A80', '#24307F', '#1B2563']` and updated `COLOR_NUMBERS.skyBottom` to `0x1b2563`.
- Replaced banned colours `#4ECDC4` and `#FFD166` in `FeedbackDirector.ts` and `stardust.ts` with tokens from amber and ice palettes.
- Added repo-wide guard `tests/bannedColors.test.ts` scanning all `.ts` files under `src/` to prevent banned colours from returning; updated `tests/designTokens.test.ts`.
- Verification: `npm test` (86 files, 1050 tests pass); `npm run typecheck` passes.

### 2026-10-06 - Declare the four motion families (VR0 Task 2)

- Declared `MOTION_FAMILIES` table and typed helper `motionFamily` in `src/presentation/transitions/motion.ts` covering `ui`, `glass`, `magic`, and `piece` families.
- Added `tests/motionFamilies.test.ts` covering the four families, ease registry membership, timing consistency with `ANIM_TOKENS`, and the frame-by-frame nature of `piece`.
- Verification: `npm test` (85 files, 1048 tests pass); `npm run typecheck` and `npm run build` clean; git diff touches no scene files.

### 2026-10-06 - Add quartOut easing for the glass family (VR0 Task 1)

- Added `quartOut` to `EaseName` union and `EASES` registry in `src/presentation/transitions/motion.ts`.
- Added tests in `tests/motion.test.ts` asserting monotonic increase and stronger deceleration than `cubicOut`.
- Verification: `npm test -- motion` passes (17 tests in motion.test.ts, 33 total in motion suite); `npm run typecheck` passes.

### 2026-10-06 - Hand VR0 and VR1 to a second agent; restore the worktree gotcha

- Recorded the concurrent-work split in `docs/ai/STATUS.md`: the executor owns `game-next/src/`, `game-next/tests/` and `CHANGELOG.md`; the spec author owns new files under `docs/superpowers/`; nobody touches `docs/ai/STATUS.md` or `docs/ai/DOCS-INDEX.md` until both finish, when the controller updates them in one pass. Two agents share this checkout and one silent overwrite of `STATUS.md` already happened today.
- Restated in STATUS that VR0 must land before VR1, since the VR1 plan reads `MOTION_FAMILIES`.
- Restored to `docs/ai/ARCHITECTURE.md` the gotcha that `detect_changes` reports 0 changed symbols when run from a git worktree. It was dropped from STATUS when the `ASOL-GAME-02-boardfit` worktree was removed earlier today and was then recorded nowhere, which would have made it a fresh surprise the next time anyone uses a worktree.
- Verification: docs only, no code touched.

### 2026-10-06 - VR0 implementation plan

- Added `docs/superpowers/plans/2026-10-06-vr0-motion-language.md`: two TDD tasks adding `quartOut` to the `EASES` registry and declaring the four `MOTION_FAMILIES`, with no call-site changes. Written for sequential inline execution at the reviewer's request.
- Corrected VR0 spec §3.2 while planning: `MOTION_FAMILIES` moves from `designTokens.ts` to `transitions/motion.ts`. `designTokens.ts` imports nothing and must stay a leaf module, so a family table there referencing `EaseName` would create an import cycle — the same trap `ARCHITECTURE.md` already records for `src/content/audio/root.ts`.
- Plan self-review caught a type error before it reached an executor: a single `MotionFamily` shape with optional `tapMs`/`standardMs` typechecks at the definition but makes `MOTION_FAMILIES.ui.tapMs` a `number | undefined` at every call site, breaking the plan's own test. Replaced with one type per family plus a generic `motionFamily<K>` that preserves the specific type.
- The plan guards its own scope: Task 2 Step 6 diffs against `HEAD~2` and instructs the executor to revert if any scene file appears, since adopting the families is VR1's work.
- Marked VR0 `approved` in `docs/ai/DOCS-INDEX.md`.
- Verification: planning only, no code touched; plan self-reviewed for spec coverage, placeholders and type consistency against the real exports of `transitions/motion.ts` and `designTokens.ts`.

### 2026-10-06 - VR0 motion language spec; VR3 assessment decomposed

- Added `docs/superpowers/specs/2026-10-06-vr0-motion-language-design.md`. The gameplay animation assessment's §8 is foundational and cross-cutting, so it is split out as VR0 and sequenced **before VR1**: four motion families (`ui`, `glass`, `magic`, `piece`) layered over the existing `EASES` registry, plus the one missing ease `quartOut`. No call site changes in VR0 itself.
- Decomposed `docs/gui/vr3/mirror-gameplay-animation-improvement.md`, which spans four subsystems rather than one screen, into VR0 (motion language), VR3a (piece feel + XOR overlap animation, §1–5) and VR3b (target medallion + victory ritual, §6–7); its §9 label note moves to VR2 because it describes a Level Select element.
- Recorded what the assessment assumes must be built but already exists: drag spring smoothing (`POSE_TAU`/`stepPose`), anchor attraction (`magnetPose`, reached through `pieceTargetPose`) and snap overshoot (`bounceScale`). The XOR overlap animation is the genuinely missing piece — `ANIM_TOKENS.duration.overlapInversionMs` is defined but no file reads it.
- Recorded three conflicts between the assessment and the code, with their resolutions, in VR0 §2.1: `backOut` has no family but eight call sites and is kept as `ui.overshoot`; UI duration splits into `tapMs` 90 and `standardMs` 200 because acknowledging a press and running a transition are different jobs; and the `piece` family keeps `POSE_TAU` exponential smoothing rather than adopting the requested damped spring, which would need velocity in the piece state and a `PieceView` rewrite for no observable gain.
- Amended `docs/superpowers/plans/2026-10-06-vr1-foundation-menu.md` to depend on VR0 and read easing from `MOTION_FAMILIES`, and added §3.5 (label ornament) to the VR2 spec.
- Verification: design-only change, no code touched. The claim that `magnetPose` was unused was wrong and was corrected by GitNexus before it reached the spec — `pieceTargetPose` calls it from inside the same file, which the first grep excluded.

### 2026-10-06 - VR1 implementation plan

- Added `docs/superpowers/plans/2026-10-06-vr1-foundation-menu.md`, eight TDD tasks implementing the VR1 spec: palette truth and a repo-wide banned-colour guard, the `GLOW_TIERS` token table, pure XOR overlap geometry, the extracted `DualJewelEmblem` renderer, layout C, the logo recolour, the settings gear and diamond ripple, and the GDD palette reconciliation.
- Plan self-review found and fixed three gaps: spec §3.4's shared ◆ draw function had no task (now Task 7 Step 0, exporting `strokeDiamond` for VR3 to reuse); spec §6's Reduced Motion requirement was only checked by eye (the advance-or-freeze decision is now the pure `nextElapsed`, covered by tests); and the ◆ snap pulse was assigned to VR1 although it is drawn by the gameplay `FeedbackDirector`, so the spec now assigns it to VR3.
- Recorded in the plan that `tests/designTokens.test.ts` asserts the old purple gradient verbatim and will fail until Task 1 updates it, so an executor does not "fix" it by reverting the token.
- Marked VR1 `approved` in `docs/ai/DOCS-INDEX.md`.
- Verification: planning only, no code touched; plan self-reviewed for spec coverage, placeholders and type consistency against the real exports of `polygonClip.ts`, `jewelGeometry.ts`, `transitions/motion.ts` and `designTokens.ts`.

### 2026-10-06 - Visual refactor VR2 spec: Level Select

- Added `docs/superpowers/specs/2026-10-06-visual-refactor-level-select-design.md`, the second of three visual refactor specs. Covers the constellation strip in the victory card, completed nodes carrying their own target silhouette, the content-frontier node, and the VR1 glow ladder applied to the map.
- Corrected four assumptions in the reviewer's assessment by reading the code, which is why the spec is cheaper than its effort estimates: the `unlocked` node state does occur but means "unlocked by progress, not yet released" (`LevelSelectScene.ts:242` with `campaign.ts:27`; manifest holds 22 approved and 6 planned of 28); auto-scroll to the current node already exists (`LevelSelectScene.ts:101-103`); per-chapter constellation shapes already have their machinery and Chapter III already uses one (`constellationLayout.ts:65`); and the completed-node thumbnail is reuse of `TargetBadge.drawTargetSilhouette`, not new work.
- Corrected the Level Select column of the VR1 glow ladder in `docs/superpowers/specs/2026-10-05-visual-refactor-foundation-menu-design.md` §3.2: the `unlocked` state moves from tier 2 to tier 0 now that its meaning is known. VR1 is still `draft`, so nothing was implemented against the old table.
- Added the VR2 row to `docs/ai/DOCS-INDEX.md`.
- Verification: design-only change, no code touched; spec self-reviewed, which surfaced the VR1 glow-tier contradiction above and an unspecified label source in §3.3, both fixed inline.

### 2026-10-05 - Visual refactor VR1 spec: shared foundation and Main Menu

- Added `docs/superpowers/specs/2026-10-05-visual-refactor-foundation-menu-design.md`, the first of three visual refactor specs. Covers the shared visual foundation (sky gradient, a four-tier glow ladder, the ◆ motif) plus the Main Menu; Level Select and Gameplay follow in VR2 and VR3 once their reviews arrive.
- Recorded the root finding behind the reviewer's eight menu issues: the `designTokens.ts` palette has drifted from the GDD v0.3.0 palette table and the two were never reconciled, so four of the eight issues share one cause. GDD v0.3.0 was published the same day (`eb40631`) but its palette table still carries the original values.
- Recorded two live uses of `#4ECDC4`, the teal the GDD bans by name, in `game-next/src/presentation/feedback/FeedbackDirector.ts:323` and `game-next/src/presentation/transitions/stardust.ts:17`, plus a stray `#FFD166` at `FeedbackDirector.ts:322`. The spec adds a guard test so the teal cannot return a third time.
- Identified the unexplained "small star ring" on the menu orbit (reviewer issue #4) as the tap ripple at `MenuScene.ts:663-665`, not a feature.
- Reviewer decisions captured in spec §2: cut the purple while keeping current brightness; animate the full XOR overlap on the hero, accepting the Chapter 2 spoiler; layout option C; freeze the hero at its overlapped pose under Reduced Motion.
- Added the VR1 row to `docs/ai/DOCS-INDEX.md`.
- Verification: design-only change, no code touched; spec self-reviewed for placeholders, internal consistency, scope and ambiguity, which surfaced a missing GDD palette-table update in §5 and an underspecified `GLOW_TIERS` shape in §3.2, both fixed inline.

### 2026-10-05 - Audio acceptance passed: complete G and GS audio streams

- Reviewer approved the audio experience across web and Android: dual-channel streaming background music (`music-sky` Starlit Night Sky & `music-stele` Meditative Silence), interactive pentatonic snap chimes, victory stinger, UI sound cues, and procedural studio splash intro.
- Signed off all 14 criteria in `docs/testing/audio/g-acceptance.md` as passed.
- Marked Audio streams G and GS as `done` in `docs/ai/DOCS-INDEX.md` and `docs/ai/STATUS.md`.
- Verification: 84 test files / 1037 tests passed; `npm run typecheck` clean; `npm run build` clean; `npm run android:sync` clean.

### 2026-10-05 - Integrate Meditative Silence music track for gameplay scene

- Sourced `meditative-silence [usesuno.com].mp3` (3m58s duration) and placed it into `game-next/public/audio/music-stele.mp3`.
- Updated `game-next/src/infrastructure/audioManifest.ts` with metadata for `music-stele` ("Meditative Silence").
- Verified continuous playback on `next-level` route: existing `MusicPort` architecture returns early when `id === wanted`, keeping gameplay music running seamlessly across levels without rewind, resetting only when exiting to menu or map.
- Synced audio assets to Capacitor Android project.
- Verification: 84 test files / 1037 tests passed; `npm run typecheck` clean; `npm run build` clean; `npm run android:sync` clean; GitNexus `detect_changes` confirms only `audioManifest.ts` touched.

### 2026-10-05 - Integrate Starlit Night Sky music track for menu and map scenes

- Sourced `starlit-night-sky [usesuno.com].mp3` (3m49s duration) and placed it into `game-next/public/audio/music-sky.mp3` and temporary placeholder `music-stele.mp3`.
- Updated `game-next/src/infrastructure/audioManifest.ts` with metadata for `music-sky` and `music-stele`.
- Updated `game-next/tests/audioManifest.test.ts` restoring the full source validation check (`every source is allowed and linked`), matching mp3 URLs; 84 test files / 1037 tests pass.
- Synced audio assets to Capacitor Android project (`game-next/android/app/src/main/assets/public/audio/`).
- Verification: 84 test files / 1037 tests passed; `npm run typecheck` clean; `npm run build` clean; `npm run android:sync` clean; GitNexus `detect_changes` confirms only `audioManifest.ts` and `audioManifest.test.ts` touched.

### 2026-10-05 - Add synchronized audio and refine pacing for studio splash screen

- Extended `SplashScene` intro sequence pacing: slowed down the light sweep duration from 800 ms to 1600 ms, increased overall screen presence to ~5.8 s, and added early tap-to-skip support routing to `MenuScene`.
- Added synchronized procedural WebAudio sound cues across the splash sequence:
  - Rising delicate `tick` cues (`rate` 1.0..1.56) corresponding to each origami facet blossoming into place.
  - Soft `swish` cue on mirror bar slide expansion.
  - Celestial `shimmer` cue when the light sweep starts, followed by a resonant crystalline `bell` chime (`rate` 2.0) when light hits the mirror bar's center gem.
- Synced build assets to Capacitor Android project.
- Verification: 84 test files / 1036 tests passed; `npm run typecheck` clean; `npm run build` clean; `npm run android:sync` clean; GitNexus `detect_changes` confirms only `SplashScene.ts` touched.

### 2026-10-05 - Repository cleanup: merged branches, stale worktree, build leftovers

- Deleted 21 merged remote branches from `origin` (all verified merged into `origin/main`): `docs/level-system-specs`, `feat/campaign-task-1..5`, `feat/chapter-1-levels`, `feat/chapter-2-hoa-pham`, `feat/gui-improve-v1`, `feat/level-kit-chapters`, `feat/mirror-prototype`, `feat/rebuild-m0` + its 5 task branches, `feat/rebuild-m1`, `feat/shapes-v2`, `feat/ui-redesign-divination-disc`, `fix/board-fit-by-cells`. Kept `origin/main` and `origin/feat/audio-synth` (still needed for GS Task 9b).
- Deleted the matching 25 local branches with `git branch -d`, which refuses anything unmerged. Only `main` and `feat/audio-synth` remain locally.
- Removed the stale git worktree at `D:/Working/ASOL/ASOL-GAME-02-boardfit` (branch `fix/board-fit-by-cells`, already merged); its working tree was clean. This also removes the `detect_changes`-from-a-worktree trap recorded in STATUS gotchas.
- Deleted untracked build and scratch leftovers (~67 MB): `.shots/`, `game/dist`, `game/node_modules`, `game-next/dist`, `game-next/android/app/build`, and `.github/modernize/java-upgrade/` (a leftover GitHub Java-upgrade tool with no relevance to this TypeScript project; it self-ignored via `**/*`, so it had never been tracked).
- Rebuilt the GitNexus index: an incremental `analyze` failed with `FTS index 'file_fts' is inconsistent`, so the index was dropped (`gitnexus clean --force`) and rebuilt in full. The rebuild raised the graph from 5042 symbols / 12955 relationships to 5524 / 13963, meaning the corrupted index had been silently under-reporting. Recorded the recovery steps and the `clean` deletes `run.cjs` trap in `docs/ai/ARCHITECTURE.md` under a new "GitNexus index" section.
- Verification: `git branch -r --no-merged origin/main` empty before deletion, confirming no unmerged work was lost; `git status` clean and no tracked file changed by the deletions; `git worktree list` shows only the main checkout; GitNexus re-indexed from the main checkout.

### 2026-10-05 - Commit missing Capacitor haptics Android wiring

- Committed the generated Capacitor sync output that was left uncommitted when `@capacitor/haptics` was added: `game-next/android/capacitor.settings.gradle` now includes the `:capacitor-haptics` project and `game-next/android/app/capacitor.build.gradle` declares it as a dependency. Without these, a fresh clone could not assemble the Android app with haptics support.
- Added `/.superpowers/` to `.gitignore` (agent scratch patches and SDD working copies must not be tracked).
- Verification: `npm test` 84 files / 1036 tests pass; GitNexus `detect_changes` reports 0 changed symbols, risk low (build config only, no TypeScript touched); `git status` clean after commit.

### 2026-10-05 - Localize level titles, chapter labels, and HUD controls in English

- Localized HUD title and subtitle in `game-next/src/presentation/Hud.ts`: level title translates dynamically via `getLevelTitle(levelId, rawTitle)` (e.g. "Twin Stars"), and subtitle displays localized chapter and level prefixes (`Chapter I · Level 1-1`).
- Localized bottom HUD action buttons in `game-next/src/presentation/Hud.ts`: "Đặt lại" -> `Reset` (`btn_reset`), "Xoay" -> `Rotate` (`btn_rotate`).
- Localized chapter banners in `game-next/src/presentation/LevelSelectScene.ts`: replaced static `chapterLabel` with `getChapterLabel(band.chapter)` supporting English ("Chapter I · Genesis", "Chapter II · Intersections", "Chapter III · Pictures", "Chapter IV · Rotations").
- Localized constellation locked / in-polish toasts in `game-next/src/presentation/LevelSelectScene.ts`: `toast_level_locked` ("Level {id} is locked") and `toast_level_polishing` ("Level {id} is being polished").
- Added chapter translations (`CHAPTER_NAMES`, `getChapterName`, `getChapterLabel`) and new UI tokens to `game-next/src/presentation/i18n.ts`.
- Added unit tests in `game-next/tests/i18n.test.ts` verifying chapter labels, HUD buttons, and toasts in both `vi` and `en` locales.
- Verification: 84 test files / 1036 tests pass; `npm run typecheck` clean; `npm run build` clean; `npm run android:sync` synced; `assembleDebug` built APK at `game-next/android/app/build/outputs/apk/debug/app-debug.apk`; GitNexus `detect_changes` verified.

### 2026-10-05 - Rename Android app to Mirror

- Updated `appName` in `game-next/capacitor.config.ts` and `strings.xml` (`app_name`, `title_activity_main`) from "Mirror Rebuild" to "Mirror".
- Re-synced Capacitor assets and verified debug APK assembly (`assembleDebug`).

### 2026-10-05 - Update master game design document for v0.3.0

- Updated `docs/gdd/master-gdd.md` to version 0.3.0 reflecting current architecture and production state:
  - Documented the WebAudio Synth Engine (8 DSP patches, zero sample files), interactive pentatonic scale chime on snap (`C5` to `C6`), victory C-major arpeggio stinger, and dual-channel streaming music architecture.
  - Documented the Elastic Vertical Layout and safe-area scaling for 16:9 to 21:9 devices.
  - Updated typography to Baloo 2 (display) and Be Vietnam Pro (UI), and recorded casual branding with 20 rotating astronomy taglines.
  - Recorded campaign status: 22 levels approved across Chapter 1 (1-1..1-6), Chapter 2 (2-1..2-6), and Chapter 3 (3-1..3-10), with proven unique XOR solutions.
- Verification: document structure validated; markdown links and math blocks checked; git diff verified.

### 2026-10-05 - Merge audio synthesis and sound cues into main

- Merged `feat/audio-synth` into `main` at `7c28b64`.
- Incorporates the code-synthesized WebAudio SFX engine (GS Tasks 1–8, 10–12), streaming music port, settings toggles (GS Task 9a), astronomy menu taglines, and full gameplay & UI sound cues (G2 Tasks 10–12).
- Verification: 84 files / 1026 tests green; `npm run build` clean; `content:validate` passes 22 authored levels; branch `feat/audio-synth` preserved for music tracks (Task 9b).

### 2026-10-05 - Play feedback, victory and UI sound cues (G2 tasks 10–12)

- Added `game-next/src/presentation/feedback/audioCues.ts` mapping gameplay feedback events to synthesized sound cues: pentatonic rising chime on snap based on board snap count (`PENTATONIC_STEPS`: C5, D5, E5, G5, A5, C6), soft tap on piece settle, swish on return/reset, and soft ticks on lift and rotate. `playVictoryAudio` sequences the 4-step C major arpeggio victory stinger (C5, E5, G5, C6) with 90 ms intervals.
- Wired `FeedbackDirector` (`game-next/src/presentation/feedback/FeedbackDirector.ts`) to accept `AudioServices` in `FeedbackDeps` and trigger `playFeedbackAudio` upon events and `playVictoryAudio` at victory burst. `PlayScene` injects `audioServices(this)`.
- Added `game-next/src/presentation/audio/uiCues.ts` (`uiCue`, `playUiCue`) and wired interactive sound cues across all UI surfaces:
  - `MenuScene.ts`: button taps on play and settings.
  - `LevelSelectScene.ts`: back button tap, constellation node selection tap, and locked level feedback.
  - `Hud.ts`: target preview toggle and level navigation buttons.
  - `PauseDialog.ts` & `SettingsDialog.ts`: modal open/close cues and setting toggle tap.
- Added acceptance test checklist in `docs/testing/audio/g-acceptance.md` covering all 14 sound criteria (A-01 to A-14).
- Verification: unit tests in `tests/audioCues.test.ts` (20 tests) and `tests/uiCues.test.ts` (2 tests) pass; full suite green (84 files / 1026 tests); `npm run typecheck` clean; `npm run build` clean; `npm run content:validate` 22 levels pass; GitNexus `detect_changes` verified on all touched presentation symbols.

### 2026-10-05 - Wire synthesized audio into the game (GS task 12)

- Added `game-next/src/presentation/audio/audioServices.ts` (`AUDIO_REGISTRY_KEY`, `SILENT_AUDIO`, `audioServices`) and `tracks.ts` (`trackFor`).
- `game-next/src/main.ts` renders the eight effect patches into `AudioBuffer`s inside the Phaser `ready` handler, builds `SfxPort` over `synthSfxDriver`, applies the saved settings and registers both ports; a failed render falls back to silent services so audio can never stop the game booting.
- `game-next/src/presentation/transitions/SceneDirector.ts` requests `trackFor(scene)` on every route and on boot; `game-next/src/presentation/SettingsDialog.ts` gains the "Nhạc nền" and "Hiệu ứng âm thanh" toggles. `BackgroundScene` is untouched — there is nothing to preload.
- Verification: `tests/audioServices.test.ts` and two new `tests/sceneDirector.test.ts` cases failed first, then passed; `npm run typecheck`, `npm test` (82 files / 1004 tests), `npm run content:validate` and `npm run build` passed; `dist/audio/` holds only the music files and `dist/` has no Audio Lab. Android debug APK built cleanly (`assembleDebug`). GitNexus `impact` on `SceneDirector` (MEDIUM, 6 callers) and `SettingsDialog` (LOW, 2 direct callers) reported before editing; `detect_changes` on the staged set.

### 2026-10-05 - SfxPort over the synth engine (GS task 11)

- Added `game-next/src/infrastructure/sfx.ts` (pure `SfxPort` with the 6-voice limit and repeat guard, from the G1 plan; `SfxKey` now imported from `content/audio/index.ts`) and `browserSfxEnv` in `game-next/src/infrastructure/browserAudioEnv.ts`. The old plan's `phaserSfxDriver` was not built.
- Added `game-next/src/audio-synth/webaudio.ts` (`toAudioBuffer`, generic `renderAll`) and `game-next/src/infrastructure/synthSfxDriver.ts`, which implements the same `SfxDriver` interface a file-backed driver would, so the port is untouched.
- Verification: `tests/sfx.test.ts` (8) and `tests/synthSfxDriver.test.ts` (6) failed first (module not found), then passed; `tests/audioSynthPortable.test.ts` still green (4), so the engine folder has no outside imports. `npm run typecheck` clean; `npm test` 81 files / 999 tests passed (baseline 79 / 985); `npm run build` clean. GitNexus `detect_changes` on the staged set recorded in the task report.

### 2026-10-05 - Add streaming music port (G task 7)

- Added `MusicPort` (`game-next/src/infrastructure/music.ts`): two alternating `HTMLAudioElement`s with ramped crossfades, duck/hold/restore, settings toggle that pauses but keeps the track, lifecycle pause/resume, visibility handling, autoplay-block recovery on first gesture, warn-once errors. It is pure: every DOM touch goes through the injected `MusicEnv`. Browser wiring (`browserMusicEnv`) is in `game-next/src/infrastructure/browserAudioEnv.ts`.
- Added `AUDIO_TOKENS` to `game-next/src/presentation/designTokens.ts` (including the per-cue volumes the cue table will read) and a test in `game-next/tests/designTokens.test.ts`.
- `MusicOptions.files` is meant to be wired to `musicUrls` from `audioManifest.ts` by the later wiring task; the port itself does not import it. The music files are not in `public/audio/` yet.
- Verification: `tests/music.test.ts` failed first (module not found) and the new token test failed (`AUDIO_TOKENS` undefined), then both passed (14 + 1 new tests); `npm run typecheck` clean; `npm test` 79 files / 985 tests passed (baseline 78 / 970); `npm run build` clean. GitNexus `impact` on `designTokens` found no symbol (stale index; change only adds a new const); `detect_changes` output recorded in the commit report.

### 2026-10-05 - Rotate astronomy taglines on the menu subtitle

- Replaced the fixed `menu_subtitle` key in `game-next/src/presentation/i18n.ts` with `MENU_TAGLINES` (20 short astronomy facts per locale) and `getRandomMenuTagline()`, which draws one line for the locale in use.
- `game-next/src/presentation/MenuScene.ts` now renders that random line under the logo, centred and wrapped at 620 px so a longer fact still fits the 720 px design width. The menu is rebuilt on entry and on every VI/EN toggle, so the fact changes each time.
- Reworded `version_footer`: `Mirror v0.2.1 · Nơi các vì sao hội tụ` (vi) and `Mirror v0.2.1 · Where The Stars Gather` (en), replacing the "Android preview" wording.
- Extended `game-next/tests/displayFontCoverage.test.ts` to assert the display font covers every tagline — a random subtitle with a missing glyph would otherwise only show up on a real device.
- Developed on `feat/menu-astronomy-taglines` off `main` (`6b1ba5b`) and merged into `feat/audio-synth` at the reviewer's request so both can be reviewed together. The merge conflicted only in `CHANGELOG.md` and `docs/ai/STATUS.md`; no source file overlaps the GS stream.
- Verification: on the feature branch, `npm run typecheck` clean, `npm test` 68 files / 867 tests (829 on `main`, plus 40 new tagline cases, minus the 2 dropped `menu_subtitle` cases), `npm run build` clean. Re-verified on the merged tree: typecheck clean, `npm test` 78 files / 970 tests (932 on `feat/audio-synth`, same +40/−2), `npm run build` clean, `content:validate` 22 levels pass. GitNexus MCP failed to connect this session (CONNECT_TIMEOUT), so `impact` and `detect_changes` could not be run.

### 2026-10-05 - Music manifest and the music/sfx settings (GS task 9a)

- Added `game-next/src/infrastructure/audioManifest.ts` listing only the two reviewer-sourced tracks (`TrackId`, `TRACK_IDS`, `AudioLicense`, `AUDIO_LICENSES`, `MusicAsset`, `MUSIC_ASSETS`, `musicUrls`); sound effects have no entry because they are synthesized. The music `source` title, author and url are blank and the licence is a placeholder: the metadata is deferred to Task 9b, when the reviewer supplies the tracks. The test asserting sources are allowed and linked is omitted until then and lands in Task 9b.
- Added `Progress.settings.music` and `Progress.settings.sfx` (default `true`) with `setMusic` / `setSfx` in `game-next/src/application/progressPort.ts` and `game-next/src/infrastructure/progressRepository.ts`, following the existing `haptics` path. No schema version bump; legacy saves read `true` without being marked recovered.
- `game-next/tests/audioManifest.test.ts` (new) and `game-next/tests/progress.test.ts` (three new cases; two older exact-match settings expectations widened with `music: true, sfx: true`).
- Verification: new tests failed first (manifest unresolved, 3 settings cases on `undefined`), then passed. `npm run typecheck` clean; full `npm test` 78 files / 932 tests green (baseline 77 / 926); `npm run build` clean. GitNexus `impact` on `createProgressRepository` reported HIGH (4 direct callers) before editing; `detect_changes` run on the staged set.

### 2026-10-05 - Apply the GS1 final-review fixes

- `game-next/tests/audioSynthPortable.test.ts`: the portability guard now walks `src/audio-synth/` recursively and catches `from`, bare `import`, dynamic `import()`, `require()` and `export ... from` in any quote style, and rejects any path containing a `..` segment. A self-test covers each form.
- `game-next/src/audio-synth/patch.ts`: `validatePatch` rejects an `fm` source whose modulator (`carrierHz * ratio`) is above Nyquist, reported at `layers[i].source.ratio`. Test in `tests/audioPatchValidate.test.ts`.
- `game-next/src/audio-synth/normalize.ts`: `applyNormalize` returns a zero-filled copy for silence instead of the caller's array. Test in `tests/audioRender.test.ts`.
- `game-next/tests/audioPatches.test.ts`: the finiteness check scans for the first non-finite index and asserts once, instead of one `expect` per sample (about 12 s down to 0.5 s).
- Docs: `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md` now show GS1 complete and GS2 next; the design spec's patch table (section 10) matches the shipped `bell` and `tick`; `docs/ai/ARCHITECTURE.md` gains an "Audio synthesis" section.
- Verification: `npm run typecheck` clean. The portability test failed on a deliberately added `import { readFileSync } from 'node:fs';` in `src/audio-synth/report.ts` (`report.ts -> node:fs`) and passed once it was removed. `npx vitest run`: 77 files / 926 tests green, duration 42.8 s before and 20.7 s after (patch finiteness test 12.1 s to 0.5 s). `npm run build` clean; `npm run content:validate` all 22 levels pass.

### 2026-10-05 - Audio engine README and presets (GS task 8)

- Added `game-next/src/audio-synth/README.md`, the onboarding document that travels with the folder: a runnable "hello bell", the five concepts with the reasoning behind each, the real render order (fade-out before normalize, final sample exactly zero), the rms hard-limit caveat (per-sample clamp to 0.99, so spiky material delivers less rms than requested), the Audio Lab "Copy as TypeScript" gotcha (re-link `MUSIC_ROOT_HZ` expressions after pasting), a per-family tuning table, a porting guide, and what the engine does not do.
- Added `game-next/src/audio-synth/presets.ts` with `clickPreset`, `bellPreset` and `whooshPreset`. The bell uses the approved crystal shape (ratio 3, index 2.5, 110 ms index decay), not the harsher ratio 3.5 / index 6 starting point.
- Added `game-next/tests/audioSynthPortable.test.ts`.
- Verification: `tests/audioSynthPortable.test.ts` failed first (cannot resolve `presets.ts`), then passed (3 tests); it fails if any file in `src/audio-synth/` imports from outside the folder. `npm run typecheck` clean, `npm test` 77 files / 923 tests passed (baseline 76 / 920), `npm run build` and `npm run content:validate` (22 levels) passed. GitNexus `detect_changes` on the staged set (index stale, reports 0 symbols).

### 2026-10-05 - Reviewer's tuning of bell and tick (GS stop point 1 passed)

The reviewer tuned the two sounds they had asked for in the Audio Lab and pasted the results back. Stop point 1 is cleared; Task 8 may proceed.

- `game-next/src/content/audio/sources/bell.ts`: FM ratio 3, index 2.5, index decay 110 ms, 6.5 kHz lowpass, 5 ms attack, peak 0.32 (down from 0.78).
- `game-next/src/content/audio/sources/tick.ts`: FM ratio 1.3, index 2.1, index decay 7 ms, 4897.5 Hz lowpass, 0 ms attack, peak 0.35.
- Both files keep `carrierHz` as `MUSIC_ROOT_HZ * 2` and `* 4` instead of the literal 587.32 and 1174.64 that the Lab's Copy as TypeScript emits. The numbers are identical, but the expression preserves spec section 9's invariant: the pitched effects follow the music's key by construction, so changing `MUSIC_ROOT_HZ` later retunes them instead of leaving them behind in D. The Lab's serializer inlines the value because it stringifies the evaluated patch; that is noted as a known gap rather than fixed, since a human re-links it in seconds.
- Regenerated `docs/testing/audio/` with `npm run audio:author -- --all`.
- Verification: `npm run typecheck` clean; `npm test` 76 files / 920 tests passing; `audio:author` reports all 8 within their length limits. Sound quality is the reviewer's judgement, confirmed by ear in the Audio Lab.

### 2026-10-05 - Retune the sound effects after the first listening pass (GS stop point 1)

The reviewer found the set harsh overall, wanted the clicks gentler, and wanted the lift and drop sounds clearer.

- `game-next/src/content/audio/sources/tick.ts`: rebuilt. It was a white-noise burst highpassed at 6 kHz, which is a hiss and the harshest way to make a tick, and it carried no pitch. It is now a low-index FM ping two octaves above the music root (ratio 2.7, index 1.2) behind a 5.2 kHz lowpass, with a 4 ms attack and peak 0.32 instead of 0.5. It is the most-heard sound in the game — lift, rotate and every UI press — and being in key it now blends with the music instead of cutting across it.
- `game-next/src/content/audio/sources/bell.ts`: the snap sound. Ratio 3.5 to 3 and index 6 to 2.5, so the partials sit on the harmonic series and there are far fewer of them — struck crystal rather than clanging metal. Index decay 180 to 110 ms, attack 2 to 5 ms, a new 6.5 kHz lowpass, peak 0.9 to 0.78.
- Softened across the set: `tapSoft` lowpass 900 to 750 Hz and attack 3 to 6 ms; `thud` attack 2 to 4 ms with its noise layer at gain 0.28 and 320 Hz; `shimmer` partials moved down from 8x/10x/12x to 6x/8x/10x of the root with attacks roughly doubled; `swish` sweep starting at 2.8 kHz instead of 4 kHz. Every peak target came down. `hollow` was already a slow airy swell and is unchanged.
- Regenerated `docs/testing/audio/` with `npm run audio:author -- --all`.
- Verification: `npm run typecheck` clean; `npm test` 76 files / 920 tests passing, including the sound brief's length limits with `tick` now at 130 ms against its 150 ms cap; `audio:author` reported no key over its limit. These are principled DSP changes — less high-frequency content, slower attacks, lower modulation index — and the reviewer judges the result by ear, since no agent can hear it.

### 2026-10-05 - GS Tasks 1-7 complete: synth engine, patches and Audio Lab

Controller wrap-up at reviewer stop point 1. The per-task changes are in the seven entries below; this entry records the gate.

- Status: GS Tasks 1-7 are implemented, reviewed and committed on `feat/audio-synth`. `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md` updated to say the stream is waiting on the reviewer's listening pass in the Audio Lab.
- Execution note: a prior agent completed Task 1 and crashed mid-Task-2; its unreviewed work-in-progress was set aside rather than adopted and Task 2 was redone from the brief under a red-test gate. Its preflight rulings were reviewed and kept — one of them corrected a genuinely weak summing test in the Task 3 brief.
- Two review rounds caught defects worth naming: a seed-stride test that passed even with `SEED_STRIDE = 0`, and an Audio Lab that could show one cue's render and patch body under another cue's name, which would have had the reviewer copy the wrong sound. Both were my plan's defects, not the implementers'.
- Verification: `npm run typecheck` clean; `npm test` 76 files / 920 tests passing; `npm run build` clean with `grep -rl audiolab dist/` finding nothing; `npm run content:validate` 22 levels pass. Re-running `npm run audio:author -- --all` leaves `git status` empty, so the committed listening copies in `docs/testing/audio/` are byte-identical to a fresh render. GitNexus `detect_changes` ran on every task but reports 0 symbols for all of them: its index lives at the main checkout, not this worktree, so it is not evidence here and the repo needs re-indexing after merge.

### 2026-10-05 - Audio Lab fix round 1 (GS task 7)

- `game-next/src/devtools/audiolab/guard.ts`: added `ViewMemory` (last good render kept per cue) and `sliderLabel`. `main.ts` now paints a cue's own last good render, or a blank canvas/stats/textarea, when its patch is invalid, so a stale render from another cue can never sit under the selected cue (Copy could have handed out the wrong patch body). Slider captions show the full path (`layers[2].source.carrierHz = 880`); `audiolab.html` stacks caption above slider to fit.
- Verification: new `ViewMemory` and `sliderLabel` tests failed first (5 failures, `ViewMemory is not a constructor`), then passed; `tests/audiolabGuard.test.ts` 9 tests, serialize 6. `npm run typecheck` clean; `npm test` 76 files / 920 tests green. Headless Chrome A-invalid, B, back-to-A walk shows A's own render and patch body each time. GitNexus `detect_changes` returns 0 symbols (index at another checkout).

### 2026-10-05 - Audio Lab for tuning sound effects (GS task 7)

- Added `game-next/audiolab.html` and `game-next/src/devtools/audiolab/` (`serialize.ts`, `guard.ts`, `main.ts`): a dev-only page that plays every patch through the same renderer the game uses, generates a slider per numeric field, draws the waveform with peak/rms/render-time, plays the G2 pentatonic ladder on the bell (8 steps, -5 to +12 semitones, so 17 semitones wide; only the last step is an octave over the root), and copies the tuned patch out as TypeScript.
- `guard.ts` (`tryRender`, `formatIssues`) validates before rendering, so a slider dragged out of range (zero duration, cutoff above Nyquist) shows the issues under the waveform and keeps the last good render instead of throwing; the message clears when the value is valid again.
- The page is not listed in `vite.config.ts` build input, following `studio.html`, so production ships none of it.
- Verification: `tests/audiolabSerialize.test.ts` and `tests/audiolabGuard.test.ts` failed first (cannot resolve the modules), then passed (10 tests), including a JSON round trip proving a copied patch is still valid. Headless Chrome check of the page: all eight cues start playback, slider input redraws and release replays, the ladder starts eight sources, reset restores the shipped patch, an invalid slider value shows the message. `npm run typecheck` clean; `npm test` 76 files / 915 tests green; `npm run build` then `grep -rl audiolab dist/` found nothing. GitNexus `detect_changes` on the staged set returned 0 symbols (index is at another checkout).

### 2026-10-05 - audio:author renders listening copies (GS task 6)

- Added `game-next/src/audio-synth/report.ts` (`renderWaveformSvg`, `renderAudioReport`) and `game-next/scripts/audio-author.ts`, plus the `audio:author` script in `game-next/package.json`. Running it writes `docs/testing/audio/<key>.wav`, `<key>.svg` and `report.md`, and exits non-zero if a patch is invalid or longer than the brief allows.
- The report shows the configured pitch read from each patch; nothing estimates pitch, because the patches set it.
- `game-next/tests/wav.test.ts` header test now also asserts byte rate (offset 28, 44100 * 2) and block align (offset 32, 2), the fields a real media player reads.
- Verification: `tests/audioReport.test.ts` failed first (cannot resolve `report.ts`), then passed (6 tests); `tests/wav.test.ts` 4 tests pass with the two new assertions. `npm run audio:author -- --all` wrote 17 files with no key over its limit (exit 0); `npm run audio:author -- nope` exited 1. `bell.wav` is 123524 bytes = 44 + 61740 samples * 2 (1400 ms at 44100 Hz). GitNexus `detect_changes` on the staged set returned 0 symbols (index is at another checkout).

### 2026-10-05 - Mirror's eight sound effects as patches (GS task 5)

- Added `game-next/src/content/audio/index.ts` (`SfxKey`, `SFX_KEYS`, `SFX_PATCHES`, `MUSIC_ROOT_HZ` = 293.66 Hz / D4, re-exported from `game-next/src/content/audio/root.ts`) and the eight patches under `game-next/src/content/audio/sources/`: `bell` (FM ratio 3.5 on the root's octave), `tick`, `tapSoft`, `thud`, `hollow`, `shimmer`, `swish` and `stingerWin` (four bell voices resolving on the octave).
- The bell is built from `MUSIC_ROOT_HZ`, so it is in the music's key by construction; nothing measures pitch. The constant lives in its own leaf file so the patches never import `index.ts` (no import cycle).
- Verification: `tests/audioPatches.test.ts` failed first (cannot resolve `src/content/audio/index.ts`), then passed (7 tests). The sound brief's length table from spec G section 3.2 is now an assertion, alongside validity, audibility, finiteness and byte-identical repeat renders. `npm run typecheck` clean; full `npm test` 73 files / 899 tests green. GitNexus `detect_changes` on the staged set returned 0 symbols (index is at another checkout).

### 2026-10-05 - WAV encoder for audio review artifacts (GS task 4)

- Added `game-next/src/audio-synth/wav.ts`: `encodeWav` writes 16-bit PCM mono with a correct RIFF header and clamps out-of-range samples; `decodeWavSamples` reads it back so the round trip is testable rather than header-deep.
- Verification: `tests/wav.test.ts` failed first (cannot resolve `wav.ts`), then passed (4 tests) checking every header field, clamping, a 512-sample sine round trip within 16-bit precision, and the empty buffer. `npm run typecheck` clean; `npm test` 72 files / 892 tests passed. GitNexus `detect_changes` on the staged set.

### 2026-10-05 - Audio patch renderer (GS task 3)

- Added `game-next/src/audio-synth/normalize.ts` (`measure`, `applyNormalize`) and `game-next/src/audio-synth/render.ts` (`renderPatch`, `FADE_OUT_MS = 3`). Each layer is built, filtered, shaped by its envelope, scaled by gain and summed at its `startMs`; the mix is then faded out and normalized.
- An `rms` target applies the exact rms scale and hard-limits each sample to +/-0.99 instead of lowering the scale; a `peak` target scales the loudest sample onto the target.
- The 3 ms fade runs before normalization, so a peak inside the fade window still hits its target, and the last sample is exactly 0.
- Each layer draws from its own seeded PRNG stream, so adding a layer leaves earlier layers byte-identical.
- Added `game-next/tests/audioRender.test.ts`.
- Verification: `tests/audioRender.test.ts` failed first (cannot resolve `normalize.ts`), then passed (25 tests), including distinguishable-layer summing and gain tests. `npm run typecheck` clean; `npm test` 71 files / 888 tests passed. GitNexus `detect_changes` on the staged set returned 0 changed symbols, risk none (the index covers the main checkout, not this worktree, and the files are new).

### 2026-10-05 - Audio patch model and validation (GS task 2)

- Added `game-next/src/audio-synth/patch.ts`: the declarative `Patch` / `Layer` / `Source` / `Envelope` / `Filter` types and `validatePatch`, which reports every problem it finds with a path and a message rather than throwing on the first. It also rejects an invalid `sampleRate` and a `glideToHz` above Nyquist.
- Added `game-next/tests/audioPatchValidate.test.ts`.
- Verification: `tests/audioPatchValidate.test.ts` failed first (module absent), then passed (12 tests) covering duration, empty layers, late `startMs`, cutoffs above Nyquist, NaN, normalize bounds, negative envelope times, bad sample rate and glide above Nyquist. See task report for `npm test` and GitNexus `detect_changes` results.

### 2026-10-05 - Record DSP review and next audio task

- Updated `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md` after independent Task 1 review; patch validation is next.
- Removed trailing test-file whitespace found by the staged diff check; the original worktree check did not cover untracked files.
- Verification: independent review approved DSP behavior and test coverage; functional evidence remains 22 DSP tests and 851 full-suite tests passing with clean typecheck. GitNexus MCP is unavailable in this session.

### 2026-10-05 - Audio synth DSP primitives (GS task 1)

- Added `game-next/src/audio-synth/dsp.ts`: seeded `mulberry32`, white/pink `noise`, AD/ADSR `envelope`, gliding sine/triangle/saw/square `osc`, two-operator `fmOsc`, and RBJ `biquadCoeffs` / `applyBiquad` with cutoff sweeping. The portable module imports nothing.
- Added `game-next/tests/dsp.test.ts`: deterministic rendering, filter attenuation, oscillator behavior, empty buffers, FM index envelopes, and endpoint-inclusive short decay/release checks. Decay and release reach their target on their final sample; one-sample segments contain their target.
- Verification: `npx vitest run tests/dsp.test.ts` failed first because the module was absent, then passed (22 tests); `npm run typecheck` passed; `npm test` passed (69 files, 851 tests); `git diff --check` passed. GitNexus MCP was unavailable, so `detect_changes` could not run; the new module has no existing callers and no existing symbols were edited.

### 2026-10-05 - Plan: audio synthesis engine, Tasks 1-12

Implementation plans for the audio synthesis spec, and the workspace set up to execute them.

- Added `docs/superpowers/plans/2026-10-05-gs-audio-synth-index.md` (order, branch, stop points, the contract table between tasks, the task-by-task mapping onto the superseded G plan, and four deviations from the spec), `2026-10-05-gs1-synth-engine.md` (Tasks 1-8: DSP primitives, patch model, renderer, WAV, the eight Mirror patches, `audio:author`, the Audio Lab, the engine README) and `2026-10-05-gs2-wiring.md` (Tasks 9-12: music manifest, the two settings, `MusicPort`, `SfxPort` over `synthSfxDriver`, wiring).
- GS2 names the exact tasks and steps to execute from `2026-10-03-g1-audio-foundation.md` plus every substitution, rather than copying 1,200 lines that would then need keeping in step. G2 runs afterwards unedited, because every name it imports is produced under the same spelling.
- Updated `docs/ai/DOCS-INDEX.md` (row GS now lists its plans and reads `approved`) and `docs/ai/STATUS.md` (branch, next step, the two GS blockers, and two new gotchas).
- Prepared the worktree `D:\Working\ASOL\ASOL-GAME-02-audio` on `feat/audio-synth`: merged `origin/main` up to `f964e13` so F1 and F2 are present, resolved the one `CHANGELOG.md` conflict by keeping both entries, and ran `npm ci`.
- Verification: baseline in the worktree is green — `npm run typecheck` clean and `npm test` 68 files / 829 tests passing. Plan self-review found and fixed a real defect before any code was written: `MUSIC_ROOT_HZ` was to be exported from the same barrel that imports the patches reading it, which is a cycle that throws `ReferenceError` from the temporal dead zone at import time; it now lives in `src/content/audio/root.ts`. The self-review also replaced an over-clever Proxy-based fake `AudioContext` in the Task 11 test with a plain one. GitNexus `detect_changes` reports docs-only changes and no affected symbols.

### 2026-10-05 - Design: audio synthesis engine for all sound effects

Brainstormed and specified a replacement for the sample-sourcing half of the G audio stream. All eight sound effects are synthesized from declarative TypeScript patches; the reviewer still sources the two music tracks.

- Added `docs/superpowers/specs/2026-10-05-audio-synth-engine-design.md`: a self-contained engine in `game-next/src/audio-synth/` (five concepts — source, envelope, filter, layer, normalize), deterministic seeded rendering, code-based loudness normalization, a `synthSfxDriver` that implements G1 Task 8's existing `SfxDriver` interface verbatim, a dev-only Audio Lab at `audiolab.html` that ships zero bytes to production, an `audio:author` script writing WAV and SVG review artifacts to `docs/testing/audio/`, and a README that travels with the folder for reuse in later projects.
- Updated `docs/ai/DOCS-INDEX.md`: new row GS; row G notes that its sourcing half is superseded while its music side stands.
- Effect on the existing chain: G0 and G1 Tasks 4-5 are deleted, Task 3 shrinks to the music assets, Tasks 8-9 swap the driver and drop the preload, and G2 is untouched. `ffmpeg-static` is no longer needed, so the dependency count is unchanged. Index departures 1, 2 and 4 are void.
- Verification: spec self-review ran and fixed two internal contradictions (`webaudio.ts` overlapping `synthSfxDriver.ts`, and a report field describing pitch estimation that the design removes). No code changed. Committed from a separate worktree on `feat/audio-synth` so that in-flight F2 work on `feat/motion-f1` was untouched. GitNexus `detect_changes` reports docs-only changes and no affected symbols.

### 2026-10-05 - Accept F2 motion and defer F3 acceptance tooling

- Recorded Reviewer Stop Point 4 as passed for F1/F2 and documented the intentional 2800 ms victory sequence across the active F2/F3 specifications, motion plan index, architecture map, docs index, and status.
- Kept F3 approved but deferred for later implementation and Android/device acceptance by the reviewer; `feat/motion-f2` may be integrated independently.
- Verification: `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run build`, `git diff --check`.

### 2026-10-05 - Lengthen victory sequence to 2800 ms

- Updated `game-next/src/presentation/designTokens.ts`: lengthened `VICTORY_TOKENS.totalMs` from 1800 ms to 2800 ms. Light wave now spans 400–1200 ms with 120 ms stagger, silhouette trace runs at 900–1500 ms, celestial rings & stardust burst expand at 1300–2400 ms, and the win card slides in gracefully at 2000–2800 ms (giving players ample time to appreciate the solved board and particle effects). Tap-to-skip remains responsive.
- Updated `game-next/tests/victorySequence.test.ts` to match the 2800 ms timeline.
- Verification: `tests/victorySequence.test.ts` (8/8 tests passed).

### 2026-10-05 - Constrain desktop web viewport to portrait aspect ratio

- Updated `game-next/src/presentation/viewport.ts`: `computeViewport` caps `safeCssWidth` at `safeCssHeight * (DESIGN_WIDTH / DESIGN_HEIGHT)` (9:16) on screens wider than portrait. This avoids massive scaling and squashed vertical coordinates on desktop/web while preserving mobile phones in portrait identically.
- Updated `game-next/src/style.css`: added `max-width: calc(100vh * 720 / 1280)` and centered `#game` with `left: 50%; transform: translateX(-50%)`, adding a soft box-shadow against the cosmic background. Mobile portrait devices (where width <= max-width) remain 100vw x 100vh full-screen.
- Added tests in `game-next/tests/viewport.test.ts` verifying desktop 1920x1080 bounds clamping to 9:16 portrait (~1280 design height) and mobile 390x844 preservation.
- Verification: `npm run typecheck`, `npm test` (68 test files, 829 tests), `npm run content:validate`, `npm run build` all passed.

### 2026-10-05 - Complete F2 in-level game feel (F2 task 10)

- Pieces now drop into the tray individually during the F1 play-in (950-1350 ms, scale 0.6 → 1, ease backOut, span 180 ms) in `game-next/src/presentation/transitions/routes.ts`.
- Documented the in-level game feel and feedback entry points in `game-next/README.md`.
- Audited reduced-motion handling against spec F2 section 5 across all presentation and feedback modules.
- Verification: `npm run typecheck`, `npm test` (68 test files, 827 tests), `npm run content:validate` (22 levels), and `npm run build` passed.

### 2026-10-05 - Stage the 1800 ms victory sequence (F2 task 9)

- Added `game-next/src/presentation/feedback/victorySequence.ts`: pure victory schedule (150 ms under reduced motion) with light timings, trace timings, ring and burst parameters, gold-frame crossfade, and win card slide with four staggered item groups.
- Added `planBurst` and `burstAt` to `game-next/src/presentation/transitions/stardust.ts` for stardust particle bursts up to 30 particles.
- Added `deepen` to `game-next/src/presentation/BackgroundScene.ts` for background sky darkening during victory.
- Implemented `playVictory`, `skipVictory`, `unwindVictory`, and `burst` in `FeedbackDirector.ts`; updated `Hud.ts` with `playWinCard` and `unwindWinCard`.
- Updated `PlayScene.ts`: removed old `playCelebration` and `celebrationContainer`, wired tap-to-skip in `pointerdown`, and used `unwindVictory` in `resetLevel`.
- Verification: `tests/victorySequence.test.ts` and `tests/transitionRoutes.test.ts` passed; `npm run typecheck` and `npm test` (68 test files, 827 tests) passed.

### 2026-10-05 - Add feedback director for operations and smooth hud (F2 task 8)

- Updated `game-next/src/presentation/Hud.ts`: added `tickSnapHint`, `popCounterIcon`, `matchIconCenters`, and smooth rotate button alpha fade; removed obsolete `showSnapHint`/`hideSnapHint`.
- Added `game-next/src/presentation/feedback/FeedbackDirector.ts`: handles visual and haptic feedback for lift, snap (bounce + ring + counter pop), return, rotate, rotate-blocked flash, overlap-hollow trace, overlap-revive star, and staggered reset animations using `TransitionTimeline`.
- Wired `FeedbackDirector` into `game-next/src/presentation/PlayScene.ts`: updated pointer handlers to dispatch lift and commit state transitions via `feedbackEvents`, hooked HUD callbacks and `resetLevel`, and ticked feedback and HUD snap hint in `update()`.
- Verification: `npm run typecheck` and `npm test` (67 test files, 818 tests) passed.

### 2026-10-05 - Lock parity fade and overlap preview behaviour (F2 task 7)

- Added `game-next/tests/boardRendererParity.test.ts`: verified that new overlap layers fade in from 0 to 1 over 150 ms and merge into the stable layer, `fadeOutParity` fades out a snapshot replica, and drag snap candidate over placed piece draws preview strokes.
- Verification: `tests/boardRendererParity.test.ts`, `npm run typecheck` and `npm test` (67 test files, 818 tests) passed.

### 2026-10-05 - Frame-based rendering with PieceView and BoardRenderer.tick (F2 task 6)

- Added `game-next/src/presentation/PieceView.ts`: one container per piece holding texture-based shadow, body, and add-blended light images; applies frame-rate-independent smoothing, velocity tilt, bounce, shake, spin and flash.
- Rewrote `game-next/src/presentation/BoardRenderer.ts` around `tick(dtMs, snapshot, pieces)`: uses `PieceView` for piece rendering, animates incoming parity layers via `overlapFadeMs`, smoothly steps target hover alphas, and draws preview strokes.
- Updated `PlayScene.ts` to bake one piece per frame in `update()`, tick the board renderer, and throttle snap hint updates.
- Verification: `tests/boardRendererLayers.test.ts` and `tests/boardRendererReveal.test.ts` updated and passing; full test suite (66 test files, 815 tests) and web build passed.

### 2026-10-05 - Add piece texture cache with a memory budget (F2 task 5)

- Added `game-next/src/presentation/PieceTextureCache.ts`: each piece orientation is baked once into a 360 px jewel body plus half-resolution black and white silhouettes (no `setTintFill`, so WebGL and Canvas share one path), one piece per frame, with synchronous `ensure` for rotations.
- Measured budget: every Chapter 1 piece has `frameSize` 48 and no level rotates, so levels use 1.48-2.22 MiB; a rotating 6-piece level of 64-cell frames would exceed 24 MiB and automatically drops to 0.75 resolution (17.8 MiB).
- Added the shared test helper `tests/helpers/fakeScene.ts`.
- Verification: `tests/pieceTextureCache.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` (66 test files, 816 tests) passed.

### 2026-10-05 - Add haptics port, cues, and persistent setting (F2 task 4)

- Added `@capacitor/haptics` 8.0.2 (peer `@capacitor/core >=8.0.0`), a pure `HapticsPort` that swallows driver errors and respects the setting, a Capacitor driver (`capacitorHapticsDriver`), and the event-to-cue table from spec F2 section 3 (`HAPTIC_CUES`, `playCue`).
- Added `settings.haptics` (default `true`, legacy saves read as `true`) with `setHaptics`; the "Rung phản hồi" toggle in `SettingsDialog` now persists and appears on native platforms or browsers with `navigator.vibrate`.
- Verification: `tests/haptics.test.ts` and two progress tests failed before the change, then passed; `npm run typecheck` and `npm test` (65 test files, 806 tests) passed; `npm run build` succeeded.

### 2026-10-05 - Derive feedback events from transitions (F2 task 3)

- Added `game-next/src/presentation/feedback/parityDiff.ts` (stable layer keys, kept/added overlap layers, perimeter segments for edge traces) and `feedbackEvents.ts`, which turns a `Transition` plus the player command into snap, settle, return, rotate, blocked-rotation, overlap-hollow, overlap-revive, reset and won events. The command parameter is needed because a rejected rotation carries no piece id.
- Verification: `tests/parityDiff.test.ts` and `tests/feedbackEvents.test.ts` failed for the missing modules, then passed; `npm run typecheck` and `npm test` (64 test files, 798 tests) passed.

### 2026-10-05 - Add feedback tokens and piece pose math (F2 task 2)

- Added `FEEDBACK_TOKENS` and `VICTORY_TOKENS` (victory rings shortened to 600 ms so the sequence fits 1800 ms) and `game-next/src/presentation/pieceMotion.ts`: frame-rate-independent exponential smoothing, magnet, velocity tilt, bounce/shake/flash curves and the target pose of a piece for tray, snapped, temporary and dragging states.
- Verification: `tests/pieceMotion.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` (62 test files, 785 tests) passed.

### 2026-10-05 - Stop redundant mask evaluation while dragging (F2 task 1)

- `PlayController` now caches the committed mask and updates it only when the puzzle state changes; `getSnapshot()` no longer evaluates the 20,480-cell mask.
- `updateDrag` accepts `computePreviewMask` and `previous`; the controller disables the unused preview mask, so a drag never calls `evaluate`.
- Verification: `tests/playControllerCache.test.ts` (evaluate spy) and two new drag tests failed before the change, then passed; `npm run typecheck` and `npm test` (61 test files, 772 tests) passed.

### 2026-10-05 - Fix responsive camera zoom in play choreography

- Fixed `zoomCamera` in `playChoreography.ts` to scale relative to the camera's base `designScale` instead of resetting zoom to hardcoded 1.0; prevents mobile gameplay layouts from shrinking upon entering from menu or map.
- Verification: `tests/playChoreography.test.ts` passed; `npm run typecheck` and `npm test` (60 test files, 767 tests) passed.

### 2026-10-05 - Complete F1 scene transitions

- Documented the transition entry point in `game-next/README.md`.
- Verification: `npm run typecheck`, `npm test`, `npm run content:validate` and `npm run build` passed; spec F1 sections 2–3 cross-checked. Device acceptance is tracked by plan F3.

### 2026-10-05 - Choreograph the play scene (F1 task 9)

- Split the board into base, grid and top layers centred on (360, 600), made the four cardinal runes visible above the grid (previously hidden under the board surface), added per-placement target reveal and a gold-frame toggle to `BoardRenderer`, and exposed animatable HUD and target-badge parts.
- Added `game-next/src/presentation/transitions/playChoreography.ts`: board rise (from the tapped node on the map route), radial grid reveal, staggered runes and targets with a glint sweep, camera breath, tray and HUD entry; next-level stardust implosion and frame flash; leave-to-map/menu collapse. Celestial rings stop under reduced motion.
- Verification: `tests/boardRendererReveal.test.ts` failed for the missing method, then passed; `tests/boardRendererLayers.test.ts` unchanged and passing; `npm run typecheck` and `npm test` (766 tests) passed; manual dev-server check of all play routes, tap-to-skip and reduced motion.

### 2026-10-05 - Choreograph constellation map transitions (F1 task 8)

- Kept references to nodes, Bezier lines, sparks and chapter banners in `LevelSelectScene`; implemented map in/out transitions with distance-ordered node stagger radiating from the active/tapped node, header slide, and an expanding ice-ring pulse covering the board bounds when navigating to play.
- Verification: `npm run typecheck` and `npm test` passed (58 test files, 765 tests).

### 2026-10-05 - Choreograph the main menu (F1 task 7)

- Grouped the menu title, buttons, settings, language pill, and footer into animatable containers and drew the Song Tinh emblem around its own origin; added menu in/out choreography (button collapse, staggered chrome, emblem descending into the board or flying to the map header, 4x ring spin) and stopped the emblem rings under reduced motion.
- Verification: `npm run typecheck` and `npm test` (765 tests) passed; manual dev-server check of boot, menu → play and menu → map.

- Added `game-next/src/presentation/transitions/SceneDirector.ts`: a transition state machine behind a `SceneHost` port (input lock, overlapping hand-off, tap or Back to skip, deferred input re-enable, same-scene restart for the next level, 150 ms crossfade under reduced motion) and its Phaser host.
- `BackgroundScene` now owns the only sky; Menu, Level Select and Play no longer build their own. All 13 `scene.start` calls now go through the director; `main.ts` boots through it and skips an active transition on Android Back or backgrounding.
- Verification: `tests/sceneDirector.test.ts` failed for the missing module and `tests/sceneStartGate.test.ts` listed five offending files, then both passed; `npm run typecheck` and `npm test` (765 tests) passed; web build succeeded.

- Added `game-next/src/presentation/skyMood.ts` (menu/map/play moods, speed-weighted drift accumulation) and `BackgroundScene.ts`, which owns one `SkyBackdrop` and tweens its drift speed and dim layer.
- Replaced the `drift` flag of `SkyBackdrop` with a tweenable `driftSpeed` and added a navy dim layer; existing scenes keep their own sky until the director task.
- Verification: `tests/skyMood.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.

### 2026-10-05 - Persist the reduced-motion setting (F1 task 4)

- Added `settings.reducedMotion` (default `false`, legacy saves read as `false` without recovery) and `setReducedMotion` to the progress repository; wired the previously empty "Giảm chuyển động" toggle in `SettingsDialog` to persist the value and update the global motion scale.
- Verification: three new progress tests failed before the change, then passed; `npm run typecheck` and `npm test` passed.

### 2026-10-05 - Add choreography steps and route tables (F1 task 3)

- Added `game-next/src/presentation/transitions/choreography.ts` (enter/exit poses that always return to the natural pose, step tables with even stagger), `routes.ts` (step tables and special-effect timings for all seven routes) and `stardust.ts` (at most 30 particles with fixed alpha).
- Verification: `tests/choreography.test.ts` and `tests/transitionRoutes.test.ts` failed for the missing modules, then passed; every in-phase ends exactly at its route total and `next-level` finishes its out-phase before the 800 ms restart; `npm run typecheck` and `npm test` passed.

### 2026-10-05 - Add a self-clocked transition timeline (F1 task 2)

- Added `game-next/src/presentation/transitions/TransitionTimeline.ts`: tweens and calls scheduled on route-relative milestones, driven by `advance`, with `complete()` that jumps every entry to its end state in milestone order exactly once.
- Verification: `tests/transitionTimeline.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.

### 2026-10-05 - Add motion primitives for scene transitions (F1 task 1)

- Added `game-next/src/presentation/transitions/motion.ts` (pure easing functions, `stagger`, `scaleTiming`, a global 0/1 motion scale) and `TRANSITION_TOKENS` with the seven routes from spec F1.
- Verification: `tests/motion.test.ts` failed for the missing module, then passed; `npm run typecheck` and `npm test` passed.

### 2026-10-05 - Casual 3D tactile action buttons, moving gameplay galaxy, level start banner, and dialog redesign

Mobile visual polish based on device screenshots (`docs/screenshots/mobile/m1/`):

- `game-next/src/presentation/MenuScene.ts`:
  - Upgraded primary CTA button ("Bắt đầu" / "Tiếp tục") to a tactile 3D amber candy block (360x84px) with 6px deep purple shadow bevel (`#22145A`), bright gold gradient with specular gloss sheen, play jewel icon, enlarged `Baloo 2` typography (28px title, 15px subtitle), and tactile press depression on pointerdown.
  - Upgraded secondary button ("Chọn màn chơi") to an ice crystal glass 3D button (360x62px) with double glowing borders (`#7FD8FF`), 4-cell constellation grid icon, enlarged `Baloo 2` text (22px), and tactile bounce.
- `game-next/src/presentation/PlayScene.ts`:
  - Activated moving cosmic sky galaxy in gameplay by switching `SkyBackdrop` config to `drift: true`.
  - Added background cosmic touch interactions: tapping outside the puzzle board spawns expanding quantum ripple rings and radiant stardust sparkles.
  - Added celebratory `LevelStartToast` banner: pops in with elastic scale at the center of the board upon level start, showing chapter and localized level title (e.g. "CHƯƠNG 1 · Màn 1-3 · Cánh Chim Điềm Báo"), holds for 1.25s, then gracefully floats up and fades out.
- `game-next/src/presentation/PauseDialog.ts`:
  - Redesigned dialog into an astrological glass card (420x400px) with double ice/gold borders and drop shadow.
  - Replaced classical serif with casual `Baloo 2` 30px title and converted all 3 navigation actions into 3D tactile buttons: Primary amber 3D button (Resume), secondary ice crystal 3D button (Restart), and muted tertiary glass button (Level Select).
- `game-next/src/presentation/SettingsDialog.ts`:
  - Redesigned dialog frame to match casual astrological card styling (460x520px) with `Baloo 2` 28px title and 3D circular close button.
  - Upgraded language switcher into a 3D pill slider with warm amber active tab and `Baloo 2` 16px labels.
  - Upgraded toggle options to 3D juicy switches with thick rounded tracks and tactile circular thumbs with specular highlights.
  - Replaced flat reset text with a styled warning badge card and upgraded two-step deletion confirmation modal with `Baloo 2` typography and 3D buttons.
- `game-next/src/presentation/i18n.ts`:
  - Added `chapter_prefix` key ("Chương" / "Chapter") to support localized level start banners.
- Verification: 704/704 vitest tests pass across 51 test suites (including 59 font coverage assertions verifying `Baloo 2` covers all new and existing Vietnamese strings); `npm run typecheck` clean; `npm run build` succeeds; `npm run android:sync` updates Capacitor Android web bundle; GitNexus `detect_changes()` verified.

### 2026-10-05 - Cinematic studio splash, MIRROR title entrance & loop, and interactive star sky

- `game-next/src/presentation/SplashScene.ts`:
  - Extended studio splash sequence to 4.5s with staggered origami polygon unfolding (0.0–1.4s), typography slide-in with expanding mirror bar and reflection (1.0–1.8s), light sweep sheen with sparkling stars (1.8–2.6s), and a 1.5s brand appreciation hold (2.6–4.1s).
  - Added seamless cinematic color-morph transition: white background dissolves into the deep navy `#1A2470` of `MenuScene` with soft alpha fade over 650ms.
- `game-next/src/presentation/MenuScene.ts`:
  - Added staggered entrance animation to the MIRROR title letters: individual letters drop from above with casual elastic bounce (`Back.easeOut`, 70ms step delay) and settle into their tilt angles; mirror bar expands horizontally with a jewel sparkle; reflection fades in underneath.
  - Added idle loop animations: gentle sine wave floating bob, periodic light sheen sweep across the gold face and mirror bar (every 4.5s), and occasional playful casual letter jiggle (every 6.5s).
  - Activated moving cosmic sky (`SkyBackdrop` with `drift: true`) so stars drift continuously.
  - Added interactive cosmic touch responses: tapping/clicking spawns an expanding quantum ripple wave and a burst of radiant stardust sparkles; dragging creates a trailing stardust particle path.
- Verification: 702/702 vitest tests pass across 51 test suites; `npm run typecheck` clean; `npm run build` succeeds; `npm run android:sync` updates Capacitor Android web bundle; GitNexus `detect_changes()` reports changes isolated to `SplashScene` and `MenuScene`.

### 2026-10-04 - Replace Fredoka with Baloo 2 and finish wiring the HUD to i18n

Review of the branding commits (f17f609, 93a172f).

- Fixed mixed typefaces in Vietnamese display text. Google Fonts publishes Fredoka with the hebrew, latin and latin-ext subsets only - there is no vietnamese subset - so U+1EA0-1EF1 fell outside every declared range and the browser substituted a fallback face per character. 8 of the 10 prominent display strings were affected, splitting single words: "Bắt đầu" (ầ ắ), "Tiếp tục" (ế ụ), "Chọn màn chơi" (ọ), "Cài Đặt Chiêm Tinh" (ặ), "Tạm Dừng" (ạ ừ). Replaced with Baloo 2, which was already the declared fallback, matches the rounded casual tone and ships a vietnamese subset. `game-next/public/fonts/` gains 6 Baloo 2 woff2 files (138 KB) and loses the 4 Fredoka ones; `src/style.css`, `src/presentation/designTokens.ts` and `src/main.ts` updated accordingly.
- Added `game-next/tests/displayFontCoverage.test.ts`: parses the `@font-face` rules out of `style.css` and asserts the display family covers U+1EA0-1EF9 and every string in `TRANSLATIONS`. This class of bug breaks no build and fails no other test - it is only visible on a device - so it needs an automated guard. Verified the guard bites: with Fredoka's real ranges, 82 of the 90 code points in that block are uncovered.
- Finished the i18n wiring. `Hud.ts` still imported the hardcoded Vietnamese `VICTORY_LABELS` and `SNAP_HINT_TEXT`, so the victory modal and the snap hint stayed Vietnamese in English mode while the match counter translated. It now calls `getVictoryLabels()` and `getSnapHintText()`, read at build time rather than at module load. Deleted the duplicate constants from `hudText.ts` - that duplication was the source of the drift - and moved the tests onto the accessors, adding a case that asserts the labels actually change with the locale.

### 2026-10-04 - Bilingual i18n system and studio splash intro

- Added `game-next/src/presentation/i18n.ts`: `vi`/`en` dictionaries, `t()` with `{param}` interpolation, `getLocale`/`setLocale` persisted to `localStorage` under `mirror.rebuild.locale`, an `onLocaleChange` observer and `getLevelTitle` for English level names. Guards `typeof window` and wraps storage access, so it loads under vitest's node environment.
- Added `game-next/src/presentation/SplashScene.ts`: studio intro shown before the menu, registered first in the scene list in `src/main.ts` and skipped when a launch parameter targets another scene.
- Routed `MenuScene`, `SettingsDialog`, `PauseDialog`, `LevelSelectScene` and `hudText` through `t()`; `SettingsDialog` gains a language row that switches locale and rebuilds the menu.
- Added `game-next/tests/i18n.test.ts`.
- Verification: covered by the suite run below. Note: `onLocaleChange` is exercised only by its test - the menu rebuild goes through a `(this.scene as any).buildMainMenu(...)` cast in `SettingsDialog.ts`, which works today because the dialog is only opened from `MenuScene`.

### 2026-10-04 - Dual jewel app icon, casual mirror logo and display typography

- Replaced the Android launcher icons across every mipmap density and `ic_launcher_background.xml`.
- Added web icons and favicons (`game-next/public/icon.svg`, `icon-192.png`, `icon-512.png`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `assets/studio.svg`) and linked them from `index.html`, whose title becomes "Mirror".
- Reworked the `MenuScene` logo treatment and introduced a `display` typography token.
- Verification: covered by the suite run below.

Verification for the three entries above: 702/702 vitest tests pass across 51 suites; `npm run typecheck` and `npm run build` clean; `npm run android:sync` plus `gradlew assembleDebug` produce a debug APK. The Fredoka subset claim was checked against the Google Fonts API, not assumed. **Not yet verified on hardware.**

### 2026-10-04 - Bilingual i18n system and Alpaca Solutions studio splash intro

- Created `game-next/src/presentation/i18n.ts`: reactive translation manager supporting Vietnamese (`vi`) and English (`en`), persisting choice to `localStorage` (`mirror.rebuild.locale`), with full dictionary coverage for menu, settings, pause, level select, HUD and localized level names.
- Added quick `VI | EN` pill toggle button to `MenuScene.ts` top bar and language selector row inside `SettingsDialog.ts`.
- Integrated `t(...)` translations and localized level names across `MenuScene.ts`, `SettingsDialog.ts`, `PauseDialog.ts`, `LevelSelectScene.ts`, and `hudText.ts`.
- Added unit tests in `game-next/tests/i18n.test.ts` covering default locale, English switching, parameter interpolation, level title translation, and reactive listeners.
- Created `game-next/src/presentation/SplashScene.ts` featuring the Alpaca Solutions studio intro on a pure white background (`#FFFFFF`):
  - Renders the origami logo sharply from `docs/gdd/assets/studio.svg` (copied to `game-next/public/assets/studio.svg`) with an ambient gold/purple glow and floating physics.
  - "Alpaca Solutions" brand text in `Fredoka` font with mirror bar and inverted glass reflection beneath, matching the Gương Đôi concept.
  - Entrance timeline: elastic logo pop-in (0.7s), expanding mirror bar and slide-in typography (0.4-0.9s), light sweep sheen and twinkling stars (0.8-1.4s), followed by a 1.5s hold before smooth camera fade-out into `MenuScene` without requiring touch.
- Registered `SplashScene` in `game-next/src/main.ts` as the primary startup scene while bypassing it on specific launch targets (`?scene=play|levelSelect`).
- Verification: 644/644 vitest tests pass (including 5 new in `tests/i18n.test.ts`); `npm run typecheck` clean; `npm run build` succeeds; `npm run android:sync` copies web assets and updates Capacitor Android; GitNexus `detect_changes()` verified.

### 2026-10-04 - Casual branding: Dual Jewels app icon, Gương Đôi title logo, and Fredoka typography

- Added self-hosted Fredoka font files (`fredoka-600/700` Latin and Latin-ext covering English and complete Vietnamese diacritics) to `game-next/public/fonts/`.
- Updated `game-next/src/style.css` with `@font-face` declarations for Fredoka, and added them to `REQUIRED_FACES` in `game-next/src/main.ts` for clean pre-boot loading.
- Updated `game-next/src/presentation/designTokens.ts`: `TYPO_TOKENS.fontFamily.display` and `serif` aliases point to Fredoka while preserving Be Vietnam Pro for body text, level titles, and long descriptions.
- Redesigned `game-next/src/presentation/MenuScene.ts` to implement Logo Casual Option 2 (Gương Đôi) featuring 3D gold rounded lettering on a cyan mirror bar with an inverted reflection below, and replaced the astrological prophecy seal with the interactive Dual Jewels (Ngọc Đôi) emblem showing the Parity XOR hollow core with a pulsing center sparkle.
- Generated app icons for web (`favicon.svg`, `icon.svg`, `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) and updated `game-next/index.html`.
- Generated Android launcher icons across all densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` for `ic_launcher`, `ic_launcher_round`, and `ic_launcher_foreground`), and updated `ic_launcher_background.xml` with purple-violet gradient `#A774FF` -> `#5A1FC7`.
- Verification: 639/639 vitest tests pass (`tests/designTokens.test.ts`, `tests/hud.test.ts`, `tests/menu.test.ts` updated to match Fredoka); `npm run typecheck` passes with zero errors; `npm run build` succeeds cleanly; GitNexus `detect_changes()` reports 8 symbols across 2 processes with medium risk.

### 2026-10-04 - Elastic vertical layout, seamless backdrop, safe-area aware HUD (Tier 2)

Device play-test of the Tier 0 build (`docs/screenshots/mobile/m0/`) confirmed immersive mode, crisp text and the Cormorant switch, but showed the play area still boxed into the 720x1280 frame with a visible seam at the top and bottom bands.

- Fixed the seam. `game-next/src/presentation/SkyBackdrop.ts`: `paintSky` now renders the gradient canvas at the real visible height and offsets the nebulae by the frame origin, and `bleedSky` is gone. The old approach filled the overflow with the raw first and last gradient stop, but the pink nebula at (648, 966) with radius 360 reaches y=1326, so the frame edge was never the bare stop colour and the joint always stepped. A canvas gradient clamps outside its endpoints, so painting the full height removes the boundary instead of trying to match across it.
- Fixed the dialog overlays. `SettingsDialog.ts` and `PauseDialog.ts` sized their dimming rectangle to 720x1280 and centred their container on (360, 640), so on a tall screen the overflow stayed undimmed as two bright bands. Both now use `designViewBounds`.
- `game-next/src/presentation/viewport.ts`: added `computeDesignHeight` (design height follows the device aspect, width stays 720), `safeAreaToDesignUnits` and `readSafeAreaCssPx`. `computeDesignView` now returns a view anchored at the origin rather than a frame centred on 1280.
- `game-next/src/presentation/designViewport.ts`: the camera shows the whole elastic view; added `designSafeArea`, which reads `env(safe-area-inset-*)` once through a probe element and caches it.
- `game-next/src/presentation/layout.ts`: `computeLayout(designWidth, designHeight, safeArea)` distributes vertically - header pinned below the top inset, bottom bar above the bottom inset, tray above the bar, board centred in what remains and clamped so the target badge never rides over the chapter subtitle. Added `targetBadgeY`, `designHeight` and `safeArea` to `LayoutMetrics`. The board stays 640x800 and `cellPixel` stays 5, so grid maths, hit testing and `BoardRenderer` are untouched.
- `game-next/src/presentation/Hud.ts`: takes the layout and anchors the header row, the bottom button row, the victory card and the input blocker to it instead of `LAYOUT_TOKENS.bottomBar.y` and fixed offsets.
- `game-next/src/presentation/TargetBadge.ts`: follows `layout.targetBadgeY` instead of a hardcoded y=178.
- `game-next/src/presentation/MenuScene.ts`: the main block keeps its tuned 1280 composition and is shifted to centre on the real height; the settings button and the version line anchor to the top and bottom insets.
- `game-next/src/presentation/LevelSelectScene.ts`: header background extends to y=0 under the notch while its controls sit below the inset, and the scroll limit uses the real height rather than 1280.
- Verification: 639/639 vitest tests pass across 49 suites, including 24 new in `tests/layoutElastic.test.ts` covering 9:16, 9:19.5 and 9:21 with and without insets - no overlap between tray, board and bottom bar, nothing outside the view, and **the 9:16 case reproduces the original artboard exactly** (board y=200, tray y=1016, bottom bar y=1164), which is the no-regression guarantee. `npm run typecheck` and `npm run build` clean; `android:sync` plus `gradlew assembleDebug` rebuild the debug APK. GitNexus `detect_changes` reports 37 symbols over 29 processes; `gridToCanvas`, `canvasToGrid`, `pieceHitbox` and `pieceBoardOrigin` appear as touched because their file changed, but their bodies are unchanged and they follow the board through `layout.boardBounds` by design. **Not yet verified on hardware.**

### 2026-10-04 - Fix the Android letterbox, render at device resolution, self-host fonts

Tier 0 of the mobile display work. Screenshots from a 1080x2460 device (`docs/screenshots/mobile/`) showed a large black band above the game, none below, a visible status bar, and soft text.

- Fixed the black band. `game-next/src/style.css`: removed the flex centering from `#game`. Phaser's `autoCenter` already centers the canvas by writing `style.marginTop` (`ScaleManager.updateCenter`), and a flex parent centers the canvas' margin box on top of that, so the offset was applied twice and pushed the canvas to y=405 instead of y=270.
- Added `game-next/src/presentation/viewport.ts`: `computeViewport` sizes the drawing buffer to physical pixels (devicePixelRatio capped at 3), `computeDesignView` reports the design-space area a given buffer actually shows. Phaser-free, so it is unit tested directly.
- Added `game-next/src/presentation/designViewport.ts`: `applyDesignViewport` restores the 720x1280 design coordinate space with a camera zoom, and wraps each scene's `add.text` factory so every label rasterises at device resolution. Wrapping the factory covers all 41 text call sites at once.
- Modified `game-next/src/main.ts`: the game is sized to the physical pixel buffer with `Scale.NONE`, so the canvas is no longer upscaled. Game construction moved into an async `bootstrap()` because top-level await does not build.
- Modified `game-next/src/presentation/{MenuScene,PlayScene,LevelSelectScene,FixtureScene}.ts`: call `applyDesignViewport` at the top of `create()`. `PlayScene` and `LevelSelectScene` now read `pointer.worldX/worldY` instead of `pointer.x/y`, which camera zoom would otherwise offset silently, breaking drag-and-drop and map scrolling.
- Modified `game-next/src/presentation/SkyBackdrop.ts`: the sky and star layers follow the visible design area instead of the 720x1280 frame, and `bleedSky` extends the first and last gradient stop into the overflow, so screens taller than 9:16 show sky rather than a flat band.
- Modified `game-next/android/.../MainActivity.java`: immersive sticky mode, drawing through the display cutout, re-applied on `onWindowFocusChanged` so the bars stay hidden after returning from background. No new Capacitor plugin; the manifest already locked portrait.
- Replaced the `fonts.googleapis.com` `@import` with 18 self-hosted woff2 files in `game-next/public/fonts/` (Be Vietnam Pro 400/500/600/700, Cormorant Garamond 600/700; Latin, Latin-ext and Vietnamese subsets; 320 KB). `main.ts` now calls `document.fonts.load` for each face before building the game: Phaser draws text on a canvas, and setting `ctx.font` does not trigger a webfont download, so `document.fonts.ready` alone would have resolved before the fonts arrived.
- Switched the display face from Playfair Display to Cormorant Garamond in `game-next/src/presentation/designTokens.ts`, raising `heroTitle` 52px to 60px and `modalTitle` 44px to 50px because Cormorant is lighter on the navy background. Updated the three tests that pinned the old face and size.
- Known limitation: `TextureFactory` and `GridPainter` still bake buttons, icons and the grid at design size, so those bitmaps are upscaled exactly as before. Text and all vector drawing are now crisp. Deferred deliberately because the fix would touch 18 image call sites, four inside `BoardRenderer` (CRITICAL).
- Verification: 615/615 vitest tests pass across 48 suites (10 new in `tests/viewport.test.ts`); `npm run typecheck` and `npm run build` clean; `npm run android:sync` plus `gradlew assembleDebug` produce a 5.9 MB debug APK with the fonts in `dist/fonts/`. GitNexus `detect_changes` reports 20 changed symbols over 26 processes, all of them `create` flows of the four scenes, with no Domain or Application symbol touched. The double-centering cause was confirmed by reading `ScaleManager.updateCenter` rather than from a device. **Not yet verified on hardware** - the reviewer play-test is the stop point.

### 2026-10-04 - Merge Plan E (Level Studio) into main

- Merged `feat/level-studio-e3` containing Phases E1, E2, and E3 into `main`.
- Delivered automatic difficulty scoring (`scoreDifficulty`), calibration tables, warnings report, studio backend storage, Vite dev middleware (`/__studio/`), campaign promote pipeline (`npm run content:promote`), harness studio level loading, and interactive 3-column Level Studio UI (`studio.html`) with async Web Worker solver.
- Updated `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md` to reflect `main` branch state.
- Verification: 605/605 vitest tests pass across 47 suites; `npm run typecheck` and `npm run build` pass cleanly.

### 2026-10-04 - Record reviewer approval of Level Studio (Plan E) at Stop Point 4

- Updated `docs/testing/studio/acceptance.md`: updated status to `passed` following reviewer (NKhanh0908) verification and approval.
- Updated `docs/ai/DOCS-INDEX.md`: marked rows `E` and `E3` as `done`.
- Updated `docs/ai/STATUS.md`: recorded 100% completion of Plan E (E1 difficulty scoring, E2 backend infrastructure, E3 Studio UI & acceptance), passing Stop Point 4.
- Verification: all 605 vitest tests pass across 47 suites; `npm run typecheck` and `npm run build` pass cleanly.

### 2026-10-04 - Fix id-clash-campaign when saving campaign levels and sync rotation with chapter in Studio

- Modified `game-next/src/content/manifest.ts`: exported `isCampaignId(id)` helper to check if an ID belongs to `campaignManifest`.
- Modified `game-next/src/studio/state.ts`: synchronized `chapter` and `rotationEnabled` in `studioReducer`. Setting `chapter: 4` or toggling `rotationEnabled: true` automatically enables both; switching away from Chapter 4 automatically disables rotation and resets turns to 0. Resolves validator error `chapter-rotation-disabled`.
- Modified `game-next/src/studio/inspector.ts`: added campaign reference badge `⚠️ Màn Chiến dịch (chỉ đọc)` on ID field; updated Save button to `LƯU BẢN STUDIO (Clone & Lưu)` when viewing campaign levels, prompting the user for a new studio ID and cloning/saving seamlessly instead of failing with `id-clash-campaign`.
- Modified `game-next/src/studio/library.ts`: prevented creating or cloning levels with IDs that clash with campaign manifest.
- Added test cases in `game-next/tests/studioState.test.ts`: verified chapter and rotation two-way synchronization in reducer.
- Verification: `npm run typecheck` passed, all 605 tests passed across 47 suites, browser CDP capture verified `✓ Hợp lệ` upon rotation toggle and proper clone-save workflow.

### 2026-10-04 - Complete Level Studio frontend UI and acceptance evidence (Phases E3-2 & E3-3)

- Added `game-next/studio.html`: dedicated Level Studio interface page with dark cosmic aesthetic, responsive 3-column layout.
- Added `game-next/src/studio/boardView.ts`: 512x640 SVG board rendering 8-cell/24-cell grid, odd/even parity silhouette fills (`#d4af37` gold for odd, hollow for even, dotted for 3+), piece polygons, vertex anchors (gold A and blue/red decoys), with pointer-based drag-and-drop and grid snapping.
- Added `game-next/src/studio/palette.ts`: shape selection (Square, Triangle, Diamond, Circle, Parallelogram), dynamic frame sizes (`isValidFrame`), orientation picker, "+ Thêm mảnh", "+ Neo nhiễu", and rotate/mirror/delete buttons.
- Added `game-next/src/studio/library.ts`: studio level management (create, clone, select, delete) with dirty state indicator (`●`), and campaign levels reference list.
- Added `game-next/src/studio/inspector.ts`: metadata editor (id, title, chapter, objective, difficulty estimate), live validation status badge (`✓ Hợp lệ` / `Lỗi`), solver metrics (solution count, proven status, solve time, warnings), 6-component difficulty scorecard with visual bar charts, and Save / Play Test / Open SVG actions.
- Added `game-next/src/studio/solverWorker.ts` & `tests/studioSolverWorker.test.ts`: Web Worker module and pure `handleCheck` solver function.
- Added `game-next/src/studio/api.ts`: typed client functions connecting to `/__studio/` endpoints.
- Added `game-next/src/studio/main.ts`: studio application root binding reducer state, check queue, Web Worker, hash loader, beforeunload dirty check, and keyboard navigation.
- Added `game-next/src/content/sourceFromDocument.ts`: extracted pure document-to-source converter to guarantee zero Node.js dependencies in browser runtime.
- Added `docs/testing/studio/acceptance.md`, `acceptance.png`, `inspector.png`, `page.png`: complete acceptance report and full 1440x900 screenshots showing 3 columns, silhouette parity, and difficulty scorecard.
- Verification: all 603 tests pass across 47 suites; `npm run build` succeeds and produces clean bundle strictly excluding `studio.html`; automated headless Chrome captures verified live rendering and solver queue.

### 2026-10-04 - Implement core logic for Level Studio (Phase E3-1)

- Added `game-next/src/studio/state.ts`: implements `StudioState`, `studioReducer`, `cloneLevelSource`, `computeDecoyReason`, and `isDirty`.
- Added `game-next/src/studio/keys.ts`: implements `keyToAction` mapping keyboard shortcuts (`R`, `Shift+R`, `Delete`, `Ctrl+D`, arrow keys) to studio actions.
- Added `game-next/src/studio/geometry.ts`: implements `layerCounts`, `outlinePath` (boundary SVG path generation for overlapping layers), and `snapAndClamp` (grid snapping and frame boundary clamping).
- Added `game-next/src/studio/checkQueue.ts`: implements `createCheckQueue` with 300 ms debounce, single in-flight run enforcement, and stale result marking.
- Added `game-next/tests/studioState.test.ts`, `studioKeys.test.ts`, `studioGeometry.test.ts`, `studioCheckQueue.test.ts`: test coverage for all pure logic modules.
- Verification: all 28 new tests passed; full test suite passes with 601 tests across 46 suites; typecheck clean.

### 2026-10-04 - Update status and documentation index for Plan E phases E1 and E2

- Updated `docs/ai/STATUS.md`: recorded completion of E1 (difficulty scoring) and E2 (studio backend infrastructure), reaching Stop Point 2.
- Updated `docs/ai/DOCS-INDEX.md`: marked E1 and E2 rows as done on `feat/level-studio-e2`.
- Verification: git status clean, all 573 tests passing.

### 2026-10-04 - Add content:promote script and campaign promotion pipeline

- Added `game-next/src/content/promote.ts`: implements `sourceFromDocument`, `registerInCatalog`, `updateManifestLine`, `updateAuthoredLevels`, and `promoteStudioLevel` to safely promote studio levels to campaign targets with single-solution validation.
- Added `game-next/scripts/promote-level.ts`: CLI entrypoint for `npm run content:promote -- <studio-id> <target-id>`.
- Modified `game-next/package.json`: added `"content:promote"` npm script.
- Added `game-next/tests/promote.test.ts`: test coverage for document-to-source conversion, catalog and manifest updating, single-solution enforcement, rotation rule validation, and full promote workflow.
- Verification: tests failed before implementation and passed after; `npm run typecheck`, `npm test` (all 573 tests) and `npm run build` passed.

### 2026-10-04 - Support loading studio levels in harness mode

- `game-next/src/content/catalog.ts`: added `import.meta.glob('./studio/levels/*.json', ...)` when DEV, supporting studio level loading in harness mode with optional `studioLevelsOverride`. Search order prioritizes manifest -> dev levels -> studio levels; campaign mode strictly rejects studio levels.
- `game-next/tests/catalog.test.ts`: added tests verifying harness mode loads studio levels and campaign mode rejects them.
- Verification: tests failed before implementation and passed after; `npm run typecheck` and all 564 vitest tests passed.

### 2026-10-04 - Add studio dev server plugin and Vite configuration

- Added `game-next/scripts/studio/studioPlugin.ts`: Vite dev plugin serving `GET /__studio/list`, `POST /__studio/save`, and `POST /__studio/delete` with CSRF protection (Content-Type 415, Origin 403) and 1 MB body limit (413).
- Added `game-next/vite.config.ts`: configures `studioPlugin` only during dev (`command === 'serve'`) and restricts `rollupOptions.input` strictly to `index.html`.
- Added `game-next/tests/studioPlugin.test.ts`: test coverage for HTTP status codes 200, 400, 403, 409, 413, 415.
- Verification: tests failed before implementation and passed after; `npm run build` produced bundle excluding studio files; `npm run typecheck` and all 562 tests passed.


### 2026-10-04 - Add studio level storage system

- Added `game-next/src/content/studioStore.ts`: implements `saveStudioLevel`, `deleteStudioLevel`, `listStudioLevels`, path safety validation, and ID pattern validation.
- Added `game-next/tests/studioStore.test.ts`: verified file creation, ID pattern checks, rejection of path traversal and campaign clashes, safe list handling and deletions.
- Verification: tests failed before implementation and passed after; `npm run typecheck` and all 554 vitest tests passed.


### 2026-10-04 - Add in-memory level authoring pipeline

- Added `game-next/src/content/authorLevel.ts`: implements `authorLevel(source)` running the full authoring pipeline in memory, generating document, solution report, difficulty score, warnings, JSON, SVG and markdown.
- Added `game-next/tests/authorLevel.test.ts`: verified byte-exact match on 1-1 against committed assets and non-throwing error handling for invalid sources.
- Verification: tests failed before implementation and passed after; `npm run typecheck` and all 546 tests passed.


### 2026-10-04 - Add level source code serializer

- Added `game-next/src/content/serializeSource.ts`: implements `serializeLevelSource(source, constName)` emitting clean TypeScript source matching `sources/` formatting standards.
- Added `game-next/tests/serializeSource.test.ts`: verified byte locks on 1-1, 1-3, 1-4, 1-6 and round-trip dynamic import across all 22 authored levels in `LEVEL_SOURCES`.
- Updated `docs/superpowers/plans/2026-10-02-e2-studio-backend.md` with detailed TDD tasks.
- Verification: tests failed before implementation and passed after; `npm run typecheck` and all 543 vitest tests passed.


### 2026-10-04 - Expand difficulty calibration test over 16 spec C levels

- `game-next/tests/difficulty.test.ts`: added calibration suite asserting exact parts, raw score and discrete difficulty for all 16 levels in Chapters 2 and 3 (2-1..2-6 and 3-1..3-10).
- Verification: all 29 tests in `tests/difficulty.test.ts` passed; `npm run typecheck` and all 519 tests in `npm test` passed.


### 2026-10-04 - Add difficulty warnings to authoring reports

- `game-next/src/content/authoringReport.ts`: `renderReportMarkdown` accepts optional `warnings` parameter and renders `## Cảnh báo` section when warnings exist.
- `game-next/scripts/author-level.ts`: computes difficulty score and warnings via `scoreDifficulty` and `collectWarnings`, passing warnings to `renderReportMarkdown`.
- `game-next/tests/authoringReport.test.ts` & `game-next/tests/difficulty.test.ts`: added tests for warning formatting and mismatch threshold detection.
- Verification: tests failed before implementation and passed after; `npm run typecheck` and all 503 tests passed; `npm run content:author -- --all` ran cleanly with 0 diff on committed reports.


### 2026-10-04 - Add automated difficulty scoring and Chapter 1 calibration

- Added `game-next/src/content/difficulty.ts`: implements `scoreDifficulty` with 6 components (`pieces`, `choices`, `hollow`, `revive`, `nearMiss`, `hiddenEdges`), `DIFFICULTY_WEIGHTS`, `DIFFICULTY_THRESHOLDS`, and `collectWarnings`.
- Added `game-next/tests/difficulty.test.ts`: verified with 4 hand fixtures (`single`, `pair`, `triple`, `free`), edge cases for board boundary hidden edges and free placement bounds, and calibration of all 6 Chapter 1 levels.
- Updated `docs/superpowers/plans/2026-10-02-e1-difficulty.md` with detailed TDD tasks.
- Verification: tests in `tests/difficulty.test.ts` failed before implementation and passed after; `npm run typecheck` and all 501 vitest tests passed.


### 2026-10-04 - Add dev-only free-placement harness level

- Registered `FREE_DEMO_SOURCE` as `dev-free-placement` in `game-next/src/content/devLevels.ts` (dev server and harness only, never in the manifest or campaign).
- Added catalog and PlayController tests: the level loads in harness, pieces snap to `grid:<x>,<y>` candidates and the level is won; added screenshots `docs/testing/levels/screens/dev-free-placement-{play,drag,win}.png`.
- Verification: the new tests failed before registration and passed after; typecheck, all tests, `content:validate` and `build` passed; the build contains no `dev-free-placement` string; screenshots checked by eye.


### 2026-10-04 - Skip kit decoys on free-placement pieces

- `piece`, `row` and `concentric` in `game-next/src/content/kit.ts` accept `placement: 'free'` and then emit only anchor A, ignoring `decoys`.
- Verification: the new kit tests failed before the change and passed after; typecheck and all tests passed.


### 2026-10-04 - Route authoring reports through the solver and gate unproven levels

- `searchSolutions` in `game-next/src/content/authoringReport.ts` now uses `solveLevel`; `SolutionReport` adds `proven`, `poseCounts` and `elapsedMs`; identical pieces swapping count as one solution (the twins test now expects 1).
- Free-level reports list pose counts, solve time and proof status; unproven reports carry a warning; free-level SVGs draw only anchor A.
- Added `releaseBlocker`; `scripts/validate-content.ts --release` rejects unproven levels without `allowUnproven`, and `scripts/author-level.ts` warns but still writes.
- Verification: the new report tests failed before the change and passed after; typecheck, all tests, `content:validate` and `content:author -- --all` passed with no diff in committed levels or reports.


### 2026-10-04 - Add hashed meet-in-the-middle level solver

- Added `game-next/src/content/solver.ts`: pose spaces for anchor and free levels, 64-bit XOR cell hashing from a fixed seed, balanced split with a 5,000,000 option limit, typed-array hash table, exact mask re-check and canonical keys so identical pieces swapping count once.
- Exported `FREE_DEMO_SOURCE` (4 frame-48 pieces, anchor A only) from `game-next/src/content/devLevels.ts` as the shared free-placement fixture.
- Added `game-next/tests/solver.test.ts` with 1/2/0-solution fixtures, identical-piece swap, fewer-piece case, limit cut-off, a 32x32 brute-force cross-check and a regression over every authored source.
- Verification: `npx vitest run tests/solver.test.ts` failed before the module existed and passed after with the prototype-computed counts; typecheck and all tests passed.


### 2026-10-04 - Share grid snapping between drag preview, drop and renderer

- `game-next/src/application/drag.ts` resolves the snap target once per call (`snapTarget`): anchors on anchor levels, `nearestGridOrigin` on free levels with `grid:<x>,<y>` candidate ids, so preview and drop always agree.
- `game-next/src/presentation/BoardRenderer.ts` draws placed pieces like snapped ones, includes them in parity layers and highlights the target silhouette by grid candidate on free levels.
- Verification: the drag sweep test and renderer parity test failed before the change and passed after; typecheck and all tests passed.

### 2026-10-04 - Snap free-placement drops to grid intersections in the session

- Added the `placed` piece state in `game-next/src/domain/model.ts`; `game-next/src/domain/session.ts` snaps drops on free levels through `nearestGridOrigin`, rotates placed pieces in place and rejects out-of-bounds rotations.
- Added `pieceBoardOrigin` in `game-next/src/presentation/layout.ts` and used it for hit testing; `snappedCount` in `game-next/src/application/playController.ts` counts placed pieces.
- Verification: the new session and hitbox tests in `tests/freePlacement.test.ts` failed before the change and passed after; typecheck and all tests passed.


### 2026-10-04 - Add placement mode to level data and validator

- Added `PlacementMode` and required `Level.placement` in `game-next/src/domain/model.ts`; optional `placement` and `allowUnproven` in `game-next/src/content/document.ts`.
- `game-next/src/content/validate.ts` defaults `placement` to `anchors` and rejects `invalid-placement`, `free-placement-extra-anchor`, `free-placement-off-grid`, `free-placement-distractors` and `invalid-allow-unproven`.
- `buildLevelDocument` copies both fields only when present, so committed anchor-mode JSON is unchanged.
- Verification: the new content and authoring tests failed before the change and passed after; typecheck, all tests, `content:validate` and `content:author -- --all` passed with no JSON diff.


### 2026-10-04 - Add grid-intersection snapping helper for free placement

- Added `GRID_STEP`, `SNAP_RADIUS_SQ` and `nearestGridOrigin` in `game-next/src/domain/freePlacement.ts` (spec D FP-03): nearest fitting multiple-of-8 origin within 6 cells, ties by smaller y then x.
- Added `game-next/tests/freePlacement.test.ts` for mid-board, edge, rotated-fit and tie-break cases.
- Verification: `npx vitest run tests/freePlacement.test.ts` failed before the module existed and passed after; `npm run typecheck` and `npm test` passed.


### 2026-10-03 - Complete Plan C approval gate

- `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`: marked Plan C complete and recorded its merge to `main`.
- `docs/ai/ARCHITECTURE.md`: updated the release-gate count to 22 approved campaign levels.
- Verification: typecheck, 420/420 tests, content validation (22 authored levels) and production build pass; GitNexus `detect_changes` reports only low-risk documentation sections and no affected execution flows.

### 2026-10-03 - Approve level 3-10 Mandala Thien Cau

- `game-next/src/content/manifest.ts`: promoted level `3-10` revision `mandala-v1` to `approved`, extending the campaign route after `3-9`.
- Added `docs/testing/mirror-rebuild/3-10-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-9 Sao Bat Phuong

- `game-next/src/content/manifest.ts`: promoted level `3-9` revision `sao-bat-phuong-v1` to `approved`, extending the campaign route after `3-8`.
- Added `docs/testing/mirror-rebuild/3-9-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-8 Kim Tu Thap Nhat Thuc

- `game-next/src/content/manifest.ts`: promoted level `3-8` revision `kim-tu-thap-v1` to `approved`, extending the campaign route after `3-7`.
- Added `docs/testing/mirror-rebuild/3-8-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-7 Hoa Sen

- `game-next/src/content/manifest.ts`: promoted level `3-7` revision `hoa-sen-v1` to `approved`, extending the campaign route after `3-6`.
- Added `docs/testing/mirror-rebuild/3-7-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-6 Meo Than

- `game-next/src/content/manifest.ts`: promoted level `3-6` revision `meo-than-v1` to `approved`, extending the campaign route after `3-5`.
- Added `docs/testing/mirror-rebuild/3-6-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-5 Thuyen Buom Hoang Hon

- `game-next/src/content/manifest.ts`: promoted level `3-5` revision `thuyen-buom-v1` to `approved`, extending the campaign route after `3-4`.
- Added `docs/testing/mirror-rebuild/3-5-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-4 Ngon Nen

- `game-next/src/content/manifest.ts`: promoted level `3-4` revision `ngon-nen-v1` to `approved`, extending the campaign route after `3-3`.
- Added `docs/testing/mirror-rebuild/3-4-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-3 Ca Chep Sao

- `game-next/src/content/manifest.ts`: promoted level `3-3` revision `ca-chep-v1` to `approved`, extending the campaign route after `3-2`.
- Added `docs/testing/mirror-rebuild/3-3-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-2 Den Tien Tri

- `game-next/src/content/manifest.ts`: promoted level `3-2` revision `den-tien-tri-v1` to `approved`, extending the campaign route after `3-1`.
- Added `docs/testing/mirror-rebuild/3-2-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 3-1 Nhat Nguyet Song Huyen

- `game-next/src/content/manifest.ts`: promoted level `3-1` revision `nhat-nguyet-v1` to `approved`, extending the campaign route after `2-6`.
- Added `docs/testing/mirror-rebuild/3-1-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-6 Dai An Ho Menh

- `game-next/src/content/manifest.ts`: promoted level `2-6` revision `dai-an-v1` to `approved`, extending the campaign route after `2-5`.
- Added `docs/testing/mirror-rebuild/2-6-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-5 Dong Ho Cat

- `game-next/src/content/manifest.ts`: promoted level `2-5` revision `dong-ho-cat-v1` to `approved`, extending the campaign route after `2-4`.
- Added `docs/testing/mirror-rebuild/2-5-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-4 Mat Tien Tri

- `game-next/src/content/manifest.ts`: promoted level `2-4` revision `mat-tien-tri-v1` to `approved`, extending the campaign route after `2-3`.
- Added `docs/testing/mirror-rebuild/2-4-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-3 Trai Tim Tinh The

- `game-next/src/content/manifest.ts`: promoted level `2-3` revision `trai-tim-v1` to `approved`, extending the campaign route after `2-2`.
- Added `docs/testing/mirror-rebuild/2-3-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-2 Canh Buom Diep Anh

- `game-next/src/content/manifest.ts`: promoted level `2-2` revision `canh-buom-v1` to `approved`, extending the campaign route after `2-1`.
- Added `docs/testing/mirror-rebuild/2-2-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus `detect_changes` reports only the expected manifest symbol with LOW risk.

### 2026-10-03 - Approve level 2-1 Mui Ten Chi Thien

- `game-next/src/content/manifest.ts`: promoted level `2-1` revision `mui-ten-v1` to `approved`, making it available in the campaign after `1-6`.
- Added `docs/testing/mirror-rebuild/2-1-content-review.md` and updated the Chapter 2–3 review index.
- `game-next/tests/catalog.test.ts`: verified the approved level loads in campaign mode.
- Verification: typecheck, 420/420 tests and content validation (22 authored levels) pass; GitNexus reports LOW impact for `campaignManifest`.

### 2026-10-03 - Update GDD for chapter 2 and Hoa Pham, add review index

- `docs/gdd/master-gdd.md`: replaced the remaining draft Chapter 2 rows with the implemented geometry and piece counts; retained the complete ten-level Hoa Pham table.
- Added `docs/testing/levels/chapter-2-3-review.md`, linking all 16 SVG previews, solver reports and play/drag/win screenshots for the approval gate.
- `docs/ai/STATUS.md`: recorded Task 17 complete and Task 18 waiting for reviewer approval beginning at 2-1.
- Verification: docs-only link and table review; all referenced 16 SVG/report files and 48 screenshots exist. GitNexus impact/detect_changes unavailable in this session.

### 2026-10-03 - Add level 3-10 Mandala Thien Cau (validated)

- Added and registered `3-10` with generated JSON/SVG/report and play/drag/win screenshots; locked its five-layer parity counts in the shared content tests.
- `docs/ai/STATUS.md`: recorded Task 16 complete and Task 17 as the next plan step.
- Verification: authoring reports 4468 target cells, one solution and no fewer-piece solution; typecheck, 420/420 tests and content validation (22 authored levels) pass; all three 720x1280 screenshots were visually inspected. GitNexus impact/detect_changes unavailable in this session.

### 2026-10-03 - Add G audio implementation plans

- Added `docs/superpowers/plans/2026-10-03-g-audio-index.md` (order, branches, five stop points, contracts, nine spec departures) and phase plans `2026-10-03-g0-audio-assets.md` (Tasks 1–2), `2026-10-03-g1-audio-foundation.md` (Tasks 3–9) and `2026-10-03-g2-audio-cues.md` (Tasks 10–12).
- Updated row G in `docs/ai/DOCS-INDEX.md` and the G stream in `docs/ai/STATUS.md`.
- Verification: docs-only; plans self-reviewed against every spec G section and against the F1/F2 plan interfaces they consume (`SceneDirector`, `BackgroundScene`, `FeedbackDirector`, settings). GitNexus impact not needed for docs.

### 2026-10-03 - Add level 3-6 Meo Than (validated)

- `docs/ai/STATUS.md`: plan C tasks 11–12 done, next step is Task 16.
- Added and registered `3-6` with generated JSON/SVG/report and play/drag/win screenshots; its tail `T1` is a parallelogram whose frame box overhangs the right edge, accepted by the cell-based fit from `fix/board-fit-by-cells`.
- `game-next/tests/levelContent.test.ts` and `tests/content.test.ts`: locked 3840 target cells, 256 hollow cells (the two diamond eyes), no revived cells.
- Verification: `content:author -- 3-6` reports 3840 target cells, one solution and no fewer-piece solution — exactly the spec C section 3 numbers; typecheck, 414/414 tests and content validation (21 levels) pass; screenshots re-taken after restarting the dev server and inspected at 720x1280. GitNexus unavailable and skipped.
### 2026-10-03 - Add G audio design spec

- Added `docs/superpowers/specs/2026-10-03-g-audio-design.md`: two ambient tracks streamed via `HTMLAudioElement` and crossfaded on F1 routes, WebAudio SFX driven by F2 `FeedbackEvent`s with snap pitches on a major pentatonic scale, `settings.music`/`settings.sfx` toggles, CC0/Pixabay asset manifest with `ffmpeg-static` processing, and a G0 → G1 → G2 rollout with a reviewer listening stop.
- Registered stream G in `docs/ai/DOCS-INDEX.md` and `docs/ai/STATUS.md`.
- Verification: docs-only change; spec self-reviewed for placeholders and consistency with F1/F2 specs. No code touched, so GitNexus impact analysis was not needed.

### 2026-10-03 - Add level 3-5 Thuyen Buom Hoang Hon (validated)

- Added and registered `3-5` with generated JSON/SVG/report and play/drag/win screenshots; its hull `H1` is the first piece whose frame box overhangs the board, accepted by the cell-based fit from `fix/board-fit-by-cells`.
- `game-next/tests/levelContent.test.ts` and `tests/content.test.ts`: locked 3946 target cells, 217 hollow cells, no revived cells.
- Verification: `content:author -- 3-5` reports 3946 target cells, one solution and no fewer-piece solution — exactly the spec C section 3 numbers; typecheck, 408/408 tests and content validation (20 levels) pass; screenshots inspected at 720x1280. GitNexus unavailable and skipped.

### 2026-10-03 - Add level 3-9 Sao Bat Phuong (validated)

- Added and registered `3-9` with generated JSON/SVG/report, locked its hollow and three-layer revival counts and added play/drag/win screenshots; `3-5` and `3-6` remain planned by reviewer direction.
- Updated `docs/ai/STATUS.md` to record Tasks 13–15 complete and Task 16 as the next Plan C step.
- Verification: authoring reports 1580 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-8 Kim Tu Thap Nhat Thuc (validated)

- Added and registered `3-8` with generated JSON/SVG/report, locked its pyramid/eclipsed-circle parity counts and added play/drag/win screenshots; `3-5` and `3-6` remain planned by reviewer direction.
- Verification: authoring reports 4352 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-7 Hoa Sen (validated)

- Added and registered `3-7` with generated JSON/SVG/report, locked its parity counts and added play/drag/win screenshots; `3-5` and `3-6` remain planned by reviewer direction.
- Verification: authoring reports 3904 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-4 Ngon Nen (validated)

- Added and registered `3-4` with generated JSON/SVG/report, locked its negative-space count and added play/drag/win screenshots.
- Verification: authoring reports 4316 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-3 Ca Chep Sao (validated)

- Added and registered `3-3` with generated JSON/SVG/report, locked its small-detail hollow count and added play/drag/win screenshots.
- Verification: authoring reports 2304 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-2 Den Tien Tri (validated)

- Added and registered `3-2` with generated JSON/SVG/report, locked its hollow-detail counts and added play/drag/win screenshots.
- Verification: authoring reports 5168 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 3-1 Nhat Nguyet Song Huyen (validated)

- Added and registered `3-1` with generated JSON/SVG/report, locked curved-overlap parity counts and added play/drag/win screenshots.
- Verification: authoring reports 4032 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-6 Dai An Ho Menh (validated)

- Added and registered `2-6` with its generated JSON/SVG/report and locked four-layer parity counts; added play/drag/win screenshots.
- Verification: authoring reports 2560 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-5 Dong Ho Cat (validated)

- Added and registered the renamed spec-C `2-5` source plus generated JSON/SVG/report; locked the nested hollow and three-layer revival counts in the shared content test.
- Added 720×1280 play/drag/win screenshots.
- Verification: `content:author -- 2-5` reports 1912 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-4 Mat Tien Tri (validated)

- Added and registered the spec-C source plus generated JSON/SVG/report for `2-4`; locked its hollow and revived-cell counts in the shared content test.
- Added 720×1280 play/drag/win screenshots.
- Verification: `content:author -- 2-4` reports 3200 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-3 Trai Tim Tinh The (validated)

- Added and registered the spec-C source plus generated JSON/SVG/report for `2-3`; locked its three-layer parity counts in `tests/levelContent.test.ts`.
- Added 720×1280 play/drag/win screenshots.
- Verification: `content:author -- 2-3` reports 3712 target cells, one solution and no fewer-piece solution; typecheck, tests and content validation pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-2 Canh Buom Diep Anh (validated)

- Added the spec-C source and generated JSON/SVG/report for `2-2`, registered it as `validated`, and extended the shared content contract with its locked parity counts.
- Added play/drag/win screenshots for visual review.
- Verification: `content:author -- 2-2` reports 3584 target cells, one solution and no fewer-piece solution; full checks and screenshot inspection recorded before commit. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Add level 2-1 Mui Ten Chi Thien (validated)

- `game-next/src/content/sources/2-1.ts`, generated level JSON/SVG/report and three 720×1280 screenshots: added the two-piece chapter-2 parity introduction with the spec-C coordinates and FTUE copy.
- Registered 2-1 in `sources/index.ts`, `catalog.ts`, `manifest.ts` and the authored-level coverage; added the shared `tests/levelContent.test.ts` contract for Plan C levels.
- `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`: started Plan C on `feat/chapter-2-hoa-pham` and confirmed 2-5 as Đồng Hồ Cát.
- Verification: `content:author -- 2-1` reports 1728 target cells, one solution and no fewer-piece solution; typecheck, level-content tests and content validation pass; play/drag/win screenshots inspected at 720×1280. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Record the cell-based board-fit invariant

- `docs/ai/ARCHITECTURE.md`: documented that board fit is measured by real piece cells, not the frame box (`fitsBoard` and `anchorFitsBoard` share the same semantics), with rotating levels requiring the full frame box.
- `docs/ai/STATUS.md`: closed blocker C (frame overhang of 3-5 and 3-6) and recorded plan C tasks 11–12 unblocked; updated active branch and stream.
- `docs/ai/DOCS-INDEX.md`: marked row BF (`plans/2026-10-03-board-fit-by-cells.md`) as `done`.
- `docs/superpowers/plans/2026-10-02-d-free-placement.md`: noted in decision 3 that `authoring.ts` now matches `fitsBoard` cell-based fit semantics.
- Verification: `npm run typecheck`, `npm test` (324/324 passing) and `npm run content:validate` pass; documentation files updated within guidelines.

### 2026-10-03 - Measure board fit by real cells in authoring

- `game-next/src/content/authoring.ts`: added `anchorFitsBoard` checking real cells with `shapeCells` when `rotationEnabled: false` and requiring the whole frame box when `rotationEnabled: true`. Unified `checkSourceGeometry` and `filterDecoys` to use `anchorFitsBoard`.
- `game-next/tests/authoring.test.ts`: added unit tests verifying `3-5 H1` (triangle o6) and `3-6 T1` (parallelogram o1) fit within board bounds, out-of-bounds cells and negative anchors are rejected, and rotating levels still require full frame box fit.
- Verification: `npm run typecheck`, `npm test` (324/324 passing), `npm run content:validate` and `npm run content:author -- --all` pass with no level files changed (`git status --short game-next/src/content/levels docs/testing/levels` empty); GitNexus `detect_changes` passed with low risk.

### 2026-10-03 - Add the board-fit-by-cells plan

- `docs/superpowers/plans/2026-10-03-board-fit-by-cells.md`: two-task plan replacing the frame-box bounds check in `content/authoring.ts` with a cell-based one (`anchorFitsBoard`), keeping the frame rule for `rotationEnabled` levels; no new spec, the authority is spec C §4 coordinates and plan D decision 3.
- `docs/ai/DOCS-INDEX.md`: added row BF, moved C to `in-progress` with the real blocker, corrected B to merged.
- Rationale: `fitsBoard` already measures real cells, so only authoring rejects `3-5 H1` (triangle o6 frame 64 at `(24, 104)`, cells reach y=135 of 160) and `3-6 T1` (parallelogram o1 frame 48 at `(88, 56)`, cells reach x=119 of 128).
- Verification: coordinates and cell extents computed with `shapeCells` on `main` at `1f7777b`; no code changed by this commit.

### 2026-10-03 - Review and merge Plan B into main

- Merged `feat/level-kit-chapters` into `main` (`dee44e5`, `--no-ff`) after review; the three out-of-spec decisions (`chapter-rotation-required`, rotate button driven by `chapters.ts` instead of the chapter number, sample-solution anchors protected from KIT-03) approved as implemented.
- `docs/ai/STATUS.md`: branch back to `main`, B stream marked merged, B decisions closed with the `2-5` rename left as a plan C follow-up; added the gotcha that `Hud` reads the rotate rule from the chapter, not from `level.rotationEnabled`.
- Pushed `main`, `feat/shapes-v2` and `feat/level-kit-chapters` to `origin`.
- Verification: on `main` after merge, `npm run typecheck` clean, `npm test` 319/319 passing, `npm run content:validate` PASS (6 levels + fixture), `npm run build` clean; `content:validate -- --release` fails as designed (28 required, 6 approved); `content:new 3-11 --from 1-2` plus `content:author -- 3-11` PASS with one solution, temporary files removed.

### 2026-10-03 - Complete Plan B and refresh agent context

- `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`: marked Plan B complete on `feat/level-kit-chapters`, recorded the reviewer handoff and current 6/28 release state.
- `docs/ai/ARCHITECTURE.md`: documented `content:new`, level-kit placement, KIT-03 filtering, the 28-level release gate and chapter 4 rotation invariant.
- Verification: Plan B acceptance cloned/authored temporary levels 3-11 and 3-12 without manual edits, both reports had one solution, and the temporary files were removed; final typecheck, tests, content validation and build pass. GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Isolate content:new tests from the live source registry

- `game-next/tests/newLevel.test.ts`: replaced the copied live `sources/index.ts` fixture with a fixed one-level registry so clone tests stay deterministic while plan B acceptance levels are temporarily registered.
- Verification: the plan B acceptance flow keeps temporary levels `3-11` and `3-12` registered while `npm test` passes; GitNexus unavailable and skipped per reviewer direction.

### 2026-10-03 - Update GDD for the four-chapter campaign

- `docs/gdd/master-gdd.md`: section 4 now describes four chapters (6 + 6 + 10 + 6 levels) and the 28-level release gate; rotation moves to chapter 4 everywhere (overview, rotation rules, HUD layout, level select).
- Added the parity (XOR) rule and layer table to section 1.2 and fixed the board size to 128 x 160.
- Appendix B adds the ten Hoa Pham levels, renames 2-5 to Dong Ho Cat and moves the rotation levels to a chapter 4 table as 4-1 to 4-6.
- Verification: grep finds no remaining "18 màn", "từ Chương 3" or "3-1 đến 3-6"; appendix B has 10 chapter-3 rows and 6 chapter-4 rows; `npm test` passes. GitNexus was skipped because it is unavailable, as requested.

### 2026-10-03 - Document the level kit

- Added `docs/content/level-kit.md`: shape table with generated previews, grid and center-to-origin formula, parity table, authoring workflow from `content:new` to `approved`, three annotated sample levels (1-2, 2-3, 3-10) and difficulty tips.
- Added `game-next/scripts/render-kit-gallery.ts` (`npm run content:gallery`) generating `docs/content/kit/*.svg` with `renderPreviewSvg`, and `game-next/tests/levelKitDoc.test.ts` keeping the document in sync with the gallery.
- Verification: the doc test failed before the gallery script existed and passes after (3/3); `npm run content:gallery` wrote exactly 15 images; the 1-2 kit example matches the committed 1-2 source; `npm run typecheck` and `npm test` pass (319/319). GitNexus impact/detect-changes were unavailable because the index reports an invalid non-absolute `repoPath`.

### 2026-10-03 - Derive the constellation map from the 28-level manifest

- Added `game-next/src/presentation/constellationLayout.ts`: chapters and nodes come from the manifest; six-node chapters keep the previous zigzag, while the ten-node Hoa Pham chapter uses a lantern-chain pattern.
- `game-next/src/presentation/LevelSelectScene.ts` draws four constellations with per-chapter tints and titles from `chapterLabel`; a dev-only `?scene=levelSelect&focus=<id>` (`game-next/src/launchParams.ts`, `game-next/src/main.ts`) scrolls to any level for screenshots.
- Added layout overlap and bounds tests to `game-next/tests/levelSelect.test.ts` and screenshots `docs/testing/levels/screens/level-select-{khoi-nguyen,hoa-pham,luan-chuyen}.png`.
- Verification: the layout tests failed before the module existed and pass after; `npm run typecheck`, `npm test` (316/316) and `npm run build` pass; all three visually inspected headless Chrome shots are 720x1280 and show the requested constellations without overlapping nodes.

### 2026-10-03 - Restructure campaign into four chapters and 28 levels

- Added `Chapter = 1 | 2 | 3 | 4` (`game-next/src/domain/model.ts`, `game-next/src/content/document.ts`) and `game-next/src/content/chapters.ts` (names, roman numerals, rotation rule, `RELEASE_LEVEL_COUNT = 28`, `releaseGate`).
- `game-next/src/content/manifest.ts` now lists 28 levels: chapter 2 with 2-5 renamed Dong Ho Cat, new chapter 3 Hoa Pham (3-1 to 3-10), and the rotation chapter renumbered 4-1 to 4-6 with its titles kept; chapter 1 entries are unchanged.
- `game-next/src/content/validate.ts` accepts chapters 1-4, keeps `chapter-rotation-disabled` for chapters 1-3, adds `chapter-rotation-required` for chapter 4 and forbids non-zero turns outside chapter 4.
- `game-next/scripts/validate-content.ts --release` requires 28 approved levels; `game-next/src/presentation/Hud.ts` shows the rotate button only in chapter 4.
- Updated manifest-dependent assertions in content, catalog, menu, progress, hud, levelSelect and session tests.
- Verification: the updated tests failed against the 18-level manifest and pass after; `npm run typecheck`, `npm test` (310/310), `npm run content:validate` and `npm run content:author -- --all` pass with no level data change; `content:validate -- --release` fails as expected with "Required 28 approved levels, found 6"; GitNexus impact/detect-changes were unavailable because the CLI reported no indexed repositories.

### 2026-10-03 - Add level template and content:new clone command

- Added `game-next/src/content/sources/_template.ts`, a minimal valid source (one 48 square at the board center) with a Vietnamese comment per field; it is not registered in `LEVEL_SOURCES`.
- Added `game-next/src/content/newLevel.ts` (const name and slug from Vietnamese titles, field rewrite, sorted registration in `sources/index.ts`) and `game-next/scripts/new-level.ts` behind `npm run content:new -- <id> [--from <id>] [--title "<name>"]`; existing ids in `sources/` or `studio/` are refused.
- Added `game-next/tests/newLevel.test.ts`, which runs the command logic on temporary directories.
- Verification: the new test failed before the modules existed and passes after (18/18); a trial `content:new` + `content:author` on throwaway id `9-1` passed and all generated artifacts were removed; `npm run typecheck`, `npm test` (301/301), and `npm run content:validate` pass. GitNexus impact and detect-changes were unavailable because no GitNexus tools are exposed in this session.

### 2026-10-03 - Drop unsafe decoy anchors during authoring

- Added `filterDecoys` to `src/content/authoring.ts`: decoy anchors outside the board, or equal to the A anchor of another piece with the same shape, orientation and frame, are dropped before geometry checks; distractors pointing at dropped anchors are removed (KIT-03).
- `renderReportMarkdown` in `src/content/authoringReport.ts` lists dropped anchors; `scripts/author-level.ts` passes them through.
- Added the 3-8 twin-circle regression to `tests/authoring.test.ts` (one solution after filtering, two without), and kept the existing protected-solution regression explicit in `tests/authoringReport.test.ts`.
- Verification: the new tests failed before `filterDecoys` existed and pass after; `npm run typecheck`, `npm test` (283/283), `npm run content:author -- --all` and `npm run content:validate` pass with no committed level data or report diff; GitNexus impact and detect-changes were unavailable because the CLI reported no indexed repositories.

### 2026-10-03 - Add level kit placement helpers

- Added `src/content/kit.ts` with `piece` (center-based placement), `mirrorX`, `mirrorY`, `concentric`, `row` and the `NUDGE`/`CROSS` decoy offsets; every helper rejects off-grid origins and frames that fail `isValidFrame`.
- Added `tests/kit.test.ts` comparing mirrored triangles and parallelograms by cell sets.
- Verification: `npx vitest run tests/kit.test.ts` failed before the module existed and passes after (13/13); `npm run typecheck` and `npm test` pass (277/277).

### 2026-10-03 - Review and merge Plan A shapes v2 into main

- Merged `feat/shapes-v2` into `main` (`55da659`, `--no-ff`) after review; both out-of-spec decisions (two-tier frame check `isStructuralFrame`/`isValidFrame`, 1.5% circle intersection tolerance) approved as implemented.
- `docs/ai/STATUS.md`: branch back to `main`, A stream marked merged, A decision closed; added gotchas for the parallelogram frame palette (48/96 only) and the WSL/CRLF + Windows `node_modules` workflow.
- Verification: on `main` after merge, `npm run typecheck` clean, `npm test` 264/264 passing, `npm run content:validate` PASS (6 levels + fixture), `npm run build` clean with `grep -c dev-shapes-v2 dist/assets/*.js` = 0; `git diff --check` clean.

### 2026-10-03 - Complete Plan A shapes v2 implementation and update docs

- `docs/ai/DOCS-INDEX.md`: marked row A (`Shapes v2`) as `done`.
- `docs/ai/STATUS.md`: updated current branch (`feat/shapes-v2`), streams, and next steps for Plan B.
- Verification: link check clean; `npm run typecheck`, `npm test` (264/264 passing), `npm run content:validate`, `npm run build` all pass.

### 2026-10-03 - Add dev-only shapes v2 test level

- `game-next/src/content/devLevels.ts`: defined runtime dev-only harness level `dev-shapes-v2` featuring two overlapping 64-frame circles (lens XOR intersection), a 48-frame parallelogram, and a 24-frame small triangle.
- `game-next/src/content/catalog.ts`: enabled `loadLevel` to resolve dev levels from `DEV_LEVEL_DOCUMENTS` when `mode === 'harness'` and `import.meta.env.DEV` is active (tree-shaken in production).
- `game-next/tests/catalog.test.ts`: added test confirming `dev-shapes-v2` loads in harness mode with expected shape kinds/sizes and throws in campaign mode.
- `game-next/tests/authoringReport.test.ts`: verified SVG preview generation with 32 vertices for circles and 4 for parallelograms.
- `docs/testing/levels/screens/dev-shapes-v2-{play,drag,win}.png`: captured headless Chrome screenshots verifying bezel rendering, empty XOR lens region on circle overlap, and victory dialog.
- Verification: `npm run typecheck`, `npm test` (264/264 passing), `npm run content:validate`, `npm run build` all clean; `dev-shapes-v2` verified 0 occurrences in `dist/assets/*.js`; GitNexus `detect_changes` verified changes bounded to `loadLevel`.

### 2026-10-03 - Validate and author circle and parallelogram pieces

- `game-next/src/content/validate.ts`: updated `validateLevel` to accept `circle` and `parallelogram` pieces, enforce structural frame integrity with `isStructuralFrame`, require `orientation` for triangles and parallelograms, and verify raster cells against `shapeCells`.
- `game-next/src/content/authoring.ts`: added grid-snapping frame checks in `checkSourceGeometry` via `isValidFrame`, and preserved `orientation` for parallelograms in `buildLevelDocument`.
- `game-next/tests/content.test.ts`: added test coverage for valid circle/parallelogram pieces, missing orientation rejection, and structural frame rejection.
- `game-next/tests/authoring.test.ts`: added tests for frame rejection on non-grid frames and orientation persistence for parallelograms.
- `game-next/tests/polygonClip.test.ts`: added test for lens intersection area of overlapping circles matching theoretical formula within 1.5% tolerance.
- Verification: `npm run typecheck` clean; `npm test` 261/261 passing; `content:validate` and `content:author -- --all` green with no JSON diffs; GitNexus `detect_changes` verified changes in validate and authoring.

### 2026-10-03 - Add circle and parallelogram shapes with per-shape frame rules

- `game-next/src/domain/model.ts`: added `circle` and `parallelogram` to `ShapeKind`, updated `Orientation` JSDoc.
- `game-next/src/domain/shapes.ts`: implemented 32-segment regular polygon `circle` and 4-orientation `parallelogram`, added `isValidFrame` (spec A section 3 grid snapping) and `isStructuralFrame` (validator integer-vertex & board checks), added `mirrorOrientation` across x and y axes, and added `CIRCLE_SEGMENTS` constant.
- `game-next/src/content/document.ts`: typed `LevelDocument.pieces[].shapeKind` as `ShapeKind`.
- `game-next/tests/shapes.test.ts`: added test coverage for polygon generation, cell count verification (208, 812, 3196 for circle; 512 for parallelogram), mirroring, rotation, and frame rules.
- Verification: `npm run typecheck` clean; `npm test` 254/254 passing; GitNexus `detect_changes` verified changes bounded to shapes symbols.

### 2026-10-03 - Commit UI mockups for a next pass and drop unused reference images

- Added `docs/gui/ỉmprove-2/` (`gameplay.png`, `main.png`, `map.png`, `match.png`): mockups for a possible next UI pass, already listed in `docs/ai/DOCS-INDEX.md`; no spec yet.
- Removed `docs/ref/image.png`, `image copy.png`, `image copy 2.png`, `image copy 3.png` (deleted in the working tree, not referenced by any doc); the two 2026-09-17 screenshots remain.
- Verification: `git grep` finds no reference to the removed images; no runtime code changed.

### 2026-10-03 - Merge docs/level-system-specs into main and repoint branch references

- Merged `docs/level-system-specs` into `main` (fast-forward); `game-next` tests 243/243 on the merged result.
- `docs/ai/STATUS.md`: branch is now `main`; new work branches from `main`. `docs/superpowers/plans/2026-10-03-f-motion-index.md` and `2026-10-03-f1-1-nen-tang.md`: `feat/motion-f1` now branches from `main`.
- Verification: grep for `level-system-specs` leaves only historical mentions (CHANGELOG, the completed AI onboarding plan, plan E's note); GitNexus MCP unavailable, detect_changes not run; no runtime code changed.

### 2026-10-03 - Tighten AI onboarding protocol after final review

- `AGENTS.md`: defined "task" and made the controller the only STATUS/DOCS-INDEX writer in subagent runs; start-of-task now checks STATUS against git; GitNexus stats-line changes ride along with the next commit.
- `docs/ai/STATUS.md`: next step links the F1-1 phase plan; E1–E3 skeleton note; removed a rule duplicated from `AGENTS.md`. `docs/ai/ARCHITECTURE.md`: documented the fixture runner under Tests.
- Verification: link check passes (expected branch-name line only); `AGENTS.md` within 120 lines outside the GitNexus block; `STATUS.md` within 60 lines; GitNexus MCP unavailable, detect_changes not run; no runtime code changed.

### 2026-10-03 - Pass the AI onboarding cold-start test

- A fresh subagent reading only `AGENTS.md` and `docs/ai/*` answered the five spec questions correctly without opening `docs/superpowers/`; marked row `AI` done in `docs/ai/DOCS-INDEX.md` and refreshed `docs/ai/STATUS.md`.
- Verification: cold-start test passed (1 attempt); link check over all onboarding files passes; GitNexus MCP unavailable, detect_changes not run; no runtime code changed.

### 2026-10-03 - Rewrite README for the game-next rebuild

- Rewrote `README.md` (Vietnamese): `game-next/` as the active product with Node 24 commands and Android build, `game/` marked legacy, links to `AGENTS.md`, `docs/ai/STATUS.md` and `docs/ai/DOCS-INDEX.md`.
- Verification: link check passes; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add shared AGENTS.md entry point for Claude Code, Codex and Antigravity

- Rewrote `AGENTS.md` as the canonical agent entry: project summary, where to work (`game-next/` vs legacy `game/`), start- and end-of-task protocols, commands, rules (English specs and plans, CHANGELOG per commit, level approval flow), with the GitNexus block kept unchanged.
- `CLAUDE.md` now imports `@AGENTS.md`; added `.agent/rules/agents.md` for Antigravity; committed `.claude/skills/gitnexus/`; ignored `.shots/`.
- Verification: link check passes; `AGENTS.md` within 120 lines outside the GitNexus block; GitNexus blocks byte-identical to the previous version; `.shots/` ignored; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add current status file for agents

- Added `docs/ai/STATUS.md`: branch, product state, next step, streams with entry docs, open decisions and recent gotchas; overwritten at the end of every task.
- Verification: link check passes; 60-line limit respected; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add game-next architecture map for agents

- Added `docs/ai/ARCHITECTURE.md`: layers with known dependency exceptions, boot and scene flow with line references, gameplay flow, level content pipeline and review flow, invariants, localStorage keys, GitNexus hotspots, test conventions.
- Verification: link check and `game-next/`-relative path check pass; grid size, storage keys and test count checked against code; hotspots measured with GitNexus `impact`; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add docs registry for AI onboarding

- Added `docs/ai/DOCS-INDEX.md`: every spec and plan in `docs/superpowers/` grouped into 21 rows with a fixed state vocabulary, split into active and history tables, plus one line per other doc folder.
- Verification: link check passes; every spec and plan file is referenced; state cells counted; no runtime code changed; GitNexus MCP unavailable, detect_changes not run.

### 2026-10-03 - Add implementation plan for AI onboarding context

- Recorded reviewer approval of `docs/superpowers/specs/2026-10-03-ai-onboarding-context-design.md` by NKhanh0908: "duyệt spec".
- Added `docs/superpowers/plans/2026-10-03-ai-onboarding-context.md` (6 tasks): docs registry `docs/ai/DOCS-INDEX.md` with reviewer confirmation of uncertain states, architecture map `docs/ai/ARCHITECTURE.md` with GitNexus hotspot measurement, `docs/ai/STATUS.md`, shared `AGENTS.md` entry with `CLAUDE.md` import and Antigravity rule, Vietnamese `README.md` rewrite, and a cold-start acceptance test by a fresh subagent.
- Verification: registry draft dry-run against every spec and plan file (none unlisted, no broken paths, 21 state cells); architecture facts gathered from code by a research pass; GitNexus `analyze` failed (LadybugDB WAL checkpoint) and the MCP server disconnected, so hotspot measurement is deferred to plan task 2; no runtime code changed.

### 2026-10-03 - Add spec for AI onboarding context

- Added `docs/superpowers/specs/2026-10-03-ai-onboarding-context-design.md`: canonical `AGENTS.md` entry for Claude Code, Codex and Antigravity, plus `docs/ai/STATUS.md`, `docs/ai/ARCHITECTURE.md` and `docs/ai/DOCS-INDEX.md`; agents refresh status at the end of every task; `game/` marked legacy; new specs and plans are written in English.
- Verification: placeholder and consistency self-review; no runtime code changed.

### 2026-10-03 - Note single-repo GitNexus setup in the motion index

- Updated the GitNexus section of `docs/superpowers/plans/2026-10-03-f-motion-index.md`: only this repository is indexed locally now, so the `repo` parameter is optional; examples keep it for safety.
- Verification: `list_repos` returns only ASOL-GAME-02; no runtime code changed.

### 2026-10-03 - Add GitNexus workflow to the motion plans index

- Added a GitNexus section to `docs/superpowers/plans/2026-10-03-f-motion-index.md`: `impact` before editing an existing symbol, `detect_changes` before each commit, `analyze` after it, `rename` for renames, and the required `repo: "ASOL-GAME-02"` parameter because several repositories are indexed locally.
- Recorded the measured CRITICAL risk of `BoardRenderer` (5 direct dependants, 6 `PlayScene` flows), touched by F1 task 9 and rewritten by F2 task 6.
- Verification: refreshed the index with `node .gitnexus/run.cjs analyze` (3,097 nodes, 7,677 edges, 255 flows) and ran `impact` on `BoardRenderer` through MCP; no runtime code changed.

### 2026-10-03 - Split motion plans F1 and F2 into phase files and add the F index

- Replaced `docs/superpowers/plans/2026-10-03-f1-scene-transitions.md` with `2026-10-03-f1-1-nen-tang.md` (tasks 1-3), `f1-2-director.md` (4-6) and `f1-3-dan-dung.md` (7-10); replaced `2026-10-03-f2-in-level-game-feel.md` with `f2-1-logic.md` (1-4), `f2-2-renderer.md` (5-7) and `f2-3-phan-hoi.md` (8-10). Each phase file carries its own goal, deliverable, position, global constraints and file map; task numbers are unchanged.
- Added `docs/superpowers/plans/2026-10-03-f-motion-index.md`: execution order across F1-F3 with branches, roles (coordinator, per-task implementer subagent, reviewer), main flow, five reviewer stop points, in-phase manual checks, cross-plan interface contracts and precomputed route timings, texture memory and rotation fixture.
- Verification: every task section in the phase files is byte-identical to the original plans (scripted comparison); references in plan F3 and spec F2 updated to the new file names; no runtime code changed.

### 2026-10-03 - Add implementation plans F2 and F3 and record plan-time spec corrections

- Added `docs/superpowers/plans/2026-10-03-f2-in-level-game-feel.md` (10 tasks: mask caching, pose smoothing, parity diff and feedback events, haptics 8.0.2, frame-spread texture baking, `PieceView` renderer, overlap and preview effects, `FeedbackDirector`, 1800 ms victory sequence, F1 integration) and `2026-10-03-f3-motion-acceptance.md` (9 tasks: perf stats and recorder, dev tool flags, rotation fixture, director measurement hooks, autosolve scripts, overlay and time scale, demo runner, acceptance records, Claude's automated and desktop pass).
- Reconciled the plans: F3 alone owns the measurement hooks (`onWindow` on both directors, `pieceTextureBytes.ts`) and calls F2's `handle`, `playVictory` and four-argument `feedbackEvents`.
- Appended plan-time corrections to specs F2 (measured texture memory 0.74 MiB per piece and orientation, no separate ghost texture, black/white shadow textures instead of `setTintFill`, 25% padding, `feedbackEvents` subject, 600 ms resonance rings) and F3 (1-3 for the overlap demo, three-piece chapter-3 rotation fixture, rotation button driven by `rotationEnabled`, director time scale, harness under `VITE_MOTION_TOOLS`).
- Verification: texture sizes computed from every `frameSize` in `game-next/src/content/levels/*.json`; `@capacitor/haptics` versions read with `npm view`; cross-plan interface names checked by grep; placeholder scan; no runtime code changed.

### 2026-10-03 - Add implementation plan F1 and correct the next-level timing

- Added `docs/superpowers/plans/2026-10-03-f1-scene-transitions.md` (10 tasks): motion primitives, self-clocked timeline, step-table choreography and route tables, persisted reduced motion, sky moods with a persistent `BackgroundScene`, `SceneDirector` with a source gate on `scene.start`, then menu, map and play choreography.
- Corrected spec F1 section 3.3: `next-level` now runs its out-phase 0-800 ms and restarts at 800 ms, so the route totals 1500 ms as stated (the first draft shifted the in-phase and summed to 1200 ms).
- Verification: route milestones recomputed against every step table in the plan; placeholder and type-consistency self-review; no runtime code changed.

### 2026-10-03 - Add spec F3 (motion acceptance) after approving F1 and F2

- Recorded reviewer approval of specs F1 and F2 by NKhanh0908: "duyeejt spec".
- Added `docs/superpowers/specs/2026-10-03-f3-motion-acceptance-design.md`: dev-only tools (`fps`, `motion` slow-motion, `demo`/`loop` route replay, extended `autosolve` scripts, `perf` frame-time windows, a `fixture-rotate` level because every Chapter 1 level disables rotation), seven numeric performance thresholds, a 31-item acceptance matrix for F1, F2 and regressions, and per-spec acceptance records under `docs/testing/motion/` that follow the existing content-review format.
- Verification: checked `launchParams.ts`, `fixtures.ts`, the existing review records and that all six level files set `rotationEnabled: false`; spec self-review; no runtime code changed.

### 2026-10-03 - Add spec F2 (in-level game feel)

- Added `docs/superpowers/specs/2026-10-03-f2-in-level-game-feel-design.md`: a per-frame render loop, pieces baked once into textures and shown as images with smoothed display poses, pure `feedbackEvents` derived from transitions, effects for lift, drag, magnet, snap, return, rotate, blocked rotation and XOR overlap changes, an 1800 ms skippable victory sequence, haptics through `@capacitor/haptics` with a persisted setting, and removal of redundant mask evaluation while dragging.
- Depends on spec F1 for `motionScale`, `TransitionTimeline` and the reduced-motion setting.
- Verification: checked the current renderer, controller, drag and session code paths the spec replaces (unused `previewMask`, frame-independent rings, stub settings toggles); estimated texture memory for a six-piece rotating level; spec self-review; no runtime code changed.

### 2026-10-03 - Add spec F1 (motion foundation and cinematic scene transitions)

- Added `docs/superpowers/specs/2026-10-03-f1-scene-transitions-design.md`: a persistent `BackgroundScene` owning one sky, a `SceneDirector` that replaces every direct `scene.start`, choreographed in/out timelines for seven routes (1500 ms into play, about 1000 ms elsewhere, always full with tap-to-skip), and a persisted reduced-motion setting that collapses every route to a 150 ms crossfade.
- In-level game feel (lift, snap, rotate, XOR overlap, victory sequence, texture-based pieces) is deferred to spec F2.
- Verification: coordinates and timings checked against `LAYOUT_TOKENS`, `MenuScene` emblem position and the current scene entry points; spec self-review; no runtime code changed.

### 2026-10-02 - Add partial plan E (level studio), paused

- Added `docs/superpowers/plans/2026-10-02-e-level-studio.md` with header, global constraints, 15 decisions and precomputed difficulty numbers for 22 levels; tasks are not written yet. A placeholder section lists the 13 planned tasks and marks the pause point.
- Recorded an open issue found while planning: sources 3-5 and 3-6 in spec C have piece frames outside the board, which `checkSourceGeometry` rejects; must be resolved before running plan C.
- Verification: difficulty thresholds checked against 22 levels with a scratch prototype (all within 1 of the estimate); no runtime code changed.

### 2026-10-02 - Add implementation plans A-D for the level system

- Added `docs/superpowers/plans/2026-10-02-a-shapes-v2.md` (3 tasks), `-b-level-kit-chapters.md` (7 tasks), `-c-chapter-2-hoa-pham-levels.md` (18 tasks) and `-d-free-placement.md` (8 tasks). Execution order: A, B, then C and D in parallel; plan E follows.
- Verification: cross-checked shared interfaces between plans (kit `concentric` signature extended by D after B, manifest titles and orders identical in B and C, dev-level mechanism from A reused by D); placeholder scan; no runtime code changed.

### 2026-10-02 - Add level system specs A-E (shapes v2, level kit, chapter 2 + Hoa Pham content, free placement, level studio)

- Added five specs under `docs/superpowers/specs/2026-10-02-{a..e}-*.md`: circle and parallelogram shapes with per-shape frame rules; `content:new` clone command, composition kit and 4-chapter campaign (28 levels); 16 levels for chapter 2 (new 2-5 Dong Ho Cat) and chapter 3 Hoa Pham; free placement mode that snaps to grid intersections with a meet-in-the-middle XOR solver; a dev-only level studio that saves into `src/content/studio/` with an automatic difficulty score.
- Recorded the decision to keep the even-odd (XOR) visibility rule over an "overlap hides" rule.
- Added draft previews `docs/testing/levels/drafts/chapter-2-draft.png` and `hoa-pham-draft.png`.
- Verification: every level coordinate, solution count, hollow and revived cell count computed by an independent scratch prototype (16 levels, each with exactly one solution and up to three decoy anchors per piece); spec self-review for cross-spec consistency; no runtime code changed.

### 2026-10-02 - Approve level 1-6 Vuong Mien Binh Minh

- Set `1-6` to `approved` (`vuong-mien-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-6-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-5 Chiec Thuyen Sao

- Set `1-5` to `approved` (`thuyen-sao-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-5-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-4 Ngon Hai Dang

- Set `1-4` to `approved` (`hai-dang-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-4-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.

### 2026-10-02 - Approve level 1-3 Canh Chim Bao Diem

- Set `1-3` to `approved` (`canh-chim-v1`) in `game-next/src/content/manifest.ts`, added `docs/testing/mirror-rebuild/1-3-content-review.md` and updated `docs/testing/levels/chapter-1-review.md`.
- Verification: `npm run typecheck`, `npm test` and `npm run content:validate` passed; reviewer approved 1-3 to 1-6 together.
- Changed `game-next/tests/levelSelect.test.ts` to use a mock manifest with 1-3 as `validated`, so the harness-vs-campaign check no longer depends on real approval statuses.

### 2026-10-02 - Synchronize harness progress with the constellation map

- Added a transient harness preview trail so levels completed while reviewing validated content appear completed on the map and advance the current node.
- Made validated levels playable from the map only in harness mode, while campaign continues to require approved content and retain its persisted progress unchanged.
- Preserved the furthest harness preview when replaying an earlier level and forwarded harness mode through map and next-level navigation.
- Verification: two map synchronization regressions and the replay regression failed before implementation; all 31 focused tests and all 243 tests across 30 files then passed; content validation and production build passed. Chrome snapshots remained unused under the user waiver. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Fix Vietnamese level titles and long HUD text

- Switched level names in the play header and victory card from Playfair Display to a Vietnamese-complete Be Vietnam Pro stack with system fallbacks.
- Fit long header titles into the 448px safe area between navigation controls, with a 32px minimum size.
- Reduced victory verse text to 18px so two-line verses retain space from the level title and action buttons.
- Verification: two HUD regressions failed before implementation, then all 19 focused HUD/token tests and all 240 tests across 30 files passed; typecheck and production build passed. Chrome snapshots remained unused under the user waiver. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Approve level 1-2 Bao Thap Tien Tri

- Promoted `bao-thap-v1` from `validated` to `approved` after direct harness review by NKhanh0908: “ok ngon nha”.
- Updated campaign navigation and catalog expectations so completing 1-1 unlocks the playable 1-2 successor.
- Added the 1-2 content review record and updated the Chapter 1 review index.
- Verification: the four stale pre-approval expectations failed after promotion, then 50 focused tests and all 238 tests across 30 files passed; typecheck and content validation also passed.

### 2026-10-02 - Update GDD chapter 1 level sheets and add review index

- Updated the GDD geometry, anchors, shape orientations and piece lists for Chapter 1 levels 1-1 through 1-6.
- Added a review index linking every SVG preview, solution report and direct development harness URL.
- Recorded the user-requested Chrome snapshot waiver; visual acceptance is performed directly in the harness.

### 2026-10-02 - Add level 1-6 Vuong Mien Binh Minh (validated)

- Added the authored source, generated artifacts and content regressions for the two wings and center diamond in level 1-6.
- Registered `vuong-mien-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-6 had no source; authoring produced 3,456 target cells, one solution and no fewer-piece solution; all six authored levels regenerated successfully; typecheck, all 238 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-5 Chiec Thuyen Sao (validated)

- Added the authored source, generated artifacts and content regressions for the square hull, bow and sail in level 1-5.
- Registered `thuyen-sao-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-5 had no source; authoring produced 4,560 target cells, one solution and no fewer-piece solution; typecheck, all 231 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-4 Ngon Hai Dang (validated)

- Added the authored source, generated artifacts and content regressions for the three-tier lighthouse in level 1-4.
- Registered `hai-dang-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-4 had no source; authoring produced 4,032 target cells, one solution and no fewer-piece solution; typecheck, all 224 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-3 Canh Chim Bao Diem (validated)

- Added the authored source, generated artifacts and content regressions for the two mirrored wing triangles in level 1-3.
- Registered `canh-chim-v1` for harness play in `validated` state.
- Verification: the focused test first failed because 1-3 had no source; authoring produced 2,304 target cells, one solution and no fewer-piece solution; typecheck, all 217 tests across 30 files and content validation passed.

### 2026-10-02 - Add level 1-2 Bao Thap Tien Tri (validated)

- Added the authored source, generated JSON, SVG preview and solution report for level 1-2 with one square and one roof triangle.
- Registered `bao-thap-v1` for harness play in `validated` state and added shared Chapter 1 content regressions.
- Verification: the focused test first failed because 1-2 had no source; authoring produced 2,880 target cells, one solution and no fewer-piece solution; typecheck, all 210 tests across 30 files and content validation passed.

### 2026-10-02 - Add 1-1 renderer evidence screenshots

- Added `docs/testing/levels/screens/1-1-{play,drag,win}.png`, captured with `game-next/scripts/shoot-level.sh` after the polygon renderer, parity overlap and N-slot tray changes (plan phase 2, Task 8 evidence).
- Verification: reviewed all three captures (target silhouette, tray wells, drag shadow with snap label, victory card); `npm run typecheck`, `npm test` (203 passed), `npm run content:validate` and `npm run build` green.

### 2026-10-02 - Remove the faint victory-center sparkle

- Removed the small four-ray sparkle from `game-next/src/presentation/BoardRenderer.ts` after manual acceptance feedback; the board pulse, camera flash and resonance rings remain.
- Updated `game-next/tests/boardRendererLayers.test.ts` to reject the removed white sparkle while preserving victory-layer ordering.
- Verification: focused renderer-layer regression failed before the change and passed afterward; `npm run typecheck`, all 203 tests across 29 files, and `npm run build` passed. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Add dev-only harness mode via URL

- Added a tested launch resolver: URL harness mode is enabled only in development; production launches use campaign mode.
- Forwarded the launch mode into PlayScene and preserved it for the next level, returning to the menu when the next level is unavailable in that mode.
- Verification: four resolver tests failed for the missing module, then passed; typecheck, all 203 tests across 29 files, content validation, and production build passed. Chrome snapshots were waived by the user; manual harness acceptance remains pending. Vite retained its existing large-chunk advisory.

### 2026-10-02 - Keep moving pieces above parity overlays and reject missing captures

- Split `game-next/src/presentation/BoardRenderer.ts` into constructor-allocated snapped/parity, temporary, dragging, and victory layers; overlapping snapped pieces no longer cover a third moving piece.
- Hardened `game-next/scripts/shoot-level.sh`: remove stale output, require a fresh nonempty PNG, preserve Chrome diagnostics, and stop subsequent captures on failure while accepting nonzero Chrome exits that produced an image.
- Added combined-state draw-order regressions in `game-next/tests/boardRendererLayers.test.ts` and shell-independent capture source checks in `game-next/tests/shootLevel.test.ts`. All three failed before the fixes, then passed; typecheck, all 199 tests across 28 files, content validation, and production build passed. Chrome remained unused under the user's waiver; visual acceptance remains pending.

### 2026-10-02 - Render real piece polygons, exact parity overlap and N-slot tray

- Added `maskCentroid` in `game-next/src/domain/mask.ts` and three tests in `game-next/tests/boardRenderer.test.ts`; victory effects now use the target centroid.
- Updated `game-next/src/presentation/BoardRenderer.ts`, `TargetBadge.ts`, and `PlayScene.ts` to draw real shape polygons, derive targets from solution placements, apply exact even-odd overlaps, and pass the level piece count through tray rendering and autosolve.
- Added `game-next/scripts/shoot-level.sh` with the planned play/drag/win capture interface. Chrome snapshots were waived by the user; before/after visual acceptance remains pending manual review, including Task 6 jewel styling.
- Verification: centroid tests failed for the missing helper before implementation, then all six focused tests and all 196 tests across 26 files passed; `npm run typecheck`, `npm run content:validate`, and `npm run build` passed. Vite reported its existing large-chunk advisory.

### 2026-10-02 - Piece polygons on canvas and N-slot tray

- Added board and centered piece polygons using shared shape orientation, with a diamond fallback for legacy pieces. Added tray slot widths and inset well rectangles, and limited tray hitboxes and piece radii by slot width.
- Passed the level piece count through pointer selection and drag initialization. Verification: six focused tests failed before implementation; all 19 layout tests, all 193 tests across 26 files, and `npm run typecheck` passed.

### 2026-10-02 - Keep convex jewel outlines inside piece boundaries

- Offset each convex polygon edge inward by half the stroke width and intersect adjacent offset lines, so triangle and square outlines follow their outer edges. Preserve the prior radius-scaled outline only for axis-aligned diamonds with equal diagonals.
- Added roof edge-distance, square, reversed-winding, and legacy diamond geometry regressions. The old uniform scaling failed three focused tests; the corrected focused suite passed all 17.

### 2026-10-02 - Draw jewel facets for any convex polygon

- Added polygon centroid, scaling, facets, table and spine geometry; added `drawJewelPolygon` and retained the `drawJewel` API through delegation.
- Verification: five new geometry cases failed for missing functions before implementation, then all 13 focused tests passed; `npm run typecheck` passed; `npm test` passed (182 tests across 26 files). Phaser visual verification is deferred to Task 8's required Chrome before/after screenshots.

### 2026-10-02 - Add convex polygon clipping and parity layers

- Added convex polygon intersection and ordered even-odd parity layers in `game-next/src/presentation/polygonClip.ts`, with seven focused geometry tests.
- Verification: focused test failed before implementation because the module was missing, then passed (7 tests); `npm run typecheck` passed; `npm test` passed (177 tests across 26 files).

### 2026-10-02 - Add solution search and SVG previews to level authoring

- Added exhaustive anchor/tray solution search, distractor cell differences, Markdown reports and SVG previews in `game-next/src/content/authoringReport.ts`, with five cases in `game-next/tests/authoringReport.test.ts`.
- Updated `game-next/scripts/author-level.ts` to generate reports and reject fewer-piece solutions; documented `content:author` in `game-next/README.md` and generated `docs/testing/levels/1-1.svg` and `docs/testing/levels/1-1-report.md` without changing level JSON.
- Verification: focused suite failed for the missing module before implementation, then passed (5 tests); `npm run content:author -- 1-1` passed (2304 target cells, 1 solution, 0 fewer-piece solutions); `npm run typecheck` passed; `npm test` passed (170 tests); `npm run content:validate` passed. SVG XML structure and polygon coordinates inspected; visual rendering unavailable in this session.

### 2026-10-02 - Reject explicit null piece orientation

- Updated `game-next/src/content/validate.ts` to validate supplied orientations directly and default only omitted square or diamond orientations to 0; explicit null now produces `invalid-orientation`.
- Added a regression in `game-next/tests/content.test.ts` using a triangle with valid orientation 0 cells and explicit null orientation.
- Verification: regression failed before the fix; `npx vitest run tests/content.test.ts` passed (15 tests); `npm run typecheck` passed; `npm test` passed (165 tests); `npm run content:validate` passed.

### 2026-10-02 - Validate piece shapes, orientations and target placements

- Added optional shape metadata to `Piece` and sample target placements to `Level` in `game-next/src/domain/model.ts`; `game-next/src/content/validate.ts` always fills these fields and rejects invalid shapes, orientations, duplicate cells and cells that differ from the shared shape polygons.
- Updated `game-next/src/content/fixtures.ts` to generate the adjacent diamond fixture with the top-left boundary rule using independent inequalities (800 cells per diamond); added seven validation cases in `game-next/tests/content.test.ts`.
- Verification: `npx vitest run tests/content.test.ts` passed (14 tests), following seven expected failures before implementation; `npm run typecheck` passed; `npm test` passed (164 tests); `npm run content:validate` passed.

### 2026-10-02 - Author levels from source files; regenerate 1-1 as song-tinh-v2

- Added optional orientation to `game-next/src/content/document.ts`, authoring geometry checks and document generation in `game-next/src/content/authoring.ts`, sources in `game-next/src/content/sources/`, and coverage in `game-next/tests/authoring.test.ts`.
- Added `game-next/scripts/author-level.ts` and `content:author` in `game-next/package.json`; removed `game-next/scripts/regen-level-geometry.ts`.
- Regenerated `game-next/src/content/levels/1-1.json` and updated `game-next/src/content/manifest.ts` to `song-tinh-v2`; recorded human approval in `docs/testing/mirror-rebuild/1-1-content-review.md`. Metadata, anchors and solutions remain unchanged; each diamond has 1,152 cells and the target has 2,304 cells.
- Verification: `npm run typecheck` passed; `npm test` passed (157 tests); `npm run content:validate` passed; `npm run build` passed with the existing large chunk warning.

### 2026-10-02 - Add shared shape module

- Added `ShapeKind` and `Orientation` in `game-next/src/domain/model.ts`, and shared square, diamond and triangle polygons with top-left-rule cell rasterization in `game-next/src/domain/shapes.ts`; geometry coverage is in `game-next/tests/shapes.test.ts`.
- Verification: `npm run typecheck` passed; `npm test` passed (150 tests).

### 2026-10-02 - Add chapter 1 implementation plans and spec corrections

- Added `docs/superpowers/plans/2026-10-02-chapter-1-levels-index.md` and three phase plans (`-1-nen-mong`, `-2-renderer`, `-3-noi-dung`) covering 16 tasks: shape module, authoring pipeline, validator, renderer, N-slot tray, harness mode, five levels, GDD update and per-level review.
- Corrected `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`: rotation commitment (CH1-03) stated as boundary-only differences, 1-1 re-approval moved right after regeneration, `TargetBadge` brought into scope, HUD counter icons stay diamonds, translucent target with holes deferred to chapter 2, `Level.targetPlacements` added, M0 fixture regenerated under the new edge rule.
- Verification: level geometry, solution counts and distractor cell counts computed with an independent scratch prototype; plan self-review against every spec requirement; no runtime code changed.

### 2026-10-02 - Add chapter 1 levels and shared authoring design

- Added `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md`: shared shape module (square, diamond, right isosceles triangle in 8 orientations, one top-left edge rule for all shapes), authoring script with SVG previews and solution search, renderer changes (per-piece polygons, exact even/odd overlap layering, N-slot tray), five draft levels 1-2 to 1-6, and the per-level review flow.
- Recorded two deliberate GDD deviations (1-3 wings touch at a vertex; 1-6 crown uses a diamond) and the regeneration of 1-1 as `song-tinh-v2`, which must be re-approved before merging to `main`.
- Verification: spec self-review for placeholders, consistency and scope; checked every level's coordinates against the 128 x 160 board, the 8-cell anchor grid and the 6-cell snap radius; no runtime code changed.

### 2026-10-01 - Update UI architecture in Master GDD

- Updated `docs/gdd/master-gdd.md` (v0.2.2) to comprehensively document the Astrological Glass Stele (Tấm Bia Tiên Tri) UI/UX design:
  - Vertical layout metrics and safe area partitioning on 720x1280 canvas.
  - Detailed specifications for Main Menu (rotating prophecy seal, mirrored logo), Level Select (constellation map), Gameplay (5 visual interaction states), Pause and Settings modals.
  - Strict 3 color families (Navy, Ice Glass, Amber Gold), typography standards (Serif Playfair Display + Sans Be Vietnam Pro), vector polygon rendering to eliminate pixel aliasing, and mobile motion budgets.
- Verification: verified against UI specs and presentation layer implementation; all references aligned.

### 2026-10-01 - Simplify Divination Disc target guidance

- Updated `docs/superpowers/specs/2026-10-01-ui-redesign-divination-disc.md` to remove the target badge and place the optional target silhouette directly on the board.
- Kept the existing target visibility setting and moved the victory emphasis to the completed shape on the board.
- Verification: checked all target-badge references and the documentation diff; no runtime code changed.

### 2026-09-30 - Add separate Mirror Master GDD

- Created `docs/gdd/master-gdd.md` as a five-chapter player-experience design document following the Phase 2 workflow, separate from the MVP specification.
- Recorded the one-color overlap rule, 18-level learning path, UI flow, visual direction, offline progress, non-monetized release scope, design states and unresolved post-MVP color behavior.
- Verification: cross-checked against the current MVP spec, concept note, six-level prototype evidence and Phase 2 template; documentation-only change, no runtime test.

### 2026-09-30 - Clarify same-color overlap in MVP GDD

- Updated `docs/superpowers/specs/2026-09-21-mirror-mvp-gdd.md` so the one-color MVP explains same-color transparency and reappearance consistently across the rules, chapter goals, UI feedback and acceptance criteria.
- Confirmed in `docs/concept/same-color-overlap-note.md` that different-color interactions belong after MVP; their display and color-sensitive victory remain open decisions.
- Verification: reviewed document terminology and scope against the Product Owner's decisions; no gameplay code or runtime tests were changed for this documentation update.

### 2026-09-30 - Same-color overlap concept note

- Added `docs/concept/same-color-overlap-note.md` to record the proposed same-color transparency rule and the unresolved different-color behavior for a future GDD revision.
- Verification: reviewed the note against the current MVP GDD and concept sheet; no runtime test was needed for this documentation-only change.

### 2026-09-21 - Approved Mirror MVP GDD

- Recorded the approved 18-level Android MVP: three six-level chapters for drag/drop, parity overlap and 90-degree rotation.
- Set the release model to free, offline and without ads/IAP; campaign progress is local only.
- Deferred Custom Level to the final milestone and made it removable from release scope if campaign delivery is at risk.
- Verification: reconciled the approved product decisions with existing concept, prototype, testing and implementation documentation; no code or runtime verification was performed.

### 2026-09-18 - Generated target editor flow

- Corrected Custom Level so the XOR arrangement on the editor board becomes the saved target; new levels start empty, existing levels save by id, and built-in levels can be restored.
- Updated the level menu with edit, restore, create-new and delete-new actions. Verification: 41 tests pass and the web build passes.

### 2026-09-18 - Completed editable-level plan

- Recorded sequential task completion and commit evidence in the implementation plan.

### 2026-09-18 - Level repository override schema

- Migrated persisted custom levels to versioned `mirror.custom-levels.v1` records with `kind`, generated targets, override priority, restore, and new-level deletion operations.
- Corrupt or unversioned storage is ignored safely; legacy `save`/`remove` aliases remain for current UI callers during migration.
- Verification: focused repository and shape tests pass (9 tests).

### 2026-09-18 - Corrected editable-level design

- Clarified that the editor creates the target from the current XOR arrangement, overrides existing levels by id, adds new levels with new ids, and supports restoring built-in defaults.

### 2026-09-18 - Fix custom level editor piece ID sync

- Synchronized generated piece IDs with placed piece records in `CustomLevelScene.init`, ensuring `validateDraft` and live XOR evaluation match correctly when loading a template level.
- Verification: 40 tests pass and web build succeeds.

### 2026-09-18 - Fix scene transition crash on button clicks


- Changed button activation from synchronous `pointerdown` to `pointerup` with deferred scene start (`delayedCall(0)`), preventing Phaser InputManager crashes when tearing down active scenes during event propagation.
- Added visual pressed feedback states for buttons across Menu, Game, and Custom Level scenes.
- Verification: 40 tests pass and TypeScript / Vite build succeeds.

### 2026-09-18 - Custom level editor verification and documentation


- Documented custom level storage schema (`mirror.custom-levels.v1`), shape specifications, test matrix, and end-to-end flow.
- Updated root `README.md` and `game/README.md` with current feature capabilities and 40 unit tests count.
- Verification: 40 tests pass, web production build succeeds, and Capacitor Android sync completes cleanly.

### 2026-09-18 - Persistent custom level editor


- Added `CustomLevelScene` and `customLevelEditor` helpers with 4 shape tools (Square, Large Triangle, Small Triangle, Diamond), live overlap transparency, drag snap, rename prompt, and exact XOR validation before saving.
- Integrated editor into Phaser scene registry with source template selection and edit mode support.
- Verification: 40 tests pass and TypeScript / Vite build succeeds.

### 2026-09-18 - Level menu and custom level routing


- Added `LevelMenuScene` with responsive selection for built-in levels and custom level management (Play, Edit, Delete with in-scene confirmation).
- Connected main game entry point to the level select menu and allowed `GameScene` to play specific level IDs and navigate back to the menu.
- Verification: 33 tests pass and TypeScript / Vite production build succeeds.

### 2026-09-18 - Session custom level support


- Allowed `Session` to initialize with either numeric index or explicit `Level` instances.
- Added `Session.canSaveSolution` helper ensuring bounds and XOR mask match before persistence.
- Verification: 30 tests pass.

### 2026-09-18 - Shape catalog and level repository


- Added `smallTriangle` shape generator and `LevelRepository` with local storage persistence, corrupted data recovery, and custom level CRUD support.
- Verification: 28 tests pass across domain and UI modules.


### 2026-09-18 - Custom level editor design

- Added the reviewed design for selecting a built-in level as a custom template, composing four fixed shapes, validating the XOR solution and persisting custom levels locally.

### 2026-09-18 - Custom level editor implementation plan

- Added the task-by-task plan covering the shape catalog, persistent repository, explicit-level sessions, menu routing, editor validation and browser/Android verification.

### 2026-09-17 - UI interaction cleanup

- Consolidated piece lookup, placement state, grid origins, overlap collection and composite preview rendering into focused `GameScene` helpers without changing gameplay behavior.
- Verification: 21 tests pass, browser drag checks pass, and the web build passes.

### 2026-09-17 - Live overlap preview

- While dragging, cells that overlap another piece become transparent immediately so the player can align the silhouettes before releasing.
- Preview overlap uses continuous piece positions and clears the intersecting cells on both pieces, so partial intersections reveal the board before grid alignment. Verification: 20 tests pass, browser drag checks pass, and the web build passes; the existing Vite large-chunk warning remains.
- The same overlap transparency is now recomputed after drop, so a loose placement keeps the clear intersection until the pieces separate.
- While a loose piece overlaps a correctly placed piece, the temporary composite also clears that intersection, preventing the placed XOR layer from covering the preview.
- Refresh now applies the same composite clearing after a loose drop; only loose overlap cells are cleared, while fully placed pieces retain their normal XOR result.

### 2026-09-17 - Shape-aware dragging and placement feedback

- Matched pointer hit areas to filled shape cells, retained the latest selected piece above other pieces, and limited tray returns to the visible tray rectangle.
- Distinguished loose, dragging, and placed piece drawing while preserving the shared gold composite and the exact dropped loose position.
- Kept controls above selected pieces, removed scene input listeners on restart, and added a session regression for removing a piece from its anchor.
- Verification: 16 tests pass and the web build passes; the existing large Phaser bundle warning remains.

### 2026-09-17 - Cosmic board and large-piece layout

- Added a shared 720 × 1280 layout, cosmic backdrop, subtle board grid, target card and responsive tray for the large authored pieces.
- Updated the canvas and page backgrounds to match the new theme; piece and target drawing use the shared gold color with the target held at 15% opacity.
- Captured and visually inspected the level 1-1 canvas at 360 × 640, 390 × 844 and desktop; screenshots are in `docs/testing/mirror-redesign/task-3-*.png`.
- Verification: 15 tests pass and the web build passes (existing Vite large-chunk warning remains).

### 2026-09-17 - Six authored overlapping silhouettes

- Replaced tiny introductory shapes with six manually composed XOR puzzles, 36–48-cell pieces and two to four separated trial anchors.
- Added coverage, essential-piece, bounds, target size, detached-component and session victory checks; kept parity rules unchanged.
- Approved authoring exception: level 1-1 target is 60 cells wide so both V edges remain readable; the other five targets are 72 cells wide.
- Captured and visually reviewed all six targets in Chrome at 390 × 844 using the existing canvas renderer; coordinates and observations are in `docs/testing/2026-09-17-mirror-redesign.md`.
- Verification: 14 tests pass; TypeScript and web build pass (existing large bundle warning). Android playtest and difficulty evaluation remain pending.

### 2026-09-17 - Fixed large puzzle shape geometry

- Added deterministic square, upward triangle, and diamond raster shapes with a shared bounding-box size.
- Added cell containment checks and coverage tests for large puzzle pieces.
- Verification: focused shape tests and `npm run build` pass.

### 2026-09-17 — Kế hoạch triển khai puzzle redesign

- Ghi nhận người dùng duyệt spec thiết kế mảnh lớn và giao diện vũ trụ.
- Thêm `docs/superpowers/plans/2026-09-17-mirror-puzzle-visual-redesign.md` với 5 task: hình học, câu đố, bố cục, tương tác và kiểm chứng/đóng gói.
- Plan yêu cầu xem hình render thật và kiểm tra tương tác, không chỉ dựa vào test logic hoặc build.
- Kiểm tra: đối chiếu spec, chữ ký hàm, đường dẫn và diff; chưa triển khai gameplay.

### 2026-09-17 — Thiết kế lại câu đố và giao diện

- Thêm spec `docs/superpowers/specs/2026-09-17-mirror-puzzle-visual-redesign.md`: mảnh lớn, sáu hình đích trừu tượng cần chồng và giao diện vũ trụ nhẹ.
- Chốt hướng cố định, luật một màu; làm rõ thứ tự đặt không ảnh hưởng silhouette chẵn/lẻ.
- Ghi tiêu chí kiểm chứng dữ liệu, hình ảnh và tương tác trước khi triển khai; chưa thay đổi code gameplay.
- Kiểm tra: đọc đối chiếu luật hiện tại và rà soát liên kết tài liệu; không chạy lại test code cho thay đổi chỉ gồm spec.

### Repository setup

Commit: `docs repository setup`
Branch: `feat/mirror-prototype`

- Thêm README root làm điểm vào duy nhất cho người phát triển và AI.
- Thêm quy trình kiểm tra trước push và quy ước commit.
- Thêm changelog làm sổ theo dõi thay đổi code, tài liệu, cấu hình và level.

## 2026-09-17 — Prototype interaction refinement

Commit: `6b7f434`
Branch: `feat/mirror-prototype`

- Đổi toàn bộ mảnh và bóng mục tiêu sang một màu vàng cam.
- Thêm hình vuông, tam giác và hình thoi cho sáu level.
- Giữ mảnh ở vị trí tạm nếu thả ngoài vùng hít; vị trí tạm không tham gia kiểm tra thắng.
- Cho phép kéo mảnh xuống khay để gỡ khỏi bàn.
- Giảm bán kính hít từ 12 xuống 6 ô lưới.
- Cập nhật spec và lưu hai ảnh tham khảo trong `docs/ref/`.
- Kiểm tra: 12 test logic đạt, `npm run build` đạt, APK debug build đạt.

## 2026-09-17 — Android prototype implementation

Commit: `324716c`
Branch: `feat/mirror-prototype`

- Tạo game Phaser + TypeScript + Vite với sáu level prototype.
- Thêm bộ tính mặt nạ chồng chẵn/lẻ và kiểm tra silhouette.
- Thêm kéo thả, snap theo lưới, bóng mẫu, đặt lại và chuyển màn.
- Thêm dự án Capacitor Android, cấu hình khóa màn hình dọc và build APK debug.
- Thêm test cho mask, level và session.

## 2026-09-17 — Concept and design baseline

Commit: `8542725`
Branch: `main`

- Ghi nhận idea sheet, idea gate, đánh giá kỹ thuật và thiết kế prototype Android.
- Chốt phạm vi solo prototype sáu màn dùng Phaser + TypeScript + Capacitor.

## Quy ước ghi mục mới

Mỗi mục mới nên có cấu trúc:

```markdown
## YYYY-MM-DD — Tên thay đổi

Commit: `hash`
Branch: `branch-name`

- Thay đổi chính.
- Tác động đến gameplay, tài liệu hoặc build.
- Kiểm tra đã chạy và kết quả.
```

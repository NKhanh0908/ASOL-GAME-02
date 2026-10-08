# Galaxy Themes & Spatial Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement galaxy visual themes for Chapter I (Dwarf Galaxy) and Chapter II (Spiral Galaxy), adapting MenuScene and LevelSelectScene according to the mockups, complete with a spatial cosmic zoom transition (`menu-to-map`) and Endless Gates (Ải Vô Tận).

**Architecture:**
- Pure data & logic module `src/presentation/galaxyTheme.ts` defining color palettes, tokens, and chapter resolvers.
- Enhanced `MenuScene.ts` displaying dynamic chapter badges, accent tinting, and chapter-specific sky art.
- Upgraded `LevelSelectScene.ts` featuring chapter-colored level diamond borders, frosted glass chapter banners, and animated Endless Gates.
- Spatial zoom camera choreography in `src/presentation/transitions/routes.ts` & `SceneDirector.ts`.
- Unit tests verifying theme integrity, progress calculations, and chapter bounds.

**Tech Stack:** Phaser 3.90, TypeScript 5.7, Vitest 2.

**Spec Reference:** `docs/superpowers/specs/2026-10-08-galaxy-themes-and-spatial-zoom-design.md`  
**Mockup References:**
- `docs/gdd/assets/Bộ nhận diện năm thiên hà-html/GalaxyKit.dc.html`
- `docs/gdd/assets/Menu · Chương I Khởi Nguyên-html/Menu1.dc.html`
- `docs/gdd/assets/Menu · Chương II Giao Thoa-html/Menu2.dc.html`
- `docs/gdd/assets/Chọn màn · bản đồ 5 thiên hà (cuộn dọc)-html/GalaxyMap.dc.html`
- `docs/gdd/assets/Triển khai bằng Phaser-html/GalaxyPhaser.dc.html`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/presentation/galaxyTheme.ts` | **New, pure**: Galaxy theme tokens, chapter color configurations, helper functions |
| `tests/galaxyTheme.test.ts` | **New, unit test**: Test suite for galaxy theme resolution, colors, and progress calculations |
| `src/presentation/menu/ChapterProgressBadge.ts` | **New component**: Pill badge displaying current chapter name and 7 progress bars |
| `src/presentation/MenuScene.ts` | **Modify**: Apply dynamic active chapter theme (accent tinting, badge, mirror bar, fact line) |
| `src/presentation/SkyBackdrop.ts` | **Modify**: Support chapter theme palette for background sky gradient and cloud tints |
| `src/presentation/chapterEndlessGate.ts` | **New component**: Animated endless gate with counter-rotating rings and "Sắp mở" badge |
| `src/presentation/LevelSelectScene.ts` | **Modify**: Render galaxy theme bands, themed node strokes, glass chapter banners, and endless gates |
| `src/presentation/transitions/routes.ts` | **Modify**: Implement spatial zoom in `MENU_OUT_TO_MAP` and `MAP_OUT_TO_MENU` |

---

### Task 1: Galaxy Theme Data Module (`src/presentation/galaxyTheme.ts`)

- [ ] Create `src/presentation/galaxyTheme.ts` with theme configurations for Chapter 1 (Khởi Nguyên) and Chapter 2 (Giao Thoa) matching mockups.
- [ ] Export `resolveGalaxyTheme(chapter: number): GalaxyTheme`.
- [ ] Export `resolveCurrentGalaxyTheme(completedLevels: readonly string[]): GalaxyTheme`.
- [ ] Export `getChapterProgress(chapter: number, completedLevels: readonly string[]): { completed: number; total: number }`.
- [ ] Create unit tests in `tests/galaxyTheme.test.ts` verifying theme resolution, colors, and progress counting.
- [ ] Run `npm test tests/galaxyTheme.test.ts` and ensure all tests pass.

---

### Task 2: Chapter Progress Badge Component (`src/presentation/menu/ChapterProgressBadge.ts`)

- [ ] Create `src/presentation/menu/ChapterProgressBadge.ts` extending `Phaser.GameObjects.Container`.
- [ ] Render rounded frosted dark container with 1.5px accent border.
- [ ] Render chapter title ("Chương I · Khởi Nguyên" or "Chương II · Giao Thoa").
- [ ] Render 7-segment progress bar indicator matching `Menu1.dc.html` and `Menu2.dc.html`.
- [ ] Add unit/mock tests to verify layout dimensions and segment counts.

---

### Task 3: Theme Adaptation in `MenuScene.ts` & `SkyBackdrop.ts`

- [ ] Update `SkyBackdrop.ts` to accept chapter theme colors for background gradient and cloud tinting.
- [ ] Integrate `ChapterProgressBadge` into `MenuScene.buildMainMenu` at $y \approx 280$.
- [ ] Apply chapter accent colors to:
  - Language Pill border (`#5AD1E0` vs `#E58BFF`).
  - Settings button border.
  - Mirror reflection text & mirror bar accent stops.
  - Fact line diamond bullet and chapter-specific astronomical tagline.
  - Secondary button ("Chọn màn chơi") border and styling.
- [ ] Run `npm run typecheck` and `npm test`.

---

### Task 4: Endless Gate Component (`src/presentation/chapterEndlessGate.ts`)

- [ ] Create `src/presentation/chapterEndlessGate.ts` to build and animate the Ải Vô Tận portal.
- [ ] Add 2 counter-rotating dashed ring outlines (`portalA` and `portalB` tweens).
- [ ] Add breathing pulse glow effect on the center.
- [ ] Add "Ải Vô Tận" title text and "Sắp mở" pill tag.
- [ ] Unit test geometry and container composition.

---

### Task 5: LevelSelectScene Galaxy Theming & Endless Gate Placement

- [ ] Replace hardcoded `CHAPTER_TINTS` in `LevelSelectScene.ts` with galaxy theme background bands.
- [ ] Update chapter banners to glass pill badges (`Chương X · Tên`, subtitle `Thiên hà ... · x/7`).
- [ ] Update Level Diamond strokes to use chapter accent color (`#5AD1E0` for Ch1, `#E58BFF` for Ch2).
- [ ] Place `ChapterEndlessGate` at the tail of Chapter 1 (near 1-7) and Chapter 2 (near 2-7) with connecting dashed bezier curves.
- [ ] Run `npm run typecheck` and `npm test`.

---

### Task 6: Spatial Zoom Transition (`menu-to-map`)

- [ ] In `src/presentation/transitions/routes.ts`, enhance `MENU_OUT_TO_MAP` and `mapIn`:
  - Zoom camera $1.0 \to 1.25$ on MenuScene exit while UI fades and scales slightly outward.
  - Enter LevelSelectScene with camera zoom $1.25 \to 1.0$ (`Quad.easeOut`).
  - Honor `isReducedMotion()` by keeping zoom fixed at $1.0$.
- [ ] Test scene transition flow between Menu and LevelSelect.

---

### Task 7: Full Verification & Visual Inspection

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test` across the whole repository.
- [ ] Run `npm run build`.
- [ ] Capture test screenshots or verify visual alignment with mockups.
- [ ] Update `docs/ai/STATUS.md` and `CHANGELOG.md`.

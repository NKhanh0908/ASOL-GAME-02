# Galaxy Theme & Spatial Zoom (Chapters I & II) — Design Spec

**Date:** 2026-10-08  
**State:** Approved  
**Author:** Antigravity  
**Target Scenes:** `MenuScene`, `LevelSelectScene`, `SceneDirector` (spatial zoom transition)  
**References:**
- `docs/gdd/assets/Bộ nhận diện năm thiên hà-html/GalaxyKit.dc.html`
- `docs/gdd/assets/Triển khai bằng Phaser-html/GalaxyPhaser.dc.html`
- `docs/gdd/assets/Menu · Chương I Khởi Nguyên-html/Menu1.dc.html`
- `docs/gdd/assets/Menu · Chương II Giao Thoa-html/Menu2.dc.html`
- `docs/gdd/assets/Chọn màn · bản đồ 5 thiên hà (cuộn dọc)-html/GalaxyMap.dc.html`

---

## 1. Vision & Core Mechanics

The user experiences a continuous cosmic journey:
1. **MenuScene (Macro Perspective — Cosmic Overview):**
   - The player views the active galaxy of their current chapter from a distance.
   - For Chapter I (Khởi Nguyên): A Dwarf Galaxy featuring dual drift gas nebulae (`#3FA9F5`, `#5AD1E0`, `#7B8CFF`), twinkling young stars, and glowing cyan accents (`#5AD1E0`).
   - For Chapter II (Giao Thoa): A majestic barred Spiral Galaxy featuring glowing rotating arms (`#8FA8FF`, `#E58BFF`), a bright core, and vivid neon-violet accents (`#E58BFF`).
   - The UI adapts dynamically: Chapter Progress Badge, mirror bar reflections, pill borders, secondary buttons, and taglines adjust to match the active galaxy theme.
2. **Spatial Zoom Transition (`menu-to-map`):**
   - When tapping "Chọn màn chơi" (Select Level), the camera dives straight into the galaxy (camera thrust/zoom effect from $1.0 \to 1.3$ on exit, and $1.3 \to 1.0$ on entrance).
3. **LevelSelectScene (Micro Perspective — Star Constellation Journey):**
   - The player navigates the stars within that galaxy.
   - Chapter bands display distinct sky gradients, matching node borders, silhouette nodes for completed levels, pulsing diamond for the current node, and locked nodes.
   - At the tail of each chapter (after 1-7 and 2-7), an animated **Ải Vô Tận (Endless Gate)** portal node appears with rotating dash rings and a "Sắp mở" badge.

---

## 2. Token & Architecture Design (`src/presentation/galaxyTheme.ts`)

A pure TypeScript data module providing theme definitions, query helpers, and visual constants.

```typescript
export interface GalaxyThemeColors {
  bgTop: number;
  bgBottom: number;
  bgTopHex: string;
  bgBottomHex: string;
  accent: number;
  accentHex: string;
  accentGlow: number;
  accentDark: number; // For dark glass backgrounds, e.g. 0x0A0A28 with 0.55 alpha
  clouds: {
    primary: number;
    secondary: number;
    tertiary: number;
    highlight: number;
  };
  youngStars: number;
}

export interface GalaxyTheme {
  chapter: number;
  id: string;
  name: string;
  galaxyType: string;
  totalLevels: number;
  tagline: string;
  colors: GalaxyThemeColors;
  portal: {
    color: number;
    ringColor: number;
  };
}

export const GALAXY_THEMES: Readonly<Record<number, GalaxyTheme>> = {
  1: {
    chapter: 1,
    id: 'dwarf',
    name: 'Khởi Nguyên',
    galaxyType: 'Thiên hà lùn',
    totalLevels: 7,
    tagline: 'Đám Mây Magellan Lớn là một thiên hà lùn quay quanh Ngân Hà',
    colors: {
      bgTop: 0x0B2A5E,
      bgBottom: 0x123A7A,
      bgTopHex: '#0B2A5E',
      bgBottomHex: '#123A7A',
      accent: 0x5AD1E0,
      accentHex: '#5AD1E0',
      accentGlow: 0x5AD1E0,
      accentDark: 0x0A0A28,
      clouds: {
        primary: 0x3FA9F5,
        secondary: 0x5AD1E0,
        tertiary: 0x7B8CFF,
        highlight: 0x9BF0FF,
      },
      youngStars: 0xFF8FC8,
    },
    portal: {
      color: 0x5AD1E0,
      ringColor: 0xFFFFFF,
    },
  },
  2: {
    chapter: 2,
    id: 'spiral',
    name: 'Giao Thoa',
    galaxyType: 'Thiên hà xoắn ốc',
    totalLevels: 7,
    tagline: 'Ngân Hà của chúng ta là một thiên hà xoắn ốc có thanh ở giữa',
    colors: {
      bgTop: 0x2A1670,
      bgBottom: 0x3A1A7E,
      bgTopHex: '#2A1670',
      bgBottomHex: '#3A1A7E',
      accent: 0xE58BFF,
      accentHex: '#E58BFF',
      accentGlow: 0xE58BFF,
      accentDark: 0x120E36,
      clouds: {
        primary: 0x8E5CFF,
        secondary: 0xE58BFF,
        tertiary: 0x8FA8FF,
        highlight: 0xFFB8E6,
      },
      youngStars: 0xFF6FB5,
    },
    portal: {
      color: 0xE58BFF,
      ringColor: 0xFFFFFF,
    },
  },
};
```

---

## 3. MenuScene Layout & Visual Integration

### 3.1 Chapter Progress Badge
- Placed above the emblem at $y = 280$.
- Rounded glass container (`width: 240, height: 56, radius: 20`):
  - Background: `rgba(10, 10, 40, 0.55)` with 1.5px border in `theme.colors.accent`.
  - Title: `Chương ${roman} · ${name}` (Baloo 2, 16px, bold, `#FFFFFF`).
  - Progress bar track with 7 slots: Completed levels filled with `theme.colors.accent`, uncompleted filled with `rgba(255, 255, 255, 0.18)`.

### 3.2 Dynamic Accent Tinting
- **Mirror Reflection (`mirrorBar` & text reflection):**
  - Text reflection under MIRROR logo tinted with `theme.colors.accent`.
  - Mirror bar gradient: `theme.colors.accent` $\to$ `#FFFFFF` $\to$ `theme.colors.accent`.
- **Language Pill & Settings:**
  - Stroke border uses `theme.colors.accent`.
- **Secondary Button ("Chọn màn chơi"):**
  - Dark sapphire glass background with 2px solid border in `theme.colors.accent`.
- **Fact Line:**
  - Diamond bullet tinted with `theme.colors.accent`. Text pulled from `theme.tagline` (or locale-matched equivalent).

### 3.3 Dynamic Galaxy Art Layer in `SkyBackdrop`
- When in `MenuScene`, `SkyBackdrop` receives the current `GalaxyTheme`.
- In Chapter I: Renders 2 drifting cloud layers (`driftA`, `driftB`) using Canvas2D radial gradients.
- In Chapter II: Renders rotating spiral arm layers with central galactic core glow.

---

## 4. LevelSelectScene Constellation Map & Endless Gate

### 4.1 Vertical Sky Bands
- Chapter I ($y = 0 \to 1050$): Navy-cobalt gradient (`#0B2A5E` $\to$ `#123A7A`).
- Chapter boundary blend: Smooth vertical color transition between $y = 1000 \to 1200$.
- Chapter II ($y = 1100 \to 2150$): Violet gradient (`#2A1670` $\to$ `#3A1A7E`).

### 4.2 Chapter Banners
- Redesigned as frosted glass pills:
  - Width: 240px, Height: 54px, Radius: 27px.
  - Border: 2px solid `theme.colors.accent`.
  - Header: `Chương ${roman} · ${name}` (17px, bold white).
  - Subtitle: `${galaxyType} · ${completedInChapter}/7` (12px, `theme.colors.accent`).

### 4.3 Level Nodes
- Completed: Amber gold diamond fill with 3.5px border in `theme.colors.accent`, drawing the target silhouette shape in centre.
- Current: Double-ring pulsing stroke (`pulse` tween), glowing core, and play triangle icon.
- Locked: Dark navy `#17143F` fill, 2.5px border in `theme.colors.accent` (0.55 opacity), lock icon.

### 4.4 Endless Gate (Ải Vô Tận)
- Connected from level 1-7 (and 2-7) via a dashed curve.
- Structure:
  - Outer breathing glow circle (radius 40, opacity 0.35).
  - Dark circular core (radius 33, `#120E36`).
  - 2 counter-rotating dashed ring outlines (`portalA`: clockwise, `portalB`: counter-clockwise).
  - Central infinity symbol $\infty$ or spiral gem.
  - Pill badge below: "Ải Vô Tận" title + "Sắp mở" (Coming soon) tag.

---

## 5. Spatial Zoom Transition (`menu-to-map` & `map-to-menu`)

- `SceneDirector` and `MENU_OUT_TO_MAP`:
  - When leaving Menu: Camera zoom tweens from $1.0 \to 1.25$ over 400ms while UI containers fade and scale outward.
  - When entering LevelSelect: Camera starts at zoom $1.25$ and tweens to $1.0$ over 450ms (`Quad.easeOut`).
  - Camera auto-scrolls to center directly on the player's active level diamond.
- Reduced motion fallback: Skips camera zoom, uses smooth crossfade.

---

## 6. Verification & Quality Acceptance

1. **Visual fidelity:** Screenshots match `Menu1.dc.html`, `Menu2.dc.html`, and `GalaxyMap.dc.html`.
2. **Typecheck & Tests:** `npm run typecheck` and `npm test` pass with 100% success.
3. **Performance:** Maintains $\ge 55$ FPS on standard mobile viewports with no frame-time spikes during scroll and transition.

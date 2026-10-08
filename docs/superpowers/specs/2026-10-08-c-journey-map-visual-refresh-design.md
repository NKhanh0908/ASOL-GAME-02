# Journey map visual refresh (direction C) — design

Date: 2026-10-08. State: approved 2026-10-08.
Gate: `docs/gdd/assets/ui-directions/direction-approved.md`. Drafts: `docs/gdd/assets/ui-directions/C-journey-scroll.html` (+ `A-milky-way.html`, `B-flat-galaxy.html` for comparison). References: `docs/ref/image copy.png` (layered Milky Way), `docs/ref/image.png` (flat galaxy, secondary).

## 1. Goal and scope

Make the menu and level-select screens feel richer and more distinct per chapter without changing their layout or adding image assets.

In scope:

1. **Sky style** for `MenuScene` and `LevelSelectScene`: layered Milky Way look (navy → cobalt → violet → soft pink core), four-point sparkles, an occasional shooting star.
2. **Menu**: style only. The layout is frozen (see §3).
3. **Level select**, three additions on top of the current vertical zigzag:
   - a distinct **sky zone per chapter** (replaces the near-invisible `CHAPTER_TINTS`, alpha 0.04–0.06);
   - **silhouette nodes + constellation lines**: completed nodes already draw their silhouette (`drawTargetSilhouette`, `NODE_SILHOUETTE_FIT`); extend this so the current node shows a faint ghost silhouette behind its diamond and completed nodes of a chapter read as one constellation;
   - **XOR chapter gate** between chapters (two overlapping rings, the intersection fades out; it opens when the chapter is cleared).

Out of scope (deferred): landmarks (ringed planet, comet, station), astronomy "info stelae" on the map, end-of-chapter pacing (bigger final node, auto-scroll), direction A/B screens, Play-scene styling.

## 2. Form questions (huashu-design)

- **Narrative role**: menu = hero/entry; map = journey with progress.
- **Viewing distance**: phone, ~30 cm, one thumb. Nodes keep the existing 96×96 hit area.
- **Visual temperature**: calm, meditative (matches `docs/gdd/assets/theme/` tracks), with amber as the single warm accent.
- **Capacity**: map shows about 5–8 nodes per screen; text limited to chapter banner, node id and current node title.
- **Motif from content**: XOR — overlapping shapes whose intersection disappears. Used by the emblem (already), the chapter gate (new) and the per-chapter "Giao Thoa" zone.

## 3. Frozen layout (menu, 720×1280 design space)

Defined in `MenuScene.buildMainMenu`. Must not move: language pill (72, safe.top+52), gear (664), MIRROR logo (y≈195) with mirror bar (y=248) and cyan reflection, `DualJewelEmblem` (360, 620), fact line `◆ …` (y=830, from `getRandomMenuTagline`), Continue button (360, 980, 360×84, subtitle `id · title`), Select-level button (360, 1075), footer (y=1240). Only the sky behind them changes. The fact line needs a dark translucent backing so it stays readable over bright nebula (contrast ≥ 4.5:1; the mockup shows the washed-out failure without it).

## 4. Design

### 4.1 Sky
- Replace the navy gradient in `SkyBackdrop` with 3–4 pre-rendered cloud layers (cobalt, violet, pink core, plus a dark base) baked once per scene into textures. Mood parameters in `skyMood.ts` (`menu` / `map`) keep controlling drift speed and dimming.
- Stars: reuse `starField.ts`; add a four-point sparkle variant for roughly 8–10% of stars.
- Shooting star: one at a time, random interval 6–12 s, skipped when reduced motion is on.
- Palette: the existing `COLOR_TOKENS.sky` stops stay the base; new cloud colours are added as tokens in `designTokens.ts` (no ad-hoc hex in scenes).

### 4.2 Chapter zones (map)
`CHAPTER_TINTS` becomes a per-chapter zone definition: base cloud colours, density, and one accent. Zones blend across the chapter boundary (cross-fade over `CHAPTER_GAP_Y`).

| Chapter | Name | Zone |
|---------|------|------|
| 1 | Khởi Nguyên | navy-cobalt nebula, sparse blobs |
| 2 | Giao Thoa | violet, two overlapping soft discs (XOR hint) |
| 3 | Họa Phẩm | teal/jade patches, brush-like edges |
| 4 | Luân Chuyển | amber dusk, faint orbit arcs |

Zone art is generated in code and baked to one texture per chapter band (not one texture for the whole map). Chapter 4 has 22 of 28 levels approved overall; the zone is built now and works with planned (locked) nodes.

### 4.3 Nodes and constellation
- Completed: existing silhouette on the amber diamond (unchanged).
- Current: add a faint ghost silhouette behind the diamond, about 1.9× its size at 22% opacity (does not reveal the solution; it shows the target shape only, which the level already shows on entry).
- Locked: no silhouette (avoids spoiling); keep the lock icon.
- Links: keep the Bezier links and `walkedLinkAlpha`; walked links use the amber glow, unwalked stay faint.
- When a chapter is fully completed, its walked links get a one-time shimmer (skipped under reduced motion).

### 4.4 XOR chapter gate
- Drawn at each chapter boundary as two overlapping ring outlines; intersection rendered by a mask/blend so it reads as "hollow".
- Locked chapter: rings overlap, intersection closed. Chapter cleared: rings drift apart over 600 ms (once, then stored in memory only; no new persisted key).
- The chapter banner text (`getChapterLabel`) sits inside the gate.

## 5. Components and files

| Area | File | Change |
|------|------|--------|
| Tokens | `src/presentation/designTokens.ts` | cloud, zone and gate tokens |
| Sky | `src/presentation/SkyBackdrop.ts`, `starField.ts`, `skyMood.ts` | layered clouds, sparkles, shooting star |
| Map | `src/presentation/LevelSelectScene.ts`, `constellationLayout.ts`, `constellationMotion.ts` | zones, current-node ring, gate |
| Menu | `src/presentation/MenuScene.ts` | fact-line backing only |
| New | `src/presentation/chapterZone.ts`, `chapterGate.ts` | zone texture baking and gate drawing, each testable without Phaser where possible |

`layoutCampaignMap` keeps its contract (nodes, chapter bands, `totalHeight`); gate positions derive from `ChapterBand.top`. Before editing any symbol, run GitNexus `impact` and report the blast radius, as required by `AGENTS.md`.

## 6. Performance budget

- **Mid-range reference: Redmi Note 13 Pro 5G, ≥ 55 FPS** while scrolling the map and on the menu.
- **Floor: Redmi 12, ≥ 45 FPS.** If it drops below, the scene falls back to reduced effects (no shooting star, fewer stars, static clouds).
- All sky, zone and gate art baked once per scene entry into textures; per-frame work limited to scrolling, star twinkle, one shooting star and the current-node glow.
- Off-screen nodes and gates are hidden (`setVisible(false)`), including their silhouette graphics.
- Texture memory: at most 2 full-size sky textures plus one texture per visible chapter band; each band texture is released when the scene stops.
- Reduced motion (`getMotionScale` / `isReducedMotion`) gives static clouds, no shooting star, no gate animation.
- Measure with a dev FPS overlay on device before and after; record both in the CHANGELOG verification bullet.

## 7. Testing

- Unit (Vitest): zone definitions per chapter (all four exist, colours come from tokens), gate geometry derived from `ChapterBand` (no overlap with nodes or banners), `layoutCampaignMap` unchanged outputs for existing fixtures.
- Existing suites must stay green: 90 test files, 1134 tests at the time of writing (`pieceTextureCache` and layout tests are the likely neighbours).
- Visual: Playwright/Chrome screenshots of menu and map at the 720×1280 design size and one tall and one short viewport; compare against the C draft.
- Device: FPS check per §6 on both Redmi devices; Android build via `npm run android:sync`.

## 8. Risks

- Layered clouds look good in HTML (`feTurbulence`) but cannot use SVG filters in Phaser; they must be re-created with Canvas or Graphics and baked. Plan for one spike task to confirm the look before the full build.
- The fact line contrast over the bright band (see §3).
- Replacing `CHAPTER_TINTS` changes the look of every chapter; reviewer should play through chapters 1–3 on device.
- The cross-fade between zones must not create visible banding on low-end GPUs.

## 9. Open questions

- O1 (resolved 2026-10-08): reference devices are Redmi Note 13 Pro 5G (mid-range) and Redmi 12 (floor).
- O2 (resolved 2026-10-08): the ghost silhouette shows only on the current node.
- O3 (resolved 2026-10-08, reviewer accepted default): the gate open animation plays once per chapter clear.

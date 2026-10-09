# Galaxy Themes for Chapters 4–6 (Luân Chuyển, Hội Tụ, Lăng Kính) — Design Spec

> **Revision (2026-10-09, after implementation):** the reviewer asked for the mockup numbering, so the styles shifted up by one: **3 Luân Chuyển = ring, 4 Hội Tụ = cluster, 5 Lăng Kính = prism**; there is no chapter 6 and the interim Họa Phẩm theme was removed. Wherever this document says chapter 4/5/6 or `tapestry`, read 3/4/5 and nothing. `rotationEnabled` still follows the level content (chapter 4). Only the banner-only teaser band for chapter 5 remains. See `docs/ai/ARCHITECTURE.md` for the as-built description.

Date: 2026-10-09. Branch: `feat/journey-map-visuals`. Follows GX (`2026-10-08-galaxy-themes-and-spatial-zoom-design.md`), which delivered chapters I–II.

## 1. Goal

Extend the galaxy identity system to the rest of the five-galaxy kit, following the mockups closely:

- `docs/gdd/assets/Bộ nhận diện năm thiên hà-html/GalaxyKit.dc.html` (identity kit)
- `docs/gdd/assets/Chọn màn · bản đồ 5 thiên hà (cuộn dọc)-html/GalaxyMap.dc.html` (scrolling map)
- `docs/gdd/assets/Menu · Chương III Luân Chuyển-html/Menu3.dc.html`
- `docs/gdd/assets/Menu · Chương IV Hội Tụ-html/Menu4.dc.html`

The mockups are references, not production code. Reproduce their colors, sizes, timings and layout in Phaser; do not copy markup.

## 2. Decisions (reviewer-approved 2026-10-09)

1. **Add chapters, keep existing ones.** The mockup numbers its galaxies III Luân Chuyển, IV Hội Tụ, V Lăng Kính, but the campaign already has 3 Họa Phẩm (10 levels, no rotation) and 4 Luân Chuyển (rotation chapter, `validate.ts` rule). Mapping used here:

   | Chapter | Name | Galaxy (`theme.id`) | Mockup source | Levels today |
   |---|---|---|---|---|
   | 1 | Khởi Nguyên | `dwarf` | Menu1 (done) | 7 approved |
   | 2 | Giao Thoa | `spiral` | Menu2 (done) | 6 approved |
   | 3 | Họa Phẩm | `tapestry` (renamed from its current id `ring`; look unchanged) | none | 10 approved |
   | 4 | Luân Chuyển | `ring` | Menu3, kit III | 6 `planned` |
   | 5 | Hội Tụ | `cluster` | Menu4, kit IV | none |
   | 6 | Lăng Kính | `prism` | kit V | none |

   Chapter 3 keeps its current look until a mockup exists for it. Its theme id is currently `ring`, which collides with the new ring galaxy; rename it to `tapestry` (the id only selects artwork, and today any non-`spiral` id renders the `dwarf` art, so rendering is unchanged). `Chapter` becomes `1 | 2 | 3 | 4 | 5 | 6`. `RELEASE_LEVEL_COUNT`, the rotation rule in `validate.ts`, and the names of chapters 1–4 do not change.
2. **Artwork approach B.** One static SVG per galaxy plus small animated overlay layers driven by Phaser tweens (same pattern as `dwarf` + `dwarf-cloudA/B`). No per-frame redraw; SVG filters are rasterised once by the loader.
3. **Chapters without levels (5, 6)** appear on the map as a banner band with artwork and no nodes, behind the existing fog. No invented level counts.

## 3. Theme data (`galaxyTheme.ts`)

Add themes 4–6; values from the kit's theme-config table and swatches.

| | 4 Luân Chuyển (`ring`) | 5 Hội Tụ (`cluster`) | 6 Lăng Kính (`prism`) |
|---|---|---|---|
| bgTop / bgBottom | `#3A1A4E` / `#4A2440` | `#140F3A` / `#0A0824` | `#0A0824` / `#160A2E` |
| accent | `#FFB45A` | `#FFE9A8` | `#7FE3FF` (banner/card; per-level node colors below) |
| clouds / extra | ring `#FF9E5A`, `#FFB45A`, `#FFE2A8`; orbit `#FFFFFF`, `#9FD8FF` | web `#9FB4FF`; halo `#FFE9A8`, `#FFC857` | web `#B9A8FF`; prism colors below |
| galaxyType | Thiên hà vòng | Cụm thiên hà | Vũ trụ lăng kính |
| tagline (renders as the menu fact box; kit bullet for chapter 6) | Lõi vàng phát sáng nhịp thở | Lưới vũ trụ mờ nối các thiên hà | Lăng kính tách tia sáng trắng thành dải màu |
| fact box | Vật thể Hoag là thiên hà vòng gần như tròn hoàn hảo | Cụm thiên hà Xử Nữ chứa hơn một nghìn thiên hà | (none in mockup; reuse tagline) |
| gate color | `#FFB45A` | `#FFE9A8` | `#FF7AD9` (not drawn while the band has no nodes) |

Prism colors for levels 6-1…6-7: `#FF5D7A #FF9F45 #FFE15A #4BE0B0 #4DA3FF #B57CFF #FF7AD9`. Add an optional `nodeColors?: readonly number[]` to the theme; the map uses it for locked/done node stroke when present.

`CHAPTERS` (`content/chapters.ts`) gains `{5, 'V', 'Hội Tụ', false}` and `{6, 'VI', 'Lăng Kính', false}`; `i18n.ts` chapter names get the same entries. Note the mockup calls the prism chapter "V"; in the campaign it is VI. Display text for chapters 4–6 uses the campaign numbering ("Chương IV · Luân Chuyển", "Chương V · Hội Tụ", "Chương VI · Lăng Kính").

Known mockup inconsistency (resolved here): kit art draws III/IV as radial gradients with reversed stops; menu and map use the vertical top→bottom values above. Use the vertical values.

## 4. Artwork (`galaxyArtFiles.ts`, `galaxyLayers.ts`, `galaxyMotion.ts`, `scripts/extract-galaxy-art.mjs`)

As built: the extraction script splits kit galaxies III/IV/V into one static body plus animated layers under `game-next/public/assets/galaxies/` (19 SVGs). Layers are assembled by `galaxyLayers.ts`; thin or glowing layers are rasterised at 512 px to limit texture memory.

- **Ring** (`ring`, `ring-core`): the kit ellipse (rx 115, ry 75) is rotated 90° and stretched to the semi-axes the caller passes (menu 314×425, map 295×375 design units, from Menu3's rx 170/ry 230 and the map's rx 160). Motion: core `breath` (3.2 s round trip); two orbit streaks drawn in code (`orbitDotPose`: white 7 % of the ring and blue 3 %, 6 s lap, blue offset by half a lap).
- **Cluster** (`cluster`, `cluster-web`, `cluster-core`, `cluster-galaxies-0..3`, `cluster-meteor-0..2`): web pulses 5 s; giant core breathes; the 20 mini-galaxies fade in as four groups (0.3, 0.8, 1.3, 1.8 s); three meteors (`meteorPose`, 8 s cycle, delays 1.5 / 4.2 / 6.9 s, travel (240, 160) kit units).
- **Prism** (`prism`, `prism-beam`, `prism-fan`, `prism-glass`, `prism-shards-0..2`): beam grows from its lower-left end (0.9 s), fan opens upward from the prism apex (1.3 s after 0.8 s, then 4 s shimmer), glass fades and scales in (1.4 s after 0.5 s), the **32** shards fade in as three groups and float as whole layers.
- Dropped on purpose: per-galaxy self-spin (40 s) and per-shard rotation, which tween thirty-odd objects for almost no visible gain.

`preloadGalaxyArtwork(scene, themeIds)` loads only the listed themes (default `dwarf`, `spiral`, `tapestry`). `addGalaxyArtwork` dispatches to the layered builder for `ring`, `cluster`, `prism`; all tweens join the existing pause list so reduced motion and hidden art stop them, and intros snap to their final state.

## 5. Menu (`MenuScene.ts`, `menu/*`)

- Layout reuses the Menu1/Menu2 chrome already built (language pill, settings, chapter badge, fact box, primary and secondary buttons, footer). Chapter 4/5 differ only in accent, background art, centre emblem and strings:
  - Emblem chapter 4: gold pinwheel diamond (half-extent 56, rotated 22°, triangles `#FFF0A6 #FFD23F #F59400 #FFB31F`, centre `#FFE27A`) with a refresh arrow (`#FFB45A`, w5) inside the r=118 disc and dotted r=132 ring rotating over 240 s.
  - Emblem chapter 5: central pinwheel (half-extent 50, same four colors) joined by four dashed lines (`#FFE9A8`, dash 2 6) to four diamonds of half-extent 18 at (±60.8, ±60.8).
  - Chapter 6 uses the chapter 4 emblem frame with a prism glyph (no Menu mockup exists; treated as a placeholder to be confirmed).
- Theme selection is unchanged: `resolveNextCampaignLevel` decides the chapter, so chapters 4+ only appear once a level there is `approved`.
- Dev preview: `?scene=menu&chapter=4|5|6` forces a theme. Handled in `launchParams.ts`, honoured only when `isDev`.
- Menu4's primary button subtitle is `4-2 · [Tên màn]` in the mockup (placeholder); the game shows the real next level title.

## 6. Map (`constellationLayout.ts`, `LevelSelectScene.ts`, `GalaxyArtwork.ts`)

- `galaxyMapGradient` already blends bands by chapter; extend to chapters 4–6 with the kit's stop pairs (cross-fade of about 4 % of map height between chapters).
- `layoutCampaignMap` appends **teaser bands** for chapters present in `GALAXY_THEMES` but absent from the manifest: `nodeCount: 0`, fixed height (about 900 world px at the mockup's 390 px width, i.e. the mockup's 900 px chapter period), banner at the same offset as other bands. `totalHeight` includes them. Chapter 4 keeps its six locked nodes from the manifest via the existing zigzag layout.
- Banner pill matches the mockup: `#120E36` α.72, stroke accent w2, side rules, Baloo 2 800 line "Chương N · Name" and Be Vietnam Pro 600 subtitle "`<galaxyType>` · `<done>/<total>`"; teaser bands use "`<galaxyType>` · Sắp ra mắt".
- Artwork placement per band reuses `addGalaxyArtwork` with the band centre; ring, cluster and prism art are drawn behind nodes and path.
- Locked node look follows the kit: fill `#17143F` α.85, stroke accent α.55 w2.5, padlock `#B9B6E8`. Chapter 6 nodes use `nodeColors`.
- The Ải Vô Tận gate is drawn only for bands with `nodeCount > 0` (`chapterEndlessGate.ts` unchanged apart from its band filter).
- `computeMapReveal` is unchanged: teaser bands are ordinary bands, so they sit beyond the one-chapter preview until the previous chapter is finished. When the only band left is the last teaser it simply opens (covered by tests).

## 7. Out of scope

- Level content for chapters 4–6; Menu mockup for chapter 6 beyond a placeholder emblem; a chapter 3 (Họa Phẩm) redraw; changing `RELEASE_LEVEL_COUNT`; i18n beyond Vietnamese strings already in `i18n.ts`.

## 8. Testing

- `galaxyTheme.test.ts`: themes exist for 1–6; accent, bg and prism colors match §3; `resolveGalaxyTheme(7)` falls back.
- `levelSelect.test.ts` / layout tests: teaser bands for chapters 5–6 (`nodeCount: 0`, height, `totalHeight`); chapter 4 locked nodes unchanged.
- `mapReveal.test.ts`: teaser band is sealed when frontier is chapter 3; visible as preview when frontier is chapter 4; open when the whole campaign (including teasers) is complete.
- `launchParams.test.ts`: `chapter` param parsed only in dev.
- `chapters` / `i18n` tests: labels for 5 and 6.
- Visual: extend `scripts/check-galaxy-ui.mjs` to capture menu chapters 4–6 and map bands; compare side by side with the mockups; check reduced-motion freezes all layers. Screenshots go to `.shots/galaxy/` (not committed).
- Run `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`, `npm run typecheck`, `npm run build`.

## 9. Risks

- SVG with many filters can be slow to rasterise; mitigate by splitting layers and rasterising at display size, and by measuring on the Android WebView before approval.
- Twenty spinning mini-galaxies (cluster) are the heaviest layer; fall back to rotating a single pre-composed layer if frame time suffers.
- The chapter numbering gap between mockup (III–V) and campaign (IV–VI) means on-screen text differs from the mockup on purpose.

## 10. Open items for the reviewer

- Confirm "Chương VI · Lăng Kính" numbering and the placeholder prism emblem for chapter 6.
- Provide a Menu mockup for chapter 3 Họa Phẩm when available.

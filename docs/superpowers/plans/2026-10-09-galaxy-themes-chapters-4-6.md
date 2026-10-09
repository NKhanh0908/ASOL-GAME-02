# Galaxy Themes for Chapters 4–6 Implementation Plan

> **Revision (2026-10-09, after implementation):** the reviewer asked for the mockup numbering, so the styles shifted up by one: **3 Luân Chuyển = ring, 4 Hội Tụ = cluster, 5 Lăng Kính = prism**; there is no chapter 6 and the interim Họa Phẩm theme was removed. Wherever this document says chapter 4/5/6 or `tapestry`, read 3/4/5 and nothing. `rotationEnabled` still follows the level content (chapter 4). Only the banner-only teaser band for chapter 5 remains. See `docs/ai/ARCHITECTURE.md` for the as-built description.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the ring (Luân Chuyển), cluster (Hội Tụ) and prism (Lăng Kính) galaxy identities to the menu and the scrolling campaign map, matching the supplied mockups, with banner-only bands for chapters that have no levels yet.

**Architecture:** `Chapter` grows to 1–6 and `GALAXY_THEMES` gains themes 4–6 (chapter 3 keeps its look, id renamed `tapestry`). The extraction script splits the kit's SVGs into one static body plus a few animated layers per galaxy; a new `galaxyLayers.ts` assembles those layers with Phaser tweens and per-frame pose functions (`galaxyMotion.ts`, pure and unit-tested). `layoutCampaignMap` appends height-only "teaser" bands for themed chapters absent from the manifest; the existing fog logic is reused unchanged. The menu hero for these chapters is a new `ChapterHeroEmblem` built from pure geometry.

**Tech Stack:** Phaser 3.90, TypeScript 5.7, Vite 6, Vitest 2, Node ≥24.13.1 <25.

**Spec:** `docs/superpowers/specs/2026-10-09-galaxy-themes-chapters-4-6-design.md` (read it first; this plan refines §4 and §6 as noted in Task 4 and Task 6).

## Global Constraints

- All feature work is under `game-next/`. Do not edit `game/`. Run commands from `game-next/`.
- **Do not touch anything belonging to the multi-language localization work**: `docs/superpowers/specs/2026-10-09-multi-language-localization-design.md` and the `LOC` row of `docs/ai/DOCS-INDEX.md` stay as they are. When staging `docs/ai/DOCS-INDEX.md`, stage only the GX2 row (use `git add -p`). Only add the keys named in this plan to `src/presentation/i18n.ts`.
- Chapter mapping (final): 1 Khởi Nguyên `dwarf`, 2 Giao Thoa `spiral`, 3 Họa Phẩm `tapestry` (look unchanged), 4 Luân Chuyển `ring`, 5 Hội Tụ `cluster`, 6 Lăng Kính `prism`. Display numbering follows the campaign: "Chương IV · Luân Chuyển", "Chương V · Hội Tụ", "Chương VI · Lăng Kính".
- `RELEASE_LEVEL_COUNT` (28), the rotation rule in `src/content/validate.ts` (only chapter 4 rotates) and the names/numbers of chapters 1–4 do not change.
- Mockup values used verbatim: ring `#FFB45A` (bg `#3A1A4E`→`#4A2440`); cluster `#FFE9A8` (bg `#140F3A`→`#0A0824`); prism `#7FE3FF` (bg `#0A0824`→`#160A2E`); prism node colors `#FF5D7A #FF9F45 #FFE15A #4BE0B0 #4DA3FF #B57CFF #FF7AD9`; pinwheel colors `#FFF0A6 #FFD23F #F59400 #FFB31F`, core `#FFE27A`, outline `#FFF6D6`.
- Fonts and UI chrome come from the existing Menu1/Menu2 implementation; do not restyle it.
- Reduced motion: every new animation must stop or show its final state when `isReducedMotion()` is true. No layer may stay at alpha 0.
- Comments in English; commit messages `type(scope): summary` ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Each task adds one `CHANGELOG.md` entry under `## Unreleased` (newest first): `### 2026-10-09 - <task title>`, bullets with file paths, and a `Verification:` bullet with the commands actually run. If the GitNexus MCP server is unavailable, say so in that bullet. Do not update `docs/ai/STATUS.md` or `DOCS-INDEX.md` except in Task 11 (controller only).
- Vitest on this machine: run a single file with `npx vitest run tests/<file> --pool=forks`; the full suite with `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`.
- Before editing any existing symbol, run GitNexus `impact` on it and report blast radius (CLAUDE.md). If the MCP server is down, note it in the CHANGELOG verification bullet.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/domain/model.ts` | modify | `Chapter` = 1–6 |
| `src/content/chapters.ts` | modify | chapters 5–6, `chapterRoman()` |
| `src/presentation/i18n.ts` | modify | names for chapters 5–6, `map_coming_soon`, roman via `chapterRoman` |
| `src/presentation/galaxyTheme.ts` | modify | themes 4–6, `tapestry` rename, `nodeColors`, `nodeAccent()`, `teaserChapters()` |
| `src/presentation/constellationLayout.ts` | modify | optional teaser bands |
| `scripts/extract-galaxy-art.mjs` | modify | emit ring/cluster/prism layer SVGs |
| `public/assets/galaxies/*.svg` | create | generated layers (19 files) |
| `src/presentation/galaxyMotion.ts` | create | pure pose functions for orbit streaks and meteors |
| `src/presentation/galaxyArtFiles.ts` | create | pure registry: theme id → SVG stems, `isLayeredGalaxy` (no Phaser import, unit-testable) |
| `src/presentation/galaxyLayers.ts` | create | assembles layer stacks and their motion |
| `src/presentation/GalaxyArtwork.ts` | modify | selective preload, layered branch |
| `src/presentation/menu/chapterHeroGeometry.ts` | create | pure emblem geometry |
| `src/presentation/menu/ChapterHeroEmblem.ts` | create | Phaser drawing of the hero emblem |
| `src/presentation/MenuScene.ts` | modify | theme resolution, emblem selection, dev `chapter` |
| `src/presentation/LevelSelectScene.ts` | modify | teaser layout, banners, art for chapters ≥ 4, `revealAll` |
| `src/launchParams.ts`, `src/main.ts` | modify | dev-only `chapter` and `revealAll` |
| `scripts/check-galaxy-chapters.mjs` | create | Playwright visual/motion check |
| tests | create/modify | listed per task |

---

### Task 1: `Chapter` 1–6, chapter table, labels

**Files:**
- Modify: `src/domain/model.ts:27-28`, `src/content/chapters.ts`, `src/presentation/i18n.ts:262-290`, `src/presentation/LevelSelectScene.ts` (CHAPTER_TINTS, two roman arrays), `src/presentation/menu/ChapterProgressBadge.ts:25`
- Test: `tests/content.test.ts:124-135`, `tests/i18n.test.ts:42-52`

**Interfaces:**
- Produces: `chapterRoman(chapter: number): string` exported from `src/content/chapters.ts`; `CHAPTERS` has six entries; `Chapter = 1|2|3|4|5|6`.

- [ ] **Step 1: Update tests first**

In `tests/content.test.ts` replace the body of `test('bảng chương: tên, số La Mã, chỉ chương 4 xoay', …)` with:

```ts
    expect(CHAPTERS.map((c) => [c.chapter, c.roman, c.name, c.rotationEnabled])).toEqual([
      [1, 'I', 'Khởi Nguyên', false], [2, 'II', 'Giao Thoa', false],
      [3, 'III', 'Họa Phẩm', false], [4, 'IV', 'Luân Chuyển', true],
      [5, 'V', 'Hội Tụ', false], [6, 'VI', 'Lăng Kính', false],
    ]);
    expect(chapterInfo(7)).toBeUndefined();
    expect(chapterOfLevelId('3-10')).toBe(3);
    expect(chapterOfLevelId('4-1')).toBe(4);
    expect(chapterOfLevelId('6-2')).toBe(6);
    expect(chapterOfLevelId('dev-shapes-v2')).toBeUndefined();
    expect(chapterLabel(3)).toBe('Chương III · Họa Phẩm');
    expect(chapterLabel(5)).toBe('Chương V · Hội Tụ');
    expect(chapterRoman(6)).toBe('VI');
    expect(chapterRoman(9)).toBe('9');
```

Add `chapterRoman` to the import on line 7. In `tests/i18n.test.ts` after the existing `vi` assertions add:

```ts
    expect(getChapterLabel(5)).toBe('Chương V · Hội Tụ');
    expect(getChapterLabel(6)).toBe('Chương VI · Lăng Kính');
```
and after the existing `en` assertions:
```ts
    expect(getChapterLabel(5)).toBe('Chapter V · Convergence');
    expect(getChapterLabel(6)).toBe('Chapter VI · Prism');
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/content.test.ts tests/i18n.test.ts --pool=forks`
Expected: FAIL (`chapterRoman` not exported / label mismatch).

- [ ] **Step 3: Implement**

`src/domain/model.ts`:
```ts
/** Sáu chương campaign: 1 Khởi Nguyên, 2 Giao Thoa, 3 Họa Phẩm, 4 Luân Chuyển (xoay), 5 Hội Tụ, 6 Lăng Kính. */
export type Chapter = 1 | 2 | 3 | 4 | 5 | 6;
```
`src/content/chapters.ts`: change the doc comment to "Sáu chương của campaign", append to `CHAPTERS`:
```ts
  { chapter: 5, roman: 'V', name: 'Hội Tụ', rotationEnabled: false },
  { chapter: 6, roman: 'VI', name: 'Lăng Kính', rotationEnabled: false },
```
and add after `chapterInfo`:
```ts
/** Số La Mã của chương; mã lạ trả về chính con số. */
export function chapterRoman(chapter: number): string {
  return chapterInfo(chapter)?.roman ?? String(chapter);
}
```
`src/presentation/i18n.ts`: add `5: 'Hội Tụ', 6: 'Lăng Kính'` to `vi` and `5: 'Convergence', 6: 'Prism'` to `en` in `CHAPTER_NAMES`; add `import { chapterRoman } from '../content/chapters.ts';` at the top and replace the roman line in `getChapterLabel` with `const roman = chapterRoman(chapter);`.
`src/presentation/menu/ChapterProgressBadge.ts:25`: `const romanNumeral = chapterRoman(config.theme.chapter);` (import from `../../content/chapters.ts`).
`src/presentation/LevelSelectScene.ts`: add to `CHAPTER_TINTS`:
```ts
  5: { color: 0xffe9a8, alpha: 0.04 }, // Hội Tụ: ánh vàng nhạt
  6: { color: 0x7fe3ff, alpha: 0.04 }, // Lăng Kính: xanh lăng kính
```
and replace both `['I', 'II', 'III', 'IV'][…]` expressions (around lines 397 and 648) with `chapterRoman(<same index expression without the -1>)`: line 397 → `const romanNumeral = chapterRoman(band.chapter);`; the one inside `t('map_sealed_chapter', …)` → `chapterRoman(reveal.sealedUntilChapter)`. Import `chapterRoman`.

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/content.test.ts tests/i18n.test.ts tests/levelSelect.test.ts --pool=forks` → PASS. Run `npm run typecheck` → no errors (this proves no other `Record<Chapter,…>` was missed).

- [ ] **Step 5: CHANGELOG + commit**

```bash
git add src/domain/model.ts src/content/chapters.ts src/presentation/i18n.ts src/presentation/LevelSelectScene.ts src/presentation/menu/ChapterProgressBadge.ts tests/content.test.ts tests/i18n.test.ts CHANGELOG.md
git commit -m "feat(content): chapters 5-6 in the chapter table and labels"
```
(Use `git add -p` for `i18n.ts` and `CHANGELOG.md` if they contain hunks from someone else.)

---

### Task 2: Themes for chapters 4–6, `tapestry` id, node accents

**Files:**
- Modify: `src/presentation/galaxyTheme.ts` (interface, `GALAXY_THEMES`, new helpers), `src/presentation/menu/ChapterProgressBadge.ts` (segment count), `src/presentation/LevelSelectScene.ts` (node accent)
- Test: `tests/galaxyTheme.test.ts`

**Interfaces:**
- Consumes: `Chapter` (Task 1).
- Produces: `GalaxyTheme.nodeColors?: readonly number[]`; `nodeAccent(theme: GalaxyTheme, levelId: string): number`; `teaserChapters(manifest: readonly { chapter: number }[]): Chapter[]` (ascending chapters that have a theme but no manifest entry).

- [ ] **Step 1: Write failing tests** — append to `tests/galaxyTheme.test.ts` (add `nodeAccent`, `teaserChapters` to its import):

```ts
describe('chapters 4-6 themes', () => {
  it('matches the kit values', () => {
    expect(GALAXY_THEMES[3].id).toBe('tapestry');
    const ring = GALAXY_THEMES[4];
    expect([ring.id, ring.name, ring.galaxyType]).toEqual(['ring', 'Luân Chuyển', 'Thiên hà vòng']);
    expect([ring.colors.bgTopHex, ring.colors.bgBottomHex, ring.colors.accentHex]).toEqual(['#3A1A4E', '#4A2440', '#FFB45A']);
    expect(ring.tagline).toBe('Vật thể Hoag là thiên hà vòng gần như tròn hoàn hảo');
    const cluster = GALAXY_THEMES[5];
    expect([cluster.id, cluster.name, cluster.galaxyType]).toEqual(['cluster', 'Hội Tụ', 'Cụm thiên hà']);
    expect([cluster.colors.bgTopHex, cluster.colors.bgBottomHex, cluster.colors.accentHex]).toEqual(['#140F3A', '#0A0824', '#FFE9A8']);
    expect(cluster.tagline).toBe('Cụm thiên hà Xử Nữ chứa hơn một nghìn thiên hà');
    const prism = GALAXY_THEMES[6];
    expect([prism.id, prism.name, prism.galaxyType]).toEqual(['prism', 'Lăng Kính', 'Vũ trụ lăng kính']);
    expect([prism.colors.bgTopHex, prism.colors.bgBottomHex, prism.colors.accentHex]).toEqual(['#0A0824', '#160A2E', '#7FE3FF']);
    expect(prism.nodeColors).toEqual([0xff5d7a, 0xff9f45, 0xffe15a, 0x4be0b0, 0x4da3ff, 0xb57cff, 0xff7ad9]);
  });

  it('nodeAccent uses per-level prism colors and the chapter accent elsewhere', () => {
    expect(nodeAccent(GALAXY_THEMES[6], '6-1')).toBe(0xff5d7a);
    expect(nodeAccent(GALAXY_THEMES[6], '6-7')).toBe(0xff7ad9);
    expect(nodeAccent(GALAXY_THEMES[6], '6-8')).toBe(0xff5d7a);
    expect(nodeAccent(GALAXY_THEMES[4], '4-3')).toBe(GALAXY_THEMES[4].colors.accent);
    expect(nodeAccent(GALAXY_THEMES[6], 'dev-x')).toBe(GALAXY_THEMES[6].colors.accent);
  });

  it('teaserChapters lists themed chapters that have no levels', () => {
    expect(teaserChapters(campaignManifest)).toEqual([5, 6]);
    expect(teaserChapters([{ chapter: 1 }, { chapter: 5 }])).toEqual([2, 3, 4, 6]);
  });

  it('keeps the unknown-chapter fallback', () => {
    expect(resolveGalaxyTheme(99).chapter).toBe(1);
    expect(Object.keys(GALAXY_THEMES)).toHaveLength(6);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/galaxyTheme.test.ts --pool=forks` → FAIL.

- [ ] **Step 3: Implement** in `galaxyTheme.ts`:
  1. Add to `GalaxyTheme`: `/** Optional per-level node colors (prism chapter): index = level number − 1, wraps. */ nodeColors?: readonly number[];`
  2. Change chapter 3's `id: 'ring'` to `id: 'tapestry'` and update the header comment list of mockups with `Menu3.dc.html` and `Menu4.dc.html`.
  3. Add after entry 3 (inside `GALAXY_THEMES`):

```ts
  4: {
    chapter: 4,
    id: 'ring',
    name: 'Luân Chuyển',
    galaxyType: 'Thiên hà vòng',
    totalLevels: campaignManifest.filter(entry => entry.chapter === 4).length,
    tagline: 'Vật thể Hoag là thiên hà vòng gần như tròn hoàn hảo',
    colors: {
      bgTop: 0x3a1a4e, bgBottom: 0x4a2440, bgTopHex: '#3A1A4E', bgBottomHex: '#4A2440',
      accent: 0xffb45a, accentHex: '#FFB45A', accentGlow: 0xffb45a, accentDark: 0x120e36,
      clouds: { primary: 0xff9e5a, secondary: 0xffb45a, tertiary: 0xffe2a8, highlight: 0x9fd8ff },
      youngStars: 0x9fd8ff,
    },
    portal: { color: 0xffb45a, ringColor: 0xffffff },
  },
  5: {
    chapter: 5,
    id: 'cluster',
    name: 'Hội Tụ',
    galaxyType: 'Cụm thiên hà',
    totalLevels: campaignManifest.filter(entry => entry.chapter === 5).length,
    tagline: 'Cụm thiên hà Xử Nữ chứa hơn một nghìn thiên hà',
    colors: {
      bgTop: 0x140f3a, bgBottom: 0x0a0824, bgTopHex: '#140F3A', bgBottomHex: '#0A0824',
      accent: 0xffe9a8, accentHex: '#FFE9A8', accentGlow: 0xffe9a8, accentDark: 0x120e36,
      clouds: { primary: 0x9fb4ff, secondary: 0xffe9a8, tertiary: 0xffc857, highlight: 0xffffff },
      youngStars: 0xffe9a8,
    },
    portal: { color: 0xffe9a8, ringColor: 0xffffff },
  },
  6: {
    chapter: 6,
    id: 'prism',
    name: 'Lăng Kính',
    galaxyType: 'Vũ trụ lăng kính',
    totalLevels: campaignManifest.filter(entry => entry.chapter === 6).length,
    tagline: 'Lăng kính tách tia sáng trắng thành dải màu',
    colors: {
      bgTop: 0x0a0824, bgBottom: 0x160a2e, bgTopHex: '#0A0824', bgBottomHex: '#160A2E',
      accent: 0x7fe3ff, accentHex: '#7FE3FF', accentGlow: 0x7fe3ff, accentDark: 0x120e36,
      clouds: { primary: 0xb9a8ff, secondary: 0x4da3ff, tertiary: 0xff7ad9, highlight: 0xffffff },
      youngStars: 0x4be0b0,
    },
    portal: { color: 0xff7ad9, ringColor: 0xffffff },
    nodeColors: [0xff5d7a, 0xff9f45, 0xffe15a, 0x4be0b0, 0x4da3ff, 0xb57cff, 0xff7ad9],
  },
```
  4. Append helpers (and `import type { Chapter } from '../domain/model.ts';`):

```ts
/** Accent for one level's node: prism levels carry their own colour. */
export function nodeAccent(theme: GalaxyTheme, levelId: string): number {
  const order = Number(/-(\d+)$/.exec(levelId)?.[1]);
  const colors = theme.nodeColors;
  return colors && Number.isInteger(order) && order > 0 ? colors[(order - 1) % colors.length] : theme.colors.accent;
}

/** Themed chapters with no manifest entry yet; the map shows them as banner-only bands. */
export function teaserChapters(manifest: readonly { chapter: number }[]): Chapter[] {
  return Object.keys(GALAXY_THEMES)
    .map(Number)
    .filter((chapter) => !manifest.some((entry) => entry.chapter === chapter))
    .sort((a, b) => a - b) as Chapter[];
}
```
  5. `ChapterProgressBadge.ts`: `const totalBars = config.theme.totalLevels || 7;` (mockup shows 7 segments; chapters without levels yet have 0).
  6. `LevelSelectScene.ts` node loop (`createGalaxyNodeBody(this, bodyState, nodeTheme.colors.accent)`) → `nodeAccent(nodeTheme, node.id)`; import it.
  7. Search for other users of the old id: `grep -rn "'ring'" src tests` — chapter 3's id is only used by `GalaxyArtwork` (non-spiral → dwarf art), so nothing else changes.

- [ ] **Step 4:** `npx vitest run tests/galaxyTheme.test.ts tests/levelSelect.test.ts --pool=forks` → PASS; `npm run typecheck` → clean.
- [ ] **Step 5:** CHANGELOG entry + commit `feat(ui): galaxy themes for chapters 4-6`.

---

### Task 3: Teaser bands in the map layout

**Files:**
- Modify: `src/presentation/constellationLayout.ts`
- Test: `tests/levelSelect.test.ts` (append), `tests/mapReveal.test.ts` (append)

**Interfaces:**
- Consumes: `teaserChapters` (Task 2) only in the scene (Task 7), not here.
- Produces: `layoutCampaignMap(entries: readonly MapEntry[], teaserChapters: readonly Chapter[] = []): CampaignMapLayout`. Teaser bands have `nodeCount: 0`; `totalHeight` includes them; behaviour with no teasers is unchanged.

- [ ] **Step 1: Failing tests.** In `tests/levelSelect.test.ts` append inside `describe('Constellation Map Layout Generator', …)`:

```ts
  test('teaser chapters become node-less bands that extend the map', () => {
    const plain = layoutCampaignMap(campaignManifest);
    const layout = layoutCampaignMap(campaignManifest, [5, 6]);
    expect(layout.chapters.map((c) => [c.chapter, c.nodeCount])).toEqual([[1, 6], [2, 6], [3, 10], [4, 6], [5, 0], [6, 0]]);
    expect(layout.nodes).toEqual(plain.nodes);
    layout.chapters.forEach((band, i) => {
      if (i > 0) expect(band.top).toBe(layout.chapters[i - 1].bottom);
    });
    expect(layout.chapters.at(-1)!.bottom).toBe(layout.totalHeight);
    for (const band of layout.chapters.slice(-2)) expect(band.bottom - band.top).toBeGreaterThanOrEqual(1000);
    const lastNodeY = Math.max(...layout.nodes.map((n) => n.y));
    expect(layout.chapters[4].bannerY - lastNodeY).toBeGreaterThanOrEqual(60);
    expect(layout.totalHeight).toBeGreaterThan(plain.totalHeight + 2000);
  });

  test('without teasers the layout is unchanged', () => {
    expect(layoutCampaignMap(campaignManifest, [])).toEqual(layoutCampaignMap(campaignManifest));
  });
```
In `tests/mapReveal.test.ts` append (new `describe`):

```ts
describe('computeMapReveal with teaser bands', () => {
  const teased = layoutCampaignMap(entries, [4, 5]);

  it('shows the next chapter (a teaser) as the preview and seals the one after', () => {
    const reveal = computeMapReveal(teased, '3-1');
    expect(reveal.limitY).toBe(teased.chapters[3].bottom);
    expect(reveal.limitY).toBeLessThan(teased.totalHeight);
    expect(reveal.sealedUntilChapter).toBe(3);
  });

  it('opens the map when the only remaining chapter is the last teaser', () => {
    const reveal = computeMapReveal(layoutCampaignMap(entries, [4]), '3-1');
    expect(reveal.limitY).toBe(layoutCampaignMap(entries, [4]).totalHeight);
    expect(reveal.sealedUntilChapter).toBeNull();
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/levelSelect.test.ts tests/mapReveal.test.ts --pool=forks` → the new tests FAIL (extra arg ignored / TS error).

- [ ] **Step 3: Implement** in `constellationLayout.ts`: add `const TEASER_SPAN_Y = 1000;`, change the signature to `export function layoutCampaignMap(entries: readonly MapEntry[], teaserChapters: readonly Chapter[] = []): CampaignMapLayout`, and replace the lines from `const totalHeight = …` with:

```ts
  // Themed chapters without levels: a banner and room for their artwork, no nodes.
  let teaserEndY: number | null = null;
  for (const chapter of teaserChapters) {
    cursorY += CHAPTER_GAP_Y;
    const firstY = cursorY;
    bands.push({
      chapter,
      bannerY: firstY - BANNER_OFFSET_Y,
      top: firstY - BAND_OFFSET_Y,
      nodeCount: 0,
    });
    cursorY = firstY + TEASER_SPAN_Y;
    teaserEndY = cursorY;
  }

  const totalHeight = teaserEndY ?? (nodes.length > 0 ? nodes[nodes.length - 1].y + BOTTOM_PADDING : FIRST_NODE_Y);
```
(keep the existing `chapters` mapping below it untouched).

- [ ] **Step 4:** both test files PASS; run `npx vitest run tests/levelSelect.test.ts tests/mapReveal.test.ts --pool=forks` and `npm run typecheck`.
- [ ] **Step 5:** CHANGELOG + commit `feat(ui): banner-only teaser bands in the campaign map layout`.

---

### Task 4: Extract ring, cluster and prism layers from the kit

**Files:**
- Modify: `scripts/extract-galaxy-art.mjs` (append a new section; leave the dwarf/spiral loop untouched)
- Create (generated): `public/assets/galaxies/{ring,ring-core,cluster,cluster-web,cluster-core,cluster-galaxies-0..3,cluster-meteor-0..2,prism,prism-beam,prism-fan,prism-glass,prism-shards-0..2}.svg`

**Spec refinement:** the kit draws the ring horizontally (rx 115, ry 75) while Menu3 and the map draw it vertically; Task 6 rotates the whole ring group by 90° instead of re-drawing it. The kit has ~20 spinning mini-galaxies and ~32 glass shards, so they become 4 and 3 layers (fade-in staggered, whole-layer float) rather than per-element tweens. Per-galaxy self-spin (40 s per turn) is dropped as imperceptible; this is a deliberate, reviewer-visible deviation.

- [ ] **Step 1: Append to `scripts/extract-galaxy-art.mjs`** (after the existing `for` loop; reuses the already-read `art` array and `output`):

```js
// ---- Layered artwork for the ring (kit III), cluster (IV) and prism (V) galaxies.
// The export always writes explicit close tags, so depth counting splits top-level nodes.
function topLevelNodes(inner) {
  const nodes = [];
  let depth = 0;
  let start = 0;
  for (const m of inner.matchAll(/<(\/?)([\w:-]+)[^>]*?(\/?)>/g)) {
    if (m[1]) depth--; else if (!m[3]) depth++;
    if (depth === 0) { nodes.push(inner.slice(start, m.index + m[0].length)); start = m.index + m[0].length; }
  }
  return nodes;
}
const classOf = node => node.match(/^<\w+[^>]*?\sclass="([^"]*)"/)?.[1] ?? '';
const EDGE = '<defs><radialGradient id="edgeFade" gradientUnits="userSpaceOnUse" cx="175" cy="175" r="175"><stop offset="0.58" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="artEdge" maskUnits="userSpaceOnUse" x="0" y="0" width="350" height="350"><rect width="350" height="350" fill="url(#edgeFade)"/></mask></defs>';
const SMALL = 512; // thin or glowing layers need fewer pixels; this keeps texture memory down on phones
function layerWriter(svg) {
  const inner = svg.slice(svg.match(/<svg[^>]*>/)[0].length, svg.lastIndexOf('</svg>'))
    .replaceAll('x="-80%" y="-80%" width="260%" height="260%"', 'x="-200%" y="-200%" width="500%" height="500%"');
  const defs = inner.match(/<defs>[\s\S]*?<\/defs>/)[0];
  const body = topLevelNodes(inner.replace(defs, '')).filter(node => !/^<rect width="350" height="350"/.test(node));
  const write = (name, parts, size = 1024) => {
    const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 350 350">`;
    writeFileSync(new URL(`${name}.svg`, output), `${head}${EDGE}${defs}<g mask="url(#artEdge)">${parts.join('')}</g></svg>\n`);
  };
  return { body, write };
}
const need = (value, what) => { if (!value) throw new Error(`Missing ${what} in kit artwork`); return value; };
const chunks = (list, n) => Array.from({ length: n }, (_, i) => list.slice(Math.floor(i * list.length / n), Math.floor((i + 1) * list.length / n)));

{ // ring: static body + breathing core; the orbit streaks are drawn in code (galaxyMotion.ts)
  const { body, write } = layerWriter(art[2]);
  const orbit = /<ellipse[^>]*class="orbit2?"[^>]*><\/ellipse>/g;
  const core = /<circle[^>]*class="breath"[^>]*><\/circle>/;
  const joined = body.join('');
  write('ring', body.map(node => node.replace(orbit, '').replace(core, '')));
  write('ring-core', [need(joined.match(/<radialGradient id="g2rc"[\s\S]*?<\/radialGradient>/)?.[0], 'ring core gradient'), need(joined.match(core)?.[0], 'ring core')], SMALL);
}
{ // cluster: body, cosmic web, central giant, 20 mini-galaxies in 4 groups, 3 meteors
  const { body, write } = layerWriter(art[3]);
  const gradients = body.filter(node => /^<(radial|linear)Gradient/.test(node));
  const pops = body.filter(node => classOf(node).startsWith('pop'));
  const corePop = need(pops.find(node => /class="breath"/.test(node)), 'cluster core');
  const galaxies = pops.filter(node => node !== corePop);
  const web = need(body.find(node => classOf(node) === 'webp'), 'cluster web');
  const meteors = body.filter(node => classOf(node) === 'meteor');
  if (galaxies.length !== 20 || meteors.length !== 3) throw new Error(`Unexpected cluster artwork: ${galaxies.length} galaxies, ${meteors.length} meteors`);
  write('cluster', body.filter(node => ![...pops, ...meteors, web].includes(node)));
  write('cluster-web', [...gradients, web], SMALL);
  write('cluster-core', [...gradients, corePop], SMALL);
  chunks(galaxies, 4).forEach((part, i) => write(`cluster-galaxies-${i}`, [...gradients, ...part]));
  meteors.forEach((node, i) => write(`cluster-meteor-${i}`, [...gradients, node], SMALL));
}
{ // prism: body, incoming beam, rainbow fan, prism glass, 32 shards in 3 groups
  const { body, write } = layerWriter(art[4]);
  const beam = need(body.find(node => classOf(node) === 'beamIn'), 'prism beam');
  const fan = need(body.find(node => classOf(node) === 'fanIn'), 'prism fan');
  const glass = need(body.find(node => classOf(node).startsWith('in')), 'prism glass');
  const shards = body.filter(node => classOf(node).startsWith('pop'));
  if (shards.length !== 32) throw new Error(`Unexpected prism artwork: ${shards.length} shards`);
  write('prism', body.filter(node => ![beam, fan, glass, ...shards].includes(node)));
  write('prism-beam', [beam], SMALL);
  write('prism-fan', [fan], SMALL);
  write('prism-glass', [glass], SMALL);
  chunks(shards, 3).forEach((part, i) => write(`prism-shards-${i}`, part, SMALL));
}
```

- [ ] **Step 2: Run it.** `node scripts/extract-galaxy-art.mjs` → exit 0. Expected: 19 new files in `public/assets/galaxies/`, plus the four existing ones regenerated byte-identical (`git status` must show only new files; if `dwarf*.svg`/`spiral.svg` show as modified, stop and investigate).

- [ ] **Step 3: Verify well-formed XML.**
Run: `python -c "import glob,xml.etree.ElementTree as E; [E.parse(f) for f in glob.glob('public/assets/galaxies/*.svg')]; print('ok')"` → `ok`.

- [ ] **Step 4: Eyeball.** Open each `ring.svg`, `cluster.svg`, `prism.svg` in a browser (`npx vite` then `http://127.0.0.1:5173/assets/galaxies/ring.svg`). Expected: a recognisable ring with beads and no streaks, a cluster of spiral/elliptical galaxies, a prism with glass shards missing (they are in other layers). Compare against `docs/gdd/assets/Bộ nhận diện năm thiên hà-html/GalaxyKit.dc.html`.

- [ ] **Step 5:** CHANGELOG + commit `feat(art): extract ring, cluster and prism galaxy layers`.

---

### Task 5: Pure motion functions

**Files:**
- Create: `src/presentation/galaxyMotion.ts`
- Test: `tests/galaxyMotion.test.ts`

**Interfaces:**
- Produces:
  - `ORBIT_PERIOD_MS = 6000`, `METEOR_PERIOD_MS = 8000`, `METEOR_TRAVEL = { x: 240, y: 160 }` (kit units)
  - `type OrbitSpec = { rx: number; ry: number; fraction: number; phaseMs: number; dots: number }`
  - `orbitDotPose(elapsedMs: number, spec: OrbitSpec, index: number): { x: number; y: number; alpha: number }`
  - `meteorPose(elapsedMs: number, delayMs: number): { dx: number; dy: number; alpha: number }`

- [ ] **Step 1: Failing test** `tests/galaxyMotion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { METEOR_PERIOD_MS, METEOR_TRAVEL, ORBIT_PERIOD_MS, meteorPose, orbitDotPose } from '../src/presentation/galaxyMotion.ts';

const spec = { rx: 115, ry: 75, fraction: 0.07, phaseMs: 0, dots: 7 };

describe('orbitDotPose', () => {
  it('starts at the right-hand vertex and runs clockwise', () => {
    const head = orbitDotPose(0, spec, 0);
    expect(head.x).toBeCloseTo(115);
    expect(head.y).toBeCloseTo(0);
    expect(head.alpha).toBe(1);
    const quarter = orbitDotPose(ORBIT_PERIOD_MS / 4, spec, 0);
    expect(quarter.x).toBeCloseTo(0, 5);
    expect(quarter.y).toBeCloseTo(75);
  });

  it('is periodic and its tail fades but stays visible', () => {
    const a = orbitDotPose(1234, spec, 3);
    const b = orbitDotPose(1234 + ORBIT_PERIOD_MS, spec, 3);
    expect(b.x).toBeCloseTo(a.x);
    expect(b.y).toBeCloseTo(a.y);
    const tail = orbitDotPose(0, spec, spec.dots - 1);
    expect(tail.alpha).toBeGreaterThan(0);
    expect(tail.alpha).toBeLessThan(0.3);
  });

  it('honours the phase offset', () => {
    const shifted = orbitDotPose(0, { ...spec, phaseMs: ORBIT_PERIOD_MS / 2 }, 0);
    expect(shifted.x).toBeCloseTo(-115);
  });
});

describe('meteorPose', () => {
  it('is hidden before its delay and between flights', () => {
    expect(meteorPose(500, 1500).alpha).toBe(0);
    expect(meteorPose(1500 + METEOR_PERIOD_MS * 0.5, 1500).alpha).toBe(0);
  });

  it('fades in, travels the full vector and fades out', () => {
    expect(meteorPose(1500 + METEOR_PERIOD_MS * 0.03, 1500).alpha).toBeCloseTo(1);
    const nearEnd = meteorPose(1500 + METEOR_PERIOD_MS * 0.1299, 1500);
    expect(nearEnd.alpha).toBeCloseTo(0, 1);
    expect(nearEnd.dx).toBeGreaterThan(METEOR_TRAVEL.x * 0.95);
    expect(nearEnd.dy).toBeGreaterThan(METEOR_TRAVEL.y * 0.95);
    expect(meteorPose(1500 + METEOR_PERIOD_MS, 1500).alpha).toBe(0);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/galaxyMotion.test.ts --pool=forks` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/presentation/galaxyMotion.ts`:

```ts
/** Pure pose functions for galaxy-artwork motion that SVG keyframes expressed in the kit mockup. */
const TAU = Math.PI * 2;
export const ORBIT_PERIOD_MS = 6000;
export const METEOR_PERIOD_MS = 8000;
/** Meteor flight vector in kit units (350-unit artboard). */
export const METEOR_TRAVEL = { x: 240, y: 160 } as const;

const mod = (value: number, period: number): number => ((value % period) + period) % period;

export type OrbitSpec = {
  rx: number;
  ry: number;
  /** Streak length as a fraction of the ring (kit: 7% white, 3% blue). */
  fraction: number;
  phaseMs: number;
  dots: number;
};

/** One dot of a streak running clockwise around the ring; index 0 is the bright head. Kit units, ring-centred. */
export function orbitDotPose(elapsedMs: number, spec: OrbitSpec, index: number): { x: number; y: number; alpha: number } {
  const head = TAU * (mod(elapsedMs + spec.phaseMs, ORBIT_PERIOD_MS) / ORBIT_PERIOD_MS);
  const angle = head - TAU * spec.fraction * (index / Math.max(1, spec.dots - 1));
  return { x: spec.rx * Math.cos(angle), y: spec.ry * Math.sin(angle), alpha: 1 - (index / spec.dots) * 0.9 };
}

/** Kit `meteor` keyframes: invisible → visible at 3% → gone at 13% of an 8 s cycle, easing in along the flight. */
export function meteorPose(elapsedMs: number, delayMs: number): { dx: number; dy: number; alpha: number } {
  if (elapsedMs < delayMs) return { dx: 0, dy: 0, alpha: 0 };
  const p = mod(elapsedMs - delayMs, METEOR_PERIOD_MS) / METEOR_PERIOD_MS;
  if (p >= 0.13) return { dx: 0, dy: 0, alpha: 0 };
  const travel = (p / 0.13) ** 2;
  const alpha = p < 0.03 ? p / 0.03 : 1 - (p - 0.03) / 0.1;
  return { dx: METEOR_TRAVEL.x * travel, dy: METEOR_TRAVEL.y * travel, alpha };
}
```

- [ ] **Step 4:** test PASS. **Step 5:** CHANGELOG + commit `feat(ui): pure motion poses for ring streaks and meteors`.

---

### Task 6: Layered galaxy artwork

**Files:**
- Create: `src/presentation/galaxyArtFiles.ts`, `src/presentation/galaxyLayers.ts`
- Modify: `src/presentation/GalaxyArtwork.ts` (`preloadGalaxyArtwork`, `addGalaxyArtwork`)
- Test: `tests/galaxyArt.test.ts`

**Interfaces:**
- Consumes: `orbitDotPose`, `meteorPose` (Task 5); SVG files (Task 4); `isReducedMotion` from `./transitions/motion.ts`.
- Produces:
  - from `galaxyArtFiles.ts`: `GALAXY_ART_FILES: Readonly<Record<string, readonly string[]>>` (theme id → svg file stems; `tapestry` renders the dwarf art) and `isLayeredGalaxy(themeId: string): boolean` (true for `ring`, `cluster`, `prism`)
  - `type GalaxyLayerHost = { scene: Phaser.Scene; root: Phaser.GameObjects.Container; size: number; motion: Phaser.Tweens.Tween[]; frame: Array<(elapsedMs: number) => void> }`
  - `buildGalaxyLayers(host: GalaxyLayerHost, themeId: string): void`
  - `preloadGalaxyArtwork(scene: Phaser.Scene, themeIds?: readonly string[]): void` (default `['dwarf', 'spiral', 'tapestry']`, i.e. today's behaviour)

- [ ] **Step 1: Failing test** `tests/galaxyArt.test.ts` (pure parts only; Phaser code is verified visually in Task 10):

```ts
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { GALAXY_ART_FILES, isLayeredGalaxy } from '../src/presentation/galaxyArtFiles.ts';
import { GALAXY_THEMES } from '../src/presentation/galaxyTheme.ts';

describe('galaxy art registry', () => {
  it('has a file list for every theme id', () => {
    for (const theme of Object.values(GALAXY_THEMES)) expect(GALAXY_ART_FILES[theme.id], theme.id).toBeDefined();
  });

  it('every listed file exists under public/assets/galaxies', () => {
    for (const files of Object.values(GALAXY_ART_FILES)) {
      for (const file of files) expect(existsSync(`public/assets/galaxies/${file}.svg`), file).toBe(true);
    }
  });

  it('only ring, cluster and prism use the layered builder', () => {
    expect(['dwarf', 'spiral', 'tapestry', 'ring', 'cluster', 'prism'].filter(isLayeredGalaxy)).toEqual(['ring', 'cluster', 'prism']);
  });
});
```
- [ ] **Step 2:** `npx vitest run tests/galaxyArt.test.ts --pool=forks` → FAIL (module missing).

- [ ] **Step 3: Implement.** First `src/presentation/galaxyArtFiles.ts` (pure, no imports):

```ts
/** SVG file stems per theme id (public/assets/galaxies/<stem>.svg). Chapter 3 reuses the dwarf art. */
const dwarfFiles = ['dwarf', 'dwarf-cloudA', 'dwarf-cloudB'] as const;
export const GALAXY_ART_FILES: Readonly<Record<string, readonly string[]>> = {
  dwarf: dwarfFiles,
  tapestry: dwarfFiles,
  spiral: ['spiral'],
  ring: ['ring', 'ring-core'],
  cluster: [
    'cluster', 'cluster-web', 'cluster-core',
    'cluster-galaxies-0', 'cluster-galaxies-1', 'cluster-galaxies-2', 'cluster-galaxies-3',
    'cluster-meteor-0', 'cluster-meteor-1', 'cluster-meteor-2',
  ],
  prism: ['prism', 'prism-beam', 'prism-fan', 'prism-glass', 'prism-shards-0', 'prism-shards-1', 'prism-shards-2'],
};

const LAYERED = new Set(['ring', 'cluster', 'prism']);
export const isLayeredGalaxy = (themeId: string): boolean => LAYERED.has(themeId);
```

Then `src/presentation/galaxyLayers.ts`:

```ts
import Phaser from 'phaser';
import { isReducedMotion } from './transitions/motion.ts';
import { meteorPose, orbitDotPose, type OrbitSpec } from './galaxyMotion.ts';

export type GalaxyLayerHost = {
  scene: Phaser.Scene;
  root: Phaser.GameObjects.Container;
  /** Display size of the 350-unit kit artboard. */
  size: number;
  /** Looping tweens: paused together when motion is off or the art is hidden. */
  motion: Phaser.Tweens.Tween[];
  /** Per-frame animators fed with the accumulated running time. */
  frame: Array<(elapsedMs: number) => void>;
};

const kit = (host: GalaxyLayerHost) => host.size / 350;

/** A full-artboard layer; `anchor` (kit units) moves the origin so scale tweens grow from that point. */
function layer(host: GalaxyLayerHost, parent: Phaser.GameObjects.Container, stem: string, anchor?: { x: number; y: number }): Phaser.GameObjects.Image {
  const image = host.scene.add.image(0, 0, `galaxy-${stem}`).setName(stem).setDisplaySize(host.size, host.size);
  if (anchor) {
    image.setOrigin(anchor.x / 350, anchor.y / 350);
    image.setPosition((anchor.x - 175) * kit(host), (anchor.y - 175) * kit(host));
  }
  parent.add(image);
  return image;
}

/** Under reduced motion layers keep their final state (never left at alpha 0); otherwise run the intro. */
function intro(play: () => void): void {
  if (!isReducedMotion()) play();
}

function fadeIn(host: GalaxyLayerHost, image: Phaser.GameObjects.Image, delay: number, duration = 700): void {
  intro(() => {
    image.setAlpha(0);
    host.scene.tweens.add({ targets: image, alpha: 1, delay, duration, ease: 'Sine.easeOut' });
  });
}

/** Kit `breath`: scale 1→1.12 and opacity .85→1 over a 3.2 s round trip. */
function breathe(host: GalaxyLayerHost, image: Phaser.GameObjects.Image): void {
  const base = image.scaleX;
  image.setAlpha(0.85);
  host.motion.push(host.scene.tweens.add({
    targets: image, scaleX: base * 1.12, scaleY: base * 1.12, alpha: 1,
    duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  }));
}

function glowTexture(scene: Phaser.Scene): string {
  const key = 'galaxy-orbit-glow';
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, 32, 32)!;
  const glow = texture.context.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  texture.context.fillStyle = glow;
  texture.context.fillRect(0, 0, 32, 32);
  texture.refresh();
  return key;
}

function buildRing(host: GalaxyLayerHost): void {
  // The kit draws the ring horizontally; Menu3 and the map draw it standing up.
  const group = host.scene.add.container(0, 0).setAngle(90);
  host.root.add(group);
  layer(host, group, 'ring');
  breathe(host, layer(host, group, 'ring-core'));
  const streaks: Array<{ spec: OrbitSpec; tint: number; width: number }> = [
    { spec: { rx: 115, ry: 75, fraction: 0.07, phaseMs: 0, dots: 7 }, tint: 0xffffff, width: 11 },
    { spec: { rx: 115, ry: 75, fraction: 0.03, phaseMs: 3000, dots: 5 }, tint: 0x9fd8ff, width: 9 },
  ];
  const glow = glowTexture(host.scene);
  for (const { spec, tint, width } of streaks) {
    const dots = Array.from({ length: spec.dots }, () => {
      const dot = host.scene.add.image(0, 0, glow)
        .setTint(tint).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(width * kit(host), width * kit(host));
      group.add(dot);
      return dot;
    });
    host.frame.push((elapsedMs) => dots.forEach((dot, i) => {
      const pose = orbitDotPose(elapsedMs, spec, i);
      dot.setPosition(pose.x * kit(host), pose.y * kit(host)).setAlpha(pose.alpha);
    }));
  }
}

function buildCluster(host: GalaxyLayerHost): void {
  layer(host, host.root, 'cluster');
  const web = layer(host, host.root, 'cluster-web');
  host.motion.push(host.scene.tweens.add({ targets: web, alpha: { from: 0.55, to: 1 }, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  breathe(host, layer(host, host.root, 'cluster-core'));
  [300, 800, 1300, 1800].forEach((delay, i) => fadeIn(host, layer(host, host.root, `cluster-galaxies-${i}`), delay));
  [1500, 4200, 6900].forEach((delay, i) => {
    const meteor = layer(host, host.root, `cluster-meteor-${i}`).setAlpha(0);
    host.frame.push((elapsedMs) => {
      const pose = meteorPose(elapsedMs, delay);
      meteor.setPosition(pose.dx * kit(host), pose.dy * kit(host)).setAlpha(pose.alpha);
    });
  });
}

function buildPrism(host: GalaxyLayerHost): void {
  const k = kit(host);
  layer(host, host.root, 'prism');
  const beam = layer(host, host.root, 'prism-beam', { x: -1.4, y: 371.8 });
  const fan = layer(host, host.root, 'prism-fan', { x: 175, y: 250 });
  const glass = layer(host, host.root, 'prism-glass', { x: 175, y: 247 });
  const beamScale = beam.scaleX;
  const fanScaleY = fan.scaleY;
  const glassScale = glass.scaleX;
  intro(() => {
    beam.setScale(0);
    host.scene.tweens.add({ targets: beam, scaleX: beamScale, scaleY: beamScale, duration: 900, ease: 'Sine.easeOut' });
  });
  intro(() => {
    fan.setScale(fan.scaleX, 0).setAlpha(0);
    host.scene.tweens.add({
      targets: fan, scaleY: fanScaleY, alpha: 1, delay: 800, duration: 1300, ease: 'Cubic.easeOut',
      onComplete: () => host.motion.push(host.scene.tweens.add({ targets: fan, alpha: { from: 0.7, to: 1 }, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })),
    });
  });
  intro(() => {
    glass.setScale(glassScale * 0.82).setAlpha(0);
    host.scene.tweens.add({ targets: glass, scaleX: glassScale, scaleY: glassScale, alpha: 1, delay: 500, duration: 1400, ease: 'Cubic.easeOut' });
  });
  [1400, 1700, 2000].forEach((delay, i) => {
    const shards = layer(host, host.root, `prism-shards-${i}`);
    fadeIn(host, shards, delay);
    host.motion.push(host.scene.tweens.add({
      targets: shards, y: { from: -5 * k, to: 5 * k }, angle: { from: -1.5, to: 1.5 },
      duration: 2200 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    }));
  });
}

export function buildGalaxyLayers(host: GalaxyLayerHost, themeId: string): void {
  if (themeId === 'ring') buildRing(host);
  else if (themeId === 'cluster') buildCluster(host);
  else if (themeId === 'prism') buildPrism(host);
}
```

  **`src/presentation/GalaxyArtwork.ts` changes:**
  1. Replace `preloadGalaxyArtwork` with:
```ts
/** SVG filters are rasterized once by the loader, never redrawn each frame. */
export function preloadGalaxyArtwork(scene: Phaser.Scene, themeIds: readonly string[] = ['dwarf', 'spiral', 'tapestry']): void {
  for (const id of themeIds) {
    for (const stem of GALAXY_ART_FILES[id] ?? []) {
      const key = `galaxy-${stem}`;
      if (!scene.textures.exists(key)) scene.load.svg(key, `assets/galaxies/${stem}.svg`);
    }
  }
}
```
  2. In `addGalaxyArtwork`: declare `const motion: Phaser.Tweens.Tween[] = []; const frame: Array<(elapsedMs: number) => void> = [];` before building. Wrap the existing key/art/cloud/spiral construction in `if (isLayeredGalaxy(theme.id)) { buildGalaxyLayers({ scene, root, size, motion, frame }, theme.id); } else { …existing code unchanged… }` (the existing `art`/`cloud` creation and the `root.add(art)` / spiral rotation tween stay inside the `else`). In `updateMotion`, after the `starViews.forEach(...)` block add `frame.forEach((animate) => animate(elapsedMs));`. Imports: `GALAXY_ART_FILES, isLayeredGalaxy` from `./galaxyArtFiles.ts` and `buildGalaxyLayers` from `./galaxyLayers.ts`.
  3. Run GitNexus `impact` on `addGalaxyArtwork` and `preloadGalaxyArtwork` first (callers: `MenuScene.create/preload`, `LevelSelectScene`); report to the user.

- [ ] **Step 4:** `npx vitest run tests/galaxyArt.test.ts tests/galaxyStars.test.ts --pool=forks` → PASS; `npm run typecheck` → clean.
- [ ] **Step 5:** CHANGELOG + commit `feat(ui): layered ring, cluster and prism galaxy artwork`.

---

### Task 7: Map integration

**Files:**
- Modify: `src/presentation/LevelSelectScene.ts` (`preload`, `buildConstellation`: layout call, art loop, banner text), `src/presentation/i18n.ts` (one key)
- Test: `tests/i18n.test.ts` (one assertion)

**Interfaces:**
- Consumes: `layoutCampaignMap(entries, teasers)`, `teaserChapters` (Tasks 2–3), `preloadGalaxyArtwork(scene, ids)` (Task 6), `getChapterLabel`.
- Produces: i18n key `map_coming_soon` (`'Sắp ra mắt'` / `'Coming soon'`).

- [ ] **Step 1: Failing test.** In `tests/i18n.test.ts` add: `expect(t('map_coming_soon')).toBe('Sắp ra mắt');` in the `vi` block and `expect(t('map_coming_soon')).toBe('Coming soon');` in the `en` block (follow the neighbouring assertions' locale handling).
- [ ] **Step 2:** run `npx vitest run tests/i18n.test.ts --pool=forks` → FAIL.
- [ ] **Step 3: Implement.**
  - `i18n.ts`: add `map_coming_soon: 'Sắp ra mắt',` after `map_sealed_chapter` in `vi` and `map_coming_soon: 'Coming soon',` in `en`.
  - `LevelSelectScene.preload()`: `preloadGalaxyArtwork(this, Object.values(GALAXY_THEMES).map((theme) => theme.id));` (import `GALAXY_THEMES`).
  - `buildConstellation`: `const layout = layoutCampaignMap(campaignManifest, teaserChapters(campaignManifest));`
  - Art loop: replace `if (band.chapter <= 2) {` with `if (gTheme.id !== 'tapestry') {` (chapter 3 keeps drawing no band art).
  - Banner: compute `const isTeaser = band.nodeCount === 0;` and `const showType = band.chapter !== 3;` and replace the two text objects' strings with:
    - title: `band.chapter <= 2 ? \`Chương ${romanNumeral} · ${gTheme.name}\` : getChapterLabel(band.chapter)` (unchanged expression);
    - subtitle: `isTeaser ? \`${gTheme.galaxyType} · ${t('map_coming_soon')}\` : \`${showType ? gTheme.galaxyType + ' · ' : ''}${chProgress.completed}/${chProgress.total}\``.
  - Leave the Ải Vô Tận gate loop alone: it only iterates chapters 1 and 2.
- [ ] **Step 4:** `npx vitest run tests/i18n.test.ts tests/levelSelect.test.ts tests/mapReveal.test.ts --pool=forks` → PASS; `npm run typecheck` clean.
- [ ] **Step 5:** visual smoke (no automation yet): `npm run dev`, open `http://127.0.0.1:5173/?scene=levelSelect`, scroll down: chapter 4 shows six locked nodes with the ring art, a "Chương V · Hội Tụ — Cụm thiên hà · Sắp ra mắt" banner sits behind fog. Record observations in the CHANGELOG verification bullet.
- [ ] **Step 6:** CHANGELOG + commit `feat(ui): chapters 4-6 on the campaign map`.

---

### Task 8: Menu hero emblem and theme-aware preload

**Files:**
- Create: `src/presentation/menu/chapterHeroGeometry.ts`, `src/presentation/menu/ChapterHeroEmblem.ts`
- Modify: `src/presentation/MenuScene.ts` (init, preload, create emblem selection)
- Test: `tests/chapterHeroGeometry.test.ts`

**Interfaces:**
- Produces:
  - `type HeroKind = 'ring' | 'cluster' | 'prism'`; `heroKindFor(themeId: string): HeroKind | undefined`
  - `type Pt = readonly [number, number]`; `type HeroFace = { color: number; points: readonly Pt[] }`
  - `pinwheelFaces(half: number, rotationDeg?: number): HeroFace[]` (4 triangles + core diamond at 0.42×half)
  - `pinwheelOutline(half: number, rotationDeg?: number): Pt[]`
  - `CLUSTER_SATELLITES: readonly Pt[]` = `(±60.8, ±60.8)`, `CLUSTER_SATELLITE_HALF = 18`, `CLUSTER_CENTER_HALF = 50`, `RING_CENTER_HALF = 56`, `RING_CENTER_ROTATION_DEG = 22`
  - `REFRESH_ARROW = { radius: 88, startAngle: Math.atan2(-20, -84), endAngle: Math.atan2(-66, 60), head: [[52,-80],[74,-62],[48,-54]] }`
  - `class ChapterHeroEmblem` with `constructor(scene, x, y, kind: HeroKind, accent: number)`, `graphics(): Phaser.GameObjects.Graphics[]`, `setRingSpeed(speed: number): void`, `update(deltaMs: number): void` (same surface as `DualJewelEmblem`)

- [ ] **Step 1: Failing test** `tests/chapterHeroGeometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CLUSTER_SATELLITES, REFRESH_ARROW, heroKindFor, pinwheelFaces, pinwheelOutline,
} from '../src/presentation/menu/chapterHeroGeometry.ts';

describe('chapterHeroGeometry', () => {
  it('builds the mockup pinwheel at half-extent 56 (Menu3)', () => {
    const faces = pinwheelFaces(56);
    expect(faces.map((f) => f.color)).toEqual([0xfff0a6, 0xffd23f, 0xf59400, 0xffb31f, 0xffe27a]);
    expect(faces[0].points).toEqual([[0, -56], [0, 0], [-56, 0]]);
    expect(faces[1].points).toEqual([[0, -56], [56, 0], [0, 0]]);
    expect(faces[4].points[0][1]).toBeCloseTo(-23.52, 2);
    expect(pinwheelOutline(56)).toEqual([[0, -56], [56, 0], [0, 56], [-56, 0]]);
  });

  it('rotates about the centre', () => {
    const [top] = pinwheelOutline(56, 90);
    expect(top[0]).toBeCloseTo(56);
    expect(top[1]).toBeCloseTo(0);
  });

  it('places four satellites on the diagonals (Menu4)', () => {
    expect(CLUSTER_SATELLITES).toEqual([[60.8, 60.8], [-60.8, 60.8], [-60.8, -60.8], [60.8, -60.8]]);
  });

  it('draws the refresh arrow on the r=88 circle from (-84,-20) to (60,-66)', () => {
    expect(REFRESH_ARROW.radius).toBe(88);
    expect(Math.hypot(-84, -20)).toBeCloseTo(86.3, 1);
    expect(REFRESH_ARROW.startAngle).toBeLessThan(REFRESH_ARROW.endAngle);
  });

  it('maps theme ids to hero kinds', () => {
    expect(['dwarf', 'spiral', 'tapestry', 'ring', 'cluster', 'prism'].map(heroKindFor))
      .toEqual([undefined, undefined, undefined, 'ring', 'cluster', 'prism']);
  });
});
```
- [ ] **Step 2:** `npx vitest run tests/chapterHeroGeometry.test.ts --pool=forks` → FAIL.
- [ ] **Step 3: Implement `chapterHeroGeometry.ts`:**

```ts
/** Pure geometry for the Menu3/Menu4 hero emblems, in mockup units (390 px wide, origin at the emblem centre). */
export type Pt = readonly [number, number];
export type HeroFace = { color: number; points: readonly Pt[] };
export type HeroKind = 'ring' | 'cluster' | 'prism';

export const PINWHEEL = { nw: 0xfff0a6, ne: 0xffd23f, se: 0xf59400, sw: 0xffb31f, core: 0xffe27a, outline: 0xfff6d6 } as const;
export const RING_CENTER_HALF = 56;
export const RING_CENTER_ROTATION_DEG = 22;
export const CLUSTER_CENTER_HALF = 50;
export const CLUSTER_SATELLITE_HALF = 18;
export const CLUSTER_SATELLITES: readonly Pt[] = [[60.8, 60.8], [-60.8, 60.8], [-60.8, -60.8], [60.8, -60.8]];
export const PRISM_COLORS = [0xff5d7a, 0xff9f45, 0xffe15a, 0x4be0b0, 0x4da3ff, 0xb57cff, 0xff7ad9] as const;

/** Refresh arrow of the ring hero: an r=88 arc centred on the emblem plus a filled head (Menu3). */
export const REFRESH_ARROW = {
  radius: 88,
  startAngle: Math.atan2(-20, -84),
  endAngle: Math.atan2(-66, 60),
  head: [[52, -80], [74, -62], [48, -54]] as readonly Pt[],
} as const;

const rotate = ([x, y]: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** Four coloured triangles and the lighter core diamond (0.42 × half), as in the mockups. */
export function pinwheelFaces(half: number, rotationDeg = 0): HeroFace[] {
  const c = 0.42 * half;
  const faces: Array<[number, Pt[]]> = [
    [PINWHEEL.nw, [[0, -half], [0, 0], [-half, 0]]],
    [PINWHEEL.ne, [[0, -half], [half, 0], [0, 0]]],
    [PINWHEEL.se, [[half, 0], [0, half], [0, 0]]],
    [PINWHEEL.sw, [[0, half], [-half, 0], [0, 0]]],
    [PINWHEEL.core, [[0, -c], [c, 0], [0, c], [-c, 0]]],
  ];
  return faces.map(([color, points]) => ({ color, points: rotationDeg ? points.map((p) => rotate(p, rotationDeg)) : points }));
}

export function pinwheelOutline(half: number, rotationDeg = 0): Pt[] {
  const outline: Pt[] = [[0, -half], [half, 0], [0, half], [-half, 0]];
  return rotationDeg ? outline.map((p) => rotate(p, rotationDeg)) : outline;
}

export function heroKindFor(themeId: string): HeroKind | undefined {
  return themeId === 'ring' || themeId === 'cluster' || themeId === 'prism' ? themeId : undefined;
}
```
  Test expects `pinwheelFaces(56)[0].points` toEqual literal arrays: unrotated branch returns the literals ✓; `pinwheelOutline(56)` literal ✓.

  **`ChapterHeroEmblem.ts`** (same surface as `DualJewelEmblem`; drawing mirrors `drawChapterOneHero`):

```ts
import Phaser from 'phaser';
import { isReducedMotion, getMotionScale } from '../transitions/motion.ts';
import {
  CLUSTER_CENTER_HALF, CLUSTER_SATELLITES, CLUSTER_SATELLITE_HALF, PINWHEEL, PRISM_COLORS, REFRESH_ARROW,
  RING_CENTER_HALF, RING_CENTER_ROTATION_DEG, pinwheelFaces, pinwheelOutline,
  type HeroKind, type Pt,
} from './chapterHeroGeometry.ts';

const toPoints = (pts: readonly Pt[], dx = 0, dy = 0) => pts.map(([x, y]) => new Phaser.Geom.Point(x + dx, y + dy));

/**
 * Hero emblem for the Menu3 (ring) and Menu4 (cluster) mockups, plus a placeholder prism glyph for chapter VI.
 * Drawn once in mockup units; the caller scales it by 720/390 like the chapter I hero.
 */
export class ChapterHeroEmblem {
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly sparkle: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private ringSpeed = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: HeroKind, accent: number) {
    this.body = scene.add.graphics().setPosition(x, y);
    this.sparkle = scene.add.graphics().setPosition(x, y);
    this.ring = scene.add.graphics().setPosition(x, y);
    this.drawDisc(accent);
    if (kind === 'ring') this.drawRing(accent);
    else if (kind === 'cluster') this.drawCluster(accent);
    else this.drawPrism();
    this.ring.lineStyle(1.2, accent, 0.45);
    const dashes = Math.round((2 * Math.PI * 132) / 10);
    for (let i = 0; i < dashes; i++) {
      const a = (i / dashes) * Math.PI * 2;
      this.ring.beginPath();
      this.ring.arc(0, 0, 132, a, a + 2 / 132);
      this.ring.strokePath();
    }
  }

  graphics(): Phaser.GameObjects.Graphics[] {
    return [this.body, this.sparkle, this.ring];
  }

  setRingSpeed(speed: number): void {
    this.ringSpeed = speed;
  }

  /** The dotted ring turns once per 4 minutes (kit `spin` 240 s); everything else is static. */
  update(deltaMs: number): void {
    if (isReducedMotion()) return;
    this.ring.rotation += ((2 * Math.PI) / 240000) * deltaMs * this.ringSpeed * getMotionScale();
  }

  private drawDisc(accent: number): void {
    const g = this.body;
    g.fillStyle(accent, 0.1);
    g.fillCircle(0, 0, 118);
    g.lineStyle(1.5, accent, 0.55);
    g.strokeCircle(0, 0, 118);
    for (let i = 0; i < 8; i++) { // stands in for the mockup's blurred r=70 glow
      g.fillStyle(accent, 0.055);
      g.fillCircle(0, 0, 40 + i * 8);
    }
  }

  private drawPinwheel(cx: number, cy: number, half: number, rotationDeg = 0): void {
    const g = this.body;
    for (const face of pinwheelFaces(half, rotationDeg)) {
      g.fillStyle(face.color, 1);
      g.fillPoints(toPoints(face.points, cx, cy), true);
    }
    g.lineStyle(2.5, PINWHEEL.outline, 1);
    g.strokePoints(toPoints(pinwheelOutline(half, rotationDeg), cx, cy), true);
  }

  private drawRing(accent: number): void {
    const g = this.body;
    g.lineStyle(5, accent, 1);
    g.beginPath();
    g.arc(0, 0, REFRESH_ARROW.radius, REFRESH_ARROW.startAngle, REFRESH_ARROW.endAngle, false);
    g.strokePath();
    g.fillStyle(accent, 1);
    g.fillPoints(toPoints(REFRESH_ARROW.head), true);
    this.drawPinwheel(0, 0, RING_CENTER_HALF, RING_CENTER_ROTATION_DEG);
  }

  private drawCluster(accent: number): void {
    const g = this.body;
    g.lineStyle(2, accent, 0.8);
    for (const [sx, sy] of CLUSTER_SATELLITES) { // dash 2 / gap 6 along each link
      const length = Math.hypot(sx, sy);
      for (let d = 0; d < length; d += 8) {
        const t0 = d / length;
        const t1 = Math.min(1, (d + 2) / length);
        g.lineBetween(sx * (1 - t0), sy * (1 - t0), sx * (1 - t1), sy * (1 - t1));
      }
    }
    for (const [sx, sy] of CLUSTER_SATELLITES) this.drawPinwheel(sx, sy, CLUSTER_SATELLITE_HALF);
    this.drawPinwheel(0, 0, CLUSTER_CENTER_HALF);
  }

  /** Placeholder for chapter VI (no Menu mockup yet): the kit's prism triangle with a seven-colour fan. */
  private drawPrism(): void {
    const g = this.body;
    PRISM_COLORS.forEach((color, i) => {
      const angle = ((i - 3) * 9 * Math.PI) / 180;
      g.lineStyle(5, color, 0.85);
      g.lineBetween(28, 8, 28 + Math.cos(angle) * 78, 8 + Math.sin(angle) * 78);
    });
    g.fillStyle(0xddf6ff, 0.35);
    g.fillTriangle(0, -52, 50, 34, -50, 34);
    g.lineStyle(2.5, 0xffffff, 1);
    g.strokeTriangle(0, -52, 50, 34, -50, 34);
  }
}
```

  **`MenuScene.ts`:**
  1. Add `private previewChapter?: number;` and `init(data: { chapter?: number } = {}): void { this.previewChapter = data.chapter; }`.
  2. Add `private currentTheme(completed: readonly string[]): GalaxyTheme { return this.previewChapter ? resolveGalaxyTheme(this.previewChapter) : resolveCurrentGalaxyTheme(completed); }` (import `resolveGalaxyTheme`), and use it in `create()` (line ~75), in `buildMainMenu` (`const currentTheme = …`) and in the new `preload()`.
  3. `preload()`: read progress with the same repository call as `create()` (`createProgressRepository(localStorage, campaignManifest, 'oracle-v1').read().progress.completed`) and call `preloadGalaxyArtwork(this, [this.currentTheme(completed).id]);`.
  4. Emblem: type the field as `private emblem!: MenuEmblem;` with a local `type MenuEmblem = Pick<DualJewelEmblem, 'graphics' | 'setRingSpeed' | 'update'>;` and replace the creation with:
```ts
    const heroKind = heroKindFor(theme.id);
    const heroStatic = heroChapterOne || heroKind !== undefined;
    this.emblem = heroKind
      ? new ChapterHeroEmblem(this, 360, view.height * 0.52, heroKind, theme.colors.accent)
      : new DualJewelEmblem(this, 360, view.height * 0.52, heroChapterOne ? theme.colors.accent : undefined);
    this.emblem.graphics().forEach(graphic => graphic.setScale(heroStatic ? CHAPTER_ONE_HERO_SCALE : 1.35));
```
  5. GitNexus `impact` on `MenuScene.create` and `MenuScene.buildMainMenu` before editing.
- [ ] **Step 4:** `npx vitest run tests/chapterHeroGeometry.test.ts --pool=forks` → PASS; `npm run typecheck` clean.
- [ ] **Step 5:** CHANGELOG + commit `feat(ui): ring, cluster and prism menu hero emblems`.

---

### Task 9: Dev preview parameters

**Files:**
- Modify: `src/launchParams.ts`, `src/main.ts` (lines ~163-172), `src/presentation/LevelSelectScene.ts` (`init`, reveal)
- Test: `tests/launchParams.test.ts`

**Interfaces:**
- Produces: `LaunchTarget` variants `{ scene: 'MenuScene'; skipSplash?: boolean; chapter?: number }` and `{ scene: 'LevelSelectScene'; focusLevelId?: string; revealAll?: boolean }`. Both extras are honoured only when `isDev`. `chapter` must be an integer 1–6.

- [ ] **Step 1: Failing tests** appended to `tests/launchParams.test.ts`:

```ts
  test('chapter previews the menu theme, dev only, 1-6 only', () => {
    expect(resolveLaunch('?scene=menu&chapter=4', true)).toEqual({ scene: 'MenuScene', skipSplash: true, chapter: 4 });
    expect(resolveLaunch('?scene=menu&chapter=4', false)).toEqual({ scene: 'MenuScene', skipSplash: true });
    expect(resolveLaunch('?scene=menu&chapter=7', true)).toEqual({ scene: 'MenuScene', skipSplash: true });
    expect(resolveLaunch('?scene=menu&chapter=x', true)).toEqual({ scene: 'MenuScene', skipSplash: true });
  });

  test('revealAll opens the whole map, dev only', () => {
    expect(resolveLaunch('?scene=levelSelect&revealAll=1', true)).toEqual({ scene: 'LevelSelectScene', revealAll: true });
    expect(resolveLaunch('?scene=levelSelect&revealAll=1', false)).toEqual({ scene: 'LevelSelectScene' });
    expect(resolveLaunch('?scene=levelSelect&focus=3-4&revealAll=1', true)).toEqual({ scene: 'LevelSelectScene', focusLevelId: '3-4', revealAll: true });
  });
```
- [ ] **Step 2:** `npx vitest run tests/launchParams.test.ts --pool=forks` → FAIL.
- [ ] **Step 3: Implement.** `launchParams.ts`: update the `LaunchTarget` union as above; in the `levelSelect` branch build `{ scene: 'LevelSelectScene', ...(isDev && focus ? { focusLevelId: focus } : {}), ...(isDev && params.get('revealAll') === '1' ? { revealAll: true } : {}) }`; in the menu branch:
```ts
  const chapter = Number(params.get('chapter'));
  const preview = isDev && Number.isInteger(chapter) && chapter >= 1 && chapter <= 6 ? { chapter } : {};
  return skipSplash ? { scene: 'MenuScene', skipSplash: true, ...preview } : { scene: 'MenuScene' };
```
  (`Number(null)` is 0 → ignored ✓.) `main.ts`: `director.boot('MenuScene', launch.chapter ? { chapter: launch.chapter } : {});` (narrow with `'chapter' in launch`) and `director.boot('LevelSelectScene', { ...(launch.focusLevelId ? { focusLevelId: launch.focusLevelId } : {}), ...(launch.revealAll ? { revealAll: true } : {}) });`. `LevelSelectScene.init`: accept `revealAll?: boolean`, store `this.revealAll = data.revealAll ?? false`, and in `buildConstellation` after the `let reveal = …` line add `if (this.revealAll) reveal = { limitY: layout.totalHeight, chapterTail: false, sealedUntilChapter: null };` (and skip `pendingUnlock`'s reveal rewrite when `revealAll`).
- [ ] **Step 4:** PASS; `npm run typecheck`.
- [ ] **Step 5:** CHANGELOG + commit `feat(dev): chapter preview and reveal-all launch parameters`.

---

### Task 10: Visual and motion verification

**Files:**
- Create: `scripts/check-galaxy-chapters.mjs`

- [ ] **Step 1: Write `scripts/check-galaxy-chapters.mjs`** (same prerequisites as `check-galaxy-ui.mjs`: dev server on :5173, `PLAYWRIGHT_MODULE`, optional `CHROMIUM_EXECUTABLE`, isolated profile). Layers are findable because `layer()` names each image with its stem.

```js
// Visual and motion check for chapters 4-6 (menu heroes, galaxy layers, map bands).
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE });
const output = new URL('../../.shots/galaxy/', import.meta.url);
mkdirSync(output, { recursive: true });
const errors = [];

const waitScene = async (page, key) => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const ok = await page.evaluate(async key => {
      const { director } = await import('/src/presentation/transitions/SceneDirector.ts');
      const scene = director.host?.game.scene.getScene(key);
      return scene?.sys.settings.status === 5 && scene.scene.isActive() && !director.isTransitioning() && scene.input.enabled;
    }, key);
    if (ok) return;
    await page.waitForTimeout(100);
  }
  assert.fail(`${key} never became ready`);
};

/** Reads a number from a named layer of the menu galaxy; the layer may sit inside a rotated group. */
const layerValue = (page, stem, prop) => page.evaluate(async ({ stem, prop }) => {
  const { director } = await import('/src/presentation/transitions/SceneDirector.ts');
  const find = (obj) => obj.name === stem ? obj : obj.list?.map(find).find(Boolean);
  const layer = find(director.host.game.scene.getScene('MenuScene').galaxy);
  return layer ? layer[prop] : null;
}, { stem, prop });

const PULSE = { 4: ['ring-core', 'scaleX'], 5: ['cluster-web', 'alpha'], 6: ['prism-shards-0', 'y'] };
const EXPECTED_LAYERS = { 4: ['ring', 'ring-core'], 5: ['cluster', 'cluster-web', 'cluster-core', 'cluster-galaxies-0', 'cluster-galaxies-3', 'cluster-meteor-2'], 6: ['prism', 'prism-beam', 'prism-fan', 'prism-glass', 'prism-shards-2'] };

try {
  for (const chapter of [4, 5, 6]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:5173/?scene=menu&chapter=${chapter}`);
    await waitScene(page, 'MenuScene');
    await page.waitForTimeout(2600); // intro tweens finish
    await page.screenshot({ path: fileURLToPath(new URL(`menu-ch${chapter}.png`, output)) });

    for (const stem of EXPECTED_LAYERS[chapter]) assert.notEqual(await layerValue(page, stem, 'type'), null, `ch${chapter}: layer ${stem} exists`);

    const [stem, prop] = PULSE[chapter];
    const before = await layerValue(page, stem, prop);
    await page.waitForTimeout(1200);
    assert.notEqual(await layerValue(page, stem, prop), before, `ch${chapter}: ${stem}.${prop} animates`);
    await page.evaluate(async () => (await import('/src/presentation/transitions/motion.ts')).setMotionScale(0));
    const frozen = await layerValue(page, stem, prop);
    await page.waitForTimeout(400);
    assert.equal(await layerValue(page, stem, prop), frozen, `ch${chapter}: reduced motion freezes ${stem}`);
    for (const layerStem of EXPECTED_LAYERS[chapter]) {
      assert.ok((await layerValue(page, layerStem, 'alpha')) > 0, `ch${chapter}: ${layerStem} visible under reduced motion`);
    }
    await page.evaluate(async () => (await import('/src/presentation/transitions/motion.ts')).setMotionScale(1));

    if (chapter === 5) { // a meteor must cross within one 8 s cycle
      let seen = false;
      for (let i = 0; i < 90 && !seen; i++) {
        for (const n of [0, 1, 2]) seen ||= (await layerValue(page, `cluster-meteor-${n}`, 'alpha')) > 0.5;
        await page.waitForTimeout(100);
      }
      assert.ok(seen, 'a cluster meteor becomes visible');
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:5173/?scene=levelSelect&revealAll=1');
  await waitScene(page, 'LevelSelectScene');
  const bands = await page.evaluate(async () => {
    const { layoutCampaignMap } = await import('/src/presentation/constellationLayout.ts');
    const { teaserChapters } = await import('/src/presentation/galaxyTheme.ts');
    const { campaignManifest } = await import('/src/content/manifest.ts');
    return layoutCampaignMap(campaignManifest, teaserChapters(campaignManifest)).chapters;
  });
  assert.deepEqual(bands.map(b => [b.chapter, b.nodeCount]), [[1, 6], [2, 6], [3, 10], [4, 6], [5, 0], [6, 0]]);
  for (const band of bands) {
    await page.evaluate(async ({ top, bottom }) => {
      const { director } = await import('/src/presentation/transitions/SceneDirector.ts');
      const scene = director.host.game.scene.getScene('LevelSelectScene');
      const halfView = scene.cameras.main.height / scene.cameras.main.zoom / 2;
      scene.mapContainer.y = halfView - (top + bottom) / 2;
    }, band);
    await page.waitForTimeout(600);
    await page.screenshot({ path: fileURLToPath(new URL(`map-band-${band.chapter}.png`, output)) });
  }
  await context.close();
} finally {
  await browser.close();
}
assert.deepEqual(errors, [], `browser errors: ${errors.join(' | ')}`);
console.log('galaxy chapter 4-6 checks passed');
```

- [ ] **Step 2: Run it.** `npm run dev` in one terminal; `PLAYWRIGHT_MODULE=<path> node scripts/check-galaxy-chapters.mjs` in another. Expected: exit 0, 3 menu screenshots and 6 map-band screenshots in `.shots/galaxy/` (not committed).
- [ ] **Step 3: Compare with the mockups** side by side (`docs/gdd/assets/Menu · Chương III Luân Chuyển-html/Menu3.dc.html`, `Menu · Chương IV Hội Tụ-html/Menu4.dc.html`, `Chọn màn · bản đồ 5 thiên hà (cuộn dọc)-html/GalaxyMap.dc.html`; serve with `python -m http.server`). Check: ring standing up with orbiting streaks and a gold core; cluster with web, giant core and meteors; prism beam, rainbow fan and floating shards; accent colors on pill, badge, buttons; chapter banners and teaser subtitle "Sắp ra mắt". Fix deviations that are bugs; list any intended deviations (no per-galaxy spin, whole-layer float) in the CHANGELOG.
- [ ] **Step 4: Full verification:** `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks`, `npm run typecheck`, `npm run build`. Report real counts, including any worker-exit errors.
- [ ] **Step 5:** CHANGELOG + commit `test(ui): visual and motion check for chapters 4-6`.

---

### Task 11: Docs and handoff (controller only)

**Files:**
- Modify: `docs/ai/STATUS.md`, `docs/ai/DOCS-INDEX.md` (GX2 row only), `docs/ai/ARCHITECTURE.md`, `docs/superpowers/specs/2026-10-09-galaxy-themes-chapters-4-6-design.md`, `CHANGELOG.md`

- [ ] **Step 1:** Overwrite `docs/ai/STATUS.md` ("Now", streams table with a **GX2 chapters 4–6** row, open decisions, gotchas), ≤ 60 lines, date line bumped. Open decisions to record: chapter VI numbering and placeholder prism emblem; chapter 3 Họa Phẩm currently shares chapter 4's palette (`#3A1A4E→#4A2440`, accent `#FFB45A`) — needs its own mockup/palette; texture memory on Android; per-galaxy spin dropped.
- [ ] **Step 2:** `docs/ai/DOCS-INDEX.md`: set the GX2 row to `approved`/`in progress` and link this plan; stage with `git add -p` (GX2 row only; leave the LOC row).
- [ ] **Step 3:** `docs/ai/ARCHITECTURE.md`: read it first, then add to the presentation section: layered galaxy art (`galaxyLayers.ts`, `GALAXY_ART_FILES`, ring rotated 90°, layers regenerated by `scripts/extract-galaxy-art.mjs`), teaser bands (`layoutCampaignMap` third argument, `teaserChapters`), dev params `chapter` and `revealAll`.
- [ ] **Step 4:** Update the spec to match what was built: §4 (ring rotated 90°; cluster = 4 fade-in groups, prism = 3 float groups, 32 shards not ~20, orbit streaks drawn in code), §3 (the `tagline` is the text the menu fact box renders), §6 (`computeMapReveal` needs no change: a teaser that is the last band simply opens the map; tests added in Task 3).
- [ ] **Step 5:** CHANGELOG entry for the docs; commit `docs(ai): status and architecture for chapter 4-6 galaxy themes`. Do not push; the reviewer merges.

---

## Self-Review (done)

- **Spec coverage:** §2 decisions → Tasks 1–3; §3 theme data → Task 2; §4 artwork → Tasks 4–6 (deviations stated); §5 menu → Tasks 8–9; §6 map → Tasks 3, 7; §8 testing → each task + Task 10; §9 risks → Task 11 open decisions; §10 → Task 11.
- **Placeholders:** none; the prism emblem is an explicit, flagged placeholder per the spec.
- **Type consistency:** `teaserChapters` (Task 2) → used in Tasks 7 and 10; `layoutCampaignMap(entries, teasers)` (Task 3) → Task 7; `preloadGalaxyArtwork(scene, ids)` and `GALAXY_ART_FILES` (Task 6) → Tasks 7–8; `heroKindFor` / `ChapterHeroEmblem` (Task 8) → `MenuScene`; `init({ chapter })` (Task 8) ← `launch.chapter` (Task 9).

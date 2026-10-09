# LOC — Multi-Language Localization Engine & Expansion (id, pt-BR, ja) — Design Spec

**Date:** 2026-10-09  
**Status:** Approved  
**Author:** Antigravity  
**Scope:** `game-next/src/localization/`, `game-next/src/locales/`, `game-next/src/presentation/`  
**Depends on:** BR (casual branding & bilingual baseline), VR1 (MenuScene), SettingsDialog, designTokens  
**Reference Architecture:** Engine Localization Pattern (`localizationConfig`, `LocaleResolver`, `LocalizationManager`, `LocaleSettings`)

---

## 1. Executive Summary & Background

Mirror was previously limited to two hardcoded locales: Vietnamese (`vi`) and English (`en`), embedded in a single 292-line file (`game-next/src/presentation/i18n.ts`). The locale toggle was a 2-state binary switch (`vi` vs `en`), and initial launch defaulted unconditionally to `vi` regardless of player OS/browser configuration.

To reach players worldwide, this specification introduces a robust, modular localization engine supporting 5 locales:
1. **Vietnamese (`vi`)** — Tiếng Việt (Default origin)
2. **English (`en-US`)** — International English (Standardized to BCP 47 `en-US`)
3. **Indonesian (`id`)** — Bahasa Indonesia
4. **Brazilian Portuguese (`pt-BR`)** — Português (Brasil)
5. **Japanese (`ja`)** — 日本語

### Key Architectural Enhancements
- **Clean Engine Architecture**: Separation of concerns into `localizationConfig.ts`, `LocaleResolver.ts`, `LocalizationManager.ts`, and structured locale bundles under `src/locales/<locale>/` (`common.json`, `game.json`).
- **3-Tier Intelligent Resolver**:
  1. *Player Saved Preference* in `localStorage` (`mirror.rebuild.locale`), with auto-migration from legacy `'en'` to `'en-US'`.
  2. *Device / System Language* detected via `navigator.languages` or `navigator.language` with prefix matching.
  3. *Engine Fallback* to `en-US`.
- **Zero-Breaking-Change Facade**: `presentation/i18n.ts` remains intact as a transparent proxy to `LocalizationManager`, preserving backward compatibility for existing game callers (`Hud.ts`, `PlayScene.ts`, `MenuScene.ts`, etc.).
- **Redesigned Language Selection UI**:
  - *MenuScene*: Compact top pill `[ 🌐 VI ]` triggering a dedicated `LanguageSelectDialog` modal with native language names and flag badges.
  - *SettingsDialog*: Interactive 5-segment pill bar `[ VI | EN | ID | PT | JA ]`.
- **CJK System Font Fallback Stack**: Native Japanese glyph rendering via OS CJK fonts (`'Hiragino Sans'`, `'Noto Sans CJK JP'`, `'Yu Gothic'`, `'Meiryo'`), avoiding multi-megabyte webfont bloat while maintaining crisp text rendering.
- **100% Content Parity**: Complete translation sets for all UI keys, 4 chapter titles, 28 campaign level titles, and 20 menu astronomical taglines.

---

## 2. Goals & Non-Goals

### Goals
- **G1 (Modularity)**: Isolate localization into `src/localization/` and `src/locales/` with typed schemas and JSON data files.
- **G2 (Resolver Priority)**: Implement strict 3-tier resolution: Saved Preference $\to$ Device/System Locale $\to$ Fallback Locale (`en-US`).
- **G3 (5-Locale Parity)**: Complete translations for `vi`, `en-US`, `id`, `pt-BR`, `ja` across all game text.
- **G4 (Interactive UI)**: Modern modal picker in `MenuScene` and 5-way segmented control in `SettingsDialog`.
- **G5 (Font Compatibility)**: Integrate CJK system font stack in `TYPO_TOKENS.fontFamily`.
- **G6 (Automated Verification)**: Exhaustive test coverage verifying key symmetry, resolver precedence, and font coverage.

### Non-Goals
- Lazy-loading / asynchronous network fetching of locales (the total static payload of all 5 languages is ~35 KB, bundled synchronously via Vite).
- Audio speech or voiceover dubbing (Mirror audio relies purely on procedural WebAudio synthesis and streaming ambient tracks).
- Supporting Right-to-Left (RTL) writing systems (Arabic, Hebrew) in this phase.

---

## 3. Localization Engine Architecture

### 3.1 Directory Structure

```text
game-next/src/
├── localization/
│   ├── localizationConfig.ts    # Config constants, supported locales, and metadata registry
│   ├── LocaleResolver.ts        # 3-tier locale resolution algorithm & normalization
│   ├── LocalizationManager.ts   # Singleton state manager, dictionary loader, event emitter
│   ├── LocaleSettings.ts        # Persistence helper for localStorage read/write/migration
│   ├── types.ts                 # TypeScript types for schemas, metadata, and events
│   └── index.ts                 # Barrel exports
│
├── locales/
│   ├── en-US/
│   │   ├── common.json          # UI buttons, settings, pause, victory, toasts
│   │   └── game.json            # Chapter names, 28 level titles, 20 menu taglines
│   ├── vi/
│   │   ├── common.json
│   │   └── game.json
│   ├── id/
│   │   ├── common.json
│   │   └── game.json
│   ├── pt-BR/
│   │   ├── common.json
│   │   └── game.json
│   └── ja/
│       ├── common.json
│       └── game.json
│
└── presentation/
    ├── i18n.ts                  # Backward-compatible proxy module
    ├── LanguageSelectDialog.ts  # Modal dialog component for MenuScene
    └── ...
```

---

### 3.2 Configuration & Metadata (`localizationConfig.ts`)

```typescript
export const localizationConfig = {
  defaultLocale: 'en-US' as const,
  supportedLocales: ['en-US', 'vi', 'id', 'pt-BR', 'ja'] as const,
  allowManualLanguageSelection: true,
  persistSelectedLocale: true,
  fallbackLocale: 'en-US' as const,
  storageKey: 'mirror.rebuild.locale',
};

export type SupportedLocale = (typeof localizationConfig.supportedLocales)[number];

export interface LocaleMetadata {
  readonly code: SupportedLocale;
  readonly shortLabel: string;   // e.g. 'EN', 'VI', 'ID', 'PT', 'JA'
  readonly nativeName: string;   // e.g. 'English', 'Tiếng Việt', 'Bahasa Indonesia', 'Português', '日本語'
  readonly flagEmoji: string;    // e.g. '🇺🇸', '🇻🇳', '🇮🇩', '🇧🇷', '🇯🇵'
}

export const LOCALE_REGISTRY: Readonly<Record<SupportedLocale, LocaleMetadata>> = {
  'vi': {
    code: 'vi',
    shortLabel: 'VI',
    nativeName: 'Tiếng Việt',
    flagEmoji: '🇻🇳',
  },
  'en-US': {
    code: 'en-US',
    shortLabel: 'EN',
    nativeName: 'English',
    flagEmoji: '🇺🇸',
  },
  'id': {
    code: 'id',
    shortLabel: 'ID',
    nativeName: 'Bahasa Indonesia',
    flagEmoji: '🇮🇩',
  },
  'pt-BR': {
    code: 'pt-BR',
    shortLabel: 'PT',
    nativeName: 'Português',
    flagEmoji: '🇧🇷',
  },
  'ja': {
    code: 'ja',
    shortLabel: 'JA',
    nativeName: '日本語',
    flagEmoji: '🇯🇵',
  },
};
```

---

### 3.3 3-Tier Locale Resolution Algorithm (`LocaleResolver.ts`)

```typescript
import { localizationConfig, SupportedLocale } from './localizationConfig.ts';
import { LocaleSettings } from './LocaleSettings.ts';

export class LocaleResolver {
  /**
   * Resolves active locale following the strict priority:
   * 1. Player explicit saved choice (migrating legacy 'en' -> 'en-US')
   * 2. Device / OS / browser language matching
   * 3. Fallback locale ('en-US')
   */
  public static resolve(
    nav: { languages?: readonly string[]; language?: string } = typeof navigator !== 'undefined' ? navigator : {}
  ): SupportedLocale {
    // Tier 1: Saved selection
    const saved = LocaleSettings.getSavedLocale();
    if (saved) return saved;

    // Tier 2: Device / Browser language
    const deviceCandidates: string[] = [];
    if (nav.languages && nav.languages.length > 0) {
      deviceCandidates.push(...nav.languages);
    } else if (nav.language) {
      deviceCandidates.push(nav.language);
    }

    for (const raw of deviceCandidates) {
      const matched = this.matchDeviceTag(raw);
      if (matched) return matched;
    }

    // Tier 3: Fallback locale
    return localizationConfig.fallbackLocale;
  }

  /**
   * Normalizes arbitrary BCP 47 tags to supported locales
   */
  public static matchDeviceTag(tag: string): SupportedLocale | null {
    if (!tag) return null;
    const lower = tag.toLowerCase().trim();

    // Exact matches
    if (lower === 'en-us' || lower === 'en') return 'en-US';
    if (lower === 'vi' || lower.startsWith('vi-')) return 'vi';
    if (lower === 'id' || lower.startsWith('id-')) return 'id';
    if (lower === 'pt-br' || lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR';
    if (lower === 'ja' || lower.startsWith('ja-')) return 'ja';

    // Prefix fallbacks for English variants (en-GB, en-AU, en-CA, etc.)
    if (lower.startsWith('en-')) return 'en-US';

    return null;
  }
}
```

---

### 3.4 Persistence Helper (`LocaleSettings.ts`)

```typescript
import { localizationConfig, SupportedLocale } from './localizationConfig.ts';

export class LocaleSettings {
  public static getSavedLocale(): SupportedLocale | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(localizationConfig.storageKey);
      if (!raw) return null;

      // Migrate legacy 'en' to 'en-US'
      if (raw === 'en') {
        this.saveLocale('en-US');
        return 'en-US';
      }

      if (localizationConfig.supportedLocales.includes(raw as SupportedLocale)) {
        return raw as SupportedLocale;
      }
    } catch {
      // Storage access blocked or restricted
    }
    return null;
  }

  public static saveLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(localizationConfig.storageKey, locale);
    } catch {
      // Storage access blocked or restricted
    }
  }

  public static clearSavedLocale(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(localizationConfig.storageKey);
    } catch {}
  }
}
```

---

### 3.5 Core Manager (`LocalizationManager.ts`)

```typescript
import { localizationConfig, LOCALE_REGISTRY, LocaleMetadata, SupportedLocale } from './localizationConfig.ts';
import { LocaleResolver } from './LocaleResolver.ts';
import { LocaleSettings } from './LocaleSettings.ts';
import { CommonTranslations, GameTranslations, TranslationBundle } from './types.ts';

// Direct synchronous bundle imports via Vite
import enCommon from '../locales/en-US/common.json';
import enGame from '../locales/en-US/game.json';
import viCommon from '../locales/vi/common.json';
import viGame from '../locales/vi/game.json';
import idCommon from '../locales/id/common.json';
import idGame from '../locales/id/game.json';
import ptCommon from '../locales/pt-BR/common.json';
import ptGame from '../locales/pt-BR/game.json';
import jaCommon from '../locales/ja/common.json';
import jaGame from '../locales/ja/game.json';

export class LocalizationManager {
  private static instance: LocalizationManager;

  private currentLocale: SupportedLocale;
  private readonly bundles: Record<SupportedLocale, TranslationBundle>;
  private readonly listeners = new Set<(locale: SupportedLocale) => void>();

  private constructor() {
    this.bundles = {
      'en-US': { common: enCommon as CommonTranslations, game: enGame as GameTranslations },
      'vi': { common: viCommon as CommonTranslations, game: viGame as GameTranslations },
      'id': { common: idCommon as CommonTranslations, game: idGame as GameTranslations },
      'pt-BR': { common: ptCommon as CommonTranslations, game: ptGame as GameTranslations },
      'ja': { common: jaCommon as CommonTranslations, game: jaGame as GameTranslations },
    };
    this.currentLocale = LocaleResolver.resolve();
  }

  public static getInstance(): LocalizationManager {
    if (!LocalizationManager.instance) {
      LocalizationManager.instance = new LocalizationManager();
    }
    return LocalizationManager.instance;
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  public getMetadata(locale = this.currentLocale): LocaleMetadata {
    return LOCALE_REGISTRY[locale];
  }

  public setLocale(locale: SupportedLocale): void {
    if (!localizationConfig.supportedLocales.includes(locale)) return;
    if (this.currentLocale === locale) return;

    this.currentLocale = locale;
    if (localizationConfig.persistSelectedLocale) {
      LocaleSettings.saveLocale(locale);
    }

    this.listeners.forEach((listener) => listener(locale));
  }

  public onLocaleChange(listener: (locale: SupportedLocale) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public t(key: keyof CommonTranslations, params?: Record<string, string | number>): string {
    const dict = this.bundles[this.currentLocale]?.common || this.bundles['en-US'].common;
    let text = dict[key] || this.bundles['en-US'].common[key] || String(key);

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
    }
    return text;
  }

  public getLevelTitle(levelId: string, fallbackTitle = ''): string {
    const titles = this.bundles[this.currentLocale]?.game?.levelTitles || this.bundles['en-US'].game.levelTitles;
    return titles[levelId] || fallbackTitle || this.bundles['en-US'].game.levelTitles[levelId] || levelId;
  }

  public getChapterName(chapter: number, fallbackName?: string): string {
    const chapters = this.bundles[this.currentLocale]?.game?.chapters || this.bundles['en-US'].game.chapters;
    return chapters[String(chapter)] || fallbackName || `Chapter ${chapter}`;
  }

  public getChapterLabel(chapter: number, fallbackName?: string): string {
    const roman = ['I', 'II', 'III', 'IV'][chapter - 1] ?? String(chapter);
    const prefix = this.t('chapter_prefix');
    const name = this.getChapterName(chapter, fallbackName);
    return `${prefix} ${roman} · ${name}`;
  }

  public getRandomMenuTagline(): string {
    const list = this.bundles[this.currentLocale]?.game?.taglines || this.bundles['en-US'].game.taglines;
    return list[Math.floor(Math.random() * list.length)];
  }
}
```

---

### 3.6 Backward-Compatible Facade (`presentation/i18n.ts`)

Existing files across `presentation/` import `{ t, getLocale, setLocale, getLevelTitle, getChapterName, getChapterLabel, getRandomMenuTagline, onLocaleChange, Locale }` from `presentation/i18n.ts`.

To maintain strict zero-regression compatibility:

```typescript
import { LocalizationManager } from '../localization/LocalizationManager.ts';
import { SupportedLocale } from '../localization/localizationConfig.ts';
import { CommonTranslations } from '../localization/types.ts';

export type Locale = SupportedLocale;
export type TranslationKey = keyof CommonTranslations;

const manager = LocalizationManager.getInstance();

export const getLocale = (): Locale => manager.getLocale();
export const setLocale = (locale: Locale): void => manager.setLocale(locale);
export const onLocaleChange = (cb: (locale: Locale) => void): (() => void) => manager.onLocaleChange(cb);
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => manager.t(key, params);
export const getLevelTitle = (id: string, fallback: string): string => manager.getLevelTitle(id, fallback);
export const getChapterName = (chapter: number, fallback?: string): string => manager.getChapterName(chapter, fallback);
export const getChapterLabel = (chapter: number, fallback?: string): string => manager.getChapterLabel(chapter, fallback);
export const getRandomMenuTagline = (): string => manager.getRandomMenuTagline();
```

---

## 4. UI / UX Design Specifications

### 4.1 MenuScene Language Button & `LanguageSelectDialog`

#### Top Bar Button Placement
- **Coordinates**: Positioned at top right next to Settings button.
  - Center: `(pillX, topY)` with `pillW = 80 * K`, `pillH = 44 * K`.
  - Icon: `🌐` glyph or globe icon (18 px) + short code text (`VI`, `EN`, `ID`, `PT`, `JA`) in bold display font.
  - Visual: Rounded container (radius $22 \cdot K$), background `0x0a0a28` (alpha 0.55), border $1.5 \cdot K$ in active galaxy `accent`.
  - Interaction: Pointer-down opens `LanguageSelectDialog`.

#### `LanguageSelectDialog` Modal Specifications
- **Container**: Depth $900$ (overlay above menu UI).
- **Backdrop**: Semi-transparent black scrim `0x000000`, alpha $0.65$, interactive (swallows clicks outside modal).
- **Modal Panel**:
  - Dimensions: Width $540 \cdot K$, Height $460 \cdot K$, Corner radius $24 \cdot K$.
  - Fill: Deep cosmic glass `0x0e1338`, alpha $0.94$.
  - Stroke: $2 \cdot K$ outer glow in `COLOR_TOKENS.iceGlass.primaryBorder` (`#A9E3FF`).
- **Header**:
  - Title: `t('lang_modal_title')` ("Chọn Ngôn Ngữ" / "Select Language"), Baloo 2, $24 \cdot K$ px, `#FFFFFF`, centered at $y = -180 \cdot K$.
  - Close Button: Circular button $36 \cdot K$ px with `✕` at top-right.
- **5 Language Option Rows**:
  - Each row: Width $480 \cdot K$, Height $58 \cdot K$, Spacing $68 \cdot K$ starting at $y = -110 \cdot K$.
  - Row Card Fill:
    - *Normal*: `0x151c4d` (alpha 0.6) with $1 \cdot K$ stroke `0x2e3c7c`.
    - *Active (Selected)*: `0x24337a` (alpha 0.85) with $2 \cdot K$ glowing border `0xffd54f` (Amber gold).
    - *Hover*: Smooth brightness lift via tween.
  - Left icon ($x = -200 \cdot K$): Flag emoji text ($22 \cdot K$ px).
  - Native name text ($x = -150 \cdot K$): Native name (e.g. `Tiếng Việt`, `English`, `Bahasa Indonesia`, `Português`, `日本語`), Baloo 2 / CJK, $18 \cdot K$ px, left-aligned, color `#FFFFFF` (active: `#FFD54F`).
  - Right status badge ($x = +190 \cdot K$):
    - *Active*: Solid golden circle ($16 \cdot K$ px) with checkmark or glowing dot.
    - *Inactive*: Muted hollow circle ($16 \cdot K$ px) in `0x4a5a9c`.
- **Interaction Flow**:
  - Tapping any row calls `setLocale(localeCode)`, plays `ui-tap` synth SFX, closes the dialog with fade-out ($120$ ms), and triggers `MenuScene.buildMainMenu()` to re-render all texts in the new language immediately.

---

### 4.2 `SettingsDialog` 5-Option Segmented Control

In `SettingsDialog.ts`, replace the 2-way toggle in `createLanguageRow` with a 5-item horizontal segmented pill.

- **Row Position**: $y = -modalH / 2 + 100$.
- **Label**: "Ngôn ngữ" / "Language", display font $16$ px, `#FFFFFF`, origin $(0, 0.5)$ at $x = -190$.
- **Segment Bar Track**:
  - Center: $x = 105$, $y = -modalH / 2 + 100$.
  - Dimensions: Width $350$ px, Height $34$ px, Corner radius $17$ px.
  - Fill: Dark glass `0x101738` (alpha 0.9), Border $1.5$ px in `0x2a3d7c`.
- **Segments (`VI`, `EN`, `ID`, `PT`, `JA`)**:
  - 5 slots evenly distributed: Slot width $70$ px each.
  - Slot centers: $x \in [-140, -70, 0, +70, +140]$ relative to track center.
  - **Active Indicator Pill**:
    - Animated rounded rectangle ($68$ px wide, $30$ px high, radius $15$ px).
    - Fill: Golden amber `0xffd54f`, stroke `0x3b2779` ($1.5$ px).
    - Smoothly slides to the newly selected segment ($120$ ms `easeOutCubic`).
  - **Segment Labels**:
    - Font: Display font, $14$ px, bold.
    - Active label: `#22145A` (dark purple-indigo contrast on amber).
    - Inactive labels: `#7A89B8` (soft cosmic slate).
- **Interaction**:
  - Clicking any segment switches locale immediately via `setLocale(code)`, plays tactile feedback, closes & re-opens `SettingsDialog` (or updates labels inline), and refreshes parent scene texts.

---

## 5. Typography & Japanese CJK Font Stack

### 5.1 Font Family Extension (`src/presentation/designTokens.ts`)

```typescript
export const TYPO_TOKENS = {
  fontFamily: {
    /**
     * Baloo 2 for Latin & Vietnamese, followed by native OS CJK fonts for Japanese.
     * iOS/macOS: Hiragino Sans
     * Android: Noto Sans CJK JP
     * Windows: Yu Gothic, Meiryo
     */
    display: "'Baloo 2', 'Hiragino Sans', 'Noto Sans CJK JP', 'Yu Gothic', 'Meiryo', -apple-system, sans-serif",
    serif: "'Baloo 2', 'Hiragino Sans', 'Noto Sans CJK JP', 'Yu Gothic', 'Meiryo', -apple-system, sans-serif",
    sans: "'Be Vietnam Pro', 'Hiragino Sans', 'Noto Sans CJK JP', 'Yu Gothic', 'Meiryo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    levelTitle: "'Be Vietnam Pro', 'Hiragino Sans', 'Noto Sans CJK JP', 'Yu Gothic', 'Meiryo', 'Segoe UI', Arial, sans-serif",
  },
  // ...
};
```

---

## 6. Complete Translation Tables

### 6.1 `common.json` Keys

| Key | Vietnamese (`vi`) | English (`en-US`) | Indonesian (`id`) | Portuguese (`pt-BR`) | Japanese (`ja`) |
|---|---|---|---|---|---|
| `btn_start` | Bắt đầu | Start | Mulai | Iniciar | スタート |
| `btn_continue` | Tiếp tục | Continue | Lanjutkan | Continuar | つづきから |
| `btn_replay` | Chơi lại | Replay | Main Lagi | Repetir | もう一度 |
| `btn_select_level` | Chọn màn chơi | Select Level | Pilih Level | Selecionar Nível | ステージ選択 |
| `version_footer` | Mirror v0.2.1 · Nơi các vì sao hội tụ | Mirror v0.2.1 · Where The Stars Gather | Mirror v0.2.1 · Tempat Bintang Berkumpul | Mirror v0.2.1 · Onde as Estrelas se Encontram | Mirror v0.2.1 · 星々が集う場所 |
| `settings_title` | Cài Đặt Chiêm Tinh | Astrology Settings | Pengaturan Astrologi | Configurações Astrológicas | 星占いの設定 |
| `setting_show_target` | Hình mẫu mờ trên bàn | Ghost silhouette on board | Siluet bayangan di papan | Silhueta guia no tabuleiro | ボード上の半透明シルエット |
| `setting_reduce_motion` | Giảm chuyển động xoay | Reduce motion | Kurangi efek gerakan | Reduzir movimento | 視差効果・回転を減らす |
| `setting_music` | Nhạc nền | Background Music | Musik Latar | Música de Fundo | BGM |
| `setting_sfx` | Hiệu ứng âm thanh | Sound Effects | Efek Suara | Efeitos Sonoros | 効果音 |
| `setting_haptics` | Rung phản hồi khi snap | Haptic feedback on snap | Getaran saat pasang | Vibração ao encaixar | 吸着時の触覚フィードバック |
| `setting_language` | Ngôn ngữ | Language | Bahasa | Idioma | 言語 |
| `setting_danger_reset` | Xóa toàn bộ tiến trình chơi | Reset all game progress | Atur ulang semua kemajuan | Redefinir todo o progresso | 全進行状況をリセット |
| `reset_confirm_message` | Bạn có chắc chắn muốn xóa toàn bộ tiến trình chơi?\nThao tác này không thể hoàn tác. | Are you sure you want to reset all game progress?\nThis action cannot be undone. | Apakah Anda yakin ingin mengatur ulang semua kemajuan game?\nTindakan ini tidak dapat dibatalkan. | Tem certeza de que deseja redefinir todo o progresso?\nEsta ação não pode ser desfeita. | ゲームの全進行状況をリセットしますか？\nこの操作は取り消せません。 |
| `btn_cancel` | Hủy | Cancel | Batal | Cancelar | キャンセル |
| `btn_confirm_delete` | Xác nhận xóa | Confirm Reset | Konfirmasi Hapus | Confirmar Exclusão | 削除を確定 |
| `pause_title` | Tạm Dừng | Paused | Jeda | Pausa | 一時停止 |
| `pause_resume` | Tiếp tục chơi | Resume | Lanjut Main | Continuar | 再開 |
| `pause_restart` | Chơi lại màn này | Restart Level | Ulangi Level Ini | Reiniciar Nível | やり直す |
| `pause_level_select` | Về danh sách màn chơi | Level Select | Pilih Level | Seleção de Níveis | ステージ選択へ |
| `level_select_title` | Chòm Sao Tiên Tri | Prophecy Constellations | Rasi Bintang Nubuat | Constelações da Profecia | 予言の星座 |
| `chapter_prefix` | Chương | Chapter | Bab | Capítulo | 第 |
| `level_prefix` | Màn | Level | Level | Nível | ステージ |
| `toast_level_locked` | Màn {id} chưa mở khóa | Level {id} is locked | Level {id} masih terkunci | O nível {id} está bloqueado | ステージ {id} はロックされています |
| `toast_level_polishing` | Màn {id} đang được tinh chỉnh | Level {id} is being polished | Level {id} sedang disempurnakan | O nível {id} está sendo ajustado | ステージ {id} は調整中です |
| `map_sealed_continue` | Hoàn thành thêm màn để khám phá tiếp | Clear more levels to explore further | Selesaikan lebih banyak level untuk menjelajah | Conclua mais níveis para continuar explorando | さらにステージをクリアして先へ進もう |
| `map_sealed_chapter` | Hoàn thành {chapter} để mở khóa chương mới | Finish {chapter} to unlock the next chapter | Selesaikan {chapter} untuk membuka bab baru | Conclua {chapter} para desbloquear o próximo capítulo | {chapter} をクリアして次の章を解放 |
| `map_chapter_unlocked` | Mở khóa {chapter}! | {chapter} unlocked! | {chapter} terbuka! | {chapter} desbloqueado! | {chapter} 解放！ |
| `snap_hint` | Thả để khớp | Release to snap | Lepaskan untuk pasang | Solte para encaixar | 離して吸着 |
| `match_count` | {matched}/{total} mảnh đã khớp | {matched}/{total} pieces matched | {matched}/{total} keping cocok | {matched}/{total} peças encaixadas | {matched}/{total} 個のピースが一致 |
| `victory_title` | Hoàn thành | Completed | Selesai | Concluído | クリア！ |
| `victory_next` | Màn tiếp theo | Next Level | Level Berikutnya | Próximo Nível | 次のステージ |
| `victory_level_select` | Chọn màn | Select Level | Pilih Level | Escolher Nível | ステージ選択 |
| `btn_reset` | Đặt lại | Reset | Atur Ulang | Redefinir | リセット |
| `btn_rotate` | Xoay | Rotate | Putar | Girar | 回転 |
| `studio_brand` | Alpaca Solutions | Alpaca Solutions | Alpaca Solutions | Alpaca Solutions | Alpaca Solutions |
| `lang_modal_title` | Chọn Ngôn Ngữ | Select Language | Pilih Bahasa | Selecionar Idioma | 言語の選択 |

---

### 6.2 Chapter Titles (`game.json`)

| Chapter | Vietnamese (`vi`) | English (`en-US`) | Indonesian (`id`) | Portuguese (`pt-BR`) | Japanese (`ja`) |
|---|---|---|---|---|---|
| 1 | Khởi Nguyên | Genesis | Kejadian | Gênesis | 創世 |
| 2 | Giao Thoa | Intersections | Persimpangan | Interseções | 交差 |
| 3 | Họa Phẩm | Pictures | Lukisan Kosmik | Pinturas | 星画 |
| 4 | Luân Chuyển | Rotations | Rotasi Bintang | Rotações | 輪転 |

---

### 6.3 28 Campaign Level Titles (`game.json`)

| Level ID | Vietnamese (`vi`) | English (`en-US`) | Indonesian (`id`) | Portuguese (`pt-BR`) | Japanese (`ja`) |
|---|---|---|---|---|---|
| 1-1 | Song Tinh | Twin Stars | Bintang Kembar | Estrelas Gêmeas | 双子星 |
| 1-2 | Tháp Tiên Tri | Prophecy Tower | Menara Nubuat | Torre da Profecia | 予言の塔 |
| 1-3 | Cánh Chim Báo | Omen Bird Wings | Sayap Burung Firasat | Asas do Pássaro | 予兆の翼 |
| 1-4 | Hải Đăng | Lighthouse | Mercusuar | Farol Celestial | 灯台 |
| 1-5 | Tinh Hạm | Starship | Kapal Bintang | Nave Estelar | 星艦 |
| 1-6 | Vương Miện Rạng Đông | Dawn Crown | Mahkota Fajar | Coroa da Alvorada | 黎明の冠 |
| 2-1 | Mũi Tên Chỉ Thiên | Skyward Arrow | Panah Langit | Flecha Celestial | 天を指す矢 |
| 2-2 | Điệp Ảnh | Butterfly Shadow | Bayangan Kupu-Kupu | Sombra da Borboleta | 蝶の影 |
| 2-3 | Trái Tim Thạch Anh | Crystal Heart | Hati Kristal | Coração de Cristal | 水晶の心 |
| 2-4 | Nhãn Tiên Tri | Prophecy Eye | Mata Ramalan | Olho da Profecia | 予言の瞳 |
| 2-5 | Đồng Hồ Cát | Hourglass | Jam Pasir Kosmik | Ampulheta | 砂時計 |
| 2-6 | Ngọc Bội Hộ Mệnh | Amulet Seal | Segel Jimat | Amuleto Sagrado | 護符の封印 |
| 3-1 | Nhật Nguyệt Thực | Sun & Moon Eclipse | Gerhana Matahari Bulan | Eclipse Solar e Lunar | 日月食 |
| 3-2 | Đền Tiên Tri | Prophecy Temple | Kuil Nubuat | Templo da Profecia | 予言の神殿 |
| 3-3 | Cá Chép Vọng Nguyệt | Celestial Koi | Ikan Koi Langit | Carpa Celestial | 望月的鯉 |
| 3-4 | Ngọn Nến | The Candle | Lilin Abadi | A Vela Sagrada | 揺らぐ蝋燭 |
| 3-5 | Thuyền Buồm Hoàng Hôn | Sunset Sailboat | Perahu Senja | Barco do Crepúsculo | 黄昏の帆船 |
| 3-6 | Linh Miêu | Sacred Cat | Kucing Suci | Gato Sagrado | 神聖なる猫 |
| 3-7 | Hoa Sen | Lotus Flower | Bunga Teratai | Flor de Lótus | 蓮華 |
| 3-8 | Kim Tự Tháp Nhật Thực | Solar Eclipse Pyramid | Piramida Gerhana | Pirâmide do Eclipse | 皆既日食のピラミッド |
| 3-9 | Ngôi Sao Tám Cánh | Eight-Pointed Star | Bintang Segidelapan | Estrela de Oito Pontas | 八芒星 |
| 3-10 | Mạn Đà La Vũ Trụ | Celestial Mandala | Mandala Semesta | Mandala Cósmica | 宇宙曼荼羅 |
| 4-1 | La Bàn Gió | Wind Compass | Kompas Angin | Bússola dos Ventos | 風の羅針盤 |
| 4-2 | Thiên Đao | Celestial Blade | Bilah Langit | Lâmina Celestial | 天空の刃 |
| 4-3 | Tinh Tú Cung | Astrological Bow | Busur Bintang | Arco Astrológico | 星宿の弓 |
| 4-4 | Bánh Xe Số Phận | Wheel of Fate | Roda Takdir | Roda do Destino | 運命の輪 |
| 4-5 | Thập Tự Tinh Không | Celestial Cross | Salib Langit | Cruz Celestial | 星空の十字 |
| 4-6 | Đại Ấn Tiên Tri | Grand Prophecy Seal | Segel Nubuat Agung | Grande Selo da Profecia | 大予言の印 |

---

### 6.4 20 Menu Astronomical Taglines (`game.json`)

| # | Vietnamese (`vi`) | English (`en-US`) | Indonesian (`id`) | Portuguese (`pt-BR`) | Japanese (`ja`) |
|---|---|---|---|---|---|
| 1 | Ánh sáng Mặt Trời mất 8 phút để tới Trái Đất | Sunlight takes 8 minutes to reach Earth | Cahaya Matahari butuh 8 menit ke Bumi | A luz do Sol leva 8 minutos até a Terra | 太陽の光は地球まで約8分で届きます |
| 2 | Một ngày trên sao Kim dài hơn một năm của nó | A day on Venus is longer than its year | Satu hari di Venus lebih lama dari tahunnya | Um dia em Vênus é mais longo que seu ano | 金星の1日はその公転周期（1年）より長い |
| 3 | Mặt Trăng rời xa Trái Đất 3,8 cm mỗi năm | The Moon drifts 3.8 cm farther every year | Bulan menjauh 3,8 cm setiap tahun | A Lua se afasta 3,8 cm a cada ano | 月は毎年3.8cmずつ地球から遠ざかっています |
| 4 | Dải Ngân Hà có hơn 100 tỷ ngôi sao | The Milky Way holds over 100 billion stars | Bima Sakti memiliki lebih dari 100 miliar bintang | A Via Láctea abriga mais de 100 bilhões de estrelas | 天の川銀河には1000億個以上の恒星が存在 |
| 5 | Sao Hỏa đỏ vì bụi oxit sắt phủ khắp bề mặt | Mars is red from iron oxide dust | Mars berwarna merah karena debu oksida besi | Marte é vermelho devido ao óxido de ferro | 火星が赤いのは酸化鉄の塵に覆われているため |
| 6 | Sao Thổ có mật độ còn nhỏ hơn nước | Saturn is less dense than water | Massa jenis Saturnus lebih kecil dari air | Saturno é menos denso que a água | 土星の平均密度は水よりも小さい |
| 7 | Một năm ánh sáng dài gần 9.500 tỷ km | One light year is about 9,500 billion km | Satu tahun cahaya sekitar 9,5 triliun km | Um ano-luz equivale a cerca de 9,5 trilhões de km | 1光年は約9兆5000億キロメートル |
| 8 | Một thìa sao neutron nặng hàng tỷ tấn | A spoonful of neutron star weighs billions of tons | Sesendok bintang neutron berbobot miliaran ton | Uma colher de estrela de nêutrons pesa bilhões de toneladas | 中性子星の欠片スプーン1杯で数十億トン |
| 9 | Mặt Trời chiếm 99,8% khối lượng Hệ Mặt Trời | The Sun holds 99.8% of the solar system mass | Matahari menyimpan 99,8% massa tata surya | O Sol contém 99,8% da massa do sistema solar | 太陽は太陽系全体の質量の99.8%を占める |
| 10 | Sao chổi Halley ghé qua mỗi 76 năm | Comet Halley passes by every 76 years | Komet Halley melintas setiap 76 tahun | O cometa Halley passa a cada 76 anos | ハレー彗星は約76年周期で巡ってきます |
| 11 | Vũ trụ đã 13,8 tỷ năm tuổi | The universe is 13.8 billion years old | Alam semesta berusia 13,8 miliar tahun | O universo tem 13,8 bilhões de anos | 宇宙の年齢は約138億歳 |
| 12 | Thiên hà Tiên Nữ đang tiến về Dải Ngân Hà | Andromeda is drifting toward the Milky Way | Galaksi Andromeda bergerak menuju Bima Sakti | Andrômeda está se aproximando da Via Láctea | アンドロメダ銀河は天の川銀河に接近中 |
| 13 | Sao Mộc có hơn 90 mặt trăng đã xác nhận | Jupiter has more than 90 confirmed moons | Jupiter memiliki lebih dari 90 bulan | Júpiter possui mais de 90 luas confirmadas | 木星には90個以上の衛星が確認されている |
| 14 | Không gì thoát khỏi chân trời sự kiện hố đen | Nothing escapes a black hole event horizon | Tak ada yang lolos dari cakrawala peristiwa | Nada escapa do horizonte de eventos de um buraco negro | ブラックホールの事象の地平線からは光も出られない |
| 15 | Sao Bắc Cực gần như đứng yên trên bầu trời | Polaris barely moves in the night sky | Bintang Polaris hampir diam di langit malam | A Estrela Polar quase não se move no céu noturno | 北極星は夜空のほぼ中心で静止して見える |
| 16 | Mây trên sao Kim làm từ axit sunfuric | Venus has clouds made of sulfuric acid | Awan di Venus terbuat dari asam sulfat | As nuvens de Vênus são de ácido sulfúrico | 金星の雲は濃硫酸の粒子でできている |
| 17 | Olympus Mons trên sao Hỏa cao gần 22 km | Olympus Mons on Mars is nearly 22 km tall | Olympus Mons di Mars setinggi hampir 22 km | O Monte Olimpo em Marte tem quase 22 km de altura | 火星のオリンポス山は標高約22kmに達する |
| 18 | Vết Đỏ Lớn của sao Mộc rộng hơn Trái Đất | Jupiter Great Red Spot is wider than Earth | Bintik Merah Raksasa Jupiter lebih lebar dari Bumi | A Grande Mancha Vermelha é maior que a Terra | 木星の大赤斑は地球の直径よりも巨大 |
| 19 | Một năm sao Hải Vương bằng 165 năm Trái Đất | One year on Neptune lasts 165 Earth years | Satu tahun Neptunus setara 165 tahun Bumi | Um ano em Netuno equivale a 165 anos terrestres | 海王星の1年は地球の約165年に相当 |
| 20 | Nguyên tố trong cơ thể bạn sinh ra từ các vì sao | The atoms in your body were forged in stars | Atom di tubuh Anda tercipta di dalam bintang | Os átomos do seu corpo foram forjados nas estrelas | 私たちの体を構成する原子は星の内部で生まれた |

---

## 7. Verification & Testing Strategy

### 7.1 Automated Unit Tests

1. **`tests/localization.test.ts`**:
   - `LocaleResolver`:
     - Test saved preference takes precedence over navigator languages.
     - Test migration of legacy `'en'` to `'en-US'`.
     - Test device locale mapping: `pt` $\to$ `pt-BR`, `id-ID` $\to$ `id`, `ja-JP` $\to$ `ja`, `vi-VN` $\to$ `vi`, `en-GB` $\to$ `en-US`.
     - Test unknown languages (e.g. `fr-FR`, `de-DE`) fall back to `en-US`.
   - `LocalizationManager`:
     - Test `t()` string lookup and `{param}` replacement.
     - Test missing key fallback to `en-US`.
     - Test `onLocaleChange` observer callback fires when changing locale.
     - Test level title resolution for 28 levels.
     - Test chapter label formatting with Roman numerals.

2. **`tests/localizationCoverage.test.ts`**:
   - Verify every locale (`en-US`, `vi`, `id`, `pt-BR`, `ja`) contains 100% identical keys in `common.json`.
   - Verify no empty strings or broken placeholder templates exist in any locale.
   - Verify all 28 campaign level titles (`1-1` to `4-6`) are present in `game.json` for all 5 locales.
   - Verify exactly 4 chapter titles exist in `game.json` for all 5 locales.
   - Verify exactly 20 astronomical taglines exist in `game.json` for all 5 locales.

3. **`tests/displayFontCoverage.test.ts`**:
   - Assert `Baloo 2` completely covers all characters in `vi`, `en-US`, `id`, and `pt-BR`.
   - Assert Japanese strings are valid CJK characters (Hiragana, Katakana, Kanji, basic punctuation).

### 7.2 Manual & Visual Browser Verification
- Launch dev server (`npm run dev ?scene=menu`).
- Open Menu:
  - Verify top language pill displays `[ 🌐 EN ]` or current locale.
  - Click pill: Verify `LanguageSelectDialog` modal opens smoothly with frosted glass backdrop and 5 language rows.
  - Click `Português`: Verify menu labels instantly switch to Portuguese, modal closes, and preference is saved.
  - Click `日本語`: Verify Japanese typography renders legibly without clipped glyphs or missing characters.
- Open Settings Dialog:
  - Verify 5-segment pill `[ VI | EN | ID | PT | JA ]` renders cleanly.
  - Click each segment: Verify amber indicator slides smoothly and labels update immediately.
- Open Gameplay & Level Select:
  - Verify Level Select scene shows localized chapter headers ("Capítulo I · Gênesis", "第 I 章 · 創世", etc.).
  - Verify HUD displays localized match counter and victory banner.

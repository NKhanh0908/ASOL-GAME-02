# Multi-Language Localization Engine (5 Locales) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a modular, 5-locale localization engine (`en-US`, `vi`, `id`, `pt-BR`, `ja`) with a 3-tier resolver, typed JSON dictionaries, Menu modal language picker, Settings 5-segment control, and CJK system font stack while preserving 100% backward compatibility for all existing callers.

**Architecture:** Core engine under `src/localization/` (`localizationConfig`, `LocaleResolver`, `LocaleSettings`, `LocalizationManager`) with bundled JSON translation files in `src/locales/<locale>/`. `src/presentation/i18n.ts` serves as a zero-breaking-change facade. UI includes `LanguageSelectDialog` modal in `MenuScene` and a 5-option segmented control in `SettingsDialog`.

**Tech Stack:** TypeScript 5.7, Vite 6, Phaser 3.90, Vitest 2.

**Spec:** `docs/superpowers/specs/2026-10-09-multi-language-localization-design.md`

## Global Constraints

- **Supported Locales**: Strictly `['en-US', 'vi', 'id', 'pt-BR', 'ja']`.
- **Default / Fallback Locale**: `en-US` (standardized from legacy `en`).
- **Storage Key**: `mirror.rebuild.locale` in `localStorage`.
- **Legacy Migration**: Stored value `'en'` must automatically migrate to `'en-US'`.
- **Zero Breaking Changes**: Existing callers of `presentation/i18n.ts` (`t`, `getLocale`, `setLocale`, `getLevelTitle`, `getChapterName`, `getChapterLabel`, `getRandomMenuTagline`, `onLocaleChange`) must continue functioning without modification.
- **CJK Fonts**: No heavy webfonts; use native OS fallback stack (`Hiragino Sans`, `Noto Sans CJK JP`, `Yu Gothic`, `Meiryo`).

---

### Task 1: Core Localization Types, Configuration & Persistence

**Files:**
- Create: `game-next/src/localization/types.ts`
- Create: `game-next/src/localization/localizationConfig.ts`
- Create: `game-next/src/localization/LocaleSettings.ts`
- Test: `game-next/tests/localeSettings.test.ts`

**Interfaces:**
- Produces:
  - `localizationConfig`: default and supported locales, storage key, registry.
  - `LOCALE_REGISTRY`: metadata mapping (`code`, `shortLabel`, `nativeName`, `flagEmoji`).
  - `LocaleSettings`: `getSavedLocale()`, `saveLocale(code)`, `clearSavedLocale()`.
  - `CommonTranslations`, `GameTranslations`, `TranslationBundle`, `SupportedLocale`.

- [ ] **Step 1: Write failing test for `LocaleSettings`**

Create `game-next/tests/localeSettings.test.ts`:
```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocaleSettings } from '../src/localization/LocaleSettings.ts';
import { localizationConfig } from '../src/localization/localizationConfig.ts';

describe('LocaleSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when no locale is saved', () => {
    expect(LocaleSettings.getSavedLocale()).toBeNull();
  });

  it('saves and retrieves supported locales', () => {
    LocaleSettings.saveLocale('pt-BR');
    expect(LocaleSettings.getSavedLocale()).toBe('pt-BR');
  });

  it('migrates legacy en to en-US', () => {
    localStorage.setItem(localizationConfig.storageKey, 'en');
    expect(LocaleSettings.getSavedLocale()).toBe('en-US');
    expect(localStorage.getItem(localizationConfig.storageKey)).toBe('en-US');
  });

  it('ignores unsupported locale values in storage', () => {
    localStorage.setItem(localizationConfig.storageKey, 'invalid-lang');
    expect(LocaleSettings.getSavedLocale()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/localeSettings.test.ts --pool=forks`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `types.ts`, `localizationConfig.ts`, and `LocaleSettings.ts`**

`game-next/src/localization/types.ts`:
```typescript
export type SupportedLocale = 'en-US' | 'vi' | 'id' | 'pt-BR' | 'ja';

export interface LocaleMetadata {
  readonly code: SupportedLocale;
  readonly shortLabel: string;
  readonly nativeName: string;
  readonly flagEmoji: string;
}

export type CommonTranslationKey =
  | 'btn_start'
  | 'btn_continue'
  | 'btn_replay'
  | 'btn_select_level'
  | 'version_footer'
  | 'settings_title'
  | 'setting_show_target'
  | 'setting_reduce_motion'
  | 'setting_music'
  | 'setting_sfx'
  | 'setting_haptics'
  | 'setting_language'
  | 'setting_danger_reset'
  | 'reset_confirm_message'
  | 'btn_cancel'
  | 'btn_confirm_delete'
  | 'pause_title'
  | 'pause_resume'
  | 'pause_restart'
  | 'pause_level_select'
  | 'level_select_title'
  | 'chapter_prefix'
  | 'level_prefix'
  | 'toast_level_locked'
  | 'toast_level_polishing'
  | 'map_sealed_continue'
  | 'map_sealed_chapter'
  | 'map_chapter_unlocked'
  | 'map_coming_soon'
  | 'snap_hint'
  | 'match_count'
  | 'victory_title'
  | 'victory_next'
  | 'victory_level_select'
  | 'btn_reset'
  | 'btn_rotate'
  | 'studio_brand'
  | 'lang_modal_title';

export type CommonTranslations = Record<CommonTranslationKey, string>;

export interface GameTranslations {
  readonly chapters: Record<string, string>;
  readonly levelTitles: Record<string, string>;
  readonly taglines: readonly string[];
}

export interface TranslationBundle {
  readonly common: CommonTranslations;
  readonly game: GameTranslations;
}
```

`game-next/src/localization/localizationConfig.ts`:
```typescript
import type { LocaleMetadata, SupportedLocale } from './types.ts';

export const localizationConfig = {
  defaultLocale: 'en-US' as const,
  supportedLocales: ['en-US', 'vi', 'id', 'pt-BR', 'ja'] as const,
  allowManualLanguageSelection: true,
  persistSelectedLocale: true,
  fallbackLocale: 'en-US' as const,
  storageKey: 'mirror.rebuild.locale',
};

export const LOCALE_REGISTRY: Readonly<Record<SupportedLocale, LocaleMetadata>> = {
  vi: { code: 'vi', shortLabel: 'VI', nativeName: 'Tiếng Việt', flagEmoji: '🇻🇳' },
  'en-US': { code: 'en-US', shortLabel: 'EN', nativeName: 'English', flagEmoji: '🇺🇸' },
  id: { code: 'id', shortLabel: 'ID', nativeName: 'Bahasa Indonesia', flagEmoji: '🇮🇩' },
  'pt-BR': { code: 'pt-BR', shortLabel: 'PT', nativeName: 'Português', flagEmoji: '🇧🇷' },
  ja: { code: 'ja', shortLabel: 'JA', nativeName: '日本語', flagEmoji: '🇯🇵' },
};
```

`game-next/src/localization/LocaleSettings.ts`:
```typescript
import { localizationConfig } from './localizationConfig.ts';
import type { SupportedLocale } from './types.ts';

export class LocaleSettings {
  public static getSavedLocale(): SupportedLocale | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(localizationConfig.storageKey);
      if (!raw) return null;
      if (raw === 'en') {
        this.saveLocale('en-US');
        return 'en-US';
      }
      if ((localizationConfig.supportedLocales as readonly string[]).includes(raw)) {
        return raw as SupportedLocale;
      }
    } catch {
      // storage unavailable
    }
    return null;
  }

  public static saveLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(localizationConfig.storageKey, locale);
    } catch {}
  }

  public static clearSavedLocale(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(localizationConfig.storageKey);
    } catch {}
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/localeSettings.test.ts --pool=forks`
Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add game-next/src/localization/types.ts game-next/src/localization/localizationConfig.ts game-next/src/localization/LocaleSettings.ts game-next/tests/localeSettings.test.ts
git commit -m "feat(loc): core localization types, config and storage persistence"
```

---

### Task 2: 3-Tier `LocaleResolver` Engine

**Files:**
- Create: `game-next/src/localization/LocaleResolver.ts`
- Test: `game-next/tests/localeResolver.test.ts`

**Interfaces:**
- Consumes: `LocaleSettings`, `localizationConfig`, `SupportedLocale`.
- Produces: `LocaleResolver.resolve(nav?)`, `LocaleResolver.matchDeviceTag(tag)`.

- [ ] **Step 1: Write failing tests for `LocaleResolver`**

Create `game-next/tests/localeResolver.test.ts`:
```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocaleResolver } from '../src/localization/LocaleResolver.ts';
import { LocaleSettings } from '../src/localization/LocaleSettings.ts';

describe('LocaleResolver', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Tier 1: uses saved preference if present', () => {
    LocaleSettings.saveLocale('ja');
    const resolved = LocaleResolver.resolve({ languages: ['vi-VN', 'en-US'] });
    expect(resolved).toBe('ja');
  });

  it('Tier 2: matches device languages in order', () => {
    expect(LocaleResolver.resolve({ languages: ['pt-BR', 'en'] })).toBe('pt-BR');
    expect(LocaleResolver.resolve({ languages: ['id-ID', 'en-US'] })).toBe('id');
    expect(LocaleResolver.resolve({ languages: ['ja', 'en'] })).toBe('ja');
    expect(LocaleResolver.resolve({ languages: ['vi-VN'] })).toBe('vi');
    expect(LocaleResolver.resolve({ languages: ['en-GB'] })).toBe('en-US');
  });

  it('Tier 2: handles single language property fallback', () => {
    expect(LocaleResolver.resolve({ language: 'pt' })).toBe('pt-BR');
  });

  it('Tier 3: falls back to en-US for unsupported languages', () => {
    expect(LocaleResolver.resolve({ languages: ['fr-FR', 'de-DE'] })).toBe('en-US');
    expect(LocaleResolver.resolve({})).toBe('en-US');
  });

  it('normalizes device tags cleanly', () => {
    expect(LocaleResolver.matchDeviceTag('vi-VN')).toBe('vi');
    expect(LocaleResolver.matchDeviceTag('pt')).toBe('pt-BR');
    expect(LocaleResolver.matchDeviceTag('en-AU')).toBe('en-US');
    expect(LocaleResolver.matchDeviceTag('unknown')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/localeResolver.test.ts --pool=forks`
Expected: FAIL.

- [ ] **Step 3: Implement `LocaleResolver.ts`**

`game-next/src/localization/LocaleResolver.ts`:
```typescript
import { localizationConfig } from './localizationConfig.ts';
import { LocaleSettings } from './LocaleSettings.ts';
import type { SupportedLocale } from './types.ts';

export class LocaleResolver {
  public static resolve(
    nav: { languages?: readonly string[]; language?: string } = typeof navigator !== 'undefined' ? navigator : {}
  ): SupportedLocale {
    const saved = LocaleSettings.getSavedLocale();
    if (saved) return saved;

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

    return localizationConfig.fallbackLocale;
  }

  public static matchDeviceTag(tag: string): SupportedLocale | null {
    if (!tag) return null;
    const lower = tag.toLowerCase().trim();

    if (lower === 'en-us' || lower === 'en') return 'en-US';
    if (lower === 'vi' || lower.startsWith('vi-')) return 'vi';
    if (lower === 'id' || lower.startsWith('id-')) return 'id';
    if (lower === 'pt-br' || lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR';
    if (lower === 'ja' || lower.startsWith('ja-')) return 'ja';

    if (lower.startsWith('en-')) return 'en-US';

    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/localeResolver.test.ts --pool=forks`
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add game-next/src/localization/LocaleResolver.ts game-next/tests/localeResolver.test.ts
git commit -m "feat(loc): 3-tier LocaleResolver engine with device language detection"
```

---

### Task 3: Complete Translation Dictionaries for 5 Locales

**Files:**
- Create: `game-next/src/locales/en-US/common.json`, `game.json`
- Create: `game-next/src/locales/vi/common.json`, `game.json`
- Create: `game-next/src/locales/id/common.json`, `game.json`
- Create: `game-next/src/locales/pt-BR/common.json`, `game.json`
- Create: `game-next/src/locales/ja/common.json`, `game.json`
- Test: `game-next/tests/localizationCoverage.test.ts`

**Interfaces:**
- Produces: 10 structured JSON files covering all translation keys, chapters 1-4, levels 1-1 to 4-6, and 20 astronomical facts verbatim from the design spec tables (§6).

- [ ] **Step 1: Write failing coverage test `localizationCoverage.test.ts`**

`game-next/tests/localizationCoverage.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { localizationConfig } from '../src/localization/localizationConfig.ts';
import enCommon from '../src/locales/en-US/common.json';
import enGame from '../src/locales/en-US/game.json';
import viCommon from '../src/locales/vi/common.json';
import viGame from '../src/locales/vi/game.json';
import idCommon from '../src/locales/id/common.json';
import idGame from '../src/locales/id/game.json';
import ptCommon from '../src/locales/pt-BR/common.json';
import ptGame from '../src/locales/pt-BR/game.json';
import jaCommon from '../src/locales/ja/common.json';
import jaGame from '../src/locales/ja/game.json';

const BUNDLES = {
  'en-US': { common: enCommon, game: enGame },
  vi: { common: viCommon, game: viGame },
  id: { common: idCommon, game: idGame },
  'pt-BR': { common: ptCommon, game: ptGame },
  ja: { common: jaCommon, game: jaGame },
};

describe('Localization Coverage & Symmetry', () => {
  const commonKeys = Object.keys(enCommon);

  it('all locales have exactly identical common.json keys', () => {
    for (const locale of localizationConfig.supportedLocales) {
      const keys = Object.keys(BUNDLES[locale].common);
      expect(keys.sort()).toEqual(commonKeys.sort());
      for (const k of commonKeys) {
        const val = (BUNDLES[locale].common as Record<string, string>)[k];
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('all locales provide chapters 1-4 in game.json', () => {
    for (const locale of localizationConfig.supportedLocales) {
      const ch = BUNDLES[locale].game.chapters;
      expect(ch['1']).toBeTruthy();
      expect(ch['2']).toBeTruthy();
      expect(ch['3']).toBeTruthy();
      expect(ch['4']).toBeTruthy();
    }
  });

  it('all locales provide all 28 campaign level titles (1-1 to 4-6)', () => {
    const levelIds = [
      '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
      '2-1', '2-2', '2-3', '2-4', '2-5', '2-6',
      '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10',
      '4-1', '4-2', '4-3', '4-4', '4-5', '4-6',
    ];
    for (const locale of localizationConfig.supportedLocales) {
      const titles = BUNDLES[locale].game.levelTitles;
      for (const id of levelIds) {
        expect(titles[id], `missing title for ${id} in ${locale}`).toBeTruthy();
      }
    }
  });

  it('all locales provide exactly 20 astronomical taglines', () => {
    for (const locale of localizationConfig.supportedLocales) {
      const taglines = BUNDLES[locale].game.taglines;
      expect(taglines.length).toBe(20);
      for (const line of taglines) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(5);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/localizationCoverage.test.ts --pool=forks`
Expected: FAIL (modules missing).

- [ ] **Step 3: Create translation JSON files**

Create `src/locales/{en-US, vi, id, pt-BR, ja}/{common.json, game.json}` populated strictly with the values from design spec §6.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/localizationCoverage.test.ts --pool=forks`
Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add game-next/src/locales/ game-next/tests/localizationCoverage.test.ts
git commit -m "feat(loc): complete translation bundles for en-US, vi, id, pt-BR, ja"
```

---

### Task 4: `LocalizationManager` & Backward-Compatible Facade `presentation/i18n.ts`

**Files:**
- Create: `game-next/src/localization/LocalizationManager.ts`
- Create: `game-next/src/localization/index.ts`
- Modify: `game-next/src/presentation/i18n.ts`
- Test: `game-next/tests/localizationManager.test.ts`
- Test: `game-next/tests/i18n.test.ts`

**Interfaces:**
- Produces:
  - `LocalizationManager`: singleton, `getLocale()`, `setLocale(code)`, `onLocaleChange(cb)`, `t(key, params)`, `getLevelTitle(id, fallback)`, `getChapterName(num, fallback)`, `getChapterLabel(num, fallback)`, `getRandomMenuTagline()`.
  - `presentation/i18n.ts`: exports facade functions preserving identical API signatures.

- [ ] **Step 1: Write failing test for `LocalizationManager`**

Create `game-next/tests/localizationManager.test.ts`:
```typescript
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalizationManager } from '../src/localization/LocalizationManager.ts';
import { LocaleSettings } from '../src/localization/LocaleSettings.ts';

describe('LocalizationManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('translates common keys with param interpolation', () => {
    const mgr = LocalizationManager.getInstance();
    mgr.setLocale('en-US');
    expect(mgr.t('btn_start')).toBe('Start');
    expect(mgr.t('match_count', { matched: 3, total: 5 })).toBe('3/5 pieces matched');
  });

  it('changes locale and notifies subscribers', () => {
    const mgr = LocalizationManager.getInstance();
    mgr.setLocale('en-US');
    let notified: string | null = null;
    const unsub = mgr.onLocaleChange((loc) => { notified = loc; });

    mgr.setLocale('ja');
    expect(mgr.getLocale()).toBe('ja');
    expect(notified).toBe('ja');
    expect(mgr.t('btn_start')).toBe('スタート');
    expect(LocaleSettings.getSavedLocale()).toBe('ja');

    unsub();
    mgr.setLocale('vi');
    expect(notified).toBe('ja'); // callback unsubscribed
  });

  it('resolves localized level titles and chapter names', () => {
    const mgr = LocalizationManager.getInstance();
    mgr.setLocale('pt-BR');
    expect(mgr.getChapterName(1)).toBe('Gênesis');
    expect(mgr.getLevelTitle('1-1')).toBe('Estrelas Gêmeas');
    expect(mgr.getChapterLabel(2)).toBe('Capítulo II · Interseções');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/localizationManager.test.ts --pool=forks`
Expected: FAIL.

- [ ] **Step 3: Implement `LocalizationManager.ts`, `index.ts`, and adapt `presentation/i18n.ts`**

Implement `LocalizationManager.ts` per spec §3.5 with Vite synchronous JSON imports.
Create `index.ts` barrel export.
Refactor `presentation/i18n.ts` per spec §3.6 to forward calls to `LocalizationManager.getInstance()`.

- [ ] **Step 4: Run tests to verify all tests pass**

Run: `npx vitest run tests/localizationManager.test.ts tests/i18n.test.ts --pool=forks`
Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add game-next/src/localization/ game-next/src/presentation/i18n.ts game-next/tests/localizationManager.test.ts
git commit -m "feat(loc): LocalizationManager singleton and zero-breaking i18n facade"
```

---

### Task 5: Typography Tokens & CJK System Font Fallback Stack

**Files:**
- Modify: `game-next/src/presentation/designTokens.ts`
- Modify: `game-next/tests/displayFontCoverage.test.ts`

**Interfaces:**
- Updates `TYPO_TOKENS.fontFamily` to include Japanese CJK system fonts: `'Hiragino Sans'`, `'Noto Sans CJK JP'`, `'Yu Gothic'`, `'Meiryo'`.

- [ ] **Step 1: Write test for CJK font stack and character coverage**

Update `game-next/tests/displayFontCoverage.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { TYPO_TOKENS } from '../src/presentation/designTokens.ts';
import jaCommon from '../src/locales/ja/common.json';
import jaGame from '../src/locales/ja/game.json';

describe('Typography & CJK Font Fallback', () => {
  it('fontFamily includes Japanese system CJK font stack', () => {
    expect(TYPO_TOKENS.fontFamily.display).toContain('Hiragino Sans');
    expect(TYPO_TOKENS.fontFamily.display).toContain('Noto Sans CJK JP');
    expect(TYPO_TOKENS.fontFamily.display).toContain('Yu Gothic');
    expect(TYPO_TOKENS.fontFamily.sans).toContain('Hiragino Sans');
  });

  it('Japanese translation strings contain valid CJK and kana characters', () => {
    const sample = jaCommon.btn_start + jaCommon.pause_title + jaGame.chapters['1'];
    expect(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(sample)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/displayFontCoverage.test.ts --pool=forks`
Expected: FAIL (missing font names).

- [ ] **Step 3: Update `src/presentation/designTokens.ts`**

Update `TYPO_TOKENS.fontFamily` per spec §5.1.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/displayFontCoverage.test.ts --pool=forks`
Expected: PASS.

- [ ] **Step 5: Commit Task 5**

```bash
git add game-next/src/presentation/designTokens.ts game-next/tests/displayFontCoverage.test.ts
git commit -m "feat(ui): add native CJK system font stack for Japanese typography"
```

---

### Task 6: `LanguageSelectDialog` Component & `MenuScene` Language Pill

**Files:**
- Create: `game-next/src/presentation/dialogs/LanguageSelectDialog.ts`
- Modify: `game-next/src/presentation/MenuScene.ts`
- Test: `game-next/tests/languageSelectDialog.test.ts`

**Interfaces:**
- Produces: `LanguageSelectDialog` modal class (`open()`, `close()`, `destroy()`).
- Modifies `MenuScene`: Adds top right language pill `[ 🌐 VI ]` triggering the modal and subscribing to `onLocaleChange` to rebuild the main menu.

- [ ] **Step 1: Write unit test for `LanguageSelectDialog` logic**

Create `game-next/tests/languageSelectDialog.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { LOCALE_REGISTRY } from '../src/localization/localizationConfig.ts';
import { LocalizationManager } from '../src/localization/LocalizationManager.ts';

describe('LanguageSelectDialog state & registry', () => {
  it('exposes all 5 supported locales with native labels and flags', () => {
    const list = Object.values(LOCALE_REGISTRY);
    expect(list.length).toBe(5);
    expect(list.map(x => x.code)).toEqual(['vi', 'en-US', 'id', 'pt-BR', 'ja']);
  });

  it('updates manager locale when selected', () => {
    const mgr = LocalizationManager.getInstance();
    mgr.setLocale('en-US');
    mgr.setLocale('id');
    expect(mgr.getLocale()).toBe('id');
  });
});
```

- [ ] **Step 2: Implement `LanguageSelectDialog.ts`**

Create `game-next/src/presentation/dialogs/LanguageSelectDialog.ts` per spec §4.1:
- Glass container with depth 900.
- Title `t('lang_modal_title')` with close button.
- 5 language rows with flag emoji, native name, and active status indicator.
- Calls `setLocale(code)` on click, plays audio SFX, and dismisses modal.

- [ ] **Step 3: Modify `MenuScene.ts`**

In `MenuScene.ts`:
- Add language pill button next to Settings button.
- On click, open `LanguageSelectDialog`.
- Subscribe to `onLocaleChange`: call `this.buildMainMenu()` to re-render all texts immediately.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run tests/languageSelectDialog.test.ts tests/menu.test.ts --pool=forks && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add game-next/src/presentation/dialogs/LanguageSelectDialog.ts game-next/src/presentation/MenuScene.ts game-next/tests/languageSelectDialog.test.ts
git commit -m "feat(ui): LanguageSelectDialog modal and MenuScene language picker pill"
```

---

### Task 7: `SettingsDialog` 5-Segmented Control

**Files:**
- Modify: `game-next/src/presentation/dialogs/SettingsDialog.ts`
- Test: `game-next/tests/dialogs.test.ts`

**Interfaces:**
- Modifies `createLanguageRow` in `SettingsDialog.ts` to render a 5-item horizontal segmented pill `[ VI | EN | ID | PT | JA ]` per spec §4.2.

- [ ] **Step 1: Write test assertion for 5-segment control in `dialogs.test.ts`**

Update `game-next/tests/dialogs.test.ts` to assert that settings dialog includes language row with 5 supported locale items.

- [ ] **Step 2: Implement 5-segment pill control in `SettingsDialog.ts`**

In `src/presentation/dialogs/SettingsDialog.ts`:
- Replace the 2-way toggle in `createLanguageRow` with 5 segments (`VI`, `EN`, `ID`, `PT`, `JA`).
- Add sliding amber active indicator pill ($70$ px slot width).
- Clicking a segment calls `setLocale(code)` and re-syncs dialog labels.

- [ ] **Step 3: Run tests and typecheck**

Run: `npx vitest run tests/dialogs.test.ts --pool=forks && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit Task 7**

```bash
git add game-next/src/presentation/dialogs/SettingsDialog.ts game-next/tests/dialogs.test.ts
git commit -m "feat(ui): replace 2-way language toggle with 5-segment control in SettingsDialog"
```

---

### Task 8: Full Verification, Documentation & Status Update

**Files:**
- Modify: `docs/ai/DOCS-INDEX.md`
- Modify: `docs/ai/STATUS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run full test suite, typecheck, and production build**

Run:
```bash
npx tsc --noEmit
npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks
npm run build
```

- [ ] **Step 2: Update `docs/ai/DOCS-INDEX.md`**

Update the `LOC` row from `draft` to `done` and reference this plan file.

- [ ] **Step 3: Update `docs/ai/STATUS.md` and `CHANGELOG.md`**

Add Unreleased changelog entry documenting the 5-locale engine, resolver, and UI components. Update STATUS.md keeping under 60 lines.

- [ ] **Step 4: Commit Task 8**

```bash
git add docs/ai/DOCS-INDEX.md docs/ai/STATUS.md CHANGELOG.md
git commit -m "docs(loc): mark multi-language localization plan complete and record verification"
```

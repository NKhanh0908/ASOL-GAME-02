import { chapterRoman } from '../content/chapters.ts';
import { LocaleResolver } from './LocaleResolver.ts';
import { LocaleSettings } from './LocaleSettings.ts';
import { localizationConfig, LOCALE_REGISTRY } from './localizationConfig.ts';
import type {
  CommonTranslations,
  GameTranslations,
  LocaleMetadata,
  SupportedLocale,
  TranslationBundle,
} from './types.ts';

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
      'en-US': { common: enCommon as CommonTranslations, game: enGame as unknown as GameTranslations },
      vi: { common: viCommon as CommonTranslations, game: viGame as unknown as GameTranslations },
      id: { common: idCommon as CommonTranslations, game: idGame as unknown as GameTranslations },
      'pt-BR': { common: ptCommon as CommonTranslations, game: ptGame as unknown as GameTranslations },
      ja: { common: jaCommon as CommonTranslations, game: jaGame as unknown as GameTranslations },
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

  public getMetadata(locale: SupportedLocale = this.currentLocale): LocaleMetadata {
    return LOCALE_REGISTRY[locale];
  }

  public setLocale(locale: SupportedLocale | 'en'): void {
    const targetLocale: SupportedLocale = locale === 'en' ? 'en-US' : locale;
    if (!(localizationConfig.supportedLocales as readonly string[]).includes(targetLocale)) return;
    if (this.currentLocale === targetLocale) return;

    this.currentLocale = targetLocale;
    if (localizationConfig.persistSelectedLocale) {
      LocaleSettings.saveLocale(targetLocale);
    }

    this.listeners.forEach((listener) => listener(targetLocale));
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
    return (
      titles[levelId] ||
      (fallbackTitle ? fallbackTitle : this.bundles['en-US'].game.levelTitles[levelId] || levelId)
    );
  }

  public getChapterName(chapter: number, fallbackName?: string): string {
    const chapters = this.bundles[this.currentLocale]?.game?.chapters || this.bundles['en-US'].game.chapters;
    return chapters[String(chapter)] || fallbackName || this.bundles['en-US'].game.chapters[String(chapter)] || `Chapter ${chapter}`;
  }

  public getChapterLabel(chapter: number, fallbackName?: string): string {
    const roman = chapterRoman(chapter);
    const prefix = this.t('chapter_prefix');
    const name = this.getChapterName(chapter, fallbackName);
    return `${prefix} ${roman} · ${name}`;
  }

  public getRandomMenuTagline(): string {
    const list = this.bundles[this.currentLocale]?.game?.taglines || this.bundles['en-US'].game.taglines;
    return list[Math.floor(Math.random() * list.length)];
  }
}

/**
 * Hệ thống đa ngôn ngữ (i18n) cho Mirror.
 * Backward-compatible facade chuyển tiếp tới LocalizationManager lõi.
 */

import { LocalizationManager } from '../localization/LocalizationManager.ts';
import type { CommonTranslationKey, SupportedLocale } from '../localization/types.ts';
import enCommon from '../locales/en-US/common.json';
import enGame from '../locales/en-US/game.json';
import viCommon from '../locales/vi/common.json';
import viGame from '../locales/vi/game.json';

export type Locale = SupportedLocale | 'en';
export type TranslationKey = CommonTranslationKey;

const manager = LocalizationManager.getInstance();

export const getLocale = (): Locale => manager.getLocale();
export const setLocale = (locale: Locale): void => manager.setLocale(locale);
export const onLocaleChange = (cb: (locale: SupportedLocale) => void): (() => void) => manager.onLocaleChange(cb);
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => manager.t(key, params);
export const getLevelTitle = (id: string, fallback: string): string => manager.getLevelTitle(id, fallback);
export const getChapterName = (chapter: number, fallback?: string): string => manager.getChapterName(chapter, fallback);
export const getChapterLabel = (chapter: number, fallback?: string): string => manager.getChapterLabel(chapter, fallback);
export const getRandomMenuTagline = (): string => manager.getRandomMenuTagline();

/** Bản dịch tương thích ngược */
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  vi: viCommon,
  en: enCommon,
  'en-US': enCommon,
};

/** Phụ đề thiên văn tương thích ngược */
export const MENU_TAGLINES: Record<string, readonly string[]> = {
  vi: viGame.taglines,
  en: enGame.taglines,
  'en-US': enGame.taglines,
};

/** Tên màn chơi tiếng Anh tương thích ngược */
export const LEVEL_TITLES_EN: Record<string, string> = enGame.levelTitles;

/** Tên các chương theo ngôn ngữ phục vụ tương thích ngược */
export const CHAPTER_NAMES: Record<string, Record<number, string>> = {
  vi: {
    1: 'Khởi Nguyên',
    2: 'Giao Thoa',
    3: 'Luân Chuyển',
    4: 'Hội Tụ',
    5: 'Lăng Kính',
  },
  'en-US': {
    1: 'Genesis',
    2: 'Intersections',
    3: 'Rotations',
    4: 'Convergence',
    5: 'Prism',
  },
  en: {
    1: 'Genesis',
    2: 'Intersections',
    3: 'Rotations',
    4: 'Convergence',
    5: 'Prism',
  },
};

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

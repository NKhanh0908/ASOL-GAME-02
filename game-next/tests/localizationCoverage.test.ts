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
      const ch = BUNDLES[locale].game.chapters as Record<string, string>;
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
      const titles = BUNDLES[locale].game.levelTitles as Record<string, string>;
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

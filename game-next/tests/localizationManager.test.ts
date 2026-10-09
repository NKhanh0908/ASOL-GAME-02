import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalizationManager } from '../src/localization/LocalizationManager.ts';
import { LocaleSettings } from '../src/localization/LocaleSettings.ts';

function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  } as Storage;
}

describe('LocalizationManager', () => {
  beforeEach(() => {
    const storage = createMockStorage();
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
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
    const unsub = mgr.onLocaleChange((loc) => {
      notified = loc;
    });

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

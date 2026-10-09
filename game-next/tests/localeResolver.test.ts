import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocaleResolver } from '../src/localization/LocaleResolver.ts';
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

describe('LocaleResolver', () => {
  beforeEach(() => {
    const storage = createMockStorage();
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
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

import { describe, it, expect } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';
import {
  GALAXY_THEMES,
  resolveGalaxyTheme,
  resolveCurrentGalaxyTheme,
  getChapterProgress,
} from '../src/presentation/galaxyTheme.ts';

describe('galaxyTheme', () => {
  it('has valid theme configs for Chapter 1 and Chapter 2 matching mockup hex values', () => {
    const ch1 = GALAXY_THEMES[1];
    expect(ch1.id).toBe('dwarf');
    expect(ch1.name).toBe('Khởi Nguyên');
    expect(ch1.galaxyType).toBe('Thiên hà lùn');
    expect(ch1.colors.bgTopHex).toBe('#0B2A5E');
    expect(ch1.colors.bgBottomHex).toBe('#123A7A');
    expect(ch1.colors.accentHex).toBe('#5AD1E0');
    expect(ch1.colors.youngStars).toBe(0xff8fc8);

    const ch2 = GALAXY_THEMES[2];
    expect(ch2.id).toBe('spiral');
    expect(ch2.name).toBe('Giao Thoa');
    expect(ch2.galaxyType).toBe('Thiên hà xoắn ốc');
    expect(ch2.colors.bgTopHex).toBe('#2A1670');
    expect(ch2.colors.bgBottomHex).toBe('#3A1A7E');
    expect(ch2.colors.accentHex).toBe('#E58BFF');
    expect(ch2.colors.youngStars).toBe(0xff6fb5);
  });

  it('resolveGalaxyTheme falls back safely to Chapter 1 for unknown chapters', () => {
    expect(resolveGalaxyTheme(1).chapter).toBe(1);
    expect(resolveGalaxyTheme(2).chapter).toBe(2);
    expect(resolveGalaxyTheme(99).chapter).toBe(1);
  });

  it('resolveCurrentGalaxyTheme advances to Chapter 2 when Chapter 1 is fully completed', () => {
    // New player
    expect(resolveCurrentGalaxyTheme([]).chapter).toBe(1);
    // Partway through Chapter 1
    expect(resolveCurrentGalaxyTheme(['1-1', '1-2', '1-3']).chapter).toBe(1);
    // Completing the actual manifest chapter advances the menu theme.
    const ch1All = campaignManifest.filter(e => e.chapter === 1).map(e => e.id);
    expect(resolveCurrentGalaxyTheme(ch1All).chapter).toBe(2);
    const allReleased = campaignManifest.filter(e => e.status === 'approved').map(e => e.id);
    expect(resolveCurrentGalaxyTheme(allReleased).name).toBe('Họa Phẩm');
  });

  it('calculates chapter progress correctly', () => {
    expect(getChapterProgress(1, [])).toEqual({ completed: 0, total: 6 });
    expect(getChapterProgress(1, ['1-1', '1-2', '2-1'])).toEqual({ completed: 2, total: 6 });
    expect(getChapterProgress(2, ['1-1', '2-1', '2-2', '2-3'])).toEqual({ completed: 3, total: 6 });
    expect(getChapterProgress(1, ['1-1', '1-1', '1-7', 'unknown'])).toEqual({ completed: 1, total: 6 });
  });
});

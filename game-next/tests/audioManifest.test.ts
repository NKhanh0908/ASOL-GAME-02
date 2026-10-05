import { describe, expect, test } from 'vitest';
import { MUSIC_ASSETS, TRACK_IDS, musicUrls } from '../src/infrastructure/audioManifest.ts';
import type { TrackId } from '../src/infrastructure/audioManifest.ts';

// The test asserting each source carries an allowed licence, an https URL, a title and an
// author arrives in Task 9b together with the real tracks; until then the source fields are blank.
describe('music manifest', () => {
  test('one asset per track id, no extras', () => {
    expect(MUSIC_ASSETS.map((a) => a.id).sort()).toEqual([...TRACK_IDS].sort());
    expect(TRACK_IDS).toHaveLength(2);
  });

  test('every listed file is named after its track', () => {
    for (const asset of MUSIC_ASSETS) {
      expect(asset.files.length, asset.id).toBeGreaterThan(0);
      for (const file of asset.files) expect(file.startsWith(`${asset.id}.`), file).toBe(true);
    }
  });

  test('urls are relative to the page', () => {
    expect(musicUrls('music-sky')[0]).toBe('audio/music-sky.ogg');
    expect(musicUrls('nope' as TrackId)).toEqual([]);
  });
});

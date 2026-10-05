import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Bright sparkle. Three high partials of the root, each drifting a couple of
 * hertz over its life so they beat gently against one another instead of
 * sitting still.
 */
export const shimmer: Patch = {
  durationMs: 900,
  seed: 106,
  layers: [
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 8, glideToHz: MUSIC_ROOT_HZ * 8 + 2 },
      env: { attackMs: 10, decayMs: 880, curve: 'exp' },
    },
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 10, glideToHz: MUSIC_ROOT_HZ * 10 - 3 },
      env: { attackMs: 20, decayMs: 860, curve: 'exp' },
      gain: 0.7,
    },
    {
      source: { kind: 'sine', hz: MUSIC_ROOT_HZ * 12, glideToHz: MUSIC_ROOT_HZ * 12 + 4 },
      env: { attackMs: 35, decayMs: 840, curve: 'exp' },
      gain: 0.5,
    },
  ],
  normalize: { peak: 0.5 },
};

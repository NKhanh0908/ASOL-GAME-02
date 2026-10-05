import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Crystal bell, one clear pitch, an octave above the music root.
 *
 * A ratio of 3.5 is deliberately not a whole number: the partials it creates
 * do not line up with the harmonic series, and that mismatch is what the ear
 * reads as struck glass or metal rather than an organ pipe. The modulation
 * index falls away fast, so the strike is bright and the tail is pure.
 */
export const bell: Patch = {
  durationMs: 1400,
  seed: 101,
  layers: [
    {
      source: {
        kind: 'fm',
        carrierHz: MUSIC_ROOT_HZ * 2,
        ratio: 3.5,
        index: 6,
        indexEnv: { attackMs: 0, decayMs: 180, curve: 'exp' },
      },
      env: { attackMs: 2, decayMs: 1398, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.9 },
};

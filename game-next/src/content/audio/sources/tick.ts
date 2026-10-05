import type { Patch } from '../../../audio-synth/patch.ts';
import { MUSIC_ROOT_HZ } from '../root.ts';

/**
 * Very light glass tap. This is the most-heard sound in the game — it plays on
 * every lift, every rotate and every UI press — so it has to stay out of the way.
 *
 * It is a pitched ping, not a noise burst. Highpassed white noise reads as a hiss
 * and is the harshest way to make a tick; two octaves above the music root with a
 * whisper of FM gives the same "glass" cue while sitting inside the key, so it
 * blends with the music instead of cutting across it.
 */
export const tick: Patch = {
  durationMs: 130,
  seed: 102,
  layers: [
    {
      source: {
        kind: 'fm',
        carrierHz: MUSIC_ROOT_HZ * 4,
        ratio: 2.7,
        index: 1.2,
        indexEnv: { attackMs: 0, decayMs: 25, curve: 'exp' },
      },
      filter: { kind: 'lowpass', hz: 5200, q: 0.7 },
      env: { attackMs: 4, decayMs: 95, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.32 },
};

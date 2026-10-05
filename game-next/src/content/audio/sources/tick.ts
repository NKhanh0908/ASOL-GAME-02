import type { Patch } from '../../../audio-synth/patch.ts';

/** Very light glass tap: a high noise burst, gone almost before it registers. */
export const tick: Patch = {
  durationMs: 120,
  seed: 102,
  layers: [
    {
      source: { kind: 'noise', color: 'white' },
      filter: { kind: 'highpass', hz: 6000, q: 0.8 },
      env: { attackMs: 1, decayMs: 59, curve: 'exp' },
    },
  ],
  normalize: { peak: 0.5 },
};

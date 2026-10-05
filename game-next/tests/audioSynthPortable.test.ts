import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { validatePatch } from '../src/audio-synth/patch.ts';
import { renderPatch } from '../src/audio-synth/render.ts';
import { bellPreset, clickPreset, whooshPreset } from '../src/audio-synth/presets.ts';

const dir = fileURLToPath(new URL('../src/audio-synth/', import.meta.url));

describe('the engine folder stays portable', () => {
  test('no file imports anything outside src/audio-synth/', () => {
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const text = readFileSync(dir + file, 'utf8');
      for (const match of text.matchAll(/from\s+'([^']+)'/g)) {
        const target = match[1];
        const local = target.startsWith('./') && !target.startsWith('../');
        if (!local) offenders.push(`${file} -> ${target}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test('the README documents each of the five concepts and how to port it', () => {
    const readme = readFileSync(dir + 'README.md', 'utf8');
    for (const heading of ['Source', 'Envelope', 'Filter', 'Layer', 'normalize']) {
      expect(readme, heading).toContain(heading);
    }
    expect(readme).toContain('Porting it to another project');
    expect(readme).toContain('renderPatch');
  });
});

describe('presets', () => {
  test('each preset is valid and renders', () => {
    for (const [name, patch] of Object.entries({ clickPreset, bellPreset, whooshPreset })) {
      expect(validatePatch(patch, 44100), name).toEqual([]);
      expect(renderPatch(patch, 44100).length, name).toBeGreaterThan(0);
    }
  });
});

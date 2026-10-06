import { describe, expect, test } from 'vitest';
import { loadLevel } from '../src/content/catalog.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import {
  BADGE_SILHOUETTE_BOX as BADGE_BOX,
  NODE_SILHOUETTE_BOX as NODE_BOX,
  silhouetteLayers,
} from '../src/presentation/targetSilhouette.ts';

describe('silhouetteLayers', () => {
  test('fits every approved level inside the badge box', () => {
    for (const entry of campaignManifest.filter((e) => e.status === 'approved')) {
      const layers = silhouetteLayers(loadLevel(entry.id, 'campaign'), BADGE_BOX);
      expect(layers.length, entry.id).toBeGreaterThan(0);
      for (const layer of layers) {
        for (const p of layer.points) {
          // Polygon tips can extend up to 1 cell past rasterized cell centers on diamond points (e.g. 1-1 tips)
          expect(Math.abs(p.x), `${entry.id} x`).toBeLessThanOrEqual(BADGE_BOX.width / 2 + 1.0);
          expect(Math.abs(p.y), `${entry.id} y`).toBeLessThanOrEqual(BADGE_BOX.height / 2 + 1.0);
        }
      }
    }
  });

  test('node box keeps every point inside the diamond |x| + |y| <= 39', () => {
    for (const entry of campaignManifest.filter((e) => e.status === 'approved')) {
      const layers = silhouetteLayers(loadLevel(entry.id, 'campaign'), NODE_BOX);
      for (const layer of layers) {
        for (const p of layer.points) {
          expect(Math.abs(p.x) + Math.abs(p.y), entry.id).toBeLessThanOrEqual(39.001);
        }
      }
    }
  });

  test('halving the box halves every coordinate', () => {
    const level = loadLevel('1-1', 'campaign');
    const big = silhouetteLayers(level, BADGE_BOX);
    const small = silhouetteLayers(level, NODE_BOX);
    expect(small.length).toBe(big.length);
    for (let i = 0; i < big.length; i++) {
      expect(small[i].filled).toBe(big[i].filled);
      for (let j = 0; j < big[i].points.length; j++) {
        expect(small[i].points[j].x).toBeCloseTo(big[i].points[j].x / 2, 6);
        expect(small[i].points[j].y).toBeCloseTo(big[i].points[j].y / 2, 6);
      }
    }
  });

  test('returns nothing for a level with an empty target mask', () => {
    const level = { ...loadLevel('1-1', 'campaign'), targetMask: new Uint8Array(0) };
    expect(silhouetteLayers(level, BADGE_BOX)).toEqual([]);
  });
});

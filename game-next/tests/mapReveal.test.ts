import { describe, expect, it } from 'vitest';
import { layoutCampaignMap } from '../src/presentation/constellationLayout.ts';
import { computeMapReveal } from '../src/presentation/mapReveal.ts';

const entries = [
  ...Array.from({ length: 6 }, (_, i) => ({ id: `1-${i + 1}`, title: 't', chapter: 1 as const })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `2-${i + 1}`, title: 't', chapter: 2 as const })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: `3-${i + 1}`, title: 't', chapter: 3 as const })),
];
const layout = layoutCampaignMap(entries);
const yOf = (id: string) => layout.nodes.find((n) => n.id === id)!.y;

describe('computeMapReveal', () => {
  it('shows the current chapter and the whole next one, then seals the rest', () => {
    const reveal = computeMapReveal(layout, '1-1');
    expect(reveal.limitY).toBe(layout.chapters[1].bottom);
    expect(reveal.limitY).toBeGreaterThan(yOf('2-6'));
    expect(reveal.limitY).toBeLessThanOrEqual(yOf('3-1'));
    expect(reveal.sealedUntilChapter).toBe(1);
  });

  it('is the same for any level inside the chapter', () => {
    expect(computeMapReveal(layout, '1-6')).toEqual(computeMapReveal(layout, '1-1'));
  });

  it('moves one chapter on when the next chapter becomes the frontier', () => {
    const reveal = computeMapReveal(layout, '2-1');
    expect(reveal.limitY).toBe(layout.totalHeight);
    expect(reveal.sealedUntilChapter).toBeNull();
  });

  it('seals nothing once the campaign is finished', () => {
    const reveal = computeMapReveal(layout, null);
    expect(reveal.limitY).toBe(layout.totalHeight);
    expect(reveal.sealedUntilChapter).toBeNull();
  });
});

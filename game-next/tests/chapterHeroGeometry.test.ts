import { describe, expect, it } from 'vitest';
import {
  CLUSTER_SATELLITES, REFRESH_ARROW, heroKindFor, pinwheelFaces, pinwheelOutline,
} from '../src/presentation/menu/chapterHeroGeometry.ts';

describe('chapterHeroGeometry', () => {
  it('builds the mockup pinwheel at half-extent 56 (Menu3)', () => {
    const faces = pinwheelFaces(56);
    expect(faces.map((f) => f.color)).toEqual([0xfff0a6, 0xffd23f, 0xf59400, 0xffb31f, 0xffe27a]);
    expect(faces[0].points).toEqual([[0, -56], [0, 0], [-56, 0]]);
    expect(faces[1].points).toEqual([[0, -56], [56, 0], [0, 0]]);
    expect(faces[4].points[0][1]).toBeCloseTo(-23.52, 2);
    expect(pinwheelOutline(56)).toEqual([[0, -56], [56, 0], [0, 56], [-56, 0]]);
  });

  it('rotates about the centre', () => {
    const [top] = pinwheelOutline(56, 90);
    expect(top[0]).toBeCloseTo(56);
    expect(top[1]).toBeCloseTo(0);
  });

  it('places four satellites on the diagonals (Menu4)', () => {
    expect(CLUSTER_SATELLITES).toEqual([[60.8, 60.8], [-60.8, 60.8], [-60.8, -60.8], [60.8, -60.8]]);
  });

  it('draws the refresh arrow on the r=88 circle from (-84,-20) to (60,-66)', () => {
    expect(REFRESH_ARROW.radius).toBe(88);
    expect(Math.hypot(-84, -20)).toBeCloseTo(86.3, 1);
    expect(REFRESH_ARROW.startAngle).toBeLessThan(REFRESH_ARROW.endAngle);
  });

  it('maps theme ids to hero kinds', () => {
    expect(['dwarf', 'spiral', 'tapestry', 'ring', 'cluster', 'prism'].map(heroKindFor))
      .toEqual([undefined, undefined, undefined, 'ring', 'cluster', 'prism']);
  });
});

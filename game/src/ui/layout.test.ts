import { expect, it } from 'vitest';
import { LAYOUT, toGrid, trayHome } from './layout';

it('keeps full size pieces inside the tray and grid coordinates consistent', () => {
  expect(toGrid(LAYOUT.boardX + 40 * LAYOUT.cell, LAYOUT.boardY + 80 * LAYOUT.cell)).toEqual({ x: 40, y: 80 });
  for (let i = 0; i < 3; i += 1) {
    const p = trayHome(i, 3, 48, 48);
    expect(p.x).toBeGreaterThanOrEqual(24);
    expect(p.x + 192).toBeLessThanOrEqual(696);
    expect(p.y).toBeGreaterThanOrEqual(960);
    expect(p.y + 192).toBeLessThanOrEqual(1160);
  }
});

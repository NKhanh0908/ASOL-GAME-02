// Type-only Phaser import: erased at runtime, so this module can be imported
// by a Vitest test. Every module the tests reach (polygonClip, jewelGeometry,
// constellationMotion) follows the same rule. `fillPoints` accepts plain
// {x, y} objects, so no `Phaser.Geom.Point` is needed here — do not "fix"
// this to match BoardRenderer, which imports Phaser as a value.
import type Phaser from 'phaser';
import { effectiveOrientation, shapePolygon } from '../domain/shapes.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import type { Level } from '../domain/model.ts';
import { parityLayers } from './polygonClip.ts';

export type SilhouetteBox = { width: number; height: number };
export type SilhouetteLayer = {
  filled: boolean;
  points: ReadonlyArray<{ x: number; y: number }>;
};

/** Chord of the play badge's gold ring that the figure must stay inside. */
export const BADGE_SILHOUETTE_BOX: SilhouetteBox = { width: 92, height: 64 };

/**
 * A map node is a diamond of radius 43, so a point fits only when
 * |x| + |y| <= 43. With 4px of padding the budget is 39, and 46 x 32 is the
 * largest box with the badge's aspect ratio satisfying (w + h) / 2 <= 39.
 */
export const NODE_SILHOUETTE_BOX: SilhouetteBox = { width: 46, height: 32 };

/**
 * Target figure as parity polygons, centred on the origin and scaled to fit
 * `box`. Pure: no Phaser objects, so the fit can be tested without a renderer.
 * Callers pass the box their shape allows — a circle's chord for the badge, a
 * diamond's inscribed budget for a map node.
 */
export function silhouetteLayers(level: Level, box: SilhouetteBox): SilhouetteLayer[] {
  let minX = GRID_WIDTH;
  let maxX = -1;
  let minY = GRID_HEIGHT;
  let maxY = -1;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if ((level.targetMask[y * GRID_WIDTH + x] ?? 0) > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return [];

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const centerX = (minX + maxX + 1) / 2;
  const centerY = (minY + maxY + 1) / 2;
  const scale = Math.min(box.width / w, box.height / h);

  // One path for every level: draw the sample solution's placements as vectors
  // rather than filling mask cells, which used to produce jagged edges.
  const polygons = (level.targetPlacements ?? []).flatMap((placement) => {
    const piece = level.pieces.find((p) => p.id === placement.pieceId);
    if (!piece) return [];
    const kind = piece.shapeKind ?? 'diamond';
    const orientation = effectiveOrientation(kind, piece.orientation ?? 0, placement.turns);
    return [
      shapePolygon(kind, orientation, piece.frameSize).map((v) => ({
        x: (placement.x + v.x - centerX) * scale,
        y: (placement.y + v.y - centerY) * scale,
      })),
    ];
  });

  return parityLayers(polygons).map((layer) => ({
    filled: layer.filled,
    points: layer.points,
  }));
}

/** Draws what `silhouetteLayers` computes. Colours differ by surface. */
export function drawTargetSilhouette(
  g: Phaser.GameObjects.Graphics,
  level: Level,
  box: SilhouetteBox,
  colors: { filled: number; hollow: number }
): void {
  for (const layer of silhouetteLayers(level, box)) {
    g.fillStyle(layer.filled ? colors.filled : colors.hollow, 1);
    g.fillPoints(layer.points as Array<{ x: number; y: number }>, true);
  }
}

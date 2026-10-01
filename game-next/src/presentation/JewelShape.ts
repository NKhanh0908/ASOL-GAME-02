import Phaser from 'phaser';
import { PIECE_TOKENS } from './designTokens.ts';
import { jewelOutline, jewelFaces, jewelTable, jewelSpineLines } from './jewelGeometry.ts';
import type { Point } from './jewelGeometry.ts';

export type JewelVariant = 'solid' | 'ghost' | 'target' | 'placeholder';

export type JewelOptions = {
  cx: number;
  cy: number;
  radius: number;
  variant: JewelVariant;
  alpha?: number;
};

function hex(value: string): number {
  return Phaser.Display.Color.HexStringToColor(value).color;
}

function toGeomPoints(points: Point[]): Phaser.Geom.Point[] {
  return points.map((p) => new Phaser.Geom.Point(p.x, p.y));
}

function strokeDashedPolygon(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  dash: readonly number[]
): void {
  const [on, off] = dash;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    const ux = (b.x - a.x) / length;
    const uy = (b.y - a.y) / length;
    let travelled = 0;
    while (travelled < length) {
      const end = Math.min(travelled + on, length);
      g.lineBetween(a.x + ux * travelled, a.y + uy * travelled, a.x + ux * end, a.y + uy * end);
      travelled = end + off;
    }
  }
}

/**
 * Vẽ một mảnh ngọc thoi.
 *
 * Viền vẽ phía trong mảnh (bán kính trừ nửa độ dày viền) để mép trùng đúng
 * đường kẻ lưới — quy tắc "vẽ đúng đến từng pixel" của GridSpec.
 */
export function drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void {
  const { cx, cy, radius, variant } = opts;
  const alpha = opts.alpha ?? (variant === 'ghost' ? PIECE_TOKENS.ghostAlpha : 1);

  if (variant === 'target') {
    g.fillStyle(hex(PIECE_TOKENS.targetFill.color), PIECE_TOKENS.targetFill.alpha * alpha);
    g.fillPoints(toGeomPoints(jewelOutline(cx, cy, radius)), true);
    g.lineStyle(
      PIECE_TOKENS.targetStroke.width,
      hex(PIECE_TOKENS.targetStroke.color),
      PIECE_TOKENS.targetStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.targetStroke.dash);
    return;
  }

  if (variant === 'placeholder') {
    g.lineStyle(
      PIECE_TOKENS.placeholderStroke.width,
      hex(PIECE_TOKENS.placeholderStroke.color),
      PIECE_TOKENS.placeholderStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.placeholderStroke.dash);
    return;
  }

  // Quầng sáng phía sau: các thoi đồng tâm lớn dần, mờ dần. Phaser Graphics
  // không có blur nên đây là cách xấp xỉ rẻ nhất mà không phải sinh texture
  // hay thêm GameObject (render chạy mỗi khung hình, thêm object là rò rỉ).
  const glowRings = 6;
  for (let i = glowRings; i > 0; i--) {
    const t = i / glowRings;
    g.fillStyle(hex(PIECE_TOKENS.glow.color), PIECE_TOKENS.glow.alpha * (1 - t) ** 2 * alpha);
    g.fillPoints(toGeomPoints(jewelOutline(cx, cy, radius * (1 + t * 0.22))), true);
  }

  // solid và ghost: bốn mặt vát, mặt bàn, đoạn nối, viền trong
  for (const face of jewelFaces(cx, cy, radius)) {
    g.fillStyle(hex(face.color), alpha);
    g.fillPoints(toGeomPoints(face.points), true);
  }

  g.fillStyle(hex(PIECE_TOKENS.tableStops[1]), 0.6 * alpha);
  g.fillPoints(toGeomPoints(jewelTable(cx, cy, radius)), true);

  g.lineStyle(1, hex('#FFF7DA'), 0.45 * alpha);
  for (const line of jewelSpineLines(cx, cy, radius)) {
    g.lineBetween(line.from.x, line.from.y, line.to.x, line.to.y);
  }

  const inset = PIECE_TOKENS.outlineWidth / 2;
  g.lineStyle(PIECE_TOKENS.outlineWidth, hex(PIECE_TOKENS.outline), alpha);
  g.strokePoints(toGeomPoints(jewelOutline(cx, cy, radius - inset)), true, true);

  drawSparkle(
    g,
    cx + radius * PIECE_TOKENS.sparkle.offsetRatio,
    cy + radius * PIECE_TOKENS.sparkle.offsetRatio,
    radius * 0.12,
    PIECE_TOKENS.sparkle.alpha * alpha
  );
}

/** Đốm lấp lánh bốn cánh, lệch về phía trên-trái nơi ánh sáng tới. */
function drawSparkle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  alpha: number
): void {
  const waist = size * 0.3;
  g.fillStyle(hex(PIECE_TOKENS.sparkle.color), alpha);
  g.fillPoints(
    toGeomPoints([
      { x: cx, y: cy - size },
      { x: cx + waist, y: cy },
      { x: cx, y: cy + size },
      { x: cx - waist, y: cy },
    ]),
    true
  );
  g.fillPoints(
    toGeomPoints([
      { x: cx - size, y: cy },
      { x: cx, y: cy - waist },
      { x: cx + size, y: cy },
      { x: cx, y: cy + waist },
    ]),
    true
  );
}

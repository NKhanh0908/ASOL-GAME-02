import type { Cell, Orientation, ShapeKind } from './model.ts';

/** Một đỉnh đa giác theo toạ độ khung mảnh (gốc trên-trái), đơn vị ô logic. */
export type Vertex = Readonly<{ x: number; y: number }>;

function v(x: number, y: number): Vertex {
  return { x, y };
}

export function isValidOrientation(kind: ShapeKind, orientation: number): orientation is Orientation {
  if (!Number.isInteger(orientation)) return false;
  if (kind === 'triangle') return orientation >= 0 && orientation <= 7;
  return orientation === 0;
}

/**
 * Đa giác chuẩn của một hình trong khung frameSize × frameSize.
 *
 * Đây là nguồn duy nhất cho cells, renderer và ảnh xem trước: cells raster hoá
 * từ chính đa giác này nên không thể lệch khỏi hình vẽ (LVL-02).
 */
export function shapePolygon(kind: ShapeKind, orientation: Orientation, frameSize: number): Vertex[] {
  const s = frameSize;
  const h = frameSize / 2;
  if (kind === 'square') return [v(0, 0), v(s, 0), v(s, s), v(0, s)];
  if (kind === 'diamond') return [v(h, 0), v(s, h), v(h, s), v(0, h)];
  switch (orientation) {
    case 0:
      return [v(0, 0), v(s, 0), v(0, s)];
    case 1:
      return [v(0, 0), v(s, 0), v(s, s)];
    case 2:
      return [v(s, 0), v(s, s), v(0, s)];
    case 3:
      return [v(0, 0), v(0, s), v(s, s)];
    case 4:
      return [v(0, s), v(s, s), v(h, h)];
    case 5:
      return [v(0, 0), v(0, s), v(h, h)];
    case 6:
      return [v(0, 0), v(s, 0), v(h, h)];
    case 7:
      return [v(s, 0), v(s, s), v(h, h)];
  }
}

/**
 * Hướng sau khi xoay `turns` nấc 90° theo chiều kim đồng hồ.
 * Góc quay vòng 0→1→2→3, mái quay vòng 4→5→6→7. Vuông và thoi không đổi.
 */
export function effectiveOrientation(
  kind: ShapeKind,
  orientation: Orientation,
  turns: number
): Orientation {
  if (kind !== 'triangle') return 0;
  const family = orientation < 4 ? 0 : 4;
  const step = (((orientation % 4) + turns) % 4 + 4) % 4;
  return (family + step) as Orientation;
}

type Edge = { ax: number; ay: number; nx: number; ny: number; inclusive: boolean };

/** Các cạnh kèm pháp tuyến hướng vào trong; đa giác lồi nên lấy trọng tâm đỉnh làm mốc. */
function edgesOf(polygon: readonly Vertex[]): Edge[] {
  const n = polygon.length;
  const cx = polygon.reduce((sum, p) => sum + p.x, 0) / n;
  const cy = polygon.reduce((sum, p) => sum + p.y, 0) / n;
  return polygon.map((a, i) => {
    const b = polygon[(i + 1) % n];
    let nx = -(b.y - a.y);
    let ny = b.x - a.x;
    if (nx * (cx - a.x) + ny * (cy - a.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    // Quy tắc trên-trái: chỉ cạnh trái (phần trong ở bên phải) và cạnh trên
    // nằm ngang (phần trong ở bên dưới) giữ ô có tâm nằm đúng trên cạnh.
    return { ax: a.x, ay: a.y, nx, ny, inclusive: nx > 0 || (nx === 0 && ny > 0) };
  });
}

/**
 * Raster hoá đa giác lồi: lấy ô có tâm nằm trong đa giác. Hai hình chung một
 * đoạn cạnh luôn có pháp tuyến ngược chiều nên đúng một bên giữ hàng ô trên
 * cạnh đó: không trùng ô, không hở khe.
 */
export function rasterize(polygon: readonly Vertex[], frameSize: number): Cell[] {
  const edges = edgesOf(polygon);
  const cells: Cell[] = [];
  for (let y = 0; y < frameSize; y++) {
    for (let x = 0; x < frameSize; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let inside = true;
      for (const e of edges) {
        const d = e.nx * (px - e.ax) + e.ny * (py - e.ay);
        if (d < 0 || (d === 0 && !e.inclusive)) {
          inside = false;
          break;
        }
      }
      if (inside) cells.push([x, y]);
    }
  }
  return cells;
}

export function shapeCells(kind: ShapeKind, orientation: Orientation, frameSize: number): Cell[] {
  return rasterize(shapePolygon(kind, orientation, frameSize), frameSize);
}

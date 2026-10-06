/** Điểm canvas hoặc điểm lưới; module này không quan tâm đơn vị. */
export type Pt = Readonly<{ x: number; y: number }>;

const AREA_EPSILON = 1e-6;

export function signedArea(polygon: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

export function polygonArea(polygon: readonly Pt[]): number {
  return Math.abs(signedArea(polygon));
}

function intersect(p: Pt, q: Pt, sp: number, sq: number): Pt {
  const t = sp / (sp - sq);
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

/**
 * Giao của đa giác `subject` với đa giác lồi `clip` (Sutherland–Hodgman).
 * Mọi hình của game đều lồi nên giao của chúng cũng lồi. Giao chỉ chạm cạnh
 * hay chạm đỉnh có diện tích 0 và được trả về rỗng.
 */
export function clipConvex(subject: readonly Pt[], clip: readonly Pt[]): Pt[] {
  if (subject.length < 3 || clip.length < 3) return [];
  const orient = Math.sign(signedArea(clip)) || 1;
  let output: Pt[] = [...subject];

  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (p: Pt): number => orient * ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const sc = side(cur);
      const sp = side(prev);
      if (sc >= 0) {
        if (sp < 0) output.push(intersect(prev, cur, sp, sc));
        output.push(cur);
      } else if (sp >= 0) {
        output.push(intersect(prev, cur, sp, sc));
      }
    }
  }

  return polygonArea(output) > AREA_EPSILON ? output : [];
}

export type ParityLayer = Readonly<{ points: Pt[]; depth: number; filled: boolean }>;

/**
 * Các lớp vẽ chồng cho luật chẵn/lẻ: mọi giao khác rỗng của k đa giác, xếp
 * theo k tăng dần. Vẽ lần lượt (lớp lẻ màu mảnh, lớp chẵn màu mặt bàn) thì
 * lớp trên cùng ở mỗi vùng là giao của đúng số mảnh đang phủ vùng đó, nên
 * màu luôn đúng tính chẵn lẻ của số ấy — với mọi số mảnh và mọi hình lồi.
 */
export function parityLayers(polygons: readonly (readonly Pt[])[]): ParityLayer[] {
  const layers: ParityLayer[] = [];
  // Mỗi phần tử là giao của một tập chỉ số tăng dần; `last` là chỉ số cuối
  // để chỉ ghép thêm đa giác có chỉ số lớn hơn (mỗi tập con xuất hiện một lần).
  let frontier = polygons
    .map((p, i) => ({ points: [...p], last: i }))
    .filter((f) => polygonArea(f.points) > AREA_EPSILON);
  let depth = 1;

  while (frontier.length > 0) {
    for (const f of frontier) {
      layers.push({ points: f.points, depth, filled: depth % 2 === 1 });
    }
    const next: Array<{ points: Pt[]; last: number }> = [];
    for (const f of frontier) {
      for (let j = f.last + 1; j < polygons.length; j++) {
        const inter = clipConvex(f.points, polygons[j]);
        if (inter.length >= 3) next.push({ points: inter, last: j });
      }
    }
    frontier = next;
    depth++;
  }

  return layers;
}

const UNION_EPS = 1e-6;

function samePoint(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) < UNION_EPS && Math.abs(a.y - b.y) < UNION_EPS;
}

/**
 * Splits every edge at any input vertex that lies strictly inside it, so two
 * polygons sharing only part of an edge still produce matching halves that can
 * cancel against each other.
 */
function splitAtVertices(edges: Array<[Pt, Pt]>, vertices: readonly Pt[]): Array<[Pt, Pt]> {
  const out: Array<[Pt, Pt]> = [];
  for (const [a, b] of edges) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < UNION_EPS) continue;
    const along = (p: Pt) => (p.x - a.x) * dx + (p.y - a.y) * dy;
    const cuts: Pt[] = [];
    for (const v of vertices) {
      if (samePoint(v, a) || samePoint(v, b)) continue;
      const cross = (v.x - a.x) * dy - (v.y - a.y) * dx;
      if (Math.abs(cross) > UNION_EPS * Math.sqrt(len2)) continue;
      const t = along(v) / len2;
      if (t > UNION_EPS && t < 1 - UNION_EPS) cuts.push(v);
    }
    cuts.sort((p, q) => along(p) - along(q));
    let from = a;
    for (const cut of cuts) {
      if (!samePoint(from, cut)) out.push([from, cut]);
      from = cut;
    }
    if (!samePoint(from, b)) out.push([from, b]);
  }
  return out;
}

/** Drops vertices sitting on the straight line between their two neighbours. */
function dropCollinear(loop: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < loop.length; i++) {
    const prev = loop[(i - 1 + loop.length) % loop.length];
    const cur = loop[i];
    const next = loop[(i + 1) % loop.length];
    const cross = (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x);
    if (Math.abs(cross) > UNION_EPS) out.push(cur);
  }
  return out.length >= 3 ? out : [...loop];
}

/**
 * Boundary loops of the union of `polygons`.
 *
 * Every polygon is wound counter-clockwise, then every edge is split at any
 * vertex lying on it. An edge that then appears in both directions is interior
 * to the union and cancels; what survives is the boundary, chained into closed
 * loops and simplified across collinear runs.
 *
 * Used by the target silhouette: one dashed outline per placement strokes each
 * shared edge twice, which reads as a seam through the figure.
 */
export function unionOutline(polygons: readonly (readonly Pt[])[]): Pt[][] {
  const vertices: Pt[] = [];
  let edges: Array<[Pt, Pt]> = [];
  for (const polygon of polygons) {
    if (polygon.length < 3) continue;
    const ring = signedArea(polygon) < 0 ? [...polygon].reverse() : [...polygon];
    for (let i = 0; i < ring.length; i++) {
      vertices.push(ring[i]);
      edges.push([ring[i], ring[(i + 1) % ring.length]]);
    }
  }
  edges = splitAtVertices(edges, vertices);

  // Cancel each edge against one opposite twin.
  const alive = edges.map(() => true);
  for (let i = 0; i < edges.length; i++) {
    if (!alive[i]) continue;
    for (let j = i + 1; j < edges.length; j++) {
      if (!alive[j]) continue;
      if (samePoint(edges[i][0], edges[j][1]) && samePoint(edges[i][1], edges[j][0])) {
        alive[i] = false;
        alive[j] = false;
        break;
      }
    }
  }

  const remaining = edges.filter((_, i) => alive[i]);
  const used = remaining.map(() => false);
  const loops: Pt[][] = [];
  for (let i = 0; i < remaining.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const loop: Pt[] = [remaining[i][0]];
    let end = remaining[i][1];
    let guard = remaining.length + 1;
    while (!samePoint(end, loop[0]) && guard-- > 0) {
      const next = remaining.findIndex((e, k) => !used[k] && samePoint(e[0], end));
      if (next < 0) break;
      used[next] = true;
      loop.push(remaining[next][0]);
      end = remaining[next][1];
    }
    if (loop.length >= 3) loops.push(dropCollinear(loop));
  }
  return loops;
}

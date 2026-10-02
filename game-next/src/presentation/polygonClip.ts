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

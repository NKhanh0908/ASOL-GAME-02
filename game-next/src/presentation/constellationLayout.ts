import type { Chapter } from '../domain/model.ts';

export type MapEntry = { id: string; title: string; chapter: Chapter };
export type MapNode = MapEntry & { index: number; x: number; y: number };
export type ChapterBand = {
  chapter: Chapter;
  /** Tâm dòng tiêu đề chương */
  bannerY: number;
  /** Dải màu nền của chương: [top, bottom) */
  top: number;
  bottom: number;
  nodeCount: number;
};
export type CampaignMapLayout = { nodes: MapNode[]; chapters: ChapterBand[]; totalHeight: number };

const FIRST_NODE_Y = 270;
const NODE_STEP_Y = 160;
const CHAPTER_GAP_Y = 100;
const BANNER_OFFSET_Y = 85;
const BAND_OFFSET_Y = 170;
const BOTTOM_PADDING = 240;

/**
 * Chòm sao 10 nút (Họa Phẩm): chuỗi đèn lồng — một nút giữa, một cặp hai
 * bên, lặp lại. [x tuyệt đối, dy so với nút đầu chương]. Cặp cùng hàng cách
 * nhau 320px (> huy hiệu 260px); các hàng cách nhau 140px.
 */
export const TEN_NODE_PATTERN: ReadonlyArray<readonly [number, number]> = [
  [360, 0],
  [200, 140],
  [520, 140],
  [360, 280],
  [200, 420],
  [520, 420],
  [360, 560],
  [200, 700],
  [520, 700],
  [360, 840],
];

/** Zigzag cũ của bản đồ 18 màn, theo chỉ số toàn cục: x trong [191, 529]. */
function zigzagX(index: number): number {
  const dir = index % 2 === 0 ? -1 : 1;
  return 360 + dir * (135 + ((index * 43) % 35));
}

/**
 * Toạ độ nút và dải chương suy ra từ manifest: mỗi nhóm chương liền nhau là
 * một chòm sao. Chòm sao đúng 10 nút dùng TEN_NODE_PATTERN, còn lại zigzag.
 */
export function layoutCampaignMap(entries: readonly MapEntry[]): CampaignMapLayout {
  const groups: Array<{ chapter: Chapter; entries: MapEntry[] }> = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.chapter === entry.chapter) last.entries.push(entry);
    else groups.push({ chapter: entry.chapter, entries: [entry] });
  }

  const nodes: MapNode[] = [];
  const bands: Array<Omit<ChapterBand, 'bottom'>> = [];
  let cursorY = FIRST_NODE_Y;
  groups.forEach((group, g) => {
    if (g > 0) cursorY += CHAPTER_GAP_Y;
    const firstY = cursorY;
    if (group.entries.length === TEN_NODE_PATTERN.length) {
      group.entries.forEach((entry, i) => {
        const [x, dy] = TEN_NODE_PATTERN[i];
        nodes.push({ ...entry, index: nodes.length, x, y: firstY + dy });
      });
      cursorY = firstY + TEN_NODE_PATTERN[TEN_NODE_PATTERN.length - 1][1] + NODE_STEP_Y;
    } else {
      for (const entry of group.entries) {
        const index = nodes.length;
        nodes.push({ ...entry, index, x: zigzagX(index), y: cursorY });
        cursorY += NODE_STEP_Y;
      }
    }
    bands.push({
      chapter: group.chapter,
      bannerY: firstY - BANNER_OFFSET_Y,
      top: g === 0 ? 0 : firstY - BAND_OFFSET_Y,
      nodeCount: group.entries.length,
    });
  });

  const totalHeight = nodes.length > 0 ? nodes[nodes.length - 1].y + BOTTOM_PADDING : FIRST_NODE_Y;
  const chapters: ChapterBand[] = bands.map((band, i) => ({
    ...band,
    bottom: i + 1 < bands.length ? bands[i + 1].top : totalHeight,
  }));
  return { nodes, chapters, totalHeight };
}

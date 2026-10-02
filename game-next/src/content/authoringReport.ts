import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { shapePolygon } from '../domain/shapes.ts';
import type { LevelDocument } from './document.ts';

export type SolutionReport = {
  solutionCount: number;
  fewerPieceSolutions: number;
  distractors: Array<{
    pieceId: string;
    anchorId: string | null;
    reason: string;
    changedCells: number | null;
  }>;
};

function targetMaskOf(doc: LevelDocument): Uint8Array {
  const mask = new Uint8Array(TOTAL_CELLS);
  for (const [x, y] of doc.targetCells) mask[y * GRID_WIDTH + x] = 1;
  return mask;
}

/** choice[i] là chỉ số neo của mảnh i, hoặc -1 khi mảnh nằm ở khay. */
function maskFor(doc: LevelDocument, choice: readonly number[]): Uint8Array {
  const mask = new Uint8Array(TOTAL_CELLS);
  doc.pieces.forEach((piece, i) => {
    const anchorIndex = choice[i];
    if (anchorIndex < 0) return;
    const anchor = piece.anchors[anchorIndex];
    for (const [cx, cy] of piece.cells) {
      mask[(anchor.y + cy) * GRID_WIDTH + anchor.x + cx] ^= 1;
    }
  });
  return mask;
}

function diffCount(a: Uint8Array, b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
  return count;
}

/**
 * Duyệt mọi tổ hợp neo/khay của các mảnh (turns = 0). Với 2–4 mảnh và 1–3 neo
 * mỗi mảnh, số tổ hợp tối đa vài trăm nên duyệt hết là đủ nhanh.
 */
export function searchSolutions(doc: LevelDocument): SolutionReport {
  const target = targetMaskOf(doc);
  let combos: number[][] = [[]];
  for (const piece of doc.pieces) {
    const options = [-1, ...piece.anchors.map((_, i) => i)];
    combos = combos.flatMap((c) => options.map((o) => [...c, o]));
  }

  let solutionCount = 0;
  let fewerPieceSolutions = 0;
  for (const choice of combos) {
    if (diffCount(maskFor(doc, choice), target) === 0) {
      solutionCount++;
      if (choice.includes(-1)) fewerPieceSolutions++;
    }
  }

  const base = doc.pieces.map((piece) => {
    const step = doc.sampleSolutions[0]?.find((s) => s.pieceId === piece.id);
    return step ? piece.anchors.findIndex((a) => a.id === step.anchorId) : -1;
  });

  const distractors = doc.distractors.map((d) => {
    const pieceIndex = doc.pieces.findIndex((p) => p.id === d.pieceId);
    const anchorIndex =
      pieceIndex >= 0 && d.anchorId
        ? doc.pieces[pieceIndex].anchors.findIndex((a) => a.id === d.anchorId)
        : -1;
    if (pieceIndex < 0 || anchorIndex < 0) {
      return { pieceId: d.pieceId, anchorId: d.anchorId ?? null, reason: d.reason, changedCells: null };
    }
    const choice = base.slice();
    choice[pieceIndex] = anchorIndex;
    return {
      pieceId: d.pieceId,
      anchorId: d.anchorId ?? null,
      reason: d.reason,
      changedCells: diffCount(maskFor(doc, choice), target),
    };
  });

  return { solutionCount, fewerPieceSolutions, distractors };
}

export function renderReportMarkdown(doc: LevelDocument, report: SolutionReport): string {
  const lines = [
    `# ${doc.id} ${doc.title}`,
    '',
    `- Revision: \`${doc.contentRevision}\``,
    `- Mục tiêu học: ${doc.learningObjective}`,
    `- Số mảnh: ${doc.pieces.length}; số ô mục tiêu: ${doc.targetCells.length}`,
    `- Số nghiệm: ${report.solutionCount}`,
    `- Nghiệm dùng ít mảnh hơn: ${report.fewerPieceSolutions}`,
    '',
    '## Tư thế gây nhiễu',
    '',
    '| Mảnh | Neo | Lý do | Số ô đổi so với mục tiêu |',
    '|---|---|---|---|',
    ...report.distractors.map(
      (d) => `| ${d.pieceId} | ${d.anchorId ?? '—'} | ${d.reason} | ${d.changedCells ?? '—'} |`
    ),
    '',
    `Ảnh xem trước: \`${doc.id}.svg\`. Sinh bằng \`npm run content:author -- ${doc.id}\`; không sửa tay.`,
    '',
  ];
  return lines.join('\n');
}

const SCALE = 4;
const PIECE_COLORS = ['#FFC857', '#7EE0A1', '#FF8FA3', '#8FB8FF'];

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function polygonPoints(doc: LevelDocument, pieceIndex: number, ax: number, ay: number): string {
  const piece = doc.pieces[pieceIndex];
  return shapePolygon(piece.shapeKind, piece.orientation ?? 0, piece.frameSize)
    .map((v) => `${(ax + v.x) * SCALE},${(ay + v.y) * SCALE}`)
    .join(' ');
}

/** Đường bao mục tiêu: mỗi hàng ô là các đoạn chạy liền nhau. */
function targetPath(doc: LevelDocument): string {
  const mask = targetMaskOf(doc);
  const parts: string[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    let x = 0;
    while (x < GRID_WIDTH) {
      if (!mask[y * GRID_WIDTH + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < GRID_WIDTH && mask[y * GRID_WIDTH + x]) x++;
      parts.push(`M${start * SCALE} ${y * SCALE}h${(x - start) * SCALE}v${SCALE}h${-(x - start) * SCALE}z`);
    }
  }
  return parts.join('');
}

export function renderPreviewSvg(doc: LevelDocument): string {
  const w = GRID_WIDTH * SCALE;
  const h = GRID_HEIGHT * SCALE;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 40}" viewBox="0 0 ${w} ${h + 40}">`);
  out.push(`<rect width="${w}" height="${h + 40}" fill="#101a4f"/>`);

  // Lưới hiển thị (8 ô) và module (24 ô)
  for (let x = 0; x <= GRID_WIDTH; x += 8) {
    const color = x % 24 === 0 ? '#3b56b8' : '#22336f';
    out.push(`<line x1="${x * SCALE}" y1="0" x2="${x * SCALE}" y2="${h}" stroke="${color}" stroke-width="1"/>`);
  }
  for (let y = 0; y <= GRID_HEIGHT; y += 8) {
    const color = y % 24 === 0 ? '#3b56b8' : '#22336f';
    out.push(`<line x1="0" y1="${y * SCALE}" x2="${w}" y2="${y * SCALE}" stroke="${color}" stroke-width="1"/>`);
  }

  out.push(`<path d="${targetPath(doc)}" fill="#BFE3FF" fill-opacity="0.35"/>`);

  // Nghiệm mẫu: mỗi mảnh một màu viền
  for (const step of doc.sampleSolutions[0] ?? []) {
    const index = doc.pieces.findIndex((p) => p.id === step.pieceId);
    const anchor = doc.pieces[index]?.anchors.find((a) => a.id === step.anchorId);
    if (index < 0 || !anchor) continue;
    out.push(
      `<polygon data-piece="${step.pieceId}" points="${polygonPoints(doc, index, anchor.x, anchor.y)}" fill="none" stroke="${PIECE_COLORS[index % PIECE_COLORS.length]}" stroke-width="3"/>`
    );
  }

  // Tư thế gây nhiễu: nét đứt cùng màu mảnh
  for (const d of doc.distractors) {
    const index = doc.pieces.findIndex((p) => p.id === d.pieceId);
    const anchor = doc.pieces[index]?.anchors.find((a) => a.id === d.anchorId);
    if (index < 0 || !anchor) continue;
    out.push(
      `<polygon points="${polygonPoints(doc, index, anchor.x, anchor.y)}" fill="none" stroke="${PIECE_COLORS[index % PIECE_COLORS.length]}" stroke-width="2" stroke-dasharray="8 6" stroke-opacity="0.8"/>`
    );
  }

  // Neo: chấm tại gốc khung, kèm nhãn
  doc.pieces.forEach((piece, index) => {
    for (const anchor of piece.anchors) {
      const cx = anchor.x * SCALE;
      const cy = anchor.y * SCALE;
      out.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="${PIECE_COLORS[index % PIECE_COLORS.length]}"/>`);
      out.push(
        `<text x="${cx + 6}" y="${cy + 14}" fill="#DDF2FF" font-family="sans-serif" font-size="12">${escapeXml(`${piece.id}.${anchor.id}`)}</text>`
      );
    }
  });

  out.push(
    `<text x="8" y="${h + 26}" fill="#DDF2FF" font-family="sans-serif" font-size="16">${escapeXml(`${doc.id} · ${doc.title} · ${doc.contentRevision}`)}</text>`
  );
  out.push('</svg>');
  return out.join('\n') + '\n';
}

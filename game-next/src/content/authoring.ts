import type { Cell, Orientation, ShapeKind } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { rotateCells } from '../domain/geometry.ts';
import { shapeCells } from '../domain/shapes.ts';
import type { LevelDocument } from './document.ts';

/** Neo phải rơi vào giao điểm lưới hiển thị: 1 ô hiển thị = 8 ô logic. */
export const ANCHOR_STEP = 8;

export type PieceSource = {
  id: string;
  shapeKind: ShapeKind;
  orientation: Orientation;
  frameSize: number;
  anchors: Array<{ id: string; x: number; y: number }>;
};

/**
 * Nguồn mô tả một màn: mọi thứ của LevelDocument trừ những phần được sinh ra
 * (cells của mảnh, targetCells, board, schemaVersion). Cells và target không
 * bao giờ gõ tay.
 */
export type LevelSource = Omit<LevelDocument, 'schemaVersion' | 'board' | 'pieces' | 'targetCells'> & {
  pieces: PieceSource[];
};

export function checkSourceGeometry(source: LevelSource): string[] {
  const problems: string[] = [];
  for (const piece of source.pieces) {
    for (const anchor of piece.anchors) {
      const label = `${piece.id}.${anchor.id} tại (${anchor.x}, ${anchor.y})`;
      if (anchor.x % ANCHOR_STEP !== 0 || anchor.y % ANCHOR_STEP !== 0) {
        problems.push(`${label}: neo không phải bội của ${ANCHOR_STEP}`);
      }
      if (
        anchor.x < 0 ||
        anchor.y < 0 ||
        anchor.x + piece.frameSize > GRID_WIDTH ||
        anchor.y + piece.frameSize > GRID_HEIGHT
      ) {
        problems.push(`${label}: khung mảnh vượt biên bàn`);
      }
    }
  }
  return problems;
}

export function buildLevelDocument(source: LevelSource): LevelDocument {
  const problems = checkSourceGeometry(source);
  if (problems.length > 0) {
    throw new Error(`authoring:${source.id}\n${problems.join('\n')}`);
  }

  const pieces: LevelDocument['pieces'] = source.pieces.map((p) => ({
    id: p.id,
    shapeKind: p.shapeKind,
    ...(p.shapeKind === 'triangle' ? { orientation: p.orientation } : {}),
    frameSize: p.frameSize,
    cells: shapeCells(p.shapeKind, p.orientation, p.frameSize),
    anchors: p.anchors.map((a) => ({ id: a.id, x: a.x, y: a.y })),
    color: 'amber' as const,
  }));

  // Target = mask chẵn/lẻ của nghiệm mẫu thứ nhất. Validator sẽ tính lại từ
  // nghiệm và so với target đã lưu (LVL-03).
  const mask = new Uint8Array(TOTAL_CELLS);
  for (const step of source.sampleSolutions[0] ?? []) {
    const piece = pieces.find((p) => p.id === step.pieceId);
    const anchor = piece?.anchors.find((a) => a.id === step.anchorId);
    if (!piece || !anchor) {
      throw new Error(
        `authoring:${source.id}\nnghiệm mẫu trỏ tới ${step.pieceId}.${step.anchorId} không tồn tại`
      );
    }
    for (const [cx, cy] of rotateCells(piece.cells, piece.frameSize, step.turns)) {
      mask[(anchor.y + cy) * GRID_WIDTH + anchor.x + cx] ^= 1;
    }
  }
  const targetCells: Cell[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (mask[i]) targetCells.push([i % GRID_WIDTH, Math.floor(i / GRID_WIDTH)]);
  }

  // Thứ tự khoá giữ đúng thứ tự trong file JSON hiện có để diff dễ đọc.
  const doc: LevelDocument = {
    schemaVersion: 1,
    id: source.id,
    title: source.title,
    chapter: source.chapter,
    order: source.order,
    contentRevision: source.contentRevision,
    board: { width: GRID_WIDTH, height: GRID_HEIGHT },
    rotationEnabled: source.rotationEnabled,
    pieces,
    targetCells,
    sampleSolutions: source.sampleSolutions,
    learningObjective: source.learningObjective,
    difficultyEstimate: source.difficultyEstimate,
    distractors: source.distractors,
    ftueSteps: source.ftueSteps,
  };
  if (source.victoryVerse !== undefined) {
    doc.victoryVerse = source.victoryVerse;
  }
  return doc;
}

export function serializeLevelDocument(doc: LevelDocument): string {
  return JSON.stringify(doc, null, 2) + '\n';
}

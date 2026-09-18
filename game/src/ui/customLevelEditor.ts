import { evaluate } from '../domain/mask';
import { diamond, smallTriangle, square, triangle } from '../domain/shapes';
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  type CustomLevelRecord,
  type PieceDefinition,
  type Placement,
} from '../domain/types';

export type ShapeKind = 'square' | 'triangle' | 'smallTriangle' | 'diamond';

export interface CustomLevelDraft {
  id?: string;
  kind?: 'new' | 'override';
  sourceLevelId?: string;
  title: string;
  pieces: PieceDefinition[];
  solution: Placement[];
  createdAt?: number;
}

export function createPiece(kind: ShapeKind, id: string): PieceDefinition {
  let cells;
  switch (kind) {
    case 'square':
      cells = square(48);
      break;
    case 'triangle':
      cells = triangle(48);
      break;
    case 'smallTriangle':
      cells = smallTriangle(24);
      break;
    case 'diamond':
      cells = diamond(48);
      break;
  }

  return {
    id,
    color: 1,
    cells,
    anchors: [],
  };
}

export function validateDraft(
  draft: CustomLevelDraft
): { ok: true; target: Uint8Array } | { ok: false; reason: string } {
  if (!draft.title || draft.title.trim().length === 0) {
    return { ok: false, reason: 'Tiêu đề không được để trống' };
  }

  if (!draft.pieces || draft.pieces.length === 0) {
    return { ok: false, reason: 'Cần ít nhất một mảnh ghép' };
  }

  if (draft.solution.length !== draft.pieces.length) {
    return { ok: false, reason: 'Vị trí mảnh không hợp lệ' };
  }

  const pieceIds = new Set<string>();
  for (const p of draft.pieces) {
    if (pieceIds.has(p.id)) {
      return { ok: false, reason: 'Trùng mã mảnh ghép' };
    }
    pieceIds.add(p.id);
  }

  const placementIds = new Set<string>();
  for (const placement of draft.solution) {
    const piece = draft.pieces.find((p) => p.id === placement.pieceId);
    if (!piece) {
      return { ok: false, reason: 'Không tìm thấy mảnh ghép tương ứng' };
    }
    if (placementIds.has(placement.pieceId) || !Number.isInteger(placement.x) || !Number.isInteger(placement.y)) {
      return { ok: false, reason: 'Vị trí mảnh không hợp lệ' };
    }
    placementIds.add(placement.pieceId);
    for (const [cx, cy] of piece.cells) {
      const gx = placement.x + cx;
      const gy = placement.y + cy;
      if (gx < 0 || gx >= GRID_WIDTH || gy < 0 || gy >= GRID_HEIGHT) {
        return { ok: false, reason: 'Mảnh ghép nằm ngoài bàn' };
      }
    }
  }

  const target = evaluate(
    {
      id: draft.id ?? 'draft',
      title: draft.title,
      pieces: draft.pieces,
      solution: draft.solution,
    },
    draft.solution
  );

  if (!target.some((cell) => cell !== 0)) {
    return {
      ok: false,
      reason: 'Bóng mục tiêu không được để trống',
    };
  }

  return { ok: true, target };
}

export function draftToRecord(draft: CustomLevelDraft): CustomLevelRecord {
  const validation = validateDraft(draft);
  if (!validation.ok) throw new Error(validation.reason);
  const id = draft.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = Date.now();

  // Populate anchors with each piece's solution placement
  const piecesWithAnchors: PieceDefinition[] = draft.pieces.map((p) => {
    const placement = draft.solution.find((s) => s.pieceId === p.id);
    const anchors: [number, number][] = placement ? [[placement.x, placement.y]] : [];
    return {
      ...p,
      anchors,
    };
  });

  return {
    id,
    title: draft.title.trim(),
    kind: draft.kind ?? 'new',
    ...(draft.kind === 'override' ? { sourceLevelId: draft.sourceLevelId ?? id } : {}),
    pieces: piecesWithAnchors,
    solution: draft.solution,
    target: validation.target,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  };
}

import type { Cell, Level, Piece, Placement, Turns } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { fitsBoard, rotateCells } from '../domain/geometry.ts';
import { evaluate, matchesTarget } from '../domain/mask.ts';
import type { LevelDocument, ValidationIssue, ValidationResult } from './document.ts';

export function validateLevel(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof input !== 'object' || input === null) {
    return {
      ok: false,
      issues: [{ levelId: 'unknown', field: 'root', code: 'invalid-json-root' }],
    };
  }

  const doc = input as Partial<LevelDocument>;
  const levelId = typeof doc.id === 'string' && doc.id.trim() ? doc.id : 'unknown';

  if (!doc.id || typeof doc.id !== 'string') {
    issues.push({ levelId, field: 'id', code: 'missing-id' });
  }
  if (!doc.title || typeof doc.title !== 'string') {
    issues.push({ levelId, field: 'title', code: 'missing-title' });
  }
  if (![1, 2, 3].includes(doc.chapter as number)) {
    issues.push({ levelId, field: 'chapter', code: 'invalid-chapter' });
  }
  if (typeof doc.order !== 'number' || !Number.isInteger(doc.order) || doc.order < 1) {
    issues.push({ levelId, field: 'order', code: 'invalid-order' });
  }
  if (typeof doc.rotationEnabled !== 'boolean') {
    issues.push({ levelId, field: 'rotationEnabled', code: 'invalid-rotation-flag' });
  }
  if (doc.victoryVerse !== undefined && typeof doc.victoryVerse !== 'string') {
    issues.push({ levelId, field: 'victoryVerse', code: 'invalid-victory-verse' });
  }

  // Chapter 1 & 2: rotation must not be enabled
  if ((doc.chapter === 1 || doc.chapter === 2) && doc.rotationEnabled) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-disabled' });
  }

  // Pieces validation
  if (!Array.isArray(doc.pieces) || doc.pieces.length === 0) {
    issues.push({ levelId, field: 'pieces', code: 'empty-pieces' });
  }

  const pieceIds = new Set<string>();
  const parsedPieces: Piece[] = [];

  if (Array.isArray(doc.pieces)) {
    for (let pIdx = 0; pIdx < doc.pieces.length; pIdx++) {
      const p = doc.pieces[pIdx];
      const pField = `pieces[${pIdx}]`;

      if (!p || typeof p !== 'object') {
        issues.push({ levelId, field: pField, code: 'invalid-piece-object' });
        continue;
      }

      if (!p.id || typeof p.id !== 'string') {
        issues.push({ levelId, field: `${pField}.id`, code: 'missing-piece-id' });
      } else if (pieceIds.has(p.id)) {
        issues.push({ levelId, field: `${pField}.id`, code: 'duplicate-piece-id' });
      } else {
        pieceIds.add(p.id);
      }

      if (typeof p.frameSize !== 'number' || !Number.isInteger(p.frameSize) || p.frameSize <= 0) {
        issues.push({ levelId, field: `${pField}.frameSize`, code: 'invalid-frame-size' });
      }

      if (p.color !== 'amber') {
        issues.push({ levelId, field: `${pField}.color`, code: 'invalid-color' });
      }

      if (!Array.isArray(p.cells) || p.cells.length === 0) {
        issues.push({ levelId, field: `${pField}.cells`, code: 'empty-cells' });
      } else {
        for (const cell of p.cells) {
          if (
            !Array.isArray(cell) ||
            cell.length !== 2 ||
            !Number.isInteger(cell[0]) ||
            !Number.isInteger(cell[1]) ||
            cell[0] < 0 ||
            cell[0] >= p.frameSize ||
            cell[1] < 0 ||
            cell[1] >= p.frameSize
          ) {
            issues.push({ levelId, field: `${pField}.cells`, code: 'invalid-cell-coordinate' });
            break;
          }
        }
      }

      if (!Array.isArray(p.anchors) || p.anchors.length === 0) {
        issues.push({ levelId, field: `${pField}.anchors`, code: 'empty-anchors' });
      } else {
        const anchorIds = new Set<string>();
        for (const anchor of p.anchors) {
          if (!anchor.id || typeof anchor.id !== 'string') {
            issues.push({ levelId, field: `${pField}.anchors`, code: 'invalid-anchor-id' });
          } else if (anchorIds.has(anchor.id)) {
            issues.push({ levelId, field: `${pField}.anchors`, code: 'duplicate-anchor-id' });
          } else {
            anchorIds.add(anchor.id);
          }

          if (!Number.isInteger(anchor.x) || !Number.isInteger(anchor.y)) {
            issues.push({ levelId, field: `${pField}.anchors`, code: 'invalid-anchor-coord' });
          }
        }
      }

      if (p.id && Array.isArray(p.cells) && Array.isArray(p.anchors)) {
        parsedPieces.push({
          id: p.id,
          frameSize: p.frameSize,
          cells: p.cells.map(([x, y]) => [x, y] as const),
          anchors: p.anchors.map((a) => ({ id: a.id, x: a.x, y: a.y })),
          color: 'amber',
        });
      }
    }
  }

  // Target cells validation
  const targetMask = new Uint8Array(TOTAL_CELLS);
  if (!Array.isArray(doc.targetCells) || doc.targetCells.length === 0) {
    issues.push({ levelId, field: 'targetCells', code: 'empty-target' });
  } else {
    for (const cell of doc.targetCells) {
      if (
        !Array.isArray(cell) ||
        cell.length !== 2 ||
        !Number.isInteger(cell[0]) ||
        !Number.isInteger(cell[1]) ||
        cell[0] < 0 ||
        cell[0] >= GRID_WIDTH ||
        cell[1] < 0 ||
        cell[1] >= GRID_HEIGHT
      ) {
        issues.push({ levelId, field: 'targetCells', code: 'target-cell-out-of-bounds' });
        break;
      }
      targetMask[cell[1] * GRID_WIDTH + cell[0]] = 1;
    }
  }

  // Sample solutions validation
  if (!Array.isArray(doc.sampleSolutions) || doc.sampleSolutions.length === 0) {
    issues.push({ levelId, field: 'sampleSolutions', code: 'missing-solutions' });
  } else if (parsedPieces.length > 0 && Array.isArray(doc.targetCells) && doc.targetCells.length > 0) {
    const dummyLevel: Level = {
      id: levelId,
      title: doc.title ?? '',
      chapter: (doc.chapter ?? 1) as 1 | 2 | 3,
      contentRevision: doc.contentRevision ?? '',
      rotationEnabled: Boolean(doc.rotationEnabled),
      pieces: parsedPieces,
      targetMask,
    };

    for (let sIdx = 0; sIdx < doc.sampleSolutions.length; sIdx++) {
      const solution: Array<{ pieceId?: string; anchorId?: string; turns?: Turns }> | undefined =
        doc.sampleSolutions[sIdx];
      const sField = `sampleSolutions[${sIdx}]`;

      if (!Array.isArray(solution)) {
        issues.push({ levelId, field: sField, code: 'invalid-solution' });
        continue;
      }

      const placements: Placement[] = [];
      const coverage = new Uint8Array(TOTAL_CELLS);

      for (const step of solution) {
        if (!step || typeof step !== 'object') {
          issues.push({ levelId, field: sField, code: 'invalid-solution-step' });
          continue;
        }

        const piece: Piece | undefined = parsedPieces.find((p) => p.id === step.pieceId);
        if (!piece) {
          issues.push({ levelId, field: sField, code: 'unknown-solution-piece' });
          continue;
        }

        const anchor = piece.anchors.find((a: { id: string; x: number; y: number }) => a.id === step.anchorId);
        if (!anchor) {
          issues.push({ levelId, field: sField, code: 'unknown-anchor' });
          continue;
        }

        if (doc.chapter === 1 && step.turns !== 0) {
          issues.push({ levelId, field: sField, code: 'solution-rotation-disallowed' });
        }

        const turns = (step.turns ?? 0) as Turns;
        const rotatedCells = rotateCells(piece.cells, piece.frameSize, turns);
        if (!fitsBoard(rotatedCells, anchor.x, anchor.y)) {
          issues.push({ levelId, field: sField, code: 'solution-piece-out-of-bounds' });
          continue;
        }

        // Chapter 1: cấm xếp chồng / giao nhau trong nghiệm
        if (doc.chapter === 1) {
          for (const [cx, cy] of rotatedCells) {
            const idx = (anchor.y + cy) * GRID_WIDTH + (anchor.x + cx);
            if (coverage[idx] > 0) {
              issues.push({ levelId, field: sField, code: 'chapter-1-no-overlap' });
              break;
            }
            coverage[idx]++;
          }
        }

        placements.push({
          pieceId: piece.id,
          x: anchor.x,
          y: anchor.y,
          turns,
        });
      }

      if (placements.length === solution.length) {
        try {
          const solutionMask = evaluate(dummyLevel, placements);
          if (!matchesTarget(solutionMask, targetMask)) {
            issues.push({ levelId, field: sField, code: 'solution-target-mismatch' });
          }
        } catch (err) {
          issues.push({ levelId, field: sField, code: (err as Error).message });
        }
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    level: {
      id: levelId,
      title: doc.title!,
      chapter: doc.chapter as 1 | 2 | 3,
      contentRevision: doc.contentRevision ?? 'v1',
      rotationEnabled: doc.rotationEnabled!,
      pieces: parsedPieces,
      targetMask,
    },
  };
}

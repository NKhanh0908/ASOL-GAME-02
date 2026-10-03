import type { Cell, Chapter, Level, Orientation, Piece, Placement, Turns } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH, TOTAL_CELLS } from '../domain/model.ts';
import { fitsBoard, rotateCells } from '../domain/geometry.ts';
import { evaluate, matchesTarget } from '../domain/mask.ts';
import { isStructuralFrame, isValidOrientation, shapeCells } from '../domain/shapes.ts';
import type { LevelDocument, ValidationIssue, ValidationResult } from './document.ts';
import { chapterInfo } from './chapters.ts';

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
  const chapterRule = chapterInfo(doc.chapter as number);
  if (!chapterRule) {
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

  // Xoay chỉ mở ở chương xoay (Chương 4 — Luân Chuyển): chương 1–3 cấm bật, chương 4 bắt buộc bật
  if (chapterRule && !chapterRule.rotationEnabled && doc.rotationEnabled === true) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-disabled' });
  }
  if (chapterRule && chapterRule.rotationEnabled && doc.rotationEnabled === false) {
    issues.push({ levelId, field: 'rotationEnabled', code: 'chapter-rotation-required' });
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

      let cellsValid = false;
      if (!Array.isArray(p.cells) || p.cells.length === 0) {
        issues.push({ levelId, field: `${pField}.cells`, code: 'empty-cells' });
      } else {
        cellsValid = true;
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
            cellsValid = false;
            break;
          }
        }
      }

      // Hình và hướng: cells phải đúng bằng raster của đa giác chuẩn (LVL-02).
      // Tam giác và bình hành bắt buộc ghi hướng; vuông, thoi, tròn bỏ trống là 0.
      const needsOrientation = p.shapeKind === 'triangle' || p.shapeKind === 'parallelogram';
      const orientation = (
        p.orientation === undefined && !needsOrientation ? 0 : p.orientation
      ) as Orientation;
      const shapeKindValid =
        p.shapeKind === 'square' ||
        p.shapeKind === 'triangle' ||
        p.shapeKind === 'diamond' ||
        p.shapeKind === 'circle' ||
        p.shapeKind === 'parallelogram';
      if (!shapeKindValid) {
        issues.push({ levelId, field: `${pField}.shapeKind`, code: 'invalid-shape-kind' });
      } else if (
        (needsOrientation && p.orientation === undefined) ||
        !isValidOrientation(p.shapeKind, orientation)
      ) {
        issues.push({ levelId, field: `${pField}.orientation`, code: 'invalid-orientation' });
      } else if (
        typeof p.frameSize === 'number' &&
        !isStructuralFrame(p.shapeKind, orientation, p.frameSize)
      ) {
        // Luật bám lưới (spec A mục 3) kiểm ở authoring; validator chỉ chặn
        // khung làm đỉnh lệch khỏi ô nguyên hoặc không vừa bàn.
        issues.push({ levelId, field: `${pField}.frameSize`, code: 'invalid-frame-for-shape' });
      } else if (cellsValid && Number.isInteger(p.frameSize) && p.frameSize > 0) {
        const expected = new Set(
          shapeCells(p.shapeKind, orientation, p.frameSize).map(([x, y]) => `${x},${y}`)
        );
        const actual = new Set(p.cells.map(([x, y]) => `${x},${y}`));
        const same =
          actual.size === p.cells.length &&
          actual.size === expected.size &&
          [...actual].every((k) => expected.has(k));
        if (!same) {
          issues.push({ levelId, field: `${pField}.cells`, code: 'shape-cells-mismatch' });
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
          shapeKind: p.shapeKind,
          orientation,
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

  let firstPlacements: Placement[] | undefined;

  // Sample solutions validation
  if (!Array.isArray(doc.sampleSolutions) || doc.sampleSolutions.length === 0) {
    issues.push({ levelId, field: 'sampleSolutions', code: 'missing-solutions' });
  } else if (parsedPieces.length > 0 && Array.isArray(doc.targetCells) && doc.targetCells.length > 0) {
    const dummyLevel: Level = {
      id: levelId,
      title: doc.title ?? '',
      chapter: (doc.chapter ?? 1) as Chapter,
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

        if (chapterRule && !chapterRule.rotationEnabled && step.turns !== 0) {
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
      if (sIdx === 0 && placements.length === solution.length) {
        firstPlacements = placements;
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
      chapter: doc.chapter as Chapter,
      contentRevision: doc.contentRevision ?? 'v1',
      rotationEnabled: doc.rotationEnabled!,
      pieces: parsedPieces,
      targetMask,
      victoryVerse: doc.victoryVerse,
      targetPlacements: firstPlacements ?? [],
    },
  };
}

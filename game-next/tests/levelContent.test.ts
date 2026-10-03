import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import { searchSolutions } from '../src/content/authoringReport.ts';
import { loadLevel } from '../src/content/catalog.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';
import { rotateCells } from '../src/domain/geometry.ts';
import { GRID_WIDTH, TOTAL_CELLS } from '../src/domain/model.ts';

type ContentExpectation = {
  id: string;
  pieceCount: number;
  targetCells: number;
  hollowCells: number;
  revivedCells: number;
};

const SEARCH_TIMEOUT_MS = 120_000;

function coverageOf(doc: LevelDocument): Uint8Array {
  const coverage = new Uint8Array(TOTAL_CELLS);
  for (const step of doc.sampleSolutions[0]) {
    const piece = doc.pieces.find((p) => p.id === step.pieceId)!;
    const anchor = piece.anchors.find((a) => a.id === step.anchorId)!;
    for (const [cx, cy] of rotateCells(piece.cells, piece.frameSize, step.turns)) {
      coverage[(anchor.y + cy) * GRID_WIDTH + anchor.x + cx]++;
    }
  }
  return coverage;
}

function checkLevel(e: ContentExpectation): void {
  describe(`màn ${e.id}`, () => {
    const source = LEVEL_SOURCES[e.id];
    test('có nguồn mô tả trong LEVEL_SOURCES', () => {
      expect(source).toBeDefined();
    });
    if (!source) return;

    const doc = buildLevelDocument(source);
    test('nguồn dựng được và qua validator', () => {
      const result = validateLevel(doc);
      expect(result.ok ? [] : result.issues).toEqual([]);
    });
    test('đúng số mảnh, số ô mục tiêu, số ô rỗng và số ô hiện lại', () => {
      const coverage = coverageOf(doc);
      let hollow = 0;
      let revived = 0;
      for (const c of coverage) {
        if (c > 0 && c % 2 === 0) hollow++;
        if (c >= 3 && c % 2 === 1) revived++;
      }
      expect(doc.pieces).toHaveLength(e.pieceCount);
      expect(doc.targetCells).toHaveLength(e.targetCells);
      expect(hollow).toBe(e.hollowCells);
      expect(revived).toBe(e.revivedCells);
    });
    test('đúng một nghiệm, không có nghiệm dùng ít mảnh hơn', () => {
      const report = searchSolutions(doc);
      expect(report.solutionCount).toBe(1);
      expect(report.fewerPieceSolutions).toBe(0);
    }, SEARCH_TIMEOUT_MS);
    test('JSON đã commit khớp với nguồn', () => {
      const path = fileURLToPath(new URL(`../src/content/levels/${e.id}.json`, import.meta.url));
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(doc);
    });
    test('manifest trỏ đúng dữ liệu; harness nạp được; campaign chỉ nạp khi approved', () => {
      const entry = campaignManifest.find((m) => m.id === e.id)!;
      expect(entry.dataPath).toBe(`src/content/levels/${e.id}.json`);
      expect(entry.contentRevision).toBe(source.contentRevision);
      expect(entry.chapter).toBe(source.chapter);
      expect(['validated', 'approved']).toContain(entry.status);
      expect(loadLevel(e.id, 'harness').id).toBe(e.id);
      if (entry.status === 'approved') expect(loadLevel(e.id, 'campaign').id).toBe(e.id);
      else expect(() => loadLevel(e.id, 'campaign')).toThrow(`unavailable:${e.id}`);
    });
  });
}

checkLevel({ id: '2-1', pieceCount: 2, targetCells: 1728, hollowCells: 576, revivedCells: 0 });
checkLevel({ id: '2-2', pieceCount: 2, targetCells: 3584, hollowCells: 512, revivedCells: 0 });

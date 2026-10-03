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
checkLevel({ id: '2-3', pieceCount: 3, targetCells: 3712, hollowCells: 384, revivedCells: 128 });
checkLevel({ id: '2-4', pieceCount: 3, targetCells: 3200, hollowCells: 384, revivedCells: 128 });
checkLevel({ id: '2-5', pieceCount: 4, targetCells: 1912, hollowCells: 1284, revivedCells: 512 });
checkLevel({ id: '2-6', pieceCount: 4, targetCells: 2560, hollowCells: 1536, revivedCells: 512 });
checkLevel({ id: '3-1', pieceCount: 3, targetCells: 4032, hollowCells: 1116, revivedCells: 128 });
checkLevel({ id: '3-2', pieceCount: 4, targetCells: 5168, hollowCells: 1232, revivedCells: 0 });
checkLevel({ id: '3-3', pieceCount: 4, targetCells: 2304, hollowCells: 312, revivedCells: 0 });
checkLevel({ id: '3-4', pieceCount: 4, targetCells: 4316, hollowCells: 720, revivedCells: 0 });
checkLevel({ id: '3-5', pieceCount: 4, targetCells: 3946, hollowCells: 217, revivedCells: 0 });
checkLevel({ id: '3-6', pieceCount: 7, targetCells: 3840, hollowCells: 256, revivedCells: 0 });
checkLevel({ id: '3-7', pieceCount: 5, targetCells: 3904, hollowCells: 288, revivedCells: 0 });
checkLevel({ id: '3-8', pieceCount: 4, targetCells: 4352, hollowCells: 812, revivedCells: 0 });
checkLevel({ id: '3-9', pieceCount: 3, targetCells: 1580, hollowCells: 980, revivedCells: 812 });
checkLevel({ id: '3-10', pieceCount: 5, targetCells: 4468, hollowCells: 2732, revivedCells: 1364 });

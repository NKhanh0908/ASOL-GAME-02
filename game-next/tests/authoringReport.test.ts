import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import type { LevelSource } from '../src/content/authoring.ts';
import { DEV_LEVEL_DOCUMENTS } from '../src/content/devLevels.ts';
import type { LevelDocument } from '../src/content/document.ts';
import {
  renderPreviewSvg,
  renderReportMarkdown,
  searchSolutions,
} from '../src/content/authoringReport.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';

const songTinh = buildLevelDocument(LEVEL_SOURCES['1-1']);

describe('searchSolutions', () => {
  test('1-1 có đúng một nghiệm, không nghiệm ít mảnh, mỗi neo B đổi 1.280 ô', () => {
    const report = searchSolutions(songTinh);
    expect(report.solutionCount).toBe(1);
    expect(report.fewerPieceSolutions).toBe(0);
    expect(report.distractors.map((d) => d.changedCells)).toEqual([1280, 1280]);
  });

  test('đếm được nghiệm thứ hai khi hai mảnh giống nhau đổi chỗ được', () => {
    const twins: LevelSource = {
      ...structuredClone(LEVEL_SOURCES['1-1']),
      id: 'test-twins',
      pieces: [
        { id: 'S1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }, { id: 'B', x: 64, y: 56 }] },
        { id: 'S2', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }, { id: 'B', x: 16, y: 56 }] },
      ],
      sampleSolutions: [
        [
          { pieceId: 'S1', anchorId: 'A', turns: 0 },
          { pieceId: 'S2', anchorId: 'A', turns: 0 },
        ],
      ],
      distractors: [],
    };
    expect(searchSolutions(buildLevelDocument(twins)).solutionCount).toBe(2);
  });

  test('báo nghiệm ít mảnh hơn khi có mảnh thừa không cần dùng', () => {
    // X1 không nằm trong nghiệm mẫu nên target chỉ gồm D1 + D2; nghiệm duy nhất để X1 ở khay
    const extra: LevelSource = {
      ...structuredClone(LEVEL_SOURCES['1-1']),
      id: 'test-extra',
      pieces: [
        ...structuredClone(LEVEL_SOURCES['1-1'].pieces),
        { id: 'X1', shapeKind: 'square', orientation: 0, frameSize: 48, anchors: [{ id: 'A', x: 40, y: 104 }] },
      ],
      distractors: [],
    };
    const report = searchSolutions(buildLevelDocument(extra));
    expect(report.solutionCount).toBe(1);
    expect(report.fewerPieceSolutions).toBe(1);
  });
});

describe('renderPreviewSvg và renderReportMarkdown', () => {
  test('SVG có đủ đa giác nghiệm và tư thế gây nhiễu', () => {
    const svg = renderPreviewSvg(songTinh);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('data-piece="D1"');
    expect(svg).toContain('data-piece="D2"');
    expect(svg.match(/stroke-dasharray/g)).toHaveLength(2);
    expect(svg).toContain('D1.A');
    expect(svg).toContain('D2.B');
  });

  test('báo cáo markdown ghi số nghiệm và số ô đổi của từng gây nhiễu', () => {
    const md = renderReportMarkdown(songTinh, searchSolutions(songTinh));
    expect(md).toContain('# 1-1 Song Tinh');
    expect(md).toContain('Số nghiệm: 1');
    expect(md).toContain('Nghiệm dùng ít mảnh hơn: 0');
    expect(md).toContain('| D1 | B | Lệch trục ngang | 1280 |');
  });
});

describe('ảnh xem trước vẽ được hai hình mới', () => {
  test('SVG của dev-shapes-v2 có đa giác 32 đỉnh cho hình tròn và 4 đỉnh cho bình hành', () => {
    const svg = renderPreviewSvg(DEV_LEVEL_DOCUMENTS['dev-shapes-v2'] as LevelDocument);
    const circle = svg.match(/<polygon data-piece="C1" points="([^"]+)"/)!;
    expect(circle[1].trim().split(' ')).toHaveLength(32);
    const para = svg.match(/<polygon data-piece="P1" points="([^"]+)"/)!;
    expect(para[1].trim().split(' ')).toHaveLength(4);
  });
});

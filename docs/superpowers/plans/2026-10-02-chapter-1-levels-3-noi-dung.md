# Chương 1 — Giai đoạn 3/3: Năm màn 1-2 → 1-6, GDD và duyệt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết nguồn cho năm màn 1-2 → 1-6, sinh dữ liệu, đăng ký ở trạng thái `validated`, cập nhật GDD, rồi đưa từng màn qua cổng duyệt của người review lên `approved`.

**Architecture:** Mỗi màn là một file nguồn `src/content/sources/<id>.ts` (mảnh, hướng, neo, nghiệm, gây nhiễu, metadata). `npm run content:author -- <id>` sinh JSON, SVG và báo cáo. Một file test chung `tests/chapter1Levels.test.ts` khoá số mảnh, số ô mục tiêu, số nghiệm và số ô đổi của từng tư thế gây nhiễu (con số đã được tính trước bằng prototype độc lập).

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Node 24 strip-types, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-10-02-chapter-1-levels-design.md` (mục 6 là bảng toạ độ gốc của năm màn)

**Giao được gì sau giai đoạn này:** 1-2 → 1-6 chơi được ở `?mode=harness` trên dev và có hồ sơ xem trước; sau cổng duyệt, các màn được duyệt xuất hiện trong campaign theo thứ tự.

## Vị trí trong loạt plan

- **Chạy sau:** `2026-10-02-chapter-1-levels-2-renderer.md` — phải xong và xanh.
- **Chạy tiếp theo:** không có. Sau Task 16 dùng skill `superpowers:finishing-a-development-branch`.

Chỉ mục: `docs/superpowers/plans/2026-10-02-chapter-1-levels-index.md`

## Global Constraints

Giữ nguyên Global Constraints của giai đoạn 1 và 2, cộng thêm:

- Toạ độ, hướng và mảnh của từng màn lấy **đúng** bảng ở mục 6 của spec; không tự chỉnh. Nếu công cụ authoring báo lỗi với toạ độ đã cho, dừng lại và báo người review thay vì sửa toạ độ.
- Hướng tam giác: 0 = góc vuông TL, 1 = TR, 2 = BR, 3 = BL; 4 = mái cạnh huyền ở đáy.
- Revision mới của mỗi màn: `bao-thap-v1`, `canh-chim-v1`, `hai-dang-v1`, `thuyen-sao-v1`, `vuong-mien-v1`. Mỗi lần sửa nguồn sau khi người review yêu cầu thì tăng hậu tố (`-v2`, ...).
- Dev server cho ảnh chụp: `npm run dev -- --port 5173 --strictPort` chạy nền; ảnh màn chơi lưu ở `docs/testing/levels/screens/`.

---

### Task 10: Màn 1-2 Bảo Tháp Tiên Tri và bộ test chung

**Files:**
- Create: `game-next/src/content/sources/1-2.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Create: `game-next/tests/chapter1Levels.test.ts`
- Modify: `game-next/tests/content.test.ts` (test `campaignManifest chứa đủ 18 màn`)
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (dòng 1-2)
- Create (sinh bằng script): `game-next/src/content/levels/1-2.json`, `docs/testing/levels/1-2.svg`, `docs/testing/levels/1-2-report.md`, `docs/testing/levels/screens/1-2-{play,drag,win}.png`

**Interfaces:**
- Consumes: `LevelSource` (giai đoạn 1), `buildLevelDocument`, `searchSolutions`, `loadLevel`, `campaignManifest`, `scripts/shoot-level.sh` (giai đoạn 2).
- Produces:
  - `export const baoThap: LevelSource` trong `sources/1-2.ts`
  - `checkLevel(expectation)` trong `tests/chapter1Levels.test.ts`, dùng lại ở Task 11–14
  - Hằng `AUTHORED_LEVELS` trong `tests/content.test.ts`, mở rộng ở Task 11–14

- [ ] **Step 1: Viết bộ test chung (thất bại)**

Tạo `game-next/tests/chapter1Levels.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { buildLevelDocument } from '../src/content/authoring.ts';
import { searchSolutions } from '../src/content/authoringReport.ts';
import { loadLevel } from '../src/content/catalog.ts';
import { campaignManifest } from '../src/content/manifest.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

type Expectation = {
  id: string;
  pieceCount: number;
  targetCells: number;
  /** Số ô đổi so với mục tiêu của từng tư thế gây nhiễu, theo thứ tự `distractors` */
  distractorCells: number[];
};

/**
 * Khoá dữ liệu một màn. Các con số được tính trước bằng prototype độc lập
 * (raster trên-trái + duyệt tổ hợp) khi viết plan, không lấy từ chính code này.
 */
function checkLevel(e: Expectation): void {
  describe(`màn ${e.id}`, () => {
    const source = LEVEL_SOURCES[e.id];
    test('có nguồn mô tả trong LEVEL_SOURCES', () => {
      expect(source).toBeDefined();
    });
    // Chưa có nguồn thì chỉ test trên đỏ; không dựng tiếp để khỏi làm hỏng cả file
    if (!source) return;

    const doc = buildLevelDocument(source);
    const report = searchSolutions(doc);

    test('nguồn dựng được và qua validator', () => {
      const result = validateLevel(doc);
      expect(result.ok ? [] : result.issues).toEqual([]);
    });

    test('đúng số mảnh và số ô mục tiêu', () => {
      expect(doc.pieces).toHaveLength(e.pieceCount);
      expect(doc.targetCells).toHaveLength(e.targetCells);
    });

    test('đúng một nghiệm, không có nghiệm dùng ít mảnh hơn', () => {
      expect(report.solutionCount).toBe(1);
      expect(report.fewerPieceSolutions).toBe(0);
    });

    test('mỗi tư thế gây nhiễu đổi đúng số ô dự kiến', () => {
      expect(report.distractors.map((d) => d.changedCells)).toEqual(e.distractorCells);
    });

    test('JSON đã commit khớp với nguồn', () => {
      const path = fileURLToPath(new URL(`../src/content/levels/${e.id}.json`, import.meta.url));
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(doc);
    });

    test('manifest trỏ đúng dữ liệu; harness nạp được; campaign chỉ nạp khi approved', () => {
      const entry = campaignManifest.find((m) => m.id === e.id)!;
      expect(entry.dataPath).toBe(`src/content/levels/${e.id}.json`);
      expect(entry.contentRevision).toBe(source.contentRevision);
      expect(['validated', 'approved']).toContain(entry.status);
      expect(loadLevel(e.id, 'harness').id).toBe(e.id);
      if (entry.status === 'approved') {
        expect(loadLevel(e.id, 'campaign').id).toBe(e.id);
      } else {
        expect(() => loadLevel(e.id, 'campaign')).toThrow(`unavailable:${e.id}`);
      }
    });
  });
}

checkLevel({ id: '1-2', pieceCount: 2, targetCells: 2880, distractorCells: [768, 352] });
```

Run: `npx vitest run tests/chapter1Levels.test.ts`
Expected: FAIL đúng một test — `màn 1-2 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 1-2**

Tạo `game-next/src/content/sources/1-2.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 1-2 Bảo Tháp Tiên Tri: khối vuông làm chân tháp, mái tam giác đặt ngay ngắn
 * trên đỉnh. Đáy mái (y = 64) nằm trọn trên cạnh trên khối vuông.
 */
export const baoThap: LevelSource = {
  id: '1-2',
  title: 'Bảo Tháp Tiên Tri',
  chapter: 1,
  order: 2,
  contentRevision: 'bao-thap-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 64 },
        { id: 'B', x: 48, y: 64 },
      ],
    },
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 16 },
        { id: 'B', x: 48, y: 16 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Phối hợp hai hình khối khác nhau thành một biểu tượng',
  difficultyEstimate: 1,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Chân tháp lệch ngang' },
    { pieceId: 'R1', anchorId: 'B', reason: 'Mái lệch khỏi trục tháp' },
  ],
  ftueSteps: [
    {
      id: 'combine-shapes',
      trigger: 'idle',
      end: 'drag-start',
      text: 'Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu',
    },
  ],
  victoryVerse: 'Tháp vươn lên trời, lời tiên tri có chỗ đứng.',
};
```

Trong `game-next/src/content/sources/index.ts`, thêm `import { baoThap } from './1-2.ts';` dưới import của 1-1 và dòng `'1-2': baoThap,` dưới `'1-1': songTinh,`.

- [ ] **Step 3: Sinh dữ liệu**

Run: `npm run content:author -- 1-2`
Expected: `1-2: 2880 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn` rồi `PASS 1-2`. Có ba file mới: `src/content/levels/1-2.json`, `../docs/testing/levels/1-2.svg`, `../docs/testing/levels/1-2-report.md`.

- [ ] **Step 4: Đăng ký màn**

Trong `game-next/src/content/catalog.ts`: thêm `import baoThap from './levels/1-2.json';` dưới import `songTinh`, và thêm `'1-2': baoThap,` vào object `documents`.

Trong `game-next/src/content/manifest.ts`, thay dòng 1-2 bằng:

```ts
  { id: '1-2', title: 'Bảo Tháp Tiên Tri', chapter: 1, order: 2, contentRevision: 'bao-thap-v1', status: 'validated', dataPath: 'src/content/levels/1-2.json' },
```

Trong `game-next/tests/content.test.ts`, thêm ngay dưới các import:

```ts
/** Các màn đã có dữ liệu ngoài 1-1; trạng thái phải là validated hoặc approved */
const AUTHORED_LEVELS = new Set(['1-2']);
```

và thay vòng lặp cuối của test `campaignManifest chứa đủ 18 màn` (vòng `for (let i = 1; ...)`) bằng:

```ts
    for (const entry of campaignManifest.slice(1)) {
      if (AUTHORED_LEVELS.has(entry.id)) {
        expect(['validated', 'approved']).toContain(entry.status);
      } else {
        expect(entry.status).toBe('planned');
      }
    }
```

- [ ] **Step 5: Chạy toàn bộ kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `npx vitest run tests/chapter1Levels.test.ts` có 7 test PASS; `content:validate` in thêm `PASS: Level 1-2 (Bảo Tháp Tiên Tri) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/1-2.svg`: khối vuông viền vàng ở giữa bàn, mái tam giác viền xanh lá ngồi trên cạnh trên, hai tư thế nét đứt lệch sang phải 8 ô, bốn nhãn neo.

Với dev server đang chạy: `bash scripts/shoot-level.sh 1-2 ../docs/testing/levels/screens 5173 harness`
Mở ba ảnh và xác nhận: khay có hai mảnh (vuông và mái), bóng mục tiêu là ngôi tháp, ảnh `win` có cả hai mảnh đặc đúng chỗ, ngôi sao ở giữa tháp, thẻ hoàn thành có câu thơ của 1-2. Màn hình không có chữ chồng lên nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-02 - Add level 1-2 Bao Thap Tien Tri (validated)`. Message: `feat(content): add level 1-2 Bao Thap Tien Tri as validated`.

```bash
git add src/content/sources/1-2.ts src/content/sources/index.ts src/content/levels/1-2.json src/content/catalog.ts src/content/manifest.ts tests/chapter1Levels.test.ts tests/content.test.ts ../docs/testing/levels/1-2.svg ../docs/testing/levels/1-2-report.md ../docs/testing/levels/screens/1-2-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 11: Màn 1-3 Cánh Chim Báo Điềm

**Files:**
- Create: `game-next/src/content/sources/1-3.ts`
- Modify: `game-next/src/content/sources/index.ts`, `game-next/src/content/catalog.ts`, `game-next/src/content/manifest.ts` (dòng 1-3), `game-next/tests/chapter1Levels.test.ts`, `game-next/tests/content.test.ts`
- Create (sinh): `src/content/levels/1-3.json`, `docs/testing/levels/1-3.svg`, `1-3-report.md`, `screens/1-3-*.png`

**Interfaces:**
- Consumes: `checkLevel`, `AUTHORED_LEVELS` (Task 10).
- Produces: `export const canhChim: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/chapter1Levels.test.ts`:

```ts
checkLevel({ id: '1-3', pieceCount: 2, targetCells: 2304, distractorCells: [2256, 2352] });
```

Run: `npx vitest run tests/chapter1Levels.test.ts`
Expected: FAIL đúng một test: `màn 1-3 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 1-3**

Tạo `game-next/src/content/sources/1-3.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 1-3 Cánh Chim Báo Điềm: đôi cánh giương, mũi cánh ở góc trên ngoài (16, 56)
 * và (112, 56), hai cạnh huyền dốc vào giữa và chạm nhau tại (64, 104).
 * Hai cánh chạm tại một đỉnh chứ không chung cạnh dọc (spec D6). Mỗi cánh có
 * neo phụ ở bên kia: đổi chỗ hai cánh cho ra hình kim tự tháp, sai bóng.
 */
export const canhChim: LevelSource = {
  id: '1-3',
  title: 'Cánh Chim Báo Điềm',
  chapter: 1,
  order: 3,
  contentRevision: 'canh-chim-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'W1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 64, y: 56 },
      ],
    },
    {
      id: 'W2',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 56 },
        { id: 'B', x: 16, y: 56 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'W1', anchorId: 'A', turns: 0 },
      { pieceId: 'W2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Tự so bóng mục tiêu và đặt hai cánh đối xứng đúng bên',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'W1', anchorId: 'B', reason: 'Cánh trái đặt sang bên phải' },
    { pieceId: 'W2', anchorId: 'B', reason: 'Cánh phải đặt sang bên trái' },
  ],
  ftueSteps: [],
  victoryVerse: 'Đôi cánh mở ra, điềm lành bay về phương bắc.',
};
```

Trong `sources/index.ts`: thêm `import { canhChim } from './1-3.ts';` và `'1-3': canhChim,`.

- [ ] **Step 3: Sinh dữ liệu**

Run: `npm run content:author -- 1-3`
Expected: `1-3: 2304 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, `PASS 1-3`.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import canhChim from './levels/1-3.json';` và `'1-3': canhChim,` trong `documents`.

`manifest.ts`, thay dòng 1-3 bằng:

```ts
  { id: '1-3', title: 'Cánh Chim Báo Điềm', chapter: 1, order: 3, contentRevision: 'canh-chim-v1', status: 'validated', dataPath: 'src/content/levels/1-3.json' },
```

`tests/content.test.ts`: đổi `new Set(['1-2'])` thành `new Set(['1-2', '1-3'])`.

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh.

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/1-3.svg`: hai tam giác viền màu khác nhau tạo hình chữ V giương lên, chạm nhau ở điểm đáy giữa bàn; hai tư thế nét đứt nằm ở bên đối diện. Chụp `bash scripts/shoot-level.sh 1-3 ../docs/testing/levels/screens 5173 harness` và xác nhận khay có hai tam giác hướng khác nhau, ảnh `win` đúng đôi cánh, không có hướng dẫn FTUE nào hiện ra.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-02 - Add level 1-3 Canh Chim Bao Diem (validated)`. Message: `feat(content): add level 1-3 Canh Chim Bao Diem as validated`.

```bash
git add src/content/sources/1-3.ts src/content/sources/index.ts src/content/levels/1-3.json src/content/catalog.ts src/content/manifest.ts tests/chapter1Levels.test.ts tests/content.test.ts ../docs/testing/levels/1-3.svg ../docs/testing/levels/1-3-report.md ../docs/testing/levels/screens/1-3-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 12: Màn 1-4 Ngọn Hải Đăng

**Files:**
- Create: `game-next/src/content/sources/1-4.ts`
- Modify: `sources/index.ts`, `catalog.ts`, `manifest.ts` (dòng 1-4), `tests/chapter1Levels.test.ts`, `tests/content.test.ts`
- Create (sinh): `levels/1-4.json`, `docs/testing/levels/1-4.svg`, `1-4-report.md`, `screens/1-4-*.png`

**Interfaces:**
- Consumes: `checkLevel`, `AUTHORED_LEVELS`.
- Produces: `export const haiDang: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `tests/chapter1Levels.test.ts`:

```ts
checkLevel({ id: '1-4', pieceCount: 3, targetCells: 4032, distractorCells: [352, 704, 768] });
```

Run: `npx vitest run tests/chapter1Levels.test.ts` → FAIL đúng một test: `màn 1-4 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 1-4**

Tạo `game-next/src/content/sources/1-4.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 1-4 Ngọn Hải Đăng: ba tầng theo trục đứng x = 64 — mái, đèn thoi, đế vuông.
 * Đỉnh thoi chạm đáy mái tại (64, 48); đáy thoi chạm cạnh trên đế tại (64, 96).
 */
export const haiDang: LevelSource = {
  id: '1-4',
  title: 'Ngọn Hải Đăng',
  chapter: 1,
  order: 4,
  contentRevision: 'hai-dang-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 0 },
        { id: 'B', x: 48, y: 0 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 48 },
        { id: 'B', x: 48, y: 48 },
      ],
    },
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 96 },
        { id: 'B', x: 48, y: 96 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép ba khối tiếp giáp theo trục đứng',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Mái lệch ngang' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Đèn lệch ngang' },
    { pieceId: 'S1', anchorId: 'B', reason: 'Đế lệch ngang' },
  ],
  ftueSteps: [],
  victoryVerse: 'Ngọn hải đăng thắp sáng, thuyền lạc tìm thấy lối về.',
};
```

`sources/index.ts`: thêm `import { haiDang } from './1-4.ts';` và `'1-4': haiDang,`.

- [ ] **Step 3: Sinh dữ liệu**

Run: `npm run content:author -- 1-4`
Expected: `1-4: 4032 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, `PASS 1-4`.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: `import haiDang from './levels/1-4.json';` và `'1-4': haiDang,`.

`manifest.ts`, thay dòng 1-4 bằng:

```ts
  { id: '1-4', title: 'Ngọn Hải Đăng', chapter: 1, order: 4, contentRevision: 'hai-dang-v1', status: 'validated', dataPath: 'src/content/levels/1-4.json' },
```

`tests/content.test.ts`: `new Set(['1-2', '1-3', '1-4'])`.

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate` → xanh.

- [ ] **Step 6: Xem trước và chụp ảnh**

SVG: ba hình xếp dọc giữa bàn, chạm nhau tại hai điểm trên trục x = 64. Chụp `bash scripts/shoot-level.sh 1-4 ../docs/testing/levels/screens 5173 harness`. Xác nhận **khay có ba ô** (ba ô lõm, ba mảnh không đè nhau, chạm vào mảnh nào thì kéo đúng mảnh đó — kiểm bằng ảnh `drag`: mảnh cuối là vuông đang được kéo), và ảnh `win` đủ ba tầng.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-02 - Add level 1-4 Ngon Hai Dang (validated)`. Message: `feat(content): add level 1-4 Ngon Hai Dang as validated`.

```bash
git add src/content/sources/1-4.ts src/content/sources/index.ts src/content/levels/1-4.json src/content/catalog.ts src/content/manifest.ts tests/chapter1Levels.test.ts tests/content.test.ts ../docs/testing/levels/1-4.svg ../docs/testing/levels/1-4-report.md ../docs/testing/levels/screens/1-4-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 13: Màn 1-5 Chiếc Thuyền Sao

**Files:**
- Create: `game-next/src/content/sources/1-5.ts`
- Modify: `sources/index.ts`, `catalog.ts`, `manifest.ts` (dòng 1-5), `tests/chapter1Levels.test.ts`, `tests/content.test.ts`
- Create (sinh): `levels/1-5.json`, `docs/testing/levels/1-5.svg`, `1-5-report.md`, `screens/1-5-*.png`

**Interfaces:**
- Consumes: `checkLevel`, `AUTHORED_LEVELS`.
- Produces: `export const thuyenSao: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `tests/chapter1Levels.test.ts`:

```ts
checkLevel({ id: '1-5', pieceCount: 3, targetCells: 4560, distractorCells: [696, 696] });
```

Run: `npx vitest run tests/chapter1Levels.test.ts` → FAIL đúng một test: `màn 1-5 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 1-5**

Tạo `game-next/src/content/sources/1-5.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 1-5 Chiếc Thuyền Sao: thân vuông, mũi thuyền áp cạnh phải thân (x = 64) với
 * cạnh huyền vát về phía sau, buồm có đáy nằm trên mép trên của thân và mũi
 * (y = 80), cột buồm tại x = 40. Thân chỉ có một neo: thân bắt đầu ở x = 16
 * nên không còn chỗ đặt mũi bên trái.
 */
export const thuyenSao: LevelSource = {
  id: '1-5',
  title: 'Chiếc Thuyền Sao',
  chapter: 1,
  order: 5,
  contentRevision: 'thuyen-sao-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [{ id: 'A', x: 16, y: 80 }],
    },
    {
      id: 'P1',
      shapeKind: 'triangle',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 80 },
        { id: 'B', x: 64, y: 88 },
      ],
    },
    {
      id: 'L1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 32 },
        { id: 'B', x: 48, y: 32 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'P1', anchorId: 'A', turns: 0 },
      { pieceId: 'L1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép thân, mũi và buồm tiếp giáp cạnh thành con thuyền',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'P1', anchorId: 'B', reason: 'Mũi thuyền lệch dọc' },
    { pieceId: 'L1', anchorId: 'B', reason: 'Buồm lệch ngang' },
  ],
  ftueSteps: [],
  victoryVerse: 'Thuyền sao giương buồm, dải ngân hà mở lối.',
};
```

`sources/index.ts`: thêm `import { thuyenSao } from './1-5.ts';` và `'1-5': thuyenSao,`.

- [ ] **Step 3: Sinh dữ liệu**

Run: `npm run content:author -- 1-5`
Expected: `1-5: 4560 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, `PASS 1-5`.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: `import thuyenSao from './levels/1-5.json';` và `'1-5': thuyenSao,`.

`manifest.ts`, thay dòng 1-5 bằng:

```ts
  { id: '1-5', title: 'Chiếc Thuyền Sao', chapter: 1, order: 5, contentRevision: 'thuyen-sao-v1', status: 'validated', dataPath: 'src/content/levels/1-5.json' },
```

`tests/content.test.ts`: `new Set(['1-2', '1-3', '1-4', '1-5'])`.

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate` → xanh.

- [ ] **Step 6: Xem trước và chụp ảnh**

SVG: thân vuông bên trái, mũi tam giác bên phải vát xuống, buồm tam giác phía trên với cạnh thẳng đứng ở x = 40. Chụp `bash scripts/shoot-level.sh 1-5 ../docs/testing/levels/screens 5173 harness`; xác nhận khay ba ô, ảnh `win` thành con thuyền, ngôi sao lấp lánh nằm trên thân thuyền (trọng tâm lệch trái, khoảng x ≈ 54).

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-02 - Add level 1-5 Chiec Thuyen Sao (validated)`. Message: `feat(content): add level 1-5 Chiec Thuyen Sao as validated`.

```bash
git add src/content/sources/1-5.ts src/content/sources/index.ts src/content/levels/1-5.json src/content/catalog.ts src/content/manifest.ts tests/chapter1Levels.test.ts tests/content.test.ts ../docs/testing/levels/1-5.svg ../docs/testing/levels/1-5-report.md ../docs/testing/levels/screens/1-5-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 14: Màn 1-6 Vương Miện Bình Minh

**Files:**
- Create: `game-next/src/content/sources/1-6.ts`
- Modify: `sources/index.ts`, `catalog.ts`, `manifest.ts` (dòng 1-6), `tests/chapter1Levels.test.ts`, `tests/content.test.ts`
- Create (sinh): `levels/1-6.json`, `docs/testing/levels/1-6.svg`, `1-6-report.md`, `screens/1-6-*.png`

**Interfaces:**
- Consumes: `checkLevel`, `AUTHORED_LEVELS`.
- Produces: `export const vuongMien: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `tests/chapter1Levels.test.ts`:

```ts
checkLevel({ id: '1-6', pieceCount: 3, targetCells: 3456, distractorCells: [2256, 2352, 704] });
```

Run: `npx vitest run tests/chapter1Levels.test.ts` → FAIL đúng một test: `màn 1-6 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 1-6**

Tạo `game-next/src/content/sources/1-6.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 1-6 Vương Miện Bình Minh: đôi cánh của 1-3 cộng một viên thoi lấp vừa khe
 * giữa. Ba đỉnh cao bằng nhau tại x = 16, 64, 112 (y = 56), đáy phẳng y = 104.
 * Hai cạnh dưới của thoi nằm trên hai cạnh huyền của đôi cánh: tiếp giáp cạnh,
 * không chung ô nhờ quy tắc ô biên chung (spec D7, D8).
 */
export const vuongMien: LevelSource = {
  id: '1-6',
  title: 'Vương Miện Bình Minh',
  chapter: 1,
  order: 6,
  contentRevision: 'vuong-mien-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'W1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 64, y: 56 },
      ],
    },
    {
      id: 'W2',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 56 },
        { id: 'B', x: 16, y: 56 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 56 },
        { id: 'B', x: 40, y: 48 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'W1', anchorId: 'A', turns: 0 },
      { pieceId: 'W2', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Nhận ra khe giữa hai cánh vừa khít một viên thoi',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'W1', anchorId: 'B', reason: 'Cánh trái đặt sang bên phải' },
    { pieceId: 'W2', anchorId: 'B', reason: 'Cánh phải đặt sang bên trái' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Viên thoi nhô lên khỏi khe' },
  ],
  ftueSteps: [],
  victoryVerse: 'Ba đỉnh vương miện bừng sáng, bình minh Cổ Ngữ đã đến.',
};
```

`sources/index.ts`: thêm `import { vuongMien } from './1-6.ts';` và `'1-6': vuongMien,`.

- [ ] **Step 3: Sinh dữ liệu**

Run: `npm run content:author -- 1-6`
Expected: `1-6: 3456 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, `PASS 1-6`.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: `import vuongMien from './levels/1-6.json';` và `'1-6': vuongMien,`.

`manifest.ts`, thay dòng 1-6 bằng:

```ts
  { id: '1-6', title: 'Vương Miện Bình Minh', chapter: 1, order: 6, contentRevision: 'vuong-mien-v1', status: 'validated', dataPath: 'src/content/levels/1-6.json' },
```

`tests/content.test.ts`: `new Set(['1-2', '1-3', '1-4', '1-5', '1-6'])`.

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate && npm run content:author -- --all`
Expected: xanh; lệnh cuối in `PASS` cho cả sáu màn và `git status` không thấy JSON nào đổi (nguồn và dữ liệu khớp nhau).

- [ ] **Step 6: Xem trước và chụp ảnh**

SVG: ba đỉnh nhọn cùng độ cao, thoi nằm giữa hai cánh, không có khe hở hay vạch mảnh giữa thoi và cánh. Chụp `bash scripts/shoot-level.sh 1-6 ../docs/testing/levels/screens 5173 harness`. Trong ảnh `win`, phóng to vùng tiếp giáp thoi–cánh: **không được có vạch màu mặt bàn** chạy dọc cạnh huyền (nếu có, quy tắc ô biên hoặc chồng lớp đang sai — dừng và báo lại).

- [ ] **Step 7: CHANGELOG và commit**

Mục `### 2026-10-02 - Add level 1-6 Vuong Mien Binh Minh (validated)`. Message: `feat(content): add level 1-6 Vuong Mien Binh Minh as validated`.

```bash
git add src/content/sources/1-6.ts src/content/sources/index.ts src/content/levels/1-6.json src/content/catalog.ts src/content/manifest.ts tests/chapter1Levels.test.ts tests/content.test.ts ../docs/testing/levels/1-6.svg ../docs/testing/levels/1-6-report.md ../docs/testing/levels/screens/1-6-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 15: Cập nhật GDD và trang tổng hợp duyệt Chương 1

**Files:**
- Modify: `docs/gdd/master-gdd.md` (Phụ lục A: dòng "Cách đọc", hàng 1-1/1-2/1-3; Phụ lục B: hàng 1-4/1-5/1-6)
- Create: `docs/testing/levels/chapter-1-review.md`

**Interfaces:**
- Consumes: dữ liệu và ảnh của Task 10–14.
- Produces: trang tổng hợp người review dùng ở Task 16.

- [ ] **Step 1: Sửa dòng "Cách đọc" của Phụ lục A**

Trong `docs/gdd/master-gdd.md`, trong đoạn bắt đầu bằng `**Cách đọc:**` của Phụ lục A, thay cụm `` `(x,y)` là neo gốc khung mảnh trên lưới 128 × 192; số trong ngoặc sau tên hình là cạnh khung theo ô. `` bằng:

```markdown
`(x,y)` là neo gốc khung mảnh trên lưới 128 × 160 (neo là bội của 8); mọi mảnh Chương 1 dùng khung 48 ô. Tam giác là tam giác vuông cân; ô nằm đúng trên cạnh tính theo quy tắc trên-trái chung cho mọi hình (spec 2026-10-02).
```

- [ ] **Step 2: Thay ba hàng 1-1, 1-2, 1-3 của Phụ lục A**

Thay ba hàng bảng bắt đầu bằng `| **1-1 Song Tinh**`, `| **1-2 Bảo Tháp Tiên Tri**`, `| **1-3 Cánh Chim Báo Điềm**` bằng:

```markdown
| **1-1 Song Tinh** *(Twin Stars)* · học kéo/thả, snap lưới | 2: thoi 48, thoi 48 | Hình A1: Hai viên ngọc thoi đặt cạnh nhau, chạm đỉnh tại tâm bàn (64, 80). Neo A (16,56) và (64,56). | **Không xếp chồng.** Tiếp giáp đỉnh `◆◆`. Biểu tượng cân bằng sơ khởi của vũ trụ. Revision `song-tinh-v2`. | 1/5 |
| **1-2 Bảo Tháp Tiên Tri** *(Sacred Spire)* · phối hợp hai khối | 1: vuông 48, 1: tam giác 48 (mái, hướng 4) | Hình A2: Khối vuông (40,64) làm chân tháp, mái (40,16) ngồi trọn trên cạnh trên. | **Không xếp chồng.** Tiếp giáp cạnh (đáy mái = cạnh trên vuông, y = 64). FTUE: "Mỗi mảnh một hình, ghép chúng thành bóng mục tiêu". | 1/5 |
| **1-3 Cánh Chim Báo Điềm** *(Astral Wing)* · đối xứng trục | 2: tam giác 48 (hướng 3 và 2) | Hình A3: Đôi cánh giương, mũi cánh ở (16,56) và (112,56), hai cạnh huyền dốc vào giữa. | **Không xếp chồng.** Hai cánh chạm tại một đỉnh (64,104), không chung cạnh dọc (chung cạnh dọc chỉ ra một tam giác lớn). Đổi chỗ hai cánh cho ra kim tự tháp, sai bóng. | 2/5 |
```

- [ ] **Step 3: Thay ba hàng 1-4, 1-5, 1-6 của Phụ lục B**

Thay ba hàng bảng bắt đầu bằng `| **1-4** |`, `| **1-5** |`, `| **1-6** |` bằng:

```markdown
| **1-4** | **Ngọn Hải Đăng** *(The Pharos)* | Ghép tiếp giáp 3 khối theo trục đứng x = 64: mái (40,0), đèn thoi (40,48), đế vuông (40,96); chạm đỉnh–cạnh, không xếp chồng | 3: tam giác (mái), thoi, vuông |
| **1-5** | **Chiếc Thuyền Sao** *(Astral Barque)* | Thân vuông (16,80) + mũi tam giác hướng 0 (64,80) áp cạnh phải thân + buồm tam giác hướng 3 (40,32) ngồi trên mép trên; không xếp chồng | 3: vuông, 2 tam giác |
| **1-6** | **Vương Miện Bình Minh** *(Crown of Dawn)* | Đôi cánh của 1-3 + viên thoi (40,56) lấp vừa khe giữa: ba đỉnh cao bằng nhau tại x = 16, 64, 112; kết thúc Chương 1. Dùng thoi thay vuông vì ba mảnh khung 48 xếp ngang rộng 144 > 128 | 3: 2 tam giác, thoi |
```

- [ ] **Step 4: Viết trang tổng hợp duyệt**

Tạo `docs/testing/levels/chapter-1-review.md`:

```markdown
# Duyệt Chương 1 — 1-1 → 1-6

Spec: [`2026-10-02-chapter-1-levels-design.md`](../../superpowers/specs/2026-10-02-chapter-1-levels-design.md). Dữ liệu sinh bằng `npm run content:author -- <id>` từ `game-next/src/content/sources/<id>.ts`.

Chơi thử trên dev server: `cd game-next && npm run dev`, mở `http://localhost:5173/?scene=play&level=<id>&mode=harness`.

| Màn | Trạng thái | Xem trước | Báo cáo nghiệm | Ảnh màn chơi |
|---|---|---|---|---|
| 1-1 Song Tinh | approved (`song-tinh-v2`) | [1-1.svg](1-1.svg) | [1-1-report.md](1-1-report.md) | [trước](screens/1-1-before-win.png) · [sau](screens/1-1-after-win.png) |
| 1-2 Bảo Tháp Tiên Tri | validated | [1-2.svg](1-2.svg) | [1-2-report.md](1-2-report.md) | [chơi](screens/1-2-play.png) · [kéo](screens/1-2-drag.png) · [thắng](screens/1-2-win.png) |
| 1-3 Cánh Chim Báo Điềm | validated | [1-3.svg](1-3.svg) | [1-3-report.md](1-3-report.md) | [chơi](screens/1-3-play.png) · [kéo](screens/1-3-drag.png) · [thắng](screens/1-3-win.png) |
| 1-4 Ngọn Hải Đăng | validated | [1-4.svg](1-4.svg) | [1-4-report.md](1-4-report.md) | [chơi](screens/1-4-play.png) · [kéo](screens/1-4-drag.png) · [thắng](screens/1-4-win.png) |
| 1-5 Chiếc Thuyền Sao | validated | [1-5.svg](1-5.svg) | [1-5-report.md](1-5-report.md) | [chơi](screens/1-5-play.png) · [kéo](screens/1-5-drag.png) · [thắng](screens/1-5-win.png) |
| 1-6 Vương Miện Bình Minh | validated | [1-6.svg](1-6.svg) | [1-6-report.md](1-6-report.md) | [chơi](screens/1-6-play.png) · [kéo](screens/1-6-drag.png) · [thắng](screens/1-6-win.png) |

Mỗi màn đều có đúng một nghiệm và không có nghiệm dùng ít mảnh hơn (xem báo cáo). Cột trạng thái được cập nhật khi từng màn được duyệt.
```

- [ ] **Step 5: CHANGELOG và commit**

Mục `### 2026-10-02 - Update GDD chapter 1 level sheets and add review index`. Message: `docs(gdd): update chapter 1 level sheets to the authored geometry`.

```bash
git add ../docs/gdd/master-gdd.md ../docs/testing/levels/chapter-1-review.md ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 16: Cổng duyệt từng màn (cần người review)

**Files (cho mỗi màn được duyệt):**
- Modify: `game-next/src/content/manifest.ts` (đổi `status` của màn đó sang `approved`)
- Create: `docs/testing/mirror-rebuild/<id>-content-review.md`
- Modify: `docs/testing/levels/chapter-1-review.md` (cột trạng thái)
- Modify (chỉ khi duyệt 1-2): `game-next/tests/menu.test.ts`, `game-next/tests/catalog.test.ts`

**Interfaces:**
- Consumes: mọi thứ ở trên.
- Produces: các màn `approved` theo thứ tự campaign.

Campaign mở khoá tuần tự, nên duyệt theo thứ tự 1-2 → 1-6. Mỗi màn là một vòng Step 1–6 riêng, một commit riêng.

- [ ] **Step 1: Hỏi người review**

Gửi người review, rồi **dừng chờ** câu trả lời:

> Màn `<id> <tên>` (`<revision>`) sẵn sàng duyệt. Xem trước: `docs/testing/levels/<id>.svg`; báo cáo nghiệm: `<id>-report.md` (1 nghiệm, 0 nghiệm ít mảnh hơn); ảnh màn chơi trong `docs/testing/levels/screens/<id>-*.png`; chơi thử: `?scene=play&level=<id>&mode=harness` trên dev server. Bạn duyệt màn này, hay muốn sửa gì?

- [ ] **Step 2: Nếu người review yêu cầu sửa**

Sửa đúng điều được yêu cầu trong `src/content/sources/<id>.ts`, tăng `contentRevision` (ví dụ `bao-thap-v1` → `bao-thap-v2`) ở cả nguồn và `manifest.ts`, chạy `npm run content:author -- <id>`. Nếu số ô mục tiêu hoặc số ô gây nhiễu đổi, cập nhật dòng `checkLevel` của màn đó bằng **con số công cụ in ra** sau khi người review đã xem SVG mới và đồng ý với hình. Chụp lại ảnh, chạy `npm run typecheck && npm test`, commit (`fix(content): revise level <id> per review`), rồi quay lại Step 1.

- [ ] **Step 3: Nếu người review duyệt — đổi trạng thái**

Trong `manifest.ts`, đổi `status: 'validated'` của màn đó thành `status: 'approved'`.

- [ ] **Step 4: Chỉ khi duyệt 1-2 — cập nhật test đang giả định 1-2 chưa sẵn sàng**

`tests/menu.test.ts`, test `sau khi hoàn thành 1-1: ...`: đổi tên test thành `'sau khi hoàn thành 1-1: 1-1 là completed, 1-2 mở khoá và sẵn sàng'` và đổi dòng cuối thành:

```ts
    expect(access2.available).toBe(true); // 1-2 đã approved
```

`tests/menu.test.ts`, test `xác định đúng màn chơi kế tiếp an toàn ...`: thay comment và hai dòng kiểm `res1` bằng:

```ts
    // Sau khi đã chơi xong 1-1, 1-2 đã approved nên được chọn để chơi tiếp
    const res1 = resolveNextCampaignLevel(campaignManifest, ['1-1']);
    expect(res1.level.id).toBe('1-2');
    expect(res1.type).toBe('continue');
```

`tests/catalog.test.ts`, test `manifest giả định có 1-2 approved ...`: đổi dòng `expect(prodAccess.available).toBe(false); // planned` thành:

```ts
    expect(prodAccess.available).toBe(true); // 1-2 đã approved
```

và test `loadLevel chặn màn 1-2 ở campaign vì status đang là planned`: đổi màn kiểm tra sang màn đầu tiên còn `planned` là `2-1`:

```ts
  test('loadLevel chặn màn chưa có dữ liệu ở campaign', () => {
    expect(() => loadLevel('2-1', 'campaign')).toThrow('unavailable:2-1');
  });
```

Chạy `npm test`. Nếu còn test khác hỏng chỉ vì giả định "1-2 chưa approved" (ví dụ `tests/levelSelect.test.ts`), sửa kỳ vọng theo đúng hành vi mới và ghi tên test vào CHANGELOG; nếu test hỏng vì lý do khác thì dừng và điều tra.

- [ ] **Step 5: Ghi biên bản duyệt**

Tạo `docs/testing/mirror-rebuild/<id>-content-review.md`:

```markdown
# Hồ sơ thẩm định nội dung — Màn <id> <tên>

* **Ngày duyệt:** <ngày duyệt>
* **Trạng thái thẩm định:** `approved`
* **Revision:** `<revision>`
* **Người duyệt:** <tên người review như họ tự xưng trong cuộc trò chuyện>
* **Nguồn:** [`game-next/src/content/sources/<id>.ts`](../../game-next/src/content/sources/<id>.ts) → [`game-next/src/content/levels/<id>.json`](../../game-next/src/content/levels/<id>.json)

## Bằng chứng

* Xem trước: [`<id>.svg`](../levels/<id>.svg) · Báo cáo nghiệm: [`<id>-report.md`](../levels/<id>-report.md)
* Ảnh màn chơi: [chơi](../levels/screens/<id>-play.png) · [kéo](../levels/screens/<id>-drag.png) · [thắng](../levels/screens/<id>-win.png)
* Kiểm tra máy: `npm test`, `npm run content:validate` đạt tại commit duyệt.

## Ghi chú của người review

<ghi nguyên văn nhận xét của người review; nếu không có, ghi "Không có">
```

Trong `docs/testing/levels/chapter-1-review.md`, đổi ô trạng thái của màn thành `approved (<revision>)`.

- [ ] **Step 6: Kiểm tra và commit**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `npx vitest run tests/chapter1Levels.test.ts` xác nhận màn vừa duyệt nạp được ở campaign.

Mục CHANGELOG `### 2026-10-02 - Approve level <id> <tên ASCII>`. Message: `feat(content): approve level <id> after review`.

```bash
git add src/content/manifest.ts ../docs/testing/mirror-rebuild/<id>-content-review.md ../docs/testing/levels/chapter-1-review.md ../CHANGELOG.md
# Khi duyệt 1-2, thêm: tests/menu.test.ts tests/catalog.test.ts (và test khác đã sửa ở Step 4)
git commit -F <file chứa message>
```

Lặp lại Step 1–6 cho màn kế tiếp. Màn nào người review chưa duyệt thì giữ `validated`; không duyệt vượt thứ tự.

---

## Kết thúc giai đoạn 3

`npm run typecheck && npm test && npm run content:validate && npm run build` xanh. Báo người review: màn nào đã `approved`, màn nào còn `validated` và vì sao. Sau đó dùng skill `superpowers:finishing-a-development-branch` để chọn cách tích hợp nhánh `feat/chapter-1-levels`.

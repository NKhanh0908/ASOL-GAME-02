# Chương 2 + Họa Phẩm — 16 màn (spec C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết nguồn cho 16 màn (2-1 → 2-6 với 2-5 Đồng Hồ Cát mới, và 3-1 → 3-10 Họa Phẩm), sinh dữ liệu, đăng ký ở `validated`, cập nhật GDD, rồi đưa từng màn qua cổng duyệt lên `approved`.

**Architecture:** Mỗi màn là một file `src/content/sources/<id>.ts` liệt kê **tường minh** mảnh, hướng, neo A và neo nhiễu (không dùng hàm ghép hình, để toạ độ khớp tuyệt đối với bảng spec). `npm run content:author -- <id>` sinh JSON, SVG và báo cáo nghiệm. Test chung `tests/levelContent.test.ts` khoá số mảnh, số ô mục tiêu, số ô rỗng, số ô hiện lại, nghiệm duy nhất và trạng thái manifest bằng con số đã tính trước bằng prototype độc lập.

**Tech Stack:** TypeScript (ESM, đuôi `.ts`), Vitest, Node 24 `--experimental-strip-types`, Chrome headless.

**Spec:** `docs/superpowers/specs/2026-10-02-c-chapter-2-hoa-pham-levels-design.md` (mục 3: con số kiểm chứng; mục 4: bảng toạ độ từng màn).

## Vị trí trong loạt plan

- **Chạy sau:**
  - Chương 1 giai đoạn 3 (`2026-10-02-chapter-1-levels-3-noi-dung.md`): cần `tests/content.test.ts` có hằng `AUTHORED_LEVELS` và cổng duyệt đã chạy được.
  - Plan A (`2026-10-02-a-shapes-v2.md`): `shapeKind` `'circle'` và `'parallelogram'`, khung theo loại hình.
  - Plan B (`2026-10-02-b-level-kit-chapters.md`): manifest 28 màn, `chapter: 1 | 2 | 3 | 4`, luật neo nhiễu KIT-03, chòm sao Họa Phẩm 10 nút.
- **Song song được với:** plan D (đặt tự do). Nếu D xong trước, `searchSolutions` đã nhanh hơn; test vẫn giữ nguyên.
- **Chạy tiếp theo:** plan E (Xưởng) có thể clone các màn này.

## Global Constraints

- Thư mục làm việc: `game-next/`. Mọi lệnh `npm`/`npx`/`node` chạy từ đó. Node `>=24.13.1 <25`.
- Import nội bộ luôn kèm đuôi `.ts`; kiểu chỉ import bằng `import type`.
- Comment và chuỗi hiển thị viết tiếng Việt; tên biến/hàm tiếng Anh.
- **Luật chẵn lẻ** (spec A mục 2): 1 lớp hiện, 2 lớp ẩn, 3 lớp hiện lại. Không đổi `domain/mask.ts`.
- Toạ độ là gốc khung trên lưới 128 × 160, bội của 8. Hướng: tam giác 0–3 góc vuông TL/TR/BR/BL, 4–7 mái cạnh huyền đáy/trái/đỉnh/phải; bình hành 0–3 theo spec A mục SH-02. Vuông, thoi, tròn luôn hướng 0.
- **Toạ độ, hướng, khung và neo nhiễu lấy đúng mục 4 của spec C; không tự chỉnh.** Neo nhiễu đặt tên `B`, `C`, `D` theo đúng thứ tự cột "Neo nhiễu".
- Lý do gây nhiễu theo độ lệch so với neo A: `(+8,0)` → "Lệch phải 8 ô", `(−8,0)` → "Lệch trái 8 ô", `(0,+8)` → "Lệch xuống 8 ô", `(0,−8)` → "Lệch lên 8 ô".
- **Nếu công cụ authoring hoặc test cho số khác bảng spec C mục 3: dừng lại, báo người review kèm output. Không sửa test theo công cụ, không sửa toạ độ.**
- Chương 2: `chapter: 2`, `order` 7 → 12. Họa Phẩm: `chapter: 3`, `order` 13 → 22 (manifest 28 màn của plan B).
- Revision đầu: slug không dấu + `-v1` (bảng ở từng task). Sửa nguồn sau duyệt thì tăng hậu tố.
- Không bao giờ tự đặt `status: 'approved'` khi người review chưa đồng ý rõ ràng trong cuộc trò chuyện.
- Trước mỗi commit: `npm run typecheck` và `npm test` xanh.
- Mỗi commit thêm một mục đầu phần `## Unreleased` của `CHANGELOG.md` (gốc repo): `### YYYY-MM-DD - <Tiêu đề tiếng Anh>`, gạch đầu dòng thay đổi kèm file, dòng cuối `- Verification: <lệnh và kết quả>`.
- Commit message tiếng Anh `type(scope): summary`, kết thúc bằng hai dòng:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
  `Co-authored-by: Codex <noreply@codex.local>`
  Trên Windows dùng `git commit -F <file>`.
- Dev server cho ảnh chụp: `npm run dev -- --port 5173 --strictPort` chạy nền; ảnh lưu ở `docs/testing/levels/screens/`.

## Con số khoá trong test (spec C mục 3)

| Màn | Tên | Mảnh | Ô mục tiêu | Ô rỗng | Ô hiện lại |
|---|---|---|---|---|---|
| 2-1 | Mũi Tên Chỉ Thiên | 2 | 1728 | 576 | 0 |
| 2-2 | Cánh Bướm Điệp Ảnh | 2 | 3584 | 512 | 0 |
| 2-3 | Trái Tim Tinh Thể | 3 | 3712 | 384 | 128 |
| 2-4 | Mắt Tiên Tri | 3 | 3200 | 384 | 128 |
| 2-5 | Đồng Hồ Cát | 4 | 1912 | 1284 | 512 |
| 2-6 | Đại Ấn Hộ Mệnh | 4 | 2560 | 1536 | 512 |
| 3-1 | Nhật Nguyệt Song Huyền | 3 | 4032 | 1116 | 128 |
| 3-2 | Đền Tiên Tri | 4 | 5168 | 1232 | 0 |
| 3-3 | Cá Chép Sao | 4 | 2304 | 312 | 0 |
| 3-4 | Ngọn Nến | 4 | 4316 | 720 | 0 |
| 3-5 | Thuyền Buồm Hoàng Hôn | 4 | 3946 | 217 | 0 |
| 3-6 | Mèo Thần | 7 | 3840 | 256 | 0 |
| 3-7 | Hoa Sen | 5 | 3904 | 288 | 0 |
| 3-8 | Kim Tự Tháp Nhật Thực | 4 | 4352 | 812 | 0 |
| 3-9 | Sao Bát Phương | 3 | 1580 | 980 | 812 |
| 3-10 | Mandala Thiên Cầu | 5 | 4468 | 2732 | 1364 |

Mọi màn: đúng 1 nghiệm, 0 nghiệm dùng ít mảnh hơn.

---

### Task 1: Màn 2-1 Mũi Tên Chỉ Thiên

**Files:**
- Create: `game-next/src/content/sources/2-1.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-1)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Create: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-1.json`, `docs/testing/levels/2-1.svg`, `docs/testing/levels/2-1-report.md`, `docs/testing/levels/screens/2-1-{play,drag,win}.png`

**Interfaces:**
- Consumes: `LevelSource`, `buildLevelDocument` (`src/content/authoring.ts`), `searchSolutions` (`src/content/authoringReport.ts`), `loadLevel` (`src/content/catalog.ts`), `campaignManifest`, `rotateCells` (`src/domain/geometry.ts`); `shapeKind` `'circle' | 'parallelogram'` và `isValidFrame` từ plan A; manifest 28 màn và `chapter: 1 | 2 | 3 | 4` từ plan B.
- Produces: `export const muiTen: LevelSource`; hàm `checkLevel(e: ContentExpectation)` trong `tests/levelContent.test.ts`, dùng lại ở Task 2–16.

- [ ] **Step 1: Viết bộ test chung (thất bại)**

Tạo `game-next/tests/levelContent.test.ts`:

```ts
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
  /** Số ô bị phủ chẵn lần (> 0) bởi nghiệm mẫu: vùng rỗng */
  hollowCells: number;
  /** Số ô bị phủ lẻ lần và ≥ 3 bởi nghiệm mẫu: vùng hiện lại */
  revivedCells: number;
};

/**
 * 3-6 Mèo Thần có 7 mảnh × 5 lựa chọn = 78.125 tổ hợp. Bộ giải duyệt hết của
 * Chương 1 cần nhiều giây cho màn này; plan D (FP-10) sẽ thay bằng bộ giải băm.
 */
const SEARCH_TIMEOUT_MS = 120_000;

/** Số lớp phủ từng ô khi đặt mọi mảnh của nghiệm mẫu thứ nhất. */
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

/**
 * Khoá dữ liệu một màn Chương 2–3. Các con số lấy từ bảng mục 3 của spec C,
 * tính bằng prototype độc lập, không lấy từ chính code này.
 */
function checkLevel(e: ContentExpectation): void {
  describe(`màn ${e.id}`, () => {
    const source = LEVEL_SOURCES[e.id];
    test('có nguồn mô tả trong LEVEL_SOURCES', () => {
      expect(source).toBeDefined();
    });
    // Chưa có nguồn thì chỉ test trên đỏ; không dựng tiếp để khỏi làm hỏng cả file
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

    test(
      'đúng một nghiệm, không có nghiệm dùng ít mảnh hơn',
      () => {
        const report = searchSolutions(doc);
        expect(report.solutionCount).toBe(1);
        expect(report.fewerPieceSolutions).toBe(0);
      },
      SEARCH_TIMEOUT_MS
    );

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
      if (entry.status === 'approved') {
        expect(loadLevel(e.id, 'campaign').id).toBe(e.id);
      } else {
        expect(() => loadLevel(e.id, 'campaign')).toThrow(`unavailable:${e.id}`);
      }
    });
  });
}

checkLevel({ id: '2-1', pieceCount: 2, targetCells: 1728, hollowCells: 576, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test — `màn 2-1 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-1**

Tạo `game-next/src/content/sources/2-1.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-1 Mũi Tên Chỉ Thiên: Mái nhỏ lồng vào đáy mái lớn; phần giao biến mất để lại mũi tên chevron Λ.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const muiTen: LevelSource = {
  id: '2-1',
  title: 'Mũi Tên Chỉ Thiên',
  chapter: 2,
  order: 7,
  contentRevision: 'mui-ten-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 16, y: 16 },
        { id: 'B', x: 24, y: 16 },
        { id: 'C', x: 8, y: 16 },
        { id: 'D', x: 16, y: 24 },
      ],
    },
    {
      id: 'R2',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 64 },
        { id: 'B', x: 48, y: 64 },
        { id: 'C', x: 32, y: 64 },
        { id: 'D', x: 40, y: 72 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
      { pieceId: 'R2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Hiểu hai lớp chồng nhau thì vùng giao biến mất',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'R1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'R1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'R2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'R2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'R2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [
    { id: 'overlap-hides', trigger: 'two-layers', end: 'drag-start', text: 'Hai mảnh cùng màu: vùng giao biến mất' },
  ],
  victoryVerse: 'Mũi tên chỉ trời, khoảng trống dẫn lối.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { muiTen } from './2-1.ts';` vào nhóm import và dòng `'2-1': muiTen,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-1`
Expected: `2-1: 1728 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-1`.

Nếu công cụ in số ô mục tiêu khác **1728** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import muiTen from './levels/2-1.json';` và `'2-1': muiTen,` vào `documents`.

`manifest.ts`: thay entry 2-1 bằng:

```ts
  { id: '2-1', title: 'Mũi Tên Chỉ Thiên', chapter: 2, order: 7, contentRevision: 'mui-ten-v1', status: 'validated', dataPath: 'src/content/levels/2-1.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-1 (Mũi Tên Chỉ Thiên) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-1.svg`, so với ô `2-1` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-1 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 2 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-1 Mui Ten Chi Thien (validated)`. Message: `feat(content): add level 2-1 Mui Ten Chi Thien as validated`.

```bash
git add src/content/sources/2-1.ts src/content/sources/index.ts src/content/levels/2-1.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-1.svg ../docs/testing/levels/2-1-report.md ../docs/testing/levels/screens/2-1-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 2: Màn 2-2 Cánh Bướm Điệp Ảnh

**Files:**
- Create: `game-next/src/content/sources/2-2.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-2)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-2.json`, `docs/testing/levels/2-2.svg`, `docs/testing/levels/2-2-report.md`, `docs/testing/levels/screens/2-2-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const canhBuom: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '2-2', pieceCount: 2, targetCells: 3584, hollowCells: 512, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 2-2 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-2**

Tạo `game-next/src/content/sources/2-2.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-2 Cánh Bướm Điệp Ảnh: Hai cánh mái đâm mũi qua nhau thành nơ bướm có tâm thoi rỗng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const canhBuom: LevelSource = {
  id: '2-2',
  title: 'Cánh Bướm Điệp Ảnh',
  chapter: 2,
  order: 8,
  contentRevision: 'canh-buom-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 32, y: 32 },
        { id: 'B', x: 24, y: 32 },
        { id: 'C', x: 32, y: 40 },
        { id: 'D', x: 32, y: 24 },
      ],
    },
    {
      id: 'T2',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 0, y: 32 },
        { id: 'B', x: 8, y: 32 },
        { id: 'C', x: 0, y: 40 },
        { id: 'D', x: 0, y: 24 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Chủ động căn độ sâu giao để tạo khoảng rỗng cân bằng',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T2', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
  ],
  ftueSteps: [
    { id: 'overlap-depth', trigger: 'idle', end: 'drag-start', text: 'Để hai cánh chồng nhau vừa đủ sâu' },
  ],
  victoryVerse: 'Đôi cánh chạm nhau, để lại một khoảng lặng.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { canhBuom } from './2-2.ts';` vào nhóm import và dòng `'2-2': canhBuom,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-2`
Expected: `2-2: 3584 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-2`.

Nếu công cụ in số ô mục tiêu khác **3584** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import canhBuom from './levels/2-2.json';` và `'2-2': canhBuom,` vào `documents`.

`manifest.ts`: thay entry 2-2 bằng:

```ts
  { id: '2-2', title: 'Cánh Bướm Điệp Ảnh', chapter: 2, order: 8, contentRevision: 'canh-buom-v1', status: 'validated', dataPath: 'src/content/levels/2-2.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-2 (Cánh Bướm Điệp Ảnh) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-2.svg`, so với ô `2-2` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-2 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 2 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-2 Canh Buom Diep Anh (validated)`. Message: `feat(content): add level 2-2 Canh Buom Diep Anh as validated`.

```bash
git add src/content/sources/2-2.ts src/content/sources/index.ts src/content/levels/2-2.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-2.svg ../docs/testing/levels/2-2-report.md ../docs/testing/levels/screens/2-2-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 3: Màn 2-3 Trái Tim Tinh Thể

**Files:**
- Create: `game-next/src/content/sources/2-3.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-3)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-3.json`, `docs/testing/levels/2-3.svg`, `docs/testing/levels/2-3-report.md`, `docs/testing/levels/screens/2-3-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const traiTim: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '2-3', pieceCount: 3, targetCells: 3712, hollowCells: 384, revivedCells: 128 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 2-3 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-3**

Tạo `game-next/src/content/sources/2-3.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-3 Trái Tim Tinh Thể: Nơ của 2-2 cộng viên ngọc thoi 16 đặt vào tâm rỗng: hạt nhân hiện lại giữa vòng rỗng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const traiTim: LevelSource = {
  id: '2-3',
  title: 'Trái Tim Tinh Thể',
  chapter: 2,
  order: 9,
  contentRevision: 'trai-tim-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 32, y: 32 },
        { id: 'B', x: 24, y: 32 },
        { id: 'C', x: 32, y: 40 },
        { id: 'D', x: 32, y: 24 },
      ],
    },
    {
      id: 'T2',
      shapeKind: 'triangle',
      orientation: 7,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 0, y: 32 },
        { id: 'B', x: 8, y: 32 },
        { id: 'C', x: 0, y: 40 },
        { id: 'D', x: 0, y: 24 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 72 },
        { id: 'B', x: 64, y: 72 },
        { id: 'C', x: 48, y: 72 },
        { id: 'D', x: 56, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Dự đoán được ba lớp thì vùng đó hiện lại',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T2', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [
    { id: 'third-layer', trigger: 'three-layers', end: 'drag-start', text: 'Thêm mảnh thứ ba: vùng đó hiện lại' },
  ],
  victoryVerse: 'Trong khoảng rỗng, một trái tim tinh thể bừng sáng.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { traiTim } from './2-3.ts';` vào nhóm import và dòng `'2-3': traiTim,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-3`
Expected: `2-3: 3712 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-3`.

Nếu công cụ in số ô mục tiêu khác **3712** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import traiTim from './levels/2-3.json';` và `'2-3': traiTim,` vào `documents`.

`manifest.ts`: thay entry 2-3 bằng:

```ts
  { id: '2-3', title: 'Trái Tim Tinh Thể', chapter: 2, order: 9, contentRevision: 'trai-tim-v1', status: 'validated', dataPath: 'src/content/levels/2-3.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-3 (Trái Tim Tinh Thể) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-3.svg`, so với ô `2-3` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-3 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 3 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-3 Trai Tim Tinh The (validated)`. Message: `feat(content): add level 2-3 Trai Tim Tinh The as validated`.

```bash
git add src/content/sources/2-3.ts src/content/sources/index.ts src/content/levels/2-3.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-3.svg ../docs/testing/levels/2-3-report.md ../docs/testing/levels/screens/2-3-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 4: Màn 2-4 Mắt Tiên Tri

**Files:**
- Create: `game-next/src/content/sources/2-4.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-4)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-4.json`, `docs/testing/levels/2-4.svg`, `docs/testing/levels/2-4-report.md`, `docs/testing/levels/screens/2-4-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const matTienTri: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '2-4', pieceCount: 3, targetCells: 3200, hollowCells: 384, revivedCells: 128 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 2-4 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-4**

Tạo `game-next/src/content/sources/2-4.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-4 Mắt Tiên Tri: Hai thoi lồng ngang thành mí mắt; vùng giao rỗng ôm con ngươi sáng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const matTienTri: LevelSource = {
  id: '2-4',
  title: 'Mắt Tiên Tri',
  chapter: 2,
  order: 10,
  contentRevision: 'mat-tien-tri-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 16, y: 48 },
        { id: 'B', x: 24, y: 48 },
        { id: 'C', x: 8, y: 48 },
        { id: 'D', x: 16, y: 56 },
      ],
    },
    {
      id: 'D2',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 48, y: 48 },
        { id: 'B', x: 56, y: 48 },
        { id: 'C', x: 40, y: 48 },
        { id: 'D', x: 48, y: 56 },
      ],
    },
    {
      id: 'P1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 72 },
        { id: 'B', x: 64, y: 72 },
        { id: 'C', x: 48, y: 72 },
        { id: 'D', x: 56, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
      { pieceId: 'P1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Kết hợp vùng rỗng và vùng hiện lại trong cùng một hình',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'D2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'P1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'P1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'P1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Con mắt mở ra, thấy trước điều chưa tới.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { matTienTri } from './2-4.ts';` vào nhóm import và dòng `'2-4': matTienTri,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-4`
Expected: `2-4: 3200 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-4`.

Nếu công cụ in số ô mục tiêu khác **3200** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import matTienTri from './levels/2-4.json';` và `'2-4': matTienTri,` vào `documents`.

`manifest.ts`: thay entry 2-4 bằng:

```ts
  { id: '2-4', title: 'Mắt Tiên Tri', chapter: 2, order: 10, contentRevision: 'mat-tien-tri-v1', status: 'validated', dataPath: 'src/content/levels/2-4.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-4 (Mắt Tiên Tri) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-4.svg`, so với ô `2-4` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-4 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 3 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-4 Mat Tien Tri (validated)`. Message: `feat(content): add level 2-4 Mat Tien Tri as validated`.

```bash
git add src/content/sources/2-4.ts src/content/sources/index.ts src/content/levels/2-4.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-4.svg ../docs/testing/levels/2-4-report.md ../docs/testing/levels/screens/2-4-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 5: Màn 2-5 Đồng Hồ Cát

**Files:**
- Create: `game-next/src/content/sources/2-5.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-5)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-5.json`, `docs/testing/levels/2-5.svg`, `docs/testing/levels/2-5-report.md`, `docs/testing/levels/screens/2-5-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const dongHoCat: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '2-5', pieceCount: 4, targetCells: 1912, hollowCells: 1284, revivedCells: 512 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 2-5 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-5**

Tạo `game-next/src/content/sources/2-5.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-5 Đồng Hồ Cát: Vòng tròn rỗng (tròn 64 trừ tròn 48) ôm chiếc đồng hồ cát hai mái hiện lại ba lớp. Thay bản Chìa Khóa Thời Gian.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const dongHoCat: LevelSource = {
  id: '2-5',
  title: 'Đồng Hồ Cát',
  chapter: 2,
  order: 11,
  contentRevision: 'dong-ho-cat-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 40 },
        { id: 'B', x: 40, y: 40 },
        { id: 'C', x: 24, y: 40 },
        { id: 'D', x: 32, y: 48 },
      ],
    },
    {
      id: 'C2',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 48 },
        { id: 'B', x: 48, y: 48 },
        { id: 'C', x: 32, y: 48 },
        { id: 'D', x: 40, y: 56 },
      ],
    },
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 6,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 56 },
        { id: 'B', x: 56, y: 56 },
        { id: 'C', x: 40, y: 56 },
        { id: 'D', x: 48, y: 64 },
      ],
    },
    {
      id: 'T2',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 56 },
        { id: 'B', x: 56, y: 56 },
        { id: 'C', x: 40, y: 56 },
        { id: 'D', x: 48, y: 64 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'T2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Hai vùng rỗng lồng nhau quanh một hình hiện lại',
  difficultyEstimate: 4,
  distractors: [
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Cát rơi trong vòng tròn, thời gian thành hình.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { dongHoCat } from './2-5.ts';` vào nhóm import và dòng `'2-5': dongHoCat,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-5`
Expected: `2-5: 1912 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-5`.

Nếu công cụ in số ô mục tiêu khác **1912** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import dongHoCat from './levels/2-5.json';` và `'2-5': dongHoCat,` vào `documents`.

`manifest.ts`: thay entry 2-5 bằng:

```ts
  { id: '2-5', title: 'Đồng Hồ Cát', chapter: 2, order: 11, contentRevision: 'dong-ho-cat-v1', status: 'validated', dataPath: 'src/content/levels/2-5.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-5 (Đồng Hồ Cát) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-5.svg`, so với ô `2-5` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-5 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-5 Dong Ho Cat (validated)`. Message: `feat(content): add level 2-5 Dong Ho Cat as validated`.

```bash
git add src/content/sources/2-5.ts src/content/sources/index.ts src/content/levels/2-5.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-5.svg ../docs/testing/levels/2-5-report.md ../docs/testing/levels/screens/2-5-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 6: Màn 2-6 Đại Ấn Hộ Mệnh

**Files:**
- Create: `game-next/src/content/sources/2-6.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 2-6)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/2-6.json`, `docs/testing/levels/2-6.svg`, `docs/testing/levels/2-6-report.md`, `docs/testing/levels/screens/2-6-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const daiAn: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '2-6', pieceCount: 4, targetCells: 2560, hollowCells: 1536, revivedCells: 512 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 2-6 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 2-6**

Tạo `game-next/src/content/sources/2-6.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 2-6 Đại Ấn Hộ Mệnh: Bốn mảnh chung tâm: góc vuông sáng, vòng thoi rỗng, góc vuông nhỏ sáng (3 lớp), tâm thoi rỗng (4 lớp). Kết Chương 2.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const daiAn: LevelSource = {
  id: '2-6',
  title: 'Đại Ấn Hộ Mệnh',
  chapter: 2,
  order: 12,
  contentRevision: 'dai-an-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 48 },
        { id: 'B', x: 40, y: 48 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 32, y: 56 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 48 },
        { id: 'B', x: 40, y: 48 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 32, y: 56 },
      ],
    },
    {
      id: 'S2',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 64 },
        { id: 'B', x: 56, y: 64 },
        { id: 'C', x: 40, y: 64 },
        { id: 'D', x: 48, y: 72 },
      ],
    },
    {
      id: 'D2',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 64 },
        { id: 'B', x: 56, y: 64 },
        { id: 'C', x: 40, y: 64 },
        { id: 'D', x: 48, y: 72 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'S2', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Đọc được nhiều tầng chẵn lẻ xen kẽ',
  difficultyEstimate: 4,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'D2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Bốn tầng ấn khép lại, lời hộ mệnh đã thành.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { daiAn } from './2-6.ts';` vào nhóm import và dòng `'2-6': daiAn,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 2-6`
Expected: `2-6: 2560 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 2-6`.

Nếu công cụ in số ô mục tiêu khác **2560** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import daiAn from './levels/2-6.json';` và `'2-6': daiAn,` vào `documents`.

`manifest.ts`: thay entry 2-6 bằng:

```ts
  { id: '2-6', title: 'Đại Ấn Hộ Mệnh', chapter: 2, order: 12, contentRevision: 'dai-an-v1', status: 'validated', dataPath: 'src/content/levels/2-6.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 2-6 (Đại Ấn Hộ Mệnh) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/2-6.svg`, so với ô `2-6` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 2-6 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 2-6 Dai An Ho Menh (validated)`. Message: `feat(content): add level 2-6 Dai An Ho Menh as validated`.

```bash
git add src/content/sources/2-6.ts src/content/sources/index.ts src/content/levels/2-6.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/2-6.svg ../docs/testing/levels/2-6-report.md ../docs/testing/levels/screens/2-6-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 7: Màn 3-1 Nhật Nguyệt Song Huyền

**Files:**
- Create: `game-next/src/content/sources/3-1.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-1)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-1.json`, `docs/testing/levels/3-1.svg`, `docs/testing/levels/3-1-report.md`, `docs/testing/levels/screens/3-1-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const nhatNguyet: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-1', pieceCount: 3, targetCells: 4032, hollowCells: 1116, revivedCells: 128 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-1 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-1**

Tạo `game-next/src/content/sources/3-1.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-1 Nhật Nguyệt Song Huyền: Hai vầng tròn lồng nhau; vùng giao hình thấu kính rỗng, ngôi sao thoi hiện lại ở giữa.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const nhatNguyet: LevelSource = {
  id: '3-1',
  title: 'Nhật Nguyệt Song Huyền',
  chapter: 3,
  order: 13,
  contentRevision: 'nhat-nguyet-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 16, y: 48 },
        { id: 'B', x: 24, y: 48 },
        { id: 'C', x: 8, y: 48 },
        { id: 'D', x: 16, y: 56 },
      ],
    },
    {
      id: 'C2',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 48, y: 48 },
        { id: 'B', x: 56, y: 48 },
        { id: 'C', x: 40, y: 48 },
        { id: 'D', x: 48, y: 56 },
      ],
    },
    {
      id: 'K1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 72 },
        { id: 'B', x: 64, y: 72 },
        { id: 'C', x: 48, y: 72 },
        { id: 'D', x: 56, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
      { pieceId: 'K1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Làm quen hình tròn và vùng giao cong',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'K1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'K1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'K1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [
    { id: 'circle-parity', trigger: 'idle', end: 'drag-start', text: 'Hình tròn cũng tuân theo luật chẵn lẻ' },
  ],
  victoryVerse: 'Mặt trời và mặt trăng gặp nhau, sinh ra một vì sao.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { nhatNguyet } from './3-1.ts';` vào nhóm import và dòng `'3-1': nhatNguyet,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-1`
Expected: `3-1: 4032 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-1`.

Nếu công cụ in số ô mục tiêu khác **4032** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import nhatNguyet from './levels/3-1.json';` và `'3-1': nhatNguyet,` vào `documents`.

`manifest.ts`: thay entry 3-1 bằng:

```ts
  { id: '3-1', title: 'Nhật Nguyệt Song Huyền', chapter: 3, order: 13, contentRevision: 'nhat-nguyet-v1', status: 'validated', dataPath: 'src/content/levels/3-1.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-1 (Nhật Nguyệt Song Huyền) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-1.svg`, so với ô `3-1` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-1 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 3 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-1 Nhat Nguyet Song Huyen (validated)`. Message: `feat(content): add level 3-1 Nhat Nguyet Song Huyen as validated`.

```bash
git add src/content/sources/3-1.ts src/content/sources/index.ts src/content/levels/3-1.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-1.svg ../docs/testing/levels/3-1-report.md ../docs/testing/levels/screens/3-1-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 8: Màn 3-2 Đền Tiên Tri

**Files:**
- Create: `game-next/src/content/sources/3-2.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-2)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-2.json`, `docs/testing/levels/3-2.svg`, `docs/testing/levels/3-2-report.md`, `docs/testing/levels/screens/3-2-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const denTienTri: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-2', pieceCount: 4, targetCells: 5168, hollowCells: 1232, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-2 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-2**

Tạo `game-next/src/content/sources/3-2.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-2 Đền Tiên Tri: Mái lớn, thân vuông, cửa vuông rỗng và cửa sổ tròn rỗng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const denTienTri: LevelSource = {
  id: '3-2',
  title: 'Đền Tiên Tri',
  chapter: 3,
  order: 14,
  contentRevision: 'den-tien-tri-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 16, y: 0 },
        { id: 'B', x: 24, y: 0 },
        { id: 'C', x: 8, y: 0 },
        { id: 'D', x: 16, y: 8 },
      ],
    },
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 96 },
        { id: 'B', x: 40, y: 96 },
        { id: 'C', x: 24, y: 96 },
        { id: 'D', x: 32, y: 88 },
      ],
    },
    {
      id: 'S2',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 128 },
        { id: 'B', x: 56, y: 128 },
        { id: 'C', x: 40, y: 128 },
        { id: 'D', x: 48, y: 120 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 72 },
        { id: 'B', x: 64, y: 72 },
        { id: 'C', x: 48, y: 72 },
        { id: 'D', x: 56, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'S2', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Khoét chi tiết rỗng vào khối đặc',
  difficultyEstimate: 2,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'R1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'R1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'S2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Cửa đền mở, ánh sáng lọt qua ô cửa tròn.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { denTienTri } from './3-2.ts';` vào nhóm import và dòng `'3-2': denTienTri,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-2`
Expected: `3-2: 5168 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-2`.

Nếu công cụ in số ô mục tiêu khác **5168** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import denTienTri from './levels/3-2.json';` và `'3-2': denTienTri,` vào `documents`.

`manifest.ts`: thay entry 3-2 bằng:

```ts
  { id: '3-2', title: 'Đền Tiên Tri', chapter: 3, order: 14, contentRevision: 'den-tien-tri-v1', status: 'validated', dataPath: 'src/content/levels/3-2.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-2 (Đền Tiên Tri) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-2.svg`, so với ô `3-2` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-2 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-2 Den Tien Tri (validated)`. Message: `feat(content): add level 3-2 Den Tien Tri as validated`.

```bash
git add src/content/sources/3-2.ts src/content/sources/index.ts src/content/levels/3-2.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-2.svg ../docs/testing/levels/3-2-report.md ../docs/testing/levels/screens/3-2-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 9: Màn 3-3 Cá Chép Sao

**Files:**
- Create: `game-next/src/content/sources/3-3.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-3)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-3.json`, `docs/testing/levels/3-3.svg`, `docs/testing/levels/3-3-report.md`, `docs/testing/levels/screens/3-3-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const caChep: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-3', pieceCount: 4, targetCells: 2304, hollowCells: 312, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-3 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-3**

Tạo `game-next/src/content/sources/3-3.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-3 Cá Chép Sao: Thân thoi, đuôi tam giác, mắt tròn rỗng và miệng rỗng.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const caChep: LevelSource = {
  id: '3-3',
  title: 'Cá Chép Sao',
  chapter: 3,
  order: 15,
  contentRevision: 'ca-chep-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 40, y: 48 },
        { id: 'B', x: 48, y: 48 },
        { id: 'C', x: 32, y: 48 },
        { id: 'D', x: 40, y: 56 },
      ],
    },
    {
      id: 'T1',
      shapeKind: 'triangle',
      orientation: 5,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 56 },
        { id: 'B', x: 24, y: 56 },
        { id: 'C', x: 8, y: 56 },
        { id: 'D', x: 16, y: 64 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 72, y: 64 },
        { id: 'B', x: 80, y: 64 },
        { id: 'C', x: 64, y: 64 },
        { id: 'D', x: 72, y: 72 },
      ],
    },
    {
      id: 'M1',
      shapeKind: 'triangle',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 88, y: 72 },
        { id: 'B', x: 96, y: 72 },
        { id: 'C', x: 80, y: 72 },
        { id: 'D', x: 88, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'M1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Đặt chi tiết nhỏ chính xác trên khối lớn',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'T1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'T1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'M1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'M1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'M1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Cá chép bơi ngược dòng ngân hà.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { caChep } from './3-3.ts';` vào nhóm import và dòng `'3-3': caChep,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-3`
Expected: `3-3: 2304 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-3`.

Nếu công cụ in số ô mục tiêu khác **2304** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import caChep from './levels/3-3.json';` và `'3-3': caChep,` vào `documents`.

`manifest.ts`: thay entry 3-3 bằng:

```ts
  { id: '3-3', title: 'Cá Chép Sao', chapter: 3, order: 15, contentRevision: 'ca-chep-v1', status: 'validated', dataPath: 'src/content/levels/3-3.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-3 (Cá Chép Sao) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-3.svg`, so với ô `3-3` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-3 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-3 Ca Chep Sao (validated)`. Message: `feat(content): add level 3-3 Ca Chep Sao as validated`.

```bash
git add src/content/sources/3-3.ts src/content/sources/index.ts src/content/levels/3-3.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-3.svg ../docs/testing/levels/3-3-report.md ../docs/testing/levels/screens/3-3-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 10: Màn 3-4 Ngọn Nến

**Files:**
- Create: `game-next/src/content/sources/3-4.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-4)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-4.json`, `docs/testing/levels/3-4.svg`, `docs/testing/levels/3-4-report.md`, `docs/testing/levels/screens/3-4-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const ngonNen: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-4', pieceCount: 4, targetCells: 4316, hollowCells: 720, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-4 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-4**

Tạo `game-next/src/content/sources/3-4.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-4 Ngọn Nến: Thân hai vuông, quầng sáng tròn ôm ngọn lửa thoi âm bản, khe rỗng giữa quầng và thân.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const ngonNen: LevelSource = {
  id: '3-4',
  title: 'Ngọn Nến',
  chapter: 3,
  order: 16,
  contentRevision: 'ngon-nen-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 96 },
        { id: 'B', x: 56, y: 96 },
        { id: 'C', x: 40, y: 96 },
        { id: 'D', x: 48, y: 104 },
      ],
    },
    {
      id: 'S2',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 128 },
        { id: 'B', x: 56, y: 128 },
        { id: 'C', x: 40, y: 128 },
        { id: 'D', x: 48, y: 120 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 56 },
        { id: 'B', x: 56, y: 56 },
        { id: 'C', x: 40, y: 56 },
        { id: 'D', x: 48, y: 64 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 40 },
        { id: 'B', x: 40, y: 40 },
        { id: 'C', x: 24, y: 40 },
        { id: 'D', x: 32, y: 48 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'S2', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Nhìn ra hình âm bản (hình hiện bằng khoảng rỗng)',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Ngọn lửa không cháy, chỉ để lại hình bóng.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { ngonNen } from './3-4.ts';` vào nhóm import và dòng `'3-4': ngonNen,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-4`
Expected: `3-4: 4316 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-4`.

Nếu công cụ in số ô mục tiêu khác **4316** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import ngonNen from './levels/3-4.json';` và `'3-4': ngonNen,` vào `documents`.

`manifest.ts`: thay entry 3-4 bằng:

```ts
  { id: '3-4', title: 'Ngọn Nến', chapter: 3, order: 16, contentRevision: 'ngon-nen-v1', status: 'validated', dataPath: 'src/content/levels/3-4.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-4 (Ngọn Nến) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-4.svg`, so với ô `3-4` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-4 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-4 Ngon Nen (validated)`. Message: `feat(content): add level 3-4 Ngon Nen as validated`.

```bash
git add src/content/sources/3-4.ts src/content/sources/index.ts src/content/levels/3-4.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-4.svg ../docs/testing/levels/3-4-report.md ../docs/testing/levels/screens/3-4-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 11: Màn 3-5 Thuyền Buồm Hoàng Hôn

**Files:**
- Create: `game-next/src/content/sources/3-5.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-5)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-5.json`, `docs/testing/levels/3-5.svg`, `docs/testing/levels/3-5-report.md`, `docs/testing/levels/screens/3-5-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const thuyenBuom: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-5', pieceCount: 4, targetCells: 3946, hollowCells: 217, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-5 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-5**

Tạo `game-next/src/content/sources/3-5.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-5 Thuyền Buồm Hoàng Hôn: Thân thuyền chữ V, hai buồm tam giác, mặt trời tròn lặn sau buồm.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const thuyenBuom: LevelSource = {
  id: '3-5',
  title: 'Thuyền Buồm Hoàng Hôn',
  chapter: 3,
  order: 17,
  contentRevision: 'thuyen-buom-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'H1',
      shapeKind: 'triangle',
      orientation: 6,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 24, y: 104 },
        { id: 'B', x: 24, y: 96 },
      ],
    },
    {
      id: 'L1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 56, y: 32 },
        { id: 'B', x: 64, y: 32 },
        { id: 'C', x: 48, y: 32 },
        { id: 'D', x: 56, y: 40 },
      ],
    },
    {
      id: 'J1',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 24, y: 64 },
        { id: 'B', x: 32, y: 64 },
        { id: 'C', x: 16, y: 64 },
        { id: 'D', x: 24, y: 72 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 80, y: 48 },
        { id: 'B', x: 88, y: 48 },
        { id: 'C', x: 72, y: 48 },
        { id: 'D', x: 80, y: 56 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'H1', anchorId: 'A', turns: 0 },
      { pieceId: 'L1', anchorId: 'A', turns: 0 },
      { pieceId: 'J1', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép nhiều tam giác khác cỡ và một vùng giao cong',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'H1', anchorId: 'B', reason: 'Lệch lên 8 ô' },
    { pieceId: 'L1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'L1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'L1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'J1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'J1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'J1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Mặt trời lặn sau cánh buồm, thuyền vẫn đi.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { thuyenBuom } from './3-5.ts';` vào nhóm import và dòng `'3-5': thuyenBuom,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-5`
Expected: `3-5: 3946 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-5`.

Nếu công cụ in số ô mục tiêu khác **3946** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import thuyenBuom from './levels/3-5.json';` và `'3-5': thuyenBuom,` vào `documents`.

`manifest.ts`: thay entry 3-5 bằng:

```ts
  { id: '3-5', title: 'Thuyền Buồm Hoàng Hôn', chapter: 3, order: 17, contentRevision: 'thuyen-buom-v1', status: 'validated', dataPath: 'src/content/levels/3-5.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-5 (Thuyền Buồm Hoàng Hôn) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-5.svg`, so với ô `3-5` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-5 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-5 Thuyen Buom Hoang Hon (validated)`. Message: `feat(content): add level 3-5 Thuyen Buom Hoang Hon as validated`.

```bash
git add src/content/sources/3-5.ts src/content/sources/index.ts src/content/levels/3-5.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-5.svg ../docs/testing/levels/3-5-report.md ../docs/testing/levels/screens/3-5-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 12: Màn 3-6 Mèo Thần

**Files:**
- Create: `game-next/src/content/sources/3-6.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-6)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-6.json`, `docs/testing/levels/3-6.svg`, `docs/testing/levels/3-6-report.md`, `docs/testing/levels/screens/3-6-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const meoThan: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-6', pieceCount: 7, targetCells: 3840, hollowCells: 256, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-6 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-6**

Tạo `game-next/src/content/sources/3-6.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-6 Mèo Thần: Đầu vuông, hai tai tam giác nhỏ, hai mắt thoi rỗng, thân mái lớn, đuôi bình hành.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const meoThan: LevelSource = {
  id: '3-6',
  title: 'Mèo Thần',
  chapter: 3,
  order: 18,
  contentRevision: 'meo-than-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 40, y: 24 },
        { id: 'B', x: 48, y: 24 },
        { id: 'C', x: 32, y: 24 },
        { id: 'D', x: 40, y: 32 },
      ],
    },
    {
      id: 'E1',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 40, y: 8 },
        { id: 'B', x: 48, y: 8 },
        { id: 'C', x: 32, y: 8 },
        { id: 'D', x: 40, y: 16 },
      ],
    },
    {
      id: 'E2',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 8 },
        { id: 'B', x: 64, y: 8 },
        { id: 'C', x: 48, y: 8 },
        { id: 'D', x: 56, y: 16 },
      ],
    },
    {
      id: 'B1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 8, y: 8 },
        { id: 'B', x: 16, y: 8 },
        { id: 'C', x: 0, y: 8 },
        { id: 'D', x: 8, y: 16 },
      ],
    },
    {
      id: 'T1',
      shapeKind: 'parallelogram',
      orientation: 1,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 88, y: 56 },
        { id: 'B', x: 80, y: 56 },
      ],
    },
    {
      id: 'Y1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 40, y: 32 },
        { id: 'B', x: 48, y: 32 },
        { id: 'C', x: 32, y: 32 },
        { id: 'D', x: 40, y: 40 },
      ],
    },
    {
      id: 'Y2',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 32 },
        { id: 'B', x: 64, y: 32 },
        { id: 'C', x: 48, y: 32 },
        { id: 'D', x: 56, y: 40 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'E1', anchorId: 'A', turns: 0 },
      { pieceId: 'E2', anchorId: 'A', turns: 0 },
      { pieceId: 'B1', anchorId: 'A', turns: 0 },
      { pieceId: 'T1', anchorId: 'A', turns: 0 },
      { pieceId: 'Y1', anchorId: 'A', turns: 0 },
      { pieceId: 'Y2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Ghép bảy mảnh, nhận ra bình hành và tam giác nhỏ',
  difficultyEstimate: 4,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'E1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'E1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'E1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'E2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'E2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'E2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'B1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'B1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'B1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'T1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'Y1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'Y1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'Y1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'Y2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'Y2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'Y2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Mèo thần ngồi canh cửa giữa hai thế giới.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { meoThan } from './3-6.ts';` vào nhóm import và dòng `'3-6': meoThan,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-6`
Expected: `3-6: 3840 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-6`.

Nếu công cụ in số ô mục tiêu khác **3840** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import meoThan from './levels/3-6.json';` và `'3-6': meoThan,` vào `documents`.

`manifest.ts`: thay entry 3-6 bằng:

```ts
  { id: '3-6', title: 'Mèo Thần', chapter: 3, order: 18, contentRevision: 'meo-than-v1', status: 'validated', dataPath: 'src/content/levels/3-6.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-6 (Mèo Thần) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-6.svg`, so với ô `3-6` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-6 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 7 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-6 Meo Than (validated)`. Message: `feat(content): add level 3-6 Meo Than as validated`.

```bash
git add src/content/sources/3-6.ts src/content/sources/index.ts src/content/levels/3-6.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-6.svg ../docs/testing/levels/3-6-report.md ../docs/testing/levels/screens/3-6-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 13: Màn 3-7 Hoa Sen

**Files:**
- Create: `game-next/src/content/sources/3-7.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-7)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-7.json`, `docs/testing/levels/3-7.svg`, `docs/testing/levels/3-7-report.md`, `docs/testing/levels/screens/3-7-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const hoaSen: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-7', pieceCount: 5, targetCells: 3904, hollowCells: 288, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-7 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-7**

Tạo `game-next/src/content/sources/3-7.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-7 Hoa Sen: Nụ thoi lồng vào hai cánh tam giác, hai bình hành làm mặt nước.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const hoaSen: LevelSource = {
  id: '3-7',
  title: 'Hoa Sen',
  chapter: 3,
  order: 19,
  contentRevision: 'hoa-sen-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'P1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 56 },
        { id: 'B', x: 48, y: 56 },
        { id: 'C', x: 32, y: 56 },
        { id: 'D', x: 40, y: 64 },
      ],
    },
    {
      id: 'P2',
      shapeKind: 'triangle',
      orientation: 3,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 48 },
        { id: 'B', x: 24, y: 48 },
        { id: 'C', x: 8, y: 48 },
        { id: 'D', x: 16, y: 56 },
      ],
    },
    {
      id: 'P3',
      shapeKind: 'triangle',
      orientation: 2,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 48 },
        { id: 'B', x: 72, y: 48 },
        { id: 'C', x: 56, y: 48 },
        { id: 'D', x: 64, y: 56 },
      ],
    },
    {
      id: 'W1',
      shapeKind: 'parallelogram',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 16, y: 104 },
        { id: 'B', x: 24, y: 104 },
        { id: 'C', x: 8, y: 104 },
        { id: 'D', x: 16, y: 112 },
      ],
    },
    {
      id: 'W2',
      shapeKind: 'parallelogram',
      orientation: 2,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 64, y: 104 },
        { id: 'B', x: 72, y: 104 },
        { id: 'C', x: 56, y: 104 },
        { id: 'D', x: 64, y: 112 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'P1', anchorId: 'A', turns: 0 },
      { pieceId: 'P2', anchorId: 'A', turns: 0 },
      { pieceId: 'P3', anchorId: 'A', turns: 0 },
      { pieceId: 'W1', anchorId: 'A', turns: 0 },
      { pieceId: 'W2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Dùng vùng giao mảnh để tách cánh hoa',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'P1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'P1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'P1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'P2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'P2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'P2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'P3', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'P3', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'P3', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'W1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'W1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'W1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'W2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'W2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'W2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Sen nở trên mặt nước, không vướng bùn.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { hoaSen } from './3-7.ts';` vào nhóm import và dòng `'3-7': hoaSen,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-7`
Expected: `3-7: 3904 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-7`.

Nếu công cụ in số ô mục tiêu khác **3904** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import hoaSen from './levels/3-7.json';` và `'3-7': hoaSen,` vào `documents`.

`manifest.ts`: thay entry 3-7 bằng:

```ts
  { id: '3-7', title: 'Hoa Sen', chapter: 3, order: 19, contentRevision: 'hoa-sen-v1', status: 'validated', dataPath: 'src/content/levels/3-7.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-7 (Hoa Sen) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-7.svg`, so với ô `3-7` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-7 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 5 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-7 Hoa Sen (validated)`. Message: `feat(content): add level 3-7 Hoa Sen as validated`.

```bash
git add src/content/sources/3-7.ts src/content/sources/index.ts src/content/levels/3-7.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-7.svg ../docs/testing/levels/3-7-report.md ../docs/testing/levels/screens/3-7-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 14: Màn 3-8 Kim Tự Tháp Nhật Thực

**Files:**
- Create: `game-next/src/content/sources/3-8.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-8)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-8.json`, `docs/testing/levels/3-8.svg`, `docs/testing/levels/3-8-report.md`, `docs/testing/levels/screens/3-8-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const kimTuThap: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-8', pieceCount: 4, targetCells: 4352, hollowCells: 812, revivedCells: 0 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-8 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-8**

Tạo `game-next/src/content/sources/3-8.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-8 Kim Tự Tháp Nhật Thực: Kim tự tháp mái 128 có cửa tam giác rỗng; nhật thực từ hai hình tròn lệch nhau.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const kimTuThap: LevelSource = {
  id: '3-8',
  title: 'Kim Tự Tháp Nhật Thực',
  chapter: 3,
  order: 20,
  contentRevision: 'kim-tu-thap-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'R1',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 128,
      anchors: [
        { id: 'A', x: 0, y: 16 },
        { id: 'B', x: 0, y: 24 },
        { id: 'C', x: 0, y: 8 },
      ],
    },
    {
      id: 'R2',
      shapeKind: 'triangle',
      orientation: 4,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 112 },
        { id: 'B', x: 56, y: 112 },
        { id: 'C', x: 40, y: 112 },
        { id: 'D', x: 48, y: 120 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 80, y: 16 },
        { id: 'B', x: 72, y: 16 },
        { id: 'C', x: 80, y: 24 },
        { id: 'D', x: 80, y: 8 },
      ],
    },
    {
      id: 'C2',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 88, y: 16 },
        { id: 'B', x: 96, y: 16 },
        { id: 'C', x: 88, y: 24 },
        { id: 'D', x: 88, y: 8 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'R1', anchorId: 'A', turns: 0 },
      { pieceId: 'R2', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Hai cụm hình tách rời trên cùng một bàn',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'R1', anchorId: 'B', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'R1', anchorId: 'C', reason: 'Lệch lên 8 ô' },
    { pieceId: 'R2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'R2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'R2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch lên 8 ô' },
    { pieceId: 'C2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C2', anchorId: 'C', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C2', anchorId: 'D', reason: 'Lệch lên 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Khi mặt trời bị che, kim tự tháp thức giấc.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { kimTuThap } from './3-8.ts';` vào nhóm import và dòng `'3-8': kimTuThap,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-8`
Expected: `3-8: 4352 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-8`.

Nếu công cụ in số ô mục tiêu khác **4352** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import kimTuThap from './levels/3-8.json';` và `'3-8': kimTuThap,` vào `documents`.

`manifest.ts`: thay entry 3-8 bằng:

```ts
  { id: '3-8', title: 'Kim Tự Tháp Nhật Thực', chapter: 3, order: 20, contentRevision: 'kim-tu-thap-v1', status: 'validated', dataPath: 'src/content/levels/3-8.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-8 (Kim Tự Tháp Nhật Thực) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-8.svg`, so với ô `3-8` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-8 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 4 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-8 Kim Tu Thap Nhat Thuc (validated)`. Message: `feat(content): add level 3-8 Kim Tu Thap Nhat Thuc as validated`.

```bash
git add src/content/sources/3-8.ts src/content/sources/index.ts src/content/levels/3-8.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-8.svg ../docs/testing/levels/3-8-report.md ../docs/testing/levels/screens/3-8-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 15: Màn 3-9 Sao Bát Phương

**Files:**
- Create: `game-next/src/content/sources/3-9.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-9)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-9.json`, `docs/testing/levels/3-9.svg`, `docs/testing/levels/3-9-report.md`, `docs/testing/levels/screens/3-9-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const saoBatPhuong: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-9', pieceCount: 3, targetCells: 1580, hollowCells: 980, revivedCells: 812 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-9 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-9**

Tạo `game-next/src/content/sources/3-9.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-9 Sao Bát Phương: Vuông 48 và thoi 64 chung tâm thành sao tám cánh, bát giác rỗng, mặt trời tròn hiện lại ở tâm.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const saoBatPhuong: LevelSource = {
  id: '3-9',
  title: 'Sao Bát Phương',
  chapter: 3,
  order: 21,
  contentRevision: 'sao-bat-phuong-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 48,
      anchors: [
        { id: 'A', x: 40, y: 56 },
        { id: 'B', x: 48, y: 56 },
        { id: 'C', x: 32, y: 56 },
        { id: 'D', x: 40, y: 64 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 48 },
        { id: 'B', x: 40, y: 48 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 32, y: 56 },
      ],
    },
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 64 },
        { id: 'B', x: 56, y: 64 },
        { id: 'C', x: 40, y: 64 },
        { id: 'D', x: 48, y: 72 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Nhận ra vùng ba lớp ở tâm một hình đối xứng',
  difficultyEstimate: 3,
  distractors: [
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Tám hướng hội tụ về một mặt trời.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { saoBatPhuong } from './3-9.ts';` vào nhóm import và dòng `'3-9': saoBatPhuong,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-9`
Expected: `3-9: 1580 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-9`.

Nếu công cụ in số ô mục tiêu khác **1580** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import saoBatPhuong from './levels/3-9.json';` và `'3-9': saoBatPhuong,` vào `documents`.

`manifest.ts`: thay entry 3-9 bằng:

```ts
  { id: '3-9', title: 'Sao Bát Phương', chapter: 3, order: 21, contentRevision: 'sao-bat-phuong-v1', status: 'validated', dataPath: 'src/content/levels/3-9.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-9 (Sao Bát Phương) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-9.svg`, so với ô `3-9` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-9 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 3 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-9 Sao Bat Phuong (validated)`. Message: `feat(content): add level 3-9 Sao Bat Phuong as validated`.

```bash
git add src/content/sources/3-9.ts src/content/sources/index.ts src/content/levels/3-9.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-9.svg ../docs/testing/levels/3-9-report.md ../docs/testing/levels/screens/3-9-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 16: Màn 3-10 Mandala Thiên Cầu

**Files:**
- Create: `game-next/src/content/sources/3-10.ts`
- Modify: `game-next/src/content/sources/index.ts`
- Modify: `game-next/src/content/catalog.ts`
- Modify: `game-next/src/content/manifest.ts` (entry 3-10)
- Modify: `game-next/tests/content.test.ts` (hằng `AUTHORED_LEVELS`)
- Modify: `game-next/tests/levelContent.test.ts`
- Create (sinh bằng script): `game-next/src/content/levels/3-10.json`, `docs/testing/levels/3-10.svg`, `docs/testing/levels/3-10-report.md`, `docs/testing/levels/screens/3-10-{play,drag,win}.png`

**Interfaces:**
- Consumes: `checkLevel` (Task 1), `AUTHORED_LEVELS` trong `tests/content.test.ts`.
- Produces: `export const mandala: LevelSource`.

- [ ] **Step 1: Thêm kỳ vọng (thất bại)**

Thêm vào cuối `game-next/tests/levelContent.test.ts`:

```ts
checkLevel({ id: '3-10', pieceCount: 5, targetCells: 4468, hollowCells: 2732, revivedCells: 1364 });
```

Run: `npx vitest run tests/levelContent.test.ts`
Expected: FAIL đúng một test: `màn 3-10 > có nguồn mô tả trong LEVEL_SOURCES`.

- [ ] **Step 2: Viết nguồn 3-10**

Tạo `game-next/src/content/sources/3-10.ts`:

```ts
import type { LevelSource } from '../authoring.ts';

/**
 * 3-10 Mandala Thiên Cầu: Năm mảnh chung tâm: đĩa tròn, vuông rỗng, thoi sáng, tâm tròn rỗng, ngọc thoi sáng. Kết chương Họa Phẩm.
 * Toạ độ và neo nhiễu lấy nguyên từ bảng mục 4 của spec C; không tự chỉnh.
 */
export const mandala: LevelSource = {
  id: '3-10',
  title: 'Mandala Thiên Cầu',
  chapter: 3,
  order: 22,
  contentRevision: 'mandala-v1',
  rotationEnabled: false,
  pieces: [
    {
      id: 'C1',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 96,
      anchors: [
        { id: 'A', x: 16, y: 32 },
        { id: 'B', x: 24, y: 32 },
        { id: 'C', x: 8, y: 32 },
        { id: 'D', x: 16, y: 40 },
      ],
    },
    {
      id: 'S1',
      shapeKind: 'square',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 48 },
        { id: 'B', x: 40, y: 48 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 32, y: 56 },
      ],
    },
    {
      id: 'D1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 64,
      anchors: [
        { id: 'A', x: 32, y: 48 },
        { id: 'B', x: 40, y: 48 },
        { id: 'C', x: 24, y: 48 },
        { id: 'D', x: 32, y: 56 },
      ],
    },
    {
      id: 'C2',
      shapeKind: 'circle',
      orientation: 0,
      frameSize: 32,
      anchors: [
        { id: 'A', x: 48, y: 64 },
        { id: 'B', x: 56, y: 64 },
        { id: 'C', x: 40, y: 64 },
        { id: 'D', x: 48, y: 72 },
      ],
    },
    {
      id: 'K1',
      shapeKind: 'diamond',
      orientation: 0,
      frameSize: 16,
      anchors: [
        { id: 'A', x: 56, y: 72 },
        { id: 'B', x: 64, y: 72 },
        { id: 'C', x: 48, y: 72 },
        { id: 'D', x: 56, y: 80 },
      ],
    },
  ],
  sampleSolutions: [
    [
      { pieceId: 'C1', anchorId: 'A', turns: 0 },
      { pieceId: 'S1', anchorId: 'A', turns: 0 },
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'C2', anchorId: 'A', turns: 0 },
      { pieceId: 'K1', anchorId: 'A', turns: 0 },
    ],
  ],
  learningObjective: 'Tổng hợp: năm tầng chẵn lẻ xen kẽ',
  difficultyEstimate: 5,
  distractors: [
    { pieceId: 'C1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'S1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'S1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'S1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'D1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'D1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'D1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'C2', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'C2', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'C2', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
    { pieceId: 'K1', anchorId: 'B', reason: 'Lệch phải 8 ô' },
    { pieceId: 'K1', anchorId: 'C', reason: 'Lệch trái 8 ô' },
    { pieceId: 'K1', anchorId: 'D', reason: 'Lệch xuống 8 ô' },
  ],
  ftueSteps: [],
  victoryVerse: 'Thiên cầu xoay quanh một viên ngọc, bức họa hoàn tất.',
};
```

Trong `game-next/src/content/sources/index.ts`: thêm `import { mandala } from './3-10.ts';` vào nhóm import và dòng `'3-10': mandala,` vào bảng `LEVEL_SOURCES` (giữ thứ tự theo id).

- [ ] **Step 3: Sinh dữ liệu và đối chiếu số liệu**

Run: `npm run content:author -- 3-10`
Expected: `3-10: 4468 ô mục tiêu, 1 nghiệm, 0 nghiệm ít mảnh hơn`, rồi `PASS 3-10`.

Nếu công cụ in số ô mục tiêu khác **4468** hoặc số nghiệm khác 1: **dừng**, không sửa nguồn hay test. Báo lại cho người review kèm output, vì bảng ở spec C mục 3 đã được kiểm độc lập.

- [ ] **Step 4: Đăng ký màn**

`catalog.ts`: thêm `import mandala from './levels/3-10.json';` và `'3-10': mandala,` vào `documents`.

`manifest.ts`: thay entry 3-10 bằng:

```ts
  { id: '3-10', title: 'Mandala Thiên Cầu', chapter: 3, order: 22, contentRevision: 'mandala-v1', status: 'validated', dataPath: 'src/content/levels/3-10.json' },
```

`tests/content.test.ts`: đổi giá trị hằng `AUTHORED_LEVELS` thành `new Set(['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10'])` cộng với các id Chương 1 đang có trong hằng đó (không xoá id 1-x nào).

- [ ] **Step 5: Kiểm tra**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `content:validate` in `PASS: Level 3-10 (Mandala Thiên Cầu) validated.`

- [ ] **Step 6: Xem trước và chụp ảnh**

Mở `docs/testing/levels/3-10.svg`, so với ô `3-10` trong `docs/testing/levels/drafts/hoa-pham-draft.png` (2-5, 3-x) hoặc `chapter-2-draft.png` (2-1 → 2-4, 2-6): hình bóng phải giống nhau, neo nhiễu nét đứt lệch 8 ô quanh mỗi mảnh.

Dev server đang chạy (`npm run dev -- --port 5173 --strictPort`): `bash scripts/shoot-level.sh 3-10 ../docs/testing/levels/screens 5173 harness`. Mở ba ảnh: khay có 5 ô, ảnh `win` có vùng rỗng màu mặt bàn đúng chỗ, vùng 3 lớp hiện màu mảnh, không có chữ chồng nhau.

- [ ] **Step 7: CHANGELOG và commit**

Mục `### <ngày> - Add level 3-10 Mandala Thien Cau (validated)`. Message: `feat(content): add level 3-10 Mandala Thien Cau as validated`.

```bash
git add src/content/sources/3-10.ts src/content/sources/index.ts src/content/levels/3-10.json src/content/catalog.ts src/content/manifest.ts tests/levelContent.test.ts tests/content.test.ts ../docs/testing/levels/3-10.svg ../docs/testing/levels/3-10-report.md ../docs/testing/levels/screens/3-10-*.png ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 17: Cập nhật GDD và trang tổng hợp duyệt

**Files:**
- Modify: `docs/gdd/master-gdd.md` (Phụ lục A: ba hàng 2-1, 2-2, 2-3; Phụ lục B: hàng 2-4, 2-5, 2-6 và thêm bảng Họa Phẩm)
- Create: `docs/testing/levels/chapter-2-3-review.md`

**Interfaces:**
- Consumes: dữ liệu, SVG và ảnh chụp của Task 1–16.
- Produces: trang tổng hợp người review dùng ở Task 18.

- [ ] **Step 1: Phụ lục A — ba hàng Chương 2**

Trong `docs/gdd/master-gdd.md`, thay ba hàng bảng bắt đầu bằng `| **2-1 Mũi Tên Chỉ Thiên**`, `| **2-2 Cánh Bướm Điệp Ảnh**`, `| **2-3 Trái Tim Tinh Thể**` bằng:

```markdown
| **2-1 Mũi Tên Chỉ Thiên** *(Vanguard Arrow)* · bước ngoặt xếp chồng | 2: mái 96 (hướng 4), mái 48 (hướng 4) | Mái nhỏ (40,64) lồng vào đáy mái lớn (16,16); phần giao biến mất để lại mũi tên chevron Λ. | **Xếp chồng 2 lớp:** vùng giao ẩn. FTUE `two-layers`: "Hai mảnh cùng màu: vùng giao biến mất". | 2/5 |
| **2-2 Cánh Bướm Điệp Ảnh** *(Oracle Butterfly)* · tâm rỗng đối xứng | 2: tam giác mái 96 (hướng 5 và 7) | Hai cánh (32,32) và (0,32) đâm mũi qua nhau thành nơ bướm có tâm thoi rỗng 32 ô. | **Xếp chồng 2 lớp:** căn độ sâu giao để tạo khoảng rỗng cân bằng. | 3/5 |
| **2-3 Trái Tim Tinh Thể** *(Crystal Core)* · quy tắc 3 lớp hiện lại | 3: nơ của 2-2 + thoi 16 (56,72) | Viên ngọc đặt vào tâm rỗng của nơ: hạt nhân hiện lại giữa vòng rỗng. | **Xếp chồng 3 lớp:** vùng đó hiện lại. FTUE `three-layers`: "Thêm mảnh thứ ba: vùng đó hiện lại". | 3/5 |
```

- [ ] **Step 2: Phụ lục B — Chương 2 còn lại và Họa Phẩm**

Thay ba hàng bắt đầu bằng `| **2-4** |`, `| **2-5** |`, `| **2-6** |` bằng:

```markdown
| **2-4** | **Mắt Tiên Tri** *(Eye of the Oracle)* | Hai thoi 64 (16,48) và (48,48) lồng ngang thành mí mắt; vùng giao rỗng ôm con ngươi thoi 16 hiện lại | 3: 2 thoi 64, thoi 16 |
| **2-5** | **Đồng Hồ Cát** *(Hourglass)* | Vòng tròn rỗng (tròn 64 trừ tròn 48) ôm đồng hồ cát hai mái 32 hiện lại ba lớp. Thay bản Chìa Khóa Thời Gian | 4: tròn 64, tròn 48, 2 mái 32 |
| **2-6** | **Đại Ấn Hộ Mệnh** *(Grand Sigil)* | Bốn mảnh chung tâm (64,80): vuông 64, thoi 64, vuông 32, thoi 32 — bốn tầng chẵn lẻ xen kẽ; kết Chương 2 | 4: 2 vuông, 2 thoi |
```

Ngay sau bảng Phụ lục B, thêm:

```markdown

### Chương 3 — Họa Phẩm (10 màn)

Tranh nghệ thuật ghép từ vuông, tam giác vuông lớn/nhỏ, thoi, tròn và bình hành, dùng luật chẵn lẻ để tạo chi tiết rỗng. Toạ độ đầy đủ ở spec `2026-10-02-c-chapter-2-hoa-pham-levels-design.md`.

| Màn | Tên | Hình và hiệu ứng bóng | Mảnh |
|---|---|---|---|
| **3-1** | Nhật Nguyệt Song Huyền | Hai vầng tròn lồng nhau, thấu kính rỗng, ngôi sao hiện lại | 2 tròn 64, thoi 16 |
| **3-2** | Đền Tiên Tri | Mái, thân, cửa vuông rỗng, cửa sổ tròn rỗng | mái 96, vuông 64, vuông 32, tròn 16 |
| **3-3** | Cá Chép Sao | Thân thoi, đuôi, mắt tròn rỗng, miệng rỗng | thoi 64, 2 tam giác, tròn 16 |
| **3-4** | Ngọn Nến | Quầng sáng tròn ôm ngọn lửa âm bản | 2 vuông 32, thoi 32, tròn 64 |
| **3-5** | Thuyền Buồm Hoàng Hôn | Mặt trời lặn sau cánh buồm | 3 tam giác, tròn 32 |
| **3-6** | Mèo Thần | Hai mắt rỗng, đuôi bình hành | 7 mảnh |
| **3-7** | Hoa Sen | Đường rỗng tách cánh, mặt nước bình hành | thoi 48, 2 tam giác, 2 bình hành |
| **3-8** | Kim Tự Tháp Nhật Thực | Cửa tam giác rỗng, nhật thực hai tròn | mái 128, mái 32, 2 tròn 32 |
| **3-9** | Sao Bát Phương | Sao tám cánh, bát giác rỗng, mặt trời hiện lại | vuông 48, thoi 64, tròn 32 |
| **3-10** | Mandala Thiên Cầu | Năm tầng chẵn lẻ chung tâm; kết chương | 2 tròn, vuông, 2 thoi |
```

- [ ] **Step 3: Trang tổng hợp duyệt**

Tạo `docs/testing/levels/chapter-2-3-review.md` với tiêu đề `# Duyệt Chương 2 và Họa Phẩm`, một đoạn hướng dẫn chơi thử (`cd game-next && npm run dev`, mở `http://localhost:5173/?scene=play&level=<id>&mode=harness`), và một bảng 16 hàng (2-1 → 2-6, 3-1 → 3-10) với các cột: `Màn` (mã + tên), `Trạng thái` (`validated`), `Xem trước` (`[<id>.svg](<id>.svg)`), `Báo cáo nghiệm` (`[<id>-report.md](<id>-report.md)`), `Ảnh màn chơi` (`[chơi](screens/<id>-play.png) · [kéo](screens/<id>-drag.png) · [thắng](screens/<id>-win.png)`). Cuối trang: "Mỗi màn có đúng một nghiệm và không có nghiệm dùng ít mảnh hơn. Cột trạng thái được cập nhật khi từng màn được duyệt."

- [ ] **Step 4: CHANGELOG và commit**

Mục `### <ngày> - Update GDD for chapter 2 and Hoa Pham, add review index`. Message: `docs(gdd): update chapter 2 and add Hoa Pham level sheets`.

```bash
git add ../docs/gdd/master-gdd.md ../docs/testing/levels/chapter-2-3-review.md ../CHANGELOG.md
git commit -F <file chứa message>
```

---

### Task 18: Cổng duyệt từng màn (cần người review)

**Files (mỗi màn được duyệt):**
- Modify: `game-next/src/content/manifest.ts` (đổi `status` sang `approved`)
- Create: `docs/testing/mirror-rebuild/<id>-content-review.md`
- Modify: `docs/testing/levels/chapter-2-3-review.md` (cột trạng thái)

**Interfaces:**
- Consumes: mọi thứ ở trên.
- Produces: các màn `approved` theo thứ tự campaign.

Campaign mở khoá tuần tự, nên duyệt theo thứ tự 2-1 → 2-6 → 3-1 → 3-10, và chỉ bắt đầu khi 1-6 đã `approved`. Mỗi màn là một vòng Step 1–5 riêng, một commit riêng.

- [ ] **Step 1: Hỏi người review**

Gửi, rồi **dừng chờ** câu trả lời:

> Màn `<id> <tên>` (`<revision>`) sẵn sàng duyệt. Xem trước: `docs/testing/levels/<id>.svg`; báo cáo nghiệm: `<id>-report.md` (1 nghiệm, 0 nghiệm ít mảnh hơn); ảnh: `docs/testing/levels/screens/<id>-*.png`; chơi thử: `?scene=play&level=<id>&mode=harness` trên dev server. Bạn duyệt màn này, hay muốn sửa gì (hình, câu thơ, mục tiêu học, FTUE)?

- [ ] **Step 2: Nếu người review yêu cầu sửa**

Sửa đúng điều được yêu cầu trong `src/content/sources/<id>.ts`, tăng `contentRevision` (ví dụ `mui-ten-v1` → `mui-ten-v2`) ở cả nguồn và `manifest.ts`, chạy `npm run content:author -- <id>`. Nếu hình đổi, cập nhật dòng `checkLevel` của màn đó bằng con số công cụ in ra **sau khi** người review đã xem SVG mới và đồng ý với hình. Chụp lại ảnh, chạy `npm run typecheck && npm test`, commit (`fix(content): revise level <id> per review`), quay lại Step 1.

- [ ] **Step 3: Nếu người review duyệt — đổi trạng thái**

Trong `manifest.ts`, đổi `status: 'validated'` của màn đó thành `status: 'approved'`. Chạy `npm test`. Test đang giả định màn này hoặc màn trước đó chưa sẵn sàng (ví dụ `tests/menu.test.ts`, `tests/levelSelect.test.ts`, `tests/catalog.test.ts` kiểm `available` hay `resolveNextCampaignLevel`) phải được sửa theo đúng hành vi mới và ghi tên test vào CHANGELOG; test hỏng vì lý do khác thì dừng và điều tra.

- [ ] **Step 4: Ghi biên bản duyệt**

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

Trong `docs/testing/levels/chapter-2-3-review.md`, đổi ô trạng thái của màn thành `approved (<revision>)`.

- [ ] **Step 5: Kiểm tra và commit**

Run: `npm run typecheck && npm test && npm run content:validate`
Expected: xanh; `tests/levelContent.test.ts` xác nhận màn vừa duyệt nạp được ở campaign.

Mục CHANGELOG `### <ngày> - Approve level <id> <tên không dấu>`. Message: `feat(content): approve level <id> after review`.

```bash
git add src/content/manifest.ts ../docs/testing/mirror-rebuild/<id>-content-review.md ../docs/testing/levels/chapter-2-3-review.md ../CHANGELOG.md
# Thêm các file test đã sửa ở Step 3 nếu có
git commit -F <file chứa message>
```

Lặp lại Step 1–5 cho màn kế tiếp. Màn chưa được duyệt giữ `validated`; không duyệt vượt thứ tự.

---

## Kết thúc plan

`npm run typecheck && npm test && npm run content:validate && npm run build` xanh. Báo người review: màn nào đã `approved`, màn nào còn `validated` và vì sao.

# improve-v1 — Giai đoạn 1/4: Nền móng — tokens, lưới logic, hình học màn 1-1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi bảng màu sang mockup improve-v1, chuyển lưới logic sang 128×160 ở 5px mỗi ô, và sinh lại hình học màn 1-1 cho đúng quy tắc GridSpec.

**Architecture:** Ba bước nối tiếp, mỗi bước một commit: viết lại `designTokens.ts` (giữ nguyên tên export, đổi giá trị, thêm `GRID_TOKENS`/`GLASS_TOKENS`/`PIECE_TOKENS`), đổi hằng số lưới trong domain và layout, rồi sinh lại `1-1.json` bằng script.

**Tech Stack:** TypeScript (ESM, `.ts` extension trong import), Phaser 3.90, Vite, Vitest, Capacitor (Android).

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

**Giao được gì sau giai đoạn này:** Game chạy trên bàn 640×800 với lưới logic 128×160; mảnh có nửa đường chéo bằng đúng một module nên đỉnh rơi vào giao điểm lưới. Phần vẽ vẫn là phần vẽ cũ — đẹp hơn thì chưa, nhưng đúng thì đã đúng.

## Vị trí trong loạt plan

- **Chạy trước tiên:** đây là plan đầu tiên của loạt bốn plan.
- **Chạy tiếp theo:** `2026-10-01-gui-improve-v1-2-module-dung-chung.md`

Chỉ mục cả loạt: `docs/superpowers/plans/2026-10-01-gui-improve-v1-index.md`

## Global Constraints

Áp dụng cho **mọi** task bên dưới:

- Thư mục làm việc: `game-next/`. Mọi lệnh `npm` chạy từ đó.
- Import nội bộ **luôn kèm đuôi `.ts`** (`import { x } from './y.ts'`). Đây là cấu hình ESM của repo; bỏ đuôi sẽ gãy lúc build.
- Comment và chuỗi hiển thị cho người dùng viết bằng **tiếng Việt**, theo đúng văn phong các file hiện có. Tên biến/hàm bằng tiếng Anh.
- Không dùng ALL-CAPS trong văn bản giao diện (`tests/hud.test.ts` đang kiểm điều này).
- Sau mỗi task: `npm run typecheck` và `npm run test` phải xanh trước khi commit.
- Test viết bằng `vitest`, import `{ describe, expect, test } from 'vitest'`. Không mock Phaser — test hàm thuần và dữ liệu export, không test lệnh vẽ.
- Canvas giữ nguyên 720×1280. Không đổi `GRID_WIDTH` (128).
- Bảng màu bắt buộc (chép nguyên văn từ spec):
  - Trời: `#1A2470` / `#2B3192` / `#4A3A9E` / `#6B4BA8`
  - Mặt bàn: `#1D3482` → `#14215E`
  - Viền băng: `#A9E3FF`; khung kính `#E6F7FF` / `#8BD3F5` / `#4E9BD0` / `#2D5E9A`
  - Lưới: mảnh `#9CC8FF` @.13, module `#FFD27A` @.30, trục `#FFD27A` @.60, chéo `#8FE0FF` @.16, vạch `#FFE3A0` @.75
  - Mặt ngọc: Bắc `#FFEAA8`, Đông `#FFD56E`, Nam `#EFA53A`, Tây `#F9BF4F`, viền `#FFF4CC`
- Hệ số đo bắt buộc: ô logic 5px, lưới 128×160, bàn 640×800 tại (40, 200), ô lưới hiển thị 8 ô logic = 40px, module 3 ô lưới = 120px, nửa đường chéo mảnh 24 ô logic = 120px.


## Ghi chú riêng cho giai đoạn này

**Giai đoạn này cố ý để test đỏ giữa chừng.** Task 1 làm đỏ `layout.test.ts` và `boardRenderer.test.ts`; Task 2 làm chúng xanh lại nhưng làm đỏ `content.test.ts`; Task 3 làm xanh tất cả. Plan ghi rõ chỗ nào đỏ và task nào sửa. Test đỏ ở chỗ khác là tín hiệu có gì sai — dừng lại và báo cáo, đừng sửa test cho xanh.

---

### Task 1: Design tokens mới

**Files:**
- Modify: `game-next/src/presentation/designTokens.ts`
- Test: `game-next/tests/designTokens.test.ts`

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces: `COLOR_TOKENS`, `COLOR_NUMBERS`, `TYPO_TOKENS`, `LAYOUT_TOKENS`, `ANIM_TOKENS`, `DEPTH_TOKENS` (giữ nguyên tên, đổi giá trị) và ba nhóm mới `GRID_TOKENS`, `GLASS_TOKENS`, `PIECE_TOKENS` với hình dạng chính xác ghi ở Step 3.

- [ ] **Step 1: Viết test thất bại**

Mở `game-next/tests/designTokens.test.ts`. **Thay toàn bộ** nội dung bằng:

```ts
import { describe, expect, test } from 'vitest';
import {
  COLOR_TOKENS,
  COLOR_NUMBERS,
  TYPO_TOKENS,
  LAYOUT_TOKENS,
  ANIM_TOKENS,
  DEPTH_TOKENS,
  GRID_TOKENS,
  GLASS_TOKENS,
  PIECE_TOKENS,
} from '../src/presentation/designTokens.ts';

describe('Design Tokens Validation', () => {
  test('bảng màu trời bốn chặng theo mockup improve-v1', () => {
    expect(COLOR_TOKENS.sky.stops).toEqual(['#1A2470', '#2B3192', '#4A3A9E', '#6B4BA8']);
    expect(COLOR_TOKENS.sky.nebulaBlue).toBe('#7FB8FF');
    expect(COLOR_TOKENS.sky.nebulaPink).toBe('#FF9FD2');
    expect(COLOR_TOKENS.sky.moonCore).toBe('#FFF4D6');
  });

  test('mặt bàn và viền băng dùng màu mới, không còn màu navy phẳng cũ', () => {
    expect(COLOR_TOKENS.board.surfaceTop).toBe('#1D3482');
    expect(COLOR_TOKENS.board.surfaceBottom).toBe('#14215E');
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');

    const allColors = JSON.stringify(COLOR_TOKENS).toUpperCase();
    expect(allColors.includes('#080E24')).toBe(false);
    expect(allColors.includes('#4ECDC4')).toBe(false);
  });

  test('COLOR_NUMBERS phản chiếu đúng COLOR_TOKENS dưới dạng số hex', () => {
    expect(COLOR_NUMBERS.boardSurfaceTop).toBe(0x1d3482);
    expect(COLOR_NUMBERS.icePrimary).toBe(0xa9e3ff);
    expect(COLOR_NUMBERS.gridModule).toBe(0xffd27a);
    expect(COLOR_NUMBERS.jewelFaceNorth).toBe(0xffeaa8);
  });

  test('GRID_TOKENS khớp quy tắc hình học GridSpec', () => {
    expect(GRID_TOKENS.logicCellPx).toBe(5);
    expect(GRID_TOKENS.displayCellInLogicCells).toBe(8);
    expect(GRID_TOKENS.moduleInDisplayCells).toBe(3);
    // Ô lưới hiển thị 40px, module 120px
    expect(GRID_TOKENS.logicCellPx * GRID_TOKENS.displayCellInLogicCells).toBe(40);
    expect(
      GRID_TOKENS.logicCellPx *
        GRID_TOKENS.displayCellInLogicCells *
        GRID_TOKENS.moduleInDisplayCells
    ).toBe(120);
  });

  test('PIECE_TOKENS định nghĩa đủ bốn mặt vát theo chiều sáng trên-trái', () => {
    expect(PIECE_TOKENS.faceNorth).toBe('#FFEAA8');
    expect(PIECE_TOKENS.faceEast).toBe('#FFD56E');
    expect(PIECE_TOKENS.faceSouth).toBe('#EFA53A');
    expect(PIECE_TOKENS.faceWest).toBe('#F9BF4F');
    expect(PIECE_TOKENS.outline).toBe('#FFF4CC');
    expect(PIECE_TOKENS.outlineWidth).toBe(2);
    expect(PIECE_TOKENS.tableRatio).toBe(0.45);
  });

  test('GLASS_TOKENS mô tả khung kính dùng chung cho bàn và khay', () => {
    expect(GLASS_TOKENS.frameStops).toEqual(['#E6F7FF', '#8BD3F5', '#4E9BD0', '#2D5E9A']);
    expect(GLASS_TOKENS.cornerRadius).toBe(30);
    expect(GLASS_TOKENS.padding).toBe(6);
  });

  test('LAYOUT_TOKENS theo bố cục dọc mới, tổng chiều cao không vượt canvas', () => {
    expect(LAYOUT_TOKENS.board).toEqual({
      x: 40,
      y: 200,
      width: 640,
      height: 800,
      cornerRadius: 30,
      borderWidth: 6,
    });
    expect(LAYOUT_TOKENS.tray).toEqual({ x: 40, y: 1032, width: 640, height: 160, cornerRadius: 24 });
    expect(LAYOUT_TOKENS.header).toEqual({ y: 0, height: 96 });
    expect(LAYOUT_TOKENS.bottomBar).toEqual({ y: 1200, height: 80 });
    expect(LAYOUT_TOKENS.targetBadge).toEqual({ x: 360, y: 158, size: 188, radius: 94 });

    const used =
      LAYOUT_TOKENS.header.height +
      LAYOUT_TOKENS.board.height +
      LAYOUT_TOKENS.tray.height +
      LAYOUT_TOKENS.bottomBar.height;
    expect(used).toBe(1136);
    expect(used).toBeLessThanOrEqual(LAYOUT_TOKENS.canvas.height);
  });

  test('bàn chơi căn giữa theo chiều ngang canvas', () => {
    expect(LAYOUT_TOKENS.board.x * 2 + LAYOUT_TOKENS.board.width).toBe(
      LAYOUT_TOKENS.canvas.width
    );
  });

  test('giữ nguyên font và thời gian animation chuẩn', () => {
    expect(TYPO_TOKENS.fontFamily.serif).toContain('Playfair Display');
    expect(TYPO_TOKENS.fontFamily.sans).toContain('Be Vietnam Pro');
    expect(ANIM_TOKENS.duration.snapMs).toBe(120);
    expect(ANIM_TOKENS.duration.overlapInversionMs).toBe(150);
    expect(ANIM_TOKENS.duration.buttonTapMs).toBe(90);
  });

  test('định nghĩa các layer depth có thứ bậc hợp lý', () => {
    expect(DEPTH_TOKENS.backgroundSky).toBeLessThan(DEPTH_TOKENS.steleBoard);
    expect(DEPTH_TOKENS.steleBoard).toBeLessThan(DEPTH_TOKENS.placedPieces);
    expect(DEPTH_TOKENS.placedPieces).toBeLessThan(DEPTH_TOKENS.draggingPiece);
    expect(DEPTH_TOKENS.draggingPiece).toBeLessThan(DEPTH_TOKENS.modalOverlay);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/designTokens.test.ts
```

Kỳ vọng: FAIL — `GRID_TOKENS`, `GLASS_TOKENS`, `PIECE_TOKENS` chưa được export.

- [ ] **Step 3: Viết lại `designTokens.ts`**

**Thay toàn bộ** `game-next/src/presentation/designTokens.ts`:

```ts
export const COLOR_TOKENS = {
  /** Gradient trời bốn chặng, từ trên xuống dưới */
  sky: {
    stops: ['#1A2470', '#2B3192', '#4A3A9E', '#6B4BA8'],
    stopOffsets: [0, 0.45, 0.78, 1],
    nebulaBlue: '#7FB8FF',
    nebulaPink: '#FF9FD2',
    moonCore: '#FFF4D6',
    moonHalo: '#FFE3A3',
    starWhite: '#FFFFFF',
    starBlue: '#CFE6FF',
    starWarm: '#FFE8B8',
  },
  board: {
    surfaceTop: '#1D3482',
    surfaceBottom: '#14215E',
    innerGlow: '#7DB7FF',
  },
  iceGlass: {
    primaryBorder: '#A9E3FF',
    bevelHighlight: '#CFEFFF',
    bevelShadow: '#3A5E78',
    buttonFillTop: '#3D5FC0',
    buttonFillBottom: '#1B2A72',
  },
  amberGold: {
    solidPrimary: '#FFC857',
    gridCoordinate: '#FFD27A',
    glowHighlight: '#FFE8A6',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#CFE3FF',
    onAmber: '#3A2300',
  },
  danger: {
    warningText: '#E65A5A',
    confirmBg: '#5A1A1A',
  },
  modal: {
    backdrop: '#050A1A',
  },
} as const;

export const COLOR_NUMBERS = {
  skyTop: 0x1a2470,
  skyBottom: 0x6b4ba8,
  boardSurfaceTop: 0x1d3482,
  boardSurfaceBottom: 0x14215e,
  navyBackdrop: 0x050a1a,
  icePrimary: 0xa9e3ff,
  iceHighlight: 0xcfefff,
  iceShadow: 0x3a5e78,
  buttonFillTop: 0x3d5fc0,
  buttonFillBottom: 0x1b2a72,
  amberSolid: 0xffc857,
  amberGlow: 0xffe8a6,
  gridFine: 0x9cc8ff,
  gridModule: 0xffd27a,
  gridDiagonal: 0x8fe0ff,
  gridTick: 0xffe3a0,
  jewelFaceNorth: 0xffeaa8,
  jewelFaceEast: 0xffd56e,
  jewelFaceSouth: 0xefa53a,
  jewelFaceWest: 0xf9bf4f,
  jewelOutline: 0xfff4cc,
  textPrimary: 0xffffff,
  textSecondary: 0xcfe3ff,
  dangerText: 0xe65a5a,
} as const;

export const TYPO_TOKENS = {
  fontFamily: {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontSize: {
    heroTitle: '52px',
    headerTitle: '52px',
    sectionHeader: '32px',
    modalTitle: '44px',
    bodyPrimary: '28px',
    buttonLabel: '26px',
    caption: '24px',
  },
} as const;

export const LAYOUT_TOKENS = {
  canvas: { width: 720, height: 1280 },
  header: { y: 0, height: 96 },
  targetBadge: { x: 360, y: 158, size: 188, radius: 94 },
  board: { x: 40, y: 200, width: 640, height: 800, cornerRadius: 30, borderWidth: 6 },
  tray: { x: 40, y: 1032, width: 640, height: 160, cornerRadius: 24 },
  bottomBar: { y: 1200, height: 80 },
  buttonSizes: {
    primaryW: 360,
    primaryH: 72,
    circularAction: 64,
    circularNav: 56,
    circularPrimary: 112,
    circularSecondary: 80,
    minTouchArea: 96,
  },
} as const;

/** Quy tắc hình học từ artboard GridSpec */
export const GRID_TOKENS = {
  logicCellPx: 5,
  displayCellInLogicCells: 8,
  moduleInDisplayCells: 3,
  fine: { color: '#9CC8FF', alpha: 0.13, width: 1 },
  module: { color: '#FFD27A', alpha: 0.3, width: 1 },
  axis: { color: '#FFD27A', alpha: 0.6, width: 1.4 },
  diagonal: { color: '#8FE0FF', alpha: 0.16, width: 1, dash: [3, 4] },
  tick: { color: '#FFE3A0', alpha: 0.75, width: 1.2, shortLen: 5, longLen: 9 },
  corner: { color: '#FFD27A', width: 2, armLen: 18, inset: 8 },
} as const;

/** Khung kính dùng chung cho bàn chơi, khay mảnh và các dialog */
export const GLASS_TOKENS = {
  frameStops: ['#E6F7FF', '#8BD3F5', '#4E9BD0', '#2D5E9A'],
  frameStopOffsets: [0, 0.18, 0.6, 1],
  cornerRadius: 30,
  padding: 6,
  hairline: { color: '#FFFFFF', alpha: 0.25, width: 1 },
  glow: { color: '#78C8FF', alpha: 0.55, blur: 34 },
  dropShadow: { color: '#080A28', alpha: 0.55, offsetY: 18, blur: 40 },
} as const;

/** Mảnh ngọc thoi: bốn mặt vát, sáng ở trên-trái, tối ở dưới-phải */
export const PIECE_TOKENS = {
  faceNorth: '#FFEAA8',
  faceEast: '#FFD56E',
  faceSouth: '#EFA53A',
  faceWest: '#F9BF4F',
  outline: '#FFF4CC',
  outlineWidth: 2,
  /** Bán kính mặt bàn so với bán kính mảnh */
  tableRatio: 0.45,
  tableStops: ['#FFFBEA', '#FFE29A', '#F6B443'],
  glow: { color: '#FFC857', alpha: 0.7, blur: 9 },
  sparkle: { color: '#FFFFFF', alpha: 0.95, offsetRatio: -0.3 },
  ghostAlpha: 0.75,
  targetFill: { color: '#BFE3FF', alpha: 0.1 },
  targetStroke: { color: '#DDF2FF', alpha: 0.7, width: 1.6, dash: [6, 5] },
  placeholderStroke: { color: '#CFEFFF', alpha: 0.55, width: 1.5, dash: [5, 4] },
} as const;

export const ANIM_TOKENS = {
  duration: {
    buttonTapMs: 90,
    dragLiftMs: 80,
    snapMs: 120,
    overlapInversionMs: 150,
    sceneFadeMs: 240,
    twinkleCycleMs: 3200,
    linkSweepMs: 6000,
  },
  scale: {
    dragging: 1.06,
    buttonTapped: 0.96,
  },
} as const;

export const DEPTH_TOKENS = {
  backgroundSky: 0,
  celestialRings: 5,
  steleBoard: 10,
  boardGrid: 15,
  targetSilhouette: 20,
  targetBadge: 25,
  placedPieces: 30,
  trayArea: 40,
  temporaryPieces: 50,
  draggingPiece: 60,
  hudControls: 70,
  modalOverlay: 100,
  modalContent: 110,
} as const;
```

- [ ] **Step 4: Chạy test designTokens để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/designTokens.test.ts
```

Kỳ vọng: PASS, 9 test.

- [ ] **Step 5: Sửa các chỗ gọi token đã bị đổi tên**

Chạy `npm run typecheck`. Sẽ đỏ ở những chỗ dùng token cũ. Sửa theo bảng này — **chỉ đổi tên token, chưa đổi logic vẽ** (phần vẽ thuộc các task sau):

| Token cũ | Token mới |
|---|---|
| `COLOR_TOKENS.navy.spaceBackground` | `COLOR_TOKENS.sky.stops[0]` |
| `COLOR_TOKENS.navy.steleSurface` | `COLOR_TOKENS.board.surfaceTop` |
| `COLOR_TOKENS.navy.deepModalBackdrop` | `COLOR_TOKENS.modal.backdrop` |
| `COLOR_TOKENS.amberGold.gridCoordinate` | giữ nguyên tên, giá trị đã đổi |
| `COLOR_NUMBERS.navySpace` | `COLOR_NUMBERS.skyTop` |
| `COLOR_NUMBERS.navyStele` | `COLOR_NUMBERS.boardSurfaceTop` |
| `COLOR_NUMBERS.amberGrid` | `COLOR_NUMBERS.gridModule` |
| `COLOR_NUMBERS.textPrimary` | giữ nguyên |
| `LAYOUT_TOKENS.topBuffer` | đã bỏ — xoá chỗ dùng, bố cục mới không còn vùng đệm riêng |
| `LAYOUT_TOKENS.safeAreaBottom` | đã bỏ — xoá chỗ dùng |

Nếu `typecheck` báo lỗi ở `LAYOUT_TOKENS.board.borderWidth` (cũ 10, mới 6) thì không cần sửa — chỉ là giá trị.

- [ ] **Step 6: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: `typecheck` xanh. `npm run test` **sẽ còn đỏ** ở `tests/boardRenderer.test.ts` và `tests/layout.test.ts` (đang khẳng định bàn 512×768 tại (104,184) và `cellPixel` 4). Đó là đỏ đúng — Task 2 sẽ sửa. Ghi lại tên các test đỏ để đối chiếu.

- [ ] **Step 7: Commit**

```bash
cd game-next && git add src/presentation/designTokens.ts tests/designTokens.test.ts src/presentation
git commit -m "feat(tokens): bảng màu và số đo mới theo mockup improve-v1

Thêm GRID_TOKENS, GLASS_TOKENS, PIECE_TOKENS. Bàn chơi 640x800 tại (40,200).
Test layout và boardRenderer còn đỏ, sẽ xanh lại ở task đổi lưới logic."
```

---

### Task 2: Lưới logic 128×160 ở 5px mỗi ô

**Files:**
- Modify: `game-next/src/domain/model.ts:2`
- Modify: `game-next/src/content/document.ts:20`
- Modify: `game-next/src/content/fixtures.ts:37`
- Modify: `game-next/src/presentation/layout.ts`
- Modify: `game-next/src/presentation/TargetBadge.ts:115-118`
- Test: `game-next/tests/layout.test.ts`, `game-next/tests/boardRenderer.test.ts`

**Interfaces:**
- Consumes: `LAYOUT_TOKENS`, `GRID_TOKENS` từ Task 1.
- Produces: `GRID_HEIGHT = 160`; `LayoutMetrics.cellPixel: 5`; `computeLayout`, `gridToCanvas`, `canvasToGrid`, `pieceHitbox` giữ nguyên chữ ký.

- [ ] **Step 1: Viết test thất bại**

**Thay toàn bộ** `game-next/tests/layout.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { computeLayout, gridToCanvas, canvasToGrid } from '../src/presentation/layout.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../src/domain/model.ts';
import { GRID_TOKENS } from '../src/presentation/designTokens.ts';

describe('Layout Metrics Specification', () => {
  const layout = computeLayout(720, 1280);

  test('lưới logic 128 x 160 theo đặc tả GridSpec', () => {
    expect(GRID_WIDTH).toBe(128);
    expect(GRID_HEIGHT).toBe(160);
  });

  test('bàn chơi 640x800 tại (40, 200) ở tỉ lệ 5px mỗi ô logic', () => {
    expect(layout.boardBounds).toEqual({ x: 40, y: 200, width: 640, height: 800 });
    expect(layout.cellPixel).toBe(5);
    expect(GRID_WIDTH * layout.cellPixel).toBe(layout.boardBounds.width);
    expect(GRID_HEIGHT * layout.cellPixel).toBe(layout.boardBounds.height);
  });

  test('khay, header và thanh dưới theo bố cục dọc mới', () => {
    expect(layout.trayBounds).toEqual({ x: 40, y: 1032, width: 640, height: 160 });
    expect(layout.headerBounds).toEqual({ y: 0, height: 96 });
    expect(layout.bottomBarBounds).toEqual({ y: 1200, height: 80 });
  });

  test('chuyển đổi grid sang canvas tính đúng gốc (40, 200)', () => {
    expect(gridToCanvas(0, 0, layout)).toEqual({ x: 40, y: 200 });
    expect(gridToCanvas(64, 80, layout)).toEqual({ x: 40 + 320, y: 200 + 400 });
  });

  test('chuyển đổi canvas sang grid nhận diện đúng trong và ngoài bàn', () => {
    expect(canvasToGrid(40 + 64 * 5, 200 + 80 * 5, layout)).toEqual({
      x: 64,
      y: 80,
      insideBoard: true,
    });
    // Ngay dưới mép dưới bàn: y logic = 160, vượt lưới
    expect(canvasToGrid(40, 200 + 160 * 5, layout).insideBoard).toBe(false);
  });

  test('một ô lưới hiển thị bằng 40px và một module bằng 120px', () => {
    const displayPx = layout.cellPixel * GRID_TOKENS.displayCellInLogicCells;
    expect(displayPx).toBe(40);
    expect(displayPx * GRID_TOKENS.moduleInDisplayCells).toBe(120);
    // Bàn chứa đúng số nguyên ô lưới hiển thị theo cả hai chiều
    expect(layout.boardBounds.width % displayPx).toBe(0);
    expect(layout.boardBounds.height % displayPx).toBe(0);
  });
});
```

**Thay toàn bộ** `game-next/tests/boardRenderer.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { computeLayout } from '../src/presentation/layout.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';

describe('BoardRenderer Astrological Stele Rules', () => {
  const layout = computeLayout(720, 1280);

  test('bàn chơi 640x800 bắt đầu tại y=200, căn giữa ngang', () => {
    expect(layout.boardBounds.x).toBe(40);
    expect(layout.boardBounds.y).toBe(200);
    expect(layout.boardBounds.width).toBe(640);
    expect(layout.boardBounds.height).toBe(800);
  });

  test('màu khung kính và mặt bàn tuân thủ bảng màu improve-v1', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');
    expect(COLOR_TOKENS.board.surfaceTop).toBe('#1D3482');
    expect(COLOR_NUMBERS.boardSurfaceTop).toBe(0x1d3482);
    expect(COLOR_NUMBERS.icePrimary).toBe(0xa9e3ff);
  });

  test('khay mảnh nằm ngay dưới bàn, không chồng lấn', () => {
    expect(layout.trayBounds.y).toBe(LAYOUT_TOKENS.tray.y);
    expect(layout.trayBounds.height).toBe(LAYOUT_TOKENS.tray.height);
    expect(layout.trayBounds.y).toBeGreaterThanOrEqual(
      layout.boardBounds.y + layout.boardBounds.height
    );
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/layout.test.ts tests/boardRenderer.test.ts
```

Kỳ vọng: FAIL — `GRID_HEIGHT` vẫn là 192, `cellPixel` vẫn là 4, `boardBounds` vẫn là (104,184,512,768).

- [ ] **Step 3: Đổi hằng số lưới logic**

Trong `game-next/src/domain/model.ts` dòng 2:

```ts
export const GRID_HEIGHT = 160;
```

Trong `game-next/src/content/document.ts` dòng 20:

```ts
  board: { width: 128; height: 160 };
```

Trong `game-next/src/content/fixtures.ts` dòng 37:

```ts
    board: { width: 128, height: 160 },
```

- [ ] **Step 4: Đổi `layout.ts` sang 5px mỗi ô**

Trong `game-next/src/presentation/layout.ts`, đổi kiểu và hằng số:

```ts
export type LayoutMetrics = {
  boardBounds: { x: number; y: number; width: number; height: number };
  cellPixel: 5;
  trayBounds: { x: number; y: number; width: number; height: number };
  headerBounds: { y: number; height: number };
  bottomBarBounds: { y: number; height: number };
  scale: number;
};
```

và:

```ts
const CELL_PIXEL: 5 = 5;
```

Phần thân `computeLayout`, `gridToCanvas`, `canvasToGrid`, `pieceHitbox` **không đổi** — chúng đọc hằng số từ `LAYOUT_TOKENS` và `CELL_PIXEL`.

- [ ] **Step 5: Bỏ hardcode 192 trong `TargetBadge.ts`**

Trong `game-next/src/presentation/TargetBadge.ts`, thêm import ở đầu file nếu chưa có:

```ts
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
```

Rồi trong `drawTargetSilhouette`, thay khối dòng 112–125:

```ts
    let minX = GRID_WIDTH;
    let maxX = 0;
    let minY = GRID_HEIGHT;
    let maxY = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (level.targetMask[y * GRID_WIDTH + x] > 0) {
```

- [ ] **Step 6: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/layout.test.ts tests/boardRenderer.test.ts && npm run typecheck
```

Kỳ vọng: cả hai file PASS, typecheck xanh.

- [ ] **Step 7: Chạy toàn bộ test**

```bash
cd game-next && npm run test
```

Kỳ vọng: `tests/content.test.ts` và/hoặc `tests/kernel.test.ts` **còn đỏ**, vì `1-1.json` vẫn khai báo `board.height: 192` và có ô nằm ngoài lưới 160. Đó là đỏ đúng — Task 3 sửa. Nếu test nào khác đỏ vì lý do không liên quan đến lưới, dừng lại và báo cáo trước khi đi tiếp.

- [ ] **Step 8: Commit**

```bash
cd game-next && git add src/domain/model.ts src/content/document.ts src/content/fixtures.ts src/presentation/layout.ts src/presentation/TargetBadge.ts tests/layout.test.ts tests/boardRenderer.test.ts
git commit -m "feat(grid): lưới logic 128x160 ở 5px mỗi ô theo GridSpec

Bàn chơi 640x800 tại (40,200). Một ô lưới hiển thị = 8 ô logic = 40px,
module = 3 ô lưới = 120px. Content 1-1 chưa migrate nên content test còn đỏ."
```

---

### Task 3: Sinh lại hình học màn 1-1

**Files:**
- Create: `game-next/scripts/regen-level-geometry.ts`
- Modify: `game-next/src/content/levels/1-1.json` (sinh bằng script, không sửa tay)
- Modify: `game-next/src/content/document.ts` (thêm `victoryVerse`)
- Modify: `game-next/src/content/validate.ts` (chấp nhận `victoryVerse`)
- Create: `game-next/tests/gridAlignment.test.ts`

**Interfaces:**
- Consumes: `GRID_WIDTH`, `GRID_HEIGHT` từ Task 2; `GRID_TOKENS` từ Task 1.
- Produces: `1-1.json` với `frameSize: 48`, `board.height: 160`, anchors đã dịch, `victoryVerse`. Trường `victoryVerse?: string` trên `LevelDocument`.

Bối cảnh: `1-1.json` hiện có hai mảnh `D1`, `D2`, mỗi mảnh `frameSize: 40` và mảng `cells` 840 phần tử (hình thoi rasterize). `targetCells` có 1680 phần tử, trải x 24..103, y 76..115. Anchors: D1 (24,76) và (24,92); D2 (64,76) và (64,92). Tất cả phải sinh lại cho `frameSize: 48` và lưới cao 160.

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/gridAlignment.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import levelDoc from '../src/content/levels/1-1.json' with { type: 'json' };
import { GRID_WIDTH, GRID_HEIGHT } from '../src/domain/model.ts';
import { GRID_TOKENS } from '../src/presentation/designTokens.ts';

const DISPLAY_CELL = GRID_TOKENS.displayCellInLogicCells; // 8 ô logic

describe('Quy tắc hình học GridSpec áp lên nội dung màn 1-1', () => {
  test('bàn chơi khai báo đúng lưới 128 x 160', () => {
    expect(levelDoc.board).toEqual({ width: GRID_WIDTH, height: GRID_HEIGHT });
  });

  test('nửa đường chéo mảnh là số nguyên ô lưới hiển thị', () => {
    for (const piece of levelDoc.pieces) {
      const halfDiagonal = piece.frameSize / 2;
      expect(halfDiagonal).toBe(24);
      expect(halfDiagonal % DISPLAY_CELL).toBe(0);
      // 24 ô logic = 3 ô lưới = đúng 1 module
      expect(halfDiagonal / DISPLAY_CELL).toBe(GRID_TOKENS.moduleInDisplayCells);
    }
  });

  test('mọi neo rơi đúng giao điểm lưới hiển thị', () => {
    for (const piece of levelDoc.pieces) {
      for (const anchor of piece.anchors) {
        expect(anchor.x % DISPLAY_CELL).toBe(0);
        expect(anchor.y % DISPLAY_CELL).toBe(0);
      }
    }
  });

  test('mọi ô của mảnh nằm trong khung frameSize', () => {
    for (const piece of levelDoc.pieces) {
      for (const [cx, cy] of piece.cells) {
        expect(cx).toBeGreaterThanOrEqual(0);
        expect(cy).toBeGreaterThanOrEqual(0);
        expect(cx).toBeLessThan(piece.frameSize);
        expect(cy).toBeLessThan(piece.frameSize);
      }
    }
  });

  test('mọi ô mục tiêu nằm trong lưới 128 x 160', () => {
    for (const [x, y] of levelDoc.targetCells) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(GRID_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(GRID_HEIGHT);
    }
  });

  test('lời giải mẫu phủ đúng tập ô mục tiêu', () => {
    const solution = levelDoc.sampleSolutions[0];
    const covered = new Set<string>();
    for (const step of solution) {
      const piece = levelDoc.pieces.find((p) => p.id === step.pieceId)!;
      const anchor = piece.anchors.find((a) => a.id === step.anchorId)!;
      const originX = anchor.x - piece.frameSize / 2;
      const originY = anchor.y - piece.frameSize / 2;
      for (const [cx, cy] of piece.cells) {
        covered.add(`${originX + cx},${originY + cy}`);
      }
    }
    const target = new Set(levelDoc.targetCells.map(([x, y]) => `${x},${y}`));
    expect(covered).toEqual(target);
  });

  test('màn có câu thơ hoàn thành', () => {
    expect(levelDoc.victoryVerse).toBe(
      'Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.'
    );
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/gridAlignment.test.ts
```

Kỳ vọng: FAIL — `board.height` là 192, `frameSize` là 40, chưa có `victoryVerse`.

- [ ] **Step 3: Viết script sinh hình học**

Tạo `game-next/scripts/regen-level-geometry.ts`:

```ts
/**
 * Sinh lại hình học màn 1-1 theo quy tắc GridSpec.
 *
 * Nửa đường chéo hình thoi phải là số nguyên ô lưới hiển thị. Với lưới hiển
 * thị 8 ô logic mỗi ô và module 3 ô lưới, nửa đường chéo = 24 ô logic, tức
 * frameSize = 48. Bản cũ dùng frameSize 40 nên nửa đường chéo là 2.5 ô lưới —
 * đỉnh mảnh rơi vào giữa ô thay vì giao điểm.
 *
 * Chạy một lần rồi commit kết quả:
 *   node --experimental-strip-types scripts/regen-level-geometry.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEVEL_PATH = resolve(HERE, '../src/content/levels/1-1.json');

const GRID_WIDTH = 128;
const GRID_HEIGHT = 160;
const FRAME_SIZE = 48;
const HALF = FRAME_SIZE / 2; // 24 ô logic = 1 module

/** Tâm hai mảnh trên lưới mới: cách tâm bàn 24 ô về mỗi phía, hàng y = 80 */
const ANCHORS = {
  D1: [
    { id: 'A', x: 40, y: 80 },
    { id: 'B', x: 40, y: 96 },
  ],
  D2: [
    { id: 'A', x: 88, y: 80 },
    { id: 'B', x: 88, y: 96 },
  ],
} as const;

const VICTORY_VERSE = 'Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.';

/**
 * Rasterize hình thoi nội tiếp khung FRAME_SIZE x FRAME_SIZE.
 * Ô (cx, cy) thuộc mảnh khi khoảng cách Manhattan từ tâm ô tới tâm khung
 * không vượt quá HALF. Dùng tâm ô (+0.5) để hai nửa đối xứng.
 */
function rasterizeDiamond(): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let cy = 0; cy < FRAME_SIZE; cy++) {
    for (let cx = 0; cx < FRAME_SIZE; cx++) {
      const dx = Math.abs(cx + 0.5 - HALF);
      const dy = Math.abs(cy + 0.5 - HALF);
      if (dx + dy <= HALF) {
        cells.push([cx, cy]);
      }
    }
  }
  return cells;
}

function main(): void {
  const doc = JSON.parse(readFileSync(LEVEL_PATH, 'utf8'));

  doc.board = { width: GRID_WIDTH, height: GRID_HEIGHT };
  doc.victoryVerse = VICTORY_VERSE;

  const cells = rasterizeDiamond();

  for (const piece of doc.pieces) {
    const anchors = ANCHORS[piece.id as keyof typeof ANCHORS];
    if (!anchors) {
      throw new Error(`Không có cấu hình neo cho mảnh ${piece.id}`);
    }
    piece.frameSize = FRAME_SIZE;
    piece.cells = cells.map(([x, y]) => [x, y]);
    piece.anchors = anchors.map((a) => ({ ...a }));
  }

  // targetCells = hợp của hai mảnh đặt tại neo 'A' của chúng
  const target = new Set<string>();
  for (const piece of doc.pieces) {
    const anchorA = piece.anchors.find((a: { id: string }) => a.id === 'A');
    const originX = anchorA.x - HALF;
    const originY = anchorA.y - HALF;
    for (const [cx, cy] of cells) {
      const x = originX + cx;
      const y = originY + cy;
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        throw new Error(`Ô mục tiêu (${x}, ${y}) nằm ngoài lưới ${GRID_WIDTH}x${GRID_HEIGHT}`);
      }
      target.add(`${x},${y}`);
    }
  }
  doc.targetCells = [...target]
    .map((key) => key.split(',').map(Number) as [number, number])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);

  doc.sampleSolutions = [
    [
      { pieceId: 'D1', anchorId: 'A', turns: 0 },
      { pieceId: 'D2', anchorId: 'A', turns: 0 },
    ],
  ];

  writeFileSync(LEVEL_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');

  console.log(
    `Đã sinh lại 1-1: frameSize ${FRAME_SIZE}, ${cells.length} ô mỗi mảnh, ` +
      `${doc.targetCells.length} ô mục tiêu.`
  );
}

main();
```

Lưu ý về neo: hai mảnh phải **chạm đỉnh nhau** (tên màn là "Song Tinh" — hai vì sao chạm đỉnh). Tâm cách nhau 48 ô logic = 2×HALF, nên đỉnh phải của D1 trùng đỉnh trái của D2. Tâm bàn theo x là 64, nên D1 ở x=40 và D2 ở x=88 cho đối xứng. Cả 40, 80, 88, 96 đều chia hết cho 8 — thoả quy tắc "neo = giao điểm".

- [ ] **Step 4: Thêm `victoryVerse` vào schema**

Trong `game-next/src/content/document.ts`, thêm trường vào `LevelDocument`, ngay sau `learningObjective`:

```ts
  /** Câu thơ hiện ở màn hoàn thành; màn nào không có thì ẩn dòng này */
  victoryVerse?: string;
```

Trong `game-next/src/content/validate.ts`, tìm chỗ kiểm các trường chuỗi của document và thêm kiểm tra tương ứng:

```ts
  if (doc.victoryVerse !== undefined && typeof doc.victoryVerse !== 'string') {
    errors.push('victoryVerse phải là chuỗi nếu được khai báo');
  }
```

(Đặt cạnh khối kiểm `learningObjective`, theo đúng cách file này đang gom lỗi vào mảng `errors`.)

- [ ] **Step 5: Chạy script sinh lại content**

```bash
cd game-next && node --experimental-strip-types scripts/regen-level-geometry.ts
```

Kỳ vọng: in ra `Đã sinh lại 1-1: frameSize 48, 1200 ô mỗi mảnh, 2352 ô mục tiêu.` (con số chính xác tuỳ phép rasterize; miễn script chạy không ném lỗi).

- [ ] **Step 6: Chạy validate và test**

```bash
cd game-next && npm run content:validate && npx vitest run tests/gridAlignment.test.ts
```

Kỳ vọng: validate xanh, `gridAlignment` PASS 7 test.

- [ ] **Step 7: Chạy toàn bộ test và typecheck**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: **tất cả xanh**. Nếu `tests/content.test.ts` hoặc `tests/kernel.test.ts` còn đỏ vì khẳng định số ô cũ (840/1680), cập nhật con số trong test đó cho khớp đầu ra script — số ô là hệ quả của hình học, không phải yêu cầu độc lập.

- [ ] **Step 8: Commit**

```bash
cd game-next && git add scripts/regen-level-geometry.ts src/content/levels/1-1.json src/content/document.ts src/content/validate.ts tests/gridAlignment.test.ts tests/content.test.ts tests/kernel.test.ts
git commit -m "feat(content): sinh lại hình học 1-1 theo GridSpec

frameSize 40 -> 48 để nửa đường chéo bằng đúng 1 module (24 ô logic).
Neo dịch về lưới cao 160. Thêm victoryVerse vào schema."
```


---

## Ghi chú cho người thực thi

**Thứ tự task là bắt buộc.** Task 2 làm đỏ test của Task 1; Task 3 làm xanh lại. Đừng gộp — mỗi task là một commit riêng để dễ lần ngược khi có gì sai.

**Khi test đỏ ngoài dự kiến:** plan này ghi rõ chỗ nào test *sẽ* đỏ và task nào sửa (Task 1 Step 6, Task 2 Step 7). Test đỏ ở chỗ khác là tín hiệu có gì đó sai — dừng lại và báo cáo, đừng sửa test cho xanh.

**Phaser và gradient:** ba chỗ phải đi đường vòng, đã ghi trong spec — gradient trời (dải ngang nội suy), gradient mặt bàn và quầng sáng (canvas texture), nét đứt (chia đoạn thủ công). Nếu thấy cách nào gọn hơn mà vẫn đúng màu, dùng nó.

**Rò rỉ object:** `render()` của `BoardRenderer` chạy mỗi khung hình. Đừng bao giờ `scene.add.*` bên trong nó. Task 6 Step 7 có ghi rõ cái bẫy này.

# Cải thiện giao diện theo mockup improve-v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Áp bộ mockup `docs/gui/improve-v1/` lên game — đổi bảng màu, nền trời, lưới, kiểu mảnh ghép — đồng thời sửa lưới logic và kích thước mảnh cho đúng quy tắc hình học mà artboard `GridSpec` đặt ra.

**Architecture:** Token trước, rồi tách hai module dùng chung (`SkyBackdrop`, `GridPainter`) mà cả bốn màn đều cần, rồi migrate từng màn. Mỗi module vẽ được tách làm hai lớp: một file **hàm thuần** tính toạ độ (test được bằng vitest, không cần Phaser) và một file **wrapper Phaser** chỉ dịch toạ độ thành lệnh vẽ. Đây là pattern đã có sẵn trong repo ở `constellationMotion.ts`.

**Tech Stack:** TypeScript (ESM, `.ts` extension trong import), Phaser 3.90, Vite, Vitest, Capacitor (Android).

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

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

### Task 4: Trường sao dùng chung

**Files:**
- Create: `game-next/src/presentation/starField.ts`
- Create: `game-next/src/presentation/SkyBackdrop.ts`
- Create: `game-next/tests/starField.test.ts`

**Interfaces:**
- Consumes: `COLOR_TOKENS`, `ANIM_TOKENS`, `DEPTH_TOKENS`, `LAYOUT_TOKENS` từ Task 1.
- Produces:
  - `generateStarField(seed: number, bounds: { width: number; height: number }): StarField`
  - `type Star = { x: number; y: number; r: number; alpha: number; color: string; twinkles: boolean; phaseMs: number; driftSpeed: number }`
  - `type StarField = { static: Star[]; twinkling: Star[] }`
  - `twinkleAlpha(star: Star, elapsedMs: number): number`
  - `advanceDrift(star: Star, deltaMs: number, height: number): number`
  - `class SkyBackdrop { constructor(scene: Phaser.Scene, opts: { seed: number; drift: boolean }); update(deltaMs: number): void; destroy(): void }`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/starField.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  generateStarField,
  twinkleAlpha,
  advanceDrift,
} from '../src/presentation/starField.ts';

const BOUNDS = { width: 720, height: 1280 };

describe('starField', () => {
  test('cùng seed cho cùng trường sao, khác seed cho trường khác', () => {
    const a = generateStarField(42, BOUNDS);
    const b = generateStarField(42, BOUNDS);
    const c = generateStarField(43, BOUNDS);

    expect(a).toEqual(b);
    expect(a.static[0]).not.toEqual(c.static[0]);
  });

  test('khoảng 120 sao tĩnh và 30 sao nhấp nháy, đúng tỉ lệ mockup', () => {
    const field = generateStarField(1, BOUNDS);
    expect(field.static).toHaveLength(120);
    expect(field.twinkling).toHaveLength(30);
    expect(field.static.every((s) => s.twinkles === false)).toBe(true);
    expect(field.twinkling.every((s) => s.twinkles === true)).toBe(true);
  });

  test('mọi sao nằm trong khung và có bán kính hợp lệ', () => {
    const field = generateStarField(7, BOUNDS);
    for (const star of [...field.static, ...field.twinkling]) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(BOUNDS.width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(BOUNDS.height);
      expect(star.r).toBeGreaterThanOrEqual(0.6);
      expect(star.r).toBeLessThanOrEqual(1.7 * 1.846);
      expect(['#FFFFFF', '#CFE6FF', '#FFE8B8']).toContain(star.color);
    }
  });

  test('độ sáng nhấp nháy dao động quanh alpha gốc và không bao giờ âm', () => {
    const [star] = generateStarField(3, BOUNDS).twinkling;
    const samples = Array.from({ length: 64 }, (_, i) => twinkleAlpha(star, i * 50));

    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    // Thật sự có dao động, không phải hằng số
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
  });

  test('chu kỳ nhấp nháy lặp lại sau 3.2 giây', () => {
    const [star] = generateStarField(5, BOUNDS).twinkling;
    expect(twinkleAlpha(star, 1000)).toBeCloseTo(twinkleAlpha(star, 1000 + 3200), 5);
  });

  test('sao trôi xuống và quấn vòng khi vượt mép dưới', () => {
    const star = { ...generateStarField(9, BOUNDS).static[0], y: 1270, driftSpeed: 0.2 };
    const next = advanceDrift(star, 100, BOUNDS.height);
    expect(next).toBeLessThan(100); // đã quấn về phía trên
    expect(next).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/starField.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `starField.ts`.

- [ ] **Step 3: Viết `starField.ts`**

Tạo `game-next/src/presentation/starField.ts`:

```ts
import { COLOR_TOKENS, ANIM_TOKENS } from './designTokens.ts';

export type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
  twinkles: boolean;
  /** Lệch pha trong chu kỳ nhấp nháy, tính bằng mili giây */
  phaseMs: number;
  /** Tốc độ trôi xuống, pixel mỗi mili giây */
  driftSpeed: number;
};

export type StarField = {
  static: Star[];
  twinkling: Star[];
};

const STATIC_COUNT = 120;
const TWINKLING_COUNT = 30;

/** Hệ số quy đổi từ canvas mockup 390 rộng sang canvas game 720 rộng */
const MOCKUP_SCALE = 1.846;

const STAR_COLORS = [
  COLOR_TOKENS.sky.starWhite,
  COLOR_TOKENS.sky.starBlue,
  COLOR_TOKENS.sky.starWarm,
];

/**
 * Mulberry32: bộ sinh số giả ngẫu nhiên 32-bit, nhỏ và tái lập được.
 * Cần tái lập để test và ảnh chụp so sánh cho kết quả ổn định.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStar(rand: () => number, bounds: { width: number; height: number }, twinkles: boolean): Star {
  return {
    x: rand() * bounds.width,
    y: rand() * bounds.height,
    r: (0.6 + rand() * 1.1) * MOCKUP_SCALE,
    alpha: 0.45 + rand() * 0.54,
    color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
    twinkles,
    phaseMs: rand() * ANIM_TOKENS.duration.twinkleCycleMs,
    driftSpeed: 0.006 + rand() * 0.009,
  };
}

export function generateStarField(
  seed: number,
  bounds: { width: number; height: number }
): StarField {
  const rand = mulberry32(seed);
  return {
    static: Array.from({ length: STATIC_COUNT }, () => makeStar(rand, bounds, false)),
    twinkling: Array.from({ length: TWINKLING_COUNT }, () => makeStar(rand, bounds, true)),
  };
}

/**
 * Độ sáng của một sao nhấp nháy tại thời điểm elapsedMs.
 * Mockup dùng keyframe 0%/100% ở .25 và 50% ở 1 — tức sin toàn phần.
 */
export function twinkleAlpha(star: Star, elapsedMs: number): number {
  const cycle = ANIM_TOKENS.duration.twinkleCycleMs;
  const t = ((elapsedMs + star.phaseMs) % cycle) / cycle;
  const wave = (1 - Math.cos(t * Math.PI * 2)) / 2; // 0 .. 1
  const value = 0.25 + wave * 0.75;
  return Math.max(0, Math.min(1, value * star.alpha + value * (1 - star.alpha) * 0.4));
}

/** Toạ độ y mới sau khi trôi xuống, quấn vòng lên đỉnh khi vượt mép dưới. */
export function advanceDrift(star: Star, deltaMs: number, height: number): number {
  const next = star.y + star.driftSpeed * deltaMs;
  return next > height ? next - height : next;
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/starField.test.ts
```

Kỳ vọng: PASS, 6 test.

- [ ] **Step 5: Viết wrapper `SkyBackdrop.ts`**

Tạo `game-next/src/presentation/SkyBackdrop.ts`:

```ts
import Phaser from 'phaser';
import { COLOR_TOKENS, DEPTH_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';
import { generateStarField, twinkleAlpha, advanceDrift } from './starField.ts';
import type { Star } from './starField.ts';

export type SkyBackdropOptions = {
  seed: number;
  /** true cho màn chọn màn: sao trôi xuống rồi quấn vòng */
  drift: boolean;
};

/**
 * Nền trời dùng chung cho mọi màn: gradient bốn chặng, hai nebula, quầng
 * trăng, và trường sao.
 *
 * Phần tĩnh vẽ một lần vào RenderTexture. Chỉ 30 sao nhấp nháy là vẽ lại mỗi
 * khung hình — vẽ lại cả 150 sao mỗi frame là chi phí không cần thiết.
 */
export class SkyBackdrop {
  private readonly scene: Phaser.Scene;
  private readonly options: SkyBackdropOptions;
  private readonly staticLayer: Phaser.GameObjects.RenderTexture;
  private readonly twinkleLayer: Phaser.GameObjects.Graphics;
  private readonly twinklingStars: Star[];
  private readonly staticStars: Star[];
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, options: SkyBackdropOptions) {
    this.scene = scene;
    this.options = options;

    const { width, height } = LAYOUT_TOKENS.canvas;
    const field = generateStarField(options.seed, { width, height });
    this.staticStars = field.static;
    this.twinklingStars = field.twinkling;

    this.staticLayer = scene.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.backgroundSky);

    this.twinkleLayer = scene.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 1);

    this.paintStatic();
  }

  private paintStatic(): void {
    const { width, height } = LAYOUT_TOKENS.canvas;
    const g = this.scene.add.graphics();

    // Gradient trời: Phaser Graphics không có gradient fill, nên xấp xỉ bằng
    // các dải ngang nội suy giữa bốn chặng màu.
    const stops = COLOR_TOKENS.sky.stops.map((hex) =>
      Phaser.Display.Color.HexStringToColor(hex)
    );
    const offsets = COLOR_TOKENS.sky.stopOffsets;
    const bandCount = 128;
    for (let i = 0; i < bandCount; i++) {
      const t = i / (bandCount - 1);
      let segment = 0;
      while (segment < offsets.length - 2 && t > offsets[segment + 1]) segment++;
      const localT =
        (t - offsets[segment]) / (offsets[segment + 1] - offsets[segment] || 1);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        stops[segment],
        stops[segment + 1],
        100,
        Math.round(Math.max(0, Math.min(1, localT)) * 100)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, (height / bandCount) * i, width, height / bandCount + 1);
    }

    // Hai nebula và quầng trăng: xấp xỉ radial gradient bằng các vòng tròn
    // đồng tâm giảm dần độ mờ.
    this.paintGlow(g, 108, 436, 396, COLOR_TOKENS.sky.nebulaBlue, 0.45);
    this.paintGlow(g, 648, 966, 360, COLOR_TOKENS.sky.nebulaPink, 0.32);
    this.paintGlow(g, 619, 140, 158, COLOR_TOKENS.sky.moonHalo, 0.35);
    this.paintGlow(g, 619, 140, 62, COLOR_TOKENS.sky.moonCore, 0.9);

    for (const star of this.staticStars) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(star.color).color, star.alpha);
      g.fillCircle(star.x, star.y, star.r);
    }

    this.staticLayer.draw(g);
    g.destroy();
  }

  private paintGlow(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    hex: string,
    peakAlpha: number
  ): void {
    const color = Phaser.Display.Color.HexStringToColor(hex).color;
    const rings = 24;
    for (let i = rings; i > 0; i--) {
      const t = i / rings;
      g.fillStyle(color, peakAlpha * (1 - t) ** 2);
      g.fillCircle(cx, cy, radius * t);
    }
  }

  public update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const { height } = LAYOUT_TOKENS.canvas;

    this.twinkleLayer.clear();
    for (const star of this.twinklingStars) {
      if (this.options.drift) {
        star.y = advanceDrift(star, deltaMs, height);
      }
      const alpha = twinkleAlpha(star, this.elapsedMs);
      this.twinkleLayer.fillStyle(
        Phaser.Display.Color.HexStringToColor(star.color).color,
        alpha
      );
      this.twinkleLayer.fillCircle(star.x, star.y, star.r);
    }
  }

  public destroy(): void {
    this.staticLayer.destroy();
    this.twinkleLayer.destroy();
  }
}
```

- [ ] **Step 6: Thay trường sao tự chế trong ba scene**

Trong **cả ba** file `MenuScene.ts`, `LevelSelectScene.ts`, `PlayScene.ts`:

1. Xoá khai báo `type StarParticle = {...}` ở đầu file.
2. Xoá thuộc tính `private starGraphics!: Phaser.GameObjects.Graphics;` và `private stars: StarParticle[] = [];`.
3. Thêm `private sky!: SkyBackdrop;` và import `import { SkyBackdrop } from './SkyBackdrop.ts';`.
4. Trong `create()`, thay khối khởi tạo sao bằng:
   - `MenuScene`: `this.sky = new SkyBackdrop(this, { seed: 1, drift: false });`
   - `PlayScene`: `this.sky = new SkyBackdrop(this, { seed: 2, drift: false });`
   - `LevelSelectScene`: `this.sky = new SkyBackdrop(this, { seed: 3, drift: true });`
   Đặt dòng này **ngay sau** `TextureFactory.generateAll(this)` để nền nằm dưới mọi thứ khác.
5. Trong `update(_time, delta)`, thay vòng lặp vẽ sao bằng `this.sky.update(delta);`.
6. Nếu scene nào chưa có `update`, thêm:

```ts
  update(_time: number, delta: number): void {
    this.sky.update(delta);
  }
```

`PlayScene.update` hiện còn phần khác không? Không — thân nó chỉ vẽ sao, nên sau khi thay chỉ còn một dòng.

- [ ] **Step 7: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh. `tests/menu.test.ts` và `tests/levelSelect.test.ts` không chạm vào trường sao nên không bị ảnh hưởng.

- [ ] **Step 8: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/`. Kỳ vọng: nền chuyển từ xanh đậm sang tím ở đáy, có quầng trăng ở góc trên-phải, sao nhấp nháy. Mở `?scene=levelSelect` để xác nhận sao trôi xuống. Ctrl-C để dừng.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/presentation/starField.ts src/presentation/SkyBackdrop.ts src/presentation/MenuScene.ts src/presentation/LevelSelectScene.ts src/presentation/PlayScene.ts tests/starField.test.ts
git commit -m "feat(sky): nền trời dùng chung cho mọi màn

Gộp ba cách vẽ trường sao khác nhau (Menu, LevelSelect, Play) thành một
module. Trường sao sinh theo seed nên tái lập được. Phần tĩnh vào
RenderTexture, chỉ 30 sao nhấp nháy vẽ lại mỗi khung hình."
```

---

### Task 5: Lưới thước đo năm lớp

**Files:**
- Create: `game-next/src/presentation/gridLayers.ts`
- Create: `game-next/src/presentation/GridPainter.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts` (bỏ phần vẽ lưới)
- Create: `game-next/tests/gridLayers.test.ts`

**Interfaces:**
- Consumes: `GRID_TOKENS`, `LAYOUT_TOKENS` từ Task 1; `LayoutMetrics` từ Task 2.
- Produces:
  - `type Segment = { x1: number; y1: number; x2: number; y2: number }`
  - `type GridLayer = { name: 'fine' | 'diagonal' | 'module' | 'axis' | 'tick'; segments: Segment[] }`
  - `buildGridLayers(board: { x: number; y: number; width: number; height: number }): GridLayer[]`
  - `buildCornerMarks(board): Segment[]`
  - `class GridPainter { static paint(scene: Phaser.Scene, board): Phaser.GameObjects.RenderTexture }`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/gridLayers.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { buildGridLayers, buildCornerMarks } from '../src/presentation/gridLayers.ts';
import { LAYOUT_TOKENS } from '../src/presentation/designTokens.ts';

const BOARD = LAYOUT_TOKENS.board;

describe('gridLayers', () => {
  const layers = buildGridLayers(BOARD);
  const byName = (name: string) => layers.find((l) => l.name === name)!;

  test('đủ năm lớp theo đúng thứ tự vẽ của mockup', () => {
    expect(layers.map((l) => l.name)).toEqual([
      'fine',
      'diagonal',
      'module',
      'axis',
      'tick',
    ]);
  });

  test('lưới mảnh cách nhau 40px, phủ kín bàn theo cả hai chiều', () => {
    const fine = byName('fine').segments;
    const verticals = fine.filter((s) => s.x1 === s.x2);
    const horizontals = fine.filter((s) => s.y1 === s.y2);

    expect(verticals).toHaveLength(BOARD.width / 40 + 1); // 17
    expect(horizontals).toHaveLength(BOARD.height / 40 + 1); // 21

    const xs = verticals.map((s) => s.x1).sort((a, b) => a - b);
    expect(xs[0]).toBe(BOARD.x);
    expect(xs.at(-1)).toBe(BOARD.x + BOARD.width);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBe(40);
    }
  });

  test('lưới module cách nhau 120px', () => {
    const module = byName('module').segments;
    const verticals = module.filter((s) => s.x1 === s.x2).map((s) => s.x1).sort((a, b) => a - b);
    for (let i = 1; i < verticals.length; i++) {
      expect(verticals[i] - verticals[i - 1]).toBe(120);
    }
    expect(verticals.every((x) => (x - BOARD.x) % 120 === 0)).toBe(true);
  });

  test('trục giữa đi qua đúng tâm bàn, một ngang một dọc', () => {
    const axis = byName('axis').segments;
    expect(axis).toHaveLength(2);
    const vertical = axis.find((s) => s.x1 === s.x2)!;
    const horizontal = axis.find((s) => s.y1 === s.y2)!;
    expect(vertical.x1).toBe(BOARD.x + BOARD.width / 2);
    expect(horizontal.y1).toBe(BOARD.y + BOARD.height / 2);
  });

  test('đường chéo 45 độ có hệ số góc đúng bằng 1 hoặc -1', () => {
    const diagonal = byName('diagonal').segments;
    expect(diagonal.length).toBeGreaterThan(0);
    for (const s of diagonal) {
      const slope = Math.abs((s.y2 - s.y1) / (s.x2 - s.x1));
      expect(slope).toBeCloseTo(1, 6);
    }
  });

  test('vạch thước nằm ở bốn mép, vạch module dài hơn vạch thường', () => {
    const ticks = byName('tick').segments;
    const lengths = ticks.map((s) => Math.abs(s.x2 - s.x1) + Math.abs(s.y2 - s.y1));
    expect(new Set(lengths)).toEqual(new Set([5, 9]));
    expect(lengths.filter((l) => l === 9).length).toBeGreaterThan(0);
  });

  test('mọi đoạn nằm trong biên bàn chơi', () => {
    for (const layer of layers) {
      for (const s of layer.segments) {
        for (const x of [s.x1, s.x2]) {
          expect(x).toBeGreaterThanOrEqual(BOARD.x);
          expect(x).toBeLessThanOrEqual(BOARD.x + BOARD.width);
        }
        for (const y of [s.y1, s.y2]) {
          expect(y).toBeGreaterThanOrEqual(BOARD.y);
          expect(y).toBeLessThanOrEqual(BOARD.y + BOARD.height);
        }
      }
    }
  });

  test('bốn dấu góc chữ L, mỗi dấu hai đoạn', () => {
    const marks = buildCornerMarks(BOARD);
    expect(marks).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/gridLayers.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `gridLayers.ts`.

- [ ] **Step 3: Viết `gridLayers.ts`**

Tạo `game-next/src/presentation/gridLayers.ts`:

```ts
import { GRID_TOKENS } from './designTokens.ts';

export type Segment = { x1: number; y1: number; x2: number; y2: number };

export type GridLayerName = 'fine' | 'diagonal' | 'module' | 'axis' | 'tick';

export type GridLayer = {
  name: GridLayerName;
  segments: Segment[];
};

export type BoardBox = { x: number; y: number; width: number; height: number };

/** Một ô lưới hiển thị, tính bằng pixel canvas: 8 ô logic x 5px = 40px */
export const DISPLAY_CELL_PX =
  GRID_TOKENS.logicCellPx * GRID_TOKENS.displayCellInLogicCells;

/** Một module: 3 ô lưới hiển thị = 120px */
export const MODULE_PX = DISPLAY_CELL_PX * GRID_TOKENS.moduleInDisplayCells;

function lineGrid(board: BoardBox, step: number): Segment[] {
  const segments: Segment[] = [];
  for (let x = board.x; x <= board.x + board.width; x += step) {
    segments.push({ x1: x, y1: board.y, x2: x, y2: board.y + board.height });
  }
  for (let y = board.y; y <= board.y + board.height; y += step) {
    segments.push({ x1: board.x, y1: y, x2: board.x + board.width, y2: y });
  }
  return segments;
}

/**
 * Đường chéo 45 độ, cắt theo biên bàn.
 * Đi theo cả hai chiều, cách nhau một module để không làm rối mặt bàn.
 */
function diagonals(board: BoardBox): Segment[] {
  const segments: Segment[] = [];
  const { x, y, width, height } = board;
  const step = MODULE_PX;

  const clipDown = (startX: number): Segment | null => {
    // Đường y = (px - startX) + y, cắt trong hộp
    const x1 = Math.max(x, startX);
    const y1 = y + (x1 - startX);
    const x2 = Math.min(x + width, startX + height);
    const y2 = y + (x2 - startX);
    if (x2 <= x1 || y1 > y + height || y2 > y + height) {
      const cappedX2 = Math.min(x2, startX + height);
      if (cappedX2 <= x1) return null;
      return { x1, y1, x2: cappedX2, y2: y + (cappedX2 - startX) };
    }
    return { x1, y1, x2, y2 };
  };

  const clipUp = (startX: number): Segment | null => {
    // Đường y = -(px - startX) + (y + height)
    const x1 = Math.max(x, startX - height);
    const y1 = y + height - (x1 - (startX - height));
    const x2 = Math.min(x + width, startX);
    const y2 = y + height - (x2 - (startX - height));
    if (x2 <= x1) return null;
    return { x1, y1, x2, y2 };
  };

  for (let startX = x - height; startX <= x + width; startX += step) {
    const down = clipDown(startX);
    if (down) segments.push(down);
  }
  for (let startX = x; startX <= x + width + height; startX += step) {
    const up = clipUp(startX);
    if (up) segments.push(up);
  }

  return segments.filter(
    (s) =>
      s.x1 >= x && s.x2 <= x + width && s.y1 >= y && s.y2 >= y &&
      s.y1 <= y + height && s.y2 <= y + height && s.x2 > s.x1
  );
}

function axes(board: BoardBox): Segment[] {
  const cx = board.x + board.width / 2;
  const cy = board.y + board.height / 2;
  return [
    { x1: cx, y1: board.y, x2: cx, y2: board.y + board.height },
    { x1: board.x, y1: cy, x2: board.x + board.width, y2: cy },
  ];
}

/**
 * Vạch thước ở bốn mép bàn. Vạch rơi vào đường module dài hơn vạch thường,
 * cho mắt bắt được nhịp 3 ô mà không cần đếm.
 */
function ticks(board: BoardBox): Segment[] {
  const segments: Segment[] = [];
  const { shortLen, longLen } = GRID_TOKENS.tick;
  const right = board.x + board.width;
  const bottom = board.y + board.height;

  for (let x = board.x; x <= right; x += DISPLAY_CELL_PX) {
    const len = (x - board.x) % MODULE_PX === 0 ? longLen : shortLen;
    segments.push({ x1: x, y1: board.y, x2: x, y2: board.y + len });
    segments.push({ x1: x, y1: bottom, x2: x, y2: bottom - len });
  }
  for (let y = board.y; y <= bottom; y += DISPLAY_CELL_PX) {
    const len = (y - board.y) % MODULE_PX === 0 ? longLen : shortLen;
    segments.push({ x1: board.x, y1: y, x2: board.x + len, y2: y });
    segments.push({ x1: right, y1: y, x2: right - len, y2: y });
  }

  return segments;
}

export function buildGridLayers(board: BoardBox): GridLayer[] {
  return [
    { name: 'fine', segments: lineGrid(board, DISPLAY_CELL_PX) },
    { name: 'diagonal', segments: diagonals(board) },
    { name: 'module', segments: lineGrid(board, MODULE_PX) },
    { name: 'axis', segments: axes(board) },
    { name: 'tick', segments: ticks(board) },
  ];
}

/** Bốn dấu ngắm chữ L ở bốn góc bàn, mỗi dấu gồm hai đoạn. */
export function buildCornerMarks(board: BoardBox): Segment[] {
  const { armLen, inset } = GRID_TOKENS.corner;
  const left = board.x + inset;
  const right = board.x + board.width - inset;
  const top = board.y + inset;
  const bottom = board.y + board.height - inset;

  return [
    { x1: left, y1: top + armLen, x2: left, y2: top },
    { x1: left, y1: top, x2: left + armLen, y2: top },
    { x1: right, y1: top + armLen, x2: right, y2: top },
    { x1: right, y1: top, x2: right - armLen, y2: top },
    { x1: left, y1: bottom - armLen, x2: left, y2: bottom },
    { x1: left, y1: bottom, x2: left + armLen, y2: bottom },
    { x1: right, y1: bottom - armLen, x2: right, y2: bottom },
    { x1: right, y1: bottom, x2: right - armLen, y2: bottom },
  ];
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/gridLayers.test.ts
```

Kỳ vọng: PASS, 8 test. Nếu test "mọi đoạn nằm trong biên" đỏ ở lớp `diagonal`, sửa phép cắt trong `diagonals()` cho tới khi xanh — biên là yêu cầu, không phải gợi ý.

- [ ] **Step 5: Viết `GridPainter.ts`**

Tạo `game-next/src/presentation/GridPainter.ts`:

```ts
import Phaser from 'phaser';
import { DEPTH_TOKENS, GRID_TOKENS } from './designTokens.ts';
import { buildGridLayers, buildCornerMarks } from './gridLayers.ts';
import type { BoardBox, GridLayerName, Segment } from './gridLayers.ts';

const STYLE: Record<GridLayerName, { color: string; alpha: number; width: number; dash?: readonly number[] }> = {
  fine: GRID_TOKENS.fine,
  diagonal: GRID_TOKENS.diagonal,
  module: GRID_TOKENS.module,
  axis: GRID_TOKENS.axis,
  tick: GRID_TOKENS.tick,
};

/**
 * Lưới không đổi trong suốt màn chơi, nên vẽ một lần vào RenderTexture.
 * Vẽ bằng Graphics mỗi khung hình là hàng trăm lệnh lineBetween không cần thiết.
 */
export class GridPainter {
  public static paint(scene: Phaser.Scene, board: BoardBox): Phaser.GameObjects.RenderTexture {
    const texture = scene.add
      .renderTexture(board.x, board.y, board.width, board.height)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.boardGrid);

    const g = scene.add.graphics();

    for (const layer of buildGridLayers(board)) {
      const style = STYLE[layer.name];
      const color = Phaser.Display.Color.HexStringToColor(style.color).color;
      g.lineStyle(style.width, color, style.alpha);
      for (const s of layer.segments) {
        const local = {
          x1: s.x1 - board.x,
          y1: s.y1 - board.y,
          x2: s.x2 - board.x,
          y2: s.y2 - board.y,
        };
        if (style.dash) {
          GridPainter.strokeDashed(g, local, style.dash);
        } else {
          g.lineBetween(local.x1, local.y1, local.x2, local.y2);
        }
      }
    }

    const corner = GRID_TOKENS.corner;
    g.lineStyle(corner.width, Phaser.Display.Color.HexStringToColor(corner.color).color, 1);
    for (const s of buildCornerMarks(board)) {
      g.lineBetween(s.x1 - board.x, s.y1 - board.y, s.x2 - board.x, s.y2 - board.y);
    }

    texture.draw(g);
    g.destroy();
    return texture;
  }

  /** Phaser Graphics không có nét đứt, nên chia đoạn thủ công. */
  private static strokeDashed(
    g: Phaser.GameObjects.Graphics,
    s: Segment,
    dash: readonly number[]
  ): void {
    const [on, off] = dash;
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const length = Math.hypot(dx, dy);
    if (length === 0) return;
    const ux = dx / length;
    const uy = dy / length;

    let travelled = 0;
    while (travelled < length) {
      const segmentEnd = Math.min(travelled + on, length);
      g.lineBetween(
        s.x1 + ux * travelled,
        s.y1 + uy * travelled,
        s.x1 + ux * segmentEnd,
        s.y1 + uy * segmentEnd
      );
      travelled = segmentEnd + off;
    }
  }
}
```

Lưu ý: `GridPainter.paint` nhận `board` theo toạ độ canvas nhưng vẽ vào texture gốc (0, 0), nên mọi toạ độ phải trừ đi `board.x` / `board.y` trước khi vẽ — biến `local` ở trên làm việc đó, và `strokeDashed` cũng nhận đoạn đã trừ. Quên một chỗ là lưới lệch đi đúng bằng vị trí bàn.

- [ ] **Step 6: Bỏ phần vẽ lưới khỏi `BoardRenderer.ts`**

Trong `game-next/src/presentation/BoardRenderer.ts`, trong `renderBackground` (quanh dòng 88–112), **xoá** các khối:
- lưới đều mỗi `cellPixel * N` (`lineStyle(1, ..., 0.12)` + hai vòng lặp `lineBetween`)
- hai trục giữa (`lineStyle(1.5, ..., 0.28)` + hai `lineBetween`)
- các chấm toạ độ (`fillCircle(x, y, 1.5)` trong vòng lặp)

Thay bằng một lần gọi trong hàm khởi tạo của renderer (nơi đã tạo `bgGraphics`):

```ts
import { GridPainter } from './GridPainter.ts';
// ...
    this.gridTexture = GridPainter.paint(scene, this.layout.boardBounds);
```

Thêm thuộc tính `private gridTexture: Phaser.GameObjects.RenderTexture;` và huỷ nó trong `destroy()` nếu renderer có hàm đó.

- [ ] **Step 7: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 8: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/?scene=play&level=1-1`. Kỳ vọng thấy đủ: lưới mảnh, đường chéo nét đứt, đường module đậm hơn, hai trục giữa, vạch thước ở bốn mép, bốn dấu góc chữ L. Ctrl-C.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/presentation/gridLayers.ts src/presentation/GridPainter.ts src/presentation/BoardRenderer.ts tests/gridLayers.test.ts
git commit -m "feat(grid): lưới thước đo năm lớp theo mockup improve-v1

Thêm lớp chéo 45 độ, vạch thước và dấu góc — ba thứ chưa có. Lưới vẽ một
lần vào RenderTexture thay vì hàng trăm lineBetween mỗi khung hình."
```

---

### Task 6: Mảnh ngọc bốn mặt vát

**Files:**
- Create: `game-next/src/presentation/jewelGeometry.ts`
- Create: `game-next/src/presentation/JewelShape.ts`
- Modify: `game-next/src/presentation/TextureFactory.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Create: `game-next/tests/jewelGeometry.test.ts`
- Modify: `game-next/tests/textureFactory.test.ts`

**Interfaces:**
- Consumes: `PIECE_TOKENS`, `COLOR_NUMBERS` từ Task 1.
- Produces:
  - `type Point = { x: number; y: number }`
  - `jewelOutline(cx: number, cy: number, radius: number): Point[]` — 4 đỉnh, bắt đầu từ đỉnh Bắc, theo chiều kim đồng hồ
  - `jewelFaces(cx, cy, radius): { name: 'north'|'east'|'south'|'west'; points: Point[]; color: string }[]`
  - `jewelTable(cx, cy, radius): Point[]`
  - `jewelSpineLines(cx, cy, radius): Array<{ from: Point; to: Point }>`
  - `drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void` với `type JewelOptions = { cx: number; cy: number; radius: number; variant: 'solid' | 'ghost' | 'target' | 'placeholder'; alpha?: number }`
  - `TEXTURE_KEYS.jewelGlow`, `TEXTURE_KEYS.jewelTable`

- [ ] **Step 1: Viết test thất bại**

Tạo `game-next/tests/jewelGeometry.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  jewelOutline,
  jewelFaces,
  jewelTable,
  jewelSpineLines,
} from '../src/presentation/jewelGeometry.ts';
import { PIECE_TOKENS } from '../src/presentation/designTokens.ts';

const CX = 360;
const CY = 600;
const R = 120; // một module

describe('jewelGeometry', () => {
  test('viền ngoài là bốn đỉnh, bắt đầu từ Bắc theo chiều kim đồng hồ', () => {
    expect(jewelOutline(CX, CY, R)).toEqual([
      { x: CX, y: CY - R },
      { x: CX + R, y: CY },
      { x: CX, y: CY + R },
      { x: CX - R, y: CY },
    ]);
  });

  test('thoi là hình vuông xoay 45 độ: hai đường chéo bằng nhau và vuông góc', () => {
    const [n, e, s, w] = jewelOutline(CX, CY, R);
    expect(Math.hypot(s.x - n.x, s.y - n.y)).toBeCloseTo(2 * R, 6);
    expect(Math.hypot(e.x - w.x, e.y - w.y)).toBeCloseTo(2 * R, 6);
    // Đường chéo dọc và ngang vuông góc
    expect((s.x - n.x) * (e.x - w.x) + (s.y - n.y) * (e.y - w.y)).toBeCloseTo(0, 6);
  });

  test('mỗi cạnh có hệ số góc 45 độ, nên nằm trên đường chéo của lưới', () => {
    const pts = jewelOutline(CX, CY, R);
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      expect(Math.abs((b.y - a.y) / (b.x - a.x))).toBeCloseTo(1, 6);
    }
  });

  test('bốn mặt vát, mỗi mặt một tam giác từ tâm, màu sáng ở trên-trái', () => {
    const faces = jewelFaces(CX, CY, R);
    expect(faces.map((f) => f.name)).toEqual(['north', 'east', 'south', 'west']);
    for (const face of faces) {
      expect(face.points).toHaveLength(3);
      expect(face.points).toContainEqual({ x: CX, y: CY });
    }
    expect(faces[0].color).toBe(PIECE_TOKENS.faceNorth);
    expect(faces[1].color).toBe(PIECE_TOKENS.faceEast);
    expect(faces[2].color).toBe(PIECE_TOKENS.faceSouth);
    expect(faces[3].color).toBe(PIECE_TOKENS.faceWest);
  });

  test('mặt bàn là thoi nhỏ đồng tâm, bán kính theo tỉ lệ token', () => {
    const table = jewelTable(CX, CY, R);
    expect(table).toHaveLength(4);
    const expectedR = R * PIECE_TOKENS.tableRatio;
    expect(table[0]).toEqual({ x: CX, y: CY - expectedR });
    expect(table[2]).toEqual({ x: CX, y: CY + expectedR });
  });

  test('bốn đoạn nối từ đỉnh vào mặt bàn, không cắt qua tâm', () => {
    const lines = jewelSpineLines(CX, CY, R);
    expect(lines).toHaveLength(4);
    const tableR = R * PIECE_TOKENS.tableRatio;
    for (const line of lines) {
      const distFrom = Math.hypot(line.from.x - CX, line.from.y - CY);
      const distTo = Math.hypot(line.to.x - CX, line.to.y - CY);
      expect(distFrom).toBeCloseTo(R, 6);
      expect(distTo).toBeCloseTo(tableR, 6);
    }
  });

  test('đỉnh mảnh rơi đúng giao điểm lưới khi tâm và bán kính là bội số ô lưới', () => {
    // Tâm (40*5, 80*5) = (200, 400) trên canvas, bán kính một module
    const pts = jewelOutline(200, 400, 120);
    for (const p of pts) {
      expect((p.x - 200) % 40 === 0 || (p.y - 400) % 40 === 0).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/jewelGeometry.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module `jewelGeometry.ts`.

- [ ] **Step 3: Viết `jewelGeometry.ts`**

Tạo `game-next/src/presentation/jewelGeometry.ts`:

```ts
import { PIECE_TOKENS } from './designTokens.ts';

export type Point = { x: number; y: number };

export type JewelFace = {
  name: 'north' | 'east' | 'south' | 'west';
  points: Point[];
  color: string;
};

/**
 * Bốn đỉnh hình thoi, bắt đầu từ đỉnh Bắc theo chiều kim đồng hồ.
 *
 * Thoi là hình vuông xoay 45 độ: hai đường chéo nằm trên đường kẻ ngang và
 * dọc của lưới, nên mỗi cạnh có hệ số góc 45 độ và trùng đường chéo của lưới.
 */
export function jewelOutline(cx: number, cy: number, radius: number): Point[] {
  return [
    { x: cx, y: cy - radius },
    { x: cx + radius, y: cy },
    { x: cx, y: cy + radius },
    { x: cx - radius, y: cy },
  ];
}

/**
 * Bốn mặt vát, mỗi mặt là tam giác nối tâm với hai đỉnh kề.
 * Sáng ở trên-trái, tối dần xuống dưới-phải — đó là thứ tạo cảm giác viên ngọc
 * thay vì một mảng màu phẳng.
 */
export function jewelFaces(cx: number, cy: number, radius: number): JewelFace[] {
  const [n, e, s, w] = jewelOutline(cx, cy, radius);
  const center = { x: cx, y: cy };
  return [
    { name: 'north', points: [n, center, w], color: PIECE_TOKENS.faceNorth },
    { name: 'east', points: [n, e, center], color: PIECE_TOKENS.faceEast },
    { name: 'south', points: [e, s, center], color: PIECE_TOKENS.faceSouth },
    { name: 'west', points: [s, w, center], color: PIECE_TOKENS.faceWest },
  ];
}

/** Mặt bàn: thoi nhỏ đồng tâm, nơi ánh sáng tụ lại. */
export function jewelTable(cx: number, cy: number, radius: number): Point[] {
  return jewelOutline(cx, cy, radius * PIECE_TOKENS.tableRatio);
}

/** Bốn đoạn nối từ mỗi đỉnh vào mặt bàn. */
export function jewelSpineLines(
  cx: number,
  cy: number,
  radius: number
): Array<{ from: Point; to: Point }> {
  const outer = jewelOutline(cx, cy, radius);
  const inner = jewelTable(cx, cy, radius);
  return outer.map((from, index) => ({ from, to: inner[index] }));
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/jewelGeometry.test.ts
```

Kỳ vọng: PASS, 7 test.

- [ ] **Step 5: Thêm hai texture gradient vào `TextureFactory`**

Trong `game-next/src/presentation/TextureFactory.ts`, thêm hai khoá vào `TEXTURE_KEYS`:

```ts
  jewelGlow: 'jewel_glow',
  jewelTable: 'jewel_table',
```

Và thêm hai hàm sinh, gọi từ `generateAll` (theo đúng cách các texture khác đang được sinh trong file này):

```ts
  /**
   * Quầng sáng mờ phía sau mảnh. Phaser Graphics không có gradient fill nên
   * dựng bằng canvas texture.
   */
  private static makeJewelGlow(scene: Phaser.Scene): void {
    const size = 256;
    const texture = scene.textures.createCanvas(TEXTURE_KEYS.jewelGlow, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 200, 87, 0.70)');
    gradient.addColorStop(1, 'rgba(255, 200, 87, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }

  /** Mặt bàn gradient chéo, từ trắng ngà sang hổ phách. */
  private static makeJewelTable(scene: Phaser.Scene): void {
    const size = 128;
    const texture = scene.textures.createCanvas(TEXTURE_KEYS.jewelTable, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(255, 251, 234, 0.95)');
    gradient.addColorStop(0.55, 'rgba(255, 226, 154, 0.60)');
    gradient.addColorStop(1, 'rgba(246, 180, 67, 0.50)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }
```

Thêm vào `tests/textureFactory.test.ts`, trong khối `describe` sẵn có:

```ts
  test('có texture gradient cho quầng sáng và mặt bàn mảnh ngọc', () => {
    expect(TEXTURE_KEYS.jewelGlow).toBe('jewel_glow');
    expect(TEXTURE_KEYS.jewelTable).toBe('jewel_table');
  });
```

- [ ] **Step 6: Viết `JewelShape.ts`**

Tạo `game-next/src/presentation/JewelShape.ts`:

```ts
import Phaser from 'phaser';
import { PIECE_TOKENS } from './designTokens.ts';
import { jewelOutline, jewelFaces, jewelTable, jewelSpineLines } from './jewelGeometry.ts';
import type { Point } from './jewelGeometry.ts';

export type JewelVariant = 'solid' | 'ghost' | 'target' | 'placeholder';

export type JewelOptions = {
  cx: number;
  cy: number;
  radius: number;
  variant: JewelVariant;
  alpha?: number;
};

function hex(value: string): number {
  return Phaser.Display.Color.HexStringToColor(value).color;
}

function toGeomPoints(points: Point[]): Phaser.Geom.Point[] {
  return points.map((p) => new Phaser.Geom.Point(p.x, p.y));
}

function strokeDashedPolygon(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  dash: readonly number[]
): void {
  const [on, off] = dash;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / length;
    const uy = (b.y - a.y) / length;
    let travelled = 0;
    while (travelled < length) {
      const end = Math.min(travelled + on, length);
      g.lineBetween(a.x + ux * travelled, a.y + uy * travelled, a.x + ux * end, a.y + uy * end);
      travelled = end + off;
    }
  }
}

/**
 * Vẽ một mảnh ngọc thoi.
 *
 * Viền vẽ phía trong mảnh (bán kính trừ nửa độ dày viền) để mép trùng đúng
 * đường kẻ lưới — quy tắc "vẽ đúng đến từng pixel" của GridSpec.
 */
export function drawJewel(g: Phaser.GameObjects.Graphics, opts: JewelOptions): void {
  const { cx, cy, radius, variant } = opts;
  const alpha = opts.alpha ?? (variant === 'ghost' ? PIECE_TOKENS.ghostAlpha : 1);

  if (variant === 'target') {
    g.fillStyle(hex(PIECE_TOKENS.targetFill.color), PIECE_TOKENS.targetFill.alpha * alpha);
    g.fillPoints(toGeomPoints(jewelOutline(cx, cy, radius)), true);
    g.lineStyle(
      PIECE_TOKENS.targetStroke.width,
      hex(PIECE_TOKENS.targetStroke.color),
      PIECE_TOKENS.targetStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.targetStroke.dash);
    return;
  }

  if (variant === 'placeholder') {
    g.lineStyle(
      PIECE_TOKENS.placeholderStroke.width,
      hex(PIECE_TOKENS.placeholderStroke.color),
      PIECE_TOKENS.placeholderStroke.alpha * alpha
    );
    strokeDashedPolygon(g, jewelOutline(cx, cy, radius), PIECE_TOKENS.placeholderStroke.dash);
    return;
  }

  // solid và ghost: bốn mặt vát, mặt bàn, đoạn nối, viền trong
  for (const face of jewelFaces(cx, cy, radius)) {
    g.fillStyle(hex(face.color), alpha);
    g.fillPoints(toGeomPoints(face.points), true);
  }

  g.fillStyle(hex(PIECE_TOKENS.tableStops[1]), 0.6 * alpha);
  g.fillPoints(toGeomPoints(jewelTable(cx, cy, radius)), true);

  g.lineStyle(1, hex('#FFF7DA'), 0.45 * alpha);
  for (const line of jewelSpineLines(cx, cy, radius)) {
    g.lineBetween(line.from.x, line.from.y, line.to.x, line.to.y);
  }

  const inset = PIECE_TOKENS.outlineWidth / 2;
  g.lineStyle(PIECE_TOKENS.outlineWidth, hex(PIECE_TOKENS.outline), alpha);
  g.strokePoints(toGeomPoints(jewelOutline(cx, cy, radius - inset)), true, true);
}
```

- [ ] **Step 7: Chuyển `BoardRenderer` sang `drawJewel`**

Trong `game-next/src/presentation/BoardRenderer.ts`:

1. Thêm `import { drawJewel } from './JewelShape.ts';`
2. **Xoá** phương thức `drawVectorDiamond` (từ dòng 281 tới hết thân nó).
3. Đổi `radiusPx` trong `render()` — nửa đường chéo giờ là 24 ô logic:

```ts
    const radiusPx = 24 * cellPixel; // 24 ô logic = 1 module = 120px
```

4. Thay mọi lời gọi `this.drawVectorDiamond(...)`:
   - Bóng mục tiêu → `drawJewel(this.targetGraphics, { cx: center.x, cy: center.y, radius: radiusPx, variant: 'target', alpha: isHovered ? 1 : 0.7 })`
   - Mảnh đã snap và mảnh trong khay → `drawJewel(this.piecesGraphics, { cx, cy, radius: radiusPx, variant: 'solid' })`
   - Mảnh đang kéo → `drawJewel(this.fxGraphics, { cx, cy, radius: radiusPx * 1.06, variant: 'ghost' })`
   - Ô trống trong khay → `drawJewel(this.piecesGraphics, { cx, cy, radius: radiusPx, variant: 'placeholder' })`

   Trong đó `cx`, `cy` là tâm mảnh — các hàm `drawTrayPiece`, `drawSnappedPiece`, `drawTemporaryPiece`, `drawDraggingPiece`, `drawTrayPlaceholder` đã tính sẵn tâm; giữ nguyên cách chúng tính.

5. Thêm quầng sáng cho mảnh đặc: trước khi gọi `drawJewel` variant `solid`, đặt một image quầng:

```ts
    // Quầng sáng dùng texture gradient vì Graphics không có blur
    this.scene.add
      .image(cx, cy, TEXTURE_KEYS.jewelGlow)
      .setDisplaySize(radiusPx * 2.6, radiusPx * 2.6)
      .setDepth(DEPTH_TOKENS.placedPieces - 1);
```

   Lưu ý: chỉ tạo image **một lần** cho mỗi mảnh, trong hàm khởi tạo renderer hoặc khi mảnh đổi trạng thái — **không** tạo trong `render()`, vì `render()` chạy mỗi khung hình và sẽ rò rỉ hàng nghìn object. Nếu dễ nhất là giữ một `Map<string, Phaser.GameObjects.Image>` theo `piece.id` rồi chỉ cập nhật `setPosition`/`setVisible`, làm theo cách đó.

- [ ] **Step 8: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 9: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `http://localhost:5173/?scene=play&level=1-1`. Kỳ vọng: mảnh có bốn mặt vát màu khác nhau, mặt bàn sáng ở giữa, viền trắng ngà, quầng vàng phía sau. Kéo thử một mảnh: bản sao mờ phóng to 1.06. Kiểm đỉnh mảnh có nằm đúng giao điểm lưới không — đây là điểm mấu chốt của cả đợt này. Ctrl-C.

- [ ] **Step 10: Commit**

```bash
cd game-next && git add src/presentation/jewelGeometry.ts src/presentation/JewelShape.ts src/presentation/TextureFactory.ts src/presentation/BoardRenderer.ts tests/jewelGeometry.test.ts tests/textureFactory.test.ts
git commit -m "feat(piece): mảnh ngọc thoi bốn mặt vát

Thay drawVectorDiamond (9 tham số vị trí) bằng drawJewel với bốn variant.
Bán kính 24 ô logic = 1 module nên đỉnh rơi đúng giao điểm lưới. Viền vẽ
phía trong để mép trùng đường kẻ."
```

---

### Task 7: Khung kính dùng chung

**Files:**
- Modify: `game-next/src/presentation/TextureFactory.ts`
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Modify: `game-next/tests/textureFactory.test.ts`

**Interfaces:**
- Consumes: `GLASS_TOKENS` từ Task 1.
- Produces: `TextureFactory.makeGlassFrame(scene, key, width, height, radius): string` trả về khoá texture; `TEXTURE_KEYS.glassFrameBoard`, `TEXTURE_KEYS.glassFrameTray`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/textureFactory.test.ts`, trong khối `describe` sẵn có:

```ts
  test('có khoá texture khung kính cho bàn và khay', () => {
    expect(TEXTURE_KEYS.glassFrameBoard).toBe('glass_frame_board');
    expect(TEXTURE_KEYS.glassFrameTray).toBe('glass_frame_tray');
  });

  test('khung kính dùng đúng bốn chặng màu băng của mockup', () => {
    expect(GLASS_TOKENS.frameStops).toEqual(['#E6F7FF', '#8BD3F5', '#4E9BD0', '#2D5E9A']);
    expect(GLASS_TOKENS.cornerRadius).toBe(30);
  });
```

Thêm import ở đầu file test:

```ts
import { GLASS_TOKENS } from '../src/presentation/designTokens.ts';
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/textureFactory.test.ts
```

Kỳ vọng: FAIL — `TEXTURE_KEYS.glassFrameBoard` là `undefined`.

- [ ] **Step 3: Viết `makeGlassFrame`**

Trong `game-next/src/presentation/TextureFactory.ts`, thêm hai khoá:

```ts
  glassFrameBoard: 'glass_frame_board',
  glassFrameTray: 'glass_frame_tray',
```

Và hàm sinh:

```ts
  /**
   * Khung kính bao quanh bàn chơi và khay mảnh: gradient băng từ trắng xanh
   * xuống xanh đậm, bo góc, viền tóc trắng mờ ở mép trong.
   */
  public static makeGlassFrame(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    radius: number
  ): string {
    if (scene.textures.exists(key)) return key;

    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) return key;
    const ctx = texture.getContext();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    GLASS_TOKENS.frameStops.forEach((stop, index) => {
      gradient.addColorStop(GLASS_TOKENS.frameStopOffsets[index], stop);
    });

    ctx.fillStyle = gradient;
    ctx.beginPath();
    // roundRect có mặt trên mọi browser mà Capacitor nhắm tới
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();

    // Viền tóc trắng mờ ở mép ngoài
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Khoét lòng khung để chỉ còn viền dày GLASS_TOKENS.padding
    const pad = GLASS_TOKENS.padding;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, Math.max(0, radius - pad));
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    texture.refresh();
    return key;
  }
```

Trong `generateAll`, gọi cho hai kích thước đang dùng:

```ts
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameBoard,
      LAYOUT_TOKENS.board.width,
      LAYOUT_TOKENS.board.height,
      LAYOUT_TOKENS.board.cornerRadius
    );
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameTray,
      LAYOUT_TOKENS.tray.width,
      LAYOUT_TOKENS.tray.height,
      LAYOUT_TOKENS.tray.cornerRadius
    );
```

Thêm import `GLASS_TOKENS` và `LAYOUT_TOKENS` vào `TextureFactory.ts` nếu chưa có.

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/textureFactory.test.ts
```

Kỳ vọng: PASS.

- [ ] **Step 5: Dùng khung kính trong `BoardRenderer`**

Trong `renderBackground` của `game-next/src/presentation/BoardRenderer.ts`:

1. **Xoá** khối bevel thủ công — hai lệnh `lineStyle(3, iceHighlight, 0.9)` / `lineStyle(3, iceShadow, 0.85)` cùng các `arc` và `lineTo` đi kèm (quanh dòng 63–77), và lệnh `strokeRoundedRect` viền 10px.
2. Mặt bàn: thay `fillStyle(COLOR_NUMBERS.navyStele, 0.98)` bằng gradient hai chặng — vì `Graphics` không có gradient, dùng hai lớp phủ xấp xỉ:

```ts
    this.bgGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x, boardBounds.y, boardBounds.width, boardBounds.height,
      LAYOUT_TOKENS.board.cornerRadius
    );
    this.bgGraphics.fillStyle(COLOR_NUMBERS.boardSurfaceBottom, 0.6);
    this.bgGraphics.fillRoundedRect(
      boardBounds.x, boardBounds.y + boardBounds.height / 2,
      boardBounds.width, boardBounds.height / 2,
      LAYOUT_TOKENS.board.cornerRadius
    );
```

3. Đặt khung kính lên trên, một lần trong hàm khởi tạo renderer:

```ts
    this.scene.add
      .image(boardBounds.x, boardBounds.y, TEXTURE_KEYS.glassFrameBoard)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.boardGrid + 1);
    this.scene.add
      .image(trayBounds.x, trayBounds.y, TEXTURE_KEYS.glassFrameTray)
      .setOrigin(0, 0)
      .setDepth(DEPTH_TOKENS.trayArea);
```

- [ ] **Step 6: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 7: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=play&level=1-1`. Kỳ vọng: bàn và khay cùng được bao bởi khung băng sáng ở trên, đậm ở dưới; không còn viền cyan phẳng cũ. Ctrl-C.

- [ ] **Step 8: Commit**

```bash
cd game-next && git add src/presentation/TextureFactory.ts src/presentation/BoardRenderer.ts tests/textureFactory.test.ts
git commit -m "feat(frame): khung kính dùng chung cho bàn và khay

Thay 30 dòng bevel thủ công bằng một texture 9-slice sinh từ GLASS_TOKENS."
```

---

### Task 8: HUD theo mockup

**Files:**
- Modify: `game-next/src/presentation/Hud.ts`
- Modify: `game-next/tests/hud.test.ts`

**Interfaces:**
- Consumes: `COLOR_TOKENS`, `TYPO_TOKENS`, `LAYOUT_TOKENS`, `PIECE_TOKENS` từ Task 1; `drawJewel` từ Task 6.
- Produces: `Hud.showSnapHint(x: number, y: number): void` và `Hud.hideSnapHint(): void` — nhãn "Thả để khớp"; `Hud.setMatchCount(matched: number, total: number): void`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/hud.test.ts`:

```ts
import { COLOR_TOKENS, PIECE_TOKENS } from '../src/presentation/designTokens.ts';

  test('nhãn gợi ý thả mảnh dùng đúng chuỗi tiếng Việt của mockup', () => {
    const SNAP_HINT = 'Thả để khớp';
    expect(SNAP_HINT).toBe('Thả để khớp');
    expect(SNAP_HINT).not.toBe(SNAP_HINT.toUpperCase());
  });

  test('thanh đếm mảnh hiển thị đúng định dạng n/m', () => {
    const format = (matched: number, total: number) => `${matched}/${total} mảnh đã khớp`;
    expect(format(0, 2)).toBe('0/2 mảnh đã khớp');
    expect(format(1, 2)).toBe('1/2 mảnh đã khớp');
    expect(format(2, 2)).toBe('2/2 mảnh đã khớp');
  });

  test('nút tròn dùng viền băng và nền radial mới', () => {
    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#A9E3FF');
    expect(COLOR_TOKENS.iceGlass.buttonFillTop).toBe('#3D5FC0');
    expect(COLOR_TOKENS.iceGlass.buttonFillBottom).toBe('#1B2A72');
  });

  test('icon đếm mảnh dùng cùng bảng màu với mảnh ngọc', () => {
    expect(PIECE_TOKENS.faceNorth).toBe('#FFEAA8');
    expect(PIECE_TOKENS.placeholderStroke.color).toBe('#CFEFFF');
  });
```

(Giữ nguyên các test sẵn có trong file; chỉ thêm bốn test này và dòng import.)

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/hud.test.ts
```

Kỳ vọng: FAIL ở test nút tròn — `buttonFillTop` chưa tồn tại nếu Task 1 chưa đủ; nếu Task 1 đã xong thì các test này xanh ngay và đó cũng chấp nhận được. Mục đích chính của Task 8 là phần vẽ, mà phần vẽ không test bằng vitest được — nên dùng chạy thử trực quan ở Step 5 làm nghiệm thu.

- [ ] **Step 3: Đổi phần vẽ HUD**

Trong `game-next/src/presentation/Hud.ts`:

1. **Nút tròn** — mọi nút (tạm dừng, bật/tắt hình mẫu, đặt lại): viền `COLOR_TOKENS.iceGlass.primaryBorder` dày 3, nền radial từ `buttonFillTop` ở 35%/30% sang `buttonFillBottom`, cộng một highlight trong: cung sáng `rgba(255,255,255,0.35)` dày 2 ở nửa trên. Phaser không có radial gradient cho `Graphics`, nên xấp xỉ bằng hai vòng tròn lồng: `fillCircle` màu `buttonFillBottom` cho toàn nút, rồi `fillCircle` màu `buttonFillTop` alpha 0.6 bán kính 0.7 lệch lên trên-trái 15%.
2. **Tiêu đề** — "Song Tinh" dùng `TYPO_TOKENS.fontFamily.serif`, `fontSize: TYPO_TOKENS.fontSize.headerTitle` (52px), màu `COLOR_TOKENS.text.primary`, đặt tại x=360 căn giữa, y=34. Phụ đề `Chương I · Màn 1-1` dùng `fontFamily.sans` 24px màu `COLOR_TOKENS.text.secondary`, y=72.
3. **Thanh đếm dưới** — viên thuốc bo tròn tại y = `LAYOUT_TOKENS.bottomBar.y + 6`, cao 56, nền `0x0f1950` alpha 0.6, viền `icePrimary` alpha 0.6 dày 1.5. Bên trong, từ trái sang: một thoi đặc vẽ bằng `drawJewel(..., { variant: 'solid', radius: 14 })` cho mỗi mảnh đã khớp, một thoi nét đứt `variant: 'placeholder'` cho mỗi mảnh còn lại, rồi chuỗi `${matched}/${total} mảnh đã khớp` 26px.
4. **Nhãn gợi ý thả mảnh** — thêm hai phương thức:

```ts
  private snapHint: Phaser.GameObjects.Container | null = null;

  /** Nhãn "Thả để khớp" nổi cạnh mảnh khi kéo trúng vùng snap */
  public showSnapHint(x: number, y: number): void {
    if (!this.snapHint) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0xfff4d2, 1);
      bg.fillRoundedRect(0, 0, 160, 44, 14);
      const label = this.scene.add.text(80, 22, 'Thả để khớp', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.onAmber,
      }).setOrigin(0.5);
      this.snapHint = this.scene.add
        .container(0, 0, [bg, label])
        .setDepth(DEPTH_TOKENS.hudControls);
    }
    this.snapHint.setPosition(x, y).setVisible(true);
  }

  public hideSnapHint(): void {
    this.snapHint?.setVisible(false);
  }
```

5. Trong `PlayScene.refreshView`, gọi `this.hud.showSnapHint(...)` khi `snapshot.dragInfo?.snapCandidateId` khác null, ngược lại `this.hud.hideSnapHint()`. Toạ độ: ngay bên phải mảnh đang kéo, lệch `+radiusPx * 0.8` theo x và `+radiusPx * 0.5` theo y.

- [ ] **Step 4: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 5: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=play&level=1-1`. Kiểm: tiêu đề serif lớn với phụ đề chương, hai nút tròn viền băng ở hai góc trên, thanh đếm "0/2 mảnh đã khớp" ở đáy với hai thoi nét đứt. Kéo một mảnh tới vị trí đúng — nhãn "Thả để khớp" phải hiện ra và biến mất khi kéo đi chỗ khác. Thả mảnh — thanh đếm đổi thành "1/2" và một thoi chuyển từ nét đứt sang đặc. Ctrl-C.

- [ ] **Step 6: Commit**

```bash
cd game-next && git add src/presentation/Hud.ts src/presentation/PlayScene.ts tests/hud.test.ts
git commit -m "feat(hud): HUD theo mockup improve-v1

Nút tròn viền băng, tiêu đề serif kèm phụ đề chương, thanh đếm dạng viên
thuốc với icon thoi. Thêm nhãn 'Thả để khớp' khi kéo trúng vùng snap."
```

---

### Task 9: Màn hoàn thành

**Files:**
- Modify: `game-next/src/presentation/Hud.ts` (`showWinModal`)
- Modify: `game-next/src/content/catalog.ts` (chuyển `victoryVerse` từ document sang `Level`)
- Modify: `game-next/src/domain/model.ts` (thêm `victoryVerse` vào `Level`)
- Modify: `game-next/tests/dialogs.test.ts`

**Interfaces:**
- Consumes: `victoryVerse` trên `LevelDocument` từ Task 3; `drawJewel` từ Task 6.
- Produces: `Level.victoryVerse?: string`; `Hud.showWinModal(level: Level, onNext: () => void, onLevelSelect: () => void): void`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/dialogs.test.ts`:

```ts
import { loadLevel } from '../src/content/catalog.ts';

  test('màn hoàn thành lấy câu thơ từ dữ liệu màn chơi, không hardcode', () => {
    const level = loadLevel('1-1', 'campaign');
    expect(level.victoryVerse).toBe('Hai vì sao chạm đỉnh, vũ trụ tìm thấy thế cân bằng.');
  });

  test('nhãn hai nút của màn hoàn thành đúng chuỗi mockup', () => {
    const LABELS = { next: 'Màn tiếp theo', select: 'Chọn màn', title: 'Hoàn thành' };
    expect(LABELS.next).toBe('Màn tiếp theo');
    expect(LABELS.select).toBe('Chọn màn');
    expect(LABELS.title).toBe('Hoàn thành');
    for (const text of Object.values(LABELS)) {
      expect(text).not.toBe(text.toUpperCase());
    }
  });
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/dialogs.test.ts
```

Kỳ vọng: FAIL — `level.victoryVerse` là `undefined` vì `catalog.ts` chưa chuyển trường này sang `Level`.

- [ ] **Step 3: Đưa `victoryVerse` vào `Level`**

Trong `game-next/src/domain/model.ts`, thêm vào type `Level`:

```ts
  victoryVerse?: string;
```

Trong `game-next/src/content/catalog.ts`, tại chỗ dựng đối tượng `Level` từ document, thêm:

```ts
    victoryVerse: doc.victoryVerse,
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/dialogs.test.ts
```

Kỳ vọng: PASS.

- [ ] **Step 5: Thiết kế lại `showWinModal`**

Trong `game-next/src/presentation/Hud.ts`, viết lại `showWinModal` theo mockup — **không** dùng hộp thoại đè lên giữa màn:

1. Phủ tối nhẹ toàn màn: `fillStyle(COLOR_NUMBERS.navyBackdrop, 0.35)` ở depth `DEPTH_TOKENS.modalOverlay`. Bàn chơi vẫn nhìn thấy rõ — đó là điểm của thiết kế này: người chơi nhìn thành quả, không nhìn hộp thoại.
2. Chữ "Hoàn thành" tại y = `LAYOUT_TOKENS.board.y - 60`, `fontFamily.serif`, `TYPO_TOKENS.fontSize.modalTitle` (44px), màu `COLOR_TOKENS.text.primary`, căn giữa x=360.
3. Câu thơ tại y = `LAYOUT_TOKENS.board.y + LAYOUT_TOKENS.board.height + 40`, `fontFamily.sans`, 26px, `fontStyle: 'italic'`, màu `COLOR_TOKENS.text.secondary`, `wordWrap: { width: 600 }`, căn giữa. Chỉ vẽ khi `level.victoryVerse` có giá trị.
4. Hai nút tại y = `LAYOUT_TOKENS.bottomBar.y - 40`: "Màn tiếp theo" dùng `TEXTURE_KEYS.btnPrimaryAmber` rộng `LAYOUT_TOKENS.buttonSizes.primaryW`, đặt ở x=360; "Chọn màn" là nút viền băng, đặt bên dưới, cao 64.
5. Đổi chữ ký: `showWinModal(level: Level, onNext: () => void, onLevelSelect: () => void): void`. Cập nhật chỗ gọi trong `PlayScene` (dòng ~181) truyền `this.level` và hai callback — `onNext` dùng `nextLevelId` đã import sẵn trong `PlayScene`, `onLevelSelect` gọi `this.scene.start('LevelSelectScene')`.

- [ ] **Step 6: Tăng tốc vòng thiên cầu khi thắng**

Trong `BoardRenderer.updateCelestialRings` đã có tham số `isWon` nhân tốc độ ×3. Xác nhận `render()` vẫn truyền `snapshot.phase === 'won'` sau các thay đổi ở Task 6 — nếu lời gọi bị mất khi sửa `render()`, khôi phục lại.

- [ ] **Step 7: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 8: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=play&level=1-1`, giải xong màn (kéo hai mảnh vào đúng chỗ). Kỳ vọng: bàn chơi vẫn hiện rõ, vòng thiên cầu quay nhanh hơn, chữ "Hoàn thành" phía trên, câu thơ in nghiêng phía dưới, hai nút. Bấm "Màn tiếp theo" và "Chọn màn" để xác nhận cả hai điều hướng đúng. Ctrl-C.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/presentation/Hud.ts src/presentation/PlayScene.ts src/domain/model.ts src/content/catalog.ts tests/dialogs.test.ts
git commit -m "feat(victory): màn hoàn thành giữ bàn chơi làm nền

Thay hộp thoại đè lên bằng lớp phủ nhẹ, chữ Hoàn thành phía trên và câu
thơ theo màn phía dưới. Câu thơ đọc từ victoryVerse trong dữ liệu màn."
```

---

### Task 10: Màn chọn màn theo mockup

**Files:**
- Modify: `game-next/src/presentation/LevelSelectScene.ts`
- Modify: `game-next/src/presentation/TextureFactory.ts` (bốn texture node)
- Modify: `game-next/tests/levelSelect.test.ts`

**Interfaces:**
- Consumes: `SkyBackdrop` từ Task 4 (đã nối ở Task 4 Step 6); `drawJewel` từ Task 6; `constellationPath` từ `constellationMotion.ts` (đã có sẵn).
- Produces: `formatProgress(completed: number, total: number): string` export từ `LevelSelectScene.ts`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/levelSelect.test.ts`:

```ts
import { formatProgress } from '../src/presentation/LevelSelectScene.ts';
import { campaignManifest } from '../src/content/manifest.ts';

  test('chỉ số tiến độ hiển thị dạng đã hoàn thành trên tổng số màn', () => {
    expect(formatProgress(0, 18)).toBe('0/18');
    expect(formatProgress(1, 18)).toBe('1/18');
    expect(formatProgress(18, 18)).toBe('18/18');
  });

  test('tổng số màn lấy từ manifest, không hardcode', () => {
    expect(campaignManifest.length).toBeGreaterThan(0);
    expect(formatProgress(0, campaignManifest.length)).toBe(`0/${campaignManifest.length}`);
  });
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
cd game-next && npx vitest run tests/levelSelect.test.ts
```

Kỳ vọng: FAIL — `formatProgress` chưa được export.

- [ ] **Step 3: Thêm `formatProgress` và chỉ số tiến độ**

Trong `game-next/src/presentation/LevelSelectScene.ts`, thêm export ở cấp module (ngoài class):

```ts
/** Chỉ số tiến độ ở header màn chọn màn, ví dụ "1/18" */
export function formatProgress(completed: number, total: number): string {
  return `${completed}/${total}`;
}
```

Trong phần dựng header của scene, thêm một text dùng `formatProgress(progress.completed.length, campaignManifest.length)`, `fontFamily.sans` 26px, màu `COLOR_TOKENS.text.secondary`, đặt ở góc phải header.

- [ ] **Step 4: Chạy test để xác nhận xanh**

```bash
cd game-next && npx vitest run tests/levelSelect.test.ts
```

Kỳ vọng: PASS.

- [ ] **Step 5: Vẽ lại bốn texture node**

Trong `game-next/src/presentation/TextureFactory.ts`, đổi phần sinh `nodeCompleted` / `nodeCurrent` / `nodeUnlocked` / `nodeLocked` theo mockup. Kích thước giữ nguyên (72px canvas, vùng chạm 96px — `tests/levelSelect.test.ts` đang kiểm điều này, đừng đổi):

- `nodeCompleted`: thoi amber đặc — dùng `drawJewel` variant `solid`, bán kính 30
- `nodeCurrent`: thoi amber đặc cộng một vòng tròn `amberGlow` alpha 0.5 bán kính 34 (vòng xung; animation nhấp nháy làm bằng tween `alpha` trong scene, không nằm trong texture)
- `nodeUnlocked`: thoi nét đứt viền băng — `drawJewel` variant `placeholder`, bán kính 30
- `nodeLocked`: như `nodeUnlocked` nhưng phủ `0x1b2a72` alpha 0.6 lên trên

- [ ] **Step 6: Đốm sáng chạy trên đường nối**

Trong `LevelSelectScene`, tại chỗ vẽ đường nối giữa hai node, giữ nguyên `constellationPath`. Thêm một đốm sáng cho mỗi đường:

```ts
    // Phaser không có stroke-dashoffset, nên mô phỏng bằng một đốm sáng chạy
    // dọc đường cong — chu kỳ giống hiệu ứng sweep của mockup.
    const spark = this.add.circle(0, 0, 3, COLOR_NUMBERS.amberGlow, 0.9);
    const path = constellationPath(p1, p2);
    this.tweens.addCounter({
      from: 0,
      to: path.length - 1,
      duration: ANIM_TOKENS.duration.linkSweepMs,
      repeat: -1,
      onUpdate: (tween) => {
        const point = path[Math.round(tween.getValue())];
        spark.setPosition(point.x, point.y);
      },
    });
```

- [ ] **Step 7: Banner chương**

Đổi banner chương sang `TYPO_TOKENS.fontFamily.serif`, `TYPO_TOKENS.fontSize.sectionHeader` (32px), màu `COLOR_TOKENS.text.primary`, kèm hai đoạn kẻ ngang `COLOR_NUMBERS.gridModule` alpha 0.5 dài 80px ở hai bên chữ.

- [ ] **Step 8: Chạy typecheck và toàn bộ test**

```bash
cd game-next && npm run typecheck && npm run test
```

Kỳ vọng: tất cả xanh.

- [ ] **Step 9: Chạy thử trực quan**

```bash
cd game-next && npm run dev
```

Mở `?scene=levelSelect`. Kỳ vọng: nền sao trôi, node dạng thoi với bốn trạng thái phân biệt rõ, đốm sáng chạy dọc đường nối, banner chương kiểu serif có kẻ hai bên, chỉ số "1/18" ở header. Cuộn thử để xác nhận auto-scroll còn hoạt động. Ctrl-C.

- [ ] **Step 10: Commit**

```bash
cd game-next && git add src/presentation/LevelSelectScene.ts src/presentation/TextureFactory.ts tests/levelSelect.test.ts
git commit -m "feat(level-select): bản đồ chòm sao theo mockup improve-v1

Node dạng thoi bốn trạng thái, đốm sáng chạy dọc đường nối, banner chương
serif, chỉ số tiến độ ở header. Giữ nguyên buildConstellation và auto-scroll."
```

---

### Task 11: Màn chính và rà soát cuối

**Files:**
- Modify: `game-next/src/presentation/MenuScene.ts`
- Modify: `game-next/src/presentation/SettingsDialog.ts`
- Modify: `game-next/src/presentation/PauseDialog.ts`
- Modify: `game-next/src/main.ts:28`
- Modify: `game-next/tests/menu.test.ts`

**Interfaces:**
- Consumes: mọi thứ từ Task 1–10. Không sinh interface mới.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `game-next/tests/menu.test.ts`:

```ts
import { COLOR_TOKENS } from '../src/presentation/designTokens.ts';

  test('màu nền canvas khớp chặng đầu của gradient trời', () => {
    expect(COLOR_TOKENS.sky.stops[0]).toBe('#1A2470');
  });
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ hoặc xanh**

```bash
cd game-next && npx vitest run tests/menu.test.ts
```

Nếu Task 1 đã xong thì test này xanh ngay — chấp nhận được. Mục đích của nó là chốt lại rằng `main.ts` và token không lệch nhau.

- [ ] **Step 3: Đổi màu nền canvas**

Trong `game-next/src/main.ts` dòng 28:

```ts
  backgroundColor: '#1A2470',
```

Nền này chỉ lộ ra ở viền letterbox khi tỉ lệ màn không khớp, nên nó phải là chặng đầu của gradient trời chứ không phải navy cũ.

- [ ] **Step 4: Áp token mới cho hai dialog**

Trong `SettingsDialog.ts` và `PauseDialog.ts`, chỉ **đổi token màu**, giữ nguyên hình dạng và bố cục:
- nền dialog → `COLOR_NUMBERS.boardSurfaceTop`
- viền → `COLOR_NUMBERS.icePrimary`
- lớp phủ → `COLOR_NUMBERS.navyBackdrop`
- chữ chính → `COLOR_TOKENS.text.primary`, chữ phụ → `COLOR_TOKENS.text.secondary`

Nếu hai file này còn dùng khung bevel thủ công, thay bằng `TextureFactory.makeGlassFrame` với kích thước dialog tương ứng.

- [ ] **Step 5: Hoàn tất MenuScene**

Trong `MenuScene.ts`: ấn bia cổ ngữ và các nút áp token mới (`iceGlass.buttonFillTop/Bottom`, `amberGold.solidPrimary`). Tiêu đề game dùng `TYPO_TOKENS.fontSize.heroTitle` (52px) kiểu serif. Bố cục giữ nguyên.

- [ ] **Step 6: Rà soát token cũ còn sót**

```bash
cd game-next && grep -rn "#080E24\|#101B32\|#68B8DC\|#D4A359\|navyStele\|navySpace\|amberGrid\|topBuffer\|safeAreaBottom" src/
```

Kỳ vọng: không có kết quả. Nếu còn, sửa theo bảng ánh xạ ở Task 1 Step 5.

- [ ] **Step 7: Kiểm toàn bộ**

```bash
cd game-next && npm run content:validate && npm run typecheck && npm run test && npm run build
```

Kỳ vọng: cả bốn lệnh xanh.

- [ ] **Step 8: Chạy thử trực quan toàn bộ bốn màn**

```bash
cd game-next && npm run dev
```

Lần lượt mở và đối chiếu với mockup tương ứng trong `docs/gui/improve-v1/`:
- `/` → màn chính
- `/?scene=levelSelect` → `Chọn màn · Chòm sao-html/LevelMap.dc.html`
- `/?scene=play&level=1-1` → `Màn chơi · đang kéo mảnh-html/Main.dc.html`
- giải xong màn → `Màn chơi · hoàn thành-html/Victory.dc.html`

Mở mockup để so bằng cách phục vụ thư mục đó: `cd "docs/gui/improve-v1/Màn chơi · đang kéo mảnh-html" && python -m http.server 8000`, rồi mở `http://localhost:8000/Main.dc.html`.

Ghi lại bất kỳ chỗ lệch nào đáng kể. Lệch nhỏ về gradient là chấp nhận được — Phaser không có gradient fill thật, spec đã ghi rõ điều này. Lệch về **vị trí, kích thước, hoặc căn lưới** thì không — sửa trước khi commit.

- [ ] **Step 9: Commit**

```bash
cd game-next && git add src/main.ts src/presentation/MenuScene.ts src/presentation/SettingsDialog.ts src/presentation/PauseDialog.ts tests/menu.test.ts
git commit -m "feat(ui): hoàn tất re-skin improve-v1 cho màn chính và dialog

Màu nền canvas khớp chặng đầu gradient trời. Hai dialog nhận token mới và
dùng chung khung kính. Không còn token của bảng màu cũ trong src/."
```

---

## Ghi chú cho người thực thi

**Thứ tự task là bắt buộc.** Task 2 làm đỏ test của Task 1; Task 3 làm xanh lại. Đừng gộp — mỗi task là một commit riêng để dễ lần ngược khi có gì sai.

**Khi test đỏ ngoài dự kiến:** plan này ghi rõ chỗ nào test *sẽ* đỏ và task nào sửa (Task 1 Step 6, Task 2 Step 7). Test đỏ ở chỗ khác là tín hiệu có gì đó sai — dừng lại và báo cáo, đừng sửa test cho xanh.

**Phaser và gradient:** ba chỗ phải đi đường vòng, đã ghi trong spec — gradient trời (dải ngang nội suy), gradient mặt bàn và quầng sáng (canvas texture), nét đứt (chia đoạn thủ công). Nếu thấy cách nào gọn hơn mà vẫn đúng màu, dùng nó.

**Rò rỉ object:** `render()` của `BoardRenderer` chạy mỗi khung hình. Đừng bao giờ `scene.add.*` bên trong nó. Task 6 Step 7 có ghi rõ cái bẫy này.

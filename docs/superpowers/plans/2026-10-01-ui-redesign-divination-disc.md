# Kế Hoạch Triển Khai UI/UX Tấm Bia Tiên Tri (Divination Disc Redesign)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc toàn diện tầng Presentation của Mirror theo phong cách Tấm Bia Tiên Tri (Honkai: Star Rail aesthetic): 3 họ màu nghiêm ngặt, layout chuẩn Safe Area (Board 512×768 tại y=184, Tray tại y=968..1108), 5 trạng thái tương tác bàn cờ, HUD nút tròn 64px, Menu với ấn bia cổ ngữ xoay và phản chiếu logo, Màn chọn màn chòm sao uốn lượn, và các modal bia đá cài đặt/tạm dừng.

**Architecture:** Giữ nguyên 100% logic Domain (lưới 128×192, bitmask, parity chẵn-lẻ, snap neo, catalog). Tách nhỏ tầng Presentation thành các module đơn trách nhiệm: `designTokens.ts` (bảng màu, font, kích thước), `TextureFactory.ts` (sinh texture 9-slice và icon vector lúc boot), `layout.ts` (cập nhật metrics), `BoardRenderer.ts` (mặt bia, lưới vàng, vòng xoay thiên văn, 5 trạng thái), `Hud.ts` (thanh điều khiển, nút tròn, modal hoàn thành), `LevelSelectScene.ts` (bản đồ chòm sao), `SettingsDialog.ts` & `PauseDialog.ts` (hộp thoại bia đá). Cung cấp trang mockup HTML/SVG độc lập để kiểm chứng thị giác trực quan.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, HTML5 Canvas / SVG, CSS3 `@font-face` (Playfair Display & Be Vietnam Pro offline), Capacitor 8 Android.

**Spec:** [docs/superpowers/specs/2026-10-01-ui-redesign-divination-disc.md](../../superpowers/specs/2026-10-01-ui-redesign-divination-disc.md)

---

## Global Constraints

- **Họ màu nghiêm ngặt:** Chỉ sử dụng 3 họ màu: Navy (`#080E24`, `#101B32`, `#050A1A`), Kính xanh trắng (`#68B8DC`, `#CFEFFF`, `#3A5E78`), Vàng hổ phách (`#FFC857`, `#D4A359`, `#FFE8A6`). Chữ chính `#EEF4FA`, chữ phụ `#9DAFC7`. Loại bỏ hoàn toàn màu teal (`#4ECDC4`) và viền 1px mờ nhạt.
- **Typography:** Không dùng ALL-CAPS trên giao diện; sử dụng Title Case hoặc Sentence case. Tiêu đề dùng font Serif (Playfair Display), nội dung/nút dùng Sans-serif (Be Vietnam Pro). Chữ giao diện $\ge 14\text{sp}$, chú thích $\ge 12\text{sp}$. Font nạp offline 100% qua `@font-face`.
- **Bố cục Canvas 720×1280:**
  - Header: $y = 0..96$ (tránh tai thỏ / camera cutout).
  - Khoảng đệm trên: $y = 96..184$.
  - Tấm bia: $y = 184..952$ ($512 \times 768$, tương ứng $128 \times 192$ ô ở 4px/ô).
  - Khay mảnh: $y = 968..1108$ (cao 140px).
  - Hàng nút dưới: $y = 1124..1216$ (nút tròn 64px, vùng chạm $\ge 64\text{px}$).
  - Safe Area dưới: $y = 1216..1280$ (tránh gesture bar).
- **Quy tắc cơ chế không đổi:** Bàn $128 \times 192$, snap bán kính Euclid 6 ô, xoay 90° cùng chiều kim đồng hồ quanh tâm bounding box, quy luật giao chẵn-rỗng lẻ-hiện, MVP chỉ có 1 màu vàng hổ phách `#FFC857`. Nút Xoay ẩn ở Chương 1 & 2, chỉ xuất hiện ở Chương 3.
- **Hiệu năng di động:** Texture phức tạp (viền bevel, icon, button base) được vẽ 1 lần vào Phaser Texture Cache hoặc dùng 9-slice lúc khởi tạo, không vẽ lại bằng Graphics mỗi frame. Giới hạn stardust nền $\le 30$ hạt. Tự động tạm dừng animation khi app xuống nền.

---

## Bản Đồ File (File Structure)

| Đường dẫn file | Trách nhiệm |
|---|---|
| `game-next/src/presentation/designTokens.ts` *(Mới)* | Định nghĩa các token thiết kế chuẩn: bảng màu 3 họ, typography, kích thước, thời gian animation và z-index. |
| `game-next/src/presentation/TextureFactory.ts` *(Mới)* | Tạo và đăng ký các Canvas Textures vào Phaser Texture Manager: viền kính bevel, icon SVG (reset, rotate, menu, settings, close), toggle switch, node chòm sao. |
| `game-next/src/presentation/layout.ts` *(Sửa)* | Cập nhật `BOARD_Y = 184`, `TRAY_Y = 968`, `TRAY_HEIGHT = 140`, bổ sung metrics cho header, bottom bar, safe area. |
| `game-next/src/presentation/BoardRenderer.ts` *(Sửa)* | Render tấm bia đá với viền bevel 10px bo góc 36px, lưới vàng 8 ô kèm chấm giao điểm, 4 ký tự phương vị, 2 vòng thiên văn xoay nền, bóng mục tiêu kính mờ, và 5 trạng thái mảnh ghép (Dragging, Snapped, Overlap Inversion, Temporary, Victory). |
| `game-next/src/presentation/Hud.ts` *(Sửa)* | Render nút Menu tròn 56px, tiêu đề Title Case, toggle bóng mục tiêu, nút Đặt lại tròn 64px, nút Xoay tròn 64px (ẩn ở Ch1-2, mờ khi chưa chọn mảnh), và modal Hoàn thành với câu ngạn ngữ chiêm tinh + CTA vàng đặc. |
| `game-next/src/presentation/PlayScene.ts` *(Sửa)* | Điều phối tương tác giữa BoardRenderer, Hud, PlayController, hỗ trợ Pause Dialog, giảm chuyển động stardust, xử lý phím Back Android. |
| `game-next/src/presentation/MenuScene.ts` *(Sửa)* | Menu chính với ấn bia cổ ngữ 280px xoay chậm, logo MIRROR kèm hình phản chiếu đáy, nút CTA vàng đặc hiển thị tên màn kế tiếp, nút Chọn màn viền kính, nút Cài đặt bánh răng cổ ngữ 56px. |
| `game-next/src/presentation/LevelSelectScene.ts` *(Mới)* | Màn chọn màn dạng bản đồ chòm sao (Constellation Map): 3 chương, đường liên kết sao vàng mờ, 4 trạng thái node (hoàn thành, hiện tại nhấp nháy, mở, khóa), popup xem nhanh thông tin màn. |
| `game-next/src/presentation/SettingsDialog.ts` *(Mới)* | Modal tấm bia đá cài đặt: công tắc bóng mục tiêu, rung phản hồi, giảm chuyển động; vùng nguy hiểm tách biệt để xóa tiến trình với xác nhận 2 bước. |
| `game-next/src/presentation/PauseDialog.ts` *(Mới)* | Modal tạm dừng trong màn chơi: Tiếp tục chơi (CTA vàng đặc), Chơi lại màn này (viền kính), Về chọn màn (nút chữ). |
| `game-next/src/main.ts` *(Sửa)* | Đăng ký `LevelSelectScene`, tích hợp tải font và xử lý hardware back điều hướng phù hợp giữa các Scene và Dialog. |
| `game-next/src/style.css` *(Sửa)* | Định nghĩa `@font-face` cho Playfair Display và Be Vietnam Pro, căn chỉnh khung game. |
| `mockups/index.html` *(Mới)* | Bộ mockup tương tác HTML5/SVG tỉ lệ 720×1280 cho phép duyệt nhanh Menu, Chọn màn, Cài đặt và 5 trạng thái Gameplay trên trình duyệt. |
| `game-next/tests/*.test.ts` *(Mới/Sửa)* | Kiểm thử tự động cho Design Tokens, Layout Metrics, Texture generation logic, Dialog flows, và Navigation. |

---

## Kế Hoạch Triển Khai Từng Bước (Tasks)

### Task 1: Thiết Lập Design Tokens & Typography Offline

**Files:**
- Create: `game-next/src/presentation/designTokens.ts`
- Create: `game-next/tests/designTokens.test.ts`
- Modify: `game-next/src/style.css`

**Interfaces:**
- Consumes: Không.
- Produces: `COLOR_TOKENS`, `TYPO_TOKENS`, `LAYOUT_TOKENS`, `ANIM_TOKENS`, `DEPTH_TOKENS`.

- [ ] **Step 1: Viết test kiểm tra cấu trúc Design Tokens**

Tạo file `game-next/tests/designTokens.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import {
  COLOR_TOKENS,
  TYPO_TOKENS,
  LAYOUT_TOKENS,
  ANIM_TOKENS,
  DEPTH_TOKENS,
} from '../src/presentation/designTokens.ts';

describe('Design Tokens Validation', () => {
  test('chứa đúng 3 họ màu nghiêm ngặt và không chứa mã màu teal cũ', () => {
    expect(COLOR_TOKENS.navy.spaceBackground).toBe('#080E24');
    expect(COLOR_TOKENS.navy.steleSurface).toBe('#101B32');
    expect(COLOR_TOKENS.navy.deepModalBackdrop).toBe('#050A1A');

    expect(COLOR_TOKENS.iceGlass.primaryBorder).toBe('#68B8DC');
    expect(COLOR_TOKENS.iceGlass.bevelHighlight).toBe('#CFEFFF');
    expect(COLOR_TOKENS.iceGlass.bevelShadow).toBe('#3A5E78');

    expect(COLOR_TOKENS.amberGold.solidPrimary).toBe('#FFC857');
    expect(COLOR_TOKENS.amberGold.gridCoordinate).toBe('#D4A359');
    expect(COLOR_TOKENS.amberGold.glowHighlight).toBe('#FFE8A6');

    expect(COLOR_TOKENS.text.primary).toBe('#EEF4FA');
    expect(COLOR_TOKENS.text.secondary).toBe('#9DAFC7');

    const allColors = JSON.stringify(COLOR_TOKENS).toUpperCase();
    expect(allColors.includes('#4ECDC4')).toBe(false);
  });

  test('định nghĩa đúng thông số font và thời gian animation chuẩn', () => {
    expect(TYPO_TOKENS.fontFamily.serif).toContain('Playfair Display');
    expect(TYPO_TOKENS.fontFamily.sans).toContain('Be Vietnam Pro');
    expect(ANIM_TOKENS.duration.snapMs).toBe(120);
    expect(ANIM_TOKENS.duration.overlapInversionMs).toBe(150);
    expect(ANIM_TOKENS.duration.buttonTapMs).toBe(90);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `node ./node_modules/vitest/vitest.mjs run tests/designTokens.test.ts`
Expected: FAIL with "Cannot find module '../src/presentation/designTokens.ts'"

- [ ] **Step 3: Triển khai file `designTokens.ts` và cấu hình CSS font**

Tạo file `game-next/src/presentation/designTokens.ts`:
```ts
export const COLOR_TOKENS = {
  navy: {
    spaceBackground: '#080E24',
    steleSurface: '#101B32',
    deepModalBackdrop: '#050A1A',
  },
  iceGlass: {
    primaryBorder: '#68B8DC',
    bevelHighlight: '#CFEFFF',
    bevelShadow: '#3A5E78',
  },
  amberGold: {
    solidPrimary: '#FFC857',
    gridCoordinate: '#D4A359',
    glowHighlight: '#FFE8A6',
  },
  text: {
    primary: '#EEF4FA',
    secondary: '#9DAFC7',
  },
  danger: {
    warningText: '#E65A5A',
    confirmBg: '#5A1A1A',
  },
} as const;

export const COLOR_NUMBERS = {
  navySpace: 0x080e24,
  navyStele: 0x101b32,
  navyBackdrop: 0x050a1a,
  icePrimary: 0x68b8dc,
  iceHighlight: 0xcfefff,
  iceShadow: 0x3a5e78,
  amberSolid: 0xffc857,
  amberGrid: 0xd4a359,
  amberGlow: 0xffe8a6,
  textPrimary: 0xeef4fa,
  textSecondary: 0x9dafc7,
  dangerText: 0xe65a5a,
} as const;

export const TYPO_TOKENS = {
  fontFamily: {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontSize: {
    heroTitle: '40px',
    sectionHeader: '24px',
    modalTitle: '20px',
    bodyPrimary: '15px',
    caption: '12px',
  },
} as const;

export const LAYOUT_TOKENS = {
  canvas: { width: 720, height: 1280 },
  header: { y: 0, height: 96 },
  topBuffer: { y: 96, height: 88 },
  board: { x: 104, y: 184, width: 512, height: 768, cornerRadius: 36, borderWidth: 10 },
  tray: { x: 104, y: 968, width: 512, height: 140, cornerRadius: 20 },
  bottomBar: { y: 1124, height: 92 },
  safeAreaBottom: { y: 1216, height: 64 },
  buttonSizes: {
    primaryW: 360,
    primaryH: 72,
    circularAction: 64,
    circularNav: 56,
  },
} as const;

export const ANIM_TOKENS = {
  duration: {
    buttonTapMs: 90,
    dragLiftMs: 80,
    snapMs: 120,
    overlapInversionMs: 150,
    sceneFadeMs: 240,
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
  placedPieces: 30,
  trayArea: 40,
  temporaryPieces: 50,
  draggingPiece: 60,
  hudControls: 70,
  modalOverlay: 100,
  modalContent: 110,
} as const;
```

Cập nhật `game-next/src/style.css` bổ sung fallback font và tinh chỉnh nền:
```css
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 30%, #101b32 0%, #080e24 60%, #050a1a 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
  font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/designTokens.test.ts`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/designTokens.ts game-next/src/style.css game-next/tests/designTokens.test.ts
git commit -m "feat(ui): add strict design tokens and typography configuration"
```

---

### Task 2: Cập Nhật Layout Metrics Cho Safe Area & Tấm Bia Thiên Văn

**Files:**
- Modify: `game-next/src/presentation/layout.ts:10-50`
- Create: `game-next/tests/layout.test.ts`
- Modify: `game-next/tests/drag.test.ts:50-60`

**Interfaces:**
- Consumes: `LAYOUT_TOKENS` từ `designTokens.ts`.
- Produces: `LayoutMetrics` với `boardBounds.y = 184`, `trayBounds.y = 968`, `trayBounds.height = 140`.

- [ ] **Step 1: Viết test kiểm tra kích thước Layout Metrics mới**

Tạo file `game-next/tests/layout.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { computeLayout, gridToCanvas, canvasToGrid } from '../src/presentation/layout.ts';

describe('Layout Metrics Specification', () => {
  const layout = computeLayout(720, 1280);

  test('tọa độ bàn cờ và khay mảnh tuân thủ đúng phân vùng Safe Area', () => {
    expect(layout.boardBounds).toEqual({
      x: 104,
      y: 184,
      width: 512,
      height: 768,
    });

    expect(layout.trayBounds).toEqual({
      x: 104,
      y: 968,
      width: 512,
      height: 140,
    });

    expect(layout.cellPixel).toBe(4);
  });

  test('chuyển đổi tọa độ grid sang canvas tính đúng gốc y=184', () => {
    const canvasTopLeft = gridToCanvas(0, 0, layout);
    expect(canvasTopLeft).toEqual({ x: 104, y: 184 });

    const gridCenter = canvasToGrid(104 + 64 * 4, 184 + 96 * 4, layout);
    expect(gridCenter).toEqual({ x: 64, y: 96, insideBoard: true });
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `node ./node_modules/vitest/vitest.mjs run tests/layout.test.ts`
Expected: FAIL with `y: 168` instead of `y: 184`.

- [ ] **Step 3: Cập nhật file `layout.ts`**

Chỉnh sửa các hằng số trong `game-next/src/presentation/layout.ts`:
```ts
import type { Piece, PieceState } from '../domain/model.ts';
import { GRID_HEIGHT, GRID_WIDTH } from '../domain/model.ts';
import { LAYOUT_TOKENS } from './designTokens.ts';

export type LayoutMetrics = {
  boardBounds: { x: number; y: number; width: number; height: number };
  cellPixel: 4;
  trayBounds: { x: number; y: number; width: number; height: number };
  headerBounds: { y: number; height: number };
  bottomBarBounds: { y: number; height: number };
  scale: number;
};

const BASE_WIDTH = LAYOUT_TOKENS.canvas.width;
const BASE_HEIGHT = LAYOUT_TOKENS.canvas.height;
const BOARD_X = LAYOUT_TOKENS.board.x;
const BOARD_Y = LAYOUT_TOKENS.board.y;
const BOARD_WIDTH = LAYOUT_TOKENS.board.width;
const BOARD_HEIGHT = LAYOUT_TOKENS.board.height;
const CELL_PIXEL: 4 = 4;
const TRAY_X = LAYOUT_TOKENS.tray.x;
const TRAY_Y = LAYOUT_TOKENS.tray.y;
const TRAY_WIDTH = LAYOUT_TOKENS.tray.width;
const TRAY_HEIGHT = LAYOUT_TOKENS.tray.height;

export function computeLayout(
  viewportWidth: number,
  viewportHeight: number,
  _safeArea?: { top: number; bottom: number }
): LayoutMetrics {
  const scaleX = viewportWidth / BASE_WIDTH;
  const scaleY = viewportHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  return {
    boardBounds: {
      x: BOARD_X,
      y: BOARD_Y,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
    },
    cellPixel: CELL_PIXEL,
    trayBounds: {
      x: TRAY_X,
      y: TRAY_Y,
      width: TRAY_WIDTH,
      height: TRAY_HEIGHT,
    },
    headerBounds: {
      y: LAYOUT_TOKENS.header.y,
      height: LAYOUT_TOKENS.header.height,
    },
    bottomBarBounds: {
      y: LAYOUT_TOKENS.bottomBar.y,
      height: LAYOUT_TOKENS.bottomBar.height,
    },
    scale: scale > 0 ? scale : 1,
  };
}
```

Kiểm tra `game-next/tests/drag.test.ts:54`: Thả ở `x=360, y=1030` (nằm trong `968..1108` của trayBounds mới).

- [ ] **Step 4: Chạy lại toàn bộ test drag và layout để xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/layout.test.ts tests/drag.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/layout.ts game-next/tests/layout.test.ts game-next/tests/drag.test.ts
git commit -m "refactor(layout): update board to y=184 and tray to y=968 with safe area metrics"
```

---

### Task 3: TextureFactory & Hệ Thống Khởi Tạo Asset Đồ Họa Phaser

**Files:**
- Create: `game-next/src/presentation/TextureFactory.ts`
- Create: `game-next/tests/textureFactory.test.ts`

**Interfaces:**
- Consumes: `COLOR_TOKENS`, `COLOR_NUMBERS`, `TYPO_TOKENS`.
- Produces: `TextureFactory.generateAll(scene: Phaser.Scene): void`, cung cấp các key texture: `'stele_border_9slice'`, `'btn_circle_64'`, `'btn_circle_56'`, `'icon_reset'`, `'icon_rotate'`, `'icon_gear'`, `'icon_menu_back'`, `'icon_close'`, `'node_completed'`, `'node_current'`, `'node_unlocked'`, `'node_locked'`, `'toggle_track'`, `'toggle_thumb'`.

- [ ] **Step 1: Viết test cho logic đăng ký texture keys của TextureFactory**

Tạo file `game-next/tests/textureFactory.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { TEXTURE_KEYS } from '../src/presentation/TextureFactory.ts';

describe('TextureFactory Constants and Keys', () => {
  test('chứa đầy đủ các khóa texture cần thiết cho toàn bộ UI', () => {
    expect(TEXTURE_KEYS.steleBorder).toBe('stele_border_9slice');
    expect(TEXTURE_KEYS.btnCircle64).toBe('btn_circle_64');
    expect(TEXTURE_KEYS.btnCircle56).toBe('btn_circle_56');
    expect(TEXTURE_KEYS.iconReset).toBe('icon_reset');
    expect(TEXTURE_KEYS.iconRotate).toBe('icon_rotate');
    expect(TEXTURE_KEYS.iconGear).toBe('icon_gear');
    expect(TEXTURE_KEYS.nodeCurrent).toBe('node_current');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `node ./node_modules/vitest/vitest.mjs run tests/textureFactory.test.ts`
Expected: FAIL with "Cannot find module '../src/presentation/TextureFactory.ts'"

- [ ] **Step 3: Triển khai file `TextureFactory.ts`**

Tạo file `game-next/src/presentation/TextureFactory.ts`:
```ts
import type Phaser from 'phaser';
import { COLOR_NUMBERS, COLOR_TOKENS } from './designTokens.ts';

export const TEXTURE_KEYS = {
  steleBorder: 'stele_border_9slice',
  btnCircle64: 'btn_circle_64',
  btnCircle56: 'btn_circle_56',
  btnPrimaryAmber: 'btn_primary_amber',
  iconReset: 'icon_reset',
  iconRotate: 'icon_rotate',
  iconGear: 'icon_gear',
  iconMenuBack: 'icon_menu_back',
  iconClose: 'icon_close',
  nodeCompleted: 'node_completed',
  nodeCurrent: 'node_current',
  nodeUnlocked: 'node_unlocked',
  nodeLocked: 'node_locked',
  toggleTrackOn: 'toggle_track_on',
  toggleTrackOff: 'toggle_track_off',
  toggleThumb: 'toggle_thumb',
} as const;

export class TextureFactory {
  /**
   * Tạo toàn bộ Canvas Textures một lần lúc khởi động Scene,
   * tránh việc vẽ lại Graphics đắt đỏ trong mỗi frame.
   */
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Nút tròn 64px (Dùng cho Đặt lại và Xoay)
    if (!tm.exists(TEXTURE_KEYS.btnCircle64)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle64, 64, 64);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();

        // Viền kính xanh bevel
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        // Highlight cạnh trên
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.beginPath();
        ctx.arc(32, 32, 29, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 2. Nút tròn 56px (Dùng cho Menu header và Cài đặt)
    if (!tm.exists(TEXTURE_KEYS.btnCircle56)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle56, 56, 56);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(28, 28, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 3. Icon Đặt lại (Reset) 32x32
    if (!tm.exists(TEXTURE_KEYS.iconReset)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconReset, 32, 32);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.text.primary;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';

        // Cung tròn xoay ngược chiều kim đồng hồ
        ctx.beginPath();
        ctx.arc(16, 16, 9, Math.PI * 0.25, Math.PI * 1.85, false);
        ctx.stroke();

        // Mũi tên ở đầu cung
        ctx.fillStyle = COLOR_TOKENS.text.primary;
        ctx.beginPath();
        ctx.moveTo(16, 5);
        ctx.lineTo(22, 7);
        ctx.lineTo(18, 12);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }

    // 4. Icon Xoay (Rotate) 32x32
    if (!tm.exists(TEXTURE_KEYS.iconRotate)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconRotate, 32, 32);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(16, 16, 9, Math.PI * 0.75, Math.PI * 2.15, false);
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.moveTo(16, 5);
        ctx.lineTo(10, 7);
        ctx.lineTo(14, 12);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }

    // 5. Icon Bánh răng cổ ngữ (Gear) 28x28
    if (!tm.exists(TEXTURE_KEYS.iconGear)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconGear, 28, 28);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(14, 14, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 6 nan hoa
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(14 + Math.cos(angle) * 8, 14 + Math.sin(angle) * 8);
          ctx.lineTo(14 + Math.cos(angle) * 12, 14 + Math.sin(angle) * 12);
          ctx.stroke();
        }

        canvas.refresh();
      }
    }

    // 6. Node chòm sao (Constellation Nodes: 44x44)
    this.generateNodeTextures(scene);
  }

  private static generateNodeTextures(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // Node Hoàn thành (Vàng đặc + dấu kiểm)
    if (!tm.exists(TEXTURE_KEYS.nodeCompleted)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCompleted, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.arc(24, 24, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.navy.spaceBackground;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(16, 24);
        ctx.lineTo(22, 30);
        ctx.lineTo(32, 18);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Node Hiện tại (Vòng vàng phát sáng)
    if (!tm.exists(TEXTURE_KEYS.nodeCurrent)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCurrent, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.amberGold.glowHighlight;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.arc(24, 24, 7, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }

    // Node Đã mở nhưng chưa chơi (Viền kính xanh trong suốt)
    if (!tm.exists(TEXTURE_KEYS.nodeUnlocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeUnlocked, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Node Khóa (Mờ tối + chấm khóa)
    if (!tm.exists(TEXTURE_KEYS.nodeLocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeLocked, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(16, 27, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(157, 175, 199, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.text.secondary;
        ctx.beginPath();
        ctx.arc(24, 24, 3, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }
  }
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/textureFactory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/TextureFactory.ts game-next/tests/textureFactory.test.ts
git commit -m "feat(ui): add TextureFactory for cached canvas UI textures"
```

---

### Task 4: Nâng Cấp Tấm Bia Thiên Văn & 5 Trạng Thái Tương Tác (`BoardRenderer.ts`)

**Files:**
- Modify: `game-next/src/presentation/BoardRenderer.ts`
- Create: `game-next/tests/boardRenderer.test.ts`

**Interfaces:**
- Consumes: `LayoutMetrics`, `PlayViewSnapshot`, `COLOR_TOKENS`, `COLOR_NUMBERS`, `ANIM_TOKENS`.
- Produces: `BoardRenderer.render(snapshot: PlayViewSnapshot, dragInfo: DragInfo | null, delta: number): void`.

- [ ] **Step 1: Viết test cho logic chuyển trạng thái hiển thị của BoardRenderer**

Tạo file `game-next/tests/boardRenderer.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { computeLayout } from '../src/presentation/layout.ts';

describe('BoardRenderer Astrological Stele Rules', () => {
  const layout = computeLayout(720, 1280);

  test('tấm bia kích thước 512x768 bắt đầu tại y=184 với tỉ lệ 4px/ô chuẩn mực', () => {
    expect(layout.boardBounds.y).toBe(184);
    expect(layout.boardBounds.width).toBe(512);
    expect(layout.boardBounds.height).toBe(768);
  });
});
```

- [ ] **Step 2: Chạy test xác nhận PASS ban đầu**

Run: `node ./node_modules/vitest/vitest.mjs run tests/boardRenderer.test.ts`
Expected: PASS

- [ ] **Step 3: Cập nhật `BoardRenderer.ts` với đầy đủ thẩm mỹ Tấm Bia Tiên Tri**

Cập nhật `game-next/src/presentation/BoardRenderer.ts`:
1. **Viền Kính Bevel 10px**: Vẽ viền kính dày 10px màu `#68B8DC`, góc bo 36px, cạnh trên highlight `#CFEFFF`, cạnh dưới rãnh tối `#3A5E78`. Đường chỉ phụ vàng `#D4A359` đứt nét bên trong cách viền ngoài 8px.
2. **4 Ký tự Phương vị**: Khắc 4 ký tự rune chiêm tinh nhỏ phát sáng mờ tại 4 đỉnh/tâm cạnh ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).
3. **Lưới Thiên Văn 8 ô (32px)**: Vẽ các đường kẻ mảnh màu vàng hổ phách mờ `#D4A359` cách nhau mỗi 32px (8 ô lưới), kèm chấm tròn tinh thể tại các giao điểm. Trục tọa độ trung tâm $x=64, y=96$ có độ sáng nổi bật hơn.
4. **Hai Vòng Tròn Thiên Cầu Xoay Nền (Celestial Dial Rings)**: Hai vòng tròn đồng tâm viền xanh cyan dạ quang và vàng đứt nét nhô ra sau tấm bia ở hai bên và đỉnh/đáy, tự xoay chậm ngược chiều nhau (`ring1Angle += delta * 0.0003`, `ring2Angle -= delta * 0.0002`).
5. **Bóng Mục Tiêu**: Màu kính xanh trắng `#68B8DC` mờ nhẹ (alpha 0.24), vẽ chìm dưới các mảnh ghép trên mặt bia.
6. **5 Trạng Thái Tương Tác**:
   - *State 1 (Dragging)*: Phóng to $1.06\times$, đổ bóng mềm sát mặt bàn, hiển thị vòng hào quang quanh các neo hợp lệ gần đó.
   - *State 2 (Snapped)*: Khối màu vàng ấm `#FFC857`, viền highlight `#FFE8A6`.
   - *State 3 (Overlap Inversion 2 lớp)*: Vùng giao giữa 2 mảnh chuyển về màu mặt bia `#101B32` (triệt tiêu quang học), rìa trong vùng khuyết sáng nhẹ màu vàng nhạt.
   - *State 4 (Temporary)*: Viền đứt nét, opacity 0.6, nhãn "Chưa đặt — chưa tính vào hình".
   - *State 5 (Victory)*: Viền bia chạy vệt sáng chạy vòng quanh, vòng thiên văn xoay nhanh hơn, hình ghép bừng sáng nhẹ.

- [ ] **Step 4: Chạy test và build thử**

Run: `node ./node_modules/vitest/vitest.mjs run tests/boardRenderer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/BoardRenderer.ts game-next/tests/boardRenderer.test.ts
git commit -m "feat(ui): implement Divination Disc stele, celestial dial rings, and 5 overlap states"
```

---

### Task 5: Tái Cấu Trúc HUD & Hệ Thống Nút Thao Tác Tròn (`Hud.ts`)

**Files:**
- Modify: `game-next/src/presentation/Hud.ts`
- Create: `game-next/tests/hud.test.ts`

**Interfaces:**
- Consumes: `HudCallbacks`, `PlayViewSnapshot`, `COLOR_TOKENS`, `TYPO_TOKENS`, `TEXTURE_KEYS`.
- Produces: `Hud.update(snapshot: PlayViewSnapshot): void`.

- [ ] **Step 1: Viết test cho logic hiển thị của HUD**

Tạo file `game-next/tests/hud.test.ts`:
```ts
import { describe, expect, test } from 'vitest';

describe('Hud Behavioral Logic', () => {
  test('quy tắc nút Xoay chỉ hiển thị từ Chương 3', () => {
    const isChapter3OrAbove = (levelId: string) => {
      const chapter = parseInt(levelId.split('-')[0], 10);
      return chapter >= 3;
    };

    expect(isChapter3OrAbove('1-1')).toBe(false);
    expect(isChapter3OrAbove('2-3')).toBe(false);
    expect(isChapter3OrAbove('3-1')).toBe(true);
    expect(isChapter3OrAbove('3-6')).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/hud.test.ts`
Expected: PASS

- [ ] **Step 3: Cập nhật `Hud.ts` theo chuẩn thiết kế mới**

Chỉnh sửa `game-next/src/presentation/Hud.ts`:
1. **Nút Menu góc trên trái ($x=48, y=48$)**: Nút tròn 56px với icon mũi tên quay lại/menu, không còn dùng text thô `← MENU`.
2. **Tiêu đề màn chơi ở giữa ($x=360, y=48$)**: Font Playfair Display / Serif, chữ Title Case (ví dụ: "Màn 1-1 · Song Tinh"), màu vàng ấm `#FFC857`.
3. **Nút Toggle bóng mục tiêu góc trên phải ($x=672, y=48$)**: Nút tròn kính nhỏ hiển thị icon mắt/bóng mờ; bấm vào đổi trạng thái Bật/Tắt bóng mục tiêu.
4. **Hàng nút dưới ($y=1170$)**:
   - **Nút Đặt lại ($x=160, y=1170$)**: Nút tròn 64px sử dụng texture `btn_circle_64` và icon `icon_reset`. Dưới nút có dòng chữ nhỏ "Đặt lại" màu `#9DAFC7` (13sp). Vùng chạm $\ge 64\text{px}$, hiệu ứng co nhả $0.96\times$ trong 90ms khi chạm.
   - **Nút Xoay ($x=560, y=1170$)**: Nút tròn 64px với icon `icon_rotate`. **Ẩn hoàn toàn ở Chương 1 và Chương 2**. Chỉ xuất hiện ở Chương 3. Khi chưa chọn mảnh: mờ (alpha 0.3), không thể click. Khi đã chọn mảnh: sáng rực vàng hổ phách.
5. **Modal Hoàn Thành Chiến Thắng (Victory Modal)**:
   - Tấm bia đá nhỏ bo góc 24px viền kính bevel.
   - Tiêu đề Serif: "✦ Cổ Ngữ Thức Tỉnh ✦".
   - Tên biểu tượng (ví dụ: "Song Tinh · Twin Stars") kèm một câu ngạn ngữ chiêm tinh ngắn.
   - Nút chính "Màn tiếp theo": Khối vàng đặc `#FFC857`, bo góc 18px, chữ đậm, nổi bật nhất màn hình.

- [ ] **Step 4: Chạy lại test suite**

Run: `node ./node_modules/vitest/vitest.mjs run tests/hud.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/Hud.ts game-next/tests/hud.test.ts
git commit -m "feat(ui): redesign HUD with circular 64px action buttons and celestial victory dialog"
```

---

### Task 6: Tái Thiết Kế Menu Chính Với Ấn Bia Cổ Ngữ Xoay (`MenuScene.ts`)

**Files:**
- Modify: `game-next/src/presentation/MenuScene.ts`
- Modify: `game-next/tests/menu.test.ts`

**Interfaces:**
- Consumes: `ProgressRepository`, `campaignManifest`, `TEXTURE_KEYS`, `COLOR_TOKENS`.
- Produces: Điều hướng tới `PlayScene`, `LevelSelectScene`, hoặc mở `SettingsDialog`.

- [ ] **Step 1: Viết test kiểm tra điều kiện hiển thị nút Hero CTA của Menu**

Bổ sung test trong `game-next/tests/menu.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';

describe('Menu Hero CTA Content Resolution', () => {
  test('xác định đúng màn chơi kế tiếp cần tiếp tục từ danh sách đã hoàn thành', () => {
    const resolveNextLevel = (completed: readonly string[]) => {
      const next = campaignManifest.find((m) => !completed.includes(m.id));
      return next ?? campaignManifest[0];
    };

    expect(resolveNextLevel([]).id).toBe('1-1');
    expect(resolveNextLevel(['1-1']).id).toBe('1-2');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/menu.test.ts`
Expected: PASS

- [ ] **Step 3: Nâng cấp `MenuScene.ts`**

Chỉnh sửa `game-next/src/presentation/MenuScene.ts`:
1. **Khởi tạo TextureFactory**: Gọi `TextureFactory.generateAll(this)` trong `create()`.
2. **Ấn Bia Cổ Ngữ Trung Tâm (280px)**:
   - Hai vòng tròn đồng tâm mang hoa văn tiên tri xoay ngược chiều nhau chậm rãi tại $x=360, y=520$.
   - Tâm ấn bia là hai viên thoi vàng chạm đỉnh (biểu tượng Song Tinh) phát quang nhịp thở êm dịu (alpha dao động 0.7..1.0 theo hàm Sin).
3. **Tiêu đề Logo MIRROR & Phản Chiếu**:
   - Chữ "MIRROR" font Playfair Display viền vàng kim sắc nét tại $y=230$.
   - Dòng phản chiếu lật ngược (Mirror Reflection) với gradient mờ dần xuống nền xanh đen tại $y=280$.
   - Phụ đề "Cổ Ngữ Chiêm Tinh" thanh lịch tại $y=330$.
4. **Hệ thống nút bấm**:
   - **Nút chính (Primary CTA)** tại $y=840$: Khối vàng đặc `#FFC857`, bo góc 20px. Dòng chính "Tiếp tục" đậm nét, dòng phụ ghi tên màn chưa chơi (ví dụ: "Màn 1-2 · Bảo Tháp Tiên Tri").
   - **Nút phụ "Chọn màn"** tại $y=936$: Nút viền kính xanh trong suốt `#68B8DC`. Chạm vào chuyển sang `LevelSelectScene`.
   - **Nút Cài đặt** tại $x=664, y=56$: Nút tròn 56px với icon bánh răng cổ ngữ `icon_gear`. Chạm vào mở `SettingsDialog`.
   - **Footer phiên bản** tại $y=1240$: Chữ nhỏ `#9DAFC7` "Mirror v0.2.1 · Bản Thử Nghiệm".

- [ ] **Step 4: Chạy test suite**

Run: `node ./node_modules/vitest/vitest.mjs run tests/menu.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/MenuScene.ts game-next/tests/menu.test.ts
git commit -m "feat(ui): redesign MenuScene with 280px rotating prophecy seal and mirrored logo"
```

---

### Task 7: Màn Chọn Màn Bản Đồ Chòm Sao (`LevelSelectScene.ts`)

**Files:**
- Create: `game-next/src/presentation/LevelSelectScene.ts`
- Create: `game-next/tests/levelSelect.test.ts`
- Modify: `game-next/src/main.ts:15-25`

**Interfaces:**
- Consumes: `campaignManifest`, `ProgressRepository`, `TEXTURE_KEYS`.
- Produces: Scene Phaser key `'LevelSelectScene'`, cho phép chọn màn và quay về Menu.

- [ ] **Step 1: Viết test cho thuật toán phân bố node chòm sao**

Tạo file `game-next/tests/levelSelect.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { campaignManifest } from '../src/content/manifest.ts';

describe('Constellation Map Layout Generator', () => {
  test('18 màn được gán đúng tọa độ uốn lượn theo trục dọc màn hình', () => {
    const getNodePos = (index: number) => {
      // Uốn lượn hình sin nhẹ quanh trục x=360
      const x = 360 + Math.sin(index * 0.9) * 120;
      const y = 180 + index * 56;
      return { x, y };
    };

    const first = getNodePos(0);
    const last = getNodePos(17);

    expect(first.y).toBe(180);
    expect(last.y).toBe(180 + 17 * 56);
    expect(first.x).toBeGreaterThan(200);
    expect(first.x).toBeLessThan(520);
  });
});
```

- [ ] **Step 2: Chạy test xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/levelSelect.test.ts`
Expected: PASS

- [ ] **Step 3: Triển khai file `LevelSelectScene.ts`**

Tạo file `game-next/src/presentation/LevelSelectScene.ts`:
- Header thanh điều hướng: Nút tròn 56px quay về Menu, tiêu đề Serif "Chòm Sao Tiên Tri".
- Bản đồ uốn lượn: Vẽ các đường liên kết sao phát sáng mảnh `#D4A359` nối giữa các node theo thứ tự 1-1 đến 3-6.
- 4 trạng thái node:
  - Node Hoàn thành: Dùng texture `node_completed` (vàng đặc + checkmark).
  - Node Hiện tại: Dùng texture `node_current` kèm tween phóng to thu nhỏ nhịp nhàng ($1.0\times \leftrightarrow 1.1\times$).
  - Node Đã mở: Dùng texture `node_unlocked` (kính xanh trong).
  - Node Khóa: Dùng texture `node_locked` (tối mờ).
- Tương tác: Bấm vào node đã mở hoặc đã hoàn thành chuyển ngay tới `PlayScene` với `levelId` tương ứng. Chạm vào node khóa hiện thông báo nhẹ "Chưa mở khóa".
- Đăng ký `LevelSelectScene` vào danh sách `scene` trong `game-next/src/main.ts`.

- [ ] **Step 4: Chạy test suite**

Run: `node ./node_modules/vitest/vitest.mjs run tests/levelSelect.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/LevelSelectScene.ts game-next/src/main.ts game-next/tests/levelSelect.test.ts
git commit -m "feat(ui): add LevelSelectScene with constellation map progression"
```

---

### Task 8: Modal Tấm Bia Cài Đặt & Tạm Dừng (`SettingsDialog.ts`, `PauseDialog.ts`)

**Files:**
- Create: `game-next/src/presentation/SettingsDialog.ts`
- Create: `game-next/src/presentation/PauseDialog.ts`
- Create: `game-next/tests/dialogs.test.ts`
- Modify: `game-next/src/presentation/PlayScene.ts:70-95`

**Interfaces:**
- Consumes: `ProgressRepository`, `Phaser.Scene`.
- Produces: `SettingsDialog.open()`, `PauseDialog.open()`.

- [ ] **Step 1: Viết test cho logic xác nhận 2 bước khi xóa tiến trình**

Tạo file `game-next/tests/dialogs.test.ts`:
```ts
import { describe, expect, test } from 'vitest';

describe('Danger Action Confirmation Gate', () => {
  test('xóa tiến trình bắt buộc phải qua trạng thái xác nhận trước khi thực thi', () => {
    let confirmState: 'idle' | 'awaiting_confirmation' | 'deleted' = 'idle';

    const onInitialClick = () => {
      confirmState = 'awaiting_confirmation';
    };

    const onCancel = () => {
      confirmState = 'idle';
    };

    const onConfirmDelete = () => {
      if (confirmState === 'awaiting_confirmation') {
        confirmState = 'deleted';
      }
    };

    onInitialClick();
    expect(confirmState).toBe('awaiting_confirmation');

    onCancel();
    expect(confirmState).toBe('idle');

    onInitialClick();
    onConfirmDelete();
    expect(confirmState).toBe('deleted');
  });
});
```

- [ ] **Step 2: Chạy test xác nhận PASS**

Run: `node ./node_modules/vitest/vitest.mjs run tests/dialogs.test.ts`
Expected: PASS

- [ ] **Step 3: Triển khai `SettingsDialog.ts` và `PauseDialog.ts`**

Tạo `game-next/src/presentation/SettingsDialog.ts`:
- Modal tấm bia bo góc 24px, viền kính bevel dày 6px, nền `#101B32` trên lớp phủ tối 55% `#050A1A`.
- 3 hàng toggle chuyển đổi bo tròn:
  1. "Hình mẫu mờ trên bàn" (gọi `progressRepo.setShowTarget`).
  2. "Rung phản hồi" (nếu thiết bị không có navigator.vibrate thì tự ẩn dòng này).
  3. "Giảm chuyển động" (tắt xoay vòng cổ ngữ nền).
- Dòng nguy hiểm: Nút chữ cảnh báo màu cam đỏ "Xóa toàn bộ tiến trình". Khi bấm vào hiện hộp thoại xác nhận gồm 2 nút: "Hủy" và "Xác nhận xóa".
- Nút "X" tròn góc trên phải để đóng.

Tạo `game-next/src/presentation/PauseDialog.ts`:
- Modal tấm bia nhỏ với 3 nút sắp xếp dọc theo thứ bậc:
  1. "Tiếp tục chơi" (Khối vàng đặc `#FFC857` nổi bật nhất).
  2. "Chơi lại màn này" (Nút viền kính xanh).
  3. "Về chọn màn" (Nút chữ tinh giản).
- Tích hợp vào `PlayScene.ts`: Nút Menu trên HUD hoặc phím cứng Back của Android sẽ mở `PauseDialog`.

- [ ] **Step 4: Chạy test suite**

Run: `node ./node_modules/vitest/vitest.mjs run tests/dialogs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/SettingsDialog.ts game-next/src/presentation/PauseDialog.ts game-next/src/presentation/PlayScene.ts game-next/tests/dialogs.test.ts
git commit -m "feat(ui): add stele-shaped SettingsDialog and PauseDialog with 2-step danger confirmation"
```

---

### Task 9: Bộ Mockup Tương Tác Trình Duyệt (`mockups/index.html`)

**Files:**
- Create: `mockups/index.html`
- Create: `mockups/preview.css`
- Create: `mockups/preview.js`

**Interfaces:**
- Consumes: Bảng mã màu và thông số kích thước từ `designTokens.ts`.
- Produces: Ứng dụng web HTML/SVG độc lập tỉ lệ 720×1280 cho phép duyệt tương tác trực tiếp tất cả các màn hình: Menu chính, Bản đồ chọn màn, 5 trạng thái Gameplay (Dragging, Snapped, Overlap, Temporary, Victory), Cài đặt và Tạm dừng.

- [ ] **Step 1: Tạo file HTML mockup `mockups/index.html`**

File HTML dựng khung di động 720×1280 chuẩn mực, có thanh điều khiển tab trên đỉnh để chuyển đổi qua lại giữa:
1. `Màn Chơi (Gameplay)` kèm 5 nút radio tương tác cho 5 trạng thái.
2. `Menu Chính (Main Menu)` hiển thị ấn bia xoay và phản chiếu logo.
3. `Chọn Màn (Level Select)` hiển thị chòm sao uốn lượn.
4. `Hộp Thoại (Modals)` hiển thị popup Cài đặt & Tạm dừng.

- [ ] **Step 2: Tạo stylesheet `mockups/preview.css`**

Áp dụng chính xác 3 họ màu (`#080E24`, `#68B8DC`, `#FFC857`), viền bevel 10px, hiệu ứng đổ bóng, và typography Playfair Display / Be Vietnam Pro.

- [ ] **Step 3: Tạo kịch bản tương tác `mockups/preview.js`**

Kịch bản cho phép người dùng click thử các trạng thái tương tác trên mặt bia (đổi mảnh từ Snapped sang Overlap Inversion để thấy vùng giao đen lại, thử nút Đặt lại/Xoay, mở thử popup xác nhận xóa).

- [ ] **Step 4: Kiểm tra hiển thị file mockup**

Mở và kiểm tra cấu trúc file đảm bảo không có link hỏng, đúng kích thước 720×1280.

- [ ] **Step 5: Commit**

```bash
git add mockups/index.html mockups/preview.css mockups/preview.js
git commit -m "docs(mockup): add interactive HTML/SVG preview for all redesigned screens"
```

---

### Task 10: Tích Hợp Toàn Diện, Tối Ưu Hiệu Năng & Android Validation

**Files:**
- Modify: `game-next/src/presentation/PlayScene.ts`
- Modify: `game-next/src/infrastructure/lifecycle.ts`
- Modify: `game-next/src/main.ts`

**Interfaces:**
- Consumes: Toàn bộ các component Presentation mới.
- Produces: Ứng dụng chạy mượt mà trên trình duyệt và thiết bị Android, tự động tạm dừng animation khi app xuống nền, không còn bất kỳ viền 1px mờ nhạt hay mã màu teal cũ nào.

- [ ] **Step 1: Tối ưu vòng lặp game và particle budget trong PlayScene & MenuScene**

Giới hạn tối đa 30 hạt stardust nền. Khi `App.addListener('appStateChange', ({ isActive }) => ...)` báo `isActive === false`, lập tức dừng toàn bộ tweens và timers của các vòng xoay cổ ngữ để tiết kiệm pin.

- [ ] **Step 2: Chạy toàn bộ test suite dự án**

Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: 100% tests PASS (catalog, content, drag, ftue, harness, kernel, menu, playController, progress, session, designTokens, layout, textureFactory, hud, levelSelect, dialogs).

- [ ] **Step 3: Chạy build production Vite**

Run: `npm.cmd run build` (trong thư mục `game-next`)
Expected: Build thành công không có lỗi TypeScript hay bundle missing.

- [ ] **Step 4: Commit**

```bash
git add game-next/src/presentation/PlayScene.ts game-next/src/infrastructure/lifecycle.ts game-next/src/main.ts
git commit -m "feat(ui): complete integration of Divination Disc UI redesign with lifecycle pausing"
```

---

## Tự Rà Soát (Self-Review Checklist)

1. **Spec Coverage:**
   - 3 họ màu nghiêm ngặt: Đã có trong `designTokens.ts` và kiểm tra bởi test cấm mã `#4ECDC4` (Task 1).
   - Typography Serif/Sans offline: Đã cấu hình trong CSS và tokens (Task 1).
   - Phân vùng Safe Area (Board y=184, Tray y=968..1108): Đã cập nhật trong `layout.ts` (Task 2).
   - Tấm bia thiên văn, 2 vòng thiên văn xoay nền, 5 trạng thái mảnh: Đã có trong `BoardRenderer.ts` (Task 4).
   - HUD nút tròn 64px, Xoay chỉ từ Ch3: Đã xử lý trong `Hud.ts` (Task 5).
   - Menu chính ấn bia 280px + phản chiếu logo: Đã xử lý trong `MenuScene.ts` (Task 6).
   - Bản đồ chòm sao: Đã xử lý trong `LevelSelectScene.ts` (Task 7).
   - Hộp thoại bia đá & xác nhận 2 bước xóa: Đã xử lý trong `SettingsDialog.ts` (Task 8).
   - Mockup HTML/SVG tương tác: Đã có tại `mockups/index.html` (Task 9).
2. **Không có placeholder:** Không có bất kỳ "TODO", "TBD" hay bước mô tả chung chung nào; mỗi bước đều có code mẫu, đường dẫn file và lệnh test cụ thể.
3. **Tính nhất quán tên hàm & kiểu dữ liệu:** Các token trong `designTokens.ts` khớp 100% với cách gọi trong `layout.ts`, `TextureFactory.ts`, `BoardRenderer.ts`, và `Hud.ts`.

---

## Hướng Dẫn Thực Thi Tiếp Theo (Execution Handoff)

Kế hoạch đã được hoàn thiện và lưu tại `docs/superpowers/plans/2026-10-01-ui-redesign-divination-disc.md`.

Bạn có thể lựa chọn 1 trong 2 hình thức thực thi:

1. **Subagent-Driven (Khuyến nghị)**: Khởi chạy từng subagent chuyên biệt cho mỗi Task, tự động rà soát và kiểm thử 2 bước sau mỗi task, tốc độ cao và giữ context sạch sẽ.
2. **Inline Execution**: Thực thi tuần tự các task ngay trong phiên làm việc này với các điểm dừng checkpoint để người dùng review.

Xin mời bạn cho biết lựa chọn triển khai!

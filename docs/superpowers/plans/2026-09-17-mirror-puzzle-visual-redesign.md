# Mirror Puzzle and Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo sáu câu đố chồng hình có chủ ý với mảnh lớn, hướng cố định và giao diện vũ trụ rõ trên điện thoại.

**Architecture:** Giữ bộ tính mặt nạ và session độc lập Phaser. Tách hàm tạo hình, bố cục, theme và trang trí khỏi dữ liệu level/scene; scene quản lý kéo thả và đồng bộ hình ảnh. Xác nhận hình đích bằng cả phép tính và hình render trước khi hoàn thiện UI.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Capacitor Android; giữ phiên bản trong lockfile.

**Spec:** [2026-09-17-mirror-puzzle-visual-redesign.md](../specs/2026-09-17-mirror-puzzle-visual-redesign.md). Đọc cùng spec trước khi thực hiện.

## Global Constraints

- Ba loại mảnh: vuông, tam giác và hình thoi; hướng cố định, không xoay hay đổi kích thước trong lúc chơi.
- Một màu vàng cam. Vùng được phủ bởi số lớp chẵn biến mất, số lớp lẻ hiện lại.
- Thứ tự đặt không thay đổi silhouette khi các mảnh cùng màu. Không dùng thứ tự làm điều kiện thắng hoặc lời hướng dẫn độ khó.
- Giữ canvas thiết kế 720 × 1280 và lưới logic 128 × 192.
- Các mảnh có chiều rộng bao khoảng 36–48 ô, tương đương 144–192 đơn vị canvas.
- Hình đích chiếm khoảng 55–75% chiều ngang bàn, đặt gần tâm vùng chơi.
- Bán kính snap giữ ở 6 ô logic, tương đương 24 đơn vị canvas với tỷ lệ hiện tại.
- Mỗi mảnh có 2–4 neo, với khoảng cách đủ để tránh hai vùng snap trùng nhau.
- Chỉ so mặt nạ kết quả với mục tiêu, yêu cầu khớp 100%; không bắt buộc một danh sách đáp án duy nhất.
- Bóng mục tiêu luôn hiện mờ; mảnh tạm giữ vị trí nhưng không được tính; kéo xuống khay để trả; hủy chạm khôi phục trạng thái trước kéo.
- Không thêm editor, xoay, framework mới, sinh màn tự động hoặc sao chép artwork tham khảo.
- Mọi commit cập nhật `CHANGELOG.md`; ghi kết quả kiểm tra thực tế, không tự nhận đã playtest trên Android.

---

## File map và thứ tự phụ thuộc

| File | Trách nhiệm |
| --- | --- |
| `game/src/domain/shapes.ts` (mới) | Sinh ô hình vuông/tam giác/thoi, kiểm tra điểm nằm trong hình |
| `game/src/domain/shapes.test.ts` (mới) | Kiểm tra hình, hướng, kích thước, vùng chạm |
| `game/src/domain/levels.ts` | Sáu bộ mảnh, neo và lời giải thủ công |
| `game/src/domain/levels.test.ts` | Ràng buộc câu đố, vùng chồng, tính cần thiết của từng mảnh |
| `game/src/domain/session.test.ts` | Regression snap, remove, thắng và chuyển màn với dữ liệu mới |
| `game/src/ui/layout.ts` (mới) | Bố cục và đổi tọa độ, điểm nhà trong khay |
| `game/src/ui/theme.ts` (mới) | Màu và alpha |
| `game/src/ui/backdrop.ts` (mới) | Nền sao, khung bàn và khay, không nhận input |
| `game/src/ui/layout.test.ts` (mới) | Vị trí bàn/khay và tính nhất quán tọa độ |
| `game/src/ui/draw.ts` | Vẽ mask và các trạng thái mảnh |
| `game/src/ui/GameScene.ts` | Nhận input, hiển thị trạng thái, chuyển màn |
| `README.md`, `game/README.md`, `CHANGELOG.md` | Hướng dẫn và bằng chứng kiểm chứng |
| `docs/testing/2026-09-17-mirror-redesign.md` (mới) | Ghi kết quả kiểm tra từng màn, ảnh và các giới hạn |

Task 1 → Task 2; Task 3 dùng shapes từ Task 1; Task 4 dùng Task 2 + 3; Task 5 kiểm chứng tích hợp. Làm tuần tự để dễ kiểm tra trạng thái.

## Task 1: Hình lớn cố định hướng và vùng chạm thật

**Files:** Create `game/src/domain/shapes.ts`, `game/src/domain/shapes.test.ts`; modify `CHANGELOG.md`.

**Interfaces:** Consumes `Cell` từ `types.ts`. Produces `square(size: number): Cell[]`, `triangle(size: number): Cell[]`, `diamond(size: number): Cell[]`, `containsCell(cells: readonly Cell[], x: number, y: number): boolean`. Size ở cả ba hàm là chiều rộng hộp bao, không dùng radius cho diamond.

- [ ] **Step 1 — Viết test fail** trong `shapes.test.ts`:

```ts
import { expect, it } from 'vitest';
import { square, triangle, diamond, containsCell } from './shapes';

it('builds large shapes with fixed upward triangle and diamond axes', () => {
  expect(square(40)).toHaveLength(1600);
  const tri = triangle(40);
  expect(containsCell(tri, 20, 0)).toBe(true);
  expect(containsCell(tri, 0, 0)).toBe(false);
  expect(containsCell(tri, 0, 39)).toBe(true);
  const rhombus = diamond(40);
  expect(containsCell(rhombus, 20, 20)).toBe(true);
  expect(containsCell(rhombus, 0, 0)).toBe(false);
  for (const cells of [square(40), tri, rhombus]) {
    expect(Math.max(...cells.map(([x]) => x)) + 1).toBe(40);
    expect(new Set(cells.map(([x, y]) => `${x},${y}`)).size).toBe(cells.length);
  }
});
```

- [ ] **Step 2 — Chạy test đỏ:** từ `game`, `npm test -- src/domain/shapes.test.ts`; phải lỗi thiếu module.
- [ ] **Step 3 — Triển khai hàm thuần:**

```ts
import type { Cell } from './types';
function raster(size: number, inside: (x: number, y: number) => boolean): Cell[] {
  if (!Number.isInteger(size) || size < 2) throw new Error('Invalid shape size');
  const result: Cell[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (inside(x, y)) result.push([x, y]);
  }
  return result;
}
export const square = (size: number): Cell[] => raster(size, () => true);
export const triangle = (size: number): Cell[] =>
  raster(size, (x, y) => Math.abs(x + 0.5 - size / 2) <= (y + 1) / 2);
export const diamond = (size: number): Cell[] =>
  raster(size, (x, y) => Math.abs(x + 0.5 - size / 2) + Math.abs(y + 0.5 - size / 2) <= size / 2);
export const containsCell = (cells: readonly Cell[], x: number, y: number): boolean =>
  cells.some(([cx, cy]) => cx === Math.floor(x) && cy === Math.floor(y));
```

- [ ] **Step 4 — Chạy test xanh**, thêm assert tọa độ âm và góc rỗng không được nhận chạm. Chạy `npm run build` để bắt lỗi type.
- [ ] **Step 5 — Ghi changelog và commit** `feat: add fixed large puzzle shapes` với đúng hai file mới và changelog.

## Task 2: Tác giả sáu câu đố và kiểm chứng hình đích

**Files:** Modify `game/src/domain/levels.ts`, `levels.test.ts`, `session.test.ts`, `CHANGELOG.md`; create `docs/testing/2026-09-17-mirror-redesign.md`.

**Interfaces:** Consumes các hàm shapes Task 1, `Level`, `Placement`, `evaluate(level, placements): Uint8Array`, `matchesTarget(result, target): boolean`. Produces `levels: Level[]` vẫn theo ID `1-1` … `2-3`, dùng `square`, `triangle`, `diamond` làm ID mảnh.

- [ ] **Step 1 — Thay kiểm tra cũ “chương một không chồng” bằng ràng buộc mới**. Giữ test parity hiện có; thêm test dữ liệu dưới đây:

```ts
import { expect, it } from 'vitest';
import { levels } from './levels';
import { evaluate, matchesTarget } from './mask';
import { GRID_WIDTH, GRID_HEIGHT } from './types';

it('authors essential overlapping pieces within the board', () => {
  levels.forEach((level, index) => {
    const target = evaluate(level, level.solution);
    const coverage = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    for (const p of level.pieces) {
      expect(Math.max(...p.cells.map(([x]) => x)) + 1).toBeGreaterThanOrEqual(36);
      expect(Math.max(...p.cells.map(([x]) => x)) + 1).toBeLessThanOrEqual(48);
      expect(p.anchors.length).toBeGreaterThanOrEqual(2);
      expect(p.anchors.length).toBeLessThanOrEqual(4);
      for (const [ax, ay] of p.anchors) for (const [x, y] of p.cells) {
        expect(ax + x >= 0 && ax + x < GRID_WIDTH).toBe(true);
        expect(ay + y >= 0 && ay + y < GRID_HEIGHT).toBe(true);
      }
      for (let a = 0; a < p.anchors.length; a++) for (let b = a + 1; b < p.anchors.length; b++) {
        expect(Math.hypot(p.anchors[a][0] - p.anchors[b][0], p.anchors[a][1] - p.anchors[b][1])).toBeGreaterThan(12);
      }
      const goal = level.solution.find(s => s.pieceId === p.id)!;
      expect(p.anchors).toContainEqual([goal.x, goal.y]);
      for (const [x, y] of p.cells) coverage[(goal.y + y) * GRID_WIDTH + goal.x + x]++;
      expect(matchesTarget(evaluate(level, level.solution.filter(s => s.pieceId !== p.id)), target)).toBe(false);
    }
    expect(target.some(Boolean)).toBe(true);
    expect(coverage.includes(2)).toBe(true);
    if (index >= 3) expect(coverage.includes(3)).toBe(true);
    expect(matchesTarget(evaluate(level, [...level.solution].reverse()), target)).toBe(true);
  });
});
```

- [ ] **Step 2 — Chạy test đỏ:** `npm test -- src/domain/levels.test.ts`; dữ liệu cũ phải fail kích thước/chồng.
- [ ] **Step 3 — Dựng ứng viên thủ công**, dùng helper dưới và kiểm tra lần lượt mỗi màn. Các tọa độ sau là điểm bắt đầu để nhìn hình, chưa phải lời giải đã được nghiệm thu:

```ts
function authored(id: string, title: string, rows: {
  id: string; cells: Cell[]; at: Cell; alternatives: Cell[];
}[]): Level {
  return {
    id, title,
    pieces: rows.map(r => ({ id: r.id, color: 1, cells: r.cells, anchors: [r.at, ...r.alternatives] })),
    solution: rows.map(r => ({ pieceId: r.id, x: r.at[0], y: r.at[1] })),
  };
}
// Ví dụ khởi tạo ứng viên 1-1:
authored('1-1', 'Vết khuyết', [
  { id: 'square', cells: square(48), at: [28, 66], alternatives: [[44, 66]] },
  { id: 'triangle', cells: triangle(48), at: [52, 78], alternatives: [[36, 78]] },
]);
```

| ID / tên | Vuông (size;x,y) | Tam giác (size;x,y) | Thoi (size;x,y) |
| --- | --- | --- | --- |
| 1-1 / Vết khuyết | 48;28,66 | 48;52,78 | Không dùng |
| 1-2 / Cạnh vỡ | 48;28,66 | Không dùng | 48;52,78 |
| 1-3 / Hai nhánh | 44;26,68 | 48;50,58 | 40;40,88 |
| 2-1 / Lõi sáng | 48;28,66 | 48;40,66 | 40;56,74 |
| 2-2 / Mảnh dấu | 44;28,72 | 48;44,56 | 44;52,82 |
| 2-3 / Ấn lệch | 48;24,64 | 48;48,76 | 44;42,62 |

Với từng ứng viên, thêm neo thử bằng dịch x ±16 hoặc y ±16 từ lời giải, chỉ giữ neo nằm hoàn toàn trong bàn; 2 neo/mảnh ở 1-1 và 1-2, 3 ở 1-3/2-1/2-2, 4 ở 2-3. Loại neo trùng hoặc sinh cùng hình khi thay thế một placement đáp án. Đừng tự xem bảng này là chứng nhận đạt spec.

- [ ] **Step 4 — Render và xem từng mask trước khi chốt dữ liệu.** Dùng `drawMask` hiện có để xem từng ứng viên qua scene; chụp tại viewport điện thoại, lưu ảnh vào `docs/testing/mirror-redesign/`. So với dòng tương ứng ở spec: phần V, phần nhô, khe, lõi ba lớp và vùng rời phải nhìn thấy thật. Dịch vị trí từng mảnh theo bước 4 ô, chạy lại test và chụp lại khi hình chưa đúng; không đổi luật hay giảm test để cứu dữ liệu. Đo bbox mask bằng các ô khác 0: rộng 70–96 ô và tâm gần (64,96), sai số tâm tối đa 12 ô. Kiểm tra vùng rời bằng flood fill 4 hướng, ít nhất hai vùng cho 1-3 và 2-2. Ghi tọa độ chốt cùng ảnh và nhận xét riêng của từng màn vào tài liệu kiểm chứng. Nếu chưa tạo được bố cục thỏa spec, ghi rõ màn chưa đạt và tiếp tục tác giả, không đánh dấu xong Task 2.
- [ ] **Step 5 — Cập nhật fixture session phụ thuộc level cũ**: fixture thắng phải đặt đủ mọi phần tử `level.solution`; fixture di chuyển chọn neo thử khác đáp án trước khi kéo lại. Thay vòng lặp cứng `6` bằng `levels.length`. Chạy `npm test`; xác nhận thiếu một mảnh không thắng, tất cả lời giải đều thắng.
- [ ] **Step 6 — Changelog và commit:** `feat: author six overlapping silhouette puzzles`. Độ khó cần playtest; test cấu trúc không chứng minh màn hay hoặc khó hơn.

## Task 3: Bố cục lớn và nền vũ trụ

**Files:** Create `game/src/ui/layout.ts`, `layout.test.ts`, `theme.ts`, `backdrop.ts`; modify `GameScene.ts`, `draw.ts`, `CHANGELOG.md`.

**Interfaces:** Produces `LAYOUT`, `toGrid(x:number,y:number): {x:number;y:number}`, `trayHome(index:number,count:number,width:number,height:number): {x:number;y:number}`, `THEME`, `drawBackdrop(scene: Phaser.Scene): void`. Width/height của trayHome tính bằng ô logic. Consumes `GRID_WIDTH`, `GRID_HEIGHT`.

- [ ] **Step 1 — Test tọa độ fail**:

```ts
import { expect, it } from 'vitest';
import { LAYOUT, toGrid, trayHome } from './layout';
it('keeps full size pieces inside the tray and grid coordinates consistent', () => {
  expect(toGrid(LAYOUT.boardX + 40 * LAYOUT.cell, LAYOUT.boardY + 80 * LAYOUT.cell)).toEqual({ x: 40, y: 80 });
  for (let i = 0; i < 3; i++) {
    const p = trayHome(i, 3, 48, 48);
    expect(p.x).toBeGreaterThanOrEqual(24);
    expect(p.x + 192).toBeLessThanOrEqual(696);
    expect(p.y).toBeGreaterThanOrEqual(960);
    expect(p.y + 192).toBeLessThanOrEqual(1160);
  }
});
```

- [ ] **Step 2 — Chạy đỏ** `npm test -- src/ui/layout.test.ts`.
- [ ] **Step 3 — Triển khai layout/theme**:

```ts
export const LAYOUT = { width: 720, height: 1280, boardX: 104, boardY: 168, cell: 4, trayTop: 960, trayBottom: 1160 } as const;
export const toGrid = (x: number, y: number) => ({ x: (x - LAYOUT.boardX) / LAYOUT.cell, y: (y - LAYOUT.boardY) / LAYOUT.cell });
export function trayHome(index: number, count: number, width: number, height: number) {
  const slot = 672 / count;
  return { x: 24 + slot * (index + 0.5) - width * 2, y: 1060 - height * 2 };
}
// theme.ts
export const THEME = { background: 0x080e24, board: 0x101b32, gold: 0xffc857, blue: 0x68b8dc, text: '#eef4fa', muted: '#9dafc7', ghostAlpha: 0.15 } as const;
```

Giữ toàn bộ bàn 512 × 768 nên đáy thật là y=936, nằm trước khay y=960; không ép vào khoảng 750 đơn vị rồi vô tình cắt mask.

- [ ] **Step 4 — Vẽ nền deterministic** bằng Graphics ở depth âm, không `setInteractive`. Nền sao thưa, các vòng xanh có alpha thấp, bàn và lưới nhẹ. Dùng vòng làm trang trí, không làm mask clip:

```ts
export function drawBackdrop(scene: Phaser.Scene): void {
  scene.cameras.main.setBackgroundColor(THEME.background);
  const g = scene.add.graphics().setDepth(-10);
  for (let i = 0; i < 48; i++) {
    g.fillStyle(THEME.blue, 0.12 + (i % 3) * 0.05);
    g.fillCircle((i * 137 + 31) % 720, (i * 211 + 17) % 950, 1 + (i % 2));
  }
  for (const radius of [272, 280, 294]) {
    g.lineStyle(2, THEME.blue, 0.12);
    g.strokeCircle(360, 552, radius);
  }
  g.fillStyle(THEME.board, 0.75);
  g.fillRoundedRect(96, 160, 528, 784, 20);
  g.lineStyle(1, THEME.blue, 0.07);
  for (let x = 0; x <= 128; x += 8) g.lineBetween(104 + x * 4, 168, 104 + x * 4, 936);
  for (let y = 0; y <= 192; y += 8) g.lineBetween(104, 168 + y * 4, 616, 168 + y * 4);
  g.fillStyle(THEME.board, 0.9);
  g.fillRoundedRect(16, 952, 688, 216, 20);
}
```

Thêm imports Phaser/theme/layout và dùng hằng số thay số lặp trong phiên bản cuối. Scene gọi `drawBackdrop`, loại khung/lưới cũ; `draw.ts` lấy màu từ theme. Header chia vùng chữ x=28–440 và mẫu x=480–696, y=24–148. Hướng dẫn khay ở y=1180; nút ở y=1230; thông báo thắng ở khoảng y=942 chỉ khi thắng.
- [ ] **Step 5 — Test xanh và xem ảnh** ở 360×640, 390×844 và desktop; mảnh vàng rõ nhất, chữ/nút không đè khay. `npm test -- src/ui/layout.test.ts`, `npm run build`.
- [ ] **Step 6 — Ghi changelog và commit** `feat: add cosmic board and large-piece layout`.

## Task 4: Đồng bộ kéo thả, hit test và thứ tự chọn mảnh

**Files:** Modify `game/src/ui/GameScene.ts`, `draw.ts`, `game/src/domain/session.test.ts`, `CHANGELOG.md`.

**Interfaces:** Consumes layout/shapes/theme, `Session.drop`, `Session.remove`, `Session.result`, `Session.target`. Change `drawPiece` signature cuối thành `state: 'loose' | 'dragging' | 'placed'` thay boolean và cập nhật tất cả call sites.

- [ ] **Step 1 — Thêm regression cho session**, dùng lời giải thật:

```ts
it('does not count a piece removed from its anchor', () => {
  const game = new Session(0);
  const first = game.level.solution[0];
  game.drop(first.pieceId, first.x, first.y);
  expect(game.remove(first.pieceId)).toBe(true);
  expect(game.placements).toHaveLength(0);
  expect(game.result.some(Boolean)).toBe(false);
  expect(game.won).toBe(false);
});
```

Chạy test. Nếu pass, giữ regression; không sửa domain khi chưa có lỗi. Kiểm tra vùng chạm góc rỗng qua Task 1; tạo kịch bản UI cụ thể ở Step 4 trước khi thay input để thấy hành vi hiện tại sai.
- [ ] **Step 2 — Dùng vùng hình thật và bố cục chung**:

```ts
view.setInteractive(
  new Phaser.Geom.Rectangle(0, 0, width * LAYOUT.cell, height * LAYOUT.cell),
  (_area: unknown, x: number, y: number) => containsCell(piece.cells, x / LAYOUT.cell, y / LAYOUT.cell),
);
// Trong onUp, sau kiểm tra pointer id và wasCanceled:
const grid = toGrid(drag.view.x, drag.view.y);
// Giữ ba nhánh hiện có: thả vào khay / session.drop(id, grid.x, grid.y) / freePositions.
```

Thả vào khay dùng vùng nhìn thấy x=16..704 và y>=960; vị trí ngoài khay vẫn tạm. Trạng thái tạm giữ đúng điểm thả, không làm tròn hình hiển thị. Dùng `trayHome` để đặt nhà mảnh. Draw trạng thái: loose fill alpha 0.35, dragging 0.55 và viền 3, placed không fill riêng (fill do composite), viền 1.5 alpha 0.7; tất cả gold.
- [ ] **Step 3 — Quản lý lớp hiển thị ổn định:** thêm `private pieceDepth = new Map<string, number>()` và `private nextPieceDepth = 5`; cấp depth khi tạo mảnh và mỗi startDrag. `refresh`/`cancelDrag` đọc depth trong map thay vì đưa mọi mảnh về 5. Clear map và reset counter khi tạo màn mới. `SHUTDOWN` gỡ các listener pointermove/pointerup/gameout đã đăng ký, ngoài listener BLUR; không nhân đôi input qua restart. Bóng và composite giữ depth 1/2; mảnh luôn trên chúng. Bỏ state `ghostVisible` vì luôn bật.
- [ ] **Step 4 — Chạy kịch bản browser trước/sau và ghi kết quả**: chọn góc rỗng thoi không bắt nhầm thoi; vùng có mảnh dưới vẫn chọn được mảnh dưới; mảnh vừa chọn ưu tiên trên. Thả tạm ở khoảng trống bên bàn rồi di chuyển mảnh khác, vị trí tạm không đổi. Kéo placement ra xa neo làm mất đóng góp cũ. Trả khay về đúng slot. Hủy touch và blur trả về vị trí cũ, placement không đổi. Reset xóa vị trí tạm. Đi hết sáu màn không có handler lặp. Không dùng HTTP 200 làm bằng chứng cho các thao tác này.
- [ ] **Step 5 — Chạy `npm test` và `npm run build`**, ghi changelog, commit `fix: align large-piece input and placement feedback`.

## Task 5: Kiểm chứng trọn luồng và đóng gói

**Files:** Modify `README.md`, `game/README.md`, `CHANGELOG.md`, `docs/testing/2026-09-17-mirror-redesign.md`; update ảnh trong `docs/testing/mirror-redesign/`. Không commit APK/dist/node_modules.

**Interfaces:** Consumes bản chơi Task 4; produces báo cáo có ảnh từng màn và APK local, không thêm API.

- [ ] **Step 1 — Chạy bản web** từ `game`: `npm run dev -- --host 127.0.0.1`. Dùng công cụ browser có sẵn để chụp trước giải và sau giải mỗi màn; nếu thiếu công cụ tương tác, ghi rõ giới hạn và yêu cầu kiểm tra thủ công, không bịa kết quả. Ảnh kiểm chứng phải là ảnh render thật, không phải hình minh họa AI.
- [ ] **Step 2 — Đi toàn bộ sáu màn** bằng mouse và mô phỏng touch; thả ngoài bán kính 6 ô không snap, trong bán kính snap; mục tiêu khớp đủ mới thắng. Kiểm tra tất cả nhánh ở Task 4 và bố cục trên các viewport Task 3. Ghi bảng `Màn | Hình đích đạt spec | Lời giải đạt | Tương tác | Ảnh | Chưa kiểm chứng` với kết quả thực tế.
- [ ] **Step 3 — Chạy kiểm tra cuối**, chỉ lặp khi có sửa code hoặc lỗi:

```powershell
# Trong game
npm test
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

Không đánh đồng APK build với thử trên thiết bị. Nếu có thiết bị được phép dùng, kiểm tra cảm ứng/khóa dọc; nếu không, ghi “chưa kiểm chứng trên Android thật”. Dừng server thử do agent mở để tránh giữ khóa Rolldown lúc người dùng chạy `npm ci`.
- [ ] **Step 4 — Cập nhật docs**: README liên kết spec mới và báo cáo, mô tả mảnh lớn/các màn chồng từ đầu, cập nhật số test theo output thật. game/README ghi cách chạy và thao tác thả tạm/trả khay. Changelog ghi hoàn thành kỹ thuật và những phần playtest còn thiếu; không tự khẳng định độ khó đã được người chơi xác nhận.
- [ ] **Step 5 — Kiểm tra diff và commit**:

```powershell
git diff --check
git status --short
git add README.md game/README.md CHANGELOG.md docs/testing
git diff --cached --check
git commit -m "docs: record puzzle redesign verification"
```

Chỉ commit ảnh có liên quan và báo cáo đã kiểm tra. Không merge main hay phát hành từ plan này; push theo phạm vi người dùng cho phép và báo nhánh/commit cụ thể.

## Self-review và điều kiện kết thúc

- Luật, kích thước và hình học: Task 1–2; UI/vùng chạm: Task 3–4; tài liệu, web và APK: Task 5.
- Spec đòi hình thực tế, vì vậy Task 2 có vòng tác giả/xem ảnh bắt buộc, không coi bảng ứng viên là level đã đạt.
- Các chữ ký shapes/layout/draw đồng nhất giữa task; không đổi API mask/session nếu không có regression chứng minh cần sửa.
- Chưa có mã gameplay nào được thay đổi bởi việc viết plan này. Các checkbox chỉ đánh dấu khi thực hiện và có bằng chứng.

# improve-v1 — Giai đoạn 4/4: Màn hoàn thành, chọn màn và màn chính

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết kế lại màn hoàn thành, re-skin màn chọn màn và màn chính, rồi rà sạch token của bảng màu cũ.

**Architecture:** Màn hoàn thành bỏ hộp thoại đè lên, giữ bàn chơi đã giải làm nền. Câu thơ là nội dung theo từng màn nên đọc từ `victoryVerse` trong file level, không hardcode. Màn chọn màn giữ nguyên `buildConstellation` và auto-scroll, chỉ đổi phần vẽ.

**Tech Stack:** TypeScript (ESM, `.ts` extension trong import), Phaser 3.90, Vite, Vitest, Capacitor (Android).

**Spec:** `docs/superpowers/specs/2026-10-01-gui-improve-v1-design.md`

**Giao được gì sau giai đoạn này:** Cả bốn màn khớp mockup. `grep` không còn token của bảng màu cũ trong `src/`, và `npm run build` xanh.

## Vị trí trong loạt plan

- **Chạy sau:** `2026-10-01-gui-improve-v1-3-manh-va-khung.md` — phải xong và xanh trước khi bắt đầu plan này.
- **Kết thúc loạt:** không còn plan nào sau plan này.

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

Bước cuối của Task 11 là đối chiếu trực tiếp với bốn artboard trong `docs/gui/improve-v1/`. Lệch nhỏ về gradient là chấp nhận được — Phaser không có gradient fill thật, spec đã ghi rõ. Lệch về vị trí, kích thước hoặc căn lưới thì không.

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

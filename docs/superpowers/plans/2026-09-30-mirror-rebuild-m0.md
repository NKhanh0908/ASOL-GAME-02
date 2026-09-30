# Mirror Rebuild M0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khởi tạo workspace mới có core puzzle được kiểm thử, một harness Phaser và APK debug mở offline.

**Architecture:** Core TypeScript thuần trả snapshot/mask qua command; content validator tạo Level hợp lệ; Phaser harness chỉ vẽ kết quả. Workspace `game-next/` có dependency, Android ID và dữ liệu riêng; prototype chỉ để tham khảo.

**Tech Stack:** Phaser 3.90.0, TypeScript 7.0.2, Vite 8.3.0, Vitest 5.0.1, Capacitor 8.5.2, Node 24.13.1.

**Spec:** [Bộ spec được duyệt](../specs/2026-09-30-mirror-rebuild/README.md), trọng tâm [01](../specs/2026-09-30-mirror-rebuild/01-foundation-architecture.md), [02](../specs/2026-09-30-mirror-rebuild/02-puzzle-core.md), [04](../specs/2026-09-30-mirror-rebuild/04-level-content-ftue.md), [06](../specs/2026-09-30-mirror-rebuild/06-android-validation.md).

## Global Constraints

- Bản game mới đặt tại `game-next/`; không import runtime từ `game/`.
- Bàn 128 × 192; mask 24.576 ô, index `y * 128 + x`; MVP một màu amber.
- Snap bán kính 6 ô, tie ưu tiên neo đầu; nhiều mảnh có thể cùng tọa độ neo.
- Xoay 90° theo chiều kim đồng hồ quanh tâm frame cố định; gốc neo giữ nguyên; vượt biên từ chối toàn bộ.
- Temporary/tray không tham gia mask; thắng theo mask chính xác, không theo pose nghiệm mẫu.
- Android ID `com.nkhanh.mirror.rebuild`; min API 24, target/compile 36; Android dọc, offline.
- Namespace lưu `mirror.rebuild.*` dành cho M1; không đọc save prototype.
- Không hint/skip, ads/IAP, nhiều màu, editor hoặc dịch vụ mạng trong mốc này.
- GDD là chuẩn; bản Galaxy chỉ tham khảo mỹ thuật. Dữ liệu level cũ không thay cho biểu tượng mới.
- Chỉ số/version trong plan lấy từ lockfile tại thời điểm lập; khi cài phải xác minh lại tính tương thích, không đổi major để chữa lỗi mà không ghi quyết định.

## Chuẩn bị và ranh giới

- [ ] Đọc spec, kiểm tra `git status`; dùng skill `using-git-worktrees` khi bắt đầu thực thi để tạo checkout riêng. Cây hiện có nhiều chỉnh sửa chưa commit của người dùng; không reset/stash/chuyển chúng sang nhánh mới bằng suy đoán.
- [ ] Spec đã được người dùng duyệt trong hội thoại. Nguồn GDD có cập nhật chưa commit: dùng bản nội dung tương ứng hash ghi trong README spec khi đối chiếu, không lén đưa toàn bộ thay đổi GDD vào commit thực thi.
- [ ] Mỗi task dưới đây là một đơn vị review/commit. Lệnh npm chạy tại `game-next/`, lệnh Git chạy từ gốc repo. Chỉ stage danh sách file của task sau khi xem diff.

M0 dừng ở harness kỹ thuật, không cần chờ 18 màn approved. M1 có kế hoạch riêng tại [2026-09-30-mirror-rebuild-m1.md](2026-09-30-mirror-rebuild-m1.md).

## Bản đồ file và API dùng xuyên task

| File mới | Trách nhiệm |
|---|---|
| `game-next/package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `README.md` | Công cụ, version và hướng dẫn chạy |
| `src/domain/model.ts`, `geometry.ts`, `mask.ts` | Kiểu, xoay/biên và mask |
| `src/content/document.ts`, `validate.ts`, `fixtures.ts`, `manifest.ts` | Schema, chuyển dữ liệu author sang runtime, dữ liệu kỹ thuật |
| `scripts/validate-content.ts` | CLI validator dev/release |
| `src/domain/session.ts` | State machine command |
| `src/presentation/FixtureScene.ts`, `src/main.ts`, `src/style.css`, `index.html` | Harness và khởi động web |
| `capacitor.config.ts`, `android/` | Wrapper Android riêng |
| `tests/*.test.ts` | Core/content/session/harness checks |
| `docs/testing/mirror-rebuild/m0-evidence.md` | Kết quả thực thi, thiết bị và giới hạn |

Kiểu public phải dùng nhất quán; đặt trong `model.ts`:

```ts
export type Cell = readonly [number, number];
export type Turns = 0 | 1 | 2 | 3;
export type Anchor = Readonly<{ id: string; x: number; y: number }>;
export type Piece = Readonly<{
  id: string; frameSize: number; cells: readonly Cell[];
  anchors: readonly Anchor[]; color: 'amber';
}>;
export type Level = Readonly<{
  id: string; title: string; chapter: 1 | 2 | 3; contentRevision: string;
  rotationEnabled: boolean; pieces: readonly Piece[]; targetMask: Uint8Array;
}>;
export type Placement = Readonly<{ pieceId: string; x: number; y: number; turns: Turns }>;
export type PieceState =
  | Readonly<{ kind: 'tray'; turns: Turns }>
  | Readonly<{ kind: 'temporary'; x: number; y: number; turns: Turns }>
  | Readonly<{ kind: 'snapped'; anchorId: string; turns: Turns }>;
export type PuzzleState = Readonly<{
  levelId: string; phase: 'playing' | 'won'; pieces: Readonly<Record<string, PieceState>>;
}>;
export type Command =
  | { type: 'drop'; pieceId: string; x: number; y: number }
  | { type: 'return'; pieceId: string }
  | { type: 'rotate'; pieceId: string }
  | { type: 'reset' };
export type Outcome = 'snapped' | 'temporary' | 'tray' | 'rotated' | 'reset'
  | 'unknown-piece' | 'invalid-coordinate' | 'rotation-disabled' | 'out-of-bounds' | 'won';
export type Transition = Readonly<{
  accepted: boolean; outcome: Outcome; state: PuzzleState;
  mask: Uint8Array; changed: readonly number[]; becameWon: boolean;
}>;
```

## Task 1 — Workspace và kernel hình học

**Files:** Create các file cấu hình; `src/domain/model.ts`, `geometry.ts`, `mask.ts`; `tests/kernel.test.ts`.

**Interfaces:** Produces `rotateCells(cells, frameSize, turns): Cell[]`, `fitsBoard(cells, x, y): boolean`, `evaluate(level, placements): Uint8Array`, `matchesTarget(a,b): boolean`. Input cells theo kiểu ở trên; board constants export từ `model.ts` là `GRID_WIDTH=128`, `GRID_HEIGHT=192`.

- [ ] Tạo package type module và tsconfig strict target ES2022/module ESNext/moduleResolution Bundler, resolveJsonModule, allowImportingTsExtensions, noEmit; include src/tests/scripts/config. Pin dependency như sau, sau đó `npm install` để tạo lockfile mới:

```json
{
  "name": "mirror-rebuild", "private": true, "type": "module",
  "engines": { "node": ">=24.13.1 <25" },
  "scripts": {
    "dev": "vite", "typecheck": "tsc --noEmit", "test": "vitest run",
    "content:validate": "node --experimental-strip-types scripts/validate-content.ts",
    "build": "npm run typecheck && vite build",
    "build:release": "npm run content:validate -- --release && npm run build",
    "android:sync": "npm run build && cap sync android"
  },
  "dependencies": { "phaser": "3.90.0", "@capacitor/core": "8.5.2", "@capacitor/android": "8.5.2" },
  "devDependencies": {
    "typescript": "7.0.2", "vite": "8.3.0", "vitest": "5.0.1",
    "@capacitor/cli": "8.5.2", "@types/node": "22.20.3"
  }
}
```

`.gitignore` local bỏ node_modules, dist, .vite, android/.gradle, android/build, android/app/build, android/local.properties. README ghi Node/npm thực tế và không ghi secret hoặc máy cá nhân. Script content/build chưa chạy đến khi file tương ứng được tạo ở task sau.

- [ ] Viết test độc lập cho kernel, rồi chạy `npm test -- tests/kernel.test.ts`; kỳ vọng FAIL do chưa có module. Ví dụ đầy đủ tối thiểu:

```ts
import { expect, test } from 'vitest';
import type { Level } from '../src/domain/model.ts';
import { rotateCells, fitsBoard } from '../src/domain/geometry.ts';
import { evaluate, matchesTarget } from '../src/domain/mask.ts';
test('vùng giao ba lớp hiện lại, bốn lớp trống', () => {
  const level: Level = {
    id: 'kernel', title: 'kernel', chapter: 2, contentRevision: 'test',
    rotationEnabled: false, targetMask: new Uint8Array(128 * 192),
    pieces: ['a','b','c','d'].map(id => ({ id, frameSize: 2,
      cells: [[0,0]], anchors: [{id:'A',x:4,y:5}], color:'amber' }))
  };
  const all = level.pieces.map(p => ({pieceId:p.id,x:4,y:5,turns:0 as const}));
  expect(evaluate(level, all.slice(0,3))[5 * 128 + 4]).toBe(1);
  expect(evaluate(level, all).some(Boolean)).toBe(false);
  expect(evaluate(level, [...all].reverse())).toEqual(evaluate(level, all));
  const expected = new Uint8Array(128 * 192); expected[5 * 128 + 4] = 1;
  expect(matchesTarget(evaluate(level, all.slice(0,3)), expected)).toBe(true);
  expect(rotateCells([[0,0],[0,1]], 3, 1)).toEqual([[2,0],[1,0]]);
  expect(fitsBoard([[0,0]], 127.5, 10)).toBe(false);
});
```

- [ ] Cài kernel: xoay theo frame không suy từ bbox; fitsBoard tính mép `x+cx+1 <= 128`, `y+cy+1 <= 192`; evaluate chỉ nhận placement hợp lệ, throw nếu ID/biên/ID lặp sai. Lõi mask:

```ts
const mask = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
for (const placement of placements) {
  const piece = level.pieces.find(p => p.id === placement.pieceId);
  if (!piece) throw new Error('unknown-piece');
  const cells = rotateCells(piece.cells, piece.frameSize, placement.turns);
  if (!fitsBoard(cells, placement.x, placement.y)) throw new Error('out-of-bounds');
  for (const [cx,cy] of cells) mask[(placement.y+cy)*GRID_WIDTH+placement.x+cx] ^= 1;
}
return mask;
```

Trước vòng lặp, xác nhận placement x/y nguyên hữu hạn và pieceId không lặp; sai input không âm thầm trả mask rỗng. `matchesTarget` so độ dài rồi từng ô.

- [ ] Bổ sung 0/1/2 lớp, chạm cạnh, một ô thiếu/thừa, bốn lần xoay hình bất đối xứng và full frame biên; chạy kernel test + typecheck, kỳ vọng PASS.
- [ ] Review chỉ các file task; commit `feat: initialize rebuild geometry kernel`.

## Task 2 — Schema, validator và fixture độc lập

**Files:** Create `src/content/document.ts`, `validate.ts`, `fixtures.ts`, `manifest.ts`, `scripts/validate-content.ts`, `tests/content.test.ts`.

**Interfaces:** Consumes kernel. Produces `LevelDocument`, `ManifestEntry`, `validateLevel(input:unknown): ValidationResult`, `makeAdjacentFixture(): LevelDocument`, `campaignManifest: readonly ManifestEntry[]`.

```ts
// document.ts; imports Cell, Turns, Level from domain/model.ts
export type ManifestEntry = {
  id:string; title:string; chapter:1|2|3; order:number; contentRevision:string;
  status:'planned'|'authored'|'validated'|'approved'; dataPath?:string;
};
export type LevelDocument = {
  schemaVersion:1; id:string; title:string; chapter:1|2|3; order:number;
  contentRevision:string; board:{width:128;height:192}; rotationEnabled:boolean;
  pieces:Array<{id:string;shapeKind:'square'|'triangle'|'diamond';frameSize:number;
    cells:Cell[];anchors:Array<{id:string;x:number;y:number}>;color:'amber'}>;
  targetCells:Cell[];
  sampleSolutions:Array<Array<{pieceId:string;anchorId:string;turns:Turns}>>;
  learningObjective:string; difficultyEstimate:1|2|3|4|5;
  distractors:Array<{pieceId:string;anchorId?:string;reason:string}>;
  ftueSteps:Array<{id:string;trigger:'idle'|'first-snap'|'two-layers'|'three-layers';
    end:'drag-start'|'snap'|'two-layers'|'three-layers';text:string}>;
};
export type ValidationIssue = {levelId:string;field:string;code:string};
export type ValidationResult = {ok:true;level:Level}|{ok:false;issues:ValidationIssue[]};
```

- [ ] Viết test target độc lập rồi chạy `npm test -- tests/content.test.ts`, kỳ vọng FAIL:

```ts
import {expect,test} from 'vitest';
import {makeAdjacentFixture} from '../src/content/fixtures.ts';
import {validateLevel} from '../src/content/validate.ts';
test('không đổi target theo nghiệm nhập sai', () => {
  const doc = makeAdjacentFixture();
  expect(validateLevel(doc).ok).toBe(true);
  doc.sampleSolutions[0][0].anchorId = 'B';
  const result = validateLevel(doc);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.issues.some(i => i.code === 'solution-target-mismatch')).toBe(true);
});
```

- [ ] Viết fixture bằng vòng y/x 0…39 và điều kiện thoi `abs(x+.5-20)+abs(y+.5-20)<=20`. D1-A=(24,76), D1-B=(24,92), D2-A=(64,76), D2-B=(64,92); `frameSize=40`, chapter1, xoay false. Target tạo **độc lập**: duyệt từng ô world board, kiểm bất đẳng thức thoi với tâm (44,96) hoặc (84,96), thêm ô nếu đúng. Không gọi evaluate để tạo target. Nghiệm A/A, difficulty1, objective kéo tiếp giáp, distractors B của mỗi mảnh; ID `fixture-adjacent-diamonds`, revision `fixture-v1`, ftueSteps rỗng.
- [ ] Validator parse unknown theo schema, không cast mù; collect issues với field cụ thể. Chạy kiểm LVL-04/05: ID/ô trùng, số không nguyên/hữu hạn, frame, màu, target, references, quyền xoay, pose ngoài biên, nghiệm không khớp; Ch1 đếm coverage để cấm giao trong nghiệm. Chỉ trả runtime Level sau khi tất cả kiểm tra qua. Case kiểm tra duplicate piece, target rỗng, unknown anchor và xoay trong Ch1 đều phải FAIL có code.
- [ ] Tạo manifest 18 entry planned với tên GDD. CLI dev validate fixture và mọi entry có dataPath; release kiểm đủ 18 approved và nghiệm valid. Dùng `readFileSync` trong script, không đưa Node fs vào content runtime. Import source `.ts` bằng đường dẫn có extension để Node strip-types chạy được.
- [ ] Chạy `npm test -- tests/content.test.ts`, `npm run content:validate`, kỳ vọng PASS; `npm run content:validate -- --release` phải FAIL rõ `campaign-incomplete`, đây là gate đúng cho M0.
- [ ] Commit `feat: validate rebuild content and independent fixture`.

## Task 3 — Command session và mask committed

**Files:** Create `src/domain/session.ts`, `tests/session.test.ts`.

**Interfaces:** Produces `createPuzzle(level:Level):PuzzleState`, `placementsOf(level,state):Placement[]`, `applyCommand(level,state,command):Transition`; consumes kernel/validated Level. `placementsOf` chỉ chuyển snapped sang pose neo.

- [ ] Viết test, chạy `npm test -- tests/session.test.ts`, kỳ vọng FAIL:

```ts
import {expect,test} from 'vitest';
import {makeAdjacentFixture} from '../src/content/fixtures.ts';
import {validateLevel} from '../src/content/validate.ts';
import {createPuzzle,applyCommand} from '../src/domain/session.ts';
test('thả tạm gỡ placement cũ; reset trả góc về 0', () => {
  const parsed = validateLevel(makeAdjacentFixture());
  if (!parsed.ok) throw new Error('invalid test fixture');
  const level = parsed.level;
  const snapped = applyCommand(level,createPuzzle(level),{type:'drop',pieceId:'D1',x:24,y:76});
  const temp = applyCommand(level,snapped.state,{type:'drop',pieceId:'D1',x:48,y:120});
  expect(temp.outcome).toBe('temporary');
  expect(temp.mask.some(Boolean)).toBe(false);
  const reset = applyCommand(level,temp.state,{type:'reset'});
  expect(reset.state.pieces.D1).toEqual({kind:'tray',turns:0});
});
```

- [ ] Cài `createPuzzle` tạo tray turns0 cho mỗi ID. `applyCommand` là giao dịch: validate → tạo state dự kiến → evaluate → so target → tạo changed indices/becameWon. Rejected trả state cũ/mask cũ/changed rỗng. Không mutate state hoặc targetMask đầu vào. Tách private helpers trong session nếu cần, không import UI/storage.

```ts
let best: Anchor | undefined;
let bestDistance = Infinity;
for (const anchor of piece.anchors) {
  const d = (anchor.x - command.x) ** 2 + (anchor.y - command.y) ** 2;
  if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
    best = anchor; bestDistance = d;
  }
}
// d < bestDistance giữ neo đầu khi tie; không dùng <= ở phép thay best.
```

`Drop` không best → temporary; return giữ góc; reset về góc0; rotate theo cờ Level, tray không xét board, temporary/snapped xét footprint đủ mép. Won từ chối mọi command trừ reset. Delta là indices có bit khác giữa mask cũ/mới. `becameWon` chỉ đúng khi phase cũ playing và phase mới won.

- [ ] Viết đủ CORE C01–C14 phù hợp session: đúng6/ngoài6, tie, cùng tọa độ neo, hướng bất đối xứng/biên, unknown ID/NaN, won do rotate, thiếu một ô, bố cục khác cùng mask và immutable input. Để test alternate solution, fixture có hai mảnh hình giống nhau được đổi neo A/B mà target giữ nguyên. Để test rotate→won, level chapter3 có một mảnh bất đối xứng, target độc lập ở góc1, state ban đầu tray.
- [ ] Chạy kernel/content/session tests và typecheck; kỳ vọng PASS. Preview/cancel không gọi applyCommand nên core không cần event pointer.
- [ ] Commit `feat: implement deterministic puzzle session commands`.

## Task 4 — Harness web và đường đóng gói Android

**Files:** Create `index.html`, `src/main.ts`, `src/style.css`, `src/presentation/FixtureScene.ts`, `capacitor.config.ts`; generate `android/`; update package scripts nếu cần; create `tests/harness.test.ts`, `src/application/fixtureRunner.ts`.

**Interfaces:** `runFixtureSolution(): {level:Level;state:PuzzleState;mask:Uint8Array}` validate fixture rồi apply hai drop A/A. Không lưu completion. Phaser scene đọc kết quả này để vẽ; scene không phải UI cuối M1.

- [ ] Test harness `expect(runFixtureSolution().state.phase).toBe('won')` và `expect(mask).toEqual(level.targetMask)`, chạy FAIL trước khi viết runner. Sau đó runner parse, apply D1 rồi D2 theo signature task3; lỗi validator throw có issues.
- [ ] Tạo HTML có `<div id="game"></div>`, module `/src/main.ts`, viewport `width=device-width, initial-scale=1, viewport-fit=cover`; CSS margin0/background GDD và game full viewport. Khởi tạo Phaser theo code:

```ts
import Phaser from 'phaser';
import {FixtureScene} from './presentation/FixtureScene.ts';
import './style.css';
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:720,height:1280,
  backgroundColor:'#080E24',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[FixtureScene]});
```

Trong `FixtureScene.create`, lấy result, vẽ rect board `(104,168,512,768)` màu `0x101B32`, duyệt mask1 vẽ `fillRect(104+x*4,168+y*4,4,4)` vàng; ghi tiêu đề “M0 · fixture kỹ thuật” và trạng thái. Nút “Chạy lại” gọi runner và vẽ lại trên Graphics đã clear, không tạo object mỗi frame. Test runner PASS và mở browser thấy hai thoi, không có UI hint hoặc nội dung release giả.
- [ ] Tạo `capacitor.config.ts` export `{appId:'com.nkhanh.mirror.rebuild',appName:'Mirror Rebuild',webDir:'dist'}`; không server.url. Chạy `npm run build`, `npx cap add android`, `npm run android:sync`; giữ Android template do CLI đúng version tạo, chỉnh min24/target36/compile36 và activity `android:screenOrientation="portrait"`.
- [ ] Ghi phiên bản Java/Gradle/SDK thực tế được template yêu cầu vào README; chạy `java -version`, kiểm Android SDK, rồi `./gradlew.bat assembleDebug` trong android. Nếu thiếu SDK/JDK/thiết bị, ghi chính xác phần thiếu, vẫn hoàn tất web/core nhưng không đánh dấu M0 Android đạt.
- [ ] Cài APK với `adb -d install -r app/build/outputs/apk/debug/app-debug.apk` khi chỉ một máy USB được xác nhận qua `adb devices -l`; nếu có nhiều máy, chọn serial từ kết quả trước khi chạy lệnh tương ứng. Mở launcher, tắt mạng, cold start; kiểm tên/ID không đè prototype. Không gửi broadcast hoặc force-stop app người dùng khác.
- [ ] Commit `feat: add offline Android rebuild fixture harness` gồm source, config và Android project; loại local.properties, build artifacts và node_modules.

## Task 5 — Đóng mốc M0 và bàn giao M1

**Files:** Create `docs/testing/mirror-rebuild/m0-evidence.md`; update `game-next/README.md`.

- [ ] Từ workspace mới, chạy tuần tự `npm ci`, `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run build`, `npm run android:sync`; chạy Gradle debug và cold start như task4. Release validator vẫn phải chặn campaign chưa đủ, không ghi đó là test thất bại của M0.
- [ ] Evidence ghi commit, phiên bản công cụ, tổng test, lệnh và exit code, máy/OS/WebView hoặc lý do chưa có máy, ảnh harness và thời gian chạy. Ghi kết quả thực tế theo bảng:

```text
Core/content/session: lệnh, số test, kết quả
Web build: kết quả, kích thước bundle
Android debug build: kết quả hoặc lỗi cụ thể
Offline cold start: thiết bị, kết quả hoặc chưa kiểm chứng
Release guard: campaign-incomplete đúng kỳ vọng
```

- [ ] Rà import graph: `rg -n 'phaser|localStorage|document\.|window\.' game-next/src/domain` từ root phải không có kết quả; review không có import `game/src`. Chạy `git diff --check`, stage đúng evidence/README và commit `docs: record rebuild M0 validation`.

## Đối chiếu phạm vi

FND-01…08 → task1/4/5; CORE-01…09 → task1/3; LVL-01…06 → task2 (manifest planned, fixture; chưa phải art approved); QA-01…03/08 → task4/5 phần M0. Input/FTUE/campaign/save/lifecycle và evidence M1 theo plan kế tiếp. Playtest hai/ba lớp, author sáu biểu tượng và full18 là M2/M3, không phải điều kiện giả để scaffold M0.

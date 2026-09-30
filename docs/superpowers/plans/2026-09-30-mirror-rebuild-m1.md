# Mirror Rebuild M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện màn Song Tinh từ kéo/thả đến báo thắng, menu, FTUE, lưu tiến độ và mở lại trên Android.

**Architecture:** Dùng kernel/session/content của M0. Play controller điều phối input và snapshot; renderer vẽ mask; repository lưu tiến độ độc lập và lifecycle adapter xử lý Back/background. Nội dung Song Tinh được dựng thành bản review cụ thể trước khi chuyển approved trong manifest.

**Tech Stack:** Stack pin ở M0; thêm official `@capacitor/app` major8 cho lifecycle Android, khóa version thực tế vào lockfile sau kiểm tra compatibility.

**Spec:** [Bộ spec đã duyệt](../specs/2026-09-30-mirror-rebuild/README.md), trọng tâm [03](../specs/2026-09-30-mirror-rebuild/03-play-screen-interaction.md), [04](../specs/2026-09-30-mirror-rebuild/04-level-content-ftue.md), [05](../specs/2026-09-30-mirror-rebuild/05-campaign-session-storage.md), [06](../specs/2026-09-30-mirror-rebuild/06-android-validation.md). Tiền đề: [M0](2026-09-30-mirror-rebuild-m0.md).

## Global Constraints

- Workspace `game-next/`; domain không phụ thuộc Phaser/DOM/storage. Đọc các type/API M0 trước mỗi task có dependency.
- Board 128 × 192, mask 24.576 ô; snap6, xoay90°, gốc neo cố định; cùng màu giao 2 trống/3 hiện.
- Chỉ placement snapped tính vào mask; hủy drag khôi phục committed state; preview không gây win/save.
- Song Tinh: hai thoi tiếp giáp, không có vùng giao trong nghiệm; Chương1 không có nút Xoay.
- Canvas cơ sở 720 × 1280; board `(104,168,512,768)`, cell4; thích nghi safe area và giữ cell vuông.
- Nút tối thiểu 48 × 48 dp sau scale; thumbnail luôn còn khi tắt bóng mẫu.
- Màn tiếp chỉ hiện sau thắng và chỉ đi tới successor approved; không skip màn thiếu nội dung hoặc tự vòng về 1-1.
- Save key `mirror.rebuild.progress.v1`, revision `oracle-v1`; recovery `mirror.rebuild.progress.recovery`; không migration từ prototype.
- Android ID `com.nkhanh.mirror.rebuild`, min24/target36; dọc, offline.
- Log cục bộ tối đa 2.000 event và 1 MiB; không network uploader hoặc định danh cá nhân.
- Không hint/skip, Custom Level, ads/IAP, nhiều màu hay audio hoàn thiện trong M1.

## Chuẩn bị và giới hạn mốc

- [ ] Xác nhận tests/core/harness M0 đã đạt; nếu thiếu thiết bị ghi rõ trước khi triển khai UI. Dùng checkout/worktree thực thi theo skill tương ứng, bảo toàn các thay đổi người dùng đang có.
- [ ] Lệnh npm ở `game-next/`; lệnh Git ở root. Chỉ thêm source/config/tests/evidence thuộc từng task vào commit.
- [ ] Có thể xây/test mọi task bằng level validated trong harness. Chỉ mở từ menu campaign và ghi completion sản phẩm khi Song Tinh đã được review approved ở task7. Duyệt spec không phải duyệt hình học của một level chưa được dựng.

M1 kết thúc với một màn. Kiểm tra unlock1-2 dùng manifest test có entry giả approved; sản phẩm thật hiển thị 1-2 đang hoàn thiện đến khi nội dung đó được duyệt. Tỷ lệ completion/retention toàn campaign chưa được nghiệm thu tại mốc này.

## Bản đồ file

| Nhóm file mới / sửa | Trách nhiệm |
|---|---|
| `src/content/levels/1-1.json`, `src/content/catalog.ts`, `src/content/manifest.ts` | Nội dung Song Tinh, load theo status |
| `src/domain/campaign.ts`, `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts` | Mở khóa, schema/recovery/memory fallback |
| `src/presentation/layout.ts`, `src/application/drag.ts` | Đổi tọa độ, hitbox, giao dịch drag |
| `src/application/playController.ts`, `src/presentation/BoardRenderer.ts`, `Hud.ts`, `PlayScene.ts`, `MenuScene.ts` | Một luồng chơi và điều hướng |
| `src/application/ftue.ts`, `telemetry.ts`, `src/infrastructure/playtestRecorder.ts` | Hướng dẫn 1-1, đo lường cục bộ |
| `src/infrastructure/lifecycle.ts`, `src/main.ts`, `src/style.css`, Android config | Background/Back/safe area và composition root |
| `tests/*.test.ts` | Acceptance tests theo task |
| `docs/testing/mirror-rebuild/1-1-content-review.md`, `m1-evidence.md`, `assets/1-1-target.svg` | Nội dung review và kết quả thiết bị |

## Task 1 — Author Song Tinh và catalog

**Files:** Create `src/content/levels/1-1.json`, `src/content/catalog.ts`, `tests/catalog.test.ts`, `docs/testing/mirror-rebuild/1-1-content-review.md`, `docs/testing/mirror-rebuild/assets/1-1-target.svg`; modify `manifest.ts` và CLI content validator.

**Interfaces:** Consumes `LevelDocument`, `ManifestEntry`, `validateLevel`, `makeAdjacentFixture` từ M0. Produces `loadLevel(id:string, mode:'campaign'|'harness'): Level` và entry1-1 validated. Unknown/missing/not-approved trả lỗi rõ bằng Error có message ID; UI chặn trước khi gọi.

- [ ] Dùng hình học fixture M0 làm bản đề xuất Song Tinh: D1/D2 frame40, hai thoi tâm(44,96)/(84,96), neo A/B như fixture; đổi id1-1/title Song Tinh/revision `song-tinh-v1`, objective kéo–thả tiếp giáp, step FTUE `drag-first` với trigger idle/end drag-start. Xuất cells/target thành JSON tĩnh; không để runtime gọi fixture generator.
- [ ] Test `validateLevel(raw).ok===true`; mọi ô coverage nghiệm ≤1; thay D1 sang B phải mismatch. Test `loadLevel('1-1','campaign')` từ chối status validated, còn harness cho chạy. Chạy `npm test -- tests/catalog.test.ts`, kỳ vọng FAIL trước loader.
- [ ] Loader tìm manifest, kiểm status/mode, đọc JSON đã bundle bằng map import rõ ràng, gọi validator trước trả Level. Harness không đổi manifest. Có thể dùng cấu trúc sau trong catalog:

```ts
import songTinh from './levels/1-1.json';
import {campaignManifest} from './manifest.ts';
import {validateLevel} from './validate.ts';
import type {Level} from '../domain/model.ts';
const documents: Record<string, unknown> = {'1-1': songTinh};
export function loadLevel(id:string, mode:'campaign'|'harness'):Level {
  const entry = campaignManifest.find(e => e.id === id);
  if (!entry || (mode === 'campaign' ? entry.status !== 'approved' :
    !['validated','approved'].includes(entry.status))) throw new Error(`unavailable:${id}`);
  const result = validateLevel(documents[id]);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.level;
}
```

- [ ] Xuất SVG từ **targetCells đã lưu**: mỗi ô một rect hoặc gộp run theo hàng; thêm ảnh nghiệm có màu viền phân biệt hai mảnh trong trang review. Ghi tọa độ, neo gây nhiễu, mục tiêu học và câu hỏi hình chạm đỉnh có đọc được trên màn nhỏ. Chưa đặt status approved.
- [ ] Chạy content tests/validator PASS; commit `feat: author Song Tinh review candidate and catalog`.

## Task 2 — Campaign và repository tiến độ

**Files:** Create `src/domain/campaign.ts`, `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts`, `tests/progress.test.ts`.

**Interfaces:** Consumes ManifestEntry M0. Produces:

```ts
export type StoragePort = {getItem(key:string):string|null;setItem(key:string,value:string):void};
export type Progress = {version:1;campaignRevision:string;completed:string[];settings:{showTarget:boolean}};
export type LoadResult = {progress:Progress;recovered:boolean;persistence:'persisted'|'memory-only'};
export interface ProgressRepository {
  read():LoadResult;
  complete(id:string):LoadResult;
  setShowTarget(show:boolean):LoadResult;
}
// progressRepository.ts
export function createProgressRepository(storage:StoragePort, manifest:readonly ManifestEntry[], revision:string):ProgressRepository;
// campaign.ts
export function levelAccess(manifest:readonly ManifestEntry[], completed:readonly string[], id:string):
  {unlocked:boolean;completed:boolean;available:boolean};
export function nextLevelId(manifest:readonly ManifestEntry[], id:string):string|null;
```

`available` chỉ status approved, còn `unlocked` theo completion predecessor. UI dùng cả hai. `complete` từ chối unknown/unavailable/locked; giữ nguyên snapshot khi đã complete.

- [ ] Viết memory StoragePort và test bằng vitest; chạy `npm test -- tests/progress.test.ts`, kỳ vọng FAIL. Test mẫu:

```ts
import {expect,test} from 'vitest';
import {createProgressRepository} from '../src/infrastructure/progressRepository.ts';
import type {ManifestEntry} from '../src/content/document.ts';
test('completion sống qua repository mới', () => {
  const data = new Map<string,string>();
  const storage = {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  const manifest:ManifestEntry[] = ['1-1','1-2'].map((id,order)=>({
    id,title:id,chapter:1,order,contentRevision:'test',status:'approved'}));
  createProgressRepository(storage,manifest,'oracle-v1').complete('1-1');
  expect(createProgressRepository(storage,manifest,'oracle-v1').read().progress.completed).toEqual(['1-1']);
});
```

- [ ] Parse JSON unknown; bad version/revision/schema → empty snapshot+recovered, settings lỗi → default mà giữ completion; duplicate/unknown ID loại; dùng prefix contiguous theo manifest. Repository sở hữu snapshot memory và clone khi trả read; không reread disk làm mất completion mới sau lỗi ghi.
- [ ] Implement recovery trước overwrite: khi raw lỗi, giữ raw trong pendingRecovery; lần persist đầu gọi storage.setItem(recovery,raw), rồi mới set primary. Backup thất bại → memory-only và không ghi primary. Khi set primary thất bại → memory-only; lần hành động save kế thử lại. Không có retry trong render/update.
- [ ] Test unknown/trùng/gap, badJSON/version/revision, settings lỗi, setItem throws, recovery throws không đổi primary, hoàn thành hai lần chỉ ghi một lần, chặn locked và next cuối=null. Chạy tests PASS/typecheck; commit `feat: persist rebuild campaign with recovery`.

## Task 3 — Layout và giao dịch drag không phụ thuộc scene

**Files:** Create `src/presentation/layout.ts`, `src/application/drag.ts`, `tests/interaction.test.ts`.

**Interfaces:**

```ts
export type Point = Readonly<{x:number;y:number}>;
export type Rect = Readonly<{x:number;y:number;width:number;height:number}>;
export type Layout = Readonly<{board:Rect;cell:number;tray:Rect;cssScale:number;minHit:number}>;
export function makeLayout(availableCssWidth:number,availableCssHeight:number):Layout;
export function canvasToBoard(point:Point,layout:Layout):Point;
export type Drag = Readonly<{pieceId:string;pointerId:number;start:Point;offset:Point;origin:Point;moved:boolean}>;
export type DragEnd = {type:'cancel'}|{type:'select';pieceId:string}|{type:'command';command:Command};
export function beginDrag(pieceId:string,pointerId:number,pointer:Point,origin:Point):Drag;
export function moveDrag(drag:Drag,pointerId:number,pointer:Point):Drag;
export function endDrag(drag:Drag,pointerId:number,pointer:Point,canceled:boolean,layout:Layout):DragEnd;
```

Points trong module input là **tọa độ canvas logic**, không phải CSS pixel. Origin là góc khung mảnh. Phaser adapter lấy pointer qua camera không zoom/scroll; không chia cssScale lần hai khi Phaser đã đưa vào hệ canvas.

- [ ] Test: board top-left đổi về(0,0); beginDrag pointer=(120,180), origin=(104,168), move cùng pointer→(136,196) cho origin(120,184); move sai ID không đổi; canceled/outside thành cancel; đi <6 canvas units là select; vào tray là return. Chạy `npm test -- tests/interaction.test.ts` FAIL.
```ts
import {expect,test} from 'vitest';
import {makeLayout,canvasToBoard} from '../src/presentation/layout.ts';
import {beginDrag,moveDrag,endDrag} from '../src/application/drag.ts';
test('drag giữ offset và cancel không tạo command',()=>{
  const layout=makeLayout(360,640);
  expect(canvasToBoard({x:104,y:168},layout)).toEqual({x:0,y:0});
  const drag=beginDrag('D1',7,{x:120,y:180},{x:104,y:168});
  expect(moveDrag(drag,8,{x:136,y:196})).toBe(drag);
  expect(moveDrag(drag,7,{x:136,y:196}).origin).toEqual({x:120,y:184});
  expect(endDrag(drag,7,{x:136,y:196},true,layout)).toEqual({type:'cancel'});
});
```

- [ ] Implement hình học:

```ts
export function canvasToBoard(p:Point,l:Layout):Point {
  return {x:(p.x-l.board.x)/l.cell,y:(p.y-l.board.y)/l.cell};
}
export function moveDrag(d:Drag,id:number,p:Point):Drag {
  if (id !== d.pointerId) return d;
  return {...d,origin:{x:p.x-d.offset.x,y:p.y-d.offset.y},
    moved:d.moved || Math.hypot(p.x-d.start.x,p.y-d.start.y)>=6};
}
```

`makeLayout`: board gốc `(104,168,512,768)`, cell4, tray `(16,960,688,200)`, cssScale=`min(availableCssWidth/720,availableCssHeight/1280)`, minHit=`48/cssScale` trong logic canvas. HUD dùng minHit và khoảng cách chuyển từ CSS sang canvas; bảng/quân scale đều. Insets được trừ ở container bên ngoài ở task6.
- [ ] `endDrag` dùng vị trí pointer cuối cùng để move lần cuối; sai pointer ID không kết thúc drag ở controller. Với canceled → cancel; chưa moved → select; pointer trong tray → return; trong board → drop với origin từ move cuối; nơi khác → cancel. Controller bỏ preview khi cancel, không gọi core reset.
- [ ] Test ở viewport360×640 và360×780; minHit×cssScale≥48; canvas point vẫn đổi đúng board. Review việc CSSpx có tương ứng dp trên thiết bị ở task7, không gọi test unit này là chứng minh dp trên mọi máy.
- [ ] Commit `feat: define rebuild drag transactions and responsive metrics`.

## Task 4 — Controller, board renderer, HUD và menu

**Files:** Create `src/application/playController.ts`, `src/presentation/BoardRenderer.ts`, `Hud.ts`, `PlayScene.ts`, `MenuScene.ts`, `tests/playController.test.ts`; modify `src/main.ts`.

**Interfaces:** Consumes M0 Level/PuzzleState/Command/Transition, task2 repository, task3 drag. Produces:

```ts
export type PlayView = {level:Level;state:PuzzleState;mask:Uint8Array;selected:string|null;
  paused:boolean;showTarget:boolean;notice:string;preview:Uint8Array|null};
export interface PlayController {
  view():PlayView; select(id:string):void; dispatch(command:Command):void;
  previewDrop(pieceId:string,x:number,y:number):void; cancelPreview():void;
  pause():void; resume():void; dispose():void;
}
export function createPlayController(level:Level, repo:ProgressRepository,
  mode:'campaign'|'harness', onChange:(view:PlayView)=>void):PlayController;
// BoardRenderer owns Phaser Graphics, consumes PlayView and Layout:
// constructor(scene:Phaser.Scene, layout:Layout); render(view:PlayView):void; destroy():void
```

- [ ] Test fake onChange/repository: giải 1-1 đúng → complete một lần; gọi view/render lặp không ghi; harness thắng không complete; preview tạo candidate đúng target không đổi phase; pause chặn dispatch; cancel không đổi committed pose. `npm test -- tests/playController.test.ts` phải FAIL trước controller.
- [ ] Controller giữ state từ createPuzzle, dispatch theo applyCommand. Nếu becameWon và mode campaign gọi repo.complete; đặt notice khi memory-only rồi onChange. Preview dùng applyCommand trên snapshot tạm có phase playing và loại placement đang kéo; chỉ lấy mask, tuyệt đối không commit state/becameWon hoặc gọi repo. Khi không gần neo, mảnh kéo vẽ outline, mask preview bỏ placement cũ. `pause()` hủy preview trước đặt paused; resume giữ state.
- [ ] Renderer dùng một Graphics layer cho target, một cho result, một cho viền/preview; clear/redraw khi state/input đổi, không tạo GameObject mỗi frame. Hàm vẽ mask dùng index→cell y/x. TargetMask dùng cho thumbnail và bóng. Lưới mỗi8ô dưới mảnh; vòng chiêm tinh dưới target. Render permanent fill từ mask, không alpha-blend sprites thành phép chấm thứ hai.

```ts
function paintMask(g:Phaser.GameObjects.Graphics, mask:Uint8Array, x0:number,y0:number,cell:number,color:number) {
  g.fillStyle(color,1);
  for (let i=0;i<mask.length;i++) if (mask[i]) {
    g.fillRect(x0+(i%128)*cell,y0+Math.floor(i/128)*cell,cell,cell);
  }
}
```

- [ ] Tạo khay hai mảnh và viền theo trạng thái. Chọn bằng hit test ô phủ mở rộng, ưu tiên mảnh trên cùng, tăng draw order không đổi mask. Đăng ký pointerdown/move/up một lần mỗi scene; handler gọi module drag. pointer.wasCanceled/blur/SHUTDOWN hủy giao dịch và gỡ đúng listener. HUD: Menu/pause, Reset, toggle bóng mẫu; Xoay chỉ khi level.rotationEnabled và selected; Màn tiếp chỉ khi won và successor available; thiếu nội dung hiện “Nội dung đang hoàn thiện”, cuối18 về menu. Nút chạm dùng layout.minHit dù hình nhìn nhỏ hơn.
- [ ] Menu đọc manifest + repo.read + levelAccess; route campaign kiểm unlocked/available trước loadLevel. Harness nội bộ có nhãn rõ, không có quyền ghi completion. Root tạo repository từ `window.localStorage` qua try/catch; nếu getter ném lỗi, cấp StoragePort ném lỗi để repository đi đúng memory fallback. Không đọc localStorage trực tiếp trong scene.
- [ ] Chạy controller + interaction tests PASS; manual web: kéo đúng, thả tạm, trả khay, chọn/reset, pause; chụp temporary và đúng target. Commit `feat: connect rebuild play screen and campaign menu`.

## Task 5 — FTUE và log hữu hạn

**Files:** Create `src/application/ftue.ts`, `telemetry.ts`, `src/infrastructure/playtestRecorder.ts`, `tests/ftue-telemetry.test.ts`; update controller/root/scene bằng dependency tùy chọn.

**Interfaces:**

```ts
export type GameEvent = {name:string;schemaVersion:1;sessionId:string;attemptId:string;
  eventId:number;elapsedMs:number;fields:Record<string,string|number|boolean>};
export interface Recorder {record(event:GameEvent):void;flush():void;exportJson():string}
export const noopRecorder:Recorder = {record(){},flush(){},exportJson(){return '[]'}};
export function createRecorder(storage:StoragePort,maxEvents=2000,maxBytes=1048576):Recorder;
export interface AttemptTracker {
  emit(name:string,fields:GameEvent['fields']):void; reset():void;
  setPaused(value:boolean):void; end(reason:string,completed:boolean):void;
}
export type TelemetrySession = {sessionId:string;nextEventId():number};
export function createTelemetrySession(newId:()=>string):TelemetrySession;
export function createAttemptTracker(levelId:string,revision:string,recorder:Recorder,
  session:TelemetrySession,now:()=>number,newId:()=>string):AttemptTracker;
// Task 5 extends the Task 4 factory with one optional fifth parameter:
export function createPlayController(level:Level,repo:ProgressRepository,
  mode:'campaign'|'harness',onChange:(view:PlayView)=>void,
  tracker?:AttemptTracker):PlayController;
export interface Ftue {tick(activeMs:number):'show'|'none';dragStarted():void;snapped():void;visible():boolean}
export function createFirstDragFtue(alreadyCompleted:boolean,tracker:AttemptTracker):Ftue;
```

Root gọi createTelemetrySession một lần mỗi app run và truyền cùng object vào mọi tracker. Factory giữ bộ đếm eventId trong closure, bắt đầu 1 và tăng mỗi lần nextEventId; sessionId lấy từ newId. AttemptId mới cho level_start/reset. Không tạo session ở mỗi scene. Controller không có tracker thì bỏ qua telemetry; mọi lỗi recorder được chặn tại adapter, không cản gameplay.

- [ ] Viết test fake clock `let t=0; now=()=>t` và array Recorder: t2999 chưa show, t3000 show1 lần, dragStarted ẩn; snapped done1 lần; alreadyCompleted không demo. Pause10000ms không cộng activeMs. Reset thứ tự reset→exit→start và attemptId đổi. `npm test -- tests/ftue-telemetry.test.ts` FAIL trước implementation.
- [ ] FTUE chỉ hướng dẫn kéo và ẩn khi thao tác, không đặt mảnh/tiết lộ neo. Vẽ tay/callout ở overlay không interactive. Step done ở snap đầu; hai/ba lớp FTUE đầy đủ thuộc M2. State FTUE sống theo attempt, completion từ repository quyết định replay có demo.
- [ ] Recorder giữ array giới hạn count/byte UTF-8 (`TextEncoder().encode(JSON.stringify(events)).byteLength`). Khi vượt, bỏ event cũ; flush sau command/route/background theo batch; storage key `mirror.rebuild.playtest.v1`. Storage ném lỗi thì dừng disk flush, vẫn giới hạn memory; không log pointermove. EventId tăng theo session, không reset theo attempt. Sinh sessionId qua crypto.randomUUID ở root, inject newId/clock vào test.
- [ ] Gắn tracker vào controller qua tham số thứ năm ở signature trên; complete event chỉ theo becameWon, level_exit khi rời/reset, piece_drop/rotate theo outcome, ftue_seen/done từ FTUE. Không ghi session_end giả khi OS kill. Viết kiểm thử 2.001 event và payload >1MiB; byte/count đều dưới giới hạn, repo progress không chịu lỗi logger.
- [ ] Tests PASS/typecheck; commit `feat: add first-level onboarding and local playtest recording`.

## Task 6 — Lifecycle Android, Back và safe area

**Files:** Create `src/infrastructure/lifecycle.ts`, `tests/lifecycle.test.ts`; modify package/lock, root/scene/CSS, Android activity layout nếu insets của WebView không đủ.

**Interfaces:** Produces `bindLifecycle(callbacks):Promise<{setGameActive(active:boolean):Promise<void>;dispose():Promise<void>}>`, callbacks `{inactive():void;active():void;back():void}`. Binding appStateChange tồn tại một lần ở root; binding Back chỉ khi route gameplay/pause, remove khi menu để hệ thống xử lý. [Capacitor App API](https://capacitorjs.com/docs/apis/app) cung cấp listener handles để gỡ riêng.

- [ ] Cài `npm install --save-exact @capacitor/app@8`, kiểm peer dependency khớp core8, khóa version cụ thể mà npm resolve. Đây là dependency mới phục vụ lifecycle đã nằm trong spec; không nâng core hoặc dùng plugin third-party.
- [ ] Test adapter bằng fake App có addListener trả handle.remove: setGameActive(true) lặp chỉ một Back listener; false gỡ; dispose gỡ toàn bộ listener adapter tạo; hoàn tất addListener muộn sau dispose phải tự remove. inactive gọi controller.pause và clear drag; active giữ pause chờ người chơi tiếp tục. `npm test -- tests/lifecycle.test.ts` FAIL trước adapter.
- [ ] Dùng pattern đăng ký và dọn handle, bảo vệ race bằng cờ disposed/generation trong adapter:

```ts
const handle = await App.addListener('appStateChange', ({isActive}) => {
  if (isActive) callbacks.active(); else callbacks.inactive();
});
// Giữ handle của adapter này; dispose gọi await handle.remove().
// Back listener được add/remove theo setGameActive; không gọi removeAllListeners().
```

Phaser blur có thể xảy ra trước native event: pause/cancel phải idempotent. Back khi đang chơi mở pause; Back khi paused đóng pause và tiếp tục; Back trong hộp xác nhận rời hủy hộp đó và giữ pause. Nút về menu từ pause hiển thị cảnh báo bố cục chưa lưu; chỉ xác nhận rời mới đóng session. Ở menu dùng Back mặc định của hệ thống.
- [ ] CSS root sử dụng viewport-fit và env safe area; không trừ inset hai lần:

```css
html,body{margin:0;width:100%;height:100%;background:#080e24;overflow:hidden}
#game{position:fixed;box-sizing:border-box;
  top:env(safe-area-inset-top,0px);bottom:env(safe-area-inset-bottom,0px);
  left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px)}
```

Đo actual WebView/Android insets trên máy target36. Nếu env trả0 trong khi view dưới system bars, áp inset ở native WebView container đúng một lần bằng Android WindowInsets; đo lại diện tích CSS trước makeLayout. Dùng hướng dẫn [Android insets](https://developer.android.com/develop/ui/views/layout/insets). Không dùng padding hằng số giả định notch mọi máy giống nhau.
- [ ] `npm run android:sync` rồi Gradle debug; test Back, background giữa kéo, resume còn pause, process restart về menu giữ completion, rotation vật lý vẫn dọc. Tests adapter PASS; commit `feat: handle Android lifecycle and safe play area`.

## Task 7 — Review Song Tinh, nối campaign và nghiệm thu M1

**Files:** Update `docs/testing/mirror-rebuild/1-1-content-review.md`, `src/content/manifest.ts`, `tests/catalog.test.ts`; create `docs/testing/mirror-rebuild/m1-evidence.md`; update `game-next/README.md`.

- [ ] Trình bày bản Song Tinh trong harness, ảnh target/ảnh nghiệm và hai neo gây nhiễu đã có từ task1. Review nội dung theo LVL-01/05: chạm đỉnh rõ trên máy, snap dễ hiểu, có nghiệm đúng và lựa chọn sai có nghĩa. Lưu người/ngày/revision review. Chỉ sau review đạt mới đổi entry1-1 validated→approved; trước đó tiếp tục test bằng harness, không ghi campaign hoặc tự ký duyệt hình học.
- [ ] Sửa test catalog: campaign load1-1 thành công, 1-2 unavailable; hoàn thành1-1 rồi restart giữ completed. Integration test manifest giả approved1-2 xác nhận mở đúng successor; giữ dữ liệu production1-2 planned. Test harness đã solved không làm tăng completion của production.
- [ ] Kiểm toàn bộ `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run build`, `npm run android:sync`, Gradle debug. `build:release` vẫn fail thiếu17 màn là đúng scope M1. Chỉ broaden test nếu có lỗi hoặc thay đổi mới sau các kiểm tra này.
- [ ] Thực hiện kịch bản Android: cold start offline→menu→1-1; chờ FTUE; chọn/tap; kéo ngoài neo; cancel; trả khay; giải đúng; về menu; đóng/mở giữ completion; replay; đổi bóng mẫu; Back/pause/background. Thử mất storage bằng adapter test, không xóa dữ liệu ứng dụng prototype trên máy.
- [ ] Ghi evidence ảnh/video, máy/OS/WebView, viewport/insets, build commit, test totals, active time và quan sát 30 giây kéo; lặp20 lần vào–ra scene để phát hiện listener/memory tăng. Ghi cấu hình tối thiểu chưa có nếu chưa thử, không đánh dấu hỗ trợ đã kiểm chứng.
- [ ] Đối chiếu FND/CORE toàn bộ, UI-01…09, LVL-01…08 phần1-1, SAVE-01…08, QA-01…08 phầnM1. Ghi phần M2/M3 chưa thuộc mốc: sáu biểu tượng, FTUE2-1/2-2/2-3, xoay UI trên level3-1 chính thức, đủ18, retention/campaign playtest, art pass toàn bộ.
- [ ] Commit `docs: validate rebuild first playable milestone` cùng trạng thái nội dung approved sau review. M1 chỉ đạt khi đã có một level reviewed và bằng chứng thiết bị; nếu chỉ web/harness đạt, ghi mức đó chính xác.

## Review kế hoạch trước thực thi

- API từ M0 là nguồn type chính. Task5 thêm tracker tùy chọn ở tham số thứ năm của controller; root sở hữu TelemetrySession dùng chung, đúng signature đã khai báo.
- Nội dung17 màn còn lại thuộc kế hoạch riêng; không tăng scope để làm nút Màn tiếp sáng bằng cách copy level cũ.
- Cho chạy fixture/validated trong harness nhằm review; mode campaign vẫn tuân thủ approved, unlocked và save namespace mới.
- Khi hoàn thành plan, báo mốc nào có bằng chứng, commit thực thi và giới hạn thiết bị/nội dung; không tự gắn G2/G3 PASS.

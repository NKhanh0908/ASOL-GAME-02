# G — Âm thanh: nhạc nền theo cảnh và SFX theo thang âm

Ngày: 2026-10-03 · Phạm vi: `game-next` · Phụ thuộc: **F1** (`2026-10-03-f1-scene-transitions-design.md`: `SceneDirector`, `BackgroundScene`) và **F2** (`2026-10-03-f2-in-level-game-feel-design.md`: `FeedbackEvent`, `FeedbackDirector`, chuỗi thắng, mẫu `settings.haptics`). Không đổi domain, content hay luật chẵn/lẻ.

## 1. Mục tiêu

Game hiện không có âm thanh nào: không asset, không lớp audio. `SettingsDialog` chỉ có 3 toggle (bóng mục tiêu, giảm chuyển động, rung). GDD §3.4 cho phép thêm âm thanh sau MVP với điều kiện: cue gắn với nhấc mảnh, snap, vùng giao đổi trạng thái, xoay và hoàn thành; phản hồi quan trọng luôn có tín hiệu hình để chơi được khi tắt âm.

Spec này thêm:

- Nhạc nền ambient theo cảnh, chạy liên tục qua các lần chuyển cảnh của F1.
- SFX cho mọi sự kiện phản hồi của F2. Tiếng snap đi theo thang ngũ cung cùng giọng với nhạc, nên ghép xong một hình nghe như một chuỗi giai điệu đi lên và kết về chủ âm.
- Hai toggle "Nhạc nền" và "Hiệu ứng âm thanh".

Quyết định đã chốt với người review:

| Quyết định | Giá trị |
|---|---|
| Đầu ra | Spec đầy đủ, rồi plan triển khai |
| Nguồn asset | Miễn phí: CC0 (Kenney, Freesound lọc CC0) hoặc Pixabay License. Ghi nguồn từng file |
| Nhạc nền | 2 track theo cảnh: Menu + Bản đồ / Màn chơi, crossfade khi đổi cảnh |
| SFX | Sample CC0, phát lại với `rate` theo thang ngũ cung cùng giọng nhạc |
| Thứ tự | Sau F2, nối vào `feedbackEvents` như `HapticsPort`. Chọn asset làm song song ngay |
| Cài đặt | 2 toggle bật/tắt: Nhạc nền, Hiệu ứng âm thanh. Âm lượng tổng dùng phím cứng của máy |
| Công cụ xử lý | Thêm devDependency `ffmpeg-static`, script `npm run audio:process` |

**Ngoài phạm vi:** thanh trượt âm lượng, âm lượng riêng từng cue, âm thanh 3D/pan, iOS, màn ghi công trong game, âm thanh cho hiệu ứng chuyển cảnh (nhạc crossfade đã đảm nhận), nhạc riêng cho từng chương.

## 2. Kiến trúc

SFX và nhạc nền đi hai đường riêng vì yêu cầu kỹ thuật trái ngược nhau. WebAudio giải nén cả file thành PCM float32: hợp với SFX ngắn, phát tức thì, đổi được `rate`. Còn một track nhạc 2 phút giải nén ra vài chục MB RAM, quá nặng cho máy tầm trung, nên nhạc stream bằng `HTMLAudioElement`.

```
Pointer ─► PlayController ─► feedbackEvents() ─► FeedbackDirector (F2)
                                                   ├─ tween / hạt
                                                   ├─ HapticsPort (F2)
                                                   └─ SfxPort ◄── audioCues(events, ctx)   ← logic thuần
victorySequence (F2), mốc 900 ──────────────────► MusicPort.duck() + SfxPort (stinger)
SceneDirector.go() (F1) ─────────────────────────► MusicPort.setTrack(trackFor(to), fadeMs)
main.ts: lifecycle (xuống nền / quay lại) ───────► MusicPort.pause/resume, sound.pauseAll/resumeAll
```

### 2.1 `audioCues.ts` (mới, logic thuần, `src/presentation/feedback/`)

Cùng chỗ và cùng vai trò với `hapticCues.ts` của F2. Không import runtime từ `phaser`.

```ts
type SfxKey = 'bell' | 'tick' | 'tap-soft' | 'thud' | 'hollow' | 'shimmer' | 'swish' | 'stinger-win';
type AudioCue = { key: SfxKey; rate: number; volume: number; delayMs: number };

function audioCues(events: FeedbackEvent[], ctx: { snappedCount: number }): AudioCue[];
function pitchFor(step: number): number; // rate = 2^(semitone / 12)
```

- Hàm nhận **cả lô sự kiện** của một `Transition`, để biết snap nào là snap thắng (`won` có trong cùng lô) và để gộp `reset` thành một cue.
- `ctx.snappedCount` là số mảnh đang ở trạng thái snap **sau** transition. `FeedbackDirector` lấy từ snapshot.
- Không dùng random. Cùng đầu vào thì luôn ra cùng cue.

### 2.2 `SfxPort` (mới, `src/infrastructure/sfx.ts` + driver `src/infrastructure/phaserSfx.ts`)

Cùng mẫu `haptics.ts` + `capacitorHaptics.ts`: phần cổng thuần, test được với driver giả; driver bọc `game.sound` (sound manager toàn game của Phaser, không gắn với scene).

```ts
interface SfxPort {
  play(cues: AudioCue[]): void;
  setEnabled(on: boolean): void;
}
```

- Bỏ qua mọi lời gọi khi `settings.sfx = false`.
- Sound manager bị khoá, không có WebAudio, key chưa nạp, hoặc driver ném lỗi: không làm gì, nuốt lỗi (xem mục 6).
- Tối đa 6 voice cùng lúc. Vượt thì bỏ cue mới, không cắt cue đang phát.
- Cùng một key phát lại trong vòng 40 ms thì bỏ qua.
- `delayMs` > 0 thì hẹn giờ bằng `setTimeout`; tắt SFX thì huỷ các cue đang hẹn.
- Âm lượng thực = `cue.volume × AUDIO_TOKENS.sfxVolume`.

### 2.3 `MusicPort` (mới, `src/infrastructure/music.ts`)

```ts
type TrackId = 'music-sky' | 'music-stele';

interface MusicPort {
  setTrack(id: TrackId | null, fadeMs: number): void;
  duck(level: number, holdMs: number): void;
  pause(): void;
  resume(): void;
  setEnabled(on: boolean): void;
}
```

- Hai `HTMLAudioElement` A/B, `loop = true`, `preload = 'auto'`. Phần tử được tạo qua một factory truyền vào, để test dùng phần tử giả.
- **Crossfade:** track mới phát trên phần tử rảnh từ volume 0. Volume hai phần tử ramp ngược chiều nhau trong `fadeMs`, cập nhật mỗi 50 ms. Hết ramp thì pause và `src = ''` phần tử cũ.
- `setTrack` với đúng track đang phát thì không làm gì.
- `duck(level, holdMs)`: ramp xuống `level × musicVolume` trong 200 ms, giữ `holdMs`, rồi ramp về trong 800 ms. Đổi track trong lúc duck thì bỏ duck.
- Chọn định dạng bằng `canPlayType('audio/ogg; codecs="vorbis"')`; không được thì dùng `.m4a`.
- Tạo **một lần trong `main.ts`**, sống ngoài mọi scene. Nhạc chạy liên tục qua chuyển cảnh, giống `BackgroundScene`.
- Âm lượng nền: `AUDIO_TOKENS.musicVolume`.

### 2.4 Mở khoá âm thanh

Trình duyệt không cho phát âm thanh trước lần tương tác đầu tiên.

- SFX: Phaser tự mở khoá WebAudio ở lần chạm đầu (`sound.locked`). Trước đó `SfxPort` bỏ qua mọi cue.
- Nhạc: `MusicPort` nhớ track đang chờ. Nếu `play()` bị từ chối (`NotAllowedError`), nó gắn một listener `pointerdown`/`keydown` dùng một lần lên `window`, và phát lại track đang chờ khi người chơi chạm lần đầu, fade-in 1000 ms.
- WebView Android của Capacitor thường cho phát ngay, nên trên máy thật nhạc có thể vang lên từ lúc mở app. Cả hai trường hợp đều đúng spec.

### 2.5 Cấp port cho scene

- `main.ts` tạo `MusicPort` và `SfxPort` (driver `phaserSfx(game.sound)`), đặt vào `game.registry` dưới khoá `audio` dạng `{ music, sfx }`.
- `SceneDirector`, `FeedbackDirector` và helper UI (mục 3.4) lấy port từ registry, không tự tạo.
- `FixtureScene` và harness dùng chung, không có cờ riêng để tắt âm.

### 2.6 Nạp asset

- 8 file SFX nạp trong `BackgroundScene.preload()` (F1), vì đây là scene đầu tiên và sống suốt game. Phaser nhận mảng `[ogg, m4a]` và tự chọn định dạng.
- Nhạc không preload. Phần tử stream khi `setTrack` lần đầu.

## 3. Cue

### 3.1 Giọng và thang âm

- `AUDIO_TOKENS.musicRootSemitone` chốt giọng gốc, đặt theo giọng của 2 track nhạc chọn ở mục 4.1. Hai track phải cùng giọng, hoặc là drone không giọng rõ.
- `bell` được pitch-shift trước về đúng nốt gốc (mục 4.3), nên `rate = 1` là chủ âm.
- `pitchFor(step)` dùng ngũ cung trưởng, 8 bậc tính bằng nửa cung so với gốc:

| step | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| nửa cung | −5 | −3 | 0 | 2 | 4 | 7 | 9 | 12 |
| rate (làm tròn) | 0.749 | 0.841 | 1 | 1.122 | 1.260 | 1.498 | 1.682 | 2 |

`rate` nằm trong 0.75–2.0, ngưỡng mà sample chưa méo rõ.

### 3.2 Thư viện sample

| Key | Chất âm | Dùng cho |
|---|---|---|
| `bell` | Chuông pha lê ngân ngắn (≤ 1.5 s), có cao độ rõ | snap, chọn node bản đồ |
| `tick` | Tiếng gõ kính rất nhẹ (≤ 150 ms) | lift, rotate, chạm nút UI |
| `tap-soft` | Chạm mềm, trầm | settle-temporary, mở/đóng dialog |
| `thud` | Kính bị chặn, đục | rotate-blocked, chạm node bị khoá |
| `hollow` | Tiếng "thở" trầm, hơi rỗng | overlap-hollow |
| `shimmer` | Lấp lánh sáng, cao | overlap-revive |
| `swish` | Gió nhẹ đi xuống | return, reset |
| `stinger-win` | Hợp âm chuông 3–5 s, kết về chủ âm | chuỗi thắng |
| `music-sky` | Ambient pad, chậm, không trống, 60–150 s loop | Menu + Bản đồ |
| `music-stele` | Như trên, tĩnh hơn, ít biến động để không át SFX | Màn chơi |

### 3.3 Ánh xạ sự kiện F2 → cue

Gọi `k = ctx.snappedCount`.

| Sự kiện | Cue | Ghi chú |
|---|---|---|
| `lift` | `tick`, vol 0.35 | |
| `snap` (lô không có `won`) | `bell`, rate `pitchFor(min(k − 1, 6))`, vol 0.8 | Bỏ mảnh ra thì `k` giảm, snap kế tiếp thấp hơn. Bậc 7 (quãng tám) dành cho snap thắng |
| `snap` (lô có `won`) | `bell`, rate `pitchFor(7)` = 2, vol 0.9 | Mảnh cuối luôn kết về chủ âm |
| `settle-temporary` | `tap-soft`, vol 0.4 | |
| `return` | `swish`, vol 0.3 | |
| `rotate` | `tick`, rate 1.12, vol 0.4 | |
| `rotate-blocked` | `thud`, vol 0.6 | |
| `overlap-hollow` | `hollow`, vol 0.6, trễ 60 ms | Trễ để không dính vào `bell` |
| `overlap-revive` | `shimmer`, vol 0.6, trễ 60 ms | |
| `reset` | `swish`, vol 0.4, **một lần** cho cả lô | Các `return` cùng lô với `reset` không phát thêm |
| `won` | Không có cue trong `audioCues` | Stinger do chuỗi thắng phát, mục 3.5 |

Âm lượng ghi ở đây là giá trị khởi điểm. Plan G2 chỉnh lại sau khi nghe sample thật, nhưng chỉ sửa trong bảng token, không sửa logic.

### 3.4 Cue giao diện

Không có component nút dùng chung; `pointerdown` nằm rải rác trong nhiều file. Thêm helper `playUiCue(scene, 'tap' | 'open' | 'close' | 'locked' | 'node')` (`src/presentation/audio/uiCues.ts`), lấy `SfxPort` từ registry. Không refactor thành component nút.

| Cue | Âm thanh | Gắn vào |
|---|---|---|
| `tap` | `tick`, vol 0.4 | Nút chính ở `MenuScene`; nút Đặt lại, Xoay, Tạm dừng ở `Hud`; nút trong `PauseDialog` |
| `open` / `close` | `tap-soft`, vol 0.35 | Mở/đóng `PauseDialog`, `SettingsDialog` |
| `node` | `bell`, rate 1, vol 0.5 | Chọn node mở ở `LevelSelectScene` |
| `locked` | `thud`, vol 0.5 | Chạm node bị khoá |

Toggle trong `SettingsDialog` phát `tap`, riêng toggle SFX khi bật lên phát `tick` để nghe thử.

### 3.5 Chuỗi thắng (F2 §4)

- Mốc 900, cùng lúc camera flash: `music.duck(0.3, 1500)` và phát `stinger-win`, vol 0.9.
- Chạm để bỏ qua (`complete()`) trước mốc 900: phát stinger và duck ngay lúc `complete()`. Stinger phát **đúng một lần** mỗi lần thắng.
- Rời màn trong lúc duck: `setTrack` của tuyến chuyển cảnh huỷ duck (mục 2.3).

### 3.6 Nhạc theo tuyến chuyển cảnh (F1 §3)

`trackFor(scene)`: `MenuScene`, `LevelSelectScene` → `music-sky`; `PlayScene` → `music-stele`.

| Tuyến | Lời gọi |
|---|---|
| `menu-to-play`, `map-to-play` | `setTrack('music-stele', 1500)` ở mốc 0 |
| `play-to-map`, `play-to-menu` | `setTrack('music-sky', 1000)` ở mốc 0 |
| `menu-to-map`, `map-to-menu`, `next-level` | Cùng track, không làm gì |
| `boot` (mở app, kể cả harness mở thẳng `PlayScene`) | `setTrack(trackFor(scene), 1000)` |

`director.skip()` không ảnh hưởng crossfade: nhạc tiếp tục ramp hết `fadeMs`, vì nhảy volume đột ngột nghe gắt hơn so với hình nhảy tới cuối.

### 3.7 Quy tắc chung

- Âm thanh không phụ thuộc `motionScale` (giảm chuyển động), giống quy tắc rung của F2 §5.
- Mọi cue trong mục 3.3–3.5 đều có tín hiệu hình tương ứng trong F2, nên tắt cả hai toggle vẫn chơi trọn được.

## 4. Asset và license

### 4.1 Chọn file (điểm dừng review)

Agent không nghe được âm thanh, nên việc chọn file bắt buộc có người nghe.

1. Agent lập danh sách ứng viên vào `docs/testing/audio/candidates.md`: mỗi key 2–3 file từ [Kenney](https://kenney.nl/assets/interface-sounds) (CC0), Freesound (chỉ lọc CC0) và Pixabay. Mỗi dòng có link, tác giả, license, độ dài và lý do chọn.
2. Người review nghe, chọn 1 file cho mỗi key và 2 track nhạc, ghi lựa chọn vào cùng file.
3. Agent đo giọng gốc của 2 track nhạc (bằng tai của người review, hoặc công cụ phát hiện cao độ chạy cục bộ) và chốt `musicRootSemitone` cùng `rootNote` của `bell`.

Bước này không phụ thuộc code, nên làm được ngay, song song với F1/F2.

**License hợp lệ:** `CC0-1.0` và `Pixabay`. Pixabay License cho dùng thương mại, không cần ghi công, nhưng cấm phân phối lại file đứng riêng ([Pixabay FAQ](https://pixabay.com/service/faq/)). Đóng gói trong game không vi phạm điều này. File CC-BY, CC-BY-NC hoặc không rõ license đều bị loại.

### 4.2 Thư mục và manifest

```
game-next/
  audio-src/                  ← file gốc tải về; gitignore, không commit
  public/audio/               ← file đã xử lý; commit; Vite copy nguyên vào dist/
  src/infrastructure/audioManifest.ts
  scripts/process-audio.ts    → npm run audio:process
```

`audioManifest.ts` là nguồn sự thật cho mọi file âm thanh:

```ts
type AudioAsset = {
  key: SfxKey | TrackId;
  kind: 'sfx' | 'stinger' | 'music';
  files: string[];            // ['bell.ogg', 'bell.m4a'], tương đối với public/audio/
  source: { title: string; author: string; url: string; license: 'CC0-1.0' | 'Pixabay'; srcFile: string };
  process: { trimStartMs?: number; trimEndMs?: number; gainDb?: number; pitchCents?: number; loopCrossfadeMs?: number };
  rootNote?: string;          // chỉ 'bell', ví dụ 'D5'
};
```

`srcFile` là tên file trong `audio-src/`. Không commit file gốc; manifest đủ để tải lại từ `url` và chạy lại script.

### 4.3 Xử lý: `npm run audio:process`

- DevDependency `ffmpeg-static`, chốt phiên bản chính xác khi viết plan (`--save-exact`). Máy phát triển hiện chưa có ffmpeg; gói này mang sẵn binary cho Windows/Linux.
- Script đọc manifest, xử lý từng file trong `audio-src/` và ghi ra `public/audio/`. Thiếu file gốc thì báo tên và bỏ qua, không xoá file đã có.

| | SFX / stinger | Nhạc |
|---|---|---|
| Kênh | mono | stereo |
| Cắt | trim lặng đầu/cuối (ngưỡng −50 dBFS), fade-out 10 ms | điểm loop sạch: crossfade `loopCrossfadeMs` (mặc định 2000) giữa đuôi và đầu, nung sẵn vào file |
| Âm lượng | `loudnorm` về −18 LUFS, peak ≤ −3 dBFS | `loudnorm` về −23 LUFS, để nhạc luôn nằm dưới SFX |
| Cao độ | `bell`: dịch `pitchCents` để về đúng `rootNote` | — |
| Định dạng | `.ogg` Vorbis q4 + `.m4a` AAC 96 kbps | `.ogg` Vorbis 96 kbps + `.m4a` AAC 96 kbps, dài 60–150 s |

Không dùng MP3: encoder padding làm loop bị hở. Cần cả hai định dạng: Ogg loop liền mạch trên Chrome và Android WebView; `.m4a` là dự phòng cho Safari web.

### 4.4 Ngân sách dung lượng

- SFX + stinger: ≤ 300 KB mỗi định dạng.
- Nhạc: ≤ 2 MB mỗi track mỗi định dạng.
- Tổng `public/audio/`: ≤ 9 MB.

Test báo lỗi nếu vượt (mục 8.1).

## 5. Cài đặt và vòng đời

### 5.1 Cài đặt

Làm theo đúng mẫu `settings.haptics` của F2:

- `Progress.settings` thêm `music: boolean` và `sfx: boolean`, mặc định `true`. Bản lưu cũ thiếu hai trường này đọc ra `true`, không tăng `version`.
- `ProgressRepository` thêm `setMusic(on): LoadResult` và `setSfx(on): LoadResult`.
- `SettingsDialog` thêm hai toggle "Nhạc nền" và "Hiệu ứng âm thanh", đặt trên toggle "Rung phản hồi". Modal cao thêm cho vừa; plan đo lại toạ độ.
- Đổi toggle thì gọi ngay `music.setEnabled` / `sfx.setEnabled`, rồi lưu.
- Tắt nhạc: fade-out 300 ms rồi pause, giữ track hiện tại. Bật lại: tiếp tục track của scene hiện tại với fade-in 1000 ms. Khi tắt, `setTrack` vẫn ghi nhớ track mới nhưng không tải, không phát.
- `main.ts` đọc settings lúc khởi động và gọi `setEnabled` trước lần `setTrack` đầu.

### 5.2 Vòng đời

- Android: `main.ts` truyền thêm vào `setupAndroidLifecycle`: `onBackground` → `music.pause()` + `game.sound.pauseAll()`; `onResume` → `music.resume()` + `game.sound.resumeAll()`. `resume()` không làm gì nếu nhạc đang tắt.
- Web: `MusicPort` tự nghe `document.visibilitychange`, vì `HTMLAudioElement` không tự dừng khi tab ẩn. SFX dùng `pauseOnBlur` mặc định của Phaser.

## 6. Xử lý lỗi

- File SFX thiếu hoặc decode lỗi: `console.warn` một lần cho mỗi key, bỏ qua cue đó.
- Nhạc lỗi tải (`error` event) hoặc `play()` bị từ chối không phải vì chưa mở khoá: `console.warn` một lần, track đó coi như im lặng. Lần `setTrack` sang track khác vẫn thử bình thường.
- Không lỗi âm thanh nào được chặn input, làm dừng scene hay hiện ra cho người chơi.

## 7. File thay đổi

| File | Thay đổi |
|---|---|
| `src/presentation/feedback/audioCues.ts` | Mới, logic thuần: `audioCues`, `pitchFor` |
| `src/presentation/audio/uiCues.ts` | Mới: `playUiCue` |
| `src/infrastructure/sfx.ts`, `src/infrastructure/phaserSfx.ts` | Mới: cổng SFX thuần, driver Phaser |
| `src/infrastructure/music.ts` | Mới: `MusicPort` với factory phần tử |
| `src/infrastructure/audioManifest.ts` | Mới |
| `src/presentation/designTokens.ts` | Thêm `AUDIO_TOKENS` (âm lượng nền, giọng gốc, bảng âm lượng cue, thời lượng fade/duck) |
| `src/presentation/BackgroundScene.ts` (F1) | Preload SFX |
| `src/presentation/transitions/SceneDirector.ts` (F1) | Gọi `music.setTrack` theo mục 3.6 |
| `src/presentation/feedback/FeedbackDirector.ts` (F2) | Gọi `sfx.play(audioCues(...))` cạnh lời gọi rung |
| `src/presentation/feedback/victorySequence.ts` hoặc nơi F2 chạy timeline thắng | Stinger + duck, mục 3.5 |
| `src/main.ts` | Tạo port, đặt vào registry, đọc settings, nối vòng đời |
| `src/application/progressPort.ts`, `src/infrastructure/progressRepository.ts` | `settings.music`, `settings.sfx` |
| `src/presentation/SettingsDialog.ts` | Hai toggle mới |
| `src/presentation/MenuScene.ts`, `LevelSelectScene.ts`, `Hud.ts`, `PauseDialog.ts` | `playUiCue` |
| `scripts/process-audio.ts` | Mới |
| `public/audio/*` | Mới: 8 SFX + 2 nhạc, mỗi file 2 định dạng |
| `package.json` | Script `audio:process`, devDependency `ffmpeg-static` |
| `.gitignore` (gốc repo) | Thêm `game-next/audio-src/` |
| `docs/testing/audio/candidates.md` | Mới: danh sách ứng viên và lựa chọn của người review |

## 8. Kiểm thử

### 8.1 Tự động (vitest)

| File | Kiểm tra |
|---|---|
| `audioCues.test.ts` | Mỗi loại `FeedbackEvent` cho đúng cue theo bảng 3.3. `pitchFor` đúng 8 giá trị bảng 3.1. Chuỗi snap 1 → 4 đi lên; bỏ một mảnh rồi snap lại thì thấp hơn. Lô có `won` cho `bell` rate 2. Snap thứ 8 trở đi không vượt bậc 6. `reset` cùng nhiều `return` chỉ cho 1 `swish`. Overlap trễ 60 ms. Gọi hai lần cùng đầu vào ra cùng kết quả |
| `sfx.test.ts` | Driver giả: `setEnabled(false)` thì không gọi; tối đa 6 voice; cùng key trong 40 ms bị bỏ; `delayMs` hẹn đúng và bị huỷ khi tắt; driver ném lỗi thì nuốt và chỉ warn một lần mỗi key |
| `music.test.ts` | Phần tử giả + đồng hồ giả: crossfade A/B đúng thời lượng và phần tử cũ bị dừng; cùng track thì không làm gì; `duck` rồi trả về mức cũ; đổi track huỷ duck; `pause`/`resume`; tắt thì không phát, bật lại tiếp tục đúng track; `NotAllowedError` thì chờ chạm đầu; chọn `.ogg` hay `.m4a` theo `canPlayType` |
| `audioManifest.test.ts` | Mọi file trong `public/audio/` có trong manifest và ngược lại; license thuộc allowlist; mọi `SfxKey` và `TrackId` có mục; `bell` có `rootNote`; không vượt ngân sách mục 4.4 |
| `progress.test.ts` | Bản lưu thiếu `music`/`sfx` đọc ra `true`; `setMusic`/`setSfx` lưu được |

### 8.2 Nghiệm thu thủ công

Thêm nhóm mục âm thanh vào checklist nghiệm thu F3, chạy trên Chrome (390 × 844) và đúng máy Android tầm trung mà F3 dùng:

- Mở game trên web: im lặng cho tới chạm đầu, sau đó nhạc fade-in. Trên Android: ghi lại nhạc có phát ngay hay không.
- Menu → Bản đồ: nhạc không đổi. Bản đồ → Màn chơi: crossfade 1500 ms, không hụt tiếng hay chồng to.
- Snap lần lượt các mảnh của một màn 5–6 mảnh: nghe thành giai điệu đi lên; mảnh cuối kết về chủ âm; stinger vang ở lúc flash, nhạc hạ xuống rồi trở lại.
- Chạm bỏ qua chuỗi thắng sớm: stinger phát đúng một lần.
- Reset với nhiều mảnh trên bia: một tiếng `swish`, không dồn tiếng.
- Điểm loop của cả hai track không nghe thấy chỗ nối (nghe qua ít nhất 2 vòng).
- Tắt/bật từng toggle: đúng mục 5.1; mở lại app vẫn giữ cài đặt.
- Xuống nền rồi quay lại: im lặng khi ở nền, tiếp tục khi quay lại. Ẩn tab web: nhạc dừng.
- Tắt cả hai toggle: chơi trọn một màn, mọi phản hồi vẫn nhìn thấy được.
- Ghi lại hành vi audio focus (mục 9).

## 9. Rủi ro

- **Audio focus trên Android.** WebView có thể giành audio focus khi `HTMLAudioElement` phát, làm dừng Spotify/YouTube của người chơi. Đo trên máy thật ở nghiệm thu. Nếu xảy ra, ghi lại và quyết định riêng (ví dụ mặc định tắt nhạc nền, hoặc chỉ dùng WebAudio cho nhạc với track ngắn hơn). Không đoán trước trong spec này.
- **Chế độ im lặng.** Android vẫn phát âm thanh media khi máy để im lặng/rung. Đây là hành vi chuẩn của luồng media; chỉ ghi nhận.
- **Không tìm được ứng viên đạt yêu cầu** cho một key ở mục 4.1. Khi đó người review chọn: dùng chung sample với key gần nhất (ví dụ `shimmer` = `bell` với rate cao và vol thấp), hoặc bỏ cue đó. Bảng 3.3 cho phép cue trống mà không đổi logic.
- **Độ trễ WebAudio trên Android tầm trung** có thể 50–100 ms, làm `bell` lệch nhịp với vòng sáng snap. Đo ở nghiệm thu; nếu lệch rõ thì cắt khoảng lặng đầu sample triệt để hơn, không đổi kiến trúc.
- **Hai track khác giọng.** Nếu người review thích hai track không cùng giọng, `musicRootSemitone` thành một giá trị theo track. `audioCues` nhận thêm giọng hiện tại qua `ctx`; thay đổi này nhỏ và nằm trong plan.

## 10. Thứ tự triển khai

| Bước | Nội dung | Phụ thuộc | Điểm dừng |
|---|---|---|---|
| G0 | Danh sách ứng viên, người review nghe và chọn, chốt giọng gốc | Không | **Dừng:** chờ người review chọn file |
| G1 | `ffmpeg-static`, `audio:process`, manifest + test, `public/audio/`, `MusicPort`, `SfxPort`, settings, vòng đời, nhạc theo tuyến | F1 xong, G0 xong | Dừng sau G1 để nghe nhạc trên máy thật (loop, crossfade, audio focus) |
| G2 | `audioCues`, nối `FeedbackDirector` và chuỗi thắng, cue UI, chỉnh âm lượng, nghiệm thu mục 8.2 | F2 xong, G1 xong | Dừng: nghiệm thu |

G0 làm được ngay. Plan G1 và G2 viết sau khi spec này được duyệt; plan nêu rõ branch tách từ đâu theo trạng thái F lúc đó.

import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { MenuScene } from './presentation/MenuScene.ts';
import { PlayScene } from './presentation/PlayScene.ts';
import { LevelSelectScene } from './presentation/LevelSelectScene.ts';
import { FixtureScene } from './presentation/FixtureScene.ts';
import { setupAndroidLifecycle } from './infrastructure/lifecycle.ts';
import { resolveLaunch } from './launchParams.ts';
import { readViewport } from './presentation/viewport.ts';
import './style.css';

window.addEventListener('error', (event) => {
  console.error('[UNCAUGHT ERROR]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]:', event.reason);
});

const launch = resolveLaunch(window.location.search, import.meta.env.DEV);

const viewport = readViewport();

/**
 * Các mặt chữ phải có mặt trước khi scene đầu tiên dựng chữ.
 *
 * Mỗi mục là một đặc tả font theo cú pháp CSS shorthand.
 */
const REQUIRED_FACES = [
  "400 16px 'Be Vietnam Pro'",
  "500 16px 'Be Vietnam Pro'",
  "600 16px 'Be Vietnam Pro'",
  "700 16px 'Be Vietnam Pro'",
  "600 16px 'Cormorant Garamond'",
  // Vài tiêu đề đặt fontStyle: 'bold'. Không nhúng weight 700 thì trình duyệt
  // tự làm đậm giả, nét bệt và rìa bẩn.
  "700 16px 'Cormorant Garamond'",
  "600 16px 'Fredoka'",
  "700 16px 'Fredoka'",
] as const;

/**
 * Chờ webfont trước khi dựng game.
 *
 * Hai lý do phải tự nạp thay vì chỉ chờ `document.fonts.ready`:
 *
 *  - Phaser vẽ chữ bằng canvas 2D. Đặt `ctx.font` KHÔNG kích hoạt trình duyệt
 *    tải webfont, nên nếu không có phần tử DOM nào dùng tới các mặt chữ này thì
 *    `fonts.ready` resolve ngay trong khi font chưa hề được tải.
 *  - Phaser.Text đo bề rộng đúng một lần lúc tạo và không canh lại khi font về
 *    sau, nên dựng sớm là chữ sai font và lệch vị trí vĩnh viễn.
 *
 * Có giới hạn thời gian vì một mặt chữ hỏng không được phép chặn cả game.
 */
async function waitForFonts(timeoutMs = 3000): Promise<void> {
  if (!document.fonts) return;

  const loaded = Promise.all(
    REQUIRED_FACES.map((face) =>
      document.fonts.load(face).catch((error) => {
        console.warn('[FONT] không nạp được', face, error);
      })
    )
  ).then(() => document.fonts.ready);

  await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

async function bootstrap(): Promise<void> {
  await waitForFonts();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // Bộ đệm vẽ bằng đúng số pixel vật lý của máy. Hệ toạ độ thiết kế 720x1280
    // được từng scene dựng lại bằng camera zoom (`applyDesignViewport`).
    width: viewport.bufferWidth,
    height: viewport.bufferHeight,
    backgroundColor: '#1A2470',
    scale: {
      // NONE: không để Phaser tự co canvas. CSS lo phần hiển thị, còn kích thước
      // bộ đệm do ta quyết định — đó là điều kiện để hình không bị nội suy.
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [MenuScene, PlayScene, LevelSelectScene, FixtureScene],
  });

  if (launch.scene !== 'MenuScene') {
    game.events.once('ready', () => {
      game.scene.stop('MenuScene');
      if (launch.scene === 'PlayScene') {
        game.scene.start('PlayScene', { levelId: launch.levelId, mode: launch.mode });
      } else {
        game.scene.start('LevelSelectScene', launch.focusLevelId ? { focusLevelId: launch.focusLevelId } : undefined);
      }
    });
  }

  setupAndroidLifecycle({
    onHardwareBack: () => {
      const activePlayScene = game.scene.getScene('PlayScene') as PlayScene;
      const activeLevelSelect = game.scene.getScene('LevelSelectScene');

      if (activePlayScene && activePlayScene.scene.isActive()) {
        activePlayScene.onHardwareBack();
      } else if (activeLevelSelect && activeLevelSelect.scene.isActive()) {
        activeLevelSelect.scene.start('MenuScene');
      } else {
        App.exitApp();
      }
    },
    onBackground: () => {
      game.loop.sleep();
    },
    onResume: () => {
      game.loop.wake();
    },
  });
}

void bootstrap();

import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { MenuScene } from './presentation/MenuScene.ts';
import { PlayScene } from './presentation/PlayScene.ts';
import { LevelSelectScene } from './presentation/LevelSelectScene.ts';
import { FixtureScene } from './presentation/FixtureScene.ts';
import { setupAndroidLifecycle } from './infrastructure/lifecycle.ts';
import { resolveLaunch } from './launchParams.ts';
import './style.css';

window.addEventListener('error', (event) => {
  console.error('[UNCAUGHT ERROR]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]:', event.reason);
});

const launch = resolveLaunch(window.location.search, import.meta.env.DEV);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#1A2470',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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

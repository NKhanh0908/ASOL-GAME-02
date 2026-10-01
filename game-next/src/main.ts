import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { MenuScene } from './presentation/MenuScene.ts';
import { PlayScene } from './presentation/PlayScene.ts';
import { LevelSelectScene } from './presentation/LevelSelectScene.ts';
import { FixtureScene } from './presentation/FixtureScene.ts';
import { setupAndroidLifecycle } from './infrastructure/lifecycle.ts';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#080E24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, PlayScene, LevelSelectScene, FixtureScene],
});

setupAndroidLifecycle({
  onHardwareBack: () => {
    const activePlayScene = game.scene.getScene('PlayScene');
    const activeLevelSelect = game.scene.getScene('LevelSelectScene');

    if (activePlayScene && activePlayScene.scene.isActive()) {
      activePlayScene.scene.start('MenuScene');
    } else if (activeLevelSelect && activeLevelSelect.scene.isActive()) {
      activeLevelSelect.scene.start('MenuScene');
    } else {
      App.exitApp();
    }
  },
});

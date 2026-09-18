import Phaser from 'phaser';
import { CustomLevelScene } from './ui/CustomLevelScene';
import { GameScene } from './ui/GameScene';
import { LevelMenuScene } from './ui/LevelMenuScene';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 720,
  height: 1280,
  backgroundColor: '#080e24',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [LevelMenuScene, GameScene, CustomLevelScene],
  render: { antialias: true },
});



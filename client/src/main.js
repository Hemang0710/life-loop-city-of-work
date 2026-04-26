import Phaser from 'phaser';
import { BootScene }     from './scenes/BootScene.js';
import { CityScene }     from './scenes/CityScene.js';
import { UIScene }       from './scenes/UIScene.js';
import { MiniGameScene } from './scenes/MiniGameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { y: 0 } },
  },
  scene: [BootScene, CityScene, UIScene, MiniGameScene],
  backgroundColor: '#0f0e17',
  pixelArt: false,
  roundPixels: true,
};

new Phaser.Game(config);

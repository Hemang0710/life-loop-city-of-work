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
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    orientation: Phaser.Scale.Orientation.LANDSCAPE,
    fullscreenTarget: 'parent',
    min: {
      width: 320,
      height: 240,
    },
    max: {
      width: 1920,
      height: 1440,
    },
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { y: 0 } },
  },
  scene: [BootScene, CityScene, UIScene, MiniGameScene],
  backgroundColor: '#0f0e17',
  pixelArt: false,
  roundPixels: true,
  render: {
    pixelArt: true,
    antialias: false,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);

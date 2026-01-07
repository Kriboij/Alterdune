import Laberinto from './Laberinto.js';
import Fin from './Fin.js';
import MenuScene from './MenuScene.js';
import SeleccionScene from './SeleccionScene.js';
import LoginScene from './LoginScene.js';

const TILE_SIZE = 48;

const config = {
  type: Phaser.AUTO,
  parent: 'alterdune',
  roundPixels: true,
  pixelArt: true,

  render: { antialias: false },

  plugins: {
    scene: [
      {
        key: 'GridEngine',
        plugin: window.GridEngine,
        mapping: 'gridEngine',
      },
    ],
  },

  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },

  width: 16 * TILE_SIZE,
  height: 13 * TILE_SIZE,
  backgroundColor: '#333333',

  
  scene: [
    LoginScene,        
    MenuScene,     
    SeleccionScene,   
    Laberinto,
    Fin,
  ],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});

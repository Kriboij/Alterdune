import { gameState } from './gameState.js';
import { updatePlayer } from './api.js';
import { createSocket } from '/socket.js';

export default class Fin extends Phaser.Scene {
  constructor() {
    super('Fin');
  }

  preload() {
    this.load.image('menu', 'assets/sprites/menuBackground-export.png');
    this.load.bitmapFont(
      'rainyhearts',
      'assets/fonts/rainyhearts.png',
      'assets/fonts/rainyhearts.xml'
    );
  }

  create() {

    const myIndex = gameState.players.indexOf(gameState.playerNickname);

    const myScore =
      myIndex === 0 ? gameState.playerScore1 : gameState.playerScore2;

    const otherScore =
      myIndex === 0 ? gameState.playerScore2 : gameState.playerScore1;

    const didWin = myScore > otherScore;

    updatePlayer(gameState.playerNickname, {
      wins: didWin ? 1 : 0,
      losses: didWin ? 0 : 1
    }).catch(() => { });

    this.sound.stopAll();

    this.add.image(0, 0, 'menu')
      .setOrigin(0, 0)
      .setTint(0x553344)
      .setDisplaySize(this.scale.width, this.scale.height);

    const ganador =
      gameState.playerScore1 > gameState.playerScore2
        ? gameState.players[0]
        : gameState.players[1];



    const COLOR = 0x7cffb2;
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.add.bitmapText(
      centerX,
      centerY - 40,
      'rainyhearts',
      `${ganador} HA GANADO`,
      72
    )
      .setOrigin(0.5)
      .setTintFill(COLOR);

    this.add.bitmapText(
      centerX,
      centerY + 40,
      'rainyhearts',
      'PULSA PARA VOLVER AL MENU',
      32
    )
      .setOrigin(0.5)
      .setTintFill(COLOR);

    this.input.once('pointerdown', () => {
      this.shutdownSocket();
      this.resetMatchState();
      this.scene.start('menuScene');
    });
  }


  shutdownSocket() {
    if (gameState.socket) {
      gameState.socket.removeAllListeners();
      gameState.socket.disconnect();
      gameState.socket = null;
    }
  }


  resetMatchState() {
    gameState.matchId = null;
    gameState.players = [];
    gameState.searching = false;
    gameState.playerScore1 = 0;
    gameState.playerScore2 = 0;
    gameState.currentLevel = 1;
  }

}

import { gameState } from './gameState.js';
import { createSocket } from '/socket.js';

export default class SeleccionScene extends Phaser.Scene {
  constructor() {
    super('SeleccionScene');
  }

  //#region PRELOAD
  preload() {
    this.load.image('menu', 'assets/sprites/menuBackground-export.png');
    this.load.bitmapFont(
      'rainyhearts',
      'assets/fonts/rainyhearts.png',
      'assets/fonts/rainyhearts.xml'
    );
    this.load.spritesheet('Sprites', 'assets/ReSprite/Sprites1.png', {
      frameWidth: 10,
      frameHeight: 10,
    });
  }
  //#endregion

  //#region CREATE
  create() {

    this.myIndex = null;
    this.indices = [0, 0];
    this.alreadyReady = false;
    this._ended = false;


    if (!gameState.socket) {
      gameState.socket = createSocket();
      gameState.socket.connect();
    }

    this.socket = gameState.socket;

    this.socket.emit('match:join', {
      matchId: gameState.matchId,
      nickname: gameState.playerNickname
    });


    this.add.image(0, 0, 'menu')
      .setOrigin(0, 0)
      .setTint(0x553344)
      .setDisplaySize(this.scale.width, this.scale.height);

    const BASE_COLOR = 0x7cffb2;
    const HOVER_COLOR = 0xffffff;

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const TEXT_SIZE = 64;
    const SPRITE_SCALE = 4;

    const personajes = ['duende', 'rana', 'sombra', 'luciernaga'];

    const anims = [
      { key: 'duende', start: 0, end: 3 },
      { key: 'rana', start: 4, end: 7 },
      { key: 'sombra', start: 8, end: 11 },
      { key: 'luciernaga', start: 12, end: 15 },
    ];

    anims.forEach(a => {
      if (!this.anims.exists(a.key)) {
        this.anims.create({
          key: a.key,
          frames: this.anims.generateFrameNumbers('Sprites', {
            start: a.start,
            end: a.end
          }),
          frameRate: 5,
          repeat: -1
        });
      }
    });

    const pX = [centerX * 0.5, centerX * 1.5];
    const pY = centerY;

    this.playerLabels = [
      this.add.bitmapText(pX[0], pY - 70, 'rainyhearts', '---', TEXT_SIZE)
        .setOrigin(0.5)
        .setTintFill(BASE_COLOR),
      this.add.bitmapText(pX[1], pY - 70, 'rainyhearts', '---', TEXT_SIZE)
        .setOrigin(0.5)
        .setTintFill(BASE_COLOR)
    ];

    this.playerSprites = [
      this.add.sprite(pX[0], pY, 'Sprites')
        .setScale(SPRITE_SCALE)
        .play(personajes[0]),
      this.add.sprite(pX[1], pY, 'Sprites')
        .setScale(SPRITE_SCALE)
        .play(personajes[0])
    ];

    const makeButton = (x, y, text, size, onClick) => {
      const btn = this.add.bitmapText(x, y, 'rainyhearts', text, size)
        .setOrigin(0.5)
        .setTintFill(BASE_COLOR)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setTintFill(HOVER_COLOR));
      btn.on('pointerout', () => btn.setTintFill(BASE_COLOR));
      btn.on('pointerdown', onClick);

      return btn;
    };

    this.arrowLeft = makeButton(0, 0, '(', TEXT_SIZE, () => {
      if (this.myIndex === null) return;
      if (this.indices[this.myIndex] === 0) return;

      this.indices[this.myIndex]--;
      this.socket.emit('match:selectColor', {
        color: personajes[this.indices[this.myIndex]]
      });
    });

    this.arrowRight = makeButton(0, 0, ')', TEXT_SIZE, () => {
      if (this.myIndex === null) return;
      if (this.indices[this.myIndex] === personajes.length - 1) return;

      this.indices[this.myIndex]++;
      this.socket.emit('match:selectColor', {
        color: personajes[this.indices[this.myIndex]]
      });
    });

    makeButton(160, 60, 'VOLVER', TEXT_SIZE, () => {
      this.socket.disconnect();
      gameState.socket = null;
      this.scene.start('menuScene');
    });


    this.readyButton = makeButton(
      centerX,
      this.scale.height - 140,
      'LISTO (0/2)',
      TEXT_SIZE,
      () => {
        if (this.alreadyReady) return;
        this.alreadyReady = true;
        this.socket.emit('match:ready');
      }
    );

    this.socket.on('match:update', match => {
      if (this._ended) return;

      if (this.myIndex === null) {
        this.myIndex = match.players.findIndex(
          p => p.nickname === gameState.playerNickname
        );
      }

      match.players.forEach((p, i) => {
        this.playerLabels[i].setText(
          p.nickname + (p.ready ? '  O' : '  X')
        );

        if (p.color) {
          this.playerSprites[i].play(p.color, true);
          this.indices[i] = personajes.indexOf(p.color);

          if (i === 0) gameState.playerColor1 = p.color;
          if (i === 1) gameState.playerColor2 = p.color;
        }
      });

      if (this.myIndex === 0) {
        this.arrowLeft.setPosition(pX[0] - 120, pY);
        this.arrowRight.setPosition(pX[0] + 120, pY);
      }

      if (this.myIndex === 1) {
        this.arrowLeft.setPosition(pX[1] - 120, pY);
        this.arrowRight.setPosition(pX[1] + 120, pY);
      }

      const readyCount = match.players.filter(p => p.ready).length;
      this.readyButton.setText(`LISTO (${readyCount}/2)`);

      if (match.state === 'PLAYING') {
        gameState.players = match.players.map(p => p.nickname);
        this.scene.start('Laberinto', {
          map: 'Laberinto1',
          keys: true,
          next: {
            map: 'Laberinto2',
            keys: true,
            next: {
              map: 'Laberinto3',
              keys: true,
              next: null,
            }
          }
        });
      }
    });

    this.socket.on('match:end', ({ reason }) => {
      if (this._ended) return;
      this._ended = true;

      if (reason === 'disconnect') {
        this.showDisconnectOverlay();
        return;
      }

      this.scene.start('menuScene');
    });

    this.events.once('shutdown', () => {
      this.socket.removeAllListeners();
    });

  }
  //#endregion

  showDisconnectOverlay() {
    this.input.enabled = false;

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    );

    this.add.bitmapText(
      this.scale.width / 2,
      this.scale.height / 2,
      'rainyhearts',
      'El otro jugador se ha desconectado\n\nPulsa cualquier tecla para volver al menu',
      36
    )
      .setOrigin(0.5)
      .setCenterAlign()
      .setTintFill(0xffffff);

    this.input.keyboard.once('keydown', () => {
      this.scene.start('menuScene');
    });
  }
}

import { gameState } from './gameState.js';
import { pingServer, joinQueue, logoutPlayer } from './api.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menuScene');
    this.searching = false;
    this.searchEvent = null;
  }

  preload() {
    this.load.image('menu', 'assets/ReSprite/menuBackground-export.png');

    this.load.bitmapFont(
      'rainyhearts',
      'assets/fonts/rainyhearts.png',
      'assets/fonts/rainyhearts.xml'
    );

    this.load.audio('musica', 'assets/music/musica.mp3');
    this.load.audio('buttonSound', 'assets/sfx/buttonSound.mp3');
  }

  create() {

    gameState.playerScore1 = 0;
    gameState.playerScore2 = 0;

    this.sound.stopAll();
    this.sound.add('musica', { loop: true, volume: 0.5 }).play();

    this.add.image(0, 0, 'menu').setOrigin(0, 0);

    const leftMargin = 60;
    const bottomMargin = this.scale.height - 120;
    const titleColor = 0x7cffb2;

    this.add.bitmapText(
      leftMargin,
      120,
      'rainyhearts',
      'ALTERDUNE',
      96
    )
      .setOrigin(0, 0.5)
      .setTintFill(titleColor);

    const playText = this.add.bitmapText(
      leftMargin,
      bottomMargin,
      'rainyhearts',
      'JUGAR',
      48
    )
      .setOrigin(0, 0.5)
      .setTintFill(titleColor)
      .setInteractive({ useHandCursor: true });

    playText
      .on('pointerover', () => playText.setTintFill(0xffffff))
      .on('pointerout', () => playText.setTintFill(titleColor))
      .on('pointerdown', () => {
        if (this.searching) return;

        this.sound.play('buttonSound');

        this.searching = true;
        playText.setText('BUSCANDO...');

        const tryMatch = async () => {
          this.statusText.setText('Buscando partida...');
          const result = await joinQueue(gameState.playerNickname);

          if (!result.matchFound) return;
          
          this.statusText.setText('Partida encontrada');
          this.searching = false;
          this.searchEvent.remove();


          gameState.matchId = result.matchId;
          this.scene.start('SeleccionScene');
        };


        tryMatch();

        this.searchEvent = this.time.addEvent({
          delay: 2000,
          loop: true,
          callback: tryMatch
        });
      });

    const exitText = this.add.bitmapText(
      leftMargin,
      bottomMargin + 50,
      'rainyhearts',
      'SALIR',
      48
    )
      .setOrigin(0, 0.5)
      .setTintFill(titleColor)
      .setInteractive({ useHandCursor: true });

    exitText
      .on('pointerover', () => exitText.setTintFill(0xffffff))
      .on('pointerout', () => exitText.setTintFill(titleColor))
      .on('pointerdown', async () => {
        this.sound.play('buttonSound');

        this.searchEvent?.remove();
        this.searching = false;

        if (gameState.playerNickname) {
          await logoutPlayer(gameState.playerNickname);
          gameState.playerNickname = null;
        }

        window.location.reload();
      });


    this.add.bitmapText(
      this.scale.width - 20,
      this.scale.height - 20,
      'rainyhearts',
      'Creado por Lautaro Berruezo',
      24
    ).setOrigin(1, 1).setTintFill(titleColor);


    if (gameState.playerNickname) {
      this.add.bitmapText(
        60,
        200,
        'rainyhearts',
        `Usuario: ${gameState.playerNickname}`,
        32
      )
        .setTintFill(0x7cffb2);
    }

    this.add.bitmapText(
      this.scale.width - 20,
      this.scale.height - 160,
      'rainyhearts',
      'CONTROLES',
      28
    )
      .setOrigin(1, 1)
      .setTintFill(0x7cffb2);

    this.add.bitmapText(
      this.scale.width - 20,
      this.scale.height - 100,
      'rainyhearts',
      'WASD',
      24
    )
      .setOrigin(1, 1)
      .setTintFill(0x7cffb2);


    this.statusText = this.add.bitmapText(
      leftMargin,
      bottomMargin - 50,
      'rainyhearts',
      'Presione jugar para buscar partida...',
      24
    )
      .setTintFill(0xaaaaaa);

  }


}

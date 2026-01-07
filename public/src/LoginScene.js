import { gameState } from './gameState.js';
import { loginPlayer } from './api.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  preload() {
    this.load.bitmapFont(
      'rainyhearts',
      'assets/fonts/rainyhearts.png',
      'assets/fonts/rainyhearts.xml'
    );
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const TITLE_COLOR = 0x7cffb2;

    this.add.bitmapText(
      centerX,
      centerY - 100,
      'rainyhearts',
      'INTRODUCE TU NICK',
      48
    )
      .setOrigin(0.5)
      .setTintFill(TITLE_COLOR);


    // Nickname introducido por el usuario 
    this.nickname = '';

    const nickText = this.add.bitmapText(
      centerX,
      centerY,
      'rainyhearts',
      '_',
      48
    )
      .setOrigin(0.5)
      .setTintFill(TITLE_COLOR);

    // Entrada de teclado para construir el nickname y confirmar login
    this.input.keyboard.on('keydown', async (event) => {
      if (event.key === 'Backspace') {
        this.nickname = this.nickname.slice(0, -1);
      }
      else if (event.key === 'Enter') {

        try {
          // Llamada REST al servidor para login / creación del jugador
          const player = await loginPlayer(this.nickname.trim());

          // Guardado del nickname en el estado global del cliente
          gameState.playerNickname = player.nickname;

          // Cambio de escena tras login correcto
          this.scene.start('menuScene');
        } catch (err) {
          nickText
            .setTintFill(0xff5555)
            .setText(err.message);
        }
        return;
      }
      else if (event.key.length === 1 && this.nickname.length < 12) {
        this.nickname += event.key;
      }

      nickText.setText(this.nickname || '_');
    });
  }

}

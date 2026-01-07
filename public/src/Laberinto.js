import { gameState } from './gameState.js';
import { createSocket } from '/socket.js'; // ✅ AÑADIR
5

export default class Laberinto extends Phaser.Scene {
  constructor() {
    super('Laberinto');
  }

  init(data) {
    this.mapName = data.map;
    this.nextLevel = data.next;
  }

  //#region PRELOAD 

  preload() {
    this.playerLocked = { player1: false, player2: false };

    this.load.tilemapTiledJSON(
      this.mapName,
      `assets/tiles/${this.mapName}.tmj`
    );

    this.load.spritesheet('tileset', 'assets/Resprite/tileset.png', {
      frameWidth: 10,
      frameHeight: 10,
    });

    this.load.spritesheet('Sprites', 'assets/ReSprite/Sprites1.png', {
      frameWidth: 10,
      frameHeight: 10,
    });

    // FX jugador
    this.load.spritesheet(
      'fxDisappearPlayer',
      'assets/ReSprite/DisappearEffectPlayer.png',
      { frameWidth: 10, frameHeight: 10 }
    );



    this.load.audio('musica', 'assets/music/musica.mp3');
    this.load.audio('spikeAscend', 'assets/sfx/spikeAscend.wav');
    this.load.audio('deathSound', 'assets/sfx/deathSound.wav');
    this.load.audio('levelComplete', 'assets/sfx/levelComplete.wav');
  }

  //#endregion 


  //#region CREATE 

  create() {

    //Sincronizador de posición
    this.positionSyncTimer = this.time.addEvent({
      // Cada segundo se verifica la posición de los jugadores.
      delay: 1000,
      loop: true,
      callback: () => {
        const pos = this.gridEngine.getPosition(this.myPlayerId);
        if (!pos) return;

        this.socket.emit('player:sync', {
          playerId: this.myPlayerId,
          position: pos
        });
      }
    });


    // Desconexión
    const onConnectionLost = () => {
      if (this._ended) return;
      this._ended = true;
      this.showDisconnectOverlay();
    };


    this.socket = gameState.socket;

    // Validación defensiva del estado compartido
    if (!Array.isArray(gameState.players) || gameState.players.length !== 2) {
      console.error('[LAB] players inválido', gameState.players);
      return;
    }

    const myIndex = gameState.players.indexOf(gameState.playerNickname);
    if (myIndex === -1) {
      console.error('[LAB] Mi nickname no está en players');
      return;
    }

    // Identidad local y remota
    this.myPlayerId = myIndex === 0 ? 'player1' : 'player2';
    this.remotePlayerId = myIndex === 0 ? 'player2' : 'player1';

    // Estado de bloqueo de movimiento
    this.playerLocked = { player1: false, player2: false };


    //SOCKETS ON

    // Movimiento remoto recibido desde el servidor
    this.socket.on('player:move', ({ dir }) => {
      if (this.playerLocked[this.remotePlayerId]) return;
      this.tryMove(this.remotePlayerId, dir);
    });

    // Sincronización Posición 
    this.socket.on('player:sync', ({ playerId, position }) => {
      if (playerId !== this.remotePlayerId) return;

      const current = this.gridEngine.getPosition(playerId);
      if (!current) return;

      const dx = Math.abs(current.x - position.x);
      const dy = Math.abs(current.y - position.y);

      // Si no hay mucha diferencia se deja igual.
      if (dx <= 0 && dy <= 0) return;

      // Solo se usa si es distinta.
      this.playerLocked[playerId] = true;

      if (this.gridEngine.stopMovement) {
        this.gridEngine.stopMovement(playerId);
      }

      this.gridEngine.setPosition(playerId, position);

      this.time.delayedCall(80, () => {
        this.playerLocked[playerId] = false;
      });
    });

    //Respawn remoto sincronizados
    this.socket.on('player:respawn', ({ playerId }) => {
      if (!playerId) return;
      this.forceRespawn(playerId);
    });

    //Desconexiones
    this.socket.on('match:end', onConnectionLost);
    this.socket.on('player:disconnected', onConnectionLost);

    // Limpieza de subscripciones previas si se reinicia la escena
    if (this.positionSub) {
      this.positionSub.unsubscribe();
      this.positionSub = null;
    }

    if (this.gridEngine?.clearAllCharacters) {
      this.gridEngine.clearAllCharacters();
    }

    // Música de fondo
    this.sound.stopAll();
    this.music = this.sound.add('musica', { loop: true, volume: 0.5 });
    this.music.play();

    // Creación del mapa
    this.map = this.make.tilemap({ key: this.mapName });
    const tileset = this.map.addTilesetImage('Tiles0', 'tileset');
    this.topLayer = this.map.createLayer('top', tileset, 0, 0);
    this.topLayer.setVisible(false);

    this.buildTiles();

    // Animación FX (solo una vez globalmente)
    if (!this.anims.exists('playerHit')) {
      this.anims.create({
        key: 'playerHit',
        frames: this.anims.generateFrameNumbers('fxDisappearPlayer', {
          start: 0,
          end: 3
        }),
        frameRate: 12,
        repeat: 0
      });
    }

    // Creación de sprites de jugador
    const scale = 48 / 10;

    this.playerSprites = {
      player1: this.add.sprite(0, 0, 'Sprites').setScale(scale).setDepth(10),
      player2: this.add.sprite(0, 0, 'Sprites').setScale(scale).setDepth(10)
    };

    this.playerSprites.player1.play(gameState.playerColor1, true);
    this.playerSprites.player2.play(gameState.playerColor2, true);

    this.playerStartPositions = {
      player1: { x: 1, y: 1 },
      player2: { x: 14, y: 1 }
    };

    this.gridEngine.create(this.map, {
      characters: [
        { id: 'player1', sprite: this.playerSprites.player1, startPosition: this.playerStartPositions.player1 },
        { id: 'player2', sprite: this.playerSprites.player2, startPosition: this.playerStartPositions.player2 }
      ]
    });

    // Input local
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Estado de nivel
    this.spikeSprites = [];
    this.spikesActive = false;
    this.playerSpikeHits = { player1: 0, player2: 0 };
    this.maxSpikeHits = 3;

    this.spawnLevelDecor();
    this.startSpikeCycle();
    this.registerTileEvents();

    // Marcador
    this.scoreText = this.add.bitmapText(
      this.scale.width / 2,
      16,
      'rainyhearts',
      `${gameState.playerScore1} - ${gameState.playerScore2}`,
      32
    ).setOrigin(0.5, 0).setTintFill(0xffffff);

    // Etiquetas de jugador
    this.playerLabels = {
      player1: this.add.bitmapText(0, 0, 'rainyhearts', gameState.players[0], 16)
        .setOrigin(0.5, 1).setScale(2).setDepth(20).setTintFill(0xffffff),
      player2: this.add.bitmapText(0, 0, 'rainyhearts', gameState.players[1], 16)
        .setOrigin(0.5, 1).setScale(2).setDepth(20).setTintFill(0xffffff)
    };

    // Destrucción correcta del socket al salir de la escena
    this.events.once('shutdown', () => {
      this.positionSyncTimer?.remove();
      this.socket.removeAllListeners();
    });


  }

  //#endregion 


  //#region UPDATE 

  update() {
    if (this.playerLocked[this.myPlayerId]) return;

    const dir = this.getLocalInputDirection();
    if (dir) {
      this.tryMove(this.myPlayerId, dir);
      this.socket.emit('player:move', { dir });
    }

    this.updatePlayerLabels();
  }


  //#endregion



  //#region GAMEPLAY  

  tryMove(charId, dir) {
    const pos = this.gridEngine.getPosition(charId);
    const isMoving = this.gridEngine.isMoving(charId);

    if (pos) {
      let target = { ...pos };
      if (dir === 'left') target.x--;
      if (dir === 'right') target.x++;
      if (dir === 'up') target.y--;
      if (dir === 'down') target.y++;

      const tile = this.map.getTileAt(
        target.x,
        target.y,
        true,
        this.topLayer
      );

    }

    console.groupEnd();

    this.gridEngine.move(charId, dir);
  }

  getLocalInputDirection() {
    if (!this.wasd) return null;

    if (this.wasd.A.isDown) return 'left';
    if (this.wasd.D.isDown) return 'right';
    if (this.wasd.W.isDown) return 'up';
    if (this.wasd.S.isDown) return 'down';

    return null;
  }

  forceRespawn(charId) {
    const sprite = this.playerSprites[charId];
    if (!sprite) return;

    this.playerLocked[charId] = true;

    if (this.gridEngine.stopMovement) {
      this.gridEngine.stopMovement(charId);
    }

    this.gridEngine.setPosition(
      charId,
      this.playerStartPositions[charId]
    );

    this.time.delayedCall(150, () => {
      this.playerLocked[charId] = false;
    });
  }

  //#endregion


  //#region TILE EVENTS

  registerTileEvents() {
    console.log('registerTileEvents CALLED');
    this.positionSub = this.gridEngine
      .positionChangeFinished()
      .subscribe(({ charId, enterTile, prevTile }) => {
        const tile = this.map.getTileAt(
          enterTile.x,
          enterTile.y,
          true,
          this.topLayer
        );

        if (!tile?.properties) return;

        if (tile.properties.spike && this.spikesActive) {
          this.handleSpikeHit(charId);
          return;
        }





        if (tile.properties.enter) {
          this.sound.play('levelComplete');

          if (enterTile.x < 8) gameState.playerScore1++;
          else gameState.playerScore2++;

          this.scoreText.setText(
            `${gameState.playerScore1} - ${gameState.playerScore2}`
          );

          if (this.nextLevel) {
            this.scene.start('Laberinto', {
              map: this.nextLevel.map,
              next: this.nextLevel.next,
              keys: this.nextLevel.keys,
            });
          } else {
            this.scene.start('Fin');
          }
        }
      }
      );
  }

  //#endregion 


  //#region CONSTRUIR 






  buildTiles() {
    const scale = 48 / 10;

    this.topLayer.layer.data.forEach(row =>
      row.forEach(tile => {
        if (!tile) return;

        const x = this.map.tileToWorldX(tile.x) + 24;
        const y = this.map.tileToWorldY(tile.y) + 24;

        this.add.image(x, y, 'tileset', 0).setScale(scale);

        if (tile.properties?.ge_collide) {
          this.add.image(x, y, 'tileset', 10).setScale(scale);
        }
      })
    );
  }

  spawnLevelDecor() {
    const scale = 48 / 10;

    this.map.layers.forEach(layer =>
      layer.data.forEach(row =>
        row.forEach(tile => {
          if (!tile?.properties) return;

          const x = this.map.tileToWorldX(tile.x) + 24;
          const y = this.map.tileToWorldY(tile.y) + 24;

          // PINCHOS 
          if (tile.properties.spike) {
            const s = this.add.sprite(x, y, 'tileset', 0).setScale(scale);
            s.tileX = tile.x;
            s.tileY = tile.y;
            this.spikeSprites.push(s);
          }

          // META 
          if (tile.properties.enter) {
            this.add.sprite(x, y, 'tileset', 3).setScale(scale);
          }

        })
      )
    );
  }


  //#endregion 


  //#region PINCHOs

  checkPlayersOnActiveSpikes() {
    if (!this.spikesActive) return;

    ['player1', 'player2'].forEach(charId => {
      if (this.playerLocked[charId]) return;

      const pos = this.gridEngine.getPosition(charId);
      if (!pos) return;

      const tile = this.map.getTileAt(pos.x, pos.y, true, this.topLayer);
      if (tile?.properties?.spike) {
        this.handleSpikeHit(charId);
      }
    });
  }


  startSpikeCycle() {
    this.spikeSound = this.sound.add('spikeAscend', { volume: 0.7 });

    const raise = () => {
      this.spikeSprites.forEach(s => s.setFrame(1));
      this.spikeSound.play();

      this.time.delayedCall(25, () => {
        this.spikeSprites.forEach(s => s.setFrame(2));
        this.spikesActive = true;

        this.checkPlayersOnActiveSpikes();
        this.time.delayedCall(500, () => {
          this.spikeSprites.forEach(s => s.setFrame(1));
          this.spikesActive = false;

          this.time.delayedCall(25, () => {
            this.spikeSprites.forEach(s => s.setFrame(0));
          });
        });
      });
    };

    this.time.delayedCall(1000, () => {
      raise();
      this.time.addEvent({ delay: 3000, loop: true, callback: raise });
    });
  }

  handleSpikeHit(charId) {
    const sprite = this.playerSprites[charId];
    if (!sprite) return;

    this.playerLocked[charId] = true;
    this.playerSpikeHits[charId]++;

    if (this.gridEngine.stopMovement) {
      this.gridEngine.stopMovement(charId);
    }

    this.sound.play('deathSound', { volume: 0.6 });

    const fx = this.add
      .sprite(sprite.x, sprite.y, 'fxDisappearPlayer')
      .setScale(48 / 10);

    fx.play('playerHit');
    fx.on('animationcomplete', () => fx.destroy());

    this.cameras.main.shake(150, 0.01);

    this.tweens.add({
      targets: sprite,
      alpha: 0.4,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        sprite.alpha = 1;

        this.forceRespawn(charId);

        if (charId === this.myPlayerId) {
          this.socket.emit('player:respawn', {
            matchId: gameState.matchId,
            playerId: charId
          });
        }
      }
    });
  }


  //#endregion 




  //#region UI 
  showDisconnectOverlay(otherName = 'El otro jugador') {
    if (this._disconnected) return;
    this._disconnected = true;


    this.input.enabled = false;
    this.physics?.pause();
    this.sound.stopAll();

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    ).setDepth(1000);

    this.add.bitmapText(
      this.scale.width / 2,
      this.scale.height / 2,
      'rainyhearts',
      `El otro jugador se ha desconectado\n\nPulsa cualquier tecla para volver al menu`,
      36
    )
      .setOrigin(0.5)
      .setCenterAlign()
      .setTintFill(0xffffff)
      .setDepth(1001);

    this.input.keyboard.once('keydown', () => {
      this.scene.start('menuScene');
    });
  }

  updatePlayerLabels() {
    ['player1', 'player2'].forEach(id => {
      const sprite = this.playerSprites[id];
      const label = this.playerLabels[id];
      if (!sprite || !label) return;

      const x = sprite.x + 20;
      const y = sprite.y - 28;

      label.setPosition(x, y);
    });
  }

  //#endregion
}

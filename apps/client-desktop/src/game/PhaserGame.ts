import Phaser from 'phaser';
import { socket } from '../network/socket';
import type { PlayerSnapshot } from '@emberveil/shared';

class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private token = '';
  private playerId = '';
  private sprites = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor() {
    super('world');
  }

  init(data: { token: string; playerId: string }) {
    this.token = data.token;
    this.playerId = data.playerId;
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cameras.main.setBackgroundColor('#18212d');

    socket.on('world:init', ({ players }) => {
      Object.values(players).forEach((p) => this.drawOrMove(p));
    });
    socket.on('world:playerJoined', (p) => this.drawOrMove(p));
    socket.on('world:playerMoved', (p) => this.drawOrMove(p));
    socket.on('world:playerLeft', (id) => {
      const s = this.sprites.get(id);
      s?.destroy();
      this.sprites.delete(id);
    });
  }

  update() {
    const me = this.sprites.get(this.playerId);
    if (!me) return;

    let dx = 0;
    let dy = 0;
    let direction: PlayerSnapshot['direction'] = 'down';

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) { dx = -1; direction = 'left'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) { dx = 1; direction = 'right'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) { dy = -1; direction = 'up'; }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) { dy = 1; direction = 'down'; }

    if (dx !== 0 || dy !== 0) {
      const next = { x: me.x / 32 + dx, y: me.y / 32 + dy };
      socket.emit('player:move', { token: this.token, direction, position: next });
    }
  }

  private drawOrMove(player: PlayerSnapshot) {
    let sprite = this.sprites.get(player.id);
    if (!sprite) {
      sprite = this.add.rectangle(player.position.x * 32, player.position.y * 32, 24, 24, player.id === this.playerId ? 0x72f1b8 : 0xf9a03f);
      this.sprites.set(player.id, sprite);
      this.add.text(sprite.x - 24, sprite.y - 20, player.name, { color: '#ffffff', fontSize: '12px' });
    }
    sprite.setPosition(player.position.x * 32, player.position.y * 32);
  }
}

export function startPhaser(container: HTMLDivElement, data: { token: string; playerId: string }): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: container,
    scene: [new WorldScene()],
    pixelArt: true,
    callbacks: {
      postBoot: (game) => game.scene.start('world', data)
    }
  });
}

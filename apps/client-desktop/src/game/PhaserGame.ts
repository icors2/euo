import Phaser from 'phaser';
import { socket } from '../network/socket';
import type { PlayerSnapshot } from '@emberveil/shared';
import type { RuntimeMap } from '../types/map';

class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private token = '';
  private playerId = '';
  private map!: RuntimeMap;
  private sprites = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor() {
    super('world');
  }

  init(data: { token: string; playerId: string; map: RuntimeMap }) {
    this.token = data.token;
    this.playerId = data.playerId;
    this.map = data.map;
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.cameras.main.setBackgroundColor('#18212d');

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        this.add.rectangle(x * 32, y * 32, 31, 31, (x + y) % 2 ? 0x243447 : 0x1b2634).setOrigin(0, 0);
      }
    }

    this.map.triggers.forEach((t) => {
      const color = t.triggerType === 'PORTAL' ? 0x8a5cff : t.triggerType === 'SANCTUARY_ZONE' ? 0x2fd38a : 0xf1c40f;
      this.add.rectangle(t.x * 32, t.y * 32, t.width * 32, t.height * 32, color, 0.25).setOrigin(0, 0);
    });

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
      const next = { x: Math.floor(me.x / 32) + dx, y: Math.floor(me.y / 32) + dy };
      socket.emit('player:move', { token: this.token, direction, position: next });
    }
  }

  private drawOrMove(player: PlayerSnapshot) {
    let sprite = this.sprites.get(player.id);
    if (!sprite) {
      sprite = this.add.rectangle(player.position.x * 32 + 16, player.position.y * 32 + 16, 20, 20, player.id === this.playerId ? 0x72f1b8 : 0xf9a03f);
      this.sprites.set(player.id, sprite);
      this.add.text(sprite.x - 20, sprite.y - 22, player.name, { color: '#ffffff', fontSize: '11px' });
    }
    sprite.setPosition(player.position.x * 32 + 16, player.position.y * 32 + 16);
  }
}

export function startPhaser(container: HTMLDivElement, data: { token: string; playerId: string; map: RuntimeMap }): Phaser.Game {
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

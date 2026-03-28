import Fastify from 'fastify';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import type { ClientToServerEvents, ServerToClientEvents, PlayerSnapshot, ChatMessage } from '@emberveil/shared';
import { issueToken, validateToken } from './auth/store';
import { worldState, upsertPlayer, movePlayer, removePlayer } from './world/state';
import { handleSlashCommand } from './chat/commands';

const app = Fastify({ logger: true });
const httpServer = createServer(app.server);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' }
});

app.get('/health', async () => ({ ok: true, name: 'emberveil-server' }));

const loginSchema = z.object({ username: z.string().min(3), password: z.string().min(4) });

io.on('connection', (socket) => {
  let activePlayerId: string | null = null;

  socket.on('auth:login', (payload, cb) => {
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return cb(false);
    const token = issueToken(parsed.data.username);
    cb(true, token);
  });

  socket.on('character:select', ({ token, characterName }, cb) => {
    const username = validateToken(token);
    if (!username) return cb(false);

    const player: PlayerSnapshot = {
      id: `${username}:${characterName}`,
      name: characterName,
      mapId: 'hearthmere',
      position: { x: 10, y: 10 },
      direction: 'down'
    };

    activePlayerId = player.id;
    upsertPlayer(player);

    socket.emit('world:init', worldState);
    socket.broadcast.emit('world:playerJoined', player);
    cb(true, player);
  });

  socket.on('player:move', ({ token, direction, position }) => {
    const username = validateToken(token);
    if (!username || !activePlayerId) return;

    const moved = movePlayer(activePlayerId, position.x, position.y, direction);
    if (!moved) {
      socket.emit('system:error', 'Movement rejected by server validation.');
      return;
    }

    io.emit('world:playerMoved', moved);
  });

  socket.on('chat:send', ({ token, text }) => {
    const username = validateToken(token);
    if (!username) return;

    const msg: ChatMessage = text.startsWith('/')
      ? handleSlashCommand(username, text) ?? { channel: 'system', sender: 'System', text: 'No-op command.', timestamp: Date.now() }
      : { channel: 'global', sender: username, text, timestamp: Date.now() };

    io.emit('chat:message', msg);
  });

  socket.on('disconnect', () => {
    if (activePlayerId) {
      removePlayer(activePlayerId);
      io.emit('world:playerLeft', activePlayerId);
    }
  });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  app.log.info(`Emberveil server listening on :${port}`);
});

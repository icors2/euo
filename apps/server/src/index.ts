import Fastify from 'fastify';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import type { ClientToServerEvents, ServerToClientEvents, PlayerSnapshot, ChatMessage } from '@emberveil/shared';
import { registerUser, issueToken, validateToken, listCharacters, createCharacter, tokenIsAdmin } from './auth/store';
import { worldState, upsertPlayer, movePlayer, removePlayer } from './world/state';
import { handleSlashCommand } from './chat/commands';
import { canOccupy, getMapSnapshot, resolveTrigger } from './content/maps';
import { getInventory, getEquipment, equipItem, getQuestLog, getNpcDialogue, addLootToInventory } from './game/progression';
import { getCombatSnapshot, attackMonster, respawnAtBind, setBind, spawnMonsterAdmin } from './game/combat';
import { inviteToParty, leaveParty, getParty } from './game/party';

const app = Fastify({ logger: true });
const httpServer = createServer(app.server);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' }
});

app.get('/health', async () => ({ ok: true, name: 'emberveil-server' }));

const registerSchema = z.object({ username: z.string().min(3), email: z.string().email(), password: z.string().min(4) });
const loginSchema = z.object({ username: z.string().min(3), password: z.string().min(4) });
const createCharacterSchema = z.object({ token: z.string(), characterName: z.string().min(3) });

app.post('/auth/register', async (req, reply) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });

  const result = registerUser(parsed.data.username, parsed.data.email, parsed.data.password);
  if (!result.ok) return reply.code(400).send(result);
  return { ok: true };
});

app.post('/auth/login', async (req, reply) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  const token = issueToken(parsed.data.username, parsed.data.password);
  if (!token) return reply.code(401).send({ ok: false, error: 'Invalid credentials.' });
  return { ok: true, token, characters: listCharacters(parsed.data.username) };
});

app.post('/character/create', async (req, reply) => {
  const parsed = createCharacterSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  const username = validateToken(parsed.data.token);
  if (!username) return reply.code(401).send({ ok: false, error: 'Invalid token.' });

  const result = createCharacter(username, parsed.data.characterName);
  if (!result.ok) return reply.code(400).send(result);
  return { ok: true, characters: listCharacters(username) };
});



app.get('/character/:characterId/inventory', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return { ok: true, inventory: getInventory(characterId) };
});

app.get('/character/:characterId/equipment', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return { ok: true, equipment: getEquipment(characterId) };
});

app.post('/character/:characterId/equip', async (req, reply) => {
  const characterId = (req.params as { characterId: string }).characterId;
  const parsed = z.object({ slot: z.string(), inventorySlot: z.number().int().min(0) }).safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  const result = equipItem(characterId, parsed.data.slot, parsed.data.inventorySlot);
  if (!result.ok) return reply.code(400).send(result);
  return { ok: true, equipment: getEquipment(characterId) };
});

app.get('/character/:characterId/quests', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return { ok: true, quests: getQuestLog(characterId) };
});

app.get('/npc/:npcId/dialogue', async (req) => {
  const npcId = (req.params as { npcId: string }).npcId;
  return { ok: true, dialogue: getNpcDialogue(npcId) };
});


app.get('/world/:characterId/state', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  const mapId = String((req.query as { mapId?: string }).mapId ?? 'hearthmere');
  return { ok: true, ...getCombatSnapshot(characterId, mapId) };
});

app.post('/world/:characterId/attack', async (req, reply) => {
  const characterId = (req.params as { characterId: string }).characterId;
  const parsed = z.object({ mapId: z.string(), monsterId: z.string() }).safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });

  const result = attackMonster(characterId, parsed.data.mapId, parsed.data.monsterId);
  if (!result.ok) return reply.code(400).send(result);
  if (result.combat.loot) addLootToInventory(characterId, result.combat.loot);
  return result;
});

app.post('/world/:characterId/respawn', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return respawnAtBind(characterId);
});


app.get('/party/:characterId', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return { ok: true, party: getParty(characterId) };
});

app.post('/party/:characterId/invite', async (req, reply) => {
  const characterId = (req.params as { characterId: string }).characterId;
  const parsed = z.object({ inviteeId: z.string().min(3) }).safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  return inviteToParty(characterId, parsed.data.inviteeId);
});

app.post('/party/:characterId/leave', async (req) => {
  const characterId = (req.params as { characterId: string }).characterId;
  return leaveParty(characterId);
});

app.post('/pvp/duel', async (req, reply) => {
  const parsed = z.object({ attackerId: z.string(), defenderId: z.string(), zone: z.string() }).safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  if (parsed.data.zone !== 'redglass-pit') return reply.code(400).send({ ok: false, error: 'PvP only enabled in Redglass Pit.' });

  const rollA = Math.floor(Math.random() * 20) + 1;
  const rollB = Math.floor(Math.random() * 20) + 1;
  const winner = rollA >= rollB ? parsed.data.attackerId : parsed.data.defenderId;
  return { ok: true, winner, rolls: { attacker: rollA, defender: rollB } };
});

app.post('/admin/spawn-monster', async (req, reply) => {
  const parsed = z.object({ token: z.string(), mapId: z.string(), name: z.string(), x: z.number().int(), y: z.number().int() }).safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid payload.' });
  if (!tokenIsAdmin(parsed.data.token)) return reply.code(403).send({ ok: false, error: 'Admin only.' });

  const monster = spawnMonsterAdmin(parsed.data.mapId, parsed.data.name, parsed.data.x, parsed.data.y);
  return { ok: true, monster };
});
app.get('/content/map/:mapId', async (req, reply) => {
  const mapId = (req.params as { mapId: string }).mapId;
  const map = getMapSnapshot(mapId);
  if (!map) return reply.code(404).send({ ok: false, error: 'Map not found.' });
  return { ok: true, map };
});

io.on('connection', (socket) => {
  let activePlayerId: string | null = null;

  socket.on('auth:login', (payload, cb) => {
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return cb(false);
    const token = issueToken(parsed.data.username, parsed.data.password);
    if (!token) return cb(false);
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

    const existing = worldState.players[activePlayerId];
    if (!existing) return;
    if (!canOccupy(existing.mapId, position.x, position.y)) {
      socket.emit('system:error', 'Blocked tile or out of bounds.');
      return;
    }

    const moved = movePlayer(activePlayerId, position.x, position.y, direction);
    if (!moved) {
      socket.emit('system:error', 'Movement rejected by server validation.');
      return;
    }

    const trigger = resolveTrigger(moved.mapId, moved.position.x, moved.position.y);
    if (trigger?.triggerType === 'PORTAL' && trigger.targetMap) {
      moved.mapId = trigger.targetMap;
      moved.position = { x: Number(trigger.targetX ?? 1), y: Number(trigger.targetY ?? 1) };
      io.emit('chat:message', { channel: 'system', sender: 'System', text: `${moved.name} steps through a portal.`, timestamp: Date.now() });
    } else if (trigger?.triggerType === 'SANCTUARY_ZONE') {
      socket.emit('chat:message', { channel: 'system', sender: 'Sanctuary', text: 'You feel safe within the ward.', timestamp: Date.now() });
    } else if (trigger?.triggerType === 'BIND_POINT') {
      setBind(activePlayerId, moved.mapId, moved.position.x, moved.position.y);
      socket.emit('chat:message', { channel: 'system', sender: 'System', text: 'Bind point attuned.', timestamp: Date.now() });
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

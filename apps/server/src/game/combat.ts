import crypto from 'node:crypto';

interface MonsterInstance {
  id: string;
  name: string;
  mapId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  alive: boolean;
  respawnAt: number;
}

interface CharacterCombatState {
  hp: number;
  maxHp: number;
  dead: boolean;
  bind: { mapId: string; x: number; y: number };
}

const monsters: MonsterInstance[] = [
  { id: 'm-ember-rat-1', name: 'Ember Rat', mapId: 'hearthmere', x: 12, y: 10, hp: 18, maxHp: 18, attack: 2, alive: true, respawnAt: 0 },
  { id: 'm-ember-rat-2', name: 'Ember Rat', mapId: 'hearthmere', x: 13, y: 11, hp: 18, maxHp: 18, attack: 2, alive: true, respawnAt: 0 },
  { id: 'm-thorn-hound-1', name: 'Thorn Hound', mapId: 'hearthmere', x: 15, y: 8, hp: 28, maxHp: 28, attack: 4, alive: true, respawnAt: 0 }
];

const characterStates = new Map<string, CharacterCombatState>();

function ensureCharacter(characterId: string): CharacterCombatState {
  let state = characterStates.get(characterId);
  if (!state) {
    state = { hp: 100, maxHp: 100, dead: false, bind: { mapId: 'hearthmere', x: 10, y: 10 } };
    characterStates.set(characterId, state);
  }
  return state;
}

function tickRespawns() {
  const now = Date.now();
  for (const m of monsters) {
    if (!m.alive && now >= m.respawnAt) {
      m.alive = true;
      m.hp = m.maxHp;
    }
  }
}

export function setBind(characterId: string, mapId: string, x: number, y: number) {
  const state = ensureCharacter(characterId);
  state.bind = { mapId, x, y };
}

export function getCombatSnapshot(characterId: string, mapId: string) {
  tickRespawns();
  const self = ensureCharacter(characterId);
  return {
    self,
    monsters: monsters.filter((m) => m.mapId === mapId)
  };
}

export function attackMonster(characterId: string, mapId: string, monsterId: string) {
  tickRespawns();
  const self = ensureCharacter(characterId);
  if (self.dead) return { ok: false, error: 'You are dead. Use respawn.' };

  const monster = monsters.find((m) => m.id === monsterId && m.mapId === mapId && m.alive);
  if (!monster) return { ok: false, error: 'Monster not found.' };

  const playerDamage = Math.floor(Math.random() * 8) + 5;
  monster.hp -= playerDamage;
  let loot: { id: string; name: string; qty: number } | null = null;

  if (monster.hp <= 0) {
    monster.alive = false;
    monster.hp = 0;
    monster.respawnAt = Date.now() + 20_000;
    loot = { id: 'ember-shard', name: 'Ember Shard', qty: 1 };
  }

  if (monster.alive) {
    self.hp -= monster.attack;
  }

  if (self.hp <= 0) {
    self.hp = 0;
    self.dead = true;
  }

  return {
    ok: true,
    combat: {
      playerDamage,
      retaliation: monster.alive ? monster.attack : 0,
      defeated: !monster.alive,
      loot
    },
    self,
    monster
  };
}

export function respawnAtBind(characterId: string) {
  const self = ensureCharacter(characterId);
  self.dead = false;
  self.hp = self.maxHp;
  return { ok: true, bind: self.bind, self };
}


export function spawnMonsterAdmin(mapId: string, name: string, x: number, y: number) {
  const monster: MonsterInstance = {
    id: `m-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 8)}`,
    name,
    mapId,
    x,
    y,
    hp: 24,
    maxHp: 24,
    attack: 3,
    alive: true,
    respawnAt: 0
  };
  monsters.push(monster);
  return monster;
}

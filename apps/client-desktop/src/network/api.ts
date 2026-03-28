import type { RuntimeMap } from '../types/map';

const API_BASE = 'http://localhost:4000';

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}

export async function login(username: string, password: string): Promise<{ ok: boolean; token?: string; characters?: string[]; error?: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function logout(token: string) {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return res.json();
}

export async function createCharacter(token: string, characterName: string): Promise<{ ok: boolean; characters?: string[]; error?: string }> {
  const res = await fetch(`${API_BASE}/character/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, characterName })
  });
  return res.json();
}

export async function fetchMap(mapId: string): Promise<RuntimeMap | null> {
  const res = await fetch(`${API_BASE}/content/map/${mapId}`);
  const data = await res.json();
  if (!data.ok) return null;
  return data.map as RuntimeMap;
}

export async function fetchInventory(characterId: string) {
  const res = await fetch(`${API_BASE}/character/${characterId}/inventory`);
  return res.json() as Promise<{ ok: boolean; inventory: Array<{ slot: number; itemId: string; name: string; quantity: number }> }>;
}

export async function fetchEquipment(characterId: string) {
  const res = await fetch(`${API_BASE}/character/${characterId}/equipment`);
  return res.json() as Promise<{ ok: boolean; equipment: Record<string, { itemId: string; name: string } | null> }>;
}

export async function equipFromInventory(characterId: string, slot: string, inventorySlot: number) {
  const res = await fetch(`${API_BASE}/character/${characterId}/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot, inventorySlot })
  });
  return res.json();
}

export async function fetchQuests(characterId: string) {
  const res = await fetch(`${API_BASE}/character/${characterId}/quests`);
  return res.json() as Promise<{ ok: boolean; quests: Array<{ id: string; title: string; state: string; objective: string }> }>;
}

export async function fetchNpcDialogue(npcId: string) {
  const res = await fetch(`${API_BASE}/npc/${npcId}/dialogue`);
  return res.json() as Promise<{ ok: boolean; dialogue: { name: string; lines: string[]; questOfferId?: string } }>;
}


export async function fetchWorldState(characterId: string, mapId: string) {
  const res = await fetch(`${API_BASE}/world/${characterId}/state?mapId=${encodeURIComponent(mapId)}`);
  return res.json() as Promise<{ ok: boolean; self: { hp: number; maxHp: number; dead: boolean }; monsters: Array<{ id: string; name: string; hp: number; maxHp: number; alive: boolean; x: number; y: number }> }>;
}

export async function attackMonster(characterId: string, mapId: string, monsterId: string) {
  const res = await fetch(`${API_BASE}/world/${characterId}/attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapId, monsterId })
  });
  return res.json();
}

export async function respawn(characterId: string) {
  const res = await fetch(`${API_BASE}/world/${characterId}/respawn`, { method: 'POST' });
  return res.json();
}


export async function fetchParty(characterId: string) {
  const res = await fetch(`${API_BASE}/party/${characterId}`);
  return res.json() as Promise<{ ok: boolean; party: { id: string; leaderId: string; members: string[] } | null }>;
}

export async function partyInvite(characterId: string, inviteeId: string) {
  const res = await fetch(`${API_BASE}/party/${characterId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteeId })
  });
  return res.json();
}

export async function partyLeave(characterId: string) {
  const res = await fetch(`${API_BASE}/party/${characterId}/leave`, { method: 'POST' });
  return res.json();
}

export async function pvpDuel(attackerId: string, defenderId: string) {
  const res = await fetch(`${API_BASE}/pvp/duel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackerId, defenderId, zone: 'redglass-pit' })
  });
  return res.json();
}

export async function adminSpawnMonster(token: string, mapId: string, name: string, x: number, y: number) {
  const res = await fetch(`${API_BASE}/admin/spawn-monster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, mapId, name, x, y })
  });
  return res.json();
}


export async function fetchAdminActions(token: string) {
  const res = await fetch(`${API_BASE}/admin/actions?token=${encodeURIComponent(token)}`);
  return res.json() as Promise<{ ok: boolean; actions?: Array<{ at: string; admin: string; action: string; payload: unknown }>; error?: string }>;
}


export async function adminMuteUser(token: string, username: string, seconds: number) {
  const res = await fetch(`${API_BASE}/admin/mute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, username, seconds })
  });
  return res.json();
}

export async function adminBanUser(token: string, username: string, banned: boolean) {
  const res = await fetch(`${API_BASE}/admin/ban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, username, banned })
  });
  return res.json();
}

export async function fetchSanctions(token: string) {
  const res = await fetch(`${API_BASE}/admin/sanctions?token=${encodeURIComponent(token)}`);
  return res.json() as Promise<{ ok: boolean; sanctions?: Array<{ username: string; mutedUntil: number | null; banned: boolean; isAdmin: boolean }>; error?: string }>;
}

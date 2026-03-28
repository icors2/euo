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

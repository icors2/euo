import type { PlayerSnapshot, WorldState } from '@emberveil/shared';

export const worldState: WorldState = { players: {} };

export function upsertPlayer(player: PlayerSnapshot): void {
  worldState.players[player.id] = player;
}

export function movePlayer(playerId: string, x: number, y: number, direction: PlayerSnapshot['direction']): PlayerSnapshot | null {
  const p = worldState.players[playerId];
  if (!p) return null;

  const dx = Math.abs(p.position.x - x);
  const dy = Math.abs(p.position.y - y);
  if (dx + dy > 1) return null;

  p.position = { x, y };
  p.direction = direction;
  return p;
}

export function removePlayer(playerId: string): void {
  delete worldState.players[playerId];
}

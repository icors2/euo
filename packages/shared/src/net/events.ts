import type { ChatMessage, PlayerSnapshot, Vec2, WorldState } from '../types/game';

export interface ClientToServerEvents {
  'auth:login': (payload: { username: string; password: string }, cb: (ok: boolean, token?: string) => void) => void;
  'character:select': (payload: { token: string; characterName: string }, cb: (ok: boolean, player?: PlayerSnapshot) => void) => void;
  'player:move': (payload: { token: string; direction: 'up' | 'down' | 'left' | 'right'; position: Vec2 }) => void;
  'chat:send': (payload: { token: string; text: string }) => void;
}

export interface ServerToClientEvents {
  'world:init': (state: WorldState) => void;
  'world:playerJoined': (player: PlayerSnapshot) => void;
  'world:playerMoved': (player: PlayerSnapshot) => void;
  'world:playerLeft': (playerId: string) => void;
  'chat:message': (msg: ChatMessage) => void;
  'system:error': (text: string) => void;
}

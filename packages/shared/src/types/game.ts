export type ClassArchetype = 'BASTION' | 'NIGHTWEAVER' | 'EMBER_SAGE' | 'THORNBOUND';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerSnapshot {
  id: string;
  name: string;
  mapId: string;
  position: Vec2;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface ChatMessage {
  channel: 'global' | 'local' | 'party' | 'system' | 'whisper';
  sender: string;
  text: string;
  timestamp: number;
  recipient?: string;
}

export interface WorldState {
  players: Record<string, PlayerSnapshot>;
}

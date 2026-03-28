import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@emberveil/shared';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:4000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 20
});

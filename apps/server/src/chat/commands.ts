import type { ChatMessage } from '@emberveil/shared';

export function handleSlashCommand(sender: string, text: string): ChatMessage | null {
  const [cmd, ...rest] = text.trim().split(/\s+/);
  switch (cmd.toLowerCase()) {
    case '/help':
      return { channel: 'system', sender: 'System', text: 'Commands: /help /who /roll /bind /unstuck /msg', timestamp: Date.now() };
    case '/who':
      return { channel: 'system', sender: 'System', text: 'Use /who UI integration in Phase 3.', timestamp: Date.now() };
    case '/roll': {
      const max = Number(rest[0] ?? 100);
      const value = Math.max(1, Math.floor(Math.random() * Math.max(max, 2)) + 1);
      return { channel: 'global', sender, text: `rolls ${value}/${max}`, timestamp: Date.now() };
    }
    default:
      return { channel: 'system', sender: 'System', text: `Unknown command from ${sender}: ${cmd}`, timestamp: Date.now() };
  }
}

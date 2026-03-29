import type { ChatMessage } from '@emberveil/shared';

export interface CommandContext {
  onlineNames: string[];
  lastWhisperFrom?: string;
}

export function handleSlashCommand(sender: string, text: string, ctx: CommandContext): ChatMessage | null {
  const [cmd, ...rest] = text.trim().split(/\s+/);
  switch (cmd.toLowerCase()) {
    case '/help':
      return { channel: 'system', sender: 'System', text: 'Commands: /help /who /msg /reply /partyinvite /partyleave /roll /bind /unstuck /trade /ignore', timestamp: Date.now() };
    case '/who':
      return { channel: 'system', sender: 'System', text: `Online: ${ctx.onlineNames.join(', ') || 'none'}`, timestamp: Date.now() };
    case '/msg': {
      const to = rest.shift();
      const body = rest.join(' ');
      if (!to || !body) return { channel: 'system', sender: 'System', text: 'Usage: /msg <player> <text>', timestamp: Date.now() };
      return { channel: 'whisper', sender, recipient: to, text: body, timestamp: Date.now() };
    }
    case '/reply': {
      const body = rest.join(' ');
      if (!ctx.lastWhisperFrom) return { channel: 'system', sender: 'System', text: 'No recent whisper target.', timestamp: Date.now() };
      return { channel: 'whisper', sender, recipient: ctx.lastWhisperFrom, text: body || '...', timestamp: Date.now() };
    }
    case '/partyinvite':
      return { channel: 'system', sender: 'System', text: `Use Party panel invite for: ${rest[0] ?? '<name>'}`, timestamp: Date.now() };
    case '/partyleave':
      return { channel: 'system', sender: 'System', text: 'Use Party panel Leave button.', timestamp: Date.now() };
    case '/roll': {
      const max = Number(rest[0] ?? 100);
      const value = Math.max(1, Math.floor(Math.random() * Math.max(max, 2)) + 1);
      return { channel: 'global', sender, text: `rolls ${value}/${max}`, timestamp: Date.now() };
    }
    case '/bind':
      return { channel: 'system', sender: 'System', text: 'Stand on a bind point to attune.', timestamp: Date.now() };
    case '/unstuck':
      return { channel: 'system', sender: 'System', text: 'Attempting unstuck. Re-enter map if needed.', timestamp: Date.now() };
    case '/trade':
      return { channel: 'system', sender: 'System', text: `Trade requested with ${rest[0] ?? 'unknown'}.`, timestamp: Date.now() };
    case '/ignore':
      return { channel: 'system', sender: 'System', text: `${rest[0] ?? 'Player'} ignored (session-local).`, timestamp: Date.now() };
    default:
      return { channel: 'system', sender: 'System', text: `Unknown command: ${cmd}`, timestamp: Date.now() };
  }
}

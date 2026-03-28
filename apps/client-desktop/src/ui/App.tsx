import { useEffect, useRef, useState } from 'react';
import { socket } from '../network/socket';
import { startPhaser } from '../game/PhaserGame';
import type { ChatMessage } from '@emberveil/shared';

type Stage = 'launcher' | 'login' | 'character' | 'game';

export function App() {
  const [stage, setStage] = useState<Stage>('launcher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [characterName, setCharacterName] = useState('Cinderling');
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [playerId, setPlayerId] = useState('');
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('chat:message', (msg) => setChat((old) => [...old.slice(-49), msg]));
    socket.on('system:error', (text) => setChat((old) => [...old, { channel: 'system', sender: 'System', text, timestamp: Date.now() }]));
    return () => {
      socket.off('chat:message');
      socket.off('system:error');
    };
  }, []);

  useEffect(() => {
    if (stage === 'game' && gameRef.current) {
      const game = startPhaser(gameRef.current, { token, playerId });
      return () => game.destroy(true);
    }
  }, [stage, token, playerId]);

  const login = () => {
    socket.connect();
    socket.emit('auth:login', { username, password }, (ok, tk) => {
      if (!ok || !tk) return;
      setToken(tk);
      setStage('character');
    });
  };

  const selectCharacter = () => {
    socket.emit('character:select', { token, characterName }, (ok, player) => {
      if (!ok || !player) return;
      setPlayerId(player.id);
      setStage('game');
    });
  };

  if (stage === 'launcher') return <div className="panel"><h1>Emberveil Online</h1><button onClick={() => setStage('login')}>Start</button></div>;
  if (stage === 'login') return <div className="panel"><h2>Login</h2><input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} /><input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} /><button onClick={login}>Enter Hearthmere</button></div>;
  if (stage === 'character') return <div className="panel"><h2>Character Select</h2><input value={characterName} onChange={(e) => setCharacterName(e.target.value)} /><button onClick={selectCharacter}>Play</button></div>;

  return (
    <div className="game-shell">
      <div ref={gameRef} className="game-canvas" />
      <aside className="hud">
        <div className="bars"><div>HP 100/100</div><div>Focus 60/60</div></div>
        <div className="chat-log">{chat.map((m, i) => <div key={i}>[{m.channel}] {m.sender}: {m.text}</div>)}</div>
        <div className="chat-input"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && socket.emit('chat:send', { token, text: chatInput })} /><button onClick={() => socket.emit('chat:send', { token, text: chatInput })}>Send</button></div>
      </aside>
    </div>
  );
}

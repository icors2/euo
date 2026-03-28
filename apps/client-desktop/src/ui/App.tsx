import { useEffect, useRef, useState } from 'react';
import { socket } from '../network/socket';
import { startPhaser } from '../game/PhaserGame';
import type { ChatMessage } from '@emberveil/shared';
import type { RuntimeMap } from '../types/map';
import * as api from '../network/api';

type Stage = 'launcher' | 'register' | 'login' | 'character' | 'game';

export function App() {
  const [stage, setStage] = useState<Stage>('launcher');
  const [username, setUsername] = useState('devhero');
  const [email, setEmail] = useState('devhero@emberveil.local');
  const [password, setPassword] = useState('devpass');
  const [token, setToken] = useState('');
  const [characterName, setCharacterName] = useState('Cinderling');
  const [characters, setCharacters] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [runtimeMap, setRuntimeMap] = useState<RuntimeMap | null>(null);
  const [status, setStatus] = useState('');
  const [inventory, setInventory] = useState<Array<{ slot: number; name: string; quantity: number }>>([]);
  const [equipment, setEquipment] = useState<Record<string, { itemId: string; name: string } | null>>({});
  const [quests, setQuests] = useState<Array<{ id: string; title: string; state: string; objective: string }>>([]);
  const [dialogue, setDialogue] = useState<{ name: string; lines: string[]; questOfferId?: string } | null>(null);
  const [monsters, setMonsters] = useState<Array<{ id: string; name: string; hp: number; maxHp: number; alive: boolean; x: number; y: number }>>([]);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [dead, setDead] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [showParty, setShowParty] = useState(false);
  const [party, setParty] = useState<{ id: string; leaderId: string; members: string[] } | null>(null);
  const [invitee, setInvitee] = useState('');
  const [pvpTarget, setPvpTarget] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminMonsterName, setAdminMonsterName] = useState('Arena Wisp');
  const [adminActions, setAdminActions] = useState<Array<{ at: string; admin: string; action: string }>>([]);
  const [titleArt, setTitleArt] = useState<string | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/assets/manifests/ui-manifest.json').then((r) => r.json()).then((data) => {
      const maybeTitle = data?.backgrounds?.find((b: any) => String(b.key).includes('title'));
      if (maybeTitle?.processedPath) setTitleArt(`/${maybeTitle.processedPath}`);
    }).catch(() => setTitleArt(null));
  }, []);

  useEffect(() => {
    socket.on('chat:message', (msg) => setChat((old) => [...old.slice(-49), msg]));
    socket.on('system:error', (text) => setChat((old) => [...old, { channel: 'system', sender: 'System', text, timestamp: Date.now() }]));
    return () => {
      socket.off('chat:message');
      socket.off('system:error');
    };
  }, []);

  useEffect(() => {
    if (stage === 'game' && gameRef.current && runtimeMap) {
      const game = startPhaser(gameRef.current, { token, playerId, map: runtimeMap });
      return () => game.destroy(true);
    }
  }, [stage, token, playerId, runtimeMap]);

  const loadCharacterPanels = async (cid: string) => {
    const [inv, eq, q, world, partyRes] = await Promise.all([
      api.fetchInventory(cid),
      api.fetchEquipment(cid),
      api.fetchQuests(cid),
      api.fetchWorldState(cid, 'hearthmere'),
      api.fetchParty(cid)
    ]);
    setInventory(inv.inventory.map((i) => ({ slot: i.slot, name: i.name, quantity: i.quantity })));
    setEquipment(eq.equipment);
    setQuests(q.quests);
    setMonsters(world.monsters);
    setHp(world.self.hp);
    setMaxHp(world.self.maxHp);
    setDead(world.self.dead);
    setParty(partyRes.party);
  };

  const refreshCombat = async () => {
    const [world, partyRes] = await Promise.all([
      api.fetchWorldState(playerId, 'hearthmere'),
      api.fetchParty(playerId)
    ]);
    setMonsters(world.monsters);
    setHp(world.self.hp);
    setMaxHp(world.self.maxHp);
    setDead(world.self.dead);
    setParty(partyRes.party);
  };

  const doRegister = async () => {
    const res = await api.register(username, email, password);
    if (!res.ok) return setStatus(res.error ?? 'Registration failed');
    setStatus('Account created. Please login.');
    setStage('login');
  };

  const doLogin = async () => {
    const res = await api.login(username, password);
    if (!res.ok || !res.token) return setStatus(res.error ?? 'Login failed');
    setToken(res.token);
    setCharacters(res.characters ?? []);
    setCharacterName(res.characters?.[0] ?? '');
    socket.connect();
    setStage('character');
    setStatus('Logged in.');
  };

  const doCreateCharacter = async () => {
    const res = await api.createCharacter(token, characterName);
    if (!res.ok) return setStatus(res.error ?? 'Character creation failed');
    setCharacters(res.characters ?? []);
    setStatus(`Character ${characterName} created.`);
  };

  const selectCharacter = async (name: string) => {
    const map = await api.fetchMap('hearthmere');
    if (!map) return setStatus('Failed to load map');
    setRuntimeMap(map);
    socket.emit('character:select', { token, characterName: name }, async (ok, player) => {
      if (!ok || !player) return setStatus('Character select failed');
      setPlayerId(player.id);
      await loadCharacterPanels(player.id);
      setStage('game');
    });
  };

  const equipWeaponFromSlot = async (slot: number) => {
    await api.equipFromInventory(playerId, 'weapon', slot);
    const eq = await api.fetchEquipment(playerId);
    setEquipment(eq.equipment);
  };

  const talkToMira = async () => {
    const res = await api.fetchNpcDialogue('npc-mira');
    setDialogue(res.dialogue);
  };

  const attack = async (monsterId: string) => {
    const result = await api.attackMonster(playerId, 'hearthmere', monsterId);
    if (!result.ok) {
      setStatus(result.error ?? 'Attack failed');
    } else {
      setStatus(`You dealt ${result.combat.playerDamage}.`);
      await loadCharacterPanels(playerId);
    }
  };

  const respawn = async () => {
    await api.respawn(playerId);
    await loadCharacterPanels(playerId);
    setStatus('Respawned at bind point.');
  };



  const inviteParty = async () => {
    const res = await api.partyInvite(playerId, invitee);
    if (!res.ok) return setStatus(res.error ?? 'Party invite failed');
    const partyRes = await api.fetchParty(playerId);
    setParty(partyRes.party);
    setStatus('Party updated.');
  };

  const leavePartyNow = async () => {
    await api.partyLeave(playerId);
    const partyRes = await api.fetchParty(playerId);
    setParty(partyRes.party);
    setStatus('Left party.');
  };

  const duel = async () => {
    const res = await api.pvpDuel(playerId, pvpTarget);
    if (!res.ok) return setStatus(res.error ?? 'Duel failed');
    setStatus(`Duel winner: ${res.winner} (A:${res.rolls.attacker} B:${res.rolls.defender})`);
  };



  const loadAdminActions = async () => {
    const res = await api.fetchAdminActions(token);
    if (!res.ok) return setStatus(res.error ?? 'Cannot load admin actions');
    setAdminActions((res.actions ?? []).map((a) => ({ at: a.at, admin: a.admin, action: a.action })));
  };

  const spawnMonsterAdmin = async () => {
    const res = await api.adminSpawnMonster(token, 'hearthmere', adminMonsterName, 9, 9);
    if (!res.ok) return setStatus(res.error ?? 'Admin spawn failed');
    setStatus(`Spawned ${res.monster.name}`);
    await refreshCombat();
    await loadAdminActions();
  };

  if (stage === 'launcher') {
    return <div className="panel" style={titleArt ? { backgroundImage: `url(${titleArt})`, backgroundSize: 'cover' } : {}}><h1>Emberveil Online</h1><button onClick={() => setStage('login')}>Login</button><button onClick={() => setStage('register')}>Register</button><small>{titleArt ? 'Loaded title art from manifest' : 'Using fallback title panel'}</small></div>;
  }

  if (stage === 'register') {
    return <div className="panel"><h2>Create Account</h2><input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} /><input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} /><input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} /><button onClick={doRegister}>Register</button><button onClick={() => setStage('login')}>Back to Login</button><small>{status}</small></div>;
  }

  if (stage === 'login') {
    return <div className="panel"><h2>Login</h2><input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} /><input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} /><button onClick={doLogin}>Enter Hearthmere</button><small>{status}</small></div>;
  }

  if (stage === 'character') {
    return (
      <div className="panel">
        <h2>Character Select</h2>
        <div className="character-list">
          {characters.map((name) => <button key={name} onClick={() => selectCharacter(name)}>{name}</button>)}
        </div>
        <h3>Create New Character</h3>
        <input value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
        <button onClick={doCreateCharacter}>Create</button>
        <small>{status}</small>
      </div>
    );
  }

  return (
    <div className="game-shell">
      <div ref={gameRef} className="game-canvas" />
      <aside className="hud">
        <div className="bars"><div>HP {hp}/{maxHp}</div><div>{dead ? 'DEAD' : 'Alive'}</div></div>
        <div className="actions">
          <button onClick={() => setShowInventory((v) => !v)}>Inventory</button>
          <button onClick={() => setShowEquipment((v) => !v)}>Equipment</button>
          <button onClick={() => setShowQuests((v) => !v)}>Quests</button>
          <button onClick={() => setShowCombat((v) => !v)}>Combat</button>
          <button onClick={() => setShowParty((v) => !v)}>Party</button>
          <button onClick={() => setShowAdmin((v) => !v)}>Admin</button>
          <button onClick={talkToMira}>Talk: Mira</button>
          <button onClick={refreshCombat}>Refresh</button>
        </div>

        {showInventory && <div className="panel mini"><h3>Inventory</h3>{inventory.map((i) => <div key={i.slot}><button onClick={() => equipWeaponFromSlot(i.slot)}>Equip</button> {i.name} x{i.quantity}</div>)}</div>}
        {showEquipment && <div className="panel mini"><h3>Equipment</h3>{Object.entries(equipment).map(([slot, value]) => <div key={slot}>{slot}: {value?.name ?? 'empty'}</div>)}</div>}
        {showQuests && <div className="panel mini"><h3>Quest Log</h3>{quests.map((q) => <div key={q.id}><strong>{q.title}</strong> [{q.state}]<br />{q.objective}</div>)}</div>}
        {showCombat && <div className="panel mini"><h3>Combat Targets</h3>{monsters.map((m) => <div key={m.id}><button disabled={!m.alive || dead} onClick={() => attack(m.id)}>Attack</button> {m.name} ({m.hp}/{m.maxHp}) {m.alive ? '' : '[respawning]'}</div>)}{dead && <button onClick={respawn}>Respawn at Bind</button>}</div>}
        {dialogue && <div className="panel mini"><h3>{dialogue.name}</h3>{dialogue.lines.map((l, i) => <div key={i}>{l}</div>)}{dialogue.questOfferId && <small>Quest available: {dialogue.questOfferId}</small>}</div>}

        {showParty && <div className="panel mini"><h3>Party</h3><div>ID: {party?.id ?? 'none'}</div><div>Leader: {party?.leaderId ?? '-'}</div><div>Members: {party?.members?.join(', ') ?? '-'}</div><input placeholder="invite characterId" value={invitee} onChange={(e) => setInvitee(e.target.value)} /><button onClick={inviteParty}>Invite</button><button onClick={leavePartyNow}>Leave Party</button><input placeholder="duel target characterId" value={pvpTarget} onChange={(e) => setPvpTarget(e.target.value)} /><button onClick={duel}>Duel in Redglass Pit</button></div>}
        {showAdmin && <div className="panel mini"><h3>Admin Tools</h3><div>Login as <code>gamemaster/adminpass</code> to use.</div><input value={adminMonsterName} onChange={(e) => setAdminMonsterName(e.target.value)} /><button onClick={spawnMonsterAdmin}>Spawn Monster @ (9,9)</button><button onClick={loadAdminActions}>Refresh Admin Log</button>{adminActions.slice(-5).map((a, i) => <div key={i}>{a.at} {a.admin}: {a.action}</div>)}</div>}

        <small>{status}</small>
        <div className="chat-log">{chat.map((m, i) => <div key={i}>[{m.channel}] {m.sender}: {m.text}</div>)}</div>
        <div className="chat-input"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && socket.emit('chat:send', { token, text: chatInput })} /><button onClick={() => socket.emit('chat:send', { token, text: chatInput })}>Send</button></div>
      </aside>
    </div>
  );
}

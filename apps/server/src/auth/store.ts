import crypto from 'node:crypto';

interface UserRecord {
  isAdmin: boolean;
  username: string;
  email: string;
  passwordHash: string;
  characters: string[];
  mutedUntil?: number;
  banned: boolean;
}

const users = new Map<string, UserRecord>();
const tokenToUser = new Map<string, string>();

function hash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function registerUser(username: string, email: string, password: string, isAdmin = false): { ok: boolean; error?: string } {
  if (users.has(username)) return { ok: false, error: 'Username already exists.' };
  users.set(username, {
    username,
    email,
    passwordHash: hash(password),
    characters: ['Cinderling'],
    isAdmin,
    banned: false
  });
  return { ok: true };
}

export function issueToken(username: string, password: string): string | null {
  const user = users.get(username);
  if (!user || user.passwordHash !== hash(password)) return null;
  if (user.banned) return null;
  const token = `${username}-${crypto.randomUUID()}`;
  tokenToUser.set(token, username);
  return token;
}

export function validateToken(token: string): string | null {
  return tokenToUser.get(token) ?? null;
}

export function listCharacters(username: string): string[] {
  return users.get(username)?.characters ?? [];
}

export function createCharacter(username: string, characterName: string): { ok: boolean; error?: string } {
  const user = users.get(username);
  if (!user) return { ok: false, error: 'User not found.' };
  if (user.characters.includes(characterName)) return { ok: false, error: 'Character already exists.' };
  if (characterName.length < 3) return { ok: false, error: 'Character name too short.' };
  user.characters.push(characterName);
  return { ok: true };
}

registerUser('devhero', 'devhero@emberveil.local', 'devpass');
registerUser('gamemaster', 'gm@emberveil.local', 'adminpass', true);

export function tokenIsAdmin(token: string): boolean {
  const username = validateToken(token);
  if (!username) return false;
  return users.get(username)?.isAdmin ?? false;
}

export function isMuted(username: string): boolean {
  const mutedUntil = users.get(username)?.mutedUntil;
  if (!mutedUntil) return false;
  return Date.now() < mutedUntil;
}

export function setMute(username: string, seconds: number): { ok: boolean; error?: string } {
  const user = users.get(username);
  if (!user) return { ok: false, error: 'User not found.' };
  user.mutedUntil = Date.now() + Math.max(1, seconds) * 1000;
  return { ok: true };
}

export function setBan(username: string, banned: boolean): { ok: boolean; error?: string } {
  const user = users.get(username);
  if (!user) return { ok: false, error: 'User not found.' };
  user.banned = banned;
  return { ok: true };
}

export function getSanctions() {
  return Array.from(users.values()).map((u) => ({
    username: u.username,
    mutedUntil: u.mutedUntil ?? null,
    banned: u.banned,
    isAdmin: u.isAdmin
  }));
}

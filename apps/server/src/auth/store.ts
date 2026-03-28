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

interface SessionToken {
  username: string;
  expiresAt: number;
  revoked: boolean;
}

const users = new Map<string, UserRecord>();
const tokenToSession = new Map<string, SessionToken>();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.pbkdf2Sync(password, salt, 120_000, 32, 'sha256').toString('hex');
  return `pbkdf2$${salt}$${digest}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, expected] = stored.split('$');
  if (algo !== 'pbkdf2' || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120_000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

export function registerUser(username: string, email: string, password: string, isAdmin = false): { ok: boolean; error?: string } {
  if (users.has(username)) return { ok: false, error: 'Username already exists.' };
  users.set(username, {
    username,
    email,
    passwordHash: hashPassword(password),
    characters: ['Cinderling'],
    isAdmin,
    banned: false
  });
  return { ok: true };
}

export function issueToken(username: string, password: string): string | null {
  const user = users.get(username);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  if (user.banned) return null;

  const token = `${username}-${crypto.randomUUID()}`;
  tokenToSession.set(token, {
    username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    revoked: false
  });
  return token;
}

export function revokeToken(token: string): { ok: boolean } {
  const session = tokenToSession.get(token);
  if (!session) return { ok: true };
  session.revoked = true;
  tokenToSession.set(token, session);
  return { ok: true };
}

export function validateToken(token: string): string | null {
  const session = tokenToSession.get(token);
  if (!session) return null;
  if (session.revoked) return null;
  if (Date.now() > session.expiresAt) return null;
  return session.username;
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

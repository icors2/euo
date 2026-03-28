const tokenToUser = new Map<string, string>();

export function issueToken(username: string): string {
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

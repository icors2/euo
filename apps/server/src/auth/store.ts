const tokenToUser = new Map<string, string>();

export function issueToken(username: string): string {
  const token = `${username}-${crypto.randomUUID()}`;
  tokenToUser.set(token, username);
  return token;
}

export function validateToken(token: string): string | null {
  return tokenToUser.get(token) ?? null;
}

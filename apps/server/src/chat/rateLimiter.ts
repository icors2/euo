const windows = new Map<string, number[]>();

export function chatAllowed(identity: string): boolean {
  const now = Date.now();
  const start = now - 10_000;
  const arr = (windows.get(identity) ?? []).filter((t) => t >= start);
  if (arr.length >= 8) {
    windows.set(identity, arr);
    return false;
  }
  arr.push(now);
  windows.set(identity, arr);
  return true;
}

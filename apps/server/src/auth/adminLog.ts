import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const logDir = path.join(process.cwd(), 'runtime-logs');
const logFile = path.join(logDir, 'admin-actions.jsonl');

export function recordAdminAction(admin: string, action: string, payload: unknown) {
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  appendFileSync(logFile, `${JSON.stringify({ at: new Date().toISOString(), admin, action, payload })}\n`);
}

export function readAdminActions() {
  if (!existsSync(logFile)) return [];
  return readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

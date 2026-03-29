import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getPrismaClient } from '../persistence/prisma';

const logDir = path.join(process.cwd(), 'runtime-logs');
const logFile = path.join(logDir, 'admin-actions.jsonl');

export async function recordAdminAction(admin: string, action: string, payload: unknown) {
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  appendFileSync(logFile, `${JSON.stringify({ at: new Date().toISOString(), admin, action, payload })}\n`);

  const prisma = await getPrismaClient();
  if (!prisma) return;

  try {
    await prisma.adminActionLog.create({
      data: {
        adminUserId: admin,
        actionType: action,
        details: payload as any
      }
    });
  } catch {
    // fall back silently to file-only log
  }
}

export async function readAdminActions() {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const rows = await prisma.adminActionLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
      return rows.map((r: any) => ({ at: r.createdAt.toISOString(), admin: r.adminUserId, action: r.actionType, payload: r.details }));
    } catch {
      // fall through to file log
    }
  }

  if (!existsSync(logFile)) return [];
  return readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

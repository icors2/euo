import { existsSync } from 'node:fs';
import path from 'node:path';
import { getPrismaClient } from './prisma';

export async function collectDiagnostics() {
  const manifestPath = path.join(process.cwd(), 'assets/manifests/asset-manifest.schema.json');
  const uiManifestPath = path.join(process.cwd(), 'assets/manifests/ui-manifest.json');

  let db = 'disabled';
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = 'connected';
    } catch {
      db = 'error';
    }
  }

  return {
    serverTime: new Date().toISOString(),
    database: db,
    manifests: {
      schema: existsSync(manifestPath),
      uiManifest: existsSync(uiManifestPath)
    }
  };
}

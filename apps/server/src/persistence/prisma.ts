let prisma: any = null;

export async function getPrismaClient(): Promise<any | null> {
  if (prisma !== null) return prisma;

  if (!process.env.DATABASE_URL) {
    prisma = null;
    return null;
  }

  try {
    const mod = await import('@prisma/client');
    prisma = new mod.PrismaClient();
    return prisma;
  } catch {
    prisma = null;
    return null;
  }
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AssetCategory, AssetManifest, AssetManifestEntry } from '@emberveil/shared';

const root = process.cwd();
const picsDir = path.join(root, 'assets/raw/imported/pics');
const cardsDir = path.join(picsDir, 'cards');
const soundDir = path.join(root, 'assets/raw/imported/sound');
const outFile = path.join(root, 'assets/manifests/asset-manifest.json');

function classify(file: string): AssetCategory {
  const lc = file.toLowerCase();
  if (lc.includes('btiles')) return 'tileset';
  if (lc.endsWith('.mp3')) return 'audio_music';
  if (lc.endsWith('.wav')) return 'audio_sfx';
  if (lc.includes('title') || lc.includes('bg') || lc.includes('skybox')) return 'background';
  if (lc.includes('overlay') || lc.includes('popup') || lc.includes('help') || lc.includes('book')) return 'ui';
  if (lc.includes('icon')) return 'icon';
  if (lc.includes('/cards/')) return 'portrait';
  return 'unknown';
}

async function walk(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return [full];
    }));
    return files.flat();
  } catch {
    return [];
  }
}

function toProcessed(entry: AssetManifestEntry): string {
  switch (entry.category) {
    case 'tileset': return `assets/processed/tiles/${entry.key}${entry.extension}`;
    case 'background': return `assets/processed/backgrounds/${entry.key}${entry.extension}`;
    case 'ui': return `assets/processed/ui/${entry.key}${entry.extension}`;
    case 'portrait': return `assets/processed/portraits/${entry.key}${entry.extension}`;
    case 'audio_music': return `assets/processed/audio/music/${entry.key}${entry.extension}`;
    case 'audio_sfx': return `assets/processed/audio/sfx/${entry.key}${entry.extension}`;
    case 'icon': return `assets/processed/ui/${entry.key}${entry.extension}`;
    default: return `assets/processed/ui/${entry.key}${entry.extension}`;
  }
}

async function main() {
  const files = [...await walk(picsDir), ...await walk(cardsDir), ...await walk(soundDir)]
    .filter((f) => !f.match(/\.(map|mm|dat)$/i));

  const entries: AssetManifestEntry[] = files.map((file) => {
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const ext = path.extname(file).toLowerCase();
    const key = path.basename(file, ext).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const category = classify(rel);
    return { key, category, sourcePath: rel, extension: ext, processedPath: '', tags: ['imported'] };
  }).map((entry) => ({ ...entry, processedPath: toProcessed(entry) }));

  const manifest: AssetManifest = { generatedAt: new Date().toISOString(), entries };
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${entries.length} asset entries to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

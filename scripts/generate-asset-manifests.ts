import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AssetManifest, AssetManifestEntry } from '@emberveil/shared';

const root = process.cwd();
const manifestPath = path.join(root, 'assets/manifests/asset-manifest.json');

function filter(entries: AssetManifestEntry[], category: AssetManifestEntry['category']) {
  return entries.filter((e) => e.category === category);
}

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw) as AssetManifest;

  const out = path.join(root, 'assets/manifests');
  await fs.writeFile(path.join(out, 'tilesets.json'), JSON.stringify({ tilesets: filter(manifest.entries, 'tileset') }, null, 2));
  await fs.writeFile(path.join(out, 'audio-manifest.json'), JSON.stringify({ music: filter(manifest.entries, 'audio_music'), sfx: filter(manifest.entries, 'audio_sfx') }, null, 2));
  await fs.writeFile(path.join(out, 'ui-manifest.json'), JSON.stringify({ ui: filter(manifest.entries, 'ui'), backgrounds: filter(manifest.entries, 'background'), icons: filter(manifest.entries, 'icon') }, null, 2));
  await fs.writeFile(path.join(out, 'portrait-manifest.json'), JSON.stringify({ portraits: filter(manifest.entries, 'portrait') }, null, 2));

  console.log('Generated split runtime manifests in assets/manifests');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

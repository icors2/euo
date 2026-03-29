import { existsSync, readFileSync } from 'node:fs';

const mustExist = [
  'assets/manifests/asset-manifest.schema.json',
  'README.md',
  'prisma/schema.prisma',
  'apps/server/src/index.ts',
  'apps/client-desktop/src/ui/App.tsx'
];

for (const file of mustExist) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

const readme = readFileSync('README.md', 'utf8');
for (const phase of ['Phase 8 delivered', 'Phase 9 delivered', 'Phase 10 delivered']) {
  if (!readme.includes(phase)) {
    console.error(`README missing milestone marker: ${phase}`);
    process.exit(1);
  }
}

console.log('ci-verify passed');

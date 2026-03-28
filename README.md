# Emberveil Online (Original RPG)

## Phase 1 delivered
- pnpm monorepo scaffold
- Tauri + React + Phaser desktop client bootstrap
- Fastify + Socket.IO authoritative server bootstrap
- Shared TypeScript package and content package
- Prisma schema covering MMO entities
- Asset inventory and manifest generation scripts
- Placeholder fallback strategy and schema
- First playable Tiled JSON town map (Hearthmere)
- Multiplayer movement + chat MVP
- Windows NSIS packaging config

## Run
1. `pnpm install`
2. `pnpm asset:inventory`
3. `pnpm asset:manifest`
4. `pnpm --filter @emberveil/server dev`
5. `pnpm --filter @emberveil/client-desktop dev`

## MVP roadmap
- Phase 2: map collisions, full character flow, map transitions
- Phase 3: inventory, equipment, quests, NPC dialogs
- Phase 4: monsters, combat, loot, trigger engine
- Phase 5: party tools, PvP arena, admin panel, packaging polish

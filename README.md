# Emberveil Online (Original RPG)

## Phase 1 delivered
- pnpm monorepo scaffold
- Tauri + React + Phaser desktop client bootstrap
- Fastify + Socket.IO authoritative server bootstrap
- Shared TypeScript package and content package
- Prisma schema covering MMO entities
- Asset inventory and manifest generation scripts
- Placeholder fallback strategy and schema
- Windows NSIS packaging config

## Phase 2 delivered
- first playable original map service (`Hearthmere`) served by API
- account registration + REST login + character listing/creation flow
- client character management screens wired to server API
- map-aware multiplayer scene with trigger overlays
- authoritative map bounds/collision checks and trigger reactions (portal/sanctuary)
- realtime multiplayer movement + chat retained

## Phase 3 delivered
- inventory and equipment API endpoints and client HUD panels
- quest log API + in-game quest panel
- NPC dialogue API + in-game dialogue panel
- item equip action from inventory to equipment slot
- title screen now attempts manifest-backed title art and falls back safely

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

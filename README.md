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

## Playable now
- Register an account (or login with seeded `devhero / devpass`)
- Admin login available via `gamemaster / adminpass`
- Create/select characters
- Enter Hearthmere and move around in shared realtime
- Open inventory/equipment/quest windows
- Equip starting items and read NPC dialogue
- Fight local monster spawns and gain loot
- Die and respawn at bind point
- Manage party membership and run optional duels
- Admin-spawn monsters, moderate users, and review admin audit logs
- Chat globally with slash commands and rate limits
- Logout to revoke session token
- Trigger sanctuary and portal regions

## Next recommended files to generate
- migrate auth/character/inventory stores from in-memory maps into Prisma repositories
- full PvP zone combat rules and arena leaderboard
- refresh token rotation and device/session management UI
- add end-to-end multiplayer integration tests (server + two simulated clients)

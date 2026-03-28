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

## Phase 4 delivered
- monster spawn/combat runtime with server-authoritative HP and retaliation
- loot rewards routed into inventory on monster defeat
- death and respawn flow via bind point
- bind trigger now updates respawn anchor in real time
- combat panel in client to attack monsters and respawn when defeated

## Phase 5 delivered
- party invites, membership tracking, and leave flow
- optional PvP duel endpoint gated to `redglass-pit`
- admin-only monster spawn endpoint requiring admin token
- in-client Party panel and Admin tools panel

## Phase 6 delivered
- expanded slash command coverage (`/help /who /msg /reply /partyinvite /partyleave /roll /bind /unstuck /trade /ignore`)
- server-side chat rate limiter (8 messages per 10s per sender)
- admin action audit log written to `runtime-logs/admin-actions.jsonl`
- admin log API endpoint and in-client admin log viewer

## Phase 7 delivered
- admin moderation endpoints: mute, ban/unban, sanctions listing
- muted users are prevented from chat until mute expires
- banned users are prevented from receiving login tokens
- admin panel includes quick moderation controls and sanctions preview

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
- Trigger sanctuary and portal regions

## Next recommended files to generate
- persistent PostgreSQL/Prisma adapters replacing in-memory stores
- full PvP zone combat rules and arena leaderboard
- account security hardening (password hashing upgrade, refresh token revocation)
- production hardening, automated tests, and installer polish

# Bot_Man Migration Plan: Ruby/Rails → TypeScript/Discord.js

## Overview

This document outlines the migration plan for converting the Bot_Man Discord bot from Ruby/Rails (using the `discordrb` gem) to TypeScript (using `discord.js`). The migration will maintain PostgreSQL as the database and implement equivalent functionality for all existing commands and event handling.

### Migration Progress

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Project Setup | ✅ Complete | 100% |
| Phase 2: Core Infrastructure | ✅ Complete | 100% |
| Phase 3: Command Migration | ✅ Complete | 100% |
| Phase 4: Event Handler Migration | ✅ Complete | 100% |
| Phase 5: Testing & Refinement | ✅ Complete | 100% |
| Phase 6: Deployment & Cutover | ⏳ Not Started | 0% |

### Current Bot Statistics (as of February 17, 2026)
- **Slash Commands:** 14 registered
- **Prefix Commands:** 20 registered
- **Event Handlers:** 10 active
- **Services:** 4 (ServerService, UserService, InviteService, ReactionService)
- **Active Guilds:** 5
- **Unit Tests:** 81 passing
- **Integration Tests:** 48 passing
- **Total Tests:** 129 passing

**Current Stack:**
- Ruby 2.7+ / Rails 6+
- discordrb gem
- PostgreSQL (with JSONB)
- Sidekiq (Redis-backed job queue)
- Devise (web authentication)

**Target Stack:**
- Node.js 22+ / TypeScript 5+
- discord.js v14
- PostgreSQL (unchanged)
- Prisma ORM (database layer)
- pg-boss (PostgreSQL-backed job queue - no Redis required!)

---

## Technology Decisions & Rationale

### 1. Discord Library: discord.js v14

**Why discord.js?**
- Most popular and actively maintained Discord library for Node.js
- Excellent TypeScript support with full type definitions
- Large community and extensive documentation
- Node.js 22.12.0+ required (as of v14.25.1)

**Replaces:** `discordrb` gem

### 2. Language: TypeScript

**Why TypeScript over plain JavaScript?**
- Type safety catches errors at compile time
- Better IDE support (IntelliSense, refactoring)
- Industry standard for modern Discord bots
- Easier maintenance and onboarding

### 3. ORM: Prisma

**Why Prisma?**
- Excellent developer experience with auto-generated, type-safe client
- Schema-first workflow similar to Rails migrations
- Introspection support - can generate schema from existing database
- Prisma Studio for visual database management
- Broad adoption and active maintenance

**Alternatives Considered:**
| ORM | Pros | Cons | Decision |
|-----|------|------|----------|
| **Prisma** | Best DX, type safety, introspection | Larger bundle, Rust engine | ✅ Selected |
| Drizzle | Lightweight, SQL-like syntax | Less mature ecosystem | Good alternative |
| TypeORM | Decorator-based, familiar to Rails devs | Performance issues, dated | ❌ |

**Replaces:** ActiveRecord

### 4. Background Jobs: pg-boss

**Why pg-boss over BullMQ?**
- Uses PostgreSQL as backend - **no Redis required!**
- Already using PostgreSQL, reduces infrastructure complexity
- Retry logic, dead letter queues built-in
- Similar API to Sidekiq conceptually

**Alternatives Considered:**
| Library | Backend | Pros | Cons | Decision |
|---------|---------|------|------|----------|
| **pg-boss** | PostgreSQL | No Redis, uses existing DB | Less battle-tested than Bull | ✅ Selected |
| BullMQ | Redis | Very mature, widely used | Requires Redis | Good if already using Redis |
| Agenda | MongoDB | Simple API | Wrong DB | ❌ |

**Replaces:** Sidekiq

### 5. Command Style: Slash Commands

**Why Slash Commands over Message Commands?**
- Discord's recommended approach since 2021
- Better discoverability (autocomplete in Discord UI)
- Built-in permissions and rate limiting
- No need to parse message content
- Will also support legacy `!` prefix commands for backward compatibility

---

## Database Migration Strategy

### Existing Schema (Rails)

The current PostgreSQL schema includes these tables:
- `discord_users` - Discord user information (PK: `uid`)
- `servers` - Discord server/guild information
- `events` - Raw Discord gateway events (STI with JSONB `data`)
- `invites` - Invite tracking
- `invite_discord_users` - Join table for invite usage
- `quotes` - Quote storage
- `reaction_roles` - Emoji-to-role mappings
- `temporary_voice_channels` - Temp voice channel tracking
- `users` - Web dashboard users (Devise)

### Migration Approach

**Option A: Fresh Start with Prisma Migrate** ❌
- Would lose existing data
- Clean schema but requires data migration

**Option B: Prisma Introspection** ✅ RECOMMENDED
1. Run `prisma db pull` to generate Prisma schema from existing database
2. Adjust generated schema for optimal TypeScript types
3. Generate Prisma Client
4. All existing data preserved

```bash
# Commands to run
npx prisma db pull          # Introspect existing DB
npx prisma generate         # Generate client
```

---

## Project Structure (Current)

```
bot_man/
├── src/
│   ├── index.ts                    # Entry point
│   ├── bot.ts                      # Discord client setup (BotClient class)
│   ├── worker.ts                   # pg-boss job processor
│   ├── deploy-commands.ts          # Slash command registration (guild/global)
│   │
│   ├── commands/                   # Slash + prefix commands
│   │   ├── index.ts                # Command loader (old/new format support)
│   │   ├── admin/
│   │   │   ├── dm.ts               # ✅ Owner-only DM user
│   │   │   ├── private.ts          # ✅ Send private message
│   │   │   └── shutdown.ts         # ✅ Owner-only bot shutdown
│   │   ├── moderation/
│   │   │   ├── clear.ts            # ✅ Bulk delete messages
│   │   │   ├── massmove.ts         # ✅ Voice channel mass move (autocomplete)
│   │   │   └── set.ts              # ✅ Server settings
│   │   ├── quotes/
│   │   │   └── quote.ts            # ✅ Quote CRUD (subcommands)
│   │   ├── roles/
│   │   │   └── reactionrole.ts     # ✅ Reaction roles (subcommands)
│   │   ├── utility/
│   │   │   ├── info.ts             # ✅ Bot info embed
│   │   │   ├── invite.ts           # ✅ Bot invite URL
│   │   │   ├── me.ts               # ✅ Display username
│   │   │   ├── ping.ts             # ✅ Latency check
│   │   │   └── random.ts           # ✅ Random number
│   │   └── voice/
│   │       └── jumpchannel.ts      # ✅ Temp voice channels (subcommands)
│   │
│   ├── events/                     # Discord event handlers
│   │   ├── index.ts                # Event loader
│   │   ├── ready.ts                # ✅ Bot startup, invite caching
│   │   ├── interactionCreate.ts    # ✅ Slash + autocomplete handler
│   │   ├── messageCreate.ts        # ✅ Legacy prefix commands
│   │   ├── guildCreate.ts          # ✅ Server/user sync on join
│   │   ├── guildMemberAdd.ts       # ✅ Invite tracking
│   │   ├── messageReactionAdd.ts   # ✅ Reaction roles + quote-via-reaction
│   │   ├── messageReactionRemove.ts # ✅ Reaction role removal
│   │   ├── voiceStateUpdate.ts     # ✅ Temp voice channels
│   │   ├── inviteCreate.ts         # ✅ Track new invites
│   │   └── inviteDelete.ts         # ✅ Track deleted invites
│   │
│   ├── jobs/                       # Background jobs (pg-boss)
│   │   ├── index.ts                # Job queue setup
│   │   └── eventLogger.ts          # Async event storage
│   │
│   ├── services/                   # Business logic
│   │   ├── index.ts                # Service exports
│   │   ├── serverService.ts        # Server sync operations
│   │   ├── userService.ts          # Discord user operations
│   │   ├── inviteService.ts        # Invite tracking
│   │   └── reactionService.ts      # Reaction role operations
│   │
│   ├── lib/                        # Utilities
│   │   ├── index.ts                # Lib exports
│   │   ├── config.ts               # Environment configuration (Proxy-based)
│   │   ├── database.ts             # Prisma client singleton
│   │   ├── logger.ts               # Winston logging
│   │   ├── permissions.ts          # Permission checks
│   │   └── levenshtein.ts          # Fuzzy matching for massmove
│   │
│   └── types/                      # TypeScript types
│       ├── index.ts                # Type exports
│       ├── command.ts              # SlashCommand, PrefixCommand (with autocomplete)
│       └── event.ts                # BotEvent type
│
├── prisma/
│   └── schema.prisma               # Database schema (introspected from Rails)
│
├── dist/                           # Compiled JavaScript output
│
├── .env                            # Environment variables
├── .env.example
├── package.json                    # discord.js v14.17.0, Prisma v6.3.0, pg-boss v10.1.5
├── tsconfig.json                   # TypeScript strict mode
├── eslint.config.js                # ESLint 9.x flat config
├── Dockerfile.node                 # Multi-stage Docker build
├── docker-compose.yml              # Local dev environment
└── Procfile.node                   # Heroku/Railway deployment
```

---

## Local Development with Docker Compose

Docker Compose provides a consistent local development environment with PostgreSQL and all services.

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: botman-postgres
    environment:
      POSTGRES_USER: botman
      POSTGRES_PASSWORD: botman_dev
      POSTGRES_DB: botman_development
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d  # Optional: init scripts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U botman -d botman_development"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Discord Bot
  bot:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: botman-bot
    command: npm run dev:bot
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://botman:botman_dev@postgres:5432/botman_development
      BOTMAN_BOT_TOKEN: ${BOTMAN_BOT_TOKEN}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      IS_DEV: "true"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # Background Job Worker
  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: botman-worker
    command: npm run dev:worker
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://botman:botman_dev@postgres:5432/botman_development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # Prisma Studio (Database GUI) - Optional
  prisma-studio:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: botman-prisma-studio
    command: npx prisma studio
    environment:
      DATABASE_URL: postgresql://botman:botman_dev@postgres:5432/botman_development
    ports:
      - "5555:5555"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    profiles:
      - tools  # Only starts with: docker compose --profile tools up

volumes:
  postgres_data:
```

### Dockerfile (Multi-stage)

```dockerfile
# Base stage
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### Local Development Commands

```bash
# Start all services (first time)
docker compose up -d

# Start with Prisma Studio
docker compose --profile tools up -d

# View logs
docker compose logs -f bot
docker compose logs -f worker

# Run database migrations
docker compose exec bot npx prisma migrate dev

# Generate Prisma client after schema changes
docker compose exec bot npx prisma generate

# Open Prisma Studio (if not using profile)
docker compose exec bot npx prisma studio

# Deploy slash commands
docker compose exec bot npm run deploy-commands

# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v

# Rebuild after Dockerfile changes
docker compose build --no-cache
```

### .env.example

```env
# Discord Bot Configuration
BOTMAN_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Database (for local development without Docker)
DATABASE_URL=postgresql://botman:botman_dev@localhost:5432/botman_development

# Environment
NODE_ENV=development
IS_DEV=true

# Development Settings (optional)
DEV_GUILD_ID=your_test_server_id_here
OWNER_ID=your_discord_user_id_here
LOG_LEVEL=debug

# Optional: Web Dashboard
FRONTEND_URL=http://localhost:3000
```

### Development Workflow

1. **Initial Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token and client ID
   docker compose up -d postgres
   docker compose run --rm bot npm install
   docker compose run --rm bot npx prisma generate
   docker compose run --rm bot npx prisma db push
   docker compose run --rm bot npm run deploy-commands:guild
   ```

2. **Daily Development:**
   ```bash
   docker compose up -d bot worker
   docker compose logs -f bot  # Watch bot logs
   ```

3. **After Schema Changes:**
   ```bash
   docker compose run --rm bot npx prisma migrate dev --name describe_change
   ```

4. **Testing Commands:**
   - Use a dedicated test Discord server
   - Deploy commands to test guild for instant updates:
     ```bash
     docker compose run --rm bot npm run deploy-commands:guild
     ```

---

## Command Migration Reference

| Ruby Command | Slash Command | Description | Priority | Status |
|--------------|---------------|-------------|----------|--------|
| `!ping` | `/ping` | Bot latency check | 🟢 High | ✅ Done |
| `!addquote` / `!aq` | `/quote add` | Add a quote | 🟢 High | ✅ Done |
| `!quote` / `!q` | `/quote get` | Get random/specific quote | 🟢 High | ✅ Done |
| `!removequote` | `/quote remove` | Remove a quote | 🟢 High | ✅ Done |
| `!allquotes` | `/quote list` | List all quotes | 🟡 Medium | ✅ Done |
| `!addreactionrole` | `/reactionrole add` | Add reaction role | 🟢 High | ✅ Done |
| `!removereactionrole` | `/reactionrole remove` | Remove reaction role | 🟢 High | ✅ Done |
| `!removeallreactionroles` | `/reactionrole clear` | Clear all reaction roles | 🟡 Medium | ✅ Done |
| `!clear` | `/clear` | Bulk delete messages | 🟢 High | ✅ Done |
| `!massmove` / `!mm` | `/massmove` | Move users between voice channels | 🟡 Medium | ✅ Done |
| `!random` | `/random` | Generate random number | 🟢 High | ✅ Done |
| `!set` | `/set` | Update server settings | 🟡 Medium | ✅ Done |
| `!createjumpchannel` | `/jumpchannel create` | Create temp voice trigger | 🟡 Medium | ✅ Done |
| `!deletejumpchannel` | `/jumpchannel delete` | Delete temp voice trigger | 🟡 Medium | ✅ Done |
| `!me` | `/me` | Show username | 🟢 High | ✅ Done |
| `!invite` | `/invite` | Bot invite URL | 🟢 High | ✅ Done |
| `!dm` | `/dm` | Send DM to user | 🔴 Low | ✅ Done |
| `!shutdown` | `/shutdown` | Shutdown bot (owner only) | 🔴 Low | ✅ Done |
| `!test` | (remove) | Debug command | ❌ Remove | N/A |
| 📖 Reaction Quote | (keep) | Quote via emoji reaction | 🟢 High | ✅ Done |
| (new) | `/info` | Bot statistics and info | 🟢 High | ✅ Done |
| (new) | `/private` | Send private message | 🔴 Low | ✅ Done |

---

## Event Migration Reference

| Ruby Event | discord.js Event | Handler Purpose | Status |
|------------|------------------|-----------------|--------|
| `raw` | `raw` | Store all events to DB via pg-boss | ⏸️ Deferred |
| `ready` | `ready` | Bot startup, invite cache | ✅ Done |
| `server_create` | `guildCreate` | Sync server info | ✅ Done |
| `member_join` | `guildMemberAdd` | Invite tracking | ✅ Done |
| `reaction_add` | `messageReactionAdd` | Reaction roles + quote via reaction | ✅ Done |
| `reaction_remove` | `messageReactionRemove` | Reaction role removal | ✅ Done |
| `voice_state_update` | `voiceStateUpdate` | Temp voice channel management | ✅ Done |
| `invite_create` | `inviteCreate` | Track new invites | ✅ Done |
| `invite_delete` | `inviteDelete` | Track deleted invites | ✅ Done |
| `message` | `messageCreate` | Legacy prefix commands | ✅ Done |
| N/A | `interactionCreate` | Slash command handler | ✅ Done |

---

## Environment Variables

```env
# Discord
BOTMAN_BOT_TOKEN=           # Discord bot token
DISCORD_CLIENT_ID=          # Application client ID
DISCORD_CLIENT_SECRET=      # OAuth client secret (for web dashboard)

# Database
DATABASE_URL=               # PostgreSQL connection string

# Application
NODE_ENV=development        # development | production
IS_DEV=true                 # Enable dev features (invite URL logging)

# Optional: Web Dashboard
FRONTEND_URL=               # Frontend app URL for CORS
```

---

## Migration Phases

### Phase 1: Project Setup (Week 1) ✅ COMPLETED
- [x] Initialize Node.js/TypeScript project
- [x] Configure ESLint, Prettier
- [x] Set up Prisma with database schema
- [x] Create basic discord.js client
- [x] Set up pg-boss for background jobs
- [x] Create project structure
- [x] Configure Docker/Procfile

**Completed February 17, 2026**

**Files Created:**
- `package.json` - Dependencies (discord.js v14.17.0, Prisma v6.3.0, pg-boss v10.1.5, winston v3.17.0)
- `tsconfig.json` - TypeScript strict mode configuration
- `eslint.config.js` - ESLint 9.x flat config with TypeScript support
- `.prettierrc` / `.prettierignore` - Code formatting
- `prisma/schema.prisma` - Database schema matching existing Rails models
- `Dockerfile.node` - Multi-stage build (development/production)
- `docker-compose.yml` - Local dev with PostgreSQL, bot, worker, Prisma Studio
- `Procfile.node` - Heroku/Railway deployment config
- `.env.example` - Environment variable template

**Source Structure Created:**
```
src/
├── index.ts                 # Entry point
├── bot.ts                   # BotClient class with Collections
├── worker.ts                # pg-boss job processor
├── deploy-commands.ts       # Slash command registration
├── commands/
│   ├── index.ts             # Command loader (supports old/new formats)
│   ├── admin/
│   │   ├── dm.ts            # ✅ Owner-only DM user
│   │   ├── private.ts       # ✅ Send private message
│   │   └── shutdown.ts      # ✅ Owner-only bot shutdown
│   ├── moderation/
│   │   ├── clear.ts         # ✅ Bulk delete messages (2-100)
│   │   ├── massmove.ts      # ✅ Move users between voice channels (with autocomplete)
│   │   └── set.ts           # ✅ Server settings (region info)
│   ├── quotes/
│   │   └── quote.ts         # ✅ Quote CRUD (add/get/remove/list subcommands)
│   ├── roles/
│   │   └── reactionrole.ts  # ✅ Reaction roles (add/remove/clear subcommands)
│   ├── utility/
│   │   ├── info.ts          # ✅ Bot information embed
│   │   ├── invite.ts        # ✅ Bot invite URL
│   │   ├── me.ts            # ✅ Display username
│   │   ├── ping.ts          # ✅ Bot latency check
│   │   └── random.ts        # ✅ Random number generator
│   └── voice/
│       └── jumpchannel.ts   # ✅ Temp voice channels (create/delete/list)
├── events/
│   ├── index.ts             # Event loader
│   ├── ready.ts             # ✅ With invite caching
│   ├── interactionCreate.ts # ✅ Slash command + autocomplete handler
│   └── messageCreate.ts     # ✅ Legacy prefix handler
├── jobs/
│   ├── index.ts             # pg-boss queue setup
│   └── eventLogger.ts       # Async event storage
├── services/
│   ├── index.ts
│   ├── serverService.ts     # Server sync operations
│   ├── userService.ts       # Discord user operations
│   ├── inviteService.ts     # Invite tracking
│   └── reactionService.ts   # Reaction role operations
├── lib/
│   ├── index.ts
│   ├── config.ts            # Environment configuration
│   ├── database.ts          # Prisma client singleton
│   ├── logger.ts            # Winston logger
│   ├── permissions.ts       # Permission checks
│   └── levenshtein.ts       # Fuzzy matching for massmove
└── types/
    ├── index.ts
    ├── command.ts           # SlashCommand, PrefixCommand types
    └── event.ts             # BotEvent type
```

### Phase 2: Core Infrastructure (Week 1-2)
- [x] Implement command handler (slash + legacy prefix)
- [x] Implement event handler
- [x] Set up raw event logging via pg-boss
- [x] Implement database service layer
- [x] Create utility functions (permissions, logging)

### Phase 3: Command Migration (Week 2-3) ✅ COMPLETED
- [x] Migrate `/ping` command
- [x] Migrate `/quote` commands (add, get, remove, list)
- [x] Migrate `/reactionrole` commands
- [x] Migrate `/clear` command
- [x] Migrate `/massmove` command
- [x] Migrate `/random` command
- [x] Migrate `/set` command
- [x] Migrate `/jumpchannel` commands
- [x] Migrate utility commands (me, invite)
- [x] Migrate admin commands (shutdown, dm, private)

**Completed February 17, 2026**

**Command Summary:**
| Category | Slash Commands | Prefix Commands | Notes |
|----------|----------------|-----------------|-------|
| Utility | `/ping`, `/random`, `/info`, `/me`, `/invite` | `!ping`, `!random`, `!info`, `!me`, `!invite` | Aliases: `!rand`, `!roll`, `!botinfo`, `!stats` |
| Quotes | `/quote` (add/get/remove/list) | `!quote`, `!addquote`, `!removequote`, `!allquotes` | Aliases: `!q`, `!aq`, `!quotes` |
| Moderation | `/clear`, `/massmove`, `/set` | `!clear`, `!massmove`, `!set` | Aliases: `!mm`; `/massmove` has autocomplete |
| Roles | `/reactionrole` (add/remove/clear) | `!addreactionrole`, `!removereactionrole`, `!removeallreactionroles` | Aliases: `!arr`, `!rrr`, `!rarr` |
| Voice | `/jumpchannel` (create/delete/list) | `!createjumpchannel`, `!deletejumpchannel` | Temp voice channel management |
| Admin | `/shutdown`, `/dm`, `/private` | `!shutdown`, `!dm`, `!pm` | Owner-only; Aliases: `!exit`, `!private` |

**Totals: 14 slash commands, 20 prefix commands deployed**

**Key Implementation Details:**
- Command loader supports both old (`export default { slash, prefix }`) and new (`export const slashCommand`) formats
- Autocomplete support added for `/massmove` using Levenshtein distance for fuzzy channel matching
- All commands support both slash and legacy `!` prefix for backward compatibility
- Commands use Prisma for database operations (quotes, reaction_roles, temporary_voice_channels)

### Phase 4: Event Handler Migration (Week 3-4) ✅ COMPLETED
- [x] Implement ready event (with invite caching)
- [x] Implement guildCreate (server sync)
- [x] Implement guildMemberAdd (invite tracking)
- [x] Implement messageReactionAdd/Remove (reaction roles)
- [x] Implement voiceStateUpdate (temp voice channels)
- [x] Implement invite create/delete tracking
- [x] Implement quote-via-reaction feature

**Completed February 17, 2026**

**Event Handlers Created:**
| Event | File | Purpose |
|-------|------|-------|
| `ready` | ready.ts | Bot startup, invite caching for all guilds |
| `interactionCreate` | interactionCreate.ts | Slash command & autocomplete handling |
| `messageCreate` | messageCreate.ts | Legacy prefix command support |
| `guildCreate` | guildCreate.ts | Server sync, user sync, invite caching on join |
| `guildMemberAdd` | guildMemberAdd.ts | Invite tracking (determines which invite was used) |
| `messageReactionAdd` | messageReactionAdd.ts | Reaction roles + quote-via-reaction (📖) |
| `messageReactionRemove` | messageReactionRemove.ts | Reaction role removal |
| `voiceStateUpdate` | voiceStateUpdate.ts | Temp voice channel create/delete |
| `inviteCreate` | inviteCreate.ts | Cache & save new invites |
| `inviteDelete` | inviteDelete.ts | Mark invites inactive, audit log lookup |

**Totals: 10 event handlers registered**

**Key Features:**
- Invite tracking compares cached invites with current to determine which was used
- Quote-via-reaction allows users to react with 📖 to automatically quote a message
- Temp voice channels auto-delete when empty
- Reaction roles support both custom and Unicode emojis

### Phase 5: Testing & Refinement (Week 4) ✅ COMPLETE
- [x] Set up vitest testing framework
- [x] Write unit tests for services (ServerService, UserService, InviteService, ReactionService)
- [x] Write unit tests for utility functions (levenshtein, config, permissions)
- [x] Error handling review (verified try/catch blocks across commands and events)
- [x] Write integration tests for commands
- [x] Manual testing checklist created
- [x] Performance testing documentation
- [x] Logging review

**Completed February 17, 2026**

**Testing Infrastructure:**
- `vitest.config.ts` - Vitest configuration with coverage support
- `src/test/setup.ts` - Global test setup with mocked logger
- `src/test/mocks/prisma.ts` - Mock Prisma client and data factories
- `src/test/mocks/discord.ts` - Mock Discord.js structures

**Unit Test Files:**
| File | Tests | Coverage |
|------|-------|----------|
| `serverService.test.ts` | 8 | ServerService CRUD |
| `userService.test.ts` | 9 | UserService CRUD |
| `inviteService.test.ts` | 13 | InviteService operations |
| `reactionService.test.ts` | 12 | ReactionService CRUD |
| `levenshtein.test.ts` | 20 | Fuzzy matching algorithms |
| `config.test.ts` | 7 | Environment configuration |
| `permissions.test.ts` | 12 | Permission checks |

**Integration Test Files:**
| File | Tests | Coverage |
|------|-------|----------|
| `admin.integration.test.ts` | 13 | Admin commands (dm, private, shutdown) |
| `moderation.integration.test.ts` | 6 | Moderation commands (clear) |
| `quote.integration.test.ts` | 7 | Quote CRUD operations |
| `roles.integration.test.ts` | 8 | Reaction role commands |
| `utility.integration.test.ts` | 7 | Utility commands (ping, random, etc.) |
| `voice.integration.test.ts` | 7 | Voice/Jump channel commands |

**Totals: 129 tests passing**

**Documentation Created:**
- `docs/MANUAL_TESTING_CHECKLIST.md` - Comprehensive manual testing guide
- `docs/LOGGING_AND_PERFORMANCE.md` - Logging patterns and performance guidelines

**npm Scripts:**
```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Phase 6: Deployment & Cutover (Week 5)
- [ ] Set up production environment
- [ ] Deploy to staging
- [ ] Final testing in staging
- [ ] Document deployment process
- [ ] Cutover plan
- [ ] Monitor post-deployment

---

## Library Reference

### Core Dependencies

```json
{
  "dependencies": {
    "discord.js": "^14.25.1",
    "@prisma/client": "^6.x",
    "pg-boss": "^10.x",
    "dotenv": "^16.x",
    "winston": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^6.x",
    "@types/node": "^22.x",
    "tsx": "^4.x",
    "eslint": "^9.x",
    "prettier": "^3.x",
    "vitest": "^2.x"
  }
}
```

### Library Mapping: Ruby → TypeScript

| Ruby/Rails | TypeScript/Node | Purpose |
|------------|-----------------|---------|
| discordrb | discord.js | Discord API client |
| ActiveRecord | Prisma | ORM / Database |
| Sidekiq | pg-boss | Background jobs |
| Rails environment | dotenv | Environment config |
| Rails logger | winston | Logging |
| RSpec | vitest | Testing |
| Puma | Built-in | HTTP server (if needed) |
| Devise | (separate) | Web auth (future) |

---

## Key Implementation Notes

### 1. Slash Command Registration

Discord requires slash commands to be registered before use:

```typescript
// deploy-commands.ts
import { REST, Routes } from 'discord.js';

const commands = [/* command data */];
const rest = new REST().setToken(process.env.BOTMAN_BOT_TOKEN!);

// Register globally (takes up to 1 hour to propagate)
await rest.put(Routes.applicationCommands(clientId), { body: commands });

// OR register per-guild (instant, good for development)
await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
```

### 2. Maintaining Legacy Prefix Commands

For backward compatibility during migration:

```typescript
// events/messageCreate.ts
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  // Map to equivalent slash command handler
  // This allows gradual migration
});
```

### 3. Raw Event Logging with pg-boss

```typescript
// events/raw.ts
import PgBoss from 'pg-boss';

const boss = new PgBoss(process.env.DATABASE_URL!);

client.on('raw', async (packet) => {
  await boss.send('event-log', {
    type: `Events::${pascalCase(packet.t)}Event`,
    data: packet.d,
  });
});

// worker.ts
boss.work('event-log', async ([job]) => {
  await prisma.event.create({
    data: {
      type: job.data.type,
      data: job.data.data,
    },
  });
});
```

### 4. Invite Tracking Pattern

```typescript
// Maintain invite cache per guild
const inviteCache = new Map<string, Map<string, number>>();

client.on('ready', async () => {
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses ?? 0])));
  }
});

client.on('guildMemberAdd', async (member) => {
  const cachedInvites = inviteCache.get(member.guild.id);
  const newInvites = await member.guild.invites.fetch();

  // Find which invite was used by comparing uses
  const usedInvite = newInvites.find(i =>
    (cachedInvites?.get(i.code) ?? 0) < (i.uses ?? 0)
  );

  // Update cache and record in database
});
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Use Prisma introspection (no schema changes) |
| Command registration delays | Medium | Use guild-specific registration during dev |
| Missing functionality | Medium | Comprehensive testing checklist |
| pg-boss reliability | Medium | Monitor job queue, implement dead letter handling |
| Discord.js breaking changes | Low | Pin versions, review changelogs |

---

## Post-Migration Cleanup

After successful migration and verification:

1. **Remove Ruby/Rails files:**
   - `Gemfile`, `Gemfile.lock`
   - `app/`, `lib/bot/`, `config/` (Rails-specific)
   - `bin/` (Rails scripts)
   - `Rakefile`, `config.ru`

2. **Update CI/CD:**
   - Change from Ruby to Node.js
   - Update Docker images
   - Update Procfile (already planned)

3. **Documentation:**
   - Update README.md
   - Document new command syntax
   - Document deployment process

---

## New Procfile

```procfile
web: npm run start:web
bot: npm run start:bot
worker: npm run start:worker
release: npx prisma migrate deploy
```

---

## Future Enhancements & Production Deployment

> **Note:** Since you already have PostgreSQL on AWS RDS, the comparison below focuses on **compute-only costs** for running the bot and worker processes.

### Detailed Hosting Comparison (Compute Only - Using Existing RDS)

#### 1. Heroku (Current)

| Tier | Cost | Features | Discord Bot Suitability |
|------|------|----------|-------------------------|
| **Eco Dynos** | $5/mo for 1,000 hours shared | Sleeps after 30min inactivity | ❌ **Not suitable** - bot needs 24/7 |
| **Basic Dynos** | $7/mo per dyno | Always-on, no sleep | ✅ Works well |
| **Standard 1x** | $25/mo per dyno | 512MB RAM, horizontal scaling | ✅ Production-ready |

**For Bot + Worker:** 2x Basic Dynos = **$14/mo**

**Pros:** Familiar, easy GitHub deploys, good logging
**Cons:** No free tier anymore, can get expensive with add-ons

---

#### 2. Vercel

| Tier | Cost | Limitations |
|------|------|-------------|
| Hobby | Free | 10s function timeout, no always-on |
| Pro | $20/user/mo | 60s timeout, still serverless |

**⚠️ NOT RECOMMENDED for Discord bots**
- Vercel is serverless-only — functions spin up per request and timeout
- Discord bots need a persistent WebSocket connection (always-on process)
- No way to run a long-lived Node.js process on Vercel
- Would need to architect a separate solution anyway

---

#### 3. Railway

| Tier | Base Cost | Included Usage | Overage |
|------|-----------|----------------|---------|
| **Trial** | Free (one-time) | $5 credit | N/A |
| **Hobby** | $5/mo | $5/mo usage included | Pay per use |
| **Pro** | $20/mo | $10/mo usage included | Pay per use |

**Compute Pricing (usage-based):**
- vCPU: ~$0.000463/min ($0.028/hr)
- Memory: ~$0.000231/GB/min

**For Bot + Worker (minimal resources, 24/7):**
- 0.5 vCPU + 512MB each ≈ **$5-10/mo total** (often within Hobby included usage!)

**Pros:**
- Best DX of any platform
- GitHub auto-deploy
- Great logs/monitoring UI
- Multiple services in one project
- Usage-based = pay only for what you use

**Cons:**
- No true free tier (trial expires)
- Slightly unpredictable costs

---

#### 4. Fly.io ⭐ **BEST FREE OPTION**

| Resource | Free Allowance | Paid Rate |
|----------|----------------|-----------|
| **VMs** | 3 shared-cpu-1x (256MB) | $0.0027/hr (~$1.94/mo) |
| **Storage** | 3GB volumes | $0.15/GB/mo |
| **Bandwidth** | 160GB outbound | $0.02/GB (NA/EU) |

**For Bot + Worker (both free tier eligible):**
- 2x shared-cpu-1x VMs = **$0/mo** ✅
- Each VM: 256MB RAM, shared vCPU
- More than enough for a Discord bot

**Pros:**
- **Actually free** for small workloads
- Global edge deployment
- Good performance
- CLI-based (you'll like this)

**Cons:**
- CLI required (no web UI for deploys)
- 256MB RAM limit per VM on free tier
- Free tier could change (they've adjusted it before)

---

#### 5. AWS Options

Since you already have RDS and AWS experience, here are the compute options:

##### Option A: EC2 t4g.small (FREE until Dec 31, 2026!)

| Resource | Cost |
|----------|------|
| t4g.small (2 vCPU, 2GB RAM) | **FREE** (750 hrs/mo until end of 2026) |
| Public IPv4 address | ~$3.75/mo |
| 25GB EBS (gp3) | ~$2.40/mo |
| **Total** | **~$6.15/mo** (just for IP + storage!) |

**After free tier (Jan 2027):** ~$12.26/mo for instance + $6.15 = ~$18/mo

##### Option B: EC2 t4g.nano (Cheapest always-on)

| Resource | Cost |
|----------|------|
| t4g.nano (2 vCPU, 0.5GB RAM) | ~$3.07/mo |
| Public IPv4 | ~$3.75/mo |
| 20GB EBS | ~$2.00/mo |
| **Total** | **~$8.82/mo** |

##### Option C: ECS Fargate (Serverless containers)

| Config | Monthly Cost |
|--------|--------------|
| 0.25 vCPU + 0.5GB (bot) | ~$9/mo |
| 0.25 vCPU + 0.5GB (worker) | ~$9/mo |
| **Total** | **~$18/mo** |

With **Fargate Spot** (up to 70% off): **~$6-8/mo** but can be interrupted

##### Option D: AWS App Runner

| Resource | Cost |
|----------|------|
| 0.25 vCPU + 0.5GB, always-on | ~$5/mo per service |
| **Bot + Worker** | **~$10/mo** |

**Pros:** Simple, managed, auto-scaling
**Cons:** Less control than ECS

---

### Summary Comparison (Compute Only)

| Platform | Monthly Cost | Free Tier? | Ease of Use | Best For |
|----------|--------------|------------|-------------|----------|
| **Fly.io** | **$0** | ✅ Yes (3 VMs) | Medium (CLI) | 💰 **Cheapest** |
| **AWS t4g.small** | **~$6** | ✅ Until Dec 2026 | Medium | 🏆 **Best value in 2026** |
| **AWS t4g.nano** | **~$9** | ❌ | Medium | After t4g.small free ends |
| **Railway Hobby** | **$5-10** | ❌ ($5 trial) | ⭐ Easiest | Best DX |
| **Heroku Basic** | **$14** | ❌ | Easy | Familiar |
| **AWS Fargate Spot** | **~$6-8** | ❌ | Complex | Scalability |
| **AWS Fargate** | **~$18** | ❌ | Complex | Production/Enterprise |
| **Vercel** | N/A | N/A | N/A | ❌ Not suitable |

---

### 🏆 Recommendations

#### If You Want FREE (Best for 2026):
**Fly.io** — Run bot + worker on free tier VMs. CLI-based but works great.

#### If You Want FREE + AWS Integration:
**AWS EC2 t4g.small** — Free until Dec 2026, same VPC as your RDS = no data transfer costs, easy connectivity. Just ~$6/mo for IP + storage.

#### If You Want Easy + Cheap:
**Railway Hobby** — $5/mo includes usage, best developer experience, auto-deploys from GitHub.

#### If You Want Production-Grade AWS:
**AWS Fargate Spot** or **App Runner** — ~$6-10/mo, managed, scales automatically.

---

### Recommended Setup: AWS EC2 + Existing RDS

Since you already have RDS, the cleanest setup is:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS Production Setup                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │         EC2 t4g.small (or t4g.nano)         │                │
│  │  ┌─────────────┐    ┌─────────────┐         │                │
│  │  │ Bot Process │    │   Worker    │         │                │
│  │  │ (discord.js)│    │  (pg-boss)  │         │                │
│  │  └──────┬──────┘    └──────┬──────┘         │                │
│  └─────────┼──────────────────┼────────────────┘                │
│            │                  │                                  │
│            │    Private Subnet (no data transfer $)              │
│            │                  │                                  │
│            └────────┬─────────┘                                  │
│                     │                                            │
│            ┌────────▼────────┐                                   │
│            │  RDS PostgreSQL │  (existing)                       │
│            │    (Private)    │                                   │
│            └─────────────────┘                                   │
│                                                                  │
│  Monthly Cost: ~$6 (t4g.small free) or ~$9 (t4g.nano)           │
│  After Dec 2026: ~$18 (t4g.small) or ~$9 (t4g.nano)             │
└─────────────────────────────────────────────────────────────────┘
```

**Setup with PM2 (process manager):**
```bash
# On EC2 instance
npm install -g pm2

# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bot',
      script: 'dist/index.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'worker',
      script: 'dist/worker.js',
      env: { NODE_ENV: 'production' }
    }
  ]
};

# Start both processes
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on reboot
```

---

### Alternative: Fly.io Setup (Free)

**fly.toml:**
```toml
app = "botman"
primary_region = "iad"  # US East, close to your RDS

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

# Bot service (no HTTP needed, just runs)
[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

**Separate worker (optional):**
```bash
fly launch --name botman-worker
# Use same fly.toml structure
```

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Environment                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Bot        │    │   Worker     │    │   Web API    │       │
│  │   Service    │    │   Service    │    │   (optional) │       │
│  │              │    │              │    │              │       │
│  │  discord.js  │    │   pg-boss    │    │   Express    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   PostgreSQL    │                          │
│                    │   (Managed)     │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Production Checklist

- [ ] **Database:**
  - [ ] Use managed PostgreSQL (Railway, Render, Supabase, Neon)
  - [ ] Enable connection pooling
  - [ ] Set up automated backups
  - [ ] Configure SSL connections

- [ ] **Bot Service:**
  - [ ] Set `NODE_ENV=production`
  - [ ] Configure proper logging (structured JSON)
  - [ ] Set up health checks
  - [ ] Configure restart policies

- [ ] **Monitoring:**
  - [ ] Set up error tracking (Sentry)
  - [ ] Configure uptime monitoring (UptimeRobot, Better Uptime)
  - [ ] Set up Discord webhook for alerts
  - [ ] Monitor database performance

- [ ] **Security:**
  - [ ] Store secrets in environment variables
  - [ ] Rotate bot token if compromised
  - [ ] Enable 2FA on Discord developer account
  - [ ] Restrict database access by IP

### Future Feature Ideas

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Dashboard Migration** | Migrate Rails web dashboard to Next.js/React | High |
| **Slash Command Autocomplete** | Add autocomplete for quote search, channel names | Medium |
| **Scheduled Messages** | Schedule announcements/reminders | Medium |
| **Audit Logging** | Log all bot actions to a channel | Low |
| **Multi-language Support** | i18n for command responses | Medium |
| **Premium Features** | Patreon integration for advanced features | High |
| **Analytics Dashboard** | Server stats, command usage metrics | Medium |
| **Custom Commands** | Per-server custom command creation | High |
| **Music Playback** | Voice channel music (requires additional libs) | High |
| **Leveling System** | XP and levels for server members | Medium |

### Cost Estimation (Monthly) — Compute Only (Using Existing RDS)

| Platform | Bot + Worker | Notes |
|----------|--------------|-------|
| **Fly.io** | **$0** | Free tier (3 VMs) |
| **AWS t4g.small** | **~$6** | Free instance until Dec 2026, pay only IP+storage |
| **AWS t4g.nano** | **~$9** | Smallest always-on option |
| **Railway Hobby** | **$5-10** | Usage-based, often within $5 included |
| **Heroku Basic** | **$14** | 2x $7 dynos |
| **AWS Fargate** | **~$18** | 2x minimal tasks |
| **Vercel** | **N/A** | ❌ Not suitable for Discord bots |

*Your existing RDS costs are separate and unchanged.*

---

## Questions to Address Before Starting

1. **Web Dashboard:** Will the Rails web dashboard also be migrated, or remain as a separate Ruby app?
  - No, it will remain separate for now.
2. **OAuth:** Is Discord OAuth login still needed for the web dashboard?
  - Yes, keep it as is.
3. **Hosting:** Where is this currently deployed? (Heroku, Railway, VPS?)
  - Currently on Heroku; plan to possibly move elsewhere.
4. **Timeline:** What's the target completion date?
  - With Copilot's help, aiming for ASAP.
5. **Testing Server:** Is there a development Discord server for testing?
  - Yes, a dedicated test server is available.

---

## Approval Checklist

- [x] Technology stack approved (discord.js, Prisma, pg-boss)
- [x] Project structure approved
- [x] Command mapping approved
- [x] Migration phases approved
- [x] Timeline agreed upon

---

*Document created: February 16, 2026*
*Last updated: February 17, 2026*

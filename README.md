# Bot_Man

A Discord bot built with TypeScript and discord.js v14.

[![CI](https://github.com/GreaterGamersLounge/bot_man/actions/workflows/ci.yml/badge.svg)](https://github.com/GreaterGamersLounge/bot_man/actions/workflows/ci.yml)

---

## Features

- **Slash Commands**: Modern Discord slash command support
- **Quote System**: Add, remove, and retrieve quotes (including quote-via-reaction with 📖)
- **Reaction Roles**: Assign roles based on message reactions
- **Invite Tracking**: Track which invite was used when members join
- **Temporary Voice Channels**: Auto-create/delete voice channels
- **Moderation**: Mass move, clear messages, server settings

## Tech Stack

- **Runtime**: Node.js 22+ / TypeScript
- **Discord**: discord.js v14
- **Database**: PostgreSQL with Prisma ORM
- **Background Jobs**: pg-boss
- **Testing**: Vitest

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Setup

1. Clone the repository and copy environment file:
   ```bash
   git clone https://github.com/GreaterGamersLounge/bot_man.git
   cd bot_man
   cp .env.example .env
   ```

2. Edit `.env` with your Discord credentials:
   ```env
   BOTMAN_BOT_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   ```

3. Start services:
   ```bash
   docker compose up -d
   ```

4. Deploy slash commands (first time only):
   ```bash
   docker compose exec bot npm run deploy-commands
   ```

### Development Commands

```bash
# View bot logs
docker compose logs -f bot

# Run tests
docker compose run --rm bot npm run test:run

# Run linting
docker compose run --rm bot npm run lint

# Database migrations
docker compose exec bot npx prisma migrate dev

# Open Prisma Studio (database GUI)
docker compose --profile tools up -d
# Then visit http://localhost:5555
```

---

## Project Structure

```
src/
├── commands/       # Slash & prefix commands
├── events/         # Discord event handlers
├── services/       # Business logic
├── lib/            # Utilities (config, database, logger)
├── jobs/           # Background jobs (pg-boss)
└── types/          # TypeScript types

prisma/
└── schema.prisma   # Database schema
```

---

## Adding the Bot

To add the bot to your server:

[Add Bot_Man to your server](https://discord.com/oauth2/authorize?client_id=662139319305371669&scope=bot%20applications.commands&permissions=8)

---

## License

[MIT](LICENSE)

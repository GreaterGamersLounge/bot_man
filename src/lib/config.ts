import type { BotConfig } from '../types/index.js';

/**
 * Load and validate environment configuration
 */
export function loadConfig(): BotConfig {
  const botToken = process.env.BOTMAN_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const databaseUrl = process.env.DATABASE_URL;

  // Validate required environment variables
  if (!botToken) {
    throw new Error('BOTMAN_BOT_TOKEN environment variable is required');
  }

  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID environment variable is required');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const nodeEnv = (process.env.NODE_ENV ?? 'development') as BotConfig['nodeEnv'];

  return {
    botToken,
    clientId,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    databaseUrl,
    nodeEnv,
    isDev: process.env.IS_DEV === 'true' || nodeEnv === 'development',
    devGuildId: process.env.DEV_GUILD_ID,
    ownerId: process.env.OWNER_ID,
  };
}

/**
 * Get the bot configuration (lazy loaded singleton)
 */
let config: BotConfig | null = null;

export function getConfig(): BotConfig {
  if (!config) {
    config = loadConfig();
  }
  return config;
}

export default getConfig;

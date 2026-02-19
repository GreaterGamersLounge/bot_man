// Type definitions for Bot_Man Discord bot

export * from './command.js';
export * from './event.js';

/**
 * Environment configuration
 */
export interface BotConfig {
  /** Discord bot token */
  botToken: string;
  /** Discord application client ID */
  clientId: string;
  /** Discord OAuth client secret (for web dashboard) */
  clientSecret?: string;
  /** PostgreSQL database URL */
  databaseUrl: string;
  /** Current environment */
  nodeEnv: 'development' | 'production' | 'test';
  /** Whether development features are enabled */
  isDev: boolean;
  /** Guild ID for development command deployment */
  devGuildId?: string;
  /** Bot owner's Discord user ID */
  ownerId?: string;
}

/**
 * Invite cache entry for tracking invite usage
 */
export interface InviteCacheEntry {
  code: string;
  uses: number;
  inviterId: string | null;
  maxUses: number | null;
  expiresAt: Date | null;
}

/**
 * Job data for the event logger worker
 */
export interface EventLogJobData {
  type: string;
  data: unknown;
  timestamp: Date;
}

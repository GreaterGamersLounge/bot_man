import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './commands/index.js';
import { loadEvents } from './events/index.js';
import { logger } from './lib/logger.js';
import type { InviteCacheEntry, SlashCommand } from './types/index.js';

/**
 * Extended Discord client with custom properties
 */
export class BotClient extends Client {
  /** Collection of slash commands */
  public slashCommands = new Collection<string, SlashCommand>();

  /** Cache of invite data per guild for tracking invite usage */
  public inviteCache = new Collection<string, Collection<string, InviteCacheEntry>>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
      ],
    });
  }

  /**
   * Initialize and start the bot
   */
  async start(token: string): Promise<void> {
    try {
      logger.info('Starting Bot_Man...');

      // Load commands
      loadCommands(this);
      logger.info(`Loaded ${this.slashCommands.size} slash commands`);

      // Load event handlers
      loadEvents(this);
      logger.info('Event handlers loaded');

      // Login to Discord
      await this.login(token);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }
}

/**
 * Create a new bot client instance
 */
export function createClient(): BotClient {
  return new BotClient();
}

export default BotClient;

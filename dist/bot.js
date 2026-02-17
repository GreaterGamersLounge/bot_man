import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { logger } from './lib/logger.js';
import { loadEvents } from './events/index.js';
import { loadCommands } from './commands/index.js';
/**
 * Extended Discord client with custom properties
 */
export class BotClient extends Client {
    /** Collection of slash commands */
    slashCommands = new Collection();
    /** Collection of prefix commands */
    prefixCommands = new Collection();
    /** Collection of command aliases for prefix commands */
    aliases = new Collection();
    /** Cache of invite data per guild for tracking invite usage */
    inviteCache = new Collection();
    /** Command prefix for legacy commands */
    prefix = '!';
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.MessageContent,
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
    async start(token) {
        try {
            logger.info('Starting Bot_Man...');
            // Load commands
            await loadCommands(this);
            logger.info(`Loaded ${this.slashCommands.size} slash commands`);
            logger.info(`Loaded ${this.prefixCommands.size} prefix commands`);
            // Load event handlers
            await loadEvents(this);
            logger.info('Event handlers loaded');
            // Login to Discord
            await this.login(token);
        }
        catch (error) {
            logger.error('Failed to start bot:', error);
            throw error;
        }
    }
}
/**
 * Create a new bot client instance
 */
export function createClient() {
    return new BotClient();
}
export default BotClient;
//# sourceMappingURL=bot.js.map
import { Client, Collection } from 'discord.js';
import type { SlashCommand, PrefixCommand, InviteCacheEntry } from './types/index.js';
/**
 * Extended Discord client with custom properties
 */
export declare class BotClient extends Client {
    /** Collection of slash commands */
    slashCommands: Collection<string, SlashCommand>;
    /** Collection of prefix commands */
    prefixCommands: Collection<string, PrefixCommand>;
    /** Collection of command aliases for prefix commands */
    aliases: Collection<string, string>;
    /** Cache of invite data per guild for tracking invite usage */
    inviteCache: Collection<string, Collection<string, InviteCacheEntry>>;
    /** Command prefix for legacy commands */
    readonly prefix: string;
    constructor();
    /**
     * Initialize and start the bot
     */
    start(token: string): Promise<void>;
}
/**
 * Create a new bot client instance
 */
export declare function createClient(): BotClient;
export default BotClient;
//# sourceMappingURL=bot.d.ts.map
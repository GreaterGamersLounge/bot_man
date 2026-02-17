import type { BotClient } from '../bot.js';
import type { SlashCommand, PrefixCommand } from '../types/index.js';
/**
 * All commands to be registered
 */
declare const commands: {
    slash?: SlashCommand;
    prefix?: PrefixCommand;
}[];
/**
 * Load all commands into the client
 */
export declare function loadCommands(client: BotClient): Promise<void>;
/**
 * Get all slash command data for registration
 */
export declare function getSlashCommandData(): SlashCommand['data'][];
export { commands };
//# sourceMappingURL=index.d.ts.map
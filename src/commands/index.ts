import type { BotClient } from '../bot.js';
import { logger } from '../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../types/index.js';

// Import commands from subdirectories
// Utility commands
import info from './utility/info.js';
import ping from './utility/ping.js';
import random from './utility/random.js';

// TODO: Import additional commands as they are implemented
// import * as quoteCommands from './quotes/index.js';
// import * as moderationCommands from './moderation/index.js';
// import * as roleCommands from './roles/index.js';
// import * as voiceCommands from './voice/index.js';
// import * as adminCommands from './admin/index.js';

/**
 * All commands to be registered
 */
const commands: { slash?: SlashCommand; prefix?: PrefixCommand }[] = [
  ping,
  random,
  info,
  // Add more commands here as they are implemented
];

/**
 * Load all commands into the client
 */
export async function loadCommands(client: BotClient): Promise<void> {
  for (const command of commands) {
    // Register slash command
    if (command.slash) {
      const name = command.slash.data.name;
      if (client.slashCommands.has(name)) {
        logger.warn(`Duplicate slash command name: ${name}`);
        continue;
      }
      client.slashCommands.set(name, command.slash);
      logger.debug(`Registered slash command: /${name}`);
    }

    // Register prefix command
    if (command.prefix) {
      const name = command.prefix.name;
      if (client.prefixCommands.has(name)) {
        logger.warn(`Duplicate prefix command name: ${name}`);
        continue;
      }
      client.prefixCommands.set(name, command.prefix);
      logger.debug(`Registered prefix command: !${name}`);

      // Register aliases
      if (command.prefix.aliases) {
        for (const alias of command.prefix.aliases) {
          if (client.aliases.has(alias)) {
            logger.warn(`Duplicate alias: ${alias}`);
            continue;
          }
          client.aliases.set(alias, name);
          logger.debug(`Registered alias: !${alias} -> !${name}`);
        }
      }
    }
  }
}

/**
 * Get all slash command data for registration
 */
export function getSlashCommandData(): SlashCommand['data'][] {
  return commands
    .filter((cmd) => cmd.slash !== undefined)
    .map((cmd) => cmd.slash!.data);
}

export { commands };

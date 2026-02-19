import type { BotClient } from '../bot.js';
import { logger } from '../lib/logger.js';
import type { SlashCommand } from '../types/index.js';

// Import commands from subdirectories
// Utility commands
import info from './utility/info.js';
import * as invite from './utility/invite.js';
import * as me from './utility/me.js';
import ping from './utility/ping.js';
import random from './utility/random.js';

// Quote commands
import * as quote from './quotes/quote.js';

// Moderation commands
import * as clear from './moderation/clear.js';
import * as massmove from './moderation/massmove.js';

// Role commands
import * as reactionrole from './roles/reactionrole.js';

// Voice commands
import * as jumpchannel from './voice/jumpchannel.js';

// Admin commands
import * as dm from './admin/dm.js';
import * as privateCmd from './admin/private.js';
import * as reload from './admin/reload.js';
import * as shutdown from './admin/shutdown.js';

/**
 * Command module interface (old format with default export)
 */
interface OldCommandModule {
  slash?: SlashCommand;
}

/**
 * Command module interface (new format with named exports)
 */
interface NewCommandModule {
  slashCommand?: SlashCommand;
}

type CommandModule = OldCommandModule | NewCommandModule;

/**
 * Normalize command module to unified format
 */
function normalizeModule(module: CommandModule): NewCommandModule {
  // New format - has slashCommand
  if ('slashCommand' in module) {
    return module;
  }
  // Old format - has slash
  const oldModule = module as OldCommandModule;
  return {
    slashCommand: oldModule.slash,
  };
}

/**
 * All command modules
 */
const commandModules: CommandModule[] = [
  // Utility (old format)
  ping,
  random,
  info,
  // Utility (new format)
  me,
  invite,
  // Quotes
  quote,
  // Moderation
  clear,
  massmove,
  // Roles
  reactionrole,
  // Voice
  jumpchannel,
  // Admin
  shutdown,
  dm,
  privateCmd,
  reload,
];

/**
 * Load all commands into the client
 */
export function loadCommands(client: BotClient): void {
  for (const rawModule of commandModules) {
    const module = normalizeModule(rawModule);

    // Register slash command
    if (module.slashCommand) {
      const name = module.slashCommand.data.name;
      if (client.slashCommands.has(name)) {
        logger.warn(`Duplicate slash command name: ${name}`);
        continue;
      }
      client.slashCommands.set(name, module.slashCommand);
      logger.debug(`Registered slash command: /${name}`);
    }
  }
}

/**
 * Get all slash command data for registration
 */
export function getSlashCommandData(): SlashCommand['data'][] {
  return commandModules
    .map((rawModule) => normalizeModule(rawModule))
    .filter((module): module is NewCommandModule & { slashCommand: SlashCommand } => module.slashCommand !== undefined)
    .map((module) => module.slashCommand.data);
}

export { commandModules as commands };

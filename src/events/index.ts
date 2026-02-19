import type { BotClient } from '../bot.js';
import { logger } from '../lib/logger.js';
import type { BotEvent } from '../types/index.js';

// Import event handlers
import guildCreate from './guildCreate.js';
import guildMemberAdd from './guildMemberAdd.js';
import interactionCreate from './interactionCreate.js';
import inviteCreate from './inviteCreate.js';
import inviteDelete from './inviteDelete.js';
import messageReactionAdd from './messageReactionAdd.js';
import messageReactionRemove from './messageReactionRemove.js';
import ready from './ready.js';
import voiceStateUpdate from './voiceStateUpdate.js';

/**
 * All event handlers to be registered
 */
const events: BotEvent[] = [
  ready,
  interactionCreate,
  guildCreate,
  guildMemberAdd,
  messageReactionAdd,
  messageReactionRemove,
  voiceStateUpdate,
  inviteCreate,
  inviteDelete,
];

/**
 * Load all event handlers onto the client
 */
export function loadEvents(client: BotClient): void {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => {
        void event.execute(client, ...args);
      });
    } else {
      client.on(event.name, (...args) => {
        void event.execute(client, ...args);
      });
    }
    logger.debug(`Registered event handler: ${event.name}${event.once ? ' (once)' : ''}`);
  }
}

export { events };

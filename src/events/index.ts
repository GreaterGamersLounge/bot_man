import type { BotClient } from '../bot.js';
import { logger } from '../lib/logger.js';
import type { BotEvent } from '../types/index.js';

// Import event handlers
import interactionCreate from './interactionCreate.js';
import messageCreate from './messageCreate.js';
import ready from './ready.js';

// TODO: Import additional event handlers as they are implemented
// import guildCreate from './guildCreate.js';
// import guildMemberAdd from './guildMemberAdd.js';
// import messageReactionAdd from './messageReactionAdd.js';
// import messageReactionRemove from './messageReactionRemove.js';
// import voiceStateUpdate from './voiceStateUpdate.js';
// import inviteCreate from './inviteCreate.js';
// import inviteDelete from './inviteDelete.js';
// import raw from './raw.js';

/**
 * All event handlers to be registered
 */
const events: BotEvent[] = [
  ready,
  interactionCreate,
  messageCreate,
  // Add more event handlers here as they are implemented
];

/**
 * Load all event handlers onto the client
 */
export async function loadEvents(client: BotClient): Promise<void> {
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

import type { BotClient } from '../bot.js';
import type { BotEvent } from '../types/index.js';
/**
 * All event handlers to be registered
 */
declare const events: BotEvent[];
/**
 * Load all event handlers onto the client
 */
export declare function loadEvents(client: BotClient): Promise<void>;
export { events };
//# sourceMappingURL=index.d.ts.map
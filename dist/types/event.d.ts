import type { ClientEvents } from 'discord.js';
import type { BotClient } from '../bot.js';
/**
 * Represents a Discord event handler
 */
export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    /** The name of the event to listen for */
    name: K;
    /** Whether this event should only fire once */
    once?: boolean;
    /** The function to execute when the event is triggered */
    execute: (client: BotClient, ...args: any[]) => Promise<void> | void;
}
/**
 * Type helper for creating type-safe event handlers
 */
export type EventHandler<K extends keyof ClientEvents> = (client: BotClient, ...args: ClientEvents[K]) => Promise<void> | void;
//# sourceMappingURL=event.d.ts.map
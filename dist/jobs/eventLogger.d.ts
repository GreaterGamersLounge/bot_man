/**
 * Queue a Discord event for async logging to the database
 *
 * This mirrors the Ruby implementation where raw events are processed
 * by Sidekiq workers and stored as Event records with STI types.
 */
export declare function queueEventLog(eventType: string, data: unknown): Promise<void>;
export default queueEventLog;
//# sourceMappingURL=eventLogger.d.ts.map
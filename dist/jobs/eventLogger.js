import { JobQueues, sendJob } from './index.js';
/**
 * Converts a snake_case or SCREAMING_SNAKE_CASE string to PascalCase
 */
function toPascalCase(str) {
    return str
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
/**
 * Queue a Discord event for async logging to the database
 *
 * This mirrors the Ruby implementation where raw events are processed
 * by Sidekiq workers and stored as Event records with STI types.
 */
export async function queueEventLog(eventType, data) {
    // Convert Discord event types (e.g., "MESSAGE_CREATE") to Rails STI format
    // e.g., "Events::MessageCreateEvent"
    const stiType = `Events::${toPascalCase(eventType)}Event`;
    const jobData = {
        type: stiType,
        data,
        timestamp: new Date(),
    };
    await sendJob(JobQueues.EVENT_LOG, jobData);
}
export default queueEventLog;
//# sourceMappingURL=eventLogger.js.map
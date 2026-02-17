import PgBoss from 'pg-boss';
declare let boss: PgBoss | null;
/**
 * Job queue names
 */
export declare const JobQueues: {
    readonly EVENT_LOG: "event-log";
};
export type JobQueueName = (typeof JobQueues)[keyof typeof JobQueues];
/**
 * Get or create the pg-boss instance
 */
export declare function getJobQueue(): PgBoss;
/**
 * Start the job queue
 */
export declare function startJobQueue(): Promise<PgBoss>;
/**
 * Stop the job queue
 */
export declare function stopJobQueue(): Promise<void>;
/**
 * Send a job to the queue
 */
export declare function sendJob<T>(queueName: JobQueueName, data: T, options?: PgBoss.SendOptions): Promise<string | null>;
export { boss };
export default getJobQueue;
//# sourceMappingURL=index.d.ts.map
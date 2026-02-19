import PgBoss from 'pg-boss';
import { getConfig } from '../lib/config.js';
import { logger } from '../lib/logger.js';

let boss: PgBoss | null = null;

/**
 * Job queue names
 */
export const JobQueues = {
  EVENT_LOG: 'event-log',
} as const;

export type JobQueueName = (typeof JobQueues)[keyof typeof JobQueues];

/**
 * Get or create the pg-boss instance
 */
export function getJobQueue(): PgBoss {
  if (!boss) {
    const config = getConfig();

    boss = new PgBoss({
      connectionString: config.databaseUrl,
      // Archive completed jobs for 7 days
      archiveCompletedAfterSeconds: 60 * 60 * 24 * 7,
      // Delete archived jobs after 30 days
      deleteAfterDays: 30,
      // Retry failed jobs
      retryLimit: 3,
      retryDelay: 60,
      // Monitor job queue every 30 seconds
      monitorStateIntervalSeconds: 30,
    });

    // Error handling
    boss.on('error', (error) => {
      logger.error('pg-boss error:', error);
    });

    boss.on('monitor-states', (states) => {
      logger.debug('Job queue states:', states);
    });
  }

  return boss;
}

/**
 * Start the job queue
 */
export async function startJobQueue(): Promise<PgBoss> {
  const queue = getJobQueue();

  try {
    await queue.start();
    logger.info('Job queue started');
    return queue;
  } catch (error) {
    logger.error('Failed to start job queue:', error);
    throw error;
  }
}

/**
 * Stop the job queue
 */
export async function stopJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    logger.info('Job queue stopped');
  }
}

/**
 * Send a job to the queue
 */
export async function sendJob(
  queueName: JobQueueName,
  data: object,
  options?: PgBoss.SendOptions
): Promise<string | null> {
  const queue = getJobQueue();

  try {
    const jobId = await queue.send(queueName, data, options ?? {});
    logger.debug(`Job sent to ${queueName}: ${jobId ?? 'null'}`);
    return jobId;
  } catch (error) {
    logger.error(`Failed to send job to ${queueName}:`, error);
    throw error;
  }
}

export { boss };
export default getJobQueue;

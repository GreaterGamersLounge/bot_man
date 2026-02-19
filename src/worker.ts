import 'dotenv/config';
import { JobQueues, startJobQueue, stopJobQueue } from './jobs/index.js';
import { connectDatabase, disconnectDatabase, prisma } from './lib/database.js';
import { logger } from './lib/logger.js';
import type { EventLogJobData } from './types/index.js';

/**
 * Worker process for handling background jobs
 *
 * This is a standalone process that processes jobs from the pg-boss queue.
 * It's designed to run separately from the main bot process.
 */
async function main(): Promise<void> {
  logger.info('Bot_Man Worker starting...');

  // Connect to database
  await connectDatabase();

  // Start job queue
  const boss = await startJobQueue();

  // Register job handlers
  await registerJobHandlers(boss);

  logger.info('Worker is ready and processing jobs');

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down worker gracefully...`);

    try {
      await stopJobQueue();
      await disconnectDatabase();
      logger.info('Worker shutdown complete.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during worker shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

/**
 * Register all job handlers
 */
async function registerJobHandlers(boss: Awaited<ReturnType<typeof startJobQueue>>): Promise<void> {
  // Event log handler
  await boss.work<EventLogJobData>(JobQueues.EVENT_LOG, { batchSize: 5 }, async (jobs) => {
    for (const job of jobs) {
      const { type, data, timestamp } = job.data;

      logger.debug(`Processing event log job: ${type}`);

      try {
        // Store event in database (matches Ruby Event model)
        await prisma.event.create({
          data: {
            type,
            data: data as object,
            created_at: timestamp,
            updated_at: new Date(),
          },
        });

        logger.debug(`Event logged: ${type}`);
      } catch (error) {
        logger.error(`Failed to log event ${type}:`, error);
        throw error;
      }
    }
  });

  logger.info(`Registered handler for queue: ${JobQueues.EVENT_LOG}`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Worker uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Worker unhandled rejection at:', promise, 'reason:', reason);
});

// Run worker
void main();

import 'dotenv/config';
import { createClient } from './bot.js';
import { getConfig } from './lib/config.js';
import { connectDatabase, disconnectDatabase } from './lib/database.js';
import { logger } from './lib/logger.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const config = getConfig();

  logger.info('Bot_Man starting...');
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Development mode: ${config.isDev}`);

  // Connect to database
  await connectDatabase();

  // Create and start bot client
  const client = createClient();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    try {
      client.destroy();
      await disconnectDatabase();
      logger.info('Shutdown complete.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Start the bot
  await client.start(config.botToken);
}

// Run main
void main();

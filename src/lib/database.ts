import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error('Prisma error:', e.message);
});

/**
 * Connect to the database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Disconnected from database');
}

export default prisma;

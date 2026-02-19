/**
 * Vitest setup file
 * Runs before each test file
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.BOTMAN_BOT_TOKEN = 'test-token';
process.env.DISCORD_CLIENT_ID = '123456789';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock the logger to suppress output during tests
vi.mock('../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

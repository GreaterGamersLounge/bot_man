/**
 * Config utility tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear cached config instance
    vi.resetModules();
    // Create a fresh copy of environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load config from environment variables', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token-123';
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.IS_DEV = 'true';
    process.env.NODE_ENV = 'development';

    const { loadConfig } = await import('./config.js');
    const config = loadConfig();

    expect(config.botToken).toBe('test-token-123');
    expect(config.clientId).toBe('123456789');
    expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/db');
    expect(config.isDev).toBe(true);
    expect(config.nodeEnv).toBe('development');
  });

  it('should throw error when BOTMAN_BOT_TOKEN is missing', async () => {
    delete process.env.BOTMAN_BOT_TOKEN;
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const { loadConfig } = await import('./config.js');
    expect(() => loadConfig()).toThrow('BOTMAN_BOT_TOKEN environment variable is required');
  });

  it('should throw error when DISCORD_CLIENT_ID is missing', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token';
    delete process.env.DISCORD_CLIENT_ID;
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const { loadConfig } = await import('./config.js');
    expect(() => loadConfig()).toThrow('DISCORD_CLIENT_ID environment variable is required');
  });

  it('should throw error when DATABASE_URL is missing', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token';
    process.env.DISCORD_CLIENT_ID = '123456789';
    delete process.env.DATABASE_URL;

    const { loadConfig } = await import('./config.js');
    expect(() => loadConfig()).toThrow('DATABASE_URL environment variable is required');
  });

  it('should default to development nodeEnv when NODE_ENV not set', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token';
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    delete process.env.NODE_ENV;

    const { loadConfig } = await import('./config.js');
    const config = loadConfig();

    expect(config.nodeEnv).toBe('development');
    expect(config.isDev).toBe(true);
  });

  it('should handle optional environment variables', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token';
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.DEV_GUILD_ID = '999999999';
    process.env.OWNER_ID = '111111111';
    process.env.DISCORD_CLIENT_SECRET = 'secret123';

    const { loadConfig } = await import('./config.js');
    const config = loadConfig();

    expect(config.devGuildId).toBe('999999999');
    expect(config.ownerId).toBe('111111111');
    expect(config.clientSecret).toBe('secret123');
  });

  it('should set isDev false in production', async () => {
    process.env.BOTMAN_BOT_TOKEN = 'test-token';
    process.env.DISCORD_CLIENT_ID = '123456789';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.NODE_ENV = 'production';
    delete process.env.IS_DEV;

    const { loadConfig } = await import('./config.js');
    const config = loadConfig();

    expect(config.isDev).toBe(false);
    expect(config.nodeEnv).toBe('production');
  });
});

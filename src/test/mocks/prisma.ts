/**
 * Prisma mock for unit testing
 * Uses vitest mock functions for all database operations
 */

import { vi } from 'vitest';

// Mock data factories
export const mockServer = (overrides = {}): Record<string, unknown> => ({
  id: 1,
  uid: BigInt('123456789012345678'),
  name: 'Test Server',
  icon_id: 'icon123',
  owner_uid: BigInt('111111111111111111'),
  region_id: 'us-west',
  afk_channel_uid: null,
  system_channel_uid: null,
  large: false,
  afk_timeout: null,
  verification_level: 'MEDIUM',
  member_count: BigInt(100),
  creation_time: new Date('2020-01-01'),
  bot_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockDiscordUser = (overrides = {}): Record<string, unknown> => ({
  uid: BigInt('222222222222222222'),
  name: 'TestUser',
  discriminator: '0001',
  avatar_url: 'https://cdn.discordapp.com/avatars/test.png',
  bot_account: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockInvite = (overrides = {}): Record<string, unknown> => ({
  id: 1,
  code: 'testInvite',
  server_uid: BigInt('123456789012345678'),
  inviter_uid: BigInt('222222222222222222'),
  channel_uid: '333333333333333333',
  uses: 5,
  max_uses: null,
  temporary: false,
  expires: null,
  active: true,
  deleter_uid: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockReactionRole = (overrides = {}): Record<string, unknown> => ({
  id: 1,
  message_id: BigInt('444444444444444444'),
  reaction: '👍',
  role_id: BigInt('555555555555555555'),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockQuote = (overrides = {}): Record<string, unknown> => ({
  id: 1,
  server_uid: BigInt('123456789012345678'),
  message: 'This is a test quote',
  message_id: BigInt('666666666666666666'),
  creator_uid: BigInt('222222222222222222'),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockTemporaryVoiceChannel = (overrides = {}): Record<string, unknown> => ({
  id: 1,
  server_uid: BigInt('123456789012345678'),
  channel_uid: BigInt('777777777777777777'),
  active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// Create mock prisma client
export const createMockPrismaClient = (): Record<string, Record<string, ReturnType<typeof vi.fn>>> => ({
  server: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  discord_user: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  invite: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  invite_discord_user: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  reaction_role: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  quote: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  temporary_voice_channel: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $disconnect: vi.fn(),
});

// Default mock instance
export const mockPrisma = createMockPrismaClient();

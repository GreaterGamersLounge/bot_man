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

interface MockPrismaClient {
  server: {
    upsert: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  discord_user: {
    upsert: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  invite: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  invite_discord_user: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  reaction_role: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  quote: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  temporary_voice_channel: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $disconnect: ReturnType<typeof vi.fn>;
}

// Create mock prisma client
export const createMockPrismaClient = (): MockPrismaClient => ({
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

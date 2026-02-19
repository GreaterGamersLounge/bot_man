/**
 * Discord.js mocks for unit testing
 * Provides mock implementations of Discord.js classes and structures
 */

import { vi } from 'vitest';

// Mock Guild
export const createMockGuild = (overrides = {}): Record<string, unknown> => ({
  id: '123456789012345678',
  name: 'Test Server',
  icon: 'icon123',
  ownerId: '111111111111111111',
  preferredLocale: 'en-US',
  afkChannelId: null,
  systemChannelId: null,
  large: false,
  afkTimeout: 300,
  verificationLevel: 2,
  memberCount: 100,
  createdAt: new Date('2020-01-01'),
  members: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  channels: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  roles: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  invites: {
    fetch: vi.fn().mockResolvedValue(new Map()),
  },
  fetchAuditLogs: vi.fn().mockResolvedValue({ entries: { first: vi.fn() } }),
  ...overrides,
});

// Mock GuildMember
export const createMockMember = (overrides = {}): Record<string, unknown> => ({
  id: '222222222222222222',
  user: createMockUser(),
  guild: createMockGuild(),
  displayName: 'TestUser',
  roles: {
    cache: new Map(),
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
  voice: {
    channel: null,
    setChannel: vi.fn().mockResolvedValue(undefined),
  },
  send: vi.fn().mockResolvedValue(null),
  ...overrides,
});

// Mock User
export const createMockUser = (overrides = {}): Record<string, unknown> => ({
  id: '222222222222222222',
  username: 'TestUser',
  discriminator: '0001',
  displayAvatarURL: vi.fn().mockReturnValue('https://cdn.discordapp.com/avatars/test.png'),
  bot: false,
  send: vi.fn().mockResolvedValue(null),
  ...overrides,
});

// Mock Message
export const createMockMessage = (overrides = {}): Record<string, unknown> => ({
  id: '333333333333333333',
  content: 'Test message content',
  author: createMockUser(),
  channel: createMockTextChannel(),
  guild: createMockGuild(),
  member: null,
  createdAt: new Date(),
  reply: vi.fn().mockResolvedValue({}),
  react: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
  ...overrides,
});

// Mock Text Channel
export const createMockTextChannel = (overrides = {}): Record<string, unknown> => ({
  id: '444444444444444444',
  name: 'test-channel',
  type: 0, // GuildText
  guild: null,
  send: vi.fn().mockResolvedValue(createMockMessage()),
  messages: {
    fetch: vi.fn().mockResolvedValue(new Map()),
  },
  bulkDelete: vi.fn().mockResolvedValue(new Map()),
  ...overrides,
});

// Mock Voice Channel
export const createMockVoiceChannel = (overrides = {}): Record<string, unknown> => ({
  id: '555555555555555555',
  name: 'Test Voice',
  type: 2, // GuildVoice
  guild: null,
  members: new Map(),
  parent: null,
  parentId: null,
  userLimit: 0,
  bitrate: 64000,
  delete: vi.fn().mockResolvedValue({}),
  setName: vi.fn().mockResolvedValue({}),
  ...overrides,
});

// Mock Category Channel
export const createMockCategoryChannel = (overrides = {}): Record<string, unknown> => ({
  id: '666666666666666666',
  name: 'Test Category',
  type: 4, // GuildCategory
  children: {
    create: vi.fn().mockResolvedValue(createMockVoiceChannel()),
  },
  ...overrides,
});

// Mock Role
export const createMockRole = (overrides = {}): Record<string, unknown> => ({
  id: '777777777777777777',
  name: 'Test Role',
  color: 0x000000,
  position: 1,
  permissions: BigInt(0),
  ...overrides,
});

// Mock Invite
export const createMockInvite = (overrides = {}): Record<string, unknown> => ({
  code: 'testInvite',
  guild: createMockGuild(),
  inviter: createMockUser(),
  channel: createMockTextChannel(),
  uses: 5,
  maxUses: null,
  temporary: false,
  expiresAt: null,
  ...overrides,
});

// Mock MessageReaction
export const createMockReaction = (overrides = {}): Record<string, unknown> => ({
  emoji: {
    id: null,
    name: '👍',
    toString: vi.fn().mockReturnValue('👍'),
  },
  message: createMockMessage(),
  users: {
    fetch: vi.fn().mockResolvedValue(new Map()),
  },
  ...overrides,
});

// Mock ChatInputCommandInteraction
export const createMockInteraction = (overrides = {}): Record<string, unknown> => ({
  commandName: 'test',
  options: {
    getString: vi.fn(),
    getInteger: vi.fn(),
    getNumber: vi.fn(),
    getBoolean: vi.fn(),
    getUser: vi.fn(),
    getChannel: vi.fn(),
    getRole: vi.fn(),
    getSubcommand: vi.fn(),
    getMember: vi.fn(),
  },
  guild: createMockGuild(),
  guildId: '123456789012345678',
  member: createMockMember(),
  user: createMockUser(),
  channel: createMockTextChannel(),
  reply: vi.fn().mockResolvedValue({}),
  editReply: vi.fn().mockResolvedValue({}),
  deferReply: vi.fn().mockResolvedValue({}),
  followUp: vi.fn().mockResolvedValue({}),
  isCommand: vi.fn().mockReturnValue(true),
  isChatInputCommand: vi.fn().mockReturnValue(true),
  isAutocomplete: vi.fn().mockReturnValue(false),
  ...overrides,
});

// Mock VoiceState
export const createMockVoiceState = (overrides = {}): Record<string, unknown> => ({
  member: createMockMember(),
  guild: createMockGuild(),
  channel: null,
  channelId: null,
  ...overrides,
});

// Mock Client
export const createMockClient = (overrides = {}): Record<string, unknown> => ({
  user: {
    id: '999999999999999999',
    username: 'BotMan',
    setActivity: vi.fn(),
  },
  guilds: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  channels: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  users: {
    cache: new Map(),
    fetch: vi.fn(),
  },
  ws: {
    ping: 42,
  },
  ...overrides,
});

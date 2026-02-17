import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock Prisma client
const mockPrisma = {
  reaction_role: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// Mock the database module
vi.mock('../../lib/database.js', () => ({
  prisma: mockPrisma,
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Reaction Role Command Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('/reactionrole add', () => {
    it('should reject when not in a guild', async () => {
      const { slashCommand } = await import('./reactionrole.js');

      const mockReply = vi.fn();

      const interaction = {
        guild: null,
        channel: null,
        options: {
          getSubcommand: vi.fn().mockReturnValue('add'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'This command can only be used in a server text channel.',
        ephemeral: true,
      });
    });

    it('should reject when message not found', async () => {
      const { slashCommand } = await import('./reactionrole.js');

      const mockReply = vi.fn();
      const mockFetch = vi.fn().mockRejectedValue(new Error('Not found'));

      const interaction = {
        guild: { id: '123456789012345678', emojis: { cache: new Map() } },
        channel: { messages: { fetch: mockFetch } },
        options: {
          getSubcommand: vi.fn().mockReturnValue('add'),
          getString: vi.fn().mockReturnValue('999999999999999999'),
          getRole: vi.fn().mockReturnValue({ id: '111111111111111111' }),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Please supply a message_id from this channel',
        ephemeral: true,
      });
    });
  });

  describe('/reactionrole remove', () => {
    it('should reject when message not found', async () => {
      const { slashCommand } = await import('./reactionrole.js');

      const mockReply = vi.fn();
      const mockFetch = vi.fn().mockRejectedValue(new Error('Not found'));

      const interaction = {
        guild: { id: '123456789012345678', emojis: { cache: new Map() } },
        channel: { messages: { fetch: mockFetch } },
        options: {
          getSubcommand: vi.fn().mockReturnValue('remove'),
          getString: vi.fn((name: string) => {
            if (name === 'message_id') return '999999999999999999';
            if (name === 'emoji') return '🎉';
            return null;
          }),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Please supply a message_id from this channel',
        ephemeral: true,
      });
    });
  });

  describe('/reactionrole clear', () => {
    it('should reject when no reaction roles exist', async () => {
      const { slashCommand } = await import('./reactionrole.js');

      // Mock the reaction role service to return empty array
      mockPrisma.reaction_role.findMany.mockResolvedValue([]);

      const mockReply = vi.fn();
      const mockMessage = { reactions: { removeAll: vi.fn() } };
      const mockFetch = vi.fn().mockResolvedValue(mockMessage);

      const interaction = {
        guild: { id: '123456789012345678', emojis: { cache: new Map() } },
        channel: {
          id: '222222222222222222',
          messages: { fetch: mockFetch },
        },
        options: {
          getSubcommand: vi.fn().mockReturnValue('clear'),
          getString: vi.fn().mockReturnValue('333333333333333333'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'There are no reaction roles on that message',
        ephemeral: true,
      });
    });
  });

  describe('!addreactionrole prefix command', () => {
    it('should reject when not in a guild', async () => {
      const { prefixCommands } = await import('./reactionrole.js');
      const addCommand = prefixCommands[0]!;

      const mockReply = vi.fn();

      const message = {
        guild: null,
        channel: null,
        reply: mockReply,
      };

      await addCommand.execute(message as never, []);

      expect(mockReply).toHaveBeenCalledWith('This command can only be used in a server.');
    });

    it('should show usage when args missing', async () => {
      const { prefixCommands } = await import('./reactionrole.js');
      const addCommand = prefixCommands[0]!;

      const mockReply = vi.fn();

      const message = {
        guild: { id: '123' },
        channel: {},
        reply: mockReply,
      };

      await addCommand.execute(message as never, ['123']);

      expect(mockReply).toHaveBeenCalledWith(
        'Usage: !addreactionrole <message_id> :emoji: <role_id>'
      );
    });
  });

  describe('!removereactionrole prefix command', () => {
    it('should show usage when args missing', async () => {
      const { prefixCommands } = await import('./reactionrole.js');
      const removeCommand = prefixCommands[1]!;

      const mockReply = vi.fn();

      const message = {
        guild: { id: '123' },
        channel: {},
        reply: mockReply,
      };

      await removeCommand.execute(message as never, []);

      expect(mockReply).toHaveBeenCalledWith(
        'Usage: !removereactionrole <message_id> :emoji:'
      );
    });
  });

  describe('!removeallreactionroles prefix command', () => {
    it('should show usage when args missing', async () => {
      const { prefixCommands } = await import('./reactionrole.js');
      const clearCommand = prefixCommands[2]!;

      const mockReply = vi.fn();

      const message = {
        guild: { id: '123' },
        channel: {},
        reply: mockReply,
      };

      await clearCommand.execute(message as never, []);

      expect(mockReply).toHaveBeenCalledWith(
        'Usage: !removeallreactionroles <message_id>'
      );
    });
  });
});

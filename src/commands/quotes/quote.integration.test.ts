/**
 * Integration tests for quote commands
 * Tests the full command execution flow with mocked database
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock database
const mockPrisma = {
  quote: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

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

describe('Quote Commands Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/quote get', () => {
    it('should return a random quote when no filters specified', async () => {
      const { slashCommand } = await import('./quote.js');

      const mockQuote = {
        id: BigInt(1),
        quote: 'Test quote content',
        quoter_uid: BigInt('111111111111111111'),
        quotee_uid: BigInt('222222222222222222'),
        created_at: new Date(),
        server_uid: BigInt('123456789012345678'),
      };

      mockPrisma.quote.findMany.mockResolvedValue([mockQuote]);

      const mockReply = vi.fn();
      const mockFetch = vi.fn().mockResolvedValue(null);

      const interaction = {
        guild: {
          id: '123456789012345678',
          members: { fetch: mockFetch },
        },
        options: {
          getSubcommand: vi.fn().mockReturnValue('get'),
          getUser: vi.fn().mockReturnValue(null),
          getInteger: vi.fn().mockReturnValue(null),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.quote.findMany).toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          embeds: expect.any(Array),
        })
      );
    });

    it('should return no quote found message when database is empty', async () => {
      const { slashCommand } = await import('./quote.js');

      mockPrisma.quote.findMany.mockResolvedValue([]);

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('get'),
          getUser: vi.fn().mockReturnValue(null),
          getInteger: vi.fn().mockReturnValue(null),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'No quote found.',
        ephemeral: true,
      });
    });

    it('should get specific quote by ID', async () => {
      const { slashCommand } = await import('./quote.js');

      const mockQuote = {
        id: BigInt(42),
        quote: 'Specific quote',
        quoter_uid: BigInt('111111111111111111'),
        quotee_uid: BigInt('222222222222222222'),
        created_at: new Date(),
        server_uid: BigInt('123456789012345678'),
      };

      mockPrisma.quote.findFirst.mockResolvedValue(mockQuote);

      const mockReply = vi.fn();
      const mockFetch = vi.fn().mockResolvedValue(null);

      const interaction = {
        guild: {
          id: '123456789012345678',
          members: { fetch: mockFetch },
        },
        options: {
          getSubcommand: vi.fn().mockReturnValue('get'),
          getUser: vi.fn().mockReturnValue(null),
          getInteger: vi.fn().mockReturnValue(42),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.quote.findFirst).toHaveBeenCalledWith({
        where: {
          id: BigInt(42),
          server_uid: BigInt('123456789012345678'),
        },
      });
      expect(mockReply).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          embeds: expect.any(Array),
        })
      );
    });
  });

  describe('/quote add', () => {
    it('should add a new quote', async () => {
      const { slashCommand } = await import('./quote.js');

      const newQuote = {
        id: BigInt(1),
        quote: 'New quote text',
        quoter_uid: BigInt('111111111111111111'),
        quotee_uid: BigInt('222222222222222222'),
        created_at: new Date(),
        server_uid: BigInt('123456789012345678'),
      };

      mockPrisma.quote.create.mockResolvedValue(newQuote);

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        user: { id: '111111111111111111' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('add'),
          getUser: vi.fn().mockReturnValue({ id: '222222222222222222', username: 'QuotedUser' }),
          getString: vi.fn().mockReturnValue('New quote text'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.quote.create).toHaveBeenCalledWith({
        data: {
          server_uid: BigInt('123456789012345678'),
          quoter_uid: BigInt('111111111111111111'),
          quotee_uid: BigInt('222222222222222222'),
          quote: 'New quote text',
        },
      });
      expect(mockReply).toHaveBeenCalledWith('Quote #1 successfully added');
    });
  });

  describe('/quote remove', () => {
    it('should remove an existing quote when user is quoter', async () => {
      const { slashCommand } = await import('./quote.js');

      mockPrisma.quote.findFirst.mockResolvedValue({
        id: BigInt(1),
        server_uid: BigInt('123456789012345678'),
        quoter_uid: BigInt('111111111111111111'),
        quotee_uid: BigInt('222222222222222222'),
      });
      mockPrisma.quote.delete.mockResolvedValue({});

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        user: { id: '111111111111111111' }, // User is the quoter
        options: {
          getSubcommand: vi.fn().mockReturnValue('remove'),
          getInteger: vi.fn().mockReturnValue(1),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.quote.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockReply).toHaveBeenCalledWith('Quote removed.');
    });

    it('should handle non-existent quote', async () => {
      const { slashCommand } = await import('./quote.js');

      mockPrisma.quote.findFirst.mockResolvedValue(null);

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        user: { id: '111111111111111111' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('remove'),
          getInteger: vi.fn().mockReturnValue(999),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.quote.delete).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith({
        content: 'Quote not found.',
        ephemeral: true,
      });
    });
  });

  describe('guild requirement', () => {
    it('should reject commands outside of guilds', async () => {
      const { slashCommand } = await import('./quote.js');

      const mockReply = vi.fn();

      const interaction = {
        guild: null,
        options: {
          getSubcommand: vi.fn().mockReturnValue('get'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
    });
  });
});

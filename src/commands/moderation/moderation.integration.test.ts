/**
 * Integration tests for moderation commands
 * Tests the full command execution flow with mocked Discord interactions
 */

import { Collection } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Moderation Commands Integration', () => {
  describe('/clear command', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.clearAllMocks();
    });

    it('should delete messages and report count', async () => {
      const { slashCommand } = await import('./clear.js');

      const deletedMessages = new Collection<string, unknown>();
      deletedMessages.set('1', {});
      deletedMessages.set('2', {});
      deletedMessages.set('3', {});

      const mockBulkDelete = vi.fn().mockResolvedValue(deletedMessages);
      const mockDeferReply = vi.fn().mockResolvedValue(undefined);
      const mockEditReply = vi.fn().mockResolvedValue(undefined);

      const interaction = {
        guild: { id: '123' },
        channel: {
          name: 'test-channel',
          bulkDelete: mockBulkDelete,
        },
        options: {
          getInteger: vi.fn().mockReturnValue(10),
        },
        user: { tag: 'TestUser#0001' },
        deferReply: mockDeferReply,
        editReply: mockEditReply,
        deferred: true,
      };

      await slashCommand.execute(interaction as never);

      expect(mockDeferReply).toHaveBeenCalledWith({ ephemeral: true });
      expect(mockBulkDelete).toHaveBeenCalledWith(10, true);
      expect(mockEditReply).toHaveBeenCalledWith({
        content: 'Successfully deleted 3 message(s).',
      });
    });

    it('should reject in DMs', async () => {
      const { slashCommand } = await import('./clear.js');

      const mockReply = vi.fn();
      const interaction = {
        guild: null,
        channel: null,
        reply: mockReply,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'This command can only be used in a server text channel.',
        ephemeral: true,
      });
    });

    it('should handle bulk delete errors gracefully', async () => {
      const { slashCommand } = await import('./clear.js');

      const mockBulkDelete = vi.fn().mockRejectedValue(new Error('Messages too old'));
      const mockDeferReply = vi.fn().mockResolvedValue(undefined);
      const mockEditReply = vi.fn().mockResolvedValue(undefined);

      const interaction = {
        guild: { id: '123' },
        channel: {
          name: 'test-channel',
          bulkDelete: mockBulkDelete,
        },
        options: {
          getInteger: vi.fn().mockReturnValue(10),
        },
        user: { tag: 'TestUser#0001' },
        deferReply: mockDeferReply,
        editReply: mockEditReply,
        deferred: true,
      };

      await slashCommand.execute(interaction as never);

      expect(mockEditReply).toHaveBeenCalledWith({
        content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.',
      });
    });
  });

  describe('!clear prefix command', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.clearAllMocks();
    });

    it('should delete messages and send temporary confirmation', async () => {
      vi.useFakeTimers();
      const { prefixCommands } = await import('./clear.js');
      const clearCommand = prefixCommands[0]!;

      const deletedMessages = new Collection<string, unknown>();
      deletedMessages.set('1', {});
      deletedMessages.set('2', {});

      const mockConfirmDelete = vi.fn().mockResolvedValue(undefined);
      const mockConfirmMsg = { delete: mockConfirmDelete };
      const mockBulkDelete = vi.fn().mockResolvedValue(deletedMessages);
      const mockSend = vi.fn().mockResolvedValue(mockConfirmMsg);
      const mockDelete = vi.fn().mockResolvedValue(undefined);

      const message = {
        guild: { id: '123' },
        channel: {
          name: 'test-channel',
          bulkDelete: mockBulkDelete,
          send: mockSend,
        },
        author: { tag: 'TestUser#0001' },
        delete: mockDelete,
        reply: vi.fn(),
      };

      await clearCommand.execute(message as never, ['5']);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockBulkDelete).toHaveBeenCalledWith(5, true);
      expect(mockSend).toHaveBeenCalledWith('Deleted 2 message(s).');

      // Fast-forward time to trigger deletion of confirmation
      vi.advanceTimersByTime(3000);
      expect(mockConfirmDelete).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should reject without argument', async () => {
      const { prefixCommands } = await import('./clear.js');
      const clearCommand = prefixCommands[0]!;

      const mockReply = vi.fn();
      const message = {
        guild: { id: '123' },
        channel: {},
        reply: mockReply,
      };

      await clearCommand.execute(message as never, []);

      expect(mockReply).toHaveBeenCalledWith('Please supply number of messages');
    });

    it('should reject invalid count', async () => {
      const { prefixCommands } = await import('./clear.js');
      const clearCommand = prefixCommands[0]!;

      const mockReply = vi.fn();
      const message = {
        guild: { id: '123' },
        channel: {},
        reply: mockReply,
      };

      await clearCommand.execute(message as never, ['1']); // Less than 2
      expect(mockReply).toHaveBeenCalledWith('Number of messages must be between 2 and 100');

      mockReply.mockClear();
      await clearCommand.execute(message as never, ['101']); // More than 100
      expect(mockReply).toHaveBeenCalledWith('Number of messages must be between 2 and 100');

      mockReply.mockClear();
      await clearCommand.execute(message as never, ['abc']); // Invalid
      expect(mockReply).toHaveBeenCalledWith('Number of messages must be between 2 and 100');
    });
  });
});

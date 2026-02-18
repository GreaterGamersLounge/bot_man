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
});

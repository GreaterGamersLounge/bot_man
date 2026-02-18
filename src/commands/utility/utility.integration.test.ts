/**
 * Integration tests for utility commands
 * Tests the full command execution flow with mocked Discord interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock discord.js SlashCommandBuilder before importing commands
vi.mock('discord.js', async () => {
  const actual = await vi.importActual('discord.js');
  return {
    ...actual,
    SlashCommandBuilder: vi.fn().mockImplementation(() => ({
      setName: vi.fn().mockReturnThis(),
      setDescription: vi.fn().mockReturnThis(),
      addIntegerOption: vi.fn().mockImplementation((fn) => {
        fn({
          setName: vi.fn().mockReturnThis(),
          setDescription: vi.fn().mockReturnThis(),
          setRequired: vi.fn().mockReturnThis(),
          setMinValue: vi.fn().mockReturnThis(),
          setMaxValue: vi.fn().mockReturnThis(),
        });
        return {
          setName: vi.fn().mockReturnThis(),
          setDescription: vi.fn().mockReturnThis(),
          addIntegerOption: vi.fn().mockReturnThis(),
        };
      }),
      toJSON: vi.fn().mockReturnValue({}),
    })),
  };
});

describe('Utility Commands Integration', () => {
  describe('/random command', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let randomCommand: any;

    beforeEach(async () => {
      vi.resetModules();
      const module = await import('../../commands/utility/random.js');
      randomCommand = module.default;
    });

    it('should generate a random number with default range', async () => {
      const mockReply = vi.fn();
      const interaction = {
        options: {
          getInteger: vi.fn().mockReturnValue(null),
        },
        reply: mockReply,
      };

      await randomCommand.slash.execute(interaction);

      expect(mockReply).toHaveBeenCalledTimes(1);
      const replyContent = mockReply.mock.calls[0]?.[0] as string;
      expect(replyContent).toContain('🎲 Random number between 1 and 100:');

      // Extract the number and verify it's in range
      const match = replyContent.match(/\*\*(\d+)\*\*/);
      expect(match).not.toBeNull();
      const num = parseInt(match![1]!, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(100);
    });

    it('should generate a random number with custom range', async () => {
      const mockReply = vi.fn();
      const interaction = {
        options: {
          getInteger: vi.fn().mockImplementation((name: string) => {
            if (name === 'min') return 50;
            if (name === 'max') return 60;
            return null;
          }),
        },
        reply: mockReply,
      };

      await randomCommand.slash.execute(interaction);

      expect(mockReply).toHaveBeenCalledTimes(1);
      const replyContent = mockReply.mock.calls[0]?.[0] as string;
      expect(replyContent).toContain('between 50 and 60');

      const match = replyContent.match(/\*\*(\d+)\*\*/);
      const num = parseInt(match![1]!, 10);
      expect(num).toBeGreaterThanOrEqual(50);
      expect(num).toBeLessThanOrEqual(60);
    });

    it('should reject when min >= max', async () => {
      const mockReply = vi.fn();
      const interaction = {
        options: {
          getInteger: vi.fn().mockImplementation((name: string) => {
            if (name === 'min') return 100;
            if (name === 'max') return 50;
            return null;
          }),
        },
        reply: mockReply,
      };

      await randomCommand.slash.execute(interaction);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Minimum value must be less than maximum value.',
        ephemeral: true,
      });
    });
  });
});

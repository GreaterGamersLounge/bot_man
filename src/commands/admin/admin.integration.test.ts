import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the config module
vi.mock('../../lib/config.js', () => ({
  config: {
    ownerId: '123456789012345678',
  },
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

describe('Admin Command Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('/dm command', () => {
    it('should send DM when used by owner', async () => {
      const { slashCommand } = await import('./dm.js');

      const mockSend = vi.fn().mockResolvedValue({});
      const mockReply = vi.fn();

      const interaction = {
        user: { id: '123456789012345678', tag: 'Owner#0001' },
        options: {
          getUser: vi.fn().mockReturnValue({
            tag: 'Target#1234',
            send: mockSend,
          }),
          getString: vi.fn().mockReturnValue('Hello there!'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockSend).toHaveBeenCalledWith('Hello there!');
      expect(mockReply).toHaveBeenCalledWith({
        content: 'Successfully sent DM to Target#1234',
        ephemeral: true,
      });
    });

    it('should reject non-owner users', async () => {
      const { slashCommand } = await import('./dm.js');

      const mockReply = vi.fn();

      const interaction = {
        user: { id: '999999999999999999', tag: 'NotOwner#9999' },
        options: {
          getUser: vi.fn(),
          getString: vi.fn(),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
    });

    it('should handle DM failures', async () => {
      const { slashCommand } = await import('./dm.js');

      const mockSend = vi.fn().mockRejectedValue(new Error('DMs disabled'));
      const mockReply = vi.fn();

      const interaction = {
        user: { id: '123456789012345678', tag: 'Owner#0001' },
        options: {
          getUser: vi.fn().mockReturnValue({
            tag: 'Target#1234',
            send: mockSend,
          }),
          getString: vi.fn().mockReturnValue('Hello!'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Failed to send DM to Target#1234. They may have DMs disabled.',
        ephemeral: true,
      });
    });
  });

  describe('!dm prefix command', () => {
    it('should send DM when used by owner', async () => {
      const { prefixCommands } = await import('./dm.js');
      const dmCommand = prefixCommands[0]!;

      const mockSend = vi.fn().mockResolvedValue({});
      const mockReply = vi.fn();
      const mockFetch = vi.fn().mockResolvedValue({
        tag: 'Target#1234',
        send: mockSend,
      });

      const message = {
        author: { id: '123456789012345678', tag: 'Owner#0001' },
        client: { users: { fetch: mockFetch } },
        reply: mockReply,
      };

      await dmCommand.execute(message as never, ['<@111111111111111111>', 'Hello', 'World']);

      expect(mockFetch).toHaveBeenCalledWith('111111111111111111');
      expect(mockSend).toHaveBeenCalledWith('Hello World');
      expect(mockReply).toHaveBeenCalledWith('Successfully sent DM to Target#1234');
    });

    it('should silently ignore non-owner users', async () => {
      const { prefixCommands } = await import('./dm.js');
      const dmCommand = prefixCommands[0]!;

      const mockReply = vi.fn();

      const message = {
        author: { id: '999999999999999999' },
        reply: mockReply,
      };

      await dmCommand.execute(message as never, ['<@111>', 'test']);

      expect(mockReply).not.toHaveBeenCalled();
    });

    it('should show usage when args are missing', async () => {
      const { prefixCommands } = await import('./dm.js');
      const dmCommand = prefixCommands[0]!;

      const mockReply = vi.fn();

      const message = {
        author: { id: '123456789012345678' },
        reply: mockReply,
      };

      await dmCommand.execute(message as never, ['@user']);

      expect(mockReply).toHaveBeenCalledWith('Usage: !dm @user [message]');
    });
  });

  describe('/private command', () => {
    it('should send DM to invoking user', async () => {
      const { slashCommand } = await import('./private.js');

      const mockSend = vi.fn().mockResolvedValue({});
      const mockReply = vi.fn();

      const interaction = {
        user: { send: mockSend },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockSend).toHaveBeenCalledWith('Go away...');
      expect(mockReply).toHaveBeenCalledWith({
        content: 'Check your DMs!',
        ephemeral: true,
      });
    });

    it('should handle DM failures', async () => {
      const { slashCommand } = await import('./private.js');

      const mockSend = vi.fn().mockRejectedValue(new Error('DMs disabled'));
      const mockReply = vi.fn();

      const interaction = {
        user: { send: mockSend },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Failed to send DM. Please make sure your DMs are open.',
        ephemeral: true,
      });
    });
  });

  describe('!pm prefix command', () => {
    it('should send DM to invoking user', async () => {
      const { prefixCommands } = await import('./private.js');
      const pmCommand = prefixCommands[0]!;

      const mockSend = vi.fn().mockResolvedValue({});

      const message = {
        author: { send: mockSend },
        reply: vi.fn(),
      };

      await pmCommand.execute(message as never, []);

      expect(mockSend).toHaveBeenCalledWith('Go away...');
    });

    it('should handle DM failures', async () => {
      const { prefixCommands } = await import('./private.js');
      const pmCommand = prefixCommands[0]!;

      const mockSend = vi.fn().mockRejectedValue(new Error('DMs disabled'));
      const mockReply = vi.fn();

      const message = {
        author: { send: mockSend },
        reply: mockReply,
      };

      await pmCommand.execute(message as never, []);

      expect(mockReply).toHaveBeenCalledWith(
        'Failed to send DM. Please make sure your DMs are open.'
      );
    });
  });

  describe('/shutdown command', () => {
    it('should reject non-owner users', async () => {
      const { slashCommand } = await import('./shutdown.js');

      const mockReply = vi.fn();

      const interaction = {
        user: { id: '999999999999999999', tag: 'NotOwner#9999' },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
    });

    it('should initiate shutdown for owner', async () => {
      const { slashCommand } = await import('./shutdown.js');

      // Mock process.exit to prevent actual exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      vi.useFakeTimers();

      const mockReply = vi.fn();

      const interaction = {
        user: { id: '123456789012345678', tag: 'Owner#0001' },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith('Bot is shutting down...');

      // Advance timers to trigger the setTimeout
      vi.advanceTimersByTime(1000);

      expect(mockExit).toHaveBeenCalledWith(0);

      vi.useRealTimers();
      mockExit.mockRestore();
    });
  });

  describe('!shutdown prefix command', () => {
    it('should silently ignore non-owner users', async () => {
      const { prefixCommands } = await import('./shutdown.js');
      const shutdownCommand = prefixCommands[0]!;

      const mockReply = vi.fn();

      const message = {
        author: { id: '999999999999999999' },
        reply: mockReply,
      };

      await shutdownCommand.execute(message as never, []);

      expect(mockReply).not.toHaveBeenCalled();
    });
  });
});

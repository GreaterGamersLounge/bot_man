import { ChannelType } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock Prisma client
const mockPrisma = {
  temporary_voice_channel: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
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

describe('Voice Command Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('/jumpchannel create', () => {
    it('should reject when not in a guild', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      const mockReply = vi.fn();

      const interaction = {
        guild: null,
        options: {
          getSubcommand: vi.fn().mockReturnValue('create'),
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

    it('should create a new jump channel', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      const mockChannel = { id: '444444444444444444', name: 'Jump Channel' };
      const mockCreate = vi.fn().mockResolvedValue(mockChannel);

      mockPrisma.temporary_voice_channel.create.mockResolvedValue({} as never);
      mockPrisma.temporary_voice_channel.findFirst.mockResolvedValue(null);

      const mockReply = vi.fn();

      const interaction = {
        guild: {
          id: '123456789012345678',
          name: 'Test Server',
          channels: { create: mockCreate },
        },
        user: { id: '111111111111111111', tag: 'User#1234' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('create'),
          getString: vi.fn().mockReturnValue('Jump Channel'),
          getChannel: vi.fn().mockReturnValue(null), // Not using existing channel
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Jump Channel',
        type: ChannelType.GuildVoice,
        reason: 'Creating temporary voice jump channel',
      });
      expect(mockPrisma.temporary_voice_channel.create).toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith({
        content: '<#444444444444444444> created as a jump channel',
        ephemeral: true,
      });
    });

    it('should register an existing channel as a jump channel', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      const existingChannel = { id: '555555555555555555', name: 'Existing Voice', type: ChannelType.GuildVoice };

      mockPrisma.temporary_voice_channel.create.mockResolvedValue({} as never);
      mockPrisma.temporary_voice_channel.findFirst.mockResolvedValue(null); // Not already a jump channel

      const mockReply = vi.fn();

      const interaction = {
        guild: {
          id: '123456789012345678',
          name: 'Test Server',
          channels: { create: vi.fn() }, // Should not be called
        },
        user: { id: '111111111111111111', tag: 'User#1234' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('create'),
          getString: vi.fn().mockReturnValue(null), // Not using name
          getChannel: vi.fn().mockReturnValue(existingChannel), // Using existing channel
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      // Should NOT create a new channel
      expect(interaction.guild.channels.create).not.toHaveBeenCalled();
      // Should register in database
      expect(mockPrisma.temporary_voice_channel.create).toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith({
        content: '<#555555555555555555> designated as a jump channel',
        ephemeral: true,
      });
    });

    it('should reject when existing channel is already a jump channel', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      const existingChannel = { id: '555555555555555555', name: 'Already Jump', type: ChannelType.GuildVoice };

      // Already exists as a jump channel
      mockPrisma.temporary_voice_channel.findFirst.mockResolvedValue({ discord_channel_id: existingChannel.id } as never);

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        user: { id: '111111111111111111', tag: 'User#1234' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('create'),
          getString: vi.fn().mockReturnValue(null),
          getChannel: vi.fn().mockReturnValue(existingChannel),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: '<#555555555555555555> is already a jump channel.',
        ephemeral: true,
      });
    });
  });

  describe('/jumpchannel delete', () => {
    it('should reject when channel is not a jump channel', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      mockPrisma.temporary_voice_channel.findFirst.mockResolvedValue(null);

      const mockReply = vi.fn();
      const mockChannel = { id: '444444444444444444', name: 'Not Jump' };

      const interaction = {
        guild: { id: '123456789012345678' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('delete'),
          getChannel: vi.fn().mockReturnValue(mockChannel),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'That channel is not a jump channel.',
        ephemeral: true,
      });
    });

    it('should delete a jump channel', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      mockPrisma.temporary_voice_channel.findFirst.mockResolvedValue({
        id: BigInt(1),
        server_uid: BigInt('123456789012345678'),
        channel_uid: BigInt('444444444444444444'),
        is_jump_channel: true,
        active: true,
      } as never);
      mockPrisma.temporary_voice_channel.update.mockResolvedValue({} as never);

      const mockDelete = vi.fn().mockResolvedValue({});
      const mockChannel = {
        id: '444444444444444444',
        name: 'Jump Channel',
        delete: mockDelete,
      };

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678', name: 'Test Server' },
        user: { tag: 'User#1234' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('delete'),
          getChannel: vi.fn().mockReturnValue(mockChannel),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockPrisma.temporary_voice_channel.update).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledWith({
        content: 'Temporary jump channel `Jump Channel` deleted',
        ephemeral: true,
      });
    });
  });

  describe('/jumpchannel list', () => {
    it('should show message when no jump channels exist', async () => {
      const { slashCommand } = await import('./jumpchannel.js');

      mockPrisma.temporary_voice_channel.findMany.mockResolvedValue([]);

      const mockReply = vi.fn();

      const interaction = {
        guild: { id: '123456789012345678' },
        options: {
          getSubcommand: vi.fn().mockReturnValue('list'),
        },
        reply: mockReply,
        replied: false,
        deferred: false,
      };

      await slashCommand.execute(interaction as never);

      expect(mockReply).toHaveBeenCalledWith({
        content: 'No active jump channels in this server.',
        ephemeral: true,
      });
    });
  });
});

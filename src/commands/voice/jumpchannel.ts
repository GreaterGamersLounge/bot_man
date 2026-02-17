import {
    ChannelType,
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    SlashCommandBuilder,
    VoiceChannel,
} from 'discord.js';
import { prisma } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

// Slash command with subcommands
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('jumpchannel')
    .setDescription('Manage temporary voice jump channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new temporary voice jump channel')
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('The name for the jump channel')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a temporary voice jump channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The jump channel to delete')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all jump channels in this server')
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'create':
          await handleCreateJumpChannel(interaction);
          break;
        case 'delete':
          await handleDeleteJumpChannel(interaction);
          break;
        case 'list':
          await handleListJumpChannels(interaction);
          break;
      }
    } catch (error) {
      logger.error('Error executing jumpchannel command:', error);
      const content = 'An error occurred while processing the command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

/**
 * Handle /jumpchannel create
 */
async function handleCreateJumpChannel(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const channelName = interaction.options.getString('name', true);
  const guild = interaction.guild!;

  // Create the voice channel
  const newChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    reason: 'Creating temporary voice jump channel',
  });

  // Record in database
  await prisma.temporary_voice_channel.create({
    data: {
      server_uid: BigInt(guild.id),
      creator_uid: BigInt(interaction.user.id),
      channel_uid: BigInt(newChannel.id),
      is_jump_channel: true,
      active: true,
    },
  });

  await interaction.reply({
    content: `Temporary jump channel \`${channelName}\` created`,
    ephemeral: true,
  });

  logger.info(`Jump channel "${channelName}" created by ${interaction.user.tag} in ${guild.name}`);
}

/**
 * Handle /jumpchannel delete
 */
async function handleDeleteJumpChannel(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const channel = interaction.options.getChannel('channel', true) as VoiceChannel;
  const guild = interaction.guild!;

  // Find the jump channel in database
  const jumpChannel = await prisma.temporary_voice_channel.findFirst({
    where: {
      server_uid: BigInt(guild.id),
      channel_uid: BigInt(channel.id),
      is_jump_channel: true,
      active: true,
    },
  });

  if (!jumpChannel) {
    await interaction.reply({
      content: 'That channel is not a jump channel.',
      ephemeral: true,
    });
    return;
  }

  // Mark as inactive in database
  await prisma.temporary_voice_channel.update({
    where: { id: jumpChannel.id },
    data: { active: false },
  });

  // Delete the Discord channel
  const channelName = channel.name;
  await channel.delete('Jump channel deleted by admin');

  await interaction.reply({
    content: `Temporary jump channel \`${channelName}\` deleted`,
    ephemeral: true,
  });

  logger.info(`Jump channel "${channelName}" deleted by ${interaction.user.tag} in ${guild.name}`);
}

/**
 * Handle /jumpchannel list
 */
async function handleListJumpChannels(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild!;

  const jumpChannels = await prisma.temporary_voice_channel.findMany({
    where: {
      server_uid: BigInt(guild.id),
      is_jump_channel: true,
      active: true,
    },
  });

  if (jumpChannels.length === 0) {
    await interaction.reply({
      content: 'No active jump channels in this server.',
      ephemeral: true,
    });
    return;
  }

  const channelList = jumpChannels
    .map((jc) => {
      const channel = guild.channels.cache.get(jc.channel_uid.toString());
      return channel ? `• ${channel.name} (<#${channel.id}>)` : `• Unknown channel (${jc.channel_uid})`;
    })
    .join('\n');

  await interaction.reply({
    content: `**Jump Channels:**\n${channelList}`,
    ephemeral: true,
  });
}

// Legacy prefix commands
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'createjumpchannel',
    aliases: [],
    description: 'Create a new temporary voice jump channel',
    usage: 'createjumpchannel [channel name]',
    permissions: ['Administrator'],
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length === 0) {
        await message.reply('Please supply a jump channel name');
        return;
      }

      const channelName = args.join(' ');
      const guild = message.guild;

      // Create the voice channel
      const newChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        reason: 'Creating temporary voice jump channel',
      });

      // Record in database
      await prisma.temporary_voice_channel.create({
        data: {
          server_uid: BigInt(guild.id),
          creator_uid: BigInt(message.author.id),
          channel_uid: BigInt(newChannel.id),
          is_jump_channel: true,
          active: true,
        },
      });

      await message.reply(`Temporary jump channel \`${channelName}\` created`);

      logger.info(`Jump channel "${channelName}" created by ${message.author.tag} in ${guild.name}`);
    },
  },
  {
    name: 'deletejumpchannel',
    aliases: [],
    description: 'Delete a temporary voice jump channel',
    usage: 'deletejumpchannel [channel name]',
    permissions: ['Administrator'],
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length === 0) {
        await message.reply('Please supply a jump channel name');
        return;
      }

      const channelName = args.join(' ');
      const guild = message.guild;

      // Find the Discord channel by name
      const discordChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildVoice && c.name === channelName
      ) as VoiceChannel | undefined;

      if (!discordChannel) {
        await message.reply('Channel not found.');
        return;
      }

      // Find in database
      const jumpChannel = await prisma.temporary_voice_channel.findFirst({
        where: {
          server_uid: BigInt(guild.id),
          channel_uid: BigInt(discordChannel.id),
          is_jump_channel: true,
          active: true,
        },
      });

      if (!jumpChannel) {
        await message.reply('That channel is not a jump channel.');
        return;
      }

      // Mark as inactive
      await prisma.temporary_voice_channel.update({
        where: { id: jumpChannel.id },
        data: { active: false },
      });

      // Delete the channel
      await discordChannel.delete('Jump channel deleted by admin');

      await message.reply(`Temporary jump channel \`${channelName}\` deleted`);

      logger.info(`Jump channel "${channelName}" deleted by ${message.author.tag} in ${guild.name}`);
    },
  },
];

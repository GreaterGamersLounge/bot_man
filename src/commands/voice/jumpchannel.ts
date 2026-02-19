import type { ChatInputCommandInteraction, Guild, VoiceChannel } from 'discord.js';
import { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { prisma } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Slash command with subcommands
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('jumpchannel')
    .setDescription('Manage temporary voice jump channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts([InteractionContextType.Guild])
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new jump channel or designate an existing one')
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('The name for a NEW jump channel to create')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('An EXISTING voice channel to use as a jump channel')
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildVoice)
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
      subcommand.setName('list').setDescription('List all jump channels in this server')
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

    const guild = interaction.guild;

    try {
      switch (subcommand) {
        case 'create':
          await handleCreateJumpChannel(interaction, guild);
          break;
        case 'delete':
          await handleDeleteJumpChannel(interaction);
          break;
        case 'list':
          await handleListJumpChannels(interaction, guild);
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
  interaction: ChatInputCommandInteraction,
  guild: Guild
): Promise<void> {
  const channelName = interaction.options.getString('name');
  const existingChannel = interaction.options.getChannel('channel');

  // Must provide either name or channel, but not both
  if (!channelName && !existingChannel) {
    await interaction.reply({
      content:
        'Please provide either a `name` to create a new channel, or select an existing `channel`.',
      ephemeral: true,
    });
    return;
  }

  if (channelName && existingChannel) {
    await interaction.reply({
      content: 'Please provide either a `name` OR a `channel`, not both.',
      ephemeral: true,
    });
    return;
  }

  let targetChannel: VoiceChannel;
  let action: string;

  if (existingChannel) {
    // Check if it's already a jump channel
    const existing = await prisma.temporary_voice_channel.findFirst({
      where: {
        server_uid: BigInt(guild.id),
        channel_uid: BigInt(existingChannel.id),
        is_jump_channel: true,
        active: true,
      },
    });

    if (existing) {
      await interaction.reply({
        content: `<#${existingChannel.id}> is already a jump channel.`,
        ephemeral: true,
      });
      return;
    }

    targetChannel = existingChannel as VoiceChannel;
    action = 'designated as';
  } else if (channelName) {
    // Create a new voice channel
    targetChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      reason: 'Creating temporary voice jump channel',
    });
    action = 'created as';
  } else {
    // This should never happen due to earlier validation, but satisfies TypeScript
    return;
  }

  // Record in database
  await prisma.temporary_voice_channel.create({
    data: {
      server_uid: BigInt(guild.id),
      creator_uid: BigInt(interaction.user.id),
      channel_uid: BigInt(targetChannel.id),
      is_jump_channel: true,
      active: true,
    },
  });

  await interaction.reply({
    content: `<#${targetChannel.id}> ${action} a jump channel`,
    ephemeral: true,
  });

  logger.info(
    `Jump channel "${targetChannel.name}" ${action} by ${interaction.user.tag} in ${guild.name}`
  );
}

/**
 * Handle /jumpchannel delete
 */
async function handleDeleteJumpChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.options.getChannel('channel', true);

  // Ensure we got a valid channel with a delete method (GuildBasedChannel)
  if (!('delete' in channel)) {
    await interaction.reply({
      content: 'Could not find that voice channel.',
      ephemeral: true,
    });
    return;
  }

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
  await (channel as { delete: (reason?: string) => Promise<unknown> }).delete(
    'Jump channel deleted by admin'
  );

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
  interaction: ChatInputCommandInteraction,
  guild: Guild
): Promise<void> {
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
      return channel
        ? `• ${channel.name} (<#${channel.id}>)`
        : `• Unknown channel (${jc.channel_uid})`;
    })
    .join('\n');

  await interaction.reply({
    content: `**Jump Channels:**\n${channelList}`,
    ephemeral: true,
  });
}

import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    VoiceChannel,
} from 'discord.js';
import { ChannelType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { levenshtein } from '../../lib/levenshtein.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

/**
 * Find the closest matching voice channel by name
 * Uses substring matching first, then Levenshtein distance
 */
function findClosestChannel(searchText: string, channels: VoiceChannel[]): VoiceChannel | null {
  if (channels.length === 0) {
    return null;
  }

  // Normalize the search text
  const source = searchText.toLowerCase().replace(/[^0-9a-z]/g, '');

  let closest: VoiceChannel | null = null;
  let minDistance = Infinity;

  for (const channel of channels) {
    const target = channel.name.toLowerCase().replace(/[^0-9a-z]/g, '');

    // Prefer exact substring match
    if (target.includes(source)) {
      return channel;
    }

    // Calculate Levenshtein distance
    const distance = levenshtein(source, target);
    if (distance < minDistance) {
      minDistance = distance;
      closest = channel;
    }
  }

  return closest;
}

/**
 * Get all voice channels in a guild
 */
function getVoiceChannels(guild: {
  channels: { cache: Map<string, { type: ChannelType }> };
}): VoiceChannel[] {
  return Array.from(guild.channels.cache.values()).filter(
    (channel): channel is VoiceChannel => channel.type === ChannelType.GuildVoice
  );
}

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('massmove')
    .setDescription('Move all users from one voice channel to another')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .setContexts([InteractionContextType.Guild])
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('Source voice channel name')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('destination')
        .setDescription('Destination voice channel name')
        .setRequired(true)
        .setAutocomplete(true)
    ) as SlashCommandBuilder,

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    const guild = interaction.guild;

    if (!guild) {
      return;
    }

    const voiceChannels = getVoiceChannels(guild);
    const searchValue = focusedOption.value.toLowerCase();

    // Filter channels that match the search
    const filtered = voiceChannels
      .filter((channel) => channel.name.toLowerCase().includes(searchValue))
      .slice(0, 25); // Discord limit

    await interaction.respond(
      filtered.map((channel) => ({
        name: channel.name,
        value: channel.name,
      }))
    );
  },

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const sourceChannelName = interaction.options.getString('source', true);
    const destChannelName = interaction.options.getString('destination', true);

    const voiceChannels = getVoiceChannels(interaction.guild);

    const sourceChannel = findClosestChannel(sourceChannelName, voiceChannels);
    const destChannel = findClosestChannel(destChannelName, voiceChannels);

    if (!sourceChannel) {
      await interaction.reply({
        content: `Could not find source voice channel matching "${sourceChannelName}"`,
        ephemeral: true,
      });
      return;
    }

    if (!destChannel) {
      await interaction.reply({
        content: `Could not find destination voice channel matching "${destChannelName}"`,
        ephemeral: true,
      });
      return;
    }

    if (sourceChannel.id === destChannel.id) {
      await interaction.reply({
        content: 'Source and destination channels must be different.',
        ephemeral: true,
      });
      return;
    }

    // Get users in the source channel
    const users = sourceChannel.members;
    const userCount = users.size;

    if (userCount === 0) {
      await interaction.reply({
        content: `No users in ${sourceChannel.name} to move.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    let movedCount = 0;
    const errors: string[] = [];

    // Move each user
    for (const [, member] of users) {
      try {
        await member.voice.setChannel(destChannel);
        movedCount++;
      } catch (error) {
        logger.warn(`Failed to move ${member.displayName}:`, error);
        errors.push(member.displayName);
      }
    }

    const userWord = movedCount === 1 ? 'user' : 'users';
    let response = `Moving ${movedCount} ${userWord} to ${destChannel.name}`;

    if (errors.length > 0) {
      response += `\nFailed to move: ${errors.join(', ')}`;
    }

    await interaction.editReply(response);

    logger.info(
      `Massmove: ${interaction.user.tag} moved ${movedCount} users from ${sourceChannel.name} to ${destChannel.name}`
    );
  },
};

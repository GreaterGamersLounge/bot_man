import type { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages in the channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('Number of messages to delete (2-100)')
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(100)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: 'This command can only be used in a server text channel.',
        ephemeral: true,
      });
      return;
    }

    const count = interaction.options.getInteger('count', true);
    const channel = interaction.channel as TextChannel;

    try {
      // Defer reply as this might take a moment
      await interaction.deferReply({ ephemeral: true });

      // Bulk delete messages
      const deleted = await channel.bulkDelete(count, true);

      await interaction.editReply({
        content: `Successfully deleted ${deleted.size} message(s).`,
      });

      logger.info(`Cleared ${deleted.size} messages in ${channel.name} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error('Error clearing messages:', error);

      const content =
        'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.';
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

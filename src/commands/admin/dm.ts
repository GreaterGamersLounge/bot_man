import type {
  ChatInputCommandInteraction} from 'discord.js';
import {
  SlashCommandBuilder,
} from 'discord.js';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a DM to a user (owner only)')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to DM').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('The message to send').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Only allow bot owner
    if (interaction.user.id !== config.ownerId) {
      await interaction.reply({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const messageContent = interaction.options.getString('message', true);

    try {
      await targetUser.send(messageContent);

      await interaction.reply({
        content: `Successfully sent DM to ${targetUser.tag}`,
        ephemeral: true,
      });

      logger.info(`DM sent to ${targetUser.tag} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Failed to send DM to ${targetUser.tag}:`, error);
      await interaction.reply({
        content: `Failed to send DM to ${targetUser.tag}. They may have DMs disabled.`,
        ephemeral: true,
      });
    }
  },
};

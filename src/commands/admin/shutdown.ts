import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Shutdown the bot (owner only)'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Only allow bot owner
    if (interaction.user.id !== config.ownerId) {
      await interaction.reply({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
      return;
    }

    logger.warn(`Shutdown initiated by ${interaction.user.tag}`);

    await interaction.reply('Bot is shutting down...');

    // Give time for the message to send
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  },
};

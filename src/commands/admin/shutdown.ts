import {
    ChatInputCommandInteraction,
    Message,
    SlashCommandBuilder,
} from 'discord.js';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

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

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'shutdown',
    aliases: ['exit'],
    description: 'Shutdown the bot (owner only)',
    usage: 'shutdown',
    async execute(message: Message): Promise<void> {
      // Only allow bot owner
      if (message.author.id !== config.ownerId) {
        return; // Silently ignore
      }

      logger.warn(`Shutdown initiated by ${message.author.tag}`);

      await message.reply('Bot is shutting down...');

      setTimeout(() => {
        process.exit(0);
      }, 1000);
    },
  },
];

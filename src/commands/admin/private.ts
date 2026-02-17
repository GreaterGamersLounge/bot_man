import {
    ChatInputCommandInteraction,
    Message,
    SlashCommandBuilder,
} from 'discord.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('private')
    .setDescription('Send a private message to yourself'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.user.send('Go away...');
      await interaction.reply({
        content: 'Check your DMs!',
        ephemeral: true,
      });
    } catch (error) {
      logger.error('Failed to send DM:', error);
      await interaction.reply({
        content: 'Failed to send DM. Please make sure your DMs are open.',
        ephemeral: true,
      });
    }
  },
};

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'pm',
    aliases: ['private'],
    description: 'Send a private message to yourself',
    usage: 'pm',
    async execute(message: Message): Promise<void> {
      try {
        await message.author.send('Go away...');
      } catch (error) {
        logger.error('Failed to send DM:', error);
        await message.reply('Failed to send DM. Please make sure your DMs are open.');
      }
    },
  },
];

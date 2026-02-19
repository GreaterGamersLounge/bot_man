import type {
  ChatInputCommandInteraction
} from 'discord.js';
import {
  SlashCommandBuilder,
} from 'discord.js';
import type { SlashCommand } from '../../types/command.js';

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('me')
    .setDescription('Display your username'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member;

    if (member && 'displayName' in member) {
      await interaction.reply(member.displayName);
    } else {
      await interaction.reply(interaction.user.username);
    }
  },
};

import {
    ChatInputCommandInteraction,
    Message,
    SlashCommandBuilder,
} from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

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

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'me',
    aliases: [],
    description: 'Display your username',
    usage: 'me',
    async execute(message: Message): Promise<void> {
      const member = message.member;

      if (member) {
        await message.reply(member.displayName);
      } else {
        await message.reply(message.author.username);
      }
    },
  },
];

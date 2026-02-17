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

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'dm',
    aliases: [],
    description: 'Send a DM to a user (owner only)',
    usage: 'dm @user [message]',
    async execute(message: Message, args: string[]): Promise<void> {
      // Only allow bot owner
      if (message.author.id !== config.ownerId) {
        return; // Silently ignore
      }

      if (args.length < 2) {
        await message.reply('Usage: !dm @user [message]');
        return;
      }

      const targetUserId = args[0]!.replace(/[^0-9]/g, '');
      const messageContent = args.slice(1).join(' ');

      try {
        const targetUser = await message.client.users.fetch(targetUserId);
        await targetUser.send(messageContent);

        await message.reply(`Successfully sent DM to ${targetUser.tag}`);

        logger.info(`DM sent to ${targetUser.tag} by ${message.author.tag}`);
      } catch (error) {
        logger.error(`Failed to send DM:`, error);
        await message.reply('Failed to send DM. The user may have DMs disabled.');
      }
    },
  },
];

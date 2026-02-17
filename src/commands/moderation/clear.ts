import {
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

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

      const content = 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.';
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'clear',
    aliases: [],
    description: 'Bulk delete messages in the channel',
    usage: 'clear [number of messages]',
    permissions: ['Administrator'],
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild || !message.channel) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length < 1) {
        await message.reply('Please supply number of messages');
        return;
      }

      const numMessages = parseInt(args[0]!, 10);

      if (isNaN(numMessages) || numMessages < 2 || numMessages > 100) {
        await message.reply('Number of messages must be between 2 and 100');
        return;
      }

      const channel = message.channel as TextChannel;

      try {
        // Delete the command message first
        await message.delete().catch(() => {});

        // Bulk delete messages
        const deleted = await channel.bulkDelete(numMessages, true);

        // Send a temporary confirmation message
        const confirmMsg = await channel.send(`Deleted ${deleted.size} message(s).`);

        // Delete the confirmation after 3 seconds
        setTimeout(() => {
          confirmMsg.delete().catch(() => {});
        }, 3000);

        logger.info(`Cleared ${deleted.size} messages in ${channel.name} by ${message.author.tag}`);
      } catch (error) {
        logger.error('Error clearing messages:', error);
        await channel.send('Failed to delete messages. Messages older than 14 days cannot be bulk deleted.');
      }
    },
  },
];

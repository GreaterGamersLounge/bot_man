import {
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

// Note: Discord.js v14 doesn't support changing server region via bot
// This is because Discord auto-selects optimal voice regions now.
// Keeping this command for compatibility but with updated functionality.

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('set')
    .setDescription('View or update server settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('region')
        .setDescription('View server voice region info')
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'region':
          await handleRegion(interaction);
          break;
      }
    } catch (error) {
      logger.error('Error executing set command:', error);
      await interaction.reply({
        content: 'An error occurred while processing the command.',
        ephemeral: true,
      });
    }
  },
};

/**
 * Handle /set region
 * Note: Discord now auto-selects voice regions, so this is informational only
 */
async function handleRegion(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;

  // Fetch guild with widget for region info
  const fetchedGuild = await guild.fetch();

  // Note: preferredLocale is the closest equivalent to region in discord.js v14
  // Voice region is now automatic per-channel, not server-wide
  await interaction.reply({
    content: [
      '**Server Region Info**',
      '',
      `Server Locale: \`${fetchedGuild.preferredLocale}\``,
      '',
      '*Note: Discord now automatically selects the optimal voice server region for each voice channel. Server-wide region settings are no longer available.*',
    ].join('\n'),
    ephemeral: true,
  });
}

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'set',
    aliases: [],
    description: 'View or update server settings',
    usage: 'set [setting] [options]',
    permissions: ['Administrator'],
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length === 0) {
        await message.reply('Please supply a setting. Available: `region`');
        return;
      }

      const setting = args[0]!.toLowerCase();

      switch (setting) {
        case 'region':
          await handleRegionPrefix(message);
          break;
        default:
          await message.reply('Invalid setting. Available: `region`');
      }
    },
  },
];

async function handleRegionPrefix(message: Message): Promise<void> {
  const guild = message.guild!;
  const fetchedGuild = await guild.fetch();

  await message.reply([
    '**Server Region Info**',
    '',
    `Server Locale: \`${fetchedGuild.preferredLocale}\``,
    '',
    '*Note: Discord now automatically selects the optimal voice server region for each voice channel. Server-wide region settings are no longer available.*',
  ].join('\n'));
}

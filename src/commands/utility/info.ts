import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  version as djsVersion,
} from 'discord.js';
import { getConfig } from '../../lib/config.js';
import type { SlashCommand } from '../../types/index.js';

const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get information about the bot')
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ]),

  async execute(interaction) {
    const config = getConfig();
    const client = interaction.client;
    const uptime = formatUptime(client.uptime);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Bot_Man Information')
      .setDescription('A Discord bot for server management and fun commands.')
      .addFields(
        { name: '📊 Servers', value: client.guilds.cache.size.toString(), inline: true },
        { name: '👥 Users', value: client.users.cache.size.toString(), inline: true },
        { name: '⏱️ Uptime', value: uptime, inline: true },
        { name: '🔧 discord.js', value: `v${djsVersion}`, inline: true },
        { name: '📦 Node.js', value: process.version, inline: true },
        { name: '🌍 Environment', value: config.nodeEnv, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

/**
 * Format milliseconds into a human-readable uptime string
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours % 24 > 0) {
    parts.push(`${hours % 24}h`);
  }
  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60}m`);
  }
  if (seconds % 60 > 0 || parts.length === 0) {
    parts.push(`${seconds % 60}s`);
  }

  return parts.join(' ');
}

export default { slash };

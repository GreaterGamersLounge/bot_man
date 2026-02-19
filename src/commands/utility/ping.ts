import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/index.js';

const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and response time'),

  async execute(interaction) {
    const response = await interaction.reply({
      content: 'Pinging...',
      withResponse: true,
    });

    const sent = response.resource?.message;
    if (!sent) {
      await interaction.editReply('Failed to measure latency.');
      return;
    }

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsHeartbeat = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 Pong!\n` +
        `**Roundtrip:** ${roundtrip}ms\n` +
        `**WebSocket:** ${wsHeartbeat}ms`
    );
  },
};

export default { slash };

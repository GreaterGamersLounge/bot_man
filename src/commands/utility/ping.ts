import { SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../../types/index.js';

const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and response time'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsHeartbeat = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 Pong!\n` +
        `**Roundtrip:** ${roundtrip}ms\n` +
        `**WebSocket:** ${wsHeartbeat}ms`
    );
  },
};

const prefix: PrefixCommand = {
  name: 'ping',
  description: 'Check bot latency and response time',

  async execute(message) {
    const sent = await message.reply('Pinging...');
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;
    const wsHeartbeat = message.client.ws.ping;

    await sent.edit(
      `🏓 Pong!\n` +
        `**Roundtrip:** ${roundtrip}ms\n` +
        `**WebSocket:** ${wsHeartbeat}ms`
    );
  },
};

export default { slash, prefix };

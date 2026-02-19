import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/index.js';

const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Generate a random number')
    .addIntegerOption((option) =>
      option.setName('min').setDescription('Minimum value (default: 1)').setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('max').setDescription('Maximum value (default: 100)').setRequired(false)
    ),

  async execute(interaction) {
    const min = interaction.options.getInteger('min') ?? 1;
    const max = interaction.options.getInteger('max') ?? 100;

    if (min >= max) {
      await interaction.reply({
        content: 'Minimum value must be less than maximum value.',
        ephemeral: true,
      });
      return;
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    await interaction.reply(`🎲 Random number between ${min} and ${max}: **${result}**`);
  },
};

export default { slash };

import { SlashCommandBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../../types/index.js';

const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Generate a random number')
    .addIntegerOption((option) =>
      option
        .setName('min')
        .setDescription('Minimum value (default: 1)')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('max')
        .setDescription('Maximum value (default: 100)')
        .setRequired(false)
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

const prefix: PrefixCommand = {
  name: 'random',
  aliases: ['rand', 'roll'],
  description: 'Generate a random number',

  async execute(message, args) {
    let min = 1;
    let max = 100;

    if (args.length >= 1) {
      const parsed = parseInt(args[0]!, 10);
      if (!isNaN(parsed)) {
        max = parsed;
      }
    }

    if (args.length >= 2) {
      min = parseInt(args[0]!, 10);
      max = parseInt(args[1]!, 10);
    }

    if (isNaN(min) || isNaN(max)) {
      await message.reply('Please provide valid numbers.');
      return;
    }

    if (min >= max) {
      await message.reply('Minimum value must be less than maximum value.');
      return;
    }

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    await message.reply(`🎲 Random number between ${min} and ${max}: **${result}**`);
  },
};

export default { slash, prefix };

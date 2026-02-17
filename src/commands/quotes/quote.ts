import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    SlashCommandBuilder,
    TextChannel,
    User,
} from 'discord.js';
import { prisma } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

const EMBED_COLOR = 0x3fb426; // Green color matching Ruby version

/**
 * Helper to get a random quote from the database
 */
async function getRandomQuote(serverUid: bigint, quoteeUid?: bigint) {
  const whereClause: { server_uid: bigint; quotee_uid?: bigint } = {
    server_uid: serverUid,
  };

  if (quoteeUid) {
    whereClause.quotee_uid = quoteeUid;
  }

  // Get random quote using raw SQL for proper randomization
  const quotes = await prisma.quote.findMany({
    where: whereClause,
  });

  if (quotes.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

/**
 * Helper to get display name for a user
 */
function getUserDisplayName(member: GuildMember | null, fallbackId: bigint): string {
  if (member) {
    return member.displayName;
  }
  return `User ${fallbackId}`;
}

/**
 * Helper to get avatar URL for a user
 */
function getUserAvatarUrl(member: GuildMember | User | null): string | null {
  if (member) {
    return member.displayAvatarURL({ size: 64 });
  }
  return null;
}

/**
 * Create an embed for displaying a quote
 */
async function createQuoteEmbed(
  quote: { id: bigint; quote: string | null; quoter_uid: bigint | null; quotee_uid: bigint | null; created_at: Date },
  interaction: ChatInputCommandInteraction | Message
): Promise<EmbedBuilder> {
  const guild = interaction.guild;

  let quoteeMember: GuildMember | null = null;
  let quoterMember: GuildMember | null = null;

  if (guild && quote.quotee_uid) {
    try {
      quoteeMember = await guild.members.fetch(quote.quotee_uid.toString()).catch(() => null);
    } catch {
      // Member not found
    }
  }

  if (guild && quote.quoter_uid) {
    try {
      quoterMember = await guild.members.fetch(quote.quoter_uid.toString()).catch(() => null);
    } catch {
      // Member not found
    }
  }

  const quoteeName = getUserDisplayName(quoteeMember, quote.quotee_uid ?? BigInt(0));
  const quoterName = getUserDisplayName(quoterMember, quote.quoter_uid ?? BigInt(0));

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(quote.quote ?? '')
    .setTimestamp(quote.created_at);

  // Set author (the person being quoted)
  const quoteeAvatarUrl = getUserAvatarUrl(quoteeMember);
  embed.setAuthor({
    name: quoteeName,
    iconURL: quoteeAvatarUrl ?? undefined,
  });

  // Set footer (the person who added the quote)
  const quoterAvatarUrl = getUserAvatarUrl(quoterMember);
  embed.setFooter({
    text: `Quote #${quote.id} by: ${quoterName}`,
    iconURL: quoterAvatarUrl ?? undefined,
  });

  return embed;
}

// Slash command with subcommands
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Manage and view quotes')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription('Get a random quote or a specific quote')
        .addUserOption((option) =>
          option.setName('user').setDescription('Get a random quote from this user')
        )
        .addIntegerOption((option) =>
          option.setName('id').setDescription('Get a specific quote by ID')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a new quote')
        .addUserOption((option) =>
          option.setName('user').setDescription('The user to quote').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('text').setDescription('The quote text').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a quote')
        .addIntegerOption((option) =>
          option.setName('id').setDescription('The quote ID to remove').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all quotes (sent via DM)')
        .addUserOption((option) =>
          option.setName('user').setDescription('Filter quotes by this user')
        )
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
    const serverUid = BigInt(interaction.guild.id);

    try {
      switch (subcommand) {
        case 'get':
          await handleGetQuote(interaction, serverUid);
          break;
        case 'add':
          await handleAddQuote(interaction, serverUid);
          break;
        case 'remove':
          await handleRemoveQuote(interaction, serverUid);
          break;
        case 'list':
          await handleListQuotes(interaction, serverUid);
          break;
      }
    } catch (error) {
      logger.error('Error executing quote command:', error);
      const content = 'An error occurred while processing the quote command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

/**
 * Handle /quote get
 */
async function handleGetQuote(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const user = interaction.options.getUser('user');
  const quoteId = interaction.options.getInteger('id');

  let quote;

  if (quoteId) {
    // Get specific quote by ID
    quote = await prisma.quote.findFirst({
      where: {
        id: BigInt(quoteId),
        server_uid: serverUid,
      },
    });
  } else if (user) {
    // Get random quote from specific user
    quote = await getRandomQuote(serverUid, BigInt(user.id));
  } else {
    // Get random quote from anyone
    quote = await getRandomQuote(serverUid);
  }

  if (!quote) {
    await interaction.reply({ content: 'No quote found.', ephemeral: true });
    return;
  }

  const embed = await createQuoteEmbed(quote, interaction);
  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle /quote add
 */
async function handleAddQuote(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const text = interaction.options.getString('text', true);

  const newQuote = await prisma.quote.create({
    data: {
      server_uid: serverUid,
      quoter_uid: BigInt(interaction.user.id),
      quotee_uid: BigInt(user.id),
      quote: text,
    },
  });

  await interaction.reply(`Quote #${newQuote.id} successfully added`);
}

/**
 * Handle /quote remove
 */
async function handleRemoveQuote(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const quoteId = interaction.options.getInteger('id', true);

  const quote = await prisma.quote.findFirst({
    where: {
      id: BigInt(quoteId),
      server_uid: serverUid,
    },
  });

  if (!quote) {
    await interaction.reply({ content: 'Quote not found.', ephemeral: true });
    return;
  }

  const userId = BigInt(interaction.user.id);

  // Only allow the quoter or quotee to delete
  if (quote.quoter_uid !== userId && quote.quotee_uid !== userId) {
    await interaction.reply({
      content: 'Only the quote author or reporter can delete this quote.',
      ephemeral: true,
    });
    return;
  }

  await prisma.quote.delete({
    where: { id: quote.id },
  });

  await interaction.reply('Quote removed.');
}

/**
 * Handle /quote list
 */
async function handleListQuotes(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const user = interaction.options.getUser('user');

  await interaction.deferReply({ ephemeral: true });

  const whereClause: { server_uid: bigint; quotee_uid?: bigint } = {
    server_uid: serverUid,
  };

  if (user) {
    whereClause.quotee_uid = BigInt(user.id);
  }

  const quotes = await prisma.quote.findMany({
    where: whereClause,
    orderBy: { created_at: 'asc' },
  });

  if (quotes.length === 0) {
    await interaction.editReply('No quotes found.');
    return;
  }

  try {
    // Send quotes via DM
    const dmChannel = await interaction.user.createDM();

    for (const quote of quotes) {
      const embed = await createQuoteEmbed(quote, interaction);
      await dmChannel.send({ embeds: [embed] });
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await interaction.editReply('Please check your direct messages.');
  } catch (error) {
    logger.error('Failed to send DM:', error);
    await interaction.editReply('Failed to send DMs. Please make sure your DMs are open.');
  }
}

// Legacy prefix commands for backward compatibility
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'quote',
    aliases: ['q', 'quotes'],
    description: 'Get a random quote or a specific quote',
    usage: 'quote (@user|id)',
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      const serverUid = BigInt(message.guild.id);
      let quote;

      if (args.length === 0) {
        // Random quote
        quote = await getRandomQuote(serverUid);
      } else if (args.length > 0) {
        const target = args[0]!;
        const userId = target.replace(/[^0-9]/g, '');

        // Try to get user from mention
        const member = await message.guild.members.fetch(userId).catch(() => null);

        if (member) {
          // Random quote from this user
          quote = await getRandomQuote(serverUid, BigInt(member.id));
        } else {
          // Try as quote ID
          quote = await prisma.quote.findFirst({
            where: {
              id: BigInt(userId),
              server_uid: serverUid,
            },
          });
        }
      }

      if (!quote) {
        await message.reply('No quote found.');
        return;
      }

      const embed = await createQuoteEmbed(quote, message);
      await (message.channel as TextChannel).send({ embeds: [embed] });
    },
  },
  {
    name: 'addquote',
    aliases: ['aq'],
    description: 'Add a new quote',
    usage: 'addquote @user [quote text]',
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length < 2) {
        await message.reply('Usage: !addquote @user [quote text]');
        return;
      }

      const targetUserString = args[0]!;
      const quoteText = args.slice(1).join(' ');

      const targetUserId = targetUserString.replace(/[^0-9]/g, '');
      const targetUser = await message.guild.members.fetch(targetUserId).catch(() => null);

      if (!targetUser) {
        await message.reply('Please tag someone to quote');
        return;
      }

      const newQuote = await prisma.quote.create({
        data: {
          server_uid: BigInt(message.guild.id),
          quoter_uid: BigInt(message.author.id),
          quotee_uid: BigInt(targetUser.id),
          quote: quoteText,
        },
      });

      await message.reply(`Quote #${newQuote.id} successfully added`);
    },
  },
  {
    name: 'removequote',
    aliases: [],
    description: 'Remove a quote',
    usage: 'removequote [id]',
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      if (args.length < 1) {
        await message.reply('Please add the quote ID to remove');
        return;
      }

      const quoteId = BigInt(args[0]!);
      const serverUid = BigInt(message.guild.id);

      const quote = await prisma.quote.findFirst({
        where: {
          id: quoteId,
          server_uid: serverUid,
        },
      });

      if (!quote) {
        await message.reply('Quote not found.');
        return;
      }

      const userId = BigInt(message.author.id);

      if (quote.quoter_uid !== userId && quote.quotee_uid !== userId) {
        await message.reply('Only the quote author or reporter can delete this quote.');
        return;
      }

      await prisma.quote.delete({
        where: { id: quote.id },
      });

      await message.reply('Quote removed.');
    },
  },
  {
    name: 'allquotes',
    aliases: [],
    description: 'List all quotes (sent via DM)',
    usage: 'allquotes (@user)',
    async execute(message: Message, args: string[]): Promise<void> {
      if (!message.guild) {
        await message.reply('This command can only be used in a server.');
        return;
      }

      const serverUid = BigInt(message.guild.id);
      const whereClause: { server_uid: bigint; quotee_uid?: bigint } = {
        server_uid: serverUid,
      };

      if (args.length > 0) {
        const targetUserId = args[0]!.replace(/[^0-9]/g, '');
        const targetUser = await message.guild.members.fetch(targetUserId).catch(() => null);
        if (targetUser) {
          whereClause.quotee_uid = BigInt(targetUser.id);
        }
      }

      const quotes = await prisma.quote.findMany({
        where: whereClause,
        orderBy: { created_at: 'asc' },
      });

      if (quotes.length === 0) {
        await message.reply('No quotes found.');
        return;
      }

      try {
        const dmChannel = await message.author.createDM();

        for (const quote of quotes) {
          const embed = await createQuoteEmbed(quote, message);
          await dmChannel.send({ embeds: [embed] });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        await message.reply('Please check your direct messages.');
      } catch (error) {
        logger.error('Failed to send DM:', error);
        await message.reply('Failed to send DMs. Please make sure your DMs are open.');
      }
    },
  },
];

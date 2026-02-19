import type { ChatInputCommandInteraction, GuildMember, Message, User } from 'discord.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { prisma } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Timeout for pagination buttons (2 minutes)
const PAGINATION_TIMEOUT = 120_000;
const EMBED_COLOR = 0x3fb426; // Green color matching Ruby version

/**
 * Helper to get all quotes for pagination
 */
async function getAllQuotes(
  serverUid: bigint,
  quoteeUid?: bigint
): Promise<Awaited<ReturnType<typeof prisma.quote.findMany>>> {
  const whereClause: { server_uid: bigint; quotee_uid?: bigint } = {
    server_uid: serverUid,
  };

  if (quoteeUid) {
    whereClause.quotee_uid = quoteeUid;
  }

  return prisma.quote.findMany({
    where: whereClause,
    orderBy: { id: 'asc' },
  });
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
 * Create pagination buttons for navigating quotes
 */
function createPaginationButtons(
  currentIndex: number,
  totalQuotes: number,
  disabled = false
): ActionRowBuilder<ButtonBuilder> {
  const prevButton = new ButtonBuilder()
    .setCustomId('quote_prev')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalQuotes <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId('quote_next')
    .setEmoji('▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalQuotes <= 1);

  const pageIndicator = new ButtonBuilder()
    .setCustomId('quote_page')
    .setLabel(`${currentIndex + 1} / ${totalQuotes}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, pageIndicator, nextButton);
}

/**
 * Create an embed for displaying a quote
 */
async function createQuoteEmbed(
  quote: {
    id: bigint;
    quote: string | null;
    quoter_uid: bigint | null;
    quotee_uid: bigint | null;
    created_at: Date;
  },
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
 * Handle /quote get - with pagination support
 */
async function handleGetQuote(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const user = interaction.options.getUser('user');
  const quoteId = interaction.options.getInteger('id');

  // If getting a specific quote by ID, no pagination needed
  if (quoteId) {
    const quote = await prisma.quote.findFirst({
      where: {
        id: BigInt(quoteId),
        server_uid: serverUid,
      },
    });

    if (!quote) {
      await interaction.reply({ content: 'No quote found.', ephemeral: true });
      return;
    }

    const embed = await createQuoteEmbed(quote, interaction);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Get all quotes for pagination (filtered by user if specified)
  const quoteeUid = user ? BigInt(user.id) : undefined;
  const quotes = await getAllQuotes(serverUid, quoteeUid);

  if (quotes.length === 0) {
    await interaction.reply({ content: 'No quotes found.', ephemeral: true });
    return;
  }

  // Start at a random index
  let currentIndex = Math.floor(Math.random() * quotes.length);
  const embed = await createQuoteEmbed(quotes[currentIndex], interaction);
  const buttons = createPaginationButtons(currentIndex, quotes.length);

  const response = await interaction.reply({
    embeds: [embed],
    components: [buttons],
    fetchReply: true,
  });

  // Only create collector if there are multiple quotes
  if (quotes.length <= 1) return;

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: PAGINATION_TIMEOUT,
  });

  collector.on('collect', async (buttonInteraction) => {
    // Only allow the original user to navigate
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({
        content: 'Only the person who requested the quote can navigate.',
        ephemeral: true,
      });
      return;
    }

    // Update the index based on which button was pressed
    if (buttonInteraction.customId === 'quote_prev') {
      currentIndex = currentIndex <= 0 ? quotes.length - 1 : currentIndex - 1;
    } else if (buttonInteraction.customId === 'quote_next') {
      currentIndex = currentIndex >= quotes.length - 1 ? 0 : currentIndex + 1;
    }

    const newEmbed = await createQuoteEmbed(quotes[currentIndex], interaction);
    const newButtons = createPaginationButtons(currentIndex, quotes.length);

    await buttonInteraction.update({
      embeds: [newEmbed],
      components: [newButtons],
    });
  });

  collector.on('end', async () => {
    // Disable buttons when collector times out
    const disabledButtons = createPaginationButtons(currentIndex, quotes.length, true);
    try {
      await response.edit({ components: [disabledButtons] });
    } catch {
      // Message may have been deleted
    }
  });
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

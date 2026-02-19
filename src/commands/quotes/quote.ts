import type { ChatInputCommandInteraction, GuildMember, Message, User } from 'discord.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { prisma } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

// Timeout for pagination buttons (2 minutes)
const PAGINATION_TIMEOUT = 120_000;
const EMBED_COLOR = 0x3fb426; // Green color matching Ruby version
const QUOTES_PER_PAGE = 5; // Number of quotes to show per page in list view

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
  totalItems: number,
  disabled = false
): ActionRowBuilder<ButtonBuilder> {
  const prevButton = new ButtonBuilder()
    .setCustomId('quote_prev')
    .setEmoji('◀️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalItems <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId('quote_next')
    .setEmoji('▶️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalItems <= 1);

  const pageIndicator = new ButtonBuilder()
    .setCustomId('quote_page')
    .setLabel(`${currentIndex + 1} / ${totalItems}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalItems <= 1);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, pageIndicator, nextButton);
}

/**
 * Create a modal for jumping to a specific page
 */
function createPageJumpModal(totalPages: number): ModalBuilder {
  const pageInput = new TextInputBuilder()
    .setCustomId('page_number')
    .setPlaceholder(`1-${totalPages}`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(String(totalPages).length + 1);

  // Use the data property to set the label directly to avoid deprecated setLabel
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  pageInput.setLabel(`Enter page number (1-${totalPages})`);

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pageInput);

  const modal = new ModalBuilder()
    .setCustomId('quote_page_jump')
    .setTitle('Jump to Page');

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  modal.setComponents([actionRow]);

  return modal;
}

/**
 * Create a combined embed for displaying multiple quotes on a page
 */
async function createQuoteListEmbed(
  quotes: {
    id: bigint;
    quote: string | null;
    quoter_uid: bigint | null;
    quotee_uid: bigint | null;
    created_at: Date;
  }[],
  interaction: ChatInputCommandInteraction,
  pageNumber: number,
  totalPages: number
): Promise<EmbedBuilder> {
  const guild = interaction.guild;
  const lines: string[] = [];

  for (const quote of quotes) {
    let quoteeName = `User ${quote.quotee_uid}`;
    if (guild && quote.quotee_uid) {
      try {
        const member = await guild.members.fetch(quote.quotee_uid.toString()).catch(() => null);
        if (member) {
          quoteeName = member.displayName;
        }
      } catch {
        // Member not found
      }
    }

    // Format: **#ID - QuoteeName**: "quote text"
    const truncatedQuote =
      quote.quote && quote.quote.length > 100
        ? quote.quote.substring(0, 100) + '...'
        : (quote.quote ?? '');
    lines.push(`**#${quote.id} - ${quoteeName}**: "${truncatedQuote}"`);
  }

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle('Quote List')
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `Page ${pageNumber} of ${totalPages}` });
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
    )
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    // In DMs, use the user's ID as the "server" ID for personal quotes
    const serverUid = interaction.guild
      ? BigInt(interaction.guild.id)
      : BigInt(interaction.user.id);

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

  const responseData = await interaction.reply({
    embeds: [embed],
    components: [buttons],
    withResponse: true,
  });
  const response = responseData.resource?.message;

  // Only create collector if there are multiple quotes
  if (quotes.length <= 1 || !response) {
    return;
  }

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: PAGINATION_TIMEOUT,
  });

  collector.on('collect', (buttonInteraction) => {
    // Only allow the original user to navigate
    if (buttonInteraction.user.id !== interaction.user.id) {
      void buttonInteraction.reply({
        content: 'Only the person who requested the quote can navigate.',
        ephemeral: true,
      });
      return;
    }

    // Handle page jump modal
    if (buttonInteraction.customId === 'quote_page') {
      const modal = createPageJumpModal(quotes.length);
      void buttonInteraction.showModal(modal);

      void (async (): Promise<void> => {
        try {
          const modalInteraction = await buttonInteraction.awaitModalSubmit({
            time: 60_000,
            filter: (i) => i.customId === 'quote_page_jump' && i.user.id === interaction.user.id,
          });

          const pageInput = modalInteraction.fields.getTextInputValue('page_number');
          const pageNumber = parseInt(pageInput, 10);

          if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > quotes.length) {
            await modalInteraction.reply({
              content: `Please enter a valid page number between 1 and ${quotes.length}.`,
              ephemeral: true,
            });
            return;
          }

          currentIndex = pageNumber - 1;
          const newEmbed = await createQuoteEmbed(quotes[currentIndex], interaction);
          const newButtons = createPaginationButtons(currentIndex, quotes.length);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Discord.js ModalSubmitInteraction.update() type resolution issue
          await modalInteraction.update({
            embeds: [newEmbed],
            components: [newButtons],
          });
        } catch {
          // Modal timed out or was dismissed
        }
      })();
      return;
    }

    // Update the index based on which button was pressed
    if (buttonInteraction.customId === 'quote_prev') {
      currentIndex = currentIndex <= 0 ? quotes.length - 1 : currentIndex - 1;
    } else if (buttonInteraction.customId === 'quote_next') {
      currentIndex = currentIndex >= quotes.length - 1 ? 0 : currentIndex + 1;
    }

    const handleUpdate = async (): Promise<void> => {
      const newEmbed = await createQuoteEmbed(quotes[currentIndex], interaction);
      const newButtons = createPaginationButtons(currentIndex, quotes.length);

      await buttonInteraction.update({
        embeds: [newEmbed],
        components: [newButtons],
      });
    };
    void handleUpdate();
  });

  collector.on('end', () => {
    // Disable buttons when collector times out
    const disabledButtons = createPaginationButtons(currentIndex, quotes.length, true);
    void response.edit({ components: [disabledButtons] }).catch(() => {
      // Message may have been deleted
    });
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
 * Handle /quote list - with pagination in DM (5 quotes per page)
 */
async function handleListQuotes(
  interaction: ChatInputCommandInteraction,
  serverUid: bigint
): Promise<void> {
  const user = interaction.options.getUser('user');

  await interaction.deferReply({ ephemeral: true });

  const quoteeUid = user ? BigInt(user.id) : undefined;
  const quotes = await getAllQuotes(serverUid, quoteeUid);

  if (quotes.length === 0) {
    await interaction.editReply('No quotes found.');
    return;
  }

  try {
    // Send paginated quotes via DM
    const dmChannel = await interaction.user.createDM();

    const totalPages = Math.ceil(quotes.length / QUOTES_PER_PAGE);
    let currentPage = 0;

    const getPageQuotes = (page: number): typeof quotes => {
      const start = page * QUOTES_PER_PAGE;
      return quotes.slice(start, start + QUOTES_PER_PAGE);
    };

    const embed = await createQuoteListEmbed(
      getPageQuotes(currentPage),
      interaction,
      currentPage + 1,
      totalPages
    );
    const buttons = createPaginationButtons(currentPage, totalPages);

    const dmMessage = await dmChannel.send({
      embeds: [embed],
      components: [buttons],
    });

    await interaction.editReply('Please check your direct messages.');

    // Only create collector if there are multiple pages
    if (totalPages <= 1) {
      return;
    }

    const collector = dmMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PAGINATION_TIMEOUT,
    });

    collector.on('collect', (buttonInteraction) => {
      // Handle page jump modal
      if (buttonInteraction.customId === 'quote_page') {
        const modal = createPageJumpModal(totalPages);
        void buttonInteraction.showModal(modal);

        void (async (): Promise<void> => {
          try {
            const modalInteraction = await buttonInteraction.awaitModalSubmit({
              time: 60_000,
              filter: (i) => i.customId === 'quote_page_jump' && i.user.id === interaction.user.id,
            });

            const pageInput = modalInteraction.fields.getTextInputValue('page_number');
            const pageNumber = parseInt(pageInput, 10);

            if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
              await modalInteraction.reply({
                content: `Please enter a valid page number between 1 and ${totalPages}.`,
                ephemeral: true,
              });
              return;
            }

            currentPage = pageNumber - 1;
            const newEmbed = await createQuoteListEmbed(
              getPageQuotes(currentPage),
              interaction,
              currentPage + 1,
              totalPages
            );
            const newButtons = createPaginationButtons(currentPage, totalPages);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Discord.js ModalSubmitInteraction.update() type resolution issue
            await modalInteraction.update({
              embeds: [newEmbed],
              components: [newButtons],
            });
          } catch {
            // Modal timed out or was dismissed
          }
        })();
        return;
      }

      // Update the page based on which button was pressed
      if (buttonInteraction.customId === 'quote_prev') {
        currentPage = currentPage <= 0 ? totalPages - 1 : currentPage - 1;
      } else if (buttonInteraction.customId === 'quote_next') {
        currentPage = currentPage >= totalPages - 1 ? 0 : currentPage + 1;
      }

      const handleUpdate = async (): Promise<void> => {
        const newEmbed = await createQuoteListEmbed(
          getPageQuotes(currentPage),
          interaction,
          currentPage + 1,
          totalPages
        );
        const newButtons = createPaginationButtons(currentPage, totalPages);

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [newButtons],
        });
      };
      void handleUpdate();
    });

    collector.on('end', () => {
      // Disable buttons when collector times out
      const disabledButtons = createPaginationButtons(currentPage, totalPages, true);
      void dmMessage.edit({ components: [disabledButtons] }).catch(() => {
        // Message may have been deleted
      });
    });
  } catch (error) {
    logger.error('Failed to send DM:', error);
    await interaction.editReply('Failed to send DMs. Please make sure your DMs are open.');
  }
}

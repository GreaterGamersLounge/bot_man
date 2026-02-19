import type {
  ChatInputCommandInteraction,
  GuildEmoji,
  TextChannel
} from 'discord.js';
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import { logger } from '../../lib/logger.js';
import { ReactionService } from '../../services/reactionService.js';
import type { SlashCommand } from '../../types/command.js';

const EMBED_COLOR = 0x3fb426; // Green color matching Ruby version

/**
 * Parse emoji string to extract the key for storage
 * Custom emoji format: <:name:id> or <a:name:id> (animated)
 * Unicode emoji: just the emoji character
 */
function parseEmojiKey(emoji: string): string {
  // Check if it's a custom emoji
  const customMatch = /<a?:(\w+):(\d+)>/.exec(emoji);
  if (customMatch) {
    return `${customMatch[1]}:${customMatch[2]}`;
  }
  // It's a unicode emoji
  return emoji;
}

/**
 * Get the reaction string for adding to a message
 * Custom emoji format: name:id
 * Unicode emoji: just the emoji character
 */
function getReactionKey(emoji: string): string {
  const customMatch = /<a?:(\w+:\d+)>/.exec(emoji);
  if (customMatch?.[1]) {
    return customMatch[1];
  }
  return emoji;
}

/**
 * Check if emoji is available in the server (for custom emojis)
 */
function isEmojiInServer(guildEmojis: Map<string, GuildEmoji>, emoji: string): boolean {
  // If it's not a custom emoji, it's always available
  if (!emoji.includes(':')) {return true;}

  const customMatch = /<a?:\w+:(\d+)>/.exec(emoji);
  if (!customMatch?.[1]) {return true;}

  const emojiId = customMatch[1];
  return guildEmojis.has(emojiId);
}

/**
 * Create a Discord message URL
 */
function discordUrl(guildId: string, channelId: string, messageId: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

// Slash command with subcommands
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a reaction role to a message')
        .addStringOption((option) =>
          option.setName('message_id').setDescription('The message ID').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('emoji').setDescription('The emoji to react with').setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName('role').setDescription('The role to assign').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a reaction role from a message')
        .addStringOption((option) =>
          option.setName('message_id').setDescription('The message ID').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('emoji').setDescription('The emoji to remove').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('Remove all reaction roles from a message')
        .addStringOption((option) =>
          option.setName('message_id').setDescription('The message ID').setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: 'This command can only be used in a server text channel.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'add':
          await handleAddReactionRole(interaction);
          break;
        case 'remove':
          await handleRemoveReactionRole(interaction);
          break;
        case 'clear':
          await handleClearReactionRoles(interaction);
          break;
      }
    } catch (error) {
      logger.error('Error executing reactionrole command:', error);
      const content = 'An error occurred while processing the reaction role command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },
};

/**
 * Handle /reactionrole add
 */
async function handleAddReactionRole(interaction: ChatInputCommandInteraction): Promise<void> {
  const messageId = interaction.options.getString('message_id', true);
  const emoji = interaction.options.getString('emoji', true);
  const role = interaction.options.getRole('role', true);

  const channel = interaction.channel as TextChannel;

  // Validate message exists
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    await interaction.reply({
      content: 'Please supply a message_id from this channel',
      ephemeral: true,
    });
    return;
  }

  // Validate emoji is from this server (for custom emojis)
  if (!interaction.guild || !isEmojiInServer(interaction.guild.emojis.cache, emoji)) {
    await interaction.reply({
      content: 'Please supply an emoji from this server',
      ephemeral: true,
    });
    return;
  }

  // Add reaction to the message
  const reactionKey = getReactionKey(emoji);
  try {
    await message.react(reactionKey);
  } catch (error) {
    logger.error('Failed to add reaction:', error);
    await interaction.reply({
      content: 'Failed to add reaction. Make sure the emoji is valid.',
      ephemeral: true,
    });
    return;
  }

  // Save to database
  const parsedEmoji = parseEmojiKey(emoji);
  await ReactionService.addReactionRole(
    BigInt(messageId),
    parsedEmoji,
    BigInt(role.id)
  );

  const messageUrl = discordUrl(interaction.guildId ?? '', channel.id, messageId);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(`<@&${role.id}> successfully linked to ${emoji} for [this message](${messageUrl})`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle /reactionrole remove
 */
async function handleRemoveReactionRole(interaction: ChatInputCommandInteraction): Promise<void> {
  const messageId = interaction.options.getString('message_id', true);
  const emoji = interaction.options.getString('emoji', true);

  const channel = interaction.channel as TextChannel;

  // Validate message exists
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    await interaction.reply({
      content: 'Please supply a message_id from this channel',
      ephemeral: true,
    });
    return;
  }

  const parsedEmoji = parseEmojiKey(emoji);

  // Remove from database
  const deleted = await ReactionService.removeReactionRole(BigInt(messageId), parsedEmoji);

  if (!deleted) {
    await interaction.reply({
      content: 'Not a valid message/emoji combination.',
      ephemeral: true,
    });
    return;
  }

  // Remove reactions from the message
  try {
    const reactionKey = getReactionKey(emoji);
    const reaction = message.reactions.cache.get(reactionKey);
    if (reaction) {
      await reaction.remove();
    }
  } catch (error) {
    logger.warn('Failed to remove reaction from message:', error);
  }

  const messageUrl = discordUrl(interaction.guildId ?? '', channel.id, messageId);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(`Successfully removed ${emoji} for [this message](${messageUrl})`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle /reactionrole clear
 */
async function handleClearReactionRoles(interaction: ChatInputCommandInteraction): Promise<void> {
  const messageId = interaction.options.getString('message_id', true);

  const channel = interaction.channel as TextChannel;

  // Validate message exists
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    await interaction.reply({
      content: 'Please supply a message_id from this channel',
      ephemeral: true,
    });
    return;
  }

  // Get all reaction roles for this message
  const reactionRoles = await ReactionService.getReactionRolesForMessage(BigInt(messageId));

  if (reactionRoles.length === 0) {
    await interaction.reply({
      content: 'There are no reaction roles on that message',
      ephemeral: true,
    });
    return;
  }

  // Remove all reactions from the message
  try {
    await message.reactions.removeAll();
  } catch (error) {
    logger.warn('Failed to remove reactions from message:', error);
  }

  // Delete all reaction roles from database
  await ReactionService.removeAllReactionRoles(BigInt(messageId));

  const messageUrl = discordUrl(interaction.guildId ?? '', channel.id, messageId);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(`Successfully removed all reaction roles for [this message](${messageUrl})`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

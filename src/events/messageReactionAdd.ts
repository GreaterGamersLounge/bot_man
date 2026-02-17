import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { ReactionService } from '../services/reactionService.js';
import type { BotEvent } from '../types/index.js';

// Quote emoji for quote-via-reaction feature
const QUOTE_EMOJI = '📖';

const event: BotEvent<'messageReactionAdd'> = {
  name: 'messageReactionAdd',
  once: false,

  async execute(client, reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    // Ignore bot reactions
    if (user.bot) return;

    try {
      // Fetch partial reaction if needed
      if (reaction.partial) {
        await reaction.fetch();
      }

      // Fetch partial user if needed
      if (user.partial) {
        await user.fetch();
      }

      const message = reaction.message;
      const guild = message.guild;

      if (!guild) return; // Ignore DM reactions

      // Get the emoji key (for both custom and unicode emojis)
      const emojiKey = getEmojiKey(reaction);

      logger.debug(`Reaction added: ${emojiKey} on message ${message.id} by ${user.username}`);

      // Check for reaction role
      await handleReactionRole(guild, message.id, emojiKey, user.id, 'add');

      // Check for quote-via-reaction
      if (reaction.emoji.name === QUOTE_EMOJI) {
        await handleQuoteReaction(message, user as User);
      }
    } catch (error) {
      logger.error('Error handling reaction add:', error);
    }
  },
};

/**
 * Get a consistent emoji key for database lookup
 * Custom emojis: "name:id" format
 * Unicode emojis: the emoji character itself
 */
function getEmojiKey(reaction: MessageReaction | PartialMessageReaction): string {
  const emoji = reaction.emoji;

  // Custom emoji
  if (emoji.id) {
    return `${emoji.name}:${emoji.id}`;
  }

  // Unicode emoji
  return emoji.name ?? '';
}

/**
 * Handle reaction role add/remove
 */
async function handleReactionRole(
  guild: NonNullable<MessageReaction['message']['guild']>,
  messageId: string,
  emojiKey: string,
  userId: string,
  action: 'add' | 'remove'
): Promise<void> {
  try {
    const roleId = await ReactionService.getRoleForReaction(BigInt(messageId), emojiKey);

    if (!roleId) return; // No reaction role configured for this emoji

    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(roleId.toString());

    if (!role) {
      logger.warn(`Role ${roleId} not found in guild ${guild.name}`);
      return;
    }

    if (action === 'add') {
      await member.roles.add(role, 'Adding reaction-based role');
      logger.debug(`Added role ${role.name} to ${member.user.username}`);
    } else {
      await member.roles.remove(role, 'Removing reaction-based role');
      logger.debug(`Removed role ${role.name} from ${member.user.username}`);
    }
  } catch (error) {
    logger.error(`Failed to ${action} reaction role:`, error);
  }
}

/**
 * Handle quote-via-reaction feature
 * When a user reacts with 📖, add the message as a quote
 */
async function handleQuoteReaction(
  message: MessageReaction['message'],
  quoter: User
): Promise<void> {
  if (!message.guild) return;

  const quote = message.content;

  // Ignore empty messages (e.g., image-only)
  if (!quote || quote.trim() === '') return;

  try {
    // Check if this message is already quoted
    const existing = await prisma.quote.findFirst({
      where: {
        server_uid: BigInt(message.guild.id),
        message_id: BigInt(message.id),
      },
    });

    if (existing) {
      logger.debug(`Message ${message.id} is already quoted`);
      return;
    }

    // Create the quote
    const newQuote = await prisma.quote.create({
      data: {
        server_uid: BigInt(message.guild.id),
        quoter_uid: BigInt(quoter.id),
        quotee_uid: BigInt(message.author?.id ?? '0'),
        quote,
        message_id: BigInt(message.id),
      },
    });

    // Send confirmation
    if ('send' in message.channel) {
      await message.channel.send(`Quote #${newQuote.id} successfully added via reaction!`);
    }
    logger.info(`Quote #${newQuote.id} added via reaction by ${quoter.username}`);
  } catch (error) {
    logger.error('Failed to create quote via reaction:', error);
  }
}

export default event;

// Export the handleReactionRole function for use in messageReactionRemove
export { getEmojiKey, handleReactionRole };

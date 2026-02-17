import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { logger } from '../lib/logger.js';
import { getEmojiKey, handleReactionRole } from './messageReactionAdd.js';
import type { BotEvent } from '../types/index.js';

const event: BotEvent<'messageReactionRemove'> = {
  name: 'messageReactionRemove',
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

      logger.debug(`Reaction removed: ${emojiKey} on message ${message.id} by ${user.username}`);

      // Check for reaction role and remove it
      await handleReactionRole(guild, message.id, emojiKey, user.id, 'remove');
    } catch (error) {
      logger.error('Error handling reaction remove:', error);
    }
  },
};

export default event;

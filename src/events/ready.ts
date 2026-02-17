import { ActivityType, Collection } from 'discord.js';
import { getConfig } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import type { BotEvent, InviteCacheEntry } from '../types/index.js';

const event: BotEvent<'ready'> = {
  name: 'ready',
  once: true,

  async execute(client) {
    const config = getConfig();

    logger.info(`Logged in as ${client.user?.tag ?? 'Unknown'}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    // Set bot presence
    client.user?.setActivity({
      name: '/help | Bot_Man',
      type: ActivityType.Listening,
    });

    // Cache invites for all guilds (for invite tracking)
    if (config.isDev) {
      logger.info('Development mode - invite caching enabled');
    }

    for (const guild of client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        const inviteMap = new Collection<string, InviteCacheEntry>();

        for (const invite of invites.values()) {
          inviteMap.set(invite.code, {
            code: invite.code,
            uses: invite.uses ?? 0,
            inviterId: invite.inviter?.id ?? null,
            maxUses: invite.maxUses,
            expiresAt: invite.expiresAt,
          });
        }

        client.inviteCache.set(guild.id, inviteMap);
        logger.debug(`Cached ${invites.size} invites for guild: ${guild.name}`);
      } catch (error) {
        logger.warn(`Failed to cache invites for guild ${guild.name}:`, error);
      }
    }

    logger.info('Bot_Man is ready!');
  },
};

export default event;

import { Collection, type Guild } from 'discord.js';
import { logger } from '../lib/logger.js';
import { InviteService } from '../services/inviteService.js';
import { ServerService } from '../services/serverService.js';
import { UserService } from '../services/userService.js';
import type { BotEvent, InviteCacheEntry } from '../types/index.js';

const event: BotEvent<'guildCreate'> = {
  name: 'guildCreate',
  once: false,

  async execute(client, guild: Guild) {
    logger.info(`Joined new guild: ${guild.name} (${guild.id})`);

    // Sync server to database
    await syncServer(guild);

    // Sync all users in the guild
    await syncUsers(guild);

    // Cache invites for the new guild
    await cacheInvites(client, guild);

    logger.info(`Successfully synced guild: ${guild.name}`);
  },
};

/**
 * Sync server information to database
 */
async function syncServer(guild: Guild): Promise<void> {
  try {
    await ServerService.syncServer({
      uid: BigInt(guild.id),
      name: guild.name,
      iconId: guild.icon ?? '',
      ownerUid: BigInt(guild.ownerId),
      regionId: guild.preferredLocale ?? 'unknown',
      afkChannelUid: guild.afkChannelId ? BigInt(guild.afkChannelId) : undefined,
      systemChannelUid: guild.systemChannelId ? BigInt(guild.systemChannelId) : undefined,
      large: guild.large,
      afkTimeout: guild.afkTimeout ? BigInt(guild.afkTimeout) : undefined,
      verificationLevel: guild.verificationLevel.toString(),
      memberCount: BigInt(guild.memberCount),
      creationTime: guild.createdAt,
    });
    logger.debug(`Synced server: ${guild.name}`);
  } catch (error) {
    logger.error(`Failed to sync server ${guild.name}:`, error);
  }
}

/**
 * Sync all users in the guild to database
 */
async function syncUsers(guild: Guild): Promise<void> {
  try {
    // Fetch all members if not cached
    const members = guild.members.cache.size > 0
      ? guild.members.cache
      : await guild.members.fetch();

    for (const member of members.values()) {
      try {
        await UserService.syncUser({
          uid: BigInt(member.id),
          name: member.user.username,
          discriminator: member.user.discriminator !== '0' ? member.user.discriminator : undefined,
          avatarUrl: member.user.displayAvatarURL(),
          botAccount: member.user.bot,
        });
      } catch (error) {
        logger.warn(`Failed to sync user ${member.user.username}:`, error);
      }
    }
    logger.debug(`Synced ${members.size} users for guild: ${guild.name}`);
  } catch (error) {
    logger.error(`Failed to sync users for guild ${guild.name}:`, error);
  }
}

/**
 * Cache invites and sync to database
 */
async function cacheInvites(client: Parameters<BotEvent['execute']>[0], guild: Guild): Promise<void> {
  try {
    const invites = await guild.invites.fetch();
    const inviteMap = new Collection<string, InviteCacheEntry>();

    for (const invite of invites.values()) {
      // Cache locally
      inviteMap.set(invite.code, {
        code: invite.code,
        uses: invite.uses ?? 0,
        inviterId: invite.inviter?.id ?? null,
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt,
      });

      // Sync to database
      if (invite.inviter) {
        try {
          await InviteService.upsertInvite({
            code: invite.code,
            serverUid: BigInt(guild.id),
            inviterUid: BigInt(invite.inviter.id),
            channelUid: invite.channelId ?? '',
            uses: invite.uses ?? 0,
            maxUses: invite.maxUses ?? undefined,
            temporary: invite.temporary ?? false,
            expires: invite.expiresAt ?? undefined,
          });
        } catch (error) {
          logger.warn(`Failed to sync invite ${invite.code}:`, error);
        }
      }
    }

    client.inviteCache.set(guild.id, inviteMap);
    logger.debug(`Cached ${invites.size} invites for new guild: ${guild.name}`);

    // Mark any invites not in the current list as inactive
    const currentCodes = Array.from(invites.values()).map((i) => i.code);
    // This would require additional database query - marking for future enhancement
  } catch (error) {
    logger.warn(`Failed to cache invites for guild ${guild.name}:`, error);
  }
}

export default event;

import { Collection, type GuildMember } from 'discord.js';
import { logger } from '../lib/logger.js';
import { InviteService } from '../services/inviteService.js';
import { UserService } from '../services/userService.js';
import type { BotEvent, InviteCacheEntry } from '../types/index.js';

const event: BotEvent<'guildMemberAdd'> = {
  name: 'guildMemberAdd',
  once: false,

  async execute(client, member: GuildMember) {
    logger.debug(`Member joined: ${member.user.username} in ${member.guild.name}`);

    // Sync user to database
    await UserService.syncUser({
      uid: BigInt(member.id),
      name: member.user.username,
      discriminator: member.user.discriminator !== '0' ? member.user.discriminator : undefined,
      avatarUrl: member.user.displayAvatarURL(),
      botAccount: member.user.bot,
    });

    // Track which invite was used
    await trackInviteUsage(client, member);
  },
};

/**
 * Determine which invite was used by comparing cached invites with current invites
 */
async function trackInviteUsage(
  client: Parameters<BotEvent['execute']>[0],
  member: GuildMember
): Promise<void> {
  const guild = member.guild;

  try {
    // Get cached invites
    const cachedInvites = client.inviteCache.get(guild.id);
    if (!cachedInvites) {
      logger.warn(`No cached invites for guild ${guild.name}`);
      return;
    }

    // Fetch current invites
    const currentInvites = await guild.invites.fetch();

    // Find the invite that was used (use count increased)
    let usedInvite: { code: string; inviterId: string | null } | null = null;

    for (const invite of currentInvites.values()) {
      const cached = cachedInvites.get(invite.code);

      // If invite exists in cache and uses increased, this is the one
      if (cached && invite.uses !== null && invite.uses > cached.uses) {
        usedInvite = {
          code: invite.code,
          inviterId: invite.inviter?.id ?? null,
        };
        break;
      }
    }

    // If no invite found with increased uses, check for deleted one-time invites
    if (!usedInvite) {
      for (const [code, cached] of cachedInvites.entries()) {
        const stillExists = currentInvites.has(code);
        // If invite was one-time (maxUses = 1) and no longer exists, it was used
        if (!stillExists && cached.maxUses === 1) {
          usedInvite = {
            code,
            inviterId: cached.inviterId,
          };
          break;
        }
      }
    }

    // Update the invite cache
    const newInviteMap = new Collection<string, InviteCacheEntry>();
    for (const invite of currentInvites.values()) {
      newInviteMap.set(invite.code, {
        code: invite.code,
        uses: invite.uses ?? 0,
        inviterId: invite.inviter?.id ?? null,
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt,
      });
    }
    client.inviteCache.set(guild.id, newInviteMap);

    // Record the invite usage
    if (usedInvite) {
      logger.info(
        `Member ${member.user.username} joined via invite ${usedInvite.code}` +
          (usedInvite.inviterId ? ` from user ${usedInvite.inviterId}` : '')
      );

      await InviteService.recordInviteUsage(usedInvite.code, BigInt(member.id));
    } else {
      logger.debug(`Could not determine which invite was used for ${member.user.username}`);
    }
  } catch (error) {
    logger.error(`Failed to track invite usage for ${member.user.username}:`, error);
  }
}

export default event;

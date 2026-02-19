import { Collection, type Invite } from 'discord.js';
import { logger } from '../lib/logger.js';
import { InviteService } from '../services/inviteService.js';
import type { BotEvent, InviteCacheEntry } from '../types/index.js';

const event: BotEvent<'inviteCreate'> = {
  name: 'inviteCreate',
  once: false,

  async execute(client, invite: Invite) {
    if (!invite.guild) {return;}

    logger.debug(`Invite created: ${invite.code} in ${invite.guild.name}`);

    try {
      // Add to local cache
      let inviteMap = client.inviteCache.get(invite.guild.id);
      if (!inviteMap) {
        inviteMap = new Collection<string, InviteCacheEntry>();
        client.inviteCache.set(invite.guild.id, inviteMap);
      }

      inviteMap.set(invite.code, {
        code: invite.code,
        uses: invite.uses ?? 0,
        inviterId: invite.inviter?.id ?? null,
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt,
      });

      // Save to database
      if (invite.inviter) {
        await InviteService.upsertInvite({
          code: invite.code,
          serverUid: BigInt(invite.guild.id),
          inviterUid: BigInt(invite.inviter.id),
          channelUid: invite.channelId ?? '',
          uses: invite.uses ?? 0,
          maxUses: invite.maxUses ?? undefined,
          temporary: invite.temporary ?? false,
          expires: invite.expiresAt ?? undefined,
        });

        logger.info(
          `Invite ${invite.code} created by ${invite.inviter.username} in ${invite.guild.name}`
        );
      }
    } catch (error) {
      logger.error(`Failed to handle invite create for ${invite.code}:`, error);
    }
  },
};

export default event;

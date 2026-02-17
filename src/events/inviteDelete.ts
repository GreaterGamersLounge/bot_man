import { AuditLogEvent, type Guild, type Invite } from 'discord.js';
import { logger } from '../lib/logger.js';
import { InviteService } from '../services/inviteService.js';
import type { BotEvent } from '../types/index.js';

const event: BotEvent<'inviteDelete'> = {
  name: 'inviteDelete',
  once: false,

  async execute(client, invite: Invite) {
    if (!invite.guild) return;

    logger.debug(`Invite deleted: ${invite.code} in ${invite.guild.name}`);

    try {
      // Remove from local cache
      const inviteMap = client.inviteCache.get(invite.guild.id);
      if (inviteMap) {
        inviteMap.delete(invite.code);
      }

      // Try to get the deleter from audit logs
      let deleterUid: bigint | undefined;
      try {
        // Type guard to ensure we have a full Guild (not InviteGuild)
        const guild = invite.guild as Guild;
        if (!guild.fetchAuditLogs) {
          throw new Error('Cannot fetch audit logs from InviteGuild');
        }

        const auditLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.InviteDelete,
          limit: 1,
        });

        const deleteLog = auditLogs.entries.first();
        if (deleteLog && deleteLog.target && 'code' in deleteLog.target) {
          // Verify this audit log is for the same invite
          if (deleteLog.target.code === invite.code) {
            deleterUid = deleteLog.executor ? BigInt(deleteLog.executor.id) : undefined;
          }
        }
      } catch (error) {
        logger.warn(`Failed to fetch audit log for invite delete:`, error);
      }

      // Mark as inactive in database
      await InviteService.markDeleted(invite.code, deleterUid);

      logger.info(
        `Invite ${invite.code} deleted in ${invite.guild.name}` +
          (deleterUid ? ` by user ${deleterUid}` : '')
      );
    } catch (error) {
      logger.error(`Failed to handle invite delete for ${invite.code}:`, error);
    }
  },
};

export default event;

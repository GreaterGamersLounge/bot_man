import type { invite } from '@prisma/client';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

/**
 * InviteService handles operations related to Discord invites and invite tracking
 */
export class InviteService {
  /**
   * Create or update an invite record
   */
  static async upsertInvite(inviteData: {
    code: string;
    serverUid: bigint;
    inviterUid: bigint;
    channelUid: string;
    uses: number;
    maxUses?: number;
    temporary: boolean;
    expires?: Date;
  }): Promise<invite> {
    try {
      // Find existing invite by code
      const existing = await prisma.invite.findFirst({
        where: { code: inviteData.code },
      });

      if (existing) {
        return await prisma.invite.update({
          where: { id: existing.id },
          data: {
            uses: inviteData.uses,
            max_uses: inviteData.maxUses,
          },
        });
      }

      return await prisma.invite.create({
        data: {
          code: inviteData.code,
          server_uid: inviteData.serverUid,
          inviter_uid: inviteData.inviterUid,
          channel_uid: inviteData.channelUid,
          uses: inviteData.uses,
          max_uses: inviteData.maxUses,
          temporary: inviteData.temporary,
          expires: inviteData.expires,
          active: true,
        },
      });
    } catch (error) {
      logger.error(`Failed to upsert invite ${inviteData.code}:`, error);
      throw error;
    }
  }

  /**
   * Mark an invite as deleted
   */
  static async markDeleted(code: string, deleterUid?: bigint): Promise<void> {
    try {
      await prisma.invite.updateMany({
        where: { code, active: true },
        data: {
          active: false,
          deleter_uid: deleterUid,
        },
      });
      logger.debug(`Marked invite ${code} as deleted`);
    } catch (error) {
      logger.error(`Failed to mark invite ${code} as deleted:`, error);
      throw error;
    }
  }

  /**
   * Record that a user joined via a specific invite
   */
  static async recordInviteUsage(inviteCode: string, userUid: bigint): Promise<void> {
    try {
      const invite = await prisma.invite.findFirst({
        where: { code: inviteCode },
      });

      if (!invite) {
        logger.warn(`Invite ${inviteCode} not found for usage recording`);
        return;
      }

      await prisma.invite_discord_user.create({
        data: {
          invite_id: invite.id,
          discord_user_uid: userUid,
        },
      });

      // Update use count
      await prisma.invite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      });

      logger.debug(`Recorded invite usage: ${inviteCode} by user ${userUid}`);
    } catch (error) {
      logger.error(`Failed to record invite usage:`, error);
      throw error;
    }
  }

  /**
   * Get active invites for a server
   */
  static async getActiveInvites(serverUid: bigint) {
    return prisma.invite.findMany({
      where: {
        server_uid: serverUid,
        active: true,
      },
      orderBy: { uses: 'desc' },
    });
  }

  /**
   * Get invite statistics for a server
   */
  static async getInviteStats(serverUid: bigint) {
    const invites = await prisma.invite.findMany({
      where: { server_uid: serverUid },
      include: {
        invite_discord_users: true,
      },
    });

    const stats = new Map<bigint, { inviterUid: bigint; totalUses: number; activeInvites: number }>();

    for (const invite of invites) {
      const existing = stats.get(invite.inviter_uid) ?? {
        inviterUid: invite.inviter_uid,
        totalUses: 0,
        activeInvites: 0,
      };

      existing.totalUses += invite.invite_discord_users.length;
      if (invite.active) {
        existing.activeInvites++;
      }

      stats.set(invite.inviter_uid, existing);
    }

    return Array.from(stats.values()).sort((a, b) => b.totalUses - a.totalUses);
  }
}

export default InviteService;

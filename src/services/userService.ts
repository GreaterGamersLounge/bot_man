import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

/**
 * UserService handles operations related to Discord users
 */
export class UserService {
  /**
   * Sync or create a Discord user record
   */
  static async syncUser(userData: {
    uid: bigint;
    name: string;
    discriminator?: string;
    avatarUrl?: string;
    botAccount: boolean;
  }): Promise<void> {
    try {
      await prisma.discord_user.upsert({
        where: { uid: userData.uid },
        create: {
          uid: userData.uid,
          name: userData.name,
          discriminator: userData.discriminator,
          avatar_url: userData.avatarUrl,
          bot_account: userData.botAccount,
        },
        update: {
          name: userData.name,
          discriminator: userData.discriminator,
          avatar_url: userData.avatarUrl,
          bot_account: userData.botAccount,
        },
      });
      logger.debug(`Synced user: ${userData.name}`);
    } catch (error) {
      logger.error(`Failed to sync user ${userData.name}:`, error);
      throw error;
    }
  }

  /**
   * Get a Discord user by their UID
   */
  static async getByUid(uid: bigint) {
    return prisma.discord_user.findUnique({
      where: { uid },
    });
  }

  /**
   * Get a Discord user with their invite history
   */
  static async getWithInvites(uid: bigint) {
    return prisma.discord_user.findUnique({
      where: { uid },
      include: {
        invite_discord_users: {
          include: {
            invite: true,
          },
        },
      },
    });
  }
}

export default UserService;

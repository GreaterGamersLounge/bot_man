import type { discord_user } from '@prisma/client';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

/**
 * Sync or create a Discord user record
 */
export async function syncUser(userData: {
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
export async function getByUid(uid: bigint): Promise<discord_user | null> {
  return prisma.discord_user.findUnique({
    where: { uid },
  });
}

/**
 * Get a Discord user with their invite history
 */
export async function getWithInvites(uid: bigint): Promise<discord_user | null> {
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

// Re-export all functions as a namespace-like object for backward compatibility
export const UserService = {
  syncUser,
  getByUid,
  getWithInvites,
};

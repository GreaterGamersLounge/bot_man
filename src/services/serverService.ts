import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

/**
 * ServerService handles operations related to Discord servers/guilds
 */
export class ServerService {
  /**
   * Sync or create a server record from Discord guild data
   */
  static async syncServer(guildData: {
    uid: bigint;
    name: string;
    iconId: string;
    ownerUid: bigint;
    regionId: string;
    afkChannelUid?: bigint;
    systemChannelUid?: bigint;
    large: boolean;
    afkTimeout?: bigint;
    verificationLevel: string;
    memberCount: bigint;
    creationTime: Date;
  }): Promise<void> {
    try {
      await prisma.server.upsert({
        where: { id: 0 }, // Will be updated to use uid index when available
        create: {
          uid: guildData.uid,
          name: guildData.name,
          icon_id: guildData.iconId,
          owner_uid: guildData.ownerUid,
          region_id: guildData.regionId,
          afk_channel_uid: guildData.afkChannelUid,
          system_channel_uid: guildData.systemChannelUid,
          large: guildData.large,
          afk_timeout: guildData.afkTimeout,
          verification_level: guildData.verificationLevel,
          member_count: guildData.memberCount,
          creation_time: guildData.creationTime,
          bot_active: true,
        },
        update: {
          name: guildData.name,
          icon_id: guildData.iconId,
          owner_uid: guildData.ownerUid,
          region_id: guildData.regionId,
          afk_channel_uid: guildData.afkChannelUid,
          system_channel_uid: guildData.systemChannelUid,
          large: guildData.large,
          afk_timeout: guildData.afkTimeout,
          verification_level: guildData.verificationLevel,
          member_count: guildData.memberCount,
          bot_active: true,
        },
      });
      logger.debug(`Synced server: ${guildData.name}`);
    } catch (error) {
      logger.error(`Failed to sync server ${guildData.name}:`, error);
      throw error;
    }
  }

  /**
   * Mark a server as inactive (bot left)
   */
  static async markInactive(serverUid: bigint): Promise<void> {
    try {
      await prisma.server.updateMany({
        where: { uid: serverUid },
        data: { bot_active: false },
      });
      logger.debug(`Marked server ${serverUid} as inactive`);
    } catch (error) {
      logger.error(`Failed to mark server ${serverUid} as inactive:`, error);
      throw error;
    }
  }

  /**
   * Get a server by its Discord UID
   */
  static async getByUid(uid: bigint) {
    return prisma.server.findFirst({
      where: { uid },
    });
  }
}

export default ServerService;

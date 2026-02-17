import type { reaction_role } from '@prisma/client';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

/**
 * ReactionService handles reaction role operations
 */
export class ReactionService {
  /**
   * Add a reaction role mapping
   */
  static async addReactionRole(
    messageId: bigint,
    reaction: string,
    roleId: bigint
  ): Promise<reaction_role> {
    try {
      // Check if mapping already exists
      const existing = await prisma.reaction_role.findFirst({
        where: {
          message_id: messageId,
          reaction,
        },
      });

      if (existing) {
        // Update existing mapping
        return await prisma.reaction_role.update({
          where: { id: existing.id },
          data: { role_id: roleId },
        });
      }

      // Create new mapping
      return await prisma.reaction_role.create({
        data: {
          message_id: messageId,
          reaction,
          role_id: roleId,
        },
      });
    } catch (error) {
      logger.error(`Failed to add reaction role:`, error);
      throw error;
    }
  }

  /**
   * Remove a reaction role mapping
   */
  static async removeReactionRole(messageId: bigint, reaction: string): Promise<boolean> {
    try {
      const result = await prisma.reaction_role.deleteMany({
        where: {
          message_id: messageId,
          reaction,
        },
      });
      return result.count > 0;
    } catch (error) {
      logger.error(`Failed to remove reaction role:`, error);
      throw error;
    }
  }

  /**
   * Remove all reaction roles for a message
   */
  static async removeAllReactionRoles(messageId: bigint): Promise<number> {
    try {
      const result = await prisma.reaction_role.deleteMany({
        where: { message_id: messageId },
      });
      return result.count;
    } catch (error) {
      logger.error(`Failed to remove all reaction roles:`, error);
      throw error;
    }
  }

  /**
   * Get the role ID for a specific message and reaction
   */
  static async getRoleForReaction(
    messageId: bigint,
    reaction: string
  ): Promise<bigint | null> {
    try {
      const mapping = await prisma.reaction_role.findFirst({
        where: {
          message_id: messageId,
          reaction,
        },
      });
      return mapping?.role_id ?? null;
    } catch (error) {
      logger.error(`Failed to get role for reaction:`, error);
      throw error;
    }
  }

  /**
   * Get all reaction roles for a message
   */
  static async getReactionRoles(messageId: bigint) {
    return prisma.reaction_role.findMany({
      where: { message_id: messageId },
    });
  }

  /**
   * Check if a message has any reaction roles
   */
  static async hasReactionRoles(messageId: bigint): Promise<boolean> {
    const count = await prisma.reaction_role.count({
      where: { message_id: messageId },
    });
    return count > 0;
  }
}

export default ReactionService;

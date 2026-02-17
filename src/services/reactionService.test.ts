/**
 * ReactionService Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrismaClient, mockReactionRole } from '../test/mocks/prisma.js';

// Mock the database module
const mockPrisma = createMockPrismaClient();
vi.mock('../lib/database.js', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
const { ReactionService } = await import('./reactionService.js');

describe('ReactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addReactionRole', () => {
    it('should create new reaction role mapping', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '👍';
      const roleId = BigInt('555555555555555555');

      mockPrisma.reaction_role.findFirst.mockResolvedValue(null);
      mockPrisma.reaction_role.create.mockResolvedValue(
        mockReactionRole({ message_id: messageId, reaction, role_id: roleId })
      );

      const result = await ReactionService.addReactionRole(messageId, reaction, roleId);

      expect(result.message_id).toBe(messageId);
      expect(result.reaction).toBe(reaction);
      expect(result.role_id).toBe(roleId);
      expect(mockPrisma.reaction_role.create).toHaveBeenCalledWith({
        data: {
          message_id: messageId,
          reaction,
          role_id: roleId,
        },
      });
    });

    it('should update existing reaction role mapping', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '👍';
      const oldRoleId = BigInt('555555555555555555');
      const newRoleId = BigInt('666666666666666666');

      const existingRole = mockReactionRole({
        id: 1,
        message_id: messageId,
        reaction,
        role_id: oldRoleId,
      });

      mockPrisma.reaction_role.findFirst.mockResolvedValue(existingRole);
      mockPrisma.reaction_role.update.mockResolvedValue(
        mockReactionRole({ ...existingRole, role_id: newRoleId })
      );

      const result = await ReactionService.addReactionRole(messageId, reaction, newRoleId);

      expect(result.role_id).toBe(newRoleId);
      expect(mockPrisma.reaction_role.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role_id: newRoleId },
      });
      expect(mockPrisma.reaction_role.create).not.toHaveBeenCalled();
    });

    it('should handle custom emoji identifiers', async () => {
      const messageId = BigInt('444444444444444444');
      const customEmoji = '<:custom:123456789>';
      const roleId = BigInt('555555555555555555');

      mockPrisma.reaction_role.findFirst.mockResolvedValue(null);
      mockPrisma.reaction_role.create.mockResolvedValue(
        mockReactionRole({ reaction: customEmoji })
      );

      await ReactionService.addReactionRole(messageId, customEmoji, roleId);

      expect(mockPrisma.reaction_role.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reaction: customEmoji,
        }),
      });
    });

    it('should throw error if database operation fails', async () => {
      mockPrisma.reaction_role.findFirst.mockResolvedValue(null);
      mockPrisma.reaction_role.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        ReactionService.addReactionRole(
          BigInt('444444444444444444'),
          '👍',
          BigInt('555555555555555555')
        )
      ).rejects.toThrow('DB Error');
    });
  });

  describe('removeReactionRole', () => {
    it('should remove reaction role and return true', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '👍';

      mockPrisma.reaction_role.deleteMany.mockResolvedValue({ count: 1 });

      const result = await ReactionService.removeReactionRole(messageId, reaction);

      expect(result).toBe(true);
      expect(mockPrisma.reaction_role.deleteMany).toHaveBeenCalledWith({
        where: {
          message_id: messageId,
          reaction,
        },
      });
    });

    it('should return false if no mapping found', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '👎';

      mockPrisma.reaction_role.deleteMany.mockResolvedValue({ count: 0 });

      const result = await ReactionService.removeReactionRole(messageId, reaction);

      expect(result).toBe(false);
    });

    it('should throw error if database operation fails', async () => {
      mockPrisma.reaction_role.deleteMany.mockRejectedValue(new Error('DB Error'));

      await expect(
        ReactionService.removeReactionRole(BigInt('444444444444444444'), '👍')
      ).rejects.toThrow('DB Error');
    });
  });

  describe('removeAllReactionRoles', () => {
    it('should remove all reaction roles for a message', async () => {
      const messageId = BigInt('444444444444444444');

      mockPrisma.reaction_role.deleteMany.mockResolvedValue({ count: 5 });

      const result = await ReactionService.removeAllReactionRoles(messageId);

      expect(result).toBe(5);
      expect(mockPrisma.reaction_role.deleteMany).toHaveBeenCalledWith({
        where: { message_id: messageId },
      });
    });

    it('should return 0 if no mappings found', async () => {
      const messageId = BigInt('999999999999999999');

      mockPrisma.reaction_role.deleteMany.mockResolvedValue({ count: 0 });

      const result = await ReactionService.removeAllReactionRoles(messageId);

      expect(result).toBe(0);
    });
  });

  describe('getRoleForReaction', () => {
    it('should return role ID when mapping exists', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '👍';
      const roleId = BigInt('555555555555555555');

      mockPrisma.reaction_role.findFirst.mockResolvedValue(
        mockReactionRole({ message_id: messageId, reaction, role_id: roleId })
      );

      const result = await ReactionService.getRoleForReaction(messageId, reaction);

      expect(result).toBe(roleId);
    });

    it('should return null when no mapping exists', async () => {
      mockPrisma.reaction_role.findFirst.mockResolvedValue(null);

      const result = await ReactionService.getRoleForReaction(
        BigInt('444444444444444444'),
        '👎'
      );

      expect(result).toBeNull();
    });

    it('should search with correct parameters', async () => {
      const messageId = BigInt('444444444444444444');
      const reaction = '<:custom:123>';

      mockPrisma.reaction_role.findFirst.mockResolvedValue(null);

      await ReactionService.getRoleForReaction(messageId, reaction);

      expect(mockPrisma.reaction_role.findFirst).toHaveBeenCalledWith({
        where: {
          message_id: messageId,
          reaction,
        },
      });
    });
  });
});

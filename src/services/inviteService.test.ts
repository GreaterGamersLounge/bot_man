/**
 * InviteService Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrismaClient, mockInvite } from '../test/mocks/prisma.js';

// Mock the database module
const mockPrisma = createMockPrismaClient();
vi.mock('../lib/database.js', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
const { InviteService } = await import('./inviteService.js');

describe('InviteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertInvite', () => {
    it('should create new invite when none exists', async () => {
      const inviteData = {
        code: 'newInvite',
        serverUid: BigInt('123456789012345678'),
        inviterUid: BigInt('222222222222222222'),
        channelUid: '333333333333333333',
        uses: 0,
        temporary: false,
      };

      mockPrisma.invite.findFirst.mockResolvedValue(null);
      mockPrisma.invite.create.mockResolvedValue(mockInvite(inviteData));

      const result = await InviteService.upsertInvite(inviteData);

      expect(result.code).toBe('newInvite');
      expect(mockPrisma.invite.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          code: inviteData.code,
          server_uid: inviteData.serverUid,
          inviter_uid: inviteData.inviterUid,
          active: true,
        }),
      });
    });

    it('should update existing invite', async () => {
      const existingInvite = mockInvite({ id: 1, code: 'existingInvite', uses: 5 });
      const updateData = {
        code: 'existingInvite',
        serverUid: BigInt('123456789012345678'),
        inviterUid: BigInt('222222222222222222'),
        channelUid: '333333333333333333',
        uses: 10,
        maxUses: 50,
        temporary: false,
      };

      mockPrisma.invite.findFirst.mockResolvedValue(existingInvite);
      mockPrisma.invite.update.mockResolvedValue(mockInvite({ ...existingInvite, uses: 10 }));

      await InviteService.upsertInvite(updateData);

      expect(mockPrisma.invite.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          uses: 10,
          max_uses: 50,
        },
      });
      expect(mockPrisma.invite.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields', async () => {
      const inviteData = {
        code: 'optionalInvite',
        serverUid: BigInt('123456789012345678'),
        inviterUid: BigInt('222222222222222222'),
        channelUid: '333333333333333333',
        uses: 0,
        maxUses: 100,
        temporary: true,
        expires: new Date('2026-12-31'),
      };

      mockPrisma.invite.findFirst.mockResolvedValue(null);
      mockPrisma.invite.create.mockResolvedValue(mockInvite(inviteData));

      await InviteService.upsertInvite(inviteData);

      expect(mockPrisma.invite.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          max_uses: 100,
          temporary: true,
          expires: inviteData.expires,
        }),
      });
    });

    it('should throw error if database operation fails', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(null);
      mockPrisma.invite.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        InviteService.upsertInvite({
          code: 'failInvite',
          serverUid: BigInt('123456789012345678'),
          inviterUid: BigInt('222222222222222222'),
          channelUid: '333333333333333333',
          uses: 0,
          temporary: false,
        })
      ).rejects.toThrow('DB Error');
    });
  });

  describe('markDeleted', () => {
    it('should mark invite as deleted', async () => {
      const code = 'deleteMe';
      mockPrisma.invite.updateMany.mockResolvedValue({ count: 1 });

      await InviteService.markDeleted(code);

      expect(mockPrisma.invite.updateMany).toHaveBeenCalledWith({
        where: { code, active: true },
        data: {
          active: false,
          deleter_uid: undefined,
        },
      });
    });

    it('should include deleter UID when provided', async () => {
      const code = 'deleteMe';
      const deleterUid = BigInt('111111111111111111');

      mockPrisma.invite.updateMany.mockResolvedValue({ count: 1 });

      await InviteService.markDeleted(code, deleterUid);

      expect(mockPrisma.invite.updateMany).toHaveBeenCalledWith({
        where: { code, active: true },
        data: {
          active: false,
          deleter_uid: deleterUid,
        },
      });
    });

    it('should not throw if invite not found', async () => {
      mockPrisma.invite.updateMany.mockResolvedValue({ count: 0 });

      await expect(InviteService.markDeleted('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('recordInviteUsage', () => {
    it('should record invite usage and increment uses', async () => {
      const inviteCode = 'usedInvite';
      const userUid = BigInt('444444444444444444');
      const invite = mockInvite({ id: 1, code: inviteCode });

      mockPrisma.invite.findFirst.mockResolvedValue(invite);
      mockPrisma.invite_discord_user.create.mockResolvedValue({});
      mockPrisma.invite.update.mockResolvedValue(mockInvite({ uses: 6 }));

      await InviteService.recordInviteUsage(inviteCode, userUid);

      expect(mockPrisma.invite_discord_user.create).toHaveBeenCalledWith({
        data: {
          invite_id: 1,
          discord_user_uid: userUid,
        },
      });
      expect(mockPrisma.invite.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { uses: { increment: 1 } },
      });
    });

    it('should not throw if invite not found', async () => {
      mockPrisma.invite.findFirst.mockResolvedValue(null);

      await expect(
        InviteService.recordInviteUsage('nonexistent', BigInt('444444444444444444'))
      ).resolves.not.toThrow();

      expect(mockPrisma.invite_discord_user.create).not.toHaveBeenCalled();
    });
  });

  describe('getActiveInvites', () => {
    it('should return active invites sorted by uses', async () => {
      const serverUid = BigInt('123456789012345678');
      const invites = [mockInvite({ uses: 10 }), mockInvite({ uses: 50 }), mockInvite({ uses: 5 })];

      mockPrisma.invite.findMany.mockResolvedValue(invites);

      const result = await InviteService.getActiveInvites(serverUid);

      expect(result).toHaveLength(3);
      expect(mockPrisma.invite.findMany).toHaveBeenCalledWith({
        where: {
          server_uid: serverUid,
          active: true,
        },
        orderBy: { uses: 'desc' },
      });
    });

    it('should return empty array if no active invites', async () => {
      mockPrisma.invite.findMany.mockResolvedValue([]);

      const result = await InviteService.getActiveInvites(BigInt('999999999999999999'));

      expect(result).toEqual([]);
    });
  });

  describe('getInviteStats', () => {
    it('should aggregate invite statistics by inviter', async () => {
      const serverUid = BigInt('123456789012345678');
      const inviterA = BigInt('111111111111111111');
      const inviterB = BigInt('222222222222222222');

      mockPrisma.invite.findMany.mockResolvedValue([
        {
          ...mockInvite({ inviter_uid: inviterA, active: true }),
          invite_discord_users: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        {
          ...mockInvite({ inviter_uid: inviterA, active: false }),
          invite_discord_users: [{ id: 4 }],
        },
        {
          ...mockInvite({ inviter_uid: inviterB, active: true }),
          invite_discord_users: [{ id: 5 }, { id: 6 }],
        },
      ]);

      const result = await InviteService.getInviteStats(serverUid);

      expect(result).toHaveLength(2);
      // Should be sorted by totalUses descending
      const first = result[0];
      const second = result[1];
      expect(first?.inviterUid).toBe(inviterA);
      expect(first?.totalUses).toBe(4);
      expect(first?.activeInvites).toBe(1);
      expect(second?.inviterUid).toBe(inviterB);
      expect(second?.totalUses).toBe(2);
      expect(second?.activeInvites).toBe(1);
    });

    it('should return empty array if no invites', async () => {
      mockPrisma.invite.findMany.mockResolvedValue([]);

      const result = await InviteService.getInviteStats(BigInt('999999999999999999'));

      expect(result).toEqual([]);
    });
  });
});

/**
 * UserService Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrismaClient, mockDiscordUser } from '../test/mocks/prisma.js';

// Mock the database module
const mockPrisma = createMockPrismaClient();
vi.mock('../lib/database.js', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
const { UserService } = await import('./userService.js');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncUser', () => {
    it('should upsert user data successfully', async () => {
      const userData = {
        uid: BigInt('222222222222222222'),
        name: 'TestUser',
        discriminator: '0001',
        avatarUrl: 'https://cdn.discordapp.com/avatars/test.png',
        botAccount: false,
      };

      mockPrisma.discord_user.upsert.mockResolvedValue(mockDiscordUser(userData));

      await expect(UserService.syncUser(userData)).resolves.not.toThrow();

      expect(mockPrisma.discord_user.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.discord_user.upsert).toHaveBeenCalledWith({
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
    });

    it('should handle bot accounts', async () => {
      const botData = {
        uid: BigInt('333333333333333333'),
        name: 'BotUser',
        botAccount: true,
      };

      mockPrisma.discord_user.upsert.mockResolvedValue(mockDiscordUser(botData));

      await UserService.syncUser(botData);

      expect(mockPrisma.discord_user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({
            bot_account: true,
          }),
        })
      );
    });

    it('should handle missing optional fields', async () => {
      const minimalData = {
        uid: BigInt('444444444444444444'),
        name: 'MinimalUser',
        botAccount: false,
      };

      mockPrisma.discord_user.upsert.mockResolvedValue(mockDiscordUser(minimalData));

      await UserService.syncUser(minimalData);

      expect(mockPrisma.discord_user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({
            discriminator: undefined,
            avatar_url: undefined,
          }),
        })
      );
    });

    it('should throw error if database operation fails', async () => {
      const userData = {
        uid: BigInt('222222222222222222'),
        name: 'TestUser',
        botAccount: false,
      };

      mockPrisma.discord_user.upsert.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(UserService.syncUser(userData)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('getByUid', () => {
    it('should return user when found', async () => {
      const user = mockDiscordUser();
      mockPrisma.discord_user.findUnique.mockResolvedValue(user);

      const result = await UserService.getByUid(BigInt('222222222222222222'));

      expect(result).toEqual(user);
      expect(mockPrisma.discord_user.findUnique).toHaveBeenCalledWith({
        where: { uid: BigInt('222222222222222222') },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.discord_user.findUnique.mockResolvedValue(null);

      const result = await UserService.getByUid(BigInt('999999999999999999'));

      expect(result).toBeNull();
    });
  });

  describe('getWithInvites', () => {
    it('should return user with invite history', async () => {
      const userWithInvites = {
        ...mockDiscordUser(),
        invite_discord_users: [
          {
            id: 1,
            invite_id: 1,
            discord_user_uid: BigInt('222222222222222222'),
            invite: {
              id: 1,
              code: 'testInvite',
              server_uid: BigInt('123456789012345678'),
            },
          },
        ],
      };

      mockPrisma.discord_user.findUnique.mockResolvedValue(userWithInvites);

      const result = await UserService.getWithInvites(BigInt('222222222222222222'));

      expect(result).toEqual(userWithInvites);
      expect(mockPrisma.discord_user.findUnique).toHaveBeenCalledWith({
        where: { uid: BigInt('222222222222222222') },
        include: {
          invite_discord_users: {
            include: {
              invite: true,
            },
          },
        },
      });
    });

    it('should return user with empty invite history', async () => {
      const userNoInvites = {
        ...mockDiscordUser(),
        invite_discord_users: [],
      };

      mockPrisma.discord_user.findUnique.mockResolvedValue(userNoInvites);

      const result = await UserService.getWithInvites(BigInt('222222222222222222'));

      expect(
        (result as Record<string, unknown> | null)?.invite_discord_users
      ).toEqual([]);
    });

    it('should return null when user not found', async () => {
      mockPrisma.discord_user.findUnique.mockResolvedValue(null);

      const result = await UserService.getWithInvites(BigInt('999999999999999999'));

      expect(result).toBeNull();
    });
  });
});

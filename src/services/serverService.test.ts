/**
 * ServerService Unit Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrismaClient, mockServer } from '../test/mocks/prisma.js';

// Mock the database module
const mockPrisma = createMockPrismaClient();
vi.mock('../lib/database.js', () => ({
  prisma: mockPrisma,
}));

// Import after mocking
const { ServerService } = await import('./serverService.js');

describe('ServerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncServer', () => {
    it('should upsert server data successfully', async () => {
      const serverData = {
        uid: BigInt('123456789012345678'),
        name: 'Test Server',
        iconId: 'icon123',
        ownerUid: BigInt('111111111111111111'),
        regionId: 'us-west',
        large: false,
        verificationLevel: 'MEDIUM',
        memberCount: BigInt(100),
        creationTime: new Date('2020-01-01'),
      };

      mockPrisma.server.upsert.mockResolvedValue(mockServer(serverData));

      await expect(ServerService.syncServer(serverData)).resolves.not.toThrow();

      expect(mockPrisma.server.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.server.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({
            uid: serverData.uid,
            name: serverData.name,
            bot_active: true,
          }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: expect.objectContaining({
            name: serverData.name,
            bot_active: true,
          }),
        })
      );
    });

    it('should include optional fields when provided', async () => {
      const serverData = {
        uid: BigInt('123456789012345678'),
        name: 'Test Server',
        iconId: 'icon123',
        ownerUid: BigInt('111111111111111111'),
        regionId: 'us-west',
        afkChannelUid: BigInt('999999999999999999'),
        systemChannelUid: BigInt('888888888888888888'),
        large: true,
        afkTimeout: BigInt(300),
        verificationLevel: 'HIGH',
        memberCount: BigInt(5000),
        creationTime: new Date('2020-01-01'),
      };

      mockPrisma.server.upsert.mockResolvedValue(mockServer());

      await ServerService.syncServer(serverData);

      expect(mockPrisma.server.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({
            afk_channel_uid: serverData.afkChannelUid,
            system_channel_uid: serverData.systemChannelUid,
            afk_timeout: serverData.afkTimeout,
          }),
        })
      );
    });

    it('should throw error if database operation fails', async () => {
      const serverData = {
        uid: BigInt('123456789012345678'),
        name: 'Test Server',
        iconId: 'icon123',
        ownerUid: BigInt('111111111111111111'),
        regionId: 'us-west',
        large: false,
        verificationLevel: 'MEDIUM',
        memberCount: BigInt(100),
        creationTime: new Date('2020-01-01'),
      };

      const dbError = new Error('Database connection failed');
      mockPrisma.server.upsert.mockRejectedValue(dbError);

      await expect(ServerService.syncServer(serverData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markInactive', () => {
    it('should mark server as inactive', async () => {
      const serverUid = BigInt('123456789012345678');
      mockPrisma.server.updateMany.mockResolvedValue({ count: 1 });

      await expect(ServerService.markInactive(serverUid)).resolves.not.toThrow();

      expect(mockPrisma.server.updateMany).toHaveBeenCalledWith({
        where: { uid: serverUid },
        data: { bot_active: false },
      });
    });

    it('should not throw if server not found', async () => {
      const serverUid = BigInt('999999999999999999');
      mockPrisma.server.updateMany.mockResolvedValue({ count: 0 });

      await expect(ServerService.markInactive(serverUid)).resolves.not.toThrow();
    });

    it('should throw error if database operation fails', async () => {
      const serverUid = BigInt('123456789012345678');
      mockPrisma.server.updateMany.mockRejectedValue(new Error('DB Error'));

      await expect(ServerService.markInactive(serverUid)).rejects.toThrow('DB Error');
    });
  });

  describe('getByUid', () => {
    it('should return server when found', async () => {
      const server = mockServer();
      mockPrisma.server.findFirst.mockResolvedValue(server);

      const result = await ServerService.getByUid(BigInt('123456789012345678'));

      expect(result).toEqual(server);
      expect(mockPrisma.server.findFirst).toHaveBeenCalledWith({
        where: { uid: BigInt('123456789012345678') },
      });
    });

    it('should return null when server not found', async () => {
      mockPrisma.server.findFirst.mockResolvedValue(null);

      const result = await ServerService.getByUid(BigInt('999999999999999999'));

      expect(result).toBeNull();
    });
  });
});

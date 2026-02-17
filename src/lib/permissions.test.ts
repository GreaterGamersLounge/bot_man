/**
 * Permissions utility tests
 */

import type { GuildMember } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';

// Mock the config module
vi.mock('./config.js', () => ({
  getConfig: vi.fn(() => ({
    ownerId: '123456789',
  })),
}));

import { hasPermissions, isAdmin, isModerator, isOwner } from './permissions.js';

describe('permissions', () => {
  describe('hasPermissions', () => {
    it('should return false for null member', () => {
      expect(hasPermissions(null, [PermissionFlagsBits.Administrator])).toBe(false);
    });

    it('should return true if member has all required permissions', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockReturnValue(true),
        },
      } as unknown as GuildMember;

      const result = hasPermissions(mockMember, [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.BanMembers,
      ]);

      expect(result).toBe(true);
      expect(mockMember.permissions.has).toHaveBeenCalledTimes(2);
    });

    it('should return false if member lacks any required permission', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockImplementation((perm) =>
            perm === PermissionFlagsBits.ManageMessages
          ),
        },
      } as unknown as GuildMember;

      const result = hasPermissions(mockMember, [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.BanMembers,
      ]);

      expect(result).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      const mockMember = {
        permissions: {
          has: vi.fn(),
        },
      } as unknown as GuildMember;

      expect(hasPermissions(mockMember, [])).toBe(true);
      expect(mockMember.permissions.has).not.toHaveBeenCalled();
    });
  });

  describe('isOwner', () => {
    it('should return true for bot owner', () => {
      expect(isOwner('123456789')).toBe(true);
    });

    it('should return false for non-owner', () => {
      expect(isOwner('987654321')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false for null member', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('should return true if member has Administrator permission', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockReturnValue(true),
        },
      } as unknown as GuildMember;

      expect(isAdmin(mockMember)).toBe(true);
      expect(mockMember.permissions.has).toHaveBeenCalledWith(PermissionFlagsBits.Administrator);
    });

    it('should return false if member lacks Administrator permission', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockReturnValue(false),
        },
      } as unknown as GuildMember;

      expect(isAdmin(mockMember)).toBe(false);
    });
  });

  describe('isModerator', () => {
    it('should return false for null member', () => {
      expect(isModerator(null)).toBe(false);
    });

    it('should return true if member has ManageMessages permission', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockReturnValue(true),
        },
      } as unknown as GuildMember;

      expect(isModerator(mockMember)).toBe(true);
      expect(mockMember.permissions.has).toHaveBeenCalledWith(PermissionFlagsBits.ManageMessages);
    });

    it('should return false if member lacks ManageMessages permission', () => {
      const mockMember = {
        permissions: {
          has: vi.fn().mockReturnValue(false),
        },
      } as unknown as GuildMember;

      expect(isModerator(mockMember)).toBe(false);
    });
  });
});

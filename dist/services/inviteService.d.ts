import type { invite } from '@prisma/client';
/**
 * InviteService handles operations related to Discord invites and invite tracking
 */
export declare class InviteService {
    /**
     * Create or update an invite record
     */
    static upsertInvite(inviteData: {
        code: string;
        serverUid: bigint;
        inviterUid: bigint;
        channelUid: string;
        uses: number;
        maxUses?: number;
        temporary: boolean;
        expires?: Date;
    }): Promise<invite>;
    /**
     * Mark an invite as deleted
     */
    static markDeleted(code: string, deleterUid?: bigint): Promise<void>;
    /**
     * Record that a user joined via a specific invite
     */
    static recordInviteUsage(inviteCode: string, userUid: bigint): Promise<void>;
    /**
     * Get active invites for a server
     */
    static getActiveInvites(serverUid: bigint): Promise<{
        id: bigint;
        created_at: Date;
        updated_at: Date;
        server_uid: bigint;
        inviter_uid: bigint;
        deleter_uid: bigint | null;
        code: string;
        channel_uid: string;
        uses: number;
        max_uses: number | null;
        active: boolean;
        temporary: boolean;
        expires: Date | null;
    }[]>;
    /**
     * Get invite statistics for a server
     */
    static getInviteStats(serverUid: bigint): Promise<{
        inviterUid: bigint;
        totalUses: number;
        activeInvites: number;
    }[]>;
}
export default InviteService;
//# sourceMappingURL=inviteService.d.ts.map
/**
 * ServerService handles operations related to Discord servers/guilds
 */
export declare class ServerService {
    /**
     * Sync or create a server record from Discord guild data
     */
    static syncServer(guildData: {
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
    }): Promise<void>;
    /**
     * Mark a server as inactive (bot left)
     */
    static markInactive(serverUid: bigint): Promise<void>;
    /**
     * Get a server by its Discord UID
     */
    static getByUid(uid: bigint): Promise<{
        name: string;
        id: bigint;
        uid: bigint;
        created_at: Date;
        updated_at: Date;
        icon_id: string;
        owner_uid: bigint;
        region_id: string;
        afk_channel_uid: bigint | null;
        system_channel_uid: bigint | null;
        large: boolean;
        afk_timeout: bigint | null;
        verification_level: string;
        member_count: bigint;
        creation_time: Date;
        bot_active: boolean;
    } | null>;
}
export default ServerService;
//# sourceMappingURL=serverService.d.ts.map
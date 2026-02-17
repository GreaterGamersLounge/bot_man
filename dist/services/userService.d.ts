/**
 * UserService handles operations related to Discord users
 */
export declare class UserService {
    /**
     * Sync or create a Discord user record
     */
    static syncUser(userData: {
        uid: bigint;
        name: string;
        discriminator?: string;
        avatarUrl?: string;
        botAccount: boolean;
    }): Promise<void>;
    /**
     * Get a Discord user by their UID
     */
    static getByUid(uid: bigint): Promise<{
        name: string | null;
        avatar_url: string | null;
        discriminator: string | null;
        uid: bigint;
        bot_account: boolean | null;
        created_at: Date;
        updated_at: Date;
    } | null>;
    /**
     * Get a Discord user with their invite history
     */
    static getWithInvites(uid: bigint): Promise<({
        invite_discord_users: ({
            invite: {
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
            } | null;
        } & {
            id: bigint;
            created_at: Date;
            updated_at: Date;
            invite_id: bigint | null;
            discord_user_uid: bigint | null;
        })[];
    } & {
        name: string | null;
        avatar_url: string | null;
        discriminator: string | null;
        uid: bigint;
        bot_account: boolean | null;
        created_at: Date;
        updated_at: Date;
    }) | null>;
}
export default UserService;
//# sourceMappingURL=userService.d.ts.map
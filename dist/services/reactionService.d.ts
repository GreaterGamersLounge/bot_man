import type { reaction_role } from '@prisma/client';
/**
 * ReactionService handles reaction role operations
 */
export declare class ReactionService {
    /**
     * Add a reaction role mapping
     */
    static addReactionRole(messageId: bigint, reaction: string, roleId: bigint): Promise<reaction_role>;
    /**
     * Remove a reaction role mapping
     */
    static removeReactionRole(messageId: bigint, reaction: string): Promise<boolean>;
    /**
     * Remove all reaction roles for a message
     */
    static removeAllReactionRoles(messageId: bigint): Promise<number>;
    /**
     * Get the role ID for a specific message and reaction
     */
    static getRoleForReaction(messageId: bigint, reaction: string): Promise<bigint | null>;
    /**
     * Get all reaction roles for a message
     */
    static getReactionRoles(messageId: bigint): Promise<{
        id: bigint;
        created_at: Date;
        updated_at: Date;
        message_id: bigint;
        reaction: string;
        role_id: bigint;
    }[]>;
    /**
     * Check if a message has any reaction roles
     */
    static hasReactionRoles(messageId: bigint): Promise<boolean>;
}
export default ReactionService;
//# sourceMappingURL=reactionService.d.ts.map
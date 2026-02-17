import type { GuildMember, PermissionResolvable, ChatInputCommandInteraction, Message } from 'discord.js';
/**
 * Check if a member has the required permissions
 */
export declare function hasPermissions(member: GuildMember | null, permissions: PermissionResolvable[]): boolean;
/**
 * Check if a user is the bot owner
 */
export declare function isOwner(userId: string): boolean;
/**
 * Check if a member is a server administrator
 */
export declare function isAdmin(member: GuildMember | null): boolean;
/**
 * Check if a member is a server moderator (has manage messages permission)
 */
export declare function isModerator(member: GuildMember | null): boolean;
/**
 * Permission check for command execution
 */
export declare function checkCommandPermissions(interaction: ChatInputCommandInteraction, requiredPermissions?: PermissionResolvable[], ownerOnly?: boolean): Promise<boolean>;
/**
 * Permission check for legacy prefix commands
 */
export declare function checkPrefixCommandPermissions(message: Message, requiredPermissions?: PermissionResolvable[], ownerOnly?: boolean): Promise<boolean>;
//# sourceMappingURL=permissions.d.ts.map
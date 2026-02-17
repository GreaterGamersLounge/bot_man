import { PermissionFlagsBits } from 'discord.js';
import { getConfig } from './config.js';
/**
 * Check if a member has the required permissions
 */
export function hasPermissions(member, permissions) {
    if (!member) {
        return false;
    }
    return permissions.every((permission) => member.permissions.has(permission));
}
/**
 * Check if a user is the bot owner
 */
export function isOwner(userId) {
    const config = getConfig();
    return config.ownerId === userId;
}
/**
 * Check if a member is a server administrator
 */
export function isAdmin(member) {
    if (!member) {
        return false;
    }
    return member.permissions.has(PermissionFlagsBits.Administrator);
}
/**
 * Check if a member is a server moderator (has manage messages permission)
 */
export function isModerator(member) {
    if (!member) {
        return false;
    }
    return member.permissions.has(PermissionFlagsBits.ManageMessages);
}
/**
 * Permission check for command execution
 */
export async function checkCommandPermissions(interaction, requiredPermissions, ownerOnly) {
    // Check owner-only commands
    if (ownerOnly && !isOwner(interaction.user.id)) {
        await interaction.reply({
            content: 'This command can only be used by the bot owner.',
            ephemeral: true,
        });
        return false;
    }
    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        const member = interaction.member;
        if (!hasPermissions(member, requiredPermissions)) {
            await interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true,
            });
            return false;
        }
    }
    return true;
}
/**
 * Permission check for legacy prefix commands
 */
export async function checkPrefixCommandPermissions(message, requiredPermissions, ownerOnly) {
    // Check owner-only commands
    if (ownerOnly && !isOwner(message.author.id)) {
        await message.reply('This command can only be used by the bot owner.');
        return false;
    }
    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        const member = message.member;
        if (!hasPermissions(member, requiredPermissions)) {
            await message.reply('You do not have permission to use this command.');
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=permissions.js.map
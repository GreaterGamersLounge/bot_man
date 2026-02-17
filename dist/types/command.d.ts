import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, Message, PermissionResolvable } from 'discord.js';
/**
 * Represents a slash command that the bot can execute
 */
export interface SlashCommand {
    /** The slash command builder data */
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | any;
    /** The function to execute when the command is invoked */
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    /** Optional cooldown in seconds */
    cooldown?: number;
    /** Required permissions to use this command */
    permissions?: PermissionResolvable[];
    /** Whether this command is owner-only */
    ownerOnly?: boolean;
}
/**
 * Represents a legacy prefix command (for backward compatibility)
 */
export interface PrefixCommand {
    /** The command name (without prefix) */
    name: string;
    /** Alternative names for the command */
    aliases?: string[];
    /** Brief description of what the command does */
    description: string;
    /** The function to execute when the command is invoked */
    execute: (message: Message, args: string[]) => Promise<void>;
    /** Required permissions to use this command */
    permissions?: PermissionResolvable[];
    /** Whether this command is owner-only */
    ownerOnly?: boolean;
}
/**
 * Combined command type that supports both slash and prefix commands
 */
export interface Command {
    slash?: SlashCommand;
    prefix?: PrefixCommand;
}
//# sourceMappingURL=command.d.ts.map
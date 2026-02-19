import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

/**
 * Represents a slash command that the bot can execute
 */
export interface SlashCommand {
  /** The slash command builder data */
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  /** The function to execute when the command is invoked */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** Optional autocomplete handler */
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  /** Optional cooldown in seconds */
  cooldown?: number;
  /** Required permissions to use this command */
  permissions?: PermissionResolvable[];
  /** Whether this command is owner-only */
  ownerOnly?: boolean;
}

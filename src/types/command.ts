import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    PermissionResolvable,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

/**
 * Represents a slash command that the bot can execute
 */
export interface SlashCommand {
  /** The slash command builder data */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | any;
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

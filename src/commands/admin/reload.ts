import type { ChatInputCommandInteraction } from 'discord.js';
import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import type { BotClient } from '../../bot.js';
import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import type { SlashCommand } from '../../types/command.js';

/**
 * Command category to file path mapping
 */
const commandPaths: Record<string, string> = {
  // Utility
  ping: './utility/ping.js',
  random: './utility/random.js',
  info: './utility/info.js',
  me: './utility/me.js',
  invite: './utility/invite.js',
  // Quotes
  quote: './quotes/quote.js',
  // Moderation
  clear: './moderation/clear.js',
  massmove: './moderation/massmove.js',
  // Roles
  reactionrole: './roles/reactionrole.js',
  // Voice
  jumpchannel: './voice/jumpchannel.js',
  // Admin
  shutdown: './admin/shutdown.js',
  dm: './admin/dm.js',
  private: './admin/private.js',
  reload: './admin/reload.js',
};

/**
 * Command module interface
 */
interface CommandModule {
  default?: {
    slash?: SlashCommand;
  };
  slash?: SlashCommand;
  slashCommand?: SlashCommand;
}

/**
 * Get slash command from module (handles both old and new format)
 */
function getSlashCommand(module: CommandModule): SlashCommand | undefined {
  // New format: named export `slashCommand`
  if (module.slashCommand) {
    return module.slashCommand;
  }
  // Old format: default export with `slash` property
  if (module.default?.slash) {
    return module.default.slash;
  }
  // Direct slash property (shouldn't happen but just in case)
  if (module.slash) {
    return module.slash;
  }
  return undefined;
}

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads a command (owner only, dev server only)')
    .setContexts([InteractionContextType.Guild])
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('The command to reload (leave empty to reload all)')
        .setRequired(false)
        .addChoices(
          { name: 'ping', value: 'ping' },
          { name: 'random', value: 'random' },
          { name: 'info', value: 'info' },
          { name: 'me', value: 'me' },
          { name: 'invite', value: 'invite' },
          { name: 'quote', value: 'quote' },
          { name: 'clear', value: 'clear' },
          { name: 'massmove', value: 'massmove' },
          { name: 'reactionrole', value: 'reactionrole' },
          { name: 'jumpchannel', value: 'jumpchannel' },
          { name: 'shutdown', value: 'shutdown' },
          { name: 'dm', value: 'dm' },
          { name: 'private', value: 'private' },
          { name: 'reload', value: 'reload' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.client as BotClient;

    // Only allow bot owner
    if (interaction.user.id !== config.ownerId) {
      await interaction.reply({
        content: 'Only the bot owner can use this command.',
        ephemeral: true,
      });
      return;
    }

    // Only allow in dev guild
    if (interaction.guildId !== config.devGuildId) {
      await interaction.reply({
        content: 'This command can only be used in the development server.',
        ephemeral: true,
      });
      return;
    }

    const commandName = interaction.options.getString('command')?.toLowerCase();

    // If no command specified, reload all commands
    if (!commandName) {
      await reloadAllCommands(interaction, client);
      return;
    }

    // Reload a single command
    await reloadSingleCommand(interaction, client, commandName);
  },
};

/**
 * Reload all commands
 */
async function reloadAllCommands(
  interaction: ChatInputCommandInteraction,
  client: BotClient
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const results: { success: string[]; failed: string[] } = {
    success: [],
    failed: [],
  };

  for (const [commandName, relativePath] of Object.entries(commandPaths)) {
    try {
      const cacheBuster = `?update=${Date.now()}`;
      const modulePath = `../${relativePath.replace('./', '')}${cacheBuster}`;

      const newModule = (await import(modulePath)) as CommandModule;
      const newCommand = getSlashCommand(newModule);

      if (newCommand) {
        client.slashCommands.set(newCommand.data.name, newCommand);
        results.success.push(commandName);
      } else {
        results.failed.push(`${commandName} (no export)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.failed.push(`${commandName} (${errorMessage})`);
    }
  }

  logger.info(
    `Reloaded ${results.success.length}/${Object.keys(commandPaths).length} commands by ${interaction.user.tag}`
  );

  let response = `**Reload Complete**\n✅ Success: ${results.success.length}/${Object.keys(commandPaths).length}`;

  if (results.failed.length > 0) {
    response += `\n❌ Failed: ${results.failed.join(', ')}`;
  }

  await interaction.editReply({ content: response });
}

/**
 * Reload a single command
 */
async function reloadSingleCommand(
  interaction: ChatInputCommandInteraction,
  client: BotClient,
  commandName: string
): Promise<void> {
  // Check if command exists
  const existingCommand = client.slashCommands.get(commandName);
  if (!existingCommand) {
    await interaction.reply({
      content: `There is no command with name \`${commandName}\`!`,
      ephemeral: true,
    });
    return;
  }

  // Get the file path for this command
  const relativePath = commandPaths[commandName];
  if (!relativePath) {
    await interaction.reply({
      content: `Cannot find file path for command \`${commandName}\`!`,
      ephemeral: true,
    });
    return;
  }

  try {
    // In ESM, we need to add a cache-busting query parameter to bypass module cache
    const cacheBuster = `?update=${Date.now()}`;
    const modulePath = `../${relativePath.replace('./', '')}${cacheBuster}`;

    // Dynamically import the module with cache busting
    const newModule = (await import(modulePath)) as CommandModule;
    const newCommand = getSlashCommand(newModule);

    if (!newCommand) {
      await interaction.reply({
        content: `Command \`${commandName}\` does not export a slash command!`,
        ephemeral: true,
      });
      return;
    }

    // Update the command in the collection
    client.slashCommands.set(newCommand.data.name, newCommand);

    logger.info(`Command /${commandName} was reloaded by ${interaction.user.tag}`);

    await interaction.reply({
      content: `Command \`/${newCommand.data.name}\` was reloaded successfully!`,
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Error reloading command ${commandName}:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.reply({
      content: `There was an error while reloading command \`${commandName}\`:\n\`${errorMessage}\``,
      ephemeral: true,
    });
  }
}

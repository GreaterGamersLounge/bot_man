import type { AutocompleteInteraction, ChatInputCommandInteraction, Interaction } from 'discord.js';
import type { BotClient } from '../bot.js';
import { logger } from '../lib/logger.js';
import { checkCommandPermissions } from '../lib/permissions.js';
import type { BotEvent } from '../types/index.js';

const event: BotEvent<'interactionCreate'> = {
  name: 'interactionCreate',

  async execute(client, interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(client, interaction);
      return;
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(client, interaction);
      return;
    }

    // TODO: Handle other interaction types
    // - Buttons
    // - Select menus
    // - Modals
  },
};

/**
 * Handle slash command interactions
 */
async function handleSlashCommand(
  client: BotClient,
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const command = client.slashCommands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown slash command: ${interaction.commandName}`);
    await interaction.reply({
      content: 'Unknown command.',
      ephemeral: true,
    });
    return;
  }

  // Check permissions
  const hasPermission = await checkCommandPermissions(
    interaction,
    command.permissions,
    command.ownerOnly
  );

  if (!hasPermission) {
    return;
  }

  try {
    logger.debug(
      `Executing slash command: /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name ?? 'DM'}`
    );

    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing slash command /${interaction.commandName}:`, error);

    const errorMessage = {
      content: 'There was an error executing this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

/**
 * Handle autocomplete interactions
 */
async function handleAutocomplete(
  client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> {
  const command = client.slashCommands.get(interaction.commandName);

  if (!command?.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    logger.error(`Error handling autocomplete for /${interaction.commandName}:`, error);
  }
}

export default event;

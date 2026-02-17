import { logger } from '../lib/logger.js';
import { checkCommandPermissions } from '../lib/permissions.js';
const event = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(client, interaction);
            return;
        }
        // TODO: Handle other interaction types
        // - Autocomplete
        // - Buttons
        // - Select menus
        // - Modals
    },
};
/**
 * Handle slash command interactions
 */
async function handleSlashCommand(client, interaction) {
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
    const hasPermission = await checkCommandPermissions(interaction, command.permissions, command.ownerOnly);
    if (!hasPermission) {
        return;
    }
    try {
        logger.debug(`Executing slash command: /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name ?? 'DM'}`);
        await command.execute(interaction);
    }
    catch (error) {
        logger.error(`Error executing slash command /${interaction.commandName}:`, error);
        const errorMessage = {
            content: 'There was an error executing this command.',
            ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        }
        else {
            await interaction.reply(errorMessage);
        }
    }
}
export default event;
//# sourceMappingURL=interactionCreate.js.map
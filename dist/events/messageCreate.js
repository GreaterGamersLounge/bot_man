import { logger } from '../lib/logger.js';
import { checkPrefixCommandPermissions } from '../lib/permissions.js';
const event = {
    name: 'messageCreate',
    async execute(client, message) {
        // Ignore bot messages
        if (message.author.bot) {
            return;
        }
        // Check for prefix
        if (!message.content.startsWith(client.prefix)) {
            return;
        }
        // Parse command and arguments
        const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) {
            return;
        }
        // Look up command (check aliases too)
        const resolvedName = client.aliases.get(commandName) ?? commandName;
        const command = client.prefixCommands.get(resolvedName);
        if (!command) {
            // Unknown command - don't respond to avoid spam
            return;
        }
        // Check permissions
        const hasPermission = await checkPrefixCommandPermissions(message, command.permissions, command.ownerOnly);
        if (!hasPermission) {
            return;
        }
        try {
            logger.debug(`Executing prefix command: !${commandName} by ${message.author.tag} in ${message.guild?.name ?? 'DM'}`);
            await command.execute(message, args);
        }
        catch (error) {
            logger.error(`Error executing prefix command !${commandName}:`, error);
            await message.reply('There was an error executing this command.');
        }
    },
};
export default event;
//# sourceMappingURL=messageCreate.js.map
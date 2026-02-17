import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { getConfig } from './lib/config.js';
import { getSlashCommandData } from './commands/index.js';
import { logger } from './lib/logger.js';
/**
 * Deploy slash commands to Discord
 *
 * By default, deploys globally (takes up to 1 hour to propagate).
 * Set DEPLOY_GUILD=true to deploy to a specific guild (instant, for development).
 */
async function deployCommands() {
    const config = getConfig();
    const commands = getSlashCommandData().map((command) => command.toJSON());
    logger.info(`Preparing to deploy ${commands.length} slash commands...`);
    const rest = new REST().setToken(config.botToken);
    try {
        const deployGuild = process.env.DEPLOY_GUILD === 'true';
        if (deployGuild) {
            // Deploy to specific guild (instant)
            const guildId = config.devGuildId;
            if (!guildId) {
                throw new Error('DEV_GUILD_ID environment variable is required for guild deployment');
            }
            logger.info(`Deploying commands to guild: ${guildId}`);
            await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), {
                body: commands,
            });
            logger.info(`Successfully deployed ${commands.length} commands to guild ${guildId}`);
        }
        else {
            // Deploy globally (up to 1 hour to propagate)
            logger.info('Deploying commands globally...');
            await rest.put(Routes.applicationCommands(config.clientId), {
                body: commands,
            });
            logger.info(`Successfully deployed ${commands.length} commands globally. Changes may take up to 1 hour to propagate.`);
        }
    }
    catch (error) {
        logger.error('Failed to deploy commands:', error);
        process.exit(1);
    }
}
// Run deployment
void deployCommands();
//# sourceMappingURL=deploy-commands.js.map
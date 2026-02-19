import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { getSlashCommandData } from './commands/index.js';
import { getConfig } from './lib/config.js';
import { logger } from './lib/logger.js';

/**
 * Deploy slash commands to Discord
 *
 * Environment variables:
 * - DEPLOY_GUILD=true: Deploy to dev guild (instant, for development)
 * - CLEAR_GLOBAL=true: Clear all global commands
 * - CLEAR_GUILD=true: Clear all guild commands
 *
 * By default, deploys globally (takes up to 1 hour to propagate).
 */
async function deployCommands(): Promise<void> {
  const config = getConfig();
  const rest = new REST().setToken(config.botToken);

  const clearGlobal = process.env.CLEAR_GLOBAL === 'true';
  const clearGuild = process.env.CLEAR_GUILD === 'true';
  const deployGuild = process.env.DEPLOY_GUILD === 'true';

  try {
    // Clear global commands if requested
    if (clearGlobal) {
      logger.info('Clearing all global commands...');
      await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
      logger.info('Global commands cleared.');
    }

    // Clear guild commands if requested
    if (clearGuild) {
      const guildId = config.devGuildId;
      if (!guildId) {
        throw new Error('DEV_GUILD_ID required for clearing guild commands');
      }
      logger.info(`Clearing all commands from guild: ${guildId}`);
      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: [] });
      logger.info('Guild commands cleared.');
    }

    // If only clearing, exit early
    if ((clearGlobal || clearGuild) && !deployGuild && !process.env.DEPLOY_GLOBAL) {
      return;
    }

    const commands = getSlashCommandData().map(
      (command) => command.toJSON() as Record<string, unknown>
    );
    logger.info(`Preparing to deploy ${commands.length} slash commands...`);

    if (deployGuild) {
      // Deploy to specific guild (instant) - recommended for development
      const guildId = config.devGuildId;

      if (!guildId) {
        throw new Error('DEV_GUILD_ID environment variable is required for guild deployment');
      }

      logger.info(`Deploying commands to guild: ${guildId}`);

      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), {
        body: commands,
      });

      logger.info(`Successfully deployed ${commands.length} commands to guild ${guildId}`);
    } else {
      // Deploy globally (up to 1 hour to propagate)
      logger.info('Deploying commands globally...');

      await rest.put(Routes.applicationCommands(config.clientId), {
        body: commands,
      });

      logger.info(
        `Successfully deployed ${commands.length} commands globally. Changes may take up to 1 hour to propagate.`
      );
    }
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
    process.exit(1);
  }
}

// Run deployment
void deployCommands();

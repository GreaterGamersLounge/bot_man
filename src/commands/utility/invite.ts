import type { ChatInputCommandInteraction } from 'discord.js';
import { OAuth2Scopes, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { config } from '../../lib/config.js';
import type { SlashCommand } from '../../types/command.js';

/**
 * Generate bot invite URL with full admin permissions
 */
function generateInviteUrl(clientId: string): string {
  // Full Administrator permissions
  const permissionValue = PermissionFlagsBits.Administrator;

  const params = new URLSearchParams({
    client_id: clientId,
    permissions: permissionValue.toString(),
    scope: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(' '),
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

// Slash command
export const slashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot invite URL')
    .setDMPermission(true),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const inviteUrl = generateInviteUrl(config.clientId);

    await interaction.reply({
      content: `Invite me to your server: ${inviteUrl}`,
      ephemeral: true,
    });
  },
};

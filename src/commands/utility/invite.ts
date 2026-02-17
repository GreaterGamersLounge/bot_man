import {
    ChatInputCommandInteraction,
    Message,
    OAuth2Scopes,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { config } from '../../lib/config.js';
import type { PrefixCommand, SlashCommand } from '../../types/command.js';

/**
 * Generate bot invite URL with required permissions
 */
function generateInviteUrl(clientId: string): string {
  const permissions = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.MoveMembers,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ViewChannel,
  ];

  const permissionValue = permissions.reduce((acc, perm) => acc | perm, BigInt(0));

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
    .setDescription('Get the bot invite URL'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const inviteUrl = generateInviteUrl(config.clientId);

    await interaction.reply({
      content: `Invite me to your server: ${inviteUrl}`,
      ephemeral: true,
    });
  },
};

// Legacy prefix command
export const prefixCommands: PrefixCommand[] = [
  {
    name: 'invite',
    aliases: [],
    description: 'Get the bot invite URL',
    usage: 'invite',
    async execute(message: Message): Promise<void> {
      const inviteUrl = generateInviteUrl(config.clientId);

      await message.reply(`Invite me to your server: ${inviteUrl}`);
    },
  },
];

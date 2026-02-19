import { ChannelType, PermissionFlagsBits, type VoiceState } from 'discord.js';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import type { BotEvent } from '../types/index.js';

const event: BotEvent<'voiceStateUpdate'> = {
  name: 'voiceStateUpdate',
  once: false,

  async execute(client, oldState: VoiceState, newState: VoiceState) {
    // User joined a channel
    if (newState.channel) {
      await handleChannelJoin(oldState, newState);
    }

    // User left a channel
    if (oldState.channel) {
      await handleChannelLeave(oldState, newState);
    }
  },
};

/**
 * Handle when a user joins a voice channel
 * If it's a "jump channel", create a new temp channel and move them there
 */
async function handleChannelJoin(oldState: VoiceState, newState: VoiceState): Promise<void> {
  const channel = newState.channel;
  const member = newState.member;
  const guild = newState.guild;

  if (!channel || !member) {
    return;
  }

  try {
    // Check if this is a jump channel
    const jumpChannel = await prisma.temporary_voice_channel.findFirst({
      where: {
        server_uid: BigInt(guild.id),
        channel_uid: BigInt(channel.id),
        is_jump_channel: true,
        active: true,
      },
    });

    if (!jumpChannel) {
      return;
    }

    logger.debug(`User ${member.user.username} joined jump channel ${channel.name}`);

    // Create a new temporary voice channel
    const newChannel = await guild.channels.create({
      name: `~${member.user.username}`,
      type: ChannelType.GuildVoice,
      parent: channel.parent ?? undefined,
      reason: 'Creating temporary voice channel',
      permissionOverwrites: [
        // Copy permissions from the jump channel
        ...channel.permissionOverwrites.cache.map((overwrite) => ({
          id: overwrite.id,
          allow: overwrite.allow,
          deny: overwrite.deny,
          type: overwrite.type,
        })),
        // Give the user manage permissions for their channel
        {
          id: member.id,
          allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
        },
      ],
    });

    // Position the channel after the jump channel
    try {
      await newChannel.setPosition(channel.position + 1);
    } catch (error) {
      logger.warn('Failed to set channel position:', error);
    }

    // Record the new temp channel in the database
    await prisma.temporary_voice_channel.create({
      data: {
        server_uid: BigInt(guild.id),
        creator_uid: BigInt(member.id),
        channel_uid: BigInt(newChannel.id),
        is_jump_channel: false,
        active: true,
      },
    });

    // Move the user to the new channel
    await member.voice.setChannel(newChannel, 'Moving to newly created temp channel');

    logger.info(`Created temp voice channel ${newChannel.name} for ${member.user.username}`);
  } catch (error) {
    logger.error('Failed to handle jump channel join:', error);
  }
}

/**
 * Handle when a user leaves a voice channel
 * If it's a temp channel and now empty, delete it
 */
async function handleChannelLeave(oldState: VoiceState, _newState: VoiceState): Promise<void> {
  const oldChannel = oldState.channel;
  const guild = oldState.guild;

  if (!oldChannel) {
    return;
  }

  try {
    // Check if this is a temp channel (not a jump channel)
    const tempChannel = await prisma.temporary_voice_channel.findFirst({
      where: {
        server_uid: BigInt(guild.id),
        channel_uid: BigInt(oldChannel.id),
        is_jump_channel: false,
        active: true,
      },
    });

    if (!tempChannel) {
      return;
    }

    // Check if the channel is now empty
    // Need to fetch fresh channel data since cache might be stale
    const freshChannel = await guild.channels.fetch(oldChannel.id).catch(() => null);

    if (freshChannel?.type !== ChannelType.GuildVoice) {
      // Channel already deleted
      await prisma.temporary_voice_channel.update({
        where: { id: tempChannel.id },
        data: { active: false },
      });
      return;
    }

    // Check member count
    if (freshChannel.members.size > 0) {
      logger.debug(
        `Temp channel ${freshChannel.name} still has ${freshChannel.members.size} members`
      );
      return;
    }

    logger.debug(`Temp channel ${freshChannel.name} is now empty, deleting...`);

    // Mark as inactive in database
    await prisma.temporary_voice_channel.update({
      where: { id: tempChannel.id },
      data: { active: false },
    });

    // Delete the channel
    await freshChannel.delete('Temporary voice channel is empty');

    logger.info(`Deleted empty temp voice channel: ${freshChannel.name}`);
  } catch (error) {
    logger.error('Failed to handle temp channel leave:', error);
  }
}

export default event;

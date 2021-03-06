# frozen_string_literal: true

class InviteContainer < BaseEventContainer
  server_create do |event|
    log_all_invites(event.server)
  end

  member_join do |event|
    handle_member_join(event)
  end

  raw do |event|
    if event.type == :INVITE_CREATE
      handle_invite_create(event)
    end

    if event.type == :INVITE_UPDATE
      pp :INVITE_UPDATE
      pp event
    end

    if event.type == :INVITE_DELETE
      handle_invite_delete(event)
    end

    if event.type == :READY
      servers = event.bot.servers.values

      servers.each do |server|
        log_all_invites(server)
      end
    end
  end

  def self.handle_invite_create(event)
    # Save the new invite that was just created
    data = event.data.symbolize_keys

    expires = (data[:max_age].zero? ? nil : Time.now + data[:max_age].seconds)

    Invite.create!(
      server_uid: data[:guild_id],
      inviter_uid: data[:inviter]["id"],
      code: data[:code],
      channel_uid: data[:channel_id],
      uses: data[:uses],
      max_uses: data[:max_uses],
      active: true,
      temporary: data[:temporary],
      expires: expires,
    )

    # :INVITE_CREATE
    # {"uses"=>0,
    #  "temporary"=>true,
    #  "max_uses"=>1,
    #  "max_age"=>3600,
    #  "inviter"=>
    #   {"username"=>"Dracco",
    #    "id"=>"147930850091073536",
    #    "discriminator"=>"0001",
    #    "avatar"=>"db040d6c9c49f67f87c162b88c52ae03"},
    #  "guild_id"=>"351488576325681162",
    #  "created_at"=>"2020-03-21T22:50:32.853014+00:00",
    #  "code"=>"HbHFwR",
    #  "channel_id"=>"464322466198716437"}
  end

  def self.handle_invite_delete(event)
    data = event.data.symbolize_keys
    guild_id = data[:guild_id]

    # Get the user the deleted the invite
    # based on the server's audit logs
    server = get_server_by_guild_id(guild_id, event.bot)

    # TODO: Maybe make this a little more error-hardened
    audit_log = server.audit_logs.latest

    # Check to see if that log is for the invite delete
    if audit_log.action == :invite_delete
      user = audit_log.user
    end

    invite = Invite.find_by(
      server_uid: data[:guild_id],
      code: data[:code],
      channel_uid: data[:channel_id],
    )

    # Make sure we already have a log of that invite
    # Potentially add record in the future based
    # on audit logs if one doesn't exist
    # Set the invite to inactive
    invite&.update!(
      active: false,
      deleter_uid: user&.id
    )

    # :INVITE_DELETE
    # {"guild_id"=>"351488576325681162",
    #  "code"=>"HbHFwR",
    #  "channel_id"=>"464322466198716437"}
  end

  def self.handle_member_join(event)
    user = UserService.ensure_user(event.user)
    current_invites = Invite.where(server_uid: event.server.id, active: true).to_a
    new_invites = event.server.invites

    used_invite = get_used_invite(new_invites, current_invites)

    # TODO
    # Figure out what to do with one-time invites
    # currently, it's just kind of ignoring them.
    # We might be able to figure out what was the
    # most recently un-activated invite and assume
    # that they joined from that?

    return unless used_invite

    # Update the invite
    invite = InviteService.ensure_invite(used_invite)

    # Update the join table
    InviteDiscordUser.create!(
      invite: invite,
      discord_user: user
    )
  end

  def self.log_all_invites(server)
    invites = server.invites

    # Make sure we have a record of all current invites
    invites.each do |incoming_invite|
      InviteService.ensure_invite(incoming_invite)
    end

    # Get all of the current codes
    codes = invites.map(&:code)

    # Mark any no longer there as inactive
    Invite.
      where(server_uid: server.id, active: true).
      where.not(code: codes).
      update_all(active: false)
  end

  def self.get_used_invite(new_invites, current_invites)
    # Loop over the new invites
    new_invites.each do |new_invite|
      new_code = new_invite.code.to_s

      # loop over the old invites
      current_invites.each do |current_invite|
        # check to see if it's the same code
        next unless new_code == current_invite.code.to_s

        # if it is, is the uses different?
        if new_invite.uses != current_invite.uses
          return new_invite
        end
      end
    end

    nil
  end
end

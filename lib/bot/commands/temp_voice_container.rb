# frozen_string_literal: true

class TempVoiceContainer < BaseCommandContainer
  extend Discordrb::EventContainer

  command(
    :createjumpchannel,
    min_args: 1,
    max_args: 1,
    description: "Creates a new temporary voice jump channel",
    usage: "createjumpchannel [jump channel name]",
    help_available: false
  ) do |event, jump_channel_name|
    return "Please supply a jump channel name" unless jump_channel_name

    UserService.ensure_user(event.user)

    # Make sure that the user is an admin
    break unless event.user.permission?(:administrator)

    server = event.server

    # Make the channel
    new_channel = server.create_channel(
      jump_channel_name,
      2, # type
      reason: "Creating temporary voice jump channel"
    )

    # Record information to DB

    "Channel \"#{new_quote.id}\" created"
  end

  def self.random_quote(server_id:, user: nil)
    quote = Quote.where(server_uid: server_id)

    if user
      quote = quote.where(quotee_uid: user.id)
    end

    quote.order("RANDOM()").first
  end
end

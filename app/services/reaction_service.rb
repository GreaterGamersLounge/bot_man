# frozen_string_literal: true

class ReactionService
  def self.remove_reactions(message:, emoji: nil)
    unless emoji
      message.delete_all_reactions
      return
    end

    name = emoji_name(emoji)

    message.reactions.each_value do |reaction|
      next unless reaction.name == name

      reaction_string = reaction.to_s

      users = message.reacted_with(reaction_string)

      users.each do |u|
        message.delete_reaction(u, reaction_string)
      end
    end
  end

  def self.parse_emoji_key(emoji)
    return emoji unless emoji.include? ":"

    key = /.*:(.*)>/.match(emoji)[1]

    if key.present?
      /:(.*)>/.match(emoji)[1]
    else
      /<:(.*):>/.match(emoji)[1]
    end
  end

  def self.emoji_in_server(server, emoji)
    return true unless custom_emoji?(emoji)

    # Parse out emoji id
    incoming_id = /.*:(\d*)/.match(emoji)[1]

    # Attempt to find that emoji in this server
    emojis = server.emojis

    emojis.select do |key, _|
      key.to_s == incoming_id
    end
  end

  def self.reaction_key(emoji)
    if custom_emoji?(emoji)
      /.*:(.*:\d*)/.match(emoji)[1]
    else
      emoji
    end
  end

  def self.emoji_name(emoji)
    if custom_emoji?(emoji)
      /.*:(.*):\d*/.match(emoji)[1]
    else
      emoji
    end
  end

  def self.custom_emoji?(emoji)
    emoji.include? ":"
  end
end

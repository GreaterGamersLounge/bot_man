# frozen_string_literal: true

# == Schema Information
#
# Table name: events
#
#  id         :bigint           not null, primary key
#  data       :jsonb
#  type       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Events::GuildJoinRequestUpdateEvent < Event
end

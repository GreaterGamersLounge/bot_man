# frozen_string_literal: true

class RawEventContainer < BaseEventContainer
  raw do |event|
    # https://discordapp.com/developers/docs/topics/gateway#commands-and-events

    payload = {
      type: "Events::#{event.type.to_s.downcase.classify}Event",
      data: event.data
    }

    RawWorker.perform_async(payload)
  end
end

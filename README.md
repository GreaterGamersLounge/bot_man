# bot_man

[![Build Status](https://travis-ci.com/GreaterGamersLounge/bot_man.svg?branch=master)](https://travis-ci.com/GreaterGamersLounge/bot_man)
[![Maintainability](https://api.codeclimate.com/v1/badges/1a8f45d674c4b0661be5/maintainability)](https://codeclimate.com/github/GreaterGamersLounge/bot_man/maintainability)

---

## Setup:

- Soon™

## Running:

1. Start up the Docker containers:
   - `docker-compose up`

1. Grab the bot token from:
   - https://discordapp.com/developers/applications/662139319305371669/bots

1. Get into a shell inside of the container:
   - `docker-compose exec web-bot bash`

1. Set the bot environment variable:
   - `export export BOTMAN_BOT_TOKEN={token from step 1}`

1. Run the bot:
   - `rake discord:bot`

## Adding the bot:

To add the bot to your server, visit this link:
[https://discordapp.com/oauth2/authorize?client_id=662139319305371669&scope=bot&permissions=8](https://discordapp.com/oauth2/authorize?client_id=662139319305371669&scope=bot&permissions=8)

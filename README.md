# Cozy Plushie Snow Bot

A production-ready Discord bot built with `discord.js` v14 and SQLite. Users adopt adorable snow plushies, care for them with slash commands, earn snowflakes, collect rare plushies, and experience cozy seasonal server events.

## Features

- Plushie care loop with `/adopt`, `/feed`, `/hug`, `/sleep`, and `/status`
- Persistent snowflake economy with `/daily`, `/work`, `/balance`, `/shop`, `/buy`, `/inventory`
- Personality-driven plushie responses without external APIs
- Swappable rare plushie collection
- Automated server events like blizzards, cozy nights, and snow festivals
- SQLite persistence for user data, plushies, inventory, guild settings, and active events
- Embed-rich responses, cooldown protection, and structured logging

## Tech Stack

- Node.js
- `discord.js` v14
- `better-sqlite3`
- `dotenv`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Fill in your Discord application values in `.env`.

4. Start the bot:

```bash
npm start
```

## Environment Variables

- `DISCORD_TOKEN`
  - Your Discord bot token.
- `CLIENT_ID`
  - Your Discord application client ID.
- `GUILD_ID`
  - Optional. If set, commands are registered to one guild for faster updates during development.
- `DATABASE_PATH`
  - Path to the SQLite database file. Default example: `./data/cozy-plushie.sqlite`
- `LOG_LEVEL`
  - `debug`, `info`, `warn`, or `error`
- `EVENT_TICK_MINUTES`
  - How often the bot checks for new snow events.

## Slash Commands

- `/adopt name type`
- `/feed [item]`
- `/hug`
- `/sleep`
- `/status`
- `/daily`
- `/work`
- `/balance`
- `/shop [category]`
- `/buy item`
- `/inventory`
- `/swapplushie plushie`
- `/seteventchannel channel`

## Notes

- On first boot, the bot creates the SQLite schema automatically.
- The shop catalog is seeded automatically with food, comfort items, scarves, heaters, and rare plushies.
- New adopters receive a small starter stash of biscuits so `/feed` works right away.
- `/daily` and `/work` cooldowns are stored in the database, so restarting the bot does not reset them.
- Rare plushies become collectible owned pets and can be activated later with `/swapplushie`.

## Development Tips

- Use `GUILD_ID` during development to make slash command updates appear quickly.
- Run `node --check` on files or `npm run check` for a basic syntax pass.
- The bot keeps event scheduling in-process, so keep one active production instance running.

## Deployment

- A `Dockerfile` is included for worker-style hosting platforms.
- For Railway, Render, Fly.io, or similar services, deploy this repo as a long-running worker/service and provide the same environment variables from `.env.example`.
- Because this is a Discord bot rather than a web server, it does not expose an HTTP port by default.

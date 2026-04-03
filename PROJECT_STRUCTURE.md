# Project Structure

This bot is organized so game logic, Discord wiring, and persistence stay separate and easy to grow.

- `src/index.js`
  - Boots the bot, validates config, initializes SQLite, registers slash commands, loads handlers, and starts the event scheduler.
- `src/commands/`
  - Each file exports one slash command definition and its execution logic.
- `src/events/`
  - Discord lifecycle handlers such as `ready` and `interactionCreate`.
- `src/services/`
  - Plushie logic, economy rewards, shop purchases, cooldown helpers, personality text generation, and snow event scheduling.
- `src/database/`
  - SQLite initialization, schema setup, seed data, and repository-style data access helpers.
- `src/utils/`
  - Shared constants, embed builders, time formatting, and logger helpers.

Runtime flow:

1. `src/index.js` loads environment variables and opens the SQLite database.
2. The database layer creates tables and seeds the shop catalog on first boot.
3. Commands are registered with Discord through the REST API.
4. `interactionCreate` routes slash commands to command modules.
5. Services apply stat decay, cooldown checks, reward calculations, inventory updates, and event modifiers.
6. The scheduler periodically rolls cozy server events and posts them into configured channels.

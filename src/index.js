const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, REST, Routes } = require("discord.js");
const { config, ensureRuntimeDirectories, validateConfig } = require("./config");
const { CozyDatabase } = require("./database/database");
const { createLogger } = require("./utils/logger");
const { PersonalityService } = require("./services/personalityService");
const { CooldownService } = require("./services/cooldownService");
const { PlushieService } = require("./services/plushieService");
const { EconomyService } = require("./services/economyService");
const { ShopService } = require("./services/shopService");
const { EventService } = require("./services/eventService");

function loadCommands() {
  const commands = new Collection();
  const commandPath = path.join(__dirname, "commands");
  const files = fs.readdirSync(commandPath).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const command = require(path.join(commandPath, file));
    commands.set(command.data.name, command);
  }

  return commands;
}

function registerEvents(client, context) {
  const eventsPath = path.join(__dirname, "events");
  const files = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, context));
      continue;
    }

    client.on(event.name, (...args) => event.execute(...args, context));
  }
}

async function registerSlashCommands(commands, logger) {
  const rest = new REST({ version: "10" }).setToken(config.token);
  const body = [...commands.values()].map((command) => command.data.toJSON());

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
    logger.info("Registered slash commands for a development guild.", { guildId: config.guildId });
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body });
  logger.info("Registered global slash commands.");
}

async function bootstrap() {
  validateConfig();
  ensureRuntimeDirectories();

  const logger = createLogger(config.logLevel);
  const db = new CozyDatabase(config.databasePath);
  db.initialize();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  const commands = loadCommands();
  const personalityService = new PersonalityService();
  const cooldownService = new CooldownService();
  const plushieService = new PlushieService(db, personalityService);
  const economyService = new EconomyService(db);
  const shopService = new ShopService(db, plushieService, personalityService);
  const eventService = new EventService(db, logger);

  const context = {
    logger,
    commands,
    services: {
      db,
      cooldownService,
      personalityService,
      plushieService,
      economyService,
      shopService,
      eventService
    }
  };

  registerEvents(client, context);
  await registerSlashCommands(commands, logger);
  await client.login(config.token);
  eventService.start(client, config.eventTickMinutes);

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down cozy systems.`);
    eventService.stop();
    db.close();
    await client.destroy();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT").catch((error) => {
      logger.error("Shutdown failed.", { error: error.message });
      process.exit(1);
    });
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch((error) => {
      logger.error("Shutdown failed.", { error: error.message });
      process.exit(1);
    });
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start the bot:", error);
  process.exit(1);
});

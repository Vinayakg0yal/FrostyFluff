const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

const config = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || "",
  databasePath: process.env.DATABASE_PATH || "./data/cozy-plushie.sqlite",
  logLevel: process.env.LOG_LEVEL || "info",
  eventTickMinutes: Number(process.env.EVENT_TICK_MINUTES || 10)
};

function ensureRuntimeDirectories() {
  const absolutePath = path.resolve(config.databasePath);
  const directory = path.dirname(absolutePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function validateConfig() {
  const missing = [];

  if (!config.token) {
    missing.push("DISCORD_TOKEN");
  }

  if (!config.clientId) {
    missing.push("CLIENT_ID");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!Number.isFinite(config.eventTickMinutes) || config.eventTickMinutes <= 0) {
    throw new Error("EVENT_TICK_MINUTES must be a positive number.");
  }
}

module.exports = {
  config,
  ensureRuntimeDirectories,
  validateConfig
};

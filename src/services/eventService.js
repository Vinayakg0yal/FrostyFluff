const { EmbedBuilder } = require("discord.js");
const { EVENT_DEFINITIONS } = require("../utils/constants");
const { pickRandom, randomInt } = require("../utils/helpers");

class EventService {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    this.activeInterval = null;
  }

  async getActiveEventForGuild(guildId) {
    if (!guildId) {
      return null;
    }

    const state = this.db.getEventState(guildId);
    if (!state || !state.event_type) {
      return null;
    }

    if (state.ends_at && state.ends_at <= Date.now()) {
      this.db.clearActiveEvent(guildId);
      return null;
    }

    return state;
  }

  start(client, tickMinutes) {
    const intervalMs = tickMinutes * 60_000;
    this.tick(client).catch((error) => {
      this.logger.error("Initial event tick failed.", { error: error.message });
    });
    this.activeInterval = setInterval(() => {
      this.tick(client).catch((error) => {
        this.logger.error("Event tick failed.", { error: error.message });
      });
    }, intervalMs);
  }

  stop() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
  }

  async tick(client) {
    const guilds = this.db.getGuildsWithEventChannels();

    for (const guildSettings of guilds) {
      await this.handleGuild(client, guildSettings);
    }
  }

  async handleGuild(client, guildSettings) {
    const now = Date.now();
    const current = this.db.getEventState(guildSettings.guild_id);

    if (current?.event_type && current.ends_at > now) {
      return;
    }

    if (current?.event_type && current.ends_at <= now) {
      this.db.clearActiveEvent(guildSettings.guild_id);
    }

    const lastRoll = current?.last_roll_at || 0;
    const twoHours = 2 * 60 * 60 * 1000;
    if (now - lastRoll < twoHours) {
      return;
    }

    const shouldStart = Math.random() < 0.35;
    if (!shouldStart) {
      this.db.upsertEventState(guildSettings.guild_id, { last_roll_at: now });
      return;
    }

    const eventType = pickRandom(Object.keys(EVENT_DEFINITIONS));
    const definition = EVENT_DEFINITIONS[eventType];
    const durationMinutes = randomInt(definition.durationMinutes[0], definition.durationMinutes[1]);
    const nextState = this.db.upsertEventState(guildSettings.guild_id, {
      event_type: eventType,
      starts_at: now,
      ends_at: now + durationMinutes * 60_000,
      last_roll_at: now
    });

    const channel = await client.channels.fetch(guildSettings.event_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      this.logger.warn("Skipping event announcement because the configured channel is unavailable.", {
        guildId: guildSettings.guild_id,
        channelId: guildSettings.event_channel_id
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xbbe7ff)
      .setTitle(`${definition.emoji} ${definition.name}`)
      .setDescription(definition.description)
      .addFields({
        name: "Duration",
        value: `${durationMinutes} minutes`,
        inline: true
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    this.logger.info("Started a guild event.", { guildId: guildSettings.guild_id, eventType, eventEndsAt: nextState.ends_at });
  }
}

module.exports = {
  EventService
};

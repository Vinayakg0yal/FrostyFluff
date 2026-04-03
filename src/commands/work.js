const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed, createErrorEmbed } = require("../utils/embeds");
const { pickRandom } = require("../utils/helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Do a snowy job and earn snowflakes."),
  async execute(interaction, context) {
    const { economyService, eventService, shopService, db } = context.services;
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);
    const result = economyService.doWork(interaction.user.id, activeEvent);

    if (!result.ok) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed(result.message)]
      });
    }

    let dropField = null;

    if (activeEvent?.event_type === "snow_festival" && Math.random() < 0.28) {
      const pool = shopService.getFestivalDropPool();
      const drop = pickRandom(pool);

      if (drop) {
        db.addInventoryItem(interaction.user.id, drop.item_key, drop.item_type, 1);
        dropField = {
          name: "Festival Drop",
          value: `${drop.emoji} **${drop.name}** slipped into your satchel.`,
          inline: false
        };
      }
    }

    const embed = createBaseEmbed({
      title: `🧤 Work Complete: ${result.job.name}`,
      description: `${result.job.intro}\n\nYou earned **${result.reward} ❄️**.`
    }).addFields({ name: "New Balance", value: `${result.balance} ❄️`, inline: true });

    if (activeEvent?.event_type === "blizzard") {
      embed.addFields({
        name: "Blizzard Bonus",
        value: "A glittering blizzard boosted your payout.",
        inline: false
      });
    }

    if (dropField) {
      embed.addFields(dropField);
    }

    return interaction.reply({ embeds: [embed] });
  }
};

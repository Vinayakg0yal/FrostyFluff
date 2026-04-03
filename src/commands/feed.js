const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed, renderStatBar } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.feed,
  data: new SlashCommandBuilder()
    .setName("feed")
    .setDescription("Feed your active plushie from your inventory.")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Optional item key from /shop or /inventory. If omitted, the first food item is used.")
        .setRequired(false)
    ),
  async execute(interaction, context) {
    const { eventService, plushieService } = context.services;
    const itemKey = interaction.options.getString("item")?.trim().toLowerCase();
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);

    try {
      const result = plushieService.feedActivePlushie(interaction.user.id, itemKey, activeEvent);
      const summary = plushieService.getStatusSummary(result.plushie);

      const embed = createBaseEmbed({
        title: `🍪 ${result.plushie.name} enjoyed ${result.item.name}`,
        description: result.response
      })
        .addFields(
          { name: "Mood", value: summary.mood, inline: true },
          { name: "Personality", value: summary.personalityLabel, inline: true },
          { name: "Hunger", value: renderStatBar(result.plushie.hunger), inline: false },
          { name: "Happiness", value: renderStatBar(result.plushie.happiness), inline: false },
          { name: "Warmth", value: renderStatBar(result.plushie.warmth), inline: false }
        );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed(error.message)]
      });
    }
  }
};

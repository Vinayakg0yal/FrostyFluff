const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed, renderStatBar } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.sleep,
  data: new SlashCommandBuilder()
    .setName("sleep")
    .setDescription("Let your plushie rest and recharge."),
  async execute(interaction, context) {
    const { eventService, plushieService } = context.services;
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);

    try {
      const result = plushieService.applyCareAction(interaction.user.id, "sleep", activeEvent);
      const summary = plushieService.getStatusSummary(result.plushie);

      const embed = createBaseEmbed({
        title: `💤 ${result.plushie.name} drifted off`,
        description: result.response
      })
        .addFields(
          { name: "Mood", value: summary.mood, inline: true },
          { name: "Energy", value: renderStatBar(result.plushie.energy), inline: false },
          { name: "Warmth", value: renderStatBar(result.plushie.warmth), inline: false },
          { name: "Happiness", value: renderStatBar(result.plushie.happiness), inline: false }
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

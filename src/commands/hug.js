const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed, renderStatBar } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.hug,
  data: new SlashCommandBuilder()
    .setName("hug")
    .setDescription("Wrap your active plushie in a warm hug."),
  async execute(interaction, context) {
    const { eventService, plushieService } = context.services;
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);

    try {
      const result = plushieService.applyCareAction(interaction.user.id, "hug", activeEvent);
      const summary = plushieService.getStatusSummary(result.plushie);

      const embed = createBaseEmbed({
        title: `🤍 You hugged ${result.plushie.name}`,
        description: result.response
      })
        .addFields(
          { name: "Mood", value: summary.mood, inline: true },
          { name: "Happiness", value: renderStatBar(result.plushie.happiness), inline: false },
          { name: "Warmth", value: renderStatBar(result.plushie.warmth), inline: false },
          { name: "Energy", value: renderStatBar(result.plushie.energy), inline: false }
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

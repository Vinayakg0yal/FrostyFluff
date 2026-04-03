const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.swapplushie,
  data: new SlashCommandBuilder()
    .setName("swapplushie")
    .setDescription("Switch your active plushie.")
    .addStringOption((option) =>
      option
        .setName("plushie")
        .setDescription("The plushie name or id from /inventory")
        .setRequired(true)
    ),
  async execute(interaction, context) {
    const { eventService, plushieService } = context.services;
    const query = interaction.options.getString("plushie", true).trim();
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);

    try {
      const plushie = plushieService.swapActivePlushie(interaction.user.id, query, activeEvent);
      const summary = plushieService.getStatusSummary(plushie);
      const response = context.services.personalityService.buildResponse(plushie.personality, "status", plushie);

      const embed = createBaseEmbed({
        title: `⭐ ${plushie.name} is now active`,
        description: response
      }).addFields(
        { name: "Type", value: summary.typeLabel, inline: true },
        { name: "Personality", value: summary.personalityLabel, inline: true },
        { name: "Mood", value: summary.mood, inline: true }
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

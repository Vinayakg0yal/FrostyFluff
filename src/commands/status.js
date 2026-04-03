const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed, renderStatBar } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.status,
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check how your active plushie is feeling."),
  async execute(interaction, context) {
    const { eventService, plushieService, personalityService } = context.services;
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);
    const plushie = plushieService.getActivePlushie(interaction.user.id, activeEvent);

    if (!plushie) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed("You do not have an active plushie yet. Try `/adopt`.")]
      });
    }

    const summary = plushieService.getStatusSummary(plushie);
    const moodAction = summary.mood === "cozy" ? "status" : "neglected";
    const personalityLine = personalityService.buildResponse(plushie.personality, moodAction, plushie);
    const eventLine = activeEvent
      ? `\n\n${activeEvent.event_type === "cozy_night" ? "🕯️ Cozy Night is softening the chilly air right now." : activeEvent.event_type === "blizzard" ? "🌨️ A blizzard is boosting snow rewards in this server." : "🎐 The Snow Festival may drop bonus items while it lasts."}`
      : "";

    const embed = createBaseEmbed({
      title: `❄️ ${plushie.name}'s Cozy Status`,
      description: `${personalityLine}${eventLine}`
    })
      .addFields(
        { name: "Type", value: summary.typeLabel, inline: true },
        { name: "Personality", value: summary.personalityLabel, inline: true },
        { name: "Mood", value: summary.mood, inline: true },
        { name: "Hunger", value: renderStatBar(plushie.hunger), inline: false },
        { name: "Happiness", value: renderStatBar(plushie.happiness), inline: false },
        { name: "Energy", value: renderStatBar(plushie.energy), inline: false },
        { name: "Warmth", value: renderStatBar(plushie.warmth), inline: false }
      );

    return interaction.reply({ embeds: [embed] });
  }
};

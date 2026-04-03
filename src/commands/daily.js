const { SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed, createErrorEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily snowflake bundle."),
  async execute(interaction, context) {
    const { economyService, eventService } = context.services;
    const activeEvent = await eventService.getActiveEventForGuild(interaction.guildId);
    const result = economyService.claimDaily(interaction.user.id, activeEvent);

    if (!result.ok) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed(result.message)]
      });
    }

    const bonusLine = activeEvent?.event_type === "blizzard"
      ? "\n🌨️ The active blizzard wrapped a few extra flakes into your bundle."
      : "";

    const embed = createBaseEmbed({
      title: "❄️ Daily Snow Bundle Claimed",
      description: `You received **${result.reward} ❄️**.${bonusLine}`
    }).addFields({ name: "New Balance", value: `${result.balance} ❄️`, inline: true });

    return interaction.reply({ embeds: [embed] });
  }
};

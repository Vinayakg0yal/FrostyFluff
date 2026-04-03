const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS, STARTER_PLUSHIES } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed, renderStatBar } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.adopt,
  data: new SlashCommandBuilder()
    .setName("adopt")
    .setDescription("Adopt your first cozy plushie companion.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("What do you want to name your plushie?")
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(20)
    )
    .addStringOption((option) => {
      const configured = option
        .setName("type")
        .setDescription("Choose a plushie type")
        .setRequired(true);

      for (const plushie of STARTER_PLUSHIES) {
        configured.addChoices({ name: `${plushie.emoji} ${plushie.name}`, value: plushie.value });
      }

      return configured;
    }),
  async execute(interaction, context) {
    const { plushieService } = context.services;
    const name = interaction.options.getString("name", true).trim();
    const type = interaction.options.getString("type", true);

    if (!plushieService.isValidStarterType(type)) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed("That plushie type is not part of the starter snow den.")]
      });
    }

    try {
      const plushie = plushieService.adoptPlushie(interaction.user.id, name, type);
      const mood = plushieService.getMood(plushie);
      const response = context.services.personalityService.buildResponse(plushie.personality, "adopt", plushie);

      const embed = createBaseEmbed({
        title: `🧸 ${plushie.name} joined your snow den`,
        description: `${response}\n\nYou also received **3 Starter Biscuits** so your new friend can enjoy their first snack.`
      })
        .addFields(
          { name: "Type", value: plushieService.getStatusSummary(plushie).typeLabel, inline: true },
          { name: "Personality", value: plushieService.getStatusSummary(plushie).personalityLabel, inline: true },
          { name: "Mood", value: mood, inline: true },
          { name: "Hunger", value: renderStatBar(plushie.hunger), inline: false },
          { name: "Happiness", value: renderStatBar(plushie.happiness), inline: false },
          { name: "Energy", value: renderStatBar(plushie.energy), inline: false },
          { name: "Warmth", value: renderStatBar(plushie.warmth), inline: false }
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

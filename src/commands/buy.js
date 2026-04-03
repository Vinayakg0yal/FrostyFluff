const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed, createErrorEmbed } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.buy,
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy something from the snow shop.")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item key shown in /shop")
        .setRequired(true)
    ),
  async execute(interaction, context) {
    const { shopService, economyService } = context.services;
    const itemKey = interaction.options.getString("item", true).trim().toLowerCase();

    try {
      const result = shopService.buy(interaction.user.id, itemKey);
      const balance = economyService.getBalance(interaction.user.id);

      let description = `${result.item.emoji} You bought **${result.item.name}** for **${result.item.price} ❄️**.`;

      if (result.kind === "plushie") {
        description += `\n${result.plushie.name} has joined your collection and can be activated later with \`/swapplushie\`.`;
      } else if (result.passiveNote) {
        description += `\n${result.passiveNote}`;
      }

      const embed = createBaseEmbed({
        title: "🧾 Purchase Complete",
        description
      }).addFields({ name: "Remaining Balance", value: `${balance} ❄️`, inline: true });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed(error.message)]
      });
    }
  }
};

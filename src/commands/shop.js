const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed } = require("../utils/embeds");
const { titleCase } = require("../utils/helpers");

const CATEGORIES = ["food", "wearable", "utility", "comfort", "plushie"];

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.shop,
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Browse the snow shop.")
    .addStringOption((option) => {
      const configured = option
        .setName("category")
        .setDescription("Filter the shop by category")
        .setRequired(false);

      for (const category of CATEGORIES) {
        configured.addChoices({ name: titleCase(category), value: category });
      }

      return configured;
    }),
  async execute(interaction, context) {
    const { shopService } = context.services;
    const category = interaction.options.getString("category");
    const items = shopService.getShop(category);
    const grouped = new Map();

    for (const item of items) {
      const key = titleCase(item.category);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key).push(shopService.describeItem(item));
    }

    const embed = createBaseEmbed({
      title: "🛍️ Cozy Snow Shop",
      description: "Use `/buy item:<item_key>` to bring something warm and lovely home."
    });

    for (const [groupName, lines] of grouped.entries()) {
      embed.addFields({
        name: groupName,
        value: lines.join("\n"),
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed] });
  }
};

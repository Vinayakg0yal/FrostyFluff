const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed } = require("../utils/embeds");
const { titleCase } = require("../utils/helpers");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.inventory,
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your plushie collection and stored items."),
  async execute(interaction, context) {
    const { db } = context.services;
    const items = db.getInventory(interaction.user.id);
    const plushies = db.getUserPlushies(interaction.user.id);

    const itemLines = items.length > 0
      ? items.map((item) => `${item.emoji} **${item.name}** x${item.quantity} • ${titleCase(item.category)}`)
      : ["No items yet. Visit `/shop` to stock up."];

    const plushieLines = plushies.length > 0
      ? plushies.map((plushie) => `${plushie.is_active ? "⭐" : "•"} **${plushie.name}** • ${titleCase(plushie.type)} • ${titleCase(plushie.personality)}`)
      : ["No plushies yet. Start with `/adopt`."];

    const embed = createBaseEmbed({
      title: "🎒 Cozy Inventory",
      description: "Everything you own, from snacks to snow-soft companions."
    })
      .addFields(
        { name: "Items", value: itemLines.join("\n"), inline: false },
        { name: "Plushie Collection", value: plushieLines.join("\n"), inline: false }
      );

    return interaction.reply({ embeds: [embed] });
  }
};

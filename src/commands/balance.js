const { SlashCommandBuilder } = require("discord.js");
const { COMMAND_COOLDOWNS } = require("../utils/constants");
const { createBaseEmbed } = require("../utils/embeds");

module.exports = {
  cooldownMs: COMMAND_COOLDOWNS.balance,
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your snowflake balance."),
  async execute(interaction, context) {
    const { economyService } = context.services;
    const balance = economyService.getBalance(interaction.user.id);

    const embed = createBaseEmbed({
      title: "❄️ Snowflake Balance",
      description: `You currently have **${balance} ❄️** tucked into your cozy pouch.`
    });

    return interaction.reply({ embeds: [embed] });
  }
};

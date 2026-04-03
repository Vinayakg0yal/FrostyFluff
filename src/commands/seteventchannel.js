const { ChannelType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { createBaseEmbed, createErrorEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("seteventchannel")
    .setDescription("Set the channel used for automatic snow event announcements.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The announcement channel for snow events")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction, context) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        ephemeral: true,
        embeds: [createErrorEmbed("You need the Manage Server permission to set the event channel.")]
      });
    }

    const channel = interaction.options.getChannel("channel", true);
    context.services.db.setEventChannel(interaction.guildId, channel.id);

    const embed = createBaseEmbed({
      title: "📣 Event Channel Updated",
      description: `Automatic snow events will now appear in ${channel}.`
    });

    return interaction.reply({ embeds: [embed] });
  }
};

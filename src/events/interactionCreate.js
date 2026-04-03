const { createErrorEmbed } = require("../utils/embeds");
const { formatDuration } = require("../utils/time");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, context) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = context.commands.get(interaction.commandName);
    if (!command) {
      return;
    }

    const remaining = context.services.cooldownService.check(
      interaction.user.id,
      interaction.commandName,
      command.cooldownMs
    );

    if (remaining > 0) {
      const reply = {
        ephemeral: true,
        embeds: [createErrorEmbed(`Please wait ${formatDuration(remaining)} before using \`/${interaction.commandName}\` again.`)]
      };

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp(reply);
      }

      return interaction.reply(reply);
    }

    try {
      await command.execute(interaction, context);
    } catch (error) {
      context.logger.error("Command execution failed.", {
        command: interaction.commandName,
        userId: interaction.user.id,
        error: error.stack || error.message
      });

      const payload = {
        ephemeral: true,
        embeds: [createErrorEmbed("Something went wrong while I was fluffing that response. Please try again.")]
      };

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
      }

      return interaction.reply(payload);
    }
  }
};

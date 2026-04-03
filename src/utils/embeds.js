const { EmbedBuilder } = require("discord.js");

function createBaseEmbed({ title, description, color = 0x8fd3ff }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function createErrorEmbed(message) {
  return createBaseEmbed({
    title: "A tiny snowstorm happened",
    description: `❄️ ${message}`,
    color: 0xf16b6b
  });
}

function createSuccessEmbed(title, description) {
  return createBaseEmbed({
    title,
    description,
    color: 0x7dd3a7
  });
}

function renderStatBar(value) {
  const filled = Math.round(value / 10);
  return `${"▰".repeat(filled)}${"▱".repeat(10 - filled)} ${Math.round(value)}`;
}

module.exports = {
  createBaseEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  renderStatBar
};

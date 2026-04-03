module.exports = {
  name: "clientReady",
  once: true,
  async execute(client, context) {
    context.logger.info(`Logged in as ${client.user.tag}.`);
  }
};

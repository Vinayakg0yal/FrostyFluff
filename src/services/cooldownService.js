class CooldownService {
  constructor() {
    this.cooldowns = new Map();
  }

  check(userId, commandName, cooldownMs) {
    if (!cooldownMs) {
      return 0;
    }

    const key = `${userId}:${commandName}`;
    const now = Date.now();
    const lastUsed = this.cooldowns.get(key) || 0;
    const remaining = lastUsed + cooldownMs - now;

    if (remaining > 0) {
      return remaining;
    }

    this.cooldowns.set(key, now);
    return 0;
  }
}

module.exports = {
  CooldownService
};

const { DAILY_COOLDOWN_MS, DAILY_REWARD_RANGE, JOBS, WORK_COOLDOWN_MS } = require("../utils/constants");
const { formatDuration, getRemainingCooldown } = require("../utils/time");
const { randomInt, weightedPick } = require("../utils/helpers");

class EconomyService {
  constructor(db) {
    this.db = db;
  }

  getBalance(userId) {
    return this.db.getOrCreateUser(userId).balance;
  }

  claimDaily(userId, activeEvent) {
    const user = this.db.getOrCreateUser(userId);
    const remaining = getRemainingCooldown(user.last_daily_at, DAILY_COOLDOWN_MS);

    if (remaining > 0) {
      return {
        ok: false,
        remaining,
        message: `Your daily snow bundle will drift back in ${formatDuration(remaining)}.`
      };
    }

    let reward = randomInt(DAILY_REWARD_RANGE.min, DAILY_REWARD_RANGE.max);

    if (activeEvent?.event_type === "blizzard") {
      reward = Math.round(reward * 1.15);
    }

    const updated = this.db.updateUser(userId, {
      balance: user.balance + reward,
      last_daily_at: Date.now()
    });

    return {
      ok: true,
      reward,
      balance: updated.balance
    };
  }

  doWork(userId, activeEvent) {
    const user = this.db.getOrCreateUser(userId);
    const remaining = getRemainingCooldown(user.last_work_at, WORK_COOLDOWN_MS);

    if (remaining > 0) {
      return {
        ok: false,
        remaining,
        message: `The snowy job board refreshes in ${formatDuration(remaining)}.`
      };
    }

    const job = weightedPick(JOBS);
    let reward = randomInt(job.rewardMin, job.rewardMax);

    if (activeEvent?.event_type === "blizzard") {
      reward = Math.round(reward * 1.25);
    }

    const updated = this.db.updateUser(userId, {
      balance: user.balance + reward,
      last_work_at: Date.now()
    });

    return {
      ok: true,
      reward,
      job,
      balance: updated.balance
    };
  }
}

module.exports = {
  EconomyService
};

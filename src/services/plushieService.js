const { ACTION_EFFECTS, PERSONALITIES, STARTER_PLUSHIES, STAT_DECAY_PER_HOUR, STAT_LIMITS } = require("../utils/constants");
const { clamp, titleCase } = require("../utils/helpers");

class PlushieService {
  constructor(db, personalityService) {
    this.db = db;
    this.personalityService = personalityService;
  }

  adoptPlushie(userId, name, type, sourceKey = null, rarity = "common", isActive = true) {
    const existing = this.db.getUserPlushies(userId);

    if (!sourceKey && existing.length > 0) {
      throw new Error("You already have a plushie family started. Rare plushies can be collected through the shop.");
    }

    const personality = this.personalityService.getRandomPersonalityKey();
    const plushie = this.db.createPlushie({
      ownerId: userId,
      name,
      type,
      personality,
      isActive,
      sourceKey,
      rarity
    });

    if (!sourceKey) {
      this.db.addInventoryItem(userId, "starter_biscuits", "food", 3);
    }

    return this.getResolvedPlushie(plushie, null);
  }

  getResolvedPlushie(plushie, activeEvent) {
    if (!plushie) {
      return null;
    }

    const inventory = this.db.getInventory(plushie.owner_id);
    return this.applyDecayAndPersist(plushie, inventory, activeEvent);
  }

  getActivePlushie(userId, activeEvent) {
    const plushie = this.db.getActivePlushie(userId);
    if (!plushie) {
      return null;
    }

    const inventory = this.db.getInventory(userId);
    return this.applyDecayAndPersist(plushie, inventory, activeEvent);
  }

  getInventoryPassives(inventory) {
    const passives = {
      warmthDecayMultiplier: 1,
      passiveWarmthPerHour: 0,
      passiveHappinessPerHour: 0,
      extraSleepEnergy: 0
    };

    for (const item of inventory) {
      if (item.item_type !== "gear") {
        continue;
      }

      const effect = JSON.parse(item.effect_json || "{}");
      passives.warmthDecayMultiplier *= effect.warmthDecayMultiplier ?? 1;
      passives.passiveWarmthPerHour += effect.passiveWarmthPerHour ?? 0;
      passives.passiveHappinessPerHour += effect.passiveHappinessPerHour ?? 0;
      passives.extraSleepEnergy += effect.extraSleepEnergy ?? 0;
    }

    return passives;
  }

  applyDecayAndPersist(plushie, inventory, activeEvent) {
    const elapsedHours = Math.max(0, (Date.now() - plushie.updated_at) / 3_600_000);

    if (elapsedHours <= 0.01) {
      return plushie;
    }

    const passives = this.getInventoryPassives(inventory);
    const eventType = activeEvent?.event_type || null;

    const decay = {
      hunger: STAT_DECAY_PER_HOUR.hunger * elapsedHours,
      happiness: STAT_DECAY_PER_HOUR.happiness * elapsedHours,
      energy: STAT_DECAY_PER_HOUR.energy * elapsedHours,
      warmth: STAT_DECAY_PER_HOUR.warmth * elapsedHours * passives.warmthDecayMultiplier
    };

    if (eventType === "cozy_night") {
      decay.happiness *= 0.65;
      decay.warmth *= 0.55;
    }

    const next = {
      hunger: clamp(plushie.hunger - decay.hunger, STAT_LIMITS.min, STAT_LIMITS.max),
      happiness: clamp(
        plushie.happiness - decay.happiness + passives.passiveHappinessPerHour * elapsedHours,
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      energy: clamp(plushie.energy - decay.energy, STAT_LIMITS.min, STAT_LIMITS.max),
      warmth: clamp(
        plushie.warmth - decay.warmth + passives.passiveWarmthPerHour * elapsedHours,
        STAT_LIMITS.min,
        STAT_LIMITS.max
      )
    };

    if (next.hunger < 35) {
      next.happiness = clamp(next.happiness - (35 - next.hunger) * 0.08, STAT_LIMITS.min, STAT_LIMITS.max);
    }

    if (next.warmth < 30) {
      next.energy = clamp(next.energy - (30 - next.warmth) * 0.08, STAT_LIMITS.min, STAT_LIMITS.max);
    }

    const updated = this.db.updatePlushie(plushie.id, {
      ...next,
      updated_at: Date.now()
    });

    return updated;
  }

  getMood(plushie) {
    if (plushie.warmth < 25) {
      return "cold";
    }

    if (plushie.happiness < 30) {
      return "sad";
    }

    if (plushie.energy < 25) {
      return "sleepy";
    }

    if (plushie.hunger < 25) {
      return "hungry";
    }

    return "cozy";
  }

  applyCareAction(userId, action, activeEvent) {
    const plushie = this.getActivePlushie(userId, activeEvent);
    if (!plushie) {
      throw new Error("You need to adopt a plushie first with `/adopt`.");
    }

    const inventory = this.db.getInventory(userId);
    const passives = this.getInventoryPassives(inventory);
    const baseEffects = { ...(ACTION_EFFECTS[action] || {}) };

    if (action === "sleep") {
      baseEffects.energy = (baseEffects.energy || 0) + passives.extraSleepEnergy;
    }

    if (activeEvent?.event_type === "cozy_night") {
      baseEffects.happiness = (baseEffects.happiness || 0) + 4;
      baseEffects.warmth = (baseEffects.warmth || 0) + 4;
    }

    const personalityBonuses = this.personalityService.getBonuses(plushie.personality);
    const next = {
      hunger: clamp(plushie.hunger + (baseEffects.hunger || 0), STAT_LIMITS.min, STAT_LIMITS.max),
      happiness: clamp(
        plushie.happiness + (baseEffects.happiness || 0) + (personalityBonuses.happiness || 0) * 0.2,
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      energy: clamp(
        plushie.energy + (baseEffects.energy || 0) + (personalityBonuses.energy || 0) * 0.2,
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      warmth: clamp(
        plushie.warmth + (baseEffects.warmth || 0) + (personalityBonuses.warmth || 0) * 0.2,
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      last_cared_at: Date.now(),
      updated_at: Date.now()
    };

    const updated = this.db.updatePlushie(plushie.id, next);
    return {
      plushie: updated,
      mood: this.getMood(updated),
      response: this.personalityService.buildResponse(plushie.personality, action, updated)
    };
  }

  feedActivePlushie(userId, requestedItemKey, activeEvent) {
    const plushie = this.getActivePlushie(userId, activeEvent);
    if (!plushie) {
      throw new Error("You need to adopt a plushie first with `/adopt`.");
    }

    const ownedFood = this.db.getFoodInventory(userId);
    const selected = requestedItemKey
      ? ownedFood.find((item) => item.item_key === requestedItemKey)
      : ownedFood[0];

    if (!selected) {
      throw new Error("You do not have any food right now. Visit `/shop` and pick up a cozy snack.");
    }

    const effect = JSON.parse(selected.effect_json || "{}");
    const eventBonus = activeEvent?.event_type === "cozy_night" ? { warmth: 3, happiness: 3 } : {};
    const next = {
      hunger: clamp(plushie.hunger + (effect.hunger || 0), STAT_LIMITS.min, STAT_LIMITS.max),
      happiness: clamp(
        plushie.happiness + (effect.happiness || 0) + (eventBonus.happiness || 0),
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      energy: clamp(plushie.energy + (effect.energy || 0), STAT_LIMITS.min, STAT_LIMITS.max),
      warmth: clamp(
        plushie.warmth + (effect.warmth || 0) + (eventBonus.warmth || 0),
        STAT_LIMITS.min,
        STAT_LIMITS.max
      ),
      last_cared_at: Date.now(),
      updated_at: Date.now()
    };

    this.db.consumeInventoryItem(userId, selected.item_key, 1);
    const updated = this.db.updatePlushie(plushie.id, next);

    return {
      plushie: updated,
      item: selected,
      response: this.personalityService.buildResponse(plushie.personality, "feed", updated)
    };
  }

  getPlushieCollection(userId) {
    return this.db.getUserPlushies(userId);
  }

  swapActivePlushie(userId, query, activeEvent) {
    const target = this.db.findUserPlushie(userId, query);
    if (!target) {
      throw new Error("I could not find that plushie in your collection. Try the plushie name from `/inventory`.");
    }

    const updated = this.db.setActivePlushie(userId, target.id);
    return this.getResolvedPlushie(updated, activeEvent);
  }

  getStatusSummary(plushie) {
    return {
      mood: this.getMood(plushie),
      typeLabel: titleCase(plushie.type),
      personalityLabel: PERSONALITIES[plushie.personality]?.label || titleCase(plushie.personality)
    };
  }

  isValidStarterType(type) {
    return STARTER_PLUSHIES.some((entry) => entry.value === type);
  }
}

module.exports = {
  PlushieService
};

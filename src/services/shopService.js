const { titleCase } = require("../utils/helpers");

class ShopService {
  constructor(db, plushieService, personalityService) {
    this.db = db;
    this.plushieService = plushieService;
    this.personalityService = personalityService;
  }

  getShop(category) {
    return this.db.getShopItems(category);
  }

  buy(userId, itemKey) {
    const user = this.db.getOrCreateUser(userId);
    const item = this.db.getShopItem(itemKey);

    if (!item) {
      throw new Error("That item is not in the snow shop right now. Use the item key shown in `/shop`.");
    }

    if (user.balance < item.price) {
      throw new Error(`You need ${item.price - user.balance} more ❄️ to buy ${item.name}.`);
    }

    if (item.item_type === "plushie" && this.db.hasOwnedSourceKey(userId, item.item_key)) {
      throw new Error("You already own that rare plushie.");
    }

    this.db.updateUser(userId, { balance: user.balance - item.price });

    if (item.item_type === "plushie") {
      const plushie = this.db.createPlushie({
        ownerId: userId,
        name: item.name,
        type: item.plushie_type,
        personality: this.personalityService.getRandomPersonalityKey(),
        isActive: false,
        sourceKey: item.item_key,
        rarity: item.rarity
      });

      return {
        item,
        plushie,
        kind: "plushie"
      };
    }

    this.db.addInventoryItem(userId, item.item_key, item.item_type, 1);

    return {
      item,
      kind: item.item_type,
      passiveNote: item.item_type === "gear"
        ? `${item.name} now helps your active plushie passively whenever it is in your inventory.`
        : null
    };
  }

  getFestivalDropPool() {
    return this.db
      .getShopItems()
      .filter((item) => item.item_type !== "plushie" && item.rarity !== "common");
  }

  describeItem(item) {
    return `${item.emoji} **${item.name}** \`${item.item_key}\` • ${titleCase(item.category)} • ${item.price} ❄️`;
  }
}

module.exports = {
  ShopService
};

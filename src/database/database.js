const Database = require("better-sqlite3");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const { SHOP_SEED_ITEMS } = require("../utils/constants");

class CozyDatabase {
  constructor(databasePath) {
    this.db = new Database(path.resolve(databasePath));
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  initialize() {
    this.createSchema();
    this.seedShopItems();
  }

  createSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        last_daily_at INTEGER,
        last_work_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plushies (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        personality TEXT NOT NULL,
        hunger REAL NOT NULL,
        happiness REAL NOT NULL,
        energy REAL NOT NULL,
        warmth REAL NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        source_key TEXT,
        rarity TEXT NOT NULL DEFAULT 'common',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_cared_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory (
        owner_id TEXT NOT NULL,
        item_key TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        item_type TEXT NOT NULL,
        PRIMARY KEY (owner_id, item_key)
      );

      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        event_channel_id TEXT,
        events_enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_state (
        guild_id TEXT PRIMARY KEY,
        event_type TEXT,
        starts_at INTEGER,
        ends_at INTEGER,
        last_roll_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS shop_items (
        item_key TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        effect_json TEXT NOT NULL,
        plushie_type TEXT,
        rarity TEXT NOT NULL,
        emoji TEXT NOT NULL
      );
    `);
  }

  seedShopItems() {
    const insert = this.db.prepare(`
      INSERT INTO shop_items (
        item_key, name, description, category, price, item_type, effect_json, plushie_type, rarity, emoji
      ) VALUES (
        @item_key, @name, @description, @category, @price, @item_type, @effect_json, @plushie_type, @rarity, @emoji
      )
      ON CONFLICT(item_key) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        category = excluded.category,
        price = excluded.price,
        item_type = excluded.item_type,
        effect_json = excluded.effect_json,
        plushie_type = excluded.plushie_type,
        rarity = excluded.rarity,
        emoji = excluded.emoji
    `);

    const transaction = this.db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
    });

    transaction(SHOP_SEED_ITEMS);
  }

  getOrCreateUser(userId) {
    const existing = this.db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId);

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const user = {
      user_id: userId,
      balance: 120,
      last_daily_at: null,
      last_work_at: null,
      created_at: now,
      updated_at: now
    };

    this.db
      .prepare(`
        INSERT INTO users (user_id, balance, last_daily_at, last_work_at, created_at, updated_at)
        VALUES (@user_id, @balance, @last_daily_at, @last_work_at, @created_at, @updated_at)
      `)
      .run(user);

    return user;
  }

  updateUser(userId, fields) {
    const user = this.getOrCreateUser(userId);
    const updated = {
      ...user,
      ...fields,
      updated_at: Date.now()
    };

    this.db
      .prepare(`
        UPDATE users
        SET balance = @balance,
            last_daily_at = @last_daily_at,
            last_work_at = @last_work_at,
            updated_at = @updated_at
        WHERE user_id = @user_id
      `)
      .run(updated);

    return this.getOrCreateUser(userId);
  }

  addBalance(userId, amount) {
    const user = this.getOrCreateUser(userId);
    return this.updateUser(userId, { balance: user.balance + amount });
  }

  getShopItems(category) {
    if (!category) {
      return this.db.prepare("SELECT * FROM shop_items ORDER BY category, price ASC").all();
    }

    return this.db
      .prepare("SELECT * FROM shop_items WHERE category = ? ORDER BY price ASC")
      .all(category);
  }

  getShopItem(itemKey) {
    return this.db
      .prepare("SELECT * FROM shop_items WHERE item_key = ?")
      .get(itemKey);
  }

  getFoodInventory(ownerId) {
    return this.db.prepare(`
      SELECT inventory.*, shop_items.name, shop_items.description, shop_items.effect_json, shop_items.emoji
      FROM inventory
      INNER JOIN shop_items ON shop_items.item_key = inventory.item_key
      WHERE inventory.owner_id = ? AND inventory.quantity > 0 AND inventory.item_type = 'food'
      ORDER BY shop_items.price ASC
    `).all(ownerId);
  }

  getInventory(ownerId) {
    return this.db.prepare(`
      SELECT inventory.*, shop_items.name, shop_items.description, shop_items.category, shop_items.effect_json, shop_items.emoji, shop_items.rarity
      FROM inventory
      INNER JOIN shop_items ON shop_items.item_key = inventory.item_key
      WHERE inventory.owner_id = ? AND inventory.quantity > 0
      ORDER BY shop_items.category, shop_items.price ASC
    `).all(ownerId);
  }

  addInventoryItem(ownerId, itemKey, itemType, quantity = 1) {
    this.db
      .prepare(`
        INSERT INTO inventory (owner_id, item_key, quantity, item_type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(owner_id, item_key)
        DO UPDATE SET quantity = quantity + excluded.quantity
      `)
      .run(ownerId, itemKey, quantity, itemType);
  }

  consumeInventoryItem(ownerId, itemKey, quantity = 1) {
    const item = this.db
      .prepare("SELECT * FROM inventory WHERE owner_id = ? AND item_key = ?")
      .get(ownerId, itemKey);

    if (!item || item.quantity < quantity) {
      return false;
    }

    const nextQuantity = item.quantity - quantity;

    if (nextQuantity <= 0) {
      this.db
        .prepare("DELETE FROM inventory WHERE owner_id = ? AND item_key = ?")
        .run(ownerId, itemKey);
      return true;
    }

    this.db
      .prepare("UPDATE inventory SET quantity = ? WHERE owner_id = ? AND item_key = ?")
      .run(nextQuantity, ownerId, itemKey);

    return true;
  }

  createPlushie({ ownerId, name, type, personality, isActive, sourceKey = null, rarity = "common" }) {
    const now = Date.now();
    const plushie = {
      id: randomUUID(),
      owner_id: ownerId,
      name,
      type,
      personality,
      hunger: 86,
      happiness: 82,
      energy: 84,
      warmth: 88,
      is_active: isActive ? 1 : 0,
      source_key: sourceKey,
      rarity,
      created_at: now,
      updated_at: now,
      last_cared_at: now
    };

    if (isActive) {
      this.db
        .prepare("UPDATE plushies SET is_active = 0 WHERE owner_id = ?")
        .run(ownerId);
    }

    this.db
      .prepare(`
        INSERT INTO plushies (
          id, owner_id, name, type, personality, hunger, happiness, energy, warmth,
          is_active, source_key, rarity, created_at, updated_at, last_cared_at
        )
        VALUES (
          @id, @owner_id, @name, @type, @personality, @hunger, @happiness, @energy, @warmth,
          @is_active, @source_key, @rarity, @created_at, @updated_at, @last_cared_at
        )
      `)
      .run(plushie);

    return this.getPlushieById(plushie.id);
  }

  getPlushieById(plushieId) {
    return this.db.prepare("SELECT * FROM plushies WHERE id = ?").get(plushieId);
  }

  getActivePlushie(ownerId) {
    return this.db
      .prepare("SELECT * FROM plushies WHERE owner_id = ? AND is_active = 1 LIMIT 1")
      .get(ownerId);
  }

  getUserPlushies(ownerId) {
    return this.db
      .prepare("SELECT * FROM plushies WHERE owner_id = ? ORDER BY is_active DESC, created_at ASC")
      .all(ownerId);
  }

  hasOwnedSourceKey(ownerId, sourceKey) {
    return Boolean(
      this.db
        .prepare("SELECT id FROM plushies WHERE owner_id = ? AND source_key = ? LIMIT 1")
        .get(ownerId, sourceKey)
    );
  }

  updatePlushie(plushieId, fields) {
    const plushie = this.getPlushieById(plushieId);
    const updated = {
      ...plushie,
      ...fields,
      updated_at: fields.updated_at ?? Date.now()
    };

    this.db
      .prepare(`
        UPDATE plushies
        SET name = @name,
            type = @type,
            personality = @personality,
            hunger = @hunger,
            happiness = @happiness,
            energy = @energy,
            warmth = @warmth,
            is_active = @is_active,
            source_key = @source_key,
            rarity = @rarity,
            updated_at = @updated_at,
            last_cared_at = @last_cared_at
        WHERE id = @id
      `)
      .run(updated);

    return this.getPlushieById(plushieId);
  }

  setActivePlushie(ownerId, plushieId) {
    const plushie = this.getPlushieById(plushieId);

    if (!plushie || plushie.owner_id !== ownerId) {
      return null;
    }

    const transaction = this.db.transaction(() => {
      this.db.prepare("UPDATE plushies SET is_active = 0 WHERE owner_id = ?").run(ownerId);
      this.db.prepare("UPDATE plushies SET is_active = 1 WHERE id = ?").run(plushieId);
    });

    transaction();
    return this.getPlushieById(plushieId);
  }

  findUserPlushie(ownerId, query) {
    const lower = query.toLowerCase();
    return this.getUserPlushies(ownerId).find((plushie) => {
      return (
        plushie.id === query ||
        plushie.name.toLowerCase() === lower ||
        plushie.name.toLowerCase().includes(lower)
      );
    });
  }

  getOrCreateGuildSettings(guildId) {
    const existing = this.db
      .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
      .get(guildId);

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const settings = {
      guild_id: guildId,
      event_channel_id: null,
      events_enabled: 1,
      created_at: now,
      updated_at: now
    };

    this.db
      .prepare(`
        INSERT INTO guild_settings (guild_id, event_channel_id, events_enabled, created_at, updated_at)
        VALUES (@guild_id, @event_channel_id, @events_enabled, @created_at, @updated_at)
      `)
      .run(settings);

    return settings;
  }

  setEventChannel(guildId, channelId) {
    const settings = this.getOrCreateGuildSettings(guildId);
    this.db
      .prepare(`
        UPDATE guild_settings
        SET event_channel_id = ?, updated_at = ?
        WHERE guild_id = ?
      `)
      .run(channelId, Date.now(), guildId);

    return {
      ...settings,
      event_channel_id: channelId,
      updated_at: Date.now()
    };
  }

  getGuildsWithEventChannels() {
    return this.db
      .prepare(`
        SELECT * FROM guild_settings
        WHERE event_channel_id IS NOT NULL AND events_enabled = 1
      `)
      .all();
  }

  getEventState(guildId) {
    return this.db
      .prepare("SELECT * FROM event_state WHERE guild_id = ?")
      .get(guildId);
  }

  upsertEventState(guildId, fields) {
    const current = this.getEventState(guildId) || {
      guild_id: guildId,
      event_type: null,
      starts_at: null,
      ends_at: null,
      last_roll_at: null
    };

    const next = {
      ...current,
      ...fields
    };

    this.db
      .prepare(`
        INSERT INTO event_state (guild_id, event_type, starts_at, ends_at, last_roll_at)
        VALUES (@guild_id, @event_type, @starts_at, @ends_at, @last_roll_at)
        ON CONFLICT(guild_id) DO UPDATE SET
          event_type = excluded.event_type,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          last_roll_at = excluded.last_roll_at
      `)
      .run(next);

    return this.getEventState(guildId);
  }

  clearActiveEvent(guildId) {
    return this.upsertEventState(guildId, {
      event_type: null,
      starts_at: null,
      ends_at: null,
      last_roll_at: Date.now()
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  CozyDatabase
};

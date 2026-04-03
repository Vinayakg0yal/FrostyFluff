const STARTER_PLUSHIES = [
  { value: "polar bear", name: "Polar Bear", emoji: "🐻‍❄️" },
  { value: "penguin", name: "Penguin", emoji: "🐧" },
  { value: "snow bunny", name: "Snow Bunny", emoji: "🐇" },
  { value: "snow fox", name: "Snow Fox", emoji: "🦊" }
];

const PERSONALITIES = {
  playful: {
    label: "Playful",
    bonuses: { happiness: 4, energy: 2 }
  },
  clingy: {
    label: "Clingy",
    bonuses: { warmth: 5, happiness: 3 }
  },
  sleepy: {
    label: "Sleepy",
    bonuses: { energy: 6, happiness: -1 }
  },
  dramatic: {
    label: "Dramatic",
    bonuses: { happiness: 2, warmth: 2 }
  }
};

const STAT_LIMITS = {
  min: 0,
  max: 100
};

const STAT_DECAY_PER_HOUR = {
  hunger: 6,
  happiness: 2.5,
  energy: 4,
  warmth: 3.5
};

const ACTION_EFFECTS = {
  hug: { happiness: 18, warmth: 8, energy: -4, hunger: -2 },
  sleep: { energy: 32, warmth: 6, happiness: 6, hunger: -8 }
};

const COMMAND_COOLDOWNS = {
  adopt: 10_000,
  feed: 20_000,
  hug: 20_000,
  sleep: 30_000,
  status: 5_000,
  inventory: 5_000,
  shop: 5_000,
  buy: 5_000,
  balance: 5_000,
  swapplushie: 10_000
};

const DAILY_COOLDOWN_MS = 20 * 60 * 60 * 1000;
const WORK_COOLDOWN_MS = 60 * 60 * 1000;

const DAILY_REWARD_RANGE = {
  min: 140,
  max: 230
};

const JOBS = [
  {
    key: "snow_shoveling",
    name: "snow shoveling",
    intro: "You cleared fluffy walkways before sunrise.",
    rewardMin: 55,
    rewardMax: 95,
    weight: 30
  },
  {
    key: "snowman_building",
    name: "snowman building",
    intro: "You built a charming snow family in the town square.",
    rewardMin: 65,
    rewardMax: 110,
    weight: 24
  },
  {
    key: "cocoa_stand",
    name: "cocoa stand",
    intro: "You served steaming cocoa to chilly visitors.",
    rewardMin: 70,
    rewardMax: 120,
    weight: 20
  },
  {
    key: "lantern_polishing",
    name: "lantern polishing",
    intro: "You polished frost-lit lanterns until they glowed softly.",
    rewardMin: 60,
    rewardMax: 105,
    weight: 18
  },
  {
    key: "sled_tuning",
    name: "sled tuning",
    intro: "You tuned racing sleds for a snowy evening dash.",
    rewardMin: 75,
    rewardMax: 125,
    weight: 8
  }
];

const EVENT_DEFINITIONS = {
  blizzard: {
    name: "Blizzard Bonus",
    emoji: "🌨️",
    description: "A glittering blizzard rolled in. Work rewards are boosted for a while.",
    durationMinutes: [60, 100]
  },
  cozy_night: {
    name: "Cozy Night",
    emoji: "🕯️",
    description: "Lanterns are glowing and plushies feel extra cuddly. Happiness and warmth decay soften.",
    durationMinutes: [75, 120]
  },
  snow_festival: {
    name: "Snow Festival",
    emoji: "🎐",
    description: "A snow festival has begun. Work can drop special treats and comfy supplies.",
    durationMinutes: [60, 90]
  }
};

const SHOP_SEED_ITEMS = [
  {
    item_key: "starter_biscuits",
    name: "Starter Biscuits",
    description: "Soft little snowflake biscuits for daily plushie care.",
    category: "food",
    price: 20,
    item_type: "food",
    effect_json: JSON.stringify({ hunger: 16, happiness: 4 }),
    plushie_type: null,
    rarity: "common",
    emoji: "🍪"
  },
  {
    item_key: "cocoa_mochi",
    name: "Cocoa Mochi",
    description: "A sweet cocoa treat that melts into happy wiggles.",
    category: "food",
    price: 48,
    item_type: "food",
    effect_json: JSON.stringify({ hunger: 24, happiness: 10, warmth: 4 }),
    plushie_type: null,
    rarity: "uncommon",
    emoji: "🍫"
  },
  {
    item_key: "berry_soup",
    name: "Berry Soup",
    description: "Warm berry soup that fills tiny plush tummies.",
    category: "food",
    price: 64,
    item_type: "food",
    effect_json: JSON.stringify({ hunger: 30, warmth: 8, happiness: 6 }),
    plushie_type: null,
    rarity: "uncommon",
    emoji: "🥣"
  },
  {
    item_key: "aurora_scarf",
    name: "Aurora Scarf",
    description: "A glowing scarf that helps plushies stay warm longer.",
    category: "wearable",
    price: 115,
    item_type: "gear",
    effect_json: JSON.stringify({ warmthDecayMultiplier: 0.82 }),
    plushie_type: null,
    rarity: "rare",
    emoji: "🧣"
  },
  {
    item_key: "pocket_heater",
    name: "Pocket Heater",
    description: "A tiny enchanted heater that keeps the cozy vibes going.",
    category: "utility",
    price: 145,
    item_type: "gear",
    effect_json: JSON.stringify({ passiveWarmthPerHour: 1.25 }),
    plushie_type: null,
    rarity: "rare",
    emoji: "🔥"
  },
  {
    item_key: "starlit_blanket",
    name: "Starlit Blanket",
    description: "A plush blanket that makes naps sweeter and calmer.",
    category: "comfort",
    price: 135,
    item_type: "gear",
    effect_json: JSON.stringify({ passiveHappinessPerHour: 0.8, extraSleepEnergy: 8 }),
    plushie_type: null,
    rarity: "rare",
    emoji: "🛏️"
  },
  {
    item_key: "glacier_bear",
    name: "Glacier Bear",
    description: "A rare icy bear plushie with gentle midnight eyes.",
    category: "plushie",
    price: 480,
    item_type: "plushie",
    effect_json: JSON.stringify({}),
    plushie_type: "polar bear",
    rarity: "epic",
    emoji: "🧸"
  },
  {
    item_key: "crystal_penguin",
    name: "Crystal Penguin",
    description: "A gleaming penguin plushie that sparkles in snowlight.",
    category: "plushie",
    price: 450,
    item_type: "plushie",
    effect_json: JSON.stringify({}),
    plushie_type: "penguin",
    rarity: "epic",
    emoji: "🐧"
  },
  {
    item_key: "moon_bunny",
    name: "Moon Bunny",
    description: "A dreamy bunny plushie with silver-thread ears.",
    category: "plushie",
    price: 510,
    item_type: "plushie",
    effect_json: JSON.stringify({}),
    plushie_type: "snow bunny",
    rarity: "legendary",
    emoji: "🌙"
  },
  {
    item_key: "aurora_fox",
    name: "Aurora Fox",
    description: "A rare fox plushie wrapped in northern lights.",
    category: "plushie",
    price: 540,
    item_type: "plushie",
    effect_json: JSON.stringify({}),
    plushie_type: "snow fox",
    rarity: "legendary",
    emoji: "🦊"
  }
];

module.exports = {
  STARTER_PLUSHIES,
  PERSONALITIES,
  STAT_LIMITS,
  STAT_DECAY_PER_HOUR,
  ACTION_EFFECTS,
  COMMAND_COOLDOWNS,
  DAILY_COOLDOWN_MS,
  WORK_COOLDOWN_MS,
  DAILY_REWARD_RANGE,
  JOBS,
  EVENT_DEFINITIONS,
  SHOP_SEED_ITEMS
};

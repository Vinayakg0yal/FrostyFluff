function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedPick(entries) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = Math.random() * totalWeight;
  let running = 0;

  for (const entry of entries) {
    running += entry.weight;
    if (roll <= running) {
      return entry;
    }
  }

  return entries[entries.length - 1];
}

function titleCase(value) {
  return value
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

module.exports = {
  clamp,
  randomInt,
  pickRandom,
  weightedPick,
  titleCase
};

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (hours === 0 && seconds > 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ") || "0s";
}

function getRemainingCooldown(lastTimestamp, cooldownMs) {
  if (!lastTimestamp) {
    return 0;
  }

  const remaining = lastTimestamp + cooldownMs - Date.now();
  return Math.max(0, remaining);
}

module.exports = {
  formatDuration,
  getRemainingCooldown
};

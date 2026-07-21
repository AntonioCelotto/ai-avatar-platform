const navItems = [
  ["Home", "⌂"],
  ["AI Team", "◉"],
  ["Knowledge Hub", "◇"],
  ["Identity", "✦"],
  ["Brain", "⬡"],
  ["Emotions", "♡"],
  ["Voice Studio", "◖"],
  ["AI Builder", "✧"],
  ["Deploy", "↑"],
  ["Analytics", "↗"],
  ["Store", "▦"],
  ["Settings", "⚙"]
];

function statusLabel(status) {
  if (status === "active") return "Live";
  if (status === "draft") return "Draft";
  if (status === "paused") return "Paused";
  return "Offline"
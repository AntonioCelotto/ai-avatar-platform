const navigation = [
  ["Home", "⌂", "#home"],
  ["AI Team", "◉", "#ai-team"],
  ["Knowledge Hub", "◇", "#knowledge"],
  ["Identity", "✦", "#identity"],
  ["Brain", "◎", "#brain"],
  ["Emotions", "♡", "#emotions"],
  ["Voices", "◌", "#voices"],
  ["Deploy", "↗", "#deploy"],
  ["Analytics", "⌁", "#analytics"],
  ["Marketplace", "▦", "#marketplace"]
];

export default function AppShell({ children }) {
  return (
    <main className="a1-shell">
      <aside className="a1-sidebar">
        <div className="a1-brand">
          <span className="a1-brand-mark">A
// Stable, varied avatar background colors for photo-less staff/branch/user
// tiles — hashed on id (not name, which can collide or change) so a given
// person always lands on the same color. No yellow/gold, matching the rest
// of the app's banned-accent-color rule.
const AVATAR_COLORS = [
  "oklch(58% 0.18 300)", // purple
  "oklch(62% 0.13 195)", // turquoise
  "oklch(60% 0.14 140)", // olive green
  "oklch(60% 0.19 20)", // deep pink
  "oklch(58% 0.17 260)", // blue
];

export function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

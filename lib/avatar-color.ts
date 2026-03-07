/**
 * Hash a string to a hue (0–360) for consistent avatar background color per name.
 */
export function nameToHue(name: string | null | undefined): number {
  if (!name || typeof name !== "string") return 220;
  let h = 0;
  const s = name.trim();
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/**
 * HSL string for avatar background: medium saturation and lightness for readability with white text.
 */
export function nameToAvatarBg(name: string | null | undefined): string {
  const hue = nameToHue(name);
  return `hsl(${hue}, 55%, 42%)`;
}

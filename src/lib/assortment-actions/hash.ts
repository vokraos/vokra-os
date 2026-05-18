export function stableActionId(parts: readonly string[]): string {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `aa_${(h >>> 0).toString(36)}`;
}

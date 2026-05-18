export function newMemoryId(prefix: "proj" | "sku" | "gen" | "vis"): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${t}_${r}`;
}

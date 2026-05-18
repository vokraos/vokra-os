/** Contrast / separation pressure from pasted color + lighting language. */
export function scoreContrastStrength(blob: string): number {
  const s = blob.toLowerCase();
  if (/muddy|слив|низк.*контраст|low\s*contrast|washed|выцвет/i.test(s)) return 36;
  if (/high\s*contrast|сильн.*контраст|rim\s*light|edge\s*light|cinematic\s*light|dramatic\s*light/i.test(s)) return 86;
  if (/dark|cinematic|ночн|chiaroscuro|глубок/i.test(s)) return 76;
  if (/pastel|пастел|soft\s*light/i.test(s)) return 52;
  return 58;
}

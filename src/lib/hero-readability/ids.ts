export function newHeroReadabilityIntelligenceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `hri_${crypto.randomUUID()}`;
  return `hri_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

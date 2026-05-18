export function newHeroFatigueIntelligenceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `hfi_${crypto.randomUUID()}`;
  return `hfi_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

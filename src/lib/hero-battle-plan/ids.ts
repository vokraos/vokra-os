export function newHeroBattlePlanId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `hbp_${crypto.randomUUID()}`;
  return `hbp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

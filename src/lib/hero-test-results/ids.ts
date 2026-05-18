export function newHeroTestResultId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `htr-${crypto.randomUUID()}`;
  return `htr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

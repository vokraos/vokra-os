export function newHeroTestMatrixId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `htm-${crypto.randomUUID()}`;
  return `htm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newHeroTestVariantId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `htv-${crypto.randomUUID()}`;
  return `htv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

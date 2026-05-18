export function newHeroPostLaunchObservationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `hplo-${crypto.randomUUID()}`;
  return `hplo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

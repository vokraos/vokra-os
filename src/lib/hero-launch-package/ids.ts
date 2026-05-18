export function newHeroLaunchPackageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `hlp-${crypto.randomUUID()}`;
  return `hlp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function resultBundleId(matrixId: string, bundleUpdatedAt: number): string {
  return `htrb-${matrixId}-${bundleUpdatedAt}`;
}

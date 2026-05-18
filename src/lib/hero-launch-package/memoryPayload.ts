import { HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA, type HeroLaunchPackageMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseHeroLaunchPackageMemoryPayload(raw: string): HeroLaunchPackageMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!isRecord(o) || o.schema !== HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA || !isRecord(o.package)) return null;
    if (typeof (o.package as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA,
      savedAt,
      package: o.package as HeroLaunchPackageMemoryPayload["package"],
      matrix: (o.matrix as HeroLaunchPackageMemoryPayload["matrix"]) ?? undefined,
      resultsBundle: (o.resultsBundle as HeroLaunchPackageMemoryPayload["resultsBundle"]) ?? undefined,
      serpEnvelope: (o.serpEnvelope as HeroLaunchPackageMemoryPayload["serpEnvelope"]) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroLaunchPackageMemoryPayload(
  pkg: HeroLaunchPackageMemoryPayload["package"],
  matrix: HeroLaunchPackageMemoryPayload["matrix"],
  resultsBundle: HeroLaunchPackageMemoryPayload["resultsBundle"],
  serpEnvelope: HeroLaunchPackageMemoryPayload["serpEnvelope"],
): HeroLaunchPackageMemoryPayload {
  return {
    schema: HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    package: pkg,
    matrix: matrix ?? undefined,
    resultsBundle: resultsBundle ?? undefined,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}

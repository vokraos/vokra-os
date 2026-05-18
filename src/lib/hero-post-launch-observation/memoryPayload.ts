import { HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA, type HeroPostLaunchObservationMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseHeroPostLaunchObservationMemoryPayload(raw: string): HeroPostLaunchObservationMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!isRecord(o) || o.schema !== HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA || !isRecord(o.observation))
      return null;
    if (typeof (o.observation as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA,
      savedAt,
      observation: o.observation as HeroPostLaunchObservationMemoryPayload["observation"],
      launchPackage: (o.launchPackage as HeroPostLaunchObservationMemoryPayload["launchPackage"]) ?? undefined,
      matrix: (o.matrix as HeroPostLaunchObservationMemoryPayload["matrix"]) ?? undefined,
      resultsBundle: (o.resultsBundle as HeroPostLaunchObservationMemoryPayload["resultsBundle"]) ?? undefined,
      serpEnvelope: (o.serpEnvelope as HeroPostLaunchObservationMemoryPayload["serpEnvelope"]) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroPostLaunchObservationMemoryPayload(
  observation: HeroPostLaunchObservationMemoryPayload["observation"],
  launchPackage: HeroPostLaunchObservationMemoryPayload["launchPackage"],
  matrix: HeroPostLaunchObservationMemoryPayload["matrix"],
  resultsBundle: HeroPostLaunchObservationMemoryPayload["resultsBundle"],
  serpEnvelope: HeroPostLaunchObservationMemoryPayload["serpEnvelope"],
): HeroPostLaunchObservationMemoryPayload {
  return {
    schema: HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA,
    savedAt: Date.now(),
    observation,
    launchPackage: launchPackage ?? undefined,
    matrix: matrix ?? undefined,
    resultsBundle: resultsBundle ?? undefined,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}

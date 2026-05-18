import { calculateUnitEconomics } from "./calculate";
import type { MarginPressureLevel, UnitEconomicsMatchContext, UnitEconomicsProfile, UnitEconomicsProfileRow } from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function fieldMatches(profileValue: string, ctxValue: string | undefined): boolean {
  const p = norm(profileValue);
  if (!p) return true;
  const c = norm(ctxValue);
  if (!c) return false;
  return p === c || c.includes(p) || p.includes(c);
}

export function scoreProfileMatch(profile: UnitEconomicsProfile, ctx: UnitEconomicsMatchContext): number {
  let score = 0;
  if (fieldMatches(profile.corridor, ctx.corridor)) score += profile.corridor.trim() ? 4 : 0;
  else return -1;
  if (fieldMatches(profile.productFamily, ctx.productFamily)) score += profile.productFamily.trim() ? 3 : 0;
  else return -1;
  if (fieldMatches(profile.marketplace, ctx.marketplace)) score += profile.marketplace.trim() ? 2 : 0;
  else return -1;
  if (fieldMatches(profile.stockMode, ctx.stockMode)) score += profile.stockMode.trim() ? 2 : 0;
  else return -1;
  return score;
}

export function findBestUnitEconomicsProfile(
  profiles: UnitEconomicsProfile[],
  ctx: UnitEconomicsMatchContext,
): UnitEconomicsProfileRow | null {
  let best: { row: UnitEconomicsProfileRow; score: number } | null = null;
  for (const profile of profiles) {
    const score = scoreProfileMatch(profile, ctx);
    if (score < 0) continue;
    const row: UnitEconomicsProfileRow = { profile, calculated: calculateUnitEconomics(profile) };
    if (!best || score > best.score) best = { row, score };
  }
  return best?.row ?? null;
}

export function listProfilesByPressure(
  profiles: UnitEconomicsProfile[],
  levels: MarginPressureLevel[],
): UnitEconomicsProfileRow[] {
  return profiles
    .map((profile) => ({ profile, calculated: calculateUnitEconomics(profile) }))
    .filter((r) => levels.includes(r.calculated.marginPressureLevel))
    .sort(
      (a, b) =>
        pressureSort(b.calculated.marginPressureLevel) - pressureSort(a.calculated.marginPressureLevel),
    );
}

function pressureSort(level: MarginPressureLevel): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "acceptable") return 2;
  return 1;
}

export function profileLabel(profile: UnitEconomicsProfile): string {
  const parts = [profile.name || profile.corridor, profile.stockMode, profile.marketplace].filter(Boolean);
  return parts.join(" / ") || profile.id;
}

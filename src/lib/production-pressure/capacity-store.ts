import { lsGet, lsSet } from "../storage";
import type { CapacityProfilesState, ProductionCapacityProfile } from "./capacity-types";
import { createStarterCapacityProfile } from "./starter-profile";

export const PRODUCTION_CAPACITY_STORAGE_KEY = "vokra.productionCapacity.profiles.v1" as const;

export function newCapacityProfileId(): string {
  return `pcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampNonNeg(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function parseProfile(raw: unknown): ProductionCapacityProfile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.name !== "string") return null;
  const num = (k: string) => clampNonNeg(Number(p[k]));
  const safeMax = (safeK: string, maxK: string) => {
    const safe = num(safeK);
    const max = Math.max(safe, num(maxK));
    return { safe, max };
  };
  const launches = safeMax("safeConcurrentLaunches", "maxConcurrentLaunches");
  const refresh = safeMax("safeDailyRefreshes", "maxDailyRefreshes");
  const fbo = safeMax("safeFboPrepTasks", "maxFboPrepTasks");
  const visual = safeMax("safeVisualJobs", "maxVisualJobs");
  const card = safeMax("safeCardJobs", "maxCardJobs");
  const pack = safeMax("safePackagingLoad", "maxPackagingLoad");
  const blocked = safeMax("safeBlockedTasks", "maxBlockedTasks");
  return {
    id: p.id,
    name: p.name.trim() || "Profile",
    active: p.active === true,
    teamSize: num("teamSize"),
    printersAvailable: num("printersAvailable"),
    pressOperators: num("pressOperators"),
    packers: num("packers"),
    shiftHours: num("shiftHours"),
    safeConcurrentLaunches: launches.safe,
    maxConcurrentLaunches: launches.max,
    safeDailyRefreshes: refresh.safe,
    maxDailyRefreshes: refresh.max,
    safeFboPrepTasks: fbo.safe,
    maxFboPrepTasks: fbo.max,
    safeVisualJobs: visual.safe,
    maxVisualJobs: visual.max,
    safeCardJobs: card.safe,
    maxCardJobs: card.max,
    safePackagingLoad: pack.safe,
    maxPackagingLoad: pack.max,
    safeBlockedTasks: blocked.safe,
    maxBlockedTasks: blocked.max,
    notes: typeof p.notes === "string" ? p.notes : "",
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
  };
}

export function loadCapacityProfilesState(): CapacityProfilesState {
  try {
    const raw = lsGet(PRODUCTION_CAPACITY_STORAGE_KEY);
    if (!raw) return { profiles: [], activeProfileId: null };
    const o = JSON.parse(raw) as { profiles?: unknown[]; activeProfileId?: string | null };
    const profiles = (o.profiles ?? []).map(parseProfile).filter((p): p is ProductionCapacityProfile => p !== null);
    const activeProfileId =
      typeof o.activeProfileId === "string" && profiles.some((p) => p.id === o.activeProfileId)
        ? o.activeProfileId
        : profiles.find((p) => p.active)?.id ?? profiles[0]?.id ?? null;
    return { profiles, activeProfileId };
  } catch {
    return { profiles: [], activeProfileId: null };
  }
}

export function saveCapacityProfilesState(state: CapacityProfilesState): void {
  lsSet(PRODUCTION_CAPACITY_STORAGE_KEY, JSON.stringify(state));
}

export function getActiveCapacityProfile(): ProductionCapacityProfile | null {
  const state = loadCapacityProfilesState();
  if (!state.activeProfileId) return null;
  return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
}

export function upsertCapacityProfile(profile: ProductionCapacityProfile): CapacityProfilesState {
  const state = loadCapacityProfilesState();
  const idx = state.profiles.findIndex((p) => p.id === profile.id);
  const next = { ...profile, updatedAt: Date.now() };
  const profiles =
    idx >= 0 ? state.profiles.map((p, i) => (i === idx ? next : p)) : [...state.profiles, next];
  const activeProfileId = state.activeProfileId ?? (next.active ? next.id : profiles[0]?.id ?? null);
  const out = { profiles, activeProfileId };
  saveCapacityProfilesState(out);
  return out;
}

export function setActiveCapacityProfile(id: string): CapacityProfilesState {
  const state = loadCapacityProfilesState();
  if (!state.profiles.some((p) => p.id === id)) return state;
  const profiles = state.profiles.map((p) => ({ ...p, active: p.id === id }));
  const out = { profiles, activeProfileId: id };
  saveCapacityProfilesState(out);
  return out;
}

export function deleteCapacityProfile(id: string): CapacityProfilesState {
  const state = loadCapacityProfilesState();
  const profiles = state.profiles.filter((p) => p.id !== id);
  let activeProfileId = state.activeProfileId;
  if (activeProfileId === id) activeProfileId = profiles[0]?.id ?? null;
  const out = {
    profiles: profiles.map((p) => ({ ...p, active: p.id === activeProfileId })),
    activeProfileId,
  };
  saveCapacityProfilesState(out);
  return out;
}

export function duplicateCapacityProfile(id: string): ProductionCapacityProfile | null {
  const state = loadCapacityProfilesState();
  const src = state.profiles.find((p) => p.id === id);
  if (!src) return null;
  const now = Date.now();
  const copy: ProductionCapacityProfile = {
    ...src,
    id: newCapacityProfileId(),
    name: `${src.name} (copy)`,
    active: false,
    createdAt: now,
    updatedAt: now,
  };
  upsertCapacityProfile(copy);
  return copy;
}

export function resetCapacityProfilesToStarter(): CapacityProfilesState {
  const starter = createStarterCapacityProfile();
  const out = { profiles: [starter], activeProfileId: starter.id };
  saveCapacityProfilesState(out);
  return out;
}

export function restoreCapacityProfilesFromMemory(
  profiles: ProductionCapacityProfile[],
  activeProfileId: string | null,
): void {
  const parsed = profiles.map(parseProfile).filter((p): p is ProductionCapacityProfile => p !== null);
  const active =
    activeProfileId && parsed.some((p) => p.id === activeProfileId) ? activeProfileId : parsed[0]?.id ?? null;
  saveCapacityProfilesState({
    profiles: parsed.map((p) => ({ ...p, active: p.id === active })),
    activeProfileId: active,
  });
}

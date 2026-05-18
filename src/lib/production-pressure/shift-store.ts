import { lsGet, lsSet } from "../storage";
import type { ProductionShiftScenario, ShiftScenariosState, ShiftScenarioType } from "./capacity-types";
import { presetMultipliersForType } from "./scenario-presets";
import { loadCapacityProfilesState } from "./capacity-store";

export const PRODUCTION_SHIFT_STORAGE_KEY = "vokra.productionShift.scenarios.v1" as const;

export function newShiftScenarioId(): string {
  return `pss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseMultipliers(raw: unknown): ProductionShiftScenario["capacityMultipliers"] {
  if (typeof raw !== "object" || raw === null) return {};
  return raw as ProductionShiftScenario["capacityMultipliers"];
}

function parseOverrides(raw: unknown): ProductionShiftScenario["safeOverrides"] {
  if (typeof raw !== "object" || raw === null) return {};
  return raw as ProductionShiftScenario["safeOverrides"];
}

const SCENARIO_TYPES: ShiftScenarioType[] = [
  "small_shift",
  "normal_shift",
  "strong_shift",
  "weekend_catchup",
  "launch_day",
  "fbo_prep_day",
  "visual_content_day",
];

function parseScenario(raw: unknown): ProductionShiftScenario | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.name !== "string") return null;
  const scenarioType = SCENARIO_TYPES.includes(p.scenarioType as ShiftScenarioType)
    ? (p.scenarioType as ShiftScenarioType)
    : "normal_shift";
  const nullableNum = (k: string): number | null => {
    if (p[k] === null || p[k] === undefined) return null;
    const n = Number(p[k]);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  };
  return {
    id: p.id,
    name: p.name.trim() || "Scenario",
    active: p.active === true,
    baseCapacityProfileId:
      typeof p.baseCapacityProfileId === "string" ? p.baseCapacityProfileId : null,
    scenarioType,
    teamSize: nullableNum("teamSize"),
    printerCount: nullableNum("printerCount"),
    pressOperators: nullableNum("pressOperators"),
    packers: nullableNum("packers"),
    extraHelpers: Math.max(0, Math.round(Number(p.extraHelpers) || 0)),
    shiftHours: nullableNum("shiftHours"),
    capacityMultipliers: parseMultipliers(p.capacityMultipliers),
    safeOverrides: parseOverrides(p.safeOverrides),
    maxOverrides: parseOverrides(p.maxOverrides),
    notes: typeof p.notes === "string" ? p.notes : "",
    createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
  };
}

export function loadShiftScenariosState(): ShiftScenariosState {
  try {
    const raw = lsGet(PRODUCTION_SHIFT_STORAGE_KEY);
    if (!raw) return { scenarios: [], activeScenarioId: null };
    const o = JSON.parse(raw) as { scenarios?: unknown[]; activeScenarioId?: string | null };
    const scenarios = (o.scenarios ?? [])
      .map(parseScenario)
      .filter((s): s is ProductionShiftScenario => s !== null);
    const activeScenarioId =
      typeof o.activeScenarioId === "string" && scenarios.some((s) => s.id === o.activeScenarioId)
        ? o.activeScenarioId
        : scenarios.find((s) => s.active)?.id ?? scenarios[0]?.id ?? null;
    return { scenarios, activeScenarioId };
  } catch {
    return { scenarios: [], activeScenarioId: null };
  }
}

export function saveShiftScenariosState(state: ShiftScenariosState): void {
  lsSet(PRODUCTION_SHIFT_STORAGE_KEY, JSON.stringify(state));
}

export function getActiveShiftScenario(): ProductionShiftScenario | null {
  const state = loadShiftScenariosState();
  if (!state.activeScenarioId) return null;
  return state.scenarios.find((s) => s.id === state.activeScenarioId) ?? null;
}

export function resolveBaseProfileForScenario(scenario: ProductionShiftScenario | null) {
  const capState = loadCapacityProfilesState();
  if (scenario?.baseCapacityProfileId) {
    const linked = capState.profiles.find((p) => p.id === scenario.baseCapacityProfileId);
    if (linked) return linked;
  }
  if (capState.activeProfileId) {
    return capState.profiles.find((p) => p.id === capState.activeProfileId) ?? null;
  }
  return capState.profiles[0] ?? null;
}

export function upsertShiftScenario(scenario: ProductionShiftScenario): ShiftScenariosState {
  const state = loadShiftScenariosState();
  const idx = state.scenarios.findIndex((s) => s.id === scenario.id);
  const next = { ...scenario, updatedAt: Date.now() };
  const scenarios =
    idx >= 0 ? state.scenarios.map((s, i) => (i === idx ? next : s)) : [...state.scenarios, next];
  const activeScenarioId = state.activeScenarioId ?? (next.active ? next.id : scenarios[0]?.id ?? null);
  const out = { scenarios, activeScenarioId };
  saveShiftScenariosState(out);
  return out;
}

export function setActiveShiftScenario(id: string): ShiftScenariosState {
  const state = loadShiftScenariosState();
  if (!state.scenarios.some((s) => s.id === id)) return state;
  const scenarios = state.scenarios.map((s) => ({ ...s, active: s.id === id }));
  const out = { scenarios, activeScenarioId: id };
  saveShiftScenariosState(out);
  return out;
}

export function deleteShiftScenario(id: string): ShiftScenariosState {
  const state = loadShiftScenariosState();
  const scenarios = state.scenarios.filter((s) => s.id !== id);
  let activeScenarioId = state.activeScenarioId;
  if (activeScenarioId === id) activeScenarioId = scenarios[0]?.id ?? null;
  const out = {
    scenarios: scenarios.map((s) => ({ ...s, active: s.id === activeScenarioId })),
    activeScenarioId,
  };
  saveShiftScenariosState(out);
  return out;
}

export function duplicateShiftScenario(id: string): ProductionShiftScenario | null {
  const state = loadShiftScenariosState();
  const src = state.scenarios.find((s) => s.id === id);
  if (!src) return null;
  const now = Date.now();
  const copy: ProductionShiftScenario = {
    ...src,
    id: newShiftScenarioId(),
    name: `${src.name} (copy)`,
    active: false,
    capacityMultipliers: { ...src.capacityMultipliers },
    safeOverrides: { ...src.safeOverrides },
    maxOverrides: { ...src.maxOverrides },
    createdAt: now,
    updatedAt: now,
  };
  upsertShiftScenario(copy);
  return copy;
}

export function createShiftScenarioFromType(
  type: ShiftScenarioType,
  name: string,
  baseProfileId: string | null,
): ProductionShiftScenario {
  const now = Date.now();
  return {
    id: newShiftScenarioId(),
    name,
    active: false,
    baseCapacityProfileId: baseProfileId,
    scenarioType: type,
    teamSize: null,
    printerCount: null,
    pressOperators: null,
    packers: null,
    extraHelpers: 0,
    shiftHours: null,
    capacityMultipliers: presetMultipliersForType(type),
    safeOverrides: {},
    maxOverrides: {},
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function restoreShiftScenariosFromMemory(
  scenarios: ProductionShiftScenario[],
  activeScenarioId: string | null,
): void {
  const parsed = scenarios
    .map((s) => parseScenario(s))
    .filter((s): s is ProductionShiftScenario => s !== null);
  const active =
    activeScenarioId && parsed.some((s) => s.id === activeScenarioId)
      ? activeScenarioId
      : parsed[0]?.id ?? null;
  saveShiftScenariosState({
    scenarios: parsed.map((s) => ({ ...s, active: s.id === active })),
    activeScenarioId: active,
  });
}
